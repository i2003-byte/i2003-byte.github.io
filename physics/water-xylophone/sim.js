/* =====================================================================
   Sound Lab · Water Glass Xylophone (Jal Tarang) — sim.js
   ---------------------------------------------------------------------
   Seven glasses with different amounts of water.
   TAP mode (strike with a spoon): the glass wall vibrates; more water
     adds mass and makes it vibrate more slowly → LOWER pitch.
     Model: f = f0 / √(1 + 4·(h/H)³)   (f0 = empty-glass frequency)
   BLOW mode (blow across the top of a bottle): the AIR COLUMN above the
     water vibrates. More water → shorter air column → HIGHER pitch.
     Model: closed pipe, f = v / (4·L_air),  L_air = H − h (+ end correction)
   Drag the water up/down inside a glass, tap it to play.
   "Tune to a scale" solves the model backwards for Sa-Re-Ga-Ma-Pa-Dha-Ni.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var N = 7, H_GLASS = 0.15, V_AIR = 343, F0_TAP = 1050, END = 0.012;
  var SARGAM = ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni'];
  var MAJOR = [0, 2, 4, 5, 7, 9, 11];
  var NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

  function freq(level, mode) { // level 0..1 of glass height
    if (mode === 'blow') return V_AIR / (4 * (H_GLASS * (1 - level) + END));
    return F0_TAP / Math.sqrt(1 + 4 * Math.pow(level, 3));
  }
  function levelFor(f, mode) { // inverse of freq()
    if (mode === 'blow') return M.clamp(1 - (V_AIR / (4 * f) - END) / H_GLASS, 0, 0.95);
    return M.clamp(Math.cbrt(Math.max(0, (Math.pow(F0_TAP / f, 2) - 1) / 4)), 0, 0.95);
  }
  function noteName(f) { var n = Math.round(12 * Math.log2(f / 440)) + 57; return NAMES[((n % 12) + 12) % 12] + Math.floor(n / 12); }

  function geom(sim) {
    var W = sim.width, H = sim.height, gap = W / (N + 0.5);
    var gw = Math.min(gap * 0.7, 80), gh = Math.min(H * 0.55, gw * 2.2);
    return { gap: gap, gw: gw, gh: gh, base: H * 0.78 };
  }

  SimLab.createSim({
    ariaLabel: 'Seven glasses holding different amounts of water, played like a xylophone',
    audio: true,
    transport: false,
    params: [
      { id: 'mode', label: 'How do you play it?', type: 'select', value: 'tap', options: [
        { value: 'tap', label: '🥄 Tap the glass with a spoon' }, { value: 'blow', label: '🌬️ Blow across the top (bottle)' }] },
      { id: 'level', label: 'Water in selected glass', min: 0, max: 95, step: 1, value: 10, unit: '%' }
    ],
    buttonsTitle: 'Play',
    buttons: [
      { label: '🎼 Tune to a scale', primary: true, onClick: function (sim) { tune(sim); } },
      { label: '▶ Play all glasses', onClick: function (sim) { playSeq(sim, [0, 1, 2, 3, 4, 5, 6], 280); } },
      { label: '⭐ Twinkle Twinkle', onClick: function (sim) { playSeq(sim, [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0], 330); } },
      { label: '🔀 Random water', onClick: function (sim) { sim.state.levels = sim.state.levels.map(function () { return Math.round(Math.random() * 90) / 100; }); syncSlider(sim); } }
    ],
    readouts: [
      { id: 'glass', label: 'Selected glass', key: true },
      { id: 'f', label: 'Pitch', unit: 'Hz', digits: 0, key: true },
      { id: 'note', label: 'Nearest note' },
      { id: 'air', label: 'Air column above water', unit: 'cm', digits: 1 }
    ],
    onParam: function (sim, id, v) {
      if (id === 'level') sim.state.levels[sim.state.sel] = v / 100;
      return true;
    },
    reset: function (sim) {
      sim.state = { sel: 0, levels: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7], ring: [0, 0, 0, 0, 0, 0, 0] };
      sim.state.levels[0] = sim.p.level / 100;
    },

    readout: function (sim) {
      var s = sim.state, lv = s.levels[s.sel], f = freq(lv, sim.p.mode);
      return { glass: '#' + (s.sel + 1) + ' (' + SARGAM[s.sel] + ')', f: f, note: noteName(f), air: (1 - lv) * H_GLASS * 100 };
    },
    status: function (sim) { return sim.p.mode === 'tap' ? 'Tap: more water → lower pitch' : 'Blow: more water → higher pitch'; },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, G = geom(sim);
      D.clear(ctx, W, H, c.bg);
      ctx.fillStyle = D.alpha(c.s3, 0.18); ctx.fillRect(0, G.base, W, H - G.base);  // table
      var water = c.light ? 'rgba(14,165,233,0.55)' : 'rgba(56,189,248,0.5)';
      s.levels.forEach(function (lv, i) {
        var cx = G.gap * (i + 0.75), x = cx - G.gw / 2, top = G.base - G.gh;
        var wob = s.ring[i] > 0 ? Math.sin((now || 0) / 18) * s.ring[i] * 3 : 0;
        s.ring[i] = Math.max(0, s.ring[i] - 0.02);
        // water
        var wh = lv * G.gh;
        ctx.fillStyle = water;
        ctx.fillRect(x + 3 + wob, G.base - wh, G.gw - 6, wh);
        ctx.fillStyle = D.alpha('#ffffff', 0.35); ctx.fillRect(x + 3 + wob, G.base - wh, G.gw - 6, 3);
        // glass
        ctx.strokeStyle = i === s.sel ? c.accent : D.alpha(c.ink, 0.55); ctx.lineWidth = i === s.sel ? 3 : 2;
        ctx.beginPath(); ctx.moveTo(x + wob, top); ctx.lineTo(x + 2 + wob, G.base); ctx.lineTo(x + G.gw - 2 + wob, G.base); ctx.lineTo(x + G.gw + wob, top); ctx.stroke();
        // ring waves
        if (s.ring[i] > 0) {
          ctx.strokeStyle = D.alpha(c.accent, s.ring[i]); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, top, (1 - s.ring[i]) * 50 + 10, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        }
        var f = freq(lv, sim.p.mode);
        D.text(ctx, SARGAM[i], cx, top - 14, { color: i === s.sel ? c.accent : c.muted, size: 12, weight: 700, align: 'center' });
        D.text(ctx, Math.round(f) + '', cx, G.base + 16, { color: c.muted, size: 11, align: 'center', font: c.mono });
      });
      D.text(ctx, 'Hz', 8, G.base + 16, { color: c.faint, size: 10 });
      D.text(ctx, 'Tap a glass to play · drag inside it to change the water', W / 2, H - 12, { color: c.faint, size: 11, align: 'center' });
    },
    animate: function (sim) { return sim.state.ring.some(function (r) { return r > 0; }); },

    pointer: {
      hover: function (sim, x, y) { return glassAt(sim, x, y) >= 0; },
      down: function (sim, x, y) {
        var i = glassAt(sim, x, y); if (i < 0) return false;
        sim.state.sel = i; sim.state.dragY = y; sim.state.moved = false;
        syncSlider(sim);
        strike(sim, i);
        return true;
      },
      move: function (sim, x, y) {
        var s = sim.state, G = geom(sim);
        if (Math.abs(y - s.dragY) < 6 && !s.moved) return;
        s.moved = true;
        s.levels[s.sel] = M.clamp((G.base - y) / G.gh, 0, 0.95);
        syncSlider(sim);
      },
      up: function (sim) { if (sim.state.moved) strike(sim, sim.state.sel); }
    }
  });

  function glassAt(sim, x, y) {
    var G = geom(sim);
    for (var i = 0; i < N; i++) {
      var cx = G.gap * (i + 0.75);
      if (Math.abs(x - cx) < G.gw / 2 + 6 && y > G.base - G.gh - 20 && y < G.base + 10) return i;
    }
    return -1;
  }
  function syncSlider(sim) { sim.setParam('level', Math.round(sim.state.levels[sim.state.sel] * 100)); sim.redraw(); }
  function strike(sim, i) {
    var f = freq(sim.state.levels[i], sim.p.mode);
    sim.state.ring[i] = 1; sim.redraw();
    if (sim.p.mode === 'tap') A.tone(f, { duration: 1.4, gain: 0.5, harmonics: [1, 0.25, 0.1], partials: [1, 2.3, 3.9] });
    else { A.tone(f, { duration: 0.9, gain: 0.45, attack: 0.08, type: 'sine' }); A.noise(0.5, 0.08, f * 2); }
  }
  function playSeq(sim, seq, ms) {
    if (!A.enabled) sim.toast('Tip: switch “Sound on” at the top to hear it');
    seq.forEach(function (g, k) {
      if (g < 0) return;
      setTimeout(function () { sim.state.sel = g; syncSlider(sim); strike(sim, g); }, k * ms);
    });
  }
  function tune(sim) {
    // Major scale (Sa Re Ga Ma Pa Dha Ni) from a starting note the glasses can reach:
    // tapping reaches ≈ 500–1050 Hz, blowing ≈ 530–4400 Hz.
    var sa = sim.p.mode === 'tap' ? 523.25 : 700;
    sim.state.levels = MAJOR.map(function (st) {
      return Math.round(levelFor(sa * Math.pow(2, st / 12), sim.p.mode) * 100) / 100;
    });
    syncSlider(sim);
    playSeq(sim, [0, 1, 2, 3, 4, 5, 6], 280);
  }
})();
