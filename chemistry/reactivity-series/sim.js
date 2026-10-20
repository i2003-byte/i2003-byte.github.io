/* =====================================================================
   Chemistry · Reactivity Series: Which Metal Wins? — sim.js
   ---------------------------------------------------------------------
   Two kinds of test, both used in Class 10 to build the series
       K > Na > Ca > Mg > Al > Zn > Fe > Pb > [H] > Cu > Ag
   1. Salt solutions: a strip of one metal is dipped into a rack of
      seven salt solutions. It displaces the metal of a salt only if it
      is MORE reactive:  A + BX → AX + B.  The solution takes the colour
      of the new metal ion (Cu²⁺ blue, Fe²⁺ pale green, the rest
      colourless) and the displaced metal coats the strip.
      Speed grows with the gap in the series. Aluminium is slowed by
      its oxide skin; lead in copper sulphate is slowed by a skin of
      insoluble lead sulphate.
   2. Water, steam and dilute HCl: hydrogen bubbles at a rate that
      follows the series (made-up but ordered rates, 0…1). Metals below
      hydrogen give no gas with dilute acid. K and Na are never put in
      hot water, steam or acid.
   No timed physics: transport:false; each tube runs a short animation
   from the moment it is tapped (performance.now()).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- salt-solution test ---------- */
  var SM = {   // metal strips: rank (higher = more reactive), strip colour, deposit colour, ion colour in water
    Mg: { name: 'magnesium', rank: 7, strip: '#d9dbe0', dep: '#3f3f46', ion: null },
    Al: { name: 'aluminium', rank: 6, strip: '#e5e7eb', dep: '#8d939e', ion: null },
    Zn: { name: 'zinc', rank: 5, strip: '#a7b0bf', dep: '#4b4f58', ion: null },
    Fe: { name: 'iron', rank: 4, strip: '#6b7280', dep: '#1c1f26', ion: '#b9e3ad' },
    Pb: { name: 'lead', rank: 3, strip: '#7c7f8a', dep: '#9aa0ab', ion: null, tree: true },
    Cu: { name: 'copper', rank: 2, strip: '#c96f3e', dep: '#8f3412', ion: '#4f8ff7' },
    Ag: { name: 'silver', rank: 1, strip: '#eef2f7', dep: '#d5dbe3', ion: null, tree: true }
  };
  var SORDER = ['Mg', 'Al', 'Zn', 'Fe', 'Pb', 'Cu', 'Ag'];
  var SALTS = [
    { m: 'Mg', f: 'MgSO₄', liq: null }, { m: 'Al', f: 'Al₂(SO₄)₃', liq: null }, { m: 'Zn', f: 'ZnSO₄', liq: null },
    { m: 'Fe', f: 'FeSO₄', liq: '#b9e3ad' }, { m: 'Pb', f: 'Pb(NO₃)₂', liq: null },
    { m: 'Cu', f: 'CuSO₄', liq: '#4f8ff7' }, { m: 'Ag', f: 'AgNO₃', liq: null }
  ];
  var EQ = {
    'Mg>Al': '3Mg + Al₂(SO₄)₃ → 3MgSO₄ + 2Al', 'Mg>Zn': 'Mg + ZnSO₄ → MgSO₄ + Zn', 'Mg>Fe': 'Mg + FeSO₄ → MgSO₄ + Fe',
    'Mg>Pb': 'Mg + Pb(NO₃)₂ → Mg(NO₃)₂ + Pb', 'Mg>Cu': 'Mg + CuSO₄ → MgSO₄ + Cu', 'Mg>Ag': 'Mg + 2AgNO₃ → Mg(NO₃)₂ + 2Ag',
    'Al>Zn': '2Al + 3ZnSO₄ → Al₂(SO₄)₃ + 3Zn', 'Al>Fe': '2Al + 3FeSO₄ → Al₂(SO₄)₃ + 3Fe',
    'Al>Pb': '2Al + 3Pb(NO₃)₂ → 2Al(NO₃)₃ + 3Pb', 'Al>Cu': '2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu', 'Al>Ag': 'Al + 3AgNO₃ → Al(NO₃)₃ + 3Ag',
    'Zn>Fe': 'Zn + FeSO₄ → ZnSO₄ + Fe', 'Zn>Pb': 'Zn + Pb(NO₃)₂ → Zn(NO₃)₂ + Pb', 'Zn>Cu': 'Zn + CuSO₄ → ZnSO₄ + Cu',
    'Zn>Ag': 'Zn + 2AgNO₃ → Zn(NO₃)₂ + 2Ag', 'Fe>Pb': 'Fe + Pb(NO₃)₂ → Fe(NO₃)₂ + Pb', 'Fe>Cu': 'Fe + CuSO₄ → FeSO₄ + Cu',
    'Fe>Ag': 'Fe + 2AgNO₃ → Fe(NO₃)₂ + 2Ag', 'Pb>Cu': 'Pb + CuSO₄ → PbSO₄ + Cu (slow)', 'Pb>Ag': 'Pb + 2AgNO₃ → Pb(NO₃)₂ + 2Ag',
    'Cu>Ag': 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag'
  };
  var COLWORD = { '#4f8ff7': 'blue', '#b9e3ad': 'pale green' };

  function wins(m, s) { return SM[m].rank > SM[s.m].rank; }
  function saltRate(m, s) {   // 1/s for progress = 1 − e^(−rate·t)
    var r = 0.35 + 0.18 * (SM[m].rank - SM[s.m].rank);
    if (m === 'Al') r *= 0.35;
    if (m === 'Pb' && s.m === 'Cu') r *= 0.3;
    return r;
  }
  function saltObs(m, s, sym) {
    if (m === s.m && sym !== 'X') return 'No change: it is the same metal';
    if (!wins(m, s)) return 'No change: ' + sym + (sym === 'X' ? ' is not more reactive than ' : ' is less reactive than ') + s.m;
    var from = s.liq ? COLWORD[s.liq] : 'colourless', to = SM[m].ion ? COLWORD[SM[m].ion] : 'colourless';
    var txt = SM[s.m].name + ' coats the strip';
    if (from !== to) txt += '; solution ' + from + ' → ' + to;
    if (m === 'Al' && sym !== 'X') txt += ' (slow: oxide skin)';
    if (m === 'Pb' && s.m === 'Cu' && sym !== 'X') txt += ' (slow: lead sulphate skin)';
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }

  /* ---------- water / steam / acid test ---------- */
  var WM = ['K', 'Na', 'Ca', 'Mg', 'Al', 'Zn', 'Fe', 'Pb', 'Cu', 'Ag'];
  var WCOL = { K: '#d4d4d8', Na: '#e4e4e7', Ca: '#d6d3d1', Mg: '#d9dbe0', Al: '#e5e7eb', Zn: '#a7b0bf', Fe: '#6b7280', Pb: '#7c7f8a', Cu: '#c96f3e', Ag: '#eef2f7' };
  var NO = function (why) { return { rate: 0, eq: 'No reaction', obs: why }; };
  var REF = function (why) { return { refuse: true, rate: 0, eq: 'Not done in a lab', obs: why }; };
  var R = {
    cold: {
      K: { rate: 1, eq: '2K + 2H₂O → 2KOH + H₂', obs: 'Violent: it races about on the surface and the hydrogen catches fire (lilac flame)', float: true, fire: '#c084fc', base: true },
      Na: { rate: 0.8, eq: '2Na + 2H₂O → 2NaOH + H₂', obs: 'Vigorous: melts into a ball, fizzes about on the surface and may catch fire (yellow)', float: true, fire: '#fbbf24', base: true },
      Ca: { rate: 0.4, eq: 'Ca + 2H₂O → Ca(OH)₂ + H₂', obs: 'Steady fizzing; bubbles stick to it and it starts to float', rise: true, base: true },
      Mg: { rate: 0.04, eq: 'Mg + 2H₂O → Mg(OH)₂ + H₂ (very slow)', obs: 'Hardly anything: a few tiny bubbles after a long time' },
      Al: NO('No reaction with cold water'), Zn: NO('No reaction with cold water'), Fe: NO('No reaction with cold water (it rusts over days)'),
      Pb: NO('No reaction with water'), Cu: NO('No reaction with water'), Ag: NO('No reaction with water')
    },
    hot: {
      K: REF('Not done: already violent in cold water'), Na: REF('Not done: already violent in cold water'),
      Ca: { rate: 0.75, eq: 'Ca + 2H₂O → Ca(OH)₂ + H₂', obs: 'Fast fizzing; it floats on its own bubbles', rise: true, base: true },
      Mg: { rate: 0.25, eq: 'Mg + 2H₂O → Mg(OH)₂ + H₂', obs: 'Hydrogen bubbles stick to the ribbon and it floats up', rise: true, base: true },
      Al: NO('No reaction with hot water'), Zn: NO('No reaction with hot water'), Fe: NO('No reaction with hot water'),
      Pb: NO('No reaction with water'), Cu: NO('No reaction with water'), Ag: NO('No reaction with water')
    },
    steam: {
      K: REF('Not done: already violent in cold water'), Na: REF('Not done: already violent in cold water'), Ca: REF('Not needed: it reacts with cold water'),
      Mg: { rate: 0.8, eq: 'Mg + H₂O → MgO + H₂', obs: 'Burns with a dazzling white light, leaving white magnesium oxide', glow: '#ffffff' },
      Al: { rate: 0.4, eq: '2Al + 3H₂O → Al₂O₃ + 3H₂', obs: 'Red-hot aluminium slowly gives hydrogen and white aluminium oxide' },
      Zn: { rate: 0.32, eq: 'Zn + H₂O → ZnO + H₂', obs: 'Hot zinc gives hydrogen; zinc oxide is yellow when hot, white when cold' },
      Fe: { rate: 0.2, eq: '3Fe + 4H₂O → Fe₃O₄ + 4H₂', obs: 'Red-hot iron slowly gives hydrogen and black iron oxide' },
      Pb: NO('No reaction, even with steam'), Cu: NO('No reaction, even with steam'), Ag: NO('No reaction, even with steam')
    },
    acid: {
      K: REF('Never done: it explodes with acid'), Na: REF('Never done: it explodes with acid'),
      Ca: { rate: 1, eq: 'Ca + 2HCl → CaCl₂ + H₂', obs: 'Very fast fizzing; the tube gets hot' },
      Mg: { rate: 0.85, eq: 'Mg + 2HCl → MgCl₂ + H₂', obs: 'Fast fizzing; the ribbon dissolves and the tube warms up' },
      Al: { rate: 0.6, lag: true, eq: '2Al + 6HCl → 2AlCl₃ + 3H₂', obs: 'Slow at first (oxide skin), then strong fizzing' },
      Zn: { rate: 0.45, eq: 'Zn + 2HCl → ZnCl₂ + H₂', obs: 'Steady fizzing' },
      Fe: { rate: 0.22, eq: 'Fe + 2HCl → FeCl₂ + H₂', obs: 'Slow fizzing; the solution turns pale green', ion: '#b9e3ad' },
      Pb: { rate: 0.04, eq: 'Pb + 2HCl → PbCl₂ + H₂ (very slow)', obs: 'Barely any bubbles: a lead chloride skin slows it' },
      Cu: NO('No gas: copper is below hydrogen in the series'), Ag: NO('No gas: silver is below hydrogen in the series')
    }
  };
  var LIQNAME = { cold: 'cold water', hot: 'hot water', steam: 'steam', acid: 'dilute HCl' };
  var WATER_RUN = 12;   // seconds of animation per tube in the water tests

  function isSalt(sim) { return sim.p.exp === 'salt'; }
  function stripMetal(sim) { return sim.p.mystery ? sim.state.x : sim.p.metal; }
  function stripSym(sim) { return sim.p.mystery ? 'X' : sim.p.metal; }
  function key(sim) { return isSalt(sim) ? 'salt:' + stripMetal(sim) : sim.p.exp; }

  function layout(sim) {
    var W = sim.width, H = sim.height, salt = isSalt(sim), n = salt ? SALTS.length : WM.length, small = W < 560;
    var gridW = salt && !sim.p.mystery && W >= 760 && H >= 330 ? Math.min(250, W * 0.3) : 0;
    var aw = W - gridW, cols = salt ? (small ? 4 : 7) : (aw / 10 >= 62 ? 10 : 5), rows = Math.ceil(n / cols);
    var top = small ? 30 : 36, bot = H - 4, rh = (bot - top) / rows, cw = aw / cols, lab = small ? 34 : 40;
    var th = Math.min(rh - lab - 20 - (sim.p.exp === 'steam' ? 12 : 0), 330), tw = Math.min(cw * 0.46, 56, th * 0.3);
    var cells = [], spare = Math.max(0, (rh - th - lab - 20) / 2);
    for (var i = 0; i < n; i++) {
      var cx = (i % cols + 0.5) * cw, ry = top + Math.floor(i / cols) * rh;
      cells.push({ cx: cx, x: cx - tw / 2, y: ry + 18 + spare, w: tw, h: th, cw: cw, rh: rh, ry: ry });
    }
    return { W: W, H: H, cells: cells, small: small, top: top, gridW: gridW, aw: aw };
  }

  function tap(sim, i) {
    var st = sim.state, k = key(sim);
    if (!isSalt(sim) && R[sim.p.exp][WM[i]].refuse) { st.last = i; st.lastKey = k; sim.redraw(); return; }
    st.res[k] = st.res[k] || {};
    st.res[k][i] = reduce ? -1e9 : performance.now();
    if (isSalt(sim) && !sim.p.mystery) { st.grid[sim.p.metal] = st.grid[sim.p.metal] || {}; st.grid[sim.p.metal][i] = true; }
    st.last = i; st.lastKey = k;
    sim.redraw();
  }
  function newX(st) { var c = SORDER.filter(function (m) { return m !== st.x; }); st.x = c[Math.floor(Math.random() * c.length)]; st.res = {}; st.last = null; st.revealed = false; }

  SimLab.createSim({
    ariaLabel: 'A rack of test tubes. Dip a metal strip into seven salt solutions to see which metals it displaces, or add ten metals to cold water, hot water, steam or dilute hydrochloric acid and compare how fast hydrogen bubbles off',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'exp', label: 'Experiment', type: 'select', value: 'salt', options: [
        { value: 'salt', label: 'Metal strip in salt solutions' }, { value: 'cold', label: 'Metals in cold water' },
        { value: 'hot', label: 'Metals in hot water' }, { value: 'steam', label: 'Metals heated in steam' },
        { value: 'acid', label: 'Metals in dilute hydrochloric acid' }] },
      { id: 'metal', label: 'Metal strip (salt solutions)', type: 'select', value: 'Zn', options: SORDER.map(function (m) {
        return { value: m, label: SM[m].name.charAt(0).toUpperCase() + SM[m].name.slice(1) + ' (' + m + ')' }; }) },
      { id: 'mystery', label: 'Challenge: mystery metal X', type: 'toggle', value: false, help: 'Dip an unknown strip into the salts and work out what it is.' }
    ],
    buttonsTitle: 'Test',
    buttons: [
      { label: 'Test every tube', primary: true, full: true, onClick: function (sim) {
        var n = isSalt(sim) ? SALTS.length : WM.length;
        for (var i = 0; i < n; i++) if (isSalt(sim) || !R[sim.p.exp][WM[i]].refuse) tap(sim, i);
        sim.state.last = null; sim.redraw();
      } },
      { label: 'Wash the tubes', full: true, onClick: function (sim) { sim.state.res = {}; sim.state.last = null; sim.redraw(); } },
      { label: 'Reveal X / new mystery metal', full: true, onClick: function (sim) {
        var st = sim.state;
        if (!sim.p.mystery || sim.p.exp !== 'salt') { sim.setParam('exp', 'salt'); sim.setParam('mystery', true); newX(st); }
        else if (!st.revealed) st.revealed = true; else newX(st);
        sim.redraw();
      } }
    ],
    readouts: [
      { id: 'obs', label: 'What you see', key: true },
      { id: 'eq', label: 'Equation', key: true },
      { id: 'rank', label: 'Series from your tests', short: 'Your series' }
    ],
    onParam: function (sim, id) {
      var st = sim.state;
      if (id === 'mystery') { if (sim.p.mystery) { if (sim.p.exp !== 'salt') sim.setParam('exp', 'salt'); newX(st); } else { st.res = {}; st.last = null; } }
      else st.last = null;
      sim.redraw(); return true;
    },
    reset: function (sim) { sim.state = { res: {}, grid: {}, last: null, x: 'Fe', revealed: false }; newX(sim.state); },
    animate: function (sim) {
      var r = sim.state.res[key(sim)], now = performance.now(), salt = isSalt(sim);
      if (!r) return false;
      for (var i in r) {
        var t = (now - r[i]) / 1000;
        if (salt ? t < 0.6 + 4 / saltRate(stripMetal(sim), SALTS[i]) && wins(stripMetal(sim), SALTS[i]) || t < 0.6 : t < WATER_RUN) return true;
      }
      return false;
    },
    readout: function (sim) {
      var st = sim.state, out = { obs: 'Tap a test tube', eq: '—', rank: '' };
      if (isSalt(sim)) {
        var m = stripMetal(sim), sym = stripSym(sim);
        if (st.last != null && st.lastKey === key(sim)) {
          var s = SALTS[st.last];
          out.obs = s.f + ': ' + saltObs(m, s, sym);
          out.eq = wins(m, s) ? (sim.p.mystery && !st.revealed ? 'X + salt of ' + s.m + ' → salt of X + ' + s.m : EQ[m + '>' + s.m]) : 'No reaction';
        }
        out.rank = sim.p.mystery ? mysteryText(sim) : seriesText(st);
      } else {
        var e = R[sim.p.exp], r = st.res[sim.p.exp] || {};
        if (st.last != null && st.lastKey === key(sim)) { var w = WM[st.last]; out.obs = w + ' in ' + LIQNAME[sim.p.exp] + ': ' + e[w].obs; out.eq = e[w].eq; }
        var tested = WM.filter(function (w, i) { return r[i] != null; });
        if (!tested.length) out.rank = 'Tap tubes and compare the bubbles';
        else {
          var yes = tested.filter(function (w) { return e[w].rate > 0; }).sort(function (a, b) { return e[b].rate - e[a].rate; });
          var no = tested.filter(function (w) { return e[w].rate === 0; });
          out.rank = (yes.length ? 'fastest ' + yes.join(' > ') : 'no gas yet') + (no.length ? ' · no gas: ' + no.join(', ') : '');
        }
      }
      return out;
    },
    status: function (sim) { return isSalt(sim) ? 'Tap a salt solution to dip the ' + (sim.p.mystery ? 'mystery strip X' : SM[sim.p.metal].name + ' strip') : 'Tap a tube to add that metal to ' + LIQNAME[sim.p.exp]; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim);
        for (var i = 0; i < L.cells.length; i++) {
          var c = L.cells[i];
          if (Math.abs(x - c.cx) < c.cw / 2 && y > c.ry && y < c.ry + c.rh) { tap(sim, i); return true; }
        }
        return false;
      },
      hover: function (sim, x, y) { var L = layout(sim); return x < L.aw && y > L.top; }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, st = sim.state, L = layout(sim), fs = L.small ? 10 : 12;
      D.clear(ctx, L.W, L.H, col.bg);
      var head = isSalt(sim)
        ? (L.small ? 'Tap a tube: dip the ' : 'Tap a solution to dip the ') + (sim.p.mystery ? 'mystery strip X' : SM[sim.p.metal].name + ' (' + sim.p.metal + ') strip')
        : (L.small ? 'Tap a tube: metal + ' : 'Tap a tube to add the metal to ') + LIQNAME[sim.p.exp] + (sim.p.exp === 'cold' || sim.p.exp === 'hot' ? (L.small ? '' : ' (with phenolphthalein)') : '');
      D.text(ctx, head, L.aw / 2, L.small ? 13 : 16, { color: col.bg, bg: col.s3, size: L.small ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: L.aw });
      var seen = {};
      L.cells.forEach(function (c) {
        if (seen[c.ry]) return; seen[c.ry] = true;
        D.roundRect(ctx, 6, c.y + c.h * 0.68, L.aw - 12, 6, 3, col.light ? '#c8a27a' : '#7c5a3a');
      });
      if (isSalt(sim)) drawSalt(sim, ctx, col, st, L, now, fs); else drawWater(sim, ctx, col, st, L, now, fs);
      if (L.gridW) drawGrid(sim, ctx, col, st, L);
    }
  });

  function seriesText(st) {
    var done = SORDER.filter(function (m) { var g = st.grid[m]; return g && SALTS.every(function (s, i) { return g[i]; }); });
    if (!done.length) return 'Test a metal in all 7 tubes to place it';
    done.sort(function (a, b) { return SM[b].rank - SM[a].rank; });
    return done.join(' > ') + (done.length < 7 ? ' (' + (7 - done.length) + ' still to test)' : ' ✓ complete');
  }
  function mysteryText(sim) {
    var st = sim.state, r = st.res[key(sim)] || {}, lo = 0, hi = 99, any = false;
    SALTS.forEach(function (s, i) {
      if (r[i] == null) return; any = true;
      if (wins(st.x, s)) lo = Math.max(lo, SM[s.m].rank); else hi = Math.min(hi, SM[s.m].rank);
    });
    if (st.revealed) return 'X is ' + SM[st.x].name + ' (' + st.x + ')';
    if (!any) return 'Dip X into the salts to narrow it down';
    var c = SORDER.filter(function (m) { return SM[m].rank > lo && SM[m].rank <= hi; });
    return c.length === 1 ? 'X must be ' + SM[c[0]].name + ' (' + c[0] + ')!' : 'X could be ' + c.join(', ');
  }

  function liquidRect(ctx, c, top, color) { ctx.fillStyle = color; ctx.fillRect(c.x, top, c.w, c.y + c.h - top); }

  function drawSalt(sim, ctx, col, st, L, now, fs) {
    var m = stripMetal(sim), r = st.res[key(sim)] || {}, clear = col.light ? '#e9f2f8' : '#dbe7ef';
    L.cells.forEach(function (c, i) {
      var s = SALTS[i], t0 = r[i], tested = t0 != null, t = tested ? Math.max(0, (now - t0) / 1000) : 0;
      var dip = tested ? M.clamp(t / 0.5, 0, 1) : 0, win = wins(m, s), p = tested && win ? 1 - Math.exp(-saltRate(m, s) * Math.max(0, t - 0.5)) : 0;
      if (tested && win && t0 < 0) p = 1;
      var top = c.y + c.h * 0.3, bottom = c.y + c.h;
      ctx.save(); tube(ctx, c.x, c.y, c.w, c.h); ctx.clip();
      liquidRect(ctx, c, top, clear);
      var a = (s.liq ? 0.85 : 0) * (1 - p), b = (SM[m].ion ? 0.85 : 0) * p;
      if (s.liq && a > 0.01) { ctx.globalAlpha = a; liquidRect(ctx, c, top, s.liq); }
      if (SM[m].ion && win && b > 0.01) { ctx.globalAlpha = b; liquidRect(ctx, c, top, SM[m].ion); }
      ctx.globalAlpha = 1;
      // strip
      if (tested) {
        var sw = Math.max(6, c.w * 0.34), sx = c.cx - sw / 2, sy = c.y - 16 + dip * c.h * 0.16, sh = c.h * 0.8;
        ctx.restore(); ctx.save();
        ctx.fillStyle = SM[m].strip; ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, sw, sh);
        var wetTop = Math.max(top, sy), wetBot = sy + sh;
        if (p > 0.01 && wetBot > wetTop) {
          var dep = SM[s.m], rng = M.rng(i * 31 + SM[m].rank * 7 + 1);
          ctx.globalAlpha = Math.min(1, p * 1.3); ctx.fillStyle = dep.dep;
          ctx.fillRect(sx - 1, wetTop, sw + 2, wetBot - wetTop);
          ctx.globalAlpha = 1;
          var nb = Math.round(10 * p);
          for (var k = 0; k < 14; k++) {
            var yy = wetTop + rng() * (wetBot - wetTop), side = rng() < 0.5 ? -1 : 1, len = (dep.tree ? 9 : 3) * (0.4 + rng()) * p;
            if (k >= nb + 4) continue;
            if (dep.tree) D.line(ctx, c.cx + side * sw / 2, yy, c.cx + side * (sw / 2 + len), yy - len * 0.4, dep.dep, 1.6);
            else D.circle(ctx, c.cx + side * (sw / 2 + 0.5), yy, 1.4 + 1.6 * p * rng(), dep.dep);
          }
        }
      }
      ctx.restore();
      tube(ctx, c.x, c.y, c.w, c.h); ctx.strokeStyle = col.light ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 1.6; ctx.stroke();
      var ly = c.y + c.h + 12;
      D.text(ctx, s.f, c.cx, ly, { color: col.text, size: fs, weight: 700, align: 'center', fit: L.aw });
      if (tested && (t > 0.6 || t0 < 0)) {
        var word = m === s.m && !sim.p.mystery ? 'same metal' : win ? s.m + ' out ✓' : 'no change';
        D.text(ctx, word, c.cx, ly + 15, { color: win ? col.success : col.muted, size: L.small ? 9.5 : 11, weight: win ? 800 : 600, align: 'center', fit: L.aw });
      } else if (!tested) {
        D.text(ctx, s.liq ? COLWORD[s.liq] : 'colourless', c.cx, ly + 15, { color: col.faint, size: L.small ? 9 : 10.5, align: 'center', fit: L.aw });
      }
    });
  }

  function drawWater(sim, ctx, col, st, L, now, fs) {
    var e = R[sim.p.exp], r = st.res[sim.p.exp] || {}, steam = sim.p.exp === 'steam', acid = sim.p.exp === 'acid';
    var clear = col.light ? '#e3f0f9' : '#d6e6f2';
    L.cells.forEach(function (c, i) {
      var w = WM[i], d = e[w], t0 = r[i], tested = t0 != null, t = tested ? Math.max(0, (now - t0) / 1000) : 0;
      var still = reduce || t0 < 0, run = tested && (still || t < WATER_RUN), p = tested ? (still ? 1 : M.clamp(t / WATER_RUN, 0, 1)) : 0;
      var top = steam ? c.y + c.h : c.y + c.h * 0.3, bottom = c.y + c.h;
      var rate = d.lag ? d.rate * M.clamp((still ? 99 : t) / 4, 0.15, 1) : d.rate;
      ctx.save(); tube(ctx, c.x, c.y, c.w, c.h); ctx.clip();
      if (!steam) {
        liquidRect(ctx, c, top, clear);
        if (tested && d.base) { ctx.globalAlpha = M.clamp(p * 4, 0, 0.75); liquidRect(ctx, c, top, '#ec4899'); }
        if (tested && d.ion) { ctx.globalAlpha = M.clamp(p * 1.5, 0, 0.8); liquidRect(ctx, c, top, d.ion); }
        ctx.globalAlpha = 1;
      } else if (tested && !d.refuse) {
        // steam: faint mist and wavy wisps rising through the tube
        ctx.fillStyle = D.alpha(col.light ? '#94a3b8' : '#e2e8f0', 0.12); ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = D.alpha(col.light ? '#64748b' : '#f1f5f9', 0.45); ctx.lineWidth = 1.4;
        for (var q = 0; q < 3; q++) {
          var off = (still ? 0 : now / 400) + q * 2.1, wx = c.cx + (q - 1) * c.w * 0.25;
          ctx.beginPath();
          for (var yy = bottom - 6; yy > c.y + 4; yy -= 3) { var xx = wx + Math.sin(yy / 9 + off) * c.w * 0.08; if (yy === bottom - 6) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
          ctx.stroke();
        }
      }
      if (tested && !d.refuse) {
        // the metal piece
        var size = Math.max(4, c.w * 0.32) * (1 - 0.6 * p * d.rate), floatY = d.float ? top - size * 0.3 : d.rise && p > 0.15 ? top + 2 + size * 0.2 : bottom - size - 3;
        var px = c.cx + (d.float && !still ? Math.sin(now / 240 + i) * (c.w / 2 - size) : 0);
        var hot = steam ? (col.light ? '#f97316' : '#fb923c') : null;
        if (w === 'Mg') D.roundRect(ctx, px - size * 0.25, floatY - size * 0.6, size * 0.5, size * 1.6, 1, WCOL[w]);
        else D.roundRect(ctx, px - size / 2, floatY, size, size, 2, WCOL[w]);
        if (hot && d.rate > 0) { ctx.globalAlpha = 0.5; D.roundRect(ctx, px - size / 2, floatY, size, size, 2, hot); ctx.globalAlpha = 1; }
        if (d.glow && run) D.circle(ctx, px, floatY + size / 2, size * (1.2 + 0.3 * Math.sin(now / 60)), D.alpha('#ffffff', 0.75));
        // hydrogen bubbles
        var nb = Math.round(16 * Math.sqrt(rate));
        if (rate > 0) {
          if (rate < 0.08) nb = 2;
          for (var k = 0; k < nb; k++) {
            var ph2 = still ? (k + 0.5) / nb : ((now / 1000) * (0.4 + rate * 1.2) + k / nb) % 1;
            if (!run && !still) break;
            var by = floatY + size / 2 - ph2 * (floatY + size / 2 - (steam ? c.y : top)), bx = px + Math.sin(k * 7.3 + ph2 * 5) * size * 0.8;
            D.circle(ctx, bx, by, 1.2 + (k % 3) * 0.7, null, steam && !col.light ? '#f8fafc' : '#475569', 1);
          }
        }
        if (d.fire && run && !still) {
          var fl = c.w * 0.32 * (0.8 + 0.3 * Math.sin(now / 50));
          ctx.globalAlpha = 0.85; ctx.fillStyle = d.fire; ctx.beginPath();
          ctx.moveTo(px - fl * 0.5, top); ctx.quadraticCurveTo(px, top - fl * 2.4, px + fl * 0.5, top); ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
      tube(ctx, c.x, c.y, c.w, c.h); ctx.strokeStyle = col.light ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 1.6; ctx.stroke();
      if (steam && tested && !d.refuse) {   // burner flame under the tube
        var fy = c.y + c.h + 2, fh = Math.min(10, c.w * 0.3);
        ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.moveTo(c.cx - fh * 0.5, fy + fh); ctx.quadraticCurveTo(c.cx, fy - fh * 0.2, c.cx + fh * 0.5, fy + fh); ctx.fill();
      }
      var ly = c.y + c.h + (steam ? 24 : 12);
      D.text(ctx, w, c.cx, ly, { color: col.text, size: fs + 1, weight: 800, align: 'center', fit: L.aw });
      var word = '';
      if (st.last === i && st.lastKey === key(sim) && d.refuse) word = '⛔ not done';
      else if (tested) word = d.rate === 0 ? 'no gas' : d.rate >= 0.75 ? 'very fast' : d.rate >= 0.4 ? 'fast' : d.rate >= 0.15 ? 'slow' : 'very slow';
      if (word) D.text(ctx, word, c.cx, ly + 15, { color: d.refuse ? col.danger : d.rate > 0 ? col.success : col.muted, size: L.small ? 9.5 : 11, weight: 700, align: 'center', fit: L.aw });
    });
  }

  function drawGrid(sim, ctx, col, st, L) {
    var x0 = L.aw + 6, w = L.gridW - 12, y0 = L.top + 4, n = SORDER.length;
    var cell = Math.min((w - 34) / n, (L.H - y0 - 40) / (n + 1)), gx = x0 + 34, gy = y0 + 22 + cell * 0.2;
    D.roundRect(ctx, x0 - 2, y0 - 2, w + 4, cell * (n + 1) + 48, 8, col.light ? '#f1f5f9' : '#111a2e', col.border, 1);
    D.text(ctx, 'Results: strip ↓ in salt →', x0 + 6, y0 + 9, { color: col.muted, size: 11, weight: 700 });
    SORDER.forEach(function (s, j) { D.text(ctx, s, gx + (j + 0.5) * cell, gy, { color: col.text, size: 10.5, weight: 700, align: 'center' }); });
    SORDER.forEach(function (m, r) {
      var yy = gy + (r + 1) * cell;
      D.text(ctx, m, x0 + 14, yy, { color: col.text, size: 11, weight: 800, align: 'center' });
      SALTS.forEach(function (s, j) {
        var cx = gx + (j + 0.5) * cell, done = st.grid[m] && st.grid[m][j];
        D.roundRect(ctx, cx - cell * 0.42, yy - cell * 0.42, cell * 0.84, cell * 0.84, 3, null, col.grid, 1);
        if (!done) return;
        var mark = m === s.m ? '—' : wins(m, s) ? '✓' : '✗';
        D.text(ctx, mark, cx, yy, { color: mark === '✓' ? col.success : col.faint, size: 12, weight: 800, align: 'center' });
      });
    });
    D.text(ctx, '✓ = pushes that metal out', x0 + 6, gy + (n + 1) * cell + 4, { color: col.faint, size: 10.5 });
  }

  function tube(ctx, x, y, w, h) {
    var r = w / 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h - r); ctx.arc(x + r, y + h - r, r, Math.PI, 0, true); ctx.lineTo(x + w, y); ctx.closePath();
  }
})();
