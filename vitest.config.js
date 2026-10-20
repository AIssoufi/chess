import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    // Model tests run in Node.js; a test of DOM code opts into happy-dom with a
    // `// @vitest-environment happy-dom` comment on its first line.
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['app/js/**/*.js'],
      reporter: ['text', 'html'],
    },
  },
});
