/* =====================================================================
   Gravitation · Escape Velocity Launcher — sim.js
   ---------------------------------------------------------------------
   A probe is fired straight up from the surface of a planet (no air,
   no spin). r = distance from the planet's centre.
     r'' = −GM / r²                      → RK4, small adaptive steps
   Energy per kg:  ½v² − GM/r = constant
     escape speed  v_e = √(2GM/R) = √(2gR)
     if v < v_e:   highest point r_max = GM / (GM/R − ½v²)
                   h_max = r_max − R
     if v ≥ v_e:   it never comes back; far away v → √(v² − v_e²)
   Time to climb from R to r_max on a straight-up (radial) path:
     t = √(r_max³/2GM) · [√(x(1−x)) + arccos √x],  x = R / r_max
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var PL = {
    earth: { name: 'Earth', GM: 3.986e14, R: 6.371e6, col: ['#38bdf8', '#1d4ed8'], land: '#22c55e' },
    moon: { name: 'Moon', GM: 4.905e12, R: 1.7374e6, col: ['#d1d5db', '#6b7280'], land: '#9ca3af' },
    mars: { name: 'Mars', GM: 4.283e13, R: 3.3895e6, col: ['#fb923c', '#9a3412'], land: '#c2410c' },
    jupiter: { name: 'Jupiter', GM: 1.267e17, R: 6.9911e7, col: ['#fde68a', '#b45309'], land: '#d97706' }
  };
  var info = null; // launch prediction, set in reset

  function predict(p) {
    var pl = PL[p.planet], v = p.v * 1000, E = v * v / 2 - pl.GM / pl.R, ve = Math.sqrt(2 * pl.GM / pl.R);
    var o = { pl: pl, v: v, ve: ve, E: E, g: pl.GM / (pl.R * pl.R), bound: E < 0 };
    if (o.bound) {
      o.rmax = -pl.GM / E; o.hmax = o.rmax - pl.R;
      var x = pl.R / o.rmax;
      o.tup = Math.sqrt(o.rmax * o.rmax * o.rmax / (2 * pl.GM)) * (Math.sqrt(x * (1 - x)) + Math.acos(Math.sqrt(x)));
      o.tTotal = 2 * o.tup;
    } else {
      var rEnd = 20 * pl.R, tPar = Math.sqrt(2) / (3 * Math.sqrt(pl.GM)) * (Math.pow(rEnd, 1.5) - Math.pow(pl.R, 1.5));
      var vinf = Math.sqrt(Math.max(0, v * v - ve * ve));
      o.tTotal = vinf > 0 ? Math.min(tPar, 19 * pl.R / vinf) : tPar;
      o.vinf = vinf;
    }
    return o;
  }
  function fmtTime(t) {
    if (t < 120) return M.fmt(t, 0) + ' s';
    if (t < 7200) return M.fmt(t / 60, 1) + ' min';
    if (t < 3 * 86400) return M.fmt(t / 3600, 1) + ' h';
    return M.fmt(t / 86400, 1) + ' days';
  }
  function fmtKm(m) { var km = m / 1000; return km < 100 ? M.fmt(km, 1) : km < 1e5 ? M.fmt(km, 0) : M.fmt(km / 1e6, 2) + ' million'; }

  SimLab.createSim({
    ariaLabel: 'A probe launched straight up from a planet: below the escape speed it rises, stops and falls back; at or above it, it escapes, with energy bars for kinetic, potential and total energy',
    params: [
      { id: 'planet', label: 'Planet', type: 'select', value: 'earth', options: [
        { value: 'earth', label: 'Earth' }, { value: 'moon', label: 'Moon' }, { value: 'mars', label: 'Mars' }, { value: 'jupiter', label: 'Jupiter' }] },
      { id: 'v', label: 'Launch speed (straight up)', min: 0.5, max: 70, step: 0.01, value: 10, unit: 'km/s',
        presets: [{ label: '2.38', value: 2.38 }, { label: '5.03', value: 5.03 }, { label: '11.19', value: 11.19 }, { label: '60.2', value: 60.2 }],
        help: 'Presets: escape speeds of the Moon, Mars, Earth and Jupiter.' }
    ],
    readouts: [
      { id: 've', label: 'Escape speed √(2gR)', unit: 'km/s', digits: 2, key: true },
      { id: 'hm', label: 'Highest point (formula)', unit: 'km', key: true },
      { id: 'h', label: 'Height now', unit: 'km' },
      { id: 'sp', label: 'Speed now', unit: 'km/s', digits: 2 },
      { id: 'E', label: 'Total energy per kg', unit: 'MJ/kg', digits: 2 },
      { id: 't', label: 'Flight time' }
    ],
    graph: { title: 'Speed vs time', yLabel: 'speed (km/s)', series: [{ label: 'speed' }], window: null, xLabel: 'time (min)' },
    buttons: [
      { label: 'Set to escape speed', primary: true, onClick: function (sim) { sim.setParam('v', Math.ceil(predict(sim.p).ve / 10) / 100, true); } },
      { label: '90% of escape speed', onClick: function (sim) { sim.setParam('v', Math.round(predict(sim.p).ve * 0.09) / 100, true); } }
    ],

    reset: function (sim) {
      var o = info = predict(sim.p);
      var unit = o.tTotal < 3 * 3600 ? 60 : 3600;
      sim.state = { r: o.pl.R, v: o.v, t: 0, rate: o.tTotal / 6, done: false, landed: false, top: false, unit: unit, gacc: 0,
        hview: o.bound ? Math.max(o.hmax * 1.25, 0.004 * o.pl.R) : 1.5 * o.pl.R };
      if (sim.graph) {
        sim.graph.opts.xLabel = 'time (' + (unit === 60 ? 'min' : 'hours') + ')';
        sim.graph.opts.xMax = o.tTotal / unit;
        sim.graph.push(0, [o.v / 1000]);
      }
    },
    update: function (sim, dt) {
      var s = sim.state, o = info, GM = o.pl.GM; if (s.done) return;
      var tot = s.rate * dt, done = 0;
      while (done < tot && !s.done) {
        var h = Math.min(tot - done, 0.002 * Math.sqrt(s.r * s.r * s.r / GM)), pv = s.v;
        var y = M.rk4([s.r, s.v], function (u) { return [u[1], -GM / (u[0] * u[0])]; }, h);
        s.r = y[0]; s.v = y[1]; s.t += h; done += h;
        if (pv > 0 && s.v <= 0) s.top = true;
        if (s.r <= o.pl.R && s.v < 0) { s.r = o.pl.R; s.done = s.landed = true; }
        if (!o.bound && s.r > 20 * o.pl.R) s.done = true;
      }
      if (!o.bound) s.hview += (Math.max(1.5 * o.pl.R, (s.r - o.pl.R) * 1.4) - s.hview) * 0.02;
      s.gacc += dt;
      if (sim.graph && (s.gacc >= 1 / 30 || s.done)) { s.gacc = 0; sim.graph.push(s.t / s.unit, [Math.abs(s.v) / 1000]); }
    },
    finished: function (sim) { return sim.state.done; },
    readout: function (sim) {
      var s = sim.state, o = info;
      return {
        ve: o.ve / 1000, hm: o.bound ? fmtKm(o.hmax) : 'escapes', h: fmtKm(s.r - o.pl.R), sp: Math.abs(s.v) / 1000,
        E: (s.v * s.v / 2 - o.pl.GM / s.r) / 1e6, t: fmtTime(s.t)
      };
    },
    status: function (sim) {
      var s = sim.state, o = info;
      if (s.landed) return 'Fell back after ' + fmtTime(s.t) + ' · press Play to launch again';
      if (s.done) return 'Escaped! At 20 planet radii it still moves at ' + M.fmt(Math.abs(s.v) / 1000, 2) + ' km/s';
      return (sim.running ? 'Flying' : (s.t === 0 ? 'Ready: press Play to launch' : 'Paused')) + ' · ' + fmtTime(s.t);
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, s = sim.state, o = info, pl = o.pl, W = sim.width, H = sim.height;
      var space = c.light ? '#e0e7ff' : '#05070f';
      D.clear(ctx, W, H, space);
      var rnd = M.rng(11);
      for (var i = 0; i < 70; i++) D.circle(ctx, rnd() * W, rnd() * H, rnd() * 1.1 + 0.3, D.alpha(c.light ? '#64748b' : '#ffffff', 0.25 + rnd() * 0.4));
      var small = W < 560, barsW = small ? 96 : 130, fs = small ? 10.5 : 12;
      var sceneW = W - barsW, cx = sceneW / 2 + (small ? 8 : 20);
      var ground = H * 0.86, topY = 34, sc = (ground - topY) / s.hview, Rp = pl.R * sc, cy = ground + Rp;

      // planet
      var g = ctx.createRadialGradient(cx - Rp * 0.3, cy - Rp * 0.3, Rp * 0.1, cx, cy, Rp);
      g.addColorStop(0, pl.col[0]); g.addColorStop(1, pl.col[1]);
      ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      if (Rp >= 22) D.text(ctx, pl.name, cx - 40, Math.min(ground + 16, H - 8), { color: c.text, bg: D.alpha(c.bg, 0.7), pad: 3, size: fs, weight: 700, align: 'right', fit: sceneW });
      else D.text(ctx, pl.name, cx + Rp + 6, Math.min(cy, H - 8), { color: c.text, size: fs, weight: 700 });

      // height scale on the left
      var step = D.niceStep(s.hview / 1000, Math.max(2, Math.floor((ground - topY) / 50)));
      for (var hk = step; hk * 1000 <= s.hview; hk += step) {
        var yy = ground - hk * 1000 * sc;
        D.line(ctx, 8, yy, 18, yy, c.muted, 1);
        D.text(ctx, (hk >= 1e5 ? M.fmt(hk / 1e3, 0) + 'k' : M.fmt(hk, step < 1 ? 1 : 0)) + ' km', 22, yy, { color: c.muted, size: 10 });
      }
      // predicted highest point
      if (o.bound) {
        var yt = ground - o.hmax * sc;
        D.line(ctx, cx - 70, yt, cx + 70, yt, D.alpha(c.s3, 0.8), 1.5, [5, 4]);
        D.text(ctx, 'highest point ' + fmtKm(o.hmax) + ' km', cx + 26, yt - 10, { color: c.s3, size: fs - 0.5, weight: 600, fit: sceneW });
      }

      // probe
      var py = ground - (s.r - pl.R) * sc;
      if (py > topY - 30) {
        py = Math.max(py, topY - 20);
        D.line(ctx, cx, ground, cx, py, D.alpha(c.s1, 0.35), 1.5, [2, 4]);
        ctx.save(); ctx.translate(cx, py); if (s.v < 0) ctx.rotate(Math.PI);
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(6, 4); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fillStyle = c.light ? '#334155' : '#e2e8f0'; ctx.fill();
        if (sim.running && !s.done && s.t < o.tTotal * 0.02) { ctx.beginPath(); ctx.moveTo(-4, 5); ctx.lineTo(0, 16); ctx.lineTo(4, 5); ctx.fillStyle = '#f97316'; ctx.fill(); }
        ctx.restore();
        var vl = Math.min(60, Math.abs(s.v) / o.ve * 50);
        if (vl > 3) D.arrow(ctx, cx + 16, py, cx + 16, py - Math.sign(s.v) * vl, c.s2, 2.5, 8);
        var gl = 12 + 30 * Math.min(1, (pl.GM / (s.r * s.r)) / o.g);
        D.arrow(ctx, cx - 16, py, cx - 16, py + gl, c.danger, 2.5, 8);
      }
      var msg = o.bound ? (o.v / o.ve > 0.98 ? (small ? 'Just below escape: comes back' : 'Just below escape speed: it goes very far, but comes back') : (small ? 'Below escape speed: falls back' : 'Below escape speed: it stops and falls back'))
        : (small ? 'Escape speed reached: never returns' : 'At or above escape speed ' + M.fmt(o.ve / 1000, 2) + ' km/s: it never comes back');
      D.text(ctx, msg, sceneW / 2, 16, { color: c.bg, bg: o.bound ? c.s3 : c.success, size: fs, weight: 700, align: 'center', pad: 4, fit: sceneW });

      // energy bars (per kg): KE ≥ 0, PE < 0, total
      var x0 = sceneW + 4, bw = small ? 22 : 28, gap = small ? 7 : 10, top = 44, bot = H - 26, mid = (top + bot) / 2;
      D.roundRect(ctx, x0, 26, barsW - 8, H - 30, 8, D.alpha(c.bg, 0.75));
      D.text(ctx, 'Energy per kg', x0 + (barsW - 8) / 2, 36, { color: c.muted, size: small ? 10 : 11.5, weight: 600, align: 'center' });
      var ke = s.v * s.v / 2, pe = -pl.GM / s.r, ref = Math.max(pl.GM / pl.R, o.v * o.v / 2), half = (bot - top - 12) / 2;
      D.line(ctx, x0 + 4, mid, x0 + barsW - 12, mid, c.axis, 1.5);
      D.text(ctx, '0', x0 + barsW - 12, mid - 7, { color: c.faint, size: 9.5, align: 'right' });
      [['KE', ke, c.s2], ['PE', pe, c.danger], ['Total', ke + pe, (ke + pe) >= 0 ? c.success : c.warning]].forEach(function (it, k) {
        var bx = x0 + 8 + k * (bw + gap), hh = it[1] / ref * half;
        if (Math.abs(hh) > 0.5) D.roundRect(ctx, bx, hh > 0 ? mid - hh : mid, bw, Math.abs(hh), 4, it[2]);
        D.text(ctx, it[0], bx + bw / 2, hh >= 0 ? mid + 10 : mid - 10, { color: c.muted, size: small ? 9 : 10, align: 'center' });
      });
      D.text(ctx, (ke + pe) >= 0 ? 'total ≥ 0: free' : 'total < 0: trapped', x0 + (barsW - 8) / 2, H - 12, { color: (ke + pe) >= 0 ? c.success : c.warning, size: small ? 8.5 : 10.5, weight: 700, align: 'center' });
    }
  });
})();