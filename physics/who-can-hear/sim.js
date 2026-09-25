/* =====================================================================
   Sound Lab · Who Can Hear It? — sim.js
   ---------------------------------------------------------------------
   Different animals hear different ranges of frequency.
     • Infrasonic (infrasound): below 20 Hz — elephants, whales
     • Audible to humans:       20 Hz – 20,000 Hz (20 kHz)
     • Ultrasonic (ultrasound): above 20 kHz — dogs, bats, dolphins
   Approximate hearing ranges used here (they vary between sources):
     Human 20–20,000 Hz · Dog 67–45,000 Hz · Bat 2,000–110,000 Hz
     Elephant 14–12,000 Hz (and can sense ~5 Hz rumbles through the ground)
   The frequency slider is logarithmic so 1 Hz … 200 kHz all fit.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;

  var ANIMALS = [
    { name: 'Human', icon: '🧒', lo: 20, hi: 20000 },
    { name: 'Dog', icon: '🐕', lo: 67, hi: 45000 },
    { name: 'Bat', icon: '🦇', lo: 2000, hi: 110000 },
    { name: 'Elephant', icon: '🐘', lo: 5, hi: 12000 }
  ];
  var LOG_MIN = 0, LOG_MAX = Math.log10(200000);

  function fmtHz(f) {
    if (f >= 1000) return M.fmt(f / 1000, f >= 10000 ? 0 : 1) + ' kHz';
    return M.fmt(f, f < 10 ? 1 : 0) + ' Hz';
  }
  function freq(sim) { return Math.pow(10, sim.p.logf); }
  function band(f) { return f < 20 ? 'Infrasonic' : f <= 20000 ? 'Audible' : 'Ultrasonic'; }

  SimLab.createSim({
    ariaLabel: 'Hearing ranges of a human, dog, bat and elephant on a frequency scale with a movable marker',
    audio: true,
    mobileAspect: '4 / 4', // taller canvas on phones
    transport: false,
    params: [
      { id: 'logf', label: 'Frequency', min: 0, max: LOG_MAX, step: 0.01, value: Math.log10(1000),
        format: function (v) { return fmtHz(Math.pow(10, v)); },
        presets: [
          { label: 'Earthquake 5 Hz', value: Math.log10(5) }, { label: 'Elephant rumble 14 Hz', value: Math.log10(14) },
          { label: 'Voice 300 Hz', value: Math.log10(300) }, { label: 'Whistle 3 kHz', value: Math.log10(3000) },
          { label: 'Dog whistle 30 kHz', value: Math.log10(30000) }, { label: 'Bat call 60 kHz', value: Math.log10(60000) }] }
    ],
    buttonsTitle: 'Try it',
    buttons: [
      { label: '🔊 Play this tone', primary: true, onClick: function (sim) {
        var f = freq(sim);
        if (!A.enabled) { sim.toast('Switch “Sound on” at the top first'); return; }
        if (f < 20 || f > 20000) { sim.toast(band(f) + ' — humans can’t hear it, so you hear… nothing!'); return; }
        A.tone(f, { duration: 1.2, gain: f > 8000 ? 0.25 : 0.45, attack: 0.03 });
      } },
      { label: '🎲 Random frequency', onClick: function (sim) { sim.setParam('logf', +(Math.random() * LOG_MAX).toFixed(2), true); } }
    ],
    readouts: [
      { id: 'f', label: 'Frequency', key: true },
      { id: 'band', label: 'Type of sound', key: true },
      { id: 'who', label: 'Who can hear it?' }
    ],
    onParam: function () { return true; },
    reset: function (sim) { sim.state = {}; },

    readout: function (sim) {
      var f = freq(sim);
      var who = ANIMALS.filter(function (a) { return f >= a.lo && f <= a.hi; }).map(function (a) { return a.icon + ' ' + a.name; });
      return { f: fmtHz(f), band: band(f), who: who.length ? who.join(', ') : 'Nobody here!' };
    },
    status: function (sim) { return band(freq(sim)) + ' sound'; },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, f = freq(sim);
      D.clear(ctx, W, H, c.bg);
      var labelW = W < 520 ? 70 : 110, left = labelW + 10, right = W - 16, top = 44;
      var rowH = Math.min(64, (H - top - 90) / ANIMALS.length); // leave room for the axis, badge and hint
      function X(hz) { return left + (Math.log10(hz) - LOG_MIN) / (LOG_MAX - LOG_MIN) * (right - left); }
      var bottom = top + rowH * ANIMALS.length;

      // band shading
      [[1, 20, c.s2, 'INFRASONIC'], [20, 20000, c.s4, 'AUDIBLE (humans)'], [20000, 200000, c.s1, 'ULTRASONIC']].forEach(function (b) {
        ctx.fillStyle = D.alpha(b[2], 0.1); ctx.fillRect(X(b[0]), top - 10, X(b[1]) - X(b[0]), bottom - top + 20);
        D.text(ctx, b[3], (X(b[0]) + X(b[1])) / 2, top - 22, { color: b[2], size: W < 520 ? 9 : 11, weight: 700, align: 'center' });
      });
      // decade ticks
      [1, 10, 100, 1000, 10000, 100000].forEach(function (hz) {
        D.line(ctx, X(hz), top - 10, X(hz), bottom + 10, c.grid, 1);
        D.text(ctx, fmtHz(hz), X(hz), bottom + 22, { color: c.muted, size: 10, align: 'center' });
      });

      // animal rows
      ANIMALS.forEach(function (a, i) {
        var y = top + i * rowH + rowH / 2, can = f >= a.lo && f <= a.hi;
        D.text(ctx, a.icon, 10, y, { size: Math.min(28, rowH * 0.5) });
        if (W >= 520) D.text(ctx, a.name, 50, y, { color: c.ink, size: 13, weight: 600 });
        D.roundRect(ctx, X(a.lo), y - rowH * 0.2, X(a.hi) - X(a.lo), rowH * 0.4, rowH * 0.2, can ? c.success : D.alpha(c.muted, 0.35));
        D.text(ctx, can ? '✓' : '✗', right - 4, y, { color: can ? c.success : c.danger, size: 18, weight: 700, align: 'right' });
      });

      // frequency marker
      var fx = X(f);
      D.line(ctx, fx, top - 12, fx, bottom + 10, c.s3, 3);
      D.text(ctx, fmtHz(f), M.clamp(fx, 40, W - 40), bottom + 42, { color: c.bg, bg: c.s3, size: 13, weight: 700, align: 'center', pad: 6 });
      D.text(ctx, 'Drag on the chart to change frequency', W / 2, H - 10, { color: c.faint, size: 11, align: 'center' });
    },

    pointer: {
      hover: function () { return true; },
      down: function (sim, x) { setFromX(sim, x); return true; },
      move: function (sim, x) { setFromX(sim, x); }
    }
  });

  function setFromX(sim, x) {
    var W = sim.width, labelW = W < 520 ? 70 : 110, left = labelW + 10, right = W - 16;
    var v = M.clamp((x - left) / (right - left), 0, 1) * (LOG_MAX - LOG_MIN) + LOG_MIN;
    sim.setParam('logf', Math.round(v * 100) / 100);
  }
})();
