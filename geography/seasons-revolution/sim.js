/* =====================================================================
   Earth's motions · Revolution and the Seasons — sim.js
   ---------------------------------------------------------------------
   The Earth goes round the Sun once a year with its axis tilted by
   23.5° and always pointing the same way in space (towards the Pole
   Star). So for half the year the northern half leans towards the Sun.
     Sun's declination  δ = tilt · sin(360° (284 + N) ÷ 365)
     noon Sun height    = 90° − |latitude − δ|
     half-day angle H:  cos H = −tan φ · tan δ,  day length = 2H ÷ 15 h
     sunshine on 1 m² of flat ground at noon ∝ sin(noon height)
     Sun–Earth distance ≈ 149.6 × (1 − 0.0167 cos(360° (N − 3) ÷ 365)) million km
   Left: the orbit seen at a slant (not to scale). Right: the Earth at
   local noon, cut through the Sun and the axis, with sunlight from the
   Sun's side. The orbit angle grows evenly with the date (the real
   speed changes by about 3 %).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, R2D = 180 / Math.PI;
  var DAYS_PER_S = 20;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MLEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var PLACES = {
    kanyakumari: { india: true, name: 'Kanyakumari (8° N)', lat: 8.1 },
    chennai: { india: true, name: 'Chennai (13° N)', lat: 13.1 },
    bhopal: { india: true, name: 'Bhopal (23.3° N, near the Tropic)', lat: 23.3 },
    delhi: { india: true, name: 'Delhi (28.6° N)', lat: 28.6 },
    leh: { india: true, name: 'Leh (34.2° N)', lat: 34.2 },
    equator: { name: 'On the Equator (0°)', lat: 0 },
    norway: { name: 'Tromsø, Norway (69.6° N)', lat: 69.6 },
    sydney: { name: 'Sydney, Australia (33.9° S)', lat: -33.9 }
  };

  function dateStr(n) {
    n = Math.round(n); if (n < 1) n = 1; if (n > 365) n = 365;
    for (var m = 0; m < 12; m++) { if (n <= MLEN[m]) return n + ' ' + MON[m]; n -= MLEN[m]; }
    return '31 Dec';
  }
  function decl(n, tilt) { return tilt * Math.sin(2 * Math.PI * (284 + n) / 365); }
  function dayLen(lat, d) {
    var x = -Math.tan(lat / R2D) * Math.tan(d / R2D);
    if (x <= -1) return 24; if (x >= 1) return 0;
    return 2 * Math.acos(x) * R2D / 15;
  }
  function noonAlt(lat, d) { return 90 - Math.abs(lat - d); }
  function dist(n) { return 149.6 * (1 - 0.0167 * Math.cos(2 * Math.PI * (n - 3) / 365)); }
  function season(place, n) {
    if (place.lat === 0) return 'Hot all year';
    if (place.india) // India Meteorological Department seasons
      return n < 60 || n >= 335 ? 'Winter' : n < 152 ? 'Summer (hot season)' : n < 274 ? 'Monsoon' : 'Post-monsoon';
    var q = Math.floor(((n - 80 + 365) % 365) / 91.25); // 0 spring … 3 winter, from the March equinox
    return place.lat > 0 ? ['Spring', 'Summer', 'Autumn', 'Winter'][q] : ['Autumn', 'Winter', 'Spring', 'Summer'][q];
  }

  SimLab.createSim({
    ariaLabel: 'The Earth going round the Sun with its axis tilted, beside a close-up of the Earth at noon showing how high the Sun is and how long the day is at a chosen place',
    autoplay: true,
    mobileAspect: '3 / 4.2',
    params: [
      { id: 'day', label: 'Date', min: 1, max: 365, step: 1, value: 172, format: dateStr,
        presets: [{ label: '21 Mar', value: 80 }, { label: '21 Jun', value: 172 }, { label: '23 Sep', value: 266 }, { label: '22 Dec', value: 356 }] },
      { id: 'place', label: 'Place', type: 'select', value: 'delhi', options: Object.keys(PLACES).map(function (k) { return { value: k, label: PLACES[k].name }; }) },
      { id: 'tilt', label: 'Tilt of the axis', min: 0, max: 40, step: 0.5, value: 23.5, unit: '°',
        presets: [{ label: 'Real (23.5°)', value: 23.5 }, { label: 'No tilt', value: 0 }],
        help: 'Try 0° to see what a year without seasons would look like.' }
    ],
    readouts: [
      { id: 'date', label: 'Date', key: true },
      { id: 'noon', label: 'Noon Sun height', unit: '°', digits: 0, key: true },
      { id: 'len', label: 'Length of day', unit: 'h', digits: 1 },
      { id: 'pow', label: 'Noon sunshine on flat ground', unit: '%', digits: 0 },
      { id: 'd', label: 'Distance from the Sun', unit: 'million km', digits: 1 },
      { id: 'sea', label: 'Season here' }
    ],
    graph: { title: 'Length of day through the year', yLabel: 'h', series: [{ label: 'your place' }, { label: 'Equator' }], window: 365 / DAYS_PER_S, yMin: 0, yMax: 24 },
    onParam: function (sim, id, v) { if (id === 'day') sim.state.n = v; return true; },
    reset: function (sim) { sim.state = { n: sim.p.day }; },
    update: function (sim, dt) {
      var s = sim.state, before = Math.round(s.n);
      s.n += DAYS_PER_S * dt; if (s.n >= 366) s.n -= 365;
      if (Math.round(s.n) !== before) sim.setParam('day', M.clamp(Math.round(s.n), 1, 365));
    },
    sample: function (sim) {
      var d = decl(sim.state.n, sim.p.tilt);
      return [dayLen(PLACES[sim.p.place].lat, d), dayLen(0, d)];
    },
    readout: function (sim) {
      var n = sim.state.n, lat = PLACES[sim.p.place].lat, d = decl(n, sim.p.tilt), a = noonAlt(lat, d);
      return { date: dateStr(n), noon: Math.max(0, a), len: dayLen(lat, d), pow: Math.max(0, Math.sin(a / R2D)) * 100, d: dist(n),
        sea: sim.p.tilt < 1 ? 'No seasons' : season(PLACES[sim.p.place], n) };
    },
    status: function (sim) { return dateStr(sim.state.n) + ' · δ = ' + M.fmt(decl(sim.state.n, sim.p.tilt), 1) + '°'; },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, narrow = W < 560;
      var n = sim.state.n, tilt = sim.p.tilt, d = decl(n, tilt), place = PLACES[sim.p.place], lat = place.lat;
      D.clear(ctx, W, H, c.bg);

      // ---- panel A: the orbit
      var ax, ay, aw, ah;
      if (narrow) { ax = 0; ay = 0; aw = W; ah = H * 0.44; } else { ax = 0; ay = 0; aw = W * 0.52; ah = H; }
      var ocx = ax + aw / 2, ocy = ay + ah / 2 + 8, orx = aw / 2 - (narrow ? 52 : 56), ory = orx * 0.36;
      D.text(ctx, 'Orbit (seen at a slant, not to scale)', ax + 10, ay + 14, { color: c.muted, size: 11 });
      ctx.save(); ctx.strokeStyle = c.axis; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.ellipse(ocx, ocy, orx, ory, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      var marks = [[172, '21 Jun'], [266, '23 Sep'], [356, '22 Dec'], [80, '21 Mar']];
      function orbitPos(day) { var th = 2 * Math.PI * (day - 172) / 365; return { x: ocx - orx * Math.cos(th), y: ocy + ory * Math.sin(th), front: Math.sin(th) > 0 }; }
      marks.forEach(function (m) {
        var q = orbitPos(m[0]), dx = q.x - ocx, dy = q.y - ocy;
        D.circle(ctx, q.x, q.y, 2.5, c.axis);
        D.text(ctx, m[1], q.x + (dx < -5 ? -8 : dx > 5 ? 8 : 0), q.y + (dy > 5 ? 26 : dy < -5 ? -24 : 0), { color: c.faint, size: 10, align: dx < -5 ? 'right' : dx > 5 ? 'left' : 'center', fit: W });
      });
      var E = orbitPos(n), er = narrow ? 13 : 17;
      function drawSun() {
        var g = ctx.createRadialGradient(ocx, ocy, 2, ocx, ocy, narrow ? 30 : 40);
        g.addColorStop(0, '#fff7cc'); g.addColorStop(0.5, '#fbbf24'); g.addColorStop(1, 'rgba(251,191,36,0)');
        D.circle(ctx, ocx, ocy, narrow ? 30 : 40, g);
        D.text(ctx, 'Sun', ocx, ocy, { color: '#78350f', size: 11, weight: 700, align: 'center' });
      }
      function drawEarth() {
        // lit half faces the Sun
        var toSun = Math.atan2(ocy - E.y, ocx - E.x);
        D.circle(ctx, E.x, E.y, er, '#0f2a4a');
        ctx.beginPath(); ctx.arc(E.x, E.y, er, toSun - Math.PI / 2, toSun + Math.PI / 2); ctx.closePath(); ctx.fillStyle = '#3b82f6'; ctx.fill();
        // axis: always leans the same way (towards the right on the screen)
        var ta = tilt / R2D, L = er + 9;
        D.line(ctx, E.x - Math.sin(ta) * L, E.y + Math.cos(ta) * L, E.x + Math.sin(ta) * L, E.y - Math.cos(ta) * L, c.ink, 2);
        D.text(ctx, 'N', E.x + Math.sin(ta) * (L + 7), E.y - Math.cos(ta) * (L + 7), { color: c.ink, size: 10, weight: 700, align: 'center' });
      }
      if (E.front) { drawSun(); drawEarth(); } else { drawEarth(); drawSun(); }
      D.text(ctx, 'axis always points to the Pole Star ★', ocx, ay + ah - 12, { color: c.muted, size: 10, align: 'center', fit: aw });

      // ---- panel B: the Earth at noon, cut through the Sun and the axis
      var bx, by, bw, bh;
      if (narrow) { bx = 0; by = H * 0.44; bw = W; bh = H - by; } else { bx = W * 0.52; by = 0; bw = W - bx; bh = H; }
      D.line(ctx, narrow ? 10 : bx, narrow ? by : 10, narrow ? W - 10 : bx, narrow ? by : H - 10, c.grid, 1);
      var R = Math.min(bw * 0.3, bh * 0.33), cx = bx + bw * 0.44, cy = by + bh * 0.52;
      D.text(ctx, 'Noon at ' + place.name.split(' (')[0], bx + 10, by + 14, { color: c.ink, size: 12, weight: 700, fit: W });
      // sunlight from the right
      for (var k = -3; k <= 3; k++) {
        var yy = cy + k * R * 0.3;
        D.arrow(ctx, bx + bw - 6, yy, cx + Math.sqrt(Math.max(0, R * R - (yy - cy) * (yy - cy))) + 6, yy, D.alpha('#fbbf24', 0.65), 1.6, 6);
      }
      D.circle(ctx, cx, cy, R, '#1e6aa8');
      // night half (left of the terminator)
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); ctx.fillStyle = 'rgba(3,7,18,0.7)'; ctx.fill();
      function P(latDeg, side) { // point on the rim at a latitude; side +1 = day side, −1 = far side
        var a = (latDeg - d) / R2D; return side > 0 ? { x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) } : { x: cx - R * Math.cos((latDeg + d) / R2D), y: cy - R * Math.sin((latDeg + d) / R2D) };
      }
      // latitude circles seen edge-on: equator, tropics, arctic circle
      [[0, 'Equator', c.ink], [23.44, 'Tropic of Cancer', '#fde68a'], [-23.44, 'Tropic of Capricorn', '#fde68a'], [66.56, '', 'rgba(255,255,255,0.4)']].forEach(function (L) {
        var p1 = P(L[0], 1), p2 = P(L[0], -1);
        D.line(ctx, p1.x, p1.y, p2.x, p2.y, D.alpha(L[2].charAt(0) === '#' ? L[2] : '#ffffff', 0.5), 1, [3, 3]);
        if (L[1] && !narrow) D.text(ctx, L[1], p2.x - 4, p2.y, { color: c.faint, size: 9, align: 'right' });
      });
      // the chosen place's latitude circle: lit part vs dark part
      var q1 = P(lat, 1), q2 = P(lat, -1);
      D.line(ctx, q1.x, q1.y, q2.x, q2.y, '#4ade80', 2.5);
      // axis
      var pa = (90 - d) / R2D;
      D.line(ctx, cx - Math.cos(pa) * (R + 16), cy + Math.sin(pa) * (R + 16), cx + Math.cos(pa) * (R + 16), cy - Math.sin(pa) * (R + 16), c.ink, 2);
      D.text(ctx, 'N', cx + Math.cos(pa) * (R + 26), cy - Math.sin(pa) * (R + 26), { color: c.ink, size: 11, weight: 700, align: 'center' });
      D.text(ctx, 'day', cx + R * 0.55, cy + R + 14, { color: '#fbbf24', size: 10, align: 'center' });
      D.text(ctx, 'night', cx - R * 0.55, cy + R + 14, { color: c.muted, size: 10, align: 'center' });
      // the place, its horizon and the Sun's rays
      var alt = noonAlt(lat, d);
      D.circle(ctx, q1.x, q1.y, 5, '#4ade80', '#000', 1);
      if (alt > 0) {
        var up = (lat - d) / R2D, tx = -Math.sin(up), ty = -Math.cos(up); // horizon direction (screen)
        D.line(ctx, q1.x - tx * 26, q1.y - ty * 26, q1.x + tx * 26, q1.y + ty * 26, '#4ade80', 2);
        D.arrow(ctx, q1.x + 60, q1.y, q1.x + 8, q1.y, '#fbbf24', 2.5, 8);
        D.text(ctx, M.fmt(alt, 0) + '° high', q1.x + 34, q1.y + (lat - d > 0 ? 14 : -14), { color: '#fbbf24', size: 11, weight: 700, align: 'center', fit: W, bg: D.alpha(c.bg, 0.7), pad: 2 });
      } else D.text(ctx, 'Sun below the horizon all day', q1.x + 10, q1.y + 16, { color: c.muted, size: 11, fit: W, bg: D.alpha(c.bg, 0.7), pad: 2 });

      // headline
      var hl = tilt < 1 ? 'No tilt: every place gets 12 h of day all year'
        : d > 0.5 ? 'North half leans towards the Sun → long days, high Sun'
        : d < -0.5 ? 'North half leans away from the Sun → short days, low Sun'
        : 'Equinox: day and night are equal everywhere';
      var hs = narrow ? 11 : 12;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > bw - 20) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, bx + bw / 2, by + bh - 14, { color: c.bg, bg: d >= 0 ? c.warning : c.s1, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
