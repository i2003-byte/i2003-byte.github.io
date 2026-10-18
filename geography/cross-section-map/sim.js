/* =====================================================================
   Maps · Reading a Contour Map: Cross-Sections — sim.js
   ---------------------------------------------------------------------
   A cross-section (profile) is the side view of the land along a line
   drawn on a map. Where the line crosses a contour, the land is at that
   contour's height; plot those heights against distance and join them.
     distance on the ground = distance on the map × scale
     average gradient       = height difference ÷ ground distance
     vertical exaggeration  = vertical scale ÷ horizontal scale
   Contour shapes:
     valley → the V of the contours points UPHILL (upstream)
     spur   → the V points DOWNHILL (away from the hilltop)
   Can A see B? Only if no ground rises above the straight line from
   an eye 2 m above A to a point 2 m above B (the Earth's curve is
   ignored over 5 km).
   The land is a made-up 5 km × 5 km square built from smooth shapes.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var N = 81, KM = 5, EYE = 2;

  function g(x, y, cx, cy, s) { var a = (x - cx) / s, b = (y - cy) / s; return Math.exp(-0.5 * (a * a + b * b)); }
  function river(y) { return 0.8 - 0.06 * y + 0.025 * Math.sin(7 * y); }
  // spur: a ridge from hill A down to the south-west
  var S0 = [0.3, 0.3], S1 = [0.1, 0.8];
  function spur(x, y) {
    var dx = S1[0] - S0[0], dy = S1[1] - S0[1], t = M.clamp(((x - S0[0]) * dx + (y - S0[1]) * dy) / (dx * dx + dy * dy), 0, 1);
    var d = Math.hypot(x - S0[0] - t * dx, y - S0[1] - t * dy);
    return 170 * (1 - 0.75 * t) * Math.exp(-0.5 * Math.pow(d / 0.055, 2));
  }
  function land(x, y) {
    var h = 60 + 300 * (1 - y);
    h += 380 * g(x, y, 0.3, 0.28, 0.12) + 300 * g(x, y, 0.62, 0.2, 0.09);
    h += spur(x, y);
    h -= 90 * Math.exp(-0.5 * Math.pow((x - river(y)) / 0.06, 2));
    h += 4 * Math.sin(17 * x + 1) * Math.cos(13 * y);
    return Math.max(2, h);
  }
  var Zg = [], ZMAX = 0, ZMIN = 1e9;
  (function () {
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
      var v = land(i / (N - 1), j / (N - 1)); Zg.push(v); ZMAX = Math.max(ZMAX, v); ZMIN = Math.min(ZMIN, v);
    }
  })();
  function Z(i, j) { return Zg[j * N + i]; }
  function hAt(x, y) {
    var fi = M.clamp(x * (N - 1), 0, N - 1.001), fj = M.clamp(y * (N - 1), 0, N - 1.001), i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j;
    return (Z(i, j) * (1 - a) + Z(i + 1, j) * a) * (1 - b) + (Z(i, j + 1) * (1 - a) + Z(i + 1, j + 1) * a) * b;
  }
  function cellSegs(i, j, L) {
    var a = Z(i, j), b = Z(i + 1, j), c = Z(i + 1, j + 1), d = Z(i, j + 1), p = [];
    function cut(v1, v2, x1, y1, x2, y2) { if ((v1 < L) !== (v2 < L)) { var t = (L - v1) / (v2 - v1); p.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]); } }
    cut(a, b, i, j, i + 1, j); cut(b, c, i + 1, j, i + 1, j + 1); cut(c, d, i + 1, j + 1, i, j + 1); cut(d, a, i, j + 1, i, j);
    if (p.length === 2) return [[p[0], p[1]]];
    if (p.length === 4) { var mid = (a + b + c + d) / 4; return (mid < L) === (a < L) ? [[p[0], p[3]], [p[1], p[2]]] : [[p[0], p[1]], [p[2], p[3]]]; }
    return [];
  }

  var SECTIONS = {
    valley: { name: 'Across the river valley', a: [0.58, 0.62], b: [0.98, 0.56] },
    spur: { name: 'Across the spur', a: [0.04, 0.48], b: [0.42, 0.66] },
    peaks: { name: 'Over both hilltops and the saddle', a: [0.12, 0.36], b: [0.8, 0.12] },
    blocked: { name: 'Can A see the village behind the spur?', a: [0.46, 0.6], b: [0.05, 0.74] }
  };
  var FEATURES = [
    { name: 'Hilltop', x: 0.3, y: 0.28 }, { name: 'Hilltop', x: 0.62, y: 0.2 },
    { name: 'Saddle', x: 0.475, y: 0.235 }, { name: 'Spur', x: 0.2, y: 0.57 },
    { name: 'Valley', x: 0.8, y: 0.47 }, { name: 'River', x: 0.77, y: 0.86 }
  ];
  var TINT = [[0, [120, 170, 90]], [0.35, [196, 196, 110]], [0.65, [214, 160, 92]], [1, [176, 112, 70]]];
  function tint(f) {
    f = M.clamp(f, 0, 1);
    for (var k = 1; k < TINT.length; k++) if (f <= TINT[k][0]) {
      var a = TINT[k - 1], b = TINT[k], t = (f - a[0]) / (b[0] - a[0]);
      return 'rgb(' + [0, 1, 2].map(function (q) { return Math.round(a[1][q] + (b[1][q] - a[1][q]) * t); }).join(',') + ')';
    }
  }
  function fm(v) { return M.fmt(v, 0) + ' m'; }

  function profile(s) {
    var n = 240, pts = [], A = s.a, B = s.b;
    for (var k = 0; k <= n; k++) { var t = k / n; pts.push(hAt(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t)); }
    var len = Math.hypot(B[0] - A[0], B[1] - A[1]) * KM;
    var e0 = pts[0] + EYE, e1 = pts[n] + EYE, block = -1;
    var worst = 0;   // the point that rises furthest above the line of sight
    for (var k2 = 1; k2 < n; k2++) { var ex = pts[k2] - (e0 + (e1 - e0) * k2 / n); if (ex > worst) { worst = ex; block = k2; } }
    return { pts: pts, len: len, block: block, n: n };
  }

  SimLab.createSim({
    ariaLabel: 'A contour map of hills, a spur and a river valley with a draggable section line from A to B, and below it the side view (cross-section) of the land along that line',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'section', label: 'Section line', type: 'select', value: 'valley', options: Object.keys(SECTIONS).map(function (k) { return { value: k, label: SECTIONS[k].name }; }) },
      { id: 'interval', label: 'Contour interval', type: 'select', value: '50', options: [{ value: '20', label: '20 m (like a toposheet)' }, { value: '50', label: '50 m' }] },
      { id: 'names', label: 'Show the names of landforms', type: 'toggle', value: false },
      { id: 'sight', label: 'Line of sight from A to B', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'len', label: 'Length of the section (A to B)', short: 'Length A→B', key: true },
      { id: 'ha', label: 'Height at A' },
      { id: 'hb', label: 'Height at B' },
      { id: 'top', label: 'Highest point on the line' },
      { id: 'grad', label: 'Average gradient A to B' },
      { id: 'see', label: 'Can A see B?', key: true },
      { id: 've', label: 'Heights stretched (vertical exaggeration)', short: 'Stretch', key: true }
    ],
    onParam: function (sim, id, v) {
      if (id === 'section') { sim.state.a = SECTIONS[v].a.slice(); sim.state.b = SECTIONS[v].b.slice(); }
      return true;
    },
    reset: function (sim) { var S = SECTIONS[sim.p.section] || SECTIONS.valley; sim.state = { a: S.a.slice(), b: S.b.slice(), drag: null }; },
    readout: function (sim) {
      var s = sim.state, P = profile(s), ha = P.pts[0], hb = P.pts[P.n], top = Math.max.apply(null, P.pts);
      var dh = Math.abs(hb - ha), L = layout(sim);
      return {
        len: M.fmt(P.len, 2) + ' km',
        ha: fm(ha), hb: fm(hb), top: fm(top),
        grad: dh < 1 ? 'flat' : '1 in ' + M.fmt(P.len * 1000 / dh, 0) + (hb > ha ? ' (uphill)' : ' (downhill)'),
        see: P.block < 0 ? 'Yes' : 'No: ground at ' + M.fmt(P.block / P.n * P.len, 1) + ' km is in the way',
        ve: '× ' + M.fmt(L.ve || 1, 0)
      };
    },
    status: function (sim) { var P = profile(sim.state); return 'Section ' + M.fmt(P.len, 2) + ' km long · drag A or B'; },
    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, L = layout(sim);
      D.clear(ctx, W, H, c.bg);
      drawMap(sim, L);
      drawProfile(sim, L);
    },
    pointer: {
      hover: function (sim, x, y) { return !!toMap(sim, x, y); },
      down: function (sim, x, y) {
        var p = toMap(sim, x, y); if (!p) return false;
        var s = sim.state, da = Math.hypot(p[0] - s.a[0], p[1] - s.a[1]), db = Math.hypot(p[0] - s.b[0], p[1] - s.b[1]);
        s.drag = da <= db ? 'a' : 'b'; s[s.drag] = p; sim.redraw(); return true;
      },
      move: function (sim, x, y) { var s = sim.state, p = toMap(sim, x, y, true); if (s.drag && p) { s[s.drag] = p; sim.redraw(); } },
      up: function (sim) { sim.state.drag = null; }
    }
  });

  function layout(sim) {
    var W = sim.width, H = sim.height, pad = 8, L;
    if (W >= 620) {
      var m = Math.min(H - 2 * pad - 16, W * 0.48);
      L = { mx: pad, my: pad + 14, ms: m, px: m + 3 * pad + 30, py: pad + 22, pw: W - m - 4 * pad - 34, ph: Math.min(H - 2 * pad - 60, m - 50) };
      L.py = pad + 14 + (m - L.ph) / 2;
    } else {
      var m2 = Math.min(W - 2 * pad, H * 0.58);
      L = { mx: (W - m2) / 2, my: pad + 14, ms: m2 };
      L.px = pad + 32; L.py = L.my + m2 + 32; L.pw = W - L.px - pad - 4; L.ph = H - L.py - 22;
    }
    // vertical exaggeration from the scales actually drawn
    var P = profile(sim.state), lo = Math.floor((Math.min.apply(null, P.pts) - 10) / 50) * 50, hi = Math.ceil((Math.max.apply(null, P.pts) + 10) / 50) * 50;
    lo = Math.max(0, lo); if (hi - lo < 100) hi = lo + 100;
    L.lo = lo; L.hi = hi; L.P = P;
    L.ve = (L.ph / (hi - lo)) / (L.pw / Math.max(0.05, P.len * 1000));
    return L;
  }
  function toMap(sim, x, y, clampIt) {
    var L = layout(sim), u = (x - L.mx) / L.ms, v = (y - L.my) / L.ms;
    if (!clampIt && (u < -0.04 || u > 1.04 || v < -0.04 || v > 1.04)) return null;
    return [M.clamp(u, 0, 1), M.clamp(v, 0, 1)];
  }

  function drawMap(sim, L) {
    var ctx = sim.ctx, c = sim.colors, s = sim.state, iv = +sim.p.interval, cs = L.ms / (N - 1), idxStep = iv === 20 ? 100 : 100;
    function X(u) { return L.mx + u * L.ms; }
    function Y(v) { return L.my + v * L.ms; }
    for (var j = 0; j < N - 1; j++) for (var i = 0; i < N - 1; i++) {
      var zm = (Z(i, j) + Z(i + 1, j) + Z(i + 1, j + 1) + Z(i, j + 1)) / 4;
      ctx.fillStyle = tint((Math.floor(zm / iv) * iv) / ZMAX); ctx.fillRect(L.mx + i * cs, L.my + j * cs, cs + 0.6, cs + 0.6);
    }
    var labels = [];
    for (var Lv = iv; Lv < ZMAX; Lv += iv) {
      var idx = Lv % idxStep === 0, cnt = 0;
      ctx.beginPath();
      for (var jj = 0; jj < N - 1; jj++) for (var ii = 0; ii < N - 1; ii++) {
        var sg = cellSegs(ii, jj, Lv);
        for (var k = 0; k < sg.length; k++) {
          ctx.moveTo(L.mx + sg[k][0][0] * cs, L.my + sg[k][0][1] * cs); ctx.lineTo(L.mx + sg[k][1][0] * cs, L.my + sg[k][1][1] * cs);
          if (idx && ii === Math.round(N * 0.08) && cnt++ === 0) labels.push([L.mx + sg[k][0][0] * cs, L.my + sg[k][0][1] * cs, Lv]);
        }
      }
      ctx.strokeStyle = 'rgba(92,46,14,' + (idx ? 0.95 : 0.6) + ')'; ctx.lineWidth = idx ? 1.5 : 0.8; ctx.stroke();
    }
    var fs = L.ms < 260 ? 8 : 9;
    labels.forEach(function (l) { D.text(ctx, String(l[2]), l[0], l[1], { color: '#5c2e0e', size: fs, weight: 700, align: 'center', bg: 'rgba(255,255,255,0.75)', pad: 1 }); });
    // river
    ctx.beginPath();
    for (var v = 0.02; v <= 1.0001; v += 0.01) { var rx = X(river(v) + 0.004), ry = Y(v); if (v < 0.025) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry); }
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2.2; ctx.stroke();
    // spot heights on the hilltops
    [[0.3, 0.28], [0.62, 0.2]].forEach(function (q) {
      D.circle(ctx, X(q[0]), Y(q[1]), 2.2, '#111');
      D.text(ctx, M.fmt(hAt(q[0], q[1]), 0), X(q[0]) + 4, Y(q[1]) + 7, { color: '#111', size: fs + 1, weight: 700 });
    });
    // temple and village symbols
    [[0, 0], [8, 3], [3, 8]].forEach(function (o) {   // a small village
      var hx = X(0.05) + 12 + o[0], hy = Y(0.74) + o[1];
      ctx.fillStyle = '#7c2d12'; ctx.fillRect(hx - 3, hy - 1, 6, 5);
      ctx.beginPath(); ctx.moveTo(hx - 4, hy - 1); ctx.lineTo(hx, hy - 5); ctx.lineTo(hx + 4, hy - 1); ctx.closePath(); ctx.fillStyle = '#dc2626'; ctx.fill();
    });
    if (sim.p.names) FEATURES.forEach(function (f) {
      D.text(ctx, f.name, X(f.x), Y(f.y) + (f.name === 'Hilltop' ? 20 : 0), { color: '#fff', size: fs + 2, weight: 700, align: 'center', bg: 'rgba(15,23,42,0.75)', pad: 2 });
    });
    D.roundRect(ctx, L.mx, L.my, L.ms, L.ms, 2, null, c.border, 1);
    D.text(ctx, 'Contour map · interval ' + iv + ' m', L.mx, L.my - 8, { color: c.muted, size: 11, weight: 600, fit: sim.width });
    D.text(ctx, 'N↑', L.mx + L.ms - 4, L.my + 9, { color: '#111', size: 10, weight: 700, align: 'right', bg: 'rgba(255,255,255,0.7)', pad: 2 });
    var km = L.ms / KM;
    D.line(ctx, L.mx + L.ms - 8 - km, L.my + L.ms - 8, L.mx + L.ms - 8, L.my + L.ms - 8, '#111', 3);
    D.text(ctx, '1 km', L.mx + L.ms - 8 - km / 2, L.my + L.ms - 17, { color: '#111', size: 9, weight: 700, align: 'center', bg: 'rgba(255,255,255,0.7)', pad: 1 });

    // section line and its contour crossings
    var A = s.a, B = s.b, P = L.P;
    D.line(ctx, X(A[0]), Y(A[1]), X(B[0]), Y(B[1]), '#fff', 4);
    D.line(ctx, X(A[0]), Y(A[1]), X(B[0]), Y(B[1]), '#db2777', 2);
    crossings(P, iv).forEach(function (q) {
      var t = q[0]; D.circle(ctx, X(A[0] + (B[0] - A[0]) * t), Y(A[1] + (B[1] - A[1]) * t), 2.2, '#fff', '#db2777', 1);
    });
    [['A', A], ['B', B]].forEach(function (e) {
      D.circle(ctx, X(e[1][0]), Y(e[1][1]), 10, '#db2777', '#fff', 2);
      D.text(ctx, e[0], X(e[1][0]), Y(e[1][1]) + 0.5, { color: '#fff', size: 11, weight: 700, align: 'center' });
    });
  }
  function crossings(P, iv) {
    var out = [];
    for (var k = 1; k <= P.n; k++) {
      var a = P.pts[k - 1], b = P.pts[k];
      var la = Math.floor(a / iv), lb = Math.floor(b / iv);
      if (la !== lb) { var lev = Math.max(la, lb) * iv, t = (lev - a) / (b - a); out.push([(k - 1 + t) / P.n, lev]); }
    }
    return out;
  }

  function drawProfile(sim, L) {
    var ctx = sim.ctx, c = sim.colors, P = L.P, iv = +sim.p.interval;
    var x0 = L.px, y0 = L.py, w = L.pw, h = L.ph;
    function X(t) { return x0 + t * w; }
    function Y(z) { return y0 + h - (z - L.lo) / (L.hi - L.lo) * h; }
    D.text(ctx, 'Cross-section A → B', x0, y0 - 20, { color: c.muted, size: 11, weight: 600, fit: sim.width });
    // axes and height grid
    var step = L.hi - L.lo > 400 ? 100 : 50;
    for (var z = L.lo; z <= L.hi + 0.1; z += step) {
      D.line(ctx, x0, Y(z), x0 + w, Y(z), c.grid, 1);
      D.text(ctx, z + '', x0 - 4, Y(z), { color: c.faint, size: 9, align: 'right' });
    }
    D.text(ctx, 'm', x0 - 4, y0 - 2, { color: c.faint, size: 9, align: 'right' });
    var kstep = P.len > 3 ? 1 : P.len > 1.2 ? 0.5 : 0.2;
    for (var d = 0; d <= P.len + 1e-6; d += kstep) {
      var tx = X(d / P.len);
      if (tx > x0 + w - 22 && d > 0) continue;
      D.line(ctx, tx, y0 + h, tx, y0 + h + 4, c.axis, 1);
      D.text(ctx, M.fmt(d, kstep < 1 ? 1 : 0), tx, y0 + h + 11, { color: c.faint, size: 9, align: 'center' });
    }
    D.text(ctx, 'km', x0 + w, y0 + h + 11, { color: c.faint, size: 9, align: 'right', bg: c.bg, pad: 1 });
    // ground
    ctx.beginPath(); ctx.moveTo(X(0), y0 + h);
    for (var k = 0; k <= P.n; k++) ctx.lineTo(X(k / P.n), Y(P.pts[k]));
    ctx.lineTo(X(1), y0 + h); ctx.closePath();
    ctx.fillStyle = c.light ? 'rgba(161,98,7,0.35)' : 'rgba(180,120,60,0.45)'; ctx.fill();
    D.curve(ctx, function (px) { var k2 = Math.round((px - x0) / w * P.n); return Y(P.pts[M.clamp(k2, 0, P.n)]); }, x0, x0 + w, c.light ? '#78350f' : '#fbbf24', 2, 1);
    // points where the section crosses contours (as you would plot them by hand)
    crossings(P, iv).forEach(function (q) {
      D.line(ctx, X(q[0]), Y(q[1]), X(q[0]), y0 + h, c.light ? 'rgba(120,53,15,0.25)' : 'rgba(251,191,36,0.2)', 1);
      D.circle(ctx, X(q[0]), Y(q[1]), 2.4, '#db2777');
    });
    // line of sight
    if (sim.p.sight) {
      var ea = P.pts[0] + EYE, eb = P.pts[P.n] + EYE, ok = P.block < 0;
      D.line(ctx, X(0), Y(ea), X(1), Y(eb), ok ? '#16a34a' : '#dc2626', 2, [6, 4]);
      if (!ok) {
        var bt = P.block / P.n;
        D.circle(ctx, X(bt), Y(P.pts[P.block]), 4, '#dc2626', '#fff', 1.5);
        D.text(ctx, 'this ground blocks the view', X(bt), Y(P.pts[P.block]) - 12, { color: '#fff', size: 10, weight: 700, align: 'center', bg: 'rgba(185,28,28,0.85)', pad: 2, fit: sim.width });
      }
    }
    D.text(ctx, 'A', X(0), Y(P.pts[0]) - 10, { color: '#db2777', size: 12, weight: 800, align: 'center' });
    D.text(ctx, 'B', X(1), Y(P.pts[P.n]) - 10, { color: '#db2777', size: 12, weight: 800, align: 'center' });
    D.text(ctx, 'Drag A or B on the map', x0 + w, y0 - 20, { color: c.faint, size: 10, align: 'right', fit: sim.width });
  }
})();
