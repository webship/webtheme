# Views view grid

`webtheme:views-view-grid`

Grid wrapper for Views (horizontal or vertical alignment, up to 8 cols). Outputs the views-view-grid / views-view-grid--{alignment} / cols-{n} classes the webtheme layout CSS targets.

## Files

- `views-view-grid.component.yml` — component metadata (schema, props, slots).
- `views-view-grid.twig` — markup.

## Props
- `title`
- `options`
- `items`

## Slots
_None._

## Used by

- `templates/views/views-view-grid.html.twig`

## Usage

```twig
{{ include('webtheme:views-view-grid', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
