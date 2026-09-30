/* =====================================================================
   Motion · Uniform Circular Motion — sim.js
   ---------------------------------------------------------------------
   A stone tied to a string is whirled in a horizontal circle (top view)
   of radius r, taking T seconds for one round.
     speed v = 2πr ÷ T   (constant)
     angle turned θ = 2π t ÷ T
     velocity = v along the tangent: (−v sin θ, v cos θ)
   The speed stays the same but the direction keeps changing, so the
   velocity changes: the motion is accelerated. The acceleration points
   to the centre, a = v² ÷ r (Class 11 idea, optional arrow).
   Cutting the string removes the pull, and the stone flies off in a
   straight line along the tangent at the speed it had.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var VIEW_M = 2.4;             // half-width of the view in metres

  function speed(p) { return 2 * Math.PI * p.r / p.T; }

  function velStr(v) { return M.fmt(v, 2) + ' m/s'; }
  function bearing(vx, vy) {           // compass direction of the velocity (x east, y north)
    var d = (M.deg(Math.atan2(vx, vy)) + 360) % 360;
    var names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return names[Math.round(d / 45) % 8] + ' (' + M.fmt(d, 0) + '°)';
  }

  SimLab.createSim({
    ariaLabel: 'Top view of a stone whirled on a string in a circle, with its velocity arrow along the tangent; the string can be cut so the stone flies off in a straight line',
    mobileAspect: '1 / 1.08',
    autoplay: true,
    params: [
      { id: 'r', label: 'Radius of the circle r', min: 0.3, max: 2, step: 0.1, value: 1, unit: 'm' },
      { id: 'T', label: 'Time for one round T', min: 0.5, max: 5, step: 0.1, value: 2, unit: 's',
        presets: [{ label: '0.5 s', value: 0.5 }, { label: '1 s', value: 1 }, { label: '2 s', value: 2 }, { label: '4 s', value: 4 }] },
      { id: 'many', label: 'Show velocity at 8 points round the circle', type: 'toggle', value: true },
      { id: 'pull', label: 'Show the pull towards the centre (Class 11)', type: 'toggle', value: false }
    ],
    buttonsTitle: 'The string',
    buttons: [
      { label: '✂ Cut the string', primary: true, onClick: function (sim) { cut(sim); } },
      { label: 'Tie a new string', onClick: function (sim) { sim.reset(); sim.play(); } }
    ],
    readouts: [
      { id: 'v', label: 'Speed v = 2πr ÷ T', unit: 'm/s', digits: 2, key: true },
      { id: 'circ', label: 'Circumference 2πr', unit: 'm', digits: 2 },
      { id: 'rpm', label: 'Rounds per minute', unit: 'rpm', digits: 0 },
      { id: 'dir', label: 'Direction of velocity now' },
      { id: 'rounds', label: 'Rounds completed' },
      { id: 'ac', label: 'Centripetal acceleration v² ÷ r', unit: 'm/s²', digits: 1 }
    ],
    graph: { title: 'Velocity parts: east–west (vₓ) and north–south (vᵧ)', yLabel: 'm/s', window: 6,
      series: [{ label: 'vₓ (east +)', color: '--sim-1' }, { label: 'vᵧ (north +)', color: '--sim-3' }, { label: 'speed', color: '--sim-2' }] },
    onParam: function (sim, id) {
      if (id === 'many' || id === 'pull') return true;
      if (sim.state.cut) sim.state.cut = null;      // new settings: tie again
      sim.state.trail = [];
      return true;
    },
    pointer: { down: function (sim) { cut(sim); return false; }, hover: function (sim) { return !sim.state.cut; } },

    reset: function (sim) { sim.state = { th: 0, rounds: 0, cut: null, trail: [] }; },
    update: function (sim, dt) {
      var st = sim.state, p = sim.p, w = 2 * Math.PI / p.T;
      if (st.cut) { st.cut.x += st.cut.vx * dt; st.cut.y += st.cut.vy * dt; st.cut.t += dt; return; }
      st.th += w * dt;
      if (st.th >= 2 * Math.PI) { st.th -= 2 * Math.PI; st.rounds++; }
      st.trail.push([p.r * Math.cos(st.th), p.r * Math.sin(st.th)]);
      if (st.trail.length > 240 * Math.min(p.T, 1.5) * 0.6) st.trail.shift();
    },
    finished: function (sim) { var k = sim.state.cut; return !!k && Math.hypot(k.x, k.y) > VIEW_M * 1.6; },
    sample: function (sim) {
      var st = sim.state, v = speed(sim.p);
      if (st.cut) return [st.cut.vx, st.cut.vy, v];
      return [-v * Math.sin(st.th), v * Math.cos(st.th), v];
    },
    status: function (sim) {
      var st = sim.state;
      if (st.cut) return Math.hypot(st.cut.x, st.cut.y) > VIEW_M * 1.6 ? 'Stone has flown away in a straight line' : 'String cut! Flying along the tangent';
      return sim.running ? 'Whirling · tap the canvas to cut the string' : 'Paused';
    },
    readout: function (sim) {
      var p = sim.p, st = sim.state, v = speed(p), vx, vy;
      if (st.cut) { vx = st.cut.vx; vy = st.cut.vy; } else { vx = -v * Math.sin(st.th); vy = v * Math.cos(st.th); }
      return { v: v, circ: 2 * Math.PI * p.r, rpm: 60 / p.T, dir: bearing(vx, vy), rounds: String(st.rounds) + (st.cut ? ' (string cut)' : ''), ac: st.cut ? 0 : v * v / p.r };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, st = sim.state, narrow = W < 560;
      var top = 40, cx = W / 2, cy = top + (H - top) / 2, s = Math.min(W, H - top) / 2 / VIEW_M * 0.94;
      var v = speed(p), rpx = p.r * s;
      function X(x) { return cx + x * s; }
      function Y(y) { return cy - y * s; }
      // arrow length: 0.25 s worth of motion, kept on screen
      var aLen = M.clamp(v * 0.25 * s, 18, Math.min(W, H) * 0.3);
      D.clear(ctx, W, H, c.bg);
      D.grid(ctx, 0, top, W, H - top, s * 0.5, c.grid);

      // circle path and centre peg
      ctx.save(); ctx.setLineDash([6, 6]); D.circle(ctx, cx, cy, rpx, null, D.alpha(c.ink, 0.35), 1.5); ctx.restore();
      D.circle(ctx, cx, cy, 6, c.surface2, c.ink, 2);
      D.text(ctx, 'r = ' + M.fmt(p.r, 1) + ' m', cx + rpx / 2, cy + 12, { color: c.muted, size: 11, align: 'center' });
      D.line(ctx, cx, cy, cx + rpx, cy, D.alpha(c.muted, 0.5), 1, [3, 4]);

      // velocity at 8 fixed points
      if (p.many) {
        for (var k = 0; k < 8; k++) {
          var a = k * Math.PI / 4, px = X(p.r * Math.cos(a)), py = Y(p.r * Math.sin(a));
          D.circle(ctx, px, py, 3, D.alpha(c.s2, 0.6));
          D.arrow(ctx, px, py, px - Math.sin(a) * aLen * 0.7, py - Math.cos(a) * aLen * 0.7, D.alpha(c.s2, 0.45), 2, 7);
        }
      }
      // trail
      if (st.trail.length > 1) {
        ctx.save(); ctx.lineCap = 'round';
        for (var i = 1; i < st.trail.length; i++) {
          ctx.strokeStyle = D.alpha(c.s1, 0.6 * i / st.trail.length); ctx.lineWidth = 3; ctx.beginPath();
          ctx.moveTo(X(st.trail[i - 1][0]), Y(st.trail[i - 1][1])); ctx.lineTo(X(st.trail[i][0]), Y(st.trail[i][1])); ctx.stroke();
        }
        ctx.restore();
      }

      var sx, sy, vx, vy, headline, hc = c.s1;
      if (st.cut) {
        sx = X(st.cut.x); sy = Y(st.cut.y); vx = st.cut.vx; vy = st.cut.vy;
        // tangent line from the cut point
        D.line(ctx, X(st.cut.x0), Y(st.cut.y0), X(st.cut.x0 + vx * 10), Y(st.cut.y0 + vy * 10), D.alpha(c.warning, 0.6), 2, [8, 6]);
        D.circle(ctx, X(st.cut.x0), Y(st.cut.y0), 4, c.warning);
        // loose string end on the peg
        D.line(ctx, cx, cy, cx + (X(st.cut.x0) - cx) * 0.35, cy + (Y(st.cut.y0) - cy) * 0.35, c.ink, 1.5);
        headline = 'No pull from the string → the stone goes straight along the tangent';
        hc = c.warning;
      } else {
        sx = X(p.r * Math.cos(st.th)); sy = Y(p.r * Math.sin(st.th));
        vx = -v * Math.sin(st.th); vy = v * Math.cos(st.th);
        D.line(ctx, cx, cy, sx, sy, c.ink, 1.5);
        headline = 'Same speed all the time, but the direction keeps changing';
      }
      // stone and its velocity arrow
      var onScreen = sx > -20 && sx < W + 20 && sy > top - 20 && sy < H + 20;
      if (onScreen) {
        var ux = vx / v, uy = vy / v;
        D.arrow(ctx, sx, sy, sx + ux * aLen, sy - uy * aLen, c.s2, 3.5, 11);
        D.text(ctx, 'v = ' + velStr(v), sx + ux * aLen + (ux >= 0 ? 8 : -8), sy - uy * aLen - 10, { color: c.s2, size: 12, weight: 700, align: ux >= 0 ? 'left' : 'right', bg: D.alpha(c.bg, 0.8), fit: W });
        if (p.pull && !st.cut) {
          var pl = Math.min(rpx * 0.7, aLen);
          D.arrow(ctx, sx, sy, sx + (cx - sx) / rpx * pl, sy + (cy - sy) / rpx * pl, c.danger, 3, 9);
          D.text(ctx, 'a = v²/r = ' + M.fmt(v * v / p.r, 1) + ' m/s²', sx + (cx - sx) / rpx * pl * 0.5, sy + (cy - sy) / rpx * pl * 0.5 + 14, { color: c.danger, size: 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), fit: W });
        }
        D.circle(ctx, sx, sy, narrow ? 9 : 11, '#94a3b8', c.bg, 2);
        D.circle(ctx, sx - 3, sy - 3, 3, D.alpha('#ffffff', 0.5));
      }

      var fs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif';
      while (fs > 9 && ctx.measureText(headline).width > W - 30) { fs -= 0.5; ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, headline, W / 2, 18, { color: c.bg, bg: hc, size: fs, weight: 700, align: 'center', pad: 5, fit: W });
      if (!st.cut) D.text(ctx, 'Tap to cut the string', W - 10, H - 12, { color: c.faint, size: 11, align: 'right' });
    }
  });

  function cut(sim) {
    var st = sim.state, p = sim.p, v = speed(p);
    if (st.cut) return;
    var x = p.r * Math.cos(st.th), y = p.r * Math.sin(st.th);
    st.cut = { x: x, y: y, x0: x, y0: y, vx: -v * Math.sin(st.th), vy: v * Math.cos(st.th), t: 0 };
    st.trail = [];
    if (!sim.running) sim.play();
    sim.redraw();
  }
})();
