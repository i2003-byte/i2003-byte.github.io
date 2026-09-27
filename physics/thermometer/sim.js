/* =====================================================================
   Heat · Clinical vs Laboratory Thermometer — sim.js
   ---------------------------------------------------------------------
   Clinical thermometer: 35–42 °C (94–108 °F), 0.1 °C per division, with
     a KINK near the bulb so the reading does not fall after it is taken
     out. It must be shaken down before use. Never put it in hot water:
     above 42 °C it would break.
   Laboratory thermometer: −10 to 110 °C, 1 °C per division, no kink —
     the reading falls as soon as it is taken out, so read it while it
     is still in the liquid.
   The liquid approaches the temperature of what it touches:
     dT/dt = (T_target − T) / τ   (τ ≈ 2.5 s of sim time, compressed)
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var TAU = 2.5, ROOM = 25;
  var TYPES = {
    clinical: { lo: 35, hi: 42, div: 0.1, label: 10, name: 'Clinical' },
    lab: { lo: -10, hi: 110, div: 1, label: 10, name: 'Laboratory' }
  };
  var PLACES = {
    mouth: { t: 37, icon: '👄', name: 'under the tongue (healthy)' },
    fever: { t: 39.5, icon: '🤒', name: 'under the tongue (fever)' },
    room: { t: ROOM, icon: '🏠', name: 'in room air' },
    ice: { t: 0, icon: '🧊', name: 'in ice water' },
    warm: { t: 45, icon: '🥣', name: 'in warm water' },
    boiling: { t: 100, icon: '♨️', name: 'in boiling water' }
  };

  function shown(sim) { // what the scale shows
    var T = TYPES[sim.p.type], s = sim.state;
    return M.clamp(s.level, T.lo, T.hi);
  }

  SimLab.createSim({
    ariaLabel: 'A zoomed-in thermometer scale whose liquid thread rises and falls with temperature',
    autoplay: true,
    mobileAspect: '4 / 3.6',
    params: [
      { id: 'type', label: 'Thermometer', type: 'select', value: 'clinical', options: [
        { value: 'clinical', label: '🩺 Clinical (35–42 °C)' }, { value: 'lab', label: '🧪 Laboratory (−10–110 °C)' }] },
      { id: 'place', label: 'Put the bulb…', type: 'select', value: 'mouth', options: Object.keys(PLACES).map(function (k) {
        return { value: k, label: PLACES[k].icon + ' ' + PLACES[k].name + ' — ' + PLACES[k].t + ' °C' };
      }) }
    ],
    buttonsTitle: 'Handle it',
    buttons: [
      { label: '✋ Take it out', primary: true, onClick: function (sim) { sim.state.out = true; sim.play(); } },
      { label: '👋 Shake it down', onClick: function (sim) {
        if (sim.p.type !== 'clinical') { sim.toast('A lab thermometer has no kink — no need to shake it'); return; }
        if (sim.state.broken) { sim.toast('It is broken — press Reset for a new one'); return; }
        sim.state.level = Math.min(sim.state.level, 35); sim.toast('Shaken down to 35 °C');
      } }
    ],
    readouts: [
      { id: 'r', label: 'Reading', key: true },
      { id: 'f', label: 'In Fahrenheit', unit: '°F', digits: 1 },
      { id: 'range', label: 'Range' },
      { id: 'div', label: 'One small division' }
    ],
    graph: { title: 'Reading vs time', yLabel: '°C', series: [{ label: 'reading' }, { label: 'actual temperature' }], window: 20 },
    onParam: function (sim, id) {
      if (id === 'place') { sim.state.out = false; sim.play(); return true; }
      return false; // new thermometer type → start fresh
    },
    reset: function (sim) {
      var T = TYPES[sim.p.type];
      sim.state = { level: sim.p.type === 'clinical' ? T.lo : ROOM, out: false, broken: false };
    },
    update: function (sim, dt) {
      var s = sim.state, target = s.out ? ROOM : PLACES[sim.p.place].t, clin = sim.p.type === 'clinical';
      if (s.broken) return;
      var diff = target - s.level, step = Math.max(Math.abs(diff) * dt / TAU, 0.2 * dt); // settles fully, no endless creep
      var next = Math.abs(diff) <= step ? target : s.level + Math.sign(diff) * step;
      if (clin && next < s.level && s.level > 35) next = s.level; // the kink stops the mercury falling back
      s.level = next;
      if (clin && s.level > 42.3) { s.broken = true; s.level = 42; }
    },
    finished: function (sim) { return sim.state.broken; },
    onFinish: function (sim) { sim.toast('💥 Crack! A clinical thermometer only goes up to 42 °C'); },
    sample: function (sim) { return [shown(sim), sim.state.out ? ROOM : PLACES[sim.p.place].t]; },
    readout: function (sim) {
      var T = TYPES[sim.p.type], r = shown(sim), clin = sim.p.type === 'clinical';
      return {
        r: sim.state.broken ? 'Broken!' : M.fmt(r, clin ? 1 : 0) + ' °C',
        f: r * 9 / 5 + 32,
        range: T.lo + ' to ' + T.hi + ' °C',
        div: T.div + ' °C'
      };
    },
    status: function (sim) {
      var s = sim.state;
      if (s.broken) return 'Broken — too hot for a clinical thermometer';
      return s.out ? 'Taken out, in room air' : 'Bulb ' + PLACES[sim.p.place].name;
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state;
      var T = TYPES[sim.p.type], clin = sim.p.type === 'clinical', narrow = W < 520;
      D.clear(ctx, W, H, c.bg);

      // where the bulb is
      var pl = PLACES[sim.p.place];
      D.text(ctx, s.out ? '🏠' : pl.icon, 16, 30, { size: narrow ? 24 : 30 });
      D.text(ctx, s.out ? 'Taken out — in room air (25 °C)' : 'Bulb ' + pl.name + ' (' + pl.t + ' °C)', narrow ? 50 : 60, 30,
        { color: c.ink, size: narrow ? 12 : 15, weight: 600, fit: W });

      // thermometer body (horizontal): bulb on the left
      var ty = H * (narrow ? 0.46 : 0.42), th = narrow ? 26 : 34, bulbR = th * 0.75;
      var x0 = 16 + bulbR * 2 + (clin ? 22 : 8), x1 = W - 22;
      function X(v) { return x0 + (v - T.lo) / (T.hi - T.lo) * (x1 - x0); }
      D.roundRect(ctx, 10, ty - th / 2, W - 20, th, th / 2, c.surface2, c.border, 1.5);
      D.circle(ctx, 16 + bulbR, ty, bulbR, s.broken ? c.muted : c.danger, c.border, 1.5);
      if (clin) { // kink: a narrow neck just after the bulb
        var kx = 16 + bulbR * 2 + 8;
        D.line(ctx, kx, ty - 5, kx + 6, ty, c.ink, 2); D.line(ctx, kx, ty + 5, kx + 6, ty, c.ink, 2);
        D.text(ctx, 'kink', kx + 3, ty + th / 2 + 10, { color: c.muted, size: 10, align: 'center' });
      }
      // liquid thread
      var lvl = s.broken ? T.lo : shown(sim);
      if (!s.broken) { ctx.fillStyle = c.danger; ctx.fillRect(16 + bulbR, ty - 3, X(lvl) - 16 - bulbR, 6); }
      else D.text(ctx, '💥 broken — the mercury spilled', W / 2, ty, { color: c.danger, size: 13, weight: 700, align: 'center', bg: c.bg });

      // °C scale above
      var step = T.div, major = clin ? 1 : 10, mid = clin ? 0.5 : 5;
      var minor = (x1 - x0) / ((T.hi - T.lo) / step) < 3 ? step * 2 : step; // thin out ticks on phones
      for (var v = T.lo; v <= T.hi + 1e-6; v += minor) {
        var vv = Math.round(v * 10) / 10, isMaj = Math.abs(vv / major - Math.round(vv / major)) < 1e-6;
        var isMid = Math.abs(vv / mid - Math.round(vv / mid)) < 1e-6;
        var len = isMaj ? 14 : isMid ? 9 : 5;
        D.line(ctx, X(vv), ty - th / 2 - 2, X(vv), ty - th / 2 - 2 - len, isMaj ? c.ink : c.axis, 1);
        if (isMaj && (!narrow || clin || vv % 20 === 0)) D.text(ctx, String(vv), X(vv), ty - th / 2 - 26, { color: c.ink, size: narrow ? 10 : 12, align: 'center' });
      }
      D.text(ctx, '°C', 16 + bulbR, ty - th / 2 - 26, { color: c.muted, size: 11, weight: 700, align: 'center' });

      // °F scale below (clinical only) and normal-temperature mark
      if (clin) {
        for (var f = 95; f <= 107; f++) {
          var fx = X((f - 32) * 5 / 9);
          D.line(ctx, fx, ty + th / 2 + 2, fx, ty + th / 2 + 8, c.axis, 1);
          if (!narrow || f % 2 === 1) D.text(ctx, String(f), fx, ty + th / 2 + 18, { color: c.muted, size: narrow ? 9 : 11, align: 'center' });
        }
        D.text(ctx, '°F', 16 + bulbR, ty + th / 2 + 26, { color: c.muted, size: 11, weight: 700, align: 'center' });
        var nx = X(37);
        D.arrow(ctx, nx, ty + th / 2 + 46, nx, ty + th / 2 + 26, c.success, 2, 7);
        D.text(ctx, 'Normal 37 °C (98.6 °F)', nx, ty + th / 2 + 58, { color: c.success, size: 11, weight: 600, align: 'center', fit: W });
      }

      // reading bubble
      if (!s.broken) {
        var rx = M.clamp(X(lvl), 40, W - 40);
        D.text(ctx, M.fmt(lvl, clin ? 1 : 0) + ' °C', rx, H - (narrow ? 22 : 30), { color: c.bg, bg: c.danger, size: narrow ? 14 : 18, weight: 700, align: 'center', pad: 6 });
        var lo = s.level < T.lo - 0.05, hi = s.level > T.hi + 0.05;
        if (lo || hi) D.text(ctx, lo ? '⚠ Below this thermometer’s range' : '⚠ Above this thermometer’s range', W / 2, H - (narrow ? 50 : 62),
          { color: c.warning, size: 12, weight: 600, align: 'center', fit: W });
      }
    }
  });
})();
