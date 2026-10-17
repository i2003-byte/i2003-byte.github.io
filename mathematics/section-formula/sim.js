/* =====================================================================
   Coordinate geometry · Section Formula — sim.js
   ---------------------------------------------------------------------
   A and B (and C for the centroid) have whole-number coordinates on a
   −8…8 grid; drag them, tap the grid, or use "Move point" + sliders.
     ratio     — P divides AB internally in m : n. AB is cut into m + n
                 equal steps; the steps also show on both axes, because
                 x and y are divided in the same ratio (similar right
                 triangles A→P and P→B).
                 P = ((m·x₂ + n·x₁)/(m + n), (m·y₂ + n·y₁)/(m + n))
     mid       — m = n = 1: M = ((x₁ + x₂)/2, (y₁ + y₂)/2)
     trisect   — the two points that cut AB into three equal parts
                 (ratios 1 : 2 and 2 : 1)
     centroid  — triangle ABC, its three medians and G, the average of
                 the corners, which cuts every median 2 : 1.
   Coordinates are shown as exact fractions. Model y points up.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var R = 8, NAMES = ['A', 'B', 'C'];
  var st = { pts: [{ x: -6, y: -3 }, { x: 6, y: 5 }, { x: 6, y: -5 }], init: false };

  function n() { return 3; }
  function sel(sim) { return NAMES.indexOf(sim.p.pt); }
  function syncSliders(sim) { var i = sel(sim); sim.setParam('x', st.pts[i].x); sim.setParam('y', st.pts[i].y); }
  function neg(v) { return v < 0 ? '−' + Math.abs(v) : String(v); }
  function par(v) { return v < 0 ? '(' + neg(v) + ')' : String(v); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  // exact fraction num/den (den > 0) as text: 3, −7/2
  function frac(num, den) { var g = gcd(num, den); num /= g; den /= g; return den === 1 ? neg(num) : (num < 0 ? '−' : '') + Math.abs(num) + '/' + den; }
  function fracApprox(num, den) { var f = frac(num, den); return /\//.test(f) ? f + ' ≈ ' + neg(+M.fmt(num / den, 2)) : f; }
  function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
  function mode(sim) { return sim.p.mode; }
  function ratio(sim) { return mode(sim) === 'mid' ? [1, 1] : [sim.p.m, sim.p.n]; }
  function divide(A, B, m, k) { return { x: (m * B.x + k * A.x) / (m + k), y: (m * B.y + k * A.y) / (m + k), nx: m * B.x + k * A.x, ny: m * B.y + k * A.y, d: m + k }; }
  function label(q) { return '(' + frac(q.nx, q.d) + ', ' + frac(q.ny, q.d) + ')'; }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.2, tall = !wide && H > W * 1.15;
    var ax = 6, ay = 6, aw = W - 12, ah = H - 12, panel;
    if (wide) { var pw = Math.min(400, Math.max(250, W * 0.4)); aw = W - pw - 18; panel = { x: W - pw - 6, y: 10, w: pw, h: H - 20 }; }
    else if (tall) { var ph = Math.min(150, H * 0.3); ah = H - ph - 12; panel = { x: 8, y: H - ph - 4, w: W - 16, h: ph }; }
    else { ay = 44; ah = H - 50; panel = { x: 8, y: 6, w: W - 16, h: 34, strip: true }; }
    var u = Math.min(aw, ah) / (2 * R + 1.4);
    return { W: W, H: H, u: u, ox: ax + aw / 2, oy: ay + ah / 2, panel: panel, narrow: W < 560 };
  }
  function toPx(L, q) { return { x: L.ox + q.x * L.u, y: L.oy - q.y * L.u }; }

  function plane(ctx, c, L) {
    var u = L.u, x0 = L.ox - R * u, y0 = L.oy - R * u, sz = 2 * R * u;
    D.roundRect(ctx, x0 - u * 0.5, y0 - u * 0.5, sz + u, sz + u, 8, D.alpha(c.ink, 0.03));
    D.grid(ctx, x0, y0, sz, sz, u, c.grid);
    D.arrow(ctx, x0 - u * 0.4, L.oy, x0 + sz + u * 0.55, L.oy, c.axis, 1.6, 7);
    D.arrow(ctx, L.ox, y0 + sz + u * 0.4, L.ox, y0 - u * 0.55, c.axis, 1.6, 7);
    var every = u < 22 ? 2 : 1, fs = Math.max(9, Math.min(11, u * 0.5));
    for (var k = -R; k <= R; k++) {
      if (k === 0 || k % every) continue;
      D.text(ctx, neg(k), L.ox + k * u, L.oy + fs * 0.9, { color: c.muted, size: fs, align: 'center' });
      D.text(ctx, neg(k), L.ox - 4, L.oy - k * u, { color: c.muted, size: fs, align: 'right' });
    }
    D.text(ctx, 'x', x0 + sz + u * 0.45, L.oy - 10, { color: c.muted, size: 12, weight: 700, align: 'center' });
    D.text(ctx, 'y', L.ox + 10, y0 - u * 0.45, { color: c.muted, size: 12, weight: 700, align: 'center' });
    D.text(ctx, 'O', L.ox - 4, L.oy + fs * 0.9, { color: c.muted, size: fs, align: 'right' });
  }
  function pointsDraw(ctx, c, L, cols, selI) {
    var P = st.pts, cx = 0, cy = 0;
    P.forEach(function (q) { cx += q.x / P.length; cy += q.y / P.length; });
    P.forEach(function (q, i) {
      var s = toPx(L, q), dx = q.x - cx, dy = q.y - cy, dl = Math.hypot(dx, dy) || 1;
      if (i === selI) D.circle(ctx, s.x, s.y, 13, D.alpha(cols[i], 0.22));
      D.circle(ctx, s.x, s.y, 6.5, cols[i], c.bg, 2);
      var lx = s.x + dx / dl * 22, ly = s.y - dy / dl * 18;
      D.text(ctx, NAMES[i] + '(' + neg(q.x) + ', ' + neg(q.y) + ')', lx, ly, { color: cols[i], size: L.narrow ? 11 : 13, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: L.W });
    });
  }
  // rows of text: long rows shrink a little, then wrap onto the next line
  function textLines(ctx, c, box, rows) {
    var big = box.w >= 340, lh = big ? 25 : Math.min(22, Math.max(14, box.h / rows.length)), y = box.y + lh / 2;
    var font = function (r, sz) { ctx.font = (r.bold ? 700 : 500) + ' ' + sz + 'px Inter, system-ui, sans-serif'; };
    rows.forEach(function (r) {
      var sz = r.size ? r.size + (big ? 1 : 0) : (big ? 15 : 12), min = box.h > 60 ? Math.max(10.5, sz - 2.5) : 9;
      font(r, sz);
      while (sz > min && ctx.measureText(r.t).width > box.w - 8) { sz -= 0.5; font(r, sz); }
      var lines = [r.t];
      if (ctx.measureText(r.t).width > box.w - 8) {
        lines = []; var cur = '';
        r.t.split(' ').forEach(function (wd) {
          var tryS = cur ? cur + ' ' + wd : wd;
          if (cur && ctx.measureText(tryS).width > box.w - 8) { lines.push(cur); cur = wd; } else cur = tryS;
        });
        lines.push(cur);
      }
      lines.forEach(function (t, k) {
        D.text(ctx, (k ? '   ' : '') + t, box.x + 4, y, { color: r.color || c.ink, size: sz, weight: r.bold ? 700 : 500 });
        y += lh * (k < lines.length - 1 ? 0.85 : (r.gap || 1));
      });
    });
  }


  function bigPoint(ctx, c, L, q, name, color, side) {
    var s = toPx(L, q);
    D.circle(ctx, s.x, s.y, 8, color, c.bg, 2.5);
    D.text(ctx, name + label(q), s.x + (side || 1) * 12, s.y - 16, { color: color, size: L.narrow ? 12 : 14, weight: 700, align: side < 0 ? 'right' : 'left', bg: D.alpha(c.bg, 0.85), pad: 3, fit: L.W });
  }
  // the m + n equal steps along a pixel segment, first m in colA
  function steps(ctx, a, b, m, k, colA, colB, w, tick) {
    var tot = m + k;
    for (var i = 0; i < tot; i++) {
      var t0 = i / tot, t1 = (i + 1) / tot;
      D.line(ctx, M.lerp(a.x, b.x, t0), M.lerp(a.y, b.y, t0), M.lerp(a.x, b.x, t1), M.lerp(a.y, b.y, t1), i < m ? colA : colB, w);
    }
    var nx = -(b.y - a.y), ny = b.x - a.x, nl = Math.hypot(nx, ny) || 1;
    for (var j = 1; j < tot; j++) {
      var tx = M.lerp(a.x, b.x, j / tot), ty = M.lerp(a.y, b.y, j / tot);
      D.line(ctx, tx - nx / nl * 5, ty - ny / nl * 5, tx + nx / nl * 5, ty + ny / nl * 5, j === m ? colA : tick, 2);
    }
  }

  SimLab.createSim({
    ariaLabel: 'A coordinate grid with points A and B. A point P divides the segment AB in the ratio m to n; the equal parts are marked on the segment and on both axes. Other views show the midpoint, the two trisection points and the centroid of a triangle',
    transport: false,
    mobileAspect: '3 / 3.9',
    params: [
      { id: 'mode', label: 'Show', type: 'select', value: 'ratio', options: [
        { value: 'ratio', label: 'P divides AB in m : n' },
        { value: 'mid', label: 'Midpoint of AB' },
        { value: 'trisect', label: 'Points of trisection' },
        { value: 'centroid', label: 'Centroid of triangle ABC' }] },
      { id: 'm', label: 'm (A side)', min: 1, max: 9, step: 1, value: 3, help: 'P is m parts from A and n parts from B.' },
      { id: 'n', label: 'n (B side)', min: 1, max: 9, step: 1, value: 1 },
      { id: 'pt', label: 'Move point', type: 'select', value: 'A', options: NAMES.map(function (k) { return { value: k, label: k }; }), help: 'Or drag a point, or tap the grid. C is used for the centroid.' },
      { id: 'x', label: 'x', min: -R, max: R, step: 1, value: -6 },
      { id: 'y', label: 'y', min: -R, max: R, step: 1, value: -3 }
    ],
    readouts: [
      { id: 'P', label: 'Point found', short: 'Point', key: true },
      { id: 'ratio', label: 'Ratio m : n' },
      { id: 'ap', label: 'AP (or AG)', unit: 'units', digits: 2 },
      { id: 'pb', label: 'PB (or GD)', unit: 'units', digits: 2 },
      { id: 'check', label: 'Check: AP ÷ PB', short: 'AP ÷ PB', key: true }
    ],
    reset: function (sim) {
      if (!st.init) { st.init = true; if (/[?&][xy]=/.test(location.search)) st.pts[sel(sim)] = { x: sim.p.x, y: sim.p.y }; else syncSliders(sim); }
      else syncSliders(sim);
    },
    onParam: function (sim, id, v) {
      if (id === 'pt') syncSliders(sim);
      else if (id === 'x' || id === 'y') st.pts[sel(sim)][id] = v;
      else if (id === 'mode' && v !== 'centroid' && sim.p.pt === 'C') { sim.setParam('pt', 'A'); syncSliders(sim); }
      return true;
    },
    readout: function (sim) {
      var P = st.pts, A = P[0], B = P[1], md = mode(sim);
      if (md === 'centroid') {
        var G = { x: (A.x + B.x + P[2].x) / 3, y: (A.y + B.y + P[2].y) / 3, nx: A.x + B.x + P[2].x, ny: A.y + B.y + P[2].y, d: 3 };
        var Dm = { x: (B.x + P[2].x) / 2, y: (B.y + P[2].y) / 2 }, ag = dist(A, G), gd = dist(G, Dm);
        return { P: 'G' + label(G), ratio: 'AG : GD = 2 : 1', ap: ag, pb: gd, check: gd > 1e-9 ? M.fmt(ag / gd, 2) : '—' };
      }
      if (md === 'trisect') {
        var T1 = divide(A, B, 1, 2), T2 = divide(A, B, 2, 1);
        return { P: 'P' + label(T1) + ', Q' + label(T2), ratio: '1 : 2 and 2 : 1', ap: dist(A, T1), pb: dist(T1, B), check: dist(T1, B) > 1e-9 ? M.fmt(dist(A, T1) / dist(T1, B), 2) : '—' };
      }
      var r = ratio(sim), Q = divide(A, B, r[0], r[1]), ap = dist(A, Q), pb = dist(Q, B);
      return { P: (md === 'mid' ? 'M' : 'P') + label(Q), ratio: r[0] + ' : ' + r[1], ap: ap, pb: pb, check: pb > 1e-9 ? M.fmt(ap / pb, 2) : '—' };
    },
    
    status: function (sim) {
      var md = mode(sim), P = st.pts;
      return md === 'centroid' ? 'Centroid of ABC' : md === 'trisect' ? 'Points of trisection' : md === 'mid' ? 'Midpoint of AB' : 'P divides AB in ' + sim.p.m + ' : ' + sim.p.n;
    },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim), best = -1, bd = 26, nP = mode(sim) === 'centroid' ? 3 : 2;
        for (var i = 0; i < nP; i++) { var s = toPx(L, st.pts[i]), dd = Math.hypot(s.x - x, s.y - y); if (dd < bd) { bd = dd; best = i; } }
        var gx = (x - L.ox) / L.u, gy = (L.oy - y) / L.u;
        if (best < 0 && (Math.abs(gx) > R + 0.6 || Math.abs(gy) > R + 0.6)) return false;
        if (best >= 0) sim.setParam('pt', NAMES[best]);
        else if (sel(sim) >= nP) sim.setParam('pt', 'A');
        this.move(sim, x, y);
      },
      move: function (sim, x, y) {
        var L = layout(sim), i = sel(sim);
        var q = { x: M.clamp(Math.round((x - L.ox) / L.u), -R, R), y: M.clamp(Math.round((L.oy - y) / L.u), -R, R) };
        st.pts[i] = q; sim.setParam('x', q.x); sim.setParam('y', q.y);
      },
      hover: function (sim, x, y) {
        var L = layout(sim);
        return st.pts.some(function (q) { var s = toPx(L, q); return Math.hypot(s.x - x, s.y - y) < 26; });
      }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, L = layout(sim), P = st.pts, md = mode(sim), fs = L.narrow ? 11 : 13;
      var A = P[0], B = P[1], SA = toPx(L, A), SB = toPx(L, B), cA = c.s1, cB = c.s2, rows = [], strip = '';
      D.clear(ctx, L.W, L.H, c.bg);
      plane(ctx, c, L);
      var full = P.slice(0, md === 'centroid' ? 3 : 2), keep = st.pts;
      st.pts = full;

      if (md === 'centroid') {
        var C = P[2], SC = toPx(L, C);
        ctx.beginPath(); ctx.moveTo(SA.x, SA.y); ctx.lineTo(SB.x, SB.y); ctx.lineTo(SC.x, SC.y); ctx.closePath();
        ctx.fillStyle = D.alpha(c.accent, 0.08); ctx.fill(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2.5; ctx.stroke();
        var G = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3, nx: A.x + B.x + C.x, ny: A.y + B.y + C.y, d: 3 }, SG = toPx(L, G);
        [[A, B, C], [B, C, A], [C, A, B]].forEach(function (t, k) {
          var mid = { x: (t[1].x + t[2].x) / 2, y: (t[1].y + t[2].y) / 2 }, Sm = toPx(L, mid), S0 = toPx(L, t[0]);
          // 2 parts vertex → G, 1 part G → midpoint
          D.line(ctx, S0.x, S0.y, SG.x, SG.y, k === 0 ? c.warning : D.alpha(c.warning, 0.55), k === 0 ? 3 : 2, [8, 5]);
          D.line(ctx, SG.x, SG.y, Sm.x, Sm.y, k === 0 ? c.success : D.alpha(c.success, 0.55), k === 0 ? 3 : 2, [8, 5]);
          D.circle(ctx, Sm.x, Sm.y, 4.5, c.bg, c.muted, 2);
          if (k === 0) D.text(ctx, 'D (midpoint of BC)', Sm.x + 8, Sm.y + 14, { color: c.muted, size: fs - 1, weight: 600, fit: L.W });
        });
        pointsDraw(ctx, c, L, [cA, cB, c.s3], sel(sim));
        D.circle(ctx, SG.x, SG.y, 8, c.warning, c.bg, 2.5);
        D.text(ctx, 'G' + label(G), SG.x + 12, SG.y + 16, { color: c.warning, size: fs + 1, weight: 700, bg: D.alpha(c.bg, 0.85), pad: 3, fit: L.W });
        rows = [
          { t: 'Centroid: where the 3 medians meet', bold: true, color: c.accent },
          { t: 'G = ((x₁ + x₂ + x₃)/3, (y₁ + y₂ + y₃)/3)', bold: true },
          { t: 'x = (' + neg(A.x) + ' + ' + par(B.x) + ' + ' + par(C.x) + ')/3 = ' + fracApprox(G.nx, 3) },
          { t: 'y = (' + neg(A.y) + ' + ' + par(B.y) + ' + ' + par(C.y) + ')/3 = ' + fracApprox(G.ny, 3) },
          { t: 'G cuts each median 2 : 1 (vertex side longer)', color: c.success },
          { t: 'Orange = 2 parts, green = 1 part', color: c.muted, size: 12 }
        ];
        strip = 'G = average of the corners = ' + label(G) + ' · AG : GD = 2 : 1';
      } else {
        var trs = md === 'trisect', r = trs ? [1, 2] : ratio(sim), Q = divide(A, B, r[0], r[1]), SQ = toPx(L, Q), tot = r[0] + r[1];
        // projections: same m : n split on both axes
        var ax = L.oy + L.u * 0.0, ay = L.ox;
        if (A.x !== B.x) { steps(ctx, { x: SA.x, y: ax }, { x: SB.x, y: ax }, trs ? 1 : r[0], trs ? 2 : r[1], D.alpha(cA, 0.7), D.alpha(cB, 0.7), 6, c.muted); }
        if (A.y !== B.y) { steps(ctx, { x: ay, y: SA.y }, { x: ay, y: SB.y }, trs ? 1 : r[0], trs ? 2 : r[1], D.alpha(cA, 0.7), D.alpha(cB, 0.7), 6, c.muted); }
        // similar right triangles A → P and P → B
        if (A.x !== B.x && A.y !== B.y) {
          D.line(ctx, SA.x, SA.y, SQ.x, SA.y, D.alpha(cA, 0.8), 1.5, [4, 4]); D.line(ctx, SQ.x, SA.y, SQ.x, SQ.y, D.alpha(cA, 0.8), 1.5, [4, 4]);
          D.line(ctx, SQ.x, SQ.y, SB.x, SQ.y, D.alpha(cB, 0.8), 1.5, [4, 4]); D.line(ctx, SB.x, SQ.y, SB.x, SB.y, D.alpha(cB, 0.8), 1.5, [4, 4]);
        }
        // guide lines from the points to the axes
        [SA, SB, SQ].forEach(function (s, k) {
          var col = k === 2 ? c.warning : k ? cB : cA;
          D.line(ctx, s.x, s.y, s.x, L.oy, D.alpha(col, 0.45), 1, [2, 4]); D.line(ctx, s.x, s.y, L.ox, s.y, D.alpha(col, 0.45), 1, [2, 4]);
        });
        if (trs) steps(ctx, SA, SB, 1, 2, c.ink, c.ink, 3.5, c.ink); else steps(ctx, SA, SB, r[0], r[1], cA, cB, 4, c.muted);
        pointsDraw(ctx, c, L, [cA, cB], sel(sim));
        var left = SQ.x > L.ox + L.u * 3;
        if (trs) {
          var Q2 = divide(A, B, 2, 1);
          bigPoint(ctx, c, L, Q, 'P', c.warning, left ? -1 : 1); bigPoint(ctx, c, L, Q2, 'Q', c.success, toPx(L, Q2).x > L.ox + L.u * 3 ? -1 : 1);
          rows = [
            { t: 'Points of trisection: 3 equal parts', bold: true, color: c.accent },
            { t: 'P: ratio 1 : 2 → P' + label(Q), bold: true, color: c.warning },
            { t: 'x = (1·' + par(B.x) + ' + 2·' + par(A.x) + ')/3 = ' + fracApprox(Q.nx, 3) },
            { t: 'Q: ratio 2 : 1 → Q' + label(Q2), bold: true, color: c.success },
            { t: 'x = (2·' + par(B.x) + ' + 1·' + par(A.x) + ')/3 = ' + fracApprox(Q2.nx, 3) },
            { t: 'Q is also the midpoint of PB.', color: c.muted, size: 12 }
          ];
          strip = 'P' + label(Q) + ' (1 : 2) and Q' + label(Q2) + ' (2 : 1)';
        } else {
          var nm = md === 'mid' ? 'M' : 'P';
          bigPoint(ctx, c, L, Q, nm, c.warning, left ? -1 : 1);
          if (tot <= 18) {
            var nx = -(SB.y - SA.y), ny = SB.x - SA.x, nl = Math.hypot(nx, ny) || 1, s1 = r[0] / tot / 2, s2 = r[0] / tot + r[1] / tot / 2;
            if (ny < 0) { nx = -nx; ny = -ny; }
            D.text(ctx, r[0] + (r[0] > 1 ? ' parts' : ' part'), M.lerp(SA.x, SB.x, s1) - nx / nl * 18, M.lerp(SA.y, SB.y, s1) - ny / nl * 18, { color: cA, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: L.W });
            D.text(ctx, r[1] + (r[1] > 1 ? ' parts' : ' part'), M.lerp(SA.x, SB.x, s2) - nx / nl * 18, M.lerp(SA.y, SB.y, s2) - ny / nl * 18, { color: cB, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: L.W });
          }
          rows = md === 'mid' ? [
            { t: 'Midpoint formula (ratio 1 : 1)', bold: true, color: c.accent },
            { t: 'M = ((x₁ + x₂)/2, (y₁ + y₂)/2)', bold: true },
            { t: 'x = (' + neg(A.x) + ' + ' + par(B.x) + ')/2 = ' + fracApprox(Q.nx, 2) },
            { t: 'y = (' + neg(A.y) + ' + ' + par(B.y) + ')/2 = ' + fracApprox(Q.ny, 2) },
            { t: 'AM = MB = ' + M.fmt(dist(A, Q), 2) + ' units', color: c.success, bold: true }
          ] : [
            { t: 'Section formula, ratio m : n = ' + r[0] + ' : ' + r[1], bold: true, color: c.accent },
            { t: 'P = ((m·x₂ + n·x₁)/(m + n), (m·y₂ + n·y₁)/(m + n))', bold: true },
            { t: 'x = (' + r[0] + '·' + par(B.x) + ' + ' + r[1] + '·' + par(A.x) + ')/' + tot + ' = ' + fracApprox(Q.nx, tot) },
            { t: 'y = (' + r[0] + '·' + par(B.y) + ' + ' + r[1] + '·' + par(A.y) + ')/' + tot + ' = ' + fracApprox(Q.ny, tot) },
            { t: 'AP = ' + M.fmt(dist(A, Q), 2) + ', PB = ' + M.fmt(dist(Q, B), 2) + ' → AP ÷ PB = ' + (dist(Q, B) > 1e-9 ? M.fmt(dist(A, Q) / dist(Q, B), 2) : '—'), color: c.success, bold: true },
            { t: 'The axes are split ' + r[0] + ' : ' + r[1] + ' too (coloured bars).', color: c.muted, size: 12 }
          ];
          strip = md === 'mid' ? 'M = ((x₁ + x₂)/2, (y₁ + y₂)/2) = ' + label(Q)
            : 'P = ((' + r[0] + 'x₂ + ' + r[1] + 'x₁)/' + tot + ', (' + r[0] + 'y₂ + ' + r[1] + 'y₁)/' + tot + ') = ' + label(Q);
        }
      }
      st.pts = keep;

      var pn = L.panel;
      if (pn.strip) rows = [{ t: strip, bold: true, color: c.ink }];
      else D.roundRect(ctx, pn.x, pn.y, pn.w, pn.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.12));
      textLines(ctx, c, { x: pn.x + 6, y: pn.y + 4, w: pn.w - 12, h: pn.h - 8 }, rows);
    }
  });
})();
