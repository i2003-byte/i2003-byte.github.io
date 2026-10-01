/* =====================================================================
   Work, energy and power · Work Done by a Force — sim.js
   ---------------------------------------------------------------------
   A box is moved along the floor at a steady 1 m/s through a distance s.
   One force F acts on it at an angle θ to the direction of motion.
   Only the part of the force along the motion does work:
     W = F s cos θ        (1 J = 1 N × 1 m)
   θ < 90° → positive work, θ = 90° → zero work, θ > 90° → negative work.
   The force–displacement chart shades the rectangle F cos θ × s, so
   work is the area under the force–displacement graph.
   We only look at the work done by this one force; how the box is kept
   moving at a steady speed is not part of the model.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SPEED = 1, xMaxV = 5;

  function along(p) { var v = p.F * Math.cos(M.rad(p.th)); return Math.abs(v) < 1e-9 ? 0 : v; }
  function across(p) { return p.F * Math.sin(M.rad(p.th)); }
  function preset(sim, o) { Object.keys(o).forEach(function (k) { sim.setParam(k, o[k]); }); sim.reset(); sim.play(); }

  SimLab.createSim({
    ariaLabel: 'A box moving along the floor with a force acting on it at an angle; the force is split into parts along and across the motion, and a force–displacement chart shades the work done',
    mobileAspect: '3 / 4',
    params: [
      { id: 'F', label: 'Force F', min: 0, max: 250, step: 5, value: 40, unit: 'N',
        presets: [{ label: '20 N', value: 20 }, { label: '40 N', value: 40 }, { label: '100 N', value: 100 }] },
      { id: 'th', label: 'Angle θ between the force and the motion', min: 0, max: 180, step: 5, value: 30, unit: '°',
        presets: [{ label: '0°', value: 0 }, { label: '60°', value: 60 }, { label: '90°', value: 90 }, { label: '180°', value: 180 }] },
      { id: 's', label: 'Distance moved s', min: 1, max: 10, step: 0.5, value: 5, unit: 'm' }
    ],
    buttonsTitle: 'Try a situation',
    buttons: [
      { label: 'Pull a trolley bag straight along', onClick: function (sim) { preset(sim, { F: 40, th: 0, s: 5 }); } },
      { label: 'Pull by a slanted strap (60°)', onClick: function (sim) { preset(sim, { F: 40, th: 60, s: 5 }); } },
      { label: 'Porter holding up a 200 N load, walking', onClick: function (sim) { preset(sim, { F: 200, th: 90, s: 5 }); } },
      { label: 'Friction on a sliding box (180°)', onClick: function (sim) { preset(sim, { F: 30, th: 180, s: 4 }); } }
    ],
    readouts: [
      { id: 'W', label: 'Work done so far W = F cos θ × distance', unit: 'J', digits: 1, key: true },
      { id: 'Wf', label: 'Work over the whole distance s', unit: 'J', digits: 1 },
      { id: 'Fa', label: 'Part along the motion F cos θ', unit: 'N', digits: 1 },
      { id: 'Fp', label: 'Part across the motion F sin θ', unit: 'N', digits: 1 },
      { id: 'cos', label: 'cos θ', digits: 3 },
      { id: 'kind', label: 'Kind of work' }
    ],
    graph: { title: 'Work done as the box moves', yLabel: 'W (J)', xMax: function () { return xMaxV; },
      series: [{ label: 'W (J)', color: '--sim-1' }] },

    reset: function (sim) { xMaxV = sim.p.s / SPEED; sim.state = { x: 0, done: false }; },
    update: function (sim, dt) {
      var st = sim.state;
      st.x = Math.min(sim.p.s, st.x + SPEED * dt);
      if (st.x >= sim.p.s - 1e-9) st.done = true;
    },
    finished: function (sim) { return sim.state.done; },
    sample: function (sim) { return [along(sim.p) * sim.state.x]; },
    status: function (sim) {
      var st = sim.state;
      if (st.done) return 'Moved ' + M.fmt(sim.p.s, 1) + ' m · W = ' + M.fmt(along(sim.p) * sim.p.s, 1) + ' J';
      if (st.x === 0 && !sim.running) return 'Press Play to move the box';
      return (sim.running ? 'Moving' : 'Paused') + ' · ' + M.fmt(st.x, 2) + ' m so far';
    },
    readout: function (sim) {
      var p = sim.p, a = along(p), kind = a > 0 ? 'Positive: force helps the motion' : a < 0 ? 'Negative: force opposes the motion' : (p.F === 0 ? 'Zero: no force' : 'Zero: force ⟂ motion');
      return { W: a * sim.state.x, Wf: a * p.s, Fa: a, Fp: across(p), cos: Math.abs(Math.cos(M.rad(p.th))) < 1e-9 ? 0 : Math.cos(M.rad(p.th)), kind: kind };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, st = sim.state, narrow = W < 560;
      D.clear(ctx, W, H, c.bg);
      var a = along(p), b = across(p), th = M.rad(p.th);
      var sceneB = Math.round(H * (narrow ? 0.5 : 0.52));
      var floorY = sceneB - 44, boxW = narrow ? 50 : 70, boxH = narrow ? 38 : 50;
      var x0 = narrow ? 20 : 40, x1 = W - (narrow ? 20 : 40) - boxW;
      var sc = (x1 - x0) / p.s;
      function X(x) { return x0 + x * sc; }

      // floor and distance marks
      D.line(ctx, 8, floorY, W - 8, floorY, c.ink, 2.5);
      var mstep = p.s <= 3 ? 0.5 : 1;
      for (var m = 0; m <= p.s + 1e-9; m += mstep) {
        D.line(ctx, X(m) + boxW / 2, floorY + 2, X(m) + boxW / 2, floorY + 7, c.faint, 1);
        if (Math.abs(m - Math.round(m)) < 1e-9 && (!narrow || p.s <= 6 || m % 2 === 0)) D.text(ctx, m + ' m', X(m) + boxW / 2, floorY + 16, { color: c.faint, size: 10, align: 'center' });
      }
      // start and end ghosts
      D.roundRect(ctx, X(p.s), floorY - boxH, boxW, boxH, 5, null, D.alpha(c.muted, 0.5), 1.2);
      D.arrow(ctx, X(0) + boxW / 2, floorY + 30, X(st.x) + boxW / 2, floorY + 30, c.muted, 1.5, 7);
      D.text(ctx, 'moved ' + M.fmt(st.x, 1) + ' m →', (X(0) + X(st.x)) / 2 + boxW / 2, floorY + 41, { color: c.muted, size: 10.5, align: 'center', fit: W });

      // the box
      var bx = X(st.x), by = floorY - boxH;
      D.roundRect(ctx, bx, by, boxW, boxH, 5, '#b45309', D.alpha('#000', 0.4), 1.2);
      D.line(ctx, bx + 6, by + boxH / 2, bx + boxW - 6, by + boxH / 2, D.alpha('#000', 0.25), 2);

      // force arrow from the box centre, plus its two parts
      var cx = bx + boxW / 2, cy = by + boxH / 2;
      var maxLen = Math.min(narrow ? 110 : 150, sceneB - 90), minLen = boxW * 0.6 + 14, Lf = p.F > 0 ? minLen + Math.max(0, maxLen - minLen) * p.F / 250 : 0;
      var fx = cx + Lf * Math.cos(th), fy = cy - Lf * Math.sin(th);
      if (p.F > 0) {
        var ac = a > 0 ? c.success : a < 0 ? c.danger : c.muted;
        if (Math.abs(a) > 0.01) D.arrow(ctx, cx, cy, cx + Lf * Math.cos(th), cy, ac, 3, 9);
        if (Math.abs(b) > 0.01) {
          D.line(ctx, fx, cy, fx, fy, D.alpha(c.muted, 0.8), 1.2, [4, 3]);
          D.line(ctx, cx, cy, cx, fy, D.alpha(c.muted, 0.5), 1.2, [4, 3]);
        }
        D.arrow(ctx, cx, cy, fx, fy, c.s2, 3.5, 11);
        // angle arc
        if (p.th > 0 && p.th < 180) {
          ctx.save(); ctx.strokeStyle = c.warning; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 20, -th, 0); ctx.stroke(); ctx.restore();
          D.text(ctx, 'θ = ' + p.th + '°', cx + 24 * Math.cos(th / 2) + 4, cy - 24 * Math.sin(th / 2) - 4, { color: c.warning, size: 11, weight: 700, bg: D.alpha(c.bg, 0.8), fit: W });
        }
        D.text(ctx, 'F = ' + p.F + ' N', fx + (Math.cos(th) >= 0 ? 6 : -6), fy - 8, { color: c.s2, size: 11.5, weight: 700, align: Math.cos(th) >= 0 ? 'left' : 'right', bg: D.alpha(c.bg, 0.8), fit: W });
        if (Math.abs(a) > 0.01) { var ex = cx + Lf * Math.cos(th); D.text(ctx, 'F cos θ = ' + M.fmt(a, 1) + ' N', ex + (a > 0 ? 8 : -8), cy + 12, { color: ac, size: 10.5, weight: 700, align: a > 0 ? 'left' : 'right', bg: D.alpha(c.bg, 0.85), fit: W }); }
      }

      // headline
      var head, hc = c.s1, Wn = a * st.x;
      if (p.F === 0) { head = 'No force, no work'; hc = c.muted; }
      else if (a === 0) { head = 'θ = 90°: the force is across the motion, so W = 0'; hc = c.warning; }
      else head = 'W = F s cos θ = ' + p.F + ' × ' + M.fmt(st.x, 1) + ' × ' + M.fmt(Math.cos(th), 2) + ' = ' + M.fmt(Wn, 1) + ' J';
      var hs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(head).width > W - 30) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, head, W / 2, 14, { color: c.bg, bg: hc, size: hs, weight: 700, align: 'center', pad: 4, fit: W });

      // ---- force along the motion vs displacement: area = work ----
      var gx0 = narrow ? 46 : 64, gx1 = W - (narrow ? 14 : 30), gy0 = sceneB + 40, gy1 = H - 26, gmid = (gy0 + gy1) / 2;
      var Fm = Math.max(10, p.F);
      function GX(x) { return gx0 + x / p.s * (gx1 - gx0); }
      function GY(f) { return gmid - f / Fm * (gmid - gy0); }
      D.line(ctx, 8, sceneB + 4, W - 8, sceneB + 4, c.grid, 1);
      D.text(ctx, narrow ? 'F cos θ against distance: shaded area = work' : 'Force along the motion against distance: the shaded area is the work', 10, sceneB + 16, { color: c.muted, size: narrow ? 10.5 : 12, weight: 600, fit: W });
      D.line(ctx, gx0, gy0, gx0, gy1, c.axis, 1.2); D.line(ctx, gx0, gmid, gx1, gmid, c.axis, 1.2);
      [Fm, Fm / 2, 0, -Fm / 2, -Fm].forEach(function (f) {
        D.line(ctx, gx0 - 3, GY(f), gx0, GY(f), c.axis, 1);
        D.text(ctx, M.fmt(f, 0), gx0 - 6, GY(f), { color: c.faint, size: 10, align: 'right' });
      });
      D.text(ctx, 'N', gx0 - 6, gy0 - 12, { color: c.faint, size: 10, align: 'right' });
      for (var gm = 0; gm <= p.s + 1e-9; gm += (p.s <= 3 ? 0.5 : p.s <= 6 ? 1 : 2)) D.text(ctx, gm + '', GX(gm), gmid + (a < 0 ? -10 : 12), { color: c.faint, size: 10, align: 'center' });
      D.text(ctx, 's (m)', gx1, gmid + (a < 0 ? -22 : 24), { color: c.faint, size: 10, align: 'right' });
      var col = a > 0 ? c.success : a < 0 ? c.danger : c.muted;
      if (a !== 0) {
        ctx.fillStyle = D.alpha(col, 0.28); ctx.fillRect(GX(0), Math.min(GY(a), gmid), GX(st.x) - GX(0), Math.abs(GY(a) - gmid));
        D.line(ctx, GX(0), GY(a), GX(p.s), GY(a), D.alpha(col, 0.5), 1.5, [5, 4]);
        D.line(ctx, GX(0), GY(a), GX(st.x), GY(a), col, 2.5);
        if (st.x > 0.05) D.text(ctx, (a > 0 ? '+' : '−') + M.fmt(Math.abs(Wn), 1) + ' J', (GX(0) + GX(st.x)) / 2, (GY(a) + gmid) / 2, { color: c.text, size: narrow ? 11 : 12.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.75), fit: W });
      } else {
        D.line(ctx, GX(0), gmid, GX(p.s), gmid, col, 2.5);
        D.text(ctx, 'F cos θ = 0, so there is no area: W = 0', (gx0 + gx1) / 2, gmid - 14, { color: c.muted, size: 11, weight: 600, align: 'center', fit: W });
      }
    }
  });
})();
