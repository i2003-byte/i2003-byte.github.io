/* =====================================================================
   Electricity · Electric Power and the Electricity Bill — sim.js
   ---------------------------------------------------------------------
   A typical Indian home. Each appliance has a power rating (W) and a
   number of hours it runs each day (set by the sliders).
     energy E = P × t        1 unit = 1 kWh = 1000 W × 3600 s = 3.6 MJ
     units per day   = Σ (watts × hours) ÷ 1000
     bill for 30 days = units × rate (₹ per unit)
     current if everything is on at once  I = P ÷ 220 V
   Playing runs one month: 1 s on screen = 1 day (at 1× speed). Energy
   is added day by day, so changing a habit mid-month bends the graph.
   Simplification: a single flat rate per unit; real Indian tariffs use
   slabs (the rate rises with use) plus fixed charges and taxes. The
   fridge figure is its average power over the hours it runs.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var MAINS = 220, DAYS = 30;
  var APPS = [
    { id: 'hBulb', name: 'Bulbs', icon: '💡', n: 5, w: 9, h: 6 },
    { id: 'hFan', name: 'Ceiling fans', icon: '🌀', n: 2, w: 75, h: 10 },
    { id: 'hTv', name: 'TV', icon: '📺', n: 1, w: 100, h: 4 },
    { id: 'hFridge', name: 'Fridge', icon: '🧊', n: 1, w: 150, h: 12 },
    { id: 'hAc', name: 'AC (1.5 ton)', icon: '❄️', n: 1, w: 1500, h: 0 },
    { id: 'hGeyser', name: 'Geyser', icon: '🚿', n: 1, w: 2000, h: 0.5 },
    { id: 'hIron', name: 'Iron', icon: '👕', n: 1, w: 1000, h: 0.5 }
  ];
  function watts(a, p) { return a.n * (a.id === 'hBulb' && p.oldBulbs ? 60 : a.w); }
  function daily(p) { return APPS.reduce(function (s, a) { return s + watts(a, p) * p[a.id] / 1000; }, 0); }
  function peak(p) { return APPS.reduce(function (s, a) { return s + (p[a.id] > 0 ? watts(a, p) : 0); }, 0); }

  var params = APPS.map(function (a) {
    return { id: a.id, label: a.icon + ' ' + a.name + (a.n > 1 ? ' (' + a.n + ' × ' + a.w + ' W)' : ' (' + a.w + ' W)') + ': hours a day',
      min: 0, max: a.id === 'hFridge' ? 24 : a.id === 'hGeyser' || a.id === 'hIron' ? 4 : 16, step: a.id === 'hGeyser' || a.id === 'hIron' ? 0.25 : 0.5, value: a.h, unit: 'h' };
  }).concat([
    { id: 'oldBulbs', label: 'Swap the LEDs for old 60 W filament bulbs', type: 'toggle', value: false },
    { id: 'rate', label: 'Rate per unit (1 kWh)', min: 3, max: 12, step: 0.5, value: 7, unit: '₹',
      presets: [{ label: '₹5', value: 5 }, { label: '₹7', value: 7 }, { label: '₹9', value: 9 }] }
  ]);

  SimLab.createSim({
    ariaLabel: 'An electricity meter counting units over a month, with bars showing how many units and rupees each household appliance uses',
    autoplay: true,
    mobileAspect: '3 / 4',
    playLabel: 'Run a month',
    params: params,
    paramsTitle: 'Your home',
    readouts: [
      { id: 'day', label: 'Energy per day', unit: 'kWh', digits: 2 },
      { id: 'month', label: 'Units in 30 days', unit: 'kWh', digits: 0, key: true },
      { id: 'bill', label: 'Bill for 30 days', unit: '₹', digits: 0, key: true },
      { id: 'used', label: 'Units used so far', unit: 'kWh', digits: 1 },
      { id: 'P', label: 'Power if all are on together', unit: 'W', digits: 0 },
      { id: 'I', label: 'Current then, I = P ÷ 220 V', unit: 'A', digits: 1 }
    ],
    graph: { title: 'Units used during the month', xLabel: 'day', yLabel: 'kWh', xMax: DAYS, series: [{ label: 'Units used', color: '--sim-1' }] },
    onParam: function () { return true; },
    reset: function (sim) { sim.state = { units: 0, blink: 0 }; },
    update: function (sim, dt) {
      var d = daily(sim.p);
      sim.state.units += d * dt;
      sim.state.blink += d * dt * 8; // the meter LED flashes faster when more power is used
    },
    finished: function (sim) { return sim.time >= DAYS - 1e-9; },
    onFinish: function (sim) { sim.toast('Month over: ' + M.fmt(sim.state.units, 0) + ' units → ₹' + M.fmt(sim.state.units * sim.p.rate, 0)); },
    sample: function (sim) { return [sim.state.units]; },
    status: function (sim) { return 'Day ' + Math.min(DAYS, Math.floor(sim.time) + (sim.time >= DAYS ? 0 : 1)) + ' of ' + DAYS; },
    readout: function (sim) {
      var p = sim.p, d = daily(p), P = peak(p);
      return { day: d, month: d * DAYS, bill: d * DAYS * p.rate, used: sim.state.units, P: P, I: P / MAINS };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      var wide = W >= 560;
      var mb = wide ? { x: 12, y: 12, w: Math.min(260, W * 0.34), h: H - 24 } : { x: 10, y: 10, w: W - 20, h: H * 0.3 };
      var bb = wide ? { x: mb.x + mb.w + 16, y: 12, w: W - mb.w - 40, h: H - 24 } : { x: 10, y: mb.y + mb.h + 12, w: W - 20, h: H - mb.h - 32 };

      // ---- the meter
      D.roundRect(ctx, mb.x, mb.y, mb.w, mb.h, 14, c.light ? '#e2e8f0' : '#1e293b', D.alpha(c.muted, 0.4), 1.5);
      var mx = mb.x + mb.w / 2;
      D.text(ctx, 'ENERGY METER · kWh', mx, mb.y + 18, { color: c.muted, size: 11, weight: 700, align: 'center' });
      var dw = Math.min(mb.w - 30, 200), dh = wide ? 46 : 38, dy = mb.y + (wide ? mb.h * 0.2 : 34);
      D.roundRect(ctx, mx - dw / 2, dy, dw, dh, 6, '#0b1f12', '#14532d', 2);
      var digits = ('00000' + s.units.toFixed(1)).slice(-7);
      D.text(ctx, digits, mx, dy + dh / 2 + 1, { color: '#4ade80', size: wide ? 30 : 24, weight: 700, align: 'center', font: c.mono });
      var on = (s.blink % 1) < 0.25 && sim.running;
      var lx = wide ? mx : mb.x + mb.w - 26, ly = wide ? dy + dh + 30 : dy + dh / 2;
      D.circle(ctx, lx, ly, 7, on ? '#ef4444' : D.alpha('#ef4444', 0.25), D.alpha(c.muted, 0.5), 1);
      if (wide) D.text(ctx, 'flashes faster when more power is used', mx, ly + 18, { color: c.faint, size: 10, align: 'center' });
      var day = Math.min(DAYS, sim.time), ty = wide ? mb.y + mb.h * 0.55 : mb.y + mb.h - 20;
      if (wide) {
        D.text(ctx, 'Day ' + M.fmt(Math.min(DAYS, Math.floor(day) + (day >= DAYS ? 0 : 1)), 0) + ' of ' + DAYS, mx, ty, { color: c.ink, size: 15, weight: 700, align: 'center' });
        D.text(ctx, 'Bill so far', mx, ty + 34, { color: c.muted, size: 12, align: 'center' });
        D.text(ctx, '₹ ' + M.fmt(s.units * p.rate, 0), mx, ty + 60, { color: c.accent, size: 26, weight: 800, align: 'center', font: c.mono });
        D.text(ctx, M.fmt(daily(p), 2) + ' units a day × 30', mx, ty + 92, { color: c.muted, size: 11.5, align: 'center' });
        D.text(ctx, '= ' + M.fmt(daily(p) * DAYS, 0) + ' units → ₹' + M.fmt(daily(p) * DAYS * p.rate, 0), mx, ty + 110, { color: c.ink, size: 12.5, weight: 700, align: 'center' });
      } else {
        D.text(ctx, 'Day ' + M.fmt(Math.min(DAYS, Math.floor(day) + (day >= DAYS ? 0 : 1)), 0) + '/30', mb.x + 14, ty, { color: c.ink, size: 13, weight: 700 });
        D.text(ctx, 'so far ₹' + M.fmt(s.units * p.rate, 0) + ' · month ₹' + M.fmt(daily(p) * DAYS * p.rate, 0), mb.x + mb.w - 14, ty, { color: c.accent, size: 12.5, weight: 700, align: 'right', fit: W });
      }

      // ---- bars: units per month for each appliance
      var rows = APPS.map(function (a) { var u = watts(a, p) * p[a.id] * DAYS / 1000; return { a: a, u: u, W: watts(a, p), h: p[a.id] }; });
      var umax = Math.max(30, rows.reduce(function (m, r) { return Math.max(m, r.u); }, 0));
      D.text(ctx, 'Units per month (watts × hours × 30 ÷ 1000)', bb.x, bb.y + 10, { color: c.ink, size: wide ? 12.5 : 11.5, weight: 700, fit: W });
      var top = bb.y + 26, rh = (bb.h - 30) / rows.length, nameW = wide ? 150 : 104, valW = wide ? 110 : 86;
      var biggest = rows.reduce(function (m, r) { return r.u > m.u ? r : m; }, rows[0]);
      rows.forEach(function (r, i) {
        var y = top + i * rh, cy = y + rh / 2, bx = bb.x + nameW, bw = Math.max(0, bb.w - nameW - valW);
        D.text(ctx, r.a.icon + ' ' + r.a.name, bb.x, cy - (wide ? 7 : 6), { color: c.ink, size: wide ? 12.5 : 11, weight: 600 });
        D.text(ctx, M.fmt(r.W, 0) + ' W × ' + M.fmt(r.h, r.h % 1 ? 2 : 0) + ' h', bb.x + 2, cy + (wide ? 9 : 8), { color: c.faint, size: wide ? 10.5 : 9.5, font: c.mono });
        D.roundRect(ctx, bx, cy - rh * 0.28, bw, rh * 0.56, 5, D.alpha(c.muted, 0.08));
        if (r.u > 0) D.roundRect(ctx, bx, cy - rh * 0.28, Math.max(4, bw * r.u / umax), rh * 0.56, 5, r === biggest ? c.warning : c.s1);
        D.text(ctx, M.fmt(r.u, r.u < 10 ? 1 : 0) + ' u', bx + bw + 8, cy - (wide ? 7 : 6), { color: c.ink, size: wide ? 12 : 11, weight: 700, font: c.mono });
        D.text(ctx, '₹' + M.fmt(r.u * p.rate, 0), bx + bw + 8, cy + (wide ? 9 : 8), { color: c.muted, size: wide ? 11 : 10, font: c.mono });
      });
    }
  });
})();
