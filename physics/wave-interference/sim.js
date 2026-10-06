/* =====================================================================
   Waves · Wave Interference (two sources in a ripple tank) — sim.js
   ---------------------------------------------------------------------
   Two dippers S₁, S₂ a distance d apart make circular ripples of the
   same wavelength λ (coherent sources). The water height at a point is
     h = A₁ sin(k r₁ − ωt) + A₂ sin(k r₂ − ωt + φ),  k = 2π/λ,
   with A ∝ 1/√r (a circular wave spreads its energy round a growing
   circle). φ = 0 for sources in step, π for sources in opposite step.
   Per cell we store S = Σ A sin(k r + φ) and C = Σ A cos(k r + φ), so
     h = S cos ωt − C sin ωt  and the time-average of h² is (S² + C²)/2.
   Bright (antinodal) lines: r₂ − r₁ = mλ; calm (nodal) lines:
   r₂ − r₁ = (m + ½)λ (swapped when φ = π). On the "screen" at the right
   the bands are about β = λD/d apart when D ≫ d.
   Ripples travel at 25 cm/s (typical for a ripple tank), so f = v/λ;
   the motion is shown slowed down to about one wave per second.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var V = 25, SHOW_F = 0.9;
  var cache = { key: '' }, drag = false, off = null;

  function geo(sim) {
    var W = sim.width, H = sim.height, small = W < 560, xs = Math.round(W * (small ? 0.8 : 0.84));
    var pxcm = Math.min((H - 40) / 26, xs / 36), sx = Math.max(24, xs * 0.08), cy = H / 2;
    var h = sim.p.d / 2 * pxcm;
    return { W: W, H: H, xs: xs, pxcm: pxcm, s1: { x: sx, y: cy - h }, s2: { x: sx, y: cy + h }, cy: cy, cell: small ? 2 : 3, small: small };
  }
  function phi(p) { return p.phase === 'anti' ? Math.PI : 0; }
  // S and C at a pixel
  function sc(g, p, x, y) {
    var k = 2 * Math.PI / p.lam, r1 = Math.hypot(x - g.s1.x, y - g.s1.y) / g.pxcm, r2 = Math.hypot(x - g.s2.x, y - g.s2.y) / g.pxcm;
    var a1 = 1 / Math.sqrt(r1 + 0.4), a2 = 1 / Math.sqrt(r2 + 0.4), t1 = k * r1, t2 = k * r2 + phi(p);
    return { S: a1 * Math.sin(t1) + a2 * Math.sin(t2), C: a1 * Math.cos(t1) + a2 * Math.cos(t2), r1: r1, r2: r2 };
  }
  function build(sim, g) {
    var p = sim.p, key = [g.W, g.H, p.lam, p.d, p.phase].join('|');
    if (cache.key === key) return cache;
    var nx = Math.ceil(g.xs / g.cell), ny = Math.ceil(g.H / g.cell), S = new Float32Array(nx * ny), C = new Float32Array(nx * ny);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var v = sc(g, p, (i + 0.5) * g.cell, (j + 0.5) * g.cell); S[j * nx + i] = v.S; C[j * nx + i] = v.C;
    }
    var ref = 2 / Math.sqrt((g.xs - g.s1.x) / g.pxcm * 0.5); // two waves in step, halfway across
    cache = { key: key, nx: nx, ny: ny, S: S, C: C, ref: ref };
    if (!off) off = document.createElement('canvas');
    off.width = nx; off.height = ny; cache.img = off.getContext('2d').createImageData(nx, ny);
    return cache;
  }
  function verdict(p, dl) { // dl = path difference in wavelengths, includes the source phase
    var x = dl + (p.phase === 'anti' ? 0.5 : 0), f = Math.abs(x - Math.round(x));
    return f < 0.12 ? 'bright: waves meet in step' : f > 0.38 ? 'calm: crest meets trough' : 'in between';
  }
  function counts(p) {
    var r = p.d / p.lam, inStep = p.phase !== 'anti';
    var a = 2 * Math.floor(r) + 1, n = 2 * Math.floor(r + 0.5);
    return inStep ? { bright: a, calm: n } : { bright: n, calm: a };
  }
  function probePx(sim, g) { return { x: sim.state.px * g.xs, y: sim.state.py * g.H }; }

  SimLab.createSim({
    ariaLabel: 'Ripples from two dippers in a ripple tank interfering, with bright and calm bands, a probe that measures the path difference, and the pattern of bright and dark bands on a screen at the right',
    autoplay: true,
    mobileAspect: '1 / 1',
    params: [
      { id: 'lam', label: 'Wavelength λ', min: 1, max: 5, step: 0.1, value: 2, unit: 'cm' },
      { id: 'd', label: 'Distance between the sources d', min: 1, max: 12, step: 0.5, value: 6, unit: 'cm' },
      { id: 'phase', label: 'The two dippers move', type: 'select', value: 'in', options: [
        { value: 'in', label: 'In step (coherent, same phase)' }, { value: 'anti', label: 'In opposite step (phase π)' }] },
      { id: 'view', label: 'Show', type: 'select', value: 'ripples', options: [
        { value: 'ripples', label: 'Moving ripples' }, { value: 'average', label: 'Average wave energy (bright = big waves)' }] },
      { id: 'lines', label: 'Mark bright and calm lines', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'pd', label: 'Path difference at the probe r₂ − r₁', key: true },
      { id: 'res', label: 'At the probe' },
      { id: 'f', label: 'Frequency f = v ÷ λ (v = 25 cm/s)', unit: 'Hz', digits: 1 },
      { id: 'n', label: 'Bright lines / calm lines' },
      { id: 'beta', label: 'Band spacing on the screen ≈ λD/d', unit: 'cm', digits: 1 }
    ],
    onParam: function () { return true; },
    reset: function (sim) { sim.state = { px: 0.62, py: 0.5 }; },
    update: function () {},
    readout: function (sim) {
      var g = geo(sim), p = sim.p, pp = probePx(sim, g), v = sc(g, p, pp.x, pp.y), dd = v.r2 - v.r1, cn = counts(p);
      return { pd: M.fmt(dd, 2) + ' cm = ' + M.fmt(dd / p.lam, 2) + ' λ', res: verdict(p, dd / p.lam), f: V / p.lam,
        n: cn.bright + ' / ' + cn.calm, beta: p.lam * ((g.xs - g.s1.x) / g.pxcm) / p.d };
    },
    status: function (sim) { return (sim.running ? 'Running (slowed down)' : 'Paused') + ' · drag the probe ◎'; },
    pointer: {
      down: function (sim, x, y) {
        var g = geo(sim); if (x > g.xs) return false;
        drag = true; sim.state.px = M.clamp(x / g.xs, 0.02, 0.98); sim.state.py = M.clamp(y / g.H, 0.04, 0.96); sim.redraw(); return true;
      },
      move: function (sim, x, y) {
        if (!drag) return; var g = geo(sim);
        sim.state.px = M.clamp(x / g.xs, 0.02, 0.98); sim.state.py = M.clamp(y / g.H, 0.04, 0.96); sim.redraw();
      },
      up: function () { drag = false; },
      hover: function (sim, x) { return x < geo(sim).xs; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, g = geo(sim), W = g.W, H = g.H, fs = g.small ? 10 : 12;
      D.clear(ctx, W, H, c.bg);
      var B = build(sim, g), img = B.img.data, wt = 2 * Math.PI * SHOW_F * sim.time, cw = Math.cos(wt), sw = Math.sin(wt);
      var lo = c.light ? [12, 74, 110] : [4, 30, 52], hi = c.light ? [224, 242, 254] : [165, 225, 255], avg = p.view === 'average';
      for (var i = 0, n = B.nx * B.ny; i < n; i++) {
        var u;
        if (avg) u = M.clamp(Math.sqrt((B.S[i] * B.S[i] + B.C[i] * B.C[i]) / 2) / (B.ref * 0.75), 0, 1) * 2 - 1;
        else { var hgt = (B.S[i] * cw - B.C[i] * sw) / B.ref; u = hgt / (1 + Math.abs(hgt)) * 1.6; u = M.clamp(u, -1, 1); }
        var t = (u + 1) / 2, o = i * 4;
        img[o] = lo[0] + (hi[0] - lo[0]) * t; img[o + 1] = lo[1] + (hi[1] - lo[1]) * t; img[o + 2] = lo[2] + (hi[2] - lo[2]) * t; img[o + 3] = 255;
      }
      off.getContext('2d').putImageData(B.img, 0, 0);
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, B.nx * g.cell, B.ny * g.cell); ctx.restore();
      if (p.lines) drawLines(ctx, g, p, c);

      // sources (dippers)
      [g.s1, g.s2].forEach(function (s, i) {
        D.circle(ctx, s.x, s.y, 6, '#f472b6', '#fff', 2);
        D.text(ctx, 'S' + (i + 1), s.x + 10, s.y + (i ? 10 : -10), { color: '#fff', size: fs, weight: 800, bg: 'rgba(0,0,0,0.45)', pad: 2 });
      });

      // probe and its two paths
      var pp = probePx(sim, g);
      D.line(ctx, g.s1.x, g.s1.y, pp.x, pp.y, 'rgba(253,224,71,0.9)', 1.5, [5, 4]);
      D.line(ctx, g.s2.x, g.s2.y, pp.x, pp.y, 'rgba(253,224,71,0.9)', 1.5, [5, 4]);
      D.circle(ctx, pp.x, pp.y, 9, null, '#fde047', 2.5); D.circle(ctx, pp.x, pp.y, 2.5, '#fde047');
      var v = sc(g, p, pp.x, pp.y), lab = 'r₂ − r₁ = ' + M.fmt((v.r2 - v.r1) / p.lam, 2) + ' λ';
      D.text(ctx, lab, pp.x, pp.y + (pp.y > H - 40 ? -22 : 22), { color: '#fff', size: fs, weight: 700, align: 'center', bg: 'rgba(0,0,0,0.55)', pad: 3, fit: g.xs });

      // screen at the right: time-averaged intensity along it
      var sx0 = g.xs, sw2 = W - g.xs, bar = Math.min(22, sw2 * 0.3), Is = [], Imax = 0;
      for (var y = 0; y <= H; y += 2) { var q = sc(g, p, g.xs, y), I = (q.S * q.S + q.C * q.C) / 2; Is.push(I); Imax = Math.max(Imax, I); }
      ctx.fillStyle = c.surface2 || c.bg; ctx.fillRect(sx0, 0, sw2, H);
      Is.forEach(function (I, j) { var a = M.clamp(I / Imax, 0, 1); ctx.fillStyle = 'rgba(253,224,71,' + a.toFixed(3) + ')'; ctx.fillRect(sx0, j * 2 - 1, bar, 2.2); });
      ctx.save(); ctx.strokeStyle = c.s2; ctx.lineWidth = 1.6; ctx.beginPath();
      var gx = sx0 + bar + 4, gwid = sw2 - bar - 8;
      Is.forEach(function (I, j) { var x = gx + I / Imax * gwid; if (j) ctx.lineTo(x, j * 2); else ctx.moveTo(x, 0); });
      ctx.stroke(); ctx.restore();
      D.line(ctx, sx0, 0, sx0, H, c.border, 1.5);
      D.text(ctx, 'screen', sx0 + sw2 / 2, H - 10, { color: c.muted, size: g.small ? 9 : 11, weight: 700, align: 'center' });

      var head = avg ? 'Bright = big waves, dark = calm water' : (g.small ? 'Two ripples overlap: interference' : 'Ripples from two dippers overlap: interference');
      D.text(ctx, head, g.xs / 2, 14, { color: c.bg, bg: c.s3, size: g.small ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: g.xs });
      D.text(ctx, 'tank height = ' + Math.round(H / g.pxcm) + ' cm', g.xs - 6, H - 10, { color: '#fff', size: g.small ? 9 : 10.5, align: 'right', bg: 'rgba(0,0,0,0.4)', pad: 2 });
    }
  });

  // bright (solid) and calm (dashed) lines: contours of r₂ − r₁ by marching squares
  function drawLines(ctx, g, p, c) {
    var step = 6, nx = Math.ceil(g.xs / step) + 1, ny = Math.ceil(g.H / step) + 1, F = new Float32Array(nx * ny);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var x = i * step, y = j * step;
      F[j * nx + i] = (Math.hypot(x - g.s2.x, y - g.s2.y) - Math.hypot(x - g.s1.x, y - g.s1.y)) / g.pxcm / p.lam + (p.phase === 'anti' ? 0.5 : 0);
    }
    var top = Math.ceil(p.d / p.lam) + 1;
    [[0, '#fde047', null], [0.5, '#f9a8d4', [5, 4]]].forEach(function (set) {
      ctx.save(); ctx.strokeStyle = set[1]; ctx.lineWidth = 1.6; if (set[2]) ctx.setLineDash(set[2]); ctx.beginPath();
      for (var m = -top; m <= top + 1; m++) {
        var L = m + set[0];
        for (var j2 = 0; j2 < ny - 1; j2++) for (var i2 = 0; i2 < nx - 1; i2++) {
          var a = F[j2 * nx + i2] - L, b = F[j2 * nx + i2 + 1] - L, cc = F[(j2 + 1) * nx + i2 + 1] - L, d = F[(j2 + 1) * nx + i2] - L, pts = [];
          var x0 = i2 * step, y0 = j2 * step;
          if ((a > 0) !== (b > 0)) pts.push([x0 + step * a / (a - b), y0]);
          if ((b > 0) !== (cc > 0)) pts.push([x0 + step, y0 + step * b / (b - cc)]);
          if ((cc > 0) !== (d > 0)) pts.push([x0 + step * d / (d - cc), y0 + step]);
          if ((d > 0) !== (a > 0)) pts.push([x0, y0 + step * a / (a - d)]);
          if (pts.length >= 2) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); }
        }
      }
      ctx.stroke(); ctx.restore();
    });
  }
})();
