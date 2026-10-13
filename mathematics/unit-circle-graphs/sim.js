/* =====================================================================
   Trigonometry · Unit Circle and the Graphs of sin, cos and tan — sim.js
   ---------------------------------------------------------------------
   A point P goes round a circle of radius 1. Its coordinates are
   (cos θ, sin θ); the right triangle under the radius shows
   sin θ = opposite/1 and cos θ = adjacent/1. The radius extended to the
   tangent line x = 1 meets it at height tan θ. The graph on the right
   uses the same unit length, so P's height slides straight across to
   the sine curve. Angles in degrees, measured anticlockwise from +x.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var st = { a: 30, traced: 30 };
  var STD = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];

  function trig(a) {
    var r = M.rad(a), s = Math.sin(r), c = Math.cos(r);
    if (Math.abs(s) < 1e-12) s = 0; if (Math.abs(c) < 1e-12) c = 0;
    return { s: s, c: c, t: c === 0 ? null : s / c };
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, top = narrow ? 36 : 42;
    var mode = sim.p.show, tanOn = mode === 'tan';
    var avail = H - top - (narrow ? 34 : 40);
    var yUnits = tanOn ? 3 : 1.25;                  // graph y range ±yUnits
    var R = Math.min(avail / (2 * yUnits), W * (narrow ? 0.2 : 0.17), 150);
    var cx = (narrow ? 10 : 24) + R * 1.18, cy = top + avail / 2 + 6;
    var gx0 = cx + R * (tanOn ? 1.55 : 1.35) + (narrow ? 14 : 30), gx1 = W - (narrow ? 10 : 22);
    return { W: W, H: H, narrow: narrow, top: top, R: R, cx: cx, cy: cy, gx0: gx0, gx1: gx1, yUnits: yUnits, tanOn: tanOn };
  }
  function quad(a) {
    a = ((a % 360) + 360) % 360;
    if (a === 0 || a === 90 || a === 180 || a === 270) return 'on an axis';
    return a < 90 ? 'I (all +)' : a < 180 ? 'II (sin +)' : a < 270 ? 'III (tan +)' : 'IV (cos +)';
  }

  SimLab.createSim({
    ariaLabel: 'A point going round a unit circle with its right triangle showing sine and cosine, and next to it the sine, cosine or tangent graph being traced as the angle grows from 0 to 360 degrees',
    mobileAspect: '1 / 1',
    playLabel: 'Go round',
    params: [
      { id: 'angle', label: 'Angle θ', min: 0, max: 360, step: 1, value: 30, unit: '°', presets: [30, 45, 60, 90, 180], help: 'Or drag the point round the circle.' },
      { id: 'speed', label: 'Turning speed', min: 5, max: 90, step: 5, value: 30, unit: '°/s' },
      { id: 'show', label: 'Graph', type: 'select', value: 'sin', options: [
        { value: 'sin', label: 'y = sin θ' }, { value: 'cos', label: 'y = cos θ' },
        { value: 'both', label: 'sin θ and cos θ together' }, { value: 'tan', label: 'y = tan θ' }] },
      { id: 'std', label: 'Mark 0°, 30°, 45°, 60°, 90° …', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'a', label: 'Angle θ', unit: '°', digits: 0, key: true },
      { id: 's', label: 'sin θ (height of P)', short: 'sin θ', digits: 3, key: true },
      { id: 'c', label: 'cos θ (across to P)', short: 'cos θ', digits: 3, key: true },
      { id: 't', label: 'tan θ', digits: 3 },
      { id: 'q', label: 'Quadrant' }
    ],
    reset: function (sim) { st.a = sim.p.angle; st.traced = sim.p.angle; },
    onParam: function (sim, id, v) {
      if (id === 'angle') { st.a = v; st.traced = Math.max(st.traced, v); }
      if (id === 'show' || id === 'std') st.traced = Math.max(st.traced, st.a);
      sim.redraw(); return true;
    },
    update: function (sim, dt) {
      st.a += sim.p.speed * dt;
      if (st.a >= 360) { st.a -= 360; st.traced = st.a; }
      st.traced = Math.max(st.traced, st.a);
    },
    readout: function () {
      var a = Math.round(st.a * 10) / 10, t = trig(a);
      return { a: st.a, s: t.s, c: t.c, t: t.t == null ? 'undefined' : t.t, q: quad(Math.round(st.a)) };
    },
    status: function () { var t = trig(st.a); return 'θ = ' + Math.round(st.a) + '°: P = (' + M.fmt(t.c, 2) + ', ' + M.fmt(t.s, 2) + ')'; },
    pointer: {
      down: function (sim, x, y) { var L = layout(sim); return Math.hypot(x - L.cx, y - L.cy) < L.R * 1.5; },
      move: function (sim, x, y) {
        var L = layout(sim), a = M.deg(Math.atan2(L.cy - y, x - L.cx));
        if (a < 0) a += 360;
        a = Math.round(a);
        if (sim.p.std) STD.forEach(function (s) { if (Math.abs(a - s) <= 2) a = s; });
        if (st.a > 300 && a < 60) a = st.a > 355 && a < 5 ? 360 : a;   // let a drag reach 360°
        sim.setParam('angle', a);
      },
      hover: function (sim, x, y) { var L = layout(sim); return Math.hypot(x - L.cx, y - L.cy) < L.R * 1.5; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, R = L.R, cx = L.cx, cy = L.cy;
      var fs = L.narrow ? 10.5 : 12, a = st.a, t = trig(a), th = M.rad(a);
      var colS = c.s2, colC = c.s1, colT = c.s4;
      D.clear(ctx, W, H, c.bg);
      // circle + axes
      D.line(ctx, cx - R * 1.15, cy, cx + R * (L.tanOn ? 1.35 : 1.15), cy, c.axis, 1.5);
      D.line(ctx, cx, cy - R * 1.15, cx, cy + R * 1.15, c.axis, 1.5);
      D.circle(ctx, cx, cy, R, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.6), 2);
      D.text(ctx, '1', cx + R + 3, cy + 9, { color: c.muted, size: fs });
      D.text(ctx, '−1', cx - R - 3, cy + 9, { color: c.muted, size: fs, align: 'right' });
      if (!L.narrow || R > 70) {
        var qs = [['I', 45], ['II', 135], ['III', 225], ['IV', 315]];
        qs.forEach(function (q) { var m = M.rad(q[1]); D.text(ctx, q[0], cx + Math.cos(m) * R * 0.78, cy - Math.sin(m) * R * 0.78, { color: c.faint, size: fs, weight: 700, align: 'center' }); });
      }
      if (p.std) STD.forEach(function (s) {
        var m = M.rad(s); D.circle(ctx, cx + Math.cos(m) * R, cy - Math.sin(m) * R, 2.5, c.muted);
      });
      var P = { x: cx + t.c * R, y: cy - t.s * R };
      // angle arc
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, Math.min(R * 0.28, 26), 0, -th, true); ctx.closePath();
      ctx.fillStyle = D.alpha(c.warning, 0.35); ctx.fill();
      // tan: tangent line at x = 1 and the extended radius
      if (L.tanOn) {
        D.line(ctx, cx + R, cy - R * L.yUnits, cx + R, cy + R * L.yUnits, D.alpha(colT, 0.5), 1.5, [4, 4]);
        if (t.t != null && Math.abs(t.t) <= L.yUnits) {
          var Ty = cy - t.t * R;
          D.line(ctx, cx, cy, cx + R, Ty, D.alpha(colT, 0.8), 1.5, [6, 4]);
          D.line(ctx, cx + R, cy, cx + R, Ty, colT, 4);
          D.circle(ctx, cx + R, Ty, 4, colT);
        }
      }
      // triangle legs: cos along x, sin up/down
      D.line(ctx, cx, cy, P.x, cy, colC, 4);
      D.line(ctx, P.x, cy, P.x, P.y, colS, 4);
      D.line(ctx, cx, cy, P.x, P.y, c.ink, 2.5);
      D.circle(ctx, P.x, P.y, 7, c.accent, c.bg, 2);
      D.text(ctx, 'P', P.x + (t.c >= 0 ? 10 : -10), P.y - 10, { color: c.ink, size: fs + 1, weight: 700, align: 'center' });
      D.text(ctx, 'cos', (cx + P.x) / 2, cy + (t.s >= 0 ? 11 : -11), { color: colC, size: fs, weight: 700, align: 'center' });
      if (Math.abs(t.s) > 0.12) D.text(ctx, 'sin', P.x + (t.c >= 0 ? 5 : -5), (cy + P.y) / 2, { color: colS, size: fs, weight: 700, align: t.c >= 0 ? 'left' : 'right' });

      // graph
      var gx0 = L.gx0, gx1 = L.gx1, gw = gx1 - gx0, Y = function (v) { return cy - v * R; }, X = function (deg) { return gx0 + deg / 360 * gw; };
      D.line(ctx, gx0, cy, gx1 + 4, cy, c.axis, 1.5);
      D.line(ctx, gx0, cy - R * L.yUnits, gx0, cy + R * L.yUnits, c.axis, 1.5);
      [1, -1].concat(L.tanOn ? [2, -2, 3, -3] : []).forEach(function (v) {
        if (Math.abs(v) > L.yUnits) return;
        D.line(ctx, gx0, Y(v), gx1, Y(v), D.alpha(c.grid, 0.9), 1, [2, 4]);
        D.text(ctx, String(v), gx0 - 4, Y(v), { color: c.muted, size: fs - 1, align: 'right' });
      });
      [90, 180, 270, 360].forEach(function (d) {
        D.line(ctx, X(d), cy - R * L.yUnits, X(d), cy + R * L.yUnits, D.alpha(c.grid, 0.9), 1, [2, 4]);
        D.text(ctx, d + '°', X(d), cy + 10, { color: c.muted, size: fs - 1, align: d === 360 ? 'right' : 'center' });
      });
      if (!L.tanOn) { ctx.fillStyle = D.alpha(c.success, 0.07); ctx.fillRect(X(0), cy - R * L.yUnits, X(90) - X(0), 2 * R * L.yUnits); }
      function plot(fn, col, upTo, lw) {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.beginPath();
        var pen = false;
        for (var d = 0; d <= upTo + 0.01; d += 0.5) {
          var v = fn(d);
          if (v == null || Math.abs(v) > L.yUnits * 1.05) { pen = false; continue; }
          if (!pen) { ctx.moveTo(X(d), Y(v)); pen = true; } else ctx.lineTo(X(d), Y(v));
        }
        ctx.stroke(); ctx.restore();
      }
      var fns = [];
      if (p.show === 'sin' || p.show === 'both') fns.push([function (d) { return trig(d).s; }, colS, 'sin θ', t.s]);
      if (p.show === 'cos' || p.show === 'both') fns.push([function (d) { return trig(d).c; }, colC, 'cos θ', t.c]);
      if (L.tanOn) fns.push([function (d) { return trig(d).t; }, colT, 'tan θ', t.t]);
      fns.forEach(function (f) {
        plot(f[0], D.alpha(f[1], 0.2), 360, 2);
        plot(f[0], f[1], Math.min(360, Math.max(a, st.traced)), 3);
        if (f[3] != null && Math.abs(f[3]) <= L.yUnits) D.circle(ctx, X(a), Y(f[3]), 5.5, f[1], c.bg, 2);
      });
      if (L.tanOn) [90, 270].forEach(function (d) { D.line(ctx, X(d), cy - R * L.yUnits, X(d), cy + R * L.yUnits, D.alpha(colT, 0.6), 1.5, [6, 5]); });
      // link from the circle to the graph
      if (p.show !== 'cos') {
        var lv = L.tanOn ? t.t : t.s;
        if (lv != null && Math.abs(lv) <= L.yUnits) D.line(ctx, L.tanOn ? cx + R : P.x, Y(lv), X(a), Y(lv), D.alpha(L.tanOn ? colT : colS, 0.6), 1.2, [4, 4]);
      }
      if (p.std) STD.forEach(function (s) { D.line(ctx, X(s), cy - 3, X(s), cy + 3, c.muted, 1.5); });
      // legend in the graph corner
      fns.forEach(function (f, i) { D.text(ctx, f[2], gx1, cy - R * L.yUnits + 8 + i * (fs + 5), { color: f[1], size: fs + 1, weight: 700, align: 'right' }); });

      // headline
      var hl = 'θ = ' + Math.round(a) + '°   sin θ = ' + M.fmt(t.s, 3) + '   cos θ = ' + M.fmt(t.c, 3) + '   tan θ = ' + (t.t == null ? 'not defined' : M.fmt(t.t, 3));
      var hs = L.narrow ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, 15, { color: c.bg, bg: c.success, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
      var foot = L.tanOn ? 'tan θ = sin θ ÷ cos θ: it is the height where the radius meets the line x = 1'
        : 'sin²θ + cos²θ = ' + M.fmt(t.s * t.s + t.c * t.c, 3) + ' (Pythagoras on the triangle, hypotenuse 1)';
      D.text(ctx, foot, W / 2, H - (L.narrow ? 12 : 16), { color: c.muted, size: L.narrow ? 10 : 12, align: 'center', fit: W });
      if (!L.tanOn && L.gx1 - L.gx0 > 150) D.text(ctx, 'Class 10: 0°–90°', X(45), cy + R * L.yUnits - 6, { color: c.success, size: fs - 1, weight: 600, align: 'center' });
    }
  });
})();
