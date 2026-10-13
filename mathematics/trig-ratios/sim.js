/* =====================================================================
   Trigonometry · Trigonometric Ratios — sim.js
   ---------------------------------------------------------------------
   Right triangle ABC, right angle at B, angle θ at A, hypotenuse AC.
   AB = AC·cos θ, BC = AC·sin θ. A chosen ratio colours its two sides
   (numerator and denominator). A similar copy (half size) shows that
   the ratio depends only on the angle. "Look from C" uses the other
   acute angle 90° − θ, so sin θ = cos(90° − θ) etc.
   Model units: cm, y up. Drag C to change θ and the size together.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var RAT = {
    sin: { n: 'opp', d: 'hyp', name: 'sin', words: 'opposite ÷ hypotenuse' },
    cos: { n: 'adj', d: 'hyp', name: 'cos', words: 'adjacent ÷ hypotenuse' },
    tan: { n: 'opp', d: 'adj', name: 'tan', words: 'opposite ÷ adjacent' },
    cosec: { n: 'hyp', d: 'opp', name: 'cosec', words: 'hypotenuse ÷ opposite' },
    sec: { n: 'hyp', d: 'adj', name: 'sec', words: 'hypotenuse ÷ adjacent' },
    cot: { n: 'adj', d: 'opp', name: 'cot', words: 'adjacent ÷ opposite' }
  };
  var ORDER = ['sin', 'cos', 'tan', 'cosec', 'sec', 'cot'];
  var EXACT = {
    30: { sin: '1/2', cos: '√3/2', tan: '1/√3', cosec: '2', sec: '2/√3', cot: '√3' },
    45: { sin: '1/√2', cos: '1/√2', tan: '1', cosec: '√2', sec: '√2', cot: '1' },
    60: { sin: '√3/2', cos: '1/2', tan: '√3', cosec: '2/√3', sec: '2', cot: '1/√3' }
  };

  function geo(p) {
    var t = M.rad(p.theta), h = p.hyp, ab = h * Math.cos(t), bc = h * Math.sin(t);
    var ref = p.fromC ? 90 - p.theta : p.theta;
    // which real side is opposite / adjacent for the reference angle
    var sides = { AB: ab, BC: bc, AC: h };
    var role = p.fromC ? { opp: 'AB', adj: 'BC', hyp: 'AC' } : { opp: 'BC', adj: 'AB', hyp: 'AC' };
    return { ab: ab, bc: bc, h: h, ref: ref, sides: sides, role: role };
  }
  function val(name, ref) {
    var r = M.rad(ref), s = Math.sin(r), c = Math.cos(r);
    return { sin: s, cos: c, tan: s / c, cosec: 1 / s, sec: 1 / c, cot: c / s }[name];
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, wide = W > H * 1.25 && W > 600, narrow = W < 560, top = narrow ? 40 : 46;
    var rw = wide ? W * 0.6 : W, rh = H - top - (wide ? 60 : narrow ? 64 : 72);
    var g = geo(sim.p), maxH = 12;
    var sc = Math.min((rw - 70) / Math.max(g.ab, maxH * 0.35), (rh - 46) / Math.max(g.bc, maxH * 0.2));
    sc = Math.min(sc, (rw - 70) / (maxH * Math.cos(M.rad(sim.p.theta))), (rh - 46) / (maxH * Math.sin(M.rad(sim.p.theta))));
    var ox = (rw - g.ab * sc) / 2, oy = top + (rh + g.bc * sc) / 2 + 4;
    return { W: W, H: H, wide: wide, narrow: narrow, top: top, rw: rw, rh: rh, sc: sc, ox: ox, oy: oy,
      A: { x: ox, y: oy }, B: { x: ox + g.ab * sc, y: oy }, C: { x: ox + g.ab * sc, y: oy - g.bc * sc }, g: g };
  }

  SimLab.createSim({
    ariaLabel: 'A right-angled triangle ABC with the angle theta at A. The sides opposite, adjacent and hypotenuse are labelled with their lengths, and the chosen ratio such as sine is shown as one side divided by another',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'theta', label: 'Angle θ at A', min: 5, max: 85, step: 1, value: 30, unit: '°', presets: [30, 45, 60], help: 'Or drag corner C.' },
      { id: 'hyp', label: 'Size: hypotenuse AC', min: 3, max: 12, step: 0.5, value: 8, unit: 'cm' },
      { id: 'ratio', label: 'Ratio', type: 'select', value: 'sin', options: ORDER.map(function (k) {
        return { value: k, label: k + ' = ' + RAT[k].words };
      }) },
      { id: 'copy', label: 'Show a half-size similar triangle', type: 'toggle', value: false },
      { id: 'fromC', label: 'Look from angle C (90° − θ)', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'ref', label: 'Angle used', unit: '°', digits: 0 },
      { id: 'sin', label: 'sin', digits: 3, key: true },
      { id: 'cos', label: 'cos', digits: 3, key: true },
      { id: 'tan', label: 'tan', digits: 3, key: true },
      { id: 'id', label: 'sin² + cos²', digits: 3 },
      { id: 'ab', label: 'AB', unit: 'cm', digits: 2 },
      { id: 'bc', label: 'BC', unit: 'cm', digits: 2 }
    ],
    reset: function () {},
    readout: function (sim) {
      var g = geo(sim.p), s = val('sin', g.ref), c = val('cos', g.ref);
      return { ref: g.ref, sin: s, cos: c, tan: s / c, id: s * s + c * c, ab: g.ab, bc: g.bc };
    },
    status: function (sim) {
      var g = geo(sim.p), r = RAT[sim.p.ratio];
      return r.name + ' ' + g.ref + '° = ' + M.fmt(val(sim.p.ratio, g.ref), 3);
    },
    pointer: {
      down: function (sim, x, y) { var L = layout(sim); return Math.hypot(x - L.C.x, y - L.C.y) < 40; },
      move: function (sim, x, y) {
        var L = layout(sim), dx = (x - L.ox) / L.sc, dy = (L.oy - y) / L.sc;
        if (dx < 0.2) dx = 0.2; if (dy < 0.2) dy = 0.2;
        sim.setParam('theta', M.clamp(Math.round(M.deg(Math.atan2(dy, dx))), 5, 85));
        sim.setParam('hyp', M.clamp(Math.round(Math.hypot(dx, dy) * 2) / 2, 3, 12));
      },
      hover: function (sim, x, y) { var L = layout(sim); return Math.hypot(x - L.C.x, y - L.C.y) < 40; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, g = L.g, nar = L.narrow;
      var R = RAT[p.ratio], fs = nar ? 11 : 13;
      D.clear(ctx, W, H, c.bg);
      D.grid(ctx, 0, L.top, L.rw, L.rh, 24, D.alpha(c.grid, 0.6));
      var colN = c.s2, colD = c.s1;
      var role = g.role, sideCol = {};
      sideCol[role[R.n]] = colN; sideCol[role[R.d]] = colD;
      var pts = { AB: [L.A, L.B], BC: [L.B, L.C], AC: [L.A, L.C] };

      // the half-size similar copy shares corner A
      if (p.copy) {
        var k = 0.5, B2 = { x: L.A.x + (L.B.x - L.A.x) * k, y: L.A.y }, C2 = { x: B2.x, y: L.A.y - (L.A.y - L.C.y) * k };
        ctx.save(); ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(L.A.x, L.A.y); ctx.lineTo(B2.x, B2.y); ctx.lineTo(C2.x, C2.y); ctx.closePath();
        ctx.fillStyle = D.alpha(c.s3, 0.12); ctx.fill(); ctx.strokeStyle = c.s3; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        D.text(ctx, 'C′', C2.x + 6, C2.y - 6, { color: c.s3, size: fs, weight: 700 });
        D.text(ctx, 'B′', B2.x, B2.y + 12, { color: c.s3, size: fs, weight: 700, align: 'center' });
      }
      // triangle fill + sides
      ctx.beginPath(); ctx.moveTo(L.A.x, L.A.y); ctx.lineTo(L.B.x, L.B.y); ctx.lineTo(L.C.x, L.C.y); ctx.closePath();
      ctx.fillStyle = D.alpha(c.ink, 0.05); ctx.fill();
      ['AB', 'BC', 'AC'].forEach(function (s) {
        var q = pts[s], col = sideCol[s];
        D.line(ctx, q[0].x, q[0].y, q[1].x, q[1].y, col || D.alpha(c.ink, 0.7), col ? 5 : 2.5);
      });
      // right angle at B
      var rs = Math.min(14, (L.B.x - L.A.x) * 0.3, (L.B.y - L.C.y) * 0.3);
      ctx.strokeStyle = c.ink; ctx.lineWidth = 1.5; ctx.strokeRect(L.B.x - rs, L.B.y - rs, rs, rs);
      // angle arcs
      var ra = M.clamp(Math.min(L.B.x - L.A.x, L.B.y - L.C.y) * 0.35, 18, 46);
      var th = M.rad(p.theta);
      ctx.beginPath(); ctx.moveTo(L.A.x, L.A.y); ctx.arc(L.A.x, L.A.y, ra, -th, 0); ctx.closePath();
      ctx.fillStyle = D.alpha(c.warning, p.fromC ? 0.15 : 0.4); ctx.fill();
      var rc = Math.min(ra, 34);
      ctx.beginPath(); ctx.moveTo(L.C.x, L.C.y); ctx.arc(L.C.x, L.C.y, rc, Math.PI / 2, Math.PI / 2 + (Math.PI / 2 - th)); ctx.closePath();
      ctx.fillStyle = D.alpha(c.s4, p.fromC ? 0.4 : 0.15); ctx.fill();
      D.text(ctx, p.theta + '°', L.A.x + (ra + 16) * Math.cos(th / 2), L.A.y - (ra + 12) * Math.sin(th / 2), { color: c.warning, size: fs, weight: 700, align: 'center' });
      var mc = Math.PI / 2 + (Math.PI / 2 - th) / 2;
      D.text(ctx, (90 - p.theta) + '°', L.C.x + (rc + 14) * Math.cos(mc), L.C.y + (rc + 12) * Math.sin(mc), { color: c.s4, size: fs, weight: 700, align: 'center' });
      // vertex letters
      D.text(ctx, 'A', L.A.x - 12, L.A.y + 10, { color: c.ink, size: fs + 2, weight: 700, align: 'center' });
      D.text(ctx, 'B', L.B.x + 12, L.B.y + 10, { color: c.ink, size: fs + 2, weight: 700, align: 'center', fit: L.rw });
      D.text(ctx, 'C', L.C.x + 14, L.C.y - 4, { color: c.ink, size: fs + 2, weight: 700, align: 'center', fit: L.rw });
      D.circle(ctx, L.C.x, L.C.y, 6, c.ink, c.bg, 2);
      // side labels: role + length
      var roleOf = {}; roleOf[role.opp] = 'opposite'; roleOf[role.adj] = 'adjacent'; roleOf[role.hyp] = 'hypotenuse';
      function sideLabel(s, x, y, align) {
        var col = sideCol[s] || c.muted;
        D.text(ctx, roleOf[s], x, y, { color: col, size: fs, weight: 700, align: align, fit: L.rw });
        D.text(ctx, s + ' = ' + M.fmt(g.sides[s], 2) + ' cm', x, y + fs + 3, { color: col, size: fs - 1, align: align, fit: L.rw });
      }
      sideLabel('AB', (L.A.x + L.B.x) / 2, L.A.y + 16, 'center');
      sideLabel('BC', L.B.x + 10, (L.B.y + L.C.y) / 2 - 6, 'left');
      var mx = (L.A.x + L.C.x) / 2, my = (L.A.y + L.C.y) / 2;
      var nx = -Math.sin(th), ny = -Math.cos(th);  // outward normal of AC (up-left on screen)
      sideLabel('AC', mx + nx * 16 - 6, my + ny * 22 - 6, 'right');

      // the ratio as a fraction
      var ang = (p.fromC ? 'C' : 'A'), refTxt = R.name + ' ' + g.ref + '°';
      var nS = role[R.n], dS = role[R.d], v = val(p.ratio, g.ref);
      var line1 = refTxt + ' = ' + nS + ' ÷ ' + dS + ' = ' + M.fmt(g.sides[nS], 2) + ' ÷ ' + M.fmt(g.sides[dS], 2) + ' = ' + M.fmt(v, 3);
      var ex = EXACT[g.ref] && EXACT[g.ref][p.ratio];
      var line2 = p.copy ? 'Half-size triangle: ' + M.fmt(g.sides[nS] / 2, 2) + ' ÷ ' + M.fmt(g.sides[dS] / 2, 2) + ' = ' + M.fmt(v, 3) + ' (same!)'
        : (ex ? 'Exact value: ' + R.name + ' ' + g.ref + '° = ' + ex : R.name + ' = ' + R.words + ' (seen from angle ' + ang + ')');
      if (L.wide) {
        // table of all six ratios
        var px = L.rw + 8, pw = W - px - 12, py = L.top + 4, rowH = Math.min(46, (H - py - 60) / 6);
        D.text(ctx, 'All six ratios of ' + g.ref + '°', px, py + 8, { color: c.text, size: 14, weight: 700 });
        ORDER.forEach(function (k, i) {
          var y = py + 26 + i * rowH, on = k === p.ratio, Rk = RAT[k];
          D.roundRect(ctx, px, y, pw, rowH - 6, 8, on ? D.alpha(c.accent, 0.16) : D.alpha(c.ink, 0.05), on ? c.accent : null, 1.5);
          D.text(ctx, k + ' ' + g.ref + '°', px + 10, y + (rowH - 6) / 2, { color: c.text, size: 13, weight: 700 });
          D.text(ctx, role[Rk.n] + '/' + role[Rk.d], px + pw * 0.42, y + (rowH - 6) / 2, { color: c.muted, size: 12 });
          var exk = EXACT[g.ref] && EXACT[g.ref][k];
          D.text(ctx, M.fmt(val(k, g.ref), 3) + (exk ? '  (' + exk + ')' : ''), px + pw - 10, y + (rowH - 6) / 2, { color: on ? c.accent : c.text, size: 13, weight: 700, align: 'right' });
        });
        D.text(ctx, 'cosec = 1/sin · sec = 1/cos · cot = 1/tan', px, H - 18, { color: c.muted, size: 12 });
      }
      // headline + bottom lines
      var hs = nar ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(line1).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, line1, W / 2, 16, { color: c.bg, bg: c.success, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
      var by = L.wide ? H - 40 : H - (nar ? 26 : 30);
      var bx = L.wide ? L.rw / 2 : W / 2;
      D.text(ctx, line2, bx, by, { color: p.copy ? c.s3 : c.text, size: fs, weight: 600, align: 'center', fit: W });
      var ly = by - fs - 10;
      D.text(ctx, '■ ' + nS + ' (top of the fraction)', bx - 8, ly, { color: colN, size: fs - 1, weight: 700, align: 'right' });
      D.text(ctx, '■ ' + dS + ' (bottom)', bx + 8, ly, { color: colD, size: fs - 1, weight: 700, align: 'left' });
    }
  });
})();
