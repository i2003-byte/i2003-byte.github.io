/* =====================================================================
   Nutrition in plants · Photosynthesis in a Leaf — sim.js
   ---------------------------------------------------------------------
   A cross-section of a leaf: upper epidermis, palisade cells full of
   chloroplasts, spongy cells with air spaces, a vein (xylem brings
   water, phloem carries sugar away) and a stoma in the lower skin.
     carbon dioxide + water → (light, chlorophyll) → glucose + oxygen
     6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂
   Rate model (relative, 0–100 %), the factor in shortest supply wins
   (Blackman's "limiting factor" idea):
     light   fL = (1 − e^(−L/30)) / (1 − e^(−100/30))   (0 at night, 1 in full sun)
     CO₂     fC = 0.35 (low), 0.7 (normal air 0.04 %), 1 (CO₂-rich)
             × 0.3 when the soil is dry (guard cells close the stomata)
     chlorophyll: none → rate 0
   One "reaction" in a chloroplast takes 6 CO₂ (through the stoma) and
   6 H₂O (from the xylem) and gives 1 glucose (to the phloem) and 6 O₂
   (out through the stoma). Each dot stands for a huge number of
   molecules; counters stay in the exact 6 : 6 : 1 : 6 ratio.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var EV_MAX = 0.75; // reactions per second shown at 100 % rate
  var CO2F = { low: 0.35, air: 0.7, rich: 1 };

  function factors(p) {
    var fL = (1 - Math.exp(-p.light / 30)) / (1 - Math.exp(-100 / 30));
    var fC = (CO2F[p.co2] || 0.7) * (p.water ? 1 : 0.3);
    var fCh = p.chl ? 1 : 0;
    var rate = Math.min(fL, fC) * fCh, lim;
    if (!p.chl) lim = 'no chlorophyll';
    else if (p.light === 0) lim = 'no light (night)';
    else if (fL <= fC) lim = 'light';
    else lim = p.water ? 'carbon dioxide' : 'CO₂ (stomata closed)';
    return { fL: fL, fC: fC, rate: rate, lim: lim };
  }

  // layout in pixels, rebuilt when the canvas size changes
  function layout(W, H) {
    var narrow = W < 560, top = Math.max(46, H * 0.15), bot = Math.max(40, H * 0.13);
    var y0 = top, y1 = H - bot, sh = y1 - y0;
    var L = { W: W, H: H, narrow: narrow, top: top, y0: y0, y1: y1,
      ue: y0 + sh * 0.07, pal: y0 + sh * 0.43, le: y1 - sh * 0.07,
      sx: W * (narrow ? 0.36 : 0.4), vx: W * 0.76 };
    L.vy = (L.pal + L.le) / 2; L.vr = Math.min((L.le - L.pal) * 0.36, 44, W * 0.11);
    var rnd = M.rng(5), chl = [], pals = [], sp = [];
    var lx = narrow ? 8 : 12, rx = W - lx, n = Math.max(7, Math.round((rx - lx) / (narrow ? 30 : 38))), cw = (rx - lx) / n;
    for (var i = 0; i < n; i++) {
      var x = lx + i * cw, c = { x: x + 1.5, y: L.ue + 2, w: cw - 3, h: L.pal - L.ue - 4 };
      pals.push(c);
      for (var k = 0; k < 5; k++) chl.push({ x: c.x + (k % 2 ? c.w - 6 : 6), y: c.y + c.h * (0.14 + 0.18 * k), pal: true });
    }
    var tries = 0;
    while (sp.length < 40 && tries++ < 600) {
      var r = (L.le - L.pal) * (0.12 + rnd() * 0.07), cx = lx + r + rnd() * (rx - lx - 2 * r), cy = L.pal + r + 2 + rnd() * (L.le - L.pal - 2 * r - 4);
      if (Math.hypot(cx - L.vx, cy - L.vy) < L.vr + r + 4) continue;
      if (Math.abs(cx - L.sx) < r + 14 && cy > L.le - (L.le - L.pal) * 0.55) continue; // air space above the stoma
      var ok = sp.every(function (o) { return Math.hypot(o.x - cx, o.y - cy) > o.r + r - 2; });
      if (ok) { sp.push({ x: cx, y: cy, r: r }); chl.push({ x: cx + r * 0.4, y: cy - r * 0.3, pal: false }); }
    }
    L.pals = pals; L.sp = sp; L.chl = chl;
    L.stomaTop = { x: L.sx, y: L.le - 4 }; L.below = { x: L.sx, y: y1 + bot * 0.6 };
    L.xylem = { x: L.vx, y: L.vy - L.vr * 0.4 }; L.phloem = { x: L.vx, y: L.vy + L.vr * 0.45 };
    return L;
  }
  function getL(sim) {
    var s = sim.state;
    if (!s.L || s.L.W !== sim.width || s.L.H !== sim.height) s.L = layout(sim.width, sim.height);
    return s.L;
  }
  function pt(L, key, q) {
    if (key === 'chl') return L.chl[q.ci % L.chl.length];
    if (key === 'below') return { x: L.below.x + q.spread * L.W * 0.12, y: L.below.y };
    return L[key];
  }
  function lerpPath(L, q, f) {
    var pts = q.path.map(function (k) { return pt(L, k, q); });
    var seg = f * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(seg)), u = seg - i;
    var a = pts[i], b = pts[i + 1];
    var wob = Math.sin(q.seed * 10 + f * 9) * 4 * Math.sin(Math.PI * u);
    return { x: a.x + (b.x - a.x) * u + wob, y: a.y + (b.y - a.y) * u };
  }

  SimLab.createSim({
    ariaLabel: 'Cross-section of a leaf: carbon dioxide enters through a stoma, water arrives through the vein, sunlight falls on the chloroplasts, and glucose and oxygen are made',
    mobileAspect: '4 / 5',
    playLabel: 'Start photosynthesis',
    params: [
      { id: 'light', label: 'Sunlight', min: 0, max: 100, step: 5, value: 80, unit: '%',
        presets: [{ label: 'Night', value: 0 }, { label: 'Cloudy', value: 25 }, { label: 'Full sun', value: 100 }] },
      { id: 'co2', label: 'Carbon dioxide in the air', type: 'select', value: 'air', options: [
        { value: 'low', label: 'Low (closed glass box)' }, { value: 'air', label: 'Normal air (0.04 %)' }, { value: 'rich', label: 'CO₂-rich (greenhouse)' }] },
      { id: 'water', label: 'Soil is watered (stomata open)', type: 'toggle', value: true },
      { id: 'chl', label: 'Leaf has chlorophyll (green part)', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'rate', label: 'Rate of photosynthesis', short: 'Rate', unit: '%', digits: 0, key: true },
      { id: 'lim', label: 'Limiting factor (in shortest supply)', short: 'Limited by', key: true },
      { id: 'glu', label: 'Glucose made (dots)', short: 'Glucose', digits: 0, key: true },
      { id: 'co2', label: 'CO₂ taken in', digits: 0 },
      { id: 'h2o', label: 'Water used', digits: 0 },
      { id: 'o2', label: 'Oxygen given out', digits: 0 }
    ],
    graph: { title: 'Rate of photosynthesis', yLabel: '%', series: [{ label: 'rate', color: '--sim-3' }], window: 30, yMin: 0, yMax: 100 },

    reset: function (sim) {
      sim.state = { L: null, parts: [], acc: 0, n: { co2: 0, h2o: 0, glu: 0, o2: 0 }, flash: [], seed: 1, rnd: M.rng(42) };
    },
    onParam: function () { return true; },
    update: function (sim, dt) {
      var s = sim.state, t = sim.time, f = factors(sim.p), L = getL(sim);
      s.acc += f.rate * EV_MAX * dt;
      while (s.acc >= 1) {
        s.acc -= 1;
        var ci = Math.floor(s.rnd() * L.chl.length), k;
        for (k = 0; k < 6; k++) {
          s.parts.push({ type: 'co2', path: ['below', 'stomaTop', 'chl'], ci: ci, spread: s.rnd() - 0.5, t0: t + k * 0.15, dur: 2.2, seed: s.rnd() });
          s.parts.push({ type: 'h2o', path: ['xylem', 'chl'], ci: ci, spread: 0, t0: t + k * 0.15 + 0.4, dur: 1.6, seed: s.rnd() });
          s.parts.push({ type: 'o2', path: ['chl', 'stomaTop', 'below'], ci: ci, spread: s.rnd() - 0.5, t0: t + 2.6 + k * 0.12, dur: 2.2, seed: s.rnd() });
        }
        s.parts.push({ type: 'glu', path: ['chl', 'phloem'], ci: ci, spread: 0, t0: t + 2.6, dur: 1.8, seed: s.rnd() });
        s.flash.push({ ci: ci, t: t + 2.5 });
      }
      for (var i = s.parts.length - 1; i >= 0; i--) {
        var q = s.parts[i];
        if (t >= q.t0 + q.dur) {
          if (q.type === 'co2') s.n.co2++; else if (q.type === 'h2o') s.n.h2o++; else if (q.type === 'glu') s.n.glu++; else s.n.o2++;
          s.parts.splice(i, 1);
        }
      }
      while (s.flash.length && s.flash[0].t < t - 0.6) s.flash.shift();
    },
    readout: function (sim) {
      var f = factors(sim.p), n = sim.state.n;
      return { rate: 100 * f.rate, lim: f.lim, glu: n.glu, co2: n.co2, h2o: n.h2o, o2: n.o2 };
    },
    sample: function (sim) { return [100 * factors(sim.p).rate]; },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, L = getL(sim);
      var f = factors(p), nar = L.narrow, t = sim.time, fs = nar ? 10.5 : 12;
      D.clear(ctx, W, H, c.bg);
      // sky band
      var day = p.light / 100;
      ctx.fillStyle = c.light ? 'rgba(125,180,255,' + (0.12 + 0.25 * day) + ')' : 'rgba(60,110,200,' + (0.08 + 0.22 * day) + ')';
      ctx.fillRect(0, 0, W, L.y0);
      var sunX = nar ? 26 : 40, sunY = L.top * 0.48, sr = Math.min(16, L.top * 0.3);
      if (p.light > 0) {
        D.circle(ctx, sunX, sunY, sr, '#facc15');
        for (var a = 0; a < 8; a++) { var an = a * Math.PI / 4; D.line(ctx, sunX + Math.cos(an) * sr * 1.3, sunY + Math.sin(an) * sr * 1.3, sunX + Math.cos(an) * sr * 1.75, sunY + Math.sin(an) * sr * 1.75, '#facc15', 2); }
      } else {
        D.circle(ctx, sunX, sunY, sr, '#e2e8f0'); D.circle(ctx, sunX + sr * 0.45, sunY - sr * 0.25, sr * 0.85, c.bg);
      }
      var eq = nar ? 'CO₂ + water  →  glucose + O₂' : 'carbon dioxide + water  →  glucose + oxygen';
      var ex = (sunX + sr * 2 + W) / 2;
      D.text(ctx, eq, ex, sunY + 2, { color: c.ink, size: nar ? 11.5 : 14, weight: 700, align: 'center', fit: W });
      D.text(ctx, 'light + chlorophyll', ex, sunY - (nar ? 13 : 16), { color: c.muted, size: nar ? 9.5 : 11, align: 'center', fit: W });

      // leaf layers
      var leafFill = c.light ? '#ecfccb' : '#14281a';
      ctx.fillStyle = leafFill; ctx.fillRect(0, L.y0, W, L.y1 - L.y0);
      // epidermis cells
      function skin(yA, yB) {
        var n = Math.round(W / (nar ? 22 : 28)), w = W / n;
        for (var i = 0; i < n; i++) D.roundRect(ctx, i * w + 1, yA + 1, w - 2, yB - yA - 2, 3, c.light ? '#f8fafc' : '#1e293b', D.alpha(c.ink, 0.35), 1);
      }
      skin(L.y0, L.ue);
      // lower skin with a gap for the stoma
      var n2 = Math.round(W / (nar ? 22 : 28)), w2 = W / n2;
      for (var i = 0; i < n2; i++) {
        var cx = i * w2 + w2 / 2; if (Math.abs(cx - L.sx) < w2 * 1.1) continue;
        D.roundRect(ctx, i * w2 + 1, L.le + 1, w2 - 2, L.y1 - L.le - 2, 3, c.light ? '#f8fafc' : '#1e293b', D.alpha(c.ink, 0.35), 1);
      }
      var chlCol = p.chl ? (c.light ? '#16a34a' : '#22c55e') : (c.light ? '#e5e7eb' : '#4b5563');
      var cellFill = p.chl ? (c.light ? '#bbf7d0' : '#1f4d2b') : (c.light ? '#f5f5f4' : '#2a2f36');
      L.pals.forEach(function (q) { D.roundRect(ctx, q.x, q.y, q.w, q.h, 6, cellFill, D.alpha(c.ink, 0.45), 1.2); });
      L.sp.forEach(function (q) { D.circle(ctx, q.x, q.y, q.r, cellFill, D.alpha(c.ink, 0.45), 1.2); });
      var fl = {};
      s.flash.forEach(function (q) { var age = t - q.t; if (age > -0.1 && age < 0.6) fl[q.ci] = 1 - Math.abs(age) / 0.6; });
      L.chl.forEach(function (q, k) {
        var rw = nar ? 4 : 5, rh = nar ? 2.6 : 3.2;
        ctx.save(); ctx.translate(q.x, q.y); ctx.beginPath(); ctx.ellipse(0, 0, rw, rh, q.pal ? Math.PI / 2 : 0, 0, Math.PI * 2);
        ctx.fillStyle = chlCol; ctx.fill(); ctx.restore();
        if (fl[k]) D.circle(ctx, q.x, q.y, 6 + 6 * fl[k], null, D.alpha('#facc15', fl[k]), 2.5);
      });
      // vein: xylem (top half) and phloem (bottom half)
      D.circle(ctx, L.vx, L.vy, L.vr + 4, c.light ? '#fef9c3' : '#3b3520', D.alpha(c.ink, 0.5), 1.2);
      ctx.save(); ctx.beginPath(); ctx.arc(L.vx, L.vy, L.vr, Math.PI, 0); ctx.closePath(); ctx.fillStyle = D.alpha('#3b82f6', 0.45); ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(L.vx, L.vy, L.vr, 0, Math.PI); ctx.closePath(); ctx.fillStyle = D.alpha('#f97316', 0.45); ctx.fill(); ctx.restore();
      D.text(ctx, 'xylem', L.vx, L.vy - L.vr * 0.45, { color: c.ink, size: nar ? 9 : 10.5, weight: 700, align: 'center' });
      D.text(ctx, 'phloem', L.vx, L.vy + L.vr * 0.5, { color: c.ink, size: nar ? 9 : 10.5, weight: 700, align: 'center' });
      // stoma: two guard cells, opening set by water
      var gap = p.water ? (nar ? 6 : 8) : 1.5, gh = L.y1 - L.le, gw = nar ? 9 : 12;
      [-1, 1].forEach(function (sd) {
        ctx.save(); ctx.beginPath(); ctx.ellipse(L.sx + sd * (gap / 2 + gw / 2), L.le + gh / 2, gw / 2, gh / 2 + 1, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.chl ? '#22c55e' : '#9ca3af'; ctx.fill(); ctx.strokeStyle = D.alpha(c.ink, 0.6); ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      });

      // light rays down to the palisade
      if (p.light > 0) {
        var nr = Math.max(2, Math.round((nar ? 7 : 12) * day)), ph = (now || 0) / 900;
        for (var r = 0; r < nr; r++) {
          var rx = (r + 0.6) / nr * W, yA = L.top * 0.62, yB = L.pal - 6;
          var off = ((ph + r * 0.37) % 1) * (yB - yA) * 0.5;
          D.arrow(ctx, rx - 7, yA + off, rx, yA + (yB - yA) * 0.5 + off, D.alpha('#facc15', 0.35 + 0.5 * day), 2.5, 8);
        }
      }

      // moving molecules
      var col = { co2: c.light ? '#475569' : '#cbd5e1', h2o: '#3b82f6', o2: '#ef4444', glu: '#f59e0b' };
      s.parts.forEach(function (q) {
        var fr = (t - q.t0) / q.dur; if (fr < 0 || fr > 1) return;
        var P = lerpPath(L, q, fr), rr = nar ? 3 : 3.6;
        if (q.type === 'glu') {
          ctx.save(); ctx.beginPath();
          for (var k = 0; k < 6; k++) { var an = k * Math.PI / 3, X = P.x + Math.cos(an) * rr * 2, Y = P.y + Math.sin(an) * rr * 2; if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
          ctx.closePath(); ctx.fillStyle = col.glu; ctx.fill(); ctx.strokeStyle = c.ink; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
        } else D.circle(ctx, P.x, P.y, rr, col[q.type], c.bg, 1);
      });

      // labels
      var lab = { color: c.ink, size: fs, weight: 600, bg: D.alpha(c.bg, 0.75), pad: 3 };
      D.text(ctx, nar ? 'Palisade cells' : 'Palisade cells (most chloroplasts)', 10, (L.ue + L.pal) / 2 - 8, Object.assign({}, lab, { fit: W }));
      D.text(ctx, nar ? 'Spongy cells' : 'Spongy cells and air spaces', 10, L.pal + (L.le - L.pal) * 0.2, Object.assign({}, lab, { fit: W }));
      D.text(ctx, 'Stoma', L.sx + gw + 8, L.le - 10, Object.assign({}, lab, { fit: W }));
      // bottom band: what goes in and out, and the key
      var by = L.y1 + (H - L.y1) * 0.55, kx = W * (nar ? 0.56 : 0.6);
      var keys = [['co2', 'CO₂ in'], ['o2', 'O₂ out'], ['h2o', 'water'], ['glu', 'glucose']];
      var kw = (W - kx - 6) / 2;
      keys.forEach(function (k, i) {
        var x = kx + (i % 2) * kw, y = L.y1 + (H - L.y1) * (i < 2 ? 0.32 : 0.72);
        if (k[0] === 'glu') { D.circle(ctx, x + 5, y, 5, col.glu, c.ink, 1); } else D.circle(ctx, x + 5, y, 4, col[k[0]]);
        D.text(ctx, k[1], x + 14, y, { color: c.muted, size: nar ? 10 : 11.5, weight: 600 });
      });
      if (p.light === 0) D.text(ctx, 'Night: no photosynthesis', W / 2, L.y0 - 10, { color: c.warning, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 3, fit: W });
      else if (!p.chl) D.text(ctx, 'No chlorophyll: light is not trapped', W / 2, L.y0 - 10, { color: c.warning, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 3, fit: W });
      else if (!p.water) D.text(ctx, 'Dry soil: stomata nearly closed', W / 2, L.y0 - 10, { color: c.warning, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 3, fit: W });
      D.text(ctx, 'Rate ' + Math.round(100 * f.rate) + ' %', 10, by, { color: c.s3 || c.accent, size: nar ? 12 : 14, weight: 700, font: c.mono });
    }
  });
})();
