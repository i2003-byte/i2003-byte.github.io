/* =====================================================================
   Gravitation · Universal Law of Gravitation — sim.js
   ---------------------------------------------------------------------
   Two bodies of mass m1 and m2, centres r apart, pull each other with
     F = G m1 m2 ÷ r²,   G = 6.674 × 10⁻¹¹ N m² kg⁻²
   The two pulls are equal and opposite (third law); each body's
   acceleration is F ÷ its own mass (second law), so a light body moves
   a lot and a heavy one hardly at all.
   Five real pairs give the starting masses and distance; three sliders
   scale m1, m2 and r so the learner sees F ∝ m1 m2 and F ∝ 1/r².
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var G = 6.674e-11, g = 9.8;
  var PAIRS = {
    students: { m1: 50, m2: 60, r: 1, n1: 'Student A', n2: 'Student B', c1: '#60a5fa', c2: '#f472b6', what: 'two students standing 1 m apart' },
    trucks: { m1: 10000, m2: 10000, r: 5, n1: 'Loaded truck', n2: 'Loaded truck', c1: '#f59e0b', c2: '#fb923c', what: 'two 10-tonne trucks parked 5 m apart' },
    apple: { m1: 5.97e24, m2: 0.1, r: 6.371e6, n1: 'Earth', n2: 'Apple (100 g)', c1: '#3b82f6', c2: '#ef4444', what: 'the Earth and an apple on the ground', minK: 1 },
    moon: { m1: 5.97e24, m2: 7.35e22, r: 3.84e8, n1: 'Earth', n2: 'Moon', c1: '#3b82f6', c2: '#cbd5e1', what: 'the Earth and the Moon' },
    sun: { m1: 1.989e30, m2: 5.97e24, r: 1.496e11, n1: 'Sun', n2: 'Earth', c1: '#facc15', c2: '#3b82f6', what: 'the Sun and the Earth' }
  };
  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  var drag = false;

  function sci(v, d) {
    if (!isFinite(v)) return '—';
    if (v === 0) return '0';
    var e = Math.floor(Math.log10(Math.abs(v)));
    if (e >= -2 && e <= 4) return M.fmt(v, Math.max(0, Math.min(3, d - e)));
    var m = v / Math.pow(10, e);
    if (Math.abs(+m.toFixed(d)) >= 10) { m /= 10; e += 1; }
    return m.toFixed(d) + ' × 10' + String(e).split('').map(function (ch) { return SUP[ch]; }).join('');
  }
  function massText(kg) {
    if (kg < 1e-3) return sci(kg * 1e6, 2) + ' mg';
    if (kg < 1) return sci(kg * 1e3, 2) + ' g';
    if (kg < 1e4) return sci(kg, 2) + ' kg';
    return sci(kg, 2) + ' kg';
  }
  function distText(m) {
    if (m < 1000) return M.fmt(m, m < 10 ? 1 : 0) + ' m';
    return sci(m / 1000, 2) + ' km';
  }
  function pair(p) { return PAIRS[p.pair] || PAIRS.students; }
  function kOf(p) { return Math.max(p.k, pair(p).minK || 0); }
  function calc(p) {
    var P = pair(p), m1 = P.m1 * p.a, m2 = P.m2 * p.b, k = kOf(p), r = P.r * k;
    var F = G * m1 * m2 / (r * r), F0 = G * P.m1 * P.m2 / (P.r * P.r);
    return { P: P, m1: m1, m2: m2, r: r, k: k, F: F, ratio: F / F0, a1: F / m1, a2: F / m2 };
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560;
    var sceneB = Math.round(H * (narrow ? 0.5 : 0.54));
    var x0 = narrow ? 48 : 90, x1max = W - (narrow ? 40 : 70);
    var unit = (x1max - x0) / 4;  // px for k = 1
    return { W: W, H: H, narrow: narrow, sceneB: sceneB, x0: x0, unit: unit, cy: 34 + (sceneB - 34) * 0.52 };
  }

  SimLab.createSim({
    ariaLabel: 'Two bodies pulling each other with equal and opposite gravitational forces, with a graph of force against distance showing the inverse-square law',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'pair', label: 'Pair of bodies', type: 'select', value: 'students', options: [
        { value: 'students', label: 'Two students (50 kg, 60 kg, 1 m)' },
        { value: 'trucks', label: 'Two loaded trucks (10 t each, 5 m)' },
        { value: 'apple', label: 'Earth and an apple' },
        { value: 'moon', label: 'Earth and the Moon' },
        { value: 'sun', label: 'Sun and the Earth' }] },
      { id: 'a', label: 'Mass m₁ (× the real value)', min: 0.5, max: 4, step: 0.5, value: 1, unit: '×',
        presets: [{ label: '× 1', value: 1 }, { label: '× 2', value: 2 }, { label: '× 3', value: 3 }] },
      { id: 'b', label: 'Mass m₂ (× the real value)', min: 0.5, max: 4, step: 0.5, value: 1, unit: '×',
        presets: [{ label: '× 1', value: 1 }, { label: '× 2', value: 2 }] },
      { id: 'k', label: 'Distance r between centres (× the real value)', min: 0.5, max: 4, step: 0.1, value: 1, unit: '×',
        presets: [{ label: '× 1', value: 1 }, { label: '× 2', value: 2 }, { label: '× 3', value: 3 }],
        help: 'You can also drag the second body. For the Earth and the apple, r cannot go below the Earth\'s radius.' }
    ],
    readouts: [
      { id: 'F', label: 'Force of gravity F', unit: 'N', key: true },
      { id: 'ratio', label: 'F compared with the real pair', unit: '×', digits: 3 },
      { id: 'w', label: 'Same as the weight of' },
      { id: 'r', label: 'Distance r' },
      { id: 'a1', label: 'Acceleration of body 1 = F ÷ m₁', unit: 'm/s²' },
      { id: 'a2', label: 'Acceleration of body 2 = F ÷ m₂', unit: 'm/s²' }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var q = calc(sim.p);
      return { F: sci(q.F, 2), ratio: q.ratio, w: massText(q.F / g), r: distText(q.r), a1: sci(q.a1, 2), a2: sci(q.a2, 2) };
    },
    status: function (sim) { return 'Gravity between ' + pair(sim.p).what; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim), q = calc(sim.p);
        drag = Math.abs(x - (L.x0 + q.k * L.unit)) < 34 && Math.abs(y - L.cy) < 50;
        return drag;
      },
      move: function (sim, x) {
        if (!drag) return;
        var L = layout(sim), k = M.clamp(Math.round((x - L.x0) / L.unit * 10) / 10, 0.5, 4);
        sim.setParam('k', Math.max(k, pair(sim.p).minK || 0));
      },
      up: function () { drag = false; },
      hover: function (sim, x, y) { var L = layout(sim); return Math.abs(x - (L.x0 + calc(sim.p).k * L.unit)) < 34 && Math.abs(y - L.cy) < 50; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, narrow = L.narrow, q = calc(p), P = q.P;
      D.clear(ctx, W, H, c.bg);

      // ---- scene: two bodies on a line ----
      var x1 = L.x0, x2 = L.x0 + q.k * L.unit, cy = L.cy;
      var big = Math.max(q.m1, q.m2), rMax = Math.min(narrow ? 30 : 46, (L.sceneB - 60) / 2, L.unit * 0.3);
      function rad(m) { return Math.max(6, rMax * Math.cbrt(m / big)); }
      var r1 = rad(q.m1), r2 = rad(q.m2);
      if (x2 - x1 < r1 + r2 + 8) r2 = Math.max(6, x2 - x1 - r1 - 8);
      // distance scale
      for (var t = 0.5; t <= 4.001; t += 0.5) {
        var tx = L.x0 + t * L.unit, major = Math.abs(t - Math.round(t)) < 1e-6;
        D.line(ctx, tx, L.sceneB - 18, tx, L.sceneB - (major ? 10 : 14), c.faint, 1);
        if (major) D.text(ctx, t + '×', tx, L.sceneB - 4, { color: c.faint, size: 10, align: 'center' });
      }
      D.line(ctx, L.x0, L.sceneB - 18, L.x0 + 4 * L.unit, L.sceneB - 18, c.faint, 1);
      // r dimension line
      D.line(ctx, x1, cy + rMax + 14, x2, cy + rMax + 14, c.muted, 1, [4, 3]);
      D.text(ctx, 'r = ' + distText(q.r), (x1 + x2) / 2, cy + rMax + 26, { color: c.muted, size: 11, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.85), fit: W });

      var stagger = x2 - x1 < (narrow ? 120 : 150) ? 30 : 0;
      function body(x, rr, col, name, m, lift) {
        var grd = ctx.createRadialGradient(x - rr * 0.35, cy - rr * 0.35, rr * 0.1, x, cy, rr);
        grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.25, col); grd.addColorStop(1, D.alpha(col, 0.75));
        D.circle(ctx, x, cy, rr, grd, D.alpha('#000', 0.3), 1);
        D.text(ctx, name, x, cy - rMax - 22 - lift, { color: c.text, size: narrow ? 11 : 12.5, weight: 700, align: 'center', fit: W });
        D.text(ctx, massText(m), x, cy - rMax - 8 - lift, { color: c.muted, size: narrow ? 10 : 11, align: 'center', fit: W });
        if (lift) D.line(ctx, x, cy - rMax - 2 - lift, x, cy - rr - 2, D.alpha(c.muted, 0.5), 1);
      }
      body(x1, r1, P.c1, P.n1, q.m1, 0);
      body(x2, r2, P.c2, P.n2, q.m2, stagger);

      // equal and opposite force arrows (length grows with log of F)
      var gap = x2 - x1 - r1 - r2;
      var len = M.clamp(34 + 14 * Math.log2(q.ratio), 4, Math.max(4, gap / 2 - 4));
      D.arrow(ctx, x1 + r1 * 0.3, cy, x1 + r1 + len, cy, c.s3, 3.5, 10);
      D.arrow(ctx, x2 - r2 * 0.3, cy, x2 - r2 - len, cy, c.s3, 3.5, 10);
      D.text(ctx, 'F', x1 + r1 * 0.5 + len / 2, gap < 40 ? cy + 14 : cy - 13, { color: c.s3, size: 12, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.7), pad: 2 });
      D.text(ctx, 'F', x2 - r2 * 0.5 - len / 2, cy - 13, { color: c.s3, size: 12, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.7), pad: 2 });
      D.text(ctx, '(not to scale)', W - 8, L.sceneB - 30, { color: c.faint, size: 10, align: 'right' });
      if (P.minK && q.k <= 1.0001) D.text(ctx, 'apple on the ground: r = Earth\'s radius', (x1 + x2) / 2, cy + rMax + 42, { color: c.faint, size: 10, align: 'center', fit: W });

      // headline
      var head = 'F = G m₁ m₂ ÷ r² = ' + sci(q.F, 2) + ' N';
      var hs = narrow ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(head).width > W - 30) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, head, W / 2, 16, { color: c.bg, bg: c.s1, size: hs, weight: 700, align: 'center', pad: 5, fit: W });

      // ---- graph: F against distance (× real), for the current masses ----
      var A = p.a * p.b, gx0 = narrow ? 46 : 70, gx1 = W - (narrow ? 14 : 30), gy0 = L.sceneB + 26, gy1 = H - 30;
      var kMin = P.minK || 0.5, yTop = A / (kMin * kMin);
      function GX(k) { return gx0 + (k - 0.5) / 3.5 * (gx1 - gx0); }
      function GY(v) { return gy1 - v / yTop * (gy1 - gy0); }
      D.line(ctx, gx0, L.sceneB + 6, W - 8, L.sceneB + 6, c.grid, 1);
      D.text(ctx, narrow ? 'F (× real pair) against r: double r → F ÷ 4' : 'F (× the real pair\'s force) against distance r: double r → F ÷ 4', gx0 - (narrow ? 38 : 50), L.sceneB + 16, { color: c.muted, size: narrow ? 10.5 : 12, weight: 600, fit: W });
      D.line(ctx, gx0, gy0, gx0, gy1, c.axis, 1.2); D.line(ctx, gx0, gy1, gx1, gy1, c.axis, 1.2);
      var ys = D.niceStep(yTop, 4);
      for (var yv = 0; yv <= yTop + 1e-9; yv += ys) {
        D.line(ctx, gx0, GY(yv), gx1, GY(yv), c.grid, 1);
        D.text(ctx, M.fmt(yv, ys < 1 ? 1 : 0), gx0 - 6, GY(yv), { color: c.faint, size: 10, align: 'right' });
      }
      for (var kx = 0.5; kx <= 4.001; kx += 0.5) D.text(ctx, kx + '×', GX(kx), gy1 + 12, { color: c.faint, size: 10, align: 'center' });
      D.text(ctx, 'r', gx1, gy1 + 24, { color: c.faint, size: 10, align: 'right' });
      if (Math.abs(A - 1) > 1e-9) D.curve(ctx, function (px) { var k = 0.5 + (px - gx0) / (gx1 - gx0) * 3.5; return GY(1 / (Math.max(k, kMin) * Math.max(k, kMin))); }, GX(kMin), gx1, D.alpha(c.muted, 0.6), 1.5, 2);
      D.curve(ctx, function (px) { var k = 0.5 + (px - gx0) / (gx1 - gx0) * 3.5; return GY(A / (k * k)); }, GX(kMin), gx1, c.s1, 2.5, 2);
      // whole-number marks: ÷1, ÷4, ÷9, ÷16
      [1, 2, 3, 4].forEach(function (n) {
        if (n < kMin) return;
        D.circle(ctx, GX(n), GY(A / (n * n)), 3, c.s1);
        if (n > 1) D.text(ctx, '÷' + n * n, GX(n), GY(A / (n * n)) - 11, { color: c.muted, size: 10, weight: 600, align: 'center' });
      });
      var px = GX(q.k), py = GY(q.ratio);
      D.line(ctx, px, gy1, px, py, c.s3, 1, [4, 3]); D.line(ctx, gx0, py, px, py, c.s3, 1, [4, 3]);
      D.circle(ctx, px, py, 6, c.s3, c.bg, 2);
      D.text(ctx, M.fmt(q.ratio, q.ratio < 1 ? 3 : 2) + '×', px + 9, py < gy0 + 24 ? py + 14 : py - 10, { color: c.s3, size: 11, weight: 700, bg: D.alpha(c.bg, 0.85), fit: W });
      if (Math.abs(A - 1) > 1e-9) D.text(ctx, 'grey: real masses', gx1, gy0 + 4, { color: c.faint, size: 10, align: 'right' });
    }
  });
})();
