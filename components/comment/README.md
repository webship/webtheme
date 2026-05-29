# Comment

`webtheme:comment`

Threaded comment with avatar, author/time meta, optional title, and the comment body. Matches the original webtheme markup (comment__picture / comment__text-content / comment__meta classes) so the live webship.co styles keep working.

## Files

- `comment.component.yml` — component metadata (schema, props, slots).
- `comment.twig` — markup.

## Props
- `extra_classes`
- `items`
- `user_picture`
- `author`
- `created`
- `parent`
- `title`
- `title_attributes`
- `content_attributes`

## Slots
- `title_prefix`
- `title_suffix`
- `content`

## Used by

- `templates/content/comment.html.twig`

## Usage

```twig
{{ include('webtheme:comment', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
