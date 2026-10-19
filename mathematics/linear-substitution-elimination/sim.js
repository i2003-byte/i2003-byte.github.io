/* =====================================================================
   Functions & Graphs · Substitution and Elimination — sim.js
   ---------------------------------------------------------------------
   Solves a₁x + b₁y = c₁, a₂x + b₂y = c₂ (whole-number a, b, c) step by
   step with exact fractions, by either method:
     substitution: make one letter the subject of one equation, put it
       into the other, solve, then substitute back;
     elimination: multiply each equation so one letter has the same size
       of coefficient (the LCM), add or subtract to remove it, solve,
       then substitute back.
   Every step is also shown as a balance: whatever is done to one pan is
   done to the other, so the beam stays level. Ending with 0 = 0 means
   infinitely many solutions; 0 = k (k ≠ 0) means none.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var PRESETS = {
    classic: [1, 1, 14, 1, -1, 4],
    neg: [2, 3, 11, 2, -4, -24],
    frac: [3, 2, 7, 1, -3, 2],
    hard: [3, -5, 4, 9, -2, 7],
    parallel: [1, 2, 4, 2, 4, 12],
    same: [1, 2, 4, 2, 4, 8]
  };
  var KEYS = ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'];
  var st = { step: 0, steps: [], anim: 1, lastT: 0, init: false };

  /* ---------- exact fractions ---------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function F(n, d) { d = d == null ? 1 : d; if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return { n: n / g, d: d / g }; }
  function add(p, q) { return F(p.n * q.d + q.n * p.d, p.d * q.d); }
  function sub(p, q) { return F(p.n * q.d - q.n * p.d, p.d * q.d); }
  function mul(p, q) { return F(p.n * q.n, p.d * q.d); }
  function div(p, q) { return F(p.n * q.d, p.d * q.n); }
  function neg(v) { return v < 0 ? '−' + Math.abs(v) : String(v); }
  function fs(f) { return f.d === 1 ? neg(f.n) : neg(f.n) + '/' + f.d; }
  function isZ(f) { return f.n === 0; }
  // terms [{k: fraction, v: 'x' | 'y' | ''}] → "3x − 2y + 5"
  function expr(terms) {
    var s = '';
    terms.forEach(function (t) {
      if (isZ(t.k)) return;
      var a = F(Math.abs(t.k.n), t.k.d), mag = t.v && a.n === 1 && a.d === 1 ? '' : fs(a);
      if (t.v && a.d !== 1) mag = '(' + mag + ')';
      s += (s ? (t.k.n < 0 ? ' − ' : ' + ') : (t.k.n < 0 ? '−' : '')) + mag + t.v;
    });
    return s || '0';
  }
  function eqs(a, b, c) { return expr([{ k: F(a), v: 'x' }, { k: F(b), v: 'y' }]) + ' = ' + neg(c); }
  function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
  function times(k, f) { return (k === 1 ? '' : k === -1 ? '−' : neg(k)) + f; }
  // parts [{k: whole number, s: letter} | {k, f: fraction}] in order → "3(25/11) − 2y"
  function mix(parts) {
    var out = '';
    parts.forEach(function (q) {
      if (!q.k) return;
      var a = Math.abs(q.k), body;
      if (q.s) body = (a === 1 ? '' : a) + q.s;
      else body = a === 1 && q.f.d === 1 && (q.f.n >= 0 || (!out && q.k > 0)) ? fs(q.f) : (a === 1 ? '' : a) + '(' + fs(q.f) + ')';
      out += (out ? (q.k < 0 ? ' − ' : ' + ') : (q.k < 0 ? '−' : '')) + body;
    });
    return out || '0';
  }

  /* ---------- the steps ---------- */
  function build(sim) {
    var p = sim.p, E = [{ a: p.a1, b: p.b1, c: p.c1 }, { a: p.a2, b: p.b2, c: p.c2 }], S = [];
    var e1 = eqs(E[0].a, E[0].b, E[0].c), e2 = eqs(E[1].a, E[1].b, E[1].c);
    S.push({ say: 'The pair to solve', math: ['①  ' + e1, '②  ' + e2], bal: { L: expr([{ k: F(E[0].a), v: 'x' }, { k: F(E[0].b), v: 'y' }]), R: neg(E[0].c), op: 'Each equation is a level balance' } });
    if ((!E[0].a && !E[0].b) || (!E[1].a && !E[1].b)) { S.push({ say: 'a and b cannot both be 0', math: ['That is not a line, so there is nothing to solve'], end: 'bad' }); return S; }
    var u, v, U, V;   // V = value found second, U = first
    if (p.method === 'sub') {
      // pick the equation and letter with the smallest coefficient size (±1 best)
      var best = null;
      [0, 1].forEach(function (i) { ['y', 'x'].forEach(function (L) { var k = L === 'x' ? E[i].a : E[i].b; if (k && (!best || Math.abs(k) < Math.abs(best.k))) best = { i: i, L: L, k: k }; }); });
      var i = best.i, j = 1 - i, vL = best.L, uL = vL === 'x' ? 'y' : 'x';
      var kv = best.k, ku = vL === 'x' ? E[i].b : E[i].a, c = E[i].c;
      var mv = vL === 'x' ? E[j].a : E[j].b, mu = vL === 'x' ? E[j].b : E[j].a, d = E[j].c;
      var P = F(c, kv), Q = F(-ku, kv), tag = ['①', '②'];
      var rhs = Math.abs(kv) === 1 ? expr([{ k: P, v: '' }, { k: Q, v: uL }]) : '(' + expr((kv < 0 ? ku : -ku) < 0 && (kv < 0 ? -c : c) > 0 ? [{ k: F(kv < 0 ? -c : c), v: '' }, { k: F(kv < 0 ? ku : -ku), v: uL }] : [{ k: F(kv < 0 ? ku : -ku), v: uL }, { k: F(kv < 0 ? -c : c), v: '' }]) + ')/' + Math.abs(kv);
      var moved = expr([{ k: F(c), v: '' }, { k: F(-ku), v: uL }]);
      S.push({ say: 'From ' + tag[i] + ', make ' + vL + ' the subject', math: [times(kv, vL) + ' = ' + moved].concat(Math.abs(kv) === 1 && kv === 1 ? [] : [vL + ' = ' + rhs]),
        bal: { L: vL, R: rhs, op: (ku ? (ku > 0 ? '− ' : '+ ') + times(Math.abs(ku), uL) + ' on both pans' : '') + (kv !== 1 ? (ku ? ', then ' : '') + '÷ ' + neg(kv) + ' on both' : '') || 'Already the subject' } });
      var K = add(F(mu), mul(F(mv), Q)), Rr = sub(F(d), mul(F(mv), P)), mp = mul(F(mv), P);
      if (!mv) S.push({ say: tag[j] + ' has no ' + vL + ' in it', math: [times(mu, uL) + ' = ' + neg(d)], bal: { L: times(mu, uL), R: neg(d), op: 'Nothing to substitute' } });
      else {
        var sp = [{ k: mv, s: '(' + rhs + ')' }, { k: mu, s: uL }];
        if (vL === 'y') sp.reverse();
        var subLine = mix(sp) + ' = ' + neg(d);
        S.push({ say: 'Put ' + vL + ' = ' + rhs + ' into ' + tag[j], math: [subLine], bal: { L: subLine.split(' = ')[0], R: neg(d), op: 'Swap ' + vL + ' for something equal: still level' } });
        S.push({ say: 'Open the brackets and collect the ' + uL + ' terms', math: [expr([{ k: K, v: uL }, { k: mp, v: '' }]) + ' = ' + neg(d)].concat(isZ(mp) ? [] : [expr([{ k: K, v: uL }]) + ' = ' + fs(Rr)]),
          bal: { L: expr([{ k: K, v: uL }]), R: fs(Rr), op: isZ(mp) ? 'Nothing to move' : (mp.n > 0 ? '− ' : '+ ') + fs(F(Math.abs(mp.n), mp.d)) + ' on both pans' } });
      }
      if (isZ(K)) return finishZero(S, Rr, uL);
      U = div(Rr, K); u = uL;
      if (K.n !== 1 || K.d !== 1) S.push({ say: 'Divide both sides by ' + fs(K), math: [uL + ' = ' + fs(U)], bal: { L: uL, R: fs(U), op: '÷ ' + fs(K) + ' on both pans' } });
      V = add(P, mul(Q, U)); v = vL;
      S.push({ say: 'Put ' + uL + ' = ' + fs(U) + ' back into ' + vL + ' = ' + rhs, math: [vL + ' = ' + fs(V)], bal: { L: vL, R: fs(V), op: 'Use the value found' } });
    } else {
      // eliminate the letter whose LCM is smaller (y if equal); a missing letter is already eliminated
      var lx = E[0].a && E[1].a ? lcm(E[0].a, E[1].a) : 0, ly = E[0].b && E[1].b ? lcm(E[0].b, E[1].b) : 0;
      var el = !ly ? (lx ? 'x' : 'y') : !lx ? 'y' : lx < ly ? 'x' : 'y', keep = el === 'x' ? 'y' : 'x';
      var k1 = el === 'x' ? E[0].a : E[0].b, k2 = el === 'x' ? E[1].a : E[1].b;
      var m1, m2, A1, A2;
      if (!k1 || !k2) {   // one equation already lacks the letter, e.g. y = 3
        var z = !k1 ? 0 : 1; m1 = m2 = 1;
        var cz = el === 'x' ? E[z].b : E[z].a;
        S.push({ say: (z ? '②' : '①') + ' has no ' + el + ' in it already', math: [times(cz, keep) + ' = ' + neg(E[z].c)], bal: { L: times(cz, keep), R: neg(E[z].c), op: 'Nothing to eliminate' } });
        A1 = { K: F(cz), R: F(E[z].c) };
      } else {
        var Lm = lcm(k1, k2); m1 = Lm / Math.abs(k1); m2 = Lm / Math.abs(k2);
        var s1 = E.map(function (e, n) { var m = n ? m2 : m1; return { a: e.a * m, b: e.b * m, c: e.c * m }; });
        if (m1 !== 1 || m2 !== 1) S.push({ say: 'Make the ' + el + ' terms the same size (' + Lm + el + ')', math: [(m1 !== 1 ? '① × ' + m1 + ':  ' : '①  ') + eqs(s1[0].a, s1[0].b, s1[0].c), (m2 !== 1 ? '② × ' + m2 + ':  ' : '②  ') + eqs(s1[1].a, s1[1].b, s1[1].c)],
          bal: { L: expr([{ k: F(s1[0].a), v: 'x' }, { k: F(s1[0].b), v: 'y' }]), R: neg(s1[0].c), op: m1 !== 1 ? '× ' + m1 + ' on both pans of ①' : '① stays as it is' } });
        var same = (k1 > 0) === (k2 > 0), sg = same ? -1 : 1;
        var Kc = (el === 'x' ? s1[0].b + sg * s1[1].b : s1[0].a + sg * s1[1].a), Rc = s1[0].c + sg * s1[1].c;
        S.push({ say: (same ? 'Subtract' : 'Add') + ' the equations: the ' + el + ' terms cancel', math: [(same ? '① − ②:  ' : '① + ②:  ') + (Kc ? times(Kc, keep) : '0') + ' = ' + neg(Rc)],
          bal: { L: Kc ? times(Kc, keep) : '0', R: neg(Rc), op: (same ? 'Take' : 'Add') + ' equal amounts ' + (same ? 'from' : 'to') + ' both pans' } });
        A1 = { K: F(Kc), R: F(Rc) };
      }
      if (isZ(A1.K)) return finishZero(S, A1.R, keep);
      U = div(A1.R, A1.K); u = keep;
      if (A1.K.n !== 1 || A1.K.d !== 1) S.push({ say: 'Divide both sides by ' + fs(A1.K), math: [keep + ' = ' + fs(U)], bal: { L: keep, R: fs(U), op: '÷ ' + fs(A1.K) + ' on both pans' } });
      // back into an equation that has the eliminated letter
      var g0 = Math.abs(el === 'x' ? E[0].a : E[0].b), g1 = Math.abs(el === 'x' ? E[1].a : E[1].b);
      var bi = g0 && (!g1 || g0 <= g1) ? 0 : 1, eb = E[bi];
      var kel = el === 'x' ? eb.a : eb.b, kk = el === 'x' ? eb.b : eb.a;
      var known = mul(F(kk), U), rest = sub(F(eb.c), known);
      V = div(rest, F(kel)); v = el;
      var pk = [{ k: kel, s: el }, { k: kk, f: U }];
      if (el === 'y') pk.reverse();
      var bl = [mix(pk) + ' = ' + neg(eb.c)];
      if (kk) bl.push(times(kel, el) + ' = ' + fs(rest));
      if (kel !== 1) bl.push(el + ' = ' + fs(V));
      var bop = (isZ(known) ? '' : (known.n > 0 ? '− ' : '+ ') + fs(F(Math.abs(known.n), known.d)) + ' on both pans') + (kel !== 1 ? (isZ(known) ? '' : ', then ') + '÷ ' + neg(kel) : '');
      S.push({ say: kk ? 'Put ' + keep + ' = ' + fs(U) + ' into ' + (bi ? '②' : '①') : (bi ? '②' : '①') + ' gives ' + el + ' directly', math: bl, bal: { L: el, R: fs(V), op: bop || 'Already found' } });
    }
    var X = u === 'x' ? U : V, Y = u === 'x' ? V : U;
    var chk = E.map(function (e, n) { return (n ? '② ' : '① ') + mix([{ k: e.a, f: X }, { k: e.b, f: Y }]) + ' = ' + fs(add(mul(F(e.a), X), mul(F(e.b), Y))) + ' ✓'; });
    S.push({ say: 'Check in both equations', math: chk, bal: { L: mix([{ k: E[1].a, f: X }, { k: E[1].b, f: Y }]), R: neg(E[1].c), op: 'Level in ② too ✓' } });
    S.push({ say: 'Solution', math: ['x = ' + fs(X) + ',  y = ' + fs(Y)], end: 'one', x: X, y: Y, bal: { L: '(x, y)', R: '(' + fs(X) + ', ' + fs(Y) + ')', op: 'One solution: the lines cross here' } });
    return S;
  }
  function finishZero(S, R, L) {
    var none = !isZ(R);
    S.push({ say: 'The ' + L + ' terms vanished too', math: ['0 = ' + fs(R) + (none ? '   impossible!' : '   always true')], end: none ? 'none' : 'same',
      bal: { L: '0', R: fs(R), op: none ? 'Can never balance: no solution (parallel lines)' : 'Always level: infinitely many (same line)' } });
    return S;
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.1, bal, list;
    if (wide) { var bw = Math.min(W * 0.42, 440); bal = { x: 8, y: 8, w: bw, h: H - 16 }; list = { x: bw + 18, y: 8, w: W - bw - 26, h: H - 16 }; }
    else { var bh = M.clamp(H * 0.34, 110, 190); bal = { x: 6, y: 4, w: W - 12, h: bh }; list = { x: 6, y: bh + 8, w: W - 12, h: H - bh - 12 }; }
    return { W: W, H: H, bal: bal, list: list, wide: wide };
  }
  function fitText(ctx, s, max, size, weight) {
    ctx.font = (weight || 600) + ' ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 8 && ctx.measureText(s).width > max) { size -= 0.5; ctx.font = (weight || 600) + ' ' + size + 'px Inter, system-ui, sans-serif'; }
    return size;
  }

  function drawBalance(ctx, c, B, s, anim, endKind) {
    var cx = B.x + B.w / 2, top = B.y + B.h * 0.3, arm = B.w * 0.28, base = B.y + B.h - 6;
    var bad = endKind === 'none';
    var tilt = bad ? 0.16 : Math.sin(Math.PI * M.clamp(anim, 0, 1)) * 0.14;
    // stand
    D.line(ctx, cx, top, cx, base, c.muted, 4);
    D.roundRect(ctx, cx - B.w * 0.12, base - 6, B.w * 0.24, 6, 3, c.muted);
    var dx = Math.cos(tilt) * arm, dy = Math.sin(tilt) * arm;
    var lx = cx - dx, ly = top + dy, rx = cx + dx, ry = top - dy;   // left pan heavier while tilting
    D.line(ctx, lx, ly, rx, ry, c.ink, 4);
    D.circle(ctx, cx, top, 5, c.accent);
    var panW = Math.min(B.w * 0.4, B.w * 0.44 - 8), drop = Math.min(B.h * 0.32, 56), ph = Math.max(26, Math.min(40, B.h * 0.2));
    [[lx, ly, s.L, c.s1], [rx, ry, s.R, c.s2]].forEach(function (q) {
      var py = q[1] + drop;
      D.line(ctx, q[0], q[1], q[0] - panW * 0.42, py, D.alpha(c.ink, 0.5), 1.2);
      D.line(ctx, q[0], q[1], q[0] + panW * 0.42, py, D.alpha(c.ink, 0.5), 1.2);
      D.roundRect(ctx, q[0] - panW / 2, py, panW, ph, 8, D.alpha(q[3], 0.18), q[3], 2);
      var sz = fitText(ctx, q[2], panW - 10, B.w > 340 ? 16 : 13, 700);
      D.text(ctx, q[2], q[0], py + ph / 2, { color: q[3], size: sz, weight: 700, align: 'center' });
    });
    var level = !bad && anim >= 1;
    var opc = bad ? c.danger : endKind === 'same' ? c.success : level ? c.ink : c.warning;
    var osz = fitText(ctx, s.op, B.w - 12, B.w > 340 ? 13 : 11.5, 600);
    D.text(ctx, s.op, cx, B.y + 10, { color: opc, size: osz, weight: 600, align: 'center' });
    D.text(ctx, bad ? 'never level ✗' : level ? 'level: both sides equal' : 'one pan first…', cx, B.y + 10 + osz + 6, { color: bad ? c.danger : level ? c.success : c.warning, size: B.w > 340 ? 11.5 : 10, weight: 600, align: 'center' });
  }

  function drawList(ctx, c, Lb, S, cur, narrow) {
    D.roundRect(ctx, Lb.x, Lb.y, Lb.w, Lb.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.12));
    var say = narrow ? 11 : 12.5, mz = narrow ? 13 : 15, gap = 4;
    function hOf(s) { return say + 5 + s.math.length * (mz + 5) + gap; }
    // show as many of the latest steps as fit
    var first = cur, used = hOf(S[cur]) + 18;
    while (first > 0 && used + hOf(S[first - 1]) < Lb.h - 8) { first--; used += hOf(S[first]); }
    var y = Lb.y + 10;
    if (first > 0) { D.text(ctx, '⋮ ' + first + ' earlier step' + (first > 1 ? 's' : ''), Lb.x + 10, y + 4, { color: c.faint, size: 10.5 }); y += 16; }
    for (var k = first; k <= cur; k++) {
      var s = S[k], now = k === cur;
      var col = s.end === 'one' ? c.success : s.end === 'none' || s.end === 'bad' ? c.danger : s.end === 'same' ? c.success : now ? c.ink : c.muted;
      if (now) D.roundRect(ctx, Lb.x + 4, y - 4, Lb.w - 8, hOf(s), 8, D.alpha(c.accent, 0.1));
      var t = (k + 1) + '. ' + s.say;
      D.text(ctx, t, Lb.x + 10, y + say / 2, { color: now ? c.accent : c.faint, size: fitText(ctx, t, Lb.w - 20, say, 600), weight: 600 });
      y += say + 5;
      s.math.forEach(function (m) {
        var z = fitText(ctx, m, Lb.w - 28, mz, 700);
        D.text(ctx, m, Lb.x + 20, y + mz / 2, { color: col, size: z, weight: 700, font: 'ui-monospace, Menlo, Consolas, monospace' });
        y += mz + 5;
      });
      y += gap;
    }
    if (cur < S.length - 1) D.text(ctx, 'Next step ▶  (or tap the picture)', Lb.x + Lb.w - 10, Lb.y + Lb.h - 10, { color: c.faint, size: 10.5, align: 'right' });
  }

  function go(sim, k) {
    var n = M.clamp(k, 0, st.steps.length - 1);
    if (n !== st.step) { st.step = n; st.anim = sim.reduceMotion ? 1 : 0; st.lastT = 0; }
    sim.redraw();
  }

  SimLab.createSim({
    ariaLabel: 'A pair of linear equations solved step by step by substitution or elimination, with exact fractions. A balance beside the working shows that each step does the same thing to both sides, so the equation stays level',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'preset', label: 'Pair', type: 'select', value: 'classic', options: [
        { value: 'classic', label: 'x + y = 14, x − y = 4' },
        { value: 'neg', label: '2x + 3y = 11, 2x − 4y = −24' },
        { value: 'frac', label: 'Fraction answer: 3x + 2y = 7, x − 3y = 2' },
        { value: 'hard', label: 'No ±1 anywhere: 3x − 5y = 4, 9x − 2y = 7' },
        { value: 'parallel', label: 'Parallel: x + 2y = 4, 2x + 4y = 12' },
        { value: 'same', label: 'Same line: x + 2y = 4, 2x + 4y = 8' }] },
      { id: 'method', label: 'Method', type: 'select', value: 'sub', options: [{ value: 'sub', label: 'Substitution' }, { value: 'elim', label: 'Elimination' }] },
      { id: 'a1', label: 'a₁ (x in ①)', min: -9, max: 9, step: 1, value: 1 },
      { id: 'b1', label: 'b₁ (y in ①)', min: -9, max: 9, step: 1, value: 1 },
      { id: 'c1', label: 'c₁ (right side of ①)', min: -30, max: 30, step: 1, value: 14 },
      { id: 'a2', label: 'a₂ (x in ②)', min: -9, max: 9, step: 1, value: 1 },
      { id: 'b2', label: 'b₂ (y in ②)', min: -9, max: 9, step: 1, value: -1 },
      { id: 'c2', label: 'c₂ (right side of ②)', min: -30, max: 30, step: 1, value: 4 }
    ],
    buttons: [
      { label: 'Next step ▶', primary: true, onClick: function (sim) { go(sim, st.step + 1); } },
      { label: '◀ Back', onClick: function (sim) { go(sim, st.step - 1); } },
      { label: 'Show all steps', onClick: function (sim) { go(sim, st.steps.length - 1); } },
      { label: 'Start again', onClick: function (sim) { go(sim, 0); } }
    ],
    readouts: [
      { id: 'step', label: 'Step', key: true },
      { id: 'sol', label: 'Answer', key: true },
      { id: 'meth', label: 'Method' }
    ],
    reset: function (sim) {
      if (!st.init) {   // a shared link with only ?preset= should still load that pair
        st.init = true;
        if (!/[?&][abc][12]=/.test(location.search)) { var p = PRESETS[sim.p.preset] || PRESETS.classic; KEYS.forEach(function (k, i) { sim.setParam(k, p[i]); }); }
      }
      st.steps = build(sim); st.step = 0; st.anim = 1;
    },
    onParam: function (sim, id, v) {
      if (id === 'preset') { var p = PRESETS[v] || PRESETS.classic; KEYS.forEach(function (k, i) { sim.setParam(k, p[i]); }); }
      st.steps = build(sim); st.step = 0; st.anim = 1;
      return true;
    },
    readout: function (sim) {
      var last = st.steps[st.steps.length - 1], done = st.step === st.steps.length - 1;
      return {
        step: (st.step + 1) + ' of ' + st.steps.length,
        sol: !done ? 'keep going…' : last.end === 'one' ? '(' + fs(last.x) + ', ' + fs(last.y) + ')' : last.end === 'none' ? 'no solution' : last.end === 'same' ? 'infinitely many' : '—',
        meth: sim.p.method === 'sub' ? 'substitution' : 'elimination'
      };
    },
    status: function () { return st.steps[st.step] ? st.steps[st.step].say : ''; },
    pointer: { down: function (sim) { go(sim, st.step + 1 > st.steps.length - 1 ? 0 : st.step + 1); } },
    animate: function () { return st.anim < 1; },
    draw: function (sim, now) {
      var ctx = sim.ctx, c = sim.colors, L = layout(sim), S = st.steps, s = S[st.step];
      if (st.anim < 1) { if (st.lastT) st.anim = Math.min(1, st.anim + (now - st.lastT) / 900); st.lastT = now; }
      D.clear(ctx, L.W, L.H, c.bg);
      var bal = s.bal || (S[st.step - 1] && S[st.step - 1].bal) || { L: '', R: '', op: '' };
      drawBalance(ctx, c, L.bal, bal, st.anim, s.end);
      drawList(ctx, c, L.list, S, st.step, !L.wide);
    }
  });
})();
