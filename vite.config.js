import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/extractive-data/',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
