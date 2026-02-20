import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { PrismaClient } from '@prisma/client';

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
      enableRemoteModule: false,
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
