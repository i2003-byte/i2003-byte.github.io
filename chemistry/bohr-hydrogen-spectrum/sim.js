/* =====================================================================
   Chemistry · Structure of atom · Bohr Model & Hydrogen Spectrum — sim.js
   ---------------------------------------------------------------------
   Bohr's hydrogen atom: allowed orbits n = 1, 2, 3 …
     energy        Eₙ = −13.6 / n²  eV
     radius        rₙ = 0.0529 n²  nm
   A jump from n₂ to n₁ (n₂ > n₁) gives out one photon:
     E = 13.6 (1/n₁² − 1/n₂²) eV,   λ = 1239.84 / E nm   (Hα 3 → 2: 656 nm)
   Jumping up needs a photon of exactly the same energy (absorption).
   Series: Lyman (to n = 1, ultraviolet), Balmer (to n = 2, visible),
           Paschen (to n = 3, infrared).
   "Discharge tube": electrons hitting atoms lift them to a random level
   up to n_max; the atom then falls back step by step, choosing each lower
   level at random (real atoms favour some jumps; that is left out).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var NMAX = 7, HC = 1239.84;
  var SERIES = { 1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett', 5: 'Pfund', 6: 'Humphreys' };

  function En(n) { return -13.6 / (n * n); }
  function lam(a, b) { return HC / Math.abs(En(a) - En(b)); }
  // colour of a wavelength (nm) for drawing
  function wlColor(l, alpha) {
    var r = 0, g = 0, b = 0;
    if (l < 380) { r = 0.55; g = 0.35; b = 1; }
    else if (l < 440) { r = -(l - 440) / 60; b = 1; }
    else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = -(l - 510) / 20; }
    else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = -(l - 645) / 65; }
    else if (l <= 780) { r = 1; }
    else { r = 0.75; g = 0.12; b = 0.12; }
    var f = l < 380 ? 1 : l < 420 ? 0.4 + 0.6 * (l - 380) / 40 : l > 700 && l <= 780 ? 0.4 + 0.6 * (780 - l) / 80 : 1;
    function c(v) { return Math.round(255 * Math.pow(Math.max(0, v * f), 0.8)); }
    return 'rgba(' + c(r) + ',' + c(g) + ',' + c(b) + ',' + (alpha == null ? 1 : alpha) + ')';
  }
  function band(l) { return l < 380 ? 'ultraviolet' : l <= 750 ? 'visible' : 'infrared'; }
  function colourName(l) {
    if (l < 380) return 'ultraviolet (invisible)';
    if (l < 450) return 'violet';
    if (l < 495) return 'blue-green';
    if (l < 570) return 'green';
    if (l < 590) return 'yellow';
    if (l < 620) return 'orange';
    if (l <= 750) return 'red';
    return 'infrared (invisible)';
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, sm = W < 560, specH = Math.round(H * (sm ? 0.3 : 0.27));
    var top = H - specH;
    var aw = Math.min(Math.round(W * 0.5), top);
    return { W: W, H: H, sm: sm, atom: { x: 4, y: 4, w: aw - 8, h: top - 8 }, lev: { x: aw + 2, y: 4, w: W - aw - 6, h: top - 8 }, spec: { x: 4, y: top + 2, w: W - 8, h: specH - 6 } };
  }
  function orbitR(R, n) { return Math.min(R.w, R.h) * 0.47 * (0.12 + 0.88 * (n - 1) / (NMAX - 1)); }
  function levY(R, n, sm) {
    // energy scale squeezed so n = 1 and the top levels both fit: y ∝ E^(0.5)
    var t = R.y + (sm ? 30 : 36), b = R.y + R.h - (sm ? 14 : 20), e = Math.sqrt(-En(n) / 13.6);
    return t + e * (b - t);
  }

  // a jump chosen by the visitor switches the lamp off, so the electron stays where it is put
  function manualJump(sim, from, to) {
    var st = sim.state;
    if (st.anim || to === (from || st.n)) return;
    if (sim.p.lamp) sim.setParam('lamp', false);
    if (from) st.n = from;
    jump(sim, to, true);
    if (!sim.running) sim.play();
  }
  function jump(sim, to, manual) {
    var st = sim.state, from = st.n;
    if (to === from || st.anim) return false;
    var l = lam(from, to), emit = to < from;
    st.anim = { from: from, to: to, t: 0 };
    st.photons.push({ l: l, emit: emit, t: 0, ang: st.ang, from: from, to: to });
    if (st.photons.length > 6) st.photons.shift();
    st.last = { from: from, to: to, l: l, E: Math.abs(En(from) - En(to)), emit: emit };
    if (emit) {
      var key = from + '-' + to;
      st.lines[key] = (st.lines[key] || 0) + 1;
      st.count++;
    } else st.abs[from + '-' + to] = (st.abs[from + '-' + to] || 0) + 1;
    st.manual = !!manual;
    return true;
  }

  function drawAtom(sim, R) {
    var ctx = sim.ctx, col = sim.colors, st = sim.state, sm = sim.width < 560;
    var cx = R.x + R.w / 2, cy = R.y + R.h / 2 + (sm ? 6 : 8);
    D.text(ctx, sm ? 'Hydrogen atom' : 'Hydrogen atom (orbits not to scale)', R.x + 4, R.y + 10, { color: col.text, size: sm ? 10.5 : 12, weight: 800 });
    for (var n = 1; n <= NMAX; n++) {
      var r = orbitR(R, n), on = n <= sim.p.top;
      ctx.strokeStyle = n === st.n ? D.alpha(col.accent, 0.9) : D.alpha(col.muted, on ? 0.45 : 0.15); ctx.lineWidth = n === st.n ? 2 : 1;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      if (sm ? n % 2 : true) D.text(ctx, 'n=' + n, cx + r * 0.71 + 2, cy - r * 0.71 - 2, { color: col.faint, size: sm ? 8 : 9.5, weight: 700 });
    }
    // nucleus: one proton
    D.circle(ctx, cx, cy, sm ? 4 : 5, '#ef4444');
    // electron, gliding between orbits during a jump
    var rn = orbitR(R, st.n);
    if (st.anim) { var k = M.clamp(st.anim.t / 0.35, 0, 1); k = k * k * (3 - 2 * k); rn = M.lerp(orbitR(R, st.anim.from), orbitR(R, st.anim.to), k); }
    D.circle(ctx, cx + Math.cos(st.ang) * rn, cy + Math.sin(st.ang) * rn, sm ? 4.5 : 5.5, '#38bdf8', col.bg, 1.5);
    // photons as little wave packets leaving (or arriving at) the atom
    ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
    st.photons.forEach(function (ph) {
      var dist = ph.emit ? ph.t * 150 : Math.max(0, (0.6 - ph.t) * 150);
      if (ph.t > 2.5) return;
      var a = ph.ang, r0 = orbitR(R, Math.max(ph.from, ph.to)) + dist, wl = 4 + ph.l / 656 * 6;
      var x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0, nx = -Math.sin(a), ny = Math.cos(a);
      ctx.strokeStyle = wlColor(ph.l); ctx.lineWidth = 2.2; ctx.beginPath();
      for (var s = 0; s <= 36; s++) {
        var u = s / 36 * 34, env = Math.sin(Math.PI * s / 36), w = Math.sin(u / wl * 2 * Math.PI) * 5 * env;
        var px = x0 + Math.cos(a) * u + nx * w, py = y0 + Math.sin(a) * u + ny * w;
        if (s) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawLevels(sim, R) {
    var ctx = sim.ctx, col = sim.colors, st = sim.state, sm = sim.width < 560;
    D.text(ctx, sm ? 'Energy levels' : 'Energy levels (tap one to jump)', R.x + 4, R.y + 10, { color: col.text, size: sm ? 10.5 : 12, weight: 800 });
    var lx = R.x + (sm ? 30 : 40), rx = R.x + R.w - (sm ? 46 : 70);
    // ionisation line
    var y0 = levY(R, Infinity, sm);
    D.line(ctx, lx, y0, rx, y0, D.alpha(col.muted, 0.6), 1, [4, 4]);
    D.text(ctx, '0 eV (free)', rx + 4, y0, { color: col.faint, size: sm ? 8.5 : 10, weight: 600 });
    for (var n = 1; n <= NMAX; n++) {
      var y = levY(R, n, sm), on = n <= sim.p.top;
      D.line(ctx, lx, y, rx, y, n === st.n ? col.accent : D.alpha(col.text, on ? 0.75 : 0.25), n === st.n ? 3 : 1.6);
      if (n <= 4 || n === NMAX) {
        D.text(ctx, 'n=' + n, lx - 4, y, { color: n === st.n ? col.accent : col.muted, size: sm ? 9 : 10.5, weight: 700, align: 'right' });
        D.text(ctx, M.fmt(En(n), 2) + ' eV', rx + 4, y, { color: col.muted, size: sm ? 8.5 : 10, weight: 600 });
      }
    }
    // arrows of recent jumps, the newest bold
    var recent = st.photons.slice(-5);
    recent.forEach(function (ph, i) {
      var x = lx + 12 + i * (rx - lx - 24) / 5, yA = levY(R, ph.from, sm), yB = levY(R, ph.to, sm), me = i === recent.length - 1;
      D.arrow(ctx, x, yA, x, yB, wlColor(ph.l, me ? 1 : 0.45), me ? 3 : 2, me ? 9 : 7);
    });
    if (st.last && !sm) {
      var L = st.last;
      D.text(ctx, (L.emit ? 'gave out ' : 'took in ') + M.fmt(L.E, 2) + ' eV · ' + Math.round(L.l) + ' nm', (lx + rx) / 2, R.y + 26, { color: wlColor(L.l), size: 11, weight: 800, align: 'center', bg: D.alpha(col.bg, 0.8) });
    }
  }

  function drawSpectrum(sim, R) {
    var ctx = sim.ctx, col = sim.colors, st = sim.state, sm = sim.width < 560;
    // three windows, each with its own scale: UV (Lyman), visible (Balmer), IR (Paschen and beyond)
    var gap = 6, w = R.w - 2 * gap, ws = [0.22, 0.5, 0.28];
    var wins = [[88, 126, 'Ultraviolet · Lyman (→ n=1)'], [380, 750, 'Visible · Balmer (→ n=2)'], [800, 4100, 'Infrared · Paschen and beyond']];
    if (sm) wins[0][2] = 'UV · Lyman', wins[1][2] = 'Visible · Balmer', wins[2][2] = 'Infrared';
    var x = R.x, top = R.y + (sm ? 16 : 18), h = R.h - (sm ? 30 : 34), maxC = 1;
    Object.keys(st.lines).forEach(function (k) { maxC = Math.max(maxC, st.lines[k]); });
    wins.forEach(function (wn, i) {
      var ww = w * ws[i], X = function (l) { return x + (l - wn[0]) / (wn[1] - wn[0]) * ww; };
      D.text(ctx, wn[2], x + 2, R.y + 7, { color: col.muted, size: sm ? 8.5 : 10.5, weight: 700 });
      ctx.fillStyle = '#05070d'; ctx.fillRect(x, top, ww, h);
      if (i === 1 && sim.p.rainbow) {
        for (var px = 0; px < ww; px += 2) { ctx.fillStyle = wlColor(wn[0] + px / ww * (wn[1] - wn[0]), 0.16); ctx.fillRect(x + px, top, 2, h); }
      }
      for (var nl = 1; nl <= NMAX; nl++) for (var nu = nl + 1; nu <= NMAX; nu++) {
        var l = lam(nu, nl); if (l < wn[0] || l > wn[1]) continue;
        var c = st.lines[nu + '-' + nl] || 0, xx = X(l);
        if (!c) { D.line(ctx, xx, top + h - 4, xx, top + h, D.alpha('#94a3b8', 0.5), 1); continue; }
        var a = 0.35 + 0.65 * Math.sqrt(c / maxC);
        ctx.fillStyle = wlColor(l, a); ctx.fillRect(xx - 1.5, top, 3, h);
        ctx.fillStyle = wlColor(l, a * 0.25); ctx.fillRect(xx - 4, top, 8, h);
      }
      // a few wavelength ticks
      var ticks = i === 0 ? [91, 100, 110, 120] : i === 1 ? [400, 500, 600, 700] : [1000, 2000, 3000];
      ticks.forEach(function (tk) { if (tk >= wn[0] && tk <= wn[1] && (!sm || i === 1 || tk % 1000 === 0 || tk === 100)) D.text(ctx, String(tk), X(tk), top + h + (sm ? 7 : 9), { color: col.faint, size: sm ? 8 : 9.5, align: 'center' }); });
      ctx.strokeStyle = col.border; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, top + 0.5, ww - 1, h - 1);
      x += ww + gap;
    });
    D.text(ctx, 'nm', R.x + R.w, top + h + (sm ? 7 : 9), { color: col.faint, size: sm ? 8 : 9.5, align: 'right' });
  }

  function levelAt(sim, x, y) {
    var L = layout(sim), R = L.lev, A = L.atom;
    if (x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.h) {
      var best = 0, bd = 1e9;
      for (var n = 1; n <= NMAX; n++) { var d = Math.abs(levY(R, n, L.sm) - y); if (d < bd) { bd = d; best = n; } }
      return bd < 22 ? best : 0;
    }
    if (x >= A.x && x <= A.x + A.w && y >= A.y && y <= A.y + A.h) {
      var r = Math.hypot(x - (A.x + A.w / 2), y - (A.y + A.h / 2 + (L.sm ? 6 : 8))), bn = 0, bdd = 1e9;
      for (var m = 1; m <= NMAX; m++) { var dd = Math.abs(orbitR(A, m) - r); if (dd < bdd) { bdd = dd; bn = m; } }
      return bdd < 14 ? bn : 0;
    }
    return 0;
  }

  SimLab.createSim({
    ariaLabel: 'Bohr model of hydrogen: an electron on numbered orbits round a proton, an energy-level ladder beside it with arrows for each jump, photons of the matching colour leaving the atom, and a spectrum strip in ultraviolet, visible and infrared where bright lines build up',
    mobileAspect: '1 / 1',
    playLabel: 'Switch on the lamp',
    params: [
      { id: 'top', label: 'Highest level reached (lamp voltage)', min: 2, max: NMAX, step: 1, value: 6,
        help: 'In the discharge tube, collisions lift electrons up to this level, then they fall back.' },
      { id: 'from', label: 'Jump from level', min: 1, max: NMAX, step: 1, value: 3 },
      { id: 'to', label: 'Jump to level', min: 1, max: NMAX, step: 1, value: 2 },
      { id: 'lamp', label: 'Lamp on (electrons keep hitting the atoms)', type: 'toggle', value: true },
      { id: 'rainbow', label: 'Show the faint rainbow behind the lines', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'jump', label: 'Last jump', key: true, short: 'Jump' },
      { id: 'E', label: 'Photon energy', key: true, short: 'Energy' },
      { id: 'l', label: 'Wavelength', key: true, short: 'λ' },
      { id: 'kind', label: 'Series and colour' },
      { id: 'level', label: 'Electron now in' },
      { id: 'count', label: 'Photons given out' }
    ],
    buttons: [
      { label: 'Make this jump', primary: true, onClick: function (sim) { manualJump(sim, sim.p.from, sim.p.to); } },
      { label: 'Clear the spectrum', onClick: function (sim) { sim.state.lines = {}; sim.state.count = 0; } }
    ],
    pointer: {
      hover: function (sim, x, y) { return levelAt(sim, x, y) > 0; },
      down: function (sim, x, y) {
        var n = levelAt(sim, x, y); if (!n) return false;
        manualJump(sim, 0, n); sim.redraw(); return true;
      }
    },
    onParam: function () { return true; },   // keep the spectrum when settings change

    reset: function (sim) {
      sim.state = { n: 1, ang: 0, anim: null, photons: [], lines: {}, abs: {}, count: 0, last: null, wait: 0.4, manual: false, rnd: M.rng(99) };
    },
    update: function (sim, dt) {
      var st = sim.state;
      st.ang += dt * 5 / Math.pow(st.n, 1.5);
      st.photons.forEach(function (p) { p.t += dt; });
      if (st.anim) {
        st.anim.t += dt;
        if (st.anim.t >= 0.35) { st.n = st.anim.to; st.anim = null; st.wait = st.n === 1 ? 0.5 : 0.35 + st.rnd() * 0.4; }
        return;
      }
      if (!sim.p.lamp) return;
      // the lamp: kicked up from n = 1 by a collision, then falling back step by step
      st.wait -= dt;
      if (st.wait > 0) return;
      if (st.n === 1) {
        var up = 2 + Math.floor(st.rnd() * (sim.p.top - 1));
        st.n = up; st.ang = st.rnd() * 6.283; st.wait = 0.3;
      } else {
        jump(sim, 1 + Math.floor(st.rnd() * (st.n - 1)), false);
      }
    },
    status: function (sim) {
      var L = sim.state.last;
      if (!L) return 'Switch on the lamp, or tap a level to make the electron jump';
      if (!sim.p.lamp && !L.emit && sim.state.n > 1) return 'Rose ' + L.from + ' → ' + L.to + ' by absorbing a ' + M.fmt(L.E, 2) + ' eV photon (' + Math.round(L.l) + ' nm). Tap a lower level to fall back';
      return (L.emit ? 'Fell ' : 'Rose ') + L.from + ' → ' + L.to + ': ' + (L.emit ? 'gave out' : 'absorbed') + ' a ' + M.fmt(L.E, 2) + ' eV photon, ' + Math.round(L.l) + ' nm (' + colourName(L.l) + ')';
    },
    readout: function (sim) {
      var st = sim.state, L = st.last;
      return {
        jump: L ? L.from + ' → ' + L.to + (L.emit ? ' (emits)' : ' (absorbs)') : '—',
        E: L ? M.fmt(L.E, 2) + ' eV' : '—',
        l: L ? (L.l >= 1000 ? M.fmt(L.l / 1000, 2) + ' µm' : Math.round(L.l) + ' nm') : '—',
        kind: L ? (SERIES[Math.min(L.from, L.to)] + ' series, ' + colourName(L.l)) : '—',
        level: 'n = ' + st.n + ' (' + M.fmt(En(st.n), 2) + ' eV, r = ' + M.fmt(0.0529 * st.n * st.n, 3) + ' nm)',
        count: String(st.count)
      };
    },
    draw: function (sim) {
      var L = layout(sim);
      D.clear(sim.ctx, L.W, L.H, sim.colors.bg);
      drawAtom(sim, L.atom); drawLevels(sim, L.lev); drawSpectrum(sim, L.spec);
    }
  });
})();
