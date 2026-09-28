/* =====================================================================
   Friction · Friction on Different Surfaces — sim.js
   ---------------------------------------------------------------------
   A wooden block is pulled along a surface with a spring balance.
       weight (normal force)       N = m g
       largest static friction     f_s,max = μs N   (block stays still
                                   while the pull is smaller than this)
       sliding (kinetic) friction  f_k = μk N       (μk < μs)
   While the block is at rest the friction exactly matches the pull.
   Once it slides, a = (pull − f_k) ÷ m.
   "Slow pull test" raises the pull by 2 N every second until the block
   just starts to move, then pulls only as hard as needed to keep it
   sliding at a steady speed, so the balance reading drops from
   f_s,max to f_k.
   The μ values are typical classroom values for wood on each surface;
   real values vary with cleanliness, moisture and wear.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, g = 9.8;
  var TRACK = 0.7, RATE = 2; // m of travel; N per second in the slow pull test
  var SURF = {
    glass: { name: 'Glass sheet', us: 0.30, uk: 0.22, col: '#93c5fd', bump: 0.6 },
    tile: { name: 'Polished floor tile', us: 0.40, uk: 0.30, col: '#cbd5e1', bump: 1.2 },
    wood: { name: 'Wooden plank', us: 0.50, uk: 0.38, col: '#d6a760', bump: 2 },
    cloth: { name: 'Cotton cloth', us: 0.62, uk: 0.48, col: '#f9a8d4', bump: 3 },
    sand: { name: 'Sandpaper', us: 0.85, uk: 0.68, col: '#a8a29e', bump: 4.5 }
  };

  function forces(p) { var s = SURF[p.surface], N = p.mass * g; return { N: N, fs: s.us * N, fk: s.uk * N }; }
  function pullNow(sim) {
    var s = sim.state, f = forces(sim.p);
    if (s.mode !== 'ramp') return sim.p.pull;
    return s.moving ? f.fk + 0.05 : Math.min(s.t * RATE, f.fs + 0.001);
  }
  function friction(sim) {
    var s = sim.state, f = forces(sim.p), F = pullNow(sim);
    return s.moving || s.x >= TRACK ? (s.v > 0 ? f.fk : Math.min(F, f.fs)) : Math.min(F, f.fs);
  }

  SimLab.createSim({
    ariaLabel: 'A wooden block pulled along a surface by a spring balance, with arrows for the pull and the friction force and a magnified view of the rough surfaces',
    playLabel: 'Pull',
    mobileAspect: '4 / 5',
    params: [
      { id: 'surface', label: 'Surface', type: 'select', value: 'wood', options: Object.keys(SURF).map(function (k) { return { value: k, label: SURF[k].name }; }) },
      { id: 'mass', label: 'Mass of the block', min: 0.5, max: 5, step: 0.5, value: 2, unit: 'kg' },
      { id: 'pull', label: 'Pull on the spring balance', min: 0, max: 40, step: 0.5, value: 5, unit: 'N',
        help: 'Press Pull, then raise the pull slowly. Or try the slow pull test below.' }
    ],
    buttons: [
      { label: 'Slow pull test (2 N every second)', primary: true, onClick: function (sim) { sim.reset(); sim.state.mode = 'ramp'; sim.play(); } }
    ],
    buttonsTitle: 'Experiment',
    readouts: [
      { id: 'N', label: 'Weight of the block m g', unit: 'N', digits: 1 },
      { id: 'fs', label: 'Force needed to start it (static)', unit: 'N', digits: 1, key: true },
      { id: 'fk', label: 'Force to keep it sliding', unit: 'N', digits: 1, key: true },
      { id: 'F', label: 'Spring balance reads', unit: 'N', digits: 1 },
      { id: 'fr', label: 'Friction now', unit: 'N', digits: 1 },
      { id: 'state', label: 'Block' }
    ],
    graph: { title: 'Pull and friction vs time', yLabel: 'force (N)', series: [{ label: 'pull', color: '--sim-2' }, { label: 'friction', color: '--sim-4' }], window: 12 },

    onParam: function (sim, id) { if (id === 'pull') { sim.state.mode = 'manual'; return true; } return false; },
    reset: function (sim) { sim.state = { x: 0, v: 0, t: 0, moving: false, mode: 'manual', startF: null }; },
    update: function (sim, dt) {
      var s = sim.state, f = forces(sim.p);
      s.t += dt;
      var F = pullNow(sim);
      if (!s.moving) {
        if (F > f.fs) { s.moving = true; s.startF = F; }
        else return;
      }
      var a = (F - f.fk) / sim.p.mass;
      s.v = Math.max(0, s.v + a * dt); s.x += s.v * dt;
      if (s.mode === 'ramp' && s.v < 0.05) s.v = 0.05; // the steady pull test keeps it creeping forward
      if (s.v === 0 && F <= f.fs) s.moving = false; // stopped again
    },
    finished: function (sim) { return sim.state.x >= TRACK; },
    sample: function (sim) { return [pullNow(sim), friction(sim)]; },
    status: function (sim) {
      var s = sim.state;
      return (s.x >= TRACK ? 'Reached the end' : sim.running ? (s.mode === 'ramp' ? 'Slow pull test' : 'Pulling') : 'Paused') + ' · t = ' + M.fmt(sim.time, 1) + ' s';
    },
    readout: function (sim) {
      var s = sim.state, f = forces(sim.p);
      return { N: f.N, fs: f.fs, fk: f.fk, F: pullNow(sim), fr: friction(sim), state: s.moving ? 'sliding at ' + M.fmt(s.v, 2) + ' m/s' : s.x > 0 ? 'stopped' : 'at rest' };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, S = SURF[p.surface], f = forces(p);
      var F = pullNow(sim), fr = friction(sim);
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560;
      var surfY = H * (narrow ? 0.4 : 0.45), bw = Math.min(140, W * 0.2), bh = bw * 0.55, balLen = Math.min(150, W * 0.28);
      var x0 = 16, travel = W - x0 - bw - balLen - 40, bx = x0 + travel * Math.min(1, s.x / TRACK);

      // surface strip with texture
      D.roundRect(ctx, 6, surfY, W - 12, 18, 3, S.col);
      var r = M.rng(3);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (var i = 0; i < W / 3; i++) ctx.fillRect(8 + r() * (W - 16), surfY + 1 + r() * 15, S.bump * 0.6 + 0.6, S.bump * 0.6 + 0.6);
      D.text(ctx, S.name, W - 12, surfY + 32, { color: c.muted, size: 11, weight: 600, align: 'right' });
      for (var m = 0; m <= 7; m++) { // 10 cm marks along the travel
        var mx = x0 + travel * m / 7;
        D.line(ctx, mx, surfY + 18, mx, surfY + 24, c.axis, 1);
      }
      D.text(ctx, 'marks every 10 cm', x0, surfY + 32, { color: c.muted, size: 10 });

      // block
      D.roundRect(ctx, bx, surfY - bh, bw, bh, 4, '#b7793a', '#78350f', 2);
      ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
      for (i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(bx + 4, surfY - bh + bh * i / 4); ctx.bezierCurveTo(bx + bw * 0.4, surfY - bh + bh * i / 4 - 4, bx + bw * 0.6, surfY - bh + bh * i / 4 + 4, bx + bw - 4, surfY - bh + bh * i / 4); ctx.stroke(); }
      ctx.restore();
      D.text(ctx, p.mass + ' kg', bx + bw / 2, surfY - bh / 2, { color: '#1f1206', size: 13, weight: 700, align: 'center' });

      // spring balance: hook → spring (stretch ∝ reading) → body with scale → hand
      var hy = surfY - bh * 0.5, hx = bx + bw, stretch = Math.min(1, F / 40);
      var springL = balLen * (0.25 + 0.35 * stretch), bodyX = hx + springL + 8, bodyW = balLen * 0.55;
      D.line(ctx, hx, hy, hx + 8, hy, c.ink, 2);
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx + 8, hy);
      for (i = 1; i <= 10; i++) ctx.lineTo(hx + 8 + springL * i / 10, hy + (i % 2 ? -5 : 5) * (i === 10 ? 0 : 1));
      ctx.stroke(); ctx.restore();
      D.roundRect(ctx, bodyX, hy - 11, bodyW, 22, 5, c.surface2, c.border, 1.5);
      var tickMax = 40;
      for (i = 0; i <= tickMax; i += 10) { var tx = bodyX + 6 + (bodyW - 12) * i / tickMax; D.line(ctx, tx, hy - 10, tx, hy - 4, c.muted, 1); }
      var needle = bodyX + 6 + (bodyW - 12) * Math.min(1, F / tickMax);
      D.line(ctx, needle, hy - 10, needle, hy + 10, c.danger, 2.5);
      D.text(ctx, M.fmt(F, 1) + ' N', bodyX + bodyW / 2, hy - 22, { color: c.s2, size: 13, weight: 700, align: 'center', fit: W });
      // hand
      D.circle(ctx, bodyX + bodyW + 12, hy, 10, c.light ? '#f5c9a1' : '#e8b48a', '#8a5a3b', 1.5);
      D.line(ctx, bodyX + bodyW, hy, bodyX + bodyW + 4, hy, c.ink, 2);

      // force arrows: pull (right, above) and friction (left, at the contact)
      var ak = Math.min(W * 0.22, 160) / 40;
      if (F > 0.01) D.arrow(ctx, bx + bw / 2, surfY - bh - 16, bx + bw / 2 + F * ak, surfY - bh - 16, c.s2, 4, 11);
      if (fr > 0.01) D.arrow(ctx, bx + bw / 2, surfY + 8, bx + bw / 2 - fr * ak, surfY + 8, c.s4, 4, 11);
      D.text(ctx, 'pull', bx + bw / 2 - 6, surfY - bh - 16, { color: c.s2, size: 11, weight: 700, align: 'right' });
      if (fr > 0.01) D.text(ctx, 'friction ' + M.fmt(fr, 1) + ' N', Math.max(4, bx + bw / 2 - fr * ak), surfY + 46, { color: c.s4, size: 11, weight: 700, fit: W });

      // magnified view of the two surfaces
      var zr = Math.min(narrow ? 58 : 70, H * 0.18), zx = narrow ? W / 2 : W * 0.3, zy = H - zr - 10;
      if (zy - zr > surfY + 54) {
        ctx.save(); ctx.beginPath(); ctx.arc(zx, zy, zr, 0, Math.PI * 2); ctx.clip();
        D.clear(ctx, W, H, c.surface);
        var shift = (s.x * 900) % 20, amp = S.bump * zr / 26;
        ctx.fillStyle = '#b7793a'; ctx.beginPath(); ctx.moveTo(zx - zr, zy - zr);
        for (var q = -zr; q <= zr; q += 2) ctx.lineTo(zx + q, zy - 2 - Math.abs(Math.sin((q - shift) * 0.31) * 1.3 + Math.sin((q - shift) * 0.83)) * amp * 0.5);
        ctx.lineTo(zx + zr, zy - zr); ctx.fill();
        ctx.fillStyle = S.col; ctx.beginPath(); ctx.moveTo(zx - zr, zy + zr);
        for (q = -zr; q <= zr; q += 2) ctx.lineTo(zx + q, zy + 2 + Math.abs(Math.sin(q * 0.37) * 1.2 + Math.sin(q * 0.91)) * amp * 0.5 - amp);
        ctx.lineTo(zx + zr, zy + zr); ctx.fill();
        ctx.restore();
        D.circle(ctx, zx, zy, zr, null, c.border, 2);
        D.text(ctx, 'magnified: bumps lock together', zx, zy - zr - 9, { color: c.muted, size: 11, weight: 600, align: 'center', fit: W });
        if (!narrow) {
          var lx = W * 0.55, ly = zy - zr + 14;
          D.text(ctx, 'Starts to move above ' + M.fmt(f.fs, 1) + ' N (static)', lx, ly, { color: c.text, size: 12, weight: 600, fit: W });
          D.text(ctx, 'Keeps sliding with ' + M.fmt(f.fk, 1) + ' N (sliding)', lx, ly + 22, { color: c.text, size: 12, weight: 600, fit: W });
          D.text(ctx, 'μ static ' + S.us + ' · μ sliding ' + S.uk, lx, ly + 44, { color: c.muted, size: 11, fit: W });
        }
      }

      // headline
      var msg, col = c.text;
      if (s.x >= TRACK) { msg = 'Reached the end. Try a rougher surface or a heavier block'; }
      else if (s.moving) { msg = s.startF ? 'Sliding: friction dropped from ' + M.fmt(f.fs, 1) + ' N to ' + M.fmt(f.fk, 1) + ' N' : 'Sliding'; col = c.warning; }
      else if (F > 0.01) { msg = 'Not moving: static friction (' + M.fmt(fr, 1) + ' N) balances the pull'; col = c.success; }
      else msg = sim.time === 0 ? 'Press Pull or try the slow pull test' : 'No pull, no friction';
      D.text(ctx, msg, W / 2, 16, { color: col, size: narrow ? 11 : 14, weight: 700, align: 'center', fit: W });
    }
  });
})();
