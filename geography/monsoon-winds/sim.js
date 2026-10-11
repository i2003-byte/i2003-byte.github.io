/* =====================================================================
   Weather and climate · Monsoon Winds over India — sim.js
   ---------------------------------------------------------------------
   Land heats up and cools down faster than the sea.
     April–September: north-west India is hotter than the Arabian Sea →
       low pressure over the land, higher pressure over the sea → moist
       winds blow from the sea to the land: the SOUTH-WEST monsoon.
       South of the equator they start as south-east trade winds and
       turn to the right after crossing the equator (Earth's spin).
     November–February: the land is cooler than the sea → high pressure
       over the land → dry winds blow from the land to the sea: the
       NORTH-EAST (winter) monsoon. Over the Bay of Bengal they pick up
       moisture and bring rain to Tamil Nadu in October–December.
   Numbers used (rounded long-term averages):
     land  = monthly mean temperature in north-west India (Jodhpur)
     sea   = sea-surface temperature of the Arabian Sea
     dates = normal onset and withdrawal dates of the monsoon for 17
             cities (IMD normals, rounded); the covered area on the map
             is interpolated between them
     rain  = monthly normal rainfall of the chosen city, mm
   Winds are drawn from typical patterns (smoothly interpolated between
   anchor arrows), not from a weather model.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var DAYS_PER_S = 10, MID = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var LAND_T = [17, 20, 25.5, 30.5, 34, 34, 31, 29, 29, 27.5, 22.5, 18.5];
  var SEA_T = [25.5, 25.5, 26.5, 28.5, 29.5, 28.5, 27, 26.5, 27, 28, 27.5, 26.5];
  var SEASON = [-1, -0.8, -0.3, 0, 0.25, 0.85, 1, 1, 0.75, -0.1, -0.6, -0.9];
  var LON0 = 62, LON1 = 98, LAT0 = 37, LAT1 = -6, KX = Math.cos(20 * Math.PI / 180);

  var CITIES = {
    mumbai: { name: 'Mumbai', lat: 19.1, lon: 72.9, on: 162, off: 281, rain: [1, 0, 0, 1, 11, 520, 840, 590, 340, 90, 15, 5] },
    chennai: { name: 'Chennai', lat: 13.1, lon: 80.3, on: 155, off: 288, rain: [25, 5, 5, 15, 50, 55, 100, 130, 130, 280, 350, 140] },
    kolkata: { name: 'Kolkata', lat: 22.6, lon: 88.4, on: 161, off: 285, rain: [10, 25, 35, 55, 135, 300, 360, 350, 300, 160, 30, 5] },
    delhi: { name: 'Delhi', lat: 28.6, lon: 77.2, on: 178, off: 268, rain: [20, 20, 15, 10, 30, 75, 210, 250, 125, 15, 5, 10] },
    sohra: { name: 'Sohra (Cherrapunji)', short: 'Sohra', lat: 25.3, lon: 91.7, on: 156, off: 283, rain: [20, 50, 200, 650, 1200, 2700, 2900, 1900, 1200, 500, 60, 10] },
    jaisalmer: { name: 'Jaisalmer', lat: 26.9, lon: 70.9, on: 186, off: 260, rain: [2, 3, 3, 2, 6, 15, 70, 70, 30, 3, 2, 2] },
    tvm: { name: 'Thiruvananthapuram', short: 'T’puram', lat: 8.5, lon: 76.9, on: 152, off: 288, rain: [20, 20, 40, 120, 220, 330, 220, 170, 190, 290, 210, 70] }
  };
  // [lat, lon, onset day, withdrawal day]
  var NORMALS = [[8.5, 76.9, 152, 288], [13.1, 80.3, 155, 288], [13.0, 77.6, 156, 288], [17.4, 78.5, 159, 283], [19.1, 72.9, 162, 281],
    [21.1, 79.1, 166, 279], [22.6, 88.4, 161, 285], [26.1, 91.7, 157, 283], [25.6, 85.1, 164, 281], [23.3, 77.4, 171, 274],
    [23.0, 72.6, 171, 271], [26.8, 80.9, 172, 274], [26.9, 75.8, 176, 266], [28.6, 77.2, 178, 268], [30.7, 76.8, 180, 266],
    [26.9, 70.9, 186, 260], [29.9, 73.9, 189, 260]];
  var LAND = [60, 25.3, 61.6, 25.2, 64, 25.3, 66.6, 25.4, 67.3, 24.8, 68.4, 23.5, 69.0, 22.3, 70.0, 21.0, 71.2, 20.8, 72.4, 21.8, 72.7, 21.2,
    72.9, 20.2, 72.8, 19.0, 73.2, 17.3, 73.6, 16.0, 74.1, 14.8, 74.6, 13.5, 74.9, 12.6, 75.4, 11.7, 75.9, 10.9, 76.3, 9.6, 76.7, 8.7,
    77.5, 8.1, 78.1, 8.8, 78.9, 9.3, 79.3, 10.3, 79.8, 10.4, 79.9, 11.8, 80.3, 13.3, 80.1, 15.2, 80.9, 15.8, 81.6, 16.4, 82.4, 16.8,
    83.4, 17.8, 84.5, 18.9, 85.4, 19.7, 86.5, 20.2, 86.9, 21.3, 87.8, 21.6, 88.6, 21.7, 89.3, 21.8, 90.3, 22.0, 91.0, 22.5, 91.8, 22.3,
    92.2, 21.0, 92.6, 20.3, 93.5, 19.4, 94.2, 17.9, 94.3, 16.2, 95.3, 15.8, 96.5, 16.6, 97.4, 16.6, 97.7, 15.0, 98.2, 13.5, 98.6, 11.5,
    98.6, 10, 99.5, 8, 101, 6, 101, 40, 60, 40];
  var LANKA = [79.9, 9.8, 80.9, 9.0, 81.9, 7.4, 81.6, 6.3, 80.6, 5.9, 79.9, 6.8, 79.8, 8.2];
  var HIMA = [[60, 36], [72, 35.5], [74, 34.5], [76, 33], [78, 31.2], [80, 30], [82, 29.3], [84, 28.4], [86, 27.9], [88, 27.7], [90, 27.9], [92, 28], [94, 28.6], [96, 28.5], [100, 28]];
  var GHATS = [[73.5, 20.8], [73.7, 18], [73.9, 16], [74.8, 13.2], [75.8, 11.2], [76.9, 9.5], [77.3, 8.4]];
  // anchor arrows [lon, lat, east, north] (direction the wind blows towards)
  var SW = [[62, -4, -0.3, 1], [75, -4, -0.3, 1], [90, -4, -0.2, 1], [62, 5, 1, 0.35], [75, 5, 1, 0.3], [88, 5, 0.9, 0.4], [97, 5, 0.6, 0.7],
    [64, 14, 1, 0.4], [70, 14, 1, 0.35], [76, 14, 1, 0.2], [80, 14, 0.9, 0.4], [86, 14, 0.5, 0.9], [92, 14, 0.4, 0.9], [97, 14, 0.3, 0.9],
    [65, 20, 0.9, 0.5], [72, 20, 0.9, 0.45], [78, 20, 0.8, 0.3], [84, 19, 0.5, 0.8], [89, 20, 0.3, 1], [93, 21, 0.2, 1],
    [70, 25, 0.6, 0.7], [75, 24, 0.3, 0.6], [80, 25, -0.6, 0.2], [86, 24, -0.8, 0.5], [90, 24, 0.1, 1], [92, 25, 0, 1],
    [76, 28, -0.8, 0.2], [82, 27, -1, 0.15], [88, 26.5, -0.8, 0.3], [72, 28, 0.3, 0.6]];
  var NE = [[62, -4, -0.3, -0.6], [80, -4, -0.2, -0.7], [95, -4, -0.3, -0.6], [65, 10, -0.9, -0.4], [75, 8, -0.8, -0.6], [85, 8, -0.8, -0.6],
    [95, 8, -0.8, -0.5], [65, 18, -0.9, -0.4], [72, 18, -0.8, -0.6], [78, 18, -0.6, -0.7], [85, 16, -0.7, -0.7], [92, 16, -0.7, -0.6],
    [70, 24, -0.5, -0.6], [75, 26, 0.2, -0.6], [80, 27, 0.7, -0.4], [86, 25, 0.6, -0.6], [90, 23, -0.4, -0.8], [94, 22, -0.6, -0.6],
    [72, 29, 0.6, -0.3], [78, 29, 0.8, -0.3]];

  var st = { day: 196, parts: [], pdt: 0 };

  function cyc(arr, day) {          // smooth monthly value for a day of the year
    var d = ((day % 365) + 365) % 365, i = 0;
    while (i < 11 && d >= MID[i + 1]) i++;
    var a = d < MID[0] ? 11 : i, b = (a + 1) % 12, da = MID[a], db = MID[b];
    if (db <= da) db += 365;
    var dd = d < da ? d + 365 : d;
    return M.lerp(arr[a], arr[b], M.clamp((dd - da) / (db - da), 0, 1));
  }
  function himaLat(lon) {
    for (var i = 0; i < HIMA.length - 1; i++) if (lon <= HIMA[i + 1][0]) return M.lerp(HIMA[i][1], HIMA[i + 1][1], (lon - HIMA[i][0]) / (HIMA[i + 1][0] - HIMA[i][0]));
    return 28;
  }
  function idw(lon, lat, pts, fu) {
    var sw = 0, su = 0, sv = 0;
    for (var i = 0; i < pts.length; i++) {
      var q = pts[i], d2 = (q[0] - lon) * (q[0] - lon) + (q[1] - lat) * (q[1] - lat) + 0.5, w = 1 / (d2 * d2);
      sw += w; su += w * q[2]; sv += w * q[3];
    }
    return [su / sw, sv / sw];
  }
  function normal(lon, lat) {        // interpolated [onset, withdrawal] day
    var sw = 0, so = 0, sf = 0;
    for (var i = 0; i < NORMALS.length; i++) {
      var q = NORMALS[i], d2 = (q[1] - lon) * (q[1] - lon) + (q[0] - lat) * (q[0] - lat) + 0.3, w = 1 / (d2 * d2);
      sw += w; so += w * q[2]; sf += w * q[3];
    }
    return [so / sw, sf / sw];
  }
  function covered(lon, lat, day) {
    if (lat > himaLat(lon) - 0.3 || lat > 32.5 || lon < 67) return false;
    var n = normal(lon, lat); return day >= n[0] && day < n[1];
  }
  function season(day) { return cyc(SEASON, day); }
  function wind(lon, lat, day) {
    var s = season(day), v;
    if (s >= 0) {
      v = idw(lon, lat, SW);
      var k = s;
      if (lat > 6 && lon > 67 && lat < himaLat(lon) && !covered(lon, lat, day) && isLand(lon, lat)) k *= 0.35;
      return [v[0] * k, v[1] * k];
    }
    v = idw(lon, lat, NE); return [v[0] * -s * 0.6, v[1] * -s * 0.6];
  }
  function inPoly(poly, x, y) {
    var c = false;
    for (var i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
      var xi = poly[i], yi = poly[i + 1], xj = poly[j], yj = poly[j + 1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function isLand(lon, lat) { return inPoly(LAND, lon, lat) || inPoly(LANKA, lon, lat); }
  function dateStr(day) {
    var d = Math.floor((((day - 1) % 365) + 365) % 365), cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], m = 11;
    while (m > 0 && d < cum[m]) m--;
    return (d - cum[m] + 1) + ' ' + MON[m];
  }
  function monthOf(day) { var d = (((day - 1) % 365) + 365) % 365, cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], m = 11; while (m > 0 && d < cum[m]) m--; return m; }
  function city(p) { return CITIES[p.city] || CITIES.mumbai; }
  function windName(day) {
    var s = season(day);
    return s > 0.45 ? 'Sea → land (south-west)' : s < -0.45 ? 'Land → sea (north-east)' : 'Weak, changing';
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, side = W > H * 1.15 && W >= 520;
    var top = narrow ? 34 : 42, bottom = side ? 10 : (narrow ? 46 : 52);
    var panelW = side ? Math.min(280, W * 0.36) : 0;
    var aw = W - panelW - 16, ah = H - top - bottom;
    var mapAspect = (LON1 - LON0) * KX / (LAT0 - LAT1);
    var mw = Math.min(aw, ah * mapAspect), mh = mw / mapAspect;
    var mx = 8 + (aw - mw) / 2, my = top + (ah - mh) / 2;
    return { W: W, H: H, narrow: narrow, side: side, top: top, panelW: panelW, mx: mx, my: my, mw: mw, mh: mh,
      X: function (lon) { return mx + (lon - LON0) / (LON1 - LON0) * mw; },
      Y: function (lat) { return my + (LAT0 - lat) / (LAT0 - LAT1) * mh; } };
  }
  function polyPath(ctx, L, pts) {
    ctx.beginPath();
    for (var i = 0; i < pts.length; i += 2) { var x = L.X(pts[i]), y = L.Y(pts[i + 1]); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.closePath();
  }
  function tempCol(t, sea) {
    if (sea) {                       // sea stays blue: deeper blue when cool, turquoise when warm
      var k = M.clamp((t - 24) / 6, 0, 1);
      return 'hsl(' + (215 - 40 * k).toFixed(0) + ',60%,' + (24 + 8 * k).toFixed(0) + '%)';
    }
    var h = M.clamp(130 - (t - 16) / 18 * 125, 5, 130);   // land: green when cool → red-brown when hot
    return 'hsl(' + h.toFixed(0) + ',45%,36%)';
  }
  function spawn(p, fresh) {
    for (var tries = 0; tries < 20; tries++) {
      var lon = LON0 + Math.random() * (LON1 - LON0), lat = LAT1 + Math.random() * (LAT0 - LAT1);
      if (lat < himaLat(lon) - 0.5) { p.lon = lon; p.lat = lat; break; }
    }
    p.life = 1.5 + Math.random() * 2.5; p.age = fresh ? Math.random() * p.life : 0;
  }
  function cloud(ctx, x, y, s, rainK, t) {
    ctx.save();
    if (rainK > 0) {
      ctx.strokeStyle = 'rgba(147,197,253,' + (0.4 + 0.5 * rainK).toFixed(2) + ')'; ctx.lineWidth = 1.4; ctx.beginPath();
      var nDrops = Math.round(3 + rainK * 5);
      for (var i = 0; i < nDrops; i++) {
        var dx = (i / (nDrops - 1) - 0.5) * s * 1.6, off = ((t * 1.6 + i * 0.37) % 1) * s * 0.9;
        ctx.moveTo(x + dx, y + s * 0.3 + off); ctx.lineTo(x + dx - s * 0.12, y + s * 0.3 + off + s * 0.35);
      }
      ctx.stroke();
    }
    var g = rainK > 0.5 ? 'rgba(148,163,184,0.95)' : 'rgba(226,232,240,0.92)';
    D.circle(ctx, x - s * 0.45, y + s * 0.1, s * 0.38, g); D.circle(ctx, x + s * 0.45, y + s * 0.1, s * 0.35, g);
    D.circle(ctx, x, y - s * 0.12, s * 0.5, g);
    ctx.restore();
  }

  SimLab.createSim({
    ariaLabel: 'A map of India and the seas around it through the year: wind streaks blow from the sea to the land in the south-west monsoon and from the land to the sea in winter, the land and sea are coloured by temperature, and the area the monsoon has reached is shaded blue with rain clouds',
    playLabel: 'Run the year',
    mobileAspect: '3 / 3.4',
    params: [
      { id: 'month', label: 'Month', min: 1, max: 12, step: 1, value: 7, presets: [1, 4, 7, 10], help: '1 = January … 12 = December. Run the year to watch the monsoon arrive and go back.' },
      { id: 'city', label: 'City', type: 'select', value: 'mumbai', options: [
        { value: 'mumbai', label: 'Mumbai' }, { value: 'chennai', label: 'Chennai' }, { value: 'kolkata', label: 'Kolkata' },
        { value: 'delhi', label: 'Delhi' }, { value: 'sohra', label: 'Sohra (Cherrapunji)' }, { value: 'jaisalmer', label: 'Jaisalmer' },
        { value: 'tvm', label: 'Thiruvananthapuram' }] },
      { id: 'temps', label: 'Colour land and sea by temperature', type: 'toggle', value: true },
      { id: 'front', label: 'Shade where the monsoon has reached', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'date', label: 'Date', key: true },
      { id: 'wind', label: 'Winds', key: true },
      { id: 'land', label: 'Land (north-west India)', short: 'Land', unit: '°C', digits: 1 },
      { id: 'sea', label: 'Arabian Sea surface', short: 'Sea', unit: '°C', digits: 1 },
      { id: 'press', label: 'Air pressure over the land' },
      { id: 'rain', label: 'Rain in the chosen city this month', short: 'City rain', key: true },
      { id: 'here', label: 'Monsoon at the chosen city' }
    ],
    reset: function (sim) {
      st.day = MID[sim.p.month - 1];
      st.parts = [];
      for (var i = 0; i < 260; i++) { var q = {}; spawn(q, true); st.parts.push(q); }
    },
    onParam: function (sim, id, v) { if (id === 'month') st.day = MID[v - 1]; return true; },
    update: function (sim, dt) {
      st.day = (st.day + DAYS_PER_S * dt) % 365;
      var m = monthOf(st.day) + 1;
      if (m !== sim.p.month) sim.setParam('month', m);
      st.pdt += dt;
      if (st.pdt < 1 / 30) return;        // move the wind streaks 30 times a second
      var pdt = st.pdt; st.pdt = 0;
      st.parts.forEach(function (q) {
        var w = wind(q.lon, q.lat, st.day);
        q.lon += w[0] * 3.2 * pdt / KX; q.lat += w[1] * 3.2 * pdt; q.age += pdt;
        if (q.age > q.life || q.lon < LON0 || q.lon > LON1 || q.lat < LAT1 || q.lat > himaLat(q.lon) - 0.2) spawn(q, false);
      });
    },
    readout: function (sim) {
      var d = st.day, lt = cyc(LAND_T, d), sea = cyc(SEA_T, d), cty = city(sim.p), m = monthOf(d), on = d >= cty.on && d < cty.off;
      return {
        date: dateStr(d), wind: windName(d), land: lt, sea: sea,
        press: lt - sea > 1 ? 'Low (land hotter)' : lt - sea < -1 ? 'High (land cooler)' : 'About the same',
        rain: (cty.short || cty.name) + ' ' + cty.rain[m] + ' mm',
        here: on ? 'Here (since about ' + dateStr(cty.on) + ')' : d < cty.on ? 'Not yet (due about ' + dateStr(cty.on) + ')' : 'Gone back (about ' + dateStr(cty.off) + ')'
      };
    },
    status: function () { return dateStr(st.day) + ' · ' + windName(st.day); },

    draw: function (sim, now) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, d = st.day;
      var lt = cyc(LAND_T, d), sea = cyc(SEA_T, d), s = season(d), m = monthOf(d), t = (now || performance.now()) / 1000;
      var fs = L.narrow ? 10 : 12;
      D.clear(ctx, W, H, c.bg);

      // sea and land
      ctx.save();
      ctx.beginPath(); ctx.rect(L.mx, L.my, L.mw, L.mh); ctx.clip();
      ctx.fillStyle = p.temps ? tempCol(sea, true) : '#173a5e'; ctx.fillRect(L.mx, L.my, L.mw, L.mh);
      polyPath(ctx, L, LAND); ctx.fillStyle = p.temps ? tempCol(lt, false) : '#4d6b3c'; ctx.fill();
      polyPath(ctx, L, LANKA); ctx.fill();
      [[92.7, 11.6], [92.8, 12.5], [92.9, 13.3]].forEach(function (a) { D.circle(ctx, L.X(a[0]), L.Y(a[1]), 1.8, p.temps ? tempCol(lt, false) : '#4d6b3c'); });
      // mountains and plateau beyond the Himalaya
      ctx.beginPath(); ctx.moveTo(L.X(60), L.Y(40));
      HIMA.forEach(function (a) { ctx.lineTo(L.X(a[0]), L.Y(a[1])); }); ctx.lineTo(L.X(101), L.Y(40)); ctx.closePath();
      ctx.fillStyle = '#6b5b4b'; ctx.fill();
      ctx.strokeStyle = '#e7e5e4'; ctx.lineWidth = L.narrow ? 2.5 : 3.5; ctx.beginPath();
      HIMA.forEach(function (a, i) { if (i) ctx.lineTo(L.X(a[0]), L.Y(a[1])); else ctx.moveTo(L.X(a[0]), L.Y(a[1])); }); ctx.stroke();
      ctx.strokeStyle = 'rgba(214,211,209,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
      GHATS.forEach(function (a, i) { if (i) ctx.lineTo(L.X(a[0]), L.Y(a[1])); else ctx.moveTo(L.X(a[0]), L.Y(a[1])); }); ctx.stroke();

      // where the monsoon has reached
      if (p.front) {
        ctx.save(); polyPath(ctx, L, LAND); ctx.clip();
        ctx.fillStyle = 'rgba(56,189,248,0.38)';
        for (var lon = 67; lon < 98; lon += 0.5) for (var lat = 6; lat < 33; lat += 0.5) {
          if (covered(lon + 0.25, lat + 0.25, d)) ctx.fillRect(L.X(lon) - 0.3, L.Y(lat + 0.5) - 0.3, L.X(lon + 0.5) - L.X(lon) + 0.6, L.Y(lat) - L.Y(lat + 0.5) + 0.6);
        }
        ctx.restore();
      }
      D.line(ctx, L.mx, L.Y(0), L.mx + L.mw, L.Y(0), 'rgba(255,255,255,0.35)', 1, [6, 5]);

      // winds: moving streaks while running, arrows when paused
      if (sim.running) {
        ctx.save(); ctx.lineCap = 'round';
        st.parts.forEach(function (q) {
          var w = wind(q.lon, q.lat, d), sp = Math.hypot(w[0], w[1]);
          if (sp < 0.05) return;
          var x = L.X(q.lon), y = L.Y(q.lat), len = 4 + sp * (L.narrow ? 9 : 13), a = Math.min(1, Math.min(q.age, q.life - q.age) * 3);
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.85 * a).toFixed(2) + ')'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - w[0] / sp * len, y + w[1] / sp * len); ctx.lineTo(x, y); ctx.stroke();
        });
        ctx.restore();
      } else {
        var stepDeg = L.narrow ? 4.5 : 3.5;
        for (var alon = LON0 + 2; alon < LON1; alon += stepDeg) for (var alat = LAT1 + 2; alat < LAT0; alat += stepDeg) {
          if (alat > himaLat(alon) - 1) continue;
          var w = wind(alon, alat, d), sp = Math.hypot(w[0], w[1]);
          if (sp < 0.12) continue;
          var ax = L.X(alon), ay = L.Y(alat), al = (L.narrow ? 8 : 11) * (0.5 + sp);
          D.arrow(ctx, ax - w[0] / sp * al / 2, ay + w[1] / sp * al / 2, ax + w[0] / sp * al / 2, ay - w[1] / sp * al / 2, 'rgba(255,255,255,0.85)', 1.8, 6);
        }
      }

      // rain clouds
      var cs = L.narrow ? 9 : 12, rainT = sim.running ? t : 0.3;
      function rainAt(lon, lat, k) { if (k > 0.08) cloud(ctx, L.X(lon), L.Y(lat), cs, k, rainT); }
      if (s > 0.3) {
        [[73.2, 18.5], [74.2, 15.2], [75.4, 12], [76.4, 9.6]].forEach(function (a) { rainAt(a[0] - 0.6, a[1], covered(a[0], a[1], d) ? s : 0); });
        rainAt(91.7, 25.6, covered(91.7, 25.3, d) ? s : 0);
        [[80, 29.4], [85, 27.3], [88.5, 26.8]].forEach(function (a) { rainAt(a[0], a[1], covered(a[0], a[1] - 1, d) ? s * 0.7 : 0); });
        [[82, 22], [86.5, 23.5], [78, 24]].forEach(function (a) { rainAt(a[0], a[1], covered(a[0], a[1], d) ? s * 0.45 : 0); });
        if (covered(77, 16, d) && !L.narrow) D.text(ctx, 'rain shadow', L.X(77.6), L.Y(16.2), { color: '#fef3c7', size: 10, weight: 700, align: 'center', bg: 'rgba(0,0,0,0.45)', pad: 2 });
      }
      if (d >= 288 && d < 350) rainAt(79.5, 11.6, 0.7 * Math.min(1, (d - 288) / 15) * Math.min(1, (350 - d) / 15));

      // pressure letters
      var diff = lt - sea;
      if (Math.abs(diff) > 1) {
        var hiLand = diff < 0, k2 = L.narrow ? 16 : 22;
        D.text(ctx, hiLand ? 'H' : 'L', L.X(75.5), L.Y(24.8), { color: hiLand ? '#93c5fd' : '#fca5a5', size: k2, weight: 800, align: 'center', bg: 'rgba(0,0,0,0.45)', pad: 3 });
        D.text(ctx, hiLand ? 'L' : 'H', L.X(70), L.Y(4), { color: hiLand ? '#fca5a5' : '#93c5fd', size: k2, weight: 800, align: 'center', bg: 'rgba(0,0,0,0.45)', pad: 3 });
      }

      // labels and cities
      var lab = { color: 'rgba(255,255,255,0.75)', size: L.narrow ? 9 : 11, weight: 600, align: 'center' };
      D.text(ctx, 'Arabian Sea', L.X(66.5), L.Y(15.5), lab);
      D.text(ctx, 'Bay of Bengal', L.X(88.5), L.Y(15), lab);
      D.text(ctx, 'Indian Ocean', L.X(85), L.Y(-3), lab);
      if (p.front) D.text(ctx, '■ blue: monsoon has arrived', L.X(LON0) + 4, L.Y(LAT1) - 9, { color: '#7dd3fc', size: 9, weight: 700, bg: 'rgba(0,0,0,0.5)', pad: 2 });
      D.text(ctx, 'Equator', L.X(LON1) - 4, L.Y(0) - 7, { color: 'rgba(255,255,255,0.6)', size: 9, align: 'right' });
      D.text(ctx, 'HIMALAYA', L.X(88), L.Y(30.4), { color: '#fafaf9', size: L.narrow ? 9 : 11, weight: 700, align: 'center' });
      if (!L.narrow) D.text(ctx, 'Thar', L.X(71.3), L.Y(26), lab);
      Object.keys(CITIES).forEach(function (id) {
        var ct = CITIES[id], on = id === p.city, x = L.X(ct.lon), y = L.Y(ct.lat);
        D.circle(ctx, x, y, on ? 4.5 : 2.6, on ? '#fde68a' : '#fff', '#000', 1);
        if (on) D.text(ctx, ct.short || ct.name, x + (ct.lon > 88 ? -8 : 8), y - 9, { color: '#fff', size: L.narrow ? 10 : 11, weight: 700, align: ct.lon > 88 ? 'right' : 'left', bg: 'rgba(0,0,0,0.6)', pad: 2 });
      });
      ctx.restore();
      ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.strokeRect(L.mx + 0.5, L.my + 0.5, L.mw - 1, L.mh - 1);

      // explanation: side panel on wide screens, a strip below the map on phones
      var line1 = 'Land ' + M.fmt(lt, 0) + ' °C · sea ' + M.fmt(sea, 0) + ' °C → ' + (diff > 1 ? 'LOW pressure over land' : diff < -1 ? 'HIGH pressure over land' : 'little difference');
      var line2 = s > 0.45 ? 'Moist winds blow from sea to land: rain' : s < -0.45 ? 'Dry winds blow from land to sea' + (d >= 288 && d < 350 ? ' (rain in Tamil Nadu)' : '') : 'Winds weak and changing';
      if (L.side) {
        var px = W - L.panelW, py = L.top, pw = L.panelW - 10, ph = H - py - 10;
        D.roundRect(ctx, px, py, pw, ph, 10, D.alpha(c.ink, 0.05), c.grid, 1);
        // two thermometers
        var thH = Math.min(150, ph * 0.38), thY = py + 26;
        [['Land (NW India)', lt, tempCol(lt, false)], ['Arabian Sea', sea, tempCol(sea, true)]].forEach(function (a, i) {
          var x = px + pw * (i ? 0.72 : 0.28), y0 = thY + thH, frac = M.clamp((a[1] - 10) / 30, 0, 1);
          D.text(ctx, a[0], x, py + 13, { color: c.muted, size: 11, weight: 600, align: 'center' });
          D.roundRect(ctx, x - 7, thY, 14, thH, 7, D.alpha(c.ink, 0.08), c.border, 1.5);
          D.roundRect(ctx, x - 4, thY + thH * (1 - frac), 8, thH * frac, 4, a[2]);
          D.circle(ctx, x, y0 + 6, 10, a[2], c.border, 1.5);
          D.text(ctx, M.fmt(a[1], 1) + ' °C', x, y0 + 26, { color: c.ink, size: 13, weight: 700, align: 'center' });
        });
        var ly = thY + thH + 48;
        D.text(ctx, diff > 1 ? 'Land hotter → LOW pressure over land' : diff < -1 ? 'Land cooler → HIGH pressure over land' : 'Land and sea about equal', px + pw / 2, ly, { color: diff > 1 ? c.danger : diff < -1 ? c.s1 : c.muted, size: 11, weight: 700, align: 'center', fit: W });
        D.text(ctx, line2, px + pw / 2, ly + 18, { color: c.ink, size: 11, align: 'center', fit: W });
        // rainfall bars for the chosen city
        var cty = city(p), by = ly + 40, bh = py + ph - by - 30, bw = (pw - 24) / 12, mxR = Math.max.apply(null, cty.rain);
        if (bh > 40) {
          D.text(ctx, (cty.short || cty.name) + ': rain each month (mm)', px + 12, by, { color: c.muted, size: 11, weight: 600 });
          cty.rain.forEach(function (r, i) {
            var h = r / mxR * (bh - 18), x = px + 12 + i * bw;
            ctx.fillStyle = i === m ? c.warning : D.alpha(c.s1, 0.7);
            ctx.fillRect(x + 1.5, by + bh - h, bw - 3, h);
            D.text(ctx, MON[i][0], x + bw / 2, by + bh + 10, { color: i === m ? c.warning : c.muted, size: 10, align: 'center' });
          });
          D.text(ctx, cty.rain[m] + ' mm in ' + MON[m], px + pw - 10, by, { color: c.warning, size: 11, weight: 700, align: 'right' });
        }
      } else {
        var yb = L.my + L.mh + (L.narrow ? 13 : 15);
        D.text(ctx, line1, W / 2, yb, { color: diff > 1 ? c.danger : diff < -1 ? c.s1 : c.muted, size: fs, weight: 700, align: 'center', fit: W });
        D.text(ctx, line2, W / 2, yb + (L.narrow ? 16 : 19), { color: c.ink, size: fs, align: 'center', fit: W });
      }

      // headline
      var hl = dateStr(d) + ' · ' + (s > 0.45 ? 'South-west monsoon' : s < -0.45 ? 'North-east (winter) monsoon' : (m >= 2 && m <= 4 ? 'Hot season, monsoon building' : 'Monsoon changing over'));
      D.text(ctx, hl, W / 2, L.narrow ? 14 : 18, { color: c.bg, bg: s > 0.45 ? c.s1 : s < -0.45 ? c.warning : c.success, size: L.narrow ? 12 : 14, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
