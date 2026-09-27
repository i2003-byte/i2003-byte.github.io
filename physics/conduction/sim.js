/* =====================================================================
   Heat · Conduction — sim.js
   ---------------------------------------------------------------------
   A rod is heated at one end by a candle. Heat is passed along from
   particle to particle (conduction). Pins stuck on with wax drop off one
   by one as the wax melts (at 55 °C).
   Model: 1-D heat equation on N cells with heat loss to the air
     dT/dt = α·∂²T/∂x² − h·(T − T_room),   hot end held at the flame temp.
   α values are scaled for the classroom (not real units) but keep the
   right order: copper > aluminium > iron ≫ glass > wood.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var N = 30, DX = 1 / N, ROOM = 25, FLAME = 300, MELT = 55, H_LOSS = 0.16;
  var PINS = [0.2, 0.35, 0.5, 0.65, 0.8];
  var MATS = {
    copper: { a: 0.08, name: 'Copper', color: '#c2703d', good: true },
    aluminium: { a: 0.064, name: 'Aluminium', color: '#a8b3bf', good: true },
    iron: { a: 0.016, name: 'Iron', color: '#6b7280', good: true },
    glass: { a: 0.0008, name: 'Glass', color: '#9fd8e0', good: false },
    wood: { a: 0.00016, name: 'Wood', color: '#9a6b3f', good: false }
  };

  function heatColor(t) { // dark → red → orange → yellow as the rod heats
    var k = M.clamp((t - ROOM) / (FLAME - ROOM), 0, 1);
    var r = Math.round(M.lerp(90, 255, Math.min(1, k * 2))), g = Math.round(M.lerp(20, 220, Math.max(0, k * 1.6 - 0.6))), b = Math.round(M.lerp(20, 60, k));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function tempAt(s, x) { return s.T[M.clamp(Math.round(x * N - 0.5), 0, N - 1)]; }

  SimLab.createSim({
    ariaLabel: 'A metal rod heated by a candle at one end, with pins stuck on by wax that drop as heat travels along it',
    autoplay: true,
    params: [
      { id: 'mat', label: 'Rod made of', type: 'select', value: 'copper', options: Object.keys(MATS).map(function (k) {
        return { value: k, label: MATS[k].name + (MATS[k].good ? ' (metal)' : '') };
      }) },
      { id: 'flame', label: 'Candle lit', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 't', label: 'Time', unit: 's', digits: 1 },
      { id: 'pins', label: 'Pins dropped', key: true },
      { id: 'far', label: 'Far end temperature', unit: '°C', digits: 0 },
      { id: 'kind', label: 'This material is a…', key: true }
    ],
    graph: { title: 'Temperature along the rod', yLabel: '°C', series: [{ label: 'near candle' }, { label: 'middle' }, { label: 'far end' }], window: 40, yMin: 0 },
    onParam: function (sim, id) { if (id === 'flame') { sim.play(); return true; } return false; },
    reset: function (sim) {
      var T = []; for (var i = 0; i < N; i++) T.push(ROOM);
      sim.state = { T: T, pins: PINS.map(function (x) { return { x: x, fall: 0, v: 0, down: false }; }) };
    },
    update: function (sim, dt) {
      var s = sim.state, T = s.T, a = MATS[sim.p.mat].a, next = T.slice();
      for (var i = 0; i < N; i++) {
        var l = i > 0 ? T[i - 1] : T[i], r = i < N - 1 ? T[i + 1] : T[i];
        next[i] = T[i] + dt * (a * (l - 2 * T[i] + r) / (DX * DX) - H_LOSS * (T[i] - ROOM));
      }
      if (sim.p.flame) { next[0] = FLAME; next[1] = Math.max(next[1], FLAME * 0.9); }
      s.T = next;
      s.pins.forEach(function (p) {
        if (!p.down && tempAt(s, p.x) >= MELT) p.down = true;
        if (p.down && p.fall < 1) { p.v += 3 * dt; p.fall = Math.min(1, p.fall + p.v * dt); }
      });
    },
    sample: function (sim) { var s = sim.state; return [tempAt(s, 0.1), tempAt(s, 0.5), tempAt(s, 0.95)]; },
    readout: function (sim) {
      var s = sim.state, n = s.pins.filter(function (p) { return p.down; }).length;
      return { t: sim.time, pins: n + ' of ' + PINS.length, far: tempAt(s, 0.95),
        kind: MATS[sim.p.mat].good ? 'Good conductor' : 'Poor conductor (insulator)' };
    },
    status: function (sim) { return (sim.p.flame ? '🕯️ Heating ' : 'Cooling ') + MATS[sim.p.mat].name.toLowerCase() + ' rod · t = ' + M.fmt(sim.time, 1) + ' s'; },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, mat = MATS[sim.p.mat];
      var narrow = W < 520;
      D.clear(ctx, W, H, c.bg);
      var x0 = W * 0.06, x1 = W * 0.9, len = x1 - x0, ry = H * 0.3, rh = narrow ? 14 : 20, table = H * 0.86;

      // table and stand
      D.line(ctx, 0, table, W, table, c.axis, 2);
      D.roundRect(ctx, x1 - 4, ry - rh, 14, table - ry + rh, 3, c.surface2, c.border, 1);
      D.roundRect(ctx, x1 - 24, table - 8, 54, 8, 3, c.surface2, c.border, 1);

      // rod: base material colour, glowing where hot
      D.roundRect(ctx, x0, ry - rh / 2, len, rh, 4, mat.color);
      for (var i = 0; i < N; i++) {
        var k = M.clamp((s.T[i] - ROOM) / (FLAME - ROOM), 0, 1);
        ctx.fillStyle = D.alpha(heatColor(s.T[i]), Math.min(1, k * 1.8));
        ctx.fillRect(x0 + i * len / N, ry - rh / 2, len / N + 0.5, rh);
      }
      ctx.strokeStyle = c.border; ctx.lineWidth = 1; ctx.strokeRect(x0, ry - rh / 2, len, rh);

      // particles inside the rod jiggle more where it is hotter
      var np = narrow ? 18 : 30;
      for (var j = 0; j < np; j++) {
        var fx = (j + 0.5) / np, amp = sim.reduceMotion ? 0 : (tempAt(s, fx) - ROOM) / (FLAME - ROOM) * rh * 0.3;
        var px = x0 + fx * len + Math.sin(now / 37 + j * 2.1) * amp, py = ry + Math.cos(now / 29 + j * 1.3) * amp;
        D.circle(ctx, px, py, narrow ? 1.8 : 2.4, D.alpha(c.ink, 0.7));
      }

      // pins with wax
      s.pins.forEach(function (p) {
        var px = x0 + p.x * len, top = ry + rh / 2, pl = narrow ? 22 : 32;
        if (!p.down) {
          D.circle(ctx, px, top + 3, narrow ? 5 : 7, '#f5f0d8', c.border, 1);
          D.line(ctx, px, top + 6, px, top + pl, c.ink, 2); D.circle(ctx, px, top + 4, 2.5, c.danger);
        } else {
          var y = M.lerp(top + 6, table - 4, p.fall);
          if (p.fall < 1) D.line(ctx, px, y, px, y + pl * 0.8, c.ink, 2);
          else { D.line(ctx, px - pl / 2, table - 3, px + pl / 2, table - 3, c.ink, 2); D.circle(ctx, px - pl / 2, table - 3, 2.5, c.danger); }
          D.circle(ctx, px, top + 2, 3, D.alpha('#f5f0d8', 0.6)); // melted wax drip
        }
        D.text(ctx, M.fmt(tempAt(s, p.x), 0) + '°', px, ry - rh / 2 - 12, { color: c.muted, size: narrow ? 9 : 11, align: 'center' });
      });

      // candle under the hot end
      var cx = x0 + len * 0.03, cTop = ry + rh / 2 + (narrow ? 34 : 44);
      D.roundRect(ctx, cx - 9, cTop, 18, table - cTop, 3, '#f5f0d8', c.border, 1);
      D.line(ctx, cx, cTop, cx, cTop - 5, c.ink, 1.5);
      if (sim.p.flame) {
        var fl = sim.reduceMotion ? 0 : Math.sin(now / 60) * 2;
        ctx.save(); ctx.fillStyle = '#fbbf24'; ctx.beginPath();
        ctx.ellipse(cx, cTop - 16 + fl / 2, 7, 13 + fl, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.ellipse(cx, cTop - 12, 3.5, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      // heat-flow arrow and label
      if (sim.p.flame) D.arrow(ctx, x0 + len * 0.12, ry - rh / 2 - 32, x0 + len * 0.45, ry - rh / 2 - 32, c.warning, 2.5, 9);
      D.text(ctx, 'heat flows from hot to cold →', x0 + len * 0.12, ry - rh / 2 - 48, { color: c.warning, size: narrow ? 10 : 12, weight: 600 });
      D.text(ctx, mat.name + ' rod', x1 - 8, H - 12, { color: c.muted, size: 12, align: 'right' });
    }
  });
})();
