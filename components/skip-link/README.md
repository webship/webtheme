# Skip link

`webtheme:skip-link`

Accessibility skip-to-content link. The first focusable element on the page; lets keyboard and screen-reader users jump straight to the main content region.

## Files

- `skip-link.component.yml` — component metadata (schema, props, slots).
- `skip-link.twig` — markup.

## Props
- `href`
- `label`

## Slots
_None._

## Used by

- `templates/layout/html.html.twig`

## Usage

```twig
{{ include('webtheme:skip-link', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
