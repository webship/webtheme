# Social bar

`webtheme:social-bar`

Fixed, rotated social sidebar used by the "social" region. Wraps its content in the social-bar__inner / rotate structure the theme CSS and the navigation-utils.js intersection observer expect.

## Files

- `social-bar.component.yml` — component metadata (schema, props, slots).
- `social-bar.twig` — markup.

## Props
_None._

## Slots
- `content`

## Used by

- `templates/layout/region--social.html.twig`

## Usage

```twig
{{ include('webtheme:social-bar', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
