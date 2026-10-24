/* =====================================================================
   Sets · Venn Diagram Operations — sim.js
   ---------------------------------------------------------------------
   Two sets A and B of numbers from U = {1, 2, …, n}. The Venn diagram
   has four regions: only A, A and B, only B, and outside both. Any
   choice of shaded regions is one of 16 sets (union, intersection,
   differences, complements, De Morgan's laws, …). Pick an operation to
   shade it, or tap regions to shade your own and the sim names it.
   The numbers sit in their regions; the shaded ones form the answer
   in roster form, and n(A ∪ B) = n(A) + n(B) − n(A ∩ B) is checked
   with the actual counts.
   Region bits: 1 only A, 2 A ∩ B, 4 only B, 8 outside both.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  function isPrime(x) { if (x < 2) return false; for (var k = 2; k * k <= x; k++) if (x % k === 0) return false; return true; }
  var PAIRS = {
    evens3: { a: 'x is even', b: 'x is a multiple of 3', fa: function (x) { return x % 2 === 0; }, fb: function (x) { return x % 3 === 0; } },
    factors: { a: 'x is a factor of 12', b: 'x is a factor of 18', fa: function (x) { return 12 % x === 0; }, fb: function (x) { return 18 % x === 0; } },
    primes: { a: 'x is prime', b: 'x is odd', fa: isPrime, fb: function (x) { return x % 2 === 1; } },
    subset: { a: 'x is a multiple of 4', b: 'x is even', fa: function (x) { return x % 4 === 0; }, fb: function (x) { return x % 2 === 0; } },
    disjoint: { a: 'x is a multiple of 5', b: 'x is a perfect square', fa: function (x) { return x % 5 === 0; }, fb: function (x) { return Math.sqrt(x) % 1 === 0; } }
  };
  // every set of regions has a name
  var OPS = {
    7: { name: 'A ∪ B', words: 'in A or in B (or both): the union' },
    2: { name: 'A ∩ B', words: 'in A and also in B: the intersection' },
    1: { name: 'A − B', also: '= A ∩ B′', words: 'in A but not in B' },
    4: { name: 'B − A', also: '= B ∩ A′', words: 'in B but not in A' },
    12: { name: 'A′', also: '= U − A', words: 'in U but not in A: the complement of A' },
    9: { name: 'B′', also: '= U − B', words: 'in U but not in B: the complement of B' },
    8: { name: '(A ∪ B)′', also: '= A′ ∩ B′ (De Morgan)', words: 'in neither A nor B' },
    13: { name: '(A ∩ B)′', also: '= A′ ∪ B′ (De Morgan)', words: 'not in both A and B' },
    5: { name: '(A − B) ∪ (B − A)', also: '= (A ∪ B) − (A ∩ B)', words: 'in exactly one of A and B' },
    3: { name: 'A', words: 'the set A itself' },
    6: { name: 'B', words: 'the set B itself' },
    15: { name: 'U', words: 'everything: the universal set' },
    0: { name: '∅', words: 'nothing is shaded: the empty set' },
    10: { name: '(A ∩ B) ∪ (A ∪ B)′', words: 'in both, or in neither' },
    11: { name: 'A ∪ B′', also: '= (B − A)′', words: 'in A, or not in B' },
    14: { name: 'A′ ∪ B', also: '= (A − B)′', words: 'in B, or not in A' }
  };
  var ORDER = [7, 2, 1, 4, 12, 9, 8, 13, 5, 3, 6, 15, 0, 10, 11, 14];
  var st = { els: [] };

  function bitOf(x, pr) { var a = pr.fa(x), b = pr.fb(x); return a && b ? 2 : a ? 1 : b ? 4 : 8; }
  function build(p) {
    var pr = PAIRS[p.pair] || PAIRS.evens3;
    st.pr = pr; st.els = [];
    for (var x = 1; x <= p.n; x++) st.els.push({ v: x, bit: bitOf(x, pr) });
  }
  function mask(p) { return +p.op || 0; }
  function sel(test) { return st.els.filter(function (e) { return test(e.bit); }).map(function (e) { return e.v; }); }
  function rost(a) { return a.length ? '{' + a.join(', ') + '}' : '∅'; }
  function counts() {
    var nA = sel(function (b) { return b & 3; }).length, nB = sel(function (b) { return b & 6; }).length, nAB = sel(function (b) { return b & 2; }).length;
    return { nA: nA, nB: nB, nAB: nAB, nU: st.els.length, nUnion: nA + nB - nAB };
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.2, L = { W: W, H: H, wide: wide };
    if (wide) {
      var pw = Math.min(400, Math.max(260, W * 0.38));
      L.box = { x: 8, y: 8, w: W - pw - 26, h: H - 16 };
      L.panel = { x: W - pw - 8, y: 8, w: pw, h: H - 16 };
    } else {
      var ph = Math.min(118, H * 0.34);
      L.top = 36;
      L.box = { x: 6, y: L.top, w: W - 12, h: H - L.top - ph - 8 };
      L.panel = { x: 6, y: H - ph - 4, w: W - 12, h: ph };
    }
    var b = L.box, r = Math.min(b.h * 0.42, b.w * 0.27), d = r * 1.05;
    L.r = r; L.d = d; L.phi = Math.acos(M.clamp(d / 2 / r, -1, 1));
    L.A = { x: b.x + b.w / 2 - d / 2, y: b.y + b.h / 2 + 6 }; L.B = { x: b.x + b.w / 2 + d / 2, y: L.A.y };
    L.labA = { x: L.A.x - r * 0.7, y: L.A.y - r * 0.7 }; L.labB = { x: L.B.x + r * 0.7, y: L.B.y - r * 0.7 };
    L.tr = M.clamp(Math.min(b.w, b.h) / 19, 8.5, 14);
    return L;
  }
  // 1, 2, 4, 8 for the region at (x, y); 0 outside U; -1 on a line (or near a label when pad > 0)
  function regionAt(L, x, y, pad) {
    var b = L.box;
    if (x < b.x + pad || x > b.x + b.w - pad || y < b.y + 18 + pad * 0.3 || y > b.y + b.h - pad) return 0;
    if (pad && (Math.hypot(x - L.labA.x, y - L.labA.y) < 14 || Math.hypot(x - L.labB.x, y - L.labB.y) < 14)) return -1;
    var da = Math.hypot(x - L.A.x, y - L.A.y), db = Math.hypot(x - L.B.x, y - L.B.y);
    var a = da < L.r - pad, bb = db < L.r - pad, na = da > L.r + pad, nb = db > L.r + pad;
    return a && bb ? 2 : a && nb ? 1 : na && bb ? 4 : na && nb ? 8 : -1;
  }
  function slots(L, bit, n) {
    var t = L.tr, b = L.box, out = [];
    var cx = bit === 1 ? L.A.x - L.r * 0.45 : bit === 4 ? L.B.x + L.r * 0.45 : b.x + b.w / 2, cy = L.A.y;
    for (var sp = 1; sp > 0.6 && out.length < n; sp -= 0.06) {
      out = [];
      var s = (2 * t + 4) * sp;
      for (var y = b.y + t + 20; y < b.y + b.h - t; y += s)
        for (var x = b.x + t + 3; x < b.x + b.w - t; x += s) {
          var ok = true, pts = [[0, 0], [-t, 0], [t, 0], [0, -t], [0, t], [-0.7 * t, -0.7 * t], [0.7 * t, -0.7 * t], [-0.7 * t, 0.7 * t], [0.7 * t, 0.7 * t]];
          for (var k = 0; k < pts.length && ok; k++) ok = regionAt(L, x + pts[k][0], y + pts[k][1], 2) === bit;
          if (ok) out.push({ x: x, y: y });
        }
    }
    out.sort(function (p, q) { return Math.hypot(p.x - cx, (p.y - cy) * 1.3) - Math.hypot(q.x - cx, (q.y - cy) * 1.3); });
    while (out.length < n) out.push({ x: cx + (out.length % 3 - 1) * t, y: cy + t * (out.length % 2) });
    return out;
  }
  function regionPath(ctx, L, bit) {
    var A = L.A, B = L.B, r = L.r, f = L.phi, PI = Math.PI, b = L.box;
    ctx.beginPath();
    if (bit === 2) { ctx.arc(A.x, A.y, r, -f, f, false); ctx.arc(B.x, B.y, r, PI - f, PI + f, false); }
    else if (bit === 1) { ctx.arc(A.x, A.y, r, -f, f, true); ctx.arc(B.x, B.y, r, PI - f, PI + f, false); }
    else if (bit === 4) { ctx.arc(B.x, B.y, r, PI + f, PI - f, false); ctx.arc(A.x, A.y, r, f, -f, true); }
    else {
      ctx.rect(b.x, b.y, b.w, b.h);
      ctx.moveTo(A.x + r * Math.cos(-f), A.y + r * Math.sin(-f));
      ctx.arc(A.x, A.y, r, -f, f, true); ctx.arc(B.x, B.y, r, PI - f, PI + f, true);
    }
    ctx.closePath();
  }

  // rows of text, each shrunk to fit and wrapped if still too long; returns the y below
  function rowsText(ctx, rows, x, y, w, lh) {
    rows.forEach(function (r) {
      var sz = r.size, font = function () { ctx.font = (r.weight || 600) + ' ' + sz + 'px Inter, system-ui, sans-serif'; };
      font();
      while (sz > (r.min || sz - 2) && ctx.measureText(r.t).width > w) { sz -= 0.5; font(); }
      var lines = [], cur = '';
      r.t.split(' ').forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (cur && ctx.measureText(t).width > w) { lines.push(cur); cur = wd; } else cur = t; });
      lines.push(cur);
      lines.forEach(function (t) { D.text(ctx, t, x, y + sz / 2, { color: r.color, size: sz, weight: r.weight || 600 }); y += sz + (lh || 5); });
      y += r.gap || 0;
    });
    return y;
  }

  SimLab.createSim({
    ariaLabel: 'A Venn diagram of two sets A and B of numbers inside the universal set U. Regions are shaded to show union, intersection, difference or complement; tap a region to shade or unshade it',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'op', label: 'Shade', type: 'select', value: '7', options: ORDER.map(function (k) { return { value: String(k), label: OPS[k].name + (OPS[k].also ? ' ' + OPS[k].also : '') }; }), help: 'Or tap the regions of the diagram to shade your own set.' },
      { id: 'pair', label: 'Sets A and B', type: 'select', value: 'evens3', options: [
        { value: 'evens3', label: 'A even, B multiples of 3' },
        { value: 'factors', label: 'A factors of 12, B factors of 18' },
        { value: 'primes', label: 'A primes, B odd numbers' },
        { value: 'subset', label: 'A multiples of 4, B even (A ⊂ B)' },
        { value: 'disjoint', label: 'A multiples of 5, B squares (disjoint)' }] },
      { id: 'n', label: 'U = {1, 2, …, n}', min: 10, max: 30, step: 1, value: 20, presets: [10, 20, 30] },
      { id: 'nums', label: 'Show the numbers', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'set', label: 'Shaded set', short: 'Set', key: true },
      { id: 'roster', label: 'Its elements', short: 'Elements' },
      { id: 'n', label: 'Number of elements', short: 'n', digits: 0, key: true },
      { id: 'nA', label: 'n(A)', digits: 0 },
      { id: 'nB', label: 'n(B)', digits: 0 },
      { id: 'nAB', label: 'n(A ∩ B)', digits: 0 },
      { id: 'nUnion', label: 'n(A ∪ B)', digits: 0 }
    ],
    reset: function (sim) { build(sim.p); },
    onParam: function (sim, id) { build(sim.p); return true; },
    readout: function (sim) {
      var m = mask(sim.p), res = sel(function (b) { return b & m; }), k = counts();
      return { set: OPS[m].name, roster: rost(res), n: res.length, nA: k.nA, nB: k.nB, nAB: k.nAB, nUnion: k.nUnion };
    },
    status: function (sim) { return 'Shaded: ' + OPS[mask(sim.p)].name; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim), bit = regionAt(L, x, y, 0);
        if (bit <= 0) return false;
        sim.setParam('op', String(mask(sim.p) ^ bit));
        return false;
      },
      hover: function (sim, x, y) { return regionAt(layout(sim), x, y, 0) > 0; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, L = layout(sim), b = L.box, pr = st.pr, m = mask(sim.p), op = OPS[m];
      var cA = c.s1, cB = c.s2, sh = c.warning;
      D.clear(ctx, L.W, L.H, c.bg);
      if (!L.wide) {
        D.text(ctx, 'A = {x : ' + pr.a + '}', 8, 10, { color: cA, size: 11.5, weight: 700, fit: L.W });
        D.text(ctx, 'B = {x : ' + pr.b + '}', 8, 26, { color: cB, size: 11.5, weight: 700, fit: L.W });
      }
      D.roundRect(ctx, b.x, b.y, b.w, b.h, 10, D.alpha(c.ink, 0.03));
      [1, 2, 4, 8].forEach(function (bit) {
        if (!(m & bit)) return;
        ctx.save(); regionPath(ctx, L, bit); ctx.fillStyle = D.alpha(sh, 0.38); ctx.fill('evenodd'); ctx.restore();
      });
      D.roundRect(ctx, b.x, b.y, b.w, b.h, 10, null, D.alpha(c.ink, 0.45), 1.5);
      [[L.A, cA], [L.B, cB]].forEach(function (q) {
        ctx.beginPath(); ctx.arc(q[0].x, q[0].y, L.r, 0, Math.PI * 2); ctx.strokeStyle = q[1]; ctx.lineWidth = 2.5; ctx.stroke();
      });
      D.text(ctx, 'U = {1, 2, …, ' + sim.p.n + '}', b.x + 8, b.y + 11, { color: c.muted, size: L.wide ? 13 : 11, weight: 700 });
      D.text(ctx, 'A', L.labA.x, L.labA.y, { color: cA, size: L.wide ? 22 : 17, weight: 800, align: 'center' });
      D.text(ctx, 'B', L.labB.x, L.labB.y, { color: cB, size: L.wide ? 22 : 17, weight: 800, align: 'center' });

      // the numbers in their regions
      if (sim.p.nums) {
        [1, 2, 4, 8].forEach(function (bit) {
          var list = st.els.filter(function (e) { return e.bit === bit; }), sl = slots(L, bit, list.length), on = m & bit;
          list.forEach(function (e, k) {
            var s = sl[k];
            if (on) D.circle(ctx, s.x, s.y, L.tr, D.alpha(c.bg, 0.75), sh, 1.5);
            D.text(ctx, String(e.v), s.x, s.y + 0.5, { color: on ? c.ink : c.muted, size: Math.max(10, L.tr * (e.v > 9 ? 0.85 : 1)), weight: on ? 800 : 500, align: 'center' });
          });
        });
      }
      // empty regions say so (subset or disjoint pairs)
      [1, 2, 4].forEach(function (bit) {
        if (st.els.some(function (e) { return e.bit === bit; })) return;
        var s = slots(L, bit, 1)[0];
        D.text(ctx, 'empty', s.x, s.y, { color: c.faint || c.muted, size: 11, weight: 600, align: 'center' });
      });

      // working panel
      var pn = L.panel, res = sel(function (bb) { return bb & m; }), k = counts(), rows = [];
      var fUnion = 'n(A ∪ B) = n(A) + n(B) − n(A ∩ B) = ' + k.nA + ' + ' + k.nB + ' − ' + k.nAB + ' = ' + k.nUnion;
      var comp = m === 12 ? 'n(A′) = n(U) − n(A) = ' + k.nU + ' − ' + k.nA + ' = ' + (k.nU - k.nA)
        : m === 9 ? 'n(B′) = n(U) − n(B) = ' + k.nU + ' − ' + k.nB + ' = ' + (k.nU - k.nB)
        : m === 8 ? 'n((A ∪ B)′) = n(U) − n(A ∪ B) = ' + k.nU + ' − ' + k.nUnion + ' = ' + (k.nU - k.nUnion)
        : m === 13 ? 'n((A ∩ B)′) = n(U) − n(A ∩ B) = ' + k.nU + ' − ' + k.nAB + ' = ' + (k.nU - k.nAB)
        : m === 1 ? 'n(A − B) = n(A) − n(A ∩ B) = ' + k.nA + ' − ' + k.nAB + ' = ' + (k.nA - k.nAB)
        : m === 4 ? 'n(B − A) = n(B) − n(A ∩ B) = ' + k.nB + ' − ' + k.nAB + ' = ' + (k.nB - k.nAB) : null;
      if (L.wide) {
        D.roundRect(ctx, pn.x, pn.y, pn.w, pn.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.12));
        rows.push({ t: 'A = {x : ' + pr.a + '} = ' + rost(sel(function (bb) { return bb & 3; })), color: cA, size: 13.5 },
          { t: 'B = {x : ' + pr.b + '} = ' + rost(sel(function (bb) { return bb & 6; })), color: cB, size: 13.5, gap: 8 },
          { t: 'Shaded: ' + op.name + (op.also ? ' ' + op.also : ''), color: sh, size: 18, weight: 800 },
          { t: 'Elements ' + op.words + '.', color: c.muted, size: 13, gap: 6 },
          { t: op.name + ' = ' + rost(res), color: c.ink, size: 14, weight: 700 },
          { t: 'n(' + op.name + ') = ' + res.length, color: c.ink, size: 14, weight: 700, gap: 8 },
          { t: fUnion, color: c.success, size: 13, weight: 700 });
        if (comp) rows.push({ t: comp, color: c.success, size: 13, weight: 700 });
        rows.push({ t: 'Tap any region to shade it or clear it.', color: c.muted, size: 12, gap: 0 });
        rowsText(ctx, rows, pn.x + 12, pn.y + 12, pn.w - 24, 6);
      } else {
        rows.push({ t: op.name + (op.also ? ' ' + op.also : '') + ': ' + op.words, color: sh, size: 13, weight: 800, min: 10 },
          { t: op.name + ' = ' + rost(res) + '   n = ' + res.length, color: c.ink, size: 12, weight: 700, min: 10 },
          { t: comp || fUnion, color: c.success, size: 11.5, weight: 700, min: 9.5 });
        if (comp) rows.push({ t: fUnion, color: c.muted, size: 11, min: 9.5 });
        rowsText(ctx, rows, pn.x + 2, pn.y + 4, pn.w - 4, 4);
      }
    }
  });
})();
