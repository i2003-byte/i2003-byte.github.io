/* =====================================================================
   Some natural phenomena · Gold-Leaf Electroscope — sim.js
   ---------------------------------------------------------------------
   A metal cap, stem and two thin leaves form one conductor. Its net
   charge Q is shared: half on the cap, half on the stem and leaves.
   A charged rod near the cap pushes charge of its own sign down to the
   leaves and pulls the opposite sign up to the cap (induction):
       induced = α β q_rod,  α = 0.6 ÷ (1 + (d / d0)²),  β = 0.5
       leaves  = Q/2 + induced      cap = Q/2 − induced
   d = distance from the rod's tip to the cap, d0 = 1.5 cap radii.
   Earthing (finger on the cap) lets electrons flow until the leaves
   have no charge:  Q = −2 α β q_rod.
   Touching the cap with the rod passes half the rod's charge to the
   electroscope (a rubbed rod is an insulator, so only part flows).
   The leaves repel each other; their angle from the stem is
       θ = 60° × min(1, √(|q_leaves| ÷ 25 nC))
   a simple rule that grows with the charge. Charges are in nC.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, BETA = 0.5;
  var RODS = {
    poly: { name: 'Polythene rod rubbed with wool (−)', sign: -1, col: 'rgba(226,232,240,0.8)', edge: '#94a3b8' },
    glass: { name: 'Glass rod rubbed with silk (+)', sign: 1, col: 'rgba(186,230,253,0.55)', edge: '#7dd3fc' }
  };

  function L(sim) {
    var W = sim.width, H = sim.height, u = Math.min(W, H), narrow = W < 560;
    var cx = narrow ? W * 0.42 : W * 0.4, capY = H * (narrow ? 0.34 : 0.3), capR = u * 0.075;
    return { cx: cx, capY: capY, capR: capR, stemB: H * 0.62, jarT: H * 0.46, jarB: H - 16, jarW: Math.min(W * 0.46, u * 0.62), leafL: u * 0.2, rodL: Math.min(W * 0.42, 240), u: u };
  }
  function alpha(sim) {
    var l = L(sim), s = sim.state, d = Math.max(0, Math.hypot(s.rx * sim.width - l.cx, s.ry * sim.height - l.capY) - l.capR);
    return 0.6 / (1 + Math.pow(d / (1.5 * l.capR), 2));
  }
  function parts(sim) {
    var s = sim.state, ind = alpha(sim) * BETA * s.qr;
    return { ind: ind, leaves: s.Q / 2 + ind, cap: s.Q / 2 - ind };
  }
  function leafAngle(q) { return 60 * Math.min(1, Math.sqrt(Math.abs(q) / 25)); }
  function settle(sim) {
    if (!sim.width) return;
    var s = sim.state, l = L(sim);
    var tip = { x: s.rx * sim.width, y: s.ry * sim.height }, touch = Math.hypot(tip.x - l.cx, tip.y - l.capY) < l.capR * 1.15;
    if (touch && !s.touching && Math.abs(s.qr) > 0.5) {
      var dq = s.qr * 0.5; s.Q += dq; s.qr -= dq; s.flash = 'touch';
    }
    s.touching = touch;
    if (sim.p.earth) {
      var q0 = s.Q; s.Q = -2 * alpha(sim) * BETA * s.qr;
      var flow = s.Q - q0; // + means positive charge gained = electrons flowed to earth
      if (Math.abs(flow) > 0.3) { s.flow = flow; s.flowT = 1.2; }
    }
  }

  SimLab.createSim({
    ariaLabel: 'A gold-leaf electroscope in a glass jar with a metal cap on top and two thin leaves inside, a charged rod you can drag near or onto the cap, and a finger that can earth the cap. Plus and minus signs show where the charges are.',
    transport: false,
    mobileAspect: '4 / 5',
    params: [
      { id: 'rod', label: 'Rod', type: 'select', value: 'poly', options: Object.keys(RODS).map(function (k) { return { value: k, label: RODS[k].name }; }) },
      { id: 'charge', label: 'Charge on the rod after rubbing', min: 10, max: 60, step: 5, value: 40, unit: 'nC',
        help: 'Drag the rod towards the cap. Touch the cap with it, or keep it near and put your finger on the cap.' },
      { id: 'earth', label: 'Finger on the cap (earthing)', type: 'toggle', value: false }
    ],
    buttons: [
      { label: 'Rub the rod again', primary: true, onClick: function (sim) { sim.state.qr = RODS[sim.p.rod].sign * sim.p.charge; settle(sim); } },
      { label: 'Move the rod away', onClick: function (sim) { var s = sim.state; s.rx = sim.width < 560 ? 0.8 : 0.78; s.ry = 0.14; settle(sim); } },
      { label: 'Discharge the electroscope', onClick: function (sim) { sim.state.Q = 0; settle(sim); } }
    ],
    buttonsTitle: 'Experiment',
    readouts: [
      { id: 'qr', label: 'Charge on the rod', unit: 'nC', digits: 1 },
      { id: 'cap', label: 'Charge on the cap', unit: 'nC', digits: 1 },
      { id: 'leaves', label: 'Charge on the leaves', unit: 'nC', digits: 1, key: true },
      { id: 'Q', label: 'Total charge of the electroscope', unit: 'nC', digits: 1, key: true },
      { id: 'ang', label: 'Each leaf opens by', unit: '°', digits: 0 }
    ],

    onParam: function (sim, id) {
      var s = sim.state;
      if (id === 'rod' || id === 'charge') s.qr = RODS[sim.p.rod].sign * sim.p.charge;
      settle(sim); return true;
    },
    reset: function (sim) {
      sim.state = { rx: sim.width < 560 ? 0.8 : 0.78, ry: 0.14, qr: RODS[sim.p.rod].sign * sim.p.charge, Q: 0, touching: false, drag: false, ang: 0, last: 0, flow: 0, flowT: 0, flash: '' };
      settle(sim);
    },
    readout: function (sim) {
      var s = sim.state, pr = parts(sim);
      return { qr: s.qr, cap: pr.cap, leaves: pr.leaves, Q: s.Q, ang: leafAngle(pr.leaves) };
    },
    animate: function (sim) {
      var s = sim.state; return Math.abs(s.ang - leafAngle(parts(sim).leaves)) > 0.2 || s.flowT > 0;
    },

    pointer: {
      down: function (sim, x, y) {
        var s = sim.state, l = L(sim), tx = s.rx * sim.width, ty = s.ry * sim.height;
        if (x < tx - 24 || x > tx + l.rodL + 10 || Math.abs(y - ty) > 26) return false;
        s.drag = true; s.gx = x - tx; s.gy = y - ty; return true;
      },
      move: function (sim, x, y) {
        var s = sim.state; if (!s.drag) return;
        s.rx = M.clamp((x - s.gx) / sim.width, 0.02, 0.95); s.ry = M.clamp((y - s.gy) / sim.height, 0.08, 0.5);
        settle(sim);
      },
      up: function (sim) { sim.state.drag = false; },
      hover: function (sim, x, y) { var s = sim.state, tx = s.rx * sim.width, ty = s.ry * sim.height; return x > tx - 24 && x < tx + L(sim).rodL + 10 && Math.abs(y - ty) < 26; }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, l = L(sim), pr = parts(sim), R = RODS[p.rod];
      var dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 0.1; s.last = now;
      var target = leafAngle(pr.leaves);
      s.ang += (target - s.ang) * Math.min(1, dt * 7);
      if (s.flowT > 0) s.flowT -= dt;
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560;

      // ---- jar, stopper, stem ----
      var jx = l.cx - l.jarW / 2;
      D.roundRect(ctx, jx, l.jarT, l.jarW, l.jarB - l.jarT, 14, c.light ? 'rgba(186,230,253,0.25)' : 'rgba(148,197,255,0.08)', c.border, 2);
      D.roundRect(ctx, l.cx - l.u * 0.06, l.jarT - 12, l.u * 0.12, 24, 4, '#78350f');
      D.text(ctx, 'cork (insulator)', l.cx + l.u * 0.08, l.jarT - 2, { color: c.muted, size: 10, fit: W });
      D.line(ctx, l.cx, l.capY, l.cx, l.stemB, '#cbd5e1', 5);
      // ---- leaves ----
      var a = M.rad(s.ang);
      ctx.save(); ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1;
      [-1, 1].forEach(function (side) {
        ctx.beginPath(); ctx.moveTo(l.cx, l.stemB - 4);
        ctx.lineTo(l.cx + side * Math.sin(a) * l.leafL - Math.cos(a) * 4 * side, l.stemB + Math.cos(a) * l.leafL - Math.sin(a) * 0);
        ctx.lineTo(l.cx + side * Math.sin(a) * l.leafL + Math.cos(a) * 4 * side, l.stemB + Math.cos(a) * l.leafL + 2);
        ctx.lineTo(l.cx + side * 3, l.stemB); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.restore();
      signs(ctx, pr.leaves, 2, function (i, n) {
        var side = i % 2 ? 1 : -1, f = 0.35 + 0.55 * (Math.floor(i / 2) + 0.5) / Math.ceil(n / 2);
        return { x: l.cx + side * (Math.sin(a) * l.leafL * f + 9), y: l.stemB + Math.cos(a) * l.leafL * f };
      }, 8);
      D.text(ctx, 'gold leaves', l.cx, l.jarB - 12, { color: c.muted, size: 10, align: 'center' });
      // ---- cap ----
      ctx.save(); ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(l.cx, l.capY, l.capR, l.capR * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
      signs(ctx, pr.cap, 2, function (i, n) { return { x: l.cx - l.capR * 0.8 + l.capR * 1.6 * (i + 0.5) / n, y: l.capY - l.capR * 0.3 - 8 }; }, 10);
      D.text(ctx, 'metal cap', l.cx - l.capR - 6, l.capY + 2, { color: c.muted, size: 10, align: 'right', fit: W });

      // ---- finger (earthing) ----
      if (p.earth) {
        var fx = l.cx + l.capR * 0.2, fy = l.capY - l.capR * 0.25;
        ctx.save(); ctx.strokeStyle = c.light ? '#e0a877' : '#e8b48a'; ctx.lineWidth = 14; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(fx - l.u * 0.02, fy - 4); ctx.lineTo(fx - l.u * 0.2, fy - l.u * 0.16); ctx.stroke(); ctx.restore();
        var ex = fx - l.u * 0.26, ey = fy - l.u * 0.2;
        D.text(ctx, 'finger → body → earth', Math.max(4, ex - 10), ey - 6, { color: c.success, size: 11, weight: 700, fit: W });
        if (s.flowT > 0) {
          var toEarth = s.flow > 0, ph = (now / 400) % 1;
          for (var i = 0; i < 4; i++) {
            var t = (i / 4 + ph) % 1; if (!toEarth) t = 1 - t;
            D.text(ctx, '−', M.lerp(fx - 4, fx - l.u * 0.2, t), M.lerp(fy - 6, fy - l.u * 0.16, t) - 10, { color: '#1d4ed8', size: 14, weight: 800, align: 'center' });
          }
          D.text(ctx, toEarth ? 'electrons flow to the earth' : 'electrons flow in from the earth', Math.max(4, ex - 10), ey + 12, { color: c.s1, size: 11, weight: 600, fit: W });
        }
      }

      // ---- rod ----
      var tx = s.rx * W, ty = s.ry * H;
      D.roundRect(ctx, tx, ty - 8, l.rodL, 16, 8, R.col, R.edge, 1.5);
      D.roundRect(ctx, tx + l.rodL * 0.72, ty - 10, l.rodL * 0.28, 20, 6, c.light ? '#e0a877' : '#b98a64'); // hand grip
      signs(ctx, s.qr, 5, function (i, n) { return { x: tx + 10 + (l.rodL * 0.62) * (i + 0.5) / n, y: ty }; }, 10);
      if (!s.drag && Math.abs(s.Q) < 0.1 && tx > W * 0.6) D.text(ctx, 'drag the rod', tx + l.rodL * 0.36, ty + 24, { color: c.accent, size: 11, weight: 700, align: 'center', fit: W });

      // ---- headline ----
      var msg, col = c.text, near = alpha(sim) > 0.08;
      if (s.touching) { msg = 'Touching: charge flows from the rod to the electroscope'; col = c.warning; }
      else if (p.earth && near) { msg = 'Earthed: leaves close, the cap keeps an opposite charge'; col = c.success; }
      else if (p.earth) { msg = 'Earthed: all the charge flows to the earth, the leaves close'; col = c.success; }
      else if (near && Math.abs(pr.leaves) > 1) { msg = 'Rod near: charges separate, the leaves open (induction)'; col = c.accent; }
      else if (Math.abs(s.Q) > 0.5) { msg = 'The electroscope is charged ' + (s.Q > 0 ? 'positive (+)' : 'negative (−)') + ': the leaves stay open'; col = c.warning; }
      else msg = 'Uncharged: the leaves hang together';
      headline(ctx, msg, W, col, narrow ? 11 : 14);
    }
  });

  /* Draw up to `max` + or − signs, one for every `per` nC, at positions from pos(i, n). */
  function signs(ctx, q, per, pos, max) {
    var n = Math.min(max, Math.round(Math.abs(q) / per));
    for (var i = 0; i < n; i++) {
      var pt = pos(i, n);
      D.text(ctx, q > 0 ? '+' : '−', pt.x, pt.y, { color: q > 0 ? '#dc2626' : '#2563eb', size: 14, weight: 800, align: 'center' });
    }
  }

  /* Headline that shrinks to fit narrow screens. */
  function headline(ctx, msg, W, col, size) {
    ctx.save(); ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif';
    var w = ctx.measureText(msg).width; ctx.restore();
    D.text(ctx, msg, W / 2, 14, { color: col, size: Math.max(9, Math.min(size, size * (W - 16) / w)), weight: 700, align: 'center', fit: W });
  }
})();
