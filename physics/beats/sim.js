/* =====================================================================
   Waves · Beats — sim.js
   ---------------------------------------------------------------------
   Two tuning forks of nearly equal frequency f₁ and f₂ sound together.
   With equal amplitudes a the air pressure at your ear is
     y = a sin(2πf₁t) + a sin(2πf₂t)
       = [2a cos(π(f₁ − f₂)t)] · sin(π(f₁ + f₂)t)
   A tone at the average frequency whose loudness rises and falls
   |f₁ − f₂| times a second: the beat frequency.
   Top panel: a 25 ms window that moves with fork A, so A's wave looks
   still and B's wave slides past it (in step → out of step → in step).
   Bottom panel: the combined wave over the last few seconds; each pixel
   column covers several cycles, so it shows the loudness envelope.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var voices = null;

  function bf(p) { return Math.abs(p.f1 - p.f2); }

  SimLab.createSim({
    ariaLabel: 'Two tuning fork waves of nearly equal frequency drifting in and out of step, and their sum whose loudness swells and fades as beats',
    audio: true,
    mobileAspect: '3 / 4',
    params: [
      { id: 'f1', label: 'Fork A frequency f₁', min: 200, max: 300, step: 0.5, value: 256, unit: 'Hz' },
      { id: 'f2', label: 'Fork B frequency f₂', min: 200, max: 300, step: 0.5, value: 260, unit: 'Hz', presets: [{ label: 'Same as A', value: 256 }, { label: '+1 Hz', value: 257 }, { label: '+4 Hz', value: 260 }, { label: '+10 Hz', value: 266 }] },
      { id: 'win', label: 'Time shown (bottom)', type: 'select', value: '3', options: [{ value: '1', label: '1 second' }, { value: '3', label: '3 seconds' }, { value: '6', label: '6 seconds' }] }
    ],
    readouts: [
      { id: 'fb', label: 'Beat frequency |f₁ − f₂|', unit: 'Hz', digits: 1, key: true },
      { id: 'Tb', label: 'Time between loud moments', unit: 's', digits: 2, key: true },
      { id: 'fav', label: 'Pitch you hear (f₁ + f₂) ÷ 2', unit: 'Hz', digits: 1 },
      { id: 'loud', label: 'Loudness now (of maximum)', unit: '%', digits: 0 },
      { id: 'hint', label: 'What you hear' }
    ],
    reset: function (sim) { sim.state = {}; },
    update: function () {},
    onParam: function () { return true; },
    readout: function (sim) {
      var p = sim.p, b = bf(p), env = Math.abs(Math.cos(Math.PI * (p.f1 - p.f2) * sim.time));
      return {
        fb: b, Tb: b > 0 ? 1 / b : null, fav: (p.f1 + p.f2) / 2, loud: env * 100,
        hint: b === 0 ? 'one steady tone (no beats)' : b <= 8 ? 'a tone that swells and fades ' + M.fmt(b, b % 1 ? 1 : 0) + '× a second' : b <= 20 ? 'a fast flutter, rough sound' : 'two separate notes'
      };
    },
    status: function (sim) { return (sim.running ? 'Running' : 'Paused') + ' · turn on sound to hear the beats'; },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, t = sim.time;
      D.clear(ctx, W, H, c.bg);
      syncVoices(sim);
      var small = W < 560, fs = small ? 10 : 12;
      var df = p.f1 - p.f2, env = Math.abs(Math.cos(Math.PI * df * t));
      var gx = small ? 10 : 20, gw = W - gx * 2 - (small ? 40 : 70);

      /* ---- top: the two waves in a 25 ms window that moves with fork A ---- */
      var topH = H * 0.5, rowH = (topH - 36) / 2, span = 0.025;
      D.text(ctx, small ? 'The two waves (25 ms window)' : 'The two waves over 25 ms (window keeps fork A still)', gx, 11, { color: c.muted, size: fs, weight: 700, fit: W });
      var lagB = 2 * Math.PI * (p.f2 - p.f1) * t; // B's phase relative to A
      [[p.f1, 0, c.s1, 'A'], [p.f2, lagB, c.s2, 'B']].forEach(function (w, r) {
        var cy = 24 + rowH * (r + 0.5), amp = rowH * 0.36;
        D.line(ctx, gx, cy, gx + gw, cy, D.alpha(c.muted, 0.3), 1);
        D.curve(ctx, function (x) { return cy - amp * Math.sin(2 * Math.PI * w[0] * (x - gx) / gw * span + w[1]); }, gx, gx + gw, w[2], 2, 1);
        D.text(ctx, w[3], gx + gw + 8, cy - 7, { color: w[2], size: fs + 1, weight: 700 });
        D.text(ctx, M.fmt(w[0], 1) + ' Hz', gx + gw + 8, cy + 8, { color: c.muted, size: fs - 1.5 });
      });
      var c0 = Math.cos(lagB), inStep = c0 > 0.8 ? 'in step: they add up (loud)' : c0 < -0.8 ? 'out of step: they cancel (quiet)' : 'drifting…';
      D.text(ctx, inStep, gx + gw / 2, topH - 6, { color: c0 > 0.8 ? c.bg : c0 < -0.8 ? c.bg : c.muted, bg: c0 > 0.8 ? c.success : c0 < -0.8 ? c.s4 : null, size: fs, weight: 700, align: 'center', pad: 3, fit: W });

      /* ---- bottom: the combined wave over the last few seconds ---- */
      var win = parseFloat(p.win), by0 = topH + 22, bh = H - by0 - 22, cy2 = by0 + bh / 2 + 4, amp2 = bh * 0.2;
      D.text(ctx, small ? 'A + B together (envelope = loudness)' : 'A + B together over the last ' + win + ' s: the outline is the loudness', gx, topH + 11, { color: c.muted, size: fs, weight: 700, fit: W });
      D.line(ctx, gx, cy2, gx + gw, cy2, D.alpha(c.muted, 0.3), 1);
      var t0 = t - win, cols = Math.round(gw);
      ctx.save(); ctx.fillStyle = D.alpha(c.s3, 0.55); ctx.beginPath();
      var ok = false;
      for (var i = 0; i <= cols; i++) {
        var ti = t0 + win * i / cols; if (ti < 0) continue;
        var e = 2 * Math.abs(Math.cos(Math.PI * df * ti)) * amp2;
        // a column spans about one cycle or more, so it fills ± envelope
        ctx.rect(gx + i, cy2 - e, 1.2, 2 * e + 0.5); ok = true;
      }
      if (ok) ctx.fill(); ctx.restore();
      // envelope outline
      ctx.save(); ctx.strokeStyle = c.s3; ctx.lineWidth = 1.5; ctx.beginPath();
      var started = false;
      for (i = 0; i <= cols; i += 2) {
        ti = t0 + win * i / cols; if (ti < 0) continue;
        var yy = cy2 - 2 * Math.abs(Math.cos(Math.PI * df * ti)) * amp2;
        if (started) ctx.lineTo(gx + i, yy); else { ctx.moveTo(gx + i, yy); started = true; }
      }
      ctx.stroke(); ctx.restore();
      D.line(ctx, gx + gw, by0, gx + gw, by0 + bh, c.s4, 2);
      D.text(ctx, 'now', gx + gw, by0 + bh + 9, { color: c.s4, size: 9.5, weight: 700, align: 'center' });
      D.text(ctx, '−' + win + ' s', gx, by0 + bh + 9, { color: c.faint, size: 9.5 });
      // beat-period bracket between two loud moments
      if (df !== 0 && 1 / Math.abs(df) < win * 0.6 && t > 1 / Math.abs(df) * 2) {
        var Tb = 1 / Math.abs(df), lastLoud = Math.floor(t / Tb) * Tb, xb = gx + gw - (t - lastLoud) / win * gw, xa = xb - Tb / win * gw, yb = by0 + 4;
        if (xa > gx + 90) {
          D.line(ctx, xa, yb, xb, yb, c.s1, 1.5); D.line(ctx, xa, yb - 4, xa, yb + 4, c.s1, 1.5); D.line(ctx, xb, yb - 4, xb, yb + 4, c.s1, 1.5);
          D.text(ctx, 'one beat = ' + M.fmt(Tb, 2) + ' s', xa - 4, yb, { color: c.s1, size: 9.5, weight: 700, align: 'right', bg: D.alpha(c.bg, 0.8), pad: 2 });
        }
      }
      // loudness meter
      var mx = W - (small ? 24 : 40), mw = small ? 14 : 20, mh = bh;
      D.roundRect(ctx, mx, by0, mw, mh, 4, D.alpha(c.muted, 0.15), c.border, 1);
      D.roundRect(ctx, mx, by0 + mh * (1 - env), mw, mh * env, 4, c.s3);
      D.text(ctx, '🔊', mx + mw / 2, by0 - 9, { size: 11, align: 'center', color: c.text });
      if (t === 0) D.text(ctx, 'Press ▶ Play (and turn on sound to hear the beats)', W / 2, cy2, { color: c.bg, bg: c.s3, size: fs + 0.5, weight: 700, align: 'center', pad: 6, fit: W });
    }
  });

  function syncVoices(sim) {
    var on = sim.running && A.enabled;
    if (on) {
      if (!voices) voices = [A.voice('sine'), A.voice('sine')];
      voices[0].set(sim.p.f1, 0.3); voices[1].set(sim.p.f2, 0.3);
    } else if (voices) { voices.forEach(function (v) { v.stop(); }); voices = null; }
  }
})();
