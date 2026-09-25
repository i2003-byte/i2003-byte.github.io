/* =====================================================================
   Sound Lab · Inside the Ear — sim.js
   ---------------------------------------------------------------------
   Follow sound through the ear:
     outer ear (pinna) collects sound → ear canal → EARDRUM (a thin
     stretched membrane) vibrates → three tiny bones (hammer, anvil,
     stirrup) pass the vibration on → cochlea (inner ear) turns it into
     electrical signals → auditory nerve → brain: "I hear something!"
   Tap any part to learn what it does. Try a damaged eardrum to see why
   hearing depends on it, and never put sharp objects in your ears.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var voice = null;

  var PARTS = [
    { id: 'pinna', name: 'Outer ear (pinna)', info: 'Collects sound waves and funnels them into the ear canal.' },
    { id: 'canal', name: 'Ear canal', info: 'A tube that carries the sound waves to the eardrum.' },
    { id: 'drum', name: 'Eardrum', info: 'A thin, tightly stretched membrane. Sound waves make it vibrate — just like the skin of a drum.' },
    { id: 'bones', name: 'Three tiny bones', info: 'Hammer, anvil and stirrup — the smallest bones in your body. They pass the vibrations from the eardrum to the inner ear, making them stronger.' },
    { id: 'cochlea', name: 'Cochlea (inner ear)', info: 'A fluid-filled, snail-shaped tube. Tiny hair cells inside turn vibrations into electrical signals.' },
    { id: 'nerve', name: 'Auditory nerve → brain', info: 'Carries the signals to the brain, which understands them as sound.' }
  ];

  var geo = {};
  function layout(W, H) {
    var s = Math.min(W / 700, H / 420);
    var ox = (W - 700 * s) / 2, oy = (H - 420 * s) / 2;
    function P(x, y) { return { x: ox + x * s, y: oy + y * s }; }
    geo = {
      s: s, P: P,
      pinna: P(90, 200), canalStart: P(130, 210), canalEnd: P(330, 210), drum: P(340, 210),
      bones: [P(375, 190), P(405, 180), P(435, 200)], cochlea: P(505, 205), nerveEnd: P(650, 110), brain: P(650, 80)
    };
  }

  SimLab.createSim({
    ariaLabel: 'Cross-section of the human ear with a sound wave travelling to the brain',
    audio: true,
    mobileAspect: '4 / 3.2', // taller canvas on phones
    autoplay: true,
    params: [
      { id: 'loud', label: 'Loudness of the sound', min: 0, max: 100, step: 1, value: 60, unit: '%' },
      { id: 'pitch', label: 'Pitch', min: 100, max: 1000, step: 10, value: 300, unit: 'Hz' },
      { id: 'damaged', label: 'Damaged (torn) eardrum', type: 'toggle', value: false },
      { id: 'labels', label: 'Show labels', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'part', label: 'Selected part', key: true },
      { id: 'signal', label: 'Signal reaching brain', unit: '%', digits: 0, key: true },
      { id: 'brain', label: 'Brain says' }
    ],
    onParam: function (sim) { syncVoice(sim); return true; },
    onRunChange: function (sim) { syncVoice(sim); },
    onSound: function (sim) { syncVoice(sim); },
    reset: function (sim) { sim.state = { sel: 2 }; },

    readout: function (sim) {
      var sig = signal(sim);
      return {
        part: PARTS[sim.state.sel].name,
        signal: sig,
        brain: sig > 50 ? 'Clear sound! 🧠' : sig > 10 ? 'Faint sound… 🧠' : 'Nothing heard 🤷'
      };
    },
    status: function (sim) { return PARTS[sim.state.sel].info; },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      layout(W, H);
      var P = geo.P, k = geo.s, t = sim.running ? sim.time : 0;
      var amp = sim.p.loud / 100, visF = 0.6 + sim.p.pitch / 500;
      var skin = c.light ? '#fcd9bd' : '#b98a6a', flesh = c.light ? '#f9a8a8' : '#9f5b5b';

      // head / skin block
      ctx.fillStyle = D.alpha(skin, 0.35);
      ctx.beginPath(); ctx.moveTo(P(120, 20).x, P(120, 20).y); ctx.lineTo(P(700, 20).x, P(700, 20).y);
      ctx.lineTo(P(700, 400).x, P(700, 400).y); ctx.lineTo(P(120, 400).x, P(120, 400).y); ctx.closePath(); ctx.fill();

      // pinna
      ctx.fillStyle = skin; ctx.beginPath();
      ctx.ellipse(geo.pinna.x, geo.pinna.y, 45 * k, 110 * k, -0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = D.alpha(flesh, 0.5); ctx.beginPath(); ctx.ellipse(geo.pinna.x + 6 * k, geo.pinna.y, 22 * k, 70 * k, -0.15, 0, Math.PI * 2); ctx.fill();

      // ear canal
      D.roundRect(ctx, geo.canalStart.x, geo.canalStart.y - 22 * k, geo.canalEnd.x - geo.canalStart.x, 44 * k, 18 * k, c.bg, D.alpha(flesh, 0.9), 3);

      // incoming sound wave in air (left) + in the canal
      var lam = 60 * k, w = 2 * Math.PI * visF;
      if (amp > 0 && sim.running) {
        for (var x = 4; x < geo.canalEnd.x - 4; x += 6 * k) {
          var inCanal = x > geo.canalStart.x;
          var yy = geo.canalStart.y + (inCanal ? 0 : -10 * k);
          var disp = Math.sin((x / lam) * 2 * Math.PI - w * t) * amp;
          D.line(ctx, x, yy - 14 * k * (inCanal ? 0.9 : 1.6), x, yy + 14 * k * (inCanal ? 0.9 : 1.6), D.alpha(c.accent, 0.25 + 0.5 * Math.max(0, disp)), 2);
        }
      }

      // eardrum
      var drumAmp = sim.running ? amp * (sim.p.damaged ? 0.12 : 1) : 0;
      var bulge = Math.sin(-w * t + 2) * 8 * k * drumAmp;
      ctx.strokeStyle = sim.p.damaged ? c.danger : c.s3; ctx.lineWidth = 4 * k;
      ctx.beginPath(); ctx.moveTo(geo.drum.x, geo.drum.y - 34 * k);
      ctx.quadraticCurveTo(geo.drum.x + bulge * 2, geo.drum.y, geo.drum.x, geo.drum.y + 34 * k); ctx.stroke();
      if (sim.p.damaged) D.text(ctx, '✕', geo.drum.x + 4 * k, geo.drum.y - 44 * k, { color: c.danger, size: 18 * k + 6, weight: 700, align: 'center' });

      // middle-ear space
      ctx.strokeStyle = D.alpha(flesh, 0.6); ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.ellipse(P(405, 205).x, P(405, 205).y, 68 * k, 60 * k, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);

      // three bones (move with eardrum)
      var jig = bulge * 0.8;
      ctx.lineCap = 'round';
      var b = geo.bones, bone = c.light ? '#e7e5e4' : '#f5f5f4';
      D.line(ctx, geo.drum.x + jig, geo.drum.y - 10 * k, b[0].x + jig, b[0].y, bone, 9 * k);
      D.circle(ctx, b[0].x + jig, b[0].y, 9 * k, bone);
      D.line(ctx, b[0].x + jig, b[0].y, b[1].x + jig * 0.8, b[1].y, bone, 8 * k);
      D.circle(ctx, b[1].x + jig * 0.8, b[1].y, 8 * k, bone);
      D.line(ctx, b[1].x + jig * 0.8, b[1].y, b[2].x + jig * 0.6, b[2].y, bone, 6 * k);
      D.roundRect(ctx, b[2].x + jig * 0.6 - 4 * k, b[2].y - 10 * k, 12 * k, 22 * k, 4, bone);

      // cochlea spiral (glows with signal)
      var sig = signal(sim) / 100;
      ctx.strokeStyle = D.alpha(c.s4, 0.35 + 0.65 * sig * (0.6 + 0.4 * Math.sin(t * 8)));
      ctx.lineWidth = 9 * k; ctx.beginPath();
      for (var a = 0; a < Math.PI * 5; a += 0.1) {
        var r = 40 * k * (1 - a / (Math.PI * 6.2));
        var px = geo.cochlea.x + Math.cos(a) * r, py = geo.cochlea.y + Math.sin(a) * r;
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // nerve with signal pulses → brain
      ctx.strokeStyle = D.alpha(c.s3, 0.8); ctx.lineWidth = 4 * k; ctx.beginPath();
      ctx.moveTo(geo.cochlea.x + 30 * k, geo.cochlea.y - 20 * k);
      ctx.quadraticCurveTo(P(600, 170).x, P(600, 170).y, geo.nerveEnd.x, geo.nerveEnd.y); ctx.stroke();
      if (sig > 0.02 && sim.running) {
        for (var n = 0; n < 4; n++) {
          var u = ((sim.time * 0.8 + n / 4) % 1);
          var x0 = geo.cochlea.x + 30 * k, y0 = geo.cochlea.y - 20 * k, cx1 = P(600, 170).x, cy1 = P(600, 170).y;
          var bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx1 + u * u * geo.nerveEnd.x;
          var by = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy1 + u * u * geo.nerveEnd.y;
          D.circle(ctx, bx, by, 5 * k * (0.5 + sig), c.s3);
        }
      }
      D.text(ctx, '🧠', geo.brain.x, geo.brain.y, { size: 44 * k, align: 'center' });

      // labels
      if (sim.p.labels) {
        var L = [
          [0, geo.pinna.x, geo.pinna.y + 130 * k], [1, (geo.canalStart.x + geo.canalEnd.x) / 2, geo.canalStart.y + 42 * k],
          [2, geo.drum.x, geo.drum.y + 60 * k], [3, b[1].x, b[1].y - 40 * k], [4, geo.cochlea.x, geo.cochlea.y + 64 * k], [5, geo.brain.x, geo.brain.y + 48 * k]
        ];
        var narrow = W < 560; // phones: show only the selected label to avoid overlaps
        L.forEach(function (l) {
          var sel = s.sel === l[0];
          if (narrow && !sel) return;
          D.text(ctx, PARTS[l[0]].name, l[1], l[2], { color: sel ? c.bg : c.ink, bg: sel ? c.accent : D.alpha(c.surface, 0.85), size: Math.max(10, 12 * k), weight: 600, align: 'center', pad: 5, fit: W });
        });
      }
      D.text(ctx, 'Tap a part to learn about it', 10, H - 12, { color: c.faint, size: 11 });
    },
    animate: function (sim) { return false; },

    pointer: {
      hover: function (sim, x, y) { return hit(x, y) >= 0; },
      down: function (sim, x, y) {
        var i = hit(x, y);
        if (i < 0) return false;
        sim.state.sel = i;
        sim.toast(PARTS[i].name + ': ' + PARTS[i].info);
        return true;
      }
    }
  });

  function hit(x, y) {
    var k = geo.s; if (!k) return -1;
    var pts = [geo.pinna, { x: (geo.canalStart.x + geo.canalEnd.x) / 2, y: geo.canalStart.y }, geo.drum, geo.bones[1], geo.cochlea, geo.brain];
    var r = [60, 70, 30, 50, 55, 50];
    for (var i = pts.length - 1; i >= 0; i--) if (Math.hypot(x - pts[i].x, y - pts[i].y) < r[i] * k) return i;
    return -1;
  }
  function signal(sim) { return sim.running ? sim.p.loud * (sim.p.damaged ? 0.12 : 1) : 0; }
  function syncVoice(sim) {
    var on = sim.running && A.enabled && sim.p.loud > 0;
    if (on) {
      if (!voice) voice = A.voice('sine');
      voice.set(sim.p.pitch, (sim.p.loud / 100) * (sim.p.damaged ? 0.1 : 0.6));
    } else if (voice) { voice.stop(); voice = null; }
  }
})();
