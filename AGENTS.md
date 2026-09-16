# Webtheme

The theme of the Webship.co portal site, generated from UI Suite UIkit: SDC components, UIkit and HTMX, with the Webship.co colors and design.

Part of Webship: the UI Suite UIkit theme (UIkit and HTMX) on top of Drupal and
Display Builder.

## Build and test with DDEV

Everything runs through DDEV. Never a host `composer`, `drush`, `php` or `mysql`:

```bash
ddev composer require drupal/something
ddev drush cr
ddev export-db --file=backup.sql.gz
ddev delete -y -O
```

`ddev start` takes `-y`; `ddev stop` does not. Never write a `$databases` block
into `settings.php`: DDEV owns the database connection.

If a `ddev composer` or `ddev drush` command hangs, it is waiting on an open
stdin. Add `< /dev/null`.

## Recipes

A recipe installs its modules with the config installer in syncing mode, so
config entities from a module's `config/install` are not created. Two things
follow:

- A module's `hook_install()` does not get to apply its own recipe. List the
  sibling recipe explicitly in the recipe that needs it.
- Config entities that a module ships (shortcut sets, blocks, image styles)
  need an explicit `config.import` entry.

Guard install hooks so a config import does not run them twice:

```php
function mymodule_install($is_syncing) {
  // Configuration imports bring their own configuration.
  if (\Drupal::isConfigSyncing()) {
    return;
  }
}
```

## Code style

- Hooks are OOP `#[Hook]` classes. Only `install`, `uninstall`, `schema`,
  `update` and `post_update` hooks stay procedural.
- Prefer the Form API, CSS and core HTMX over custom JavaScript.
- Tests build their destinations with `Url::fromRoute()`: CI serves the site
  under `/web/`.

## Issues and merge requests

- Work on an issue fork, never a personal fork, and never commit to the
  canonical branch.
- Keep issues and merge requests short and readable. Write for people.
- Every merge request ends with the Checkpoints checklist and the
  `AI-Generated: Yes` disclosure when it applies.
- Commit messages follow the drupal.org commit types:
  `type: #issue Short summary`.
- A merge request is ready when its pipeline is green, cspell and phpcs
  included.

## Releases

- Tag only a commit that already carries the release constraints, then move the
  branch back to the dev constraints afterwards.
- A drupal.org release node is what publishes a package. Without a release, a
  project is invisible to Composer.
- The `packages.drupal.org` endpoint lags. Trust the composer CI job instead.
