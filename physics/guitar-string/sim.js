/* =====================================================================
   Sound Lab · Guitar String — sim.js
   ---------------------------------------------------------------------
   A plucked string vibrates at its natural frequency
       f = (1 / 2L) · √(T / μ)
     L = vibrating length (m)     — press a fret to shorten it
     T = tension (N)              — turn the tuning peg to tighten it
     μ = mass per metre (kg/m)    — thicker strings are heavier
   Shorter, tighter or thinner → HIGHER pitch.
   Longer, looser or thicker  → LOWER pitch.
   The picture shows the fundamental plus a few overtones dying away
   (slowed down enormously so you can see it).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  // thickness → diameter (mm) and linear density μ (kg/m) for steel-ish strings
  var GAUGES = {
    thin:   { label: 'Thin (0.25 mm)', d: 0.25, mu: 0.00040 },
    medium: { label: 'Medium (0.45 mm)', d: 0.45, mu: 0.00125 },
    thick:  { label: 'Thick (0.8 mm)', d: 0.8, mu: 0.0040 },
    xthick: { label: 'Very thick (1.2 mm)', d: 1.2, mu: 0.0090 }
  };

  function freq(p) { return 1 / (2 * p.length) * Math.sqrt(p.tension / GAUGES[p.gauge].mu); }
  function noteName(f) {
    var n = Math.round(12 * Math.log2(f / 440)) + 57;
    return NAMES[((n % 12) + 12) % 12] + Math.floor(n / 12);
  }

  SimLab.createSim({
    ariaLabel: 'A guitar string stretched between a nut and a bridge, vibrating when plucked',
    audio: true,
    transport: false,
    params: [
      { id: 'length', label: 'Vibrating length (press a fret)', min: 0.2, max: 0.65, step: 0.01, value: 0.65, unit: 'm' },
      { id: 'gauge', label: 'Thickness', type: 'select', value: 'medium', options: Object.keys(GAUGES).map(function (k) { return { value: k, label: GAUGES[k].label }; }) },
      { id: 'tension', label: 'Tightness (tension)', min: 20, max: 150, step: 1, value: 70, unit: 'N' }
    ],
    buttonsTitle: 'Play',
    buttons: [
      { label: '🎸 Pluck!', primary: true, full: true, onClick: function (sim) { pluck(sim); } },
      { label: '🎼 Tune to G3 (196 Hz)', onClick: function (sim) { tuneTo(sim, 196); } },
      { label: '🎼 Tune to A3 (220 Hz)', onClick: function (sim) { tuneTo(sim, 220); } }
    ],
    readouts: [
      { id: 'f', label: 'Frequency', unit: 'Hz', digits: 0, key: true },
      { id: 'note', label: 'Note', key: true },
      { id: 'v', label: 'Wave speed on string', unit: 'm/s', digits: 0 },
      { id: 'pitch', label: 'Pitch' }
    ],
    onParam: function () { return true; },
    reset: function (sim) { sim.state = { energy: 0, t0: 0 }; },

    readout: function (sim) {
      var f = freq(sim.p);
      return { f: f, note: noteName(f), v: Math.sqrt(sim.p.tension / GAUGES[sim.p.gauge].mu), pitch: f < 150 ? 'Low' : f < 400 ? 'Medium' : 'High' };
    },
    status: function (sim) { return 'f = ' + Math.round(freq(sim.p)) + ' Hz · ' + noteName(freq(sim.p)); },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, p = sim.p;
      D.clear(ctx, W, H, c.bg);
      var t = ((now || 0) - s.t0) / 1000;
      var e = s.energy * Math.exp(-t * 1.2);
      if (e < 0.01) s.energy = 0;
      var cy = H * 0.5, nutX = 40, bridgeFull = W - 50;
      var scaleLen = (bridgeFull - nutX) / 0.65;
      var fretX = bridgeFull - p.length * scaleLen;            // finger position

      // neck & frets
      D.roundRect(ctx, nutX - 10, cy - 46, bridgeFull - nutX + 20, 92, 10, D.alpha(c.s3, c.light ? 0.3 : 0.18));
      for (var n = 1; n <= 12; n++) {
        var fx = bridgeFull - (bridgeFull - nutX) / Math.pow(2, n / 12);
        D.line(ctx, fx, cy - 44, fx, cy + 44, D.alpha(c.muted, 0.6), 2);
        if ([3, 5, 7, 9, 12].indexOf(n) !== -1) D.circle(ctx, fx - ((bridgeFull - nutX) / Math.pow(2, n / 12) - (bridgeFull - nutX) / Math.pow(2, (n - 1) / 12)) / 2, cy + 30, 4, D.alpha(c.muted, 0.6));
      }
      D.roundRect(ctx, nutX - 6, cy - 48, 8, 96, 2, c.ink);          // nut
      D.roundRect(ctx, bridgeFull - 2, cy - 48, 10, 96, 2, c.ink);   // bridge
      // tuning peg shows tension
      var pegA = (p.tension - 20) / 130 * Math.PI * 1.5;
      D.circle(ctx, 18, cy, 12, c.surface2, c.border, 2);
      D.line(ctx, 18, cy, 18 + Math.cos(pegA) * 10, cy + Math.sin(pegA) * 10, c.ink, 3);

      // the string: straight part (nut→finger) + vibrating part (finger→bridge)
      var thick = 1 + GAUGES[p.gauge].d * 3;
      D.line(ctx, nutX, cy, fretX, cy, c.faint, thick);
      var visF = 1.5 + freq(p) / 200;                                // slowed visual frequency
      ctx.strokeStyle = c.accent; ctx.lineWidth = thick; ctx.lineCap = 'round';
      ctx.beginPath();
      for (var x = fretX; x <= bridgeFull; x += 2) {
        var u = (x - fretX) / (bridgeFull - fretX), y = 0;
        [1, 0.35, 0.15].forEach(function (a, k) {
          y += a * Math.sin((k + 1) * Math.PI * u) * Math.cos(2 * Math.PI * visF * (k + 1) * t);
        });
        y *= e * 36;
        x === fretX ? ctx.moveTo(x, cy + y) : ctx.lineTo(x, cy + y);
      }
      ctx.stroke();
      // envelope ghost (shows the loop shape)
      if (e > 0.02) {
        D.curve(ctx, function (x) { return cy - e * 36 * Math.sin(Math.PI * (x - fretX) / (bridgeFull - fretX)); }, fretX, bridgeFull, D.alpha(c.accent, 0.25), 1);
        D.curve(ctx, function (x) { return cy + e * 36 * Math.sin(Math.PI * (x - fretX) / (bridgeFull - fretX)); }, fretX, bridgeFull, D.alpha(c.accent, 0.25), 1);
      }
      // finger
      if (p.length < 0.645) D.text(ctx, '👆', fretX, cy - 58, { size: 26, align: 'center' });

      // length dimension
      D.arrow(ctx, (fretX + bridgeFull) / 2, cy + 66, fretX, cy + 66, c.s3, 1.5, 7);
      D.arrow(ctx, (fretX + bridgeFull) / 2, cy + 66, bridgeFull, cy + 66, c.s3, 1.5, 7);
      D.text(ctx, 'L = ' + M.fmt(p.length * 100, 0) + ' cm', (fretX + bridgeFull) / 2, cy + 82, { color: c.s3, size: 12, weight: 600, align: 'center' });
      D.text(ctx, 'T = ' + p.tension + ' N', 6, cy - 60, { color: c.muted, size: 11 });
      D.text(ctx, Math.round(freq(p)) + ' Hz · ' + noteName(freq(p)), W / 2, 26, { color: c.ink, size: 20, weight: 700, align: 'center' });
      D.text(ctx, 'Tap the string to pluck · drag along the neck to move your finger', W / 2, H - 12, { color: c.faint, size: 11, align: 'center' });
    },
    animate: function (sim) { return sim.state.energy > 0; },

    pointer: {
      hover: function (sim, x, y) { return Math.abs(y - sim.height * 0.5) < 60; },
      down: function (sim, x, y) {
        if (Math.abs(y - sim.height * 0.5) > 60) return false;
        sim.state.downX = x; sim.state.slid = false;
        return true;
      },
      move: function (sim, x) {
        if (Math.abs(x - sim.state.downX) < 8 && !sim.state.slid) return;
        sim.state.slid = true;
        var bridgeFull = sim.width - 50, scaleLen = (bridgeFull - 40) / 0.65;
        sim.setParam('length', Math.round(M.clamp((bridgeFull - x) / scaleLen, 0.2, 0.65) * 100) / 100);
      },
      up: function (sim) { pluck(sim); }
    }
  });

  function pluck(sim) {
    sim.state.energy = 1; sim.state.t0 = performance.now(); sim.redraw();
    A.tone(freq(sim.p), { type: 'triangle', duration: 2.2, gain: 0.55, harmonics: [1, 0.55, 0.3, 0.18, 0.1] });
  }
  function tuneTo(sim, f) {
    // solve f = (1/2L)√(T/μ) for T, keeping length & thickness
    var mu = GAUGES[sim.p.gauge].mu, T = Math.pow(2 * sim.p.length * f, 2) * mu;
    if (T < 20 || T > 150) { sim.toast('Can’t reach ' + Math.round(f) + ' Hz with this string — try another thickness or length'); return; }
    sim.setParam('tension', Math.round(T));
    pluck(sim);
  }
})();
