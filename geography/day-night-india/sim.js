/* =====================================================================
   Earth's motions · Day, Night and Sunrise Across India — sim.js
   ---------------------------------------------------------------------
   The Earth spins once a day from west to east. Left: the northern
   half of the Earth seen from above the North Pole, with sunlight
   coming from the right. It turns anticlockwise, so places move from
   the night side into the lit side (sunrise) at the bottom.
   Right: daylight bars for Indian cities on the Indian Standard Time
   clock (IST, set for the 82.5° E meridian).
     declination  δ = 23.45° · sin(360° (284 + N) ÷ 365)      (N = day of year)
     sunrise:     cos H = (sin(−0.83°) − sin φ sin δ) ÷ (cos φ cos δ)
     local solar sunrise = 12 h − H ÷ 15,  sunset = 12 h + H ÷ 15
     IST = local solar time + (82.5° − longitude) × 4 min − equation of time
   −0.83° allows for the Sun's size and the bending of light by air.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var HOURS_PER_S = 1.2, R2D = 180 / Math.PI;

  var DATES = {
    jan15: { name: '15 Jan (Makar Sankranti)', n: 15 },
    mar21: { name: '21 Mar (equinox)', n: 80 },
    jun21: { name: '21 Jun (longest day)', n: 172 },
    aug15: { name: '15 Aug (Independence Day)', n: 227 },
    sep23: { name: '23 Sep (equinox)', n: 266 },
    dec22: { name: '22 Dec (shortest day)', n: 356 }
  };
  var CITIES = [
    { id: 'dibrugarh', name: 'Dibrugarh', lat: 27.5, lon: 94.9 },
    { id: 'portblair', name: 'Port Blair', lat: 11.6, lon: 92.7 },
    { id: 'kolkata', name: 'Kolkata', lat: 22.6, lon: 88.4 },
    { id: 'chennai', name: 'Chennai', lat: 13.1, lon: 80.3 },
    { id: 'delhi', name: 'Delhi', lat: 28.6, lon: 77.2 },
    { id: 'srinagar', name: 'Srinagar', lat: 34.1, lon: 74.8 },
    { id: 'mumbai', name: 'Mumbai', lat: 19.1, lon: 72.9 },
    { id: 'dwarka', name: 'Dwarka', lat: 22.2, lon: 69.0 }
  ];

  function decl(n) { return 23.45 * Math.sin(2 * Math.PI * (284 + n) / 365); }
  function eot(n) { // equation of time, minutes (sundial minus clock)
    var b = 2 * Math.PI * (n - 81) / 364;
    return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  }
  function sun(city, n) {
    var d = decl(n) / R2D, f = city.lat / R2D;
    var cosH = (Math.sin(-0.83 / R2D) - Math.sin(f) * Math.sin(d)) / (Math.cos(f) * Math.cos(d));
    var H = Math.acos(M.clamp(cosH, -1, 1)) * R2D / 15; // half day length, hours
    var shift = (82.5 - city.lon) * 4 / 60 - eot(n) / 60;  // solar → IST, hours
    return { rise: 12 - H + shift, set: 12 + H + shift, len: 2 * H, noon: 12 + shift };
  }
  function clock(h) {
    h = ((h % 24) + 24) % 24;
    var hh = Math.floor(h), mm = Math.floor((h - hh) * 60 + 1e-6);
    return (hh % 12 === 0 ? 12 : hh % 12) + ':' + (mm < 10 ? '0' : '') + mm + (hh < 12 ? ' am' : ' pm');
  }
  function hm(h) { var m = Math.round(h * 60); return Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; }
  function city(sim) { return CITIES.filter(function (c) { return c.id === sim.p.city; })[0] || CITIES[4]; }
  function isDay(c, n, t) { var s = sun(c, n); return t >= s.rise && t < s.set; }

  SimLab.createSim({
    ariaLabel: 'The northern half of the Earth seen from above the North Pole, turning in sunlight, with India marked, next to daylight bars showing sunrise and sunset times for Indian cities',
    autoplay: true,
    mobileAspect: '3 / 4.3',
    params: [
      { id: 'time', label: 'Time in India (IST)', min: 0, max: 23.75, step: 0.25, value: 6, format: clock,
        presets: [{ label: '5 am', value: 5 }, { label: '6 am', value: 6 }, { label: 'Noon', value: 12 }, { label: '6 pm', value: 18 }, { label: 'Midnight', value: 0 }] },
      { id: 'date', label: 'Date', type: 'select', value: 'mar21', options: Object.keys(DATES).map(function (k) { return { value: k, label: DATES[k].name }; }) },
      { id: 'city', label: 'City for the readouts', type: 'select', value: 'delhi', options: CITIES.map(function (c) { return { value: c.id, label: c.name }; }) }
    ],
    readouts: [
      { id: 'ist', label: 'Time in India (IST)', key: true },
      { id: 'rise', label: 'Sunrise' },
      { id: 'set', label: 'Sunset' },
      { id: 'len', label: 'Length of day', key: true },
      { id: 'gap', label: 'Sunrise: Dibrugarh ahead of Dwarka by', unit: 'min', digits: 0 }
    ],
    onParam: function (sim, id, v) { if (id === 'time') sim.state.t = v; return true; },
    reset: function (sim) { sim.state = { t: sim.p.time }; },
    update: function (sim, dt) {
      var s = sim.state, before = Math.round(s.t * 4);
      s.t = (s.t + HOURS_PER_S * dt) % 24;
      if (Math.round(s.t * 4) !== before) sim.setParam('time', (Math.round(s.t * 4) / 4) % 24);
    },
    readout: function (sim) {
      var n = DATES[sim.p.date].n, c = city(sim), s = sun(c, n);
      return {
        ist: clock(sim.state.t) + (isDay(c, n, sim.state.t) ? ' ☀️' : ' 🌙'),
        rise: c.name + ' ' + clock(s.rise), set: clock(s.set), len: hm(s.len),
        gap: (sun(CITIES[7], n).rise - sun(CITIES[0], n).rise) * 60
      };
    },
    status: function (sim) {
      var c = city(sim), n = DATES[sim.p.date].n;
      return clock(sim.state.t) + ' IST · ' + (isDay(c, n, sim.state.t) ? 'day' : 'night') + ' in ' + c.name;
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, t = sim.state.t, narrow = W < 560;
      var n = DATES[sim.p.date].n, dl = decl(n) / R2D, sel = city(sim);
      D.clear(ctx, W, H, c.bg);

      // ---- layout: globe left (or top on phones), daylight bars right (or below)
      var gx, gy, R, bx, by, bw, bh;
      if (narrow) {
        R = Math.min(W * 0.4, H * 0.24); gx = W / 2; gy = 30 + R;
        bx = 8; by = gy + R + 36; bw = W - 16; bh = H - by - 8;
      } else {
        R = Math.min(W * 0.21, (H - 60) / 2); gx = 20 + R + 10; gy = H / 2 + 10;
        bx = gx + R + 34; by = 34; bw = W - bx - 12; bh = H - by - 12;
      }
      function rOf(lat) { return R * (90 - lat) / 90; }
      function hourAngle(lon) { return ((t - 12) * 15 + (lon - 82.5) + eot(n) / 4) / R2D; }
      function pt(lat, lon) { var a = hourAngle(lon), r = rOf(lat); return { x: gx + r * Math.cos(a), y: gy - r * Math.sin(a) }; }

      // sunlight arrows from the right
      for (var k = -2; k <= 2; k++) {
        var yy = gy + k * R * 0.38;
        D.arrow(ctx, narrow ? W - 4 : gx + R + 26, yy, gx + R + 6, yy, D.alpha('#fbbf24', 0.7), 2, 7);
      }
      D.text(ctx, '☀️ sunlight', narrow ? W - 6 : gx + R + 26, gy - R - 6, { color: '#fbbf24', size: 11, weight: 600, align: 'right', fit: W });

      // earth (day side), then the night wedges
      D.circle(ctx, gx, gy, R, '#1e6aa8');
      ctx.fillStyle = 'rgba(3,7,18,0.72)';
      for (var hdeg = 0; hdeg < 360; hdeg += 2) {
        var lo = null, hi = null;
        for (var lat = 0; lat <= 90; lat += 1) {
          var f = lat / R2D, alt = Math.sin(f) * Math.sin(dl) + Math.cos(f) * Math.cos(dl) * Math.cos((hdeg + 1) / R2D);
          if (alt < 0) { if (lo === null) lo = lat; hi = lat; }
        }
        if (lo === null) continue;
        var a0 = -hdeg / R2D - 0.002, a1 = -(hdeg + 2) / R2D - 0.002;
        ctx.beginPath();
        ctx.arc(gx, gy, rOf(Math.max(0, lo - 0.5)), a1, a0);
        ctx.arc(gx, gy, Math.max(0, rOf(Math.min(90, hi + 0.5))), a0, a1, true);
        ctx.closePath(); ctx.fill();
      }

      // grid: meridians every 15° (1 hour) and a few latitudes
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
      for (var lon = 0; lon < 360; lon += 15) {
        var p = pt(0, lon); ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      [23.44, 66.56].forEach(function (la) { ctx.beginPath(); ctx.arc(gx, gy, rOf(la), 0, Math.PI * 2); ctx.stroke(); });
      ctx.restore();
      D.circle(ctx, gx, gy, R, null, c.axis, 1.5);

      // India: a patch between 68–97° E and 8–37° N
      ctx.beginPath();
      var i0 = hourAngle(68), i1 = hourAngle(97.4);
      ctx.arc(gx, gy, rOf(8), -i0, -i1, true);
      ctx.arc(gx, gy, rOf(37), -i1, -i0, false);
      ctx.closePath(); ctx.fillStyle = 'rgba(74,222,128,0.45)'; ctx.fill();
      ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1.5; ctx.stroke();
      // standard meridian 82.5° E
      var sm0 = pt(8, 82.5), sm1 = pt(37, 82.5);
      D.line(ctx, sm0.x, sm0.y, sm1.x, sm1.y, '#fde68a', 1.5, [4, 3]);
      CITIES.forEach(function (ct) {
        var q = pt(ct.lat, ct.lon), on = ct.id === sel.id;
        D.circle(ctx, q.x, q.y, on ? 4.5 : 2.6, on ? '#fde68a' : '#fff', on ? '#000' : null, 1);
      });
      var lab = pt(22, 82.5);
      D.text(ctx, 'INDIA', lab.x, lab.y + (narrow ? -14 : -16), { color: '#fff', size: 10, weight: 700, align: 'center', bg: 'rgba(0,0,0,0.45)', pad: 2 });
      D.text(ctx, 'N', gx, gy, { color: '#fff', size: 11, weight: 700, align: 'center', bg: 'rgba(0,0,0,0.5)', pad: 3 });
      // rotation arrow
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.beginPath();
      ctx.arc(gx, gy, R + 10, Math.PI * 0.62, Math.PI * 0.88); ctx.stroke(); ctx.restore();
      var ae = Math.PI * 0.62; D.arrow(ctx, gx + (R + 10) * Math.cos(ae + 0.06), gy + (R + 10) * Math.sin(ae + 0.06), gx + (R + 10) * Math.cos(ae), gy + (R + 10) * Math.sin(ae), c.ink, 2, 8);
      D.text(ctx, 'spins west → east', gx - R * 0.55, gy + R + 16, { color: c.muted, size: 10, align: 'center', fit: W });
      D.text(ctx, 'sunrise side', gx + R * 0.35, gy + R + 16, { color: '#fbbf24', size: 10, weight: 600, align: 'center', fit: W });
      D.text(ctx, 'Seen from above the North Pole', narrow ? W / 2 : gx, 12, { color: c.muted, size: 11, align: 'center', fit: W });

      // ---- daylight bars (IST)
      var rows = CITIES.length, labW = narrow ? 70 : 84, x0 = bx + labW, x1 = bx + bw - 6;
      var top = by + 30, rowH = Math.min(34, (bh - 48) / rows);
      function X(hh) { return M.lerp(x0, x1, hh / 24); }
      D.text(ctx, 'Daylight on ' + DATES[sim.p.date].name.split(' (')[0] + ' (clock time = IST)', bx, by, { color: c.ink, size: narrow ? 11 : 12, weight: 700, fit: W });
      for (var hr = 0; hr <= 24; hr += 6) {
        D.line(ctx, X(hr), top, X(hr), top + rows * rowH, c.grid, 1);
        D.text(ctx, hr === 0 || hr === 24 ? '12 am' : hr === 12 ? 'noon' : clock(hr).replace(':00', ''), X(hr), top + rows * rowH + 10, { color: c.muted, size: 10, align: 'center', fit: W });
      }
      CITIES.forEach(function (ct, i) {
        var s = sun(ct, n), y = top + i * rowH, hb = rowH * 0.62, on = ct.id === sel.id;
        D.roundRect(ctx, X(0), y + (rowH - hb) / 2, X(24) - X(0), hb, 3, 'rgba(15,23,42,0.85)');
        D.roundRect(ctx, X(s.rise), y + (rowH - hb) / 2, X(s.set) - X(s.rise), hb, 3, on ? '#fbbf24' : 'rgba(251,191,36,0.55)');
        D.text(ctx, ct.name, x0 - 6, y + rowH / 2, { color: on ? c.ink : c.muted, size: narrow ? 10 : 11, weight: on ? 700 : 500, align: 'right' });
        if (!narrow || on) {
          D.text(ctx, clock(s.rise).replace(' am', ''), X(s.rise) + 3, y + rowH / 2, { color: '#111827', size: 9, weight: 600 });
          D.text(ctx, clock(s.set).replace(' pm', ''), X(s.set) - 3, y + rowH / 2, { color: '#111827', size: 9, weight: 600, align: 'right' });
        }
      });
      // current time line
      D.line(ctx, X(t), top - 4, X(t), top + rows * rowH + 2, c.danger, 2);
      D.text(ctx, clock(t), X(t), top - 8, { color: c.danger, size: 10, weight: 700, align: 'center', fit: W });
    }
  });
})();
