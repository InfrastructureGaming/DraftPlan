import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    title: 'DraftPlan',
    backgroundColor: '#F8F6F0',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-react/index.html'));
  }
}

// IPC Handlers for file operations
ipcMain.handle('dialog:saveFile', async (_event, defaultPath?: string) => {
  const result = await dialog.showSaveDialog({
    title: 'Save Project',
    defaultPath: defaultPath || 'Untitled.draftplan',
    filters: [
      { name: 'DraftPlan Project', extensions: ['draftplan'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result;
});

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Project',
    filters: [
      { name: 'DraftPlan Project', extensions: ['draftplan'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  return result;
});

ipcMain.handle('fs:writeFile', async (_event, filePath: string, data: string) => {
  try {
    await fs.writeFile(filePath, data, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:deleteFile', async (_event, filePath: string) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('app:quit', () => {
  app.quit();
});

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
