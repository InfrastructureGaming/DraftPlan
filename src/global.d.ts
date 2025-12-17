export {};

declare global {
  interface Window {
    electronAPI: {
      showSaveDialog: (defaultPath?: string) => Promise<Electron.SaveDialogReturnValue>;
      showOpenDialog: () => Promise<Electron.OpenDialogReturnValue>;
      writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
      readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      quit: () => Promise<void>;
    };
  }
}
