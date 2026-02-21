import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { PrismaClient } from '@prisma/client';

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
