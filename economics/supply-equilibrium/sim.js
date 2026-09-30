/* =====================================================================
   Demand and supply · Supply and Market Equilibrium — sim.js
   ---------------------------------------------------------------------
   The same town mango market as "The Demand Curve", now with sellers.
   Straight-line teaching model (made-up but sensible numbers):
     Demand  Qd = 400 − 2·P + festival                 (kg per day)
     Supply  Qs = 3·(P − (c − 10)) − 50 + harvest      (kg per day)
       P = price (₹/kg), c = cost of transport and labour (₹/kg):
       a higher cost lifts the supply curve UP by (c − 10) rupees.
       harvest: +90 bumper crop, −120 after a cyclone.
   Equilibrium where Qd = Qs:
     P* = (450 + festival + 3(c − 10) − harvest) ÷ 5,  Q* = 400 + festival − 2P*
   Starting market: P* = ₹90, Q* = 220 kg.
   Price adjustment (Walrasian): dP/dt = k·(Qd − Qs), k = 0.12 ₹ per kg
   of excess demand per day. A shortage pushes the price up, a surplus
   pulls it down. Time is in days.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var PMAX = 250, QMAX = 600, K = 0.12;
  var HARVEST = {
    normal: { name: 'Normal harvest', q: 0 },
    bumper: { name: 'Bumper crop (good rains)', q: 90 },
    cyclone: { name: 'Cyclone damaged the orchards', q: -120 }
  };
  var FEST = { normal: { name: 'An ordinary week', q: 0 }, festival: { name: 'Festival week (demand up)', q: 80 } };

  function sh(p) { return { d: FEST[p.demand].q, s: -3 * (p.cost - 10) + HARVEST[p.harvest].q }; }
  function qd(P, s) { return Math.max(0, 400 - 2 * P + s.d); }
  function qsRaw(P, s) { return 3 * P - 50 + s.s; }
  function qs(P, s) { return Math.max(0, qsRaw(P, s)); }
  function eq(s) { var P = (450 + s.d - s.s) / 5; return { P: P, Q: 400 + s.d - 2 * P }; }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560;
    var boxW = narrow ? 0 : Math.min(210, W * 0.28), boxH = narrow ? 70 : 0;
    var l = 52, t = narrow ? 48 : 42, r = W - boxW - (narrow ? 14 : 30), b = H - 40 - boxH;
    return { narrow: narrow, l: l, t: t, r: r, b: b, boxW: boxW, boxH: boxH,
      X: function (q) { return l + q / QMAX * (r - l); }, Y: function (P) { return b - P / PMAX * (b - t); } };
  }
  function fitHeadline(ctx, text, max, size) {
    ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 8.5 && ctx.measureText(text).width > max) { size -= 0.5; ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif'; }
    return size;
  }

  SimLab.createSim({
    ariaLabel: 'Demand and supply curves for mangoes crossing at the equilibrium point, with the current price line showing a shortage or surplus and arrows for how the price will move',
    mobileAspect: '3 / 3.9',
    params: [
      { id: 'price', label: 'Starting price', min: 20, max: 240, step: 5, value: 40, unit: '₹/kg',
        help: 'Set a price, then press Play and watch the market move it. You can also drag the price line.' },
      { id: 'cost', label: 'Cost of transport and labour', min: 0, max: 40, step: 2, value: 10, unit: '₹/kg' },
      { id: 'harvest', label: 'Weather and harvest', type: 'select', value: 'normal', options: Object.keys(HARVEST).map(function (k) { return { value: k, label: HARVEST[k].name }; }) },
      { id: 'demand', label: 'Buyers', type: 'select', value: 'normal', options: Object.keys(FEST).map(function (k) { return { value: k, label: FEST[k].name }; }) }
    ],
    buttons: [{ label: 'Back to the starting market', onClick: function (sim) {
      sim.setParam('cost', 10); sim.setParam('harvest', 'normal'); sim.setParam('demand', 'normal');
    } }],
    readouts: [
      { id: 'p', label: 'Market price now', unit: '₹/kg', digits: 1, key: true },
      { id: 'qd', label: 'Buyers want (Qd)', unit: 'kg/day', digits: 0 },
      { id: 'qs', label: 'Sellers offer (Qs)', unit: 'kg/day', digits: 0 },
      { id: 'gap', label: 'Gap', key: true },
      { id: 'ep', label: 'Equilibrium price P*', unit: '₹/kg', digits: 1 },
      { id: 'eq', label: 'Equilibrium quantity Q*', unit: 'kg/day', digits: 0 }
    ],
    graph: { title: 'Price over time', xLabel: 'time (days)', yLabel: '₹ per kg', yMin: 0, yMax: 250, xMax: 10,
      series: [{ label: 'market price' }, { label: 'equilibrium price P*', color: '--sim-3' }] },
    onParam: function (sim, id) { return id !== 'price'; },
    reset: function (sim) { sim.state = { P: sim.p.price }; },
    update: function (sim, dt) {
      var s = sh(sim.p), st = sim.state;
      st.P = M.clamp(st.P + K * (qd(st.P, s) - qs(st.P, s)) * dt, 1, PMAX);
    },
    sample: function (sim) { return [sim.state.P, eq(sh(sim.p)).P]; },
    readout: function (sim) {
      var s = sh(sim.p), P = sim.state.P, d = qd(P, s), q = qs(P, s), E = eq(s), g = d - q;
      return { p: P, qd: d, qs: q, ep: E.P, eq: E.Q,
        gap: Math.abs(g) < 1 ? 'None: market clears' : g > 0 ? 'Shortage of ' + Math.round(g) + ' kg' : 'Surplus of ' + Math.round(-g) + ' kg' };
    },
    status: function (sim) {
      var s = sh(sim.p), g = qd(sim.state.P, s) - qs(sim.state.P, s);
      if (Math.abs(g) < 1) return 'Equilibrium: the price has settled';
      return sim.running ? (g > 0 ? 'Shortage → price rising' : 'Surplus → price falling') : 'Press Play to let the market adjust';
    },
    pointer: {
      down: function (sim, x, y) { var L = layout(sim); return Math.abs(y - L.Y(sim.state.P)) < 24 && x >= L.l - 10 && x <= L.r + 10; },
      move: function (sim, x, y) {
        var L = layout(sim), P = (L.b - y) / (L.b - L.t) * PMAX;
        sim.setParam('price', M.clamp(Math.round(P / 5) * 5, 20, 240), true);
      },
      hover: function (sim, x, y) { var L = layout(sim); return Math.abs(y - L.Y(sim.state.P)) < 24 && x >= L.l && x <= L.r; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, L = layout(sim), X = L.X, Y = L.Y, narrow = L.narrow;
      var s = sh(sim.p), P = sim.state.P, d = qd(P, s), q = qs(P, s), E = eq(s), g = d - q, base = { d: 0, s: 0 };
      var shifted = s.d !== 0 || s.s !== 0;
      D.clear(ctx, W, H, c.bg);

      for (var p = 50; p <= PMAX; p += 50) { D.line(ctx, L.l, Y(p), L.r, Y(p), c.grid, 1); D.text(ctx, '₹' + p, L.l - 6, Y(p), { color: c.muted, size: 10, align: 'right' }); }
      for (var qq = 100; qq <= QMAX; qq += 100) {
        D.line(ctx, X(qq), L.t, X(qq), L.b, c.grid, 1);
        if (!narrow || qq % 200 === 0) D.text(ctx, String(qq), X(qq), L.b + 12, { color: c.muted, size: 10, align: 'center' });
      }
      D.line(ctx, L.l, L.b, L.r, L.b, c.axis, 1.5); D.line(ctx, L.l, L.t, L.l, L.b, c.axis, 1.5);
      D.text(ctx, 'Price (₹ per kg)', 8, L.t - 14, { color: c.muted, size: 11, weight: 600 });
      D.text(ctx, 'Quantity (kg per day)', L.r, L.b + 28, { color: c.muted, size: 11, weight: 600, align: 'right' });

      ctx.save(); ctx.beginPath(); ctx.rect(L.l, L.t, L.r - L.l, L.b - L.t); ctx.clip();
      function demand(ss, col, w, dash) { var a = 400 + ss.d; D.line(ctx, X(Math.max(0, a - 2 * PMAX)), Y(Math.min(PMAX, a / 2)), X(a), Y(0), col, w, dash); }
      function supply(ss, col, w, dash) {
        var p0 = Math.max(0, (50 - ss.s) / 3), p1 = Math.min(PMAX, (QMAX + 50 - ss.s) / 3);
        D.line(ctx, X(qs(p0, ss)), Y(p0), X(qs(p1, ss)), Y(p1), col, w, dash);
      }
      if (shifted) {
        var ghost = D.alpha(c.ink, 0.3);
        if (s.d !== 0) demand(base, ghost, 2, [6, 5]);
        if (s.s !== 0) supply(base, ghost, 2, [6, 5]);
        var E0 = eq(base); D.circle(ctx, X(E0.Q), Y(E0.P), 5, null, ghost, 2);
      }
      // shortage / surplus band at the current price
      if (Math.abs(g) >= 1) {
        var col = g > 0 ? c.danger : c.s4, yP = Y(P);
        ctx.fillStyle = D.alpha(g > 0 ? '#f87171' : '#a78bfa', 0.22);
        ctx.fillRect(X(Math.min(d, q)), yP - 9, Math.abs(X(d) - X(q)), 18);
        var mid = X((d + q) / 2);
        D.text(ctx, (g > 0 ? 'shortage ' : 'surplus ') + Math.round(Math.abs(g)) + ' kg', mid, yP + (g > 0 ? 22 : -20), { color: col, size: narrow ? 10 : 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 3 });
        var ay = g > 0 ? -1 : 1, ax = L.r - 16;
        D.arrow(ctx, ax, yP, ax, yP + ay * 28, col, 3, 10);
      }
      demand(s, c.s1, 3.5); supply(s, c.s2, 3.5);
      ctx.restore();
      D.text(ctx, shifted && s.d ? 'D₁' : 'D', X(qd(215, s)) + 8, Y(215), { color: c.s1, size: 12, weight: 700 });
      var pl = Math.min(PMAX - 15, (QMAX - 60 + 50 - s.s) / 3);
      D.text(ctx, shifted && s.s ? 'S₁' : 'S', X(qs(pl, s)) - 8, Y(pl) - 4, { color: c.s2, size: 12, weight: 700, align: 'right' });

      // equilibrium
      D.line(ctx, L.l, Y(E.P), X(E.Q), Y(E.P), D.alpha(c.s3, 0.8), 1, [4, 3]);
      D.line(ctx, X(E.Q), Y(E.P), X(E.Q), L.b, D.alpha(c.s3, 0.8), 1, [4, 3]);
      D.circle(ctx, X(E.Q), Y(E.P), 7, c.s3, c.bg, 2);
      D.text(ctx, 'E  ₹' + M.fmt(E.P, 0) + ', ' + Math.round(E.Q) + ' kg', X(E.Q) + 12, Y(E.P) + (P > E.P ? 16 : -16), { color: c.s3, size: 11, weight: 700, bg: D.alpha(c.bg, 0.8), pad: 3, fit: L.r + 20 });

      // current price line with its two points
      var yP2 = Y(P);
      D.line(ctx, L.l, yP2, L.r, yP2, c.warning, 2, [7, 4]);
      D.text(ctx, '₹' + Math.round(P), L.l + 4, yP2 - 10, { color: c.bg, bg: c.warning, size: 10, weight: 700, pad: 3 });
      if (Math.abs(g) >= 1) {
        D.circle(ctx, X(d), yP2, 6, c.s1, c.bg, 2);
        D.circle(ctx, X(q), yP2, 6, c.s2, c.bg, 2);
      }

      var hl = Math.abs(g) < 1 ? 'Equilibrium: buyers want exactly what sellers offer'
        : g > 0 ? 'Price too low → SHORTAGE → buyers bid the price UP'
        : 'Price too high → SURPLUS → sellers cut the price DOWN';
      var hs = fitHeadline(ctx, hl, W - 24, narrow ? 11 : 12.5);
      D.text(ctx, hl, W / 2, 13, { color: c.bg, bg: Math.abs(g) < 1 ? c.s3 : g > 0 ? c.danger : c.s4, size: hs, weight: 700, align: 'center', pad: 4, fit: W });

      // market report
      var rows = [['Buyers want', Math.round(d) + ' kg', c.s1], ['Sellers offer', Math.round(q) + ' kg', c.s2],
        [Math.abs(g) < 1 ? 'Gap' : g > 0 ? 'Shortage' : 'Surplus', Math.abs(g) < 1 ? 'none' : Math.round(Math.abs(g)) + ' kg', Math.abs(g) < 1 ? c.s3 : g > 0 ? c.danger : c.s4]];
      if (!narrow) {
        var tx = W - L.boxW - 8, ty = L.t + 4, bw = L.boxW, rh = 24, mx = Math.max(d, q, 1);
        D.roundRect(ctx, tx, ty, bw, 208, 8, c.surface2, c.border, 1);
        D.text(ctx, 'Market report at ₹' + Math.round(P), tx + 10, ty + 16, { color: c.ink, size: 12, weight: 700 });
        rows.forEach(function (rw, i) {
          var yy = ty + 42 + rh * i;
          D.text(ctx, rw[0], tx + 10, yy, { color: c.muted, size: 11, weight: 600 });
          D.text(ctx, rw[1], tx + bw - 10, yy, { color: rw[2], size: 12, weight: 700, align: 'right' });
        });
        var by = ty + 118, bmax = bw - 20;
        [['Qd', d, c.s1], ['Qs', q, c.s2]].forEach(function (b, i) {
          D.roundRect(ctx, tx + 10, by + i * 22, Math.max(2, b[1] / Math.max(mx, 400) * bmax), 14, 4, b[2]);
          D.text(ctx, b[0], tx + 14, by + i * 22 + 7, { color: c.bg, size: 10, weight: 700 });
        });
        var note = Math.abs(g) < 1 ? 'No pressure: price stays.' : g > 0 ? 'Buyers compete → price ↑' : 'Unsold mangoes → price ↓';
        D.text(ctx, note, tx + 10, ty + 184, { color: rows[2][2], size: 11, weight: 700 });
      } else {
        var y0 = H - L.boxH + 4, cw = (W - 16) / 3;
        D.roundRect(ctx, 8, y0, W - 16, L.boxH - 10, 8, c.surface2, c.border, 1);
        rows.forEach(function (rw, i) {
          var xx = 8 + cw * (i + 0.5);
          D.text(ctx, rw[0], xx, y0 + 18, { color: c.muted, size: 10, weight: 600, align: 'center' });
          D.text(ctx, rw[1], xx, y0 + 40, { color: rw[2], size: 13, weight: 700, align: 'center' });
        });
      }
    }
  });
})();
