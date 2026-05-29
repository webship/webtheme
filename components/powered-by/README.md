# Powered by

`webtheme:powered-by`

"Powered by Drupal" attribution with the Drupal logo mark. Rendered by the system_powered_by_block.

## Files

- `powered-by.component.yml` — component metadata (schema, props, slots).
- `powered-by.twig` — markup.

## Props
_None._

## Slots
_None._

## Used by

- `templates/block/block--system-powered-by-block.html.twig`

## Usage

```twig
{{ include('webtheme:powered-by', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
