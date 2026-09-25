/* =====================================================================
   Sound Lab · City Decibel Meter — sim.js
   ---------------------------------------------------------------------
   Loudness is measured in decibels (dB). The scale is not linear:
   every +10 dB sounds about twice as loud (and carries 10× the energy).
   Levels listed are typical values measured about 1 m away.
   Moving away lowers the level by ≈ 6 dB each time the distance doubles:
       L(d) = L(1 m) − 20·log10(d / 1 m)
   Safe listening time (a common workplace guideline): 8 hours at 85 dB,
   halved for every extra 3 dB.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;

  var SOURCES = [
    { id: 'leaves', name: 'Rustling leaves', icon: '🍃', db: 20, x: 0.08, y: 0.72 },
    { id: 'whisper', name: 'Whisper', icon: '🤫', db: 30, x: 0.22, y: 0.55 },
    { id: 'library', name: 'Quiet library', icon: '📚', db: 40, x: 0.36, y: 0.72 },
    { id: 'talk', name: 'Normal talking', icon: '🗣️', db: 60, x: 0.5, y: 0.55 },
    { id: 'traffic', name: 'Busy traffic', icon: '🚌', db: 85, x: 0.64, y: 0.72 },
    { id: 'horn', name: 'Pressure horn', icon: '📯', db: 100, x: 0.78, y: 0.55 },
    { id: 'speaker', name: 'Loudspeaker / DJ', icon: '🔊', db: 110, x: 0.92, y: 0.72 },
    { id: 'crackers', name: 'Firecrackers', icon: '🎆', db: 130, x: 0.64, y: 0.3 }
  ];

  function level(sim) {
    var src = SOURCES.find(function (s) { return s.id === sim.p.source; });
    return Math.max(0, src.db - 20 * Math.log10(sim.p.dist));
  }
  function category(db) {
    return db < 40 ? ['Quiet', 'success'] : db < 70 ? ['Comfortable', 'success'] : db < 85 ? ['Loud — annoying', 'warning'] :
      db < 120 ? ['Very loud — harmful over time', 'danger'] : ['Painful — damages hearing!', 'danger'];
  }
  function safeTime(db) {
    if (db < 80) return 'No limit';
    var h = 8 / Math.pow(2, (db - 85) / 3);
    return h >= 1 ? M.fmt(h, h < 10 ? 1 : 0) + ' h' : h * 60 >= 1 ? M.fmt(h * 60, 0) + ' min' : Math.max(1, Math.round(h * 3600)) + ' s';
  }

  SimLab.createSim({
    ariaLabel: 'A city scene with sound sources and a decibel meter dial',
    audio: true,
    mobileAspect: '3 / 4', // taller canvas on phones
    transport: false,
    params: [
      { id: 'source', label: 'Sound source', type: 'select', value: 'traffic', options: SOURCES.map(function (s) { return { value: s.id, label: s.icon + ' ' + s.name }; }) },
      { id: 'dist', label: 'Distance from source', min: 1, max: 64, step: 1, value: 1, unit: 'm',
        presets: [{ label: '1 m', value: 1 }, { label: '2 m', value: 2 }, { label: '4 m', value: 4 }, { label: '8 m', value: 8 }, { label: '16 m', value: 16 }] }
    ],
    buttonsTitle: 'Listen',
    buttons: [{ label: '🔊 Play a sample', full: true, onClick: function (sim) { sample(sim); } }],
    readouts: [
      { id: 'db', label: 'Sound level', unit: 'dB', digits: 0, key: true },
      { id: 'cat', label: 'Effect', key: true },
      { id: 'safe', label: 'Safe listening time' },
      { id: 'vs', label: 'Loudness vs talking' }
    ],
    onParam: function (sim) { sim.state.target = level(sim); return true; },
    reset: function (sim) { sim.state = { needle: level(sim), target: level(sim) }; },

    readout: function (sim) {
      var db = level(sim);
      var times = Math.pow(2, (db - 60) / 10);
      return { db: db, cat: category(db)[0], safe: safeTime(db), vs: times >= 1 ? M.fmt(times, times < 10 ? 1 : 0) + '× louder' : M.fmt(1 / times, 1) + '× softer' };
    },
    status: function (sim) { return 'Meter: ' + Math.round(level(sim)) + ' dB'; },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      // ease needle
      s.needle += (s.target - s.needle) * 0.15;
      var Lo = layout(sim), sceneH = Lo.sceneH, sceneW = Lo.sceneW;

      // city skyline
      var r = M.rng(5);
      for (var x = 0; x < sceneW; x += 34) {
        var bh = 40 + r() * sceneH * 0.3;
        D.roundRect(ctx, x, sceneH * 0.42 - bh, 30, bh, 3, D.alpha(c.muted, 0.15));
      }
      ctx.fillStyle = D.alpha(c.muted, 0.12); ctx.fillRect(0, sceneH * 0.85, sceneW, sceneH * 0.15);

      // sources
      SOURCES.forEach(function (src) {
        var sel = src.id === sim.p.source, px = src.x * (sceneW - 30) + 15, py = src.y * sceneH;
        if (sel) D.circle(ctx, px, py, 28, D.alpha(c.accent, 0.2), c.accent, 2);
        D.text(ctx, src.icon, px, py, { size: sel ? 30 : 24, align: 'center' });
        if (sel || sceneW > 700) D.text(ctx, src.db + ' dB', px, py + 30, { color: sel ? c.accent : c.faint, size: 10, weight: 600, align: 'center' });
      });
      D.text(ctx, 'Tap a sound source', 10, 16, { color: c.faint, size: 11 });

      // meter
      var mx = Lo.mx, my = Lo.my, R = Lo.R;
      var a0 = Math.PI * 1.1, a1 = Math.PI * 1.9;
      function ang(db) { return a0 + (a1 - a0) * M.clamp(db / 140, 0, 1); }
      D.roundRect(ctx, mx - R - 16, my - R - 20, 2 * R + 32, R + 80, 16, c.surface2, c.border, 2);
      [[0, 70, c.success], [70, 85, c.warning], [85, 140, c.danger]].forEach(function (z) {
        ctx.strokeStyle = z[2]; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(mx, my, R - 8, ang(z[0]), ang(z[1])); ctx.stroke();
      });
      for (var d = 0; d <= 140; d += 20) {
        var q = ang(d);
        D.text(ctx, String(d), mx + Math.cos(q) * (R - 28), my + Math.sin(q) * (R - 28), { color: c.muted, size: 10, align: 'center' });
      }
      var na = ang(s.needle);
      D.line(ctx, mx, my, mx + Math.cos(na) * (R - 12), my + Math.sin(na) * (R - 12), c.ink, 3);
      D.circle(ctx, mx, my, 7, c.ink);
      D.text(ctx, Math.round(s.needle) + ' dB', mx, my + 24, { color: c.ink, size: 20, weight: 700, align: 'center', font: c.mono });
      var cat = category(level(sim));
      D.text(ctx, cat[0], mx, my + 46, { color: c[cat[1]], size: 12, weight: 700, align: 'center' });
    },
    animate: function (sim) { return Math.abs(sim.state.needle - sim.state.target) > 0.1; },

    pointer: {
      hover: function (sim, x, y) { return pick(sim, x, y) != null; },
      down: function (sim, x, y) {
        var id = pick(sim, x, y); if (id == null) return false;
        sim.setParam('source', id, true); sample(sim);
        return true;
      }
    }
  });

  /* Side-by-side on wide screens; scene above the meter on phones */
  function layout(sim) {
    var W = sim.width, H = sim.height;
    if (W > 560) {
      var R = Math.min(W * 0.16, H * 0.36);
      return { wide: true, sceneW: W * 0.62, sceneH: H, mx: W * 0.81, my: H / 2 + R / 2 - 10, R: R };
    }
    var r = Math.min(W * 0.34, H * 0.26);
    return { wide: false, sceneW: W, sceneH: H - r - 110, mx: W / 2, my: H - 70, R: r };
  }

  function pick(sim, x, y) {
    var Lo = layout(sim), sceneH = Lo.sceneH, sceneW = Lo.sceneW;
    for (var i = 0; i < SOURCES.length; i++) {
      var s = SOURCES[i];
      if (Math.hypot(x - (s.x * (sceneW - 30) + 15), y - s.y * sceneH) < 26) return s.id;
    }
    return null;
  }
  function sample(sim) {
    if (!A.enabled) { sim.toast('Switch “Sound on” at the top to listen'); return; }
    var db = level(sim), g = M.clamp((db - 10) / 130, 0.03, 0.9); // safe, scaled playback
    var id = sim.p.source;
    if (id === 'talk' || id === 'whisper') A.noise(0.8, g * (id === 'whisper' ? 0.6 : 1), id === 'whisper' ? 6000 : 1500);
    else if (id === 'horn') A.tone(420, { type: 'sawtooth', duration: 0.9, gain: g * 0.6, harmonics: [1, 0.5] });
    else if (id === 'speaker') { [0, 250, 500, 750].forEach(function (d) { setTimeout(function () { A.tone(55, { duration: 0.2, gain: g }); A.noise(0.05, g * 0.5, 6000); }, d); }); }
    else if (id === 'crackers') { [0, 120, 200, 420].forEach(function (d) { setTimeout(function () { A.noise(0.12, g, 4000); }, d); }); }
    else A.noise(1, g, id === 'traffic' ? 600 : id === 'leaves' ? 5000 : 2000);
    sim.toast('Played quietly for safety — the real thing is ' + Math.round(db) + ' dB');
  }
})();
