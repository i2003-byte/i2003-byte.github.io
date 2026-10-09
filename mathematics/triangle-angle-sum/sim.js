/* =====================================================================
   Lines and angles · Angle Sum of a Triangle — sim.js
   ---------------------------------------------------------------------
   Triangle ABC with base AB (length 1 in model units) and base angles
   A and B (sliders, or drag C). Then C = 180° − A − B, and the apex is
   C = A + AC·(cos A, sin A) with AC = sin B ÷ sin(A + B)  (sine rule).
   Three views:
     tear     — the three corners are torn off and slide to one point on
                a straight line: they fill it exactly (180°).
     parallel — a line through C parallel to AB: alternate angles copy
                A and B to the top, next to C, on a straight line.
     exterior — AB is extended to D. Exterior angle CBD = 180° − B,
                and the torn corners A and C fill it exactly: A + C.
   Model coordinates have y pointing up; maths angles are anticlockwise.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var tear = { on: false, t0: 0 };
  var DUR = 1400;

  function prog() {
    if (!tear.on) return 0;
    var k = M.clamp((performance.now() - tear.t0) / DUR, 0, 1);
    return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  }
  function tri(p) {
    var a = M.rad(p.A), b = M.rad(p.B), ac = Math.sin(b) / Math.sin(a + b);
    return { A: { x: 0, y: 0 }, B: { x: 1, y: 0 }, C: { x: ac * Math.cos(a), y: ac * Math.sin(a) } };
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, p = sim.p, t = tri(p), wide = W > H * 1.25, top = W < 560 ? 44 : 50;
    var lineup = p.view === 'tear';
    // region for the triangle
    var rx = 14, ry = top, rw = W - 28, rh = H - top - 14;
    if (lineup) { if (wide) rw = W * 0.6 - 20; else rh = (H - top) * 0.62 - 10; }
    var minX = Math.min(0, t.C.x), maxX = Math.max(1, t.C.x), ext = p.view === 'exterior' ? 0.45 : 0;
    if (p.view === 'parallel') { minX = Math.min(minX, t.C.x - 0.45); maxX = Math.max(maxX, t.C.x + 0.45); }
    maxX += ext;
    var sc = Math.min((rw - 40) / (maxX - minX), (rh - 50) / Math.max(0.05, t.C.y));
    var ox = rx + (rw - (maxX - minX) * sc) / 2 - minX * sc, oy = ry + (rh + t.C.y * sc) / 2 + 6;
    var S = function (q) { return { x: ox + q.x * sc, y: oy - q.y * sc }; };
    var sa = S(t.A), sb = S(t.B), scc = S(t.C);
    var minSide = Math.min(Math.hypot(sb.x - sa.x, sb.y - sa.y), Math.hypot(scc.x - sa.x, scc.y - sa.y), Math.hypot(scc.x - sb.x, scc.y - sb.y));
    var rr = M.clamp(minSide * 0.38, 18, W < 560 ? 52 : 70);
    var O;
    if (lineup) {
      if (wide) { O = { x: W * 0.8, y: top + (H - top) * 0.62 }; rr = Math.min(rr, W * 0.17); }
      else { O = { x: W / 2, y: H - 22 }; rr = Math.min(rr, (H - top) * 0.38 - 30); }
    } else O = sb;
    return { W: W, H: H, t: t, S: S, a: sa, b: sb, c: scc, rr: rr, O: O, wide: wide, top: top, sc: sc, ox: ox, oy: oy };
  }
  // interior span (maths degrees) of each corner, and where its piece goes
  function spans(p) {
    var A = p.A, B = p.B, C = 180 - A - B;
    var from = { A: [0, A], B: [180 - B, 180], C: [180 + A, 360 - B] };
    var to = p.view === 'exterior' ? { A: [0, A], C: [A, A + C] } : { B: [0, B], C: [B, B + C], A: [B + C, 180] };
    return { from: from, to: to };
  }
  function piece(ctx, x, y, r, a0, a1, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(x, y);
    var n = Math.max(6, Math.round((a1 - a0) / 6));
    for (var i = 0; i <= n; i++) {          // a slightly ragged "torn" edge
      var a = M.rad(a0 + (a1 - a0) * i / n), rj = r * (i % 2 ? 0.93 : 1);
      ctx.lineTo(x + Math.cos(a) * rj, y - Math.sin(a) * rj);
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function arcFill(ctx, x, y, r, a0, a1, color, alpha) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, -M.rad(a1), -M.rad(a0)); ctx.closePath();
    ctx.fillStyle = D.alpha(color, alpha); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, -M.rad(a1), -M.rad(a0)); ctx.stroke();
  }
  function kind(p) {
    var C = 180 - p.A - p.B, mx = Math.max(p.A, p.B, C);
    var k = mx > 90 ? 'Obtuse' : mx === 90 ? 'Right-angled' : 'Acute';
    var s = (p.A === p.B && p.B === C) ? 'equilateral' : (p.A === p.B || p.B === C || p.A === C) ? 'isosceles' : 'scalene';
    return k + ', ' + s;
  }

  SimLab.createSim({
    ariaLabel: 'A triangle ABC with its three angles coloured; the corners can be torn off and lined up on a straight line to show that they add up to 180 degrees',
    transport: false,
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'A', label: 'Angle A', min: 15, max: 150, step: 1, value: 50, unit: '°', help: 'Or drag corner C of the triangle.' },
      { id: 'B', label: 'Angle B', min: 15, max: 150, step: 1, value: 70, unit: '°', presets: [45, 60, 90] },
      { id: 'view', label: 'Show it by', type: 'select', value: 'tear', options: [
        { value: 'tear', label: 'Tearing off the corners' },
        { value: 'parallel', label: 'A line through C parallel to AB' },
        { value: 'exterior', label: 'The exterior angle at B' }] }
    ],
    buttons: [
      { label: 'Tear off the corners', primary: true, onClick: function (sim) {
        if (sim.p.view === 'parallel') sim.setParam('view', 'tear');
        tear.on = true; tear.t0 = performance.now();
      } },
      { label: 'Put them back', onClick: function () { tear.on = false; } }
    ],
    readouts: [
      { id: 'A', label: '∠A', unit: '°', digits: 0 },
      { id: 'B', label: '∠B', unit: '°', digits: 0 },
      { id: 'C', label: '∠C', unit: '°', digits: 0, key: true },
      { id: 'sum', label: '∠A + ∠B + ∠C', short: 'Sum', unit: '°', digits: 0, key: true },
      { id: 'ext', label: 'Exterior ∠CBD', short: 'Exterior ∠', unit: '°', digits: 0 },
      { id: 'kind', label: 'Triangle', key: true }
    ],
    reset: function () {},
    onParam: function (sim, id, v) {
      if (id === 'A' && v + sim.p.B > 165) sim.setParam('B', 165 - v);
      if (id === 'B' && v + sim.p.A > 165) sim.setParam('A', 165 - v);
      if (id === 'view') tear.on = false;
      return true;
    },
    animate: function () { return tear.on && performance.now() - tear.t0 < DUR + 50; },
    readout: function (sim) {
      var p = sim.p, C = 180 - p.A - p.B;
      return { A: p.A, B: p.B, C: C, sum: p.A + p.B + C, ext: 180 - p.B, kind: kind(p) };
    },
    status: function (sim) { var p = sim.p; return p.A + '° + ' + p.B + '° + ' + (180 - p.A - p.B) + '° = 180°'; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim);
        if (sim.p.view === 'tear' && (L.wide ? x > L.W * 0.6 : y > L.top + (L.H - L.top) * 0.62)) return false;
        return y < L.oy + 10;
      },
      move: function (sim, x, y) {
        var L = layout(sim), mx = (x - L.ox) / L.sc, my = Math.max(0.02, (L.oy - y) / L.sc);
        var A = Math.round(M.deg(Math.atan2(my, mx))), B = Math.round(M.deg(Math.atan2(my, 1 - mx)));
        A = M.clamp(A, 15, 150); B = M.clamp(B, 15, 150);
        if (A + B > 165) { var k = 165 / (A + B); A = Math.round(A * k); B = 165 - A; }
        sim.setParam('A', A); sim.setParam('B', B);
      },
      hover: function (sim, x, y) { var L = layout(sim); return Math.hypot(x - L.c.x, y - L.c.y) < 30; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, narrow = W < 560;
      var Cang = 180 - p.A - p.B, sp = spans(p), k = prog();
      var col = { A: c.warning, B: c.s1, C: c.s2 }, pos = { A: L.a, B: L.b, C: L.c };
      D.clear(ctx, W, H, c.bg);

      // helper lines for the views
      if (p.view === 'parallel') {
        var ext = 0.45 * L.sc;
        D.line(ctx, L.c.x - ext - 30, L.c.y, L.c.x + ext + 30, L.c.y, c.s3, 2, [7, 5]);
        D.text(ctx, '∥ AB', L.c.x + ext + 4, L.c.y - 12, { color: c.s3, size: 11, weight: 700, fit: W });
      }
      if (p.view === 'exterior') {
        var dpt = L.S({ x: 1.45, y: 0 });
        D.line(ctx, L.b.x, L.b.y, dpt.x, dpt.y, c.ink, 2.5, [7, 5]);
        D.text(ctx, 'D', dpt.x + 4, dpt.y + 12, { color: c.ink, size: 13, weight: 700, fit: W });
      }
      // triangle
      ctx.beginPath(); ctx.moveTo(L.a.x, L.a.y); ctx.lineTo(L.b.x, L.b.y); ctx.lineTo(L.c.x, L.c.y); ctx.closePath();
      ctx.fillStyle = D.alpha(c.ink, 0.06); ctx.fill(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2.5; ctx.stroke();

      // the corners: in place, or torn and moving
      var rr = L.rr, fsz = narrow ? 11 : 12;
      ['A', 'B', 'C'].forEach(function (v) {
        var f = sp.from[v], tgt = sp.to[v], P0 = pos[v];
        if (!tgt || k === 0) {
          arcFill(ctx, P0.x, P0.y, rr * (tgt ? 1 : 0.55), f[0], f[1], col[v], 0.35);
          return;
        }
        // the hole left behind
        ctx.save(); ctx.setLineDash([4, 4]);
        piece(ctx, P0.x, P0.y, rr, f[0], f[1], D.alpha(c.bg, 0.9), D.alpha(col[v], 0.6)); ctx.restore();
        var rot = ((tgt[0] - f[0]) % 360 + 540) % 360 - 180;
        var x = M.lerp(P0.x, L.O.x, k), y = M.lerp(P0.y, L.O.y, k), a0 = f[0] + rot * k;
        piece(ctx, x, y, rr, a0, a0 + (f[1] - f[0]), D.alpha(col[v], k >= 1 ? 0.55 : 0.7), col[v]);
      });
      // copies of A and B at C in the parallel view
      if (p.view === 'parallel') {
        arcFill(ctx, L.c.x, L.c.y, rr * 0.8, 180, 180 + p.A, col.A, 0.35);
        arcFill(ctx, L.c.x, L.c.y, rr * 0.8, 360 - p.B, 360, col.B, 0.35);
        arcFill(ctx, L.c.x, L.c.y, rr * 0.8, 180 + p.A, 360 - p.B, col.C, 0.35);
      }
      if (p.view === 'exterior') {
        ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = c.success; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(L.b.x, L.b.y, rr * 1.18, -M.rad(180 - p.B), 0); ctx.stroke(); ctx.restore();
      }

      // angle values at the vertices
      function lbl(v, P0, mid, r, txt) {
        var m = M.rad(mid);
        D.text(ctx, txt, P0.x + Math.cos(m) * r, P0.y - Math.sin(m) * r, { color: col[v], size: fsz, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.75), pad: 2, fit: W });
      }
      var tornAway = function (v) { return k > 0 && sp.to[v]; };
      if (!tornAway('A')) lbl('A', L.a, p.A / 2, rr + 14, p.A + '°');
      if (!tornAway('B')) lbl('B', L.b, 180 - p.B / 2, rr + 14, p.B + '°');
      if (!tornAway('C')) lbl('C', L.c, 270 + (p.A - p.B) / 2, (p.view === 'parallel' ? rr * 0.8 : sp.to.C ? rr : rr * 0.55) + 14, Cang + '°');
      if (p.view === 'parallel') {
        lbl('A', L.c, 180 + p.A / 2, rr * 0.8 + 14, p.A + '°');
        lbl('B', L.c, 360 - p.B / 2, rr * 0.8 + 14, p.B + '°');
      }
      // vertex letters
      D.text(ctx, 'A', L.a.x - 14, L.a.y + 10, { color: c.ink, size: 14, weight: 700, align: 'center' });
      D.text(ctx, 'B', L.b.x + 12, L.b.y + 12, { color: c.ink, size: 14, weight: 700, align: 'center' });
      D.text(ctx, 'C', L.c.x, L.c.y - 14, { color: c.ink, size: 14, weight: 700, align: 'center', fit: W });
      D.circle(ctx, L.c.x, L.c.y, 6, c.ink, c.bg, 2);

      // the straight line the torn corners land on
      if (p.view === 'tear') {
        var lw = rr * 1.5 + 20;
        D.line(ctx, L.O.x - lw, L.O.y, L.O.x + lw, L.O.y, c.ink, 2.5);
        D.circle(ctx, L.O.x, L.O.y, 3, c.ink);
        if (k >= 1) {
          ['A', 'B', 'C'].forEach(function (v) {
            var tg = sp.to[v], m = M.rad((tg[0] + tg[1]) / 2), r = rr + 12;
            D.text(ctx, v, L.O.x + Math.cos(m) * r, L.O.y - Math.sin(m) * r, { color: col[v], size: fsz, weight: 700, align: 'center' });
          });
          D.text(ctx, 'a straight line = 180°', L.O.x, L.O.y + 12, { color: c.success, size: fsz, weight: 700, align: 'center', fit: W });
        } else if (k === 0) D.text(ctx, 'Tap “Tear off the corners”', L.O.x, L.O.y + 12, { color: c.muted, size: fsz, align: 'center', fit: W });
      }

      // headline
      var hl = p.view === 'exterior'
        ? 'Exterior ∠CBD = 180° − ' + p.B + '° = ' + (180 - p.B) + '° = ∠A + ∠C (' + p.A + '° + ' + Cang + '°)'
        : '∠A + ∠B + ∠C = ' + p.A + '° + ' + p.B + '° + ' + Cang + '° = 180°';
      var hs = narrow ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, 14, { color: c.bg, bg: c.success, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
