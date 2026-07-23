const js = require('@eslint/js');
const security = require('eslint-plugin-security');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**']
  },
  js.configs.recommended,
  security.configs.recommended,
  {
    // Server code runs under Node.
    files: ['server.js', 'playwright.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node
    }
  },
  {
    // Test files run under Node, but Playwright's page.evaluate() callbacks
    // in ui.spec.js execute inline in the browser, so both global sets apply.
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser }
    }
  },
  {
    // validation.js is a UMD module shared between Node (server.js) and the browser.
    files: ['validation.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.node, ...globals.browser }
    }
  },
  {
    // Static assets served to and executed by the browser.
    files: ['public/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, SearchValidation: 'readonly' }
    }
  }
];
