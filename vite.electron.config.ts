import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    // Electron-specific dependencies
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  build: {
    outDir: 'dist-electron',
    lib: {
      entry: {
        main: path.resolve(__dirname, 'electron/main.ts'),
        preload: path.resolve(__dirname, 'electron/preload.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['electron', 'path', 'url', 'fs/promises'],
    },
    emptyOutDir: true,
  },
});
