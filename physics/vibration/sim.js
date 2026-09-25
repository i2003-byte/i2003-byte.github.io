/* =====================================================================
   Sound Lab · Vibrating Objects — sim.js
   ---------------------------------------------------------------------
   Every sound starts with a vibration. Strike an object: it vibrates
   with an amplitude that slowly dies away (damping). While it vibrates
   it sends out sound waves and you hear a tone. Touch it and the
   vibration — and the sound — stop at once.
   Visual vibration is slowed down so eyes can follow it.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;

  // freq: real pitch (Hz), decay: how fast vibration dies (1/s), vis: slowed visual Hz
  var OBJECTS = {
    fork:   { label: 'Tuning fork',  freq: 440, decay: 0.35, vis: 9,  type: 'sine',     harm: [1] },
    band:   { label: 'Rubber band',  freq: 196, decay: 1.2,  vis: 6,  type: 'triangle', harm: [1, 0.4, 0.2] },
    drum:   { label: 'Drum',         freq: 110, decay: 2.2,  vis: 5,  type: 'sine',     harm: [1, 0, 0.5, 0.3] },
    bell:   { label: 'Metal plate (bell)', freq: 660, decay: 0.6, vis: 11, type: 'sine', harm: [1, 0.6, 0.3], partials: [1, 2.76, 5.4] },
    ruler:  { label: 'Ruler on a table', freq: 80, decay: 1.6, vis: 4,  type: 'triangle', harm: [1, 0.3] }
  };

  var note = { stop: function () {} }; // currently sounding note
  SimLab.createSim({
    ariaLabel: 'An object vibrating and sending out sound waves',
    audio: true,
    autoplay: true,
    params: [
      { id: 'object', label: 'Object', type: 'select', value: 'fork',
        options: Object.keys(OBJECTS).map(function (k) { return { value: k, label: OBJECTS[k].label }; }) },
      { id: 'strength', label: 'How hard you strike', min: 10, max: 100, step: 1, value: 70, unit: '%' },
      { id: 'ball', label: 'Show ping-pong ball test', type: 'toggle', value: true }
    ],
    buttonsTitle: 'Do it',
    buttons: [
      { label: '👊 Strike / pluck', primary: true, onClick: strike },
      { label: '✋ Touch to stop', onClick: function (sim) { sim.state.touch = 0.6; note.stop(); } }
    ],
    readouts: [
      { id: 'vib', label: 'Vibrating?', key: true },
      { id: 'heard', label: 'Sound heard?', key: true },
      { id: 'amp', label: 'Amplitude', unit: '%', digits: 0 },
      { id: 'freq', label: 'Frequency', unit: 'Hz', digits: 0 }
    ],
    graph: { title: 'Vibration (slowed down)', yLabel: 'displacement', series: [{ label: 'displacement' }], window: 4, yMin: -1.1, yMax: 1.1, rate: 60 },

    onParam: function (sim, id) { if (id === 'object') { sim.state.amp = 0; note.stop(); } return true; },

    reset: function (sim) { sim.state = { amp: 0, phase: 0, touch: 0, rings: [], lastRing: 0, ball: { x: 0, v: 0 } }; },

    update: function (sim, dt) {
      var s = sim.state, o = OBJECTS[sim.p.object];
      var decay = o.decay + (s.touch > 0 ? 25 : 0);
      s.touch = Math.max(0, s.touch - dt);
      s.amp *= Math.exp(-decay * dt);
      if (s.amp < 0.01) s.amp = 0;
      s.phase += 2 * Math.PI * o.vis * dt;
      // emit a sound-wave ring every visual cycle while vibrating
      s.lastRing += dt;
      if (s.amp > 0.02 && s.lastRing > 1 / o.vis) { s.lastRing = 0; s.rings.push({ r: 0, a: s.amp }); }
      s.rings.forEach(function (r) { r.r += 140 * dt; });
      s.rings = s.rings.filter(function (r) { return r.r < 900; });
      // ping-pong ball gets kicked by the vibrating prong
      var b = s.ball;
      b.v += (-40 * b.x - 3 * b.v) * dt; b.x += b.v * dt;
      var prong = s.amp * Math.sin(s.phase);
      if (b.x < prong * 12 && s.amp > 0.05) { b.x = prong * 12; b.v = Math.abs(b.v) + s.amp * 40 * Math.random(); }
      if (b.x < 0 && s.amp <= 0.05) { b.x = 0; b.v = 0; }
      b.x = Math.min(b.x, 60);
    },

    sample: function (sim) { return [sim.state.amp * Math.sin(sim.state.phase)]; },

    readout: function (sim) {
      var s = sim.state, o = OBJECTS[sim.p.object];
      var vib = s.amp > 0.02;
      return { vib: vib ? 'Yes 〰️' : 'No', heard: vib ? 'Yes 🔊' : 'Silence 🔇', amp: s.amp * 100, freq: vib ? o.freq : 0 };
    },
    status: function (sim) { return sim.state.amp > 0.02 ? 'Vibrating → sound!' : 'Still → no sound'; },

    onRunChange: function (sim, on) { if (!on) note.stop(); },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, o = OBJECTS[sim.p.object];
      D.clear(ctx, W, H, c.bg);
      var cx = W * 0.3, cy = H * 0.55, k = Math.min(W, H) / 400;
      var disp = s.amp * Math.sin(s.phase);

      // sound waves (arcs spreading to the right)
      s.rings.forEach(function (r) {
        var a = r.a * Math.max(0, 1 - r.r / 700) * 0.8;
        ctx.strokeStyle = D.alpha(c.accent, a); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, 40 * k + r.r * k, -0.7, 0.7); ctx.stroke();
      });

      ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
      var ink = c.ink, metal = c.light ? '#94a3b8' : '#cbd5e1';
      if (sim.p.object === 'fork') {
        var d = disp * 7;
        D.roundRect(ctx, -6, 20, 12, 90, 5, metal);                           // handle
        D.roundRect(ctx, -26 - d, -110, 12, 140, 6, metal);                    // left prong
        D.roundRect(ctx, 14 + d, -110, 12, 140, 6, metal);                     // right prong
        D.roundRect(ctx, -26, 20, 52, 12, 6, metal);
        if (sim.p.ball) {                                                     // ping-pong ball on a thread
          var bx = 50 + s.ball.x;
          D.line(ctx, 60, -200, bx, -60, c.muted, 1.5);
          D.circle(ctx, bx, -60, 14, '#fff', c.border, 1.5);
        }
      } else if (sim.p.object === 'band') {
        ctx.strokeStyle = c.s3; ctx.lineWidth = 5; ctx.beginPath();
        ctx.moveTo(-110, 0); ctx.quadraticCurveTo(0, disp * 60, 110, 0); ctx.stroke();
        D.circle(ctx, -110, 0, 9, metal); D.circle(ctx, 110, 0, 9, metal);
      } else if (sim.p.object === 'drum') {
        var skin = disp * 12;
        D.roundRect(ctx, -110, -10, 220, 110, 14, D.alpha(c.s2, 0.8));
        ctx.fillStyle = c.light ? '#f1f5f9' : '#e2e8f0';
        ctx.beginPath(); ctx.ellipse(0, -10 + skin * 0.3, 110, 26 + skin, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = c.border; ctx.stroke();
        if (sim.p.ball) { // rice grains jumping on the drum
          for (var i = 0; i < 9; i++) {
            var hop = Math.abs(Math.sin(s.phase * 1.3 + i)) * s.amp * 40;
            D.circle(ctx, -70 + i * 17, -18 - hop, 3, c.s3);
          }
        }
      } else if (sim.p.object === 'bell') {
        ctx.save(); ctx.rotate(disp * 0.03);
        D.line(ctx, 0, -150, 0, -80, c.muted, 2);
        ctx.fillStyle = metal; ctx.beginPath(); ctx.ellipse(0, 0, 100 + disp * 6, 80, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = c.border; ctx.lineWidth = 2; ctx.stroke();
        D.circle(ctx, 0, 0, 14, c.bg, c.border, 2);
        ctx.restore();
      } else { // ruler pressed on a table edge
        D.roundRect(ctx, -170, 10, 170, 80, 4, D.alpha(c.s3, 0.35));        // table
        D.circle(ctx, -60, 0, 14, D.alpha(c.muted, 0.6));                    // hand pressing
        ctx.save(); ctx.translate(0, 5); ctx.rotate(disp * 0.35);
        D.roundRect(ctx, -120, -8, 260, 12, 3, c.s3);
        for (var t = -110; t < 140; t += 14) D.line(ctx, t, -8, t, -2, c.bg, 1);
        ctx.restore();
      }
      ctx.restore();

      // labels
      D.text(ctx, o.label, cx, H - 20, { color: c.muted, size: 13, weight: 600, align: 'center' });
      if (s.amp < 0.02) D.text(ctx, 'Press “Strike” or tap the object', W / 2, 24, { color: c.muted, size: 13, align: 'center' });
      // ear on the right
      var ex = W - 40 * k - 20, ey = cy;
      D.text(ctx, '👂', ex, ey, { size: 40 * k, align: 'center' });
      D.text(ctx, s.amp > 0.02 ? 'I hear it!' : '…quiet', ex, ey + 40 * k, { color: s.amp > 0.02 ? c.success : c.faint, size: 12, weight: 600, align: 'center' });
    },

    pointer: {
      hover: function (sim, x) { return x < sim.width * 0.6; },
      down: function (sim, x) { if (x < sim.width * 0.6) { strike(sim); return true; } return false; }
    }
  });

  function strike(sim) {
    var o = OBJECTS[sim.p.object], strength = sim.p.strength / 100;
    sim.state.amp = strength; sim.state.touch = 0;
    if (!sim.running) sim.play();
    if (sim.p.object === 'drum') A.noise(0.25, strength * 0.5, 400);
    note.stop();
    note = A.tone(o.freq, { type: o.type, gain: strength * 0.8, duration: Math.min(4, 3 / o.decay), harmonics: o.harm, partials: o.partials });
  }
})();
