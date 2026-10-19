/* =====================================================================
   Electricity · Series LCR Circuit and Resonance — sim.js
   ---------------------------------------------------------------------
   A resistor R, a coil L and a capacitor C in series on an AC supply.
     XL = 2πfL,  XC = 1/(2πfC)
     Z  = √(R² + (XL − XC)²),  I = V / Z
     tan φ = (XL − XC) / R   (φ > 0: current lags the voltage)
   At the resonant frequency XL = XC, so Z = R and the current is
   largest:  f₀ = 1 / (2π√(LC)).
     Q factor   Q = (1/R)√(L/C) = XL / R at f₀   (VL = VC = Q × V)
     bandwidth  Δf = R / (2πL)  between the half-power frequencies
   Lab mode: 10 V rms signal generator, sweep the frequency.
   Radio mode: an aerial picks up five FM stations at once; a 0.1 µH
   coil, a 1 Ω resistance and a tuning capacitor (20–34 pF) pick the
   one at f₀. Each station's share = R / |Z| at its frequency.
   Ideal parts (no losses apart from R). Real FM sets tune in more than
   one stage, but each stage works like this.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, TAU = Math.PI * 2;
  var VS = 10, IMAX = 1.1, FLO = 10, FHI = 1000;
  var RL = 0.1e-6, RR = 1, RLO = 86, RHI = 112;
  var STATIONS = [91.1, 94.3, 98.3, 102.6, 106.4];

  function lab(sim) {
    var f = sim.p.f, L = sim.p.L / 1000, C = sim.p.C * 1e-6, R = sim.p.R, w = TAU * f;
    var XL = w * L, XC = 1 / (w * C), Z = Math.hypot(R, XL - XC), I = VS / Z;
    var f0 = 1 / (TAU * Math.sqrt(L * C)), a = R / (2 * L), w0 = TAU * f0, root = Math.sqrt(a * a + w0 * w0);
    return { f: f, L: L, C: C, R: R, XL: XL, XC: XC, Z: Z, I: I, f0: f0, phi: Math.atan2(XL - XC, R),
      Q: Math.sqrt(L / C) / R, bw: R / (TAU * L), f1: (root - a) / TAU, f2: (root + a) / TAU };
  }
  function iAt(q, f) { var w = TAU * f; return VS / Math.hypot(q.R, w * q.L - 1 / (w * q.C)); }
  // radio: share of each station that gets through (1 at resonance)
  function radio(sim) {
    var C = sim.p.tune * 1e-12, f0 = 1 / (TAU * Math.sqrt(RL * C)) / 1e6;
    function share(fm) { var w = TAU * fm * 1e6; return RR / Math.hypot(RR, w * RL - 1 / (w * C)); }
    var sh = STATIONS.map(share), best = 0;
    sh.forEach(function (v, i) { if (v > sh[best]) best = i; });
    var others = sh.filter(function (v, i) { return i !== best; }), loudOther = Math.max.apply(null, others);
    var verdict = sh[best] < 0.35 ? 'static (between stations)' : sh[best] >= 0.7 && loudOther < 0.3 ? 'FM ' + STATIONS[best] + ': clear' : 'FM ' + STATIONS[best] + ': faint or mixed';
    return { f0: f0, C: C, share: share, sh: sh, best: best, verdict: verdict, Q: Math.sqrt(RL / C) / RR };
  }

  // ---------- circuit symbols ----------
  function zigzag(ctx, x, y, w, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y);
    for (var k = 1; k <= 6; k++) ctx.lineTo(x + w * k / 6.5, y + (k % 2 ? -6 : 6));
    ctx.lineTo(x + w, y); ctx.stroke(); ctx.restore();
  }
  function coil(ctx, x, y, w, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    var r = w / 8;
    for (var k = 0; k < 4; k++) ctx.arc(x + r + k * 2 * r, y, r, Math.PI, 0);
    ctx.stroke(); ctx.restore();
  }
  function plates(ctx, x, y, w, col, variable) {
    var m = x + w / 2;
    D.line(ctx, x, y, m - 3, y, col, 2); D.line(ctx, m + 3, y, x + w, y, col, 2);
    D.line(ctx, m - 3, y - 10, m - 3, y + 10, col, 3); D.line(ctx, m + 3, y - 10, m + 3, y + 10, col, 3);
    if (variable) D.arrow(ctx, m - 11, y + 11, m + 12, y - 13, col, 1.5, 6);
  }

  function circuit(ctx, c, b, sim, q, isRadio) {
    var narrow = b.w < 300, fs = narrow ? 10 : 11;
    var x0 = b.x + (narrow ? 18 : 26), x1 = b.x + b.w - 8, y0 = b.y + 30, y1 = b.y + b.h - (narrow ? 26 : 30);
    var glow = isRadio ? 0.5 : M.clamp(q.I / 1, 0, 1), wire = D.alpha(c.s1, 0.3 + 0.7 * glow);
    var cw = Math.min(narrow ? 30 : 40, (x1 - x0) / 5), xs = [0.24, 0.53, 0.82].map(function (k) { return x0 + (x1 - x0) * k - cw / 2; });
    var cols = [c.s3, c.s2, c.s4];
    // top wire with gaps for the parts
    D.line(ctx, x0, y0, xs[0], y0, wire, 2 + glow * 2);
    D.line(ctx, xs[0] + cw, y0, xs[1], y0, wire, 2 + glow * 2);
    D.line(ctx, xs[1] + cw, y0, xs[2], y0, wire, 2 + glow * 2);
    D.line(ctx, xs[2] + cw, y0, x1, y0, wire, 2 + glow * 2);
    D.line(ctx, x1, y0, x1, y1, wire, 2 + glow * 2);
    var my = (y0 + y1) / 2, mx = (x0 + x1) / 2;
    zigzag(ctx, xs[0], y0, cw, cols[0]);
    coil(ctx, xs[1], y0, cw, cols[1]);
    plates(ctx, xs[2], y0, cw, cols[2], isRadio);
    var names = isRadio ? ['R ' + RR + ' Ω', 'L 0.1 µH', 'C ' + M.fmt(sim.p.tune, 1) + ' pF']
      : ['R ' + q.R + ' Ω', 'L ' + sim.p.L + ' mH', 'C ' + sim.p.C + ' µF'];
    names.forEach(function (t, i) { D.text(ctx, t, xs[i] + cw / 2, y0 - 17, { color: cols[i], size: fs, weight: 700, align: 'center' }); });
    if (!isRadio) {
      var vs = [q.I * q.R, q.I * q.XL, q.I * q.XC], lab2 = ['VR', 'VL', 'VC'];
      vs.forEach(function (v, i) { D.text(ctx, lab2[i] + ' ' + M.fmt(v, v < 10 ? 1 : 0) + ' V', xs[i] + cw / 2, y0 + 17, { color: cols[i], size: fs, weight: 700, align: 'center' }); });
      // supply on the left side, ammeter on the bottom wire
      D.line(ctx, x0, y0, x0, my - 12, wire, 2 + glow * 2); D.line(ctx, x0, my + 12, x0, y1, wire, 2 + glow * 2);
      D.circle(ctx, x0, my, 12, c.bg, c.s1, 2);
      D.curve(ctx, function (px) { return my - 4 * Math.sin((px - x0 + 7) / 14 * TAU); }, x0 - 7, x0 + 7, c.s1, 1.6, 1);
      D.text(ctx, VS + ' V', x0 + 16, my - 6, { color: c.s1, size: fs, weight: 700 });
      D.text(ctx, M.fmt(q.f, 0) + ' Hz', x0 + 16, my + 8, { color: c.s1, size: fs, weight: 700 });
      D.line(ctx, x0, y1, mx - 11, y1, wire, 2 + glow * 2); D.line(ctx, mx + 11, y1, x1, y1, wire, 2 + glow * 2);
      D.circle(ctx, mx, y1, 11, c.bg, c.ink, 1.5);
      D.text(ctx, 'A', mx, y1, { color: c.ink, size: 11, weight: 800, align: 'center' });
      D.text(ctx, 'I = ' + M.fmt(q.I, q.I < 0.1 ? 3 : 2) + ' A', mx, y1 + 19, { color: c.ink, size: fs + 1, weight: 700, align: 'center' });
    } else {
      // aerial on the left, amplifier and speaker on the bottom wire
      D.line(ctx, x0, y0, x0, y1, wire, 2);
      D.line(ctx, x0, y0, x0, b.y + 6, c.muted, 2);
      D.line(ctx, x0 - 8, b.y + 6, x0, b.y + 16, c.muted, 2); D.line(ctx, x0 + 8, b.y + 6, x0, b.y + 16, c.muted, 2);
      D.text(ctx, narrow ? 'aerial' : 'aerial: all stations', x0 + 10, my - 4, { color: c.muted, size: fs });
      D.line(ctx, x0, y1, mx - 22, y1, wire, 2); D.line(ctx, mx + 22, y1, x1, y1, wire, 2);
      D.roundRect(ctx, mx - 22, y1 - 10, 44, 20, 5, c.bg, c.ink, 1.5);
      D.text(ctx, 'amp', mx, y1, { color: c.ink, size: 10, weight: 700, align: 'center' });
      D.text(ctx, 'to the speaker', mx, y1 + 19, { color: c.muted, size: fs, align: 'center' });
    }
  }

  function phasors(ctx, c, b, q) {
    var fs = b.w < 200 ? 10 : 11, VR = q.I * q.R, VL = q.I * q.XL, VC = q.I * q.XC, Vnet = VL - VC;
    D.text(ctx, 'Phasors (rms volts)', b.x + 4, b.y + 8, { color: c.muted, size: fs, weight: 700 });
    var ox = b.x + 14, oy = b.y + b.h / 2 + 6, big = Math.max(VL, VC, VS);
    var k = Math.min((b.h / 2 - 20) / big, (b.w - 70) / VS);
    D.line(ctx, ox, oy, b.x + b.w - 6, oy, c.grid, 1, [3, 4]);
    D.text(ctx, 'I', b.x + b.w - 8, oy - 9, { color: c.muted, size: fs, weight: 700, align: 'right' });
    var Ax = ox + VR * k, By = oy - VL * k, Ty = oy - Vnet * k;
    D.arrow(ctx, ox, oy, Ax, oy, c.s3, 3, 8);
    D.arrow(ctx, Ax, oy, Ax, By, c.s2, 3, 9);
    D.arrow(ctx, Ax + 7, By, Ax + 7, By + VC * k, c.s4, 3, 9);
    D.arrow(ctx, ox, oy, Ax, Ty, c.s1, 3.5, 10);
    D.text(ctx, 'VR', (ox + Ax) / 2, oy + 10, { color: c.s3, size: fs, weight: 700, align: 'center' });
    D.text(ctx, 'VL', Ax - 5, (oy + By) / 2, { color: c.s2, size: fs, weight: 700, align: 'right' });
    D.text(ctx, 'VC', Ax + 13, By + VC * k / 2, { color: c.s4, size: fs, weight: 700 });
    var vlx = Ax + 14, vly = Ty + (Vnet > 0 ? -8 : 8);
    D.text(ctx, 'V = ' + VS + ' V', Math.max(vlx, ox + 30), Math.abs(Vnet * k) < 10 ? oy - 22 : vly, { color: c.s1, size: fs, weight: 800, fit: b.x + b.w });
    var deg = M.deg(q.phi);
    D.text(ctx, Math.abs(deg) < 0.5 ? 'φ = 0°: V in step with I' : 'φ = ' + M.fmt(Math.abs(deg), 0) + '°' + (deg > 0 ? ' (I lags)' : ' (I leads)'), b.x + 4, b.y + b.h - 6, { color: c.ink, size: fs, weight: 600, fit: b.x + b.w });
  }

  function radioPanel(ctx, c, b, rq) {
    var fs = b.w < 200 ? 10 : 11;
    D.text(ctx, 'Tuned to', b.x + 4, b.y + 8, { color: c.muted, size: fs, weight: 700 });
    D.text(ctx, M.fmt(rq.f0, 1) + ' MHz', b.x + 4, b.y + 28, { color: c.s1, size: b.w < 200 ? 18 : 22, weight: 800 });
    var top = b.y + 48, rowH = Math.min(22, (b.h - 54) / STATIONS.length), bw = b.w - 70;
    STATIONS.forEach(function (fm, i) {
      var y = top + i * rowH + rowH / 2, s = rq.sh[i], col = s >= 0.7 ? c.success : s >= 0.3 ? c.warning : c.faint;
      D.text(ctx, 'FM ' + fm, b.x + 4, y, { color: i === rq.best && s > 0.35 ? c.ink : c.muted, size: fs, weight: i === rq.best ? 700 : 500 });
      D.roundRect(ctx, b.x + 62, y - rowH * 0.3, bw, rowH * 0.6, 3, D.alpha(c.ink, 0.06));
      if (s * bw > 1) D.roundRect(ctx, b.x + 62, y - rowH * 0.3, s * bw, rowH * 0.6, 3, col);
    });
  }

  function labCurve(ctx, c, g, q) {
    var lg = Math.log(FHI / FLO);
    function X(f) { return g.x + Math.log(f / FLO) / lg * g.w; }
    function Y(i) { return g.y + g.h - Math.min(i, IMAX) / IMAX * g.h; }
    D.line(ctx, g.x, g.y + g.h, g.x + g.w, g.y + g.h, c.axis, 1);
    D.line(ctx, g.x, g.y - 4, g.x, g.y + g.h, c.axis, 1);
    [0.25, 0.5, 0.75, 1].forEach(function (v) {
      D.line(ctx, g.x, Y(v), g.x + g.w, Y(v), c.grid, 1);
      D.text(ctx, M.fmt(v, 2), g.x - 4, Y(v), { color: c.faint, size: 9, align: 'right' });
    });
    [10, 20, 50, 100, 200, 500, 1000].forEach(function (f) {
      D.line(ctx, X(f), g.y + g.h, X(f), g.y + g.h + 4, c.axis, 1);
      D.text(ctx, String(f), X(f), g.y + g.h + 12, { color: c.faint, size: 9, align: 'center' });
    });
    D.text(ctx, 'Frequency f (Hz, log scale)', g.x + g.w, g.y + g.h + 25, { color: c.muted, size: 10, align: 'right' });
    D.text(ctx, 'I (A)', g.x - 4, g.y - 10, { color: c.muted, size: 10, weight: 700, align: 'right' });
    // half-power band
    if (q.f1 > FLO && q.f2 < FHI) {
      ctx.fillStyle = D.alpha(c.s1, 0.1); ctx.fillRect(X(q.f1), g.y, X(q.f2) - X(q.f1), g.h);
      var yh = Y(q.I0 / Math.SQRT2);
      D.line(ctx, X(q.f1), yh, X(q.f2), yh, c.s1, 1.5);
      D.text(ctx, 'Δf ' + M.fmt(q.bw, q.bw < 10 ? 1 : 0) + ' Hz', X(q.f2) + 4, yh, { color: c.s1, size: 9, weight: 700, fit: g.x + g.w });
    }
    ctx.beginPath(); ctx.moveTo(g.x, g.y + g.h);
    for (var px = g.x; px <= g.x + g.w; px += 1.5) ctx.lineTo(px, Y(iAt(q, FLO * Math.exp((px - g.x) / g.w * lg))));
    ctx.lineTo(g.x + g.w, g.y + g.h); ctx.closePath(); ctx.fillStyle = D.alpha(c.s1, 0.12); ctx.fill();
    D.curve(ctx, function (px) { return Y(iAt(q, FLO * Math.exp((px - g.x) / g.w * lg))); }, g.x, g.x + g.w, c.s1, 2.5, 1.5);
    if (q.f0 >= FLO && q.f0 <= FHI) {
      D.line(ctx, X(q.f0), g.y, X(q.f0), g.y + g.h, c.s2, 1.2, [5, 4]);
      D.text(ctx, 'f₀ = ' + M.fmt(q.f0, 0) + ' Hz', X(q.f0), g.y - 8, { color: c.s2, size: 10, weight: 700, align: 'center', fit: g.x + g.w + 10 });
    }
    var fx = X(q.f), fy = Y(q.I);
    D.line(ctx, fx, fy, fx, g.y + g.h, c.ink, 1, [2, 3]);
    D.circle(ctx, fx, fy, 6, c.warning, c.bg, 2);
    if (q.I > IMAX) D.text(ctx, 'off scale ↑', fx + 8, g.y + 6, { color: c.warning, size: 9, weight: 700, fit: g.x + g.w });
  }

  function radioCurve(ctx, c, g, rq) {
    function X(f) { return g.x + (f - RLO) / (RHI - RLO) * g.w; }
    function Y(s) { return g.y + g.h - s * g.h; }
    D.line(ctx, g.x, g.y + g.h, g.x + g.w, g.y + g.h, c.axis, 1);
    D.line(ctx, g.x, g.y - 4, g.x, g.y + g.h, c.axis, 1);
    [0.5, 1].forEach(function (v) {
      D.line(ctx, g.x, Y(v), g.x + g.w, Y(v), c.grid, 1);
      D.text(ctx, (v * 100) + '%', g.x - 4, Y(v), { color: c.faint, size: 9, align: 'right' });
    });
    for (var f = 88; f <= 110; f += 2) {
      D.line(ctx, X(f), g.y + g.h, X(f), g.y + g.h + 4, c.axis, 1);
      if (f % 4 === 0 || g.w > 420) D.text(ctx, String(f), X(f), g.y + g.h + 12, { color: c.faint, size: 9, align: 'center' });
    }
    D.text(ctx, 'Frequency (MHz)', g.x + g.w, g.y + g.h + 25, { color: c.muted, size: 10, align: 'right' });
    D.text(ctx, 'gets through', g.x + 4, g.y - 10, { color: c.muted, size: 10, weight: 700 });
    STATIONS.forEach(function (fm, i) {
      var s = rq.sh[i], col = s >= 0.7 ? c.success : s >= 0.3 ? c.warning : c.faint;
      ctx.fillStyle = D.alpha(col, 0.85); ctx.fillRect(X(fm) - 4, Y(s), 8, s * g.h);
      D.line(ctx, X(fm), g.y + 4, X(fm), g.y + g.h, D.alpha(c.muted, 0.35), 1, [2, 3]);
      D.text(ctx, String(fm), X(fm), g.y + (i % 2 ? 16 : 4), { color: col === c.faint ? c.muted : col, size: 9, weight: 700, align: 'center' });
    });
    D.curve(ctx, function (px) { return Y(rq.share(RLO + (px - g.x) / g.w * (RHI - RLO))); }, g.x, g.x + g.w, c.s1, 2.5, 1.5);
    var nx = X(rq.f0);
    if (nx >= g.x && nx <= g.x + g.w) {
      D.line(ctx, nx, g.y - 2, nx, g.y + g.h + 2, c.s2, 2.5);
      D.circle(ctx, nx, g.y + g.h, 4, c.s2);
    }
  }

  SimLab.createSim({
    ariaLabel: 'A series circuit of a resistor, a coil and a capacitor on an AC supply, with its phasor diagram and a graph of current against frequency that peaks at resonance. A radio mode tunes the same circuit to one of five FM stations',
    mobileAspect: '3 / 3.8',
    playLabel: 'Sweep',
    params: [
      { id: 'mode', label: 'Circuit', type: 'select', value: 'lab', options: [
        { value: 'lab', label: 'Lab: 10 V signal generator' },
        { value: 'radio', label: 'Radio: tune to an FM station' }] },
      { id: 'f', label: 'Supply frequency f (lab)', min: FLO, max: FHI, step: 1, value: 50, unit: 'Hz',
        presets: [{ label: 'Mains 50 Hz', value: 50 }, { label: '159 Hz', value: 159 }] },
      { id: 'R', label: 'Resistance R (lab)', min: 10, max: 100, step: 1, value: 20, unit: 'Ω' },
      { id: 'L', label: 'Inductance L (lab)', min: 20, max: 500, step: 5, value: 100, unit: 'mH' },
      { id: 'C', label: 'Capacitance C (lab)', min: 2, max: 50, step: 1, value: 10, unit: 'µF' },
      { id: 'tune', label: 'Radio tuning capacitor', min: 20, max: 34, step: 0.1, value: 26.2, unit: 'pF',
        help: 'Moving this switches to the radio. Moving a lab slider switches back.' }
    ],
    readouts: [
      { id: 'f0', label: 'Resonant frequency f₀ = 1/(2π√LC)', short: 'f₀', key: true },
      { id: 'i', label: 'Current (rms)', short: 'Current', key: true },
      { id: 'res', label: 'What is happening', short: 'Result', key: true },
      { id: 'xl', label: 'XL = 2πfL' },
      { id: 'xc', label: 'XC = 1/(2πfC)' },
      { id: 'z', label: 'Impedance Z = √(R² + (XL − XC)²)' },
      { id: 'vl', label: 'VL and VC (each)' },
      { id: 'q', label: 'Q factor = (1/R)√(L/C)' },
      { id: 'bw', label: 'Bandwidth Δf = R/(2πL)' }
    ],
    reset: function (sim) { sim.state = { lf: Math.log(sim.p.f), tune: sim.p.tune }; },
    onParam: function (sim, id, v) {
      if (id === 'tune') { sim.state.tune = v; if (sim.p.mode !== 'radio') sim.setParam('mode', 'radio'); }
      else if (id === 'f' || id === 'R' || id === 'L' || id === 'C') {
        if (id === 'f') sim.state.lf = Math.log(v);
        if (sim.p.mode !== 'lab') sim.setParam('mode', 'lab');
      }
      return true;
    },
    update: function (sim, dt) {
      var s = sim.state;
      if (sim.p.mode === 'lab') {
        s.lf += dt * Math.log(FHI / FLO) / 16;
        if (s.lf > Math.log(FHI)) s.lf = Math.log(FLO);
        var f = Math.round(Math.exp(s.lf));
        if (f !== sim.p.f) sim.setParam('f', f);
      } else {
        s.tune -= dt * 0.8;
        if (s.tune < 20) s.tune = 34;
        var t = Math.round(s.tune * 10) / 10;
        if (t !== sim.p.tune) sim.setParam('tune', t);
      }
    },
    readout: function (sim) {
      if (sim.p.mode === 'radio') {
        var rq = radio(sim), w0 = TAU * rq.f0 * 1e6, X = w0 * RL;
        return { f0: M.fmt(rq.f0, 1) + ' MHz', i: M.fmt(rq.sh[rq.best] * 100, 0) + ' % of FM ' + STATIONS[rq.best], res: rq.verdict,
          xl: M.fmt(X, 0) + ' Ω at f₀', xc: M.fmt(X, 0) + ' Ω at f₀', z: RR + ' Ω at f₀', vl: '—', q: M.fmt(rq.Q, 0), bw: M.fmt(rq.f0 / rq.Q, 1) + ' MHz' };
      }
      var q = lab(sim), d = (q.f - q.f0) / q.f0, deg = Math.abs(M.deg(q.phi));
      var res = Math.abs(d) < 0.01 ? 'resonance: Z = R, I largest' : d < 0 ? 'below f₀: XC > XL, I leads ' + M.fmt(deg, 0) + '°' : 'above f₀: XL > XC, I lags ' + M.fmt(deg, 0) + '°';
      var vl = q.I * q.XL, vc = q.I * q.XC;
      return { f0: M.fmt(q.f0, 1) + ' Hz', i: M.fmt(q.I, q.I < 0.1 ? 3 : 2) + ' A', res: res,
        xl: M.fmt(q.XL, 1) + ' Ω', xc: M.fmt(q.XC, 1) + ' Ω', z: M.fmt(q.Z, 1) + ' Ω',
        vl: M.fmt(vl, 1) + ' V and ' + M.fmt(vc, 1) + ' V', q: M.fmt(q.Q, 1), bw: M.fmt(q.bw, 1) + ' Hz' };
    },
    status: function (sim) { return sim.p.mode === 'radio' ? 'Turning the tuning knob' : 'Sweeping the frequency'; },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, narrow = W < 560, isRadio = sim.p.mode === 'radio';
      D.clear(ctx, W, H, c.bg);
      var topH = Math.round(H * (narrow ? 0.47 : 0.45)), split = Math.round(W * (narrow ? 0.56 : 0.55));
      var cb = { x: 4, y: 4, w: split - 8, h: topH - 6 }, pb = { x: split + 6, y: 6, w: W - split - 12, h: topH - 8 };
      var g = { x: narrow ? 40 : 54, y: topH + 24, w: 0, h: 0 };
      g.w = W - g.x - (narrow ? 12 : 22); g.h = H - g.y - 34;
      D.line(ctx, 8, topH, W - 8, topH, c.grid, 1);
      if (isRadio) {
        var rq = radio(sim);
        circuit(ctx, c, cb, sim, null, true);
        radioPanel(ctx, c, pb, rq);
        radioCurve(ctx, c, g, rq);
      } else {
        var q = lab(sim);
        q.I0 = VS / q.R;
        circuit(ctx, c, cb, sim, q, false);
        phasors(ctx, c, pb, q);
        labCurve(ctx, c, g, q);
      }
    }
  });
})();
