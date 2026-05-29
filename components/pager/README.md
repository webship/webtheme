# Pager

`webtheme:pager`

Paginated navigation control (first / previous / numbered pages / next / last) with SVG arrow controls. Mirrors core's pager data structure.

## Files

- `pager.component.yml` — component metadata (schema, props, slots).
- `pager.twig` — markup.

## Props
- `heading_id`
- `items`
- `current`
- `ellipses`

## Slots
_None._

## Used by

- `templates/navigation/pager.html.twig`

## Usage

```twig
{{ include('webtheme:pager', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
