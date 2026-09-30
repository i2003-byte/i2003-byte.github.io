/* =====================================================================
   Motion · Velocity–Time Graph and Area = Distance — sim.js
   ---------------------------------------------------------------------
   A vehicle moves in three phases:
     1. starts at u and speeds up with acceleration a for t₁ seconds
        v₁ = u + a t₁,   s₁ = u t₁ + ½ a t₁²  = ½ (u + v₁) t₁ (trapezium)
     2. cruises at v₁ for t₂ seconds          s₂ = v₁ t₂ (rectangle)
     3. brakes with retardation b to a stop   t₃ = v₁ ÷ b,  s₃ = ½ v₁ t₃
   The slope of the v–t graph is the acceleration; the area under it is
   the distance travelled. The car on the road and the shaded area grow
   together. The whole trip plays in about 12 s on screen.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SCREEN_S = 12;

  function plan(p) {
    var u = p.u, a = p.a, t1 = p.t1, v1 = u + a * t1, t2 = p.t2, t3 = v1 > 0 ? v1 / p.b : 0;
    return { u: u, a: a, t1: t1, v1: v1, t2: t2, t3: t3, b: p.b, T: t1 + t2 + t3,
      s1: 0.5 * (u + v1) * t1, s2: v1 * t2, s3: 0.5 * v1 * t3 };
  }
  function vAt(P, t) {
    if (t <= P.t1) return P.u + P.a * t;
    if (t <= P.t1 + P.t2) return P.v1;
    return Math.max(0, P.v1 - P.b * (t - P.t1 - P.t2));
  }
  function sAt(P, t) {
    var s = 0, x = Math.min(t, P.t1);
    s += P.u * x + 0.5 * P.a * x * x; if (t <= P.t1) return s;
    x = Math.min(t - P.t1, P.t2); s += P.v1 * x; if (t <= P.t1 + P.t2) return s;
    x = Math.min(t - P.t1 - P.t2, P.t3); s += P.v1 * x - 0.5 * P.b * x * x; return s;
  }
  function phaseAt(P, t) { return t < P.t1 ? 0 : t < P.t1 + P.t2 ? 1 : t < P.T ? 2 : 3; }
  function set(sim, u, a, t1, t2, b) {
    sim.setParam('u', u); sim.setParam('a', a); sim.setParam('t1', t1); sim.setParam('t2', t2); sim.setParam('b', b);
    sim.reset(); sim.play();
  }
  function fitFont(ctx, str, max, size, weight) {
    ctx.font = (weight || 700) + ' ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 8 && ctx.measureText(str).width > max) { size -= 0.5; ctx.font = (weight || 700) + ' ' + size + 'px Inter, system-ui, sans-serif'; }
    return size;
  }

  SimLab.createSim({
    ariaLabel: 'A car moving along a road above its velocity–time graph; the area under the graph is shaded in three pieces whose areas add up to the distance travelled',
    playLabel: 'Drive',
    mobileAspect: '3 / 4.2',
    params: [
      { id: 'u', label: 'Starting velocity u', min: 0, max: 25, step: 1, value: 0, unit: 'm/s' },
      { id: 'a', label: 'Acceleration a (phase 1)', min: 0, max: 4, step: 0.1, value: 1, unit: 'm/s²' },
      { id: 't1', label: 'Time speeding up t₁', min: 0, max: 30, step: 1, value: 20, unit: 's' },
      { id: 't2', label: 'Time at steady speed t₂', min: 0, max: 60, step: 1, value: 30, unit: 's' },
      { id: 'b', label: 'Braking (retardation)', min: 0.5, max: 6, step: 0.1, value: 1, unit: 'm/s²', help: 'Phase 3 slows down at this rate until the vehicle stops.' },
      { id: 'pieces', label: 'Show the area pieces and their working', type: 'toggle', value: true }
    ],
    buttonsTitle: 'Ready-made trips',
    buttons: [
      { label: 'Metro between stations', onClick: function (sim) { set(sim, 0, 1, 20, 30, 1); } },
      { label: 'Car at a green signal', onClick: function (sim) { set(sim, 0, 2, 6, 10, 3); } },
      { label: 'Uniform velocity', onClick: function (sim) { set(sim, 15, 0, 0, 20, 5); } },
      { label: 'Emergency stop at 72 km/h', onClick: function (sim) { set(sim, 20, 0, 0, 1, 6); } }
    ],
    readouts: [
      { id: 't', label: 'Time', unit: 's', digits: 1 },
      { id: 'v', label: 'Velocity', unit: 'm/s', digits: 1, key: true },
      { id: 'kmh', label: 'Velocity', unit: 'km/h', digits: 0 },
      { id: 'acc', label: 'Acceleration (slope)', unit: 'm/s²', digits: 1 },
      { id: 's', label: 'Distance = area so far', unit: 'm', digits: 1, key: true },
      { id: 'tot', label: 'Total distance', unit: 'm', digits: 1 },
      { id: 'avg', label: 'Average speed of trip', unit: 'm/s', digits: 2 }
    ],
    onParam: function (sim, id) { return id === 'pieces'; },

    reset: function (sim) { sim.state = { t: 0 }; },
    update: function (sim, dt) {
      var P = plan(sim.p);
      sim.state.t = Math.min(P.T, sim.state.t + dt * Math.max(0.5, P.T / SCREEN_S));
    },
    finished: function (sim) { return sim.state.t >= plan(sim.p).T - 1e-9; },
    status: function (sim) {
      var P = plan(sim.p), ph = phaseAt(P, sim.state.t);
      if (P.T <= 0) return 'Nothing moves: give it a starting velocity or an acceleration';
      return ['Phase 1: speeding up', 'Phase 2: steady velocity', 'Phase 3: braking', 'Stopped'][ph];
    },
    readout: function (sim) {
      var P = plan(sim.p), t = sim.state.t, v = vAt(P, t), ph = phaseAt(P, t);
      return { t: t, v: v, kmh: v * 3.6, acc: [P.a, 0, -P.b, 0][ph], s: sAt(P, t), tot: P.s1 + P.s2 + P.s3, avg: P.T > 0 ? (P.s1 + P.s2 + P.s3) / P.T : null };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, narrow = W < 560;
      var P = plan(sim.p), t = sim.state.t, sTot = P.s1 + P.s2 + P.s3, sNow = sAt(P, t), vNow = vAt(P, t);
      var COL = [c.s1, c.s3, c.s2];
      D.clear(ctx, W, H, c.bg);

      /* ---- road ---- */
      var roadH = narrow ? 70 : 84, rx0 = narrow ? 30 : 56, rx1 = W - (narrow ? 30 : 48), ry = 44;
      D.roundRect(ctx, rx0 - 22, ry - 15, rx1 - rx0 + 44, 30, 6, D.alpha(c.muted, 0.2));
      D.line(ctx, rx0 - 18, ry, rx1 + 18, ry, D.alpha(c.ink, 0.45), 2, [10, 10]);
      var sMax = Math.max(10, sTot), kmStep = D.niceStep(sMax, narrow ? 4 : 8);
      for (var m = 0; m <= sMax + 1e-9; m += kmStep) {
        var kx = rx0 + m / sMax * (rx1 - rx0);
        D.line(ctx, kx, ry + 15, kx, ry + 20, c.axis, 1);
        D.text(ctx, M.fmt(m, 0), kx, ry + 28, { color: c.muted, size: 10, align: 'center', font: c.mono });
      }
      D.text(ctx, 'm', rx1 + 22, ry + 28, { color: c.muted, size: 10, align: 'right' });
      // phase boundary marks on the road
      [P.s1, P.s1 + P.s2].forEach(function (sb, i) {
        if (sb > 0.01 && sb < sTot - 0.01) { var bx = rx0 + sb / sMax * (rx1 - rx0); D.line(ctx, bx, ry - 15, bx, ry + 15, D.alpha(COL[i + 1], 0.8), 2); }
      });
      var cx = rx0 + sNow / sMax * (rx1 - rx0), ph = phaseAt(P, t), r = narrow ? 9 : 11;
      D.roundRect(ctx, cx - r * 2, ry - r * 1.2, r * 4, r * 1.3, r * 0.4, ph === 3 ? c.muted : COL[Math.min(ph, 2)]);
      D.roundRect(ctx, cx - r * 1.1, ry - r * 1.9, r * 2.2, r * 0.9, r * 0.35, D.alpha('#ffffff', 0.7));
      D.circle(ctx, cx - r * 1.2, ry + r * 0.2, r * 0.45, c.ink); D.circle(ctx, cx + r * 1.2, ry + r * 0.2, r * 0.45, c.ink);
      if (ph === 2) D.circle(ctx, cx - r * 2, ry - r * 0.6, 3, '#ef4444');   // brake light

      /* ---- graph ---- */
      var gl = narrow ? 44 : 64, gr = W - (narrow ? 12 : 28), gt = roadH + 26, gb = H - (sim.p.pieces ? (narrow ? 112 : 78) : 34);
      var tMax = Math.max(1, P.T), vMax = Math.max(1, P.v1, P.u) * 1.15;
      function X(tt) { return gl + tt / tMax * (gr - gl); }
      function Y(v) { return gb - v / vMax * (gb - gt); }
      var ts = D.niceStep(tMax, narrow ? 5 : 10), vs = D.niceStep(vMax, Math.max(3, Math.floor((gb - gt) / 40)));
      ctx.save(); ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.beginPath();
      for (var x = 0; x <= tMax + 1e-9; x += ts) { ctx.moveTo(Math.round(X(x)) + 0.5, gt); ctx.lineTo(Math.round(X(x)) + 0.5, gb); }
      for (var y = 0; y <= vMax + 1e-9; y += vs) { ctx.moveTo(gl, Math.round(Y(y)) + 0.5); ctx.lineTo(gr, Math.round(Y(y)) + 0.5); }
      ctx.stroke(); ctx.restore();

      // shaded area up to now, one colour per phase
      var bounds = [[0, P.t1], [P.t1, P.t1 + P.t2], [P.t1 + P.t2, P.T]];
      bounds.forEach(function (bd, i) {
        var a0 = bd[0], a1 = Math.min(bd[1], t); if (a1 <= a0) return;
        ctx.beginPath(); ctx.moveTo(X(a0), Y(0));
        for (var k = 0; k <= 24; k++) { var tt = a0 + (a1 - a0) * k / 24; ctx.lineTo(X(tt), Y(vAt(P, tt))); }
        ctx.lineTo(X(a1), Y(0)); ctx.closePath(); ctx.fillStyle = D.alpha(COL[i], 0.28); ctx.fill();
      });
      // full graph faint, travelled part bold
      D.line(ctx, gl, gb, gr, gb, c.axis, 1.5); D.line(ctx, gl, gt, gl, gb, c.axis, 1.5);
      var knots = [[0, P.u], [P.t1, P.v1], [P.t1 + P.t2, P.v1], [P.T, 0]];
      ctx.save(); ctx.strokeStyle = D.alpha(c.ink, 0.3); ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath();
      knots.forEach(function (q, i) { if (i) ctx.lineTo(X(q[0]), Y(q[1])); else ctx.moveTo(X(q[0]), Y(q[1])); }); ctx.stroke(); ctx.restore();
      bounds.forEach(function (bd, i) {
        var a1 = Math.min(bd[1], t); if (a1 <= bd[0]) return;
        D.line(ctx, X(bd[0]), Y(vAt(P, bd[0])), X(a1), Y(vAt(P, a1)), COL[i], 3);
      });
      for (x = 0; x <= tMax + 1e-9; x += ts) D.text(ctx, M.fmt(x, ts < 1 ? 1 : 0), X(x), gb + 12, { color: c.muted, size: 11, align: 'center', font: c.mono });
      for (y = 0; y <= vMax + 1e-9; y += vs) D.text(ctx, M.fmt(y, vs < 1 ? 1 : 0), gl - 6, Y(y), { color: c.muted, size: 11, align: 'right', font: c.mono });
      D.text(ctx, 'time (s)', gr, gb + 25, { color: c.muted, size: 11, align: 'right' });
      D.text(ctx, 'velocity (m/s)', gl + 6, gt - 9, { color: c.muted, size: 11, weight: 600 });
      D.circle(ctx, X(t), Y(vNow), 5.5, c.accent, c.bg, 2);

      // slope labels and area values on each piece
      var names = ['½(u + v)t₁', 'v × t₂', '½ v t₃'], areas = [P.s1, P.s2, P.s3], slopes = [P.a, 0, -P.b];
      bounds.forEach(function (bd, i) {
        if (bd[1] - bd[0] <= 1e-9 || t < bd[0]) return;
        var w = X(bd[1]) - X(bd[0]), mid = (bd[0] + bd[1]) / 2;
        if (w > 44) {
          var ly = (Y(0) + Y(vAt(P, mid))) / 2 + 5;
          D.text(ctx, M.fmt(areas[i], 0) + ' m', X(mid), ly, { color: COL[i], size: narrow ? 11 : 13, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.75) });
          var sl = 'slope ' + M.fmt(slopes[i], 1) + ' m/s²';
          if (w > 84) D.text(ctx, sl, X(mid), Y(vAt(P, mid)) - 12, { color: COL[i], size: 10.5, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.8), fit: W });
        }
      });

      /* ---- working ---- */
      if (sim.p.pieces) {
        var wy = H - (narrow ? 64 : 30), parts = [];
        if (P.t1 > 0) parts.push({ s: '½ × (' + M.fmt(P.u, 0) + ' + ' + M.fmt(P.v1, 1) + ') × ' + P.t1 + ' = ' + M.fmt(P.s1, 1), col: COL[0] });
        if (P.t2 > 0) parts.push({ s: M.fmt(P.v1, 1) + ' × ' + P.t2 + ' = ' + M.fmt(P.s2, 1), col: COL[1] });
        if (P.t3 > 0) parts.push({ s: '½ × ' + M.fmt(P.v1, 1) + ' × ' + M.fmt(P.t3, 1) + ' = ' + M.fmt(P.s3, 1), col: COL[2] });
        var eq = 'Total area = ' + M.fmt(sTot, 1) + ' m';
        if (narrow) {
          var line1 = parts.map(function (q) { return q.s; }).join('  ·  ');
          var fsz = fitFont(ctx, line1, W - 24, 11.5, 600), xx = 12;
          parts.forEach(function (q, i) {
            var str = q.s + (i < parts.length - 1 ? '  ·  ' : '');
            D.text(ctx, str, xx, wy, { color: q.col, size: fsz, weight: 600 });
            ctx.font = '600 ' + fsz + 'px Inter, system-ui, sans-serif'; xx += ctx.measureText(str).width;
          });
          D.text(ctx, eq + ' = distance travelled', 12, wy + 24, { color: c.ink, size: 13, weight: 700 });
        } else {
          var all = parts.map(function (q) { return q.s; }).join('  +  ') + '   →   ' + eq;
          var fs2 = fitFont(ctx, all, W - 40, 13, 600), x2 = 20;
          parts.forEach(function (q, i) {
            var str2 = q.s + (i < parts.length - 1 ? '  +  ' : '   →   ');
            D.text(ctx, str2, x2, wy, { color: q.col, size: fs2, weight: 600 });
            ctx.font = '600 ' + fs2 + 'px Inter, system-ui, sans-serif'; x2 += ctx.measureText(str2).width;
          });
          D.text(ctx, eq, x2, wy, { color: c.ink, size: fs2, weight: 700 });
        }
      }
      if (!sim.running && t === 0) D.text(ctx, 'Press Drive', (gl + gr) / 2, gt + 14, { color: c.faint, size: 12, align: 'center' });
    }
  });
})();
