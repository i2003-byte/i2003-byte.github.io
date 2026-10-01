/* =====================================================================
   Force and laws of motion · F = ma Cart Lab — sim.js
   ---------------------------------------------------------------------
   A cart of mass m (trolley + bricks) on a straight 4 m track is pulled
   by a steady force F (read on a spring balance). Friction f = μ m g
   opposes the motion.
     net force   Fnet = F − f        (if F ≤ μ m g the cart stays still)
     acceleration a = Fnet ÷ m
     v = a t,  s = ½ a t²,  momentum p = m v
   A ticker-timer prints a dot every 0.2 s on a paper tape: the gaps
   grow evenly, the sign of uniform acceleration. The tape of the
   previous run stays faded underneath for comparison.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var G = 9.8, TRACK = 4, CART_M = 1, DOT_DT = 0.2;
  var SURF = { air: { mu: 0, name: 'air track (no friction)' }, smooth: { mu: 0.05, name: 'smooth floor' }, rough: { mu: 0.15, name: 'rough floor' } };
  var prevTape = null, prevLabel = '';

  function mass(p) { return CART_M + p.bricks; }
  function fric(p) { return (SURF[p.surf] || SURF.air).mu * mass(p) * G; }
  function acc(p) { var f = fric(p); return p.F > f ? (p.F - f) / mass(p) : 0; }

  SimLab.createSim({
    ariaLabel: 'A cart on a straight track pulled by a spring balance with a steady force; a ticker tape behind it records a dot every 0.2 seconds',
    mobileAspect: '4 / 3.6',
    params: [
      { id: 'F', label: 'Pulling force F', min: 0, max: 20, step: 0.5, value: 6, unit: 'N',
        presets: [{ label: '3 N', value: 3 }, { label: '6 N', value: 6 }, { label: '12 N', value: 12 }] },
      { id: 'bricks', label: 'Load on the cart (1 kg cart + bricks)', min: 0, max: 5, step: 1, value: 1, unit: 'kg',
        presets: [{ label: 'empty', value: 0 }, { label: '+1 kg', value: 1 }, { label: '+3 kg', value: 3 }] },
      { id: 'surf', label: 'Track surface', type: 'select', value: 'air',
        options: [{ value: 'air', label: 'Air track (no friction)' }, { value: 'smooth', label: 'Smooth floor (μ = 0.05)' }, { value: 'rough', label: 'Rough floor (μ = 0.15)' }] },
      { id: 'prev', label: 'Keep the last tape for comparison', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'a', label: 'Acceleration a = (F − f) ÷ m', unit: 'm/s²', digits: 2, key: true },
      { id: 'm', label: 'Total mass m', unit: 'kg', digits: 0 },
      { id: 'f', label: 'Friction f', unit: 'N', digits: 2 },
      { id: 'v', label: 'Speed v = a t', unit: 'm/s', digits: 2 },
      { id: 's', label: 'Distance s = ½ a t²', unit: 'm', digits: 2 },
      { id: 'p', label: 'Momentum p = m v', unit: 'kg·m/s', digits: 2 }
    ],
    graph: { title: 'Speed of the cart', yLabel: 'v (m/s)', xMax: 4, series: [{ label: 'v (m/s)', color: '--sim-1' }] },
    onParam: function (sim, id) {
      if (id === 'prev') return true;
      return false;
    },

    reset: function (sim) {
      var st = sim.state;
      if (st && st.dots && st.dots.length > 1) { prevTape = st.dots.slice(); prevLabel = st.label; }
      var p = sim.p;
      sim.state = { x: 0, v: 0, t: 0, dots: [0], nextDot: DOT_DT, done: false,
        label: 'F = ' + M.fmt(p.F, 1) + ' N, m = ' + mass(p) + ' kg' + (p.surf !== 'air' ? ', ' + (SURF[p.surf] || SURF.air).name : '') };
    },
    update: function (sim, dt) {
      var st = sim.state, a = acc(sim.p);
      st.t += dt;
      st.v += a * dt; st.x += st.v * dt;
      if (st.t >= st.nextDot - 1e-9) { st.dots.push(st.x); st.nextDot += DOT_DT; }
      if (st.x >= TRACK) { st.x = TRACK; st.done = true; }
    },
    finished: function (sim) { return sim.state.done || sim.state.t >= 8; },
    sample: function (sim) { return [sim.state.v]; },
    status: function (sim) {
      var st = sim.state, p = sim.p;
      if (acc(p) === 0) return p.F === 0 ? 'No pull, no motion' : 'Pull is not more than friction: the cart stays still';
      if (st.done) return 'Reached the end of the track in ' + M.fmt(st.t, 2) + ' s';
      return (sim.running ? 'Pulling' : 'Paused') + ' · t = ' + M.fmt(st.t, 2) + ' s';
    },
    readout: function (sim) {
      var st = sim.state, p = sim.p, m = mass(p);
      return { a: acc(p), m: m, f: Math.min(fric(p), p.F), v: st.v, s: st.x, p: m * st.v };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, st = sim.state, narrow = W < 560;
      var padL = narrow ? 18 : 40, padR = narrow ? 18 : 40;
      var cartW = narrow ? 64 : 92, cartH = narrow ? 30 : 38;
      var trackX0 = padL + 4, trackX1 = W - padR - cartW - (narrow ? 40 : 70);
      var sc = (trackX1 - trackX0) / TRACK;
      var top = 40, railY = top + (H - top) * 0.42, a = acc(p), m = mass(p);
      function X(x) { return trackX0 + x * sc; }
      D.clear(ctx, W, H, c.bg);

      // track + metre marks
      D.line(ctx, trackX0, railY, X(TRACK) + cartW + 10, railY, c.ink, 3);
      for (var k = 0; k <= TRACK; k++) {
        D.line(ctx, X(k), railY + 2, X(k), railY + 9, c.muted, 1.5);
        D.text(ctx, k + ' m', X(k), railY + 19, { color: c.muted, size: 10.5, align: 'center' });
      }
      D.roundRect(ctx, X(TRACK) + cartW + 6, railY - 34, 8, 34, 2, c.surface2, c.border, 1);

      // cart
      var cx = X(st.x), cy = railY - cartH - 8;
      D.roundRect(ctx, cx, cy, cartW, cartH, 6, c.s1, D.alpha('#000', 0.35), 1);
      var wr = narrow ? 6 : 8;
      D.circle(ctx, cx + cartW * 0.22, railY - wr, wr, c.surface2, c.ink, 2);
      D.circle(ctx, cx + cartW * 0.78, railY - wr, wr, c.surface2, c.ink, 2);
      var bw = narrow ? 12 : 16, bh = narrow ? 8 : 10;
      for (var b = 0; b < p.bricks; b++) {
        var col = b % 3, row = Math.floor(b / 3);
        D.roundRect(ctx, cx + 6 + col * (bw + 3), cy - bh * (row + 1) - row * 2, bw, bh, 2, '#b45309', D.alpha('#000', 0.4), 1);
      }
      D.text(ctx, m + ' kg', cx + cartW / 2, cy + cartH / 2, { color: '#0b1020', size: narrow ? 11 : 13, weight: 700, align: 'center' });

      // spring balance + string
      var hy = cy + cartH / 2, hx = cx + cartW + (narrow ? 30 : 50);
      D.line(ctx, cx + cartW, hy, hx - 22, hy, c.ink, 1.5);
      D.roundRect(ctx, hx - 22, hy - 7, 26, 14, 4, c.surface2, c.ink, 1.5);
      D.text(ctx, M.fmt(p.F, 1), hx - 9, hy, { color: c.text, size: 9.5, weight: 700, align: 'center' });
      D.circle(ctx, hx + 9, hy, 5, '#d6a77a', D.alpha('#000', 0.35), 1);

      // force arrows
      var fs = narrow ? 3.2 : 4.5;   // px per newton
      var fy = cy - (p.bricks > 3 ? 32 : p.bricks > 0 ? 20 : 10);
      if (p.F > 0) {
        D.arrow(ctx, cx + cartW / 2, fy, cx + cartW / 2 + Math.max(12, p.F * fs), fy, c.s2, 3, 9);
        D.text(ctx, 'F = ' + M.fmt(p.F, 1) + ' N', cx + cartW / 2 + Math.max(12, p.F * fs) + 6, fy, { color: c.s2, size: 11, weight: 700, bg: D.alpha(c.bg, 0.8), fit: W });
      }
      var f = Math.min(fric(p), p.F);
      if (f > 0.01) {
        D.arrow(ctx, cx + cartW * 0.2, railY + 30, cx + cartW * 0.2 - Math.max(10, f * fs), railY + 30, c.danger, 3, 8);
        D.text(ctx, 'friction ' + M.fmt(f, 1) + ' N', cx + cartW * 0.2 - Math.max(10, f * fs) - 4, railY + 30, { color: c.danger, size: 10.5, weight: 700, align: 'right', bg: D.alpha(c.bg, 0.8), fit: W });
      }

      // ticker tapes
      var tapeY = railY + (narrow ? 58 : 66), tapeH = narrow ? 18 : 22;
      function tape(dots, y, alpha, color, label) {
        D.roundRect(ctx, trackX0 - 4, y - tapeH / 2, X(TRACK) - trackX0 + 8, tapeH, 3, D.alpha('#fef3c7', c.light ? 0.9 * alpha : 0.85 * alpha), D.alpha(c.border, alpha), 1);
        for (var i = 0; i < dots.length; i++) D.circle(ctx, X(dots[i]), y, narrow ? 2.4 : 3, D.alpha(color, alpha));
        D.text(ctx, label, trackX0, y + tapeH / 2 + 10, { color: D.alpha(c.muted, Math.max(alpha, 0.7)), size: 10.5, fit: W });
      }
      tape(st.dots, tapeY, 1, '#111827', 'This run: ' + st.label + ' · a dot every 0.2 s');
      if (p.prev && prevTape) tape(prevTape, tapeY + tapeH + (narrow ? 26 : 30), 0.55, '#111827', 'Last run: ' + prevLabel);

      // headline
      var headline, hc = c.s1;
      if (p.F === 0) { headline = 'No force: the cart stays at rest'; hc = c.muted; }
      else if (a === 0) { headline = 'Pull (' + M.fmt(p.F, 1) + ' N) is not more than friction (' + M.fmt(fric(p), 1) + ' N): no motion'; hc = c.warning; }
      else headline = 'a = (F − f) ÷ m = (' + M.fmt(p.F, 1) + ' − ' + M.fmt(f, 1) + ') ÷ ' + m + ' = ' + M.fmt(a, 2) + ' m/s²';
      var hs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(headline).width > W - 30) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, headline, W / 2, 18, { color: c.bg, bg: hc, size: hs, weight: 700, align: 'center', pad: 5, fit: W });
      D.text(ctx, 't = ' + M.fmt(st.t, 2) + ' s · v = ' + M.fmt(st.v, 2) + ' m/s', W - 10, H - 12, { color: c.faint, size: 11, align: 'right' });
    }
  });
})();
