/* =====================================================================
   Chemical reactions · Types of Chemical Reactions — sim.js
   ---------------------------------------------------------------------
   Particles move about at random (faster when hotter). When the right
   particles meet, they react:
     combination        A + B → AB        (CaO + H₂O → Ca(OH)₂, C + O₂ → CO₂)
     decomposition      AB → A + B        (CaCO₃ → CaO + CO₂ with heat,
                                           2AgCl → 2Ag + Cl₂ with sunlight)
     displacement       A + BC → AC + B   (Fe + CuSO₄ → FeSO₄ + Cu: a more
                                           reactive metal pushes a less
                                           reactive one out of its salt)
     double displacement AB + CD → AD + CB (Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl:
                                           ions swap partners and an
                                           insoluble precipitate forms)
   Sulphate ions in the displacement reactions, and Na⁺ / Cl⁻ in the
   double displacement, take no part (spectator ions).
   Particle numbers, sizes and speeds are for showing the idea only.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var WW = 1, WH = 0.66, R = 0.019, LIQ = 0.1;
  // particle looks: atoms [dx, dy, r, colour] in units of R, plus an optional label
  var SP = {
    H2O: { a: [[0, 0, 0.8, '#ef4444'], [-0.75, 0.5, 0.5, '#f8fafc'], [0.75, 0.5, 0.5, '#f8fafc']], n: 'Water H₂O' },
    CaO: { a: [[-0.5, 0, 0.9, '#fde68a'], [0.6, 0, 0.75, '#ef4444']], n: 'Quicklime CaO' },
    CaOH2: { a: [[0, 0, 0.9, '#fde68a'], [-1, 0.3, 0.65, '#ef4444'], [1, 0.3, 0.65, '#ef4444'], [-1.5, 0.75, 0.4, '#f8fafc'], [1.5, 0.75, 0.4, '#f8fafc']], n: 'Slaked lime Ca(OH)₂' },
    C: { a: [[0, 0, 1, '#3f3f46']], n: 'Carbon C' },
    O2: { a: [[-0.5, 0, 0.7, '#ef4444'], [0.5, 0, 0.7, '#ef4444']], n: 'Oxygen O₂' },
    CO2: { a: [[0, 0, 0.75, '#52525b'], [-1.05, 0, 0.65, '#ef4444'], [1.05, 0, 0.65, '#ef4444']], n: 'Carbon dioxide CO₂' },
    CaCO3: { a: [[0, 0, 0.75, '#52525b'], [-0.75, -0.5, 0.55, '#ef4444'], [0.75, -0.5, 0.55, '#ef4444'], [0, 0.85, 0.55, '#ef4444'], [-1, 0.55, 0.65, '#fde68a']], n: 'Limestone CaCO₃' },
    AgCl: { a: [[-0.45, 0, 0.8, '#e5e7eb'], [0.55, 0, 0.75, '#a3e635']], n: 'Silver chloride AgCl' },
    Ag: { a: [[0, 0, 0.9, '#6b7280']], n: 'Silver Ag (grey)' },
    Cl2: { a: [[-0.5, 0, 0.7, '#a3e635'], [0.5, 0, 0.7, '#a3e635']], n: 'Chlorine Cl₂' },
    Fe: { a: [[0, 0, 1, '#71717a']], n: 'Iron Fe' },
    Zn: { a: [[0, 0, 1, '#cbd5e1']], n: 'Zinc Zn' },
    Cu: { a: [[0, 0, 1, '#b45309']], n: 'Copper Cu' },
    Cu2: { a: [[0, 0, 0.85, '#3b82f6']], l: 'Cu²⁺', n: 'Copper ion Cu²⁺' },
    Fe2: { a: [[0, 0, 0.85, '#86efac']], l: 'Fe²⁺', n: 'Iron ion Fe²⁺' },
    Zn2: { a: [[0, 0, 0.85, '#e2e8f0']], l: 'Zn²⁺', n: 'Zinc ion Zn²⁺' },
    SO4: { a: [[-0.62, -0.62, 0.4, '#ef4444'], [0.62, -0.62, 0.4, '#ef4444'], [-0.62, 0.62, 0.4, '#ef4444'], [0.62, 0.62, 0.4, '#ef4444'], [0, 0, 0.72, '#facc15']], n: 'Sulphate ion SO₄²⁻' },
    Ba2: { a: [[0, 0, 0.95, '#14b8a6']], l: 'Ba²⁺', n: 'Barium ion Ba²⁺' },
    Cl: { a: [[0, 0, 0.75, '#a3e635']], l: 'Cl⁻', n: 'Chloride ion Cl⁻' },
    Na: { a: [[0, 0, 0.7, '#a855f7']], l: 'Na⁺', n: 'Sodium ion Na⁺' },
    BaSO4: { a: [[0, 0, 1, '#f8fafc']], n: 'Barium sulphate BaSO₄ (white solid)' }
  };
  var RX = {
    cao: { type: 'Combination', eq: 'CaO + H₂O → Ca(OH)₂', medium: 'liquid', slider: 'Heat', key: 'CaO', prod: 'CaOH2',
      energy: 'Gives out heat (exothermic)', legend: ['CaO', 'H2O', 'CaOH2'],
      init: function () { scatter('CaO', 18); scatter('H2O', 34); },
      rules: [{ a: 'CaO', b: 'H2O', p: 0.004, out: ['CaOH2'] }],
      see: function () { return st.prog > 0.02 ? 'Hissing, the beaker gets hot; milky lime water' : 'Quicklime added to water'; } },
    coal: { type: 'Combination', eq: 'C + O₂ → CO₂', medium: 'air', slider: 'Heat', key: 'C', prod: 'CO2',
      energy: 'Gives out heat and light (exothermic)', legend: ['C', 'O2', 'CO2'],
      init: function () { heap('C', 16); scatter('O2', 30, 0, 0.45); },
      rules: [{ a: 'O2', b: 'C', p: 0.008, out: ['CO2'], needs: function () { return st.burning; } }],
      see: function () { return st.burning ? 'The coal glows and burns away' : st.prog > 0.98 ? 'All the coal has burnt away' : st.prog > 0 ? 'The fire has gone out' : 'Coal needs heating to catch fire'; } },
    caco3: { type: 'Decomposition', eq: 'CaCO₃ → CaO + CO₂', medium: 'tube', slider: 'Heat', key: 'CaCO3', prod: 'CaO',
      energy: 'Takes in heat (endothermic)', legend: ['CaCO3', 'CaO', 'CO2'],
      init: function () { heap('CaCO3', 20); },
      decomp: { sp: 'CaCO3', rate: function (e) { return 0.2 * Math.max(0, e - 0.25) / 0.75; }, stay: 'CaO', gas: 'CO2' },
      see: function (sim) { return sim.p.energy > 25 ? (st.prog < 0.98 ? 'Gas bubbles off; white lime is left' : 'All the limestone has turned to lime') : 'Nothing happens without strong heat'; } },
    agcl: { type: 'Decomposition', eq: '2AgCl → 2Ag + Cl₂', medium: 'dish', slider: 'Sunlight', key: 'AgCl', prod: 'Ag',
      energy: 'Takes in light energy', legend: ['AgCl', 'Ag', 'Cl2'],
      init: function () { layer('AgCl', 24); },
      decomp: { sp: 'AgCl', rate: function (e) { return 0.12 * e; }, stay: 'Ag', gas: 'Cl2', pair: true },
      see: function (sim) { return sim.p.energy > 0 ? 'White silver chloride turns grey' : 'Nothing happens in the dark'; } },
    fe: { type: 'Displacement', eq: 'Fe + CuSO₄ → FeSO₄ + Cu', medium: 'liquid', slider: 'Heat', key: 'Cu2', prod: 'Fe2',
      energy: 'Gives out a little heat', legend: ['Fe', 'Cu2', 'SO4', 'Cu', 'Fe2'],
      init: function () { strip('Fe'); scatter('Cu2', 22); scatter('SO4', 22); },
      strip: { metal: 'Fe', ion: 'Cu2', out: 'Fe2', deposit: 'Cu', p: 0.045 },
      see: function () { return st.prog > 0.05 ? 'Brown copper coats the nail; blue turns pale green' : 'An iron nail in blue copper sulphate'; } },
    zn: { type: 'Displacement', eq: 'Zn + CuSO₄ → ZnSO₄ + Cu', medium: 'liquid', slider: 'Heat', key: 'Cu2', prod: 'Zn2',
      energy: 'Gives out heat', legend: ['Zn', 'Cu2', 'SO4', 'Cu', 'Zn2'],
      init: function () { strip('Zn'); scatter('Cu2', 22); scatter('SO4', 22); },
      strip: { metal: 'Zn', ion: 'Cu2', out: 'Zn2', deposit: 'Cu', p: 0.09 },
      see: function () { return st.prog > 0.05 ? 'Brown copper coats the zinc; the blue fades' : 'A zinc strip in blue copper sulphate'; } },
    none: { type: 'No reaction', eq: 'Cu + FeSO₄ → no change', medium: 'liquid', slider: 'Heat', key: 'Fe2', prod: 'Cu2',
      energy: 'None', legend: ['Cu', 'Fe2', 'SO4'],
      init: function () { strip('Cu'); scatter('Fe2', 22); scatter('SO4', 22); },
      see: function () { return 'No change: copper is less reactive than iron'; } },
    baso4: { type: 'Double displacement', eq: 'Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2NaCl', medium: 'liquid', slider: 'Heat', key: 'Ba2', prod: 'BaSO4',
      energy: 'Very little heat change', legend: ['Ba2', 'SO4', 'Na', 'Cl', 'BaSO4'],
      init: function () { scatter('Ba2', 14); scatter('Cl', 28); scatter('Na', 28); scatter('SO4', 14); },
      rules: [{ a: 'Ba2', b: 'SO4', p: 0.03, out: ['BaSO4'], sink: true }],
      see: function () { return st.prog > 0.03 ? 'A white precipitate forms and sinks' : 'Two clear solutions mixed'; } }
  };
  var ORDER = ['cao', 'coal', 'caco3', 'agcl', 'fe', 'zn', 'none', 'baso4'];
  var st = { parts: [], k0: 1, prog: 0, burning: false, acc: 0, rng: Math.random, glow: 0, pile: [] };
  var NB = 40;

  function rx(p) { return RX[p.rx] || RX.cao; }
  function add(sp, x, y, mode) {
    var q = { sp: sp, x: x, y: y, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, mode: mode || 'free', age: 0 };
    st.parts.push(q); return q;
  }
  function top() { return st.medium === 'liquid' ? LIQ : 0.02; }
  function scatter(sp, n, y0, y1) {
    for (var i = 0; i < n; i++) {
      var x = 0.05 + Math.random() * 0.9, lo = Math.max(top() + R, y0 || 0), hi = y1 || WH - R * 2;
      if (st.hasStrip && x > 0.24 && x < 0.42) x += 0.2;
      add(sp, x, lo + Math.random() * (hi - lo));
    }
  }
  function heap(sp, n) {
    var rows = [6, 5, 4, 3, 2, 1], k = 0, d = R * 2.1;
    for (var r = 0; r < rows.length && k < n; r++) for (var i = 0; i < rows[r] && k < n; i++, k++) add(sp, WW / 2 + (i - (rows[r] - 1) / 2) * d, WH - R * 1.2 - r * d * 0.85, 'fixed');
  }
  function layer(sp, n) {
    var per = 12, d = R * 2.2;
    for (var k = 0; k < n; k++) add(sp, WW / 2 + ((k % per) - (per - 1) / 2) * d, WH - R * 1.4 - Math.floor(k / per) * d * 0.9, 'fixed');
  }
  var SX0 = 0.26, SCOLS = 3, SROWS = 14;
  function strip(sp) {
    st.hasStrip = true;
    for (var j = 0; j < SROWS; j++) for (var i = 0; i < SCOLS; i++) {
      var q = add(sp, SX0 + R + i * R * 2, 0.04 + R + j * R * 2, 'fixed'); q.cell = [i, j];
    }
  }
  function count(sp) { var n = 0; st.parts.forEach(function (q) { if (q.sp === sp && q.mode !== 'gone') n++; }); return n; }
  function pileY(x) { var b = M.clamp(Math.floor(x / WW * NB), 0, NB - 1); return WH - R - st.pile[b] * R * 1.7; }

  function stepFree(q, dt, f) {
    var kick = 1.6 * f;
    q.vx += (Math.random() - 0.5) * kick * Math.sqrt(dt) * 6; q.vy += (Math.random() - 0.5) * kick * Math.sqrt(dt) * 6;
    var damp = Math.exp(-3 * dt); q.vx *= damp; q.vy *= damp;
    q.x += q.vx * dt; q.y += q.vy * dt;
    var t0 = top() + R, x0 = R, x1 = WW - R, y1 = WH - R;
    if (q.x < x0) { q.x = x0; q.vx = Math.abs(q.vx); } if (q.x > x1) { q.x = x1; q.vx = -Math.abs(q.vx); }
    if (q.y < t0) { q.y = t0; q.vy = Math.abs(q.vy); } if (q.y > y1) { q.y = y1; q.vy = -Math.abs(q.vy); }
    if (st.hasStrip && q.y < 0.04 + SROWS * R * 2 + R && q.x > SX0 - R && q.x < SX0 + SCOLS * R * 2 + R) {
      var mid = SX0 + SCOLS * R; if (q.x < mid) { q.x = SX0 - R; q.vx = -Math.abs(q.vx); } else { q.x = SX0 + SCOLS * R * 2 + R; q.vx = Math.abs(q.vx); }
      q.hitStrip = q.x < mid ? -1 : 1;
    }
  }

  SimLab.createSim({
    ariaLabel: 'Particles in a beaker, jar, test tube or dish showing a chemical reaction: combination, decomposition, displacement or double displacement. Coloured particles move about and join, split or swap partners, and a graph counts reactant and product particles',
    playLabel: 'Start reaction',
    mobileAspect: '3 / 3.1',
    params: [
      { id: 'rx', label: 'Reaction', type: 'select', value: 'cao', options: [
        { value: 'cao', label: 'Combination: quicklime + water' }, { value: 'coal', label: 'Combination: burning coal' },
        { value: 'caco3', label: 'Decomposition: heating limestone' }, { value: 'agcl', label: 'Decomposition: silver chloride in sunlight' },
        { value: 'fe', label: 'Displacement: iron nail in copper sulphate' }, { value: 'zn', label: 'Displacement: zinc in copper sulphate' },
        { value: 'none', label: 'Displacement? copper in iron sulphate' }, { value: 'baso4', label: 'Double displacement: barium chloride + sodium sulphate' }] },
      { id: 'energy', label: 'Heat (or sunlight)', min: 0, max: 100, step: 5, value: 50, unit: '%', presets: [{ label: 'Off', value: 0 }, { label: 'Gentle', value: 30 }, { label: 'Strong', value: 80 }], help: 'More heat makes particles move faster. Some reactions need heat or light to happen at all.' },
      { id: 'labels', label: 'Show ion labels', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'type', label: 'Type of reaction', short: 'Type', key: true },
      { id: 'prog', label: 'Reaction done', short: 'Done', unit: '%', digits: 0, key: true },
      { id: 'see', label: 'What you see' },
      { id: 'energy', label: 'Energy' },
      { id: 'eq', label: 'Equation' }
    ],
    graph: { title: 'Particles of reactant left and product formed', yLabel: 'particles', xLabel: 'time (s)', window: 40,
      series: [{ label: 'Reactant left', color: '--sim-1' }, { label: 'Product formed', color: '--sim-3' }] },
    reset: function (sim) {
      var r = rx(sim.p);
      st.parts = []; st.hasStrip = false; st.medium = r.medium; st.burning = false; st.prog = 0; st.glow = 0; st.acc = 0;
      st.pile = []; for (var i = 0; i < NB; i++) st.pile.push(0);
      r.init();
      st.k0 = Math.max(1, count(r.key));
    },
    onParam: function (sim, id) { return id !== 'rx'; },
    update: function (sim, dt) {
      var r = rx(sim.p), e = sim.p.energy / 100, f = 0.45 + e, i, j, q;
      if (r === RX.coal && !st.burning && e >= 0.5 && count('C')) st.burning = true;
      if (r === RX.coal && st.burning && (!count('C') || !count('O2'))) st.burning = false;
      st.glow = Math.max(0, st.glow - dt);
      for (i = 0; i < st.parts.length; i++) {
        q = st.parts[i]; q.age += dt;
        if (q.mode === 'free') stepFree(q, dt, f * (st.medium === 'air' ? 1.6 : 1));
        else if (q.mode === 'gas') { q.vy -= 0.5 * dt; q.vx += (Math.random() - 0.5) * 0.6 * dt; q.x = M.clamp(q.x + q.vx * dt, R, WW - R); q.y += q.vy * dt; if (q.y < -0.05) q.mode = 'gone'; }
        else if (q.mode === 'sink') {
          q.vy += 0.4 * dt; q.y += q.vy * dt; q.x += (Math.random() - 0.5) * 0.02;
          var py = pileY(q.x); if (q.y >= py) { q.y = py; q.mode = 'settled'; st.pile[M.clamp(Math.floor(q.x / WW * NB), 0, NB - 1)]++; }
        }
      }
      // reactions, 60 times a second
      st.acc += dt; if (st.acc < 1 / 60) return;
      var step = st.acc; st.acc = 0;
      if (r.rules) r.rules.forEach(function (rule) {
        if (rule.needs && !rule.needs()) return;
        var A = st.parts.filter(function (x) { return x.sp === rule.a && x.mode === 'free'; });
        var B = st.parts.filter(function (x) { return x.sp === rule.b && x.mode !== 'gone' && x.mode !== 'gas'; });
        A.forEach(function (a) {
          if (a.mode !== 'free') return;
          for (var k = 0; k < B.length; k++) {
            var b = B[k]; if (b.mode === 'gone') continue;
            var dx = a.x - b.x, dy = a.y - b.y;
            if (dx * dx + dy * dy < (R * 2.2) * (R * 2.2) && Math.random() < rule.p * f) {
              a.mode = 'gone'; b.mode = 'gone'; st.glow = 0.3;
              var nq = add(rule.out[0], (a.x + b.x) / 2, (a.y + b.y) / 2, rule.sink ? 'sink' : 'free');
              if (rule.sink) { nq.vy = 0; nq.vx = 0; }
              break;
            }
          }
        });
      });
      if (r.decomp) {
        var dc = r.decomp, rate = dc.rate(e);
        st.parts.forEach(function (a) {
          if (a.sp !== dc.sp || a.mode !== 'fixed' || Math.random() >= rate * step) return;
          var partner = null;
          if (dc.pair) {
            var best = 1e9;
            st.parts.forEach(function (b) { if (b !== a && b.sp === dc.sp && b.mode === 'fixed') { var d2 = (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y); if (d2 < best) { best = d2; partner = b; } } });
            if (!partner) return;
            partner.sp = dc.stay;
          }
          a.sp = dc.stay; st.glow = 0.3;
          var g = add(dc.gas, partner ? (a.x + partner.x) / 2 : a.x, a.y - R * 2, 'gas'); g.vy = -0.12; g.vx = (Math.random() - 0.5) * 0.1;
        });
      }
      if (r.strip) {
        var s = r.strip;
        st.parts.forEach(function (a) {
          if (a.sp !== s.ion || a.mode !== 'free' || !a.hitStrip) return;
          var side = a.hitStrip; a.hitStrip = 0;
          if (Math.random() >= s.p * f) return;
          var row = M.clamp(Math.round((a.y - 0.04 - R) / (R * 2)), 0, SROWS - 1), target = null;
          st.parts.forEach(function (m) {
            if (m.sp !== s.metal || m.mode !== 'fixed' || !m.cell || Math.abs(m.cell[1] - row) > 1) return;
            if (!target || (side < 0 ? m.cell[0] < target.cell[0] : m.cell[0] > target.cell[0])) target = m;
          });
          if (!target) return;
          target.sp = s.deposit; a.mode = 'gone'; st.glow = 0.3;
          var ion = add(s.out, a.x, a.y, 'free'); ion.vx = side * 0.1;
        });
      }
      st.prog = M.clamp(1 - count(r.key) / st.k0, 0, 1);
      st.parts = st.parts.filter(function (x) { return x.mode !== 'gone'; });
    },
    sample: function (sim) { var r = rx(sim.p); return [count(r.key), count(r.prod) - (r === RX.none ? count(r.prod) : 0)]; },
    readout: function (sim) {
      var r = rx(sim.p);
      return { type: r.type, prog: st.prog * 100, see: r.see(sim), energy: r.energy, eq: r.eq };
    },
    status: function (sim) { return rx(sim.p).type + ' · ' + rx(sim.p).see(sim); },

    draw: function (sim, now) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, r = rx(p), W = sim.width, H = sim.height, narrow = W < 560, t = (now || performance.now()) / 1000;
      var side = W >= 620 && W > H * 1.15, panelW = side ? Math.min(240, W * 0.3) : 0;
      var headH = narrow ? 50 : 62, footH = side ? 16 : (narrow ? 66 : 74);
      var aw = W - panelW - 24, ah = H - headH - footH;
      var sc = Math.min(aw / WW, ah / WH), cw = WW * sc, ch = WH * sc, cx = 12 + (aw - cw) / 2, cy = headH + (ah - ch) / 2;
      function X(x) { return cx + x * sc; }
      function Y(y) { return cy + y * sc; }
      var rp = R * sc, e = p.energy / 100;
      D.clear(ctx, W, H, c.bg);

      // heat source / sun
      if (r.slider === 'Sunlight') {
        var sx = X(WW) - 4, sy = Y(0) + 4, sr = narrow ? 11 : 15;
        if (e > 0) { ctx.save(); ctx.strokeStyle = 'rgba(251,191,36,' + (0.25 + 0.5 * e).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 20;
          for (var k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(sx - 8, sy + 8); ctx.lineTo(X(0.2 + k * 0.18), Y(WH - 0.05)); ctx.stroke(); } ctx.restore(); }
        D.circle(ctx, sx, sy, sr, e > 0 ? '#fbbf24' : D.alpha(c.ink, 0.15), e > 0 ? '#f59e0b' : c.border, 2);
      } else if (e > 0 && r.medium !== 'liquid' || (r.medium === 'liquid' && e > 0.55)) {
        var fy = Y(WH) + 6, fh = (narrow ? 10 : 16) * (0.4 + e);
        for (var fl = 0; fl < 3; fl++) {
          var fx = X(WW / 2) + (fl - 1) * (narrow ? 12 : 18), wob = Math.sin(t * 9 + fl * 2) * 2;
          ctx.beginPath(); ctx.moveTo(fx - 6, fy + fh); ctx.quadraticCurveTo(fx - 6, fy + fh * 0.3, fx + wob, fy); ctx.quadraticCurveTo(fx + 6, fy + fh * 0.3, fx + 6, fy + fh); ctx.closePath();
          ctx.fillStyle = 'rgba(249,115,22,0.85)'; ctx.fill();
        }
      }

      // container
      var cu = count('Cu2'), fe2 = count('Fe2'), tot = Math.max(1, st.k0);
      ctx.save();
      var ctop = r.medium === 'dish' ? WH * 0.6 : 0;
      D.roundRect(ctx, X(0) - 3, Y(ctop) - 3, cw + 6, ch - ctop * sc + 6, r.medium === 'tube' ? Math.min(cw, ch) * 0.12 : r.medium === 'dish' ? 18 : 6, r.medium === 'dish' ? D.alpha(c.ink, 0.05) : null, c.border, 2.5);
      if (r.medium === 'liquid') {
        var blue = r.key === 'Cu2' ? cu / tot : 0, green = (r === RX.fe ? count('Fe2') / tot : 0) + (r === RX.none ? 0.9 : 0);
        var milky = r === RX.cao ? st.prog : 0;
        var col = 'rgba(' + Math.round(150 - 110 * blue + 30 * green + 80 * milky) + ',' + Math.round(190 - 60 * blue + 40 * green + 50 * milky) + ',' + Math.round(230 - 10 * blue - 60 * green + 10 * milky) + ',' + (0.22 + 0.25 * Math.max(blue, green * 0.6, milky * 0.6)).toFixed(2) + ')';
        ctx.fillStyle = col; ctx.fillRect(X(0), Y(LIQ), cw, ch - LIQ * sc);
        D.line(ctx, X(0), Y(LIQ), X(WW), Y(LIQ), D.alpha(c.s1, 0.6), 1.5);
      } else if (r.medium === 'air' && st.burning) {
        ctx.fillStyle = 'rgba(249,115,22,' + (0.06 + 0.05 * Math.sin(t * 7)).toFixed(3) + ')'; ctx.fillRect(X(0), Y(0), cw, ch);
      }
      ctx.restore();
      // metal strip holder
      if (st.hasStrip) D.line(ctx, X(SX0 + SCOLS * R), Y(0) - 10, X(SX0 + SCOLS * R), Y(0.04), c.muted, 2);

      // particles
      function drawP(q) {
        var s = SP[q.sp], x = X(q.x), y = Y(q.y);
        s.a.forEach(function (a) { D.circle(ctx, x + a[0] * rp, y + a[1] * rp, a[2] * rp, a[3], 'rgba(0,0,0,0.45)', 0.8); });
        if (q.sp === 'C' && st.burning) D.circle(ctx, x, y, rp * 0.6, 'rgba(249,115,22,' + (0.5 + 0.4 * Math.sin(t * 8 + q.x * 40)).toFixed(2) + ')');
        if (s.l && p.labels && rp >= 6) D.text(ctx, s.l, x, y - rp * 1.55, { color: c.ink, size: Math.max(8, Math.min(11, rp * 1.05)), weight: 700, align: 'center' });
      }
      st.parts.forEach(function (q) { if (q.mode === 'fixed' || q.mode === 'settled') drawP(q); });
      st.parts.forEach(function (q) { if (q.mode !== 'fixed' && q.mode !== 'settled') drawP(q); });
      // heat shimmer for exothermic reactions while reacting
      if (st.glow > 0 && /heat/.test(r.energy) && !/Takes/.test(r.energy)) {
        ctx.save(); ctx.strokeStyle = 'rgba(248,113,113,0.6)'; ctx.lineWidth = 1.5;
        for (var hsx = 0; hsx < 3; hsx++) { var hx = X(0.25 + hsx * 0.25); ctx.beginPath(); for (var hq = 0; hq <= 10; hq++) ctx[hq ? 'lineTo' : 'moveTo'](hx + Math.sin(hq * 0.9 + t * 6) * 3, Y(0) - 4 - hq * 2); ctx.stroke(); }
        ctx.restore();
      }

      // headline and equation
      D.text(ctx, r.type + ': ' + r.see(sim), W / 2 - panelW / 2, narrow ? 13 : 17, { color: c.bg, bg: r.type === 'No reaction' ? c.muted : c.s1, size: narrow ? 11 : 14, weight: 700, align: 'center', pad: 4, fit: W - panelW });
      D.text(ctx, r.eq, W / 2 - panelW / 2, narrow ? 34 : 43, { color: c.ink, size: narrow ? 14 : 18, weight: 700, align: 'center', fit: W - panelW });

      // legend: side panel or two rows below
      var items = r.legend;
      if (side) {
        var px = W - panelW + 4, py = headH - 40, pw = panelW - 14;
        D.roundRect(ctx, px, py, pw, Math.min(H - py - 10, 40 + items.length * 34 + 70), 10, D.alpha(c.ink, 0.04), c.grid, 1);
        D.text(ctx, 'Particles', px + 12, py + 16, { color: c.muted, size: 12, weight: 700 });
        items.forEach(function (id, i) {
          var y = py + 44 + i * 34, s = SP[id];
          s.a.forEach(function (a) { D.circle(ctx, px + 24 + a[0] * 9, y + a[1] * 9, a[2] * 9, a[3], 'rgba(0,0,0,0.45)', 0.8); });
          D.text(ctx, s.n, px + 46, y, { color: c.ink, size: 12, fit: W });
        });
        var ey = py + 44 + items.length * 34 + 6;
        D.text(ctx, r.energy, px + 12, ey, { color: /Takes/.test(r.energy) ? c.s1 : /heat/.test(r.energy) ? c.danger : c.muted, size: 12, weight: 700, fit: W });
        if (r.slider === 'Sunlight' || r === RX.coal || r === RX.caco3) D.text(ctx, r === RX.coal ? 'Needs heat to light (ignition)' : r.slider === 'Sunlight' ? 'Needs light' : 'Needs strong heat', px + 12, ey + 20, { color: c.muted, size: 12, fit: W });
      } else {
        var ly = H - footH + (narrow ? 14 : 16), perRow = Math.ceil(items.length / 2), colW = (W - 16) / perRow, ls = narrow ? 6 : 8;
        items.forEach(function (id, i) {
          var row = Math.floor(i / perRow), col = i % perRow, x = 8 + col * colW + 14, y = ly + row * (narrow ? 22 : 26), s = SP[id];
          s.a.forEach(function (a) { D.circle(ctx, x + a[0] * ls, y + a[1] * ls, a[2] * ls, a[3], 'rgba(0,0,0,0.45)', 0.8); });
          var nm = narrow ? s.n.replace(/^[A-Za-z ]+ (?=[A-Z][a-z]?[₀-₉²⁺⁻(])/, '') : s.n;
          D.text(ctx, nm, x + ls * 2 + 4, y, { color: c.ink, size: narrow ? 10 : 11 });
        });
        D.text(ctx, r.energy, W / 2, H - (narrow ? 9 : 10), { color: /Takes/.test(r.energy) ? c.s1 : /heat/.test(r.energy) ? c.danger : c.muted, size: narrow ? 10 : 11, weight: 700, align: 'center', fit: W });
      }
    }
  });
})();
