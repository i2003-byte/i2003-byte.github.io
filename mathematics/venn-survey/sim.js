/* =====================================================================
   Sets · Survey Problems with Venn Diagrams — sim.js
   ---------------------------------------------------------------------
   A survey gives totals such as n(H), n(E), n(H ∩ E) … and asks how
   many are in only one set, in exactly two, or in none. The method:
   fill the Venn diagram from the middle outwards, one region per step,
   subtracting what is already filled. Two-set and three-set surveys,
   your own numbers on sliders, and one survey whose numbers cannot be
   true (a region comes out negative).
   Region values (3 sets):  abc = n(ABC);  ab = n(AB) − abc …;
   a = n(A) − ab − ca − abc …;  none = total − (sum of the 7 regions).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var PROBS = {
    paper2: { k: 2, L: ['H', 'E'], N: ['Hindi', 'English'], who: 'families', text: 'A colony has 600 families. 400 read a Hindi newspaper, 300 read an English one and 150 read both.', v: { t: 600, a: 400, b: 300, ab: 150 } },
    subjects2: { k: 2, L: ['M', 'S'], N: ['maths', 'science'], who: 'students', text: 'In a class of 40 students, 25 like maths, 18 like science and 8 like both.', v: { t: 40, a: 25, b: 18, ab: 8 } },
    paper3: { k: 3, L: ['H', 'E', 'P'], N: ['Hindi', 'English', 'Punjabi'], who: 'families', text: '200 families in a Delhi colony were asked which papers they read: Hindi 110, English 90, Punjabi 50; Hindi and English 40, English and Punjabi 20, Hindi and Punjabi 25; all three 10.', v: { t: 200, a: 110, b: 90, c: 50, ab: 40, bc: 20, ca: 25, abc: 10 } },
    sports3: { k: 3, L: ['C', 'F', 'K'], N: ['cricket', 'football', 'kabaddi'], who: 'students', text: 'A school has 120 students: 60 play cricket, 45 football, 35 kabaddi; 20 play cricket and football, 12 football and kabaddi, 15 cricket and kabaddi; 6 play all three.', v: { t: 120, a: 60, b: 45, c: 35, ab: 20, bc: 12, ca: 15, abc: 6 } },
    mistake2: { k: 2, L: ['T', 'C'], N: ['tea', 'coffee'], who: 'people', text: 'A report says: of 100 people, 60 drink tea, 50 drink coffee and only 5 drink both. Can that be true?', v: { t: 100, a: 60, b: 50, ab: 5 } },
    own2: { k: 2, L: ['A', 'B'], N: ['A', 'B'], who: 'people', text: 'Your own two-set survey: set the totals with the sliders.' },
    own3: { k: 3, L: ['A', 'B', 'C'], N: ['A', 'B', 'C'], who: 'people', text: 'Your own three-set survey: set the totals with the sliders.' }
  };
  var KEYS = ['t', 'a', 'b', 'c', 'ab', 'bc', 'ca', 'abc'];
  var st = { step: 0 };

  function prob(p) { return PROBS[p.prob] || PROBS.paper2; }
  // regions with how each is worked out; in = which circles it lies inside
  function solve(p) {
    var pr = prob(p), Lt = pr.L, R = [];
    function nm(s) { return 'n(' + s + ')'; }
    if (pr.k === 2) {
      var ab = p.ab, a = p.a - ab, b = p.b - ab, u = a + b + ab;
      R.push({ id: 'ab', inn: [1, 1], v: ab, title: 'Both ' + pr.N[0] + ' and ' + pr.N[1], work: nm(Lt[0] + ' ∩ ' + Lt[1]) + ' is given = ' + ab });
      R.push({ id: 'a', inn: [1, 0], v: a, title: 'Only ' + pr.N[0], work: nm(Lt[0]) + ' − both = ' + p.a + ' − ' + ab + ' = ' + a });
      R.push({ id: 'b', inn: [0, 1], v: b, title: 'Only ' + pr.N[1], work: nm(Lt[1]) + ' − both = ' + p.b + ' − ' + ab + ' = ' + b });
      R.push({ id: 'u', v: u, title: 'At least one (' + Lt[0] + ' ∪ ' + Lt[1] + ')', work: a + ' + ' + ab + ' + ' + b + ' = ' + u + ';  check: ' + p.a + ' + ' + p.b + ' − ' + ab + ' = ' + u });
      R.push({ id: 'none', inn: [0, 0], v: p.t - u, title: 'Neither', work: 'total − ' + nm(Lt[0] + ' ∪ ' + Lt[1]) + ' = ' + p.t + ' − ' + u + ' = ' + (p.t - u) });
      R.forEach(function (q) { q.work = q.work.replace(/-(\d)/g, '−$1'); });
      return { R: R, one: a + b, two: ab, three: null, u: u, none: p.t - u };
    }
    var abc = p.abc, x = p.ab - abc, y = p.bc - abc, z = p.ca - abc;
    var A = p.a - x - z - abc, B = p.b - x - y - abc, C = p.c - y - z - abc, U = A + B + C + x + y + z + abc;
    var j = function (i, k2) { return Lt[i] + ' ∩ ' + Lt[k2]; };
    R.push({ id: 'abc', inn: [1, 1, 1], v: abc, title: 'All three', work: nm(Lt.join(' ∩ ')) + ' is given = ' + abc });
    R.push({ id: 'ab', inn: [1, 1, 0], v: x, title: pr.N[0] + ' and ' + pr.N[1] + ' only', work: nm(j(0, 1)) + ' − all three = ' + p.ab + ' − ' + abc + ' = ' + x });
    R.push({ id: 'bc', inn: [0, 1, 1], v: y, title: pr.N[1] + ' and ' + pr.N[2] + ' only', work: nm(j(1, 2)) + ' − all three = ' + p.bc + ' − ' + abc + ' = ' + y });
    R.push({ id: 'ca', inn: [1, 0, 1], v: z, title: pr.N[0] + ' and ' + pr.N[2] + ' only', work: nm(j(2, 0)) + ' − all three = ' + p.ca + ' − ' + abc + ' = ' + z });
    R.push({ id: 'a', inn: [1, 0, 0], v: A, title: 'Only ' + pr.N[0], work: nm(Lt[0]) + ' − ' + x + ' − ' + z + ' − ' + abc + ' = ' + p.a + ' − ' + (x + z + abc) + ' = ' + A });
    R.push({ id: 'b', inn: [0, 1, 0], v: B, title: 'Only ' + pr.N[1], work: nm(Lt[1]) + ' − ' + x + ' − ' + y + ' − ' + abc + ' = ' + p.b + ' − ' + (x + y + abc) + ' = ' + B });
    R.push({ id: 'c', inn: [0, 0, 1], v: C, title: 'Only ' + pr.N[2], work: nm(Lt[2]) + ' − ' + y + ' − ' + z + ' − ' + abc + ' = ' + p.c + ' − ' + (y + z + abc) + ' = ' + C });
    R.push({ id: 'u', v: U, title: 'At least one', work: 'add the 7 regions = ' + U + ';  check: ' + p.a + ' + ' + p.b + ' + ' + p.c + ' − ' + p.ab + ' − ' + p.bc + ' − ' + p.ca + ' + ' + abc + ' = ' + U });
    R.push({ id: 'none', inn: [0, 0, 0], v: p.t - U, title: 'None of them', work: 'total − at least one = ' + p.t + ' − ' + U + ' = ' + (p.t - U) });
    R.forEach(function (q) { q.work = q.work.replace(/-(\d)/g, '−$1'); });
    return { R: R, one: A + B + C, two: x + y + z, three: abc, u: U, none: p.t - U };
  }
  function firstBad(S) { for (var i = 0; i < S.R.length; i++) if (S.R[i].v < 0) return i; return -1; }

  function layout(sim, k) {
    var W = sim.width, H = sim.height, wide = W >= 560 && W > H * 1.2, L = { W: W, H: H, wide: wide, k: k };
    if (wide) {
      var pw = Math.min(420, Math.max(270, W * 0.42));
      L.box = { x: 8, y: 8, w: W - pw - 26, h: H - 16 }; L.panel = { x: W - pw - 8, y: 8, w: pw, h: H - 16 };
    } else {
      var bh = Math.round(H * 0.52);
      L.box = { x: 6, y: 6, w: W - 12, h: bh }; L.panel = { x: 6, y: bh + 12, w: W - 12, h: H - bh - 16 };
    }
    var b = L.box, cx = b.x + b.w / 2, r;
    if (k === 2) {
      r = Math.min((b.h - 30) * 0.46, b.w * 0.26);
      var d = r * 1.1, cy = b.y + b.h / 2 + 6;
      L.C = [{ x: cx - d / 2, y: cy }, { x: cx + d / 2, y: cy }];
      L.lab = [{ x: L.C[0].x - r * 0.6, y: cy - r * 0.62 }, { x: L.C[1].x + r * 0.6, y: cy - r * 0.62 }];
      L.pos = { ab: { x: cx, y: cy }, a: { x: L.C[0].x - r * 0.42, y: cy }, b: { x: L.C[1].x + r * 0.42, y: cy } };
    } else {
      r = Math.min((b.h - 34) / 2.93, (b.w - 64) / 3.07);
      var s = r * 0.62, G = { x: cx, y: b.y + 20 + 1.31 * r + 4 }, ang = [-150, -30, 90].map(function (q) { return q * Math.PI / 180; });
      var at = function (a, dist) { return { x: G.x + Math.cos(a) * dist, y: G.y + Math.sin(a) * dist }; };
      L.C = ang.map(function (a) { return at(a, s); });
      L.lab = [at(ang[0] - 0.3, s + r + 11), at(ang[1] + 0.3, s + r + 11), at(ang[2] + 0.9, s + r + 11)];
      L.pos = { abc: G, a: at(ang[0], r * 1.08), b: at(ang[1], r * 1.08), c: at(ang[2], r * 1.08),
        ab: at(-Math.PI / 2, r * 0.6), bc: at(30 * Math.PI / 180, r * 0.6), ca: at(150 * Math.PI / 180, r * 0.6) };
    }
    L.r = r; L.pos.none = { x: b.x + b.w - 10, y: b.y + b.h - 14 };
    L.fs = M.clamp(r / 3.3, 11, 19);
    return L;
  }
  function fillRegion(ctx, L, inn, color) {
    var b = L.box;
    ctx.save();
    L.C.forEach(function (q, i) {
      ctx.beginPath();
      if (!inn[i]) ctx.rect(b.x, b.y, b.w, b.h);
      ctx.moveTo(q.x + L.r, q.y); ctx.arc(q.x, q.y, L.r, 0, Math.PI * 2);
      ctx.clip(inn[i] ? 'nonzero' : 'evenodd');
    });
    ctx.fillStyle = color; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.restore();
  }
  // rows shrunk a little and wrapped to the width; returns the y below
  function rowsText(ctx, rows, x, y, w, maxY) {
    rows.forEach(function (r) {
      if (y > maxY) return;
      var sz = r.size, font = function () { ctx.font = (r.weight || 600) + ' ' + sz + 'px Inter, system-ui, sans-serif'; };
      font();
      while (sz > r.size - 2 && ctx.measureText(r.t).width > w) { sz -= 0.5; font(); }
      var lines = [], cur = '';
      r.t.split(' ').forEach(function (wd) { var t = cur ? cur + ' ' + wd : wd; if (cur && ctx.measureText(t).width > w) { lines.push(cur); cur = wd; } else cur = t; });
      lines.push(cur);
      lines.forEach(function (t) { D.text(ctx, t, x, y + sz / 2, { color: r.color, size: sz, weight: r.weight || 600 }); y += sz + 4; });
      y += r.gap || 0;
    });
    return y;
  }

  function syncFromProb(sim) {
    var pr = prob(sim.p);
    if (!pr.v) return;
    KEYS.forEach(function (k) { sim.setParam(k, pr.v[k] || 0); });
  }

  SimLab.createSim({
    ariaLabel: 'A Venn diagram with two or three circles for a survey. Step by step, each region is filled with a count, from the middle outwards, to find how many are in only one set, in exactly two, or in none',
    transport: false,
    mobileAspect: '3 / 4.2',
    params: [
      { id: 'prob', label: 'Survey', type: 'select', value: 'paper2', options: [
        { value: 'paper2', label: 'Hindi and English papers (600 families)' },
        { value: 'subjects2', label: 'Maths and science (class of 40)' },
        { value: 'paper3', label: 'Hindi, English, Punjabi papers (200)' },
        { value: 'sports3', label: 'Cricket, football, kabaddi (120)' },
        { value: 'mistake2', label: 'Tea and coffee: is the report true?' },
        { value: 'own2', label: 'Your own numbers: 2 sets' },
        { value: 'own3', label: 'Your own numbers: 3 sets' }] },
      { id: 't', label: 'Total asked', min: 1, max: 1000, step: 1, value: 600 },
      { id: 'a', label: 'n(A)', min: 0, max: 1000, step: 1, value: 400 },
      { id: 'b', label: 'n(B)', min: 0, max: 1000, step: 1, value: 300 },
      { id: 'c', label: 'n(C) (3 sets only)', min: 0, max: 1000, step: 1, value: 0 },
      { id: 'ab', label: 'n(A ∩ B)', min: 0, max: 1000, step: 1, value: 150 },
      { id: 'bc', label: 'n(B ∩ C) (3 sets only)', min: 0, max: 1000, step: 1, value: 0 },
      { id: 'ca', label: 'n(C ∩ A) (3 sets only)', min: 0, max: 1000, step: 1, value: 0 },
      { id: 'abc', label: 'n(A ∩ B ∩ C) (3 sets only)', min: 0, max: 1000, step: 1, value: 0 }
    ],
    buttons: [
      { label: 'Next step', primary: true, onClick: function (sim) { var S = solve(sim.p), bad = firstBad(S); if (st.step < S.R.length && (bad < 0 || st.step <= bad)) st.step++; } },
      { label: 'Fill all', onClick: function (sim) { var S = solve(sim.p), bad = firstBad(S); st.step = bad < 0 ? S.R.length : bad + 1; } },
      { label: 'Start again', onClick: function () { st.step = 0; } }
    ],
    readouts: [
      { id: 'step', label: 'Step', key: true },
      { id: 'none', label: 'In none', short: 'None', key: true },
      { id: 'u', label: 'At least one', short: '≥ 1' },
      { id: 'one', label: 'Exactly one' },
      { id: 'two', label: 'Exactly two' },
      { id: 'three', label: 'All three' }
    ],
    reset: function (sim) { st.step = 0; syncFromProb(sim); },
    onParam: function (sim, id) {
      if (id === 'prob') syncFromProb(sim);
      else if (prob(sim.p).v) sim.setParam('prob', 'own' + prob(sim.p).k);
      st.step = 0;
      return true;
    },
    readout: function (sim) {
      var S = solve(sim.p), done = st.step >= S.R.length, bad = firstBad(S);
      var f = function (v) { return done ? (v < 0 ? '−' + -v : String(v)) : '?'; };
      return { step: bad >= 0 && st.step > bad ? 'Impossible' : st.step + ' of ' + S.R.length, none: f(S.none), u: f(S.u), one: f(S.one), two: f(S.two), three: S.three == null ? '—' : f(S.three) };
    },
    status: function (sim) { var S = solve(sim.p); return st.step >= S.R.length ? 'Solved' : 'Step ' + st.step + ' of ' + S.R.length; },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, pr = prob(sim.p), S = solve(sim.p), L = layout(sim, pr.k), b = L.box;
      var cols = [c.s1, c.s2, c.s3], cur = st.step > 0 ? S.R[st.step - 1] : null, bad = firstBad(S), done = st.step >= S.R.length;
      D.clear(ctx, L.W, L.H, c.bg);
      D.roundRect(ctx, b.x, b.y, b.w, b.h, 10, D.alpha(c.ink, 0.03));
      // region being worked out now (or the whole union at the "at least one" step)
      if (cur && cur.inn) fillRegion(ctx, L, cur.inn, D.alpha(cur.v < 0 ? c.danger : c.warning, 0.4));
      if (cur && cur.id === 'u') S.R.forEach(function (q) { if (q.inn && q.id !== 'none') fillRegion(ctx, L, q.inn, D.alpha(c.warning, 0.3)); });
      D.roundRect(ctx, b.x, b.y, b.w, b.h, 10, null, D.alpha(c.ink, 0.45), 1.5);
      L.C.forEach(function (q, i) { ctx.beginPath(); ctx.arc(q.x, q.y, L.r, 0, Math.PI * 2); ctx.strokeStyle = cols[i]; ctx.lineWidth = 2.5; ctx.stroke(); });
      L.lab.forEach(function (q, i) { D.text(ctx, pr.L[i], q.x, q.y, { color: cols[i], size: L.wide ? 22 : 17, weight: 800, align: 'center' }); });
      D.text(ctx, 'U: ' + sim.p.t + ' ' + pr.who, b.x + 8, b.y + 12, { color: c.muted, size: L.wide ? 13 : 11, weight: 700 });

      // numbers in the regions that are filled so far
      S.R.forEach(function (q, i) {
        if (!q.inn) return;
        var p = L.pos[q.id], filled = i < st.step, now = q === cur, neg = q.v < 0;
        var txt = filled ? (q.id === 'none' ? 'None: ' : '') + (neg ? '−' + -q.v : q.v) : '?';
        D.text(ctx, txt, p.x, p.y, { color: neg && filled ? c.danger : now ? c.ink : filled ? c.ink : c.faint || c.muted, size: L.fs * (now ? 1.15 : 1), weight: filled ? 800 : 500, align: q.id === 'none' ? 'right' : 'center', bg: filled ? D.alpha(c.bg, 0.7) : null, pad: 2 });
      });

      // working
      var pn = L.panel, rows = [], legend = pr.L.map(function (l, i) { return l + ' = ' + pr.N[i]; }).join(' · ');
      if (L.wide) D.roundRect(ctx, pn.x, pn.y, pn.w, pn.h, 10, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.12));
      var big = L.wide ? 2 : 1;
      if (L.wide || !cur) rows.push({ t: pr.text, color: c.muted, size: 12 + big, gap: 4 });
      if (pr.L[0] !== 'A') rows.push({ t: legend, color: c.ink, size: 11.5 + big, weight: 700, gap: 6 });
      if (!cur) rows.push({ t: 'Press Next step. Start in the middle, where the most circles overlap, and work outwards.', color: c.accent, size: 12.5 + big, weight: 700 });
      else if (bad >= 0 && st.step > bad) {
        rows.push({ t: 'Step ' + st.step + ': ' + cur.title, color: c.danger, size: 13 + big, weight: 800 },
          { t: cur.work, color: c.danger, size: 12 + big, weight: 700 },
          { t: '✗ A count cannot be negative, so these survey numbers cannot all be true. One of them must be wrong.', color: c.danger, size: 12 + big, weight: 700 });
      } else {
        rows.push({ t: 'Step ' + st.step + ' of ' + S.R.length + ': ' + cur.title, color: c.warning, size: 13 + big, weight: 800 },
          { t: cur.work, color: c.ink, size: 12 + big, weight: 700, gap: 4 });
        if (done) {
          rows.push({ t: 'Exactly one: ' + S.one + '   Exactly two: ' + S.two + (S.three != null ? '   All three: ' + S.three : ''), color: c.success, size: 12 + big, weight: 700 },
            { t: 'At least one: ' + S.u + '   None: ' + S.none, color: c.success, size: 12 + big, weight: 700 });
        }
      }
      rowsText(ctx, rows, pn.x + (L.wide ? 12 : 2), pn.y + (L.wide ? 12 : 2), pn.w - (L.wide ? 24 : 4), pn.y + pn.h - 8);
    }
  });
})();
