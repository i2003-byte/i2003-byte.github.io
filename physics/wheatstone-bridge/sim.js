/* =====================================================================
   Electricity · Wheatstone Bridge and Meter Bridge — sim.js
   ---------------------------------------------------------------------
   Four arms between corners A (+, at E) and C (0 V):
     A–B: P     B–C: Q     A–D: R     D–C: S     galvanometer B–D: G
   Node equations for V_B and V_D (2 × 2, solved exactly):
     (E−V_B)/P = V_B/Q + (V_B−V_D)/G
     (E−V_D)/R = V_D/S + (V_D−V_B)/G
   I_g = (V_B − V_D)/G is zero exactly when P/Q = R/S (balance).
   Wheatstone mode: P = R₁, Q = R₂, R = R₃ (known, adjustable), S = X.
   Meter bridge mode: known R in the left gap (P), X in the right gap
   (Q); the lower arms are the two parts of a 100 cm wire of 4 Ω,
   R = k l and S = k (100 − l). Balance: X = R (100 − l)/l.
   Ideal 2 V cell, G = 40 Ω, end corrections ignored. "Balanced" means
   the null point: no 0.1 step of the control brings I_g nearer zero.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var E = 2, G = 40, K = 0.04; // volts, ohms, ohms per cm of bridge wire
  var COILS = { a: 5.6, b: 3.3, c: 12, d: 22 };

  function bridge(P, Q, R, S) {
    var a11 = 1 / P + 1 / Q + 1 / G, a12 = -1 / G, a22 = 1 / R + 1 / S + 1 / G, b1 = E / P, b2 = E / R;
    var det = a11 * a22 - a12 * a12, VB = (b1 * a22 - a12 * b2) / det, VD = (a11 * b2 - a12 * b1) / det;
    return { VB: VB, VD: VD, Ig: (VB - VD) / G };
  }
  function solve(p) {
    var X = COILS[p.coil] || 5.6, o, f;
    if (p.mode === 'meter') {
      f = function (l) { return bridge(p.Rk, X, K * l, K * (100 - l)); };
      o = f(p.l); o.Xcalc = p.Rk * (100 - p.l) / p.l;
      o.bal = nullPoint(f, p.l, 1, 99);
    } else {
      f = function (r) { return bridge(p.R1, p.R2, r, X); };
      o = f(p.R3); o.Xcalc = p.R3 * p.R2 / p.R1;
      o.bal = nullPoint(f, p.R3, 0.5, 250);
    }
    o.X = X;
    return o;
  }
  // The null point: the needle is as close to zero as one 0.1 step of the
  // control can get it (the exact balance may fall between two steps).
  function nullPoint(f, v, lo, hi) {
    var g = Math.abs(f(v).Ig);
    if (g < 1e-7) return true;
    return (v - 0.1 < lo || g <= Math.abs(f(v - 0.1).Ig)) && (v + 0.1 > hi || g <= Math.abs(f(v + 0.1).Ig));
  }
  function showCtl(id, on) {
    var el = document.getElementById('ctl-' + id), box = el && el.closest('.control');
    if (box) box.style.display = on ? '' : 'none';
  }
  function syncControls(p) {
    var m = p.mode === 'meter';
    ['R1', 'R2', 'R3'].forEach(function (id) { showCtl(id, !m); });
    ['Rk', 'l'].forEach(function (id) { showCtl(id, m); });
  }
  function fmtI(I) {
    var a = Math.abs(I);
    return a >= 1e-3 ? M.fmt(I * 1e3, 2) + ' mA' : M.fmt(I * 1e6, 1) + ' µA';
  }
  var geo = null; // meter-bridge wire ends, for dragging the jockey

  function zigzag(ctx, x1, y1, x2, y2, col, frac) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var a = L * (1 - frac) / 2, b = L - a, n = 10;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x1 + ux * a, y1 + uy * a);
    for (var i = 1; i < n; i++) { var t = a + (b - a) * i / n, s = i % 2 ? 7 : -7; ctx.lineTo(x1 + ux * t + nx * s, y1 + uy * t + ny * s); }
    ctx.lineTo(x1 + ux * b, y1 + uy * b); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  function galvo(ctx, x, y, r, Ig, c, bal) {
    D.circle(ctx, x, y, r, c.bg, c.ink, 2);
    ctx.save(); ctx.strokeStyle = c.muted; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y + r * 0.35, r * 0.7, -Math.PI * 0.82, -Math.PI * 0.18); ctx.stroke(); ctx.restore();
    var th = (2 / Math.PI) * Math.atan(Ig / 1e-4) * 1.05; // ±60° at large currents
    var ang = -Math.PI / 2 + th, col = bal ? c.success : c.danger;
    D.line(ctx, x, y + r * 0.35, x + Math.cos(ang) * r * 0.82, y + r * 0.35 + Math.sin(ang) * r * 0.82, col, 2.2);
    D.circle(ctx, x, y + r * 0.35, 2.5, c.ink);
    D.text(ctx, 'G', x, y + r * 0.62, { color: c.ink, size: 9, weight: 800, align: 'center' });
  }
  function cellKey(ctx, x, y, c) {
    ctx.fillStyle = c.bg; ctx.fillRect(x - 12, y - 16, 24, 32);
    D.line(ctx, x - 5, y - 14, x - 5, y + 14, c.ink, 2.2); D.line(ctx, x + 5, y - 7, x + 5, y + 7, c.ink, 4.5);
    D.text(ctx, '+', x - 13, y - 16, { color: c.danger, size: 12, weight: 800, align: 'center' });
    D.text(ctx, E + ' V', x, y + 26, { color: c.muted, size: 11, weight: 600, align: 'center' });
  }

  SimLab.createSim({
    ariaLabel: 'A Wheatstone bridge or a metre bridge with a galvanometer, used to find an unknown resistance by balancing the bridge',
    transport: false,
    mobileAspect: '4 / 5',
    params: [
      { id: 'mode', label: 'Apparatus', type: 'select', value: 'wheat', options: [
        { value: 'wheat', label: 'Wheatstone bridge' }, { value: 'meter', label: 'Metre bridge (slide wire)' }] },
      { id: 'coil', label: 'Unknown coil X', type: 'select', value: 'a', options: [
        { value: 'a', label: 'Coil A' }, { value: 'b', label: 'Coil B' }, { value: 'c', label: 'Coil C' }, { value: 'd', label: 'Coil D' }] },
      { id: 'R1', label: 'Ratio arm R₁', min: 10, max: 100, step: 10, value: 10, unit: 'Ω' },
      { id: 'R2', label: 'Ratio arm R₂', min: 10, max: 100, step: 10, value: 10, unit: 'Ω' },
      { id: 'R3', label: 'Known resistance R₃ (adjust to balance)', min: 0.5, max: 250, step: 0.1, value: 10, unit: 'Ω',
        presets: [{ label: '1 Ω', value: 1 }, { label: '10 Ω', value: 10 }, { label: '100 Ω', value: 100 }] },
      { id: 'Rk', label: 'Known resistance R (left gap)', min: 1, max: 30, step: 1, value: 5, unit: 'Ω',
        presets: [{ label: '2 Ω', value: 2 }, { label: '5 Ω', value: 5 }, { label: '10 Ω', value: 10 }, { label: '20 Ω', value: 20 }] },
      { id: 'l', label: 'Jockey position l (or drag it)', min: 1, max: 99, step: 0.1, value: 30, unit: 'cm' },
      { id: 'reveal', label: 'Reveal the true value of X', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'Ig', label: 'Galvanometer current', short: 'Ig', key: true },
      { id: 'Xc', label: 'X from the balance formula', short: 'X (formula)', unit: 'Ω', digits: 2, key: true },
      { id: 'bal', label: 'Bridge balanced?', short: 'Balanced?', key: true },
      { id: 'dV', label: 'V_B − V_D', unit: 'mV', digits: 2 },
      { id: 'X', label: 'True value of X' }
    ],
    onParam: function (sim, id) { if (id === 'mode') syncControls(sim.p); return true; },
    reset: function (sim) { syncControls(sim.p); },
    readout: function (sim) {
      var o = solve(sim.p);
      return { Ig: fmtI(o.Ig), Xc: o.Xcalc, bal: o.bal ? 'Yes: null point' : 'No: needle moves',
        dV: (o.VB - o.VD) * 1e3,
        X: sim.p.reveal ? M.fmt(o.X, 1) + ' Ω (error ' + M.fmt(Math.abs(o.Xcalc - o.X) / o.X * 100, 1) + '%)' : 'hidden' };
    },
    pointer: {
      down: function (sim, x, y) {
        if (sim.p.mode !== 'meter' || !geo || Math.abs(y - geo.y) > 44 || x < geo.x0 - 10 || x > geo.x1 + 10) return false;
        this.move(sim, x); return true;
      },
      move: function (sim, x) {
        if (!geo) return;
        var l = M.clamp((x - geo.x0) / (geo.x1 - geo.x0) * 100, 1, 99);
        sim.setParam('l', Math.round(l * 10) / 10, true);
      },
      hover: function (sim, x, y) { return sim.p.mode === 'meter' && geo && Math.abs(y - geo.y) < 44 && x > geo.x0 - 10 && x < geo.x1 + 10; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, o = solve(p);
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560, wireC = c.light ? '#334155' : '#cbd5e1', fs = narrow ? 11 : 12.5;
      var head = o.bal ? 'Null point: (almost) no current through G' : 'Not balanced: current flows through G';
      D.text(ctx, head, W / 2, 15, { color: c.bg, bg: o.bal ? c.success : c.warning, size: narrow ? 11.5 : 13, weight: 700, align: 'center', pad: 4, fit: W });
      var xs = p.reveal ? M.fmt(o.X, 1) + ' Ω' : '?';
      var eq1, eq2;

      if (p.mode === 'meter') {
        var x0 = narrow ? 24 : Math.max(60, W * 0.12), x1 = W - x0, wy = H * (narrow ? 0.56 : 0.58), ty = narrow ? 66 : 74;
        var len = x1 - x0, jx = x0 + len * p.l / 100, bx = (x0 + x1) / 2, by = Math.min(H - 70, wy + 76);
        geo = { x0: x0, x1: x1, y: wy };
        // top copper strip with two gaps
        var g1 = [x0 + len * 0.16, x0 + len * 0.38], g2 = [x0 + len * 0.62, x0 + len * 0.84], cu = '#d9894a';
        ctx.save(); ctx.strokeStyle = cu; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
        ctx.moveTo(x0, wy); ctx.lineTo(x0, ty); ctx.lineTo(g1[0], ty); ctx.moveTo(g1[1], ty); ctx.lineTo(g2[0], ty);
        ctx.moveTo(g2[1], ty); ctx.lineTo(x1, ty); ctx.lineTo(x1, wy); ctx.stroke(); ctx.restore();
        zigzag(ctx, g1[0], ty, g1[1], ty, c.s1, 0.75); zigzag(ctx, g2[0], ty, g2[1], ty, c.s2, 0.75);
        D.text(ctx, 'R = ' + p.Rk + ' Ω', (g1[0] + g1[1]) / 2, ty - 18, { color: c.s1, size: fs, weight: 700, align: 'center', fit: W });
        D.text(ctx, 'X = ' + xs, (g2[0] + g2[1]) / 2, ty - 18, { color: c.s2, size: fs, weight: 700, align: 'center', fit: W });
        D.circle(ctx, bx, ty, 4.5, c.ink); D.text(ctx, 'B', bx, ty - 14, { color: c.ink, size: 12, weight: 800, align: 'center' });
        // galvanometer from B to the jockey
        var gy = (ty + wy) / 2 - 4, gr = narrow ? 17 : 20;
        D.line(ctx, bx, ty, bx, gy - gr, wireC, 2);
        ctx.save(); ctx.strokeStyle = wireC; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, gy + gr);
        ctx.bezierCurveTo(bx, gy + gr + 30, jx, wy - 50, jx, wy - 16); ctx.stroke(); ctx.restore();
        galvo(ctx, bx, gy, gr, o.Ig, c, o.bal);
        D.text(ctx, fmtI(o.Ig), bx + gr + 6, gy, { color: o.bal ? c.success : c.danger, size: fs, weight: 700, font: c.mono, fit: W });
        // metre scale and wire
        ctx.fillStyle = D.alpha(c.ink, 0.06); ctx.fillRect(x0, wy + 3, len, 18);
        for (var cm = 0; cm <= 100; cm += 5) {
          var tx = x0 + len * cm / 100, big = cm % 10 === 0;
          D.line(ctx, tx, wy + 3, tx, wy + (big ? 11 : 7), c.muted, 1);
          if (cm % (narrow ? 20 : 10) === 0) D.text(ctx, String(cm), tx, wy + 17, { color: c.muted, size: 9.5, align: 'center' });
        }
        D.line(ctx, x0, wy, x1, wy, c.ink, 2);
        D.text(ctx, 'A', x0 - 2, wy - 12, { color: c.ink, size: 12, weight: 800, align: 'right', fit: W });
        D.text(ctx, 'C', x1 + 2, wy - 12, { color: c.ink, size: 12, weight: 800, fit: W });
        // jockey
        ctx.fillStyle = c.accent; ctx.beginPath(); ctx.moveTo(jx, wy - 1); ctx.lineTo(jx - 7, wy - 18); ctx.lineTo(jx + 7, wy - 18); ctx.closePath(); ctx.fill();
        D.roundRect(ctx, jx - 4, wy - 34, 8, 17, 3, c.accent);
        // lengths
        var dy = wy + 34;
        D.line(ctx, x0, dy, jx, dy, c.s1, 1.5); D.line(ctx, jx, dy, x1, dy, c.s2, 1.5);
        D.text(ctx, 'l = ' + M.fmt(p.l, 1) + ' cm', (x0 + jx) / 2, dy + 11, { color: c.s1, size: fs - 0.5, weight: 700, align: 'center', fit: W });
        D.text(ctx, '100 − l = ' + M.fmt(100 - p.l, 1), (jx + x1) / 2, dy + 11, { color: c.s2, size: fs - 0.5, weight: 700, align: 'center', fit: W });
        // cell and key under the wire
        ctx.save(); ctx.strokeStyle = wireC; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(x0, wy); ctx.lineTo(x0, by); ctx.lineTo(x1, by); ctx.lineTo(x1, wy); ctx.stroke(); ctx.restore();
        cellKey(ctx, bx, by, c);
        eq1 = 'R ÷ X = l ÷ (100 − l)   →   X = R (100 − l) ÷ l';
        eq2 = 'X = ' + p.Rk + ' × ' + M.fmt(100 - p.l, 1) + ' ÷ ' + M.fmt(p.l, 1) + ' = ' + M.fmt(o.Xcalc, 2) + ' Ω';
      } else {
        geo = null;
        var cx = W / 2, cy = narrow ? H * 0.45 : H * 0.46, a = narrow ? W * 0.36 : Math.min(W * 0.26, 230), b = Math.min(a * 0.62, cy - 62);
        var A = [cx - a, cy], B = [cx, cy - b], C = [cx + a, cy], Dn = [cx, cy + b], yb = Math.min(H - 64, cy + b + 44);
        ctx.save(); ctx.strokeStyle = wireC; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(A[0], A[1]); ctx.lineTo(A[0], yb); ctx.lineTo(C[0], yb); ctx.lineTo(C[0], C[1]); ctx.stroke(); ctx.restore();
        zigzag(ctx, A[0], A[1], B[0], B[1], c.s1, 0.5); zigzag(ctx, B[0], B[1], C[0], C[1], c.s1, 0.5);
        zigzag(ctx, A[0], A[1], Dn[0], Dn[1], c.s4, 0.5); zigzag(ctx, Dn[0], Dn[1], C[0], C[1], c.s2, 0.5);
        var gr2 = narrow ? 17 : 20;
        D.line(ctx, B[0], B[1], cx, cy - gr2, wireC, 2); D.line(ctx, cx, cy + gr2, Dn[0], Dn[1], wireC, 2);
        galvo(ctx, cx, cy, gr2, o.Ig, c, o.bal);
        D.text(ctx, fmtI(o.Ig), cx + gr2 + 6, cy, { color: o.bal ? c.success : c.danger, size: fs, weight: 700, font: c.mono, fit: W });
        [[A, 'A', -12, 0], [B, 'B', 0, -14], [C, 'C', 12, 0], [Dn, 'D', 0, 15]].forEach(function (n) {
          D.circle(ctx, n[0][0], n[0][1], 4.5, c.ink);
          D.text(ctx, n[1], n[0][0] + n[2], n[0][1] + n[3], { color: c.ink, size: 12.5, weight: 800, align: 'center' });
        });
        var off = narrow ? 22 : 24;
        D.text(ctx, 'R₁ = ' + p.R1 + ' Ω', (A[0] + B[0]) / 2 - off, (A[1] + B[1]) / 2 - off, { color: c.s1, size: fs, weight: 700, align: 'center', fit: W });
        D.text(ctx, 'R₂ = ' + p.R2 + ' Ω', (B[0] + C[0]) / 2 + off, (B[1] + C[1]) / 2 - off, { color: c.s1, size: fs, weight: 700, align: 'center', fit: W });
        D.text(ctx, 'R₃ = ' + M.fmt(p.R3, 1) + ' Ω', (A[0] + Dn[0]) / 2 - off, (A[1] + Dn[1]) / 2 + off, { color: c.s4, size: fs, weight: 700, align: 'center', fit: W });
        D.text(ctx, 'X = ' + xs, (Dn[0] + C[0]) / 2 + off, (Dn[1] + C[1]) / 2 + off, { color: c.s2, size: fs, weight: 700, align: 'center', fit: W });
        D.text(ctx, 'V_B = ' + M.fmt(o.VB, 3) + ' V', B[0], B[1] - 30, { color: c.muted, size: fs - 1, align: 'center', font: c.mono, fit: W });
        D.text(ctx, 'V_D = ' + M.fmt(o.VD, 3) + ' V', Dn[0] + 44, Dn[1] + 14, { color: c.muted, size: fs - 1, align: 'left', font: c.mono, fit: W });
        cellKey(ctx, cx, yb, c);
        eq1 = 'Balance: R₁ ÷ R₂ = R₃ ÷ X   →   X = R₃ × R₂ ÷ R₁';
        eq2 = 'X = ' + M.fmt(p.R3, 1) + ' × ' + p.R2 + ' ÷ ' + p.R1 + ' = ' + M.fmt(o.Xcalc, 2) + ' Ω' + (o.bal ? '' : '  (only true at balance)');
      }
      D.text(ctx, eq1, W / 2, H - 32, { color: c.ink, size: narrow ? 11 : 13, weight: 700, align: 'center', fit: W });
      D.text(ctx, eq2, W / 2, H - 13, { color: o.bal ? c.success : c.muted, size: narrow ? 11 : 12.5, weight: 700, align: 'center', font: c.mono, fit: W });
    }
  });
})();
