/* =====================================================================
   SimLab — main.js  (landing page only)
   ---------------------------------------------------------------------
   Fills every landing-page section from catalog.js:
     hero particles + ball-throw mini experiment · live stats · Surprise Me ·
     Tap & play row + class chips · quick search + chips · subject grid ·
     recently added
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
    var toy = heroToy();

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
      toy.draw(ctx, W, H, colors);
    }

    var lastT = 0;
    function loop(now) {
      raf = 0;
      if (!running || !visible || (ui.reduceMotion && !toy.busy())) { if (ui.reduceMotion) draw(); return; }
      toy.step(Math.min(0.05, (now - (lastT || now)) / 1000));
      lastT = now;
      draw();
      raf = requestAnimationFrame(loop);
    }
    // With reduced motion the background stays still, but a ball the visitor throws still flies:
    // it only moves when they tap, and it is the experiment itself
    function kick() { if (!raf && running && visible && (!ui.reduceMotion || toy.busy())) { lastT = 0; raf = requestAnimationFrame(loop); } }
    toy.onChange = kick;

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
    toy.start(canvas);
  }

  /* -------------------------------------------------------------------
     HERO mini experiment: tap anywhere to throw a ball.
     The tap point sets the top of the throw (for Earth gravity); the
     ball then flies under the chosen gravity, so the same throw soars on
     the Moon and barely lifts off on Jupiter. Real numbers, real parabola.
     ------------------------------------------------------------------- */
  function heroToy() {
    var hero = $('.hero'), box = $('#hero-toy'), hint = $('#toy-hint');
    var G_EARTH = 9.8, TIME = 1.6;            // animation runs 1.6× real time (readouts stay real)
    var g = G_EARTH, gName = 'Earth', balls = [], floorY = 0, ppm = 25, W = 0, touched = false, n = 0;
    var NAMES = { '9.8': 'Earth', '1.62': 'Moon', '24.8': 'Jupiter' };
    var self = { onChange: function () {} };
    var fmt = function (v) { return v >= 100 ? v.toFixed(0) : v.toFixed(1); };

    function geometry(w, h) {
      W = w;
      floorY = box ? box.offsetTop - 6 : h - 40;
      ppm = Math.max(14, floorY / 22);       // the hero is about 22 m tall
    }
    function say(html) { if (hint) hint.innerHTML = html; }
    function throwAt(x, y) {
      var tx = Math.max(40, Math.min(W - 10, x)), ty = Math.min(y, floorY - 40);
      var hM = (floorY - ty) / ppm, vy = Math.sqrt(2 * G_EARTH * hM), tUp = vy / G_EARTH;
      var vx = ((tx - 28) / ppm) / tUp;
      var b = { x: 28 / ppm, y: 0, vx: vx, vy: vy, age: 0, trail: [], bounces: 0, maxH: 0, landed: false, c: n++ % 3, fade: 1,
        H: vy * vy / (2 * g), R: 2 * vx * vy / g, T: 2 * vy / g };
      balls.push(b); if (balls.length > 6) balls.shift();
      say('Flying… <b>' + gName + '</b> gravity');
      self.onChange();
    }
    function report(b) {
      var extra = gName === 'Moon' ? ' 🌙 Same throw, 6× higher than on Earth!' : gName === 'Jupiter' ? ' 🪐 Jupiter pulls 2.5× harder!' : '';
      say('Max height <b>' + fmt(b.H) + ' m</b> · distance <b>' + fmt(b.R) + ' m</b> · <b>' + fmt(b.T) + ' s</b> in the air.' + extra);
    }
    self.step = function (dt) {
      dt *= TIME;
      balls.forEach(function (b) {
        if (b.landed) { b.fade -= dt * 0.25; return; }
        b.age += dt;
        b.vy -= g * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        b.maxH = Math.max(b.maxH, b.y);
        if (b.x * ppm < 10 || b.x * ppm > W - 10) { b.vx = -b.vx * 0.8; b.x = Math.max(10 / ppm, Math.min((W - 10) / ppm, b.x)); }
        if (b.y < 0) {
          b.y = 0; b.vy = -b.vy * 0.55; b.vx *= 0.85; b.bounces++;
          if (b.bounces === 1) report(b);
          if (b.bounces > 3 || Math.abs(b.vy) < 1) b.landed = true;
        }
        b.trail.push({ x: b.x * ppm, y: floorY - b.y * ppm });
        if (b.trail.length > 70) b.trail.shift();
      });
      balls = balls.filter(function (b) { return b.fade > 0; });
    };
    self.draw = function (ctx, w, h, colors) {
      if (w !== W || !floorY) geometry(w, h);
      // launcher
      ctx.globalAlpha = 0.9; ctx.fillStyle = colors[0];
      ctx.beginPath(); ctx.arc(28, floorY, 7, 0, Math.PI * 2); ctx.fill();
      balls.forEach(function (b) {
        var col = colors[b.c] || colors[0], f = Math.max(0, Math.min(1, b.fade));
        ctx.globalAlpha = 0.55 * f; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); b.trail.forEach(function (p, i) { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.stroke();
        var last = b.trail[b.trail.length - 1];
        if (!last) return;
        ctx.globalAlpha = f; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(last.x, last.y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        if (!b.landed && b.y > 0.5) { // live height label next to the ball
          ctx.globalAlpha = 0.95; ctx.fillStyle = colors[0];
          ctx.font = '600 13px ui-monospace, monospace';
          ctx.fillText(fmt(b.y) + ' m', Math.min(last.x + 14, W - 60), Math.max(14, last.y - 10));
        }
      });
      ctx.globalAlpha = 1;
    };
    self.busy = function () { return balls.length > 0; };
    self.start = function (canvas) {
      var r = canvas.getBoundingClientRect(); geometry(r.width, r.height);
      hero.addEventListener('pointerdown', function (e) {
        if (e.target.closest('a, button, input, label, .toy-bar')) return;
        var rr = canvas.getBoundingClientRect();
        touched = true; throwAt(e.clientX - rr.left, e.clientY - rr.top);
      });
      $$('[data-g]').forEach(function (bt) {
        bt.addEventListener('click', function () {
          g = parseFloat(bt.dataset.g); gName = NAMES[bt.dataset.g];
          $$('[data-g]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === bt)); });
          say('<b>' + gName + '</b>: g = ' + bt.dataset.g + ' m/s². Now tap to throw!');
          var rr = canvas.getBoundingClientRect();
          throwAt(rr.width * 0.62, floorY * 0.42); // same throw as the demo, to compare
        });
      });
      window.addEventListener('resize', function () { var rr = canvas.getBoundingClientRect(); geometry(rr.width, rr.height); });
      // one demo throw so something is already moving
      if (!ui.reduceMotion) setTimeout(function () { if (!touched) throwAt(r.width * 0.62, floorY * 0.42); }, 700);
    };
    return self;
  }

  /* -------------------------------------------------------------------
     Stats + Surprise Me
     ------------------------------------------------------------------- */
  function stats() {
    var live = S.liveSims();
    var subjectsWithSims = S.subjects.length;
    var el = $('#hero-lead');
    if (el) el.innerHTML = '<strong>' + live.length + ' free simulations</strong> across ' + subjectsWithSims + ' subjects, for Class 7 to 12.';
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
