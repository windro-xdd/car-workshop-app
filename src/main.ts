import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePDF, savePDFToFile } from './renderer/utils/pdfGenerator';

// Declare webpack entry points injected by Electron Forge
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

// Dev: prisma/data/workshop.db relative to project root
// Packaged: userData/workshop.db (copied from extraResource on first launch)
function getDbPath(): string {
  if (app.isPackaged) {
    return path.join(app.getPath('userData'), 'workshop.db');
  }
  return path.join(app.getAppPath(), 'prisma', 'data', 'workshop.db');
}

function getSeedDbPath(): string {
  return path.join(process.resourcesPath, 'workshop.db');
}

function ensureDatabase(): void {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) {
    if (app.isPackaged) {
      const seedPath = getSeedDbPath();
      if (fs.existsSync(seedPath)) {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        fs.copyFileSync(seedPath, dbPath);
      }
    } else {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    }
  }
}

ensureDatabase();

// Runtime database migrations for packaged app
// Prisma migrations don't run in production, so we apply schema changes manually
function migrateDatabase(): void {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) return;

  try {
    // Use better-sqlite3 directly to check and apply schema changes
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);

    // Check if 'isActive' column exists on 'items' table
    const itemColumns = db.pragma('table_info(items)') as { name: string }[];
    const hasIsActive = itemColumns.some((col: { name: string }) => col.name === 'isActive');

    if (!hasIsActive) {
      console.log('Migrating database: adding isActive column to items table');
      db.exec(`
        PRAGMA foreign_keys=OFF;
        CREATE TABLE "new_items" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "code" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "category" TEXT NOT NULL,
            "unitPrice" REAL NOT NULL,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL
        );
        INSERT INTO "new_items" ("category", "code", "createdAt", "id", "name", "unitPrice", "updatedAt")
          SELECT "category", "code", "createdAt", "id", "name", "unitPrice", "updatedAt" FROM "items";
        DROP TABLE "items";
        ALTER TABLE "new_items" RENAME TO "items";
        CREATE UNIQUE INDEX "items_code_key" ON "items"("code");
        PRAGMA foreign_key_check;
        PRAGMA foreign_keys=ON;
      `);
      console.log('Migration complete: isActive column added to items table');
    }

    // Check if 'users' table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
    if (tables.length === 0) {
      console.log('Migrating database: creating users table');
      db.exec(`
        CREATE TABLE "users" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "email" TEXT NOT NULL,
            "password" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT 'staff',
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL
        );
        CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
      `);
      console.log('Migration complete: users table created');
    }

    // Check if 'userId' column exists on 'invoices' table
    const invoiceColumns = db.pragma('table_info(invoices)') as { name: string }[];
    const hasUserId = invoiceColumns.some((col: { name: string }) => col.name === 'userId');

    if (!hasUserId) {
      console.log('Migrating database: adding userId column to invoices table');
      db.exec(`
        PRAGMA foreign_keys=OFF;
        CREATE TABLE "new_invoices" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "invoiceNumber" TEXT NOT NULL,
            "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "customerName" TEXT NOT NULL,
            "customerPhone" TEXT,
            "customerEmail" TEXT,
            "grossAmount" REAL NOT NULL DEFAULT 0,
            "gstAmount" REAL NOT NULL DEFAULT 0,
            "netTotal" REAL NOT NULL DEFAULT 0,
            "gstPercentage" REAL NOT NULL DEFAULT 18.0,
            "status" TEXT NOT NULL DEFAULT 'Draft',
            "isAmendment" BOOLEAN NOT NULL DEFAULT false,
            "originalInvoiceId" TEXT,
            "notes" TEXT,
            "userId" TEXT NOT NULL DEFAULT '',
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL,
            CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );
        INSERT INTO "new_invoices" ("createdAt", "customerEmail", "customerName", "customerPhone", "grossAmount", "gstAmount", "gstPercentage", "id", "invoiceDate", "invoiceNumber", "isAmendment", "netTotal", "notes", "originalInvoiceId", "status", "updatedAt")
          SELECT "createdAt", "customerEmail", "customerName", "customerPhone", "grossAmount", "gstAmount", "gstPercentage", "id", "invoiceDate", "invoiceNumber", "isAmendment", "netTotal", "notes", "originalInvoiceId", "status", "updatedAt" FROM "invoices";
        DROP TABLE "invoices";
        ALTER TABLE "new_invoices" RENAME TO "invoices";
        CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
        PRAGMA foreign_key_check;
        PRAGMA foreign_keys=ON;
      `);
      console.log('Migration complete: userId column added to invoices table');
    }

    // Check if 'vehicleNumber' column exists on 'invoices' table
    const invoiceColsForVehicle = db.pragma('table_info(invoices)') as { name: string }[];
    const hasVehicleNumber = invoiceColsForVehicle.some((col: { name: string }) => col.name === 'vehicleNumber');
    if (!hasVehicleNumber) {
      console.log('Migrating database: adding vehicle columns to invoices table');
      db.exec(`
        ALTER TABLE "invoices" ADD COLUMN "vehicleNumber" TEXT;
        ALTER TABLE "invoices" ADD COLUMN "vehicleModel" TEXT;
      `);
      console.log('Migration complete: vehicle columns added');
    }

    // Check if 'remarks' column exists on 'line_items' table
    const lineItemColumns = db.pragma('table_info(line_items)') as { name: string }[];
    const hasRemarks = lineItemColumns.some((col: { name: string }) => col.name === 'remarks');
    if (!hasRemarks) {
      console.log('Migrating database: adding remarks column to line_items table');
      db.exec(`ALTER TABLE "line_items" ADD COLUMN "remarks" TEXT;`);
      console.log('Migration complete: remarks column added to line_items table');
    }

    // Check if 'business_config' table exists
    const bizTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='business_config'").all();
    if (bizTables.length === 0) {
      console.log('Migrating database: creating business_config table');
      db.exec(`
        CREATE TABLE "business_config" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "gstin" TEXT NOT NULL DEFAULT '',
            "logoPath" TEXT NOT NULL DEFAULT '',
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL
        );
      `);
      console.log('Migration complete: business_config table created');
    }

    db.close();
  } catch (error) {
    console.error('Database migration error:', error);
  }
}

