/* =====================================================================
   Kinetic theory · Speeds of Gas Molecules — sim.js
   ---------------------------------------------------------------------
   N hard spheres in a thin flat box (a slab), seen from above. Each
   molecule has x, y (drawn) and a hidden depth z, with velocity
   (vx, vy, vz). Collisions are full 3-D elastic collisions between
   equal spheres, so energy is shared between all three directions and
   the speeds settle into the real 3-D Maxwell distribution:
     f(v) = 4π (M / 2πRT)^{3/2} v² exp(−M v² / 2RT)
   Speeds are drawn 1000× slower than real (v_real = 1000 × box/s).
   The mean of v² is set exactly to 3RT/M (v_rms²) and rescaled when T
   or the gas changes; collisions keep it constant.
   "Same speed" start: every molecule gets speed v_rms in a random 3-D
   direction, so the histogram starts as one spike and spreads out.
   The histogram is smoothed over about one second of samples.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var R = 8.314, SCALE = 1000, RAD = 0.012, ZD = 5 * RAD, NB = 24, TAU = 1.2;
  var GASES = { he: { M: 0.004, name: 'Helium' }, n2: { M: 0.028, name: 'Nitrogen' }, o2: { M: 0.032, name: 'Oxygen' }, co2: { M: 0.044, name: 'Carbon dioxide' } };
  var CMP = {
    off: null,
    hot: { k: 2, label: 'same gas at 2T' },
    cold: { k: 0.5, label: 'same gas at T/2' },
    he: { gas: 'he', label: 'helium at T' },
    co2: { gas: 'co2', label: 'CO₂ at T' }
  };

  function gasOf(id) { return GASES[id] || GASES.n2; }
  function vp(T, Mm) { return Math.sqrt(2 * R * T / Mm); }
  function vmean(T, Mm) { return Math.sqrt(8 * R * T / (Math.PI * Mm)); }
  function vrms(T, Mm) { return Math.sqrt(3 * R * T / Mm); }
  function maxwell(v, T, Mm) { var a = Mm / (2 * R * T); return 4 * Math.PI * Math.pow(a / Math.PI, 1.5) * v * v * Math.exp(-a * v * v); }
  function fracAbove(v0, T, Mm) { // share of molecules faster than v0 (exact form)
    var x = v0 / vp(T, Mm);
    return 1 - erf(x) + 2 / Math.sqrt(Math.PI) * x * Math.exp(-x * x);
  }
  function erf(x) { // Abramowitz–Stegun 7.1.26
    var t = 1 / (1 + 0.3275911 * x);
    return 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  }
  function cmpCurve(p) {
    var c = CMP[p.cmp]; if (!c) return null;
    return { T: p.T * (c.k || 1), Mm: gasOf(c.gas || p.gas).M, label: c.label };
  }
  function gauss(rnd) { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
  function rescale(s, p) {
    var target = Math.pow(vrms(p.T, gasOf(p.gas).M) / SCALE, 2), sum = 0;
    s.mol.forEach(function (m) { sum += m.vx * m.vx + m.vy * m.vy + m.vz * m.vz; });
    var k = Math.sqrt(target / (sum / s.mol.length || 1));
    s.mol.forEach(function (m) { m.vx *= k; m.vy *= k; m.vz *= k; });
  }
  function sameSpeed(s, p, rnd) {
    var v = vrms(p.T, gasOf(p.gas).M) / SCALE;
    s.mol.forEach(function (m) {
      var x = gauss(rnd), y = gauss(rnd), z = gauss(rnd), l = Math.hypot(x, y, z) || 1;
      m.vx = v * x / l; m.vy = v * y / l; m.vz = v * z / l;
    });
    s.hist = null; s.spike = true;
  }
  function axisMax(p) {
    var top = vp(p.T, gasOf(p.gas).M), c = cmpCurve(p);
    if (c) top = Math.max(top, vp(c.T, c.Mm));
    var raw = top * 3, st = D.niceStep(raw, 4);
    return Math.ceil(raw / st) * st;
  }
  function speeds(s) { return s.mol.map(function (m) { return Math.hypot(m.vx, m.vy, m.vz) * SCALE; }); }
  function stats(s) {
    var v = speeds(s), n = v.length, a = 0, b = 0;
    v.forEach(function (x) { a += x; b += x * x; });
    a /= n; b /= n;
    return { mean: a, rms: Math.sqrt(b), sd: Math.sqrt(Math.max(0, b - a * a)), v: v };
  }

  SimLab.createSim({
    ariaLabel: 'Gas molecules in a box, coloured by speed, beside a bar chart of how many molecules have each speed; the bars settle into the Maxwell speed curve',
    mobileAspect: '3 / 4',
    playLabel: 'Release the molecules',
    params: [
      { id: 'T', label: 'Temperature T', min: 100, max: 800, step: 10, value: 300, unit: 'K',
        presets: [{ label: '150 K', value: 150 }, { label: '300 K', value: 300 }, { label: '600 K', value: 600 }] },
      { id: 'gas', label: 'Gas', type: 'select', value: 'n2', options: [
        { value: 'he', label: 'Helium (He, M = 4 g/mol)' }, { value: 'n2', label: 'Nitrogen (N₂, 28 g/mol)' },
        { value: 'o2', label: 'Oxygen (O₂, 32 g/mol)' }, { value: 'co2', label: 'Carbon dioxide (CO₂, 44 g/mol)' }] },
      { id: 'N', label: 'Number of molecules N', min: 50, max: 250, step: 10, value: 180,
        presets: [{ label: '80', value: 80 }, { label: '180', value: 180 }, { label: '250', value: 250 }] },
      { id: 'cmp', label: 'Compare with a second curve', type: 'select', value: 'off', options: [
        { value: 'off', label: 'No comparison' }, { value: 'hot', label: 'Same gas, double temperature' },
        { value: 'cold', label: 'Same gas, half temperature' }, { value: 'he', label: 'Helium at this temperature' },
        { value: 'co2', label: 'CO₂ at this temperature' }] },
      { id: 'marks', label: 'Mark v_p, v̄ and v_rms', type: 'toggle', value: true }
    ],
    buttons: [{ label: 'Give every molecule the same speed', primary: true, full: true,
      onClick: function (sim) { sameSpeed(sim.state, sim.p, M.rng(Math.floor(sim.time * 1000) + 3)); if (sim.graph) sim.graph.clear(); if (!sim.running) sim.play(); } }],
    readouts: [
      { id: 'vp', label: 'Most probable speed √(2RT/M)', short: 'v_p', unit: 'm/s', digits: 0, key: true },
      { id: 'vm', label: 'Mean speed √(8RT/πM)', short: 'v̄', unit: 'm/s', digits: 0, key: true },
      { id: 'vr', label: 'rms speed √(3RT/M)', short: 'v_rms', unit: 'm/s', digits: 0, key: true },
      { id: 'mm', label: 'Mean speed measured in the box', unit: 'm/s', digits: 0 },
      { id: 'f1', label: 'Share faster than 1000 m/s (theory)', unit: '%', digits: 1 },
      { id: 'f1m', label: 'Share faster than 1000 m/s (in the box)', unit: '%', digits: 0 }
    ],
    graph: { title: 'Spread of speeds (standard deviation)', yLabel: 'm/s', series: [{ label: 'in the box' }, { label: 'Maxwell value' }], window: 20, yMin: 0 },

    reset: function (sim) {
      var p = sim.p, rnd = M.rng(11 + p.N), mol = [], n = p.N;
      var cols = Math.ceil(Math.sqrt(n)), gap = (1 - 4 * RAD) / cols;
      for (var i = 0; i < n; i++) {
        var gx = i % cols, gy = Math.floor(i / cols);
        mol.push({ x: 2 * RAD + gap * (gx + 0.5) + (rnd() - 0.5) * gap * 0.3, y: 2 * RAD + gap * (gy + 0.5) + (rnd() - 0.5) * gap * 0.3,
          z: RAD + rnd() * (ZD - 2 * RAD), vx: 0, vy: 0, vz: 0 });
      }
      sim.state = { mol: mol, hist: null, spike: true };
      sameSpeed(sim.state, p, rnd);
    },
    onParam: function (sim, id) {
      if (id === 'T' || id === 'gas') { rescale(sim.state, sim.p); sim.state.hist = null; return true; }
      return id === 'cmp' || id === 'marks';
    },
    update: function (sim, dt) {
      var s = sim.state, mol = s.mol, n = mol.length, lo = RAD, hi = 1 - RAD, zl = RAD, zh = ZD - RAD;
      for (var i = 0; i < n; i++) {
        var a = mol[i];
        a.x += a.vx * dt; a.y += a.vy * dt; a.z += a.vz * dt;
        if (a.x < lo && a.vx < 0) { a.vx = -a.vx; a.x = 2 * lo - a.x; } else if (a.x > hi && a.vx > 0) { a.vx = -a.vx; a.x = 2 * hi - a.x; }
        if (a.y < lo && a.vy < 0) { a.vy = -a.vy; a.y = 2 * lo - a.y; } else if (a.y > hi && a.vy > 0) { a.vy = -a.vy; a.y = 2 * hi - a.y; }
        if (a.z < zl && a.vz < 0) { a.vz = -a.vz; a.z = 2 * zl - a.z; } else if (a.z > zh && a.vz > 0) { a.vz = -a.vz; a.z = 2 * zh - a.z; }
        a.x = M.clamp(a.x, lo, hi); a.y = M.clamp(a.y, lo, hi); a.z = M.clamp(a.z, zl, zh);
      }
      var d2 = 4 * RAD * RAD;
      for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
        var A = mol[i], B = mol[j], dx = B.x - A.x; if (dx > 2 * RAD || dx < -2 * RAD) continue;
        var dy = B.y - A.y, dz = B.z - A.z, r2 = dx * dx + dy * dy + dz * dz;
        if (r2 >= d2 || r2 === 0) continue;
        var dot = (B.vx - A.vx) * dx + (B.vy - A.vy) * dy + (B.vz - A.vz) * dz;
        if (dot >= 0) continue; // already moving apart
        var k = dot / r2; // equal masses: swap the velocity parts along the line of centres
        A.vx += k * dx; A.vy += k * dy; A.vz += k * dz; B.vx -= k * dx; B.vy -= k * dy; B.vz -= k * dz;
      }
      // smoothed histogram, fraction of molecules per bin
      var vmax = axisMax(sim.p), bw = vmax / NB, cur = new Array(NB).fill(0);
      for (i = 0; i < n; i++) { var b = Math.floor(Math.hypot(mol[i].vx, mol[i].vy, mol[i].vz) * SCALE / bw); if (b >= 0 && b < NB) cur[b] += 1 / n; }
      if (!s.hist || s.hist.length !== NB || s.histMax !== vmax) { s.hist = cur; s.histMax = vmax; }
      else { var w = s.spike && sim.time < 0.5 ? 1 : dt / TAU; for (i = 0; i < NB; i++) s.hist[i] += (cur[i] - s.hist[i]) * w; }
      if (sim.time > 0.5) s.spike = false;
    },
    readout: function (sim) {
      var p = sim.p, Mm = gasOf(p.gas).M, st = stats(sim.state), above = 0;
      st.v.forEach(function (v) { if (v > 1000) above++; });
      return { vp: vp(p.T, Mm), vm: vmean(p.T, Mm), vr: vrms(p.T, Mm), mm: st.mean,
        f1: 100 * fracAbove(1000, p.T, Mm), f1m: 100 * above / st.v.length };
    },
    sample: function (sim) {
      var p = sim.p, Mm = gasOf(p.gas).M;
      return [stats(sim.state).sd, vrms(p.T, Mm) * Math.sqrt(1 - 8 / (3 * Math.PI))];
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560, stack = H > W * 1.05 || (narrow && H > W * 0.9);
      var Mm = gasOf(p.gas).M, vr = vrms(p.T, Mm);
      function hue(v) { var f = M.clamp(v / vr / 2, 0, 1); return 'hsl(' + Math.round(220 - 220 * f) + ',80%,' + (c.light ? 45 : 60) + '%)'; }

      // layout: box + histogram side by side, or stacked on tall/narrow screens
      var S, bx, by, hx, hy, hw, hh;
      if (stack) {
        S = Math.min(W - 24, H * 0.42); bx = (W - S) / 2; by = 24;
        hx = 44; hy = by + S + 26; hw = W - hx - 14; hh = H - hy - 34;
      } else {
        S = Math.min(H - 48, W * 0.42); bx = 14; by = 26;
        hx = bx + S + 54; hy = 30; hw = W - hx - 16; hh = H - hy - 40;
      }
      D.text(ctx, gasOf(p.gas).name + ' · ' + p.T + ' K', bx + S / 2, 12, { color: c.muted, size: narrow ? 11.5 : 13, weight: 600, align: 'center', fit: W });

      // the box (a thin slab seen from above)
      D.roundRect(ctx, bx, by, S, S, 6, D.alpha(c.s1, 0.05), c.ink, 2.5);
      var r = Math.max(2.2, RAD * S);
      s.mol.forEach(function (m) {
        var v = Math.hypot(m.vx, m.vy, m.vz) * SCALE;
        D.circle(ctx, bx + m.x * S, by + m.y * S, r * (0.8 + 0.4 * (m.z / ZD)), hue(v));
      });

      // histogram panel
      var vmax = axisMax(p), bw = vmax / NB, hist = s.hist || new Array(NB).fill(0);
      var c2 = cmpCurve(p), peak = maxwell(vp(p.T, Mm), p.T, Mm) * bw;
      if (c2) peak = Math.max(peak, maxwell(vp(c2.T, c2.Mm), c2.T, c2.Mm) * bw);
      var ymax = peak * 1.3; // taller bars (the spike after "same speed") are clipped and labelled
      function X(v) { return hx + v / vmax * hw; }
      function Y(f) { return hy + hh - f / ymax * hh; }
      D.line(ctx, hx, hy + hh, hx + hw, hy + hh, c.axis, 1.5);
      D.line(ctx, hx, hy, hx, hy + hh, c.axis, 1.5);
      var step = D.niceStep(vmax, hw < 260 ? 3 : 5);
      for (var t = 0; t <= vmax + 1e-6; t += step) {
        D.line(ctx, X(t), hy + hh, X(t), hy + hh + 4, c.axis, 1);
        D.text(ctx, String(Math.round(t)), X(t), hy + hh + 12, { color: c.muted, size: 10, align: 'center', font: c.mono });
      }
      D.text(ctx, 'speed (m/s) →', hx + hw, hy + hh + 25, { color: c.muted, size: 10.5, align: 'right', fit: W });
      ctx.save(); ctx.translate(hx - 12, hy + hh / 2); ctx.rotate(-Math.PI / 2);
      D.text(ctx, 'share of molecules', 0, 0, { color: c.muted, size: 10.5, align: 'center' }); ctx.restore();
      for (var b = 0; b < NB; b++) {
        if (hist[b] <= 0) continue;
        var x0 = X(b * bw) + 0.5, x1 = X((b + 1) * bw) - 0.5, y = Math.max(hy, Y(hist[b]));
        ctx.fillStyle = D.alpha(hue((b + 0.5) * bw), 0.85); ctx.fillRect(x0, y, x1 - x0, hy + hh - y);
        if (hist[b] > ymax) D.text(ctx, '▲ ' + Math.round(hist[b] * 100) + '%', (x0 + x1) / 2, hy + hh * 0.3, { color: c.ink, size: 10.5, weight: 700, align: 'center', bg: c.bg, pad: 2, fit: W });
      }
      function plot(T, m, col, dash) {
        ctx.save(); if (dash) ctx.setLineDash(dash);
        D.curve(ctx, function (px) { return Math.max(hy, Y(maxwell((px - hx) / hw * vmax, T, m) * bw)); }, hx, hx + hw, col, 2.2);
        ctx.restore();
      }
      if (c2) plot(c2.T, c2.Mm, c.s3, [6, 4]);
      plot(p.T, Mm, c.ink);

      if (p.marks) {
        var mb = hy + (c2 ? 22 : 8);
        var mk = [['v_p', vp(p.T, Mm), c.s2], ['v̄', vmean(p.T, Mm), c.s4], ['v_rms', vr, c.danger]];
        mk.forEach(function (q, i) {
          var x = X(q[1]);
          D.line(ctx, x, hy, x, hy + hh, D.alpha(q[2], 0.95), 1.6, [4, 3]);
          D.text(ctx, q[0] + ' = ' + Math.round(q[1]) + ' m/s', hx + hw, mb + i * 14, { color: q[2], size: narrow ? 10.5 : 11.5, weight: 700, font: c.mono, align: 'right', fit: W });
        });
      }
      // legend
      var ly = hy - 14 > 6 ? hy - 12 : hy + 4, lx = hx + hw;
      if (c2) {
        D.text(ctx, '- - ' + c2.label, lx, ly + (stack ? 0 : 0), { color: c.s3, size: narrow ? 10 : 11, weight: 600, align: 'right', fit: W });
        D.text(ctx, '— Maxwell curve', lx, ly + 13, { color: c.ink, size: narrow ? 10 : 11, weight: 600, align: 'right', fit: W });
      } else {
        D.text(ctx, '— Maxwell curve · bars: this box', lx, ly, { color: c.muted, size: narrow ? 10 : 11, weight: 600, align: 'right', fit: W });
      }
      if (!stack) D.text(ctx, 'Colour = speed: blue slow, red fast', bx + S / 2, by + S + 12, { color: c.muted, size: 10.5, align: 'center', fit: W });
    }
  });
})();
