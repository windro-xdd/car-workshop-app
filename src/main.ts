import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePDF, savePDFToFile } from './renderer/utils/pdfGenerator';

// Declare webpack entry points injected by Electron Forge
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

const prisma = new PrismaClient();

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();
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
    await prisma.item.delete({
      where: { id },
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

ipcMain.handle('get-invoices', async () => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { lineItems: true },
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

    const pdfBuffer = await generateInvoicePDF(invoice, items);

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
    const result = await ipcMain.emit('generate-invoice-pdf', invoiceId);

    if (!result || typeof result !== 'object' || !('success' in result)) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { lineItems: true },
      });

      if (!invoice) {
        return { success: false, error: 'Invoice not found' };
      }

      const items = await prisma.item.findMany();
      const pdfBuffer = await generateInvoicePDF(invoice, items);
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
    }

    return result;
  } catch (error) {
    console.error('Error saving PDF:', error);
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

// ===== BACKUP HANDLERS =====

ipcMain.handle('create-backup', async () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `workshop-backup-${timestamp}.db`;
    const backupPath = path.join(app.getPath('documents'), 'Workshop Backups', backupFileName);

    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    await fs.promises.mkdir(backupDir, { recursive: true });

    // Copy database file
    const dbPath = path.join(app.getPath('userData'), 'prisma', 'dev.db');
    await fs.promises.copyFile(dbPath, backupPath);

    return { success: true, data: { backupPath, fileName: backupFileName, timestamp } };
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
    const dbPath = path.join(app.getPath('userData'), 'prisma', 'dev.db');

    // Close Prisma connection before restoring
    await prisma.$disconnect();

    // Create backup of current DB before restoring
    const currentBackupPath = path.join(
      app.getPath('documents'),
      'Workshop Backups',
      `pre-restore-backup-${Date.now()}.db`
    );
    await fs.promises.mkdir(path.dirname(currentBackupPath), { recursive: true });
    await fs.promises.copyFile(dbPath, currentBackupPath);

    // Restore from backup
    await fs.promises.copyFile(backupPath, dbPath);

    // Reinitialize Prisma connection
    const newPrisma = new PrismaClient();
    Object.assign(prisma, newPrisma);

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

const bcrypt = require('bcrypt');

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
