/* =====================================================================
   Triangles · Triangle Inequality — sim.js
   ---------------------------------------------------------------------
   Three sticks: c = AB lies on the ground, b = AC is hinged at A and
   a = BC is hinged at B. Stick b swings down from θ = 175° to 0°
   (θ = angle between AB and AC) while stick a always points at b's
   free end. The distance from B to that end is
       d(θ) = √(b² + c² − 2bc·cos θ)          (cosine rule)
   which falls steadily from b + c to |b − c|. The free ends meet when
   d = a, at θ = ∠A = acos((b² + c² − a²) / 2bc). That needs
       |b − c| < a < b + c,  i.e. each side < the other two together.
   Otherwise the smallest gap is (longest) − (sum of the other two).
   The gap (d − a) is plotted against time. Once closed, sides and
   angles are coloured by size: the longest side faces the biggest
   angle. Model units are cm with y pointing up.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SPEED = 40, TH0 = 175;          // degrees per second, start angle

  function P(x, y) { return { x: x, y: y }; }
  function f1(v) { return String(parseFloat(v.toFixed(1))); }
  function angA(p) { var u = (p.b * p.b + p.c * p.c - p.a * p.a) / (2 * p.b * p.c); return u > -1 && u < 1 ? M.deg(Math.acos(u)) : null; }
  function dOf(p, th) { return Math.sqrt(Math.max(0, p.b * p.b + p.c * p.c - 2 * p.b * p.c * Math.cos(M.rad(th)))); }
  function checks(p) {
    return [
      { l: 'b + a', s: p.b + p.a, o: 'c', v: p.c },
      { l: 'c + b', s: p.c + p.b, o: 'a', v: p.a },
      { l: 'c + a', s: p.c + p.a, o: 'b', v: p.b }
    ];
  }
  function verdict(p) {
    var s = [p.a, p.b, p.c].sort(function (x, y) { return y - x; }), gap = s[0] - s[1] - s[2];
    return { ok: gap < -1e-9, flat: Math.abs(gap) < 1e-9, gap: Math.max(0, gap), longest: s[0], rest: s[1] + s[2] };
  }
  function geom(sim) {
    var p = sim.p, st = sim.state, th = M.rad(st.th), tip = P(p.b * Math.cos(th), p.b * Math.sin(th)), B = P(p.c, 0);
    var dx = tip.x - B.x, dy = tip.y - B.y, d = Math.hypot(dx, dy) || 1e-6;
    return { A: P(0, 0), B: B, tipB: tip, tipA: P(B.x + dx / d * p.a, B.y + dy / d * p.a), d: d, gap: d - p.a };
  }

  function stick(ctx, p0, p1, color, w, c) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = D.alpha(c.ink, 0.35); ctx.lineWidth = w + 3; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    ctx.restore();
  }
  function arcAt(ctx, V, P1, P2, r, color, alpha) {
    var a1 = Math.atan2(P1.y - V.y, P1.x - V.x), a2 = Math.atan2(P2.y - V.y, P2.x - V.x), d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    ctx.save(); ctx.beginPath(); ctx.moveTo(V.x, V.y); ctx.arc(V.x, V.y, r, a1, a1 + d, d < 0); ctx.closePath();
    ctx.fillStyle = D.alpha(color, alpha); ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(V.x, V.y, r, a1, a1 + d, d < 0); ctx.stroke(); ctx.restore();
    return a1 + d / 2;
  }

  SimLab.createSim({
    ariaLabel: 'Three sticks: one on the ground and two hinged at its ends swing towards each other; they close into a triangle only if any two sticks together are longer than the third',
    playLabel: 'Swing the sticks',
    mobileAspect: '3 / 3.2',
    params: [
      { id: 'c', label: 'Stick AB (c), on the ground', min: 1, max: 12, step: 0.5, value: 8, unit: 'cm', presets: [6, 8, 10] },
      { id: 'b', label: 'Stick AC (b)', min: 1, max: 12, step: 0.5, value: 5, unit: 'cm', presets: [3, 5, 7] },
      { id: 'a', label: 'Stick BC (a)', min: 1, max: 12, step: 0.5, value: 4, unit: 'cm', presets: [2, 3, 4, 6] }
    ],
    readouts: [
      { id: 'res', label: 'Result', key: true },
      { id: 'gap', label: 'Ends miss by', short: 'Miss by', unit: 'cm', digits: 1, key: true },
      { id: 'sum', label: 'Two shorter together', short: 'Shorter two', unit: 'cm', digits: 1, key: true },
      { id: 'long', label: 'Longest stick', unit: 'cm', digits: 1 },
      { id: 'A', label: '∠A', unit: '°', digits: 0 },
      { id: 'B', label: '∠B', unit: '°', digits: 0 },
      { id: 'C', label: '∠C', unit: '°', digits: 0 }
    ],
    graph: { title: 'Gap between the free ends', yLabel: 'gap (cm)', series: [{ label: 'gap' }], window: 5, yMin: -2 },

    reset: function (sim) { sim.state = { th: TH0, closed: false, end: false }; },
    update: function (sim, dt) {
      var st = sim.state, p = sim.p;
      if (st.closed || st.end) return;
      var th = st.th - SPEED * dt, A = angA(p);
      if (A != null && th <= A) { st.th = A; st.closed = true; return; }
      if (th <= 0) { st.th = 0; st.end = true; return; }
      st.th = th;
    },
    finished: function (sim) { return sim.state.closed || sim.state.end; },
    sample: function (sim) { return [geom(sim).gap]; },
    readout: function (sim) {
      var p = sim.p, st = sim.state, v = verdict(p), g = geom(sim), out = { gap: Math.abs(g.gap), sum: v.rest, long: v.longest, A: '—', B: '—', C: '—' };
      out.res = st.closed ? 'Triangle!' : !v.ok ? (v.flat ? 'Flat, no triangle' : 'Never closes') : st.th < TH0 ? 'Swinging…' : 'Will close';
      if (st.closed) {
        var A = angA(p), B = M.deg(Math.acos(M.clamp((p.a * p.a + p.c * p.c - p.b * p.b) / (2 * p.a * p.c), -1, 1)));
        out.A = A; out.B = B; out.C = 180 - A - B; out.gap = 0;
      }
      return out;
    },
    status: function (sim) {
      var v = verdict(sim.p), st = sim.state;
      if (st.closed) return 'The sticks close into a triangle';
      if (!v.ok) return v.flat ? 'The two shorter sticks only just reach: a flat line, not a triangle' : 'The two shorter sticks are ' + f1(v.gap) + ' cm too short';
      return st.th < TH0 ? 'Swinging…' : 'Press Play to swing the sticks';
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, st = sim.state, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 11 : 12.5;
      var v = verdict(p), g = geom(sim), wide = W > H * 1.25;
      D.clear(ctx, W, H, c.bg);
      // layout: scene + the three checks (right on wide screens, bottom otherwise)
      var top = narrow ? 40 : 48, panelH = wide ? 0 : (narrow ? 62 : 70), panelW = wide ? Math.min(250, W * 0.3) : 0;
      var rx = 12, rw = W - 24 - panelW, ry = top, rh = H - top - panelH - 12;
      var minX = Math.min(-p.b, p.c - p.a), maxX = Math.max(p.c + p.a, p.b), maxY = Math.max(p.a, p.b, 1), minY = -0.6;
      var sc = Math.min((rw - 30) / (maxX - minX), (rh - 24) / (maxY - minY), narrow ? 40 : 56);
      var ox = rx + (rw - (maxX - minX) * sc) / 2 - minX * sc, oy = ry + (rh - (maxY - minY) * sc) / 2 + maxY * sc;
      var S = function (q) { return P(ox + q.x * sc, oy - q.y * sc); };
      var sA = S(g.A), sB = S(g.B), tB = S(g.tipB), tA = S(g.tipA);
      var colA = c.s1, colB = c.s2, colC = c.warning, sw = narrow ? 7 : 9;

      // ground
      D.line(ctx, rx, sA.y + sw, rx + rw, sA.y + sw, D.alpha(c.ink, 0.25), 1.5);
      // reach circles: where each free end can go
      ctx.save(); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.4;
      ctx.strokeStyle = D.alpha(colB, 0.55); ctx.beginPath(); ctx.arc(sA.x, sA.y, p.b * sc, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = D.alpha(colA, 0.55); ctx.beginPath(); ctx.arc(sB.x, sB.y, p.a * sc, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.restore();

      // triangle fill and size order once closed
      if (st.closed) {
        ctx.beginPath(); ctx.moveTo(sA.x, sA.y); ctx.lineTo(sB.x, sB.y); ctx.lineTo(tB.x, tB.y); ctx.closePath();
        ctx.fillStyle = D.alpha(c.success, 0.12); ctx.fill();
        var A = angA(p), Bq = M.deg(Math.acos(M.clamp((p.a * p.a + p.c * p.c - p.b * p.b) / (2 * p.a * p.c), -1, 1))), Cq = 180 - A - Bq;
        var rr = M.clamp(Math.min(p.a, p.b, p.c) * sc * 0.3, 14, 30);
        var mA = arcAt(ctx, sA, sB, tB, rr, colA, 0.3), mB = arcAt(ctx, sB, tB, sA, rr, colB, 0.3), mC = arcAt(ctx, tB, sA, sB, rr, colC, 0.3);
        [[sA, mA, A, colA], [sB, mB, Bq, colB], [tB, mC, Cq, colC]].forEach(function (q) {
          D.text(ctx, Math.round(q[2]) + '°', q[0].x + Math.cos(q[1]) * (rr + 13), q[0].y + Math.sin(q[1]) * (rr + 11), { color: q[3], size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.75), pad: 1, fit: W });
        });
      }
      // sticks: a side has the colour of the angle it faces
      stick(ctx, sA, sB, colC, sw, c);
      stick(ctx, sA, tB, colB, sw, c);
      stick(ctx, sB, tA, colA, sw, c);
      D.circle(ctx, sA.x, sA.y, sw * 0.55, c.bg, c.ink, 2); D.circle(ctx, sB.x, sB.y, sw * 0.55, c.bg, c.ink, 2);
      // gap
      if (!st.closed && Math.abs(g.gap) > 0.05) {
        D.line(ctx, tA.x, tA.y, tB.x, tB.y, c.danger, 2, [3, 3]);
        D.circle(ctx, tA.x, tA.y, 4, c.danger); D.circle(ctx, tB.x, tB.y, 4, c.danger);
        if (st.th < TH0) D.text(ctx, 'misses by ' + f1(Math.abs(g.gap)) + ' cm', (tA.x + tB.x) / 2, Math.min(tA.y, tB.y) - 36, { align: 'center', color: c.danger, size: fs, weight: 700, bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
      } else if (st.closed) D.circle(ctx, tB.x, tB.y, 5, c.success);
      // stick labels
      function lab(p0, p1, txt, col, off) {
        var mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2, nx = p1.y - p0.y, ny = -(p1.x - p0.x), l = Math.hypot(nx, ny) || 1;
        D.text(ctx, txt, mx + nx / l * off, my + ny / l * off, { color: col, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
      }
      lab(sA, sB, 'c = ' + f1(p.c), colC, -18);
      lab(sA, tB, 'b = ' + f1(p.b), colB, 18);
      lab(sB, tA, 'a = ' + f1(p.a), colA, -18);
      D.text(ctx, 'A', sA.x - 6, sA.y + sw + 12, { color: c.ink, size: 13, weight: 700, align: 'center' });
      D.text(ctx, 'B', sB.x + 6, sB.y + sw + 12, { color: c.ink, size: 13, weight: 700, align: 'center', fit: W });
      if (st.closed) D.text(ctx, 'C', tB.x, tB.y - 16, { color: c.ink, size: 13, weight: 700, align: 'center', fit: W });

      // the three checks
      var ck = checks(p), px, py, lh = narrow ? 17 : 20;
      if (wide) { px = W - panelW - 4; py = top + 10; } else { px = 12; py = H - panelH; }
      D.text(ctx, 'Is each pair longer than the third?', px, py, { color: c.muted, size: fs - 0.5, weight: 600, fit: W });
      ck.forEach(function (q, i) {
        var ok = q.s > q.v + 1e-9, eq = Math.abs(q.s - q.v) < 1e-9;
        var txt = (ok ? '✓ ' : '✗ ') + q.l + ' = ' + f1(q.s) + (ok ? ' > ' : eq ? ' = ' : ' < ') + q.o + ' = ' + f1(q.v);
        var half = Math.min(W / 2, 210), x = wide ? px : px + (i === 1 ? half : 0), y = wide ? py + lh * (i + 1) + 4 : py + lh * (i === 2 ? 2 : 1);
        D.text(ctx, txt, x, y, { color: ok ? c.success : c.danger, size: fs, weight: 700, fit: W });
      });
      if (wide) {
        var msg = st.closed ? ['Longest side faces', 'the biggest angle (same colour)'] : v.ok ? ['All three hold:', 'the sticks will meet'] : v.flat ? ['Only just reach:', 'a flat line, no triangle'] : ['Too short by ' + f1(v.gap) + ' cm:', 'they can never meet'];
        msg.forEach(function (m, i) { D.text(ctx, m, px, py + lh * 4 + 14 + i * lh, { color: st.closed || v.ok ? c.text : c.danger, size: fs, fit: W }); });
      }

      // headline
      var hl, hc;
      if (st.closed) hc = c.success;
      else if (!v.ok) { hl = v.flat ? f1(v.rest) + ' = ' + f1(v.longest) + ': the sticks lie flat, no triangle' : f1(v.rest) + ' < ' + f1(v.longest) + ' cm: these sticks can never meet'; hc = c.danger; }
      else { hl = st.th < TH0 ? 'Swinging… the gap is shrinking' : 'Press Play to swing the sticks together'; hc = c.accent; }
      if (st.closed) { var sorted = [['a', p.a], ['b', p.b], ['c', p.c]].sort(function (x, y) { return y[1] - x[1]; }); hl = 'They meet! Longest side ' + sorted[0][0] + ' faces the biggest angle ' + sorted[0][0].toUpperCase(); }
      var hs = narrow ? 12.5 : 14.5;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, narrow ? 16 : 20, { color: c.bg, bg: hc, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
