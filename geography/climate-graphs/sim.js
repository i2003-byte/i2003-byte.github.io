/* =====================================================================
   Weather and climate · Climate Graphs of Indian Cities — sim.js
   ---------------------------------------------------------------------
   A climate graph (climograph) shows a place's normal weather through
   the year: monthly rainfall as bars (left axis, mm) and the monthly
   mean temperature as a line (right axis, °C).
   Data: rounded long-term monthly normals (about 30-year averages of
   IMD records). Mean temperature = average of the day's maximum and
   minimum. Leh's "rain" includes melted snow.
   Read-outs:
     annual rain        = sum of the 12 monthly totals
     temperature range  = warmest month − coldest month
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var CITIES = {
    mumbai: { name: 'Mumbai', place: 'Maharashtra coast', lat: 19.1, lon: 72.9, type: 'Tropical monsoon',
      t: [24, 25, 27, 29, 30, 29, 28, 27, 28, 29, 28, 26], r: [1, 0, 0, 1, 11, 520, 840, 590, 340, 90, 15, 5] },
    delhi: { name: 'Delhi', place: 'northern plains', lat: 28.6, lon: 77.2, type: 'Hot summer, cool winter',
      t: [14, 18, 23, 29, 33, 34, 31, 30, 29, 26, 21, 16], r: [20, 20, 15, 10, 30, 75, 210, 250, 125, 15, 5, 10] },
    chennai: { name: 'Chennai', place: 'Tamil Nadu coast', lat: 13.1, lon: 80.3, type: 'Tropical, autumn rain',
      t: [25, 26, 28, 31, 33, 32, 31, 30, 30, 28, 26, 25], r: [25, 5, 5, 15, 50, 55, 100, 130, 130, 280, 350, 140] },
    kolkata: { name: 'Kolkata', place: 'Ganga delta', lat: 22.6, lon: 88.4, type: 'Tropical wet and dry',
      t: [20, 23, 28, 30, 31, 31, 29, 29, 29, 28, 24, 20], r: [10, 25, 35, 55, 135, 300, 360, 350, 300, 160, 30, 5] },
    jaisalmer: { name: 'Jaisalmer', place: 'Thar desert', lat: 26.9, lon: 70.9, type: 'Hot desert',
      t: [16, 19, 25, 30, 34, 34, 32, 30, 30, 27, 22, 17], r: [2, 3, 3, 2, 6, 15, 70, 70, 30, 3, 2, 2] },
    leh: { name: 'Leh', place: 'Ladakh, 3,500 m high', lat: 34.2, lon: 77.6, type: 'Cold desert',
      t: [-7, -5, 1, 6, 10, 14, 18, 17, 13, 7, 1, -4], r: [10, 8, 10, 7, 7, 4, 15, 15, 8, 4, 3, 6] },
    bengaluru: { name: 'Bengaluru', place: 'Deccan plateau, 920 m', lat: 13.0, lon: 77.6, type: 'Mild plateau',
      t: [21, 23, 26, 28, 27, 24, 23, 23, 23, 23, 22, 21], r: [3, 7, 15, 50, 120, 90, 110, 150, 210, 170, 55, 15] },
    tvm: { name: 'Thiruvananthapuram', short: 'T’puram', place: 'Kerala coast', lat: 8.5, lon: 76.9, type: 'Wet, two rainy seasons',
      t: [27, 28, 29, 29, 29, 27, 27, 27, 27, 27, 27, 27], r: [20, 20, 40, 120, 220, 330, 220, 170, 190, 290, 210, 70] },
    sohra: { name: 'Sohra (Cherrapunji)', short: 'Sohra', place: 'Meghalaya hills, 1,480 m', lat: 25.3, lon: 91.7, type: 'Very wet hills',
      t: [12, 13, 16, 18, 19, 20, 21, 21, 20, 18, 15, 13], r: [20, 50, 200, 650, 1200, 2700, 2900, 1900, 1200, 500, 60, 10] }
  };
  var IDS = Object.keys(CITIES);
  var LAND = [60, 25.3, 61.6, 25.2, 64, 25.3, 66.6, 25.4, 67.3, 24.8, 68.4, 23.5, 69.0, 22.3, 70.0, 21.0, 71.2, 20.8, 72.4, 21.8, 72.7, 21.2,
    72.9, 20.2, 72.8, 19.0, 73.2, 17.3, 73.6, 16.0, 74.1, 14.8, 74.6, 13.5, 74.9, 12.6, 75.4, 11.7, 75.9, 10.9, 76.3, 9.6, 76.7, 8.7,
    77.5, 8.1, 78.1, 8.8, 78.9, 9.3, 79.3, 10.3, 79.8, 10.4, 79.9, 11.8, 80.3, 13.3, 80.1, 15.2, 80.9, 15.8, 81.6, 16.4, 82.4, 16.8,
    83.4, 17.8, 84.5, 18.9, 85.4, 19.7, 86.5, 20.2, 86.9, 21.3, 87.8, 21.6, 88.6, 21.7, 89.3, 21.8, 90.3, 22.0, 91.0, 22.5, 91.8, 22.3,
    92.2, 21.0, 92.6, 20.3, 93.5, 19.4, 94.2, 17.9, 94.3, 16.2, 95.3, 15.8, 96.5, 16.6, 97.4, 16.6, 97.7, 15.0, 98.2, 13.5, 98.6, 11.5,
    98.6, 10, 99.5, 8, 101, 6, 101, 40, 60, 40];
  var LANKA = [79.9, 9.8, 80.9, 9.0, 81.9, 7.4, 81.6, 6.3, 80.6, 5.9, 79.9, 6.8, 79.8, 8.2];
  var T0 = -10, T1 = 40, st = { mystery: null, geo: null };

  function sum(a) { return a.reduce(function (s, v) { return s + v; }, 0); }
  function argMax(a) { var k = 0; a.forEach(function (v, i) { if (v > a[k]) k = i; }); return k; }
  function argMin(a) { var k = 0; a.forEach(function (v, i) { if (v < a[k]) k = i; }); return k; }
  function shown(p) { return CITIES[st.mystery || p.city] || CITIES.mumbai; }
  function other(p) { return !st.mystery && p.compare !== 'none' && p.compare !== p.city ? CITIES[p.compare] : null; }
  function label(ct) { return ct.short || ct.name; }

  function geo(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, side = W >= 620 && W > H * 1.2;
    var panelW = side ? Math.min(250, W * 0.3) : 0;
    var top = narrow ? 52 : 62, bottom = narrow ? 26 : 32, l = narrow ? 40 : 54, r = W - panelW - (narrow ? 34 : 50);
    return { W: W, H: H, narrow: narrow, side: side, panelW: panelW, top: top, l: l, r: r, b: H - bottom, cw: (r - l) / 12 };
  }
  function niceMax(v) { var s = D.niceStep(v, 4); return Math.ceil(v * 1.05 / s) * s; }

  function checkGuess(sim, id) {
    if (!st.mystery) return;
    var m = CITIES[st.mystery];
    if (id === st.mystery) { sim.toast('Correct! It is ' + m.name + ' (' + m.place + ').'); st.mystery = null; return; }
    var g = CITIES[id], tip;
    if (sum(g.r) > sum(m.r) * 1.6) tip = 'the mystery city is much drier than ' + label(g);
    else if (sum(g.r) < sum(m.r) / 1.6) tip = 'the mystery city is much wetter than ' + label(g);
    else if (Math.max.apply(null, g.t) - Math.min.apply(null, g.t) > Math.max.apply(null, m.t) - Math.min.apply(null, m.t) + 4) tip = 'its temperature changes less over the year';
    else if (argMax(g.r) !== argMax(m.r)) tip = 'look at which month is the wettest';
    else tip = 'compare the winter temperatures';
    sim.toast('Not ' + label(g) + '. Hint: ' + tip + '.');
  }

  SimLab.createSim({
    ariaLabel: 'A climate graph: blue bars show the rainfall of each month and a red line shows the monthly mean temperature of an Indian city, with an optional second city to compare and a small map of India marking the city',
    transport: false,
    mobileAspect: '3 / 3.2',
    params: [
      { id: 'city', label: 'City', type: 'select', value: 'mumbai', options: IDS.map(function (id) { return { value: id, label: CITIES[id].name }; }),
        help: 'In a mystery round, pick the city you think the graph belongs to.' },
      { id: 'compare', label: 'Compare with', type: 'select', value: 'none', options: [{ value: 'none', label: 'Nothing' }].concat(IDS.map(function (id) { return { value: id, label: CITIES[id].name }; })) },
      { id: 'month', label: 'Month', min: 1, max: 12, step: 1, value: 7, format: function (v) { return MON[v - 1]; }, help: 'Or tap a month on the graph.' },
      { id: 'fixed', label: 'Same rain scale for every city (0–3,000 mm)', type: 'toggle', value: false }
    ],
    buttonsTitle: 'Quiz',
    buttons: [
      { label: '🎲 Mystery city', primary: true, onClick: function (sim) {
        var pool = IDS.filter(function (id) { return id !== sim.p.city && id !== st.mystery; });
        st.mystery = pool[Math.floor(Math.random() * pool.length)];
        sim.toast('Whose climate is this? Pick the city from the list.');
      } },
      { label: 'Reveal', onClick: function (sim) {
        if (!st.mystery) { sim.toast('Start a mystery round first'); return; }
        var id = st.mystery; st.mystery = null; sim.setParam('city', id); sim.toast('It was ' + CITIES[id].name + '.');
      } }
    ],
    readouts: [
      { id: 'annual', label: 'Rain in a year', unit: 'mm', digits: 0, key: true },
      { id: 'range', label: 'Temperature range', short: 'Temp range', unit: '°C', digits: 0, key: true },
      { id: 'hot', label: 'Warmest month', short: 'Warmest', key: true },
      { id: 'cold', label: 'Coldest month' },
      { id: 'wet', label: 'Wettest month' },
      { id: 'dry', label: 'Months with under 50 mm' },
      { id: 'type', label: 'Climate type' },
      { id: 'mon', label: 'Chosen month' }
    ],
    reset: function () {},
    onParam: function (sim, id, v) { if (id === 'city') checkGuess(sim, v); return true; },
    pointer: {
      hover: function (sim, x, y) { var g = st.geo; return !!g && x >= g.l && x <= g.r && y >= g.top && y <= g.b; },
      down: function (sim, x, y) {
        var g = st.geo; if (!g || x < g.l || x > g.r || y < g.top - 10 || y > g.b + 20) return false;
        sim.setParam('month', M.clamp(Math.floor((x - g.l) / g.cw) + 1, 1, 12)); return true;
      }
    },
    readout: function (sim) {
      var ct = shown(sim.p), m = sim.p.month - 1, hi = argMax(ct.t), lo = argMin(ct.t), wet = argMax(ct.r);
      return {
        annual: sum(ct.r), range: ct.t[hi] - ct.t[lo],
        hot: MON[hi] + ' ' + ct.t[hi] + ' °C', cold: MON[lo] + ' ' + ct.t[lo] + ' °C',
        wet: MON[wet] + ' ' + ct.r[wet] + ' mm', dry: ct.r.filter(function (v) { return v < 50; }).length,
        type: st.mystery ? '? (mystery)' : ct.type,
        mon: MON[m] + ': ' + ct.r[m] + ' mm, ' + ct.t[m] + ' °C'
      };
    },
    status: function (sim) { return st.mystery ? 'Mystery city: guess it' : CITIES[sim.p.city].name; },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, g = geo(sim), W = g.W, H = g.H, ct = shown(p), o = other(p), m = p.month - 1;
      st.geo = g;
      D.clear(ctx, W, H, c.bg);
      var fs = g.narrow ? 10 : 12;
      var rMax = p.fixed ? 3000 : niceMax(Math.max(Math.max.apply(null, ct.r), o ? Math.max.apply(null, o.r) : 0, 50));
      var rs = D.niceStep(rMax, g.narrow ? 4 : 5);
      function YR(v) { return g.b - v / rMax * (g.b - g.top); }
      function YT(v) { return g.b - (v - T0) / (T1 - T0) * (g.b - g.top); }
      function XC(i) { return g.l + (i + 0.5) * g.cw; }
      var tCol = c.danger, rCol = c.light ? '#2563eb' : '#60a5fa', oCol = c.warning;

      // chosen month band
      ctx.fillStyle = D.alpha(c.ink, 0.07); ctx.fillRect(g.l + m * g.cw, g.top, g.cw, g.b - g.top);
      // grid and axes
      for (var v = 0; v <= rMax + 1e-6; v += rs) {
        D.line(ctx, g.l, YR(v), g.r, YR(v), c.grid, 1);
        D.text(ctx, v >= 1000 ? M.fmt(v / 1000, v % 1000 ? 1 : 0) + 'k' : String(v), g.l - 5, YR(v), { color: rCol, size: fs - 1, align: 'right' });
      }
      for (var tv = T0; tv <= T1; tv += 10) D.text(ctx, String(tv), g.r + 5, YT(tv), { color: tCol, size: fs - 1 });
      D.text(ctx, 'rain (mm)', 4, g.top - (g.narrow ? 12 : 14), { color: rCol, size: fs - 1, weight: 700 });
      D.text(ctx, '°C', g.r + 5, g.top - (g.narrow ? 12 : 14), { color: tCol, size: fs - 1, weight: 700 });
      if (T0 < 0) D.line(ctx, g.l, YT(0), g.r, YT(0), D.alpha(tCol, 0.4), 1, [3, 3]);
      // bars
      var bw = g.cw * (o ? 0.36 : 0.62);
      ct.r.forEach(function (r, i) {
        var x = XC(i) - (o ? bw : bw / 2), y = YR(Math.min(r, rMax));
        ctx.fillStyle = i === m ? rCol : D.alpha(rCol, 0.7); ctx.fillRect(x, y, bw, g.b - y);
        if (r > rMax) D.text(ctx, '▲', x + bw / 2, g.top + 6, { color: rCol, size: 9, align: 'center' });
      });
      if (o) o.r.forEach(function (r, i) {
        var x = XC(i), y = YR(Math.min(r, rMax));
        ctx.fillStyle = D.alpha(oCol, i === m ? 0.85 : 0.5); ctx.fillRect(x, y, bw, g.b - y);
      });
      // temperature lines
      function tline(arr, col, dash) {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = g.narrow ? 2.2 : 2.8; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash([6, 4]);
        ctx.beginPath(); arr.forEach(function (t, i) { ctx[i ? 'lineTo' : 'moveTo'](XC(i), YT(t)); }); ctx.stroke(); ctx.restore();
        arr.forEach(function (t, i) { D.circle(ctx, XC(i), YT(t), i === m ? 4.5 : 2.6, col, i === m ? c.bg : null, 1.5); });
      }
      if (o) tline(o.t, oCol, true);
      tline(ct.t, tCol, false);
      ctx.strokeStyle = c.axis; ctx.lineWidth = 1; ctx.strokeRect(g.l + 0.5, g.top + 0.5, g.r - g.l, g.b - g.top);
      MON.forEach(function (mn, i) { D.text(ctx, g.narrow ? mn[0] : mn, XC(i), g.b + (g.narrow ? 11 : 14), { color: i === m ? c.ink : c.muted, size: fs, weight: i === m ? 700 : 500, align: 'center' }); });
      // value label for the chosen month
      var vy = Math.min(YR(Math.min(ct.r[m], rMax)), YT(ct.t[m])) - 14, vx = XC(m);
      D.text(ctx, ct.r[m] + ' mm · ' + ct.t[m] + ' °C', vx, Math.max(g.top + 10, vy), { color: c.ink, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 3, fit: g.r + 20 });

      // title + legend
      var title = st.mystery ? 'Mystery city: whose climate is this?' : ct.name + ' · ' + ct.place;
      D.text(ctx, title, (g.l + g.r) / 2, g.narrow ? 13 : 17, { color: c.bg, bg: st.mystery ? c.warning : c.s1, size: g.narrow ? 12 : 14, weight: 700, align: 'center', pad: 4, fit: W - g.panelW });
      var lg = (st.mystery ? 'mystery' : label(ct)) + ': ' + Math.round(sum(ct.r)) + ' mm a year' + (o ? '   vs   ' + label(o) + ': ' + sum(o.r) + ' mm' : '');
      D.text(ctx, lg, (g.l + g.r) / 2, g.narrow ? 32 : 40, { color: o ? c.ink : c.muted, size: fs, weight: 600, align: 'center', fit: W - g.panelW });
      if (o) {
        D.text(ctx, '■ ' + label(ct), g.l + 4, g.top + 10, { color: rCol, size: fs - 1, weight: 700, bg: D.alpha(c.bg, 0.7), pad: 2 });
        D.text(ctx, '■ ' + label(o) + ' (dashed)', g.l + 4, g.top + 26, { color: oCol, size: fs - 1, weight: 700, bg: D.alpha(c.bg, 0.7), pad: 2 });
      }

      // side panel: locator map + facts
      if (g.side) {
        var px = W - g.panelW + 6, pw = g.panelW - 14, py = 10, ph = H - 20;
        D.roundRect(ctx, px, py, pw, ph, 10, D.alpha(c.ink, 0.04), c.grid, 1);
        var LON0 = 66, LON1 = 98, LAT0 = 37, LAT1 = 6, kx = Math.cos(22 * Math.PI / 180);
        var mapW = pw - 20, mapH = Math.min(ph * 0.55, mapW * (LAT0 - LAT1) / ((LON1 - LON0) * kx));
        var mw = mapH * (LON1 - LON0) * kx / (LAT0 - LAT1), mx = px + (pw - mw) / 2, my = py + 12;
        function MX(lon) { return mx + (lon - LON0) / (LON1 - LON0) * mw; }
        function MY(lat) { return my + (LAT0 - lat) / (LAT0 - LAT1) * mapH; }
        ctx.save(); ctx.beginPath(); ctx.rect(mx, my, mw, mapH); ctx.clip();
        ctx.fillStyle = c.light ? '#bfdbfe' : '#1e3a5f'; ctx.fillRect(mx, my, mw, mapH);
        [LAND, LANKA].forEach(function (poly) {
          ctx.beginPath(); for (var i = 0; i < poly.length; i += 2) ctx[i ? 'lineTo' : 'moveTo'](MX(poly[i]), MY(poly[i + 1])); ctx.closePath();
          ctx.fillStyle = c.light ? '#a3b18a' : '#4d6b3c'; ctx.fill();
        });
        ctx.restore();
        IDS.forEach(function (id) {
          var q = CITIES[id], on = !st.mystery && id === p.city, oo = o && id === p.compare;
          D.circle(ctx, MX(q.lon), MY(q.lat), on || oo ? 5 : 2.5, on ? rCol : oo ? oCol : 'rgba(255,255,255,0.8)', '#000', 1);
        });
        if (!st.mystery) D.text(ctx, label(ct), MX(ct.lon) + (ct.lon > 86 ? -8 : 8), MY(ct.lat) - 9, { color: '#fff', size: 11, weight: 700, align: ct.lon > 86 ? 'right' : 'left', bg: 'rgba(0,0,0,0.6)', pad: 2 });
        var fy = my + mapH + 22, lines = st.mystery ? ['Look at the bars and the line.', 'Wet or dry? Hot or cold?', 'One rainy season or two?'] : [
          ct.type, 'Wettest: ' + MON[argMax(ct.r)] + ' (' + Math.max.apply(null, ct.r) + ' mm)',
          'Warmest: ' + MON[argMax(ct.t)] + ', coldest: ' + MON[argMin(ct.t)],
          ct.r.filter(function (v) { return v < 50; }).length + ' dry months (under 50 mm)'];
        lines.forEach(function (s, i) { if (fy + i * 19 < py + ph - 6) D.text(ctx, s, px + 12, fy + i * 19, { color: i === 0 ? c.ink : c.muted, size: i === 0 ? 13 : 12, weight: i === 0 ? 700 : 500 }); });
      }
    }
  });
})();
