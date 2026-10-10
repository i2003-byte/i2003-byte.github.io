/* =====================================================================
   Nutrition in plants · Oxygen Bubbles from a Water Plant — sim.js
   ---------------------------------------------------------------------
   Hydrilla under a funnel in a beaker of water; an inverted test tube
   collects the oxygen it gives out. A lamp (LED, so the water does not
   warm up) stands d cm away.
     light intensity  I = (25 / d)²          (inverse square, 1 at 25 cm)
     useful light     E = I × colour factor  (white 1, red 0.75,
                                              blue 0.65, green 0.2)
     light-limited    R_L = 80 E / (E + 0.7)  bubbles per minute
     CO₂-limited      R_C = 35 (tap water), 75 (with baking soda)
     rate R = min(R_L, R_C)   (the factor in shortest supply)
   Bubbles leave the cut stems one by one, every 60/R s (±10 %). The
   measured rate uses the time between the last few bubbles, as you
   would with a stopwatch. Each bubble adds 0.025 mL of gas.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var COL = { white: { f: 1, c: '#fde68a', name: 'white' }, red: { f: 0.75, c: '#f87171', name: 'red' },
    blue: { f: 0.65, c: '#60a5fa', name: 'blue' }, green: { f: 0.2, c: '#4ade80', name: 'green' } };
  var BV = 0.025, CAP = 10;
  var points = [];

  function model(p) {
    var I = Math.pow(25 / p.d, 2), E = I * (COL[p.col] || COL.white).f;
    var RL = 80 * E / (E + 0.7), RC = p.soda ? 75 : 35;
    return { I: I, E: E, R: Math.min(RL, RC), lim: RL <= RC ? 'light' : 'carbon dioxide' };
  }
  function measured(s) {
    var b = s.times; if (b.length < 3) return null;
    var k = Math.min(b.length - 1, 6), dt = (b[b.length - 1] - b[b.length - 1 - k]) / k;
    return 60 / dt;
  }
  function geo(W, H) {
    var nar = W < 560, ground = H - Math.max(34, H * 0.12);
    var bh = Math.min(H * 0.66, ground - 40), bw = Math.min(W * (nar ? 0.36 : 0.26), bh * 0.95);
    var bx = W - bw - (nar ? 10 : W * 0.08), by = ground - bh, px = bx + bw / 2;
    var lampMin = nar ? 44 : 58, near = bx - (nar ? 26 : 34), ppc = (near - lampMin) / 90; // 10 cm at the beaker, 100 cm at the far left
    return { nar: nar, near: near, ground: ground, bx: bx, by: by, bw: bw, bh: bh, px: px, ppc: ppc,
      water: by + bh * 0.1, mouth: ground - bh * 0.1, stem: by + bh * 0.45, tubeTop: by - bh * 0.12, lampY: by + bh * 0.6 };
  }
  function lampX(G, d) { return G.near - (d - 10) * G.ppc - 16; } // the lamp face sits at G.near − (d − 10) ppc

  SimLab.createSim({
    ariaLabel: 'A water plant under a funnel in a beaker gives out oxygen bubbles that collect in a test tube; a lamp can be moved nearer or farther away',
    mobileAspect: '1 / 1',
    playLabel: 'Switch on the lamp',
    params: [
      { id: 'd', label: 'Lamp distance', min: 10, max: 100, step: 5, value: 25, unit: 'cm',
        presets: [{ label: '10 cm', value: 10 }, { label: '25 cm', value: 25 }, { label: '50 cm', value: 50 }, { label: '100 cm', value: 100 }] },
      { id: 'col', label: 'Colour of light (filter)', type: 'select', value: 'white', options: [
        { value: 'white', label: 'White (no filter)' }, { value: 'red', label: 'Red filter' }, { value: 'blue', label: 'Blue filter' }, { value: 'green', label: 'Green filter' }] },
      { id: 'soda', label: 'Add a pinch of baking soda (more CO₂)', type: 'toggle', value: false }
    ],
    buttons: [
      { label: '📍 Record this point on the graph', primary: true, onClick: function (sim) {
        var m = measured(sim.state);
        if (sim.p.col !== 'white') { sim.state.msg = { t: sim.time, text: 'The graph is for white light' }; return; }
        if (m == null) { sim.state.msg = { t: sim.time, text: 'Count a few bubbles first' }; if (!sim.running) sim.play(); return; }
        points = points.filter(function (q) { return q.d !== sim.p.d || q.soda !== sim.p.soda; });
        points.push({ d: sim.p.d, r: m, soda: sim.p.soda });
        replot(sim);
        sim.state.msg = { t: sim.time, text: 'Recorded: ' + sim.p.d + ' cm → ' + Math.round(m) + ' per min' };
      } },
      { label: '🔥 Test the gas with a glowing splint', onClick: function (sim) {
        var s = sim.state;
        if (s.vol < 1) s.msg = { t: sim.time, text: 'Not enough gas yet (collect 1 mL)' };
        else { s.flame = sim.time; s.msg = { t: sim.time, text: 'The splint bursts into flame: oxygen!' }; s.vol = 0; }
      } },
      { label: 'Clear the graph', onClick: function (sim) { points = []; replot(sim); } }
    ],
    readouts: [
      { id: 'm', label: 'Bubbles per minute (counted)', short: 'Bubbles/min', digits: 0, key: true },
      { id: 'I', label: 'Light intensity (1 = lamp at 25 cm)', short: 'Light', digits: 2, key: true },
      { id: 'lim', label: 'Limiting factor', short: 'Limited by' },
      { id: 'n', label: 'Bubbles counted', digits: 0, key: true },
      { id: 'v', label: 'Gas collected', unit: 'mL', digits: 2 }
    ],
    graph: { title: 'Bubbles per minute vs lamp distance (white light, your points)', xLabel: 'lamp distance (cm)', yLabel: 'per min', series: [{ label: 'tap water' }, { label: 'with baking soda' }], window: null, xMax: 100, yMin: 0 },

    reset: function (sim) {
      sim.state = { bubbles: [], times: [], n: 0, vol: 0, next: 0.8, rnd: M.rng(9), msg: null, flame: -9, drag: false };
      replot(sim);
    },
    onParam: function (sim, id) { sim.state.times = []; sim.state.next = Math.min(sim.state.next, sim.time + 60 / model(sim.p).R * 0.6); return true; },
    update: function (sim, dt) {
      var s = sim.state, t = sim.time, R = model(sim.p).R;
      if (t >= s.next) {
        s.times.push(t); if (s.times.length > 12) s.times.shift();
        s.n++;
        s.bubbles.push({ k: Math.floor(s.rnd() * 3), t0: t, r: 3 + s.rnd() * 1.8 });
        s.next = t + 60 / R * (0.9 + 0.2 * s.rnd());
      }
      for (var i = s.bubbles.length - 1; i >= 0; i--) {
        if (t - s.bubbles[i].t0 > 3) { s.bubbles.splice(i, 1); s.vol = Math.min(CAP, s.vol + BV); }
      }
    },
    readout: function (sim) {
      var md = model(sim.p), m = measured(sim.state);
      return { m: m == null ? (sim.time > 0 ? 'counting…' : '—') : m, I: md.I, lim: md.lim, n: sim.state.n, v: sim.state.vol };
    },
    status: function (sim) { return (sim.running ? 'Lamp on' : 'Lamp off') + ' · ' + sim.p.d + ' cm · ' + (COL[sim.p.col] || COL.white).name + ' light'; },
    pointer: {
      down: function (sim, x, y) { var G = geo(sim.width, sim.height), lx = lampX(G, sim.p.d); if (Math.abs(x - lx) < 34 && Math.abs(y - G.lampY) < 40) { sim.state.drag = true; return true; } return false; },
      move: function (sim, x) {
        if (!sim.state.drag) return;
        var G = geo(sim.width, sim.height), d = Math.round((10 + (G.near - 16 - x) / G.ppc) / 5) * 5;
        d = M.clamp(d, 10, 100); if (d !== sim.p.d) sim.setParam('d', d, true);
      },
      up: function (sim) { sim.state.drag = false; },
      hover: function (sim, x, y) { var G = geo(sim.width, sim.height); return Math.abs(x - lampX(G, sim.p.d)) < 34 && Math.abs(y - G.lampY) < 40; }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, t = sim.time;
      var G = geo(W, H), md = model(p), on = sim.running || t > 0, lc = (COL[p.col] || COL.white).c, nar = G.nar;
      D.clear(ctx, W, H, c.bg);
      // table and ruler
      D.line(ctx, 0, G.ground, W, G.ground, c.axis, 2);
      var lx = lampX(G, p.d);
      for (var cm = 10; cm <= 100; cm += 10) {
        var x = lampX(G, cm) + 16;
        D.line(ctx, x, G.ground + 2, x, G.ground + (cm % 50 ? 6 : 10), c.muted, 1);
        if (!nar || cm % 30 === 10) D.text(ctx, String(cm), x, G.ground + 18, { color: c.muted, size: 10, align: 'center', font: c.mono });
      }
      D.text(ctx, nar ? 'cm' : 'cm from plant', lampX(G, 10) + 30, G.ground + 18, { color: c.muted, size: 10, font: c.mono });
      // light cone
      var beamA = on ? M.clamp(0.12 + 0.35 * Math.min(md.I, 1.5), 0.12, 0.55) : 0;
      if (beamA > 0) {
        ctx.save(); ctx.beginPath(); ctx.moveTo(lx + 16, G.lampY - 9); ctx.lineTo(G.px, G.lampY - G.bh * 0.42); ctx.lineTo(G.px, G.lampY + G.bh * 0.32); ctx.lineTo(lx + 16, G.lampY + 9); ctx.closePath();
        var gr = ctx.createLinearGradient(lx, 0, G.px, 0); gr.addColorStop(0, D.alpha(lc, beamA)); gr.addColorStop(1, D.alpha(lc, beamA * 0.35));
        ctx.fillStyle = gr; ctx.fill(); ctx.restore();
      }
      // lamp: stand, arm, head
      D.line(ctx, lx - 10, G.ground, lx + 6, G.ground, c.ink, 5);
      D.line(ctx, lx - 2, G.ground, lx - 2, G.lampY + 4, c.ink, 3);
      ctx.save(); ctx.beginPath(); ctx.moveTo(lx - 12, G.lampY - 12); ctx.lineTo(lx + 8, G.lampY - 15); ctx.lineTo(lx + 16, G.lampY - 9); ctx.lineTo(lx + 16, G.lampY + 9); ctx.lineTo(lx + 8, G.lampY + 15); ctx.lineTo(lx - 12, G.lampY + 12); ctx.closePath();
      ctx.fillStyle = c.surface2 || c.surface; ctx.fill(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      D.circle(ctx, lx + 16, G.lampY, 6, on ? lc : D.alpha(c.muted, 0.5));
      D.text(ctx, '↔ ' + p.d + ' cm', lx + 2, G.lampY - 28, { color: c.ink, size: nar ? 11 : 12.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.7), pad: 3, fit: W });
      // arrow showing distance
      

      // beaker and water
      var bx = G.bx, bw = G.bw;
      ctx.fillStyle = D.alpha('#38bdf8', c.light ? 0.18 : 0.14); ctx.fillRect(bx, G.water, bw, G.ground - G.water);
      D.line(ctx, bx, G.water, bx + bw, G.water, D.alpha('#38bdf8', 0.7), 1.5);
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx, G.by); ctx.lineTo(bx, G.ground); ctx.lineTo(bx + bw, G.ground); ctx.lineTo(bx + bw, G.by); ctx.stroke(); ctx.restore();
      if (p.soda) for (var g = 0; g < 10; g++) D.circle(ctx, bx + bw * (0.1 + 0.08 * g), G.ground - 3, 1.6, c.muted);

      // plant (three sprigs) under the funnel
      var px = G.px, mw = bw * 0.36, tips = [];
      for (var k = 0; k < 3; k++) {
        var sx = px + (k - 1) * mw * 0.45, top = G.stem + (G.mouth - G.stem) * (0.42 + 0.06 * Math.abs(k - 1));
        ctx.save(); ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 2; ctx.beginPath();
        for (var y = G.ground - 4; y >= top; y -= 3) { var xx = sx + Math.sin(y * 0.09 + k) * 3; if (y === G.ground - 4) ctx.moveTo(xx, y); else ctx.lineTo(xx, y); }
        ctx.stroke(); ctx.restore();
        for (y = G.ground - 10; y > top + 4; y -= 9) {
          var xx2 = sx + Math.sin(y * 0.09 + k) * 3;
          D.line(ctx, xx2, y, xx2 - 6, y - 4, '#22c55e', 2); D.line(ctx, xx2, y, xx2 + 6, y - 4, '#22c55e', 2);
        }
        tips.push({ x: sx + Math.sin(top * 0.09 + k) * 3, y: top });
      }
      // funnel (mouth down) and stem
      var fw = bw * 0.42, sw = Math.max(4, bw * 0.035);
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(px - fw, G.mouth); ctx.lineTo(px - sw, G.stem); ctx.lineTo(px - sw, G.stem - G.bh * 0.14);
      ctx.moveTo(px + fw, G.mouth); ctx.lineTo(px + sw, G.stem); ctx.lineTo(px + sw, G.stem - G.bh * 0.14);
      ctx.stroke(); ctx.restore();
      D.line(ctx, px - fw - 4, G.mouth, px - fw - 4, G.ground, c.muted, 2); D.line(ctx, px + fw + 4, G.mouth, px + fw + 4, G.ground, c.muted, 2);
      // test tube: open end down over the stem
      var tw = Math.max(9, bw * 0.08), tb = G.stem - G.bh * 0.08, tt = G.tubeTop;
      var gasH = (tb - tt - tw) * s.vol / CAP;
      ctx.fillStyle = D.alpha('#38bdf8', c.light ? 0.22 : 0.18); ctx.fillRect(px - tw, tt + tw, tw * 2, tb - tt - tw);
      ctx.fillStyle = c.bg; ctx.fillRect(px - tw + 1, tt + tw, tw * 2 - 2, gasH);
      ctx.save(); ctx.beginPath(); ctx.arc(px, tt + tw, tw - 1, Math.PI, 0); ctx.closePath(); ctx.fillStyle = c.bg; ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - tw, tb); ctx.lineTo(px - tw, tt + tw); ctx.arc(px, tt + tw, tw, Math.PI, 0); ctx.lineTo(px + tw, tb); ctx.stroke(); ctx.restore();
      if (s.vol > 0.05) D.text(ctx, 'O₂', px, tt + tw + Math.max(4, gasH * 0.5), { color: c.ink, size: 10, weight: 700, align: 'center' });
      D.text(ctx, M.fmt(s.vol, 1) + ' mL', px + tw + 5, tt + tw + gasH, { color: c.muted, size: 10.5, font: c.mono, fit: W });

      // bubbles rising: up from a cut tip, along the funnel to the stem, up the tube
      var surf = tt + tw + gasH;
      s.bubbles.forEach(function (b) {
        var tip = tips[b.k], u = (t - b.t0) / 3, x, y;
        if (u < 0.55) { var v = u / 0.55; y = tip.y + (G.stem - tip.y) * v; x = tip.x + (px - tip.x) * v * v; }
        else { var v2 = (u - 0.55) / 0.45; y = G.stem + (surf - G.stem) * v2; x = px + Math.sin(v2 * 8 + b.r) * 1.5; }
        D.circle(ctx, x, y, b.r, D.alpha('#e0f2fe', 0.6), c.ink, 1);
      });
      // splint flame
      if (t - s.flame < 2.5) {
        var fx = px, fy = tt - 16;
        D.line(ctx, fx + 30, fy - 20, fx, fy, '#a16207', 3);
        D.circle(ctx, fx, fy, 7 + Math.sin((now || 0) / 60) * 1.5, '#f97316'); D.circle(ctx, fx, fy + 1, 3.5, '#fde047');
      }
      // labels
      var fs = nar ? 10.5 : 12;
      if (!nar) {
        D.text(ctx, 'Hydrilla', bx + bw + 6, (G.mouth + G.ground) / 2 - 6, { color: c.ink, size: fs, weight: 600, fit: W });
        D.text(ctx, 'funnel', px + fw * 0.55 + 10, (G.mouth + G.stem) / 2 - 8, { color: c.muted, size: fs, fit: W });
      }
      D.text(ctx, model(p).R > 0 ? 'Limiting: ' + md.lim : '', 10, 14, { color: c.muted, size: fs, weight: 600, fit: W });
      var m = measured(s);
      D.text(ctx, (m == null ? '—' : Math.round(m)) + ' bubbles/min', 10, 32, { color: c.ink, size: nar ? 14 : 17, weight: 700, font: c.mono, fit: W });
      if (s.msg && t - s.msg.t < 3.5) D.text(ctx, s.msg.text, W / 2, nar ? 52 : 56, { color: c.ink, size: fs, weight: 700, align: 'center', bg: D.alpha(c.warning, 0.3), pad: 5, fit: W });
      if (!sim.running && t === 0) D.text(ctx, 'Drag the lamp', lx + 2, G.lampY + 32, { color: c.muted, size: 10.5, align: 'center', fit: W });
    },
    animate: function (sim) { return sim.time - sim.state.flame < 2.5; }
  });

  function replot(sim) {
    if (!sim.graph) return;
    sim.graph.clear();
    var ser = [false, true].map(function (soda) {
      return points.filter(function (q) { return q.soda === soda; }).sort(function (a, b) { return a.d - b.d; });
    });
    function at(list, d) { // value of one series at distance d (straight lines between its points)
      if (!list.length || d < list[0].d - 0.5 || d > list[list.length - 1].d + 0.5) return NaN;
      for (var i = 0; i < list.length - 1; i++) if (d <= list[i + 1].d) return list[i].r + (list[i + 1].r - list[i].r) * M.clamp((d - list[i].d) / (list[i + 1].d - list[i].d), 0, 1);
      return list[list.length - 1].r;
    }
    var xs = [];
    points.forEach(function (q) { xs.push(q.d - 0.5, q.d + 0.5); });
    xs.sort(function (a, b) { return a - b; }).forEach(function (d) { sim.graph.push(d, [at(ser[0], d), at(ser[1], d)]); });
  }
})();
