/* =====================================================================
   Mensuration · Surface Area from Nets — sim.js
   ---------------------------------------------------------------------
   A solid is drawn in 3-D and unfolds into its flat net (tap the
   picture or press the button; k goes 0 → 1 over DUR ms).
   Cuboid / cube / room: real 3-D faces hinged on the base. Face
   corners are base + U·u + V·v; the side faces turn by φ = 90°·k₂
   about their bottom edges, and the top turns with the back face
   plus its own hinge (angle β − 90°(1 − ψ)). An orthographic camera
   swings from an oblique view (elevation 29°) to straight down.
   Cylinder / tank: the curved surface is cut along the back and
   unrolled by bending it round a growing radius R = r / (1 − t), so
   its length stays 2πr while it flattens into a 2πr × h rectangle;
   the two circles swing out above and below it.
     cuboid  TSA = 2(lb + bh + hl), lateral = 2h(l + b), no lid: −lb
     cube    TSA = 6a², no lid 5a²
     cylinder TSA = 2πrh + 2πr², no lid 2πrh + πr²
     room    paint = 2h(l + b) + lb − doors (1 m × 2 m) − windows
             (1.2 m × 1.2 m); 2 coats, 1 L covers about 10 m² a coat
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var DUR = 2600, rk = { from: 0, to: 0, t0: -1e9 };
  var DOOR = 2, WIN = 1.44, COVER = 10;

  function cl01(v) { return M.clamp(v, 0, 1); }
  function ease(u) { u = cl01(u); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function kNow() { var u = cl01((performance.now() - rk.t0) / DUR); return rk.from + (rk.to - rk.from) * ease(u); }
  function toggle() { rk.from = kNow(); rk.to = rk.to > 0.5 ? 0 : 1; rk.t0 = performance.now(); }
  function n2(v) { return String(parseFloat(v.toFixed(2))); }
  function n1(v) { return M.fmt(v, 1); }
  function rupees(v) { return '₹' + Math.round(v).toLocaleString('en-IN'); }

  function dims(p) {
    switch (p.shape) {
      case 'cube': return { box: true, l: p.a, b: p.a, h: p.a, u: 'cm', lid: p.lid, cube: true };
      case 'cylinder': return { box: false, r: p.r, h: p.h, u: 'cm', lid: p.lid };
      case 'tank': return { box: false, r: p.tr, h: p.th, u: 'm', lid: p.lid, tank: true };
      case 'room': return { box: true, l: p.rl, b: p.rb, h: p.rh, u: 'm', lid: true, room: true };
      default: return { box: true, l: p.l, b: p.b, h: p.h, u: 'cm', lid: p.lid };
    }
  }
  function areas(p) {
    var d = dims(p), o = { d: d };
    if (d.box) {
      var lb = d.l * d.b, bh = d.b * d.h, hl = d.h * d.l;
      o.lb = lb; o.bh = bh; o.hl = hl; o.lat = 2 * d.h * (d.l + d.b);
      if (d.room) {
        o.holes = p.doors * DOOR + p.windows * WIN;
        o.total = o.lat + lb - o.holes;
        o.litres = 2 * o.total / COVER; o.cost = o.total * p.rate;
      } else o.total = 2 * (lb + bh + hl) - (d.lid ? 0 : lb);
    } else {
      o.curved = 2 * Math.PI * d.r * d.h; o.circle = Math.PI * d.r * d.r; o.lat = o.curved;
      o.total = o.curved + (d.lid ? 2 : 1) * o.circle;
      if (d.tank) o.cost = o.total * p.rate;
    }
    return o;
  }
  function working(o) {
    var d = o.d, u = ' ' + d.u + '²';
    if (d.room) return 'walls 2h(l + b) + ceiling lb − doors − windows = ' + n2(o.lat) + ' + ' + n2(o.lb) + ' − ' + n2(o.holes) + ' = ' + n2(o.total) + u;
    if (d.cube) return (d.lid ? '6a² = 6 × ' : '5a² = 5 × ') + d.l + '² = ' + n2(o.total) + u;
    if (d.box) return d.lid ? '2(lb + bh + hl) = 2(' + n2(o.lb) + ' + ' + n2(o.bh) + ' + ' + n2(o.hl) + ') = ' + n2(o.total) + u
      : 'lb + 2(bh + hl) = ' + n2(o.lb) + ' + 2(' + n2(o.bh) + ' + ' + n2(o.hl) + ') = ' + n2(o.total) + u;
    var dg = d.tank ? 2 : 1, f = function (v) { return M.fmt(v, dg); };
    return (d.lid ? '2πrh + 2πr² = ' + f(o.curved) + ' + ' + f(2 * o.circle) : '2πrh + πr² = ' + f(o.curved) + ' + ' + f(o.circle)) + ' = ' + f(o.total) + u;
  }

  function showCtl(id, on) { var el = document.getElementById('ctl-' + id), box = el && el.closest('.control'); if (box) box.style.display = on ? '' : 'none'; }
  function syncControls(p) {
    var s = p.shape;
    showCtl('l', s === 'cuboid'); showCtl('b', s === 'cuboid'); showCtl('h', s === 'cuboid' || s === 'cylinder');
    showCtl('a', s === 'cube'); showCtl('r', s === 'cylinder'); showCtl('tr', s === 'tank'); showCtl('th', s === 'tank');
    showCtl('lid', s !== 'room');
    ['rl', 'rb', 'rh', 'doors', 'windows'].forEach(function (id) { showCtl(id, s === 'room'); });
    showCtl('rate', s === 'room' || s === 'tank');
  }

  /* ---------- 3-D box ---------- */
  function boxFaces(d, k) {
    var l = d.l, b = d.b, h = d.h;
    var psi = d.lid ? ease(k / 0.35) : 0, ph = Math.PI / 2 * ease((k - 0.3) / 0.7);
    var s = Math.sin(ph), c = Math.cos(ph), al = ph - Math.PI / 2 * (1 - psi);
    var F = [
      { id: 'base', O: [0, 0, 0], U: [1, 0, 0], V: [0, 1, 0], w: l, t: b, col: 's1' },
      { id: 'front', O: [0, 0, 0], U: [1, 0, 0], V: [0, -s, c], w: l, t: h, col: 's2' },
      { id: 'back', O: [0, b, 0], U: [1, 0, 0], V: [0, s, c], w: l, t: h, col: 's2' },
      { id: 'left', O: [0, 0, 0], U: [0, 1, 0], V: [-s, 0, c], w: b, t: h, col: 's4' },
      { id: 'right', O: [l, 0, 0], U: [0, 1, 0], V: [s, 0, c], w: b, t: h, col: 's4' }
    ];
    if (d.lid) F.push({ id: 'top', O: [0, b + h * s, h * c], U: [1, 0, 0], V: [0, Math.sin(al), Math.cos(al)], w: l, t: b, col: 's1' });
    return F;
  }
  function fpt(f, u, v) { return [f.O[0] + f.U[0] * u + f.V[0] * v, f.O[1] + f.U[1] * u + f.V[1] * v, f.O[2] + f.U[2] * u + f.V[2] * v]; }
  function cam(k, az1) { var e = ease((k - 0.25) / 0.75); return { az: M.lerp(az1 - 0.6, az1, e), el: M.lerp(0.5, Math.PI / 2, e) }; }
  function proj(P, cm) {
    var ca = Math.cos(cm.az), sa = Math.sin(cm.az), X = P[0] * ca - P[1] * sa, Y = P[0] * sa + P[1] * ca, Z = P[2];
    return { x: X, y: Z * Math.cos(cm.el) + Y * Math.sin(cm.el), d: Y * Math.cos(cm.el) - Z * Math.sin(cm.el) };
  }
  function boxBBox(d, k, az1) {
    var cm = cam(k, az1), bb = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
    boxFaces(d, k).forEach(function (f) {
      [[0, 0], [f.w, 0], [f.w, f.t], [0, f.t]].forEach(function (q) {
        var s = proj(fpt(f, q[0], q[1]), cm);
        bb.x0 = Math.min(bb.x0, s.x); bb.x1 = Math.max(bb.x1, s.x); bb.y0 = Math.min(bb.y0, s.y); bb.y1 = Math.max(bb.y1, s.y);
      });
    });
    return bb;
  }
  function fitScale(bb, aw, ah) { return Math.min(aw / (bb.x1 - bb.x0 || 1), ah / (bb.y1 - bb.y0 || 1)); }
  // the closed solid is drawn bigger than its net, and the scale shrinks smoothly as it opens
  function growScale(fitNow, fit0, scAll, k) { return Math.min(fitNow, M.lerp(Math.max(scAll, fit0 * 0.7), scAll, ease(k))); }

  // doors and windows on the room's walls, in face coordinates (u along the hinge, v up)
  function holes(f, d, p) {
    var out = [];
    if (f.id === 'front') {
      var n = p.doors;
      for (var i = 0; i < n; i++) { var cx = f.w * (i + 1) / (n + 1); out.push({ u0: cx - 0.5, u1: cx + 0.5, v0: 0, v1: 2, door: true }); }
    }
    var wins = { back: 1, left: 2, right: 3 }[f.id];
    if (wins && p.windows >= wins) out.push({ u0: f.w / 2 - 0.6, u1: f.w / 2 + 0.6, v0: 0.9, v1: 2.1 });
    return out;
  }

  function poly(ctx, pts, fill, stroke, lw) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
  }
  function solidFill(ctx, pts, c, col, a) { poly(ctx, pts, c.bg); poly(ctx, pts, D.alpha(col, a), D.alpha(c.ink, 0.75), 1.5); }

  function faceName(f, d) {
    if (d.room) return { base: 'Floor (not painted)', top: 'Ceiling', front: 'Wall', back: 'Wall', left: 'Wall', right: 'Wall' }[f.id];
    return { base: 'Bottom', top: 'Top', front: 'Front', back: 'Back', left: 'Left', right: 'Right' }[f.id];
  }

  function drawBox(sim, area) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, d = dims(p), k = kNow();
    var top = area.top, aw = W - 20, ah = H - top - 10;
    // pick the net's direction (strip up the screen or across it) that lets it be drawn bigger
    var az1 = fitScale(boxBBox(d, 1, Math.PI / 2), aw, ah) > fitScale(boxBBox(d, 1, 0), aw, ah) * 1.02 ? Math.PI / 2 : 0;
    var scAll = 1e9;
    [0, 0.3, 0.55, 0.8, 1].forEach(function (kk) { scAll = Math.min(scAll, fitScale(boxBBox(d, kk, az1), aw, ah)); });
    var bb = boxBBox(d, k, az1), cm = cam(k, az1), sc = growScale(fitScale(bb, aw, ah), fitScale(boxBBox(d, 0, az1), aw, ah), scAll, k);
    var ox = W / 2 - (bb.x0 + bb.x1) / 2 * sc, oy = top + ah / 2 + (bb.y0 + bb.y1) / 2 * sc;
    function S(P) { var q = proj(P, cm); return { x: ox + q.x * sc, y: oy - q.y * sc, d: q.d }; }
    var faces = boxFaces(d, k).map(function (f) {
      var pts = [[0, 0], [f.w, 0], [f.w, f.t], [0, f.t]].map(function (q) { return S(fpt(f, q[0], q[1])); });
      return { f: f, pts: pts, depth: (pts[0].d + pts[1].d + pts[2].d + pts[3].d) / 4 };
    });
    faces.sort(function (A, B) { return B.depth - A.depth; });
    var flat = k > 0.92, narrow = W < 560, u = d.u;
    faces.forEach(function (F) {
      var f = F.f, col = d.room && f.id === 'base' ? c.muted : c[f.col];
      solidFill(ctx, F.pts, c, col, d.room && f.id === 'base' ? 0.18 : 0.42);
      if (d.room) holes(f, d, p).forEach(function (hh) {
        var q = [[hh.u0, hh.v0], [hh.u1, hh.v0], [hh.u1, hh.v1], [hh.u0, hh.v1]].map(function (z) { return S(fpt(f, z[0], z[1])); });
        poly(ctx, q, hh.door ? (c.light ? '#b45309' : '#92400e') : (c.light ? '#bae6fd' : '#0c4a6e'), c.ink, 1.2);
      });
      if (flat) {
        var wall = d.room && f.id !== 'base' && f.id !== 'top', vUp = Math.abs(F.pts[3].y - F.pts[0].y) > Math.abs(F.pts[3].x - F.pts[0].x);
        // a wall's label goes where no door or window is: near its top edge, or near one end when the wall lies sideways
        var lp = wall ? S(vUp ? fpt(f, f.w / 2, f.t - 0.4) : fpt(f, f.w - 0.3, f.t / 2)) : null;
        var cx = wall ? lp.x : (F.pts[0].x + F.pts[2].x) / 2, cy = wall ? lp.y : (F.pts[0].y + F.pts[2].y) / 2;
        var fw = Math.abs(F.pts[1].x - F.pts[0].x) + Math.abs(F.pts[3].x - F.pts[0].x), fh = Math.abs(F.pts[1].y - F.pts[0].y) + Math.abs(F.pts[3].y - F.pts[0].y);
        var l1 = faceName(f, d), l2 = n2(f.w) + ' × ' + n2(f.t) + ' = ' + n2(f.w * f.t) + ' ' + u + '²';
        var fs = M.clamp(Math.min(fw / 7.5, fh / 3), 8, narrow ? 12 : 13.5);
        ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif';
        if (ctx.measureText(l2).width > fw - 6) l2 = n2(f.w * f.t) + ' ' + u + '²';
        if (ctx.measureText(l2).width > fw - 4) fs = Math.max(7, fs * (fw - 4) / ctx.measureText(l2).width);
        var two = fh > fs * 2.8 && ctx.measureText(l1).width < fw - 6;
        if (wall) { two = false; fs = Math.min(fs, 0.4 * sc * 1.6); }
        if (two) D.text(ctx, l1, cx, cy - fs * 0.65, { color: c.ink, size: fs * 0.9, weight: 600, align: 'center' });
        D.text(ctx, l2, cx, two ? cy + fs * 0.65 : cy, { color: c.ink, size: fs, weight: 700, align: 'center', bg: d.room ? D.alpha(c.bg, 0.75) : null, pad: 2 });
      }
    });
    if (k < 0.06) {     // edge lengths on the closed solid
      var cen = S([d.l / 2, d.b / 2, d.h / 2]), sideX = Math.sin(cm.az) < 0 ? d.l : 0;
      var lab = function (P1, P2, t) {
        var a = S(P1), b2 = S(P2), mx = (a.x + b2.x) / 2, my = (a.y + b2.y) / 2, ex = b2.x - a.x, ey = b2.y - a.y, el = Math.hypot(ex, ey) || 1;
        var nx = -ey / el, ny = ex / el;                       // perpendicular to the edge, pointing away from the solid
        if (nx * (mx - cen.x) + ny * (my - cen.y) < 0) { nx = -nx; ny = -ny; }
        var al = nx > 0.5 ? 'left' : nx < -0.5 ? 'right' : 'center';
        D.text(ctx, t, mx + nx * 8, my + ny * 8 + (al === 'center' ? ny * 6 : 0), { color: c.ink, size: narrow ? 11 : 13, weight: 700, align: al, bg: D.alpha(c.bg, 0.85), pad: 3, fit: W });
      };
      if (d.cube) lab([0, 0, 0], [d.l, 0, 0], 'a = ' + n2(d.l) + ' ' + u);
      else {
        lab([0, 0, 0], [d.l, 0, 0], 'l = ' + n2(d.l) + ' ' + u);
        lab([sideX, 0, 0], [sideX, d.b, 0], 'b = ' + n2(d.b) + ' ' + u);
        lab([sideX, 0, 0], [sideX, 0, d.h], 'h = ' + n2(d.h) + ' ' + u);
      }
    }
  }

  /* ---------- cylinder ---------- */
  function cylGeo(d, k) {
    var r = d.r, h = d.h, lu = ease(k / 0.35), tu = ease((k - 0.3) / 0.7), el = M.lerp(0.42, 0, tu);
    var se = Math.sin(el), ce = Math.cos(el), L = 2 * Math.PI * r, N = 72, R = r / (1 - tu), ring = [];
    for (var i = 0; i <= N; i++) {
      var sg = -L / 2 + L * i / N, th = tu > 0.999 ? 0 : sg / R;
      ring.push(tu > 0.999 ? { x: sg, d: 0, th: 0 } : { x: R * Math.sin(th), d: R * (1 - Math.cos(th)), th: th });
    }
    var g = { r: r, h: h, se: se, ce: ce, ring: ring, tu: tu, L: L,
      lidB: { y: M.lerp(r * se, -r, lu), ry: M.lerp(r * se, r, lu) },
      lidT: d.lid ? { y: M.lerp(h * ce + r * se, h * ce + r, lu), ry: M.lerp(r * se, r, lu) } : null };
    var bb = { x0: -r, x1: r, y0: g.lidB.y - g.lidB.ry, y1: h * ce };
    ring.forEach(function (q) { bb.x0 = Math.min(bb.x0, q.x); bb.x1 = Math.max(bb.x1, q.x); bb.y0 = Math.min(bb.y0, q.d * se); bb.y1 = Math.max(bb.y1, h * ce + q.d * se); });
    if (g.lidT) bb.y1 = Math.max(bb.y1, g.lidT.y + g.lidT.ry);
    g.bb = bb;
    return g;
  }
  function drawCyl(sim, area) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, d = dims(p), k = kNow(), narrow = W < 560;
    var top = area.top, aw = W - 20, ah = H - top - 10, scAll = 1e9;
    [0, 0.3, 0.55, 0.8, 1].forEach(function (kk) { scAll = Math.min(scAll, fitScale(cylGeo(d, kk).bb, aw, ah)); });
    var g = cylGeo(d, k), bb = g.bb, sc = growScale(fitScale(bb, aw, ah), fitScale(cylGeo(d, 0).bb, aw, ah), scAll, k), ox = W / 2 - (bb.x0 + bb.x1) / 2 * sc, oy = top + ah / 2 + (bb.y0 + bb.y1) / 2 * sc;
    function X(x) { return ox + x * sc; }
    function Y(y) { return oy - y * sc; }
    function lid(L) {
      ctx.beginPath(); ctx.ellipse(X(0), Y(L.y), g.r * sc, Math.max(0.5, L.ry * sc), 0, 0, Math.PI * 2);
      ctx.fillStyle = c.bg; ctx.fill(); ctx.fillStyle = D.alpha(c.s1, 0.42); ctx.fill(); ctx.strokeStyle = D.alpha(c.ink, 0.75); ctx.lineWidth = 1.5; ctx.stroke();
    }
    lid(g.lidB);
    var R = g.ring, strips = [];
    for (var i = 0; i < R.length - 1; i++) strips.push(i);
    strips.sort(function (a, b) { return (R[b].d + R[b + 1].d) - (R[a].d + R[a + 1].d); });
    strips.forEach(function (i) {
      var a = R[i], b = R[i + 1], cth = Math.cos((a.th + b.th) / 2);
      var pts = [{ x: X(a.x), y: Y(a.d * g.se) }, { x: X(b.x), y: Y(b.d * g.se) }, { x: X(b.x), y: Y(g.h * g.ce + b.d * g.se) }, { x: X(a.x), y: Y(g.h * g.ce + a.d * g.se) }];
      var fill = cth > 0 ? D.alpha(c.s2, 0.25 + 0.3 * cth) : D.alpha(c.s2, 0.15);
      poly(ctx, pts, c.bg); poly(ctx, pts, fill, fill, 0.8);
    });
    // outlines: top rim all round, bottom rim on the front half, the cut edges
    ctx.save(); ctx.strokeStyle = D.alpha(c.ink, 0.75); ctx.lineWidth = 1.5; ctx.beginPath();
    R.forEach(function (q, j) { var y = Y(g.h * g.ce + q.d * g.se); if (j) ctx.lineTo(X(q.x), y); else ctx.moveTo(X(q.x), y); });
    var started = false;
    R.forEach(function (q) { if (Math.cos(q.th) >= -0.02 || g.tu > 0.5) { var y = Y(q.d * g.se); if (started) ctx.lineTo(X(q.x), y); else { ctx.moveTo(X(q.x), y); started = true; } } else started = false; });
    if (g.tu > 0.01) [R[0], R[R.length - 1]].forEach(function (q) { ctx.moveTo(X(q.x), Y(q.d * g.se)); ctx.lineTo(X(q.x), Y(g.h * g.ce + q.d * g.se)); });
    else { ctx.moveTo(X(-g.r), Y(g.r * g.se)); ctx.lineTo(X(-g.r), Y(g.h * g.ce + g.r * g.se)); ctx.moveTo(X(g.r), Y(g.r * g.se)); ctx.lineTo(X(g.r), Y(g.h * g.ce + g.r * g.se)); }
    ctx.stroke(); ctx.restore();
    if (g.lidT) lid(g.lidT);

    var u = d.u, fs = narrow ? 11 : 13, o = areas(p), dg = d.tank ? 2 : 1;
    var tag = function (t, x, y, al, sz) { D.text(ctx, t, x, y, { color: c.ink, size: sz || fs, weight: 700, align: al || 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W }); };
    if (k > 0.92) {
      var rw = g.L * sc, rh = g.h * sc, lsz = M.clamp(Math.min(rw / 14, rh / 3.2), 8, fs);
      tag('2πrh = ' + M.fmt(o.curved, dg) + ' ' + u + '²', X(-g.L / 4), Y(g.h / 2), 'center', lsz);
      tag('2πr = ' + M.fmt(g.L, dg) + ' ' + u, X(g.L / 4), Y(g.h * 0.5), 'center', lsz);
      tag('h = ' + n2(g.h) + ' ' + u, X(g.L / 2) - 4, Y(g.h * 0.5) + (rh > lsz * 4 ? lsz * 1.6 : 0), 'right', lsz);
      var csz = M.clamp(g.r * sc / 4.5, 8, fs);
      tag('πr² = ' + M.fmt(o.circle, dg) + ' ' + u + '²', X(0), Y(g.lidB.y), 'center', csz);
      if (g.lidT) tag('πr² = ' + M.fmt(o.circle, dg) + ' ' + u + '²', X(0), Y(g.lidT.y), 'center', csz);
    } else if (k < 0.06) {
      var ty = g.lidT ? g.lidT.y : g.h * g.ce + g.r * g.se;
      D.line(ctx, X(0), Y(ty), X(g.r), Y(ty), c.ink, 2);
      D.circle(ctx, X(0), Y(ty), 2.5, c.ink);
      tag('r = ' + n2(g.r) + ' ' + u, X(g.r / 2), Y(ty) - fs - 2);
      tag('h = ' + n2(g.h) + ' ' + u, X(g.r) + 6, Y(g.h * g.ce / 2 + g.r * g.se), 'left');
    }
  }

  function headline(ctx, W, txt, c, narrow) {
    var hs = narrow ? 12 : 14, lines = [txt];
    ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
    if (ctx.measureText(txt).width > W - 20) {     // split at the " = " nearest the middle
      var cut = -1, best = 1e9, re = / = /g, m;
      while ((m = re.exec(txt))) { var dd = Math.abs(m.index - txt.length / 2); if (dd < best) { best = dd; cut = m.index; } }
      if (cut > 0) lines = [txt.slice(0, cut), txt.slice(cut + 1)];
    }
    lines.forEach(function (ln) { while (hs > 9 && (ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif', ctx.measureText(ln).width > W - 20)) hs -= 0.5; });
    lines.forEach(function (ln, i) { D.text(ctx, ln, W / 2, 13 + i * (hs + 7), { color: c.bg, bg: c.success, size: hs, weight: 700, align: 'center', pad: 3, fit: W }); });
    return 13 + lines.length * (hs + 7) + 4;
  }

  SimLab.createSim({
    ariaLabel: 'A cuboid, cube, cylinder, water tank or room drawn in 3-D that unfolds into its flat net, with the area of every face labelled and the total surface area worked out',
    transport: false,
    mobileAspect: '3 / 3.4',
    params: [
      { id: 'shape', label: 'Solid', type: 'select', value: 'cuboid', options: [
        { value: 'cuboid', label: 'Cuboid (a box)' }, { value: 'cube', label: 'Cube' },
        { value: 'cylinder', label: 'Cylinder' }, { value: 'tank', label: 'Water tank (cylinder in metres)' },
        { value: 'room', label: 'Room to paint' }] },
      { id: 'l', label: 'Length l', min: 1, max: 15, step: 1, value: 8, unit: 'cm' },
      { id: 'b', label: 'Breadth b', min: 1, max: 15, step: 1, value: 5, unit: 'cm' },
      { id: 'a', label: 'Side a', min: 1, max: 15, step: 1, value: 5, unit: 'cm', presets: [5, 10] },
      { id: 'r', label: 'Radius r', min: 1, max: 10, step: 0.5, value: 3.5, unit: 'cm', presets: [3.5, 7] },
      { id: 'h', label: 'Height h', min: 1, max: 15, step: 1, value: 4, unit: 'cm', presets: [4, 10] },
      { id: 'tr', label: 'Tank radius', min: 0.3, max: 1.5, step: 0.05, value: 0.7, unit: 'm' },
      { id: 'th', label: 'Tank height', min: 0.5, max: 3, step: 0.1, value: 1.5, unit: 'm' },
      { id: 'lid', label: 'Closed top (lid)', type: 'toggle', value: true },
      { id: 'rl', label: 'Room length', min: 3, max: 8, step: 0.5, value: 5, unit: 'm' },
      { id: 'rb', label: 'Room breadth', min: 3, max: 8, step: 0.5, value: 4, unit: 'm' },
      { id: 'rh', label: 'Room height', min: 2.5, max: 4, step: 0.1, value: 3, unit: 'm' },
      { id: 'doors', label: 'Doors (1 m × 2 m)', min: 0, max: 2, step: 1, value: 1 },
      { id: 'windows', label: 'Windows (1.2 m × 1.2 m)', min: 0, max: 3, step: 1, value: 2 },
      { id: 'rate', label: 'Cost', min: 10, max: 800, step: 10, value: 30, presets: [20, 30, 600],
        format: function (v) { return '₹' + v + ' per m²'; }, help: 'Painting a room costs tens of rupees per m²; steel sheet for a tank costs hundreds.' }
    ],
    buttons: [{ label: 'Unfold / fold the net', primary: true, onClick: function () { toggle(); } }],
    readouts: [
      { id: 'area', label: 'Total surface area', short: 'Total', key: true },
      { id: 'lat', label: 'Lateral (side) surface', short: 'Sides only', key: true },
      { id: 'need', label: 'Material needed', short: 'Needed', key: true },
      { id: 'pieces', label: 'Pieces in the net' },
      { id: 'work', label: 'Working' }
    ],
    reset: function (sim) { syncControls(sim.p); },
    onParam: function (sim, id) { if (id === 'shape') syncControls(sim.p); return true; },
    animate: function () { return performance.now() - rk.t0 < DUR + 50; },
    readout: function (sim) {
      var p = sim.p, o = areas(p), d = o.d, u = ' ' + d.u + '²', dg = d.box ? 2 : d.tank ? 2 : 1;
      var f = function (v) { return d.box ? n2(v) : M.fmt(v, dg); };
      var pieces = d.room ? '4 walls + ceiling (floor not painted)' : d.cube ? (d.lid ? '6 equal squares' : '5 equal squares (no top)')
        : d.box ? (d.lid ? '6 rectangles in 3 equal pairs' : '5 rectangles (no top)') : (d.lid ? '1 rectangle + 2 circles' : '1 rectangle + 1 circle (no lid)');
      var need = d.room ? M.fmt(o.litres, 1) + ' L of paint, ' + rupees(o.cost)
        : d.tank ? f(o.total) + ' m² of sheet, ' + rupees(o.cost) : 'card of ' + f(o.total) + u;
      return { area: f(o.total) + u + (d.room ? ' to paint' : ''), lat: f(o.lat) + u + (d.room ? ' of walls' : ''), need: need, pieces: pieces, work: working(o) };
    },
    status: function () { return kNow() > 0.5 ? 'The net: every face laid flat. Tap the picture to fold it up again.' : 'Tap the picture (or the button) to unfold the solid into its net.'; },
    pointer: { down: function () { toggle(); return false; }, hover: function () { return true; } },
    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, W = sim.width;
      D.clear(ctx, W, sim.height, c.bg);
      var o = areas(sim.p), d = o.d;
      var lab = d.room ? 'Area to paint = ' : d.tank ? 'Sheet for the tank = ' : 'Total surface area = ';
      var top = headline(ctx, W, lab + working(o), c, W < 560);
      if (d.box) drawBox(sim, { top: top }); else drawCyl(sim, { top: top });
    }
  });
})();
