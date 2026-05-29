# Site branding

`webtheme:site-branding`

Site logo + site name lockup that links home. Rendered by the system_branding_block; each part appears only when enabled in the block configuration.

## Files

- `site-branding.component.yml` — component metadata (schema, props, slots).
- `site-branding.twig` — markup.

## Props
- `site_logo`
- `site_name`
- `front_url`
- `bg`
- `enum`

## Slots
_None._

## Used by

- `templates/block/block--system-branding-block.html.twig`

## Usage

```twig
{{ include('webtheme:site-branding', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
