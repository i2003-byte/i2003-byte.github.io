/* =====================================================================
   Algorithms · Sorting Race — sim.js
   ---------------------------------------------------------------------
   Three copies of the same array are sorted side by side:
     bubble sort    compare neighbours, swap if out of order; the largest
                    bar "bubbles" to the end of each pass. Stops early
                    when a pass makes no swap.
     selection sort find the smallest bar in the unsorted part and swap
                    it to the front: always n(n − 1)/2 comparisons.
     merge sort     split in halves, sort each half, merge the two sorted
                    halves by repeatedly taking the smaller front bar:
                    at most about n log₂ n comparisons.
   Each algorithm is first run on a copy to record a list of operations
   (compare, swap, write). The race replays one operation per tick for
   every lane, so each compare or move costs the same time.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var NAMES = ['Bubble sort', 'Selection sort', 'Merge sort'];
  var COLS = ['s1', 's3', 's2'];

  /* ---- operation recorders ---- */
  function bubbleOps(a) {
    var ops = [], n = a.length;
    for (var pass = 0; pass < n - 1; pass++) {
      var swapped = false, last = n - 1 - pass;
      for (var j = 0; j < last; j++) {
        ops.push({ t: 'c', i: j, j: j + 1 });
        if (a[j] > a[j + 1]) { var x = a[j]; a[j] = a[j + 1]; a[j + 1] = x; ops.push({ t: 's', i: j, j: j + 1 }); swapped = true; }
      }
      ops.push({ t: 'm', from: last, to: last });
      if (!swapped) { ops.push({ t: 'm', from: 0, to: last - 1 }); return ops; }
    }
    ops.push({ t: 'm', from: 0, to: 0 });
    return ops;
  }
  function selectionOps(a) {
    var ops = [], n = a.length;
    for (var i = 0; i < n - 1; i++) {
      var m = i;
      for (var j = i + 1; j < n; j++) {
        ops.push({ t: 'c', i: m, j: j });
        if (a[j] < a[m]) m = j;
      }
      if (m !== i) { var x = a[i]; a[i] = a[m]; a[m] = x; ops.push({ t: 's', i: i, j: m }); }
      ops.push({ t: 'm', from: i, to: i });
    }
    ops.push({ t: 'm', from: n - 1, to: n - 1 });
    return ops;
  }
  function mergeOps(a) {
    var ops = [];
    function sort(lo, hi) {
      if (hi <= lo) return;
      var mid = (lo + hi) >> 1;
      sort(lo, mid); sort(mid + 1, hi);
      var aux = a.slice(lo, hi + 1), i = lo, j = mid + 1, k = lo;
      while (i <= mid && j <= hi) {
        ops.push({ t: 'c', i: k, j: j, lo: lo, hi: hi });
        if (aux[j - lo] < aux[i - lo]) { a[k] = aux[j - lo]; j++; } else { a[k] = aux[i - lo]; i++; }
        ops.push({ t: 'w', k: k, v: a[k], lo: lo, hi: hi }); k++;
      }
      while (i <= mid) { a[k] = aux[i - lo]; ops.push({ t: 'w', k: k, v: a[k], lo: lo, hi: hi }); i++; k++; }
      while (j <= hi) { a[k] = aux[j - lo]; ops.push({ t: 'w', k: k, v: a[k], lo: lo, hi: hi }); j++; k++; }
    }
    sort(0, a.length - 1);
    ops.push({ t: 'm', from: 0, to: a.length - 1 });
    return ops;
  }
  var RECORD = [bubbleOps, selectionOps, mergeOps];

  function makeArray(n, order, seed) {
    var r = M.rng(seed), a = [], i;
    for (i = 1; i <= n; i++) a.push(i);
    if (order === 'reversed') return a.reverse();
    if (order === 'nearly') {
      for (i = 0; i < Math.max(1, Math.round(n / 10)); i++) { var k = Math.floor(r() * (n - 1)), x = a[k]; a[k] = a[k + 1]; a[k + 1] = x; }
      return a;
    }
    for (i = n - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), y = a[i]; a[i] = a[j]; a[j] = y; }
    return a;
  }

  function build(sim) {
    var n = parseInt(sim.p.n, 10), start = makeArray(n, sim.p.order, sim.state ? sim.state.seed : 7);
    return RECORD.map(function (rec, idx) {
      return { name: NAMES[idx], col: COLS[idx], arr: start.slice(), ops: rec(start.slice()), pc: 0, cmp: 0, moves: 0, steps: 0,
        hi: null, sorted: new Array(n).fill(false), doneAt: null, range: null };
    });
  }
  // Apply operations for one tick: skip free 'mark' ops, then do one costed op.
  function tick(L, stepNo) {
    if (L.doneAt != null) return;
    while (L.pc < L.ops.length && L.ops[L.pc].t === 'm') { var o = L.ops[L.pc++]; for (var q = o.from; q <= o.to; q++) L.sorted[q] = true; }
    if (L.pc >= L.ops.length) { L.doneAt = stepNo; L.hi = null; L.range = null; return; }
    var op = L.ops[L.pc++];
    L.steps++;
    if (op.t === 'c') { L.cmp++; L.hi = { kind: 'c', a: op.i, b: op.j }; }
    else if (op.t === 's') { var x = L.arr[op.i]; L.arr[op.i] = L.arr[op.j]; L.arr[op.j] = x; L.moves++; L.hi = { kind: 's', a: op.i, b: op.j }; }
    else { L.arr[op.k] = op.v; L.moves++; L.hi = { kind: 'w', a: op.k, b: -1 }; }
    L.range = op.lo != null ? [op.lo, op.hi] : null;
    // finish immediately if only marks remain
    var rest = L.pc; while (rest < L.ops.length && L.ops[rest].t === 'm') rest++;
    if (rest >= L.ops.length) { while (L.pc < L.ops.length) { var mo = L.ops[L.pc++]; for (var z = mo.from; z <= mo.to; z++) L.sorted[z] = true; } L.doneAt = stepNo; L.hi = null; L.range = null; }
  }
  function nlog(n) { return n * Math.log2(n); }
  function ord(k) { return ['1st', '2nd', '3rd'][k]; }

  SimLab.createSim({
    ariaLabel: 'Three rows of bars of different heights, the same starting order in each row, being sorted by bubble sort, selection sort and merge sort at the same time with comparisons and swaps counted',
    playLabel: 'Start race',
    mobileAspect: '3 / 4.4',
    params: [
      { id: 'n', label: 'Number of bars (n)', type: 'select', value: '16', options: [
        { value: '8', label: '8 bars' }, { value: '16', label: '16 bars' }, { value: '32', label: '32 bars' }, { value: '64', label: '64 bars' }] },
      { id: 'order', label: 'Starting order', type: 'select', value: 'random', options: [
        { value: 'random', label: 'Shuffled at random' }, { value: 'nearly', label: 'Nearly sorted (a few neighbours swapped)' }, { value: 'reversed', label: 'Reversed (largest first)' }] },
      { id: 'speed', label: 'Race speed', min: 1, max: 400, step: 1, value: 12, unit: 'steps/s',
        presets: [{ label: 'Slow', value: 3 }, { label: 'Medium', value: 12 }, { label: 'Fast', value: 80 }, { label: 'Very fast', value: 400 }],
        help: 'One step is one comparison or one move. Every lane gets the same number of steps per second.' }
    ],
    buttons: [
      { label: 'New shuffled array', primary: true, onClick: function (sim) {
        var s = (sim.state.seed * 48271 + 11) % 2147483647 || 3;
        if (sim.p.order !== 'random') sim.setParam('order', 'random');
        sim.state.seed = s; sim.reset();
      } }
    ],
    readouts: [
      { id: 'c0', label: 'Bubble: comparisons', key: true },
      { id: 'c1', label: 'Selection: comparisons', key: true },
      { id: 'c2', label: 'Merge: comparisons', key: true },
      { id: 'sq', label: 'n(n − 1) ÷ 2' },
      { id: 'nl', label: 'n × log₂ n' },
      { id: 'lead', label: 'Leader' }
    ],
    graph: { title: 'Comparisons made so far', yLabel: 'comparisons', series: [{ label: 'Bubble', color: '--sim-1' }, { label: 'Selection', color: '--sim-3' }, { label: 'Merge', color: '--sim-2' }] },
    onParam: function (sim, id) { return id === 'speed'; },

    reset: function (sim) {
      var seed = sim.state && sim.state.seed || 7;
      sim.state = { seed: seed, acc: 0, stepNo: 0 };
      sim.state.lanes = build(sim);
    },
    update: function (sim, dt) {
      var st = sim.state; st.acc += dt * sim.p.speed;
      while (st.acc >= 1) {
        st.acc -= 1; st.stepNo++;
        st.lanes.forEach(function (L) { tick(L, st.stepNo); });
        if (st.lanes.every(function (L) { return L.doneAt != null; })) break;
      }
    },
    finished: function (sim) { return sim.state.lanes.every(function (L) { return L.doneAt != null; }); },
    sample: function (sim) { return sim.state.lanes.map(function (L) { return L.cmp; }); },
    status: function (sim) {
      var st = sim.state;
      if (st.lanes.every(function (L) { return L.doneAt != null; })) return 'Race over after ' + st.stepNo + ' steps';
      return (sim.running ? 'Racing' : st.stepNo ? 'Paused' : 'Ready') + ' · step ' + st.stepNo;
    },
    readout: function (sim) {
      var st = sim.state, n = parseInt(sim.p.n, 10), ls = st.lanes;
      var order = ls.map(function (L, i) { return i; }).sort(function (a, b) {
        var A = ls[a], B = ls[b];
        if (A.doneAt != null || B.doneAt != null) return (A.doneAt == null ? 1e9 : A.doneAt) - (B.doneAt == null ? 1e9 : B.doneAt);
        return (B.pc / B.ops.length) - (A.pc / A.ops.length);
      });
      return {
        c0: String(ls[0].cmp), c1: String(ls[1].cmp), c2: String(ls[2].cmp),
        sq: String(n * (n - 1) / 2), nl: M.fmt(nlog(n), 0),
        lead: st.stepNo ? ls[order[0]].name : '—'
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, st = sim.state, narrow = W < 560;
      var n = parseInt(sim.p.n, 10), ls = st.lanes;
      D.clear(ctx, W, H, c.bg);

      // finishing places
      var finished = ls.filter(function (L) { return L.doneAt != null; }).sort(function (a, b) { return a.doneAt - b.doneAt; });
      var hl, hc = c.s1;
      if (finished.length === 3) { hl = '🏁 ' + finished[0].name + ' wins after ' + finished[0].doneAt + ' steps'; hc = c.success; }
      else if (finished.length) { hl = finished[0].name + ' has finished! Others still sorting…'; hc = c.warning; }
      else if (!st.stepNo) hl = 'Same ' + n + ' bars in every lane · press Start race';
      else hl = 'Yellow = comparing  ·  pink = moving  ·  green = in its final place';
      var fs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif';
      while (fs > 9 && ctx.measureText(hl).width > W - 30) { fs -= 0.5; ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, 16, { color: c.bg, bg: hc, size: fs, weight: 700, align: 'center', pad: 5, fit: W });

      var top = 36, gap = narrow ? 8 : 10, laneH = (H - top - 6 - gap * 2) / 3;
      var px = narrow ? 8 : 14, pw = W - px * 2;
      ls.forEach(function (L, idx) {
        var y0 = top + idx * (laneH + gap), col = c[L.col];
        D.roundRect(ctx, px, y0, pw, laneH, 8, c.surface2, L.doneAt != null ? D.alpha(c.success, 0.8) : c.border, L.doneAt != null ? 2 : 1);
        // lane header
        var place = finished.indexOf(L);
        var head = L.name + (place >= 0 ? '  ✓ ' + ord(place) : '');
        D.text(ctx, head, px + 10, y0 + 13, { color: col, size: narrow ? 12 : 13, weight: 700 });
        var info = narrow ? L.cmp + ' comp. · ' + L.moves + (idx === 2 ? ' writes' : ' swaps') : L.cmp + ' comparisons · ' + L.moves + (idx === 2 ? ' writes' : ' swaps') + ' · ' + L.steps + ' steps';
        D.text(ctx, info, px + pw - 10, y0 + 13, { color: c.muted, size: narrow ? 10.5 : 12, weight: 600, align: 'right', font: c.mono });
        // progress bar
        var prog = L.ops.length ? L.pc / L.ops.length : 1;
        D.roundRect(ctx, px + 10, y0 + 24, pw - 20, 3, 1.5, D.alpha(c.ink, 0.1));
        D.roundRect(ctx, px + 10, y0 + 24, (pw - 20) * prog, 3, 1.5, col);
        // bars
        var bx0 = px + 10, bw = (pw - 20) / n, by = y0 + laneH - 8, bhMax = laneH - (n <= 16 ? 52 : 40);
        if (L.range && !narrow || L.range && n <= 32) {
          var rx0 = bx0 + L.range[0] * bw, rx1 = bx0 + (L.range[1] + 1) * bw;
          ctx.fillStyle = D.alpha(c.s2, 0.1); ctx.fillRect(rx0, y0 + 30, rx1 - rx0, laneH - 36);
        }
        for (var i = 0; i < n; i++) {
          var v = L.arr[i], h = Math.max(2, v / n * bhMax), fill = D.alpha(col, 0.55);
          if (L.sorted[i]) fill = D.alpha(c.success, 0.85);
          if (L.hi && (L.hi.a === i || L.hi.b === i)) fill = L.hi.kind === 'c' ? '#facc15' : '#f472b6';
          var gapPx = bw > 6 ? Math.min(3, bw * 0.18) : 0.5;
          ctx.fillStyle = fill; ctx.fillRect(bx0 + i * bw + gapPx / 2, by - h, bw - gapPx, h);
          if (n <= 16 && bw > 16) D.text(ctx, String(v), bx0 + (i + 0.5) * bw, by - h - 7, { color: c.muted, size: 10, align: 'center', font: c.mono });
        }
        D.line(ctx, bx0, by + 0.5, bx0 + pw - 20, by + 0.5, c.axis, 1);
      });
    }
  });
})();
