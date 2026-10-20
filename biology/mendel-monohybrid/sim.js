/* =====================================================================
   Biology · Principles of inheritance · Mendel's Monohybrid Cross — sim.js
   ---------------------------------------------------------------------
   One gene with two alleles, complete dominance (A dominant, a recessive).
   Each parent passes ONE of its two alleles to a child, each with chance ½
   (law of segregation). If parent k carries nA dominant alleles, it gives
   A with chance pk = nA / 2, so for a child:
       P(AA) = p1 p2,  P(aa) = (1 − p1)(1 − p2),  P(Aa) = the rest
       P(shows the dominant trait) = 1 − P(aa)
   Tt × Tt → 1 TT : 2 Tt : 1 tt → 3 : 1;  Tt × tt → 1 : 1 (test cross).
   Mendel's own F2 counts (Experiments on Plant Hybrids, 1866):
     stem 787 : 277 · seed shape 5474 : 1850 · seed colour 6022 : 2001 ·
     flower colour 705 : 224 · pod shape 882 : 299 · pod colour 428 : 152 ·
     flower position 651 : 207.
   Play makes offspring one at a time from random gametes; the graph shows
   the share with the dominant trait settling near the expected value.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TRAITS = {
    height: { name: 'Stem height', L: 'T', dom: 'Tall', rec: 'Dwarf', m: [787, 277], dc: '#16a34a', rc: '#a3e635' },
    shape: { name: 'Seed shape', L: 'R', dom: 'Round', rec: 'Wrinkled', m: [5474, 1850], dc: '#d6b85a', rc: '#8a6d2f' },
    scol: { name: 'Seed colour', L: 'Y', dom: 'Yellow', rec: 'Green', m: [6022, 2001], dc: '#facc15', rc: '#65a30d' },
    fcol: { name: 'Flower colour', L: 'V', dom: 'Violet', rec: 'White', m: [705, 224], dc: '#8b5cf6', rc: '#f1f5f9' },
    pshape: { name: 'Pod shape', L: 'I', dom: 'Inflated', rec: 'Constricted', m: [882, 299], dc: '#22c55e', rc: '#0f766e' },
    pcol: { name: 'Pod colour', L: 'G', dom: 'Green', rec: 'Yellow', m: [428, 152], dc: '#22c55e', rc: '#eab308' },
    fpos: { name: 'Flower position', L: 'A', dom: 'Axial', rec: 'Terminal', m: [651, 207], dc: '#c084fc', rc: '#f472b6' }
  };
  var nTarget = 100; // graph x-axis length, set in reset

  function tr(sim) { return TRAITS[sim.p.trait]; }
  function nDom(g) { return g === 'AA' ? 2 : g === 'Aa' ? 1 : 0; }
  function letters(sim, g) { var L = tr(sim).L; return g.replace(/A/g, L).replace(/a/g, L.toLowerCase()); }
  function alleleOf(g, i) { return g.charAt(i); }       // 'A' or 'a'
  function genoOf(a, b) { return a === 'A' || b === 'A' ? (a === b ? 'AA' : 'Aa') : 'aa'; }
  function probs(sim) {
    var p1 = nDom(sim.p.p1) / 2, p2 = nDom(sim.p.p2) / 2;
    var AA = p1 * p2, aa = (1 - p1) * (1 - p2);
    return { AA: AA, Aa: 1 - AA - aa, aa: aa, dom: 1 - aa };
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function ratioText(a, b) {
    if (!b) return 'all ' + 'dominant'; if (!a) return 'all recessive';
    var g = gcd(a, b); return a / g + ' : ' + b / g;
  }
  function expPheno(sim) {
    var t = tr(sim), q = probs(sim), d = Math.round(q.dom * 4), r = 4 - d;
    if (!r) return 'all ' + t.dom.toLowerCase();
    if (!d) return 'all ' + t.rec.toLowerCase();
    return ratioText(d, r) + ' (' + t.dom.toLowerCase() + ' : ' + t.rec.toLowerCase() + ')';
  }
  function expGeno(sim) {
    var q = probs(sim), parts = [];
    ['AA', 'Aa', 'aa'].forEach(function (g) { var n = Math.round(q[g] * 4); if (n) parts.push({ n: n, g: letters(sim, g) }); });
    if (parts.length === 1) return 'all ' + parts[0].g;
    var k = parts.reduce(function (a, p) { return gcd(a, p.n); }, 0);
    return parts.map(function (p) { return p.n / k + ' ' + p.g; }).join(' : ');
  }
  function crossName(sim, sm) {
    var a = sim.p.p1, b = sim.p.p2, s = [a, b].sort().join('×');
    if (s === 'AA×aa') return sm ? 'P: pure × pure → F1' : 'Parents: pure-breeding × pure-breeding → F1';
    if (s === 'Aa×Aa') return sm ? 'F1 × F1 → F2' : 'F1 × F1 (selfing the hybrid) → F2';
    if (s === 'Aa×aa') return sm ? 'Test cross' : 'Test cross: hybrid × recessive';
    if (a === b) return sm ? 'Pure line, selfed' : 'Pure-breeding line, crossed with itself';
    return sm ? 'Your own cross' : 'A cross of your choice';
  }

  /* ---------- pictures of each trait ---------- */
  // Draws the phenotype in a box of size s centred at (x, y).
  function pheno(ctx, key, dom, x, y, s, col) {
    var t = TRAITS[key], c = dom ? t.dc : t.rc, line = col.light ? '#334155' : '#0f172a';
    var stem = '#15803d', leaf = '#22c55e';
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (key === 'height' || key === 'fpos') {
      var hh = key === 'height' ? (dom ? 0.9 : 0.36) * s : 0.86 * s, by = y + s * 0.46, ty = by - hh;
      D.line(ctx, x, by, x, ty, stem, Math.max(1.5, s * 0.05));
      var nl = key === 'height' ? (dom ? 4 : 2) : 3;
      for (var i = 0; i < nl; i++) {
        var ly = by - hh * (i + 0.6) / (nl + 0.3), sd = i % 2 ? 1 : -1;
        ctx.fillStyle = leaf; ctx.beginPath(); ctx.ellipse(x + sd * s * 0.13, ly, s * 0.12, s * 0.05, sd * -0.5, 0, Math.PI * 2); ctx.fill();
        if (key === 'fpos' && dom) D.circle(ctx, x - sd * s * 0.08, ly - s * 0.03, s * 0.065, t.dc, line, 0.8);
      }
      if (key === 'fpos' && !dom) for (var f = 0; f < 3; f++) D.circle(ctx, x + (f - 1) * s * 0.1, ty + (f === 1 ? -s * 0.03 : s * 0.02), s * 0.07, t.rc, line, 0.8);
      if (key === 'height') D.circle(ctx, x, ty, s * 0.05, '#e9d5ff');
      D.line(ctx, x - s * 0.22, by, x + s * 0.22, by, col.light ? '#a16207' : '#78350f', Math.max(1.5, s * 0.04));
    } else if (key === 'shape' || key === 'scol') {
      var r = s * 0.3, wr = key === 'shape' && !dom;
      ctx.beginPath();
      for (var k = 0; k <= 48; k++) {
        var a = k / 48 * Math.PI * 2, rr = r * (wr ? 0.88 + 0.12 * Math.cos(a * 7) : 1);
        if (k) ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); else ctx.moveTo(x + rr, y);
      }
      ctx.closePath(); ctx.fillStyle = key === 'shape' ? TRAITS.shape.dc : c; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
      if (wr) { ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - r * 0.2); ctx.quadraticCurveTo(x, y + r * 0.1, x + r * 0.4, y - r * 0.25); ctx.stroke(); }
      D.circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.18, 'rgba(255,255,255,0.45)');
    } else if (key === 'fcol') {
      for (var p = 0; p < 5; p++) {
        var pa = p / 5 * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath(); ctx.ellipse(x + Math.cos(pa) * s * 0.17, y + Math.sin(pa) * s * 0.17, s * 0.15, s * 0.1, pa, 0, Math.PI * 2);
        ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 0.8; ctx.stroke();
      }
      D.circle(ctx, x, y, s * 0.07, '#facc15');
    } else { // pods
      var w = s * 0.42, h2 = s * 0.17, pc = key === 'pcol' ? c : TRAITS.pcol.dc, pinched = key === 'pshape' && !dom;
      ctx.beginPath();
      if (pinched) {
        ctx.moveTo(x - w, y);
        for (var q = 0; q <= 4; q++) { var qx = x - w + q * w / 2; ctx.quadraticCurveTo(qx - w / 4, y - h2 * 1.4, qx, y - (q === 0 || q === 4 ? 0 : h2 * 0.35)); }
        for (var q2 = 4; q2 >= 0; q2--) { var qx2 = x - w + q2 * w / 2; ctx.quadraticCurveTo(qx2 + w / 4, y + h2 * 1.4, qx2, y + (q2 === 0 || q2 === 4 ? 0 : h2 * 0.35)); }
      } else {
        ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - h2 * 2.3, x + w, y); ctx.quadraticCurveTo(x, y + h2 * 2.3, x - w, y);
      }
      ctx.closePath(); ctx.fillStyle = pc; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke();
      D.line(ctx, x + w, y, x + w + s * 0.07, y - s * 0.08, stem, Math.max(1.2, s * 0.03));
    }
    ctx.restore();
  }

  function gamete(ctx, x, y, r, al, sim, col) {
    var t = tr(sim), dom = al === 'A';
    D.circle(ctx, x, y, r, col.light ? '#fff7ed' : '#1e293b', dom ? t.dc : (col.light ? '#64748b' : '#94a3b8'), 1.6);
    D.text(ctx, dom ? t.L : t.L.toLowerCase(), x, y + 0.5, { color: col.text, size: Math.max(9, r * 1.1), weight: 800, align: 'center' });
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, small = W < 560, m = small ? 6 : 12;
    var tall = H > W * 1.15, L = { W: W, H: H, small: small, m: m };
    var colW = tall ? W : Math.round(W * (small ? 0.5 : 0.46)), topH = tall ? H * 0.56 : H;
    var titleH = small ? 16 : 24, labelH = small ? 14 : 20, hdr = small ? 22 : 30, botH = small ? 30 : 44;
    var avail = topH - titleH - labelH - hdr - botH - 6;
    var s = Math.max(60, Math.min(colW - hdr - 2 * m, avail - Math.min(110, avail * 0.3)));
    var ps = Math.max(26, Math.min(110, avail - s, s * 0.4));
    var extra = Math.max(0, (avail - s - ps) / 2);
    L.s = s; L.ps = ps; L.hdr = hdr; L.colW = colW;
    L.sqX = (tall ? (W - s - hdr) / 2 : (colW - s - hdr) / 2) + hdr;
    L.titleY = extra / 2 + titleH / 2;
    L.py = extra / 2 + titleH + ps / 2 + extra / 2;
    L.labelY = L.py + ps / 2 + labelH / 2 + 2;
    L.sqY = L.labelY + labelH / 2 + hdr + 2;
    L.belowY = L.sqY + s + (small ? 11 : 16);
    L.field = tall ? { x: m, y: topH + 18, w: W - 2 * m, h: H - topH - 40 } : { x: colW + m, y: m + (small ? 16 : 22), w: W - colW - 2 * m, h: H - 2 * m - (small ? 40 : 60) };
    return L;
  }

  function makeChild(sim) {
    var st = sim.state, i = Math.random() < 0.5 ? 0 : 1, j = Math.random() < 0.5 ? 0 : 1;
    var g = genoOf(alleleOf(sim.p.p1, i), alleleOf(sim.p.p2, j));
    st.kids.push({ i: i, j: j, g: g, d: g !== 'aa', t: performance.now() });
    st.cell[i * 2 + j]++; st.geno[g]++; if (g !== 'aa') st.dom++; else st.rec++;
    st.last = i * 2 + j;
    if (sim.graph) sim.graph.push(st.kids.length, [st.dom / st.kids.length, probs(sim).dom]);
  }

  SimLab.createSim({
    ariaLabel: "Mendel's monohybrid cross: two pea plant parents, their gametes, a Punnett square and a field of offspring that grows one plant at a time, with counts of the dominant and recessive trait",
    mobileAspect: '1 / 1',
    playLabel: 'Grow offspring',
    params: [
      { id: 'trait', label: 'Trait (one of Mendel’s seven)', type: 'select', value: 'height', options: [
        { value: 'height', label: 'Stem height: tall (T) / dwarf (t)' },
        { value: 'shape', label: 'Seed shape: round (R) / wrinkled (r)' },
        { value: 'scol', label: 'Seed colour: yellow (Y) / green (y)' },
        { value: 'fcol', label: 'Flower colour: violet (V) / white (v)' },
        { value: 'pshape', label: 'Pod shape: inflated (I) / constricted (i)' },
        { value: 'pcol', label: 'Pod colour: green (G) / yellow (g)' },
        { value: 'fpos', label: 'Flower position: axial (A) / terminal (a)' }] },
      { id: 'p1', label: 'Parent 1', type: 'select', value: 'AA', options: [
        { value: 'AA', label: 'Pure dominant (TT, RR …)' }, { value: 'Aa', label: 'Hybrid (Tt, Rr …)' }, { value: 'aa', label: 'Pure recessive (tt, rr …)' }] },
      { id: 'p2', label: 'Parent 2', type: 'select', value: 'aa', options: [
        { value: 'AA', label: 'Pure dominant (TT, RR …)' }, { value: 'Aa', label: 'Hybrid (Tt, Rr …)' }, { value: 'aa', label: 'Pure recessive (tt, rr …)' }] },
      { id: 'n', label: 'Number of offspring', min: 4, max: 1000, step: 1, value: 100,
        presets: [{ label: '4', value: 4 }, { label: '20', value: 20 }, { label: '100', value: 100 }, { label: '1000', value: 1000 }] }
    ],
    buttonsTitle: 'Crosses',
    buttons: [
      { label: 'Pure × pure (P → F1)', onClick: function (sim) { sim.setParam('p1', 'AA'); sim.setParam('p2', 'aa'); sim.reset(); } },
      { label: 'Self the F1 (F1 × F1 → F2)', primary: true, onClick: function (sim) { sim.setParam('p1', 'Aa'); sim.setParam('p2', 'Aa'); sim.reset(); sim.play(); } },
      { label: 'Test cross (hybrid × recessive)', full: true, onClick: function (sim) { sim.setParam('p1', 'Aa'); sim.setParam('p2', 'aa'); sim.reset(); sim.play(); } }
    ],
    readouts: [
      { id: 'dom', label: 'Show the dominant trait', key: true, short: 'Dominant' },
      { id: 'rec', label: 'Show the recessive trait', key: true, short: 'Recessive' },
      { id: 'ratio', label: 'Observed ratio', key: true, short: 'Ratio' },
      { id: 'exp', label: 'Expected ratio (phenotype)' },
      { id: 'geno', label: 'Genotypes: expected / so far' },
      { id: 'mendel', label: 'Mendel’s own F2 count' }
    ],
    graph: { title: 'Share of offspring with the dominant trait', xLabel: 'offspring', yLabel: 'share', yMin: 0, yMax: 1,
      xMax: function () { return nTarget; }, series: [{ label: 'observed' }, { label: 'expected', color: '--sim-3' }] },

    reset: function (sim) {
      nTarget = sim.p.n;
      sim.state = { kids: [], cell: [0, 0, 0, 0], geno: { AA: 0, Aa: 0, aa: 0 }, dom: 0, rec: 0, acc: 0, last: -1 };
    },
    update: function (sim, dt) {
      var st = sim.state, rate = M.clamp(sim.p.n / 8, 2, 150);
      st.acc += dt * rate;
      while (st.acc >= 1 && st.kids.length < sim.p.n) { st.acc -= 1; makeChild(sim); }
    },
    finished: function (sim) { return sim.state.kids.length >= sim.p.n; },
    animate: function (sim) { var k = sim.state.kids; return !reduce && k.length && performance.now() - k[k.length - 1].t < 400; },
    status: function (sim) {
      var n = sim.state.kids.length;
      return n >= sim.p.n ? 'Done: ' + n + ' offspring. Press Restart for a new batch' : n ? 'Growing offspring: ' + n + ' of ' + sim.p.n : 'Press Grow offspring to make ' + sim.p.n + ' children from random gametes';
    },
    readout: function (sim) {
      var st = sim.state, t = tr(sim), n = st.kids.length;
      return {
        dom: t.dom + ': ' + st.dom,
        rec: t.rec + ': ' + st.rec,
        ratio: !n ? '—' : !st.rec ? 'all ' + t.dom.toLowerCase() : !st.dom ? 'all ' + t.rec.toLowerCase() : M.fmt(st.dom / st.rec, 2) + ' : 1',
        exp: expPheno(sim),
        geno: expGeno(sim) + ' / ' + letters(sim, 'AA') + ' ' + st.geno.AA + ', ' + letters(sim, 'Aa') + ' ' + st.geno.Aa + ', ' + letters(sim, 'aa') + ' ' + st.geno.aa,
        mendel: t.m[0] + ' ' + t.dom.toLowerCase() + ' : ' + t.m[1] + ' ' + t.rec.toLowerCase() + ' = ' + M.fmt(t.m[0] / t.m[1], 2) + ' : 1'
      };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, p = sim.p, st = sim.state, t = tr(sim), L = layout(sim), sm = L.small;
      D.clear(ctx, L.W, L.H, col.bg);
      var cx0 = L.sqX + L.s / 2, fitW = L.colW < L.W ? L.colW : L.W, gr = Math.min(L.hdr * 0.38, 11);
      // ---- title of the cross
      D.text(ctx, crossName(sim, sm), cx0, L.titleY, { color: col.muted, size: sm ? 9.5 : 12, weight: 700, align: 'center', fit: fitW });
      // ---- parents (parent 1 gives the eggs, parent 2 the pollen)
      var ps = L.ps, py = L.py;
      [p.p1, p.p2].forEach(function (g, k) {
        var x = L.sqX + L.s * (k ? 0.75 : 0.25);
        D.roundRect(ctx, x - ps * 0.55, py - ps * 0.55, ps * 1.1, ps * 1.1, 8, col.light ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)');
        pheno(ctx, p.trait, g !== 'aa', x, py, ps, col);
        D.text(ctx, (k ? '♂ ' : '♀ ') + letters(sim, g) + ' · ' + (g !== 'aa' ? t.dom : t.rec), x, L.labelY, { color: col.text, size: sm ? 10 : 13, weight: 700, align: 'center', fit: L.W });
      });
      D.text(ctx, '×', cx0, py, { color: col.muted, size: sm ? 18 : 26, weight: 700, align: 'center' });
      // ---- Punnett square: eggs (parent 1) across the top, pollen (parent 2) down the side
      var s = L.s, x0 = L.sqX, y0 = L.sqY, h = s / 2;
      for (var a = 0; a < 2; a++) {
        gamete(ctx, x0 + h * (a + 0.5), y0 - L.hdr / 2, gr, p.p1.charAt(a), sim, col);
        gamete(ctx, x0 - L.hdr / 2, y0 + h * (a + 0.5), gr, p.p2.charAt(a), sim, col);
      }
      D.text(ctx, '♀', x0 + s + 3, y0 - L.hdr / 2, { color: col.muted, size: sm ? 11 : 14, weight: 700 });
      D.text(ctx, '♂', x0 - L.hdr / 2, y0 + s + 3, { color: col.muted, size: sm ? 11 : 14, weight: 700, align: 'center', baseline: 'top' });
      var lastK = st.kids.length ? st.kids[st.kids.length - 1] : null, flash = lastK && !reduce ? M.clamp(1 - (now - lastK.t) / 400, 0, 1) : 0;
      for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) {
        var g = genoOf(p.p1.charAt(i), p.p2.charAt(j)), cx = x0 + h * i, cy = y0 + h * j, dom = g !== 'aa';
        D.roundRect(ctx, cx + 1.5, cy + 1.5, h - 3, h - 3, 6, D.alpha(dom ? t.dc : t.rc, col.light ? 0.16 : 0.13), col.border, 1);
        if (st.last === i * 2 + j && (flash > 0 || (reduce && st.kids.length && st.kids.length < p.n))) D.roundRect(ctx, cx + 1.5, cy + 1.5, h - 3, h - 3, 6, null, col.accent, 1 + 2.5 * (reduce ? 1 : flash));
        pheno(ctx, p.trait, dom, cx + h / 2, cy + h * 0.44, h * 0.56, col);
        D.text(ctx, letters(sim, g), cx + h / 2, cy + h * 0.84, { color: col.text, size: Math.max(10, Math.min(16, h * 0.16)), weight: 800, align: 'center' });
        if (h > 56) D.text(ctx, '¼', cx + 8, cy + 11, { color: col.faint, size: sm ? 9 : 11, weight: 700 });
        if (st.kids.length) D.text(ctx, '×' + st.cell[i * 2 + j], cx + h - 5, cy + 11, { color: col.muted, size: sm ? 9 : 11, weight: 700, align: 'right' });
      }
      var below = L.belowY;
      D.text(ctx, 'Expected: ' + expPheno(sim), cx0, below, { color: col.text, size: sm ? 9.5 : 12, weight: 700, align: 'center', fit: fitW });
      D.text(ctx, expGeno(sim), cx0, below + (sm ? 13 : 18), { color: col.muted, size: sm ? 9.5 : 12, align: 'center', fit: fitW });
      // ---- field of offspring
      var F = L.field, n = p.n, kids = st.kids;
      D.roundRect(ctx, F.x, F.y, F.w, F.h, 8, col.light ? 'rgba(120,80,30,0.08)' : 'rgba(120,80,30,0.16)');
      var tx = F.x + F.w / 2, ty = F.y - (sm ? 8 : 11);
      D.text(ctx, 'Offspring: ' + kids.length + ' of ' + n, tx, ty, { color: col.text, size: sm ? 10 : 13, weight: 700, align: 'center', fit: L.W });
      var ar = F.w / F.h, cols = Math.max(1, Math.ceil(Math.sqrt(n * ar))), rows = Math.ceil(n / cols);
      while ((rows - 1) * cols >= n) rows--;
      var cell = Math.min(F.w / cols, F.h / rows), gx = F.x + (F.w - cols * cell) / 2, gy0 = F.y + (F.h - rows * cell) / 2;
      var icons = cell >= 16;
      for (var k = 0; k < n; k++) {
        var kx = gx + (k % cols + 0.5) * cell, ky = gy0 + (Math.floor(k / cols) + 0.5) * cell, kid = kids[k];
        if (!kid) { if (cell >= 5) D.circle(ctx, kx, ky, Math.max(0.8, cell * 0.08), col.faint); continue; }
        var age = reduce ? 1 : M.clamp((now - kid.t) / 300, 0, 1), sc = 0.5 + 0.5 * age;
        if (icons) pheno(ctx, p.trait, kid.d, kx, ky, cell * 0.92 * sc, col);
        else { var r = cell * 0.42 * sc; ctx.fillStyle = kid.d ? t.dc : t.rc; ctx.fillRect(kx - r, ky - r, r * 2, r * 2); }
      }
      // legend under the field
      var ly = F.y + F.h + (sm ? 12 : 16), lw = F.w / 2;
      [[t.dom, t.dc, st.dom], [t.rec, t.rc, st.rec]].forEach(function (e, q) {
        var lx = F.x + lw * (q + 0.5);
        if (F.y + F.h + 10 > L.H) return;
        ctx.fillStyle = e[1]; ctx.fillRect(lx - (sm ? 34 : 50), ly - 5, 10, 10);
        ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(lx - (sm ? 34 : 50), ly - 5, 10, 10);
        D.text(ctx, e[0] + ' ' + e[2], lx - (sm ? 20 : 34), ly, { color: col.text, size: sm ? 10 : 12, weight: 700 });
      });
      if (!sm && kids.length && st.rec && st.dom) D.text(ctx, 'Observed ' + M.fmt(st.dom / st.rec, 2) + ' : 1  ·  Mendel’s F2: ' + M.fmt(t.m[0] / t.m[1], 2) + ' : 1', tx, ly + 20, { color: col.muted, size: 12, align: 'center', fit: L.W });
    }
  });
})();
