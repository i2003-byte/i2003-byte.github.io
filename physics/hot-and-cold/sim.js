/* =====================================================================
   Heat · Hot and Cold — sim.js
   ---------------------------------------------------------------------
   Temperature tells us how hot or cold something is. A beaker of water
   shows its particles: the hotter the water, the faster they move.
     • Particle speed ∝ √(absolute temperature)  (T in kelvin = °C + 273)
     • Below 0 °C the water is ice: particles only jiggle in place.
     • °F = °C × 9/5 + 32
   The "hand" option recreates the three-bowl experiment: after holding
   ice water, lukewarm water feels warm; after hot water it feels cold.
   Our sense of touch compares with our hand, so it can't be trusted.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var N = 42;
  var HANDS = { normal: 33, cold: 10, hot: 45 };

  function tempColor(t) { // blue (cold) → red (hot), for water/particles only
    var k = M.clamp((t + 10) / 110, 0, 1);
    var r = Math.round(M.lerp(59, 239, k)), g = Math.round(M.lerp(130, 68, k)), b = Math.round(M.lerp(246, 68, k));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function feels(t, hand) {
    if (t >= 60) return 'Too hot — ouch! 🔥';
    if (t <= 0) return 'Freezing! 🥶';
    var d = t - hand;
    if (d > 8) return 'Hot';
    if (d > 2) return 'Warm';
    if (d >= -2) return 'Neither hot nor cold';
    if (d > -12) return 'Cool';
    return 'Cold';
  }
  function speed(t) { return Math.sqrt((t + 273) / 298); }

  SimLab.createSim({
    ariaLabel: 'A beaker of water with moving particles, a thermometer and a hand that feels how hot the water is',
    transport: false,
    mobileAspect: '4 / 4.4',
    params: [
      { id: 'temp', label: 'Water temperature', min: -10, max: 100, step: 1, value: 25, unit: '°C',
        presets: [{ label: 'Ice 0 °C', value: 0 }, { label: 'Room 25 °C', value: 25 }, { label: 'Body 37 °C', value: 37 },
          { label: 'Hot tea 70 °C', value: 70 }, { label: 'Boiling 100 °C', value: 100 }] },
      { id: 'hand', label: 'Before touching, your hand was in…', type: 'select', value: 'normal', options: [
        { value: 'normal', label: '✋ Nothing (normal hand, 33 °C)' },
        { value: 'cold', label: '🧊 Ice-cold water (hand at 10 °C)' },
        { value: 'hot', label: '♨️ Hot water (hand at 45 °C)' }] }
    ],
    buttonsTitle: 'Three-bowl experiment',
    buttons: [
      { label: '🧊 Cold hand → lukewarm', onClick: function (sim) { sim.setParam('hand', 'cold'); sim.setParam('temp', 30); } },
      { label: '♨️ Hot hand → lukewarm', onClick: function (sim) { sim.setParam('hand', 'hot'); sim.setParam('temp', 30); } }
    ],
    readouts: [
      { id: 'c', label: 'Temperature', unit: '°C', digits: 0, key: true },
      { id: 'f', label: 'In Fahrenheit', unit: '°F', digits: 0 },
      { id: 'feel', label: 'Your hand feels…', key: true },
      { id: 'v', label: 'Particle speed (vs room)', unit: '×', digits: 2 }
    ],
    onParam: function () { return true; },
    reset: function (sim) {
      var r = M.rng(7), ps = [];
      for (var i = 0; i < N; i++) {
        var a = r() * Math.PI * 2;
        ps.push({ x: r(), y: r(), vx: Math.cos(a), vy: Math.sin(a), gx: (i % 7 + 0.5) / 7, gy: (Math.floor(i / 7) + 0.5) / 6 });
      }
      sim.state = { ps: ps, last: 0, bubbles: [] };
    },
    animate: function (sim) { return !sim.reduceMotion; },
    readout: function (sim) {
      var t = sim.p.temp;
      return { c: t, f: t * 9 / 5 + 32, feel: feels(t, HANDS[sim.p.hand]), v: speed(t) };
    },
    status: function (sim) { return sim.p.temp <= 0 ? 'Solid ice' : sim.p.temp >= 100 ? 'Boiling water' : 'Liquid water'; },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, t = sim.p.temp;
      var dt = s.last && now ? Math.min(0.05, (now - s.last) / 1000) : 0; s.last = now || 0;
      if (sim.reduceMotion) dt = 0;
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 520;

      // beaker
      var bw = Math.min(W * (narrow ? 0.6 : 0.42), 300), bh = Math.min(H * (narrow ? 0.55 : 0.62), bw * 1.1);
      var bx = narrow ? 20 : W * 0.08, by = narrow ? 44 : H * 0.14;
      var wTop = by + bh * 0.12;
      ctx.fillStyle = D.alpha(tempColor(t), t <= 0 ? 0.45 : 0.25);
      ctx.fillRect(bx, wTop, bw, by + bh - wTop);
      ctx.strokeStyle = c.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by); ctx.stroke();

      // particles
      var v = speed(t) * 0.35, pr = Math.max(3, bw / 45), col = tempColor(t);
      s.ps.forEach(function (p, i) {
        var px, py;
        if (t <= 0) { // ice: fixed lattice, jiggle only
          var j = 0.006 * speed(t) * (sim.reduceMotion ? 0 : 1);
          px = p.gx + Math.sin(now / 90 + i) * j; py = p.gy + Math.cos(now / 110 + i * 1.7) * j;
        } else {
          p.x += p.vx * v * dt; p.y += p.vy * v * dt;
          if (p.x < 0.02) { p.x = 0.02; p.vx = Math.abs(p.vx); } if (p.x > 0.98) { p.x = 0.98; p.vx = -Math.abs(p.vx); }
          if (p.y < 0.02) { p.y = 0.02; p.vy = Math.abs(p.vy); } if (p.y > 0.98) { p.y = 0.98; p.vy = -Math.abs(p.vy); }
          px = p.x; py = p.y;
        }
        var cx = bx + 6 + px * (bw - 12), cy = wTop + 6 + py * (by + bh - wTop - 12);
        D.circle(ctx, cx, cy, pr, col);
        if (t > 0 && !sim.reduceMotion) D.line(ctx, cx, cy, cx - p.vx * v * 40, cy - p.vy * v * 40, D.alpha(col, 0.35), pr * 0.8);
      });
      // bubbles when boiling
      if (t >= 100 && !sim.reduceMotion) {
        if (Math.random() < 0.3) s.bubbles.push({ x: Math.random(), y: 1 });
        s.bubbles = s.bubbles.filter(function (b) { b.y -= dt * 0.8; return b.y > 0; });
        s.bubbles.forEach(function (b) { D.circle(ctx, bx + 8 + b.x * (bw - 16), wTop + b.y * (by + bh - wTop), 4, null, c.ink, 1.5); });
      }
      D.text(ctx, t <= 0 ? 'Ice: particles only jiggle' : 'Water particles', bx + bw / 2, by + bh + 16, { color: c.muted, size: narrow ? 11 : 13, align: 'center' });

      // thermometer
      var tx = bx + bw + (narrow ? 26 : 50), tTop = by, tBot = by + bh - 10, tw = 12;
      D.roundRect(ctx, tx - tw / 2, tTop, tw, tBot - tTop, tw / 2, c.surface2, c.border, 1.5);
      D.circle(ctx, tx, tBot + 6, 13, c.danger);
      function TY(v) { return tBot - (v + 10) / 110 * (tBot - tTop - 10); }
      ctx.fillStyle = c.danger; ctx.fillRect(tx - 3, TY(t), 6, tBot - TY(t) + 2);
      for (var k = -10; k <= 100; k += 10) {
        D.line(ctx, tx + tw / 2, TY(k), tx + tw / 2 + (k % 50 === 0 ? 10 : 6), TY(k), c.axis, 1);
        if (k % 20 === 0 || k === -10) D.text(ctx, k + '°', tx + tw / 2 + 12, TY(k), { color: c.muted, size: 10 });
      }

      // hand + feeling (beside the beaker on desktop, underneath on phones)
      var hand = HANDS[sim.p.hand], f = feels(t, hand).replace(/ [^\w\s—!]+$/, '');
      var handIcon = sim.p.hand === 'cold' ? '🧊✋' : sim.p.hand === 'hot' ? '♨️✋' : '✋';
      if (narrow) {
        var ry = H - 34;
        D.text(ctx, handIcon, 14, ry, { size: 26 });
        D.text(ctx, 'feels ' + f, 76, ry - 8, { color: c.ink, size: 14, weight: 700, fit: W });
        D.text(ctx, '(hand was ' + hand + ' °C)', 76, ry + 11, { color: c.faint, size: 11 });
      } else {
        var hx = W * 0.8, hy = by + bh * 0.35;
        D.text(ctx, handIcon, hx, hy, { size: 44, align: 'center' });
        D.text(ctx, 'feels', hx, hy + 44, { color: c.muted, size: 12, align: 'center' });
        D.text(ctx, f, hx, hy + 68, { color: c.ink, size: 16, weight: 700, align: 'center', fit: W });
        D.text(ctx, 'hand was ' + hand + ' °C', hx, hy + 92, { color: c.faint, size: 11, align: 'center' });
      }

      // big number
      D.text(ctx, t + ' °C', W / 2, 20, { color: c.bg, bg: tempColor(t), size: narrow ? 14 : 16, weight: 700, align: 'center', pad: 6 });
    }
  });
})();
