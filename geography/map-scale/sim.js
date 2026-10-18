/* =====================================================================
   Maps · Map Scale and Distance in India — sim.js
   ---------------------------------------------------------------------
   A map scale links a length on the map to the real length on the
   ground. It can be written three ways:
     statement  1 cm represents 100 km
     ratio (RF) 1 : 1,00,00,000   (100 km = 1,00,00,000 cm)
     line scale a bar marked 0, 100, 200 … km
   real distance = map distance × scale
   A straight ruler gives the shortest ("as the crow flies") distance;
   a thread laid along a route gives the longer route distance.
   Positions come from latitude and longitude on a flat map:
     x = (longitude − 80°) × 111.32 km × cos 24°,  y = latitude × 110.57 km
   so distances are within a few per cent of the true great-circle
   distances. The outline of India is rough, drawn from about 90 points.
   Routes run in straight lines between the towns named; real roads and
   railways bend more and are longer.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var KX = 111.32 * Math.cos(24 * Math.PI / 180), KY = 110.57;

  var INDIA = [
    [23.6, 68.2], [24.3, 68.8], [24.5, 71.1], [25.4, 70.3], [26.3, 70.0], [27.0, 69.6], [28.0, 70.5], [29.0, 71.9], [30.0, 73.4], [31.0, 74.6],
    [32.4, 74.6], [33.0, 73.7], [34.0, 73.5], [35.0, 72.7], [36.0, 71.8], [36.8, 72.6], [37.1, 74.5], [36.4, 75.8], [35.6, 77.8], [35.4, 79.0],
    [35.6, 80.2], [34.4, 80.0], [33.0, 79.5], [32.4, 78.8], [31.4, 78.8], [30.4, 80.4], [30.0, 81.0], [28.8, 80.2], [28.4, 81.2], [27.6, 83.3],
    [27.3, 84.6], [26.6, 85.8], [26.4, 87.3], [26.4, 88.1], [27.1, 88.0], [28.1, 88.8], [27.4, 88.9], [26.9, 89.4], [26.8, 92.0], [27.8, 91.7],
    [28.0, 93.0], [28.6, 94.4], [29.3, 95.5], [29.4, 96.2], [28.3, 97.3], [27.6, 97.1], [27.0, 96.2], [26.5, 95.3], [25.6, 95.0], [24.6, 94.6],
    [24.0, 94.2], [23.2, 93.5], [22.2, 93.2], [21.95, 92.7], [22.9, 92.3], [23.6, 92.0], [23.0, 91.5], [24.1, 91.3], [24.6, 92.2], [25.2, 92.4],
    [25.2, 90.0], [25.9, 89.85], [26.3, 89.3], [26.2, 88.5], [25.5, 88.1], [24.9, 88.2], [24.3, 88.6], [23.3, 88.6], [22.9, 88.9], [21.6, 89.0],
    [21.6, 87.6], [21.4, 87.0], [20.3, 86.7], [19.3, 85.0], [17.7, 83.3], [16.7, 82.3], [16.3, 81.3], [15.6, 80.2], [14.5, 80.2], [13.4, 80.3],
    [12.0, 79.9], [10.3, 79.9], [9.3, 79.2], [8.8, 78.2], [8.1, 77.5], [8.9, 76.5], [10.0, 76.2], [11.3, 75.7], [12.9, 74.8], [14.8, 74.1],
    [16.9, 73.3], [18.9, 72.8], [20.7, 72.9], [21.7, 72.6], [22.3, 72.3], [21.6, 72.1], [20.8, 70.9], [21.6, 69.3], [22.4, 69.0], [22.9, 70.3],
    [23.0, 69.0]
  ];
  var LANKA = [[9.8, 80.1], [8.5, 81.2], [6.9, 81.9], [6.0, 80.6], [6.5, 79.9], [8.0, 79.8]];
  var CITY = {
    delhi: ['New Delhi', 28.61, 77.21], mumbai: ['Mumbai', 19.08, 72.88], kolkata: ['Kolkata', 22.57, 88.36], chennai: ['Chennai', 13.08, 80.27],
    bengaluru: ['Bengaluru', 12.97, 77.59], hyderabad: ['Hyderabad', 17.39, 78.49], jaipur: ['Jaipur', 26.91, 75.79], ahmedabad: ['Ahmedabad', 23.02, 72.57],
    lucknow: ['Lucknow', 26.85, 80.95], patna: ['Patna', 25.59, 85.14], bhopal: ['Bhopal', 23.26, 77.41], nagpur: ['Nagpur', 21.15, 79.09],
    guwahati: ['Guwahati', 26.14, 91.74], srinagar: ['Srinagar', 34.08, 74.8], tvm: ['Thiruvananthapuram', 8.52, 76.94], pune: ['Pune', 18.52, 73.86],
    bbsr: ['Bhubaneswar', 20.3, 85.82], vizag: ['Visakhapatnam', 17.69, 83.22], solapur: ['Solapur', 17.66, 75.91], madurai: ['Madurai', 9.93, 78.12],
    jammu: ['Jammu', 32.73, 74.86], siliguri: ['Siliguri', 26.73, 88.4], kanya: ['Kanyakumari', 8.08, 77.55], north: ['Northern tip', 37.08, 74.6]
  };
  var MAIN = ['delhi', 'mumbai', 'kolkata', 'chennai', 'bengaluru', 'hyderabad', 'guwahati', 'srinagar', 'bhopal'];
  var ROUTES = {
    dm: { name: 'New Delhi → Mumbai (via Jaipur, Ahmedabad)', via: ['delhi', 'jaipur', 'ahmedabad', 'mumbai'] },
    dk: { name: 'New Delhi → Kolkata (via Lucknow, Patna)', via: ['delhi', 'lucknow', 'patna', 'kolkata'] },
    mc: { name: 'Mumbai → Chennai (via Pune, Solapur, Hyderabad)', via: ['mumbai', 'pune', 'solapur', 'hyderabad', 'chennai'] },
    ck: { name: 'Chennai → Kolkata (via Visakhapatnam, Bhubaneswar)', via: ['chennai', 'vizag', 'bbsr', 'kolkata'] },
    bt: { name: 'Bengaluru → Thiruvananthapuram (via Madurai)', via: ['bengaluru', 'madurai', 'tvm'] },
    ds: { name: 'New Delhi → Srinagar (via Jammu)', via: ['delhi', 'jammu', 'srinagar'] },
    dg: { name: 'New Delhi → Guwahati (via Lucknow, Patna, Siliguri)', via: ['delhi', 'lucknow', 'patna', 'siliguri', 'guwahati'] },
    ns: { name: 'Length of India: Kanyakumari → northern tip', via: ['kanya', 'north'] }
  };

  function km(lat, lon) { return [(lon - 80) * KX, -lat * KY]; }
  var BOX = (function () {
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    INDIA.concat(LANKA).forEach(function (p) { var q = km(p[0], p[1]); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    return { x0: x0 - 60, x1: x1 + 60, y0: y0 - 40, y1: y1 + 40 };
  })();
  function cityKm(id) { var c = CITY[id]; return km(c[1], c[2]); }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function routeKm(r) { var t = 0; for (var i = 1; i < r.via.length; i++) t += dist(cityKm(r.via[i - 1]), cityKm(r.via[i])); return t; }
  function indian(n) {
    var s = String(Math.round(n)), last = s.slice(-3), rest = s.slice(0, -3);
    return (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last;
  }
  function cmStr(v) { return M.fmt(v, 1) + ' cm'; }
  function kmStr(v) { return indian(Math.round(v / 10) * 10) + ' km'; }

  SimLab.createSim({
    ariaLabel: 'A map of India with cities, a ruler that can be dragged between any two places and a thread along a road route, with the scale written as a statement, a ratio and a line scale',
    transport: false,
    mobileAspect: '3 / 3.4',
    params: [
      { id: 'scale', label: '1 cm on the map represents', min: 50, max: 250, step: 25, value: 100, unit: 'km',
        presets: [{ label: '50 km', value: 50 }, { label: '100 km', value: 100 }, { label: '200 km', value: 200 }] },
      { id: 'route', label: 'Route', type: 'select', value: 'dm', options: Object.keys(ROUTES).map(function (k) { return { value: k, label: ROUTES[k].name }; }) },
      { id: 'thread', label: 'Lay a thread along the route', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'statement', label: 'Statement scale', short: 'Scale' },
      { id: 'rf', label: 'Ratio scale (RF)', key: true, short: 'RF' },
      { id: 'ruler', label: 'Ruler reads (on the map)', short: 'Ruler', key: true },
      { id: 'real', label: 'Straight-line distance on the ground', short: 'Real distance', key: true },
      { id: 'thread', label: 'Thread along the route' },
      { id: 'india', label: 'Length of India on this map' }
    ],
    onParam: function (sim, id, v) { if (id === 'route') setRoute(sim, v); return true; },
    reset: function (sim) { sim.state = { drag: null }; setRoute(sim, sim.p.route); },
    readout: function (sim) {
      var s = sim.state, sc = sim.p.scale, d = dist(s.a, s.b), r = ROUTES[sim.p.route], t = routeKm(r);
      return {
        statement: '1 cm represents ' + sc + ' km',
        rf: '1 : ' + indian(sc * 100000),
        ruler: cmStr(d / sc),
        real: kmStr(d),
        thread: sim.p.thread ? cmStr(t / sc) + ' → ' + kmStr(t) : 'switched off',
        india: cmStr(3214 / sc) + ' north to south'
      };
    },
    status: function (sim) { return '1 cm on the map = ' + sim.p.scale + ' km on the ground'; },
    draw: function (sim) { draw(sim); },
    pointer: {
      hover: function (sim, x, y) { return near(sim, x, y) !== null; },
      down: function (sim, x, y) {
        var L = layout(sim); if (x < L.mx || x > L.mx + L.mw || y < L.my || y > L.my + L.mh) return false;
        var s = sim.state, p = L.inv(x, y), snap = snapCity(L, x, y);
        s.drag = dist(p, s.a) <= dist(p, s.b) ? 'a' : 'b'; s[s.drag] = snap || p; sim.redraw(); return true;
      },
      move: function (sim, x, y) {
        var s = sim.state; if (!s.drag) return;
        var L = layout(sim); s[s.drag] = snapCity(L, x, y) || L.inv(M.clamp(x, L.mx, L.mx + L.mw), M.clamp(y, L.my, L.my + L.mh)); sim.redraw();
      },
      up: function (sim) { sim.state.drag = null; }
    }
  });

  function setRoute(sim, k) {
    var r = ROUTES[k] || ROUTES.dm;
    sim.state.a = cityKm(r.via[0]); sim.state.b = cityKm(r.via[r.via.length - 1]);
  }
  function near(sim, x, y) {
    var L = layout(sim), s = sim.state, pa = L.P(s.a), pb = L.P(s.b);
    if (Math.hypot(x - pa[0], y - pa[1]) < 24) return 'a';
    if (Math.hypot(x - pb[0], y - pb[1]) < 24) return 'b';
    return x > L.mx && x < L.mx + L.mw && y > L.my && y < L.my + L.mh ? 'map' : null;
  }
  function snapCity(L, x, y) {
    var best = null, bd = 12;
    Object.keys(CITY).forEach(function (id) { var p = L.P(cityKm(id)), d = Math.hypot(x - p[0], y - p[1]); if (d < bd) { bd = d; best = cityKm(id); } });
    return best;
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, pad = 8, side = W > H * 1.25 && W >= 560;
    var aw = side ? W * 0.6 : W - 2 * pad, ah = H - 2 * pad;
    var bw = BOX.x1 - BOX.x0, bh = BOX.y1 - BOX.y0, k = Math.min(aw / bw, ah / bh);
    var mw = bw * k, mh = bh * k, mx = side ? pad : (W - mw) / 2, my = (H - mh) / 2;
    return {
      side: side, k: k, mx: mx, my: my, mw: mw, mh: mh, px: mx + mw + 16, pw: W - mx - mw - 24,
      P: function (q) { return [mx + (q[0] - BOX.x0) * k, my + (q[1] - BOX.y0) * k]; },
      inv: function (x, y) { return [BOX.x0 + (x - mx) / k, BOX.y0 + (y - my) / k]; }
    };
  }

  function draw(sim) {
    var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, L = layout(sim), sc = sim.p.scale;
    var cmPx = L.k * sc, r = ROUTES[sim.p.route];
    D.clear(ctx, W, H, c.bg);
    D.roundRect(ctx, L.mx, L.my, L.mw, L.mh, 6, c.light ? '#dbeafe' : '#0b2a4a');
    function shape(pts, fill) {
      ctx.beginPath();
      pts.forEach(function (p, i) { var q = L.P(km(p[0], p[1])); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = c.light ? '#78716c' : '#a8a29e'; ctx.lineWidth = 1; ctx.stroke();
    }
    shape(INDIA, c.light ? '#fef3c7' : '#3f4d2e');
    shape(LANKA, c.light ? '#e7e5e4' : '#334155');
    // grid of latitude every 10°
    [10, 20, 30].forEach(function (lat) {
      var y = L.P(km(lat, 80))[1];
      D.line(ctx, L.mx, y, L.mx + L.mw, y, c.light ? 'rgba(30,64,175,0.15)' : 'rgba(186,230,253,0.12)', 1, [3, 4]);
      D.text(ctx, lat + '° N', L.mx + 3, y - 6, { color: c.faint, size: 9 });
    });
    var tc = L.P(km(23.44, 80));
    D.text(ctx, 'Tropic of Cancer', L.mx + L.mw - 4, tc[1] - 6, { color: c.faint, size: 9, align: 'right' });
    D.line(ctx, L.mx, tc[1], L.mx + L.mw, tc[1], c.light ? 'rgba(220,38,38,0.25)' : 'rgba(248,113,113,0.25)', 1, [5, 3]);

    // ruler from A to B, marked in map centimetres
    var pa = L.P(s.a), pb = L.P(s.b), len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]), ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]);
    ctx.save(); ctx.translate(pa[0], pa[1]); ctx.rotate(ang);
    var rw = 16, flip = Math.abs(ang) > Math.PI / 2;
    D.roundRect(ctx, -6, -rw, len + 12, rw, 3, c.light ? 'rgba(255,255,255,0.88)' : 'rgba(250,250,240,0.85)', '#a16207', 1);
    var every = cmPx < 7 ? 5 : cmPx < 14 ? 2 : 1;
    for (var k = 0, n = len / cmPx; k <= n + 1e-6; k++) {
      var x = k * cmPx, major = k % every === 0;
      D.line(ctx, x, 0, x, major ? -9 : -4, '#422006', 1);
      if (major && k > 0 && x < len - 6) {
        ctx.save(); ctx.translate(x, -12); if (flip) ctx.rotate(Math.PI);
        D.text(ctx, String(k), 0, 0, { color: '#422006', size: 8, weight: 700, align: 'center' }); ctx.restore();
      }
    }
    ctx.restore();
    // thread along the route
    if (sim.p.thread) {
      ctx.save(); ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.setLineDash([]);
      ctx.beginPath(); r.via.forEach(function (id, i) { var q = L.P(cityKm(id)); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); ctx.restore();
    }
    // cities
    var showAll = L.mw > 380, onRoute = {};
    r.via.forEach(function (id) { onRoute[id] = true; });
    Object.keys(CITY).forEach(function (id) {
      var q = L.P(cityKm(id)), isMain = MAIN.indexOf(id) >= 0;
      if (!onRoute[id] && !isMain && id !== 'kanya' && id !== 'north') return;
      D.circle(ctx, q[0], q[1], onRoute[id] ? 3.5 : 2.5, onRoute[id] ? '#f97316' : (c.light ? '#1e293b' : '#e2e8f0'));
      if (onRoute[id] || (isMain && showAll)) {
        var left = ['mumbai', 'bengaluru', 'pune', 'srinagar', 'jammu', 'tvm', 'kanya', 'north', 'solapur'].indexOf(id) >= 0;
        D.text(ctx, CITY[id][0], q[0] + (left ? -6 : 6), q[1], { color: c.light ? '#1e293b' : '#f1f5f9', size: showAll ? 10 : 9, weight: onRoute[id] ? 700 : 500, align: left ? 'right' : 'left', fit: W });
      }
    });

    D.line(ctx, pa[0], pa[1], pb[0], pb[1], '#db2777', 2);
    [['A', pa], ['B', pb]].forEach(function (e) { D.circle(ctx, e[1][0], e[1][1], 8, '#db2777', '#fff', 2); D.text(ctx, e[0], e[1][0], e[1][1] + 0.5, { color: '#fff', size: 9, weight: 800, align: 'center' }); });
    var mid = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], d = dist(s.a, s.b);
    D.text(ctx, cmStr(d / sc) + ' = ' + kmStr(d), mid[0] + 14 * Math.sin(ang), mid[1] - 14 * Math.cos(ang) + (Math.cos(ang) < 0 ? 28 : 0), { color: '#fff', size: 11, weight: 700, align: 'center', bg: 'rgba(190,24,93,0.9)', pad: 3, fit: W });

    // scale box
    var bx, by, bw;
    if (L.side) { bx = L.px; by = L.my + 6; bw = Math.min(L.pw, 320); }
    else { bw = Math.min(L.mw * 0.4, 150); bx = L.mx + L.mw - bw - 4; by = L.my + 4; }
    var big = L.side, lh = big ? 18 : 13, fs = big ? 12 : 9;
    var rows = [['Statement', '1 cm represents ' + sc + ' km'], ['Ratio (RF)', '1 : ' + indian(sc * 100000)]];
    var boxH = big ? 26 + rows.length * lh + 44 : 18 + rows.length * lh + 26;
    D.roundRect(ctx, bx, by, bw, boxH, 8, c.light ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.88)', c.border, 1);
    D.text(ctx, 'Scale of this map', bx + 8, by + (big ? 14 : 10), { color: c.ink, size: fs + 1, weight: 700 });
    var yy = by + (big ? 34 : 24);
    rows.forEach(function (rw2) {
      if (big) { D.text(ctx, rw2[0], bx + 8, yy, { color: c.muted, size: fs }); D.text(ctx, rw2[1], bx + 88, yy, { color: c.ink, size: fs, weight: 700, fit: bx + bw }); yy += lh; }
      else { D.text(ctx, (rw2[0] === 'Statement' ? '' : 'RF  ') + rw2[1], bx + 6, yy, { color: c.ink, size: fs, weight: 700, fit: bx + bw }); yy += lh; }
    });
    // line scale: a bar a few centimetres long, labelled in km
    var unit = [1, 2, 5, 10].filter(function (n2) { return n2 * cmPx >= (big ? 30 : 24); })[0] || 10;
    var segs = Math.max(unit, unit * Math.floor((bw - 34) / cmPx / unit)), x0 = bx + 10, y0 = big ? yy + 10 : yy - 3;
    if (big) D.text(ctx, 'Line scale', bx + 8, yy, { color: c.muted, size: fs });
    for (var q = 0; q < segs; q += unit) {
      ctx.fillStyle = (q / unit) % 2 ? (c.light ? '#fff' : '#475569') : (c.light ? '#1e293b' : '#e2e8f0');
      ctx.fillRect(x0 + q * cmPx, y0, unit * cmPx, 6);
    }
    ctx.strokeStyle = c.light ? '#1e293b' : '#e2e8f0'; ctx.lineWidth = 1; ctx.strokeRect(x0, y0, segs * cmPx, 6);
    for (var q2 = 0; q2 <= segs; q2 += unit) D.text(ctx, String(q2 * sc), x0 + q2 * cmPx, y0 + 14, { color: c.ink, size: big ? 10 : 8, align: 'center' });
    D.text(ctx, 'km', x0 + segs * cmPx + 6, y0 + 3, { color: c.muted, size: big ? 10 : 8 });

    if (L.side) {
      var ty = by + boxH + 26, t = routeKm(r);
      var lines = [
        ['Ruler (straight line)', cmStr(d / sc) + ' × ' + sc + ' km = ' + kmStr(d), '#db2777'],
        sim.p.thread ? ['Thread along the route', cmStr(t / sc) + ' × ' + sc + ' km = ' + kmStr(t), '#f97316'] : null,
        ['Length of India on this map', cmStr(3214 / sc) + ' (3,214 km)', c.muted]
      ].filter(Boolean);
      lines.forEach(function (l2) {
        D.text(ctx, l2[0], bx, ty, { color: c.muted, size: 11 });
        D.text(ctx, l2[1], bx, ty + 18, { color: l2[2] === c.muted ? c.ink : l2[2], size: 15, weight: 700, font: 'Space Grotesk, Inter, sans-serif', fit: W });
        ty += 50;
      });
      D.text(ctx, 'Drag A or B, or tap a city, to measure.', bx, ty, { color: c.faint, size: 11, fit: W });
      D.text(ctx, 'The map is zoomed to fit your screen: the ruler', bx, ty + 18, { color: c.faint, size: 10, fit: W });
      D.text(ctx, 'and the line scale use this map’s own centimetres.', bx, ty + 32, { color: c.faint, size: 10, fit: W });
    }
  }
})();
