/* =====================================================================
   Lines and angles · Parallel Lines and a Transversal — sim.js
   ---------------------------------------------------------------------
   Line l (top, horizontal) and line m (below, tilted by `tilt`) are cut
   by a transversal t. It meets l at P and m at Q. The transversal makes
   angle `cut` with l, so at P:  ∠1 = ∠3 = cut,  ∠2 = ∠4 = 180° − cut.
   At Q it makes (cut − tilt) with m:  ∠5 = ∠7 = cut − tilt,
   ∠6 = ∠8 = 180° − (cut − tilt).
   Numbering (both crossings): 1/5 top-right, 2/6 top-left,
   3/7 bottom-left, 4/8 bottom-right. Interior angles: 3, 4, 5, 6.
   Only when tilt = 0 (l ∥ m) do corresponding / alternate angles match
   and co-interior angles add to 180°. Vertically opposite angles and
   linear pairs work for any two crossing lines.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var TYPES = {
    corr:   { name: 'Corresponding angles', pairs: [[1, 5], [2, 6], [3, 7], [4, 8]], equal: true, needPar: true },
    altIn:  { name: 'Alternate interior angles', pairs: [[3, 5], [4, 6]], equal: true, needPar: true },
    altEx:  { name: 'Alternate exterior angles', pairs: [[1, 7], [2, 8]], equal: true, needPar: true },
    coIn:   { name: 'Co-interior angles (same side)', pairs: [[4, 5], [3, 6]], equal: false, needPar: true },
    vert:   { name: 'Vertically opposite angles', pairs: [[1, 3], [2, 4], [5, 7], [6, 8]], equal: true, needPar: false },
    linear: { name: 'Linear pair', pairs: [[1, 2], [3, 4], [5, 6], [7, 8]], equal: false, needPar: false }
  };
  var sel = 1;

  function value(p, n) {
    var a = p.cut, b = p.cut - p.tilt;
    return [0, a, 180 - a, a, 180 - a, b, 180 - b, b, 180 - b][n];
  }
  function pairOf(type, n) {
    var ps = TYPES[type].pairs;
    for (var i = 0; i < ps.length; i++) if (ps[i].indexOf(n) >= 0) return ps[i];
    return null;
  }
  function partner(p) {
    var pr = pairOf(p.pair, sel);
    if (!pr) { pr = TYPES[p.pair].pairs[0]; sel = pr[0]; }
    return pr[0] === sel ? pr[1] : pr[0];
  }
  // sector of angle n in maths degrees (anticlockwise from the right)
  function sector(p, n) {
    var c = p.cut, t = p.tilt;
    return [null, [0, c], [c, 180], [180, 180 + c], [180 + c, 360],
      [t, c], [c, t + 180], [t + 180, c + 180], [c + 180, t + 360]][n];
  }
  function geom(sim) {
    var W = sim.width, H = sim.height, p = sim.p, narrow = W < 560;
    var top = narrow ? 50 : 56, cr = M.rad(p.cut), tr = M.rad(p.tilt);
    var gap = Math.max(60, Math.min((H - top) * 0.42, (W - 150) / Math.max(0.01, Math.abs(1 / Math.tan(cr)))));
    var Py = top + (H - top - gap) * 0.5;
    var P = { x: W * 0.5, y: Py };
    var d = { x: Math.cos(cr), y: -Math.sin(cr) };          // transversal, pointing up
    var A = { x: W * 0.5, y: Py + gap };                      // a point on line m
    var e = { x: Math.cos(tr), y: -Math.sin(tr) };           // direction of m
    // P + s·d = A + u·e  → solve for s (2×2)
    var det = d.x * (-e.y) - d.y * (-e.x);
    var s = ((A.x - P.x) * (-e.y) - (A.y - P.y) * (-e.x)) / det;
    var Q = { x: P.x + s * d.x, y: P.y + s * d.y }, sh = (P.x - Q.x) / 2;
    P.x += sh; Q.x += sh;                                     // keep P and Q centred
    return { W: W, H: H, P: P, Q: Q, d: d, e: e, narrow: narrow, r: narrow ? 30 : 38 };
  }
  function hit(sim, x, y) {
    var g = geom(sim), pts = [g.P, g.Q];
    for (var k = 0; k < 2; k++) {
      var dx = x - pts[k].x, dy = y - pts[k].y, dist = Math.hypot(dx, dy);
      if (dist > g.r * 2.1) continue;
      var a = (M.deg(Math.atan2(-dy, dx)) + 360) % 360;
      for (var n = 1 + k * 4; n <= 4 + k * 4; n++) {
        var s = sector(sim.p, n), a0 = s[0], aa = a;
        while (aa < a0) aa += 360;
        if (aa <= s[1]) return n;
      }
    }
    return 0;
  }

  SimLab.createSim({
    ariaLabel: 'Two lines l and m cut by a transversal t, with the eight angles numbered 1 to 8 and a chosen pair of angles highlighted with their sizes',
    transport: false,
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'cut', label: 'Angle of the transversal', min: 25, max: 155, step: 1, value: 60, unit: '°',
        presets: [45, 60, 90, 120], help: 'You can also drag the picture to turn the transversal, and tap any angle to pick it.' },
      { id: 'tilt', label: 'Tilt of line m', min: -20, max: 20, step: 1, value: 0, unit: '°',
        presets: [0], help: 'At 0° the two lines are parallel (l ∥ m).' },
      { id: 'pair', label: 'Angle pair', type: 'select', value: 'corr',
        options: Object.keys(TYPES).map(function (k) { return { value: k, label: TYPES[k].name }; }) },
      { id: 'all', label: 'Show all eight sizes', type: 'toggle', value: false }
    ],
    buttons: [
      { label: 'Next pair of this kind', onClick: function (sim) {
        var ps = TYPES[sim.p.pair].pairs, i = 0;
        for (var k = 0; k < ps.length; k++) if (ps[k].indexOf(sel) >= 0) i = k;
        sel = ps[(i + 1) % ps.length][0];
      } },
      { label: 'Make the lines parallel', onClick: function (sim) { sim.setParam('tilt', 0); } }
    ],
    readouts: [
      { id: 'a', label: 'First angle', key: true },
      { id: 'b', label: 'Second angle', key: true },
      { id: 'rel', label: 'They are', key: true },
      { id: 'par', label: 'Lines l and m' }
    ],
    reset: function () {},
    onParam: function (sim, id) { if (id === 'pair') partner(sim.p); return true; },
    readout: function (sim) {
      var p = sim.p, q = partner(p), T = TYPES[p.pair], va = value(p, sel), vb = value(p, q);
      var ok = T.equal ? Math.abs(va - vb) < 0.01 : Math.abs(va + vb - 180) < 0.01;
      return {
        a: '∠' + sel + ' = ' + M.fmt(va, 0) + '°', b: '∠' + q + ' = ' + M.fmt(vb, 0) + '°',
        rel: T.equal ? (ok ? 'Equal' : 'Not equal') : (ok ? 'Sum 180°' : 'Sum ' + M.fmt(va + vb, 0) + '°'),
        par: p.tilt === 0 ? 'Parallel' : 'Not parallel (meet somewhere)'
      };
    },
    status: function (sim) { var q = partner(sim.p); return TYPES[sim.p.pair].name + ': ∠' + sel + ' and ∠' + q; },
    pointer: {
      down: function (sim, x, y) {
        var n = hit(sim, x, y);
        if (n) { sel = n; if (!pairOf(sim.p.pair, n)) { var ks = Object.keys(TYPES); for (var i = 0; i < ks.length; i++) if (pairOf(ks[i], n)) { sim.setParam('pair', ks[i]); break; } } return false; }
        this.move(sim, x, y); return true;
      },
      move: function (sim, x, y) {
        var g = geom(sim), dx = x - g.P.x, dy = g.P.y - y;
        if (dy < 0) { dx = -dx; dy = -dy; }
        if (Math.hypot(dx, dy) < 12) return;
        sim.setParam('cut', M.clamp(Math.round(M.deg(Math.atan2(dy, dx))), 25, 155));
      },
      hover: function () { return true; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, g = geom(sim), W = g.W, H = g.H, P = g.P, Q = g.Q;
      var q = partner(p), T = TYPES[p.pair], va = value(p, sel), vb = value(p, q);
      var ok = T.equal ? Math.abs(va - vb) < 0.01 : Math.abs(va + vb - 180) < 0.01;
      var col1 = c.warning, col2 = c.s1, L = W + H;
      D.clear(ctx, W, H, c.bg);

      // the three lines (kept below the two caption lines)
      ctx.save(); ctx.beginPath(); ctx.rect(0, g.narrow ? 46 : 52, W, H); ctx.clip();
      D.line(ctx, P.x - L * 1, P.y, P.x + L, P.y, c.ink, 2.5);
      D.line(ctx, Q.x - g.e.x * L, Q.y - g.e.y * L, Q.x + g.e.x * L, Q.y + g.e.y * L, c.ink, 2.5);
      D.line(ctx, P.x - g.d.x * L, P.y - g.d.y * L, P.x + g.d.x * L, P.y + g.d.y * L, c.s3, 2.5);
      var fs = g.narrow ? 13 : 15;
      D.text(ctx, 'l', 12, P.y - 12, { color: c.ink, size: fs, weight: 700 });
      D.text(ctx, 'm', 12, Q.y - g.e.y / g.e.x * (Q.x - 12) - 12, { color: c.ink, size: fs, weight: 700 });
      var tp = { x: P.x + g.d.x * (P.y - 6 - (g.narrow ? 50 : 56)) / Math.abs(g.d.y), y: g.narrow ? 56 : 62 };
      D.text(ctx, 't', tp.x + (g.d.x >= 0 ? 10 : -16), tp.y + 6, { color: c.s3, size: fs, weight: 700 });
      ctx.restore();
      // parallel marks
      if (p.tilt === 0) {
        [P.y, Q.y].forEach(function (yy) {
          var x0 = W * 0.86;
          for (var k = 0; k < 2; k++) { ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + k * 7 - 5, yy - 6); ctx.lineTo(x0 + k * 7 + 1, yy); ctx.lineTo(x0 + k * 7 - 5, yy + 6); ctx.stroke(); ctx.restore(); }
        });
      }

      // angle sectors
      for (var n = 1; n <= 8; n++) {
        var ctr = n <= 4 ? P : Q, s = sector(p, n), on = n === sel || n === q;
        var col = n === sel ? col1 : n === q ? col2 : null, r = g.r * (on ? 1 : 0.62);
        ctx.beginPath(); ctx.moveTo(ctr.x, ctr.y);
        ctx.arc(ctr.x, ctr.y, r, -M.rad(s[1]), -M.rad(s[0]));
        ctx.closePath();
        ctx.fillStyle = col ? D.alpha(col, 0.35) : D.alpha(c.ink, 0.06); ctx.fill();
        if (col) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ctr.x, ctr.y, r, -M.rad(s[1]), -M.rad(s[0])); ctx.stroke(); }
        var mid = M.rad((s[0] + s[1]) / 2), lr = on ? g.r + (g.narrow ? 16 : 20) : g.r * 0.62 + 10;
        var lx = ctr.x + Math.cos(mid) * lr, ly = ctr.y - Math.sin(mid) * lr;
        var txt = on || p.all ? n + ': ' + M.fmt(value(p, n), 0) + '°' : String(n);
        D.text(ctx, txt, lx, ly, { color: col || c.muted, size: on ? (g.narrow ? 12 : 13) : 11, weight: on ? 700 : 600, align: 'center',
          bg: on || p.all ? D.alpha(c.bg, 0.8) : null, pad: 2, fit: W });
      }
      D.circle(ctx, P.x, P.y, 3.5, c.ink); D.circle(ctx, Q.x, Q.y, 3.5, c.ink);
      D.text(ctx, 'P', P.x + (g.d.x >= 0 ? -14 : 8), P.y - 10, { color: c.muted, size: 11, weight: 700 });
      D.text(ctx, 'Q', Q.x + (g.d.x >= 0 ? 8 : -16), Q.y + 12, { color: c.muted, size: 11, weight: 700 });

      // headline
      var hl;
      if (T.equal) hl = '∠' + sel + ' = ' + M.fmt(va, 0) + '°   ∠' + q + ' = ' + M.fmt(vb, 0) + '°   ' + (ok ? '→ equal' : '→ NOT equal');
      else hl = '∠' + sel + ' + ∠' + q + ' = ' + M.fmt(va, 0) + '° + ' + M.fmt(vb, 0) + '° = ' + M.fmt(va + vb, 0) + '°';
      var hs = g.narrow ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, 14, { color: c.bg, bg: ok ? c.success : c.danger, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
      var sub = T.name + (T.needPar ? (p.tilt === 0 ? ' · l ∥ m' : ' · l is not parallel to m') : ' · true for any two crossing lines');
      D.text(ctx, sub, W / 2, g.narrow ? 36 : 40, { color: T.needPar && p.tilt !== 0 ? c.danger : c.muted, size: g.narrow ? 10.5 : 12, weight: 600, align: 'center', fit: W });
    }
  });
})();
