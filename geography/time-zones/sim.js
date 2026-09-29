/* =====================================================================
   Earth's motions · Time Zones: IST and World Clocks — sim.js
   ---------------------------------------------------------------------
   The Earth turns 360° in 24 h, so 15° of longitude = 1 hour and
   1° = 4 minutes. Countries use a clock set for one "standard
   meridian". India uses 82.5° E: 82.5 × 4 min = 5 h 30 min ahead of
   Greenwich (0°), so IST = UTC + 5:30.
     UTC        = IST − 5 h 30 min
     local time = UTC + zone offset
     the Sun is overhead (noon by the Sun) at longitude (12 − UTC) × 15°
   Day and night on the map use the Sun's height at each point:
     sin(height) = sin φ sin δ + cos φ cos δ cos(hour angle)
   Offsets are standard time (summer "daylight saving" is ignored).
   Coastlines are rough outlines drawn from a few points.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, R2D = 180 / Math.PI;
  var HOURS_PER_S = 1, LAT0 = 78, LAT1 = -58;
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var DATES = { mar: { name: '21 March (equinox)', d: 0 }, jun: { name: '21 June', d: 23.44 }, dec: { name: '22 December', d: -23.44 } };
  var CITIES = [
    { id: 'la', name: 'Los Angeles', lat: 34.1, lon: -118.2, off: -8 },
    { id: 'ny', name: 'New York', lat: 40.7, lon: -74.0, off: -5 },
    { id: 'sp', name: 'São Paulo', lat: -23.5, lon: -46.6, off: -3 },
    { id: 'london', name: 'London', lat: 51.5, lon: -0.1, off: 0 },
    { id: 'dubai', name: 'Dubai', lat: 25.2, lon: 55.3, off: 4 },
    { id: 'delhi', name: 'New Delhi', lat: 28.6, lon: 77.2, off: 5.5 },
    { id: 'ktm', name: 'Kathmandu', lat: 27.7, lon: 85.3, off: 5.75 },
    { id: 'dhaka', name: 'Dhaka', lat: 23.8, lon: 90.4, off: 6 },
    { id: 'sg', name: 'Singapore', lat: 1.35, lon: 103.8, off: 8 },
    { id: 'tokyo', name: 'Tokyo', lat: 35.7, lon: 139.7, off: 9 },
    { id: 'sydney', name: 'Sydney', lat: -33.9, lon: 151.2, off: 10 },
    { id: 'akl', name: 'Auckland', lat: -36.8, lon: 174.8, off: 12 }
  ];
  var LAND = [
    [-168, 66, -162, 70, -140, 70, -120, 72, -95, 72, -80, 73, -65, 62, -60, 55, -66, 45, -70, 42, -76, 35, -81, 31, -80, 26, -82, 29, -90, 30, -97, 27, -97, 22, -92, 18, -88, 16, -83, 10, -79, 8, -85, 12, -95, 16, -105, 20, -110, 24, -117, 32, -124, 40, -124, 48, -132, 55, -140, 60, -150, 60, -158, 57, -165, 62],
    [-50, 60, -42, 60, -20, 70, -18, 78, -65, 78, -70, 76, -55, 70],
    [-79, 8, -72, 12, -62, 10, -50, 0, -35, -6, -39, -15, -48, -26, -58, -38, -65, -42, -68, -52, -72, -50, -74, -40, -71, -30, -70, -18, -76, -14, -81, -5, -80, 0],
    [-10, 36, -9, 43, -2, 44, -4, 48, 5, 53, 8, 57, 12, 55, 20, 55, 22, 60, 18, 62, 20, 69, 30, 70, 45, 68, 60, 70, 80, 73, 100, 76, 120, 73, 140, 72, 160, 70, 180, 68, 180, 62, 163, 60, 157, 51, 142, 58, 135, 54, 141, 46, 132, 43, 128, 38, 126, 35, 122, 40, 120, 36, 121, 31, 117, 24, 110, 21, 106, 18, 109, 12, 105, 9, 103, 1.5, 100, 6, 98, 16, 94, 17, 92, 22, 89, 22, 86, 20, 80, 15, 78, 8, 76, 10, 73, 19, 70, 22, 67, 24, 62, 25, 57, 26, 52, 28, 48, 30, 50, 26, 56, 26, 59, 22, 53, 17, 45, 13, 43, 15, 39, 21, 35, 28, 34, 31, 36, 36, 30, 36, 27, 37, 27, 41, 24, 40, 23, 37, 20, 40, 19, 42, 13, 45, 16, 41, 12, 38, 9, 44, 3, 43, 0, 39, -5, 36],
    [-17, 21, -16, 12, -12, 7, -7, 4, 5, 5, 9, 4, 10, -2, 13, -9, 12, -17, 15, -27, 18, -34, 25, -34, 33, -27, 35, -21, 40, -15, 40, -10, 39, -4, 43, 0, 51, 12, 43, 12, 39, 17, 34, 27, 32, 31, 20, 32, 10, 37, -1, 36, -6, 35, -10, 30, -13, 27],
    [114, -22, 122, -18, 130, -12, 137, -12, 141, -11, 146, -19, 153, -26, 151, -34, 146, -39, 140, -38, 132, -32, 116, -35, 115, -30],
    [130, 31, 135, 34, 140, 35, 142, 40, 141, 45, 139, 40, 133, 35],
    [-5, 50, 1, 51, 0, 53, -2, 56, -5, 58, -6, 56, -3, 54, -5, 52],
    [95, 5, 98, 4, 106, -3, 106, -6, 101, -3],
    [109, 1, 117, 7, 119, 1, 116, -4, 110, -3],
    [172, -35, 178, -38, 174, -41, 167, -46, 172, -43],
    [44, -25, 50, -15, 49, -12, 44, -17],
    [80, 6, 82, 7, 80, 10]
  ];

  function clock(h) {
    h = ((h % 24) + 24) % 24;
    var hh = Math.floor(h), mm = Math.floor((h - hh) * 60 + 1e-6);
    return (hh % 12 === 0 ? 12 : hh % 12) + ':' + (mm < 10 ? '0' : '') + mm + (hh < 12 ? ' am' : ' pm');
  }
  function offStr(o) {
    var s = o < 0 ? '−' : '+', a = Math.abs(o), h = Math.floor(a), m = Math.round((a - h) * 60);
    return 'UTC' + s + h + (m ? ':' + (m < 10 ? '0' : '') + m : '');
  }
  function diffStr(dh) {
    if (Math.abs(dh) < 1e-6) return 'same time as India';
    var a = Math.abs(dh), h = Math.floor(a), m = Math.round((a - h) * 60);
    return (h ? h + ' h ' : '') + (m ? m + ' min ' : '') + (dh > 0 ? 'ahead of' : 'behind') + ' India';
  }
  function local(T, c) { return T - 5.5 + c.off; } // hours since Monday 00:00 IST-day start
  function dayName(t) { return DAYS[((Math.floor(t / 24) % 7) + 7) % 7]; }
  function sunAlt(lat, lon, utc, dDeg) {
    var hA = ((utc - 12) * 15 + lon) / R2D, f = lat / R2D, d = dDeg / R2D;
    return Math.asin(Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(hA)) * R2D;
  }
  function cityOf(id) { return CITIES.filter(function (c) { return c.id === id; })[0] || CITIES[9]; }

  SimLab.createSim({
    ariaLabel: 'A world map with day and night shading, time zone bands and city pins, above a grid of world clocks compared with Indian Standard Time',
    autoplay: true,
    mobileAspect: '3 / 4.6',
    params: [
      { id: 'time', label: 'Time in India (IST)', min: 0, max: 23.75, step: 0.25, value: 9, format: clock,
        presets: [{ label: '5:30 am', value: 5.5 }, { label: '9 am', value: 9 }, { label: 'Noon', value: 12 }, { label: '10:30 pm', value: 22.5 }] },
      { id: 'city', label: 'Compare with', type: 'select', value: 'tokyo', options: CITIES.filter(function (c) { return c.id !== 'delhi'; }).map(function (c) { return { value: c.id, label: c.name + ' (' + offStr(c.off) + ')' }; }) },
      { id: 'date', label: 'Date (for day and night on the map)', type: 'select', value: 'mar', options: Object.keys(DATES).map(function (k) { return { value: k, label: DATES[k].name }; }) }
    ],
    readouts: [
      { id: 'ist', label: 'India (IST = UTC+5:30)', key: true },
      { id: 'utc', label: 'Greenwich (UTC)' },
      { id: 'other', label: 'Other city', key: true },
      { id: 'diff', label: 'Difference' },
      { id: 'noon', label: 'Noon by the Sun at longitude' }
    ],
    onParam: function (sim, id, v) { if (id === 'time') sim.state.T = Math.floor(sim.state.T / 24) * 24 + v; return true; },
    reset: function (sim) { sim.state = { T: sim.p.time }; },
    update: function (sim, dt) {
      var s = sim.state, before = Math.round(s.T * 4);
      s.T += HOURS_PER_S * dt; if (s.T >= 24 * 7) s.T -= 24 * 7;
      if (Math.round(s.T * 4) !== before) sim.setParam('time', (Math.round(s.T * 4) / 4) % 24);
    },
    readout: function (sim) {
      var T = sim.state.T, o = cityOf(sim.p.city), utc = T - 5.5;
      var lon = ((12 - (((utc % 24) + 24) % 24)) * 15 + 540) % 360 - 180;
      return {
        ist: clock(T) + ', ' + dayName(T), utc: clock(utc) + ', ' + dayName(utc),
        other: o.name + ' ' + clock(local(T, o)) + ', ' + dayName(local(T, o)),
        diff: diffStr(o.off - 5.5),
        noon: M.fmt(Math.abs(lon), 0) + '° ' + (lon >= 0 ? 'E' : 'W')
      };
    },
    status: function (sim) { return clock(sim.state.T) + ' IST, ' + dayName(sim.state.T); },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, narrow = W < 560;
      var T = sim.state.T, utc = T - 5.5, dd = DATES[sim.p.date].d, sel = cityOf(sim.p.city);
      var utcH = ((utc % 24) + 24) % 24;
      D.clear(ctx, W, H, c.bg);

      // ---- map frame
      var topBand = 18, mw = W - 16, mh = mw * (LAT0 - LAT1) / 360;
      var cols = narrow ? 3 : 4, rowsN = Math.ceil(CITIES.length / cols);
      var cardH = narrow ? 50 : 54, gridH = rowsN * (cardH + 6) + 4;
      var maxMh = H - topBand - gridH - 30;
      if (mh > maxMh) { mh = maxMh; mw = mh * 360 / (LAT0 - LAT1); }
      var mx = (W - mw) / 2, my = topBand + 12;
      function X(lon) { return mx + (lon + 180) / 360 * mw; }
      function Y(lat) { return my + (LAT0 - lat) / (LAT0 - LAT1) * mh; }

      ctx.save();
      ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
      ctx.fillStyle = '#0b3a66'; ctx.fillRect(mx, my, mw, mh);
      ctx.fillStyle = '#3f7d4a';
      LAND.forEach(function (poly) {
        ctx.beginPath();
        for (var i = 0; i < poly.length; i += 2) { if (i === 0) ctx.moveTo(X(poly[i]), Y(poly[i + 1])); else ctx.lineTo(X(poly[i]), Y(poly[i + 1])); }
        ctx.closePath(); ctx.fill();
      });
      // night shading
      var st = 3, cw = mw / 360 * st + 0.6, ch = mh / (LAT0 - LAT1) * st + 0.6;
      for (var lon = -180; lon < 180; lon += st) {
        for (var lat = LAT0; lat > LAT1; lat -= st) {
          var a = sunAlt(lat - st / 2, lon + st / 2, utcH, dd);
          if (a < 0) { ctx.fillStyle = a < -6 ? 'rgba(2,6,23,0.72)' : 'rgba(2,6,23,0.45)'; ctx.fillRect(X(lon), Y(lat), cw, ch); }
        }
      }
      // time-zone bands every 15°
      for (var z = -12; z <= 12; z++) {
        var zl = z * 15 - 7.5;
        D.line(ctx, X(zl), my, X(zl), my + mh, 'rgba(255,255,255,0.14)', 1);
      }
      D.line(ctx, X(0), my, X(0), my + mh, 'rgba(255,255,255,0.5)', 1, [4, 3]);
      D.line(ctx, X(82.5), my, X(82.5), my + mh, '#fde68a', 1.5, [4, 3]);
      ctx.restore();
      D.roundRect(ctx, mx, my, mw, mh, 2, null, c.border, 1);

      // zone labels above the map (every 3 h on phones)
      for (var zz = -12; zz <= 12; zz++) {
        if (narrow && zz % 3 !== 0) continue;
        if (zz === 12 || zz === -12 || (zz === -11 && mx < 28)) continue;
        D.text(ctx, (zz > 0 ? '+' : '') + zz, X(zz * 15), topBand + 2, { color: c.faint, size: 9, align: 'center' });
      }
      D.text(ctx, 'UTC', mx < 28 ? mx : mx - 4, topBand + 2, { color: c.faint, size: 9, align: mx < 28 ? 'left' : 'right' });
      D.text(ctx, narrow ? '0°' : '0° Greenwich', X(0), my + mh + 10, { color: c.muted, size: 9, align: 'center' });
      D.text(ctx, narrow ? '82.5° E' : '82.5° E: IST meridian', X(82.5), my + mh + 10, { color: '#fde68a', size: 9, align: narrow ? 'center' : 'left', fit: W });
      D.text(ctx, '180°', X(180) - 2, my + mh + 10, { color: c.muted, size: 9, align: 'right' });

      // the Sun overhead
      var sLon = ((12 - utcH) * 15 + 540) % 360 - 180;
      D.circle(ctx, X(sLon), Y(dd), narrow ? 5 : 7, '#fbbf24', '#fff7cc', 2);

      // city pins
      CITIES.forEach(function (ct) {
        var on = ct.id === sel.id || ct.id === 'delhi';
        D.circle(ctx, X(ct.lon), Y(ct.lat), on ? 4.5 : 3, on ? (ct.id === 'delhi' ? '#fde68a' : '#f472b6') : '#fff', '#000', 1);
        if (on) D.text(ctx, ct.name, X(ct.lon), Y(ct.lat) - 11, { color: '#fff', size: 10, weight: 700, align: 'center', bg: 'rgba(0,0,0,0.55)', pad: 2, fit: W });
      });

      // ---- clock cards
      var gy = my + mh + 24, gw = (W - 16 - (cols - 1) * 6) / cols;
      CITIES.forEach(function (ct, i) {
        var col = i % cols, row = Math.floor(i / cols), x = 8 + col * (gw + 6), y = gy + row * (cardH + 6);
        var t = local(T, ct), alt = sunAlt(ct.lat, ct.lon, utcH, dd), day = alt > 0;
        var isSel = ct.id === sel.id, isIn = ct.id === 'delhi';
        D.roundRect(ctx, x, y, gw, cardH, 8, day ? 'rgba(56,189,248,0.22)' : 'rgba(15,23,42,0.9)', isSel ? '#f472b6' : isIn ? '#fde68a' : c.border, isSel || isIn ? 2 : 1);
        D.text(ctx, (day ? '☀️ ' : '🌙 ') + ct.name, x + 8, y + 12, { color: day ? c.ink : '#e2e8f0', size: narrow ? 10 : 11, weight: 600, fit: x + gw + 4 });
        D.text(ctx, clock(t), x + 8, y + (narrow ? 29 : 31), { color: day ? c.ink : '#e2e8f0', size: narrow ? 14 : 17, weight: 700, font: 'Space Grotesk, Inter, sans-serif' });
        var dn = dayName(t), same = dn === dayName(T);
        D.text(ctx, (narrow ? dn.slice(0, 3) : dn) + ' · ' + offStr(ct.off), x + 8, y + cardH - 9, { color: same ? (day ? c.muted : '#94a3b8') : '#f472b6', size: 9, weight: same ? 500 : 700, fit: x + gw + 4 });
      });
    }
  });
})();
