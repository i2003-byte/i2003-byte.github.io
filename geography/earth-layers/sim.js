/* =====================================================================
   Landforms · Inside the Earth: Layers and Earthquake Waves — sim.js
   ---------------------------------------------------------------------
   A slice through the Earth (radius 6,371 km) with its layers:
     crust 0–35 km · upper mantle to 660 km · lower mantle to 2,891 km
     · liquid outer core to 5,150 km · solid inner core to the centre
   An earthquake at the top sends P waves (push–pull, through solids
   and liquids) and S waves (side-to-side, through solids only).
   Wave speeds (km/s) are a simple version of the real Earth's
   (PREM), interpolated by depth; S speed is 0 in the liquid core.
   Rays are traced with Snell's law for a layered sphere: along a ray
       r × sin(i) / v(r) = constant
   (i = angle from the vertical). A ray bends back up where
   sin(i) would pass 1, and bends sharply where the speed jumps.
   S rays that reach the liquid outer core stop there. P rays slow
   from 13.7 to 8 km/s entering the core and bend inwards, which
   leaves a P shadow zone at the surface (about 97°–144° here,
   about 103°–142° in the real Earth). Times add up ds / v.
   1 s of real time is 1 minute after the quake.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var R = 6371, RCMB = 6371 - 2891, RICB = 1221, MIN_PER_S = 1, END = 26;
  var TP = [[0, 6.0], [35, 6.6], [35.01, 8.0], [410, 9.0], [410.01, 9.4], [660, 10.2], [660.01, 10.8], [1500, 12.4], [2700, 13.6], [2891, 13.7], [2891.01, 8.0], [5150, 10.3], [5150.01, 11.0], [6371, 11.3]];
  var TS = [[0, 3.5], [35, 3.8], [35.01, 4.5], [410, 4.9], [410.01, 5.1], [660, 5.6], [660.01, 6.0], [1500, 6.7], [2700, 7.25], [2891, 7.3], [2891.01, 0], [6371, 0]];
  var TT = [[0, 15], [35, 500], [100, 1300], [660, 1900], [2700, 2700], [2891, 3500], [2891.01, 4000], [5150, 5300], [6371, 5500]];
  var RHO = [[0, 2.7], [35, 2.9], [35.01, 3.4], [410, 3.5], [410.01, 3.7], [660, 4.0], [660.01, 4.4], [2891, 5.6], [2891.01, 9.9], [5150, 12.2], [5150.01, 12.8], [6371, 13.1]];
  var LAYERS = [
    { top: 0, bot: 35, name: 'Crust', state: 'solid rock', note: 'Thin and rocky: 5–10 km under oceans, 30–70 km under continents, up to about 70 km under the Himalayas. We live on it.' },
    { top: 35, bot: 660, name: 'Upper mantle', state: 'solid, but soft in parts', note: 'Hot solid rock. From about 100 to 400 km deep it is soft and creeps slowly (the asthenosphere); the plates ride on it. Magma for volcanoes forms here.' },
    { top: 660, bot: 2891, name: 'Lower mantle', state: 'solid rock', note: 'The thickest layer, about 84 % of the Earth by volume. Very hot, but the huge pressure keeps it solid.' },
    { top: 2891, bot: 5150, name: 'Outer core', state: 'liquid metal', note: 'Molten iron and nickel. S waves cannot cross it, which is how we know it is liquid. Its flow makes the Earth’s magnetic field.' },
    { top: 5150, bot: 6371, name: 'Inner core', state: 'solid metal', note: 'Iron and nickel about as hot as the Sun’s surface, but squeezed solid by the pressure.' }
  ];
  var ANG = [0.5, 1, 2, 3, 4, 5, 5.5, 6, 7, 8, 9, 10, 11, 12, 13, 13.5, 13.9, 14.3, 15, 16, 17.5, 19, 21, 23, 25, 28, 31, 35, 40, 46];

  function tab(T, d) { for (var i = 1; i < T.length; i++) if (d <= T[i][0]) { var a = T[i - 1], b = T[i]; return a[1] + (b[1] - a[1]) * (d - a[0]) / (b[0] - a[0]); } return T[T.length - 1][1]; }
  function layerAt(d) { for (var i = 0; i < LAYERS.length; i++) if (d <= LAYERS[i].bot) return LAYERS[i]; return LAYERS[4]; }
  function fmtKm(x) { return Math.round(x).toLocaleString('en-IN'); }

  // Trace one ray from the surface; i0 = take-off angle from straight down (degrees)
  function trace(T, i0) {
    var r = R - 1, th = 0, v = tab(T, R - r), p = r * Math.sin(i0 * Math.PI / 180) / v, down = true, t = 0, ds = 8, pts = [{ th: 0, r: r, t: 0 }], inner = false;
    for (var n = 0; n < 6000; n++) {
      var vv = tab(T, R - r);
      if (vv <= 0) return { end: 'core', pts: pts, inner: inner };
      var s = p * vv / r; if (s >= 1) { down = false; s = 0.99999; }
      var dr = (down ? -1 : 1) * Math.sqrt(1 - s * s) * ds, r2 = r + dr, v2 = tab(T, R - r2);
      if (down && v2 > 0 && p * v2 / r2 >= 1) { down = false; continue; }
      th += s * ds / r; r = r2; t += ds / vv / 60;
      if (r < RICB + 60) inner = true; // through, or bent back by, the inner core
      pts.push({ th: th, r: r, t: t });
      if (r >= R) return { end: 'surf', pts: pts, th: th * 180 / Math.PI, t: t, inner: inner };
    }
    return { end: 'lost', pts: pts, inner: inner };
  }
  var RAYS = null, ZONES = null;
  function build() {
    if (RAYS) return;
    RAYS = { P: ANG.map(function (a) { return trace(TP, a); }), S: ANG.map(function (a) { return trace(TS, a); }) };
    // shadow zones from a fine fan of rays
    var mantleP = 0, coreP = 180, maxS = 0;
    for (var a = 0.2; a < 46; a += 0.1) {
      var q = trace(TP, a), s = trace(TS, a);
      if (q.end === 'surf') { if (q.pts.some(function (x) { return x.r < RCMB; })) { if (!q.inner) coreP = Math.min(coreP, q.th); } else mantleP = Math.max(mantleP, q.th); }
      if (s.end === 'surf') maxS = Math.max(maxS, s.th);
    }
    ZONES = { p0: mantleP, p1: coreP, s0: maxS };
  }
  function at(ray, t) {
    var P = ray.pts, last = P[P.length - 1];
    if (t >= last.t) return null;
    var lo = 0, hi = P.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (P[m].t < t) lo = m; else hi = m; }
    return { i: lo, th: P[lo].th, r: P[lo].r };
  }

  SimLab.createSim({
    ariaLabel: 'A cross-section of the Earth showing crust, mantle, liquid outer core and solid inner core, with P and S waves spreading from an earthquake; S waves stop at the liquid core and shadow zones appear on the far side',
    playLabel: 'Start the earthquake',
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'waves', label: 'Waves shown', type: 'select', value: 'both', options: [
        { value: 'both', label: 'P waves (right) and S waves (left)' },
        { value: 'P', label: 'P waves only, both sides' },
        { value: 'S', label: 'S waves only, both sides' }] }
    ],
    readouts: [
      { id: 'time', label: 'Time after the quake', short: 'Time', unit: 'min', digits: 1, key: true },
      { id: 'layer', label: 'Tapped layer', short: 'Layer', key: true },
      { id: 'temp', label: 'Temperature there', short: 'Temp.', unit: '°C', digits: 0, key: true },
      { id: 'depth', label: 'Depth tapped', unit: 'km', digits: 0 },
      { id: 'rho', label: 'Density there', unit: 'g/cm³', digits: 1 },
      { id: 'pshadow', label: 'P shadow zone (model)' },
      { id: 'sshadow', label: 'S waves reach up to (model)' }
    ],
    pointer: {
      down: function (sim, x, y) { return setProbe(sim, x, y); },
      move: function (sim, x, y) { if (sim.state.drag) setProbe(sim, x, y); },
      up: function (sim) { sim.state.drag = false; },
      hover: function (sim, x, y) { var g = sim.state.geo; return g && Math.hypot(x - g.cx, y - g.cy) < g.er; }
    },

    reset: function (sim) {
      build();
      var keep = sim.state && sim.state.probe;
      sim.state = { min: 0, probe: keep || { a: 2.35, d: 4000 }, drag: false, geo: null };
    },
    update: function (sim, dt) { var st = sim.state; if (st.min < END) st.min += dt * MIN_PER_S; },
    finished: function (sim) { return sim.state.min >= END; },
    readout: function (sim) {
      var pr = sim.state.probe, L = layerAt(pr.d);
      return { time: sim.state.min, layer: L.name, temp: tab(TT, pr.d), depth: pr.d, rho: tab(RHO, pr.d),
        pshadow: Math.round(ZONES.p0) + '° to ' + Math.round(ZONES.p1) + '°', sshadow: '≈ ' + Math.round(ZONES.s0) + '°' };
    },
    status: function (sim) {
      var m = sim.state.min;
      if (m <= 0) return 'Tap any layer to look inside. Press Start the earthquake';
      if (m >= END) return 'S waves never cross the liquid core; P waves leave a shadow zone';
      if (m < 6) return 'Waves spread down from the quake';
      if (m < 13) return 'S waves reach the outer core and stop: it is liquid';
      return 'P waves bend through the core and reach the far side';
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, c = sim.colors, st = sim.state, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 10.5 : 12.5;
      D.clear(ctx, W, H, c.bg);
      var wide = W > H * 1.2, top = narrow ? 30 : 38, er, cx, cy, panel;
      if (wide) { er = Math.min((H - top - 40) / 2, W * 0.3); cx = 14 + er + 10; cy = top + 28 + er; panel = { x: cx + er + 24, y: top + 14, w: W - (cx + er + 24) - 12 }; }
      else { var ph0 = narrow ? 96 : 110; er = Math.min((W - 30) / 2, (H - top - ph0 - 40) / 2); cx = W / 2; cy = top + 28 + er; panel = { x: 10, y: cy + er + 14, w: W - 20 }; }
      st.geo = { cx: cx, cy: cy, er: er };
      var k = er / R;
      function XY(th, r, side) { return [cx + side * Math.sin(th) * r * k, cy - Math.cos(th) * r * k]; }
      // layers
      var crustPx = Math.max(3, 35 * k);
      D.circle(ctx, cx, cy, er, '#8b5a2b');
      var g1 = ctx.createRadialGradient(cx, cy, RCMB * k, cx, cy, er - crustPx);
      g1.addColorStop(0, '#b4401f'); g1.addColorStop(1, '#d9772f');
      D.circle(ctx, cx, cy, er - crustPx, g1);
      D.circle(ctx, cx, cy, (R - 660) * k, null, D.alpha('#ffffff', 0.18), 1);
      var g2 = ctx.createRadialGradient(cx, cy, RICB * k, cx, cy, RCMB * k);
      g2.addColorStop(0, '#fbbf24'); g2.addColorStop(1, '#f59e0b');
      D.circle(ctx, cx, cy, RCMB * k, g2);
      var g3 = ctx.createRadialGradient(cx - RICB * k * 0.3, cy - RICB * k * 0.3, 1, cx, cy, RICB * k);
      g3.addColorStop(0, '#fffbeb'); g3.addColorStop(1, '#fde68a');
      D.circle(ctx, cx, cy, RICB * k, g3, D.alpha('#92400e', 0.4), 1);

      // shadow zones on the surface (model values)
      function arc(a0, a1, side, col, rr) {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath();
        for (var a = a0; a <= a1 + 0.01; a += 1) { var q = XY(a * Math.PI / 180, rr, side); if (a === a0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); }
        ctx.stroke(); ctx.restore();
      }
      var showP = p.waves !== 'S', showS = p.waves !== 'P', sideP = p.waves === 'both' ? [1] : [1, -1], sideS = p.waves === 'both' ? [-1] : [1, -1];
      var rr = R * 1.035, done = st.min >= 21;
      if (showP && done) sideP.forEach(function (sd) { arc(ZONES.p0, ZONES.p1, sd, D.alpha(c.ink, 0.55), rr); });
      if (showS && st.min >= 25) sideS.forEach(function (sd) { arc(ZONES.s0, 180, sd, D.alpha('#ef4444', 0.6), rr * 1.03); });

      // rays: paths so far and the wave front dots
      var t = st.min, pulse = 0.5 + 0.5 * Math.sin((now || 0) / 160);
      function drawFam(rays, side, col) {
        rays.forEach(function (ray) {
          var P = ray.pts, n = P.length, j = 0;
          if (t <= 0) return;
          ctx.save(); ctx.strokeStyle = D.alpha(col, ray.inner ? 0.35 : 0.6); ctx.lineWidth = ray.inner ? 1 : 1.4;
          if (ray.inner) ctx.setLineDash([3, 3]);
          ctx.beginPath();
          for (j = 0; j < n && P[j].t <= t; j += 3) { var q = XY(P[j].th, P[j].r, side); if (j === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); }
          var head = at(ray, t);
          if (head) { var hq = XY(head.th, head.r, side); ctx.lineTo(hq[0], hq[1]); }
          ctx.stroke(); ctx.restore();
          if (head) D.circle(ctx, hq[0], hq[1], 2.6 + pulse, col);
          else {
            var e = P[n - 1], eq = XY(e.th, e.r, side);
            if (ray.end === 'core') D.circle(ctx, eq[0], eq[1], 3, null, col, 1.5);
            else if (ray.end === 'surf') { var o = XY(e.th, R * 1.035, side); D.circle(ctx, o[0], o[1], 3.2, col); }
          }
        });
      }
      var colP = c.light ? '#1d4ed8' : '#7dd3fc', colS = c.light ? '#b91c1c' : '#fca5a5';
      if (showP) sideP.forEach(function (sd) { drawFam(RAYS.P, sd, colP); });
      if (showS) sideS.forEach(function (sd) { drawFam(RAYS.S, sd, colS); });

      // epicentre
      var ep = XY(0, R, 1);
      ctx.save(); ctx.translate(ep[0], ep[1] - 2); ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1; ctx.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 4 : 9; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      D.text(ctx, 'Earthquake', ep[0], ep[1] - 17, { color: c.text, size: fs - 0.5, weight: 700, align: 'center' });
      if (p.waves === 'both') {
        D.text(ctx, 'S waves', cx - er * 0.75, cy - er * 0.98, { color: colS, size: fs, weight: 700, align: 'center' });
        D.text(ctx, 'P waves', cx + er * 0.75, cy - er * 0.98, { color: colP, size: fs, weight: 700, align: 'center' });
      }
      if (showP && done) { var lp = XY((ZONES.p0 + ZONES.p1) / 2 * Math.PI / 180, R * 1.1, sideP[0]); D.text(ctx, 'P shadow', lp[0], lp[1], { color: c.text, size: fs - 1, weight: 700, align: sideP[0] > 0 ? 'left' : 'right', bg: D.alpha(c.bg, 0.75), pad: 2, fit: W }); }
      if (showS && st.min >= 25) { var ls = XY(150 * Math.PI / 180, R * 1.12, sideS[0]); D.text(ctx, 'no S waves', ls[0], ls[1], { color: colS, size: fs - 1, weight: 700, align: sideS[0] > 0 ? 'left' : 'right', bg: D.alpha(c.bg, 0.75), pad: 2, fit: W }); }

      // layer names down the middle, below the centre
      if (er > 90) {
        [[RICB * 0.45, 'inner core'], [(RICB + RCMB) / 2, 'outer core'], [(RCMB + R - 660) / 2, 'mantle'], [R - 300, 'crust ↓']].forEach(function (L) {
          D.text(ctx, L[1], cx, cy + L[0] * k, { color: '#1f1308', size: fs - 1.5, weight: 700, align: 'center', bg: D.alpha('#ffffff', 0.55), pad: 2 });
        });
      }
      // probe
      var pr = st.probe, pq = [cx + Math.cos(pr.a) * (R - pr.d) * k, cy + Math.sin(pr.a) * (R - pr.d) * k];
      D.line(ctx, cx, cy, cx + Math.cos(pr.a) * er, cy + Math.sin(pr.a) * er, D.alpha('#ffffff', 0.55), 1, [4, 3]);
      D.circle(ctx, pq[0], pq[1], 7, D.alpha('#ffffff', 0.3), '#111827', 2);
      D.circle(ctx, pq[0], pq[1], 2.5, '#111827');

      // info card
      var L = layerAt(pr.d), lines = [
        [L.name + ' · ' + L.state, c.text, 700],
        [fmtKm(L.top) + '–' + fmtKm(L.bot) + ' km deep · tapped at ' + fmtKm(pr.d) + ' km', c.muted, 500],
        ['about ' + fmtKm(Math.round(tab(TT, pr.d) / 100) * 100) + ' °C · density ' + tab(RHO, pr.d).toFixed(1) + ' g/cm³ · P ' + tab(TP, pr.d).toFixed(1) + ' km/s · S ' + (tab(TS, pr.d) > 0 ? tab(TS, pr.d).toFixed(1) + ' km/s' : 'cannot pass'), c.muted, 500]
      ];
      var y = panel.y, lh = fs + 5;
      lines.forEach(function (ln) { y = wrap(ctx, ln[0], panel.x, y, panel.w, fs, ln[1], ln[2], lh); });
      if (wide || H - y > lh * 2) y = wrap(ctx, L.note, panel.x, y + 4, panel.w, fs - 1, c.muted, 400, lh - 1);
      if (wide && y < H - 100) {
        y += 12;
        y = wrap(ctx, 'P waves: push and pull, like sound. Fast, and pass through solids and liquids.', panel.x, y, panel.w, fs - 1, colP, 600, lh - 1);
        y = wrap(ctx, 'S waves: shake side to side. Slower, and only pass through solids.', panel.x, y + 4, panel.w, fs - 1, colS, 600, lh - 1);
        if (st.min >= 25) wrap(ctx, 'In this model S waves reach about ' + Math.round(ZONES.s0) + '° from the quake and P waves miss ' + Math.round(ZONES.p0) + '°–' + Math.round(ZONES.p1) + '° (real Earth: 103° and 103°–142°).', panel.x, y + 8, panel.w, fs - 1, c.text, 500, lh - 1);
      }
      // headline
      var hl = st.min <= 0 ? 'Tap inside the Earth to explore its layers' : 'Earthquake + ' + st.min.toFixed(1) + ' min';
      D.text(ctx, hl, W / 2, narrow ? 13 : 17, { color: c.bg, bg: c.accent, size: narrow ? 12 : 14, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });

  function setProbe(sim, x, y) {
    var g = sim.state.geo; if (!g) return false;
    var dx = x - g.cx, dy = y - g.cy, d = Math.hypot(dx, dy);
    if (d > g.er * 1.02) return false;
    sim.state.probe = { a: Math.atan2(dy, dx), d: M.clamp(R - d / g.er * R, 1, R) };
    sim.state.drag = true;
    return true;
  }
  function wrap(ctx, text, x, y, w, size, color, weight, lh) {
    ctx.font = weight + ' ' + size + 'px Inter, system-ui, sans-serif';
    var words = text.split(' '), line = '';
    words.forEach(function (wd) {
      var test = line ? line + ' ' + wd : wd;
      if (ctx.measureText(test).width > w && line) { D.text(ctx, line, x, y + size / 2, { color: color, size: size, weight: weight }); y += lh; line = wd; }
      else line = test;
    });
    if (line) { D.text(ctx, line, x, y + size / 2, { color: color, size: size, weight: weight }); y += lh; }
    return y;
  }
})();
