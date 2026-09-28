/**
 * @file
 * Generates assets/css/tokens.css from the UIkit stylesheet.
 *
 * UIkit ships its colors as literal values. This script keeps every UIkit
 * declaration that prints one of the global colors, and replaces the color
 * with the matching custom property, with the UIkit value as the fallback.
 * UI Skins and assets/css/webship.css then set the custom properties.
 *
 * On top of the UIkit tokens, the script maps:
 * - the brand and status backgrounds used as text or as indicators (marker,
 *   active tab border, progress value) to the --webtheme-*-color text
 *   tokens, so text keeps the WCAG AAA contrast in both color modes;
 * - the borders of the form controls to --webtheme-form-border, so the
 *   controls keep the non-text contrast, the dividers keep a light border;
 * - the white of the inverse contexts (.uk-light and the primary, secondary
 *   sections, tiles, cards, overlays and the offcanvas bar) to the inverse
 *   color, and the dark text printed on white inverse elements to
 *   --webtheme-on-inverse-color, so the dark color mode does not turn them
 *   dark on dark;
 * - the translucent white text and form borders of the inverse contexts to
 *   --webtheme-inverse-muted-color and --webtheme-inverse-form-border.
 *
 * Usage: npm run build:tokens
 */

// The parser walks the rules in order, with early exits.
/* eslint-disable no-restricted-syntax */

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const uikitPackage = require("uikit/package.json");

const source = readFileSync(
  require.resolve("uikit/dist/css/uikit.css"),
  "utf8",
);

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';

// UIkit literal color => custom property. Several values alias one token.
const COLORS = {
  "#fff": "--uk-global-background",
  "#ffffff": "--uk-global-background",
  "#666": "--uk-global-color",
  "#333": "--uk-global-emphasis-color",
  "#999": "--uk-global-muted-color",
  "#1e87f0": "--uk-global-primary-background",
  "#0f6ecd": "--uk-global-link-hover-color",
  "#0e6dcd": "--uk-global-primary-background-hover",
  "#0f7ae5": "--uk-global-primary-background-hover",
  "#f8f8f8": "--uk-global-muted-background",
  "#ebebeb": "--uk-global-muted-background-hover",
  "#f2f2f2": "--uk-global-muted-background-hover",
  "#e5e5e5": "--uk-global-border",
  "#222": "--uk-global-secondary-background",
  "#151515": "--uk-global-secondary-background-hover",
  "#080808": "--uk-global-secondary-background-hover",
  "#32d296": "--uk-global-success-background",
  "#faa05a": "--uk-global-warning-background",
  "#f0506e": "--uk-global-danger-background",
  "#ee395b": "--uk-global-danger-background-hover",
  "#ec2147": "--uk-global-danger-background-hover",
  "#d8eafc": "--uk-alert-primary-background",
  "#edfbf6": "--uk-alert-success-background",
  "#fff6ee": "--uk-alert-warning-background",
  "#fef4f6": "--uk-alert-danger-background",
};

// The inverse contexts of UIkit (see inverse.less).
const INVERSE =
  /^(\.uk-light(?=[\s.])|\.uk-section-(primary|secondary):not\(\.uk-preserve-color\)\s|\.uk-tile-(primary|secondary):not\(\.uk-preserve-color\)\s|\.uk-card-(primary|secondary)(\.uk-card-body|\s>\s:not\(\[class\*="uk-card-media"\]\))\s|\.uk-overlay-primary\s|\.uk-offcanvas-bar\s)/;
// The inverse containers themselves.
const INVERSE_ROOT =
  /^(\.uk-light|\.uk-section-(primary|secondary):not\(\.uk-preserve-color\)|\.uk-tile-(primary|secondary):not\(\.uk-preserve-color\)|\.uk-card-(primary|secondary)(\.uk-card-body|\s>\s:not\(\[class\*="uk-card-media"\]\))|\.uk-overlay-primary|\.uk-offcanvas-bar)$/;
// The translucent white of the inverse text and form borders.
const INVERSE_ALPHA = /rgba\(255, 255, 255, 0\.(5|6|7|2)\)/g;
const FORM_CONTROL =
  /\.uk-(input|select|textarea|radio|checkbox|search-input)\b/;
const STATUS = /^--uk-global-(primary|success|warning|danger)-background$/;

/**
 * Picks the custom property of a UIkit color in its declaration.
 */
function token(value, property, selectors) {
  const name = COLORS[value];
  const inverse = selectors.every((selector) => INVERSE.test(selector));
  if (inverse) {
    // White elements and rings on the inverse backgrounds.
    if (
      name === "--uk-global-background" ||
      (property === "color" && value.startsWith("#fff"))
    ) {
      return "--uk-global-inverse-color";
    }
    if (name === "--uk-global-muted-background") {
      return "--uk-global-inverse-color";
    }
    if (name === "--uk-global-muted-background-hover") {
      return "--webtheme-inverse-hover-background";
    }
    // Dark text on these white elements.
    if (
      property === "color" &&
      [
        "--uk-global-color",
        "--uk-global-emphasis-color",
        "--uk-global-secondary-background",
      ].includes(name)
    ) {
      return "--webtheme-on-inverse-color";
    }
    return name;
  }
  if (name === "--uk-global-background" && property === "color") {
    return "--uk-global-inverse-color";
  }
  if (
    name === "--uk-global-primary-background" &&
    property === "color" &&
    selectors.some((selector) => /^a\b|uk-link/.test(selector))
  ) {
    return "--uk-global-link-color";
  }
  if (
    name === "--uk-global-border" &&
    /^border/.test(property) &&
    selectors.every((selector) => FORM_CONTROL.test(selector))
  ) {
    return "--webtheme-form-border";
  }
  const match = name && name.match(STATUS);
  if (match) {
    const indicator =
      property === "color" ||
      (/^border/.test(property) &&
        selectors.every((selector) =>
          /uk-tab|uk-form-|uk-input|uk-select|uk-textarea|uk-radio|uk-checkbox|uk-search-input/.test(
            selector,
          ),
        )) ||
      selectors.every((selector) =>
        /progress|uk-text-background/.test(selector),
      );
    if (
      indicator &&
      !selectors.some(
        (selector) =>
          /uk-button|uk-badge|uk-label|uk-alert|uk-notification|uk-subnav-pill|uk-card|uk-tile|uk-background|uk-section|uk-overlay/.test(
            selector,
          ) && property !== "color",
      )
    ) {
      return `--webtheme-${match[1]}-color`;
    }
  }
  return name;
}

