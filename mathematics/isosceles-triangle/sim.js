/* =====================================================================
   Triangles · Isosceles Triangle — sim.js
   ---------------------------------------------------------------------
   Triangle ABC with base BC along the x-axis: B(0, 0), C(a, 0).
   Sides a = BC, b = CA, c = AB (cm). Apex A is found
     from the sides:  x = (c² − b² + a²) / 2a,  y = √(c² − x²)
     from the angles: AB = a·sin C / sin(B + C)  (sine rule)
   The bisector of ∠A meets BC at D with BD : DC = AB : AC
   (angle-bisector theorem), so D = (a·c / (b + c), 0).
   "Fold" turns the flap ADC over the line AD like paper: the part of
   each point at right angles to AD is scaled by cos(πk), k = 0 → 1.
   At k = 1 the flap is the mirror image of ADC in AD: C lands on ray
   AB at distance b from A, exactly on B only when AB = AC, and then
   ∠C covers ∠B (the SAS proof: AB = AC, ∠BAD = ∠CAD, AD common).
   Model units are cm with y pointing up.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var DUR = 1800, fold = { from: 0, to: 0, t0: -1e9 };

  function P(x, y) { return { x: x, y: y }; }
  function f1(v) { return String(parseFloat(v.toFixed(1))); }
  function ease(u) { u = M.clamp(u, 0, 1); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function kNow() { return fold.from + (fold.to - fold.from) * ease((performance.now() - fold.t0) / DUR); }
  function dist(p, q) { return Math.hypot(p.x - q.x, p.y - q.y); }
  function angAt(V, P1, P2) {
    var u = P(P1.x - V.x, P1.y - V.y), v = P(P2.x - V.x, P2.y - V.y);
    return M.deg(Math.acos(M.clamp((u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)), -1, 1)));
  }

  function geom(p) {
    var a = p.a, A;
    if (p.mode === 'angles') {
      var B = M.rad(p.B), C = M.rad(p.C), c0 = a * Math.sin(C) / Math.sin(B + C);
      A = P(c0 * Math.cos(B), c0 * Math.sin(B));
    } else {
      var x = (p.c * p.c - p.b * p.b + a * a) / (2 * a), y2 = p.c * p.c - x * x;
      if (y2 < 0.01) return null;
      A = P(x, Math.sqrt(y2));
    }
    var Bp = P(0, 0), Cp = P(a, 0), c = dist(A, Bp), b = dist(A, Cp), Dp = P(a * c / (b + c), 0);
    var g = { A: A, B: Bp, C: Cp, D: Dp, a: a, b: b, c: c, angA: angAt(A, Bp, Cp), angB: angAt(Bp, Cp, A), angC: angAt(Cp, A, Bp) };
    g.iso = Math.abs(b - c) < 0.051;
    g.equi = g.iso && Math.abs(a - b) < 0.051;
    return g;
  }
  // fold point q over the line A→D by fraction k (paper fold, seen from above)
  function folded(g, q, k) {
    var ux = g.D.x - g.A.x, uy = g.D.y - g.A.y, ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
    var rx = q.x - g.A.x, ry = q.y - g.A.y, t = rx * ux + ry * uy, px = rx - t * ux, py = ry - t * uy, s = Math.cos(Math.PI * k);
    return P(g.A.x + t * ux + px * s, g.A.y + t * uy + py * s);
  }

  function layout(sim, g) {
    var W = sim.width, H = sim.height, narrow = W < 560, top = narrow ? 40 : 48, bot = narrow ? 30 : 34;
    var pts = [g.A, g.B, g.C, folded(g, g.C, 1), P(g.a / 2, -0.6)];
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pts.forEach(function (q) { minX = Math.min(minX, q.x); maxX = Math.max(maxX, q.x); minY = Math.min(minY, q.y); maxY = Math.max(maxY, q.y); });
    var bw = maxX - minX, bh = maxY - minY, mw = W - 70, mh = H - top - bot - 30;
    var sc = Math.min(mw / bw, mh / bh, narrow ? 44 : 62);
    var ox = (W - bw * sc) / 2 - minX * sc, oy = top + 14 + (mh - bh * sc) / 2 + maxY * sc;
    return { W: W, H: H, narrow: narrow, top: top, sc: sc, S: function (q) { return P(ox + q.x * sc, oy - q.y * sc); }, inv: function (x, y) { return P((x - ox) / sc, (oy - y) / sc); } };
  }

  function syncControls(p) {
    var on = { b: p.mode !== 'angles', c: p.mode !== 'angles', B: p.mode === 'angles', C: p.mode === 'angles' };
    Object.keys(on).forEach(function (id) {
      var el = document.getElementById('ctl-' + id), box = el && el.closest('.control');
      if (box) box.style.display = on[id] ? '' : 'none';
    });
  }
  function arcAt(ctx, V, P1, P2, r, color, alpha, lw) {
    var a1 = Math.atan2(P1.y - V.y, P1.x - V.x), a2 = Math.atan2(P2.y - V.y, P2.x - V.x), d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    ctx.save(); ctx.beginPath(); ctx.moveTo(V.x, V.y); ctx.arc(V.x, V.y, r, a1, a1 + d, d < 0); ctx.closePath();
    ctx.fillStyle = D.alpha(color, alpha); ctx.fill();
    ctx.beginPath(); ctx.arc(V.x, V.y, r, a1, a1 + d, d < 0); ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.stroke(); ctx.restore();
    return a1 + d / 2;
  }
  function tick(ctx, p0, p1, n, color) {
    var mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2, dx = p1.x - p0.x, dy = p1.y - p0.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    for (var i = 0; i < n; i++) {
      var o = (i - (n - 1) / 2) * 5, cx = mx + ux * o, cy = my + uy * o;
      D.line(ctx, cx - uy * 7, cy + ux * 7, cx + uy * 7, cy - ux * 7, color, 2);
    }
  }

  SimLab.createSim({
    ariaLabel: 'Triangle ABC with a draggable apex A; the half ADC can be folded over the bisector AD to show that equal sides AB and AC give equal base angles B and C',
    transport: false,
    mobileAspect: '3 / 3.3',
    params: [
      { id: 'mode', label: 'You choose', type: 'select', value: 'sides', options: [
        { value: 'sides', label: 'The sides AB and AC' },
        { value: 'angles', label: 'The base angles B and C (converse)' }] },
      { id: 'c', label: 'Side AB', min: 3, max: 10, step: 0.1, value: 7, unit: 'cm', help: 'Or drag corner A.' },
      { id: 'b', label: 'Side AC', min: 3, max: 10, step: 0.1, value: 7, unit: 'cm' },
      { id: 'B', label: 'Angle B', min: 15, max: 85, step: 1, value: 65, unit: '°', help: 'Or drag corner A.' },
      { id: 'C', label: 'Angle C', min: 15, max: 85, step: 1, value: 65, unit: '°' },
      { id: 'a', label: 'Base BC', min: 3, max: 10, step: 0.1, value: 6, unit: 'cm' }
    ],
    buttons: [
      { label: 'Fold along AD', primary: true, onClick: function (sim) {
        var k = kNow(); fold.from = k; fold.to = k > 0.5 ? 0 : 1; fold.t0 = performance.now(); sim.redraw();
      } },
      { label: 'Make AB = AC', onClick: function (sim) {
        var p = sim.p;
        if (p.mode === 'angles') sim.setParam('C', p.B); else sim.setParam('b', p.c);
        sim.redraw();
      } },
      { label: 'Equilateral', onClick: function (sim) {
        var p = sim.p;
        if (p.mode === 'angles') { sim.setParam('B', 60); sim.setParam('C', 60); } else { sim.setParam('b', p.a); sim.setParam('c', p.a); }
        sim.redraw();
      } }
    ],
    readouts: [
      { id: 'c', label: 'AB', unit: 'cm', digits: 1 },
      { id: 'b', label: 'AC', unit: 'cm', digits: 1 },
      { id: 'B', label: '∠B', unit: '°', digits: 0, key: true },
      { id: 'C', label: '∠C', unit: '°', digits: 0, key: true },
      { id: 'A', label: '∠A', unit: '°', digits: 0 },
      { id: 'kind', label: 'Triangle', key: true }
    ],
    reset: function (sim) { syncControls(sim.p); },
    onParam: function (sim, id) {
      var p = sim.p;
      if (id === 'mode') {
        syncControls(p);
        var g0 = geom(p);
        if (p.mode === 'angles' && g0) { sim.setParam('B', M.clamp(Math.round(g0.angB), 15, 85)); sim.setParam('C', M.clamp(Math.round(g0.angC), 15, 85)); }
      }
      if (p.mode === 'angles' && p.B + p.C > 170) sim.setParam(id === 'B' ? 'C' : 'B', 170 - p[id === 'B' ? 'B' : 'C']);
      return true;
    },
    animate: function () { return performance.now() - fold.t0 < DUR + 60; },
    readout: function (sim) {
      var g = geom(sim.p);
      if (!g) return { c: sim.p.c, b: sim.p.b, B: '—', C: '—', A: '—', kind: 'No triangle' };
      return { c: g.c, b: g.b, B: g.angB, C: g.angC, A: g.angA, kind: g.equi ? 'Equilateral' : g.iso ? 'Isosceles' : 'Scalene' };
    },
    status: function (sim) {
      var g = geom(sim.p);
      if (!g) return 'These sides do not make a triangle';
      return g.iso ? 'AB = AC, so ∠B = ∠C = ' + Math.round(g.angB) + '°' : 'AB ≠ AC, so ∠B ≠ ∠C';
    },
    pointer: {
      down: function (sim, x, y) { var g = geom(sim.p); if (!g) return false; var L = layout(sim, g), s = L.S(g.A); return Math.hypot(x - s.x, y - s.y) < 44; },
      move: function (sim, x, y) {
        var p = sim.p, g = geom(p); if (!g) return;
        var L = layout(sim, g), q = L.inv(x, y);
        q.y = Math.max(q.y, 0.5);
        if (p.mode === 'angles') {
          var B = Math.round(M.deg(Math.atan2(q.y, q.x))), C = Math.round(M.deg(Math.atan2(q.y, p.a - q.x)));
          B = M.clamp(B, 15, 85); C = M.clamp(C, 15, 85);
          if (B + C > 170) { var s = 170 / (B + C); B = Math.round(B * s); C = 170 - B; }
          sim.setParam('B', B); sim.setParam('C', C);
        } else {
          var c = M.clamp(Math.round(Math.hypot(q.x, q.y) * 10) / 10, 3, 10), b = M.clamp(Math.round(Math.hypot(p.a - q.x, q.y) * 10) / 10, 3, 10);
          if (b + c <= p.a + 0.1 || Math.abs(b - c) >= p.a - 0.1) return;
          sim.setParam('c', c); sim.setParam('b', b);
        }
        fold.from = fold.to = 0;
      },
      hover: function (sim, x, y) { var g = geom(sim.p); if (!g) return false; var s = layout(sim, g).S(g.A); return Math.hypot(x - s.x, y - s.y) < 30; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 11 : 12.5;
      D.clear(ctx, W, H, c.bg);
      var g = geom(p);
      if (!g) {
        D.text(ctx, 'AB + AC must be longer than BC (and each side shorter than the other two together)', W / 2, H / 2, { color: c.danger, size: fs, weight: 700, align: 'center', fit: W });
        D.text(ctx, 'These sides do not make a triangle', W / 2, 20, { color: c.bg, bg: c.danger, size: 13, weight: 700, align: 'center', pad: 4, fit: W });
        return;
      }
      var L = layout(sim, g), S = L.S, k = kNow();
      var sA = S(g.A), sB = S(g.B), sC = S(g.C), sD = S(g.D);
      var colB = c.s1, colC = c.warning, rr = M.clamp(Math.min(g.a, g.b, g.c) * L.sc * 0.24, 16, 34);

      // the left half ABD stays; the right half ADC is the flap
      ctx.beginPath(); ctx.moveTo(sA.x, sA.y); ctx.lineTo(sB.x, sB.y); ctx.lineTo(sD.x, sD.y); ctx.closePath();
      ctx.fillStyle = D.alpha(colB, 0.14); ctx.fill();
      // ghost of where the flap was
      if (k > 0.01) {
        ctx.save(); ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(sA.x, sA.y); ctx.lineTo(sC.x, sC.y); ctx.lineTo(sD.x, sD.y);
        ctx.strokeStyle = D.alpha(c.ink, 0.35); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      }
      // the fixed triangle outline
      D.line(ctx, sA.x, sA.y, sB.x, sB.y, c.ink, 2.5); D.line(ctx, sB.x, sB.y, sD.x, sD.y, c.ink, 2.5);
      arcAt(ctx, sB, sC, sA, rr, colB, 0.35);
      D.line(ctx, sA.x, sA.y, sD.x, sD.y, c.accent, 2, [7, 5]);

      // the flap (folded by k)
      var fC = S(folded(g, g.C, k));
      ctx.beginPath(); ctx.moveTo(sA.x, sA.y); ctx.lineTo(fC.x, fC.y); ctx.lineTo(sD.x, sD.y); ctx.closePath();
      ctx.fillStyle = D.alpha(colC, k > 0.5 ? 0.2 : 0.12); ctx.fill();
      ctx.strokeStyle = k > 0.01 ? colC : c.ink; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
      if (Math.abs(Math.cos(Math.PI * k)) > 0.15) arcAt(ctx, fC, sA, sD, rr * (0.6 + 0.4 * Math.abs(Math.cos(Math.PI * k))), colC, 0.35);

      // equal marks, half angles at A, right angle at D
      if (g.iso && k < 0.05) {
        tick(ctx, sA, sB, 1, c.success); tick(ctx, sA, sC, 1, c.success);
        if (!g.equi) { tick(ctx, sB, sD, 2, D.alpha(c.ink, 0.7)); tick(ctx, sD, sC, 2, D.alpha(c.ink, 0.7)); }
        else tick(ctx, sB, sC, 1, c.success);
        var m = 10; ctx.beginPath(); ctx.moveTo(sD.x + m, sD.y); ctx.lineTo(sD.x + m, sD.y - m); ctx.lineTo(sD.x, sD.y - m);
        ctx.strokeStyle = c.accent; ctx.lineWidth = 1.5; ctx.stroke();
      }
      var ra = Math.min(rr * 1.1, 30);
      arcAt(ctx, sA, sB, sD, ra, c.accent, 0.12, 1.2); arcAt(ctx, sA, sD, sC, ra * 0.85, c.accent, 0.12, 1.2);

      // labels
      function sideLabel(p0, p1, txt, color, out) {
        var mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2, dx = p1.y - p0.y, dy = -(p1.x - p0.x), l = Math.hypot(dx, dy) || 1;
        D.text(ctx, txt, mx + dx / l * out, my + dy / l * out, { color: color, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
      }
      sideLabel(sB, sA, 'AB = ' + f1(g.c) + ' cm', g.iso ? c.success : c.ink, 18);
      if (k < 0.05) sideLabel(sA, sC, 'AC = ' + f1(g.b) + ' cm', g.iso ? c.success : c.ink, 18);
      D.text(ctx, 'BC = ' + f1(g.a) + ' cm', (sB.x + sC.x) / 2, sB.y + 30, { color: c.muted, size: fs, align: 'center', fit: W });
      var lr = rr + 14;
      var bAng = Math.atan2(sA.y - sB.y, sA.x - sB.x) / 2;
      D.text(ctx, Math.round(g.angB) + '°', sB.x + Math.cos(bAng) * lr, sB.y + Math.sin(bAng) * lr, { color: colB, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.75), pad: 1, fit: W });
      if (k < 0.05) {
        var ca = Math.atan2(sA.y - sC.y, sA.x - sC.x), cm = (ca - Math.PI) / 2;
        D.text(ctx, Math.round(g.angC) + '°', sC.x + Math.cos(cm) * lr, sC.y + Math.sin(cm) * lr, { color: colC, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.75), pad: 1, fit: W });
      }
      D.text(ctx, Math.round(g.angA) + '°', sA.x, sA.y + ra + 12, { color: c.accent, size: fs - 1, align: 'center', bg: D.alpha(c.bg, 0.7), pad: 1, fit: W });
      D.text(ctx, 'A', sA.x, sA.y - 16, { color: c.ink, size: 14, weight: 700, align: 'center', fit: W });
      D.text(ctx, k > 0.98 && g.iso ? 'B = C' : 'B', sB.x - 13, sB.y + 12, { color: c.ink, size: 14, weight: 700, align: 'center', fit: W });
      if (k < 0.5) D.text(ctx, 'C', sC.x + 13, sC.y + 10, { color: c.ink, size: 14, weight: 700, align: 'center', fit: W });
      D.text(ctx, 'D', sD.x, sD.y + 14, { color: c.accent, size: 12, weight: 700, align: 'center' });
      D.circle(ctx, sA.x, sA.y, 7, c.ink, c.bg, 2);

      // result of the fold
      var done = k > 0.98, msg, mc;
      if (done) {
        var C1 = S(folded(g, g.C, 1)), gap = Math.abs(g.b - g.c);
        D.circle(ctx, C1.x, C1.y, 5, colC);
        var ox = C1.x - sD.x, oy = C1.y - sD.y, ol = Math.hypot(ox, oy) || 1;
        if (!g.iso) D.text(ctx, 'C lands here', C1.x + ox / ol * 18 - (g.iso ? 0 : 30), C1.y + oy / ol * 18, { color: colC, size: 12, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
        if (g.iso) { msg = 'C lands exactly on B: ∠C covers ∠B, so ∠B = ∠C'; mc = c.success; }
        else { msg = 'C lands ' + f1(gap) + ' cm ' + (g.b < g.c ? 'short of B' : 'past B') + ': the angles do not match'; mc = c.danger; }
      } else if (k > 0.02) { msg = 'Folding the flap ADC over AD…'; mc = c.muted; }
      else { msg = g.iso ? 'Tap “Fold along AD” to lay C onto B' : 'Drag A, or tap “Make AB = AC”'; mc = c.muted; }
      var ns = narrow ? 11 : 12.5;
      ctx.font = '600 ' + ns + 'px Inter, system-ui, sans-serif';
      while (ns > 8.5 && ctx.measureText(msg).width > W - 20) { ns -= 0.5; ctx.font = '600 ' + ns + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, msg, W / 2, H - (narrow ? 12 : 16), { color: mc, size: ns, weight: 600, align: 'center', fit: W });

      // headline
      var hl, hc;
      if (g.equi) { hl = 'All sides equal, so all angles are 60°'; hc = c.success; }
      else if (g.iso) { hl = p.mode === 'angles' ? '∠B = ∠C = ' + Math.round(g.angB) + '°, so AB = AC = ' + f1(g.c) + ' cm' : 'AB = AC = ' + f1(g.c) + ' cm, so ∠B = ∠C = ' + Math.round(g.angB) + '°'; hc = c.success; }
      else { var big = g.c > g.b ? 'AB' : 'AC', ang = g.c > g.b ? '∠C' : '∠B'; hl = 'AB ≠ AC: the longer side ' + big + ' faces the bigger angle ' + ang; hc = c.warning; }
      var hs = narrow ? 12.5 : 14.5;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, narrow ? 16 : 20, { color: c.bg, bg: hc, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
