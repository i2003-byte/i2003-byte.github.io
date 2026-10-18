/* =====================================================================
   Life processes · Kidney & Nephron — sim.js
   ---------------------------------------------------------------------
   One nephron, slowed down. Blood enters the glomerulus; water, salt,
   glucose and urea are pushed into Bowman's capsule (blood cells and
   proteins are too big). The filtrate runs along the tubule and each
   particle is taken back into the blood at a fixed place, or reaches
   the urine. Shares taken back (rounded textbook values):
     water   PCT 65 %, descending loop 15 %, DCT 5 %, collecting duct
             the rest; share left in urine = urine / 180 L
     salt    PCT 65 %, ascending loop 25 %, DCT + duct the rest; ≈ 0.6 %
             left
     glucose all in the PCT, unless blood sugar is above the threshold
     urea    PCT 40 %, duct 10 %; about half leaves in urine
   Daily water balance (litres per day):
     in   = drink + 0.7 (food) + 0.3 (made in the body)
     out  = 0.8 (breath and skin) + sweat (0.1, or 2.0 on a hot day)
            + 0.1 (faeces) + urine
     The kidney must remove about 600 mOsm of waste a day, and urine
     can be at most 1200 mOsm/L, so urine ≥ 0.5 L. Glucose in urine
     adds to the load (1 g = 1/180 mol). Urine = the water left over,
     but never below that least volume; any shortfall means thirst.
   Filtration: 180 L a day. Glucose filtered = 180 L × blood sugar;
   above ≈ 180 mg/dL the tubule cannot take it all back:
     sugar in urine (g/day) = 1.8 × (blood sugar − 180).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var GFR = 180, SOLUTE = 600, MAXOSM = 1200, FOOD = 0.7, MADE = 0.3, BREATH = 0.8, FAECES = 0.1;
  var COL = { water: '#38bdf8', salt: '#e2e8f0', glucose: '#f97316', urea: '#facc15', rbc: '#dc2626', protein: '#a855f7', blood: '#ef4444' };
  var TRIP = 9;                        // screen seconds for the filtrate to run the whole tubule

  function balance(p) {
    var sweat = p.hot ? 2.0 : 0.1, gIn = 1.8 * p.sugar, gU = Math.max(0, 1.8 * (p.sugar - 180));
    var load = SOLUTE + gU / 180 * 1000, minU = load / MAXOSM;
    var inn = p.drink + FOOD + MADE, other = BREATH + sweat + FAECES, spare = inn - other;
    var urine = Math.max(spare, minU), shortL = Math.max(0, minU - spare);
    var osm = load / urine;
    return { sweat: sweat, gIn: gIn, gU: gU, inn: inn, other: other, urine: urine, shortL: shortL, osm: osm, minU: minU, adh: M.clamp((osm - 150) / 900, 0, 1) };
  }
  function colourWord(osm) {
    return osm < 250 ? 'almost colourless' : osm < 450 ? 'pale yellow' : osm < 700 ? 'yellow' : osm < 950 ? 'dark yellow' : 'amber';
  }
  function mix(a, b, t) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), r = function (s) { return Math.round(((x >> s) & 255) + (((y >> s) & 255) - ((x >> s) & 255)) * t); };
    return 'rgb(' + r(16) + ',' + r(8) + ',' + r(0) + ')';
  }
  function urineColour(osm) {
    var t = M.clamp((osm - 100) / 1100, 0, 1);
    return t < 0.45 ? mix('#fefce8', '#facc15', t / 0.45) : mix('#facc15', '#b45309', (t - 0.45) / 0.55);
  }

  // ---------- the nephron drawn in a unit box ----------
  var CAP = { x: 0.17, y: 0.21 };
  function tubulePts() {
    var pts = [[CAP.x + 0.04, CAP.y], [0.24, CAP.y - 0.02]], reg = ['cap'], i;
    for (i = 1; i <= 10; i++) { pts.push([0.24 + i * 0.019, CAP.y - 0.02 + Math.sin(i * 1.6) * 0.055]); reg.push('pct'); }
    pts.push([0.44, 0.3]); reg.push('pct');
    pts.push([0.44, 0.84]); reg.push('down');
    for (i = 1; i <= 6; i++) { var a = Math.PI - i * Math.PI / 6; pts.push([0.49 + Math.cos(a) * 0.05, 0.84 + Math.sin(a) * 0.07]); reg.push(i <= 3 ? 'down' : 'up'); }
    pts.push([0.54, 0.32]); reg.push('up');
    for (i = 1; i <= 8; i++) { pts.push([0.54 + i * 0.024, 0.3 - i * 0.012 + Math.sin(i * 1.7) * 0.04]); reg.push('dct'); }
    pts.push([0.84, 0.14]); reg.push('dct');
    pts.push([0.84, 0.94]); reg.push('cd');
    return { pts: pts, reg: reg };
  }
  var TUBE = tubulePts();
  var st = { parts: [], cells: [], t: 0, acc: {}, rnd: M.rng(7), drips: [] };

  function regionRange(L) {                 // s-range (0..1) of each region along the tubule
    var r = {}, n = TUBE.pts.length;
    for (var k = 1; k < n; k++) {
      var g = TUBE.reg[k - 1], a = L[k - 1] / L[n - 1], b = L[k] / L[n - 1];
      if (!r[g]) r[g] = [a, b]; else r[g][1] = b;
    }
    return r;
  }
  var unitL = (function () { var L = [0]; for (var k = 1; k < TUBE.pts.length; k++) L.push(L[k - 1] + Math.hypot(TUBE.pts[k][0] - TUBE.pts[k - 1][0], TUBE.pts[k][1] - TUBE.pts[k - 1][1])); return L; })();
  var RR = regionRange(unitL);

  function fate(type, b) {                   // where along the tubule this particle is taken back (2 = reaches urine)
    var r = st.rnd(), u = st.rnd();
    var at = function (g) { return RR[g][0] + (RR[g][1] - RR[g][0]) * (0.1 + 0.8 * u); };
    if (type === 'water') {
      var fu = b.urine / GFR;
      if (r < fu) return 2;
      r = (r - fu) / (1 - fu);
      return r < 0.65 ? at('pct') : r < 0.8 ? at('down') : r < 0.85 ? at('dct') : at('cd');
    }
    if (type === 'salt') return r < 0.006 ? 2 : r < 0.65 ? at('pct') : r < 0.9 ? at('up') : r < 0.95 ? at('dct') : at('cd');
    if (type === 'glucose') return r < b.gU / b.gIn ? 2 : at('pct');
    return r < 0.5 ? 2 : r < 0.9 ? at('pct') : at('cd');      // urea
  }
  var RATE = { water: 9, salt: 3, glucose: 2, urea: 2 };

  function step(p, dt) {
    var b = balance(p);
    st.t += dt;
    Object.keys(RATE).forEach(function (k) {
      var rate = RATE[k] * (k === 'glucose' ? p.sugar / 100 : 1);
      st.acc[k] = (st.acc[k] || 0) + dt * rate;
      while (st.acc[k] >= 1) { st.acc[k] -= 1; st.parts.push({ type: k, s: 0, out: fate(k, b), leave: -1, side: st.rnd() < 0.5 ? -1 : 1, j: st.rnd() }); }
    });
    st.acc.cell = (st.acc.cell || 0) + dt * 2.5;
    while (st.acc.cell >= 1) { st.acc.cell -= 1; st.cells.push({ type: st.rnd() < 0.6 ? 'rbc' : 'protein', u: 0, j: st.rnd() }); }
    var ds = dt / TRIP;
    st.parts = st.parts.filter(function (q) {
      if (q.leave >= 0) { q.leave += dt / 0.7; return q.leave < 1; }
      q.s += ds * (q.s > RR.cd[0] ? 1.6 : 1);
      if (q.out < 2 && q.s >= q.out) q.leave = 0;
      if (q.s >= 1) { st.drips.push({ y: 0, type: q.type }); return false; }
      return true;
    });
    st.cells = st.cells.filter(function (q) { q.u += dt / 4; return q.u < 1; });
    st.drips = st.drips.filter(function (d) { d.y += dt * 1.6; return d.y < 1; });
  }

  SimLab.createSim({
    ariaLabel: 'One nephron of the kidney: blood enters the glomerulus, water, salt, glucose and urea are filtered into Bowman\'s capsule while blood cells and proteins stay in the blood, then glucose, salt and most of the water are taken back into the blood along the tubule and the rest drips out as urine. A panel shows the daily water balance and the colour of the urine.',
    playLabel: 'Start blood flow',
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'drink', label: 'Water you drink in a day', min: 0.5, max: 5, step: 0.1, value: 1.5, unit: 'L', presets: [0.8, 1.5, 3] },
      { id: 'hot', label: 'Hot summer day (sweating)', type: 'toggle', value: false, help: 'About 2 L of sweat instead of 0.1 L.' },
      { id: 'sugar', label: 'Blood sugar', min: 70, max: 400, step: 5, value: 100, unit: 'mg/dL', presets: [100, 180, 300], help: 'Normal fasting value is about 70–100 mg/dL. Much higher values are a sign of diabetes.' }
    ],
    readouts: [
      { id: 'urine', label: 'Urine made', unit: 'L/day', digits: 1, key: true, short: 'Urine' },
      { id: 'back', label: 'Filtered water taken back', unit: '%', digits: 1, key: true, short: 'Water back' },
      { id: 'col', label: 'Urine colour', key: true, short: 'Colour' },
      { id: 'filt', label: 'Filtered by both kidneys', unit: 'L/day', digits: 0 },
      { id: 'sugarU', label: 'Sugar in urine', unit: 'g/day', digits: 0 },
      { id: 'short', label: 'Water you are short of', unit: 'L/day', digits: 1 },
      { id: 'adh', label: 'Water-saving hormone (ADH)' }
    ],
    reset: function (sim) {
      st.parts = []; st.cells = []; st.drips = []; st.t = 0; st.acc = {}; st.rnd = M.rng(7);
      for (var i = 0; i < 240 * TRIP; i++) step(sim.p, 1 / 240);   // start with a full tubule
    },
    onParam: function (sim) {
      var b = balance(sim.p);                                   // new fates for particles already in the tubule
      st.parts.forEach(function (q) { if (q.leave < 0) { var f = fate(q.type, b); q.out = f === 2 ? 2 : Math.max(f, q.s + 0.005); } });
      return true;
    },
    update: function (sim, dt) { step(sim.p, dt); },
    readout: function (sim) {
      var b = balance(sim.p);
      return {
        urine: b.urine, back: 100 * (1 - b.urine / GFR), col: colourWord(b.osm), filt: GFR, sugarU: b.gU, short: b.shortL,
        adh: b.adh > 0.6 ? 'high: saving water' : b.adh > 0.25 ? 'medium' : 'low: letting water go'
      };
    },
    status: function (sim) {
      var b = balance(sim.p);
      if (b.shortL > 0.05) return 'Short of ' + M.fmt(b.shortL, 1) + ' L of water a day: drink more';
      if (b.gU > 0) return 'Sugar is spilling into the urine: too much for the tubule to take back';
      return 'Kidneys filter 180 L a day and return all but ' + M.fmt(b.urine, 1) + ' L to the blood';
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 10 : 12;
      var b = balance(p);
      var colOf = function (t) { return c.light && t === 'urea' ? '#ca8a04' : c.light && t === 'salt' ? '#64748b' : COL[t]; };
      D.clear(ctx, W, H, c.bg);
      var side = W > H * 1.25;
      var bx = 6, by = 4, bw = side ? W * 0.62 - 12 : W - 12, bh = side ? H - 8 : H * 0.62 - 6;
      var P = function (q) { return { x: bx + q[0] * bw, y: by + q[1] * bh }; };
      var T = M.clamp(Math.min(bw, bh) * 0.035, 6, 13);
      var lab = function (t, x, y, col, al, sz, w) { D.text(ctx, t, x, y, { color: col || c.muted, size: sz || fs, weight: w || 600, align: al || 'left', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W }); };

      // tubule pixel path + cumulative length
      var pts = TUBE.pts.map(P), L = [0];
      for (var k = 1; k < pts.length; k++) L.push(L[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
      var tot = L[L.length - 1];
      var at = function (s) {
        var d = M.clamp(s, 0, 1) * tot, j = 1; while (j < L.length - 1 && L[j] < d) j++;
        var A = pts[j - 1], B = pts[j], q = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1), len = (L[j] - L[j - 1]) || 1;
        return { x: A.x + (B.x - A.x) * q, y: A.y + (B.y - A.y) * q, nx: -(B.y - A.y) / len, ny: (B.x - A.x) / len };
      };
      var stroke = function (list, w, col) { ctx.beginPath(); list.forEach(function (q, i) { if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };

      // capillaries wrapped round the tubule (not round the collecting duct's lower end)
      var cdEnd = 0; while (cdEnd < TUBE.reg.length && TUBE.reg[cdEnd] !== 'cd') cdEnd++;
      stroke(pts.slice(1, cdEnd + 1), T * 3, D.alpha(COL.blood, c.light ? 0.16 : 0.22));
      var cap = P([CAP.x, CAP.y]), R = Math.min(bw, bh) * 0.085;
      // blood vessels: afferent in, efferent out to the capillaries, vein out
      var aIn = P([0, 0.07]), eOut = P([0.3, 0.05]), vein = P([0.66, 0.05]);
      D.line(ctx, aIn.x, aIn.y, cap.x - R * 0.4, cap.y - R * 0.3, D.alpha(COL.blood, 0.75), T * 1.1);
      ctx.beginPath(); ctx.moveTo(cap.x + R * 0.3, cap.y - R * 0.4); ctx.quadraticCurveTo(eOut.x, eOut.y, pts[4].x, pts[4].y - T); ctx.strokeStyle = D.alpha(COL.blood, 0.6); ctx.lineWidth = T * 0.8; ctx.stroke();
      D.arrow(ctx, pts[cdEnd - 4].x, pts[cdEnd - 4].y - T * 1.5, vein.x + bw * 0.12, vein.y, D.alpha(COL.blood, 0.7), 2.5, 9);
      // Bowman's capsule (cup) with the glomerulus knot inside
      ctx.beginPath(); ctx.arc(cap.x, cap.y, R, -0.35 * Math.PI, 1.65 * Math.PI - 0.5); ctx.strokeStyle = D.alpha(c.ink, 0.7); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = D.alpha(COL.water, 0.08); ctx.beginPath(); ctx.arc(cap.x, cap.y, R, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      for (var g = 0; g <= 60; g++) { var th = g / 60 * Math.PI * 2, rr = R * (0.45 + 0.17 * Math.sin(th * 5)); var gx = cap.x + Math.cos(th) * rr, gy = cap.y + Math.sin(th) * rr; if (g) ctx.lineTo(gx, gy); else ctx.moveTo(gx, gy); }
      ctx.strokeStyle = D.alpha(COL.blood, 0.85); ctx.lineWidth = T * 0.55; ctx.stroke();
      // the tubule itself
      var regCol = { cap: c.ink, pct: c.ink, down: c.ink, up: c.ink, dct: c.ink, cd: c.ink };
      stroke(pts, T + 3, D.alpha(regCol.pct, 0.55));
      stroke(pts, T, c.bg);
      // urine drips below the collecting duct
      var end = pts[pts.length - 1];
      st.drips.forEach(function (d) { D.circle(ctx, end.x, end.y + 6 + d.y * (by + bh - end.y + 4), 2.6, d.type === 'water' ? urineColour(b.osm) : colOf(d.type)); });

      // blood cells and proteins: through the glomerulus and out again (never filtered)
      st.cells.forEach(function (q) {
        var x, y, u = q.u;
        if (u < 0.3) { var v = u / 0.3; x = aIn.x + (cap.x - aIn.x) * v; y = aIn.y + (cap.y - R * 0.3 - aIn.y) * v; }
        else if (u < 0.7) { var th2 = (u - 0.3) / 0.4 * Math.PI * 2 + q.j * 6; x = cap.x + Math.cos(th2) * R * 0.45; y = cap.y + Math.sin(th2) * R * 0.45; }
        else { var w2 = (u - 0.7) / 0.3; x = cap.x + (eOut.x - cap.x) * w2; y = cap.y - R * 0.4 + (eOut.y - cap.y + R * 0.4) * w2; }
        if (q.type === 'rbc') D.circle(ctx, x, y, T * 0.42, COL.rbc, D.alpha('#7f1d1d', 0.8), 1);
        else D.circle(ctx, x, y, T * 0.5, D.alpha(COL.protein, 0.9), null);
      });
      // filtrate particles
      st.parts.forEach(function (q) {
        var a = at(q.s), off = (q.j - 0.5) * T * 0.5, x = a.x + a.nx * off, y = a.y + a.ny * off, al = 1;
        if (q.leave >= 0) { var o = q.side * T * 1.5 * q.leave; x += a.nx * o; y += a.ny * o; al = 1 - q.leave * 0.8; }
        if (q.s < 0.02 && q.leave < 0) { x = cap.x + R * 0.75 * Math.cos(q.j * 6.28); y = cap.y + R * 0.75 * Math.sin(q.j * 6.28); }
        var col = D.alpha(colOf(q.type), al), r = T * 0.22;
        if (q.type === 'salt') ctx.fillStyle = col, ctx.fillRect(x - r, y - r, r * 2, r * 2);
        else D.circle(ctx, x, y, q.type === 'water' ? r * 0.9 : r * 1.25, col, null);
      });

      // labels
      var small = narrow && !side;
      lab(small ? 'Glomerulus' : 'Glomerulus in Bowman\'s capsule', cap.x - R, cap.y + R + fs, c.ink, 'left', fs, 700);
      lab(small ? 'blood in' : 'blood in (artery)', aIn.x, aIn.y - fs * 0.6 + 2, COL.blood, 'left', fs - 1);
      lab(small ? 'blood out' : 'cleaned blood out (vein)', vein.x + bw * 0.12, vein.y + fs, COL.blood, 'right', fs - 1);
      var pt = P([0.33, 0.36]); lab(small ? 'tubule' : 'tubule: glucose + salt back', pt.x, pt.y, c.muted, 'center', fs - 1);
      var lp = P([0.49, 0.95]); lab('loop of Henle', lp.x, Math.min(lp.y, by + bh - fs * 0.6), c.muted, 'center', fs - 1);
      var cd = P([0.84, 0.55]);
      lab(small ? 'collecting duct' : 'collecting duct', cd.x - T - 4, cd.y - fs * 1.2, c.muted, 'right', fs - 1);
      lab(b.adh > 0.6 ? 'saves water' : b.adh > 0.25 ? 'takes some water' : 'lets water go', cd.x - T - 4, cd.y + 2, b.adh > 0.6 ? c.warning : COL.water, 'right', fs - 1, 700);
      lab('urine ↓', end.x + T, by + bh - fs * 0.7, c.ink, 'left', fs - 1, 700);
      // legend in the empty bottom-left corner
      var lx = bx + 4, ly = by + bh * 0.52, lh = Math.min(fs + 5, bh * 0.08);
      [['water', 'water'], ['salt', 'salt'], ['glucose', 'glucose'], ['urea', 'urea (waste)'], ['rbc', 'blood cell'], ['protein', 'protein (too big)']].forEach(function (e, i) {
        var y = ly + i * lh, col = colOf(e[0]);
        if (e[0] === 'salt') { ctx.fillStyle = col; ctx.fillRect(lx + 2, y - 3, 6, 6); } else D.circle(ctx, lx + 5, y, e[0] === 'water' ? 2.6 : 3.6, col, null);
        if (lx + 14 < P([0.42, 0]).x) D.text(ctx, e[1], lx + 13, y, { color: c.muted, size: fs - 1, weight: 600 });
      });

      // ---------- one day in numbers ----------
      var px = side ? W * 0.62 + 2 : 6, py = side ? 6 : by + bh + 6, pw = side ? W - px - 6 : W - 12, ph = side ? H - 12 : H - py - 6;
      D.roundRect(ctx, px, py, pw, ph, 12, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.2), 1.5);
      var cupW = Math.min(pw * 0.22, side ? 70 : 54), cupH = Math.min(ph * (side ? 0.32 : 0.62), cupW * 1.5);
      var cx0 = side ? px + pw / 2 - cupW / 2 : px + pw - cupW - 10, cy0 = side ? py + ph - cupH - 28 : py + ph - cupH - 22;
      var tw = side ? pw - 16 : cx0 - px - 14, x = px + 8, y = py + 13, lsz = side ? fs : fs, gap = side ? fs + 8 : fs + 4;
      var line = function (t, col, w) {
        ctx.font = (w || 600) + ' ' + lsz + 'px Inter, system-ui, sans-serif';
        var sz = lsz; while (sz > 8 && ctx.measureText(t).width > tw) { sz -= 0.5; ctx.font = (w || 600) + ' ' + sz + 'px Inter, system-ui, sans-serif'; }
        D.text(ctx, t, x, y, { color: col || c.ink, size: sz, weight: w || 600 }); y += gap;
      };
      line('One day, both kidneys', c.ink, 700);
      line('Filtered: 180 L → back to blood ' + M.fmt(GFR - b.urine, 1) + ' L', c.muted);
      // bar: filtered water, urine share made visible
      var barW = tw, uw = Math.max(3, barW * b.urine / GFR);
      D.roundRect(ctx, x, y - 6, barW - uw, 10, 3, D.alpha(c.success, 0.7));
      D.roundRect(ctx, x + barW - uw, y - 6, uw, 10, 2, urineColour(b.osm), D.alpha(c.ink, 0.5), 1);
      y += gap;
      line('Water in: drink ' + M.fmt(p.drink, 1) + ' + food 0.7 + body 0.3 = ' + M.fmt(b.inn, 1) + ' L', c.muted);
      line('Lost: breath, skin ' + M.fmt(BREATH, 1) + ' + sweat ' + M.fmt(b.sweat, 1) + ' + faeces 0.1 L', p.hot ? c.warning : c.muted);
      if (b.shortL > 0.05) line('Short of ' + M.fmt(b.shortL, 1) + ' L: thirsty, dark urine. Drink more!', c.danger, 700);
      else line('Urine = water left over = ' + M.fmt(b.urine, 1) + ' L', c.ink, 700);
      if (b.gU > 0) line('Sugar in urine: ' + M.fmt(b.gU, 0) + ' g a day (diabetes sign)', c.warning, 700);
      // urine in a measuring jar (4 L full)
      D.roundRect(ctx, cx0, cy0, cupW, cupH, 6, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.6), 2);
      var fill = M.clamp(b.urine / 4, 0, 1) * (cupH - 4);
      D.roundRect(ctx, cx0 + 2, cy0 + cupH - 2 - fill, cupW - 4, fill, 4, urineColour(b.osm));
      for (var m = 1; m < 4; m++) { var my = cy0 + cupH - 2 - m / 4 * (cupH - 4); D.line(ctx, cx0, my, cx0 + 8, my, D.alpha(c.ink, 0.6), 1); }
      D.text(ctx, M.fmt(b.urine, 1) + ' L, ' + colourWord(b.osm), cx0 + cupW / 2, cy0 + cupH + 12, { color: c.ink, size: fs - 1, weight: 700, align: 'center', fit: W });
    }
  });
})();
