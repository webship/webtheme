# Username

`webtheme:username`

Username token — rendered as an <a> when link_path is set, otherwise a <span>. Mirrors core's theme_username() variable contract.

## Files

- `username.component.yml` — component metadata (schema, props, slots).
- `username.twig` — markup.

## Props
- `name`
- `extra`
- `link_path`

## Slots
_None._

## Used by

- `templates/user/username.html.twig`

## Usage

```twig
{{ include('webtheme:username', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
