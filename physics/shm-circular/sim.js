/* =====================================================================
   Oscillations · SHM and Uniform Circular Motion — sim.js
   ---------------------------------------------------------------------
   A point P goes round a circle of radius A at a steady angular speed
   ω = 2π/T, starting at angle φ. Its shadow on the horizontal diameter
   moves with simple harmonic motion:
     θ = ωt + φ,  x = A cos θ,  v = −Aω sin θ,  a = −Aω² cos θ = −ω² x
   P's velocity (Aω, along the tangent) and centripetal acceleration
   (Aω², towards the centre) project onto the diameter to give the
   shadow's v and a. A block on a spring below is drawn in step with the
   shadow, and a paper strip under it records x against time.
   The graph shows x/A, v/(Aω) and a/(Aω²) so all three fit together.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  function geo(sim) {
    var W = sim.width, H = sim.height, R = Math.min(H * 0.21, W * 0.3, 150);
    var cx = W / 2, cy = 30 + R + 6, track = cy + R + 46, strip = track + 22;
    return { W: W, H: H, R: R, cx: cx, cy: cy, track: track, strip: strip };
  }
  function kin(sim, t) {
    var p = sim.p, w = 2 * Math.PI / p.T, th = w * t + M.rad(p.phi), A = p.A / 100;
    return { w: w, th: th, x: A * Math.cos(th), v: -A * w * Math.sin(th), a: -A * w * w * Math.cos(th), A: A };
  }

  SimLab.createSim({
    ariaLabel: 'A point moving round a circle with its shadow on the diameter moving back and forth in simple harmonic motion, a block on a spring in step with it, and a paper strip recording its position',
    autoplay: true,
    mobileAspect: '3 / 4',
    params: [
      { id: 'A', label: 'Radius = amplitude A', min: 2, max: 20, step: 1, value: 10, unit: 'cm' },
      { id: 'T', label: 'Time for one turn T', min: 0.5, max: 6, step: 0.1, value: 3, unit: 's' },
      { id: 'phi', label: 'Starting angle (phase) φ', min: 0, max: 360, step: 15, value: 0, unit: '°' },
      { id: 'vec', label: 'Show velocity and acceleration arrows', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'th', label: 'Angle θ = ωt + φ', unit: '°', digits: 0 },
      { id: 'x', label: 'x = A cos θ', unit: 'cm', digits: 1, key: true },
      { id: 'v', label: 'v = −Aω sin θ', unit: 'cm/s', digits: 1 },
      { id: 'a', label: 'a = −ω²x', unit: 'cm/s²', digits: 1 },
      { id: 'w', label: 'ω = 2π/T', unit: 'rad/s', digits: 2 },
      { id: 'f', label: 'Frequency', unit: 'Hz', digits: 2 }
    ],
    graph: { title: 'Shadow’s x, v and a (each divided by its largest value)', yLabel: 'fraction of max', window: 8, yMin: -1.15, yMax: 1.15,
      series: [{ label: 'x ÷ A' }, { label: 'v ÷ Aω' }, { label: 'a ÷ Aω²' }] },
    onParam: function (sim, id) { return id === 'vec'; },
    reset: function (sim) { sim.state = {}; },
    update: function () {},
    sample: function (sim) { var k = kin(sim, sim.time); return [k.x / k.A, k.v / (k.A * k.w), k.a / (k.A * k.w * k.w)]; },
    readout: function (sim) {
      var k = kin(sim, sim.time), deg = ((M.deg(k.th) % 360) + 360) % 360;
      return { th: deg, x: k.x * 100, v: k.v * 100, a: k.a * 100, w: k.w, f: 1 / sim.p.T };
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, g = geo(sim), W = g.W, H = g.H, p = sim.p, k = kin(sim, sim.time), small = W < 560;
      D.clear(ctx, W, H, c.bg);
      var R = g.R, cx = g.cx, cy = g.cy, px = cx + R * Math.cos(k.th), py = cy - R * Math.sin(k.th), sx = px;
      D.text(ctx, small ? 'Shadow of circular motion = SHM' : 'The shadow of a point going round a circle moves in SHM', W / 2, 14, { color: c.bg, bg: c.s3, size: small ? 10.5 : 12.5, weight: 700, align: 'center', pad: 4, fit: W });

      // reference circle, diameter and angle
      D.circle(ctx, cx, cy, R, null, D.alpha(c.muted, 0.6), 1.5);
      D.line(ctx, cx - R - 14, cy, cx + R + 14, cy, c.axis, 1.5);
      D.line(ctx, cx, cy - R - 6, cx, cy + R + 6, D.alpha(c.axis, 0.5), 1, [3, 4]);
      D.line(ctx, cx, cy, px, py, c.s1, 2);
      var deg = ((k.th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      ctx.save(); ctx.strokeStyle = c.s3; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, Math.min(26, R * 0.3), 0, -deg, true); ctx.stroke(); ctx.restore();
      D.text(ctx, 'θ', cx + Math.min(34, R * 0.4) * Math.cos(deg / 2), cy - Math.min(34, R * 0.4) * Math.sin(deg / 2), { color: c.s3, size: 12, weight: 700, align: 'center' });
      D.text(ctx, 'A', cx + R * 0.5 * Math.cos(k.th) - 10 * Math.sin(k.th), cy - R * 0.5 * Math.sin(k.th) - 10 * Math.cos(k.th), { color: c.s1, size: 12, weight: 700, align: 'center' });

      // projection line from P down to the block
      D.line(ctx, px, py, sx, g.track - 4, D.alpha(c.text, 0.35), 1, [4, 4]);
      D.circle(ctx, sx, cy, 5, c.accent, c.ink, 1);

      // vectors at P and at the shadow
      if (p.vec) {
        var vs = R * 0.55, as = R * 0.45, vx = -Math.sin(k.th), vy = -Math.cos(k.th);
        D.arrow(ctx, px, py, px + vx * vs, py + vy * vs, c.s2, 2.5, 9);
        D.arrow(ctx, px, py, px - Math.cos(k.th) * as, py + Math.sin(k.th) * as, c.danger, 2.5, 9);
        var vsh = vx * vs, ash = -Math.cos(k.th) * as;
        if (Math.abs(vsh) > 3) D.arrow(ctx, sx, cy + 12, sx + vsh, cy + 12, c.s2, 2.5, 8);
        if (Math.abs(ash) > 3) D.arrow(ctx, sx, cy + 22, sx + ash, cy + 22, c.danger, 2.5, 8);
        D.text(ctx, '→ v', small ? 8 : W / 2 - R - 120, small ? H - 14 : cy - 10, { color: c.s2, size: 11, weight: 700 });
        D.text(ctx, '→ a', small ? 46 : W / 2 - R - 120, small ? H - 14 : cy + 8, { color: c.danger, size: 11, weight: 700 });
      }
      D.circle(ctx, px, py, 8, c.s1, c.ink, 1.5);
      D.text(ctx, 'P', px + 12 * Math.cos(k.th) + 4, py - 12 * Math.sin(k.th) - 4, { color: c.s1, size: 12, weight: 700, align: 'center' });

      // block on a spring along the track, in step with the shadow
      var ty = g.track, sd = 26, wallX = cx - R - 56;
      D.line(ctx, wallX, ty, cx + R + 40, ty, c.ink, 2);
      D.roundRect(ctx, wallX - 8, ty - 40, 8, 40, 2, c.muted);
      var x1 = sx - sd / 2, coils = 9, span = x1 - wallX - 8;
      ctx.save(); ctx.strokeStyle = c.light ? '#0f766e' : '#5eead4'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(wallX, ty - sd / 2); ctx.lineTo(wallX + 4, ty - sd / 2);
      for (var n = 0; n < coils * 2; n++) ctx.lineTo(wallX + 4 + span * (n + 0.5) / (coils * 2), ty - sd / 2 + (n % 2 ? 6 : -6));
      ctx.lineTo(x1, ty - sd / 2); ctx.stroke(); ctx.restore();
      D.roundRect(ctx, sx - sd / 2, ty - sd, sd, sd, 4, c.light ? '#ea580c' : '#fb923c');
      D.line(ctx, cx, ty + 2, cx, ty + 10, c.s3, 2);
      D.text(ctx, 'x = 0', cx, ty + 16, { color: c.s3, size: 10, align: 'center' });

      // paper strip: x recorded against time, newest at the top, scrolling down
      var top = g.strip + 12, bot = H - (small && p.vec ? 26 : 10);
      if (bot - top > 30) {
        var left = cx - R - 8, right = cx + R + 8, secs = 1.6 * p.T, pps = (bot - top) / secs;
        D.roundRect(ctx, left, top, right - left, bot - top, 4, D.alpha(c.muted, 0.08), D.alpha(c.muted, 0.3), 1);
        D.line(ctx, cx, top, cx, bot, D.alpha(c.s3, 0.5), 1, [3, 4]);
        ctx.save(); ctx.beginPath(); ctx.rect(left, top, right - left, bot - top); ctx.clip();
        ctx.strokeStyle = c.accent; ctx.lineWidth = 2; ctx.beginPath();
        for (var yy = 0; yy <= bot - top; yy += 2) {
          var t = sim.time - yy / pps; if (t < 0) break;
          var xx = cx + R * Math.cos(kin(sim, t).th);
          if (yy === 0) ctx.moveTo(xx, top + yy); else ctx.lineTo(xx, top + yy);
        }
        ctx.stroke(); ctx.restore();
        D.circle(ctx, sx, top, 3.5, c.accent);
        D.text(ctx, 'paper strip moves down ↓  (x against time)', cx, bot - 9, { color: c.faint, size: 10, align: 'center', bg: D.alpha(c.bg, 0.75), pad: 2, fit: W });
      }
    }
  });
})();
