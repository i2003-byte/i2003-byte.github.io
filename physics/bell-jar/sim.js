/* =====================================================================
   Sound Lab · Bell Jar: Sound in a Vacuum — sim.js
   ---------------------------------------------------------------------
   An electric bell rings inside a glass jar. A pump removes the air.
   Sound needs particles (a medium) to travel, so as the air is pumped
   out the sound we hear gets fainter — in a near-vacuum it is silent,
   even though we can still SEE the hammer striking the bell.
   Loudness heard is modelled as proportional to the air remaining.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;

  var particles = [];
  function makeParticles() {
    var r = M.rng(7); particles = [];
    for (var i = 0; i < 120; i++) particles.push({ x: r(), y: r(), vx: r() - 0.5, vy: r() - 0.5, order: r() });
  }
  makeParticles();

  SimLab.createSim({
    ariaLabel: 'A ringing electric bell inside a glass jar connected to a vacuum pump',
    audio: true,
    autoplay: true,
    params: [
      { id: 'air', label: 'Air inside the jar', min: 0, max: 100, step: 1, value: 100, unit: '%' },
      { id: 'bell', label: 'Bell switched on', type: 'toggle', value: true }
    ],
    buttonsTitle: 'Pump',
    buttons: [
      { label: '⬇️ Pump air out', primary: true, onClick: function (sim) { sim.state.pump = -1; if (!sim.running) sim.play(); } },
      { label: '⬆️ Let air in', onClick: function (sim) { sim.state.pump = 1; if (!sim.running) sim.play(); } },
      { label: '⏹ Stop pump', full: true, onClick: function (sim) { sim.state.pump = 0; } }
    ],
    readouts: [
      { id: 'air', label: 'Air left', unit: '%', digits: 0, key: true },
      { id: 'loud', label: 'Loudness heard', unit: '%', digits: 0, key: true },
      { id: 'hear', label: 'Can you hear it?' },
      { id: 'see', label: 'Can you see it ring?' }
    ],
    graph: { title: 'Loudness heard vs time', yLabel: 'loudness %', series: [{ label: 'loudness' }], window: 20, yMin: 0, yMax: 105 },

    onParam: function (sim) { sim.state.airF = null; return true; }, // slider moved by hand
    reset: function (sim) { sim.state = { pump: 0, hammer: 0, ringT: 0 }; },

    update: function (sim, dt) {
      var s = sim.state;
      if (s.pump) {
        if (s.airF == null) s.airF = sim.p.air;
        s.airF = M.clamp(s.airF + s.pump * 12 * dt, 0, 100);
        if (s.airF === 0 || s.airF === 100) s.pump = 0;
        if (Math.round(s.airF) !== sim.p.air) sim.setParam('air', Math.round(s.airF)); // update slider only when it changes
      }
      if (sim.p.bell) {
        s.hammer += dt * 2 * Math.PI * 8;
        s.ringT += dt;
        if (s.ringT > 0.25) {
          s.ringT = 0;
          var g = sim.p.air / 100;
          if (g > 0.01) A.tone(988, { duration: 0.35, gain: g * 0.55, harmonics: [1, 0.5, 0.3], partials: [1, 2.4, 3.9] });
        }
      }
    },

    sample: function (sim) { return [loud(sim)]; },
    readout: function (sim) {
      var l = loud(sim);
      return {
        air: sim.p.air, loud: l,
        hear: !sim.p.bell ? 'Bell is off' : l > 60 ? 'Loud and clear 🔊' : l > 20 ? 'Fainter… 🔉' : l > 1 ? 'Very faint 🔈' : 'Silence! 🔇',
        see: sim.p.bell ? 'Yes 👀' : 'No'
      };
    },
    status: function (sim) {
      var s = sim.state;
      return s.pump < 0 ? 'Pumping air out…' : s.pump > 0 ? 'Letting air in…' : sim.p.air < 1 ? 'Near vacuum' : 'Pump idle';
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      var k = Math.min(W / 640, H / 400);
      var jx = W * 0.4, base = H - 40 * k, jw = 260 * k, jh = 270 * k;
      var t = (now || 0) / 1000;

      // base plate
      D.roundRect(ctx, jx - jw / 2 - 30 * k, base, jw + 60 * k, 16 * k, 4, c.muted);
      // air particles inside the jar
      var n = Math.round(particles.length * sim.p.air / 100);
      for (var i = 0; i < particles.length && i < n; i++) {
        var p = particles[i];
        var wob = sim.reduceMotion ? 0 : 1;
        var x = jx - jw / 2 + 14 * k + ((p.x + p.vx * t * 0.1 * wob) % 1 + 1) % 1 * (jw - 28 * k);
        var y = base - jh + 30 * k + ((p.y + p.vy * t * 0.1 * wob) % 1 + 1) % 1 * (jh - 40 * k);
        D.circle(ctx, x, y, 2.4 * k + 0.5, D.alpha(c.s1, 0.7));
      }
      // bell
      var bx = jx, by = base - 110 * k;
      D.roundRect(ctx, bx - 8 * k, by + 40 * k, 16 * k, base - by - 40 * k, 3, c.faint); // stand
      ctx.fillStyle = c.s3;
      ctx.beginPath(); ctx.arc(bx, by, 42 * k, Math.PI, 0); ctx.lineTo(bx + 42 * k, by + 12 * k); ctx.lineTo(bx - 42 * k, by + 12 * k); ctx.closePath(); ctx.fill();
      var swing = sim.p.bell && sim.running ? Math.sin(s.hammer) * 0.5 : 0;
      ctx.save(); ctx.translate(bx + 60 * k, by + 40 * k); ctx.rotate(-0.9 + swing);
      D.line(ctx, 0, 0, 0, -58 * k, c.ink, 3 * k); D.circle(ctx, 0, -58 * k, 8 * k, c.ink);
      ctx.restore();
      // wires to battery
      D.line(ctx, bx + 40 * k, base + 8 * k, W * 0.78, base + 8 * k, c.danger, 2);
      D.roundRect(ctx, W * 0.78, base - 6 * k, 40 * k, 26 * k, 4, sim.p.bell ? c.success : c.faint);
      D.text(ctx, sim.p.bell ? 'ON' : 'OFF', W * 0.78 + 20 * k, base + 7 * k, { color: '#fff', size: 10 * k + 4, weight: 700, align: 'center' });

      // glass jar
      ctx.save();
      ctx.strokeStyle = D.alpha(c.ink, 0.6); ctx.lineWidth = 2.5; ctx.fillStyle = D.alpha(c.s1, 0.05);
      ctx.beginPath();
      ctx.moveTo(jx - jw / 2, base);
      ctx.lineTo(jx - jw / 2, base - jh + jw / 2);
      ctx.arc(jx, base - jh + jw / 2, jw / 2, Math.PI, 0);
      ctx.lineTo(jx + jw / 2, base);
      ctx.fill(); ctx.stroke(); ctx.restore();
      D.circle(ctx, jx, base - jh - 6 * k, 8 * k, c.muted); // knob

      // hose to pump
      var px = jx - jw / 2 - 80 * k;
      ctx.strokeStyle = c.muted; ctx.lineWidth = 6 * k; ctx.beginPath();
      ctx.moveTo(jx - jw / 2 + 6, base + 8 * k); ctx.quadraticCurveTo(px + 20 * k, base + 30 * k, px, base - 20 * k); ctx.stroke();
      var piston = s.pump ? Math.sin(t * 12) * 12 * k : 0;
      D.roundRect(ctx, px - 20 * k, base - 110 * k, 40 * k, 90 * k, 6, c.surface2, c.border, 2);
      D.line(ctx, px, base - 110 * k - 30 * k + piston, px, base - 70 * k + piston, c.ink, 4 * k);
      D.roundRect(ctx, px - 22 * k, base - 142 * k + piston, 44 * k, 8 * k, 3, c.ink);
      D.text(ctx, 'pump', px, base + 26 * k, { color: c.muted, size: 11, align: 'center' });
      if (s.pump) D.text(ctx, s.pump < 0 ? '← air out' : 'air in →', px, base - 160 * k, { color: c.s1, size: 12, weight: 600, align: 'center' });

      // sound waves outside the jar reach the ear
      var l = loud(sim) / 100;
      var ex = W - 50 * k;
      if (sim.p.bell && sim.running && l > 0.01) {
        for (var r = 0; r < 4; r++) {
          var rr = ((t * 80 + r * 40) % 160) * k;
          ctx.strokeStyle = D.alpha(c.accent, l * (1 - rr / (160 * k)));
          ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(jx + jw / 2, by, 20 * k + rr, -0.6, 0.6); ctx.stroke();
        }
      }
      D.text(ctx, '👂', ex, by, { size: 34 * k, align: 'center' });
      // loudness meter
      D.roundRect(ctx, ex - 8 * k, by + 30 * k, 16 * k, 100 * k, 4, D.alpha(c.muted, 0.2));
      D.roundRect(ctx, ex - 8 * k, by + 30 * k + 100 * k * (1 - l), 16 * k, 100 * k * l, 4, c.accent);
      D.text(ctx, Math.round(sim.p.air) + '% air', jx, base - jh - 26 * k, { color: c.muted, size: 12, weight: 600, align: 'center' });
    },
    animate: function (sim) { return !sim.reduceMotion; } // keep particles drifting while paused
  });

  function loud(sim) { return sim.p.bell && sim.running ? sim.p.air : 0; }
})();
