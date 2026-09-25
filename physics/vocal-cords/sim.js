/* =====================================================================
   Sound Lab · Voice Box (Larynx) — sim.js
   ---------------------------------------------------------------------
   In the larynx (voice box) two vocal cords stretch across the airway
   with a narrow slit between them. Air pushed up from the lungs makes
   the cords vibrate → sound (our voice).
     • Tighter / thinner cords → faster vibration → higher pitch
     • Longer / thicker cords  → lower pitch (men ≈ 20 mm, women ≈ 15 mm,
       children shorter still)
     • More air pushed        → bigger vibration → louder voice
   Pitch model: f = f_base(voice type) × (0.7 + 0.8 × tightness).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var TYPES = {
    man:   { label: 'Man (cords ≈ 20 mm)', base: 110, len: 20 },
    woman: { label: 'Woman (cords ≈ 15 mm)', base: 210, len: 15 },
    child: { label: 'Child (cords ≈ 10 mm)', base: 290, len: 10 }
  };
  var voice = null;

  function pitch(p) { return TYPES[p.type].base * (0.7 + 0.8 * p.tension / 100); }

  SimLab.createSim({
    ariaLabel: 'Top view of the vocal cords in the larynx vibrating as air flows up from the lungs',
    audio: true,
    mobileAspect: '4 / 4.4', // taller canvas on phones
    autoplay: true,
    playLabel: 'Hum',
    params: [
      { id: 'type', label: 'Whose voice?', type: 'select', value: 'woman', options: Object.keys(TYPES).map(function (k) { return { value: k, label: TYPES[k].label }; }) },
      { id: 'tension', label: 'Tightness of vocal cords', min: 0, max: 100, step: 1, value: 50, unit: '%' },
      { id: 'air', label: 'Air pushed from lungs', min: 0, max: 100, step: 1, value: 60, unit: '%' },
      { id: 'vowel', label: 'Sound', type: 'select', value: 'aa', options: [{ value: 'aa', label: '“Aaa”' }, { value: 'mm', label: '“Mmm” (hum)' }] }
    ],
    readouts: [
      { id: 'f', label: 'Pitch (frequency)', unit: 'Hz', digits: 0, key: true },
      { id: 'len', label: 'Cord length', unit: 'mm', digits: 0 },
      { id: 'loud', label: 'Loudness', unit: '%', digits: 0, key: true },
      { id: 'cords', label: 'Vocal cords' }
    ],
    onParam: function (sim) { syncVoice(sim); return true; },
    onRunChange: function (sim) { syncVoice(sim); },
    onSound: function (sim) { syncVoice(sim); },
    reset: function (sim) { sim.state = {}; },

    readout: function (sim) {
      var p = sim.p;
      return { f: pitch(p), len: TYPES[p.type].len, loud: sim.running ? p.air : 0,
        cords: !sim.running || p.air === 0 ? 'Relaxed, open (breathing)' : p.tension > 66 ? 'Tight & thin → high pitch' : p.tension < 33 ? 'Loose & thick → low pitch' : 'Vibrating' };
    },
    status: function (sim) { return sim.running && sim.p.air > 0 ? 'Voice on · ' + Math.round(pitch(sim.p)) + ' Hz' : 'Breathing quietly'; },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p;
      D.clear(ctx, W, H, c.bg);
      var t = (now || 0) / 1000;
      var on = sim.running && p.air > 0;
      var wide = W > 560;
      var cx = wide ? W * 0.32 : W / 2, cy = wide ? H / 2 : H * 0.4, R = Math.min(wide ? W * 0.25 : W * 0.4, H * (wide ? 0.4 : 0.33));

      // --- top view of larynx (ring of cartilage)
      D.circle(ctx, cx, cy, R, D.alpha(c.s2, 0.18), D.alpha(c.s2, 0.6), 3);
      D.text(ctx, 'Top view of the larynx', cx, cy - R - 12, { color: c.muted, size: 12, align: 'center' });
      // vocal cords as two curved folds forming a V (front at top)
      var len = R * (0.75 + TYPES[p.type].len / 60);
      var visF = on ? 3 + p.tension / 25 : 0;                        // slowed vibration for the eye
      var open = on ? (0.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * visF))) * (8 + p.air / 5) : 26; // gap width
      var thick = 18 - p.tension / 10;
      var apex = { x: cx, y: cy - len / 2 }, bottom = cy + len / 2;
      ctx.fillStyle = c.light ? '#f9a8d4' : '#f472b6';
      [-1, 1].forEach(function (side) {
        ctx.beginPath();
        ctx.moveTo(apex.x, apex.y);
        ctx.quadraticCurveTo(cx + side * (open * 0.6), cy, cx + side * open, bottom);
        ctx.lineTo(cx + side * (open + thick), bottom);
        ctx.quadraticCurveTo(cx + side * (open * 0.6 + thick * 1.6), cy, apex.x + side * 4, apex.y);
        ctx.closePath(); ctx.fill();
      });
      // glottis (the slit) label
      D.text(ctx, 'slit', cx, bottom + 14, { color: c.faint, size: 11, align: 'center' });
      D.text(ctx, 'vocal cords', cx + R * 0.55, cy + R * 0.2, { color: c.ink, size: 12, weight: 600, align: 'center' });

      // --- air particles rising through the slit (drawn as dots moving up)
      if (p.air > 0 && sim.running) {
        for (var i = 0; i < 14; i++) {
          var ph = ((t * (0.4 + p.air / 120) + i / 14) % 1);
          D.circle(ctx, cx + Math.sin(i * 7.3) * open * 0.4, bottom - ph * len, 2.5, D.alpha(c.s1, 1 - ph));
        }
      }

      // --- side panel: pathway lungs → larynx → mouth + sound waves
      if (wide) {
        var sx = W * 0.72, top = 30, bot = H - 30;
        D.roundRect(ctx, sx - 14, top + 40, 28, bot - top - 110, 12, D.alpha(c.s2, 0.25));  // windpipe
        D.circle(ctx, sx - 34, bot - 40, 34, D.alpha(c.s2, 0.35));                          // lungs
        D.circle(ctx, sx + 34, bot - 40, 34, D.alpha(c.s2, 0.35));
        D.text(ctx, 'lungs', sx, bot - 40, { color: c.muted, size: 11, align: 'center' });
        D.roundRect(ctx, sx - 22, H / 2 - 16, 44, 32, 8, c.s2);
        D.text(ctx, 'larynx', sx + 52, H / 2, { color: c.muted, size: 11 });
        D.text(ctx, '😮', sx, top + 22, { size: 30, align: 'center' });
        if (on) {
          D.arrow(ctx, sx, bot - 80, sx, H / 2 + 22, D.alpha(c.s1, 0.8), 3);
          for (var r = 0; r < 4; r++) {
            var rr = (t * 60 + r * 22) % 88;
            ctx.strokeStyle = D.alpha(c.accent, (1 - rr / 88) * p.air / 100);
            ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx + 18, top + 22, 12 + rr, -0.7, 0.7); ctx.stroke();
          }
        }
      } else if (on) {
        for (var r2 = 0; r2 < 4; r2++) {
          var rr2 = (t * 60 + r2 * 22) % 88;
          ctx.strokeStyle = D.alpha(c.accent, (1 - rr2 / 88) * p.air / 100);
          ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy - R, 10 + rr2, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
        }
      }
      if (!on) D.text(ctx, sim.running ? 'No air → no sound' : 'Press “Hum”', cx, H - 16, { color: c.muted, size: 12, align: 'center' });
      D.text(ctx, '(vibration slowed down)', W - 10, H - 10, { color: c.faint, size: 10, align: 'right' });
    },
    animate: function (sim) { return !sim.reduceMotion; }
  });

  function syncVoice(sim) {
    var on = sim.running && A.enabled && sim.p.air > 0;
    if (on) {
      if (!voice) voice = A.voice('sawtooth');
      // a hum is softer (closed mouth) — use a triangle wave; "aa" is buzzier
      voice.set(pitch(sim.p), Math.pow(sim.p.air / 100, 1.2) * (sim.p.vowel === 'mm' ? 0.45 : 0.22), sim.p.vowel === 'mm' ? 'triangle' : 'sawtooth');
    } else if (voice) { voice.stop(); voice = null; }
  }
})();
