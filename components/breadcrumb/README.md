# Breadcrumb

`webtheme:breadcrumb`

Breadcrumb trail. Each item is { text, url }; items without a url render as plain text (the current page).

## Files

- `breadcrumb.component.yml` — component metadata (schema, props, slots).
- `breadcrumb.twig` — markup.

## Props
- `breadcrumb`
- `items`

## Slots
_None._

## Used by

- `templates/navigation/breadcrumb.html.twig`

## Usage

```twig
{{ include('webtheme:breadcrumb', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
