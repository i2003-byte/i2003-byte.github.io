/* =====================================================================
   Heat · Radiation — sim.js
   ---------------------------------------------------------------------
   A heater sends out heat by RADIATION — it travels in straight lines,
   needs no medium (that's how the Sun's heat crosses empty space) and
   is absorbed best by dark, dull surfaces. Light and shiny surfaces
   reflect most of it.
   Each can:  dT/dt = G·a/(d/40 cm)² − (k·a + h)·(T − T_room)
     a = absorptivity (black 0.95, white 0.3, shiny 0.1) — a good
         absorber is also a good emitter, so it also loses heat faster
         by radiation; h is a small loss to the air (the same for all).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var ROOM = 25, G = 1.8, K = 0.03, HL = 0.02;
  var SURF = {
    black: { a: 0.95, name: 'Black (dull)', fill: '#16181d' },
    dark: { a: 0.75, name: 'Dark blue', fill: '#1e3a8a' },
    white: { a: 0.3, name: 'White', fill: '#f1f5f9' },
    shiny: { a: 0.1, name: 'Shiny silver', fill: 'shiny' }
  };
  var OPTS = Object.keys(SURF).map(function (k) { return { value: k, label: SURF[k].name }; });

  SimLab.createSim({
    ariaLabel: 'A heater in the middle radiating heat to two cans of different colours, each with a thermometer',
    autoplay: true,
    params: [
      { id: 'left', label: 'Left can', type: 'select', value: 'black', options: OPTS },
      { id: 'right', label: 'Right can', type: 'select', value: 'shiny', options: OPTS },
      { id: 'dist', label: 'Distance from heater', min: 20, max: 100, step: 5, value: 40, unit: 'cm' },
      { id: 'on', label: 'Heater on', type: 'toggle', value: true }
    ],
    buttonsTitle: 'Experiments',
    buttons: [
      { label: '♨️ Cooling race: both start at 80 °C', onClick: function (sim) {
        sim.setParam('on', false); sim.reset(); sim.state.T = [80, 80]; sim.graph.clear(); sim.graph.push(0, [80, 80]); sim.play();
      } }
    ],
    readouts: [
      { id: 'l', label: 'Left can', unit: '°C', digits: 1, key: true },
      { id: 'r', label: 'Right can', unit: '°C', digits: 1, key: true },
      { id: 'w', label: 'Warmer can' },
      { id: 't', label: 'Time', unit: 's', digits: 0 }
    ],
    graph: { title: 'Can temperatures', yLabel: '°C', series: [{ label: 'left can' }, { label: 'right can' }], window: 60 },
    onParam: function (sim, id) { if (id === 'on' || id === 'dist') { sim.play(); return true; } return false; },
    reset: function (sim) { sim.state = { T: [ROOM, ROOM] }; },
    update: function (sim, dt) {
      var s = sim.state, inRate = sim.p.on ? G / Math.pow(sim.p.dist / 40, 2) : 0;
      [sim.p.left, sim.p.right].forEach(function (k, i) {
        var a = SURF[k].a;
        s.T[i] += (inRate * a - (K * a + HL) * (s.T[i] - ROOM)) * dt;
      });
    },
    sample: function (sim) { return sim.state.T.slice(); },
    readout: function (sim) {
      var T = sim.state.T, d = T[0] - T[1];
      return { l: T[0], r: T[1], t: sim.time, w: Math.abs(d) < 0.3 ? 'About the same' : d > 0 ? '⬅ Left (' + SURF[sim.p.left].name.toLowerCase() + ')' : 'Right (' + SURF[sim.p.right].name.toLowerCase() + ') ➡' };
    },
    status: function (sim) { return (sim.p.on ? 'Heater on' : 'Heater off — cans cooling') + ' · t = ' + M.fmt(sim.time, 0) + ' s'; },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, narrow = W < 520;
      D.clear(ctx, W, H, c.bg);
      var floor = H - (narrow ? 58 : 66), cx = W / 2, cy = floor - (narrow ? 90 : 130);
      var cw = narrow ? 44 : 64, ch = narrow ? 64 : 92;
      var off = M.lerp(cw / 2 + 44, W / 2 - cw / 2 - 10, (sim.p.dist - 20) / 80);
      D.line(ctx, 0, floor, W, floor, c.axis, 2);
      D.text(ctx, sim.p.dist + ' cm', cx - off / 2, floor + 16, { color: c.muted, size: 11, align: 'center' });
      D.text(ctx, sim.p.dist + ' cm', cx + off / 2, floor + 16, { color: c.muted, size: 11, align: 'center' });
      D.line(ctx, cx - off, floor + 6, cx + off, floor + 6, D.alpha(c.muted, 0.5), 1, [4, 4]);

      // radiation: wavy lines travelling outward in straight lines
      if (sim.p.on) {
        var phase = sim.reduceMotion ? 0 : now / 120;
        [-1, 1].forEach(function (dir) {
          [-0.5, 0, 0.5].forEach(function (tilt) {
            var x0 = cx + dir * 26, x1 = cx + dir * (off - cw / 2 - 6), y0 = cy + tilt * 22, y1 = cy + tilt * ch * 0.7;
            ctx.save(); ctx.strokeStyle = D.alpha(c.danger, 0.7); ctx.lineWidth = 2; ctx.beginPath();
            var n = Math.abs(x1 - x0);
            for (var i = 0; i <= n; i += 3) {
              var f = i / n, x = M.lerp(x0, x1, f), y = M.lerp(y0, y1, f) + Math.sin(i / 7 - phase) * 4;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke(); ctx.restore();
          });
        });
      }

      // heater
      D.line(ctx, cx, cy + 22, cx, floor, c.axis, 4);
      D.circle(ctx, cx, cy, 22, sim.p.on ? '#ef4444' : c.surface2, c.border, 2);
      if (sim.p.on) D.circle(ctx, cx, cy, 13, '#fbbf24');
      D.text(ctx, sim.p.on ? 'Heater' : 'Heater off', cx, cy - 36, { color: c.ink, size: 12, weight: 600, align: 'center' });

      // cans with thermometers
      [sim.p.left, sim.p.right].forEach(function (k, i) {
        var x = cx + (i ? 1 : -1) * off, top = floor - ch, sf = SURF[k], fill = sf.fill;
        if (fill === 'shiny') {
          fill = ctx.createLinearGradient(x - cw / 2, 0, x + cw / 2, 0);
          fill.addColorStop(0, '#9ca3af'); fill.addColorStop(0.35, '#f8fafc'); fill.addColorStop(0.6, '#cbd5e1'); fill.addColorStop(1, '#6b7280');
        }
        D.roundRect(ctx, x - cw / 2, top, cw, ch, 5, fill, c.border, 1.5);
        // thermometer sticking out of the lid
        var tTop = top - (narrow ? 44 : 60), T = s.T[i], k2 = M.clamp((T - 20) / 60, 0, 1);
        D.roundRect(ctx, x - 4, tTop, 8, top - tTop + 16, 4, c.surface2, c.border, 1);
        ctx.fillStyle = c.danger; var ty = top + 14 - k2 * (top + 14 - tTop - 4);
        ctx.fillRect(x - 1.5, ty, 3, top + 14 - ty);
        D.text(ctx, M.fmt(T, 1) + ' °C', x, tTop - 14, { color: c.bg, bg: c.danger, size: narrow ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: W });
        D.text(ctx, sf.name, x, floor + (narrow ? 32 : 34), { color: c.ink, size: narrow ? 10 : 12, weight: 600, align: 'center', fit: W });
        D.text(ctx, 'absorbs ' + Math.round(sf.a * 100) + '%', x, floor + (narrow ? 46 : 50), { color: c.muted, size: narrow ? 9 : 11, align: 'center', fit: W });
      });
    }
  });
})();
