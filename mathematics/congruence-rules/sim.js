/* =====================================================================
   Triangles · Congruence Rules — sim.js
   ---------------------------------------------------------------------
   Build triangle ABC from three given parts with ruler-and-compass
   steps, and count how many different triangles fit them.
   Sides: a = BC, b = CA, c = AB. Base AB lies along the x-axis from
   A(0, 0) to B(c, 0); C is found above it.
     SSS  arcs from A (radius b) and B (radius a) meet once above AB:
          x = (b² − a² + c²) / 2c, y = √(b² − x²)
     SAS  ray from A at ∠A, mark AC = b on it
     ASA  rays from A at ∠A and from B at 180° − ∠B meet once
          (AC = c·sin B / sin(A + B)); none if ∠A + ∠B ≥ 180°
     RHS  right angle at A: the arc from B (radius = hypotenuse a)
          meets the upright ray at AC = √(a² − c²)
     SSA  ray from A at ∠A, arc from B (radius a). Along the ray
          t² − 2tc·cos A + c² − a² = 0 → t = c·cos A ± √(a² − c²sin²A):
          0, 1 or 2 triangles (the "ambiguous case")
     AAA  the angles fix the shape but not the size
   "A friend's copy" builds a triangle from the same parts (the other
   one if there are two), turned and maybe flipped over, then slides it
   onto yours: it fits exactly only if the triangles are congruent.
   Model units are cm with y pointing up.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var DUR = 2400, test = { on: false, t0: 0 };
  var NAMES = { SSS: 'SSS', SAS: 'SAS', ASA: 'ASA', RHS: 'RHS', SSA: 'SSA', AAA: 'AAA' };
  var POSE = { SSS: [150, true], SAS: [-120, false], ASA: [200, true], RHS: [95, true], SSA: [-150, false], AAA: [170, false] };
  var GIVEN = {
    SSS: { s: ['a', 'b', 'c'], g: [] }, SAS: { s: ['b', 'c'], g: ['A'] }, ASA: { s: ['c'], g: ['A', 'B'] },
    RHS: { s: ['a', 'c'], g: ['A'] }, SSA: { s: ['a', 'c'], g: ['A'] }, AAA: { s: [], g: ['A', 'B', 'C'] }
  };

  function P(x, y) { return { x: x, y: y }; }
  function f1(v) { return String(parseFloat(v.toFixed(1))); }
  function ease(u) { u = M.clamp(u, 0, 1); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function dist(p, q) { return Math.hypot(p.x - q.x, p.y - q.y); }
  function angAt(P0, P1, P2) {
    var u = { x: P1.x - P0.x, y: P1.y - P0.y }, v = { x: P2.x - P0.x, y: P2.y - P0.y };
    return M.deg(Math.acos(M.clamp((u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y)), -1, 1)));
  }
  function parts(t) {
    return { a: dist(t.B, t.C), b: dist(t.C, t.A), c: dist(t.A, t.B), A: angAt(t.A, t.B, t.C), B: angAt(t.B, t.C, t.A), C: angAt(t.C, t.A, t.B) };
  }
  function rule(p) { return GIVEN[p.rule] ? p.rule : 'SSS'; }

  function solve(p) {
    var r = rule(p), a = p.a, b = p.b, c = p.c, A = M.rad(p.A), B = M.rad(p.B);
    var o = { sols: [], rays: [], arcs: [], extra: [], why: '' }, A0 = P(0, 0), B0 = P(c, 0);
    function add(C, base) { var bb = base || B0; o.sols.push({ A: A0, B: bb, C: C }); }
    if (r === 'SSS') {
      o.arcs.push({ c: A0, r: b }, { c: B0, r: a });
      var x = (b * b - a * a + c * c) / (2 * c), y2 = b * b - x * x;
      if (y2 > 1e-3) add(P(x, Math.sqrt(y2)));
      else {
        var s = [['a', a], ['b', b], ['c', c]].sort(function (u, v) { return v[1] - u[1]; });
        o.why = 'The two shorter sides (' + f1(s[1][1]) + ' + ' + f1(s[2][1]) + ' = ' + f1(s[1][1] + s[2][1]) + ' cm) cannot reach across the longest (' + f1(s[0][1]) + ' cm)';
        o.extra.push(P(0, b), P(c, a), P(-Math.min(b, 3), 0), P(c + Math.min(a, 3), 0));
      }
    } else if (r === 'SAS') {
      o.rays.push({ c: A0, ang: A }); o.arcs.push({ c: A0, r: b });
      add(P(b * Math.cos(A), b * Math.sin(A)));
    } else if (r === 'ASA') {
      o.rays.push({ c: A0, ang: A }, { c: B0, ang: Math.PI - B });
      if (p.A + p.B < 179.5) { var ac = c * Math.sin(B) / Math.sin(A + B); add(P(ac * Math.cos(A), ac * Math.sin(A))); }
      else {
        o.why = '∠A + ∠B = ' + (p.A + p.B) + '°: the two rays never meet (they must add up to less than 180°)';
        o.extra.push(P(c * 0.6 * Math.cos(A), c * 0.6 * Math.sin(A)), P(c - c * 0.6 * Math.cos(B), c * 0.6 * Math.sin(B)));
      }
    } else if (r === 'RHS') {
      o.rays.push({ c: A0, ang: Math.PI / 2 }); o.arcs.push({ c: B0, r: a });
      if (a > c + 1e-3) add(P(0, Math.sqrt(a * a - c * c)));
      else { o.why = 'The hypotenuse BC (' + f1(a) + ' cm) must be longer than AB (' + f1(c) + ' cm)'; o.extra.push(P(0, c * 0.7), P(c, a), P(c - a, 0)); }
    } else if (r === 'SSA') {
      o.rays.push({ c: A0, ang: A }); o.arcs.push({ c: B0, r: a });
      var disc = a * a - c * c * Math.sin(A) * Math.sin(A), ts = [];
      if (disc >= -1e-6) {
        var sq = Math.sqrt(Math.max(0, disc)), t1 = c * Math.cos(A) + sq, t2 = c * Math.cos(A) - sq;
        if (t1 > 1e-2) ts.push(t1);
        if (t2 > 1e-2 && t1 - t2 > 0.05) ts.push(t2);
      }
      ts.forEach(function (t) { add(P(t * Math.cos(A), t * Math.sin(A))); });
      if (!ts.length) {
        o.why = 'BC = ' + f1(a) + ' cm is too short to reach the ray: it needs at least ' + f1(c * Math.sin(A)) + ' cm';
        o.extra.push(P(c * Math.cos(A), c * Math.sin(A)), P(c, a), P(c - a, 0));
      }
    } else {                                   // AAA: three sizes of the same shape
      if (p.A + p.B < 179.5) {
        [6, 3.6, 8.6].forEach(function (cc) {
          var ac2 = cc * Math.sin(B) / Math.sin(A + B);
          add(P(ac2 * Math.cos(A), ac2 * Math.sin(A)), P(cc, 0));
        });
      } else o.why = '∠A + ∠B = ' + (p.A + p.B) + '°: nothing is left for ∠C';
    }
    return o;
  }
  function friendIndex(p, o) { return o.sols.length > 1 ? 1 : 0; }

  function layout(sim, o) {
    var W = sim.width, H = sim.height, p = sim.p, narrow = W < 560, top = narrow ? 40 : 48, wide = W > H * 1.2;
    var main = { x: 8, y: top, w: W - 16, h: H - top - (narrow ? 26 : 30) }, zone = null;
    if (test.on && o.sols.length) {
      if (wide) { main.w = W * 0.62 - 12; zone = { x: W * 0.62, y: top, w: W * 0.38 - 8, h: main.h }; }
      else { var mh = main.h; main.h = mh * 0.62; zone = { x: 8, y: top + mh * 0.62, w: W - 16, h: mh * 0.38 }; }
    }
    var pts = [P(0, 0), P(p.c, 0)].concat(o.extra);
    if (rule(p) === 'AAA') pts = [P(0, 0)];
    o.sols.forEach(function (t) { pts.push(t.B, t.C); });
    var minX = Infinity, maxX = -Infinity, minY = 0, maxY = 0.5;
    pts.forEach(function (q) { minX = Math.min(minX, q.x); maxX = Math.max(maxX, q.x); minY = Math.min(minY, q.y); maxY = Math.max(maxY, q.y); });
    var bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
    var sc = Math.min((main.w - 56) / bw, (main.h - 46) / bh, narrow ? 46 : 60);
    var fr = null;
    if (zone) {
      var ft = o.sols[friendIndex(p, o)], pose = POSE[rule(p)], g = P((ft.A.x + ft.B.x + ft.C.x) / 3, (ft.A.y + ft.B.y + ft.C.y) / 3);
      var th = M.rad(pose[0]), rv = [ft.A, ft.B, ft.C].map(function (v) {
        var x = v.x - g.x, y = (v.y - g.y) * (pose[1] ? -1 : 1);
        return P(x * Math.cos(th) - y * Math.sin(th), x * Math.sin(th) + y * Math.cos(th));
      });
      var fw = Math.max.apply(null, rv.map(function (v) { return v.x; })) - Math.min.apply(null, rv.map(function (v) { return v.x; }));
      var fh = Math.max.apply(null, rv.map(function (v) { return v.y; })) - Math.min.apply(null, rv.map(function (v) { return v.y; }));
      sc = Math.min(sc, (zone.w - 30) / Math.max(fw, 0.5), (zone.h - 34) / Math.max(fh, 0.5));
      fr = { t: ft, g: g, th: th, flip: pose[1] };
    }
    var ox = main.x + (main.w - bw * sc) / 2 - minX * sc, oy = main.y + (main.h - bh * sc) / 2 + maxY * sc;
    var S = function (q) { return P(ox + q.x * sc, oy - q.y * sc); };
    return { W: W, H: H, narrow: narrow, top: top, main: main, zone: zone, sc: sc, S: S, fr: fr };
  }

  function syncControls(p) {
    var r = rule(p), show = { a: /SSS|RHS|SSA/, b: /SSS|SAS/, c: /SSS|SAS|ASA|RHS|SSA/, A: /SAS|ASA|SSA|AAA/, B: /ASA|AAA/ };
    Object.keys(show).forEach(function (id) {
      var el = document.getElementById('ctl-' + id), box = el && el.closest('.control');
      if (box) box.style.display = show[id].test(r) ? '' : 'none';
    });
  }

  function tri(ctx, t, S, fill, stroke, lw, dash) {
    var a = S(t.A), b = S(t.B), c = S(t.C);
    ctx.save(); if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
  }
  function angleArc(ctx, V, P1, P2, r, color, filled) {
    var a1 = Math.atan2(P1.y - V.y, P1.x - V.x), a2 = Math.atan2(P2.y - V.y, P2.x - V.x), d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    ctx.save(); ctx.beginPath(); ctx.moveTo(V.x, V.y); ctx.arc(V.x, V.y, r, a1, a1 + d, d < 0); ctx.closePath();
    if (filled) { ctx.fillStyle = D.alpha(color, 0.4); ctx.fill(); }
    ctx.beginPath(); ctx.arc(V.x, V.y, r, a1, a1 + d, d < 0); ctx.strokeStyle = color; ctx.lineWidth = filled ? 2 : 1.4; ctx.stroke(); ctx.restore();
    return a1 + d / 2;
  }

  SimLab.createSim({
    ariaLabel: 'Constructing a triangle from three given parts with a ruler and compass, showing whether only one triangle, two triangles or many sizes fit, and sliding a friend\'s copy on top to test congruence',
    transport: false,
    mobileAspect: '3 / 3.4',
    params: [
      { id: 'rule', label: 'Given parts', type: 'select', value: 'SSS', options: [
        { value: 'SSS', label: 'SSS: three sides' },
        { value: 'SAS', label: 'SAS: two sides and the angle between' },
        { value: 'ASA', label: 'ASA: two angles and the side between' },
        { value: 'RHS', label: 'RHS: right angle, hypotenuse, one side' },
        { value: 'SSA', label: 'SSA: two sides and an angle not between (test)' },
        { value: 'AAA', label: 'AAA: three angles (test)' }] },
      { id: 'c', label: 'Side AB (c)', min: 2, max: 10, step: 0.1, value: 7, unit: 'cm' },
      { id: 'b', label: 'Side CA (b)', min: 2, max: 10, step: 0.1, value: 5, unit: 'cm' },
      { id: 'a', label: 'Side BC (a)', min: 2, max: 10, step: 0.1, value: 6, unit: 'cm', help: 'In RHS this is the hypotenuse.' },
      { id: 'A', label: 'Angle A', min: 10, max: 150, step: 1, value: 50, unit: '°', presets: [30, 45, 60, 90] },
      { id: 'B', label: 'Angle B', min: 10, max: 150, step: 1, value: 60, unit: '°' }
    ],
    buttons: [
      { label: 'Test with a friend\'s copy', primary: true, onClick: function (sim) {
        if (!solve(sim.p).sols.length) return;
        test.on = true; test.t0 = performance.now(); sim.redraw();
      } },
      { label: 'Clear', onClick: function (sim) { test.on = false; sim.redraw(); } }
    ],
    readouts: [
      { id: 'count', label: 'Triangles that fit', short: 'Triangles', key: true },
      { id: 'verdict', label: 'Congruence rule?', short: 'Rule?', key: true },
      { id: 'a', label: 'BC (a)', unit: 'cm', digits: 1 },
      { id: 'b', label: 'CA (b)', unit: 'cm', digits: 1 },
      { id: 'c', label: 'AB (c)', unit: 'cm', digits: 1 },
      { id: 'A', label: '∠A', unit: '°', digits: 0 },
      { id: 'B', label: '∠B', unit: '°', digits: 0 },
      { id: 'C', label: '∠C', unit: '°', digits: 0 }
    ],
    reset: function (sim) { syncControls(sim.p); },
    onParam: function (sim, id) {
      var p = sim.p;
      if (id === 'rule') {
        syncControls(p);
        if (p.rule === 'RHS') { sim.setParam('A', 90); if (p.a <= p.c + 0.5) sim.setParam('a', Math.min(10, +(p.c + 2.5).toFixed(1))); if (p.a <= p.c + 0.5) sim.setParam('c', +(p.a - 2.5).toFixed(1)); }
        else if (p.A === 90) sim.setParam('A', 50);
      }
      test.on = false;
      return true;
    },
    animate: function () { return test.on && performance.now() - test.t0 < DUR + 60; },
    readout: function (sim) {
      var p = sim.p, o = solve(p), r = rule(p), n = o.sols.length;
      var res = { count: r === 'AAA' && n ? 'Many sizes' : String(n), verdict: /SSA|AAA/.test(r) ? 'No' : 'Yes' };
      var q = n ? parts(o.sols[0]) : null;
      ['a', 'b', 'c', 'A', 'B', 'C'].forEach(function (k) { res[k] = q ? q[k] : '—'; });
      return res;
    },
    status: function (sim) {
      var o = solve(sim.p), r = rule(sim.p), n = o.sols.length;
      if (!n) return 'No triangle: ' + o.why;
      if (r === 'AAA') return 'AAA fixes the shape but not the size';
      return r + ': ' + (n === 2 ? 'two different triangles fit' : 'exactly one triangle fits');
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, r = rule(p), o = solve(p), L = layout(sim, o), S = L.S, W = L.W, H = L.H;
      var g = GIVEN[r], fs = L.narrow ? 11 : 12.5, n = o.sols.length;
      var giv = c.warning, col = [c.s1, c.s2, c.s3];
      D.clear(ctx, W, H, c.bg);

      // construction lines, clipped to the drawing area
      ctx.save(); ctx.beginPath(); ctx.rect(L.main.x, L.main.y - 4, L.main.w, L.main.h + 8); ctx.clip();
      var far = 40;
      o.rays.forEach(function (ry) {
        var s0 = S(ry.c), s1 = S(P(ry.c.x + Math.cos(ry.ang) * far, ry.c.y + Math.sin(ry.ang) * far));
        D.line(ctx, s0.x, s0.y, s1.x, s1.y, D.alpha(c.ink, 0.45), 1.5, [6, 5]);
      });
      if (r !== 'AAA') {
        var b0 = S(P(-far, 0)), b1 = S(P(far, 0));
        D.line(ctx, b0.x, b0.y, b1.x, b1.y, D.alpha(c.ink, 0.18), 1, [3, 5]);
      }
      o.arcs.forEach(function (ar) {
        var cc = S(ar.c), R = ar.r * L.sc;
        ctx.save(); ctx.strokeStyle = D.alpha(c.accent, 0.8); ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
        if (n) o.sols.forEach(function (t) {
          var a0 = Math.atan2(S(t.C).y - cc.y, S(t.C).x - cc.x);
          ctx.beginPath(); ctx.arc(cc.x, cc.y, R, a0 - 0.32, a0 + 0.32); ctx.stroke();
        });
        else { ctx.beginPath(); ctx.arc(cc.x, cc.y, R, Math.PI, 2 * Math.PI); ctx.stroke(); }
        ctx.restore();
        D.circle(ctx, cc.x, cc.y, 3, c.accent);
      });
      ctx.restore();

      // the triangles
      if (r === 'AAA') {
        for (var i = n - 1; i >= 0; i--) tri(ctx, o.sols[i], S, i ? null : D.alpha(col[0], 0.16), i ? D.alpha(c.ink, 0.5) : c.ink, i ? 1.6 : 2.5, i ? [6, 4] : null);
      } else {
        o.sols.forEach(function (t, i) { tri(ctx, t, S, D.alpha(col[i], 0.16), i ? col[1] : c.ink, 2.5, i ? [7, 4] : null); });
      }
      if (!n) {
        var a0 = S(P(0, 0)), b0p = S(P(p.c, 0));
        if (r !== 'AAA') D.line(ctx, a0.x, a0.y, b0p.x, b0p.y, giv, 4);
      }

      // given parts of your triangle (and of the second one, if any)
      var mainT = n ? o.sols[0] : { A: P(0, 0), B: P(p.c, 0), C: null };
      function sideLbl(t, k, txt, color, bold) {
        var ends = { a: [t.B, t.C], b: [t.C, t.A], c: [t.A, t.B] }[k];
        if (!ends[0] || !ends[1]) return;
        var p0 = S(ends[0]), p1 = S(ends[1]), mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
        var ctr = t.C ? S(P((t.A.x + t.B.x + t.C.x) / 3, (t.A.y + t.B.y + t.C.y) / 3)) : P(mx, my - 10);
        var nx = mx - ctr.x, ny = my - ctr.y, nl = Math.hypot(nx, ny) || 1;
        if (bold) D.line(ctx, p0.x, p0.y, p1.x, p1.y, color, 4.5);
        D.text(ctx, txt, mx + nx / nl * 15, my + ny / nl * 15 + (k === 'c' && !t.C ? 26 : 0), { color: color, size: fs, weight: bold ? 700 : 500, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
      }
      function angLbl(t, k, color, bold) {
        var V = { A: t.A, B: t.B, C: t.C }[k], o1 = { A: [t.B, t.C], B: [t.C, t.A], C: [t.A, t.B] }[k];
        var sv = S(V), q = parts(t), rr = M.clamp(Math.min(q.a, q.b, q.c) * L.sc * 0.28, 14, 30);
        var mid;
        if (k === 'A' && r === 'RHS') {
          var s1 = S(o1[0]), s2 = S(o1[1]), u = P(s1.x - sv.x, s1.y - sv.y), w = P(s2.x - sv.x, s2.y - sv.y), ul = Math.hypot(u.x, u.y), wl = Math.hypot(w.x, w.y), m = 12;
          ctx.beginPath(); ctx.moveTo(sv.x + u.x / ul * m, sv.y + u.y / ul * m); ctx.lineTo(sv.x + (u.x / ul + w.x / wl) * m, sv.y + (u.y / ul + w.y / wl) * m); ctx.lineTo(sv.x + w.x / wl * m, sv.y + w.y / wl * m);
          ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
          mid = Math.atan2((u.y / ul + w.y / wl), (u.x / ul + w.x / wl)); rr = 14;
        } else mid = angleArc(ctx, sv, S(o1[0]), S(o1[1]), rr, color, bold);
        D.text(ctx, Math.round(q[k]) + '°', sv.x + Math.cos(mid) * (rr + 13), sv.y + Math.sin(mid) * (rr + 11), { color: color, size: fs - (bold ? 0 : 1), weight: bold ? 700 : 500, align: 'center', bg: D.alpha(c.bg, 0.75), pad: 1, fit: W });
      }
      if (n) {
        ['a', 'b', 'c'].forEach(function (k) {
          var isG = g.s.indexOf(k) >= 0, q = parts(mainT);
          if (r === 'AAA') return;
          sideLbl(mainT, k, f1(q[k]) + ' cm', isG ? giv : c.muted, isG);
        });
        ['A', 'B', 'C'].forEach(function (k) { angLbl(mainT, k, g.g.indexOf(k) >= 0 ? giv : c.muted, g.g.indexOf(k) >= 0); });
        if (n === 2) { sideLbl(o.sols[1], 'a', f1(p.a) + ' cm', col[1], true); }
      } else if (r !== 'AAA') {
        sideLbl(mainT, 'c', 'AB = ' + f1(p.c) + ' cm', giv, false);
      }
      // vertex letters
      function vtx(q, txt, dx, dy, color) { var s = S(q); D.text(ctx, txt, s.x + dx, s.y + dy, { color: color || c.ink, size: 14, weight: 700, align: 'center', fit: W }); }
      vtx(P(0, 0), 'A', -12, 10); if (r !== 'AAA') vtx(P(p.c, 0), 'B', 12, 10); else if (n) vtx(o.sols[0].B, 'B', 4, 14);
      o.sols.forEach(function (t, i) {
        if (r === 'AAA' && i) return;
        var sC = S(t.C); D.circle(ctx, sC.x, sC.y, 4, i ? col[1] : c.ink);
        vtx(t.C, n === 2 && r !== 'AAA' ? 'C' + (i ? '₂' : '₁') : 'C', i ? 14 : -12, -12, i ? col[1] : c.ink);
      });

      // the friend's copy
      if (L.zone) {
        var z = L.zone, fr = L.fr, el = performance.now() - test.t0, k = ease((el - DUR * 0.3) / (DUR * 0.7)), appear = M.clamp(el / (DUR * 0.25), 0, 1);
        D.roundRect(ctx, z.x + 2, z.y + 2, z.w - 4, z.h - 4, 10, null, D.alpha(c.ink, 0.15), 1);
        D.text(ctx, 'A friend\'s triangle, same given parts', z.x + z.w / 2, z.y + 12, { color: c.muted, size: fs - 1, align: 'center', fit: W });
        var zc = P(z.x + z.w / 2, z.y + z.h / 2 + 8), gm = S(fr.g), cx = M.lerp(zc.x, gm.x, k), cy = M.lerp(zc.y, gm.y, k);
        var th = fr.th * (1 - k), fy = fr.flip ? M.lerp(-1, 1, k) : 1;
        var vs = [fr.t.A, fr.t.B, fr.t.C].map(function (v) {
          var x = v.x - fr.g.x, y = (v.y - fr.g.y) * fy, rx = x * Math.cos(th) - y * Math.sin(th), ry = x * Math.sin(th) + y * Math.cos(th);
          return P(cx + rx * L.sc, cy - ry * L.sc);
        });
        var fits = friendIndex(p, o) === 0;
        ctx.save(); ctx.globalAlpha = appear;
        ctx.beginPath(); ctx.moveTo(vs[0].x, vs[0].y); ctx.lineTo(vs[1].x, vs[1].y); ctx.lineTo(vs[2].x, vs[2].y); ctx.closePath();
        ctx.fillStyle = D.alpha(c.success, k >= 1 && fits ? 0.3 : 0.2); ctx.fill();
        ctx.strokeStyle = k >= 1 && !fits ? c.danger : c.success; ctx.lineWidth = 2.5; ctx.setLineDash(k >= 1 ? [] : [2, 0]); ctx.stroke();
        ['A', 'B', 'C'].forEach(function (lt, j) { if (k < 1) D.circle(ctx, vs[j].x, vs[j].y, 3, c.success); if (k < 0.05) D.text(ctx, lt, vs[j].x, vs[j].y - 11, { color: c.success, size: 11, weight: 700, align: 'center', fit: W }); });
        ctx.restore();
        if (el > DUR * 0.25 && k < 1) D.text(ctx, fr.flip && k < 0.5 ? 'turning it over and sliding it onto yours…' : 'sliding it onto yours…', z.x + z.w / 2, z.y + z.h - 12, { color: c.muted, size: fs - 1, align: 'center', fit: W });
        if (k >= 1) D.text(ctx, fits ? '✓ It fits exactly: congruent' : '✗ It does not fit: a different triangle', z.x + z.w / 2, z.y + z.h - 12, { color: fits ? c.success : c.danger, size: fs, weight: 700, align: 'center', fit: W });
      }

      // headline and note
      var hl, hc;
      if (!n) { hl = r + ': no triangle can be made'; hc = c.danger; }
      else if (r === 'AAA') { hl = 'AAA: same shape, any size ✗ not a congruence rule'; hc = c.danger; }
      else if (r === 'SSA') { hl = n === 2 ? 'SSA: two different triangles fit ✗ not a rule' : 'SSA: only one here, but often two ✗ not a rule'; hc = c.danger; }
      else { hl = r + ': exactly one triangle fits ✓ congruence rule'; hc = c.success; }
      var hs = L.narrow ? 12.5 : 14.5;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, L.narrow ? 16 : 20, { color: c.bg, bg: hc, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
      var note = !n ? o.why
        : r === 'SSA' && n === 2 ? 'The arc from B cuts the ray twice: C₁ and C₂ both fit'
        : r === 'SSA' ? 'Make BC shorter than AB (but long enough to reach the ray) to get two'
        : r === 'AAA' ? 'Triangles with equal angles are similar, not congruent'
        : r === 'SSS' ? 'The mirror image below AB is the same triangle turned over'
        : 'Orange parts are given; grey parts follow from them';
      var ns = L.narrow ? 11 : 12.5;
      ctx.font = '500 ' + ns + 'px Inter, system-ui, sans-serif';
      while (ns > 8.5 && ctx.measureText(note).width > W - 20) { ns -= 0.5; ctx.font = '500 ' + ns + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, note, W / 2, H - (L.narrow ? 12 : 15), { color: n ? c.muted : c.danger, size: ns, align: 'center', fit: W });
    }
  });
})();
