/* =====================================================================
   Force and laws of motion · Collisions and Momentum — sim.js
   ---------------------------------------------------------------------
   Two carts A and B on a straight, frictionless track collide head-on.
   The bounciness is set by the coefficient of restitution e:
     e = 1 elastic (bouncy springs), e = 0.5 partly elastic,
     e = 0 perfectly inelastic (Velcro: they stick together).
   After the collision
     vA = (mA uA + mB uB − mB e (uA − uB)) ÷ (mA + mB)
     vB = (mA uA + mB uB + mA e (uA − uB)) ÷ (mA + mB)
   Total momentum mA uA + mB uB is the same before and after for every e;
   kinetic energy is kept only when e = 1.
   The collision is instant; for a moment the equal and opposite
   impulses (third law) are drawn on both carts.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var TRACK = 6, XA0 = 1.2, XB0 = 4.3;
  var E = { elastic: 1, partial: 0.5, sticky: 0 };

  function width(m) { return 0.5 + 0.1 * m; }
  function eOf(p) { return E[p.kind] != null ? E[p.kind] : 1; }

  function preset(sim, v) {
    Object.keys(v).forEach(function (k) { sim.setParam(k, v[k], false); });
    sim.reset(); sim.play();
  }

  SimLab.createSim({
    ariaLabel: 'Two carts on a straight track collide; arrows show their velocities and bars compare momentum and kinetic energy before and after',
    mobileAspect: '4 / 3.9',
    params: [
      { id: 'mA', label: 'Mass of cart A', min: 0.5, max: 5, step: 0.5, value: 1, unit: 'kg' },
      { id: 'uA', label: 'Starting velocity of A (+ = right)', min: -3, max: 3, step: 0.1, value: 2, unit: 'm/s' },
      { id: 'mB', label: 'Mass of cart B', min: 0.5, max: 5, step: 0.5, value: 1, unit: 'kg' },
      { id: 'uB', label: 'Starting velocity of B (+ = right)', min: -3, max: 3, step: 0.1, value: 0, unit: 'm/s' },
      { id: 'kind', label: 'Type of collision', type: 'select', value: 'elastic',
        options: [{ value: 'elastic', label: 'Elastic: springy bumpers (e = 1)' }, { value: 'partial', label: 'Partly elastic: rubber (e = 0.5)' }, { value: 'sticky', label: 'Inelastic: Velcro, they stick (e = 0)' }] }
    ],
    buttonsTitle: 'Try a set-up',
    buttons: [
      { label: 'Equal carts, B at rest', onClick: function (sim) { preset(sim, { mA: 1, mB: 1, uA: 2, uB: 0, kind: 'elastic' }); } },
      { label: 'Heavy hits light', onClick: function (sim) { preset(sim, { mA: 4, mB: 1, uA: 1.5, uB: 0, kind: 'elastic' }); } },
      { label: 'Light hits heavy', onClick: function (sim) { preset(sim, { mA: 1, mB: 4, uA: 2, uB: 0, kind: 'elastic' }); } },
      { label: 'Railway wagons couple', onClick: function (sim) { preset(sim, { mA: 4, mB: 4, uA: 1, uB: 0, kind: 'sticky' }); } },
      { label: 'Head-on, stick together', onClick: function (sim) { preset(sim, { mA: 2, mB: 2, uA: 1.5, uB: -1.5, kind: 'sticky' }); } }
    ],
    readouts: [
      { id: 'pt', label: 'Total momentum (before → after)', key: true },
      { id: 'ke', label: 'Kinetic energy (before → after)' },
      { id: 'lost', label: 'Kinetic energy turned to heat & sound', unit: '%', digits: 0 },
      { id: 'vA', label: 'Velocity of A now', unit: 'm/s', digits: 2 },
      { id: 'vB', label: 'Velocity of B now', unit: 'm/s', digits: 2 },
      { id: 'J', label: 'Impulse on A = −impulse on B', unit: 'N·s', digits: 2 }
    ],
    graph: { title: 'Momentum of A, of B and the total', yLabel: 'kg·m/s', xMax: 4,
      series: [{ label: 'A', color: '--sim-1' }, { label: 'B', color: '--sim-2' }, { label: 'total', color: '--sim-3' }] },

    reset: function (sim) {
      var p = sim.p;
      sim.state = { t: 0, xA: XA0, xB: XB0, vA: p.uA, vB: p.uB, hit: false, tHit: null, J: 0, stuck: false };
    },
    update: function (sim, dt) {
      var p = sim.p, st = sim.state;
      st.t += dt;
      st.xA += st.vA * dt; st.xB += st.vB * dt;
      var gap = st.xB - st.xA - (width(p.mA) + width(p.mB)) / 2;
      if (!st.hit && gap <= 0 && st.vA > st.vB) {
        var e = eOf(p), P = p.mA * st.vA + p.mB * st.vB, rel = st.vA - st.vB, mt = p.mA + p.mB;
        var vA = (P - p.mB * e * rel) / mt, vB = (P + p.mA * e * rel) / mt;
        st.J = p.mA * (vA - st.vA);
        st.vA = vA; st.vB = vB; st.hit = true; st.tHit = st.t; st.stuck = e === 0;
        st.xA -= gap / 2; st.xB += gap / 2;   // undo the tiny overlap
      }
    },
    finished: function (sim) {
      var st = sim.state, p = sim.p;
      var offA = st.xA + width(p.mA) / 2 < -0.3 || st.xA - width(p.mA) / 2 > TRACK + 0.3;
      var offB = st.xB + width(p.mB) / 2 < -0.3 || st.xB - width(p.mB) / 2 > TRACK + 0.3;
      var still = Math.abs(st.vA) < 1e-9 && Math.abs(st.vB) < 1e-9;
      return (offA && offB) || (still && (st.hit || st.t > 0.5)) || st.t > 12 || (offA || offB) && st.t > 6;
    },
    sample: function (sim) { var st = sim.state, p = sim.p; return [p.mA * st.vA, p.mB * st.vB, p.mA * st.vA + p.mB * st.vB]; },
    status: function (sim) {
      var st = sim.state, p = sim.p;
      if (p.uA <= p.uB) return 'A is not catching up with B: they will never meet';
      if (st.hit) return (st.stuck ? 'Stuck together' : 'Bounced apart') + ' · t = ' + M.fmt(st.t, 2) + ' s';
      return (sim.running ? 'Approaching' : 'Paused') + ' · t = ' + M.fmt(st.t, 2) + ' s';
    },
    readout: function (sim) {
      var st = sim.state, p = sim.p;
      var P0 = p.mA * p.uA + p.mB * p.uB, K0 = 0.5 * p.mA * p.uA * p.uA + 0.5 * p.mB * p.uB * p.uB;
      var P1 = p.mA * st.vA + p.mB * st.vB, K1 = 0.5 * p.mA * st.vA * st.vA + 0.5 * p.mB * st.vB * st.vB;
      return {
        pt: M.fmt(P0, 2) + ' → ' + (st.hit ? M.fmt(P1, 2) : '?') + ' kg·m/s',
        ke: M.fmt(K0, 2) + ' → ' + (st.hit ? M.fmt(K1, 2) : '?') + ' J',
        lost: st.hit && K0 > 0 ? (K0 - K1) / K0 * 100 : 0,
        vA: st.vA, vB: st.vB, J: st.J
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, st = sim.state, narrow = W < 560;
      var pad = narrow ? 12 : 30, sc = (W - 2 * pad) / TRACK, top = 40;
      var railY = top + (narrow ? 96 : Math.max(120, (H - top) * 0.32));
      function X(x) { return pad + x * sc; }
      D.clear(ctx, W, H, c.bg);

      // track
      D.line(ctx, X(0), railY, X(TRACK), railY, c.ink, 3);
      for (var k = 0; k <= TRACK; k++) {
        D.line(ctx, X(k), railY + 2, X(k), railY + 8, c.muted, 1.5);
        if (!narrow || k % 2 === 0) D.text(ctx, k + ' m', X(k), railY + 18, { color: c.faint, size: 10, align: 'center' });
      }

      var flash = st.hit && st.t - st.tHit < 0.6;
      function cart(x, m, v, col, name, side, noArrow) {
        var w = width(m) * sc, h = (narrow ? 24 : 30) + m * (narrow ? 3 : 4), cx = X(x), y = railY - 6 - h, wr = narrow ? 5 : 7;
        D.roundRect(ctx, cx - w / 2, y, w, h, 5, col, D.alpha('#000', 0.35), 1);
        D.circle(ctx, cx - w * 0.28, railY - wr, wr, c.surface2, c.ink, 1.5);
        D.circle(ctx, cx + w * 0.28, railY - wr, wr, c.surface2, c.ink, 1.5);
        // bumper / velcro face
        var fx = side > 0 ? cx + w / 2 : cx - w / 2;
        if (p.kind === 'sticky') D.roundRect(ctx, fx - 2, y + 4, 4, h - 8, 1, '#a3e635');
        else D.line(ctx, fx, y + 6, fx + side * 4, y + h - 6, c.ink, 2, p.kind === 'elastic' ? [3, 2] : null);
        D.text(ctx, name, cx, y + h / 2 - (narrow ? 6 : 8), { color: '#0b1020', size: narrow ? 11 : 13, weight: 800, align: 'center' });
        D.text(ctx, (m % 1 ? M.fmt(m, 1) : String(m)) + ' kg', cx, y + h / 2 + (narrow ? 6 : 8), { color: '#0b1020', size: narrow ? 9 : 11, weight: 600, align: 'center' });
        // velocity arrow
        if (noArrow) { /* moving together: one arrow is drawn on A */ }
        else if (Math.abs(v) > 0.01) {
          var L = v * (narrow ? 18 : 30), ay = y - 14;
          D.arrow(ctx, cx, ay, cx + L, ay, col, 3, 8);
          D.text(ctx, M.fmt(v, 2) + ' m/s', cx + L + (v > 0 ? 5 : -5), ay, { color: col, size: 10.5, weight: 700, align: v > 0 ? 'left' : 'right', bg: D.alpha(c.bg, 0.8), fit: W });
        } else D.text(ctx, 'at rest', cx, y - 14, { color: c.muted, size: 10.5, align: 'center' });
        return { x: cx, y: y, h: h, w: w };
      }
      var a = cart(st.xA, p.mA, st.vA, c.s1, 'A', 1);
      var b = cart(st.xB, p.mB, st.vB, c.s2, 'B', -1, st.stuck);
      if (flash && Math.abs(st.J) > 0) {
        var mx = (a.x + a.w / 2 + b.x - b.w / 2) / 2, fy = railY + 34, L = M.clamp(Math.abs(st.J) * (narrow ? 14 : 22), 16, narrow ? 70 : 120);
        D.arrow(ctx, mx - 3, fy, mx - 3 - L, fy, c.s1, 3, 8);
        D.arrow(ctx, mx + 3, fy, mx + 3 + L, fy, c.s2, 3, 8);
        D.text(ctx, 'equal and opposite pushes', mx, fy + 15, { color: c.text, size: 10.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), fit: W });
      }

      // before / after bars
      var P0A = p.mA * p.uA, P0B = p.mB * p.uB, P1A = p.mA * st.vA, P1B = p.mB * st.vB;
      var K0 = 0.5 * p.mA * p.uA * p.uA + 0.5 * p.mB * p.uB * p.uB, K1 = 0.5 * p.mA * st.vA * st.vA + 0.5 * p.mB * st.vB * st.vB;
      var by0 = railY + (narrow ? 66 : 76), rowH = narrow ? 15 : 18, labW = narrow ? 92 : 130;
      var mid = pad + labW + (W - 2 * pad - labW) / 2, half = (W - 2 * pad - labW) / 2 - 4;
      var pMax = Math.max(1, Math.abs(P0A) + Math.abs(P0B)), ps = (half - 36) / pMax;
      var kMax = Math.max(0.5, K0), ks = (half * 2 - 44) / kMax / 0.9;
      D.text(ctx, 'Momentum (kg·m/s)  ← left · right →', mid, by0, { color: c.muted, size: 10.5, weight: 600, align: 'center', fit: W });
      D.line(ctx, mid, by0 + 8, mid, by0 + 8 + rowH * 4, c.axis, 1);
      function pbar(row, label, vals) {
        var y = by0 + 10 + row * rowH, start = mid;
        D.text(ctx, label, pad, y + rowH / 2 - 1, { color: c.text, size: 10.5 });
        vals.forEach(function (v) {
          if (v[0] === null) return;
          var w = v[0] * ps;
          D.roundRect(ctx, Math.min(start, start + w), y + 2, Math.abs(w), rowH - 5, 2, v[1]);
          start += w;
        });
        var tot = vals.reduce(function (s, v) { return s + (v[0] || 0); }, 0);
        D.text(ctx, M.fmt(tot, 2), start + (tot >= 0 ? 4 : -4), y + rowH / 2 - 1, { color: c.text, size: 10, weight: 700, align: tot >= 0 ? 'left' : 'right', fit: W });
      }
      pbar(0, 'Before (A + B)', [[P0A, c.s1], [P0B, c.s2]]);
      if (st.hit) pbar(1, 'After (A + B)', [[P1A, c.s1], [P1B, c.s2]]);
      else D.text(ctx, 'After: wait for the collision', pad, by0 + 10 + rowH * 1.5 - 1, { color: c.faint, size: 10.5 });
      var ky = by0 + 10 + rowH * 2 + 8;
      D.text(ctx, 'Kinetic energy (J)', pad + labW, ky + 4, { color: c.muted, size: 10.5, weight: 600, fit: W });
      function kbar(row, label, k, col) {
        var y = ky + 12 + row * rowH;
        D.text(ctx, label, pad, y + rowH / 2 - 1, { color: c.text, size: 10.5 });
        D.roundRect(ctx, pad + labW, y + 2, Math.max(1, k * ks * 0.9), rowH - 5, 2, col);
        D.text(ctx, M.fmt(k, 2), pad + labW + k * ks * 0.9 + 4, y + rowH / 2 - 1, { color: c.text, size: 10, weight: 700, fit: W });
      }
      kbar(0, 'Before', K0, c.s3);
      if (st.hit) kbar(1, 'After', K1, K1 < K0 - 1e-6 ? c.warning : c.s3);

      // headline
      var headline, hc = c.s1;
      if (p.uA <= p.uB) { headline = 'A is not faster than B, so they never collide'; hc = c.muted; }
      else if (!st.hit) headline = 'Total momentum before: ' + M.fmt(P0A + P0B, 2) + ' kg·m/s';
      else if (st.stuck) { headline = 'Stuck together: momentum kept, ' + M.fmt((K0 - K1) / K0 * 100, 0) + '% of the energy lost'; hc = c.warning; }
      else if (eOf(p) === 1) { headline = 'Elastic: momentum and kinetic energy both kept'; hc = c.success; }
      else { headline = 'Momentum kept, but ' + M.fmt((K0 - K1) / K0 * 100, 0) + '% of the energy turned to heat and sound'; hc = c.warning; }
      var hs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(headline).width > W - 30) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, headline, W / 2, 18, { color: c.bg, bg: hc, size: hs, weight: 700, align: 'center', pad: 5, fit: W });
    }
  });
})();
