/* =====================================================================
   Human eye · Power of accommodation — sim.js
   ---------------------------------------------------------------------
   A simple "reduced eye": one lens, retina a fixed 2.3 cm behind it.
   Light from a point at distance d reaches the eye with vergence
     V = −100/d  dioptres (d in cm; negative = spreading out).
   To focus on the retina the eye needs total power
     P_needed = 100/2.3 − V = 43.5 D + 100/d.
   The ciliary muscles can change the lens power only between
     P_relaxed (= 43.5 D, far point at infinity for a normal eye)
     P_max     = P_relaxed + A, where A is the amplitude of accommodation.
   The near point is 100/A cm (A = 4 D gives 25 cm).
   If P_needed is out of range the eye uses the nearest power it can,
   and light meets on a point in front of or behind the retina:
     image vergence  Vi = V + P,  rays reach the retina at a fraction
     (1 − 2.3·Vi/100) of their height at the lens → a blur circle.
   The drawing is schematic: distances outside the eye use a log scale.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var VR = 2.3, P0 = 100 / VR, PUPIL = 4, DMIN = 5, DMAX = 600, drag = false;
  var EYES = { adult: 4, child: 12, older: 1 };

  function eyeState(p) {
    var A = EYES[p.eye], V = -100 / p.d, need = P0 - V;
    var P = M.clamp(need, P0, P0 + A), Vi = V + P, f = 1 - VR * Vi / 100;
    // frac: where the rays reach the retina, drawn 3× larger so the blur is visible
    return { A: A, V: V, need: need, P: P, Vi: Vi, frac: 3 * f, blur: PUPIL * Math.abs(f), near: 100 / A,
      ok: Math.abs(need - P) < 0.05, effort: (P - P0) / A };
  }
  function fitSize(ctx, str, size, maxW, weight) {
    ctx.font = weight + ' ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 8.5 && ctx.measureText(str).width > maxW) { size -= 0.5; ctx.font = weight + ' ' + size + 'px Inter, system-ui, sans-serif'; }
    return size;
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560;
    var eyeR = Math.min(narrow ? W * 0.2 : W * 0.13, (H - 120) * 0.36);
    var cx = W - eyeR - 14, y0 = narrow ? H * 0.58 : H * 0.55;
    var lx = cx - eyeR * 0.55, rx = cx + eyeR * 0.95;
    return { W: W, H: H, narrow: narrow, eyeR: eyeR, cx: cx, y0: y0, lx: lx, rx: rx,
      xL: 24, xR: lx - eyeR * 0.75 - 18, ap: eyeR * 0.32 };
  }
  function dToX(L, d) { var t = (Math.log(DMAX) - Math.log(d)) / (Math.log(DMAX) - Math.log(DMIN)); return L.xL + (L.xR - L.xL) * t; }
  function xToD(L, x) { var t = M.clamp((x - L.xL) / (L.xR - L.xL), 0, 1); return Math.exp(Math.log(DMAX) - t * (Math.log(DMAX) - Math.log(DMIN))); }

  // Shared eye drawing: eyeball, cornea, iris, lens bulging with power, ciliary muscles, retina
  function drawEye(ctx, L, c, bulge, tense) {
    var R = L.eyeR, cx = L.cx, y0 = L.y0;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, y0, R, 0, Math.PI * 2); ctx.fillStyle = D.alpha(c.surface2, 0.9); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = c.border; ctx.stroke();
    // cornea bulge
    ctx.beginPath(); ctx.arc(cx - R * 0.62, y0, R * 0.48, Math.PI * 0.62, Math.PI * 1.38); ctx.strokeStyle = D.alpha(c.s1, 0.8); ctx.lineWidth = 2; ctx.stroke();
    // retina (back of the eye)
    ctx.beginPath(); ctx.arc(cx, y0, R - 3, -Math.PI * 0.42, Math.PI * 0.42); ctx.strokeStyle = c.danger; ctx.lineWidth = 4; ctx.stroke();
    // iris
    D.line(ctx, L.lx, y0 - R * 0.62, L.lx, y0 - L.ap * 1.15, c.s4, 4);
    D.line(ctx, L.lx, y0 + R * 0.62, L.lx, y0 + L.ap * 1.15, c.s4, 4);
    // lens
    var h = R * 0.5, w = R * (0.09 + 0.13 * bulge);
    ctx.beginPath(); ctx.ellipse(L.lx + R * 0.08, y0, w, h, 0, 0, Math.PI * 2);
    ctx.fillStyle = D.alpha(c.s1, 0.28); ctx.fill(); ctx.strokeStyle = c.s1; ctx.lineWidth = 2; ctx.stroke();
    // ciliary muscles: pulled out when relaxed, bunched up when contracted
    var mw = R * (0.12 + 0.1 * tense), col = tense > 0.05 ? c.warning : c.muted;
    [-1, 1].forEach(function (s) {
      D.roundRect(ctx, L.lx + R * 0.08 - mw / 2, y0 + s * (h + 6) - (s < 0 ? 10 : 0), mw, 10, 3, D.alpha(col, 0.8));
    });
    ctx.restore();
    D.text(ctx, 'retina', L.rx - 4, y0 - R * 0.86, { color: c.danger, size: 10.5, weight: 700, align: 'center' });
    D.text(ctx, 'ciliary muscles ' + (tense > 0.05 ? 'contracted' : 'relaxed'), L.lx + R * 0.1, y0 + R + 14, { color: col, size: 10.5, weight: 600, align: 'center', fit: L.W });
  }

  // "What you see" panel: an eye-chart card blurred by the blur circle
  function drawView(ctx, x, y, w, h, c, blurMm) {
    D.roundRect(ctx, x, y, w, h, 8, '#f8fafc', c.border, 1);
    var px = M.clamp(blurMm * 55, 0, 12), size = Math.min(h * 0.42, w * 0.22);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var tx = x + w / 2, ty = y + h * 0.42;
    if (px < 0.3) { ctx.fillStyle = '#0f172a'; ctx.fillText('E F P', tx, ty); }
    else if ('filter' in ctx) { ctx.filter = 'blur(' + px.toFixed(1) + 'px)'; ctx.fillStyle = '#0f172a'; ctx.fillText('E F P', tx, ty); ctx.filter = 'none'; }
    else { // fallback: smear copies around a circle
      ctx.fillStyle = 'rgba(15,23,42,0.13)';
      for (var k = 0; k < 12; k++) { var a = k * Math.PI / 6; ctx.fillText('E F P', tx + Math.cos(a) * px, ty + Math.sin(a) * px); }
    }
    ctx.restore();
    D.text(ctx, px < 0.3 ? 'what you see: sharp' : 'what you see: blurred', x + w / 2, y + h - 11, { color: px < 0.3 ? '#15803d' : '#b45309', size: 10, weight: 700, align: 'center' });
  }

  SimLab.createSim({
    ariaLabel: 'Side view of a human eye looking at a small object. The eye lens gets thicker for near objects. Rays from the object meet on the retina when the object is in focus.',
    transport: false,
    mobileAspect: '4 / 5',
    params: [
      { id: 'd', label: 'Object distance from the eye', min: DMIN, max: DMAX, step: 1, value: 100, unit: 'cm',
        presets: [{ label: '10 cm', value: 10 }, { label: '25 cm', value: 25 }, { label: '1 m', value: 100 }, { label: '6 m (far)', value: 600 }],
        help: 'You can also drag the object. The scale outside the eye is squashed (logarithmic).' },
      { id: 'eye', label: 'Whose eye?', type: 'select', value: 'adult', options: [
        { value: 'adult', label: 'Young adult (near point 25 cm)' },
        { value: 'child', label: 'Child, about 10 years (near point ≈ 8 cm)' },
        { value: 'older', label: 'Older person, about 60 (near point 1 m)' }] }
    ],
    readouts: [
      { id: 'd', label: 'Object distance', unit: 'cm', digits: 0 },
      { id: 'need', label: 'Power needed', unit: 'D', digits: 2 },
      { id: 'P', label: 'Eye lens power used', unit: 'D', digits: 2, key: true },
      { id: 'f', label: 'Focal length of the eye', unit: 'cm', digits: 3 },
      { id: 'near', label: 'Near point', unit: 'cm', digits: 0 },
      { id: 'A', label: 'Power of accommodation', unit: 'D', digits: 1 },
      { id: 'focus', label: 'Image on the retina?' }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var s = eyeState(sim.p);
      return { d: sim.p.d, need: s.need, P: s.P, f: 100 / s.P, near: s.near, A: s.A,
        focus: s.ok ? 'Yes: sharp' : 'No: rays meet behind the retina (too close)' };
    },
    pointer: {
      down: function (sim, x, y) { var L = layout(sim); drag = Math.abs(x - dToX(L, sim.p.d)) < 26 && Math.abs(y - L.y0) < 40; return drag; },
      move: function (sim, x) { if (!drag) return; sim.setParam('d', Math.round(xToD(layout(sim), x))); },
      up: function () { drag = false; },
      hover: function (sim, x, y) { var L = layout(sim); return Math.abs(x - dToX(L, sim.p.d)) < 26 && Math.abs(y - L.y0) < 40; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, s = eyeState(p);
      D.clear(ctx, W, H, c.bg);

      var head = 'P needed = 43.5 D + 100/d = 43.5 + 100/' + M.fmt(p.d, 0) + ' = ' + M.fmt(s.need, 1) + ' D';
      D.text(ctx, head, W / 2, 15, { color: c.bg, bg: c.s3, size: fitSize(ctx, head, L.narrow ? 11.5 : 13, W - 24, 700), weight: 700, align: 'center', pad: 4, fit: W });

      // distance scale (log) with near point marker
      var ys = L.y0 + L.eyeR + 34;
      D.line(ctx, L.xL, ys, L.xR, ys, c.axis, 1);
      (L.narrow ? [10, 100, 600] : [10, 25, 100, 600]).forEach(function (d) {
        var x = dToX(L, d); D.line(ctx, x, ys - 4, x, ys + 4, c.axis, 1);
        D.text(ctx, d >= 100 ? d / 100 + ' m' : d + ' cm', x, ys + 13, { color: c.faint, size: 10, align: 'center', fit: W });
      });
      var nx = dToX(L, Math.max(DMIN, s.near));
      if (s.near <= DMAX) {
        ctx.save(); ctx.fillStyle = D.alpha(c.danger, 0.1); ctx.fillRect(nx, L.y0 - L.eyeR, L.xR + 12 - nx, L.eyeR * 2); ctx.restore();
        D.line(ctx, nx, L.y0 - L.eyeR, nx, ys, D.alpha(c.danger, 0.8), 1.3, [4, 4]);
        D.text(ctx, 'near point', nx, L.y0 - L.eyeR - 9, { color: c.danger, size: 10.5, weight: 700, align: 'center', fit: W });
        D.text(ctx, 'too close', (nx + L.xR) / 2, L.y0 + L.eyeR - 10, { color: D.alpha(c.danger, 0.9), size: 10, weight: 600, align: 'center' });
      }
      D.line(ctx, 8, L.y0, W - 8, L.y0, D.alpha(c.axis, 0.5), 1, [2, 4]);

      drawEye(ctx, L, c, (s.P - P0) / 12, s.effort);

      // rays from the object point through the lens to the retina
      var ox = dToX(L, p.d), lxx = L.lx + L.eyeR * 0.08, ret = L.rx - 3;
      [-1, -0.5, 0.5, 1].forEach(function (k) {
        var hy = L.y0 + k * L.ap, ry = L.y0 + k * L.ap * s.frac;
        D.line(ctx, ox, L.y0, lxx, hy, D.alpha(c.s2, 0.85), 1.6);
        D.line(ctx, lxx, hy, ret, ry, c.s2, 1.8);
      });
      if (s.frac > 0.003) {
        var ex = lxx + (ret - lxx) / (1 - s.frac); // where the rays would meet (behind the retina)
        D.circle(ctx, ex, L.y0, 3, D.alpha(c.warning, 0.9));
        D.line(ctx, ret, L.y0 - L.ap * s.frac, ret, L.y0 + L.ap * s.frac, c.warning, 4);
      } else D.circle(ctx, ret, L.y0, 4.5, c.success);

      // object
      D.circle(ctx, ox, L.y0, 6, c.text);
      D.text(ctx, '↔ drag', ox, L.y0 + 18, { color: c.faint, size: 10, align: 'center', fit: W });
      D.text(ctx, 'object', ox, L.y0 - 16, { color: c.text, size: 10.5, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.75), fit: W });

      // effort bar and view panel
      var bw = L.narrow ? W * 0.42 : 170, bx = 12, by = 36;
      D.text(ctx, 'Focusing effort', bx, by + 6, { color: c.muted, size: 10.5, weight: 600 });
      D.roundRect(ctx, bx, by + 14, bw, 10, 5, c.surface2, c.border, 1);
      D.roundRect(ctx, bx, by + 14, Math.max(4, bw * s.effort), 10, 5, s.ok ? c.s3 : c.danger);
      D.text(ctx, M.fmt(s.P - P0, 2) + ' of ' + M.fmt(s.A, 0) + ' D extra', bx, by + 36, { color: c.text, size: 10.5, weight: 600 });
      var vw = L.narrow ? W * 0.42 : 170, vh = L.narrow ? 62 : 72;
      drawView(ctx, W - vw - 12, 34, vw, vh, c, s.blur);

      var msg = s.ok ? (s.effort < 0.01 ? (L.narrow ? 'Far object: lens thin, sharp.' : 'Far object: lens thin, muscles relaxed. The image is sharp.') : (L.narrow ? 'Lens bulges for a near object: sharp.' : 'Near object: muscles contract, lens bulges, power rises. Sharp.'))
        : (L.narrow ? 'Inside the near point: blurred!' : 'Closer than the near point: even the thickest lens cannot focus it. Blurred!');
      D.text(ctx, msg, W / 2, H - 12, { color: s.ok ? c.success : c.danger, size: fitSize(ctx, msg, L.narrow ? 11 : 12.5, W - 16, 700), weight: 700, align: 'center', fit: W });
    }
  });
})();
