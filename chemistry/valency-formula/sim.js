/* =====================================================================
   Atoms and molecules · Writing Formulae from Valency — sim.js
   ---------------------------------------------------------------------
   An activity (no Play button). Pick a positive ion and a negative ion,
   then choose how many of each to put together. Each ion is a tile with
   as many "hands" as its valency (its charge). A compound is complete
   when every hand is held: total positive charge = total negative charge.

   Criss-cross method: write each ion's valency, swap them to become the
   subscripts of the other ion, then divide both by any common factor:
     Al³⁺ + O²⁻ → Al₂O₃ ;  Mg²⁺ + O²⁻ → Mg₂O₂ → MgO
   A polyatomic ion that is needed more than once goes in brackets:
     Ca²⁺ + OH⁻ → Ca(OH)₂
   Formula unit mass = sum of atomic masses (u), rounded values used:
     H 1, C 12, N 14, O 16, Na 23, Mg 24, Al 27, P 31, S 32, Cl 35.5,
     K 39, Ca 40, Fe 56, Cu 63.5, Zn 65, Ag 108, Ba 137
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var AM = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, P: 31, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56, Cu: 63.5, Zn: 65, Ag: 108, Ba: 137 };
  var CATS = {
    Na: { sym: 'Na', v: 1, name: 'sodium', comp: { Na: 1 } },
    K: { sym: 'K', v: 1, name: 'potassium', comp: { K: 1 } },
    Ag: { sym: 'Ag', v: 1, name: 'silver', comp: { Ag: 1 } },
    NH4: { sym: 'NH₄', v: 1, name: 'ammonium', comp: { N: 1, H: 4 }, poly: true },
    Mg: { sym: 'Mg', v: 2, name: 'magnesium', comp: { Mg: 1 } },
    Ca: { sym: 'Ca', v: 2, name: 'calcium', comp: { Ca: 1 } },
    Zn: { sym: 'Zn', v: 2, name: 'zinc', comp: { Zn: 1 } },
    Ba: { sym: 'Ba', v: 2, name: 'barium', comp: { Ba: 1 } },
    Cu: { sym: 'Cu', v: 2, name: 'copper(II)', comp: { Cu: 1 } },
    Fe2: { sym: 'Fe', v: 2, name: 'iron(II)', comp: { Fe: 1 } },
    Fe3: { sym: 'Fe', v: 3, name: 'iron(III)', comp: { Fe: 1 } },
    Al: { sym: 'Al', v: 3, name: 'aluminium', comp: { Al: 1 } }
  };
  var ANS = {
    Cl: { sym: 'Cl', v: 1, name: 'chloride', comp: { Cl: 1 } },
    OH: { sym: 'OH', v: 1, name: 'hydroxide', comp: { O: 1, H: 1 }, poly: true },
    NO3: { sym: 'NO₃', v: 1, name: 'nitrate', comp: { N: 1, O: 3 }, poly: true },
    HCO3: { sym: 'HCO₃', v: 1, name: 'hydrogencarbonate', comp: { H: 1, C: 1, O: 3 }, poly: true },
    O: { sym: 'O', v: 2, name: 'oxide', comp: { O: 1 } },
    S: { sym: 'S', v: 2, name: 'sulphide', comp: { S: 1 } },
    SO4: { sym: 'SO₄', v: 2, name: 'sulphate', comp: { S: 1, O: 4 }, poly: true },
    CO3: { sym: 'CO₃', v: 2, name: 'carbonate', comp: { C: 1, O: 3 }, poly: true },
    N: { sym: 'N', v: 3, name: 'nitride', comp: { N: 1 } },
    PO4: { sym: 'PO₄', v: 3, name: 'phosphate', comp: { P: 1, O: 4 }, poly: true }
  };
  var SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = { 1: '', 2: '²', 3: '³' };
  function sub(n) { return n === 1 ? '' : String(n).split('').map(function (d) { return SUB[+d]; }).join(''); }
  function part(ion, n) { return n === 1 ? ion.sym : ion.poly ? '(' + ion.sym + ')' + sub(n) : ion.sym + sub(n); }
  function formula(c, a, nc, na) { return part(c, nc) + part(a, na); }
  function gcd(x, y) { return y ? gcd(y, x % y) : x; }
  function answer(c, a) { var g = gcd(c.v, a.v); return { nc: a.v / g, na: c.v / g, g: g }; }
  function ionMass(ion) { var m = 0; for (var e in ion.comp) m += AM[e] * ion.comp[e]; return m; }
  function massLine(c, a, nc, na) {
    var terms = [], total = 0, comp = {};
    [[c, nc], [a, na]].forEach(function (q) { for (var e in q[0].comp) comp[e] = (comp[e] || 0) + q[0].comp[e] * q[1]; });
    for (var e in comp) { terms.push((comp[e] > 1 ? comp[e] + ' × ' : '') + AM[e]); total += comp[e] * AM[e]; }
    return { text: terms.join(' + ') + ' = ' + M.fmt(total, total % 1 ? 1 : 0) + ' u', total: total };
  }
  function ionLabel(ion, sign) { return ion.sym + (SUP[ion.v] || '') + sign; }

  var st = { showRule: false };

  SimLab.createSim({
    ariaLabel: 'Ion tiles with hands: each positive ion has as many hands as its valency on its right side and each negative ion as many on its left. Lines join the hands in pairs; unheld hands glow red. A panel shows the criss-cross method that gives the formula, and the formula unit mass worked out from atomic masses',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'cat', label: 'Positive ion (metal or ammonium)', type: 'select', value: 'Al', options: Object.keys(CATS).map(function (k) { var q = CATS[k]; return { value: k, label: q.name + ' ' + ionLabel(q, '⁺') }; }) },
      { id: 'an', label: 'Negative ion', type: 'select', value: 'O', options: Object.keys(ANS).map(function (k) { var q = ANS[k]; return { value: k, label: q.name + ' ' + ionLabel(q, '⁻') }; }) },
      { id: 'nc', label: 'How many positive ions', min: 1, max: 4, step: 1, value: 1 },
      { id: 'na', label: 'How many negative ions', min: 1, max: 4, step: 1, value: 1 },
      { id: 'rule', label: 'Show the criss-cross method', type: 'toggle', value: false }
    ],
    onParam: function (sim, id) {
      if (id === 'cat' || id === 'an') { sim.setParam('nc', 1); sim.setParam('na', 1); }
      return false;
    },
    buttonsTitle: 'Help',
    buttons: [
      { label: 'Show me the answer', primary: true, onClick: function (sim) { var x = answer(CATS[sim.p.cat], ANS[sim.p.an]); sim.setParam('nc', x.nc); sim.setParam('na', x.na); sim.setParam('rule', true); } },
      { label: 'Random pair', onClick: function (sim) {
        var ck = Object.keys(CATS), ak = Object.keys(ANS);
        sim.setParam('cat', ck[Math.floor(Math.random() * ck.length)]); sim.setParam('an', ak[Math.floor(Math.random() * ak.length)]);
        sim.setParam('nc', 1); sim.setParam('na', 1); sim.setParam('rule', false);
      } }
    ],
    readouts: [
      { id: 'built', label: 'Formula you built', short: 'Built', key: true },
      { id: 'charge', label: 'Charges: positive / negative', short: 'Charges', key: true },
      { id: 'mass', label: 'Formula unit mass', short: 'Mass', unit: 'u', digits: 1, key: true },
      { id: 'name', label: 'Name of the compound' },
      { id: 'right', label: 'Correct formula' }
    ],
    reset: function () {},
    readout: function (sim) {
      var c = CATS[sim.p.cat], a = ANS[sim.p.an], nc = sim.p.nc, na = sim.p.na, x = answer(c, a);
      var ok = nc * c.v === na * a.v, simplest = ok && gcd(nc, na) === 1;
      return { built: formula(c, a, nc, na), charge: '+' + nc * c.v + ' / −' + na * a.v, mass: ok ? massLine(c, a, nc, na).total : '—',
        name: c.name + ' ' + a.name, right: sim.p.rule || simplest ? formula(c, a, x.nc, x.na) : 'hidden (try first)' };
    },
    status: function (sim) {
      var c = CATS[sim.p.cat], a = ANS[sim.p.an], nc = sim.p.nc, na = sim.p.na, P = nc * c.v, N = na * a.v;
      if (P < N) return 'Not yet: ' + (N - P) + ' negative hand' + (N - P > 1 ? 's are' : ' is') + ' empty. Add positive ions?';
      if (P > N) return 'Not yet: ' + (P - N) + ' positive hand' + (P - N > 1 ? 's are' : ' is') + ' empty. Add negative ions?';
      if (gcd(nc, na) > 1) return 'Balanced, but not the simplest ratio: divide both by ' + gcd(nc, na);
      return 'Every hand is held: ' + formula(c, a, nc, na) + ' (' + c.name + ' ' + a.name + ')';
    },
    draw: function (sim) {
      var ctx = sim.ctx, col = sim.colors, W = sim.width, H = sim.height, p = sim.p;
      D.clear(ctx, W, H, col.bg);
      var c = CATS[p.cat], a = ANS[p.an], small = W < 560 || H < 420, gap = 8;
      var side = W >= 560 && W / H >= 1.15, tb, rb;
      if (side) { tb = [gap, gap, W * (p.rule ? 0.56 : 1) - gap * (p.rule ? 1 : 2), H - gap * 2]; rb = [W * 0.56 + gap, gap, W * 0.44 - gap * 2, H - gap * 2]; }
      else { var th = p.rule ? Math.round(H * 0.56) : H - gap; tb = [gap, gap, W - gap * 2, th - gap]; rb = [gap, th + gap, W - gap * 2, H - th - gap * 2]; }
      drawTiles(ctx, col, tb, c, a, p.nc, p.na, small);
      if (p.rule) drawRule(ctx, col, rb, c, a, small);
    }
  });

  /* ---------- ion tiles with hands ---------- */
  function drawTiles(ctx, col, b, c, a, nc, na, small) {
    var x0 = b[0], y0 = b[1], w = b[2], h = b[3], fs = small ? 11 : 13;
    D.roundRect(ctx, x0, y0, w, h, 10, D.alpha(col.ink, 0.04), D.alpha(col.ink, 0.2), 1);
    var P = nc * c.v, N = na * a.v, ok = P === N;
    var top = y0 + (small ? 30 : 40), bottom = y0 + h - (small ? 40 : 52), rows = Math.max(nc, na);
    var slot = (bottom - top) / rows, th = Math.min(slot * 0.78, small ? 64 : 86), tw = Math.min(w * 0.26, th * 1.5);
    var lx = x0 + w * 0.27 - tw / 2, rx = x0 + w * 0.73 - tw / 2;
    var hands = { pos: [], neg: [] };
    function tile(ion, i, n, left, pos) {
      var cy = top + (bottom - top) * (i + 0.5) / n, tx = left, ty = cy - th / 2;
      D.roundRect(ctx, tx, ty, tw, th, 10, pos ? 'rgba(59,130,246,0.85)' : 'rgba(239,68,68,0.85)', 'rgba(15,23,42,0.5)', 1.5);
      D.text(ctx, ion.sym, tx + tw / 2, cy - th * 0.06, { color: '#fff', size: Math.min(th * 0.36, small ? 18 : 24), weight: 700, align: 'center' });
      D.text(ctx, (ion.v > 1 ? ion.v : '') + (pos ? '+' : '−'), tx + tw / 2, cy + th * 0.28, { color: '#fff', size: Math.min(th * 0.22, small ? 11 : 14), weight: 700, align: 'center' });
      for (var k = 0; k < ion.v; k++) {
        var hy = cy + (k - (ion.v - 1) / 2) * Math.min(th / ion.v, th * 0.3), hx = pos ? tx + tw : tx;
        (pos ? hands.pos : hands.neg).push({ x: hx + (pos ? 9 : -9), y: hy, bx: hx });
      }
    }
    for (var i = 0; i < nc; i++) tile(c, i, nc, lx, true);
    for (var j = 0; j < na; j++) tile(a, j, na, rx, false);
    var m = Math.min(hands.pos.length, hands.neg.length);
    for (var k = 0; k < m; k++) D.line(ctx, hands.pos[k].x, hands.pos[k].y, hands.neg[k].x, hands.neg[k].y, ok ? col.success : D.alpha(col.ink, 0.7), 2.5);
    function drawHands(list, pos) {
      list.forEach(function (hd, idx) {
        var free = idx >= m;
        D.line(ctx, hd.bx, hd.y, hd.x, hd.y, free ? '#ef4444' : D.alpha(col.ink, 0.8), 3);
        D.circle(ctx, hd.x, hd.y, free ? 5 : 4, free ? '#ef4444' : D.alpha(col.ink, 0.8), free ? '#fff' : null, 1.5);
      });
    }
    drawHands(hands.pos, true); drawHands(hands.neg, false);
    // headings and totals
    D.text(ctx, nc + ' × ' + ionLabel(c, '⁺'), lx + tw / 2, y0 + (small ? 14 : 18), { color: col.ink, size: fs, weight: 700, align: 'center' });
    D.text(ctx, na + ' × ' + ionLabel(a, '⁻'), rx + tw / 2, y0 + (small ? 14 : 18), { color: col.ink, size: fs, weight: 700, align: 'center' });
    var g = gcd(nc, na), msg, bg;
    if (!ok) { msg = '+' + P + ' and −' + N + ': not balanced'; bg = 'rgba(185,28,28,0.9)'; }
    else if (g > 1) { msg = formula(c, a, nc, na) + ' balances, but divide by ' + g; bg = 'rgba(180,83,9,0.9)'; }
    else { msg = '✓ ' + formula(c, a, nc, na) + '  ·  +' + P + ' = −' + N; bg = 'rgba(21,128,61,0.9)'; }
    D.text(ctx, msg, x0 + w / 2, y0 + h - (small ? 18 : 24), { color: '#fff', bg: bg, size: small ? 13 : 16, weight: 700, align: 'center', pad: 5, fit: x0 + w });
  }

  /* ---------- criss-cross panel ---------- */
  function drawRule(ctx, col, b, c, a, small) {
    var x0 = b[0], y0 = b[1], w = b[2], h = b[3];
    D.roundRect(ctx, x0, y0, w, h, 10, D.alpha(col.ink, 0.04), D.alpha(col.ink, 0.2), 1);
    var x = answer(c, a), big = Math.min(small ? 22 : 30, h / 7), fs = small ? 10 : 12;
    var rowsY = [0.2, 0.47, 0.72, 0.9].map(function (f) { return y0 + h * f; });
    D.text(ctx, small ? 'Criss-cross' : 'Criss-cross method', x0 + 10, y0 + (small ? 12 : 16), { color: col.ink, size: fs + 1, weight: 700 });
    // 1. symbols with valencies, 2. valencies swapped into subscripts (drawn at the same x)
    ctx.save(); ctx.font = '700 ' + big + 'px Inter, system-ui, sans-serif';
    function wid(t) { return ctx.measureText(t).width; }
    var s1 = c.poly ? '(' + c.sym + ')' : c.sym, s2 = a.poly ? '(' + a.sym + ')' : a.sym, gapX = big * 1.2;
    var tot = wid(s1) + wid(s2) + gapX + big * 0.5, left = x0 + (w - tot) / 2 + 8;
    var e1 = left + wid(s1), l2 = e1 + gapX, e2 = l2 + wid(s2);
    ctx.restore();
    D.text(ctx, '1', x0 + 12, rowsY[0], { color: col.muted, size: fs, weight: 700 });
    D.text(ctx, '2', x0 + 12, rowsY[1], { color: col.muted, size: fs, weight: 700 });
    [[s1, left, col.s1], [s2, l2, col.s2]].forEach(function (q) {
      D.text(ctx, q[0], q[1], rowsY[0], { color: q[2], size: big, weight: 700 });
      D.text(ctx, q[0], q[1], rowsY[1], { color: q[2], size: big, weight: 700 });
    });
    var supY = rowsY[0] - big * 0.5, subY = rowsY[1] + big * 0.3, sz = big * 0.6;
    D.text(ctx, String(c.v), e1 + 3, supY, { color: col.warning, size: sz, weight: 700 });
    D.text(ctx, String(a.v), e2 + 3, supY, { color: col.warning, size: sz, weight: 700 });
    D.text(ctx, String(a.v), e1 + 3, subY, { color: col.warning, size: sz, weight: 700 });
    D.text(ctx, String(c.v), e2 + 3, subY, { color: col.warning, size: sz, weight: 700 });
    D.arrow(ctx, e1 + 3 + sz * 0.3, supY + sz * 0.6, e2 + 3 + sz * 0.3, subY - sz * 0.7, D.alpha(col.ink, 0.55), 1.5, 7);
    D.arrow(ctx, e2 + 3 + sz * 0.3, supY + sz * 0.6, e1 + 3 + sz * 0.3, subY - sz * 0.7, D.alpha(col.ink, 0.55), 1.5, 7);
    // 3. simplify
    D.text(ctx, '3', x0 + 12, rowsY[2], { color: col.muted, size: fs, weight: 700 });
    var f = formula(c, a, x.nc, x.na);
    D.text(ctx, (x.g > 1 ? '÷ ' + x.g + ' → ' : 'already simplest → ') + f, x0 + w / 2, rowsY[2], { color: col.success, size: big * 0.62, weight: 700, align: 'center', fit: x0 + w });
    // 4. formula unit mass
    var ml = massLine(c, a, x.nc, x.na);
    D.text(ctx, f + ': ' + ml.text, x0 + w / 2, rowsY[3], { color: col.ink, size: fs, weight: 600, align: 'center', fit: x0 + w });
  }
})();
