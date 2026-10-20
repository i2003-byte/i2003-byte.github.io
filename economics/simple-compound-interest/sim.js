/* =====================================================================
   Economics · Money and credit · Simple vs Compound Interest — sim.js
   ---------------------------------------------------------------------
   Principal P (₹), yearly rate R (%), time t (years).
     Simple interest:   SI = P × R × t / 100,   A = P + SI
       (interest is paid on the original principal only)
     Compound interest: A = P × (1 + R / (100 k))^(k × n)
       k = times a year interest is added (1, 2, 4, 12),
       n = whole interest periods passed / k. Interest is added at the end
       of each period, so between periods the amount stays flat (steps).
   At year t the extra amount CI − SI is "interest on interest".
   Time to double: simple 100 / R years; compound ln 2 / (k ln(1 + R/100k))
   (≈ 72 / R, the "rule of 72").
   Effective yearly rate = (1 + R/100k)^k − 1.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var YEAR = 0.7;            // seconds of sim time per year
  var tMax = 10;             // graph x-axis, set in reset
  var SIC = '#38bdf8', IOI = '#f59e0b';

  function rs(v) { return '₹' + Math.round(v).toLocaleString('en-IN'); }
  function rsShort(v) {
    if (v >= 1e7) return '₹' + M.fmt(v / 1e7, v >= 1e8 ? 0 : 1) + ' cr';
    if (v >= 1e5) return '₹' + M.fmt(v / 1e5, v >= 1e6 ? 0 : 1) + ' L';
    if (v >= 1e3) return '₹' + M.fmt(v / 1e3, v >= 1e4 ? 0 : 1) + 'k';
    return '₹' + Math.round(v);
  }
  function simple(p, t) { return p.P * (1 + p.R * t / 100); }
  // compound amount after t years, counting only whole interest periods
  function compound(p, t) { var k = +p.k; return p.P * Math.pow(1 + p.R / (100 * k), Math.floor(t * k + 1e-9)); }
  function doubleCI(p) { var k = +p.k; return Math.log(2) / (k * Math.log(1 + p.R / (100 * k))); }
  var KN = { 1: 'yearly', 2: 'half-yearly', 4: 'quarterly', 12: 'monthly' };

  function layout(sim) {
    var W = sim.width, H = sim.height, sm = W < 560;
    var head = sm ? 62 : 84, l = sm ? 44 : 64, r = W - (sm ? 8 : 16), t = head + (sm ? 12 : 18), b = H - (sm ? 34 : 44);
    return { W: W, H: H, sm: sm, head: head, l: l, r: r, t: t, b: b };
  }

  SimLab.createSim({
    ariaLabel: 'Bar chart of money growing year by year: for each year a simple interest bar and a compound interest bar, split into the principal, the simple interest and the extra interest on interest, with the amounts and the gap between them above',
    mobileAspect: '1 / 1',
    playLabel: 'Let the years pass',
    params: [
      { id: 'mode', label: 'Story', type: 'select', value: 'deposit', options: [
        { value: 'deposit', label: 'A deposit: your savings grow' },
        { value: 'loan', label: 'A loan: what you owe grows' }] },
      { id: 'P', label: 'Principal (₹)', min: 1000, max: 100000, step: 1000, value: 10000,
        presets: [{ label: '₹10k', value: 10000 }, { label: '₹50k', value: 50000 }, { label: '₹1 L', value: 100000 }] },
      { id: 'R', label: 'Rate per year', min: 1, max: 48, step: 0.5, value: 10, unit: '%',
        presets: [{ label: 'Savings 3%', value: 3 }, { label: 'FD 7%', value: 7 }, { label: 'Bank loan 12%', value: 12 }, { label: 'Moneylender 36%', value: 36 }] },
      { id: 'T', label: 'Time', min: 1, max: 30, step: 1, value: 10, unit: 'years' },
      { id: 'k', label: 'Compound interest added', type: 'select', value: '1', options: [
        { value: '1', label: 'Once a year (yearly)' }, { value: '2', label: 'Twice a year (half-yearly)' },
        { value: '4', label: 'Every 3 months (quarterly)' }, { value: '12', label: 'Every month (monthly)' }] }
    ],
    readouts: [
      { id: 'si', label: 'Amount with simple interest', key: true, short: 'Simple' },
      { id: 'ci', label: 'Amount with compound interest', key: true, short: 'Compound' },
      { id: 'gap', label: 'Interest on interest (CI − SI)', key: true, short: 'Extra' },
      { id: 'year', label: 'Year' },
      { id: 'dbl', label: 'Time to double: simple / compound' },
      { id: 'eff', label: 'Effective yearly rate (compound)' }
    ],
    graph: { title: 'Amount over the years', xLabel: 'years', yLabel: '₹', xMax: function () { return tMax; },
      series: [{ label: 'simple interest', color: SIC }, { label: 'compound interest', color: IOI }] },

    reset: function (sim) {
      tMax = sim.p.T;
      sim.state = { yr: 0, acc: 0 };
      if (sim.graph) sim.graph.push(0, [sim.p.P, sim.p.P]);
    },
    update: function (sim, dt) {
      var st = sim.state;
      st.yr = Math.min(sim.p.T, st.yr + dt / YEAR);
      st.acc += dt;
      if (st.acc >= 1 / 40 || st.yr >= sim.p.T) { st.acc = 0; sim.graph.push(st.yr, [simple(sim.p, st.yr), compound(sim.p, st.yr)]); }
    },
    finished: function (sim) { return sim.state.yr >= sim.p.T; },
    status: function (sim) {
      var y = Math.floor(sim.state.yr + 1e-9), loan = sim.p.mode === 'loan';
      if (!sim.state.yr) return 'Press Let the years pass to watch ' + rs(sim.p.P) + (loan ? ' of loan' : ' of savings') + ' grow for ' + sim.p.T + ' years';
      return 'Year ' + y + ': ' + (loan ? 'you owe ' : 'you have ') + rs(compound(sim.p, sim.state.yr)) + ' with compound interest, ' + rs(simple(sim.p, y)) + ' with simple';
    },
    readout: function (sim) {
      var p = sim.p, y = sim.state.yr, k = +p.k, s = simple(p, Math.floor(y + 1e-9)), c = compound(p, y);
      return {
        si: rs(s), ci: rs(c), gap: rs(c - s), year: M.fmt(Math.floor(y + 1e-9), 0) + ' of ' + p.T,
        dbl: M.fmt(100 / p.R, 1) + ' y / ' + M.fmt(doubleCI(p), 1) + ' y',
        eff: M.fmt((Math.pow(1 + p.R / (100 * k), k) - 1) * 100, 2) + ' % (' + KN[k] + ')'
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, col = sim.colors, p = sim.p, L = layout(sim), sm = L.sm, T = p.T, yr = sim.state.yr, yi = Math.floor(yr + 1e-9);
      var loan = p.mode === 'loan', PC = col.light ? '#94a3b8' : '#475569';
      D.clear(ctx, L.W, L.H, col.bg);
      // ---- header: amounts now
      var sNow = simple(p, yi), cNow = compound(p, yr), cw = (L.W - 16) / 3;
      var heads = [
        { t: loan ? 'Owe (simple)' : 'Simple interest', v: rs(sNow), c: SIC },
        { t: loan ? 'Owe (compound)' : 'Compound interest', v: rs(cNow), c: IOI },
        { t: 'Interest on interest', v: rs(cNow - sNow), c: col.text }
      ];
      heads.forEach(function (h, i) {
        var x = 8 + cw * (i + 0.5);
        D.text(ctx, h.t, x, sm ? 12 : 16, { color: col.muted, size: sm ? 9.5 : 12, weight: 700, align: 'center' });
        D.text(ctx, h.v, x, sm ? 30 : 40, { color: h.c, size: sm ? 15 : 22, weight: 800, align: 'center', fit: L.W });
      });
      D.text(ctx, 'Year ' + yi + ' of ' + T + ' · ' + rs(p.P) + ' at ' + M.fmt(p.R, p.R % 1 ? 1 : 0) + '% a year, compound ' + KN[p.k],
        L.W / 2, sm ? 50 : 68, { color: col.faint, size: sm ? 9 : 11.5, weight: 600, align: 'center', fit: L.W });
      // ---- axes
      var top = Math.max(compound(p, T), simple(p, T)) * 1.06, X0 = L.l, X1 = L.r, Y = function (v) { return L.b - v / top * (L.b - L.t); };
      var step = D.niceStep(top, sm ? 4 : 6);
      ctx.save(); ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
      for (var v = 0; v <= top; v += step) {
        var gy = Math.round(Y(v)) + 0.5; ctx.beginPath(); ctx.moveTo(X0, gy); ctx.lineTo(X1, gy); ctx.stroke();
        D.text(ctx, rsShort(v), X0 - 4, gy, { color: col.muted, size: sm ? 8.5 : 10.5, align: 'right' });
      }
      ctx.restore();
      // doubling line
      if (2 * p.P < top) {
        D.line(ctx, X0, Y(2 * p.P), X1, Y(2 * p.P), col.success, 1.2, [6, 4]);
        D.text(ctx, 'double the principal', X0 + 4, Y(2 * p.P) - (sm ? 7 : 9), { color: col.success, size: sm ? 8.5 : 10.5, weight: 700 });
      }
      // ---- bars: for each year a pair (simple | compound)
      var slot = (X1 - X0) / (T + 1), bw = Math.max(2, Math.min(slot * 0.36, 34)), gap = Math.max(1, Math.min(slot * 0.06, 4));
      for (var y = 0; y <= T; y++) {
        var cx = X0 + slot * (y + 0.5), shown = y <= yi, s = simple(p, y), c = compound(p, y);
        if (shown) {
          // simple: principal + interest
          var xs = cx - gap / 2 - bw;
          ctx.fillStyle = PC; ctx.fillRect(xs, Y(p.P), bw, L.b - Y(p.P));
          ctx.fillStyle = SIC; ctx.fillRect(xs, Y(s), bw, Y(p.P) - Y(s));
          // compound: principal + the same simple part + interest on interest
          var xc = cx + gap / 2;
          ctx.fillStyle = PC; ctx.fillRect(xc, Y(p.P), bw, L.b - Y(p.P));
          ctx.fillStyle = SIC; ctx.fillRect(xc, Y(Math.min(s, c)), bw, Y(p.P) - Y(Math.min(s, c)));
          if (c > s) { ctx.fillStyle = IOI; ctx.fillRect(xc, Y(c), bw, Y(s) - Y(c)); }
          if (y === yi && bw >= 10 && !sm) {
            D.text(ctx, rsShort(c), xc + bw / 2, Y(c) - 8, { color: IOI, size: 10.5, weight: 800, align: 'center', fit: L.W });
          }
        } else {
          ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
          ctx.strokeRect(cx - gap / 2 - bw + 0.5, Y(s) + 0.5, bw - 1, L.b - Y(s) - 1);
          ctx.strokeRect(cx + gap / 2 + 0.5, Y(c) + 0.5, bw - 1, L.b - Y(c) - 1);
        }
        var every = T <= 12 ? 1 : T <= 20 ? 2 : 5;
        if (y % every === 0) D.text(ctx, y === T && !sm ? y + ' years' : String(y), cx, L.b + (sm ? 9 : 12), { color: y === yi ? col.text : col.muted, size: sm ? 9 : 11, weight: y === yi ? 800 : 500, align: 'center' });
      }
      D.line(ctx, X0, L.b + 0.5, X1, L.b + 0.5, col.axis, 1);
      // legend
      var ly = L.b + (sm ? 24 : 31), items = [['principal', PC], [sm ? 'simple int.' : 'simple interest', SIC], [sm ? 'int. on int.' : 'interest on interest', IOI]];
      var lx = X0, lsz = sm ? 9 : 11.5;
      items.forEach(function (it) {
        ctx.fillStyle = it[1]; ctx.fillRect(lx, ly - 5, 10, 10);
        D.text(ctx, it[0], lx + 14, ly, { color: col.text, size: lsz, weight: 600 });
        ctx.save(); ctx.font = '600 ' + lsz + 'px Inter, system-ui, sans-serif'; lx += 14 + ctx.measureText(it[0]).width + (sm ? 10 : 18); ctx.restore();
      });
      if (!sm) D.text(ctx, 'left bar: simple · right bar: compound', X1, ly, { color: col.faint, size: 10.5, align: 'right' });
    }
  });
})();
