/* =====================================================================
   Functions · Quadratic Graphs and Roots — sim.js
   ---------------------------------------------------------------------
   y = ax² + bx + c on a grid (x from −8 to 8, y from −10 to 10).
   The roots of ax² + bx + c = 0 are where the parabola meets the
   x-axis; the discriminant D = b² − 4ac decides two (D > 0), one
   repeated (D = 0) or no real roots (D < 0). Shows the vertex
   (−b/2a, −D/4a), the axis of symmetry, the y-intercept, the
   quadratic formula worked out, and the sum and product of roots.
   Drag the vertex (a stays, b and c change) or press "Slide c" to
   move the curve up and down and watch two roots meet and vanish.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var XR = 8, YR = 10, SWEEP = 8; // seconds for one up-and-down of c
  var PRESETS = { two: [1, -5, 6], one: [1, -4, 4], none: [1, 2, 5], down: [-1, 2, 3], wide: [0.5, 0, -2] };
  var st = { sweep: null, c: null };

  function num(v) { var s = String(parseFloat((+v).toFixed(2))); return v < 0 && s !== '0' ? '−' + s.slice(1) : s; }
  function par(v) { return v < 0 ? '(' + num(v) + ')' : num(v); }
  function coefs(sim) { return { a: sim.p.a, b: sim.p.b, c: st.c == null ? sim.p.c : st.c }; }
  function eqn(q) {
    var t = '';
    if (q.a) t = (q.a === 1 ? '' : q.a === -1 ? '−' : num(q.a)) + 'x²';
    if (q.b) t += (t ? (q.b < 0 ? ' − ' : ' + ') : (q.b < 0 ? '−' : '')) + (Math.abs(q.b) === 1 ? '' : num(Math.abs(q.b))) + 'x';
    if (q.c || !t) t += (t ? (q.c < 0 ? ' − ' : ' + ') + num(Math.abs(q.c)) : num(q.c));
    return 'y = ' + t;
  }
  function solve(q) {
    var d = q.b * q.b - 4 * q.a * q.c;
    d = Math.round(d * 1e6) / 1e6;
    if (!q.a) return { lin: true, d: null, roots: q.b ? [-q.c / q.b] : [] };
    var h = -q.b / (2 * q.a), k = q.c - q.b * q.b / (4 * q.a), r = [];
    if (d > 0) { var s = Math.sqrt(d); r = [(-q.b - s) / (2 * q.a), (-q.b + s) / (2 * q.a)].sort(function (x, y) { return x - y; }); }
    else if (d === 0) r = [h];
    return { d: d, h: h, k: k, roots: r };
  }
  function nature(S) {
    if (S.lin) return 'Not quadratic (a = 0)';
    return S.d > 0 ? 'Two real roots' : S.d === 0 ? 'One repeated root' : 'No real roots';
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.2, L = { W: W, H: H, wide: wide };
    if (wide) {
      var pw = Math.min(400, Math.max(270, W * 0.38));
      L.plot = { x: 34, y: 12, w: W - pw - 56, h: H - 36 };
      L.panel = { x: W - pw - 8, y: 8, w: pw, h: H - 16 };
    } else {
      var ph = Math.min(104, H * 0.3);
      L.plot = { x: 26, y: 8, w: W - 34, h: H - ph - 30 };
      L.panel = { x: 6, y: H - ph - 4, w: W - 12, h: ph };
    }
    var p = L.plot;
    L.ux = p.w / (2 * XR); L.uy = p.h / (2 * YR); L.ox = p.x + p.w / 2; L.oy = p.y + p.h / 2;
    return L;
  }
  function X(L, x) { return L.ox + x * L.ux; }
  function Y(L, y) { return L.oy - y * L.uy; }

  // rows shrunk a little and wrapped to the width
  function rowsText(ctx, rows, x, y, w) {
    rows.forEach(function (r) {
      var sz = r.size, font = function () { ctx.font = (r.weight || 600) + ' ' + sz + 'px Inter, system-ui, sans-serif'; };
      font();
      while (sz > r.size - 2.5 && ctx.measureText(r.t).width > w) { sz -= 0.5; font(); }
      var lines = [], cur = '';
      r.t.split(' ').forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (cur && ctx.measureText(t).width > w) { lines.push(cur); cur = wd; } else cur = t; });
      lines.push(cur);
      lines.forEach(function (t) { D.text(ctx, t, x, y + sz / 2, { color: r.color, size: sz, weight: r.weight || 600 }); y += sz + 4; });
      y += r.gap || 0;
    });
  }

  SimLab.createSim({
    ariaLabel: 'A coordinate grid with the parabola y = ax² + bx + c. The roots where it meets the x-axis, the vertex, the axis of symmetry and the discriminant are shown; the vertex can be dragged',
    transport: false,
    mobileAspect: '3 / 3.9',
    params: [
      { id: 'preset', label: 'Start from', type: 'select', value: 'two', options: [
        { value: 'two', label: 'Two roots: x² − 5x + 6' },
        { value: 'one', label: 'One repeated root: x² − 4x + 4' },
        { value: 'none', label: 'No real roots: x² + 2x + 5' },
        { value: 'down', label: 'Opens downwards: −x² + 2x + 3' },
        { value: 'wide', label: 'Wider curve: 0.5x² − 2' }] },
      { id: 'a', label: 'a (x² term)', min: -3, max: 3, step: 0.1, value: 1, presets: [-1, 0.5, 1, 2], help: 'a > 0 opens upwards, a < 0 downwards; a bigger size makes it narrower.' },
      { id: 'b', label: 'b (x term)', min: -10, max: 10, step: 0.1, value: -5 },
      { id: 'c', label: 'c (constant)', min: -10, max: 10, step: 0.1, value: 6, help: 'Or drag the vertex on the graph.' }
    ],
    buttons: [
      { label: 'Slide c up and down', primary: true, onClick: function (sim) {
        if (st.sweep) { st.sweep = null; st.c = null; return; }
        var c0 = M.clamp(sim.p.c, -9.9, 9.9);
        st.sweep = { t0: performance.now(), c0: sim.p.c, ph: Math.asin(c0 / 10) };
      } }
    ],
    readouts: [
      { id: 'roots', label: 'Roots', key: true },
      { id: 'd', label: 'Discriminant D = b² − 4ac', short: 'D', key: true },
      { id: 'kind', label: 'Nature of roots', short: 'Nature' },
      { id: 'v', label: 'Vertex', short: 'Vertex' },
      { id: 'sp', label: 'Sum, product of roots', short: 'Sum, product' }
    ],
    reset: function (sim) {
      st.sweep = null; st.c = null;
    },
    onParam: function (sim, id, v) {
      if (id === 'preset') { var q = PRESETS[v] || PRESETS.two; sim.setParam('a', q[0]); sim.setParam('b', q[1]); sim.setParam('c', q[2]); }
      st.sweep = null; st.c = null;
      return true;
    },
    readout: function (sim) {
      var q = coefs(sim), S = solve(q);
      if (S.lin) return { roots: S.roots.length ? 'x = ' + num(S.roots[0]) : 'none', d: '—', kind: nature(S), v: '—', sp: '—' };
      return {
        roots: S.roots.length ? S.roots.map(function (r) { return 'x = ' + num(r); }).join(', ') : 'none (real)',
        d: num(S.d), kind: nature(S), v: '(' + num(S.h) + ', ' + num(S.k) + ')',
        sp: num(-q.b / q.a) + ', ' + num(q.c / q.a)
      };
    },
    status: function (sim) { return nature(solve(coefs(sim))); },
    animate: function () { return !!st.sweep; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim), S = solve(coefs(sim));
        if (S.lin || st.sweep) return false;
        var vx = X(L, S.h), vy = Y(L, M.clamp(S.k, -YR, YR));
        if (Math.hypot(vx - x, vy - y) > 30) return false;
      },
      move: function (sim, x, y) {
        var L = layout(sim), a = sim.p.a;
        var h = M.clamp(Math.round((x - L.ox) / L.ux * 2) / 2, -XR, XR), k = M.clamp(Math.round((L.oy - y) / L.uy * 2) / 2, -YR, YR);
        var b = M.clamp(Math.round(-2 * a * h * 10) / 10, -10, 10), c = M.clamp(Math.round((a * h * h + k) * 10) / 10, -10, 10);
        sim.setParam('b', b); sim.setParam('c', c);
      },
      hover: function (sim, x, y) {
        var L = layout(sim), S = solve(coefs(sim));
        return !S.lin && Math.hypot(X(L, S.h) - x, Y(L, M.clamp(S.k, -YR, YR)) - y) < 30;
      }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, c = sim.colors, L = layout(sim), p = L.plot;
      if (st.sweep) {
        var t = (now - st.sweep.t0) / 1000;
        if (t >= SWEEP) { st.sweep = null; st.c = null; }
        else st.c = Math.round(10 * Math.sin(st.sweep.ph + 2 * Math.PI * t / SWEEP) * 10) / 10;
      }
      var q = coefs(sim), S = solve(q), fs = L.wide ? 13 : 11;
      D.clear(ctx, L.W, L.H, c.bg);

      // grid and axes
      D.roundRect(ctx, p.x, p.y, p.w, p.h, 6, D.alpha(c.ink, 0.03));
      ctx.save(); ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.beginPath();
      for (var gx = -XR; gx <= XR; gx++) { ctx.moveTo(Math.round(X(L, gx)) + 0.5, p.y); ctx.lineTo(Math.round(X(L, gx)) + 0.5, p.y + p.h); }
      for (var gy = -YR; gy <= YR; gy++) { ctx.moveTo(p.x, Math.round(Y(L, gy)) + 0.5); ctx.lineTo(p.x + p.w, Math.round(Y(L, gy)) + 0.5); }
      ctx.stroke(); ctx.restore();
      D.line(ctx, p.x, L.oy, p.x + p.w, L.oy, c.axis, 1.6);
      D.line(ctx, L.ox, p.y, L.ox, p.y + p.h, c.axis, 1.6);
      for (var k = -XR; k <= XR; k += 2) if (k) D.text(ctx, num(k), X(L, k), p.y + p.h + 9, { color: c.muted, size: 10, align: 'center' });
      for (var j = -YR; j <= YR; j += (L.uy < 12 ? 5 : 2)) if (j && j > -YR) D.text(ctx, num(j), p.x - 4, Y(L, j), { color: c.muted, size: 10, align: 'right' });
      D.text(ctx, 'x', p.x + p.w - 6, L.oy - 9, { color: c.muted, size: 12, weight: 700, align: 'center' });
      D.text(ctx, 'y', L.ox + 9, p.y + 8, { color: c.muted, size: 12, weight: 700, align: 'center' });

      ctx.save(); ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip();
      // axis of symmetry
      if (!S.lin) D.line(ctx, X(L, S.h), p.y, X(L, S.h), p.y + p.h, D.alpha(c.accent, 0.7), 1.5, [6, 5]);
      // the curve
      ctx.strokeStyle = c.s1; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
      for (var px = p.x, first = true; px <= p.x + p.w; px += 2) {
        var xv = (px - L.ox) / L.ux, yv = q.a * xv * xv + q.b * xv + q.c, py = M.clamp(Y(L, yv), p.y - 40, p.y + p.h + 40);
        if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // y-intercept
      if (Math.abs(q.c) <= YR) D.circle(ctx, L.ox, Y(L, q.c), 4, c.s2);
      ctx.restore();
      if (Math.abs(q.c) <= YR) D.text(ctx, '(0, ' + num(q.c) + ')', L.ox + 7, Y(L, q.c) + (S.lin || S.h >= 0 ? -10 : 10), { color: c.s2, size: fs - 1, weight: 700, bg: D.alpha(c.bg, 0.75), pad: 2 });

      // roots on the x-axis
      var col = S.lin ? c.muted : S.d > 0 ? c.success : S.d === 0 ? c.warning : c.danger;
      S.roots.forEach(function (r, i) {
        if (Math.abs(r) > XR) return;
        D.circle(ctx, X(L, r), L.oy, 7, col, c.bg, 2);
        // outside the curve: above the axis when it opens upwards, beside each root
        var lab = 'x = ' + num(r) + (S.d === 0 ? ' (twice)' : ''), right = S.roots.length === 2 && i === 1;
        D.text(ctx, lab, X(L, r) + (right ? 9 : -9), L.oy + (q.a > 0 ? -15 : 15), { color: col, size: fs, weight: 800, align: right ? 'left' : 'right', bg: D.alpha(c.bg, 0.85), pad: 3, fit: L.wide ? p.x + p.w : L.W });
      });
      var off2 = S.roots.filter(function (r) { return Math.abs(r) > XR; }).length;
      if (off2) D.text(ctx, off2 + ' root' + (off2 > 1 ? 's' : '') + ' off the grid', p.x + p.w - 6, p.y + p.h - 10, { color: c.muted, size: 11, align: 'right', bg: D.alpha(c.bg, 0.8), pad: 2 });

      // vertex (drag handle)
      if (!S.lin) {
        var vk = M.clamp(S.k, -YR, YR), vx = X(L, S.h), vy = Y(L, vk);
        if (S.d < 0 && Math.abs(S.k) <= YR) {
          D.arrow(ctx, vx, L.oy, vx, vy + (S.k > 0 ? 9 : -9), c.danger, 1.8, 6);
          D.text(ctx, 'never meets the x-axis', vx + 8, (L.oy + vy) / 2, { color: c.danger, size: fs - 1, weight: 700, bg: D.alpha(c.bg, 0.85), pad: 2, fit: L.wide ? p.x + p.w : L.W });
        }
        if (Math.abs(S.k) <= YR) { D.circle(ctx, vx, vy, 13, D.alpha(c.accent, 0.2)); D.circle(ctx, vx, vy, 6.5, c.accent, c.bg, 2); }
        var up = S.d === 0 ? q.a < 0 : S.k >= 0;
        D.text(ctx, 'V(' + num(S.h) + ', ' + num(S.k) + ')' + (Math.abs(S.k) > YR ? ' off the grid' : ''), vx, M.clamp(vy + (up ? -22 : 22), p.y + 10, p.y + p.h - 10), { color: c.accent, size: fs, weight: 800, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 3, fit: L.wide ? p.x + p.w : L.W });
      }
      if (st.sweep) D.text(ctx, 'c = ' + num(q.c), p.x + 8, p.y + 12, { color: c.ink, size: 13, weight: 800, bg: D.alpha(c.bg, 0.85), pad: 3 });

      // working panel
      var pn = L.panel, rows = [], big = L.wide ? 2 : 0;
      if (L.wide) D.roundRect(ctx, pn.x, pn.y, pn.w, pn.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.12));
      rows.push({ t: eqn(q), color: c.s1, size: 15 + big, weight: 800, gap: 2 });
      if (S.lin) {
        rows.push({ t: 'With a = 0 there is no x² term: this is a straight line, not a parabola.', color: c.warning, size: 12 + big, weight: 700 });
      } else {
        var sgn = S.d > 0 ? '> 0, so two real roots' : S.d === 0 ? '= 0, so one repeated root' : '< 0, so no real roots';
        rows.push({ t: 'D = b² − 4ac = ' + par(q.b) + '² − 4' + '·' + par(q.a) + '·' + par(q.c) + ' = ' + num(S.d) + ' ' + sgn, color: col, size: 12.5 + big, weight: 700 });
        if (S.d >= 0) {
          var sq = Math.sqrt(S.d), sqT = Math.abs(sq - Math.round(sq)) < 1e-9 ? num(sq) : '√' + num(S.d);
          rows.push({ t: 'x = (−b ± √D) / 2a = (' + num(-q.b) + ' ± ' + sqT + ') / ' + par(2 * q.a) + (S.roots.length ? ' = ' + S.roots.map(num).join(' or ') : ''), color: c.ink, size: 12.5 + big, weight: 700 });
        } else rows.push({ t: '√D would be the square root of a negative number, which is not a real number.', color: c.ink, size: 12 + big });
        if (L.wide) {
          rows.push({ t: 'Vertex (−b/2a, −D/4a) = (' + num(S.h) + ', ' + num(S.k) + '); axis of symmetry x = ' + num(S.h), color: c.accent, size: 13 + big, weight: 700 },
            { t: 'Opens ' + (q.a > 0 ? 'upwards (a > 0): lowest point ' : 'downwards (a < 0): highest point ') + 'is the vertex.', color: c.muted, size: 12 + big });
          if (S.d >= 0) rows.push({ t: 'Sum of roots = −b/a = ' + num(-q.b / q.a) + ';  product = c/a = ' + num(q.c / q.a), color: c.muted, size: 12 + big });
          rows.push({ t: 'Drag the vertex V to move the curve.', color: c.muted, size: 12 + big });
        } else rows.push({ t: 'Vertex (' + num(S.h) + ', ' + num(S.k) + ') · axis x = ' + num(S.h) + ' · drag V to move it', color: c.accent, size: 11.5, weight: 700 });
      }
      rowsText(ctx, rows, pn.x + (L.wide ? 12 : 2), pn.y + (L.wide ? 12 : 2), pn.w - (L.wide ? 24 : 4));
    }
  });
})();
