/* =====================================================================
   Chemistry · Evaporation and Cooling (matter in our surroundings)
   ---------------------------------------------------------------------
   100 g of water in a steel glass or a wide plate, indoors in the shade.
   Evaporation rate (mass transfer, kg/s):
     E = hm · A · (ρsat(Tw) − RH · ρsat(Ta))
       ρsat(T) = es(T)·Mw / (R·(T+273.15)),  es = 610.94·e^(17.625T/(T+243.04)) Pa
       hm = 0.0025 · (1 + 0.55 v) m/s     (v = wind speed in m/s)
   Heat balance of the water (m c dTw/dt):
     + 1200 · hm · A · (Ta − Tw)        heat from the air above the surface
     + 4 · Awall · (Ta − Tw)            heat through the walls and base
     − L · E                            heat carried away by evaporation
   (1200 J/m³K ≈ ρ·cp of air, the usual heat/mass-transfer analogy.)
   The water cools until heat flowing in balances heat carried away.
   Time: 1 s on screen = 20 min. Stops when dry or after 48 h.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var TS = 1200, L = 2.43e6, C = 4186, M0 = 0.1, TMAX = 48 * 3600;
  var FAN = [0, 1.5, 3, 5], FANW = ['Off', 'Slow', 'Medium', 'Fast'];
  var POTS = { plate: { d: 0.20, name: 'wide plate' }, glass: { d: 0.07, name: 'steel glass' } };
  var tMaxGraph = 12;

  function rhoSat(T) { return 610.94 * Math.exp(17.625 * T / (T + 243.04)) * 0.018015 / (8.314 * (T + 273.15)); }
  function geom(p) { var d = POTS[p.pot].d, A = Math.PI * d * d / 4; return { d: d, A: A }; }
  function rates(sim) {
    var p = sim.p, s = sim.state, g = geom(p), v = FAN[p.fan], hm = 0.0025 * (1 + 0.55 * v);
    var depth = s.m / 1e6 / g.A, Awall = g.A + Math.PI * g.d * depth;
    var E = s.m > 0 ? Math.max(0, hm * g.A * (rhoSat(s.Tw) - p.rh / 100 * rhoSat(p.ta))) : 0;
    var Qin = (1200 * hm * g.A + 4 * Awall) * (p.ta - s.Tw);
    return { E: E, Qin: Qin, Qout: L * E, hm: hm };
  }
  function hm(t) { var h = Math.floor(t / 3600), mn = Math.floor(t % 3600 / 60); return h + ' h ' + (mn < 10 ? '0' : '') + mn + ' min'; }

  SimLab.createSim({
    ariaLabel: 'Water evaporating from a plate or a glass in a room, with a fan, an air thermometer and a water thermometer. Water particles escape from the surface and the water cools below the air temperature',
    mobileAspect: '1 / 1',
    playLabel: 'Start',
    params: [
      { id: 'ta', label: 'Air temperature', min: 15, max: 45, step: 1, value: 35, unit: '°C', presets: [{ label: 'Winter', value: 18 }, { label: 'Summer', value: 40 }] },
      { id: 'rh', label: 'Humidity of the air', min: 10, max: 100, step: 5, value: 40, unit: '%', presets: [{ label: 'Dry (Delhi, May)', value: 20 }, { label: 'Humid (Mumbai, July)', value: 85 }] },
      { id: 'fan', label: 'Fan', min: 0, max: 3, step: 1, value: 0, format: function (v) { return FANW[v] + (v ? ' (' + FAN[v] + ' m/s)' : ''); } },
      { id: 'pot', label: 'Water in a', type: 'select', value: 'plate', options: [
        { value: 'plate', label: 'Wide plate (20 cm across)' }, { value: 'glass', label: 'Steel glass (7 cm across)' }] }
    ],
    readouts: [
      { id: 'tw', label: 'Water temperature', unit: '°C', digits: 1, key: true, short: 'Water' },
      { id: 'dt', label: 'Cooler than the air by', unit: '°C', digits: 1, key: true, short: 'Cooler by' },
      { id: 'e', label: 'Evaporation rate', unit: 'g/h', digits: 1, key: true, short: 'Evaporates' },
      { id: 'm', label: 'Water left', unit: 'g', digits: 1 },
      { id: 't', label: 'Time passed (1 s = 20 min)' }
    ],
    graph: { title: 'Temperature of the water and the air', yLabel: '°C', xLabel: 'time (hours)', series: [{ label: 'water' }, { label: 'air', color: '--sim-2' }], xMax: function () { return tMaxGraph; } },
    onParam: function (sim, id) {
      if (id === 'pot') { sim.reset(); return true; }
      sim.redraw(); return true;
    },
    reset: function (sim) {
      sim.state = { m: M0 * 1000, Tw: sim.p.ta, t: 0, vap: [], rand: M.rng(5), acc: 0, gacc: 0 };
      tMaxGraph = 12;
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [sim.p.ta, sim.p.ta]); }
    },
    update: function (sim, dt) {
      var s = sim.state, h = dt * TS, r = rates(sim), g = geom(sim.p);
      // small steps so a nearly dry plate (tiny heat capacity) stays stable
      var Gmax = r.hm * g.A * (1200 + L * 0.004) + 4 * (g.A + Math.PI * g.d * s.m / 1e6 / g.A);
      var n = Math.min(400, Math.ceil(h / (0.3 * Math.max(s.m, 0.05) / 1000 * C / Gmax))), hh = h / n;
      for (var q = 0; q < n && s.m > 0; q++) {
        r = rates(sim);
        s.Tw += (r.Qin - r.Qout) * hh / (Math.max(s.m, 0.05) / 1000 * C);
        s.m = Math.max(0, s.m - r.E * hh * 1000);
      }
      s.t += h;
      // escaping particles (drawn, not to scale): more when evaporation is faster
      s.acc += dt * Math.min(70, 3 + r.E * 3.6e6 * 4);
      while (s.acc >= 1 && s.m > 0) { s.acc -= 1; s.vap.push({ u: s.rand() * 2 - 1, y: 0, age: 0, j: s.rand() }); }
      for (var i = s.vap.length - 1; i >= 0; i--) { s.vap[i].age += dt; if (s.vap[i].age > 2.6) s.vap.splice(i, 1); }
      s.gacc += dt;
      if (s.gacc >= 1 / 15) {
        s.gacc = 0;
        if (s.t / 3600 > tMaxGraph) tMaxGraph = Math.min(48, tMaxGraph * 2);
        if (sim.graph) sim.graph.push(s.t / 3600, [s.Tw, sim.p.ta]);
      }
    },
    finished: function (sim) { return sim.state.m <= 0.05 || sim.state.t >= TMAX; },
    readout: function (sim) {
      var s = sim.state, r = rates(sim);
      return { tw: s.Tw, dt: sim.p.ta - s.Tw, e: r.E * 3.6e6, m: s.m, t: hm(s.t) + (s.m <= 0.05 ? ' · dry!' : s.t >= TMAX ? ' · stopped at 48 h' : '') };
    },
    status: function (sim) {
      var s = sim.state;
      if (s.m <= 0.05) return 'All the water has evaporated after ' + hm(s.t);
      return (sim.running ? 'Running' : 'Paused') + ' · ' + hm(s.t) + ' passed';
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, p = sim.p, s = sim.state, W = sim.width, H = sim.height, small = W < 560, fs = small ? 10 : 12;
      D.clear(ctx, W, H, col.bg);
      var tableY = H * 0.78, wind = FAN[p.fan];
      // humid air: faint dots, more when humid
      var rr = M.rng(3), nd = Math.round(p.rh * (small ? 0.9 : 1.6)), drift = (now || 0) / 1000 * wind * 18;
      for (var i = 0; i < nd; i++) {
        var x = ((rr() * W + drift * (0.6 + rr() * 0.4)) % W), y = 24 + rr() * (tableY - 40);
        D.circle(ctx, x, y, small ? 1.6 : 2, D.alpha(col.s1, 0.28));
      }
      // table
      D.roundRect(ctx, 0, tableY, W, H - tableY, 0, col.light ? '#d6b896' : '#5b4630');
      D.line(ctx, 0, tableY, W, tableY, col.light ? '#a07a52' : '#8a6a48', 2);
      // container
      var pot = p.pot, cx = W * 0.47, wpx, hpx, depth, top;
      if (pot === 'plate') {
        wpx = Math.min(W * 0.52, 420); hpx = Math.max(14, H * 0.06);
        depth = hpx * 0.8 * s.m / 100;
        ctx.save(); ctx.fillStyle = col.light ? '#cbd5e1' : '#94a3b8';
        ctx.beginPath(); ctx.moveTo(cx - wpx / 2 - 8, tableY - hpx); ctx.lineTo(cx + wpx / 2 + 8, tableY - hpx);
        ctx.lineTo(cx + wpx / 2 - 10, tableY); ctx.lineTo(cx - wpx / 2 + 10, tableY); ctx.closePath(); ctx.fill(); ctx.restore();
        top = tableY - 3 - depth;
        D.roundRect(ctx, cx - wpx / 2 + 2, top, wpx - 4, depth + 0.01, 2, '#38bdf8');
      } else {
        wpx = Math.min(W * 0.13, 70); hpx = Math.min(H * 0.42, 190);
        depth = (hpx - 8) * 0.55 * s.m / 100;
        top = tableY - 4 - depth;
        D.roundRect(ctx, cx - wpx / 2 + 3, top, wpx - 6, depth + 0.01, 2, '#38bdf8');
        ctx.save(); ctx.strokeStyle = col.light ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx - wpx / 2, tableY - hpx); ctx.lineTo(cx - wpx / 2 + 2, tableY); ctx.lineTo(cx + wpx / 2 - 2, tableY); ctx.lineTo(cx + wpx / 2, tableY - hpx); ctx.stroke(); ctx.restore();
      }
      // escaping water particles
      var half = (pot === 'plate' ? wpx : wpx - 8) / 2;
      s.vap.forEach(function (v) {
        var a = v.age, vx = cx + v.u * half * 0.95 + a * wind * (small ? 14 : 22) + Math.sin(a * 4 + v.j * 6) * 3;
        var vy = top - 3 - a * (small ? 34 : 48) * (0.7 + v.j * 0.6);
        D.circle(ctx, vx, vy, small ? 2.6 : 3.4, D.alpha('#38bdf8', Math.max(0, 1 - a / 2.6)));
      });
      // fan
      var fx = small ? 24 : 46, fy = tableY - H * 0.36, fr = small ? 16 : 26;
      D.line(ctx, fx, fy, fx, tableY, col.muted, 3);
      var ang = p.fan ? (now || 0) / 1000 * p.fan * 9 : 0.4;
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang); ctx.fillStyle = D.alpha(col.s3, 0.8);
      for (var b = 0; b < 3; b++) { ctx.rotate(Math.PI * 2 / 3); ctx.beginPath(); ctx.ellipse(0, -fr * 0.5, fr * 0.22, fr * 0.48, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      D.circle(ctx, fx, fy, fr, null, col.muted, 1.5); D.circle(ctx, fx, fy, 3, col.text);
      if (p.fan) for (var k = 0; k < 3; k++) {
        var ay = fy - fr * 0.6 + k * fr * 0.6, ax = fx + fr + 6 + ((now || 0) / 1000 * 40 * p.fan + k * 13) % 24;
        D.arrow(ctx, ax, ay, ax + (small ? 14 : 22), ay, D.alpha(col.s3, 0.7), 2, 6);
      }
      D.text(ctx, 'Fan: ' + FANW[p.fan], fx, tableY + (small ? 12 : 16), { color: col.text, size: fs, weight: 700, align: 'center', fit: W });
      // thermometers
      function thermo(x, y0, y1, T, label, c) {
        var tw = small ? 7 : 9, frac = M.clamp((T - 0) / 50, 0, 1);
        D.roundRect(ctx, x - tw / 2, y0, tw, y1 - y0, tw / 2, col.light ? '#f8fafc' : '#1e293b', col.muted, 1);
        D.circle(ctx, x, y1, tw * 0.9, c);
        D.roundRect(ctx, x - tw / 4, y1 - (y1 - y0 - 4) * frac, tw / 2, (y1 - y0 - 4) * frac, 2, c);
        D.text(ctx, label, x, y0 - (small ? 9 : 12), { color: c, size: fs, weight: 800, align: 'center', fit: W, bg: D.alpha(col.bg, 0.8), pad: 2 });
      }
      var wx = cx + Math.min(half * 0.6, small ? 24 : 40);
      thermo(wx, top - H * 0.3, tableY - 8, s.Tw, 'water ' + M.fmt(s.Tw, 1) + ' °C', col.s1);
      var axx = W - (small ? 26 : 50);
      thermo(axx, tableY - H * 0.5, tableY - H * 0.12, p.ta, 'air ' + p.ta + ' °C', col.s2);
      // info strip
      D.text(ctx, hm(s.t) + ' passed · humidity ' + p.rh + '%', 6, 12, { color: col.text, size: fs, weight: 700, fit: W });
      D.text(ctx, 'Water left: ' + M.fmt(s.m, 1) + ' g in the ' + POTS[pot].name, W / 2, H - (small ? 10 : 14), { color: col.muted, size: fs, align: 'center', fit: W });
    }
  });
})();
