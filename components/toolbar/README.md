# Toolbar

`webtheme:toolbar`

Administrative toolbar with tabs and tray panels. Mirrors core's template_preprocess_toolbar variable contract.

## Files

- `toolbar.component.yml` — component metadata (schema, props, slots).
- `toolbar.twig` — markup.

## Props
- `toolbar_attributes`
- `toolbar_heading`
- `tabs`
- `trays`
- `remainder`

## Slots
_None._

## Used by

- `templates/navigation/toolbar.html.twig`

## Usage

```twig
{{ include('webtheme:toolbar', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
