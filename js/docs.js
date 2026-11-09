/**
 * @file
 * The documentation pages: the side navigation, "On this page", the code blocks, the search and
 * the light-or-dark switch. Everything reads the page as rendered; nothing here needs a module.
 */
((Drupal, once) => {
  const THEME_KEY = 'webtheme.docs.theme';
  const INDEX_URL = '/docs/index.json?_format=json';

  /** A heading's words, without the hidden ones a link icon adds. */
  function headingText(heading) {
    const copy = heading.cloneNode(true);
    copy
      .querySelectorAll('.visually-hidden, .ext, svg')
      .forEach((el) => el.remove());
    return (copy.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /** A heading's id from its words, unique on the page. */
  function slugFor(heading, taken) {
    const base =
      (headingText(heading) || 'section')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'section';
    let slug = base;
    let n = 2;
    while (taken.has(slug) || document.getElementById(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    taken.add(slug);
    return slug;
  }

  /** The side navigation: sections open and close, the page being read is marked and scrolled to. */
  function sideNavigation(docs) {
    const nav = docs.querySelector('[data-docs-nav]');
    if (!nav) {
      return;
    }
    nav.addEventListener('click', (event) => {
      const toggle = event.target.closest('.docs-nav__toggle');
      if (!toggle) {
        return;
      }
      const item = toggle.closest('.docs-nav__item');
      const open = !item.hasAttribute('data-open');
      item.toggleAttribute('data-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    const here = window.location.pathname.replace(/\/$/, '') || '/';
    const current = [...nav.querySelectorAll('.docs-nav__link')].find(
      (link) => {
        const path =
          new URL(link.href, window.location.href).pathname.replace(
            /\/$/,
            '',
          ) || '/';
        return path === here;
      },
    );
    if (current) {
      current.classList.add('is-current');
      current.setAttribute('aria-current', 'page');
      let item = current.closest('.docs-nav__item');
      while (item) {
        if (item.classList.contains('docs-nav__item--section')) {
          item.setAttribute('data-open', '');
          const toggle = item.querySelector(
            ':scope > .docs-nav__row > .docs-nav__toggle',
          );
          if (toggle) {
            toggle.setAttribute('aria-expanded', 'true');
          }
        }
        item = item.parentElement.closest('.docs-nav__item');
      }
      const sidebar = docs.querySelector('.docs-sidebar');
      if (sidebar) {
        const top =
          current.getBoundingClientRect().top -
          sidebar.getBoundingClientRect().top;
        if (top > sidebar.clientHeight - 80) {
          sidebar.scrollTop = top - sidebar.clientHeight / 2;
        }
      }
    }
    const drawer = docs.querySelector('[data-docs-sidebar-toggle]');
    if (drawer) {
      drawer.addEventListener('click', () => {
        const open = !docs.classList.contains('is-nav-open');
        docs.classList.toggle('is-nav-open', open);
        drawer.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', (event) => {
        if (
          docs.classList.contains('is-nav-open') &&
          !event.target.closest('.docs-sidebar, [data-docs-sidebar-toggle]')
        ) {
          docs.classList.remove('is-nav-open');
          drawer.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /** "On this page": the article's h2 and h3 headings, the one in view marked as the page scrolls. */
  function onThisPage(docs) {
    const toc = docs.querySelector('[data-docs-toc]');
    const article = docs.querySelector('[data-docs-article]');
    if (!toc || !article) {
      return;
    }
    const headings = [
      ...article.querySelectorAll('.text-content h2, .text-content h3'),
    ].filter((h) => headingText(h));
    if (headings.length < 2) {
      docs.classList.add('has-no-toc');
      return;
    }
    const taken = new Set();
    const list = document.createElement('ul');
    list.className = 'docs-toc__list';
    const links = new Map();
    headings.forEach((heading) => {
      if (!heading.id) {
        heading.id = slugFor(heading, taken);
      }
      const item = document.createElement('li');
      item.className = `docs-toc__item docs-toc__item--level-${
        heading.tagName === 'H2' ? 2 : 3
      }`;
      const link = document.createElement('a');
      link.className = 'docs-toc__link';
      link.href = `#${heading.id}`;
      link.textContent = headingText(heading);
      item.appendChild(link);
      list.appendChild(item);
      links.set(heading, link);
    });
    toc.appendChild(list);
    let active = null;
    const mark = (heading) => {
      if (active) {
        active.classList.remove('is-active');
      }
      active = links.get(heading) || null;
      if (active) {
        active.classList.add('is-active');
      }
    };
    if ('IntersectionObserver' in window) {
      const visible = new Set();
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visible.add(entry.target);
            } else {
              visible.delete(entry.target);
            }
          });
          const first = headings.find((h) => visible.has(h));
          if (first) {
            mark(first);
          }
        },
        { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
      );
      headings.forEach((h) => observer.observe(h));
    }
    mark(headings[0]);
  }

  /** Every code block gets a bar with its language and a copy button, and its colours. */
  function codeBlocks(docs) {
    const article = docs.querySelector('[data-docs-article]');
    if (!article) {
      return;
    }
    article.querySelectorAll('pre').forEach((pre) => {
      if (pre.closest('.docs-code')) {
        return;
      }
      const code = pre.querySelector('code');
      const match = code && /language-([\w-]+)/.exec(code.className);
      const lang = match ? match[1] : '';
      const wrap = document.createElement('div');
      wrap.className = 'docs-code';
      const bar = document.createElement('div');
      bar.className = 'docs-code__bar';
      const label = document.createElement('span');
      label.className = 'docs-code__lang';
      label.textContent = lang;
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'docs-code__copy';
      copy.textContent = Drupal.t('Copy');
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText((code || pre).textContent);
          copy.textContent = Drupal.t('Copied');
          copy.classList.add('is-done');
          setTimeout(() => {
            copy.textContent = Drupal.t('Copy');
            copy.classList.remove('is-done');
          }, 1600);
        } catch (e) {
          copy.textContent = Drupal.t('Select and copy');
        }
      });
      bar.append(label, copy);
      pre.parentNode.insertBefore(wrap, pre);
      wrap.append(bar, pre);
      if (code && lang && window.hljs && window.hljs.getLanguage(lang)) {
        window.hljs.highlightElement(code);
      }
    });
  }

  /** Light or dark: the reader's choice, kept in this browser. */
  function themeSwitch(docs) {
    const button = docs.querySelector('[data-docs-theme-toggle]');
    if (!button) {
      return;
    }
    const root = document.documentElement;
    const sync = () =>
      button.setAttribute(
        'aria-pressed',
        root.getAttribute('data-theme') === 'dark' ? 'true' : 'false',
      );
    sync();
    button.addEventListener('click', () => {
      const dark = root.getAttribute('data-theme') !== 'dark';
      if (dark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
      try {
        localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
      } catch (e) {
        // A browser that keeps nothing still switches for this page.
      }
      sync();
    });
  }

  /** The search: the pages of the documentation, filtered as you type; Enter opens the selected one. */
  function search(docs) {
    const dialog = document.querySelector('[data-docs-search]');
    const openers = docs.querySelectorAll('[data-docs-search-open]');
    if (!dialog || typeof dialog.showModal !== 'function') {
      return;
    }
    const input = dialog.querySelector('.docs-search__input');
    const results = dialog.querySelector('[data-docs-search-results]');
    const form = dialog.querySelector('form');
    let index = null;
    let selected = -1;
    let shown = [];

    const decodeHtml = (text) => {
      const box = document.createElement('textarea');
      box.innerHTML = text;
      return box.value;
    };

    /** The pages from the index the site serves, else from the side navigation itself. */
    async function load() {
      if (index) {
        return index;
      }
      try {
        const response = await fetch(INDEX_URL, {
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const rows = await response.json();
          if (Array.isArray(rows) && rows.length) {
            // The section a page is in comes from the side navigation: the top entry above its link.
            const sections = new Map();
            docs
              .querySelectorAll('.docs-nav__item--level-1')
              .forEach((item) => {
                const top = item.querySelector('.docs-nav__link--level-1');
                const name = top ? top.textContent.trim() : '';
                item.querySelectorAll('.docs-nav__link').forEach((link) => {
                  if (link !== top) {
                    sections.set(
                      new URL(link.href, window.location.href).pathname,
                      name,
                    );
                  }
                });
              });
            index = rows
              .map((row) => ({
                title: decodeHtml(String(row.title || '')).trim(),
                url: String(row.url || row.path || ''),
                section: decodeHtml(
                  String(
                    row.section ||
                      row.parent ||
                      sections.get(String(row.url || '').split('?')[0]) ||
                      '',
                  ),
                ).trim(),
                excerpt: decodeHtml(
                  String(row.excerpt || row.summary || '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' '),
                ).trim(),
              }))
              .filter((row) => row.title && row.url);
            return index;
          }
        }
      } catch (e) {
        // No index: the navigation is the index.
      }
      index = [...docs.querySelectorAll('.docs-nav__link')].map((link) => {
        const section = link.closest('.docs-nav__item--level-1');
        const sectionLink = section
          ? section.querySelector('.docs-nav__link--level-1')
          : null;
        return {
          title: link.textContent.trim(),
          url: link.getAttribute('href'),
          section:
            sectionLink && sectionLink !== link
              ? sectionLink.textContent.trim()
              : '',
          excerpt: '',
        };
      });
      return index;
    }

    const escapeHtml = (s) =>
      s.replace(
        /[&<>"']/g,
        (c) =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          }[c]),
      );
    const highlight = (text, words) => {
      let html = escapeHtml(text);
      words.forEach((word) => {
        const re = new RegExp(
          `(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
          'ig',
        );
        html = html.replace(re, '<mark>$1</mark>');
      });
      return html;
    };

    function select(i) {
      if (i === selected || i < 0 || i >= shown.length) {
        return;
      }
      if (results.children[selected]) {
        results.children[selected].classList.remove('is-selected');
      }
      selected = i;
      results.children[selected].classList.add('is-selected');
      results.children[selected].scrollIntoView({ block: 'nearest' });
    }

    function render(rows, words) {
      results.innerHTML = '';
      shown = rows;
      selected = rows.length ? 0 : -1;
      if (!rows.length) {
        const empty = document.createElement('li');
        empty.className = 'docs-search__empty';
        empty.textContent = words.length
          ? Drupal.t('No page matches. Enter searches the whole site.')
          : Drupal.t('Type to find a page.');
        results.appendChild(empty);
        return;
      }
      rows.forEach((row, i) => {
        const item = document.createElement('li');
        item.className = `docs-search__result${
          i === selected ? ' is-selected' : ''
        }`;
        item.setAttribute('role', 'option');
        item.innerHTML =
          `<a class="docs-search__link" href="${escapeHtml(row.url)}">` +
          `<span class="docs-search__result-title">${highlight(
            row.title,
            words,
          )}</span>${
            row.section
              ? `<span class="docs-search__result-section">${escapeHtml(
                  row.section,
                )}</span>`
              : ''
          }${
            row.excerpt
              ? `<span class="docs-search__result-excerpt">${highlight(
                  row.excerpt.slice(0, 160),
                  words,
                )}</span>`
              : ''
          }</a>`;
        item.addEventListener('mousemove', () => select(i));
        results.appendChild(item);
      });
    }

    async function update() {
      const rows = await load();
      const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) {
        render([], words);
        return;
      }
      const scored = [];
      rows.forEach((row) => {
        const title = row.title.toLowerCase();
        const rest = `${row.section} ${row.excerpt}`.toLowerCase();
        let score = 0;
        const every = words.every((word) => {
          if (title.includes(word)) {
            score += title.startsWith(word) ? 3 : 2;
            return true;
          }
          if (rest.includes(word)) {
            score += 1;
            return true;
          }
          return false;
        });
        if (!every) {
          score = 0;
        }
        if (score) {
          scored.push({ row, score });
        }
      });
      scored.sort(
        (a, b) => b.score - a.score || a.row.title.localeCompare(b.row.title),
      );
      render(
        scored.slice(0, 12).map((s) => s.row),
        words,
      );
    }

    function open() {
      dialog.showModal();
      input.focus();
      input.select();
      update();
    }

    openers.forEach((button) => button.addEventListener('click', open));
    dialog
      .querySelector('[data-docs-search-close]')
      .addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
    input.addEventListener('input', update);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && selected >= 0 && shown[selected]) {
        event.preventDefault();
        window.location.href = shown[selected].url;
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        select(selected + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        select(selected - 1);
      }
    });
    form.addEventListener('submit', (event) => {
      if (selected >= 0 && shown[selected]) {
        event.preventDefault();
        window.location.href = shown[selected].url;
      }
    });
    document.addEventListener('keydown', (event) => {
      const typing =
        /^(input|textarea|select)$/i.test(event.target.tagName) ||
        event.target.isContentEditable;
      if (
        (event.key === 'k' || event.key === 'K') &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        if (dialog.open) {
          dialog.close();
        } else {
          open();
        }
      } else if (event.key === '/' && !typing && !dialog.open) {
        event.preventDefault();
        open();
      }
    });
  }

  Drupal.behaviors.webthemeDocs = {
    attach(context) {
      once('webtheme-docs', '.docs', context).forEach((docs) => {
        sideNavigation(docs);
        onThisPage(docs);
        codeBlocks(docs);
        themeSwitch(docs);
        search(docs);
      });
    },
  };
})(Drupal, once);
