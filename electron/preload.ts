import { contextBridge, ipcRenderer } from 'electron';

console.log('[PRELOAD] Preload script is running!');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  showSaveDialog: (defaultPath?: string) =>
    ipcRenderer.invoke('dialog:saveFile', defaultPath),
  showOpenDialog: () =>
    ipcRenderer.invoke('dialog:openFile'),

  // File system operations
  writeFile: (filePath: string, data: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, data),
  readFile: (filePath: string) =>
    ipcRenderer.invoke('fs:readFile', filePath),
  deleteFile: (filePath: string) =>
    ipcRenderer.invoke('fs:deleteFile', filePath),

  // App operations
  quit: () =>
    ipcRenderer.invoke('app:quit'),
});

console.log('[PRELOAD] electronAPI exposed to window:', window.electronAPI);
