/* =====================================================================
   Biology · Principles of inheritance · Dihybrid Cross — sim.js
   ---------------------------------------------------------------------
   Two genes in garden peas, each with complete dominance:
     seed shape  R (round) > r (wrinkled)
     seed colour Y (yellow) > y (green)
   Law of independent assortment: the two genes sit on different
   chromosomes, so each gamete gets one allele of each gene, every
   combination equally likely. A parent RrYy makes RY, Ry, rY, ry (¼ each).
   P(child round) = 1 − (chance of r from parent 1)(chance of r from 2),
   same for yellow, and the two are independent:
       P(round yellow) = P(round) × P(yellow), and so on.
   RrYy × RrYy → 9 : 3 : 3 : 1;  RrYy × rryy (test cross) → 1 : 1 : 1 : 1.
   Mendel's own F2 (1866): 315 round yellow, 108 round green,
   101 wrinkled yellow, 32 wrinkled green (556 seeds).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var YEL = '#facc15', GRN = '#65a30d';
  var CLASSES = [
    { name: 'Round yellow', round: true, yellow: true },
    { name: 'Round green', round: true, yellow: false },
    { name: 'Wrinkled yellow', round: false, yellow: true },
    { name: 'Wrinkled green', round: false, yellow: false }
  ];
  var MENDEL = [315, 108, 101, 32];
  var GENOS = ['RRYY', 'RRYy', 'RRyy', 'RrYY', 'RrYy', 'Rryy', 'rrYY', 'rrYy', 'rryy'];
  var nTarget = 160; // graph x-axis length, set in reset

  function looks(g) {
    return (g.indexOf('R') >= 0 ? 'round' : 'wrinkled') + ' ' + (g.indexOf('Y') >= 0 ? 'yellow' : 'green');
  }
  function genoOptions() {
    return GENOS.map(function (g) {
      var pure = g.charAt(0) === g.charAt(1) && g.charAt(2) === g.charAt(3);
      return { value: g, label: g + ' · ' + looks(g) + (pure ? ' (pure)' : g === 'RrYy' ? ' (hybrid)' : '') };
    });
  }
  // The four gametes of a parent, in the usual order: 1st+3rd, 1st+4th, 2nd+3rd, 2nd+4th.
  function gametes(g) { return [g[0] + g[2], g[0] + g[3], g[1] + g[2], g[1] + g[3]]; }
  function pair(a, b) { return a <= b ? a + b : b + a; } // uppercase sorts first
  function childOf(e, p) { return pair(e[0], p[0]) + pair(e[1], p[1]); }
  function classOf(g) { return (g.indexOf('R') >= 0 ? 0 : 2) + (g.indexOf('Y') >= 0 ? 0 : 1); }
  function share(g, L) { return ((g.charAt(L === 'R' ? 0 : 2) === L) + (g.charAt(L === 'R' ? 1 : 3) === L)) / 2; }
  function probs(sim) {
    var a = sim.p.p1, b = sim.p.p2;
    var pR = 1 - (1 - share(a, 'R')) * (1 - share(b, 'R')), pY = 1 - (1 - share(a, 'Y')) * (1 - share(b, 'Y'));
    return { R: pR, Y: pY, c: [pR * pY, pR * (1 - pY), (1 - pR) * pY, (1 - pR) * (1 - pY)] };
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function expRatio(sim) {
    var c = probs(sim).c.map(function (v) { return Math.round(v * 16); }), parts = [];
    c.forEach(function (n, i) { if (n) parts.push({ n: n, i: i }); });
    if (parts.length === 1) return 'all ' + CLASSES[parts[0].i].name.toLowerCase();
    var k = parts.reduce(function (a, q) { return gcd(a, q.n); }, 0);
    return parts.map(function (q) { return q.n / k; }).join(' : ') + ' (' + parts.map(function (q) { return CLASSES[q.i].name.toLowerCase(); }).join(' : ') + ')';
  }
  function expShort(sim) {
    var c = probs(sim).c.map(function (v) { return Math.round(v * 16); }), parts = c.filter(function (n) { return n; });
    if (parts.length === 1) return 'all ' + CLASSES[c.indexOf(16)].name.toLowerCase();
    var k = parts.reduce(gcd, 0);
    return parts.map(function (n) { return n / k; }).join(' : ');
  }
  function oneGene(a, b, dom, rec) {
    if (!b) return 'all ' + dom; if (!a) return 'all ' + rec;
    return M.fmt(a / b, 2) + ' : 1';
  }
  function crossName(sim, sm) {
    var a = sim.p.p1, b = sim.p.p2, s = [a, b].sort().join('×');
    if (s === 'RRYY×rryy') return sm ? 'P: pure × pure → F1' : 'Parents: pure round yellow × pure wrinkled green → F1';
    if (s === 'RrYy×RrYy') return sm ? 'F1 × F1 → F2 (dihybrid)' : 'F1 × F1: selfing the double hybrid → F2';
    if (s === 'RrYy×rryy') return sm ? 'Test cross' : 'Test cross: double hybrid × double recessive';
    if (s === 'RRyy×rrYY') return sm ? 'Pure round green × pure wrinkled yellow' : 'Parents: pure round green × pure wrinkled yellow → F1';
    return sm ? 'Your own cross' : 'A cross of your choice';
  }

  /* ---------- a pea seed of size s centred at (x, y) ---------- */
  function seed(ctx, round, yellow, x, y, s, col) {
    var r = s * 0.3, line = col.light ? '#334155' : '#0f172a';
    ctx.beginPath();
    for (var k = 0; k <= 48; k++) {
      var a = k / 48 * Math.PI * 2, rr = r * (round ? 1 : 0.93 + 0.05 * Math.cos(a * 9) + 0.03 * Math.cos(a * 4 + 1));
      if (k) ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); else ctx.moveTo(x + rr, y);
    }
    ctx.closePath(); ctx.fillStyle = yellow ? YEL : GRN; ctx.fill();
    ctx.strokeStyle = line; ctx.lineWidth = s > 24 ? 1 : 0.6; ctx.stroke();
    if (!round && s > 14) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath();
      ctx.moveTo(x - r * 0.45, y - r * 0.15); ctx.quadraticCurveTo(x, y + r * 0.2, x + r * 0.45, y - r * 0.2); ctx.stroke();
    }
    if (s > 10) D.circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.18, 'rgba(255,255,255,0.45)');
  }

  function gameteChip(ctx, x, y, r, gm, col) {
    var dom = (gm[0] === 'R') + (gm[1] === 'Y');
    D.circle(ctx, x, y, r, col.light ? '#fff7ed' : '#1e293b', dom === 2 ? '#16a34a' : dom ? col.accent : (col.light ? '#64748b' : '#94a3b8'), 1.5);
    D.text(ctx, gm, x, y + 0.5, { color: col.text, size: Math.max(8, Math.min(13, r * 0.85)), weight: 800, align: 'center' });
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, small = W < 560, m = small ? 6 : 12;
    var tall = H > W * 1.15, L = { W: W, H: H, small: small, m: m, tall: tall };
    var colW = tall ? W : Math.round(W * (small ? 0.56 : 0.5)), topH = tall ? H * 0.6 : H;
    var titleH = small ? 16 : 24, labelH = small ? 14 : 20, hdr = small ? 22 : 30, botH = small ? 18 : 30;
    var avail = topH - titleH - labelH - hdr - botH - 6;
    var s = Math.max(80, Math.min(colW - hdr - 2 * m, avail - Math.min(100, avail * 0.24)));
    var ps = Math.max(24, Math.min(90, avail - s, s * 0.3));
    var extra = Math.max(0, (avail - s - ps) / 2);
    L.s = s; L.ps = ps; L.hdr = hdr; L.colW = colW;
    L.sqX = (tall ? (W - s - hdr) / 2 : (colW - s - hdr) / 2) + hdr;
    L.titleY = extra / 2 + titleH / 2;
    L.py = extra / 2 + titleH + ps / 2 + extra / 2;
    L.labelY = L.py + ps / 2 + labelH / 2 + 2;
    L.sqY = L.labelY + labelH / 2 + hdr + 2;
    L.belowY = L.sqY + s + (small ? 11 : 16);
    L.field = tall ? { x: m, y: topH + 18, w: W - 2 * m, h: H - topH - 54 } : { x: colW + m, y: m + (small ? 16 : 22), w: W - colW - 2 * m, h: H - 2 * m - (small ? 40 : 70) };
    return L;
  }

  function makeChild(sim) {
    var st = sim.state, i = Math.floor(Math.random() * 4), j = Math.floor(Math.random() * 4);
    var g = childOf(gametes(sim.p.p1)[i], gametes(sim.p.p2)[j]), c = classOf(g);
    st.kids.push({ c: c, t: performance.now() });
    st.cell[i * 4 + j]++; st.cls[c]++; st.last = i * 4 + j;
    if (sim.graph) { var n = st.kids.length; sim.graph.push(n, st.cls.map(function (v) { return v / n; })); }
  }

  SimLab.createSim({
    ariaLabel: 'Dihybrid cross of pea plants: two parents, their four kinds of gametes, a 4 by 4 Punnett square of seeds and a tray of offspring seeds counted as round yellow, round green, wrinkled yellow and wrinkled green',
    mobileAspect: '1 / 1',
    playLabel: 'Grow seeds',
    params: [
      { id: 'p1', label: 'Parent 1 (egg cells, across the top)', type: 'select', value: 'RrYy', options: genoOptions() },
      { id: 'p2', label: 'Parent 2 (pollen, down the side)', type: 'select', value: 'RrYy', options: genoOptions() },
      { id: 'n', label: 'Number of seeds', min: 16, max: 1600, step: 1, value: 160,
        presets: [{ label: '16', value: 16 }, { label: '160', value: 160 }, { label: '556', value: 556 }, { label: '1600', value: 1600 }] },
      { id: 'hl', label: 'Highlight in the square', type: 'select', value: 'none', options: [
        { value: 'none', label: 'Nothing' }, { value: '0', label: 'Round yellow boxes' }, { value: '1', label: 'Round green boxes' },
        { value: '2', label: 'Wrinkled yellow boxes' }, { value: '3', label: 'Wrinkled green boxes' }] }
    ],
    onParam: function (sim, id) { return id === 'hl'; },
    buttonsTitle: 'Crosses',
    buttons: [
      { label: 'Pure × pure (P → F1)', onClick: function (sim) { sim.setParam('p1', 'RRYY'); sim.setParam('p2', 'rryy'); sim.reset(); } },
      { label: 'Self the F1 (→ F2)', primary: true, onClick: function (sim) { sim.setParam('p1', 'RrYy'); sim.setParam('p2', 'RrYy'); sim.reset(); sim.play(); } },
      { label: 'Test cross (RrYy × rryy)', full: true, onClick: function (sim) { sim.setParam('p1', 'RrYy'); sim.setParam('p2', 'rryy'); sim.reset(); sim.play(); } }
    ],
    readouts: [
      { id: 'c0', label: 'Round yellow', key: true, short: 'Rnd yellow' },
      { id: 'obs', label: 'Observed, scaled to 16', key: true, short: 'Out of 16' },
      { id: 'exp', label: 'Expected ratio', key: true, short: 'Expected' },
      { id: 'c1', label: 'Round green' },
      { id: 'c2', label: 'Wrinkled yellow' },
      { id: 'c3', label: 'Wrinkled green' },
      { id: 'shape', label: 'Shape alone: round : wrinkled' },
      { id: 'colour', label: 'Colour alone: yellow : green' },
      { id: 'mendel', label: 'Mendel’s F2 (556 seeds)' }
    ],
    graph: { title: 'Share of seeds in each class', xLabel: 'seeds', yLabel: 'share', yMin: 0, yMax: 1,
      xMax: function () { return nTarget; },
      series: [{ label: 'round yellow (9/16 in F2)' }, { label: 'round green' }, { label: 'wrinkled yellow' }, { label: 'wrinkled green' }] },

    reset: function (sim) {
      nTarget = sim.p.n;
      sim.state = { kids: [], cell: new Array(16).fill(0), cls: [0, 0, 0, 0], acc: 0, last: -1 };
    },
    update: function (sim, dt) {
      var st = sim.state;
      st.acc += dt * M.clamp(sim.p.n / 8, 3, 200);
      while (st.acc >= 1 && st.kids.length < sim.p.n) { st.acc -= 1; makeChild(sim); }
    },
    finished: function (sim) { return sim.state.kids.length >= sim.p.n; },
    animate: function (sim) { var k = sim.state.kids; return !reduce && k.length && performance.now() - k[k.length - 1].t < 400; },
    status: function (sim) {
      var n = sim.state.kids.length;
      return n >= sim.p.n ? 'Done: ' + n + ' seeds. Press Restart for a new batch' : n ? 'Growing seeds: ' + n + ' of ' + sim.p.n : 'Press Grow seeds to make ' + sim.p.n + ' seeds from random gametes';
    },
    readout: function (sim) {
      var st = sim.state, n = st.kids.length, c = st.cls;
      var sc = n ? c.map(function (v) { return M.fmt(v * 16 / n, 1); }).join(' : ') : '—';
      return {
        c0: c[0], c1: c[1], c2: c[2], c3: c[3],
        obs: sc, exp: expRatio(sim),
        shape: n ? oneGene(c[0] + c[1], c[2] + c[3], 'round', 'wrinkled') + ' (expected ' + oneGene(probs(sim).R, 1 - probs(sim).R, 'round', 'wrinkled') + ')' : '—',
        colour: n ? oneGene(c[0] + c[2], c[1] + c[3], 'yellow', 'green') + ' (expected ' + oneGene(probs(sim).Y, 1 - probs(sim).Y, 'yellow', 'green') + ')' : '—',
        mendel: MENDEL.join(' : ') + ' = ' + MENDEL.map(function (v) { return M.fmt(v * 16 / 556, 1); }).join(' : ') + ' of 16'
      };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, p = sim.p, st = sim.state, L = layout(sim), sm = L.small;
      D.clear(ctx, L.W, L.H, col.bg);
      var cx0 = L.sqX + L.s / 2, fitW = L.tall ? L.W : L.colW, hl = p.hl === 'none' ? -1 : +p.hl;
      D.text(ctx, crossName(sim, sm), cx0, L.titleY, { color: col.muted, size: sm ? 9.5 : 12, weight: 700, align: 'center', fit: fitW });
      // parents
      var ps = L.ps, py = L.py;
      [p.p1, p.p2].forEach(function (g, k) {
        var x = L.sqX + L.s * (k ? 0.78 : 0.22);
        D.roundRect(ctx, x - ps * 0.55, py - ps * 0.5, ps * 1.1, ps, 8, col.light ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)');
        seed(ctx, g.indexOf('R') >= 0, g.indexOf('Y') >= 0, x, py, ps * 1.3, col);
        D.text(ctx, (k ? '♂ ' : '♀ ') + g + (sm ? '' : ' · ' + looks(g)), x, L.labelY, { color: col.text, size: sm ? 10 : 13, weight: 700, align: 'center', fit: fitW });
      });
      D.text(ctx, '×', cx0, py, { color: col.muted, size: sm ? 18 : 26, weight: 700, align: 'center' });
      // Punnett square
      var s = L.s, x0 = L.sqX, y0 = L.sqY, h = s / 4, g1 = gametes(p.p1), g2 = gametes(p.p2), gr = Math.min(L.hdr * 0.46, h * 0.42);
      for (var a = 0; a < 4; a++) {
        gameteChip(ctx, x0 + h * (a + 0.5), y0 - L.hdr / 2, gr, g1[a], col);
        gameteChip(ctx, x0 - L.hdr / 2, y0 + h * (a + 0.5), gr, g2[a], col);
      }
      var lastK = st.kids.length ? st.kids[st.kids.length - 1] : null, flash = lastK && !reduce ? M.clamp(1 - (now - lastK.t) / 400, 0, 1) : 0;
      var ts = Math.max(8, Math.min(13, h * 0.2));
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
        var g = childOf(g1[i], g2[j]), c = classOf(g), cl = CLASSES[c], cx = x0 + h * i, cy = y0 + h * j, dim = hl >= 0 && hl !== c;
        ctx.save(); if (dim) ctx.globalAlpha = 0.25;
        D.roundRect(ctx, cx + 1, cy + 1, h - 2, h - 2, 5, D.alpha(cl.yellow ? YEL : GRN, col.light ? 0.16 : 0.12), col.border, 1);
        seed(ctx, cl.round, cl.yellow, cx + h / 2, cy + h * 0.4, h * 0.62, col);
        D.text(ctx, g, cx + h / 2, cy + h * 0.83, { color: col.text, size: ts, weight: 700, align: 'center' });
        if (st.kids.length && h > 44) D.text(ctx, '×' + st.cell[i * 4 + j], cx + h - 4, cy + 9, { color: col.muted, size: 9, weight: 700, align: 'right' });
        ctx.restore();
        if (hl === c) D.roundRect(ctx, cx + 1, cy + 1, h - 2, h - 2, 5, null, col.accent, 2.5);
        if (st.last === i * 4 + j && (flash > 0 || (reduce && st.kids.length && st.kids.length < p.n))) D.roundRect(ctx, cx + 1, cy + 1, h - 2, h - 2, 5, null, col.text, 1 + 2 * (reduce ? 1 : flash));
      }
      var below = L.belowY, hlTxt = hl >= 0 ? CLASSES[hl].name + ': ' + Math.round(probs(sim).c[hl] * 16) + ' of 16 boxes' : 'Expected: ' + expShort(sim);
      D.text(ctx, hlTxt, cx0, below, { color: hl >= 0 ? col.accent : col.text, size: sm ? 9.5 : 12, weight: 700, align: 'center', fit: fitW });
      // tray of offspring seeds
      var F = L.field, n = p.n, kids = st.kids;
      D.roundRect(ctx, F.x, F.y, F.w, F.h, 8, col.light ? 'rgba(120,80,30,0.08)' : 'rgba(120,80,30,0.16)');
      D.text(ctx, 'Seeds: ' + kids.length + ' of ' + n, F.x + F.w / 2, F.y - (sm ? 8 : 11), { color: col.text, size: sm ? 10 : 13, weight: 700, align: 'center', fit: L.W });
      var ar = F.w / F.h, cols = Math.max(1, Math.ceil(Math.sqrt(n * ar))), rows = Math.ceil(n / cols);
      while ((rows - 1) * cols >= n) rows--;
      var cell = Math.min(F.w / cols, F.h / rows), gx = F.x + (F.w - cols * cell) / 2, gy0 = F.y + (F.h - rows * cell) / 2;
      for (var k = 0; k < n; k++) {
        var kx = gx + (k % cols + 0.5) * cell, ky = gy0 + (Math.floor(k / cols) + 0.5) * cell, kid = kids[k];
        if (!kid) { if (cell >= 5) D.circle(ctx, kx, ky, Math.max(0.8, cell * 0.08), col.faint); continue; }
        var kc = CLASSES[kid.c], sc = 0.5 + 0.5 * (reduce ? 1 : M.clamp((now - kid.t) / 300, 0, 1));
        ctx.save(); if (hl >= 0 && hl !== kid.c) ctx.globalAlpha = 0.25;
        if (cell >= 9) seed(ctx, kc.round, kc.yellow, kx, ky, cell * 1.4 * sc, col);
        else { var r = cell * 0.42 * sc; ctx.fillStyle = kc.yellow ? YEL : GRN; if (kc.round) D.circle(ctx, kx, ky, r, ctx.fillStyle); else ctx.fillRect(kx - r, ky - r, r * 2, r * 2); }
        ctx.restore();
      }
      // legend under the tray: 2 × 2 with names, or one row of seed + count on phones
      var lh = sm ? 15 : 20, ly0 = F.y + F.h + (sm ? 11 : 15), lw = F.w / (sm ? 4 : 2);
      CLASSES.forEach(function (cl, q) {
        var lx = F.x + lw * (sm ? q : q % 2) + 4, ly = ly0 + (sm ? 0 : lh * Math.floor(q / 2));
        if (ly > L.H - 4) return;
        seed(ctx, cl.round, cl.yellow, lx + 6, ly, sm ? 18 : 20, col);
        D.text(ctx, (sm ? '' : cl.name + ' ') + st.cls[q], lx + 15, ly, { color: hl === q ? col.accent : col.text, size: sm ? 10 : 12, weight: 700 });
      });
    }
  });
})();
