/* =====================================================================
   Mensuration · Volume & Capacity — sim.js
   ---------------------------------------------------------------------
   Three modes, all drawn in isometric view
     (screen X = (x − y)·cos30°·s, Y = (x + y)·sin30°·s − z·s):
   cubes  a cuboid l × b × h (cm) is filled with 1 cm cubes, row by row
          and layer by layer: l × b cubes per layer, h layers → V = lbh.
   pour   a cuboid (l × b × h) or a cylinder (diameter l, height h) is
          filled from a jug at 250 mL (one glass) per second, beside a
          10 cm cube that holds exactly 1 L. 1 cm³ = 1 mL.
          Cylinder V = πr²h with r = l / 2.
   tank   a rooftop tank in metres (four common sizes) is used by a
          family at people × litres per person per day. 1 m³ = 1000 L.
          One screen second is 6 hours (4 s per day).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var C30 = Math.cos(Math.PI / 6), S30 = 0.5, KX = 1.2247, KY = 0.7071;   // circle → iso ellipse axes
  var WATER = '#38bdf8', GLASS = 250, DAY = 4;
  var TANKS = {
    cyl500:  { shape: 'cyl', r: 0.45, h: 0.8,  name: '500 L plastic tank' },
    cyl1000: { shape: 'cyl', r: 0.55, h: 1.05, name: '1000 L plastic tank' },
    cyl2000: { shape: 'cyl', r: 0.7,  h: 1.3,  name: '2000 L plastic tank' },
    cub3000: { shape: 'box', l: 2, b: 1.5, h: 1, name: 'concrete tank 2 × 1.5 × 1 m' }
  };
  var LAYER = [['#f59e0b', '#d97706', '#b45309'], ['#a78bfa', '#8b5cf6', '#7c3aed'], ['#34d399', '#10b981', '#059669'], ['#f472b6', '#ec4899', '#db2777']];

  function nf(v, d) { return String(parseFloat(v.toFixed(d == null ? 2 : d))); }
  function L(v) { return v >= 100 ? nf(v, 0) : v >= 10 ? nf(v, 1) : nf(v, 2); }
  function shapeOf(p) { return p.mode === 'cubes' ? 'box' : p.mode === 'tank' ? TANKS[p.tank].shape : p.shape; }
  function dims(p) {                                   // in cm (cubes, pour) or m (tank)
    if (p.mode === 'tank') { var t = TANKS[p.tank]; return t.shape === 'cyl' ? { r: t.r, h: t.h } : { l: t.l, b: t.b, h: t.h }; }
    return shapeOf(p) === 'cyl' ? { r: p.l / 2, h: p.h } : { l: p.l, b: p.b, h: p.h };
  }
  function volume(p) { var d = dims(p); return d.r != null ? Math.PI * d.r * d.r * d.h : d.l * d.b * d.h; }
  function capL(p) { return p.mode === 'tank' ? volume(p) * 1000 : volume(p) / 1000; }   // litres
  function formula(p) {
    var d = dims(p), u = p.mode === 'tank' ? ' m' : ' cm', v = volume(p);
    if (d.r != null) return 'V = πr²h = π × ' + nf(d.r) + '² × ' + nf(d.h) + ' ≈ ' + (p.mode === 'tank' ? nf(v, 3) + ' m³' : nf(v, 0) + ' cm³');
    return 'V = l × b × h = ' + nf(d.l) + ' × ' + nf(d.b) + ' × ' + nf(d.h) + ' = ' + (p.mode === 'tank' ? nf(v, 3) + ' m³' : nf(v, 0) + ' cm³');
  }
  function perDay(p) { return p.people * p.use; }

  var st = { n: 0, poured: 0, days: 0, gAcc: 0 };
  function frac(p) {
    if (p.mode === 'cubes') return st.n / (p.l * p.b * p.h);
    if (p.mode === 'pour') return Math.min(1, st.poured / volume(p));
    return Math.max(0, 1 - perDay(p) * st.days / capL(p));
  }

  /* ---------- isometric helpers ---------- */
  function iso(o, x, y, z) { return { x: o.ox + (x - y) * C30 * o.s, y: o.oy + (x + y) * S30 * o.s - z * o.s }; }
  function quad(ctx, o, pts, fill, stroke, lw) {
    ctx.beginPath();
    pts.forEach(function (q, i) { var P = iso(o, q[0], q[1], q[2]); if (i) ctx.lineTo(P.x, P.y); else ctx.moveTo(P.x, P.y); });
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }
  function seg(ctx, o, a, b, col, lw, dash) { var A = iso(o, a[0], a[1], a[2]), B = iso(o, b[0], b[1], b[2]); D.line(ctx, A.x, A.y, B.x, B.y, col, lw, dash); }
  // a solid block x0..x1, y0..y1, z0..z1 with three visible faces
  function block(ctx, o, x0, y0, z0, x1, y1, z1, cols, edge) {
    quad(ctx, o, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], cols[1], edge);   // right face x = x1
    quad(ctx, o, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], cols[2], edge);   // left face y = y1
    quad(ctx, o, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], cols[0], edge);   // top
  }
  function fitBox(l, b, h, rx, ry, rw, rh) {          // scale + origin so the box fills a region, bottom-aligned
    var s = Math.min(rw / ((l + b) * C30), rh / ((l + b) * S30 + h));
    return { s: s, ox: rx + (rw - (l + b) * C30 * s) / 2 + b * C30 * s, oy: ry + rh - (l + b) * S30 * s };
  }
  function boxSize(d) { return d.r != null ? { w: 2 * KX * d.r, h: d.h + 2 * KY * d.r } : { w: (d.l + d.b) * C30, h: (d.l + d.b) * S30 + d.h }; }

  // container (box or cylinder) with water filled to `lev` (same units as d); returns key screen points
  function container(ctx, c, d, s, cx, bottom, lev, labels, u, fs, W) {
    var edge = D.alpha(c.ink, 0.75), wt = [D.alpha(WATER, 0.55), D.alpha(WATER, 0.45), D.alpha(WATER, 0.35)];
    var tag = function (t, x, y, al) { D.text(ctx, t, x, y, { color: c.ink, size: fs, weight: 700, align: al || 'center', bg: D.alpha(c.bg, 0.85), pad: 2, fit: W }); };
    if (d.r != null) {
      var rx = KX * d.r * s, ry = KY * d.r * s, yb = bottom - ry, yt = yb - d.h * s, yw = yb - lev * s;
      ctx.beginPath(); ctx.ellipse(cx, yb, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = D.alpha(c.ink, 0.05); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, yb, rx, ry, 0, Math.PI, Math.PI * 2); ctx.strokeStyle = D.alpha(c.ink, 0.3); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      if (lev > 0) {
        ctx.beginPath(); ctx.moveTo(cx - rx, yw); ctx.lineTo(cx - rx, yb); ctx.ellipse(cx, yb, rx, ry, 0, Math.PI, 0, true); ctx.lineTo(cx + rx, yw); ctx.ellipse(cx, yw, rx, ry, 0, 0, Math.PI, false);
        ctx.fillStyle = wt[1]; ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, yw, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = wt[0]; ctx.fill(); ctx.strokeStyle = WATER; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.strokeStyle = edge; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, yb, rx, ry, 0, 0, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, yt, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      D.line(ctx, cx - rx, yt, cx - rx, yb, edge, 2); D.line(ctx, cx + rx, yt, cx + rx, yb, edge, 2);
      if (labels) {
        D.line(ctx, cx - rx, yt, cx + rx, yt, D.alpha(c.ink, 0.45), 1, [3, 3]);
        tag('d = ' + nf(2 * d.r) + u, cx, yt + ry + fs * 0.9);
        tag('h = ' + nf(d.h) + u, cx + rx + 6, (yt + yb) / 2, 'left');
      }
      return { top: yt - ry, cx: cx, surf: yw, left: cx - rx, right: cx + rx };
    }
    var w = (d.l + d.b) * C30 * s, o = { s: s, ox: cx - w / 2 + d.b * C30 * s, oy: bottom - (d.l + d.b) * S30 * s };
    quad(ctx, o, [[0, 0, 0], [d.l, 0, 0], [d.l, d.b, 0], [0, d.b, 0]], D.alpha(c.ink, 0.05));
    seg(ctx, o, [0, 0, 0], [0, 0, d.h], D.alpha(c.ink, 0.3), 1, [4, 4]);
    seg(ctx, o, [0, 0, 0], [d.l, 0, 0], D.alpha(c.ink, 0.3), 1, [4, 4]);
    seg(ctx, o, [0, 0, 0], [0, d.b, 0], D.alpha(c.ink, 0.3), 1, [4, 4]);
    if (lev > 0) block(ctx, o, 0, 0, 0, d.l, d.b, lev, wt, D.alpha(WATER, 0.9));
    outline(ctx, o, d, edge);
    if (labels) dimLabels(ctx, o, d, u, tag, fs);
    var T = iso(o, d.l / 2, d.b / 2, d.h), Sf = iso(o, d.l / 2, d.b / 2, lev);
    return { top: iso(o, 0, 0, d.h).y, cx: T.x, surf: Sf.y, left: iso(o, 0, d.b, 0).x, right: iso(o, d.l, 0, 0).x, o: o };
  }
  function outline(ctx, o, d, edge) {
    quad(ctx, o, [[0, 0, d.h], [d.l, 0, d.h], [d.l, d.b, d.h], [0, d.b, d.h]], null, edge, 2);
    seg(ctx, o, [d.l, 0, 0], [d.l, 0, d.h], edge, 2); seg(ctx, o, [d.l, d.b, 0], [d.l, d.b, d.h], edge, 2); seg(ctx, o, [0, d.b, 0], [0, d.b, d.h], edge, 2);
    seg(ctx, o, [0, d.b, 0], [d.l, d.b, 0], edge, 2); seg(ctx, o, [d.l, 0, 0], [d.l, d.b, 0], edge, 2);
  }
  function dimLabels(ctx, o, d, u, tag, fs) {
    var a = iso(o, d.l / 2, d.b, 0), b = iso(o, d.l, d.b / 2, 0), hh = iso(o, d.l, 0, d.h / 2);
    tag('l = ' + nf(d.l) + u, a.x - fs * 1.6, a.y + fs * 1.1);
    tag('b = ' + nf(d.b) + u, b.x + fs * 1.6, b.y + fs * 1.1);
    tag('h = ' + nf(d.h) + u, hh.x + 6, hh.y, 'left');
  }

  /* ---------- the three scenes ---------- */
  function drawCubes(sim, top, bot, fs) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, l = p.l, b = p.b, h = p.h;
    var per = l * b, n = Math.floor(st.n + 1e-9), k = Math.floor(n / per), m = n - k * per;
    var o = fitBox(l, b, h, 16 + fs * 3, top + fs * 1.5, W - 32 - fs * 6, bot - top - fs * 3.2), d = { l: l, b: b, h: h };
    var edge = D.alpha(c.ink, 0.75), grid = o.s >= 6, gl = c.light ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)';
    quad(ctx, o, [[0, 0, 0], [l, 0, 0], [l, b, 0], [0, b, 0]], D.alpha(c.ink, 0.06));
    seg(ctx, o, [0, 0, 0], [0, 0, h], D.alpha(c.ink, 0.3), 1, [4, 4]);
    // full layers, one slab each so the colours show the layers
    for (var z = 0; z < k; z++) {
      var col = LAYER[z % 4];
      block(ctx, o, 0, 0, z, l, b, z + 1, col, gl);
      if (grid) {
        for (var i = 1; i < l; i++) { seg(ctx, o, [i, b, z], [i, b, z + 1], gl, 1); if (z === k - 1) seg(ctx, o, [i, 0, z + 1], [i, b, z + 1], gl, 1); }
        for (var j = 1; j < b; j++) { seg(ctx, o, [l, j, z], [l, j, z + 1], gl, 1); if (z === k - 1) seg(ctx, o, [0, j, z + 1], [l, j, z + 1], gl, 1); }
      }
    }
    // the layer being filled: cube by cube, back row first
    var cl = LAYER[k % 4];
    for (var q = 0; q < m; q++) { var jj = Math.floor(q / l), ii = q % l; block(ctx, o, ii, jj, k, ii + 1, jj + 1, k + 1, cl, grid ? gl : null); }
    outline(ctx, o, d, edge);
    dimLabels(ctx, o, d, ' cm', function (t, x, y, al) { D.text(ctx, t, x, y, { color: c.ink, size: fs, weight: 700, align: al || 'center', bg: D.alpha(c.bg, 0.85), pad: 2, fit: W }); }, fs);
    var done = n >= per * h;
    return done ? 'Full: ' + h + ' layers × ' + per + ' cubes = ' + per * h + ' cubes'
      : 'Layer ' + (k + 1) + ' of ' + h + ' · ' + l + ' × ' + b + ' = ' + per + ' cubes in each layer';
  }

  function drawPour(sim, top, bot, fs) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, d = dims(p), one = { l: 10, b: 10, h: 10 };
    var A = boxSize(d), B = boxSize(one), gap = 0.04 * W + fs * 5, availW = W - 32 - gap, availH = bot - top - fs * 4.2;
    var s = Math.min(availW / (A.w + B.w), availH / Math.max(A.h, B.h));
    var bottom = bot - fs * 1.6, x0 = (W - (A.w + B.w) * s - gap) / 2;
    var cap = volume(p), lev = Math.min(1, st.poured / cap) * d.h;
    var k = container(ctx, c, d, s, x0 + A.w * s / 2, bottom, lev, true, ' cm', fs, W);
    // stream from the jug
    if (sim.running && st.poured < cap) {
      var jy = Math.max(top + 14, k.top - fs * 2.4);
      var sx = k.cx + (k.right - k.cx) * 0.45;          // off-centre, clear of the diameter label
      D.roundRect(ctx, sx - 14, jy - 12, 22, 14, 3, D.alpha(c.ink, 0.25), D.alpha(c.ink, 0.6));
      D.line(ctx, sx + 6, jy - 2, sx + 1, k.surf, D.alpha(WATER, 0.9), 3);
    }
    // the 1 litre cube
    var bx = x0 + A.w * s + gap + B.w * s / 2;
    container(ctx, c, one, s, bx, bottom, 0, false, '', fs, W);
    D.text(ctx, '1 L = 10 × 10 × 10 cm', bx, bottom + fs * 0.9, { color: c.muted, size: fs - 1, weight: 600, align: 'center', fit: W });
    var full = st.poured >= cap - 1e-6;
    return (full ? 'Full: ' : 'Poured: ') + nf(Math.min(st.poured, cap), 0) + ' mL = ' + nf(Math.min(st.poured, cap), 0) + ' cm³ · ' + nf(Math.min(st.poured, cap) / GLASS, 1) + ' glasses';
  }

  function drawTank(sim, top, bot, fs) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, d = dims(p);
    var roof = bot - Math.max(fs * 4, (bot - top) * 0.22);
    // building
    var bw = Math.min(W * 0.8, 520), bxl = (W - bw) / 2;
    D.roundRect(ctx, bxl, roof, bw, bot - roof + 4, 0, D.alpha(c.ink, 0.08), D.alpha(c.ink, 0.35));
    for (var i = 0; i < 4; i++) D.roundRect(ctx, bxl + bw * (0.1 + i * 0.22), roof + (bot - roof) * 0.3, bw * 0.12, (bot - roof) * 0.4, 2, D.alpha(WATER, 0.18), D.alpha(c.ink, 0.3));
    // tank + a 1.6 m person for scale
    var A = boxSize(d), person = 1.6, availW = bw * 0.8, availH = roof - top - fs * 2.6;
    var s = Math.min(availW / (A.w + 0.9), availH / Math.max(A.h + 0.3, person));
    var tx = W / 2 + 0.25 * s, lev = frac(p) * d.h;
    var k = container(ctx, c, d, s, tx, roof - 0.04 * s, lev, true, ' m', fs, W);
    var px = k.left - 0.45 * s, ph = person * s, hr = ph * 0.09;
    ctx.strokeStyle = c.muted; ctx.lineWidth = 2; ctx.lineCap = 'round';
    D.circle(ctx, px, roof - ph + hr, hr, null, c.muted, 2);
    ctx.beginPath(); ctx.moveTo(px, roof - ph + 2 * hr); ctx.lineTo(px, roof - ph * 0.45); ctx.lineTo(px - ph * 0.12, roof); ctx.moveTo(px, roof - ph * 0.45); ctx.lineTo(px + ph * 0.12, roof);
    ctx.moveTo(px - ph * 0.15, roof - ph * 0.68); ctx.lineTo(px, roof - ph * 0.75); ctx.lineTo(px + ph * 0.15, roof - ph * 0.68); ctx.stroke();
    D.text(ctx, '1.6 m', px, roof - ph - fs * 0.6, { color: c.muted, size: fs - 1, weight: 600, align: 'center', fit: W });
    // pipe down to the taps
    D.line(ctx, k.right - 4, roof - 0.1 * s, bxl + bw - 12, roof + 6, D.alpha(c.ink, 0.4), 3);
    var left = capL(p) * frac(p), day = Math.floor(st.days) + 1;
    return left <= 0 ? 'Empty after ' + nf(capL(p) / perDay(p), 2) + ' days' : 'Day ' + day + ' · ' + nf(left, 0) + ' L left · ' + p.people + ' × ' + p.use + ' L = ' + perDay(p) + ' L a day';
  }

  SimLab.createSim({
    ariaLabel: 'A cuboid being filled with one-centimetre cubes layer by layer, or a cuboid or cylinder being filled with water beside a one-litre cube, or a rooftop water tank being used up by a family over several days',
    playLabel: 'Fill',
    mobileAspect: '3 / 3.2',
    params: [
      { id: 'mode', label: 'Activity', type: 'select', value: 'cubes', options: [
        { value: 'cubes', label: 'Fill a box with 1 cm cubes' },
        { value: 'pour', label: 'Pour water: litres and cm³' },
        { value: 'tank', label: 'Rooftop water tank' }] },
      { id: 'l', label: 'Length (diameter of a cylinder)', min: 1, max: 20, step: 1, value: 5, unit: 'cm', presets: [8, 10],
        help: 'Length, breadth and height are used by the cubes and pouring activities.' },
      { id: 'b', label: 'Breadth', min: 1, max: 20, step: 1, value: 4, unit: 'cm', presets: [10] },
      { id: 'h', label: 'Height', min: 1, max: 20, step: 1, value: 3, unit: 'cm', presets: [10, 20] },
      { id: 'shape', label: 'Container for pouring', type: 'select', value: 'box', options: [
        { value: 'box', label: 'Cuboid (l × b × h)' }, { value: 'cyl', label: 'Cylinder (diameter l, height h)' }],
        help: 'Cubes always fill a cuboid; the tank has its own sizes.' },
      { id: 'tank', label: 'Tank on the roof', type: 'select', value: 'cyl1000', options: [
        { value: 'cyl500', label: '500 L plastic (0.9 m across, 0.8 m tall)' },
        { value: 'cyl1000', label: '1000 L plastic (1.1 m across, 1.05 m tall)' },
        { value: 'cyl2000', label: '2000 L plastic (1.4 m across, 1.3 m tall)' },
        { value: 'cub3000', label: 'Concrete 2 m × 1.5 m × 1 m' }] },
      { id: 'people', label: 'People in the family', min: 1, max: 10, step: 1, value: 4, presets: [2, 4, 6], help: 'Used by the rooftop tank.' },
      { id: 'use', label: 'Water per person per day', min: 40, max: 200, step: 5, value: 135, unit: 'L',
        presets: [{ label: 'Village 55', value: 55 }, { label: 'City 135', value: 135 }] }
    ],
    readouts: [
      { id: 'now', label: 'Right now', key: true, short: 'Now' },
      { id: 'vol', label: 'Volume', key: true },
      { id: 'cap', label: 'Capacity', key: true },
      { id: 'info', label: 'Details' }
    ],
    graph: { title: 'How full is it?', xLabel: 'time (s; days for the tank)', yLabel: '% full', series: [{ label: '% full', color: WATER }], yMin: 0, yMax: 100 },
    reset: function (sim) {
      st.n = 0; st.poured = 0; st.days = 0; st.gAcc = 0;
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [sim.p.mode === 'tank' ? 100 : 0]); }
    },
    update: function (sim, dt) {
      var p = sim.p;
      if (p.mode === 'cubes') { var tot = p.l * p.b * p.h; st.n = Math.min(tot, st.n + Math.max(3, tot / 10) * dt); }
      else if (p.mode === 'pour') st.poured = Math.min(volume(p), st.poured + GLASS * dt);
      else st.days = Math.min(capL(p) / perDay(p), st.days + dt / DAY);
      st.gAcc += dt;
      if (sim.graph && st.gAcc >= 0.1) { st.gAcc = 0; sim.graph.push(p.mode === 'tank' ? st.days : sim.time, [100 * frac(p)]); }
    },
    finished: function (sim) {
      var p = sim.p, f = frac(p);
      var done = p.mode === 'tank' ? f <= 1e-9 : f >= 1 - 1e-9;
      if (done && sim.graph) sim.graph.push(p.mode === 'tank' ? st.days : sim.time, [100 * f]);
      return done;
    },
    readout: function (sim) {
      var p = sim.p, v = volume(p), cap = capL(p);
      if (p.mode === 'cubes') {
        var per = p.l * p.b, n = Math.floor(st.n + 1e-9);
        return { now: n + ' of ' + v + ' cubes', vol: v + ' cm³', cap: v + ' mL' + (v >= 1000 ? ' = ' + L(v / 1000) + ' L' : ''),
          info: Math.min(p.h, Math.floor(n / per) + (n < v ? 1 : 0)) + ' of ' + p.h + ' layers, ' + per + ' cubes per layer' };
      }
      if (p.mode === 'pour') {
        var w = Math.min(st.poured, v);
        return { now: nf(w, 0) + ' mL poured', vol: nf(v, 0) + ' cm³', cap: L(cap) + ' L',
          info: 'water ' + nf(frac(p) * p.h, 1) + ' of ' + p.h + ' cm deep; needs ' + nf(v / GLASS, 1) + ' glasses of 250 mL' };
      }
      return { now: nf(cap * frac(p), 0) + ' L left', vol: nf(v, 3) + ' m³', cap: nf(cap, 0) + ' L',
        info: 'lasts ' + nf(cap / perDay(p), 2) + ' days at ' + perDay(p) + ' L a day' };
    },
    status: function (sim) {
      var p = sim.p;
      if (p.mode === 'cubes') return formula(p) + ' → ' + (p.l * p.b * p.h) + ' cubes of 1 cm³';
      if (p.mode === 'pour') return formula(p) + ' = ' + L(capL(p)) + ' L (1000 cm³ = 1 L)';
      return TANKS[p.tank].name + ': lasts ' + nf(capL(p) / perDay(p), 2) + ' days for ' + p.people + ' people';
    },
    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 11 : 13;
      D.clear(ctx, W, H, c.bg);
      var top = fs * 2.4, bot = H - fs * 2.6;
      var head = p.mode === 'cubes' ? drawCubes(sim, top, bot, fs) : p.mode === 'pour' ? drawPour(sim, top, bot, fs) : drawTank(sim, top, bot, fs);
      // headline + formula, shrunk to fit
      var line = function (t, y, col, bg) {
        var sz = fs + 1; ctx.font = '700 ' + sz + 'px Inter, system-ui, sans-serif';
        while (sz > 8 && ctx.measureText(t).width > W - 20) { sz -= 0.5; ctx.font = '700 ' + sz + 'px Inter, system-ui, sans-serif'; }
        D.text(ctx, t, W / 2, y, { color: col, size: sz, weight: 700, align: 'center', bg: bg, pad: 4, fit: W });
      };
      line(head, fs * 1.2, c.ink, D.alpha(c.ink, 0.08));
      var f = formula(p) + (p.mode === 'tank' ? ' = ' + nf(capL(p), 0) + ' L' : p.mode === 'pour' ? ' = ' + L(capL(p)) + ' L' : '');
      line(f, H - fs * 1.2, c.bg, p.mode === 'cubes' ? c.warning : WATER);
    }
  });
})();
