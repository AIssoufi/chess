import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  build: {
    outDir: '../dist',
    // Vite only empties an outDir inside its root by default, and app/ is the root.
    emptyOutDir: true,
  },
});
