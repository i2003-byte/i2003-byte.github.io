/* =====================================================================
   Human eye and the colourful world · Dispersion and scattering — sim.js
   ---------------------------------------------------------------------
   Mode "prism": a white ray is traced exactly through an equilateral
   prism (A = 60°) for seven colours, using Snell's law
     n₁ sin θ₁ = n₂ sin θ₂   at every face (total internal reflection
   if no refracted ray exists). The refractive index depends on the
   wavelength λ (Cauchy's formula n = a + b/λ², λ in µm):
     crown glass a = 1.5046, b = 0.00420 · flint a = 1.5960, b = 0.00934
     water       a = 1.3240, b = 0.00309
   Deviation δ = i + e − A. "Exaggerate" multiplies (n − n_yellow) by 4
   so the real spread of about 1–3° is easy to see.
   A second, inverted prism undoes the dispersion (Newton's experiment).

   Mode "sky": Rayleigh scattering by air molecules ∝ 1/λ⁴. Sunlight
   crossing an air mass X (X ≈ 1/sin(elevation), capped at 38) keeps
     T(λ) = exp(−τ·(550/λ)⁴·X),  τ = 0.1 at 550 nm.
   The sky colour is the scattered light, s(λ) = (550/λ)⁴·T(λ·path).
   Colours use three wavelengths (R 650, G 550, B 450 nm): a simple
   model that ignores dust, ozone and the eye's colour response.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var BANDS = [
    { n: 'red', l: 0.70, col: '#ef4444' }, { n: 'orange', l: 0.61, col: '#f97316' }, { n: 'yellow', l: 0.58, col: '#eab308' },
    { n: 'green', l: 0.53, col: '#22c55e' }, { n: 'blue', l: 0.47, col: '#3b82f6' }, { n: 'indigo', l: 0.445, col: '#6366f1' },
    { n: 'violet', l: 0.41, col: '#a855f7' }];
  var MAT = { crown: [1.5046, 0.0042], flint: [1.5960, 0.00934], water: [1.3240, 0.00309] };
  var A = 60;

  function nOf(p, l) {
    var m = MAT[p.mat], n = m[0] + m[1] / (l * l), ny = m[0] + m[1] / (0.58 * 0.58);
    return p.exag ? ny + (n - ny) * 4 : n;
  }
  // exact prism angles for one wavelength (i in degrees)
  function prismAngles(i, n) {
    var r1 = Math.asin(Math.sin(M.rad(i)) / n), r2 = M.rad(A) - r1, s = n * Math.sin(r2);
    if (s > 1) return { tir: true, r1: M.deg(r1) };
    var e = M.deg(Math.asin(s));
    return { r1: M.deg(r1), r2: M.deg(r2), e: e, dev: i + e - A };
  }

  // ---- generic 2D ray tracer through convex polygons (screen coordinates) ----
  function refract(d, nr, eta) { // nr points back towards the incoming side
    var ci = -(d.x * nr.x + d.y * nr.y), k = 1 - eta * eta * (1 - ci * ci);
    if (k < 0) return { x: d.x + 2 * ci * nr.x, y: d.y + 2 * ci * nr.y, tir: true };
    var t = eta * ci - Math.sqrt(k);
    return { x: eta * d.x + t * nr.x, y: eta * d.y + t * nr.y };
  }
  function trace(start, dir, polys, n) {
    var pts = [start], o = start, d = dir;
    for (var hop = 0; hop < 12; hop++) {
      var best = null;
      polys.forEach(function (P) {
        for (var j = 0; j < 3; j++) {
          var a = P.v[j], b = P.v[(j + 1) % 3], ex = b.x - a.x, ey = b.y - a.y;
          var den = d.x * ey - d.y * ex; if (Math.abs(den) < 1e-12) continue;
          var t = ((a.x - o.x) * ey - (a.y - o.y) * ex) / den, u = ((a.x - o.x) * d.y - (a.y - o.y) * d.x) / den;
          if (t > 1e-6 && u >= 0 && u <= 1 && (!best || t < best.t)) {
            var nx = ey, ny = -ex, len = Math.hypot(nx, ny); nx /= len; ny /= len;
            var mx = (a.x + b.x) / 2 - P.c.x, my = (a.y + b.y) / 2 - P.c.y;
            if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; } // outward normal
            best = { t: t, nx: nx, ny: ny };
          }
        }
      });
      if (!best) break;
      var hit = { x: o.x + d.x * best.t, y: o.y + d.y * best.t }, entering = d.x * best.nx + d.y * best.ny < 0;
      var nr = entering ? { x: best.nx, y: best.ny } : { x: -best.nx, y: -best.ny };
      d = refract(d, nr, entering ? 1 / n : n);
      var l = Math.hypot(d.x, d.y); d = { x: d.x / l, y: d.y / l };
      pts.push(hit); o = { x: hit.x + d.x * 1e-4, y: hit.y + d.y * 1e-4 };
    }
    return { pts: pts, end: d };
  }
  function tri(c, s, up) {
    var h = s * Math.sqrt(3) / 2, k = up ? 1 : -1;
    return { c: c, v: [{ x: c.x, y: c.y - k * 2 * h / 3 }, { x: c.x + s / 2, y: c.y + k * h / 3 }, { x: c.x - s / 2, y: c.y + k * h / 3 }] };
  }
  function fitSize(ctx, str, size, maxW, weight) {
    ctx.font = weight + ' ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 8.5 && ctx.measureText(str).width > maxW) { size -= 0.5; ctx.font = weight + ' ' + size + 'px Inter, system-ui, sans-serif'; }
    return size;
  }

  // ---- sky model ----
  var TAU = 0.1, RGB_L = [650, 550, 450];
  function airMass(el) { return Math.min(38, 1 / Math.max(0.026, Math.sin(M.rad(el)))); }
  function trans(X, l) { return Math.exp(-TAU * Math.pow(550 / l, 4) * X); }
  function toCss(v, bright) {
    var mx = Math.max(v[0], v[1], v[2]) || 1;
    return 'rgb(' + v.map(function (x) { return Math.round(255 * Math.pow(M.clamp(x / mx * bright, 0, 1), 1 / 2.2)); }).join(',') + ')';
  }
  function skyColours(p) {
    var X = airMass(p.el), dusk = M.clamp((p.el + 4) / 14, 0, 1);
    if (p.air === 'none') return { top: '#000000', hor: '#020205', sun: '#ffffff' };
    function scat(l) { return p.air === 'large' ? 1 : Math.pow(550 / l, 4); }
    var top = RGB_L.map(function (l) { return scat(l) * trans(Math.min(X * 0.45, 2.5), l); });
    var hor = RGB_L.map(function (l) { return scat(l) * trans(X, l); });
    var sun = RGB_L.map(function (l) { return trans(X, p.air === 'large' ? 550 : l); });
    var b = 0.25 + 0.75 * dusk;
    return { top: toCss(top, b * 0.95), hor: toCss(hor, b), sun: toCss(sun, 1) };
  }

  SimLab.createSim({
    ariaLabel: 'Mode 1: a white ray passes through a glass prism and splits into a spectrum on a screen. Mode 2: sunlight crosses the atmosphere and the sky colour changes with the height of the Sun.',
    transport: false,
    params: [
      { id: 'mode', label: 'Show', type: 'select', value: 'prism', options: [
        { value: 'prism', label: 'Dispersion by a glass prism' }, { value: 'sky', label: 'Scattering: why the sky is blue' }] },
      { id: 'i', label: 'Prism: angle of incidence i', min: 30, max: 85, step: 1, value: 50, unit: '°' },
      { id: 'mat', label: 'Prism: material', type: 'select', value: 'crown', options: [
        { value: 'crown', label: 'Crown glass' }, { value: 'flint', label: 'Flint glass (more dispersive)' }, { value: 'water', label: 'Water (hollow prism)' }] },
      { id: 'exag', label: 'Prism: exaggerate the spread ×4', type: 'toggle', value: true },
      { id: 'second', label: 'Prism: add a second, upside-down prism', type: 'toggle', value: false },
      { id: 'el', label: 'Sky: height of the Sun above the horizon', min: 0, max: 90, step: 1, value: 60, unit: '°',
        presets: [{ label: 'Noon', value: 75 }, { label: 'Evening', value: 8 }, { label: 'Sunset', value: 1 }] },
      { id: 'air', label: 'Sky: what fills the air', type: 'select', value: 'clean', options: [
        { value: 'clean', label: 'Clean air (tiny molecules)' }, { value: 'large', label: 'Big particles (cloud, fog, haze)' }, { value: 'none', label: 'No air (Moon, outer space)' }] }
    ],
    readouts: [
      { id: 'nr', label: 'n for red', digits: 4 },
      { id: 'nv', label: 'n for violet', digits: 4 },
      { id: 'dr', label: 'Deviation of red', unit: '°', digits: 2 },
      { id: 'dv', label: 'Deviation of violet', unit: '°', digits: 2 },
      { id: 'disp', label: 'Angular dispersion δv − δr', unit: '°', digits: 2, key: true },
      { id: 'ratio', label: 'Blue (450 nm) scattered vs red (650 nm)', unit: '×', digits: 1 },
      { id: 'am', label: 'Air the sunlight crosses (× overhead)', digits: 1 }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var p = sim.p, r = prismAngles(p.i, nOf(p, 0.70)), v = prismAngles(p.i, nOf(p, 0.41));
      var ok = !r.tir && !v.tir;
      return { nr: nOf(p, 0.70), nv: nOf(p, 0.41), dr: r.tir ? 'TIR' : r.dev, dv: v.tir ? 'TIR' : v.dev,
        disp: ok ? v.dev - r.dev : '—', ratio: p.air === 'clean' ? Math.pow(650 / 450, 4) : p.air === 'large' ? 1 : '—', am: airMass(p.el) };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, narrow = W < 560;
      if (p.mode === 'sky') return drawSky(ctx, W, H, c, p, narrow);
      D.clear(ctx, W, H, c.bg);
      var s = Math.min(W * (p.second ? 0.24 : 0.3), H * 0.5), h = s * Math.sqrt(3) / 2;
      var P1 = tri({ x: W * (p.second ? 0.3 : 0.36), y: H * 0.5 }, s, true), polys = [P1];
      // hit point on the left face (40% of the way up), incoming direction from i
      var bl = P1.v[2], ap = P1.v[0], hp = { x: bl.x + (ap.x - bl.x) * 0.45, y: bl.y + (ap.y - bl.y) * 0.45 };
      var th = M.rad(30 - p.i), dir = { x: Math.cos(th), y: Math.sin(th) }, start = { x: hp.x - dir.x * 2000, y: hp.y - dir.y * 2000 };
      if (p.second) { // place an inverted prism along the green ray, faces parallel to the first
        var g = trace(start, dir, [P1], nOf(p, 0.53)), E = g.pts[g.pts.length - 1], gap = s * 0.35;
        var mid = { x: E.x + g.end.x * gap, y: E.y + g.end.y * gap };
        polys.push(tri({ x: mid.x + s / 4, y: mid.y - h / 6 }, s, false));
      }
      var scrX = W - 18;
      // prisms
      polys.forEach(function (P) {
        ctx.beginPath(); ctx.moveTo(P.v[0].x, P.v[0].y); ctx.lineTo(P.v[1].x, P.v[1].y); ctx.lineTo(P.v[2].x, P.v[2].y); ctx.closePath();
        ctx.fillStyle = D.alpha(c.s1, 0.14); ctx.fill(); ctx.strokeStyle = D.alpha(c.s1, 0.9); ctx.lineWidth = 2; ctx.stroke();
      });
      D.text(ctx, 'A = 60°', ap.x, ap.y - 10, { color: c.muted, size: 10.5, weight: 600, align: 'center' });
      // white beam in
      D.line(ctx, Math.max(0, start.x), start.y + (Math.max(0, start.x) - start.x) * dir.y / dir.x, hp.x, hp.y, c.text, 3.5);
      D.text(ctx, 'white light', 8, hp.y - (hp.x - 8) * dir.y / dir.x - 14, { color: c.text, size: 11, weight: 700 });
      // normal at the first face
      var nrm = { x: -Math.cos(M.rad(30)), y: -Math.sin(M.rad(30)) };
      D.line(ctx, hp.x + nrm.x * 40, hp.y + nrm.y * 40, hp.x - nrm.x * 30, hp.y - nrm.y * 30, D.alpha(c.muted, 0.8), 1, [4, 3]);
      // colour rays
      var hits = [];
      ctx.save(); ctx.beginPath(); ctx.rect(0, 26, scrX, H - 26); ctx.clip();
      BANDS.forEach(function (b) {
        var r = trace(start, dir, polys, nOf(p, b.l)), q = r.pts;
        ctx.strokeStyle = b.col; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(q[1].x, q[1].y);
        for (var k = 2; k < q.length; k++) ctx.lineTo(q[k].x, q[k].y);
        var last = q[q.length - 1], t = r.end.x > 1e-6 ? (scrX - last.x) / r.end.x : 3000;
        ctx.lineTo(last.x + r.end.x * t, last.y + r.end.y * t); ctx.stroke();
        if (r.end.x > 1e-6) hits.push({ y: last.y + r.end.y * t, col: b.col, n: b.n, a: Math.atan2(r.end.y, r.end.x) });
      });
      ctx.restore();
      // screen
      D.roundRect(ctx, scrX, 30, 10, H - 60, 3, c.surface2, c.border, 1);
      D.text(ctx, 'screen', scrX + 4, H - 20, { color: c.faint, size: 10, align: 'right' });
      if (hits.length) {
        var ys = hits.map(function (q) { return q.y; }), spread = Math.max.apply(null, ys) - Math.min.apply(null, ys);
        var as = hits.map(function (q) { return q.a; }), fan = Math.max.apply(null, as) - Math.min.apply(null, as);
        if (spread < 4 || fan < 1e-3) { // parallel again: the colours overlap into white
          var y1 = Math.min.apply(null, ys), y2 = Math.max.apply(null, ys);
          D.roundRect(ctx, scrX - 2, y1 - 6, 14, y2 - y1 + 12, 4, '#ffffff', c.border, 1);
          D.text(ctx, 'white again!', scrX - 8, ys[3] - 18, { color: c.text, size: 11, weight: 700, align: 'right' });
        } else {
          hits.forEach(function (q) { D.circle(ctx, scrX + 5, q.y, 3.5, q.col); });
          if (spread > 60) hits.forEach(function (q) { D.text(ctx, q.n.charAt(0).toUpperCase(), scrX - 8, q.y, { color: q.col, size: 10, weight: 700, align: 'right' }); });
        }
      }
      // headline
      var r = prismAngles(p.i, nOf(p, 0.70)), v = prismAngles(p.i, nOf(p, 0.41));
      var head = r.tir || v.tir ? 'Some colours are totally internally reflected at the second face: increase i'
        : 'δ = i + e − A:  red ' + M.fmt(r.dev, 1) + '°, violet ' + M.fmt(v.dev, 1) + '°  →  violet bends most';
      D.text(ctx, head, W / 2, 14, { color: c.bg, bg: c.s3, size: fitSize(ctx, head, narrow ? 11.5 : 13, W - 24, 700), weight: 700, align: 'center', pad: 4, fit: W });
      var foot = narrow ? (p.second ? 'Colours recombine into white (Newton)' : p.exag ? 'Spread drawn 4× larger than real' : 'True spread: only a degree or two') : p.second ? 'The upside-down prism bends every colour back: the colours recombine into white (Newton)'
        : p.exag ? 'Spread drawn 4× larger than real so you can see it (turn off "exaggerate" for the true spread)' : 'True spread: the colours separate by only a degree or two';
      D.text(ctx, foot, W / 2, H - 8, { color: c.muted, size: fitSize(ctx, foot, narrow ? 10.5 : 12, W - 16, 600), weight: 600, align: 'center', fit: W });
    }
  });

  function drawSky(ctx, W, H, c, p, narrow) {
    var col = skyColours(p), groundY = H * 0.78;
    var grd = ctx.createLinearGradient(0, 0, 0, groundY);
    grd.addColorStop(0, col.top); grd.addColorStop(1, col.hor);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, groundY);
    // sun on an arc across the sky
    var R = Math.min(W * 0.42, groundY * 0.85), cx = W * 0.55, a = M.rad(p.el);
    var sx = cx - Math.cos(a) * R, sy = groundY - Math.sin(a) * R, sr = narrow ? 13 : 17;
    if (p.el >= 0) {
      var glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 4);
      glow.addColorStop(0, D.alpha('#ffffff', 0.5)); glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx, sy, sr * 4, 0, Math.PI * 2); ctx.fill();
      D.circle(ctx, sx, sy, sr, col.sun);
    }
    // ground and observer
    ctx.fillStyle = '#1f3d2b'; ctx.fillRect(0, groundY, W, H - groundY);
    var ox = cx, oy = groundY;
    D.circle(ctx, ox, oy - 22, 5, '#e2e8f0'); D.line(ctx, ox, oy - 17, ox, oy - 6, '#e2e8f0', 2.5);
    D.line(ctx, ox, oy - 6, ox - 4, oy, '#e2e8f0', 2); D.line(ctx, ox, oy - 6, ox + 4, oy, '#e2e8f0', 2);
    // sunlight path through the air with scattered blue light
    if (p.air !== 'none') {
      D.line(ctx, sx, sy, ox, oy - 22, 'rgba(255,240,200,0.75)', 2.5, [6, 4]);
      var rng = M.rng(7), n = 9;
      for (var k = 1; k < n; k++) {
        var t = k / n, px = sx + (ox - sx) * t, py = sy + (oy - 22 - sy) * t, ang = rng() * Math.PI * 2;
        var sc = p.air === 'large' ? 'rgba(255,255,255,0.9)' : k % 3 === 0 ? 'rgba(248,113,113,0.7)' : 'rgba(96,165,250,0.95)';
        var len = p.air === 'large' ? 16 : k % 3 === 0 ? 8 : 18;
        D.circle(ctx, px, py, 2.2, 'rgba(255,255,255,0.85)');
        D.arrow(ctx, px, py, px + Math.cos(ang) * len, py + Math.sin(ang) * len, sc, 1.6, 6);
      }
    }
    // labels
    var lab = narrow ? (p.air === 'none' ? 'No air: black sky, even by day' : p.air === 'large' ? 'Big drops scatter all colours: white clouds' : p.el < 12 ? 'Long path through air: blue lost, red Sun' : 'Air scatters blue most: blue sky') : p.air === 'none' ? 'No air, nothing to scatter light: the sky is black even by day'
      : p.air === 'large' ? 'Big drops scatter all colours equally: clouds and fog look white'
      : p.el < 12 ? 'Low Sun: light crosses ' + M.fmt(airMass(p.el), 0) + '× more air, blue is scattered away, the Sun looks red'
      : 'Air molecules scatter blue about 4× more than red: blue light reaches us from all over the sky';
    D.text(ctx, lab, W / 2, 15, { color: '#0f172a', bg: 'rgba(248,250,252,0.9)', size: fitSize(ctx, lab, narrow ? 11 : 12.5, W - 24, 700), weight: 700, align: 'center', pad: 4, fit: W });
    // relative scattering bars (1/λ⁴)
    var bw = narrow ? 14 : 18, gap = 5, bx = 12, by = H - 14, maxH = H - groundY - 34;
    D.text(ctx, 'scattering by air ∝ 1/λ⁴', bx, groundY + 12, { color: '#e2e8f0', size: 10.5, weight: 600 });
    BANDS.slice().reverse().forEach(function (b, k) {
      var rel = p.air === 'large' ? 0.5 : p.air === 'none' ? 0 : Math.pow(0.41 / b.l, 4);
      var hh = Math.max(1, maxH * rel);
      ctx.fillStyle = b.col; ctx.fillRect(bx + k * (bw + gap), by - hh, bw, hh);
    });
    D.text(ctx, 'violet … red', bx, H - 5, { color: '#cbd5e1', size: 9.5 });
    D.text(ctx, 'Sun ' + p.el + '° high', W - 10, groundY + 14, { color: '#e2e8f0', size: 11, weight: 700, align: 'right' });
  }
})();
