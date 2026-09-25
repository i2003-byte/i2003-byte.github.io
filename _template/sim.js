/* =====================================================================
   TEMPLATE — sim.js
   ---------------------------------------------------------------------
   Copy the whole /_template/ folder to /<subject>/<your-sim-id>/ and
   replace this example (a bouncing ball) with your own simulation.

   SimLab.createSim() builds the page for you: title & badges (from
   catalog.js), canvas, Play/Pause/Step/Reset, speed buttons, sliders,
   readouts, graph, fullscreen, share link, prev/next and related sims.
   You only describe the parameters, the physics and the drawing.

   Handy helpers:
     SimLab.math  → clamp, lerp, rad, deg, fmt, rk4, rng
     SimLab.vec   → add, sub, scale, len, norm, dot, rotate, fromAngle
     SimLab.draw  → clear, line, circle, roundRect, arrow, text, grid, curve, alpha, niceStep
     SimLab.audio → tone(freq, opts), voice(type), noise(dur, gain)   (Web Audio)
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  SimLab.createSim({
    // Describes the canvas for screen readers
    ariaLabel: 'A ball bouncing on the floor',

    // Start playing automatically (skipped if the user prefers reduced motion)
    autoplay: true,

    // 1) PARAMETERS → sliders. Values are available as sim.p.<id>.
    //    They are saved in the URL, so "Copy share link" reproduces the setup.
    //    Types: range (default), select ({options:[{value,label}]}), toggle.
    params: [
      { id: 'gravity', label: 'Gravity', min: 1, max: 25, step: 0.1, value: 9.8, unit: 'm/s²',
        presets: [{ label: 'Moon', value: 1.6 }, { label: 'Earth', value: 9.8 }] },
      { id: 'bounce', label: 'Bounciness', min: 0, max: 1, step: 0.01, value: 0.8 },
      { id: 'height', label: 'Drop height', min: 1, max: 10, step: 0.1, value: 8, unit: 'm' }
    ],

    // 2) READOUTS → live numbers in the panel. Filled by readout() below.
    readouts: [
      { id: 'y', label: 'Height', unit: 'm' },
      { id: 'v', label: 'Velocity', unit: 'm/s' },
      { id: 'bounces', label: 'Bounces', digits: 0, key: true }
    ],

    // 3) GRAPH (optional). sample() returns one value per series.
    graph: { title: 'Height vs time', yLabel: 'height (m)', series: [{ label: 'height' }], window: 10 },

    // 4) RESET: build the starting state from the parameters.
    //    Called on load, on Restart, and (by default) whenever a slider moves.
    reset: function (sim) {
      sim.state = { y: sim.p.height, v: 0, bounces: 0 };
    },

    // 5) UPDATE: advance the physics by dt seconds (small fixed steps).
    update: function (sim, dt) {
      var s = sim.state;
      s.v -= sim.p.gravity * dt;
      s.y += s.v * dt;
      if (s.y < 0) { s.y = 0; s.v = -s.v * sim.p.bounce; if (Math.abs(s.v) > 0.3) s.bounces++; }
    },

    // Optional: return true to stop automatically (e.g. when an object lands)
    finished: function (sim) { return Math.abs(sim.state.v) < 0.05 && sim.state.y < 0.001 && sim.time > 0.5; },

    sample: function (sim) { return [sim.state.y]; },
    readout: function (sim) { return { y: sim.state.y, v: sim.state.v, bounces: sim.state.bounces }; },

    // 6) DRAW: paint the scene. sim.width / sim.height are in CSS pixels,
    //    sim.colors holds theme-aware colours (bg, ink, accent, s1..s4, …).
    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors;
      D.clear(ctx, W, H, c.bg);
      D.grid(ctx, 0, 0, W, H, 40, c.grid);
      var floor = H - 30, scale = (floor - 30) / 10; // 10 m fits the canvas
      D.line(ctx, 0, floor, W, floor, c.axis, 2);
      D.circle(ctx, W / 2, floor - sim.state.y * scale - 14, 14, c.accent);
      D.text(ctx, M.fmt(sim.state.y, 2) + ' m', W / 2 + 24, floor - sim.state.y * scale - 14, { color: c.muted, size: 12 });
    }

    // Other optional hooks: onParam(sim, id, value) → return true to keep
    // running without reset; pointer: {down, move, up, hover}; buttons: [...];
    // audio: true (adds a Sound on/off button); status(sim) → status text.
  });
})();
