/* =====================================================================
   Projectile Motion — sim.js
   ---------------------------------------------------------------------
   A ball is launched from height h with speed v0 at angle θ.
   With no air resistance the motion is exactly:
       x(t) = v0·cosθ · t
       y(t) = h + v0·sinθ · t − ½·g·t²
   So we compute positions analytically (no integration error).
   Previous launches are kept as faint "ghost" traces for comparison.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  /* Pre-compute the whole flight from the parameters */
  function flight(p) {
    var th = M.rad(p.angle), g = p.gravity;
    var vx = p.speed * Math.cos(th), vy = p.speed * Math.sin(th);
    var tf = (vy + Math.sqrt(vy * vy + 2 * g * p.height)) / g;          // time of flight
    var tPeak = Math.max(0, vy / g);
    var hmax = p.height + (vy > 0 ? vy * vy / (2 * g) : 0);             // max height
    return { vx: vx, vy: vy, tf: tf, tPeak: tPeak, hmax: hmax, range: vx * tf, g: g, h: p.height };
  }
  function posAt(f, t) { return { x: f.vx * t, y: f.h + f.vy * t - 0.5 * f.g * t * t }; }

  var ghosts = []; // completed trajectories [{pts, range, hmax}]

  SimLab.createSim({
    ariaLabel: 'Projectile launched from a cannon, drawing its parabolic path over the ground',
    playLabel: 'Launch',
    params: [
      { id: 'angle', label: 'Launch angle', min: 0, max: 90, step: 1, value: 45, unit: '°' },
      { id: 'speed', label: 'Initial speed', min: 1, max: 50, step: 0.5, value: 20, unit: 'm/s' },
      { id: 'gravity', label: 'Gravity', min: 1, max: 25, step: 0.01, value: 9.81, unit: 'm/s²',
        presets: [{ label: 'Moon', value: 1.62 }, { label: 'Mars', value: 3.71 }, { label: 'Earth', value: 9.81 }, { label: 'Jupiter', value: 24.79 }] },
      { id: 'height', label: 'Launch height', min: 0, max: 50, step: 0.5, value: 0, unit: 'm' },
      { id: 'vectors', label: 'Show velocity arrows', type: 'toggle', value: true }
    ],
    buttons: [{ label: 'Clear old traces', full: true, onClick: function (sim) { ghosts = []; sim.reset(); } }],
    buttonsTitle: 'Traces',
    readouts: [
      { id: 't', label: 'Time', unit: 's' },
      { id: 'v', label: 'Speed', unit: 'm/s' },
      { id: 'x', label: 'Distance x', unit: 'm' },
      { id: 'y', label: 'Height y', unit: 'm' },
      { id: 'tf', label: 'Time of flight', unit: 's', key: true },
      { id: 'hmax', label: 'Max height', unit: 'm', key: true },
      { id: 'range', label: 'Range', unit: 'm', key: true }
    ],
    graph: {
      title: 'Position vs time', yLabel: 'metres',
      series: [{ label: 'height y' }, { label: 'distance x', color: '--sim-2' }],
      window: null, xMax: function () { return SimLab.current ? SimLab.current.state.f.tf : 1; }
    },

    onParam: function (sim, id) { return id === 'vectors'; }, // toggling arrows doesn't restart

    reset: function (sim) {
      // save the previous flight as a ghost if it actually flew
      var s = sim.state;
      if (s.f && s.trail && s.trail.length > 3 && s.t > 0.05) {
        ghosts.push({ pts: s.trail.slice(), range: posAt(s.f, s.t).x, hmax: s.f.hmax });
        if (ghosts.length > 4) ghosts.shift();
      }
      var f = flight(sim.p);
      sim.state = { f: f, t: 0, trail: [posAt(f, 0)] };
    },

    update: function (sim, dt) {
      var s = sim.state;
      s.t = Math.min(s.t + dt, s.f.tf);
      var p = posAt(s.f, s.t);
      var last = s.trail[s.trail.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) > 0.05 || s.t >= s.f.tf) s.trail.push(p);
    },

    finished: function (sim) { return sim.state.t >= sim.state.f.tf - 1e-9; },

    sample: function (sim) { var p = posAt(sim.state.f, sim.state.t); return [Math.max(0, p.y), p.x]; },

    readout: function (sim) {
      var s = sim.state, f = s.f, p = posAt(f, s.t), vy = f.vy - f.g * s.t;
      return { t: s.t, v: Math.hypot(f.vx, vy), x: p.x, y: Math.max(0, p.y), tf: f.tf, hmax: f.hmax, range: f.range };
    },

    status: function (sim) {
      var s = sim.state;
      if (s.t >= s.f.tf - 1e-9) return 'Landed · range ' + M.fmt(s.f.range, 1) + ' m';
      return (sim.running ? 'In flight' : s.t > 0 ? 'Paused' : 'Ready to launch') + ' · t = ' + M.fmt(s.t, 2) + ' s';
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, f = s.f;
      D.clear(ctx, W, H, c.bg);

      // ---- world → screen scale that fits this flight and the ghosts
      var maxX = Math.max(f.range, 10), maxY = Math.max(f.hmax, 5);
      ghosts.forEach(function (g) { maxX = Math.max(maxX, g.range); maxY = Math.max(maxY, g.hmax); });
      var padL = 46, padR = 20, padT = 40, padB = 34;
      var scale = Math.min((W - padL - padR) / (maxX * 1.08), (H - padT - padB) / (maxY * 1.12));
      var ox = padL, oy = H - padB;
      function X(x) { return ox + x * scale; }
      function Y(y) { return oy - y * scale; }

      // ---- grid with metre labels
      var step = D.niceStep((W - padL) / scale, Math.max(3, Math.floor(W / 110)));
      ctx.font = '11px ' + c.mono; ctx.fillStyle = c.muted;
      ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.beginPath();
      for (var gx = 0; X(gx) <= W; gx += step) {
        ctx.moveTo(Math.round(X(gx)) + 0.5, 0); ctx.lineTo(Math.round(X(gx)) + 0.5, oy);
      }
      for (var gy = 0; Y(gy) >= 0; gy += step) {
        ctx.moveTo(ox, Math.round(Y(gy)) + 0.5); ctx.lineTo(W, Math.round(Y(gy)) + 0.5);
      }
      ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      for (gx = 0; X(gx) <= W - 10; gx += step) ctx.fillText(M.fmt(gx, step < 1 ? 1 : 0), X(gx), oy + 8);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (gy = step; Y(gy) >= 10; gy += step) ctx.fillText(M.fmt(gy, step < 1 ? 1 : 0), ox - 8, Y(gy));
      D.text(ctx, 'm', W - 8, oy + 14, { color: c.faint, align: 'right', size: 11 });

      // ---- ground
      ctx.fillStyle = D.alpha(c.s4, 0.12); ctx.fillRect(0, oy, W, H - oy);
      D.line(ctx, 0, oy + 0.5, W, oy + 0.5, c.axis, 2);

      // ---- launch tower
      if (f.h > 0) D.roundRect(ctx, X(0) - 14, Y(f.h), 14, oy - Y(f.h), 3, D.alpha(c.muted, 0.35), c.border);

      // ---- ghosts
      ghosts.forEach(function (g, i) {
        ctx.strokeStyle = D.alpha(c.muted, 0.25 + 0.1 * i); ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
        ctx.beginPath(); g.pts.forEach(function (p, k) { k ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)); }); ctx.stroke();
      });
      ctx.setLineDash([]);

      // ---- predicted path (faint dashed)
      ctx.strokeStyle = D.alpha(c.accent, 0.35); ctx.lineWidth = 1.5; ctx.setLineDash([2, 6]);
      ctx.beginPath();
      for (var i = 0; i <= 80; i++) { var pp = posAt(f, f.tf * i / 80); i ? ctx.lineTo(X(pp.x), Y(pp.y)) : ctx.moveTo(X(pp.x), Y(pp.y)); }
      ctx.stroke(); ctx.setLineDash([]);

      // ---- trail
      ctx.strokeStyle = c.accent; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); s.trail.forEach(function (p, k) { k ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)); });
      var cur = posAt(f, s.t); ctx.lineTo(X(cur.x), Y(Math.max(0, cur.y))); ctx.stroke();

      // ---- cannon
      var th = M.rad(sim.p.angle);
      ctx.save(); ctx.translate(X(0), Y(f.h)); ctx.rotate(-th);
      D.roundRect(ctx, -6, -8, 40, 16, 6, c.muted);
      ctx.restore();
      D.circle(ctx, X(0), Y(f.h), 11, c.surface2, c.border, 2);
      D.text(ctx, sim.p.angle + '°', X(0) + 44 * Math.cos(th) + 6, Y(f.h) - 44 * Math.sin(th) - 6, { color: c.muted, size: 12 });

      // ---- max height & range markers once passed
      if (s.t >= f.tPeak && f.vy > 0) {
        var pk = posAt(f, f.tPeak);
        D.line(ctx, X(pk.x), Y(pk.y), X(pk.x), oy, D.alpha(c.s3, 0.6), 1, [4, 4]);
        D.text(ctx, 'max ' + M.fmt(f.hmax, 1) + ' m', X(pk.x), Y(pk.y) - 14, { color: c.s3, align: 'center', size: 12, weight: 600, bg: D.alpha(c.bg, 0.8) });
      }
      if (s.t >= f.tf - 1e-9) {
        D.text(ctx, 'range ' + M.fmt(f.range, 1) + ' m', Math.min(X(f.range), W - 60), oy - 16, { color: c.s4, align: 'center', size: 12, weight: 600, bg: D.alpha(c.bg, 0.8) });
        D.line(ctx, X(f.range), oy - 6, X(f.range), oy + 6, c.s4, 2);
      }

      // ---- ball + velocity vectors
      var bx = X(cur.x), by = Y(Math.max(0, cur.y));
      if (sim.p.vectors && s.t < f.tf - 1e-9) {
        var vy = f.vy - f.g * s.t, k = 2.2;
        D.arrow(ctx, bx, by, bx + f.vx * k, by, c.s2, 2);            // horizontal component
        D.arrow(ctx, bx, by, bx, by - vy * k, c.s4, 2);              // vertical component
        D.arrow(ctx, bx, by, bx + f.vx * k, by - vy * k, c.ink, 2.5); // total velocity
      }
      D.circle(ctx, bx, by, 8, c.accent, c.bg, 2);

      // legend for arrows
      if (sim.p.vectors) {
        var lx = W - 150, ly = 16;
        [['v (total)', c.ink], ['vₓ constant', c.s2], ['v_y changes', c.s4]].forEach(function (it, n) {
          D.line(ctx, lx, ly + n * 16, lx + 16, ly + n * 16, it[1], 3);
          D.text(ctx, it[0], lx + 22, ly + n * 16, { color: c.muted, size: 11 });
        });
      }
    }
  });
})();
