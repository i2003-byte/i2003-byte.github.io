/* =====================================================================
   Some natural phenomena · Charging by Rubbing — sim.js
   ---------------------------------------------------------------------
   Rubbing two different materials moves some electrons from one to the
   other. The one that gains electrons becomes negative, the other is
   left positive by the same amount (charge is conserved):
       q_object = −q_cloth
   Each rubbing stroke adds charge, with a limit q_max for each pair.
   Charge slowly leaks into the air, faster when the air is humid:
       q(t) = q0 e^(−t/τ),  τ = 600 s × e^(−(humidity − 20 %) / 17 %)
   A metal spoon held in the hand loses its charge at once through the
   body (τ = 0.05 s).
   A small balloon (1 g) hangs on a 40 cm-scale thread with a fixed
   charge of −80 nC. The held object pushes or pulls it with Coulomb's
   force  F = k q1 q2 / r²,  k = 9 × 10⁹ N m²/C², and it swings like a
   damped pendulum. Scene scale: the canvas is 60 cm wide.
   Paper bits are neutral; they are pulled by induction and jump up
   when the field k|q|/r² at them passes 80 kV/m (a simple threshold).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, K = 9e9, g = 9.8;
  var QH = -80, MH = 0.001, ECRIT = 8e4;
  var PAIRS = {
    balloon: { name: 'Balloon rubbed on hair', obj: 'balloon', src: 'hair', sign: -1, qmax: 120, objName: 'balloon', srcName: 'hair' },
    comb: { name: 'Plastic comb through dry hair', obj: 'comb', src: 'hair', sign: -1, qmax: 60, objName: 'comb', srcName: 'hair' },
    glass: { name: 'Glass rod rubbed with silk', obj: 'rod', src: 'silk', sign: 1, qmax: 60, objName: 'glass rod', srcName: 'silk' },
    poly: { name: 'Polythene strip rubbed with wool', obj: 'strip', src: 'wool', sign: -1, qmax: 80, objName: 'polythene', srcName: 'wool' },
    spoon: { name: 'Steel spoon rubbed with wool', obj: 'spoon', src: 'wool', sign: -1, qmax: 60, metal: true, objName: 'spoon', srcName: 'wool' }
  };

  function tau(p) { return 600 * Math.exp(-(p.humid - 20) / 17); }
  function U(sim) { return Math.min(sim.width, sim.height); }
  function mpp(sim) { return 0.6 / sim.width; }
  function layout(sim) {
    var W = sim.width, H = sim.height, u = U(sim), narrow = W < 560;
    return {
      hx: W * 0.17, hy: H * (narrow ? 0.36 : 0.45), hr: u * 0.12,
      px: W * 0.84, py: 30, L: H * (narrow ? 0.34 : 0.42),
      tableY: H - 22, tx0: W * 0.34, tx1: W * 0.62, u: u
    };
  }
  function srcHit(sim, x, y) {
    var l = layout(sim), P = PAIRS[sim.p.pair];
    if (P.src === 'hair') return Math.hypot(x - l.hx, y - l.hy) < l.hr * 1.45 && y < l.hy - l.hr * 0.1;
    return Math.abs(x - l.hx) < l.hr * 1.2 && Math.abs(y - l.hy) < l.hr * 0.9;
  }
  function objPos(sim) { return { x: sim.state.ox * sim.width, y: sim.state.oy * sim.height }; }
  function bobPos(sim) { var l = layout(sim), a = sim.state.phi; return { x: l.px + l.L * Math.sin(a), y: l.py + l.L * Math.cos(a) }; }
  function fmtElectrons(qnC) {
    var n = Math.abs(qnC) * 1e-9 / 1.6e-19;
    if (n < 1e6) return '0';
    var e = Math.floor(Math.log10(n)), sup = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    return M.fmt(n / Math.pow(10, e), 1) + ' × 10' + String(e).split('').map(function (d) { return sup[+d]; }).join('');
  }
  function resetPaper(sim) {
    var l = layout(sim), r = M.rng(11), bits = [];
    for (var i = 0; i < 9; i++) bits.push({ fx: i / 8 + (r() - 0.5) * 0.06, x: 0, y: 0, st: 'rest', rot: r() * 3, dx: 0, dy: 0 });
    sim.state.bits = bits;
  }
  function addCharge(sim, amount) { // amount: fraction of a full rubbing
    var s = sim.state, P = PAIRS[sim.p.pair];
    var room = P.qmax - Math.max(Math.abs(s.q), Math.abs(s.qs));
    var dq = Math.max(0, room) * amount;
    s.q += P.sign * dq; s.qs -= P.sign * dq;
    s.rubs += amount;
  }

  SimLab.createSim({
    ariaLabel: 'A head with hair or a piece of cloth, an object you drag and rub on it, a charged balloon hanging on a thread and small bits of paper on a table. Plus and minus signs show the charges.',
    autoplay: true,
    mobileAspect: '4 / 5',
    params: [
      { id: 'pair', label: 'What to rub', type: 'select', value: 'balloon', options: Object.keys(PAIRS).map(function (k) { return { value: k, label: PAIRS[k].name }; }) },
      { id: 'humid', label: 'Humidity of the air', min: 20, max: 95, step: 5, value: 40, unit: '%',
        presets: [{ label: 'Dry winter day', value: 25 }, { label: 'Monsoon day', value: 90 }],
        help: 'Drag the object back and forth over the hair or cloth to rub it, then bring it near the paper bits or the hanging balloon.' }
    ],
    buttons: [
      { label: 'Rub 10 times', primary: true, onClick: function (sim) {
        var l = layout(sim), s = sim.state;
        addCharge(sim, 0.65);
        s.ox = (l.hx + l.hr * 2.3) / sim.width; s.oy = l.hy / sim.height;
      } },
      { label: 'Put the paper bits back', onClick: function (sim) { resetPaper(sim); } }
    ],
    buttonsTitle: 'Experiment',
    readouts: [
      { id: 'q', label: 'Charge on the object', unit: 'nC', digits: 0, key: true },
      { id: 'n', label: 'Electrons gained (+) or lost (−)' },
      { id: 'qs', label: 'Charge on the hair or cloth', unit: 'nC', digits: 0 },
      { id: 'tau', label: 'Half the charge leaks away in', unit: 's', digits: 0 },
      { id: 'ang', label: 'Hanging balloon swings by', unit: '°', digits: 0 },
      { id: 'bits', label: 'Paper bits picked up' }
    ],
    graph: { title: 'Charge vs time', yLabel: 'charge (nC)', series: [{ label: 'object', color: '--sim-1' }, { label: 'hair or cloth', color: '--sim-4' }], window: 40 },

    onParam: function (sim, id) {
      var s = sim.state;
      if (id === 'humid') return true;
      s.q = 0; s.qs = 0; s.rubs = 0; resetPaper(sim); return true;
    },
    reset: function (sim) {
      sim.state = { ox: 0.46, oy: sim.width < 560 ? 0.56 : 0.5, q: 0, qs: 0, rubs: 0, phi: 0, om: 0, drag: false, lx: 0, ly: 0 };
      resetPaper(sim);
    },
    update: function (sim, dt) {
      var s = sim.state, p = sim.p, P = PAIRS[p.pair];
      if (!sim.width || !sim.height) return; // canvas not measured yet
      var l = layout(sim), k = mpp(sim), t = tau(p);
      s.q *= Math.exp(-dt / (P.metal ? 0.05 : t));
      s.qs *= Math.exp(-dt / t);
      // hanging balloon: damped pendulum pushed by Coulomb's force
      var o = objPos(sim), b = bobPos(sim), dx = (b.x - o.x) * k, dy = (b.y - o.y) * k, r = Math.max(0.03, Math.hypot(dx, dy));
      var F = K * s.q * 1e-9 * QH * 1e-9 / (r * r); // + means push apart
      var Fx = F * dx / r, Fy = F * dy / r, Lm = l.L * k;
      var torque = Fx * Math.cos(s.phi) - (Fy + MH * g) * Math.sin(s.phi);
      s.om += (torque / (MH * Lm) - 3 * s.om) * dt;
      s.phi = M.clamp(s.phi + s.om * dt, -1.2, 1.2);
      if (!isFinite(s.phi) || !isFinite(s.om)) { s.phi = 0; s.om = 0; }
      // paper bits
      var W = sim.width;
      s.bits.forEach(function (bt) {
        var rx = l.tx0 + (l.tx1 - l.tx0) * bt.fx;
        if (bt.st === 'rest') {
          bt.x = rx; bt.y = l.tableY - 3;
          var d = Math.hypot(o.x - bt.x, o.y - bt.y) * k;
          if (K * Math.abs(s.q) * 1e-9 / (d * d) > ECRIT) bt.st = 'fly';
        } else if (bt.st === 'fly') {
          var vx = o.x - bt.x, vy = o.y - bt.y, dd = Math.hypot(vx, vy) || 1, sp = 900 * dt * (W / 600);
          var rad = objRadius(sim);
          if (dd < rad) { bt.st = 'stuck'; bt.dx = vx * -1; bt.dy = vy * -1; }
          else { bt.x += vx / dd * Math.min(sp, dd); bt.y += vy / dd * Math.min(sp, dd); }
          if (Math.abs(s.q) < 8) bt.st = 'fall';
        } else if (bt.st === 'stuck') {
          bt.x = o.x + bt.dx; bt.y = o.y + bt.dy;
          if (Math.abs(s.q) < 8) bt.st = 'fall';
        } else if (bt.st === 'fall') {
          bt.y += 500 * dt * (W / 600);
          if (bt.y >= l.tableY - 3) bt.st = 'rest';
        }
      });
    },
    sample: function (sim) { return [sim.state.q, sim.state.qs]; },
    status: function (sim) { return (sim.running ? 'Live' : 'Paused') + ' · t = ' + M.fmt(sim.time, 0) + ' s'; },
    readout: function (sim) {
      var s = sim.state, P = PAIRS[sim.p.pair];
      var n = fmtElectrons(s.q);
      return {
        q: s.q, qs: s.qs, n: n === '0' ? 'none' : (s.q < 0 ? '+ ' : '− ') + n,
        tau: (P.metal ? 0.05 : tau(sim.p)) * Math.LN2, ang: M.deg(s.phi),
        bits: s.bits.filter(function (b) { return b.st === 'stuck' || b.st === 'fly'; }).length + ' of ' + s.bits.length
      };
    },

    pointer: {
      down: function (sim, x, y) {
        var o = objPos(sim);
        if (Math.hypot(x - o.x, y - o.y) > objRadius(sim) + 26) return false;
        sim.state.drag = true; sim.state.lx = x; sim.state.ly = y; return true;
      },
      move: function (sim, x, y) {
        var s = sim.state; if (!s.drag) return;
        x = M.clamp(x, 10, sim.width - 10); y = M.clamp(y, 30, sim.height - 30);
        var d = Math.hypot(x - s.lx, y - s.ly);
        s.ox = x / sim.width; s.oy = y / sim.height;
        if (srcHit(sim, x, y) && d > 0) addCharge(sim, Math.min(0.2, d / (U(sim) * 6)));
        s.lx = x; s.ly = y;
      },
      up: function (sim) { sim.state.drag = false; },
      hover: function (sim, x, y) { var o = objPos(sim); return Math.hypot(x - o.x, y - o.y) < objRadius(sim) + 26; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, P = PAIRS[p.pair], l = layout(sim);
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560, o = objPos(sim), k = mpp(sim);

      // ---- source: head with hair, or a cloth ----
      var nPlus = Math.round(Math.abs(s.qs) / 10);
      if (P.src === 'hair') {
        D.circle(ctx, l.hx, l.hy + l.hr * 0.9, l.hr * 0.55, c.light ? '#f5c9a1' : '#d9a37a'); // neck/shoulders hint
        D.roundRect(ctx, l.hx - l.hr * 1.2, l.hy + l.hr * 1.25, l.hr * 2.4, l.hr * 0.9, l.hr * 0.4, '#2563eb');
        D.circle(ctx, l.hx, l.hy, l.hr, c.light ? '#f5c9a1' : '#e8b48a', '#8a5a3b', 1.5);
        D.circle(ctx, l.hx - l.hr * 0.35, l.hy + l.hr * 0.05, 2.5, '#1f2937'); D.circle(ctx, l.hx + l.hr * 0.35, l.hy + l.hr * 0.05, 2.5, '#1f2937');
        ctx.save(); ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(l.hx, l.hy + l.hr * 0.3, l.hr * 0.3, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); ctx.restore();
        // hair strands: spread when charged, lean towards the object
        ctx.save(); ctx.strokeStyle = '#3b2314'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        var spread = M.clamp(Math.abs(s.qs) / 90, 0, 1);
        for (var i = 0; i < 17; i++) {
          var a0 = Math.PI * (1.08 + 0.84 * i / 16), bx = l.hx + l.hr * Math.cos(a0), by = l.hy + l.hr * Math.sin(a0);
          var len = l.hr * (0.45 + 0.35 * spread), dirx = Math.cos(a0), diry = Math.sin(a0);
          if (spread < 0.15) { dirx = Math.cos(a0) * 0.5 + (bx < l.hx ? -0.5 : 0.5); diry = Math.sin(a0) * 0.3 + 0.7; } // lies flat
          var ex = o.x - bx, ey = o.y - by, ed = Math.hypot(ex, ey) * k;
          var pull = M.clamp(K * Math.abs(s.q) * 1e-9 / (ed * ed) / 3e5, 0, 0.9); // hair is pulled towards any charged object
          var dl = Math.hypot(dirx, diry); dirx /= dl; diry /= dl;
          var ux = ex / (Math.hypot(ex, ey) || 1), uy = ey / (Math.hypot(ex, ey) || 1);
          var tx = dirx * (1 - pull) + ux * pull, ty = diry * (1 - pull) + uy * pull, tl = Math.hypot(tx, ty) || 1;
          ctx.beginPath(); ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + dirx * len * 0.5, by + diry * len * 0.5, bx + tx / tl * len * (1 + pull * 0.6), by + ty / tl * len * (1 + pull * 0.6));
          ctx.stroke();
        }
        ctx.restore();
        D.text(ctx, 'hair', l.hx, l.hy + l.hr * 2.4, { color: c.muted, size: 11, weight: 600, align: 'center' });
      } else {
        var clothCol = P.src === 'silk' ? '#e9d5ff' : '#fca5a5';
        ctx.save(); ctx.fillStyle = clothCol; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(l.hx - l.hr * 1.2, l.hy - l.hr * 0.8);
        ctx.quadraticCurveTo(l.hx, l.hy - l.hr * 1.05, l.hx + l.hr * 1.2, l.hy - l.hr * 0.8);
        ctx.lineTo(l.hx + l.hr * 1.1, l.hy + l.hr * 0.9); ctx.quadraticCurveTo(l.hx, l.hy + l.hr * 1.1, l.hx - l.hr * 1.1, l.hy + l.hr * 0.9);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (P.src === 'wool') for (i = 0; i < 5; i++) D.line(ctx, l.hx - l.hr, l.hy - l.hr * 0.5 + i * l.hr * 0.32, l.hx + l.hr, l.hy - l.hr * 0.5 + i * l.hr * 0.32, 'rgba(127,29,29,0.35)', 2);
        ctx.restore();
        D.text(ctx, P.srcName + ' cloth', l.hx, l.hy + l.hr * 1.3, { color: c.muted, size: 11, weight: 600, align: 'center' });
      }
      // + or − signs on the source
      var srcSign = s.qs >= 0 ? '+' : '−';
      for (i = 0; i < Math.min(nPlus, 12); i++) {
        var sa = Math.PI * (1.15 + 0.7 * ((i * 0.618) % 1)), sr = l.hr * (P.src === 'hair' ? 1.15 : 0.2 + 0.7 * ((i * 0.37) % 1));
        var sx = P.src === 'hair' ? l.hx + sr * Math.cos(sa) : l.hx - l.hr * 0.9 + l.hr * 1.8 * ((i * 0.618) % 1), sy = P.src === 'hair' ? l.hy + sr * Math.sin(sa) : l.hy - l.hr * 0.6 + l.hr * 1.2 * ((i * 0.41) % 1);
        D.text(ctx, srcSign, sx, sy, { color: s.qs >= 0 ? c.danger : c.s1, size: 14, weight: 800, align: 'center' });
      }

      // ---- table with paper bits ----
      D.line(ctx, l.tx0 - 20, l.tableY, l.tx1 + 20, l.tableY, c.axis, 3);
      D.text(ctx, 'paper bits', (l.tx0 + l.tx1) / 2, l.tableY + 12, { color: c.muted, size: 10, align: 'center' });
      s.bits.forEach(function (bt) {
        if (bt.st === 'rest') { bt.x = l.tx0 + (l.tx1 - l.tx0) * bt.fx; bt.y = l.tableY - 3; }
        ctx.save(); ctx.translate(bt.x, bt.y); ctx.rotate(bt.rot); ctx.fillStyle = c.light ? '#fefce8' : '#f8fafc'; ctx.strokeStyle = '#94a3b8';
        ctx.fillRect(-4, -2.5, 8, 5); ctx.strokeRect(-4, -2.5, 8, 5); ctx.restore();
      });

      // ---- hanging balloon (charged −) ----
      var b = bobPos(sim), hb = l.u * 0.05;
      D.line(ctx, l.px - 30, l.py, l.px + 30, l.py, c.axis, 3);
      D.line(ctx, l.px, l.py, b.x, b.y - hb * 1.2, c.muted, 1);
      ctx.save(); ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.ellipse(b.x, b.y, hb, hb * 1.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      for (i = 0; i < 4; i++) D.text(ctx, '−', b.x + hb * 0.45 * Math.cos(i * 1.57 + 0.6), b.y + hb * 0.5 * Math.sin(i * 1.57 + 0.6), { color: '#0f172a', size: 12, weight: 800, align: 'center' });
      D.text(ctx, 'charged − balloon', l.px, l.py + l.L + hb * 2 + 12, { color: c.muted, size: 10, align: 'center', fit: W });

      // ---- the held object ----
      drawObject(sim, o.x, o.y);
      var nS = Math.min(12, Math.round(Math.abs(s.q) / 10)), rad = objRadius(sim), sign = s.q < 0 ? '−' : '+';
      for (i = 0; i < nS; i++) {
        var ang = i / Math.max(nS, 1) * Math.PI * 2 + 0.3;
        var ox = P.obj === 'balloon' ? o.x + rad * 0.55 * Math.cos(ang) : o.x + (i / Math.max(nS - 1, 1) - 0.5) * rad * 1.5;
        var oy = P.obj === 'balloon' ? o.y + rad * 0.65 * Math.sin(ang) : o.y + (i % 2 ? -3 : 3);
        D.text(ctx, sign, ox, oy, { color: s.q < 0 ? '#1e3a8a' : '#7f1d1d', size: 13, weight: 800, align: 'center' });
      }
      if (!s.drag && sim.time < 0.1 && s.rubs === 0) D.text(ctx, 'drag me', o.x, o.y + rad + 22, { color: c.accent, size: 11, weight: 700, align: 'center', fit: W });

      // ---- headline ----
      var msg, col = c.text, ang2 = M.deg(s.phi);
      if (P.metal && s.rubs > 0 && Math.abs(s.q) < 2) { msg = 'A metal spoon held in the hand loses its charge through your body'; col = c.warning; }
      else if (Math.abs(s.q) < 2) msg = s.rubs > 0 ? 'The charge has leaked away. Rub again' : 'Drag the ' + P.objName + ' over the ' + P.srcName + ' to rub it';
      else if (Math.abs(ang2) > 3 && Math.abs(s.q) > 5) {
        msg = s.q < 0 ? 'Like charges repel: the − balloon swings away' : 'Unlike charges attract: the − balloon swings closer'; col = s.q < 0 ? c.warning : c.success;
      } else { msg = 'The ' + P.objName + ' is ' + (s.q < 0 ? 'negative (gained electrons)' : 'positive (lost electrons)') + ', the ' + P.srcName + ' is ' + (s.q < 0 ? 'positive' : 'negative'); col = c.accent; }
      headline(ctx, msg, W, col, narrow ? 11 : 14);
    }
  });

  function objRadius(sim) { var P = PAIRS[sim.p.pair], u = Math.min(sim.width, sim.height); return P.obj === 'balloon' ? u * 0.075 : u * 0.1; }
  function drawObject(sim, x, y) {
    var ctx = sim.ctx, P = PAIRS[sim.p.pair], r = objRadius(sim);
    ctx.save();
    if (P.obj === 'balloon') {
      ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x, y, r * 0.85, r, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.18, r * 0.28, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#991b1b'; ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x - 5, y + r + 7); ctx.lineTo(x + 5, y + r + 7); ctx.fill();
      D.line(ctx, x, y + r + 7, x + 4, y + r + 30, '#94a3b8', 1);
    } else if (P.obj === 'comb') {
      D.roundRect(ctx, x - r, y - r * 0.28, r * 2, r * 0.22, 3, '#1f2937');
      for (var i = 0; i < 16; i++) D.line(ctx, x - r + 4 + i * (r * 2 - 8) / 15, y - r * 0.08, x - r + 4 + i * (r * 2 - 8) / 15, y + r * 0.3, '#1f2937', 2);
    } else if (P.obj === 'rod') {
      D.roundRect(ctx, x - r * 1.2, y - 6, r * 2.4, 12, 6, 'rgba(186,230,253,0.55)', '#7dd3fc', 1.5);
    } else if (P.obj === 'strip') {
      D.roundRect(ctx, x - r * 1.2, y - 7, r * 2.4, 14, 3, 'rgba(226,232,240,0.7)', '#94a3b8', 1.5);
    } else {
      ctx.fillStyle = '#cbd5e1'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x - r * 0.75, y, r * 0.4, r * 0.25, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      D.roundRect(ctx, x - r * 0.4, y - 4, r * 1.6, 8, 4, '#cbd5e1', '#64748b', 1.5);
    }
    ctx.restore();
  }

  /* Headline that shrinks to fit narrow screens. */
  function headline(ctx, msg, W, col, size) {
    ctx.save(); ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif';
    var w = ctx.measureText(msg).width; ctx.restore();
    D.text(ctx, msg, W / 2, 14, { color: col, size: Math.max(9, Math.min(size, size * (W - 16) / w)), weight: 700, align: 'center', fit: W });
  }
})();
