/* =====================================================================
   SimLab — nav.js
   ---------------------------------------------------------------------
   Shared chrome injected on EVERY page:
     • sticky header (logo, nav, Subjects mega-menu, search, theme, GitHub)
     • mobile slide-in drawer
     • global search overlay  (open with the search icon, "/" or Ctrl/⌘+K)
     • breadcrumbs (subject + simulation pages)
     • auto-generated footer sitemap
     • back-to-top button, scroll-reveal, toast messages

   Pages tell nav.js who they are with attributes on <body>:
     data-page="home | subjects | all | about | 404 | sim"
     data-subject="physics"      (subject pages & simulation pages)
     data-sim="projectile"       (simulation pages)

   Everything is built from catalog.js — load it BEFORE this file.
   Reusable helpers are exposed on SimLab.ui for main.js, subject.js
   and common.js.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.SimLab;
  var body = document.body;
  var PAGE = body.dataset.page || '';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------------------
     Small utilities
     ------------------------------------------------------------------- */
  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function h(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* Inline SVG icon set (stroke icons, 24×24) */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    left: '<path d="M15 18l-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none"/>',
    step: '<path d="M5 5v14l9-7z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    sound: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    github: '<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }
  var LOGO =
    '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><defs><linearGradient id="lg-logo" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#c084fc"/></linearGradient></defs>' +
    '<rect x="1" y="1" width="30" height="30" rx="9" fill="url(#lg-logo)"/>' +
    '<ellipse cx="16" cy="16" rx="10" ry="4.2" fill="none" stroke="#fff" stroke-width="1.8" transform="rotate(30 16 16)"/>' +
    '<ellipse cx="16" cy="16" rx="10" ry="4.2" fill="none" stroke="#fff" stroke-width="1.8" transform="rotate(-30 16 16)"/>' +
    '<circle cx="16" cy="16" r="2.6" fill="#fff"/></svg>';

  /* Accent color helper: returns an inline style string */
  function accent(subjOrId) {
    var s = typeof subjOrId === 'string' ? S.getSubject(subjOrId) : subjOrId;
    return s ? '--accent:' + s.color + ';' : '';
  }

  /* -------------------------------------------------------------------
     Reusable renderers (used by main.js / subject.js / common.js)
     ------------------------------------------------------------------- */
  function levelBadge(level) {
    return '<span class="badge badge-level" data-level="' + esc(level) + '">' + esc(level) + '</span>';
  }

  /** Full simulation card. Coming-soon cards are not links. */
  function simCard(sim, opts) {
    opts = opts || {};
    var subj = S.getSubject(sim.subject);
    var branch = S.getBranch(sim.subject, sim.branch);
    var live = S.isLive(sim);
    var head = opts.headingLevel || 3;
    var thumbBadges = (S.isNew(sim) ? '<span class="badge badge-new">New</span>' : '') +
      (!live ? '<span class="badge badge-soon">Coming soon</span>' : '');
    var thumb =
      '<img src="' + esc(sim.thumbnail || '/assets/img/thumbs/default.svg') + '" alt="" loading="lazy" width="320" height="200">' +
      (live ? '<span class="play" aria-hidden="true"><span>' + icon('play') + '</span></span>' : '') +
      '<span class="thumb-badges">' + thumbBadges + '</span>';
    return (
      '<article class="sim-card' + (live ? '' : ' is-soon') + '" style="' + accent(subj) + '">' +
        '<div class="sim-thumb">' + thumb + '</div>' +
        '<div class="sim-body">' +
          '<div class="sim-meta">' +
            (opts.showSubject !== false && subj ? '<span class="badge badge-subject">' + subj.icon + ' ' + esc(subj.name) + '</span>' : '') +
            (branch ? '<span class="badge">' + esc(branch.name) + '</span>' : '') +
          '</div>' +
          '<h' + head + '>' + (live ? '<a href="' + esc(sim.link) + '">' + esc(sim.title) + '</a>' : esc(sim.title)) + '</h' + head + '>' +
          '<p>' + esc(sim.description) + '</p>' +
          '<div class="sim-foot">' + levelBadge(sim.level) +
            (live
              ? '<a class="btn btn-sm btn-primary" href="' + esc(sim.link) + '" tabindex="-1" aria-hidden="true">Open ' + icon('arrow') + '</a>'
              : '<span class="small muted">In the lab…</span>') +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  /** Subject card (landing grid). Coming-soon subjects render as <div>. */
  function subjectCard(subj) {
    var live = S.isSubjectLive(subj);
    var n = S.simsBySubject(subj.id, true).length;
    var planned = S.simsBySubject(subj.id).length - n;
    var tag = live ? 'a' : 'div';
    var countText = live
      ? n + ' simulation' + (n === 1 ? '' : 's') + (planned ? ' · ' + planned + ' more soon' : '')
      : 'Coming soon';
    return (
      '<' + tag + (live ? ' href="' + S.subjectUrl(subj.id) + '"' : ' aria-disabled="true"') +
        ' class="subject-card reveal' + (live ? '' : ' is-soon') + '" style="' + accent(subj) + '">' +
        '<div class="card-top"><span class="subject-icon" aria-hidden="true">' + subj.icon + '</span>' +
          (live ? '<span class="count">' + countText + '</span>' : '<span class="badge badge-soon">Coming soon</span>') +
        '</div>' +
        '<h3>' + esc(subj.name) + '</h3>' +
        '<p>' + esc(subj.tagline) + '</p>' +
        '<div class="branch-list">' + subj.branches.map(function (b) { return '<span>' + esc(b.name) + '</span>'; }).join('') + '</div>' +
        (live ? '<span class="go" aria-hidden="true">' + icon('arrow') + '</span>' : '') +
      '</' + tag + '>'
    );
  }

  /* -------------------------------------------------------------------
     Search engine (shared by the overlay and the landing quick search)
     ------------------------------------------------------------------- */
  function haystack(sim) {
    var subj = S.getSubject(sim.subject) || {};
    var br = S.getBranch(sim.subject, sim.branch) || {};
    return [sim.title, subj.name, br.name, sim.level, (sim.tags || []).join(' '), sim.description].join(' ').toLowerCase();
  }

  /** Returns [{type:'sim'|'subject', item, score}] best first. */
  function search(query, limit) {
    var q = String(query || '').toLowerCase().trim();
    if (!q) return [];
    var terms = q.split(/\s+/);
    var out = [];

    S.simulations.forEach(function (sim) {
      var hay = haystack(sim);
      if (!terms.every(function (t) { return hay.indexOf(t) !== -1; })) return;
      var title = sim.title.toLowerCase();
      var score = 0;
      terms.forEach(function (t) {
        if (title.indexOf(t) === 0) score += 12;
        else if (title.indexOf(t) !== -1) score += 8;
        if ((sim.tags || []).some(function (tag) { return tag.toLowerCase().indexOf(t) === 0; })) score += 4;
        score += 1;
      });
      if (S.isLive(sim)) score += 3;
      out.push({ type: 'sim', item: sim, score: score });
    });

    S.subjects.forEach(function (subj) {
      var hay = (subj.name + ' ' + subj.tagline + ' ' + subj.branches.map(function (b) { return b.name; }).join(' ')).toLowerCase();
      if (terms.every(function (t) { return hay.indexOf(t) !== -1; })) {
        out.push({ type: 'subject', item: subj, score: subj.name.toLowerCase().indexOf(q) === 0 ? 20 : 2 });
      }
    });

    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, limit || 8);
  }

  function highlight(text, query) {
    var safe = esc(text);
    String(query || '').trim().split(/\s+/).filter(Boolean).forEach(function (t) {
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      safe = safe.replace(re, '<mark>$1</mark>');
    });
    return safe;
  }

  function resultHtml(r, query, idx, idPrefix) {
    var id = idPrefix + '-opt-' + idx;
    if (r.type === 'subject') {
      var s = r.item, live = S.isSubjectLive(s);
      return '<li role="option" id="' + id + '" aria-selected="false">' +
        '<a class="result' + (live ? '' : ' is-soon') + '" href="' + S.subjectUrl(s.id) + '" style="' + accent(s) + '" tabindex="-1">' +
        '<span class="subject-icon" aria-hidden="true">' + s.icon + '</span>' +
        '<span class="result-body"><span class="result-title">' + highlight(s.name, query) + '</span>' +
        '<span class="result-meta">Subject · ' + (live ? S.simsBySubject(s.id, true).length + ' simulations' : 'Coming soon') + '</span></span></a></li>';
    }
    var sim = r.item, subj = S.getSubject(sim.subject), br = S.getBranch(sim.subject, sim.branch);
    var live = S.isLive(sim);
    var href = live ? sim.link : S.subjectUrl(sim.subject, sim.branch);
    return '<li role="option" id="' + id + '" aria-selected="false">' +
      '<a class="result' + (live ? '' : ' is-soon') + '" href="' + esc(href) + '" style="' + accent(subj) + '" tabindex="-1">' +
      '<img class="result-thumb" src="' + esc(sim.thumbnail) + '" alt="" loading="lazy">' +
      '<span class="result-body"><span class="result-title">' + highlight(sim.title, query) + '</span>' +
      '<span class="result-meta">' + esc(subj ? subj.name : '') + (br ? ' › ' + esc(br.name) : '') + ' · ' + esc(sim.level) +
      (live ? '' : ' · Coming soon') + '</span></span>' +
      (S.isNew(sim) ? '<span class="badge badge-new">New</span>' : '') + '</a></li>';
  }

  /**
   * Wire a text input to a results list with live results + keyboard navigation.
   * opts.emptyHtml: html shown when the query is empty (optional)
   * opts.hideWhenEmpty: hide the list if the query is empty
   */
  var searchCounter = 0;
  function attachSearch(input, list, opts) {
    opts = opts || {};
    var prefix = 'sr' + (++searchCounter);
    var active = -1;
    list.id = list.id || prefix + '-list';
    list.setAttribute('role', 'listbox');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('autocomplete', 'off');

    function options() { return $$('[role="option"]', list); }
    function setActive(i) {
      var opts2 = options();
      opts2.forEach(function (o, j) {
        o.setAttribute('aria-selected', j === i ? 'true' : 'false');
        o.firstElementChild.classList.toggle('is-active', j === i);
      });
      active = i;
      if (i >= 0 && opts2[i]) {
        input.setAttribute('aria-activedescendant', opts2[i].id);
        opts2[i].scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    }
    function render() {
      var q = input.value;
      active = -1;
      if (!q.trim()) {
        if (opts.hideWhenEmpty) { list.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
        list.innerHTML = opts.emptyHtml ? opts.emptyHtml() : '';
      } else {
        var results = search(q, opts.limit || 8);
        list.innerHTML = results.length
          ? results.map(function (r, i) { return resultHtml(r, q, i, prefix); }).join('')
          : '<li class="search-empty" role="presentation">No simulations match “' + esc(q) + '”. ' +
            '<a href="' + S.site.suggest + encodeURIComponent(q) + '" target="_blank" rel="noopener">Suggest it?</a></li>';
      }
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      setActive(options().length && q.trim() ? 0 : -1);
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', function () { if (input.value.trim() || !opts.hideWhenEmpty) render(); });
    input.addEventListener('keydown', function (e) {
      var o = options();
      if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) render(); setActive(Math.min(active + 1, o.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
      else if (e.key === 'Enter') {
        if (active >= 0 && o[active]) { e.preventDefault(); window.location.href = o[active].querySelector('a').href; }
      } else if (e.key === 'Escape' && opts.hideWhenEmpty && !list.hidden) {
        e.stopPropagation(); list.hidden = true; input.setAttribute('aria-expanded', 'false');
      }
    });
    list.addEventListener('mousemove', function (e) {
      var li = e.target.closest('[role="option"]');
      if (li) setActive(options().indexOf(li));
    });
    if (opts.hideWhenEmpty) {
      document.addEventListener('click', function (e) {
        if (!list.contains(e.target) && e.target !== input) { list.hidden = true; input.setAttribute('aria-expanded', 'false'); }
      });
    }
    return { render: render };
  }

  /* -------------------------------------------------------------------
     Header + mega-menu
     ------------------------------------------------------------------- */
  function current(section) {
    var map = { home: 'home', subjects: 'subjects', sim: 'subjects', all: 'all', about: 'about' };
    return map[PAGE] === section;
  }

  function megaMenuHtml() {
    var cols = S.subjects.map(function (s) {
      var live = S.isSubjectLive(s);
      var head = live
        ? '<a class="mega-col-head" href="' + S.subjectUrl(s.id) + '"><span class="subject-icon" aria-hidden="true">' + s.icon + '</span>' + esc(s.name) + '</a>'
        : '<div class="mega-col-head"><span class="subject-icon" aria-hidden="true">' + s.icon + '</span>' + esc(s.name) + ' <span class="badge badge-soon">Soon</span></div>';
      var items = s.branches.map(function (b) {
        return '<li>' + (live ? '<a href="' + S.subjectUrl(s.id, b.id) + '">' + esc(b.name) + '</a>' : '<span>' + esc(b.name) + '</span>') + '</li>';
      }).join('');
      return '<div class="mega-col' + (live ? '' : ' is-soon') + '" style="' + accent(s) + '">' + head + '<ul>' + items + '</ul></div>';
    }).join('');
    return '<div class="mega-grid">' + cols + '</div>' +
      '<div class="mega-foot"><span class="muted">' + S.liveSims().length + ' live simulations · more added regularly</span>' +
      '<a href="/simulations/">Browse all simulations →</a></div>';
  }

  function buildHeader() {
    var header = h(
      '<header class="site-header" id="site-header">' +
        '<div class="container header-inner">' +
          '<a class="logo" href="/" aria-label="' + esc(S.site.name) + ' home">' + LOGO + '<span>' + esc(S.site.name) + '</span></a>' +
          '<nav class="main-nav" aria-label="Main">' +
            '<ul>' +
              '<li><a class="nav-link" href="/"' + (current('home') ? ' aria-current="page"' : '') + '>Home</a></li>' +
              '<li class="has-mega">' +
                '<button class="nav-link' + (current('subjects') ? ' is-current' : '') + '" type="button" aria-expanded="false" aria-controls="mega-menu" id="mega-btn">Subjects ' + icon('chev', 'chev') + '</button>' +
                '<div class="mega-menu" id="mega-menu" hidden>' + megaMenuHtml() + '</div>' +
              '</li>' +
              '<li><a class="nav-link" href="/simulations/"' + (current('all') ? ' aria-current="page"' : '') + '>All Simulations</a></li>' +
              '<li><a class="nav-link" href="/about.html"' + (current('about') ? ' aria-current="page"' : '') + '>About</a></li>' +
            '</ul>' +
          '</nav>' +
          '<div class="header-actions">' +
            '<button class="icon-btn search-trigger" type="button" aria-label="Search simulations (press / or Ctrl+K)" data-open-search>' +
              icon('search') + '<kbd>/</kbd></button>' +
            '<button class="icon-btn theme-toggle" type="button" aria-label="Switch colour theme">' + icon('moon', 'icon-moon') + icon('sun', 'icon-sun') + '</button>' +
            '<a class="icon-btn" href="' + esc(S.site.github) + '" target="_blank" rel="noopener" aria-label="GitHub repository (opens in new tab)">' + icon('github') + '</a>' +
            '<button class="icon-btn menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="drawer">' + icon('menu') + '</button>' +
          '</div>' +
        '</div>' +
      '</header>'
    );
    body.insertBefore(header, body.firstChild);
    body.insertBefore(h('<a class="skip-link" href="#main">Skip to content</a>'), body.firstChild);

    // Blur background once the page scrolls
    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mega-menu: click to toggle, hover on desktop, Esc / outside click to close
    var btn = $('#mega-btn'), menu = $('#mega-menu'), li = btn.parentElement, hoverTimer, hoverOpenedAt = 0;
    function setMenu(open) {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function () {
      // If hovering just opened it, a click shouldn't immediately close it again
      if (Date.now() - hoverOpenedAt < 600) { setMenu(true); return; }
      setMenu(menu.hidden);
    });
    if (window.matchMedia('(hover: hover)').matches) {
      li.addEventListener('mouseenter', function () { clearTimeout(hoverTimer); if (menu.hidden) hoverOpenedAt = Date.now(); setMenu(true); });
      li.addEventListener('mouseleave', function () { hoverTimer = setTimeout(function () { setMenu(false); }, 180); });
    }
    document.addEventListener('click', function (e) { if (!li.contains(e.target)) setMenu(false); });
    li.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); btn.focus(); } });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) setMenu(false); });

    // Theme toggle
    $('.theme-toggle', header).addEventListener('click', function () {
      var next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      setTheme(next, true);
    });
  }

  /* -------------------------------------------------------------------
     Theme (dark default; remembers choice; respects system preference)
     The inline <head> script sets the initial theme to avoid a flash.
     ------------------------------------------------------------------- */
  function setTheme(theme, save) {
    document.documentElement.dataset.theme = theme;
    if (save) { try { localStorage.setItem('simlab-theme', theme); } catch (e) { /* storage blocked */ } }
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f7fb' : '#070b16');
    var btn = $('.theme-toggle');
    if (btn) btn.setAttribute('aria-label', 'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' theme');
    document.dispatchEvent(new CustomEvent('simlab:themechange', { detail: { theme: theme } }));
  }
  // Follow OS changes only if the user never chose manually
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
    var saved = null;
    try { saved = localStorage.getItem('simlab-theme'); } catch (err) { /* ignore */ }
    if (!saved) setTheme(e.matches ? 'light' : 'dark', false);
  });

  /* -------------------------------------------------------------------
     Mobile drawer
     ------------------------------------------------------------------- */
  function buildDrawer() {
    var subjects = S.subjects.map(function (s) {
      var live = S.isSubjectLive(s);
      var links = live
        ? '<li><a href="' + S.subjectUrl(s.id) + '">All ' + esc(s.name) + '</a></li>' +
          s.branches.map(function (b) { return '<li><a href="' + S.subjectUrl(s.id, b.id) + '">' + esc(b.name) + '</a></li>'; }).join('')
        : '<li><span class="muted small">Coming soon — ' + esc(s.branches.map(function (b) { return b.name; }).join(', ')) + '</span></li>';
      return '<details class="drawer-subject" style="' + accent(s) + '"><summary><span style="display:flex;align-items:center;gap:.75rem">' +
        '<span class="subject-icon" aria-hidden="true">' + s.icon + '</span>' + esc(s.name) +
        (live ? '' : ' <span class="badge badge-soon">Soon</span>') + '</span>' + icon('chev', 'chev') + '</summary><ul>' + links + '</ul></details>';
    }).join('');

    var backdrop = h('<div class="drawer-backdrop" hidden></div>');
    var drawer = h(
      '<aside class="drawer" id="drawer" aria-label="Menu" hidden>' +
        '<div class="drawer-head"><a class="logo" href="/">' + LOGO + '<span>' + esc(S.site.name) + '</span></a>' +
          '<button class="icon-btn" type="button" aria-label="Close menu" data-close-drawer>' + icon('close') + '</button></div>' +
        '<nav aria-label="Mobile">' +
          '<a class="drawer-link" href="/"' + (current('home') ? ' aria-current="page"' : '') + '>Home</a>' +
          '<details' + (current('subjects') ? ' open' : '') + '><summary>Subjects ' + icon('chev', 'chev') + '</summary>' + subjects + '</details>' +
          '<a class="drawer-link" href="/simulations/"' + (current('all') ? ' aria-current="page"' : '') + '>All Simulations</a>' +
          '<a class="drawer-link" href="/about.html"' + (current('about') ? ' aria-current="page"' : '') + '>About</a>' +
        '</nav>' +
        '<div class="drawer-footer">' +
          '<button class="btn" type="button" data-open-search style="flex:1">' + icon('search') + 'Search</button>' +
          '<a class="btn" href="' + esc(S.site.github) + '" target="_blank" rel="noopener">' + icon('github') + 'GitHub</a>' +
        '</div>' +
      '</aside>'
    );
    body.appendChild(backdrop);
    body.appendChild(drawer);

    var toggle = $('.menu-toggle'), lastFocus;
    function open() {
      lastFocus = document.activeElement;
      drawer.hidden = backdrop.hidden = false;
      requestAnimationFrame(function () { body.classList.add('drawer-open'); });
      toggle.setAttribute('aria-expanded', 'true');
      body.style.overflow = 'hidden';
      setTimeout(function () { $('[data-close-drawer]', drawer).focus(); }, 50);
    }
    function close() {
      body.classList.remove('drawer-open');
      toggle.setAttribute('aria-expanded', 'false');
      body.style.overflow = '';
      setTimeout(function () { drawer.hidden = backdrop.hidden = true; }, reduceMotion ? 0 : 260);
      if (lastFocus) lastFocus.focus();
    }
    toggle.addEventListener('click', open);
    backdrop.addEventListener('click', close);
    $('[data-close-drawer]', drawer).addEventListener('click', close);
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // simple focus trap
        var f = $$('a[href], button, summary', drawer).filter(function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    drawer.addEventListener('click', function (e) { if (e.target.closest('a[href]')) close(); });
    // Close drawer if the screen gets wide
    window.matchMedia('(min-width: 960px)').addEventListener('change', function (e) { if (e.matches && body.classList.contains('drawer-open')) close(); });
    return { close: close };
  }

  /* -------------------------------------------------------------------
     Global search overlay
     ------------------------------------------------------------------- */
  function buildSearchOverlay(drawerApi) {
    var overlay = h(
      '<div class="search-overlay" hidden>' +
        '<div class="search-dialog" role="dialog" aria-modal="true" aria-label="Search simulations">' +
          '<div class="search-field">' + icon('search') +
            '<input type="search" placeholder="Search simulations, subjects, topics…" aria-label="Search simulations">' +
            '<button class="icon-btn" type="button" aria-label="Close search" data-close-search>' + icon('close') + '</button></div>' +
          '<ul class="search-results"></ul>' +
          '<div class="search-hint"><span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div>' +
        '</div>' +
      '</div>'
    );
    body.appendChild(overlay);
    var input = $('input', overlay), list = $('.search-results', overlay), lastFocus;

    attachSearch(input, list, {
      emptyHtml: function () {
        var picks = S.liveSims().filter(function (s) { return s.featured; }).slice(0, 5);
        return '<li class="group-label" role="presentation">Popular simulations</li>' +
          picks.map(function (s, i) { return resultHtml({ type: 'sim', item: s }, '', i, 'pop'); }).join('');
      }
    });

    function open() {
      if (drawerApi && body.classList.contains('drawer-open')) drawerApi.close();
      lastFocus = document.activeElement;
      overlay.hidden = false;
      body.style.overflow = 'hidden';
      input.value = '';
      input.dispatchEvent(new Event('input'));
      input.focus(); // focus right away so no typed characters are lost
    }
    function close() {
      overlay.hidden = true;
      body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.addEventListener('click', function (e) { if (e.target.closest('[data-open-search]')) { e.preventDefault(); open(); } });
    $('[data-close-search]', overlay).addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // keep focus inside dialog
        var f = [input, $('[data-close-search]', overlay)];
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    document.addEventListener('keydown', function (e) {
      var t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); overlay.hidden ? open() : close(); }
      else if (e.key === '/' && !typing && overlay.hidden) { e.preventDefault(); open(); }
    });
  }

  /* -------------------------------------------------------------------
     Breadcrumbs (subject & simulation pages)
     ------------------------------------------------------------------- */
  function buildBreadcrumbs() {
    var subjId = body.dataset.subject, simId = body.dataset.sim;
    if (!subjId && !simId) return;
    var sim = simId ? S.getSim(simId) : null;
    var subj = S.getSubject(sim ? sim.subject : subjId);
    if (!subj) return;
    var params = new URLSearchParams(location.search);
    var branch = sim ? S.getBranch(subj.id, sim.branch) : S.getBranch(subj.id, params.get('branch'));

    var crumbs = [['Home', '/']];
    if (sim || branch) crumbs.push([subj.name, S.subjectUrl(subj.id)]);
    else crumbs.push([subj.name, null]);
    if (branch) crumbs.push([branch.name, sim ? S.subjectUrl(subj.id, branch.id) : null]);
    if (sim) crumbs.push([sim.title, null]);

    var nav = h('<nav class="breadcrumbs container" aria-label="Breadcrumb"><ol>' + crumbs.map(function (c) {
      return '<li>' + (c[1] ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' : '<span aria-current="page">' + esc(c[0]) + '</span>') + '</li>';
    }).join('') + '</ol></nav>');
    var main = $('#main');
    if (main) main.insertBefore(nav, main.firstChild);
  }

  /* -------------------------------------------------------------------
     Footer with auto sitemap
     ------------------------------------------------------------------- */
  function buildFooter() {
    var cols = S.subjects.map(function (s) {
      var live = S.isSubjectLive(s);
      var sims = S.simsBySubject(s.id);
      var list = sims.length
        ? sims.map(function (sim) {
            return S.isLive(sim)
              ? '<li><a href="' + esc(sim.link) + '">' + esc(sim.title) + '</a></li>'
              : '<li class="soon">' + esc(sim.title) + ' <small>soon</small></li>';
          }).join('')
        : '<li class="soon">Coming soon</li>';
      return '<div><h2><span aria-hidden="true">' + s.icon + '</span>' +
        (live ? '<a href="' + S.subjectUrl(s.id) + '">' + esc(s.name) + '</a>' : esc(s.name)) + '</h2><ul>' + list + '</ul></div>';
    }).join('');

    var footer = h(
      '<footer class="site-footer">' +
        '<div class="container">' +
          '<div class="footer-grid">' +
            '<div class="footer-brand"><a class="logo" href="/">' + LOGO + '<span>' + esc(S.site.name) + '</span></a>' +
              '<p>Free, open, interactive science simulations that run right in your browser. No sign-up, no installs.</p></div>' +
            cols +
            '<div><h2>' + esc(S.site.name) + '</h2><ul>' +
              '<li><a href="/simulations/">All simulations</a></li>' +
              '<li><a href="/about.html">About</a></li>' +
              '<li><a href="' + esc(S.site.github) + '" target="_blank" rel="noopener">GitHub</a></li>' +
              '<li><a href="' + esc(S.site.issues) + '" target="_blank" rel="noopener">Report an issue</a></li>' +
              '<li><a href="' + esc(S.site.suggest) + '" target="_blank" rel="noopener">Suggest a simulation</a></li>' +
            '</ul></div>' +
          '</div>' +
          '<div class="footer-bottom"><span>Built with HTML, CSS &amp; JavaScript • © ' + new Date().getFullYear() + ' ' + esc(S.site.name) + '</span>' +
            '<span>Press <kbd>/</kbd> to search anywhere</span></div>' +
        '</div>' +
      '</footer>'
    );
    body.appendChild(footer);
  }

  /* -------------------------------------------------------------------
     Back-to-top, scroll reveal, toast
     ------------------------------------------------------------------- */
  function buildBackToTop() {
    var btn = h('<button class="back-to-top" type="button" aria-label="Back to top">' + icon('up') + '</button>');
    body.appendChild(btn);
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var skip = $('.skip-link'); if (skip) skip.focus({ preventScroll: true });
    });
    window.addEventListener('scroll', function () { btn.classList.toggle('is-visible', window.scrollY > 600); }, { passive: true });
  }

  var revealObserver = null;
  function reveal(root) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('reveal-on');
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-visible'); revealObserver.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    $$('.reveal:not(.is-visible)', root || document).forEach(function (el) { revealObserver.observe(el); });
  }

  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) { toastEl = h('<div class="toast" role="status" aria-live="polite"></div>'); body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2200);
  }

  /* -------------------------------------------------------------------
     Public API + boot
     ------------------------------------------------------------------- */
  S.ui = {
    esc: esc, h: h, $: $, $$: $$, icon: icon, accent: accent,
    levelBadge: levelBadge, simCard: simCard, subjectCard: subjectCard,
    search: search, attachSearch: attachSearch,
    reveal: reveal, toast: toast, setTheme: setTheme,
    reduceMotion: reduceMotion
  };

  // Subject accent on subject & sim pages
  var pageSubj = S.getSubject(body.dataset.subject || (S.getSim(body.dataset.sim || '') || {}).subject);
  if (pageSubj) body.style.setProperty('--accent', pageSubj.color);

  buildHeader();
  var drawerApi = buildDrawer();
  buildSearchOverlay(drawerApi);
  buildBreadcrumbs();
  buildFooter();
  buildBackToTop();
  setTheme(document.documentElement.dataset.theme || 'dark', false);
  reveal();
})();
