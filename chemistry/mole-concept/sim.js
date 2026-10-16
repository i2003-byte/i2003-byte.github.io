/* =====================================================================
   Atoms and molecules · The Mole: Counting by Weighing — sim.js
   ---------------------------------------------------------------------
   No timed physics (transport:false). A sample sits on a balance; the
   chain beside it converts

     mass (g) ÷ molar mass (g/mol) = moles
     moles × 6.022 × 10²³ = particles (atoms, molecules or formula units)
     particles × atoms in each particle = atoms

   "One mole of each" puts 1 mol of five substances side by side as
   cubes drawn to the same scale (edge = ∛(M / density)).
   Challenges ask for a mass from a number of moles, particles or atoms.
   Molar masses use rounded atomic masses (Cl 35.5, Cu 63.5).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var NA = 6.022e23;

  // M g/mol, rho g/cm³ (gases: g/L at 25 °C), n atoms per particle, particle name
  var SUBS = {
    C:     { name: 'carbon (graphite)', f: 'C', M: 12, rho: 2.26, n: 1, part: 'atoms', look: 'graphite', col: '#3f3f46' },
    H2O:   { name: 'water', f: 'H₂O', M: 18, rho: 1.00, n: 3, part: 'molecules', look: 'water', col: '#60a5fa', liquid: true },
    NaCl:  { name: 'common salt', f: 'NaCl', M: 58.5, rho: 2.16, n: 2, part: 'formula units', look: 'salt', col: '#f1f5f9' },
    sugar: { name: 'sugar (sucrose)', f: 'C₁₂H₂₂O₁₁', M: 342, rho: 1.59, n: 45, part: 'molecules', look: 'sugar', col: '#fefce8' },
    Fe:    { name: 'iron', f: 'Fe', M: 56, rho: 7.87, n: 1, part: 'atoms', look: 'metal', col: '#71717a' },
    Al:    { name: 'aluminium', f: 'Al', M: 27, rho: 2.70, n: 1, part: 'atoms', look: 'metal', col: '#cbd5e1' },
    Cu:    { name: 'copper', f: 'Cu', M: 63.5, rho: 8.96, n: 1, part: 'atoms', look: 'metal', col: '#c2410c' },
    Mg:    { name: 'magnesium', f: 'Mg', M: 24, rho: 1.74, n: 1, part: 'atoms', look: 'metal', col: '#d4d4d8' },
    CaCO3: { name: 'chalk (calcium carbonate)', f: 'CaCO₃', M: 100, rho: 2.71, n: 5, part: 'formula units', look: 'chalk', col: '#fafaf9' },
    O2:    { name: 'oxygen gas', f: 'O₂', M: 32, rho: 1.31, n: 2, part: 'molecules', look: 'o2', col: '#fca5a5', gas: true },
    CO2:   { name: 'carbon dioxide gas', f: 'CO₂', M: 44, rho: 1.80, n: 3, part: 'molecules', look: 'co2', col: '#cbd5e1', gas: true }
  };
  var ORDER = ['C', 'H2O', 'NaCl', 'sugar', 'Fe', 'Al', 'Cu', 'Mg', 'CaCO3', 'O2', 'CO2'];
  var COMPARE = ['C', 'Fe', 'H2O', 'NaCl', 'sugar'];

  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function sci(x, sig) {
    if (!isFinite(x) || x <= 0) return '0';
    var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
    if (m >= 9.995) { m /= 10; e += 1; }
    if (e >= -2 && e < 4) return M.fmt(x, Math.max(0, (sig || 3) - 1 - e));
    return m.toFixed((sig || 3) - 1) + ' × 10' + String(e).split('').map(function (ch) { return SUP[ch]; }).join('');
  }

  var st = { ch: null, seed: 1 };
  function sub(p) { return SUBS[p.sub] || SUBS.C; }
  function calc(p) {
    var s = sub(p), mol = p.mass / s.M, parts = mol * NA;
    return { s: s, mol: mol, parts: parts, atoms: parts * s.n, vol: p.mass / s.rho };   // vol: cm³ (or L for a gas)
  }

  /* ---------- challenges ---------- */
  function newChallenge(sim) {
    var r = M.rng(st.seed = (st.seed * 7919 + 13) % 100003 || 1);
    for (var i = 0; i < 3; i++) r();
    var key = ORDER[Math.floor(r() * 9)], s = SUBS[key], kind = Math.floor(r() * 3);
    var amts = [0.25, 0.5, 1, 1.5, 2, 2.5, 3], n = amts[Math.floor(r() * amts.length)];
    while (n * s.M > 400) n /= 2;
    var text;
    if (kind === 0) text = 'Weigh out ' + String(n) + ' mol of ' + s.name;
    else if (kind === 1) text = 'Weigh out ' + sci(n * NA, 4) + ' ' + s.part + ' of ' + s.name;
    else text = 'Weigh out ' + s.name + ' that holds ' + sci(n * NA * s.n, 4) + ' atoms in all';
    st.ch = { key: key, n: n, mass: n * s.M, text: text, kind: kind };
    sim.setParam('mode', 'challenge');
    sim.setParam('sub', key);
    sim.setParam('mass', 1);
  }
  function solved(p) {
    var c = st.ch;
    return !!c && p.sub === c.key && Math.abs(p.mass - c.mass) <= Math.max(0.26, c.mass * 0.01);
  }

  SimLab.createSim({
    ariaLabel: 'A sample of a substance on a digital balance, with a magnified view of its particles. Beside it a chain of boxes turns the mass in grams into moles, then into the number of particles, then into the number of atoms. Another view shows one mole each of carbon, iron, water, salt and sugar as cubes drawn to the same scale',
    transport: false,
    mobileAspect: '1 / 1.05',
    params: [
      { id: 'mode', label: 'View', type: 'select', value: 'weigh', options: [
        { value: 'weigh', label: 'Weigh a sample and count its particles' },
        { value: 'compare', label: 'One mole of each, side by side' },
        { value: 'challenge', label: 'Challenge: weigh the right amount' }] },
      { id: 'sub', label: 'Substance', type: 'select', value: 'C', options: ORDER.map(function (k) { return { value: k, label: SUBS[k].name + ' (' + SUBS[k].f + ', ' + SUBS[k].M + ' g/mol)' }; }) },
      { id: 'mass', label: 'Mass on the balance', min: 0.5, max: 400, step: 0.5, value: 12, unit: 'g', presets: [1, 12, 18, 58.5, 100, 342] }
    ],
    buttonsTitle: 'Actions',
    buttons: [
      { label: 'Take exactly 1 mole', primary: true, onClick: function (sim) { sim.setParam('mass', sub(sim.p).M); if (sim.p.mode === 'compare') sim.setParam('mode', 'weigh'); } },
      { label: '🎯 New challenge', onClick: function (sim) { newChallenge(sim); } },
      { label: '💡 Hint', onClick: function (sim) {
        var c = st.ch;
        if (sim.p.mode !== 'challenge' || !c) { sim.toast('Press “New challenge” first.'); return; }
        var s = SUBS[c.key];
        sim.toast(c.kind === 0 ? 'mass = moles × molar mass = ' + c.n + ' × ' + s.M + ' g'
          : c.kind === 1 ? 'Divide by 6.022 × 10²³ to get moles first, then multiply by ' + s.M + ' g/mol'
          : 'Each ' + s.part.replace(/s$/, '') + ' of ' + s.f + ' has ' + s.n + ' atom' + (s.n > 1 ? 's' : '') + '. Find the particles, then the moles, then the mass');
      } }
    ],
    readouts: [
      { id: 'mol', label: 'Amount of substance', short: 'Moles', unit: 'mol', digits: 3, key: true },
      { id: 'parts', label: 'Number of particles', short: 'Particles', key: true },
      { id: 'atoms', label: 'Number of atoms', short: 'Atoms', key: true },
      { id: 'M', label: 'Molar mass', unit: 'g/mol', digits: 1 },
      { id: 'one', label: 'Mass of one particle', unit: 'g' },
      { id: 'vol', label: 'Space it takes up' },
      { id: 'count', label: 'Time to count them, one per second' }
    ],
    reset: function () {},
    onParam: function (sim, id) {
      if (id === 'mode' && sim.p.mode === 'challenge' && !st.ch) setTimeout(function () { newChallenge(sim); }, 0);
      return true;
    },
    readout: function (sim) {
      var x = calc(sim.p), s = x.s, yrs = x.parts / 3.156e7;
      return {
        mol: x.mol, parts: sci(x.parts) + ' ' + s.part, atoms: sci(x.atoms), M: s.M,
        one: sci(s.M / NA),
        vol: s.gas ? M.fmt(x.vol, 1) + ' L of gas at 25 °C' : M.fmt(x.vol, 1) + ' cm³',
        count: sci(yrs) + ' years'
      };
    },
    status: function (sim) {
      var p = sim.p;
      if (p.mode === 'compare') return 'Each pile has the same number of particles: 6.022 × 10²³';
      if (p.mode === 'challenge') {
        if (!st.ch) return 'Press “New challenge”';
        return solved(p) ? '✓ Correct! ' + M.fmt(st.ch.mass, 2) + ' g. Try another challenge' : st.ch.text;
      }
      var mol = calc(p).mol;
      return Math.abs(mol - 1) < 0.002 ? 'Exactly 1 mole: 6.022 × 10²³ ' + sub(p).part : M.fmt(mol, 3) + ' mol of ' + sub(p).name;
    },
    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, W = sim.width, H = sim.height, p = sim.p;
      D.clear(ctx, W, H, c.bg);
      var small = W < 560 || H < 420;
      if (p.mode === 'compare') { drawCompare(ctx, c, W, H, small); return; }
      var side = W >= 560 && W / H >= 1.15, g = 8, top = 0, sb, cb;
      if (p.mode === 'challenge') {
        var ok = solved(p), txt = st.ch ? (ok ? '✓ ' : '🎯 ') + st.ch.text : 'Press “New challenge”';
        var bh = small ? 26 : 32;
        D.roundRect(ctx, g, g, W - 2 * g, bh, 8, ok ? D.alpha(c.success, 0.25) : D.alpha(c.accent, 0.16), ok ? c.success : D.alpha(c.accent, 0.6), 1.5);
        D.text(ctx, txt, W / 2, g + bh / 2, { color: c.ink, size: small ? 11 : 14, weight: 700, align: 'center', fit: W });
        top = bh + g;
      }
      if (side) { sb = [g, top + g, W * 0.5 - g, H - top - 2 * g]; cb = [W * 0.5 + g, top + g, W * 0.5 - 2 * g, H - top - 2 * g]; }
      else { var sh = Math.round((H - top) * 0.5); sb = [g, top + g, W - 2 * g, sh - g]; cb = [g, top + sh + g, W - 2 * g, H - top - sh - 2 * g]; }
      drawBalance(ctx, c, sb, p, small);
      drawChain(ctx, c, cb, p, small);
    }
  });

  /* ---------- balance, sample and magnifier ---------- */
  function drawBalance(ctx, c, b, p, small) {
    var x0 = b[0], y0 = b[1], w = b[2], h = b[3], x = calc(p), s = x.s;
    D.roundRect(ctx, x0, y0, w, h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.2), 1);
    var magR = Math.min(h * 0.36, w * 0.2), bw = Math.min(w - magR * 2 - 30, 260), bx = x0 + 10, bh = Math.max(26, h * 0.17), by = y0 + h - bh - 8;
    if (bw < 120) { bw = w - 20; magR = Math.min(magR, h * 0.24); }
    D.roundRect(ctx, bx, by, bw, bh, 7, c.light ? '#cbd5e1' : '#334155', D.alpha(c.ink, 0.4), 1);
    var dw = Math.min(bw * 0.66, 160), dh = bh * 0.62, dx = bx + (bw - dw) / 2, dy = by + (bh - dh) / 2;
    D.roundRect(ctx, dx, dy, dw, dh, 4, '#0b1a12', '#14532d', 1);
    D.text(ctx, M.fmt(p.mass, p.mass < 100 ? 2 : 1) + ' g', dx + dw - 6, dy + dh / 2 + 1, { color: '#4ade80', size: Math.min(dh * 0.72, small ? 16 : 22), weight: 700, align: 'right', font: 'ui-monospace, Menlo, monospace' });
    var panY = by - 5, panW = bw * 0.72, cx = bx + bw / 2;
    D.roundRect(ctx, cx - panW / 2, panY, panW, 5, 2, c.light ? '#94a3b8' : '#64748b');
    var room = panY - y0 - (small ? 22 : 30);
    // sample size: same scale for every solid / liquid (∛ of the volume), gases in a balloon
    if (s.gas) {
      var Lmax = 400 / 1.31, r = room * 0.42 * Math.cbrt(x.vol / Lmax) + 6, byy = panY - room * 0.12 - r;
      D.line(ctx, cx, panY, cx, byy + r, D.alpha(c.ink, 0.5), 1.5);
      D.circle(ctx, cx, byy, r, D.alpha(s.col, 0.35), D.alpha(c.ink, 0.6), 1.5);
      D.text(ctx, M.fmt(x.vol, 1) + ' L', cx, byy, { color: c.ink, size: small ? 10 : 12, weight: 700, align: 'center' });
    } else if (s.liquid) {
      var gw = Math.min(panW * 0.8, room * 0.8), gh = room * 0.95, gx = cx - gw / 2, gy = panY - gh, lev = gh * 0.92 * (x.vol / 400);
      ctx.fillStyle = D.alpha(s.col, 0.5); ctx.fillRect(gx + 2, panY - 2 - lev, gw - 4, lev);
      ctx.strokeStyle = D.alpha(c.ink, 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, panY); ctx.lineTo(gx + gw, panY); ctx.lineTo(gx + gw, gy); ctx.stroke();
      for (var m = 1; m <= 4; m++) { var my = panY - gh * 0.92 * m / 4; D.line(ctx, gx + gw - 8, my, gx + gw, my, D.alpha(c.ink, 0.5), 1); }
      D.text(ctx, '400 mL', gx + gw + 3, panY - gh * 0.92, { color: c.muted, size: 9 });
    } else {
      var hw = Math.min(panW * 0.48, room * 1.1) * Math.cbrt(x.vol / 250), hh = hw * 0.75;
      hw = Math.max(hw, 6); hh = Math.max(hh, 4);
      ctx.beginPath(); ctx.moveTo(cx - hw, panY); ctx.quadraticCurveTo(cx - hw * 0.3, panY - hh * 1.25, cx, panY - hh); ctx.quadraticCurveTo(cx + hw * 0.3, panY - hh * 1.25, cx + hw, panY); ctx.closePath();
      var gr = ctx.createLinearGradient(0, panY - hh, 0, panY); gr.addColorStop(0, s.col); gr.addColorStop(1, D.alpha(s.col, 0.7));
      ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = D.alpha(c.ink, 0.35); ctx.lineWidth = 1; ctx.stroke();
      if (s.look === 'metal') { var rr = M.rng(4); for (var i = 0; i < 14; i++) D.circle(ctx, cx + (rr() - 0.5) * hw * 1.4, panY - rr() * hh * 0.8, 1.2, 'rgba(255,255,255,0.5)'); }
    }
    D.text(ctx, s.name + ' · ' + s.f, x0 + 10, y0 + (small ? 12 : 16), { color: c.ink, size: small ? 11 : 13, weight: 700, fit: x0 + w - magR * 2 });
    // magnifier
    var mx = x0 + w - magR - 10, my = y0 + (small ? 22 : 30) + magR;
    if (bw === w - 20) { mx = x0 + w - magR - 8; my = y0 + magR + 20; }
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, magR, 0, Math.PI * 2); ctx.fillStyle = c.light ? '#f8fafc' : '#0b1220'; ctx.fill(); ctx.clip();
    drawParticles(ctx, s, mx, my, magR);
    ctx.restore();
    D.circle(ctx, mx, my, magR, null, D.alpha(c.ink, 0.6), 3);
    D.line(ctx, mx - magR * 0.72, my + magR * 0.72, mx - magR * 1.05, my + magR * 1.05, D.alpha(c.ink, 0.6), 5);
    D.text(ctx, '× 50 million', mx, my + magR + (small ? 9 : 11), { color: c.muted, size: small ? 9 : 10, align: 'center' });
  }

  function atom(ctx, x, y, r, col) { D.circle(ctx, x, y, r, col, 'rgba(15,23,42,0.5)', 1); }
  var COL = { C: '#27272a', O: '#ef4444', H: '#f8fafc', Na: '#a78bfa', Cl: '#22c55e', Ca: '#4ade80' };
  function drawParticles(ctx, s, cx, cy, R) {
    var a = R / 6, rr = M.rng(11), i, j, x, y;
    if (s.look === 'graphite') {
      for (j = -4; j <= 4; j++) for (i = -5; i <= 5; i++) {
        x = cx + (i + (j % 2 ? 0.5 : 0)) * a * 1.5; y = cy + j * a * 1.3;
        D.line(ctx, x, y, x + a * 1.5, y, 'rgba(120,120,130,0.6)', 1.5);
        atom(ctx, x, y, a * 0.42, '#3f3f46');
      }
    } else if (s.look === 'metal') {
      for (j = -4; j <= 4; j++) for (i = -4; i <= 4; i++) atom(ctx, cx + (i + (j % 2 ? 0.5 : 0)) * a * 1.25, cy + j * a * 1.08, a * 0.6, s.col);
    } else if (s.look === 'salt') {
      for (j = -4; j <= 4; j++) for (i = -4; i <= 4; i++) { var na = (i + j) % 2 === 0; atom(ctx, cx + i * a * 1.2, cy + j * a * 1.2, na ? a * 0.36 : a * 0.58, na ? COL.Na : COL.Cl); }
    } else if (s.look === 'chalk') {
      for (j = -3; j <= 3; j++) for (i = -3; i <= 3; i++) {
        x = cx + i * a * 1.8; y = cy + j * a * 1.8;
        if ((i + j) % 2 === 0) atom(ctx, x, y, a * 0.5, COL.Ca);
        else { for (var k = 0; k < 3; k++) { var an = k * 2.094 + 0.3; atom(ctx, x + Math.cos(an) * a * 0.5, y + Math.sin(an) * a * 0.5, a * 0.32, COL.O); } atom(ctx, x, y, a * 0.26, COL.C); }
      }
    } else if (s.look === 'water' || s.look === 'o2' || s.look === 'co2' || s.look === 'sugar') {
      var n = s.look === 'water' ? 34 : s.look === 'sugar' ? 9 : 5;
      for (i = 0; i < n; i++) {
        x = cx + (rr() - 0.5) * R * 1.9; y = cy + (rr() - 0.5) * R * 1.9; var t = rr() * 6.28;
        if (s.look === 'water') { atom(ctx, x + Math.cos(t + 0.9) * a * 0.55, y + Math.sin(t + 0.9) * a * 0.55, a * 0.24, COL.H); atom(ctx, x + Math.cos(t - 0.9) * a * 0.55, y + Math.sin(t - 0.9) * a * 0.55, a * 0.24, COL.H); atom(ctx, x, y, a * 0.42, COL.O); }
        else if (s.look === 'o2') { atom(ctx, x - Math.cos(t) * a * 0.3, y - Math.sin(t) * a * 0.3, a * 0.42, COL.O); atom(ctx, x + Math.cos(t) * a * 0.3, y + Math.sin(t) * a * 0.3, a * 0.42, COL.O); }
        else if (s.look === 'co2') { atom(ctx, x - Math.cos(t) * a * 0.6, y - Math.sin(t) * a * 0.6, a * 0.38, COL.O); atom(ctx, x + Math.cos(t) * a * 0.6, y + Math.sin(t) * a * 0.6, a * 0.38, COL.O); atom(ctx, x, y, a * 0.34, COL.C); }
        else {
          // a sugar molecule: two rings of carbon and oxygen with hydrogens
          for (var q = 0; q < 2; q++) { var ox = x + (q ? a * 0.9 : -a * 0.9); for (var m = 0; m < 6; m++) { var an2 = t + m * 1.047; atom(ctx, ox + Math.cos(an2) * a * 1.15, y + Math.sin(an2) * a * 1.15, a * 0.18, COL.H); atom(ctx, ox + Math.cos(an2) * a * 0.6, y + Math.sin(an2) * a * 0.6, a * 0.24, m === 0 ? COL.O : COL.C); } }
          atom(ctx, x, y, a * 0.24, COL.O);
        }
      }
    }
  }

  /* ---------- conversion chain ---------- */
  function drawChain(ctx, c, b, p, small) {
    var x0 = b[0], y0 = b[1], w = b[2], h = b[3], x = calc(p), s = x.s, fs = small ? 11 : 13;
    D.roundRect(ctx, x0, y0, w, h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.2), 1);
    var boxes = [
      ['mass', M.fmt(p.mass, 2) + ' g', c.s1],
      ['amount', sci(x.mol, 4) + ' mol', c.s2],
      [s.part, sci(x.parts), c.s3],
      ['atoms', sci(x.atoms), c.s4]
    ];
    var ops = ['÷ ' + s.M + ' g/mol', '× 6.022 × 10²³', '× ' + s.n + ' atom' + (s.n > 1 ? 's' : '') + ' each'];
    var horiz = w > 520 && h < 200;
    if (!horiz) {
      var pad = small ? 6 : 10, bxw = Math.min(w * (small ? 0.54 : 0.46), 220), rowH = (h - pad * 2) / 4, bhh = Math.min(rowH * 0.6, 44);
      boxes.forEach(function (bx, i) {
        var yy = y0 + pad + i * rowH, xx = x0 + 10;
        D.roundRect(ctx, xx, yy, bxw, bhh, 7, D.alpha(bx[2], 0.18), bx[2], 1.5);
        if (bhh < 34) {
          D.text(ctx, bx[0], xx + 6, yy + bhh / 2, { color: c.muted, size: 9, weight: 600 });
          D.text(ctx, bx[1], xx + bxw - 6, yy + bhh / 2, { color: c.ink, size: Math.min(fs, bhh * 0.55), weight: 700, align: 'right', font: 'ui-monospace, Menlo, monospace' });
        } else {
          D.text(ctx, bx[0], xx + 8, yy + bhh * 0.3, { color: c.muted, size: small ? 9 : 11, weight: 600 });
          D.text(ctx, bx[1], xx + 8, yy + bhh * 0.7, { color: c.ink, size: fs + 1, weight: 700, font: 'ui-monospace, Menlo, monospace', fit: xx + bxw + 2 });
        }
        if (i < 3) {
          var ay = yy + bhh, ay2 = yy + rowH;
          D.arrow(ctx, xx + 22, ay + 1, xx + 22, ay2 - 1, D.alpha(c.ink, 0.6), 1.5, 6);
          D.text(ctx, ops[i], xx + 32, (ay + ay2) / 2, { color: c.ink, size: small ? 10 : 12, weight: 600 });
        }
      });
      // side notes
      var nx = x0 + bxw + 18, nw = x0 + w - nx - 6;
      if (nw > 90) {
        var notes = [
          '1 mol of ' + s.f + ' = ' + s.M + ' g',
          'one ' + (s.part === 'atoms' ? 'atom' : s.part === 'molecules' ? 'molecule' : 'formula unit') + ' = ' + sci(s.M / NA) + ' g',
          'counting 1 per second:',
          sci(x.parts / 3.156e7) + ' years',
          '(the Universe is 1.4 × 10¹⁰ years old)'
        ];
        notes.forEach(function (t, i) {
          var fz = i === 4 ? (small ? 8.5 : 10) : (small ? 10 : 12);
          ctx.font = (i === 3 ? 700 : 500) + ' ' + fz + 'px Inter, system-ui, sans-serif';
          fz = Math.max(7, Math.min(fz, fz * nw / ctx.measureText(t).width));
          D.text(ctx, t, nx, y0 + pad + 10 + i * (small ? 15 : 19), { color: i === 3 ? c.ink : c.muted, size: fz, weight: i === 3 ? 700 : 500 });
        });
      }
    } else {
      var bw2 = (w - 20 - 3 * 24) / 4, bh2 = Math.min(h * 0.42, 58), yy2 = y0 + h * 0.18;
      boxes.forEach(function (bx, i) {
        var xx = x0 + 10 + i * (bw2 + 24);
        D.roundRect(ctx, xx, yy2, bw2, bh2, 7, D.alpha(bx[2], 0.18), bx[2], 1.5);
        D.text(ctx, bx[0], xx + 8, yy2 + bh2 * 0.3, { color: c.muted, size: 11, weight: 600 });
        D.text(ctx, bx[1], xx + 8, yy2 + bh2 * 0.7, { color: c.ink, size: fs, weight: 700, font: 'ui-monospace, Menlo, monospace', fit: xx + bw2 + 2 });
        if (i < 3) { D.arrow(ctx, xx + bw2 + 2, yy2 + bh2 / 2, xx + bw2 + 22, yy2 + bh2 / 2, D.alpha(c.ink, 0.6), 1.5, 6); D.text(ctx, ops[i], xx + bw2 + 12, yy2 + bh2 + 14, { color: c.ink, size: 11, weight: 600, align: 'center' }); }
      });
    }
  }

  /* ---------- one mole of each ---------- */
  function drawCompare(ctx, c, W, H, small) {
    var g = 8, items = COMPARE.map(function (k) { var s = SUBS[k]; return { s: s, edge: Math.cbrt(s.M / s.rho) }; });
    var title = small ? 22 : 30, foot = small ? 22 : 26, labH = small ? 44 : 54, labW = small ? 112 : 140;
    var rows = W < 640 ? [items.slice(0, 3), items.slice(3)] : [items];
    var rowH = (H - title - foot) / rows.length;
    function colW(it, sc) { return Math.max(it.edge * sc * 1.32 + 10, labW); }
    function fits(sc) {
      return rows.every(function (row) {
        var tw = row.reduce(function (a, it) { return a + colW(it, sc); }, 0);
        var mh = Math.max.apply(null, row.map(function (it) { return it.edge * sc * 1.32; }));
        return tw <= W - 2 * g && mh <= rowH - labH - 8;
      });
    }
    var lo = 1, hi = 200;
    for (var it = 0; it < 30; it++) { var mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    var scale = lo;   // px per cm
    D.text(ctx, 'One mole of each: 6.022 × 10²³ particles, drawn to scale', W / 2, g + title / 2, { color: c.ink, size: small ? 11 : 14, weight: 700, align: 'center', fit: W });
    function cube(x, base, e, col) {
      var px = e * scale, d = px * 0.3;
      ctx.fillStyle = col; ctx.fillRect(x, base - px, px, px);
      ctx.fillStyle = D.alpha('#ffffff', 0.25); ctx.beginPath(); ctx.moveTo(x, base - px); ctx.lineTo(x + d, base - px - d); ctx.lineTo(x + px + d, base - px - d); ctx.lineTo(x + px, base - px); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(x + px, base); ctx.lineTo(x + px + d, base - d); ctx.lineTo(x + px + d, base - px - d); ctx.lineTo(x + px, base - px); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(15,23,42,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x, base - px, px, px);
    }
    function label(it, x, w, y) {
      var s = it.s, fs = small ? 9.5 : 11.5;
      D.text(ctx, s.f + '  ' + s.M + ' g', x + w / 2, y, { color: c.ink, size: fs + 1.5, weight: 700, align: 'center' });
      D.text(ctx, M.fmt(s.M / s.rho, 1) + ' cm³', x + w / 2, y + fs + 4, { color: c.muted, size: fs, align: 'center' });
      D.text(ctx, sci(NA * s.n, 2) + ' atoms', x + w / 2, y + 2 * fs + 8, { color: c.muted, size: fs, align: 'center' });
    }
    rows.forEach(function (row, ri) {
      var widths = row.map(function (it) { return colW(it, scale); });
      var tw = widths.reduce(function (a, b) { return a + b; }, 0), x = (W - tw) / 2, base = title + rowH * (ri + 1) - labH;
      row.forEach(function (it, i) {
        var e = it.edge * scale;
        cube(x + (widths[i] - e * 1.3) / 2, base, it.edge, it.s.col);
        label(it, x, widths[i], base + (small ? 10 : 13));
        x += widths[i];
      });
    });
    // ruler and gas note
    var rx = g + 6, ry = H - g - 6;
    D.line(ctx, rx, ry, rx + scale, ry, c.ink, 2);
    D.line(ctx, rx, ry - 4, rx, ry + 1, c.ink, 2); D.line(ctx, rx + scale, ry - 4, rx + scale, ry + 1, c.ink, 2);
    D.text(ctx, '1 cm', rx + scale + 6, ry - 2, { color: c.muted, size: small ? 9 : 11 });
    D.text(ctx, small ? '1 mol of gas ≈ 24 L (25 °C)' : '1 mol of any gas at 25 °C ≈ 24 L: a cube 29 cm wide', W - g - 4, ry - 2, { color: c.muted, size: small ? 9 : 11, align: 'right' });
  }
})();
