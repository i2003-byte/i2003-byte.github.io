/* =====================================================================
   Electricity · Rectifier: AC to DC — sim.js
   ---------------------------------------------------------------------
   A 230 V → 12 V (rms) transformer, 50 Hz: peak Vm = 12√2 = 16.97 V.
     half-wave:   one diode, output pulses 50 times a second
     centre-tap:  two diodes, each half of the winding gives 12 V rms
     bridge:      four diodes (two conduct at a time, 2 × 0.7 V lost)
   Each diode = 0.7 V drop + ideal switch; winding resistance Rs = 1 Ω.
   Output node: C dV/dt = (v_rect − V)/Rs (only while a diode conducts)
   − V/R, stepped with implicit Euler (stable even for tiny C).
   Ripple estimate: ΔV ≈ I_load / (f_ripple · C), f_ripple = 50 or 100 Hz.
   Time runs 100× slower than real (one 20 ms cycle in 2 s).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var VM = 12 * Math.SQRT2, F = 50, VD = 0.7, RS = 1, SLOW = 0.01, WIN = 0.06, DT = 1e-4;
  var st = { t: 0, V: 0, Id: 0, vin: 0, buf: [], acc: 0, phase: 0 };

  function rect(mode, vin) {   // voltage offered to the output, and which diodes would conduct
    if (mode === 'half') return { v: vin - VD, on: vin > 0 ? ['D1'] : [] };
    if (mode === 'centre') return { v: Math.abs(vin) - VD, on: vin > 0 ? ['D1'] : ['D2'] };
    return { v: Math.abs(vin) - 2 * VD, on: vin > 0 ? ['D1', 'D3'] : ['D2', 'D4'] };
  }
  function stepCircuit(sim, h) {
    var C = sim.p.c * 1e-6, R = sim.p.r, mode = sim.p.mode;
    st.t += h; st.vin = VM * Math.sin(2 * Math.PI * F * st.t);
    var r = rect(mode, st.vin), V;
    if (C <= 0) { V = r.v > 0 ? r.v * R / (R + RS) : 0; st.Id = r.v > 0 ? V / R : 0; }
    else {
      var Vc = (st.V + h * r.v / (RS * C)) / (1 + h * (1 / RS + 1 / R) / C);
      if (r.v > st.V && Vc < r.v) { V = Vc; st.Id = (r.v - V) / RS; }
      else { V = st.V / (1 + h / (R * C)); st.Id = 0; }
    }
    st.V = V; st.on = st.Id > 0 ? r.on : [];
  }
  function stats() {
    var b = st.buf, n = b.length, k0 = n - 1, lo = Infinity, hi = -Infinity, sum = 0, cnt = 0, onc = 0;
    for (var k = k0; k >= 0 && b[k0].t - b[k].t < 0.02; k--) { var v = b[k].v; lo = Math.min(lo, v); hi = Math.max(hi, v); sum += v; cnt++; if (b[k].i > 0) onc++; }
    return cnt ? { lo: lo, hi: hi, avg: sum / cnt, on: onc / cnt, full: b[k0].t - b[0].t >= 0.02 } : { lo: 0, hi: 0, avg: 0, on: 0, full: false };
  }

  /* ---------- drawing helpers ---------- */
  function wire(ctx, pts, col, w) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w || 2; ctx.lineJoin = 'round'; ctx.beginPath();
    pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); ctx.restore();
  }
  // diode from anode a to cathode b (conventional current a → b)
  function diode(ctx, c, a, b, on, label, sz) {
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    var col = on ? c.warning : c.ink;
    wire(ctx, [a, b], on ? c.warning : c.ink, 2);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(-sz * 0.7, -sz * 0.75); ctx.lineTo(-sz * 0.7, sz * 0.75); ctx.lineTo(sz * 0.6, 0); ctx.closePath();
    ctx.fillStyle = on ? D.alpha(c.warning, 0.85) : c.bg; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sz * 0.6, -sz * 0.8); ctx.lineTo(sz * 0.6, sz * 0.8); ctx.lineWidth = 2.6; ctx.stroke();
    ctx.restore();
    var nx = -Math.sin(ang), ny = Math.cos(ang);
    D.text(ctx, label, mx + nx * (sz + 9) * (ny < 0 ? -1 : 1), my + ny * (sz + 9) * (ny < 0 ? -1 : 1), { color: on ? c.warning : c.muted, size: 11, weight: 700, align: 'center' });
  }
  function hop(ctx, c, x, y, col, colV) {   // a horizontal wire hopping over a vertical one (not joined)
    D.line(ctx, x - 6, y, x + 6, y, c.bg, 5);
    D.line(ctx, x, y - 8, x, y + 8, colV, 2);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 6, Math.PI, 0); ctx.stroke(); ctx.restore();
  }
  function coil(ctx, x, y1, y2, dir, col) {
    var n = 6, hgt = (y2 - y1) / n;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
    for (var i = 0; i < n; i++) ctx.arc(x, y1 + hgt * (i + 0.5), hgt / 2, -Math.PI / 2, Math.PI / 2, dir < 0);
    ctx.stroke(); ctx.restore();
  }
  // dots moving along a polyline; s = phase (0…1 per segment length unit)
  function dots(ctx, pts, phase, col, gap) {
    var segs = [], tot = 0;
    for (var i = 1; i < pts.length; i++) { var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); tot += l; }
    for (var d = (phase % gap + gap) % gap; d < tot; d += gap) {
      var acc = 0;
      for (var j = 0; j < segs.length; j++) {
        if (d <= acc + segs[j]) { var f = (d - acc) / segs[j]; D.circle(ctx, pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f, 2.6, col); break; }
        acc += segs[j];
      }
    }
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.1, C, S;
    if (wide) { var cw = W * 0.55; C = { x: 8, y: 26, w: cw - 14, h: H - 40 }; S = { x: cw + 4, y: 10, w: W - cw - 14, h: H - 20 }; }
    else { var ch = H * 0.54; C = { x: 6, y: 24, w: W - 12, h: ch - 30 }; S = { x: 6, y: ch + 2, w: W - 12, h: H - ch - 6 }; }
    return { W: W, H: H, C: C, S: S, narrow: W < 560 };
  }

  function drawCircuit(ctx, c, L, sim) {
    var B = L.C, mode = sim.p.mode;
    function X(f) { return B.x + f * B.w; } function Y(f) { return B.y + f * B.h; }
    var on = st.on || [], dsz = M.clamp(B.h / 22, 6, 10), ink = c.ink, chg = c.warning;
    var isOn = function (d) { return on.indexOf(d) >= 0; };
    // transformer
    var y1 = Y(0.12), y3 = Y(0.88), xp = X(0.05), xs = X(0.115), xt = X(0.16);
    coil(ctx, xp, y1 + 6, y3 - 6, 1, c.muted);
    coil(ctx, xs, y1 + 6, y3 - 6, -1, ink);
    D.line(ctx, (xp + xs) / 2 - 2, y1 + 4, (xp + xs) / 2 - 2, y3 - 4, c.muted, 1.5);
    D.line(ctx, (xp + xs) / 2 + 2, y1 + 4, (xp + xs) / 2 + 2, y3 - 4, c.muted, 1.5);
    D.text(ctx, '230 V', B.x, B.y - 12, { color: c.muted, size: 10.5, align: 'left' });
    D.text(ctx, mode === 'centre' ? '2 × 12 V' : '12 V', xt - 2, B.y - 12, { color: ink, size: 10.5, weight: 700, align: 'left' });
    wire(ctx, [[xs, y1 + 6], [xs, y1], [xt, y1]], ink);
    wire(ctx, [[xs, y3 - 6], [xs, y3], [xt, y3]], ink);
    var pol = st.vin >= 0 ? ['+', '−'] : ['−', '+'];
    D.text(ctx, pol[0], xt + 2, y1 - 9, { color: st.vin >= 0 ? c.danger : c.s1, size: 12, weight: 800, align: 'center' });
    D.text(ctx, pol[1], xt + 2, y3 + 10, { color: st.vin >= 0 ? c.s1 : c.danger, size: 12, weight: 800, align: 'center' });

    var top, gnd, xc, xl, chargePath = [], loadPath;
    if (mode === 'half') {
      top = y1; gnd = y3; xc = X(0.6); xl = X(0.82); if (!sim.p.c) xc = xl;
      diode(ctx, c, [xt, y1], [X(0.42), y1], isOn('D1'), 'D1', dsz);
      wire(ctx, [[X(0.42), top], [xl, top]], ink); wire(ctx, [[xt, gnd], [xl, gnd]], ink);
      loadPath = [[X(0.42), top], [xl, top], [xl, gnd], [xt, gnd]];
      if (isOn('D1')) chargePath = [[xt, y1], [xc, top], [xc, gnd], [xt, gnd]];
    } else if (mode === 'centre') {
      var yc = Y(0.5); top = y1; gnd = yc; xc = X(0.55); xl = X(0.76); if (!sim.p.c) xc = xl;
      wire(ctx, [[xs, yc], [xt, yc]], ink); D.circle(ctx, xs, yc, 3, ink);
      D.text(ctx, 'centre tap', xt + 4, yc + 12, { color: c.muted, size: 10, align: 'left' });
      diode(ctx, c, [xt, y1], [X(0.36), y1], isOn('D1'), 'D1', dsz);
      diode(ctx, c, [xt, y3], [X(0.36), y3], isOn('D2'), 'D2', dsz);
      wire(ctx, [[X(0.36), y1], [X(0.94), y1]], ink);
      wire(ctx, [[X(0.36), y3], [X(0.94), y3], [X(0.94), y1]], isOn('D2') ? chg : ink);
      D.circle(ctx, X(0.94), y1, 3, ink);
      wire(ctx, [[xt, yc], [xl, yc]], ink);
      loadPath = [[X(0.36), top], [xl, top], [xl, gnd], [xt, gnd]];
      if (isOn('D1')) chargePath = [[xt, y1], [xc, y1], [xc, yc], [xt, yc]];
      if (isOn('D2')) chargePath = [[xt, y3], [X(0.94), y3], [X(0.94), y1], [xc, y1], [xc, yc], [xt, yc]];
    } else {
      var cx = X(0.4), cy = Y(0.5), s = Math.min(B.w * 0.16, B.h * 0.36);
      var Lc = [cx - s, cy], Rc = [cx + s, cy], T = [cx, cy - s], Bt = [cx, cy + s];
      top = T[1]; gnd = Bt[1]; xc = X(0.68); xl = X(0.88); if (!sim.p.c) xc = xl;
      var yB = Math.max(y3, Bt[1] + 14);
      wire(ctx, [[xt, y1], [Lc[0], y1], Lc], isOn('D1') ? chg : ink);
      wire(ctx, [[xt, y3], [xt, yB], [Rc[0], yB], Rc], isOn('D2') ? chg : ink);
      diode(ctx, c, Lc, T, isOn('D1'), 'D1', dsz * 0.85);
      diode(ctx, c, Rc, T, isOn('D2'), 'D2', dsz * 0.85);
      diode(ctx, c, Bt, Rc, isOn('D3'), 'D3', dsz * 0.85);
      diode(ctx, c, Bt, Lc, isOn('D4'), 'D4', dsz * 0.85);
      wire(ctx, [T, [xl, top]], ink); wire(ctx, [Bt, [xl, gnd]], ink);
      hop(ctx, c, Rc[0], gnd, ink, isOn('D2') ? chg : ink);   // the wire up to Rc crosses the ground rail
      loadPath = [T, [xl, top], [xl, gnd], Bt];
      if (isOn('D1')) chargePath = [[xt, y1], [Lc[0], y1], Lc, T, [xc, top], [xc, gnd], Bt, Rc, [Rc[0], yB], [xt, yB], [xt, y3]];
      if (isOn('D2')) chargePath = [[xt, y3], [xt, yB], [Rc[0], yB], Rc, T, [xc, top], [xc, gnd], Bt, Lc, [Lc[0], y1], [xt, y1]];
    }
    // capacitor and load
    var C = sim.p.c, mid = (top + gnd) / 2, cw = Math.min(26, B.w * 0.06);
    if (C > 0) {
      wire(ctx, [[xc, top], [xc, mid - 4]], ink); wire(ctx, [[xc, mid + 4], [xc, gnd]], ink);
      D.line(ctx, xc - cw / 2, mid - 4, xc + cw / 2, mid - 4, c.s1, 3); D.line(ctx, xc - cw / 2, mid + 4, xc + cw / 2, mid + 4, c.s1, 3);
      D.circle(ctx, xc, top, 3, ink); D.circle(ctx, xc, gnd, 3, ink);
      D.text(ctx, C + ' µF', xc + cw / 2 + 4, mid, { color: c.s1, size: 10.5, weight: 700, align: 'left' });
    }
    var rh = Math.min(44, (gnd - top) * 0.5);
    wire(ctx, [[xl, top], [xl, mid - rh / 2]], ink); wire(ctx, [[xl, mid + rh / 2], [xl, gnd]], ink);
    D.roundRect(ctx, xl - 8, mid - rh / 2, 16, rh, 3, D.alpha(c.s4, 0.2), c.s4, 2);
    D.text(ctx, sim.p.r + ' Ω', xl + 12, mid, { color: c.s4, size: 10.5, weight: 700, align: 'left', fit: L.W });
    D.text(ctx, 'load', xl, gnd + 12, { color: c.muted, size: 10, align: 'center' });
    D.text(ctx, '+', xl + 10, top - 8, { color: c.danger, size: 12, weight: 800, align: 'center' });
    // moving charge
    if (st.Id > 0 && chargePath.length > 1) dots(ctx, chargePath, st.phase * 2, chg, 16);
    var IL = st.V / sim.p.r;
    if (IL > 1e-4) dots(ctx, loadPath, st.phase * M.clamp(IL / 0.03, 0.15, 1.5), c.s4, 18);
    var title = mode === 'half' ? 'Half-wave: one diode' : mode === 'centre' ? 'Full-wave: centre-tap, two diodes' : 'Full-wave: bridge, four diodes';
    D.text(ctx, title, X(0.3), B.y - 12, { color: ink, size: L.narrow ? 11.5 : 13, weight: 700, fit: L.W });
  }

  function drawScope(ctx, c, S, sim) {
    D.roundRect(ctx, S.x, S.y, S.w, S.h, 10, D.alpha(c.ink, 0.03), D.alpha(c.ink, 0.1));
    var px = S.x + 34, pw = S.w - 44, py = S.y + 22, ph = S.h - 46, oy = py + ph * 0.5;
    var Vmax = 18;
    function Yv(v) { return oy - v / Vmax * ph / 2; }
    D.grid(ctx, px, py, pw, ph, ph / 6, c.grid);
    D.line(ctx, px, oy, px + pw, oy, c.axis, 1.2);
    [-15, 0, 15].forEach(function (v) { D.text(ctx, String(v), px - 4, Yv(v), { color: c.faint, size: 9.5, align: 'right' }); });
    D.text(ctx, 'V', px - 24, py - 8, { color: c.muted, size: 10 });
    var b = st.buf; if (!b.length) return;
    var tEnd = b[b.length - 1].t, t0 = tEnd - WIN;
    function Xt(t) { return px + (t - t0) / WIN * pw; }
    for (var ms = Math.ceil(t0 / 0.01) * 0.01; ms <= tEnd + 1e-9; ms += 0.01) {
      D.text(ctx, Math.round(ms * 1000) + '', Xt(ms), py + ph + 10, { color: c.faint, size: 9.5, align: 'center' });
    }
    D.text(ctx, 'time (ms)', px + pw, py + ph + 21, { color: c.faint, size: 9.5, align: 'right' });
    function trace(key, col, w) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.beginPath();
      var first = true;
      for (var k = 0; k < b.length; k++) { if (b[k].t < t0) continue; var x = Xt(b[k].t), y = Yv(b[k][key]); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
    }
    trace('a', D.alpha(c.muted, 0.7), 1.5);
    trace('v', c.s4, 2.6);
    var s = stats();
    if (s.full) {
      D.line(ctx, px, Yv(s.avg), px + pw, Yv(s.avg), D.alpha(c.warning, 0.8), 1.2, [5, 4]);
      D.text(ctx, 'DC ≈ ' + M.fmt(s.avg, 1) + ' V', px + pw - 2, Yv(s.avg) - 9, { color: c.warning, size: 10.5, weight: 700, align: 'right', bg: D.alpha(c.bg, 0.8), pad: 2 });
    }
    D.text(ctx, '— AC in (winding)', px, py - 10, { color: c.muted, size: 10.5 });
    D.text(ctx, '— output across load', px + Math.min(pw * 0.45, 130), py - 10, { color: c.s4, size: 10.5, weight: 700 });
  }

  SimLab.createSim({
    ariaLabel: 'A rectifier circuit: a 12 volt transformer, one, two or four diodes, a smoothing capacitor and a load resistor. Glowing diodes show which ones conduct, moving dots show the current, and an oscilloscope compares the AC input with the output',
    playLabel: 'Switch on',
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'mode', label: 'Rectifier', type: 'select', value: 'half', options: [
        { value: 'half', label: 'Half-wave (1 diode)' }, { value: 'centre', label: 'Full-wave, centre-tap (2 diodes)' }, { value: 'bridge', label: 'Full-wave bridge (4 diodes)' }] },
      { id: 'c', label: 'Smoothing capacitor C', min: 0, max: 2200, step: 10, value: 0, unit: 'µF', presets: [0, 100, 470, 1000, 2200] },
      { id: 'r', label: 'Load resistance R', min: 50, max: 2000, step: 10, value: 500, unit: 'Ω', presets: [100, 500, 1000], help: 'Smaller R draws more current, like a hungrier device.' }
    ],
    readouts: [
      { id: 'dc', label: 'Average (DC) output', short: 'DC out', unit: 'V', digits: 1, key: true },
      { id: 'rip', label: 'Ripple (peak to peak)', short: 'Ripple', unit: 'V', digits: 2, key: true },
      { id: 'pk', label: 'Peak output', unit: 'V', digits: 1 },
      { id: 'il', label: 'Load current (average)', unit: 'mA', digits: 0 },
      { id: 'fr', label: 'Ripple frequency', unit: 'Hz', digits: 0 },
      { id: 'on', label: 'Diodes conduct for', unit: '% of the time', digits: 0 }
    ],
    reset: function (sim) { st.t = 0; st.V = 0; st.Id = 0; st.vin = 0; st.buf = []; st.acc = 0; st.on = []; st.buf.push({ t: 0, a: 0, v: 0, i: 0 }); },
    onParam: function (sim, id) { if (id === 'mode') { st.V = 0; st.buf = []; st.buf.push({ t: st.t, a: st.vin, v: 0, i: 0 }); } return true; },
    update: function (sim, dt) {
      st.acc += dt * SLOW; st.phase += dt * 60;
      while (st.acc >= DT) {
        st.acc -= DT;
        for (var k = 0; k < 4; k++) stepCircuit(sim, DT / 4);
        st.buf.push({ t: st.t, a: st.vin, v: st.V, i: st.Id });
      }
      while (st.buf.length > 2 && st.buf[0].t < st.t - WIN * 1.05) st.buf.shift();
    },
    readout: function (sim) {
      var s = stats(), full = sim.p.mode !== 'half';
      return { dc: s.avg, rip: s.full ? s.hi - s.lo : null, pk: s.hi, il: s.avg / sim.p.r * 1000, fr: full ? 100 : 50, on: s.on * 100 };
    },
    status: function (sim) { return st.on && st.on.length ? st.on.join(' + ') + ' conducting' : 'diodes off: ' + (sim.p.c > 0 ? 'the capacitor feeds the load' : 'no current'); },
    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, L = layout(sim);
      D.clear(ctx, L.W, L.H, c.bg);
      drawCircuit(ctx, c, L, sim);
      drawScope(ctx, c, L.S, sim);
    }
  });
})();
