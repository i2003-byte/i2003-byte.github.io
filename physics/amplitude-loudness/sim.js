/* =====================================================================
   Sound Lab · Amplitude & Loudness — sim.js
   ---------------------------------------------------------------------
   A loudspeaker vibrates with a chosen amplitude (how far it moves).
   Top: air particles pushed into compressions and rarefactions.
   Bottom: the same sound drawn as a wave; the height of the wave is
   the amplitude. Loudness is proportional to amplitude²
   (double the amplitude → four times as loud).
   The frequency stays fixed so only loudness changes.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var voice = null;
  var VIS_F = 1.2; // slowed visual frequency (Hz)

  SimLab.createSim({
    ariaLabel: 'A loudspeaker pushing air particles, with the matching sound wave drawn below',
    audio: true,
    autoplay: true,
    params: [
      { id: 'amp', label: 'Amplitude', min: 0, max: 100, step: 1, value: 50, unit: '%',
        presets: [{ label: 'Whisper', value: 10 }, { label: 'Talk', value: 40 }, { label: 'Shout', value: 90 }] },
      { id: 'compare', label: 'Show reference wave (50%)', type: 'toggle', value: true },
      { id: 'freq', label: 'Tone you hear', type: 'select', value: 440, options: [
        { value: 262, label: '262 Hz (C4)' }, { value: 440, label: '440 Hz (A4)' }, { value: 660, label: '660 Hz (E5)' }] }
    ],
    readouts: [
      { id: 'amp', label: 'Amplitude', unit: '%', digits: 0, key: true },
      { id: 'rel', label: 'Loudness vs 50%', unit: '×', digits: 2, key: true },
      { id: 'db', label: 'Approx. level', unit: 'dB', digits: 0 },
      { id: 'feel', label: 'Sounds…' },
      { id: 'freq', label: 'Frequency (fixed)', unit: 'Hz', digits: 0 }
    ],
    onParam: function (sim) { syncVoice(sim); return true; },
    onRunChange: function (sim) { syncVoice(sim); },
    onSound: function (sim) { syncVoice(sim); },
    reset: function (sim) { sim.state = {}; },

    readout: function (sim) {
      var a = sim.p.amp / 100;
      var db = a > 0 ? 90 + 20 * Math.log10(a) : 0;
      return {
        amp: sim.p.amp, rel: Math.pow(a / 0.5, 2), db: Math.max(0, db), freq: sim.p.freq,
        feel: sim.p.amp === 0 ? 'Silent' : sim.p.amp < 20 ? 'Very soft' : sim.p.amp < 45 ? 'Soft' : sim.p.amp < 75 ? 'Loud' : 'Very loud!'
      };
    },
    status: function (sim) { return sim.running ? 'Speaker vibrating' : 'Paused'; },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, a = sim.p.amp / 100, t = sim.time;
      D.clear(ctx, W, H, c.bg);
      var top = H * 0.46, left = 80;
      var lambda = Math.max(120, (W - left) / 3);
      var k = 2 * Math.PI / lambda, w = 2 * Math.PI * VIS_F;

      // --- speaker
      var cone = Math.sin(-w * t) * a * 12;
      D.roundRect(ctx, 10, top / 2 - 50, 40, 100, 6, c.muted);
      ctx.fillStyle = c.faint; ctx.beginPath();
      ctx.moveTo(50, top / 2 - 20); ctx.lineTo(62 + cone, top / 2 - 50); ctx.lineTo(62 + cone, top / 2 + 50); ctx.lineTo(50, top / 2 + 20); ctx.fill();

      // --- air particles (longitudinal displacement)
      var rnd = M.rng(11);
      for (var x0 = left; x0 < W - 6; x0 += 9) {
        for (var y = 16; y < top - 10; y += 11) {
          var jx = (rnd() - 0.5) * 6;
          var disp = a * 10 * Math.sin(k * (x0 - left) - w * t);
          D.circle(ctx, x0 + jx + disp, y + (rnd() - 0.5) * 4, 2.2, D.alpha(c.s1, 0.8));
        }
      }
      D.text(ctx, 'Air particles', W - 10, 12, { color: c.faint, size: 11, align: 'right' });

      // --- wave graph
      var mid = top + (H - top) / 2, maxA = (H - top) / 2 - 18;
      D.line(ctx, left, mid, W - 10, mid, c.axis, 1);
      D.line(ctx, left, top + 8, left, H - 8, c.axis, 1);
      if (sim.p.compare) D.curve(ctx, function (x) { return mid - 0.5 * maxA * Math.sin(k * (x - left) - w * t); }, left, W - 10, D.alpha(c.muted, 0.6), 1.5);
      D.curve(ctx, function (x) { return mid - a * maxA * Math.sin(k * (x - left) - w * t); }, left, W - 10, c.accent, 3);
      // amplitude marker
      var crestX = left + ((w * t + Math.PI / 2) / k) % lambda;
      if (a > 0.02) {
        D.arrow(ctx, crestX, mid, crestX, mid - a * maxA, c.s3, 2, 8);
        D.text(ctx, 'amplitude', crestX + 8, mid - a * maxA / 2, { color: c.s3, size: 12, weight: 600 });
      }
      D.text(ctx, 'Sound wave', 10, top + 14, { color: c.faint, size: 11 });
    }
  });

  function syncVoice(sim) {
    var on = sim.running && A.enabled && sim.p.amp > 0;
    if (on) {
      if (!voice) voice = A.voice('sine');
      // perceived loudness: gain ∝ amplitude
      voice.set(sim.p.freq, Math.pow(sim.p.amp / 100, 1.3));
    } else if (voice) { voice.stop(); voice = null; }
  }
})();
