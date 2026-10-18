/* =====================================================================
   Mensuration · Area of a Trapezium — sim.js
   ---------------------------------------------------------------------
   Model in cm, y up. Trapezium: bottom (0,0)–(a,0), top (o,h)–(o+b,h),
   o = how far the top side is shifted to the right (0 = right trapezium).
   turn  — a copy turned through 180° about its centre slides next to
           the original. Copy point = T − p with T = (a + b + o, h), so
           the two make a parallelogram of base a + b and height h:
           trapezium = ½ (a + b) h.
   cut   — diagonal from (0,0) to (o+b,h): triangles ½ a h and ½ b h.
   quad  — 4 draggable corners on a 1 cm grid. A diagonal that lies
           inside splits it into two triangles: ½ d (h₁ + h₂), with
           h₁, h₂ the perpendiculars from the other two corners.
           Checked with the shoelace formula on the coordinates.
   field — the trapezium as a plan of a farm field, 1 cm = 10 m.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var DUR = 2000, an = { from: 0, to: 0, t0: -1e9 };
  var Q = [{ x: 1, y: 4 }, { x: 6, y: 1 }, { x: 11, y: 4 }, { x: 4, y: 8 }], NAMES = ['A', 'B', 'C', 'D'];
  var diag = 0, drag = -1, fr = null;      // diag 0 = AC, 1 = BD

  function kNow() { var u = M.clamp((performance.now() - an.t0) / DUR, 0, 1); return an.from + (an.to - an.from) * u; }
  function ease(u) { u = M.clamp(u, 0, 1); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function toggle() { an.from = kNow(); an.to = an.to > 0.5 ? 0 : 1; an.t0 = performance.now(); }
  function nf(v) { return Math.abs(v - Math.round(v)) < 0.005 ? String(Math.round(v)) : M.fmt(v, Math.abs(v * 10 - Math.round(v * 10)) < 0.05 ? 1 : 2); }
  function font(ctx, s, w) { ctx.font = (w || 700) + ' ' + s + 'px Inter, system-ui, sans-serif'; }
  function fitSize(ctx, txt, max, s, w) { font(ctx, s, w); while (s > 8.5 && ctx.measureText(txt).width > max) { s -= 0.5; font(ctx, s, w); } return s; }
  function headline(ctx, W, txt, bg, narrow, c) {
    var hs = fitSize(ctx, txt, W - 24, narrow ? 12 : 14);
    D.text(ctx, txt, W / 2, 14, { color: c.bg, bg: bg, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
  }
  function lines(ctx, W, H, arr, c, narrow) {
    var n = arr.length, lh = narrow ? 18 : 20;
    arr.forEach(function (l, i) {
      var s = fitSize(ctx, l[0], W - 16, narrow ? 12 : 14, 600);
      D.text(ctx, l[0], W / 2, H - 12 - (n - 1 - i) * lh, { color: l[1] || c.ink, size: s, weight: 600, align: 'center' });
    });
  }
  function poly(ctx, pts, fill, stroke, lw, dash) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.save(); if (dash) ctx.setLineDash(dash); ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); }
  }
  // fit a box of model cm into the canvas between top and bottom margins
  function frame(x0, x1, y0, y1, W, H, top, bottom, side) {
    var u = Math.min((W - 2 * side) / (x1 - x0), (H - top - bottom) / (y1 - y0));
    var ox = (W - (x1 - x0) * u) / 2 - x0 * u, oy = top + (H - top - bottom - (y1 - y0) * u) / 2 + y1 * u;
    return { u: u, S: function (x, y) { return { x: ox + x * u, y: oy - y * u }; }, inv: function (px, py) { return { x: (px - ox) / u, y: (oy - py) / u }; } };
  }
  function paper(ctx, f, W, H, c) {
    if (f.u < 6) return;
    var o = f.S(0, 0), s = f.u;
    ctx.save(); ctx.strokeStyle = D.alpha(c.ink, c.light ? 0.08 : 0.07); ctx.lineWidth = 1; ctx.beginPath();
    for (var x = o.x - Math.floor(o.x / s) * s; x < W; x += s) { ctx.moveTo(Math.round(x) + 0.5, 30); ctx.lineTo(Math.round(x) + 0.5, H); }
    for (var y = o.y - Math.floor((o.y - 30) / s) * s; y < H; y += s) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(W, Math.round(y) + 0.5); }
    ctx.stroke(); ctx.restore();
  }
  function tag(ctx, t, P, col, c, fs, W, al) { D.text(ctx, t, P.x, P.y, { color: col, size: fs, weight: 700, align: al || 'center', bg: D.alpha(c.bg, 0.85), pad: 2, fit: W }); }
  function rightMark(ctx, F, dx, dy, nx, ny, col) {   // small square at F along unit d and n (screen)
    var m = 7;
    ctx.beginPath(); ctx.moveTo(F.x + dx * m, F.y + dy * m); ctx.lineTo(F.x + dx * m + nx * m, F.y + dy * m + ny * m); ctx.lineTo(F.x + nx * m, F.y + ny * m);
    ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.stroke();
  }
  // where to draw the height: inside both parallel sides if they overlap
  function heightX(p) { if (p.offset > 0.3 && p.offset < p.a) return p.offset; var l = Math.max(0, p.offset), r = Math.min(p.a, p.offset + p.b); return l < r ? (l + r) / 2 : p.offset; }
  function slants(p) { return [Math.hypot(p.offset, p.h), Math.hypot(p.a - p.offset - p.b, p.h)]; }
  function trap(p) { return [{ x: 0, y: 0 }, { x: p.a, y: 0 }, { x: p.offset + p.b, y: p.h }, { x: p.offset, y: p.h }]; }

  /* ---------- quadrilateral geometry ---------- */
  function cross(o, a, b) { return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
  function segX(p1, p2, p3, p4) { var d1 = cross(p3, p4, p1), d2 = cross(p3, p4, p2), d3 = cross(p1, p2, p3), d4 = cross(p1, p2, p4); return d1 * d2 < 0 && d3 * d4 < 0; }
  function quadInfo() {
    var sh = 0, per = 0;
    for (var i = 0; i < 4; i++) { var P = Q[i], N = Q[(i + 1) % 4]; sh += P.x * N.y - N.x * P.y; per += Math.hypot(N.x - P.x, N.y - P.y); }
    var crossed = segX(Q[0], Q[1], Q[2], Q[3]) || segX(Q[1], Q[2], Q[3], Q[0]);
    var i0 = diag, X = Q[i0], Y = Q[i0 + 2], P1 = Q[i0 + 1], P2 = Q[(i0 + 3) % 4], d = Math.hypot(Y.x - X.x, Y.y - X.y) || 1e-9;
    var s1 = cross(X, Y, P1), s2 = cross(X, Y, P2), h1 = Math.abs(s1) / d, h2 = Math.abs(s2) / d;
    var convex = [0, 1, 2, 3].every(function (k) { var v = cross(Q[k], Q[(k + 1) % 4], Q[(k + 2) % 4]); return v * sh >= 0; });
    return { area: Math.abs(sh) / 2, per: per, crossed: crossed, inside: s1 * s2 < 0, d: d, h1: h1, h2: h2, convex: convex, X: X, Y: Y, P1: P1, P2: P2,
      dn: NAMES[i0] + NAMES[i0 + 2], n1: NAMES[i0 + 1], n2: NAMES[(i0 + 3) % 4] };
  }
  function foot(P, X, Y) { var dx = Y.x - X.x, dy = Y.y - X.y, t = ((P.x - X.x) * dx + (P.y - X.y) * dy) / (dx * dx + dy * dy || 1); return { x: X.x + t * dx, y: X.y + t * dy, t: t }; }

  /* ---------- drawing per mode ---------- */
  function drawTurn(sim, field) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 11 : 13;
    var e = ease(kNow()), a = p.a, b = p.b, h = p.h, o = p.offset, sc = field ? 10 : 1, un = field ? ' m' : ' cm';
    var x1 = field ? Math.max(a, o + b) : a + b + o;
    var f = frame(Math.min(0, o), x1, 0, h, W, H, narrow ? 52 : 58, narrow ? 76 : 84, narrow ? 14 : 26); fr = f;
    paper(ctx, f, W, H, c);
    var T = trap(p), S = function (q) { return f.S(q.x, q.y); }, TP = T.map(S);
    var col = field ? '#22c55e' : c.s1;
    poly(ctx, TP, D.alpha(col, field ? 0.25 : 0.3), col, 2.5);
    if (field) {          // crop rows and a fence
      ctx.save(); poly(ctx, TP); ctx.clip(); ctx.strokeStyle = D.alpha('#16a34a', 0.45); ctx.lineWidth = 2;
      var top = TP[3].y, bot = TP[0].y, L = Math.min(TP[0].x, TP[3].x), R = Math.max(TP[1].x, TP[2].x);
      for (var yy = top + 6; yy < bot; yy += Math.max(6, f.u * 0.5)) { ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(R, yy); ctx.stroke(); }
      ctx.restore();
      poly(ctx, TP, null, '#a16207', 3, [8, 4]);
      if (e > 0.02) {     // diagonal splits the field into two triangles
        var dg = S({ x: o + b, y: h });
        ctx.save(); ctx.globalAlpha = e; D.line(ctx, TP[0].x, TP[0].y, dg.x, dg.y, c.warning, 2.5, [6, 4]);
        var g1 = S({ x: (a + o + b) / 3, y: h / 3 }), g2 = S({ x: (2 * o + b) / 3, y: 2 * h / 3 });
        tag(ctx, '½×' + a * sc + '×' + h * sc + ' = ' + nf(a * h * sc * sc / 2) + ' m²', g1, c.ink, c, fs - 1, W);
        tag(ctx, '½×' + b * sc + '×' + h * sc + ' = ' + nf(b * h * sc * sc / 2) + ' m²', g2, c.ink, c, fs - 1, W);
        ctx.restore();
      }
    }
    // copy turned through 180°
    if (!field && e > 0.01) {
      var c0 = { x: (T[0].x + T[1].x + T[2].x + T[3].x) / 4, y: h / 2 }, Tt = { x: a + b + o, y: h }, cf = { x: Tt.x - c0.x, y: Tt.y - c0.y };
      var th = Math.PI * e, cs = Math.cos(th), sn = Math.sin(th), lift = Math.sin(Math.PI * e) * h * 0.35;
      var CP = T.map(function (q) {
        var dx = q.x - c0.x, dy = q.y - c0.y;
        return S({ x: c0.x + dx * cs - dy * sn + (cf.x - c0.x) * e, y: c0.y + dx * sn + dy * cs + (cf.y - c0.y) * e + lift });
      });
      poly(ctx, CP, D.alpha(c.s2, 0.3 * Math.min(1, e * 5)), D.alpha(c.s2, Math.min(1, e * 5)), 2.5, e > 0.99 ? null : [6, 4]);
      if (e > 0.98) {
        var bb = S({ x: a + b / 2, y: 0 }); bb.y += 14; tag(ctx, 'b', bb, c.s2, c, fs, W);
        var aa = S({ x: o + b + a / 2, y: h }); aa.y -= 14; tag(ctx, 'a', aa, c.s2, c, fs, W);
        var B0 = S({ x: 0, y: 0 }), B1 = S({ x: a + b, y: 0 }), by = B0.y + 32;
        D.line(ctx, B0.x, by, B1.x, by, c.ink, 1.5); D.line(ctx, B0.x, by - 5, B0.x, by + 5, c.ink, 1.5); D.line(ctx, B1.x, by - 5, B1.x, by + 5, c.ink, 1.5);
        tag(ctx, 'a + b = ' + (a + b) + un, { x: (B0.x + B1.x) / 2, y: by }, c.ink, c, fs, W);
      }
    }
    // side and height labels of the original
    var hx = heightX(p), H0 = S({ x: hx, y: 0 }), H1 = S({ x: hx, y: h });
    if (o > a) D.line(ctx, TP[1].x, TP[1].y, H0.x, H0.y, D.alpha(c.ink, 0.5), 1.5, [4, 4]);
    D.line(ctx, H1.x, H1.y, H0.x, H0.y, c.warning, 2, [5, 4]);
    rightMark(ctx, H0, 1, 0, 0, -1, c.warning);
    tag(ctx, 'h = ' + h * sc + un, { x: H0.x + 6, y: (H0.y + H1.y) / 2 }, c.warning, c, fs, W, 'left');
    var labA = (field ? '' : 'a = ') + a * sc + un, labB = (field ? '' : 'b = ') + b * sc + un;
    var ba = S({ x: a / 2, y: 0 }); ba.y += 14;
    tag(ctx, e > 0.98 && !field ? 'a' : labA, ba, col, c, fs, W);
    var tb = S({ x: o + b / 2, y: h }); tb.y -= 14;
    tag(ctx, e > 0.98 && !field ? 'b' : labB, tb, col, c, fs, W);
    var A2 = (a + b) * h / 2;
    if (field) {
      var ar = A2 * 100;
      headline(ctx, W, e > 0.5 ? 'A diagonal path splits the field into two triangles' : 'Plan of a field, 1 cm = 10 m (tap for the diagonal)', '#22c55e', narrow, c);
      lines(ctx, W, H, [['Area = ½ × (' + a * 10 + ' + ' + b * 10 + ') × ' + h * 10 + ' = ' + nf(ar) + ' m²'],
        ['= ' + M.fmt(ar / 10000, 2) + ' hectare (1 ha = 10 000 m²) ≈ ' + M.fmt(ar / 4046.86, 2) + ' acre', c.success]], c, narrow);
    } else {
      headline(ctx, W, e < 0.5 ? 'Copy the trapezium and turn it round' + (narrow ? '' : ' (tap the picture)') : 'Two copies make a parallelogram: base a + b, height h', e < 0.5 ? c.s1 : c.s2, narrow, c);
      lines(ctx, W, H, e < 0.5 ? [['Area of trapezium = ½ × (a + b) × h'], ['= ½ × (' + a + ' + ' + b + ') × ' + h + ' = ' + nf(A2) + ' cm²', c.success]]
        : [['Parallelogram = (a + b) × h = ' + (a + b) + ' × ' + h + ' = ' + (a + b) * h + ' cm²'], ['Trapezium = half of it = ' + nf(A2) + ' cm²', c.success]], c, narrow);
    }
  }

  function drawCut(sim) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 11 : 13;
    var e = ease(kNow()), a = p.a, b = p.b, h = p.h, o = p.offset, gap = 0.9 * e;
    var f = frame(Math.min(0, o), Math.max(a, o + b), -gap, h + gap, W, H, narrow ? 52 : 58, narrow ? 64 : 70, narrow ? 18 : 30); fr = f;
    paper(ctx, f, W, H, c);
    var t1 = [{ x: 0, y: -gap }, { x: a, y: -gap }, { x: o + b, y: h - gap }], t2 = [{ x: 0, y: gap }, { x: o + b, y: h + gap }, { x: o, y: h + gap }];
    var P1 = t1.map(function (q) { return f.S(q.x, q.y); }), P2 = t2.map(function (q) { return f.S(q.x, q.y); });
    poly(ctx, P1, D.alpha(c.warning, 0.3), c.warning, 2.5);
    poly(ctx, P2, D.alpha(c.s1, 0.3), c.s1, 2.5);
    // heights: apex of triangle 1 down to the bottom line, apex of triangle 2 up to the top line
    var A1 = P1[2], F1 = f.S(o + b, -gap), A2 = P2[0], F2 = f.S(0, h + gap);
    if (o + b > a) D.line(ctx, P1[1].x, P1[1].y, F1.x, F1.y, D.alpha(c.warning, 0.6), 1.5, [4, 4]);
    if (o > 0) D.line(ctx, P2[2].x, P2[2].y, F2.x, F2.y, D.alpha(c.s1, 0.6), 1.5, [4, 4]);
    D.line(ctx, A1.x, A1.y, F1.x, F1.y, c.warning, 1.8, [5, 4]); rightMark(ctx, F1, -1, 0, 0, -1, c.warning);
    D.line(ctx, A2.x, A2.y, F2.x, F2.y, c.s1, 1.8, [5, 4]); rightMark(ctx, F2, 1, 0, 0, 1, c.s1);
    tag(ctx, 'h', { x: (A1.x + F1.x) / 2 + 9, y: (A1.y + F1.y) / 2 }, c.warning, c, fs, W);
    tag(ctx, 'h', { x: A2.x - 10, y: (A2.y + F2.y) / 2 }, c.s1, c, fs, W);
    tag(ctx, 'a = ' + a + ' cm', { x: (P1[0].x + P1[1].x) / 2, y: P1[0].y + 14 }, c.warning, c, fs, W);
    tag(ctx, 'b = ' + b + ' cm', { x: (P2[1].x + P2[2].x) / 2, y: P2[1].y - 14 }, c.s1, c, fs, W);
    var g1 = f.S((a + o + b) / 3, (2 * -gap + h - gap) / 3 + h * 0.02), g2 = f.S((2 * o + b) / 3, (gap + 2 * (h + gap)) / 3);
    tag(ctx, '½×' + a + '×' + h + ' = ' + nf(a * h / 2), g1, c.ink, c, fs - 1, W);
    tag(ctx, '½×' + b + '×' + h + ' = ' + nf(b * h / 2), g2, c.ink, c, fs - 1, W);
    headline(ctx, W, 'A diagonal cuts it into two triangles of height h' + (narrow ? '' : ' (tap to pull apart)'), c.warning, narrow, c);
    lines(ctx, W, H, [['½ × a × h + ½ × b × h = ½ × (a + b) × h'], [nf(a * h / 2) + ' + ' + nf(b * h / 2) + ' = ' + nf((a + b) * h / 2) + ' cm²', c.success]], c, narrow);
  }

  function drawQuad(sim) {
    var ctx = sim.ctx, c = sim.colors, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 11 : 13;
    var f = frame(-0.4, 12.4, -0.4, 9.4, W, H, narrow ? 36 : 40, narrow ? 50 : 56, 10); fr = f;
    var o = f.S(0, 0), e = f.S(12, 9);
    ctx.save(); ctx.strokeStyle = D.alpha(c.ink, c.light ? 0.1 : 0.09); ctx.lineWidth = 1; ctx.beginPath();
    for (var i = 0; i <= 12; i++) { var x = Math.round(o.x + i * f.u) + 0.5; ctx.moveTo(x, o.y); ctx.lineTo(x, e.y); }
    for (var j = 0; j <= 9; j++) { var y = Math.round(o.y - j * f.u) + 0.5; ctx.moveTo(o.x, y); ctx.lineTo(e.x, y); }
    ctx.stroke(); ctx.restore();
    var qi = quadInfo(), S = function (q) { return f.S(q.x, q.y); }, P = Q.map(S);
    if (!qi.crossed && qi.inside) {
      poly(ctx, [S(qi.X), S(qi.P1), S(qi.Y)], D.alpha(c.s1, 0.3));
      poly(ctx, [S(qi.X), S(qi.Y), S(qi.P2)], D.alpha(c.warning, 0.3));
    } else poly(ctx, P, D.alpha(c.danger, 0.15));
    poly(ctx, P, null, c.ink, 2.5);
    var X = S(qi.X), Y = S(qi.Y);
    D.line(ctx, X.x, X.y, Y.x, Y.y, c.s2, 2.5, qi.inside ? null : [6, 4]);
    if (!qi.crossed) {
      [[qi.P1, qi.h1, c.s1, '₁'], [qi.P2, qi.h2, c.warning, '₂']].forEach(function (r) {
        var F = foot(r[0], qi.X, qi.Y), PF = S(F), PP = S(r[0]);
        if (F.t < 0 || F.t > 1) { var E = F.t < 0 ? X : Y; D.line(ctx, E.x, E.y, PF.x, PF.y, D.alpha(c.s2, 0.6), 1.5, [3, 4]); }
        if (r[1] < 0.05) return;
        D.line(ctx, PP.x, PP.y, PF.x, PF.y, r[2], 2, [5, 4]);
        var dl = Math.hypot(Y.x - X.x, Y.y - X.y) || 1, nl = Math.hypot(PP.x - PF.x, PP.y - PF.y) || 1;
        rightMark(ctx, PF, (Y.x - X.x) / dl, (Y.y - X.y) / dl, (PP.x - PF.x) / nl, (PP.y - PF.y) / nl, r[2]);
        tag(ctx, 'h' + r[3] + ' = ' + nf(r[1]), { x: (PP.x + PF.x) / 2 + 10, y: (PP.y + PF.y) / 2 }, r[2], c, fs - 1, W, 'left');
      });
    }
    tag(ctx, 'd = ' + nf(qi.d), { x: (X.x + Y.x) / 2, y: (X.y + Y.y) / 2 - 12 }, c.s2, c, fs - 1, W);
    P.forEach(function (q, k) {
      D.circle(ctx, q.x, q.y, drag === k ? 10 : 8, D.alpha(c.ink, 0.15), c.ink, 2);
      var cx = (P[0].x + P[1].x + P[2].x + P[3].x) / 4, cy = (P[0].y + P[1].y + P[2].y + P[3].y) / 4, dx = q.x - cx, dy = q.y - cy, l = Math.hypot(dx, dy) || 1;
      D.text(ctx, NAMES[k], q.x + dx / l * 20, q.y + dy / l * 20, { color: c.ink, size: fs + 1, weight: 800, align: 'center', fit: W });
    });
    if (qi.crossed) {
      headline(ctx, W, 'Two sides cross: this is not a quadrilateral. Drag a corner back.', c.danger, narrow, c);
      lines(ctx, W, H, [['Drag the corners A, B, C, D'], ['A quadrilateral\'s sides must not cross', c.danger]], c, narrow);
    } else if (!qi.inside) {
      headline(ctx, W, 'Diagonal ' + qi.dn + ' lies outside the shape. Use the other diagonal.', c.danger, narrow, c);
      lines(ctx, W, H, [['It does not split the shape into two triangles'], ['Area (from the corners) = ' + nf(qi.area) + ' cm²', c.success]], c, narrow);
    } else {
      headline(ctx, W, 'Diagonal ' + qi.dn + ' splits it into two triangles' + (qi.convex ? '' : ' (concave shape)'), c.s2, narrow, c);
      lines(ctx, W, H, [['Area = ½ × d × (h₁ + h₂) = ½ × ' + nf(qi.d) + ' × (' + nf(qi.h1) + ' + ' + nf(qi.h2) + ')'],
        ['= ' + nf(qi.d * (qi.h1 + qi.h2) / 2) + ' cm²   (check from the corners: ' + nf(qi.area) + ' cm²)', c.success]], c, narrow);
    }
  }

  SimLab.createSim({
    ariaLabel: 'A trapezium on centimetre squared paper. A turned-round copy slides next to it to make a parallelogram, or a diagonal cuts it into two triangles; a general quadrilateral with draggable corners and a diagonal with two perpendicular heights; and the plan of a trapezium-shaped farm field',
    transport: false,
    mobileAspect: '3 / 3.4',
    params: [
      { id: 'mode', label: 'Show', type: 'select', value: 'turn', options: [
        { value: 'turn', label: 'Trapezium: copy and turn' },
        { value: 'cut', label: 'Trapezium: cut into two triangles' },
        { value: 'quad', label: 'Any quadrilateral (drag the corners)' },
        { value: 'field', label: 'A field shaped like a trapezium' }] },
      { id: 'a', label: 'Bottom side a', min: 2, max: 14, step: 1, value: 8, unit: 'cm', presets: [6, 8, 12], help: 'In the field view, 1 cm on the plan = 10 m.' },
      { id: 'b', label: 'Top side b (parallel to a)', min: 1, max: 14, step: 1, value: 4, unit: 'cm', presets: [4, 8] },
      { id: 'h', label: 'Height h (distance between a and b)', min: 1, max: 8, step: 1, value: 4, unit: 'cm', presets: [3, 4, 5] },
      { id: 'offset', label: 'Shift of the top side', min: 0, max: 8, step: 1, value: 2, unit: 'cm', presets: [0, 2], help: '0 gives a right trapezium. The area does not change.' }
    ],
    buttons: [{ label: 'Show the trick', primary: true, onClick: function (sim) {
      if (sim.p.mode === 'quad') sim.setParam('mode', 'turn', true);
      toggle();
    } }, { label: 'Swap the diagonal', onClick: function (sim) {
      if (sim.p.mode !== 'quad') sim.setParam('mode', 'quad', true); else diag = 1 - diag;
    } }],
    readouts: [
      { id: 'area', label: 'Area', key: true },
      { id: 'work', label: 'Worked out', key: true, short: 'Working' },
      { id: 'len', label: 'Lengths' },
      { id: 'hts', label: 'Heights' },
      { id: 'per', label: 'Perimeter' },
      { id: 'chk', label: 'Check' }
    ],
    reset: function () {},
    onParam: function (sim, id, v) {
      if (id === 'mode') {
        an.from = an.to = 0; an.t0 = -1e9;
        if (v === 'field') { sim.setParam('a', 12); sim.setParam('b', 8); sim.setParam('h', 5); sim.setParam('offset', 2); }
      } else if (sim.p.mode === 'quad') sim.setParam('mode', 'turn');
      return true;
    },
    animate: function () { return performance.now() - an.t0 < DUR + 50; },
    readout: function (sim) {
      var p = sim.p;
      if (p.mode === 'quad') {
        var q = quadInfo();
        if (q.crossed) return { area: '—', work: 'sides cross', len: '—', hts: '—', per: '—', chk: 'not a quadrilateral' };
        return {
          area: nf(q.area) + ' cm²',
          work: q.inside ? '½ × ' + nf(q.d) + ' × (' + nf(q.h1) + ' + ' + nf(q.h2) + ')' : q.dn + ' is outside',
          len: 'diagonal ' + q.dn + ' = ' + nf(q.d) + ' cm',
          hts: 'h₁ = ' + nf(q.h1) + ' cm (from ' + q.n1 + '), h₂ = ' + nf(q.h2) + ' cm (from ' + q.n2 + ')',
          per: nf(q.per) + ' cm',
          chk: 'from the corners: ' + nf(q.area) + ' cm²' + (q.convex ? '' : ', concave')
        };
      }
      var f = p.mode === 'field', s = f ? 10 : 1, u = f ? ' m' : ' cm', A = (p.a + p.b) * p.h / 2 * s * s, sl = slants(p);
      return {
        area: nf(A) + u + '²' + (f ? ' = ' + M.fmt(A / 10000, 2) + ' ha' : ''),
        work: '½ × (' + p.a * s + ' + ' + p.b * s + ') × ' + p.h * s,
        len: 'a = ' + p.a * s + u + ', b = ' + p.b * s + u + (p.a === p.b ? ' (a parallelogram)' : ''),
        hts: 'h = ' + p.h * s + u,
        per: nf((p.a + p.b + sl[0] + sl[1]) * s) + u + (f ? ' of fence' : ''),
        chk: p.mode === 'turn' ? 'parallelogram ' + (p.a + p.b) + ' × ' + p.h + ' = ' + (p.a + p.b) * p.h + ' cm², half = ' + nf(A) + ' cm²'
          : 'triangles ' + nf(p.a * p.h / 2 * s * s) + ' + ' + nf(p.b * p.h / 2 * s * s) + ' = ' + nf(A) + u + '²'
      };
    },
    status: function (sim) {
      var p = sim.p;
      if (p.mode === 'quad') { var q = quadInfo(); return q.crossed ? 'Sides cross' : 'Area ' + nf(q.area) + ' cm²'; }
      return 'Area = ½ × (' + p.a + ' + ' + p.b + ') × ' + p.h + ' = ' + nf((p.a + p.b) * p.h / 2) + (p.mode === 'field' ? ' cm² on the plan' : ' cm²');
    },
    pointer: {
      down: function (sim, x, y) {
        if (sim.p.mode !== 'quad') { toggle(); return false; }
        if (!fr) return false;
        var best = -1, bd = 26;
        Q.forEach(function (q, k) { var s = fr.S(q.x, q.y), d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = k; } });
        drag = best; return best >= 0;
      },
      move: function (sim, x, y) {
        if (drag < 0 || !fr) return;
        var m = fr.inv(x, y);
        Q[drag] = { x: M.clamp(Math.round(m.x), 0, 12), y: M.clamp(Math.round(m.y), 0, 9) };
      },
      up: function () { drag = -1; },
      hover: function (sim, x, y) {
        if (sim.p.mode !== 'quad') return true;
        return !!fr && Q.some(function (q) { var s = fr.S(q.x, q.y); return Math.hypot(s.x - x, s.y - y) < 26; });
      }
    },
    draw: function (sim) {
      D.clear(sim.ctx, sim.width, sim.height, sim.colors.bg);
      var m = sim.p.mode;
      if (m === 'quad') drawQuad(sim); else if (m === 'cut') drawCut(sim); else drawTurn(sim, m === 'field');
    }
  });
})();
