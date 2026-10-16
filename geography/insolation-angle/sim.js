/* =====================================================================
   Weather and climate · Why a Low Sun Heats Less — sim.js
   ---------------------------------------------------------------------
   One place on the Earth through one day (sun time: 12:00 is when the
   sun is highest). Play runs the day from sunrise to sunset, 2 hours of
   the day per second.

   Sun position (latitude φ, declination δ, hour angle h = 15° per hour):
     sun vector (east, north, up) =
       (−cos δ sin h,  cos φ sin δ − sin φ cos δ cos h,  sin φ sin δ + cos φ cos δ cos h)
     δ = 23.44° · sin(360° · (284 + day) / 365)
   Ground: flat, or sloping by β facing south (+) or north (−); the
   angle θ between the sun and the ground's "straight up" gives
     a 1 m wide beam spreads over 1 / cos θ metres of ground.
   Air: path length through the air, in "air masses" (1 = sun overhead),
   from the Kasten–Young formula; direct sunlight = 1361 · τ^(air mass),
   τ = share that gets through one air mass (clear dry 0.70, hazy 0.62).
   Scattered (diffuse) light: 20 % of what the air takes out of the beam.
   Cloudy sky: direct × 0.25, diffuse × 1.6 (rough monsoon-cloud value).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, R = Math.PI / 180, S0 = 1361;

  var SKIES = {
    clear: { tau: 0.70, dir: 1, dif: 1, name: 'clear, dry air' },
    hazy: { tau: 0.62, dir: 1, dif: 1, name: 'hazy, humid air' },
    cloudy: { tau: 0.62, dir: 0.25, dif: 1.6, name: 'cloudy' }
  };
  var MONTHS = [['Jan', 21], ['Feb', 52], ['Mar', 80], ['Apr', 111], ['May', 141], ['Jun', 172], ['Jul', 202], ['Aug', 233], ['Sep', 266], ['Oct', 294], ['Nov', 325], ['Dec', 355]];

  function decl(day) { return 23.44 * Math.sin(2 * Math.PI * (284 + day) / 365); }
  function sunVec(lat, dec, hr) {
    var h = (hr - 12) * 15 * R, f = lat * R, d = dec * R;
    return { e: -Math.cos(d) * Math.sin(h), n: Math.cos(f) * Math.sin(d) - Math.sin(f) * Math.cos(d) * Math.cos(h),
      u: Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(h) };
  }
  function airMass(altDeg) { return 1 / (Math.sin(altDeg * R) + 0.50572 * Math.pow(altDeg + 6.07995, -1.6364)); }
  /* Sunlight on the ground (W/m²) and the pieces of the story. */
  function light(c, hr) {
    var s = sunVec(c.lat, c.dec, hr), alt = Math.asin(M.clamp(s.u, -1, 1)) / R;
    var b = c.slope * R, nrm = { e: 0, n: -Math.sin(b), u: Math.cos(b) };          // + slope faces south
    var cosT = s.e * nrm.e + s.n * nrm.n + s.u * nrm.u;
    var out = { alt: alt, cosT: cosT, am: 0, top: 0, direct: 0, diffuse: 0, total: 0, topFlat: 0, through: 0 };
    if (alt <= 0) return out;
    var sk = SKIES[c.sky] || SKIES.clear, am = airMass(alt), dni = S0 * Math.pow(sk.tau, am);
    out.am = am;
    out.through = Math.pow(sk.tau, am) * sk.dir;
    out.topFlat = S0 * s.u;
    out.top = S0 * Math.max(0, cosT);
    out.direct = dni * Math.max(0, cosT) * sk.dir;
    out.diffuse = 0.2 * (S0 - dni) * s.u * sk.dif * (1 + Math.cos(b)) / 2;
    out.total = out.direct + out.diffuse;
    return out;
  }
  function dayTotals(c) {
    var tot = 0, top = 0, dl = 0, dt = 0.05;
    for (var t = dt / 2; t < 24; t += dt) { var L = light(c, t); tot += L.total * dt; top += L.top * dt; if (L.alt > 0) dl += dt; }
    var f = c.lat * R, d = c.dec * R, x = -Math.tan(f) * Math.tan(d);
    var h0 = x <= -1 ? 12 : x >= 1 ? 0 : Math.acos(x) / R / 15;
    return { kwh: tot / 1000, top: top / 1000, len: 2 * h0, rise: 12 - h0, set: 12 + h0 };
  }
  function clock(hr) {
    var m = Math.round(hr * 60); m = ((m % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  var st = { c: null, hr: 12, d: null, start: 0, end: 24, fresh: true };

  SimLab.createSim({
    ariaLabel: 'Left: the Earth with parallel sunlight and the chosen place at its latitude at noon. Right: a close-up of the ground where a 1 metre wide beam of sunlight crosses a layer of air and lands on the ground; when the sun is low the beam passes through more air and spreads over a longer strip of ground. A graph shows the sunlight reaching the ground through the day',
    playLabel: 'Run the day',
    mobileAspect: '1 / 1',
    params: [
      { id: 'lat', label: 'Latitude (north)', min: 0, max: 80, step: 1, value: 27, unit: '°',
        presets: [{ label: 'Equator 0', value: 0 }, { label: 'Chennai 13', value: 13 }, { label: 'Thar 27', value: 27 }, { label: 'Srinagar 34', value: 34 }, { label: 'Oslo 60', value: 60 }],
        help: 'How far north of the equator the place is. The Tropic of Cancer (23.4°) crosses Gujarat, Madhya Pradesh, Jharkhand and West Bengal.' },
      { id: 'month', label: 'Date', type: 'select', value: '172', options: MONTHS.map(function (m) { return { value: String(m[1]), label: '21 ' + m[0] + (m[0] === 'Jun' ? ' (longest day)' : m[0] === 'Dec' ? ' (shortest day)' : m[0] === 'Mar' || m[0] === 'Sep' ? ' (equinox)' : '') }; }) },
      { id: 'hour', label: 'Time of day (sun time)', min: 4, max: 20, step: 0.25, value: 12, unit: 'h', presets: [{ label: '7 am', value: 7 }, { label: 'Noon', value: 12 }, { label: '5 pm', value: 17 }],
        help: '12:00 is when the sun is highest. Run the day to watch it change.' },
      { id: 'slope', label: 'Ground slope (+ faces south, − faces north)', min: -40, max: 40, step: 5, value: 0, unit: '°',
        presets: [{ label: 'North 30', value: -30 }, { label: 'Flat', value: 0 }, { label: 'South 30', value: 30 }] },
      { id: 'sky', label: 'Sky', type: 'select', value: 'clear', options: [{ value: 'clear', label: 'Clear, dry air (desert)' }, { value: 'hazy', label: 'Hazy, humid air' }, { value: 'cloudy', label: 'Cloudy (monsoon, equator)' }] }
    ],
    onParam: function (sim, id, v) {
      if (id === 'hour') { st.hr = v; st.fresh = true; build(sim, false); return false; }
      return false;
    },
    readouts: [
      { id: 'alt', label: 'Sun height above the horizon', short: 'Sun height', unit: '°', digits: 1, key: true },
      { id: 'w', label: 'Sunlight on 1 m² of ground now', short: 'On ground', unit: 'W/m²', digits: 0, key: true },
      { id: 'day', label: 'Sunlight over the whole day', short: 'Day total', unit: 'kWh/m²', digits: 2, key: true },
      { id: 'spread', label: 'A 1 m wide beam covers', unit: 'm of ground', digits: 2 },
      { id: 'am', label: 'Air the beam crosses (overhead sun = 1)', unit: '×', digits: 2 },
      { id: 'kept', label: 'Share of the direct beam getting through the air', unit: '%', digits: 0 },
      { id: 'len', label: 'Day length', unit: 'h', digits: 1 },
      { id: 'noon', label: 'Noon sun height', unit: '°', digits: 1 },
      { id: 'clock', label: 'Time (sun time)' }
    ],
    graph: { title: 'Sunlight on 1 m² through the day', xLabel: 'time of day (h)', yLabel: 'W/m²', xMax: 24, yMin: 0,
      series: [{ label: 'Top of the air (spreading only)', color: '--sim-3' }, { label: 'Reaching this ground', color: '--sim-2' }] },

    reset: function (sim) { build(sim, true); },
    finished: function () { return !st.fresh && st.hr >= st.end; },
    update: function (sim, dt) {
      if (st.fresh) { st.fresh = false; st.hr = st.start; }
      st.hr = Math.min(st.end, st.hr + dt * 2);
    },
    readout: function () {
      var L = light(st.c, st.hr), up = L.alt > 0 && L.cosT > 0;
      var noonAlt = 90 - Math.abs(st.c.lat - st.c.dec);
      return { alt: L.alt, w: L.total, day: st.d.kwh, spread: up ? 1 / L.cosT : '—', am: L.alt > 0 ? L.am : '—',
        kept: L.alt > 0 ? 100 * L.through : '—', len: st.d.len, noon: noonAlt > 90 ? 180 - noonAlt : noonAlt, clock: clock(st.hr) };
    },
    status: function () {
      var L = light(st.c, st.hr);
      if (L.alt <= 0) return clock(st.hr) + ' · the sun is below the horizon: no sunlight';
      if (L.cosT <= 0) return clock(st.hr) + ' · the sun is behind this slope: only scattered light';
      return clock(st.hr) + ' · sun ' + M.fmt(L.alt, 0) + '° high: a 1 m beam spreads over ' + M.fmt(1 / L.cosT, 2) + ' m and crosses ' + M.fmt(L.am, 1) + '× the air of an overhead sun';
    },
    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, W = sim.width, H = sim.height;
      D.clear(ctx, W, H, c.bg);
      var side = W >= 560 && W / H >= 1.2, gap = 8, small = W < 560 || H < 420;
      var gb, cb;
      if (side) { var gw = Math.min(W * 0.4, H); gb = [gap, gap, gw - gap, H - gap * 2]; cb = [gw + gap, gap, W - gw - gap * 2, H - gap * 2]; }
      else { var gh = Math.round(H * 0.36); gb = [gap, gap, W - gap * 2, gh]; cb = [gap, gh + gap * 2, W - gap * 2, H - gh - gap * 3]; }
      drawGlobe(ctx, c, gb, small);
      drawClose(ctx, c, cb, small);
    }
  });

  function build(sim, resetClock) {
    var p = sim.p;
    st.c = { lat: p.lat, dec: decl(+p.month), slope: p.slope, sky: p.sky, mon: (MONTHS.filter(function (m) { return String(m[1]) === String(p.month); })[0] || MONTHS[5])[0] };
    st.d = dayTotals(st.c);
    st.start = st.d.len >= 24 ? 0 : st.d.len <= 0 ? 12 : Math.max(0, st.d.rise - 0.25);
    st.end = st.d.len >= 24 ? 24 : st.d.len <= 0 ? 12 : Math.min(24, st.d.set + 0.25);
    if (resetClock) { st.hr = p.hour; st.fresh = true; }
    if (sim.graph) {
      sim.graph.clear();
      for (var t = 0; t <= 24.001; t += 0.25) { var L = light(st.c, t); sim.graph.push(t, [L.top, L.total]); }
    }
  }

  /* ---------- left: the Earth at noon ---------- */
  function drawGlobe(ctx, c, b, small) {
    var x0 = b[0], y0 = b[1], w = b[2], h = b[3];
    D.roundRect(ctx, x0, y0, w, h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.2), 1);
    var fs = small ? 10 : 12, r = Math.min(w * 0.3, h * 0.36), cx = x0 + w * 0.6, cy = y0 + h * 0.54;
    var dec = st.c.dec, lat = st.c.lat;
    // sunlight from the left
    for (var k = -3; k <= 3; k++) {
      var ry = cy + k * r * 0.3, half = Math.sqrt(Math.max(0, r * r - (ry - cy) * (ry - cy)));
      D.arrow(ctx, x0 + 8, ry, cx - half - 2, ry, 'rgba(250,204,21,0.45)', 1.5, 6);
    }
    D.text(ctx, '☀ sunlight', x0 + 8, y0 + 12, { color: c.warning, size: fs, weight: 700 });
    // day / night halves
    D.circle(ctx, cx, cy, r, '#2563eb');
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fillStyle = 'rgba(2,6,23,0.6)'; ctx.fill(); ctx.restore();
    // axis, equator and tropics (seen edge-on as lines)
    var ax = { x: -Math.sin(dec * R), y: -Math.cos(dec * R) };           // towards the North Pole
    function onGlobe(phi) { var a = (phi - dec) * R; return { x: cx - r * Math.cos(a), y: cy - r * Math.sin(a) }; }
    function latLine(phi, col, dash, label) {
      var a = phi * R, px = cx + ax.x * r * Math.sin(a), py = cy + ax.y * r * Math.sin(a), hw = r * Math.cos(a);
      D.line(ctx, px - ax.y * hw, py + ax.x * hw, px + ax.y * hw, py - ax.x * hw, col, 1.2, dash);
      if (label && !small) { D.text(ctx, label, px + ax.y * hw + 4, py - ax.x * hw, { color: c.muted, size: 9 }); }
    }
    latLine(0, 'rgba(255,255,255,0.7)', null, 'equator');
    latLine(23.44, 'rgba(255,255,255,0.35)', [3, 3]);
    latLine(-23.44, 'rgba(255,255,255,0.35)', [3, 3]);
    D.line(ctx, cx - ax.x * r * 1.18, cy - ax.y * r * 1.18, cx + ax.x * r * 1.18, cy + ax.y * r * 1.18, D.alpha(c.ink, 0.6), 1.5);
    D.text(ctx, 'N', cx + ax.x * r * 1.26, cy + ax.y * r * 1.26, { color: c.ink, size: fs, weight: 700, align: 'center' });
    // the place, its horizon and the noon sun angle
    var P = onGlobe(lat), a = (lat - dec) * R, nx = -Math.cos(a), ny = -Math.sin(a);
    var lit = Math.abs(lat - dec) < 90;
    var tl = r * 0.55;
    D.line(ctx, P.x - ny * tl, P.y + nx * tl, P.x + ny * tl, P.y - nx * tl, c.success, 2);
    D.arrow(ctx, P.x - r * 0.9, P.y, P.x - 3, P.y, '#facc15', 2.5, 8);
    D.circle(ctx, P.x, P.y, 5, '#ef4444', '#fff', 1.5);
    var noonAlt = 90 - Math.abs(lat - dec);
    if (lit) {
      // arc for the sun height between the horizon and the incoming ray
      var hz = Math.atan2(nx, -ny), ray = Math.PI;                       // horizon direction pointing sunwards
      var hzSun = (Math.cos(hz) < 0) ? hz : hz + Math.PI;
      ctx.save(); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5; ctx.beginPath();
      var a0 = Math.min(hzSun, ray), a1 = Math.max(hzSun, ray);
      if (a1 - a0 > Math.PI) { var tmp = a0; a0 = a1; a1 = tmp + 2 * Math.PI; }
      ctx.arc(P.x, P.y, r * 0.32, a0, a1); ctx.stroke(); ctx.restore();
    }
    D.text(ctx, lit ? 'noon sun ' + M.fmt(Math.min(noonAlt, 180 - noonAlt), 0) + '° high' : 'polar night: no sun', x0 + w / 2, y0 + h - (small ? 10 : 14), { color: c.ink, bg: D.alpha(c.bg, 0.8), size: fs, weight: 700, align: 'center', pad: 3 });
    D.text(ctx, M.fmt(lat, 0) + '° N · 21 ' + st.c.mon, x0 + w - 8, y0 + 12, { color: c.muted, size: fs, align: 'right' });
  }

  /* ---------- right: the beam close-up ---------- */
  function drawClose(ctx, c, b, small) {
    var x0 = b[0], y0 = b[1], w = b[2], h = b[3], fs = small ? 10 : 12;
    var L = light(st.c, st.hr), day = L.alt > 0;
    ctx.save(); D.roundRect(ctx, x0, y0, w, h, 10, null); ctx.clip();
    var dl = M.clamp(L.alt / 15, 0, 1);
    var g = ctx.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, day ? (st.c.sky === 'cloudy' ? '#64748b' : '#3b82c4') : '#0a1024'); g.addColorStop(1, day ? (st.c.sky === 'clear' ? '#bfe0fb' : '#cbd5e1') : '#1e2b4f');
    ctx.globalAlpha = 0.35 + 0.65 * dl; ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h); ctx.globalAlpha = 1;
    // layer of air
    var airTop = y0 + h * 0.08, airBot = y0 + h * 0.34;
    ctx.fillStyle = st.c.sky === 'clear' ? 'rgba(255,255,255,0.10)' : 'rgba(226,232,240,0.28)';
    ctx.fillRect(x0, airTop, w, airBot - airTop);
    D.line(ctx, x0, airTop, x0 + w, airTop, 'rgba(255,255,255,0.5)', 1, [4, 4]);
    D.line(ctx, x0, airBot, x0 + w, airBot, 'rgba(255,255,255,0.5)', 1, [4, 4]);
    D.text(ctx, small ? 'air (drawn thin)' : 'layer of air (drawn thin)', x0 + w - 6, (airTop + airBot) / 2, { color: '#fff', bg: 'rgba(15,23,42,0.55)', size: fs - 1, align: 'right', pad: 2 });
    if (st.c.sky === 'cloudy') for (var q = 0; q < 4; q++) cloud(ctx, x0 + w * (0.12 + q * 0.25), airTop + (airBot - airTop) * 0.5, small ? 11 : 16);
    // ground (sloped)
    var beta = st.c.slope * R, gcx = x0 + w * 0.5, gcy = y0 + h * 0.8, gl = w * 1.2;
    var gx = Math.cos(beta), gy = -Math.sin(beta);                     // screen direction along the ground (left → right)
    function ground() {
      ctx.beginPath(); ctx.moveTo(gcx - gx * gl, gcy - gy * gl); ctx.lineTo(gcx + gx * gl, gcy + gy * gl);
      ctx.lineTo(gcx + gx * gl, y0 + h + gl); ctx.lineTo(gcx - gx * gl, y0 + h + gl); ctx.closePath();
      ctx.fillStyle = st.c.sky === 'clear' ? '#c79a5b' : '#6b8e3f'; ctx.fill();
    }
    // beam: 2-D drawing with the true angle between the sun and the ground
    var unit = Math.min(w * 0.22, h * 0.28);                             // 1 m in pixels
    if (day && L.cosT > 0.02) {
      var th = Math.acos(M.clamp(L.cosT, -1, 1));                          // angle from the ground's normal
      var nX = -Math.sin(beta), nY = -Math.cos(beta);                     // ground's "straight up" on screen
      // direction towards the sun: normal turned towards the left (south side)
      var sx = Math.cos(th) * nX - Math.sin(th) * gx, sy = Math.cos(th) * nY - Math.sin(th) * gy;
      var spread = unit / Math.cos(th);
      var p1 = { x: gcx - gx * spread / 2, y: gcy - gy * spread / 2 }, p2 = { x: gcx + gx * spread / 2, y: gcy + gy * spread / 2 };
      var far = Math.hypot(w, h) * 1.5, k = (L.total / 1050);
      var bright = M.clamp(0.25 + 0.75 * k, 0.15, 1);
      // beam above the air, then dimmer below it
      ctx.save();
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p1.x + sx * far, p1.y + sy * far); ctx.lineTo(p2.x + sx * far, p2.y + sy * far); ctx.lineTo(p2.x, p2.y); ctx.closePath();
      ctx.clip();
      ctx.fillStyle = 'rgba(253,224,71,0.85)'; ctx.fillRect(x0, y0, w, airTop - y0);
      var gb = ctx.createLinearGradient(0, airTop, 0, airBot); gb.addColorStop(0, 'rgba(253,224,71,0.85)'); gb.addColorStop(1, 'rgba(253,224,71,' + (0.25 + 0.6 * L.through).toFixed(2) + ')');
      ctx.fillStyle = gb; ctx.fillRect(x0, airTop, w, airBot - airTop);
      ctx.fillStyle = 'rgba(253,224,71,' + (0.25 + 0.6 * L.through).toFixed(2) + ')'; ctx.fillRect(x0, airBot, w, h);
      ctx.restore();
      ground();
      // rays inside the beam (drawn down to the ground only)
      for (var i = 0; i <= 4; i++) {
        var t = i / 4, qx = p1.x + (p2.x - p1.x) * t, qy = p1.y + (p2.y - p1.y) * t;
        D.arrow(ctx, qx + sx * far, qy + sy * far, qx, qy, 'rgba(180,83,9,0.55)', 1.2, 7);
      }
      // the lit strip on the ground
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(254,240,138,' + bright.toFixed(2) + ')'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.restore();
      // 1 m across the beam
      var cx2 = gcx + sx * unit * 1.6, cy2 = gcy + sy * unit * 1.6, px = -sy, py = sx;
      if (cy2 > airBot + 10) {
        D.line(ctx, cx2 - px * unit / 2, cy2 - py * unit / 2, cx2 + px * unit / 2, cy2 + py * unit / 2, '#fff', 2);
        D.text(ctx, '1 m beam', cx2 + px * unit / 2 + 4, cy2 + py * unit / 2, { color: '#fff', bg: 'rgba(15,23,42,0.6)', size: fs, weight: 700, pad: 2 });
      }
      // label for the strip
      var ly = Math.max(p1.y, p2.y) + (small ? 16 : 20);
      D.text(ctx, 'spreads over ' + M.fmt(1 / L.cosT, 2) + ' m', M.clamp(gcx, x0 + 70, x0 + w - 70), Math.min(y0 + h - (small ? 26 : 32), ly), { color: '#fff', bg: 'rgba(15,23,42,0.7)', size: fs, weight: 700, align: 'center', pad: 3 });
      // sun height arc next to the strip (only on flat ground; on a slope the angle with the ground is shown)
      D.text(ctx, (st.c.slope ? 'sun–ground angle ' + M.fmt(90 - th / R, 0) : 'sun ' + M.fmt(L.alt, 0)) + '°', x0 + 8, airBot + (small ? 14 : 18), { color: '#fff', bg: 'rgba(15,23,42,0.6)', size: fs, weight: 600, pad: 2 });
      // air path
      D.text(ctx, 'air crossed ×' + M.fmt(L.am, 1) + ' · ' + M.fmt(100 * L.through, 0) + '% of the beam gets through', x0 + 8, y0 + (small ? 12 : 16), { color: '#fff', bg: 'rgba(15,23,42,0.7)', size: fs, weight: 600, pad: 2, fit: x0 + w });
    } else {
      ground();
      D.text(ctx, day ? 'the sun is behind this slope' : 'night: the sun is below the horizon', x0 + w / 2, airBot + (h - (airBot - y0)) * 0.3, { color: '#fff', bg: 'rgba(15,23,42,0.7)', size: fs + 1, weight: 700, align: 'center', pad: 4 });
    }
    // heating meter
    var mW = small ? 12 : 16, mx = x0 + w - mW - 10, my0 = airBot + 30, my1 = y0 + h - 14;
    if (my1 - my0 > 40) {
      var fr = M.clamp(L.total / 1100, 0, 1);
      D.roundRect(ctx, mx, my0, mW, my1 - my0, 4, 'rgba(15,23,42,0.55)', 'rgba(255,255,255,0.5)', 1);
      D.roundRect(ctx, mx + 2, my1 - 2 - (my1 - my0 - 4) * fr, mW - 4, (my1 - my0 - 4) * fr, 3, fr > 0.6 ? '#ef4444' : fr > 0.3 ? '#f97316' : '#facc15');
      D.text(ctx, M.fmt(L.total, 0) + ' W/m²', mx + mW, my0 - 10, { color: '#fff', bg: 'rgba(15,23,42,0.7)', size: fs, weight: 700, align: 'right', pad: 2 });
    }
    ctx.restore();
    D.roundRect(ctx, x0 + 0.5, y0 + 0.5, w - 1, h - 1, 10, null, D.alpha(c.ink, 0.25), 1);
  }
  function cloud(ctx, x, y, s) {
    var col = 'rgba(241,245,249,0.85)';
    D.circle(ctx, x - s * 0.6, y + s * 0.1, s * 0.5, col); D.circle(ctx, x + s * 0.6, y + s * 0.1, s * 0.45, col); D.circle(ctx, x, y - s * 0.15, s * 0.65, col);
  }
})();
