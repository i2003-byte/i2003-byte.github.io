/* =====================================================================
   Coordinate geometry · Distance Formula — sim.js
   ---------------------------------------------------------------------
   Points with whole-number coordinates on a −8…8 grid. Drag a point
   (it snaps to the grid), tap the grid to send the chosen point there,
   or use the "Move point" list with the x and y sliders.
     2 points — the right triangle under AB: legs Δx and Δy, and
                AB = √(Δx² + Δy²) worked out step by step.
     3 points — the three sides; collinear if the two shorter sides add
                up to the longest; right-angled by Pythagoras on the
                squared lengths (whole numbers, so the tests are exact).
     4 points — sides and diagonals of ABCD: square, rectangle, rhombus,
                parallelogram or none of these (or sides crossing).
   Model coordinates have y pointing up.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var R = 8, NAMES = ['A', 'B', 'C', 'D'];
  var PRESETS = {
    two: [[-3, -2], [5, 4]],
    right: [[-2, -1], [4, -1], [-2, 7]],
    iso: [[-4, -2], [4, -2], [0, 5]],
    line: [[-6, -3], [0, 0], [4, 2]],
    square: [[-3, -4], [4, -3], [3, 4], [-4, 3]],
    rect: [[-5, 0], [-1, -4], [2, -1], [-2, 3]],
    rhombus: [[-4, 0], [0, -2], [4, 0], [0, 2]],
    para: [[-5, -2], [2, -2], [4, 3], [-3, 3]]
  };
  var st = { pts: null, init: false };

  function load(key) { st.pts = (PRESETS[key] || PRESETS.two).map(function (q) { return { x: q[0], y: q[1] }; }); }
  function n() { return st.pts.length; }
  function sel(sim) { return Math.min(NAMES.indexOf(sim.p.pt), n() - 1); }
  function syncSliders(sim) {
    var i = sel(sim);
    if (NAMES[i] !== sim.p.pt) sim.setParam('pt', NAMES[i]);
    sim.setParam('x', st.pts[i].x); sim.setParam('y', st.pts[i].y);
  }
  function neg(v) { return v < 0 ? '−' + Math.abs(v) : String(v); }
  function par(v) { return v < 0 ? '(' + neg(v) + ')' : String(v); }
  function d2(a, b) { return (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y); }
  // √n written simply: 10, 5√2, √13
  function surd(q) {
    if (q === 0) return '0';
    var out = 1, rest = q;
    for (var k = Math.floor(Math.sqrt(q)); k > 1; k--) if (rest % (k * k) === 0) { out = k; rest = rest / (k * k); break; }
    return rest === 1 ? String(out) : (out > 1 ? out : '') + '√' + rest;
  }
  function len(q) { var s = surd(q); return Math.sqrt(q) % 1 === 0 ? s : s + ' ≈ ' + M.fmt(Math.sqrt(q), 2); }
  function cross(o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
  function segX(p1, p2, p3, p4) {
    var d1 = cross(p3, p4, p1), d2_ = cross(p3, p4, p2), d3 = cross(p1, p2, p3), d4 = cross(p1, p2, p4);
    return ((d1 > 0 && d2_ < 0) || (d1 < 0 && d2_ > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }

  // what kind of figure, with the reason
  function analyse() {
    var P = st.pts;
    if (n() === 2) return { kind: 'Distance', why: [] };
    if (n() === 3) {
      var s = [{ k: 'AB', q: d2(P[0], P[1]), opp: 'C' }, { k: 'BC', q: d2(P[1], P[2]), opp: 'A' }, { k: 'CA', q: d2(P[2], P[0]), opp: 'B' }];
      if (s.some(function (e) { return e.q === 0; })) return { kind: 'Two points are the same', why: ['Move them apart.'], bad: true };
      var sorted = s.slice().sort(function (a, b) { return a.q - b.q; });
      if (cross(P[0], P[1], P[2]) === 0) return { kind: 'Collinear (no triangle)', why: [sorted[0].k + ' + ' + sorted[1].k + ' = ' + sorted[2].k, 'The points lie on one straight line.'], bad: true };
      var why = [], kind;
      var right = sorted[0].q + sorted[1].q === sorted[2].q;
      var eq = s[0].q === s[1].q && s[1].q === s[2].q;
      var iso = s[0].q === s[1].q || s[1].q === s[2].q || s[0].q === s[2].q;
      if (right) why.push(sorted[0].k + '² + ' + sorted[1].k + '² = ' + sorted[0].q + ' + ' + sorted[1].q + ' = ' + sorted[2].q + ' = ' + sorted[2].k + '²');
      if (iso) { var pr = s[0].q === s[1].q ? 'AB = BC' : s[1].q === s[2].q ? 'BC = CA' : 'AB = CA'; why.push(eq ? 'All three sides equal' : pr); }
      var at = sorted[2].opp;
      kind = eq ? 'Equilateral' : right && iso ? 'Right isosceles, 90° at ' + at : right ? 'Right-angled at ' + at : iso ? 'Isosceles' : 'Scalene';
      if (!right && !eq) why.push('No two squared sides add up to the third');
      return { kind: kind, why: why, s: s };
    }
    var sides = [d2(P[0], P[1]), d2(P[1], P[2]), d2(P[2], P[3]), d2(P[3], P[0])], dg = [d2(P[0], P[2]), d2(P[1], P[3])];
    if (sides.some(function (q) { return q === 0; })) return { kind: 'Two points are the same', why: ['Move them apart.'], bad: true };
    if (segX(P[0], P[1], P[2], P[3]) || segX(P[1], P[2], P[3], P[0])) return { kind: 'Sides cross', why: ['Join the points in order A → B → C → D.', 'Swap two points to untangle it.'], bad: true };
    var opp = sides[0] === sides[2] && sides[1] === sides[3], all = opp && sides[0] === sides[1], deq = dg[0] === dg[1];
    // a simple (not crossed) quadrilateral with both pairs of opposite sides equal is a parallelogram
    var w = [];
    if (all) w.push('AB = BC = CD = DA'); else if (opp) w.push('AB = CD and BC = DA'); else w.push('Opposite sides are not both equal');
    w.push(deq ? 'Diagonals AC = BD' : 'Diagonals AC ≠ BD');
    var k = all && deq ? 'Square' : all ? 'Rhombus' : opp && deq ? 'Rectangle' : opp ? 'Parallelogram' : 'None of these';
    return { kind: k, why: w, sides: sides, dg: dg };
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.2, tall = !wide && H > W * 1.15;
    var ax = 6, ay = 6, aw = W - 12, ah = H - 12, panel;
    if (wide) { var pw = Math.min(400, Math.max(250, W * 0.4)); aw = W - pw - 18; panel = { x: W - pw - 6, y: 10, w: pw, h: H - 20 }; }
    else if (tall) { var ph = Math.min(150, H * 0.3); ah = H - ph - 12; panel = { x: 8, y: H - ph - 4, w: W - 16, h: ph }; }
    else { ay = 44; ah = H - 50; panel = { x: 8, y: 6, w: W - 16, h: 34, strip: true }; }
    var u = Math.min(aw, ah) / (2 * R + 1.4);
    return { W: W, H: H, u: u, ox: ax + aw / 2, oy: ay + ah / 2, panel: panel, narrow: W < 560 };
  }
  function toPx(L, q) { return { x: L.ox + q.x * L.u, y: L.oy - q.y * L.u }; }

  function plane(ctx, c, L) {
    var u = L.u, x0 = L.ox - R * u, y0 = L.oy - R * u, sz = 2 * R * u;
    D.roundRect(ctx, x0 - u * 0.5, y0 - u * 0.5, sz + u, sz + u, 8, D.alpha(c.ink, 0.03));
    D.grid(ctx, x0, y0, sz, sz, u, c.grid);
    D.arrow(ctx, x0 - u * 0.4, L.oy, x0 + sz + u * 0.55, L.oy, c.axis, 1.6, 7);
    D.arrow(ctx, L.ox, y0 + sz + u * 0.4, L.ox, y0 - u * 0.55, c.axis, 1.6, 7);
    var every = u < 22 ? 2 : 1, fs = Math.max(9, Math.min(11, u * 0.5));
    for (var k = -R; k <= R; k++) {
      if (k === 0 || k % every) continue;
      D.text(ctx, neg(k), L.ox + k * u, L.oy + fs * 0.9, { color: c.muted, size: fs, align: 'center' });
      D.text(ctx, neg(k), L.ox - 4, L.oy - k * u, { color: c.muted, size: fs, align: 'right' });
    }
    D.text(ctx, 'x', x0 + sz + u * 0.45, L.oy - 10, { color: c.muted, size: 12, weight: 700, align: 'center' });
    D.text(ctx, 'y', L.ox + 10, y0 - u * 0.45, { color: c.muted, size: 12, weight: 700, align: 'center' });
    D.text(ctx, 'O', L.ox - 4, L.oy + fs * 0.9, { color: c.muted, size: fs, align: 'right' });
  }
  function pointsDraw(ctx, c, L, cols, selI) {
    var P = st.pts, cx = 0, cy = 0;
    P.forEach(function (q) { cx += q.x / P.length; cy += q.y / P.length; });
    P.forEach(function (q, i) {
      var s = toPx(L, q), dx = q.x - cx, dy = q.y - cy, dl = Math.hypot(dx, dy) || 1;
      if (i === selI) D.circle(ctx, s.x, s.y, 13, D.alpha(cols[i], 0.22));
      D.circle(ctx, s.x, s.y, 6.5, cols[i], c.bg, 2);
      var lx = s.x + dx / dl * 22, ly = s.y - dy / dl * 18;
      D.text(ctx, NAMES[i] + '(' + neg(q.x) + ', ' + neg(q.y) + ')', lx, ly, { color: cols[i], size: L.narrow ? 11 : 13, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: L.W });
    });
  }
  // rows of text: long rows shrink a little, then wrap onto the next line
  function textLines(ctx, c, box, rows) {
    var big = box.w >= 340, lh = big ? 25 : Math.min(22, Math.max(14, box.h / rows.length)), y = box.y + lh / 2;
    var font = function (r, sz) { ctx.font = (r.bold ? 700 : 500) + ' ' + sz + 'px Inter, system-ui, sans-serif'; };
    rows.forEach(function (r) {
      var sz = r.size ? r.size + (big ? 1 : 0) : (big ? 15 : 12), min = box.h > 60 ? Math.max(10.5, sz - 2.5) : 9;
      font(r, sz);
      while (sz > min && ctx.measureText(r.t).width > box.w - 8) { sz -= 0.5; font(r, sz); }
      var lines = [r.t];
      if (ctx.measureText(r.t).width > box.w - 8) {
        lines = []; var cur = '';
        r.t.split(' ').forEach(function (wd) {
          var tryS = cur ? cur + ' ' + wd : wd;
          if (cur && ctx.measureText(tryS).width > box.w - 8) { lines.push(cur); cur = wd; } else cur = tryS;
        });
        lines.push(cur);
      }
      lines.forEach(function (t, k) {
        D.text(ctx, (k ? '   ' : '') + t, box.x + 4, y, { color: r.color || c.ink, size: sz, weight: r.bold ? 700 : 500 });
        y += lh * (k < lines.length - 1 ? 0.85 : (r.gap || 1));
      });
    });
  }

  SimLab.createSim({
    ariaLabel: 'A coordinate grid with two to four points that can be dragged. The distance between points is shown with a right triangle and the distance formula, and the sim says what shape the points make',
    transport: false,
    mobileAspect: '3 / 3.9',
    params: [
      { id: 'preset', label: 'Start from', type: 'select', value: 'two', options: [
        { value: 'two', label: 'Two points: distance AB' },
        { value: 'right', label: 'Triangle: is it right-angled?' },
        { value: 'iso', label: 'Triangle: is it isosceles?' },
        { value: 'line', label: 'Three points on a line?' },
        { value: 'square', label: 'Four points: a tilted square' },
        { value: 'rect', label: 'Four points: a rectangle' },
        { value: 'rhombus', label: 'Four points: a rhombus' },
        { value: 'para', label: 'Four points: a parallelogram' }] },
      { id: 'pt', label: 'Move point', type: 'select', value: 'A', options: NAMES.map(function (k) { return { value: k, label: k }; }), help: 'Or drag a point on the grid, or tap the grid to move the chosen point there.' },
      { id: 'x', label: 'x', min: -R, max: R, step: 1, value: -3 },
      { id: 'y', label: 'y', min: -R, max: R, step: 1, value: -2 }
    ],
    readouts: [
      { id: 'ab', label: 'Distance AB', short: 'AB', key: true },
      { id: 'dx', label: 'Δx = x₂ − x₁', short: 'Δx', digits: 0 },
      { id: 'dy', label: 'Δy = y₂ − y₁', short: 'Δy', digits: 0 },
      { id: 'others', label: 'Other sides' },
      { id: 'diag', label: 'Diagonals AC, BD', short: 'Diagonals' },
      { id: 'kind', label: 'Shape', key: true }
    ],
    reset: function (sim) {
      load(sim.p.preset);
      var i = sel(sim);
      if (!st.init) { st.init = true; if (/[?&][xy]=/.test(location.search)) st.pts[i] = { x: sim.p.x, y: sim.p.y }; else syncSliders(sim); }
      else syncSliders(sim);
    },
    onParam: function (sim, id, v) {
      if (id === 'preset') { load(v); syncSliders(sim); }
      else if (id === 'pt') syncSliders(sim);
      else if (id === 'x' || id === 'y') st.pts[sel(sim)][id] = v;
      return true;
    },
    readout: function (sim) {
      var P = st.pts, a = analyse(), o = { ab: len(d2(P[0], P[1])), dx: P[1].x - P[0].x, dy: P[1].y - P[0].y, others: '—', diag: '—', kind: a.kind };
      if (n() === 3) o.others = 'BC ' + len(d2(P[1], P[2])) + ', CA ' + len(d2(P[2], P[0]));
      if (n() === 4) {
        o.others = 'BC ' + surd(d2(P[1], P[2])) + ', CD ' + surd(d2(P[2], P[3])) + ', DA ' + surd(d2(P[3], P[0]));
        o.diag = surd(d2(P[0], P[2])) + ', ' + surd(d2(P[1], P[3]));
      }
      if (n() === 2) o.kind = 'AB = ' + len(d2(P[0], P[1]));
      return o;
    },
    status: function (sim) { return analyse().kind; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim), best = -1, bd = 26;
        st.pts.forEach(function (q, i) { var s = toPx(L, q), dd = Math.hypot(s.x - x, s.y - y); if (dd < bd) { bd = dd; best = i; } });
        var gx = (x - L.ox) / L.u, gy = (L.oy - y) / L.u;
        if (best < 0 && (Math.abs(gx) > R + 0.6 || Math.abs(gy) > R + 0.6)) return false;
        if (best >= 0) sim.setParam('pt', NAMES[best]);
        this.move(sim, x, y);
      },
      move: function (sim, x, y) {
        var L = layout(sim), i = sel(sim);
        var q = { x: M.clamp(Math.round((x - L.ox) / L.u), -R, R), y: M.clamp(Math.round((L.oy - y) / L.u), -R, R) };
        st.pts[i] = q; sim.setParam('x', q.x); sim.setParam('y', q.y);
      },
      hover: function (sim, x, y) {
        var L = layout(sim);
        return st.pts.some(function (q) { var s = toPx(L, q); return Math.hypot(s.x - x, s.y - y) < 26; });
      }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, L = layout(sim), P = st.pts, S = P.map(function (q) { return toPx(L, q); });
      var cols = [c.s1, c.s2, c.s3, c.s4], a = analyse(), selI = sel(sim), fs = L.narrow ? 11 : 13;
      D.clear(ctx, L.W, L.H, c.bg);
      plane(ctx, c, L);

      if (n() === 2) {
        var A = S[0], B = S[1], K = { x: B.x, y: A.y }, dx = P[1].x - P[0].x, dy = P[1].y - P[0].y;
        if (dx && dy) {
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(K.x, K.y); ctx.lineTo(B.x, B.y); ctx.closePath();
          ctx.fillStyle = D.alpha(c.warning, 0.08); ctx.fill();
          var sq = 9 * Math.sign(dx), sy = 9 * Math.sign(dy);
          ctx.strokeStyle = c.muted; ctx.lineWidth = 1.2; ctx.beginPath();
          ctx.moveTo(K.x - sq, K.y); ctx.lineTo(K.x - sq, K.y - sy); ctx.lineTo(K.x, K.y - sy); ctx.stroke();
        }
        if (dx) {
          D.line(ctx, A.x, A.y, K.x, K.y, c.warning, 3, [7, 4]);
          D.text(ctx, 'Δx = ' + neg(P[1].x) + ' − ' + par(P[0].x) + ' = ' + neg(dx), (A.x + K.x) / 2, A.y + (dy > 0 ? 15 : -15), { color: c.warning, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: L.W });
        }
        if (dy) {
          D.line(ctx, K.x, K.y, B.x, B.y, c.success, 3, [7, 4]);
          var vy = (K.y + B.y) / 2, right = dx >= 0;
          D.text(ctx, 'Δy = ' + neg(dy), K.x + (right ? 8 : -8), vy, { color: c.success, size: fs, weight: 700, align: right ? 'left' : 'right', bg: D.alpha(c.bg, 0.8), pad: 2, fit: L.W });
        }
        D.line(ctx, A.x, A.y, B.x, B.y, c.ink, 3.5);
        var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, nx = -(B.y - A.y), ny = B.x - A.x, nl = Math.hypot(nx, ny) || 1;
        if (nx * (K.x - mx) + ny * (K.y - my) > 0) { nx = -nx; ny = -ny; }
        D.text(ctx, 'd = ' + surd(d2(P[0], P[1])), mx + nx / nl * 20, my + ny / nl * 20, { color: c.ink, size: fs + 1, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 3, fit: L.W });
      } else {
        if (n() === 4) { D.line(ctx, S[0].x, S[0].y, S[2].x, S[2].y, c.muted, 1.5, [5, 5]); D.line(ctx, S[1].x, S[1].y, S[3].x, S[3].y, c.muted, 1.5, [5, 5]); }
        ctx.beginPath(); S.forEach(function (s, i) { if (i) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); }); ctx.closePath();
        ctx.fillStyle = D.alpha(a.bad ? c.danger : c.accent, 0.1); ctx.fill();
        ctx.strokeStyle = a.bad ? c.danger : c.ink; ctx.lineWidth = 2.5; ctx.stroke();
        // side lengths at the middle of each side, pushed outwards
        var gx = 0, gy = 0; S.forEach(function (s) { gx += s.x / n(); gy += s.y / n(); });
        for (var i = 0; i < n(); i++) {
          var p1 = S[i], p2 = S[(i + 1) % n()], q = d2(P[i], P[(i + 1) % n()]), mx2 = (p1.x + p2.x) / 2, my2 = (p1.y + p2.y) / 2;
          var ox = mx2 - gx, oy = my2 - gy, ol = Math.hypot(ox, oy) || 1;
          if (q) D.text(ctx, surd(q), mx2 + ox / ol * 14, my2 + oy / ol * 12, { color: c.ink, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: L.W });
        }
        // right-angle mark
        if (n() === 3 && /at [ABC]$/.test(a.kind) && !a.bad) {
          var vi = NAMES.indexOf(a.kind.match(/at ([ABC])/)[1]), V = S[vi], U1 = S[(vi + 1) % 3], U2 = S[(vi + 2) % 3];
          var e1 = { x: U1.x - V.x, y: U1.y - V.y }, e2 = { x: U2.x - V.x, y: U2.y - V.y }, l1 = Math.hypot(e1.x, e1.y), l2 = Math.hypot(e2.x, e2.y), m = 11;
          ctx.strokeStyle = c.success; ctx.lineWidth = 2; ctx.beginPath();
          ctx.moveTo(V.x + e1.x / l1 * m, V.y + e1.y / l1 * m);
          ctx.lineTo(V.x + e1.x / l1 * m + e2.x / l2 * m, V.y + e1.y / l1 * m + e2.y / l2 * m);
          ctx.lineTo(V.x + e2.x / l2 * m, V.y + e2.y / l2 * m); ctx.stroke();
        }
      }
      pointsDraw(ctx, c, L, cols, selI);

      // working panel
      var pn = L.panel, rows = [], q0 = d2(P[0], P[1]);
      if (n() === 2) {
        var dx2 = P[1].x - P[0].x, dy2 = P[1].y - P[0].y;
        if (pn.strip) rows.push({ t: 'AB = √(' + par(dx2) + '² + ' + par(dy2) + '²) = √' + q0 + (surd(q0) !== '√' + q0 ? ' = ' + surd(q0) : '') + (Math.sqrt(q0) % 1 ? ' ≈ ' + M.fmt(Math.sqrt(q0), 2) : ''), bold: true, color: c.ink });
        else rows = [
          { t: 'Distance formula', bold: true, color: c.accent },
          { t: 'AB = √((x₂ − x₁)² + (y₂ − y₁)²)', bold: true },
          { t: '= √((' + neg(P[1].x) + ' − ' + par(P[0].x) + ')² + (' + neg(P[1].y) + ' − ' + par(P[0].y) + ')²)' },
          { t: '= √(' + par(dx2) + '² + ' + par(dy2) + '²) = √(' + dx2 * dx2 + ' + ' + dy2 * dy2 + ')' },
          { t: '= √' + q0 + (surd(q0) !== '√' + q0 ? ' = ' + surd(q0) : '') + (Math.sqrt(q0) % 1 ? ' ≈ ' + M.fmt(Math.sqrt(q0), 2) : '') + ' units', bold: true, color: c.success },
          { t: 'It is Pythagoras on the dashed right triangle.', color: c.muted, size: 12 }
        ];
      } else if (pn.strip) {
        rows.push({ t: a.kind + (a.why[0] ? ': ' + a.why[0] : ''), bold: true, color: a.bad ? c.danger : c.success });
      } else {
        rows.push({ t: a.kind, bold: true, color: a.bad ? c.danger : c.success, size: L.narrow ? 14 : 16 });
        var nm = n() === 3 ? ['AB', 'BC', 'CA'] : ['AB', 'BC', 'CD', 'DA'];
        var sq = nm.map(function (k, i) { return k + '² = ' + d2(P[i], P[(i + 1) % n()]); });
        if (n() === 4) sq.push('AC² = ' + d2(P[0], P[2]), 'BD² = ' + d2(P[1], P[3]));
        var per = n() === 3 ? 3 : 2;
        for (var r = 0; r < sq.length; r += per) rows.push({ t: sq.slice(r, r + per).join('   ') });
        a.why.forEach(function (w) { rows.push({ t: '• ' + w, color: c.muted }); });
      }
      if (!pn.strip) D.roundRect(ctx, pn.x, pn.y, pn.w, pn.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.12));
      textLines(ctx, c, { x: pn.x + 6, y: pn.y + 4, w: pn.w - 12, h: pn.h - 8 }, rows);
    }
  });
})();
