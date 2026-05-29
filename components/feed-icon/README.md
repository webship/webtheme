# Feed icon

`webtheme:feed-icon`

RSS feed link with a feed-icon SVG. Rendered as <a class="feed-icon"> with a screen-reader label and the rss.svg image.

## Files

- `feed-icon.component.yml` — component metadata (schema, props, slots).
- `feed-icon.twig` — markup.

## Props
- `url`
- `title`

## Slots
_None._

## Used by

- `templates/misc/feed-icon.html.twig`

## Usage

```twig
{{ include('webtheme:feed-icon', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
