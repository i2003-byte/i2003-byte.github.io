/* =====================================================================
   Probability · Coins and Dice: Experimental Probability — sim.js
   ---------------------------------------------------------------------
   Toss coins or throw dice again and again (fair, using Math.random).
     experimental probability of an event E
         = number of trials in which E happened ÷ total number of trials
     theoretical probability (equally likely outcomes)
         = number of outcomes in E ÷ number of possible outcomes
   As the number of trials grows, the experimental value settles closer
   and closer to the theoretical one (law of large numbers), but for
   small numbers of trials it can be far off.
   Experiments and the event followed on the graph:
     one coin    — Head                     1/2
     one die     — a 6                      1/6
     two coins   — exactly one Head         2/4 = 1/2   (HT, TH)
     two dice    — the sum is 7             6/36 = 1/6
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  var EXP = {
    coin: { name: 'Toss one coin', event: 'Head', outs: ['Head', 'Tail'], theo: [1, 1], total: 2, ev: function (r) { return r[0] === 0; },
      roll: function () { return [Math.random() < 0.5 ? 0 : 1]; }, key: function (r) { return r[0]; } },
    die: { name: 'Throw one die', event: 'a 6', outs: ['1', '2', '3', '4', '5', '6'], theo: [1, 1, 1, 1, 1, 1], total: 6, ev: function (r) { return r[0] === 6; },
      roll: function () { return [1 + Math.floor(Math.random() * 6)]; }, key: function (r) { return r[0] - 1; } },
    coins2: { name: 'Toss two coins', event: 'exactly one Head', outs: ['0 Heads', '1 Head', '2 Heads'], theo: [1, 2, 1], total: 4, ev: function (r) { return r[0] + r[1] === 1; },
      roll: function () { return [Math.random() < 0.5 ? 1 : 0, Math.random() < 0.5 ? 1 : 0]; }, key: function (r) { return r[0] + r[1]; } },
    dice2: { name: 'Throw two dice', event: 'a sum of 7', outs: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], theo: [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1], total: 36,
      ev: function (r) { return r[0] + r[1] === 7; },
      roll: function () { return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]; }, key: function (r) { return r[0] + r[1] - 2; } }
  };
  var EV_N = { coin: 1, die: 1, coins2: 2, dice2: 6 };
  var st = { n: 0, hits: 0, counts: [], last: null, t0: 0, acc: 0 };
  var xMax = 20;

  function ex(p) { return EXP[p.exp] || EXP.coin; }
  function pTheo(p) { return EV_N[p.exp] / ex(p).total; }
  function clear(sim) {
    var e = ex(sim.p);
    st.n = 0; st.hits = 0; st.last = null; st.acc = 0; st.counts = e.outs.map(function () { return 0; }); xMax = 20;
    if (sim.graph) sim.graph.clear();
  }
  function trial(sim, anim) {
    var e = ex(sim.p), r = e.roll();
    st.n++; st.counts[e.key(r)]++; if (e.ev(r)) st.hits++;
    st.last = r; if (anim) st.t0 = performance.now();
    var step = st.n <= 100 ? 1 : Math.pow(10, Math.floor(Math.log10(st.n)) - 1);
    if (sim.graph && st.n % step === 0) {
      while (st.n > xMax) xMax = xMax < 100 ? xMax * 5 : xMax * 10;
      sim.graph.push(st.n, [st.hits / st.n, pTheo(sim.p)]);
    }
  }
  function many(sim, k) { for (var i = 0; i < k; i++) trial(sim, i === k - 1); }
  function frac(a, b) { function g(x, y) { return y ? g(y, x % y) : x; } var d = g(a, b); return (a / d) + '/' + (b / d); }

  function drawCoin(ctx, c, x, y, r, side, spin) {
    var sx = Math.abs(Math.cos(spin * Math.PI * 6)) || 0.05;
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.08, sx), 1);
    D.circle(ctx, 0, 0, r, side === 0 ? '#f5c542' : '#c9a227', '#8a6d12', 3);
    D.circle(ctx, 0, 0, r * 0.78, null, 'rgba(120,90,10,0.6)', 1.5);
    ctx.restore();
    if (sx > 0.35) D.text(ctx, side === 0 ? 'H' : 'T', x, y + 1, { color: '#5a4508', size: r * 0.9, weight: 800, align: 'center' });
  }
  function drawDie(ctx, x, y, s, v, wob) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(wob);
    D.roundRect(ctx, -s / 2, -s / 2, s, s, s * 0.16, '#f8fafc', '#475569', 2.5);
    var pip = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
      5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v];
    pip.forEach(function (q) { D.circle(ctx, q[0] * s * 0.27, q[1] * s * 0.27, s * 0.085, v === 1 ? '#dc2626' : '#0f172a'); });
    ctx.restore();
  }

  SimLab.createSim({
    ariaLabel: 'Coins or dice are tossed again and again; bars show how often each outcome came up next to the theoretical probability, and a graph shows the experimental probability settling towards the theoretical value',
    playLabel: 'Keep tossing',
    mobileAspect: '3 / 3.2',
    params: [
      { id: 'exp', label: 'Experiment', type: 'select', value: 'coin', options: [
        { value: 'coin', label: 'Toss one coin (event: Head)' },
        { value: 'die', label: 'Throw one die (event: a 6)' },
        { value: 'coins2', label: 'Toss two coins (event: exactly one Head)' },
        { value: 'dice2', label: 'Throw two dice (event: sum is 7)' }] },
      { id: 'rate', label: 'Tosses per second (Keep tossing)', min: 1, max: 200, step: 1, value: 5, unit: '/s', presets: [1, 10, 100] },
      { id: 'theory', label: 'Show the theoretical values', type: 'toggle', value: true }
    ],
    buttons: [
      { label: 'Toss once', primary: true, onClick: function (sim) { trial(sim, true); } },
      { label: 'Toss 10 times', onClick: function (sim) { many(sim, 10); } },
      { label: 'Toss 100 times', onClick: function (sim) { many(sim, 100); } },
      { label: 'Toss 1000 times', onClick: function (sim) { many(sim, 1000); } }
    ],
    readouts: [
      { id: 'n', label: 'Number of tosses', short: 'Tosses', digits: 0, key: true },
      { id: 'hits', label: 'Times the event happened', short: 'Event', digits: 0 },
      { id: 'pe', label: 'Experimental probability', short: 'Experimental P', digits: 3, key: true },
      { id: 'pt', label: 'Theoretical probability', short: 'Theoretical P', key: true },
      { id: 'gap', label: 'Difference', digits: 3 }
    ],
    graph: { title: 'Experimental probability of the event as the tosses add up', xLabel: 'number of tosses', yLabel: 'probability',
      series: [{ label: 'Experimental' }, { label: 'Theoretical' }], window: null, yMin: 0, yMax: 1, xMax: function () { return xMax; } },
    reset: function (sim) { clear(sim); },
    onParam: function (sim, id) { if (id === 'exp') clear(sim); return true; },
    update: function (sim, dt) {
      st.acc += sim.p.rate * dt;
      while (st.acc >= 1) { st.acc -= 1; trial(sim, sim.p.rate <= 4); }
    },
    animate: function () { return st.last && performance.now() - st.t0 < 500; },
    readout: function (sim) {
      var e = ex(sim.p), pt = pTheo(sim.p), pe = st.n ? st.hits / st.n : null;
      return { n: st.n, hits: st.hits, pe: pe, pt: frac(EV_N[sim.p.exp], e.total) + ' = ' + pt.toFixed(3), gap: pe == null ? null : Math.abs(pe - pt) };
    },
    status: function (sim) { return st.n ? st.hits + ' of ' + st.n + ' gave ' + ex(sim.p).event : 'Toss to start'; },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, e = ex(p), W = sim.width, H = sim.height, narrow = W < 560;
      var fs = narrow ? 10 : 12, side = W > H * 1.25;
      D.clear(ctx, W, H, c.bg);

      // where things go
      var topH = narrow ? 30 : 38, show = side ? { x: 0, y: topH, w: W * 0.34, h: H - topH } : { x: 0, y: topH, w: W, h: Math.min(H * 0.32, 130) };
      var ch = side ? { x: W * 0.34 + 30, y: topH + 16, w: W * 0.66 - 50, h: H - topH - 60 } : { x: 34, y: show.y + show.h + 14, w: W - 48, h: H - show.y - show.h - 56 };

      // last outcome
      var age = st.last ? M.clamp((performance.now() - st.t0) / 500, 0, 1) : 1, spin = 1 - age;
      var cx = show.x + show.w / 2, cy = show.y + show.h / 2 - 6, sz = Math.min(show.h * 0.62, show.w * 0.3, 90);
      if (!st.last) {
        D.text(ctx, 'Tap “Toss once” or press “Keep tossing”', cx, cy, { color: c.muted, size: fs + 1, align: 'center', fit: W });
      } else {
        var r = st.last;
        if (p.exp === 'coin') drawCoin(ctx, c, cx, cy, sz * 0.55, r[0], spin);
        else if (p.exp === 'coins2') { drawCoin(ctx, c, cx - sz * 0.62, cy, sz * 0.48, r[0] ? 0 : 1, spin); drawCoin(ctx, c, cx + sz * 0.62, cy, sz * 0.48, r[1] ? 0 : 1, spin * 0.8); }
        else if (p.exp === 'die') drawDie(ctx, cx, cy - spin * 30, sz, spin > 0.05 ? 1 + Math.floor(Math.random() * 6) : r[0], spin * 3);
        else { drawDie(ctx, cx - sz * 0.6, cy - spin * 30, sz * 0.9, spin > 0.05 ? 1 + Math.floor(Math.random() * 6) : r[0], spin * 3); drawDie(ctx, cx + sz * 0.6, cy - spin * 24, sz * 0.9, spin > 0.05 ? 1 + Math.floor(Math.random() * 6) : r[1], -spin * 2.5); }
        var hit = e.ev(r), lbl = p.exp === 'coin' ? (r[0] === 0 ? 'Head' : 'Tail') : p.exp === 'die' ? 'You got ' + r[0] : p.exp === 'coins2' ? (r[0] + r[1]) + ' Head' + (r[0] + r[1] === 1 ? '' : 's') : r[0] + ' + ' + r[1] + ' = ' + (r[0] + r[1]);
        if (spin < 0.05) D.text(ctx, lbl + (hit ? '  ✓ ' + e.event : ''), cx, show.y + show.h - 8, { color: hit ? c.success : c.ink, size: fs + 1, weight: 700, align: 'center', fit: W });
      }

      // bar chart: share of each outcome, with theory marks
      var k = e.outs.length, bw = ch.w / k, ymax = 0;
      e.theo.forEach(function (t) { ymax = Math.max(ymax, t / e.total); });
      st.counts.forEach(function (n) { if (st.n) ymax = Math.max(ymax, n / st.n); });
      ymax = Math.min(1, Math.ceil(ymax * 1.15 * 10) / 10 || 0.1);
      var Y = function (v) { return ch.y + ch.h - v / ymax * ch.h; };
      for (var g = 0; g <= ymax + 1e-9; g += ymax > 0.5 ? 0.2 : 0.1) {
        D.line(ctx, ch.x, Y(g), ch.x + ch.w, Y(g), c.grid, 1);
        D.text(ctx, g.toFixed(1), ch.x - 5, Y(g), { color: c.muted, size: fs - 1, align: 'right' });
      }
      var evKey = { coin: [0], die: [5], coins2: [1], dice2: [5] }[p.exp];
      e.outs.forEach(function (o, i) {
        var x = ch.x + i * bw, share = st.n ? st.counts[i] / st.n : 0, isEv = evKey.indexOf(i) >= 0;
        ctx.fillStyle = D.alpha(isEv ? c.s2 : c.s1, 0.6);
        ctx.fillRect(x + bw * 0.15, Y(share), bw * 0.7, ch.y + ch.h - Y(share));
        if (p.theory) D.line(ctx, x + bw * 0.06, Y(e.theo[i] / e.total), x + bw * 0.94, Y(e.theo[i] / e.total), c.warning, 2.5, [5, 3]);
        D.text(ctx, o, x + bw / 2, ch.y + ch.h + 11, { color: isEv ? c.s2 : c.muted, size: k > 6 && narrow ? fs - 1 : fs, weight: isEv ? 700 : 500, align: 'center' });
        if (st.n && bw > 34) D.text(ctx, String(st.counts[i]), x + bw / 2, Y(share) - 8, { color: c.ink, size: fs - 1, align: 'center' });
      });
      D.line(ctx, ch.x, ch.y + ch.h, ch.x + ch.w, ch.y + ch.h, c.axis, 1.5);
      D.text(ctx, 'share of tosses' + (p.theory ? '  ·  - - - theory' : ''), ch.x + ch.w, ch.y - 8, { color: c.muted, size: fs - 1, align: 'right', fit: W });

      // headline
      var pe = st.n ? (st.hits / st.n) : 0;
      var hl = st.n ? 'P(' + e.event + ') ≈ ' + st.hits + ' ÷ ' + st.n + ' = ' + pe.toFixed(3) + (p.theory ? '   theory ' + frac(EV_N[p.exp], e.total) : '')
        : e.name + ': event “' + e.event + '”';
      var hs = narrow ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, narrow ? 14 : 18, { color: c.bg, bg: c.success, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
