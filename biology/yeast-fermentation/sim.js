/* =====================================================================
   Microorganisms · Yeast and Fermentation — sim.js
   ---------------------------------------------------------------------
   Two 500 mL bottles of water with sugar and dry yeast, each with a
   balloon on its neck: your bottle, and a comparison bottle that
   changes one thing (no yeast, no sugar, cold or hot water).
   Fermentation:  C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂ (+ energy)
   180 g of sugar gives 2 × 25 L of CO₂ at about 30 °C, so each mL of
   gas uses about 0.0036 g of sugar.
   Simple model (per bottle, time in minutes):
     temperature factor f(T): peak at 32 °C, exp(−((T − 32)/12)²) below,
       1 − ((T − 32)/13)² above (0 from 45 °C); 50 °C or more kills
       the yeast for good
     sugar factor g = s / (s + 1.5 g)
     gas rate     = 5 mL/min × N × f × g   (N = yeast, in teaspoons)
     yeast growth dN/dt = N × ln2/100 min × f × g × (1 − N / 5N₀)
       (budding: about 100 min to double in warm sugary water)
     sugar        ds/dt = −0.0036 g × gas rate
   Balloon radius from its volume: r = ∛(3V / 4π). 1 s of real time
   is 6 minutes of bottle time; the run lasts 4 hours.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var MIN_PER_S = 6, END = 240, SPOON = 5;
  var CMP = {
    noyeast: { label: 'No yeast', short: 'no yeast' },
    nosugar: { label: 'No sugar', short: 'no sugar' },
    cold: { label: 'Cold water, 10 °C', short: '10 °C' },
    hot: { label: 'Hot water, 60 °C', short: '60 °C' }
  };

  function fT(T) { return T >= 50 ? 0 : T <= 32 ? Math.exp(-Math.pow((T - 32) / 12, 2)) : Math.max(0, 1 - Math.pow((T - 32) / 13, 2)); }
  function bottle(T, sugarG, yeast) {
    return { T: T, s: sugarG, s0: sugarG, N: yeast, N0: yeast, V: 0, rate: 0, dead: T >= 50, bub: [], acc: 0 };
  }
  function makeBottles(p) {
    var k = CMP[p.compare] ? p.compare : 'noyeast';
    var b2 = k === 'noyeast' ? bottle(p.temp, p.sugar * SPOON, 0)
      : k === 'nosugar' ? bottle(p.temp, 0, p.yeast)
      : bottle(k === 'cold' ? 10 : 60, p.sugar * SPOON, p.yeast);
    return [bottle(p.temp, p.sugar * SPOON, p.yeast), b2];
  }
  function step(b, dt) {
    if (b.dead || b.N <= 0) { b.rate = 0; return; }
    var f = fT(b.T), g = b.s / (b.s + 1.5), r = 5 * b.N * f * g;
    b.N += b.N * Math.LN2 / 100 * f * g * (1 - b.N / (5 * b.N0)) * dt;
    b.V += r * dt; b.s = Math.max(0, b.s - r * 0.0036 * dt); b.rate = r;
  }
  function hm(min) { var h = Math.floor(min / 60), m = Math.floor(min % 60); return h + ' h ' + (m < 10 ? '0' : '') + m + ' min'; }

  // microscope cells (your bottle): positions and bud phase
  function seedCells(sim) {
    var rnd = M.rng(7), cells = [], n = Math.max(0, Math.round(sim.p.yeast * 14));
    for (var i = 0; i < n; i++) cells.push({ x: rnd() * 1.6 - 0.8, y: rnd() * 1.6 - 0.8, a: rnd() * Math.PI, ph: rnd() * 0.8 });
    sim.state.cells = cells.filter(function (c) { return c.x * c.x + c.y * c.y < 0.7; });
    sim.state.rnd = M.rng(99);
  }

  function drawBottle(ctx, c, b, x, w, yTop, yBot, label, color, now, fs) {
    var H = yBot - yTop, bw = Math.min(w * 0.6, (H - 22) * 0.5 / 2.2), bh = bw * 2.2, neckW = bw * 0.36, neckH = bw * 0.38;
    var cx = x + w / 2, by = yBot - 22, bx = cx - bw / 2, topY = by - bh;
    // balloon (drawn first so the neck covers its mouth)
    var cmPx = bw / 7, rB = Math.cbrt(3 * Math.max(b.V, 0) / (4 * Math.PI)) * cmPx;
    var rMin = neckW * 0.6, neckTop = topY - neckH;
    var room = neckTop - (yTop + 6);
    var r = Math.max(rMin, Math.min(rB, room / 2.1, w / 2 - 4));
    var bc = color, bcy = neckTop - r * 1.05;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - neckW * 0.42, neckTop + 4);
    ctx.quadraticCurveTo(cx - r * 1.05, bcy + r * 0.4, cx - r, bcy);
    ctx.arc(cx, bcy, r, Math.PI, 0);
    ctx.quadraticCurveTo(cx + r * 1.05, bcy + r * 0.4, cx + neckW * 0.42, neckTop + 4);
    ctx.closePath();
    var gr = ctx.createRadialGradient(cx - r * 0.35, bcy - r * 0.4, r * 0.1, cx, bcy, r * 1.2);
    gr.addColorStop(0, D.alpha('#ffffff', 0.55)); gr.addColorStop(0.25, D.alpha(bc, 0.85)); gr.addColorStop(1, D.alpha(bc, 0.95));
    ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = D.alpha(c.ink, 0.4); ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    // bottle glass
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - neckW / 2, neckTop); ctx.lineTo(cx - neckW / 2, topY);
    ctx.quadraticCurveTo(bx, topY, bx, topY + bw * 0.4); ctx.lineTo(bx, by - 8); ctx.quadraticCurveTo(bx, by, bx + 8, by);
    ctx.lineTo(bx + bw - 8, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by - 8); ctx.lineTo(bx + bw, topY + bw * 0.4);
    ctx.quadraticCurveTo(bx + bw, topY, cx + neckW / 2, topY); ctx.lineTo(cx + neckW / 2, neckTop);
    ctx.fillStyle = D.alpha(c.ink, 0.05); ctx.fill();
    ctx.save(); ctx.clip();
    // liquid: cloudy when yeast is in it, foam on top while gas is made
    var ly = topY + bw * 0.55, cloudy = b.N0 > 0 ? (b.dead ? 0.28 : 0.42) : 0.18;
    ctx.fillStyle = b.N0 > 0 ? D.alpha('#d6a85b', cloudy) : D.alpha('#7cc4ff', 0.25); ctx.fillRect(bx - 2, ly, bw + 4, by - ly + 2);
    var foam = Math.min(bw * 0.35, b.rate * 1.6);
    if (foam > 1) { ctx.fillStyle = D.alpha('#f5e6c8', 0.85); ctx.fillRect(bx - 2, ly - foam, bw + 4, foam); }
    // bubbles
    b.bub.forEach(function (q) { D.circle(ctx, bx + q.x * bw, by - q.y * (by - ly), q.r, null, D.alpha('#ffffff', 0.85), 1.2); });
    // settled yeast / dead yeast at the bottom
    if (b.N0 > 0) { ctx.fillStyle = D.alpha(b.dead ? '#8a8a8a' : '#b07b2c', 0.7); ctx.fillRect(bx - 2, by - 4, bw + 4, 6); }
    ctx.restore();
    ctx.strokeStyle = D.alpha(c.ink, 0.6); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    // steam for hot water
    if (b.T >= 50) for (var i = 0; i < 3; i++) {
      var sx = cx - bw * 0.25 + i * bw * 0.25, ph = (now / 900 + i * 0.33) % 1;
      ctx.save(); ctx.globalAlpha = 0.5 * (1 - ph); ctx.strokeStyle = c.muted; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(sx, topY + bw * 0.5 - ph * 8); ctx.quadraticCurveTo(sx + 5, topY + bw * 0.3 - ph * 8, sx, topY + bw * 0.15 - ph * 8); ctx.stroke(); ctx.restore();
    }
    // labels
    D.text(ctx, label, cx, by + 12, { color: c.text, size: fs, weight: 700, align: 'center' });
    var tag = (b.N0 > 0 ? b.N0 + ' tsp yeast' : 'no yeast') + ' · ' + (b.s0 > 0 ? Math.round(b.s0) + ' g sugar' : 'no sugar') + ' · ' + b.T + ' °C';
    return { tag: tag, cx: cx, by: by, bw: bw, ly: ly };
  }

  SimLab.createSim({
    ariaLabel: 'Two bottles of sugar water with yeast and balloons on their necks; the yeast ferments the sugar and the balloons fill with carbon dioxide, with a microscope view of yeast cells budding',
    playLabel: 'Start the experiment',
    mobileAspect: '3 / 3.2',
    params: [
      { id: 'temp', label: 'Water temperature', min: 5, max: 70, step: 1, value: 32, unit: '°C', presets: [10, 25, 35, 60] },
      { id: 'sugar', label: 'Sugar', min: 0, max: 4, step: 0.5, value: 2, unit: 'spoons', help: '1 spoon ≈ 5 g.' },
      { id: 'yeast', label: 'Dry yeast', min: 0, max: 2, step: 0.5, value: 1, unit: 'tsp' },
      { id: 'compare', label: 'Comparison bottle: change one thing', type: 'select', value: 'noyeast', options: [
        { value: 'noyeast', label: 'Same, but no yeast' },
        { value: 'nosugar', label: 'Same, but no sugar' },
        { value: 'cold', label: 'Same, but cold water (10 °C)' },
        { value: 'hot', label: 'Same, but hot water (60 °C)' }] }
    ],
    readouts: [
      { id: 'time', label: 'Time' },
      { id: 'v1', label: 'Gas in your balloon', short: 'Your balloon', unit: 'mL', digits: 0, key: true },
      { id: 'v2', label: 'Gas in the comparison balloon', short: 'Comparison', unit: 'mL', digits: 0, key: true },
      { id: 'sugar', label: 'Sugar left (yours)', short: 'Sugar left', unit: 'g', digits: 1, key: true },
      { id: 'yeast', label: 'Yeast cells (× start)', digits: 1 },
      { id: 'rate', label: 'Gas rate (yours)', unit: 'mL/min', digits: 1 }
    ],
    graph: { title: 'Carbon dioxide collected', xLabel: 'time (min)', yLabel: 'CO₂ (mL)', series: [{ label: 'Your bottle' }, { label: 'Comparison' }], xMax: END },

    reset: function (sim) {
      sim.state = { b: makeBottles(sim.p), min: 0, lastPush: 0 };
      seedCells(sim);
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [0, 0]); }
    },
    update: function (sim, dt) {
      var st = sim.state, dm = dt * MIN_PER_S;
      if (st.min >= END) return;
      st.min += dm;
      st.b.forEach(function (b) {
        step(b, dm);
        // bubbles: spawn with the gas rate, rise and pop at the surface
        b.acc += b.rate * dm * 0.6;
        while (b.acc > 1 && b.bub.length < 40) { b.acc -= 1; b.bub.push({ x: 0.1 + Math.random() * 0.8, y: Math.random() * 0.15, r: 1.5 + Math.random() * 2.2, v: 0.5 + Math.random() * 0.6 }); }
        if (b.acc > 1) b.acc = 1;
        b.bub.forEach(function (q) { q.y += q.v * dt * 1.2; q.x += (Math.random() - 0.5) * 0.004; });
        b.bub = b.bub.filter(function (q) { return q.y < 1; });
      });
      // microscope: buds grow as fast as the yeast doubles
      var y = st.b[0], f = y.dead ? 0 : fT(y.T) * y.s / (y.s + 1.5) * (1 - y.N / (5 * Math.max(y.N0, 0.01)));
      st.cells.forEach(function (cl) {
        cl.ph += dm * f / 100;
        if (cl.ph >= 1) {
          cl.ph -= 1;
          if (st.cells.length < 70) { var a = cl.a + (st.rnd() - 0.5) * 1.2; st.cells.push({ x: cl.x + Math.cos(a) * 0.12, y: cl.y + Math.sin(a) * 0.12, a: st.rnd() * Math.PI, ph: 0 }); }
        }
      });
      st.cells.forEach(function (cl) { var d = Math.hypot(cl.x, cl.y); if (d > 0.85) { cl.x *= 0.85 / d; cl.y *= 0.85 / d; } });
      if (sim.graph && st.min - st.lastPush >= 2) { st.lastPush = st.min; sim.graph.push(st.min, [st.b[0].V, st.b[1].V]); }
    },
    finished: function (sim) { return sim.state.min >= END; },
    readout: function (sim) {
      var st = sim.state, a = st.b[0];
      return { time: hm(st.min), v1: st.b[0].V, v2: st.b[1].V, sugar: a.s, yeast: a.N0 > 0 ? a.N / a.N0 : '—', rate: a.rate };
    },
    status: function (sim) {
      var st = sim.state, a = st.b[0];
      if (a.dead) return 'At ' + a.T + ' °C the yeast is killed: no gas';
      if (a.N0 === 0) return 'No yeast: nothing ferments the sugar';
      if (a.s0 === 0) return 'No sugar: the yeast has nothing to ferment';
      if (st.min >= END) return '4 hours: your balloon holds ' + Math.round(a.V) + ' mL of CO₂';
      return st.min > 0 ? 'Fermenting… ' + hm(st.min) : 'Press Start to add the yeast';
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, st = sim.state, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 10.5 : 12.5;
      D.clear(ctx, W, H, c.bg);
      now = now || performance.now();
      var top = narrow ? 34 : 42, scopeW = Math.min(W * (narrow ? 0.36 : 0.32), H * 0.62), bw = W - scopeW - 16;
      // table
      D.line(ctx, 8, H - 30, 8 + bw, H - 30, D.alpha(c.ink, 0.3), 2);
      var colYours = c.s2, colCmp = c.s1;
      var r1 = drawBottle(ctx, c, st.b[0], 8, bw / 2, top, H - 8, 'Your bottle', colYours, now, fs);
      var r2 = drawBottle(ctx, c, st.b[1], 8 + bw / 2, bw / 2, top, H - 8, CMP[p.compare] ? CMP[p.compare].label : 'Comparison', colCmp, now, fs);
      // volumes on the balloons' side
      [[r1, st.b[0]], [r2, st.b[1]]].forEach(function (q) {
        D.text(ctx, Math.round(q[1].V) + ' mL', q[0].cx, q[0].by - q[0].bw * 1.2, { color: c.ink, size: fs + 1, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.75), pad: 2 });
        D.text(ctx, q[1].T + ' °C', q[0].cx, q[0].by - q[0].bw * 0.6, { color: q[1].T >= 50 ? c.danger : q[1].T < 18 ? c.s1 : c.muted, size: fs, weight: 600, align: 'center' });
      });

      // microscope view of your bottle
      var sr = scopeW / 2 - 6, scx = W - scopeW / 2 - 4, scy = top + (H - top) * 0.46;
      D.circle(ctx, scx, scy, sr + 4, c.surface2, D.alpha(c.ink, 0.5), 3);
      ctx.save(); ctx.beginPath(); ctx.arc(scx, scy, sr, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = c.light ? '#fdf6e3' : '#2b2416'; ctx.fillRect(scx - sr, scy - sr, sr * 2, sr * 2);
      var a = st.b[0], dead = a.dead, cr = sr * 0.075;
      st.cells.forEach(function (cl) {
        var x = scx + cl.x * sr, y = scy + cl.y * sr;
        ctx.save(); ctx.translate(x, y); ctx.rotate(cl.a);
        ctx.beginPath(); ctx.ellipse(0, 0, cr * 1.25, cr, 0, 0, Math.PI * 2);
        ctx.fillStyle = dead ? '#9a9a9a' : '#e8b65a'; ctx.fill(); ctx.strokeStyle = dead ? '#666' : '#8a5a12'; ctx.lineWidth = 1.2; ctx.stroke();
        if (!dead) { D.circle(ctx, -cr * 0.2, 0, cr * 0.35, '#c98d2e'); }
        if (!dead && cl.ph > 0.15) {
          var br = cr * 0.85 * Math.min(1, cl.ph);
          ctx.beginPath(); ctx.ellipse(cr * 1.25 + br * 0.8, 0, br * 1.1, br, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#f0c879'; ctx.fill(); ctx.strokeStyle = '#8a5a12'; ctx.stroke();
        }
        ctx.restore();
      });
      // tiny CO₂ bubbles in the view
      if (a.rate > 0.05) {
        var nb = Math.min(14, Math.round(a.rate * 1.5));
        for (var i = 0; i < nb; i++) {
          var ph = ((now / 2600) + i * 0.137) % 1, bx = scx + (((i * 37) % 100) / 50 - 1) * sr * 0.8, by = scy + sr - ph * sr * 2;
          D.circle(ctx, bx, by, 2 + (i % 3), null, D.alpha(c.light ? '#3b82f6' : '#bfe3ff', 0.8), 1.2);
        }
      }
      ctx.restore();
      D.text(ctx, 'Your bottle under a microscope', scx, scy - sr - 14, { color: c.muted, size: fs - 0.5, align: 'center', fit: W });
      var cap = dead ? 'Killed by heat: no budding' : a.N0 === 0 ? 'No yeast cells' : a.rate > 0.3 ? 'Yeast cells budding' : st.min > 0 ? 'Yeast resting' : 'Yeast waiting';
      D.text(ctx, cap, scx, scy + sr + 16, { color: dead ? c.danger : c.text, size: fs, weight: 700, align: 'center', fit: W });
      if (a.N0 > 0 && !narrow) D.text(ctx, 'each cell about 0.005 mm', scx, scy + sr + 34, { color: c.muted, size: fs - 1, align: 'center', fit: W });

      // headline
      var hl = '';
      if (st.min <= 0) hl = 'Sugar + yeast in warm water, a balloon on each bottle';
      else hl = hm(st.min) + ': sugar → alcohol + carbon dioxide';
      var hs = narrow ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, narrow ? 14 : 18, { color: c.bg, bg: c.accent, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
