# Webtheme

A theme generated from [UI Suite UIkit](https://www.drupal.org/project/ui_suite_uikit): single directory components
(SDC) built with [UIkit](https://getuikit.com), [HTMX](https://htmx.org) navigation, UI Skins, UI Styles and UI Icons,
ready for [Display Builder](https://www.drupal.org/project/display_builder).

## Customize

- Colors and fonts: the CSS variables in `assets/css/tokens.css`, and the UI Skins settings in
  `webtheme.ui_skins.css_variables.yml` and `webtheme.ui_skins.themes.yml`.
- Components: the `components` folder. Each component has its `*.component.yml`, Twig template and stories.
- Utilities: `webtheme.ui_styles.yml`.
- Theme settings: Appearance > Webtheme (UIkit from the CDN or local libraries, sticky navbar, HTMX
  navigation).

## Update from UI Suite UIkit

Generate the theme again with the new UI Suite UIkit and compare:

```shell
php core/scripts/dr generate-theme webtheme --starterkit ui_suite_uikit --path themes/custom
```
