/* =====================================================================
   Chemistry · The pH Scale (acids, bases and salts) — sim.js
   ---------------------------------------------------------------------
   Eight everyday solutions in a rack. Tap one to add a drop of
   universal indicator: its colour shows the pH, and a marker drops onto
   the 0–14 scale. pH below 7 is acidic, 7 neutral, above 7 basic.
   Each step of 1 on the scale is 10 times more (or fewer) H⁺ ions.
   Dilution model: write e = [H⁺] − [OH⁻] for the solution.
     strong acid/base: e falls 10× for every 10× dilution
     weak acid/base:   e falls about √10× (pH moves about ½ unit)
     baking soda:      e hardly changes (it keeps a pH near 8)
   then [H⁺] = e/2 + √(e²/4 + Kw), Kw = 10⁻¹⁴, so pH never crosses 7.
   No timed physics: transport:false, a short drop animation only.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KW = 1e-14, MAXDIL = 3;

  // n: how e scales with dilution factor f (e ∝ f^-n)
  var SUBS = [
    { name: 'Stomach acid', pH: 1.5, kind: 'strong acid', n: 1, liq: '#f3f0e4' },
    { name: 'Lemon juice', pH: 2.4, kind: 'weak acid', n: 0.5, liq: '#fbf3b5' },
    { name: 'Vinegar', pH: 2.9, kind: 'weak acid', n: 0.5, liq: '#f2ede1' },
    { name: 'Milk', pH: 6.6, kind: 'very weakly acidic', n: 0.5, liq: '#fbfaf5' },
    { name: 'Pure water', pH: 7.0, kind: 'neutral', n: 1, liq: '#e6f2fb' },
    { name: 'Baking soda', pH: 8.3, kind: 'weak base', n: 0.15, liq: '#eef4f8' },
    { name: 'Soap water', pH: 10.0, kind: 'weak base', n: 0.5, liq: '#e9eef3' },
    { name: 'Lime water', pH: 12.4, kind: 'strong base', n: 1, liq: '#eef2f5' }
  ];
  var UI = ['#b3122e', '#e0262b', '#ef4a2d', '#f47b2a', '#f9a72b', '#f2cf2a', '#bcd636', '#4fb848',
    '#23a17a', '#2a8fb5', '#2f63b8', '#3d3fa6', '#5a3399', '#6b2a8a', '#5a1f6e'];

  function hex(c) { var n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function uiColor(pH) {
    pH = M.clamp(pH, 0, 14);
    var i = Math.min(13, Math.floor(pH)), t = pH - i, a = hex(UI[i]), b = hex(UI[i + 1]);
    return 'rgb(' + a.map(function (v, k) { return Math.round(M.lerp(v, b[k], t)); }).join(',') + ')';
  }
  function pHof(sub, k) {
    var h0 = Math.pow(10, -sub.pH), e = (h0 - KW / h0) / Math.pow(10, k * sub.n), h;
    if (e >= 0) h = e / 2 + Math.sqrt(e * e / 4 + KW);
    else h = KW / (-e / 2 + Math.sqrt(e * e / 4 + KW));
    return -Math.log10(h);
  }
  function nature(pH) { return pH < 6.95 ? 'acidic' : pH > 7.05 ? 'basic' : 'neutral'; }
  function sig2(x) { var p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / p) * p; }
  function times(pH) {
    var r = Math.pow(10, 7 - pH);
    if (Math.abs(7 - pH) < 0.05) return 'same as pure water';
    if (r > 1) return sig2(r).toLocaleString('en-IN') + '× more H⁺';
    return sig2(1 / r).toLocaleString('en-IN') + '× fewer H⁺';
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, small = W < 560, n = SUBS.length, cols = small ? 4 : n, rows = Math.ceil(n / cols);
    var bx0 = small ? 14 : 30, bx1 = W - bx0, by = small ? 34 : 42, bh = small ? 16 : 20;
    var top = by + bh + (small ? 40 : 48), bot = H - 6, rh = (bot - top) / rows, cw = W / cols;
    var th = Math.min(rh - (small ? 40 : 46), 150), tw = Math.min(cw * 0.36, 34, th * 0.34);
    var cells = [];
    for (var i = 0; i < n; i++) {
      var cx = (i % cols + 0.5) * cw, ry = top + Math.floor(i / cols) * rh, ch = Math.min(rh, th + (small ? 42 : 50)), cy = ry + (rh - ch) / 2;
      cells.push({ cx: cx, x: cx - tw / 2, y: cy + 6, w: tw, h: th, cw: cw, rh: ch, ry: cy });
    }
    return { W: W, H: H, small: small, cells: cells, bx0: bx0, bx1: bx1, by: by, bh: bh, top: top };
  }
  function px(L, pH) { return L.bx0 + (L.bx1 - L.bx0) * pH / 14; }

  function test(sim, i) {
    var st = sim.state;
    st.tested[i] = true; st.sel = i;
    st.anim = reduce ? null : { i: i, t0: performance.now() };
    sim.redraw();
  }

  SimLab.createSim({
    ariaLabel: 'A pH scale from 0 to 14 in universal indicator colours above a rack of eight everyday solutions. Tap a tube to add universal indicator, see its colour and pH, and dilute it with water',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'hide', label: 'Guess first (hide the pH numbers)', type: 'toggle', value: false }
    ],
    buttonsTitle: 'Test',
    buttons: [
      { label: '💧 Add water to the chosen tube (10× more dilute)', primary: true, full: true, onClick: function (sim) {
        var st = sim.state; if (st.sel == null) return;
        if (st.dil[st.sel] < MAXDIL) st.dil[st.sel]++;
        st.tested[st.sel] = true; sim.redraw();
      } },
      { label: 'Test every tube', onClick: function (sim) { for (var i = 0; i < SUBS.length; i++) sim.state.tested[i] = true; sim.state.anim = null; sim.redraw(); } },
      { label: 'Fresh samples', onClick: function (sim) { sim.reset(); } }
    ],
    readouts: [
      { id: 'sel', label: 'Chosen solution', key: true, short: 'Solution' },
      { id: 'ph', label: 'pH', key: true },
      { id: 'nat', label: 'Acidic, basic or neutral?', key: true, short: 'Nature' },
      { id: 'h', label: 'H⁺ ions compared with pure water', short: 'H⁺ vs water' }
    ],
    onParam: function (sim) { sim.redraw(); return true; },
    reset: function (sim) { sim.state = { tested: [], dil: SUBS.map(function () { return 0; }), sel: null, anim: null }; },
    animate: function (sim) { var a = sim.state.anim; return !!a && performance.now() - a.t0 < 1000; },
    readout: function (sim) {
      var st = sim.state;
      if (st.sel == null) return { sel: 'Tap a tube', ph: '—', nat: '—', h: '—' };
      var sub = SUBS[st.sel], k = st.dil[st.sel], pH = pHof(sub, k);
      var hide = sim.p.hide;
      return {
        sel: sub.name + (k ? ' (' + Math.pow(10, k).toLocaleString('en-IN') + '× diluted)' : ''),
        ph: hide ? '? (match the colour)' : M.fmt(pH, 1),
        nat: hide ? '?' : nature(pH) + (k === 0 ? ' · ' + sub.kind : ''),
        h: hide ? '?' : times(pH)
      };
    },
    status: function (sim) { return 'Tap a tube to add universal indicator'; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim);
        for (var i = 0; i < L.cells.length; i++) {
          var c = L.cells[i];
          if (Math.abs(x - c.cx) < c.cw / 2 && y > c.ry && y < c.ry + c.rh) { test(sim, i); return true; }
        }
        return false;
      },
      hover: function (sim, x, y) { return y > layout(sim).top; }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, st = sim.state, L = layout(sim), fs = L.small ? 10 : 12, hide = sim.p.hide;
      D.clear(ctx, L.W, L.H, col.bg);
      // the pH scale
      var g = ctx.createLinearGradient(L.bx0, 0, L.bx1, 0);
      for (var q = 0; q <= 14; q++) g.addColorStop(q / 14, UI[q]);
      D.roundRect(ctx, L.bx0, L.by, L.bx1 - L.bx0, L.bh, 5, g);
      for (q = 0; q <= 14; q++) {
        var tx = px(L, q);
        D.line(ctx, tx, L.by + L.bh, tx, L.by + L.bh + 4, col.muted, 1);
        D.text(ctx, String(q), tx, L.by + L.bh + 12, { color: q === 7 ? col.text : col.muted, size: L.small ? 9.5 : 11, weight: q === 7 ? 800 : 500, align: 'center' });
      }
      var ly = L.by + L.bh + 28;
      D.text(ctx, '◀ more acidic', L.bx0, ly, { color: '#f43f5e', size: L.small ? 10 : 12, weight: 700 });
      D.text(ctx, 'neutral', px(L, 7), ly, { color: '#22c55e', size: L.small ? 10 : 12, weight: 700, align: 'center' });
      D.text(ctx, 'more basic ▶', L.bx1, ly, { color: '#60a5fa', size: L.small ? 10 : 12, weight: 700, align: 'right' });

      // markers for tested tubes (the chosen one drawn last and bigger)
      var order = [];
      for (var i = 0; i < SUBS.length; i++) if (st.tested[i] && i !== st.sel) order.push(i);
      if (st.sel != null && st.tested[st.sel]) order.push(st.sel);
      order.forEach(function (i) {
        var a = st.anim && st.anim.i === i ? M.clamp((now - st.anim.t0) / 900, 0, 1) : 1;
        if (a < 0.6) return;
        var pH = pHof(SUBS[i], st.dil[i]), mx = px(L, pH), big = i === st.sel, s = big ? 8 : 5, y0 = L.by - 2;
        ctx.beginPath(); ctx.moveTo(mx, y0); ctx.lineTo(mx - s, y0 - s * 1.4); ctx.lineTo(mx + s, y0 - s * 1.4); ctx.closePath();
        ctx.fillStyle = uiColor(pH); ctx.fill(); ctx.strokeStyle = big ? col.text : col.muted; ctx.lineWidth = big ? 2 : 1; ctx.stroke();
      });
      var title;
      if (st.sel == null) title = L.small ? 'Tap a tube to add universal indicator' : 'Tap a tube to add a drop of universal indicator';
      else {
        var ps = pHof(SUBS[st.sel], st.dil[st.sel]);
        title = SUBS[st.sel].name + (hide ? ': pH ?' : ': pH ' + M.fmt(ps, 1) + ' · ' + nature(ps));
      }
      D.text(ctx, title, L.W / 2, 11, { color: col.text, size: L.small ? 11 : 13, weight: 700, align: 'center', fit: L.W });

      // the rack
      var seen = {};
      L.cells.forEach(function (c) {
        if (seen[c.ry]) return; seen[c.ry] = true;
        D.roundRect(ctx, 6, c.y + c.h * 0.72, L.W - 12, 7, 3, col.light ? '#c8a27a' : '#7c5a3a');
      });
      L.cells.forEach(function (c, i) {
        var sub = SUBS[i], k = st.dil[i], pH = pHof(sub, k), tested = st.tested[i];
        var a = st.anim && st.anim.i === i ? M.clamp((now - st.anim.t0) / 900, 0, 1) : 1;
        if (i === st.sel) D.roundRect(ctx, c.cx - c.cw / 2 + 3, c.ry, c.cw - 6, c.rh - 4, 8, D.alpha(col.s1, 0.12), D.alpha(col.s1, 0.6), 1.5);
        var liquidTop = c.y + c.h * (0.5 - k * 0.1), bottom = c.y + c.h;
        ctx.save(); tube(ctx, c.x, c.y, c.w, c.h); ctx.clip();
        ctx.fillStyle = sub.liq; ctx.fillRect(c.x, liquidTop, c.w, bottom - liquidTop);
        if (tested) {
          var mix = M.clamp((a - 0.3) / 0.6, 0, 1);
          ctx.globalAlpha = 0.9 * mix; ctx.fillStyle = uiColor(pH); ctx.fillRect(c.x, liquidTop, c.w, bottom - liquidTop);
          if (mix < 1) { ctx.globalAlpha = 0.9 * (1 - mix); D.circle(ctx, c.cx, liquidTop + 6, c.w * 0.4 * (0.3 + mix), '#2f9e44'); }
          ctx.globalAlpha = 1;
        }
        ctx.restore();
        tube(ctx, c.x, c.y, c.w, c.h); ctx.strokeStyle = col.light ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 1.6; ctx.stroke();
        if (a < 0.35) { var dy = c.y - 14 + (a / 0.35) * (liquidTop - c.y + 14); D.circle(ctx, c.cx, dy, 3, '#2f9e44'); }
        var ty = c.y + c.h + 12;
        D.text(ctx, sub.name, c.cx, ty, { color: col.text, size: fs, weight: 700, align: 'center', fit: L.W });
        var line2 = !tested ? 'tap to test' : hide ? (k ? '×' + Math.pow(10, k) + ' water' : 'pH ?') : 'pH ' + M.fmt(pH, 1) + (k ? ' (×' + Math.pow(10, k) + ')' : '');
        D.text(ctx, line2, c.cx, ty + 15, { color: tested && !hide ? uiColor(pH) : col.muted, size: fs, weight: tested ? 800 : 500, align: 'center', fit: L.W });
      });
    }
  });

  function tube(ctx, x, y, w, h) {
    var r = w / 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h - r); ctx.arc(x + r, y + h - r, r, Math.PI, 0, true); ctx.lineTo(x + w, y); ctx.closePath();
  }
})();
