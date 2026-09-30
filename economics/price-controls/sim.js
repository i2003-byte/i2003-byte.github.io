/* =====================================================================
   Demand and supply · Price Ceiling and Price Floor — sim.js
   ---------------------------------------------------------------------
   A regional wheat market (straight-line teaching model, invented numbers):
     Demand  Qd = 520 − 10·P      Supply  Qs = 20·P − 140   (tonnes per day)
     Equilibrium: P* = ₹22 per kg, Q* = 300 tonnes per day.
   Price ceiling (maximum legal price) below P*: shortage = Qd − Qs.
     Only Qs is sold; the black-market price buyers would pay for that
     amount is read off the demand curve: Pb = (520 − Qs) ÷ 10.
     With ration shops, the government fills the shortage from its stock.
   Price floor (minimum support price) above P*: surplus = Qs − Qd.
     With procurement the government buys the surplus at the floor price:
     cost = surplus × 1000 kg × P per day.
   A ceiling above P* or a floor below P* is "not binding".
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var PMAX = 50, QMAX = 600, PE = 22, QE = 300;
  function qd(P) { return Math.max(0, 520 - 10 * P); }
  function qs(P) { return Math.max(0, 20 * P - 140); }
  function lakh(r) { return r >= 1e7 ? '₹' + M.fmt(r / 1e7, 2) + ' crore' : '₹' + M.fmt(r / 1e5, 1) + ' lakh'; }
  function state(p) {
    var mode = p.mode, L = p.level, st = { mode: mode, binding: false, P: PE, qd: QE, qs: QE, traded: QE, gap: 0 };
    if (mode === 'ceiling' && L < PE) st.binding = true;
    if (mode === 'floor' && L > PE) st.binding = true;
    if (!st.binding) return st;
    st.P = L; st.qd = qd(L); st.qs = qs(L);
    if (mode === 'ceiling') {
      st.gap = st.qd - st.qs; st.black = (520 - st.qs) / 10;
      st.traded = p.govt ? st.qd : st.qs; st.stock = p.govt ? st.gap : 0;
    } else {
      st.gap = st.qs - st.qd; st.traded = st.qd; st.buy = p.govt ? st.gap : 0; st.cost = st.buy * 1000 * L;
    }
    return st;
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560;
    var boxW = narrow ? 0 : Math.min(220, W * 0.3), boxH = narrow ? 92 : 0;
    var l = 48, t = narrow ? 48 : 42, r = W - boxW - (narrow ? 14 : 30), b = H - 40 - boxH;
    return { narrow: narrow, l: l, t: t, r: r, b: b, boxW: boxW, boxH: boxH,
      X: function (q) { return l + q / QMAX * (r - l); }, Y: function (P) { return b - P / PMAX * (b - t); } };
  }

  SimLab.createSim({
    ariaLabel: 'Demand and supply curves for wheat with a price ceiling or price floor line, showing the shortage or surplus it creates, the black-market price and government procurement',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'mode', label: 'Government rule', type: 'select', value: 'ceiling', options: [
        { value: 'none', label: 'Free market (no control)' },
        { value: 'ceiling', label: 'Price ceiling (maximum price)' },
        { value: 'floor', label: 'Price floor (minimum support price)' }] },
      { id: 'level', label: 'Controlled price', min: 8, max: 40, step: 1, value: 16, unit: '₹/kg',
        help: 'You can also drag the red or green line on the graph.' },
      { id: 'govt', label: 'Government steps in (ration shops fill a shortage, procurement buys a surplus)', type: 'toggle', value: false }
    ],
    buttons: [
      { label: 'Ration-shop example (ceiling ₹16)', onClick: function (sim) { sim.setParam('mode', 'ceiling'); sim.setParam('level', 16); } },
      { label: 'MSP example (floor ₹26)', onClick: function (sim) { sim.setParam('mode', 'floor'); sim.setParam('level', 26); } }
    ],
    readouts: [
      { id: 'p', label: 'Price paid in the open market', unit: '₹/kg', digits: 0 },
      { id: 'qd', label: 'Buyers want (Qd)', unit: 't/day', digits: 0 },
      { id: 'qs', label: 'Farmers offer (Qs)', unit: 't/day', digits: 0 },
      { id: 'gap', label: 'Shortage / surplus', key: true },
      { id: 'tr', label: 'Wheat that reaches buyers', unit: 't/day', digits: 0 },
      { id: 'extra', label: 'Side effect', key: true }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var s = state(sim.p), extra = '—', gap = 'None';
      if (sim.p.mode !== 'none' && !s.binding) { gap = 'None: control not binding'; }
      else if (s.binding && s.mode === 'ceiling') {
        gap = 'Shortage of ' + Math.round(s.gap) + ' t';
        extra = sim.p.govt ? 'Govt stock used: ' + Math.round(s.stock) + ' t/day' : 'Black-market price ≈ ₹' + Math.round(s.black) + '/kg';
      } else if (s.binding) {
        gap = 'Surplus of ' + Math.round(s.gap) + ' t';
        extra = sim.p.govt ? 'Govt buys ' + Math.round(s.buy) + ' t: ' + lakh(s.cost) + '/day' : Math.round(s.gap) + ' t/day unsold';
      }
      return { p: s.P, qd: s.qd, qs: s.qs, gap: gap, tr: s.traded, extra: extra };
    },
    status: function (sim) {
      var s = state(sim.p);
      if (sim.p.mode === 'none') return 'Free market: ₹22 per kg, 300 t per day';
      return s.binding ? (s.mode === 'ceiling' ? 'Binding ceiling → shortage' : 'Binding floor → surplus') : 'Control is not binding';
    },
    pointer: {
      down: function (sim, x, y) { var L = layout(sim); return sim.p.mode !== 'none' && Math.abs(y - L.Y(sim.p.level)) < 24 && x >= L.l - 10 && x <= L.r + 10; },
      move: function (sim, x, y) { var L = layout(sim); sim.setParam('level', M.clamp(Math.round((L.b - y) / (L.b - L.t) * PMAX), 8, 40)); },
      hover: function (sim, x, y) { var L = layout(sim); return sim.p.mode !== 'none' && Math.abs(y - L.Y(sim.p.level)) < 24 && x >= L.l && x <= L.r; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, L = layout(sim), X = L.X, Y = L.Y, narrow = L.narrow;
      var s = state(sim.p), mode = sim.p.mode, lv = sim.p.level, ctl = mode === 'ceiling' ? c.danger : c.success;
      D.clear(ctx, W, H, c.bg);
      for (var p = 10; p <= PMAX; p += 10) { D.line(ctx, L.l, Y(p), L.r, Y(p), c.grid, 1); D.text(ctx, '₹' + p, L.l - 6, Y(p), { color: c.muted, size: 10, align: 'right' }); }
      for (var q = 100; q <= QMAX; q += 100) {
        D.line(ctx, X(q), L.t, X(q), L.b, c.grid, 1);
        if (!narrow || q % 200 === 0) D.text(ctx, String(q), X(q), L.b + 12, { color: c.muted, size: 10, align: 'center' });
      }
      D.line(ctx, L.l, L.b, L.r, L.b, c.axis, 1.5); D.line(ctx, L.l, L.t, L.l, L.b, c.axis, 1.5);
      D.text(ctx, 'Price of wheat (₹ per kg)', 8, L.t - 14, { color: c.muted, size: 11, weight: 600 });
      D.text(ctx, 'Quantity (tonnes per day)', L.r, L.b + 28, { color: c.muted, size: 11, weight: 600, align: 'right' });

      ctx.save(); ctx.beginPath(); ctx.rect(L.l, L.t, L.r - L.l, L.b - L.t); ctx.clip();
      // gap band
      if (s.binding) {
        ctx.fillStyle = D.alpha(mode === 'ceiling' ? '#f87171' : '#4ade80', 0.22);
        ctx.fillRect(X(Math.min(s.qd, s.qs)), Y(lv) - 10, Math.abs(X(s.qd) - X(s.qs)), 20);
        D.line(ctx, X(s.qd), Y(lv), X(s.qd), L.b, D.alpha(c.s1, 0.7), 1, [4, 3]);
        D.line(ctx, X(s.qs), Y(lv), X(s.qs), L.b, D.alpha(c.s2, 0.7), 1, [4, 3]);
        if (mode === 'ceiling' && !sim.p.govt) {
          // black market: the limited supply is worth Pb to buyers
          D.line(ctx, X(s.qs), Y(lv), X(s.qs), Y(s.black), D.alpha(c.warning, 0.9), 2, [3, 3]);
          D.line(ctx, L.l, Y(s.black), X(s.qs), Y(s.black), D.alpha(c.warning, 0.6), 1, [3, 3]);
        }
      }
      D.line(ctx, X(520 - 10 * PMAX < 0 ? 0 : 520 - 10 * PMAX), Y(52), X(520), Y(0), c.s1, 3.5);
      D.line(ctx, X(0), Y(7), X(QMAX), Y((QMAX + 140) / 20), c.s2, 3.5);
      ctx.restore();
      D.text(ctx, 'D', X(qd(44)) + 12, Y(44), { color: c.s1, size: 12, weight: 700 });
      D.text(ctx, 'S', X(qs(35)) - 8, Y(35) - 4, { color: c.s2, size: 12, weight: 700, align: 'right' });

      // equilibrium
      var eCol = s.binding ? D.alpha(c.s3, 0.55) : c.s3;
      D.circle(ctx, X(QE), Y(PE), 7, eCol, c.bg, 2);
      D.text(ctx, 'E ₹22, 300 t', X(QE) + 12, Y(PE) + (mode === 'floor' && lv > PE ? 16 : -16), { color: eCol, size: 11, weight: 700, bg: D.alpha(c.bg, 0.8), pad: 3, fit: L.r + 20 });

      // control line
      if (mode !== 'none') {
        D.line(ctx, L.l, Y(lv), L.r, Y(lv), ctl, 3, s.binding ? null : [8, 5]);
        var nm = (mode === 'ceiling' ? (narrow ? 'Ceiling' : 'Price ceiling') : (narrow ? 'Floor' : 'Price floor (MSP)')) + ' ₹' + lv;
        D.text(ctx, nm, L.r - 4, Y(lv) + (mode === 'ceiling' ? 16 : -16), { color: c.bg, bg: ctl, size: 10.5, weight: 700, pad: 3, align: 'right' });
        if (s.binding) {
          D.circle(ctx, X(s.qd), Y(lv), 6, c.s1, c.bg, 2);
          D.circle(ctx, X(s.qs), Y(lv), 6, c.s2, c.bg, 2);
          var mid = X((s.qd + s.qs) / 2), lab = (mode === 'ceiling' ? 'shortage ' : 'surplus ') + Math.round(s.gap) + ' t';
          D.text(ctx, lab, mid, Y(lv) - 22, { color: ctl, size: narrow ? 10 : 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 3 });
          if (mode === 'ceiling' && !sim.p.govt) {
            D.circle(ctx, X(s.qs), Y(s.black), 6, c.warning, c.bg, 2);
            D.text(ctx, 'black market ₹' + Math.round(s.black), X(s.qs) + 10, Y(s.black) - 12, { color: c.warning, size: 10.5, weight: 700, bg: D.alpha(c.bg, 0.85), pad: 3, fit: L.r + 20 });
          }
        }
      }

      var hl = mode === 'none' ? 'Free market: the price settles at equilibrium, ₹22 per kg'
        : !s.binding ? (mode === 'ceiling' ? 'Ceiling is ABOVE the market price → no effect (not binding)' : 'Floor is BELOW the market price → no effect (not binding)')
        : mode === 'ceiling' ? 'Ceiling below P* → cheaper wheat, but a SHORTAGE' : 'Floor above P* → farmers earn more, but a SURPLUS';
      var hs = narrow ? 11 : 12.5;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 8.5 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, 13, { color: c.bg, bg: !s.binding ? c.s3 : ctl, size: hs, weight: 700, align: 'center', pad: 4, fit: W });

      // who gains, who loses
      var lines;
      if (!s.binding) lines = [['Price', '₹' + PE + ' per kg', c.s3], ['Traded', QE + ' t per day', c.ink], ['Shortage / surplus', 'none', c.muted]];
      else if (mode === 'ceiling') lines = [
        ['Buyers want', Math.round(s.qd) + ' t', c.s1], ['Farmers offer', Math.round(s.qs) + ' t', c.s2],
        sim.p.govt ? ['Ration shops', '+' + Math.round(s.stock) + ' t (stock)', c.success] : ['Black market', '≈ ₹' + Math.round(s.black) + ' per kg', c.warning]];
      else lines = [
        ['Buyers want', Math.round(s.qd) + ' t', c.s1], ['Farmers offer', Math.round(s.qs) + ' t', c.s2],
        sim.p.govt ? ['Govt buys', Math.round(s.buy) + ' t · ' + lakh(s.cost) + '/day', c.warning] : ['Unsold', Math.round(s.gap) + ' t per day', c.danger]];
      if (!narrow) {
        var tx = W - L.boxW - 8, ty = L.t + 4, bw = L.boxW;
        D.roundRect(ctx, tx, ty, bw, 176, 8, c.surface2, c.border, 1);
        D.text(ctx, s.binding ? 'At the controlled price' : 'Market outcome', tx + 10, ty + 16, { color: c.ink, size: 12, weight: 700 });
        lines.forEach(function (ln, i) {
          D.text(ctx, ln[0], tx + 10, ty + 44 + i * 40, { color: c.muted, size: 11, weight: 600 });
          D.text(ctx, ln[1], tx + 10, ty + 62 + i * 40, { color: ln[2], size: 12.5, weight: 700, fit: tx + bw });
        });
      } else {
        var y0 = H - L.boxH + 4, cw = (W - 16) / 3;
        D.roundRect(ctx, 8, y0, W - 16, L.boxH - 10, 8, c.surface2, c.border, 1);
        lines.forEach(function (ln, i) {
          var xx = 8 + cw * (i + 0.5), parts = ln[1].split(' · ');
          D.text(ctx, ln[0], xx, y0 + 18, { color: c.muted, size: 10, weight: 600, align: 'center' });
          parts.forEach(function (pt, k) { D.text(ctx, pt, xx, y0 + 40 + k * 18, { color: ln[2], size: 11.5, weight: 700, align: 'center' }); });
        });
      }
    }
  });
})();