/**
 * Replaces the UIkit colors of a declaration value, or returns NULL.
 */
function mapValue(value, property, selectors) {
  let found = false;
  if (/^font-family$/.test(property) && value === FONT_FAMILY) {
    return `var(--uk-global-font-family, ${FONT_FAMILY})`;
  }
  const inverse = selectors.every(
    (selector) => INVERSE.test(selector) || INVERSE_ROOT.test(selector),
  );
  let alpha = value;
  if (inverse) {
    alpha = value.replace(INVERSE_ALPHA, (rgba, level) => {
      if (level !== "2" && property === "color") {
        found = true;
        return `var(--webtheme-inverse-muted-color, ${rgba})`;
      }
      if (
        level === "2" &&
        /^border/.test(property) &&
        selectors.every((selector) => FORM_CONTROL.test(selector))
      ) {
        found = true;
        return `var(--webtheme-inverse-form-border, ${rgba})`;
      }
      return rgba;
    });
  }
  const mapped = alpha.replace(/#[0-9a-fA-F]{3,8}\b/g, (hex) => {
    const lower = hex.toLowerCase();
    if (!COLORS[lower]) {
      return hex;
    }
    found = true;
    const name = token(lower, property, selectors);
    return name.startsWith("--webtheme-")
      ? `var(${name}, var(${COLORS[lower]}, ${hex}))`
      : `var(${name}, ${hex})`;
  });
  return found ? mapped : null;
}

/**
 * Splits a CSS text in top-level statements, skipping strings and comments.
 */
function parse(css) {
  const nodes = [];
  let i = 0;
  let start = 0;
  let depth = 0;
  let head = "";
  let quote = "";
  while (i < css.length) {
    const c = css[i];
    if (quote) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === quote) {
        quote = "";
      }
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === "{") {
      if (depth === 0) {
        head = css.slice(start, i).trim();
        start = i + 1;
      }
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0) {
        nodes.push({ head, body: css.slice(start, i) });
        start = i + 1;
      }
    } else if (c === ";" && depth === 0) {
      start = i + 1;
    }
    i++;
  }
  return nodes;
}

/**
 * Splits declarations or selectors on a separator outside of parentheses.
 */
function split(text, separator) {
  const parts = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote) {
        quote = "";
      }
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === "(") {
      depth++;
    } else if (c === ")") {
      depth--;
    } else if (c === separator && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * Renders the tokenized rules of a list of nodes.
 */
function render(nodes, indent = "") {
  let out = "";
  for (const node of nodes) {
    if (node.head.startsWith("@")) {
      if (/^@(-webkit-)?keyframes|^@font-face/.test(node.head)) {
        continue;
      }
      const inner = render(parse(node.body), `${indent}  `);
      if (inner) {
        out += `${indent}${node.head} {\n${inner}${indent}}\n`;
      }
      continue;
    }
    const selectors = split(node.head, ",");
    const declarations = [];
    for (const declaration of split(node.body, ";")) {
      const colon = declaration.indexOf(":");
      if (colon < 0) {
        continue;
      }
      const property = declaration.slice(0, colon).trim();
      if (property.startsWith("--")) {
        continue;
      }
      const value = mapValue(
        declaration.slice(colon + 1).trim(),
        property,
        selectors,
      );
      if (value !== null) {
        declarations.push(`${indent}  ${property}: ${value};\n`);
      }
    }
    if (declarations.length) {
      out += `${indent}${selectors.join(`,\n${indent}`)} {\n${declarations.join("")}${indent}}\n`;
    }
  }
  return out;
}

const defaults = Object.entries(COLORS)
  .filter(
    ([, name], index, list) =>
      list.findIndex(([, other]) => other === name) === index,
  )
  .map(([hex, name]) => ` *   ${name}: ${hex}\n`)
  .join("");

const css = render(parse(source.replace(/\/\*[\s\S]*?\*\//g, "")));
writeFileSync(
  resolve(root, "assets/css/tokens.css"),
  `/* stylelint-disable */
/**
 * @file
 * UIkit design tokens.
 *
 * GENERATED FILE, DO NOT EDIT: run "npm run build:tokens".
 * Source: UIkit ${uikitPackage.version} dist/css/uikit.css.
 *
 * Custom properties (with their UIkit default):
 *   --uk-global-font-family: ${FONT_FAMILY}
${defaults} *
 * Webtheme tokens (set in assets/css/webship.css and assets/css/drupal.css):
 *   --webtheme-primary-color, --webtheme-success-color,
 *   --webtheme-warning-color, --webtheme-danger-color: the brand and status
 *   colors as text and indicators.
 *   --webtheme-form-border: the border of the form controls.
 *   --webtheme-on-inverse-color, --webtheme-inverse-hover-background: the
 *   white elements of the inverse contexts.
 *   --webtheme-inverse-muted-color, --webtheme-inverse-form-border: the
 *   translucent white text and form borders of the inverse contexts.
 */

${css}`,
);
