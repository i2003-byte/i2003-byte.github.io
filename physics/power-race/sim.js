/* =====================================================================
   Work, energy and power · Power Race — sim.js
   ---------------------------------------------------------------------
   Three lifters raise the same mass m through the same height h:
     a walker on the stairs (time t₁), a runner on the stairs (time t₂)
     and an electric motor lift of rated power P (time t₃ = m g h ÷ P).
   All three do the same work W = m g h, but in different times, so
     power P = W ÷ t  (1 W = 1 J/s, 1 hp ≈ 746 W)
   The work–time graph is a straight line for each lifter; the steeper
   line is the bigger power. The bottom panel turns the motor's power
   into the commercial unit:  1 kWh = 1 kW for 1 hour = 3.6 × 10⁶ J
   and an electricity bill at the chosen rate per unit.
   Simplifications: each lifter goes up at a steady speed, the motor is
   100% efficient, and the work done by people moving their arms and
   legs is not counted (only lifting the mass).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var g = 9.8, xMaxV = 30;

  function times(p) { var W = p.m * g * p.h; return [p.tA, p.tB, W / p.P]; }

  SimLab.createSim({
    ariaLabel: 'Three lanes of a building: a walker and a runner climbing stairs and a motor lift, all raising the same mass to the same height, with power bars and an electricity bill for the motor',
    mobileAspect: '3 / 4',
    params: [
      { id: 'm', label: 'Mass lifted (person + load) m', min: 30, max: 100, step: 5, value: 50, unit: 'kg' },
      { id: 'h', label: 'Height climbed h (3 m per floor)', min: 3, max: 18, step: 3, value: 9, unit: 'm' },
      { id: 'tA', label: 'Time taken by the walker t₁', min: 10, max: 90, step: 1, value: 30, unit: 's' },
      { id: 'tB', label: 'Time taken by the runner t₂', min: 4, max: 30, step: 1, value: 10, unit: 's' },
      { id: 'P', label: 'Power of the motor lift P', min: 250, max: 3000, step: 250, value: 1000, unit: 'W',
        presets: [{ label: '0.5 kW', value: 500 }, { label: '1 kW', value: 1000 }, { label: '1 hp', value: 750 }, { label: '2 kW', value: 2000 }] },
      { id: 'rate', label: 'Electricity rate per unit (kWh)', min: 3, max: 12, step: 0.5, value: 8, unit: '₹' }
    ],
    readouts: [
      { id: 'W', label: 'Work done by each, W = m g h', unit: 'J', digits: 0, key: true },
      { id: 'PA', label: 'Power of the walker W ÷ t₁', unit: 'W', digits: 0 },
      { id: 'PB', label: 'Power of the runner W ÷ t₂', unit: 'W', digits: 0 },
      { id: 'tC', label: 'Time taken by the motor W ÷ P', unit: 's', digits: 1 },
      { id: 'hp', label: 'Motor power in horsepower', unit: 'hp', digits: 2 },
      { id: 'kwh', label: 'Motor running 1 h a day for 30 days', unit: 'kWh', digits: 1 },
      { id: 'bill', label: 'Cost of that electricity', unit: '₹', digits: 0 }
    ],
    graph: { title: 'Work done against time (steeper line = more power)', yLabel: 'W (J)', xMax: function () { return xMaxV; }, yMin: 0,
      series: [{ label: 'Walker', color: '--sim-1' }, { label: 'Runner', color: '--sim-2' }, { label: 'Motor', color: '--sim-4' }] },

    reset: function (sim) { var t = times(sim.p); xMaxV = Math.max(t[0], t[1], t[2]) * 1.05; sim.state = {}; },
    onParam: function (sim, id) { return id === 'rate'; },
    update: function () {},
    finished: function (sim) { var t = times(sim.p); return sim.time >= Math.max(t[0], t[1], t[2]); },
    sample: function (sim) {
      var W = sim.p.m * g * sim.p.h;
      return times(sim.p).map(function (t) { return W * Math.min(1, sim.time / t); });
    },
    status: function (sim) {
      var t = times(sim.p), T = Math.max(t[0], t[1], t[2]);
      if (sim.time >= T) return 'All three reached the top · same work, different power';
      if (sim.time === 0 && !sim.running) return 'Press Play to start the race';
      return (sim.running ? 'Climbing' : 'Paused') + ' · t = ' + M.fmt(sim.time, 1) + ' s';
    },
    readout: function (sim) {
      var p = sim.p, W = p.m * g * p.h, kwh = p.P / 1000 * 30;
      return { W: W, PA: W / p.tA, PB: W / p.tB, tC: W / p.P, hp: p.P / 746, kwh: kwh, bill: kwh * p.rate };
    },

    draw: function (sim) {
      var ctx = sim.ctx, Wd = sim.width, H = sim.height, c = sim.colors, p = sim.p, narrow = Wd < 560;
      D.clear(ctx, Wd, H, c.bg);
      var W = p.m * g * p.h, t = times(p), now = sim.time;
      var P = [W / t[0], W / t[1], p.P];
      var cols = [c.s1, c.s2, c.s4], names = ['Walker', 'Runner', 'Motor lift'];

      var head = 'Same work: W = m g h = ' + p.m + ' × 9.8 × ' + p.h + ' = ' + M.fmt(W, 0) + ' J';
      var hs = narrow ? 11.5 : 13;
      D.text(ctx, head, Wd / 2, 15, { color: c.bg, bg: c.s3, size: hs, weight: 700, align: 'center', pad: 4, fit: Wd });

      // building with three lanes
      var bTop = 46, bBot = Math.round(H * (narrow ? 0.56 : 0.6)), lx0 = narrow ? 40 : 60, lx1 = Wd - (narrow ? 10 : 24);
      var lw = (lx1 - lx0) / 3, floors = p.h / 3, fh = (bBot - bTop) / floors;
      D.line(ctx, 6, bBot, Wd - 6, bBot, c.ink, 2.5);
      for (var f = 0; f <= floors; f++) {
        var fy = bBot - f * fh;
        D.line(ctx, lx0, fy, lx1, fy, f ? D.alpha(c.muted, 0.5) : c.ink, f ? 1.2 : 2.5);
        D.text(ctx, (f * 3) + ' m', lx0 - 6, fy, { color: c.faint, size: 10, align: 'right' });
      }
      for (var k = 0; k < 3; k++) {
        var x0 = lx0 + k * lw + 6, x1 = lx0 + (k + 1) * lw - 6, cx = (x0 + x1) / 2, frac = Math.min(1, now / t[k]);
        if (k) D.line(ctx, x0 - 6, bTop - 4, x0 - 6, bBot, D.alpha(c.muted, 0.35), 1);
        if (k < 2) {
          // zig-zag stairs, one flight per floor
          ctx.save(); ctx.strokeStyle = D.alpha(c.ink, 0.65); ctx.lineWidth = 1.5; ctx.beginPath();
          var nSteps = 6;
          for (f = 0; f < floors; f++) {
            var yb = bBot - f * fh, ltr = f % 2 === 0, sx0 = x0 + 4, sx1 = x1 - 4;
            for (var s = 0; s < nSteps; s++) {
              var xa = ltr ? sx0 + (sx1 - sx0) * s / nSteps : sx1 - (sx1 - sx0) * s / nSteps;
              var xb = ltr ? sx0 + (sx1 - sx0) * (s + 1) / nSteps : sx1 - (sx1 - sx0) * (s + 1) / nSteps;
              var ya = yb - fh * s / nSteps, yb2 = yb - fh * (s + 1) / nSteps;
              if (s === 0 && f === 0) ctx.moveTo(xa, ya); else ctx.lineTo(xa, ya);
              ctx.lineTo(xa, yb2); ctx.lineTo(xb, yb2);
            }
          }
          ctx.stroke(); ctx.restore();
          // person on the stairs
          var hNow = frac * floors, fl = Math.min(Math.floor(hNow), floors - 1), inF = hNow - fl, l2r = fl % 2 === 0;
          var px = l2r ? x0 + 4 + (x1 - x0 - 8) * inF : x1 - 4 - (x1 - x0 - 8) * inF, py = bBot - hNow * fh;
          var swing = sim.running && frac < 1 ? Math.sin(now * (k ? 18 : 9)) * 4 : 0;
          ctx.save(); ctx.strokeStyle = cols[k]; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
          ctx.moveTo(px, py - 8); ctx.lineTo(px - 4 + swing, py); ctx.moveTo(px, py - 8); ctx.lineTo(px + 4 - swing, py);
          ctx.moveTo(px, py - 8); ctx.lineTo(px, py - 20); ctx.moveTo(px - 5 - swing, py - 12); ctx.lineTo(px, py - 17); ctx.lineTo(px + 5 + swing, py - 12);
          ctx.stroke(); ctx.restore();
          D.circle(ctx, px, py - 24, 4.5, cols[k]);
        } else {
          // lift shaft, cage and motor
          var sw = Math.min(lw - 24, 60), sx = cx - sw / 2;
          D.roundRect(ctx, sx - 4, bTop - 2, sw + 8, bBot - bTop + 2, 3, D.alpha(c.muted, 0.08), D.alpha(c.muted, 0.5), 1);
          var cageH = Math.min(fh * 0.8, 40), cy = bBot - frac * (bBot - bTop) - cageH;
          cy = Math.max(cy, bTop + 4);
          D.line(ctx, cx, bTop - 10, cx, cy, c.ink, 1.5);
          D.roundRect(ctx, sx, cy, sw, cageH, 4, D.alpha(cols[k], 0.25), cols[k], 2);
          D.circle(ctx, cx, cy + cageH * 0.4, 4.5, cols[k]);
          D.line(ctx, cx, cy + cageH * 0.4 + 4, cx, cy + cageH - 3, cols[k], 2.5);
          D.circle(ctx, cx, bTop - 14, 10, c.surface2, c.ink, 1.5);
          D.text(ctx, 'M', cx, bTop - 14, { color: c.text, size: 10, weight: 700, align: 'center' });
          if (sim.running && frac < 1) {
            ctx.save(); ctx.strokeStyle = c.warning; ctx.lineWidth = 1.5; ctx.beginPath();
            var a0 = now * 8; ctx.arc(cx, bTop - 14, 13, a0, a0 + 1.6); ctx.stroke(); ctx.restore();
          }
        }
        // lane label with time
        var done = frac >= 1, tShow = done ? t[k] : now;
        D.text(ctx, names[k], cx, bBot + 13, { color: cols[k], size: narrow ? 10.5 : 12, weight: 700, align: 'center' });
        D.text(ctx, (done ? 'took ' : '') + M.fmt(tShow, 1) + ' s' + (done ? ' ✓' : ''), cx, bBot + 27, { color: done ? c.text : c.muted, size: narrow ? 10 : 11, weight: 600, align: 'center' });
      }

      // power bars
      var pTop = bBot + 44, pBot = H - (narrow ? 50 : 44), rh = (pBot - pTop) / 3, labW = narrow ? 70 : 100;
      var Pmax = Math.max(P[0], P[1], P[2]);
      D.text(ctx, 'Power P = W ÷ t', 10, pTop - 6, { color: c.muted, size: narrow ? 11 : 12, weight: 600 });
      for (k = 0; k < 3; k++) {
        var yy = pTop + 4 + k * rh, hh = Math.max(8, rh * 0.6), bw0 = 10 + labW, bwMax = Wd - bw0 - (narrow ? 70 : 90);
        var shown = Math.min(1, now / t[k]) >= 1 || sim.time === 0;
        D.text(ctx, names[k], 10, yy + hh / 2, { color: cols[k], size: narrow ? 10.5 : 12, weight: 600 });
        D.roundRect(ctx, bw0, yy, bwMax, hh, 4, D.alpha(c.muted, 0.1));
        D.roundRect(ctx, bw0, yy, Math.max(2, bwMax * P[k] / Pmax), hh, 4, shown ? cols[k] : D.alpha(cols[k], 0.4));
        D.text(ctx, M.fmt(P[k], 0) + ' W', Wd - 10, yy + hh / 2, { color: c.text, size: narrow ? 11 : 12, weight: 700, align: 'right' });
      }

      // commercial unit
      var kwh = p.P / 1000 * 30, bill = kwh * p.rate;
      var line1 = 'Motor ' + M.fmt(p.P / 1000, 2) + ' kW × 1 h a day × 30 days = ' + M.fmt(kwh, 1) + ' kWh (units)';
      var line2 = M.fmt(kwh, 1) + ' units × ₹' + M.fmt(p.rate, 1) + ' = ₹' + M.fmt(bill, 0) + ' a month · one lift uses ' + M.fmt(W / 3.6e6 * 1000, 2) + ' Wh';
      var fs = narrow ? 10.5 : 12;
      D.text(ctx, line1, Wd / 2, H - (narrow ? 32 : 28), { color: c.text, size: fs, weight: 600, align: 'center', fit: Wd });
      D.text(ctx, line2, Wd / 2, H - (narrow ? 14 : 11), { color: c.success, size: fs, weight: 700, align: 'center', fit: Wd });
    }
  });
})();
