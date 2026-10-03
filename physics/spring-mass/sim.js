/* =====================================================================
   Oscillations · Spring–Mass Oscillator — sim.js
   ---------------------------------------------------------------------
   A block of mass m on a smooth table, tied to a wall by a spring of
   spring constant k. x = displacement from the equilibrium position.
     Hooke's law:  F = −k x  (plus an optional drag force −b v)
     m x'' = −k x − b v   → integrated with RK4
     Without damping this is SHM: x = A cos(ωt), ω = √(k/m), T = 2π√(m/k)
   Energy: KE = ½mv², spring PE = ½kx², total stays ½kA² when b = 0.
   The period is measured between successive right-hand turning points.
   Drag the block to pull it to a new starting position.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var startSign = 1; // set when the block is dragged to the left

  function geo(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560, barsW = wide ? 130 : 0;
    var floor = wide ? H * 0.62 : H * 0.5, wall = 18, avail = W - barsW - wall - 20;
    var xEq = wall + avail * 0.55, pxm = avail * 0.4 / 0.25; // 25 cm of travel either side fits
    var side = 30 + 14 * Math.cbrt(sim.p.m);
    return { W: W, H: H, wide: wide, barsW: barsW, floor: floor, wall: wall, xEq: xEq, pxm: pxm, side: side };
  }
  function energy(sim) {
    var s = sim.state, p = sim.p, ke = 0.5 * p.m * s.v * s.v, pe = 0.5 * p.k * s.x * s.x;
    return { ke: ke, pe: pe, e: ke + pe };
  }
  function blockX(sim, g) { return g.xEq + sim.state.x * g.pxm; }
  function near(sim, x, y) {
    var g = geo(sim), bx = blockX(sim, g);
    return Math.abs(x - bx) < g.side / 2 + 14 && y > g.floor - g.side - 14 && y < g.floor + 10;
  }

  SimLab.createSim({
    ariaLabel: 'A block on a smooth table tied to a wall by a spring, oscillating back and forth, with force and velocity arrows and energy bars',
    autoplay: true,
    params: [
      { id: 'k', label: 'Spring constant k', min: 5, max: 100, step: 1, value: 20, unit: 'N/m', help: 'A stiffer spring has a bigger k.' },
      { id: 'm', label: 'Mass of the block m', min: 0.1, max: 5, step: 0.1, value: 0.5, unit: 'kg' },
      { id: 'A', label: 'Pull it out by (amplitude A)', min: 2, max: 20, step: 1, value: 10, unit: 'cm', help: 'Tip: you can also drag the block.' },
      { id: 'b', label: 'Damping (friction with air)', min: 0, max: 2, step: 0.05, value: 0, unit: 'kg/s' }
    ],
    readouts: [
      { id: 'x', label: 'Displacement x', unit: 'cm', digits: 1 },
      { id: 'v', label: 'Velocity v', unit: 'm/s', digits: 2 },
      { id: 'F', label: 'Spring force F = −kx', unit: 'N', digits: 2 },
      { id: 'T', label: 'Period 2π√(m/k)', unit: 's', digits: 3, key: true },
      { id: 'Tm', label: 'Measured period', unit: 's', digits: 3, key: true },
      { id: 'f', label: 'Frequency', unit: 'Hz', digits: 2 },
      { id: 'E', label: 'Total energy', unit: 'mJ', digits: 1 }
    ],
    graph: { title: 'Displacement vs time', yLabel: 'x (cm)', series: [{ label: 'x (cm)' }], window: 8, symmetric: true },

    onParam: function (sim, id) {
      if (id === 'A') return false;
      return true; // k, m and damping change the motion from where it is
    },
    reset: function (sim) { sim.state = { x: startSign * sim.p.A / 100, v: 0, last: null, Tm: null, drag: false, e0: 0 }; sim.state.e0 = energy(sim).e; },
    update: function (sim, dt) {
      var s = sim.state, p = sim.p; if (s.drag) return;
      var pv = s.v;
      var y = M.rk4([s.x, s.v], function (u) { return [u[1], (-p.k * u[0] - p.b * u[1]) / p.m]; }, dt);
      s.x = y[0]; s.v = y[1];
      if (pv > 0 && s.v <= 0) { var t = sim.time + dt; if (s.last != null) s.Tm = t - s.last; s.last = t; }
    },
    sample: function (sim) { return [sim.state.x * 100]; },
    readout: function (sim) {
      var s = sim.state, p = sim.p, T = 2 * Math.PI * Math.sqrt(p.m / p.k);
      return { x: s.x * 100, v: s.v, F: -p.k * s.x, T: T, Tm: s.Tm, f: 1 / T, E: energy(sim).e * 1000 };
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, s = sim.state, p = sim.p, g = geo(sim), W = g.W, H = g.H;
      D.clear(ctx, W, H, c.bg);
      D.grid(ctx, 0, 0, W, H, 40, c.grid);
      var bx = blockX(sim, g), fy = g.floor, sd = g.side;

      // wall and smooth table
      D.roundRect(ctx, 0, fy - 120, g.wall, 120 + 4, 2, c.muted);
      for (var i = fy - 116; i < fy; i += 12) D.line(ctx, g.wall, i, g.wall - 8, i + 8, c.bg, 1.2);
      D.line(ctx, 0, fy, W - g.barsW - 6, fy, c.ink, 2);
      D.text(ctx, 'smooth table (no friction)', 8, fy + 14, { color: c.faint, size: 10.5 });

      // equilibrium line and ±A marks
      D.line(ctx, g.xEq, fy - sd - 34, g.xEq, fy + 26, D.alpha(c.s3, 0.8), 1.5, [5, 4]);
      D.text(ctx, 'x = 0', g.xEq, fy + 34, { color: c.s3, size: 11, weight: 600, align: 'center' });
      var amp = p.A / 100 * g.pxm;
      [-1, 1].forEach(function (k) {
        D.line(ctx, g.xEq + k * amp, fy + 4, g.xEq + k * amp, fy + 16, c.faint, 1.5);
        D.text(ctx, (k > 0 ? '+' : '−') + 'A', g.xEq + k * amp, fy + 24, { color: c.faint, size: 10, align: 'center' });
      });

      // spring: zig-zag from the wall to the block, thicker for a stiffer spring
      var sx0 = g.wall, sx1 = bx - sd / 2, sy = fy - sd / 2, coils = 12, amp2 = Math.min(12, sd * 0.32);
      ctx.save(); ctx.strokeStyle = c.light ? '#0f766e' : '#5eead4'; ctx.lineWidth = 1.2 + p.k / 40; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(sx0, sy); var lead = 8; ctx.lineTo(sx0 + lead, sy);
      var span = sx1 - sx0 - 2 * lead;
      for (var n = 0; n < coils * 2; n++) ctx.lineTo(sx0 + lead + span * (n + 0.5) / (coils * 2), sy + (n % 2 ? amp2 : -amp2));
      ctx.lineTo(sx1 - lead, sy); ctx.lineTo(sx1, sy); ctx.stroke(); ctx.restore();

      // block
      var grad = ctx.createLinearGradient(bx, fy - sd, bx, fy);
      grad.addColorStop(0, c.light ? '#fdba74' : '#fb923c'); grad.addColorStop(1, c.light ? '#ea580c' : '#c2410c');
      D.roundRect(ctx, bx - sd / 2, fy - sd, sd, sd, 5, grad, s.drag ? c.ink : null, 2);
      D.text(ctx, M.fmt(p.m, 1) + ' kg', bx, fy - sd / 2, { color: '#fff', size: 11, weight: 700, align: 'center' });

      // force (restoring) and velocity arrows
      var ref = Math.max(p.A / 100, 0.02), fl = -s.x / ref * g.pxm * 0.16;
      if (Math.abs(fl) > 3) {
        D.arrow(ctx, bx, fy - sd - 14, bx + fl, fy - sd - 14, c.danger, 3, 9);
        D.text(ctx, 'F', bx + fl + (fl > 0 ? 6 : -6), fy - sd - 14, { color: c.danger, size: 12, weight: 700, align: fl > 0 ? 'left' : 'right' });
      }
      var vl = s.v / (ref * Math.sqrt(p.k / p.m)) * g.pxm * 0.16;
      if (Math.abs(vl) > 3) {
        D.arrow(ctx, bx, fy - sd - 32, bx + vl, fy - sd - 32, c.s2, 3, 9);
        D.text(ctx, 'v', bx + vl + (vl > 0 ? 6 : -6), fy - sd - 32, { color: c.s2, size: 12, weight: 700, align: vl > 0 ? 'left' : 'right' });
      }
      var tip = Math.abs(s.x) < 0.004 ? 'at x = 0: no spring force, fastest' : (Math.abs(s.v) < 0.03 && Math.abs(s.x) > 0.01 ? 'turning point: stops for an instant, biggest force' : 'the force always points back to x = 0');
      D.text(ctx, tip, (W - g.barsW) / 2, 16, { color: c.bg, bg: c.s3, size: W < 560 ? 11 : 12.5, weight: 700, align: 'center', pad: 4, fit: W - g.barsW });

      // energy bars
      var e = energy(sim), emax = Math.max(s.e0, e.e, 1e-9), list = [['KE', e.ke, c.s2], ['PE', e.pe, c.s1], ['Total', e.e, c.s4]];
      if (g.wide) {
        var x0 = W - g.barsW + 12, bw = 26, top = 46, bh = H - 96;
        D.text(ctx, 'Energy', x0 + 44, 28, { color: c.muted, size: 12, weight: 600, align: 'center' });
        list.forEach(function (it, k) {
          var x = x0 + k * (bw + 8), hh = bh * it[1] / emax;
          D.roundRect(ctx, x, top, bw, bh, 5, D.alpha(c.muted, 0.12));
          if (hh > 0.5) D.roundRect(ctx, x, top + bh - hh, bw, hh, 5, it[2]);
          D.text(ctx, it[0], x + bw / 2, top + bh + 14, { color: c.muted, size: 10, align: 'center' });
        });
      } else {
        var y0 = fy + 52, lh = Math.min(20, (H - y0 - 10) / 3.4), bxl = 50, bwid = W - bxl - 16;
        list.forEach(function (it, k) {
          var y = y0 + k * (lh + 6), ww = bwid * it[1] / emax;
          D.text(ctx, it[0], 10, y + lh / 2, { color: c.muted, size: 11, weight: 600 });
          D.roundRect(ctx, bxl, y, bwid, lh, 4, D.alpha(c.muted, 0.12));
          if (ww > 0.5) D.roundRect(ctx, bxl, y, ww, lh, 4, it[2]);
        });
      }
      if (!sim.running && !s.drag && sim.time === 0) D.text(ctx, 'Drag the block or press Play', (W - g.barsW) / 2, fy - sd - 56, { color: c.muted, size: 12, align: 'center', fit: W });
    },

    pointer: {
      hover: near,
      down: function (sim, x, y) {
        if (!near(sim, x, y)) return false;
        sim.state.drag = true; sim.pause(); return true;
      },
      move: function (sim, x) {
        var g = geo(sim); sim.state.x = M.clamp((x - g.xEq) / g.pxm, -0.2, 0.2); sim.state.v = 0;
      },
      up: function (sim) {
        var x = sim.state.x, a = Math.max(2, Math.min(20, Math.round(Math.abs(x) * 100)));
        startSign = x < 0 ? -1 : 1;
        sim.setParam('A', a); sim.reset();
        sim.play();
      }
    }
  });
})();
