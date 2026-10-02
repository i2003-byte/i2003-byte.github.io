/* =====================================================================
   Light: reflection and refraction · Refraction through a Glass Slab — sim.js
   ---------------------------------------------------------------------
   Top view of a rectangular slab (glass, water, acrylic or diamond).
   A ray enters the top face at A with angle of incidence i and bends
   towards the normal (angle of refraction r), then leaves the bottom
   face at B and bends away from the normal (angle of emergence e).
     Snell's law      sin i ÷ sin r = n   (refractive index of the slab)
     parallel faces → e = i, the emergent ray is parallel to the incident ray
     lateral shift    d = t sin(i − r) ÷ cos r
     speed in slab    v = c ÷ n
   The chart plots sin i against sin r; recorded readings fall on a
   straight line through the origin whose slope is n.
   Simplifications: one colour of light (no dispersion) and the weak
   reflected rays at each face are not drawn.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var NS = { water: 1.33, acrylic: 1.49, glass: 1.52, flint: 1.65, diamond: 2.42 };
  var NAME = { water: 'water', acrylic: 'acrylic', glass: 'crown glass', flint: 'flint glass', diamond: 'diamond' };
  var AX = -4, LR = 9, XL = -15, XR = 17, YT = 10, YB = 21, readings = [], drag = false;

  function geom(p) {
    var n = NS[p.mat], i = M.rad(p.i), r = Math.asin(Math.sin(i) / n), t = p.t;
    var A = { x: AX, y: 0 }, B = { x: AX + t * Math.tan(r), y: t };
    var S = { x: A.x - LR * Math.sin(i), y: -LR * Math.cos(i) }, E = { x: B.x + LR * Math.sin(i), y: t + LR * Math.cos(i) };
    var d = t * Math.sin(i - r) / Math.cos(r);
    return { n: n, i: i, r: r, A: A, B: B, S: S, E: E, d: d };
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, top = 34, sw, sh, cx0, cy0, cw, ch;
    if (narrow) { sw = W - 16; sh = Math.round(H * 0.64) - top; cx0 = 44; cy0 = top + sh + 30; cw = W - cx0 - 16; ch = H - cy0 - 46; }
    else { sw = Math.round(W * 0.62); sh = H - top - 14; cx0 = sw + 60; cy0 = top + 34; cw = W - cx0 - 20; ch = H - cy0 - 56; }
    var k = Math.min(sw / (XR - XL), sh / (YT + YB));
    var ox = 8 + (sw - k * (XR - XL)) / 2 - XL * k, oy = top + (sh - k * (YT + YB)) / 2 + YT * k;
    return { k: k, ox: ox, oy: oy, sw: sw, top: top, narrow: narrow, cx0: cx0, cy0: cy0, cw: cw, ch: ch };
  }

  SimLab.createSim({
    ariaLabel: 'Top view of a ray of light passing through a rectangular glass slab, bending towards the normal on entry and away on exit, with angles, the lateral shift and a sin i against sin r chart',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'i', label: 'Angle of incidence i', min: 0, max: 85, step: 1, value: 40, unit: '°',
        presets: [{ label: '0°', value: 0 }, { label: '30°', value: 30 }, { label: '45°', value: 45 }, { label: '60°', value: 60 }],
        help: 'You can also drag the incoming ray on the diagram.' },
      { id: 'mat', label: 'Slab made of', type: 'select', value: 'glass', options: [
        { value: 'water', label: 'Water in a thin clear box (n = 1.33)' }, { value: 'acrylic', label: 'Acrylic / perspex (n = 1.49)' },
        { value: 'glass', label: 'Crown glass (n = 1.52)' }, { value: 'flint', label: 'Dense flint glass (n = 1.65)' },
        { value: 'diamond', label: 'Diamond (n = 2.42)' }] },
      { id: 't', label: 'Thickness of the slab t', min: 2, max: 10, step: 0.5, value: 6, unit: 'cm' }
    ],
    buttonsTitle: 'Measure like in the lab',
    buttons: [
      { label: 'Record this reading', primary: true, onClick: function (sim) {
        if (sim.p.i > 0 && !readings.some(function (q) { return q.i === sim.p.i; })) readings.push({ i: sim.p.i, mat: sim.p.mat });
      } },
      { label: 'Clear readings', onClick: function () { readings = []; } }
    ],
    readouts: [
      { id: 'i', label: 'Angle of incidence i', unit: '°', digits: 1 },
      { id: 'r', label: 'Angle of refraction r', unit: '°', digits: 1, key: true },
      { id: 'e', label: 'Angle of emergence e', unit: '°', digits: 1 },
      { id: 'ratio', label: 'sin i ÷ sin r', digits: 3 },
      { id: 'd', label: 'Lateral shift d', unit: 'mm', digits: 1 },
      { id: 'v', label: 'Speed of light in the slab c ÷ n', unit: 'km/s', digits: 0 }
    ],
    onParam: function (sim, id) { if (id === 'mat') readings = []; return true; },
    reset: function () {},
    readout: function (sim) {
      var g = geom(sim.p);
      return { i: sim.p.i, r: M.deg(g.r), e: sim.p.i, ratio: sim.p.i > 0 ? Math.sin(g.i) / Math.sin(g.r) : '—', d: g.d * 10, v: 299792 / g.n };
    },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim);
        drag = x < L.sw + 8 && y < L.oy - 4 && y > L.top;
        if (drag) this.move(sim, x, y);
        return drag;
      },
      move: function (sim, x, y) {
        if (!drag) return;
        var L = layout(sim), ax = L.ox + AX * L.k, dx = ax - x, dy = L.oy - y;
        if (dy < 2) dy = 2;
        sim.setParam('i', M.clamp(Math.round(M.deg(Math.atan2(Math.max(0, dx), dy))), 0, 85));
      },
      up: function () { drag = false; },
      hover: function (sim, x, y) { var L = layout(sim); return x < L.sw + 8 && y < L.oy - 4 && y > L.top; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p;
      D.clear(ctx, W, H, c.bg);
      var L = layout(sim), g = geom(p), k = L.k, narrow = L.narrow;
      function X(x) { return L.ox + x * k; }
      function Y(y) { return L.oy + y * k; }
      var ray = c.light ? '#dc2626' : '#f87171';

      var head = 'sin i ÷ sin r = n:  sin ' + p.i + '° ÷ sin ' + M.fmt(M.deg(g.r), 1) + '° = ' + (p.i > 0 ? M.fmt(g.n, 2) : '— (no bending at 0°)');
      var hs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(head).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, head, W / 2, 15, { color: c.bg, bg: c.s3, size: hs, weight: 700, align: 'center', pad: 4, fit: W });

      // slab
      var sx0 = X(XL) - 4, sx1 = X(XR) + 4;
      ctx.save(); ctx.fillStyle = D.alpha(p.mat === 'water' ? '#38bdf8' : p.mat === 'diamond' ? '#e0f2fe' : '#7dd3fc', p.mat === 'diamond' ? 0.22 : 0.18);
      ctx.fillRect(sx0, Y(0), sx1 - sx0, p.t * k); ctx.restore();
      D.line(ctx, sx0, Y(0), sx1, Y(0), D.alpha(c.s1, 0.9), 2); D.line(ctx, sx0, Y(p.t), sx1, Y(p.t), D.alpha(c.s1, 0.9), 2);
      D.text(ctx, (narrow ? NAME[p.mat] : NAME[p.mat] + ' slab') + ', n = ' + g.n, sx1 - 4, Y(0) + 11, { color: c.s1, size: narrow ? 10 : 11, weight: 600, align: 'right', fit: W });
      D.text(ctx, 'air', sx0 + 4, Y(0) - 10, { color: c.faint, size: 10.5 });
      D.text(ctx, 'air', sx0 + 4, Y(p.t) + 12, { color: c.faint, size: 10.5 });
      // thickness marker
      var tmx = sx0 + (narrow ? 34 : 44);
      D.arrow(ctx, tmx, Y(p.t / 2), tmx, Y(0) + 1, c.faint, 1, 5); D.arrow(ctx, tmx, Y(p.t / 2), tmx, Y(p.t) - 1, c.faint, 1, 5);
      D.text(ctx, 't = ' + p.t + ' cm', tmx + 5, Y(p.t / 2), { color: c.faint, size: 10 });

      // normals
      var nl = 4.5;
      D.line(ctx, X(g.A.x), Y(-nl), X(g.A.x), Y(Math.min(p.t, nl)), c.muted, 1.2, [5, 4]);
      D.line(ctx, X(g.B.x), Y(p.t - Math.min(p.t, nl)), X(g.B.x), Y(p.t + nl), c.muted, 1.2, [5, 4]);
      D.text(ctx, 'normal', X(g.A.x), Y(-nl) - 8, { color: c.faint, size: 10, align: 'center' });

      // dashed continuation of the incident ray and the lateral shift
      var u = { x: Math.sin(g.i), y: Math.cos(g.i) };
      D.line(ctx, X(g.A.x), Y(0), X(g.A.x + u.x * (p.t / u.y + LR)), Y(p.t + LR * u.y), D.alpha(c.muted, 0.8), 1.3, [3, 4]);
      if (g.d > 0.05) {
        var along = (g.B.x - g.A.x) * u.x + (g.B.y - g.A.y) * u.y, F = { x: g.A.x + along * u.x, y: g.A.y + along * u.y };
        // move the marker a little down the emergent ray so it sits below the slab
        var off = 2.2, Bq = { x: g.B.x + u.x * off, y: g.B.y + u.y * off }, Fq = { x: F.x + u.x * off, y: F.y + u.y * off };
        D.arrow(ctx, (X(Bq.x) + X(Fq.x)) / 2, (Y(Bq.y) + Y(Fq.y)) / 2, X(Fq.x), Y(Fq.y), c.warning, 1.5, 6);
        D.arrow(ctx, (X(Bq.x) + X(Fq.x)) / 2, (Y(Bq.y) + Y(Fq.y)) / 2, X(Bq.x), Y(Bq.y), c.warning, 1.5, 6);
        D.text(ctx, 'd = ' + M.fmt(g.d * 10, 1) + ' mm', X(Fq.x) + 8, Y(Fq.y) - 4, { color: c.warning, size: 11, weight: 700, align: 'left', bg: D.alpha(c.bg, 0.8), fit: W });
      }

      // the ray
      function seg(P1, P2) { D.line(ctx, X(P1.x), Y(P1.y), X(P2.x), Y(P2.y), ray, 3); var mx = (X(P1.x) + X(P2.x)) / 2, my = (Y(P1.y) + Y(P2.y)) / 2, a = Math.atan2(Y(P2.y) - Y(P1.y), X(P2.x) - X(P1.x)); D.arrow(ctx, mx - Math.cos(a) * 7, my - Math.sin(a) * 7, mx + Math.cos(a) * 4, my + Math.sin(a) * 4, ray, 2, 9); }
      seg(g.S, g.A); seg(g.A, g.B); seg(g.B, g.E);
      // ray box at the start
      ctx.save(); ctx.translate(X(g.S.x), Y(g.S.y)); ctx.rotate(Math.atan2(u.y, u.x));
      D.roundRect(ctx, -26, -7, 26, 14, 3, c.surface2, c.ink, 1.2); ctx.restore();

      // angle arcs and labels
      function arc(cx, cy, a0, a1, col, lab, rad) {
        if (Math.abs(a1 - a0) < 0.01) return;
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, cy, rad, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); ctx.restore();
        var am = (a0 + a1) / 2;
        D.text(ctx, lab, cx + (rad + 14) * Math.cos(am), cy + (rad + 12) * Math.sin(am), { color: col, size: 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), fit: W });
      }
      var up = -Math.PI / 2, dn = Math.PI / 2, rad = narrow ? 24 : 30;
      arc(X(g.A.x), Y(0), up, up - g.i, c.s3, 'i = ' + p.i + '°', rad);
      arc(X(g.A.x), Y(0), dn, dn - g.r, c.s4, 'r = ' + M.fmt(M.deg(g.r), 1) + '°', rad);
      arc(X(g.B.x), Y(p.t), dn, dn - g.i, c.s3, 'e = ' + p.i + '°', rad);
      if (p.i === 0) D.text(ctx, 'Along the normal the ray goes straight through', (X(XL) + X(XR)) / 2, Y(p.t + 7.5), { color: c.muted, size: 11, weight: 600, align: 'center', fit: W });
      else D.text(ctx, narrow ? 'Bends towards the normal going in, away coming out' : 'Bends towards the normal going in, away from it coming out: e = i', (X(XL) + X(XR)) / 2, Y(p.t + LR * 0.9) + 14 > H - 8 ? H - 10 : Y(p.t + LR * 0.9) + 14, { color: c.muted, size: narrow ? 10.5 : 11.5, weight: 600, align: 'center', fit: L.sw + 8 });

      // chart: sin i against sin r
      var x0 = L.cx0, y1 = L.cy0 + L.ch, cw = L.cw, ch = L.ch;
      function CX(v) { return x0 + v * cw; }
      function CY(v) { return y1 - v * ch; }
      if (narrow) D.line(ctx, 8, L.cy0 - 22, W - 8, L.cy0 - 22, c.grid, 1);
      D.text(ctx, 'sin i against sin r (slope = n)', x0 + cw / 2, L.cy0 - 10, { color: c.muted, size: narrow ? 10.5 : 12, weight: 600, align: 'center', fit: W });
      D.line(ctx, x0, CY(0), x0 + cw, CY(0), c.axis, 1.2); D.line(ctx, x0, CY(0), x0, CY(1), c.axis, 1.2);
      [0.5, 1].forEach(function (v) {
        D.line(ctx, x0, CY(v), x0 + cw, CY(v), c.grid, 1); D.line(ctx, CX(v), CY(0), CX(v), CY(1), c.grid, 1);
        D.text(ctx, v === 1 ? '1' : '0.5', x0 - 5, CY(v), { color: c.faint, size: 10, align: 'right' });
        D.text(ctx, v === 1 ? '1' : '0.5', CX(v), CY(0) + 11, { color: c.faint, size: 10, align: 'center' });
      });
      D.text(ctx, '0', x0 - 5, CY(0), { color: c.faint, size: 10, align: 'right' });
      D.text(ctx, 'sin r →', x0 + cw, CY(0) + 24, { color: c.faint, size: 10, align: 'right' });
      D.text(ctx, 'sin i', x0 - 5, CY(1) - 12, { color: c.faint, size: 10, align: 'center' });
      D.line(ctx, CX(0), CY(0), CX(1 / g.n), CY(1), D.alpha(c.s1, 0.8), 2);
      readings.forEach(function (q) {
        var ii = M.rad(q.i), rr = Math.asin(Math.sin(ii) / NS[q.mat]);
        D.circle(ctx, CX(Math.sin(rr)), CY(Math.sin(ii)), 4, c.s2, c.bg, 1);
      });
      D.circle(ctx, CX(Math.sin(g.r)), CY(Math.sin(g.i)), 5.5, null, c.s3, 2);
      D.text(ctx, readings.length ? readings.length + ' reading' + (readings.length > 1 ? 's' : '') + ' recorded' : 'Press "Record this reading" at a few angles', x0 + cw / 2, y1 + 38, { color: c.faint, size: 10, align: 'center', fit: W });
    }
  });
})();
