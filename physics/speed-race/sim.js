/* =====================================================================
   Speed Race — sim.js
   ---------------------------------------------------------------------
   Two racers run the same straight track at steady (uniform) speeds.
       speed (m/s) = speed (km/h) × 1000 / 3600 = km/h × 5/18
       time to finish = distance ÷ speed
   Positions are exact: x = v·t (no integration error). Slow races are
   fast-forwarded by a round factor so they finish in about 10 s on
   screen; the stopwatch always shows the real race time.
   The distance–time graph is pushed by hand in race time.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SPEEDS = [{ label: 'Walk', value: 5 }, { label: 'Cycle', value: 15 }, { label: 'Auto', value: 40 },
    { label: 'Car', value: 60 }, { label: 'Cheetah', value: 100 }];
  var FF = [1, 2, 5, 10, 20, 50, 100, 200];
  var xMax = 1; // graph x-axis length = the slower racer's finish time

  function ms(kmh) { return kmh * 5 / 18; }
  function plan(p) {
    var va = ms(p.speedA), vb = ms(p.speedB);
    var ta = p.track / va, tb = p.track / vb, slow = Math.max(ta, tb);
    var ff = FF.filter(function (f) { return slow / f <= 12; })[0] || 200;
    return { va: va, vb: vb, ta: ta, tb: tb, slow: slow, ff: ff };
  }

  SimLab.createSim({
    ariaLabel: 'Two racers, A and B, moving along a straight two-lane track towards a finish line, with a stopwatch',
    playLabel: 'Start race',
    params: [
      { id: 'track', label: 'Track length', min: 50, max: 1000, step: 10, value: 200, unit: 'm',
        presets: [{ label: '100 m', value: 100 }, { label: '400 m', value: 400 }, { label: '1 km', value: 1000 }] },
      { id: 'speedA', label: 'Speed of racer A', min: 2, max: 120, step: 1, value: 15, unit: 'km/h', presets: SPEEDS },
      { id: 'speedB', label: 'Speed of racer B', min: 2, max: 120, step: 1, value: 40, unit: 'km/h', presets: SPEEDS,
        help: 'The sliders use km/h like a speedometer. The readouts convert to m/s, the SI unit.' }
    ],
    readouts: [
      { id: 'clock', label: 'Stopwatch', unit: 's', digits: 1 },
      { id: 'vaMs', label: 'Speed A', unit: 'm/s', digits: 2 },
      { id: 'vbMs', label: 'Speed B', unit: 'm/s', digits: 2 },
      { id: 'da', label: 'Distance A', unit: 'm', digits: 0 },
      { id: 'db', label: 'Distance B', unit: 'm', digits: 0 },
      { id: 'ta', label: 'Time A = d ÷ v', unit: 's', digits: 1, key: true },
      { id: 'tb', label: 'Time B = d ÷ v', unit: 's', digits: 1, key: true },
      { id: 'result', label: 'Result' }
    ],
    graph: {
      title: 'Distance–time graph', yLabel: 'distance (m)', xLabel: 'race time (s)',
      series: [{ label: 'Racer A', color: '--sim-1' }, { label: 'Racer B', color: '--sim-2' }],
      window: null, xMax: function () { return xMax; }
    },

    reset: function (sim) {
      var pl = plan(sim.p);
      sim.state = { pl: pl, t: 0, acc: 0 };
      xMax = pl.slow;
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [0, 0]); }
    },

    update: function (sim, dt) {
      var s = sim.state, pl = s.pl;
      var step = dt * pl.ff;
      s.t = Math.min(s.t + step, pl.slow);
      s.acc += dt;
      if (sim.graph && (s.acc >= 1 / 30 || s.t >= pl.slow)) {
        s.acc = 0;
        sim.graph.push(s.t, [Math.min(pl.va * s.t, sim.p.track), Math.min(pl.vb * s.t, sim.p.track)]);
      }
    },
    finished: function (sim) { return sim.state.t >= sim.state.pl.slow - 1e-9; },

    status: function (sim) {
      var s = sim.state;
      return (sim.running ? 'Racing' : s.t > 0 ? (s.t >= s.pl.slow ? 'Finished' : 'Paused') : 'Ready') +
        ' · race time ' + M.fmt(s.t, 1) + ' s' + (s.pl.ff > 1 ? ' · fast-forward ×' + s.pl.ff : '');
    },

    readout: function (sim) {
      var s = sim.state, pl = s.pl, d = sim.p.track, res;
      var da = Math.min(pl.va * s.t, d), db = Math.min(pl.vb * s.t, d);
      if (Math.abs(pl.ta - pl.tb) < 1e-9) res = 'Tie!';
      else {
        var w = pl.ta < pl.tb ? 'A' : 'B';
        res = s.t >= Math.min(pl.ta, pl.tb) ? w + ' wins by ' + M.fmt(Math.abs(pl.ta - pl.tb), 1) + ' s' : (s.t > 0 ? 'Racing…' : '—');
      }
      return { clock: s.t, vaMs: pl.va, vbMs: pl.vb, da: da, db: db, ta: pl.ta, tb: pl.tb, result: res };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, pl = s.pl, d = sim.p.track;
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560;
      var x0 = narrow ? 46 : 64, x1 = W - (narrow ? 26 : 50);
      var laneH = Math.min(narrow ? 70 : 84, H * 0.2), top = H * 0.5 - laneH - 6;
      var sx = (x1 - x0) / d;

      // stopwatch
      var cx = W / 2, cy = Math.max(38, top - 42), r = Math.min(26, top / 2 - 8);
      D.circle(ctx, cx, cy, r, c.surface2, c.border, 2);
      var frac = (s.t % 60) / 60 * Math.PI * 2;
      D.line(ctx, cx, cy, cx + Math.sin(frac) * (r - 6), cy - Math.cos(frac) * (r - 6), c.s3, 2.5);
      D.circle(ctx, cx, cy, 3, c.ink);
      D.text(ctx, M.fmt(s.t, 1) + ' s', cx + r + 10, cy, { color: c.ink, size: 16, weight: 700, font: c.mono });
      if (pl.ff > 1) D.text(ctx, '⏩ ×' + pl.ff, cx - r - 10, cy, { color: c.muted, size: 12, weight: 600, align: 'right' });

      // lanes
      [['A', pl.va, pl.ta, c.s1], ['B', pl.vb, pl.tb, c.s2]].forEach(function (L, i) {
        var y = top + i * (laneH + 12);
        D.roundRect(ctx, x0 - 40, y, x1 - x0 + 56, laneH, 8, D.alpha(c.muted, 0.12));
        D.line(ctx, x0, y + laneH - 8, x1, y + laneH - 8, D.alpha(c.muted, 0.35), 1, [6, 6]);
        var dist = Math.min(L[1] * s.t, d), px = x0 + dist * sx, cyv = y + laneH / 2;
        // trail
        D.line(ctx, x0, cyv + 8, px, cyv + 8, D.alpha(L[3], 0.35), 4);
        var vr = Math.min(16, laneH * 0.26);
        vehicle(ctx, px - vr * 0.6, cyv, vr, L[3], L[0], c); // front bumper sits at the racer's position
        if (s.t >= L[2] - 1e-9) {
          D.text(ctx, 'finished in ' + M.fmt(L[2], 1) + ' s', x0 + 8, y + 11, { color: L[3], size: 12, weight: 700 });
        }
      });

      // start + finish lines
      var yT = top - 4, yB = top + 2 * laneH + 16;
      D.line(ctx, x0, yT, x0, yB, c.ink, 2);
      for (var k = 0; k < (yB - yT) / 8; k++) {
        ctx.fillStyle = k % 2 ? c.ink : c.bg;
        ctx.fillRect(x1, yT + k * 8, 6, Math.min(8, yB - yT - k * 8));
      }
      D.text(ctx, 'START', x0, yT - 10, { color: c.muted, size: 10, weight: 700, align: 'center' });
      D.text(ctx, 'FINISH', x1 + 3, yT - 10, { color: c.muted, size: 10, weight: 700, align: 'center', fit: W });

      // distance scale
      var ys = yB + 18, step = D.niceStep(d, narrow ? 4 : 8);
      D.line(ctx, x0, ys, x1, ys, c.axis, 1);
      for (var m = 0; m <= d + 1e-9; m += step) {
        var xx = x0 + m * sx;
        D.line(ctx, xx, ys - 4, xx, ys + 4, c.axis, 1);
        if (x1 - xx > 30) D.text(ctx, M.fmt(m, 0), xx, ys + 14, { color: c.muted, size: 11, align: 'center', font: c.mono });
      }
      D.text(ctx, M.fmt(d, 0) + ' m', x1, ys + 14, { color: c.ink, size: 11, weight: 700, align: 'center', fit: W });

      // speed comparison note
      var yn = ys + 40;
      if (yn < H - 8) {
        var txt = 'A: ' + sim.p.speedA + ' km/h = ' + M.fmt(pl.va, 2) + ' m/s   ·   B: ' + sim.p.speedB + ' km/h = ' + M.fmt(pl.vb, 2) + ' m/s';
        D.text(ctx, txt, W / 2, yn, { color: c.muted, size: narrow ? 11 : 13, align: 'center', fit: W });
      }
      if (!sim.running && s.t === 0 && yn + 24 < H - 6) D.text(ctx, 'Press “Start race”', W / 2, yn + 24, { color: c.faint, size: 12, align: 'center' });
    }
  });

  // A small side-view vehicle token with a letter.
  function vehicle(ctx, x, y, r, col, letter, c) {
    D.roundRect(ctx, x - r * 1.6, y - r * 0.8, r * 2.2, r * 1.2, r * 0.4, col);
    D.roundRect(ctx, x - r * 1.1, y - r * 1.25, r * 1.2, r * 0.6, r * 0.25, D.alpha(col, 0.75));
    D.circle(ctx, x - r * 1.05, y + r * 0.45, r * 0.38, c.ink);
    D.circle(ctx, x + r * 0.25, y + r * 0.45, r * 0.38, c.ink);
    D.text(ctx, letter, x - r * 0.5, y - r * 0.2, { color: '#fff', size: Math.round(r * 0.9), weight: 800, align: 'center' });
  }
})();
