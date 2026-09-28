/* =====================================================================
   Light · Plane Mirror and Lateral Inversion — sim.js
   ---------------------------------------------------------------------
   Top view of a plane mirror. Light from the object O reflects off the
   mirror into the eye with  angle of incidence i = angle of reflection r
   (both measured from the normal). Traced backwards, every reflected
   ray seems to come from one point I behind the mirror: the image.
     image distance = object distance, on the same perpendicular line
     image: virtual, upright, same size, laterally inverted (left ↔ right)
   The reflection point P is where the straight line from I to the eye
   crosses the mirror; if P is off the mirror, the eye can't see the
   image. The strip below the diagram shows a word card and how it looks
   in the mirror (flipped left to right).
   Scene units are cm: mirror along x = 0, object in front (x < 0).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var WX = 200, WY = 120; // world size (cm)
  var obj = { y: -32 }, eye = { x: -62, y: 34 }, drag = null;

  function geom(p) {
    var O = { x: -p.d, y: obj.y }, I = { x: p.d, y: obj.y }, E = eye;
    var t = (0 - I.x) / (E.x - I.x), Py = I.y + (E.y - I.y) * t; // line I→E meets x = 0
    var ok = Math.abs(Py) <= p.len / 2;
    var i = M.deg(Math.atan2(Math.abs(O.y - Py), -O.x)), r = M.deg(Math.atan2(Math.abs(E.y - Py), -E.x));
    return { O: O, I: I, E: E, P: { x: 0, y: Py }, ok: ok, i: i, r: r };
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, stripH = Math.max(70, Math.min(110, H * 0.26)), top = 28;
    var k = Math.min((W - 20) / WX, (H - top - stripH - 10) / WY);
    return { k: k, cx: W / 2, cy: top + (H - top - stripH - 10) / 2, stripY: H - stripH, stripH: stripH };
  }

  SimLab.createSim({
    ariaLabel: 'Top view of a plane mirror with an object, its image behind the mirror, an eye and reflected light rays, plus a word card and its mirror image',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'd', label: 'Object distance from mirror', min: 10, max: 90, step: 1, value: 40, unit: 'cm',
        help: 'You can also drag the object (red dot) and the eye on the diagram.' },
      { id: 'len', label: 'Mirror length', min: 20, max: 110, step: 5, value: 80, unit: 'cm' },
      { id: 'word', label: 'Word on the card', type: 'select', value: 'AMBULANCE', options: [
        { value: 'AMBULANCE', label: 'AMBULANCE' }, { value: 'SimLab', label: 'SimLab' }, { value: 'b d p q', label: 'b d p q' },
        { value: 'MOM', label: 'MOM' }, { value: 'TOYOTA', label: 'TOYOTA' }, { value: '2026', label: '2026' }] },
      { id: 'fan', label: 'Show many rays from the object', type: 'toggle', value: false },
      { id: 'angles', label: 'Show normal and angles', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'u', label: 'Object distance', unit: 'cm', digits: 0 },
      { id: 'v', label: 'Image distance (behind mirror)', unit: 'cm', digits: 0, key: true },
      { id: 'i', label: 'Angle of incidence i', unit: '°', digits: 1 },
      { id: 'r', label: 'Angle of reflection r', unit: '°', digits: 1 },
      { id: 'img', label: 'Image' }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var g = geom(sim.p);
      return { u: sim.p.d, v: sim.p.d, i: g.ok ? g.i : '—', r: g.ok ? g.r : '—', img: 'Virtual, upright, same size' };
    },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim), g = geom(sim.p);
        function near(q) { return Math.hypot(L.cx + q.x * L.k - x, L.cy + q.y * L.k - y) < 28; }
        drag = near(g.O) ? 'obj' : near(g.E) ? 'eye' : null;
        return drag ? true : false;
      },
      move: function (sim, x, y) {
        var L = layout(sim), wx = M.clamp((x - L.cx) / L.k, -95, -5), wy = M.clamp((y - L.cy) / L.k, -WY / 2 + 4, WY / 2 - 4);
        if (drag === 'obj') { obj.y = wy; sim.setParam('d', M.clamp(Math.round(-wx), 10, 90)); }
        else if (drag === 'eye') { eye.x = wx; eye.y = wy; }
      },
      up: function () { drag = null; },
      hover: function (sim, x, y) {
        var L = layout(sim), g = geom(sim.p);
        return [g.O, g.E].some(function (q) { return Math.hypot(L.cx + q.x * L.k - x, L.cy + q.y * L.k - y) < 28; });
      }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, L = layout(sim), k = L.k, g = geom(p);
      D.clear(ctx, W, H, c.bg);
      function X(u) { return L.cx + u * k; } function Y(v) { return L.cy + v * k; }
      var ray = c.warning, objCol = c.danger;

      // "behind the mirror" shading and the mirror (silvered back hatched)
      ctx.fillStyle = D.alpha(c.s1, c.light ? 0.06 : 0.08); ctx.fillRect(X(0), Y(-WY / 2), WX / 2 * k, WY * k);
      D.text(ctx, 'behind the mirror', X(WX / 4), Y(-WY / 2) + 10, { color: c.faint, size: 11, align: 'center', fit: W });
      D.text(ctx, 'in front', X(-WX / 4), Y(-WY / 2) + 10, { color: c.faint, size: 11, align: 'center', fit: W });
      var m0 = Y(-p.len / 2), m1 = Y(p.len / 2);
      ctx.save(); ctx.strokeStyle = c.faint; ctx.lineWidth = 1; ctx.beginPath();
      for (var hy = m0; hy < m1; hy += 7) { ctx.moveTo(X(0), hy); ctx.lineTo(X(0) + 7, hy + 7); }
      ctx.stroke(); ctx.restore();
      D.line(ctx, X(0), m0, X(0), m1, c.light ? '#0ea5e9' : '#7dd3fc', 4);

      // perpendicular O–I with equal distances
      D.line(ctx, X(g.O.x), Y(g.O.y), X(g.I.x), Y(g.I.y), c.grid, 1.2, [5, 4]);
      D.text(ctx, p.d + ' cm', X(-p.d / 2), Y(g.O.y) - 10, { color: c.muted, size: 11, weight: 600, align: 'center', fit: W });
      D.text(ctx, p.d + ' cm', X(p.d / 2), Y(g.O.y) - 10, { color: c.muted, size: 11, weight: 600, align: 'center', fit: W });

      // many rays: reflected rays spread out; their backward extensions meet at I
      if (p.fan) {
        for (var j = 0; j < 9; j++) {
          var py = -p.len / 2 + p.len * (j + 0.5) / 9, dx = -g.O.x, dy = py - g.O.y;
          var ex = -dx, ey = dy, s = 400 / Math.hypot(ex, ey);
          D.line(ctx, X(g.O.x), Y(g.O.y), X(0), Y(py), D.alpha(ray, 0.45), 1.2);
          D.line(ctx, X(0), Y(py), X(ex * s), Y(py + ey * s), D.alpha(ray, 0.45), 1.2);
          D.line(ctx, X(0), Y(py), X(g.I.x), Y(g.I.y), D.alpha(c.muted, 0.4), 1, [3, 4]);
        }
      }

      // the ray that reaches the eye
      if (g.ok) {
        var Px = X(0), Py = Y(g.P.y);
        D.line(ctx, Px, Py, X(g.I.x), Y(g.I.y), c.muted, 1.4, [5, 5]);
        D.line(ctx, X(g.O.x), Y(g.O.y), Px, Py, ray, 2.4);
        D.line(ctx, Px, Py, X(g.E.x), Y(g.E.y), ray, 2.4);
        D.arrow(ctx, M.lerp(X(g.O.x), Px, 0.4), M.lerp(Y(g.O.y), Py, 0.4), M.lerp(X(g.O.x), Px, 0.55), M.lerp(Y(g.O.y), Py, 0.55), ray, 2.4, 10);
        D.arrow(ctx, M.lerp(Px, X(g.E.x), 0.45), M.lerp(Py, Y(g.E.y), 0.45), M.lerp(Px, X(g.E.x), 0.6), M.lerp(Py, Y(g.E.y), 0.6), ray, 2.4, 10);
        if (p.angles) {
          var nl = Math.min(34 * k, 90);
          D.line(ctx, Px - nl, Py, Px, Py, c.text, 1.2, [3, 3]);
          D.text(ctx, 'normal', Px - nl - 2, Py, { color: c.muted, size: 10, align: 'right', fit: W });
          var aIn = Math.atan2(Y(g.O.y) - Py, X(g.O.x) - Px), aOut = Math.atan2(Y(g.E.y) - Py, X(g.E.x) - Px), R = Math.min(28, nl * 0.7);
          ctx.save(); ctx.lineWidth = 1.6;
          ctx.strokeStyle = c.s2; ctx.beginPath(); ctx.arc(Px, Py, R, Math.min(Math.PI, aIn < 0 ? aIn + 2 * Math.PI : aIn), Math.max(Math.PI, aIn < 0 ? aIn + 2 * Math.PI : aIn)); ctx.stroke();
          ctx.strokeStyle = c.s3; ctx.beginPath(); ctx.arc(Px, Py, R + 5, Math.min(Math.PI, aOut < 0 ? aOut + 2 * Math.PI : aOut), Math.max(Math.PI, aOut < 0 ? aOut + 2 * Math.PI : aOut)); ctx.stroke();
          ctx.restore();
          var la = function (a, rr) { var m = (Math.PI + (a < 0 ? a + 2 * Math.PI : a)) / 2; return { x: Px + Math.cos(m) * rr, y: Py + Math.sin(m) * rr }; };
          var li = la(aIn, R + 18), lr = la(aOut, R + 20);
          D.text(ctx, 'i = ' + M.fmt(g.i, 0) + '°', li.x, li.y, { color: c.s2, size: 11, weight: 700, align: 'right', bg: c.bg, pad: 2, fit: W });
          D.text(ctx, 'r = ' + M.fmt(g.r, 0) + '°', lr.x, lr.y, { color: c.s3, size: 11, weight: 700, align: 'right', bg: c.bg, pad: 2, fit: W });
        }
      }

      // object, image, eye
      D.circle(ctx, X(g.O.x), Y(g.O.y), 9, objCol, c.bg, 2);
      D.text(ctx, 'O', X(g.O.x), Y(g.O.y) + 20, { color: c.text, size: 12, weight: 700, align: 'center' });
      ctx.save(); ctx.globalAlpha = 0.5; D.circle(ctx, X(g.I.x), Y(g.I.y), 9, objCol); ctx.restore();
      D.circle(ctx, X(g.I.x), Y(g.I.y), 9, null, c.text, 1.2);
      D.text(ctx, 'I (image)', X(g.I.x), Y(g.I.y) + 20, { color: c.muted, size: 11, weight: 600, align: 'center', fit: W });
      var ex0 = X(g.E.x), ey0 = Y(g.E.y), look = g.ok ? Math.atan2(Y(g.P.y) - ey0, X(0) - ex0) : 0;
      ctx.save(); ctx.translate(ex0, ey0); ctx.rotate(look);
      ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = c.ink; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -11, 14, 0); ctx.quadraticCurveTo(0, 11, -14, 0); ctx.fill(); ctx.stroke();
      D.circle(ctx, 4, 0, 5, '#1d4ed8'); D.circle(ctx, 5, 0, 2.2, '#0f172a');
      ctx.restore();
      D.text(ctx, 'eye', ex0, ey0 + 20, { color: c.text, size: 12, weight: 700, align: 'center', fit: W });

      // headline
      var msg = g.ok ? 'i = r · the image is ' + p.d + ' cm behind the mirror' : 'The eye can’t see the image here';
      D.text(ctx, msg, W / 2, 13, { color: g.ok ? c.success : c.warning, size: W < 560 ? 11 : 14, weight: 700, align: 'center', fit: W });

      // word strip: card vs mirror image
      var sy = L.stripY, sh = L.stripH, half = W / 2;
      D.line(ctx, 10, sy - 4, W - 10, sy - 4, c.grid, 1);
      var fs = Math.min(sh * 0.36, (half - 40) / (p.word.length * 0.8));
      D.text(ctx, 'Card you hold', half / 2, sy + 12, { color: c.muted, size: 11, align: 'center' });
      D.text(ctx, 'In the mirror', half + half / 2, sy + 12, { color: c.muted, size: 11, align: 'center' });
      D.roundRect(ctx, 14, sy + 24, half - 28, sh - 32, 8, '#f8fafc', c.border, 1);
      D.roundRect(ctx, half + 14, sy + 24, half - 28, sh - 32, 8, c.light ? '#e0f2fe' : '#bae6fd', c.border, 1);
      D.text(ctx, p.word, half / 2, sy + 24 + (sh - 32) / 2, { color: '#b91c1c', size: fs, weight: 800, align: 'center', font: 'Arial, sans-serif' });
      ctx.save(); ctx.translate(half + half / 2, 0); ctx.scale(-1, 1);
      D.text(ctx, p.word, 0, sy + 24 + (sh - 32) / 2, { color: '#b91c1c', size: fs, weight: 800, align: 'center', font: 'Arial, sans-serif' });
      ctx.restore();
    }
  });
})();
