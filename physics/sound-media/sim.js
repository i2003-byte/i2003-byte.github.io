/* =====================================================================
   Sound Lab · Sound Through Solids, Liquids & Gases — sim.js
   ---------------------------------------------------------------------
   The same sound pulse races along three tracks of equal length.
   Speeds (approximate, at room temperature):
       steel ≈ 5960 m/s · glass ≈ 4540 · wood ≈ 3850
       water ≈ 1480 · sea water ≈ 1530 · kerosene ≈ 1320
       air   ≈ 331 + 0.6·T  m/s   (T in °C)
   Real arrival times are tiny, so the race is slowed down so that the
   pulse in air takes about 5 seconds on screen.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;

  var SOLIDS = { steel: ['Steel', 5960], glass: ['Glass', 4540], wood: ['Wood', 3850] };
  var LIQUIDS = { water: ['Water', 1480], sea: ['Sea water', 1530], kerosene: ['Kerosene', 1320] };

  function lanes(p) {
    var air = 331 + 0.6 * p.temp;
    return [
      { kind: 'Solid', name: SOLIDS[p.solid][0], v: SOLIDS[p.solid][1], spacing: 9, jitter: 0.5, note: 1320 },
      { kind: 'Liquid', name: LIQUIDS[p.liquid][0], v: LIQUIDS[p.liquid][1], spacing: 14, jitter: 2, note: 880 },
      { kind: 'Gas', name: 'Air (' + p.temp + ' °C)', v: air, spacing: 24, jitter: 5, note: 523 }
    ];
  }

  SimLab.createSim({
    ariaLabel: 'Three tracks — a solid, a liquid and air — with a sound pulse racing along each',
    audio: true,
    playLabel: 'Send sound',
    params: [
      { id: 'solid', label: 'Solid', type: 'select', value: 'steel', options: Object.keys(SOLIDS).map(function (k) { return { value: k, label: SOLIDS[k][0] }; }) },
      { id: 'liquid', label: 'Liquid', type: 'select', value: 'water', options: Object.keys(LIQUIDS).map(function (k) { return { value: k, label: LIQUIDS[k][0] }; }) },
      { id: 'temp', label: 'Air temperature', min: 0, max: 40, step: 1, value: 20, unit: '°C' },
      { id: 'dist', label: 'Track length', min: 50, max: 3000, step: 50, value: 1000, unit: 'm' }
    ],
    readouts: [
      { id: 'ts', label: 'Solid arrives', unit: 's', digits: 3, key: true },
      { id: 'tl', label: 'Liquid arrives', unit: 's', digits: 3, key: true },
      { id: 'tg', label: 'Air arrives', unit: 's', digits: 3, key: true },
      { id: 'vs', label: 'Speed in solid', unit: 'm/s', digits: 0 },
      { id: 'vl', label: 'Speed in liquid', unit: 'm/s', digits: 0 },
      { id: 'vg', label: 'Speed in air', unit: 'm/s', digits: 0 },
      { id: 'clock', label: 'Real time elapsed', unit: 's', digits: 3 }
    ],

    reset: function (sim) {
      var L = lanes(sim.p);
      var slow = 5 / (sim.p.dist / L[2].v); // screen seconds per real second
      sim.state = { lanes: L, slow: slow, real: 0, arrived: [false, false, false] };
    },

    update: function (sim, dt) {
      var s = sim.state;
      s.real += dt / s.slow;
      s.lanes.forEach(function (l, i) {
        if (!s.arrived[i] && l.v * s.real >= sim.p.dist) {
          s.arrived[i] = true;
          A.tone(l.note, { duration: 0.35, gain: 0.5 });
        }
      });
    },
    finished: function (sim) { return sim.state.arrived.every(Boolean) && sim.state.real > sim.p.dist / sim.state.lanes[2].v + 0.2 / sim.state.slow; },
    onRunChange: function (sim, on) { if (on && sim.time === 0) A.tone(220, { duration: 0.12, gain: 0.5, type: 'square' }); },

    readout: function (sim) {
      var L = sim.state.lanes, d = sim.p.dist;
      return { ts: d / L[0].v, tl: d / L[1].v, tg: d / L[2].v, vs: L[0].v, vl: L[1].v, vg: L[2].v, clock: Math.min(sim.state.real, d / L[2].v) };
    },
    status: function (sim) {
      var n = sim.state.arrived.filter(Boolean).length;
      return sim.time === 0 ? 'Press “Send sound”' : n === 3 ? 'All arrived!' : 'Racing… ' + n + '/3 arrived';
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      var left = Math.max(70, W * 0.13), right = W - 50, laneH = (H - 50) / 3;
      var colors = [c.s3, c.s1, c.s4];
      var small = W < 520;

      s.lanes.forEach(function (l, i) {
        var top = 30 + i * laneH, midY = top + laneH / 2, hh = laneH * 0.62;
        D.roundRect(ctx, left, midY - hh / 2, right - left, hh, 10, D.alpha(colors[i], 0.08), D.alpha(colors[i], 0.4));
        // pulse position
        var frac = Math.min(1, l.v * s.real / sim.p.dist);
        var px = left + frac * (right - left);
        // particles: shifted a little near the pulse → a compression moving along
        var rnd = M.rng(i * 97 + 3);
        for (var x = left + 6; x < right - 4; x += l.spacing) {
          for (var y = midY - hh / 2 + 6; y < midY + hh / 2 - 4; y += l.spacing) {
            var jx = (rnd() - 0.5) * l.jitter * 2, jy = (rnd() - 0.5) * l.jitter * 2;
            var d = x - px, push = sim.time > 0 && frac < 1 ? 7 * Math.exp(-d * d / 400) * Math.sign(-d || 1) : 0;
            var wig = sim.reduceMotion ? 0 : Math.sin((now || 0) / 300 + x * 0.3 + y) * l.jitter * 0.4;
            D.circle(ctx, x + jx + push + wig, y + jy, i === 0 ? 2.6 : i === 1 ? 2.8 : 2.4, D.alpha(colors[i], 0.75));
          }
        }
        if (sim.time > 0 && frac < 1) {
          var g = ctx.createLinearGradient(px - 40, 0, px + 10, 0);
          g.addColorStop(0, D.alpha(colors[i], 0)); g.addColorStop(1, D.alpha(colors[i], 0.55));
          ctx.fillStyle = g; ctx.fillRect(Math.max(left, px - 40), midY - hh / 2, Math.min(50, px - left + 10), hh);
        }
        // labels
        D.text(ctx, l.kind, 10, midY - 9, { color: colors[i], size: small ? 11 : 13, weight: 700 });
        D.text(ctx, l.name, 10, midY + 9, { color: c.muted, size: small ? 10 : 11 });
        // finish
        D.text(ctx, s.arrived[i] ? '✅' : '👂', right + 25, midY, { size: 22, align: 'center' });
        if (s.arrived[i]) D.text(ctx, M.fmt(sim.p.dist / l.v, 3) + ' s', right - 8, midY - hh / 2 - 8, { color: colors[i], size: 11, weight: 600, align: 'right', baseline: 'middle' });
      });
      D.text(ctx, '🔔', left - 2, 16, { size: 16, align: 'center' });
      D.text(ctx, 'Slowed down ×' + M.fmt(s.slow, 0) + ' · track ' + sim.p.dist + ' m', W / 2, 14, { color: c.faint, size: 11, align: 'center' });
    }
  });
})();
