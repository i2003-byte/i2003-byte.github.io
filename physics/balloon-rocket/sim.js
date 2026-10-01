/* =====================================================================
   Force and laws of motion · Action and Reaction: Balloon Rocket — sim.js
   ---------------------------------------------------------------------
   A blown-up balloon is taped to a straw that slides on a 5 m string.
   Released, the stretched rubber squeezes air out of the neck backwards
   at speed u (relative to the balloon).
     mass flow   ṁ = ρ A u          (A = area of the neck)
     thrust      F = ṁ u             balloon pushes air back with F,
                                     air pushes balloon forward with F
     balloon     M dv/dt = F − drag − string friction,  M = m₀ + m_air
     air drag    ½ ρ C_d (π r²) v²   (r from the balloon's volume)
   Momentum bookkeeping (ground frame):
     balloon      p_b = M v (forward)
     air thrown   p_a = ∫ ṁ (u − v) dt (backward)
   With the "ideal" switch (no drag, no friction) p_b = p_a exactly:
   the total momentum stays zero.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var RHO = 1.2, U = 30, M0 = 0.005, CD = 0.6, MU_F = 0.012, STRING = 5, R_EMPTY = 0.03;

  function nozR(p) { return parseFloat(p.noz) / 1000; }
  function mdot(p) { var r = nozR(p); return RHO * Math.PI * r * r * U; }
  function thrust(p) { return mdot(p) * U; }
  function radius(mAir) { var vol = mAir / RHO; return Math.max(R_EMPTY, Math.cbrt(3 * vol / (4 * Math.PI))); }

  SimLab.createSim({
    ariaLabel: 'A balloon taped to a straw on a string; air rushes out backwards and the balloon moves forwards, with equal and opposite force arrows on the air and on the balloon',
    mobileAspect: '4 / 3.4',
    playLabel: 'Release',
    params: [
      { id: 'V', label: 'Air blown into the balloon', min: 1, max: 6, step: 0.5, value: 4, unit: 'L',
        presets: [{ label: '1 L', value: 1 }, { label: '3 L', value: 3 }, { label: '6 L', value: 6 }] },
      { id: 'noz', label: 'Size of the opening', type: 'select', value: '5',
        options: [{ value: '3', label: 'Narrow straw (3 mm radius)' }, { value: '5', label: 'Balloon neck (5 mm radius)' }, { value: '7', label: 'Wide tube (7 mm radius)' }] },
      { id: 'ideal', label: 'Ideal: no air drag, no string friction', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'F', label: 'Push on the air = push on the balloon', unit: 'N', digits: 3, key: true },
      { id: 'v', label: 'Balloon speed', unit: 'm/s', digits: 2 },
      { id: 'x', label: 'Distance along the string', unit: 'm', digits: 2 },
      { id: 'air', label: 'Air left in the balloon', unit: 'g', digits: 2 },
      { id: 'pb', label: 'Balloon momentum (forward)', unit: 'g·m/s', digits: 1 },
      { id: 'pa', label: 'Momentum of air thrown back', unit: 'g·m/s', digits: 1 }
    ],
    graph: { title: 'Momentum: balloon forward vs air thrown backward', yLabel: 'g·m/s', xMax: 2,
      series: [{ label: 'balloon (forward)', color: '--sim-1' }, { label: 'air (backward)', color: '--sim-2' }] },

    reset: function (sim) {
      var mAir = RHO * sim.p.V / 1000;
      sim.state = { t: 0, x: 0, v: 0, mAir: mAir, mAir0: mAir, pa: 0, puffs: [], rng: M.rng(7), emit: 0, end: '' };
    },
    update: function (sim, dt) {
      var p = sim.p, st = sim.state, F = 0;
      st.t += dt;
      if (st.mAir > 0) {
        var dm = Math.min(st.mAir, mdot(p) * dt);
        F = dm * U / dt;
        st.mAir -= dm;
        st.pa += dm * (U - st.v);
        st.emit += dt;
        if (st.emit > 0.012) { st.emit = 0; st.puffs.push({ x: st.x, y: (st.rng() - 0.5), age: 0, s: 0.6 + st.rng() * 0.8 }); }
      }
      var mass = M0 + st.mAir, r = radius(st.mAir);
      var drag = p.ideal ? 0 : 0.5 * RHO * CD * Math.PI * r * r * st.v * st.v;
      var fr = p.ideal ? 0 : (st.v > 1e-4 ? MU_F : Math.min(MU_F, F));
      var a = (F - drag - fr) / mass;
      st.v = Math.max(0, st.v + a * dt);
      st.x += st.v * dt;
      st.F = F;
      for (var i = st.puffs.length - 1; i >= 0; i--) { st.puffs[i].age += dt; if (st.puffs[i].age > 0.5) st.puffs.splice(i, 1); }
      if (st.x >= STRING) { st.x = STRING; st.end = 'wall'; }
      else if (st.mAir <= 0 && st.v <= 0) st.end = 'stop';
    },
    finished: function (sim) { return !!sim.state.end || sim.state.t > 12; },
    sample: function (sim) { var st = sim.state; return [(M0 + st.mAir) * st.v * 1000, st.pa * 1000]; },
    status: function (sim) {
      var st = sim.state;
      if (st.end === 'wall') return 'Reached the end of the string after ' + M.fmt(st.t, 2) + ' s';
      if (st.end === 'stop') return 'Stopped after ' + M.fmt(st.x, 2) + ' m';
      if (st.t === 0) return 'Ready · press Release';
      return (st.mAir > 0 ? 'Air rushing out' : 'Out of air, coasting') + ' · t = ' + M.fmt(st.t, 2) + ' s';
    },
    readout: function (sim) {
      var st = sim.state;
      return { F: st.mAir > 0 ? thrust(sim.p) : 0, v: st.v, x: st.x, air: st.mAir * 1000, pb: (M0 + st.mAir) * st.v * 1000, pa: st.pa * 1000 };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, st = sim.state, narrow = W < 560;
      var top = 40, padX = narrow ? 22 : 40;
      var x0 = padX + (narrow ? 70 : 150), x1 = W - padX, sc = (x1 - x0) / STRING;
      var sy = top + (H - top) * 0.26;
      function X(x) { return x0 + x * sc; }
      D.clear(ctx, W, H, c.bg);

      // posts and string
      D.roundRect(ctx, padX - 8, sy - 6, 8, H - sy - 14, 2, c.surface2, c.border, 1);
      D.roundRect(ctx, x1, sy - 6, 8, H - sy - 14, 2, c.surface2, c.border, 1);
      D.line(ctx, padX, sy, x1, sy, c.ink, 1.5);
      for (var k = 0; k <= STRING; k++) D.text(ctx, k + ' m', X(k), sy - 12, { color: c.faint, size: 10, align: 'center' });

      // balloon (drawn 2.5 × bigger than the real scale so it is visible)
      var r = radius(st.mAir), rp = Math.max(narrow ? 12 : 16, r * sc * 2.5);
      var squash = st.mAir > 0 ? 1.25 : 1.1;
      var bx = X(st.x), by = sy + 8 + rp;   // straw at the string, balloon hangs just below
      var cxB = bx;
      // exhaust puffs (behind the neck)
      var neckX = cxB - rp * squash, neckY = by;
      st.puffs.forEach(function (q) {
        var px = X(q.x) - rp * squash - q.age * (narrow ? 180 : 320), py = neckY + q.y * 14 * (1 + q.age * 3);
        D.circle(ctx, px, py, 2 + q.age * 14 * q.s, D.alpha(c.s2, 0.35 * (1 - q.age / 0.5)));
      });
      // straw + tape
      D.roundRect(ctx, cxB - rp * 0.7, sy - 4, rp * 1.4, 8, 3, D.alpha('#e2e8f0', 0.9), D.alpha('#000', 0.3), 1);
      D.line(ctx, cxB - rp * 0.2, sy + 4, cxB - rp * 0.2, by - rp * 0.8, D.alpha('#e2e8f0', 0.7), 3);
      D.line(ctx, cxB + rp * 0.2, sy + 4, cxB + rp * 0.2, by - rp * 0.8, D.alpha('#e2e8f0', 0.7), 3);
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cxB, by, rp * squash, rp, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.fill();
      ctx.strokeStyle = D.alpha('#000', 0.35); ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cxB + rp * 0.35, by - rp * 0.4, rp * 0.25, rp * 0.14, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = D.alpha('#ffffff', 0.45); ctx.fill();
      ctx.restore();
      // neck
      ctx.save(); ctx.fillStyle = '#b91c1c';
      ctx.beginPath(); ctx.moveTo(neckX + 2, neckY - 5); ctx.lineTo(neckX - 9, neckY - 4); ctx.lineTo(neckX - 9, neckY + 4); ctx.lineTo(neckX + 2, neckY + 5); ctx.fill();
      ctx.restore();

      // equal and opposite arrows
      var F = st.mAir > 0 ? thrust(p) : 0;
      var aLen = M.clamp(F * (narrow ? 260 : 420), 0, narrow ? 80 : 150);
      var ay = by + rp + (narrow ? 22 : 28);
      if (F > 0) {
        D.arrow(ctx, neckX - 4, ay, neckX - 4 - aLen, ay, c.s2, 3, 9);
        D.text(ctx, 'action on air', neckX - 4, ay + 14, { color: c.s2, size: 10.5, weight: 700, align: 'right', fit: W });
        D.arrow(ctx, cxB, ay, cxB + aLen, ay, c.s1, 3, 9);
        D.text(ctx, 'reaction on balloon', cxB + 4, ay + 28, { color: c.s1, size: 10.5, weight: 700, fit: W });
        D.text(ctx, M.fmt(F, 3) + ' N each', (neckX + cxB) / 2, ay - 13, { color: c.text, size: 10.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), fit: W });
      }
      if (!p.ideal && st.v > 0.05) {
        var dr = 0.5 * RHO * CD * Math.PI * r * r * st.v * st.v + MU_F;
        var dl = M.clamp(dr * (narrow ? 260 : 420), 8, narrow ? 70 : 140);
        var fx = cxB + rp * squash + 4;
        D.arrow(ctx, fx + dl, by, fx, by, c.danger, 2.5, 8);
        D.text(ctx, narrow ? 'drag' : 'air drag + friction', fx + 4, by + 13, { color: c.danger, size: 10, weight: 700, fit: W });
      }

      // momentum bars
      var barY = H - (narrow ? 40 : 46), bh = narrow ? 10 : 12, mid = W / 2;
      var pb = (M0 + st.mAir) * st.v * 1000, pa = st.pa * 1000;
      var pMax = Math.max(1, (M0 + st.mAir0) * U * 1000 * 0.6), bs = (W / 2 - padX - 10) / pMax;
      D.line(ctx, mid, barY - 16, mid, barY + bh + 16, c.axis, 1.5);
      D.roundRect(ctx, mid - Math.min(pa * bs, W / 2 - padX), barY, Math.min(pa * bs, W / 2 - padX), bh, 3, c.s2);
      D.roundRect(ctx, mid, barY + bh + 4, Math.min(pb * bs, W / 2 - padX), bh, 3, c.s1);
      D.text(ctx, '← air: ' + M.fmt(pa, 1) + ' g·m/s', mid - 6, barY - 9, { color: c.s2, size: 10.5, weight: 700, align: 'right' });
      D.text(ctx, 'balloon: ' + M.fmt(pb, 1) + ' g·m/s →', mid + 6, barY + 2 * bh + 16, { color: c.s1, size: 10.5, weight: 700, fit: W });

      // headline
      var headline, hc = c.s1;
      if (st.t === 0) headline = 'Release the balloon: air goes back, balloon goes forward';
      else if (st.mAir > 0) headline = 'Balloon pushes air back, air pushes balloon forward: equal forces';
      else if (p.ideal) { headline = 'Out of air: with no drag it keeps moving (first law)'; hc = c.success; }
      else { headline = 'Out of air: drag and friction slow it down'; hc = c.warning; }
      var hs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(headline).width > W - 30) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, headline, W / 2, 18, { color: c.bg, bg: hc, size: hs, weight: 700, align: 'center', pad: 5, fit: W });
      D.text(ctx, 'Balloon drawn larger than scale', W - padX, 42, { color: c.faint, size: 10, align: 'right' });
    }
  });
})();
