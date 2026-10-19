/* =====================================================================
   Functions & Graphs · Linear Equations in Daily Life — sim.js
   ---------------------------------------------------------------------
   Word problems that turn into a pair of linear equations
   a₁x + b₁y = c₁ and a₂x + b₂y = c₂, solved by graph:
     • each line is drawn through whole-number points from a table of
       values, the way it is done in a notebook
     • a guess point P (drag it, or use the sliders) is checked in both
       equations; when it fits both, it is the answer
   Two stories have no single answer: a bill that cannot be right
   (parallel lines, no solution) and the same fact told twice (the
   same line, infinitely many solutions).
   Only the first quadrant is drawn because prices, ages and speeds
   are positive.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var PROBS = {
    shop: { label: 'Notebooks and pens', story: ['Riya pays ₹110 for 2 notebooks and 3 pens.', 'Arjun pays ₹170 for 4 notebooks and 1 pen. Find each price.'],
      vars: ['x = price of a notebook (₹)', 'y = price of a pen (₹)'], unit: ['₹', '₹'], eqs: [[2, 3, 110], [4, 1, 170]], xmax: 60, ymax: 60,
      answer: 'A notebook costs ₹40 and a pen costs ₹10.' },
    ages: { label: 'Mother and son', story: ['Five years ago a mother was 3 times as old as her son.', 'In ten years she will be twice as old as him. How old are they?'],
      vars: ['x = mother’s age now (years)', 'y = son’s age now (years)'], unit: ['', ''], eqs: [[1, -3, -10], [1, -2, 10]], xmax: 70, ymax: 40,
      from: ['x − 5 = 3(y − 5)', 'x + 10 = 2(y + 10)'], answer: 'The mother is 50 and the son is 20.' },
    boat: { label: 'Boat on the Ganga', story: ['A boat goes 30 km upstream in 3 hours and 44 km downstream', 'in 2 hours. Find its speed in still water and the stream’s speed.'],
      vars: ['x = boat speed in still water (km/h)', 'y = speed of the stream (km/h)'], unit: ['', ''], eqs: [[1, -1, 10], [1, 1, 22]], xmax: 30, ymax: 20,
      from: ['upstream x − y = 30 ÷ 3', 'downstream x + y = 44 ÷ 2'], answer: 'The boat does 16 km/h in still water; the stream flows at 6 km/h.' },
    taxi: { label: 'Auto-rickshaw fare', story: ['A fare is a fixed charge plus a rate per km.', '10 km costs ₹105 and 15 km costs ₹155. Find both.'],
      vars: ['x = fixed charge (₹)', 'y = rate per km (₹)'], unit: ['₹', '₹'], eqs: [[1, 10, 105], [1, 15, 155]], xmax: 40, ymax: 15,
      answer: 'The fixed charge is ₹5 and the rate is ₹10 per km.' },
    garden: { label: 'Rectangular garden', story: ['The fence round a rectangular garden is 36 m long.', 'The length is 4 m more than the width. Find both.'],
      vars: ['x = length (m)', 'y = width (m)'], unit: ['', ''], eqs: [[2, 2, 36], [1, -1, 4]], xmax: 20, ymax: 20,
      answer: 'The garden is 11 m long and 7 m wide.' },
    bad: { label: 'A bill that cannot be right', story: ['2 pencils and 1 eraser cost ₹14.', 'Another day, 4 pencils and 2 erasers cost ₹30. Find each price.'],
      vars: ['x = price of a pencil (₹)', 'y = price of an eraser (₹)'], unit: ['₹', '₹'], eqs: [[2, 1, 14], [4, 2, 30]], xmax: 10, ymax: 20,
      answer: 'No prices fit both bills: the lines are parallel. If the first bill is right, the second should be ₹28.' },
    twice: { label: 'The same fact told twice', story: ['A pen and 2 pencils cost ₹16.', '2 pens and 4 pencils cost ₹32. Find each price.'],
      vars: ['x = price of a pen (₹)', 'y = price of a pencil (₹)'], unit: ['₹', '₹'], eqs: [[1, 2, 16], [2, 4, 32]], xmax: 20, ymax: 10,
      answer: 'Every point on the line works (pen ₹10 and pencil ₹3, or pen ₹6 and pencil ₹5…). One more, different fact is needed.' }
  };
  var st = { P: { x: 0, y: 0 } };

  function prob(sim) { return PROBS[sim.p.prob] || PROBS.shop; }
  function neg(v) { return v < 0 ? '−' + Math.abs(v) : String(v); }
  function eqs(e) {
    var s = (e[0] === 1 ? '' : e[0] === -1 ? '−' : neg(e[0])) + 'x';
    s += (e[1] < 0 ? ' − ' : ' + ') + (Math.abs(e[1]) === 1 ? '' : Math.abs(e[1])) + 'y';
    return s + ' = ' + neg(e[2]);
  }
  function fits(e, P) { return e[0] * P.x + e[1] * P.y === e[2]; }
  function solve(pr) {
    var A = pr.eqs[0], B = pr.eqs[1], det = A[0] * B[1] - B[0] * A[1];
    if (det) return { kind: 'one', x: (A[2] * B[1] - B[2] * A[1]) / det, y: (A[0] * B[2] - B[0] * A[2]) / det };
    return { kind: A[0] * B[2] === B[0] * A[2] && A[1] * B[2] === B[1] * A[2] ? 'same' : 'none' };
  }
  // whole-number points on the line inside the graph, spread out (a table of values)
  function table(e, pr) {
    var pts = [];
    for (var x = 0; x <= pr.xmax; x++) { var y = (e[2] - e[0] * x) / e[1]; if (y % 1 === 0 && y >= 0 && y <= pr.ymax) pts.push({ x: x, y: y }); }
    if (pts.length <= 3) return pts;
    return [pts[0], pts[Math.floor((pts.length - 1) / 2)], pts[pts.length - 1]];
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.1, panel, g;
    if (wide) { var pw = Math.min(440, Math.max(270, W * 0.44)); panel = { x: W - pw - 6, y: 8, w: pw, h: H - 16 }; g = { x: 50, y: 20, w: W - pw - 76, h: H - 62 }; }
    else { var ph = M.clamp(H * 0.4, 128, 200); panel = { x: 6, y: H - ph - 4, w: W - 12, h: ph }; g = { x: 40, y: 16, w: W - 58, h: H - ph - 52 }; }
    return { W: W, H: H, g: g, panel: panel, narrow: W < 560 };
  }
  function toPx(L, pr, x, y) { return { x: L.g.x + x / pr.xmax * L.g.w, y: L.g.y + L.g.h - y / pr.ymax * L.g.h }; }

  // rows wrap onto more lines; the font shrinks a little if they still do not fit
  function textBox(ctx, c, box, rows) {
    var sz = box.w >= 340 ? 14 : 12, lines, lh;
    function font(r, s) { ctx.font = (r.bold ? 700 : 500) + ' ' + s + 'px Inter, system-ui, sans-serif'; }
    for (; sz >= 9.5; sz -= 0.5) {
      lines = [];
      rows.forEach(function (r) {
        font(r, sz); var cur = '';
        r.t.split(' ').forEach(function (wd) {
          var t = cur ? cur + ' ' + wd : wd;
          if (cur && ctx.measureText(t).width > box.w - 8) { lines.push({ r: r, t: cur }); cur = '   ' + wd; } else cur = t;
        });
        lines.push({ r: r, t: cur });
      });
      lh = sz * 1.45;
      if (lines.length * lh <= box.h) break;
    }
    lh = Math.min(lh * 1.15, box.h / lines.length);
    lines.forEach(function (l, i) { D.text(ctx, l.t, box.x + 4, box.y + lh * (i + 0.5), { color: l.r.color || c.ink, size: sz, weight: l.r.bold ? 700 : 500 }); });
  }

  SimLab.createSim({
    ariaLabel: 'A word problem turned into two linear equations and drawn as two lines on a graph. A guess point can be dragged and is checked in both equations; where the lines cross is the answer',
    transport: false,
    mobileAspect: '3 / 4.2',
    params: [
      { id: 'prob', label: 'Problem', type: 'select', value: 'shop', options: Object.keys(PROBS).map(function (k) { return { value: k, label: PROBS[k].label }; }) },
      { id: 'lines', label: 'Draw the two lines', type: 'toggle', value: true },
      { id: 'px', label: 'Guess: x', min: 0, max: 70, step: 1, value: 20, help: 'Or drag the guess point on the graph.' },
      { id: 'py', label: 'Guess: y', min: 0, max: 60, step: 1, value: 20 }
    ],
    readouts: [
      { id: 'guess', label: 'Your guess (x, y)', short: 'Guess', key: true },
      { id: 'e1', label: 'Equation ①' },
      { id: 'e2', label: 'Equation ②' },
      { id: 'res', label: 'Result', key: true }
    ],
    reset: function (sim) { var pr = prob(sim); st.P = { x: Math.min(sim.p.px, pr.xmax), y: Math.min(sim.p.py, pr.ymax) }; },
    onParam: function (sim, id, v) {
      var pr = prob(sim);
      if (id === 'prob') { st.P = { x: Math.round(pr.xmax / 3), y: Math.round(pr.ymax / 3) }; sim.setParam('px', st.P.x); sim.setParam('py', st.P.y); }
      else if (id === 'px') { st.P.x = Math.min(v, pr.xmax); if (v > pr.xmax) sim.setParam('px', pr.xmax); }
      else if (id === 'py') { st.P.y = Math.min(v, pr.ymax); if (v > pr.ymax) sim.setParam('py', pr.ymax); }
      return true;
    },
    readout: function (sim) {
      var pr = prob(sim), P = st.P, f1 = fits(pr.eqs[0], P), f2 = fits(pr.eqs[1], P), so = solve(pr);
      function chk(e) { return neg(e[0] * P.x + e[1] * P.y) + (fits(e, P) ? ' = ' : ' ≠ ') + neg(e[2]) + (fits(e, P) ? ' ✓' : ' ✗'); }
      var res = f1 && f2 ? (so.kind === 'same' ? 'fits both (one of many)' : 'solved!') : so.kind === 'none' ? 'no point fits both' : 'keep looking';
      return { guess: '(' + P.x + ', ' + P.y + ')', e1: chk(pr.eqs[0]), e2: chk(pr.eqs[1]), res: res };
    },
    status: function (sim) { return prob(sim).label; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim);
        if (x < L.g.x - 20 || x > L.g.x + L.g.w + 20 || y < L.g.y - 20 || y > L.g.y + L.g.h + 20) return false;
        this.move(sim, x, y);
      },
      move: function (sim, x, y) {
        var L = layout(sim), pr = prob(sim);
        var P = { x: M.clamp(Math.round((x - L.g.x) / L.g.w * pr.xmax), 0, pr.xmax), y: M.clamp(Math.round((L.g.y + L.g.h - y) / L.g.h * pr.ymax), 0, pr.ymax) };
        // snap to the crossing or a table point when the finger is close
        var so = solve(pr), cand = table(pr.eqs[0], pr).concat(table(pr.eqs[1], pr));
        if (so.kind === 'one') cand.push({ x: so.x, y: so.y });
        cand.forEach(function (q) { if (q.x % 1 || q.y % 1) return; var s = toPx(L, pr, q.x, q.y); if (Math.hypot(s.x - x, s.y - y) < 10) P = { x: q.x, y: q.y }; });
        st.P = P; sim.setParam('px', P.x); sim.setParam('py', P.y);
      },
      hover: function (sim, x, y) { var L = layout(sim), s = toPx(L, prob(sim), st.P.x, st.P.y); return Math.hypot(s.x - x, s.y - y) < 24; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, L = layout(sim), pr = prob(sim), g = L.g, so = solve(pr), cols = [c.s1, c.s2], fs = L.narrow ? 10 : 12;
      D.clear(ctx, L.W, L.H, c.bg);
      // axes and grid
      var sx = D.niceStep(pr.xmax, L.narrow ? 5 : 7), sy = D.niceStep(pr.ymax, L.narrow ? 4 : 6);
      for (var gx = 0; gx <= pr.xmax + 1e-9; gx += sx) {
        var X = toPx(L, pr, gx, 0).x; D.line(ctx, X, g.y, X, g.y + g.h, c.grid, 1);
        D.text(ctx, String(gx), X, g.y + g.h + 11, { color: c.muted, size: 9.5, align: 'center' });
      }
      for (var gy = 0; gy <= pr.ymax + 1e-9; gy += sy) {
        var Y = toPx(L, pr, 0, gy).y; D.line(ctx, g.x, Y, g.x + g.w, Y, c.grid, 1);
        D.text(ctx, String(gy), g.x - 5, Y, { color: c.muted, size: 9.5, align: 'right' });
      }
      D.line(ctx, g.x, g.y + g.h, g.x + g.w + 8, g.y + g.h, c.axis, 1.6);
      D.line(ctx, g.x, g.y + g.h, g.x, g.y - 8, c.axis, 1.6);
      D.text(ctx, pr.vars[0], g.x + g.w, g.y + g.h + 25, { color: c.muted, size: fs, weight: 600, align: 'right', fit: L.panel.y < 20 ? L.panel.x - 4 : L.W });
      D.text(ctx, 'y', g.x - 5, g.y - 10, { color: c.muted, size: 12, weight: 700, align: 'right' });

      if (sim.p.lines) {
        ctx.save(); ctx.beginPath(); ctx.rect(g.x, g.y - 2, g.w + 2, g.h + 4); ctx.clip();
        pr.eqs.forEach(function (e, i) {
          var p1 = toPx(L, pr, 0, e[2] / e[1]), p2 = toPx(L, pr, pr.xmax, (e[2] - e[0] * pr.xmax) / e[1]);
          D.line(ctx, p1.x, p1.y, p2.x, p2.y, cols[i], 3, so.kind === 'same' && i === 1 ? [10, 8] : null);
          table(e, pr).forEach(function (q) { var s = toPx(L, pr, q.x, q.y); D.circle(ctx, s.x, s.y, 3.5, cols[i], c.bg, 1.5); });
        });
        ctx.restore();
        // label each line near its left end (or where it leaves the top)
        pr.eqs.forEach(function (e, i) {
          var x = 0, y = e[2] / e[1];
          if (y > pr.ymax) { y = pr.ymax; x = (e[2] - e[1] * y) / e[0]; }
          if (y < 0) { y = 0; x = e[2] / e[0]; }
          var s = toPx(L, pr, x, y), off = so.kind === 'same' && i === 1 ? 18 : 0;
          D.text(ctx, (i ? '② ' : '① ') + eqs(e), s.x + 8, s.y + (i ? 14 : -12) + off, { color: cols[i], size: fs + 1, weight: 700, bg: D.alpha(c.bg, 0.85), pad: 2, fit: L.panel.y < 20 ? L.panel.x - 4 : L.W });
        });
      }
      // guess point
      var P = st.P, sp = toPx(L, pr, P.x, P.y), f1 = fits(pr.eqs[0], P), f2 = fits(pr.eqs[1], P), both = f1 && f2;
      var pc = both ? c.success : f1 || f2 ? c.warning : c.ink;
      D.line(ctx, sp.x, sp.y, sp.x, g.y + g.h, D.alpha(pc, 0.5), 1, [3, 3]);
      D.line(ctx, g.x, sp.y, sp.x, sp.y, D.alpha(pc, 0.5), 1, [3, 3]);
      if (both) D.circle(ctx, sp.x, sp.y, 15, D.alpha(c.success, 0.25));
      D.circle(ctx, sp.x, sp.y, 7, D.alpha(pc, 0.35), pc, 2.5);
      var right = sp.x > g.x + g.w * 0.7;
      D.text(ctx, '(' + P.x + ', ' + P.y + ')', sp.x + (right ? -12 : 12), sp.y - 14, { color: pc, size: fs + 1, weight: 800, align: right ? 'right' : 'left', bg: D.alpha(c.bg, 0.85), pad: 2 });

      // story and working
      var pn = L.panel, rows = [];
      pr.story.forEach(function (t) { rows.push({ t: t, color: c.ink }); });
      rows.push({ t: pr.vars[0] + ';  ' + pr.vars[1], color: c.muted });
      if (pr.from) rows.push({ t: 'From the story: ' + pr.from[0] + ' and ' + pr.from[1], color: c.muted });
      rows.push({ t: '① ' + eqs(pr.eqs[0]) + '     ② ' + eqs(pr.eqs[1]), bold: true, color: c.ink });
      function chk(e) { var v = e[0] * P.x + e[1] * P.y; return neg(v) + (v === e[2] ? ' ✓' : ' ≠ ' + neg(e[2]) + ' ✗'); }
      rows.push({ t: 'Guess (' + P.x + ', ' + P.y + '):  ① gives ' + chk(pr.eqs[0]) + '   ② gives ' + chk(pr.eqs[1]), color: both ? c.success : c.ink });
      if (both || so.kind === 'none') rows.push({ t: pr.answer, bold: true, color: so.kind === 'none' ? c.warning : c.success });
      else rows.push({ t: f1 || f2 ? 'On one line only. Slide along it towards the other line.' : 'Fits neither. Where do the lines cross?', color: c.faint });
      D.roundRect(ctx, pn.x, pn.y, pn.w, pn.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.12));
      textBox(ctx, c, { x: pn.x + 6, y: pn.y + 4, w: pn.w - 12, h: pn.h - 8 }, rows);
    }
  });
})();
