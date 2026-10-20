import js from '@eslint/js';
import globals from 'globals';

/**
 * ESLint flat config: the recommended rules everywhere, browser globals for the game and the
 * redirect page, Node.js globals for the configs and the tests. Prettier owns the formatting, and
 * the recommended rules hold no formatting rule, so the two never conflict.
 */
export default [
  { ignores: ['dist/', 'coverage/'] },
  js.configs.recommended,
  {
    files: ['app/**/*.js', 'redirect/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.config.js', 'commitlint/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // The UI tests run in happy-dom, so they use the browser globals too.
    files: ['test/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
