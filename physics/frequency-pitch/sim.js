/* =====================================================================
   Sound Lab · Frequency & Pitch — sim.js
   ---------------------------------------------------------------------
   Frequency = number of vibrations per second (hertz, Hz).
   Time period T = 1 / f.  Higher frequency → higher pitch.
   The wave is drawn over a fixed 20 millisecond window, so you can
   literally count the cycles: at 500 Hz you see 10 of them.
   A piano strip shows which musical note the frequency is closest to.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var voice = null;
  var WINDOW_MS = 20;
  var NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

  function noteOf(f) {
    var n = Math.round(12 * Math.log2(f / 440)) + 57; // semitones from C0
    var cents = Math.round(1200 * Math.log2(f / (440 * Math.pow(2, (n - 57) / 12))));
    return { name: NAMES[((n % 12) + 12) % 12] + Math.floor(n / 12), n: n, cents: cents };
  }

  SimLab.createSim({
    ariaLabel: 'A sound wave whose cycles squeeze together as the frequency rises, above a piano keyboard',
    audio: true,
    autoplay: true,
    params: [
      { id: 'freq', label: 'Frequency', min: 20, max: 2000, step: 1, value: 262, unit: 'Hz',
        presets: [{ label: 'Drum 60', value: 60 }, { label: 'Man 120', value: 120 }, { label: 'Woman 220', value: 220 },
          { label: 'Do (C4) 262', value: 262 }, { label: 'A4 440', value: 440 }, { label: 'Whistle 1500', value: 1500 }] },
      { id: 'wave', label: 'Wave shape', type: 'select', value: 'sine', options: [
        { value: 'sine', label: 'Pure tone (sine)' }, { value: 'triangle', label: 'Soft (triangle)' }, { value: 'square', label: 'Buzzy (square)' }] }
    ],
    buttonsTitle: 'Nudge',
    buttons: [
      { label: '½ × (octave down)', onClick: function (sim) { sim.setParam('freq', Math.max(20, Math.round(sim.p.freq / 2)), true); } },
      { label: '2 × (octave up)', onClick: function (sim) { sim.setParam('freq', Math.min(2000, sim.p.freq * 2), true); } }
    ],
    readouts: [
      { id: 'f', label: 'Frequency', unit: 'Hz', digits: 0, key: true },
      { id: 'T', label: 'Time period', unit: 'ms', digits: 2, key: true },
      { id: 'cycles', label: 'Cycles on screen', digits: 1 },
      { id: 'lambda', label: 'Wavelength in air', unit: 'm', digits: 2 },
      { id: 'note', label: 'Nearest note' },
      { id: 'pitch', label: 'Pitch' }
    ],
    onParam: function (sim) { syncVoice(sim); return true; },
    onRunChange: function (sim) { syncVoice(sim); },
    onSound: function (sim) { syncVoice(sim); },
    reset: function (sim) { sim.state = {}; },

    readout: function (sim) {
      var f = sim.p.freq, n = noteOf(f);
      return {
        f: f, T: 1000 / f, cycles: f * WINDOW_MS / 1000, lambda: 343 / f,
        note: n.name + (n.cents ? ' (' + (n.cents > 0 ? '+' : '') + n.cents + '¢)' : ''),
        pitch: f < 150 ? 'Low 🐘' : f < 600 ? 'Medium 🙂' : 'High 🐦'
      };
    },
    status: function (sim) { return sim.running ? 'Playing ' + sim.p.freq + ' Hz' : 'Paused'; },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, f = sim.p.freq;
      D.clear(ctx, W, H, c.bg);
      var pianoH = Math.min(70, H * 0.2), left = 44, right = W - 14, top = 26, bottom = H - pianoH - 36;
      var mid = (top + bottom) / 2, amp = (bottom - top) / 2 - 8;

      // time axis in ms
      D.grid(ctx, left, top, right - left, bottom - top, (right - left) / 10, c.grid);
      D.line(ctx, left, mid, right, mid, c.axis, 1);
      for (var ms = 0; ms <= WINDOW_MS; ms += 4) D.text(ctx, ms + ' ms', left + ms / WINDOW_MS * (right - left), bottom + 12, { color: c.faint, size: 10, align: 'center' });

      // the wave moves slowly so it looks alive (phase drift)
      var phase = sim.time * 2;
      var shape = sim.p.wave;
      function y(x) {
        var tt = (x - left) / (right - left) * WINDOW_MS / 1000;
        var p = 2 * Math.PI * f * tt - phase, s = Math.sin(p);
        if (shape === 'square') s = s >= 0 ? 0.85 : -0.85;
        else if (shape === 'triangle') s = 2 / Math.PI * Math.asin(Math.sin(p));
        return mid - amp * s;
      }
      D.curve(ctx, y, left, right, c.accent, 2.5, Math.max(0.5, Math.min(2, 200 / f)));

      // one time period marker
      var Tpx = (1 / f) / (WINDOW_MS / 1000) * (right - left);
      if (Tpx > 24) {
        var startX = left + (phase / (2 * Math.PI)) / f / (WINDOW_MS / 1000) * (right - left) % Tpx;
        D.arrow(ctx, startX + Tpx * 0.25, top + 6, startX + Tpx * 1.25, top + 6, c.s3, 2, 7);
        D.arrow(ctx, startX + Tpx * 1.25, top + 6, startX + Tpx * 0.25, top + 6, c.s3, 2, 7);
        D.text(ctx, 'T = ' + M.fmt(1000 / f, 2) + ' ms', startX + Tpx * 0.75, top + 18, { color: c.s3, size: 12, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.8) });
      }

      // piano strip C2..C7 (log scale)
      var py = H - pianoH - 6, lo = noteOf(65.4).n, hi = noteOf(2093).n;
      var whites = [];
      for (var n = lo; n <= hi; n++) if ([0, 2, 4, 5, 7, 9, 11].indexOf(n % 12) !== -1) whites.push(n);
      var kw = (W - 20) / whites.length, cur = noteOf(f).n;
      whites.forEach(function (n, i) {
        D.roundRect(ctx, 10 + i * kw, py, kw - 1, pianoH, 3, n === cur ? c.accent : (c.light ? '#fff' : '#e2e8f0'), c.border);
        if (n % 12 === 0 && kw > 6) D.text(ctx, 'C' + Math.floor(n / 12), 10 + i * kw + kw / 2, py + pianoH - 9, { color: '#475569', size: 9, align: 'center' });
      });
      whites.forEach(function (n, i) {
        var b = n + 1;
        if ([1, 3, 6, 8, 10].indexOf(b % 12) !== -1 && b <= hi)
          D.roundRect(ctx, 10 + (i + 1) * kw - kw * 0.3, py, kw * 0.6, pianoH * 0.6, 2, b === cur ? c.accent : '#1e293b');
      });
      // frequency pointer
      var fx = 10 + (Math.log2(f / 65.4) / Math.log2(2093 / 65.4)) * (W - 20);
      if (f >= 65.4 && f <= 2093) D.arrow(ctx, fx, py - 16, fx, py - 2, c.s3, 2, 7);
      else D.text(ctx, f < 65.4 ? '◀ below the piano' : 'above the piano ▶', f < 65.4 ? 12 : W - 12, py - 10, { color: c.s3, size: 11, align: f < 65.4 ? 'left' : 'right' });
    }
  });

  function syncVoice(sim) {
    var on = sim.running && A.enabled;
    if (on) {
      if (!voice) voice = A.voice(sim.p.wave);
      voice.set(sim.p.freq, sim.p.wave === 'square' ? 0.25 : 0.5, sim.p.wave);
    } else if (voice) { voice.stop(); voice = null; }
  }
})();
