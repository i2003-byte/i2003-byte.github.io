/* =====================================================================
   Waves · Standing Waves on a String (Melde's experiment) — sim.js
   ---------------------------------------------------------------------
   A string of length L runs from a vibrator (x = 0) over a pulley to a
   hanging mass M, so the tension is T = M g and the wave speed is
   v = √(T/μ). The vibrator shakes x = 0 with a tiny amplitude a; the
   pulley end x = L is fixed. With a little damping the steady motion is
     y(x,t) = Re[ a · sin(κ(L − x)) / sin(κL) · e^{iωt} ],
     κ = ω/v − iβ/L   (β = 0.12 sets the damping)
   |sin(κL)| is smallest when ωL/v = nπ, i.e. f = n · v/2L: there the
   string swings with n loops (resonance). The motion is drawn slowed
   down to about one swing per second; the sideways size is enlarged.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var G = 9.8, BETA = 0.12, A0 = 0.003, SLOW = 0.8;
  var voice = null, cache = { key: '', pts: [] };

  function speed(p) { return Math.sqrt(p.m * G / (p.mu / 1000)); }
  function f1(p) { return speed(p) / (2 * p.L); }
  // complex sin(u − i b) = sin u cosh b − i cos u sinh b
  function csin(u, b) { return [Math.sin(u) * Math.cosh(b), -Math.cos(u) * Math.sinh(b)]; }
  function profile(p, f, x) { // complex ratio y/a at position x
    var k = 2 * Math.PI * f / speed(p), num = csin(k * (p.L - x), BETA * (p.L - x) / p.L), den = csin(k * p.L, BETA);
    var d2 = den[0] * den[0] + den[1] * den[1];
    return [(num[0] * den[0] + num[1] * den[1]) / d2, (num[1] * den[0] - num[0] * den[1]) / d2];
  }
  function peakAmp(p, f) { // biggest |y| along the string (m)
    var best = 0;
    for (var i = 0; i <= 80; i++) { var z = profile(p, f, p.L * i / 80); best = Math.max(best, Math.hypot(z[0], z[1])); }
    return best * A0;
  }
  function harmonic(p) { var r = p.f / f1(p), n = Math.round(r); return n >= 1 && Math.abs(r - n) < 0.025 * n + 0.01 ? n : 0; }
  function maxPeak() { return A0 / Math.sinh(BETA); }

  SimLab.createSim({
    ariaLabel: 'A string stretched between a vibrator and a pulley with a hanging mass, vibrating in loops at its resonant frequencies, above a graph of string amplitude against vibrator frequency with peaks at whole-number multiples of the fundamental',
    audio: true,
    autoplay: true,
    mobileAspect: '3 / 4',
    params: [
      { id: 'f', label: 'Vibrator frequency f', min: 2, max: 400, step: 0.1, value: 99, unit: 'Hz' },
      { id: 'm', label: 'Hanging mass (sets tension T = Mg)', min: 0.1, max: 5, step: 0.1, value: 1, unit: 'kg' },
      { id: 'mu', label: 'String mass per metre μ', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'g/m', presets: [{ label: 'Thin', value: 0.5 }, { label: 'Cotton', value: 1 }, { label: 'Thick', value: 4 }] },
      { id: 'L', label: 'Length of string L', min: 0.5, max: 1.5, step: 0.05, value: 1, unit: 'm' }
    ],
    readouts: [
      { id: 'v', label: 'Wave speed v = √(T/μ)', unit: 'm/s', digits: 1, key: true },
      { id: 'f1', label: 'Fundamental f₁ = v ÷ 2L', unit: 'Hz', digits: 1, key: true },
      { id: 'ratio', label: 'f ÷ f₁', digits: 2 },
      { id: 'lam', label: 'Wavelength λ = v ÷ f', unit: 'm', digits: 3 },
      { id: 'amp', label: 'Biggest swing of the string', unit: 'mm', digits: 1 },
      { id: 'n', label: 'Pattern' }
    ],
    buttons: [1, 2, 3, 4].map(function (n) {
      return { label: n === 1 ? 'Fundamental (n = 1)' : 'Harmonic n = ' + n, primary: n === 1, onClick: function (sim) { sim.setParam('f', Math.round(n * f1(sim.p) * 10) / 10); } };
    }),

    reset: function (sim) { sim.state = {}; },
    update: function () {},
    onParam: function () { return true; },
    readout: function (sim) {
      var p = sim.p, n = harmonic(p);
      return { v: speed(p), f1: f1(p), ratio: p.f / f1(p), lam: speed(p) / p.f, amp: peakAmp(p, p.f) * 1000, n: n ? n + (n === 1 ? ' loop' : ' loops') + (n === 1 ? ' (fundamental)' : ' (harmonic ' + n + ')') : 'no clear loops' };
    },
    status: function (sim) { var n = harmonic(sim.p); return (sim.running ? 'Running (slow motion)' : 'Paused') + ' · ' + (n ? 'resonance: ' + n + ' loop' + (n > 1 ? 's' : '') : 'not at resonance'); },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height;
      D.clear(ctx, W, H, c.bg);
      var small = W < 560, fs = small ? 10 : 12;
      var v = speed(p), F1 = f1(p), n = harmonic(p), amp = peakAmp(p, p.f);
      syncVoice(sim, amp / maxPeak());

      /* ---- string scene ---- */
      var sceneH = H * (H < 380 ? 0.56 : 0.6), sx0 = small ? 34 : 70, sx1 = W - (small ? 40 : 80);
      var cy = sceneH * 0.5, half = sceneH * 0.36, pxv = half / maxPeak(); // px per metre sideways (enlarged)
      var pxl = (sx1 - sx0) / p.L, ph = 2 * Math.PI * SLOW * sim.time;
      // vibrator
      var vibY = A0 * Math.cos(ph) * pxv;
      D.roundRect(ctx, sx0 - 26, cy - 22, 20, 44, 4, D.alpha(c.s4, 0.25), c.s4, 1.5);
      D.line(ctx, sx0 - 6, cy - vibY, sx0, cy - vibY, c.s4, 3);
      D.text(ctx, 'vibrator', sx0 - 16, cy + 32, { color: c.faint, size: 9.5, align: 'center' });
      // pulley, thread and mass
      var pr = small ? 9 : 12;
      D.circle(ctx, sx1 + pr * 0.2, cy + pr, pr, D.alpha(c.muted, 0.25), c.muted, 1.5);
      D.line(ctx, sx1 + pr * 1.2, cy + pr, sx1 + pr * 1.2, sceneH - 30, c.muted, 1.2);
      var mw = 14 + Math.sqrt(p.m) * 8;
      D.roundRect(ctx, sx1 + pr * 1.2 - mw / 2, sceneH - 30, mw, Math.min(26, sceneH * 0.12), 3, c.s3);
      D.text(ctx, M.fmt(p.m, 1) + ' kg', sx1 + pr * 1.2 - mw / 2 - 4, sceneH - 30 + Math.min(13, sceneH * 0.06), { color: c.s3, size: 9.5, weight: 700, align: 'right' });
      // envelope
      ctx.save(); ctx.fillStyle = D.alpha(c.s1, 0.12); ctx.beginPath();
      var N = Math.max(80, Math.round((sx1 - sx0) / 3)), env = [];
      for (var i = 0; i <= N; i++) { var z = profile(p, p.f, p.L * i / N); env.push(z); }
      env.forEach(function (z, i) { var x = sx0 + (sx1 - sx0) * i / N, e = Math.min(Math.hypot(z[0], z[1]) * A0 * pxv, half * 1.1); if (i) ctx.lineTo(x, cy - e); else ctx.moveTo(x, cy - e); });
      for (i = N; i >= 0; i--) { var e2 = Math.min(Math.hypot(env[i][0], env[i][1]) * A0 * pxv, half * 1.1); ctx.lineTo(sx0 + (sx1 - sx0) * i / N, cy + e2); }
      ctx.closePath(); ctx.fill(); ctx.restore();
      // the string itself: Re[z e^{iφ}] = z.re cos φ − z.im sin φ
      ctx.save(); ctx.strokeStyle = c.s1; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
      env.forEach(function (z, i) {
        var y = M.clamp((z[0] * Math.cos(ph) - z[1] * Math.sin(ph)) * A0 * pxv, -half * 1.1, half * 1.1), x = sx0 + (sx1 - sx0) * i / N;
        if (i) ctx.lineTo(x, cy - y); else ctx.moveTo(x, cy - y);
      });
      ctx.lineTo(sx1 + pr * 0.2, cy); ctx.stroke(); ctx.restore();
      // nodes and antinodes at resonance
      if (n) {
        var hl = p.L / n;
        for (var j = 0; j <= n; j++) {
          var nx = sx1 - j * hl * pxl;
          D.circle(ctx, nx, cy, 3.5, c.bg, c.s2, 2);
          if (n <= 8 || j % 2 === 0) D.text(ctx, 'N', nx, cy + 14, { color: c.s2, size: fs - 1, weight: 700, align: 'center' });
          if (j < n && (n <= 6 || !small)) D.text(ctx, 'A', nx - hl * pxl / 2, cy - half - (small ? 4 : 8), { color: c.s3, size: fs - 1, weight: 700, align: 'center' });
        }
        if (n >= 2) {
          var bx0 = sx1 - 2 * hl * pxl, by = cy + half + (small ? 12 : 18);
          if (by < sceneH - 2) {
            D.line(ctx, bx0, by, sx1, by, c.s3, 1.5); D.line(ctx, bx0, by - 4, bx0, by + 4, c.s3, 1.5); D.line(ctx, sx1, by - 4, sx1, by + 4, c.s3, 1.5);
            D.text(ctx, 'λ = 2L/' + n + ' = ' + M.fmt(2 * p.L / n, 2) + ' m', (bx0 + sx1) / 2, by - 8, { color: c.s3, size: fs - 1, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
          }
        }
      }
      D.text(ctx, n ? (n === 1 ? 'Fundamental: 1 loop' : 'Harmonic ' + n + ': ' + n + ' loops') : 'Not at resonance: the string hardly moves', W / 2, 12, { color: n ? c.bg : c.muted, bg: n ? c.success : null, size: fs, weight: 700, align: 'center', pad: 4, fit: W });
      D.text(ctx, 'L = ' + M.fmt(p.L, 2) + ' m', 6, 12, { color: c.faint, size: 9.5 });

      /* ---- response curve: amplitude vs frequency ---- */
      var gx = small ? 34 : 54, gy = sceneH + 14, gw = W - gx - 12, gh = H - gy - (small ? 30 : 34);
      if (gh < 30) return;
      var fmax = Math.max(5.5 * F1, p.f * 1.08), key = [p.m, p.mu, p.L, fmax.toFixed(1), Math.round(gw)].join('|');
      if (cache.key !== key) {
        cache.key = key; cache.pts = [];
        for (var q = 0; q <= Math.round(gw); q++) cache.pts.push(peakAmp(p, Math.max(0.5, fmax * q / Math.round(gw))) * 1000);
      }
      var ymax = maxPeak() * 1000 * 1.1;
      function X(f) { return gx + f / fmax * gw; }
      function Y(a) { return gy + gh - Math.min(a, ymax) / ymax * gh; }
      ctx.strokeStyle = c.axis; ctx.lineWidth = 1; ctx.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
      D.text(ctx, small ? 'Swing vs frequency' : 'Biggest swing of the string vs vibrator frequency', gx + 4, gy + 9, { color: c.muted, size: fs - 1, weight: 600 });
      for (var h = 1; h * F1 <= fmax; h++) {
        D.line(ctx, X(h * F1), gy, X(h * F1), gy + gh, D.alpha(c.s3, 0.35), 1, [3, 4]);
        if (h <= 8 || h % 2 === 0) D.text(ctx, h === 1 ? 'f₁' : h + 'f₁', X(h * F1), gy + gh + 9, { color: c.s3, size: 9.5, weight: 700, align: 'center' });
      }
      D.text(ctx, '0', gx, gy + gh + 9, { color: c.muted, size: 9.5, align: 'center' });
      D.text(ctx, M.fmt(fmax, 0) + ' Hz', gx + gw, gy + gh + 21, { color: c.muted, size: 9.5, align: 'right' });
      ctx.save(); ctx.beginPath(); ctx.rect(gx, gy, gw, gh); ctx.clip();
      ctx.strokeStyle = c.s1; ctx.lineWidth = 1.8; ctx.beginPath();
      cache.pts.forEach(function (a, i) { if (i) ctx.lineTo(gx + i, Y(a)); else ctx.moveTo(gx, Y(a)); });
      ctx.stroke(); ctx.restore();
      D.line(ctx, X(p.f), gy, X(p.f), gy + gh, c.s4, 2);
      D.circle(ctx, X(p.f), Y(amp * 1000), 5, c.s4, c.bg, 1.5);
      ctx.save(); ctx.translate(gx - (small ? 12 : 18), gy + gh / 2); ctx.rotate(-Math.PI / 2);
      D.text(ctx, 'swing', 0, 0, { color: c.muted, size: 9.5, align: 'center' }); ctx.restore();
    }
  });

  function syncVoice(sim, rel) {
    var on = sim.running && A.enabled;
    if (on) {
      if (!voice) voice = A.voice('triangle');
      voice.set(sim.p.f, 0.08 + 0.42 * M.clamp(rel, 0, 1));
    } else if (voice) { voice.stop(); voice = null; }
  }
})();
