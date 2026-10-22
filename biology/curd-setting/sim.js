/* =====================================================================
   Microorganisms · How Milk Becomes Curd — sim.js
   ---------------------------------------------------------------------
   A bowl of 500 mL of warm boiled milk with a spoon of old curd
   (the starter). Lactic acid bacteria (Lactobacillus) in the starter
   eat the milk sugar (lactose) and turn it into lactic acid:
     lactose + water → 4 lactic acid   (C₁₂H₂₂O₁₁ + H₂O → 4 C₃H₆O₃)
   As the acid builds up the pH falls from 6.6; near pH 4.6 the milk
   proteins (casein) stop repelling each other and join into a soft
   net that holds the water: the milk has set into curd (dahi).
   Simple model (time in minutes):
     warmth factor f(T): peak at 40 °C, exp(−((T − 40)/15)²) below,
       1 − ((T − 40)/10)² above (0 from 50 °C); 55 °C or more kills
       the starter
     bacteria N (share of the most the milk can hold), starter 1 tsp
       ≈ 1 % of that: dN/dt = N (1 − N) × ln2/30 min × f × a
     acidity A (% lactic acid, milk 0.15 %): dA/dt = 0.007 % × N × f × a
     acid brake a = (pH − 3.8)/0.8, between 0 and 1
     pH from A by a table: 0.15 % → 6.6, 0.5 % → 5.2, 0.7 % → 4.6,
       1.2 % → 4.0 (about right for cow's milk)
     firmness rises from pH 5.2 to fully set at 4.6; above 1.1 % acid
       the curd tastes sour and whey (watery liquid) starts to separate
   1 s of real time is 12 minutes in the bowl; the run lasts 16 hours.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var MIN_PER_S = 12, END = 16 * 60, FRIDGE = 5;
  var PH = [[0.15, 6.6], [0.3, 6.0], [0.5, 5.2], [0.7, 4.6], [0.9, 4.3], [1.2, 4.0], [1.6, 3.8], [2.2, 3.6]];

  function fT(T) { return T >= 50 ? 0 : T <= 40 ? Math.exp(-Math.pow((T - 40) / 15, 2)) : Math.max(0, 1 - Math.pow((T - 40) / 10, 2)); }
  function phOf(A) {
    for (var i = 1; i < PH.length; i++) if (A <= PH[i][0]) { var a = PH[i - 1], b = PH[i]; return a[1] + (b[1] - a[1]) * (A - a[0]) / (b[0] - a[0]); }
    return 3.6;
  }
  function firm(ph) { return M.clamp((5.2 - ph) / 0.6, 0, 1); }
  function hm(min) { var h = Math.floor(min / 60), m = Math.floor(min % 60); return h + ' h ' + (m < 10 ? '0' : '') + m + ' min'; }
  function curT(sim) { return sim.state.fridge ? FRIDGE : sim.p.temp; }
  function stage(st) {
    if (st.A >= 1.1) return 'Sour, whey separating';
    var g = firm(st.ph);
    return g >= 1 ? 'Set curd' : g > 0.05 ? 'Thickening' : 'Liquid milk';
  }
  function setBtn(i, txt) { var b = document.querySelector('[data-btn="' + i + '"]'); if (b) b.textContent = txt; }

  function seedScope(st) {
    var rnd = M.rng(11), rods = [], cas = [], fat = [];
    while (rods.length < 60) {
      var x = rnd() * 1.7 - 0.85, y = rnd() * 1.7 - 0.85, a = rnd() * Math.PI;
      if (x * x + y * y > 0.62) continue;
      rods.push({ x: x, y: y, a: a });
      // every second rod hangs on to the one before it, so they form short chains
      if (rnd() < 0.6 && rods.length < 60) rods.push({ x: x + Math.cos(a) * 0.13, y: y + Math.sin(a) * 0.13, a: a + (rnd() - 0.5) * 0.4 });
    }
    while (cas.length < 70) { var cx = rnd() * 1.9 - 0.95, cy = rnd() * 1.9 - 0.95; if (cx * cx + cy * cy < 0.88) cas.push({ x: cx, y: cy, ph: rnd() * 6.28, nb: [] }); }
    cas.forEach(function (p, i) {
      var d = cas.map(function (q, j) { return { j: j, d: i === j ? 9 : Math.hypot(p.x - q.x, p.y - q.y) }; }).sort(function (a, b) { return a.d - b.d; });
      p.nb = [d[0].j, d[1].j];
    });
    while (fat.length < 7) { var fx = rnd() * 1.6 - 0.8, fy = rnd() * 1.6 - 0.8; if (fx * fx + fy * fy < 0.6) fat.push({ x: fx, y: fy, r: 0.06 + rnd() * 0.06 }); }
    st.rods = rods; st.cas = cas; st.fat = fat;
  }

  function drawBowl(ctx, c, st, cx, rimY, r, dh, now, fs) {
    var g = firm(st.ph), a = st.tilt, lev = dh * 0.2;
    var milk = c.light ? '#fbfaf5' : '#f4f1e8', curd = '#efe5c8';
    ctx.save(); ctx.translate(cx, rimY); ctx.rotate(a);
    // contents: a liquid surface stays level, a set curd tilts with the bowl
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, 0, r, dh, 0, 0, Math.PI); ctx.closePath(); ctx.clip();
    var surf = -a * (1 - g);
    ctx.save(); ctx.translate(0, lev); ctx.rotate(surf);
    ctx.fillStyle = g > 0 ? 'rgb(' + [244, 241, 232].map(function (v, i) { return Math.round(v + ([239, 229, 200][i] - v) * g); }).join(',') + ')' : milk;
    if (c.light && g === 0) ctx.fillStyle = milk;
    ctx.fillRect(-3 * r, 0, 6 * r, 3 * dh);
    if (g > 0.6) { // glossy set top with a few cracks
      ctx.strokeStyle = D.alpha('#b8a77a', 0.5 * g); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-r * 0.4, 3); ctx.quadraticCurveTo(-r * 0.2, 7, 0, 4); ctx.moveTo(r * 0.15, 6); ctx.quadraticCurveTo(r * 0.3, 2, r * 0.5, 5); ctx.stroke();
    }
    ctx.restore();
    // whey: a yellow-green liquid that stays level
    if (st.A > 1.1) {
      var wt = Math.min(dh * 0.12, (st.A - 1.1) * dh * 0.25 + 2);
      ctx.save(); ctx.translate(0, lev); ctx.rotate(-a);
      ctx.fillStyle = D.alpha('#c9d67a', 0.85); ctx.fillRect(-3 * r, -wt * 0.4, 6 * r, wt);
      ctx.restore();
    }
    ctx.restore();
    // the bowl (steel katori look)
    ctx.beginPath(); ctx.ellipse(0, 0, r, dh, 0, 0, Math.PI);
    ctx.strokeStyle = c.light ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, r, dh * 0.12, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = D.alpha(c.ink, 0.35); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    // spill drips when liquid and tipped
    if (a > 0.25 && g < 0.6) {
      var lx = cx + Math.cos(a) * r, ly = rimY + Math.sin(a) * r;
      for (var i = 0; i < 3; i++) {
        var ph = ((now / 700) + i / 3) % 1;
        D.circle(ctx, lx + 2, ly + 4 + ph * dh * 0.9, 3 - ph, D.alpha(milk, 1 - ph * 0.7), D.alpha(c.ink, 0.3), 1);
      }
      D.text(ctx, 'Runny: it pours!', lx - 4, ly - 14, { color: c.danger, size: fs, weight: 700, align: 'right' });
    } else if (a > 0.25) {
      D.text(ctx, 'Set: it stays in the bowl', cx, rimY - dh * 0.32 - 8, { color: c.success, size: fs, weight: 700, align: 'center' });
    }
  }

  SimLab.createSim({
    ariaLabel: 'A bowl of warm milk with a spoon of curd added; lactic acid bacteria multiply, the pH falls and the milk sets into curd, with a microscope view of rod-shaped bacteria and milk protein joining into a net',
    playLabel: 'Leave it to set',
    mobileAspect: '3 / 3.2',
    params: [
      { id: 'temp', label: 'Where the bowl is kept', min: 5, max: 65, step: 1, value: 30, unit: '°C', presets: [5, 20, 30, 40, 60], help: '5 °C fridge · 20 °C winter kitchen · 30 °C summer kitchen · 40 °C warm casserole · 60 °C milk still hot.' },
      { id: 'starter', label: 'Old curd added (starter)', min: 0, max: 3, step: 0.5, value: 1, unit: 'tsp', help: 'In 500 mL of boiled milk.' }
    ],
    readouts: [
      { id: 'time', label: 'Time' },
      { id: 'ph', label: 'pH of the milk', short: 'pH', digits: 2, key: true },
      { id: 'stage', label: 'State', key: true },
      { id: 'bact', label: 'Bacteria (× start)', short: 'Bacteria', digits: 0, key: true },
      { id: 'acid', label: 'Lactic acid', unit: '%', digits: 2 },
      { id: 'temp', label: 'Bowl temperature', unit: '°C', digits: 0 }
    ],
    graph: { title: 'pH of the milk', xLabel: 'time (hours)', yLabel: 'pH', series: [{ label: 'pH' }], xMax: 16, yMin: 3.5, yMax: 7 },
    buttons: [
      { label: 'Tilt the bowl', onClick: function (sim) { sim.state.tiltTo = sim.state.tiltTo ? 0 : 0.6; setBtn(0, sim.state.tiltTo ? 'Stand the bowl up' : 'Tilt the bowl'); } },
      { label: 'Put it in the fridge', onClick: function (sim) { sim.state.fridge = !sim.state.fridge; setBtn(1, sim.state.fridge ? 'Take it out of the fridge' : 'Put it in the fridge'); } }
    ],
    animate: function (sim) { return Math.abs(sim.state.tilt - sim.state.tiltTo) > 0.002 || sim.state.tilt > 0.25; },

    reset: function (sim) {
      var st = sim.state = { min: 0, N: sim.p.starter * 0.01, N0: sim.p.starter * 0.01, A: 0.15, ph: 6.6, dead: sim.p.temp >= 55, setAt: null, sourAt: null, tilt: 0, tiltTo: 0, fridge: false, lastPush: 0 };
      seedScope(st);
      setBtn(0, 'Tilt the bowl'); setBtn(1, 'Put it in the fridge');
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [6.6]); }
    },
    update: function (sim, dt) {
      var st = sim.state, dm = dt * MIN_PER_S;
      if (st.min >= END) return;
      st.min += dm;
      if (!st.dead && st.N > 0) {
        var f = fT(curT(sim)), brake = M.clamp((st.ph - 3.8) / 0.8, 0, 1);
        st.N += st.N * (1 - st.N) * Math.LN2 / 30 * f * brake * dm;
        st.A += 0.007 * st.N * f * brake * dm;
        st.ph = phOf(st.A);
      }
      if (st.setAt == null && st.ph <= 4.6) st.setAt = st.min;
      if (st.sourAt == null && st.A >= 1.1) st.sourAt = st.min;
      if (sim.graph && st.min - st.lastPush >= 4) { st.lastPush = st.min; sim.graph.push(st.min / 60, [st.ph]); }
    },
    finished: function (sim) { return sim.state.min >= END; },
    readout: function (sim) {
      var st = sim.state;
      return { time: hm(st.min), ph: st.ph, stage: stage(st), bact: st.N0 > 0 && !st.dead ? st.N / st.N0 : st.N0 > 0 ? 'killed' : 'none', acid: st.A, temp: curT(sim) };
    },
    status: function (sim) {
      var st = sim.state;
      if (st.dead) return 'Milk at ' + sim.p.temp + ' °C kills the starter bacteria: it will not set';
      if (st.N0 === 0) return 'No starter: there are no curd bacteria to make acid';
      if (st.fridge) return 'In the fridge (5 °C): the bacteria almost stop';
      if (st.sourAt != null) return 'Sour: set at ' + hm(st.setAt) + ', too sour from ' + hm(st.sourAt);
      if (st.setAt != null) return 'Set at ' + hm(st.setAt) + '. Put it in the fridge before it turns sour';
      if (st.min >= END) return '16 hours and still not set: too cold for the bacteria';
      return st.min > 0 ? 'Bacteria at work… ' + hm(st.min) : 'Warm milk + a spoon of curd. Press Leave it to set';
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, c = sim.colors, st = sim.state, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 10.5 : 12.5;
      now = now || performance.now();
      st.tilt += (st.tiltTo - st.tilt) * 0.12; if (Math.abs(st.tilt - st.tiltTo) < 0.002) st.tilt = st.tiltTo;
      D.clear(ctx, W, H, c.bg);
      var top = narrow ? 34 : 42, scopeW = Math.min(W * (narrow ? 0.4 : 0.36), (H - top) * 0.8), lw = W - scopeW - 12;
      // --- bowl + pH bar on the left
      var barH = narrow ? 42 : 54, r = Math.min(lw * 0.36, (H - top - barH - 30) * 0.62), dh = r * 0.75;
      var bcx = 8 + lw / 2, rimY = top + 14 + (H - top - barH - 30 - dh) * 0.45;
      D.line(ctx, bcx - r * 1.3, rimY + dh + 3, bcx + r * 1.3, rimY + dh + 3, D.alpha(c.ink, 0.3), 2);
      drawBowl(ctx, c, st, bcx, rimY, r, dh, now, fs);
      var T = curT(sim);
      D.text(ctx, (st.fridge ? '❄ fridge ' : '') + T + ' °C', bcx, rimY + dh + 16, { color: T >= 55 ? c.danger : T < 20 ? c.s1 : c.muted, size: fs, weight: 600, align: 'center' });
      // pH bar from 7 (left) to 3.5 (right)
      var bx0 = 18, bx1 = lw - 6, by = H - barH + (narrow ? 10 : 14), bh = narrow ? 10 : 12;
      function px(ph) { return bx0 + (7 - ph) / 3.5 * (bx1 - bx0); }
      var gr = ctx.createLinearGradient(bx0, 0, bx1, 0);
      gr.addColorStop(0, '#22c55e'); gr.addColorStop(0.45, '#eab308'); gr.addColorStop(1, '#ef4444');
      D.roundRect(ctx, bx0, by, bx1 - bx0, bh, 4, gr);
      // "sets" ends at its tick and "sour" starts at its tick, so they never overlap
      [[6.6, 'milk', 'center'], [4.6, 'sets', 'right'], [4.0, 'sour', 'left']].forEach(function (m) {
        var x = px(m[0]);
        D.line(ctx, x, by - 2, x, by + bh + 2, D.alpha(c.ink, 0.7), 1.5);
        D.text(ctx, m[1] + ' ' + m[0].toFixed(1), x + (m[2] === 'right' ? -3 : m[2] === 'left' ? 3 : 0), by + bh + 10, { color: c.muted, size: fs - 1.5, align: m[2] });
      });
      var mx = px(M.clamp(st.ph, 3.5, 7));
      ctx.beginPath(); ctx.moveTo(mx, by - 1); ctx.lineTo(mx - 6, by - 10); ctx.lineTo(mx + 6, by - 10); ctx.closePath(); ctx.fillStyle = c.ink; ctx.fill();
      D.text(ctx, 'pH ' + st.ph.toFixed(2), mx, by - 18, { color: c.ink, size: fs, weight: 700, align: 'center', fit: lw });

      // --- microscope on the right
      var sr = scopeW / 2 - 6, scx = W - scopeW / 2 - 4, scy = top + 12 + sr;
      if (scy + sr + 30 > H) { sr = (H - top - 46) / 2; scy = top + 12 + sr; }
      D.circle(ctx, scx, scy, sr + 4, c.surface2, D.alpha(c.ink, 0.5), 3);
      ctx.save(); ctx.beginPath(); ctx.arc(scx, scy, sr, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = c.light ? '#eef2f7' : '#dfe6ef'; ctx.fillRect(scx - sr, scy - sr, sr * 2, sr * 2);
      var g = firm(st.ph), jig = (1 - g) * sr * 0.025, t = now / 600;
      function cp(p) { return [scx + p.x * sr + Math.sin(t + p.ph) * jig, scy + p.y * sr + Math.cos(t * 1.3 + p.ph) * jig]; }
      st.fat.forEach(function (f) { D.circle(ctx, scx + f.x * sr, scy + f.y * sr, f.r * sr, D.alpha('#fff8e1', 0.9), D.alpha('#b45309', 0.35), 1); });
      if (g > 0) {
        ctx.strokeStyle = D.alpha('#64748b', 0.75 * g); ctx.lineWidth = 1.6; ctx.beginPath();
        st.cas.forEach(function (p) { var a = cp(p); p.nb.forEach(function (j) { var b = cp(st.cas[j]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }); });
        ctx.stroke();
      }
      st.cas.forEach(function (p) { var a = cp(p); D.circle(ctx, a[0], a[1], Math.max(1.6, sr * 0.022), '#94a3b8'); });
      var n = st.N0 > 0 ? Math.min(60, Math.round(3 + 57 * st.N)) : 0, rl = sr * 0.055;
      for (var i = 0; i < n; i++) {
        var q = st.rods[i], x = scx + q.x * sr, y = scy + q.y * sr;
        ctx.save(); ctx.translate(x, y); ctx.rotate(q.a);
        D.roundRect(ctx, -rl, -rl * 0.32, rl * 2, rl * 0.64, rl * 0.32, st.dead ? '#9ca3af' : '#7c3aed', st.dead ? '#6b7280' : '#4c1d95', 1);
        ctx.restore();
      }
      ctx.restore();
      D.text(ctx, 'Milk under a microscope', scx, scy - sr - 12, { color: c.muted, size: fs - 0.5, align: 'center', fit: W });
      var cap = st.dead ? 'Bacteria killed by heat' : st.N0 === 0 ? 'No curd bacteria' : g >= 1 ? 'Protein net holds the water' : g > 0.05 ? 'Protein starts to join up' : 'Bacteria multiplying';
      D.text(ctx, cap, scx, scy + sr + 15, { color: st.dead ? c.danger : c.text, size: fs, weight: 700, align: 'center', fit: W });
      if (!narrow && scy + sr + 48 < H) {
        D.roundRect(ctx, scx - 70, scy + sr + 30, 9, 4, 2, '#7c3aed');
        D.text(ctx, 'bacteria', scx - 56, scy + sr + 32, { color: c.muted, size: fs - 1.5 });
        D.circle(ctx, scx + 8, scy + sr + 32, 2.5, '#94a3b8');
        D.text(ctx, 'milk protein', scx + 15, scy + sr + 32, { color: c.muted, size: fs - 1.5 });
      }

      // headline
      var hl = st.min <= 0 ? 'Warm milk + 1 spoon of curd: bacteria turn milk sugar into lactic acid' : hm(st.min) + ': ' + stage(st).toLowerCase() + ', pH ' + st.ph.toFixed(1);
      if (st.min <= 0 && sim.p.starter !== 1) hl = hl.replace('1 spoon', sim.p.starter + ' tsp');
      var hs = narrow ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, narrow ? 14 : 18, { color: c.bg, bg: c.accent, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
