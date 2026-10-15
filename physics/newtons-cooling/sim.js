/* =====================================================================
   Thermal properties of matter (Class 11) · Newton's law of cooling — sim.js
   ---------------------------------------------------------------------
   Two cups of hot chai cool side by side in the same room.
   Each cup is two lumps that exchange heat (all in watts):
     tea  (heat capacity C_t = 4.0 J/g°C × volume in ml)
     cup wall (C_c, from its mass and material)
     tea → wall        G_tw (T_tea − T_wall)
     tea surface → air G_top (T_tea − T_room)   (evaporation + convection;
                       a lid cuts it to a fifth, a fan raises it ×2.5)
     wall → air        G_side (T_wall − T_room) (convection + radiation,
                       ×1.8 with a fan; almost zero for a vacuum flask)
   Once the cold cup has soaked up its share of heat (first minute or
   two), the tea follows Newton's law of cooling:
     dT/dt = −k (T − T_room),  k = (G_top + G_side) / (C_t + C_c)
     T = T_room + (T₀ − T_room) e^(−k t)
   Real cooling is a bit faster than this at high temperatures
   (evaporation and radiation grow faster than T − T_room); the model
   keeps every loss proportional to the difference, as in the law.
   Time: 1 second on screen = 1 minute.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var CUPS = {
    steel:  { n: 'Steel tumbler', C: 50, Gtw: 15, Gs: 0.22 },
    kulhad: { n: 'Clay kulhad', C: 110, Gtw: 3, Gs: 0.28 },
    mug:    { n: 'Ceramic mug', C: 250, Gtw: 5, Gs: 0.24 },
    flask:  { n: 'Vacuum flask', C: 60, Gtw: 10, Gs: 0.012 }
  };
  var CUP_OPTS = Object.keys(CUPS).map(function (k) { return { value: k, label: CUPS[k].n }; });
  var TEND = 60, SAMPLE = 0.25; // minutes

  function model(p, which) {
    var cup = CUPS[p['cup' + which]], lid = p['lid' + which], fan = p.fan;
    var Ct = 4.0 * p.vol, area = Math.pow(p.vol / 150, 2 / 3);
    var Gtop = (lid ? 0.044 : 0.22) * (fan ? 2.5 : 1);
    var Gs = cup.Gs * area * (fan ? (cup === CUPS.flask ? 1.1 : 1.8) : 1);
    return { cup: cup, lid: lid, Ct: Ct, Cc: cup.C, Gtw: cup.Gtw * area, Gtop: Gtop, Gs: Gs, k: 60 * (Gtop + Gs) / (Ct + cup.C) };
  }
  function newCup(p, which) {
    return { Tt: p.T0, Tw: p.warm ? p.T0 : p.Ts, pts: [], t60: null, rate: 0 };
  }
  function step(cup, m, Ts, dts) {
    var qtw = m.Gtw * (cup.Tt - cup.Tw), qtop = m.Gtop * (cup.Tt - Ts), qs = m.Gs * (cup.Tw - Ts);
    cup.Tt -= (qtw + qtop) / m.Ct * dts;
    cup.Tw += (qtw - qs) / m.Cc * dts;
    cup.rate = (qtw + qtop) / m.Ct * 60; // °C per minute
  }
  function fitK(pts) { // slope of rate vs (T − T_room) through the origin, skipping the first 3 min
    var sxy = 0, sxx = 0;
    pts.forEach(function (q) { if (q.t >= 3) { sxy += q.x * q.y; sxx += q.x * q.x; } });
    return sxx > 0 ? sxy / sxx : null;
  }
  function tempCol(T) { var t = M.clamp((T - 20) / 70, 0, 1); return 'rgb(' + Math.round(70 + 180 * t) + ',' + Math.round(150 - 90 * t) + ',' + Math.round(230 - 190 * t) + ')'; }

  SimLab.createSim({
    ariaLabel: 'Two cups of hot tea cooling side by side in a room, with thermometers, steam and a plot of rate of cooling against temperature difference',
    mobileAspect: '1 / 1',
    playLabel: 'Start cooling',
    params: [
      { id: 'cupA', label: 'Cup A', type: 'select', value: 'steel', options: CUP_OPTS },
      { id: 'lidA', label: 'Lid on cup A', type: 'toggle', value: false },
      { id: 'cupB', label: 'Cup B', type: 'select', value: 'kulhad', options: CUP_OPTS },
      { id: 'lidB', label: 'Lid on cup B', type: 'toggle', value: false },
      { id: 'Ts', label: 'Room temperature', min: 5, max: 45, step: 1, value: 25, unit: '°C', presets: [{ label: 'Shimla winter 8', value: 8 }, { label: 'Delhi May 42', value: 42 }] },
      { id: 'T0', label: 'Chai poured at', min: 50, max: 95, step: 1, value: 90, unit: '°C' },
      { id: 'vol', label: 'Chai in each cup', min: 50, max: 250, step: 10, value: 150, unit: 'ml', help: 'A kulhad usually holds about 100 ml, a tumbler 150–200 ml.' },
      { id: 'fan', label: 'Ceiling fan on', type: 'toggle', value: false },
      { id: 'warm', label: 'Pre-warm both cups with hot water first', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'TA', label: 'Chai in cup A', short: 'Cup A', unit: '°C', digits: 1, key: true },
      { id: 'TB', label: 'Chai in cup B', short: 'Cup B', unit: '°C', digits: 1, key: true },
      { id: 'rA', label: 'Rate of cooling, cup A', unit: '°C/min', digits: 2 },
      { id: 'rB', label: 'Rate of cooling, cup B', unit: '°C/min', digits: 2 },
      { id: 'kA', label: 'k = rate ÷ (T − T_room), cup A', unit: '/min', digits: 3 },
      { id: 'kB', label: 'k = rate ÷ (T − T_room), cup B', unit: '/min', digits: 3 },
      { id: 'hA', label: 'Cup A down to 60 °C after' },
      { id: 'hB', label: 'Cup B down to 60 °C after' }
    ],
    graph: { title: 'Temperature of the chai', xLabel: 'time (min)', yLabel: '°C', xMax: 40, series: [{ label: 'cup A' }, { label: 'cup B' }, { label: 'room', color: '--sim-3' }] },

    reset: function (sim) { sim.state = { A: newCup(sim.p, 'A'), B: newCup(sim.p, 'B'), next: 0 }; },
    sample: function (sim) { return [sim.state.A.Tt, sim.state.B.Tt, sim.p.Ts]; },
    finished: function (sim) { return sim.time >= TEND; },
    update: function (sim, dt) {
      var s = sim.state, p = sim.p, n = 4, dts = dt * 60 / n;
      ['A', 'B'].forEach(function (w) {
        var m = model(p, w), cup = s[w];
        for (var i = 0; i < n; i++) step(cup, m, p.Ts, dts);
        if (cup.t60 == null && cup.Tt <= 60 && p.T0 > 60) cup.t60 = sim.time;
      });
      if (sim.time >= s.next) {
        s.next += SAMPLE;
        ['A', 'B'].forEach(function (w) { var cup = s[w]; if (cup.Tt - p.Ts > 0.3) cup.pts.push({ t: sim.time, x: cup.Tt - p.Ts, y: cup.rate }); });
      }
    },
    status: function (sim) { return sim.time >= TEND ? 'One hour later' : sim.running ? 'Cooling… (1 s on screen = 1 minute)' : 'Ready'; },
    readout: function (sim) {
      var s = sim.state, p = sim.p, o = {};
      ['A', 'B'].forEach(function (w) {
        var cup = s[w], d = cup.Tt - p.Ts;
        o['T' + w] = cup.Tt; o['r' + w] = sim.time > 0 ? cup.rate : NaN;
        o['k' + w] = sim.time > 0 && Math.abs(d) > 0.3 ? cup.rate / d : NaN;
        o['h' + w] = p.T0 <= 60 ? 'already below 60 °C' : cup.t60 != null ? M.fmt(cup.t60, 1) + ' min' : sim.time >= TEND ? 'more than 1 hour' : 'not yet';
      });
      return o;
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      var stack = H > W * 0.9, fs = W < 560 ? 10.5 : 12;
      var cupsW = stack ? W : W * 0.58, cupsH = stack ? H * 0.56 : H;
      // room strip
      var head = 'Room ' + p.Ts + ' °C' + (p.fan ? ' · fan on' : '') + ' · ' + M.fmt(sim.time, 1) + ' min';
      D.text(ctx, head, cupsW / 2, 13, { color: c.muted, size: fs, weight: 700, align: 'center', fit: cupsW });
      if (p.fan) drawFan(ctx, 14, 30, c, sim.time);
      ['A', 'B'].forEach(function (w, i) {
        var m = model(p, w), cup = s[w], col = i ? c.s2 : c.s1;
        var cx = cupsW * (i ? 0.72 : 0.28), size = Math.min(cupsH * 0.46, cupsW * 0.32), base = Math.min(cupsH - 2 * fs - 14, (cupsH + 1.45 * size) / 2 + 10);
        drawCup(ctx, p['cup' + w], cx, base, size, c, cup, m.lid, p, sim.time + i * 3.1);
        D.text(ctx, w + ': ' + m.cup.n + (m.lid ? ' + lid' : ''), cx, base + fs + 4, { color: col, size: fs, weight: 700, align: 'center', fit: cupsW });
        D.text(ctx, M.fmt(cup.Tt, 1) + ' °C', cx, base + 2 * fs + 9, { color: c.ink, size: fs + 2, weight: 800, align: 'center', fit: cupsW });
      });
      if (stack) drawPlot(ctx, 8, cupsH + 6, W - 16, H - cupsH - 10, c, p, s, fs);
      else drawPlot(ctx, cupsW + 4, 12, W - cupsW - 14, H - 24, c, p, s, fs);
    }
  });

  function drawFan(ctx, x, y, c, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 25);
    for (var i = 0; i < 3; i++) { ctx.rotate(2 * Math.PI / 3); ctx.fillStyle = D.alpha(c.muted, 0.7); ctx.beginPath(); ctx.ellipse(6, 0, 6, 2.5, 0, 0, 2 * Math.PI); ctx.fill(); }
    ctx.restore(); D.circle(ctx, x, y, 2, c.ink);
    for (var j = 0; j < 3; j++) { var yy = y + 14 + j * 7, sh = (t * 40 + j * 9) % 24; D.line(ctx, x - 4 + sh, yy, x + 6 + sh, yy, D.alpha(c.muted, 0.5), 1.2); }
  }

  function drawCup(ctx, kind, cx, base, h, c, cup, lid, p, t) {
    var topW, botW, ch = h, body, rim;
    if (kind === 'steel') { topW = 0.62 * h; botW = 0.5 * h; body = c.light ? '#cbd5e1' : '#94a3b8'; rim = '#e2e8f0'; }
    else if (kind === 'kulhad') { ch = 0.8 * h; topW = 0.78 * h; botW = 0.46 * h; body = '#b45309'; rim = '#d97706'; }
    else if (kind === 'mug') { ch = 0.82 * h; topW = botW = 0.66 * h; body = c.light ? '#f8fafc' : '#e5e7eb'; rim = '#ffffff'; }
    else { ch = 1.1 * h; topW = botW = 0.46 * h; body = '#1e3a8a'; rim = '#93c5fd'; }
    var top = base - ch, glow = M.clamp((cup.Tt - p.Ts) / 70, 0, 1);
    // warm halo
    var g = ctx.createRadialGradient(cx, base - ch / 2, ch * 0.2, cx, base - ch / 2, ch * 0.95);
    g.addColorStop(0, D.alpha('#f97316', 0.28 * glow)); g.addColorStop(1, D.alpha('#f97316', 0));
    ctx.fillStyle = g; ctx.fillRect(cx - ch, base - ch * 1.6, 2 * ch, ch * 1.8);
    // handle
    if (kind === 'mug') { ctx.save(); ctx.strokeStyle = body; ctx.lineWidth = Math.max(4, h * 0.07); ctx.beginPath(); ctx.ellipse(cx + topW / 2, top + ch * 0.48, h * 0.17, ch * 0.24, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.restore(); }
    // body
    ctx.beginPath(); ctx.moveTo(cx - topW / 2, top); ctx.lineTo(cx + topW / 2, top); ctx.lineTo(cx + botW / 2, base); ctx.lineTo(cx - botW / 2, base); ctx.closePath();
    var bg = ctx.createLinearGradient(cx - topW / 2, 0, cx + topW / 2, 0);
    bg.addColorStop(0, body); bg.addColorStop(0.35, kind === 'steel' ? '#f8fafc' : body); bg.addColorStop(1, D.alpha(body, 0.75));
    ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = D.alpha(c.ink, 0.5); ctx.lineWidth = 1; ctx.stroke();
    if (kind === 'kulhad') { var r = M.rng(7); ctx.fillStyle = 'rgba(80,30,0,0.35)'; for (var i = 0; i < 40; i++) { var yy = top + r() * ch, f = (yy - top) / ch, hw = (topW + (botW - topW) * f) / 2 - 3; ctx.fillRect(cx - hw + r() * 2 * hw, yy, 1.6, 1.6); } }
    if (kind === 'flask') { D.line(ctx, cx - topW / 2 + 4, top + 6, cx - topW / 2 + 4, base - 6, D.alpha('#ffffff', 0.35), 2); }
    // rim + chai surface
    var lev = M.clamp(p.vol / 250, 0.25, 1) * 0.82, surfY = base - ch * lev;
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, top, topW / 2, Math.max(3, topW * 0.1), 0, 0, 2 * Math.PI); ctx.fillStyle = D.alpha('#3b2414', 0.9); ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    var ry = Math.max(3, topW * 0.1), drop = (1 - lev / 0.82) * ry * 1.3;
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, top, topW / 2 - 1, ry - 1, 0, 0, 2 * Math.PI); ctx.clip();
    ctx.beginPath(); ctx.ellipse(cx, top + 1 + drop, topW / 2 - 2, ry - 1, 0, 0, 2 * Math.PI); ctx.fillStyle = '#b5835a'; ctx.fill(); ctx.restore();
    // thermometer
    var tx = cx + topW * 0.18, tTop = top - h * 0.38, frac = M.clamp((cup.Tt - 0) / 100, 0, 1), tb = surfY + (base - surfY) * 0.6;
    D.roundRect(ctx, tx - 3, tTop, 6, tb - tTop, 3, c.light ? '#f8fafc' : '#e2e8f0', D.alpha(c.ink, 0.6), 1);
    ctx.fillStyle = '#dc2626'; var fill = (tb - tTop - 6) * frac; ctx.fillRect(tx - 1.5, tb - 4 - fill, 3, fill);
    // lid or steam
    if (lid) D.roundRect(ctx, cx - topW / 2 - 6, top - 6, topW + 12, 6, 3, c.light ? '#94a3b8' : '#64748b', D.alpha(c.ink, 0.6), 1);
    else {
      var nW = Math.round(1 + 4 * M.clamp((cup.Tt - p.Ts) / 50, 0, 1) * M.clamp((cup.Tt - 35) / 20, 0, 1));
      ctx.save(); ctx.lineCap = 'round';
      for (var k = 0; k < nW; k++) {
        var x0 = cx - topW * 0.3 + k * topW * 0.6 / Math.max(1, nW - 1) - topW * 0.12, ph = (t * 0.9 + k * 0.37) % 1;
        ctx.strokeStyle = D.alpha(c.ink, 0.45 * (1 - ph) * M.clamp((cup.Tt - 35) / 25, 0, 1)); ctx.lineWidth = 2.2; ctx.beginPath();
        for (var q = 0; q <= 12; q++) { var yy2 = top - 6 - q * h * 0.04 - ph * h * 0.25; ctx.lineTo(x0 + Math.sin(q * 0.7 + t * 3 + k) * 4 + (p.fan ? q * 2.5 : 0), yy2); }
        ctx.stroke();
      }
      ctx.restore();
    }
    D.circle(ctx, tx, tb - 2, 4, tempCol(cup.Tt));
  }

  // rate of cooling against temperature difference: Newton's law is a straight line through 0
  function drawPlot(ctx, x, y, w, h, c, p, s, fs) {
    D.roundRect(ctx, x, y, w, h, 8, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.15));
    var pl = x + 30, pr = x + w - 10, pt = y + 2 * fs + 10, pb = y + h - fs - 12;
    D.text(ctx, 'Rate of cooling vs (T − T_room)', x + w / 2, y + fs, { color: c.text, size: fs, weight: 700, align: 'center', fit: x + w });
    var dmax = Math.max(10, p.T0 - p.Ts) * 1.05, rmax = 0;
    ['A', 'B'].forEach(function (w2) { var m = model(p, w2); rmax = Math.max(rmax, m.k * dmax * 1.25); });
    rmax = Math.max(rmax, 0.2);
    function X(v) { return pl + v / dmax * (pr - pl); }
    function Y(v) { return pb - M.clamp(v / rmax, -0.05, 1.05) * (pb - pt); }
    D.line(ctx, pl, pb, pr, pb, c.axis, 1.2); D.line(ctx, pl, pb, pl, pt, c.axis, 1.2);
    D.text(ctx, '°C/min', pl - 2, pt - 8, { color: c.muted, size: fs - 2, align: 'center' });
    D.text(ctx, 'T − T_room (°C)', (pl + pr) / 2, pb + fs + 2, { color: c.muted, size: fs - 1, align: 'center' });
    D.text(ctx, '0', pl - 6, pb, { color: c.muted, size: fs - 2, align: 'right' });
    D.text(ctx, M.fmt(rmax, rmax < 2 ? 1 : 0), pl - 4, pt, { color: c.muted, size: fs - 2, align: 'right' });
    D.text(ctx, M.fmt(dmax, 0), pr, pb + 8, { color: c.muted, size: fs - 2, align: 'right' });
    ['A', 'B'].forEach(function (w2, i) {
      var col = i ? c.s2 : c.s1, pts = s[w2].pts;
      pts.forEach(function (q) { D.circle(ctx, X(q.x), Y(q.y), q.t < 3 ? 2 : 2.6, q.t < 3 ? D.alpha(col, 0.45) : col); });
      var k = fitK(pts);
      if (k != null) {
        D.line(ctx, X(0), Y(0), X(dmax), Y(k * dmax), D.alpha(col, 0.8), 1.4, [5, 4]);
        D.text(ctx, w2 + ': k = ' + M.fmt(k, 3) + ' /min', pl + 6, pt + 4 + i * (fs + 5), { color: col, size: fs - 0.5, weight: 700, bg: D.alpha(c.bg, 0.8), pad: 2 });
      }
    });
    if (!s.A.pts.length) D.text(ctx, 'Press Start: each dot is one reading', (pl + pr) / 2, (pt + pb) / 2, { color: c.faint, size: fs - 1, align: 'center', fit: x + w });
  }
})();
