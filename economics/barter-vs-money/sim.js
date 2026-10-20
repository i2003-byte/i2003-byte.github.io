/* =====================================================================
   Economics · Money and credit · Barter vs Money — sim.js
   ---------------------------------------------------------------------
   Two identical villages. Each trader makes one good and wants one
   different good (every good is wanted by exactly one person).
   Every market hour the traders split into random pairs, and the SAME
   pairs meet in both villages, so the comparison is fair.
     Barter village: a swap happens only if A has what B wants AND B has
       what A wants (double coincidence of wants). Traders who swap get
       what they wanted and go home.
     Money village: everyone starts with one ₹ note worth one good. If A
       meets the maker of what A wants, A pays and gets it. The seller
       keeps the note and can spend it later. Money is accepted by all,
       so only ONE side of the coincidence is needed.
   The "Who wants what" choice sets the pattern of wants:
     pairs  — everyone has a perfect swap partner (barter works)
     random — a random pattern (usually only a few perfect pairs)
     circle — A wants B's good, B wants C's, … (no pair can ever swap)
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOUR = 0.9;           // seconds of sim time per market hour
  var GOODS = [
    { n: 'rice', who: 'farmer', c: '#f5f5f4' }, { n: 'cloth', who: 'weaver', c: '#60a5fa' },
    { n: 'shoes', who: 'cobbler', c: '#a16207' }, { n: 'pots', who: 'potter', c: '#ea580c' },
    { n: 'milk', who: 'dairy', c: '#e0f2fe' }, { n: 'fish', who: 'fisher', c: '#0ea5e9' },
    { n: 'oil', who: 'oil press', c: '#facc15' }, { n: 'tools', who: 'smith', c: '#94a3b8' },
    { n: 'veg', who: 'gardener', c: '#22c55e' }, { n: 'bangles', who: 'bangle maker', c: '#ec4899' }
  ];
  var village = 1, hourLimit = 40;

  function ink(hex) {
    var n = parseInt(hex.slice(1), 16), l = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
    return l > 150 ? '#0f172a' : '#ffffff';
  }
  function shuffle(a, rnd) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // want[i] = index of the trader whose good i wants (never i itself)
  function makeWants(N, mode, rnd) {
    var order = shuffle(Array.from({ length: N }, function (_, i) { return i; }), rnd), w = new Array(N), k;
    if (mode === 'pairs') {
      for (k = 0; k + 1 < N; k += 2) { w[order[k]] = order[k + 1]; w[order[k + 1]] = order[k]; }
      if (N % 2) { var a = order[N - 3], b = order[N - 2], c = order[N - 1]; w[a] = b; w[b] = c; w[c] = a; } // odd: one trio
    } else if (mode === 'circle') {
      for (k = 0; k < N; k++) w[order[k]] = order[(k + 1) % N];
    } else {
      do { var p = shuffle(order.slice(), rnd); for (k = 0; k < N; k++) w[k] = p[k]; }
      while (w.some(function (v, i) { return v === i; }));
    }
    return w;
  }
  function mutualPairs(st) {
    var n = 0, w = st.want;
    for (var i = 0; i < w.length; i++) if (w[w[i]] === i && i < w[i]) n++;
    return n;
  }
  function barterStuck(st) {
    var b = st.b, w = st.want;
    for (var i = 0; i < w.length; i++) if (!b.done[i] && !b.done[w[i]] && w[w[i]] === i) return false;
    return true;
  }
  function count(a) { return a.filter(Boolean).length; }

  function doHour(sim) {
    var st = sim.state, N = sim.p.n, w = st.want, rnd = st.rnd;
    st.hour++;
    var order = shuffle(Array.from({ length: N }, function (_, i) { return i; }), rnd), meets = [];
    for (var k = 0; k + 1 < N; k += 2) meets.push([order[k], order[k + 1]]);
    st.meets = meets.map(function (m) {
      var i = m[0], j = m[1], b = st.b, mo = st.m, res = { i: i, j: j, bOk: false, bTried: false, mBuy: [] };
      // barter
      if (!b.done[i] && !b.done[j]) {
        res.bTried = true;
        if (w[i] === j && w[j] === i) {
          b.done[i] = b.done[j] = true; res.bOk = true; st.bTrades++;
          st.flights.push({ v: 'b', from: i, to: j, g: i, t: sim.time }, { v: 'b', from: j, to: i, g: j, t: sim.time });
        } else st.bFail++;
      }
      // money: each side may buy from the other
      [[i, j], [j, i]].forEach(function (q) {
        var buyer = q[0], seller = q[1];
        if (!mo.done[buyer] && w[buyer] === seller && !mo.sold[seller] && mo.coins[buyer] > 0) {
          mo.done[buyer] = true; mo.sold[seller] = true; mo.coins[buyer]--; mo.coins[seller]++; st.mTrades++;
          res.mBuy.push(buyer);
          st.flights.push({ v: 'm', from: seller, to: buyer, g: seller, t: sim.time }, { v: 'm', from: buyer, to: seller, coin: true, t: sim.time });
        }
      });
      return res;
    });
    st.meetT = sim.time;
    if (sim.graph) sim.graph.push(st.hour, [count(st.b.done), count(st.m.done)]);
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, sm = W < 560, side = W / H >= 1.4, m = sm ? 6 : 12;
    var panels = side
      ? [{ x: m, y: m, w: W / 2 - 1.5 * m, h: H - 2 * m }, { x: W / 2 + m / 2, y: m, w: W / 2 - 1.5 * m, h: H - 2 * m }]
      : [{ x: m, y: m, w: W - 2 * m, h: H / 2 - 1.5 * m }, { x: m, y: H / 2 + m / 2, w: W - 2 * m, h: H / 2 - 1.5 * m }];
    return { W: W, H: H, sm: sm, panels: panels };
  }
  function positions(P, N, sm) {
    var top = sm ? 30 : 48, cx = P.x + P.w / 2, cy = P.y + top + (P.h - top) / 2;
    var rx = P.w / 2 - (sm ? 34 : 52), ry = (P.h - top) / 2 - (sm ? 22 : 44), out = [];
    for (var i = 0; i < N; i++) {
      var a = -Math.PI / 2 + i / N * Math.PI * 2;
      out.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
    }
    return { pts: out, cx: cx, cy: cy, r: Math.max(9, Math.min(sm ? 15 : 22, Math.min(rx, ry) * Math.PI / N * 0.62, P.h * 0.08)) };
  }

  SimLab.createSim({
    ariaLabel: 'Two village markets side by side with the same traders: in the barter village people swap only when each has what the other wants; in the money village people pay with rupee notes. Lines show who meets each hour and whether a trade happens',
    mobileAspect: '3 / 4',
    playLabel: 'Open the market',
    params: [
      { id: 'n', label: 'Number of traders', min: 4, max: 10, step: 1, value: 8 },
      { id: 'wants', label: 'Who wants what', type: 'select', value: 'random', options: [
        { value: 'random', label: 'Random wants (a real village)' },
        { value: 'pairs', label: 'Perfect pairs (each has a swap partner)' },
        { value: 'circle', label: 'A circle (A wants B’s, B wants C’s …)' }] },
      { id: 'hours', label: 'Market hours', min: 10, max: 60, step: 1, value: 40, unit: 'h' }
    ],
    buttonsTitle: 'Village',
    buttons: [
      { label: 'New village (shuffle the wants)', primary: true, full: true, onClick: function (sim) { village++; sim.reset(); sim.play(); } }
    ],
    readouts: [
      { id: 'bSat', label: 'Barter: got what they wanted', key: true, short: 'Barter ✓' },
      { id: 'mSat', label: 'Money: got what they wanted', key: true, short: 'Money ✓' },
      { id: 'hour', label: 'Market hours passed', key: true, short: 'Hours' },
      { id: 'pairs', label: 'Perfect swap pairs in the village' },
      { id: 'bFail', label: 'Barter meetings with no deal' },
      { id: 'mTrades', label: 'Sales for money' }
    ],
    graph: { title: 'Traders who got what they wanted', xLabel: 'market hours', yLabel: 'people', yMin: 0,
      xMax: function () { return hourLimit; }, series: [{ label: 'barter village' }, { label: 'money village' }] },

    reset: function (sim) {
      var N = sim.p.n, rnd = M.rng(village * 7919 + N * 131 + { random: 1, pairs: 2, circle: 3 }[sim.p.wants] * 17);
      hourLimit = sim.p.hours;
      sim.state = {
        rnd: rnd, want: makeWants(N, sim.p.wants, rnd), hour: 0, clock: HOUR * 0.6, meets: [], meetT: -9, flights: [],
        b: { done: new Array(N).fill(false) },
        m: { done: new Array(N).fill(false), sold: new Array(N).fill(false), coins: new Array(N).fill(1) },
        bTrades: 0, bFail: 0, mTrades: 0
      };
      if (sim.graph) sim.graph.push(0, [0, 0]);
    },
    update: function (sim, dt) {
      var st = sim.state;
      st.clock += dt;
      if (st.clock >= HOUR) { st.clock -= HOUR; doHour(sim); }
    },
    finished: function (sim) {
      var st = sim.state;
      return st.hour >= sim.p.hours || (count(st.m.done) === sim.p.n && barterStuck(st) && sim.time - st.meetT > HOUR * 0.8);
    },
    animate: function (sim) { return !reduce && sim.time - sim.state.meetT < HOUR; },
    status: function (sim) {
      var st = sim.state, N = sim.p.n, b = count(st.b.done), m = count(st.m.done);
      if (!st.hour) return 'Press Open the market. The same pairs of traders meet in both villages each hour';
      if (m === N && barterStuck(st)) return b === N ? 'Both villages done: everyone got what they wanted' : 'Money village done in ' + st.hour + ' h. Barter is stuck: ' + (N - b) + ' traders can never find a swap partner';
      return 'Hour ' + st.hour + ': barter ' + b + ' of ' + N + ', money ' + m + ' of ' + N + ' have what they want';
    },
    readout: function (sim) {
      var st = sim.state, N = sim.p.n;
      return {
        bSat: count(st.b.done) + ' of ' + N, mSat: count(st.m.done) + ' of ' + N, hour: st.hour + ' h',
        pairs: mutualPairs(st) + (mutualPairs(st) === 1 ? ' pair' : ' pairs') + ' (' + mutualPairs(st) * 2 + ' of ' + N + ' traders)',
        bFail: st.bFail, mTrades: st.mTrades
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, col = sim.colors, st = sim.state, N = sim.p.n, L = layout(sim), sm = L.sm, w = st.want;
      D.clear(ctx, L.W, L.H, col.bg);
      var fade = reduce ? (sim.time - st.meetT < HOUR ? 1 : 0) : M.clamp(1 - (sim.time - st.meetT) / HOUR, 0, 1);
      ['b', 'm'].forEach(function (v, pi) {
        var P = L.panels[pi], pos = positions(P, N, sm), R = pos.r, isM = v === 'm', V = st[v];
        D.roundRect(ctx, P.x, P.y, P.w, P.h, 10, col.light ? 'rgba(15,23,42,0.035)' : 'rgba(255,255,255,0.035)', col.border, 1);
        var title = isM ? (sm ? 'Money village (₹ notes)' : 'Money village: pay with ₹ notes') : (sm ? 'Barter village (swap only)' : 'Barter village: swap goods only');
        D.text(ctx, title, P.x + 10, P.y + (sm ? 11 : 15), { color: col.text, size: sm ? 10.5 : 13.5, weight: 800, fit: P.x + P.w });
        D.text(ctx, count(V.done) + '/' + N + ' ✓', P.x + P.w - 8, P.y + (sm ? 11 : 15), { color: col.success, size: sm ? 10.5 : 13.5, weight: 800, align: 'right' });
        // meeting lines for this hour
        if (fade > 0) st.meets.forEach(function (mt) {
          var a = pos.pts[mt.i], b = pos.pts[mt.j], ok = isM ? mt.mBuy.length > 0 : mt.bOk, tried = isM ? true : mt.bTried;
          if (!tried) return;
          ctx.save(); ctx.globalAlpha = fade;
          var idle = isM && !ok;
          D.line(ctx, a.x, a.y, b.x, b.y, ok ? col.success : idle ? col.faint : col.danger, ok ? 3 : 1.5, ok ? null : [5, 4]);
          if (!ok && !idle) D.text(ctx, '✗', (a.x + b.x) / 2, (a.y + b.y) / 2, { color: col.danger, size: sm ? 12 : 15, weight: 800, align: 'center', bg: col.bg, pad: 1 });
          ctx.restore();
        });
        // traders
        for (var i = 0; i < N; i++) {
          var p = pos.pts[i], done = V.done[i], g = GOODS[i], held = isM ? (V.sold[i] ? null : g) : (done ? null : g), got = GOODS[w[i]];
          var tx = p.y < pos.cy ? -1 : 1;
          // ring and body
          D.circle(ctx, p.x, p.y, R + 3, null, done ? col.success : col.border, done ? 2.5 : 1);
          if (held) {
            D.circle(ctx, p.x, p.y, R, held.c, '#00000033', 1);
            D.text(ctx, held.n, p.x, p.y + 0.5, { color: ink(held.c), size: Math.max(7.5, Math.min(12, R * 0.62 * (held.n.length > 5 ? 0.8 : 1))), weight: 800, align: 'center' });
          } else D.circle(ctx, p.x, p.y, R, col.light ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.06)', col.faint, 1);
          // what they want, or what they got
          var lab = done ? '✓ ' + got.n : 'wants ' + got.n, ly = p.y + tx * (R + (sm ? 10 : 13));
          D.text(ctx, lab, p.x, ly, { color: done ? col.success : col.muted, size: sm ? 9 : 11.5, weight: 700, align: 'center', fit: L.W });
          if (!sm) D.text(ctx, g.who, p.x, ly + tx * 13, { color: col.faint, size: 10, align: 'center', fit: L.W });
          if (isM) for (var c = 0; c < V.coins[i]; c++) {
            var cx = p.x + R + 5 + c * 5, cy = p.y - R * 0.6 + c * 2;
            D.circle(ctx, cx, cy, sm ? 4.5 : 6, '#fbbf24', '#92400e', 1);
            if (!sm && c === V.coins[i] - 1) D.text(ctx, '₹', cx, cy + 0.5, { color: '#78350f', size: 8, weight: 800, align: 'center' });
          }
        }
        // goods and notes moving between traders
        st.flights.forEach(function (f) {
          if (f.v !== v) return;
          var k = reduce ? 1 : M.clamp((sim.time - f.t) / (HOUR * 0.6), 0, 1);
          if (k >= 1) return;
          var a = pos.pts[f.from], b = pos.pts[f.to], x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
          if (f.coin) D.circle(ctx, x, y, sm ? 5 : 7, '#fbbf24', '#92400e', 1.2);
          else { var gd = GOODS[f.g]; D.roundRect(ctx, x - (sm ? 14 : 19), y - (sm ? 7 : 9), sm ? 28 : 38, sm ? 14 : 18, 5, gd.c, '#00000055', 1); D.text(ctx, gd.n, x, y + 0.5, { color: ink(gd.c), size: sm ? 8 : 10, weight: 800, align: 'center' }); }
        });
        st.flights = st.flights.filter(function (f) { return sim.time - f.t < HOUR; });
      });
    }
  });
})();
