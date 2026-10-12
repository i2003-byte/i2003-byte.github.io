/* =====================================================================
   Chemical reactions · Balancing Chemical Equations — sim.js
   ---------------------------------------------------------------------
   Atoms are not made or destroyed in a chemical reaction, only
   rearranged (law of conservation of mass). So a balanced equation has
   the same number of atoms of each element on both sides. We balance
   by changing the numbers IN FRONT of formulas (coefficients), never
   the small numbers inside a formula (that would make a new substance).
   Each molecule is drawn as a cluster of coloured atoms; the tally
   below counts every element on the left and on the right.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var COL = { H: '#f8fafc', O: '#ef4444', C: '#52525b', N: '#3b82f6', Na: '#a855f7', Mg: '#22c55e', Fe: '#c2410c', Cl: '#a3e635',
    Zn: '#94a3b8', Pb: '#475569', Ba: '#14b8a6', S: '#facc15' };
  var INK = { H: '#0f172a', S: '#0f172a', Cl: '#0f172a', Zn: '#0f172a' };
  // species: [formula, [[element, count], …] with the central atom first]; nLeft = how many species are reactants
  var RX = {
    water: { name: 'Hydrogen burns in oxygen', sp: [['H₂', [['H', 2]]], ['O₂', [['O', 2]]], ['H₂O', [['O', 1], ['H', 2]]]], nLeft: 2, ans: [2, 1, 2] },
    mgo: { name: 'Magnesium ribbon burns', sp: [['Mg', [['Mg', 1]]], ['O₂', [['O', 2]]], ['MgO', [['Mg', 1], ['O', 1]]]], nLeft: 2, ans: [2, 1, 2] },
    nh3: { name: 'Making ammonia', sp: [['N₂', [['N', 2]]], ['H₂', [['H', 2]]], ['NH₃', [['N', 1], ['H', 3]]]], nLeft: 2, ans: [1, 3, 2] },
    zn: { name: 'Zinc with hydrochloric acid', sp: [['Zn', [['Zn', 1]]], ['HCl', [['Cl', 1], ['H', 1]]], ['ZnCl₂', [['Zn', 1], ['Cl', 2]]], ['H₂', [['H', 2]]]], nLeft: 2, ans: [1, 2, 1, 1] },
    ch4: { name: 'Burning methane (CNG)', sp: [['CH₄', [['C', 1], ['H', 4]]], ['O₂', [['O', 2]]], ['CO₂', [['C', 1], ['O', 2]]], ['H₂O', [['O', 1], ['H', 2]]]], nLeft: 2, ans: [1, 2, 1, 2] },
    na: { name: 'Sodium with water', sp: [['Na', [['Na', 1]]], ['H₂O', [['O', 1], ['H', 2]]], ['NaOH', [['O', 1], ['Na', 1], ['H', 1]]], ['H₂', [['H', 2]]]], nLeft: 2, ans: [2, 2, 2, 1] },
    rust: { name: 'Iron rusting (iron oxide)', sp: [['Fe', [['Fe', 1]]], ['O₂', [['O', 2]]], ['Fe₂O₃', [['O', 3], ['Fe', 2]]]], nLeft: 2, ans: [4, 3, 2] },
    baso4: { name: 'Barium chloride + sodium sulphate', sp: [['BaCl₂', [['Ba', 1], ['Cl', 2]]], ['Na₂SO₄', [['S', 1], ['O', 4], ['Na', 2]]], ['BaSO₄', [['S', 1], ['O', 4], ['Ba', 1]]], ['NaCl', [['Na', 1], ['Cl', 1]]]], nLeft: 2, ans: [1, 1, 1, 2] },
    fe3o4: { name: 'Iron with steam', sp: [['Fe', [['Fe', 1]]], ['H₂O', [['O', 1], ['H', 2]]], ['Fe₃O₄', [['O', 4], ['Fe', 3]]], ['H₂', [['H', 2]]]], nLeft: 2, ans: [3, 4, 1, 4] },
    pb: { name: 'Heating lead nitrate', sp: [['Pb(NO₃)₂', [['Pb', 1], ['N', 2], ['O', 6]]], ['PbO', [['Pb', 1], ['O', 1]]], ['NO₂', [['N', 1], ['O', 2]]], ['O₂', [['O', 2]]]], nLeft: 1, ans: [2, 2, 4, 1] },
    c3h8: { name: 'Burning propane (LPG)', sp: [['C₃H₈', [['C', 3], ['H', 8]]], ['O₂', [['O', 2]]], ['CO₂', [['C', 1], ['O', 2]]], ['H₂O', [['O', 1], ['H', 2]]]], nLeft: 2, ans: [1, 5, 3, 4] },
    glucose: { name: 'Photosynthesis', sp: [['CO₂', [['C', 1], ['O', 2]]], ['H₂O', [['O', 1], ['H', 2]]], ['C₆H₁₂O₆', [['C', 6], ['O', 6], ['H', 12]]], ['O₂', [['O', 2]]]], nLeft: 2, ans: [6, 6, 1, 6] }
  };
  var ORDER = Object.keys(RX);
  var CIDS = ['c1', 'c2', 'c3', 'c4'];
  var st = { geo: null, labelled: null };

  function rx(p) { return RX[p.rx] || RX.water; }
  function coeffs(p) { return CIDS.map(function (id) { return Math.round(p[id]); }); }
  function elements(r) {
    var out = [];
    r.sp.forEach(function (s) { s[1].forEach(function (a) { if (out.indexOf(a[0]) < 0) out.push(a[0]); }); });
    return out;
  }
  function tally(p) {
    var r = rx(p), k = coeffs(p), t = {};
    elements(r).forEach(function (e) { t[e] = [0, 0]; });
    r.sp.forEach(function (s, i) { s[1].forEach(function (a) { t[a[0]][i < r.nLeft ? 0 : 1] += a[1] * k[i]; }); });
    return t;
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function status(p) {
    var t = tally(p), bad = Object.keys(t).filter(function (e) { return t[e][0] !== t[e][1]; });
    var k = coeffs(p).slice(0, rx(p).sp.length), g = k.reduce(gcd);
    return { t: t, bad: bad, ok: !bad.length, lowest: g === 1, g: g };
  }
  function eqText(p) {
    var r = rx(p), k = coeffs(p);
    function part(i) { return (k[i] > 1 ? k[i] : '') + r.sp[i][0]; }
    var L = [], R = [];
    r.sp.forEach(function (s, i) { (i < r.nLeft ? L : R).push(part(i)); });
    return L.join(' + ') + ' → ' + R.join(' + ');
  }
  function atomList(s) { var a = []; s[1].forEach(function (e) { for (var i = 0; i < e[1]; i++) a.push(e[0]); }); return a; }
  // hexagonal spiral positions (in units of one atom spacing)
  var HEX = (function () {
    var pts = [[0, 0]], dirs = [[1, 0], [0.5, 0.866], [-0.5, 0.866], [-1, 0], [-0.5, -0.866], [0.5, -0.866]];
    for (var ring = 1; ring <= 3; ring++) {
      var x = ring * dirs[4][0], y = ring * dirs[4][1];
      for (var d = 0; d < 6; d++) for (var s = 0; s < ring; s++) { pts.push([x, y]); x += dirs[d][0]; y += dirs[d][1]; }
    }
    return pts;
  })();
  function rings(n) { return n <= 1 ? 0 : n <= 7 ? 1 : n <= 19 ? 2 : 3; }
  function drawMolecule(ctx, atoms, x, y, cell) {
    var n = atoms.length, rg = rings(n), r = cell / (2 * (rg * 1.55 + 1)), sp = r * 1.55;
    if (n === 2) { drawAtom(ctx, atoms[0], x - r * 0.8, y, r); drawAtom(ctx, atoms[1], x + r * 0.8, y, r); return; }
    if (n === 3) { drawAtom(ctx, atoms[1], x - r * 1.2, y + r * 0.6, r); drawAtom(ctx, atoms[2], x + r * 1.2, y + r * 0.6, r); drawAtom(ctx, atoms[0], x, y - r * 0.2, r * 1.1); return; }
    for (var i = n - 1; i >= 0; i--) drawAtom(ctx, atoms[i], x + HEX[i][0] * sp, y + HEX[i][1] * sp, r);
  }
  function drawAtom(ctx, el, x, y, r) {
    D.circle(ctx, x, y, r, COL[el] || '#ccc', 'rgba(0,0,0,0.55)', 1);
    if (r >= 7) D.text(ctx, el, x, y + 0.5, { color: INK[el] || '#fff', size: Math.min(13, r * (el.length > 1 ? 0.95 : 1.15)), weight: 700, align: 'center' });
  }
  function labelControls(sim) {
    var key = sim.p.rx; if (st.labelled === key || typeof document === 'undefined') return;
    st.labelled = key;
    var r = rx(sim.p);
    CIDS.forEach(function (id, i) {
      var inp = document.getElementById('ctl-' + id); if (!inp) return;
      var box = inp.closest('.control'), lab = box && box.querySelector('label');
      if (box) box.style.display = i < r.sp.length ? '' : 'none';
      if (lab && r.sp[i]) lab.textContent = 'Number of ' + r.sp[i][0] + (i < r.nLeft ? ' (left)' : ' (right)');
      if (box && r.sp[i]) box.querySelectorAll('.step-btn').forEach(function (b) { b.setAttribute('aria-label', (b.dataset.step === '1' ? 'More ' : 'Fewer ') + r.sp[i][0]); });
    });
  }
  function hint(p) {
    var s = status(p), r = rx(p);
    if (s.ok) return s.lowest ? 'It is already balanced!' : 'Balanced, but every number can be divided by ' + s.g + '.';
    // pick the unbalanced element that appears in the fewest formulas
    var best = s.bad.slice().sort(function (a, b) { return count(a) - count(b); })[0];
    function count(e) { return r.sp.filter(function (sp) { return sp[1].some(function (a) { return a[0] === e; }); }).length; }
    var t = s.t[best], side = t[0] < t[1] ? 0 : 1, idx = -1;
    r.sp.forEach(function (sp, i) { if (idx < 0 && (i < r.nLeft ? 0 : 1) === side && sp[1].some(function (a) { return a[0] === best; })) idx = i; });
    return 'Count ' + best + ': ' + t[0] + ' on the left, ' + t[1] + ' on the right. Try a bigger number in front of ' + r.sp[idx][0] + '.';
  }

  function geo(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, r = rx(sim.p), n = r.sp.length;
    var nEl = elements(r).length, rowH = narrow ? 19 : 24;
    var top = narrow ? 50 : 62, tallyH = nEl * rowH + (narrow ? 26 : 32), btnH = narrow ? 38 : 42;
    var arrowW = narrow ? 26 : 50, plusW = narrow ? 12 : 26, side = 8;
    var nPlus = n - 2, boxW = Math.min(narrow ? 120 : 170, (W - 2 * side - arrowW - nPlus * plusW) / n);
    var total = n * boxW + arrowW + nPlus * plusW, x = (W - total) / 2, boxes = [];
    var boxH = Math.max(60, H - top - tallyH - btnH - 16);
    for (var i = 0; i < n; i++) {
      boxes.push({ x: x, w: boxW });
      x += boxW;
      if (i === r.nLeft - 1) { boxes.arrowX = x; x += arrowW; }
      else if (i < n - 1) { boxes['plus' + i] = x; x += plusW; }
    }
    return { W: W, H: H, narrow: narrow, top: top, boxH: boxH, boxes: boxes, arrowW: arrowW, plusW: plusW, btnY: top + boxH + 6, btnH: btnH, tallyY: top + boxH + btnH + 14, rowH: rowH };
  }

  SimLab.createSim({
    ariaLabel: 'A chemical equation drawn with molecules as clusters of coloured atoms. Change the number of each molecule; a tally underneath counts each kind of atom on the left and on the right and shows when the equation is balanced',
    transport: false,
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'rx', label: 'Reaction', type: 'select', value: 'water', options: ORDER.map(function (id, i) { return { value: id, label: (i + 1) + '. ' + RX[id].name }; }), help: 'Reactions get harder further down the list.' },
      { id: 'c1', label: 'Number in front of formula 1', min: 1, max: 9, step: 1, value: 1 },
      { id: 'c2', label: 'Number in front of formula 2', min: 1, max: 9, step: 1, value: 1 },
      { id: 'c3', label: 'Number in front of formula 3', min: 1, max: 9, step: 1, value: 1 },
      { id: 'c4', label: 'Number in front of formula 4', min: 1, max: 9, step: 1, value: 1 }
    ],
    buttonsTitle: 'Help',
    buttons: [
      { label: '💡 Hint', primary: true, onClick: function (sim) { sim.toast(hint(sim.p)); } },
      { label: 'Show the answer', onClick: function (sim) { rx(sim.p).ans.forEach(function (v, i) { sim.setParam(CIDS[i], v); }); } },
      { label: 'Next equation ▶', onClick: function (sim) {
        var i = (ORDER.indexOf(sim.p.rx) + 1) % ORDER.length; sim.setParam('rx', ORDER[i]);
        CIDS.forEach(function (id) { sim.setParam(id, 1); });
      } }
    ],
    readouts: [
      { id: 'bal', label: 'Balanced?', key: true },
      { id: 'left', label: 'Atoms on the left', short: 'Left atoms', digits: 0, key: true },
      { id: 'right', label: 'Atoms on the right', short: 'Right atoms', digits: 0, key: true },
      { id: 'eq', label: 'Equation' },
      { id: 'el', label: 'Each element (left : right)' }
    ],
    reset: function () {},
    onParam: function (sim, id) {
      if (id === 'rx') CIDS.forEach(function (c) { sim.setParam(c, 1); });
      return true;
    },
    pointer: {
      hover: function (sim, x, y) { var g = st.geo; return !!g && y >= g.btnY && y <= g.btnY + g.btnH; },
      down: function (sim, x, y) {
        var g = st.geo; if (!g || y < g.btnY - 4 || y > g.btnY + g.btnH + 4) return false;
        for (var i = 0; i < g.boxes.length; i++) {
          var b = g.boxes[i]; if (x < b.x || x > b.x + b.w) continue;
          var id = CIDS[i], v = Math.round(sim.p[id]) + (x < b.x + b.w / 2 ? -1 : 1);
          sim.setParam(id, M.clamp(v, 1, 9)); return true;
        }
        return false;
      }
    },
    readout: function (sim) {
      var s = status(sim.p), L = 0, R = 0;
      Object.keys(s.t).forEach(function (e) { L += s.t[e][0]; R += s.t[e][1]; });
      return { bal: s.ok ? (s.lowest ? 'Yes ✓' : 'Yes, not lowest') : 'Not yet', left: L, right: R, eq: eqText(sim.p),
        el: Object.keys(s.t).map(function (e) { return e + ' ' + s.t[e][0] + ':' + s.t[e][1]; }).join(', ') };
    },
    status: function (sim) { return status(sim.p).ok ? 'Balanced' : 'Not balanced yet'; },

    draw: function (sim) {
      labelControls(sim);
      var ctx = sim.ctx, c = sim.colors, p = sim.p, g = geo(sim), r = rx(p), k = coeffs(p), s = status(p), W = g.W;
      st.geo = g;
      D.clear(ctx, W, g.H, c.bg);
      var fs = g.narrow ? 11 : 13;
      // headline + equation
      var head = s.ok ? (s.lowest ? 'Balanced ✓  Same atoms on both sides' : 'Balanced, but divide every number by ' + s.g) : 'Not balanced: ' + s.bad.join(', ') + ' ' + (s.bad.length > 1 ? 'differ' : 'differs');
      D.text(ctx, head, W / 2, g.narrow ? 13 : 17, { color: c.bg, bg: s.ok ? (s.lowest ? c.success : c.warning) : c.danger, size: g.narrow ? 12 : 14, weight: 700, align: 'center', pad: 4, fit: W });
      D.text(ctx, eqText(p), W / 2, g.narrow ? 35 : 44, { color: c.ink, size: g.narrow ? 15 : 20, weight: 700, align: 'center', fit: W });
      // boxes of molecules
      r.sp.forEach(function (sp, i) {
        var b = g.boxes[i], left = i < r.nLeft, y0 = g.top, n = k[i], atoms = atomList(sp);
        D.roundRect(ctx, b.x + 2, y0, b.w - 4, g.boxH, 8, D.alpha(left ? c.s1 : c.s3, 0.07), D.alpha(left ? c.s1 : c.s3, 0.5), 1);
        D.text(ctx, n + ' ' + sp[0], b.x + b.w / 2, y0 + (g.narrow ? 11 : 14), { color: c.ink, size: g.narrow ? (sp[0].length > 5 ? 10 : 12) : 14, weight: 700, align: 'center' });
        var areaY = y0 + (g.narrow ? 22 : 28), areaH = g.boxH - (g.narrow ? 26 : 34), aw = b.w - 10;
        var cols = Math.ceil(Math.sqrt(n * aw / areaH)), rows;
        cols = M.clamp(cols, 1, n); rows = Math.ceil(n / cols);
        while (rows > 1 && Math.min(aw / cols, areaH / rows) < Math.min(aw / (cols + 1), areaH / Math.ceil(n / (cols + 1)))) { cols++; rows = Math.ceil(n / cols); }
        var cell = Math.min(aw / cols, areaH / rows, g.narrow ? 70 : 100);
        var gx = b.x + 5 + (aw - cols * cell) / 2, gy = areaY + (areaH - rows * cell) / 2;
        for (var m = 0; m < n; m++) drawMolecule(ctx, atoms, gx + (m % cols + 0.5) * cell, gy + (Math.floor(m / cols) + 0.5) * cell, cell * 0.92);
        // − / + buttons
        var bw = (b.w - 12) / 2, by = g.btnY;
        [['−', b.x + 4, n > 1], ['+', b.x + 8 + bw, n < 9]].forEach(function (q) {
          D.roundRect(ctx, q[1], by, bw, g.btnH, 8, q[2] ? D.alpha(c.ink, 0.1) : D.alpha(c.ink, 0.03), c.border, 1);
          D.text(ctx, q[0], q[1] + bw / 2, by + g.btnH / 2, { color: q[2] ? c.ink : c.faint, size: 20, weight: 700, align: 'center' });
        });
        if (i < r.sp.length - 1 && g.boxes['plus' + i] != null) D.text(ctx, '+', g.boxes['plus' + i] + g.plusW / 2, y0 + g.boxH / 2, { color: c.muted, size: g.narrow ? 16 : 24, weight: 700, align: 'center' });
      });
      var ax = g.boxes.arrowX;
      D.arrow(ctx, ax + 3, g.top + g.boxH / 2, ax + g.arrowW - 3, g.top + g.boxH / 2, c.ink, 2.5, g.narrow ? 7 : 10);
      // atom tally
      var ty = g.tallyY, els = Object.keys(s.t), mid = W / 2, colW = Math.min(g.narrow ? 140 : 260, W * 0.38);
      D.text(ctx, 'Left side', mid - 30, ty, { color: c.s1, size: fs, weight: 700, align: 'right' });
      D.text(ctx, 'Right side', mid + 30, ty, { color: c.s3, size: fs, weight: 700 });
      var maxN = 1; els.forEach(function (e) { maxN = Math.max(maxN, s.t[e][0], s.t[e][1]); });
      var dot = Math.min(g.narrow ? 7 : 10, (colW - 40) / maxN);
      els.forEach(function (e, j) {
        var y = ty + (j + 1) * g.rowH, a = s.t[e][0], bb = s.t[e][1], ok = a === bb;
        drawAtom(ctx, e, mid, y, g.narrow ? 8 : 10);
        D.text(ctx, String(a), mid - 16, y, { color: c.ink, size: fs, weight: 700, align: 'right' });
        D.text(ctx, String(bb), mid + 16, y, { color: c.ink, size: fs, weight: 700 });
        var big = dot >= 4;
        for (var q = 0; q < a; q++) { var lx = mid - 40 - q * dot; if (lx < mid - colW) break; D.circle(ctx, lx, y, big ? dot * 0.4 : 1.5, COL[e], 'rgba(0,0,0,0.4)', 0.5); }
        for (var q2 = 0; q2 < bb; q2++) { var rx2 = mid + 40 + q2 * dot; if (rx2 > mid + colW) break; D.circle(ctx, rx2, y, big ? dot * 0.4 : 1.5, COL[e], 'rgba(0,0,0,0.4)', 0.5); }
        D.text(ctx, ok ? '✓' : '✗', mid + colW + 10, y, { color: ok ? c.success : c.danger, size: fs + 2, weight: 800 });
      });
    }
  });
})();
