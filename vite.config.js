import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  base: '/chess/',
  build: {
    outDir: '../dist',
  },
});
