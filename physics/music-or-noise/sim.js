/* =====================================================================
   Sound Lab · Music or Noise? — sim.js
   ---------------------------------------------------------------------
   Musical sounds have REGULAR wave patterns that repeat again and again.
   Noise has an IRREGULAR, jumbled pattern that never settles down.
   Each clip below is generated from a recipe: musical clips add a few
   harmonics of one note; noisy clips mix random jumps and bursts.
   Look at the wave (and listen, if sound is on) → sort it.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;

  // kind: 'music' | 'noise'. wave(x, t, rnd) returns −1..1 for the drawing.
  var CLIPS = [
    { name: 'Flute note', icon: '🪈', kind: 'music', f: 523, h: [1, 0.15], type: 'sine' },
    { name: 'Construction drill', icon: '🛠️', kind: 'noise', lp: 2500, bursts: true },
    { name: 'Guitar string', icon: '🎸', kind: 'music', f: 196, h: [1, 0.6, 0.4, 0.25], type: 'triangle' },
    { name: 'Busy traffic', icon: '🚗', kind: 'noise', lp: 800 },
    { name: 'Singing “la”', icon: '🎤', kind: 'music', f: 262, h: [1, 0.5, 0.35, 0.1], type: 'sine' },
    { name: 'Crowd chatter', icon: '👥', kind: 'noise', lp: 1800 },
    { name: 'Violin', icon: '🎻', kind: 'music', f: 440, h: [1, 0.7, 0.5, 0.35, 0.2], type: 'sawtooth' },
    { name: 'Pots & pans falling', icon: '🍳', kind: 'noise', lp: 5000, bursts: true },
    { name: 'Tabla (tuned)', icon: '🥁', kind: 'music', f: 294, h: [1, 0, 0.45, 0.2], type: 'sine' },
    { name: 'Thunder', icon: '⛈️', kind: 'noise', lp: 300 }
  ];

  var order = [];
  function shuffle() { order = CLIPS.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; }); }
  shuffle();

  SimLab.createSim({
    ariaLabel: 'The wave pattern of a sound clip for sorting into music or noise',
    audio: true,
    transport: false,
    params: [
      { id: 'hints', label: 'Show pattern hints', type: 'toggle', value: false }
    ],
    buttonsTitle: 'Sort the clip',
    buttons: [
      { label: '🎵 Music (regular)', primary: true, onClick: function (sim) { answer(sim, 'music'); } },
      { label: '💥 Noise (irregular)', primary: true, onClick: function (sim) { answer(sim, 'noise'); } },
      { label: '▶ Listen again', onClick: function (sim) { play(sim); } },
      { label: '⏭ Next clip', onClick: function (sim) { next(sim); } }
    ],
    readouts: [
      { id: 'clip', label: 'Clip', key: true },
      { id: 'score', label: 'Score', key: true },
      { id: 'streak', label: 'Streak', digits: 0 },
      { id: 'result', label: 'Last answer' }
    ],
    onParam: function () { return true; },
    onDefaults: function () { shuffle(); },
    reset: function (sim) { sim.state = { i: 0, score: 0, tried: 0, streak: 0, result: '—', answered: false, flash: 0 }; },

    readout: function (sim) {
      var s = sim.state;
      return { clip: (s.i % CLIPS.length + 1) + ' of ' + CLIPS.length, score: s.score + ' / ' + s.tried, streak: s.streak, result: s.result };
    },
    status: function (sim) { return sim.state.answered ? 'Tap “Next clip”' : 'Music or noise?'; },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state;
      var clip = CLIPS[order[s.i % CLIPS.length]];
      D.clear(ctx, W, H, c.bg);
      var t = sim.reduceMotion ? 0 : (now || 0) / 1000;
      var top = 70, bottom = H - 40, mid = (top + bottom) / 2, amp = (bottom - top) / 2 - 10;

      // title (name hidden until answered, to keep it a real test of the pattern)
      D.text(ctx, s.answered ? clip.icon + '  ' + clip.name : 'Mystery clip #' + (s.i % CLIPS.length + 1), W / 2, 30,
        { color: c.ink, size: 18, weight: 700, align: 'center' });
      D.grid(ctx, 10, top, W - 20, bottom - top, 40, c.grid);
      D.line(ctx, 10, mid, W - 10, mid, c.axis, 1);

      var rnd = M.rng(order[s.i % CLIPS.length] * 131 + 1);
      var noiseSeq = [];
      for (var i = 0; i < 400; i++) noiseSeq.push(rnd() * 2 - 1);
      var col = s.answered ? (clip.kind === 'music' ? c.success : c.danger) : c.accent;
      D.curve(ctx, function (x) {
        var u = (x - 10) / (W - 20);
        var v;
        if (clip.kind === 'music') {
          var cycles = 4 + clip.f / 110; v = 0;
          clip.h.forEach(function (a, k) { v += a * Math.sin(2 * Math.PI * (k + 1) * (u * cycles - t * 0.4)); });
          v /= clip.h.reduce(function (p, q) { return p + q; }, 0) * 0.8;
        } else {
          var idx = (u * 200 + t * 60) | 0, fr = (u * 200 + t * 60) % 1;
          var a1 = noiseSeq[idx % 400], a2 = noiseSeq[(idx + 1) % 400];
          var smooth = clip.lp < 1000 ? 0.5 : 1;
          v = (a1 + (a2 - a1) * fr) * smooth;
          if (clip.bursts) v *= 0.4 + 0.9 * Math.abs(Math.sin(u * 13 + noiseSeq[(idx * 7) % 400] * 3));
        }
        return mid - M.clamp(v, -1.1, 1.1) * amp;
      }, 10, W - 10, col, 2.5, 1.5);

      if (sim.p.hints) {
        D.text(ctx, clip.kind === 'music' ? 'Hint: does the same shape repeat?' : 'Hint: can you find any repeating shape?', W / 2, bottom + 20,
          { color: c.muted, size: 12, align: 'center' });
      }
      if (s.answered) {
        D.text(ctx, clip.kind === 'music' ? '🎵 Music — regular, repeating pattern' : '💥 Noise — irregular, no repeating pattern',
          W / 2, top - 14, { color: col, size: 13, weight: 700, align: 'center' });
      }
    },
    animate: function (sim) { return !sim.reduceMotion; }
  });

  function play(sim) {
    var clip = CLIPS[order[sim.state.i % CLIPS.length]];
    if (!A.enabled) { sim.toast('Switch “Sound on” at the top to listen'); return; }
    if (clip.kind === 'music') {
      A.tone(clip.f, { type: clip.type, harmonics: clip.h, duration: 1.4, gain: clip.type === 'sawtooth' ? 0.25 : 0.5, attack: 0.04 });
    } else if (clip.bursts) {
      [0, 180, 330, 560, 700].forEach(function (d) { setTimeout(function () { A.noise(0.15, 0.5, clip.lp); }, d); });
    } else A.noise(1.4, 0.5, clip.lp);
  }
  function answer(sim, kind) {
    var s = sim.state, clip = CLIPS[order[s.i % CLIPS.length]];
    if (s.answered) { next(sim); return; }
    s.answered = true; s.tried++;
    if (kind === clip.kind) { s.score++; s.streak++; s.result = '✅ Correct!'; A.tone(880, { duration: 0.15, gain: 0.3 }); }
    else { s.streak = 0; s.result = '❌ It was ' + clip.kind; A.tone(160, { duration: 0.25, gain: 0.3, type: 'square' }); }
    if (s.tried === CLIPS.length) sim.toast('Round complete: ' + s.score + ' / ' + CLIPS.length + (s.score === CLIPS.length ? ' — perfect! 🎉' : ''));
  }
  function next(sim) {
    var s = sim.state;
    s.i++; s.answered = false;
    if (s.i % CLIPS.length === 0) { shuffle(); s.score = 0; s.tried = 0; }
    play(sim);
  }
})();
