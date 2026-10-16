/* =====================================================================
   Weather and climate · How Wind Shapes the Desert — sim.js
   ---------------------------------------------------------------------
   Three scenes of wind erosion and deposition.

   1. Mushroom rock (side view, 1 s of Play = 100 years).
      Wind-blown sand bounces along in low hops, so it hits a rock
      hardest a little above the ground. Wear rate at height z:
        E(z) = (1 mm/yr · f(u) · g(z) + 0.1 mm/yr weathering) / hardness(z)
        g(z) = (z / 0.35 m) · e^(1 − z / 0.35 m)    (most hits below 1 m)
        f(u) = ((u − 5) / 5)³ for wind u above 5 m/s (= 1 at 10 m/s)
      Both sides wear (over a year the wind blows from many sides).
      The hard cap rock wears 6 times more slowly than the sandstone.
   2. Barchan dunes (top view + side view, 1 s = 1 year).
      A dune moves downwind as sand is blown up its gentle windward
      side (about 12°) and slides down its steep slip face (about 33°):
        speed c = Q / H      (Q = sand flux per metre of width, H = height)
        Q = 150 m²/yr · f(u)
      so a dune half as tall moves twice as fast.
   3. Loess (side view of 1000 km, 1 s = 2 hours).
      A dust storm lifts dust to a height that grows with the wind.
      Each grain is carried at the wind speed, falls at its settling
      speed (Stokes: w = (ρ − ρair) g d² / 18μ) and is mixed up and down
      by turbulence (random steps, K = 50 m²/s); a grain that touches the
      ground sticks with chance w / (w + 1 cm/s), else it is mixed back
      up (so heavy silt settles, light clay mostly does not). Sand (0.2 mm) only hops
      near the ground and stays in the desert; silt (0.03 mm, w ≈ 7 cm/s)
      falls out hundreds of km away as loess; clay (0.002 mm,
      w ≈ 0.3 mm/s) stays up for days and leaves the picture.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  function windF(u) { return u <= 5 ? 0 : Math.pow((u - 5) / 5, 3); }
  function hitShare(z) { var x = z / 0.35; return x <= 0 ? 0 : x * Math.exp(1 - x); }
  function randn(r) { return Math.sqrt(-2 * Math.log(Math.max(1e-9, r()))) * Math.cos(2 * Math.PI * r()); }

  /* ---------- scene 1: mushroom rock ---------- */
  var NZ = 72, ROCK_H = 6, CAP_Z = 4.6, HW0 = 1.5, WEATHER = 0.0001;   // + 0.1 mm/yr all over (rain, heat cracking)
  function hardness(z, cap) { return cap && z >= CAP_Z ? 6 : 1; }
  function rockInit(s, cap) {
    s.hw = []; s.z = [];
    for (var i = 0; i < NZ; i++) {
      var z = (i + 0.5) * ROCK_H / NZ, top = ROCK_H - z;
      s.z.push(z); s.hw.push(top < 0.6 ? HW0 - 0.6 + Math.sqrt(Math.max(0, 0.36 - (0.6 - top) * (0.6 - top))) : HW0);
    }
    s.cap = cap; s.years = 0; s.fallen = false; s.grains = [];
  }
  function rockNeck(s) {
    var top = s.cap ? CAP_Z : ROCK_H * 0.8, best = 0;
    for (var i = 1; i < NZ; i++) if (s.z[i] < top && s.hw[i] < s.hw[best]) best = i;
    return best;
  }
  function rockStep(s, u, years) {
    var f = windF(u);
    for (var i = 0; i < NZ; i++) s.hw[i] = Math.max(0.02, s.hw[i] - (0.001 * f * hitShare(s.z[i]) + WEATHER) / hardness(s.z[i], s.cap) * years);
    s.years += years;
    if (s.hw[rockNeck(s)] < 0.14) s.fallen = true;
  }

  /* ---------- scene 2: barchan dunes ---------- */
  var FIELD_L = 600, FIELD_W = 300, ROAD_X = 470;
  var DUNES = [{ H: 3, y: 50, x0: 80 }, { H: 6, y: 128, x0: 60 }, { H: 12, y: 232, x0: 40 }];
  function flux(u) { return 150 * windF(u); }

  /* ---------- scene 3: loess ---------- */
  var KINDS = { silt: { w: 0.072, col: '#ca8a04', r: 2.4 }, clay: { w: 0.0003, col: '#64748b', r: 1.7 } };
  var X_MAX = 1000e3, Z_MAX = 4000, LDT = 120, BINS = 40;
  function liftH(u) { return M.clamp(300 * (u - 4), 0, 3000); }

  var st = { scene: 'rock', anim: 0 };

  SimLab.createSim({
    ariaLabel: 'Wind at work in a desert. Mushroom rock: wind-blown sand grains hop along close to the ground and wear away the base of a rock until it stands on a thin neck. Moving dunes: crescent-shaped barchan dunes seen from above march downwind towards a road, small dunes faster than big ones, with a side view of sand climbing the gentle windward slope and sliding down the steep slip face. Loess: a dust storm over the desert lifts fine dust that the wind carries hundreds of kilometres before it settles as a layer of loess',
    playLabel: 'Let the wind blow',
    mobileAspect: '1 / 1',
    params: [
      { id: 'scene', label: 'Scene', type: 'select', value: 'rock', options: [{ value: 'rock', label: 'Mushroom rock (erosion)' }, { value: 'dunes', label: 'Moving sand dunes (deposition)' }, { value: 'loess', label: 'Dust carried far away: loess' }] },
      { id: 'wind', label: 'Wind speed on windy days', min: 4, max: 14, step: 0.5, value: 10, unit: 'm/s', presets: [{ label: 'Breeze 5', value: 5 }, { label: 'Windy 8', value: 8 }, { label: 'Strong 10', value: 10 }, { label: 'Storm 13', value: 13 }],
        help: 'Dry sand starts to move at about 5 m/s. Twice the extra speed above that moves about 8 times as much sand.' },
      { id: 'cap', label: 'Hard cap rock on top (mushroom rock)', type: 'toggle', value: true, help: 'A layer of hard rock over soft sandstone. Turn it off to see a rock that is the same all through.' }
    ],
    onParam: function () { return false; },
    readouts: [
      { id: 'time', label: 'Time passed', key: true },
      { id: 'main', label: 'What to watch', short: 'Watch', key: true },
      { id: 'rate', label: 'How fast', key: true },
      { id: 'neck', label: 'Rock: narrowest width', unit: 'm', digits: 2 },
      { id: 'capw', label: 'Rock: top width', unit: 'm', digits: 2 },
      { id: 'd3', label: 'Dune 3 m tall moves', unit: 'm/yr', digits: 1 },
      { id: 'd6', label: 'Dune 6 m tall moves', unit: 'm/yr', digits: 1 },
      { id: 'd12', label: 'Dune 12 m tall moves', unit: 'm/yr', digits: 1 },
      { id: 'silt', label: 'Silt: average distance travelled', unit: 'km', digits: 0 },
      { id: 'clay', label: 'Clay still floating (here or past 1000 km)', unit: '%', digits: 0 }
    ],

    reset: function (sim) {
      var p = sim.p, r = M.rng(7);
      st.scene = p.scene; st.u = p.wind; st.r = r; st.anim = 0;
      if (st.scene === 'rock') { st.rock = {}; rockInit(st.rock, p.cap); }
      if (st.scene === 'dunes') { st.years = 0; st.dunes = DUNES.map(function (d) { return { H: d.H, y: d.y, x: d.x0, buried: false }; }); st.grains = []; }
      if (st.scene === 'loess') { st.hours = 0; st.parts = []; st.dep = []; for (var b = 0; b < BINS; b++) st.dep.push(0); st.out = 0; st.siltSum = 0; st.siltN = 0; st.outClay = 0; st.lacc = 0; st.emitted = { silt: 0, clay: 0 }; }
    },
    finished: function () {
      if (st.scene === 'rock') return st.rock.fallen || st.rock.years >= 10000;
      if (st.scene === 'dunes') return st.years >= 40;
      return st.hours >= 60;
    },
    update: function (sim, dt) {
      st.anim += dt;
      var u = st.u;
      if (st.scene === 'rock') rockStep(st.rock, u, dt * 100);
      else if (st.scene === 'dunes') {
        st.years += dt;
        var Q = flux(u);
        st.dunes.forEach(function (d) {
          d.x += Q / d.H * dt;
          if (d.x - 7 * d.H > FIELD_L) d.x -= FIELD_L + 14 * d.H;
        });
      } else loessStep(dt * 7200);
    },
    readout: function () {
      var u = st.u, out = { time: '—', main: '—', rate: '—', neck: '—', capw: '—', d3: '—', d6: '—', d12: '—', silt: '—', clay: '—' };
      if (st.scene === 'rock') {
        var s = st.rock, n = rockNeck(s), topW = 2 * s.hw[NZ - 8];
        out.time = M.fmt(s.years, 0) + ' years';
        out.main = s.fallen ? 'the cap has fallen' : 'neck ' + M.fmt(2 * s.hw[n], 2) + ' m wide';
        out.rate = windF(u) > 0 ? 'base wears ' + M.fmt(windF(u), 2) + ' mm/yr' : 'too calm: no sand moves';
        out.neck = 2 * s.hw[n]; out.capw = topW;
      } else if (st.scene === 'dunes') {
        var Q = flux(u);
        out.time = M.fmt(st.years, 1) + ' years';
        out.main = Q > 0 ? 'small dunes move fastest' : 'too calm: dunes stay put';
        out.rate = 'sand flux ' + M.fmt(Q, 0) + ' m²/yr';
        out.d3 = Q / 3; out.d6 = Q / 6; out.d12 = Q / 12;
      } else {
        out.time = M.fmt(st.hours, 1) + ' hours';
        var land = st.siltN ? st.siltSum / st.siltN / 1000 : null;
        out.main = liftH(u) <= 0 ? 'too calm: no dust storm' : land ? 'silt lands ≈ ' + M.fmt(land, 0) + ' km away' : 'dust rising…';
        out.rate = liftH(u) > 0 ? 'dust lifted to ' + M.fmt(liftH(u) / 1000, 1) + ' km' : '—';
        out.silt = land == null ? '—' : land;
        var clayAir = 0; st.parts.forEach(function (q) { if (q.k === 'clay') clayAir++; });
        out.clay = st.emitted.clay ? 100 * (clayAir + st.outClay) / st.emitted.clay : '—';
      }
      return out;
    },
    status: function () {
      if (st.scene === 'rock') {
        if (windF(st.u) === 0) return 'The wind is too weak to lift sand: nothing wears away';
        return st.rock.fallen ? 'The neck became too thin and the cap fell off. Press Restart to try again.' : 'Sand hops close to the ground and blasts the base of the rock';
      }
      if (st.scene === 'dunes') return windF(st.u) === 0 ? 'Below about 5 m/s sand does not move' : 'Sand is blown up the gentle side and slides down the steep side, so the dune creeps downwind';
      return liftH(st.u) <= 0 ? 'The wind is too weak for a dust storm' : st.hours < 6 ? 'Dust storm: the wind lifts fine dust high into the air' : 'The storm is over: the dust settles out as it drifts downwind';
    },
    animate: function () { return false; },
    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, W = sim.width, H = sim.height;
      D.clear(ctx, W, H, c.bg);
      if (st.scene === 'rock') drawRock(ctx, c, W, H);
      else if (st.scene === 'dunes') drawDunes(ctx, c, W, H);
      else drawLoess(ctx, c, W, H);
    }
  });

  function sky(ctx, x, y, w, h) {
    var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#5b9bd5'); g.addColorStop(1, '#f6dcae');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }
  function label(ctx, txt, x, y, small, opts) {
    opts = opts || {};
    D.text(ctx, txt, x, y, { color: opts.color || '#fff', bg: opts.bg || 'rgba(15,23,42,0.68)', size: small ? 10 : 12, weight: opts.weight || 600, align: opts.align || 'left', pad: 3, fit: opts.fit });
  }
  function windArrow(ctx, x, y, len, small) {
    D.arrow(ctx, x, y, x + len, y, '#e0f2fe', small ? 2.5 : 3, small ? 8 : 11);
    label(ctx, 'wind', x + len / 2, y - (small ? 12 : 15), small, { align: 'center' });
  }

  /* ---------- drawing: mushroom rock ---------- */
  function drawRock(ctx, c, W, H) {
    var s = st.rock, small = W < 560 || H < 420;
    var groundY = H - (small ? 34 : 50), sc = Math.min(W / 11, (groundY - 30) / 7.2), cx = W * 0.52;
    function X(x) { return cx + x * sc; } function Y(z) { return groundY - z * sc; }
    sky(ctx, 0, 0, W, groundY);
    // ground
    ctx.fillStyle = '#d6a35e'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = 'rgba(120,72,30,0.25)'; ctx.fillRect(0, groundY + (H - groundY) * 0.5, W, H);
    // sand-hit profile on the left
    var gx = small ? 10 : 18, gw = Math.min(small ? 46 : 70, X(-2.6) - gx);
    if (gw > 24) {
      ctx.save(); ctx.fillStyle = 'rgba(249,115,22,0.35)'; ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, groundY);
      for (var z = 0; z <= 2.2; z += 0.04) ctx.lineTo(gx + gw * hitShare(z), Y(z));
      ctx.lineTo(gx, Y(2.2)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      label(ctx, small ? 'sand hits' : 'where sand hits', gx, Y(2.2) - (small ? 10 : 14), small, { color: '#fed7aa' });
    }
    // height ruler (1 m marks)
    var rx = W - (small ? 16 : 26);
    D.line(ctx, rx, groundY, rx, Y(7), 'rgba(15,23,42,0.6)', 2);
    for (var m = 0; m <= 7; m++) { D.line(ctx, rx - 5, Y(m), rx, Y(m), 'rgba(15,23,42,0.7)', 2); if (m % 2 === 0 || !small) D.text(ctx, m + ' m', rx - 7, Y(m), { color: '#0f172a', size: small ? 9 : 11, weight: 600, align: 'right' }); }
    // a person for scale (1.6 m)
    var px = X(3.5), ph = 1.6 * sc;
    if (px + 10 < rx - 30) {
      ctx.save(); ctx.strokeStyle = '#1e293b'; ctx.fillStyle = '#1e293b'; ctx.lineWidth = Math.max(2, sc * 0.08); ctx.lineCap = 'round';
      D.circle(ctx, px, groundY - ph + ph * 0.09, ph * 0.09, '#1e293b');
      ctx.beginPath(); ctx.moveTo(px, groundY - ph * 0.8); ctx.lineTo(px, groundY - ph * 0.42); ctx.moveTo(px, groundY - ph * 0.42); ctx.lineTo(px - ph * 0.12, groundY); ctx.moveTo(px, groundY - ph * 0.42); ctx.lineTo(px + ph * 0.12, groundY);
      ctx.moveTo(px, groundY - ph * 0.72); ctx.lineTo(px - ph * 0.15, groundY - ph * 0.5); ctx.moveTo(px, groundY - ph * 0.72); ctx.lineTo(px + ph * 0.15, groundY - ph * 0.5); ctx.stroke(); ctx.restore();
    }
    // rock
    var n = rockNeck(s);
    var pts = [];
    for (var i = 0; i < NZ; i++) pts.push({ x: -s.hw[i], z: s.z[i] });
    pts.unshift({ x: -s.hw[0], z: 0 });
    var right = [];
    for (var j = NZ - 1; j >= 0; j--) right.push({ x: s.hw[j], z: s.z[j] });
    right.push({ x: s.hw[0], z: 0 });
    var poly = pts.concat([{ x: 0, z: ROCK_H }]).concat(right);
    if (!s.fallen) fillRock(ctx, poly, X, Y, s.cap);
    else {
      var cut = s.z[n];
      var below = poly.filter(function (q) { return q.z <= cut; });
      fillRock(ctx, below, X, Y, s.cap);
      var above = poly.filter(function (q) { return q.z >= cut; });
      var a = 1.35, pv = { x: s.hw[n], z: cut }, rot = above.map(function (q) {
        var dx = q.x - pv.x, dz = q.z - pv.z;
        return { x: pv.x + dx * Math.cos(a) + dz * Math.sin(a), z: pv.z - dx * Math.sin(a) + dz * Math.cos(a), orig: q.z };
      });
      var minZ = Math.min.apply(null, rot.map(function (q) { return q.z; })), minX = Math.min.apply(null, rot.map(function (q) { return q.x; }));
      var shiftX = Math.max(s.hw[0], s.hw[n]) + 0.3 - minX;
      rot.forEach(function (q) { q.z -= minZ; q.x += shiftX; });
      fillRock(ctx, rot, X, Y, s.cap, true);
    }
    // neck marker
    if (!s.fallen && s.hw[n] < HW0 - 0.1) {
      var ny = Y(s.z[n]);
      D.line(ctx, X(-s.hw[n]), ny, X(s.hw[n]), ny, '#fff', 1.5, [3, 3]);
      label(ctx, 'neck ' + M.fmt(2 * s.hw[n], 2) + ' m', X(s.hw[n]) + 6, ny, small);
    }
    if (s.cap && !s.fallen && !small) label(ctx, 'hard cap rock', X(0), Y(5.3), small, { align: 'center' });
    // sand grains hopping (animation only)
    if (windF(st.u) > 0 && !s.fallen) {
      var r = M.rng(3), nG = Math.round(14 + 26 * Math.min(1, windF(st.u))), spd = 2.2 + st.u * 0.25;
      for (var k = 0; k < nG; k++) {
        var hop = Math.min(2, -0.3 * Math.log(Math.max(0.02, r())) + 0.05), len = hop * 7, off = r() * 40;
        var xx = ((st.anim * spd + off) % 12) - 6;              // world x from −6 to 6
        var ph2 = (((xx + 6) % len) + len) % len / len, zz = 4 * hop * ph2 * (1 - ph2);
        var hwAt = s.hw[M.clamp(Math.floor(zz / ROCK_H * NZ), 0, NZ - 1)];
        if (xx > -hwAt - 0.05) continue;                          // stopped at the rock
        D.circle(ctx, X(xx), Y(zz), small ? 1.6 : 2.2, '#9a5b22');
      }
    }
    windArrow(ctx, small ? 10 : 18, small ? 22 : 30, small ? 60 : 90, small);
    label(ctx, M.fmt(s.years, 0) + ' years', W / 2, small ? 14 : 18, small, { align: 'center', weight: 700 });
    if (s.fallen) label(ctx, 'the neck snapped: the cap fell', W / 2, small ? 34 : 44, small, { align: 'center', bg: 'rgba(185,28,28,0.85)' });
    else if (windF(st.u) === 0) label(ctx, 'too calm: sand does not move', W / 2, small ? 34 : 44, small, { align: 'center' });
  }
  function fillRock(ctx, poly, X, Y, cap, fallen) {
    ctx.save(); ctx.beginPath();
    poly.forEach(function (q, i) { ctx[i ? 'lineTo' : 'moveTo'](X(q.x), Y(q.z)); });
    ctx.closePath(); ctx.fillStyle = '#c0703c'; ctx.fill(); ctx.clip();
    // layers: soft sandstone bands, and the cap
    ctx.strokeStyle = 'rgba(120,53,15,0.35)'; ctx.lineWidth = 1;
    if (!fallen) {
      for (var z = 0.4; z < 6; z += 0.4) { ctx.beginPath(); ctx.moveTo(X(-3), Y(z)); ctx.lineTo(X(3), Y(z)); ctx.stroke(); }
      if (cap) { ctx.fillStyle = '#7c6a5c'; ctx.fillRect(X(-4), Y(7), X(4) - X(-4), Y(CAP_Z) - Y(7)); }
    } else {
      ctx.fillStyle = cap ? 'rgba(124,106,92,0.75)' : 'rgba(192,112,60,0.0)'; ctx.fillRect(X(-10), Y(10), X(10) - X(-10), Y(-1) - Y(10));
    }
    ctx.restore();
    ctx.save(); ctx.beginPath(); poly.forEach(function (q, i) { ctx[i ? 'lineTo' : 'moveTo'](X(q.x), Y(q.z)); }); ctx.closePath();
    ctx.strokeStyle = 'rgba(69,26,3,0.8)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  }

  /* ---------- drawing: dunes ---------- */
  function drawDunes(ctx, c, W, H) {
    var small = W < 560 || H < 420, gap = 8;
    var sideH = Math.round(Math.max(small ? 100 : 130, H * 0.32));
    var topBox = [gap, gap, W - gap * 2, H - sideH - gap * 3], sideBox = [gap, H - sideH - gap, W - gap * 2, sideH];
    // ---- top view ----
    var x0 = topBox[0], y0 = topBox[1], w = topBox[2], h = topBox[3];
    var sc = Math.min(w / FIELD_L, h / FIELD_W), ox = x0 + (w - FIELD_L * sc) / 2, oy = y0 + (h - FIELD_W * sc) / 2;
    ctx.save(); D.roundRect(ctx, x0, y0, w, h, 10, '#e9c48a'); ctx.clip();
    var rr = M.rng(9);
    for (var k = 0; k < 140; k++) D.circle(ctx, x0 + rr() * w, y0 + rr() * h, 1, 'rgba(146,98,48,0.35)');
    // road and fields beyond it
    var rx = ox + ROAD_X * sc;
    ctx.fillStyle = '#7fae5a'; ctx.fillRect(rx + 10 * sc, y0, x0 + w - rx, h);
    ctx.fillStyle = '#475569'; ctx.fillRect(rx, y0, Math.max(5, 8 * sc), h);
    D.line(ctx, rx + Math.max(5, 8 * sc) / 2, y0, rx + Math.max(5, 8 * sc) / 2, y0 + h, '#fde047', 1, [6, 6]);
    st.dunes.forEach(function (d) {
      barchan(ctx, ox + d.x * sc, oy + d.y * sc, 10 * d.H * sc);
      label(ctx, d.H + ' m', ox + (d.x - 2.5 * d.H) * sc, oy + d.y * sc, true, { align: 'center', bg: 'rgba(15,23,42,0.55)' });
    });
    ctx.restore();
    D.roundRect(ctx, x0 + 0.5, y0 + 0.5, w - 1, h - 1, 10, null, D.alpha(c.ink, 0.25), 1);
    label(ctx, small ? 'from above' : 'seen from above (' + FIELD_L + ' m across)', x0 + 8, y0 + 13, small);
    label(ctx, M.fmt(st.years, 1) + ' years', x0 + w - 8, y0 + 13, small, { align: 'right', weight: 700 });
    label(ctx, 'road', rx - 4, y0 + h - 14, small, { align: 'right' });
    windArrow(ctx, x0 + 10, y0 + h - (small ? 14 : 18), small ? 50 : 80, small);
    // ---- side view of the 6 m dune, following it ----
    var sx0 = sideBox[0], sy0 = sideBox[1], sw = sideBox[2], sh = sideBox[3];
    var d6 = st.dunes[1], Hd = d6.H, wl = Hd / Math.tan(12 * Math.PI / 180), sl = Hd / Math.tan(33 * Math.PI / 180);
    var view = Math.max(wl + sl + 14, (wl + sl + 8) * 1.0), ssc = Math.min(sw / view, (sh - 34) / (Hd * 1.6));
    var gy = sy0 + sh - (small ? 18 : 24), crestX = sx0 + sw * 0.62;
    ctx.save(); D.roundRect(ctx, sx0, sy0, sw, sh, 10, null); ctx.clip();
    sky(ctx, sx0, sy0, sw, sh);
    ctx.fillStyle = '#d6a35e'; ctx.fillRect(sx0, gy, sw, sh);
    // ground posts every 10 m, fixed to the ground (the view follows the dune)
    var crestWorld = d6.x;
    for (var pm = Math.floor((crestWorld - (crestX - sx0) / ssc) / 10) * 10; pm < crestWorld + (sx0 + sw - crestX) / ssc + 10; pm += 10) {
      var ppx = crestX + (pm - crestWorld) * ssc;
      D.line(ctx, ppx, gy, ppx, gy - 10, '#475569', 2);
    }
    var toe = crestX - wl * ssc, foot = crestX + sl * ssc, top = gy - Hd * ssc;
    ctx.beginPath(); ctx.moveTo(toe - 6, gy); ctx.quadraticCurveTo(toe + (crestX - toe) * 0.5, gy - Hd * ssc * 0.55, crestX, top); ctx.lineTo(foot, gy); ctx.closePath();
    ctx.fillStyle = '#e2b26d'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(crestX, top); ctx.lineTo(foot, gy); ctx.lineTo(crestX, gy); ctx.closePath(); ctx.fillStyle = 'rgba(146,98,48,0.45)'; ctx.fill();
    // grains: hop up the windward side, avalanche down the slip face
    if (windF(st.u) > 0) {
      var r2 = M.rng(4), nG = 18, sp = 0.35 + 0.05 * st.u;
      for (var g = 0; g < nG; g++) {
        var ph = (st.anim * sp + r2()) % 1;
        var P0x = toe - 6, P1x = toe + (crestX - toe) * 0.5, P1y = gy - Hd * ssc * 0.55, it = 1 - ph;
        var gxp = it * it * P0x + 2 * it * ph * P1x + ph * ph * crestX, yy = it * it * gy + 2 * it * ph * P1y + ph * ph * top;
        yy -= 1 + Math.abs(Math.sin(ph * 40 + g)) * 5;
        D.circle(ctx, gxp, yy, 1.8, '#92400e');
      }
      for (var a2 = 0; a2 < 5; a2++) {
        var q2 = (st.anim * 0.6 + a2 / 5) % 1;
        D.circle(ctx, crestX + (foot - crestX) * q2, top + (gy - top) * q2 - 2, 2, '#b45309');
      }
    }
    ctx.restore();
    D.roundRect(ctx, sx0 + 0.5, sy0 + 0.5, sw - 1, sh - 1, 10, null, D.alpha(c.ink, 0.25), 1);
    label(ctx, 'side view: 6 m dune (true scale)', sx0 + 8, sy0 + 13, small);
    label(ctx, 'gentle side ≈ 12°: sand blown up', toe + 4, gy + (small ? 8 : 11), small, { bg: 'rgba(15,23,42,0.55)' });
    label(ctx, 'slip face ≈ 33°', foot - 2, top + 4, small, { align: 'left', bg: 'rgba(15,23,42,0.55)', fit: sx0 + sw });
  }
  function barchan(ctx, cx, cy, wd) {
    function curve(depth, pow) {
      var p = [];
      for (var i = 0; i <= 24; i++) { var t = -1 + i / 12; p.push({ x: cx + 0.35 * wd - depth * wd * Math.pow(1 - t * t, pow), y: cy + t * wd / 2 }); }
      return p;
    }
    var outer = curve(0.8, 0.55), crest = curve(0.42, 0.7), inner = curve(0.24, 0.9);
    ctx.beginPath(); outer.forEach(function (q, i) { ctx[i ? 'lineTo' : 'moveTo'](q.x, q.y); }); for (var i = inner.length - 1; i >= 0; i--) ctx.lineTo(inner[i].x, inner[i].y);
    ctx.closePath(); ctx.fillStyle = '#f2cf8f'; ctx.fill(); ctx.strokeStyle = 'rgba(146,98,48,0.6)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); crest.forEach(function (q, i) { ctx[i ? 'lineTo' : 'moveTo'](q.x, q.y); }); for (var j = inner.length - 1; j >= 0; j--) ctx.lineTo(inner[j].x, inner[j].y);
    ctx.closePath(); ctx.fillStyle = 'rgba(146,98,48,0.55)'; ctx.fill();
  }

  /* ---------- scene 3: loess ---------- */
  function loessStep(dtS) {
    var u = st.u, Hl = liftH(u), r = st.r;
    st.lacc += dtS;
    for (; st.lacc >= LDT; st.lacc -= LDT) {
      st.hours += LDT / 3600;
      if (Hl > 0 && st.hours <= 6) {
        // a steady stream of dust from the desert (0–80 km)
        if (r() < 0.9) st.parts.push({ k: 'silt', x: r() * 80e3, z: r() * Hl }), st.emitted.silt++;
        if (r() < 0.5) st.parts.push({ k: 'clay', x: r() * 80e3, z: r() * Hl }), st.emitted.clay++;
      }
      var sd = Math.sqrt(2 * 50 * LDT);
      for (var j = st.parts.length - 1; j >= 0; j--) {
        var q = st.parts[j];
        q.x += u * LDT;
        q.z += -KINDS[q.k].w * LDT + sd * randn(r);
        if (q.z > Hl) q.z = 2 * Hl - q.z;
        if (q.z <= 0 && r() > KINDS[q.k].w / (KINDS[q.k].w + 0.01)) q.z = -q.z;   // most clay bounces back up on the eddies
        if (q.z <= 0) {
          st.parts.splice(j, 1);
          if (q.x < X_MAX) { st.dep[Math.floor(q.x / X_MAX * BINS)] += q.k === 'silt' ? 1 : 0.3; }
          if (q.k === 'silt') { st.siltSum += q.x; st.siltN++; }
        } else if (q.x >= X_MAX) { st.parts.splice(j, 1); if (q.k === 'clay') st.outClay++; }
      }
    }
  }
  function drawLoess(ctx, c, W, H) {
    var small = W < 560 || H < 420;
    var left = small ? 8 : 14, right = W - (small ? 8 : 14), groundY = H - (small ? 46 : 62), topY = small ? 30 : 40;
    var sx = (right - left) / X_MAX, sz = (groundY - topY) / Z_MAX;
    sky(ctx, 0, 0, W, groundY);
    // desert, then plains
    ctx.fillStyle = '#8fb36a'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#e2b26d'; ctx.fillRect(0, groundY, left + 80e3 * sx, H - groundY);
    for (var dk = 0; dk < 4; dk++) { var dx = left + (10 + dk * 18) * 1e3 * sx; ctx.beginPath(); ctx.moveTo(dx - 9, groundY); ctx.quadraticCurveTo(dx, groundY - 9, dx + 6, groundY); ctx.fillStyle = '#d19a55'; ctx.fill(); }
    // height lines
    for (var km = 1; km <= 4; km++) {
      var yy = groundY - km * 1000 * sz;
      D.line(ctx, left, yy, right, yy, 'rgba(255,255,255,0.25)', 1, [3, 5]);
      D.text(ctx, km + ' km', left + 2, yy - 6, { color: '#1e293b', size: small ? 9 : 10, weight: 600 });
    }
    // distance ticks
    for (var dd = 0; dd <= 1000; dd += small ? 250 : 100) {
      var tx = left + dd * 1e3 * sx;
      D.line(ctx, tx, groundY, tx, groundY + 4, '#1e293b', 1);
      if (dd % 250 === 0 || !small) D.text(ctx, dd + (dd === 1000 ? ' km' : ''), tx, groundY + (small ? 34 : 48), { color: c.ink, bg: D.alpha(c.bg, 0.6), size: small ? 9 : 10, align: dd === 1000 ? 'right' : 'center', pad: 1 });
    }
    // deposits: loess thickness (exaggerated)
    var maxD = Math.max(4, Math.max.apply(null, st.dep)), bw = (right - left) / BINS, room = small ? 22 : 30;
    for (var b = 0; b < BINS; b++) {
      if (!st.dep[b]) continue;
      var hgt = room * st.dep[b] / maxD;
      ctx.fillStyle = '#c9a227'; ctx.fillRect(left + b * bw, groundY, bw + 0.5, hgt);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, groundY + room, W, 1);
    // sand stays in the desert
    label(ctx, small ? 'sand stays: dunes' : 'sand hops near the ground: stays as dunes', left + 2, groundY - (small ? 12 : 16), small, { fit: W });
    // dust particles
    st.parts.forEach(function (q) {
      var k = KINDS[q.k];
      D.circle(ctx, left + q.x * sx, groundY - q.z * sz, small ? k.r * 0.85 : k.r, k.col);
    });
    // storm cloud over the desert while it blows
    if (liftH(st.u) > 0 && st.hours <= 6) {
      ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#b45309';
      ctx.fillRect(left, groundY - liftH(st.u) * sz, 80e3 * sx, liftH(st.u) * sz); ctx.restore();
      label(ctx, 'dust storm', left + 40e3 * sx, groundY - liftH(st.u) * sz - 10, small, { align: 'center', fit: W });
    }
    // key
    var ky = small ? 14 : 18;
    D.circle(ctx, W - (small ? 150 : 210), ky, 3, KINDS.silt.col);
    D.text(ctx, 'silt', W - (small ? 144 : 204), ky, { color: '#0f172a', size: small ? 10 : 12, weight: 700 });
    D.circle(ctx, W - (small ? 112 : 160), ky, 3, KINDS.clay.col);
    D.text(ctx, small ? 'clay' : 'clay (finest)', W - (small ? 106 : 154), ky, { color: '#0f172a', size: small ? 10 : 12, weight: 700 });
    ctx.fillStyle = '#c9a227'; ctx.fillRect(W - (small ? 70 : 76), ky - 4, 10, 8);
    D.text(ctx, 'loess', W - (small ? 56 : 62), ky, { color: '#0f172a', size: small ? 10 : 12, weight: 700 });
    label(ctx, M.fmt(st.hours, 1) + ' h', left + 2, small ? 14 : 18, small, { weight: 700 });
    windArrow(ctx, W * 0.42, small ? 22 : 30, small ? 50 : 80, small);
    label(ctx, small ? 'loess layer (thickness ×1000s)' : 'loess layer (thickness drawn thousands of times thicker)', W / 2, groundY + (small ? 18 : 24), small, { align: 'center', bg: 'rgba(15,23,42,0.55)', fit: W });
  }
})();
