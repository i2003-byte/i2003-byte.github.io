/* =====================================================================
   Statistics · Mean, Median and Mode — sim.js
   ---------------------------------------------------------------------
   A small set of whole-number values is shown as a dot plot on a number
   line. Drag any dot to change its value.
     mean   = sum of values ÷ number of values. It is the balance point:
              the sum of the distances (x − mean) is always 0, so the
              number line balances on a pivot placed at the mean.
     median = the middle value once the values are sorted (for an even
              count, the average of the two middle values)
     mode   = the value that occurs most often (there can be more than
              one; if every value occurs equally often there is none)
     range  = largest − smallest
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  var SETS = {
    marks: { name: 'Marks of 9 students (out of 20)', short: 'Marks out of 20', lo: 0, hi: 20, v: [8, 11, 12, 12, 14, 15, 15, 15, 18] },
    family: { name: 'Number of people in 11 families', short: 'People per family', lo: 0, hi: 12, v: [2, 3, 3, 4, 4, 4, 4, 5, 5, 6, 8] },
    shoes: { name: 'Shoe sizes of 12 students', short: 'Shoe sizes', lo: 2, hi: 12, v: [5, 6, 6, 7, 7, 7, 7, 8, 8, 9, 9, 10] },
    rain: { name: 'Rainy days in each month of a year, Pune', short: 'Rainy days a month', lo: 0, hi: 25, v: [0, 0, 0, 1, 3, 12, 19, 16, 10, 5, 2, 1] }
  };
  var st = { v: [], drag: -1, set: '' };

  function ds(p) { return SETS[p.set] || SETS.marks; }
  function load(p) { st.v = ds(p).v.slice(); st.set = p.set; st.drag = -1; }
  function nf(x) { return String(parseFloat(x.toFixed(2))); }
  function stats() {
    var v = st.v.slice().sort(function (a, b) { return a - b; }), n = v.length, sum = 0, counts = {};
    v.forEach(function (x) { sum += x; counts[x] = (counts[x] || 0) + 1; });
    var mean = n ? sum / n : 0, median = n ? (n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2) : 0;
    var top = 0, keys = Object.keys(counts);
    keys.forEach(function (k) { top = Math.max(top, counts[k]); });
    var modes = top > 1 || keys.length === 1 ? keys.filter(function (k) { return counts[k] === top; }).map(Number) : [];
    if (keys.length > 1 && modes.length === keys.length) modes = [];   // all equally often → no mode
    return { v: v, n: n, sum: sum, mean: mean, median: median, modes: modes, top: top, counts: counts, range: n ? v[n - 1] - v[0] : 0 };
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, d = ds(sim.p);
    var top = narrow ? 36 : 44, stripH = narrow ? 30 : 38;
    var x0 = narrow ? 22 : 40, x1 = W - (narrow ? 22 : 40);
    var lineY = H - (narrow ? 72 : 86);
    var step = (x1 - x0) / (d.hi - d.lo);
    var r = M.clamp(Math.min(step * 0.42, (lineY - top - stripH - 30) / 13), 4, narrow ? 10 : 13);
    return { W: W, H: H, narrow: narrow, d: d, top: top, stripY: top + 6, stripH: stripH, x0: x0, x1: x1, lineY: lineY, r: r,
      X: function (v) { return x0 + (v - d.lo) * step; },
      V: function (x) { return M.clamp(Math.round(d.lo + (x - x0) / step), d.lo, d.hi); } };
  }
  // pixel positions of every dot (stacked above the line), by index into st.v
  function dots(L) {
    var seen = {}, out = [];
    st.v.forEach(function (x, i) {
      var k = seen[x] = (seen[x] || 0) + 1;
      out[i] = { x: L.X(x), y: L.lineY - 6 - L.r - (k - 1) * (L.r * 2 + 2), v: x };
    });
    return out;
  }
  function nearest(sim, x, y) {
    var L = layout(sim), P = dots(L), best = -1, bd = Math.max(22, L.r * 1.8);
    P.forEach(function (q, i) { var d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  SimLab.createSim({
    ariaLabel: 'A dot plot of a small data set on a number line that balances on a pivot at the mean; the sorted values are shown above with the median highlighted, and the tallest stack marks the mode. Drag the dots to change the data.',
    transport: false,
    mobileAspect: '3 / 3.2',
    params: [
      { id: 'set', label: 'Data', type: 'select', value: 'marks', options: [
        { value: 'marks', label: 'Marks of 9 students' },
        { value: 'family', label: 'People in 11 families' },
        { value: 'shoes', label: 'Shoe sizes of 12 students' },
        { value: 'rain', label: 'Rainy days per month, Pune' }] },
      { id: 'mean', label: 'Show the mean (balance point)', type: 'toggle', value: true },
      { id: 'median', label: 'Show the median', type: 'toggle', value: true },
      { id: 'mode', label: 'Show the mode', type: 'toggle', value: true },
      { id: 'dev', label: 'Show distances from the mean', type: 'toggle', value: false }
    ],
    buttons: [
      { label: 'Add an outlier (a very big value)', primary: true, onClick: function (sim) { if (st.v.length < 20) st.v.push(ds(sim.p).hi); } },
      { label: 'Add a value', onClick: function (sim) {
        if (st.v.length >= 20) return;
        var s = stats(); st.v.push(Math.round(s.n ? s.median : (ds(sim.p).lo + ds(sim.p).hi) / 2));
      } },
      { label: 'Remove the last value', onClick: function () { if (st.v.length > 1) st.v.pop(); } },
      { label: 'Start again', onClick: function (sim) { load(sim.p); } }
    ],
    readouts: [
      { id: 'n', label: 'Number of values', digits: 0 },
      { id: 'sum', label: 'Sum of values', digits: 0 },
      { id: 'mean', label: 'Mean', digits: 2, key: true },
      { id: 'median', label: 'Median', key: true },
      { id: 'mode', label: 'Mode', key: true },
      { id: 'range', label: 'Range', digits: 0 },
      { id: 'dev', label: 'Sum of (x − mean)', digits: 2 }
    ],
    reset: function (sim) { if (st.set !== sim.p.set || !st.v.length) load(sim.p); },
    onParam: function (sim, id) { if (id === 'set') load(sim.p); return true; },
    readout: function () {
      var s = stats(), dev = 0;
      s.v.forEach(function (x) { dev += x - s.mean; });
      return { n: s.n, sum: s.sum, mean: s.mean, median: nf(s.median), mode: s.modes.length ? s.modes.join(' and ') : 'none', range: s.range, dev: Math.abs(dev) < 1e-9 ? 0 : dev };
    },
    status: function () { var s = stats(); return s.n + ' values · mean ' + nf(s.mean) + ' · median ' + nf(s.median); },
    pointer: {
      down: function (sim, x, y) { st.drag = nearest(sim, x, y); return st.drag >= 0; },
      move: function (sim, x) { if (st.drag >= 0) st.v[st.drag] = layout(sim).V(x); },
      up: function () { st.drag = -1; },
      hover: function (sim, x, y) { return nearest(sim, x, y) >= 0; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, s = stats(), P = dots(L);
      var fs = L.narrow ? 11 : 13, d = L.d;
      D.clear(ctx, W, H, c.bg);

      // sorted strip with the median boxed
      var n = s.n, cell = Math.min(L.narrow ? 26 : 34, (W - 20) / Math.max(n, 1)), sx = W / 2 - cell * n / 2;
      s.v.forEach(function (x, i) {
        var mid = p.median && (n % 2 ? i === (n - 1) / 2 : i === n / 2 - 1 || i === n / 2);
        var isMode = p.mode && s.modes.indexOf(x) >= 0;
        D.roundRect(ctx, sx + i * cell + 1.5, L.stripY, cell - 3, L.stripH, 5, mid ? D.alpha(c.s2, 0.35) : D.alpha(c.ink, 0.06), mid ? c.s2 : c.grid, mid ? 2 : 1);
        D.text(ctx, String(x), sx + (i + 0.5) * cell, L.stripY + L.stripH / 2, { color: isMode ? c.warning : c.ink, size: Math.min(fs + 1, cell * 0.5), weight: 700, align: 'center' });
      });
      D.text(ctx, 'Sorted:', sx - 4, L.stripY - 2, { color: c.muted, size: L.narrow ? 9 : 11, align: 'left', baseline: 'bottom', fit: W });
      if (p.median) D.text(ctx, n % 2 ? 'middle value = median ' + nf(s.median) : 'median = (' + s.v[n / 2 - 1] + ' + ' + s.v[n / 2] + ') ÷ 2 = ' + nf(s.median),
        W / 2, L.stripY + L.stripH + 11, { color: c.s2, size: L.narrow ? 10 : 12, weight: 700, align: 'center', fit: W });

      // the plank (number line) on a pivot at the mean
      var ly = L.lineY;
      ctx.fillStyle = D.alpha(c.ink, 0.12); ctx.fillRect(L.x0 - 12, ly, L.x1 - L.x0 + 24, 6);
      D.line(ctx, L.x0 - 12, ly, L.x1 + 12, ly, c.axis, 2);
      var tickEvery = (d.hi - d.lo) > 15 ? 5 : 1;
      for (var t = d.lo; t <= d.hi; t++) {
        var tx = L.X(t), big = t % tickEvery === 0;
        D.line(ctx, tx, ly, tx, ly + (big ? 8 : 4), c.axis, 1);
        if (big || (L.X(1) - L.X(0)) > 22) D.text(ctx, String(t), tx, ly + 16, { color: c.muted, size: L.narrow ? 9 : 11, align: 'center' });
      }
      D.text(ctx, L.narrow ? d.short : d.name, W / 2, H - 10, { color: c.muted, size: L.narrow ? 10 : 12, align: 'center', fit: W });
      if (p.mean && n) {
        var mx = L.X(s.mean), ph = L.narrow ? 18 : 22;
        ctx.beginPath(); ctx.moveTo(mx, ly + 7); ctx.lineTo(mx - ph * 0.7, ly + 7 + ph); ctx.lineTo(mx + ph * 0.7, ly + 7 + ph); ctx.closePath();
        ctx.fillStyle = c.s1; ctx.fill();
        D.text(ctx, 'mean ' + nf(s.mean), mx + ph * 0.7 + 4, ly + 7 + ph * 0.6, { color: c.s1, size: fs, weight: 700, fit: W, bg: D.alpha(c.bg, 0.8), pad: 2 });
        D.line(ctx, mx, L.stripY + L.stripH + 22, mx, ly, D.alpha(c.s1, 0.7), 1.5, [5, 4]);
      }

      // distances from the mean
      if (p.dev && n) {
        var mxx = L.X(s.mean);
        P.forEach(function (q) {
          var col = q.v >= s.mean ? c.success : c.danger;
          D.line(ctx, mxx, q.y, q.x, q.y, D.alpha(col, 0.8), 2);
        });
        var right = 0, left = 0;
        s.v.forEach(function (x) { if (x > s.mean) right += x - s.mean; else left += s.mean - x; });
        D.text(ctx, '− side: ' + nf(left) + '   + side: ' + nf(right), W / 2, L.stripY + L.stripH + 28, { color: c.ink, size: L.narrow ? 10 : 12, weight: 700, align: 'center', fit: W, bg: D.alpha(c.bg, 0.8), pad: 2 });
      }

      // dots
      P.forEach(function (q, i) {
        var isMode = p.mode && s.modes.indexOf(q.v) >= 0, on = i === st.drag;
        D.circle(ctx, q.x, q.y, L.r * (on ? 1.25 : 1), isMode ? c.warning : c.success, on ? c.ink : c.bg, on ? 2.5 : 1.5);
      });
      if (p.mode && s.modes.length) {
        s.modes.forEach(function (m) {
          var h = s.counts[m], y = L.lineY - 6 - (h * 2 - 1) * L.r - (h - 1) * 2 - L.r - 8;
          D.text(ctx, 'mode', L.X(m), y, { color: c.warning, size: L.narrow ? 10 : 12, weight: 700, align: 'center', fit: W });
        });
      }
      if (st.drag < 0 && n) D.text(ctx, 'Drag a dot', L.x1, L.stripY + L.stripH + 46, { color: c.muted, size: L.narrow ? 10 : 11, align: 'right', fit: W });
    }
  });
})();
