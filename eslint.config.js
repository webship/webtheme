/**
 * @file
 * ESLint configuration for the Webtheme JavaScript and YAML files.
 */

const js = require('@eslint/js');
const globals = require('globals');
const yml = require('eslint-plugin-yml');

module.exports = [
  {
    ignores: ['node_modules/**', 'vendor/**', 'web/**', '.yarn/**', 'tests/reports/**'],
  },
  {
    files: ['assets/js/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        Drupal: 'readonly',
        drupalSettings: 'readonly',
        once: 'readonly',
        htmx: 'readonly',
        UIkit: 'readonly',
      },
    },
  },
  {
    files: ['tests/**/*.js', 'cucumber.js', 'eslint.config.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  ...yml.configs['flat/recommended'],
];
