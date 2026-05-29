# Webtheme Single-Directory Components

Single-Directory Components (SDC) for the Webtheme theme. Each subfolder is one component (`<name>.component.yml` + `<name>.twig`) that the matching theme template in `../templates/` delegates to via `{% include 'webtheme:<name>' %}` / `{% embed %}`. The markup mirrors the theme's original templates, preserving class names and JS hooks (the theme runs in production on webship.co). See each component's own `README.md` for its props, slots, and the template(s) that use it.
