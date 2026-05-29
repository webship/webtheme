# Page title

`webtheme:page-title`

The page <h1>. Wraps the title with the theme's title/page-title classes and exposes prefix/suffix slots for module-injected output (shortcuts, contextual links).

## Files

- `page-title.component.yml` — component metadata (schema, props, slots).
- `page-title.twig` — markup.

## Props
- `title_attributes`

## Slots
- `title_prefix`
- `title`
- `title_suffix`

## Used by

- `templates/content/page-title.html.twig`

## Usage

```twig
{{ include('webtheme:page-title', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
