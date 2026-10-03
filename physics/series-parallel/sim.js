/* =====================================================================
   Electricity · Resistors in Series and Parallel — sim.js
   ---------------------------------------------------------------------
   Two or three resistors connected to an ideal battery (no internal
   resistance) and ideal meters.
     series    R = R₁ + R₂ + R₃      same current I = V / R everywhere,
               the voltage divides: Vₖ = I Rₖ (bigger R, bigger share)
     parallel  1/R = 1/R₁ + 1/R₂ + 1/R₃   same voltage V across each,
               the current divides: Iₖ = V / Rₖ, I = ΣIₖ
   "Break R₂" removes one resistor (like a fused bulb): in series the
   whole circuit stops; in parallel only that branch stops.
   Moving dots show conventional current; their speed is proportional
   to the current in that wire (capped so they stay visible).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SUB = ['₁', '₂', '₃'];

  function solve(p) {
    var Rs = [p.R1, p.R2, p.R3].slice(0, p.use3 ? 3 : 2), n = Rs.length;
    var ok = Rs.map(function (_, k) { return !(k === 1 && p.break2); });
    var out = { n: n, Rs: Rs, ok: ok, I: [], Vk: [] };
    if (p.arr === 'series') {
      var Rt = Rs.reduce(function (a, b) { return a + b; }, 0);
      var broken = ok.indexOf(false) >= 0, I = broken ? 0 : p.V / Rt;
      out.Req = broken ? Infinity : Rt; out.It = I;
      Rs.forEach(function (R, k) { out.I[k] = I; out.Vk[k] = broken ? (ok[k] ? 0 : p.V) : I * R; });
    } else {
      var G = 0;
      Rs.forEach(function (R, k) { var Ik = ok[k] ? p.V / R : 0; out.I[k] = Ik; out.Vk[k] = p.V; if (ok[k]) G += 1 / R; });
      out.Req = G > 0 ? 1 / G : Infinity; out.It = p.V * G;
    }
    return out;
  }

  SimLab.createSim({
    ariaLabel: 'A battery connected to two or three resistors in series or in parallel, with the current through and the voltage across each resistor',
    transport: false,
    mobileAspect: '4 / 5',
    params: [
      { id: 'arr', label: 'Connection', type: 'select', value: 'series', options: [
        { value: 'series', label: 'Series (one after another)' }, { value: 'parallel', label: 'Parallel (side by side)' }] },
      { id: 'V', label: 'Battery voltage V', min: 1.5, max: 12, step: 0.5, value: 6, unit: 'V',
        presets: [{ label: '3 V', value: 3 }, { label: '6 V', value: 6 }, { label: '12 V', value: 12 }] },
      { id: 'R1', label: 'R₁', min: 1, max: 30, step: 1, value: 5, unit: 'Ω' },
      { id: 'R2', label: 'R₂', min: 1, max: 30, step: 1, value: 10, unit: 'Ω' },
      { id: 'R3', label: 'R₃', min: 1, max: 30, step: 1, value: 15, unit: 'Ω' },
      { id: 'use3', label: 'Connect R₃ (three resistors)', type: 'toggle', value: true },
      { id: 'break2', label: 'Break R₂ (like a fused bulb)', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'Req', label: 'Equivalent resistance R', unit: 'Ω', digits: 2, key: true },
      { id: 'It', label: 'Current from battery I', unit: 'A', digits: 3, key: true },
      { id: 'P', label: 'Total power P = VI', unit: 'W', digits: 2 },
      { id: 'r1', label: 'R₁: V₁, I₁' }, { id: 'r2', label: 'R₂: V₂, I₂' }, { id: 'r3', label: 'R₃: V₃, I₃' }
    ],
    onParam: function () { return true; },
    reset: function () {},
    animate: function (sim) { return !sim.reduceMotion && solve(sim.p).It > 0; },
    readout: function (sim) {
      var p = sim.p, o = solve(p), r = { Req: isFinite(o.Req) ? o.Req : '∞ (open circuit)', It: o.It, P: p.V * o.It };
      for (var k = 0; k < 3; k++) r['r' + (k + 1)] = k < o.n ? M.fmt(o.Vk[k], 2) + ' V, ' + M.fmt(o.I[k], 3) + ' A' : 'not connected';
      return r;
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, o = solve(p);
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560, wireC = c.light ? '#334155' : '#cbd5e1';
      var Ax = narrow ? 26 : 50, Rx = W - (narrow ? 26 : 50), Ty = narrow ? 52 : 60, By = H - (narrow ? 88 : 82), cx = (Ax + Rx) / 2;
      var par = p.arr === 'parallel', n = o.n;
      if (!par) Ty += (By - Ty) * (narrow ? 0.25 : 0.35); // a single row: bring it nearer the middle
      var My = par ? By - 70 : Ty; // lowest branch row
      var rows = [], segs = []; // segs: {pts:[[x,y],...], I}

      // ---- wires and resistor positions
      var res = [];
      if (par) {
        for (var k = 0; k < n; k++) rows.push(n === 1 ? Ty : Ty + (My - Ty) * k / (n - 1));
        var rw = Math.min(150, (Rx - Ax) * 0.5);
        rows.forEach(function (y, k) { res.push({ x0: cx - rw / 2, x1: cx + rw / 2, y: y }); segs.push({ pts: [[Ax, y], [cx - rw / 2, y]], I: o.I[k] }, { pts: [[cx + rw / 2, y], [Rx, y]], I: o.I[k] }); });
        segs.push({ pts: [[cx - 14, By], [Ax, By], [Ax, My]], I: o.It }, { pts: [[Rx, My], [Rx, By], [cx + 14, By]], I: o.It });
        for (k = n - 1; k > 0; k--) {
          var above = 0; for (var j = 0; j < k; j++) above += o.I[j];
          segs.push({ pts: [[Ax, rows[k]], [Ax, rows[k - 1]]], I: above }, { pts: [[Rx, rows[k - 1]], [Rx, rows[k]]], I: above });
        }
      } else {
        var gap = (Rx - Ax) / n, w = Math.min(gap * 0.62, 120);
        var xs = [Ax];
        for (k = 0; k < n; k++) { var mx = Ax + gap * (k + 0.5); res.push({ x0: mx - w / 2, x1: mx + w / 2, y: Ty }); xs.push(mx - w / 2, mx + w / 2); }
        xs.push(Rx);
        segs.push({ pts: [[cx - 14, By], [Ax, By], [Ax, Ty]], I: o.It });
        for (k = 0; k < xs.length; k += 2) segs.push({ pts: [[xs[k], Ty], [xs[k + 1], Ty]], I: o.It });
        segs.push({ pts: [[Rx, Ty], [Rx, By], [cx + 14, By]], I: o.It });
      }
      ctx.save(); ctx.strokeStyle = wireC; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      segs.forEach(function (s) { ctx.beginPath(); s.pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); });
      ctx.restore();
      if (par) rows.forEach(function (y) { D.circle(ctx, Ax, y, 3.5, wireC); D.circle(ctx, Rx, y, 3.5, wireC); });

      // ---- moving charges
      if (!sim.reduceMotion) segs.forEach(function (s) {
        if (s.I <= 0) return;
        var speed = Math.min(260, 70 * s.I), sp = 24, len = 0, L = [];
        for (var i = 1; i < s.pts.length; i++) { var l = Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]); L.push(l); len += l; }
        for (var d = (now / 1000 * speed) % sp; d < len; d += sp) {
          var q = 0, rem = d; while (q < L.length - 1 && rem > L[q]) { rem -= L[q]; q++; }
          var f = L[q] ? rem / L[q] : 0;
          D.circle(ctx, M.lerp(s.pts[q][0], s.pts[q + 1][0], f), M.lerp(s.pts[q][1], s.pts[q + 1][1], f), 2.6, c.warning);
        }
      });

      // ---- resistors
      res.forEach(function (r, k) {
        var ok = o.ok[k], col = [c.s1, c.s2, c.s4][k], len = r.x1 - r.x0, zz = 6;
        D.roundRect(ctx, r.x0 - 2, r.y - 12, len + 4, 24, 4, c.bg);
        if (ok) {
          ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(r.x0, r.y);
          for (var t = 1; t < zz * 2; t++) ctx.lineTo(r.x0 + 6 + (len - 12) * t / (zz * 2), r.y + (t % 2 ? -8 : 8));
          ctx.lineTo(r.x1 - 6, r.y); ctx.lineTo(r.x1, r.y); ctx.stroke(); ctx.restore();
        } else {
          D.line(ctx, r.x0, r.y, r.x0 + len * 0.35, r.y, col, 2.5); D.line(ctx, r.x1 - len * 0.35, r.y, r.x1, r.y, col, 2.5);
          D.text(ctx, '✕ broken', (r.x0 + r.x1) / 2, r.y, { color: c.danger, size: 11, weight: 700, align: 'center' });
        }
        var mid = (r.x0 + r.x1) / 2;
        D.text(ctx, 'R' + SUB[k] + ' = ' + o.Rs[k] + ' Ω', mid, r.y - 22, { color: col, size: narrow ? 11 : 12, weight: 700, align: 'center', fit: W });
        var info = 'V' + SUB[k] + ' ' + M.fmt(o.Vk[k], 2) + ' V · I' + SUB[k] + ' ' + M.fmt(o.I[k], 2) + ' A';
        if (narrow && !par) { // stack the two values to fit
          D.text(ctx, M.fmt(o.Vk[k], 2) + ' V', mid, r.y + 21, { color: c.ink, size: 10.5, align: 'center', font: c.mono, fit: W });
          D.text(ctx, M.fmt(o.I[k], 2) + ' A', mid, r.y + 35, { color: c.muted, size: 10.5, align: 'center', font: c.mono, fit: W });
        } else D.text(ctx, info, mid, r.y + 22, { color: c.ink, size: narrow ? 10.5 : 11.5, align: 'center', font: c.mono, fit: W });
      });

      // ---- battery (+ on the left) and main ammeter
      D.roundRect(ctx, cx - 16, By - 18, 32, 36, 4, c.bg);
      D.line(ctx, cx - 5, By - 16, cx - 5, By + 16, c.ink, 2); D.line(ctx, cx + 5, By - 8, cx + 5, By + 8, c.ink, 4);
      D.text(ctx, '+', cx - 14, By - 22, { color: c.danger, size: 13, weight: 700, align: 'center' });
      D.text(ctx, M.fmt(p.V, 1) + ' V', cx, By + 26, { color: c.muted, size: 11.5, weight: 600, align: 'center' });
      var amx = (Ax + cx) / 2;
      D.circle(ctx, amx, By, 14, c.bg, c.accent, 2.5);
      D.text(ctx, 'A', amx, By + 1, { color: c.accent, size: 13, weight: 800, align: 'center' });
      D.text(ctx, M.fmt(o.It, 3) + ' A', amx, By + 26, { color: c.accent, size: 12, weight: 700, align: 'center', font: c.mono, fit: W });

      // ---- headline rule and equation
      var rule = par ? 'Parallel: same V across each, currents add' : 'Series: same I through each, voltages add';
      D.text(ctx, rule, W / 2, 16, { color: c.bg, bg: par ? c.s2 : c.s1, size: narrow ? 11.5 : 13, weight: 700, align: 'center', pad: 4, fit: W });
      var terms = o.Rs.map(function (R, k) { return o.ok[k] ? (par ? '1/' + R : String(R)) : null; }).filter(Boolean);
      var eq = !isFinite(o.Req) ? 'Circuit broken: no current flows anywhere'
        : par ? '1/R = ' + terms.join(' + ') + '  →  R = ' + M.fmt(o.Req, 2) + ' Ω'
        : 'R = ' + terms.join(' + ') + ' = ' + M.fmt(o.Req, 0) + ' Ω';
      var eq2 = isFinite(o.Req) ? 'I = V ÷ R = ' + M.fmt(p.V, 1) + ' ÷ ' + String(+o.Req.toFixed(2)) + ' = ' + M.fmt(o.It, 3) + ' A' : narrow ? 'A gap anywhere in series stops all current' : 'An open gap anywhere in a series circuit stops the current';
      D.text(ctx, eq, W / 2, H - 34, { color: !isFinite(o.Req) ? c.danger : c.ink, size: narrow ? 12 : 13.5, weight: 700, align: 'center', fit: W });
      D.text(ctx, eq2, W / 2, H - 15, { color: c.muted, size: narrow ? 11 : 12, align: 'center', font: c.mono, fit: W });
    }
  });
})();
