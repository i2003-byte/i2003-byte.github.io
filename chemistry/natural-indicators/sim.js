/* =====================================================================
   Chemistry · Natural Indicators (acids, bases and salts) — sim.js
   ---------------------------------------------------------------------
   An indicator shows a different colour in an acidic and a basic
   solution. Colours used here (as seen in a school lab):
     blue litmus paper  → turns red in an acid; stays blue otherwise
     red litmus paper   → turns blue in a base; stays red otherwise
     turmeric paper     → turns red-brown in a base; stays yellow otherwise
     china rose (hibiscus) solution → dark pink (magenta) in an acid,
                          green in a base, its own pale colour if neutral
   A neutral solution changes none of them.
   One result alone may not decide: blue litmus staying blue only says
   "not acidic" (basic or neutral). The sim combines the results that
   have been found for a tube and says what can be concluded.
   No timed physics: transport:false, a short drop/dip animation only.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SUBS = [
    { name: 'Lemon juice', type: 'acid', liq: '#fef3a0' },
    { name: 'Vinegar', type: 'acid', liq: '#f1ece0' },
    { name: 'Soap water', type: 'base', liq: '#e7edf3' },
    { name: 'Baking soda', type: 'base', liq: '#eef4f8' },
    { name: 'Lime water', type: 'base', liq: '#eef2f5' },
    { name: 'Sugar water', type: 'neutral', liq: '#f4f1ea' },
    { name: 'Salt water', type: 'neutral', liq: '#eef4f7' },
    { name: 'Distilled water', type: 'neutral', liq: '#e8f3fb' }
  ];
  var IND = {
    blue: { name: 'blue litmus paper', short: 'blue litmus', paper: true, base: '#3b82f6', acidC: '#dc2626', baseC: '#3b82f6', neutC: '#3b82f6' },
    red: { name: 'red litmus paper', short: 'red litmus', paper: true, base: '#ef4444', acidC: '#ef4444', baseC: '#2563eb', neutC: '#ef4444' },
    turmeric: { name: 'turmeric paper', short: 'turmeric', paper: true, base: '#facc15', acidC: '#facc15', baseC: '#b42318', neutC: '#facc15' },
    rose: { name: 'china rose solution', short: 'china rose', paper: false, base: '#d9a3c8', acidC: '#c0267a', baseC: '#16a34a', neutC: '#d9a3c8' }
  };
  var ORDER = ['blue', 'red', 'turmeric', 'rose'];
  var WORD = { '#dc2626': 'turns red', '#2563eb': 'turns blue', '#b42318': 'turns red-brown', '#c0267a': 'turns dark pink', '#16a34a': 'turns green' };
  var NATURE = { acid: 'acidic', base: 'basic', neutral: 'neutral' };
  var TCOL = { acid: '#f43f5e', base: '#3b82f6', neutral: '#22c55e' };

  function result(ind, sub) { var I = IND[ind]; return sub.type === 'acid' ? I.acidC : sub.type === 'base' ? I.baseC : I.neutC; }
  function changed(ind, sub) { return result(ind, sub) !== IND[ind].base; }
  function outcome(ind, sub) {
    var r = result(ind, sub); return WORD[r] && changed(ind, sub) ? WORD[r] : (IND[ind].paper ? 'no change' : 'stays pale pink (no change)');
  }
  // what the results found so far allow us to say about a tube
  function conclude(st, i) {
    var sub = SUBS[st.order[i]], isA = false, isB = false, notA = false, notB = false, any = false;
    ORDER.forEach(function (k) {
      if (!st.res[k][i]) return; any = true;
      var ch = changed(k, sub);
      if (k === 'blue') { if (ch) isA = true; else notA = true; }
      if (k === 'red' || k === 'turmeric') { if (ch) isB = true; else notB = true; }
      if (k === 'rose') { if (sub.type === 'acid') isA = true; else if (sub.type === 'base') isB = true; else { notA = true; notB = true; } }
    });
    if (!any) return null;
    if (isA) return { word: 'acidic', type: 'acid', sure: true };
    if (isB) return { word: 'basic', type: 'base', sure: true };
    if (notA && notB) return { word: 'neutral', type: 'neutral', sure: true };
    if (notA) return { word: 'basic or neutral?', hint: 'not acidic: now try red litmus or turmeric', sure: false };
    return { word: 'acidic or neutral?', hint: 'not basic: now try blue litmus', sure: false };
  }
  function label(sim, i) { return sim.p.mystery ? 'Bottle ' + 'ABCDEFGH'[i] : SUBS[sim.state.order[i]].name; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function clear(st) { st.res = { blue: [], red: [], turmeric: [], rose: [] }; st.anim = null; st.last = null; }

  function layout(sim) {
    var W = sim.width, H = sim.height, n = SUBS.length, cols = W >= 560 ? n : 4, rows = Math.ceil(n / cols);
    var top = 34, bot = H - (W < 560 ? 26 : 30), rh = (bot - top) / rows, cw = W / cols;
    var th = Math.min(rh * 0.56, 150), tw = Math.min(cw * 0.42, 38, th * 0.36);
    var cells = [];
    for (var i = 0; i < n; i++) {
      var cx = (i % cols + 0.5) * cw, ry = top + Math.floor(i / cols) * rh;
      cells.push({ cx: cx, x: cx - tw / 2, y: ry + rh * 0.08, w: tw, h: th, cw: cw, rh: rh, ry: ry });
    }
    return { W: W, H: H, cells: cells, small: W < 560, top: top, bot: bot };
  }

  function test(sim, i, now) {
    var st = sim.state, ind = sim.p.ind;
    st.res[ind][i] = true;
    st.anim = reduce ? null : { i: i, ind: ind, t0: now || performance.now() };
    st.last = i;
    sim.redraw();
  }

  SimLab.createSim({
    ariaLabel: 'A rack of eight test tubes of everyday solutions. Tap a tube to test it with blue litmus, red litmus, turmeric paper or china rose solution and watch the colour change',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'ind', label: 'Indicator', type: 'select', value: 'blue', options: [
        { value: 'blue', label: 'Blue litmus paper' }, { value: 'red', label: 'Red litmus paper' },
        { value: 'turmeric', label: 'Turmeric paper (haldi)' }, { value: 'rose', label: 'China rose (gudhal) solution' }] },
      { id: 'mystery', label: 'Mystery bottles (hide the names)', type: 'toggle', value: false }
    ],
    buttonsTitle: 'Test',
    buttons: [
      { label: 'Test every tube with this indicator', primary: true, full: true, onClick: function (sim) {
        for (var i = 0; i < SUBS.length; i++) sim.state.res[sim.p.ind][i] = true;
        sim.state.last = null; sim.state.anim = null; sim.redraw();
      } },
      { label: 'Wash the tubes (clear results)', full: true, onClick: function (sim) { clear(sim.state); sim.redraw(); } }
    ],
    readouts: [
      { id: 'last', label: 'Last test', key: true },
      { id: 'so', label: 'What we can say' },
      { id: 'n', label: 'Identified: acidic / basic / neutral' }
    ],
    onParam: function (sim, id) {
      if (id === 'mystery') { sim.state.order = sim.p.mystery ? shuffle(sim.state.order.slice()) : SUBS.map(function (s, i) { return i; }); clear(sim.state); }
      sim.redraw(); return true;
    },
    reset: function (sim) { sim.state = { order: SUBS.map(function (s, i) { return i; }) }; clear(sim.state); },
    animate: function (sim) { var a = sim.state.anim; return !!a && performance.now() - a.t0 < 1100; },
    readout: function (sim) {
      var st = sim.state, cnt = { acid: 0, base: 0, neutral: 0 };
      for (var i = 0; i < SUBS.length; i++) { var k = conclude(st, i); if (k && k.sure) cnt[k.type]++; }
      var out = { n: cnt.acid + ' / ' + cnt.base + ' / ' + cnt.neutral + ' of 8', last: 'Tap a test tube', so: 'Test each tube until you can tell' };
      if (st.last != null) {
        var sub = SUBS[st.order[st.last]], ind = st.anim ? st.anim.ind : sim.p.ind, c = conclude(st, st.last);
        out.last = label(sim, st.last) + ' + ' + IND[ind].short + ': ' + outcome(ind, sub);
        out.so = c.sure ? 'It is ' + c.word : c.hint;
      }
      return out;
    },
    status: function (sim) { return 'Tap a tube to test it with ' + IND[sim.p.ind].name; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim);
        for (var i = 0; i < L.cells.length; i++) {
          var c = L.cells[i];
          if (Math.abs(x - c.cx) < c.cw / 2 && y > c.ry && y < c.ry + c.rh) { test(sim, i); return true; }
        }
        return false;
      },
      hover: function (sim, x, y) { var L = layout(sim); return y > L.top && y < L.bot; }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, p = sim.p, st = sim.state, L = layout(sim), fs = L.small ? 10 : 12;
      D.clear(ctx, L.W, L.H, col.bg);
      var I = IND[p.ind];
      D.text(ctx, (L.small ? 'Tap a tube: ' : 'Tap a tube to test it with ') + I.name, L.W / 2, 15,
        { color: col.bg, bg: col.s3, size: L.small ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: L.W });
      // rack shelves
      var seen = {};
      L.cells.forEach(function (c) {
        if (seen[c.ry]) return; seen[c.ry] = true;
        var sy = c.y + c.h * 0.72;
        D.roundRect(ctx, 6, sy, L.W - 12, 7, 3, col.light ? '#c8a27a' : '#7c5a3a');
      });

      L.cells.forEach(function (c, i) {
        var sub = SUBS[st.order[i]], tested = st.res[p.ind][i], a = st.anim && st.anim.i === i && st.anim.ind === p.ind ? st.anim : null;
        var t = a ? M.clamp((now - a.t0) / 1000, 0, 1) : 1, liquidTop = c.y + c.h * 0.35, bottom = c.y + c.h;
        var res = result(p.ind, sub), dip = I.paper ? M.clamp(t / 0.5, 0, 1) : 1, mix = I.paper ? M.clamp((t - 0.45) / 0.45, 0, 1) : M.clamp((t - 0.35) / 0.55, 0, 1);
        // liquid (china rose colours the whole liquid)
        var liq = sub.liq;
        ctx.save();
        tube(ctx, c.x, c.y, c.w, c.h); ctx.clip();
        ctx.fillStyle = liq; ctx.fillRect(c.x, liquidTop, c.w, bottom - liquidTop);
        if (tested && !I.paper) { ctx.globalAlpha = mix * 0.92; ctx.fillStyle = res; ctx.fillRect(c.x, liquidTop, c.w, bottom - liquidTop); ctx.globalAlpha = 1; }
        ctx.restore();
        tube(ctx, c.x, c.y, c.w, c.h); ctx.strokeStyle = col.light ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 1.6; ctx.stroke();
        // falling drops of china rose
        if (a && !I.paper && t < 0.4) {
          for (var k = 0; k < 2; k++) { var dy = c.y - 18 + (t * 2.5 - k * 0.3) * (liquidTop - c.y + 18); if (dy > c.y - 18 && dy < liquidTop) D.circle(ctx, c.cx, dy, 3, I.base); }
        }
        // paper strip in the tube
        if (tested && I.paper) {
          var sw = Math.max(5, c.w * 0.32), sh = c.h * 0.78, sy = c.y - c.h * 0.28 + dip * c.h * 0.22, sx = c.cx - sw / 2;
          ctx.fillStyle = I.base; ctx.fillRect(sx, sy, sw, sh);
          var wet = Math.max(0, sy + sh - liquidTop);
          if (wet > 0) {
            ctx.fillStyle = I.base; ctx.fillRect(sx, sy + sh - wet, sw, wet);
            ctx.globalAlpha = mix; ctx.fillStyle = res; ctx.fillRect(sx, sy + sh - wet - 2, sw, wet + 2); ctx.globalAlpha = 1;
          }
          ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, sw, sh);
        }
        // name and record of results
        var ly = c.y + c.h + 13;
        D.text(ctx, label(sim, i), c.cx, ly, { color: col.text, size: fs, weight: 700, align: 'center', fit: L.W });
        var dots = ORDER.map(function (k) { return st.res[k][i] ? result(k, sub) : null; }), dr = L.small ? 4 : 5, gap = dr * 2.6;
        dots.forEach(function (d, j) {
          var dx = c.cx + (j - 1.5) * gap;
          if (d) D.circle(ctx, dx, ly + 13, dr, d, col.light ? '#334155' : '#e2e8f0', 1);
          else D.circle(ctx, dx, ly + 13, dr - 0.5, null, col.faint, 1);
        });
        var cc = conclude(st, i);
        if (cc && (!a || t >= 1)) D.text(ctx, cc.word, c.cx, ly + 27, { color: cc.sure ? TCOL[cc.type] : col.muted, size: L.small ? 9.5 : 11, weight: cc.sure ? 800 : 600, align: 'center', fit: L.W });
      });
      // legend for the record dots
      var lg = L.small ? 'Dots: blue litmus · red litmus · turmeric · china rose' : 'Dots under each tube record its results: blue litmus · red litmus · turmeric · china rose';
      D.text(ctx, lg, L.W / 2, L.H - 10, { color: col.muted, size: L.small ? 9.5 : 11, align: 'center', fit: L.W });
    }
  });

  function tube(ctx, x, y, w, h) {
    var r = w / 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h - r); ctx.arc(x + r, y + h - r, r, Math.PI, 0, true); ctx.lineTo(x + w, y); ctx.closePath();
  }
})();
