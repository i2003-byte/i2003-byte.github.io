/* =====================================================================
   Statistics · Histogram and Frequency Polygon — sim.js
   ---------------------------------------------------------------------
   A fixed set of raw data (marks, heights or temperatures) is grouped
   into classes of equal width: lower limit included, upper limit not
   (so 40 goes in 40–50), except the very top value, which goes in the
   last class. Then:
     class mark            = (lower limit + upper limit) ÷ 2
     histogram             = touching bars, height = frequency
     frequency polygon     = joins the mid-points of the bar tops, and is
                             closed at the class marks of the empty
                             classes just before and after the data
   Unequal classes: some end classes are merged. With unequal widths the
   AREA of a bar must show the frequency, so the height is adjusted:
     adjusted frequency = (smallest class width ÷ this class width) × f
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  var DATA = {
    marks: {
      name: 'Marks of 40 students in a maths test (out of 100)', short: 'Marks of 40 students',
      unit: 'marks', axis: 'Marks', who: 'students', start: 0, end: 100, widths: [20, 10, 5],
      v: [12, 25, 33, 38, 41, 44, 46, 48, 52, 53, 55, 56, 57, 58, 59, 61, 62, 63, 64, 65,
        66, 67, 68, 68, 70, 71, 72, 74, 75, 77, 78, 81, 83, 85, 86, 88, 91, 94, 97, 100]
    },
    heights: {
      name: 'Heights of 36 students of Class 9 (cm)', short: 'Heights of 36 students',
      unit: 'cm', axis: 'Height (cm)', who: 'students', start: 130, end: 180, widths: [10, 5, 2],
      v: [138, 141, 143, 144, 146, 147, 148, 149, 149, 150, 151, 151, 152, 152, 153, 153, 154, 154,
        155, 155, 156, 156, 157, 158, 158, 159, 160, 161, 162, 163, 164, 166, 167, 169, 171, 174]
    },
    temps: {
      name: 'Highest temperature each day in Delhi, May (31 days, °C)', short: 'Delhi in May (°C)',
      unit: '°C', axis: 'Highest temperature (°C)', who: 'days', start: 36, end: 48, widths: [4, 2, 1],
      v: [36.4, 37.8, 38.5, 39.0, 39.3, 39.6, 40.1, 40.4, 40.8, 41.0, 41.2, 41.4, 41.5, 41.7, 41.9, 42.0,
        42.2, 42.4, 42.6, 42.8, 43.0, 43.1, 43.4, 43.6, 43.9, 44.2, 44.5, 44.8, 45.1, 45.6, 46.2]
    }
  };
  var sel = -1;

  function nf(x) { return String(parseFloat(x.toFixed(1))); }
  function classes(p) {
    var ds = DATA[p.data] || DATA.marks, w = ds.widths[{ wide: 0, mid: 1, narrow: 2 }[p.size] || 0];
    var out = [], a, i;
    for (a = ds.start; a < ds.end - 1e-9; a += w) out.push({ a: a, b: a + w, f: 0 });
    ds.v.forEach(function (x) {
      var k = Math.min(out.length - 1, Math.floor((x - ds.start) / w + 1e-9));
      out[k].f++;
    });
    var merged = false;
    if (p.unequal && out.length >= 6) {
      var m1 = Math.floor(out.length * 0.3), m2 = Math.floor(out.length * 0.2);
      var first = { a: out[0].a, b: out[m1 - 1].b, f: 0 }, last = { a: out[out.length - m2].a, b: out[out.length - 1].b, f: 0 };
      for (i = 0; i < m1; i++) first.f += out[i].f;
      for (i = out.length - m2; i < out.length; i++) last.f += out[i].f;
      out = [first].concat(out.slice(m1, out.length - m2), m2 > 0 ? [last] : []);
      merged = true;
    }
    var wmin = Infinity;
    out.forEach(function (c) { wmin = Math.min(wmin, c.b - c.a); });
    out.forEach(function (c) {
      c.w = c.b - c.a; c.mid = (c.a + c.b) / 2;
      c.h = merged && p.adjust ? c.f * wmin / c.w : c.f;
    });
    return { ds: ds, w: w, wmin: wmin, list: out, merged: merged };
  }
  function layout(sim, C) {
    var W = sim.width, H = sim.height, narrow = W < 560, wide = W > 700 && W > H * 1.3;
    var top = narrow ? 40 : 48, tabW = wide ? Math.min(250, W * 0.3) : 0;
    var px = (narrow ? 44 : 56), pr = 16 + tabW, pb = narrow ? 50 : 56;
    var poly = sim.p.view !== 'hist';
    var x0 = C.ds.start - (poly ? C.wmin : 0), x1 = C.ds.end + (poly ? C.wmin : 0);
    var hmax = 0; C.list.forEach(function (c) { hmax = Math.max(hmax, c.h); });
    var ystep = hmax > 12 ? 2 : 1, ymax = Math.ceil((hmax + 1) / ystep) * ystep;
    var plot = { x: px, y: top + 18, w: W - px - pr, h: H - top - 18 - pb };
    return {
      W: W, H: H, narrow: narrow, wide: wide, top: top, plot: plot, tabW: tabW, ymax: ymax, ystep: ystep, x0: x0, x1: x1,
      X: function (v) { return plot.x + (v - x0) / (x1 - x0) * plot.w; },
      Y: function (v) { return plot.y + plot.h - v / ymax * plot.h; }
    };
  }
  function hit(sim, x, y) {
    var C = classes(sim.p), L = layout(sim, C);
    if (y < L.plot.y - 10 || y > L.plot.y + L.plot.h + 24) return -1;
    for (var i = 0; i < C.list.length; i++) if (x >= L.X(C.list[i].a) && x <= L.X(C.list[i].b)) return i;
    return -1;
  }
  function tally(ctx, n, x, y, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath();
    for (var g = 0; g * 5 < n; g++) {
      var gx = x + g * 26, k = Math.min(5, n - g * 5);
      for (var j = 0; j < Math.min(4, k); j++) { ctx.moveTo(gx + j * 5, y - 7); ctx.lineTo(gx + j * 5, y + 7); }
      if (k === 5) { ctx.moveTo(gx - 3, y + 5); ctx.lineTo(gx + 18, y - 5); }
    }
    ctx.stroke(); ctx.restore();
  }

  SimLab.createSim({
    ariaLabel: 'A histogram of grouped data with touching bars, and a frequency polygon joining the mid-points of the bar tops; tap a bar to see its class, class mark and frequency',
    transport: false,
    mobileAspect: '3 / 3.4',
    params: [
      { id: 'data', label: 'Data', type: 'select', value: 'marks', options: [
        { value: 'marks', label: 'Maths test marks (40 students)' },
        { value: 'heights', label: 'Heights of 36 students' },
        { value: 'temps', label: 'Delhi temperatures in May' }] },
      { id: 'size', label: 'Class width', type: 'select', value: 'mid', options: [
        { value: 'wide', label: 'Wide classes (few bars)' },
        { value: 'mid', label: 'Medium classes' },
        { value: 'narrow', label: 'Narrow classes (many bars)' }] },
      { id: 'view', label: 'Show', type: 'select', value: 'both', options: [
        { value: 'hist', label: 'Histogram' },
        { value: 'poly', label: 'Frequency polygon' },
        { value: 'both', label: 'Histogram + polygon' }] },
      { id: 'unequal', label: 'Merge the end classes (unequal widths)', type: 'toggle', value: false },
      { id: 'adjust', label: 'Adjust heights for unequal widths', type: 'toggle', value: true, help: 'Adjusted frequency = (smallest width ÷ class width) × frequency.' }
    ],
    readouts: [
      { id: 'n', label: 'Total frequency', short: 'Total', digits: 0, key: true },
      { id: 'w', label: 'Class width' },
      { id: 'k', label: 'Number of classes', digits: 0 },
      { id: 'modal', label: 'Class with most values', short: 'Modal class', key: true },
      { id: 'sel', label: 'Tapped class', short: 'Tapped', key: true }
    ],
    reset: function () {},
    onParam: function () { sel = -1; return true; },
    readout: function (sim) {
      var C = classes(sim.p), best = C.list[0];
      C.list.forEach(function (c) { if (c.h > best.h) best = c; });
      var s = C.list[sel];
      return {
        n: C.ds.v.length,
        w: C.merged ? nf(C.wmin) + ' to ' + nf(Math.max.apply(null, C.list.map(function (c) { return c.w; }))) + ' ' + C.ds.unit : nf(C.w) + ' ' + C.ds.unit,
        k: C.list.length,
        modal: nf(best.a) + '–' + nf(best.b),
        sel: s ? nf(s.a) + '–' + nf(s.b) + ': ' + s.f : 'tap a bar'
      };
    },
    status: function (sim) { var C = classes(sim.p); return C.list.length + ' classes · ' + C.ds.v.length + ' values'; },
    pointer: {
      down: function (sim, x, y) {
        var i = hit(sim, x, y);
        if (i < 0) return false;
        sel = i === sel ? -1 : i;
        return false;
      },
      hover: function (sim, x, y) { return hit(sim, x, y) >= 0; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, C = classes(p), L = layout(sim, C), W = L.W, H = L.H, P = L.plot;
      var fs = L.narrow ? 10 : 12, showBars = p.view !== 'poly', showPoly = p.view !== 'hist';
      D.clear(ctx, W, H, c.bg);
      if (sel >= C.list.length) sel = -1;

      // y grid + labels
      for (var v = 0; v <= L.ymax + 1e-9; v += L.ystep) {
        var yy = L.Y(v);
        D.line(ctx, P.x, yy, P.x + P.w, yy, c.grid, 1);
        D.text(ctx, String(v), P.x - 6, yy, { color: c.muted, size: fs, align: 'right' });
      }
      ctx.save(); ctx.translate(L.narrow ? 11 : 14, P.y + P.h / 2); ctx.rotate(-Math.PI / 2);
      D.text(ctx, C.merged && p.adjust ? 'Adjusted frequency' : 'Frequency (number of ' + C.ds.who + ')', 0, 0, { color: c.muted, size: fs, align: 'center' });
      ctx.restore();

      // bars
      C.list.forEach(function (cl, i) {
        var xa = L.X(cl.a), xb = L.X(cl.b), yt = L.Y(cl.h), on = i === sel;
        if (showBars) {
          ctx.fillStyle = D.alpha(on ? c.warning : c.s1, on ? 0.55 : (showPoly ? 0.3 : 0.45));
          ctx.fillRect(xa, yt, xb - xa, P.y + P.h - yt);
          ctx.strokeStyle = on ? c.warning : c.s1; ctx.lineWidth = 1.5; ctx.strokeRect(xa + 0.5, yt, xb - xa - 1, P.y + P.h - yt);
          if (xb - xa > 15 && cl.f > 0) D.text(ctx, C.merged && p.adjust && cl.w !== C.wmin ? nf(cl.h) : String(cl.f), (xa + xb) / 2, yt - 9, { color: on ? c.warning : c.ink, size: fs, weight: 700, align: 'center' });
        } else if (on) {
          ctx.fillStyle = D.alpha(c.warning, 0.18); ctx.fillRect(xa, P.y, xb - xa, P.h);
        }
      });
      // misleading-height ghost when merged but not adjusted
      if (C.merged && !p.adjust && showBars) {
        C.list.forEach(function (cl) {
          if (cl.w === C.wmin) return;
          var yt = L.Y(cl.f * C.wmin / cl.w);
          D.line(ctx, L.X(cl.a), yt, L.X(cl.b), yt, c.danger, 2, [5, 4]);
        });
      }

      // frequency polygon
      if (showPoly) {
        var pts = [{ x: L.X(C.ds.start - C.wmin / 2), y: L.Y(0) }];
        C.list.forEach(function (cl) { pts.push({ x: L.X(cl.mid), y: L.Y(cl.h) }); });
        pts.push({ x: L.X(C.ds.end + C.wmin / 2), y: L.Y(0) });
        ctx.save(); ctx.strokeStyle = c.s2; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
        pts.forEach(function (q, i) { if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
        ctx.stroke(); ctx.restore();
        pts.forEach(function (q, i) { D.circle(ctx, q.x, q.y, i === 0 || i === pts.length - 1 ? 3.5 : 4.5, i === sel + 1 ? c.warning : c.s2, c.bg, 1.5); });
      }

      // x axis, class limits, axis break
      var yb = P.y + P.h;
      D.line(ctx, P.x, yb, P.x + P.w, yb, c.axis, 2);
      D.line(ctx, P.x, P.y - 6, P.x, yb, c.axis, 2);
      var edges = [C.list[0].a].concat(C.list.map(function (cl) { return cl.b; }));
      var every = 1, minGap = L.narrow ? 24 : 30;
      while ((L.X(edges[0] + C.wmin * every) - L.X(edges[0])) < minGap && every < 10) every++;
      edges.forEach(function (e, i) {
        var keep = C.merged || Math.round((e - C.ds.start) / C.wmin) % every === 0;
        D.line(ctx, L.X(e), yb, L.X(e), yb + 5, c.axis, 1.5);
        if (keep) D.text(ctx, nf(e), L.X(e), yb + 14, { color: c.muted, size: fs, align: 'center', fit: W });
      });
      if (C.ds.start > 0) {               // the "kink": the axis does not start at 0
        var kx = P.x + Math.min(14, (L.X(C.ds.start) - P.x) / 2 || 10);
        ctx.save(); ctx.strokeStyle = c.axis; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(kx - 6, yb); ctx.lineTo(kx - 3, yb - 5); ctx.lineTo(kx + 1, yb + 5); ctx.lineTo(kx + 4, yb); ctx.stroke(); ctx.restore();
      }
      D.text(ctx, C.ds.axis, P.x + P.w / 2, yb + (L.narrow ? 32 : 36), { color: c.muted, size: fs, align: 'center', fit: W });

      // tapped-class card
      var s = C.list[sel];
      if (s) {
        var info = nf(s.a) + '–' + nf(s.b) + ' · class mark ' + nf(s.mid) + ' · ' + s.f + ' ' + C.ds.who +
          (C.merged && p.adjust && s.w !== C.wmin ? ' → height ' + nf(s.f) + ' × ' + nf(C.wmin) + '/' + nf(s.w) + ' = ' + nf(s.h) : '');
        D.text(ctx, info, (L.X(s.a) + L.X(s.b)) / 2, P.y + 4, { color: c.bg, bg: c.warning, size: fs, weight: 700, align: 'center', pad: 4, fit: L.wide ? W - L.tabW : W });
      } else if (!L.wide) {
        D.text(ctx, 'Tap a bar', P.x + P.w - 4, P.y + 4, { color: c.muted, size: fs, align: 'right' });
      }

      // frequency table with tally marks (wide screens)
      if (L.wide) {
        var tx = W - L.tabW, ty = P.y - 6, rowH = Math.min(24, (P.h + 30) / (C.list.length + 2));
        D.roundRect(ctx, tx, ty, L.tabW - 10, rowH * (C.list.length + 1.6), 8, D.alpha(c.ink, 0.05), c.grid, 1);
        var cx = [tx + 10, tx + (L.tabW - 10) * 0.42, tx + L.tabW - 22];
        D.text(ctx, 'Class', cx[0], ty + rowH * 0.6, { color: c.muted, size: 11, weight: 700 });
        D.text(ctx, 'Tally', cx[1], ty + rowH * 0.6, { color: c.muted, size: 11, weight: 700 });
        D.text(ctx, 'f', cx[2], ty + rowH * 0.6, { color: c.muted, size: 11, weight: 700, align: 'right' });
        C.list.forEach(function (cl, i) {
          var ry = ty + rowH * (i + 1.5), on = i === sel, sz = Math.min(12, rowH * 0.6);
          if (on) D.roundRect(ctx, tx + 3, ry - rowH / 2, L.tabW - 16, rowH, 4, D.alpha(c.warning, 0.2));
          D.text(ctx, nf(cl.a) + '–' + nf(cl.b), cx[0], ry, { color: c.ink, size: sz });
          if (rowH >= 16 && cl.f <= 20) tally(ctx, cl.f, cx[1], ry, on ? c.warning : c.s1);
          else D.text(ctx, '…', cx[1], ry, { color: c.muted, size: sz });
          D.text(ctx, String(cl.f), cx[2], ry, { color: c.ink, size: sz, weight: 700, align: 'right' });
        });
      }

      // headline
      var hl = C.merged ? (L.narrow ? (p.adjust ? 'Unequal widths: heights adjusted' : 'Unequal widths, NOT adjusted')
        : (p.adjust ? 'Unequal classes: heights adjusted so AREA shows frequency' : 'Unequal classes, heights NOT adjusted: wide bars look too big'))
        : (L.narrow ? C.ds.short : C.ds.name);
      D.text(ctx, hl, W / 2, L.narrow ? 14 : 18, { color: c.bg, bg: C.merged && !p.adjust ? c.danger : c.success, size: L.narrow ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: W });
      if (p.unequal && !C.merged) D.text(ctx, 'Pick medium or narrow classes to merge', W / 2, (L.narrow ? 14 : 18) + 20, { color: c.muted, size: fs, align: 'center', fit: W });
    }
  });
})();
