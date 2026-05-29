# Views mini pager

`webtheme:views-mini-pager`

Compact pager for Views: previous / current / next. Uses the same pager / pager__item BEM classes as the full pager so styles share.

## Files

- `views-mini-pager.component.yml` — component metadata (schema, props, slots).
- `views-mini-pager.twig` — markup.

## Props
- `heading_id`
- `items`

## Slots
_None._

## Used by

- `templates/views/views-mini-pager.html.twig`

## Usage

```twig
{{ include('webtheme:views-mini-pager', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
