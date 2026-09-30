/**
 * @file
 * Generates assets/css/tokens.css from the UIkit stylesheet.
 *
 * UIkit ships its colors, the fonts of the text, the headings and the code,
 * the font size, line height, margins and box shadows as literal values. This script keeps every UIkit declaration that
 * prints one of them, and replaces the value with the matching custom
 * property, with the UIkit value as the fallback. UI Skins,
 * assets/css/webship.css and assets/css/drupal.css then set the custom
 * properties.
 *
 * On top of the UIkit tokens, the script maps:
 * - the brand and status backgrounds used as text or as indicators (marker,
 *   active tab border, progress value) to the --uk-global-*-color text
 *   tokens, so text keeps the WCAG AAA contrast in both color modes;
 * - the borders of the form controls to --uk-form-border-color, so the
 *   controls keep the non-text contrast, the dividers keep a light border;
 * - the white of the inverse contexts (.uk-light and the primary, secondary
 *   sections, tiles, cards, overlays and the offcanvas bar) to the inverse
 *   color, and the dark text printed on white inverse elements to
 *   --webtheme-on-inverse-color, so the dark color mode does not turn them
 *   dark on dark;
 * - the translucent white text and form borders of the inverse contexts to
 *   --uk-inverse-muted-color and --uk-inverse-form-border-color.
 *
 * UIkit has no corner radius of its own: the script adds the rules giving the
 * buttons, fields, cards and panels the radius token, which falls back to 0.
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
// The tokens of the theme that fall back to the UIkit token they replace.
const FALLBACK =
  /^--(uk-global-(primary|success|warning|danger)-color|uk-form-border-color|webtheme-.*)$/;

// The headings have a font of their own, the font of the text when unset.
const HEADING = /(^|[\s,])(h1|\.uk-h1|\.uk-heading-small)(?=$|[\s,])/;

// The font of the code, in the "font" and "font-family" declarations.
const CODE_FONT = "Consolas, monaco, monospace";

// Literal value => custom property, for the box shadows.
const SHADOWS = {
  "0 2px 8px rgba(0, 0, 0, 0.08)": "--uk-global-small-box-shadow",
  "0 5px 15px rgba(0, 0, 0, 0.08)": "--uk-global-medium-box-shadow",
  "0 14px 25px rgba(0, 0, 0, 0.16)": "--uk-global-large-box-shadow",
  "0 28px 50px rgba(0, 0, 0, 0.16)": "--uk-global-xlarge-box-shadow",
  "0 5px 12px rgba(0, 0, 0, 0.15)": "--uk-dropdown-box-shadow",
};

// Literal value => custom property, for the margins between the blocks.
const MARGINS = {
  "10px": "--uk-global-small-margin",
  "20px": "--uk-global-margin",
  "40px": "--uk-global-medium-margin",
  "70px": "--uk-global-large-margin",
};

// The same lengths are gutters or dividers in these components, not margins.
const NOT_MARGIN = /uk-(grid|align|breadcrumb|subnav|dropcap)/;

// The components that take the corner radius of the theme. UIkit prints them
// with square corners, so the rule is added, not rewritten.
const RADIUS = [
  ".uk-button:not(.uk-button-text):not(.uk-button-link)",
  ".uk-input",
  ".uk-select",
  ".uk-textarea",
  ".uk-search-default .uk-search-input",
  ".uk-card",
  ".uk-alert",
  ".uk-placeholder",
  ".uk-modal-dialog",
  ".uk-dropdown",
  ".uk-navbar-dropdown",
  ".uk-notification-message",
];

// The other custom properties, with their UIkit default, for the header of
// the generated file.
const OTHERS = new Map();

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
    return "--uk-form-border-color";
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
      return `--uk-global-${match[1]}-color`;
    }
  }
  return name;
}

/**
 * Replaces the UIkit lengths and shadows of a declaration value, or NULL.
 *
 * Returns undefined when the property is not one of them.
 */
