/* =====================================================================
   Electricity · LC Oscillations — sim.js
   ---------------------------------------------------------------------
   A capacitor charged to V₀ (charge Q₀ = C V₀) is connected across a
   coil. Charge flows out, the current builds a magnetic field in the
   coil, the field keeps the current going and charges the capacitor
   the other way, and so on:
     L di/dt + R i + q/C = 0,   i = dq/dt
     ideal (R = 0):  q = Q₀ cos ωt,  ω = 1/√(LC),  f = 1/(2π√(LC))
     energy  UE = q²/(2C)  (electric, in C)
             UB = L i²/2   (magnetic, in L)    UE + UB = Q₀²/(2C)
     peak current I₀ = Q₀ ω = V₀ √(C/L)
   With resistance the energy leaks away as heat; if R ≥ 2√(L/C)
   the charge just drains away without swinging (overdamped).
   A pendulum is the mechanical twin: charge ↔ displacement,
   current ↔ velocity, UE ↔ potential energy, UB ↔ kinetic energy,
   L ↔ mass, 1/C ↔ stiffness.
   The real oscillation (hundreds of hertz) is shown slowed down so
   one cycle takes about 3 s; the readouts give real values.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, TAU = Math.PI * 2, CYCLE = 3;

  function consts(sim) {
    var L = sim.p.L / 1000, C = sim.p.C * 1e-6, Q0 = C * sim.p.V, w = 1 / Math.sqrt(L * C);
    return { L: L, C: C, R: sim.p.R, Q0: Q0, w: w, f: w / TAU, I0: Q0 * w, U0: Q0 * Q0 / (2 * C), Rc: 2 * Math.sqrt(L / C) };
  }
  function fmtE(J) { return J < 1e-3 ? M.fmt(J * 1e6, J < 1e-5 ? 2 : 1) + ' µJ' : M.fmt(J * 1000, 2) + ' mJ'; }
  function fmtI(A) { return Math.abs(A) < 1 ? M.fmt(A * 1000, 0) + ' mA' : M.fmt(A, 2) + ' A'; }
  function energies(sim) {
    var k = consts(sim), s = sim.state;
    return { k: k, ue: s.q * s.q / (2 * k.C), ub: k.L * s.i * s.i / 2 };
  }

  // capacitor plates horizontal on the left side, coil on the right side
  function circuit(ctx, c, b, sim) {
    var k = consts(sim), s = sim.state, narrow = b.w < 360, fs = narrow ? 10 : 11;
    var x0 = b.x + (narrow ? 50 : 70), x1 = b.x + b.w - (narrow ? 52 : 70), y0 = b.y + 22, y1 = b.y + b.h - 18, my = (y0 + y1) / 2;
    var qn = s.q / k.Q0, in_ = s.i / k.I0, gap = M.clamp((y1 - y0) * 0.05, 10, 20), pw = M.clamp((x1 - x0) * 0.4, 44, 84);
    var cl = Math.max(16, Math.min(56, (y1 - y0) / 2 - 16)), wire = c.muted;
    // wires
    D.line(ctx, x0, y0, x1, y0, wire, 2); D.line(ctx, x0, y1, x1, y1, wire, 2);
    D.line(ctx, x0, y0, x0, my - gap, wire, 2); D.line(ctx, x0, my + gap, x0, y1, wire, 2);
    D.line(ctx, x1, y0, x1, my - cl, wire, 2); D.line(ctx, x1, my + cl, x1, y1, wire, 2);
    // switch on the top wire
    var sx = (x0 + x1) / 2, closed = s.t > 0;
    ctx.fillStyle = c.bg; ctx.fillRect(sx - 14, y0 - 3, 28, 6);
    D.circle(ctx, sx - 12, y0, 3, c.ink); D.circle(ctx, sx + 12, y0, 3, c.ink);
    D.line(ctx, sx - 12, y0, sx + 12, closed ? y0 : y0 - 12, c.ink, 2.5);
    D.text(ctx, closed ? 'switch closed' : 'switch open', sx, y0 - (closed ? 11 : 20), { color: c.faint, size: 9, align: 'center' });
    // resistor (only if R > 0) on the bottom wire
    if (k.R > 0) {
      var rx = sx - 18;
      ctx.fillStyle = c.bg; ctx.fillRect(rx, y1 - 8, 36, 16);
      ctx.save(); ctx.strokeStyle = c.s3; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, y1);
      for (var z = 1; z <= 6; z++) ctx.lineTo(rx + 36 * z / 6.5, y1 + (z % 2 ? -6 : 6));
      ctx.lineTo(rx + 36, y1); ctx.stroke(); ctx.restore();
      D.text(ctx, 'R ' + M.fmt(k.R, 1) + ' Ω', sx, y1 + 13, { color: c.s3, size: fs, weight: 700, align: 'center' });
    }
    // moving charge (conventional current): dots slosh round the loop with the charge that has flowed
    var per = 2 * (x1 - x0) + 2 * (y1 - y0), sp = 22, off = (1 - qn) * sp * 2.2;
    function at(d) {
      d = ((d % per) + per) % per;   // clockwise from the bottom-left corner
      var hh = y1 - y0, ww = x1 - x0;
      if (d < hh) return { x: x0, y: y1 - d };
      d -= hh; if (d < ww) return { x: x0 + d, y: y0 };
      d -= ww; if (d < hh) return { x: x1, y: y0 + d };
      d -= hh; return { x: x1 - d, y: y1 };
    }
    for (var dd = 0; dd < per; dd += sp) {
      var p = at(dd + off);
      if (p.x === x0 && Math.abs(p.y - my) < gap + 4) continue;     // no charge crosses the capacitor gap
      if (p.x === x1 && Math.abs(p.y - my) < cl) continue;          // hidden by the coil
      D.circle(ctx, p.x, p.y, 3, D.alpha(c.warning, 0.9));
    }
    if (Math.abs(in_) > 0.04) {
      var dir = in_ < 0 ? 1 : -1, len = 14 + 22 * Math.abs(in_), ay = y1 + (k.R > 0 ? 26 : 14);
      var ax = x0 + (x1 - x0) * 0.22;
      D.arrow(ctx, ax - dir * len / 2, ay, ax + dir * len / 2, ay, c.warning, 2.5, 8);
      D.text(ctx, 'i', ax + dir * (len / 2 + 8), ay, { color: c.warning, size: 12, weight: 800, align: 'center' });
    }
    // capacitor: charge signs and electric field
    D.line(ctx, x0 - pw / 2, my - gap, x0 + pw / 2, my - gap, c.ink, 3.5);
    D.line(ctx, x0 - pw / 2, my + gap, x0 + pw / 2, my + gap, c.ink, 3.5);
    var n = Math.round(Math.abs(qn) * 6), top = qn >= 0 ? '+' : '−', bot = qn >= 0 ? '−' : '+';
    for (var j = 0; j < n; j++) {
      var cx = x0 - pw / 2 + pw * (j + 0.5) / 6;  // signs sit just outside each plate
      D.text(ctx, top, cx, my - gap - 8, { color: top === '+' ? c.danger : c.s1, size: 12, weight: 800, align: 'center' });
      D.text(ctx, bot, cx, my + gap + 8, { color: bot === '+' ? c.danger : c.s1, size: 12, weight: 800, align: 'center' });
    }
    if (Math.abs(qn) > 0.05) for (var e = 0; e < 4; e++) {
      var ex = x0 - pw / 2 + pw * (e + 0.5) / 4, a = 0.25 + 0.75 * Math.abs(qn);
      D.arrow(ctx, ex, qn > 0 ? my - gap + 2 : my + gap - 2, ex, qn > 0 ? my + gap - 2 : my - gap + 2, D.alpha(c.s4, a), 1.5, 5);
    }
    D.text(ctx, 'C', x0 + pw / 2 + 8, my - 6, { color: c.s4, size: 13, weight: 800 });
    D.text(ctx, M.fmt(sim.p.C, 0) + ' µF', x0 + pw / 2 + 8, my + 9, { color: c.faint, size: 9 });
    // coil with its magnetic field
    var ai = Math.abs(in_);
    if (ai > 0.03) {
      [1.0, 1.7].forEach(function (m, idx) {
        var rx2 = (narrow ? 16 : 20) * m, ry = cl + 10 + idx * 8;
        [-1, 1].forEach(function (sd) {
          ctx.save(); ctx.strokeStyle = D.alpha(c.s2, 0.15 + 0.6 * ai); ctx.lineWidth = 1.5; ctx.beginPath();
          ctx.ellipse(x1 + sd * rx2, my, rx2, ry, 0, 0, TAU); ctx.stroke(); ctx.restore();
          // arrow on the outer side: field goes up inside the coil when the current flows down the right side
          var up = in_ < 0, ox = x1 + sd * rx2 * 2, ad = (up ? 1 : -1) * 7;
          D.arrow(ctx, ox, my + ad, ox, my - ad, D.alpha(c.s2, 0.25 + 0.75 * ai), 1.5, 6);
        });
      });
    }
    ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2.2; ctx.beginPath();
    var turns = 6, r = cl / turns;
    for (var t = 0; t < turns; t++) ctx.arc(x1, my - cl + r + t * 2 * r, r, -Math.PI / 2, Math.PI / 2);
    ctx.stroke(); ctx.restore();
    D.text(ctx, 'L', x1 + (narrow ? 40 : 56), my, { color: c.s2, size: 13, weight: 800, align: 'center', fit: b.x + b.w });
    D.text(ctx, M.fmt(sim.p.L, 0) + ' mH', x1 + (narrow ? 40 : 56), my + 15, { color: c.faint, size: 9, align: 'center', fit: b.x + b.w });
  }

  function bars(ctx, c, b, sim, en) {
    var k = en.k, heat = Math.max(0, k.U0 - en.ue - en.ub), fs = b.w < 180 ? 9 : 10;
    var items = [{ v: en.ue, col: c.s4, t: 'In C', t2: 'q²/2C' }, { v: en.ub, col: c.s2, t: 'In L', t2: 'Li²/2' }];
    if (k.R > 0) items.push({ v: heat, col: c.s3, t: 'Heat', t2: 'in R' });
    var top = b.y + 18, bot = b.y + b.h - 28, hh = bot - top, slot = b.w / items.length, bw = Math.min(34, slot * 0.5);
    D.text(ctx, 'Energy', b.x + 2, b.y + 6, { color: c.muted, size: fs + 1, weight: 700 });
    D.line(ctx, b.x + 2, top, b.x + b.w - 2, top, c.faint, 1, [4, 3]);
    D.text(ctx, 'start ' + fmtE(k.U0), b.x + b.w - 2, top - 7, { color: c.faint, size: 9, align: 'right' });
    items.forEach(function (it, i) {
      var x = b.x + slot * (i + 0.5) - bw / 2, h = M.clamp(it.v / k.U0, 0, 1) * hh;
      D.roundRect(ctx, x, top, bw, hh, 4, D.alpha(c.ink, 0.05));
      if (h > 0.5) D.roundRect(ctx, x, bot - h, bw, h, 4, it.col);
      D.text(ctx, it.t, x + bw / 2, bot + 9, { color: it.col, size: fs, weight: 700, align: 'center' });
      D.text(ctx, it.t2, x + bw / 2, bot + 21, { color: c.faint, size: 9, align: 'center' });
    });
  }

  function pendulum(ctx, c, b, sim) {
    var k = consts(sim), s = sim.state, qn = s.q / k.Q0, in_ = s.i / k.I0, fs = b.w < 180 ? 9 : 10;
    var px = b.x + b.w / 2, py = b.y + 22, l = Math.max(20, Math.min(b.h - 66, b.w * 0.9)), tm = M.rad(32), th = tm * qn;
    D.text(ctx, 'Its twin: a pendulum', b.x + b.w / 2, b.y + 6, { color: c.muted, size: fs + 1, weight: 700, align: 'center' });
    D.line(ctx, px - 22, py, px + 22, py, c.ink, 2);
    ctx.save(); ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath();
    ctx.arc(px, py, l, Math.PI / 2 - tm, Math.PI / 2 + tm); ctx.stroke(); ctx.restore();
    var bx = px + l * Math.sin(th), by = py + l * Math.cos(th);
    D.line(ctx, px, py, bx, by, c.muted, 1.5);
    D.circle(ctx, bx, by, 9, c.s4, c.bg, 2);
    if (Math.abs(in_) > 0.04) {
      var ln = 30 * in_;
      D.arrow(ctx, bx, by, bx + ln * Math.cos(th), by - ln * Math.sin(th), c.s2, 2.5, 7);
    }
    var ty = Math.min(b.y + b.h - 18, py + l + 24);
    D.text(ctx, 'height ↔ charge q', px, ty, { color: c.s4, size: fs, weight: 600, align: 'center', fit: b.x + b.w + 4 });
    D.text(ctx, 'speed ↔ current i', px, ty + 13, { color: c.s2, size: fs, weight: 600, align: 'center', fit: b.x + b.w + 4 });
  }

  SimLab.createSim({
    ariaLabel: 'A charged capacitor connected across a coil. Charge flows back and forth, the energy moves between the capacitor\'s electric field and the coil\'s magnetic field, with energy bars and a swinging pendulum as its mechanical twin',
    mobileAspect: '3 / 3.6',
    playLabel: 'Close the switch',
    params: [
      { id: 'L', label: 'Inductance L', min: 1, max: 100, step: 1, value: 10, unit: 'mH' },
      { id: 'C', label: 'Capacitance C', min: 1, max: 100, step: 1, value: 10, unit: 'µF' },
      { id: 'V', label: 'Capacitor charged to', min: 2, max: 20, step: 1, value: 10, unit: 'V' },
      { id: 'R', label: 'Resistance of the wires R', min: 0, max: 20, step: 0.5, value: 0, unit: 'Ω',
        presets: [{ label: 'Ideal 0 Ω', value: 0 }, { label: 'Real 2 Ω', value: 2 }] },
      { id: 'pend', label: 'Show the pendulum twin', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'f', label: 'Frequency f = 1/(2π√LC)', short: 'f', key: true },
      { id: 'split', label: 'Energy now: in C | in L', short: 'C | L energy', key: true },
      { id: 'T', label: 'One cycle takes T' },
      { id: 'q', label: 'Charge on the top plate q' },
      { id: 'i', label: 'Current i' },
      { id: 'i0', label: 'Peak current I₀ = V₀√(C/L)' },
      { id: 'u', label: 'Energy stored at the start ½CV₀²' },
      { id: 'heat', label: 'Lost as heat so far', short: 'Heat', key: true }
    ],
    graph: { title: 'Energy in the capacitor and in the coil (% of the starting energy)', yLabel: '%', yMin: 0, yMax: 100, window: 9,
      series: [{ label: 'in C (electric)', color: '--sim-4' }, { label: 'in L (magnetic)', color: '--sim-2' }, { label: 'total', color: '--text-muted' }] },
    sample: function (sim) { var en = energies(sim), u = en.k.U0; return [en.ue / u * 100, en.ub / u * 100, (en.ue + en.ub) / u * 100]; },
    onParam: function (sim, id) { return id === 'pend'; },
    reset: function (sim) { var k = consts(sim); sim.state = { q: k.Q0, i: 0, t: 0 }; },
    update: function (sim, dt) {
      var k = consts(sim), s = sim.state, rdt = dt / (CYCLE * k.f);
      var y = M.rk4([s.q, s.i], function (v) { return [v[1], -v[0] / (k.L * k.C) - k.R / k.L * v[1]]; }, rdt);
      s.q = y[0]; s.i = y[1]; s.t += rdt;
    },
    readout: function (sim) {
      var en = energies(sim), k = en.k, s = sim.state, tot = en.ue + en.ub || 1;
      return {
        f: M.fmt(k.f, 0) + ' Hz', T: M.fmt(1000 / k.f, 2) + ' ms',
        split: M.fmt(en.ue / tot * 100, 0) + ' % | ' + M.fmt(en.ub / tot * 100, 0) + ' %',
        q: M.fmt(s.q * 1e6, 0) + ' µC (of ' + M.fmt(k.Q0 * 1e6, 0) + ')', i: fmtI(s.i), i0: fmtI(k.I0), u: fmtE(k.U0),
        heat: k.R > 0 ? M.fmt(Math.max(0, 1 - (en.ue + en.ub) / k.U0) * 100, 0) + ' %' : 'none (ideal)'
      };
    },
    status: function (sim) {
      var k = consts(sim);
      if (k.R >= k.Rc) return 'Overdamped: R ≥ 2√(L/C) = ' + M.fmt(k.Rc, 1) + ' Ω, so no swing';
      return M.fmt(k.f, 0) + ' Hz shown ' + M.fmt(CYCLE * k.f, 0) + ' times slower';
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, narrow = W < 560, en = energies(sim), pend = sim.p.pend;
      D.clear(ctx, W, H, c.bg);
      var cb, bb, pb;
      if (narrow) {
        var th = Math.round(H * 0.56);
        cb = { x: 0, y: 4, w: W, h: th - 4 };
        bb = pend ? { x: 10, y: th + 6, w: W * 0.46 - 10, h: H - th - 8 } : { x: 16, y: th + 6, w: W - 32, h: H - th - 8 };
        pb = { x: W * 0.5, y: th + 6, w: W * 0.5 - 8, h: H - th - 8 };
        D.line(ctx, 8, th, W - 8, th, c.grid, 1);
      } else {
        var cw = Math.round(W * 0.58);
        cb = { x: 0, y: 8, w: cw, h: H - 16 };
        bb = pend ? { x: cw + 10, y: 10, w: (W - cw) * 0.42, h: H - 20 } : { x: cw + 20, y: 10, w: W - cw - 40, h: H - 20 };
        pb = { x: cw + 18 + (W - cw) * 0.42, y: 10, w: (W - cw) * 0.58 - 30, h: H - 20 };
        D.line(ctx, cw, 12, cw, H - 12, c.grid, 1);
      }
      circuit(ctx, c, cb, sim);
      bars(ctx, c, bb, sim, en);
      if (pend) pendulum(ctx, c, pb, sim);
    }
  });
})();
