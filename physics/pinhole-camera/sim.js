/* =====================================================================
   Light · Pinhole Camera — sim.js
   ---------------------------------------------------------------------
   Light travels in straight lines, so rays from the top of an object
   pass through a tiny hole and land at the bottom of the screen: the
   image is upside down (turned through 180°). Similar triangles give
       image height h' = h × v ÷ u        (u: object to hole, v: hole to screen)
   A hole of diameter d lets each object point light a small patch
   (a blur circle) of diameter  b = d × (u + v) ÷ u  on the screen.
   Brightness on the screen grows with the hole's area and falls with
   distance:  E ∝ d² ÷ (u + v)²  (shown relative to d = 1 mm, u = 1 m,
   v = 20 cm). Diffraction through very small holes is ignored.
   The side view is drawn to true scale; the inset shows the screen
   (20 cm tall) as seen from behind the box.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var BOX = 20; // box / screen height in cm

  function blur(p) { return p.d / 10 * (p.u + p.v) / p.u; } // cm
  function brightness(p) { var r = (p.d / 1) * (120 / (p.u + p.v)); return r * r; }

  /* Object in local units: base at (0,0), top at (0,-1) (screen y grows down). */
  function drawObject(ctx, type, x, y, hPx, rot, alpha) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(Math.PI); ctx.scale(hPx, hPx); ctx.globalAlpha *= alpha == null ? 1 : alpha;
    if (type === 'candle') {
      ctx.fillStyle = '#f8fafc'; ctx.fillRect(-0.09, -0.68, 0.18, 0.68);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-0.09, -0.68, 0.05, 0.68);
      ctx.fillStyle = '#334155'; ctx.fillRect(-0.012, -0.74, 0.024, 0.06);
      var g = ctx.createRadialGradient(0, -0.8, 0.01, 0, -0.84, 0.16);
      g.addColorStop(0, '#fffbeb'); g.addColorStop(0.45, '#fcd34d'); g.addColorStop(1, 'rgba(249,115,22,0.9)');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(0, -1); ctx.quadraticCurveTo(0.11, -0.8, 0.07, -0.74); ctx.quadraticCurveTo(0, -0.7, -0.07, -0.74); ctx.quadraticCurveTo(-0.11, -0.8, 0, -1);
      ctx.fill();
    } else { // glowing letter F on a board
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-0.3, -1, 0.16, 1);      // upright
      ctx.fillRect(-0.3, -1, 0.62, 0.16);   // top bar
      ctx.fillRect(-0.3, -0.58, 0.46, 0.15); // middle bar
    }
    ctx.restore();
  }

  SimLab.createSim({
    ariaLabel: 'Side view of a lit object, a pinhole box and its screen, with an inset showing the upside-down image on the screen',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'obj', label: 'Object', type: 'select', value: 'candle', options: [
        { value: 'candle', label: 'Candle flame' }, { value: 'F', label: 'Lit letter F' }] },
      { id: 'u', label: 'Object to pinhole (u)', min: 20, max: 200, step: 5, value: 100, unit: 'cm' },
      { id: 'v', label: 'Pinhole to screen (v, box length)', min: 5, max: 40, step: 1, value: 20, unit: 'cm' },
      { id: 'h', label: 'Object height (h)', min: 5, max: 40, step: 1, value: 20, unit: 'cm' },
      { id: 'd', label: 'Pinhole diameter (d)', min: 0.5, max: 10, step: 0.5, value: 1, unit: 'mm',
        presets: [{ label: 'Pin prick', value: 0.5 }, { label: 'Pencil hole', value: 5 }, { label: 'Wide', value: 10 }] },
      { id: 'rays', label: 'Show light rays', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'hi', label: "Image height h' = h × v ÷ u", unit: 'cm', digits: 1, key: true },
      { id: 'm', label: 'Magnification v ÷ u', digits: 2 },
      { id: 'way', label: 'Image is' },
      { id: 'b', label: 'Blur patch size', unit: 'mm', digits: 1 },
      { id: 'E', label: 'Brightness (relative)', digits: 2 }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var p = sim.p, hi = p.h * p.v / p.u;
      return { hi: hi, m: p.v / p.u, way: 'Upside down', b: blur(p) * 10, E: brightness(p) };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p;
      D.clear(ctx, W, H, c.bg);
      var wide = W >= 560, top = 30;
      // regions: side view and inset
      var sv = wide ? { x: 12, y: top, w: W * 0.64 - 18, h: H - top - 12 } : { x: 10, y: top, w: W - 20, h: (H - top) * 0.5 };
      var inS = wide ? Math.min(W * 0.36 - 30, H - top - 60) : Math.min(W - 60, (H - top) * 0.5 - 50);
      var inX = wide ? W * 0.64 + (W * 0.36 - inS) / 2 - 4 : (W - inS) / 2, inY = wide ? top + 26 + (H - top - 60 - inS) / 2 : sv.y + sv.h + 30;

      // ----- side view (true scale) -----
      var hi = p.h * p.v / p.u, tall = Math.max(p.h, BOX, hi) * 1.15;
      var k = Math.min((sv.w - 30) / (p.u + p.v + 4), (sv.h - 26) / tall);
      var x0 = sv.x + (sv.w - (p.u + p.v + 4) * k) / 2 + 8, axisY = sv.y + sv.h / 2 - 4;
      function X(cm) { return x0 + cm * k; } function Y(cm) { return axisY - cm * k; }
      var xo = X(0), xh = X(p.u), xs = X(p.u + p.v), half = p.d / 20 * k; // hole half-size (px, true scale)
      var holePx = Math.max(1.5, half);
      // box (dark inside)
      D.roundRect(ctx, xh, Y(BOX / 2), xs - xh, BOX * k, 3, c.light ? '#1e293b' : '#0b1020');
      ctx.save(); ctx.strokeStyle = c.border; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(xh, Y(BOX / 2)); ctx.lineTo(xs, Y(BOX / 2)); ctx.moveTo(xh, Y(-BOX / 2)); ctx.lineTo(xs, Y(-BOX / 2));
      ctx.moveTo(xh, Y(BOX / 2)); ctx.lineTo(xh, axisY - holePx); ctx.moveTo(xh, axisY + holePx); ctx.lineTo(xh, Y(-BOX / 2));
      ctx.stroke(); ctx.restore();
      D.line(ctx, xs, Y(BOX / 2), xs, Y(-BOX / 2), '#e2e8f0', 3); // tracing-paper screen
      D.line(ctx, X(-2), axisY, xs + 6, axisY, c.grid, 1, [4, 4]);
      // rays: from the object's top and bottom through the hole
      var topCol = p.obj === 'candle' ? '#fbbf24' : '#f59e0b', botCol = c.s1;
      if (p.rays) {
        [[p.h / 2, topCol], [-p.h / 2, botCol]].forEach(function (r) {
          var sy = Y(r[0]), ey = axisY + (axisY - sy) * p.v / p.u, spread = half * (p.u + p.v) / p.u;
          ctx.save(); ctx.fillStyle = D.alpha(r[1], 0.18); ctx.beginPath();
          ctx.moveTo(xo, sy); ctx.lineTo(xs, ey - spread); ctx.lineTo(xs, ey + spread); ctx.closePath(); ctx.fill(); ctx.restore();
          D.line(ctx, xo, sy, xs, ey, r[1], 1.6);
          D.arrow(ctx, M.lerp(xo, xh, 0.45), M.lerp(sy, axisY, 0.45), M.lerp(xo, xh, 0.55), M.lerp(sy, axisY, 0.55), r[1], 1.6, 8);
        });
      }
      // object (centred on the axis) and its image on the screen
      drawObject(ctx, p.obj, xo, Y(-p.h / 2), p.h * k);
      ctx.save(); ctx.beginPath(); ctx.rect(xs - 6, Y(BOX / 2), 12, BOX * k); ctx.clip();
      D.line(ctx, xs, Y(-hi / 2), xs, Y(hi / 2), topCol, 4); D.circle(ctx, xs, Y(-hi / 2), 3, topCol);
      ctx.restore();
      D.text(ctx, 'object', xo, Y(-p.h / 2) + 12, { color: c.muted, size: 11, align: 'center', fit: W });
      D.text(ctx, 'pinhole', xh, Y(-BOX / 2) + 12, { color: c.muted, size: 11, align: 'center', fit: W });
      D.text(ctx, 'screen', xs, Y(BOX / 2) - 10, { color: c.muted, size: 11, align: 'center', fit: W });
      // distance labels
      var dy = Math.min(sv.y + sv.h - 4, Math.max(Y(-p.h / 2), Y(-BOX / 2)) + 26);
      D.arrow(ctx, (xo + xh) / 2, dy, xo + 2, dy, c.faint, 1, 6); D.arrow(ctx, (xo + xh) / 2, dy, xh - 2, dy, c.faint, 1, 6);
      D.text(ctx, 'u = ' + p.u + ' cm', (xo + xh) / 2, dy - 9, { color: c.text, size: 11, weight: 600, align: 'center', bg: c.bg, pad: 2, fit: W });
      D.text(ctx, 'v = ' + p.v, (xh + xs) / 2, Y(BOX / 2) - 22 > sv.y ? Y(BOX / 2) - 22 : Y(-BOX / 2) + 26, { color: c.text, size: 11, weight: 600, align: 'center', fit: W });

      // ----- inset: the screen seen from behind -----
      D.text(ctx, 'On the screen (seen from behind)', inX + inS / 2, inY - 14, { color: c.text, size: 12, weight: 600, align: 'center', fit: W });
      D.roundRect(ctx, inX - 4, inY - 4, inS + 8, inS + 8, 8, null, c.border, 2);
      ctx.save(); ctx.beginPath(); ctx.rect(inX, inY, inS, inS); ctx.clip();
      ctx.fillStyle = '#0a0d14'; ctx.fillRect(inX, inY, inS, inS);
      var s = inS / BOX, bpx = blur(p) * s, E = brightness(p);
      var n = bpx < 1 ? 1 : 14, glow = M.clamp(0.35 + 0.65 * Math.sqrt(Math.min(1, E)), 0.15, 1);
      for (var i = 0; i < n; i++) {
        var a = i * 2.39996, r = n === 1 ? 0 : bpx / 2 * Math.sqrt((i + 0.5) / n);
        // image is the object turned through 180°, centred on the axis
        drawObject(ctx, p.obj, inX + inS / 2 + Math.cos(a) * r, inY + inS / 2 - hi / 2 * s + Math.sin(a) * r, hi * s, true, glow * (n === 1 ? 1 : 2.2 / n));
      }
      ctx.restore();
      var tooBig = hi > BOX;
      D.text(ctx, tooBig ? 'Image is bigger than the screen' : "h' = " + M.fmt(hi, 1) + ' cm', inX + inS / 2, inY + inS + 16, { color: tooBig ? c.warning : c.muted, size: 11, align: 'center', fit: W });

      // headline
      var m = p.v / p.u, msg = 'Upside-down image, ' + (m < 0.95 ? M.fmt(1 / m, 1) + '× smaller' : m > 1.05 ? M.fmt(m, 1) + '× bigger' : 'same size') + (blur(p) > 0.5 ? ' and blurry' : ' and sharp');
      D.text(ctx, msg, W / 2, 14, { color: blur(p) > 0.5 ? c.warning : c.success, size: W < 560 ? 12 : 14, weight: 700, align: 'center', fit: W });
    }
  });
})();
