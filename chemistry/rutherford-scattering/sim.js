/* =====================================================================
   Chemistry · Structure of atom · Rutherford's Gold-Foil Experiment — sim.js
   ---------------------------------------------------------------------
   Alpha particles (charge +2e, kinetic energy E) hit a thin metal foil.
   Nuclear model: each alpha is pushed by one nucleus (charge +Ze).
     closest approach (head-on)  d = 2 k Z e² / E = 2.88 Z / E[MeV]  fm
     deflection for aim distance b:   tan(θ/2) = d / (2b)
     chance per alpha of θ > Θ:  P = n t π (d/2)² cot²(Θ/2)
       (n = atoms per m³, t = foil thickness) → b is sampled from the foil area
   Plus a small random spread from many tiny pushes (multiple scattering,
   σ ≈ 1° × √(t / 1 µm)), which is all the "plum pudding" model gives.
   Zoom view: real Coulomb paths round one nucleus (in fm), integrated
   from r'' = (v₀² d / 2) r̂ / r².  Nuclear radius R = 1.2 A^⅓ fm.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var METALS = {
    au: { name: 'Gold', sym: 'Au', Z: 79, A: 197, n: 5.90e28, color: '#facc15' },
    ag: { name: 'Silver', sym: 'Ag', Z: 47, A: 108, n: 5.86e28, color: '#cbd5e1' },
    al: { name: 'Aluminium', sym: 'Al', Z: 13, A: 27, n: 6.03e28, color: '#94a3b8' }
  };
  var RATES = { slow: 8, fast: 400, vfast: 20000 };
  var BINS = 18, ZW = 400;                 // 10° bins; zoom view width in fm
  var ALPHA = '#f472b6';

  function d_fm(p) { return 2.88 * METALS[p.metal].Z / p.E; }
  function nucR(p) { return 1.2 * Math.pow(METALS[p.metal].A, 1 / 3); }
  // fraction of alphas deflected by more than th (radians), single scattering
  function pMore(p, th) {
    if (p.model === 'plum') return 0;
    var m = METALS[p.metal], d = d_fm(p) * 1e-15, nt = m.n * p.t * 1e-6;
    var c = 1 / Math.tan(th / 2);
    return Math.min(1, nt * Math.PI * d * d / 4 * c * c);
  }
  function gauss(r) { var u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function sample(sim) {
    var p = sim.p, r = sim.state.rnd, sig = M.rad(1) * Math.sqrt(p.t);
    var th = Math.abs(gauss(r) * sig);
    if (p.model !== 'plum') {
      var m = METALS[p.metal], nt = m.n * p.t * 1e-6, d = d_fm(p) * 1e-15;
      var b = Math.sqrt((r() || 1e-12) / (nt * Math.PI));      // aim distance from the nearest nucleus
      var ts = 2 * Math.atan(d / (2 * b));
      th = ts > 3 * sig ? ts : Math.abs(ts + gauss(r) * sig);
    }
    return Math.min(Math.PI, th);
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, sm = W < 560;
    if (W >= 640) {
      var lw = Math.min(Math.round(W * 0.5), H);
      return { sm: sm, lab: { x: 8, y: 8, w: lw - 12, h: H - 16 }, zoom: { x: lw + 4, y: 8, w: W - lw - 12, h: Math.round(H * 0.5) - 10 },
        hist: { x: lw + 4, y: Math.round(H * 0.5) + 6, w: W - lw - 12, h: H - Math.round(H * 0.5) - 14 } };
    }
    var th = Math.round(H * 0.56);
    return { sm: sm, lab: { x: 4, y: 4, w: Math.round(W * 0.56) - 6, h: th - 6 }, zoom: { x: Math.round(W * 0.56) + 2, y: 4, w: W - Math.round(W * 0.56) - 6, h: th - 6 },
      hist: { x: 4, y: th + 4, w: W - 8, h: H - th - 8 } };
  }

  function launchZoom(sim) {
    var st = sim.state, r = st.rnd, p = sim.p;
    // most aims are far off; one in three is aimed close to show the strong pushes
    var b = r() < 0.35 ? (r() - 0.5) * 60 : (r() - 0.5) * ZW * 0.75;
    st.zoom.push({ x: -ZW / 2, y: b, vx: 1, vy: 0, trail: [], age: 0, plum: p.model === 'plum' });
    if (st.zoom.length > 7) st.zoom.shift();
  }

  function stepZoom(sim, dt) {
    var st = sim.state, d = d_fm(sim.p), V = ZW / 2.6;       // cross the view in about 2.6 s
    st.zoom.forEach(function (a) {
      a.age += dt;
      if (a.done) return;
      var n = 12, h = dt * V / n;
      for (var i = 0; i < n; i++) {
        if (!a.plum) {
          var r2 = a.x * a.x + a.y * a.y, r = Math.sqrt(r2), k = d / 2 / (r2 * r);
          a.vx += k * a.x * h; a.vy += k * a.y * h;
        }
        a.x += a.vx * h; a.y += a.vy * h;
      }
      a.trail.push([a.x, a.y]); if (a.trail.length > 900) a.trail.shift();
      if (Math.abs(a.x) > ZW * 0.7 || Math.abs(a.y) > ZW * 0.7) a.done = true;
    });
  }

  function drawLab(sim, R) {
    var ctx = sim.ctx, col = sim.colors, st = sim.state, p = sim.p, sm = sim.width < 560, m = METALS[p.metal];
    D.roundRect(ctx, R.x, R.y, R.w, R.h, 10, col.surface2, col.border, 1);
    var cx = R.x + R.w * 0.5, cy = R.y + R.h * 0.53, rr = Math.min(R.w * 0.36, R.h * 0.38);
    D.text(ctx, sm ? 'Lab (from above)' : 'The experiment, seen from above', R.x + 8, R.y + 12, { color: col.text, size: sm ? 10 : 12, weight: 800 });
    // zinc sulphide screen ring
    ctx.save(); ctx.strokeStyle = col.light ? '#86efac' : '#14532d'; ctx.lineWidth = sm ? 6 : 9;
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    // counts per angle as bars outside the ring (log scale), mirrored up and down
    var top = 0; st.bins.forEach(function (c) { top = Math.max(top, c); });
    var bl = Math.min(R.w * 0.07, 22), lt = Math.log10(1 + top) || 1;
    for (var i = 0; i < BINS; i++) {
      if (!st.bins[i]) continue;
      var L = 3 + bl * Math.log10(1 + st.bins[i]) / lt, a0 = M.rad(i * 10 + 1), a1 = M.rad(i * 10 + 9);
      [1, -1].forEach(function (sg) {
        ctx.beginPath(); ctx.arc(cx, cy, rr + 6, -sg * a0, -sg * a1, sg > 0); ctx.arc(cx, cy, rr + 6 + L, -sg * a1, -sg * a0, sg < 0);
        ctx.closePath(); ctx.fillStyle = D.alpha(ALPHA, 0.55); ctx.fill();
      });
    }
    // source: lead block with a radium sample, beam to the foil
    var sx = cx - rr * 0.78, bw = rr * 0.26;
    D.roundRect(ctx, sx - bw, cy - bw * 0.5, bw, bw, 3, col.light ? '#64748b' : '#334155', col.border, 1);
    D.circle(ctx, sx - bw * 0.45, cy, bw * 0.16, '#a3e635');
    if (!sm) D.text(ctx, 'α source', sx - bw / 2, cy + bw * 0.5 + 9, { color: col.muted, size: 10, weight: 600, align: 'center' });
    var beam = ctx.createLinearGradient(sx, 0, cx, 0); beam.addColorStop(0, D.alpha(ALPHA, 0.15)); beam.addColorStop(1, D.alpha(ALPHA, 0.7));
    ctx.fillStyle = beam; ctx.fillRect(sx, cy - 2, cx - sx, 4);
    // foil
    ctx.fillStyle = m.color; ctx.fillRect(cx - 1.5, cy - rr * 0.32, 3, rr * 0.64);
    D.text(ctx, m.sym + ' foil', cx + 5, cy - rr * 0.32 - 2, { color: col.muted, size: sm ? 9 : 10.5, weight: 700 });
    // tracks and flashes
    var now = st.time;
    st.flashes.forEach(function (f) {
      var age = now - f.t; if (age > 1.4) return;
      var a = -f.side * f.th, ex = cx + Math.cos(a) * rr, ey = cy + Math.sin(a) * rr, k = 1 - age / 1.4;
      if (f.th > M.rad(4) && age < 0.5) D.line(ctx, cx, cy, ex, ey, D.alpha(ALPHA, 0.6 * k), 1.5);
      D.circle(ctx, ex, ey, (sm ? 4 : 6) * (0.6 + k), D.alpha('#bef264', k));
    });
    // angle labels
    var lab = [[0, '0°'], [90, '90°'], [150, '150°']];
    lab.forEach(function (l) {
      var a = -M.rad(l[0]), lx = cx + Math.cos(a) * (rr - (sm ? 14 : 18)), ly = cy + Math.sin(a) * (rr - (sm ? 14 : 18));
      D.text(ctx, l[1], lx, ly, { color: col.faint, size: sm ? 9 : 10.5, weight: 700, align: 'center' });
    });
    var back = st.back;
    D.text(ctx, st.fired ? st.fired.toLocaleString('en-IN') + ' fired · ' + back.toLocaleString('en-IN') + ' bounced back' : 'Glowing screen all round the foil',
      R.x + R.w / 2, R.y + R.h - (sm ? 9 : 12), { color: back ? col.text : col.muted, size: sm ? 9.5 : 11.5, weight: 700, align: 'center', fit: R.x + R.w });
  }

  function drawZoom(sim, R) {
    var ctx = sim.ctx, col = sim.colors, st = sim.state, p = sim.p, sm = sim.width < 560, plum = p.model === 'plum';
    D.roundRect(ctx, R.x, R.y, R.w, R.h, 10, col.light ? '#f8fafc' : '#0b1222', col.border, 1);
    ctx.save(); D.roundRect(ctx, R.x, R.y, R.w, R.h, 10, null); ctx.clip();
    var cx = R.x + R.w / 2, cy = R.y + R.h / 2 + 6, sc = R.w / ZW;
    if (plum) {
      // the whole atom: spread-out positive charge with electrons in it
      var ar = Math.min(R.w, R.h) * 0.36;
      ctx.fillStyle = D.alpha('#f87171', 0.18); ctx.beginPath(); ctx.arc(cx, cy, ar, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = D.alpha('#f87171', 0.5); ctx.stroke();
      var rg = M.rng(7);
      for (var e = 0; e < 14; e++) { var ea = rg() * 6.28, er = Math.sqrt(rg()) * ar * 0.9; D.circle(ctx, cx + Math.cos(ea) * er, cy + Math.sin(ea) * er, 2.4, '#60a5fa'); }
    } else {
      var nr = Math.max(2.5, nucR(p) * sc), dd = d_fm(p) * sc;
      ctx.setLineDash([3, 3]); ctx.strokeStyle = D.alpha(col.muted, 0.6); ctx.beginPath(); ctx.arc(cx, cy, dd, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      D.circle(ctx, cx, cy, nr, '#ef4444');
      D.text(ctx, '+' + METALS[p.metal].Z, cx, cy - nr - 8, { color: '#ef4444', size: sm ? 9 : 10.5, weight: 800, align: 'center' });
    }
    st.zoom.forEach(function (a) {
      if (a.trail.length < 2) return;
      ctx.strokeStyle = D.alpha(ALPHA, 0.75); ctx.lineWidth = 1.6; ctx.beginPath();
      a.trail.forEach(function (q, i) { var X = cx + q[0] * sc, Y = cy + q[1] * sc; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.stroke();
      if (!a.done) D.circle(ctx, cx + a.x * sc, cy + a.y * sc, 3.2, ALPHA);
    });
    ctx.restore();
    D.text(ctx, plum ? (sm ? 'Plum-pudding atom' : 'Inside the foil: a plum-pudding atom') : (sm ? 'Near one nucleus' : 'Inside the foil: near one nucleus'), R.x + 8, R.y + 12, { color: col.text, size: sm ? 10 : 12, weight: 800 });
    var note = plum ? (sm ? 'charge spread out: tiny pushes' : 'positive charge spread out: every push is tiny, paths stay straight')
      : (sm ? ZW + ' fm wide · dashed: closest' : 'view ' + ZW + ' fm wide · dashed circle: closest a head-on α gets');
    D.text(ctx, note, R.x + 8, R.y + R.h - 10, { color: col.muted, size: sm ? 8.5 : 10.5, weight: 600, fit: R.x + R.w });
  }

  function drawHist(sim, R) {
    var ctx = sim.ctx, col = sim.colors, st = sim.state, p = sim.p, sm = sim.width < 560;
    var l = R.x + (sm ? 34 : 44), r = R.x + R.w - 6, t = R.y + (sm ? 20 : 24), b = R.y + R.h - (sm ? 18 : 22);
    D.text(ctx, sm ? 'Flashes per 10° (log scale)' : 'Flashes counted in each 10° band (log scale) · dots: Rutherford\'s formula', R.x + 4, R.y + 9, { color: col.text, size: sm ? 10 : 12, weight: 800, fit: R.x + R.w });
    var maxE = Math.max(1, Math.ceil(Math.log10(Math.max(10, st.fired))));
    var Y = function (c) { return b - Math.log10(1 + c) / maxE * (b - t); };
    for (var e = 0; e <= maxE; e++) {
      var gy = Y(Math.pow(10, e) - 1);
      D.line(ctx, l, gy, r, gy, col.grid, 1);
      if (!sm || e % 2 === 0 || maxE < 4) D.text(ctx, e === 0 ? '1' : e < 4 ? String(Math.pow(10, e)) : '10' + '⁰¹²³⁴⁵⁶⁷⁸'[e], l - 4, gy, { color: col.muted, size: sm ? 8.5 : 10, align: 'right' });
    }
    var bw = (r - l) / BINS;
    for (var i = 0; i < BINS; i++) {
      var c = st.bins[i], x = l + i * bw;
      if (c) { ctx.fillStyle = i >= 9 ? '#f43f5e' : ALPHA; ctx.fillRect(x + 1, Y(c), bw - 2, b - Y(c)); }
      if (p.model !== 'plum' && st.fired) {
        var ex = st.fired * (pMore(p, M.rad(Math.max(i * 10, 0.5))) - pMore(p, M.rad((i + 1) * 10)));
        if (i === 0) ex = st.fired * (1 - pMore(p, M.rad(10)));
        if (ex > 0.05) D.circle(ctx, x + bw / 2, Y(ex), sm ? 2.2 : 3, col.text);
      }
      if (i % 3 === 0) D.text(ctx, i * 10 + '°', x, b + (sm ? 8 : 10), { color: col.muted, size: sm ? 8.5 : 10, align: 'center' });
    }
    D.text(ctx, '180°', r, b + (sm ? 8 : 10), { color: col.muted, size: sm ? 8.5 : 10, align: 'right' });
    D.line(ctx, l + bw * 9, t, l + bw * 9, b, D.alpha('#f43f5e', 0.6), 1, [4, 3]);
    if (!sm) D.text(ctx, 'bounced back →', l + bw * 9 + 4, t + 6, { color: '#f43f5e', size: 10.5, weight: 700 });
  }

  SimLab.createSim({
    ariaLabel: 'Rutherford gold-foil experiment: alpha particles from a source hit a thin metal foil inside a ring-shaped glowing screen; flashes show where they land, a zoomed view shows alpha paths bending round a tiny nucleus, and a bar chart counts flashes at each angle',
    mobileAspect: '1 / 1',
    playLabel: 'Fire alphas',
    params: [
      { id: 'model', label: 'Atom model', type: 'select', value: 'nucleus', options: [
        { value: 'nucleus', label: 'Rutherford: tiny heavy nucleus' }, { value: 'plum', label: 'Thomson: plum pudding' }] },
      { id: 'rate', label: 'Beam', type: 'select', value: 'fast', options: [
        { value: 'slow', label: 'Slow: 8 alphas a second' }, { value: 'fast', label: 'Fast: 400 a second' }, { value: 'vfast', label: 'Very fast: 20,000 a second' }] },
      { id: 'metal', label: 'Foil metal', type: 'select', value: 'au', options: [
        { value: 'au', label: 'Gold (Z = 79)' }, { value: 'ag', label: 'Silver (Z = 47)' }, { value: 'al', label: 'Aluminium (Z = 13)' }] },
      { id: 'E', label: 'Alpha energy', min: 2, max: 8, step: 0.1, value: 5, unit: 'MeV' },
      { id: 't', label: 'Foil thickness', min: 0.2, max: 4, step: 0.1, value: 1, unit: 'µm', help: '1 µm of gold is about 3,500 layers of atoms.' }
    ],
    readouts: [
      { id: 'fired', label: 'Alphas fired', key: true, short: 'Fired' },
      { id: 'small', label: 'Went almost straight (< 10°)' },
      { id: 'back', label: 'Bounced back (> 90°)', key: true, short: 'Bounced back' },
      { id: 'oneIn', label: 'Bounce-back rate (formula)' },
      { id: 'd', label: 'Closest approach, head-on', key: true, short: 'Closest' },
      { id: 'R', label: 'Size of the nucleus (radius)' }
    ],

    reset: function (sim) {
      var bins = []; for (var i = 0; i < BINS; i++) bins.push(0);
      sim.state = { rnd: M.rng(12345), bins: bins, fired: 0, back: 0, small: 0, flashes: [], zoom: [], zt: 0.2, time: 0, acc: 0 };
    },
    update: function (sim, dt) {
      var st = sim.state; st.time += dt;
      st.acc += RATES[sim.p.rate] * dt;
      var n = Math.floor(st.acc); st.acc -= n;
      for (var i = 0; i < n; i++) {
        var th = sample(sim), deg = M.deg(th), bin = Math.min(BINS - 1, Math.floor(deg / 10));
        st.fired++; st.bins[bin]++;
        if (deg > 90) st.back++;
        if (deg < 10) st.small++;
        // keep every big deflection, and a few of the rest, as flashes
        if (deg > 4 || st.rnd() < 6 / Math.max(6, RATES[sim.p.rate])) {
          st.flashes.push({ th: th, side: st.rnd() < 0.5 ? 1 : -1, t: st.time });
          if (st.flashes.length > 160) st.flashes.shift();
        }
      }
      st.zt -= dt;
      if (st.zt <= 0) { st.zt = 0.55; launchZoom(sim); }
      stepZoom(sim, dt);
    },
    status: function (sim) {
      var st = sim.state;
      if (!st.fired) return sim.p.model === 'plum' ? 'Thomson\'s model: will any alpha bounce back?' : 'Press Fire alphas and watch the screen. Do any come back?';
      if (!st.back) return st.fired.toLocaleString('en-IN') + ' alphas: ' + M.fmt(st.small / st.fired * 100, 2) + '% went almost straight through. None bounced back yet.';
      return 'About 1 in ' + Math.round(st.fired / st.back).toLocaleString('en-IN') + ' alphas bounced back: something tiny, heavy and positive is in the atom';
    },
    readout: function (sim) {
      var st = sim.state, p = sim.p, pb = pMore(p, Math.PI / 2);
      return {
        fired: st.fired.toLocaleString('en-IN'),
        small: st.fired ? M.fmt(st.small / st.fired * 100, 3) + ' %' : '—',
        back: st.back.toLocaleString('en-IN'),
        oneIn: pb > 0 ? '1 in ' + Math.round(1 / pb).toLocaleString('en-IN') : 'none',
        d: p.model === 'plum' ? 'no nucleus' : M.fmt(d_fm(p), 1) + ' fm',
        R: p.model === 'plum' ? 'no nucleus' : M.fmt(nucR(p), 1) + ' fm (atom ≈ 1,44,000 fm)'
      };
    },
    draw: function (sim) {
      var ctx = sim.ctx, L = layout(sim);
      D.clear(ctx, sim.width, sim.height, sim.colors.bg);
      drawLab(sim, L.lab); drawZoom(sim, L.zoom); drawHist(sim, L.hist);
    }
  });
})();
