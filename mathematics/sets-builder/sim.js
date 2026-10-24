/* =====================================================================
   Sets · Making Sets — sim.js
   ---------------------------------------------------------------------
   A universal set U (the numbers 1 to 20, or a class of 12 students)
   and two sets A and B given in set-builder form. Drag each element
   from the tray into the right part of the Venn diagram: only A, both,
   only B, or outside both circles (but still inside U). The roster
   form of A and B is written from where the elements are, so the
   visitor sees the two forms side by side. "Check my sets" marks each
   element ✓ or ✗; "Place one for me" and "Show me" do it for you.
   Problems include a subset (A ⊂ B), disjoint sets and an empty set.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  function isPrime(x) { if (x < 2) return false; for (var k = 2; k * k <= x; k++) if (x % k === 0) return false; return true; }
  var KIDS = [['Aarav', 'CF'], ['Diya', 'C'], ['Kabir', 'F'], ['Meera', ''], ['Rohan', 'CF'], ['Sana', 'C'],
    ['Ishan', 'F'], ['Zoya', 'C'], ['Arjun', 'CF'], ['Priya', '']];
  var PROBS = {
    evens3: { a: 'x is an even number', b: 'x is a multiple of 3', fa: function (x) { return x % 2 === 0; }, fb: function (x) { return x % 3 === 0; } },
    cricket: { kids: true, a: 'x plays cricket', b: 'x plays football', fa: function (k) { return /C/.test(k[1]); }, fb: function (k) { return /F/.test(k[1]); } },
    factors: { a: 'x is a factor of 12', b: 'x is a factor of 18', fa: function (x) { return 12 % x === 0; }, fb: function (x) { return 18 % x === 0; } },
    primes: { a: 'x is a prime number', b: 'x is an odd number', fa: isPrime, fb: function (x) { return x % 2 === 1; } },
    subset: { a: 'x is a multiple of 4', b: 'x is an even number', fa: function (x) { return x % 4 === 0; }, fb: function (x) { return x % 2 === 0; } },
    disjoint: { a: 'x is a multiple of 5', b: 'x is a perfect square', fa: function (x) { return x % 5 === 0; }, fb: function (x) { return Math.sqrt(x) % 1 === 0; } },
    empty: { a: 'x is an even prime greater than 2', b: 'x is greater than 15', fa: function (x) { return x % 2 === 0 && isPrime(x) && x > 2; }, fb: function (x) { return x > 15; } }
  };
  // region codes: -1 tray, 0 in U but outside both circles, 1 only A, 2 A and B, 3 only B
  var st = { toks: [], prob: null, drag: null, checked: false };

  function load(key) {
    var pr = PROBS[key] || PROBS.evens3;
    st.prob = pr; st.checked = false; st.drag = null;
    var items = pr.kids ? KIDS : Array.apply(null, Array(20)).map(function (_, i) { return i + 1; });
    st.toks = items.map(function (it, i) {
      var a = pr.fa(it), b = pr.fb(it);
      return { i: i, label: pr.kids ? it[0] : String(it), tag: pr.kids ? it[1] : '', sortKey: pr.kids ? i : it,
        want: a && b ? 2 : a ? 1 : b ? 3 : 0, region: -1, x: null, y: null };
    });
  }
  function inA(r) { return r === 1 || r === 2; }
  function inB(r) { return r === 2 || r === 3; }
  function roster(test) {
    var s = st.toks.filter(function (t) { return test(t.region); }).sort(function (a, b) { return a.sortKey - b.sortKey; });
    return s.length ? '{' + s.map(function (t) { return t.label; }).join(', ') + '}' : '∅';
  }
  function count(test) { return st.toks.filter(function (t) { return test(t.region); }).length; }
  function rightCount() { return st.toks.filter(function (t) { return t.region === t.want; }).length; }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.2, kids = st.prob.kids;
    var tr = M.clamp(Math.min(W, H) / (wide ? 30 : 25), 12, 18);
    var tok = { w: tr * 2, h: tr * 2 }, fs = kids ? Math.max(9.5, tr * (wide ? 0.72 : 0.66)) : Math.max(11, tr * 0.9);
    if (kids) {
      // pill: name, then up to two sport badges
      tok.h = Math.round(tr * (wide ? 1.9 : 1.55));
      sim.ctx.font = '600 ' + fs + 'px Inter, system-ui, sans-serif';
      var nw = Math.max.apply(null, st.toks.map(function (t) { return sim.ctx.measureText(t.label).width; }));
      tok.w = Math.ceil(nw + 7 + 4 + 2 * (Math.max(8.5, tok.h * 0.48) + 2) + 4);
    }
    var top = wide ? 52 : 40, L = { W: W, H: H, wide: wide, tok: tok, fs: fs, top: top };
    var colW = wide ? Math.min(360, Math.max(240, W * 0.33)) : W - 12;
    var left = st.toks.filter(function (t) { return t.region === -1 || (st.drag && st.drag.t === t && st.drag.from === -1); }).length;
    var per = Math.max(1, Math.floor((colW - 8) / (tok.w + 5))), rows = Math.ceil((wide ? st.toks.length : left) / per);
    var trayH = rows * (tok.h + 5) + (rows ? 26 : 22);
    if (wide) {
      L.box = { x: 8, y: top, w: W - colW - 26, h: H - top - 8 };
      L.tray = { x: W - colW - 8, y: top, w: colW, h: trayH };
      L.info = { x: W - colW - 8, y: top + trayH + 10, w: colW, h: H - top - trayH - 18 };
    } else {
      var infoH = 44;
      L.tray = { x: 6, y: H - trayH - 4, w: W - 12, h: trayH };
      L.info = { x: 6, y: L.tray.y - infoH - 4, w: W - 12, h: infoH, strip: true };
      L.box = { x: 6, y: top, w: W - 12, h: L.info.y - top - 4 };
    }
    L.per = per;
    var b = L.box, r = Math.min(b.h * 0.42, b.w * (kids ? 0.28 : 0.26)), d = r * (kids || st.toks.filter(function (t) { return t.want === 2; }).length > 4 ? 0.95 : 1.12);
    L.r = r; L.A = { x: b.x + b.w / 2 - d / 2, y: b.y + b.h / 2 + 4 }; L.B = { x: b.x + b.w / 2 + d / 2, y: L.A.y };
    L.labA = { x: L.A.x - r * 0.7, y: L.A.y - r * 0.7 }; L.labB = { x: L.B.x + r * 0.7, y: L.B.y - r * 0.7 };
    return L;
  }
  function regionAt(L, x, y, pad) {
    pad = pad || 0;
    var b = L.box;
    if (x < b.x + pad || x > b.x + b.w - pad || y < b.y + 18 + pad * 0.3 || y > b.y + b.h - pad) return -1;
    if (pad && (Math.hypot(x - L.labA.x, y - L.labA.y) < 13 || Math.hypot(x - L.labB.x, y - L.labB.y) < 13)) return null;
    var da = Math.hypot(x - L.A.x, y - L.A.y), db = Math.hypot(x - L.B.x, y - L.B.y);
    var a = da < L.r - pad, b2 = db < L.r - pad, na = da > L.r + pad, nb = db > L.r + pad;
    if (a && b2) return 2; if (a && nb) return 1; if (na && b2) return 3; if (na && nb) return 0;
    return null; // on a boundary line
  }
  // slots: grid points whose whole token fits inside the region
  function slots(L, region, n) {
    var tw = L.tok.w, th = L.tok.h, cx = region === 1 ? L.A.x - L.r * 0.35 : region === 3 ? L.B.x + L.r * 0.35 : (L.A.x + L.B.x) / 2;
    var cy = L.A.y, b = L.box, out = [];
    for (var sp = 1; sp > 0.5 && out.length < n; sp -= 0.06) {
      out = [];
      var sx = (tw + 5) * sp, sy = (th + 5) * sp;
      for (var y = b.y + th / 2 + 20; y < b.y + b.h - th / 2; y += sy)
        for (var x = b.x + tw / 2 + 3; x < b.x + b.w - tw / 2; x += sx) {
          var ok = true, pts = [[0, 0], [-tw / 2, 0], [tw / 2, 0], [0, -th / 2], [0, th / 2]];
          if (st.prob.kids) pts.push([-tw / 2, -th / 2], [tw / 2, -th / 2], [-tw / 2, th / 2], [tw / 2, th / 2]);
          else pts.push([-tw * 0.36, -th * 0.36], [tw * 0.36, -th * 0.36], [-tw * 0.36, th * 0.36], [tw * 0.36, th * 0.36]);
          for (var k = 0; k < pts.length && ok; k++) ok = regionAt(L, x + pts[k][0], y + pts[k][1], 2) === region;
          if (ok) out.push({ x: x, y: y });
        }
    }
    if (region === 0) cx = b.x + b.w / 2;
    out.sort(function (p, q) { return Math.hypot(p.x - cx, (p.y - cy) * 1.3) - Math.hypot(q.x - cx, (q.y - cy) * 1.3); });
    while (out.length < n) out.push({ x: cx + (out.length % 3 - 1) * 6, y: cy + 6 * (out.length % 2) });
    return out;
  }
  function targets(L) {
    var T = {};
    [0, 1, 2, 3].forEach(function (rg) {
      var list = st.toks.filter(function (t) { return t.region === rg; }).sort(function (a, b) { return a.sortKey - b.sortKey; });
      var sl = slots(L, rg, list.length);
      list.forEach(function (t, k) { T[t.i] = sl[k]; });
    });
    st.toks.filter(function (t) { return t.region === -1; }).forEach(function (t, k) {
      var idx = L.wide ? t.i : k, col = idx % L.per, row = Math.floor(idx / L.per);
      T[t.i] = { x: L.tray.x + 6 + L.tok.w / 2 + col * (L.tok.w + 5), y: L.tray.y + 22 + L.tok.h / 2 + row * (L.tok.h + 5) };
    });
    return T;
  }
  function tokenAt(sim, x, y) {
    var L = layout(sim), T = targets(L), best = null;
    st.toks.forEach(function (t) {
      var p = t.x == null ? T[t.i] : { x: t.x, y: t.y };
      if (Math.abs(x - p.x) < L.tok.w / 2 + 4 && Math.abs(y - p.y) < L.tok.h / 2 + 4) best = t;
    });
    return best;
  }

  function drawToken(ctx, c, L, t, x, y, cols) {
    var w = L.tok.w, h = L.tok.h, kids = st.prob.kids, mark = st.checked && t.region !== -1 ? (t.region === t.want ? 1 : -1) : 0;
    var fill = t.region === -1 ? c.surface2 || D.alpha(c.ink, 0.12) : D.alpha(t.region === 1 ? cols.a : t.region === 3 ? cols.b : t.region === 2 ? cols.ab : c.ink, t.region === 0 ? 0.14 : 0.3);
    var edge = mark > 0 ? c.success : mark < 0 ? c.danger : D.alpha(c.ink, 0.45);
    if (st.drag && st.drag.t === t) { D.roundRect(ctx, x - w / 2 - 3, y - h / 2 - 3, w + 6, h + 6, h / 2 + 3, D.alpha(c.accent, 0.25)); }
    D.roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2, c.bg);
    D.roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2, fill, edge, mark ? 2.5 : 1.2);
    if (kids) {
      var bw = Math.max(8.5, h * 0.48), tags = t.tag.split(''), nameX = x - w / 2 + 7;
      D.text(ctx, t.label, nameX, y, { color: c.ink, size: L.fs, weight: 600 });
      tags.forEach(function (g, k) {
        var bx = x + w / 2 - 6 - bw / 2 - (tags.length - 1 - k) * (bw + 2);
        D.circle(ctx, bx, y, bw / 2, g === 'C' ? cols.a : cols.b);
        D.text(ctx, g, bx, y + 0.5, { color: c.bg, size: bw * 0.78, weight: 800, align: 'center' });
      });
    } else D.text(ctx, t.label, x, y + 0.5, { color: c.ink, size: L.fs, weight: 700, align: 'center' });
    if (mark) D.text(ctx, mark > 0 ? '✓' : '✗', x + w / 2 - 1, y - h / 2 + 2, { color: mark > 0 ? c.success : c.danger, size: 12, weight: 800, align: 'center', bg: c.bg, pad: 1 });
  }

  function relation() {
    var nA = count(inA), nB = count(inB), nAB = count(function (r) { return r === 2; });
    if (rightCount() < st.toks.length) return null;
    if (!nA) return 'A has no elements: A = ∅, the empty set. ∅ is a subset of every set.';
    if (nAB === nA) return 'Every element of A is also in B, so A ⊂ B (A is a subset of B).';
    if (nAB === nB) return 'Every element of B is also in A, so B ⊂ A.';
    if (!nAB) return 'A and B have nothing in common: A ∩ B = ∅. They are disjoint sets.';
    return 'A and B share ' + nAB + ' element' + (nAB > 1 ? 's' : '') + ': ' + roster(function (r) { return r === 2; }) + '.';
  }

  SimLab.createSim({
    ariaLabel: 'A Venn diagram with two circles A and B inside a rectangle U, and a tray of numbers or student names. Drag each element into the region where it belongs; the roster form of A and B is written from where they are',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'prob', label: 'Sets to make', type: 'select', value: 'evens3', options: [
        { value: 'evens3', label: 'Even numbers and multiples of 3' },
        { value: 'cricket', label: 'Class 7B: cricket and football players' },
        { value: 'factors', label: 'Factors of 12 and factors of 18' },
        { value: 'primes', label: 'Prime numbers and odd numbers' },
        { value: 'subset', label: 'Multiples of 4 and even numbers (subset)' },
        { value: 'disjoint', label: 'Multiples of 5 and perfect squares' },
        { value: 'empty', label: 'Even primes above 2 (empty set)' }] }
    ],
    buttons: [
      { label: 'Check my sets', primary: true, onClick: function () { st.checked = true; } },
      { label: 'Place one for me', onClick: function () {
        var t = st.toks.filter(function (q) { return q.region !== q.want; })[0];
        if (t) { t.region = t.want; } st.checked = false;
      } },
      { label: 'Show me', onClick: function () { st.toks.forEach(function (t) { t.region = t.want; }); st.checked = true; } },
      { label: 'Clear', onClick: function () { st.toks.forEach(function (t) { t.region = -1; }); st.checked = false; } }
    ],
    readouts: [
      { id: 'A', label: 'A in roster form', short: 'A', key: true },
      { id: 'B', label: 'B in roster form', short: 'B' },
      { id: 'nA', label: 'n(A)', digits: 0 },
      { id: 'nB', label: 'n(B)', digits: 0 },
      { id: 'AB', label: 'In both (A ∩ B)', short: 'A ∩ B' },
      { id: 'right', label: 'Placed right', short: 'Right', key: true }
    ],
    reset: function (sim) { load(sim.p.prob); },
    readout: function () {
      return { A: roster(inA), B: roster(inB), nA: count(inA), nB: count(inB), AB: roster(function (r) { return r === 2; }),
        right: rightCount() + ' of ' + st.toks.length + (st.toks.some(function (t) { return t.region === -1; }) ? '' : ' placed') };
    },
    status: function () { return relation() ? 'All correct' : count(function (r) { return r !== -1; }) + ' of ' + st.toks.length + ' placed'; },
    animate: function () {
      return st.toks.some(function (t) { return t.moving; });
    },
    pointer: {
      down: function (sim, x, y) {
        var t = tokenAt(sim, x, y);
        if (!t) return false;
        var L = layout(sim), T = targets(L), p = t.x == null ? T[t.i] : { x: t.x, y: t.y };
        st.drag = { t: t, dx: p.x - x, dy: p.y - y, moved: false, from: t.region };
        t.x = p.x; t.y = p.y; st.checked = false;
      },
      move: function (sim, x, y) {
        if (!st.drag) return;
        st.drag.t.x = x + st.drag.dx; st.drag.t.y = y + st.drag.dy; st.drag.moved = true;
      },
      up: function (sim) {
        if (!st.drag) return;
        var t = st.drag.t, L = layout(sim);
        if (st.drag.moved) {
          var rg = regionAt(L, t.x, t.y, 0);
          if (rg === null) rg = regionAt(L, t.x, t.y - 6, 0);
          t.region = rg === null || rg === undefined ? t.region : rg;
        }
        st.drag = null;
      },
      hover: function (sim, x, y) { return !!tokenAt(sim, x, y); }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, L = layout(sim), b = L.box, pr = st.prob;
      var cols = { a: c.s1, b: c.s2, ab: c.s3 };
      D.clear(ctx, L.W, L.H, c.bg);

      // set-builder forms
      var fsT = L.wide ? 15 : 11.5, uTxt = pr.kids ? 'U = {students of Class 7B}' : 'U = {1, 2, 3, …, 20}';
      if (L.wide) {
        D.text(ctx, 'A = {x : ' + pr.a + '}', 10, 15, { color: cols.a, size: fsT, weight: 700, fit: b.x + b.w });
        D.text(ctx, 'B = {x : ' + pr.b + '}', 10, 36, { color: cols.b, size: fsT, weight: 700, fit: b.x + b.w });
      } else {
        D.text(ctx, 'A = {x : ' + pr.a + '}', 8, 11, { color: cols.a, size: fsT, weight: 700, fit: L.W });
        D.text(ctx, 'B = {x : ' + pr.b + '}', 8, 28, { color: cols.b, size: fsT, weight: 700, fit: L.W });
      }

      // U and the two circles
      D.roundRect(ctx, b.x, b.y, b.w, b.h, 10, D.alpha(c.ink, 0.03), D.alpha(c.ink, 0.4), 1.5);
      D.text(ctx, uTxt, b.x + 8, b.y + 11, { color: c.muted, size: L.wide ? 13 : 11, weight: 700 });
      [[L.A, cols.a, 'A'], [L.B, cols.b, 'B']].forEach(function (q) {
        ctx.beginPath(); ctx.arc(q[0].x, q[0].y, L.r, 0, Math.PI * 2);
        ctx.fillStyle = D.alpha(q[1], 0.09); ctx.fill(); ctx.strokeStyle = q[1]; ctx.lineWidth = 2.5; ctx.stroke();
      });
      D.text(ctx, 'A', L.labA.x, L.labA.y, { color: cols.a, size: L.wide ? 22 : 17, weight: 800, align: 'center' });
      D.text(ctx, 'B', L.labB.x, L.labB.y, { color: cols.b, size: L.wide ? 22 : 17, weight: 800, align: 'center' });

      // tray
      var tr = L.tray, left = st.toks.filter(function (t) { return t.region === -1; }).length;
      D.roundRect(ctx, tr.x, tr.y, tr.w, tr.h, 10, D.alpha(c.ink, 0.05), D.alpha(c.ink, 0.15));
      var head = left ? (pr.kids ? left + ' left: drag them in' : 'Drag each one into the diagram (' + left + ' left)') : 'All placed';
      D.text(ctx, head, tr.x + 8, tr.y + 11, { color: c.muted, size: 11, weight: 600 });
      if (pr.kids) {
        var lx = tr.x + tr.w - 8;
        D.text(ctx, 'F = football', lx, tr.y + 11, { color: cols.b, size: 10.5, weight: 700, align: 'right' });
        D.text(ctx, 'C = cricket', lx - 74, tr.y + 11, { color: cols.a, size: 10.5, weight: 700, align: 'right' });
      }

      // tokens (eased towards their places; the dragged one follows the finger)
      var T = targets(L), dragT = st.drag && st.drag.t;
      st.toks.forEach(function (t) {
        var g = T[t.i];
        if (t !== dragT) {
          if (t.x == null) { t.x = g.x; t.y = g.y; }
          t.x += (g.x - t.x) * 0.3; t.y += (g.y - t.y) * 0.3;
          t.moving = Math.abs(g.x - t.x) + Math.abs(g.y - t.y) > 0.5;
          if (!t.moving) { t.x = g.x; t.y = g.y; }
        }
      });
      st.toks.forEach(function (t) { if (t !== dragT) drawToken(ctx, c, L, t, t.x, t.y, cols); });
      if (dragT) drawToken(ctx, c, L, dragT, dragT.x, dragT.y, cols);

      // roster forms and what they show
      var inf = L.info, rel = relation(), wrong = st.checked ? st.toks.filter(function (t) { return t.region !== -1 && t.region !== t.want; }).length : 0;
      var rows = [
        { t: 'A = ' + roster(inA) + '   n(A) = ' + count(inA), color: cols.a },
        { t: 'B = ' + roster(inB) + '   n(B) = ' + count(inB), color: cols.b }
      ];
      var msg = rel ? { t: '✓ ' + rel, color: c.success } : st.checked ? { t: wrong ? wrong + ' in the wrong place (✗). Move them and check again.' : 'All placed so far are right (✓). Keep going.', color: wrong ? c.danger : c.success } : null;
      if (inf.strip) {
        rows.forEach(function (r, k) { fitText(ctx, r.t, inf.x + 2, inf.y + 8 + k * 15, inf.w - 4, 11.5, r.color); });
        if (msg) fitText(ctx, msg.t, inf.x + 2, inf.y + 38, inf.w - 4, 11, msg.color);
      } else {
        D.roundRect(ctx, inf.x, inf.y, inf.w, inf.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.12));
        var y = inf.y + 16;
        D.text(ctx, 'Roster form (from your diagram)', inf.x + 10, y, { color: c.muted, size: 12, weight: 700 }); y += 22;
        rows.forEach(function (r) { y = wrapText(ctx, r.t, inf.x + 10, y, inf.w - 20, 13.5, r.color) + 6; });
        D.text(ctx, uTxt + '   n(U) = ' + st.toks.length, inf.x + 10, y, { color: c.muted, size: 12, weight: 600, fit: inf.x + inf.w }); y += 24;
        if (msg) wrapText(ctx, msg.t, inf.x + 10, y, inf.w - 20, 13, msg.color);
      }
    }
  });

  // one line, shrunk (down to 8.5px) until it fits the width
  function fitText(ctx, s, x, y, w, size, color) {
    ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 8.5 && ctx.measureText(s).width > w) { size -= 0.5; ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif'; }
    D.text(ctx, s, x, y, { color: color, size: size, weight: 700 });
  }
  // write text over as many lines as it needs; returns the y below it
  function wrapText(ctx, s, x, y, w, size, color) {
    ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif';
    var line = '', words = s.split(' ');
    words.forEach(function (wd) {
      var t = line ? line + ' ' + wd : wd;
      if (line && ctx.measureText(t).width > w) { D.text(ctx, line, x, y, { color: color, size: size, weight: 700 }); y += size + 5; line = wd; }
      else line = t;
    });
    D.text(ctx, line, x, y, { color: color, size: size, weight: 700 });
    return y + size + 5;
  }
})();
