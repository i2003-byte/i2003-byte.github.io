/* =====================================================================
   Economics · Money and credit · Formal vs Informal Credit — sim.js
   ---------------------------------------------------------------------
   A small farmer needs ₹50,000 at sowing time (June) for seed, fertiliser
   and pump diesel. The crop is sold and the loan repaid at the end of the
   year. Six years are followed, for five lenders at once:
     cooperative 7 %/yr, bank 9 %/yr (both need collateral: land papers),
     self-help group 1.5 %/month, moneylender 3 % or 5 %/month (no collateral).
   Each year:  own = min(savings, 50,000), borrow = 50,000 − own
               owed at year end = (old debt + borrow) × (1 + r)
               (simple monthly interest inside the year; unpaid debt rolls
               over and earns interest again next year → compounding)
               money in = crop sale − family spending + savings left
               pay what is owed; the shortfall becomes next year's old debt.
   Crop sale: good ₹1,10,000 · normal ₹90,000 · drought ₹30,000
   (one sack ≈ ₹10,000). Numbers are made up but in a realistic range.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var YEARS = 6, YEAR = 2.6, NEED = 50000;
  var MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  var LENDERS = [
    { id: 'coop', name: 'Cooperative society', short: 'Co-op 7%', r: 0.07, coll: true, color: '#22c55e', terms: '7% a year · needs land papers' },
    { id: 'bank', name: 'Bank', short: 'Bank 9%', r: 0.09, coll: true, color: '#38bdf8', terms: '9% a year · needs land papers' },
    { id: 'shg', name: 'Self-help group', short: 'SHG 18%', r: 0.18, coll: false, color: '#a78bfa', terms: '1.5% a month (18% a year) · no collateral' },
    { id: 'ml3', name: 'Moneylender (3% a month)', short: 'Lender 36%', r: 0.36, coll: false, color: '#f59e0b', terms: '3% a month (36% a year) · no collateral' },
    { id: 'ml5', name: 'Moneylender (5% a month)', short: 'Lender 60%', r: 0.60, coll: false, color: '#ef4444', terms: '5% a month (60% a year) · no collateral' }
  ];
  var SACKS = { good: 11, normal: 9, bad: 3 };
  var PATTERNS = {
    normal: ['normal', 'normal', 'normal', 'normal', 'normal', 'normal'],
    good: ['good', 'normal', 'normal', 'normal', 'normal', 'normal'],
    drought1: ['bad', 'normal', 'normal', 'normal', 'normal', 'normal'],
    drought2: ['bad', 'normal', 'normal', 'bad', 'normal', 'normal']
  };
  var HNAME = { good: 'good', normal: 'normal', bad: 'drought' };

  function rs(v) { return (v < 0 ? '−₹' : '₹') + Math.round(Math.abs(v)).toLocaleString('en-IN'); }
  function rsShort(v) {
    var a = Math.abs(v), s = v < 0 ? '−₹' : '₹';
    if (a >= 1e5) return s + M.fmt(a / 1e5, a >= 1e6 ? 0 : 1) + ' L';
    if (a >= 1e3) return s + Math.round(a / 1e3) + 'k';
    return s + Math.round(a);
  }
  function lender(id) { for (var i = 0; i < LENDERS.length; i++) if (LENDERS[i].id === id) return LENDERS[i]; return LENDERS[0]; }
  function allowed(L, p) { return p.land || !L.coll; }

  // Year-by-year plan for one lender: start-of-year and end-of-year figures.
  function plan(L, p) {
    var pat = PATTERNS[p.pattern] || PATTERNS.normal, sav = 0, debt = 0, paidInt = 0, yrs = [];
    for (var y = 0; y < YEARS; y++) {
      var own = Math.min(sav, NEED), borrow = NEED - own, savLeft = sav - own;
      var base = debt + borrow, owed = base * (1 + L.r), sale = SACKS[pat[y]] * 10000;
      var money = sale - p.family + savLeft, ySav, yDebt;
      if (money >= owed) { ySav = money - owed; yDebt = 0; } else { ySav = 0; yDebt = owed - money; }
      // family spending can push money below zero only in a terrible year: then it becomes debt too
      yrs.push({ old: debt, borrow: borrow, own: own, base: base, owed: owed, interest: base * L.r, sale: sale,
        savStart: savLeft, savEnd: ySav, debtEnd: yDebt, harvest: pat[y], intBefore: paidInt });
      paidInt += base * L.r; sav = ySav; debt = yDebt;
    }
    return yrs;
  }
  // State of a lender's farmer at time t (years)
  function at(yrs, t) {
    if (t <= 0) return { debt: 0, sav: 0, interest: 0 };
    var y = Math.min(YEARS - 1, Math.floor(t - 1e-9)), f = t - y, Y = yrs[y];
    if (f >= 1 - 1e-9) return { debt: Y.debtEnd, sav: Y.savEnd, interest: Y.intBefore + Y.interest };
    var m = Math.floor(f * 12) / 12;          // interest is added month by month
    return { debt: Y.base + Y.interest * m, sav: Y.savStart, interest: Y.intBefore + Y.interest * m };
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W >= 640, sm = W < 560;
    if (wide) {
      var sw = Math.round(W * 0.4);
      return { W: W, H: H, sm: sm, wide: true, scene: { x: 10, y: 10, w: sw - 15, h: Math.round(H * 0.52) },
        card: { x: 10, y: Math.round(H * 0.52) + 18, w: sw - 15, h: H - Math.round(H * 0.52) - 28 },
        chart: { x: sw + 8, y: 12, w: W - sw - 18, h: H - 24 } };
    }
    var top = sm ? 34 : 40, shH = Math.round((H - top) * 0.36);
    return { W: W, H: H, sm: sm, wide: false, top: top, scene: { x: 6, y: top, w: W - 12, h: shH },
      chart: { x: 6, y: top + shH + 8, w: W - 12, h: H - top - shH - 12 } };
  }

  function drawScene(sim, R, Y, f, now) {
    var ctx = sim.ctx, col = sim.colors, m = f * 12, bad = Y && Y.harvest === 'bad';
    ctx.save();
    D.roundRect(ctx, R.x, R.y, R.w, R.h, 10, null); ctx.clip();
    var ground = R.y + R.h * 0.62;
    var sky = ctx.createLinearGradient(0, R.y, 0, ground);
    if (bad && m < 6) { sky.addColorStop(0, col.light ? '#fde68a' : '#78350f'); sky.addColorStop(1, col.light ? '#fef3c7' : '#451a03'); }
    else { sky.addColorStop(0, col.light ? '#bae6fd' : '#0c4a6e'); sky.addColorStop(1, col.light ? '#e0f2fe' : '#082f49'); }
    ctx.fillStyle = sky; ctx.fillRect(R.x, R.y, R.w, ground - R.y);
    ctx.fillStyle = bad ? (col.light ? '#c2a172' : '#5b4630') : (col.light ? '#a3c585' : '#2f4a23');
    ctx.fillRect(R.x, ground, R.w, R.y + R.h - ground);
    var s = Math.min(R.w, R.h);
    // sun, and monsoon rain from June to September in a normal or good year
    D.circle(ctx, R.x + R.w - s * 0.16, R.y + s * 0.15, s * (bad ? 0.1 : 0.065), bad ? '#fb923c' : '#facc15');
    if (Y && !bad && m < 4) {
      ctx.fillStyle = col.light ? '#475569' : '#94a3b8';
      D.roundRect(ctx, R.x + R.w * 0.42, R.y + s * 0.07, R.w * 0.3, s * 0.12, s * 0.06, col.light ? '#94a3b8' : '#475569');
      ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (var k = 0; k < 9; k++) {
        var rx = R.x + R.w * 0.44 + (k / 9) * R.w * 0.27, ry = R.y + s * 0.2 + ((now / 6 + k * 23) % (ground - R.y - s * 0.2));
        ctx.moveTo(rx, ry); ctx.lineTo(rx - 2, ry + 6);
      }
      ctx.stroke();
    }
    if (bad) { // cracks in dry soil
      ctx.strokeStyle = col.light ? '#8b6b43' : '#3b2a1a'; ctx.lineWidth = 1; ctx.beginPath();
      for (var c = 0; c < 6; c++) { var cx = R.x + R.w * (0.1 + c * 0.16), cy = ground + (R.y + R.h - ground) * 0.55; ctx.moveTo(cx, cy); ctx.lineTo(cx + 8, cy - 5); ctx.lineTo(cx + 14, cy + 3); }
      ctx.stroke();
    }
    // hut
    var hx = R.x + R.w * 0.04, hw = s * 0.22, hh = s * 0.16;
    ctx.fillStyle = col.light ? '#d6a46c' : '#92643a'; ctx.fillRect(hx, ground - hh, hw, hh);
    ctx.fillStyle = col.light ? '#a16207' : '#713f12'; ctx.beginPath(); ctx.moveTo(hx - 4, ground - hh); ctx.lineTo(hx + hw / 2, ground - hh - s * 0.1); ctx.lineTo(hx + hw + 4, ground - hh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col.light ? '#57351a' : '#2a1a0c'; ctx.fillRect(hx + hw * 0.4, ground - hh * 0.6, hw * 0.22, hh * 0.6);
    // the field: crop grows Jun–Oct, harvested in Nov, sacks sold by May
    var fx0 = hx + hw + s * 0.08, fx1 = R.x + R.w - 8, rows = Math.max(5, Math.floor((fx1 - fx0) / 13));
    if (Y && m < 5.5) {
      var g = M.clamp(m / 4.5, 0.08, 1) * (bad ? 0.45 : Y.harvest === 'good' ? 1 : 0.85), ph = (R.y + R.h - ground) * 0.3 + s * 0.28 * g;
      for (var i = 0; i < rows; i++) {
        var px = fx0 + (i + 0.5) * (fx1 - fx0) / rows, base = R.y + R.h - 6;
        ctx.strokeStyle = bad ? (m > 2 ? '#a16207' : '#84cc16') : (m > 4 ? '#ca8a04' : '#16a34a'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px, base); ctx.lineTo(px, base - ph); ctx.stroke();
        for (var l = 1; l <= 3; l++) { var ly = base - ph * l / 4; ctx.beginPath(); ctx.moveTo(px, ly); ctx.quadraticCurveTo(px + 5, ly - 4, px + 7, ly - (bad ? -2 : 6)); ctx.moveTo(px, ly - 3); ctx.quadraticCurveTo(px - 5, ly - 7, px - 7, ly - (bad ? 1 : 9)); ctx.stroke(); }
        if (m > 3.5 && !bad) D.circle(ctx, px, base - ph - 2, 2.5, '#eab308');
      }
    } else if (Y) {
      var n = SACKS[Y.harvest], sk = Math.min(16, (fx1 - fx0) / 7), sold = f >= 0.999;
      for (var j = 0; j < n; j++) {
        var row = Math.floor(j / 6), sx = fx0 + (j % 6) * sk * 1.15 + row * sk * 0.55, sy = R.y + R.h - 6 - row * sk * 0.95;
        D.roundRect(ctx, sx, sy - sk, sk, sk, sk * 0.3, sold ? D.alpha('#e5d3a8', 0.35) : '#e5d3a8', '#a8865a', 1);
      }
      D.text(ctx, n + ' sacks × ₹10,000', fx0, R.y + R.h - 12 - Math.ceil(n / 6) * sk - 4, { color: col.light ? '#1e293b' : '#f8fafc', size: 11, weight: 700, bg: D.alpha(col.bg, 0.7), fit: R.x + R.w });
    }
    ctx.restore();
    D.roundRect(ctx, R.x + 0.5, R.y + 0.5, R.w - 1, R.h - 1, 10, null, col.border, 1);
    var lab = Y ? 'Year ' + (Math.min(YEARS - 1, Math.floor(sim.state.t - 1e-9)) + 1) + ' · ' + MONTHS[Math.min(11, Math.floor(m))] + ' · ' + HNAME[Y.harvest] + ' harvest' : 'Before sowing';
    D.text(ctx, lab, R.x + 8, R.y + 14, { color: col.text, size: 11.5, weight: 800, bg: D.alpha(col.bg, 0.75) });
  }

  function drawChart(sim, R, chosen) {
    var ctx = sim.ctx, col = sim.colors, p = sim.p, t = sim.state.t, sm = sim.width < 560, plans = sim.state.plans;
    var lo = 0, hi = 10000;
    LENDERS.forEach(function (L) {
      if (!allowed(L, p)) return;
      plans[L.id].forEach(function (Y) { lo = Math.min(lo, -Y.owed, -Y.debtEnd); hi = Math.max(hi, Y.savEnd); });
    });
    lo = Math.max(lo * 1.05, -200000); hi = hi * 1.12 + 4000;   // far-off debts run off the bottom
    var lw = sm ? 40 : 52, rw = sm ? 62 : 122, X0 = R.x + lw, X1 = R.x + R.w - rw, T0 = R.y + 20, B0 = R.y + R.h - (sm ? 26 : 30);
    var X = function (tt) { return X0 + tt / YEARS * (X1 - X0); }, Yv = function (v) { return B0 - (v - lo) / (hi - lo) * (B0 - T0); };
    D.text(ctx, sm ? 'Savings − debt, all lenders' : 'Savings minus debt for each lender (same farm, same weather)', R.x + 2, R.y + 6, { color: col.text, size: sm ? 11 : 12.5, weight: 800 });
    var step = D.niceStep(hi - lo, sm ? 4 : 6);
    ctx.save(); ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
    for (var v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      var gy = Math.round(Yv(v)) + 0.5; ctx.beginPath(); ctx.moveTo(X0, gy); ctx.lineTo(X1, gy); ctx.stroke();
      D.text(ctx, rsShort(v), X0 - 4, gy, { color: col.muted, size: sm ? 8.5 : 10, align: 'right' });
    }
    ctx.restore();
    ctx.fillStyle = D.alpha(col.danger, 0.07); ctx.fillRect(X0, Yv(0), X1 - X0, B0 - Yv(0));
    D.line(ctx, X0, Yv(0), X1, Yv(0), col.axis, 1.4);
    D.text(ctx, 'in debt', X0 + 4, B0 - 8, { color: col.danger, size: sm ? 9 : 10.5, weight: 700 });
    D.text(ctx, 'saving', X0 + 4, Math.max(T0 + 6, Yv(0) - 9), { color: col.success, size: sm ? 9 : 10.5, weight: 700 });
    var pat = PATTERNS[p.pattern] || PATTERNS.normal;
    for (var y = 0; y < YEARS; y++) {
      var xm = X((y + 0.5));
      D.line(ctx, X(y + 1), T0, X(y + 1), B0, D.alpha(col.grid, 0.8), 1, [3, 4]);
      D.text(ctx, (sm ? 'Y' : 'Year ') + (y + 1), xm, B0 + 9, { color: col.muted, size: sm ? 9 : 10.5, weight: 600, align: 'center' });
      D.text(ctx, HNAME[pat[y]], xm, B0 + (sm ? 19 : 22), { color: pat[y] === 'bad' ? col.danger : pat[y] === 'good' ? col.success : col.faint, size: sm ? 8.5 : 10, weight: pat[y] === 'normal' ? 500 : 800, align: 'center' });
    }
    // lines (chosen one last, thick)
    var ends = [], order = LENDERS.filter(function (L) { return allowed(L, p); });
    order.sort(function (a, b) { return (a.id === chosen.id) - (b.id === chosen.id); });
    order.forEach(function (L) {
      var yrs = plans[L.id], me = L.id === chosen.id, steps = Math.max(2, Math.ceil(t * 48));
      ctx.save(); ctx.beginPath(); ctx.rect(X0, T0 - 4, X1 - X0 + 6, B0 - T0 + 4); ctx.clip(); ctx.strokeStyle = me ? L.color : D.alpha(L.color, 0.55); ctx.lineWidth = me ? 3.2 : 1.6; ctx.lineJoin = 'round'; ctx.beginPath();
      ctx.moveTo(X(0), Yv(0));
      for (var i = 1; i <= steps; i++) {
        var tt = Math.min(t, i / 48), yb = Math.round(tt);
        // at the end of a year: full year's interest, then the jump when the crop is sold
        if (yb >= 1 && Math.abs(tt - yb) < 1e-9) {
          var e = yrs[yb - 1], nx = yrs[yb];
          ctx.lineTo(X(tt), Yv(e.savStart - e.owed));
          // crop sold, loan repaid and, if the run goes on, the next sowing loan taken at once
          ctx.lineTo(X(tt), Yv(nx && tt < t ? nx.savStart - nx.base : e.savEnd - e.debtEnd));
          continue;
        }
        var s = at(yrs, tt); ctx.lineTo(X(tt), Yv(s.sav - s.debt));
      }
      ctx.stroke(); ctx.restore();
      if (t > 0) {
        var sN = at(yrs, t), yy = Yv(sN.sav - sN.debt), off = yy > B0;
        ends.push({ L: L, y: Math.min(yy, B0), v: sN.sav - sN.debt, me: me });
        if (off) D.arrow(ctx, X(t), B0 - 14, X(t), B0, L.color, 2, 6); else D.circle(ctx, X(t), yy, me ? 4.5 : 3, L.color);
      }
    });
    // labels at the right, pushed apart so they don't overlap
    var gap = sm ? 11 : 13;
    ends.sort(function (a, b) { return a.y - b.y; });
    for (var k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < gap) ends[k].y = ends[k - 1].y + gap;
    var over = ends.length ? ends[ends.length - 1].y - (B0 + 6) : 0;
    if (over > 0) ends.forEach(function (e) { e.y -= over; });
    ends.forEach(function (e) {
      D.text(ctx, e.L.short, X1 + 6, e.y, { color: e.L.color, size: sm ? 8.5 : 10.5, weight: e.me ? 800 : 600 });
      if (!sm) D.text(ctx, rsShort(e.v), R.x + R.w - 2, e.y, { color: e.me ? col.text : col.muted, size: 10, weight: e.me ? 800 : 500, align: 'right' });
    });
    if (!p.land) D.text(ctx, 'Co-op and bank: no land papers, so no loan', X1, T0 + 2, { color: col.muted, size: sm ? 8.5 : 10, weight: 600, align: 'right', bg: D.alpha(col.bg, 0.8) });
    if (t <= 0) D.text(ctx, 'Press Start the seasons', (X0 + X1) / 2, (T0 + B0) / 2, { color: col.faint, size: sm ? 11 : 13, weight: 700, align: 'center' });
  }

  function drawCard(sim, R, chosen, Y, s) {
    var ctx = sim.ctx, col = sim.colors, ok = allowed(chosen, sim.p);
    D.roundRect(ctx, R.x, R.y, R.w, R.h, 10, col.surface2, col.border, 1);
    var x = R.x + 12, y = R.y + 16, fs = R.h < 150 ? 11 : 12.5, lh = fs + (R.h < 150 ? 4 : 7);
    D.text(ctx, chosen.name, x, y, { color: chosen.color, size: fs + 2, weight: 800 }); y += lh + 2;
    D.text(ctx, chosen.terms, x, y, { color: col.muted, size: fs - 1, weight: 600, fit: R.x + R.w }); y += lh + 2;
    if (!ok) {
      D.text(ctx, 'LOAN REFUSED', x, y + 6, { color: col.danger, size: fs + 4, weight: 800 }); y += lh + 10;
      D.text(ctx, 'No land papers to pledge as collateral.', x, y, { color: col.text, size: fs, weight: 600 }); y += lh;
      D.text(ctx, 'Try the SHG or a moneylender.', x, y, { color: col.text, size: fs, weight: 600 });
      return;
    }
    var rows = Y ? [
      ['Old debt carried in', rs(Y.old), col.text],
      ['Borrowed at sowing', rs(Y.borrow) + (Y.own > 0 ? ' (+' + rsShort(Y.own) + ' own)' : ''), col.text],
      ['Interest this year', rs(Y.interest), col.danger],
      ['Crop sold for', rs(Y.sale), col.success],
      ['Family spending', rs(sim.p.family), col.muted]
    ] : [['No loan yet', '', col.text]];
    rows.forEach(function (r) {
      if (y > R.y + R.h - lh * 1.6) return;
      D.text(ctx, r[0], x, y, { color: col.muted, size: fs, weight: 600 });
      D.text(ctx, r[1], R.x + R.w - 12, y, { color: r[2], size: fs, weight: 700, align: 'right' }); y += lh;
    });
    D.line(ctx, x, R.y + R.h - lh * 1.3, R.x + R.w - 12, R.y + R.h - lh * 1.3, col.border, 1);
    var net = s.sav - s.debt;
    D.text(ctx, s.debt > 0 ? 'Owes now' : 'Savings now', x, R.y + R.h - lh * 0.6, { color: col.text, size: fs + 1, weight: 800 });
    D.text(ctx, rs(Math.abs(net) || 0), R.x + R.w - 12, R.y + R.h - lh * 0.6, { color: net < 0 ? col.danger : col.success, size: fs + 2, weight: 800, align: 'right' });
  }

  function verdict(sim) {
    var L = lender(sim.p.lender);
    if (!allowed(L, sim.p)) return 'refused: no collateral';
    var yrs = sim.state.plans[L.id], last = yrs[YEARS - 1], mid = yrs[YEARS - 3];
    if (last.debtEnd > 0 && last.debtEnd >= mid.debtEnd) return 'debt trap: debt keeps growing';
    if (last.debtEnd > 0) return 'still in debt after 6 years';
    var free = 0; for (var i = 0; i < YEARS; i++) if (yrs[i].debtEnd > 0) free = i + 1;
    return free ? 'debt-free after year ' + (free + 1) : 'never behind on payments';
  }

  SimLab.createSim({
    ariaLabel: 'A small farm through six crop years: monsoon rain or drought, the crop growing and sacks of grain sold, with a card of the loan, interest and money left, and a chart comparing savings minus debt for a cooperative, a bank, a self-help group and two moneylenders',
    mobileAspect: '4 / 5',
    playLabel: 'Start the seasons',
    params: [
      { id: 'lender', label: 'Borrow from', type: 'select', value: 'ml3', options: LENDERS.map(function (L) { return { value: L.id, label: L.name + ' · ' + L.terms.split(' · ')[0] }; }) },
      { id: 'pattern', label: 'Weather', type: 'select', value: 'drought1', options: [
        { value: 'normal', label: 'Normal monsoon every year' },
        { value: 'good', label: 'Good harvest in year 1' },
        { value: 'drought1', label: 'Drought in year 1' },
        { value: 'drought2', label: 'Droughts in years 1 and 4' }] },
      { id: 'family', label: 'Family spending a year', min: 10000, max: 40000, step: 1000, value: 20000, unit: '₹',
        help: 'Food, school fees and medicine come out of the crop money before the loan is paid.' },
      { id: 'land', label: 'Has land papers to pledge (collateral)', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'owed', label: 'Owes the lender now', key: true, short: 'Owes' },
      { id: 'sav', label: 'Savings now', key: true, short: 'Savings' },
      { id: 'int', label: 'Interest charged so far', key: true, short: 'Interest' },
      { id: 'when', label: 'Season' },
      { id: 'rate', label: 'Yearly rate' },
      { id: 'verdict', label: 'After 6 years' }
    ],
    graph: { title: 'Money owed and savings (chosen lender)', xLabel: 'years', yLabel: '₹', xMax: function () { return YEARS; },
      series: [{ label: 'owed', color: '#ef4444' }, { label: 'savings', color: '#22c55e' }] },

    reset: function (sim) {
      var plans = {};
      LENDERS.forEach(function (L) { plans[L.id] = plan(L, sim.p); });
      sim.state = { t: 0, acc: 0, plans: plans };
      if (sim.graph) sim.graph.push(0, [0, 0]);
    },
    update: function (sim, dt) {
      var st = sim.state, L = lender(sim.p.lender);
      if (!allowed(L, sim.p)) { st.t = 0; return; }
      st.t = Math.min(YEARS, st.t + dt / YEAR);
      st.acc += dt;
      if (st.acc >= 1 / 30 || st.t >= YEARS) { st.acc = 0; var s = at(st.plans[L.id], st.t); sim.graph.push(st.t, [s.debt, s.sav]); }
    },
    finished: function (sim) { return sim.state.t >= YEARS || !allowed(lender(sim.p.lender), sim.p); },
    status: function (sim) {
      var L = lender(sim.p.lender), t = sim.state.t;
      if (!allowed(L, sim.p)) return 'The ' + L.name.toLowerCase() + ' will not lend without collateral. Choose the self-help group or a moneylender.';
      if (!t) return 'Press Start the seasons: the farmer borrows ₹50,000 at sowing time from the ' + L.name.toLowerCase();
      var s = at(sim.state.plans[L.id], t);
      if (t >= YEARS) return 'After 6 years: ' + (s.debt > 0 ? 'still owes ' + rs(s.debt) : 'debt-free with ' + rs(s.sav) + ' saved') + ' · ' + verdict(sim);
      return s.debt > 0 ? 'Owes ' + rs(s.debt) + ' (interest grows every month)' : 'No debt, ' + rs(s.sav) + ' saved';
    },
    readout: function (sim) {
      var L = lender(sim.p.lender), t = sim.state.t, ok = allowed(L, sim.p), s = ok ? at(sim.state.plans[L.id], t) : { debt: 0, sav: 0, interest: 0 };
      var y = Math.min(YEARS - 1, Math.floor(t - 1e-9));
      return {
        owed: ok ? rs(s.debt) : 'no loan', sav: rs(s.sav), int: rs(s.interest),
        when: t <= 0 ? 'before sowing' : t >= YEARS ? 'end of year 6' : 'year ' + (y + 1) + ', ' + MONTHS[Math.min(11, Math.floor((t - y) * 12))],
        rate: M.fmt(L.r * 100, 0) + ' %', verdict: verdict(sim)
      };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, Lo = layout(sim), L = lender(sim.p.lender), t = sim.state.t;
      D.clear(ctx, Lo.W, Lo.H, col.bg);
      var ok = allowed(L, sim.p), yrs = sim.state.plans[L.id];
      var yi = Math.min(YEARS - 1, Math.floor(t - 1e-9)), Y = ok && t > 0 ? yrs[yi] : null, f = t > 0 ? t - yi : 0;
      var s = ok ? at(yrs, t) : { debt: 0, sav: 0 };
      drawScene(sim, Lo.scene, Y, f, now || 0);
      if (Lo.wide) drawCard(sim, Lo.card, L, Y, s);
      else {
        var net = s.sav - s.debt;
        D.text(ctx, L.short + ' · ' + L.terms.split(' · ')[1], 8, Lo.sm ? 10 : 12, { color: L.color, size: Lo.sm ? 11 : 12.5, weight: 800 });
        D.text(ctx, !ok ? 'Loan refused: no collateral' : t <= 0 ? 'Needs ₹50,000 at sowing' : (s.debt > 0 ? 'Owes ' : 'Saved ') + rs(Math.abs(net)),
          8, Lo.sm ? 25 : 29, { color: !ok || s.debt > 0 ? col.danger : col.success, size: Lo.sm ? 11 : 12.5, weight: 800 });
        if (Y) D.text(ctx, 'interest ' + rsShort(Y.interest) + ' · crop ' + rsShort(Y.sale), Lo.W - 8, Lo.sm ? 25 : 29, { color: col.muted, size: Lo.sm ? 10 : 11.5, weight: 600, align: 'right' });
      }
      drawChart(sim, Lo.chart, L);
    }
  });
})();
