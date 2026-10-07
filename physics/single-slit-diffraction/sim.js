/* =====================================================================
   Optics · Single-Slit Diffraction — sim.js
   ---------------------------------------------------------------------
   Plane light waves of wavelength λ pass through one slit of width a.
   Every point of the opening sends out wavelets (Huygens). At a point P
   at height y on a screen a distance D away, the two edges of the slit
   differ in path by about  a·y ÷ D = a sin θ  (small angles).
     dark bands:  a sin θ = nλ  (n = 1, 2, 3 …)  →  y = nλD/a
       (split the slit into 2n parts; neighbouring parts cancel in pairs)
     central bright band: from −λD/a to +λD/a, width 2λD/a
     secondary bright bands near a sin θ ≈ (n + ½)λ, much fainter
   Intensity (Fraunhofer, far screen):  I = I₀ (sin b / b)²,  b = π a y / λD.
   Its secondary peaks are about 4.7 %, 1.6 %, 0.8 % of the centre.
   "Compare" adds two slits of the same width, d = 4a apart:
     I = cos²(π d y / λD) · (sin b / b)²  — the fringes of width λD/d
   sit inside the single-slit envelope.
   The drawing at the left is not to scale; the screen strip is.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var LGRID = [];
  for (var l0 = 400; l0 <= 700; l0 += 10) LGRID.push(l0);
  var drag = false, cache = { key: '' }, offA = null, offB = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function spec(l) {
    var r = 0, g = 0, b = 0;
    if (l < 440) { r = (440 - l) / 60; b = 1; } else if (l < 490) { g = (l - 440) / 50; b = 1; }
    else if (l < 510) { g = 1; b = (510 - l) / 20; } else if (l < 580) { r = (l - 510) / 70; g = 1; }
    else if (l < 645) { r = 1; g = (645 - l) / 65; } else r = 1;
    var f = l < 420 ? 0.3 + 0.7 * (l - 380) / 40 : l > 680 ? 0.3 + 0.7 * (750 - l) / 70 : 1;
    return [r * f, g * f, b * f];
  }
  var WSUM = LGRID.reduce(function (s, l) { var c = spec(l); return [s[0] + c[0], s[1] + c[1], s[2] + c[2]]; }, [0, 0, 0]);
  function css(c, a) {
    return 'rgba(' + Math.round(255 * Math.min(1, c[0])) + ',' + Math.round(255 * Math.min(1, c[1])) + ',' + Math.round(255 * Math.min(1, c[2])) + ',' + (a == null ? 1 : a) + ')';
  }
  function lightCol(p) { return p.white ? [1, 1, 1] : spec(p.lam).map(function (v) { return Math.max(v, 0.25); }); }

  function single(p, y, lam) {
    var b = Math.PI * p.a * y * 1e3 / (lam * p.D);
    return Math.abs(b) < 1e-9 ? 1 : Math.pow(Math.sin(b) / b, 2);
  }
  function two(p, y, lam) { return Math.pow(Math.cos(Math.PI * 4 * p.a * y * 1e3 / (lam * p.D)), 2) * single(p, y, lam); }
  function colourAt(p, y, f) {
    if (!p.white) { var c = spec(p.lam), I = f(p, y, p.lam); return [c[0] * I, c[1] * I, c[2] * I, I]; }
    var r = 0, g = 0, b = 0, s = 0;
    LGRID.forEach(function (l) { var c = spec(l), I = f(p, y, l); r += c[0] * I; g += c[1] * I; b += c[2] * I; s += I; });
    return [r / WSUM[0], g / WSUM[1], b / WSUM[2], s / LGRID.length];
  }
  function y1(p, lam) { return lam * 1e-6 * p.D * 1e3 / p.a; } // first dark band, mm

  function geo(sim) {
    var W = sim.width, H = sim.height, small = W < 560, xs = Math.round(W * (small ? 0.52 : 0.56));
    var top = small ? 30 : 36, bot = H - 22, half = (bot - top) / 2, cy = top + half;
    var x0 = xs * 0.06, x2 = xs * 0.3, x3 = x2 + (0.35 + 0.65 * (sim.p.D - 0.5) / 2) * (xs * 0.93 - x2);
    var apx = 6 + (sim.p.a - 0.02) / 0.28 * half * 0.45;
    var lab = small ? 28 : 34, two = sim.p.compare, sx = xs + lab + 6, room = W - sx;
    var sw = Math.min(two ? 44 : 66, room * (two ? 0.24 : 0.4)), sw2 = two ? sw : 0;
    return { W: W, H: H, small: small, xs: xs, top: top, bot: bot, half: half, cy: cy, x0: x0, x2: x2, x3: x3, apx: apx,
      sx: sx, sw: sw, sx2: sx + sw + 4, sw2: sw2, cx0: sx + sw + (two ? sw2 + 4 : 0) + 8, cx1: W - 8, Y: parseFloat(sim.p.view) };
  }
  function yPx(g, y) { return g.cy - y / g.Y * g.half; }
  function probe(sim, g) { return M.clamp(sim.state.yP, -g.Y, g.Y); }
  function boost(p) { return p.boost ? 10 : 1; }

  function paint(off, p, g, n, f) {
    off.width = 1; off.height = n;
    var ctx = off.getContext('2d'), img = ctx.createImageData(1, n), I = [], k = boost(p);
    for (var j = 0; j < n; j++) {
      var y = g.Y - (j + 0.5) / n * 2 * g.Y, c = colourAt(p, y, f);
      for (var q = 0; q < 3; q++) img.data[j * 4 + q] = Math.round(255 * Math.pow(Math.min(1, c[q] * k), 1 / 2.2));
      img.data[j * 4 + 3] = 255; I.push(c[3]);
    }
    ctx.putImageData(img, 0, 0);
    return I;
  }
  function pattern(sim, g) {
    var p = sim.p, n = Math.max(2, Math.round(2 * g.half)), key = [n, g.Y, p.lam, p.a, p.D, p.white, p.compare, p.boost].join('|');
    if (cache.key === key) return cache;
    if (!offA) { offA = document.createElement('canvas'); offB = document.createElement('canvas'); }
    cache = { key: key, n: n, I: paint(offA, p, g, n, single), I2: p.compare ? paint(offB, p, g, n, two) : null };
    return cache;
  }

  function verdict(p, y) {
    var lam = p.white ? 550 : p.lam, m = Math.abs(p.a * y * 1e3 / (lam * p.D)), n = Math.round(m), pre = p.white ? 'for 550 nm: ' : '';
    if (m < 0.08) return pre + 'centre of the central bright band';
    if (m < 0.92) return pre + 'inside the central bright band';
    if (Math.abs(m - n) < 0.08) return pre + 'dark band ' + n + ': the slit splits into ' + 2 * n + ' parts that cancel in pairs';
    if (Math.abs(m - Math.floor(m) - 0.5) < 0.15) return pre + 'faint bright band ' + Math.floor(m) + ' (one part of the slit is left over)';
    return pre + 'between a dark and a faint bright band';
  }

  SimLab.createSim({
    ariaLabel: 'Single-slit diffraction: light passes through one narrow slit and spreads out, making a wide central bright band with faint bands on either side on a screen, shown to scale at the right with a brightness graph',
    autoplay: true,
    mobileAspect: '1 / 1',
    params: [
      { id: 'lam', label: 'Wavelength of the light λ', min: 400, max: 700, step: 5, value: 600, unit: 'nm',
        presets: [{ label: 'Violet 420', value: 420 }, { label: 'Blue 470', value: 470 }, { label: 'Green laser 532', value: 532 },
          { label: 'Sodium lamp 589', value: 589 }, { label: 'Red laser 650', value: 650 }] },
      { id: 'a', label: 'Width of the slit a', min: 0.02, max: 0.3, step: 0.01, value: 0.1, unit: 'mm' },
      { id: 'D', label: 'Distance to the screen D', min: 0.5, max: 2.5, step: 0.1, value: 1.5, unit: 'm' },
      { id: 'white', label: 'Use white light (all colours)', type: 'toggle', value: false },
      { id: 'boost', label: 'Show faint bands 10× brighter', type: 'toggle', value: false },
      { id: 'compare', label: 'Compare with two such slits (d = 4a)', type: 'toggle', value: false },
      { id: 'view', label: 'Screen strip shows', type: 'select', value: '20', options: [
        { value: '20', label: '±20 mm from the centre' }, { value: '5', label: '±5 mm (zoomed in)' }] }
    ],
    readouts: [
      { id: 'w', label: 'Width of the central bright band 2λD ÷ a', key: true },
      { id: 'y1', label: 'First dark bands at y = ±λD ÷ a' },
      { id: 'th', label: 'Angle to the first dark band θ = λ ÷ a' },
      { id: 'pd', label: 'Path difference between the slit edges a y ÷ D', key: true },
      { id: 'at', label: 'At P' },
      { id: 'I', label: 'Brightness at P (centre = 100)', unit: '%', digits: 1 }
    ],
    onParam: function () { return true; },
    reset: function (sim) { sim.state = { yP: 1.5 * y1(sim.p, sim.p.lam) }; },
    update: function () {},
    readout: function (sim) {
      var p = sim.p, g = geo(sim), y = probe(sim, g), lam = p.white ? 550 : p.lam, pd = p.a * y * 1e3 / p.D, th = lam / (p.a * 1e6);
      var pr = p.white ? ' (550 nm)' : '';
      return {
        w: p.white ? 'violet ' + M.fmt(2 * y1(p, 400), 1) + ' mm · red ' + M.fmt(2 * y1(p, 700), 1) + ' mm' : M.fmt(2 * y1(p, p.lam), 2) + ' mm',
        y1: '±' + M.fmt(y1(p, lam), 2) + ' mm' + pr,
        th: M.fmt(th * 1e3, 2) + ' × 10⁻³ rad = ' + M.fmt(M.deg(th), 3) + '°' + pr,
        pd: Math.round(Math.abs(pd)) + ' nm' + (p.white ? '' : ' = ' + M.fmt(Math.abs(pd) / p.lam, 2) + ' λ') + ' · P at ' + M.fmt(y, 2) + ' mm',
        at: verdict(p, y),
        I: 100 * colourAt(p, y, single)[3]
      };
    },
    status: function (sim) { return (sim.running ? 'Waves moving' : 'Paused') + ' · drag P along the screen'; },
    pointer: {
      down: function (sim, x, y) {
        var g = geo(sim); if (x < g.x3 - 18) return false;
        drag = true; sim.state.yP = M.clamp((g.cy - y) / g.half * g.Y, -g.Y, g.Y); sim.redraw(); return true;
      },
      move: function (sim, x, y) { if (!drag) return; var g = geo(sim); sim.state.yP = M.clamp((g.cy - y) / g.half * g.Y, -g.Y, g.Y); sim.redraw(); },
      up: function () { drag = false; },
      hover: function (sim, x) { return x > geo(sim).x3 - 18; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, g = geo(sim), W = g.W, H = g.H, fs = g.small ? 10 : 12;
      var col = lightCol(p), pat = pattern(sim, g), yP = probe(sim, g), py = yPx(g, yP), k = boost(p);
      D.clear(ctx, W, H, c.bg);

      // ---- the experiment in a dark room (not to scale) ----
      ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, g.xs, H);
      var lp = p.white ? 12 : 8 + (p.lam - 400) / 300 * 9, ph = reduce ? 0 : (sim.time * 22) % lp;
      for (var x = g.x0 + 14 + ph; x < g.x2; x += lp) D.line(ctx, x, g.cy - g.half * 0.6, x, g.cy + g.half * 0.6, css(col, 0.4), 1.5);
      // waves after the slit, drawn brighter in the directions that get more light
      ctx.save(); ctx.beginPath(); ctx.rect(g.x2, 0, g.x3 - g.x2, H); ctx.clip(); ctx.lineWidth = 1.6;
      var len = g.x3 - g.x2, lamD = p.white ? 550 : p.lam;
      for (var r = ph + 3; r < len * 1.3; r += lp) {
        for (var s = -36; s < 36; s++) {
          var a0 = s / 36 * 1.3, a1 = (s + 1) / 36 * 1.3, am = (a0 + a1) / 2;
          var ys = -Math.tan(am) * len / g.half * g.Y, I = Math.min(1, single(p, ys, lamD) * k);
          if (I < 0.01) continue;
          ctx.strokeStyle = css(col, 0.6 * Math.sqrt(I) * (1 - 0.5 * r / (len * 1.3)));
          ctx.beginPath(); ctx.arc(g.x2, g.cy, r, a0, a1); ctx.stroke();
        }
      }
      ctx.restore();
      D.circle(ctx, g.x0, g.cy, g.small ? 7 : 9, css(col), '#fff', 1.5);
      var bc = '#94a3b8', sTop = g.cy - g.apx / 2, sBot = g.cy + g.apx / 2;
      D.line(ctx, g.x2, g.top, g.x2, sTop, bc, 3); D.line(ctx, g.x2, sBot, g.x2, g.bot, bc, 3);
      // screen with its pattern
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(offA, g.x3, g.top, 6, g.bot - g.top); ctx.restore();
      D.line(ctx, g.x3 + 7, g.top, g.x3 + 7, g.bot, bc, 2);
      // rays from the two edges to P, and their path difference
      var P = { x: g.x3, y: py }, A = { x: g.x2, y: sTop }, B = { x: g.x2, y: sBot };
      D.line(ctx, A.x, A.y, P.x, P.y, 'rgba(253,224,71,0.9)', 1.4, [5, 4]);
      D.line(ctx, B.x, B.y, P.x, P.y, 'rgba(253,224,71,0.9)', 1.4, [5, 4]);
      var ux = P.x - B.x, uy = P.y - B.y, L = Math.hypot(ux, uy); ux /= L; uy /= L;
      var t = (A.x - B.x) * ux + (A.y - B.y) * uy, fx = B.x + ux * t, fy = B.y + uy * t;
      if (Math.abs(t) > 3) { D.line(ctx, A.x, A.y, fx, fy, '#cbd5e1', 1, [2, 2]); D.line(ctx, B.x, B.y, fx, fy, '#fb923c', 3.5); }
      D.circle(ctx, P.x, P.y, 4.5, '#fde047', '#fff', 1.5);
      var lb = { color: '#fff', size: fs, weight: 700, bg: 'rgba(0,0,0,0.55)', pad: 2 };
      D.text(ctx, 'P', P.x - 8, P.y + (P.y < g.top + 14 ? 12 : -12), Object.assign({}, lb, { align: 'right' }));
      D.text(ctx, 'O', g.x3 - 8, g.cy, Object.assign({}, lb, { align: 'right', color: '#cbd5e1' }));
      D.line(ctx, g.x3 - 3, g.cy, g.x3 + 9, g.cy, '#cbd5e1', 1);
      D.line(ctx, g.x2 - 7, sTop, g.x2 - 7, sBot, '#f9a8d4', 1.5);
      D.text(ctx, 'a', g.x2 - 11, g.cy, { color: '#f9a8d4', size: fs, weight: 800, align: 'right' });
      var ay = g.bot + 10;
      D.arrow(ctx, (g.x2 + g.x3) / 2, ay, g.x2, ay, '#cbd5e1', 1.2, 6); D.arrow(ctx, (g.x2 + g.x3) / 2, ay, g.x3, ay, '#cbd5e1', 1.2, 6);
      D.text(ctx, 'D = ' + M.fmt(p.D, 1) + ' m', (g.x2 + g.x3) / 2, ay, { color: '#fff', size: g.small ? 9 : 11, weight: 700, align: 'center', bg: '#0b1020', pad: 2 });
      D.text(ctx, g.small ? 'One slit (not to scale)' : 'Light through one slit (drawing not to scale)', g.xs / 2, 14,
        { color: '#0b1020', bg: '#fde047', size: g.small ? 10.5 : 12.5, weight: 700, align: 'center', pad: 3, fit: g.xs });
      if (!g.small) D.text(ctx, 'orange = edge path difference', g.x2 + 4, g.top + 8, { color: '#fb923c', size: 10.5, weight: 700 });

      // ---- the screen, to scale ----
      D.text(ctx, g.small ? 'Screen' : 'Screen (to scale)', (g.xs + W) / 2, 14, { color: c.text, size: g.small ? 10.5 : 12.5, weight: 700, align: 'center' });
      [[offA, g.sx, g.sw, '1 slit'], p.compare ? [offB, g.sx2, g.sw2, '2 slits'] : null].forEach(function (s) {
        if (!s) return;
        ctx.fillStyle = '#000'; ctx.fillRect(s[1], g.top, s[2], g.bot - g.top);
        ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(s[0], s[1], g.top, s[2], g.bot - g.top); ctx.restore();
        D.roundRect(ctx, s[1], g.top, s[2], g.bot - g.top, 2, null, c.border, 1);
        if (p.compare) D.text(ctx, s[3], s[1] + s[2] / 2, g.bot + 11, { color: c.muted, size: g.small ? 8.5 : 10, align: 'center' });
      });
      var st = g.Y > 10 ? 10 : 1;
      for (var v = -g.Y; v <= g.Y + 1e-9; v += st) {
        var ty = yPx(g, v);
        D.line(ctx, g.sx - 5, ty, g.sx, ty, c.muted, 1);
        D.text(ctx, (v > 0 ? '+' : '') + Math.round(v), g.sx - 7, ty, { color: c.muted, size: g.small ? 9 : 10.5, align: 'right' });
      }
      D.text(ctx, 'mm', g.sx - 7, g.bot + 11, { color: c.muted, size: g.small ? 9 : 10.5, align: 'right' });
      // brightness graph (clipped at 100 % when boosted)
      var gw = g.cx1 - g.cx0;
      D.line(ctx, g.cx0, g.top, g.cx0, g.bot, c.border, 1);
      function plot(arr, colr, dash, lw) {
        ctx.save(); ctx.strokeStyle = colr; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.beginPath();
        arr.forEach(function (I, j) { var x = g.cx0 + Math.min(1, I * k) * gw, y = g.top + (j + 0.5) / pat.n * (g.bot - g.top); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke(); ctx.restore();
      }
      if (pat.I2) plot(pat.I2, c.s2, null, 1.2);
      plot(pat.I, p.white ? c.text : css(spec(p.lam).map(function (q) { return Math.max(q, 0.3); })), null, 2);
      D.text(ctx, k > 1 ? (g.small ? '×10' : 'brightness ×10') : 'brightness', (g.cx0 + g.cx1) / 2, g.bot + 11, { color: c.muted, size: g.small ? 9 : 10.5, align: 'center', fit: W });
      // first dark bands
      var yd = y1(p, p.white ? 550 : p.lam);
      [-yd, yd].forEach(function (q) { if (Math.abs(q) < g.Y) D.line(ctx, g.cx0, yPx(g, q), g.cx1, yPx(g, q), c.muted, 1, [2, 3]); });
      var pc = c.light ? '#ca8a04' : '#fde047';
      D.line(ctx, g.sx - 2, py, g.cx1, py, pc, 1.5, [4, 3]);
      D.circle(ctx, g.sx + g.sw / 2, py, 5, null, pc, 2);
      D.text(ctx, 'P', g.cx1 - 2, py - 9, { color: c.text, size: fs, weight: 800, align: 'right' });
    }
  });
})();
