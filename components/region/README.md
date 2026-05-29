# Region

`webtheme:region`

Generic region wrapper. Emits a div (or aside) with the region / region--{name} classes plus any modifier classes. The wrapper is a natural HTMX swap target (hx-target="#region-…") for partial updates.

## Files

- `region.component.yml` — component metadata (schema, props, slots).
- `region.twig` — markup.

## Props
- `region`
- `wrapper`
- `enum`
- `modifier_classes`
- `items`

## Slots
- `content`

## Used by

- `templates/layout/region--breadcrumb.html.twig`
- `templates/layout/region--content-above.html.twig`
- `templates/layout/region--content-below.html.twig`
- `templates/layout/region--content.html.twig`
- `templates/layout/region--footer-bottom.html.twig`
- `templates/layout/region--footer-top.html.twig`
- `templates/layout/region--highlighted.html.twig`
- `templates/layout/region--sidebar.html.twig`
- `templates/layout/region.html.twig`

## Usage

```twig
{{ include('webtheme:region', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
