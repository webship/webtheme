/**
 * @file
 * ESLint configuration for the Webtheme JavaScript and YAML files.
 */

const js = require("@eslint/js");
const globals = require("globals");
const yml = require("eslint-plugin-yml");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "vendor/**",
      "web/**",
      ".yarn/**",
      "tests/reports/**",
    ],
  },
  {
    files: ["tests/**/*.js", "cucumber.js", "eslint.config.js"],
    ...js.configs.recommended,
    // The steps also pass the Drupal core configuration, which needs
    // directives this one does not.
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ["assets/js/**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        Drupal: "readonly",
        once: "readonly",
      },
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    ...js.configs.recommended,
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
  ...yml.configs["flat/recommended"],
];
