/* =====================================================================
   Functions & Graphs · Pair of Linear Equations: Graphs — sim.js
   ---------------------------------------------------------------------
   Two lines a₁x + b₁y = c₁ and a₂x + b₂y = c₂ (whole-number a, b, c)
   on a −8…8 grid.
     a₁b₂ ≠ a₂b₁            → lines cross: one solution (consistent)
     a₁/a₂ = b₁/b₂ ≠ c₁/c₂  → parallel: no solution (inconsistent)
     a₁/a₂ = b₁/b₂ = c₁/c₂  → same line: infinitely many (dependent)
   The ratio tests are done by cross-multiplying, so a zero in a
   denominator causes no trouble. The crossing point comes from
     x = (c₁b₂ − c₂b₁)/(a₁b₂ − a₂b₁),  y = (a₁c₂ − a₂c₁)/(a₁b₂ − a₂b₁)
   written as exact fractions. A test point P can be dragged to check
   whether it satisfies each equation.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var R = 8;
  var PRESETS = {
    one: [[1, 1, 5], [1, -1, 1]],
    frac: [[3, 2, 7], [1, -3, 2]],
    parallel: [[1, 2, 4], [2, 4, 12]],
    same: [[1, 2, 4], [2, 4, 8]],
    axis: [[1, 0, 3], [0, 1, -2]]
  };
  var st = { lines: null, P: { x: 0, y: 0 }, init: false };

  function load(key) { st.lines = (PRESETS[key] || PRESETS.one).map(function (l) { return { a: l[0], b: l[1], c: l[2] }; }); }
  function li(sim) { return sim.p.line === '2' ? 1 : 0; }
  function sync(sim) { var l = st.lines[li(sim)]; sim.setParam('a', l.a); sim.setParam('b', l.b); sim.setParam('c', l.c); }
  function neg(v) { return v < 0 ? '−' + Math.abs(v) : String(v); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function frac(n, d) {
    if (d === 0) return n === 0 ? '0/0' : neg(n) + '/0';
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d); n /= g; d /= g;
    return d === 1 ? neg(n) : neg(n) + '/' + d;
  }
  function eq(l) {
    var s = '';
    if (l.a) s = (l.a === 1 ? '' : l.a === -1 ? '−' : neg(l.a)) + 'x';
    if (l.b) s += (s ? (l.b < 0 ? ' − ' : ' + ') : (l.b < 0 ? '−' : '')) + (Math.abs(l.b) === 1 ? '' : Math.abs(l.b)) + 'y';
    return (s || '0') + ' = ' + neg(l.c);
  }
  function lhs(l, P) {   // a x + b y with numbers put in
    var parts = [];
    if (l.a) parts.push((l.a === 1 ? '' : l.a === -1 ? '−' : neg(l.a)) + '(' + neg(P.x) + ')');
    if (l.b) parts.push((parts.length ? (l.b < 0 ? '− ' : '+ ') : (l.b < 0 ? '−' : '')) + (Math.abs(l.b) === 1 ? '' : Math.abs(l.b)) + '(' + neg(P.y) + ')');
    return (parts.join(' ') || '0') + ' = ' + neg(l.a * P.x + l.b * P.y);
  }

  function analyse() {
    var A = st.lines[0], B = st.lines[1], det = A.a * B.b - B.a * A.b;
    if ((!A.a && !A.b) || (!B.a && !B.b)) return { kind: 'bad', title: 'Not a line', why: 'a and b cannot both be 0.' };
    if (det) {
      var xn = A.c * B.b - B.c * A.b, yn = A.a * B.c - B.a * A.c;
      return { kind: 'one', x: xn / det, y: yn / det, xs: frac(xn, det), ys: frac(yn, det), title: 'One solution (consistent)',
        why: 'a₁/a₂ ≠ b₁/b₂, so the lines cross at one point.' };
    }
    var same = A.a * B.c === B.a * A.c && A.b * B.c === B.b * A.c;
    return same ? { kind: 'same', title: 'Infinitely many solutions (dependent)', why: 'a₁/a₂ = b₁/b₂ = c₁/c₂: both equations are the same line.' }
      : { kind: 'none', title: 'No solution (inconsistent)', why: 'a₁/a₂ = b₁/b₂ ≠ c₁/c₂: the lines are parallel and never meet.' };
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.1;
    var ax = 6, ay = 6, aw = W - 12, ah = H - 12, panel;
    if (wide) { var pw = Math.min(420, Math.max(260, W * 0.42)); aw = W - pw - 18; panel = { x: W - pw - 6, y: 10, w: pw, h: H - 20 }; }
    else { var ph = M.clamp(H * 0.34, 104, 170); ah = H - ph - 12; panel = { x: 6, y: H - ph - 4, w: W - 12, h: ph }; }
    var u = Math.min(aw, ah) / (2 * R + 1.4);
    return { W: W, H: H, u: u, ox: ax + aw / 2, oy: ay + ah / 2, panel: panel, narrow: W < 560 };
  }
  function toPx(L, x, y) { return { x: L.ox + x * L.u, y: L.oy - y * L.u }; }

  function plane(ctx, c, L) {
    var u = L.u, x0 = L.ox - R * u, y0 = L.oy - R * u, sz = 2 * R * u;
    D.grid(ctx, x0, y0, sz, sz, u, c.grid);
    D.arrow(ctx, x0 - u * 0.4, L.oy, x0 + sz + u * 0.55, L.oy, c.axis, 1.6, 7);
    D.arrow(ctx, L.ox, y0 + sz + u * 0.4, L.ox, y0 - u * 0.55, c.axis, 1.6, 7);
    var fs = Math.max(8.5, Math.min(11, u * 0.5));
    for (var k = -R; k <= R; k += 2) {
      if (!k) continue;
      D.text(ctx, neg(k), L.ox + k * u, L.oy + fs * 0.9, { color: c.muted, size: fs, align: 'center' });
      D.text(ctx, neg(k), L.ox - 4, L.oy - k * u, { color: c.muted, size: fs, align: 'right' });
    }
    D.text(ctx, 'x', x0 + sz + u * 0.45, L.oy - 10, { color: c.muted, size: 12, weight: 700, align: 'center' });
    D.text(ctx, 'y', L.ox + 10, y0 - u * 0.45, { color: c.muted, size: 12, weight: 700, align: 'center' });
  }
  // the part of a x + b y = c inside the grid square
  function clipLine(l) {
    var pts = [], E = R + 0.4;
    if (l.b) [-E, E].forEach(function (x) { var y = (l.c - l.a * x) / l.b; if (Math.abs(y) <= E + 1e-9) pts.push({ x: x, y: y }); });
    if (l.a) [-E, E].forEach(function (y) { var x = (l.c - l.b * y) / l.a; if (Math.abs(x) <= E + 1e-9) pts.push({ x: x, y: y }); });
    if (pts.length < 2) return null;
    var best = [pts[0], pts[1]], bd = -1;
    for (var i = 0; i < pts.length; i++) for (var j = i + 1; j < pts.length; j++) {
      var d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y); if (d > bd) { bd = d; best = [pts[i], pts[j]]; }
    }
    return best;
  }
  function textLines(ctx, c, box, rows) {
    var lh = Math.min(box.w >= 340 ? 24 : 19, Math.max(13, box.h / rows.length)), y = box.y + lh / 2;
    rows.forEach(function (r) {
      var sz = r.size || (box.w >= 340 ? 14 : 12);
      ctx.font = (r.bold ? 700 : 500) + ' ' + sz + 'px Inter, system-ui, sans-serif';
      while (sz > 9 && ctx.measureText(r.t).width > box.w - 8) { sz -= 0.5; ctx.font = (r.bold ? 700 : 500) + ' ' + sz + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, r.t, box.x + 4, y, { color: r.color || c.ink, size: sz, weight: r.bold ? 700 : 500 });
      y += lh;
    });
  }

  SimLab.createSim({
    ariaLabel: 'Two straight lines on a coordinate grid, each from an equation a x plus b y equals c. The sim shows whether they cross at one point, are parallel or are the same line, with the ratio test and a test point that can be dragged',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'preset', label: 'Start from', type: 'select', value: 'one', options: [
        { value: 'one', label: 'Lines that cross: x + y = 5, x − y = 1' },
        { value: 'frac', label: 'Crossing at a fraction: 3x + 2y = 7, x − 3y = 2' },
        { value: 'parallel', label: 'Parallel lines: x + 2y = 4, 2x + 4y = 12' },
        { value: 'same', label: 'Same line twice: x + 2y = 4, 2x + 4y = 8' },
        { value: 'axis', label: 'Lines x = 3 and y = −2' }] },
      { id: 'line', label: 'Change line', type: 'select', value: '1', options: [{ value: '1', label: 'Line 1: a₁x + b₁y = c₁' }, { value: '2', label: 'Line 2: a₂x + b₂y = c₂' }] },
      { id: 'a', label: 'a (number with x)', min: -9, max: 9, step: 1, value: 1 },
      { id: 'b', label: 'b (number with y)', min: -9, max: 9, step: 1, value: 1 },
      { id: 'c', label: 'c (right-hand side)', min: -20, max: 20, step: 1, value: 5 },
      { id: 'px', label: 'Test point P: x', min: -R, max: R, step: 1, value: 4, help: 'Or drag P on the grid.' },
      { id: 'py', label: 'Test point P: y', min: -R, max: R, step: 1, value: 1 }
    ],
    readouts: [
      { id: 'kind', label: 'The pair has', short: 'Solutions', key: true },
      { id: 'sol', label: 'Solution (x, y)', short: 'Solution', key: true },
      { id: 'r1', label: 'a₁/a₂' },
      { id: 'r2', label: 'b₁/b₂' },
      { id: 'r3', label: 'c₁/c₂' },
      { id: 'p', label: 'Does P fit both?', short: 'P fits?' }
    ],
    reset: function (sim) {
      if (!st.init) {
        st.init = true; load(sim.p.preset);
        if (/[?&][abc]=/.test(location.search)) { var l = st.lines[li(sim)]; l.a = sim.p.a; l.b = sim.p.b; l.c = sim.p.c; } else sync(sim);
      } else { load(sim.p.preset); sync(sim); }
      st.P = { x: sim.p.px, y: sim.p.py };
    },
    onParam: function (sim, id, v) {
      if (id === 'preset') { load(v); sync(sim); }
      else if (id === 'line') sync(sim);
      else if (id === 'a' || id === 'b' || id === 'c') st.lines[li(sim)][id] = v;
      else if (id === 'px') st.P.x = v;
      else if (id === 'py') st.P.y = v;
      return true;
    },
    readout: function (sim) {
      var A = st.lines[0], B = st.lines[1], an = analyse(), P = st.P;
      var ok1 = A.a * P.x + A.b * P.y === A.c, ok2 = B.a * P.x + B.b * P.y === B.c;
      return {
        kind: an.kind === 'one' ? 'exactly one' : an.kind === 'none' ? 'none (parallel)' : an.kind === 'same' ? 'infinitely many' : 'not a line',
        sol: an.kind === 'one' ? '(' + an.xs + ', ' + an.ys + ')' : '—',
        r1: frac(A.a, B.a), r2: frac(A.b, B.b), r3: frac(A.c, B.c),
        p: ok1 && ok2 ? 'yes, both' : ok1 ? 'line 1 only' : ok2 ? 'line 2 only' : 'neither'
      };
    },
    status: function () { return analyse().title; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim), gx = (x - L.ox) / L.u, gy = (L.oy - y) / L.u;
        if (Math.abs(gx) > R + 0.6 || Math.abs(gy) > R + 0.6) return false;
        this.move(sim, x, y);
      },
      move: function (sim, x, y) {
        var L = layout(sim);
        st.P = { x: M.clamp(Math.round((x - L.ox) / L.u), -R, R), y: M.clamp(Math.round((L.oy - y) / L.u), -R, R) };
        sim.setParam('px', st.P.x); sim.setParam('py', st.P.y);
      },
      hover: function (sim, x, y) { var L = layout(sim), s = toPx(L, st.P.x, st.P.y); return Math.hypot(s.x - x, s.y - y) < 24; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, L = layout(sim), an = analyse(), cols = [c.s1, c.s2], sel = li(sim), fs = L.narrow ? 11 : 13;
      D.clear(ctx, L.W, L.H, c.bg);
      plane(ctx, c, L);
      ctx.save(); ctx.beginPath(); ctx.rect(L.ox - (R + 0.5) * L.u, L.oy - (R + 0.5) * L.u, (2 * R + 1) * L.u, (2 * R + 1) * L.u); ctx.clip();
      st.lines.forEach(function (l, i) {
        var seg = clipLine(l); if (!seg) return;
        var p1 = toPx(L, seg[0].x, seg[0].y), p2 = toPx(L, seg[1].x, seg[1].y);
        var dash = an.kind === 'same' && i === 1 ? [10, 8] : null;
        D.line(ctx, p1.x, p1.y, p2.x, p2.y, cols[i], i === sel ? 4 : 2.5, dash);
        // whole-number points on the line, like a table of values
        for (var x = -R; x <= R; x++) {
          if (!l.b) { if (l.a && l.c % l.a === 0 && x === l.c / l.a) for (var yy = -R; yy <= R; yy += 4) { var q0 = toPx(L, x, yy); D.circle(ctx, q0.x, q0.y, 2.5, cols[i]); } continue; }
          var yv = (l.c - l.a * x) / l.b;
          if (yv % 1 === 0 && Math.abs(yv) <= R) { var q = toPx(L, x, yv); D.circle(ctx, q.x, q.y, 2.6, cols[i]); }
        }
      });
      ctx.restore();
      // equation labels near the edge of each line
      st.lines.forEach(function (l, i) {
        var seg = clipLine(l); if (!seg) return;
        var e = seg[0].x > seg[1].x || (seg[0].x === seg[1].x && seg[0].y > seg[1].y) ? seg[0] : seg[1];
        var p = toPx(L, e.x - (e.x - (seg[0].x + seg[1].x - e.x)) * 0.12, e.y - (e.y - (seg[0].y + seg[1].y - e.y)) * 0.12);
        var off = an.kind === 'same' && i === 1 ? 18 : 0;
        D.text(ctx, eq(l), p.x, p.y - 12 + off, { color: cols[i], size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 2, fit: L.panel.y < 20 ? L.panel.x - 4 : L.W });
      });
      if (an.kind === 'one') {
        var inGrid = Math.abs(an.x) <= R && Math.abs(an.y) <= R;
        if (inGrid) {
          var s = toPx(L, an.x, an.y);
          D.circle(ctx, s.x, s.y, 13, D.alpha(c.success, 0.25));
          D.circle(ctx, s.x, s.y, 6, c.success, c.bg, 2);
          D.text(ctx, '(' + an.xs + ', ' + an.ys + ')', s.x + (an.x > R - 3 ? -12 : 12), s.y + (an.y > R - 2 ? 16 : -16), { color: c.success, size: fs, weight: 800, align: an.x > R - 3 ? 'right' : 'left', bg: D.alpha(c.bg, 0.85), pad: 2 });
        } else D.text(ctx, 'They cross off the grid at (' + an.xs + ', ' + an.ys + ')', L.ox, L.oy - R * L.u - 2, { color: c.success, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 2, fit: L.W });
      }
      // test point
      var P = st.P, sp = toPx(L, P.x, P.y), A = st.lines[0], B = st.lines[1];
      var ok1 = A.a * P.x + A.b * P.y === A.c, ok2 = B.a * P.x + B.b * P.y === B.c, pc = ok1 && ok2 ? c.success : c.warning;
      D.circle(ctx, sp.x, sp.y, 8, D.alpha(pc, 0.3), pc, 2);
      D.text(ctx, 'P', sp.x - 10, sp.y + 12, { color: pc, size: fs, weight: 800, align: 'center' });

      // working panel
      var pn = L.panel, rows = [];
      rows.push({ t: '① ' + eq(A) + '      ② ' + eq(B), bold: true, color: c.ink });
      rows.push({ t: 'a₁/a₂ = ' + frac(A.a, B.a) + '    b₁/b₂ = ' + frac(A.b, B.b) + '    c₁/c₂ = ' + frac(A.c, B.c), color: c.muted });
      rows.push({ t: an.title, bold: true, color: an.kind === 'one' ? c.success : an.kind === 'bad' ? c.danger : c.warning });
      rows.push({ t: an.why, color: c.ink });
      if (an.kind === 'one') rows.push({ t: 'Solution: x = ' + an.xs + ',  y = ' + an.ys, bold: true, color: c.success });
      rows.push({ t: 'P(' + neg(P.x) + ', ' + neg(P.y) + ') in ①: ' + lhs(A, P) + (ok1 ? ' ✓' : ' ≠ ' + neg(A.c) + ' ✗'), color: ok1 ? c.success : c.muted });
      rows.push({ t: 'P in ②: ' + lhs(B, P) + (ok2 ? ' ✓' : ' ≠ ' + neg(B.c) + ' ✗'), color: ok2 ? c.success : c.muted });
      D.roundRect(ctx, pn.x, pn.y, pn.w, pn.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.12));
      textLines(ctx, c, { x: pn.x + 6, y: pn.y + 4, w: pn.w - 12, h: pn.h - 8 }, rows);
    }
  });
})();
