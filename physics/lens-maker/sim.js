/* =====================================================================
   Ray optics (Class 12) · Spherical surfaces and the lens maker's formula
   ---------------------------------------------------------------------
   Rays are traced exactly with Snell's law (vector form) through one
   or two spherical surfaces, so near-axis rays meet where the formulas
   say and edge rays meet a little closer (spherical aberration).
   Cartesian signs: light goes left → right, distances measured from the
   surface (or the lens centre); R > 0 when the centre of curvature is
   on the right.
     one surface (medium n₁ on the left, glass n₂ on the right):
       n₂/v − n₁/u = (n₂ − n₁)/R
     thin lens of index n in a medium n_m:
       1/f = (n/n_m − 1)(1/R₁ − 1/R₂),  1/v − 1/u = 1/f,  P = 1/f (m)
   Shapes: biconvex (R, −R), plano-convex (R, ∞), convex meniscus
   (R, 2R), biconcave (−R, R), plano-concave (−R, ∞).
   The lens is drawn with a real thickness (its edge a little thicker
   than zero), so the traced focus differs slightly from the thin-lens
   value; the aperture is 0.26 |R| so aberration stays small.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var MED = { air: { n: 1.0, l: 'air' }, water: { n: 1.33, l: 'water' }, glyc: { n: 1.47, l: 'glycerine' }, cs2: { n: 1.63, l: 'carbon disulphide' } };
  var SHAPES = {
    convex1: { l: 'One convex surface (glass rod)', one: true, r1: 1 },
    concave1: { l: 'One concave surface (glass rod)', one: true, r1: -1 },
    biconvex: { l: 'Biconvex lens', r1: 1, r2: -1 },
    plano: { l: 'Plano-convex lens', r1: 1, r2: Infinity },
    meniscus: { l: 'Convex meniscus lens', r1: 1, r2: 2 },
    biconcave: { l: 'Biconcave lens', r1: -1, r2: 1 },
    planocc: { l: 'Plano-concave lens', r1: -1, r2: Infinity }
  };

  function refract(d, nrm, eta) {
    var ci = -(d.x * nrm.x + d.y * nrm.y), k = 1 - eta * eta * (1 - ci * ci);
    if (k < 0) return null;
    var st = eta * ci - Math.sqrt(k);
    return { x: eta * d.x + st * nrm.x, y: eta * d.y + st * nrm.y };
  }
  function surfX(s, y) { return isFinite(s.R) ? s.xv + s.R - Math.sign(s.R) * Math.sqrt(Math.max(0, s.R * s.R - y * y)) : s.xv; }
  function hit(s, P, d) { // returns {p, n} with n pointing left (towards incoming light)
    if (!isFinite(s.R)) { if (Math.abs(d.x) < 1e-12) return null; var t = (s.xv - P.x) / d.x; return { p: { x: s.xv, y: P.y + d.y * t }, n: { x: -1, y: 0 } }; }
    var C = { x: s.xv + s.R, y: 0 }, fx = P.x - C.x, fy = P.y, b = fx * d.x + fy * d.y, cc = fx * fx + fy * fy - s.R * s.R, disc = b * b - cc;
    if (disc < 0) return null;
    var best = null;
    [-b - Math.sqrt(disc), -b + Math.sqrt(disc)].forEach(function (t) {
      var q = { x: P.x + d.x * t, y: P.y + d.y * t };
      if (t > 1e-9 && Math.sign(q.x - C.x) === -Math.sign(s.R) && (!best || t < best.t)) best = { t: t, p: q };
    });
    if (!best) return null;
    return { p: best.p, n: { x: (best.p.x - C.x) / s.R, y: best.p.y / s.R } };
  }

  function setup(p) {
    var sh = SHAPES[p.shape], nm = MED[p.med].n, n = p.n, R = p.R, o = { sh: sh, nm: nm, n: n };
    if (sh.one) {
      o.R1 = sh.r1 * R; o.h = 0.26 * R;
      o.surfs = [{ xv: 0, R: o.R1, n1: nm, n2: n }];
      var u = p.src === 'far' ? -Infinity : -p.u, rhs = (n - nm) / o.R1;
      var lhs = rhs + (isFinite(u) ? nm / u : 0);
      o.v = Math.abs(lhs) < 1e-12 ? Infinity : n / lhs; o.u = u; o.f = Math.abs(rhs) < 1e-12 ? Infinity : n / rhs;
      return o;
    }
    o.R1 = sh.r1 * R; o.R2 = sh.r2 * R; o.h = 0.26 * R;
    o.inv = (n / nm - 1) * (1 / o.R1 - (isFinite(o.R2) ? 1 / o.R2 : 0));
    o.f = Math.abs(o.inv) < 1e-9 ? Infinity : 1 / o.inv;
    var u2 = p.src === 'far' ? -Infinity : -p.u, iv = o.inv + (isFinite(u2) ? 1 / u2 : 0);
    o.v = Math.abs(iv) < 1e-12 ? Infinity : 1 / iv; o.u = u2;
    // thickness: edge at least e, centre at least e
    function dl(Rr) { return isFinite(Rr) ? Rr - Math.sign(Rr) * Math.sqrt(Rr * Rr - o.h * o.h) : 0; }
    var e = 0.012 * R + 0.1, t = Math.max(e, e - dl(o.R2) + dl(o.R1));
    o.t = t;
    o.surfs = [{ xv: -t / 2, R: o.R1, n1: nm, n2: n }, { xv: t / 2, R: o.R2, n1: n, n2: nm }];
    return o;
  }
  function traceAll(o) {
    var rays = [], N = 11;
    for (var k = 0; k < N; k++) {
      var yy = o.h * 0.94 * (-1 + 2 * k / (N - 1)); if (Math.abs(yy) < 1e-6) yy = 0;
      rays.push(traceOne(o, yy));
    }
    return rays;
  }
  function traceOne(o, yy) {
    {
      var P, d;
      if (!isFinite(o.u)) { P = { x: -1e6, y: yy }; d = { x: 1, y: 0 }; }
      else { P = { x: o.u, y: 0 }; var tx = surfX(o.surfs[0], yy) - P.x; var L = Math.hypot(tx, yy); d = { x: tx / L, y: yy / L }; }
      var pts = [P], ok = true;
      for (var s = 0; s < o.surfs.length; s++) {
        var sf = o.surfs[s], hh = hit(sf, P, d);
        if (!hh) { ok = false; break; }
        var nd = refract(d, hh.n, sf.n1 / sf.n2);
        pts.push(hh.p); P = hh.p;
        if (!nd) { ok = false; break; }
        d = nd;
      }
      return { pts: pts, d: d, end: ok, y0: yy, frac: Math.abs(yy) / o.h };
    }
  }
  function crossing(r) { // where an exit ray meets the axis
    var P = r.pts[r.pts.length - 1]; if (Math.abs(r.d.y) < 1e-12 || r.y0 === 0) return null;
    return P.x - P.y * r.d.x / r.d.y;
  }

  SimLab.createSim({
    ariaLabel: 'Rays traced through one curved glass surface or a lens, with the lens maker’s formula, focal points, centres of curvature and the image',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'shape', label: 'Surface or lens', type: 'select', value: 'biconvex', options: Object.keys(SHAPES).map(function (k) { return { value: k, label: SHAPES[k].l }; }) },
      { id: 'R', label: 'Radius of curvature |R|', min: 10, max: 60, step: 1, value: 20, unit: 'cm' },
      { id: 'n', label: 'Refractive index of the glass', min: 1, max: 2.5, step: 0.01, value: 1.5, presets: [{ label: 'Water 1.33', value: 1.33 }, { label: 'Crown glass 1.50', value: 1.5 }, { label: 'Flint 1.65', value: 1.65 }, { label: 'Diamond 2.42', value: 2.42 }] },
      { id: 'med', label: 'Lens kept in', type: 'select', value: 'air', options: Object.keys(MED).map(function (k) { return { value: k, label: MED[k].l.charAt(0).toUpperCase() + MED[k].l.slice(1) + ' (n = ' + MED[k].n.toFixed(2) + ')' }; }) },
      { id: 'src', label: 'Light from', type: 'select', value: 'far', options: [{ value: 'far', label: 'A far object (parallel rays)' }, { value: 'point', label: 'A point object on the axis' }] },
      { id: 'u', label: 'Distance of the point object', min: 5, max: 120, step: 1, value: 40, unit: 'cm' }
    ],
    readouts: [
      { id: 'f', label: 'Focal length (formula)', short: 'f', key: true },
      { id: 'P', label: 'Power', key: true },
      { id: 'v', label: 'Image distance v (formula)', short: 'v' },
      { id: 'R12', label: 'R₁ and R₂' },
      { id: 'near', label: 'Near-axis rays meet at' },
      { id: 'edge', label: 'Edge rays meet at' }
    ],
    reset: function (sim) { showU(sim.p); },
    onParam: function (sim, id) { if (id === 'src') showU(sim.p); return true; },
    readout: function (sim) {
      var p = sim.p, o = setup(p), rn = traceOne(o, o.h * 0.02), re = traceOne(o, o.h * 0.94);
      var near = rn.end ? crossing(rn) : null, edge = re.end ? crossing(re) : null;
      function fmtX(x) { return x == null ? '—' : Math.abs(x) > 2000 ? 'very far (rays almost parallel)' : M.fmt(x, 1) + ' cm' + (x < 0 ? ' (virtual, on the left)' : ''); }
      return {
        f: !isFinite(o.f) ? '∞ (no bending)' : M.fmt(o.f, 1) + ' cm' + (o.sh.one ? ' (second focus, in the glass)' : o.f > 0 ? ' (converging)' : ' (diverging)'),
        P: o.sh.one ? '(n₂ − n₁)/R = ' + M.fmt((o.n - o.nm) / (o.R1 / 100), 2) + ' D' : !isFinite(o.f) ? '0 D' : M.fmt(100 / o.f * o.nm, 2) + ' D' + (o.nm !== 1 ? ' (n_m/f)' : ''),
        v: !isFinite(o.v) ? '∞' : M.fmt(o.v, 1) + ' cm' + (o.v < 0 ? ' (virtual)' : ' (real)'),
        R12: o.sh.one ? 'R = ' + M.fmt(o.R1, 0) + ' cm' : 'R₁ = ' + M.fmt(o.R1, 0) + ' cm, R₂ = ' + (isFinite(o.R2) ? M.fmt(o.R2, 0) + ' cm' : '∞ (flat)'),
        near: fmtX(near), edge: re.end ? fmtX(edge) : 'edge rays are totally reflected inside'
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, o = setup(p);
      var nar = W < 560, fs = nar ? 10.5 : 12;
      D.clear(ctx, W, H, c.bg);
      // view range in cm
      var target = isFinite(o.v) ? o.v : (isFinite(o.f) ? o.f : 200);
      if (!isFinite(o.u) && isFinite(o.f)) target = o.f;
      var xr = M.clamp(Math.max(target > 0 ? target * 1.2 : 0, o.h * 2, 15), 15, 260);
      var xl = isFinite(o.u) ? -o.u * 1.08 : -Math.max(o.h * 2.2, xr * 0.3);
      if (target < 0) xl = Math.min(xl, Math.max(target * 1.15, -260));
      if (o.sh.one && isFinite(o.v) && o.v > 0) xr = M.clamp(o.v * 1.15, 15, 260);
      var top = 34, bot = H - 30, y0 = (top + bot) / 2;
      var kx = (W - 20) / (xr - xl), ky = (bot - top) * 0.42 / o.h, x0;
      if (ky < kx) { kx = ky; x0 = 10 + (W - 20 - (xr - xl) * kx) / 2 - xl * kx; }
      else {
        if (ky / kx > 5) kx = ky / 5; // stretch heights at most 5×; far points go off the edge
        x0 = M.clamp(10 - xl * kx, W * 0.18, W * 0.72);
      }
      if (isFinite(o.u) && x0 + o.u * kx < 14) { kx = Math.min(kx, (W * 0.62) / -o.u); x0 = 14 - o.u * kx; } // keep the object point in view
      var stretch = ky / kx;
      function X(x) { return x0 + x * kx; }
      function Y(y) { return y0 - y * ky; }
      var xEndCm = (W - x0) / kx + 1, xStartCm = -x0 / kx - 1;
      function offEdge(x, label) { // a point beyond the picture: say where it is
        if (!isFinite(x) || (X(x) > 4 && X(x) < W - 4)) return;
        var right = X(x) >= W - 4;
        D.text(ctx, (right ? '' : '← ') + label + ' at ' + M.fmt(x, 0) + ' cm' + (right ? ' →' : ''), right ? W - 6 : 6, y0 + 26, { color: c.warning, size: fs - 1, weight: 700, align: right ? 'right' : 'left', bg: D.alpha(c.bg, 0.85), pad: 2 });
      }

      // medium tint
      if (o.nm > 1) { ctx.fillStyle = D.alpha('#38bdf8', 0.05 + (o.nm - 1) * 0.15); ctx.fillRect(0, top - 6, W, bot - top + 12); D.text(ctx, MED[p.med].l + ' n = ' + o.nm.toFixed(2), 8, bot - 2, { color: c.muted, size: fs - 1 }); }
      D.line(ctx, 4, y0, W - 4, y0, c.axis, 1.1);
      // glass
      ctx.save(); ctx.beginPath();
      if (o.sh.one) {
        var s = o.surfs[0], yy;
        ctx.moveTo(W + 4, Y(o.h)); for (yy = o.h; yy >= -o.h; yy -= o.h / 30) ctx.lineTo(X(surfX(s, yy)), Y(yy)); ctx.lineTo(W + 4, Y(-o.h));
      } else {
        var s1 = o.surfs[0], s2 = o.surfs[1], y2;
        for (y2 = o.h; y2 >= -o.h; y2 -= o.h / 30) ctx.lineTo(X(surfX(s1, y2)), Y(y2));
        for (y2 = -o.h; y2 <= o.h; y2 += o.h / 30) ctx.lineTo(X(surfX(s2, y2)), Y(y2));
      }
      ctx.closePath(); ctx.fillStyle = D.alpha(c.s1, 0.12 + M.clamp((o.n - 1) * 0.12, 0, 0.25)); ctx.fill(); ctx.strokeStyle = c.s1; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
      // centres of curvature
      o.surfs.forEach(function (sf, i) {
        if (!isFinite(sf.R)) return; var cx = X(sf.xv + sf.R); if (cx < 6 || cx > W - 6) return;
        D.circle(ctx, cx, y0, 3, c.muted); D.text(ctx, o.sh.one ? 'C' : 'C' + (i ? '₂' : '₁'), cx, y0 - 11, { color: c.muted, size: fs - 1, weight: 700, align: 'center' });
      });
      // focal points from the formula
      if (isFinite(o.f) && !o.sh.one) [o.f, -o.f].forEach(function (fx, i) { var px = X(fx); if (px > 6 && px < W - 6) { D.circle(ctx, px, y0, 3.5, c.warning); D.text(ctx, i ? 'F₁' : 'F₂', px, y0 + 13, { color: c.warning, size: fs - 0.5, weight: 700, align: 'center' }); } });
      if (o.sh.one && isFinite(o.f) && o.f > 0 && X(o.f) < W - 6) { D.circle(ctx, X(o.f), y0, 3.5, c.warning); D.text(ctx, 'F', X(o.f), y0 + 13, { color: c.warning, size: fs - 0.5, weight: 700, align: 'center' }); }
      // rays
      var rays = traceAll(o);
      rays.forEach(function (r) {
        var col = r.frac > 0.7 ? c.s2 : r.frac > 0.35 ? c.s4 : c.s3, pts = r.pts.slice();
        if (!isFinite(pts[0].x)) pts[0] = { x: xStartCm, y: pts[0].y };
        if (pts[0].x < xStartCm) { var fr = (xStartCm - pts[0].x) / (pts[1].x - pts[0].x); pts[0] = { x: xStartCm, y: pts[0].y + (pts[1].y - pts[0].y) * fr }; }
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath();
        pts.forEach(function (q, i) { if (i) ctx.lineTo(X(q.x), Y(q.y)); else ctx.moveTo(X(q.x), Y(q.y)); });
        var L = r.pts[r.pts.length - 1];
        if (r.end) { var tt = (xEndCm - L.x) / Math.max(1e-6, r.d.x); ctx.lineTo(X(L.x + r.d.x * tt), Y(L.y + r.d.y * tt)); }
        ctx.stroke(); ctx.restore();
        if (!r.end) D.text(ctx, '✕', X(L.x), Y(L.y), { color: c.danger, size: 11, align: 'center', weight: 800 });
        if (r.end && isFinite(o.v) && o.v < 0 && r.y0 !== 0) { var tb = (Math.max(o.v * 1.05, xStartCm) - L.x) / r.d.x; D.line(ctx, X(L.x), Y(L.y), X(L.x + r.d.x * tb), Y(L.y + r.d.y * tb), D.alpha(col, 0.5), 1, [4, 4]); }
      });
      // object and image points
      if (isFinite(o.u)) { D.circle(ctx, X(o.u), y0, 4.5, c.ink); D.text(ctx, 'O', X(o.u), y0 + 14, { color: c.ink, size: fs, weight: 700, align: 'center' }); }
      if (isFinite(o.v) && (isFinite(o.u) || o.sh.one) && X(o.v) > 4 && X(o.v) < W - 4) { D.circle(ctx, X(o.v), y0, 4.5, null, c.success, 2.5); D.text(ctx, 'I', X(o.v), y0 - 13, { color: c.success, size: fs, weight: 800, align: 'center' }); }
      if (isFinite(o.v) && (isFinite(o.u) || o.sh.one)) offEdge(o.v, 'image I'); else if (!o.sh.one && isFinite(o.f)) offEdge(o.f, 'F₂');
      if (isFinite(o.u)) offEdge(o.u, 'object O');
      if (stretch > 1.2) D.text(ctx, 'heights drawn ' + M.fmt(stretch, 1) + '× bigger than lengths', W - 6, 38, { color: c.faint, size: fs - 2, align: 'right' });
      // headline formula with numbers
      var head;
      if (o.sh.one) head = 'n₂/v − n₁/u = (n₂ − n₁)/R:  ' + o.n.toFixed(2) + '/v − ' + o.nm.toFixed(2) + '/' + (isFinite(o.u) ? '(' + M.fmt(o.u, 0) + ')' : '∞') + ' = ' + M.fmt(o.n - o.nm, 2) + '/' + M.fmt(o.R1, 0) + '  →  v = ' + (isFinite(o.v) ? M.fmt(o.v, 1) + ' cm' : '∞');
      else head = '1/f = (' + o.n.toFixed(2) + '/' + o.nm.toFixed(2) + ' − 1)(1/' + M.fmt(o.R1, 0) + ' − 1/' + (isFinite(o.R2) ? M.fmt(o.R2, 0) : '∞') + ')  →  f = ' + (isFinite(o.f) ? M.fmt(o.f, 1) + ' cm' : '∞');
      D.text(ctx, head, W / 2, 14, { color: c.bg, bg: c.s3, size: fitSize(ctx, head, fs + 0.5, W - 16), weight: 700, align: 'center', pad: 4, fit: W });
      var note = o.n === o.nm ? 'Same index as the liquid: the lens disappears!' : (o.n < o.nm && !o.sh.one ? 'Lens is optically rarer than the liquid: it acts the opposite way' : 'Colour: blue = near the axis, orange = edge rays');
      D.text(ctx, note, W / 2, H - 10, { color: o.n <= o.nm ? c.warning : c.muted, size: fitSize(ctx, note, fs - 0.5, W - 16), weight: 600, align: 'center', fit: W });
    }
  });

  function showU(p) { var el = document.getElementById('ctl-u'), box = el && el.closest('.control'); if (box) box.style.display = p.src === 'point' ? '' : 'none'; }
  function fitSize(ctx, str, size, maxW) {
    ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 8.5 && ctx.measureText(str).width > maxW) { size -= 0.5; ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif'; }
    return size;
  }
})();
