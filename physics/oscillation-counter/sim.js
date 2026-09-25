/* =====================================================================
   Sound Lab · Oscillation Counter — sim.js
   ---------------------------------------------------------------------
   The classic class activity: pull a pendulum aside, release it, start
   a stopwatch and count oscillations. One oscillation = the bob goes
   from one extreme to the other and back again.
       Time period  T = total time ÷ number of oscillations
       Frequency    f = number of oscillations ÷ total time = 1 / T
   The swing uses the real pendulum equation (no damping here so that
   counting is easy). Students can count by tapping or let it auto-count.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var g = 9.81;

  SimLab.createSim({
    ariaLabel: 'A pendulum swinging next to a stopwatch and an oscillation counter',
    audio: true,
    playLabel: 'Release & start',
    params: [
      { id: 'length', label: 'String length', min: 0.1, max: 2.5, step: 0.05, value: 1, unit: 'm' },
      { id: 'angle', label: 'Pull aside by', min: 3, max: 20, step: 1, value: 10, unit: '°' },
      { id: 'target', label: 'Stop after', min: 5, max: 30, step: 1, value: 10, unit: 'oscillations' },
      { id: 'mode', label: 'Counting', type: 'select', value: 'auto', options: [
        { value: 'auto', label: 'Automatic counting' }, { value: 'tap', label: 'I will count (tap button)' }] }
    ],
    buttonsTitle: 'Count',
    buttons: [{ label: '👆 Tap: +1 oscillation', primary: true, full: true, onClick: function (sim) {
      if (sim.p.mode !== 'tap' || !sim.running) { sim.toast(sim.p.mode === 'tap' ? 'Press “Release & start” first' : 'Switch Counting to “I will count” first'); return; }
      sim.state.taps++; A.tone(880, { duration: 0.08, gain: 0.3 });
    } }],
    readouts: [
      { id: 'n', label: 'Oscillations', digits: 0, key: true },
      { id: 't', label: 'Stopwatch', unit: 's', digits: 2, key: true },
      { id: 'T', label: 'Time period T = t ÷ n', unit: 's', digits: 2 },
      { id: 'f', label: 'Frequency f = n ÷ t', unit: 'Hz', digits: 2 },
      { id: 'Tth', label: 'Expected T (2π√(L/g))', unit: 's', digits: 2 }
    ],

    reset: function (sim) {
      sim.state = { th: M.rad(sim.p.angle), om: 0, count: 0, halves: 0, taps: 0, lastSign: 0 };
    },
    update: function (sim, dt) {
      var s = sim.state, L = sim.p.length;
      var prev = s.om;
      var y = M.rk4([s.th, s.om], function (v) { return [v[1], -(g / L) * Math.sin(v[0])]; }, dt);
      s.th = y[0]; s.om = y[1];
      // a turning point (extreme position) happens when ω changes sign
      if (prev !== 0 && Math.sign(prev) !== Math.sign(s.om)) {
        s.halves++;
        if (s.halves % 2 === 0) { s.count++; if (sim.p.mode === 'auto') A.tone(660, { duration: 0.06, gain: 0.25 }); }
      }
    },
    finished: function (sim) { return counted(sim) >= sim.p.target; },
    onFinish: function (sim) { A.tone(1320, { duration: 0.4, gain: 0.4 }); sim.toast('Done! T = ' + M.fmt(sim.time / counted(sim), 2) + ' s'); },

    readout: function (sim) {
      var n = counted(sim), t = sim.time;
      return { n: n, t: t, T: n ? t / n : null, f: t > 0 && n ? n / t : null, Tth: 2 * Math.PI * Math.sqrt(sim.p.length / g) };
    },
    status: function (sim) { return sim.time === 0 ? 'Ready' : sim.running ? 'Counting…' : 'Stopped'; },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      var wide = W > 520;
      var px = wide ? W * 0.36 : W / 2, py = 28;
      var scale = (H - py - 50) / 2.6, L = sim.p.length * scale;
      var a0 = M.rad(sim.p.angle);

      // stand
      D.roundRect(ctx, px - 60, py - 10, 120, 8, 3, c.muted);
      // extreme & mean positions
      [-a0, 0, a0].forEach(function (a, i) {
        D.line(ctx, px, py, px + L * Math.sin(a), py + L * Math.cos(a), D.alpha(i === 1 ? c.s4 : c.s3, 0.5), 1, [4, 5]);
      });
      D.text(ctx, 'A', px - L * Math.sin(a0) - 12, py + L * Math.cos(a0) + 16, { color: c.s3, size: 12, weight: 700, align: 'center' });
      D.text(ctx, 'O', px, py + L + 30, { color: c.s4, size: 12, weight: 700, align: 'center' });
      D.text(ctx, 'B', px + L * Math.sin(a0) + 12, py + L * Math.cos(a0) + 16, { color: c.s3, size: 12, weight: 700, align: 'center' });

      var bx = px + L * Math.sin(s.th), by = py + L * Math.cos(s.th);
      D.line(ctx, px, py, bx, by, c.ink, 2);
      D.circle(ctx, px, py, 4, c.ink);
      D.circle(ctx, bx, by, 13, c.accent, c.bg, 2);

      // stopwatch
      var sx = wide ? W * 0.78 : W - 60, sy = wide ? H * 0.38 : 64, sr = wide ? Math.min(80, W * 0.12) : 42;
      D.circle(ctx, sx, sy, sr, c.surface2, c.border, 3);
      D.roundRect(ctx, sx - 8, sy - sr - 12, 16, 12, 3, c.muted);
      var ang = (sim.time % 60) / 60 * Math.PI * 2 - Math.PI / 2;
      for (var i = 0; i < 12; i++) { var q = i / 12 * Math.PI * 2; D.line(ctx, sx + Math.cos(q) * sr * 0.82, sy + Math.sin(q) * sr * 0.82, sx + Math.cos(q) * sr * 0.95, sy + Math.sin(q) * sr * 0.95, c.muted, 2); }
      D.line(ctx, sx, sy, sx + Math.cos(ang) * sr * 0.8, sy + Math.sin(ang) * sr * 0.8, c.danger, 2.5);
      D.circle(ctx, sx, sy, 4, c.danger);
      D.text(ctx, M.fmt(sim.time, 2) + ' s', sx, sy + sr * 0.45, { color: c.ink, size: wide ? 16 : 11, weight: 700, align: 'center', font: c.mono });

      // counter + working
      var n = counted(sim);
      if (wide) {
        D.text(ctx, String(n), sx, sy + sr + 50, { color: c.accent, size: 44, weight: 700, align: 'center' });
        D.text(ctx, 'oscillations (target ' + sim.p.target + ')', sx, sy + sr + 82, { color: c.muted, size: 12, align: 'center' });
        if (n > 0) D.text(ctx, 'T = ' + M.fmt(sim.time, 2) + ' ÷ ' + n + ' = ' + M.fmt(sim.time / n, 2) + ' s', sx, sy + sr + 110, { color: c.s3, size: 13, weight: 600, align: 'center', font: c.mono });
      } else {
        D.text(ctx, n + ' / ' + sim.p.target, 12, 20, { color: c.accent, size: 18, weight: 700 });
      }
      D.text(ctx, 'One oscillation: A → B → A', wide ? px : W / 2, H - 14, { color: c.faint, size: 12, align: 'center' });
    }
  });

  function counted(sim) { return sim.p.mode === 'tap' ? sim.state.taps : sim.state.count; }
})();
