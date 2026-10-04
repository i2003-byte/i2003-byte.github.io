/* =====================================================================
   Human eye · Defects of vision and their correction — sim.js
   ---------------------------------------------------------------------
   Same "reduced eye" as eye-accommodation: one lens, retina 2.3 cm
   behind it, needed power P = 100/2.3 − V where V = −100/d dioptres is
   the vergence of the light arriving at the eye (d in cm).
   Myopia (short sight), far point FP:
     relaxed power  Pmin = 43.5 + 100/FP,  Pmax = Pmin + 4 D
     correction: concave lens, f = −FP  →  P = −100/FP
   Hypermetropia (long sight), near point NP:
     Pmax = 43.5 + 100/NP,  Pmin = Pmax − 4 D
     correction: convex lens that puts the image of an object at 25 cm
     at NP:  1/f = 1/25 − 1/NP  →  P = 4 − 100/NP
   With glasses (assumed touching the eye) V = −100/d + P_glasses.
   The eye uses the power closest to what it needs; image vergence
   Vi = V + P, and rays reach the retina at (1 − 2.3·Vi/100) of their
   height at the lens: + means they meet behind it, − in front of it.
   Distances outside the eye are drawn on a log scale.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var VR = 2.3, P0 = 100 / VR, PUPIL = 4, AMP = 4, DMIN = 5, DMAX = 600, drag = false;

  function state(p) {
    var myo = p.defect === 'myopia', Pmin, Pmax, Pg;
    if (myo) { Pmin = P0 + 100 / p.fp; Pmax = Pmin + AMP; Pg = -100 / p.fp; }
    else { Pmax = P0 + 100 / p.np; Pmin = Pmax - AMP; Pg = 4 - 100 / p.np; }
    var V0 = -100 / p.d, V = V0 + (p.glasses ? Pg : 0), need = P0 - V, P = M.clamp(need, Pmin, Pmax);
    var Vi = V + P, frac = 3 * (1 - VR * Vi / 100); // drawn 3× larger so the blur is visible
    return { myo: myo, Pmin: Pmin, Pmax: Pmax, Pg: Pg, V: V, need: need, P: P, frac: frac,
      blur: PUPIL * Math.abs(frac) / 3, ok: Math.abs(need - P) < 0.05,
      far: myo ? p.fp : Infinity, near: myo ? 100 / (100 / p.fp + AMP) : p.np };
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
    var lx = cx - eyeR * 0.55, rx = cx + eyeR * 0.95, gx = lx - eyeR * 0.75 - 4;
    return { W: W, H: H, narrow: narrow, eyeR: eyeR, cx: cx, y0: y0, lx: lx, rx: rx, gx: gx,
      xL: 24, xR: gx - 22, ap: eyeR * 0.32 };
  }
  function dToX(L, d) { var t = (Math.log(DMAX) - Math.log(M.clamp(d, DMIN, DMAX))) / (Math.log(DMAX) - Math.log(DMIN)); return L.xL + (L.xR - L.xL) * t; }
  function xToD(L, x) { var t = M.clamp((x - L.xL) / (L.xR - L.xL), 0, 1); return Math.exp(Math.log(DMAX) - t * (Math.log(DMAX) - Math.log(DMIN))); }

  function drawEye(ctx, L, c, bulge, tense) {
    var R = L.eyeR, cx = L.cx, y0 = L.y0;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, y0, R, 0, Math.PI * 2); ctx.fillStyle = D.alpha(c.surface2, 0.9); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = c.border; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - R * 0.62, y0, R * 0.48, Math.PI * 0.62, Math.PI * 1.38); ctx.strokeStyle = D.alpha(c.s1, 0.8); ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, y0, R - 3, -Math.PI * 0.42, Math.PI * 0.42); ctx.strokeStyle = c.danger; ctx.lineWidth = 4; ctx.stroke();
    D.line(ctx, L.lx, y0 - R * 0.62, L.lx, y0 - L.ap * 1.15, c.s4, 4);
    D.line(ctx, L.lx, y0 + R * 0.62, L.lx, y0 + L.ap * 1.15, c.s4, 4);
    var h = R * 0.5, w = R * (0.09 + 0.13 * M.clamp(bulge, 0, 1));
    ctx.beginPath(); ctx.ellipse(L.lx + R * 0.08, y0, w, h, 0, 0, Math.PI * 2);
    ctx.fillStyle = D.alpha(c.s1, 0.28); ctx.fill(); ctx.strokeStyle = c.s1; ctx.lineWidth = 2; ctx.stroke();
    var mw = R * (0.12 + 0.1 * tense), col = tense > 0.05 ? c.warning : c.muted;
    [-1, 1].forEach(function (s) { D.roundRect(ctx, L.lx + R * 0.08 - mw / 2, y0 + s * (h + 6) - (s < 0 ? 10 : 0), mw, 10, 3, D.alpha(col, 0.8)); });
    ctx.restore();
    D.text(ctx, 'retina', L.rx - 4, y0 - R * 0.86, { color: c.danger, size: 10.5, weight: 700, align: 'center' });
  }
  function drawView(ctx, x, y, w, h, c, blurMm) {
    D.roundRect(ctx, x, y, w, h, 8, '#f8fafc', c.border, 1);
    var px = M.clamp(blurMm * 55, 0, 12), size = Math.min(h * 0.42, w * 0.22);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var tx = x + w / 2, ty = y + h * 0.42;
    if (px < 0.3) { ctx.fillStyle = '#0f172a'; ctx.fillText('E F P', tx, ty); }
    else if ('filter' in ctx) { ctx.filter = 'blur(' + px.toFixed(1) + 'px)'; ctx.fillStyle = '#0f172a'; ctx.fillText('E F P', tx, ty); ctx.filter = 'none'; }
    else { ctx.fillStyle = 'rgba(15,23,42,0.13)'; for (var k = 0; k < 12; k++) { var a = k * Math.PI / 6; ctx.fillText('E F P', tx + Math.cos(a) * px, ty + Math.sin(a) * px); } }
    ctx.restore();
    D.text(ctx, px < 0.3 ? 'what you see: sharp' : 'what you see: blurred', x + w / 2, y + h - 11, { color: px < 0.3 ? '#15803d' : '#b45309', size: 10, weight: 700, align: 'center' });
  }

  SimLab.createSim({
    ariaLabel: 'Side view of an eye with myopia or hypermetropia looking at an object, with an optional corrective lens in front. Rays show whether the image falls in front of, on or behind the retina.',
    transport: false,
    mobileAspect: '4 / 5',
    params: [
      { id: 'defect', label: 'Defect of vision', type: 'select', value: 'myopia', options: [
        { value: 'myopia', label: 'Myopia (short-sightedness)' }, { value: 'hyper', label: 'Hypermetropia (long-sightedness)' }] },
      { id: 'd', label: 'Object distance from the eye', min: DMIN, max: DMAX, step: 1, value: 600, unit: 'cm',
        presets: [{ label: '25 cm (book)', value: 25 }, { label: '1 m', value: 100 }, { label: '6 m (blackboard)', value: 600 }],
        help: 'You can also drag the object. The scale outside the eye is logarithmic.' },
      { id: 'glasses', label: 'Wear corrective glasses', type: 'toggle', value: false },
      { id: 'fp', label: 'Far point (myopia)', min: 30, max: 300, step: 5, value: 100, unit: 'cm' },
      { id: 'np', label: 'Near point (hypermetropia)', min: 40, max: 200, step: 5, value: 100, unit: 'cm' }
    ],
    readouts: [
      { id: 'far', label: 'Far point of this eye', unit: 'cm', digits: 0 },
      { id: 'near', label: 'Near point of this eye', unit: 'cm', digits: 0 },
      { id: 'lens', label: 'Corrective lens' },
      { id: 'Pg', label: 'Power of the glasses', unit: 'D', digits: 2, key: true },
      { id: 'fg', label: 'Focal length of the glasses', unit: 'cm', digits: 1 },
      { id: 'focus', label: 'Image falls' }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var s = state(sim.p);
      var where = s.ok ? 'on the retina (sharp)' : s.frac < 0 ? 'in front of the retina (blurred)' : 'behind the retina (blurred)';
      return { far: s.myo ? s.far : '∞', near: s.near, lens: s.myo ? 'Concave (diverging)' : 'Convex (converging)',
        Pg: s.Pg, fg: 100 / s.Pg, focus: where };
    },
    pointer: {
      down: function (sim, x, y) { var L = layout(sim); drag = Math.abs(x - dToX(L, sim.p.d)) < 26 && Math.abs(y - L.y0) < 40; return drag; },
      move: function (sim, x) { if (!drag) return; sim.setParam('d', Math.round(xToD(layout(sim), x))); },
      up: function () { drag = false; },
      hover: function (sim, x, y) { var L = layout(sim); return Math.abs(x - dToX(L, sim.p.d)) < 26 && Math.abs(y - L.y0) < 40; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, s = state(p);
      D.clear(ctx, W, H, c.bg);
      var head = L.narrow ? (s.myo ? 'Myopia: concave lens, f = −' + p.fp + ' cm, P = ' + M.fmt(s.Pg, 2) + ' D' : 'Long sight: convex lens, P = 4 − 100/' + p.np + ' = +' + M.fmt(s.Pg, 2) + ' D') : s.myo ? 'Myopia: far point ' + p.fp + ' cm → concave lens, f = −' + p.fp + ' cm, P = ' + M.fmt(s.Pg, 2) + ' D'
        : 'Hypermetropia: near point ' + p.np + ' cm → convex lens, P = 4 − 100/' + p.np + ' = +' + M.fmt(s.Pg, 2) + ' D';
      D.text(ctx, head, W / 2, 15, { color: c.bg, bg: c.s3, size: fitSize(ctx, head, L.narrow ? 11.5 : 13, W - 24, 700), weight: 700, align: 'center', pad: 4, fit: W });

      // log distance scale, the range this eye can see clearly (without glasses)
      var ys = L.y0 + L.eyeR + 34;
      D.line(ctx, L.xL, ys, L.xR, ys, c.axis, 1);
      (L.narrow ? [10, 100, 600] : [10, 25, 100, 600]).forEach(function (d) {
        var x = dToX(L, d); D.line(ctx, x, ys - 4, x, ys + 4, c.axis, 1);
        D.text(ctx, d >= 100 ? d / 100 + ' m' : d + ' cm', x, ys + 13, { color: c.faint, size: 10, align: 'center', fit: W });
      });
      // on a short canvas the caption goes above the band, clear of the message
      var xa = s.myo ? dToX(L, s.far) : L.xL - 10, xb = dToX(L, s.near);
      ctx.save(); ctx.fillStyle = D.alpha(c.success, 0.14); ctx.fillRect(xa, ys - 7, xb - xa, 14); ctx.restore();
      D.text(ctx, 'clear without glasses', (Math.max(xa, L.xL) + xb) / 2, ys + 26 > H - 26 ? ys - 14 : ys + 26, { color: c.success, size: 10, weight: 700, align: 'center', fit: W });
      D.line(ctx, 8, L.y0, W - 8, L.y0, D.alpha(c.axis, 0.5), 1, [2, 4]);

      var tense = M.clamp((s.P - s.Pmin) / AMP, 0, 1);
      drawEye(ctx, L, c, (s.P - P0 + 4) / 12, tense);
      D.text(ctx, s.myo ? 'eye lens too strong / eyeball too long' : 'eye lens too weak / eyeball too short', L.cx, L.y0 + L.eyeR + 14, { color: c.muted, size: 10, weight: 600, align: 'center', fit: W });

      // glasses
      var ox = dToX(L, p.d), lxx = L.lx + L.eyeR * 0.08, ret = L.rx - 3, gx = L.gx, gh = L.eyeR * 0.6;
      var hg = L.ap;
      if (p.glasses) {
        var Vg = s.V; // vergence after the glasses
        if (Vg < -1e-6) { var ax = dToX(L, -100 / Vg); hg = L.ap * (gx - ax) / (lxx - ax);
          if (Math.abs(ax - ox) > 6) { D.circle(ctx, ax, L.y0, 3.5, D.alpha(c.s4, 0.9));
            D.line(ctx, ax, L.y0, gx, L.y0 - hg, D.alpha(c.s4, 0.6), 1.2, [4, 4]); D.line(ctx, ax, L.y0, gx, L.y0 + hg, D.alpha(c.s4, 0.6), 1.2, [4, 4]);
            D.text(ctx, 'image made by the glasses', ax, L.y0 + 34, { color: c.s4, size: 10, weight: 600, align: 'center', fit: W }); } }
        else hg = L.ap * (1 + Vg * 0.06);
        ctx.save(); ctx.beginPath();
        var hw = 6;
        if (s.myo) { ctx.moveTo(gx - hw, L.y0 - gh); ctx.lineTo(gx + hw, L.y0 - gh); ctx.quadraticCurveTo(gx + 1, L.y0, gx + hw, L.y0 + gh); ctx.lineTo(gx - hw, L.y0 + gh); ctx.quadraticCurveTo(gx - 1, L.y0, gx - hw, L.y0 - gh); }
        else { ctx.moveTo(gx, L.y0 - gh); ctx.quadraticCurveTo(gx + 2 * hw, L.y0, gx, L.y0 + gh); ctx.quadraticCurveTo(gx - 2 * hw, L.y0, gx, L.y0 - gh); }
        ctx.closePath(); ctx.fillStyle = D.alpha(c.s4, 0.2); ctx.fill(); ctx.strokeStyle = c.s4; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        D.text(ctx, s.myo ? 'concave lens' : 'convex lens', gx, L.y0 - gh - 10, { color: c.s4, size: 10.5, weight: 700, align: 'center', fit: W });
      }

      // rays
      [-1, -0.5, 0.5, 1].forEach(function (k) {
        var hy = L.y0 + k * L.ap, ry = L.y0 + k * L.ap * s.frac;
        if (p.glasses) { D.line(ctx, ox, L.y0, gx, L.y0 + k * hg, D.alpha(c.s2, 0.85), 1.6); D.line(ctx, gx, L.y0 + k * hg, lxx, hy, c.s2, 1.6); }
        else D.line(ctx, ox, L.y0, lxx, hy, D.alpha(c.s2, 0.85), 1.6);
        D.line(ctx, lxx, hy, ret, ry, c.s2, 1.8);
      });
      if (!s.ok) {
        var mx = lxx + (ret - lxx) / (1 - s.frac);
        if (mx > lxx && mx < ret) D.circle(ctx, mx, L.y0, 3.5, c.warning);
        D.line(ctx, ret, L.y0 - L.ap * Math.abs(s.frac), ret, L.y0 + L.ap * Math.abs(s.frac), c.warning, 4);
      } else D.circle(ctx, ret, L.y0, 4.5, c.success);

      D.circle(ctx, ox, L.y0, 6, c.text);
      D.text(ctx, '↔ drag', ox, L.y0 + 18, { color: c.faint, size: 10, align: 'center', fit: W });
      D.text(ctx, 'object', ox, L.y0 - 16, { color: c.text, size: 10.5, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.75), fit: W });

      var vw = L.narrow ? W * 0.44 : 170, vh = L.narrow ? 62 : 72;
      drawView(ctx, W - vw - 12, 34, vw, vh, c, s.blur);
      var info = [s.myo ? 'Far point: ' + p.fp + ' cm' : 'Far point: ∞', 'Near point: ' + M.fmt(s.near, 0) + ' cm'];
      info.forEach(function (t, i) { D.text(ctx, t, 12, 44 + i * 17, { color: c.text, size: 11, weight: 600 }); });
      D.text(ctx, p.glasses ? 'Glasses: ' + (s.Pg > 0 ? '+' : '') + M.fmt(s.Pg, 2) + ' D' : 'No glasses', 12, 78, { color: p.glasses ? c.s4 : c.muted, size: 11, weight: 700 });

      var msg;
      if (s.ok) msg = p.glasses ? 'Corrected: the glasses move the image onto the retina.' : 'This object is within the clear range: sharp.';
      else if (s.frac < 0) msg = 'Rays meet in front of the retina. ' + (L.narrow ? '' : p.glasses ? 'Too close or too far for these glasses.' : 'A concave lens will help.');
      else msg = 'Rays would meet behind the retina. ' + (L.narrow ? '' : p.glasses ? 'Too close for these glasses.' : 'A convex lens will help.');
      D.text(ctx, msg, W / 2, H - 12, { color: s.ok ? c.success : c.danger, size: fitSize(ctx, msg, L.narrow ? 11 : 12.5, W - 16, 700), weight: 700, align: 'center', fit: W });
    }
  });
})();
