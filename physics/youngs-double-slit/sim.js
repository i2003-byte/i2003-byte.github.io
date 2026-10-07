/* =====================================================================
   Optics · Young's Double-Slit Experiment — sim.js
   ---------------------------------------------------------------------
   Light from one narrow slit S falls on two slits S₁, S₂ a distance d
   apart, so they act as coherent sources. On a screen a distance D away
   the point P at height y from the centre O gets two waves with path
   difference  S₂P − S₁P ≈ d·y ÷ D   (small angles, D ≫ d).
     bright:  d·y/D = nλ   →  yₙ = nλD/d
     dark:    d·y/D = (n + ½)λ
     fringe width  β = λD/d,  angular fringe width  θ = λ/d
   Intensity (two equal slits):  I = 4I₀ cos²(π d y / λD).
   With a real slit width a each slit also spreads light by diffraction,
   which multiplies the pattern by the envelope (sin b / b)², b = π a y / λD.
   Covering one slit leaves only that envelope at one quarter of the peak.
   White light: the pattern is summed over 400–700 nm.
   The drawing at the left is not to scale; the screen strip at the
   right is to scale (in mm).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var LGRID = [];
  for (var l0 = 400; l0 <= 700; l0 += 10) LGRID.push(l0);
  var drag = false, cache = { key: '' }, off = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // approximate colour of a wavelength (nm) as linear r, g, b in 0..1
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

  function slitA(p) { return p.a === 'ideal' ? 0 : parseFloat(p.a); }
  function env(p, y, lam) {
    var a = slitA(p); if (!a) return 1;
    var b = Math.PI * a * y * 1e3 / (lam * p.D);
    return Math.abs(b) < 1e-9 ? 1 : Math.pow(Math.sin(b) / b, 2);
  }
  // intensity at y (mm) for wavelength lam (nm); 1 = peak of the two-slit pattern
  function inten(p, y, lam) {
    if (p.cover) return 0.25 * env(p, y, lam);
    var del = Math.PI * p.d * y * 1e3 / (lam * p.D);
    return Math.pow(Math.cos(del), 2) * env(p, y, lam);
  }
  // linear colour and brightness at y
  function colourAt(p, y) {
    if (!p.white) { var c = spec(p.lam), I = inten(p, y, p.lam); return [c[0] * I, c[1] * I, c[2] * I, I]; }
    var r = 0, g = 0, b = 0, s = 0;
    LGRID.forEach(function (l) { var c = spec(l), I = inten(p, y, l); r += c[0] * I; g += c[1] * I; b += c[2] * I; s += I; });
    return [r / WSUM[0], g / WSUM[1], b / WSUM[2], s / LGRID.length];
  }
  function beta(p, lam) { return lam * 1e-6 * p.D * 1e3 / p.d; } // mm

  function geo(sim) {
    var W = sim.width, H = sim.height, small = W < 560, xs = Math.round(W * (small ? 0.56 : 0.6));
    var top = small ? 30 : 36, bot = H - 22, half = (bot - top) / 2, cy = top + half;
    var x0 = xs * 0.05, x1 = xs * 0.16, x2 = xs * 0.3;
    var x3 = x2 + (0.35 + 0.65 * (sim.p.D - 0.5) / 2) * (xs * 0.93 - x2);
    var dpx = 10 + (sim.p.d - 0.15) / 0.85 * half * 0.55;
    var lab = small ? 28 : 34, sx = xs + lab + 6, sw = Math.min(70, (W - sx) * 0.42);
    return { W: W, H: H, small: small, xs: xs, top: top, bot: bot, half: half, cy: cy, x0: x0, x1: x1, x2: x2, x3: x3,
      s1: { x: x2, y: cy - dpx / 2 }, s2: { x: x2, y: cy + dpx / 2 }, sx: sx, sw: sw, cx0: sx + sw + 8, cx1: W - 8, Y: parseFloat(sim.p.view) };
  }
  function yPx(g, y) { return g.cy - y / g.Y * g.half; }
  function probe(sim, g) { return M.clamp(sim.state.yP, -g.Y, g.Y); }

  // pattern image, one pixel row per screen pixel (cached)
  function pattern(sim, g) {
    var p = sim.p, n = Math.max(2, Math.round(2 * g.half)), key = [n, g.Y, p.lam, p.d, p.D, p.a, p.cover, p.white].join('|');
    if (cache.key === key) return cache;
    if (!off) off = document.createElement('canvas');
    off.width = 1; off.height = n;
    var ctx = off.getContext('2d'), img = ctx.createImageData(1, n), I = [];
    for (var j = 0; j < n; j++) {
      var y = g.Y - (j + 0.5) / n * 2 * g.Y, c = colourAt(p, y);
      for (var k = 0; k < 3; k++) img.data[j * 4 + k] = Math.round(255 * Math.pow(Math.min(1, c[k]), 1 / 2.2));
      img.data[j * 4 + 3] = 255; I.push(c[3]);
    }
    ctx.putImageData(img, 0, 0);
    cache = { key: key, n: n, I: I };
    return cache;
  }

  function verdict(p, y) {
    if (p.white) {
      var b5 = beta(p, 550);
      if (p.cover) return 'one slit only: no interference fringes';
      return Math.abs(y) < 0.12 * b5 ? 'central fringe: white (every colour is bright here)' : Math.abs(y) < 2.5 * b5 ? 'coloured fringe (each colour has its own β)' : 'colours overlap: the screen looks nearly evenly lit';
    }
    if (p.cover) return slitA(p) ? 'one slit only: just a broad diffraction patch' : 'one slit only: even light, no fringes';
    var m = p.d * y * 1e3 / (p.lam * p.D), fr = Math.abs(m - Math.round(m)), n = Math.abs(Math.round(m));
    if (env(p, y, p.lam) < 0.02) return 'dark: no light from either slit reaches here (diffraction minimum)';
    if (fr < 0.1) return n === 0 ? 'central bright fringe (n = 0)' : 'bright fringe, n = ' + n + ' (waves in step)';
    if (fr > 0.4) { var k = Math.floor(Math.abs(m)) + 1; return 'dark fringe number ' + k + ' (crest meets trough)'; }
    return 'between a bright and a dark fringe';
  }

  SimLab.createSim({
    ariaLabel: "Young's double-slit experiment: light passes through one slit and then two slits, the waves overlap and make bright and dark fringes on a screen, shown magnified at the right with a brightness graph",
    autoplay: true,
    mobileAspect: '1 / 1',
    params: [
      { id: 'lam', label: 'Wavelength of the light λ', min: 400, max: 700, step: 5, value: 600, unit: 'nm',
        presets: [{ label: 'Violet 420', value: 420 }, { label: 'Blue 470', value: 470 }, { label: 'Green laser 532', value: 532 },
          { label: 'Sodium lamp 589', value: 589 }, { label: 'Red laser 650', value: 650 }] },
      { id: 'd', label: 'Distance between the slits d', min: 0.15, max: 1, step: 0.05, value: 0.3, unit: 'mm' },
      { id: 'D', label: 'Distance to the screen D', min: 0.5, max: 2.5, step: 0.1, value: 1.5, unit: 'm' },
      { id: 'white', label: 'Use white light (all colours)', type: 'toggle', value: false },
      { id: 'cover', label: 'Cover slit S₁', type: 'toggle', value: false },
      { id: 'a', label: 'Width of each slit', type: 'select', value: 'ideal', options: [
        { value: 'ideal', label: 'Very narrow (ideal: all fringes equally bright)' },
        { value: '0.05', label: 'a = 0.05 mm (fringes fade further out)' },
        { value: '0.1', label: 'a = 0.1 mm (fade faster)' }] },
      { id: 'view', label: 'Screen strip shows', type: 'select', value: '10', options: [
        { value: '10', label: '±10 mm from the centre' }, { value: '3', label: '±3 mm (zoomed in)' }] }
    ],
    readouts: [
      { id: 'beta', label: 'Fringe width β = λD ÷ d', key: true },
      { id: 'theta', label: 'Angular fringe width θ = λ ÷ d' },
      { id: 'y', label: 'Height of P above the centre O', unit: 'mm', digits: 2 },
      { id: 'pd', label: 'Path difference S₂P − S₁P = y d ÷ D', key: true },
      { id: 'at', label: 'At P' },
      { id: 'I', label: 'Brightness at P (brightest fringe = 100)', unit: '%', digits: 0 }
    ],
    onParam: function () { return true; },
    reset: function (sim) { sim.state = { yP: beta(sim.p, sim.p.lam) }; },
    update: function () {},
    readout: function (sim) {
      var p = sim.p, g = geo(sim), y = probe(sim, g), lam = p.white ? 550 : p.lam, pd = p.d * y * 1e3 / p.D; // nm
      var th = lam / (p.d * 1e6);
      return {
        beta: p.white ? 'violet ' + M.fmt(beta(p, 400), 2) + ' mm · red ' + M.fmt(beta(p, 700), 2) + ' mm' : M.fmt(beta(p, p.lam), 2) + ' mm',
        theta: (p.white ? 'for 550 nm: ' : '') + M.fmt(th * 1e3, 2) + ' × 10⁻³ rad = ' + M.fmt(M.deg(th), 3) + '°',
        y: y,
        pd: Math.round(pd) + ' nm' + (p.white ? '' : ' = ' + M.fmt(pd / p.lam, 2) + ' λ'),
        at: verdict(p, y),
        I: 100 * colourAt(p, y)[3]
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
      var col = lightCol(p), pat = pattern(sim, g), yP = probe(sim, g), py = yPx(g, yP);
      D.clear(ctx, W, H, c.bg);

      // ---- the experiment in a dark room (not to scale) ----
      ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, g.xs, H);
      var lp = p.white ? 12 : 8 + (p.lam - 400) / 300 * 9, ph = reduce ? 0 : (sim.time * 22) % lp;
      // plane waves from the lamp to S
      for (var x = g.x0 + 12 + ph; x < g.x1; x += lp) D.line(ctx, x, g.cy - g.half * 0.35, x, g.cy + g.half * 0.35, css(col, 0.35), 1.5);
      // circular waves from S to the double slit
      ctx.save(); ctx.beginPath(); ctx.rect(g.x1, g.top - 4, g.x2 - g.x1, g.bot - g.top + 8); ctx.clip();
      ctx.strokeStyle = css(col, 0.45); ctx.lineWidth = 1.5;
      for (var r = ph + 2; r < g.x2 - g.x1 + lp; r += lp) { ctx.beginPath(); ctx.arc(g.x1, g.cy, r, -1.2, 1.2); ctx.stroke(); }
      ctx.restore();
      // circular waves from S1 and S2 to the screen
      ctx.save(); ctx.beginPath(); ctx.rect(g.x2, 0, g.x3 - g.x2, H); ctx.clip();
      [g.s1, g.s2].forEach(function (s, i) {
        if (i === 0 && p.cover) return;
        for (var rr = ph + 2; rr < (g.x3 - g.x2) * 1.25; rr += lp) {
          ctx.strokeStyle = css(col, 0.42 * (1 - 0.55 * rr / ((g.x3 - g.x2) * 1.25))); ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.arc(s.x, s.y, rr, -1.35, 1.35); ctx.stroke();
        }
      });
      ctx.restore();
      // lamp
      D.circle(ctx, g.x0, g.cy, g.small ? 7 : 9, css(col), '#fff', 1.5);
      // barriers
      var bc = '#94a3b8', gap = 3;
      D.line(ctx, g.x1, g.top, g.x1, g.cy - gap, bc, 3); D.line(ctx, g.x1, g.cy + gap, g.x1, g.bot, bc, 3);
      D.line(ctx, g.x2, g.top, g.x2, g.s1.y - gap, bc, 3); D.line(ctx, g.x2, g.s1.y + gap, g.x2, g.s2.y - gap, bc, 3); D.line(ctx, g.x2, g.s2.y + gap, g.x2, g.bot, bc, 3);
      if (p.cover) D.roundRect(ctx, g.x2 - 5, g.s1.y - 9, 10, 18, 2, '#475569', '#cbd5e1', 1);
      // screen with its pattern
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, g.x3, g.top, 6, g.bot - g.top); ctx.restore();
      D.line(ctx, g.x3 + 7, g.top, g.x3 + 7, g.bot, bc, 2);
      // rays to P and the path difference
      var P = { x: g.x3, y: py };
      D.line(ctx, g.s1.x, g.s1.y, P.x, P.y, 'rgba(253,224,71,0.9)', 1.4, [5, 4]);
      D.line(ctx, g.s2.x, g.s2.y, P.x, P.y, 'rgba(253,224,71,0.9)', 1.4, [5, 4]);
      if (!p.cover) {
        var ux = P.x - g.s2.x, uy = P.y - g.s2.y, L = Math.hypot(ux, uy); ux /= L; uy /= L;
        var t = (g.s1.x - g.s2.x) * ux + (g.s1.y - g.s2.y) * uy, fx = g.s2.x + ux * t, fy = g.s2.y + uy * t;
        if (Math.abs(t) > 3) {
          D.line(ctx, g.s1.x, g.s1.y, fx, fy, '#cbd5e1', 1, [2, 2]);
          D.line(ctx, g.s2.x, g.s2.y, fx, fy, '#fb923c', 3.5);
        }
      }
      D.circle(ctx, P.x, P.y, 4.5, '#fde047', '#fff', 1.5);
      // labels
      var lb = { color: '#fff', size: fs, weight: 700, bg: 'rgba(0,0,0,0.55)', pad: 2 };
      D.text(ctx, 'S', g.x1, g.cy - 14, Object.assign({}, lb, { align: 'center' }));
      D.text(ctx, 'S₁', g.x2 - 5, g.s1.y - 12, Object.assign({}, lb, { align: 'right' }));
      D.text(ctx, 'S₂', g.x2 - 5, g.s2.y + 12, Object.assign({}, lb, { align: 'right' }));
      D.text(ctx, 'P', P.x - 8, P.y + (P.y < g.top + 14 ? 12 : -12), Object.assign({}, lb, { align: 'right' }));
      D.text(ctx, 'O', g.x3 - 8, g.cy, Object.assign({}, lb, { align: 'right', color: '#cbd5e1' }));
      D.line(ctx, g.x3 - 3, g.cy, g.x3 + 9, g.cy, '#cbd5e1', 1);
      // d bracket and D arrow
      var bx = g.x2 + 7;
      D.line(ctx, bx, g.s1.y, bx, g.s2.y, '#f9a8d4', 1.5);
      D.text(ctx, 'd', bx + 4, g.cy, { color: '#f9a8d4', size: fs, weight: 800 });
      var ay = g.bot + 10;
      D.arrow(ctx, (g.x2 + g.x3) / 2, ay, g.x2, ay, '#cbd5e1', 1.2, 6); D.arrow(ctx, (g.x2 + g.x3) / 2, ay, g.x3, ay, '#cbd5e1', 1.2, 6);
      D.text(ctx, 'D = ' + M.fmt(p.D, 1) + ' m', (g.x2 + g.x3) / 2, ay, { color: '#fff', size: g.small ? 9 : 11, weight: 700, align: 'center', bg: '#0b1020', pad: 2 });
      D.text(ctx, g.small ? 'Double slit (not to scale)' : "Young's double slit (drawing not to scale)", g.xs / 2, 14,
        { color: '#0b1020', bg: '#fde047', size: g.small ? 10.5 : 12.5, weight: 700, align: 'center', pad: 3, fit: g.xs });
      if (!p.cover && !g.small) D.text(ctx, 'orange = path difference', g.x2 + 4, g.top + 8, { color: '#fb923c', size: 10.5, weight: 700 });

      // ---- the screen, magnified and to scale ----
      D.text(ctx, g.small ? 'Screen' : 'Screen (to scale)', (g.xs + W) / 2, 14, { color: c.text, size: g.small ? 10.5 : 12.5, weight: 700, align: 'center' });
      ctx.fillStyle = '#000'; ctx.fillRect(g.sx, g.top, g.sw, g.bot - g.top);
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, g.sx, g.top, g.sw, g.bot - g.top); ctx.restore();
      D.roundRect(ctx, g.sx, g.top, g.sw, g.bot - g.top, 2, null, c.border, 1);
      var st = g.Y > 5 ? 5 : 1;
      for (var v = -g.Y; v <= g.Y + 1e-9; v += st) {
        var ty = yPx(g, v);
        D.line(ctx, g.sx - 5, ty, g.sx, ty, c.muted, 1);
        D.text(ctx, (v > 0 ? '+' : '') + Math.round(v), g.sx - 7, ty, { color: c.muted, size: g.small ? 9 : 10.5, align: 'right' });
      }
      D.text(ctx, 'mm', g.sx - 7, g.bot + 11, { color: c.muted, size: g.small ? 9 : 10.5, align: 'right' });
      // brightness graph
      var gw = g.cx1 - g.cx0;
      D.line(ctx, g.cx0, g.top, g.cx0, g.bot, c.border, 1);
      if (slitA(p) && !p.white) {
        ctx.save(); ctx.strokeStyle = c.muted; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2; ctx.beginPath();
        for (var j0 = 0; j0 <= 120; j0++) {
          var yy = g.Y - j0 / 120 * 2 * g.Y, ex = g.cx0 + env(p, yy, p.lam) * (p.cover ? 0.25 : 1) * gw;
          if (j0) ctx.lineTo(ex, yPx(g, yy)); else ctx.moveTo(ex, yPx(g, yy));
        }
        ctx.stroke(); ctx.restore();
      }
      ctx.save(); ctx.strokeStyle = p.white ? c.text : css(spec(p.lam).map(function (q) { return Math.max(q, 0.3); })); ctx.lineWidth = 1.8; ctx.beginPath();
      pat.I.forEach(function (I, j) { var x = g.cx0 + I * gw, y = g.top + (j + 0.5) / pat.n * (g.bot - g.top); if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.stroke(); ctx.restore();
      D.text(ctx, 'brightness', (g.cx0 + g.cx1) / 2, g.bot + 11, { color: c.muted, size: g.small ? 9 : 10.5, align: 'center' });
      // P on the strip
      var pc = c.light ? '#ca8a04' : '#fde047';
      D.line(ctx, g.sx - 2, py, g.cx1, py, pc, 1.5, [4, 3]);
      D.circle(ctx, g.sx + g.sw / 2, py, 5, null, pc, 2);
      D.text(ctx, 'P', g.sx + g.sw + 2, py - 9, { color: c.text, size: fs, weight: 800 });
    }
  });
})();
