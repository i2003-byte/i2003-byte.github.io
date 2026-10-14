/* =====================================================================
   Thermal properties of matter (Class 11) · Calorimetry — sim.js
   ---------------------------------------------------------------------
   Method of mixtures in an insulated copper calorimeter (100 g,
   c = 0.385 J/g°C, so it holds 38.5 J per °C), no heat lost outside:
     heat lost by the hot body = heat gained by the cold body
     Q = m c ΔT;   final T = (C_A T_A + C_B T_B) / (C_A + C_B)
   Specific heats (J/g°C): water 4.18, copper 0.385, aluminium 0.900,
   iron 0.450, lead 0.128, "metal X" 0.235 (silver, kept hidden).
   Ice is at 0 °C; latent heat of fusion L = 334 J/g. While ice is
   left, it stays at 0 °C; melted water joins the water at 0 °C.
   Heat flows at P = k (T_hot − T_cold); k is chosen so that the
   temperatures settle in a few seconds on screen (real mixing with
   stirring takes a minute or more).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var CW = 4.18, LF = 334, CAL = 100 * 0.385, DROP = 0.7;
  var OBJ = {
    copper: { c: 0.385, n: 'Copper block', col: '#ea8a4a' }, aluminium: { c: 0.900, n: 'Aluminium block', col: '#cbd5e1' },
    iron: { c: 0.450, n: 'Iron block', col: '#78716c' }, lead: { c: 0.128, n: 'Lead block', col: '#64748b' },
    x: { c: 0.235, n: 'Metal X (unknown)', col: '#e5e7eb' }, water: { c: CW, n: 'Hot water', col: '#ef4444' }, ice: { c: 2.1, n: 'Ice at 0 °C', col: '#bae6fd' }
  };

  function caps(p) {
    var o = OBJ[p.obj], CB = p.mW * CW + (p.cal ? CAL : 0);
    return { CA: p.mO * o.c, CB: CB, TA0: p.obj === 'ice' ? 0 : p.obj === 'water' ? Math.min(p.TO, 100) : p.TO, TB0: p.TW };
  }
  function predict(p) {
    var k = caps(p);
    if (p.obj !== 'ice') return { T: (k.CA * k.TA0 + k.CB * k.TB0) / (k.CA + k.CB), left: 0 };
    var avail = k.CB * k.TB0, need = p.mO * LF;
    if (avail >= need) return { T: (avail - need) / (k.CB + p.mO * CW), left: 0 };
    return { T: 0, left: p.mO - avail / LF };
  }
  function tColor(T) { // blue (0 °C) → red (100 °C)
    var t = M.clamp(T / 100, 0, 1);
    return 'rgb(' + Math.round(40 + 200 * t) + ',' + Math.round(130 - 70 * t) + ',' + Math.round(230 - 180 * t) + ')';
  }

  SimLab.createSim({
    ariaLabel: 'A hot metal block, hot water or ice is dropped into water in a calorimeter; the temperatures meet and heat lost equals heat gained',
    mobileAspect: '1 / 1',
    playLabel: 'Drop it in',
    params: [
      { id: 'obj', label: 'Drop in', type: 'select', value: 'copper', options: Object.keys(OBJ).map(function (k) { return { value: k, label: OBJ[k].n + (k === 'x' || k === 'ice' ? '' : ' (c = ' + OBJ[k].c + ' J/g°C)') }; }) },
      { id: 'mO', label: 'Its mass', min: 10, max: 500, step: 5, value: 200, unit: 'g' },
      { id: 'TO', label: 'Its temperature', min: 0, max: 200, step: 1, value: 100, unit: '°C', presets: [{ label: 'Boiling water bath 100', value: 100 }], help: 'Ice is always at 0 °C; hot water at most 100 °C.' },
      { id: 'mW', label: 'Water in the calorimeter', min: 50, max: 500, step: 5, value: 200, unit: 'g' },
      { id: 'TW', label: 'Water temperature', min: 0, max: 60, step: 1, value: 25, unit: '°C' },
      { id: 'cal', label: 'Count the copper calorimeter (100 g)', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'TA', label: 'Temperature of what you dropped', short: 'Object', unit: '°C', digits: 1, key: true },
      { id: 'TB', label: 'Water temperature', short: 'Water', unit: '°C', digits: 1, key: true },
      { id: 'Q', label: 'Heat lost by hot = gained by cold', short: 'Heat moved', key: true },
      { id: 'Tf', label: 'Final temperature from the formula' },
      { id: 'ice', label: 'Ice left' },
      { id: 'c', label: 'Specific heat of the object' }
    ],
    graph: { title: 'Temperatures while they mix', xLabel: 'time (speeded up, s)', yLabel: '°C', series: [{ label: 'object', color: '--sim-2' }, { label: 'water', color: '--sim-1' }] },

    reset: function (sim) {
      var k = caps(sim.p);
      sim.state = { TA: k.TA0, TB: k.TB0, CB: k.CB, ice: sim.p.obj === 'ice' ? sim.p.mO : 0, melted: 0, done: false };
    },
    sample: function (sim) { var s = sim.state; return [s.ice > 0 || sim.p.obj !== 'ice' ? s.TA : NaN, s.TB]; },
    finished: function (sim) { return sim.state.done; },
    update: function (sim, dt) {
      var s = sim.state, p = sim.p, k = caps(p);
      if (sim.time < DROP) return;
      if (p.obj === 'ice') {
        if (s.ice > 0 && s.TB > 0) {
          var P = 0.6 * s.CB * s.TB, dm = Math.min(s.ice, P * dt / LF);
          s.TB -= dm * LF / s.CB; s.ice -= dm;
          s.TB = s.CB * s.TB / (s.CB + dm * CW); s.CB += dm * CW; s.melted += dm;   // melted water at 0 °C mixes in
          if (s.TB < 0) s.TB = 0;
        }
        s.TA = s.ice > 0 ? 0 : s.TB;
        if (s.ice <= 1e-6 || s.TB < 0.05) { s.done = sim.time > DROP + 0.5; if (s.ice <= 1e-6) s.ice = 0; if (s.ice > 0) s.TB = 0; }
        return;
      }
      var kk = (p.obj === 'water' ? 1.8 : 0.6) / (1 / k.CA + 1 / k.CB), q = kk * (s.TA - s.TB) * dt;
      s.TA -= q / k.CA; s.TB += q / k.CB;
      if (Math.abs(s.TA - s.TB) < 0.05) { var T = predict(p).T; s.TA = s.TB = T; s.done = true; }
    },
    status: function (sim) { return sim.state.done ? 'Settled: thermal equilibrium' : sim.running ? (sim.time < DROP ? 'Dropping…' : 'Heat flowing… (speeded up)') : 'Ready'; },
    readout: function (sim) {
      var s = sim.state, p = sim.p, k = caps(p), pr = predict(p), Q;
      if (p.obj === 'ice') Q = k.CB * (k.TB0 - s.TB);
      else Q = k.TA0 >= k.TB0 ? k.CA * (k.TA0 - s.TA) : k.CB * (k.TB0 - s.TB);
      return {
        TA: p.obj === 'ice' && s.ice <= 0 ? s.TB : s.TA, TB: s.TB, Q: M.fmt(Math.abs(Q) / 1000, 2) + ' kJ',
        Tf: M.fmt(pr.T, 1) + ' °C' + (pr.left > 0 ? ' with ' + M.fmt(pr.left, 0) + ' g ice left' : ''),
        ice: p.obj === 'ice' ? M.fmt(s.ice, 1) + ' g' : '—',
        c: p.obj === 'x' ? '? (find it!)' : p.obj === 'ice' ? 'L = 334 J/g to melt' : OBJ[p.obj].c + ' J/g°C'
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, k = caps(p);
      var nar = W < 560, fs = nar ? 10 : 12;
      D.clear(ctx, W, H, c.bg);
      var side = nar ? Math.min(118, W * 0.34) : Math.min(220, W * 0.3), cw = W - side - 16;
      // calorimeter geometry
      var jw = Math.min(cw * 0.92, H * 0.74), jx = 8 + (cw - jw) / 2, jb = H - 12, jh = Math.min(H * 0.7, jw), jt = jb - jh;
      var inset = jw * 0.12, cx0 = jx + inset, cx1 = jx + jw - inset, ct = jt + inset * 0.6, cb = jb - inset * 0.6;
      D.roundRect(ctx, jx, jt, jw, jh, 8, c.light ? '#d6b98c' : '#5b4630', c.ink, 1.2);           // insulating jacket
      ctx.save(); ctx.fillStyle = D.alpha(c.ink, 0.12); for (var dx = jx + 6; dx < jx + jw - 4; dx += 7) for (var dy = jt + 6; dy < jb - 4; dy += 7) ctx.fillRect(dx, dy, 1.5, 1.5); ctx.restore();
      D.roundRect(ctx, cx0, ct, cx1 - cx0, cb - ct, 4, c.bg, '#c2410c', 3);                         // copper can
      var totM = p.mW + (p.obj === 'water' && sim.time >= DROP ? p.mO : 0) + s.melted, lev = M.clamp(totM / 700, 0.2, 0.85);
      var wy = cb - (cb - ct) * lev;
      ctx.fillStyle = D.alpha(tColor(s.TB), 0.55); ctx.fillRect(cx0 + 2, wy, cx1 - cx0 - 4, cb - wy - 2);
      D.line(ctx, cx0 + 2, wy, cx1 - 2, wy, D.alpha(tColor(s.TB), 0.95), 2);
      D.text(ctx, 'insulated jacket', jx + jw / 2, jb - 7, { color: c.light ? '#3f2d16' : '#e7d3b4', size: fs - 2, align: 'center' });
      // thermometer in the water
      var tx = cx1 - (cx1 - cx0) * 0.18, tTop = jt - (nar ? 30 : 46);
      D.roundRect(ctx, tx - 4, tTop, 8, cb - 10 - tTop, 4, c.light ? '#f8fafc' : '#e2e8f0', c.ink, 1);
      var frac = M.clamp(s.TB / 100, 0, 1); D.circle(ctx, tx, cb - 12, 6, '#dc2626');
      ctx.fillStyle = '#dc2626'; ctx.fillRect(tx - 2, cb - 12 - (cb - 22 - tTop) * frac - 4, 4, (cb - 22 - tTop) * frac + 4);
      D.text(ctx, M.fmt(s.TB, 1) + ' °C', tx + 8, tTop + 6, { color: c.ink, size: fs + 1, weight: 800, bg: D.alpha(c.bg, 0.85), pad: 3, fit: cw + 8 });
      // stirrer
      var sx = cx0 + (cx1 - cx0) * 0.2, wob = sim.running ? Math.sin(sim.time * 9) * 4 : 0;
      D.line(ctx, sx, tTop + 10, sx, cb - 14 + wob, c.muted, 2); D.line(ctx, sx - 8, cb - 14 + wob, sx + 8, cb - 14 + wob, c.muted, 3);
      // the object: falls in during the first DROP seconds
      var fall = M.clamp(sim.time / DROP, 0, 1), bw = (cx1 - cx0) * 0.3, mx = (cx0 + cx1) / 2 - bw * 0.1;
      if (p.obj === 'water') {
        if (fall < 1) { // beaker pouring
          var bx = mx - bw / 2, by = 18;
          D.roundRect(ctx, bx, by, bw, bw * 0.9, 3, D.alpha(tColor(k.TA0), 0.6), c.ink, 1.2);
          if (sim.time > 0) { ctx.fillStyle = D.alpha(tColor(k.TA0), 0.7); ctx.fillRect(mx - 3, by + bw * 0.9, 6, wy - by - bw * 0.9); }
        } else { // a hot swirl that fades as it mixes
          var a = M.clamp(Math.abs(s.TA - s.TB) / Math.max(1, Math.abs(k.TA0 - k.TB0)), 0, 1);
          ctx.save(); ctx.strokeStyle = D.alpha(tColor(s.TA), 0.9 * a); ctx.lineWidth = 3; ctx.beginPath();
          for (var q = 0; q < 60; q++) { var th = q / 60 * 4 * Math.PI + sim.time * 2, rr = 4 + q * 0.5; ctx.lineTo(mx + Math.cos(th) * rr, (wy + cb) / 2 + Math.sin(th) * rr * 0.5); }
          ctx.stroke(); ctx.restore();
        }
        D.text(ctx, 'hot water ' + M.fmt(fall < 1 ? k.TA0 : s.TA, 1) + ' °C', mx, fall < 1 ? 10 : wy - 12, { color: c.danger, size: fs, weight: 700, align: 'center', fit: cw + 8 });
      } else {
        var size = p.obj === 'ice' ? bw * Math.cbrt(Math.max(0, s.ice) / Math.max(1, p.mO)) : bw * Math.cbrt(p.mO / 200) * 0.9;
        size = Math.min(size, (cb - wy) * 0.9, bw * 1.3);
        var restY = p.obj === 'ice' ? wy - size * 0.1 : cb - 4 - size, y = 14 + (restY - 14) * fall * fall;
        if (size > 0.5) {
          var col = p.obj === 'ice' ? OBJ.ice.col : OBJ[p.obj].col;
          D.roundRect(ctx, mx - size / 2, y, size, size, p.obj === 'ice' ? size * 0.2 : 2, col, c.ink, 1);
          if (p.obj !== 'ice' && s.TA > 60) D.roundRect(ctx, mx - size / 2, y, size, size, 2, D.alpha('#ef4444', M.clamp((s.TA - 60) / 140, 0, 0.6)));
          if (p.obj === 'x') D.text(ctx, 'X', mx, y + size / 2, { color: '#111827', size: Math.max(9, size * 0.45), weight: 800, align: 'center' });
        }
        var lbl = p.obj === 'ice' ? (s.ice > 0 ? 'ice ' + M.fmt(s.ice, 0) + ' g, 0 °C' : 'all melted') : M.fmt(s.TA, 1) + ' °C';
        D.text(ctx, lbl, mx, fall < 1 ? Math.max(8, y - 9) : Math.max(8, Math.min(y, wy) - 10), { color: p.obj === 'ice' ? c.s1 : c.danger, size: fs, weight: 800, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: cw + 8 });
      }
      // heat flow arrows
      if (fall >= 1 && !s.done) {
        var hot = p.obj === 'ice' ? -1 : Math.sign(s.TA - s.TB), mag = M.clamp(Math.abs((p.obj === 'ice' ? s.TB : s.TA - s.TB)) / 30, 0.15, 1);
        var ay = (wy + cb) / 2 + (cb - wy) * 0.25;
        [-1, 1].forEach(function (sg) {
          var ax = mx + sg * bw * 0.7;
          if (hot > 0) D.arrow(ctx, mx + sg * bw * 0.4, ay, ax + sg * 14, ay, '#f97316', 1 + 3 * mag, 8);
          else D.arrow(ctx, ax + sg * 14, ay, mx + sg * bw * 0.4, ay, '#f97316', 1 + 3 * mag, 8);
        });
      }
      drawBars(ctx, W - side - 4, 10, side, H - 20, c, p, s, k, fs, nar);
    }
  });

  // heat lost and gained bars + the prediction
  function drawBars(ctx, x, y, w, h, c, p, s, k, fs, nar) {
    var pr = predict(p), lost, gain, lostL, gainL;
    if (p.obj === 'ice') { lost = k.CB * (k.TB0 - s.TB); gain = s.melted * LF + s.melted * CW * s.TB; lostL = 'lost by water + can'; gainL = 'taken by ice'; }
    else if (k.TA0 >= k.TB0) { lost = k.CA * (k.TA0 - s.TA); gain = k.CB * (s.TB - k.TB0); lostL = 'lost by ' + (p.obj === 'water' ? 'hot water' : 'block'); gainL = 'gained by water' + (p.cal ? ' + can' : ''); }
    else { lost = k.CB * (k.TB0 - s.TB); gain = k.CA * (s.TA - k.TA0); lostL = 'lost by water' + (p.cal ? ' + can' : ''); gainL = 'gained by block'; }
    var maxQ = p.obj === 'ice' ? k.CB * k.TB0 : Math.abs(k.CA * k.TA0 - k.CA * pr.T) || 1;
    var bh = Math.min(h * 0.5, nar ? 140 : 200), base = y + 28 + bh, bw = Math.min(34, w * 0.28);
    D.text(ctx, 'Heat (kJ)', x + w / 2, y + 8, { color: c.muted, size: fs, weight: 700, align: 'center' });
    [[lost, '#f97316', lostL], [gain, '#38bdf8', gainL]].forEach(function (b, i) {
      var bx = x + w * (i ? 0.7 : 0.3) - bw / 2, hh = bh * M.clamp(b[0] / maxQ, 0, 1);
      D.roundRect(ctx, bx, base - bh, bw, bh, 4, D.alpha(c.ink, 0.06), D.alpha(c.ink, 0.2));
      if (hh > 0.5) D.roundRect(ctx, bx, base - hh, bw, hh, 4, b[1]);
      D.text(ctx, M.fmt(Math.max(0, b[0]) / 1000, 2), bx + bw / 2, base - hh - 9, { color: c.ink, size: fs - 1, weight: 700, align: 'center' });
      var words = b[2].split(' '), half = Math.ceil(words.length / 2);
      D.text(ctx, words.slice(0, half).join(' '), bx + bw / 2, base + 10, { color: b[1], size: fs - 2, weight: 700, align: 'center', fit: x + w + 6 });
      D.text(ctx, words.slice(half).join(' '), bx + bw / 2, base + 10 + fs, { color: b[1], size: fs - 2, weight: 700, align: 'center', fit: x + w + 6 });
    });
    var ty = base + 20 + 2 * fs + 6;
    if (ty + 2 * fs < y + h) {
      D.text(ctx, 'Formula says:', x + w / 2, ty, { color: c.muted, size: fs - 1, align: 'center' });
      D.text(ctx, M.fmt(pr.T, 1) + ' °C', x + w / 2, ty + fs + 4, { color: c.ink, size: fs + 2, weight: 800, align: 'center' });
      if (pr.left > 0 && ty + 3 * fs + 8 < y + h) D.text(ctx, M.fmt(pr.left, 0) + ' g ice stays', x + w / 2, ty + 2 * fs + 10, { color: c.s1, size: fs - 1, weight: 700, align: 'center' });
    }
  }
})();
