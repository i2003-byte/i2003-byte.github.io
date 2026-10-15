/* =====================================================================
   Ray optics (Class 12) · Total internal reflection — sim.js
   ---------------------------------------------------------------------
   Four scenes, all traced with Snell's law  n₁ sin i = n₂ sin r:
   • block   — laser through the curved side of a semicircular block to
               the centre of its flat face; reflected and refracted rays
               with Fresnel shares (unpolarised light):
                 R = (r_s² + r_p²)/2, r_s = (n₁cos i − n₂cos r)/(n₁cos i + n₂cos r),
                 r_p = (n₂cos i − n₁cos r)/(n₂cos i + n₁cos r)
               critical angle  sin i_c = n₂/n₁  (only when n₁ > n₂)
   • fibre   — core n = 1.50 with cladding n = 1.46 (or bare in air),
               bent through 90°. Light enters the end face, then is
               traced in small steps; at the wall it is totally reflected
               if the angle is above i_c, otherwise part leaks out.
               Acceptance angle (in air): sin θ_max = √(n_core² − n_clad²)
   • diamond — 2-D section of a round brilliant cut (table 57 %, crown
               34.5°, pavilion 40.75°). Seven parallel rays enter from
               above; each is followed through partial and total
               reflections (light below 2 % is dropped).
   • mirage  — hot road (air 30 °C above it, road hotter). Air
               temperature falls off as T = T_air + ΔT e^(−y/0.3 m);
               n − 1 = 2.93 × 10⁻⁴ × (288 K / T). Rays are traced back
               from the eye with y'' = dn/dy (n ≈ 1). Heights are
               stretched about 50× compared with distances.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var MATS = { water: 1.33, glass: 1.5, diamond: 2.42 }, OUT = { air: 1.0, water: 1.33 };
  var CORE = 1.5, CLAD = { clad: 1.46, air: 1.0 };
  var LASER = '#f43f5e', dragging = false, cache = { key: '' };

  function refract(d, nrm, eta) { // nrm points back towards the incoming side
    var ci = -(d.x * nrm.x + d.y * nrm.y), k = 1 - eta * eta * (1 - ci * ci);
    if (k < 0) return null;
    var st = eta * ci - Math.sqrt(k);
    return { x: eta * d.x + st * nrm.x, y: eta * d.y + st * nrm.y };
  }
  function reflect(d, nrm) { var dn = d.x * nrm.x + d.y * nrm.y; return { x: d.x - 2 * dn * nrm.x, y: d.y - 2 * dn * nrm.y }; }
  function fresnel(n1, n2, ci, ct) {
    var rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct), rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
    return (rs * rs + rp * rp) / 2;
  }
  function reflectance(n1, n2, i) { // i in radians
    var s = n1 / n2 * Math.sin(i); if (s >= 1) return 1;
    return fresnel(n1, n2, Math.cos(i), Math.sqrt(1 - s * s));
  }
  function crit(n1, n2) { return n1 > n2 ? M.deg(Math.asin(n2 / n1)) : null; }
  function showCtl(id, on) { var el = document.getElementById('ctl-' + id), box = el && el.closest('.control'); if (box) box.style.display = on ? '' : 'none'; }
  function syncControls(p) {
    var m = p.mode;
    showCtl('i', m === 'block'); showCtl('out', m === 'block'); showCtl('mat', m === 'block' || m === 'diamond');
    showCtl('launch', m === 'fibre'); showCtl('clad', m === 'fibre'); showCtl('bend', m === 'fibre');
    showCtl('tilt', m === 'diamond'); showCtl('road', m === 'mirage');
  }

  /* ---------------- block ---------------- */
  function blockGeo(W, H) {
    var r = Math.min(W * 0.36, H * 0.42);
    return { ox: W * 0.5, oy: H * 0.44, r: r };
  }
  function blockOptics(p) {
    var n1 = MATS[p.mat], n2 = OUT[p.out], i = M.rad(p.i), s = n1 / n2 * Math.sin(i), tir = s >= 1;
    return { n1: n1, n2: n2, ic: crit(n1, n2), tir: tir, r: tir ? null : M.deg(Math.asin(s)), R: reflectance(n1, n2, i) };
  }

  /* ---------------- fibre ---------------- */
  function fibreGeo(W, H, p) {
    var y0 = H * 0.24, x0 = Math.max(64, W * 0.14), room = Math.min(W - x0 - 80, H - y0 - 30);
    var a = M.clamp(Math.min(Math.min(W, H) * 0.024, room / (2 * p.bend + 1)), 2.5, 11), Rb = p.bend * 2 * a;
    var x1 = Math.max(x0 + 50, W - 26 - Rb - a);
    var pts = [{ x: x0, y: y0 }, { x: x1, y: y0 }], cx = x1, cy = y0 + Rb;
    for (var k = 1; k <= 48; k++) { var t = k / 48 * Math.PI / 2; pts.push({ x: cx + Rb * Math.sin(t), y: cy - Rb * Math.cos(t) }); }
    pts.push({ x: cx + Rb, y: H - 14 });
    return { a: a, Rb: Rb, pts: pts };
  }
  function nearest(pts, x, y) {
    var best = { d: 1e9 };
    for (var i = 0; i < pts.length - 1; i++) {
      var A = pts[i], B = pts[i + 1], dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy;
      var t = ((x - A.x) * dx + (y - A.y) * dy) / L2, tc = M.clamp(t, 0, 1), px = A.x + tc * dx, py = A.y + tc * dy, d = Math.hypot(x - px, y - py);
      if (d < best.d) best = { d: d, px: px, py: py, seg: i, t: t };
    }
    return best;
  }
  function traceFibre(g, p) {
    var n2 = CLAD[p.clad], ic = crit(CORE, n2), th = M.rad(p.launch), thIn = Math.asin(Math.sin(th) / CORE);
    var pos = { x: g.pts[0].x + 0.5, y: g.pts[0].y }, d = { x: Math.cos(thIn), y: Math.sin(thIn) };
    var path = [{ x: pos.x, y: pos.y, I: 1 }], leaks = [], I = 1 - reflectance(1, CORE, th), h = 0.6, bounces = 0, out = null, last = g.pts.length - 2;
    for (var n = 0; n < 9000 && I > 0.01; n++) {
      var q = { x: pos.x + d.x * h, y: pos.y + d.y * h }, nq = nearest(g.pts, q.x, q.y);
      if (nq.seg === last && nq.t > 1) { out = { x: q.x, y: q.y, d: d, I: I }; path.push({ x: q.x, y: q.y, I: I }); break; }
      if (nq.d <= g.a) { pos = q; continue; }
      var lo = 0, hi = h; // find the wall
      for (var b = 0; b < 12; b++) { var mid = (lo + hi) / 2; if (nearest(g.pts, pos.x + d.x * mid, pos.y + d.y * mid).d <= g.a) lo = mid; else hi = mid; }
      var w = { x: pos.x + d.x * lo, y: pos.y + d.y * lo }, nw = nearest(g.pts, w.x, w.y), L = Math.hypot(w.x - nw.px, w.y - nw.py) || 1;
      var nrm = { x: (w.x - nw.px) / L, y: (w.y - nw.py) / L }, ci = d.x * nrm.x + d.y * nrm.y, inc = M.deg(Math.acos(M.clamp(ci, -1, 1)));
      path.push({ x: w.x, y: w.y, I: I });
      var tdir = refract(d, { x: -nrm.x, y: -nrm.y }, CORE / n2);
      if (tdir) { var R = fresnel(CORE, n2, ci, Math.sqrt(Math.max(0, 1 - Math.pow(CORE / n2 * Math.sin(Math.acos(ci)), 2)))); leaks.push({ x: w.x, y: w.y, d: tdir, I: I * (1 - R), inc: inc }); I *= R; }
      d = reflect(d, nrm); bounces++;
      pos = { x: w.x - nrm.x * 0.05, y: w.y - nrm.y * 0.05 };
    }
    var na = Math.sqrt(Math.max(0, CORE * CORE - n2 * n2));
    return { path: path, leaks: leaks, out: out, Iend: out ? out.I : 0, bounces: bounces, ic: ic, acc: na >= 1 ? 90 : M.deg(Math.asin(na)), wall: 90 - M.deg(thIn) };
  }

  /* ---------------- diamond ---------------- */
  var CUT = [[-0.285, 0.163], [0.285, 0.163], [0.5, 0.015], [0.5, -0.015], [0, -0.446], [-0.5, -0.015], [-0.5, 0.015]];
  function gemGeo(W, H) {
    var Gw = Math.min(W * 0.66, H * 0.56 / 0.609), gx = W / 2, top = H * 0.36;
    var poly = CUT.map(function (q) { return { x: gx + q[0] * Gw, y: top + (0.163 - q[1]) * Gw }; });
    var cxm = 0, cym = 0; poly.forEach(function (q) { cxm += q.x / poly.length; cym += q.y / poly.length; });
    var edges = poly.map(function (A, i) {
      var B = poly[(i + 1) % poly.length], dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), nx = dy / L, ny = -dx / L;
      if (nx * ((A.x + B.x) / 2 - cxm) + ny * ((A.y + B.y) / 2 - cym) < 0) { nx = -nx; ny = -ny; }
      return { A: A, B: B, n: { x: nx, y: ny } };
    });
    return { Gw: Gw, gx: gx, top: top, poly: poly, edges: edges };
  }
  function hitEdge(g, o, d, inside) {
    var best = null;
    g.edges.forEach(function (e) {
      var ex = e.B.x - e.A.x, ey = e.B.y - e.A.y, den = d.x * ey - d.y * ex; if (Math.abs(den) < 1e-12) return;
      var t = ((e.A.x - o.x) * ey - (e.A.y - o.y) * ex) / den, u = ((e.A.x - o.x) * d.y - (e.A.y - o.y) * d.x) / den;
      if (t > 1e-6 && u >= 0 && u <= 1 && (inside || d.x * e.n.x + d.y * e.n.y < 0) && (!best || t < best.t)) best = { t: t, e: e };
    });
    return best;
  }
  function traceGem(g, p, H) {
    var n = MATS[p.mat], tilt = M.rad(p.tilt), din = { x: Math.sin(tilt), y: Math.cos(tilt) }, rays = [], up = 0, down = 0, tot = 0;
    for (var k = 0; k < 7; k++) {
      var xe = g.gx + (-0.42 + 0.84 * k / 6) * g.Gw, o = { x: xe - din.x / din.y * (g.top - 4), y: 4 };
      var h = hitEdge(g, o, din, false); if (!h) continue;
      var P = { x: o.x + din.x * h.t, y: o.y + din.y * h.t }, ci = -(din.x * h.e.n.x + din.y * h.e.n.y);
      var d = refract(din, h.e.n, 1 / n), R0 = reflectance(1, n, Math.acos(ci)), I = 1 - R0;
      var ray = { inPath: [o, P], segs: [], exits: [] }; tot += 1;
      for (var b = 0; b < 14 && I > 0.02; b++) {
        var hh = hitEdge(g, P, d, true); if (!hh) break;
        var Q = { x: P.x + d.x * hh.t, y: P.y + d.y * hh.t }, nr = hh.e.n, cos = d.x * nr.x + d.y * nr.y;
        ray.segs.push({ a: P, b: Q, I: I });
        var t = refract(d, { x: -nr.x, y: -nr.y }, n);
        if (t) {
          var sinT = n * Math.sqrt(Math.max(0, 1 - cos * cos)), R = fresnel(n, 1, cos, Math.sqrt(Math.max(0, 1 - sinT * sinT)));
          ray.exits.push({ p: Q, d: t, I: I * (1 - R), up: t.y < 0 });
          if (t.y < 0) up += I * (1 - R); else down += I * (1 - R);
          I *= R;
        }
        d = reflect(d, nr); P = { x: Q.x - nr.x * 0.01, y: Q.y - nr.y * 0.01 };
      }
      rays.push(ray);
    }
    return { rays: rays, up: up / tot, down: down / tot, n: n, ic: crit(n, 1) };
  }

  /* ---------------- mirage ---------------- */
  var TAIR = 303.15, H0 = 0.3, EYE = 1.5, XMAX = 600, YMAX = 8;
  function nIndex(y, dT) { return 1 + 2.93e-4 * 288.15 / (TAIR + dT * Math.exp(-y / H0)); }
  function dndy(y, dT) { return (nIndex(y + 0.001, dT) - nIndex(y - 0.001, dT)) / 0.002; }
  function traceAir(angDeg, dT, keep) {
    var y = EYE, s = Math.tan(M.rad(angDeg)), x = 0, dx = 0.5, pts = keep ? [{ x: 0, y: y }] : null, turned = false;
    while (x < XMAX) {
      s += dndy(Math.max(y, 0), dT) * dx; y += s * dx; x += dx;
      if (keep && (Math.round(x / dx) % 8 === 0)) pts.push({ x: x, y: y });
      if (s > 0 && angDeg < 0) turned = true;
      if (y <= 0) return { hit: 'road', x: x, pts: pts };
      if (y > YMAX + 4) return { hit: 'sky', x: x, pts: pts, turned: turned };
    }
    return { hit: s > 0 || y > 3 ? 'sky' : 'far', x: x, pts: pts, turned: turned };
  }
  function mirageInfo(dT) {
    var key = 'm' + dT;
    if (cache.mk === key) return cache.mi;
    var view = [], first = null, steep = 0;
    for (var k = 50; k >= -50; k--) {
      var a = k / 50, r = traceAir(a, dT, false); view.push({ a: a, hit: r.hit, x: r.x });
      if (r.turned && a < -0.01) steep = Math.min(steep, a);
    }
    // where the mirage appears: the lowest ray that turns back up gets closest to the road there
    if (steep < 0) { var rr = traceAir(steep, dT, true), mn = 1e9; rr.pts.forEach(function (q) { if (q.y < mn) { mn = q.y; first = q.x; } }); }
    cache.mk = key; cache.mi = { view: view, steep: steep, at: first };
    return cache.mi;
  }

  function aim(sim, x, y) {
    var g = blockGeo(sim.width, sim.height), a = M.deg(Math.atan2(g.ox - x, Math.max(1, y - g.oy)));
    sim.setParam('i', Math.round(M.clamp(Math.abs(a), 0, 89) * 2) / 2);
  }

  SimLab.createSim({
    ariaLabel: 'Total internal reflection: a laser in a semicircular glass block, light trapped in a bent optical fibre, rays inside a cut diamond, and a mirage over a hot road',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'mode', label: 'Scene', type: 'select', value: 'block', options: [
        { value: 'block', label: 'Semicircular block (critical angle)' }, { value: 'fibre', label: 'Optical fibre' },
        { value: 'diamond', label: 'Why diamonds sparkle' }, { value: 'mirage', label: 'Mirage on a hot road' }] },
      { id: 'i', label: 'Angle of incidence', min: 0, max: 89, step: 0.5, value: 30, unit: '°', help: 'You can also drag the laser round the block.' },
      { id: 'mat', label: 'Block / gem made of', type: 'select', value: 'glass', options: [
        { value: 'water', label: 'Water (n = 1.33)' }, { value: 'glass', label: 'Glass (n = 1.50)' }, { value: 'diamond', label: 'Diamond (n = 2.42)' }] },
      { id: 'out', label: 'Outside the flat face', type: 'select', value: 'air', options: [{ value: 'air', label: 'Air (n = 1.00)' }, { value: 'water', label: 'Water (n = 1.33)' }] },
      { id: 'launch', label: 'Laser angle to the fibre', min: 0, max: 80, step: 1, value: 15, unit: '°' },
      { id: 'clad', label: 'Fibre', type: 'select', value: 'air', options: [{ value: 'air', label: 'Glass fibre in air (1.50 / 1.00)' }, { value: 'clad', label: 'Core 1.50 with cladding 1.46' }], help: 'With cladding the critical angle is 76.7°: light must run almost along the axis, and bends must be gentle.' },
      { id: 'bend', label: 'Bend radius', min: 2, max: 40, step: 1, value: 10, unit: 'core widths', help: 'Real cores are 10–50 µm wide, so a loop a few cm across is already a gentle bend.' },
      { id: 'tilt', label: 'Light falling at', min: -30, max: 30, step: 1, value: 0, unit: '° from straight down' },
      { id: 'road', label: 'Road temperature (air 30 °C)', min: 30, max: 70, step: 1, value: 55, unit: '°C' }
    ],
    readouts: [
      { id: 'res', label: 'What happens', key: true },
      { id: 'ic', label: 'Critical angle', short: 'i_c', key: true },
      { id: 'a', label: 'Angle of incidence' },
      { id: 'r', label: 'Angle of refraction' },
      { id: 'R', label: 'Share of light' },
      { id: 'x', label: 'More' }
    ],
    reset: function (sim) { syncControls(sim.p); },
    onParam: function (sim, id, v) { if (id === 'mode') { syncControls(sim.p); if (v === 'diamond' && sim.p.mat === 'glass') sim.setParam('mat', 'diamond'); if (v === 'block' && sim.p.mat === 'diamond') sim.setParam('mat', 'glass'); } return true; },
    animate: function (sim) { return sim.p.mode === 'fibre'; },
    readout: function (sim) {
      var p = sim.p, W = sim.width, H = sim.height;
      if (p.mode === 'block') {
        var o = blockOptics(p);
        return { res: o.tir ? 'Total internal reflection' : (o.ic != null && p.i > o.ic - 3 ? 'Refraction, close to the critical angle' : 'Refraction + weak reflection'),
          ic: o.ic == null ? 'none (light goes into a denser or equal medium)' : M.fmt(o.ic, 1) + '°',
          a: M.fmt(p.i, 1) + '°', r: o.tir ? 'no refracted ray' : M.fmt(o.r, 1) + '°',
          R: M.fmt(o.R * 100, o.R > 0.995 ? 0 : 1) + ' % reflected', x: 'n₁ = ' + o.n1 + ' (inside), n₂ = ' + o.n2 + ' (outside)' };
      }
      if (p.mode === 'fibre') {
        var t = traceFibre(fibreGeo(W, H, p), p);
        return { res: t.Iend > 0.9 ? 'Trapped: light reaches the end' : t.Iend > 0.2 ? 'Some light leaks out' : 'Most light leaks out',
          ic: M.fmt(t.ic, 1) + '° at the core wall', a: M.fmt(t.wall, 1) + '° at the wall (straight part)', r: 'inside the core: ' + M.fmt(M.deg(Math.asin(Math.sin(M.rad(p.launch)) / CORE)), 1) + '° to the axis',
          R: M.fmt(t.Iend * 100, 0) + ' % reaches the far end', x: 'Acceptance angle ' + M.fmt(t.acc, 1) + '° · ' + t.bounces + ' reflections' };
      }
      if (p.mode === 'diamond') {
        var gm = traceGem(gemGeo(W, H), p, H);
        return { res: M.fmt(gm.up * 100, 0) + ' % comes back out of the top', ic: M.fmt(gm.ic, 1) + '°', a: 'light falls at ' + p.tilt + '°', r: '—',
          R: M.fmt(gm.down * 100, 0) + ' % leaks out of the bottom', x: 'Pavilion facets meet the light at about 41°' };
      }
      var mi = mirageInfo(p.road - 30), stp = -mi.steep;
      return { res: stp > 0 ? 'Mirage: sky seen on the road about ' + M.fmt(Math.round(mi.at / 10) * 10, 0) + ' m ahead' : 'No mirage within 600 m (road not hot enough)',
        ic: stp > 0 ? 'grazing: rays within ' + M.fmt(stp, 2) + '° of level turn back' : '—', a: '—', r: '—',
        R: 'n at the road ' + nIndex(0, p.road - 30).toFixed(6), x: 'n at eye height ' + nIndex(EYE, p.road - 30).toFixed(6) };
    },
    pointer: {
      down: function (sim, x, y) { if (sim.p.mode !== 'block') return false; var g = blockGeo(sim.width, sim.height); dragging = y > g.oy - 4; if (dragging) aim(sim, x, y); return dragging; },
      move: function (sim, x, y) { if (dragging) aim(sim, x, y); },
      up: function () { dragging = false; },
      hover: function (sim, x, y) { return sim.p.mode === 'block' && y > blockGeo(sim.width, sim.height).oy; }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, fs = W < 560 ? 10.5 : 12;
      D.clear(ctx, W, H, c.bg);
      if (p.mode === 'block') drawBlock(ctx, W, H, c, p, fs);
      else if (p.mode === 'fibre') drawFibre(ctx, W, H, c, p, fs, now || 0);
      else if (p.mode === 'diamond') drawGem(ctx, W, H, c, p, fs);
      else drawMirage(ctx, W, H, c, p, fs);
    }
  });

  function beam(ctx, x1, y1, x2, y2, I, w) {
    if (I < 0.004) return;
    var a = M.clamp(0.25 + 0.75 * Math.sqrt(I), 0, 1);
    D.line(ctx, x1, y1, x2, y2, D.alpha(LASER, a * 0.35), (w || 3) * (1 + 1.5 * I) + 4);
    D.line(ctx, x1, y1, x2, y2, D.alpha(LASER, a), (w || 3) * (0.4 + 0.8 * I));
  }
  function arcLabel(ctx, x, y, r, a0, a1, col, label, fs) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, a0, a1, a1 < a0); ctx.stroke(); ctx.restore();
    var am = (a0 + a1) / 2; D.text(ctx, label, x + Math.cos(am) * (r + 12), y + Math.sin(am) * (r + 12), { color: col, size: fs, weight: 700, align: 'center' });
  }

  function drawBlock(ctx, W, H, c, p, fs) {
    var g = blockGeo(W, H), o = blockOptics(p), i = M.rad(p.i), L = Math.max(W, H);
    // outside medium + block
    if (p.out === 'water') { ctx.fillStyle = D.alpha('#38bdf8', 0.12); ctx.fillRect(0, 0, W, g.oy); }
    ctx.save(); ctx.beginPath(); ctx.moveTo(g.ox - g.r, g.oy); ctx.arc(g.ox, g.oy, g.r, Math.PI, 0, true); ctx.closePath();
    ctx.fillStyle = D.alpha(p.mat === 'diamond' ? '#e0f2fe' : p.mat === 'water' ? '#38bdf8' : c.s1, 0.16); ctx.fill();
    ctx.strokeStyle = D.alpha(c.ink, 0.6); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    D.line(ctx, 6, g.oy, W - 6, g.oy, D.alpha(c.ink, 0.35), 1);
    D.text(ctx, MATS[p.mat] === 1.33 ? 'water n = 1.33' : (p.mat === 'diamond' ? 'diamond' : 'glass') + ' n = ' + MATS[p.mat], g.ox, g.oy + g.r * 0.62, { color: c.muted, size: fs, align: 'center', weight: 600 });
    D.text(ctx, (p.out === 'air' ? 'air' : 'water') + ' n = ' + OUT[p.out], W - 10, g.oy - 12, { color: c.muted, size: fs, align: 'right', weight: 600 });
    // normal
    D.line(ctx, g.ox, g.oy - g.r * 1.05, g.ox, g.oy + g.r * 1.05, D.alpha(c.ink, 0.5), 1, [5, 5]);
    D.text(ctx, 'normal', g.ox + 4, g.oy - g.r * 1.05 + 6, { color: c.faint, size: fs - 1 });
    // critical angle marks on the arc
    if (o.ic != null) {
      var ic = M.rad(o.ic);
      [-1, 1].forEach(function (sg) {
        var ex = g.ox + sg * Math.sin(ic) * g.r, ey = g.oy + Math.cos(ic) * g.r;
        D.line(ctx, g.ox, g.oy, ex, ey, D.alpha(c.warning, 0.55), 1, [3, 4]);
      });
      D.text(ctx, 'i_c = ' + M.fmt(o.ic, 1) + '°', g.ox + Math.sin(ic) * g.r + 6, g.oy + Math.cos(ic) * g.r + 10, { color: c.warning, size: fs, weight: 700, fit: W });
    }
    // laser and rays
    var lx = g.ox - Math.sin(i) * g.r * 1.12, ly = g.oy + Math.cos(i) * g.r * 1.12;
    beam(ctx, lx, ly, g.ox, g.oy, 1);
    beam(ctx, g.ox, g.oy, g.ox + Math.sin(i) * L, g.oy + Math.cos(i) * L, o.R);
    if (!o.tir) { var r = M.rad(o.r); beam(ctx, g.ox, g.oy, g.ox + Math.sin(r) * L, g.oy - Math.cos(r) * L, 1 - o.R); }
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(Math.atan2(g.oy - ly, g.ox - lx));
    D.roundRect(ctx, -34, -7, 30, 14, 3, c.light ? '#334155' : '#475569', c.ink, 1); ctx.restore();
    D.text(ctx, 'laser (drag)', lx + 34, ly + 14, { color: c.faint, size: fs - 1, align: 'center', fit: W });
    // angle arcs
    var ar = Math.min(46, g.r * 0.3);
    if (p.i > 1) arcLabel(ctx, g.ox, g.oy, ar, Math.PI / 2, Math.PI / 2 + i, c.s2, 'i', fs);
    if (!o.tir && o.r > 1) arcLabel(ctx, g.ox, g.oy, ar, -Math.PI / 2, -Math.PI / 2 + M.rad(o.r), c.s1, 'r', fs);
    // headline
    var head = o.tir ? 'i > i_c: TOTAL INTERNAL REFLECTION (100 % reflected)'
      : o.n1 + ' × sin ' + M.fmt(p.i, 1) + '° = ' + o.n2 + ' × sin ' + M.fmt(o.r, 1) + '°';
    D.text(ctx, head, W / 2, 14, { color: o.tir ? c.bg : c.text, bg: o.tir ? c.warning : D.alpha(c.ink, 0.08), size: fs + 0.5, weight: 700, align: 'center', pad: 4, fit: W });
    // reflectance inset
    var iw = Math.min(W * 0.36, 190), ih = Math.min(H * 0.26, 110), ix = 10, iy = 34;
    if (W - (g.ox + g.r) > iw + 20) { ix = W - iw - 10; iy = g.oy + 14; }
    D.roundRect(ctx, ix, iy, iw, ih, 6, D.alpha(c.bg, 0.85), D.alpha(c.ink, 0.18));
    var pl = ix + 8, pr = ix + iw - 8, pt = iy + fs + 8, pb = iy + ih - 12;
    D.text(ctx, '% reflected vs i', ix + iw / 2, iy + fs / 2 + 4, { color: c.muted, size: fs - 1.5, align: 'center', weight: 700 });
    D.line(ctx, pl, pb, pr, pb, c.axis, 1); D.line(ctx, pl, pb, pl, pt, c.axis, 1);
    D.curve(ctx, function (x) { var a = (x - pl) / (pr - pl) * Math.PI / 2; return pb - reflectance(o.n1, o.n2, Math.min(a, 1.5706)) * (pb - pt); }, pl, pr, c.s2, 1.8, 1);
    D.circle(ctx, pl + p.i / 90 * (pr - pl), pb - o.R * (pb - pt), 4, c.warning);
    D.text(ctx, '0°', pl, pb + 7, { color: c.faint, size: fs - 3, align: 'center' }); D.text(ctx, '90°', pr, pb + 7, { color: c.faint, size: fs - 3, align: 'center' });
  }

  function drawFibre(ctx, W, H, c, p, fs, now) {
    var g = fibreGeo(W, H, p), key = [W, H, p.launch, p.clad, p.bend].join(',');
    if (cache.key !== key) { cache.key = key; cache.t = traceFibre(g, p); }
    var t = cache.t;
    function stroke(width, col) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.beginPath();
      g.pts.forEach(function (q, k) { if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.stroke(); ctx.restore();
    }
    if (p.clad === 'clad') stroke(2 * g.a + 10, c.light ? '#cbd5e1' : '#334155');
    stroke(2 * g.a, D.alpha(c.s1, 0.28));
    // laser outside the end face
    var th = M.rad(p.launch), sx = g.pts[0].x, sy = g.pts[0].y, Lx = Math.min(sx - 6, 56);
    beam(ctx, sx - Math.cos(th) * Lx, sy - Math.sin(th) * Lx, sx, sy, 1, 2.5);
    ctx.save(); ctx.translate(sx - Math.cos(th) * Lx, sy - Math.sin(th) * Lx); ctx.rotate(th);
    D.roundRect(ctx, -22, -6, 22, 12, 3, c.light ? '#334155' : '#475569', c.ink, 1); ctx.restore();
    // acceptance cone
    if (t.acc < 89) {
      var ac = M.rad(t.acc);
      ctx.save(); ctx.fillStyle = D.alpha(c.success, 0.1); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.arc(sx, sy, Lx, Math.PI - ac, Math.PI + ac); ctx.closePath(); ctx.fill(); ctx.restore();
      D.text(ctx, 'acceptance cone ±' + M.fmt(t.acc, 0) + '°', 4, sy - Lx * Math.sin(ac) - 10, { color: c.success, size: fs - 1.5, weight: 700, fit: W });
    }
    // light path
    for (var k = 1; k < t.path.length; k++) beam(ctx, t.path[k - 1].x, t.path[k - 1].y, t.path[k].x, t.path[k].y, t.path[k - 1].I, 1.6);
    t.leaks.forEach(function (lk) { if (lk.I > 0.01) beam(ctx, lk.x, lk.y, lk.x + lk.d.x * 60, lk.y + lk.d.y * 60, lk.I, 1.4); });
    if (t.out) { var gl = ctx.createRadialGradient(t.out.x, t.out.y, 1, t.out.x, t.out.y, 26); gl.addColorStop(0, D.alpha(LASER, 0.9 * t.Iend)); gl.addColorStop(1, D.alpha(LASER, 0)); ctx.fillStyle = gl; ctx.fillRect(t.out.x - 26, t.out.y - 26, 52, 52); }
    // a pulse running along the path
    var total = 0, segs = [];
    for (var j = 1; j < t.path.length; j++) { var l = Math.hypot(t.path[j].x - t.path[j - 1].x, t.path[j].y - t.path[j - 1].y); segs.push(l); total += l; }
    if (total > 0) {
      var s = ((now / 1000) * 260) % total;
      for (var m = 0; m < segs.length; m++) { if (s <= segs[m]) { var f = s / segs[m], A = t.path[m], B = t.path[m + 1]; D.circle(ctx, A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f, 4.5, '#fff1f2', LASER, 2); break; } s -= segs[m]; }
    }
    var head = Math.round(t.Iend * 100) + ' % of the light reaches the far end';
    D.text(ctx, head, W / 2, 14, { color: t.Iend > 0.9 ? c.bg : c.text, bg: t.Iend > 0.9 ? c.success : D.alpha(c.ink, 0.08), size: fs + 0.5, weight: 700, align: 'center', pad: 4, fit: W });
    D.text(ctx, 'core 1.50 · ' + (p.clad === 'clad' ? 'cladding 1.46' : 'air outside') + ' · drawn ~100× too wide', 8, H * 0.24 + g.a + 22, { color: c.muted, size: fs - 2, fit: W });
  }

  function drawGem(ctx, W, H, c, p, fs) {
    var g = gemGeo(W, H), gm = traceGem(g, p, H), L = Math.max(W, H);
    ctx.save(); ctx.beginPath(); g.poly.forEach(function (q, k) { if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.closePath();
    ctx.fillStyle = D.alpha(p.mat === 'diamond' ? '#bae6fd' : p.mat === 'water' ? '#38bdf8' : c.s1, 0.14); ctx.fill(); ctx.strokeStyle = D.alpha(c.ink, 0.7); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    D.text(ctx, 'pavilion', g.gx - g.Gw * 0.36, g.top + 0.42 * g.Gw, { color: c.faint, size: fs - 1, align: 'center' });
    D.text(ctx, 'table', g.gx, g.top - 8, { color: c.faint, size: fs - 1, align: 'center' });
    gm.rays.forEach(function (r) {
      beam(ctx, r.inPath[0].x, r.inPath[0].y, r.inPath[1].x, r.inPath[1].y, 0.9, 1.4);
      r.segs.forEach(function (sg) { beam(ctx, sg.a.x, sg.a.y, sg.b.x, sg.b.y, sg.I, 1.4); });
      r.exits.forEach(function (ex) {
        if (ex.I < 0.01) return;
        var col = ex.up ? '#facc15' : '#64748b', a = M.clamp(0.3 + ex.I, 0, 1);
        D.line(ctx, ex.p.x, ex.p.y, ex.p.x + ex.d.x * L, ex.p.y + ex.d.y * L, D.alpha(col, a), 1 + 2.5 * ex.I);
        if (ex.up && ex.I > 0.15) { D.text(ctx, '✦', ex.p.x + ex.d.x * 22, ex.p.y + ex.d.y * 22, { color: '#facc15', size: 10 + 10 * ex.I, align: 'center' }); }
      });
    });
    var head = (p.mat === 'diamond' ? 'Diamond' : p.mat === 'glass' ? 'Glass' : 'Water') + ': ' + M.fmt(gm.up * 100, 0) + ' % sparkles back out of the top';
    D.text(ctx, head, W / 2, 14, { color: c.text, bg: D.alpha(c.bg, 0.9), size: fs + 0.5, weight: 700, align: 'center', pad: 4, fit: W });
    D.text(ctx, 'i_c = ' + M.fmt(gm.ic, 1) + '° · leaks out of the bottom: ' + M.fmt(gm.down * 100, 0) + ' %', W / 2, H - 10, { color: c.muted, size: fs, align: 'center', fit: W });
  }

  function drawMirage(ctx, W, H, c, p, fs) {
    var dT = p.road - 30, mi = mirageInfo(dT), nar = W < 560;
    var vw = nar ? Math.max(54, W * 0.17) : Math.min(120, W * 0.15), dl = 8, dr = W - vw - 18, dtop = 34, dbot = H - 30;
    function X(x) { return dl + x / XMAX * (dr - dl); }
    function Y(y) { return dbot - y / YMAX * (dbot - dtop); }
    // sky, hot layer, road
    ctx.fillStyle = D.alpha(c.light ? '#bfdbfe' : '#1e3a8a', 0.35); ctx.fillRect(dl, dtop, dr - dl, dbot - dtop);
    if (dT > 0) { var hot = ctx.createLinearGradient(0, Y(1.2), 0, dbot); hot.addColorStop(0, 'rgba(249,115,22,0)'); hot.addColorStop(1, D.alpha('#f97316', M.clamp(dT / 40, 0, 1) * 0.55)); ctx.fillStyle = hot; ctx.fillRect(dl, Y(1.2), dr - dl, dbot - Y(1.2)); }
    ctx.fillStyle = c.light ? '#475569' : '#1f2937'; ctx.fillRect(dl, dbot, dr - dl, 10);
    for (var xm = 10; xm < XMAX; xm += 40) D.line(ctx, X(xm), dbot + 5, X(xm + 18), dbot + 5, '#f8fafc', 1.5);
    // eye
    D.circle(ctx, X(0) + 4, Y(EYE), 4, c.ink); D.text(ctx, 'eye', X(0) + 10, Y(EYE) - 12, { color: c.text, size: fs - 1, weight: 700 });
    // rays (traced from the eye; light really travels towards the eye)
    ctx.save(); ctx.beginPath(); ctx.rect(dl, dtop, dr - dl, dbot - dtop + 1); ctx.clip();
    for (var k = 9; k >= -6; k--) {
      var r = traceAir(k / 10, dT, true), col = r.hit === 'road' || r.hit === 'far' ? D.alpha(c.muted, 0.5) : r.turned ? '#22d3ee' : '#38bdf8';
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = r.hit === 'road' ? 1 : 1.7; ctx.beginPath();
      r.pts.forEach(function (q, k) { var px = X(q.x), py = Y(Math.max(0, q.y)); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    if (mi.at) D.text(ctx, 'mirage', X(mi.at), dbot - 12, { color: '#38bdf8', size: fs, weight: 800, align: 'center', bg: D.alpha(c.bg, 0.75), pad: 2, fit: dr });
    D.text(ctx, '0', X(0), dbot + 20, { color: c.faint, size: fs - 2, align: 'center' }); D.text(ctx, XMAX + ' m', dr - 6, dbot + 20, { color: c.faint, size: fs - 2, align: 'right' });
    D.text(ctx, 'heights stretched ~50×', dl + 2, dtop + 8, { color: c.faint, size: fs - 2 });
    var head = dT > 0 ? 'Hot road: air near it is thinner (smaller n), so rays bend upwards' : 'Road as warm as the air: rays go straight';
    D.text(ctx, head, W / 2, 14, { color: c.text, bg: D.alpha(c.bg, 0.9), size: fs, weight: 700, align: 'center', pad: 4, fit: W });
    // what the eye sees: one row per viewing angle
    var vx = W - vw - 8, vt = dtop, vb = dbot, rows = mi.view, rh = (vb - vt) / rows.length;
    rows.forEach(function (rw, k) {
      ctx.fillStyle = rw.hit === 'road' ? (c.light ? '#64748b' : '#374151') : rw.hit === 'far' ? '#94a3b8' : (rw.a < 0 ? '#a5f3fc' : '#38bdf8');
      ctx.fillRect(vx, vt + k * rh, vw, rh + 0.6);
    });
    var wet = []; rows.forEach(function (rw, k) { if (rw.a < 0 && rw.hit === 'sky') wet.push(k); });
    if (wet.length) D.text(ctx, '“water”', vx + vw / 2, vt + (wet[0] + wet[wet.length - 1] + 1) / 2 * rh, { color: '#0c4a6e', size: fs - 2, weight: 800, align: 'center', fit: W });
    var hy = vt + (1.0 / 2.0) * (vb - vt);
    D.line(ctx, vx - 4, hy, vx + vw + 4, hy, c.ink, 1, [3, 3]);
    D.roundRect(ctx, vx, vt, vw, vb - vt, 4, null, D.alpha(c.ink, 0.6), 1);
    D.text(ctx, 'you see', vx + vw / 2, vt - 9, { color: c.text, size: fs - 1, weight: 700, align: 'center', fit: W });
    D.text(ctx, 'level', vx - 6, hy, { color: c.muted, size: fs - 2.5, align: 'right' });
    D.text(ctx, '±1°', vx + vw / 2, vb + 10, { color: c.faint, size: fs - 2, align: 'center', fit: W });
  }
})();
