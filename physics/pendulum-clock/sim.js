/* =====================================================================
   Motion and time · Pendulum Clock Lab — sim.js
   ---------------------------------------------------------------------
   The Class 7 simple-pendulum experiment, done like a lab record:
   release the bob, time n oscillations with a stopwatch, and write
       time period  T = total time ÷ number of oscillations
   in an observation table. Each finished run adds a row, so students
   can compare lengths (T grows with length) and bob masses (no change).
   A pendulum clock "ticks" once per swing (half an oscillation); a
   string of about 0.99 m swings once every second (T ≈ 2 s).
   Motion uses the full pendulum equation θ'' = −(g/L)·sin θ (RK4), no
   air drag, so the mass truly has no effect. Angles stay ≤ 15°, where
   T differs from 2π√(L/g) by less than 0.5 %.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var g = 9.8, MAX_ROWS = 6;
  var BOB_R = { 20: 8, 50: 11, 100: 14 };
  var rows = []; // observation table; survives restarts until cleared

  SimLab.createSim({
    ariaLabel: 'A simple pendulum with a stopwatch and an observation table of string length, bob mass and time period',
    audio: true,
    mobileAspect: '3 / 4',
    playLabel: 'Release & time',
    params: [
      { id: 'length', label: 'String length (L)', min: 0.25, max: 2, step: 0.01, value: 0.5, unit: 'm',
        presets: [{ label: '25 cm', value: 0.25 }, { label: '50 cm', value: 0.5 }, { label: '1 m', value: 1 },
          { label: 'Seconds pendulum', value: 0.99 }, { label: '2 m', value: 2 }] },
      { id: 'mass', label: 'Bob', type: 'select', value: 50, options: [
        { value: 20, label: 'Small bob (20 g)' }, { value: 50, label: 'Medium bob (50 g)' }, { value: 100, label: 'Big bob (100 g)' }] },
      { id: 'angle', label: 'Pull aside by', min: 4, max: 15, step: 1, value: 8, unit: '°',
        help: 'Keep the swing small, as in the school experiment.' },
      { id: 'target', label: 'Time how many oscillations?', type: 'select', value: 10, options: [
        { value: 5, label: '5 oscillations' }, { value: 10, label: '10 oscillations' }, { value: 20, label: '20 oscillations' }] }
    ],
    buttonsTitle: 'Observation table',
    buttons: [{ label: '🗑 Clear table', onClick: function (sim) { rows = []; sim.toast('Table cleared'); } }],
    readouts: [
      { id: 't', label: 'Stopwatch', unit: 's', digits: 2, key: true },
      { id: 'n', label: 'Oscillations counted', digits: 0 },
      { id: 'T', label: 'Time period T = t ÷ n', unit: 's', digits: 2, key: true },
      { id: 'swing', label: 'One swing (one tick) = T ÷ 2', unit: 's', digits: 2 },
      { id: 'Tf', label: 'Formula check 2π√(L/g)', unit: 's', digits: 2 }
    ],

    reset: function (sim) {
      sim.state = { th: M.rad(sim.p.angle), om: 0, halves: 0, tick: -1 };
    },
    update: function (sim, dt) {
      var s = sim.state, L = sim.p.length, prev = s.om;
      var y = M.rk4([s.th, s.om], function (v) { return [v[1], -(g / L) * Math.sin(v[0])]; }, dt);
      s.th = y[0]; s.om = y[1];
      if (prev !== 0 && Math.sign(prev) !== Math.sign(s.om)) { // reached an extreme: one swing = one tick
        s.halves++; s.tick = sim.time + dt;
        A.tone(s.halves % 2 ? 1200 : 900, { duration: 0.04, gain: 0.2 });
      }
    },
    finished: function (sim) { return Math.floor(sim.state.halves / 2) >= sim.p.target; },
    onFinish: function (sim) {
      var n = sim.p.target, t = sim.time;
      rows.push({ L: sim.p.length, m: sim.p.mass, n: n, t: t, T: t / n });
      if (rows.length > MAX_ROWS) rows.shift();
      A.tone(1320, { duration: 0.3, gain: 0.35 });
      sim.toast('Recorded: T = ' + M.fmt(t, 2) + ' ÷ ' + n + ' = ' + M.fmt(t / n, 2) + ' s');
    },
    status: function (sim) {
      var n = Math.floor(sim.state.halves / 2);
      if (sim.time === 0) return 'Ready · press “Release & time”';
      return (sim.running ? 'Timing…' : n >= sim.p.target ? 'Done, row added to the table' : 'Paused') + ' · ' + n + ' of ' + sim.p.target + ' oscillations';
    },
    readout: function (sim) {
      var n = Math.floor(sim.state.halves / 2), t = sim.time;
      return { t: t, n: n, T: n ? t / n : null, swing: n ? t / n / 2 : null, Tf: 2 * Math.PI * Math.sqrt(sim.p.length / g) };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      var wide = W >= 560;
      var pw = wide ? W * 0.44 : W, ph = wide ? H : H * 0.55;
      var px = pw / 2, py = 34;
      var scale = (ph - py - 40) / Math.max(sim.p.length, 1), // up to 1 m drawn to the same scale; longer strings fill the height
        Lpx = sim.p.length * scale, a0 = M.rad(sim.p.angle);
      var br = BOB_R[sim.p.mass] || 11;

      // stand and clamp
      D.roundRect(ctx, px - 70, py - 14, 140, 9, 3, c.muted);
      D.roundRect(ctx, px - 7, py - 8, 14, 10, 2, c.faint);
      // extremes and mean position
      [-a0, 0, a0].forEach(function (a, i) {
        D.line(ctx, px, py, px + Lpx * Math.sin(a), py + Lpx * Math.cos(a), D.alpha(i === 1 ? c.s4 : c.s3, 0.45), 1, [4, 5]);
      });
      D.text(ctx, 'A', px - Lpx * Math.sin(a0) - br - 8, py + Lpx * Math.cos(a0), { color: c.s3, size: 12, weight: 700, align: 'center' });
      D.text(ctx, 'B', px + Lpx * Math.sin(a0) + br + 8, py + Lpx * Math.cos(a0), { color: c.s3, size: 12, weight: 700, align: 'center' });
      D.text(ctx, 'O', px, py + Lpx + br + 12, { color: c.s4, size: 12, weight: 700, align: 'center' });

      // length dimension on the left
      var dx = Math.max(16, px - Lpx * Math.sin(a0) - br - 30);
      D.line(ctx, dx, py, dx, py + Lpx, c.axis, 1);
      D.line(ctx, dx - 5, py, dx + 5, py, c.axis, 1);
      D.line(ctx, dx - 5, py + Lpx, dx + 5, py + Lpx, c.axis, 1);
      D.text(ctx, 'L = ' + M.fmt(sim.p.length, 2) + ' m', dx, py + Lpx / 2, { color: c.ink, size: 11, weight: 700, align: 'center', bg: c.bg, pad: 3, fit: W });

      // pendulum
      var bx = px + Lpx * Math.sin(s.th), by = py + Lpx * Math.cos(s.th);
      D.line(ctx, px, py, bx, by, c.ink, 1.5);
      D.circle(ctx, px, py, 3.5, c.ink);
      D.circle(ctx, bx, by, br, c.accent, c.bg, 2);
      D.text(ctx, sim.p.mass + ' g', bx + br + 6, by - br, { color: c.muted, size: 10 });

      // tick flash (one tick per swing, like a pendulum clock)
      var since = sim.time - s.tick;
      if (s.tick >= 0 && since < 0.3) {
        D.text(ctx, s.halves % 2 ? 'tick' : 'tock', px + 50, py + 14, { color: D.alpha(c.warning, 1 - since / 0.3), size: 14, weight: 700 });
      }

      // stopwatch + counter
      var n = Math.floor(s.halves / 2);
      D.text(ctx, '⏱ ' + M.fmt(sim.time, 2) + ' s', 10, 14, { color: c.ink, size: 14, weight: 700, font: c.mono });
      D.text(ctx, n + ' / ' + sim.p.target, pw - 10, 14, { color: c.accent, size: 15, weight: 700, align: 'right' });

      table(ctx, c, wide ? pw + 8 : 8, wide ? 24 : ph + 8, wide ? W - pw - 18 : W - 16, wide ? H - 36 : H - ph - 14, wide);
    }
  });

  function table(ctx, c, x, y, w, h, wide) {
    D.roundRect(ctx, x, y, w, h, 10, D.alpha(c.muted, 0.08), D.alpha(c.muted, 0.25), 1);
    var fs = wide ? 13 : 11, rh = wide ? 28 : Math.min(22, (h - 60) / (MAX_ROWS + 1));
    D.text(ctx, 'Observation table', x + 12, y + 16, { color: c.ink, size: fs + 1, weight: 700 });
    var cols = [['#', 0.08], ['Length', 0.22], ['Bob', 0.16], ['Time for n', 0.3], ['T (s)', 0.24]];
    var cx = [], acc = x + 10;
    cols.forEach(function (col) { cx.push(acc); acc += (w - 20) * col[1]; });
    var hy = y + 20 + rh;
    cols.forEach(function (col, i) { D.text(ctx, col[0], cx[i], hy, { color: c.muted, size: fs - 1, weight: 700 }); });
    D.line(ctx, x + 8, hy + rh / 2, x + w - 8, hy + rh / 2, D.alpha(c.muted, 0.35), 1);
    if (!rows.length) {
      D.text(ctx, 'Press “Release & time”. Each run adds a row.', x + w / 2, hy + rh * 1.5, { color: c.faint, size: fs - 1, align: 'center', fit: x + w });
    }
    rows.forEach(function (r, k) {
      var ry = hy + rh * (k + 1), last = k === rows.length - 1;
      if (last) D.roundRect(ctx, x + 6, ry - rh / 2 + 1, w - 12, rh - 2, 5, D.alpha(c.accent, 0.14));
      var cells = [String(k + 1), M.fmt(r.L, 2) + ' m', r.m + ' g', M.fmt(r.t, 2) + ' s ÷ ' + r.n, M.fmt(r.T, 2)];
      cells.forEach(function (txt, i) {
        D.text(ctx, txt, cx[i], ry, { color: i === 4 ? c.s3 : c.ink, size: fs, weight: i === 4 ? 700 : 500, font: i ? c.mono : undefined });
      });
    });
    var note = findPattern(), ny = hy + rh * (MAX_ROWS + 1) + 4;
    if (note && ny < y + h - 6) D.text(ctx, note, x + 12, Math.min(ny, y + h - 12), { color: c.success, size: fs - 1, weight: 600, fit: x + w });
  }

  // Tell the student what their own table shows.
  function findPattern() {
    for (var i = 0; i < rows.length; i++) for (var j = i + 1; j < rows.length; j++) {
      var a = rows[i], b = rows[j];
      if (Math.abs(a.L - b.L) < 1e-6 && a.m !== b.m) return '✓ Same length, different bob → same T';
    }
    for (i = 0; i < rows.length; i++) for (j = i + 1; j < rows.length; j++) {
      if (Math.abs(rows[i].L - rows[j].L) > 0.05) return '✓ Longer string → longer time period';
    }
    return rows.length ? 'Now change the length or the bob and run again' : '';
  }
})();