function mapLength(value, property, selectors) {
  const important = value.endsWith(" !important") ? " !important" : "";
  const bare = value.replace(/ !important$/, "");
  if (property === "box-shadow") {
    const name = SHADOWS[bare];
    if (!name) {
      return null;
    }
    OTHERS.set(name, bare);
    return `var(${name}, ${bare})${important}`;
  }
  if (property === "font-size" && selectors.length === 1 && selectors[0] === "html") {
    OTHERS.set("--uk-global-font-size", bare);
    return `var(--uk-global-font-size, ${bare})`;
  }
  if (property === "line-height") {
    if (bare !== "1.5") {
      return null;
    }
    OTHERS.set("--uk-global-line-height", bare);
    return `var(--uk-global-line-height, ${bare})`;
  }
  if (property.startsWith("margin")) {
    const selector = selectors.join(",");
    const vertical = !/-(left|right)$/.test(property);
    if (
      NOT_MARGIN.test(selector) ||
      !(vertical || selector.includes(".uk-margin"))
    ) {
      return null;
    }
    const lengths = bare.split(" ");
    let found = false;
    // A shorthand of four values: only the top and the bottom are margins
    // between blocks.
    const mapped = lengths.map((length, index) => {
      const name = MARGINS[length];
      if (!name || (lengths.length === 4 && index % 2 === 1)) {
        return length;
      }
      found = true;
      OTHERS.set(name, length);
      return `var(${name}, ${length})`;
    });
    return found ? `${mapped.join(" ")}${important}` : null;
  }
  return undefined;
}

/**
 * Replaces the UIkit values of a declaration value, or returns NULL.
 */
