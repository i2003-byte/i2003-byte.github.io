/* =====================================================================
   SimLab — main.js  (landing page only)
   ---------------------------------------------------------------------
   Fills every landing-page section from catalog.js:
     hero particles · live stats · Surprise Me · Tap & play row +
     class chips · quick search + chips · subject grid · recently added
   ===================================================================== */
(function () {
  'use strict';

  var S = window.SimLab, ui = S.ui, $ = ui.$, $$ = ui.$$, esc = ui.esc;

  /* -------------------------------------------------------------------
     HERO — interactive particle network
     Particles drift, link with nearby particles and are gently pulled
     toward the pointer. Pauses when the tab is hidden or off-screen and
     draws a single still frame when the user prefers reduced motion.
     ------------------------------------------------------------------- */
  function heroParticles() {
    var canvas = $('#hero-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, parts = [], mouse = { x: -9999, y: -9999, active: false };
    var running = true, visible = true, raf = 0;
    var colors = [];

    function readColors() {
      var cs = getComputedStyle(document.documentElement);
      colors = [cs.getPropertyValue('--primary').trim(), cs.getPropertyValue('--secondary').trim(), '#f472b6'];
    }

    function resize() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // particle count scales with area (fewer on phones)
      var n = Math.round(Math.min(110, Math.max(35, W * H / 13000)));
      parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.8 + 0.8, c: i % 3
        });
      }
      if (ui.reduceMotion) draw();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var linkDist = Math.min(140, Math.max(90, W / 10));
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (!ui.reduceMotion) {
          // attraction to pointer
          if (mouse.active) {
            var dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
            if (d2 < 200 * 200 && d2 > 1) { var f = 0.012 / Math.sqrt(d2) * 60; p.vx += dx * f * 0.02; p.vy += dy * f * 0.02; }
          }
          p.vx *= 0.99; p.vy *= 0.99;
          // keep a minimum drift
          var sp = Math.hypot(p.vx, p.vy);
          if (sp < 0.12) { p.vx += (Math.random() - 0.5) * 0.05; p.vy += (Math.random() - 0.5) * 0.05; }
          if (sp > 2) { p.vx *= 2 / sp; p.vy *= 2 / sp; }
          p.x += p.vx; p.y += p.vy;
          if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
          if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
        }
        // links
        for (var j = i + 1; j < parts.length; j++) {
          var q = parts[j], ddx = p.x - q.x, ddy = p.y - q.y, dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < linkDist) {
            ctx.globalAlpha = (1 - dist / linkDist) * 0.35;
            ctx.strokeStyle = colors[p.c];
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        // link to mouse
        if (mouse.active) {
          var mdx = p.x - mouse.x, mdy = p.y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
          if (md < linkDist * 1.4) {
            ctx.globalAlpha = (1 - md / (linkDist * 1.4)) * 0.6;
            ctx.strokeStyle = colors[0];
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = colors[p.c];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function loop() {
      raf = 0;
      if (!running || !visible || ui.reduceMotion) return;
      draw();
      raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf && running && visible && !ui.reduceMotion) raf = requestAnimationFrame(loop); }

    var hero = canvas.parentElement;
    hero.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.active = false; });
    document.addEventListener('visibilitychange', function () { running = !document.hidden; kick(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; kick(); }).observe(canvas);
    }
    document.addEventListener('simlab:themechange', function () { readColors(); if (ui.reduceMotion) draw(); });
    window.addEventListener('resize', function () { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });

    readColors();
    resize();
    kick();
  }

  /* -------------------------------------------------------------------
     Stats + Surprise Me
     ------------------------------------------------------------------- */
  function stats() {
    var live = S.liveSims();
    var subjectsWithSims = S.subjects.length;
    var el = $('#hero-stats');
    if (el) {
      el.innerHTML =
        '<span><strong>' + live.length + '</strong>Simulation' + (live.length === 1 ? '' : 's') + '</span><span class="dot" aria-hidden="true"></span>' +
        '<span><strong>' + subjectsWithSims + '</strong>Subjects</span><span class="dot" aria-hidden="true"></span>' +
        '<span><strong>100%</strong>Free &amp; Open</span>';
    }
    var newest = live.slice().sort(function (a, b) { return S.parseDate(b.dateAdded) - S.parseDate(a.dateAdded); })[0];
    var pill = $('#hero-pill');
    if (pill && newest) {
      pill.href = newest.link;
      pill.innerHTML = '<span class="badge badge-new">New</span> ' + esc(newest.title) + ' is live →';
    } else if (pill) pill.hidden = true;

    var suggest = $('#suggest-link');
    if (suggest) suggest.href = S.site.suggest;

    $$('[data-surprise]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pool = S.liveSims();
        if (!pool.length) return;
        window.location.href = pool[Math.floor(Math.random() * pool.length)].link;
      });
    });
  }

  /* -------------------------------------------------------------------
     Quick search + chips
     ------------------------------------------------------------------- */
  function quickSearch() {
    var input = $('#quick-search'), list = $('#quick-results');
    if (!input) return;
    var api = ui.attachSearch(input, list, { hideWhenEmpty: true, limit: 8 });
    $$('[data-chip]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        input.value = chip.dataset.chip;
        $$('[data-chip]').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        input.focus();
        api.render();
      });
    });
  }

  /* -------------------------------------------------------------------
     Subject grid
     ------------------------------------------------------------------- */
  function subjects() {
    var grid = $('#subject-grid');
    if (grid) grid.innerHTML = S.subjects.map(ui.subjectCard).join('');
  }

  /* -------------------------------------------------------------------
     Tap & play: big cards that open a simulation already running (#play),
     then "I'm in Class …" shortcuts
     ------------------------------------------------------------------- */
  function playRow() {
    var track = $('#play-track');
    if (!track) return;
    var live = S.liveSims(), seen = {}, list = [];
    function add(s) { if (s && S.isLive(s) && !seen[s.id]) { seen[s.id] = 1; list.push(s); } }
    (S.site.showcase || []).forEach(function (id) { add(S.getSim(id)); });
    live.filter(function (s) { return s.featured; }).forEach(add);
    live.slice().sort(function (a, b) { return S.parseDate(b.dateAdded) - S.parseDate(a.dateAdded); }).forEach(add);
    list = list.slice(0, 16);
    function cls(s) { var m = (s.tags || []).join(' ').match(/class (\d+)/); return m ? 'Class ' + m[1] : s.level; }
    track.innerHTML = list.map(function (s) {
      var subj = S.getSubject(s.subject);
      return '<a class="play-card" href="' + esc(s.link) + '#play" style="' + ui.accent(subj) + '">' +
        '<span class="pc-thumb"><img src="' + esc(s.thumbnail || '/assets/img/thumbs/default.svg') + '" alt="" loading="lazy" width="320" height="200">' +
          '<span class="pc-play" aria-hidden="true">' + ui.icon('play') + '</span>' +
          (S.isNew(s) ? '<span class="badge badge-new">New</span>' : '') + '</span>' +
        '<span class="pc-t">' + esc(s.title) + '</span>' +
        '<span class="pc-m">' + (subj ? subj.icon + ' ' + esc(subj.name) + ' · ' : '') + esc(cls(s)) + '</span>' +
      '</a>';
    }).join('') +
      '<button class="play-card pc-surprise" type="button" data-surprise><span class="pc-thumb"><span>🎲</span></span>' +
      '<span class="pc-t">Surprise me</span><span class="pc-m">Any of ' + live.length + ' simulations</span></button>';

    var prev = $('#play-prev'), next = $('#play-next');
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    }
    function by(dir) { track.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: ui.reduceMotion ? 'auto' : 'smooth' }); }
    prev.addEventListener('click', function () { by(-1); });
    next.addEventListener('click', function () { by(1); });
    track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();

    var pick = $('#class-pick');
    if (pick) {
      var classes = ['7', '8', '9', '10', '11', '12'].map(function (c) {
        return { c: c, n: live.filter(function (s) { return (s.tags || []).indexOf('class ' + c) !== -1; }).length };
      }).filter(function (x) { return x.n; });
      pick.innerHTML = '<span class="cp-label">I’m in</span>' + classes.map(function (x) {
        return '<a class="cp-chip" href="/simulations/?class=' + x.c + '">Class ' + x.c + ' <small>' + x.n + '</small></a>';
      }).join('');
    }
  }

  /* -------------------------------------------------------------------
     Recently added
     ------------------------------------------------------------------- */
  function recent() {
    var grid = $('#recent-grid');
    if (!grid) return;
    var list = S.liveSims().slice()
      .sort(function (a, b) { return S.parseDate(b.dateAdded) - S.parseDate(a.dateAdded); })
      .slice(0, 6);
    grid.innerHTML = list.map(function (s) { return ui.simCard(s); }).join('');
  }

  /* ------------------------------------------------------------------- */
  heroParticles();
  playRow();   // before stats(): it adds a Surprise me card
  stats();
  quickSearch();
  subjects();
  recent();
  ui.reveal();
})();
