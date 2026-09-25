/* =====================================================================
   Simple Pendulum — sim.js
   ---------------------------------------------------------------------
   Equation of motion (full, not the small-angle approximation):
       θ'' = −(g/L)·sin θ − b·θ'
   integrated with RK4. Energy is per the chosen bob mass m:
       KE = ½·m·(L·ω)²     PE = m·g·L·(1 − cos θ)
   The exact period for amplitude θ0 is T = T0 / AGM(1, cos(θ0/2))
   where T0 = 2π√(L/g) — the arithmetic-geometric mean gives it fast.
   Drag the bob to set a new starting angle.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  function agm(a, b) { for (var i = 0; i < 20; i++) { var a1 = (a + b) / 2; b = Math.sqrt(a * b); a = a1; } return a; }

  function geometry(sim) {
    var W = sim.width, H = sim.height;
    var energyW = W > 560 ? 120 : 0;              // energy bars on wide screens
    var px = (W - energyW) / 2, py = 36;
    var maxLen = Math.min(H - py - 40, (W - energyW) / 2 - 30);
    var scale = maxLen / 5;                        // 5 m = full length
    return { px: px, py: py, scale: scale, energyW: energyW };
  }

  SimLab.createSim({
    ariaLabel: 'A pendulum swinging from a pivot, with energy bars',
    autoplay: true,
    params: [
      { id: 'length', label: 'Length', min: 0.2, max: 5, step: 0.05, value: 2, unit: 'm' },
      { id: 'gravity', label: 'Gravity', min: 1, max: 25, step: 0.01, value: 9.81, unit: 'm/s²',
        presets: [{ label: 'Moon', value: 1.62 }, { label: 'Mars', value: 3.71 }, { label: 'Earth', value: 9.81 }, { label: 'Jupiter', value: 24.79 }] },
      { id: 'angle', label: 'Starting angle', min: 1, max: 170, step: 1, value: 30, unit: '°', help: 'Tip: you can also drag the bob.' },
      { id: 'damping', label: 'Damping (air friction)', min: 0, max: 1, step: 0.01, value: 0.05, unit: '1/s' },
      { id: 'mass', label: 'Bob mass', min: 0.1, max: 10, step: 0.1, value: 1, unit: 'kg' }
    ],
    readouts: [
      { id: 'theta', label: 'Angle θ', unit: '°', digits: 1 },
      { id: 'omega', label: 'Angular speed ω', unit: 'rad/s' },
      { id: 't0', label: 'Period (small-angle)', unit: 's', key: true },
      { id: 'texact', label: 'Period (exact)', unit: 's', key: true },
      { id: 'measured', label: 'Measured period', unit: 's' },
      { id: 'ke', label: 'Kinetic energy', unit: 'J' },
      { id: 'pe', label: 'Potential energy', unit: 'J' },
      { id: 'e', label: 'Total energy', unit: 'J' }
    ],
    graph: { title: 'Angle vs time', yLabel: 'angle (°)', series: [{ label: 'θ (degrees)' }], window: 10, symmetric: true },

    // Changing length / gravity / damping / mass keeps the swing going; only
    // a new starting angle restarts it.
    onParam: function (sim, id) {
      if (id === 'angle') return false;
      sim.state.e0 = energy(sim).e; // rebase energy-lost reference
      return true;
    },

    reset: function (sim) {
      sim.state = { th: M.rad(sim.p.angle), om: 0, trail: [], lastCross: null, measured: null, dragging: false };
      sim.state.e0 = energy(sim).e;
    },

    update: function (sim, dt) {
      var s = sim.state; if (s.dragging) return;
      var g = sim.p.gravity, L = sim.p.length, b = sim.p.damping;
      var prevOm = s.om;
      var y = M.rk4([s.th, s.om], function (v) { return [v[1], -(g / L) * Math.sin(v[0]) - b * v[1]]; }, dt);
      s.th = y[0]; s.om = y[1];
      // Measure period: time between successive turning points on the same side (ω crosses 0 from + to −)
      if (prevOm > 0 && s.om <= 0) {
        var tc = sim.time + dt;
        if (s.lastCross != null) s.measured = tc - s.lastCross;
        s.lastCross = tc;
      }
    },

    sample: function (sim) { return [M.deg(sim.state.th)]; },

    readout: function (sim) {
      var s = sim.state, L = sim.p.length, g = sim.p.gravity;
      var t0 = 2 * Math.PI * Math.sqrt(L / g);
      var e = energy(sim);
      return {
        theta: M.deg(s.th), omega: s.om, t0: t0,
        texact: t0 / agm(1, Math.cos(M.rad(sim.p.angle) / 2)),
        measured: s.measured, ke: e.ke, pe: e.pe, e: e.e
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state;
      var G = geometry(sim), L = sim.p.length * G.scale;
      D.clear(ctx, W, H, c.bg);
      D.grid(ctx, 0, 0, W, H, 40, c.grid);

      // ceiling
      D.roundRect(ctx, G.px - 70, G.py - 12, 140, 10, 3, c.muted);
      for (var i = -60; i <= 60; i += 12) D.line(ctx, G.px + i, G.py - 12, G.px + i - 8, G.py - 22, c.faint, 1.5);

      // vertical reference + amplitude arc
      D.line(ctx, G.px, G.py, G.px, G.py + L + 20, D.alpha(c.muted, 0.5), 1, [4, 6]);
      var a0 = M.rad(sim.p.angle);
      ctx.strokeStyle = D.alpha(c.s3, 0.5); ctx.lineWidth = 1.5; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.arc(G.px, G.py, L, Math.PI / 2 - Math.min(a0, Math.PI), Math.PI / 2 + Math.min(a0, Math.PI)); ctx.stroke(); ctx.setLineDash([]);

      var bx = G.px + L * Math.sin(s.th), by = G.py + L * Math.cos(s.th);

      // bob trail
      s.trail.push({ x: bx, y: by }); if (s.trail.length > 40) s.trail.shift();
      for (var k = 1; k < s.trail.length; k++) {
        D.line(ctx, s.trail[k - 1].x, s.trail[k - 1].y, s.trail[k].x, s.trail[k].y, D.alpha(c.accent, k / s.trail.length * 0.5), 3);
      }

      // angle arc
      ctx.strokeStyle = c.s3; ctx.lineWidth = 2; ctx.beginPath();
      var r = Math.min(46, L * 0.35);
      ctx.arc(G.px, G.py, r, Math.PI / 2, Math.PI / 2 - s.th, s.th > 0); ctx.stroke();
      D.text(ctx, 'θ = ' + M.fmt(M.deg(s.th), 1) + '°', G.px + (s.th >= 0 ? 10 : -10), G.py + r + 14,
        { color: c.s3, size: 12, weight: 600, align: s.th >= 0 ? 'left' : 'right' });

      // rod + bob
      D.line(ctx, G.px, G.py, bx, by, c.ink, 2.5);
      D.circle(ctx, G.px, G.py, 5, c.ink);
      var br = 10 + 6 * Math.cbrt(sim.p.mass);
      var grad = ctx.createRadialGradient(bx - br / 3, by - br / 3, 2, bx, by, br);
      grad.addColorStop(0, '#fff'); grad.addColorStop(0.25, c.accent); grad.addColorStop(1, D.alpha(c.accent, 0.8));
      D.circle(ctx, bx, by, br, grad, s.dragging ? c.ink : null, 2);

      // velocity arrow (tangent)
      if (!s.dragging) {
        var v = s.om * sim.p.length, k2 = 14;
        D.arrow(ctx, bx, by, bx + Math.cos(s.th) * v * k2, by - Math.sin(s.th) * v * k2, c.s2, 2.5);
      }

      // energy bars
      if (G.energyW) {
        var e = energy(sim), emax = Math.max(s.e0, e.e, 1e-9);
        var x0 = W - G.energyW + 14, bw = 24, top = 40, bh = H - 90;
        D.text(ctx, 'Energy', x0 + 40, 20, { color: c.muted, size: 12, weight: 600, align: 'center' });
        [['KE', e.ke, c.s2], ['PE', e.pe, c.s1], ['Total', e.e, c.s4]].forEach(function (it, n) {
          var x = x0 + n * (bw + 8), hh = bh * it[1] / emax;
          D.roundRect(ctx, x, top, bw, bh, 5, D.alpha(c.muted, 0.12));
          if (hh > 0.5) D.roundRect(ctx, x, top + bh - hh, bw, hh, 5, it[2]);
          D.text(ctx, it[0], x + bw / 2, top + bh + 14, { color: c.muted, size: 10, align: 'center' });
        });
      }
      if (!sim.running && !s.dragging && sim.time === 0) {
        D.text(ctx, 'Drag the bob or press Play', W / 2 - G.energyW / 2, H - 18, { color: c.muted, size: 12, align: 'center' });
      }
    },

    pointer: {
      hover: function (sim, x, y) { return near(sim, x, y); },
      down: function (sim, x, y) {
        if (!near(sim, x, y)) return false;
        sim.state.dragging = true; sim.pause();
        return true;
      },
      move: function (sim, x, y) {
        var G = geometry(sim);
        var th = Math.atan2(x - G.px, y - G.py);
        th = M.clamp(th, -M.rad(170), M.rad(170));
        sim.state.th = th; sim.state.om = 0;
      },
      up: function (sim) {
        var deg = Math.round(Math.abs(M.deg(sim.state.th))) || 1;
        var sign = sim.state.th < 0 ? -1 : 1;
        sim.setParam('angle', deg);
        sim.reset();
        sim.state.th = sign * M.rad(sim.p.angle);
        sim.state.e0 = energy(sim).e;
        sim.play();
      }
    }
  });

  function energy(sim) {
    var s = sim.state, m = sim.p.mass, L = sim.p.length, g = sim.p.gravity;
    var ke = 0.5 * m * Math.pow(L * s.om, 2), pe = m * g * L * (1 - Math.cos(s.th));
    return { ke: ke, pe: pe, e: ke + pe };
  }
  function near(sim, x, y) {
    var G = geometry(sim), L = sim.p.length * G.scale, s = sim.state;
    var bx = G.px + L * Math.sin(s.th), by = G.py + L * Math.cos(s.th);
    return Math.hypot(x - bx, y - by) < 34;
  }
})();
