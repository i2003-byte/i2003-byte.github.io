/* =====================================================================
   Electricity & Magnetism · Faraday's Law of Induction — sim.js
   ---------------------------------------------------------------------
   A bar magnet (length 6 cm, radius 1 cm) moves along the axis of a
   coil (N turns spread over 6 cm, radius 2 cm) joined to a centre-zero
   meter. The magnet is two magnetic poles ±q at its ends, with
   μ0·q = B_r·(area of the magnet). Counting the field inside the
   magnet too, the flux through one turn at axial distance d from each
   pole is
     Φ = (μ0 q / 2) · ( d_S / √(d_S² + R²) − d_N / √(d_N² + R²) )
   which is smooth even while the magnet is inside the coil. The flux
   linkage NΦ is averaged over 24 turn positions along the coil.
     emf ε = −d(NΦ)/dt     (mV = −(mWb per second))
   Current I = ε / (R_coil + R_meter), R_coil = 0.02 Ω per turn, R_meter = 50 Ω.
   Real time. "Drag" modes follow the pointer smoothly.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var LM = 0.06, RM = 0.01, LC = 0.06, RC = 0.02, K = 24, RG = 50, SPAN = 0.36;
  var BR = { ferrite: 0.4, alnico: 0.8, neo: 1.2 };

  var st = {};
  function phi0(p) { return BR[p.mag] * Math.PI * RM * RM; }
  function poles(p, xm) { var n = p.flip ? -1 : 1; return { xN: xm + n * LM / 2, xS: xm - n * LM / 2 }; }
  // flux linkage (Wb-turns) for magnet centre xm and coil centre xc
  function linkage(p, xm, xc) {
    var P = poles(p, xm), q = phi0(p) / 2, sum = 0;
    for (var i = 0; i < K; i++) {
      var xl = xc - LC / 2 + LC * (i + 0.5) / K, dS = xl - P.xS, dN = xl - P.xN;
      sum += q * (dS / Math.hypot(dS, RC) - dN / Math.hypot(dN, RC));
    }
    return p.N * sum / K;
  }
  function autoPos(p, t) {
    // in → rest → out → rest, smooth steps with peak speed = p.v
    var Dd = 0.13, Tm = 1.5 * Dd / p.v, rest = 0.8, T = 2 * (Tm + rest), u = t % T, a0 = -0.15, a1 = a0 + Dd;
    function s(x) { x = M.clamp(x, 0, 1); return x * x * (3 - 2 * x); }
    if (u < Tm) return a0 + Dd * s(u / Tm);
    if (u < Tm + rest) return a1;
    if (u < 2 * Tm + rest) return a1 - Dd * s((u - Tm - rest) / Tm);
    return a0;
  }
  function moving(p) { return p.move === 'coil' ? 'coil' : 'magnet'; }

  SimLab.createSim({
    ariaLabel: 'A bar magnet and a coil of wire joined to a centre-zero meter. Drag the magnet into and out of the coil, or drag the coil over the magnet, and the meter needle kicks one way or the other. The faster the change, the bigger the kick; when nothing moves the needle rests at zero. A graph shows the flux linkage and the induced emf against time',
    autoplay: true,
    mobileAspect: '1 / 1',
    params: [
      { id: 'move', label: 'What moves', type: 'select', value: 'magnet', options: [
        { value: 'magnet', label: 'Drag the magnet' }, { value: 'coil', label: 'Drag the coil (magnet stays still)' }, { value: 'auto', label: 'Machine pushes the magnet in and out' }] },
      { id: 'v', label: 'Machine speed (peak)', min: 0.05, max: 1.5, step: 0.05, value: 0.4, unit: 'm/s', help: 'Only for “Machine pushes the magnet”.' },
      { id: 'N', label: 'Turns in the coil N', min: 50, max: 1000, step: 50, value: 400 },
      { id: 'mag', label: 'Magnet', type: 'select', value: 'ferrite', options: [
        { value: 'ferrite', label: 'Ordinary ferrite magnet (0.4 T)' }, { value: 'alnico', label: 'Alnico magnet (0.8 T)' }, { value: 'neo', label: 'Neodymium magnet (1.2 T)' }] },
      { id: 'flip', label: 'Turn the magnet round (S pole faces the coil)', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'emf', label: 'Induced emf ε', short: 'emf', unit: 'mV', digits: 0, key: true },
      { id: 'link', label: 'Flux linkage NΦ', short: 'NΦ', unit: 'mWb', digits: 1, key: true },
      { id: 'vrel', label: 'Speed of the magnet relative to the coil', short: 'Speed', unit: 'm/s', digits: 2, key: true },
      { id: 'I', label: 'Current in the circuit', unit: 'mA', digits: 2 },
      { id: 'R', label: 'Resistance (coil + meter)', unit: 'Ω', digits: 0 },
      { id: 'pole', label: 'Coil end facing the magnet acts as' }
    ],
    graph: { title: 'Flux linkage and induced emf', yLabel: 'mWb · mV', window: 6, symmetric: true,
      series: [{ label: 'flux linkage NΦ (mWb)', color: '--sim-2' }, { label: 'emf ε (mV)', color: '--sim-1' }] },

    reset: function (sim) {
      st.xm = -0.15; st.xc = 0; st.tm = st.xm; st.tc = st.xc; st.emf = 0; st.vrel = 0; st.t = 0;
      st.L = linkage(sim.p, st.xm, st.xc); st.drag = false;
    },
    onParam: function (sim, id) {
      if (id === 'move' || id === 'v') { sim.reset(); return true; }
      st.L = linkage(sim.p, st.xm, st.xc); st.emf = 0;
      return true;
    },
    update: function (sim, dt) {
      var p = sim.p; st.t += dt;
      var oldRel = st.xm - st.xc;
      if (p.move === 'auto') { st.xm = autoPos(p, st.t); st.xc = 0; }
      else { var k = 1 - Math.exp(-dt / 0.04); st.xm += (st.tm - st.xm) * k; st.xc += (st.tc - st.xc) * k; }
      var L = linkage(p, st.xm, st.xc), e = -(L - st.L) / dt;
      st.emf += (e - st.emf) * (1 - Math.exp(-dt / 0.012));
      st.vrel += (((st.xm - st.xc) - oldRel) / dt - st.vrel) * (1 - Math.exp(-dt / 0.012));
      st.L = L;
    },
    sample: function () { return [st.L * 1000, st.emf * 1000]; },
    readout: function (sim) {
      var p = sim.p, R = p.N * 0.02 + RG;
      return { emf: st.emf * 1000, link: st.L * 1000, vrel: Math.abs(st.vrel), I: st.emf / R * 1000, R: R, pole: inducedPole(p) || 'nothing (no change)' };
    },
    status: function (sim) {
      var e = Math.abs(st.emf) * 1000;
      if (e < 2) return sim.p.move === 'auto' ? 'Magnet still: flux not changing, no emf' : 'Drag the ' + moving(sim.p) + ' to change the flux';
      return (-st.emf * (st.L >= 0 ? 1 : -1) > 0 ? 'Flux linkage growing' : 'Flux linkage shrinking') + ': ε = ' + M.fmt(st.emf * 1000, 0) + ' mV';
    },
    pointer: {
      hover: function () { return true; },
      down: function (sim, x) {
        if (sim.p.move === 'auto') return false;
        if (!sim.running) sim.play();
        var g = geo(sim), wx = (x - g.cx) / g.s;
        st.grab = wx - (moving(sim.p) === 'coil' ? st.tc : st.tm); st.drag = true; return true;
      },
      move: function (sim, x) {
        var g = geo(sim), wx = M.clamp((x - g.cx) / g.s - st.grab, -SPAN / 2 + 0.03, SPAN / 2 - 0.03);
        if (moving(sim.p) === 'coil') st.tc = wx; else st.tm = wx;
      },
      up: function () { st.drag = false; }
    },
    draw: function (sim) { drawScene(sim); }
  });

  // which pole appears on the coil end facing the magnet (Lenz)
  function inducedPole(p) {
    if (Math.abs(st.emf) < 0.002) return '';
    // ε > 0 → current makes a field along +x → right end of the coil is N
    var rightN = st.emf > 0, magnetLeft = st.xm < st.xc;
    var facingIsN = magnetLeft ? !rightN : rightN;
    return facingIsN ? 'N pole' : 'S pole';
  }

  function geo(sim) {
    var W = sim.width, H = sim.height, small = W < 560;
    var s = Math.min((W - 20) / SPAN, (H * 0.5) / (RC * 4));
    return { W: W, H: H, s: s, cx: W / 2, cy: H * (small ? 0.3 : 0.32), small: small };
  }

  function drawScene(sim) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, g = geo(sim), s = g.s, W = g.W, H = g.H, small = g.small;
    D.clear(ctx, W, H, c.bg);
    var X = function (x) { return g.cx + x * s; }, cy = g.cy;
    var xc = X(st.xc), half = LC / 2 * s, rc = RC * s, nLoops = M.clamp(Math.round(p.N / 25), 6, 32);
    var ew = Math.max(4, rc * 0.35);
    // meter position
    var mR = Math.min(W * 0.2, H * 0.2, 110), mx = W / 2, my = H - mR * 0.3 - (small ? 26 : 32);
    // wires from coil ends to meter
    var wy = cy + rc + 2, lx = xc - half, rx = xc + half;
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(lx, cy + rc); ctx.lineTo(lx, my - mR * 0.2); ctx.lineTo(mx - mR * 0.95, my - mR * 0.2);
    ctx.moveTo(rx, cy + rc); ctx.lineTo(rx, my - mR * 0.2); ctx.lineTo(mx + mR * 0.95, my - mR * 0.2); ctx.stroke();
    // back halves of the turns
    function turns(front) {
      for (var i = 0; i < nLoops; i++) {
        var x = xc - half + (2 * half) * (i + 0.5) / nLoops;
        ctx.beginPath(); ctx.ellipse(x, cy, ew, rc, 0, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : Math.PI * 1.5);
        ctx.strokeStyle = front ? '#f59e0b' : '#92400e'; ctx.lineWidth = front ? 2.4 : 1.8; ctx.stroke();
      }
    }
    turns(false);
    // magnet
    var xm = X(st.xm), ml = LM * s, mr = RM * s, nLeft = !!p.flip;
    var lCol = nLeft ? '#dc2626' : '#2563eb', rCol = nLeft ? '#2563eb' : '#dc2626';
    D.roundRect(ctx, xm - ml / 2, cy - mr, ml / 2, mr * 2, 3, lCol);
    D.roundRect(ctx, xm, cy - mr, ml / 2, mr * 2, 3, rCol);
    var fs = Math.max(10, Math.min(mr * 1.3, 16));
    D.text(ctx, nLeft ? 'N' : 'S', xm - ml / 4, cy + 1, { color: '#fff', size: fs, weight: 800, align: 'center' });
    D.text(ctx, nLeft ? 'S' : 'N', xm + ml / 4, cy + 1, { color: '#fff', size: fs, weight: 800, align: 'center' });
    if (p.move !== 'coil' && p.move !== 'auto' && !st.drag && sim.time < 6) D.text(ctx, '⇆ drag', xm, cy - mr - 10, { color: c.muted, size: small ? 10 : 12, align: 'center', weight: 600 });
    turns(true);
    if (p.move === 'coil' && !st.drag && sim.time < 6) D.text(ctx, '⇆ drag the coil', xc, cy - rc - 12, { color: c.muted, size: small ? 10 : 12, align: 'center', weight: 600 });
    // induced current arrows and poles
    var e = st.emf, shown = Math.abs(e) > 0.002;
    if (shown) {
      var dir = e > 0 ? 1 : -1, ax = xc, yTop = cy - rc * 0.55, yBot = cy + rc * 0.55;
      D.arrow(ctx, ax + ew + 3, dir > 0 ? yTop : yBot, ax + ew + 3, dir > 0 ? yBot : yTop, '#4ade80', 2.5, 8);
      var rightN = e > 0;
      D.text(ctx, rightN ? 'N' : 'S', rx + ew + 10, cy - rc - 6, { color: rightN ? '#f87171' : '#60a5fa', size: small ? 12 : 15, weight: 800, align: 'center' });
      D.text(ctx, rightN ? 'S' : 'N', lx - ew - 10, cy - rc - 6, { color: rightN ? '#60a5fa' : '#f87171', size: small ? 12 : 15, weight: 800, align: 'center' });
    }
    D.text(ctx, p.N + ' turns', xc, cy + rc + (small ? 12 : 16), { color: c.muted, size: small ? 10 : 12, align: 'center', bg: D.alpha(c.bg, 0.7), pad: 2 });
    // flux bar (top left)
    var fl = st.L * 1000, maxL = p.N * phi0(p) * 1000 * 0.8, bw = Math.min(W * 0.36, 180), bx = 10, by = 10, bh = small ? 8 : 10;
    D.text(ctx, 'flux linkage NΦ = ' + M.fmt(fl, 1) + ' mWb', bx, by + 6, { color: c.ink, size: small ? 10 : 12, weight: 600 });
    D.roundRect(ctx, bx, by + 14, bw, bh, 4, D.alpha(c.ink, 0.1));
    var f = M.clamp(fl / maxL, -1, 1);
    D.roundRect(ctx, bx + bw / 2 + Math.min(0, f) * bw / 2, by + 14, Math.abs(f) * bw / 2, bh, 3, c.s2);
    D.line(ctx, bx + bw / 2, by + 12, bx + bw / 2, by + 16 + bh, D.alpha(c.ink, 0.6), 1);
    // centre-zero meter
    drawMeter(ctx, c, mx, my, mR, e * 1000, small);
  }

  function drawMeter(ctx, c, x, y, R, mv, small) {
    var full = 1000;
    ctx.beginPath(); ctx.moveTo(x - R, y + R * 0.3); ctx.lineTo(x - R, y - R * 0.55); ctx.arc(x, y, R, Math.PI * 1.2, Math.PI * 1.8); ctx.lineTo(x + R, y + R * 0.3); ctx.closePath();
    ctx.fillStyle = c.light ? '#f8fafc' : '#1e293b'; ctx.fill(); ctx.strokeStyle = D.alpha(c.ink, 0.5); ctx.lineWidth = 2; ctx.stroke();
    var py = y + R * 0.15, r = R * 0.95, a0 = -Math.PI / 2, span = 0.75;
    for (var i = -5; i <= 5; i++) {
      var a = a0 + span * i / 5, len = i % 5 === 0 ? 10 : 6;
      D.line(ctx, x + Math.cos(a) * (r - len), py + Math.sin(a) * (r - len), x + Math.cos(a) * r, py + Math.sin(a) * r, D.alpha(c.ink, 0.6), 1.5);
    }
    D.text(ctx, '−1 V', x + Math.cos(a0 - span) * (r - 22), py + Math.sin(a0 - span) * (r - 22) + 4, { color: c.muted, size: small ? 9 : 10, align: 'center' });
    D.text(ctx, '+1 V', x + Math.cos(a0 + span) * (r - 22), py + Math.sin(a0 + span) * (r - 22) + 4, { color: c.muted, size: small ? 9 : 10, align: 'center' });
    D.text(ctx, '0', x, py - r + 18, { color: c.muted, size: small ? 9 : 10, align: 'center' });
    var over = Math.abs(mv) > full, f = M.clamp(mv / full, -1.08, 1.08), an = a0 + span * f;
    D.line(ctx, x, py, x + Math.cos(an) * (r - 4), py + Math.sin(an) * (r - 4), over ? '#ef4444' : c.ink, 2.5);
    D.circle(ctx, x, py, 4, c.ink);
    D.text(ctx, over ? 'off the scale!' : 'centre-zero meter', x, y + R * 0.3 + (small ? 9 : 11), { color: over ? '#ef4444' : c.muted, size: small ? 9 : 10, align: 'center', weight: over ? 700 : 500 });
  }
})();
