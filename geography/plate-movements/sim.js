/* =====================================================================
   Landforms · Moving Plates: Mountains, Rifts and Earthquakes — sim.js
   ---------------------------------------------------------------------
   Four kinds of plate boundary, each drawn as a slice through the top
   ~260 km of the Earth (heights of land and sea floor are stretched
   much more than depths, so mountains show up).
     india       continent meets continent. India starts 70 million
                 years ago with the Tethys Sea floor (1,000 km of it)
                 sinking under Asia; after the crash the shortening s
                 raises the Himalayas, h = 8.6 (1 − e^(−s/1200)) km,
                 and Tibet, 4.8 (1 − e^(−s/900)) km.
     subduction  ocean plate dives under a continent: trench, slab,
                 magma from about 100 km deep feeds a volcanic range;
                 earthquakes get deeper away from the trench.
     divergent   plates pull apart: rift valley → narrow sea → ocean.
                 New sea floor sinks as it ages,
                     depth ≈ 2.5 + 0.35 √(age in Myr) km,
                 and records the magnetic field (stripes; reversals
                 drawn every 1–3 Myr).
     transform   map view, years not millions: the fault is locked,
                 the plates bend the ground (elastic strain)
                     u(y) = S/2·sign(y) + (D − S)/π · atan(y / d)
                 (D = far-field movement, S = slip on the fault) until
                 4–7 m is stored, then it slips in one earthquake.
   1 cm per year for 1 million years is 10 km.
   Time: 1 s = 1 million years (map view: 1 s = 10 years).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var XC = 200, GAP0 = 1000, XT = -250;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TYPE = { india: 'Convergent: collision', subduction: 'Convergent: subduction', divergent: 'Divergent', transform: 'Transform' };

  function ss(a, b, x) { var t = M.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function fmtKm(x) { return Math.round(x).toLocaleString('en-IN') + ' km'; }
  function dip(u) { return Math.min(50, 12 + u * 0.1) * Math.PI / 180; }
  // Slab top line from (x0, 0 km deep): points every 10 km along it
  function slab(x0, len, flat) {
    var pts = [{ x: x0, d: 0 }], x = x0, d = 0;
    for (var u = 0; u < len; u += 10) { var a = flat ? 0.16 : dip(u); x += 10 * Math.cos(a); d += 10 * Math.sin(a); pts.push({ x: x, d: d, u: u + 10 }); }
    return pts;
  }
  function slabAt(u) { var P = slab(XT, u + 10); return P[Math.min(P.length - 1, Math.round(u / 10))]; }
  var SUB = slab(XT, 900), X100 = 0;
  for (var i = 0; i < SUB.length; i++) if (SUB[i].d >= 100) { X100 = SUB[i].x; break; }

  function moved(sim) { return sim.p.speed * sim.state.t * 10; } // km (cm/yr × Myr × 10)
  function riftW(sim) { return moved(sim); }
  function viewL(sim) {
    var m = sim.p.mode;
    if (m === 'india') return 3200;
    if (m === 'subduction') return 2400;
    return M.clamp(riftW(sim) * 1.5 + 250, 400, 2600);
  }
  // Magnetic polarity (true = normal like today) for floor made at time tau (Myr)
  function polarity(st, tau) { var n = 0; for (var i = 0; i < st.flips.length && st.flips[i] <= tau; i++) n++; return n % 2 === 0; }

  /* ---------- surface heights (km, + above sea level) ---------- */
  function asiaH(st, x) {
    var s = st.s, hp = 8.6 * (1 - Math.exp(-s / 1200)), tp = 4.8 * (1 - Math.exp(-s / 900));
    var peak = hp * Math.exp(-Math.pow((x - (XC + 150)) / 150, 2));
    var plat = tp * ss(XC + 180, XC + 380, x) * (1 - ss(XC + 1100, XC + 1400, x));
    var arc = 2.2 * Math.exp(-Math.pow((x - (XC + 260)) / 50, 2)) * Math.max(0, 1 - s / 300);
    return 0.4 + Math.max(peak, plat, arc) * ss(XC - 10, XC + 40, x) - (st.s > 0 ? 0 : 3 * (1 - ss(XC, XC + 90, x)));
  }
  function contH(x) { // continent in the subduction scene
    var coast = -2 + 2.5 * ss(XT + 20, XT + 130, x);
    var range = 4.3 * Math.exp(-Math.pow((x - X100) / 90, 2));
    return Math.max(coast, coast + range);
  }
  function oceanDepth(age) { return 2.5 + 0.35 * Math.sqrt(Math.max(0, age)); }

  function spawnQuake(sim) {
    var st = sim.state, r = st.rng, m = sim.p.mode, q;
    if (m === 'india') {
      if (st.s <= 0) { var p = slab(XC, 420); q = p[Math.floor(r() * p.length)]; q = { x: q.x, d: q.d + 3 + r() * 10 }; }
      else q = { x: XC - 40 + r() * 340, d: 5 + r() * 40 };
    } else if (m === 'subduction') {
      var P = SUB[Math.floor(r() * 66)]; q = { x: P.x, d: P.d + 3 + r() * 12 };
    } else {
      var w = riftW(sim); q = { x: (w < 120 ? (r() - 0.5) * (w + 40) : (r() - 0.5) * 50), d: 2 + r() * 12 };
    }
    q.age = 0; st.quakes.push(q); st.nQ++;
  }

  SimLab.createSim({
    ariaLabel: 'A slice through the Earth at a plate boundary: India crashing into Asia and raising the Himalayas, an ocean plate diving under a continent with volcanoes, plates pulling apart into a rift valley and then an ocean with magnetic stripes, or a map of two plates sliding past each other with a road that bends and then snaps sideways in an earthquake',
    playLabel: 'Move the plates',
    mobileAspect: '3 / 3.4',
    params: [
      { id: 'mode', label: 'Plate boundary', type: 'select', value: 'india', options: [
        { value: 'india', label: 'Plates collide: India meets Asia' },
        { value: 'subduction', label: 'Ocean plate dives under a continent' },
        { value: 'divergent', label: 'Plates pull apart: rift to ocean' },
        { value: 'transform', label: 'Plates slide past (map, in years)' }] },
      { id: 'speed', label: 'Plate speed (one plate compared with the other)', min: 1, max: 15, step: 0.5, value: 5, unit: 'cm/yr',
        presets: [{ label: 'Atlantic 2.5', value: 2.5 }, { label: 'India today 5', value: 5 }, { label: 'India long ago 15', value: 15 }],
        help: 'About as fast as your fingernails grow. 1 cm a year for a million years is 10 km.' }
    ],
    readouts: [
      { id: 'time', label: 'Time', key: true },
      { id: 'moved', label: 'Plates moved', short: 'Moved', key: true },
      { id: 'feat', label: 'What has formed', short: 'Formed', key: true },
      { id: 'type', label: 'Boundary type' },
      { id: 'nq', label: 'Earthquakes shown' }
    ],
    onParam: function (sim, id) { return id === 'speed'; },

    reset: function (sim) {
      var r = M.rng(11), flips = [], t = 0;
      while (t < 400) { t += 1 + r() * 2; flips.push(t); }
      sim.state = { t: 0, s: 0, rng: M.rng(5), quakes: [], nQ: 0, eTimer: 2, eActive: 0, eCount: 0, flips: flips,
        S: 0, thr: 5, lastSlip: 0, lastQ: null, shake: 0, flash: 0 };
    },
    update: function (sim, dt) {
      var st = sim.state, m = sim.p.mode;
      if (m === 'transform') {
        st.t += dt * 10;
        var Dm = sim.p.speed * st.t / 100;
        if (Dm - st.S >= st.thr) { st.lastSlip = Dm - st.S; st.S = Dm; st.nQ++; st.thr = 4 + st.rng() * 3; st.lastQ = st.t; st.flash = 2.5; st.shake = REDUCED ? 0 : 0.7; }
        st.flash = Math.max(0, st.flash - dt); st.shake = Math.max(0, st.shake - dt);
        return;
      }
      st.t += dt;
      if (m === 'india') { if (st.t > 70) st.t = 70; st.s = Math.max(0, moved(sim) - GAP0); }
      if (st.rng() < dt * 2.5) spawnQuake(sim);
      st.quakes.forEach(function (q) { q.age += dt; });
      st.quakes = st.quakes.filter(function (q) { return q.age < 0.9; });
      if (m !== 'india') {
        st.eTimer -= dt; st.eActive = Math.max(0, st.eActive - dt);
        if (st.eTimer <= 0 && (m === 'subduction' || riftW(sim) > 15)) { st.eActive = 1.6; st.eCount++; st.eTimer = 2 + st.rng() * 4; }
      }
    },
    finished: function (sim) {
      var st = sim.state, m = sim.p.mode;
      if (m === 'india') return st.t >= 70;
      if (m === 'subduction') return st.t >= 60;
      if (m === 'divergent') return riftW(sim) >= 2400 || st.t >= 150;
      return st.t >= 2000;
    },
    status: function (sim) {
      var st = sim.state;
      if (!st.t) return 'Ready · press Move the plates';
      return (sim.running ? 'Moving' : 'Paused') + ' · ' + (sim.p.mode === 'transform' ? Math.round(st.t) + ' years' : M.fmt(st.t, 1) + ' million years');
    },
    readout: function (sim) {
      var st = sim.state, m = sim.p.mode, mv = moved(sim), feat, time, mo;
      if (m === 'transform') {
        time = Math.round(st.t) + ' years'; mo = M.fmt(sim.p.speed * st.t / 100, 1) + ' m';
        feat = 'Road offset ' + M.fmt(st.S, 1) + ' m';
      } else {
        time = m === 'india' ? (st.t >= 70 ? 'Today' : M.fmt(70 - st.t, 1) + ' Myr ago') : M.fmt(st.t, 1) + ' Myr';
        mo = fmtKm(mv);
        if (m === 'india') feat = st.s > 0 ? 'Peaks ' + M.fmt(8.6 * (1 - Math.exp(-st.s / 1200)), 1) + ' km high' : 'Tethys Sea ' + fmtKm(GAP0 - mv);
        else if (m === 'subduction') feat = st.eCount + ' eruptions';
        else feat = (mv < 120 ? 'Rift valley ' : mv < 700 ? 'Narrow sea ' : 'Ocean ') + fmtKm(mv);
      }
      return { time: time, moved: mo, feat: feat, type: TYPE[m], nq: String(st.nQ) };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, st = sim.state, m = sim.p.mode, narrow = W < 560;
      D.clear(ctx, W, H, c.bg);
      if (m === 'transform') return drawMap(sim);
      var top = 34, ys = top + (H - top) * 0.3, kmH = (ys - top - 12) / 10, kmS = kmH * 0.5, dpk = (H - ys - 4) / 260;
      var L = viewL(sim), pxk = W / L, x0 = m === 'india' ? -L / 2 : -L / 2;
      function X(x) { return W / 2 + x * pxk; }
      function XK(px) { return (px - W / 2) / pxk; }
      function yH(h) { return h >= 0 ? ys - h * kmH : ys - h * kmS; }
      function yD(d) { return ys + d * dpk; }
      function sx(fn, a, b) { var pts = [], n = Math.max(2, Math.ceil((X(b) - X(a)) / 3)); for (var k = 0; k <= n; k++) { var x = a + (b - a) * k / n; pts.push([X(x), fn(x)]); } return pts; }
      function poly(pts, fill, stroke) { ctx.beginPath(); pts.forEach(function (p, k) { if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); } }
      function band(P, th, fill) { // slab: top line P (km), thickness th km
        var a = P.map(function (p) { return [X(p.x), yD(p.d)]; }), b = [];
        for (var k = P.length - 1; k >= 0; k--) {
          var q = P[Math.max(0, k - 1)], r = P[Math.min(P.length - 1, k + 1)], dx = r.x - q.x, dd = r.d - q.d, l = Math.hypot(dx, dd) || 1;
          b.push([X(P[k].x - dd / l * th), yD(P[k].d + dx / l * th)]);
        }
        poly(a.concat(b), fill);
      }
      var COL = c.light
        ? { sky: '#dbeafe', ast1: '#fdba74', ast2: '#ea580c', cc: '#c8a165', ic: '#d6b47a', cm: '#8a6a4e', oc: '#64748b', om: '#4b5868', sea: '#7fb2f5', land: '#6b8e3a', snow: '#f8fafc' }
        : { sky: '#0b1730', ast1: '#7c2d12', ast2: '#c2410c', cc: '#a8814b', ic: '#b9935c', cm: '#6b4f3a', oc: '#56657a', om: '#3b4757', sea: '#1e4fae', land: '#4d7a2a', snow: '#e2e8f0' };
      var shift = 0;
      // sky + asthenosphere
      var g = ctx.createLinearGradient(0, top, 0, ys); g.addColorStop(0, COL.sky); g.addColorStop(1, D.alpha(COL.sky, 0.6));
      ctx.fillStyle = g; ctx.fillRect(0, top, W, ys - top);
      var g2 = ctx.createLinearGradient(0, ys, 0, H); g2.addColorStop(0, COL.ast1); g2.addColorStop(1, COL.ast2);
      ctx.fillStyle = g2; ctx.fillRect(0, ys, W, H - ys);
      var fs = narrow ? 10.5 : 12, lab = { color: c.text, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.72), pad: 3, fit: W };
      var head = '', hcol = c.s1, mv = moved(sim);

      if (m === 'india') {
        var e = Math.min(XC, XC - GAP0 + mv), s = st.s, contact = s > 0, aL = -L / 2, aR = L / 2;
        // the Tethys ocean slab (breaks off and sinks after the crash)
        var subLen = 350 + Math.min(mv, GAP0), P = slab(XC, subLen);
        if (contact) { var sink = s * 0.12, fade = Math.max(0, 1 - s / 1600); P = P.slice(Math.min(P.length - 2, 30)).map(function (p) { return { x: p.x, d: p.d + sink }; }); ctx.globalAlpha = fade; band(P, 70, COL.om); ctx.globalAlpha = 1; }
        else band(P, 70, COL.om);
        // India's top edge under Asia after the crash (km deep at x)
        var Lu = Math.min(150 + s * 0.4, 1300);
        var iTop = function (x) { var u = x - XC; return u < 150 ? u * 40 / 150 : 40 + (u - 150) * 0.07; };
        if (contact) {
          var it = sx(function (x) { return yD(iTop(x)); }, XC, XC + Lu), ib = sx(function (x) { return yD(iTop(x) + 100); }, XC, XC + Lu).reverse();
          var ic = sx(function (x) { return yD(iTop(x) + 30); }, XC, XC + Lu).reverse();
          poly([[X(aL), yH(0.3)], [X(XC - 120), yH(0.3)], [X(XC), yH(asiaH(st, XC))]].concat(it, ib, [[X(XC), yD(100)], [X(aL), yD(100)]]), COL.cm);
          poly([[X(aL), yH(0.3)], [X(XC - 120), yH(0.3)], [X(XC), yH(asiaH(st, XC))]].concat(it, ic, [[X(XC), yD(35)], [X(aL), yD(35)]]), COL.ic);
        }
        // Asia sits on top of the sinking ocean floor, later on India
        var top1 = sx(function (x) { return yH(asiaH(st, x)); }, XC, aR), under;
        if (contact) under = [[X(aR), yD(120)], [X(XC + Lu), yD(120)]].concat(sx(function (x) { return yD(Math.min(120, iTop(x))); }, XC, XC + Lu).reverse());
        else { under = [[X(aR), yD(120)]]; slab(XC, 400).filter(function (p) { return p.d <= 120; }).reverse().forEach(function (p) { under.push([X(p.x), yD(p.d)]); }); }
        poly(top1.concat(under), COL.cm);
        var root = sx(function (x) { return yD(Math.min(78, 35 + 4.5 * Math.max(0, asiaH(st, x) - 0.4), contact && x < XC + Lu ? iTop(x) : 999)); }, XC, aR).reverse();
        poly(top1.concat(root), COL.cc);
        if (contact) { ctx.save(); ctx.setLineDash([5, 4]); ctx.beginPath(); sx(function (x) { return yD(iTop(x)); }, XC, XC + Lu).forEach(function (p, k) { if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.strokeStyle = D.alpha(c.ink, 0.6); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
        // India (with the ocean floor in front of it)
        if (!contact) {
          var oc = sx(function (x) { return yH(-5 - 2.5 * ss(XC - 120, XC, x)); }, e, XC);
          poly([[X(aL), yH(0.3)], [X(e - 60), yH(0.3)], [X(e), yH(-4.5)]].concat(oc, [[X(XC), yD(8)], [X(XC), yD(70)], [X(e), yD(80)], [X(aL), yD(100)]]), COL.om);
          poly(oc.concat([[X(XC), yD(7)], [X(e), yD(7)]]), COL.oc);
          poly([[X(aL), yD(30)], [X(e), yD(30)], [X(e), yD(80)], [X(aL), yD(100)]], COL.cm);
          poly([[X(aL), yH(0.3)], [X(e - 60), yH(0.3)], [X(e), yH(-4.5)], [X(e), yD(35)], [X(aL), yD(35)]], COL.ic);
          poly([[X(e - 60), ys], [X(e), yH(-4.5)]].concat(oc, [[X(XC), yH(asiaH(st, XC))], [X(XC + 40), ys]]), COL.sea);
          for (var k = 0; ; k++) { var tx = e + 120 + 160 * k; if (tx > XC - 30) break; D.line(ctx, X(tx), yH(-5) + 2, X(tx), yH(-5) + 6, D.alpha(c.ink, 0.5), 2); }
        }
        // land on top
        ctx.fillStyle = COL.land; ctx.fillRect(X(aL), yH(0.3) - 2, X(e - (contact ? 0 : 60)) - X(aL), 3);
        var ev = XC - GAP0 + mv - 100, k0 = Math.max(0, Math.ceil((ev - (XC - 60)) / 210));
        for (var k2 = k0; k2 < k0 + 14; k2++) { var tr = ev - 210 * k2; if (tr < aL) break; D.circle(ctx, X(tr), yH(0.3) - 5, 3, COL.land); }
        // snow on high peaks
        var hp = 8.6 * (1 - Math.exp(-s / 1200));
        if (hp > 5) { var sn = sx(function (x) { return yH(asiaH(st, x)); }, XC + 60, XC + 240).filter(function (p) { return p[1] < yH(5.5); }); sn.forEach(function (p) { D.circle(ctx, p[0], p[1] + 1, 1.6, COL.snow); }); }
        // labels
        D.text(ctx, 'INDIA', X(Math.min(e, XC) - 650), yD(18), lab);
        D.text(ctx, 'ASIA', X(XC + 900), yD(60), lab);
        D.arrow(ctx, X(Math.min(e, XC) - 520) - 20, yH(2.2), X(Math.min(e, XC) - 520) + 26, yH(2.2), c.s1, 2.5, 8);
        D.text(ctx, sim.p.speed + ' cm/yr', X(Math.min(e, XC) - 520) + 4, yH(3.6), { color: c.s1, size: fs, weight: 700, align: 'center' });
        if (!contact && XC - e > 220) D.text(ctx, 'Tethys Sea', X((e + XC) / 2), yH(-1.6), lab);
        if (hp > 1.2) D.text(ctx, 'Himalayas', X(XC + 150), yH(hp) - 10, lab);
        var tpH = 4.8 * (1 - Math.exp(-s / 900));
        if (tpH > 1.2 && !narrow) D.text(ctx, 'Tibetan Plateau', X(XC + 760), yH(tpH) - 10, lab);
        if (contact && s > 300) D.text(ctx, narrow ? 'India slides under Tibet' : 'Indian plate slides under Tibet', X(XC + Lu * 0.55), yD(iTop(XC + Lu * 0.55) + 50), { color: c.text, size: fs - 1, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.6), pad: 2, fit: W });
        if (contact && s < 1600 && s > 100) D.text(ctx, 'old ocean floor breaks off and sinks', X(XC + 520), yD(Math.min(230, 180 + s * 0.05)), { color: c.text, size: fs - 1, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.55), pad: 2, fit: W });
        D.text(ctx, '← South', 6, ys + 12, { color: c.ink, size: fs - 1, weight: 700 });
        D.text(ctx, 'North →', W - 6, ys + 12, { color: c.ink, size: fs - 1, weight: 700, align: 'right' });
        var mya = Math.max(0, 70 - st.t);
        if (!st.t) head = '70 million years ago · India is ' + fmtKm(GAP0) + ' from Asia';
        else if (!contact) head = M.fmt(mya, 0) + ' million years ago · ocean floor sinks under Asia';
        else if (mya > 0.05) { head = M.fmt(mya, 0) + ' million years ago · India pushes into Asia: Himalayas rise'; hcol = c.warning; }
        else { head = 'Today · India still moves north ~5 cm a year'; hcol = c.success; }
      } else if (m === 'subduction') {
        var aL2 = -L / 2, aR2 = L / 2;
        band(SUB, 70, COL.om);
        var floor = function (x) { return yH(-4.5 - 3 * ss(XT - 150, XT, x)); };
        var fl = sx(floor, aL2, XT);
        poly([[X(aL2), yD(70)]].concat(fl, [[X(XT), yD(8)], [X(XT + 40), yD(70)]]), COL.om);
        poly(fl.concat([[X(XT), yD(7)], [X(aL2), yD(7)]]), COL.oc);
        // continent
        var ct = sx(function (x) { return yH(contH(x)); }, XT, aR2);
        poly(ct.concat([[X(aR2), yD(110)], [X(XT + 330), yD(110)]]), COL.cm);
        poly(ct.concat([[X(aR2), yD(38)], [X(X100), yD(55)], [X(XT + 200), yD(30)]]), COL.cc);
        // sea
        poly([[X(aL2), ys]].concat(fl, [[X(XT), yH(-2)]], sx(function (x) { return Math.max(ys, yH(contH(x))); }, XT, XT + 150), [[X(XT + 150), ys]]), COL.sea);
        // ocean-floor marks ride the plate and go down with the slab
        var off = mv % 180;
        for (var j = 0; ; j++) {
          var p = aL2 - 180 + off + 180 * j;
          if (p > XT + 520) break;
          if (p <= XT) D.line(ctx, X(p), floor(p) + 2, X(p), floor(p) + 6, D.alpha(c.ink, 0.55), 2);
          else { var q = slabAt(p - XT); D.circle(ctx, X(q.x), yD(q.d) + 3, 2, D.alpha(c.ink, 0.55)); }
        }
        // magma rising to the volcanoes
        var ph = (st.t * 0.6) % 1;
        for (j = 0; j < 4; j++) { var f = (ph + j / 4) % 1, dd = 100 * (1 - f); D.circle(ctx, X(X100 + 10 * Math.sin(j * 2 + f * 5)), Math.min(yD(dd), H - 4), 3.2, D.alpha('#f97316', 0.9 - f * 0.3)); }
        var vx = X(X100), vy = yH(contH(X100));
        poly([[vx - 9, vy + 4], [vx, vy - 9], [vx + 9, vy + 4]], '#57534e');
        if (st.eActive > 0) {
          var a = Math.min(1, st.eActive);
          for (j = 0; j < 6; j++) D.circle(ctx, vx + (j % 3 - 1) * 6 * (1.6 - st.eActive), vy - 12 - j * 6 * (1.7 - st.eActive), 4 + j, D.alpha('#9ca3af', 0.5 * a));
          D.circle(ctx, vx, vy - 9, 4, D.alpha('#ef4444', a));
        }
        D.text(ctx, 'ocean plate', X(aL2 + 380), yD(40), lab);
        D.text(ctx, 'continent', X(aR2 - 420), yD(60), lab);
        D.text(ctx, 'trench', X(XT), yH(-7.5) + 12, { color: c.text, size: fs - 1, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.6), pad: 2, fit: W });
        D.text(ctx, 'volcano', vx, vy - 22 - (st.eActive > 0 ? 18 : 0), lab);
        D.text(ctx, 'magma from ~100 km', X(X100 + 330), yD(118), { color: c.text, size: fs - 1, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.6), pad: 2, fit: W });
        D.arrow(ctx, X(aL2 + 260), yH(1.8), X(aL2 + 260) + 34, yH(1.8), c.s1, 2.5, 8);
        D.text(ctx, sim.p.speed + ' cm/yr', X(aL2 + 260) + 17, yH(3.4), { color: c.s1, size: fs, weight: 700, align: 'center' });
        head = st.t ? fmtKm(mv) + ' of sea floor gone down the trench' : 'The heavier ocean plate sinks under the lighter continent';
        if (st.eActive > 0) { head = 'Eruption! Melted rock from the sinking plate reaches the surface'; hcol = c.danger; }
      } else {
        var w = riftW(sim), hw = w / 2, aL3 = -L / 2, aR3 = L / 2, vh = sim.p.speed * 5, flood = w >= 120, blend = ss(60, 160, w);
        var age = function (x) { return Math.abs(x) / vh; };
        var floorH = function (x) { return M.lerp(-0.4 + 0.25 * Math.cos(x / 9), -oceanDepth(age(x)), blend); };
        var contHt = function (x) { var dd = Math.abs(x) - hw; return 1 + 0.7 * Math.exp(-Math.pow(dd / 70, 2)) * (1 - blend * 0.8); };
        // lithosphere: thin and hot at the ridge
        var litho = function (x) { return Math.abs(x) <= hw ? Math.min(100, 8 + 10 * Math.sqrt(age(x))) : 120; };
        var lb = sx(function (x) { return yD(litho(x)); }, aL3, aR3);
        poly(sx(function (x) { return yH(Math.abs(x) <= hw ? floorH(x) : contHt(x)); }, aL3, aR3).concat(lb.slice().reverse()), COL.om);
        // continents
        [-1, 1].forEach(function (sg) {
          var a0 = sg < 0 ? aL3 : hw, a1 = sg < 0 ? -hw : aR3;
          if (a1 <= a0) return;
          var tp2 = sx(function (x) { return yH(contHt(x)); }, a0, a1);
          poly(tp2.concat([[X(a1), yD(120)], [X(a0), yD(120)]]), COL.cm);
          poly(tp2.concat([[X(a1), yD(34)], [X(a0), yD(34)]]), COL.cc);
          ctx.fillStyle = COL.land; tp2.forEach(function (p, k) { if (k % 3 === 0) ctx.fillRect(p[0] - 1, p[1] - 2, 3, 2); });
        });
        // new floor with magnetic stripes
        if (w > 0) {
          var px0 = Math.floor(X(-hw)), px1 = Math.ceil(X(hw));
          for (var pxi = px0; pxi < px1; pxi++) {
            var xk = XK(pxi + 0.5), yt = yH(floorH(xk)), norm = polarity(st, st.t - age(xk));
            ctx.fillStyle = blend > 0.2 ? D.alpha(norm ? '#1e293b' : '#e2e8f0', 0.35 + 0.6 * blend) : '#78716c';
            ctx.fillRect(pxi, yt, 1.2, Math.max(4, 7 * dpk + 3));
          }
          // faults at the rift edges
          if (!flood) [-1, 1].forEach(function (sg) { D.line(ctx, X(sg * hw), yH(contHt(sg * hw)), X(sg * hw * 0.7), yD(14), D.alpha(c.ink, 0.6), 1.5); });
          // water: lakes in the rift, then the sea floods in
          if (flood) poly([[X(-hw - 20), ys]].concat(sx(function (x) { return yH(floorH(x)); }, -hw, hw), [[X(hw + 20), ys]]), COL.sea);
          else if (w > 20) poly([[X(-hw * 0.6), yH(-0.3)], [X(hw * 0.6), yH(-0.3)], [X(hw * 0.4), yH(-0.55)], [X(-hw * 0.4), yH(-0.55)]], COL.sea);
        }
        // magma under the ridge, mantle flowing apart
        var my = yD(30);
        D.circle(ctx, X(0), my, Math.max(4, 9 * dpk), D.alpha('#f97316', 0.85));
        [-1, 1].forEach(function (sg) { D.arrow(ctx, X(0) + sg * 18, yD(170), X(0) + sg * Math.min(W * 0.32, 160), yD(150), D.alpha(c.ink, 0.55), 2, 7); });
        D.arrow(ctx, X(0), yD(230), X(0), yD(60), D.alpha(c.ink, 0.5), 2, 7);
        if (st.eActive > 0 && w > 15) { var a2 = Math.min(1, st.eActive), vxx = X(0), vyy = yH(floorH(0)); for (j = 0; j < 5; j++) D.circle(ctx, vxx, vyy - 6 - j * 5 * (1.7 - st.eActive), 3 + j, D.alpha(flood ? '#e2e8f0' : '#9ca3af', 0.5 * a2)); D.circle(ctx, vxx, vyy - 2, 3.5, D.alpha('#ef4444', a2)); }
        // labels
        [-1, 1].forEach(function (sg) {
          var ax = W / 2 + sg * W * 0.36; D.arrow(ctx, ax, yH(2.6), ax + sg * 30, yH(2.6), c.s1, 2.5, 8);
        });
        D.text(ctx, (sim.p.speed / 2) + ' cm/yr each', W / 2, yH(4), { color: c.s1, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.6), pad: 2, fit: W });
        if (blend > 0.6 && w > 300) D.text(ctx, narrow ? 'dark = normal, light = reversed magnetism' : 'new floor stripes: normal (dark) and reversed (light) magnetism', W / 2, yD(75), { color: c.text, size: fs - 1, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.6), pad: 2, fit: W });
        head = !st.t ? 'One continent · hot mantle rises under it' : w < 120 ? 'The land cracks and sinks between faults (like East Africa)' : w < 700 ? 'The sea floods in (like the Red Sea)' : 'A new ocean grows from the ridge (like the Atlantic)';
      }
      // earthquakes
      st.quakes.forEach(function (q) {
        var a = 1 - q.age / 0.9, qx = X(q.x), qy = yD(q.d);
        var col = q.d > 150 ? '#60a5fa' : q.d > 60 ? '#facc15' : '#ef4444';
        D.circle(ctx, qx, qy, 3 + q.age * 14, null, D.alpha(col, a), 2);
        D.circle(ctx, qx, qy, 2.5, D.alpha(col, a));
      });
      // scale bar + depth marks
      var step = D.niceStep(L * 0.22, 1), bw = step * pxk, by = H - 12;
      D.line(ctx, 10, by, 10 + bw, by, c.ink, 2); D.line(ctx, 10, by - 4, 10, by + 4, c.ink, 2); D.line(ctx, 10 + bw, by - 4, 10 + bw, by + 4, c.ink, 2);
      D.text(ctx, step.toLocaleString('en-IN') + ' km', 14 + bw, by, { color: c.ink, size: fs - 1, weight: 700 });
      [100, 200].forEach(function (d) { D.line(ctx, 0, yD(d), 7, yD(d), c.ink, 1.5); D.text(ctx, d + ' km', 10, yD(d), { color: c.ink, size: fs - 1.5, weight: 600 }); });
      if (!narrow || m !== 'india') D.text(ctx, 'heights stretched ×' + Math.round(kmH / dpk), W - 6, top + 12, { color: c.muted, size: fs - 1.5, weight: 600, align: 'right' });
      ctx.font = '700 ' + (narrow ? 11.5 : 13) + 'px Inter, system-ui, sans-serif';
      D.text(ctx, head, W / 2, 16, { color: c.bg, bg: hcol, size: narrow ? 11.5 : 13, weight: 700, align: 'center', pad: 5, fit: W });
      void shift; void x0;
    }
  });

  /* ---------- map view: plates sliding past, stick and slip ---------- */
  function drawMap(sim) {
    var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, st = sim.state, narrow = W < 560;
    var top = 34, mid = top + (H - top) / 2, Dm = sim.p.speed * st.t / 100, S = st.S, pxm = W * 0.022, lock = (H - top) * 0.12;
    var shx = st.shake > 0 ? (Math.random() - 0.5) * 8 * st.shake : 0;
    ctx.save(); ctx.translate(shx, 0);
    ctx.fillStyle = c.light ? '#d9e7c2' : '#24361f'; ctx.fillRect(-10, top, W + 20, mid - top);
    ctx.fillStyle = c.light ? '#e8dcc0' : '#3a3020'; ctx.fillRect(-10, mid, W + 20, H - mid);
    function u(y) { var yy = y - mid; return (S / 2) * Math.sign(yy) + (Dm - S) / Math.PI * Math.atan(yy / lock); }
    var P = W, feats = [{ x: 0.2, k: 'road' }, { x: 0.55, k: 'fence' }, { x: 0.82, k: 'canal' }], maxOff = Math.ceil((Dm / 2 + 2) * pxm / P) + 1;
    feats.forEach(function (f) {
      for (var n = -maxOff; n <= maxOff; n++) {
        var bx = f.x * P + n * P;
        ctx.beginPath();
        for (var y = top; y <= H; y += 2) { var xx = bx + u(y) * pxm; if (y === top) ctx.moveTo(xx, y); else ctx.lineTo(xx, y); }
        if (f.k === 'road') { ctx.strokeStyle = '#4b5563'; ctx.lineWidth = narrow ? 14 : 18; ctx.stroke(); ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.5; ctx.setLineDash([7, 7]); ctx.stroke(); ctx.setLineDash([]); }
        else if (f.k === 'fence') { ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2; ctx.stroke(); for (y = top + 6; y < H; y += 14) D.circle(ctx, bx + u(y) * pxm, y, 2.5, '#78350f'); }
        else { ctx.strokeStyle = 'rgba(59,130,246,0.85)'; ctx.lineWidth = 6; ctx.stroke(); }
      }
    });
    D.line(ctx, -10, mid, W + 10, mid, '#ef4444', 2, [8, 5]);
    ctx.restore();
    var fs = narrow ? 10.5 : 12, lab = { color: c.text, size: fs, weight: 700, bg: D.alpha(c.bg, 0.75), pad: 3, fit: W };
    D.text(ctx, 'fault', 8, mid - 10, { color: '#ef4444', size: fs, weight: 700, bg: D.alpha(c.bg, 0.75), pad: 2 });
    D.arrow(ctx, W - 20, top + 34, W - 70, top + 34, c.s1, 3, 9);
    D.text(ctx, 'plate A', W - 76, top + 34, Object.assign({}, lab, { align: 'right' }));
    D.arrow(ctx, 20, H - 22, 70, H - 22, c.s3, 3, 9);
    D.text(ctx, 'plate B', 76, H - 22, lab);
    // strain meter
    var strain = Dm - S, mw = narrow ? 110 : 160, mx = W - mw - 12, my = H - 30;
    D.roundRect(ctx, mx - 6, my - 14, mw + 12, 34, 6, D.alpha(c.bg, 0.8));
    D.text(ctx, 'bend stored: ' + M.fmt(strain, 1) + ' m', mx, my - 4, { color: c.text, size: fs - 1, weight: 700 });
    D.roundRect(ctx, mx, my + 6, mw, 6, 3, D.alpha(c.ink, 0.15));
    D.roundRect(ctx, mx, my + 6, mw * M.clamp(strain / 7, 0, 1), 6, 3, strain > 4 ? c.danger : c.warning);
    var head, hc = c.s1;
    if (st.flash > 0) { head = 'Earthquake! The ground jumped ' + M.fmt(st.lastSlip, 1) + ' m in a few seconds'; hc = c.danger; }
    else if (!st.t) head = 'The fault is locked: the plates bend the ground instead';
    else head = st.nQ ? 'Bending again · ' + Math.round(st.t - st.lastQ) + ' years since the last quake' : 'Bending · ' + Math.round(st.t) + ' years, no quake yet';
    D.text(ctx, head, W / 2, 16, { color: c.bg, bg: hc, size: narrow ? 11.5 : 13, weight: 700, align: 'center', pad: 5, fit: W });
    D.text(ctx, 'sideways movement drawn hundreds of times bigger', W / 2, top + 12, { color: c.muted, size: fs - 1.5, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.75), pad: 3 });
  }
})();
