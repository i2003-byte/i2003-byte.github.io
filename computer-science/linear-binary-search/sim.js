/* =====================================================================
   Algorithms · Linear vs Binary Search — sim.js
   ---------------------------------------------------------------------
   A class register of n roll numbers, sorted from smallest to largest
   (or shuffled). Two searches look for the same roll number, one
   comparison per step:
     linear search  check 1st, 2nd, 3rd … until it is found or the
                    register ends. Worst case n checks.
     binary search  check the middle of the part still possible; if the
                    middle number is too small, throw away it and the
                    half before it, if too big the half after it.
                    Worst case ⌊log₂ n⌋ + 1 checks. Needs a sorted list:
                    on a shuffled register it can miss the number.
   Tap a student to search for that roll number.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  function makeRolls(n, seed) {
    var r = M.rng(seed), a = [], v = 1000;
    for (var i = 0; i < n; i++) { v += 1 + Math.floor(r() * 3); a.push(v); }
    return a;
  }
  function shuffle(a, seed) {
    var r = M.rng(seed * 7 + 3), b = a.slice();
    for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = b[i]; b[i] = b[j]; b[j] = x; }
    return b;
  }
  function worstBin(n) { return Math.floor(Math.log2(n)) + 1; }

  function newLanes(st) {
    st.lin = { i: 0, steps: 0, cur: -1, done: false, found: -1, seen: [] };
    st.bin = { lo: 0, hi: st.list.length - 1, steps: 0, cur: -1, done: false, found: -1, seen: [], msg: '' };
    st.acc = 0;
  }
  function stepLin(st) {
    var L = st.lin; if (L.done) return;
    L.cur = L.i; L.steps++; L.seen.push(L.i);
    if (st.list[L.i] === st.target) { L.found = L.i; L.done = true; }
    else if (++L.i >= st.list.length) { L.done = true; L.cur = -1; }
  }
  function stepBin(st) {
    var B = st.bin; if (B.done) return;
    if (B.lo > B.hi) { B.done = true; B.cur = -1; return; }
    var mid = (B.lo + B.hi) >> 1, v = st.list[mid];
    B.cur = mid; B.steps++; B.seen.push(mid);
    if (v === st.target) { B.found = mid; B.done = true; B.msg = v + ' = ' + st.target + ': found!'; }
    else if (v < st.target) { B.msg = v + ' is too small → drop it and everything before it'; B.lo = mid + 1; }
    else { B.msg = v + ' is too big → drop it and everything after it'; B.hi = mid - 1; }
    if (!B.done && B.lo > B.hi) { B.done = true; B.msg += ' · nothing left'; }
  }
  function pickTarget(sim, missing) {
    var st = sim.state, r = M.rng(st.seed * 31 + st.picks++), rolls = st.rolls;
    if (!missing) { st.target = rolls[Math.floor(r() * rolls.length)]; st.missing = false; return; }
    for (var k = 0; k < 50; k++) { var i = Math.floor(r() * (rolls.length - 1)); if (rolls[i + 1] - rolls[i] > 1) { st.target = rolls[i] + 1; st.missing = true; return; } }
    st.target = rolls[rolls.length - 1] + 2; st.missing = true;
  }
  // grid layout for n cells in a w × h box
  function grid(n, w, h) {
    var best = { size: 0 };
    for (var cols = 1; cols <= n; cols++) { var rows = Math.ceil(n / cols), s = Math.min(w / cols, h / rows); if (s > best.size) best = { size: s, cols: cols, rows: rows }; }
    return best;
  }
  var LAYOUT = null;

  SimLab.createSim({
    ariaLabel: 'Two copies of a class register of roll numbers. Linear search checks the students one by one from the start, binary search checks the middle and throws away half each time; steps are counted for each',
    playLabel: 'Start searching',
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'n', label: 'Students in the register (n)', type: 'select', value: '40', options: [
        { value: '16', label: '16 students' }, { value: '40', label: '40 students' }, { value: '100', label: '100 students' }, { value: '500', label: '500 students' }] },
      { id: 'order', label: 'Register order', type: 'select', value: 'sorted', options: [
        { value: 'sorted', label: 'Sorted by roll number' }, { value: 'shuffled', label: 'Shuffled (not sorted)' }] },
      { id: 'speed', label: 'Search speed', min: 0.5, max: 20, step: 0.5, value: 1.5, unit: 'checks/s',
        presets: [{ label: 'Slow', value: 1 }, { label: 'Medium', value: 3 }, { label: 'Fast', value: 15 }] }
    ],
    buttons: [
      { label: 'Find another roll number', primary: true, onClick: function (sim) { pickTarget(sim, false); newLanes(sim.state); if (sim.graph) sim.graph.clear(); } },
      { label: 'Find one that is not there', onClick: function (sim) { pickTarget(sim, true); newLanes(sim.state); if (sim.graph) sim.graph.clear(); } }
    ],
    readouts: [
      { id: 'target', label: 'Looking for roll no.', short: 'Find', key: true },
      { id: 'lin', label: 'Linear search: checks', short: 'Linear', key: true },
      { id: 'bin', label: 'Binary search: checks', short: 'Binary', key: true },
      { id: 'wl', label: 'Linear worst case (n)' },
      { id: 'wb', label: 'Binary worst case (⌊log₂ n⌋ + 1)' }
    ],
    graph: { title: 'Checks made so far', yLabel: 'checks', series: [{ label: 'Linear', color: '--sim-1' }, { label: 'Binary', color: '--sim-2' }] },
    onParam: function (sim, id) { return id === 'speed'; },

    reset: function (sim) {
      var n = parseInt(sim.p.n, 10), old = sim.state || {};
      var st = { seed: 5, picks: 1, n: n };
      st.rolls = makeRolls(n, st.seed);
      st.list = sim.p.order === 'shuffled' ? shuffle(st.rolls, st.seed) : st.rolls.slice();
      sim.state = st;
      if (old.n === n && old.target != null) { st.target = old.target; st.missing = old.missing; st.picks = old.picks; }
      else { st.target = st.rolls[Math.floor(n * 0.62)]; st.missing = false; }
      newLanes(st);
    },
    update: function (sim, dt) {
      var st = sim.state; st.acc += dt * sim.p.speed;
      while (st.acc >= 1) { st.acc -= 1; stepLin(st); stepBin(st); if (st.lin.done && st.bin.done) break; }
    },
    finished: function (sim) { return sim.state.lin.done && sim.state.bin.done; },
    sample: function (sim) { return [sim.state.lin.steps, sim.state.bin.steps]; },
    status: function (sim) {
      var st = sim.state;
      if (st.lin.done && st.bin.done) return 'Both searches finished';
      return (sim.running ? 'Searching' : st.lin.steps ? 'Paused' : 'Ready') + ' · tap a student to search for them';
    },
    readout: function (sim) {
      var st = sim.state, n = st.list.length;
      function res(L) { return L.steps + (L.done ? (L.found >= 0 ? ' ✓' : ' ✗') : ''); }
      return { target: String(st.target), lin: res(st.lin), bin: res(st.bin), wl: String(n), wb: String(worstBin(n)) };
    },

    pointer: {
      down: function (sim, x, y) {
        var Lo = LAYOUT; if (!Lo) return false;
        for (var k = 0; k < Lo.panels.length; k++) {
          var P = Lo.panels[k], col = Math.floor((x - P.gx) / P.cs), row = Math.floor((y - P.gy) / P.cs), i = row * P.cols + col;
          if (col >= 0 && col < P.cols && row >= 0 && i < sim.state.list.length && y >= P.gy) {
            var st = sim.state; st.target = st.list[i]; st.missing = false; newLanes(st); if (sim.graph) sim.graph.clear(); sim.redraw(); return false;
          }
        }
        return false;
      },
      hover: function (sim, x, y) { return !!LAYOUT && LAYOUT.panels.some(function (P) { return x >= P.gx && x <= P.gx + P.cols * P.cs && y >= P.gy && y <= P.gy + P.rows * P.cs; }); }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, st = sim.state, narrow = W < 560, n = st.list.length;
      D.clear(ctx, W, H, c.bg);
      var sorted = sim.p.order === 'sorted', hl, hc = c.s1;
      var L = st.lin, B = st.bin;
      if (L.done && B.done) {
        if (!sorted && B.found < 0 && !st.missing) { hl = 'Binary search missed it: it only works on a sorted list!'; hc = c.danger; }
        else if (st.missing) { hl = 'Not there · linear needed ' + L.steps + ' checks, binary only ' + B.steps; hc = c.warning; }
        else { hl = 'Found · linear: ' + L.steps + ' checks, binary: ' + B.steps; hc = c.success; }
      } else hl = 'Looking for roll number ' + st.target + (st.missing ? ' (not in the register)' : '');
      D.text(ctx, hl, W / 2, 16, { color: c.bg, bg: hc, size: narrow ? 11.5 : 13, weight: 700, align: 'center', pad: 5, fit: W });

      var top = 34, gap = 8, px = narrow ? 6 : 12, pw = W - px * 2, ph = (H - top - gap - 4) / 2;
      LAYOUT = { panels: [] };
      [L, B].forEach(function (S, k) {
        var y0 = top + k * (ph + gap), col = k ? c.s2 : c.s1, isBin = k === 1;
        D.roundRect(ctx, px, y0, pw, ph, 8, c.surface2, S.done ? D.alpha(S.found >= 0 ? c.success : c.danger, 0.8) : c.border, S.done ? 2 : 1);
        var name = isBin ? 'Binary search' : 'Linear search';
        D.text(ctx, name + (S.done ? (S.found >= 0 ? '  ✓ found' : '  ✗ not found') : ''), px + 10, y0 + 13, { color: col, size: narrow ? 12 : 13, weight: 700 });
        D.text(ctx, S.steps + (S.steps === 1 ? ' check' : ' checks'), px + pw - 10, y0 + 13, { color: c.text, size: narrow ? 11 : 12.5, weight: 700, align: 'right', font: c.mono });
        var msg = isBin ? (B.msg || (sorted ? 'Check the middle, throw away half' : 'Binary search assumes the list is sorted…')) : (L.cur >= 0 ? (st.list[L.cur] === st.target ? st.list[L.cur] + ': found!' : st.list[L.cur] + ' is not it → next student') : 'Check every student from the start');
        D.text(ctx, msg, px + 10, y0 + 30, { color: c.muted, size: narrow ? 10.5 : 12, weight: 600, fit: W - px });
        var gx0 = px + 8, gy0 = y0 + 42, gw = pw - 16, gh = ph - 48, G = grid(n, gw, gh), cs = Math.floor(G.size * 10) / 10;
        var gx = gx0 + (gw - G.cols * cs) / 2;
        LAYOUT.panels.push({ gx: gx, gy: gy0, cs: cs, cols: G.cols, rows: G.rows });
        var seen = {}; S.seen.forEach(function (i) { seen[i] = true; });
        for (var i = 0; i < n; i++) {
          var r = Math.floor(i / G.cols), cc = i % G.cols, x = gx + cc * cs, y = gy0 + r * cs, pad = cs > 14 ? 1.5 : 0.5;
          var fill = D.alpha(col, 0.22), txt = c.text, out = false;
          if (isBin && (i < B.lo || i > B.hi) && i !== B.found) { fill = D.alpha(c.ink, 0.05); txt = c.faint; }
          else if (isBin && !B.done) out = true;
          if (!isBin && seen[i] && i !== L.cur) { fill = D.alpha(c.ink, 0.08); txt = c.faint; }
          if (i === S.cur && !S.done) fill = '#facc15';
          if (i === S.cur && S.done && S.found < 0) fill = D.alpha(c.danger, 0.6);
          if (i === S.found) fill = c.success;
          D.roundRect(ctx, x + pad, y + pad, cs - pad * 2, cs - pad * 2, Math.min(5, cs * 0.2), fill, out && cs > 10 ? D.alpha(col, 0.9) : null, 1.2);
          if (cs >= 26) D.text(ctx, String(st.list[i]), x + cs / 2, y + cs / 2, { color: (i === S.cur || i === S.found) ? '#111827' : txt, size: Math.min(13, cs * 0.3), weight: 700, align: 'center', font: c.mono });
        }
      });
    }
  });
})();
