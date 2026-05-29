# Details

`webtheme:details`

Native <details>/<summary> disclosure with Drupal's webtheme-details / details-wrapper class hooks and the form-required marker. The summary is hidden when no title is given.

## Files

- `details.component.yml` — component metadata (schema, props, slots).
- `details.twig` — markup.

## Props
- `title`
- `summary_attributes`
- `content_attributes`
- `required`
- `description`
- `errors`
- `children`
- `value`

## Slots
_None._

## Used by

- `templates/form/details.html.twig`

## Usage

```twig
{{ include('webtheme:details', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
