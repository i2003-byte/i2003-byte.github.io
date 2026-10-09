/* =====================================================================
   Triangles · Pythagoras by Rearrangement — sim.js
   ---------------------------------------------------------------------
   Two views of a triangle with sides a, b (sliders, in cm) and the
   angle between them (`corner`, 90° = right angle).
   squares   — squares drawn outward on all three sides, with a 1 cm grid.
               c² = a² + b² − 2ab·cos(corner)  (cosine rule, used only to
               draw the third side). At 90° this gives c² = a² + b².
   rearrange — the classic proof. A big square of side (a + b) holds four
               copies of the right triangle (legs a, b).
               Arrangement 1: one at each corner → the gap is a tilted
               square of side c, area c².
               Arrangement 2: slide three triangles (pure translations,
               no turning) into two a × b rectangles → the gaps are
               squares a² and b². The gap area did not change, so
               c² = a² + b².
   Screen coordinates (y down) inside the big square, s = a + b:
     T1 R(0,0) (a,0) (0,b)       stays
     T2 R(s,0) (a,0) (s,a)       moves by (0, b)
     T4 R(0,s) (b,s) (0,b)       moves by (a, 0)
     T3 R(s,s) (s,a) (b,s)       moves by (−b, −a)
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var DUR = 2400, rk = { from: 0, to: 0, t0: 0 };

  function kNow() {
    var u = M.clamp((performance.now() - rk.t0) / DUR, 0, 1);
    return rk.from + (rk.to - rk.from) * u;
  }
  function ease(u) { u = M.clamp(u, 0, 1); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function csq(p) { var t = p.view === 'rearrange' ? 90 : p.corner; return p.a * p.a + p.b * p.b - 2 * p.a * p.b * Math.cos(M.rad(t)); }
  function fmtA(v) { return Math.abs(v - Math.round(v)) < 0.005 ? String(Math.round(v)) : M.fmt(v, 1); }
  function headline(ctx, W, txt, bg, narrow, c) {
    var hs = narrow ? 12 : 14;
    ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
    while (hs > 9 && ctx.measureText(txt).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
    D.text(ctx, txt, W / 2, 14, { color: c.bg, bg: bg, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
  }
  function poly(ctx, pts, fill, stroke, lw) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
  }

  function drawSquares(sim) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560;
    var th = M.rad(p.corner);
    // model (y up): C at origin, B on the x-axis (side a), A at angle `corner` (side b)
    var C = { x: 0, y: 0 }, B = { x: p.a, y: 0 }, A = { x: p.b * Math.cos(th), y: p.b * Math.sin(th) };
    function sq(P, Q, R) {        // square on PQ, away from R
      var dx = Q.x - P.x, dy = Q.y - P.y, n = { x: -dy, y: dx };
      var mx = (P.x + Q.x) / 2 - R.x, my = (P.y + Q.y) / 2 - R.y;
      if (n.x * mx + n.y * my < 0) { n.x = -n.x; n.y = -n.y; }
      return [P, Q, { x: Q.x + n.x, y: Q.y + n.y }, { x: P.x + n.x, y: P.y + n.y }];
    }
    var sqs = { a: sq(C, B, A), b: sq(A, C, B), c: sq(B, A, C) };
    var all = sqs.a.concat(sqs.b, sqs.c), x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    all.forEach(function (q) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
    var top = narrow ? 40 : 44, sc = Math.min((W - 24) / (x1 - x0), (H - top - 14) / (y1 - y0));
    var ox = (W - (x1 - x0) * sc) / 2 - x0 * sc, oy = top + (H - top - (y1 - y0) * sc) / 2 + y1 * sc;
    function S(q) { return { x: ox + q.x * sc, y: oy - q.y * sc }; }
    var cols = { a: c.warning, b: c.s1, c: c.s2 }, len = { a: p.a, b: p.b, c: Math.sqrt(csq(p)) };
    ['a', 'b', 'c'].forEach(function (k) {
      var q = sqs[k].map(S);
      poly(ctx, q, D.alpha(cols[k], 0.22), cols[k], 2);
      // 1 cm grid inside the square
      var n = Math.floor(len[k] - 1e-6);
      if (sc >= 5) {
        ctx.save(); ctx.strokeStyle = D.alpha(cols[k], 0.45); ctx.lineWidth = 1; ctx.beginPath();
        for (var i = 1; i <= n; i++) {
          var u = i / len[k];
          ctx.moveTo(M.lerp(q[0].x, q[1].x, u), M.lerp(q[0].y, q[1].y, u)); ctx.lineTo(M.lerp(q[3].x, q[2].x, u), M.lerp(q[3].y, q[2].y, u));
          ctx.moveTo(M.lerp(q[0].x, q[3].x, u), M.lerp(q[0].y, q[3].y, u)); ctx.lineTo(M.lerp(q[1].x, q[2].x, u), M.lerp(q[1].y, q[2].y, u));
        }
        ctx.stroke(); ctx.restore();
      }
      var cx = (q[0].x + q[2].x) / 2, cy = (q[0].y + q[2].y) / 2, side = len[k] * sc;
      var txt = k + '² = ' + fmtA(len[k] * len[k]), fs = M.clamp(side / 6, 9, narrow ? 13 : 15);
      D.text(ctx, txt, cx, cy, { color: c.ink, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 3, fit: W });
    });
    var sA = S(A), sB = S(B), sC = S(C);
    poly(ctx, [sA, sB, sC], c.bg, c.ink, 2.5);
    // right-angle mark or angle arc at C
    if (p.corner === 90) {
      var m = Math.min(12, p.a * sc * 0.25);
      poly(ctx, [sC, { x: sC.x + m, y: sC.y }, { x: sC.x + m, y: sC.y - m }, { x: sC.x, y: sC.y - m }], null, c.ink, 1.5);
    } else {
      ctx.strokeStyle = c.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sC.x, sC.y, 14, -th, 0); ctx.stroke();
      D.text(ctx, p.corner + '°', sC.x + 18 * Math.cos(th / 2) + 4, sC.y - 18 * Math.sin(th / 2) - 4, { color: c.ink, size: 11, weight: 700 });
    }
    function mid(P, Q, txt, col) { D.text(ctx, txt, (P.x + Q.x) / 2, (P.y + Q.y) / 2, { color: col, size: 12, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 2 }); }
    mid(sC, sB, 'a', cols.a); mid(sA, sC, 'b', cols.b); mid(sB, sA, 'c', cols.c);

    var s2 = p.a * p.a + p.b * p.b, cc = csq(p);
    if (p.corner === 90) headline(ctx, W, 'a² + b² = ' + fmtA(p.a * p.a) + ' + ' + fmtA(p.b * p.b) + ' = ' + fmtA(s2) + ' = c²', c.success, narrow, c);
    else headline(ctx, W, 'a² + b² = ' + fmtA(s2) + ' but c² = ' + fmtA(cc) + (p.corner < 90 ? ' (smaller: acute corner)' : ' (bigger: obtuse corner)'), c.danger, narrow, c);
  }

  function drawRearrange(sim) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560;
    var a = p.a, b = p.b, s = a + b, k = kNow();
    var wide = W > H * 1.2, top = narrow ? 44 : 50, bottom = wide ? 14 : 58;
    var side = Math.min(H - top - bottom, wide ? W * 0.55 : W - 28), u = side / s;
    var X0 = wide ? 24 : (W - side) / 2, Y0 = top + (H - top - bottom - side) / 2;
    function P(x, y) { return { x: X0 + x * u, y: Y0 + y * u }; }
    var T = [
      { pts: [[0, 0], [a, 0], [0, b]], mv: [0, 0], w: [0, 0] },
      { pts: [[s, 0], [a, 0], [s, a]], mv: [0, b], w: [0, 0.4] },
      { pts: [[0, s], [b, s], [0, b]], mv: [a, 0], w: [0.3, 0.7] },
      { pts: [[s, s], [s, a], [b, s]], mv: [-b, -a], w: [0.6, 1] }
    ];
    // gaps: c² square fades out, a² and b² fade in
    var e = ease(k);
    D.roundRect(ctx, X0, Y0, side, side, 0, D.alpha(c.ink, 0.04), c.ink, 2);
    poly(ctx, [P(a, 0), P(s, a), P(b, s), P(0, b)], D.alpha(c.s2, 0.35 * (1 - e)), D.alpha(c.s2, 1 - e), 2);
    poly(ctx, [P(0, b), P(a, b), P(a, s), P(0, s)], D.alpha(c.warning, 0.35 * e), D.alpha(c.warning, e), 2);
    poly(ctx, [P(a, 0), P(s, 0), P(s, b), P(a, b)], D.alpha(c.s1, 0.35 * e), D.alpha(c.s1, e), 2);
    var triFill = c.light ? '#cbd5e1' : '#334155';
    T.forEach(function (t) {
      var f = t.w[1] > t.w[0] ? ease((k - t.w[0]) / (t.w[1] - t.w[0])) : 0, dx = t.mv[0] * f, dy = t.mv[1] * f;
      poly(ctx, t.pts.map(function (q) { return P(q[0] + dx, q[1] + dy); }), triFill, c.ink, 1.5);
    });
    var fs = narrow ? 12 : 14;
    if (e < 0.5) D.text(ctx, 'c² = ' + fmtA(a * a + b * b), X0 + side / 2, Y0 + side / 2, { color: c.ink, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 3 });
    else {
      if (a * u > 34) D.text(ctx, 'a² = ' + fmtA(a * a), X0 + a * u / 2, Y0 + (b + a / 2) * u, { color: c.ink, size: Math.min(fs, a * u / 4.5), weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2 });
      if (b * u > 34) D.text(ctx, 'b² = ' + fmtA(b * b), X0 + (a + b / 2) * u, Y0 + b * u / 2, { color: c.ink, size: Math.min(fs, b * u / 4.5), weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2 });
    }
    // side labels on the big square
    D.text(ctx, 'a', X0 + a * u / 2, Y0 - 8, { color: c.warning, size: 12, weight: 700, align: 'center' });
    D.text(ctx, 'b', X0 + (a + b / 2) * u, Y0 - 8, { color: c.s1, size: 12, weight: 700, align: 'center' });

    var lines = [
      'Big square: (a + b)² = ' + fmtA(s * s),
      'Four triangles: 4 × ½ab = ' + fmtA(2 * a * b),
      'Gap = ' + fmtA(s * s) + ' − ' + fmtA(2 * a * b) + ' = ' + fmtA(a * a + b * b),
      e < 0.5 ? 'The gap is one square of side c' : 'The gap is two squares: a² + b²',
      'Same gap → c² = a² + b²'
    ];
    if (wide) {
      var tx = X0 + side + 24, ty = Y0 + 10, lh = 26, tw = W - tx - 16;
      lines.forEach(function (ln, i) {
        var fsz = 14;
        ctx.font = '600 ' + fsz + 'px Inter, system-ui, sans-serif';
        while (fsz > 9 && ctx.measureText(ln).width > tw) { fsz -= 0.5; ctx.font = '600 ' + fsz + 'px Inter, system-ui, sans-serif'; }
        D.text(ctx, ln, tx, ty + i * lh, { color: i === 4 ? c.success : i === 3 ? (e < 0.5 ? c.s2 : c.warning) : c.ink, size: fsz, weight: i >= 3 ? 700 : 600 });
      });
    } else {
      D.text(ctx, lines[2], W / 2, H - bottom + 18, { color: c.ink, size: 11.5, weight: 600, align: 'center', fit: W });
      D.text(ctx, lines[3], W / 2, H - bottom + 38, { color: e < 0.5 ? c.s2 : c.warning, size: 11.5, weight: 700, align: 'center', fit: W });
    }
    headline(ctx, W, e < 0.5 ? 'Arrangement 1: the empty space is c²' + (narrow ? '' : ' (tap to rearrange)') : 'Arrangement 2: the empty space is a² + b²', e < 0.5 ? c.s2 : c.warning, narrow, c);
  }

  function toggle() {
    rk.from = kNow(); rk.to = rk.to > 0.5 ? 0 : 1;   // reverse smoothly from where it is
    rk.t0 = performance.now();
  }

  SimLab.createSim({
    ariaLabel: 'A right triangle with squares on its three sides, and a big square in which four copies of the triangle are slid around to show that c squared equals a squared plus b squared',
    transport: false,
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'a', label: 'Side a', min: 1, max: 12, step: 1, value: 3, unit: 'cm', presets: [3, 5, 6, 8] },
      { id: 'b', label: 'Side b', min: 1, max: 12, step: 1, value: 4, unit: 'cm', presets: [4, 8, 12] },
      { id: 'view', label: 'Show', type: 'select', value: 'rearrange', options: [
        { value: 'rearrange', label: 'The rearrangement proof' },
        { value: 'squares', label: 'Squares on the three sides' }] },
      { id: 'corner', label: 'Angle between a and b', min: 50, max: 130, step: 1, value: 90, unit: '°', presets: [90],
        help: 'Used in the “Squares” view. The proof needs a right angle (90°).' }
    ],
    buttons: [{ label: 'Rearrange the triangles', primary: true, onClick: function (sim) {
      if (sim.p.view !== 'rearrange') sim.setParam('view', 'rearrange');
      toggle();
    } }],
    readouts: [
      { id: 'a2', label: 'a²', unit: 'cm²', digits: 0 },
      { id: 'b2', label: 'b²', unit: 'cm²', digits: 0 },
      { id: 'sum', label: 'a² + b²', unit: 'cm²', digits: 0, key: true },
      { id: 'c2', label: 'c²', unit: 'cm²', digits: 1, key: true },
      { id: 'c', label: 'Side c', unit: 'cm', digits: 2, key: true }
    ],
    reset: function () {},
    onParam: function (sim, id) { if (id === 'corner' && sim.p.view !== 'squares') sim.setParam('view', 'squares'); return true; },
    animate: function () { return performance.now() - rk.t0 < DUR + 50; },
    readout: function (sim) {
      var p = sim.p, cc = csq(p);
      return { a2: p.a * p.a, b2: p.b * p.b, sum: p.a * p.a + p.b * p.b, c2: cc, c: Math.sqrt(cc) };
    },
    status: function (sim) { var p = sim.p; return 'a = ' + p.a + ' cm, b = ' + p.b + ' cm → c = ' + M.fmt(Math.sqrt(csq(p)), 2) + ' cm'; },
    pointer: {
      down: function (sim) { if (sim.p.view === 'rearrange') toggle(); return false; },
      hover: function (sim) { return sim.p.view === 'rearrange'; }
    },
    draw: function (sim) {
      D.clear(sim.ctx, sim.width, sim.height, sim.colors.bg);
      if (sim.p.view === 'squares') drawSquares(sim); else drawRearrange(sim);
    }
  });
})();
