# Menu

`webtheme:menu`

Recursive nested menu (BEM menu/menu__item/menu__link classes, level modifiers, active-trail + has-children states). Renders the full tree via an internal macro. Used for the main and footer menus.

## Files

- `menu.component.yml` — component metadata (schema, props, slots).
- `menu.twig` — markup.

## Props
- `menu_name`
- `items`

## Slots
_None._

## Used by

- `templates/navigation/menu.html.twig`

## Usage

```twig
{{ include('webtheme:menu', { /* props */ }, with_context = false) }}
```

The matching theme template above delegates its markup to this component, so
overriding the component changes the rendered output everywhere it is used.
The markup mirrors the original Webtheme template it replaced, preserving the
existing class names and JS hooks (the theme is in production on webship.co).
