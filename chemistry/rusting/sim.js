/* =====================================================================
   Chemical reactions · Rusting of Iron — sim.js
   ---------------------------------------------------------------------
   Five test tubes, each with an iron nail, left for 14 days (1 day per
   second at 1× speed):
     A  air + tap water            (oxygen ✓, water ✓)  → rusts
     B  dry air, calcium chloride  (oxygen ✓, water ✗)  → no rust
     C  boiled water under oil     (oxygen ✗, water ✓)  → no rust
     D  salt water + air           (oxygen ✓, water ✓)  → rusts faster
     E  your nail in tap water + air, with a chosen protection.
   Rust cover R = 1 − e^(−k·t) of the surface that can rust; k per day
   is chosen to show the order of speeds, not measured values.
   Spots appear first near the waterline, where air and water meet.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var DAYS = 14, K_AIR = 0.16, K_SALT = 0.42, K_ZN = 0.05;
  var PROT = {
    none:      { label: 'Bare iron', k: K_AIR, area: 1 },
    paint:     { label: 'Painted', k: 0, area: 0 },
    scratch:   { label: 'Painted, scratched', k: K_AIR, area: 0.1 },
    grease:    { label: 'Greased', k: 0, area: 0 },
    zinc:      { label: 'Galvanised', k: 0, area: 0, zn: K_ZN },
    zincs:     { label: 'Galvanised, scratched', k: 0, area: 0, zn: K_ZN * 2.2, reach: true },
    steel:     { label: 'Stainless steel', k: 0, area: 0, reach: true }
  };
  var E_TEXT = {
    none: 'E · Bare iron in air and water rusts just like tube A.',
    paint: 'E · Paint covers the iron, so air and water cannot reach it: no rust while the paint is whole.',
    scratch: 'E · Rust starts at the scratch, where bare iron meets air and water, then creeps under the paint.',
    grease: 'E · A layer of grease or oil keeps air and water away from the iron: no rust.',
    zinc: 'E · Galvanising: a zinc coat seals the iron. The zinc slowly turns dull white, the iron does not rust.',
    zincs: 'E · Even with a scratch the iron stays bright: zinc is more reactive, so it corrodes first and protects the iron.',
    steel: 'E · Stainless steel is iron alloyed with chromium and nickel, which form a thin, tight oxide skin: no rust.'
  };
  var TUBES = [
    { id: 'A', o2: true, h2o: true, k: K_AIR, l1: 'Air +', l2: 'tap water',
      text: 'A · Air and water both reach the nail, so it rusts, most of all at the waterline where they meet.' },
    { id: 'B', o2: true, h2o: false, k: 0, l1: 'Dry air', l2: '(CaCl₂)', cork: true,
      text: 'B · Anhydrous calcium chloride soaks up all the water vapour. Oxygen but no water: no rust.' },
    { id: 'C', o2: false, h2o: true, k: 0, l1: 'Boiled water', l2: '+ oil', cork: true,
      text: 'C · Boiling drives out the dissolved air and the oil layer keeps new air out. Water but no oxygen: no rust.' },
    { id: 'D', o2: true, h2o: true, k: K_SALT, l1: 'Salt', l2: 'water', salt: true,
      text: 'D · Salt water carries electric charge (ions) easily, so rusting is much faster. Ships and seaside cars rust quickly.' },
    { id: 'E', o2: true, h2o: true, l1: '', l2: 'tap water' }
  ];
  var st = { day: 0, R: [0, 0, 0, 0, 0], zn: 0, sel: 0 };
  var spots = [];
  (function () {   // fixed random spots for each tube's nail
    for (var t = 0; t < 5; t++) {
      var r = M.rng(31 + t * 7), a = [];
      for (var i = 0; i < 46; i++) {
        var s = r();                                      // 0 = under the head, 1 = tip
        a.push({ s: s, side: r() * 2 - 1, size: 0.5 + r() * 0.8, thr: r() * (0.15 + Math.abs(s - 0.42) * 1.6) });
      }
      spots.push(a);
    }
  })();

  function prot(sim) { return PROT[sim.p.prot] || PROT.none; }
  function kOf(sim, i) { return i === 4 ? prot(sim).k : TUBES[i].k; }

  function wrap(ctx, str, maxW) {
    var words = str.split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, top = narrow ? 50 : 56, bottom = narrow ? 56 : 60;
    var colW = W / 5, tw = Math.min(colW * 0.56, 58), th = H - top - bottom - 14;
    return { W: W, H: H, narrow: narrow, top: top, colW: colW, tw: tw, th: th, ty: top + 10 };
  }

  SimLab.createSim({
    ariaLabel: 'Five test tubes with iron nails: air and water, dry air with calcium chloride, boiled water under oil, salt water, and a protected nail. As the days pass rust appears only where both oxygen and water reach the iron',
    mobileAspect: '1 / 1',
    playLabel: 'Start the days',
    params: [
      { id: 'prot', label: 'Tube E: protect the nail', type: 'select', value: 'paint', options: [
        { value: 'none', label: 'No protection (bare iron)' },
        { value: 'paint', label: 'Painted' },
        { value: 'scratch', label: 'Painted, but scratched' },
        { value: 'grease', label: 'Greased / oiled' },
        { value: 'zinc', label: 'Galvanised (zinc coat)' },
        { value: 'zincs', label: 'Galvanised, but scratched' },
        { value: 'steel', label: 'Stainless steel (alloy)' }] },
      { id: 'mol', label: 'Show oxygen and water molecules', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'day', label: 'Day', digits: 1, key: true },
      { id: 'A', label: 'Tube A rust (air + water)', short: 'A rust', unit: '%', digits: 0, key: true },
      { id: 'B', label: 'Tube B rust (dry air)', unit: '%', digits: 0 },
      { id: 'C', label: 'Tube C rust (no air)', unit: '%', digits: 0 },
      { id: 'D', label: 'Tube D rust (salt water)', unit: '%', digits: 0 },
      { id: 'E', label: 'Tube E rust (your nail)', short: 'E rust', unit: '%', digits: 0, key: true }
    ],
    graph: { title: 'Rust on the nail vs days', yLabel: '% rusted', xLabel: 'time (days)', yMin: 0, yMax: 100, xMax: DAYS,
      series: [{ label: 'A air + water', color: '--sim-2' }, { label: 'D salt water', color: '--sim-4' }, { label: 'E your nail', color: '--sim-1' }] },
    reset: function (sim) {
      st.day = 0; st.R = [0, 0, 0, 0, 0]; st.zn = 0;
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [0, 0, 0]); }
    },
    onParam: function (sim, id) { if (id === 'mol') { sim.redraw(); return true; } },
    update: function (sim, dt) {
      if (st.day >= DAYS) return;
      st.day = Math.min(DAYS, st.day + dt);
      for (var i = 0; i < 5; i++) {
        var area = i === 4 ? prot(sim).area : 1;
        st.R[i] = area * (1 - Math.exp(-kOf(sim, i) * st.day));
      }
      var z = prot(sim).zn || 0; st.zn = 1 - Math.exp(-z * st.day);
      if (sim.graph && Math.floor(st.day * 4) !== Math.floor((st.day - dt) * 4)) sim.graph.push(st.day, [st.R[0] * 100, st.R[3] * 100, st.R[4] * 100]);
    },
    finished: function () { return st.day >= DAYS; },
    readout: function () {
      return { day: st.day, A: st.R[0] * 100, B: st.R[1] * 100, C: st.R[2] * 100, D: st.R[3] * 100, E: st.R[4] * 100 };
    },
    status: function () { return st.day >= DAYS ? 'Two weeks later: rust only where oxygen and water both reached bare iron' : 'Day ' + Math.floor(st.day); },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim); if (y < L.top) return false;
        st.sel = M.clamp(Math.floor(x / L.colW), 0, 4); sim.redraw(); return false;
      },
      hover: function (sim, x, y) { return y > layout(sim).top; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, pr = prot(sim);
      D.clear(ctx, W, H, c.bg);
      var glass = D.alpha(c.ink, 0.55), water = D.alpha('#38bdf8', c.light ? 0.28 : 0.22), rust = '#b4501a', rustD = '#7c2d12';
      var iron = c.light ? '#64748b' : '#94a3b8';
      // shelf
      var shelfY = L.ty + L.th + 4;
      D.roundRect(ctx, 6, shelfY, W - 12, 7, 3, D.alpha(c.ink, 0.25));

      TUBES.forEach(function (T, i) {
        var cx = L.colW * (i + 0.5), x0 = cx - L.tw / 2, y0 = L.ty, tw = L.tw, th = L.th, r = tw / 2;
        var sel = st.sel === i;
        if (sel) D.roundRect(ctx, cx - L.colW / 2 + 3, L.top - 2, L.colW - 6, H - L.top - 2, 10, D.alpha(c.accent, 0.08), D.alpha(c.accent, 0.5), 1.5);
        // contents
        var wl = y0 + th * 0.42;                       // waterline for A, D, E
        if (T.id === 'C') wl = y0 + th * 0.14;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + th - r); ctx.arc(cx, y0 + th - r, r, Math.PI, 0, true); ctx.lineTo(x0 + tw, y0); ctx.closePath();
        ctx.clip();
        if (T.id !== 'B') {
          ctx.fillStyle = T.salt ? D.alpha('#5eead4', c.light ? 0.3 : 0.22) : water; ctx.fillRect(x0, wl, tw, th);
          var sed = st.R[i];
          if (sed > 0.02) { ctx.fillStyle = D.alpha(rust, Math.min(0.45, sed * 0.5)); ctx.fillRect(x0, y0 + th - r * 1.3, tw, r * 1.3); }
          if (T.id === 'C') { ctx.fillStyle = D.alpha('#facc15', 0.55); ctx.fillRect(x0, wl - 9, tw, 9); }
        } else {
          var gr = M.rng(5);   // calcium chloride lumps + cotton wool
          for (var g = 0; g < 26; g++) D.circle(ctx, x0 + 4 + gr() * (tw - 8), y0 + th - 4 - gr() * th * 0.16, 3 + gr() * 2, c.light ? '#e5e7eb' : '#f1f5f9', D.alpha(c.ink, 0.3), 1);
          for (var g2 = 0; g2 < 10; g2++) D.circle(ctx, x0 + 4 + gr() * (tw - 8), y0 + th * 0.78 + gr() * 6, 5, D.alpha('#ffffff', c.light ? 0.9 : 0.75));
        }
        ctx.restore();
        // nail: head at nTop, tip at nBot
        var nTop = y0 + th * (T.id === 'C' ? 0.22 : 0.12), nBot = T.id === 'B' ? y0 + th * 0.76 : y0 + th - r * 0.6, nw = Math.max(5, tw * 0.16);
        var isE = i === 4, body = iron;
        if (isE && (p.prot === 'paint' || p.prot === 'scratch')) body = '#15803d';
        if (isE && (p.prot === 'zinc' || p.prot === 'zincs')) body = c.light ? '#9ca3af' : '#cbd5e1';
        if (isE && p.prot === 'steel') body = c.light ? '#a1a1aa' : '#e2e8f0';
        ctx.fillStyle = body;
        ctx.beginPath(); ctx.moveTo(cx - nw / 2, nTop); ctx.lineTo(cx + nw / 2, nTop); ctx.lineTo(cx + nw / 2, nBot - nw); ctx.lineTo(cx, nBot); ctx.lineTo(cx - nw / 2, nBot - nw); ctx.closePath(); ctx.fill();
        D.roundRect(ctx, cx - nw * 1.4, nTop - 4, nw * 2.8, 5, 2, body);
        ctx.fillStyle = D.alpha('#ffffff', 0.25); ctx.fillRect(cx - nw / 2 + 1, nTop + 2, nw * 0.25, nBot - nTop - nw - 2);
        if (isE && p.prot === 'grease') { ctx.strokeStyle = D.alpha('#facc15', 0.7); ctx.lineWidth = 2.5; ctx.strokeRect(cx - nw / 2 - 1.5, nTop - 1, nw + 3, nBot - nTop - nw); }
        var sw = (wl - nTop) / (nBot - nTop);           // waterline along the nail
        if (isE && (p.prot === 'scratch' || p.prot === 'zincs')) {
          D.line(ctx, cx - nw / 2 - 1, nTop + (nBot - nTop) * (sw + 0.04), cx + nw / 2 + 1, nTop + (nBot - nTop) * (sw - 0.02), iron, 2.5);
        }
        // rust spots
        var R = st.R[i], band = isE && p.prot === 'scratch';
        if (R > 0) spots[i].forEach(function (s) {
          var ss = band ? sw - 0.07 + s.s * 0.14 : s.s;
          var lim = band ? R / 0.1 : R;
          if (lim <= s.thr) return;
          var y = nTop + (nBot - nTop - nw) * ss, rad = Math.min(nw * 0.62, s.size * nw * 0.3 * (1 + (lim - s.thr) * 3));
          D.circle(ctx, cx + s.side * nw * 0.22, y, rad, D.alpha(s.thr > 0.5 ? rustD : rust, 0.9));
        });
        if (isE && st.zn > 0) spots[4].forEach(function (s) {
          if (st.zn * 1.6 <= s.thr) return;
          D.circle(ctx, cx + s.side * nw * 0.22, nTop + (nBot - nTop - nw) * s.s, nw * 0.3 * s.size, '#f1f5f9', '#64748b', 1);
        });
        // molecules
        if (p.mol) {
          var mr = M.rng(100 + i), tt = sim.time;
          var airTop = y0 + (T.cork ? 12 : 4), airBot = T.id === 'B' ? y0 + th * 0.72 : wl - (T.id === 'C' ? 10 : 2);
          function jig(k) { return Math.sin(tt * (1.3 + k % 3) + k) * 2; }
          if (T.o2) for (var m = 0; m < 4; m++) {
            var mx = x0 + 6 + mr() * (tw - 12) + jig(m), my = airTop + 6 + mr() * Math.max(4, airBot - airTop - 12) + jig(m + 1);
            D.circle(ctx, mx - 2.4, my, 2.4, null, '#f87171', 1.6); D.circle(ctx, mx + 2.4, my, 2.4, null, '#f87171', 1.6);
          }
          if (T.h2o && T.id !== 'C') for (var v = 0; v < 2; v++) {
            var vx = x0 + 6 + mr() * (tw - 12) + jig(v + 4), vy = airTop + 6 + mr() * Math.max(4, airBot - airTop - 12);
            D.circle(ctx, vx, vy, 2.8, '#38bdf8'); D.circle(ctx, vx + 3, vy - 2, 1.5, '#e2e8f0');
          }
          if (T.o2 && T.h2o) for (var d = 0; d < 2; d++) {   // a little dissolved oxygen
            var dx = x0 + 6 + mr() * (tw - 12), dy = wl + 10 + mr() * (th * 0.3);
            D.circle(ctx, dx - 2.2, dy + jig(d), 2.2, null, '#f87171', 1.4); D.circle(ctx, dx + 2.2, dy + jig(d), 2.2, null, '#f87171', 1.4);
          }
        }
        // glass
        ctx.strokeStyle = glass; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, y0 - 4); ctx.lineTo(x0, y0 + th - r); ctx.arc(cx, y0 + th - r, r, Math.PI, 0, true); ctx.lineTo(x0 + tw, y0 - 4); ctx.stroke();
        if (T.cork) D.roundRect(ctx, x0 - 2, y0 - 6, tw + 4, 14, 3, '#a16207');
        // labels
        var fs = L.narrow ? 10 : 12, ly = shelfY + 14;
        D.text(ctx, T.id, cx, y0 - 16, { color: sel ? c.accent : c.ink, size: L.narrow ? 13 : 15, weight: 700, align: 'center' });
        var ok1 = T.o2, ok2 = T.h2o;
        if (isE && pr.k === 0 && !pr.reach) { ok1 = ok2 = false; }
        D.text(ctx, 'O₂ ' + (ok1 ? '✓' : '✗') + ' H₂O ' + (ok2 ? '✓' : '✗'), cx, ly, { color: ok1 && ok2 && (isE ? pr.k > 0 : T.k > 0) ? c.warning : c.muted, size: fs - (L.narrow ? 1 : 0), weight: 700, align: 'center' });
        var l1 = isE ? pr.label : T.l1, l2 = isE ? '(air + water)' : T.l2;
        if (L.narrow && isE) { var sp = l1.split(', '); l1 = sp[0]; l2 = sp[1] || l2; }
        D.text(ctx, l1, cx, ly + fs + 4, { color: c.text, size: fs, weight: 600, align: 'center', fit: W });
        D.text(ctx, l2, cx, ly + 2 * fs + 7, { color: c.muted, size: fs, align: 'center', fit: W });
        if (R > 0.02) D.text(ctx, Math.round(R * 100) + '%', cx, y0 + th * 0.02 + (T.cork ? 18 : 8), { color: '#fff', bg: rust, size: fs, weight: 700, align: 'center', pad: 3 });
      });

      // explanation for the selected tube
      var txt = st.sel === 4 ? E_TEXT[p.prot] : TUBES[st.sel].text;
      if (st.day === 0) txt = 'Press Start. Tap a tube to read about it. ' + txt;
      var fsz = L.narrow ? 11.5 : 13;
      ctx.font = '600 ' + fsz + 'px Inter, system-ui, sans-serif';
      var lines = wrap(ctx, txt, W - 24);
      while (lines.length > 2 && fsz > 9) { fsz -= 0.5; ctx.font = '600 ' + fsz + 'px Inter, system-ui, sans-serif'; lines = wrap(ctx, txt, W - 24); }
      D.roundRect(ctx, 6, 4, W - 12, L.top - 22, 8, D.alpha(c.accent, 0.12));
      lines.slice(0, 2).forEach(function (ln, k) {
        D.text(ctx, ln, 14, 4 + (L.top - 22) / 2 + (k - (Math.min(2, lines.length) - 1) / 2) * (fsz + 3), { color: c.text, size: fsz, weight: 600 });
      });
    }
  });
})();
