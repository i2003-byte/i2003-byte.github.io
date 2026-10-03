/* =====================================================================
   Electricity & Magnetism · Electric Motor and Generator — sim.js
   ---------------------------------------------------------------------
   End-on view of a rectangular coil (N turns, sides l = 5 cm long,
   w = 4 cm apart, area A = lw) turning about its axle in a uniform
   field B pointing from the N magnet (left) to the S magnet (right).
   θ = angle of the coil's plane from the field; k = NBA.
   Generator, turned at a steady ω:
     emf ε = k ω cos θ  (largest when the coil's plane is along B)
     slip rings → ε (AC); split ring → |ε| (DC that pulses)
   Motor, battery V, total resistance R, coil inertia J, friction b ω:
     back emf e = k ω |cos θ|, current I = (V − e) / R
     torque τ = k I |cos θ| (the split ring keeps it one way round)
     J dω/dt = τ − b ω
   Side moving/pushed: F = I l × B. Current out of the screen (⊙) with
   B to the right gives a force upwards (Fleming's left-hand rule), so
   the motor turns anticlockwise; the generator is turned anticlockwise
   and the side moving up carries current into the screen (⊗), as
   Fleming's right-hand rule says.
   Everything is drawn 50× slower than real time.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SLOW = 50, AREA = 0.05 * 0.04, R_COIL = 5, R_LOAD = 10, J = 3e-5, FRIC = 2e-5;
  var COL_A = '#f59e0b', COL_B = '#14b8a6';

  function isMotor(p) { return p.mode === 'motor'; }
  function kOf(p) { return p.N * p.B * AREA; }
  function omega(sim) { return isMotor(sim.p) ? sim.state.w : sim.p.rpm * 2 * Math.PI / 60; }
  // electrical state now
  function elec(sim) {
    var p = sim.p, s = sim.state, k = kOf(p), w = omega(sim), c = Math.cos(s.th);
    if (isMotor(p)) {
      var e = k * w * Math.abs(c), I = Math.max(0, (p.V - e) / R_COIL);
      return { emf: e, I: I, coilI: I * (c >= 0 ? 1 : -1), tau: k * I * Math.abs(c), out: null };
    }
    var emf = k * w * c, out = p.mode === 'dc' ? Math.abs(emf) : emf, Iout = out / (R_COIL + R_LOAD);
    return { emf: emf, I: Iout, coilI: -emf / (R_COIL + R_LOAD), tau: k * Math.abs(emf / (R_COIL + R_LOAD) * c), out: out };
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560, L = {};
    if (wide) { L.main = { x: 0, y: 26, w: W * 0.62, h: H - 26 }; L.side = { x: W * 0.62, y: 26, w: W * 0.38, h: H - 26 }; }
    else { L.main = { x: 0, y: 24, w: W, h: H * 0.6 - 24 }; L.side = { x: 0, y: H * 0.6, w: W, h: H * 0.4 }; }
    return L;
  }

  SimLab.createSim({
    ariaLabel: 'End-on view of a coil turning between the poles of a magnet, working as an electric motor or as an AC or DC generator, with the commutator or slip rings beside it',
    autoplay: true,
    mobileAspect: '3 / 4',
    params: [
      { id: 'mode', label: 'Machine', type: 'select', value: 'motor', options: [
        { value: 'motor', label: 'DC motor (battery, split ring)' }, { value: 'ac', label: 'AC generator (slip rings)' }, { value: 'dc', label: 'DC generator (split ring)' }] },
      { id: 'V', label: 'Battery voltage V', min: 0, max: 12, step: 0.5, value: 6, unit: 'V', help: 'Motor only.' },
      { id: 'rpm', label: 'Speed you turn it at', min: 300, max: 3000, step: 50, value: 1500, unit: 'rpm', help: 'Generators only. 3000 rpm gives 50 Hz, like India\'s mains.',
        presets: [{ label: '50 Hz', value: 3000 }] },
      { id: 'B', label: 'Magnet strength B', min: 0.1, max: 0.5, step: 0.05, value: 0.3, unit: 'T' },
      { id: 'N', label: 'Turns in the coil N', min: 20, max: 200, step: 10, value: 100 }
    ],
    readouts: [
      { id: 'rpm', label: 'Speed', unit: 'rpm', digits: 0, key: true },
      { id: 'I', label: 'Current in the circuit', unit: 'A', digits: 2, key: true },
      { id: 'emf', label: 'emf made by the turning coil', unit: 'V', digits: 2 },
      { id: 'tau', label: 'Torque on the coil', unit: 'mN m', digits: 1 },
      { id: 'f', label: 'Turns per second', unit: 'Hz', digits: 1 },
      { id: 'rule', label: 'Rule' }
    ],
    graph: { title: 'Current or voltage vs real time', xLabel: 'real time (ms)', yLabel: 'A or V', window: 10 / SLOW * 1000,
      series: [{ label: 'Motor current (A)' }, { label: 'Generator output (V)' }] },

    onParam: function (sim, id) { return id !== 'mode'; },
    reset: function (sim) { sim.state = { th: M.rad(20), w: 0, acc: 0 }; },
    update: function (sim, dt) {
      var s = sim.state, p = sim.p, dtr = dt / SLOW;
      if (isMotor(p)) {
        var e = elec(sim);
        s.w = Math.max(0, s.w + (e.tau - FRIC * s.w) / J * dtr);
      }
      s.th = (s.th + omega(sim) * dtr) % (2 * Math.PI);
      s.acc += dt;
      if (s.acc >= 1 / 60) {
        s.acc = 0;
        var el = elec(sim);
        sim.graph.push(sim.time / SLOW * 1000, isMotor(p) ? [el.I, NaN] : [NaN, el.out]);
      }
    },
    status: function (sim) { return (sim.running ? 'Running' : 'Paused') + ' · slow motion, 50× slower than real · real t = ' + M.fmt(sim.time / SLOW * 1000, 0) + ' ms'; },
    readout: function (sim) {
      var e = elec(sim), w = omega(sim);
      return {
        rpm: w * 60 / (2 * Math.PI), I: isMotor(sim.p) ? e.I : Math.abs(e.I), emf: e.emf,
        tau: e.tau * 1000, f: w / (2 * Math.PI),
        rule: isMotor(sim.p) ? 'Fleming’s left-hand rule (force)' : 'Fleming’s right-hand rule (induced current)'
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, Lt = layout(sim), small = W < 560;
      var motor = isMotor(p), e = elec(sim), mx = Lt.main.x + Lt.main.w / 2, my = Lt.main.y + Lt.main.h / 2;
      var S = Math.min(Lt.main.w, Lt.main.h * 1.25), rc = S * 0.25;
      D.clear(ctx, W, H, c.bg);
      var head = motor ? 'DC motor: current + magnet → the coil turns' : (p.mode === 'ac' ? 'AC generator' : 'DC generator') + ': turning the coil → current';
      D.text(ctx, head, W / 2, 13, { color: c.bg, bg: c.s3, size: small ? 11.5 : 13, weight: 700, align: 'center', pad: 4, fit: W });

      // magnets with curved faces + field lines
      var gap = S * 0.4, mw = Math.min(S * 0.16, Lt.main.w / 2 - gap - 4), mh = Math.min(S * 0.62, Lt.main.h - 16);
      [[-1, 'N', '#dc2626'], [1, 'S', '#2563eb']].forEach(function (m) {
        var inner = mx + m[0] * gap, outer = inner + m[0] * mw;
        ctx.beginPath(); ctx.moveTo(outer, my - mh / 2); ctx.lineTo(inner + m[0] * 6, my - mh / 2);
        ctx.quadraticCurveTo(inner - m[0] * 14, my, inner + m[0] * 6, my + mh / 2); ctx.lineTo(outer, my + mh / 2); ctx.closePath();
        ctx.fillStyle = m[2]; ctx.fill();
        D.text(ctx, m[1], (inner + outer) / 2 + m[0] * 3, my, { color: '#fff', size: 18, weight: 800, align: 'center' });
      });
      var fcol = D.alpha(c.muted, 0.45);
      for (var i = -2; i <= 2; i++) {
        var yy = my + i * mh * 0.19;
        D.line(ctx, mx - gap + 6, yy, mx + gap - 6, yy, fcol, 1, [5, 5]);
        D.arrow(ctx, mx + gap * 0.62, yy, mx + gap * 0.74, yy, fcol, 1, 6);
      }

      // coil seen end-on (sides AB and CD)
      var ax = Math.cos(s.th) * rc, ay = -Math.sin(s.th) * rc;
      var A = { x: mx + ax, y: my + ay }, B = { x: mx - ax, y: my - ay };
      D.line(ctx, A.x, A.y, B.x, B.y, c.ink, 4);
      D.circle(ctx, mx, my, 5, c.ink);
      var cur = e.coilI, curOn = Math.abs(cur) > 1e-3;
      [[A, 1, 'AB', COL_A], [B, -1, 'CD', COL_B]].forEach(function (sd) {
        var P = sd[0], iSide = cur * sd[1]; // + = out of the screen
        D.circle(ctx, P.x, P.y, 10, sd[3], c.ink, 1.5);
        if (curOn && iSide > 0) D.circle(ctx, P.x, P.y, 3, '#111');
        else if (curOn) { D.line(ctx, P.x - 5, P.y - 5, P.x + 5, P.y + 5, '#111', 2); D.line(ctx, P.x + 5, P.y - 5, P.x - 5, P.y + 5, '#111', 2); }
        var lx = P.x + (P.x >= mx ? 15 : -15);
        D.text(ctx, sd[2], lx, P.y - 13, { color: sd[3], size: 13, weight: 800, align: P.x >= mx ? 'left' : 'right' });
        if (motor) { // force F = I l × B: up for ⊙, down for ⊗
          var f = M.clamp(Math.abs(iSide) / 2.4, 0, 1) * rc * 0.9;
          if (f > 3) D.arrow(ctx, P.x, P.y + (iSide > 0 ? -12 : 12), P.x, P.y + (iSide > 0 ? -12 - f : 12 + f), c.s2, 3, 9);
        } else { // velocity of the side (anticlockwise turning)
          var sgn = sd[1], vx = -Math.sin(s.th) * sgn, vy = -Math.cos(s.th) * sgn, vl = rc * 0.55;
          D.arrow(ctx, P.x + vx * 12, P.y + vy * 12, P.x + vx * (12 + vl), P.y + vy * (12 + vl), c.s4, 2.5, 8);
        }
      });
      var deg = ((M.deg(s.th) % 360) + 360) % 360;
      D.text(ctx, 'θ = ' + M.fmt(deg, 0) + '°', mx, Math.min(my + rc + 26, Lt.main.y + Lt.main.h - 24), { color: c.muted, size: 11, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2 });
      var key = motor ? '⟶ force on each side (F = BIl)' : '⟶ how each side moves';
      D.text(ctx, key, Lt.main.x + 6, Lt.main.y + Lt.main.h - 8, { color: motor ? c.s2 : c.s4, size: small ? 10 : 11, weight: 600 });
      D.text(ctx, 'B: N → S · ⊙ out ⊗ in', Lt.main.x + Lt.main.w - 6, Lt.main.y + Lt.main.h - 8, { color: c.muted, size: small ? 10 : 11, align: 'right' });

      drawSide(sim, ctx, Lt.side, c, e, small);
    }
  });

  // side view of the rings and brushes, and the outside circuit beside them
  function drawSide(sim, ctx, R, c, e, small) {
    var p = sim.p, s = sim.state, motor = isMotor(p), split = p.mode !== 'ac';
    D.roundRect(ctx, R.x + 6, R.y + 4, R.w - 12, R.h - 10, 10, D.alpha(c.muted, 0.07), D.alpha(c.muted, 0.25), 1);
    var rr = M.clamp(R.h * 0.13, 14, 26), rw = 30, ry = R.y + R.h / 2 + 2, cx = R.x + R.w * 0.32, dx = R.x + R.w * 0.72;
    D.text(ctx, split ? 'Split ring (commutator), side view' : 'Slip rings, side view', R.x + R.w / 2, ry - rr - 34, { color: c.muted, size: small ? 10.5 : 11.5, weight: 700, align: 'center', fit: R.x + R.w });
    D.line(ctx, cx - rw * 1.8, ry, cx + rw * 1.8, ry, c.faint, 4); // axle
    var bTop, bBot, label;
    if (split) {
      var aTop = Math.cos(s.th) < 0; // the AB half faces the top brush when side AB is on the left
      D.roundRect(ctx, cx - rw / 2, ry - rr, rw, rr - 2, 3, aTop ? COL_A : COL_B);
      D.roundRect(ctx, cx - rw / 2, ry + 2, rw, rr - 2, 3, aTop ? COL_B : COL_A);
      bTop = { x: cx, y: ry - rr }; bBot = { x: cx, y: ry + rr };
      label = Math.abs(Math.cos(s.th)) < 0.12 ? 'brushes on the gaps: the current switches over' : 'top brush touches the ' + (aTop ? 'AB' : 'CD') + ' half, bottom brush the ' + (aTop ? 'CD' : 'AB') + ' half';
    } else {
      D.roundRect(ctx, cx - rw - 3, ry - rr, rw, 2 * rr, 3, COL_A);
      D.roundRect(ctx, cx + 3, ry - rr, rw, 2 * rr, 3, COL_B);
      bTop = { x: cx - rw / 2 - 3, y: ry - rr }; bBot = { x: cx + rw / 2 + 3, y: ry + rr };
      label = 'each ring stays joined to one end of the coil';
    }
    D.roundRect(ctx, bTop.x - 5, bTop.y - 10, 10, 10, 2, c.ink);
    D.roundRect(ctx, bBot.x - 5, bBot.y, 10, 10, 2, c.ink);
    D.text(ctx, label, R.x + R.w / 2, ry + rr + 32, { color: c.text, size: small ? 10 : 11, align: 'center', fit: R.x + R.w });

    // wires: top brush → over the top → device; bottom brush → under → device
    var wc = c.muted, yT = ry - rr - 18, yB = ry + rr + 16;
    function wire(pts) { ctx.save(); ctx.strokeStyle = wc; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); ctx.restore(); }
    if (motor) {
      wire([[bTop.x, bTop.y - 10], [bTop.x, yT], [dx, yT], [dx, ry - 16]]);
      wire([[bBot.x, bBot.y + 10], [bBot.x, yB], [dx, yB], [dx, ry + 16]]);
      D.roundRect(ctx, dx - 18, ry - 16, 36, 32, 4, c.bg, c.ink, 1.5);
      D.line(ctx, dx - 11, ry - 4, dx + 11, ry - 4, c.ink, 2.5); D.line(ctx, dx - 6, ry + 4, dx + 6, ry + 4, c.ink, 4);
      D.text(ctx, '+', dx + 14, ry - 10, { color: c.text, size: 10, weight: 700 });
      D.text(ctx, M.fmt(p.V, 1) + ' V', dx + 24, ry + 1, { color: c.text, size: 11, weight: 700, fit: R.x + R.w });
    } else {
      var gx = dx - 24, bx = dx + 26, gr = Math.min(16, rr * 0.9);
      wire([[bTop.x, bTop.y - 10], [bTop.x, yT], [bx, yT], [bx, ry - 9]]);
      wire([[bBot.x, bBot.y + 10], [bBot.x, yB], [gx, yB], [gx, ry + gr]]);
      wire([[gx + gr, ry], [bx - 9, ry]]);
      D.circle(ctx, gx, ry, gr, c.bg, c.ink, 1.5);
      var full = p.N * p.B * AREA * 2 * Math.PI * 3000 / 60 / (R_COIL + R_LOAD), a = M.clamp(e.I / full, -1, 1) * 1.1;
      D.line(ctx, gx, ry + gr * 0.5, gx + Math.sin(a) * gr * 0.9, ry + gr * 0.5 - Math.cos(a) * gr * 0.9, '#ef4444', 2);
      D.text(ctx, 'G', gx, ry + gr * 0.62, { color: c.muted, size: 8, weight: 700, align: 'center' });
      var glow = M.clamp(e.I * e.I * R_LOAD / 4, 0, 1);
      if (glow > 0.02) D.circle(ctx, bx, ry, 9 + 12 * glow, D.alpha('#fde047', 0.35 * glow + 0.1));
      D.circle(ctx, bx, ry, 9, D.alpha('#fde047', 0.15 + 0.85 * glow), c.ink, 1.5);
      D.text(ctx, 'meter', gx - gr - 3, ry, { color: c.muted, size: 9.5, align: 'right' });
      D.text(ctx, 'bulb', bx + 12, ry, { color: c.muted, size: 9.5, fit: R.x + R.w });
    }
  }
})();
