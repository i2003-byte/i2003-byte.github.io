/* =====================================================================
   Force and pressure · Balanced and Unbalanced Forces — sim.js
   ---------------------------------------------------------------------
   A loaded trolley on a smooth floor is pulled by two teams, one on
   each side. Forces along the same line in opposite directions
   subtract:
       net force  F = F_right − F_left      (newton, N; + = to the right)
   Balanced (F = 0): no change in the state of motion. The trolley
   stays at rest, or keeps moving at the same speed.
   Unbalanced: the trolley speeds up or slows down in the direction of
   the net force, with  a = F ÷ m  (Newton's second law, Class 9).
   Simplification: rolling friction on the wheels is ignored.
   The camera follows the trolley; ground marks show the distance.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var YARD = 20; // m: the run ends when the trolley is this far from the start
  var FORCES = [{ label: '0 N', value: 0 }, { label: '100 N', value: 100 }, { label: '200 N', value: 200 }, { label: '300 N', value: 300 }];

  function net(p) { return p.right - p.left; }
  function dirWord(v) { return v > 0 ? 'right' : 'left'; }

  // Stick figure pulling a rope. fx,fy: feet; face = +1 looks right, −1 left; hy: hand height
  function person(ctx, fx, fy, h, face, col, hy, strain) {
    var lean = 0.18 + 0.22 * strain;                 // leans back more when pulling harder
    var hipX = fx - face * h * 0.12, hipY = fy - h * 0.45;
    var neckX = hipX - face * h * 0.4 * Math.sin(lean) , neckY = hipY - h * 0.38 * Math.cos(lean);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, h * 0.07); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(fx + face * h * 0.1, fy); ctx.lineTo(hipX, hipY); ctx.lineTo(fx - face * h * 0.22, fy); // legs
    ctx.moveTo(hipX, hipY); ctx.lineTo(neckX, neckY);                                                 // body
    ctx.moveTo(neckX, neckY + h * 0.05); ctx.lineTo(neckX + face * h * 0.3, hy);                     // arms to the rope
    ctx.stroke(); ctx.restore();
    D.circle(ctx, neckX - face * h * 0.02, neckY - h * 0.1, h * 0.1, col);
  }

  SimLab.createSim({
    ariaLabel: 'A loaded trolley pulled by ropes from both sides by two teams, with arrows for each pull and for the net force, on a floor marked in metres',
    playLabel: 'Start pulling',
    mobileAspect: '1 / 1',
    params: [
      { id: 'left', label: 'Pull of the left team', min: 0, max: 400, step: 10, value: 200, unit: 'N', presets: FORCES },
      { id: 'right', label: 'Pull of the right team', min: 0, max: 400, step: 10, value: 200, unit: 'N', presets: FORCES,
        help: 'An adult pulling hard on a rope can manage roughly 200–400 N. Change the pulls while it is moving too.' },
      { id: 'mass', label: 'Mass of the loaded trolley', min: 20, max: 200, step: 10, value: 50, unit: 'kg' }
    ],
    buttons: [
      { label: 'Balance the forces (right = left)', primary: true, onClick: function (sim) { sim.setParam('right', sim.p.left); } },
      { label: 'Left team lets go', onClick: function (sim) { sim.setParam('left', 0); } }
    ],
    buttonsTitle: 'Try',
    readouts: [
      { id: 'L', label: 'Left pull', unit: 'N', digits: 0 },
      { id: 'R', label: 'Right pull', unit: 'N', digits: 0 },
      { id: 'F', label: 'Net force F = right − left', key: true },
      { id: 'kind', label: 'The forces are' },
      { id: 'a', label: 'Acceleration a = F ÷ m', unit: 'm/s²', digits: 2 },
      { id: 'v', label: 'Speed', unit: 'm/s', digits: 2 },
      { id: 'x', label: 'Distance from start', unit: 'm', digits: 2 }
    ],
    graph: { title: 'Velocity–time graph', yLabel: 'velocity (m/s, + right)', series: [{ label: 'velocity', color: '--sim-1' }], window: 10, symmetric: true },

    onParam: function () { return true; }, // keep moving: see what a change of force does mid-run
    reset: function (sim) { sim.state = { x: 0, v: 0, wheel: 0 }; },
    update: function (sim, dt) {
      var s = sim.state, a = net(sim.p) / sim.p.mass;
      s.v += a * dt; s.x += s.v * dt; s.wheel += s.v * dt / 0.12;
    },
    finished: function (sim) { return Math.abs(sim.state.x) >= YARD; },
    sample: function (sim) { return [sim.state.v]; },
    status: function (sim) {
      var s = sim.state;
      return (Math.abs(s.x) >= YARD ? 'Reached the end of the yard (' + YARD + ' m)' : sim.running ? 'Pulling' : sim.time > 0 ? 'Paused' : 'Ready') + ' · t = ' + M.fmt(sim.time, 1) + ' s';
    },
    readout: function (sim) {
      var p = sim.p, F = net(p), s = sim.state;
      return {
        L: p.left, R: p.right, F: F === 0 ? '0 N' : Math.abs(F) + ' N to the ' + dirWord(F),
        kind: F === 0 ? 'Balanced' : 'Unbalanced', a: F / p.mass, v: Math.abs(s.v), x: s.x
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, F = net(p);
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560;
      var tw = Math.min(170, W * 0.22), th = tw * 0.55, pxm = tw; // the trolley is 1 m long
      var groundY = H * 0.62, cx = W / 2;

      // ground with metre marks (camera follows the trolley)
      ctx.fillStyle = D.alpha(c.muted, 0.12); ctx.fillRect(0, groundY, W, H - groundY);
      D.line(ctx, 0, groundY, W, groundY, c.axis, 2);
      var first = Math.floor(s.x - cx / pxm) - 1, last = Math.ceil(s.x + cx / pxm) + 1;
      for (var m = first; m <= last; m++) {
        var gx = cx + (m - s.x) * pxm;
        D.line(ctx, gx, groundY, gx, groundY + (m === 0 ? 18 : 9), m === 0 ? c.accent : c.axis, m === 0 ? 3 : 1);
        if (m % (narrow ? 2 : 1) === 0) D.text(ctx, m + ' m', gx, groundY + 26, { color: m === 0 ? c.accent : c.muted, size: 11, weight: m === 0 ? 700 : 500, align: 'center' });
      }
      var sx = cx - s.x * pxm;
      if (sx > -20 && sx < W + 20) D.text(ctx, '⚑ start', sx + 4, groundY - 10, { color: c.accent, size: 11, weight: 700 });

      // trolley: box of sacks on a flat cart
      var tx = cx - tw / 2, wr = th * 0.2, deckY = groundY - wr * 2 - 2;
      D.roundRect(ctx, tx, deckY - th * 0.2, tw, th * 0.2, 3, c.light ? '#64748b' : '#94a3b8');
      D.roundRect(ctx, tx + tw * 0.12, deckY - th * 0.2 - th * 0.7, tw * 0.76, th * 0.7, 6, c.light ? '#d6a760' : '#b08850', '#78350f', 1.5);
      D.text(ctx, p.mass + ' kg', cx, deckY - th * 0.55, { color: '#1f1206', size: Math.max(11, tw * 0.13), weight: 700, align: 'center' });
      [tx + tw * 0.22, tx + tw * 0.78].forEach(function (wx) {
        D.circle(ctx, wx, groundY - wr - 1, wr, c.surface2, c.ink, 2);
        D.line(ctx, wx, groundY - wr - 1, wx + Math.cos(s.wheel) * wr, groundY - wr - 1 + Math.sin(s.wheel) * wr, c.ink, 1.5);
      });

      // ropes and teams (drawn at a fixed pixel size, not to scale)
      var ropeY = deckY - th * 0.1, ph = Math.min(110, H * 0.24);
      var room = cx - tw / 2 - 16, gap = Math.min(ph * 0.5, room / 4.6);
      [[-1, p.left, c.s1], [1, p.right, c.s2]].forEach(function (T) {
        var side = T[0], f = T[1], col = T[2];
        var n = f === 0 ? 0 : Math.min(4, Math.max(1, Math.round(f / 100)));
        var edge = cx + side * tw / 2, end = edge + side * (tw * 0.35 + n * gap);
        if (n > 0) {
          D.line(ctx, edge, ropeY, end, ropeY, c.light ? '#92400e' : '#d6b27a', 3);
          for (var i = 0; i < n; i++) person(ctx, edge + side * (tw * 0.35 + (i + 0.6) * gap), groundY, ph, -side, col, ropeY, f / 400);
        } else { // slack rope on the floor
          ctx.save(); ctx.strokeStyle = c.light ? '#92400e' : '#d6b27a'; ctx.lineWidth = 3; ctx.beginPath();
          ctx.moveTo(edge, ropeY); ctx.quadraticCurveTo(edge + side * tw * 0.3, groundY + 4, edge + side * tw * 0.7, groundY - 2); ctx.stroke(); ctx.restore();
        }
      });

      // force arrows (scale: 400 N ↔ 40 % of half the canvas)
      var ak = (W * 0.2) / 400, ay = deckY - th * 1.25 - 20;
      if (p.left > 0) D.arrow(ctx, tx, ay, tx - p.left * ak, ay, c.s1, 4, 12);
      if (p.right > 0) D.arrow(ctx, tx + tw, ay, tx + tw + p.right * ak, ay, c.s2, 4, 12);
      D.text(ctx, p.left + ' N', tx - 6, ay - 15, { color: c.s1, size: 12, weight: 700, align: 'right', fit: W });
      D.text(ctx, p.right + ' N', tx + tw + 6, ay - 15, { color: c.s2, size: 12, weight: 700, fit: W });

      // net force arrow under the ground marks
      var ny = groundY + 52;
      if (ny < H - 10) {
        if (F !== 0) {
          D.arrow(ctx, cx, ny, cx + F * ak, ny, c.warning, 5, 14);
          D.text(ctx, 'net force ' + Math.abs(F) + ' N', cx - (F > 0 ? 8 : -8), ny, { color: c.warning, size: 12, weight: 700, align: F > 0 ? 'right' : 'left', fit: W });
        } else {
          D.text(ctx, 'net force = 0', cx, ny, { color: c.success, size: 13, weight: 700, align: 'center' });
        }
      }

      // headline
      var moving = Math.abs(s.v) > 0.005, msg, col;
      if (F === 0) {
        col = c.success;
        msg = moving ? 'Balanced: no change in motion, it keeps going at ' + M.fmt(Math.abs(s.v), 2) + ' m/s' : 'Balanced forces: the trolley stays at rest';
      } else {
        col = c.warning;
        var speeding = !moving || (s.v > 0) === (F > 0);
        msg = 'Unbalanced: net ' + Math.abs(F) + ' N to the ' + dirWord(F) + (sim.time === 0 && !moving ? ' (press Start)' : speeding ? ', speeding up' : ', slowing down');
      }
      D.text(ctx, msg, W / 2, 16, { color: col, size: narrow ? 12 : 15, weight: 700, align: 'center', fit: W });
    }
  });
})();
