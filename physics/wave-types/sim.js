/* =====================================================================
   Waves · Transverse and Longitudinal Waves — sim.js
   ---------------------------------------------------------------------
   A 2 m long row of particles (a stretched string, and a slinky / a
   column of air). A vibrator at the left end starts at t = 0. The wave
   travels right at speed v; a particle at rest position x only starts
   moving once the wave front (x = v t) reaches it:
     s(x, t) = A sin(ω (t − x/v))  for x < v t, else 0
   Transverse row: s is drawn sideways (up/down).
   Longitudinal row: s is drawn along the row (left/right).
   λ = v / f. f ≤ 2 Hz and v ≥ 1.6 m/s keep λ ≥ 0.8 m, and A ≤ 10 cm
   keeps kA ≤ 0.79, so neighbouring coils never pass each other.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var LEN = 2, NT = 41, NL = 61;

  function disp(p, x, t) {
    if (x > p.v * t) return 0;
    return p.A / 100 * Math.sin(2 * Math.PI * p.f * (t - x / p.v));
  }

  SimLab.createSim({
    ariaLabel: 'A row of beads on a string carrying a transverse wave above a row of coils carrying a longitudinal wave, with crests, troughs, compressions and rarefactions labelled and one marked particle moving back and forth about its place',
    mobileAspect: '3 / 4',
    params: [
      { id: 'f', label: 'Frequency f', min: 0.2, max: 2, step: 0.05, value: 1, unit: 'Hz' },
      { id: 'v', label: 'Wave speed v', min: 1.6, max: 4, step: 0.1, value: 2, unit: 'm/s', help: 'Set by the medium: tension and mass for a string, springiness for a slinky.' },
      { id: 'A', label: 'Amplitude A', min: 2, max: 10, step: 0.5, value: 6, unit: 'cm' },
      { id: 'show', label: 'Show', type: 'select', value: 'both', options: [{ value: 'both', label: 'Both waves' }, { value: 't', label: 'Transverse only' }, { value: 'l', label: 'Longitudinal only' }] },
      { id: 'mark', label: 'Marked particle at', min: 0.1, max: 1.9, step: 0.05, value: 1, unit: 'm', help: 'Or tap a particle.' }
    ],
    readouts: [
      { id: 'lam', label: 'Wavelength λ = v ÷ f', unit: 'm', digits: 2, key: true },
      { id: 'T', label: 'Time period T = 1 ÷ f', unit: 's', digits: 2, key: true },
      { id: 'front', label: 'Wave front has travelled', unit: 'm', digits: 2 },
      { id: 'vmax', label: 'Marked particle top speed (2πfA)', unit: 'm/s', digits: 2 },
      { id: 's', label: 'Marked particle displacement', unit: 'cm', digits: 1 }
    ],
    graph: { title: 'Marked particle: displacement vs time', yLabel: 'displacement (cm)', series: [{ label: 'marked particle' }], window: 8, symmetric: true },

    reset: function (sim) { sim.state = {}; },
    update: function () {},
    sample: function (sim) { return [disp(sim.p, sim.p.mark, sim.time) * 100]; },
    readout: function (sim) {
      var p = sim.p;
      return { lam: p.v / p.f, T: 1 / p.f, front: Math.min(p.v * sim.time, LEN), vmax: 2 * Math.PI * p.f * p.A / 100, s: disp(p, p.mark, sim.time) * 100 };
    },
    status: function (sim) {
      var p = sim.p, x = p.v * sim.time;
      return (sim.running ? 'Running' : 'Paused') + ' · ' + (sim.time === 0 ? 'press Play to start the vibrator' : x < LEN ? 'wave front at ' + M.fmt(x, 2) + ' m' : 'wave fills the whole row');
    },
    pointer: {
      down: function (sim, x) {
        var g = sim.state.g; if (!g) return false;
        var m = M.clamp((x - g.x0) / g.pxm, 0.1, 1.9);
        sim.setParam('mark', Math.round(m * 20) / 20);
        return false;
      }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, t = sim.time;
      D.clear(ctx, W, H, c.bg);
      var small = W < 560, fs = small ? 10 : 12;
      var x0 = small ? 30 : 56, x1 = W - (small ? 12 : 24), pxm = (x1 - x0) / LEN;
      sim.state.g = { x0: x0, pxm: pxm };
      var both = p.show === 'both', rows = both ? 2 : 1;
      var top = 6, rowH = (H - top - 26) / rows;
      var lam = p.v / p.f, w = 2 * Math.PI * p.f, k = w / p.v, front = p.v * t;
      var markCol = c.danger;

      // ruler along the bottom
      var ry = H - 16;
      D.line(ctx, x0, ry, x1, ry, c.axis, 1);
      for (var m = 0; m <= LEN + 1e-9; m += 0.5) {
        D.line(ctx, x0 + m * pxm, ry - 3, x0 + m * pxm, ry + 3, c.axis, 1);
        D.text(ctx, M.fmt(m, 1) + ' m', x0 + m * pxm, ry + 9, { color: c.faint, size: 9.5, align: 'center' });
      }
      // dashed wave-front line
      if (front > 0 && front < LEN) D.line(ctx, x0 + front * pxm, top, x0 + front * pxm, ry - 4, D.alpha(c.s3, 0.6), 1, [4, 4]);
      // marked particle's column
      D.line(ctx, x0 + p.mark * pxm, top + 4, x0 + p.mark * pxm, ry - 4, D.alpha(markCol, 0.25), 1, [2, 4]);

      // phases where crests (sin = 1) / compressions (ds/dx most negative → cos = 1) sit
      function spots(phase0) { // x positions with ω(t − x/v) = phase0 + 2πn, inside 0..min(front, LEN)
        var out = [], lim = Math.min(front, LEN);
        if (front <= 0) return out;
        var nMax = Math.floor((w * t - phase0) / (2 * Math.PI));
        for (var n = nMax; n >= -1; n--) {
          var x = (w * t - phase0 - 2 * Math.PI * n) / k;
          if (x > lim) break; if (x >= 0) out.push(x);
        }
        return out;
      }
      function vibrator(cx, cy, dx, dy) {
        D.roundRect(ctx, cx - 9 + dx, cy - 9 + dy, 18, 18, 4, D.alpha(c.s4, 0.85), c.s4, 1);
        D.text(ctx, '≋', cx + dx, cy + dy, { color: c.bg, size: 11, weight: 700, align: 'center' });
      }
      var r = 0;
      if (p.show !== 'l') {
        var cy = top + rowH * (r + 0.55), pxcm = Math.min(pxm / 100, rowH * 0.03); // true scale unless the row is short
        D.text(ctx, small ? 'Transverse (string)' : 'Transverse wave: particles move up and down, the wave moves along', x0 - (small ? 22 : 46), top + rowH * r + 10, { color: c.muted, size: fs, weight: 700, fit: W });
        D.line(ctx, x0, cy, x1, cy, D.alpha(c.muted, 0.35), 1, [3, 5]);
        ctx.save(); ctx.strokeStyle = c.s1; ctx.lineWidth = 2; ctx.beginPath();
        for (var px = x0; px <= x1 + 0.5; px += 2) {
          var yy = cy - disp(p, (px - x0) / pxm, t) * 100 * pxcm;
          if (px === x0) ctx.moveTo(px, yy); else ctx.lineTo(px, yy);
        }
        ctx.stroke(); ctx.restore();
        for (var i = 0; i < NT; i++) {
          var xr = i / (NT - 1) * LEN;
          D.circle(ctx, x0 + xr * pxm, cy - disp(p, xr, t) * 100 * pxcm, small ? 3 : 4, c.s1);
        }
        var sm = disp(p, p.mark, t) * 100 * pxcm, mx = x0 + p.mark * pxm;
        D.line(ctx, mx, cy - p.A * pxcm, mx, cy + p.A * pxcm, D.alpha(markCol, 0.5), 2);
        D.circle(ctx, mx, cy - sm, small ? 5 : 6, markCol, c.bg, 1.5);
        vibrator(x0 - 14, cy, 0, -disp(p, 0, t) * 100 * pxcm);
        spots(Math.PI / 2).forEach(function (x) { D.text(ctx, 'crest', x0 + x * pxm, cy - p.A * pxcm - 9, { color: c.s2, size: 9.5, weight: 700, align: 'center' }); });
        spots(-Math.PI / 2).forEach(function (x) { D.text(ctx, 'trough', x0 + x * pxm, cy + p.A * pxcm + 9, { color: c.s2, size: 9.5, weight: 700, align: 'center' }); });
        // λ bracket between two crests (or from a crest one λ along)
        var cr = spots(Math.PI / 2);
        if (cr.length >= 2 || (cr.length === 1 && cr[0] + lam <= Math.min(front, LEN))) {
          var a = cr.length >= 2 ? cr[1] : cr[0], b = a + lam, by = cy + p.A * pxcm + (small ? 20 : 24);
          if (x0 + b * pxm <= x1 + 1 && by < top + rowH * (r + 1) - 4) {
            D.line(ctx, x0 + a * pxm, by, x0 + b * pxm, by, c.s3, 1.5);
            D.line(ctx, x0 + a * pxm, by - 4, x0 + a * pxm, by + 4, c.s3, 1.5); D.line(ctx, x0 + b * pxm, by - 4, x0 + b * pxm, by + 4, c.s3, 1.5);
            D.text(ctx, 'λ = ' + M.fmt(lam, 2) + ' m', x0 + (a + b) / 2 * pxm, by - 8, { color: c.s3, size: fs - 1, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2 });
          }
        }
        r++;
      }
      if (p.show !== 't') {
        var ly = top + rowH * (r + 0.55), lh = Math.min(rowH * 0.42, 46);
        D.text(ctx, small ? 'Longitudinal (slinky / air)' : 'Longitudinal wave: particles move to and fro along the direction of the wave', x0 - (small ? 22 : 46), top + rowH * r + 10, { color: c.muted, size: fs, weight: 700, fit: W });
        D.roundRect(ctx, x0 - 4, ly - lh / 2 - 4, x1 - x0 + 8, lh + 8, 6, D.alpha(c.muted, 0.06));
        for (var j = 0; j < NL; j++) {
          var xr2 = j / (NL - 1) * LEN, xs = x0 + (xr2 + disp(p, xr2, t)) * pxm;
          D.line(ctx, xs, ly - lh / 2, xs, ly + lh / 2, c.s2, small ? 1.5 : 2);
        }
        var mx2 = x0 + (p.mark + disp(p, p.mark, t)) * pxm, mrest = x0 + p.mark * pxm;
        D.line(ctx, mrest - p.A / 100 * pxm, ly + lh / 2 + 6, mrest + p.A / 100 * pxm, ly + lh / 2 + 6, D.alpha(markCol, 0.6), 2);
        D.line(ctx, mx2, ly - lh / 2 - 2, mx2, ly + lh / 2 + 2, markCol, 3);
        vibrator(x0 - 14, ly, disp(p, 0, t) * pxm, 0);
        var lab = ly - lh / 2 - 10;
        spots(0).forEach(function (x) { var xx = x0 + (x + disp(p, x, t)) * pxm; if (xx < x1 - 4) D.text(ctx, 'C', xx, lab, { color: c.s4, size: 10, weight: 700, align: 'center' }); });
        spots(Math.PI).forEach(function (x) { var xx = x0 + (x + disp(p, x, t)) * pxm; if (xx < x1 - 4) D.text(ctx, 'R', xx, lab, { color: c.s3, size: 10, weight: 700, align: 'center' }); });
        if (rowH > 120) D.text(ctx, 'C = compression (coils crowded)   R = rarefaction (coils spread out)', (x0 + x1) / 2, ly + lh / 2 + 20, { color: c.faint, size: fs - 1.5, align: 'center', fit: W });
      }
      if (t === 0) D.text(ctx, 'Press ▶ Play to start the vibrator', W / 2, top + (H - 26) / 2, { color: c.bg, bg: c.s3, size: fs + 1, weight: 700, align: 'center', pad: 6, fit: W });
    }
  });
})();
