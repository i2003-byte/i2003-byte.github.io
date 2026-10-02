/* =====================================================================
   Light: reflection and refraction · Spherical Mirrors — sim.js
   ---------------------------------------------------------------------
   Ray diagrams for a concave or convex mirror (Class 10).
   New Cartesian sign convention: the pole P is the origin, light comes
   from the left, distances measured against the light are negative.
     concave: f = −|f|, convex: f = +|f|, object distance u = −(distance)
     mirror formula   1/v + 1/u = 1/f      magnification  m = −v/u
   The standard rays from the top of the object:
     1. parallel to the axis  → reflects through F (or seems to come from F)
     2. through / towards F   → reflects parallel to the axis
     3. through / towards C   → comes straight back
     4. to the pole P         → reflects at an equal angle (optional)
   Every reflected ray lies on the line through its hit point and the
   image point, which is how they are drawn here. Like textbook diagrams,
   rays bend at the line through P (small-angle / paraxial mirror), and
   heights are stretched compared with distances.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var XL = 95, XR = 65, YM = 28, drag = false;

  function optics(p) {
    var fS = p.type === 'concave' ? -p.f : p.f, uS = -p.u, inv = 1 / fS - 1 / uS;
    var inf = Math.abs(inv) < 1e-9, v = inf ? Infinity : 1 / inv, m = inf ? Infinity : -v / uS;
    return { fS: fS, uS: uS, v: v, m: m, hi: m * p.ho, inf: inf, real: !inf && v < 0 };
  }
  function nature(p, o) {
    if (o.inf) return { pos: 'at infinity', text: 'Highly enlarged, real and inverted, formed at infinity' };
    var size = Math.abs(Math.abs(o.m) - 1) < 0.005 ? 'same size' : Math.abs(o.m) > 1 ? 'magnified' : 'diminished';
    var pos;
    if (p.type === 'convex') pos = 'behind the mirror, between P and F';
    else if (p.u > 2 * p.f) pos = 'between F and C';
    else if (p.u === 2 * p.f) pos = 'at C';
    else if (p.u > p.f) pos = 'beyond C';
    else pos = 'behind the mirror';
    return { pos: pos, size: size, text: (o.real ? 'Real' : 'Virtual') + ', ' + (o.m < 0 ? 'inverted' : 'erect') + ', ' + size };
  }
  function objPos(p) {
    if (p.type === 'convex') return 'anywhere in front';
    if (p.u > 2 * p.f) return 'beyond C'; if (p.u === 2 * p.f) return 'at C';
    if (p.u > p.f) return 'between C and F'; if (p.u === p.f) return 'at F'; return 'between F and P';
  }
  function fitSize(ctx, str, size, maxW, weight) {
    ctx.font = weight + ' ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 8.5 && ctx.measureText(str).width > maxW) { size -= 0.5; ctx.font = weight + ' ' + size + 'px Inter, system-ui, sans-serif'; }
    return size;
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, top = 34, bot = H - 40;
    var kx = (W - 20) / (XL + XR), ky = (bot - top) / (2 * YM);
    return { kx: kx, ky: ky, x0: 10 + XL * kx, y0: (top + bot) / 2, top: top, bot: bot };
  }

  SimLab.createSim({
    ariaLabel: 'Ray diagram for a concave or convex mirror showing the object, the principal axis with P, F and C, the standard rays and the image',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'type', label: 'Mirror', type: 'select', value: 'concave', options: [
        { value: 'concave', label: 'Concave (converging)' }, { value: 'convex', label: 'Convex (diverging)' }] },
      { id: 'u', label: 'Object distance from the mirror', min: 4, max: 90, step: 1, value: 40, unit: 'cm',
        help: 'You can also drag the object arrow along the axis.' },
      { id: 'f', label: 'Focal length |f|', min: 10, max: 30, step: 1, value: 15, unit: 'cm',
        presets: [{ label: '10 cm', value: 10 }, { label: '15 cm', value: 15 }, { label: '20 cm', value: 20 }] },
      { id: 'ho', label: 'Object height', min: 2, max: 10, step: 1, value: 5, unit: 'cm' },
      { id: 'pole', label: 'Also show the ray to the pole P', type: 'toggle', value: false }
    ],
    buttonsTitle: 'Place the object (concave mirror)',
    buttons: [
      { label: 'Beyond C', onClick: function (sim) { sim.setParam('type', 'concave'); sim.setParam('u', sim.p.f * 3); } },
      { label: 'At C', onClick: function (sim) { sim.setParam('type', 'concave'); sim.setParam('u', sim.p.f * 2); } },
      { label: 'Between C and F', onClick: function (sim) { sim.setParam('type', 'concave'); sim.setParam('u', Math.round(sim.p.f * 1.5)); } },
      { label: 'At F', onClick: function (sim) { sim.setParam('type', 'concave'); sim.setParam('u', sim.p.f); } },
      { label: 'Between F and P', onClick: function (sim) { sim.setParam('type', 'concave'); sim.setParam('u', Math.max(4, Math.round(sim.p.f * 0.5))); } }
    ],
    readouts: [
      { id: 'u', label: 'Object distance u', unit: 'cm', digits: 1 },
      { id: 'f', label: 'Focal length f', unit: 'cm', digits: 1 },
      { id: 'v', label: 'Image distance v', unit: 'cm', digits: 1, key: true },
      { id: 'm', label: 'Magnification m = −v/u', digits: 2 },
      { id: 'hi', label: 'Image height', unit: 'cm', digits: 1 },
      { id: 'nat', label: 'Nature of image' },
      { id: 'pos', label: 'Position of image' }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var p = sim.p, o = optics(p), n = nature(p, o);
      return { u: o.uS, f: o.fS, v: o.inf ? '∞' : o.v, m: o.inf ? '∞' : o.m, hi: o.inf ? '∞' : o.hi, nat: n.text, pos: n.pos };
    },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim), ox = L.x0 - sim.p.u * L.kx;
        drag = Math.abs(x - ox) < 26 && y > L.y0 - sim.p.ho * L.ky - 24 && y < L.y0 + 24;
        return drag;
      },
      move: function (sim, x) {
        if (!drag) return;
        var L = layout(sim);
        sim.setParam('u', M.clamp(Math.round((L.x0 - x) / L.kx), 4, 90));
      },
      up: function () { drag = false; },
      hover: function (sim, x, y) {
        var L = layout(sim), ox = L.x0 - sim.p.u * L.kx;
        return Math.abs(x - ox) < 26 && y > L.y0 - sim.p.ho * L.ky - 24 && y < L.y0 + 24;
      }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, narrow = W < 560;
      D.clear(ctx, W, H, c.bg);
      var L = layout(sim), o = optics(p), n = nature(p, o), A = YM * 0.95;
      function X(x) { return L.x0 + x * L.kx; }
      function Y(y) { return L.y0 - y * L.ky; }

      // headline: the mirror formula with numbers
      var head = o.inf ? '1/v = 1/f − 1/u = 0, so the image is at infinity'
        : '1/v + 1/u = 1/f:  u = ' + M.fmt(o.uS, 0) + ', f = ' + M.fmt(o.fS, 0) + '  →  v = ' + M.fmt(o.v, 1) + ' cm';
      var hs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(head).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, head, W / 2, 15, { color: c.bg, bg: c.s3, size: hs, weight: 700, align: 'center', pad: 4, fit: W });

      ctx.save(); ctx.beginPath(); ctx.rect(0, L.top, W, L.bot - L.top); ctx.clip();
      // principal axis and points
      D.line(ctx, 4, L.y0, W - 4, L.y0, c.axis, 1.2);
      var pts = [{ x: 0, l: 'P' }, { x: o.fS, l: 'F' }, { x: 2 * o.fS, l: 'C' }];
      pts.forEach(function (q) {
        if (q.x < -XL || q.x > XR) return;
        D.circle(ctx, X(q.x), L.y0, 3, c.text);
        D.text(ctx, q.l, X(q.x) + (q.l === 'P' ? 8 : 0), L.y0 + 13, { color: c.text, size: 11.5, weight: 700, align: 'center' });
      });

      // mirror (stylised curve) with hatching behind
      var bulge = narrow ? 7 : 11, sgn = p.type === 'concave' ? -1 : 1;
      function MX(y) { return X(0) + sgn * bulge * (y / A) * (y / A); }
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 3; ctx.beginPath();
      for (var yy = -A; yy <= A + 1e-6; yy += A / 30) { if (yy === -A) ctx.moveTo(MX(yy), Y(yy)); else ctx.lineTo(MX(yy), Y(yy)); }
      ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = D.alpha(c.muted, 0.7); ctx.beginPath();
      for (yy = -A; yy <= A; yy += A / 12) { ctx.moveTo(MX(yy) + 2, Y(yy)); ctx.lineTo(MX(yy) + 9, Y(yy) - 7); }
      ctx.stroke(); ctx.restore();

      // rays
      var O = { x: -p.u, y: p.ho }, I = { x: o.v, y: o.hi };
      function hitY(px) { // line through object top and (px, 0), value at x = 0
        var den = px - O.x; if (Math.abs(den) < 1e-9) return null;
        return O.y + (0 - O.x) * (0 - O.y) / den;
      }
      var rays = [{ y: p.ho, col: c.s2, via: null }, { y: hitY(o.fS), col: c.s4, via: o.fS }, { y: hitY(2 * o.fS), col: c.s1, via: 2 * o.fS }];
      if (p.pole) rays.push({ y: 0, col: c.warning, via: null });
      function midArrow(x1, y1, x2, y2, col) {
        var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = Math.atan2(y2 - y1, x2 - x1);
        D.arrow(ctx, mx - Math.cos(a) * 6, my - Math.sin(a) * 6, mx + Math.cos(a) * 3, my + Math.sin(a) * 3, col, 1.5, 7);
      }
      rays.forEach(function (r) {
        if (r.y == null || Math.abs(r.y) > A) return;
        var hx = MX(r.y), hy = Y(r.y), sx = X(O.x), sy = Y(O.y);
        // incident ray
        D.line(ctx, sx, sy, hx, hy, r.col, 2); midArrow(sx, sy, hx, hy, r.col);
        // construction line to F or C behind the mirror (convex) or from F (object inside F)
        if (r.via != null && r.via > 0) D.line(ctx, hx, hy, X(r.via), L.y0, D.alpha(r.col, 0.7), 1.2, [4, 4]);
        if (r.via != null && r.via < 0 && r.via < O.x) D.line(ctx, X(r.via), L.y0, sx, sy, D.alpha(r.col, 0.7), 1.2, [4, 4]);
        // reflected ray (screen space, so it passes exactly through the image point)
        var dx, dy, ix = X(I.x), iy = Y(I.y);
        if (o.inf) { dx = -L.kx; dy = p.ho / p.u * L.ky; }
        else if (o.real) { dx = ix - hx; dy = iy - hy; }
        else { dx = hx - ix; dy = hy - iy; }
        var len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
        D.line(ctx, hx, hy, hx + dx * 2000, hy + dy * 2000, r.col, 2);
        midArrow(hx + dx * 30, hy + dy * 30, hx + dx * 44, hy + dy * 44, r.col);
        if (!o.inf && !o.real) D.line(ctx, hx, hy, ix, iy, D.alpha(r.col, 0.75), 1.3, [5, 4]);
      });

      // object arrow
      D.arrow(ctx, X(O.x), L.y0, X(O.x), Y(O.y), c.text, 3, 10);
      D.text(ctx, '↔ drag', X(O.x), L.y0 + 28, { color: c.faint, size: 10, align: 'center', fit: W });
      D.text(ctx, 'object', X(O.x), Y(O.y) - 11, { color: c.text, size: 10.5, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.75), fit: W });
      // image arrow
      var note = '';
      if (o.inf) note = 'Rays come out parallel: the image is at infinity';
      else if (I.x < -XL || I.x > XR || Math.abs(I.y) > YM) note = 'The image is off the screen (v = ' + M.fmt(o.v, 0) + ' cm, height ' + M.fmt(o.hi, 1) + ' cm)';
      else {
        var ic = o.real ? c.s2 : D.alpha(c.s2, 0.85);
        if (o.real) D.arrow(ctx, X(I.x), L.y0, X(I.x), Y(I.y), ic, 3, 10);
        else {
          D.line(ctx, X(I.x), L.y0, X(I.x), Y(I.y), ic, 2.5, [5, 4]);
          D.arrow(ctx, X(I.x), Y(I.y) + (I.y > 0 ? 8 : -8), X(I.x), Y(I.y), ic, 2.5, 10);
        }
        D.text(ctx, o.real ? 'real image' : 'virtual image', X(I.x), Y(I.y) + (I.y >= 0 ? -11 : 12), { color: c.s2, size: 10.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.75), fit: W });
      }
      ctx.restore();

      // bottom strip
      var s1 = 'Object ' + objPos(p) + ' → image ' + n.pos;
      var s2 = n.text + (note ? ' · ' + note : '');
      D.text(ctx, s1, W / 2, H - 28, { color: c.text, size: fitSize(ctx, s1, narrow ? 11 : 12.5, W - 16, 600), weight: 600, align: 'center', fit: W });
      D.text(ctx, s2, W / 2, H - 11, { color: o.real || o.inf ? c.s2 : c.warning, size: fitSize(ctx, s2, narrow ? 11 : 12.5, W - 16, 700), weight: 700, align: 'center', fit: W });
    }
  });
})();
