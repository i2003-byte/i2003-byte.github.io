/* =====================================================================
   Force and pressure · Pressure = Force ÷ Area — sim.js
   ---------------------------------------------------------------------
   The Class 8 brick-on-sand activity. A common brick (23 × 11 × 7 cm,
   3 kg) presses on sand with its weight  F = m g  (g = 9.8 m/s²).
       pressure  P = F ÷ A     (pascal, Pa = N/m²)
   The same brick on its smallest face presses about 3 times harder
   than on its largest face, so it sinks deeper. Stacking bricks raises
   F (and P) without changing the area.
   Sinking model: depth (mm) = P ÷ 300. Real sand is more complicated
   (it gets firmer as it is squeezed); this simple rule only shows that
   more pressure means a deeper dent.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var L = 23, B = 11, T = 7, MASS = 3, g = 9.8;
  var FACES = { // w: width seen from the front, h: height of one brick, area in cm²
    large: { name: 'Largest face (23 × 11 cm)', w: L, h: T, a: L * B },
    side: { name: 'Long side (23 × 7 cm)', w: L, h: B, a: L * T },
    end: { name: 'Smallest end (11 × 7 cm)', w: B, h: L, a: B * T }
  };
  var depth = 0; // current sinking depth (mm), eases towards the target

  function force(p) { return p.n * MASS * g; }
  function pressure(p, f) { return force(p) / ((f || FACES[p.face]).a * 1e-4); }
  function target(p) { return pressure(p) / 300; }

  SimLab.createSim({
    ariaLabel: 'Bricks resting on sand on different faces, sinking deeper when the pressure is higher, with a bar chart of pressure for each face',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'face', label: 'Brick rests on its', type: 'select', value: 'large', options: Object.keys(FACES).map(function (k) { return { value: k, label: FACES[k].name }; }) },
      { id: 'n', label: 'Bricks in the stack', min: 1, max: 4, step: 1, value: 1,
        format: function (v) { return v + (v === 1 ? ' brick' : ' bricks') + ' (' + M.fmt(v * MASS * g, 1) + ' N)'; } },
      { id: 'arrows', label: 'Show pressure arrows', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'F', label: 'Force (weight) F = m g', unit: 'N', digits: 1 },
      { id: 'A', label: 'Area in contact A', unit: 'cm²', digits: 0 },
      { id: 'Am', label: 'Area in m²', unit: 'm²', digits: 4 },
      { id: 'P', label: 'Pressure P = F ÷ A', unit: 'Pa', digits: 0, key: true },
      { id: 'd', label: 'Sinks into sand (model)', unit: 'mm', digits: 1 }
    ],
    onParam: function () { return true; },
    reset: function () {},
    animate: function (sim) { return Math.abs(depth - target(sim.p)) > 0.05; },
    readout: function (sim) {
      var p = sim.p, f = FACES[p.face];
      return { F: force(p), A: f.a, Am: f.a * 1e-4, P: pressure(p), d: target(p) };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, f = FACES[p.face];
      var tgt = target(p); depth += sim.reduceMotion ? tgt - depth : (tgt - depth) * 0.12;
      D.clear(ctx, W, H, c.bg);
      var wide = W >= 560, top = 30;
      var sc = wide ? { x: 0, y: top, w: W * 0.6, h: H - top } : { x: 0, y: top, w: W, h: (H - top) * 0.62 };

      // ----- scene: sand and the brick stack (to scale, cm) -----
      var stackH = f.h * p.n, k = Math.min((sc.w - 40) / 40, (sc.h - 60) / (L * 4 + 14));
      var sandY = sc.y + sc.h - Math.max(34, sc.h * 0.2), cx = sc.x + sc.w / 2;
      var dpx = depth / 10 * k, bw = f.w * k;
      // sand with a dent and small mounds either side
      ctx.save(); ctx.fillStyle = c.light ? '#e9c98f' : '#b08850'; ctx.beginPath();
      ctx.moveTo(sc.x, sandY); ctx.lineTo(cx - bw / 2 - dpx * 2.5, sandY);
      ctx.quadraticCurveTo(cx - bw / 2 - dpx, sandY - dpx * 0.8, cx - bw / 2, sandY + dpx);
      ctx.lineTo(cx + bw / 2, sandY + dpx);
      ctx.quadraticCurveTo(cx + bw / 2 + dpx, sandY - dpx * 0.8, cx + bw / 2 + dpx * 2.5, sandY);
      ctx.lineTo(sc.x + sc.w, sandY); ctx.lineTo(sc.x + sc.w, sc.y + sc.h); ctx.lineTo(sc.x, sc.y + sc.h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; var rr = M.rng(7);
      for (var i = 0; i < 70; i++) ctx.fillRect(sc.x + rr() * sc.w, sandY + 6 + rr() * (sc.y + sc.h - sandY - 8), 2, 2);
      ctx.restore();
      // bricks
      for (var j = 0; j < p.n; j++) {
        var by = sandY + dpx - (j + 1) * f.h * k;
        D.roundRect(ctx, cx - bw / 2, by, bw, f.h * k - 1, 2, '#b4532a', '#7c2d12', 1.5);
        ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(cx - bw / 2 + 3, by + f.h * k * 0.5); ctx.lineTo(cx + bw / 2 - 3, by + f.h * k * 0.5); ctx.stroke(); ctx.restore();
      }
      var stackTop = sandY + dpx - stackH * k;
      D.arrow(ctx, cx, stackTop - 36, cx, stackTop - 4, c.danger, 3, 10);
      D.text(ctx, 'F = ' + M.fmt(force(p), 1) + ' N', cx + 10, stackTop - 26, { color: c.danger, size: 12, weight: 700, fit: W });
      if (p.arrows) { // pressure arrows under the contact face: longer when P is bigger
        var Pmax = 4 * MASS * g / (B * T * 1e-4), len = 8 + 34 * pressure(p) / Pmax, na = Math.max(2, Math.round(bw / 14));
        for (i = 0; i < na; i++) {
          var ax = cx - bw / 2 + bw * (i + 0.5) / na, ay = sandY + dpx + 2;
          D.arrow(ctx, ax, ay, ax, ay + len, c.warning, 2, 7);
        }
      }
      D.text(ctx, 'sand', sc.x + 12, sc.y + sc.h - 10, { color: c.light ? '#78350f' : '#fde68a', size: 11, weight: 600 });
      D.text(ctx, 'dent ' + M.fmt(depth, 1) + ' mm', cx + bw / 2 + dpx * 2.5 + 6, sandY - 10, { color: c.text, size: 11, weight: 600, fit: W });

      // ----- panel: footprint and pressure on each face -----
      var px = wide ? W * 0.62 : 14, py = wide ? top + 12 : sc.y + sc.h + 14, pw = wide ? W * 0.36 : W - 28, ph = wide ? H - py - 10 : H - py - 8;
      D.text(ctx, 'Pressure on each face (' + p.n + (p.n === 1 ? ' brick' : ' bricks') + ')', px, py, { color: c.text, size: 12, weight: 700, fit: W });
      var keys = Object.keys(FACES), Pm = 4 * MASS * g / (B * T * 1e-4), rowH = Math.min(46, (ph - 20) / 3);
      keys.forEach(function (key, idx) {
        var ff = FACES[key], P = pressure(p, ff), y = py + 18 + idx * rowH, cur = key === p.face;
        var fw = ff.w, fh = key === 'large' ? B : T; // footprint in cm
        var fk = Math.min(2, (rowH - 16) / 11); // footprint scale (px per cm)
        D.roundRect(ctx, px, y + 4, fw * fk, fh * fk, 2, cur ? '#b4532a' : D.alpha('#b4532a', 0.35), cur ? c.text : null, 1.5);
        var bx = px + 23 * fk + 10, bwMax = pw - (bx - px) - 4;
        D.roundRect(ctx, bx, y + 4, Math.max(3, bwMax * P / Pm), 12, 3, cur ? c.warning : D.alpha(c.warning, 0.35));
        D.text(ctx, ff.a + ' cm² → ' + M.fmt(P, 0) + ' Pa', bx, y + 26, { color: cur ? c.text : c.muted, size: 11, weight: cur ? 700 : 500, fit: W });
      });

      var ratio = pressure(p, FACES.end) / pressure(p, FACES.large);
      var msg = p.face === 'end' ? 'Smallest area → biggest pressure → deepest dent' : p.face === 'large' ? 'Largest area → least pressure (' + M.fmt(ratio, 1) + '× less than on the end)' : 'Try the smallest end: same force, less area';
      D.text(ctx, msg, W / 2, 14, { color: p.face === 'end' ? c.warning : c.success, size: W < 560 ? 11 : 14, weight: 700, align: 'center', fit: W });
    }
  });
})();
