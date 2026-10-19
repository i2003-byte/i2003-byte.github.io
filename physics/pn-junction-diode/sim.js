/* =====================================================================
   Electricity · p-n Junction Diode — sim.js
   ---------------------------------------------------------------------
   A diode in series with a 100 Ω resistor on a variable supply Vs.
   Diode current (Shockley equation plus a small reverse leakage):
     I = Is·(e^(V/VT) − 1) + V/R_leak,  VT = kT/e = 25.85 mV at 300 K
     silicon:   Is = 1.75×10⁻¹⁴ A → 1 mA at 0.64 V, 10 mA at 0.70 V
     germanium: Is = 1×10⁻⁷ A    → 10 mA at 0.30 V
   The diode voltage V is found from Vs = I·R + V by bisection.
   Depletion width w ∝ √(Vbi − V) (abrupt junction), Vbi ≈ 0.75 V (Si),
   0.40 V (Ge); w ≈ 0.5 µm at 0 V is a typical size, not exact.
   Holes (p side) and free electrons (n side) are drawn as particles;
   under forward bias they drift across and recombine.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var VT = 0.02585, RS = 100;
  var MAT = {
    si: { Is: 1.75e-14, Rl: 1e9, Vbi: 0.75, w0: 0.5, knee: 0.7, name: 'Silicon' },
    ge: { Is: 1e-7, Rl: 5e6, Vbi: 0.40, w0: 0.7, knee: 0.3, name: 'Germanium' }
  };
  var st = { holes: [], elec: [], flashes: [], lastT: 0, sweep: false, V: 0, I: 0, rng: M.rng(7) };

  function mat(sim) { return MAT[sim.p.mat] || MAT.si; }
  function diodeI(m, V) { return m.Is * (Math.exp(Math.min(V, 1.2) / VT) - 1) + V / m.Rl; }
  function solve(sim) {
    var m = mat(sim), Vs = sim.p.vs, lo = Math.min(Vs, 0) - 0.01, hi = Math.max(Vs, 0) + 0.01;
    for (var k = 0; k < 80; k++) { var mid = (lo + hi) / 2; if (diodeI(m, mid) - (Vs - mid) / RS > 0) hi = mid; else lo = mid; }
    st.V = (lo + hi) / 2; st.I = diodeI(m, st.V);
  }
  function width(sim) { var m = mat(sim); return Math.sqrt(Math.max(m.Vbi - st.V, 0.012) / m.Vbi); }   // relative to 0 V
  function fmtI(A) {
    var a = Math.abs(A);
    if (a >= 1e-3) return M.fmt(A * 1e3, a >= 0.01 ? 1 : 2) + ' mA';
    if (a >= 1e-6) return M.fmt(A * 1e6, a >= 1e-5 ? 1 : 2) + ' µA';
    if (a >= 1e-9) return M.fmt(A * 1e9, 1) + ' nA';
    return a < 1e-12 ? '0' : M.fmt(A * 1e12, 0) + ' pA';
  }
  function spawn() {
    var r = st.rng; st.holes = []; st.elec = [];
    for (var i = 0; i < 46; i++) {
      st.holes.push({ x: r() * 0.5, y: 0.08 + r() * 0.84, d: 0 });
      st.elec.push({ x: 0.5 + r() * 0.5, y: 0.08 + r() * 0.84, d: 0 });
    }
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.1, C, G;
    if (wide) { var cw = W * 0.56; C = { x: 6, y: 6, w: cw - 12, h: H - 12 }; G = { x: cw + 4, y: 10, w: W - cw - 14, h: H - 20 }; }
    else { var ch = H * 0.56; C = { x: 6, y: 4, w: W - 12, h: ch - 6 }; G = { x: 6, y: ch + 2, w: W - 12, h: H - ch - 6 }; }
    var bw = C.w * 0.78, bh = M.clamp(C.h * 0.38, 60, 170);
    return { W: W, H: H, C: C, G: G, bar: { x: C.x + (C.w - bw) / 2, y: C.y + Math.max(44, C.h * 0.15), w: bw, h: bh }, narrow: W < 560 };
  }

  // move the carriers by dt seconds (drift speed grows with log of current)
  function step(sim, dt) {
    var w = width(sim) * 0.16, jl = 0.5 - w / 2, jr = 0.5 + w / 2, r = st.rng;
    var fwd = st.I > 1e-6 ? M.clamp(Math.log10(st.I / 1e-6) / 4, 0, 1.2) : 0, v = 0.12 * fwd;
    function jig(p) { p.x += (r() - 0.5) * 0.012; p.y = M.clamp(p.y + (r() - 0.5) * 0.02, 0.06, 0.94); }
    st.holes.forEach(function (p) {
      jig(p);
      if (v) {
        p.x += v * dt * (0.7 + r() * 0.6);
        if (p.x > jr && !p.d) p.d = jr + 0.04 + r() * 0.2;
        if (p.d && p.x > p.d) { st.flashes.push({ x: p.x, y: p.y, t: 0 }); p.x = r() * 0.03; p.d = 0; }
      } else if (p.x > jl - 0.01) p.x = jl - 0.01 - r() * 0.02;
      p.x = Math.max(0.01, p.x);
    });
    st.elec.forEach(function (p) {
      jig(p);
      if (v) {
        p.x -= v * dt * (0.7 + r() * 0.6);
        if (p.x < jl && !p.d) p.d = jl - 0.04 - r() * 0.2;
        if (p.d && p.x < p.d) { st.flashes.push({ x: p.x, y: p.y, t: 0 }); p.x = 1 - r() * 0.03; p.d = 0; }
      } else if (p.x < jr + 0.01) p.x = jr + 0.01 + r() * 0.02;
      p.x = Math.min(0.99, p.x);
    });
    st.flashes.forEach(function (f) { f.t += dt; });
    st.flashes = st.flashes.filter(function (f) { return f.t < 0.35; }).slice(-40);
  }

  function battery(ctx, c, x, y, Vs, sz) {
    // long thin plate = +, short thick plate = −; + faces the p side (left) when Vs ≥ 0
    var pos = Vs >= 0, Lx = x - 7, Rx = x + 7;
    D.line(ctx, Lx, y - (pos ? sz : sz * 0.55), Lx, y + (pos ? sz : sz * 0.55), c.ink, pos ? 2.5 : 5);
    D.line(ctx, Rx, y - (pos ? sz * 0.55 : sz), Rx, y + (pos ? sz * 0.55 : sz), c.ink, pos ? 5 : 2.5);
    D.text(ctx, '+', pos ? Lx - 9 : Rx + 9, y - sz + 2, { color: c.danger, size: 13, weight: 800, align: 'center' });
    D.text(ctx, '−', pos ? Rx + 9 : Lx - 9, y - sz + 2, { color: c.s1, size: 13, weight: 800, align: 'center' });
  }

  function drawCircuit(ctx, c, L, sim) {
    var B = L.bar, C = L.C, m = mat(sim), wRel = width(sim), w = wRel * 0.16;
    var jl = B.x + B.w * (0.5 - w / 2), jr = B.x + B.w * (0.5 + w / 2), fs = L.narrow ? 11 : 13;
    // regions
    D.roundRect(ctx, B.x, B.y, B.w / 2, B.h, 0, D.alpha(c.s2, 0.12));
    D.roundRect(ctx, B.x + B.w / 2, B.y, B.w / 2, B.h, 0, D.alpha(c.s1, 0.12));
    D.roundRect(ctx, jl, B.y, jr - jl, B.h, 0, D.alpha(c.ink, 0.07));
    D.roundRect(ctx, B.x, B.y, B.w, B.h, 6, null, c.border, 1.5);
    D.line(ctx, B.x + B.w / 2, B.y, B.x + B.w / 2, B.y + B.h, D.alpha(c.ink, 0.25), 1, [3, 4]);
    // uncovered ions in the depletion layer
    var rows = Math.max(3, Math.round(B.h / 22)), cols = Math.max(1, Math.round((jr - jl) / 2 / 14));
    for (var i = 0; i < rows; i++) for (var j = 0; j < cols; j++) {
      var yy = B.y + (i + 0.5) * B.h / rows, dx = (j + 0.5) * (jr - jl) / 2 / cols;
      D.text(ctx, '−', jl + dx, yy, { color: c.s2, size: 13, weight: 800, align: 'center' });
      D.text(ctx, '+', B.x + B.w / 2 + dx, yy, { color: c.s1, size: 13, weight: 800, align: 'center' });
    }
    // barrier field arrow (from + ions to − ions) if the layer is wide enough
    if (jr - jl > 34) D.arrow(ctx, jr - 4, B.y + B.h + 9, jl + 4, B.y + B.h + 9, c.warning, 1.8, 7);
    // carriers
    var hr = M.clamp(B.h / 34, 2.5, 4.5);
    st.flashes.forEach(function (f) { D.circle(ctx, B.x + f.x * B.w, B.y + f.y * B.h, hr + 6 * f.t / 0.35, D.alpha(c.warning, 0.6 * (1 - f.t / 0.35))); });
    st.holes.forEach(function (p) { D.circle(ctx, B.x + p.x * B.w, B.y + p.y * B.h, hr, null, c.s2, 1.6); });
    st.elec.forEach(function (p) { D.circle(ctx, B.x + p.x * B.w, B.y + p.y * B.h, hr, c.s1); });
    D.text(ctx, 'p-type (holes ○)', B.x + 4, B.y - 11, { color: c.s2, size: fs, weight: 700 });
    D.text(ctx, '(electrons ●) n-type', B.x + B.w - 4, B.y - 11, { color: c.s1, size: fs, weight: 700, align: 'right' });
    D.text(ctx, 'depletion layer ≈ ' + M.fmt(m.w0 * wRel, 2) + ' µm', B.x + B.w / 2, B.y + B.h + 22, { color: c.muted, size: L.narrow ? 10 : 11.5, align: 'center', fit: L.W });

    // wires and supply
    var yb = Math.min(C.y + C.h - 16, B.y + B.h + 34 + Math.max(20, (C.y + C.h - B.y - B.h - 50) * 0.5));
    var lx = B.x - 10, rx = B.x + B.w + 10, flowing = st.I > 1e-4;
    var wc = flowing ? c.warning : c.ink;
    D.line(ctx, B.x, B.y + B.h / 2, lx, B.y + B.h / 2, wc, 2);
    D.line(ctx, B.x + B.w, B.y + B.h / 2, rx, B.y + B.h / 2, wc, 2);
    D.line(ctx, lx, B.y + B.h / 2, lx, yb, wc, 2);
    D.line(ctx, rx, B.y + B.h / 2, rx, yb, wc, 2);
    var bx = B.x + B.w * 0.3, rxm = B.x + B.w * 0.7;
    D.line(ctx, lx, yb, bx - 12, yb, wc, 2);
    D.line(ctx, bx + 12, yb, rxm - 22, yb, wc, 2);
    D.line(ctx, rxm + 22, yb, rx, yb, wc, 2);
    battery(ctx, c, bx, yb, sim.p.vs, 11);
    D.roundRect(ctx, rxm - 22, yb - 6, 44, 12, 3, D.alpha(c.ink, 0.1), c.ink, 1.5);
    D.text(ctx, '100 Ω', rxm, yb + 17, { color: c.muted, size: 10.5, align: 'center' });
    D.text(ctx, 'Vs = ' + M.fmt(sim.p.vs, 2) + ' V', bx, yb + 21, { color: c.ink, size: fs, weight: 700, align: 'center' });
    // conventional current: + terminal → p → n
    if (flowing) {
      // on the bottom wire the current runs from the resistor back to the battery's − plate
      var amx = (bx + rxm) / 2;
      D.arrow(ctx, amx + 16, yb, amx - 16, yb, c.warning, 2.5, 9);
      D.text(ctx, 'I = ' + fmtI(st.I), amx + 12, yb - 13, { color: c.warning, size: fs, weight: 800, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2 });
    }
    var bias = st.V > 0.02 ? (st.I > 1e-4 ? 'Forward bias: barrier overcome, current flows' : 'Forward bias, but below the knee: tiny current') : st.V < -0.02 ? 'Reverse bias: layer widens, almost no current' : 'No bias: the barrier stops carriers crossing';
    D.text(ctx, bias, C.x + C.w / 2, C.y + 9, { color: st.I > 1e-4 ? c.success : st.V < -0.02 ? c.danger : c.muted, size: fs, weight: 700, align: 'center', fit: L.W });
  }

  function drawIV(ctx, c, G, sim) {
    var m = mat(sim), Vmax = m.knee + 0.3, Imax = 0.05, Vmin = -10;
    var Ir = Math.abs(diodeI(m, Vmin)) * 1.25;
    var ox = G.x + G.w * 0.5, oy = G.y + G.h * 0.7, fw = G.x + G.w - 8 - ox, rw = ox - G.x - 8, up = oy - G.y - 16, dn = G.y + G.h - 16 - oy;
    function X(V) { return V >= 0 ? ox + V / Vmax * fw : ox + V / -Vmin * rw; }
    function Y(I) { return I >= 0 ? oy - Math.min(I / Imax, 1.05) * up : oy + Math.min(-I / Ir, 1.05) * dn; }
    D.roundRect(ctx, G.x, G.y, G.w, G.h, 10, D.alpha(c.ink, 0.03), D.alpha(c.ink, 0.1));
    D.arrow(ctx, G.x + 6, oy, G.x + G.w - 4, oy, c.axis, 1.4, 6);
    D.arrow(ctx, ox, G.y + G.h - 6, ox, G.y + 6, c.axis, 1.4, 6);
    var fs = 10;
    D.text(ctx, 'I (mA)', ox + 5, G.y + 10, { color: c.muted, size: fs });
    D.text(ctx, 'V (volts)', G.x + G.w - 6, oy - 10, { color: c.muted, size: fs, align: 'right' });
    D.text(ctx, '50', ox - 4, Y(0.05), { color: c.faint, size: fs, align: 'right' });
    D.text(ctx, Vmax.toFixed(1), X(Vmax), oy + 11, { color: c.faint, size: fs, align: 'center' });
    D.text(ctx, '−10', X(-10), oy - 9, { color: c.faint, size: fs, align: 'center' });
    D.text(ctx, '−5', X(-5), oy - 9, { color: c.faint, size: fs, align: 'center' });
    D.text(ctx, '−' + fmtI(Ir / 1.25).replace('−', ''), ox + 4, Y(-Ir / 1.25), { color: c.faint, size: fs });
    D.text(ctx, 'reverse: µA/nA scale', G.x + 8, G.y + G.h - 9, { color: c.faint, size: 9.5 });
    D.line(ctx, X(m.knee), oy, X(m.knee), G.y + 8, D.alpha(c.warning, 0.6), 1, [4, 4]);
    D.text(ctx, 'knee ≈ ' + m.knee + ' V', X(m.knee) - 4, G.y + 22, { color: c.warning, size: fs, align: 'right' });
    // reverse part (100 points over −10…0 V), then the forward part finely
    ctx.save(); ctx.strokeStyle = c.s4; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
    for (var k = 0; k <= 220; k++) {
      var V = k <= 100 ? Vmin * (1 - k / 100) : Vmax * (k - 100) / 120, px = X(V), py = Y(diodeI(m, V));
      if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke(); ctx.restore();
    var dp = { x: X(st.V), y: Y(st.I) };
    D.circle(ctx, dp.x, dp.y, 9, D.alpha(c.danger, 0.25));
    D.circle(ctx, dp.x, dp.y, 5, c.danger, c.bg, 1.5);
  }

  SimLab.createSim({
    ariaLabel: 'A p-n junction diode in series with a 100 ohm resistor on a variable battery. Holes on the p side and electrons on the n side, a depletion layer of fixed ions that narrows in forward bias and widens in reverse bias, and the current–voltage curve with the working point',
    transport: false,
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'vs', label: 'Supply voltage Vs', min: -10, max: 5, step: 0.05, value: 0, unit: 'V', presets: [-10, -2, 0, 0.5, 0.8, 1.5, 5], help: 'Positive: + terminal to the p side (forward bias).' },
      { id: 'mat', label: 'Diode made of', type: 'select', value: 'si', options: [{ value: 'si', label: 'Silicon (knee ≈ 0.7 V)' }, { value: 'ge', label: 'Germanium (knee ≈ 0.3 V)' }] }
    ],
    buttons: [{ label: 'Sweep −10 V → +5 V', primary: true, onClick: function (sim) { st.sweep = true; sim.setParam('vs', -10); solve(sim); st.lastT = 0; } }],
    readouts: [
      { id: 'vd', label: 'Voltage across the diode', short: 'V diode', unit: 'V', digits: 3, key: true },
      { id: 'i', label: 'Current', key: true },
      { id: 'bias', label: 'Bias' },
      { id: 'w', label: 'Depletion layer', unit: 'µm', digits: 2 },
      { id: 'vr', label: 'Voltage across 100 Ω', unit: 'V', digits: 2 }
    ],
    reset: function (sim) { solve(sim); if (!st.holes.length) spawn(); },
    onParam: function (sim, id) { if (id === 'vs') st.sweep = false; solve(sim); return true; },
    readout: function (sim) {
      return { vd: st.V, i: fmtI(st.I), bias: st.V > 0.02 ? 'forward' : st.V < -0.02 ? 'reverse' : 'none', w: mat(sim).w0 * width(sim), vr: st.I * RS };
    },
    status: function (sim) { return mat(sim).name + ' diode · ' + (st.V > 0.02 ? 'forward bias' : st.V < -0.02 ? 'reverse bias' : 'no bias'); },
    animate: function (sim) { return st.sweep || !sim.reduceMotion; },
    draw: function (sim, now) {
      var dt = st.lastT ? Math.min((now - st.lastT) / 1000, 0.05) : 0; st.lastT = now;
      if (st.sweep && dt) {
        var nv = sim.p.vs + dt * (sim.p.vs < 0 ? 2.5 : sim.p.vs < 1.2 ? 0.35 : 2);
        if (nv >= 5) { nv = 5; st.sweep = false; }
        sim.setParam('vs', Math.round(nv * 1000) / 1000); solve(sim);
      }
      if (!sim.reduceMotion || st.sweep) step(sim, dt); else step(sim, 0);
      var ctx = sim.ctx, c = sim.colors, L = layout(sim);
      D.clear(ctx, L.W, L.H, c.bg);
      drawCircuit(ctx, c, L, sim);
      drawIV(ctx, c, L.G, sim);
    }
  });
})();
