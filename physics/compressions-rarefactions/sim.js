/* =====================================================================
   Sound (Class 9) · Compressions and Rarefactions — sim.js
   ---------------------------------------------------------------------
   A loudspeaker sends a sound wave through a medium. Every layer of
   particles at rest position x moves back and forth along the wave:
     s(x, t) = A sin(ωt − kx)     (only where the wave has arrived,
                                   x < v t)
     pressure (density) excess ∝ −∂s/∂x = A k cos(ωt − kx)
       → compressions where ωt − kx = 2πn, rarefactions halfway between
     v = f λ,   ω = 2π f,   k = 2π / λ
   Speeds: air 331 m/s at 0 °C, 343 at 20 °C, 355 at 40 °C
   (v = 331 √(T/273 K)); water 1482 m/s; steel 5960 m/s.
   The scene is 3 m wide in air at 20 °C and scaled by v/343 for other
   media, so the same frequency always shows the same number of waves.
   The motion is shown 300 times slower than real. The displacement is
   hugely exaggerated (A k up to 0.6); real sound moves air particles
   by less than a micrometre.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var SLOW = 300, voice = null;
  var MED = { air0: { v: 331, name: 'air at 0 °C' }, air20: { v: 343, name: 'air at 20 °C' }, air40: { v: 355, name: 'air at 40 °C' }, water: { v: 1482, name: 'water' }, steel: { v: 5960, name: 'steel' } };
  var jit = (function () { var r = M.rng(9), a = []; for (var i = 0; i < 2000; i++) a.push(r()); return a; })();

  function wave(sim) {
    var p = sim.p, v = MED[p.medium].v, f = p.freq, lam = v / f, L = 3 * v / 343;
    var tr = sim.time / SLOW;
    return { v: v, f: f, lam: lam, L: L, k: 2 * Math.PI / lam, w: 2 * Math.PI * f, tr: tr, front: v * tr, Ak: 0.06 * p.amp };
  }
  function disp(o, x) { return x < o.front ? (o.Ak / o.k) * Math.sin(o.w * o.tr - o.k * x) : 0; } // metres (scene units)
  function press(o, x) { return x < o.front ? Math.cos(o.w * o.tr - o.k * x) : 0; }
  function syncVoice(sim) {
    var on = sim.running && A.enabled && sim.p.hear;
    if (on) { if (!voice) voice = A.voice('sine'); voice.set(sim.p.freq, 0.05 + 0.04 * sim.p.amp, 'sine'); }
    else if (voice) { voice.stop(); voice = null; }
  }

  SimLab.createSim({
    ariaLabel: 'A loudspeaker pushes air particles back and forth, making compressions and rarefactions that travel along; a slinky and a pressure graph show the same wave',
    audio: true,
    mobileAspect: '4 / 5',
    playLabel: 'Switch on the speaker',
    params: [
      { id: 'freq', label: 'Frequency', min: 100, max: 1000, step: 0.5, value: 343, unit: 'Hz', presets: [{ label: '171.5', value: 171.5 }, { label: '256 (fork)', value: 256 }, { label: '343', value: 343 }, { label: '686', value: 686 }] },
      { id: 'medium', label: 'Medium', type: 'select', value: 'air20', options: [
        { value: 'air0', label: 'Air at 0 °C (331 m/s)' }, { value: 'air20', label: 'Air at 20 °C (343 m/s)' }, { value: 'air40', label: 'Air at 40 °C (355 m/s)' },
        { value: 'water', label: 'Water (1482 m/s)' }, { value: 'steel', label: 'Steel (5960 m/s)' }] },
      { id: 'amp', label: 'Loudness (amplitude)', min: 1, max: 10, step: 1, value: 6 },
      { id: 'view', label: 'Show', type: 'select', value: 'both', options: [
        { value: 'both', label: 'Particles + slinky' }, { value: 'air', label: 'Particles only' }, { value: 'slinky', label: 'Slinky only' }] },
      { id: 'hear', label: 'Hear the note (sound must be on)', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'lam', label: 'Wavelength λ', short: 'λ', key: true },
      { id: 'f', label: 'Frequency f', short: 'f', key: true },
      { id: 'v', label: 'Speed v = f λ', short: 'v', key: true },
      { id: 'T', label: 'Time period T = 1/f' },
      { id: 'scene', label: 'Width of the picture' },
      { id: 'travel', label: 'Time to cross the picture' }
    ],
    graph: { title: 'Red particle displacement and pressure at its place (real time)', xLabel: 'time (ms)', yLabel: 'relative', series: [{ label: 'displacement of red particle' }, { label: 'pressure change there' }], window: 20, yMin: -1.1, yMax: 1.1 },

    reset: function (sim) { sim.state = { acc: 0 }; if (sim.graph) sim.graph.clear(); },
    onParam: function (sim, id) { syncVoice(sim); return id === 'hear' || id === 'view' || id === 'amp'; },
    onRunChange: function (sim) { syncVoice(sim); },
    onSound: function (sim) { syncVoice(sim); },
    update: function (sim, dt) {
      var s = sim.state; s.acc += dt;
      if (s.acc < 1 / 60 || !sim.graph) return;
      s.acc = 0;
      var o = wave(sim), xr = o.L * 0.36, a = disp(o, xr) / (o.Ak / o.k);
      sim.graph.push(o.tr * 1000, [a, press(o, xr)]);
    },
    status: function (sim) { return sim.running ? 'Slow motion: 300 times slower than real' : 'Speaker off'; },
    readout: function (sim) {
      var o = wave(sim);
      return {
        lam: (o.lam >= 1 ? M.fmt(o.lam, 2) + ' m' : M.fmt(o.lam * 100, 1) + ' cm'),
        f: M.fmt(o.f, o.f % 1 ? 1 : 0) + ' Hz', v: o.v + ' m/s', T: M.fmt(1000 / o.f, 2) + ' ms',
        scene: M.fmt(o.L, o.L < 10 ? 1 : 0) + ' m (' + M.fmt(o.L / o.lam, 1) + ' wavelengths)',
        travel: M.fmt(o.L / o.v * 1000, 1) + ' ms'
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, o = wave(sim);
      var nar = W < 560, fs = nar ? 10 : 12;
      D.clear(ctx, W, H, c.bg);
      var spk = nar ? 30 : 46, x0 = spk + 8, x1 = W - 8, sw = x1 - x0, ppm = sw / o.L;
      var showAir = p.view !== 'slinky', showSl = p.view !== 'air';
      var gh = Math.max(56, H * 0.24), top = nar ? 22 : 28;
      var avail = H - top - gh - 26, airH = showAir ? (showSl ? avail * 0.64 : avail) : 0, slH = showSl ? (showAir ? avail * 0.36 : avail * 0.6) : 0;
      D.text(ctx, 'Sound in ' + MED[p.medium].name + ' · picture ' + M.fmt(o.L, o.L < 10 ? 1 : 0) + ' m wide', 8, top / 2 + 2, { color: c.ink, size: fs + 1, weight: 700, fit: W });
      var sx = disp(o, 0) * ppm; // speaker cone displacement
      // loudspeaker
      var cy = top + (airH + slH) / 2;
      D.roundRect(ctx, 4, cy - 34, spk - 10, 68, 5, c.light ? '#334155' : '#1e293b', c.ink, 1.5);
      ctx.save(); ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(spk - 6, cy - 14); ctx.lineTo(spk + 2 + sx, cy - 30); ctx.lineTo(spk + 2 + sx, cy + 30); ctx.lineTo(spk - 6, cy + 14); ctx.closePath(); ctx.fill(); ctx.restore();
      D.line(ctx, spk + 2 + sx, cy - 30, spk + 2 + sx, cy + 30, c.ink, 2.5);
      // compression and rarefaction positions inside the picture
      var marks = [];
      for (var n = Math.floor((o.w * o.tr - o.k * o.L) / (2 * Math.PI)) - 1; n <= Math.ceil(o.w * o.tr / (2 * Math.PI)) + 1; n++) {
        [[0, 'C'], [Math.PI, 'R']].forEach(function (q) {
          var x = (o.w * o.tr - 2 * Math.PI * n - q[0]) / o.k;
          if (x > o.lam * 0.05 && x < Math.min(o.L, o.front) - o.lam * 0.02) marks.push({ x: x, t: q[1] });
        });
      }
      // air particles
      var y = top;
      if (showAir) {
        var cols = Math.round(sw / (nar ? 7 : 9)), rows = Math.max(5, Math.round(airH / (nar ? 13 : 15)));
        marks.forEach(function (m) { if (m.t === 'C') { ctx.fillStyle = D.alpha('#f97316', 0.1); ctx.fillRect(x0 + m.x * ppm - o.lam * ppm * 0.12, y, o.lam * ppm * 0.24, airH); } });
        var tagCol = Math.round(cols * 0.36), tagRow = Math.floor(rows / 2);
        for (var i = 0; i <= cols; i++) {
          var xm = i / cols * o.L, dx = disp(o, xm) * ppm;
          for (var j = 0; j < rows; j++) {
            var jx = (jit[(i * 31 + j * 7) % 2000] - 0.5) * 3, jy = (jit[(i * 17 + j * 13 + 5) % 2000] - 0.5) * 4;
            var px = x0 + xm * ppm + dx + jx, py = y + (j + 0.5) / rows * airH + jy;
            if (i === tagCol && j === tagRow) continue;
            D.circle(ctx, px, py, nar ? 1.9 : 2.3, c.light ? '#475569' : '#cbd5e1');
          }
        }
        var txm = tagCol / cols * o.L, tx = x0 + txm * ppm, ty = y + (tagRow + 0.5) / rows * airH;
        D.line(ctx, tx, ty - 9, tx, ty + 9, c.danger, 1, [2, 2]);
        D.circle(ctx, tx + disp(o, txm) * ppm, ty, 4.5, c.danger, '#fff', 1.2);
        marks.forEach(function (m) { D.text(ctx, m.t, x0 + m.x * ppm, y + 7, { color: m.t === 'C' ? '#f97316' : '#38bdf8', size: fs, weight: 800, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2 }); });
        y += airH;
      }
      // slinky: loops placed at their displaced positions
      if (showSl) {
        var loops = Math.round(sw / (nar ? 8 : 10)), mid = y + slH / 2 + 2, hh = Math.min(slH * 0.38, 24);
        ctx.save(); ctx.strokeStyle = c.light ? '#64748b' : '#94a3b8'; ctx.lineWidth = 1.4; ctx.beginPath();
        for (var l = 0; l <= loops; l++) {
          var xl = l / loops * o.L, X = x0 + xl * ppm + disp(o, xl) * ppm;
          ctx.moveTo(X + 2, mid - hh); ctx.ellipse(X, mid, 2, hh, 0, -Math.PI / 2, Math.PI * 1.5);
        }
        ctx.stroke(); ctx.restore();
        D.text(ctx, 'slinky', W - 10, mid - hh - 8, { color: c.muted, size: fs - 1, align: 'right' });
        y += slH;
      }
      // pressure along the wave
      var gy = y + 8, gm = gy + gh / 2, ga = gh / 2 - 6;
      D.roundRect(ctx, x0, gy, sw, gh, 6, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.15));
      D.line(ctx, x0, gm, x1, gm, c.axis, 1);
      ctx.save(); ctx.beginPath(); ctx.moveTo(x0, gm);
      for (var X2 = 0; X2 <= sw; X2 += 2) ctx.lineTo(x0 + X2, gm - press(o, X2 / ppm) * ga * p.amp / 10);
      ctx.lineTo(x1, gm); ctx.closePath(); ctx.fillStyle = D.alpha('#f97316', 0.18); ctx.fill();
      ctx.beginPath(); for (var X3 = 0; X3 <= sw; X3 += 2) { var yy = gm - press(o, X3 / ppm) * ga * p.amp / 10; if (X3) ctx.lineTo(x0 + X3, yy); else ctx.moveTo(x0, yy); }
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      D.text(ctx, 'pressure: high ▲ / low ▼', x0 + 6, gy + 9, { color: c.muted, size: fs - 1 });
      // wavelength between two neighbouring compressions
      var cs = marks.filter(function (m) { return m.t === 'C'; }).sort(function (a, b) { return a.x - b.x; });
      if (cs.length >= 2) {
        var ax = x0 + cs[0].x * ppm, bx = x0 + cs[1].x * ppm, ay = gy + gh + 10;
        D.arrow(ctx, (ax + bx) / 2, ay, ax, ay, c.accent, 1.6, 6); D.arrow(ctx, (ax + bx) / 2, ay, bx, ay, c.accent, 1.6, 6);
        D.text(ctx, 'λ = ' + (o.lam >= 1 ? M.fmt(o.lam, 2) + ' m' : M.fmt(o.lam * 100, 1) + ' cm'), (ax + bx) / 2, ay, { color: c.accent, size: fs, weight: 700, align: 'center', bg: c.bg, pad: 3, fit: W });
      } else if (o.front < o.L) {
        D.text(ctx, sim.time ? 'the wave is on its way…' : 'Press Play to switch on the speaker', W / 2, gy + gh + 10, { color: c.muted, size: fs, align: 'center', fit: W });
      }
    }
  });
})();
