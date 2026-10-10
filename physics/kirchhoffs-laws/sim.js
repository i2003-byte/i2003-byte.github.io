/* =====================================================================
   Electricity · Kirchhoff's Laws in a Two-Loop Circuit — sim.js
   ---------------------------------------------------------------------
   Three branches join at junctions A (top) and B (bottom):
     left   cell E₁ (+ up) and R₁        current I₁, taken upwards
     middle R₃                          current I₃, taken downwards
     right  cell E₂ (+ up, or reversed) and R₂, current I₂ upwards
   Ideal cells (no internal resistance). With V_B = 0 the junction rule
   at A gives
     V_A = (E₁/R₁ + E₂/R₂) / (1/R₁ + 1/R₂ + 1/R₃)
     I₁ = (E₁ − V_A)/R₁,  I₂ = (E₂ − V_A)/R₂,  I₃ = V_A/R₃
   so I₁ + I₂ = I₃, and every loop has  Σ(rises) − Σ(drops) = 0.
   A negative current means it really flows against the arrow.
   Moving dots show conventional current, speed ∝ |I| (capped).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  function solve(p) {
    var e2 = p.flip ? -p.E2 : p.E2;
    var VA = (p.E1 / p.R1 + e2 / p.R2) / (1 / p.R1 + 1 / p.R2 + 1 / p.R3);
    return { e2: e2, VA: VA, I1: (p.E1 - VA) / p.R1, I2: (e2 - VA) / p.R2, I3: VA / p.R3 };
  }
  function sgn(v, d) { return (v < 0 ? '− ' : '+ ') + M.fmt(Math.abs(v), d == null ? 2 : d); }

  function lines(p, o) {
    var f = function (v) { return M.fmt(v, 2); };
    if (p.view === 'junction') return {
      head: 'Junction rule at A: current in = current out',
      a: 'I₁ + I₂ = I₃',
      b: f(o.I1) + ' + ' + (o.I2 < 0 ? '(' + f(o.I2) + ')' : f(o.I2)) + ' = ' + f(o.I3) + ' A'
    };
    var d1 = o.I1 * p.R1, d2 = o.I2 * p.R2, d3 = o.I3 * p.R3;
    if (p.view === 'loop1') return {
      head: 'Loop 1 (left): rises − drops = 0',
      a: '+E₁ − I₁R₁ − I₃R₃ = 0',
      b: sgn(p.E1) + ' ' + sgn(-d1) + ' ' + sgn(-d3) + ' = ' + f(p.E1 - d1 - d3) + ' V'
    };
    if (p.view === 'loop2') return {
      head: 'Loop 2 (right): rises − drops = 0',
      a: (p.flip ? '−E₂' : '+E₂') + ' − I₂R₂ − I₃R₃ = 0',
      b: sgn(o.e2) + ' ' + sgn(-d2) + ' ' + sgn(-d3) + ' = ' + f(o.e2 - d2 - d3) + ' V'
    };
    return {
      head: 'Outer loop: rises − drops = 0',
      a: '+E₁ − I₁R₁ + I₂R₂ ' + (p.flip ? '+ E₂' : '− E₂') + ' = 0',
      b: sgn(p.E1) + ' ' + sgn(-d1) + ' ' + sgn(d2) + ' ' + sgn(-o.e2) + ' = ' + f(p.E1 - d1 + d2 - o.e2) + ' V'
    };
  }

  SimLab.createSim({
    ariaLabel: 'A two-loop circuit with two cells and three resistors, showing the current in each branch, the junction rule and the loop rule',
    transport: false,
    mobileAspect: '4 / 5',
    params: [
      { id: 'view', label: 'Check a rule', type: 'select', value: 'junction', options: [
        { value: 'junction', label: 'Junction rule at A' }, { value: 'loop1', label: 'Loop rule: left loop' },
        { value: 'loop2', label: 'Loop rule: right loop' }, { value: 'outer', label: 'Loop rule: outer loop' }] },
      { id: 'E1', label: 'Cell E₁', min: 1, max: 12, step: 0.5, value: 6, unit: 'V' },
      { id: 'E2', label: 'Cell E₂', min: 1, max: 12, step: 0.5, value: 9, unit: 'V' },
      { id: 'R1', label: 'R₁', min: 1, max: 20, step: 1, value: 2, unit: 'Ω' },
      { id: 'R2', label: 'R₂', min: 1, max: 20, step: 1, value: 4, unit: 'Ω' },
      { id: 'R3', label: 'R₃ (middle)', min: 1, max: 20, step: 1, value: 6, unit: 'Ω' },
      { id: 'flip', label: 'Turn cell E₂ round', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'I1', label: 'I₁ (left branch, up)', short: 'I₁', unit: 'A', digits: 3, key: true },
      { id: 'I2', label: 'I₂ (right branch, up)', short: 'I₂', unit: 'A', digits: 3, key: true },
      { id: 'I3', label: 'I₃ (middle, down)', short: 'I₃', unit: 'A', digits: 3, key: true },
      { id: 'VA', label: 'Potential of A above B', unit: 'V', digits: 2 },
      { id: 'P', label: 'Heat in resistors I²R', unit: 'W', digits: 2 }
    ],
    onParam: function () { return true; },
    reset: function () {},
    animate: function (sim) { return !sim.reduceMotion; },
    readout: function (sim) {
      var p = sim.p, o = solve(p);
      return { I1: o.I1, I2: o.I2, I3: o.I3, VA: o.VA,
        P: o.I1 * o.I1 * p.R1 + o.I2 * o.I2 * p.R2 + o.I3 * o.I3 * p.R3 };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, o = solve(p);
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560, wireC = c.light ? '#334155' : '#cbd5e1';
      var s = narrow ? W * 0.28 : Math.min(W * 0.24, 230);
      var xM = W / 2, xL = xM - s, xR = xM + s, Ty = narrow ? 70 : 78, By = H - (narrow ? 88 : 90);
      var h = By - Ty, fs = narrow ? 11 : 12.5;
      var rLen = Math.min(78, h * 0.3), yRes = Ty + h * 0.3, yCell = Ty + h * 0.72;
      var cols = { 1: c.s1, 2: c.s2, 3: c.s4 };

      // ---- highlighted loop or junction (under the wires)
      var loopPts = p.view === 'loop1' ? [[xL, By], [xL, Ty], [xM, Ty], [xM, By]]
        : p.view === 'loop2' ? [[xR, By], [xR, Ty], [xM, Ty], [xM, By]]
        : p.view === 'outer' ? [[xL, By], [xL, Ty], [xR, Ty], [xR, By]] : null;
      if (loopPts) {
        ctx.save(); ctx.strokeStyle = D.alpha(c.accent, 0.28); ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.beginPath();
        loopPts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.stroke(); ctx.restore();
        // direction we walk round the loop: up through the left (or right) cell
        var lx = p.view === 'outer' ? (xL + xM) / 2 : (loopPts[0][0] + loopPts[2][0]) / 2, ly = Ty + h * 0.82, rr = Math.min(26, s * 0.18);
        var cw = p.view !== 'loop2';
        ctx.save(); ctx.strokeStyle = c.accent; ctx.lineWidth = 2.5; ctx.beginPath();
        ctx.arc(lx, ly, rr, cw ? -2.6 : -0.54, cw ? 1.6 : 1.54, !cw); ctx.stroke(); ctx.restore();
        var ea = cw ? 1.6 : 1.54, ex = lx + rr * Math.cos(ea), ey = ly + rr * Math.sin(ea), ta = ea + (cw ? Math.PI / 2 : -Math.PI / 2);
        D.arrow(ctx, ex - Math.cos(ta) * 6, ey - Math.sin(ta) * 6, ex + Math.cos(ta) * 2, ey + Math.sin(ta) * 2, c.accent, 2.5, 9);
        if (p.view === 'outer') D.text(ctx, 'walk round', lx, ly - rr - 12, { color: c.accent, size: 10.5, weight: 600, align: 'center' });
      } else {
        D.circle(ctx, xM, Ty, 15, D.alpha(c.accent, 0.25));
      }

      // ---- wires
      var segs = [
        { pts: [[xM, By], [xL, By], [xL, Ty], [xM, Ty]], I: o.I1 },
        { pts: [[xM, By], [xR, By], [xR, Ty], [xM, Ty]], I: o.I2 },
        { pts: [[xM, Ty], [xM, By]], I: o.I3 }
      ];
      ctx.save(); ctx.strokeStyle = wireC; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      segs.forEach(function (sg) { ctx.beginPath(); sg.pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); });
      ctx.restore();

      // ---- moving charges (conventional current)
      if (!sim.reduceMotion) segs.forEach(function (sg) {
        var a = Math.abs(sg.I); if (a < 1e-4) return;
        var pts = sg.I > 0 ? sg.pts : sg.pts.slice().reverse();
        var speed = Math.min(220, 60 * a + 12), sp = 24, L = [], len = 0;
        for (var i = 1; i < pts.length; i++) { var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); len += l; }
        for (var d = (now / 1000 * speed) % sp; d < len; d += sp) {
          var q = 0, rem = d; while (q < L.length - 1 && rem > L[q]) { rem -= L[q]; q++; }
          var f = L[q] ? rem / L[q] : 0;
          D.circle(ctx, M.lerp(pts[q][0], pts[q + 1][0], f), M.lerp(pts[q][1], pts[q + 1][1], f), 2.5, c.warning);
        }
      });

      // ---- components
      function resistor(x, k, R, I) {
        var y0 = yRes - rLen / 2, y1 = yRes + rLen / 2, col = cols[k];
        ctx.fillStyle = c.bg; ctx.fillRect(x - 11, y0 - 2, 22, rLen + 4);
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x, y0);
        for (var t = 1; t < 12; t++) ctx.lineTo(x + (t % 2 ? -8 : 8), y0 + 5 + (rLen - 10) * t / 12);
        ctx.lineTo(x, y1 - 5); ctx.lineTo(x, y1); ctx.stroke(); ctx.restore();
        var right = k !== 1, tx = right ? x + 15 : x - 15, al = right ? 'left' : 'right';
        D.text(ctx, 'R' + ['', '₁', '₂', '₃'][k] + ' = ' + R + ' Ω', tx, yRes - 9, { color: col, size: fs, weight: 700, align: al, fit: W });
        D.text(ctx, (narrow ? '' : 'drop ') + M.fmt(Math.abs(I * R), 2) + ' V', tx, yRes + 9, { color: c.muted, size: fs - 0.5, align: al, font: c.mono, fit: W });
      }
      function cell(x, k, E, up) {
        var y = yCell;
        ctx.fillStyle = c.bg; ctx.fillRect(x - 18, y - 13, 36, 26);
        var yl = up ? y - 6 : y + 6, ys = up ? y + 6 : y - 6;
        D.line(ctx, x - 16, yl, x + 16, yl, c.ink, 2.5); D.line(ctx, x - 8, ys, x + 8, ys, c.ink, 5);
        var right = k === 2, tx = right ? x + 22 : x - 22, al = right ? 'left' : 'right';
        D.text(ctx, '+', right ? x - 22 : x + 22, yl, { color: c.danger, size: 14, weight: 800, align: 'center' });
        D.text(ctx, 'E' + (k === 1 ? '₁' : '₂') + ' = ' + M.fmt(E, 1) + ' V', tx, y, { color: c.ink, size: fs, weight: 700, align: al, fit: W });
      }
      resistor(xL, 1, p.R1, o.I1); resistor(xR, 2, p.R2, o.I2);
      var r3 = yRes; yRes = (Ty + By) / 2; resistor(xM, 3, p.R3, o.I3); yRes = r3;
      cell(xL, 1, p.E1, true); cell(xR, 2, p.E2, !p.flip);

      // ---- junction dots and labels
      D.circle(ctx, xM, Ty, 5, c.ink); D.circle(ctx, xM, By, 5, c.ink);
      D.text(ctx, 'A', xM, Ty - 14, { color: c.ink, size: 13, weight: 800, align: 'center' });
      D.text(ctx, 'B', xM, By + 15, { color: c.ink, size: 13, weight: 800, align: 'center' });

      // ---- current arrows (direction taken as positive) with values
      function curArrow(x1, y1, x2, y2, I, name, col, lx, ly, al) {
        var neg = I < -1e-6, ax1 = neg ? x2 : x1, ay1 = neg ? y2 : y1, ax2 = neg ? x1 : x2, ay2 = neg ? y1 : y2;
        D.arrow(ctx, ax1, ay1, ax2, ay2, col, 3, 10);
        D.text(ctx, name + ' = ' + M.fmt(I, 2) + ' A', lx, ly, { color: col, size: fs, weight: 700, align: al, font: c.mono, fit: W });
      }
      var ay = Ty - 22, aw = Math.min(46, s * 0.4);
      curArrow((xL + xM) / 2 - aw / 2, Ty, (xL + xM) / 2 + aw / 2, Ty, o.I1, 'I₁', cols[1], (xL + xM) / 2, ay - (narrow ? 12 : 0), 'center');
      curArrow((xR + xM) / 2 + aw / 2, Ty, (xR + xM) / 2 - aw / 2, Ty, o.I2, 'I₂', cols[2], (xR + xM) / 2, ay - (narrow ? 12 : 0), 'center');
      var iy = Ty + Math.min(40, h * 0.13);
      curArrow(xM, iy - aw / 2 + 6, xM, iy + aw / 2 - 6, o.I3, 'I₃', cols[3], xM - 12, iy, 'right');
      if (o.I1 < -1e-6 || o.I2 < -1e-6) D.text(ctx, 'A minus sign means the current flows the other way', W / 2, H - 52, { color: c.warning, size: narrow ? 10.5 : 11.5, weight: 600, align: 'center', fit: W });

      // ---- headline and the rule in numbers
      var t = lines(p, o);
      D.text(ctx, t.head, W / 2, 15, { color: c.bg, bg: c.accent, size: narrow ? 11.5 : 13, weight: 700, align: 'center', pad: 4, fit: W });
      D.text(ctx, t.a, W / 2, H - 30 + (narrow ? 0 : -4), { color: c.ink, size: narrow ? 12 : 13.5, weight: 700, align: 'center', fit: W });
      D.text(ctx, t.b, W / 2, H - 12 + (narrow ? 0 : -4), { color: c.success, size: narrow ? 11.5 : 13, weight: 700, align: 'center', font: c.mono, fit: W });
    }
  });
})();
