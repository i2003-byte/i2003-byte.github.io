/* =====================================================================
   Atoms and molecules · Conservation of Mass and Fixed Proportions — sim.js
   ---------------------------------------------------------------------
   Reactions on a top-pan balance (0.01 g). Play mixes / lights the
   reactants and runs the reaction over a few seconds.

   Masses (0.01 mol of the limiting substance, molar masses rounded):
     BaCl₂ 2.08 g + Na₂SO₄ 1.42 g → BaSO₄ 2.33 g + 2 NaCl 1.17 g
     NaHCO₃ 0.84 g + CH₃COOH 0.60 g → CH₃COONa 0.82 g + H₂O 0.18 g + CO₂ 0.44 g
     2 Mg 0.24 g + O₂ 0.16 g (from the air) → 2 MgO 0.40 g
   Open container: a gas that is made escapes (balance goes down), a gas
   taken from the air is added (balance goes up). Closed: nothing gets
   in or out, so the reading never changes.

   Fixed proportions: an element pair always combines in the same mass
   ratio (H : O = 1 : 8 in water, Mg : O = 3 : 2 in MgO, C : O = 3 : 8 in
   CO₂). Whatever is in excess is left over.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  var EXPS = {
    precip: { kind: 'mix', eq: 'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl',
      re: [['barium chloride', 2.08, '#93c5fd'], ['sodium sulphate', 1.42, '#c4b5fd']],
      pr: [['barium sulphate (white solid)', 2.33, '#f1f5f9'], ['sodium chloride (dissolved)', 1.17, '#a5f3fc']],
      gas: 0, base: 141.40, lid: 3.10, lidName: 'cork' },
    fizz: { kind: 'fizz', eq: 'NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂↑',
      re: [['baking soda', 0.84, '#f8fafc'], ['acetic acid (in vinegar)', 0.60, '#fde68a']],
      pr: [['sodium acetate', 0.82, '#a7f3d0'], ['water', 0.18, '#7dd3fc'], ['carbon dioxide gas', 0.44, '#cbd5e1']],
      gas: -0.44, base: 123.70, lid: 2.20, lidName: 'cap' },
    burn: { kind: 'burn', eq: '2Mg + O₂ → 2MgO',
      re: [['magnesium', 0.24, '#cbd5e1'], ['oxygen (from the air)', 0.16, '#fca5a5']],
      pr: [['magnesium oxide (white ash)', 0.40, '#f8fafc']],
      gas: 0.16, base: 18.50, closedBase: 164.00, lidName: 'sealed flask' }
  };
  var RATIOS = {
    water: { a: 'hydrogen', b: 'oxygen', p: 'water', ra: 1, rb: 8, ca: '#e2e8f0', cb: '#f87171', cp: '#60a5fa', sym: 'H₂O' },
    mgo: { a: 'magnesium', b: 'oxygen', p: 'magnesium oxide', ra: 3, rb: 2, ca: '#94a3b8', cb: '#f87171', cp: '#f8fafc', sym: 'MgO' },
    co2: { a: 'carbon', b: 'oxygen', p: 'carbon dioxide', ra: 3, rb: 8, ca: '#52525b', cb: '#f87171', cp: '#a3a3a3', sym: 'CO₂' }
  };
  function smooth(x) { x = M.clamp(x, 0, 1); return x * x * (3 - 2 * x); }

  var st = { t: 0 };
  function isRatio(p) { return p.exp.indexOf('ratio-') === 0; }
  function prog() { return smooth((st.t - 1.0) / 4); }
  function escaped() { return smooth((st.t - 1.4) / 4.6); }

  function reading(p) {
    if (isRatio(p)) return p.a + p.b + 95.00;                          // sealed jar 95.00 g
    var e = EXPS[p.exp], re = e.re.reduce(function (s, r) { return s + r[1]; }, 0);
    if (e.kind === 'burn') {
      if (p.closed) return e.closedBase + re;                           // the oxygen is already inside
      return e.base + e.re[0][1] + e.gas * prog();
    }
    var r = e.base + re + (p.closed ? e.lid : 0);
    if (!p.closed && e.gas < 0) r += e.gas * escaped();
    return r;
  }
  function ratioResult(p) {
    var R = RATIOS[p.exp.slice(6)], useA = Math.min(p.a, p.b * R.ra / R.rb), useB = useA * R.rb / R.ra;
    return { R: R, useA: useA, useB: useB, prod: useA + useB, leftA: p.a - useA, leftB: p.b - useB };
  }

  SimLab.createSim({
    ariaLabel: 'A container on a digital top-pan balance. Play mixes two solutions, drops baking soda into vinegar, or burns a magnesium ribbon, in an open or closed container, and the balance reading shows whether the mass changes. Bars beside it compare the mass of the substances before and after, including any gas that escapes or is taken from the air. In the fixed-ratio tests two elements react in a sealed jar and always combine in the same mass ratio, leaving the extra behind',
    playLabel: 'Start the reaction',
    mobileAspect: '1 / 1',
    params: [
      { id: 'exp', label: 'Experiment', type: 'select', value: 'precip', options: [
        { value: 'precip', label: 'Barium chloride + sodium sulphate (forms a solid)' },
        { value: 'fizz', label: 'Baking soda + vinegar (makes a gas)' },
        { value: 'burn', label: 'Burning magnesium ribbon (uses oxygen)' },
        { value: 'ratio-water', label: 'Fixed ratio: hydrogen + oxygen → water' },
        { value: 'ratio-mgo', label: 'Fixed ratio: magnesium + oxygen → magnesium oxide' },
        { value: 'ratio-co2', label: 'Fixed ratio: carbon + oxygen → carbon dioxide' }] },
      { id: 'closed', label: 'Closed container (nothing gets in or out)', type: 'toggle', value: false, help: 'For the first three experiments. The fixed-ratio tests always use a sealed jar.' },
      { id: 'a', label: 'Fixed ratio: mass of the first element', min: 0.5, max: 12, step: 0.5, value: 2, unit: 'g', help: 'Hydrogen, magnesium or carbon.' },
      { id: 'b', label: 'Fixed ratio: mass of oxygen', min: 1, max: 40, step: 1, value: 20, unit: 'g' }
    ],
    readouts: [
      { id: 'read', label: 'Balance reading', unit: 'g', digits: 2, key: true },
      { id: 'chg', label: 'Change in the reading', short: 'Change', unit: 'g', digits: 2, key: true },
      { id: 'gas', label: 'Gas out (−) or in from the air (+)', short: 'Gas in/out', unit: 'g', digits: 2, key: true },
      { id: 'before', label: 'Mass of reacting substances before', unit: 'g', digits: 2 },
      { id: 'after', label: 'Mass of products (including any gas)', unit: 'g', digits: 2 },
      { id: 'left', label: 'Left over (fixed-ratio tests)' }
    ],
    graph: { title: 'Balance reading during the reaction', xLabel: 'time (s)', yLabel: 'g', xMax: 8, includeZero: false, series: [{ label: 'balance reading', color: '--sim-1' }] },

    reset: function (sim) { st.t = 0; st.start = reading(sim.p); },
    sample: function (sim) { return [reading(sim.p)]; },
    finished: function () { return st.t >= 8; },
    update: function (sim, dt) { st.t += dt; },
    readout: function (sim) {
      var p = sim.p, r = reading(p), out = { read: r, chg: r - st.start, gas: '—', before: '—', after: '—', left: '—' };
      if (isRatio(p)) {
        var x = ratioResult(p), k = prog();
        out.gas = 0; out.before = x.useA + x.useB; out.after = x.prod * k;
        out.left = k < 1 ? 'reacting…' : (x.leftA > 0.004 ? M.fmt(x.leftA, 2) + ' g ' + x.R.a : x.leftB > 0.004 ? M.fmt(x.leftB, 2) + ' g oxygen' : 'nothing');
      } else {
        var e = EXPS[p.exp], sumR = e.re.reduce(function (s, q) { return s + q[1]; }, 0);
        out.before = sumR; out.after = sumR * prog();
        out.gas = p.closed ? 0 : e.kind === 'burn' ? e.gas * prog() : e.gas * escaped();
      }
      return out;
    },
    status: function (sim) {
      var p = sim.p;
      if (st.t <= 0) return 'Press “Start the reaction” and watch the balance';
      if (st.t < 1) return isRatio(p) ? 'A spark sets off the reaction…' : EXPS[p.exp].kind === 'burn' ? 'Lighting the ribbon…' : 'Tilting the flask to mix…';
      if (st.t < 5.2) return 'Reacting: atoms are rearranged into new substances';
      if (isRatio(p)) return 'Done: the elements combined in a fixed ratio, the extra is left over';
      var e = EXPS[p.exp];
      if (p.closed || e.kind === 'mix') return 'Done: the reading has not changed. Mass is conserved';
      return e.kind === 'burn' ? 'Done: heavier, because oxygen from the air joined the magnesium' : 'Done: lighter, because carbon dioxide escaped into the air';
    },
    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, W = sim.width, H = sim.height, p = sim.p;
      D.clear(ctx, W, H, c.bg);
      var small = W < 560 || H < 420, side = W >= 560 && W / H >= 1.15, gap = 8;
      var sb, pb;
      if (side) { sb = [gap, gap, W * 0.52 - gap, H - gap * 2]; pb = [W * 0.52 + gap, gap, W * 0.48 - gap * 2, H - gap * 2]; }
      else { var sh = Math.round(H * 0.58); sb = [gap, gap, W - gap * 2, sh - gap]; pb = [gap, sh + gap, W - gap * 2, H - sh - gap * 2]; }
      drawScene(ctx, c, sb, p, small);
      drawBars(ctx, c, pb, p, small);
    }
  });

  /* ---------- balance and container ---------- */
  function drawScene(ctx, c, b, p, small) {
    var x0 = b[0], y0 = b[1], w = b[2], h = b[3], fs = small ? 10 : 12;
    D.roundRect(ctx, x0, y0, w, h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.2), 1);
    // balance
    var bw = Math.min(w * 0.8, 280), bx = x0 + (w - bw) / 2, bh = Math.max(34, h * 0.16), by = y0 + h - bh - 8;
    D.roundRect(ctx, bx, by, bw, bh, 8, c.light ? '#cbd5e1' : '#334155', D.alpha(c.ink, 0.4), 1);
    var dw = Math.min(bw * 0.62, 170), dh = bh * 0.6, dx = bx + (bw - dw) / 2, dy = by + (bh - dh) / 2;
    D.roundRect(ctx, dx, dy, dw, dh, 4, '#0b1a12', '#14532d', 1);
    var r = reading(p), changed = Math.abs(r - st.start) > 0.005;
    D.text(ctx, M.fmt(r, 2) + ' g', dx + dw - 8, dy + dh / 2 + 1, { color: changed ? '#fbbf24' : '#4ade80', size: Math.min(dh * 0.7, small ? 18 : 24), weight: 700, align: 'right', font: 'ui-monospace, Menlo, monospace' });
    var panY = by - 6, panW = bw * 0.7;
    D.roundRect(ctx, bx + (bw - panW) / 2, panY, panW, 6, 3, c.light ? '#94a3b8' : '#64748b');
    var cx = x0 + w / 2, room = panY - y0 - (small ? 26 : 34), size = Math.min(room, w * 0.6);
    if (isRatio(p)) drawJar(ctx, c, cx, panY, size, p, small);
    else {
      var e = EXPS[p.exp];
      if (e.kind === 'mix') drawFlask(ctx, c, cx, panY, size, p, e, small);
      else if (e.kind === 'fizz') drawBottle(ctx, c, cx, panY, size, p, small);
      else drawBurn(ctx, c, cx, panY, size, p, small);
    }
    // equation
    var eq = isRatio(p) ? RATIOS[p.exp.slice(6)].a + ' + oxygen → ' + RATIOS[p.exp.slice(6)].p : EXPS[p.exp].eq;
    D.text(ctx, eq, cx, y0 + (small ? 13 : 17), { color: c.ink, bg: D.alpha(c.bg, 0.8), size: fs + 1, weight: 700, align: 'center', pad: 3, fit: x0 + w });
  }
  function tilt() { return st.t > 0.2 && st.t < 1.4 ? Math.sin((st.t - 0.2) / 1.2 * Math.PI) * 0.35 : 0; }

  function drawFlask(ctx, c, cx, base, size, p, e, small) {
    var fh = size * 0.85, fw = fh * 0.8, neck = fw * 0.28, k = prog();
    ctx.save(); ctx.translate(cx, base); ctx.rotate(tilt());
    var top = -fh, nb = -fh * 0.62;
    function flaskPath() { ctx.beginPath(); ctx.moveTo(-neck / 2, top); ctx.lineTo(-neck / 2, nb); ctx.lineTo(-fw / 2, 0); ctx.lineTo(fw / 2, 0); ctx.lineTo(neck / 2, nb); ctx.lineTo(neck / 2, top); }
    // liquid
    ctx.save(); flaskPath(); ctx.closePath(); ctx.clip();
    var lev = -fh * 0.32;
    ctx.fillStyle = 'rgba(147,197,253,0.45)'; ctx.fillRect(-fw, lev, fw * 2, -lev);
    if (k > 0) {
      ctx.fillStyle = 'rgba(241,245,249,' + (0.75 * k * (1 - smooth((st.t - 5) / 3) * 0.6)).toFixed(2) + ')'; ctx.fillRect(-fw, lev, fw * 2, -lev);
      var settle = smooth((st.t - 3) / 5), rr = M.rng(5);
      for (var i = 0; i < 70 * k; i++) { var px = (rr() - 0.5) * fw * 0.9, py = lev + (rr() * (1 - settle) + settle * (0.82 + rr() * 0.18)) * (-lev); D.circle(ctx, px, py - 2, 1.6, '#fff'); }
    }
    ctx.restore();
    flaskPath(); ctx.strokeStyle = D.alpha(c.ink, 0.7); ctx.lineWidth = 2; ctx.stroke();
    // small test tube hanging inside (until it tips)
    var tubeL = fh * 0.42, tw = neck * 0.55, spill = M.clamp((st.t - 0.4) / 0.6, 0, 1);
    ctx.save(); ctx.translate(0, top + fh * 0.08); ctx.rotate(spill * 0.9);
    D.roundRect(ctx, -tw / 2, 0, tw, tubeL, tw / 2, 'rgba(196,181,253,' + (0.6 * (1 - spill)).toFixed(2) + ')', D.alpha(c.ink, 0.6), 1.5);
    ctx.restore();
    D.line(ctx, 0, top - 2, 0, top + fh * 0.08, D.alpha(c.ink, 0.6), 1);
    if (p.closed) D.roundRect(ctx, -neck * 0.6, top - fh * 0.08, neck * 1.2, fh * 0.1, 3, '#a16207');
    ctx.restore();
    if (!small || size > 120) {
      D.text(ctx, 'sodium sulphate in the small tube', cx, base - fh - (small ? 16 : 22), { color: c.muted, size: small ? 9 : 11, align: 'center' });
    }
  }
  function drawBottle(ctx, c, cx, base, size, p, small) {
    var bh = size * 0.9, bw = bh * 0.42, k = prog(), es = escaped();
    ctx.save(); ctx.translate(cx, base); ctx.rotate(tilt() * 0.6);
    var neckW = bw * 0.36, top = -bh;
    function path() { ctx.beginPath(); ctx.moveTo(-neckW / 2, top); ctx.lineTo(-neckW / 2, top + bh * 0.12); ctx.quadraticCurveTo(-bw / 2, top + bh * 0.2, -bw / 2, top + bh * 0.32); ctx.lineTo(-bw / 2, -6); ctx.quadraticCurveTo(-bw / 2, 0, -bw / 2 + 6, 0); ctx.lineTo(bw / 2 - 6, 0); ctx.quadraticCurveTo(bw / 2, 0, bw / 2, -6); ctx.lineTo(bw / 2, top + bh * 0.32); ctx.quadraticCurveTo(bw / 2, top + bh * 0.2, neckW / 2, top + bh * 0.12); ctx.lineTo(neckW / 2, top); }
    ctx.save(); path(); ctx.closePath(); ctx.clip();
    var lev = -bh * 0.3;
    ctx.fillStyle = 'rgba(253,230,138,0.45)'; ctx.fillRect(-bw, lev, bw * 2, -lev);
    var foam = k * (1 - k) * 4;
    if (foam > 0.02) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(-bw, lev - foam * bh * 0.18, bw * 2, foam * bh * 0.18); }
    var rr = M.rng(8);
    if (k > 0 && k < 1) for (var i = 0; i < 26; i++) { var q0 = (rr() + st.t * 0.9) % 1; D.circle(ctx, (rr() - 0.5) * bw * 0.8, lev * q0, 2, 'rgba(255,255,255,0.8)'); }
    // baking soda: a twist of paper that drops in when tilted
    var drop = M.clamp((st.t - 0.6) / 0.5, 0, 1);
    if (k < 0.3) D.roundRect(ctx, -bw * 0.15, top + bh * 0.15 + drop * bh * 0.45, bw * 0.3, bh * 0.08, 3, 'rgba(248,250,252,' + (1 - k * 3).toFixed(2) + ')');
    ctx.restore();
    path(); ctx.strokeStyle = D.alpha(c.ink, 0.7); ctx.lineWidth = 2; ctx.stroke();
    if (p.closed) D.roundRect(ctx, -neckW * 0.65, top - bh * 0.07, neckW * 1.3, bh * 0.08, 3, '#2563eb');
    ctx.restore();
    // gas escaping
    if (!p.closed && k > 0.05 && es < 0.99) {
      for (var j = 0; j < 4; j++) {
        var q = (st.t * 0.7 + j / 4) % 1;
        D.text(ctx, 'CO₂', cx + (j % 2 ? 1 : -1) * 14 + Math.sin(q * 6) * 6, base - bh - 8 - q * size * 0.25, { color: c.muted, size: small ? 9 : 11, weight: 700, align: 'center' });
      }
    }
    if (p.closed && k > 0.5) D.text(ctx, 'gas trapped: bottle goes firm', cx, base - bh - (small ? 14 : 20), { color: c.muted, size: small ? 9 : 11, align: 'center' });
  }
  function drawBurn(ctx, c, cx, base, size, p, small) {
    var k = prog(), burning = st.t > 0.9 && st.t < 5.2;
    if (p.closed) {
      var r = size * 0.38, fy = base - r;
      D.roundRect(ctx, cx - r * 0.5, base - 4, r, 4, 2, D.alpha(c.ink, 0.4));
      D.circle(ctx, cx, fy, r, 'rgba(186,230,253,0.12)', D.alpha(c.ink, 0.7), 2);
      D.roundRect(ctx, cx - r * 0.2, fy - r - r * 0.55, r * 0.4, r * 0.6, 3, c.light ? '#e2e8f0' : '#cbd5e1', D.alpha(c.ink, 0.6), 1.5);
      D.roundRect(ctx, cx - r * 0.14, fy - r - r * 0.85, r * 0.28, r * 0.32, 3, '#a16207');
      D.line(ctx, cx - r * 0.06, fy - r - r * 0.7, cx - r * 0.06, fy + r * 0.1, '#b91c1c', 1.5);
      D.line(ctx, cx + r * 0.06, fy - r - r * 0.7, cx + r * 0.06, fy + r * 0.1, '#1e293b', 1.5);
      ribbon(ctx, cx, fy + r * 0.35, r * 0.5, k, burning);
      if (!small) D.text(ctx, 'sealed flask of air, lit by a hot wire', cx, fy - r * 1.95, { color: c.muted, size: small ? 9 : 11, align: 'center' });
    } else {
      var cw = size * 0.5, ch = size * 0.22;
      ctx.beginPath(); ctx.moveTo(cx - cw / 2, base - ch); ctx.lineTo(cx + cw / 2, base - ch); ctx.lineTo(cx + cw * 0.35, base); ctx.lineTo(cx - cw * 0.35, base); ctx.closePath();
      ctx.fillStyle = c.light ? '#e7e5e4' : '#d6d3d1'; ctx.fill(); ctx.strokeStyle = D.alpha(c.ink, 0.6); ctx.lineWidth = 1.5; ctx.stroke();
      ribbon(ctx, cx, base - ch - 4, cw * 0.7, k, burning);
      if (burning) for (var j = 0; j < 4; j++) {
        var q = (st.t * 0.8 + j / 4) % 1, sx = cx + (j < 2 ? -1 : 1) * (cw * 0.9 - q * cw * 0.4);
        D.text(ctx, 'O₂', sx, base - ch - size * 0.3 + q * size * 0.2, { color: '#ef4444', size: small ? 9 : 11, weight: 700, align: 'center' });
      }
      if (!small || size > 120) D.text(ctx, 'open crucible: all the ash is kept', cx, base - ch - size * 0.55, { color: c.muted, size: small ? 9 : 11, align: 'center' });
    }
  }
  function ribbon(ctx, cx, y, len, k, burning) {
    var burnt = len * k;
    D.line(ctx, cx - len / 2, y, cx - len / 2 + (len - burnt), y, '#94a3b8', 3);
    if (burnt > 0) D.line(ctx, cx + len / 2 - burnt, y, cx + len / 2, y, '#f8fafc', 4);
    if (burning) {
      var fx = cx + len / 2 - burnt;
      ctx.save(); ctx.globalAlpha = 0.5; D.circle(ctx, fx, y, 16 + Math.sin(st.t * 40) * 3, '#fff7ed'); ctx.restore();
      D.circle(ctx, fx, y, 6, '#ffffff');
    }
  }
  function drawJar(ctx, c, cx, base, size, p, small) {
    var x = ratioResult(p), k = prog(), jw = size * 0.75, jh = size * 0.9, x0 = cx - jw / 2, y0 = base - jh;
    D.roundRect(ctx, x0, y0, jw, jh, 10, 'rgba(186,230,253,0.10)', D.alpha(c.ink, 0.7), 2);
    D.roundRect(ctx, x0 - 4, y0 - 8, jw + 8, 10, 3, '#64748b');
    // 1 g blocks: each square is 1 g (half squares for 0.5 g)
    var R = x.R, blocks = [];
    function add(n, col, kind) { var whole = Math.floor(n + 1e-9); for (var i = 0; i < whole; i++) blocks.push({ col: col, f: 1, kind: kind }); var fr = n - whole; if (fr > 0.01) blocks.push({ col: col, f: fr, kind: kind }); }
    if (k < 0.5) { add(p.a, R.ca, 'a'); add(p.b, R.cb, 'b'); }
    else { add(x.prod, R.cp, 'p'); add(x.leftA, R.ca, 'a'); add(x.leftB, R.cb, 'b'); }
    var cols = Math.max(4, Math.ceil(Math.sqrt(blocks.length * jw / jh))), cell = Math.min((jw - 12) / cols, (jh - 12) / Math.ceil(blocks.length / cols));
    blocks.forEach(function (bk, i) {
      var r = Math.floor(i / cols), col = i % cols, bx = x0 + 6 + col * cell, by = base - 6 - (r + 1) * cell;
      var sz = cell - 2;
      if (k > 0.3 && k < 0.7) { bx += Math.sin(st.t * 30 + i) * 2; by += Math.cos(st.t * 25 + i) * 2; }
      D.roundRect(ctx, bx + 1, by + 1 + sz * (1 - bk.f), sz, sz * bk.f, 2, bk.col, 'rgba(15,23,42,0.4)', 1);
    });
    if (k > 0.25 && k < 0.6) { ctx.save(); ctx.globalAlpha = 0.6; D.circle(ctx, cx, y0 + jh * 0.4, jw * 0.3, '#fef08a'); ctx.restore(); }
    D.text(ctx, small ? '1 square = 1 g' : 'each square = 1 g', x0 + jw + 8, y0 + jh * 0.3, { color: c.muted, size: small ? 9 : 11 });
  }

  /* ---------- before / after mass bars ---------- */
  function drawBars(ctx, c, b, p, small) {
    var x0 = b[0], y0 = b[1], w = b[2], h = b[3], fs = small ? 10 : 12, k = prog();
    D.roundRect(ctx, x0, y0, w, h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.2), 1);
    var before = [], after = [], title, note;
    if (isRatio(p)) {
      var x = ratioResult(p), R = x.R;
      before = [[R.a, p.a, R.ca], ['oxygen', p.b, R.cb]];
      after = [[R.p, x.prod * k, R.cp], [R.a + ' left', p.a - x.useA * k, R.ca], ['oxygen left', p.b - x.useB * k, R.cb]];
      title = R.a + ' : oxygen = ' + R.ra + ' : ' + R.rb + ' by mass';
      note = M.fmt(x.useA, 2) + ' g ' + R.a + ' + ' + M.fmt(x.useB, 2) + ' g oxygen → ' + M.fmt(x.prod, 2) + ' g ' + R.p;
    } else {
      var e = EXPS[p.exp];
      e.re.forEach(function (r, i) { before.push([r[0], r[1] * (1 - k), r[2], e.kind === 'burn' && i === 1 && !p.closed]); });
      e.pr.forEach(function (r) { before.push([r[0], r[1] * k, r[2], e.kind === 'fizz' && !p.closed && r[0].indexOf('gas') >= 0 && escaped() > 0.5]); });
      var sumR = e.re.reduce(function (s, q) { return s + q[1]; }, 0);
      title = 'Mass of the reacting substances';
      note = 'total ' + M.fmt(sumR, 2) + ' g all the way through';
      if (!p.closed && e.kind === 'fizz') note += ', but ' + M.fmt(-e.gas * escaped(), 2) + ' g of it has left the bottle';
      if (!p.closed && e.kind === 'burn') note += ', but the oxygen came in from the air';
      after = null;
    }
    D.text(ctx, title, x0 + 10, y0 + (small ? 14 : 18), { color: c.ink, size: fs + 1, weight: 700, fit: x0 + w });
    var top = y0 + (small ? 30 : 40), bottom = y0 + h - (small ? 30 : 38), avail = bottom - top;
    var bars = after ? [['before', before], ['after', after]] : [['now', before]];
    var total = Math.max.apply(null, bars.map(function (bb) { return bb[1].reduce(function (s, q) { return s + Math.max(0, q[1]); }, 0); }));
    var maxTot = Math.max(total, isRatio(p) ? p.a + p.b : 0.01);
    var barW = Math.min(after ? 56 : 70, w * 0.22), labX;
    bars.forEach(function (bb, bi) {
      var bx = x0 + 14 + bi * (barW + 16), y = bottom;
      bb[1].forEach(function (seg) {
        if (seg[1] <= 0.001) return;
        var hh = avail * seg[1] / maxTot;
        D.roundRect(ctx, bx, y - hh, barW, hh, 3, seg[2], 'rgba(15,23,42,0.45)', 1);
        if (seg[3]) { ctx.save(); ctx.beginPath(); ctx.rect(bx, y - hh, barW, hh); ctx.clip(); ctx.strokeStyle = 'rgba(15,23,42,0.6)'; ctx.lineWidth = 1.5; for (var s = -hh; s < barW + hh; s += 7) { ctx.beginPath(); ctx.moveTo(bx + s, y); ctx.lineTo(bx + s + hh, y - hh); ctx.stroke(); } ctx.restore(); }
        y -= hh;
      });
      D.text(ctx, bb[0], bx + barW / 2, bottom + (small ? 10 : 13), { color: c.muted, size: fs, weight: 600, align: 'center' });
      labX = bx + barW + 10;
    });
    // legend: one row per substance in the first bar(s)
    var seen = {}, rows = [];
    bars.forEach(function (bb) { bb[1].forEach(function (seg) { if (!seen[seg[0]]) { seen[seg[0]] = 1; rows.push(seg); } }); });
    var ly = top + 4, lh = Math.min(small ? 16 : 22, (avail - 4) / Math.max(1, rows.length));
    rows.forEach(function (seg) {
      D.roundRect(ctx, labX, ly - 5, 10, 10, 2, seg[2], 'rgba(15,23,42,0.45)', 1);
      D.text(ctx, seg[0] + '  ' + M.fmt(Math.max(0, seg[1]), 2) + ' g' + (seg[3] && p.exp !== 'burn' ? ' (escaped)' : ''), labX + 15, ly, { color: c.ink, size: fs, fit: x0 + w });
      ly += lh;
    });
    D.text(ctx, note, x0 + 10, y0 + h - (small ? 9 : 12), { color: c.muted, size: small ? 9 : 11, fit: x0 + w });
  }
})();
