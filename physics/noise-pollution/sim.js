/* =====================================================================
   Sound Lab · Quiet the Neighbourhood — sim.js
   ---------------------------------------------------------------------
   Noise pollution = unwanted, excessive sound that harms health.
   A neighbourhood has three noise sources (a highway, a factory and a
   loudspeaker) and three places that need quiet (a hospital, a school
   and homes). Add measures and watch the noise map change.

   Model (simplified, for learning):
     level at a point = energy-sum of every source, where each source
     loses 20·log10(distance) dB, minus the effect of any measures:
       tree belt        −4 dB per row (between road and buildings)
       vehicle silencers −10 dB on the highway
       no-horn zone     −5 dB on the highway
       soundproof wall  −10 dB for places behind it
       move factory away (to the edge of town)
       loudspeaker volume limit −25 dB
   Goals (typical guideline values): hospital ≤ 50 dB, school ≤ 55 dB,
   homes ≤ 55 dB.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;

  // Positions are in a 100 × 70 "metre" world
  var SOURCES = [
    { id: 'road', name: 'Highway', icon: '🚚', x: 50, y: 6, db: 92, line: true },
    { id: 'factory', name: 'Factory', icon: '🏭', x: 12, y: 40, db: 95 },
    { id: 'speaker', name: 'Loudspeaker', icon: '📢', x: 88, y: 48, db: 96 }
  ];
  var PLACES = [
    { id: 'hospital', name: 'Hospital', icon: '🏥', x: 30, y: 30, goal: 50 },
    { id: 'school', name: 'School', icon: '🏫', x: 58, y: 34, goal: 55 },
    { id: 'homes', name: 'Homes', icon: '🏘️', x: 76, y: 60, goal: 55 }
  ];

  function srcLevel(src, p) {
    var db = src.db;
    if (src.id === 'road') db -= (p.silencers ? 10 : 0) + (p.nohorn ? 5 : 0);
    if (src.id === 'speaker' && p.limit) db -= 25;
    return db;
  }
  function srcPos(src, p) { return src.id === 'factory' && p.moveFactory ? { x: -300, y: 70 } : src; } // moved factory: far outside town

  function levelAt(x, y, p) {
    var e = 0;
    SOURCES.forEach(function (src) {
      var sp = srcPos(src, p);
      var d = src.line ? Math.max(1, y - sp.y) : Math.max(1, Math.hypot(x - sp.x, y - sp.y));
      var L = srcLevel(src, p) - 20 * Math.log10(d);
      if (src.id === 'road') {
        if (y > 14) L -= p.trees * 4;        // tree belts run along the road at y≈10–14
        if (p.wall && y > 18) L -= 10;        // wall at y≈16
      }
      e += Math.pow(10, L / 10);
    });
    return 10 * Math.log10(e + 1e-9);
  }

  SimLab.createSim({
    ariaLabel: 'Map of a neighbourhood coloured by noise level, with sources, a hospital, a school and homes',
    audio: true,
    mobileAspect: '4 / 4',
    transport: false,
    paramsTitle: 'Noise-control measures',
    params: [
      { id: 'trees', label: 'Rows of trees along the road', min: 0, max: 3, step: 1, value: 0, format: function (v) { return v + (v === 1 ? ' row' : ' rows'); } },
      { id: 'silencers', label: '🚚 Silencers on vehicles', type: 'toggle', value: false },
      { id: 'nohorn', label: '🚫 No-horn zone', type: 'toggle', value: false },
      { id: 'wall', label: '🧱 Soundproof wall by the road', type: 'toggle', value: false },
      { id: 'moveFactory', label: '🏭 Move factory out of town', type: 'toggle', value: false },
      { id: 'limit', label: '📢 Limit loudspeaker volume', type: 'toggle', value: false }
    ],
    buttonsTitle: 'Listen',
    buttons: [{ label: '🔊 Hear the street from the school', full: true, onClick: function (sim) {
      if (!A.enabled) { sim.toast('Switch “Sound on” at the top to listen'); return; }
      var db = levelAt(58, 34, sim.p);
      A.noise(1.2, M.clamp((db - 20) / 80, 0.03, 0.8), 900);
      sim.toast('At the school: ' + Math.round(db) + ' dB');
    } }],
    readouts: [
      { id: 'hospital', label: '🏥 Hospital (goal ≤ 50)', unit: 'dB', digits: 0, key: true },
      { id: 'school', label: '🏫 School (goal ≤ 55)', unit: 'dB', digits: 0, key: true },
      { id: 'homes', label: '🏘️ Homes (goal ≤ 55)', unit: 'dB', digits: 0, key: true },
      { id: 'goals', label: 'Goals reached' }
    ],
    onParam: function (sim) {
      var ok = PLACES.every(function (pl) { return levelAt(pl.x, pl.y, sim.p) <= pl.goal; });
      if (ok && !sim.state.won) { sim.state.won = true; sim.toast('🎉 Neighbourhood is quiet! All goals reached.'); A.tone(784, { duration: 0.5, gain: 0.3, harmonics: [1, 0.3] }); }
      if (!ok) sim.state.won = false;
      sim.state.map = null; return true;
    },
    reset: function (sim) { sim.state = { map: null, won: false }; },

    readout: function (sim) {
      var out = {}, n = 0;
      PLACES.forEach(function (pl) { var L = levelAt(pl.x, pl.y, sim.p); out[pl.id] = L; if (L <= pl.goal) n++; });
      out.goals = n + ' / 3' + (n === 3 ? ' 🎉' : '');
      return out;
    },
    status: function (sim) { var r = this.readout(sim); return 'Goals: ' + r.goals; },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p;
      var sx = W / 100, sy = (H - 24) / 70;
      function X(x) { return x * sx; } function Y(y) { return y * sy; }

      // noise heat-map (cached until a measure changes or size changes)
      var key = W + 'x' + H + (c.light ? 'l' : 'd');
      if (!sim.state.map || sim.state.mapKey !== key) {
        var cell = 8, off = document.createElement('canvas');
        off.width = Math.ceil(W / cell); off.height = Math.ceil(H / cell);
        var octx = off.getContext('2d'), img = octx.createImageData(off.width, off.height);
        for (var j = 0; j < off.height; j++) for (var i = 0; i < off.width; i++) {
          var L = levelAt(i * cell / sx, j * cell / sy, p);
          var t = M.clamp((L - 35) / 50, 0, 1);            // 35 dB → green, 85 dB → red
          var r = Math.round(t < 0.5 ? 80 + t * 2 * 175 : 255), g = Math.round(t < 0.5 ? 200 : 200 - (t - 0.5) * 2 * 170), b = 90;
          var k = (j * off.width + i) * 4;
          img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = c.light ? 120 : 95;
        }
        octx.putImageData(img, 0, 0);
        sim.state.map = off; sim.state.mapKey = key;
      }
      D.clear(ctx, W, H, c.bg);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(sim.state.map, 0, 0, sim.state.map.width * 8, sim.state.map.height * 8);

      // road with moving trucks
      ctx.fillStyle = D.alpha(c.ink, 0.25); ctx.fillRect(0, Y(2), W, Y(8));
      var tt = sim.reduceMotion ? 0 : (now || 0) / 1000;
      for (var v = 0; v < 4; v++) D.text(ctx, v % 2 ? '🚗' : '🚚', ((tt * 60 + v * W / 4) % (W + 40)) - 20, Y(6), { size: 18, align: 'center' });
      // trees
      for (var row = 0; row < p.trees; row++) for (var x = 3; x < 100; x += 6) D.text(ctx, '🌳', X(x), Y(11 + row * 2.2), { size: 14, align: 'center' });
      // wall
      if (p.wall) D.roundRect(ctx, 0, Y(16.5), W, 6, 2, c.muted);

      // sources & places
      SOURCES.forEach(function (src) {
        if (src.line) return;
        var sp = srcPos(src, p); if (sp.x < 0) return;
        D.text(ctx, src.icon, X(sp.x), Y(sp.y), { size: 28, align: 'center' });
        if (!sim.reduceMotion) for (var r2 = 0; r2 < 3; r2++) {
          var rr = ((tt * 30 + r2 * 14) % 42);
          ctx.strokeStyle = D.alpha(c.danger, (1 - rr / 42) * (srcLevel(src, p) - 70) / 30);
          ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(sp.x), Y(sp.y), 16 + rr, 0, Math.PI * 2); ctx.stroke();
        }
      });
      PLACES.forEach(function (pl) {
        var L = levelAt(pl.x, pl.y, p), ok = L <= pl.goal;
        D.text(ctx, pl.icon, X(pl.x), Y(pl.y), { size: 30, align: 'center' });
        D.text(ctx, Math.round(L) + ' dB ' + (ok ? '✓' : '✗'), X(pl.x), Y(pl.y) + 26, { color: '#fff', bg: ok ? c.success : c.danger, size: 11, weight: 700, align: 'center', pad: 4 });
      });
      if (p.moveFactory) D.text(ctx, '🏭 → moved away', 8, H - 34, { color: c.muted, size: 11 });

      // legend
      var lw = Math.min(180, W * 0.45), lx = W - lw - 10, ly = H - 16;
      var grad = ctx.createLinearGradient(lx, 0, lx + lw, 0);
      grad.addColorStop(0, 'rgb(80,200,90)'); grad.addColorStop(0.5, 'rgb(255,200,90)'); grad.addColorStop(1, 'rgb(255,30,90)');
      D.roundRect(ctx, lx, ly - 5, lw, 10, 5, grad);
      D.text(ctx, '35 dB', lx - 4, ly, { color: c.muted, size: 10, align: 'right' });
      D.text(ctx, '85+', lx + lw + 4, ly, { color: c.muted, size: 10 });
    },
    animate: function (sim) { return !sim.reduceMotion; }
  });
})();
