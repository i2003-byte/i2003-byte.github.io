/* =====================================================================
   Algorithms · How Step Counts Grow — sim.js
   ---------------------------------------------------------------------
   Worst-case steps for a list of n items:
     binary search            about log₂ n
     linear search            n
     merge sort               about n × log₂ n
     bubble / selection sort  about n² ÷ 2   (n(n − 1)/2 comparisons)
   Time = steps ÷ (steps a second). A laptop does roughly 10⁸ simple
   steps a second, a person with pen and paper about 1.
   The chart can use ordinary (linear) axes or log axes, where each
   grid line is 1,000 times the one before. Play grows n from 2 to 10⁹.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var ALGS = [
    { name: 'Binary search', f: function (n) { return Math.max(1, Math.log2(n)); }, form: 'log₂ n', col: 's2' },
    { name: 'Linear search', f: function (n) { return n; }, form: 'n', col: 's1' },
    { name: 'Merge sort', f: function (n) { return n * Math.max(1, Math.log2(n)); }, form: 'n log₂ n', col: 's4' },
    { name: 'Bubble / selection sort', short: 'Bubble sort', f: function (n) { return n * (n - 1) / 2; }, form: 'n² ÷ 2', col: 's3' }
  ];
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

  function nOf(k) { return Math.max(2, Math.round(Math.pow(10, k))); }
  function big(v) {
    if (v < 1e5) return M.fmt(v, v < 10 && Math.abs(v - Math.round(v)) > 0.05 ? 1 : 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (v < 1e7) return M.fmt(v / 1e5, v < 1e6 ? 1 : 0).replace(/\.0$/, '') + ' lakh';
    if (v < 1e12) return M.fmt(v / 1e7, v < 1e8 ? 1 : 0).replace(/\.0$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' crore';
    var e = Math.floor(Math.log10(v)), m = v / Math.pow(10, e);
    return M.fmt(m, 1) + ' × 10' + String(e).split('').map(function (d) { return SUP[d]; }).join('');
  }
  function dur(s) {
    if (s < 1e-6) return M.fmt(s * 1e9, s < 1e-8 ? 1 : 0) + ' ns';
    if (s < 1e-3) return M.fmt(s * 1e6, 0) + ' µs';
    if (s < 1) return M.fmt(s * 1e3, 0) + ' ms';
    if (s < 60) return M.fmt(s, s < 10 ? 1 : 0) + ' s';
    if (s < 3600) return M.fmt(s / 60, s < 600 ? 1 : 0) + ' min';
    if (s < 86400) return M.fmt(s / 3600, 1) + ' hours';
    if (s < 3.156e7) return M.fmt(s / 86400, 0) + ' days';
    var y = s / 3.156e7;
    return y < 1e9 ? big(y) + ' years' : M.fmt(y / 1e9, 0) + ' billion years';
  }
  function pow10(e) { return e === 0 ? '1' : e < 4 ? String(Math.pow(10, e)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '10' + String(e).split('').map(function (d) { return SUP[d]; }).join(''); }

  SimLab.createSim({
    ariaLabel: 'A chart of how many steps four algorithms need as the list size n grows: log n for binary search, n for linear search, n log n for merge sort and n squared for bubble sort, with the time each would take',
    playLabel: 'Grow n',
    mobileAspect: '3 / 3.6',
    params: [
      { id: 'k', label: 'List size n = 10 to the power', min: 0.4, max: 9, step: 0.1, value: 3, unit: '',
        presets: [{ label: '100', value: 2 }, { label: '1,000', value: 3 }, { label: '10 lakh', value: 6 }, { label: '100 crore', value: 9 }],
        help: 'n = 10^3 is 1,000 items, 10^6 is 10 lakh (all the students in a big board exam), 10^9 is 100 crore (about everyone in India).' },
      { id: 'rate', label: 'Who does the steps', type: 'select', value: '1e8', options: [
        { value: '1', label: 'A person: 1 step a second' }, { value: '1e6', label: 'An old computer: 10 lakh steps a second' }, { value: '1e8', label: 'A laptop: 10 crore steps a second' }] },
      { id: 'scale', label: 'Chart axes', type: 'select', value: 'log', options: [
        { value: 'log', label: 'Log scale (each line ×1000)' }, { value: 'linear', label: 'Ordinary scale (0 to n)' }] }
    ],
    readouts: [
      { id: 'n', label: 'List size n', short: 'n', key: true },
      { id: 't1', label: 'Linear search takes', short: 'Linear', key: true },
      { id: 't3', label: 'Bubble sort takes', short: 'Bubble sort', key: true },
      { id: 't0', label: 'Binary search takes' },
      { id: 't2', label: 'Merge sort takes' }
    ],
    onParam: function () { return true; },
    reset: function (sim) { sim.state = {}; },
    update: function (sim, dt) {
      var k = sim.p.k >= 9 ? 0.4 : sim.p.k;
      sim.setParam('k', Math.min(9, Math.round((k + dt * 0.7) * 1000) / 1000));
    },
    finished: function (sim) { return sim.p.k >= 9 && sim.time > 0; },
    status: function (sim) { return 'n = ' + big(nOf(sim.p.k)) + ' · ' + (sim.p.scale === 'log' ? 'log axes' : 'ordinary axes'); },
    readout: function (sim) {
      var n = nOf(sim.p.k), r = parseFloat(sim.p.rate), o = { n: big(n) };
      ALGS.forEach(function (A, i) { o['t' + i] = dur(A.f(n) / r); });
      return o;
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, narrow = W < 560, n = nOf(sim.p.k), rate = parseFloat(sim.p.rate), log = sim.p.scale === 'log';
      D.clear(ctx, W, H, c.bg);
      var fs = narrow ? 10.5 : 12, side = W >= 700;
      var tableH = side ? 0 : 4 * 19 + 22, tableW = side ? Math.min(330, W * 0.36) : 0;
      var cx0 = narrow ? (log ? 44 : 52) : 62, cy0 = 30, cx1 = W - tableW - (side ? 24 : 12), cy1 = H - tableH - 30;
      var hl = 'n = ' + big(n) + ' items · steps needed in the worst case';
      D.text(ctx, hl, W / 2, 14, { color: c.bg, bg: c.s1, size: narrow ? 11.5 : 13, weight: 700, align: 'center', pad: 5, fit: W });
      // axes
      var X, Y, xMaxV, yMaxV;
      if (log) {
        X = function (v) { return cx0 + Math.log10(Math.max(1, v)) / 9 * (cx1 - cx0); };
        Y = function (v) { return cy1 - Math.log10(Math.max(1, v)) / 18 * (cy1 - cy0); };
        for (var e = 0; e <= 18; e += 3) { D.line(ctx, cx0, Y(Math.pow(10, e)), cx1, Y(Math.pow(10, e)), c.grid, 1); D.text(ctx, pow10(e), cx0 - 5, Y(Math.pow(10, e)), { color: c.muted, size: fs - 1, align: 'right', font: c.mono }); }
        for (e = 0; e <= 9; e += 3) { D.line(ctx, X(Math.pow(10, e)), cy0, X(Math.pow(10, e)), cy1, c.grid, 1); D.text(ctx, pow10(e), X(Math.pow(10, e)), cy1 + 11, { color: c.muted, size: fs - 1, align: 'center', font: c.mono }); }
      } else {
        xMaxV = n; yMaxV = Math.max(4, ALGS[2].f(n) * 1.25);
        X = function (v) { return cx0 + v / xMaxV * (cx1 - cx0); };
        Y = function (v) { return cy1 - v / yMaxV * (cy1 - cy0); };
        var ys = D.niceStep(yMaxV, 4), xs = D.niceStep(xMaxV, narrow ? 3 : 5);
        for (var v = 0; v <= yMaxV; v += ys) { D.line(ctx, cx0, Y(v), cx1, Y(v), c.grid, 1); D.text(ctx, big(v), cx0 - 5, Y(v), { color: c.muted, size: fs - 1.5, align: 'right', font: c.mono }); }
        for (v = 0; v <= xMaxV; v += xs) { D.line(ctx, X(v), cy0, X(v), cy1, c.grid, 1); D.text(ctx, big(v), X(v), cy1 + 11, { color: c.muted, size: fs - 1.5, align: 'center', font: c.mono }); }
      }
      D.line(ctx, cx0, cy1, cx1, cy1, c.axis, 1.5); D.line(ctx, cx0, cy0, cx0, cy1, c.axis, 1.5);
      D.text(ctx, 'list size n →', cx1, cy1 + 23, { color: c.muted, size: fs - 1, align: 'right', weight: 600 });
      D.text(ctx, 'steps', cx0 + 4, cy0 + 4, { color: c.muted, size: fs - 1, weight: 600 });
      // curves (up to the current n on log axes; the whole range on ordinary axes)
      ctx.save(); ctx.beginPath(); ctx.rect(cx0, cy0 - 2, cx1 - cx0 + 2, cy1 - cy0 + 2); ctx.clip();
      ALGS.forEach(function (A) {
        var col = c[A.col];
        ctx.beginPath();
        for (var i = 0; i <= 240; i++) {
          var nv = log ? Math.pow(10, 9 * i / 240) : Math.max(1, n * i / 240), px = X(nv), py = Y(A.f(Math.max(1, nv)));
          if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.strokeStyle = D.alpha(col, 0.3); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath();
        for (i = 0; i <= 240; i++) {
          var nn = log ? Math.pow(10, Math.log10(n) * i / 240) : Math.max(1, n * i / 240);
          var qx = X(nn), qy = Y(A.f(Math.max(1, nn)));
          if (i) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy);
        }
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
      });
      ctx.restore();
      // markers at the current n, with labels pushed apart
      var marks = ALGS.map(function (A) { var yv = Y(A.f(n)); return { A: A, y: yv, ly: yv, off: yv < cy0 }; });
      D.line(ctx, X(n), cy0, X(n), cy1, D.alpha(c.ink, 0.35), 1, [4, 4]);
      var lx = Math.min(X(n) + 8, cx1 - (narrow ? 70 : 90)), lAlign = 'left';
      if (X(n) > cx1 - (narrow ? 80 : 110)) { lx = X(n) - 8; lAlign = 'right'; }
      marks.slice().sort(function (a, b) { return b.y - a.y; }).forEach(function (m, k, arr) {
        m.ly = M.clamp(m.y, cy0 + 8, cy1 - 6);
        if (k && m.ly > arr[k - 1].ly - 15) m.ly = arr[k - 1].ly - 15;
      });
      marks.forEach(function (m) {
        var col = c[m.A.col];
        if (!m.off) D.circle(ctx, X(n), m.y, 4.5, col, c.bg, 1.5);
        else D.arrow(ctx, X(n), cy0 + 22, X(n), cy0 + 4, col, 2, 6);
        D.text(ctx, m.A.form + (m.off ? ' (off the top)' : ''), lx, m.ly, { color: col, size: fs, weight: 700, align: lAlign, bg: D.alpha(c.bg, 0.75), pad: 2, fit: W });
      });
      // table: steps and time
      var tx = side ? W - tableW - 8 : 8, ty = side ? 40 : H - tableH + 2, tw = side ? tableW : W - 16;
      D.roundRect(ctx, tx, ty - 6, tw, (side ? 4 * 40 + 30 : tableH - 2), 8, c.surface2, c.border, 1);
      D.text(ctx, 'At ' + big(rate) + (rate === 1 ? ' step' : ' steps') + ' a second:', tx + 10, ty + 7, { color: c.muted, size: fs, weight: 700, fit: W });
      ALGS.forEach(function (A, i) {
        var col = c[A.col], steps = A.f(n), t = steps / rate;
        var slow = t > 3.156e7 ? c.danger : t > 60 ? c.warning : c.success;
        if (side) {
          var ry = ty + 26 + i * 40;
          D.text(ctx, A.name, tx + 10, ry + 2, { color: col, size: 12.5, weight: 700 });
          D.text(ctx, big(steps) + ' steps', tx + 10, ry + 19, { color: c.text, size: 11.5, font: c.mono });
          D.text(ctx, dur(t), tx + tw - 10, ry + 11, { color: slow, size: 13, weight: 700, align: 'right' });
        } else {
          var rr = ty + 24 + i * 19;
          D.text(ctx, A.short || A.name, tx + 8, rr, { color: col, size: fs, weight: 700 });
          D.text(ctx, big(steps), tx + tw * 0.56, rr, { color: c.text, size: fs - 0.5, align: 'right', font: c.mono });
          D.text(ctx, dur(t), tx + tw - 8, rr, { color: slow, size: fs, weight: 700, align: 'right' });
        }
      });
    }
  });
})();
