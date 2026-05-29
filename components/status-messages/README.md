# Status messages

`webtheme:status-messages`

Drupal status / error / warning / info messages grouped by type, with per-type icons and an assistive-technology heading. Rendered into the data-drupal-messages region so HTMX/AJAX swaps can update it in place.

## Files

- `status-messages.component.yml` — component metadata (schema, props, slots).
- `status-messages.twig` — markup.

## Props
- `message_list`
- `status_headings`

## Slots
_None._

## Used by

- `templates/misc/status-messages.html.twig`

## Usage

```twig
{{ include('webtheme:status-messages', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
