/* =====================================================================
   Chemistry · Structure of atom · Photoelectric Effect — sim.js
   ---------------------------------------------------------------------
   Light of wavelength λ is a stream of photons, each of energy
       E = h ν = h c / λ = 1239.84 / λ[nm]  eV.
   One photon gives all its energy to one electron in the metal plate.
   The electron needs the work function φ to escape, so
       KE_max = h ν − φ      (no electrons at all if h ν < φ)
       threshold frequency ν₀ = φ / h,  threshold wavelength λ₀ = 1239.84 / φ nm
   Brightness = number of photons per second → number of electrons (current),
   not their energy.
   Circuit: collector at voltage V relative to the emitter plate.
     V ≥ 0  → every emitted electron is collected (saturation current)
     V < 0  → only electrons with KE > e|V| reach it; with KE spread evenly
              from 0 to KE_max: I = I_sat (1 − |V| / KE_max)
     stopping potential V₀ = KE_max / e.
   Saturation current: 6 µA at full brightness (a made-up but typical size).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var HC = 1239.84, ISAT = 6;
  var METALS = {
    cs: { name: 'Caesium', phi: 2.14, color: '#e2c27a' },
    k: { name: 'Potassium', phi: 2.30, color: '#cbd5e1' },
    na: { name: 'Sodium', phi: 2.75, color: '#d4d4d8' },
    ca: { name: 'Calcium', phi: 3.20, color: '#e5e7eb' },
    zn: { name: 'Zinc', phi: 4.30, color: '#a1a1aa' },
    cu: { name: 'Copper', phi: 4.65, color: '#f59e0b' },
    pt: { name: 'Platinum', phi: 5.65, color: '#d6d3d1' }
  };
  var E_COL = '#38bdf8';

  function wlColor(l, a) {
    var r = 0, g = 0, b = 0;
    if (l < 380) { r = 0.6; g = 0.4; b = 1; }
    else if (l < 440) { r = -(l - 440) / 60; b = 1; }
    else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = -(l - 510) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = -(l - 645) / 65; }
    else { r = 1; }
    var f = l < 380 ? 1 : l < 420 ? 0.45 + 0.55 * (l - 380) / 40 : l > 700 ? 0.45 + 0.55 * (780 - l) / 80 : 1;
    function c(v) { return Math.round(255 * Math.pow(Math.max(0, v * f), 0.8)); }
    return 'rgba(' + c(r) + ',' + c(g) + ',' + c(b) + ',' + (a == null ? 1 : a) + ')';
  }
  function phys(p) {
    var m = METALS[p.metal], E = HC / p.lam, K = E - m.phi;
    var isat = K > 0 ? ISAT * p.bright / 100 : 0;
    var frac = K <= 0 ? 0 : p.V >= 0 ? 1 : Math.max(0, 1 - (-p.V) / K);
    return { m: m, E: E, K: Math.max(0, K), on: K > 0, I: isat * frac, isat: isat, V0: Math.max(0, K), nu: 299792.458 / p.lam / 100, lam0: HC / m.phi };
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, sm = W < 560;
    if (W >= 640) {
      var tw = Math.round(W * 0.56);
      return { sm: sm, tube: { x: 8, y: 8, w: tw - 12, h: H - 16 }, iv: { x: tw + 4, y: 8, w: W - tw - 12, h: Math.round(H / 2) - 10 }, kf: { x: tw + 4, y: Math.round(H / 2) + 6, w: W - tw - 12, h: H - Math.round(H / 2) - 14 } };
    }
    var th = Math.round(H * 0.58);
    return { sm: sm, tube: { x: 4, y: 4, w: W - 8, h: th - 6 }, iv: { x: 4, y: th + 4, w: Math.round(W / 2) - 6, h: H - th - 8 }, kf: { x: Math.round(W / 2) + 2, y: th + 4, w: W - Math.round(W / 2) - 6, h: H - th - 8 } };
  }
  function tubeGeo(R) {
    var gw = R.w * 0.62, gh = R.h * 0.5, gx = R.x + R.w * 0.3, gy = R.y + R.h * 0.12;
    return { gx: gx, gy: gy, gw: gw, gh: gh, ex: gx + gw * 0.12, cxp: gx + gw * 0.88, py0: gy + gh * 0.2, py1: gy + gh * 0.8 };
  }

  function drawTube(sim, R, P) {
    var ctx = sim.ctx, col = sim.colors, st = sim.state, p = sim.p, sm = sim.width < 560, G = tubeGeo(R);
    // glass tube
    D.roundRect(ctx, G.gx, G.gy, G.gw, G.gh, G.gh * 0.45, col.light ? 'rgba(186,230,253,0.35)' : 'rgba(14,165,233,0.08)', col.light ? '#7dd3fc' : '#0e7490', 1.5);
    D.text(ctx, 'vacuum', G.gx + G.gw / 2, G.gy + G.gh - 10, { color: col.faint, size: sm ? 8.5 : 10, align: 'center' });
    // emitter plate (lit metal) and collector
    ctx.fillStyle = P.m.color; ctx.fillRect(G.ex - 4, G.py0, 8, G.py1 - G.py0);
    ctx.fillStyle = col.light ? '#64748b' : '#94a3b8'; ctx.fillRect(G.cxp - 3, G.py0, 6, G.py1 - G.py0);
    D.text(ctx, P.m.name, G.ex, G.py0 - 9, { color: col.text, size: sm ? 9.5 : 11, weight: 700, align: 'center' });
    D.text(ctx, 'collector', G.cxp, G.py0 - 9, { color: col.muted, size: sm ? 9 : 10.5, weight: 600, align: 'center' });
    // lamp shining in from the left
    var lx = R.x + R.w * 0.08, ly = G.gy + G.gh / 2;
    D.circle(ctx, lx, ly, sm ? 11 : 15, wlColor(p.lam, 0.25 + 0.75 * p.bright / 100), col.border, 1);
    D.text(ctx, Math.round(p.lam) + ' nm', lx, ly + (sm ? 22 : 27), { color: col.text, size: sm ? 9.5 : 11, weight: 800, align: 'center' });
    if (p.lam < 400) D.text(ctx, 'ultraviolet', lx, ly + (sm ? 34 : 41), { color: col.muted, size: sm ? 8.5 : 10, weight: 600, align: 'center' });
    // photons: little wave packets flying to the plate
    ctx.save(); ctx.lineWidth = 2;
    st.photons.forEach(function (ph) {
      var x = M.lerp(lx + 16, G.ex - 6, ph.s), y = M.lerp(ly, ph.y, ph.s), wl = 3 + p.lam / 700 * 5;
      ctx.strokeStyle = wlColor(p.lam); ctx.beginPath();
      for (var k = 0; k <= 12; k++) { var u = k / 12 * 16, w = Math.sin(u / wl * 6.28) * 3 * Math.sin(Math.PI * k / 12); if (k) ctx.lineTo(x - 16 + u, y + w); else ctx.moveTo(x - 16 + u, y + w); }
      ctx.stroke();
    });
    ctx.restore();
    // field arrow and electrons
    if (p.V !== 0) {
      var ay = G.gy + 12, dir = p.V > 0 ? 1 : -1;
      D.arrow(ctx, (G.ex + G.cxp) / 2 - dir * 22, ay, (G.ex + G.cxp) / 2 + dir * 22, ay, D.alpha(col.muted, 0.8), 1.5, 6);
      D.text(ctx, dir > 0 ? 'pulled across' : 'pushed back', (G.ex + G.cxp) / 2, ay + 11, { color: col.faint, size: sm ? 8.5 : 9.5, align: 'center' });
    }
    st.els.forEach(function (e) { D.circle(ctx, M.lerp(G.ex + 5, G.cxp - 4, e.x), e.y, sm ? 2.8 : 3.4, E_COL); });
    // circuit underneath: battery, ammeter
    var cy = G.gy + G.gh + (R.y + R.h - 40 - G.gy - G.gh) * 0.55, cl = G.ex, cr = G.cxp, mx = (cl + cr) / 2;
    ctx.strokeStyle = col.axis; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(G.ex, G.py1); ctx.lineTo(G.ex, G.gy + G.gh); ctx.moveTo(G.ex, G.gy + G.gh); ctx.lineTo(cl, cy); ctx.lineTo(mx - 50, cy);
    ctx.moveTo(mx + 30, cy); ctx.lineTo(cr, cy); ctx.lineTo(cr, G.gy + G.gh); ctx.moveTo(cr, G.py1); ctx.lineTo(cr, G.gy + G.gh); ctx.stroke();
    // battery symbol (long plate = +)
    var bx = mx - 44, pos = p.V >= 0;
    D.line(ctx, bx, cy - (pos ? 6 : 12), bx, cy + (pos ? 6 : 12), col.text, pos ? 3 : 1.5);
    D.line(ctx, bx + 8, cy - (pos ? 12 : 6), bx + 8, cy + (pos ? 12 : 6), col.text, pos ? 1.5 : 3);
    D.line(ctx, bx + 8, cy, mx - 14, cy, col.axis, 1.5);
    D.text(ctx, (p.V > 0 ? '+' : '') + M.fmt(p.V, 2) + ' V', bx - 8, cy, { color: col.text, size: sm ? 10 : 12, weight: 800, align: 'right', bg: col.bg, pad: 2 });
    // ammeter
    D.circle(ctx, mx + 8, cy, sm ? 13 : 16, col.surface2, col.text, 1.5);
    D.text(ctx, 'µA', mx + 8, cy, { color: col.text, size: sm ? 9 : 10.5, weight: 800, align: 'center' });
    D.line(ctx, mx - 14, cy, mx - 6, cy, col.axis, 1.5);
    D.text(ctx, M.fmt(P.I, 2) + ' µA', mx + 8 + (sm ? 19 : 22), cy, { color: P.I > 0 ? col.success : col.muted, size: sm ? 11 : 13, weight: 800 });
    // energy bar: photon energy = work function + KE
    var bxx = R.x + 8, by = R.y + R.h - (sm ? 20 : 24), bwid = R.w - 16, s = bwid / 7;
    D.text(ctx, 'photon ' + M.fmt(P.E, 2) + ' eV', bxx, by - (sm ? 10 : 13), { color: wlColor(p.lam), size: sm ? 9.5 : 11, weight: 800 });
    ctx.fillStyle = D.alpha(col.muted, 0.35); ctx.fillRect(bxx, by - 5, Math.min(P.m.phi, 7) * s, 10);
    ctx.fillStyle = wlColor(p.lam, 0.9); ctx.fillRect(bxx, by - 2, Math.min(P.E, 7) * s, 4);
    if (P.on) { ctx.fillStyle = E_COL; ctx.fillRect(bxx + P.m.phi * s, by - 5, Math.min(P.K, 7 - P.m.phi) * s, 10); }
    D.text(ctx, 'work function ' + M.fmt(P.m.phi, 2) + ' eV' + (P.on ? ' + KE ' + M.fmt(P.K, 2) + ' eV' : ''), bxx, by + (sm ? 12 : 14), { color: col.muted, size: sm ? 8.5 : 10, weight: 600 });
    if (!P.on) D.text(ctx, 'below threshold: no electrons, however bright', R.x + R.w / 2, G.gy + G.gh / 2, { color: col.danger, size: sm ? 10 : 12, weight: 800, align: 'center', bg: D.alpha(col.bg, 0.8), fit: R.x + R.w });
    D.text(ctx, sm ? 'Photoelectric tube' : 'Photoelectric tube', R.x + 4, R.y + 6, { color: col.text, size: sm ? 10.5 : 12, weight: 800 });
  }

  function axes(sim, R, title, xl, yl) {
    var ctx = sim.ctx, col = sim.colors, sm = sim.width < 560;
    D.roundRect(ctx, R.x, R.y, R.w, R.h, 8, null, col.border, 1);
    D.text(ctx, title, R.x + 6, R.y + 10, { color: col.text, size: sm ? 9.5 : 11.5, weight: 800, fit: R.x + R.w });
    var g = { l: R.x + (sm ? 20 : 30), r: R.x + R.w - 8, t: R.y + (sm ? 22 : 26), b: R.y + R.h - (sm ? 16 : 20) };
    D.line(ctx, g.l, g.b, g.r, g.b, col.axis, 1); D.line(ctx, g.l, g.t, g.l, g.b, col.axis, 1);
    D.text(ctx, xl, g.r, g.b + (sm ? 8 : 10), { color: col.muted, size: sm ? 8.5 : 10, align: 'right' });
    D.text(ctx, yl, g.l + 4, g.t + 2, { color: col.muted, size: sm ? 8.5 : 10 });
    return g;
  }

  function drawIV(sim, R, P) {
    var ctx = sim.ctx, col = sim.colors, p = sim.p, sm = sim.width < 560;
    var g = axes(sim, R, sm ? 'Current vs voltage' : 'Current vs collector voltage', 'V', 'µA');
    var X = function (v) { return g.l + (v + 6) / 9 * (g.r - g.l); }, Y = function (i) { return g.b - i / (ISAT * 1.1) * (g.b - g.t); };
    D.line(ctx, X(0), g.t, X(0), g.b, D.alpha(col.axis, 0.6), 1, [3, 3]);
    [-6, -3, 0].forEach(function (v) { D.text(ctx, String(v), X(v), g.b + (sm ? 8 : 10), { color: col.faint, size: sm ? 8 : 9.5, align: 'center' }); });
    // curves for the brightness used before (faint) and now
    sim.state.ghosts.forEach(function (gh) { curve(gh, D.alpha(col.muted, 0.5), 1.4); });
    curve(p, col.accent, 2.4);
    function curve(q, c, w) {
      var r = phys(q); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath();
      for (var v = -6; v <= 3.001; v += 0.05) {
        var I = r.on ? r.isat * (v >= 0 ? 1 : Math.max(0, 1 + v / r.K)) : 0;
        if (v === -6) ctx.moveTo(X(v), Y(I)); else ctx.lineTo(X(v), Y(I));
      }
      ctx.stroke();
    }
    D.circle(ctx, X(M.clamp(p.V, -6, 3)), Y(P.I), 4.5, col.accent, col.bg, 1.5);
    if (P.on && P.K < 6) {
      D.text(ctx, '−V₀ = ' + M.fmt(-P.V0, 2), X(-P.V0), g.b - (sm ? 10 : 12), { color: col.danger, size: sm ? 8.5 : 10, weight: 700, align: 'center', fit: R.x + R.w });
    }
  }

  function drawKF(sim, R, P) {
    var ctx = sim.ctx, col = sim.colors, p = sim.p, sm = sim.width < 560;
    var g = axes(sim, R, sm ? 'Max KE vs frequency' : 'Max kinetic energy vs frequency', '10¹⁴ Hz', 'eV');
    var f0 = 4, f1 = 15, X = function (f) { return g.l + (f - f0) / (f1 - f0) * (g.r - g.l); }, Y = function (e) { return g.b - e / 4.5 * (g.b - g.t); };
    [5, 10].forEach(function (f) { D.text(ctx, String(f), X(f), g.b + (sm ? 8 : 10), { color: col.faint, size: sm ? 8 : 9.5, align: 'center' }); });
    // Einstein's line for every metal: same slope h, different start
    Object.keys(METALS).forEach(function (k) {
      var m = METALS[k], me = k === p.metal, nu0 = m.phi / 0.41357;   // h = 4.1357 × 10⁻¹⁵ eV s, ν in 10¹⁴ Hz
      ctx.strokeStyle = me ? col.accent : D.alpha(col.muted, 0.35); ctx.lineWidth = me ? 2.2 : 1;
      ctx.beginPath(); ctx.moveTo(X(Math.max(f0, nu0)), Y(0)); ctx.lineTo(X(f1), Y(0.41357 * f1 - m.phi)); ctx.stroke();
      if (me && !sm) D.text(ctx, 'ν₀ = ' + M.fmt(nu0, 2), X(nu0), g.b - 9, { color: col.accent, size: 10, weight: 700, align: 'center', fit: R.x + R.w });
    });
    sim.state.points.forEach(function (q) { if (q.metal === p.metal) D.circle(ctx, X(q.nu), Y(q.K), 2.8, D.alpha(E_COL, 0.7)); });
    var nu = P.nu;
    if (nu >= f0 && nu <= f1) D.circle(ctx, X(nu), Y(P.K), 5, wlColor(p.lam), col.bg, 1.5);
  }

  SimLab.createSim({
    ariaLabel: 'Photoelectric effect: a lamp of chosen colour shines photons on a metal plate inside a vacuum tube; electrons jump out and fly to a collector, with a battery and microammeter, an energy bar of photon energy against work function, a current–voltage graph and a graph of maximum kinetic energy against frequency',
    mobileAspect: '1 / 1',
    playLabel: 'Switch on the light',
    params: [
      { id: 'metal', label: 'Metal plate', type: 'select', value: 'na', options: Object.keys(METALS).map(function (k) { return { value: k, label: METALS[k].name + ' (φ = ' + M.fmt(METALS[k].phi, 2) + ' eV)' }; }) },
      { id: 'lam', label: 'Wavelength of the light', min: 200, max: 700, step: 1, value: 300, unit: 'nm',
        presets: [{ label: 'Red 650', value: 650 }, { label: 'Green 530', value: 530 }, { label: 'Violet 400', value: 400 }, { label: 'UV 250', value: 250 }] },
      { id: 'bright', label: 'Brightness (photons per second)', min: 0, max: 100, step: 5, value: 60, unit: '%' },
      { id: 'V', label: 'Collector voltage', min: -6, max: 3, step: 0.05, value: 1, unit: 'V' }
    ],
    readouts: [
      { id: 'E', label: 'Photon energy', key: true, short: 'Photon' },
      { id: 'K', label: 'Max kinetic energy of electrons', key: true, short: 'Max KE' },
      { id: 'I', label: 'Current', key: true },
      { id: 'V0', label: 'Stopping potential' },
      { id: 'nu', label: 'Frequency of the light' },
      { id: 'th', label: 'Threshold for this metal' }
    ],
    onParam: function (sim, id) {
      var st = sim.state;
      if (id === 'bright' || id === 'metal' || id === 'lam') {
        st.ghosts.push({ metal: sim.p.metal, lam: sim.p.lam, bright: sim.p.bright, V: sim.p.V });
        if (st.ghosts.length > 3) st.ghosts.shift();
      }
      if (id === 'lam' || id === 'metal') {
        var P = phys(sim.p);
        if (P.on) { st.points.push({ metal: sim.p.metal, nu: P.nu, K: P.K }); if (st.points.length > 60) st.points.shift(); }
      }
      return true;
    },
    reset: function (sim) {
      sim.state = { photons: [], els: [], acc: 0, eacc: 0, rnd: M.rng(5), ghosts: [], points: [] };
    },
    update: function (sim, dt) {
      var st = sim.state, p = sim.p, P = phys(p), L = layout(sim), G = tubeGeo(L.tube), r = st.rnd;
      // photons: a visible sample, more when brighter
      st.acc += dt * p.bright / 100 * 14;
      while (st.acc >= 1) {
        st.acc -= 1;
        st.photons.push({ s: 0, y: M.lerp(G.py0 + 4, G.py1 - 4, r()) });
      }
      for (var i = st.photons.length - 1; i >= 0; i--) {
        var ph = st.photons[i]; ph.s += dt * 1.6;
        if (ph.s >= 1) {
          st.photons.splice(i, 1);
          // each photon that reaches the plate frees one electron if it has enough energy (shown 1 in 1)
          if (P.on) st.els.push({ x: 0, y: ph.y, v: Math.sqrt(r() * P.K) * 0.9, age: 0 });
        }
      }
      // electrons in the uniform field between the plates (gap = 1 unit)
      var a = p.V * 0.405;                     // v₀² = 0.81 KE, so v² = v₀² + 2 a x turns back at x = KE / |V|
      for (var j = st.els.length - 1; j >= 0; j--) {
        var e = st.els[j]; e.age += dt;
        e.v += a * dt; e.x += e.v * dt + (p.V >= 0 ? 0.02 * dt : 0);
        if (e.x >= 1 || e.x < 0 || e.age > 6) st.els.splice(j, 1);
      }
      if (st.els.length > 220) st.els.splice(0, st.els.length - 220);
    },
    status: function (sim) {
      var P = phys(sim.p);
      if (!P.on) return 'Each photon has only ' + M.fmt(P.E, 2) + ' eV, less than the ' + M.fmt(P.m.phi, 2) + ' eV needed: no electrons come out. Try a shorter wavelength.';
      if (sim.p.V < 0 && P.I === 0) return 'The collector voltage turns back every electron: the stopping potential is ' + M.fmt(P.V0, 2) + ' V';
      return M.fmt(P.E, 2) + ' eV photon − ' + M.fmt(P.m.phi, 2) + ' eV to escape = up to ' + M.fmt(P.K, 2) + ' eV of kinetic energy';
    },
    readout: function (sim) {
      var P = phys(sim.p);
      return {
        E: M.fmt(P.E, 2) + ' eV', K: P.on ? M.fmt(P.K, 2) + ' eV' : 'no electrons', I: M.fmt(P.I, 2) + ' µA',
        V0: P.on ? M.fmt(P.V0, 2) + ' V' : '—', nu: M.fmt(P.nu, 2) + ' × 10¹⁴ Hz',
        th: Math.round(P.lam0) + ' nm (' + M.fmt(P.m.phi / 0.41357, 2) + ' × 10¹⁴ Hz)'
      };
    },
    draw: function (sim) {
      var L = layout(sim), P = phys(sim.p);
      D.clear(sim.ctx, sim.width, sim.height, sim.colors.bg);
      drawTube(sim, L.tube, P); drawIV(sim, L.iv, P); drawKF(sim, L.kf, P);
    }
  });
})();