migrateDatabase();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${getDbPath()}`,
    },
  },
});

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  const iconPath = path.join(app.getAppPath(), 'assets', 'kripa-logo.ico');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await prisma.$disconnect();
});

ipcMain.handle('get-items', async () => {
  try {
    const items = await prisma.item.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: items };
  } catch (error) {
    console.error('Error fetching items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('create-item', async (_event, data) => {
  try {
    const item = await prisma.item.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        unitPrice: data.unitPrice,
        isActive: data.isActive ?? true,
      },
    });
    return { success: true, data: item };
  } catch (error) {
    console.error('Error creating item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('update-item', async (_event, data) => {
  try {
    const item = await prisma.item.update({
      where: { id: data.id },
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        unitPrice: data.unitPrice,
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return { success: true, data: item };
  } catch (error) {
    console.error('Error updating item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('delete-item', async (_event, id: string) => {
  try {
    // Instead of deleting, mark as inactive to avoid foreign key constraint issues
    await prisma.item.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting item:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('bulk-import-items', async (_event, data: { items: any[], filePath: string }) => {
  try {
    const { items } = data;
    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (!item.code || !item.name || !item.category || item.unitPrice === undefined) {
          throw new Error(`Row ${i + 1}: Missing required fields (code, name, category, unitPrice)`);
        }

        const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
        if (isNaN(unitPrice) || unitPrice < 0) {
          throw new Error(`Row ${i + 1}: Invalid unit price`);
        }

        await prisma.item.create({
          data: {
            code: String(item.code).trim(),
            name: String(item.name).trim(),
            category: String(item.category).trim(),
            unitPrice: Number(unitPrice),
          },
        });
        results.success++;
      } catch (itemError) {
        results.failed++;
        results.errors.push(itemError instanceof Error ? itemError.message : 'Unknown error');
      }
    }

    return { success: true, data: results };
  } catch (error) {
    console.error('Error bulk importing items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('get-invoices', async () => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { lineItems: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: invoices };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('create-invoice', async (_event, data) => {
   try {
     const invoice = await prisma.invoice.create({
       data: {
         invoiceNumber: data.invoiceNumber,
         invoiceDate: new Date(data.invoiceDate),
         customerName: data.customerName,
         customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          vehicleNumber: data.vehicleNumber,
          vehicleModel: data.vehicleModel,
          grossAmount: data.grossAmount,
          gstAmount: data.gstAmount,
          netTotal: data.netTotal,
          gstPercentage: data.gstPercentage,
          status: data.status || 'Final',
          isAmendment: data.isAmendment || false,
          userId: data.userId,
         lineItems: {
           create: data.lineItems.map((line: any) => ({
             itemId: line.itemId,
             quantity: line.quantity,
             unitPrice: line.unitPrice,
             lineTotal: line.quantity * line.unitPrice,
             ...(line.remarks ? { remarks: line.remarks } : {}),
           })),
         },
       },
       include: { lineItems: true },
     });
     return { success: true, data: invoice };
   } catch (error) {
     console.error('Error creating invoice:', error);
     return {
       success: false,
       error: error instanceof Error ? error.message : 'Unknown error',
     };
   }
 });

ipcMain.handle('delete-invoice', async (_event, id: string) => {
  try {
    await prisma.lineItem.deleteMany({
      where: { invoiceId: id },
    });
    await prisma.invoice.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('get-gst-config', async () => {
  try {
    const config = await prisma.gstConfig.findFirst();
    return {
      success: true,
      data: config || { rate: 18, isActive: true },
    };
  } catch (error) {
    console.error('Error fetching GST config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('update-gst-config', async (_event, data) => {
  try {
    const config = await prisma.gstConfig.upsert({
      where: { id: data.id || 'default' },
      update: {
        rate: data.rate,
        isActive: data.isActive,
      },
      create: {
        id: 'default',
        rate: data.rate,
        isActive: data.isActive,
      },
    });
    return { success: true, data: config };
  } catch (error) {
    console.error('Error updating GST config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('generate-invoice-pdf', async (_event, invoiceId: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lineItems: true },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    const items = await prisma.item.findMany();

    // Load business config for GSTIN and logo
    const businessConfig = await prisma.businessConfig.findFirst();
    const pdfOptions: any = {};
    if (businessConfig) {
      if (businessConfig.gstin) pdfOptions.gstin = businessConfig.gstin;
      if (businessConfig.logoPath) pdfOptions.logoPath = businessConfig.logoPath;
    }

    const pdfBuffer = await generateInvoicePDF(invoice, items, pdfOptions);

    const fileName = `${invoice.invoiceNumber.replace('/', '-')}.pdf`;
    const filePath = path.join(app.getPath('documents'), fileName);

    await savePDFToFile(pdfBuffer, filePath);

    return { success: true, data: { filePath, fileName } };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('save-invoice-pdf', async (_event, invoiceId: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lineItems: true },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    const items = await prisma.item.findMany();

    // Load business config for GSTIN and logo
    const businessConfig = await prisma.businessConfig.findFirst();
    const pdfOptions: any = {};
    if (businessConfig) {
      if (businessConfig.gstin) pdfOptions.gstin = businessConfig.gstin;
      if (businessConfig.logoPath) pdfOptions.logoPath = businessConfig.logoPath;
    }

    const pdfBuffer = await generateInvoicePDF(invoice, items, pdfOptions);
    const fileName = `${invoice.invoiceNumber.replace('/', '-')}.pdf`;

    const { filePath } = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: path.join(app.getPath('documents'), fileName),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (filePath) {
      await savePDFToFile(pdfBuffer, filePath);
      return { success: true, data: { filePath, fileName: path.basename(filePath) } };
    } else {
      return { success: false, error: 'Save cancelled' };
    }
  } catch (error) {
    console.error('Error saving PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('print-invoice-pdf', async (_event, invoiceId: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lineItems: true },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    const items = await prisma.item.findMany();

    // Load business config for GSTIN and logo
    const businessConfig = await prisma.businessConfig.findFirst();
    const pdfOptions: any = {};
    if (businessConfig) {
      if (businessConfig.gstin) pdfOptions.gstin = businessConfig.gstin;
      if (businessConfig.logoPath) pdfOptions.logoPath = businessConfig.logoPath;
    }

    const pdfBuffer = await generateInvoicePDF(invoice, items, pdfOptions);
    const fileName = `${invoice.invoiceNumber.replace('/', '-')}.pdf`;

    const { filePath } = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: path.join(app.getPath('documents'), fileName),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (filePath) {
      await savePDFToFile(pdfBuffer, filePath);

      // Create a hidden window to print the PDF
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          sandbox: true,
        },
      });

      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print({}, (success, failureReason) => {
          if (!success) console.log('Print failed: ', failureReason);
          printWindow.destroy();
        });
      });

      printWindow.webContents.loadFile(filePath);
      return { success: true, data: { filePath, fileName: path.basename(filePath) } };
    } else {
      return { success: false, error: 'Save cancelled' };
    }
  } catch (error) {
    console.error('Error printing PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// ===== AMENDMENT HANDLERS =====

ipcMain.handle('create-amendment', async (_event, data) => {
  try {
    const {
      originalInvoiceId,
      customerName,
      customerPhone,
      customerEmail,
      lineItems,
      gstPercentage,
      notes,
    } = data;

    const originalInvoice = await prisma.invoice.findUnique({
      where: { id: originalInvoiceId },
    });

    if (!originalInvoice) {
      return { success: false, error: 'Original invoice not found' };
    }

    // Create amendment invoice with sequential numbering
    const amendmentNumber = await prisma.invoice.count({
      where: { originalInvoiceId },
    });

    const amendmentInvoiceNumber = `${originalInvoice.invoiceNumber}-A${amendmentNumber + 1}`;

    const grossAmount = lineItems.reduce((sum: number, line: any) => sum + line.lineTotal, 0);
    const gstAmount = Number((grossAmount * (gstPercentage / 100)).toFixed(2));
    const netTotal = Number((grossAmount + gstAmount).toFixed(2));

     const amendment = await prisma.invoice.create({
       data: {
         invoiceNumber: amendmentInvoiceNumber,
         invoiceDate: new Date(),
         customerName: customerName || originalInvoice.customerName,
         customerPhone: customerPhone || originalInvoice.customerPhone,
          customerEmail: customerEmail || originalInvoice.customerEmail,
          vehicleNumber: data.vehicleNumber || originalInvoice.vehicleNumber,
          vehicleModel: data.vehicleModel || originalInvoice.vehicleModel,
          grossAmount,
         gstAmount,
         netTotal,
         gstPercentage,
         status: 'Final',
         isAmendment: true,
         originalInvoiceId,
         notes,
         userId: data.userId,
         lineItems: {
           create: lineItems.map((line: any) => ({
             itemId: line.itemId,
             quantity: line.quantity,
             unitPrice: line.unitPrice,
             lineTotal: line.lineTotal,
             ...(line.remarks ? { remarks: line.remarks } : {}),
           })),
         },
       },
       include: { lineItems: true },
     });

    return { success: true, data: amendment };
  } catch (error) {
    console.error('Error creating amendment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('list-amendments-for-invoice', async (_event, invoiceId: string) => {
  try {
    const amendments = await prisma.invoice.findMany({
      where: { originalInvoiceId: invoiceId },
      include: { lineItems: true },
      orderBy: { createdAt: 'asc' },
    });

    return { success: true, data: amendments };
  } catch (error) {
    console.error('Error fetching amendments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// ===== DATABASE RESET HANDLER =====

ipcMain.handle('clear-database', async () => {
  try {
    // Delete in correct order to respect foreign key constraints
    await prisma.lineItem.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.item.deleteMany();

    return { success: true, data: { message: 'All invoices, line items, and inventory items have been cleared.' } };
  } catch (error) {
    console.error('Error clearing database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// ===== BACKUP HANDLERS =====

ipcMain.handle('create-backup', async (_event, options?: { customPath?: boolean }) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `workshop-backup-${timestamp}.db`;
    let backupPath: string;

    if (options?.customPath && mainWindow) {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Backup As',
        defaultPath: backupFileName,
        filters: [{ name: 'Database Backup', extensions: ['db'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Backup cancelled' };
      }

      backupPath = result.filePath;
    } else {
      backupPath = path.join(app.getPath('documents'), 'Workshop Backups', backupFileName);
      const backupDir = path.dirname(backupPath);
      await fs.promises.mkdir(backupDir, { recursive: true });
    }

    const dbPath = getDbPath();
    await fs.promises.copyFile(dbPath, backupPath);

    return { success: true, data: { backupPath, fileName: path.basename(backupPath), timestamp } };
  } catch (error) {
    console.error('Error creating backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('list-backups', async () => {
  try {
    const backupDir = path.join(app.getPath('documents'), 'Workshop Backups');

    try {
      const files = await fs.promises.readdir(backupDir);
      const backups = await Promise.all(
        files
          .filter((f) => f.endsWith('.db'))
          .map(async (file) => {
            const filePath = path.join(backupDir, file);
            const stats = await fs.promises.stat(filePath);
            return {
              fileName: file,
              filePath,
              size: stats.size,
              createdAt: stats.birthtime,
            };
          })
      );

      return { success: true, data: backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) };
    } catch (err) {
      // Directory doesn't exist yet
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('Error listing backups:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('restore-backup', async (_event, backupPath: string) => {
  try {
    const dbPath = getDbPath();

    await prisma.$disconnect();

    const currentBackupPath = path.join(
      app.getPath('documents'),
      'Workshop Backups',
      `pre-restore-backup-${Date.now()}.db`
    );
    await fs.promises.mkdir(path.dirname(currentBackupPath), { recursive: true });
    await fs.promises.copyFile(dbPath, currentBackupPath);

    await fs.promises.copyFile(backupPath, dbPath);

    await prisma.$connect();

    return { success: true, data: { message: 'Backup restored successfully', backupPath: currentBackupPath } };
  } catch (error) {
    console.error('Error restoring backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('delete-backup', async (_event, backupPath: string) => {
  try {
    await fs.promises.unlink(backupPath);
    return { success: true, data: { message: 'Backup deleted successfully' } };
  } catch (error) {
    console.error('Error deleting backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// ===== BUSINESS CONFIG HANDLERS =====

ipcMain.handle('get-business-config', async () => {
  try {
    const config = await prisma.businessConfig.findFirst();
    return { success: true, data: config || { id: 'default', gstin: '', logoPath: '' } };
  } catch (error) {
    console.error('Error fetching business config:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('update-business-config', async (_event, data: any) => {
  try {
    const config = await prisma.businessConfig.upsert({
      where: { id: data.id || 'default' },
      update: {
        gstin: data.gstin,
        logoPath: data.logoPath,
      },
      create: {
        id: 'default',
        gstin: data.gstin || '',
        logoPath: data.logoPath || '',
      },
    });
    return { success: true, data: config };
  } catch (error) {
    console.error('Error updating business config:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('save-logo-file', async (_event, data: { buffer: number[], fileName: string }) => {
  try {
    const logoDir = path.join(app.getPath('userData'), 'logos');
    fs.mkdirSync(logoDir, { recursive: true });
    const ext = path.extname(data.fileName) || '.png';
    const logoPath = path.join(logoDir, `logo${ext}`);
    fs.writeFileSync(logoPath, Buffer.from(data.buffer));
    return { success: true, data: { logoPath } };
  } catch (error) {
    console.error('Error saving logo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('read-logo-file', async (_event, logoPath: string) => {
  try {
    if (!logoPath || !fs.existsSync(logoPath)) {
      return { success: false, error: 'Logo file not found' };
    }
    const buffer = fs.readFileSync(logoPath);
    return { success: true, data: { buffer: Array.from(buffer), mimeType: logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg' } };
  } catch (error) {
    console.error('Error reading logo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('open-pdf', async (_event, filePath: string) => {
  try {
    const { shell } = require('electron');
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('Error opening PDF:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

const bcrypt = require('bcryptjs');

ipcMain.handle('register-user', async (_event, input: any) => {
  try {
    const { email, password, name, role } = input;

    if (!email || !password || !name) {
      return { success: false, error: 'Email, password, and name are required' };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'staff',
      },
    });

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('login-user', async (_event, input: any) => {
  try {
    const { email, password } = input;

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (!user.isActive) {
      return { success: false, error: 'User account is inactive' };
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

ipcMain.handle('get-users', async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});
