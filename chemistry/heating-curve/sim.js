/* =====================================================================
   Chemistry · Heating Curve of Water (matter in our surroundings)
   ---------------------------------------------------------------------
   Ice at −20 °C in a beaker on a heater of power P (all of its heat goes
   into the water, which is kept stirred). Heat supplied Q = P·t.
     ice warms:      Q = m·c_ice·ΔT      c_ice = 2100 J/(kg·K)
     ice melts:      Q = m·Lf            Lf = 334 kJ/kg   (stays at 0 °C)
     water warms:    Q = m·c_w·ΔT        c_w = 4186 J/(kg·K)
     water boils:    Q = m·Lv            Lv = 2260 kJ/kg  (stays at Tb)
   Tb depends on air pressure: 100 °C at sea level, about 93 °C at
   2200 m (Shimla) and 88 °C at 3500 m (Leh). Lv is kept at its 100 °C
   value for all three.
   The zoom window shows particles: fixed in a pattern (ice), sliding
   (water) and flying free (steam). Their speed follows the temperature,
   so it does NOT change while ice melts or water boils: the heat then
   goes into pulling particles apart (latent heat).
   Time runs faster than real time so a whole run takes about 50 s;
   the readouts show real heating time.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var CI = 2100, CW = 4186, LF = 334000, LV = 2260000, T0 = -20, N = 30, RUN = 50;
  var PLACES = { sea: { tb: 100, name: 'Mumbai (sea level)' }, shimla: { tb: 93, name: 'Shimla (2200 m)' }, leh: { tb: 88, name: 'Leh (3500 m)' } };
  var BW = 8, BH = 8; // zoom box size in particle diameters
  var tMaxGraph = 10;

  function gauss(r) { var u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function steps(p) {
    var m = p.mass / 1000, tb = PLACES[p.place].tb;
    var q1 = m * CI * (0 - T0), q2 = q1 + m * LF, q3 = q2 + m * CW * tb, q4 = q3 + m * LV;
    return { m: m, tb: tb, q1: q1, q2: q2, q3: q3, q4: q4 };
  }
  // temperature, melted fraction and boiled fraction for heat Q
  function stateAt(p, Q) {
    var s = steps(p);
    if (Q < s.q1) return { T: T0 + Q / (s.m * CI), fm: 0, fb: 0, stage: 0 };
    if (Q < s.q2) return { T: 0, fm: (Q - s.q1) / (s.q2 - s.q1), fb: 0, stage: 1 };
    if (Q < s.q3) return { T: (Q - s.q2) / (s.m * CW), fm: 1, fb: 0, stage: 2 };
    if (Q < s.q4) return { T: s.tb, fm: 1, fb: (Q - s.q3) / (s.q4 - s.q3), stage: 3 };
    return { T: s.tb, fm: 1, fb: 1, stage: 4 };
  }
  var STAGE = ['Ice warming', 'Ice melting', 'Water warming', 'Water boiling', 'All boiled away'];
  var USE = ['raising the temperature of the ice', 'melting the ice (temperature stays at 0 °C)', 'raising the temperature of the water',
    'turning water into steam (temperature stays the same)', '—'];
  function mmss(t) { var mn = Math.floor(t / 60), s = Math.floor(t % 60); return mn + ' min ' + (s < 10 ? '0' : '') + s + ' s'; }

  function sites() {
    var a = [];
    for (var row = 0; row < 5; row++) for (var c = 0; c < 6; c++) a.push({ x: BW / 2 + (c - 2.5) + (row % 2 ? 0.25 : -0.25), y: 0.5 + row * 0.866 });
    return a.reverse(); // top rows first: they melt first
  }

  SimLab.createSim({
    ariaLabel: 'A beaker of ice on a heater with a thermometer, and a zoom window of its particles. As heat is added the ice warms, melts at 0 °C, the water warms and then boils, and a graph plots temperature against time',
    mobileAspect: '1 / 1',
    playLabel: 'Heat',
    params: [
      { id: 'power', label: 'Heater power', min: 100, max: 1000, step: 50, value: 500, unit: 'W' },
      { id: 'mass', label: 'Mass of ice', min: 50, max: 200, step: 10, value: 100, unit: 'g' },
      { id: 'place', label: 'Where are you?', type: 'select', value: 'sea', options: [
        { value: 'sea', label: 'Mumbai, sea level (boils at 100 °C)' }, { value: 'shimla', label: 'Shimla, 2200 m (about 93 °C)' }, { value: 'leh', label: 'Leh, 3500 m (about 88 °C)' }] }
    ],
    readouts: [
      { id: 'T', label: 'Temperature', unit: '°C', digits: 1, key: true, short: 'Temp' },
      { id: 'st', label: 'What is happening', key: true, short: 'Now' },
      { id: 'q', label: 'Heat supplied', unit: 'kJ', digits: 1, key: true, short: 'Heat' },
      { id: 'use', label: 'The heat is being used for' },
      { id: 't', label: 'Heating time (real)' }
    ],
    graph: { title: 'Heating curve: temperature vs time', yLabel: '°C', xLabel: 'time (min)', yMin: -25, yMax: 110, series: [{ label: 'temperature' }], xMax: function () { return tMaxGraph; } },
    reset: function (sim) {
      var S = steps(sim.p), r = M.rng(9);
      tMaxGraph = Math.ceil(S.q4 / sim.p.power / 60 * 1.02);
      var st = sites();
      sim.state = { Q: 0, t: 0, ts: S.q4 / sim.p.power / RUN, rand: r, bub: [], gacc: 0,
        ps: st.map(function (s, i) { return { sx: s.x, sy: s.y, x: s.x, y: s.y, vx: 0, vy: 0, ph: 'solid', p1: r() * 6.3, p2: r() * 6.3, f1: 8 + r() * 4, f2: 8 + r() * 4, rad: 0.45 + r() * 0.08 }; }) };
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [T0]); }
    },
    update: function (sim, dt) {
      var s = sim.state, h = dt * s.ts, r = s.rand;
      s.t += h; s.Q = Math.min(s.t * sim.p.power, steps(sim.p).q4 + 1);
      var x = stateAt(sim.p, s.Q), TK = x.T + 273.15, ps = s.ps;
      // which particles are solid / liquid / gas
      var nS = Math.round(N * (1 - x.fm)), nG = Math.round(N * x.fb);
      ps.forEach(function (p, i) {
        var want = i < N - nS ? 'liquid' : 'solid';
        if (p.ph === 'solid' && want === 'liquid') { p.ph = 'liquid'; p.vx = gauss(r); p.vy = 0; }
      });
      var liq = ps.filter(function (p) { return p.ph === 'liquid'; }), gas = ps.filter(function (p) { return p.ph === 'gas'; });
      while (gas.length < nG && liq.length) { // the highest liquid particle escapes
        var top = liq.reduce(function (a, b) { return b.y > a.y ? b : a; });
        top.ph = 'gas'; top.vy = 6 * Math.sqrt(TK / 273); top.vx = gauss(r) * 2;
        liq.splice(liq.indexOf(top), 1); gas.push(top);
      }
      // solids vibrate about their places
      var A = 0.08 * Math.sqrt(TK / 273);
      ps.forEach(function (p) { if (p.ph === 'solid') { p.x = p.sx + A * Math.sin(p.f1 * s.t / s.ts + p.p1); p.y = p.sy + A * Math.sin(p.f2 * s.t / s.ts + p.p2); } });
      // liquid: soft disks, gravity, thermal kicks
      var Tl = 2.2 * TK / 273, gam = 3, sig = Math.sqrt(2 * gam * Tl * dt), K = 3000, g = 25;
      liq.forEach(function (p, i) { p.ax = 0; p.ay = -g; p.li = i; });
      for (var i = 0; i < liq.length; i++) {
        var a = liq[i];
        for (var j = 0; j < ps.length; j++) {
          var b = ps[j]; if (b === a || b.ph === 'gas' || (b.ph === 'liquid' && b.li < i)) continue;
          var dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy), rr = a.rad + b.rad;
          if (dd < rr && dd > 1e-6) {
            var f = K * (rr - dd) / dd; a.ax -= f * dx; a.ay -= f * dy;
            if (b.ph === 'liquid') { b.ax += f * dx; b.ay += f * dy; }
          }
        }
      }
      liq.forEach(function (p) {
        if (p.x < p.rad) p.ax += K * (p.rad - p.x);
        if (p.x > BW - p.rad) p.ax -= K * (p.x - BW + p.rad);
        if (p.y < p.rad) p.ay += K * (p.rad - p.y);
        if (p.y > BH - p.rad) p.ay -= K * (p.y - BH + p.rad);
        p.vx += (p.ax - gam * p.vx) * dt + sig * gauss(r); p.vy += (p.ay - gam * p.vy) * dt + sig * gauss(r);
        p.x += p.vx * dt; p.y += p.vy * dt;
      });
      // gas: fast free flight, bouncing off walls and off the liquid
      var vg = 6 * Math.sqrt(TK / 273);
      gas.forEach(function (p) {
        var sp = Math.hypot(p.vx, p.vy) || 1; p.vx *= vg / sp; p.vy *= vg / sp;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0.5) { p.x = 0.5; p.vx = Math.abs(p.vx); } if (p.x > BW - 0.5) { p.x = BW - 0.5; p.vx = -Math.abs(p.vx); }
        if (p.y < 0.5) { p.y = 0.5; p.vy = Math.abs(p.vy); } if (p.y > BH - 0.5) { p.y = BH - 0.5; p.vy = -Math.abs(p.vy); }
        ps.forEach(function (q) {
          if (q.ph === 'gas') return;
          var ex = p.x - q.x, ey = p.y - q.y, e = Math.hypot(ex, ey);
          if (e < 0.95 && e > 1e-6) { ex /= e; ey /= e; var vn = p.vx * ex + p.vy * ey; if (vn < 0) { p.vx -= 2 * vn * ex; p.vy -= 2 * vn * ey; } p.x = q.x + ex * 0.95; p.y = q.y + ey * 0.95; }
        });
      });
      // bubbles in the beaker while boiling
      if (x.stage === 3 && r() < dt * 30) s.bub.push({ u: r(), y: 0, v: 0.25 + r() * 0.3 });
      for (i = s.bub.length - 1; i >= 0; i--) { s.bub[i].y += s.bub[i].v * dt; if (s.bub[i].y > 1) s.bub.splice(i, 1); }
      s.gacc += dt;
      if (s.gacc >= 1 / 20) { s.gacc = 0; if (sim.graph) sim.graph.push(s.t / 60, [x.T]); }
    },
    finished: function (sim) { return sim.state.Q >= steps(sim.p).q4; },
    readout: function (sim) {
      var s = sim.state, x = stateAt(sim.p, s.Q), st = STAGE[x.stage];
      if (x.stage === 1) st = 'Melting · ' + Math.round(x.fm * 100) + '%';
      if (x.stage === 3) st = 'Boiling · ' + Math.round(x.fb * 100) + '% gone';
      return { T: x.T, st: st, q: s.Q / 1000, use: USE[x.stage], t: mmss(s.t) };
    },
    status: function (sim) {
      var x = stateAt(sim.p, sim.state.Q);
      if (x.stage === 4) return 'All the water has boiled away after ' + mmss(sim.state.t) + ' of heating';
      return (sim.running ? 'Heating' : 'Paused') + ' · ' + STAGE[x.stage];
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, p = sim.p, s = sim.state, W = sim.width, H = sim.height, small = W < 560, fs = small ? 10 : 12;
      var x = stateAt(p, s.Q), S = steps(p);
      D.clear(ctx, W, H, col.bg);
      // ---- beaker on a heater (left) ----
      var lw = W * (small ? 0.5 : 0.52), bw = Math.min(lw * 0.62, 190), bh = Math.min(H * 0.5, 230);
      var bx = lw * 0.5 - bw / 2 + (small ? 4 : 10), heaterY = H - (small ? 34 : 46), by = heaterY - bh - 4;
      // heater and glow
      D.roundRect(ctx, bx - 10, heaterY, bw + 20, small ? 14 : 18, 4, col.light ? '#475569' : '#334155');
      var on = s.Q < S.q4 && sim.running, glow = on ? 0.35 + 0.5 * p.power / 1000 : 0.12;
      D.roundRect(ctx, bx, heaterY - 3, bw, 4, 2, D.alpha('#f97316', glow + 0.2));
      D.text(ctx, p.power + ' W heater', bx + bw / 2, heaterY + (small ? 7 : 9), { color: '#fde68a', size: small ? 9 : 11, weight: 700, align: 'center' });
      // contents: water level, ice cubes, bubbles
      var wl = (bh - 12) * 0.7 * (p.mass / 200) * x.fm * (1 - x.fb);
      var wTop = by + bh - wl;
      if (wl > 0.5) D.roundRect(ctx, bx + 3, wTop, bw - 6, wl - 3, 3, D.alpha('#38bdf8', 0.75));
      var cubes = Math.ceil((1 - x.fm) * Math.max(3, Math.round(p.mass / 20))), cs = Math.min(bw / 5.2, 30) * (0.45 + 0.55 * Math.sqrt(1 - x.fm));
      var rr = M.rng(4);
      for (var k = 0; k < cubes; k++) {
        var cxp = bx + 8 + (k % 4) * (bw - 16 - cs) / 3 + rr() * 4, row = Math.floor(k / 4);
        var cyp = (wl > cs ? wTop - cs * 0.35 : by + bh - 4 - cs) - row * cs * 0.85;
        D.roundRect(ctx, cxp, cyp, cs, cs, 4, D.alpha(col.light ? '#e0f2fe' : '#e0f2fe', 0.9), '#7dd3fc', 1.2);
      }
      s.bub.forEach(function (b) { var yy = by + bh - 5 - b.y * Math.max(0, wl - 8); if (yy > wTop + 3) D.circle(ctx, bx + 8 + b.u * (bw - 16), yy, small ? 2.5 : 3.5, null, '#e0f2fe', 1.4); });
      if (x.stage === 3 || (x.stage === 2 && x.T > 70)) {
        var tt = (now || 0) / 1000, n = x.stage === 3 ? 6 : 2;
        for (k = 0; k < n; k++) { var ph = (tt * 0.6 + k / n) % 1; D.circle(ctx, bx + bw * (0.2 + 0.6 * ((k * 0.37) % 1)) + Math.sin(tt * 2 + k) * 5, by - ph * bh * 0.45, (small ? 5 : 8) * (0.6 + ph), D.alpha(col.light ? '#94a3b8' : '#e2e8f0', 0.35 * (1 - ph))); }
      }
      // glass
      ctx.save(); ctx.strokeStyle = col.light ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by); ctx.stroke(); ctx.restore();
      // thermometer
      var tx = bx + bw - (small ? 14 : 20), ty0 = by - (small ? 34 : 50), ty1 = by + bh - 10, tw = small ? 7 : 9;
      var frac = M.clamp((x.T + 25) / 135, 0, 1);
      D.roundRect(ctx, tx - tw / 2, ty0, tw, ty1 - ty0, tw / 2, col.light ? '#f8fafc' : '#1e293b', col.muted, 1);
      D.circle(ctx, tx, ty1, tw * 0.9, '#ef4444');
      D.roundRect(ctx, tx - tw / 4, ty1 - (ty1 - ty0 - 4) * frac, tw / 2, (ty1 - ty0 - 4) * frac, 2, '#ef4444');
      D.text(ctx, M.fmt(x.T, 1) + ' °C', tx - tw, ty0 + 4, { color: col.text, size: small ? 12 : 15, weight: 800, align: 'right', bg: D.alpha(col.bg, 0.85), pad: 3 });
      D.text(ctx, STAGE[x.stage], lw / 2, small ? 12 : 16, { color: x.stage === 1 || x.stage === 3 ? col.warning : col.text, size: small ? 11 : 14, weight: 800, align: 'center', fit: lw });
      D.text(ctx, PLACES[p.place].name, bx + bw / 2, H - (small ? 8 : 12), { color: col.muted, size: fs, align: 'center', fit: lw * 1.05 });

      // ---- zoom window of particles (right) ----
      var zx0 = lw + (small ? 4 : 10), zw = W - zx0 - (small ? 6 : 16), zs = Math.min(zw / BW, (H - (small ? 64 : 84)) / BH), zsz = zs * BW;
      var zx = zx0 + (zw - zsz) / 2, zy = (small ? 30 : 40);
      D.text(ctx, '🔍 Zoom: water particles', zx + zsz / 2, zy - (small ? 14 : 18), { color: col.text, size: fs, weight: 700, align: 'center', fit: W });
      D.roundRect(ctx, zx, zy, zsz, zsz, 10, col.light ? '#f1f5f9' : '#0b1222', col.border, 1.5);
      ctx.save(); D.roundRect(ctx, zx, zy, zsz, zsz, 10); ctx.clip();
      var COL = { solid: '#7dd3fc', liquid: '#3b82f6', gas: '#f472b6' };
      if (s.ps.some(function (q) { return q.ph === 'solid'; })) {
        ctx.strokeStyle = D.alpha('#7dd3fc', 0.45); ctx.lineWidth = 1; ctx.beginPath();
        s.ps.forEach(function (a, i) { if (a.ph !== 'solid') return; s.ps.forEach(function (b, j) { if (j > i && b.ph === 'solid' && Math.hypot(a.sx - b.sx, a.sy - b.sy) < 1.1) { ctx.moveTo(zx + a.x * zs, zy + zsz - a.y * zs); ctx.lineTo(zx + b.x * zs, zy + zsz - b.y * zs); } }); });
        ctx.stroke();
      }
      s.ps.forEach(function (q) { D.circle(ctx, zx + q.x * zs, zy + zsz - q.y * zs, q.rad * zs * 0.92, COL[q.ph], D.alpha(col.light ? '#0f172a' : '#ffffff', 0.3), 1); });
      ctx.restore();
      var ly = zy + zsz + (small ? 12 : 16), lx = zx + zsz / 2;
      [['solid', 'ice'], ['liquid', 'water'], ['gas', 'steam']].forEach(function (e, i) {
        var xx = lx + (i - 1) * zsz / 3;
        D.circle(ctx, xx - (small ? 16 : 22), ly, small ? 4 : 5, COL[e[0]]);
        D.text(ctx, e[1], xx - (small ? 9 : 13), ly, { color: col.muted, size: fs });
      });
      var spd = Math.sqrt((x.T + 273.15) / 273.15);
      D.text(ctx, 'particle speed ×' + M.fmt(spd, 2) + ' (vs 0 °C)', lx, ly + (small ? 15 : 20), { color: col.muted, size: fs, align: 'center', fit: W });
    }
  });
})();
