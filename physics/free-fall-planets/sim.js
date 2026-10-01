/* =====================================================================
   Gravitation · Free Fall on Different Worlds — sim.js
   ---------------------------------------------------------------------
   A heavy iron ball (mass m) and a 10 g marble are dropped together
   from the same height h on the Moon, Mars, the Earth and Jupiter.
   There is no air (as in a vacuum), so each falls with that world's
     g = G M ÷ R²,   v = g t,   h = ½ g t²   →   t = √(2h ÷ g)
   Both balls land together on every world: g does not depend on the
   falling object's mass. Strobe ghosts every 0.25 s show the growing
   gaps. Under each lane a spring balance shows the weight W = m g,
   which changes from world to world while the mass m stays the same.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var G = 6.674e-11, STROBE = 0.25;
  // Jupiter: equatorial radius at the cloud tops (it has no solid surface)
  var WORLDS = [
    { id: 'moon', name: 'Moon', M: 7.35e22, R: 1.737e6, col: '#cbd5e1', ground: '#94a3b8' },
    { id: 'mars', name: 'Mars', M: 6.42e23, R: 3.39e6, col: '#f97316', ground: '#c2410c' },
    { id: 'earth', name: 'Earth', M: 5.97e24, R: 6.371e6, col: '#3b82f6', ground: '#15803d' },
    { id: 'jup', name: 'Jupiter', M: 1.898e27, R: 7.1492e7, col: '#f59e0b', ground: '#b45309' }
  ];
  WORLDS.forEach(function (w) { w.g = G * w.M / (w.R * w.R); });
  var EARTH_G = WORLDS[2].g;

  var xMaxV = 3;
  function tFall(h, w) { return Math.sqrt(2 * h / w.g); }

  SimLab.createSim({
    ariaLabel: 'Four lanes showing a heavy ball and a marble dropped from the same height on the Moon, Mars, the Earth and Jupiter, with a spring balance under each lane showing the weight of the ball',
    mobileAspect: '3 / 4',
    params: [
      { id: 'h', label: 'Drop height h', min: 5, max: 100, step: 5, value: 20, unit: 'm',
        presets: [{ label: '5 m', value: 5 }, { label: '20 m', value: 20 }, { label: '80 m', value: 80 }] },
      { id: 'm', label: 'Mass of the iron ball m', min: 1, max: 100, step: 1, value: 10, unit: 'kg',
        presets: [{ label: '1 kg', value: 1 }, { label: '10 kg', value: 10 }, { label: '60 kg', value: 60 }],
        help: 'The marble is always 10 g. Watch whether the heavy ball wins.' },
      { id: 'ghost', label: 'Show strobe positions every 0.25 s', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'tE', label: 'Fall time on the Earth', unit: 's', digits: 2, key: true },
      { id: 'tM', label: 'Fall time on the Moon', unit: 's', digits: 2 },
      { id: 'tR', label: 'Fall time on Mars', unit: 's', digits: 2 },
      { id: 'tJ', label: 'Fall time on Jupiter', unit: 's', digits: 2 },
      { id: 'vE', label: 'Landing speed on the Earth √(2gh)', unit: 'm/s', digits: 1 },
      { id: 'mass', label: 'Mass of the ball (same everywhere)', unit: 'kg', digits: 0 }
    ],
    graph: { title: 'Speed while falling: v = g t', yLabel: 'v (m/s)',
      xMax: function () { return xMaxV; },
      series: [{ label: 'Moon', color: '#94a3b8' }, { label: 'Mars', color: '#f97316' }, { label: 'Earth', color: '#3b82f6' }, { label: 'Jupiter', color: '#f59e0b' }] },
    onParam: function (sim, id) { return id === 'ghost'; },

    reset: function (sim) {
      xMaxV = Math.ceil(tFall(sim.p.h, WORLDS[0]) + 0.2);
      sim.state = { t: 0, lanes: WORLDS.map(function () { return { y: 0, v: 0, landed: false, tl: 0 }; }) };
    },
    update: function (sim, dt) {
      var st = sim.state, h = sim.p.h;
      st.t += dt;
      WORLDS.forEach(function (w, i) {
        var L = st.lanes[i];
        if (L.landed) return;
        L.v = w.g * st.t; L.y = 0.5 * w.g * st.t * st.t;
        if (L.y >= h) { L.landed = true; L.y = h; L.tl = tFall(h, w); L.v = Math.sqrt(2 * w.g * h); }
      });
    },
    finished: function (sim) { return sim.state.lanes.every(function (L) { return L.landed; }); },
    sample: function (sim) { return sim.state.lanes.map(function (L) { return L.v; }); },
    status: function (sim) {
      var st = sim.state, n = st.lanes.filter(function (L) { return L.landed; }).length;
      if (n === 4) return 'All landed. On each world the ball and the marble landed together.';
      if (st.t === 0) return 'Press Play to drop both balls on all four worlds';
      return (sim.running ? 'Falling' : 'Paused') + ' · t = ' + M.fmt(st.t, 2) + ' s · ' + n + ' of 4 landed';
    },
    readout: function (sim) {
      var h = sim.p.h;
      return { tE: tFall(h, WORLDS[2]), tM: tFall(h, WORLDS[0]), tR: tFall(h, WORLDS[1]), tJ: tFall(h, WORLDS[3]),
        vE: Math.sqrt(2 * WORLDS[2].g * h), mass: sim.p.m };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, st = sim.state, narrow = W < 560;
      D.clear(ctx, W, H, c.bg);
      var padL = narrow ? 30 : 44, colW = (W - padL - 6) / 4;
      var rBig = (narrow ? 4 : 5) + (narrow ? 2.2 : 3) * Math.cbrt(p.m), rSmall = narrow ? 3 : 3.5;
      var top = 80 + 2 * rBig, boxH = narrow ? 74 : 70, ground = H - boxH - 14;
      var scale = (ground - top) / p.h;

      // height ruler
      var step = p.h <= 20 ? 5 : p.h <= 50 ? 10 : 20;
      for (var hv = 0; hv <= p.h + 1e-9; hv += step) {
        var yy = top + hv * scale;
        D.line(ctx, padL - 5, yy, W - 6, yy, D.alpha(c.grid, 0.7), 1);
        D.text(ctx, hv + ' m', padL - 7, yy, { color: c.faint, size: narrow ? 9 : 10, align: 'right' });
      }
      D.text(ctx, 'fallen', 4, top - 14, { color: c.faint, size: 9.5 });

      WORLDS[0].col = c.light ? '#64748b' : '#cbd5e1';
      WORLDS.forEach(function (w, i) {
        var L = st.lanes[i], x0 = padL + i * colW, cx = x0 + colW / 2;
        // header
        D.text(ctx, w.name, cx, narrow ? 34 : 34, { color: w.col, size: narrow ? 12 : 14, weight: 700, align: 'center' });
        D.text(ctx, 'g = ' + M.fmt(w.g, w.g < 10 ? 2 : 1) + ' m/s²', cx, narrow ? 49 : 51, { color: c.muted, size: narrow ? 9.5 : 11, align: 'center' });
        if (i > 0) D.line(ctx, x0, 26, x0, H - 6, c.grid, 1);
        // ground
        D.roundRect(ctx, x0 + 4, ground, colW - 8, 8, 2, w.ground);
        // strobe ghosts
        var bx = cx - colW * 0.16, sx = cx + colW * 0.2;
        if (p.ghost) {
          for (var ts = STROBE; ts < st.t - 1e-9; ts += STROBE) {
            var yg = 0.5 * w.g * ts * ts;
            if (yg >= p.h) break;
            D.circle(ctx, bx, top + yg * scale - rBig, rBig, D.alpha(c.muted, 0.16));
          }
        }
        // the two balls (bottom of each ball sits on the fallen distance)
        var by = top + L.y * scale;
        D.circle(ctx, bx, by - rBig, rBig, '#64748b', '#1e293b', 1.5);
        D.circle(ctx, bx - rBig * 0.3, by - rBig - rBig * 0.3, rBig * 0.25, D.alpha('#fff', 0.5));
        D.circle(ctx, sx, by - rSmall, rSmall, '#22d3ee', '#0e7490', 1);
        if (st.t === 0) {
          D.text(ctx, p.m + ' kg', bx, top - rBig * 2 - 9, { color: c.faint, size: 9, align: 'center' });
          D.text(ctx, '10 g', sx + 2, top - 10, { color: c.faint, size: 9, align: 'center' });
        }
        if (L.landed) {
          D.text(ctx, M.fmt(L.tl, 2) + ' s', cx, ground - rBig * 2 - 14, { color: c.text, size: narrow ? 11 : 12.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85) });
        } else if (st.t > 0) {
          D.text(ctx, M.fmt(L.v, 1) + ' m/s', cx, Math.min(ground - 12, by + 12), { color: c.muted, size: narrow ? 9 : 10.5, align: 'center', bg: D.alpha(c.bg, 0.8) });
        }
        // spring balance box: weight W = m g
        var Wt = p.m * w.g, yb = ground + 14;
        D.roundRect(ctx, x0 + 4, yb, colW - 8, boxH - 6, 6, c.surface2, c.border, 1);
        D.text(ctx, 'weight', cx, yb + 11, { color: c.faint, size: 9.5, align: 'center' });
        D.text(ctx, M.fmt(Wt, Wt < 100 ? 1 : 0) + ' N', cx, yb + 27, { color: w.col, size: narrow ? 12 : 14, weight: 700, align: 'center' });
        D.text(ctx, 'mass ' + p.m + ' kg', cx, yb + 43, { color: c.muted, size: narrow ? 9 : 10.5, align: 'center' });
        var frac = M.clamp(Wt / (p.m * 26), 0, 1);
        D.roundRect(ctx, x0 + 10, yb + boxH - 18, colW - 20, 5, 2, D.alpha(c.muted, 0.2));
        D.roundRect(ctx, x0 + 10, yb + boxH - 18, (colW - 20) * frac, 5, 2, w.col);
      });

      var head = 'Same height, same start: the ' + p.m + ' kg ball and the 10 g marble land together';
      if (narrow) head = p.m + ' kg ball and 10 g marble land together';
      var hs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(head).width > W - 30) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, head, W / 2, 13, { color: c.bg, bg: c.s1, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
