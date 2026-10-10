/* =====================================================================
   Kinetic theory · Gas Pressure from Molecules — sim.js
   ---------------------------------------------------------------------
   N hard-disc molecules in a square box (box units: side = 1). They
   bounce elastically off the walls and (optionally) off each other.
   Speeds: the real 3-D rms speed v_rms = √(3RT/M) is drawn at
   v_rms / 1000 box sides per second, so heavier or colder gases look
   slower. The mean of v² is set exactly to that value at the start and
   rescaled when T or the gas changes (collisions keep it constant).
   Pressure is MEASURED: every wall hit gives the wall an impulse
   2 m |v⊥|. Summed over the last 3 s and divided by the wall length,
   this is the 2-D pressure, compared with the kinetic-theory value
     P = N m ⟨v²⟩ / (2A)    (2-D form of P = ⅓ (N/V) m ⟨v²⟩)
   Both are shown relative to 100 molecules at 300 K, so P_rel =
   (N/100)(T/300) whatever the gas: heavier molecules move slower but
   hit harder.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var R = 8.314, KB = 1.380649e-23, SCALE = 1000, RAD = 0.009, WIN = 3;
  var GASES = { he: { M: 0.004, name: 'Helium' }, n2: { M: 0.028, name: 'Nitrogen' }, co2: { M: 0.044, name: 'Carbon dioxide' } };
  var PREF = 100 * 3 * R * 300 / (2 * SCALE * SCALE); // 2-D pressure of 100 molecules at 300 K (box units)

  function gasOf(p) { return GASES[p.gas] || GASES.n2; }
  function vrmsReal(p) { return Math.sqrt(3 * R * p.T / gasOf(p).M); }
  function setSpeeds(s, p) {
    var target = Math.pow(vrmsReal(p) / SCALE, 2), sum = 0;
    s.mol.forEach(function (m) { sum += m.vx * m.vx + m.vy * m.vy; });
    var k = Math.sqrt(target / (sum / s.mol.length || 1));
    s.mol.forEach(function (m) { m.vx *= k; m.vy *= k; });
    s.v2 = target;
  }
  function gauss(rnd) { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
  function measured(s, t) {
    var J = 0; s.hits.forEach(function (h) { J += h.J; });
    var span = Math.min(WIN, Math.max(t, 0.05));
    return J / span / 4 / PREF;
  }

  SimLab.createSim({
    ariaLabel: 'Gas molecules moving and bouncing inside a box; every hit on a wall pushes it, and together the hits make the gas pressure',
    mobileAspect: '1 / 1',
    playLabel: 'Release the molecules',
    params: [
      { id: 'N', label: 'Number of molecules N', min: 10, max: 200, step: 10, value: 80,
        presets: [{ label: '50', value: 50 }, { label: '100', value: 100 }, { label: '200', value: 200 }] },
      { id: 'T', label: 'Temperature T', min: 100, max: 800, step: 10, value: 300, unit: 'K',
        presets: [{ label: '150 K', value: 150 }, { label: '300 K', value: 300 }, { label: '600 K', value: 600 }] },
      { id: 'gas', label: 'Gas', type: 'select', value: 'n2', options: [
        { value: 'he', label: 'Helium (He, light)' }, { value: 'n2', label: 'Nitrogen (N₂)' }, { value: 'co2', label: 'Carbon dioxide (CO₂, heavy)' }] },
      { id: 'bump', label: 'Molecules bump into each other', type: 'toggle', value: true },
      { id: 'follow', label: 'Follow one molecule', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'P', label: 'Pressure measured from wall hits', short: 'P measured', digits: 2, key: true },
      { id: 'Pp', label: 'Kinetic theory prediction (N/100 × T/300)', short: 'P theory', digits: 2, key: true },
      { id: 'v', label: 'rms speed √(3RT/M)', short: 'v_rms', unit: 'm/s', digits: 0, key: true },
      { id: 'KE', label: 'Average KE per molecule (3/2 kT)' },
      { id: 'hps', label: 'Wall hits per second (in the box)', digits: 0 }
    ],
    graph: { title: 'Pressure (1 = 100 molecules at 300 K)', yLabel: 'P', series: [{ label: 'measured' }, { label: 'theory' }], window: 20, yMin: 0 },

    reset: function (sim) {
      var p = sim.p, rnd = M.rng(7 + p.N), mol = [], n = p.N;
      var cols = Math.ceil(Math.sqrt(n)), gap = (1 - 4 * RAD) / cols;
      for (var i = 0; i < n; i++) {
        var gx = i % cols, gy = Math.floor(i / cols);
        mol.push({ x: 2 * RAD + gap * (gx + 0.5) + (rnd() - 0.5) * gap * 0.3, y: 2 * RAD + gap * (gy + 0.5) + (rnd() - 0.5) * gap * 0.3,
          vx: gauss(rnd), vy: gauss(rnd) });
      }
      sim.state = { mol: mol, hits: [], trail: [], t0: 0 };
      setSpeeds(sim.state, p);
    },
    onParam: function (sim, id) {
      if (id === 'T' || id === 'gas') { setSpeeds(sim.state, sim.p); sim.state.hits = []; sim.state.t0 = sim.time; return true; }
      return id === 'follow' || id === 'bump';
    },
    update: function (sim, dt) {
      var s = sim.state, mol = s.mol, n = mol.length, t = sim.time, m = gasOf(sim.p).M, lo = RAD, hi = 1 - RAD;
      for (var i = 0; i < n; i++) {
        var a = mol[i];
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (a.x < lo && a.vx < 0) { a.vx = -a.vx; a.x = 2 * lo - a.x; hit(s, t, 2 * m * a.vx, 0, a.y); }
        else if (a.x > hi && a.vx > 0) { hit(s, t, 2 * m * a.vx, 1, a.y); a.vx = -a.vx; a.x = 2 * hi - a.x; }
        if (a.y < lo && a.vy < 0) { a.vy = -a.vy; a.y = 2 * lo - a.y; hit(s, t, 2 * m * a.vy, a.x, 0); }
        else if (a.y > hi && a.vy > 0) { hit(s, t, 2 * m * a.vy, a.x, 1); a.vy = -a.vy; a.y = 2 * hi - a.y; }
      }
      if (sim.p.bump) {
        var d2 = 4 * RAD * RAD;
        for (i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
          var A = mol[i], B = mol[j], dx = B.x - A.x, dy = B.y - A.y, r2 = dx * dx + dy * dy;
          if (r2 >= d2 || r2 === 0) continue;
          var dvx = B.vx - A.vx, dvy = B.vy - A.vy, dot = dvx * dx + dvy * dy;
          if (dot >= 0) continue; // already moving apart
          var k = dot / r2; // equal masses: swap the velocity parts along the line of centres
          A.vx += k * dx; A.vy += k * dy; B.vx -= k * dx; B.vy -= k * dy;
        }
      }
      while (s.hits.length && s.hits[0].t < t - WIN) s.hits.shift();
      if (sim.p.follow) {
        s.trail.push(mol[0].x, mol[0].y);
        if (s.trail.length > 600) s.trail.splice(0, 2);
      }
    },
    readout: function (sim) {
      var p = sim.p, s = sim.state, kT = KB * p.T * 1.5, e = Math.floor(Math.log10(kT));
      var sup = String(e).replace('-', '⁻').replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; });
      var span = Math.min(WIN, Math.max(sim.time - s.t0, 0.05));
      var meas = sim.time > 0 ? measured(s, sim.time - s.t0) : null;
      return { P: meas == null ? 'press Release' : meas, Pp: p.N / 100 * p.T / 300, v: vrmsReal(p),
        KE: M.fmt(kT / Math.pow(10, e), 2) + ' × 10' + sup + ' J', hps: s.hits.length / span };
    },
    sample: function (sim) {
      var s = sim.state;
      return [measured(s, sim.time - s.t0), sim.p.N / 100 * sim.p.T / 300];
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560, side = W > H * 1.25 || !narrow;
      var top = 30, bot = 26, colW = side ? Math.max(104, Math.min(200, W * 0.28)) : 0;
      var S = Math.min(W - colW - 24, H - top - bot - (side ? 0 : 0)), bx = side ? (W - colW - S) / 2 : (W - S) / 2, by = top;
      if (!side) { S = Math.min(W - 24, H - top - bot - 70); bx = (W - S) / 2; }
      D.text(ctx, gasOf(p).name + ' · ' + p.N + ' molecules · ' + p.T + ' K', W / 2, 14, { color: c.muted, size: narrow ? 11.5 : 13, weight: 600, align: 'center', fit: W });

      // box and fading wall-hit flashes
      D.roundRect(ctx, bx, by, S, S, 6, D.alpha(c.s1, 0.05), c.ink, 3);
      var t = sim.time;
      s.hits.forEach(function (h) {
        var age = t - h.t; if (age > 0.18) return;
        var a = 1 - age / 0.18, hx = bx + h.x * S, hy = by + h.y * S;
        if (h.x === 0 || h.x === 1) D.line(ctx, hx, hy - 7, hx, hy + 7, D.alpha(c.warning, a), 4);
        else D.line(ctx, hx - 7, hy, hx + 7, hy, D.alpha(c.warning, a), 4);
      });

      // trail of the followed molecule
      if (p.follow && s.trail.length > 4) {
        ctx.save(); ctx.strokeStyle = D.alpha(c.accent, 0.55); ctx.lineWidth = 1.5; ctx.beginPath();
        for (var i = 0; i < s.trail.length; i += 2) { var tx = bx + s.trail[i] * S, ty = by + s.trail[i + 1] * S; if (i) ctx.lineTo(tx, ty); else ctx.moveTo(tx, ty); }
        ctx.stroke(); ctx.restore();
      }
      // molecules coloured by speed (blue slow → red fast, compared with v_rms)
      var vr = Math.sqrt(s.v2), r = Math.max(2.6, RAD * S * (p.N > 120 ? 1 : 1.25));
      s.mol.forEach(function (m, k) {
        var f = M.clamp(Math.hypot(m.vx, m.vy) / vr / 2, 0, 1);
        var col = 'hsl(' + Math.round(220 - 220 * f) + ',80%,' + (c.light ? 45 : 60) + '%)';
        D.circle(ctx, bx + m.x * S, by + m.y * S, r, col);
        if (k === 0 && p.follow) D.circle(ctx, bx + m.x * S, by + m.y * S, r + 3, null, c.accent, 2);
      });

      // side column (or strip below): pressure gauge and speed key
      var meas = t > 0 ? measured(s, t - s.t0) : 0, pred = p.N / 100 * p.T / 300;
      var gx, gy, gR;
      if (side) { gx = bx + S + 12 + colW / 2; gR = Math.min(colW * 0.36, 48); gy = by + gR + 22; }
      else { gR = 30; gx = W / 2 - 70; gy = by + S + 38; }
      D.circle(ctx, gx, gy, gR, c.surface2 || c.bg, c.ink, 2);
      var PM = 5;
      for (var q = 0; q <= PM; q++) {
        var ang = Math.PI * (0.75 + 1.5 * q / PM), ix = Math.cos(ang), iy = Math.sin(ang);
        D.line(ctx, gx + ix * gR * 0.78, gy + iy * gR * 0.78, gx + ix * gR * 0.95, gy + iy * gR * 0.95, c.muted, 1.5);
        if (side) D.text(ctx, String(q), gx + ix * gR * 0.6, gy + iy * gR * 0.6, { color: c.muted, size: 9, align: 'center' });
      }
      var pa = Math.PI * (0.75 + 1.5 * Math.min(pred, PM) / PM), ma = Math.PI * (0.75 + 1.5 * Math.min(meas, PM) / PM);
      D.line(ctx, gx, gy, gx + Math.cos(pa) * gR * 0.85, gy + Math.sin(pa) * gR * 0.85, D.alpha(c.s2, 0.7), 2, [3, 3]);
      D.line(ctx, gx, gy, gx + Math.cos(ma) * gR * 0.85, gy + Math.sin(ma) * gR * 0.85, c.danger, 2.5);
      D.circle(ctx, gx, gy, 3, c.ink);
      var lx = side ? gx : gx + gR + 12, ly = side ? gy + gR + 14 : gy - 10, al = side ? 'center' : 'left';
      D.text(ctx, 'P = ' + (t > 0 ? M.fmt(meas, 2) : '—'), lx, ly, { color: c.danger, size: narrow ? 11.5 : 13, weight: 700, align: al, font: c.mono, fit: W });
      D.text(ctx, 'theory ' + M.fmt(pred, 2), lx, ly + 16, { color: c.s2, size: narrow ? 10.5 : 11.5, weight: 600, align: al, font: c.mono, fit: W });
      if (side) {
        var ky = ly + 44;
        D.text(ctx, 'Speed', gx, ky, { color: c.muted, size: 11, weight: 600, align: 'center' });
        var kw = Math.min(colW - 16, 120), kx = gx - kw / 2;
        for (var u = 0; u < 20; u++) { ctx.fillStyle = 'hsl(' + Math.round(220 - 220 * u / 19) + ',80%,' + (c.light ? 45 : 60) + '%)'; ctx.fillRect(kx + kw * u / 20, ky + 10, kw / 20 + 0.5, 8); }
        D.text(ctx, 'slow', kx, ky + 28, { color: c.muted, size: 10 });
        D.text(ctx, 'fast', kx + kw, ky + 28, { color: c.muted, size: 10, align: 'right' });
        if (H - ky > 110) {
          D.text(ctx, 'Each wall hit', gx, ky + 56, { color: c.ink, size: 11, weight: 600, align: 'center', fit: W });
          D.text(ctx, 'gives Δp = 2 m v', gx, ky + 72, { color: c.ink, size: 11, weight: 600, align: 'center', font: c.mono, fit: W });
        }
      } else {
        D.text(ctx, 'Each wall hit gives Δp = 2 m v', W / 2, H - 12, { color: c.muted, size: 11, align: 'center', fit: W });
      }
      if (side) D.text(ctx, 'Each wall hit (orange flash) pushes the wall: Δp = 2 m v⊥', bx + S / 2, H - 12, { color: c.muted, size: narrow ? 10.5 : 11.5, align: 'center', fit: W });
    }
  });

  function hit(s, t, J, x, y) {
    s.hits.push({ t: t, J: J, x: x, y: y });
  }
})();
