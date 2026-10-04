/* =====================================================================
   SimLab — subject.js
   ---------------------------------------------------------------------
   Renders a subject page (e.g. /physics/) or the "All Simulations"
   page (/simulations/) entirely from catalog.js.

   The page's <body data-subject="physics"> decides what to show.
   Use data-subject="all" for the all-simulations listing.

   URL parameters (shareable, kept in sync while filtering):
     ?branch=optics     (subject page)   ?subject=physics  (all page)
     ?level=Beginner    ?class=9    ?q=pendulum
   ===================================================================== */
(function () {
  'use strict';

  var S = window.SimLab, ui = S.ui, $ = ui.$, $$ = ui.$$, esc = ui.esc;
  var root = $('#subject-root');
  if (!root) return;

  var id = document.body.dataset.subject;
  var ALL = id === 'all';
  var subj = ALL ? null : S.getSubject(id);

  if (!ALL && !subj) {
    root.innerHTML = '<div class="empty-state" style="margin-top:2rem"><h1>Subject not found</h1>' +
      '<p>No subject with id “' + esc(id) + '” exists in catalog.js.</p><a class="btn" href="/">Go home</a></div>';
    return;
  }

  /* Groups: branches of the subject, or subjects on the "all" page */
  var groupKey = ALL ? 'subject' : 'branch';
  var groups = ALL
    ? S.subjects.map(function (s) { return { id: s.id, name: s.name, icon: s.icon, color: s.color, subj: s }; })
    : subj.branches.map(function (b) { return { id: b.id, name: b.name }; });
  var pool = ALL ? S.simulations : S.simsBySubject(subj.id);

  /* Filter state from URL */
  var params = new URLSearchParams(location.search);
  var state = {
    group: params.get(groupKey) || '',
    level: params.get('level') || '',
    cls: params.get('class') || '',
    q: params.get('q') || ''
  };
  if (state.group && !groups.some(function (g) { return g.id === state.group; })) state.group = '';
  if (state.level && S.LEVELS.indexOf(state.level) === -1) state.level = '';

  /* School class (7–12) comes from the 'class N' tags in catalog.js; a sim can belong to more than one */
  function classesOf(sim) {
    return (sim.tags || []).map(function (t) { var m = /^class (\d+)$/.exec(t); return m ? m[1] : ''; }).filter(Boolean);
  }
  var CLASSES = ['7', '8', '9', '10', '11', '12'].filter(function (c) {
    return pool.some(function (s) { return S.isLive(s) && classesOf(s).indexOf(c) !== -1; });
  });
  if (state.cls && CLASSES.indexOf(state.cls) === -1) state.cls = '';

  /* -------------------------------------------------------------------
     Banner
     ------------------------------------------------------------------- */
  var liveCount = pool.filter(S.isLive).length;
  var soonCount = pool.length - liveCount;
  var banner = ALL
    ? '<section class="subject-banner reveal" style="--accent:var(--primary)">' +
        '<span class="subject-icon" aria-hidden="true">🧪</span>' +
        '<h1>All Simulations</h1>' +
        '<p>Every simulation in the lab, across every subject. Filter by subject, class or level, or search for a topic.</p>' +
        '<div class="banner-stats"><span class="badge">' + liveCount + ' live</span>' + (soonCount ? '<span class="badge badge-soon">' + soonCount + ' coming soon</span>' : '') +
        '<span class="badge">' + S.subjects.length + ' subjects</span></div>' +
      '</section>'
    : '<section class="subject-banner reveal">' +
        '<span class="subject-icon" aria-hidden="true">' + subj.icon + '</span>' +
        '<h1>' + esc(subj.name) + '</h1>' +
        '<p>' + esc(subj.description) + '</p>' +
        '<div class="banner-stats">' +
          (S.isSubjectLive(subj)
            ? '<span class="badge badge-subject">' + liveCount + ' simulation' + (liveCount === 1 ? '' : 's') + '</span>' +
              (soonCount ? '<span class="badge badge-soon">' + soonCount + ' coming soon</span>' : '')
            : '<span class="badge badge-soon">Coming soon</span>') +
          '<span class="badge">' + subj.branches.length + ' topics</span>' +
        '</div>' +
      '</section>';

  var soonNotice = !ALL && !S.isSubjectLive(subj)
    ? '<div class="notice" style="margin-top:1.5rem"><span aria-hidden="true">🚧</span><p><strong>' + esc(subj.name) +
      ' is coming soon.</strong> We’re building the first simulations now. Have an idea? ' +
      '<a href="' + esc(S.site.suggest) + '" target="_blank" rel="noopener">Suggest a simulation</a>.</p></div>'
    : '';

  /* -------------------------------------------------------------------
     Layout: filters + results
     ------------------------------------------------------------------- */
  root.innerHTML =
    banner + soonNotice +
    '<div class="listing">' +
      '<aside class="filters" aria-label="Filters">' +
        '<div><label class="sr-only" for="filter-q">Search ' + (ALL ? 'all simulations' : esc(subj.name)) + '</label>' +
          '<input class="input" type="search" id="filter-q" placeholder="Search ' + (ALL ? 'simulations' : esc(subj.name)) + '…" value="' + esc(state.q) + '"></div>' +
        '<div><h2 id="f-group">' + (ALL ? 'Subject' : 'Topic') + '</h2><div class="filter-list" role="group" aria-labelledby="f-group" id="group-filters"></div></div>' +
        (CLASSES.length ? '<div><h2 id="f-class">Class</h2><div class="filter-list" role="group" aria-labelledby="f-class" id="class-filters"></div></div>' : '') +
        '<div><h2 id="f-level">Level</h2><div class="filter-list" role="group" aria-labelledby="f-level" id="level-filters"></div></div>' +
        '<button class="btn btn-sm btn-ghost" type="button" id="clear-filters" hidden>Clear filters</button>' +
      '</aside>' +
      '<div id="results" aria-live="polite"></div>' +
    '</div>' +
    (ALL ? '' : '<section class="section-tight" aria-labelledby="rel-h"><div class="section-head"><h2 id="rel-h">Related subjects</h2></div><div class="related-row" id="related-subjects"></div></section>');

  var qInput = $('#filter-q'), groupEl = $('#group-filters'), levelEl = $('#level-filters'), classEl = $('#class-filters'), results = $('#results'), clearBtn = $('#clear-filters');

  function matches(sim, ignore) {
    if (ignore !== 'group' && state.group && sim[groupKey] !== state.group) return false;
    if (ignore !== 'level' && state.level && sim.level !== state.level) return false;
    if (ignore !== 'cls' && state.cls && classesOf(sim).indexOf(state.cls) === -1) return false;
    if (state.q) {
      var hay = [sim.title, sim.description, sim.level, (sim.tags || []).join(' '),
        (S.getBranch(sim.subject, sim.branch) || {}).name, (S.getSubject(sim.subject) || {}).name].join(' ').toLowerCase();
      if (!state.q.toLowerCase().split(/\s+/).every(function (t) { return hay.indexOf(t) !== -1; })) return false;
    }
    return true;
  }

  function renderFilters() {
    function btn(value, label, count, pressed, kind, style) {
      return '<button class="filter-btn" type="button" data-kind="' + kind + '" data-value="' + esc(value) + '" aria-pressed="' + pressed + '"' +
        (style ? ' style="' + style + '"' : '') + '><span>' + label + '</span><span class="n">' + count + '</span></button>';
    }
    var base = pool.filter(function (s) { return matches(s, 'group'); });
    groupEl.innerHTML = btn('', 'All', base.length, !state.group, 'group') + groups.map(function (g) {
      var n = base.filter(function (s) { return s[groupKey] === g.id; }).length;
      return btn(g.id, (g.icon ? g.icon + ' ' : '') + esc(g.name), n, state.group === g.id, 'group', g.color ? '--accent:' + g.color : '');
    }).join('');

    var baseL = pool.filter(function (s) { return matches(s, 'level'); });
    levelEl.innerHTML = btn('', 'All levels', baseL.length, !state.level, 'level') + S.LEVELS.map(function (l) {
      return btn(l, l, baseL.filter(function (s) { return s.level === l; }).length, state.level === l, 'level');
    }).join('');
    if (classEl) {
      var baseC = pool.filter(function (s) { return matches(s, 'cls'); });
      classEl.innerHTML = btn('', 'All classes', baseC.length, !state.cls, 'cls') + CLASSES.map(function (c) {
        return btn(c, 'Class ' + c, baseC.filter(function (s) { return classesOf(s).indexOf(c) !== -1; }).length, state.cls === c, 'cls');
      }).join('');
    }
    clearBtn.hidden = !(state.group || state.level || state.cls || state.q);
  }

  function renderResults() {
    var visibleGroups = groups.filter(function (g) { return !state.group || g.id === state.group; });
    var filtering = !!(state.level || state.cls || state.q);
    var html = '', total = 0;

    visibleGroups.forEach(function (g) {
      var sims = pool.filter(function (s) { return s[groupKey] === g.id && matches(s, 'group'); })
        // live first, then by catalog order
        .sort(function (a, b) { return (S.isLive(b) ? 1 : 0) - (S.isLive(a) ? 1 : 0); });
      total += sims.length;
      if (!sims.length && filtering) return; // hide empty groups while filtering
      var live = sims.filter(S.isLive).length;
      var link = ALL && g.subj && S.isSubjectLive(g.subj) ? '<a href="' + S.subjectUrl(g.id) + '">Open ' + esc(g.name) + ' →</a>' : '';
      html += '<section class="branch-section" aria-labelledby="g-' + g.id + '"' + (g.color ? ' style="--accent:' + g.color + '"' : '') + '>' +
        '<div class="branch-head"><h2 id="g-' + g.id + '">' + (g.icon ? g.icon + ' ' : '') + esc(g.name) + '</h2>' +
        '<span class="n">' + live + ' live' + (sims.length - live ? ' · ' + (sims.length - live) + ' soon' : '') + '</span>' + link + '</div>' +
        '<div class="grid grid-auto">' +
          (sims.length
            ? sims.map(function (s) { return ui.simCard(s, { showSubject: ALL }); }).join('')
            : '<div class="placeholder-card"><span class="big" aria-hidden="true">🧪</span><strong>Coming soon</strong>' +
              '<span class="small">Simulations for ' + esc(g.name) + ' are being built.</span>' +
              '<a class="small" href="' + esc(S.site.suggest) + encodeURIComponent(g.name) + '" target="_blank" rel="noopener">Suggest one →</a></div>') +
        '</div></section>';
    });

    if (!total && filtering) {
      html = '<div class="empty-state"><p class="big" aria-hidden="true" style="font-size:2rem">🔍</p>' +
        '<p><strong>No simulations match your filters.</strong></p>' +
        '<button class="btn" type="button" data-clear>Clear filters</button></div>';
    }
    results.innerHTML = html;
  }

  function syncUrl() {
    var q = new URLSearchParams();
    if (state.group) q.set(groupKey, state.group);
    if (state.cls) q.set('class', state.cls);
    if (state.level) q.set('level', state.level);
    if (state.q) q.set('q', state.q);
    var s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  function update() { renderFilters(); renderResults(); syncUrl(); }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('.filter-btn');
    if (b) {
      state[b.dataset.kind] = b.dataset.value;
      update();
      var again = $('.filter-btn[data-kind="' + b.dataset.kind + '"][data-value="' + b.dataset.value + '"]');
      if (again) again.focus();
      return;
    }
    if (e.target.closest('[data-clear]') || e.target === clearBtn) {
      state.group = state.level = state.cls = state.q = ''; qInput.value = ''; update();
    }
  });
  var qTimer;
  qInput.addEventListener('input', function () {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () { state.q = qInput.value.trim(); update(); }, 120);
  });

  /* Related subjects */
  if (!ALL) {
    $('#related-subjects').innerHTML = S.subjects.filter(function (s) { return s.id !== subj.id; }).map(function (s) {
      var live = S.isSubjectLive(s), tag = live ? 'a' : 'div';
      return '<' + tag + ' class="mini-subject' + (live ? '' : ' is-soon') + '"' + (live ? ' href="' + S.subjectUrl(s.id) + '"' : '') + ' style="--accent:' + s.color + '">' +
        '<span class="subject-icon" aria-hidden="true">' + s.icon + '</span><span><span class="t">' + esc(s.name) + '</span>' +
        '<span class="m">' + (live ? S.simsBySubject(s.id, true).length + ' simulations' : 'Coming soon') + '</span></span></' + tag + '>';
    }).join('');
  }

  /* Page title reflects the branch filter */
  if (!ALL && state.group) {
    var br = S.getBranch(subj.id, state.group);
    if (br) document.title = br.name + ' — ' + subj.name + ' — ' + S.site.name;
  }

  update();
  ui.reveal(root);
})();
