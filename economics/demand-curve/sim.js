/* =====================================================================
   Demand and supply · The Demand Curve — sim.js
   ---------------------------------------------------------------------
   A town's market for mangoes. The market demand schedule is a straight
   line (a simple model, with made-up but sensible numbers):
     Qd = 400 − 2·P + 3·(I − 30) + 0.8·(Pa − 150) + taste     (kg per day)
       P  = price of mangoes (₹ per kg)
       I  = family income (₹ thousand per month): mangoes are a normal good
       Pa = price of apples (₹ per kg): a substitute
       taste = +80 in mango season, −100 after a scare
   Changing P moves the point ALONG the curve (change in quantity
   demanded). Changing I, Pa or taste SHIFTS the whole curve (change in
   demand). Spending = P × Q. Price elasticity at a point:
     e = (ΔQ ÷ ΔP) × (P ÷ Q) = −2 × P ÷ Q
   Economists draw price on the vertical axis and quantity across.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var PMAX = 250, QMAX = 700, BASE = { inc: 30, apple: 150, taste: 'normal' };
  var TASTE = {
    normal: { name: 'An ordinary week', q: 0 },
    season: { name: 'Mango season + festival', q: 80 },
    scare: { name: 'News scare about ripening chemicals', q: -100 }
  };
  var last = 'price';

  function shift(p) { return 3 * (p.inc - 30) + 0.8 * (p.apple - 150) + TASTE[p.taste].q; }
  function qd(P, s) { return Math.max(0, 400 - 2 * P + s); }
  function rupees(v) { return '₹' + Math.round(v).toLocaleString('en-IN'); }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560;
    var tableW = narrow ? 0 : Math.min(190, W * 0.26), tableH = narrow ? 64 : 0;
    var l = 52, t = narrow ? 48 : 40, r = W - tableW - (narrow ? 14 : 28), b = H - 40 - tableH;
    return { narrow: narrow, l: l, t: t, r: r, b: b, tableW: tableW, tableH: tableH,
      X: function (q) { return l + q / QMAX * (r - l); }, Y: function (P) { return b - P / PMAX * (b - t); } };
  }
  function headline(p, s, narrow) {
    if (last === 'price') return narrow ? 'Price changed → move ALONG the curve' : 'Price changed → move ALONG the curve (change in quantity demanded)';
    var sgn = last === 'taste' ? TASTE[p.taste].q : last === 'inc' ? p.inc - BASE.inc : p.apple - BASE.apple;
    var why = last === 'inc' ? 'Income' : last === 'apple' ? 'Apple price' : 'Tastes';
    if (Math.abs(s) < 1e-9) return why + ' back to normal → the curve is back where it started';
    return why + (last === 'taste' ? ' changed' : sgn > 0 ? ' up' : ' down') + ' → curve SHIFTS ' + (s > 0 ? 'RIGHT' + (narrow ? '' : ' (demand rises)') : 'LEFT' + (narrow ? '' : ' (demand falls)'));
  }

  SimLab.createSim({
    ariaLabel: 'A demand curve for mangoes with price on the vertical axis and quantity on the horizontal axis, a draggable point, the spending rectangle and a demand schedule',
    transport: false,
    mobileAspect: '3 / 3.8',
    params: [
      { id: 'price', label: 'Price of mangoes', min: 20, max: 240, step: 5, value: 100, unit: '₹/kg',
        help: 'You can also drag the point up and down the curve.' },
      { id: 'inc', label: 'Average family income', min: 10, max: 70, step: 5, value: 30, format: function (v) { return rupees(v * 1000) + ' / month'; } },
      { id: 'apple', label: 'Price of apples (a substitute)', min: 50, max: 250, step: 10, value: 150, unit: '₹/kg' },
      { id: 'taste', label: 'Tastes and news', type: 'select', value: 'normal', options: Object.keys(TASTE).map(function (k) { return { value: k, label: TASTE[k].name }; }) }
    ],
    buttons: [{ label: 'Back to the starting market', onClick: function (sim) {
      sim.setParam('inc', BASE.inc); sim.setParam('apple', BASE.apple); sim.setParam('taste', BASE.taste); last = 'price';
    } }],
    readouts: [
      { id: 'p', label: 'Price', unit: '₹/kg', digits: 0 },
      { id: 'q', label: 'Quantity demanded', unit: 'kg/day', digits: 0, key: true },
      { id: 'sp', label: 'Buyers spend (P × Q)', key: true },
      { id: 'e', label: 'Price elasticity e', digits: 2 },
      { id: 'kind', label: 'Demand here is' }
    ],
    onParam: function (sim, id) { last = id; return true; },
    reset: function () {},
    readout: function (sim) {
      var s = shift(sim.p), P = sim.p.price, Q = qd(P, s), e = Q > 0 ? -2 * P / Q : null;
      return { p: P, q: Q, sp: rupees(P * Q) + ' per day', e: e == null ? '—' : e,
        kind: e == null ? 'No buyers at this price' : Math.abs(e) > 1.02 ? 'Elastic (|e| > 1)' : Math.abs(e) < 0.98 ? 'Inelastic (|e| < 1)' : 'Unit elastic (|e| = 1)' };
    },
    status: function (sim) { var Q = qd(sim.p.price, shift(sim.p)); return '₹' + sim.p.price + ' per kg → ' + Math.round(Q) + ' kg per day'; },
    pointer: {
      down: function (sim, x, y) { var L = layout(sim); return x >= L.l - 10 && x <= L.r + 10 && y >= L.t - 10 && y <= L.b + 10; },
      move: function (sim, x, y) {
        var L = layout(sim), P = (L.b - y) / (L.b - L.t) * PMAX;
        last = 'price';
        sim.setParam('price', M.clamp(Math.round(P / 5) * 5, 20, 240));
      },
      hover: function (sim, x, y) { var L = layout(sim); return x >= L.l && x <= L.r && y >= L.t && y <= L.b; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, L = layout(sim), X = L.X, Y = L.Y;
      var s = shift(sim.p), P = sim.p.price, Q = qd(P, s), narrow = L.narrow;
      D.clear(ctx, W, H, c.bg);

      // axes and grid
      for (var p = 50; p <= PMAX; p += 50) { D.line(ctx, L.l, Y(p), L.r, Y(p), c.grid, 1); D.text(ctx, '₹' + p, L.l - 6, Y(p), { color: c.muted, size: 10, align: 'right' }); }
      for (var q = 100; q <= QMAX; q += 100) {
        D.line(ctx, X(q), L.t, X(q), L.b, c.grid, 1);
        if (!narrow || q % 200 === 0) D.text(ctx, String(q), X(q), L.b + 12, { color: c.muted, size: 10, align: 'center' });
      }
      D.line(ctx, L.l, L.b, L.r, L.b, c.axis, 1.5); D.line(ctx, L.l, L.t, L.l, L.b, c.axis, 1.5);
      D.text(ctx, 'Price (₹ per kg)', 8, L.t - 14, { color: c.muted, size: 11, weight: 600 });
      D.text(ctx, 'Quantity demanded (kg per day)', L.r, L.b + 28, { color: c.muted, size: 11, weight: 600, align: 'right' });

      // spending rectangle
      if (Q > 0) {
        ctx.fillStyle = D.alpha('#4ade80', 0.16); ctx.fillRect(L.l, Y(P), X(Q) - L.l, L.b - Y(P));
        if (X(Q) - L.l > (narrow ? 60 : 96) && L.b - Y(P) > 24) D.text(ctx, (narrow ? '' : 'spending ') + rupees(P * Q), L.l + 6, L.b - 12, { color: c.success, size: narrow ? 10 : 11, weight: 700 });
      }
      function curve(sh, color, width, dash) {
        var qTop = qd(PMAX, sh), pBot = Math.min(PMAX, (400 + sh) / 2);
        if (400 + sh <= 0) return;
        var qa = qTop, pa = PMAX; if (qa <= 0) { qa = 0; pa = pBot; }
        var qb = Math.min(QMAX, 400 + sh), pb = (400 + sh - qb) / 2;
        D.line(ctx, X(qa), Y(pa), X(qb), Y(pb), color, width, dash);
      }
      // ghost of the starting curve and the shift arrow
      if (Math.abs(s) > 1e-9) {
        curve(0, D.alpha(c.ink, 0.35), 2, [6, 5]);
        var yA = Y(170), qa0 = qd(170, 0), qa1 = qd(170, s);
        D.arrow(ctx, X(qa0), yA, X(Math.max(0, qa1)), yA, s > 0 ? c.success : c.danger, 2.5, 10);
        D.text(ctx, 'D₀', X(qd(215, 0)) + 8, Y(215), { color: c.muted, size: 11, weight: 700 });
      }
      curve(s, c.s1, 3.5);
      var lp = 205; D.text(ctx, Math.abs(s) > 1e-9 ? 'D₁' : 'D', X(qd(lp, s)) + 8, Y(lp) - 2, { color: c.s1, size: 12, weight: 700 });

      // the point and its guides
      D.line(ctx, L.l, Y(P), X(Q), Y(P), D.alpha(c.ink, 0.55), 1, [4, 3]);
      D.line(ctx, X(Q), Y(P), X(Q), L.b, D.alpha(c.ink, 0.55), 1, [4, 3]);
      D.circle(ctx, X(Q), Y(P), 8, c.warning, c.bg, 2);
      D.text(ctx, '₹' + P + ', ' + Math.round(Q) + ' kg', X(Q) + 12, Y(P) - 12, { color: c.ink, size: 11, weight: 700, bg: D.alpha(c.bg, 0.8), pad: 3, fit: L.r + (narrow ? 14 : 20) });

      // headline
      var hl = headline(sim.p, s, narrow), hs = narrow ? 11 : 12.5;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 8.5 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, 13, { color: c.bg, bg: last === 'price' ? c.warning : s >= 0 ? c.success : c.danger, size: hs, weight: 700, align: 'center', pad: 4, fit: W });

      // demand schedule
      var prices = [40, 80, 120, 160, 200];
      if (!narrow) {
        var tx = W - L.tableW - 6, ty = L.t + 4, rh = 24;
        D.roundRect(ctx, tx, ty, L.tableW, rh * (prices.length + 1) + 30, 8, c.surface2, c.border, 1);
        D.text(ctx, 'Demand schedule', tx + 10, ty + 14, { color: c.ink, size: 12, weight: 700 });
        D.text(ctx, 'Price', tx + 10, ty + 36, { color: c.muted, size: 11, weight: 600 });
        D.text(ctx, 'Qd (kg)', tx + L.tableW - 10, ty + 36, { color: c.muted, size: 11, weight: 600, align: 'right' });
        prices.forEach(function (pp, i) {
          var yy = ty + 36 + rh * (i + 1), on = Math.abs(pp - P) < 20;
          D.text(ctx, '₹' + pp, tx + 10, yy, { color: on ? c.warning : c.ink, size: 12, weight: on ? 700 : 500 });
          D.text(ctx, String(Math.round(qd(pp, s))), tx + L.tableW - 10, yy, { color: on ? c.warning : c.ink, size: 12, weight: on ? 700 : 500, align: 'right' });
        });
      } else {
        var y0 = H - L.tableH + 6, cw = (W - 16) / (prices.length + 1);
        D.roundRect(ctx, 8, y0, W - 16, L.tableH - 12, 8, c.surface2, c.border, 1);
        D.text(ctx, 'Price', 14, y0 + 16, { color: c.muted, size: 10, weight: 600 });
        D.text(ctx, 'Qd (kg)', 14, y0 + 36, { color: c.muted, size: 10, weight: 600 });
        prices.forEach(function (pp, i) {
          var xx = 8 + cw * (i + 1.5), on = Math.abs(pp - P) < 20;
          D.text(ctx, '₹' + pp, xx, y0 + 16, { color: on ? c.warning : c.ink, size: 11, weight: on ? 700 : 500, align: 'center' });
          D.text(ctx, String(Math.round(qd(pp, s))), xx, y0 + 36, { color: on ? c.warning : c.ink, size: 11, weight: on ? 700 : 500, align: 'center' });
        });
      }
    }
  });
})();
