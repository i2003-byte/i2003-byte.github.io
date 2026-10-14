/* =====================================================================
   The fundamental unit of life · Diffusion Across a Membrane — sim.js
   ---------------------------------------------------------------------
   A box of water 200 µm wide (1 unit = 100 µm) is split by a membrane.
   Glucose (small) and starch (large) molecules start on the left.
   Each molecule does a random walk (Brownian motion, Ornstein–Uhlenbeck
   velocity with relaxation time 0.1 s), so its long-time spread is
     ⟨x²⟩ = 2 D t        with  D = D25 · (T / 298 K) · (μ25 / μ(T))
   (Stokes–Einstein; water viscosity μ(T) = 2.414e-5 · 10^(247.8/(T−140))
   Pa·s). D25: glucose 6.7×10⁻¹⁰ m²/s = 0.067 units²/s; starch about
   a tenth of that. Molecules do not hit each other.
   Membrane: "none" (open box), "selectively permeable" (6 pores that
   let glucose through but are too narrow for starch), "solid"
   (nothing passes). Molecules that cannot pass bounce off.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var NP = 6, PORE = 0.07, TAU = 0.1, BINS = 10;
  function visc(tc) { var T = tc + 273.15; return 2.414e-5 * Math.pow(10, 247.8 / (T - 140)); }
  function diffCoef(tc, big) { var T = tc + 273.15; return (big ? 0.0067 : 0.067) * (T / 298.15) * (visc(25) / visc(tc)); }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function inPore(y) { for (var i = 0; i < NP; i++) if (Math.abs(y - (i + 0.5) / NP) < PORE / 2) return true; return false; }
  function passes(p, mol, y) { return p.mem === 'none' || (p.mem === 'perm' && !mol.big && inPore(y)); }
  function counts(s) {
    var r = { sl: 0, sr: 0, bl: 0, br: 0 };
    s.mols.forEach(function (m) { var k = (m.big ? 'b' : 's') + (m.x < 1 ? 'l' : 'r'); r[k]++; });
    return r;
  }

  SimLab.createSim({
    ariaLabel: 'Glucose and starch molecules move randomly in a box of water divided by a membrane; glucose spreads through the pores until both sides are equal',
    mobileAspect: '1 / 1',
    autoplay: true,
    playLabel: 'Start',
    params: [
      { id: 'mem', label: 'Membrane', type: 'select', value: 'perm', options: [
        { value: 'perm', label: 'Selectively permeable (small pores)' }, { value: 'none', label: 'No membrane (open water)' }, { value: 'solid', label: 'Solid wall (no pores)' }] },
      { id: 'mix', label: 'Molecules', type: 'select', value: 'both', options: [
        { value: 'small', label: 'Glucose only (small)' }, { value: 'both', label: 'Glucose + starch' }, { value: 'big', label: 'Starch only (large)' }] },
      { id: 'n', label: 'Molecules on the left', min: 20, max: 300, step: 10, value: 150, presets: [{ label: '50', value: 50 }, { label: '150', value: 150 }, { label: '300', value: 300 }] },
      { id: 'nr', label: 'Glucose already on the right', min: 0, max: 150, step: 10, value: 0 },
      { id: 'temp', label: 'Temperature', min: 5, max: 80, step: 1, value: 25, unit: '°C', presets: [{ label: 'Fridge 5', value: 5 }, { label: 'Room 25', value: 25 }, { label: 'Body 37', value: 37 }, { label: 'Hot 80', value: 80 }] },
      { id: 'track', label: 'Follow one glucose molecule', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'left', label: 'Glucose on the left', short: 'Left', key: true, digits: 0 },
      { id: 'right', label: 'Glucose on the right', short: 'Right', key: true, digits: 0 },
      { id: 'net', label: 'Net movement', key: true },
      { id: 'cross', label: 'Crossings per second (→ / ←)' },
      { id: 'starch', label: 'Starch left / right' },
      { id: 'd', label: 'Glucose diffusion coefficient' }
    ],
    graph: { title: 'Number of molecules on each side', yLabel: 'molecules', series: [{ label: 'glucose: left' }, { label: 'glucose: right' }, { label: 'starch: right' }], window: 60, yMin: 0 },

    reset: function (sim) {
      var p = sim.p, mols = [], small = p.mix !== 'big', big = p.mix !== 'small';
      function add(x0, x1, isBig) { mols.push({ x: x0 + Math.random() * (x1 - x0), y: 0.03 + Math.random() * 0.94, vx: 0, vy: 0, big: isBig }); }
      var n = p.n, nb = small && big ? Math.round(n / 3) : big ? n : 0, ns = n - nb;
      for (var i = 0; i < ns; i++) add(0.03, 0.97, false);
      for (var j = 0; j < nb; j++) add(0.04, 0.96, true);
      if (small) for (var k = 0; k < p.nr; k++) add(1.03, 1.97, false);
      var tracked = -1; for (var q = 0; q < mols.length; q++) if (!mols[q].big) { tracked = q; break; }
      sim.state = { mols: mols, tracked: tracked, trail: [], ev: [] };
    },
    update: function (sim, dt) {
      var s = sim.state, p = sim.p, Ds = diffCoef(p.temp, false), Db = diffCoef(p.temp, true), t = sim.time;
      s.mols.forEach(function (m, i) {
        var Dm = m.big ? Db : Ds, kick = Math.sqrt(2 * Dm * dt) / TAU;
        m.vx += -m.vx / TAU * dt + kick * gauss(); m.vy += -m.vy / TAU * dt + kick * gauss();
        var nx = m.x + m.vx * dt, ny = m.y + m.vy * dt, r = m.big ? 0.025 : 0.012;
        if (ny < r) { ny = 2 * r - ny; m.vy = -m.vy; } else if (ny > 1 - r) { ny = 2 * (1 - r) - ny; m.vy = -m.vy; }
        if (nx < r) { nx = 2 * r - nx; m.vx = -m.vx; } else if (nx > 2 - r) { nx = 2 * (2 - r) - nx; m.vx = -m.vx; }
        if ((m.x < 1) !== (nx < 1)) {
          if (passes(p, m, ny)) { if (!m.big) s.ev.push([t, nx >= 1 ? 1 : -1]); }
          else { nx = m.x < 1 ? 2 * (1 - r) - nx : 2 * (1 + r) - nx; m.vx = -m.vx; if ((m.x < 1) !== (nx < 1)) nx = m.x; }
        }
        m.x = nx; m.y = ny;
      });
      while (s.ev.length && s.ev[0][0] < t - 5) s.ev.shift();
      var tr = s.mols[s.tracked];
      if (tr && (!s.trail.length || Math.hypot(tr.x - s.trail[s.trail.length - 1][0], tr.y - s.trail[s.trail.length - 1][1]) > 0.01)) { s.trail.push([tr.x, tr.y]); if (s.trail.length > 400) s.trail.shift(); }
    },
    sample: function (sim) { var k = counts(sim.state); return [k.sl, k.sr, k.br]; },
    readout: function (sim) {
      var s = sim.state, k = counts(s), f = 0, b = 0, span = Math.min(5, Math.max(0.5, sim.time));
      s.ev.forEach(function (e) { if (e[1] > 0) f++; else b++; });
      var tot = k.sl + k.sr, diff = k.sl - k.sr, eq = tot > 0 && Math.abs(diff) <= 2 * Math.sqrt(tot) + 2;
      var net = !tot || sim.p.mem === 'solid' ? 'none: glucose cannot cross' : eq ? 'none: dynamic equilibrium' : diff > 0 ? 'left → right (high → low)' : 'right → left (high → low)';
      return {
        left: k.sl, right: k.sr, net: net,
        cross: M.fmt(f / span, 1) + ' / ' + M.fmt(b / span, 1),
        starch: sim.p.mix === 'small' ? 'none' : k.bl + ' / ' + k.br,
        d: M.fmt(diffCoef(sim.p.temp, false) * 1e-8 / 1e-10, 1) + ' × 10⁻¹⁰ m²/s'
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state;
      var nar = W < 560, fs = nar ? 10 : 12;
      D.clear(ctx, W, H, c.bg);
      var histH = nar ? 44 : 64, top = nar ? 30 : 40;
      var bw = Math.min(W - 24, (H - top - histH - 40) * 2), bh = bw / 2, bx = (W - bw) / 2, by = top;
      var u = bw / 2; // pixels per unit (100 µm)
      D.text(ctx, 'side A', bx + bw * 0.25, by - 10, { color: c.muted, size: fs, weight: 600, align: 'center' });
      D.text(ctx, 'side B', bx + bw * 0.75, by - 10, { color: c.muted, size: fs, weight: 600, align: 'center' });
      D.text(ctx, p.temp + ' °C', bx + bw, by - 10, { color: p.temp > 45 ? c.danger : p.temp < 15 ? c.s1 : c.muted, size: fs, weight: 700, align: 'right' });
      D.roundRect(ctx, bx, by, bw, bh, 6, D.alpha('#7dd3fc', c.light ? 0.2 : 0.1), c.ink, 2);
      // membrane
      var mx = bx + u;
      if (p.mem !== 'none') {
        var segs = [], y0 = 0;
        if (p.mem === 'perm') { for (var i = 0; i < NP; i++) { var pc = (i + 0.5) / NP; segs.push([y0, pc - PORE / 2]); y0 = pc + PORE / 2; } }
        segs.push([y0, 1]);
        segs.forEach(function (sg) { D.roundRect(ctx, mx - 3, by + sg[0] * bh, 6, (sg[1] - sg[0]) * bh, 2, '#a855f7'); });
      } else D.line(ctx, mx, by + 2, mx, by + bh - 2, D.alpha(c.muted, 0.5), 1, [4, 5]);
      // trail of the followed molecule
      if (p.track && s.trail.length > 1) {
        ctx.save(); ctx.strokeStyle = D.alpha(c.accent, 0.55); ctx.lineWidth = 1.3; ctx.beginPath();
        s.trail.forEach(function (pt, k) { var x = bx + pt[0] * u, y = by + pt[1] * bh; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke(); ctx.restore();
      }
      var rs = Math.max(2.4, u * 0.012), rb = Math.max(4.5, u * 0.025);
      s.mols.forEach(function (m) { if (m.big) D.circle(ctx, bx + m.x * u, by + m.y * bh, rb, '#3b82f6', D.alpha('#1e3a8a', 0.8), 1); });
      s.mols.forEach(function (m) { if (!m.big) D.circle(ctx, bx + m.x * u, by + m.y * bh, rs, '#f97316'); });
      var tr = s.mols[s.tracked];
      if (p.track && tr) D.circle(ctx, bx + tr.x * u, by + tr.y * bh, rs + 3, c.accent, '#fff', 1.5);
      // scale bar 50 µm
      D.line(ctx, bx + 6, by + bh + 10, bx + 6 + u / 2, by + bh + 10, c.ink, 2);
      D.text(ctx, '50 µm', bx + 10 + u / 2, by + bh + 10, { color: c.muted, size: fs - 1 });
      // legend
      var lx = bx + bw, ly = by + bh + 10;
      D.text(ctx, '● glucose' + (p.mix !== 'small' ? '   ● starch' : ''), lx, ly, { color: c.muted, size: fs - 1, align: 'right' });
      // concentration across the box (histogram of glucose)
      var hy = by + bh + 22, hh = H - hy - 18, bins = new Array(BINS).fill(0), maxc = 1;
      s.mols.forEach(function (m) { if (!m.big) bins[Math.min(BINS - 1, Math.floor(m.x / 2 * BINS))]++; });
      var tot = 0; bins.forEach(function (v) { tot += v; });
      maxc = Math.max(8, tot / BINS * 2.2);
      bins.forEach(function (v, k) {
        var h = Math.min(hh, v / maxc * hh), x = bx + k * bw / BINS;
        D.roundRect(ctx, x + 2, hy + hh - h, bw / BINS - 4, h, 2, D.alpha('#f97316', 0.75));
      });
      D.line(ctx, bx, hy + hh, bx + bw, hy + hh, c.axis, 1);
      D.text(ctx, 'glucose concentration across the box', W / 2, H - 7, { color: c.muted, size: fs - 1, align: 'center', fit: W });
      if (sim.p.mem === 'perm' && p.mix !== 'small' && !nar) D.text(ctx, 'pores too small for starch', mx + 8, by + bh * 0.04 + 8, { color: c.muted, size: 10, bg: D.alpha(c.bg, 0.75) });
    }
  });
})();