function mapValue(value, property, selectors) {
  let found = false;
  if (/^font-family$/.test(property) && value === FONT_FAMILY) {
    if (selectors.some((selector) => HEADING.test(selector))) {
      OTHERS.set("--uk-base-heading-font-family", "var(--uk-global-font-family)");
      return `var(--uk-base-heading-font-family, var(--uk-global-font-family, ${FONT_FAMILY}))`;
    }
    return `var(--uk-global-font-family, ${FONT_FAMILY})`;
  }
  // The "font" shorthand of "pre" is printed as a font family: the shorthand
  // would reset the other font properties, like the ligatures.
  if (["font", "font-family"].includes(property) && value.includes(CODE_FONT)) {
    OTHERS.set("--uk-base-code-font-family", CODE_FONT);
    return `var(--uk-base-code-font-family, ${CODE_FONT})`;
  }
  if (value.includes("url(")) {
    return null;
  }
  const length = mapLength(value, property, selectors);
  if (length !== undefined) {
    return length;
  }
  const inverse = selectors.every(
    (selector) => INVERSE.test(selector) || INVERSE_ROOT.test(selector),
  );
  let alpha = value;
  if (inverse) {
    alpha = value.replace(INVERSE_ALPHA, (rgba, level) => {
      if (level !== "2" && property === "color") {
        found = true;
        return `var(--uk-inverse-muted-color, ${rgba})`;
      }
      if (
        level === "2" &&
        /^border/.test(property) &&
        selectors.every((selector) => FORM_CONTROL.test(selector))
      ) {
        found = true;
        return `var(--uk-inverse-form-border-color, ${rgba})`;
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
    return FALLBACK.test(name)
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
 * The properties that keep their order in the generated file.
 *
 * A rewritten declaration moves after the whole UIkit CSS. A later UIkit
 * declaration of the same property, left as it is, would lose against it
 * (".uk-nav-medium" sets a line height after ".uk-nav-primary"): from the
 * first rewritten declaration on, the declarations of these properties are
 * all printed, rewritten or not.
 */
function family(property) {
  if (property.startsWith("margin")) {
    return "margin";
  }
  return ["box-shadow", "line-height"].includes(property) ? property : null;
}

// The position of the first rewritten declaration of each family.
const firstRewritten = new Map();

/**
 * Renders the tokenized rules of a list of nodes.
 *
 * @param {Array} nodes
 *   The statements.
 * @param {string} indent
 *   The indentation of the block.
 * @param {object} position
 *   The count of the declarations read so far.
 * @param {boolean} collect
 *   Whether this pass only looks for the first rewritten declarations.
 */
function render(nodes, indent, position, collect) {
  let out = "";
  for (const node of nodes) {
    if (node.head.startsWith("@")) {
      if (/^@(-webkit-)?keyframes|^@font-face/.test(node.head)) {
        continue;
      }
      const inner = render(
        parse(node.body),
        `${indent}  `,
        position,
        collect,
      );
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
      position.count++;
      const original = declaration.slice(colon + 1).trim();
      const value = mapValue(original, property, selectors);
      const group = family(property);
      if (value !== null) {
        const name = property === "font" ? "font-family" : property;
        declarations.push(`${indent}  ${name}: ${value};\n`);
        if (collect && group && !firstRewritten.has(group)) {
          firstRewritten.set(group, position.count);
        }
      } else if (
        !collect &&
        group &&
        firstRewritten.get(group) < position.count
      ) {
        declarations.push(`${indent}  ${property}: ${original};\n`);
      }
    }
    if (declarations.length) {
      out += `${indent}${selectors.join(`,\n${indent}`)} {\n${declarations.join("")}${indent}}\n`;
    }
  }
  return out;
}

/**
 * The rules of the corner radius, added to the ones rewritten from UIkit.
 */
function radius() {
  OTHERS.set("--uk-global-border-radius", "0");
  const value = "var(--uk-global-border-radius, 0)";
  return `${RADIUS.join(",\n")} {
  border-radius: ${value};
}
.uk-button-group > .uk-button:not(:first-child),
.uk-button-group > :not(:first-child) > .uk-button {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}
.uk-button-group > .uk-button:not(:last-child),
.uk-button-group > :not(:last-child) > .uk-button {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}
.uk-card-media-top,
.uk-card-media-top img {
  border-radius: ${value} ${value} 0 0;
}
.uk-card-media-bottom,
.uk-card-media-bottom img {
  border-radius: 0 0 ${value} ${value};
}
.uk-card-media-left,
.uk-card-media-left img {
  border-start-start-radius: ${value};
  border-end-start-radius: ${value};
}
.uk-card-media-right,
.uk-card-media-right img {
  border-start-end-radius: ${value};
  border-end-end-radius: ${value};
}
`;
}

const defaults = Object.entries(COLORS)
  .filter(
    ([, name], index, list) =>
      list.findIndex(([, other]) => other === name) === index,
  )
  .map(([hex, name]) => ` *   ${name}: ${hex}\n`)
  .join("");

const rules = parse(source.replace(/\/\*[\s\S]*?\*\//g, ""));
render(rules, "", { count: 0 }, true);
const css = render(rules, "", { count: 0 }, false) + radius();
const others = [...OTHERS.entries()]
  .map(([name, value]) => ` *   ${name}: ${value}\n`)
  .join("");
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
${defaults}${others} *
 * Tokens of the theme on top of them (set in assets/css/webship.css and
 * assets/css/drupal.css, falling back to the UIkit ones):
 *   --uk-global-primary-color, --uk-global-success-color,
 *   --uk-global-warning-color, --uk-global-danger-color: the brand and status
 *   colors as text and indicators.
 *   --uk-form-border-color: the border of the form controls.
 *   --uk-inverse-muted-color, --uk-inverse-form-border-color: the
 *   translucent white text and form borders of the inverse contexts.
 *   --webtheme-on-inverse-color, --webtheme-inverse-hover-background: the
 *   white elements of the inverse contexts.
 */

${css}`,
);
