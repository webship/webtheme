# Webtheme

A theme generated from [UI Suite UIkit](https://www.drupal.org/project/ui_suite_uikit): single directory components
(SDC) built with [UIkit](https://getuikit.com), [HTMX](https://htmx.org) navigation, UI Skins, UI Styles and UI Icons,
ready for [Display Builder](https://www.drupal.org/project/display_builder).

## Customize

- Colors and fonts: the CSS variables in `assets/css/webship.css` (light) and `assets/css/drupal.css`
  (dark), and the UI Skins settings in `webtheme.ui_skins.css_variables.yml` and
  `webtheme.ui_skins.themes.yml`. `assets/css/tokens.css` maps the UIkit colors to these variables: it is
  generated with `npm run build:tokens` (`scripts/build-tokens.mjs`), do not edit it.
- The UI Skins ids carry the theme name: the design tokens (`webtheme-global-color`, mapped to
  `--uk-global-color` at the end of the dark mode section of `assets/css/drupal.css`), the color modes
  (`webtheme_light`, `webtheme_dark`) and the icon pack (`webtheme`). UI Skins and UI Icons ids are shared by
  every theme of the site, so UIkit Admin or UI Suite UIkit never replace them. The earlier `uikit` icon pack id
  is kept, so content and layouts saved with it keep their icons.
- Components: the `components` folder. Each component has its `*.component.yml`, Twig template and stories.
- Utilities: `webtheme.ui_styles.yml`.
- Theme settings: Appearance > Webtheme (UIkit from the CDN or local libraries, sticky navbar, HTMX
  navigation, the color mode, the footer logo and the footer copyright line).
- Color mode: light (the default), dark, or follow the operating system, as in UIkit Admin. The setting
  prints `data-theme` on `html` and is stored for UI Skins too; with *Follow the operating system* it prints
  none and the dark tokens apply in a `prefers-color-scheme: dark` media query.
- HTMX navigation: a boosted request for a page another theme renders on a full load (the sign-in pages
  that Web Admin shows in UIkit Admin, a dashboard) answers with `HX-Redirect`, and HTMX loads it in full:
  a URL always shows the same theme.
- Optional blocks: the site branding, main and account menus in the navbar, the main and account menus in
  the offcanvas on small screens, and the footer menu, the social media menu (when a `social-media-menu`
  menu exists) and "Powered by" in the footer.

## Accessibility (WCAG 2.2 AAA)

Webtheme meets WCAG 2.2 AAA for everything a theme controls: the colors, the focus, the target sizes, the
typography, the reflow, the motion and the markup of its templates and components, in the light and the
dark color modes, for every UI Skins theme it ships and at every breakpoint. The `@aaa` tests check it on
every build. The content, the configuration and the modules of a site can still fail a criterion: review
the checklist below for each site.

UIkit comes from the CDN (or a local copy of its distribution), so its styles are adjusted in
`assets/css/accessibility.css`, `assets/js/accessibility.js` and the generated `assets/css/tokens.css`:

- Contrast (1.4.6, 1.4.11): every text color reaches 7:1 (4.5:1 for large text) on the backgrounds it is
  printed on, and the borders of the form controls, the close buttons and the dots reach 3:1. The brand
  and status colors used as text have their own tokens (`--webtheme-primary-color`, `-success-`,
  `-warning-`, `-danger-`), as the alerts (`--webtheme-alert-*-color`) and the form borders
  (`--webtheme-form-border`). Text over images sits on a scrim (cover, overlays, slidenav).
- Focus (2.4.7, 2.4.11 to 2.4.13): a 2px solid ring 2px away from the element, over a 6px halo of the
  page background (`--webtheme-focus-color`, `--webtheme-focus-halo`), white on a dark halo in the inverse
  sections. The sticky navbar never covers the focused element (`scroll-padding-top`).
- Target size (2.5.5): links, buttons, menu items, the navbar and offcanvas toggles, form controls,
  close buttons, dots and the password visibility toggle of the View Password module are 44 by 44
  pixels. Links inside a sentence are exempt.
- Use of color (1.4.1): the links inside a line of text are underlined, the current menu item too.
- Visual presentation (1.4.8): lines of text are 80 characters at most, the line height is 1.5 (the meta
  texts of UIkit too) and the space between paragraphs is 1.5 times the line spacing. No text is
  justified: the "Justify" text alignment is not offered in UI Styles, and `uk-text-justify`, the CKEditor
  alignment and inline `text-align: justify` are printed aligned to the start.
- Reflow (1.4.10): button groups, subnavs, tabs and paginations wrap at 320 pixels.
- Motion (2.2.2, 2.3.3): nothing is animated when reduced motion is requested, and the slideshows and
  sliders that play automatically have a pause button (and do not play with reduced motion).
- Structure (1.3.1, 2.4.6, 2.4.10, 4.1.2, 4.1.3): the accordion titles are headings, the offcanvas and the
  lightbox are named, the section component prints the main, header, footer and complementary landmarks,
  the status messages are one alert per type with a heading naming the type, and the errors of a form
  field are printed under it and linked to it (`aria-describedby`); the first invalid field gets the
  focus.
- Link purpose (2.4.9): the button and link components have a "Hidden label suffix" to tell apart
  links with the same label ("Learn more").

When you change a color in UI Skins or in the CSS, check its contrast against every background it is
printed on, in both color modes.

### Display Builder page layouts

A Display Builder page layout swaps the page template in the runtime theme registry, which Drupal caches.
When a page layout was the first page rendered after a cache clear, the other pages lost their header,
main and footer until the next cache clear. Webtheme puts its page template back on the pages of the block
layout (`src/Hook/PageTemplateHooks.php`), with the classic and the HTMX navigation.

### Checklist of the criteria a theme cannot guarantee

These AAA criteria depend on the content, the configuration or the modules of the site. Review them for
each site; the theme does not claim them.

- [ ] 1.2.6 to 1.2.9: sign language, extended audio description, media alternatives and live audio.
- [ ] 1.3.6 Identify Purpose: regions, icons and components the content adds.
- [ ] 1.4.7 Low or No Background Audio.
- [ ] 1.4.8 Visual Presentation: the visitor can choose the text and background colors (the browser or
  the operating system settings; the theme does not offer a color picker), and text is resized to 200%
  without horizontal scrolling in the content the editors add (wide tables, code).
- [ ] 1.4.9 Images of Text: no text in images, logos excepted.
- [ ] 2.1.3 Keyboard (No Exception): the widgets the modules add. In the navbar, a dropdown opens with
  Enter and its items are reached with the Down arrow (the UIkit keyboard pattern); Tab moves to the
  next navbar item.
- [ ] 3.3.1 Error Identification: the errors of a group of checkboxes or radios are printed in the status
  messages, not linked to the group.
- [ ] 2.2.3 No Timing, 2.2.4 Interruptions, 2.2.5 Re-authenticating, 2.2.6 Timeouts: sessions, CAPTCHAs,
  countdowns and notifications of the site.
- [ ] 2.3.2 Three Flashes: videos and animations of the content.
- [ ] 2.4.8 Location: breadcrumbs or the current menu item on every page (the theme styles them, the site
  must place the blocks).
- [ ] 2.4.9 Link Purpose (Link Only): link labels of the content and of the page layouts.
- [ ] 3.1.3 Unusual Words, 3.1.4 Abbreviations, 3.1.5 Reading Level, 3.1.6 Pronunciation.
- [ ] 3.2.5 Change on Request: the HTMX navigation only changes the page on a link or a form submission;
  check the modules that update the page on their own.
- [ ] 3.2.6 Consistent Help: the contact link, the help block or the chat stay at the same place on every
  page, with the page layouts too.
- [ ] 3.3.5 Help and 3.3.6 Error Prevention (All): help texts and confirmation steps of the forms.

## Tests

The `tests` folder holds the [webship-js](https://www.npmjs.com/package/webship-js) suite (Cucumber and
Playwright). The features run against a Drupal site with Webtheme as the default theme:

```shell
npm install
LAUNCH_URL=https://webtheme.ddev.site DRUPAL_PROJECT_DIR=~/workspace/test/webtheme \
  npx -y node@22 ./node_modules/.bin/cucumber-js --config cucumber.js
```

The features check the UIkit markup, not the content of a site: they pass on a site installed with the
`standard` profile (the CI) and on a site template with Display Builder page layouts, its own menus and
the administration theme on the user pages.

- The page template of the theme is checked on a page not found, always rendered by the block layout.
- The login and password scenarios are skipped when another theme renders those pages (Web Admin shows
  them in UIkit Admin): HTMX loads them in full there, which a scenario checks. The contact webform shows
  the form classes of the theme on those sites.
- The scenarios tagged `@ui-skins` save the UI Skins settings of the theme and restore them after the
  scenario, even when it fails. The HTTP cache of the browser is off for them.
- A scenario is skipped when the site does not have what it checks: the Webform and Contact scenarios
  without the module, the password reset message when the page uses another theme.

The WCAG 2.2 AAA scenarios (`tests/features/05-02-01-wcag-aaa.feature`, tag `@aaa`):

- axe-core at level AAA on the front page, a page not found and the login form, in the light and the
  dark color modes;
- axe-core at level AAA on the stories of every component of the library, in both color modes;
- the links inside text are not shown by color alone, on the same pages;
- 44 by 44 pixel targets (a checkbox or a radio with its label) and a solid 2px focus ring at 3:1
  against its halo for every link, button and form control, and the reflow, at 1280, 768 and 320 pixels;
- the offcanvas menu with the keyboard only: the toggle opens it, the focus moves into it, Escape closes
  it and gives the focus back to the toggle; the same for the modal, offcanvas and dropdown components;
- nothing moves when reduced motion is requested.

`tests/features/05-01-01-accessibility.feature` (tag `@a11y`) runs the structural checks and axe at level
AA. Run one group with a tag: `--tags @aaa`.

The custom steps are in `tests/step-definitions/webtheme.steps.js`; `DRUSH` (default `ddev drush`) runs
Drush from `DRUPAL_PROJECT_DIR`.

## Update from UI Suite UIkit

Generate the theme again with the new UI Suite UIkit and compare:

```shell
php core/scripts/dr generate-theme webtheme --starterkit ui_suite_uikit --path themes/custom
```
