/* =====================================================================
   Chemistry · Metal or Non-metal? Lab Tests — sim.js
   ---------------------------------------------------------------------
   Nine elements on a tray, five school-lab tests:
     shine  (rub with sandpaper)   metals shine; iodine and graphite
                                   also shine (exceptions)
     hammer                        metals flatten (malleable), non-metals
                                   crumble (brittle); cold zinc cracks a bit
     bulb   (conductivity tester)  metals and graphite (exception) conduct
     sound  (drop on the floor)    metals ring (sonorous)
     burn   (then oxide + water + litmus)
            Mg → MgO, dissolves a little → red litmus turns blue (basic)
            Fe, Cu → basic oxides that hardly dissolve: faint / no change
            Al, Zn → amphoteric, insoluble oxides: no litmus change
            S → SO₂, C → CO₂ dissolve → blue litmus turns red (acidic)
            I₂ sublimes (violet vapour), forms no oxide
   Each result is marked metal-like ('m'), non-metal-like ('n') or
   unclear ('?'). After two or more tests the majority gives a verdict.
   No timed physics: transport:false, short animations only.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TESTS = ['shine', 'hammer', 'bulb', 'sound', 'burn'];
  var TNAME = { shine: 'Rub with sandpaper', hammer: 'Hammer test', bulb: 'Bulb tester', sound: 'Drop it: does it ring?', burn: 'Burn, then test the oxide' };
  var DUR = { shine: 1.3, hammer: 1.2, bulb: 1.0, sound: 1.5, burn: 2.8 };
  var DOT = { m: '#f59e0b', n: '#a78bfa', '?': '#94a3b8' };

  // r: results per test; t: text for the readout; c: short caption for the canvas (burn)
  var S = [
    { name: 'Iron nail', sym: 'Fe', metal: true, shape: 'nail', col: '#7d838c', shiny: '#dfe4ea', ring: 2200,
      r: { shine: 'm', hammer: 'm', bulb: 'm', sound: 'm', burn: 'm' },
      t: { shine: 'shines silvery grey', hammer: 'flattens into a sheet', bulb: 'the bulb glows', sound: 'rings: ting!',
        burn: 'the hot nail turns black (iron oxide). It hardly dissolves, so red litmus turns blue only faintly' },
      c: 'Black iron oxide: hardly dissolves, faint blue',
      b: { flame: 'sparks', look: '#2b2b2b', litR: 0.28, litB: 0 } },
    { name: 'Copper wire', sym: 'Cu', metal: true, shape: 'wire', col: '#b8673a', shiny: '#f6a26f', ring: 1800,
      r: { shine: 'm', hammer: 'm', bulb: 'm', sound: 'm', burn: '?' },
      t: { shine: 'shines reddish brown', hammer: 'flattens into a sheet', bulb: 'the bulb glows', sound: 'rings: ting!',
        burn: 'the wire turns black (copper oxide, a basic oxide). It does not dissolve, so litmus does not change' },
      c: 'Black copper oxide: does not dissolve, no change',
      b: { flame: 'green', look: '#1f1f1f', litR: 0, litB: 0 } },
    { name: 'Aluminium foil', sym: 'Al', metal: true, shape: 'foil', col: '#a3aab2', shiny: '#f1f5f9', ring: 2600,
      r: { shine: 'm', hammer: 'm', bulb: 'm', sound: 'm', burn: '?' },
      t: { shine: 'shines bright silver', hammer: 'flattens into a thinner sheet', bulb: 'the bulb glows', sound: 'rings (a light ting)',
        burn: 'it does not catch fire: a thin oxide layer protects it. The oxide is insoluble, so litmus does not change' },
      c: 'No fire: oxide layer protects it; no change',
      b: { flame: 'none', look: '#b9bec4', litR: 0, litB: 0 } },
    { name: 'Magnesium ribbon', sym: 'Mg', metal: true, shape: 'ribbon', col: '#7f857b', shiny: '#e8eaee', ring: 2400,
      r: { shine: 'm', hammer: 'm', bulb: 'm', sound: 'm', burn: 'm' },
      t: { shine: 'the dull coat rubs off: shiny silver', hammer: 'flattens into a sheet', bulb: 'the bulb glows', sound: 'rings: ting!',
        burn: 'burns with a dazzling white flame, leaving white ash (MgO). It dissolves a little: red litmus turns blue (basic)' },
      c: 'White flame → MgO: red litmus turns blue',
      b: { flame: 'white', look: '#f5f5f5', ash: true, litR: 0.95, litB: 0 } },
    { name: 'Zinc granules', sym: 'Zn', metal: true, shape: 'granule', col: '#8e99a3', shiny: '#dde5ec', ring: 2000,
      r: { shine: 'm', hammer: 'm', bulb: 'm', sound: 'm', burn: '?' },
      t: { shine: 'shines bluish silver', hammer: 'flattens, but cracks at the edges (cold zinc is less malleable)', bulb: 'the bulb glows', sound: 'clinks (it rings)',
        burn: 'slowly forms white zinc oxide (yellow while hot). It is insoluble, so litmus does not change' },
      c: 'White zinc oxide: insoluble, no change',
      b: { flame: 'bluegreen', look: '#ebe9dc', litR: 0, litB: 0 } },
    { name: 'Sulphur', sym: 'S', metal: false, shape: 'lump', col: '#facc15', ring: 0,
      r: { shine: 'n', hammer: 'n', bulb: 'n', sound: 'n', burn: 'n' },
      t: { shine: 'stays dull yellow', hammer: 'crumbles to powder', bulb: 'the bulb stays off', sound: 'a dull thud',
        burn: 'melts and burns with a blue flame, giving sulphur dioxide gas. It dissolves: blue litmus turns red (acidic)' },
      c: 'Blue flame → SO₂ gas: blue litmus turns red',
      b: { flame: 'blue', gas: true, shrink: 0.45, litR: 0, litB: 0.95 } },
    { name: 'Coal', sym: 'C', metal: false, shape: 'lump', col: '#2a2a2a', ring: 0,
      r: { shine: 'n', hammer: 'n', bulb: 'n', sound: 'n', burn: 'n' },
      t: { shine: 'stays dull black', hammer: 'crumbles to powder', bulb: 'the bulb stays off', sound: 'a dull thud',
        burn: 'glows red and gives carbon dioxide gas. It dissolves a little: blue litmus turns faintly red (weak acid)' },
      c: 'Glows → CO₂ gas: blue litmus faintly red',
      b: { flame: 'red', gas: true, look: '#9ca3af', ash: true, litR: 0, litB: 0.4 } },
    { name: 'Graphite (pencil lead)', short: 'Graphite', sym: 'C', metal: false, shape: 'rod', col: '#454a52', shiny: '#a3aab4', ring: 0,
      r: { shine: 'm', hammer: 'n', bulb: 'm', sound: 'n', burn: 'n' },
      t: { shine: 'a grey metal-like shine (an exception)', hammer: 'snaps and crumbles', bulb: 'the bulb glows! (an exception)', sound: 'a dull tap',
        burn: 'only glows in a very hot flame, slowly making CO₂: blue litmus turns faintly red' },
      c: 'Glows slowly → CO₂: blue litmus faintly red',
      b: { flame: 'red', gas: true, litR: 0, litB: 0.3 } },
    { name: 'Iodine', sym: 'I', metal: false, shape: 'crystals', col: '#3b2a4a', shiny: '#8a76ad', ring: 0,
      r: { shine: 'm', hammer: 'n', bulb: 'n', sound: 'n', burn: '?' },
      t: { shine: 'shiny violet-black crystals (an exception)', hammer: 'crumbles to powder', bulb: 'the bulb stays off', sound: 'a soft tick',
        burn: 'does not burn: it turns straight into violet vapour (sublimes). No oxide forms, so litmus does not change' },
      c: 'No burning: violet vapour, no oxide',
      b: { flame: 'violet', shrink: 0.6, litR: 0, litB: 0 } }
  ];
  var N = S.length, EDGE = 'rgba(0,0,0,0.45)';

  function conclude(st, i) {
    var m = 0, n = 0, done = 0;
    TESTS.forEach(function (k) { if (!st.res[k][i]) return; done++; var r = S[i].r[k]; if (r === 'm') m++; else if (r === 'n') n++; });
    if (!done) return null;
    if (done < 2) return { word: 'test more…', sure: false };
    // mixed results: only decide once every test has been done
    if ((m && n && done < TESTS.length) || m === n) return { word: 'mixed: do all tests', sure: false };
    var metal = m > n, odd = metal ? n : m;
    return { word: metal ? 'metal' : 'non-metal', metal: metal, sure: true, odd: odd > 0 };
  }
  function label(sim, i) { var s = S[sim.state.order[i]]; return sim.p.mystery ? 'Sample ' + 'ABCDEFGHI'[i] : (s.short || s.name); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function clear(st) { st.res = {}; TESTS.forEach(function (k) { st.res[k] = []; }); st.look = []; st.anim = null; st.last = null; }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && H >= 300, small = W < 560;
    var P, G, top = small ? 26 : 32, bot = H - (small ? 18 : 24);
    if (wide) {
      P = { x: 10, y: top, w: W * 0.47 - 14, h: bot - top };
      G = { x: W * 0.47, y: top, w: W * 0.53 - 6, h: bot - top };
    } else {
      var ph = M.clamp((bot - top) * 0.37, 110, 190);
      P = { x: 8, y: top, w: W - 16, h: ph };
      G = { x: 2, y: top + ph + 4, w: W - 4, h: bot - top - ph - 4 };
    }
    var cols = 3, rows = 3, cw = G.w / cols, rh = G.h / rows, cells = [];
    for (var i = 0; i < N; i++) cells.push({ x: G.x + (i % cols) * cw, y: G.y + Math.floor(i / cols) * rh, w: cw, h: rh });
    return { W: W, H: H, P: P, G: G, cells: cells, small: small, wide: wide, bot: bot };
  }

  function test(sim, i) {
    var st = sim.state, k = sim.p.test, s = S[st.order[i]];
    st.res[k][i] = true;
    if (k === 'hammer') st.look[i] = s.r.hammer === 'm' ? 'flat' : 'broken';
    else if (k === 'shine' && s.shiny && st.look[i] !== 'flat' && st.look[i] !== 'broken') st.look[i] = 'rubbed';
    else if (k === 'burn') st.look[i] = 'burnt';
    st.anim = { i: i, test: k, t0: performance.now() };
    st.last = i;
    if (A.enabled && (k === 'sound' || k === 'hammer')) {
      setTimeout(function () {
        if (s.ring && (k === 'sound' || s.r.hammer === 'm')) A.tone(s.ring, { duration: k === 'sound' ? 1.4 : 0.35, gain: 0.3, harmonics: [1, 0.5, 0.35], partials: [1, 2.76, 5.4] });
        else A.noise(0.12, 0.45, k === 'hammer' ? 1200 : 400);
      }, reduce ? 0 : (k === 'sound' ? 350 : 380));
    }
    sim.redraw();
  }

  function progress(sim, now) {
    var a = sim.state.anim; if (!a) return 1;
    return reduce ? 1 : M.clamp((now - a.t0) / 1000 / DUR[a.test], 0, 1);
  }

  SimLab.createSim({
    ariaLabel: 'A lab bench with nine elements on a tray: iron, copper, aluminium, magnesium, zinc, sulphur, coal, graphite and iodine. Choose a test (sandpaper, hammer, bulb tester, drop test or burning) and tap a sample to see if it behaves like a metal or a non-metal',
    transport: false,
    audio: true,
    mobileAspect: '4 / 5',
    params: [
      { id: 'test', label: 'Test', type: 'select', value: 'bulb', options: [
        { value: 'shine', label: 'Lustre: rub with sandpaper' }, { value: 'hammer', label: 'Malleability: hammer it' },
        { value: 'bulb', label: 'Conductivity: bulb tester' }, { value: 'sound', label: 'Sonority: drop it on the floor' },
        { value: 'burn', label: 'Burn it, then test the oxide with litmus' }] },
      { id: 'mystery', label: 'Mystery samples (hide the names)', type: 'toggle', value: false }
    ],
    buttonsTitle: 'Test',
    buttons: [
      { label: 'Do this test on every sample', primary: true, full: true, onClick: function (sim) {
        var st = sim.state;
        for (var i = 0; i < N; i++) {
          var s = S[st.order[i]], k = sim.p.test; st.res[k][i] = true;
          if (k === 'hammer') st.look[i] = s.r.hammer === 'm' ? 'flat' : 'broken';
          else if (k === 'shine' && s.shiny && !st.look[i]) st.look[i] = 'rubbed';
          else if (k === 'burn') st.look[i] = 'burnt';
        }
        st.anim = null; st.last = null; sim.redraw();
      } },
      { label: 'Fresh samples (clear results)', full: true, onClick: function (sim) { clear(sim.state); sim.redraw(); } }
    ],
    readouts: [
      { id: 'last', label: 'Last test', key: true },
      { id: 'so', label: 'Verdict so far', key: true, short: 'Verdict' },
      { id: 'n', label: 'Identified: metals / non-metals', key: true, short: 'Identified' }
    ],
    onParam: function (sim, id) {
      if (id === 'mystery') { sim.state.order = sim.p.mystery ? shuffle(sim.state.order.slice()) : S.map(function (s, i) { return i; }); clear(sim.state); }
      sim.redraw(); return true;
    },
    reset: function (sim) { sim.state = { order: S.map(function (s, i) { return i; }) }; clear(sim.state); },
    animate: function (sim) { var a = sim.state.anim; return !!a && !reduce && performance.now() - a.t0 < DUR[a.test] * 1000 + 50; },
    readout: function (sim) {
      var st = sim.state, m = 0, n = 0;
      for (var i = 0; i < N; i++) { var c = conclude(st, i); if (c && c.sure) { if (c.metal) m++; else n++; } }
      var out = { n: m + ' / ' + n + ' of 9', last: 'Tap a sample', so: 'Do two or more tests on a sample' };
      if (st.last != null) {
        var s = S[st.order[st.last]], k = st.anim ? st.anim.test : sim.p.test, cc = conclude(st, st.last);
        out.last = label(sim, st.last) + ': ' + s.t[k];
        out.so = label(sim, st.last) + ': ' + (cc.sure ? (cc.metal ? 'a metal' : 'a non-metal') + (cc.odd ? ', with an odd result' : '') : cc.word);
      }
      return out;
    },
    status: function (sim) { return TNAME[sim.p.test] + ': tap a sample on the tray'; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim);
        for (var i = 0; i < N; i++) { var c = L.cells[i]; if (x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h) { test(sim, i); return true; } }
        return false;
      },
      hover: function (sim, x, y) { var L = layout(sim); return x > L.G.x && y > L.G.y && y < L.G.y + L.G.h; }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, p = sim.p, st = sim.state, L = layout(sim);
      D.clear(ctx, L.W, L.H, col.bg);
      EDGE = col.light ? 'rgba(0,0,0,0.45)' : 'rgba(226,232,240,0.55)';
      D.text(ctx, (L.small ? TNAME[p.test] + ' · tap a sample' : TNAME[p.test] + ': tap a sample on the tray'), L.W / 2, L.small ? 13 : 16,
        { color: col.bg, bg: col.s3, size: L.small ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: L.W });

      // apparatus panel
      var P = L.P;
      D.roundRect(ctx, P.x, P.y, P.w, P.h, 10, col.light ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)', col.border, 1);
      var a = st.anim && st.anim.test === p.test ? st.anim : null, t = a ? progress(sim, now) : 0;
      var s = a ? S[st.order[a.i]] : null;
      var area = { x: P.x + 6, y: P.y + 6, w: P.w - 12, h: P.h - (L.small ? 26 : 32) };
      if (area.h > area.w * 0.8) { var ah = area.w * 0.8; area.y += (area.h - ah) * 0.45; area.h = ah; }
      var capY = Math.min(P.y + P.h - (L.small ? 10 : 13), area.y + area.h + 22);
      ctx.save(); ctx.beginPath(); ctx.rect(P.x + 1, P.y + 1, P.w - 2, P.h - 2); ctx.clip();
      APP[p.test](ctx, col, area, s, t, now);
      ctx.restore();
      var cap = !s ? 'Tap a sample to test it' : t < 0.35 && !reduce ? 'Testing ' + label(sim, a.i) + '…' :
        (p.mystery ? 'Sample ' + 'ABCDEFGHI'[a.i] : (s.short || s.name)) + ': ' + (p.test === 'burn' ? s.c : s.t[p.test]);
      D.text(ctx, cap, P.x + P.w / 2, capY, { color: col.text, size: L.small ? 10.5 : 12.5, weight: 600, align: 'center', fit: L.W });

      // tray of samples
      var fs = L.small ? 10 : 12, dr = L.small ? 3.6 : 5;
      L.cells.forEach(function (c, i) {
        var smp = S[st.order[i]], cx = c.x + c.w / 2, sel = st.last === i;
        if (sel) D.roundRect(ctx, c.x + 3, c.y + 2, c.w - 6, c.h - 4, 8, col.light ? 'rgba(59,130,246,0.08)' : 'rgba(96,165,250,0.10)', col.s3, 1.5);
        var sz = Math.min(c.w * 0.2, c.h * 0.2, 30), iy = c.y + c.h * 0.24;
        drawSample(ctx, smp, cx, iy, sz, st.look[i] || 'base', 1);
        var ny = c.y + c.h * 0.53;
        D.text(ctx, label(sim, i), cx, ny, { color: col.text, size: fs, weight: 700, align: 'center', fit: L.W });
        var gap = dr * 2.7, dy = c.y + c.h * 0.72;
        TESTS.forEach(function (k, j) {
          var dx = cx + (j - 2) * gap, done = st.res[k][i];
          if (done) D.circle(ctx, dx, dy, dr, DOT[smp.r[k]], k === p.test ? col.text : null, 1.5);
          else D.circle(ctx, dx, dy, dr - 0.5, null, k === p.test ? col.muted : col.faint, k === p.test ? 1.5 : 1);
        });
        var cc = conclude(st, i), anim = st.anim && st.anim.i === i && progress(sim, now) < 1;
        if (cc && !anim) D.text(ctx, cc.word + (cc.odd ? ' *' : ''), cx, c.y + c.h * 0.88,
          { color: cc.sure ? DOT[cc.metal ? 'm' : 'n'] : col.muted, size: L.small ? 9.5 : 11.5, weight: cc.sure ? 800 : 600, align: 'center', fit: L.W });
      });

      // legend
      var items = [['m', L.small ? 'metal-like' : 'metal-like result'], ['n', L.small ? 'non-metal-like' : 'non-metal-like result'], ['?', 'no clear result']];
      var lfs = L.small ? 9.5 : 11, ly = L.H - (L.small ? 8 : 11);
      ctx.font = '500 ' + lfs + 'px Inter, system-ui, sans-serif';
      var widths = items.map(function (it) { return ctx.measureText(it[1]).width + 14; }), tot = widths.reduce(function (x, y) { return x + y; }, 0) + 12 * 2;
      var star = L.small ? '' : '   * = an exception';
      var sw = star ? ctx.measureText(star).width : 0, lx = (L.W - tot - sw) / 2;
      items.forEach(function (it, j) {
        D.circle(ctx, lx + 4, ly, 4, DOT[it[0]]);
        D.text(ctx, it[1], lx + 11, ly, { color: col.muted, size: lfs });
        lx += widths[j] + 12;
      });
      if (star) D.text(ctx, star, lx - 12, ly, { color: col.muted, size: lfs });
    }
  });

  /* ---------- drawing a sample ---------- */
  function drawSample(ctx, s, x, y, sz, look, k) {
    var r = M.rng(s.name.length * 97 + s.col.charCodeAt(2));
    var c = s.col;
    if (look === 'rubbed' && s.shiny) c = s.shiny;
    if (look === 'burnt') {
      if (s.b.ash) { pile(ctx, x, y + sz * 0.35, sz, s.b.look, r); return; }
      if (s.b.look) c = s.b.look;
      if (s.b.shrink) sz *= s.b.shrink;
    }
    if (look === 'broken') { pile(ctx, x, y + sz * 0.35, sz, s.col, r); return; }
    ctx.save();
    var edge = EDGE;
    if (look === 'flat') {
      // beaten into a thin sheet (zinc cracks at the edge)
      var w = sz * 2.1, h = sz * 0.5;
      ctx.beginPath(); ctx.moveTo(x - w / 2, y + h * 0.2); ctx.lineTo(x - w * 0.3, y - h / 2); ctx.lineTo(x + w * 0.42, y - h * 0.4); ctx.lineTo(x + w / 2, y + h * 0.3); ctx.lineTo(x - w * 0.1, y + h / 2); ctx.closePath();
      ctx.fillStyle = s.shiny || c; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke();
      if (s.sym === 'Zn') { D.line(ctx, x + w * 0.42, y - h * 0.4, x + w * 0.2, y - h * 0.05, edge, 1); D.line(ctx, x - w * 0.5, y + h * 0.2, x - w * 0.25, y + h * 0.05, edge, 1); }
      ctx.restore(); return;
    }
    ctx.fillStyle = c; ctx.strokeStyle = edge; ctx.lineWidth = 1;
    if (s.shape === 'nail') {
      var L = sz * 2;
      ctx.fillRect(x - L / 2, y - sz * 0.1, L * 0.88, sz * 0.2); ctx.strokeRect(x - L / 2, y - sz * 0.1, L * 0.88, sz * 0.2);
      ctx.beginPath(); ctx.moveTo(x + L * 0.38, y - sz * 0.1); ctx.lineTo(x + L / 2, y); ctx.lineTo(x + L * 0.38, y + sz * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(x - L / 2 - sz * 0.08, y - sz * 0.3, sz * 0.14, sz * 0.6); ctx.strokeRect(x - L / 2 - sz * 0.08, y - sz * 0.3, sz * 0.14, sz * 0.6);
    } else if (s.shape === 'wire') {
      ctx.lineCap = 'round'; ctx.beginPath();
      for (var i = 0; i <= 30; i++) { var u = i / 30, px = x - sz + u * sz * 2, py = y + Math.sin(u * Math.PI * 3) * sz * 0.35; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.lineWidth = Math.max(2.5, sz * 0.16); ctx.strokeStyle = edge; ctx.stroke(); ctx.lineWidth = Math.max(1.5, sz * 0.11); ctx.strokeStyle = c; ctx.stroke();
    } else if (s.shape === 'foil') {
      ctx.beginPath(); ctx.moveTo(x - sz, y - sz * 0.45); ctx.lineTo(x + sz * 0.2, y - sz * 0.6); ctx.lineTo(x + sz, y - sz * 0.35); ctx.lineTo(x + sz * 0.85, y + sz * 0.5); ctx.lineTo(x - sz * 0.3, y + sz * 0.6); ctx.lineTo(x - sz * 0.95, y + sz * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
      D.line(ctx, x - sz * 0.5, y - sz * 0.4, x + sz * 0.1, y + sz * 0.5, 'rgba(0,0,0,0.18)', 1); D.line(ctx, x + sz * 0.2, y - sz * 0.6, x + sz * 0.5, y + sz * 0.4, 'rgba(255,255,255,0.35)', 1);
    } else if (s.shape === 'ribbon') {
      ctx.beginPath(); ctx.moveTo(x - sz * 1.1, y - sz * 0.05); ctx.quadraticCurveTo(x, y - sz * 0.45, x + sz * 1.1, y - sz * 0.15);
      ctx.lineTo(x + sz * 1.1, y + sz * 0.15); ctx.quadraticCurveTo(x, y - sz * 0.12, x - sz * 1.1, y + sz * 0.25); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (s.shape === 'granule') {
      [[-0.55, 0.1, 0.42], [0.35, -0.1, 0.48], [0.05, 0.32, 0.36]].forEach(function (g) { blob(ctx, x + g[0] * sz, y + g[1] * sz, g[2] * sz, r); ctx.fill(); ctx.stroke(); });
    } else if (s.shape === 'lump') {
      blob(ctx, x, y, sz * 0.75, r); ctx.fill(); ctx.stroke();
    } else if (s.shape === 'rod') {
      ctx.fillRect(x - sz * 1.1, y - sz * 0.09, sz * 2.2, sz * 0.18); ctx.strokeRect(x - sz * 1.1, y - sz * 0.09, sz * 2.2, sz * 0.18);
    } else if (s.shape === 'crystals') {
      [[-0.5, 0.1, 0.3], [0.1, -0.15, 0.36], [0.55, 0.15, 0.28], [-0.05, 0.3, 0.24]].forEach(function (g) {
        var cx = x + g[0] * sz, cy = y + g[1] * sz, q = g[2] * sz;
        ctx.beginPath(); ctx.moveTo(cx, cy - q); ctx.lineTo(cx + q * 0.7, cy); ctx.lineTo(cx, cy + q); ctx.lineTo(cx - q * 0.7, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
    }
    if (look === 'rubbed' && s.shiny) sparkle(ctx, x + sz * 0.35, y - sz * 0.25, Math.max(3, sz * 0.3));
    ctx.restore();
  }
  function blob(ctx, x, y, rad, r) {
    ctx.beginPath();
    for (var i = 0; i < 9; i++) { var a = i / 9 * Math.PI * 2, rr = rad * (0.78 + 0.3 * r()); var px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.closePath();
  }
  function pile(ctx, x, y, sz, c, r) {
    ctx.save(); ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(x, y, sz * 0.9, sz * 0.35, 0, Math.PI, 0); ctx.fill();
    for (var i = 0; i < 14; i++) D.circle(ctx, x + (r() - 0.5) * sz * 2.2, y - r() * sz * 0.2, Math.max(1, sz * 0.07), c);
    ctx.strokeStyle = EDGE; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, sz * 0.9, sz * 0.35, 0, Math.PI, 0); ctx.stroke();
    ctx.restore();
  }
  function sparkle(ctx, x, y, q) {
    ctx.save(); ctx.fillStyle = '#ffffff'; ctx.beginPath();
    ctx.moveTo(x, y - q); ctx.lineTo(x + q * 0.22, y - q * 0.22); ctx.lineTo(x + q, y); ctx.lineTo(x + q * 0.22, y + q * 0.22);
    ctx.lineTo(x, y + q); ctx.lineTo(x - q * 0.22, y + q * 0.22); ctx.lineTo(x - q, y); ctx.lineTo(x - q * 0.22, y - q * 0.22); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function ease(t) { return t * t * (3 - 2 * t); }

  /* ---------- the five pieces of apparatus ---------- */
  var APP = {
    shine: function (ctx, col, R, s, t) {
      var cx = R.x + R.w / 2, cy = R.y + R.h * 0.58, sz = Math.min(R.w * 0.16, R.h * 0.3);
      D.roundRect(ctx, cx - sz * 1.8, cy + sz * 0.55, sz * 3.6, sz * 0.25, 3, col.light ? '#c8a27a' : '#7c5a3a');
      if (!s) { D.text(ctx, '(sandpaper)', cx, R.y + R.h * 0.3, { color: col.muted, size: 11, align: 'center' }); paper(ctx, cx, R.y + R.h * 0.15, sz); return; }
      var rubbed = t > 0.55 && s.shiny;
      drawSample(ctx, s, cx, cy, sz, 'base', 1);
      if (rubbed) { ctx.save(); ctx.globalAlpha = M.clamp((t - 0.55) / 0.3, 0, 1); drawSample(ctx, s, cx, cy, sz, 'rubbed', 1); ctx.restore(); }
      if (t < 0.65) paper(ctx, cx + Math.sin(t * 40) * sz * 0.9, cy - sz * 0.5, sz);
      else if (!s.shiny) for (var i = 0; i < 10; i++) D.circle(ctx, cx - sz + i * sz * 0.22, cy + sz * 0.45, 1.5, s.col);
      if (rubbed && t > 0.8) { sparkle(ctx, cx - sz * 0.6, cy - sz * 0.35, sz * 0.25); sparkle(ctx, cx + sz * 0.9, cy - sz * 0.1, sz * 0.18); }
    },
    hammer: function (ctx, col, R, s, t) {
      var cx = R.x + R.w / 2, by = R.y + R.h * 0.86, sz = Math.min(R.w * 0.14, R.h * 0.24);
      // anvil block
      ctx.fillStyle = col.light ? '#475569' : '#334155';
      ctx.beginPath(); ctx.moveTo(cx - sz * 1.9, by - sz * 0.5); ctx.lineTo(cx + sz * 1.9, by - sz * 0.5); ctx.lineTo(cx + sz * 1.3, by + sz * 0.3); ctx.lineTo(cx - sz * 1.3, by + sz * 0.3); ctx.closePath(); ctx.fill();
      var top = by - sz * 0.5, hit = 0.32, hy;
      if (!s) hy = top - sz * 1.7; else if (t < hit) hy = top - sz * 1.7 * (1 - ease(t / hit)) - sz * 0.25; else hy = top - sz * 0.25 - sz * 1.2 * ease(M.clamp((t - hit) / 0.5, 0, 1));
      if (s) {
        var after = t >= hit;
        if (after && s.r.hammer === 'n') {
          var u = t - hit, r = M.rng(7);
          pile(ctx, cx, top, sz * 0.8, s.col, r);
          for (var i = 0; i < 12; i++) { var vx = (r() - 0.5) * 6, vy = -2 - r() * 3; var px = cx + vx * u * 40, py = top - sz * 0.2 + (vy * u + 9 * u * u) * 40; if (py < top) D.circle(ctx, px, py, 2, s.col); }
        } else drawSample(ctx, s, cx, top - sz * 0.2, sz, after ? 'flat' : 'base', 1);
      }
      // hammer: handle + head
      ctx.save(); ctx.fillStyle = col.light ? '#a16207' : '#b45309';
      ctx.fillRect(cx + sz * 0.15, hy - sz * 0.25, sz * 2.4, sz * 0.22);
      D.roundRect(ctx, cx - sz * 0.55, hy - sz * 0.6, sz * 0.8, sz * 0.9, 3, '#9ca3af', '#4b5563', 1);
      ctx.restore();
      if (s && t >= hit && t < hit + 0.2) D.text(ctx, s.r.hammer === 'm' ? 'CLANG' : 'crack', cx + sz * 1.6, top - sz * 1.3, { color: col.warning, size: 13, weight: 800, align: 'center' });
    },
    bulb: function (ctx, col, R, s, t) {
      var x0 = R.x + R.w * 0.1, x1 = R.x + R.w * 0.9, yt = R.y + R.h * 0.28, yb = R.y + R.h * 0.84, cx = R.x + R.w / 2;
      var on = s && s.r.bulb === 'm' && t > 0.25, glow = on ? (s.shape === 'rod' ? 0.75 : 1) * M.clamp((t - 0.25) / 0.2, 0, 1) : 0;
      var wire = col.light ? '#334155' : '#cbd5e1', br = Math.min(R.h * 0.15, 36);
      var sz = Math.min(R.w * 0.11, R.h * 0.2), gx = sz * 1.15;
      // wires
      ctx.save(); ctx.strokeStyle = wire; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(x0, yb - R.h * 0.12); ctx.lineTo(x0, yt); ctx.lineTo(cx - br, yt);
      ctx.moveTo(cx + br, yt); ctx.lineTo(x1, yt); ctx.lineTo(x1, yb); ctx.lineTo(cx + gx, yb);
      ctx.moveTo(x0, yb + R.h * 0.0); ctx.lineTo(x0, yb); ctx.lineTo(cx - gx, yb);
      ctx.stroke(); ctx.restore();
      // cell (battery) on the left wire
      var cy = yb - R.h * 0.12 - 2;
      D.roundRect(ctx, x0 - 9, cy - 4, 18, R.h * 0.12 + 8, 3, col.light ? '#1e293b' : '#475569');
      D.text(ctx, '+', x0 + 14, cy + 2, { color: col.muted, size: 11, weight: 700 });
      D.text(ctx, 'cell', x0 - 12, cy + R.h * 0.06, { color: col.muted, size: 10, align: 'right' });
      // bulb
      if (glow > 0) {
        var g = ctx.createRadialGradient(cx, yt, 2, cx, yt, br * 3.2);
        g.addColorStop(0, 'rgba(253,224,71,' + 0.9 * glow + ')'); g.addColorStop(1, 'rgba(253,224,71,0)');
        ctx.fillStyle = g; ctx.fillRect(cx - br * 3.4, yt - br * 3.4, br * 6.8, br * 6.8);
      }
      D.circle(ctx, cx, yt - br * 0.2, br, glow > 0 ? 'rgba(254,240,138,' + (0.35 + 0.65 * glow) + ')' : (col.light ? 'rgba(148,163,184,0.25)' : 'rgba(226,232,240,0.12)'), wire, 1.5);
      D.roundRect(ctx, cx - br * 0.45, yt + br * 0.65, br * 0.9, br * 0.45, 2, '#9ca3af');
      D.line(ctx, cx - br * 0.3, yt + br * 0.2, cx, yt - br * 0.45, glow > 0 ? '#f59e0b' : col.muted, 1.2);
      D.line(ctx, cx + br * 0.3, yt + br * 0.2, cx, yt - br * 0.45, glow > 0 ? '#f59e0b' : col.muted, 1.2);
      // clips and sample
      [-1, 1].forEach(function (d) { D.roundRect(ctx, cx + d * gx - (d > 0 ? 0 : 10), yb - 5, 10, 10, 2, '#dc2626'); });
      if (s) drawSample(ctx, s, cx, yb, sz * (s.shape === 'lump' || s.shape === 'granule' || s.shape === 'crystals' ? 1.3 : 0.95), 'base', 1);
      else D.text(ctx, 'gap for the sample', cx, yb + 14, { color: col.muted, size: 10, align: 'center' });
      if (s && t > 0.3) D.text(ctx, on ? 'glows' : 'no glow', cx + br * 1.5, yt - br * 0.9, { color: on ? col.warning : col.muted, size: 12, weight: 800 });
    },
    sound: function (ctx, col, R, s, t) {
      var cx = R.x + R.w / 2, fy = R.y + R.h * 0.86, sz = Math.min(R.w * 0.13, R.h * 0.22);
      D.line(ctx, R.x + 8, fy, R.x + R.w - 8, fy, col.muted, 2);
      for (var i = 0; i < 12; i++) D.line(ctx, R.x + 14 + i * (R.w - 28) / 11, fy, R.x + 8 + i * (R.w - 28) / 11, fy + 6, col.faint, 1);
      if (!s) { D.text(ctx, 'floor', cx, fy + 12, { color: col.muted, size: 10, align: 'center' }); return; }
      var hit = 0.23, y0 = R.y + sz, y1 = fy - sz * 0.4;
      var y = t < hit ? y0 + (y1 - y0) * Math.pow(t / hit, 2) : y1;
      drawSample(ctx, s, cx, y, sz, 'base', 1);
      if (t >= hit) {
        var u = (t - hit) / (1 - hit);
        if (s.r.sound === 'm') {
          for (var k = 0; k < 3; k++) {
            var rr = sz * (0.8 + (u * 3 - k * 0.4) * 1.6); if (rr < sz * 0.8) continue;
            ctx.save(); ctx.globalAlpha = M.clamp(1 - u, 0, 1); ctx.strokeStyle = col.warning; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, y1, rr, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.restore();
          }
          D.text(ctx, 'ting!', cx + sz * 2.4, R.y + R.h * 0.3, { color: col.warning, size: 16, weight: 800, align: 'center' });
        } else {
          D.text(ctx, 'thud', cx + sz * 2, R.y + R.h * 0.5, { color: col.muted, size: 13, weight: 700, align: 'center' });
          for (var j = 0; j < 6; j++) D.circle(ctx, cx + (j - 2.5) * sz * 0.5 * (1 + u), fy - 3 - u * 6, 1.6, col.faint);
        }
      }
    },
    burn: function (ctx, col, R, s, t, now) {
      var lx = R.x + R.w * 0.27, jx = R.x + R.w * 0.74, by = R.y + R.h * 0.95, sz = Math.min(R.w * 0.09, R.h * 0.17);
      var lh = Math.min(R.h * 0.34, 90), lw = lh * 1.1;
      // spirit lamp
      ctx.save();
      ctx.beginPath(); ctx.ellipse(lx, by - lh * 0.45, lw / 2, lh * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = col.light ? 'rgba(186,230,253,0.6)' : 'rgba(186,230,253,0.25)'; ctx.fill(); ctx.strokeStyle = col.muted; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = '#9ca3af'; ctx.fillRect(lx - 4, by - lh * 1.02, 8, lh * 0.15);
      var fl = Math.min(R.h * 0.2, 50), fy = by - lh * 1.02, flick = Math.sin(now / 90) * 0.08;
      ctx.beginPath(); ctx.moveTo(lx - fl * 0.28, fy); ctx.quadraticCurveTo(lx - fl * 0.3, fy - fl * 0.6, lx, fy - fl * (1 + flick)); ctx.quadraticCurveTo(lx + fl * 0.3, fy - fl * 0.6, lx + fl * 0.28, fy); ctx.closePath();
      ctx.fillStyle = 'rgba(96,165,250,0.75)'; ctx.fill();
      ctx.restore();
      // beaker of water with two litmus strips
      var bw = Math.min(R.w * 0.24, 130), bh = Math.min(R.h * 0.55, 150), bx = jx - bw / 2, bt = by - bh, wy = bt + bh * 0.35;
      ctx.save(); ctx.fillStyle = col.light ? 'rgba(96,165,250,0.25)' : 'rgba(96,165,250,0.22)'; ctx.fillRect(bx, wy, bw, by - wy); ctx.restore();
      ctx.save(); ctx.strokeStyle = col.muted; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, bt); ctx.lineTo(bx, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, bt); ctx.stroke(); ctx.restore();
      if (s && s.b.gas) { // a lid: the gas is trapped over the water
        D.line(ctx, bx - 3, bt, bx + bw + 3, bt, col.muted, 3);
      }
      var lit = s ? M.clamp((t - 0.72) / 0.22, 0, 1) : 0;
      var swd = Math.max(5, bw * 0.13), sh = bh * 0.85, sTop = bt - bh * 0.25;
      strip(ctx, bx + bw * 0.3, sTop, swd, sh, wy, '#ef4444', '#2563eb', s ? s.b.litR * lit : 0);
      strip(ctx, bx + bw * 0.62, sTop, swd, sh, wy, '#3b82f6', '#dc2626', s ? s.b.litB * lit : 0);
      D.text(ctx, 'red', bx + bw * 0.3 + swd / 2, sTop - 7, { color: col.muted, size: 9.5, align: 'center' });
      D.text(ctx, 'blue', bx + bw * 0.62 + swd / 2, sTop - 7, { color: col.muted, size: 9.5, align: 'center' });
      D.text(ctx, 'litmus', bx + bw + 6, sTop + 4, { color: col.muted, size: 9.5 });
      D.text(ctx, 'water', bx + bw + 6, wy + 10, { color: col.muted, size: 9.5 });
      if (!s) { D.text(ctx, 'spirit lamp', lx, by + 0, { color: col.muted, size: 9.5, align: 'center', baseline: 'bottom' }); return; }
      // the sample held in tongs over the flame
      var sx = lx, sy = fy - fl * 1.25, react = M.clamp((t - 0.12) / 0.15, 0, 1) * (1 - M.clamp((t - 0.62) / 0.12, 0, 1));
      D.line(ctx, sx + sz * 0.6, sy, lx + R.w * 0.2, sy - sz * 1.4, '#6b7280', 2.5);
      var f = s.b.flame;
      if (f === 'violet' && react > 0) for (var i = 0; i < 7; i++) { var u = ((now / 1400) + i / 7) % 1; D.circle(ctx, sx + Math.sin(i * 2.1 + u * 4) * sz * 0.6, sy - u * R.h * 0.4, sz * (0.2 + u * 0.4), 'rgba(139,92,246,' + 0.5 * (1 - u) * react + ')'); }
      drawSample(ctx, s, sx, sy, sz, t > 0.4 ? 'burnt' : 'base', 1);
      if (react > 0) {
        if (f === 'white') {
          var g = ctx.createRadialGradient(sx, sy, 1, sx, sy, sz * 4);
          g.addColorStop(0, 'rgba(255,255,255,' + react + ')'); g.addColorStop(0.4, 'rgba(255,255,255,' + 0.6 * react + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g; ctx.fillRect(sx - sz * 4, sy - sz * 4, sz * 8, sz * 8);
        } else if (f === 'blue' || f === 'bluegreen' || f === 'green') {
          var cc = f === 'blue' ? '59,130,246' : f === 'green' ? '34,197,94' : '45,212,191', q = f === 'blue' ? 1.3 : 0.8;
          ctx.save(); ctx.fillStyle = 'rgba(' + cc + ',' + 0.8 * react + ')'; ctx.beginPath();
          ctx.moveTo(sx - sz * 0.6, sy); ctx.quadraticCurveTo(sx - sz * 0.5, sy - sz * q, sx, sy - sz * q * (1.6 + flick)); ctx.quadraticCurveTo(sx + sz * 0.5, sy - sz * q, sx + sz * 0.6, sy); ctx.closePath(); ctx.fill(); ctx.restore();
        } else if (f === 'red') {
          var g2 = ctx.createRadialGradient(sx, sy, 1, sx, sy, sz * 1.4);
          g2.addColorStop(0, 'rgba(249,115,22,' + 0.9 * react + ')'); g2.addColorStop(1, 'rgba(239,68,68,0)');
          ctx.fillStyle = g2; ctx.fillRect(sx - sz * 1.5, sy - sz * 1.5, sz * 3, sz * 3);
        } else if (f === 'sparks') {
          for (var j = 0; j < 8; j++) { var a = j * 0.8 + now / 200, d = sz * (0.6 + ((now / 300 + j * 0.37) % 1) * 1.2); D.circle(ctx, sx + Math.cos(a) * d, sy - Math.abs(Math.sin(a)) * d, 1.4, 'rgba(251,191,36,' + react + ')'); }
        }
      }
      // product goes into the water: powder falls or gas drifts over
      var mv = M.clamp((t - 0.55) / 0.2, 0, 1);
      if (mv > 0 && mv < 1 && f !== 'violet' && f !== 'none') {
        var px = M.lerp(sx, jx, ease(mv)), py = M.lerp(sy, wy - 4, ease(mv));
        if (s.b.gas) for (var k = 0; k < 5; k++) D.circle(ctx, px + (k - 2) * 4, py - Math.sin(k + mv * 6) * 3, 3, col.light ? 'rgba(100,116,139,0.5)' : 'rgba(203,213,225,0.5)');
        else D.circle(ctx, px, py, 3, s.b.look || s.col);
      }
      if (t > 0.72 && !s.b.gas && s.b.look && f !== 'none' && f !== 'violet') for (var m = 0; m < 6; m++) D.circle(ctx, bx + bw * (0.15 + m * 0.14), by - 3, 2, s.b.look);
      if (t > 0.72 && s.b.gas) D.text(ctx, s.sym === 'S' ? 'SO₂' : 'CO₂', bx + bw / 2, bt + 9, { color: col.muted, size: 10, weight: 700, align: 'center' });
    }
  };
  function paper(ctx, x, y, sz) {
    D.roundRect(ctx, x - sz * 0.7, y - sz * 0.25, sz * 1.4, sz * 0.5, 3, '#c2945a', '#7c5a3a', 1);
    var r = M.rng(3); for (var i = 0; i < 10; i++) D.circle(ctx, x - sz * 0.6 + r() * sz * 1.2, y - sz * 0.15 + r() * sz * 0.3, 0.8, '#7c5a3a');
  }
  function strip(ctx, x, y, w, h, wy, c0, c1, k) {
    ctx.fillStyle = c0; ctx.fillRect(x, y, w, h);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = c1; ctx.fillRect(x, wy, w, y + h - wy); ctx.restore(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  }
})();
