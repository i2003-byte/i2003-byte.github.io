/* =====================================================================
   Light: reflection and refraction · Lenses — sim.js
   ---------------------------------------------------------------------
   Ray diagrams for a convex or concave lens (Class 10).
   New Cartesian sign convention: the optical centre O is the origin,
   light travels left to right, distances to the left are negative.
     convex: f = +|f|, concave: f = −|f|, object distance u = −(distance)
     lens formula   1/v − 1/u = 1/f      magnification  m = v/u
     power          P = 1/f (f in metres), in dioptres D
   The standard rays from the top of the object:
     1. parallel to the axis   → through F₂ (or seems to come from F₁)
     2. through O              → goes straight on
     3. through F₁ / towards F₂ → comes out parallel to the axis
   Every refracted ray lies on the line through its hit point and the
   image point, which is how they are drawn. As in textbook diagrams the
   lens is thin, rays bend at the line through O, and heights are
   stretched compared with distances.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var XL = 92, XR = 92, YM = 26, drag = false;

  function optics(p) {
    var fS = p.type === 'convex' ? p.f : -p.f, uS = -p.u, inv = 1 / fS + 1 / uS;
    var inf = Math.abs(inv) < 1e-9, v = inf ? Infinity : 1 / inv, m = inf ? Infinity : v / uS;
    return { fS: fS, uS: uS, v: v, m: m, hi: m * p.ho, inf: inf, real: !inf && v > 0, P: 100 / fS };
  }
  function nature(p, o) {
    if (o.inf) return { pos: 'at infinity', text: 'Highly enlarged, real and inverted, formed at infinity' };
    var size = Math.abs(Math.abs(o.m) - 1) < 0.005 ? 'same size' : Math.abs(o.m) > 1 ? 'magnified' : 'diminished';
    var pos;
    if (p.type === 'concave') pos = 'between F₁ and O, on the object side';
    else if (p.u > 2 * p.f) pos = 'between F₂ and 2F₂';
    else if (p.u === 2 * p.f) pos = 'at 2F₂';
    else if (p.u > p.f) pos = 'beyond 2F₂';
    else pos = 'on the same side as the object';
    return { pos: pos, size: size, text: (o.real ? 'Real' : 'Virtual') + ', ' + (o.m < 0 ? 'inverted' : 'erect') + ', ' + size };
  }
  function objPos(p) {
    if (p.type === 'concave') return 'anywhere in front';
    if (p.u > 2 * p.f) return 'beyond 2F₁'; if (p.u === 2 * p.f) return 'at 2F₁';
    if (p.u > p.f) return 'between F₁ and 2F₁'; if (p.u === p.f) return 'at F₁'; return 'between F₁ and O';
  }
  function use(p) {
    if (p.type === 'concave') return 'Use: spectacles for myopia, peepholes in doors';
    if (p.u > 2 * p.f) return 'Use: camera and the eye (small, inverted image on film or retina)';
    if (p.u === 2 * p.f) return 'Use: photocopier (same-size copy)';
    if (p.u > p.f) return 'Use: projector (large image on a screen)';
    if (p.u === p.f) return 'Use: torch or searchlight lens (parallel beam)';
    return 'Use: magnifying glass (reading lens)';
  }
  function fitSize(ctx, str, size, maxW, weight) {
    ctx.font = weight + ' ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 8.5 && ctx.measureText(str).width > maxW) { size -= 0.5; ctx.font = weight + ' ' + size + 'px Inter, system-ui, sans-serif'; }
    return size;
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, top = 34, bot = H - 56;
    var kx = (W - 20) / (XL + XR), ky = (bot - top) / (2 * YM);
    return { kx: kx, ky: ky, x0: 10 + XL * kx, y0: (top + bot) / 2, top: top, bot: bot };
  }
  function overObj(sim, x, y) {
    var L = layout(sim), ox = L.x0 - sim.p.u * L.kx;
    return Math.abs(x - ox) < 26 && y > L.y0 - sim.p.ho * L.ky - 24 && y < L.y0 + 24;
  }

  SimLab.createSim({
    ariaLabel: 'Ray diagram for a convex or concave lens showing the object, the principal axis with O, F and 2F on both sides, the standard rays and the image',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'type', label: 'Lens', type: 'select', value: 'convex', options: [
        { value: 'convex', label: 'Convex (converging)' }, { value: 'concave', label: 'Concave (diverging)' }] },
      { id: 'u', label: 'Object distance from the lens', min: 4, max: 90, step: 1, value: 40, unit: 'cm',
        help: 'You can also drag the object arrow along the axis.' },
      { id: 'f', label: 'Focal length |f|', min: 10, max: 30, step: 1, value: 15, unit: 'cm',
        presets: [{ label: '10 cm', value: 10 }, { label: '20 cm', value: 20 }, { label: '25 cm', value: 25 }] },
      { id: 'ho', label: 'Object height', min: 2, max: 10, step: 1, value: 5, unit: 'cm' }
    ],
    buttonsTitle: 'Place the object (convex lens)',
    buttons: [
      { label: 'Beyond 2F₁', onClick: function (sim) { sim.setParam('type', 'convex'); sim.setParam('u', sim.p.f * 3); } },
      { label: 'At 2F₁', onClick: function (sim) { sim.setParam('type', 'convex'); sim.setParam('u', sim.p.f * 2); } },
      { label: 'Between F₁ and 2F₁', onClick: function (sim) { sim.setParam('type', 'convex'); sim.setParam('u', Math.round(sim.p.f * 1.5)); } },
      { label: 'At F₁', onClick: function (sim) { sim.setParam('type', 'convex'); sim.setParam('u', sim.p.f); } },
      { label: 'Between F₁ and O', onClick: function (sim) { sim.setParam('type', 'convex'); sim.setParam('u', Math.max(4, Math.round(sim.p.f * 0.5))); } }
    ],
    readouts: [
      { id: 'u', label: 'Object distance u', unit: 'cm', digits: 1 },
      { id: 'f', label: 'Focal length f', unit: 'cm', digits: 1 },
      { id: 'v', label: 'Image distance v', unit: 'cm', digits: 1, key: true },
      { id: 'm', label: 'Magnification m = v/u', digits: 2 },
      { id: 'hi', label: 'Image height', unit: 'cm', digits: 1 },
      { id: 'P', label: 'Power P = 1/f', unit: 'D', digits: 2 },
      { id: 'nat', label: 'Nature of image' },
      { id: 'pos', label: 'Position of image' }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var p = sim.p, o = optics(p), n = nature(p, o);
      return { u: o.uS, f: o.fS, v: o.inf ? '∞' : o.v, m: o.inf ? '∞' : o.m, hi: o.inf ? '∞' : o.hi, P: o.P, nat: n.text, pos: n.pos };
    },
    pointer: {
      down: function (sim, x, y) { drag = overObj(sim, x, y); return drag; },
      move: function (sim, x) {
        if (!drag) return;
        var L = layout(sim);
        sim.setParam('u', M.clamp(Math.round((L.x0 - x) / L.kx), 4, 90));
      },
      up: function () { drag = false; },
      hover: overObj
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, narrow = W < 560;
      D.clear(ctx, W, H, c.bg);
      var L = layout(sim), o = optics(p), n = nature(p, o), A = YM * 0.95;
      function X(x) { return L.x0 + x * L.kx; }
      function Y(y) { return L.y0 - y * L.ky; }

      // headline: the lens formula with numbers
      var head = o.inf ? '1/v = 1/f + 1/u = 0, so the image is at infinity'
        : '1/v − 1/u = 1/f:  u = ' + M.fmt(o.uS, 0) + ', f = ' + M.fmt(o.fS, 0) + '  →  v = ' + M.fmt(o.v, 1) + ' cm';
      var hs = fitSize(ctx, head, narrow ? 11.5 : 13, W - 24, 700);
      D.text(ctx, head, W / 2, 15, { color: c.bg, bg: c.s3, size: hs, weight: 700, align: 'center', pad: 4, fit: W });

      ctx.save(); ctx.beginPath(); ctx.rect(0, L.top, W, L.bot - L.top); ctx.clip();
      // principal axis and points
      D.line(ctx, 4, L.y0, W - 4, L.y0, c.axis, 1.2);
      var pts = [{ x: 0, l: 'O' }, { x: -p.f, l: 'F₁' }, { x: -2 * p.f, l: '2F₁' }, { x: p.f, l: 'F₂' }, { x: 2 * p.f, l: '2F₂' }];
      pts.forEach(function (q) {
        if (q.x < -XL || q.x > XR) return;
        D.circle(ctx, X(q.x), L.y0, 3, q.l.charAt(0) === 'F' ? c.warning : c.text);
        D.text(ctx, q.l, X(q.x) + (q.l === 'O' ? 9 : 0), L.y0 + 13, { color: q.l.charAt(0) === 'F' ? c.warning : c.text, size: 11.5, weight: 700, align: 'center' });
      });

      // lens outline: thin biconvex or biconcave shape
      var hw = narrow ? 6 : 9, top = Y(A), bot = Y(-A), x0 = X(0);
      ctx.save(); ctx.beginPath();
      if (p.type === 'convex') {
        ctx.moveTo(x0, top); ctx.quadraticCurveTo(x0 + hw * 2, L.y0, x0, bot); ctx.quadraticCurveTo(x0 - hw * 2, L.y0, x0, top);
      } else {
        ctx.moveTo(x0 - hw, top); ctx.lineTo(x0 + hw, top); ctx.quadraticCurveTo(x0 - hw * 0.4, L.y0, x0 + hw, bot);
        ctx.lineTo(x0 - hw, bot); ctx.quadraticCurveTo(x0 + hw * 0.4, L.y0, x0 - hw, top);
      }
      ctx.closePath(); ctx.fillStyle = D.alpha(c.s1, 0.18); ctx.fill(); ctx.strokeStyle = c.s1; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();

      // rays
      var O = { x: -p.u, y: p.ho }, I = { x: o.v, y: o.hi };
      function hitY(px) { // line through object top and (px, 0), value at x = 0
        var den = px - O.x; if (Math.abs(den) < 1e-9) return null;
        return O.y + (0 - O.x) * (0 - O.y) / den;
      }
      var via3 = -o.fS; // F₁ for convex, F₂ (aimed at) for concave
      var rays = [{ y: p.ho, col: c.s2, via: null }, { y: 0, col: c.s4, via: null }, { y: hitY(via3), col: c.s1, via: via3 }];
      function midArrow(x1, y1, x2, y2, col) {
        var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = Math.atan2(y2 - y1, x2 - x1);
        D.arrow(ctx, mx - Math.cos(a) * 6, my - Math.sin(a) * 6, mx + Math.cos(a) * 3, my + Math.sin(a) * 3, col, 1.5, 7);
      }
      rays.forEach(function (r) {
        if (r.y == null || Math.abs(r.y) > A) return;
        var hx = X(0), hy = Y(r.y), sx = X(O.x), sy = Y(O.y);
        D.line(ctx, sx, sy, hx, hy, r.col, 2); midArrow(sx, sy, hx, hy, r.col);
        // construction lines: towards F₂ beyond a concave lens, or from F₁ behind an object inside F
        if (r.via != null && r.via > 0) D.line(ctx, hx, hy, X(r.via), L.y0, D.alpha(r.col, 0.7), 1.2, [4, 4]);
        if (r.via != null && r.via < 0 && r.via < O.x) D.line(ctx, X(r.via), L.y0, sx, sy, D.alpha(r.col, 0.7), 1.2, [4, 4]);
        var dx, dy, ix = X(I.x), iy = Y(I.y);
        if (o.inf) { dx = p.u * L.kx; dy = p.ho * L.ky; }
        else if (o.real) { dx = ix - hx; dy = iy - hy; }
        else { dx = hx - ix; dy = hy - iy; }
        if (r.y === 0) { dx = hx - sx; dy = hy - sy; } // through O: undeviated
        var len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
        D.line(ctx, hx, hy, hx + dx * 2000, hy + dy * 2000, r.col, 2);
        midArrow(hx + dx * 30, hy + dy * 30, hx + dx * 44, hy + dy * 44, r.col);
        if (!o.inf && !o.real) D.line(ctx, hx, hy, ix, iy, D.alpha(r.col, 0.75), 1.3, [5, 4]);
      });

      // object arrow
      D.arrow(ctx, X(O.x), L.y0, X(O.x), Y(O.y), c.text, 3, 10);
      D.text(ctx, '↔ drag', X(O.x), L.y0 + 28, { color: c.faint, size: 10, align: 'center', fit: W });
      D.text(ctx, 'object', X(O.x), Y(O.y) - 11, { color: c.text, size: 10.5, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.75), fit: W });
      var note = '';
      if (o.inf) note = 'Rays come out parallel: the image is at infinity';
      else if (I.x < -XL || I.x > XR || Math.abs(I.y) > YM) note = 'The image is off the screen (v = ' + M.fmt(o.v, 0) + ' cm, height ' + M.fmt(o.hi, 1) + ' cm)';
      else {
        if (o.real) D.arrow(ctx, X(I.x), L.y0, X(I.x), Y(I.y), c.s2, 3, 10);
        else {
          D.line(ctx, X(I.x), L.y0, X(I.x), Y(I.y), c.s2, 2.5, [5, 4]);
          D.arrow(ctx, X(I.x), Y(I.y) + (I.y > 0 ? 8 : -8), X(I.x), Y(I.y), c.s2, 2.5, 10);
        }
        D.text(ctx, o.real ? 'real image' : 'virtual image', X(I.x), Y(I.y) + (I.y >= 0 ? -11 : 12), { color: c.s2, size: 10.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.75), fit: W });
      }
      ctx.restore();

      // bottom strip
      var s1 = 'Object ' + objPos(p) + ' → image ' + n.pos;
      var s2 = n.text + (note ? ' · ' + note : '');
      var s3 = use(p);
      D.text(ctx, s1, W / 2, H - 44, { color: c.text, size: fitSize(ctx, s1, narrow ? 11 : 12.5, W - 16, 600), weight: 600, align: 'center', fit: W });
      D.text(ctx, s2, W / 2, H - 27, { color: o.real || o.inf ? c.s2 : c.warning, size: fitSize(ctx, s2, narrow ? 11 : 12.5, W - 16, 700), weight: 700, align: 'center', fit: W });
      D.text(ctx, s3, W / 2, H - 10, { color: c.muted, size: fitSize(ctx, s3, narrow ? 10.5 : 12, W - 16, 500), weight: 500, align: 'center', fit: W });
    }
  });
})();
