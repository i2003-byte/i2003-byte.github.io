/* =====================================================================
   Coordinate geometry · Area of a Triangle from Coordinates — sim.js
   ---------------------------------------------------------------------
   A, B, C (and D for a quadrilateral) have whole-number coordinates on
   a −8…8 grid; drag them, tap the grid, or use "Move point" + sliders.
     Area = ½ |x₁(y₂ − y₃) + x₂(y₃ − y₁) + x₃(y₁ − y₂)|
   Two pictures of why it works:
     box   — the smallest rectangle round the triangle, minus the right
             triangles left over at its corners. Pigeonhole: some vertex
             is always at a corner of the box; when another vertex is
             strictly inside the box the leftover pieces are not right
             triangles, and the sim says so.
     trap  — perpendiculars from each corner down to a base line give
             three trapezia: the two on top minus the one below (or the
             other way round). This is how the formula is derived.
   Area 0 ⇔ the points are collinear. Quadrilateral: split by the
   diagonal that lies inside it, add the two triangles.
   Model coordinates have y pointing up.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var R = 8, NAMES = ['A', 'B', 'C', 'D'];
  var PRESETS = {
    gen: [[-5, -3], [5, -1], [1, 6]],
    right: [[-4, -3], [4, -3], [-4, 5]],
    line: [[-6, -5], [0, -1], [6, 3]],
    inside: [[-6, -4], [6, 6], [-1, 3]],
    quad: [[-6, -2], [2, -6], [7, 3], [-2, 6]]
  };
  var st = { pts: null, init: false };

  function load(key) { st.pts = (PRESETS[key] || PRESETS.gen).map(function (q) { return { x: q[0], y: q[1] }; }); }
  function n() { return st.pts.length; }
  function sel(sim) { return Math.min(NAMES.indexOf(sim.p.pt), n() - 1); }
  function syncSliders(sim) {
    var i = sel(sim);
    if (NAMES[i] !== sim.p.pt) sim.setParam('pt', NAMES[i]);
    sim.setParam('x', st.pts[i].x); sim.setParam('y', st.pts[i].y);
  }
  function neg(v) { return v < 0 ? '−' + Math.abs(v) : String(v); }
  function par(v) { return v < 0 ? '(' + neg(v) + ')' : String(v); }
  function half(v) { return v % 2 ? neg(v / 2).replace('.5', '½').replace(/^(−?)0½/, '$1½') : neg(v / 2); }
  // twice the signed area (positive = anticlockwise)
  function twice(a, b, c) { return a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y); }
  function shoe(P) { var s = 0; for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; s += a.x * b.y - b.x * a.y; } return s; }
  function cross(o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
  function segX(p1, p2, p3, p4) {
    var d1 = cross(p3, p4, p1), d2 = cross(p3, p4, p2), d3 = cross(p1, p2, p3), d4 = cross(p1, p2, p4);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }

  // rectangle-minus-right-triangles decomposition, or null if a vertex sits inside the box
  function boxPieces(P) {
    var x0 = Math.min(P[0].x, P[1].x, P[2].x), x1 = Math.max(P[0].x, P[1].x, P[2].x);
    var y0 = Math.min(P[0].y, P[1].y, P[2].y), y1 = Math.max(P[0].y, P[1].y, P[2].y);
    var isCorner = function (k) { return (k.x === x0 || k.x === x1) && (k.y === y0 || k.y === y1); };
    var pieces = [], sum = 0;
    for (var i = 0; i < 3; i++) {
      var U = P[i], W = P[(i + 1) % 3], T = P[(i + 2) % 3];
      if (U.x === W.x || U.y === W.y) continue;              // edge along a box side → nothing left over
      var ok = null;
      [{ x: U.x, y: W.y }, { x: W.x, y: U.y }].forEach(function (K) {
        if (!ok && isCorner(K) && cross(U, W, K) * cross(U, W, T) < 0) ok = K;
      });
      if (!ok) return null;
      var a2 = Math.abs((W.x - U.x) * (W.y - U.y));
      pieces.push({ U: U, W: W, K: ok, a2: a2 }); sum += a2;
    }
    var box2 = 2 * (x1 - x0) * (y1 - y0);
    if (box2 - sum !== Math.abs(twice(P[0], P[1], P[2]))) return null;
    return { x0: x0, x1: x1, y0: y0, y1: y1, pieces: pieces, box2: box2 };
  }

  // the three trapezia down to the base line y = yb
  function trapezia(P) {
    var yb = Math.min(P[0].y, P[1].y, P[2].y) - 1, s = P.slice().sort(function (a, b) { return a.x - b.x; });
    var L = s[0], Mi = s[1], Rr = s[2], up = cross(L, Rr, Mi) > 0;
    var tr = function (a, b) { return { a: a, b: b, a2: (b.x - a.x) * ((a.y - yb) + (b.y - yb)) }; };
    return { yb: yb, top: up ? [tr(L, Mi), tr(Mi, Rr)] : [tr(L, Rr)], bottom: up ? [tr(L, Rr)] : [tr(L, Mi), tr(Mi, Rr)], up: up };
  }

  function quadInfo(P) {
    if (segX(P[0], P[1], P[2], P[3]) || segX(P[1], P[2], P[3], P[0])) return { bad: 'Sides cross: join A → B → C → D in order' };
    var tot = Math.abs(shoe(P));
    var ac = [Math.abs(twice(P[0], P[1], P[2])), Math.abs(twice(P[0], P[2], P[3]))];
    var bd = [Math.abs(twice(P[1], P[2], P[3])), Math.abs(twice(P[1], P[3], P[0]))];
    if (tot === 0) return { bad: 'All four points are on one line' };
    if (ac[0] + ac[1] === tot) return { diag: 'AC', t: [['A', 'B', 'C'], ['A', 'C', 'D']], a: ac, tot: tot };
    return { diag: 'BD', t: [['B', 'C', 'D'], ['B', 'D', 'A']], a: bd, tot: tot };
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


  function poly(ctx, pts, fill, stroke, lw, dash) {
    ctx.save(); if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); pts.forEach(function (s, i) { if (i) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); }); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
    ctx.restore();
  }

  SimLab.createSim({
    ariaLabel: 'A coordinate grid with a triangle whose corners can be dragged. Its area is worked out with the coordinate formula and shown as a rectangle minus right triangles, or as trapezia; points on one line give zero area. A quadrilateral can be split into two triangles',
    transport: false,
    mobileAspect: '3 / 3.9',
    params: [
      { id: 'preset', label: 'Start from', type: 'select', value: 'gen', options: [
        { value: 'gen', label: 'A triangle' },
        { value: 'right', label: 'A right triangle (check: ½ × base × height)' },
        { value: 'line', label: 'Three points on a line' },
        { value: 'inside', label: 'A corner inside the box' },
        { value: 'quad', label: 'A quadrilateral ABCD' }] },
      { id: 'view', label: 'Show why by', type: 'select', value: 'box', options: [
        { value: 'box', label: 'Rectangle minus right triangles' },
        { value: 'trap', label: 'Trapezia (how the formula is made)' },
        { value: 'none', label: 'Just the formula' }] },
      { id: 'pt', label: 'Move point', type: 'select', value: 'A', options: NAMES.map(function (k) { return { value: k, label: k }; }), help: 'Or drag a corner, or tap the grid to move the chosen point there.' },
      { id: 'x', label: 'x', min: -R, max: R, step: 1, value: -5 },
      { id: 'y', label: 'y', min: -R, max: R, step: 1, value: -3 }
    ],
    readouts: [
      { id: 'area', label: 'Area', unit: 'sq units', key: true },
      { id: 'inner', label: 'Inside the |…|', short: 'Inside |…|', digits: 0 },
      { id: 'line', label: 'Collinear?', key: true },
      { id: 'turn', label: 'A → B → C turns' },
      { id: 'box', label: 'Box area', unit: 'sq units', digits: 0 }
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
      var P = st.pts;
      if (n() === 4) {
        var qi = quadInfo(P);
        return { area: qi.bad ? '—' : half(qi.tot), inner: shoe(P), line: qi.bad || 'No', turn: shoe(P) > 0 ? 'anticlockwise' : shoe(P) < 0 ? 'clockwise' : '—', box: '—' };
      }
      var t = twice(P[0], P[1], P[2]), bx = (Math.max(P[0].x, P[1].x, P[2].x) - Math.min(P[0].x, P[1].x, P[2].x)) * (Math.max(P[0].y, P[1].y, P[2].y) - Math.min(P[0].y, P[1].y, P[2].y));
      return { area: half(Math.abs(t)), inner: t, line: t === 0 ? 'Yes: area 0' : 'No', turn: t > 0 ? 'anticlockwise' : t < 0 ? 'clockwise' : 'not at all', box: bx };
    },
    status: function () { var P = st.pts; return n() === 4 ? 'Quadrilateral area ' + half(Math.abs(shoe(P))) : 'Area = ' + half(Math.abs(twice(P[0], P[1], P[2]))) + ' sq units'; },
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
      var cols = [c.s1, c.s2, c.s3, c.s4], fs = L.narrow ? 11 : 13, rows = [], strip = '', view = sim.p.view;
      var lbl = function (t, x, y, col) { D.text(ctx, t, x, y, { color: col, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: L.W }); };
      D.clear(ctx, L.W, L.H, c.bg);
      plane(ctx, c, L);

      if (n() === 4) {
        var qi = quadInfo(P);
        if (qi.bad) {
          poly(ctx, S, D.alpha(c.danger, 0.1), c.danger, 2.5);
          rows = [{ t: qi.bad, bold: true, color: c.danger }]; strip = qi.bad;
        } else {
          var idx = function (k) { return NAMES.indexOf(k); };
          qi.t.forEach(function (tr, k) {
            var ps = tr.map(function (v) { return S[idx(v)]; }), col = k ? c.s2 : c.s1;
            poly(ctx, ps, D.alpha(col, 0.18));
            var gx = (ps[0].x + ps[1].x + ps[2].x) / 3, gy = (ps[0].y + ps[1].y + ps[2].y) / 3;
            lbl(tr.join('') + ' = ' + half(qi.a[k]), gx, gy, col);
          });
          poly(ctx, S, null, c.ink, 2.5);
          var d0 = S[idx(qi.diag[0])], d1 = S[idx(qi.diag[1])];
          D.line(ctx, d0.x, d0.y, d1.x, d1.y, c.warning, 2.5, [7, 5]);
          rows = [
            { t: 'Quadrilateral = two triangles', bold: true, color: c.accent },
            { t: 'Cut along the diagonal ' + qi.diag + ' (it lies inside)', color: c.warning },
            { t: 'Area ' + qi.t[0].join('') + ' = ½ × ' + qi.a[0] + ' = ' + half(qi.a[0]) },
            { t: 'Area ' + qi.t[1].join('') + ' = ½ × ' + qi.a[1] + ' = ' + half(qi.a[1]) },
            { t: 'Area ABCD = ' + half(qi.a[0]) + ' + ' + half(qi.a[1]) + ' = ' + half(qi.tot) + ' sq units', bold: true, color: c.success }
          ];
          strip = qi.t[0].join('') + ' ' + half(qi.a[0]) + ' + ' + qi.t[1].join('') + ' ' + half(qi.a[1]) + ' = ' + half(qi.tot) + ' sq units';
        }
      } else {
        var A = P[0], B = P[1], C = P[2], t = twice(A, B, C), area = half(Math.abs(t));
        var bp = view === 'box' && t !== 0 ? boxPieces(P) : null, note = '';
        if (view === 'box' && t !== 0) {
          if (bp) {
            var b0 = toPx(L, { x: bp.x0, y: bp.y1 }), b1 = toPx(L, { x: bp.x1, y: bp.y0 });
            D.roundRect(ctx, b0.x, b0.y, b1.x - b0.x, b1.y - b0.y, 0, D.alpha(c.warning, 0.06), c.warning, 2);
            bp.pieces.forEach(function (pc) {
              var ps = [toPx(L, pc.U), toPx(L, pc.K), toPx(L, pc.W)];
              poly(ctx, ps, D.alpha(c.danger, 0.16), D.alpha(c.danger, 0.6), 1.2, [4, 3]);
              lbl(half(pc.a2), (ps[0].x + ps[1].x * 1.6 + ps[2].x) / 3.6, (ps[0].y + ps[1].y * 1.6 + ps[2].y) / 3.6, c.danger);
            });
            lbl('box ' + (bp.x1 - bp.x0) + ' × ' + (bp.y1 - bp.y0) + ' = ' + bp.box2 / 2, (b0.x + b1.x) / 2, b1.y + 13, c.warning);
            rows = [
              { t: 'Rectangle minus right triangles', bold: true, color: c.accent },
              { t: 'Box = ' + (bp.x1 - bp.x0) + ' × ' + (bp.y1 - bp.y0) + ' = ' + bp.box2 / 2, color: c.warning },
              { t: 'Corners cut off = ' + (bp.pieces.length ? bp.pieces.map(function (pc) { return half(pc.a2); }).join(' + ') + ' = ' + half(bp.box2 - Math.abs(t)) : '0'), color: c.danger },
              { t: 'Triangle = ' + bp.box2 / 2 + ' − ' + half(bp.box2 - Math.abs(t)) + ' = ' + area }
            ];
          } else note = 'One corner is inside the box, so the pieces are not right triangles. Try the trapezia.';
        }
        if (view === 'trap' && t !== 0) {
          var tz = trapezia(P), base = toPx(L, { x: 0, y: tz.yb });
          D.line(ctx, L.ox - R * L.u, base.y, L.ox + R * L.u, base.y, c.muted, 1.5, [6, 4]);
          D.text(ctx, 'base line y = ' + neg(tz.yb), L.ox + R * L.u, base.y + 11, { color: c.muted, size: fs - 1, align: 'right', fit: L.W });
          var drawT = function (tr, col, k) {
            if (!tr.a2) return;
            var a = toPx(L, tr.a), b = toPx(L, tr.b);
            poly(ctx, [a, b, { x: b.x, y: base.y }, { x: a.x, y: base.y }], D.alpha(col, 0.13), D.alpha(col, 0.8), 1.4, [4, 3]);
            lbl((k > 0 ? '+' : '−') + half(tr.a2), (a.x + b.x) / 2, (Math.max(a.y, b.y) + base.y) / 2 + (k > 0 ? -8 : 8), col);
          };
          tz.top.forEach(function (tr) { drawT(tr, c.success, 1); });
          tz.bottom.forEach(function (tr) { drawT(tr, c.danger, -1); });
          var tsum = function (a) { return a.reduce(function (s, tr) { return s + tr.a2; }, 0); };
          rows = [
            { t: 'Trapezia down to a base line', bold: true, color: c.accent },
            { t: 'Each trapezium = ½ × width × (sum of the two heights)', size: 12, color: c.muted },
            { t: 'Upper edge(s): ' + tz.top.map(function (tr) { return half(tr.a2); }).join(' + '), color: c.success },
            { t: 'Lower edge(s): ' + tz.bottom.map(function (tr) { return half(tr.a2); }).join(' + '), color: c.danger },
            { t: 'Triangle = ' + half(tsum(tz.top)) + ' − ' + half(tsum(tz.bottom)) + ' = ' + area }
          ];
        }
        poly(ctx, S, D.alpha(t === 0 ? c.danger : c.accent, t === 0 ? 0 : 0.16), t === 0 ? c.danger : c.ink, 2.5);
        if (t === 0) {
          rows = [{ t: 'Area = 0: A, B and C are collinear', bold: true, color: c.danger }];
          strip = 'Area = ½|' + t + '| = 0 → the points are collinear';
        }
        var fRows = [
          { t: 'Area = ½|x₁(y₂ − y₃) + x₂(y₃ − y₁) + x₃(y₁ − y₂)|', bold: true },
          { t: '= ½|' + par(A.x) + '(' + neg(B.y) + ' − ' + par(C.y) + ') + ' + par(B.x) + '(' + neg(C.y) + ' − ' + par(A.y) + ') + ' + par(C.x) + '(' + neg(A.y) + ' − ' + par(B.y) + ')|' },
          { t: '= ½|' + neg(A.x * (B.y - C.y)) + ' + ' + par(B.x * (C.y - A.y)) + ' + ' + par(C.x * (A.y - B.y)) + '| = ½ × ' + Math.abs(t) + ' = ' + area + ' sq units', bold: true, color: t === 0 ? c.danger : c.success }
        ];
        if (!rows.length) rows = [{ t: note || 'Area from the coordinates', bold: true, color: note ? c.warning : c.accent }];
        else if (t !== 0) rows.push({ t: '', size: 6, gap: 0.4 });
        rows = rows.concat(fRows);
        if (!strip) strip = 'Area = ½|' + t + '| = ' + area + ' sq units' + (bp ? ' = box ' + bp.box2 / 2 + ' − ' + half(bp.box2 - Math.abs(t)) : '');
      }
      pointsDraw(ctx, c, L, cols, sel(sim));

      var pn = L.panel;
      if (pn.strip) rows = [{ t: strip, bold: true, color: c.ink }];
      else D.roundRect(ctx, pn.x, pn.y, pn.w, pn.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.12));
      textLines(ctx, c, { x: pn.x + 6, y: pn.y + 4, w: pn.w - 12, h: pn.h - 8 }, rows);
    }
  });
})();
