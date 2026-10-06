/* =====================================================================
   Electricity & Magnetism · Electric Dipole in a Uniform Field — sim.js
   ---------------------------------------------------------------------
   Charges +q and −q at the ends of a light rod of length 2a, pivoted at
   its middle, in a uniform field E pointing to the right. θ is the
   angle from E to the dipole moment p (p = q·2a, from −q to +q),
   positive anticlockwise.
     forces  +qE and −qE: equal and opposite → net force 0
     torque  τ = p E sin θ (turns p towards E)
     energy  U = −p E cos θ (lowest at θ = 0, highest at θ = 180°)
   Each end carries a small 1 g ball, so the moment of inertia is
   I = 2 m a². Motion: I θ'' = −p E sin θ − b θ' (RK4), where the drag
   b = 2 ζ √(I p E) gives a damping ratio ζ. For small swings
   T = 2π √(I ÷ pE).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var MASS = 0.001, ZETA = { none: 0, light: 0.04, heavy: 0.35 };
  var drag = false;

  function phys(p) {
    var a = p.d / 200, pm = p.q * 1e-9 * (p.d / 100), E = p.E * 1e3, I = 2 * MASS * a * a;
    return { a: a, p: pm, E: E, pE: pm * E, I: I, b: 2 * ZETA[p.damp] * Math.sqrt(I * pm * E) };
  }
  function forceLen(p, small) { return (small ? 26 : 36) + (small ? 40 : 60) * p.E / 200; }
  function wrap(t) { while (t > Math.PI) t -= 2 * Math.PI; while (t <= -Math.PI) t += 2 * Math.PI; return t; }
  function layout(sim) {
    var W = sim.width, H = sim.height, uh = H < 380 ? 0 : Math.min(H * 0.24, 150), sceneH = H - uh;
    var R = Math.min(W * 0.36, sceneH * 0.36) * (0.45 + 0.55 * sim.p.d / 10), small = W < 560;
    R = Math.min(R, W / 2 - (small ? 8 : 12) - forceLen(sim.p, small) - 14);
    return { cx: W / 2, cy: 30 + (sceneH - 30) / 2, R: R, sceneH: sceneH, uh: uh };
  }

  SimLab.createSim({
    ariaLabel: 'An electric dipole on a pivot between two charged plates, turning in a uniform electric field, with force and torque arrows and a curve of potential energy against angle',
    mobileAspect: '4 / 5',
    params: [
      { id: 'q', label: 'Charge at each end q', min: 1, max: 50, step: 1, value: 20, unit: 'nC' },
      { id: 'd', label: 'Separation 2a', min: 1, max: 10, step: 0.5, value: 4, unit: 'cm' },
      { id: 'E', label: 'Field strength E', min: 5, max: 200, step: 5, value: 50, unit: 'kN/C' },
      { id: 'theta0', label: 'Starting angle θ (from E to p)', min: -180, max: 180, step: 1, value: 60, unit: '°', presets: [{ label: '30°', value: 30 }, { label: '90°', value: 90 }, { label: '179°', value: 179 }] },
      { id: 'damp', label: 'Air drag', type: 'select', value: 'light', options: [
        { value: 'none', label: 'None (swings for ever)' }, { value: 'light', label: 'Light' }, { value: 'heavy', label: 'Heavy (settles fast)' }] }
    ],
    readouts: [
      { id: 'th', label: 'Angle θ', unit: '°', digits: 1, key: true },
      { id: 'tau', label: 'Torque τ = pE sin θ', unit: 'μN·m', digits: 2, key: true },
      { id: 'U', label: 'Potential energy U = −pE cos θ', unit: 'μJ', digits: 2 },
      { id: 'p', label: 'Dipole moment p = q × 2a', unit: '×10⁻¹⁰ C·m', digits: 2 },
      { id: 'Fnet', label: 'Net force on the dipole', unit: 'N', digits: 0 },
      { id: 'T', label: 'Small-swing period 2π√(I/pE)', unit: 's', digits: 2 }
    ],
    graph: { title: 'Angle θ vs time', yLabel: 'θ (°)', series: [{ label: 'θ (degrees)' }], window: 10, yMin: -180, yMax: 180 },

    reset: function (sim) { sim.state = { th: M.rad(sim.p.theta0), w: 0 }; },
    update: function (sim, dt) {
      if (drag) return;
      var k = phys(sim.p), s = sim.state;
      var y = M.rk4([s.th, s.w], function (v) { return [v[1], (-k.pE * Math.sin(v[0]) - k.b * v[1]) / k.I]; }, dt);
      s.th = wrap(y[0]); s.w = y[1];
    },
    sample: function (sim) { return [M.deg(sim.state.th)]; },
    readout: function (sim) {
      var k = phys(sim.p), th = sim.state.th;
      return { th: M.deg(th), tau: k.pE * Math.sin(th) * 1e6, U: -k.pE * Math.cos(th) * 1e6, p: k.p * 1e10, Fnet: 0, T: 2 * Math.PI * Math.sqrt(k.I / k.pE) };
    },
    status: function (sim) {
      var d = Math.abs(M.deg(sim.state.th)), w = Math.abs(sim.state.w);
      var where = d < 3 && w < 0.2 ? 'at rest along E: stable equilibrium' : d > 177 && w < 0.2 ? 'balanced against E: unstable equilibrium' : 'turning towards E';
      return (sim.running ? 'Running' : 'Paused') + ' · ' + where;
    },
    buttons: [
      { label: 'Nudge from 180° (unstable)', onClick: function (sim) { sim.setParam('theta0', 179, true); sim.play(); } },
      { label: 'Start at 90° (biggest torque)', onClick: function (sim) { sim.setParam('theta0', 90, true); sim.play(); } }
    ],
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim), th = sim.state.th, ex = Math.cos(th) * L.R, ey = -Math.sin(th) * L.R;
        drag = Math.hypot(x - L.cx - ex, y - L.cy - ey) < 34 || Math.hypot(x - L.cx + ex, y - L.cy + ey) < 34;
        if (drag) { sim.pause(); return true; }
        return false;
      },
      move: function (sim, x, y) {
        if (!drag) return;
        var L = layout(sim), th = sim.state.th, ex = Math.cos(th), a = Math.atan2(-(y - L.cy), x - L.cx);
        // keep whichever end was grabbed: if it is nearer the − end, turn by π
        var plus = { x: L.cx + ex * L.R, y: L.cy - Math.sin(th) * L.R };
        var minus = { x: L.cx - ex * L.R, y: L.cy + Math.sin(th) * L.R };
        if (Math.hypot(x - minus.x, y - minus.y) < Math.hypot(x - plus.x, y - plus.y)) a += Math.PI;
        sim.state.th = wrap(a); sim.state.w = 0;
        sim.setParam('theta0', Math.round(M.deg(sim.state.th)));
        if (sim.graph) sim.graph.clear();
        sim.redraw();
      },
      up: function () { drag = false; },
      hover: function (sim, x, y) {
        var L = layout(sim), th = sim.state.th, ex = Math.cos(th) * L.R, ey = -Math.sin(th) * L.R;
        return Math.hypot(x - L.cx - ex, y - L.cy - ey) < 34 || Math.hypot(x - L.cx + ex, y - L.cy + ey) < 34;
      }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, W = sim.width, H = sim.height, p = sim.p, small = W < 560, fs = small ? 10 : 12;
      var L = layout(sim), k = phys(p), th = sim.state.th;
      D.clear(ctx, W, H, c.bg);

      // plates and uniform field lines (more lines for a stronger field)
      var pw = small ? 8 : 12, top = 30, bot = L.sceneH - 8;
      D.roundRect(ctx, 2, top, pw, bot - top, 3, '#ef4444'); D.roundRect(ctx, W - 2 - pw, top, pw, bot - top, 3, '#3b82f6');
      for (var yy = top + 12; yy < bot - 4; yy += 18) {
        D.text(ctx, '+', 2 + pw / 2, yy, { color: '#fff', size: 11, weight: 800, align: 'center' });
        D.text(ctx, '−', W - 2 - pw / 2, yy, { color: '#fff', size: 11, weight: 800, align: 'center' });
      }
      var n = Math.round(3 + p.E / 25), gap = (bot - top) / (n + 1), lc = D.alpha(c.light ? '#7c3aed' : '#c4b5fd', 0.55);
      for (var i = 1; i <= n; i++) {
        var ly = top + i * gap; D.line(ctx, pw + 6, ly, W - pw - 6, ly, lc, 1.2);
        for (var ax = pw + 40; ax < W - pw - 20; ax += small ? 90 : 150) D.arrow(ctx, ax - 5, ly, ax + 4, ly, lc, 1.2, 7);
      }
      D.text(ctx, 'Uniform field E = ' + p.E + ' kN/C →', W / 2, 14, { color: c.bg, bg: c.s3, size: small ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: W });

      // dipole
      var ux = Math.cos(th), uy = -Math.sin(th), P = { x: L.cx + ux * L.R, y: L.cy + uy * L.R }, Q = { x: L.cx - ux * L.R, y: L.cy - uy * L.R };
      D.line(ctx, L.cx - 34, L.cy, L.cx + L.R + 30, L.cy, c.faint, 1, [4, 4]); // reference along E
      // angle arc
      var ar = Math.min(34, L.R * 0.6);
      ctx.save(); ctx.strokeStyle = c.s2; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(L.cx, L.cy, ar, 0, -th, th > 0); ctx.stroke(); ctx.restore();
      D.text(ctx, 'θ', L.cx + Math.cos(-th / 2) * (ar + 10), L.cy + Math.sin(-th / 2) * (ar + 10), { color: c.s2, size: fs + 1, weight: 800, align: 'center' });
      D.line(ctx, Q.x, Q.y, P.x, P.y, c.light ? '#475569' : '#cbd5e1', 4);
      D.arrow(ctx, L.cx - ux * L.R * 0.45, L.cy - uy * L.R * 0.45, L.cx + ux * L.R * 0.55, L.cy + uy * L.R * 0.55, c.s1, 2.5, 9);
      D.text(ctx, 'p', L.cx + ux * L.R * 0.55 + uy * 13, L.cy + uy * L.R * 0.55 - ux * 13, { color: c.s1, size: fs + 1, weight: 800, align: 'center' });
      D.circle(ctx, L.cx, L.cy, 5, c.ink);

      // forces qE on each end (same length; scale with E)
      var FL = forceLen(p, small);
      D.arrow(ctx, P.x, P.y, P.x + FL, P.y, c.warning, 3, 10);
      D.arrow(ctx, Q.x, Q.y, Q.x - FL, Q.y, c.warning, 3, 10);
      D.text(ctx, '+qE', P.x + FL * 0.6, P.y - 13, { color: c.warning, size: fs, weight: 700, align: 'center', fit: W });
      D.text(ctx, '−qE', Q.x - FL * 0.6, Q.y - 13, { color: c.warning, size: fs, weight: 700, align: 'center', fit: W });
      var r = small ? 11 : 13;
      D.circle(ctx, P.x, P.y, r, '#ef4444', c.light ? '#1e293b' : '#fff', 1.5); D.text(ctx, '+', P.x, P.y + 1, { color: '#fff', size: 16, weight: 800, align: 'center' });
      D.circle(ctx, Q.x, Q.y, r, '#3b82f6', c.light ? '#1e293b' : '#fff', 1.5); D.text(ctx, '−', Q.x, Q.y + 1, { color: '#fff', size: 16, weight: 800, align: 'center' });

      // torque: curved arrow round the pivot, size ∝ |sin θ|
      var s = Math.sin(th);
      if (Math.abs(s) > 0.03) {
        var tr = Math.min(L.R * 0.55 + 22, L.R - 14), span = 0.3 + 0.7 * Math.abs(s), mid = -th + Math.PI / 2, dir = s > 0 ? 1 : -1; // turns clockwise on screen when θ > 0
        var a0 = mid - dir * span / 2, a1 = mid + dir * span / 2;
        ctx.save(); ctx.strokeStyle = c.danger; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(L.cx, L.cy, tr, a0, a1, dir < 0); ctx.stroke(); ctx.restore();
        var ex2 = L.cx + Math.cos(a1) * tr, ey2 = L.cy + Math.sin(a1) * tr, tx = -Math.sin(a1) * dir, ty = Math.cos(a1) * dir;
        D.arrow(ctx, ex2 - tx * 8, ey2 - ty * 8, ex2 + tx * 2, ey2 + ty * 2, c.danger, 2.5, 9);
        D.text(ctx, 'τ', L.cx + Math.cos(mid) * (tr + 14), L.cy + Math.sin(mid) * (tr + 14), { color: c.danger, size: fs + 2, weight: 800, align: 'center', fit: W });
      }
      if (!sim.running && sim.time === 0) D.text(ctx, 'drag an end to turn it, then press Play', W / 2, L.sceneH - 18, { color: c.muted, size: fs - 0.5, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 3, fit: W });

      // potential energy curve U(θ) = −pE cos θ
      if (L.uh) {
        var gx0 = small ? 36 : 70, gx1 = W - (small ? 14 : 40), gy0 = L.sceneH + 14, gy1 = H - 18, gm = (gy0 + gy1) / 2, ga = (gy1 - gy0) / 2 - 2;
        function GX(d) { return gx0 + (d + 180) / 360 * (gx1 - gx0); }
        D.line(ctx, gx0, gm, gx1, gm, c.axis, 1); D.line(ctx, gx0, gy0 - 4, gx0, gy1, c.axis, 1);
        D.curve(ctx, function (x) { var d = (x - gx0) / (gx1 - gx0) * 360 - 180; return gm + Math.cos(M.rad(d)) * ga; }, gx0, gx1, c.s3, 2, 2);
        [-180, -90, 0, 90, 180].forEach(function (d) { D.text(ctx, d + '°', GX(d), gy1 + 9, { color: c.muted, size: 9, align: 'center', fit: W }); });
        D.text(ctx, 'U', gx0 - 6, gy0 + 2, { color: c.muted, size: 10, weight: 700, align: 'right' });
        D.text(ctx, 'stable (U lowest)', GX(0), gy1 - 10, { color: c.success, size: fs - 1.5, weight: 600, align: 'center', fit: W });
        D.text(ctx, 'unstable (U highest)', GX(180) - 4, gm - 10, { color: c.danger, size: fs - 1.5, weight: 600, align: 'right', fit: W });
        var d0 = M.deg(th);
        D.circle(ctx, GX(d0), gm + Math.cos(th) * ga, 5.5, c.s3, c.bg, 1.5);
      }
    }
  });
})();
