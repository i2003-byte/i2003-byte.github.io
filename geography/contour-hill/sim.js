/* =====================================================================
   Maps · Contour Lines from a Model Hill — sim.js
   ---------------------------------------------------------------------
   A contour line joins points at the same height above sea level.
   Like the classroom activity, a model hill stands in a tank and water
   is poured in: each time the water rises by one contour interval its
   edge is marked on the hill. Seen from above the marks are the
   contour lines of a map.
     close lines  = steep slope    (height changes fast over distance)
     far apart    = gentle slope
     slope angle  = atan(rise ÷ run)
   The land is a 4 km × 4 km square drawn on a 48 × 48 grid. Heights are
   smooth made-up shapes (not a real place). The 3D view stretches
   heights 3 times so the hill is easy to see; slopes are worked out at
   true scale. Contours are traced with "marching squares".
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var N = 49, SIZE_M = 4000, CELL_M = SIZE_M / (N - 1), VE = 3, AZ = -0.42, TILT = 0.46;

  function g(x, y, cx, cy, sx, sy) { var a = (x - cx) / sx, b = (y - cy) / sy; return Math.exp(-0.5 * (a * a + b * b)); }
  var SHAPES = {
    round: { name: 'Round hill', h: function (x, y) { return 480 * g(x, y, 0, 0, 0.5, 0.5); } },
    lop: { name: 'One steep side, one gentle side', h: function (x, y) {
      return 470 * g(x, y, 0.3, 0, x > 0.3 ? 0.2 : 0.8, 0.55); } },
    mesa: { name: 'Flat-topped plateau', h: function (x, y) {
      var r = Math.hypot(x / 0.78, y / 0.6); return 360 / (1 + Math.pow(r, 9)); } },
    twin: { name: 'Two peaks with a saddle', h: function (x, y) {
      return 450 * g(x, y, -0.45, 0.02, 0.32, 0.38) + 360 * g(x, y, 0.47, -0.04, 0.28, 0.34); } },
    volcano: { name: 'Volcano with a crater', h: function (x, y) {
      var r = Math.hypot(x, y); return Math.max(0, 470 * (1 - r / 1.05)) * (1 - 0.7 * Math.exp(-Math.pow(r / 0.2, 4))); } }
  };
  var TINTS = [[0, '#3f8a43'], [0.22, '#7fae4b'], [0.42, '#c8be5c'], [0.62, '#d49a52'], [0.82, '#a8683f'], [1, '#e8e2d6']];

  function hex(c) { var n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  var TINT_RGB = TINTS.map(function (t) { return [t[0], hex(t[1])]; });
  function tint(f) {
    f = M.clamp(f, 0, 1);
    for (var i = 1; i < TINT_RGB.length; i++) {
      if (f <= TINT_RGB[i][0]) {
        var a = TINT_RGB[i - 1], b = TINT_RGB[i], t = (f - a[0]) / (b[0] - a[0]);
        return [a[1][0] + (b[1][0] - a[1][0]) * t, a[1][1] + (b[1][1] - a[1][1]) * t, a[1][2] + (b[1][2] - a[1][2]) * t];
      }
    }
    return TINT_RGB[TINT_RGB.length - 1][1];
  }
  function rgb(c, k) { return 'rgb(' + Math.round(c[0] * k) + ',' + Math.round(c[1] * k) + ',' + Math.round(c[2] * k) + ')'; }

  // grid coordinate (0..N-1) → land unit (-1..1); y grows to the south
  function U(i) { return -1 + 2 * i / (N - 1); }

  function build(sim) {
    var sh = SHAPES[sim.p.shape] || SHAPES.round, z = [], max = 0, steep = 0, i, j;
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var x = U(i), y = U(j), v = sh.h(x, y) + 6 * Math.sin(5.3 * x + 1.1) * Math.cos(4.1 * y - 0.7);
      v = Math.max(0, v); z.push(v); if (v > max) max = v;
    }
    for (j = 1; j < N - 1; j++) for (i = 1; i < N - 1; i++) {
      var gx = (z[j * N + i + 1] - z[j * N + i - 1]) / (2 * CELL_M), gy = (z[(j + 1) * N + i] - z[(j - 1) * N + i]) / (2 * CELL_M);
      steep = Math.max(steep, Math.hypot(gx, gy));
    }
    // painter's order for the 3D view: far cells first
    var order = [], ca = Math.cos(AZ), sa = Math.sin(AZ);
    for (j = 0; j < N - 1; j++) for (i = 0; i < N - 1; i++) order.push({ i: i, j: j, d: (U(i) + 1 / (N - 1)) * sa + (U(j) + 1 / (N - 1)) * ca });
    order.sort(function (a, b) { return a.d - b.d; });
    return { z: z, max: max, steep: Math.atan(steep) * 180 / Math.PI, order: order };
  }
  function Z(G, i, j) { return G.z[j * N + i]; }
  function heightAt(G, x, y) {
    var fi = M.clamp((x + 1) / 2 * (N - 1), 0, N - 1.001), fj = M.clamp((y + 1) / 2 * (N - 1), 0, N - 1.001);
    var i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j;
    return (Z(G, i, j) * (1 - a) + Z(G, i + 1, j) * a) * (1 - b) + (Z(G, i, j + 1) * (1 - a) + Z(G, i + 1, j + 1) * a) * b;
  }
  // marching squares inside one cell: returns [[i,j],[i,j]] pairs in grid units
  function cellSegs(G, i, j, L) {
    var a = Z(G, i, j), b = Z(G, i + 1, j), c = Z(G, i + 1, j + 1), d = Z(G, i, j + 1), p = [];
    function cut(v1, v2, x1, y1, x2, y2) { if ((v1 < L) !== (v2 < L)) { var t = (L - v1) / (v2 - v1); p.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]); } }
    cut(a, b, i, j, i + 1, j); cut(b, c, i + 1, j, i + 1, j + 1); cut(c, d, i + 1, j + 1, i, j + 1); cut(d, a, i, j + 1, i, j);
    if (p.length === 2) return [[p[0], p[1]]];
    if (p.length === 4) {
      var mid = (a + b + c + d) / 4;
      return (mid < L) === (a < L) ? [[p[0], p[3]], [p[1], p[2]]] : [[p[0], p[1]], [p[2], p[3]]];
    }
    return [];
  }

  function fmtM(v) { return M.fmt(v, 0) + ' m'; }

  SimLab.createSim({
    ariaLabel: 'A model hill in a tank slowly filling with water, with a line marked on the hill at every contour interval, beside the same hill seen from above as a contour map',
    mobileAspect: '4 / 3',
    playLabel: 'Pour water',
    params: [
      { id: 'shape', label: 'Shape of the land', type: 'select', value: 'lop', options: Object.keys(SHAPES).map(function (k) { return { value: k, label: SHAPES[k].name }; }) },
      { id: 'interval', label: 'Contour interval', type: 'select', value: '50', options: [{ value: '25', label: '25 m' }, { value: '50', label: '50 m' }, { value: '100', label: '100 m' }] },
      { id: 'all', label: 'Show all contour lines at once', type: 'toggle', value: false },
      { id: 'view', label: 'Show', type: 'select', value: 'both', options: [{ value: 'both', label: 'Hill and map' }, { value: 'hill', label: 'Model hill only' }, { value: 'map', label: 'Contour map only' }] }
    ],
    readouts: [
      { id: 'water', label: 'Water level (height marked)', short: 'Water level', key: true },
      { id: 'lines', label: 'Contour lines drawn', short: 'Lines drawn', key: true },
      { id: 'summit', label: 'Highest point' },
      { id: 'steep', label: 'Steepest slope', key: true },
      { id: 'spot', label: 'Height at the tapped point' }
    ],
    onParam: function (sim, id) { return id === 'all' || id === 'view'; },
    reset: function (sim) {
      sim.state = { G: build(sim), w: 0, mark: 0, drain: false, spot: sim.state && sim.state.spot || null };
    },
    update: function (sim, dt) {
      var s = sim.state, rate = Math.max(40, s.G.max / 11);
      if (!s.drain) { s.w += rate * dt; if (s.w >= s.G.max + 15) s.drain = true; }
      else s.w = Math.max(0, s.w - 3 * rate * dt);
      s.mark = Math.max(s.mark, Math.min(s.w, s.G.max));
    },
    finished: function (sim) { return sim.state.drain && sim.state.w <= 0; },
    readout: function (sim) {
      var s = sim.state, iv = +sim.p.interval, top = shownTop(sim);
      return {
        water: s.drain ? (s.w > 0 ? 'draining ' + fmtM(s.w) : 'drained') : s.w <= 0 ? 'empty' : s.w >= s.G.max ? 'above the top' : fmtM(s.w),
        lines: Math.floor(top / iv) + ' (every ' + iv + ' m)',
        summit: fmtM(s.G.max),
        steep: M.fmt(s.G.steep, 0) + '°',
        spot: s.spot ? fmtM(heightAt(s.G, s.spot.x, s.spot.y)) : 'tap the map'
      };
    },
    status: function (sim) { var s = sim.state; return s.drain ? (s.w > 0 ? 'Every contour is marked. Draining the tank…' : 'Done: the marks are the contour lines') : s.w <= 0 ? 'Press “Pour water” to fill the tank' : s.w >= s.G.max ? 'The hill is under water: every contour is marked' : 'Water at ' + fmtM(s.w); },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, L = layout(sim);
      D.clear(ctx, W, H, c.bg);
      if (L.hill) drawHill(sim, L.hill);
      if (L.map) drawMap(sim, L.map);
    },

    pointer: {
      hover: function (sim, x, y) { return !!mapPoint(sim, x, y); },
      down: function (sim, x, y) { var p = mapPoint(sim, x, y); if (!p) return false; sim.state.spot = p; sim.redraw(); return true; },
      move: function (sim, x, y) { var p = mapPoint(sim, x, y); if (p) { sim.state.spot = p; sim.redraw(); } }
    }
  });

  function shownTop(sim) { var s = sim.state; return sim.p.all ? s.G.max : s.mark; }

  function layout(sim) {
    var W = sim.width, H = sim.height, v = sim.p.view, pad = 8;
    if (v === 'hill') return { hill: { x: pad, y: pad, w: W - 2 * pad, h: H - 2 * pad } };
    if (v === 'map') { var m = Math.min(W - 2 * pad, H - 2 * pad - 18); return { map: { x: (W - m) / 2, y: pad + 14, s: m } }; }
    if (H > W * 1.15) {
      var mh = Math.min(W - 2 * pad, H * 0.5);
      return { hill: { x: pad, y: pad, w: W - 2 * pad, h: H - mh - 30 }, map: { x: (W - mh) / 2, y: H - mh - 8, s: mh } };
    }
    var ms = Math.min(H - 2 * pad - 18, W * 0.42);
    return { hill: { x: pad, y: pad, w: W - ms - 3 * pad, h: H - 2 * pad }, map: { x: W - ms - pad, y: (H - ms) / 2 + 6, s: ms } };
  }
  function mapPoint(sim, x, y) {
    var m = layout(sim).map; if (!m) return null;
    if (x < m.x || x > m.x + m.s || y < m.y || y > m.y + m.s) return null;
    return { x: (x - m.x) / m.s * 2 - 1, y: (y - m.y) / m.s * 2 - 1 };
  }

  function drawHill(sim, B) {
    var ctx = sim.ctx, c = sim.colors, s = sim.state, G = s.G, iv = +sim.p.interval, top = shownTop(sim);
    var ca = Math.cos(AZ), sa = Math.sin(AZ), span = 2 * (Math.abs(ca) + Math.abs(sa));
    var zTop = 500 / 2000 * VE, depth = 0.05;
    var sc = Math.min(B.w * 0.96 / span, (B.h - 26) / (span * TILT + zTop + depth));
    var used = (span * TILT + zTop + depth) * sc + 26;
    var ox = B.x + B.w / 2, oy = B.y + 16 + Math.max(0, (B.h - used) / 2) + zTop * sc + span * TILT * sc / 2;
    function P(x, y, z) { var xr = x * ca - y * sa, yr = x * sa + y * ca; return [ox + xr * sc, oy + yr * sc * TILT - z / 2000 * VE * sc]; }
    function PG(i, j, z) { return P(U(i), U(j), z); }
    var water = Math.min(s.w, G.max + 1);

    // soil sides of the block, with water against the tank glass
    var base = -depth * 2000 / VE, wetCol = c.light ? 'rgba(59,130,246,0.92)' : 'rgba(37,99,235,0.9)';
    [[0, 0, 1, 0], [1, 0, 0, 1], [0, 1, 1, 0], [0, 0, 0, 1]].forEach(function (e) {
      function ij(k) { return [e[0] * (N - 1) + e[2] * k, e[1] * (N - 1) + e[3] * k]; }
      function band(top, bot, col) {
        ctx.beginPath();
        for (var k = 0; k < N; k++) { var t = ij(k), q = PG(t[0], t[1], top(t)); if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
        for (var k2 = N - 1; k2 >= 0; k2--) { var t2 = ij(k2), q2 = PG(t2[0], t2[1], bot(t2)); ctx.lineTo(q2[0], q2[1]); }
        ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      }
      band(function (t) { return Z(G, t[0], t[1]); }, function () { return base; }, c.light ? '#8a6a4a' : '#5b4330');
      if (water > 0) band(function (t) { return Math.max(water, Z(G, t[0], t[1])); }, function (t) { return Z(G, t[0], t[1]); }, c.light ? 'rgba(59,130,246,0.55)' : 'rgba(37,99,235,0.55)');
    });

    // light from the north-west, above
    var lx = -0.45, ly = -0.55, lz = 0.7, ln = Math.hypot(lx, ly, lz); lx /= ln; ly /= ln; lz /= ln;
    var cellPx = 2 / (N - 1);
    ctx.lineJoin = 'round';
    function poly(pts, col) {
      if (pts.length < 3) return;
      ctx.beginPath();
      pts.forEach(function (q, k) { var p = PG(q[0], q[1], q[2]); if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
      ctx.closePath(); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.fill(); ctx.stroke();
    }
    // split a cell along the shoreline: keepDry = the part above the water
    function clip(cs, lev, keepDry) {
      var out = [];
      for (var k = 0; k < cs.length; k++) {
        var A = cs[k], B = cs[(k + 1) % cs.length], inA = (A[2] >= lev) === keepDry, inB = (B[2] >= lev) === keepDry;
        if (inA) out.push(keepDry ? A : [A[0], A[1], lev]);
        if (inA !== inB) { var t = (lev - A[2]) / (B[2] - A[2]); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, lev]); }
      }
      return out;
    }
    G.order.forEach(function (o) {
      var i = o.i, j = o.j, za = Z(G, i, j), zb = Z(G, i + 1, j), zc = Z(G, i + 1, j + 1), zd = Z(G, i, j + 1);
      var zm = (za + zb + zc + zd) / 4;
      var gx = ((zb + zc) - (za + zd)) / 2 / 2000 * VE / cellPx, gy = ((zd + zc) - (za + zb)) / 2 / 2000 * VE / cellPx;
      var lit = 0.55 + 0.5 * Math.max(0, (-gx * lx - gy * ly + lz) / Math.hypot(gx, gy, 1));
      var band = Math.floor(zm / iv) * iv + iv / 2;
      var col = band - iv / 2 < top ? rgb(tint(band / 500), lit) : rgb([196, 150, 106], lit);
      var cs = [[i, j, za], [i + 1, j, zb], [i + 1, j + 1, zc], [i, j + 1, zd]];
      if (water <= 0 || Math.min(za, zb, zc, zd) >= water) poly(cs, col);
      else if (Math.max(za, zb, zc, zd) < water) poly(clip(cs, water, false), wetCol);
      else { poly(clip(cs, water, true), col); poly(clip(cs, water, false), wetCol); }
      // marked contour lines on the hill
      for (var Lv = iv; Lv <= top + 1e-6; Lv += iv) {
        if (Lv < water - 0.5) continue;   // still marked, but hidden under the water
        var segs = cellSegs(G, i, j, Lv);
        for (var k = 0; k < segs.length; k++) {
          var p1 = PG(segs[k][0][0], segs[k][0][1], Lv), p2 = PG(segs[k][1][0], segs[k][1][1], Lv);
          D.line(ctx, p1[0], p1[1], p2[0], p2[1], Lv % (iv * 2) === 0 ? '#3b1f0e' : 'rgba(59,31,14,0.75)', Lv % (iv * 2) === 0 ? 1.6 : 1);
        }
      }
      // shoreline
      if (water > 0 && water < G.max) {
        var sh = cellSegs(G, i, j, water);
        for (var m2 = 0; m2 < sh.length; m2++) {
          var q1 = PG(sh[m2][0][0], sh[m2][0][1], water), q2 = PG(sh[m2][1][0], sh[m2][1][1], water);
          D.line(ctx, q1[0], q1[1], q2[0], q2[1], '#e0f2fe', 1.6);
        }
      }
    });
    // tank glass (front) outline
    ctx.save(); ctx.strokeStyle = c.light ? 'rgba(30,64,175,0.35)' : 'rgba(186,230,253,0.35)'; ctx.lineWidth = 1.2;
    var corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    ctx.beginPath(); corners.forEach(function (q, k) { var p = P(q[0], q[1], base); if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.stroke();
    corners.forEach(function (q) { var p = P(q[0], q[1], base), t = P(q[0], q[1], 520); D.line(ctx, p[0], p[1], t[0], t[1], ctx.strokeStyle, 1); });
    ctx.restore();
    // north marker and spot pin
    if (s.spot) {
      var hz = heightAt(G, s.spot.x, s.spot.y), pp = P(s.spot.x, s.spot.y, hz);
      D.line(ctx, pp[0], pp[1], pp[0], pp[1] - 18, '#f472b6', 2);
      D.circle(ctx, pp[0], pp[1] - 20, 4, '#f472b6', '#fff', 1.5);
    }
    D.text(ctx, B.w < 260 ? 'Model hill (heights × 3)' : 'Model hill seen from the south (heights × 3)', B.x + 4, B.y + 8, { color: c.muted, size: 11, weight: 600, fit: B.x + B.w });
  }

  function drawMap(sim, R) {
    var ctx = sim.ctx, c = sim.colors, s = sim.state, G = s.G, iv = +sim.p.interval, top = shownTop(sim), cs = R.s / (N - 1);
    function X(i) { return R.x + i * cs; }
    function Y(j) { return R.y + j * cs; }
    var started = sim.p.all || s.mark > 0;
    for (var j = 0; j < N - 1; j++) for (var i = 0; i < N - 1; i++) {
      var zm = (Z(G, i, j) + Z(G, i + 1, j) + Z(G, i + 1, j + 1) + Z(G, i, j + 1)) / 4, band = Math.floor(zm / iv) * iv + iv / 2;
      ctx.fillStyle = band - iv / 2 < top ? rgb(tint(band / 500), 1) : (c.light ? '#e7e5e4' : '#334155');
      ctx.fillRect(X(i), Y(j), cs + 0.6, cs + 0.6);
    }
    if (s.w > 0 && s.w < G.max) {
      ctx.beginPath();
      for (var j3 = 0; j3 < N - 1; j3++) for (var i3 = 0; i3 < N - 1; i3++) {
        var w3 = cellSegs(G, i3, j3, s.w);
        for (var k3 = 0; k3 < w3.length; k3++) { ctx.moveTo(X(w3[k3][0][0]), Y(w3[k3][0][1])); ctx.lineTo(X(w3[k3][1][0]), Y(w3[k3][1][1])); }
      }
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3; ctx.stroke();
    }
    var labels = [];
    for (var Lv = iv; Lv <= top + 1e-6; Lv += iv) {
      var idx = Lv % (iv * 2) === 0, best = null;
      ctx.beginPath();
      for (var jj = 0; jj < N - 1; jj++) for (var ii = 0; ii < N - 1; ii++) {
        var sg = cellSegs(G, ii, jj, Lv);
        for (var k = 0; k < sg.length; k++) {
          ctx.moveTo(X(sg[k][0][0]), Y(sg[k][0][1])); ctx.lineTo(X(sg[k][1][0]), Y(sg[k][1][1]));
          var my = (sg[k][0][1] + sg[k][1][1]) / 2;
          if (!best || my > best[1]) best = [(sg[k][0][0] + sg[k][1][0]) / 2, my];
        }
      }
      ctx.strokeStyle = '#3b1f0e'; ctx.lineWidth = idx ? 1.7 : 0.9; ctx.stroke();
      if (best && idx) labels.push([X(best[0]), Y(best[1]), Lv]);
    }
    var fs = R.s < 200 ? 9 : 10;
    labels.forEach(function (l) { D.text(ctx, String(l[2]), l[0], l[1], { color: '#3b1f0e', size: fs, weight: 700, align: 'center', bg: 'rgba(255,255,255,0.8)', pad: 1 }); });
    D.roundRect(ctx, R.x, R.y, R.s, R.s, 2, null, c.border, 1);
    D.text(ctx, 'Contour map (from above)', R.x, R.y - 8, { color: c.muted, size: 11, weight: 600, fit: sim.width });
    D.text(ctx, 'N↑', R.x + R.s - 4, R.y + 9, { color: '#3b1f0e', size: 10, weight: 700, align: 'right', bg: 'rgba(255,255,255,0.7)', pad: 2 });
    // scale bar: 1 km
    var km = R.s / 4;
    D.line(ctx, R.x + 6, R.y + R.s - 8, R.x + 6 + km, R.y + R.s - 8, '#111', 3);
    D.text(ctx, '1 km', R.x + 6 + km / 2, R.y + R.s - 17, { color: '#111', size: 9, weight: 700, align: 'center', bg: 'rgba(255,255,255,0.7)', pad: 1 });
    if (s.spot) {
      var px = R.x + (s.spot.x + 1) / 2 * R.s, py = R.y + (s.spot.y + 1) / 2 * R.s;
      D.circle(ctx, px, py, 5, '#f472b6', '#fff', 2);
      D.text(ctx, fmtM(heightAt(G, s.spot.x, s.spot.y)), px, py - 13, { color: '#fff', size: 10, weight: 700, align: 'center', bg: 'rgba(0,0,0,0.65)', pad: 2, fit: sim.width });
    }
    if (!started) D.text(ctx, 'Pour water to draw the lines', R.x + R.s / 2, R.y + R.s / 2, { color: c.muted, size: 11, align: 'center', fit: sim.width });
  }
})();
