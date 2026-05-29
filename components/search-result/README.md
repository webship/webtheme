# Search result

`webtheme:search-result`

Single result row inside the search-results listing. Mirrors core's search_result variable contract (info_split.user / info_date, title with url, optional snippet).

## Files

- `search-result.component.yml` — component metadata (schema, props, slots).
- `search-result.twig` — markup.

## Props
- `url`
- `title`
- `title_attributes`
- `content_attributes`
- `info_split`
- `info_date`
- `snippet`
- `layout`

## Slots
- `title_prefix`
- `title_suffix`

## Used by

- `templates/content/search-result.html.twig`

## Usage

```twig
{{ include('webtheme:search-result', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
