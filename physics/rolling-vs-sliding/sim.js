/* =====================================================================
   Friction · Rolling vs Sliding — sim.js
   ---------------------------------------------------------------------
   The Class 8 ramp activity. An object is let go from height h on a
   30° wooden ramp, then runs on to a floor covered with glass, tile,
   cloth or sand until friction stops it.
     On the ramp:   a = g (sin θ − μ_ramp cos θ)
     On the floor:  a = −μ g      → stopping distance d = v² ÷ (2 μ g)
   A wooden block SLIDES (sliding friction, μ ≈ 0.2–0.6); a toy car
   ROLLS on wheels (rolling friction of wheels and axles, μ ≈ 0.1–0.45),
   so it goes much farther from the same height.
   Simplifications: the turn at the foot of the ramp keeps the speed,
   the car's spinning wheels are treated as light, no air resistance.
   The μ values are typical classroom values, not measurements.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, g = 9.8, TH = 30 * Math.PI / 180, FLOOR = 2.4; // m of floor shown
  var OBJ = {
    block: { name: 'Wooden block (slides)', ramp: 0.30 },
    car: { name: 'Toy car (rolls)', ramp: 0.07 }
  };
  var FL = { // μ for the block (sliding) and the car (rolling)
    glass: { name: 'Glass', block: 0.20, car: 0.10, col: '#93c5fd' },
    tile: { name: 'Smooth tile', block: 0.30, car: 0.12, col: '#cbd5e1' },
    cloth: { name: 'Cotton cloth', block: 0.45, car: 0.20, col: '#f9a8d4' },
    sand: { name: 'Layer of sand', block: 0.60, car: 0.45, col: '#d6b27a' }
  };
  var results = {}; // "h|obj|floor" → distance (m), kept while the page is open

  function plan(p) {
    var ramp = p.h / 100 / Math.sin(TH), mr = OBJ[p.obj].ramp, mf = FL[p.floor][p.obj];
    var a1 = g * (Math.sin(TH) - mr * Math.cos(TH)), vb = Math.sqrt(2 * a1 * ramp);
    return { ramp: ramp, a1: a1, vb: vb, mf: mf, d: vb * vb / (2 * mf * g) };
  }

  SimLab.createSim({
    ariaLabel: 'A 30 degree ramp leading on to a covered floor; a block or toy car runs down and stops after some distance, with a table comparing distances on each surface',
    playLabel: 'Let go',
    mobileAspect: '4 / 5',
    params: [
      { id: 'obj', label: 'Object', type: 'select', value: 'car', options: Object.keys(OBJ).map(function (k) { return { value: k, label: OBJ[k].name }; }) },
      { id: 'floor', label: 'Floor covered with', type: 'select', value: 'tile', options: Object.keys(FL).map(function (k) { return { value: k, label: FL[k].name }; }) },
      { id: 'h', label: 'Starting height on the ramp', min: 5, max: 25, step: 1, value: 20, unit: 'cm' }
    ],
    buttons: [{ label: 'Clear the results table', onClick: function () { results = {}; } }],
    buttonsTitle: 'Results',
    readouts: [
      { id: 'vb', label: 'Speed at the foot of the ramp', unit: 'm/s', digits: 2 },
      { id: 'mu', label: 'Friction coefficient μ on the floor' },
      { id: 'x', label: 'Distance on the floor', unit: 'cm', digits: 0, key: true },
      { id: 'd', label: 'Stops after d = v² ÷ (2 μ g)', unit: 'cm', digits: 0 },
      { id: 't', label: 'Time', unit: 's', digits: 2 }
    ],
    graph: { title: 'Speed vs time', yLabel: 'speed (m/s)', series: [{ label: 'speed', color: '--sim-1' }], window: null },

    reset: function (sim) { sim.state = { pl: plan(sim.p), s: 0, v: 0, done: false }; },
    update: function (sim, dt) {
      var st = sim.state, pl = st.pl;
      if (st.done) return;
      if (st.s < pl.ramp) { st.v += pl.a1 * dt; st.s += st.v * dt; }
      else {
        st.v -= pl.mf * g * dt;
        if (st.v <= 0) { st.v = 0; st.done = true; st.s = pl.ramp + pl.d; results[sim.p.h + '|' + sim.p.obj + '|' + sim.p.floor] = pl.d; return; }
        st.s += st.v * dt;
      }
    },
    finished: function (sim) { return sim.state.done; },
    sample: function (sim) { return [sim.state.v]; },
    status: function (sim) {
      var st = sim.state;
      return (st.done ? 'Stopped' : sim.running ? (st.s < st.pl.ramp ? 'On the ramp' : 'On the floor') : sim.time > 0 ? 'Paused' : 'Ready') + ' · t = ' + M.fmt(sim.time, 2) + ' s';
    },
    readout: function (sim) {
      var st = sim.state, pl = st.pl;
      return { vb: pl.vb, mu: String(pl.mf), x: Math.max(0, st.s - pl.ramp) * 100, d: pl.d * 100, t: sim.time };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, st = sim.state, pl = st.pl, F = FL[p.floor];
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560, top = 30;
      var rampW = 0.25 / Math.tan(TH);                       // widest ramp (25 cm high)
      var k = (W - 30) / (rampW + FLOOR), sceneH = Math.min(H * 0.5, 0.25 * k + 90);
      var floorY = top + sceneH - 30, x0 = 12, footX = x0 + rampW * k;

      // ramp (a wedge of wood, always 25 cm tall; the start mark shows h)
      ctx.save(); ctx.fillStyle = c.light ? '#d6a760' : '#8a5a2b'; ctx.beginPath();
      ctx.moveTo(x0, floorY); ctx.lineTo(x0, floorY - 0.25 * k); ctx.lineTo(footX, floorY); ctx.closePath(); ctx.fill(); ctx.restore();
      var sx0 = footX - (p.h / 100) / Math.tan(TH) * k, sy0 = floorY - p.h / 100 * k;
      D.line(ctx, sx0 - 10, sy0, sx0 + 10, sy0 + 0, c.accent, 2);
      D.text(ctx, 'h = ' + p.h + ' cm', sx0 + 8, sy0 - 12, { color: c.accent, size: 11, weight: 700, fit: W });

      // floor covering and 10 cm ruler
      D.roundRect(ctx, footX, floorY, FLOOR * k, 8, 2, F.col);
      var r = M.rng(5); ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (var i = 0; i < 120; i++) ctx.fillRect(footX + r() * FLOOR * k, floorY + 1 + r() * 6, 1.6, 1.6);
      for (var cm = 0; cm <= FLOOR * 100 + 0.1; cm += 10) {
        var rx = footX + cm / 100 * k, big = cm % 50 === 0;
        D.line(ctx, rx, floorY + 8, rx, floorY + (big ? 18 : 12), c.axis, 1);
        if (cm % (narrow ? 100 : 50) === 0) D.text(ctx, cm + ' cm', rx, floorY + 26, { color: c.muted, size: 10, align: 'center', fit: W });
      }

      // the object: position along the ramp, then along the floor
      var ox, oy, ang;
      if (st.s < pl.ramp) { var along = st.s * Math.cos(TH); ox = sx0 + along * k; oy = sy0 + st.s * Math.sin(TH) * k; ang = TH; }
      else { ox = footX + (st.s - pl.ramp) * k; oy = floorY; ang = 0; }
      var ow = Math.max(22, Math.min(40, 0.08 * k)), oh = ow * 0.55;
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(ang);
      if (p.obj === 'block') D.roundRect(ctx, -ow / 2, -oh, ow, oh, 3, '#b7793a', '#78350f', 1.5);
      else {
        var wr = oh * 0.32, spin = (st.s / (wr / k)) || 0;
        D.roundRect(ctx, -ow / 2, -oh, ow, oh - wr, 5, c.danger, c.ink, 1);
        D.roundRect(ctx, -ow * 0.2, -oh - oh * 0.35, ow * 0.45, oh * 0.4, 3, D.alpha(c.s1, 0.8));
        [-ow * 0.28, ow * 0.28].forEach(function (wx) {
          D.circle(ctx, wx, -wr, wr, '#1f2937', c.ink, 1);
          D.line(ctx, wx, -wr, wx + Math.cos(spin) * wr, -wr + Math.sin(spin) * wr, '#e5e7eb', 1);
        });
      }
      ctx.restore();
      if (st.done) {
        D.line(ctx, footX, floorY + 34, ox, floorY + 34, c.warning, 2);
        D.text(ctx, M.fmt(pl.d * 100, 0) + ' cm', (footX + ox) / 2, floorY + 44, { color: c.warning, size: 12, weight: 700, align: 'center', fit: W });
      }

      // results table: objects × floors
      var ty = floorY + 78, tx = narrow ? 10 : W * 0.1, tw = narrow ? W - 20 : W * 0.8;
      var keys = Object.keys(FL), colW = (tw - (narrow ? 70 : 150)) / keys.length, rowH = Math.min(32, (H - ty - 12) / 3.4);
      if (rowH > 16) {
        D.text(ctx, 'Distance on the floor (cm), let go from h = ' + p.h + ' cm', tx, ty - 10, { color: c.text, size: 12, weight: 700, fit: W });
        keys.forEach(function (f, j) {
          D.text(ctx, narrow ? FL[f].name.replace('Layer of ', '').replace('Cotton ', '').replace('Smooth ', '') : FL[f].name, tx + tw - colW * (keys.length - j) + colW / 2, ty + rowH * 0.5,
            { color: f === p.floor ? c.text : c.muted, size: 11, weight: 700, align: 'center' });
        });
        ['car', 'block'].forEach(function (o, i2) {
          var y = ty + rowH * (i2 + 1.5);
          D.text(ctx, o === 'car' ? (narrow ? '🚗 rolls' : '🚗 Toy car (rolls)') : (narrow ? '🧱 slides' : '🧱 Block (slides)'), tx, y, { color: o === p.obj ? c.text : c.muted, size: 12, weight: 700 });
          keys.forEach(function (f, j) {
            var v = results[p.h + '|' + o + '|' + f], cx = tx + tw - colW * (keys.length - j);
            var cur = o === p.obj && f === p.floor;
            D.roundRect(ctx, cx + 3, y - rowH * 0.4, colW - 6, rowH * 0.8, 5, cur ? D.alpha(c.accent, 0.22) : D.alpha(c.muted, 0.1));
            D.text(ctx, v == null ? '—' : M.fmt(v * 100, 0), cx + colW / 2, y, { color: v == null ? c.faint : c.text, size: 13, weight: 700, align: 'center', font: c.mono });
          });
        });
        D.text(ctx, 'Try both objects on every floor from the same height (a fair test)', tx, ty + rowH * 3.3, { color: c.faint, size: 10, fit: W });
      }

      // headline
      var msg = st.done ? (p.obj === 'car' ? 'Rolling friction is small: the car rolls ' + M.fmt(pl.d * 100, 0) + ' cm' : 'Sliding friction is larger: the block stops after ' + M.fmt(pl.d * 100, 0) + ' cm')
        : st.s > pl.ramp ? 'Friction on the ' + F.name.toLowerCase() + ' slows it down' : 'Let it go and see how far it runs on ' + F.name.toLowerCase();
      D.text(ctx, msg, W / 2, 15, { color: st.done ? c.warning : c.text, size: narrow ? 11 : 14, weight: 700, align: 'center', fit: W });
    }
  });
})();
