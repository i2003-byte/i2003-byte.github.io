/* =====================================================================
   Chemical reactions · Fuels and Calorific Value — sim.js
   ---------------------------------------------------------------------
   Heat the same pot of water from 25 °C to 100 °C on a stove that burns
   a chosen fuel.
     heat needed by the water   Q = m · c · ΔT      (c = 4.18 kJ/kg °C)
     heat the fuel must release Q / efficiency
     mass of fuel burned        Q / (CV × efficiency)
   CV = calorific value in kJ/kg (one value from the NCERT range).
   Each stove burns fuel at a fixed rate P (kW of fuel heat), so the
   water gains P × efficiency every second. Time runs 30× faster.
   Ignored: heat taken by the pot itself, evaporation before boiling,
   and changes of efficiency during the run.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var C_WATER = 4.18, T0 = 25, TB = 100, SPEED = 30;

  // stove: chulha | angithi | wick | gas.  P = fuel heat per second (kW)
  // ok = ideal-fuel checklist [easy to get, low cost, steady flame, high CV, clean]: 2 yes, 1 partly, 0 no
  var FUELS = [
    { id: 'dung', name: 'Cow dung cakes', short: 'Cow dung', cv: 7000, range: '6 000–8 000', eff: 0.10, P: 4, stove: 'chulha', stoveName: 'Mud chulha',
      smoke: 1, ash: 0.2, flame: 'smoky', gives: ['Smoke', 'Soot', 'CO', 'CO₂', 'Ash'], ok: [2, 2, 0, 0, 0],
      note: 'Smoky chulha fires harm the lungs and eyes of the cook.' },
    { id: 'wood', name: 'Wood', short: 'Wood', cv: 20000, range: '17 000–22 000', eff: 0.12, P: 6, stove: 'chulha', stoveName: 'Mud chulha',
      smoke: 0.85, ash: 0.01, flame: 'smoky', gives: ['Smoke', 'Soot', 'CO', 'CO₂', 'Ash'], ok: [2, 2, 0, 0, 0],
      note: 'Cutting trees for firewood also harms forests.' },
    { id: 'coal', name: 'Coal', short: 'Coal', cv: 30000, range: '25 000–33 000', eff: 0.20, P: 3, stove: 'angithi', stoveName: 'Coal angithi',
      smoke: 0.7, ash: 0.35, flame: 'coal', gives: ['Smoke', 'Soot', 'CO', 'SO₂', 'CO₂', 'Ash'], ok: [1, 1, 0, 1, 0],
      note: 'Coal smoke has sulphur dioxide, which causes acid rain.' },
    { id: 'biogas', name: 'Biogas', short: 'Biogas', cv: 37500, range: '35 000–40 000', eff: 0.55, P: 2, stove: 'gas', stoveName: 'Biogas burner',
      smoke: 0.02, ash: 0, flame: 'blue', gives: ['CO₂'], ok: [1, 2, 2, 1, 2],
      note: 'Made from dung in a biogas plant; the slurry left is good manure.' },
    { id: 'kerosene', name: 'Kerosene', short: 'Kerosene', cv: 45000, range: '45 000', eff: 0.45, P: 2.5, stove: 'wick', stoveName: 'Kerosene stove',
      smoke: 0.25, ash: 0, flame: 'yellow', gives: ['Soot', 'CO', 'CO₂'], ok: [1, 1, 2, 2, 1],
      note: 'A wick stove gives some soot and a smell.' },
    { id: 'petrol', name: 'Petrol', short: 'Petrol', cv: 45000, range: '45 000', eff: 0.45, P: 2.5, stove: 'wick', stoveName: 'Pressure stove (only to compare)',
      smoke: 0.1, ash: 0, flame: 'yellow', gives: ['CO', 'NO₂', 'CO₂'], ok: [2, 0, 0, 2, 1],
      note: 'A vehicle fuel: it catches fire far too easily for a kitchen.' },
    { id: 'diesel', name: 'Diesel', short: 'Diesel', cv: 45000, range: '45 000', eff: 0.45, P: 2.5, stove: 'wick', stoveName: 'Pressure stove (only to compare)',
      smoke: 0.4, ash: 0, flame: 'yellow', gives: ['Soot', 'CO', 'NO₂', 'CO₂'], ok: [2, 0, 1, 2, 0],
      note: 'A vehicle fuel for buses, trucks and tractors.' },
    { id: 'cng', name: 'CNG / methane', short: 'CNG', cv: 50000, range: '50 000', eff: 0.58, P: 2, stove: 'gas', stoveName: 'Gas burner (piped gas)',
      smoke: 0.01, ash: 0, flame: 'blue', gives: ['CO₂'], ok: [1, 1, 2, 2, 2],
      note: 'CNG is compressed methane; piped natural gas reaches city kitchens.' },
    { id: 'lpg', name: 'LPG', short: 'LPG', cv: 55000, range: '55 000', eff: 0.58, P: 2, stove: 'gas', stoveName: 'LPG gas burner',
      smoke: 0.02, ash: 0, flame: 'blue', gives: ['CO₂'], ok: [2, 1, 2, 2, 2],
      note: 'Clean blue flame: the usual kitchen fuel in India.' },
    { id: 'h2', name: 'Hydrogen', short: 'Hydrogen', cv: 150000, range: '150 000', eff: 0.60, P: 2, stove: 'gas', stoveName: 'Hydrogen burner (test)',
      smoke: 0, ash: 0, flame: 'h2', gives: ['H₂O only'], ok: [0, 0, 0, 2, 2],
      note: 'Cleanest, but costly and dangerous to store: it can explode.' }
  ];
  var BY = {}; FUELS.forEach(function (f) { BY[f.id] = f; });
  var CHECK = ['Easy to get', 'Low cost', 'Steady flame', 'High CV', 'Clean burning'];

  var st = { qRel: 0, T: T0, done: false };
  var bars = [];          // hit boxes of the comparison bars (for tap to choose)
  var gBoilSel = 10;      // grams of the chosen fuel to boil (graph x range)

  function fuel(sim) { return BY[sim.p.fuel] || BY.lpg; }
  function effOf(sim, f) { return sim.p.ideal ? 1 : f.eff; }
  function qWater(sim) { return sim.p.vol * C_WATER * (TB - T0); }               // kJ
  function gramsToBoil(sim, f) { return qWater(sim) / (f.cv * effOf(sim, f)) * 1000; }
  function tempAfter(sim, f, g) { return Math.min(TB, T0 + g / 1000 * f.cv * effOf(sim, f) / (sim.p.vol * C_WATER)); }
  function grams(sim) { return st.qRel / fuel(sim).cv * 1000; }
  function minutes(sim) { return sim.time * SPEED / 60; }
  function fmtG(g) { return g >= 100 ? Math.round(g) + '' : g >= 10 ? g.toFixed(1) : g.toFixed(2); }
  function fmtN(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  function pushGraph(sim) {
    if (!sim.graph) return;
    var g = grams(sim);
    sim.graph.push(g, [st.T, tempAfter(sim, BY.wood, g), tempAfter(sim, BY.lpg, g), tempAfter(sim, BY.h2, g)]);
  }

  /* ---------------- drawing pieces ---------------- */
  function flameColors(f, c) {
    if (f.flame === 'blue') return ['#3b82f6', '#93c5fd'];
    if (f.flame === 'h2') return [c.light ? 'rgba(96,165,250,0.45)' : 'rgba(191,219,254,0.4)', 'rgba(255,255,255,0.35)'];
    if (f.flame === 'coal') return ['#ef4444', '#fb923c'];
    if (f.flame === 'yellow') return ['#f59e0b', '#fde68a'];
    return ['#ea580c', '#facc15'];
  }

  function drawFlames(ctx, f, cx, baseY, width, height, t, c, on) {
    if (!on) return;
    var col = flameColors(f, c), n = Math.max(3, Math.round(width / 14));
    for (var i = 0; i < n; i++) {
      var x = cx - width / 2 + (i + 0.5) * width / n;
      var fl = 0.75 + 0.25 * Math.sin(t * 13 + i * 2.1) + 0.1 * Math.sin(t * 29 + i);
      var hh = height * fl * (f.flame === 'blue' || f.flame === 'h2' ? 0.7 : 1), ww = width / n * 0.55;
      ctx.beginPath(); ctx.moveTo(x - ww, baseY);
      ctx.quadraticCurveTo(x - ww * 0.6, baseY - hh * 0.6, x, baseY - hh);
      ctx.quadraticCurveTo(x + ww * 0.6, baseY - hh * 0.6, x + ww, baseY);
      ctx.closePath(); ctx.fillStyle = col[0]; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - ww * 0.5, baseY);
      ctx.quadraticCurveTo(x - ww * 0.3, baseY - hh * 0.35, x, baseY - hh * 0.55);
      ctx.quadraticCurveTo(x + ww * 0.3, baseY - hh * 0.35, x + ww * 0.5, baseY);
      ctx.closePath(); ctx.fillStyle = col[1]; ctx.fill();
    }
  }

  function drawScene(sim, R) {
    var ctx = sim.ctx, c = sim.colors, f = fuel(sim), t = sim.time, small = R.w < 220;
    var cx = R.x + R.w / 2, floor = R.y + R.h - 4;
    var on = sim.running || (sim.time > 0 && !st.done);
    D.line(ctx, R.x + 4, floor, R.x + R.w - 4, floor, D.alpha(c.ink, 0.3), 2);

    var sw = Math.min(R.w * 0.78, 220), sh = Math.min(R.h * 0.24, 70);
    var sTop = floor - sh;
    var potW = Math.min(R.w * 0.62, 190), potH = Math.min(R.h * 0.3, 120);
    var gap = Math.max(10, R.h * 0.07), potBot = sTop - gap, potTop = potBot - potH;
    var need = gramsToBoil(sim, f), frac = M.clamp(grams(sim) / need, 0, 1);

    // ---- stove ----
    if (f.stove === 'chulha') {
      var mud = c.light ? '#b45309' : '#92400e';
      D.roundRect(ctx, cx - sw / 2, sTop, sw, sh, 8, mud);
      D.roundRect(ctx, cx - sw * 0.3, sTop + sh * 0.3, sw * 0.6, sh * 0.62, 10, '#1c1917');
      // fuel pile shrinks as it burns, ash grows
      var left = 1 - frac * 0.85, pr = M.rng(f.id === 'dung' ? 7 : 9);
      for (var k = 0; k < 6; k++) {
        if (k / 6 > left) break;
        var px = cx - sw * 0.24 + pr() * sw * 0.42, py = sTop + sh * 0.62 + pr() * sh * 0.18;
        if (f.id === 'dung') D.circle(ctx, px + 6, py, Math.max(4, sh * 0.13), '#78350f', '#451a03', 1.2);
        else D.roundRect(ctx, px - 4, py - 4, sw * 0.2, Math.max(6, sh * 0.13), 3, '#7c2d12', '#431407', 1);
      }
      if (f.ash > 0.05 && frac > 0) D.roundRect(ctx, cx - sw * 0.26, sTop + sh * 0.84, sw * 0.52 * Math.min(1, frac + 0.15), sh * 0.06, 2, '#a8a29e');
      // pot rests on the chulha's raised edges
      D.roundRect(ctx, cx - sw / 2, sTop - gap, sw * 0.12, gap + 4, 3, mud);
      D.roundRect(ctx, cx + sw / 2 - sw * 0.12, sTop - gap, sw * 0.12, gap + 4, 3, mud);
      drawFlames(ctx, f, cx, sTop + sh * 0.55, sw * 0.5, sh * 0.5 + gap, t, c, on);
    } else if (f.stove === 'angithi') {
      var bk = c.light ? '#475569' : '#64748b';
      ctx.fillStyle = bk; ctx.beginPath();
      ctx.moveTo(cx - sw * 0.38, sTop); ctx.lineTo(cx + sw * 0.38, sTop); ctx.lineTo(cx + sw * 0.3, floor); ctx.lineTo(cx - sw * 0.3, floor); ctx.closePath(); ctx.fill();
      D.roundRect(ctx, cx - sw * 0.12, sTop + sh * 0.55, sw * 0.24, sh * 0.3, 3, '#1c1917');
      var cr = M.rng(4), lumps = Math.round(7 * (1 - frac * 0.7));
      for (var j = 0; j < lumps; j++) D.circle(ctx, cx - sw * 0.28 + cr() * sw * 0.56, sTop + 3 + cr() * 4, Math.max(4, sw * 0.04), on ? (j % 2 ? '#dc2626' : '#1f2937') : '#1f2937');
      if (frac > 0) D.roundRect(ctx, cx - sw * 0.1, sTop + sh * 0.7, sw * 0.2 * Math.min(1, frac + 0.2), sh * 0.1, 2, '#a8a29e');
      D.roundRect(ctx, cx - sw * 0.4, sTop - gap, sw * 0.08, gap + 2, 2, bk);
      D.roundRect(ctx, cx + sw * 0.32, sTop - gap, sw * 0.08, gap + 2, 2, bk);
      drawFlames(ctx, f, cx, sTop + 2, sw * 0.5, gap + 4, t, c, on);
    } else {
      var steel = c.light ? '#94a3b8' : '#64748b';
      if (f.stove === 'wick') {
        D.roundRect(ctx, cx - sw * 0.32, floor - sh * 0.55, sw * 0.64, sh * 0.55, 8, f.id === 'kerosene' ? '#1d4ed8' : steel);
        D.roundRect(ctx, cx - sw * 0.22, sTop + sh * 0.18, sw * 0.44, sh * 0.3, 4, D.alpha(c.ink, 0.35));
        var lev = 1 - frac;   // fuel level in the tank
        D.roundRect(ctx, cx + sw * 0.34, floor - sh * 0.5, 8, sh * 0.42, 3, D.alpha(c.ink, 0.25));
        D.roundRect(ctx, cx + sw * 0.34, floor - 8 - sh * 0.42 * lev * 0.95 + 0, 8, sh * 0.42 * lev * 0.95, 3, '#facc15');
      } else {
        D.roundRect(ctx, cx - sw / 2, floor - sh * 0.45, sw, sh * 0.45, 8, steel);
        D.roundRect(ctx, cx - sw * 0.2, sTop + sh * 0.35, sw * 0.4, sh * 0.15, 3, D.alpha(c.ink, 0.45));
        D.circle(ctx, cx - sw * 0.36, floor - sh * 0.22, Math.max(4, sh * 0.09), '#1f2937', D.alpha('#ffffff', 0.4), 1);
        if (f.id === 'lpg' && !small) {   // a red cylinder beside the stove
          var cyx = R.x + 8, cyh = sh * 1.2;
          if (cx - sw / 2 - cyx > 26) {
            D.roundRect(ctx, cyx, floor - cyh, 22, cyh, 8, '#dc2626');
            D.line(ctx, cyx + 11, floor - cyh, cx - sw * 0.45, floor - sh * 0.3, '#334155', 2);
          }
        }
      }
      // pan supports
      D.roundRect(ctx, cx - sw * 0.34, sTop - gap, 6, gap + sh * 0.4, 2, '#334155');
      D.roundRect(ctx, cx + sw * 0.34 - 6, sTop - gap, 6, gap + sh * 0.4, 2, '#334155');
      drawFlames(ctx, f, cx, sTop + sh * 0.35, sw * 0.38, gap + sh * 0.3, t, c, on);
    }

    // ---- pot (patila) with water ----
    var px0 = cx - potW / 2;
    var potCol = c.light ? '#cbd5e1' : '#94a3b8';
    D.roundRect(ctx, px0, potTop, potW, potH, 6, potCol, D.alpha(c.ink, 0.5), 1.5);
    D.roundRect(ctx, px0 - 6, potTop - 3, potW + 12, 6, 3, potCol, D.alpha(c.ink, 0.5), 1);
    var wFrac = 0.25 + 0.6 * (sim.p.vol - 0.5) / 2.5, wTop = potBot - (potH - 6) * wFrac;
    var hot = (st.T - T0) / (TB - T0);
    var wcol = 'rgba(' + Math.round(56 + 180 * hot) + ',' + Math.round(150 - 60 * hot) + ',' + Math.round(240 - 170 * hot) + ',0.85)';
    D.roundRect(ctx, px0 + 4, wTop, potW - 8, potBot - wTop - 3, 4, wcol);
    // soot on the pot bottom from smoky fuels
    if (f.smoke > 0.2 && grams(sim) > 0) {
      ctx.fillStyle = 'rgba(17,17,17,' + Math.min(0.85, frac * f.smoke) + ')';
      ctx.fillRect(px0, potBot - potH * 0.18, potW, potH * 0.18);
    }
    if (hot > 0.6) {     // bubbles
      var br = M.rng(3);
      for (var b = 0; b < Math.round(12 * (hot - 0.6) / 0.4); b++) {
        var bx = px0 + 10 + br() * (potW - 20), ph = (br() + t * 0.8) % 1;
        D.circle(ctx, bx, potBot - 6 - ph * (potBot - wTop - 10), 2 + br() * 2, null, 'rgba(255,255,255,0.7)', 1);
      }
    }
    if (st.T >= TB - 0.01) {   // steam
      for (var s = 0; s < 3; s++) {
        var sx = cx - potW * 0.25 + s * potW * 0.25, ph2 = (t * 0.6 + s * 0.33) % 1;
        ctx.strokeStyle = D.alpha(c.ink, 0.35 * (1 - ph2)); ctx.lineWidth = 3; ctx.beginPath();
        for (var q = 0; q < 12; q++) { var yy = potTop - 6 - q * 3 - ph2 * 14, xx = sx + Math.sin(q * 0.8 + t * 3) * 4; if (q) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); }
        ctx.stroke();
      }
    }
    // smoke rising past the pot
    if (on && f.smoke > 0) {
      var nSm = Math.round(10 * f.smoke) + 1, sr = M.rng(11);
      for (var m = 0; m < nSm; m++) {
        var side = m % 2 ? 1 : -1, ph3 = (t * 0.5 + sr()) % 1;
        var smx = cx + side * (potW / 2 + 6 + ph3 * 14) + Math.sin(t * 2 + m) * 4, smy = potBot - ph3 * (potBot - R.y - 20);
        D.circle(ctx, smx, smy, 5 + ph3 * 10, (c.light ? 'rgba(68,64,60,' : 'rgba(168,162,158,') + (0.45 * (1 - ph3) * Math.max(0.35, f.smoke)) + ')');
      }
    }
    if (on && f.id === 'h2') {   // water vapour from burning hydrogen
      var hr = M.rng(13);
      for (var w = 0; w < 6; w++) {
        var ph4 = (t * 0.6 + hr()) % 1, hx = cx + (w % 2 ? 1 : -1) * (potW / 2 + 8 + ph4 * 10);
        D.text(ctx, 'H₂O', hx, potBot - ph4 * (potBot - R.y - 20), { color: D.alpha('#38bdf8', 0.9 * (1 - ph4)), size: 10, weight: 700, align: 'center' });
      }
    }
    // temperature chip on the pot
    var fsT = small ? 13 : 16;
    D.text(ctx, M.fmt(st.T, 0) + ' °C', cx, potTop + potH * 0.36, { color: '#fff', bg: hot > 0.5 ? '#b91c1c' : '#1e3a8a', size: fsT, weight: 700, align: 'center', pad: 4 });
    // clock
    D.text(ctx, '⏱ ' + M.fmt(minutes(sim), 1) + ' min', R.x + 6, R.y + 10, { color: c.text, size: small ? 11 : 13, weight: 600 });
    D.text(ctx, sim.p.vol + ' L water', R.x + R.w - 6, R.y + 10, { color: c.muted, size: small ? 11 : 13, weight: 600, align: 'right' });
  }

  function chip(ctx, str, x, y, fs, col, c) {
    ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif';
    var w = ctx.measureText(str).width + 10;
    D.roundRect(ctx, x, y - fs / 2 - 3, w, fs + 6, 6, D.alpha(col, c.light ? 0.16 : 0.22), D.alpha(col, 0.7), 1);
    D.text(ctx, str, x + 5, y, { color: c.text, size: fs, weight: 700 });
    return w;
  }

  function drawInfo(sim, R, withCheck) {
    var ctx = sim.ctx, c = sim.colors, f = fuel(sim), e = effOf(sim, f);
    var fs = R.w < 230 ? 10.5 : 12.5, lh = fs + 6, x = R.x + 6, y = R.y + fs / 2 + 4, w = R.w - 12;
    D.text(ctx, f.name, x, y, { color: c.text, size: fs + 2.5, weight: 700 });
    y += lh + 2;
    var stoveTxt = sim.p.ideal ? 'Ideal stove: 100 % of heat used' : f.stoveName + ' · ' + Math.round(e * 100) + ' % used';
    ctx.font = '500 ' + fs + 'px Inter, system-ui, sans-serif';
    while (ctx.measureText(stoveTxt).width > w && stoveTxt.length > 8) stoveTxt = stoveTxt.slice(0, -2);
    if (stoveTxt.length && ctx.measureText(stoveTxt).width > w - 2) stoveTxt += '…';
    D.text(ctx, stoveTxt, x, y, { color: c.muted, size: fs });
    y += lh;
    D.text(ctx, 'CV ' + fmtN(f.cv) + ' kJ/kg', x, y, { color: c.accent, size: fs, weight: 700 });
    y += lh + 2;

    // heat split bar: grows with the heat released; part goes into the water, the rest is lost
    var qNeedRel = qWater(sim) / e, qRel = st.qRel, qIn = qRel * e;
    var bw = w * M.clamp(qRel / qNeedRel, 0, 1), bh = Math.max(10, fs);
    D.roundRect(ctx, x, y, w, bh, 4, D.alpha(c.ink, 0.1), D.alpha(c.ink, 0.3), 1);
    if (bw > 1) {
      D.roundRect(ctx, x, y, Math.max(2, bw * e), bh, 4, '#ef4444');
      if (e < 1) D.roundRect(ctx, x + bw * e, y, bw * (1 - e), bh, 4, D.alpha(c.muted, 0.6));
    }
    y += bh + lh * 0.7;
    var nar = R.w < 230;
    D.text(ctx, '■', x, y, { color: '#ef4444', size: fs });
    D.text(ctx, (nar ? 'water ' : 'into water ') + fmtN(qIn) + ' kJ', x + fs, y, { color: c.text, size: fs - 0.5, weight: 600 });
    if (nar) {
      ctx.font = '600 ' + (fs - 0.5) + 'px Inter, system-ui, sans-serif';
      var lx = x + fs + ctx.measureText('water ' + fmtN(qIn) + ' kJ').width + 8;
      D.text(ctx, '■', lx, y, { color: D.alpha(c.muted, 0.8), size: fs });
      D.text(ctx, 'lost ' + fmtN(qRel - qIn) + ' kJ', lx + fs, y, { color: c.muted, size: fs - 0.5, weight: 600, fit: R.x + R.w });
    } else {
      y += lh - 1;
      D.text(ctx, '■', x, y, { color: D.alpha(c.muted, 0.8), size: fs });
      D.text(ctx, 'lost to air ' + fmtN(qRel - qIn) + ' kJ', x + fs, y, { color: c.muted, size: fs - 0.5, weight: 600 });
    }
    y += lh + 1;

    // what the fuel gives off
    var cfs = nar ? fs - 2 : fs - 1.5, cx2 = x;
    f.gives.forEach(function (g) {
      var col = g === 'CO₂' ? c.warning : g === 'H₂O only' ? c.success : c.danger;
      ctx.font = '700 ' + cfs + 'px Inter, system-ui, sans-serif';
      var cw = ctx.measureText(g).width + 10;
      if (cx2 + cw > x + w) { cx2 = x; y += cfs + 11; }
      cx2 += chip(ctx, g, cx2, y, cfs, col, c) + (nar ? 3 : 4);
    });
    y += cfs / 2 + 10;

    if (withCheck) drawCheck(sim, { x: R.x, y: y, w: R.w, h: R.y + R.h - y });
  }

  // ideal fuel checklist (2 columns)
  function drawCheck(sim, R) {
    var ctx = sim.ctx, c = sim.colors, f = fuel(sim);
    var fs = R.w < 230 ? 10.5 : 12.5, x = R.x + 6, w = R.w - 12, y = R.y, cols = 2, rows = Math.ceil(CHECK.length / cols);
    var rh = Math.min(fs + 9, R.h / (rows + 1)), cfs2 = Math.min(fs, rh - 2);
    if (cfs2 < 8) return;
    var score = f.ok.reduce(function (a, b) { return a + (b === 2 ? 1 : 0); }, 0);
    D.text(ctx, 'Ideal fuel? ' + score + ' of 5 ✓', x, y + rh / 2, { color: c.text, size: cfs2 + 0.5, weight: 700 });
    y += rh;
    CHECK.forEach(function (lab, i) {
      var col = i % cols, row = Math.floor(i / cols), v = f.ok[i];
      var tx = x + col * (w / cols), ty = y + row * rh + rh / 2;
      var mk = v === 2 ? '✓' : v === 1 ? '~' : '✗', mc = v === 2 ? c.success : v === 1 ? c.warning : c.danger;
      D.text(ctx, mk, tx, ty, { color: mc, size: cfs2 + 1, weight: 800 });
      D.text(ctx, lab, tx + cfs2 + 4, ty, { color: v ? c.text : c.muted, size: cfs2, weight: 500 });
    });
  }

  function drawBars(sim, R) {
    var ctx = sim.ctx, c = sim.colors, f = fuel(sim);
    var fs = R.w < 400 ? 10.5 : 12.5;
    var head = fs + 12;
    var title = 'Grams to boil ' + sim.p.vol + ' L' + (sim.p.ideal ? ' (ideal stoves)' : ' (real stoves)');
    D.roundRect(ctx, R.x, R.y, R.w, R.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.15), 1);
    D.text(ctx, title, R.x + 8, R.y + head / 2 + 1, { color: c.text, size: fs + 1, weight: 700 });
    if (R.w > 300) D.text(ctx, 'tap a bar', R.x + R.w - 8, R.y + head / 2 + 1, { color: c.muted, size: fs - 1, align: 'right' });
    var rh = (R.h - head - 6) / FUELS.length, bh = Math.max(6, Math.min(rh - 4, 18));
    ctx.font = '600 ' + fs + 'px Inter, system-ui, sans-serif';
    var labW = 0; FUELS.forEach(function (q) { labW = Math.max(labW, ctx.measureText(q.short).width); });
    labW += 14;
    var valW = ctx.measureText('448 g').width + 10;
    var x0 = R.x + labW, maxW = R.w - labW - valW - 8;
    var gMax = 0; FUELS.forEach(function (q) { gMax = Math.max(gMax, gramsToBoil(sim, q)); });
    bars = [];
    FUELS.forEach(function (q, i) {
      var y = R.y + head + i * rh, cy = y + rh / 2, g = gramsToBoil(sim, q), sel = q.id === f.id;
      var w = Math.max(2, maxW * g / gMax);
      if (sel) D.roundRect(ctx, R.x + 3, y + 1, R.w - 6, rh - 2, 5, D.alpha(c.accent, 0.14));
      D.text(ctx, q.short, R.x + 8, cy, { color: sel ? c.text : c.muted, size: fs, weight: sel ? 700 : 600 });
      var col = q.smoke >= 0.5 ? '#a16207' : q.smoke >= 0.1 ? '#f59e0b' : q.id === 'h2' ? '#38bdf8' : '#3b82f6';
      D.roundRect(ctx, x0, cy - bh / 2, w, bh, 3, D.alpha(col, sel ? 0.95 : 0.6));
      if (sel && grams(sim) > 0) {   // grams burned so far on the chosen bar
        var bw = Math.min(w, maxW * grams(sim) / gMax);
        D.roundRect(ctx, x0, cy - bh / 2, Math.max(2, bw), bh, 3, c.accent);
      }
      D.text(ctx, fmtG(g) + ' g', x0 + w + 5, cy, { color: sel ? c.text : c.muted, size: fs, weight: sel ? 700 : 500 });
      bars.push({ id: q.id, y0: y, y1: y + rh, x0: R.x, x1: R.x + R.w });
    });
  }

  function layout(sim) {
    var W = sim.width, H = sim.height;
    if (W < 560) {
      var topH = Math.round(H * 0.55), sceneW = Math.round(W * 0.44);
      return { scene: { x: 0, y: 0, w: sceneW, h: topH }, info: { x: sceneW, y: 2, w: W - sceneW, h: topH - 2 }, check: null,
        bars: { x: 6, y: topH + 2, w: W - 12, h: H - topH - 8 } };
    }
    if (H < 420) {   // short and wide: three columns
      var c1 = Math.round(W * 0.3), c2 = Math.round(W * 0.3);
      return { scene: { x: 0, y: 0, w: c1, h: H - 4 }, info: { x: c1 + 4, y: 6, w: c2, h: H - 12 }, check: null,
        bars: { x: c1 + c2 + 12, y: 8, w: W - c1 - c2 - 20, h: H - 16 } };
    }
    var lw = Math.round(W * 0.46), sh = Math.round(H * 0.6), bh = Math.round(H * 0.68);
    return { scene: { x: 0, y: 4, w: lw, h: sh }, info: { x: 12, y: sh + 14, w: lw - 18, h: H - sh - 18 },
      bars: { x: lw + 10, y: 10, w: W - lw - 20, h: bh }, check: { x: lw + 12, y: bh + 22, w: W - lw - 24, h: H - bh - 28 } };
  }

  SimLab.createSim({
    ariaLabel: 'A pot of water on a stove burning the chosen fuel, with its temperature, the heat that goes into the water and the heat lost to the air, the smoke and gases the fuel gives off, an ideal-fuel checklist, and a bar chart of how many grams of each fuel it takes to boil the pot',
    mobileAspect: '1 / 1',
    playLabel: 'Light the stove',
    params: [
      { id: 'fuel', label: 'Fuel', type: 'select', value: 'lpg', options: FUELS.map(function (f) {
        return { value: f.id, label: f.name + ' (' + fmtN(f.cv) + ' kJ/kg)' };
      }) },
      { id: 'vol', label: 'Water in the pot', min: 0.5, max: 3, step: 0.5, value: 1, unit: 'L', digits: 1,
        presets: [{ label: '1 L chai', value: 1 }, { label: '2 L dal', value: 2 }, { label: '3 L big pot', value: 3 }] },
      { id: 'ideal', label: 'Ideal stove (all heat goes into the water)', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'T', label: 'Water temperature', short: 'Water', unit: '°C', digits: 1, key: true },
      { id: 'g', label: 'Fuel burned', unit: 'g', digits: 1, key: true },
      { id: 'cv', label: 'Calorific value', short: 'CV', unit: 'kJ/kg', digits: 0, key: true },
      { id: 'need', label: 'Fuel needed to boil', unit: 'g', digits: 1 },
      { id: 'eff', label: 'Stove efficiency', unit: '%', digits: 0 },
      { id: 'qrel', label: 'Heat released by fuel', unit: 'kJ', digits: 0 },
      { id: 'qin', label: 'Heat into the water', unit: 'kJ', digits: 0 },
      { id: 'qlost', label: 'Heat lost to the air', unit: 'kJ', digits: 0 },
      { id: 'min', label: 'Cooking time (real)', unit: 'min', digits: 1 },
      { id: 'ash', label: 'Ash left (rough)', unit: 'g', digits: 0 }
    ],
    graph: { title: 'Water temperature vs grams of fuel burned', yLabel: '°C', xLabel: 'fuel burned (g)', yMin: 20, yMax: 105,
      xMax: function () { return gBoilSel; },
      series: [{ label: 'Your fuel', color: '--sim-1' }, { label: 'Wood (chulha)', color: '--sim-2' }, { label: 'LPG', color: '--sim-3' }, { label: 'Hydrogen', color: '--sim-4' }] },
    reset: function (sim) {
      st.qRel = 0; st.T = T0; st.done = false;
      gBoilSel = gramsToBoil(sim, fuel(sim));
      pushGraph(sim);
    },
    update: function (sim, dt) {
      if (st.done) return;
      var f = fuel(sim), e = effOf(sim, f), qMax = qWater(sim) / e;
      st.qRel = Math.min(qMax, st.qRel + f.P * dt * SPEED);
      st.T = Math.min(TB, T0 + st.qRel * e / (sim.p.vol * C_WATER));
      if (st.qRel >= qMax - 1e-9) { st.T = TB; st.done = true; pushGraph(sim); return; }
      var stepG = gBoilSel / 120, g = grams(sim);
      if (Math.floor(g / stepG) !== Math.floor((st.qRel - f.P * dt * SPEED) / f.cv * 1000 / stepG)) pushGraph(sim);
    },
    finished: function () { return st.done; },
    readout: function (sim) {
      var f = fuel(sim), e = effOf(sim, f), g = grams(sim);
      return { T: st.T, g: g, cv: f.cv, need: gramsToBoil(sim, f), eff: e * 100, qrel: st.qRel, qin: st.qRel * e,
        qlost: st.qRel * (1 - e), min: minutes(sim), ash: g * f.ash };
    },
    status: function (sim) {
      var f = fuel(sim);
      if (st.done) return 'Boiled with ' + fmtG(grams(sim)) + ' g of ' + (/^[A-Z]{2}/.test(f.short) ? f.short : f.short.toLowerCase()) + ' · ' + f.note;
      if (sim.time > 0) return 'Heating · ' + Math.round(st.T) + ' °C · time runs 30× faster';
      return f.note;
    },
    pointer: {
      down: function (sim, x, y) {
        for (var i = 0; i < bars.length; i++) {
          var b = bars[i];
          if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y < b.y1) { if (sim.p.fuel !== b.id) sim.setParam('fuel', b.id, true); return false; }
        }
        if (sim.running) sim.pause(); else sim.play();
        return false;
      },
      hover: function (sim, x, y) {
        return bars.some(function (b) { return x >= b.x0 && x <= b.x1 && y >= b.y0 && y < b.y1; });
      }
    },
    draw: function (sim) {
      var c = sim.colors, L = layout(sim);
      D.clear(sim.ctx, sim.width, sim.height, c.bg);
      drawScene(sim, L.scene);
      drawInfo(sim, L.info, !L.check);
      if (L.check) drawCheck(sim, L.check);
      drawBars(sim, L.bars);
    }
  });
})();
