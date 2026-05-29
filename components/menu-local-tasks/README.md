# Menu local tasks

`webtheme:menu-local-tasks`

Primary + secondary admin tabs (Drupal's "local tasks"). Renders two <nav class="tabs-wrapper"> blocks, each carrying a screen-reader heading and a list with the .tabs / .tabs--primary / .tabs--secondary classes the live webship.co styles target. The data-drupal-nav-tabs hook is the JS handle used by core's tabs.js to collapse the wrapper into a drawer on narrow viewports.

## Files

- `menu-local-tasks.component.yml` — component metadata (schema, props, slots).
- `menu-local-tasks.twig` — markup.

## Props
_None._

## Slots
- `primary`
- `secondary`

## Used by

- `templates/navigation/menu-local-tasks.html.twig`

## Usage

```twig
{{ include('webtheme:menu-local-tasks', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
