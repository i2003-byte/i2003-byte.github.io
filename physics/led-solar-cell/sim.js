/* =====================================================================
   Electricity · LEDs and Solar Cells — sim.js
   ---------------------------------------------------------------------
   LED: an electron falling across the band gap Eg gives one photon
     λ (nm) = hc/Eg = 1240 / Eg(eV)
     GaAs 1.42 eV (873 nm, infrared) · AlGaInP 1.9 eV (653 nm, red)
     AlGaInP 2.1 eV (590 nm, amber) · InGaN 2.35 eV (528 nm, green)
     InGaN 2.7 eV (459 nm, blue; white LEDs add a yellow phosphor)
   LED on a supply Vs with a 100 Ω resistor. Simplified LED law:
     I = 20 mA · e^((V − Eg/e − 0.15 V)/(2 VT)), plus 10 Ω inside,
     so it switches on at about Eg/e volts (red ≈ 2 V, blue ≈ 2.9 V).
   Solar: one silicon cell, 156 mm × 156 mm (0.0243 m²), Eg = 1.12 eV
     (photons beyond 1107 nm pass through). Single-diode model
     I = Isc·G/1000 − I0(e^(V/(n VT)) − 1), Isc = 9.5 A, n = 1.2,
     I0 = 1.96×10⁻⁸ A → Voc ≈ 0.62 V, about 19 % efficient.
   A rooftop panel = 60 cells in series (Voc ≈ 37 V, ≈ 280 W).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var VT = 0.02585, RS = 100, RIN = 10;
  var LEDS = {
    ir: { eg: 1.42, name: 'Infrared (GaAs)' }, red: { eg: 1.9, name: 'Red (AlGaInP)' }, amber: { eg: 2.1, name: 'Amber (AlGaInP)' },
    green: { eg: 2.35, name: 'Green (InGaN)' }, blue: { eg: 2.7, name: 'Blue (InGaN)' }, white: { eg: 2.7, name: 'White (blue + phosphor)' }
  };
  var CELL = { isc: 9.5, n: 1.2, i0: 1.96e-8, area: 0.0243, eg: 1.12, N: 60 };
  var st = { lastT: 0, drops: [], phot: [], pairs: [], acc: 0, acc2: 0, phase: 0, rng: M.rng(11), I: 0, V: 0 };

  /* ---------- physics ---------- */
  function ledI(eg, V) { return V <= 0 ? 0 : 0.02 * Math.exp(Math.min((V - eg - 0.15) / (2 * VT), 30)); }
  function solveLed(sim) {
    var eg = LEDS[sim.p.led].eg, Vs = sim.p.vs, lo = 0, hi = Math.max(Vs, 0);
    for (var k = 0; k < 70; k++) { var V = (lo + hi) / 2, I = ledI(eg, V); if (V + I * (RS + RIN) > Vs) hi = V; else lo = V; }
    st.V = (lo + hi) / 2; st.I = ledI(eg, st.V);
  }
  function cellI(G, V) { return CELL.isc * G / 1000 - CELL.i0 * (Math.exp(V / (CELL.n * VT)) - 1); }
  function voc(G) { return G <= 0 ? 0 : CELL.n * VT * Math.log(CELL.isc * G / 1000 / CELL.i0 + 1); }
  // panel of N cells on a load R: V_panel = N·V_cell, I = V_panel / R
  function solveSolar(G, R) {
    var lo = 0, hi = voc(G);
    for (var k = 0; k < 70; k++) { var v = (lo + hi) / 2; if (cellI(G, v) > CELL.N * v / R) lo = v; else hi = v; }
    var vc = (lo + hi) / 2; return { v: vc * CELL.N, i: Math.max(0, cellI(G, vc)) };
  }
  function mpp(G) {
    var best = { p: 0, v: 0, i: 0 }, vo = voc(G);
    for (var k = 1; k < 400; k++) { var v = vo * k / 400, i = cellI(G, v), p = v * i; if (p > best.p) best = { p: p, v: v, i: i }; }
    return { p: best.p * CELL.N, v: best.v * CELL.N, i: best.i };
  }

  function wlRGB(nm, a) { var q = wlArr(nm); return q ? 'rgba(' + q.join(',') + ',' + (a == null ? 1 : a) + ')' : null; }
  function wlArr(nm) {   // approximate visible colour of a wavelength as [r, g, b]
    var r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else if (nm <= 750) r = 1;
    var f = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? Math.max(0, 0.3 + 0.7 * (750 - nm) / 50) : 1;
    if (nm < 380 || nm > 750) return null;
    return [Math.round(255 * r * f), Math.round(255 * g * f), Math.round(255 * b * f)];
  }
  function colourName(nm) {
    return nm > 750 ? 'infrared (invisible)' : nm > 620 ? 'red' : nm > 590 ? 'orange' : nm > 570 ? 'yellow' : nm > 495 ? 'green' : nm > 450 ? 'blue' : nm >= 380 ? 'violet' : 'ultraviolet';
  }
  function fmtA(A) { return A >= 1 ? M.fmt(A, 2) + ' A' : A >= 1e-3 ? M.fmt(A * 1e3, A >= 0.01 ? 1 : 2) + ' mA' : A >= 1e-6 ? M.fmt(A * 1e6, 1) + ' µA' : '0'; }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.1, A, B;
    if (wide) { var aw = W * 0.5; A = { x: 8, y: 8, w: aw - 14, h: H - 16 }; B = { x: aw + 4, y: 8, w: W - aw - 12, h: H - 16 }; }
    else { var ah = H * 0.5; A = { x: 6, y: 4, w: W - 12, h: ah - 6 }; B = { x: 6, y: ah + 2, w: W - 12, h: H - ah - 6 }; }
    return { W: W, H: H, A: A, B: B, narrow: W < 560 };
  }

  /* ---------- LED drawing ---------- */
  function wiggle(ctx, x1, y1, x2, y2, col, ph) {
    var len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    for (var s = 0; s <= len; s += 2) { var o = Math.sin(s / 4 + ph) * 4; var x = x1 + ux * s - uy * o, y = y1 + uy * s + ux * o; if (s) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
    D.arrow(ctx, x2 - ux * 6, y2 - uy * 6, x2 + ux * 2, y2 + uy * 2, col, 2, 7);
  }
  function drawBands(ctx, c, A, eg, nm, col, L) {
    D.roundRect(ctx, A.x, A.y, A.w, A.h, 10, D.alpha(c.ink, 0.03), D.alpha(c.ink, 0.1));
    var top = A.y + 34, bot = A.y + A.h - 26, span = bot - top, bh = Math.max(12, span * 0.14);
    var gap = (span - 2 * bh) * M.clamp(eg / 3.4, 0.2, 1), mid = (top + bot) / 2;
    var cbY = mid - gap / 2 - bh, vbY = mid + gap / 2, x0 = A.x + 12, x1 = A.x + A.w * 0.72;
    D.roundRect(ctx, x0, cbY, x1 - x0, bh, 4, D.alpha(c.s1, 0.25), c.s1, 1.5);
    D.roundRect(ctx, x0, vbY, x1 - x0, bh, 4, D.alpha(c.s2, 0.25), c.s2, 1.5);
    var fs = L.narrow ? 10.5 : 12;
    D.text(ctx, 'conduction band (free electrons)', x0 + 4, cbY - 9, { color: c.s1, size: fs, weight: 600, fit: x1 + 40 });
    D.text(ctx, 'valence band (holes)', x0 + 4, vbY + bh + 10, { color: c.s2, size: fs, weight: 600 });
    D.arrow(ctx, x0 + 18, mid, x0 + 18, cbY + bh + 1, c.muted, 1.3, 6);
    D.arrow(ctx, x0 + 18, mid, x0 + 18, vbY - 1, c.muted, 1.3, 6);
    D.text(ctx, 'Eg = ' + eg.toFixed(2) + ' eV', x0 + 26, mid, { color: c.ink, size: fs + 1, weight: 800, bg: D.alpha(c.bg, 0.8), pad: 2 });
    // falling electrons
    st.drops.forEach(function (d) {
      var x = x0 + (x1 - x0) * d.x;
      if (d.t < 1) { var y = cbY + bh / 2 + (vbY + bh / 2 - cbY - bh / 2) * d.t * d.t; D.circle(ctx, x, y, 4, c.s1); D.circle(ctx, x, vbY + bh / 2, 4.5, null, c.s2, 1.5); }
      else { var f = d.t - 1; wiggle(ctx, x + 4, mid, x + 4 + f * (A.x + A.w - x - 14), mid - f * 10, col || c.muted, f * 20); }
    });
    D.text(ctx, 'Each fall gives one photon: E = Eg', A.x + A.w / 2, A.y + 12, { color: c.muted, size: fs, align: 'center', fit: L.W });
    D.text(ctx, 'λ = 1240 / ' + eg.toFixed(2) + ' = ' + Math.round(nm) + ' nm', A.x + A.w / 2, A.y + A.h - 11, { color: col || c.ink, size: fs + 1, weight: 800, align: 'center', fit: L.W });
  }
  function drawLed(ctx, c, B, sim, nm, col, L) {
    D.roundRect(ctx, B.x, B.y, B.w, B.h, 10, D.alpha(c.ink, 0.03), D.alpha(c.ink, 0.1));
    var type = sim.p.led, white = type === 'white', glowCol = white ? 'rgba(255,247,224,1)' : col;
    var bright = M.clamp(st.I / 0.02, 0, 1.3);
    var cx = B.x + B.w * 0.3, r = Math.min(B.w * 0.13, B.h * 0.17), cy = B.y + r + 30;
    if (bright > 0.01 && glowCol) {
      var g = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * (2 + bright * 1.5));
      g.addColorStop(0, glowCol.replace(',1)', ',' + Math.min(0.6, 0.5 * bright).toFixed(2) + ')'));
      g.addColorStop(1, glowCol.replace(',1)', ',0)'));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * (2 + bright * 1.5), 0, Math.PI * 2); ctx.fill();
    }
    // the LED: dome + body + legs
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.lineTo(cx + r, cy + r * 1.1); ctx.lineTo(cx - r, cy + r * 1.1); ctx.closePath();
    ctx.fillStyle = bright > 0.01 && glowCol ? glowCol : (col ? col.replace(',1)', ',0.35)') : 'rgba(127,29,29,0.5)'); ctx.globalAlpha = bright > 0.01 ? M.clamp(0.4 + bright * 0.6, 0, 1) : 0.6; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = c.border; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    D.roundRect(ctx, cx - r * 1.2, cy + r * 1.1, r * 2.4, 6, 2, c.muted);
    D.line(ctx, cx - r * 0.4, cy + r * 1.1 + 6, cx - r * 0.4, cy + r * 2.1 + 6, c.muted, 2);
    D.line(ctx, cx + r * 0.4, cy + r * 1.1 + 6, cx + r * 0.4, cy + r * 1.7 + 6, c.muted, 2);
    D.text(ctx, '+ long leg', cx - r * 0.4 - 4, cy + r * 2.1 + 14, { color: c.faint, size: 9.5, align: 'right' });
    var tx = B.x + B.w * 0.55, fs = L.narrow ? 11 : 12.5, ty = B.y + 18;
    D.text(ctx, LEDS[type].name, tx, ty, { color: c.ink, size: fs + 1, weight: 800, fit: B.x + B.w });
    D.text(ctx, 'Supply ' + M.fmt(sim.p.vs, 2) + ' V, 100 Ω', tx, ty + fs + 8, { color: c.muted, size: fs });
    D.text(ctx, 'LED: ' + M.fmt(st.V, 2) + ' V, ' + fmtA(st.I), tx, ty + 2 * (fs + 8), { color: st.I > 1e-3 ? c.success : c.muted, size: fs, weight: 700 });
    D.text(ctx, st.I > 1e-3 ? (nm > 750 ? 'Glowing, but in infrared' : 'Glowing ' + (white ? 'white' : colourName(nm))) : 'Below ≈ ' + M.fmt(LEDS[type].eg, 1) + ' V: off', tx, ty + 3 * (fs + 8), { color: st.I > 1e-3 ? c.ink : c.warning, size: fs, weight: 600, fit: B.x + B.w });
    if (nm > 750 && st.I > 1e-3) D.text(ctx, 'like a TV remote: try a phone camera', tx, ty + 4 * (fs + 8), { color: c.faint, size: fs - 1.5, fit: B.x + B.w });
    // spectrum bar 380–950 nm
    var sx = B.x + 14, sw = B.w - 28, sy = B.y + B.h - 34, sh = 12;
    for (var k = 0; k < sw; k++) {
      var w = 380 + (950 - 380) * k / sw, cc = wlRGB(w);
      ctx.fillStyle = cc || D.alpha(c.ink, 0.08); ctx.fillRect(sx + k, sy, 1.2, sh);
    }
    function SX(w) { return sx + (w - 380) / 570 * sw; }
    [400, 500, 600, 700, 800, 900].forEach(function (w) { D.text(ctx, String(w), SX(w), sy + sh + 9, { color: c.faint, size: 9, align: 'center' }); });
    D.text(ctx, 'nm', sx + sw, sy + sh + 19, { color: c.faint, size: 9, align: 'right' });
    D.text(ctx, 'infrared →', SX(850), sy - 7, { color: c.faint, size: 9.5, align: 'center' });
    var mx = SX(Math.min(nm, 950));
    D.line(ctx, mx, sy - 4, mx, sy + sh + 2, c.ink, 2.5);
    if (white) { var my = SX(570); D.line(ctx, my, sy - 4, my, sy + sh + 2, c.ink, 1.5, [3, 2]); D.text(ctx, 'phosphor', my, sy - 7, { color: c.muted, size: 9.5, align: 'center' }); }
  }

  /* ---------- solar drawing ---------- */
  function drawCell(ctx, c, A, sim, sol, L) {
    D.roundRect(ctx, A.x, A.y, A.w, A.h, 10, D.alpha(c.ink, 0.03), D.alpha(c.ink, 0.1));
    var cx0 = A.x + 12, cw = A.w * 0.66, top = A.y + A.h * 0.3, nH = A.h * 0.1, pH = A.h * 0.38, fs = L.narrow ? 10.5 : 12;
    var jy = top + nH, bot = jy + pH;
    D.roundRect(ctx, cx0, top, cw, nH, 0, D.alpha(c.s1, 0.22));
    D.roundRect(ctx, cx0, jy, cw, pH, 0, D.alpha(c.s2, 0.16));
    D.line(ctx, cx0, jy, cx0 + cw, jy, D.alpha(c.ink, 0.4), 1, [4, 3]);
    for (var f = 0; f < 5; f++) D.roundRect(ctx, cx0 + cw * (0.1 + f * 0.2) - 3, top - 5, 6, 6, 1, c.muted);
    D.roundRect(ctx, cx0, bot, cw, 6, 0, c.muted);
    D.text(ctx, 'n (thin)', cx0 + cw + 4, top + nH / 2, { color: c.s1, size: fs, weight: 700 });
    D.text(ctx, 'p', cx0 + cw + 4, jy + pH / 2, { color: c.s2, size: fs, weight: 700 });
    D.text(ctx, 'junction field', cx0 + cw + 4, jy + 2, { color: c.faint, size: 9.5 });
    // photons, pairs
    st.phot.forEach(function (p) {
      var x = cx0 + cw * p.x, ys = A.y + 8, ye = p.ir ? bot + 30 : jy + pH * p.d * 0.8 - 10;
      var y = ys + (ye - ys) * Math.min(p.t, 1);
      var col = wlRGB(p.nm) || c.muted;
      if (p.t < 1 || p.ir) {
        ctx.save(); if (p.ir) ctx.globalAlpha = p.t > 1 ? Math.max(0, 1.6 - p.t) : 0.7;
        wiggle(ctx, x - 14, y - 20, x, y, col, p.t * 20); ctx.restore();
      }
    });
    st.pairs.forEach(function (q) {
      var x = cx0 + cw * q.x, y0 = jy + pH * q.d * 0.8, k = Math.min(q.t, 1);
      D.circle(ctx, x, y0 + (top - y0) * k, 3.6, c.s1);
      D.circle(ctx, x + 3, y0 + (bot - y0) * k, 3.8, null, c.s2, 1.6);
    });
    // external circuit: top contact → load → back contact
    var ex = cx0 + cw + (A.x + A.w - cx0 - cw) * 0.62, wcol = sol.i > 0.05 ? c.warning : c.ink;
    var yT = top - 14;
    D.line(ctx, cx0 + cw * 0.9, top - 5, cx0 + cw * 0.9, yT, wcol, 2);
    D.line(ctx, cx0 + cw * 0.9, yT, ex, yT, wcol, 2);
    D.line(ctx, ex, yT, ex, bot + 3, wcol, 2);
    D.line(ctx, cx0 + cw, bot + 3, ex, bot + 3, wcol, 2);
    var lr = Math.min(14, A.w * 0.04), ly = (yT + bot) / 2;
    D.circle(ctx, ex, ly, lr, sol.i > 0.05 ? D.alpha(c.warning, M.clamp(sol.i / 9, 0.15, 0.9)) : c.bg, c.ink, 2);
    D.text(ctx, '✕', ex, ly, { color: c.ink, size: lr, weight: 700, align: 'center' });
    D.text(ctx, 'load', ex, ly + lr + 9, { color: c.muted, size: 10, align: 'center' });
    D.text(ctx, '☀ ' + sim.p.sun + ' W/m²', A.x + 12, A.y + 12, { color: c.warning, size: fs + 1, weight: 800 });
    D.text(ctx, 'IR beyond 1107 nm passes through', A.x + A.w - 8, A.y + A.h - 10, { color: c.faint, size: 9.5, align: 'right', fit: L.W });
  }
  function drawPanelIV(ctx, c, B, sim, sol, L) {
    D.roundRect(ctx, B.x, B.y, B.w, B.h, 10, D.alpha(c.ink, 0.03), D.alpha(c.ink, 0.1));
    var G = sim.p.sun, px = B.x + 40, pw = B.w - 80, py = B.y + 24, ph = B.h - 54, Vmax = 40, Imax = 10.5, Pmax = 320;
    function X(v) { return px + v / Vmax * pw; } function Yi(i) { return py + ph - i / Imax * ph; } function Yp(p) { return py + ph - p / Pmax * ph; }
    D.grid(ctx, px, py, pw, ph, ph / 5, c.grid);
    D.line(ctx, px, py + ph, px + pw, py + ph, c.axis, 1.3); D.line(ctx, px, py, px, py + ph, c.axis, 1.3); D.line(ctx, px + pw, py, px + pw, py + ph, c.axis, 1);
    [0, 10, 20, 30, 40].forEach(function (v) { D.text(ctx, String(v), X(v), py + ph + 10, { color: c.faint, size: 9.5, align: 'center' }); });
    [0, 5, 10].forEach(function (i) { D.text(ctx, String(i), px - 5, Yi(i), { color: c.s1, size: 9.5, align: 'right' }); });
    [0, 100, 200, 300].forEach(function (p) { D.text(ctx, String(p), px + pw + 5, Yp(p), { color: c.s3, size: 9.5 }); });
    D.text(ctx, 'current (A)', px, py - 11, { color: c.s1, size: 10, weight: 700 });
    D.text(ctx, 'power (W)', px + pw, py - 11, { color: c.s3, size: 10, weight: 700, align: 'right' });
    D.text(ctx, 'panel voltage (V), 60 cells', px + pw / 2, py + ph + 21, { color: c.faint, size: 9.5, align: 'center' });
    if (G > 0) {
      var vo = voc(G);
      ['i', 'p'].forEach(function (k) {
        ctx.save(); ctx.strokeStyle = k === 'i' ? c.s1 : c.s3; ctx.lineWidth = 2.4; ctx.beginPath();
        for (var n = 0; n <= 120; n++) { var vc = vo * n / 120, I = Math.max(0, cellI(G, vc)), V = vc * CELL.N, y = k === 'i' ? Yi(I) : Yp(V * I); if (n) ctx.lineTo(X(V), y); else ctx.moveTo(X(V), y); }
        ctx.stroke(); ctx.restore();
      });
      var mp = mpp(G);
      D.circle(ctx, X(mp.v), Yp(mp.p), 4, null, c.s3, 1.6);
      D.text(ctx, 'max ' + Math.round(mp.p) + ' W', X(mp.v) - 6, Yp(mp.p) - 11, { color: c.s3, size: 10, weight: 700, align: 'right', bg: D.alpha(c.bg, 0.75), pad: 2 });
    }
    // load line I = V / R
    var R = sim.p.rl, vEnd = Math.min(Vmax, Imax * R);
    D.line(ctx, X(0), Yi(0), X(vEnd), Yi(vEnd / R), D.alpha(c.ink, 0.45), 1.2, [5, 4]);
    D.circle(ctx, X(sol.v), Yi(sol.i), 9, D.alpha(c.danger, 0.25));
    D.circle(ctx, X(sol.v), Yi(sol.i), 5, c.danger, c.bg, 1.5);
  }

  function step(sim, dt) {
    var r = st.rng;
    if (sim.p.mode === 'led') {
      var rate = st.I > 1e-4 ? M.clamp(Math.log10(st.I / 1e-4) * 3, 0.5, 9) : 0;
      st.acc += dt * rate;
      while (st.acc >= 1) { st.acc -= 1; st.drops.push({ x: 0.15 + r() * 0.75, t: 0 }); }
      st.drops.forEach(function (d) { d.t += dt * 1.6; });
      st.drops = st.drops.filter(function (d) { return d.t < 2; }).slice(-24);
    } else {
      st.acc2 += dt * sim.p.sun / 1000 * 7;
      while (st.acc2 >= 1) {
        st.acc2 -= 1;
        var nm = 350 + r() * 1100;   // rough spread of sunlight reaching the ground
        st.phot.push({ x: 0.08 + r() * 0.84, d: 0.1 + r() * 0.9, nm: nm, ir: nm > 1107, t: 0 });
      }
      st.phot.forEach(function (p) { p.t += dt * 1.5; if (!p.ir && p.t >= 1 && !p.done) { p.done = true; st.pairs.push({ x: p.x, d: p.d, t: 0 }); } });
      st.phot = st.phot.filter(function (p) { return p.t < (p.ir ? 1.6 : 1); }).slice(-30);
      st.pairs.forEach(function (q) { q.t += dt * 1.1; });
      st.pairs = st.pairs.filter(function (q) { return q.t < 1.15; }).slice(-30);
    }
  }

  SimLab.createSim({
    ariaLabel: 'Two uses of a p-n junction with light. LED mode: electrons fall across the band gap and give out photons whose colour depends on the gap, with a glowing LED and a spectrum. Solar mode: sunlight makes electron-hole pairs in a silicon cell, driving current through a load, with the panel current and power curves',
    transport: false,
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'mode', label: 'Show', type: 'select', value: 'led', options: [{ value: 'led', label: 'LED: electricity → light' }, { value: 'solar', label: 'Solar cell: light → electricity' }] },
      { id: 'led', label: 'LED: material', type: 'select', value: 'red', options: Object.keys(LEDS).map(function (k) { return { value: k, label: LEDS[k].name + (k === 'white' ? '' : ', Eg ' + LEDS[k].eg + ' eV') }; }) },
      { id: 'vs', label: 'LED: supply voltage', min: 0, max: 5, step: 0.05, value: 3, unit: 'V', presets: [1.5, 2, 2.5, 3, 5] },
      { id: 'sun', label: 'Solar: sunlight', min: 0, max: 1100, step: 10, value: 1000, unit: 'W/m²', presets: [100, 300, 600, 1000], help: 'About 1000 at noon on a clear Indian day, 100–300 when cloudy.' },
      { id: 'rl', label: 'Solar: load on the panel', min: 0.5, max: 40, step: 0.1, value: 3.4, unit: 'Ω' }
    ],
    buttons: [{ label: 'Best load for this sunlight', onClick: function (sim) { var mp = mpp(sim.p.sun); if (mp.i > 0) sim.setParam('rl', Math.round(mp.v / mp.i * 10) / 10); sim.setParam('mode', 'solar'); } }],
    readouts: [
      { id: 'a', label: 'Wavelength', key: true },
      { id: 'b', label: 'Current', key: true },
      { id: 'c', label: 'Photon energy' },
      { id: 'd', label: 'Colour / power' },
      { id: 'e', label: 'Note' }
    ],
    reset: function (sim) { solveLed(sim); },
    onParam: function (sim, id) {
      if (id === 'led' || id === 'vs') sim.setParam('mode', 'led');
      if (id === 'sun' || id === 'rl') sim.setParam('mode', 'solar');
      solveLed(sim); return true;
    },
    readout: function (sim) {
      if (sim.p.mode === 'led') {
        var eg = LEDS[sim.p.led].eg, nm = 1240 / eg;
        return { a: Math.round(nm) + ' nm', b: fmtA(st.I), c: eg.toFixed(2) + ' eV', d: sim.p.led === 'white' ? 'white (blue + yellow)' : colourName(nm), e: 'switches on near ' + M.fmt(eg, 1) + ' V' };
      }
      var s = solveSolar(sim.p.sun, sim.p.rl), mp = mpp(sim.p.sun), P = s.v * s.i, eff = sim.p.sun > 0 ? P / (sim.p.sun * CELL.area * CELL.N) * 100 : 0;
      return { a: 'up to 1107 nm', b: fmtA(s.i), c: '≥ 1.12 eV', d: Math.round(P) + ' W (' + M.fmt(eff, 1) + '%)', e: 'best: ' + Math.round(mp.p) + ' W at ' + M.fmt(mp.v, 1) + ' V' };
    },
    status: function (sim) { return sim.p.mode === 'led' ? LEDS[sim.p.led].name + ' LED' : 'Silicon solar panel, 60 cells'; },
    animate: function (sim) { return !sim.reduceMotion; },
    draw: function (sim, now) {
      var dt = st.lastT ? Math.min((now - st.lastT) / 1000, 0.05) : 0; st.lastT = now;
      if (!sim.reduceMotion) step(sim, dt);
      else if (!st.drops.length && !st.pairs.length) { step(sim, 1.2); }
      var ctx = sim.ctx, c = sim.colors, L = layout(sim);
      D.clear(ctx, L.W, L.H, c.bg);
      if (sim.p.mode === 'led') {
        var eg = LEDS[sim.p.led].eg, nm = 1240 / eg, col = wlRGB(nm);
        drawBands(ctx, c, L.A, eg, nm, col, L);
        drawLed(ctx, c, L.B, sim, nm, col, L);
      } else {
        var sol = solveSolar(sim.p.sun, sim.p.rl);
        drawCell(ctx, c, L.A, sim, sol, L);
        drawPanelIV(ctx, c, L.B, sim, sol, L);
      }
    }
  });
})();
