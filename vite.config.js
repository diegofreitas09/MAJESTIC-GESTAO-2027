import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        executivo: resolve(process.cwd(), 'index.html'),
        equipe: resolve(process.cwd(), 'equipe.html'),
      },
    },
  },
});
