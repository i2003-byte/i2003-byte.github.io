/* =====================================================================
   Algorithms · Guess the Number by Halving — sim.js
   ---------------------------------------------------------------------
   The computer hides a whole number from 1 to N. After every guess it
   says "too high", "too low" or "correct", so the numbers still
   possible always form one range [lo, hi].
     halving     guess the middle of the range: each answer throws away
                 half, so at most ⌈log₂(N + 1)⌉ guesses are needed
                 (N = 1000 → 10, because 2¹⁰ = 1024).
     one by one  guess lo, lo + 1, … : up to N guesses.
     random      guess anywhere in the range: usually somewhere between.
   You can also tap the number line to guess yourself at any time.
   The graph shows how many numbers are still possible after each guess.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var BARS = null;

  function nf(v) { return Math.round(v).toLocaleString('en-IN'); }
  function sup(k) { return String(k).split('').map(function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }).join(''); }
  function maxHalving(N) { return Math.ceil(Math.log2(N + 1)); }

  function guess(sim, g) {
    var st = sim.state; if (st.done) return;
    g = M.clamp(Math.round(g), 1, st.N);
    var ans = g === st.secret ? 0 : g > st.secret ? 1 : -1;
    st.list.push({ g: g, ans: ans, who: st.who });
    if (ans === 0) { st.lo = st.hi = g; st.done = true; }
    else if (ans > 0) st.hi = Math.min(st.hi, g - 1);
    else st.lo = Math.max(st.lo, g + 1);
    if (sim.graph) sim.graph.push(st.list.length, [st.hi - st.lo + 1]);
  }
  function computerGuess(sim) {
    var st = sim.state, s = sim.p.strategy, g;
    if (s === 'halving') g = Math.floor((st.lo + st.hi) / 2);
    else if (s === 'linear') g = st.lo;
    else g = st.lo + Math.floor(st.rng() * (st.hi - st.lo + 1));
    st.who = 'pc'; guess(sim, g);
  }

  SimLab.createSim({
    ariaLabel: 'A number line from 1 to N with a hidden number. Each guess is marked too high or too low and the part of the line still possible shrinks, by half each time when the guess is in the middle',
    playLabel: 'Computer guesses',
    mobileAspect: '3 / 3.4',
    params: [
      { id: 'N', label: 'Hidden number is between 1 and', type: 'select', value: '1000', options: [
        { value: '10', label: '10' }, { value: '100', label: '100' }, { value: '1000', label: '1,000' }, { value: '1000000', label: '10,00,000 (ten lakh)' }] },
      { id: 'strategy', label: 'Computer’s way of guessing', type: 'select', value: 'halving', options: [
        { value: 'halving', label: 'Halving: guess the middle' }, { value: 'linear', label: 'One by one: 1, 2, 3, …' }, { value: 'random', label: 'Random: any number still possible' }] },
      { id: 'speed', label: 'Computer guesses per second', min: 0.5, max: 20, step: 0.5, value: 1.5, unit: '/s' }
    ],
    buttons: [
      { label: 'New hidden number', primary: true, onClick: function (sim) { sim.state.seed = (sim.state.seed * 48271 + 7) % 2147483647 || 3; sim.reset(); } }
    ],
    readouts: [
      { id: 'n', label: 'Guesses so far', short: 'Guesses', key: true },
      { id: 'left', label: 'Numbers still possible', short: 'Possible', key: true },
      { id: 'max', label: 'Halving never needs more than', short: 'Halving max', key: true },
      { id: 'last', label: 'Last answer' }
    ],
    graph: { title: 'Numbers still possible after each guess', xLabel: 'guess number', yLabel: 'numbers left', series: [{ label: 'still possible', color: '--sim-2' }], yMin: 0 },
    onParam: function (sim, id) { return id === 'speed' || id === 'strategy'; },

    reset: function (sim) {
      var N = parseInt(sim.p.N, 10), seed = sim.state && sim.state.seed || 12345, r = M.rng(seed);
      r(); r();
      sim.state = { seed: seed, N: N, secret: 1 + Math.floor(r() * N), lo: 1, hi: N, list: [], done: false, acc: 0.6, rng: M.rng(seed + 1), who: 'pc' };
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [N]); }
    },
    update: function (sim, dt) {
      var st = sim.state; if (st.done) return;
      st.acc += dt * sim.p.speed;
      if (st.acc >= 1) { st.acc -= 1; computerGuess(sim); }
    },
    finished: function (sim) { return sim.state.done; },
    status: function (sim) {
      var st = sim.state;
      if (st.done) return 'Found in ' + st.list.length + ' guesses';
      return sim.running ? 'Computer is guessing' : 'Tap the number line to guess, or press Computer guesses';
    },
    readout: function (sim) {
      var st = sim.state, last = st.list[st.list.length - 1];
      return { n: String(st.list.length), left: nf(st.hi - st.lo + 1), max: maxHalving(st.N) + ' guesses',
        last: last ? nf(last.g) + (last.ans === 0 ? ': correct!' : last.ans > 0 ? ': too high' : ': too low') : '—' };
    },

    pointer: {
      down: function (sim, x, y) {
        var B = BARS, st = sim.state; if (!B || st.done) return false;
        var v = null;
        if (y >= B.zy - 22 && y <= B.zy + 26 && x >= B.x0 - 10 && x <= B.x1 + 10) v = B.za + (M.clamp(x, B.x0, B.x1) - B.x0) / (B.x1 - B.x0) * (B.zb - B.za);
        else if (y >= B.fy - 20 && y <= B.fy + 22 && x >= B.x0 - 10 && x <= B.x1 + 10) v = 1 + (M.clamp(x, B.x0, B.x1) - B.x0) / (B.x1 - B.x0) * (st.N - 1);
        if (v == null) return false;
        if (sim.running) sim.pause();
        st.who = 'you'; guess(sim, v); sim.redraw();
        return false;
      },
      hover: function (sim, x, y) { var B = BARS; return !!B && x >= B.x0 - 10 && x <= B.x1 + 10 && ((y >= B.zy - 22 && y <= B.zy + 26) || (y >= B.fy - 20 && y <= B.fy + 22)); }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, st = sim.state, narrow = W < 560, N = st.N;
      D.clear(ctx, W, H, c.bg);
      var last = st.list[st.list.length - 1], hl, hc = c.s1;
      if (st.done) { hl = '🎉 It was ' + nf(st.secret) + ' · found in ' + st.list.length + (st.list.length === 1 ? ' guess' : ' guesses'); hc = c.success; }
      else if (last) { hl = nf(last.g) + ' is too ' + (last.ans > 0 ? 'high' : 'low') + ' · now it is ' + nf(st.lo) + ' to ' + nf(st.hi); hc = last.ans > 0 ? c.danger : c.warning; }
      else hl = 'I am thinking of a number from 1 to ' + nf(N);
      D.text(ctx, hl, W / 2, 16, { color: c.bg, bg: hc, size: narrow ? 11.5 : 13, weight: 700, align: 'center', pad: 5, fit: W });

      var x0 = narrow ? 18 : 40, x1 = W - (narrow ? 18 : 40), fs = narrow ? 10.5 : 12;
      var fy = 34 + (H - 34) * 0.15, zy = 34 + (H - 34) * 0.42;
      BARS = { x0: x0, x1: x1, fy: fy, zy: zy, za: 0, zb: 0 };
      function fx(v) { return x0 + (v - 1) / Math.max(1, N - 1) * (x1 - x0); }
      // full line
      D.text(ctx, 'Whole line: 1 to ' + nf(N), x0, fy - 16, { color: c.muted, size: fs, weight: 700 });
      D.roundRect(ctx, x0, fy - 5, x1 - x0, 10, 5, D.alpha(c.ink, 0.12));
      var ra = fx(st.lo) - (N > 1 ? 0 : 0), rb = Math.max(fx(st.hi), ra + 3);
      D.roundRect(ctx, ra, fy - 5, Math.max(3, rb - ra), 10, 4, st.done ? c.success : D.alpha(c.s2, 0.85));
      st.list.forEach(function (q, k) {
        var x = fx(q.g), col = q.ans === 0 ? c.success : q.ans > 0 ? c.danger : c.warning;
        D.line(ctx, x, fy - 9, x, fy + 9, col, k === st.list.length - 1 ? 2.5 : 1.5);
      });
      D.text(ctx, '1', x0, fy + 16, { color: c.faint, size: fs - 1, align: 'center' });
      D.text(ctx, nf(N), x1, fy + 16, { color: c.faint, size: fs - 1, align: 'center' });
      // zoomed line: the numbers still possible (with a little margin)
      var span = st.hi - st.lo + 1, mrg = Math.max(1, Math.ceil(span * 0.08));
      var za = Math.max(1, st.lo - mrg), zb = Math.min(N, st.hi + mrg);
      if (zb - za < 6) { za = Math.max(1, Math.min(za, N - 6)); zb = Math.min(N, za + 6); }
      BARS.za = za; BARS.zb = zb;
      function zx(v) { return x0 + (v - za) / Math.max(1, zb - za) * (x1 - x0); }
      D.text(ctx, 'Zoom: ' + nf(za) + ' to ' + nf(zb) + '  ·  tap here to guess', x0, zy - 22, { color: c.muted, size: fs, weight: 700, fit: W });
      // connect the full-line range to the zoom
      ctx.fillStyle = D.alpha(c.s2, 0.08); ctx.beginPath(); ctx.moveTo(fx(za), fy + 6); ctx.lineTo(fx(zb), fy + 6); ctx.lineTo(x1, zy - 12); ctx.lineTo(x0, zy - 12); ctx.closePath(); ctx.fill();
      D.roundRect(ctx, x0, zy - 9, x1 - x0, 18, 6, D.alpha(c.ink, 0.1));
      D.roundRect(ctx, zx(st.lo - 0.5 < za ? za : st.lo - 0.5), zy - 9, Math.max(4, zx(Math.min(zb, st.hi + 0.5)) - zx(Math.max(za, st.lo - 0.5))), 18, 6, st.done ? c.success : D.alpha(c.s2, 0.6));
      var tstep = D.niceStep(zb - za, narrow ? 4 : 7); if (tstep < 1) tstep = 1;
      for (var t = Math.ceil(za / tstep) * tstep; t <= zb; t += tstep) { D.line(ctx, zx(t), zy + 9, zx(t), zy + 14, c.axis, 1); D.text(ctx, nf(t), zx(t), zy + 22, { color: c.muted, size: fs - 1, align: 'center', font: c.mono }); }
      st.list.forEach(function (q, k) {
        if (q.g < za || q.g > zb) return;
        var x = zx(q.g), col = q.ans === 0 ? c.success : q.ans > 0 ? c.danger : c.warning, lastOne = k === st.list.length - 1;
        D.line(ctx, x, zy - 13, x, zy + 13, col, lastOne ? 3 : 2);
        if (lastOne) D.text(ctx, nf(q.g) + (q.ans === 0 ? ' ✓' : q.ans > 0 ? ' too high' : ' too low'), x, zy + 38, { color: '#111827', bg: col, size: fs, weight: 700, align: 'center', pad: 3, fit: W });
      });
      // halving ladder: how the range shrinks if you always guess the middle
      var ly = 34 + (H - 34) * 0.62, ladder = [N];
      while (ladder[ladder.length - 1] > 1) ladder.push(Math.floor(ladder[ladder.length - 1] / 2));
      D.text(ctx, 'Halving from ' + nf(N) + ': at most ' + maxHalving(N) + ' guesses (2' + sup(maxHalving(N)) + ' = ' + nf(Math.pow(2, maxHalving(N))) + ' > ' + nf(N) + ')', x0, ly, { color: c.text, size: fs, weight: 700, fit: W });
      var cw = (x1 - x0) / ladder.length, done = st.list.length;
      ladder.forEach(function (v, k) {
        var x = x0 + k * cw, h = 20, y = ly + 12, on = sim.p.strategy === 'halving' && k === done && !st.done;
        D.roundRect(ctx, x + 1, y, cw - 2, h, 4, k < done ? D.alpha(c.s2, 0.3) : D.alpha(c.ink, 0.07), on ? c.s2 : null, 1.5);
        if (cw > 22) D.text(ctx, v >= 10000 ? Math.round(v / 1000) + 'k' : String(v), x + cw / 2, y + h / 2, { color: c.text, size: Math.min(fs, cw * 0.32), weight: 600, align: 'center', font: c.mono });
      });
      // guess list
      var gy = ly + 48, rows = Math.max(1, Math.floor((H - gy - 4) / 16)), cols = narrow ? 2 : 3, show = st.list.slice(-rows * cols);
      show.forEach(function (q, k) {
        var idx = st.list.length - show.length + k, col = Math.floor(k / rows), row = k % rows;
        var txt = '#' + (idx + 1) + ' ' + (q.who === 'you' ? 'you' : 'pc') + ': ' + nf(q.g) + (q.ans === 0 ? ' ✓' : q.ans > 0 ? ' ↓ too high' : ' ↑ too low');
        D.text(ctx, txt, x0 + col * (x1 - x0) / cols, gy + row * 16 + 6, { color: q.ans === 0 ? c.success : q.ans > 0 ? c.danger : c.warning, size: fs, weight: 600, font: c.mono });
      });
      if (!st.list.length) D.text(ctx, 'Your guesses and the computer’s will be listed here.', x0, gy + 6, { color: c.faint, size: fs, weight: 600 });
    }
  });
})();
