/**
 * @file
 * Keyboard and motion adjustments of the UIkit components.
 *
 * - Dropdowns and the lightbox give the focus back to their toggle when they
 *   close, with Escape too (WCAG 2.4.3).
 * - The lightbox is named for screen readers (4.1.2).
 * - Slideshows and sliders that play automatically get a pause button, and do
 *   not play when reduced motion is requested (2.2.2, 2.3.3).
 */
((Drupal, once) => {
  let lightboxToggle = null;

  /**
   * Gets the UIkit drop or dropdown component of an element.
   */
  function getDrop(el) {
    if (!window.UIkit) {
      return null;
    }
    return (
      window.UIkit.getComponent(el, "dropdown") ||
      window.UIkit.getComponent(el, "drop")
    );
  }

  /**
   * Gives the focus back to a toggle when it was lost in the closed element.
   */
  function restoreFocus(closed, toggle) {
    const active = document.activeElement;
    if (
      toggle &&
      toggle.isConnected &&
      (!active || active === document.body || closed.contains(active))
    ) {
      toggle.focus();
    }
  }

  document.addEventListener("hidden", (event) => {
    const el = event.target;
    if (!(el instanceof Element)) {
      return;
    }
    if (el.matches(".uk-dropdown, .uk-drop")) {
      const drop = getDrop(el);
      restoreFocus(el, drop && drop.targetEl);
    } else if (el.matches(".uk-lightbox")) {
      restoreFocus(el, lightboxToggle);
      lightboxToggle = null;
    }
  });

  document.addEventListener("beforeshow", (event) => {
    const el = event.target;
    if (el instanceof Element && el.matches(".uk-lightbox")) {
      if (!lightboxToggle && document.activeElement !== document.body) {
        lightboxToggle = document.activeElement;
      }
      el.setAttribute("aria-label", Drupal.t("Media viewer"));
    }
  });

  // The link that opens a lightbox, also when it is clicked.
  document.addEventListener("click", (event) => {
    const link =
      event.target instanceof Element &&
      event.target.closest("[uk-lightbox] a, a[data-type], a[data-caption]");
    if (link) {
      lightboxToggle = link;
    }
  });

  /**
   * Autoplay pause button of the slideshows and sliders.
   */
  Drupal.behaviors.webthemeAutoplay = {
    attach(context) {
      once(
        "webtheme-autoplay",
        "[data-webtheme-autoplay-toggle]",
        context,
      ).forEach((button) => {
        const root = button.closest("[uk-slideshow], [uk-slider]");
        if (!root || !window.UIkit) {
          return;
        }
        const name = root.hasAttribute("uk-slideshow") ? "slideshow" : "slider";
        const setPlaying = (playing) => {
          const component = window.UIkit[name](root);
          component.autoplay = playing;
          if (playing) {
            component.startAutoplay();
          } else {
            component.stopAutoplay();
          }
          const list = root.querySelector(`.uk-${name}-items`);
          if (list) {
            list.setAttribute("aria-live", playing ? "off" : "polite");
          }
          button.dataset.webthemeAutoplayToggle = playing
            ? "playing"
            : "paused";
          button.textContent = playing ? Drupal.t("Pause") : Drupal.t("Play");
        };
        button.addEventListener("click", () =>
          setPlaying(button.dataset.webthemeAutoplayToggle === "paused"),
        );
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setPlaying(false);
        }
      });
    },
  };
})(Drupal, once);
