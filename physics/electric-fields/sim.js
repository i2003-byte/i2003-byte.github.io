/* =====================================================================
   Electricity & Magnetism · Electric Fields — sim.js
   ---------------------------------------------------------------------
   Point charges in a plane. The field and potential at a point are the
   sums over every charge (superposition):
     E = Σ k qᵢ r̂ᵢ / rᵢ²     V = Σ k qᵢ / rᵢ      k = 9 × 10⁹ N m² C⁻²
   Scale: the shorter side of the canvas is 20 cm. Charges are whole
   multiples of the slider value q (in nC).
   Field lines start on positive charges, 10 lines per unit of q,
   and are traced along E (midpoint steps) until they reach a negative
   charge or leave the screen. Lines that come in from far away and end
   on a negative charge are traced backwards from that charge and kept
   only if they really do come from off-screen.
   Equipotentials: V on a coarse grid, contoured by marching squares at
   fixed multiples of V₀ = k q / 2 cm.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var K = 9e9, SPAN = 0.2, SOFT = 0.002 * 0.002, MAXQ = 6;
  var LAYOUTS = {
    single: [[0, 0, 1]],
    dipole: [[-0.04, 0, 1], [0.04, 0, -1]],
    like: [[-0.04, 0, 1], [0.04, 0, 1]],
    unequal: [[-0.035, 0, 2], [0.035, 0, -1]],
    four: [[-0.04, -0.04, 1], [0.04, -0.04, -1], [0.04, 0.04, 1], [-0.04, 0.04, -1]],
    negative: [[0, 0, -1]]
  };
  var drag = null;

  function pxm(sim) { return Math.min(sim.width, sim.height) / SPAN; }
  function toPx(sim, q) { return { x: sim.width / 2 + q.x * pxm(sim), y: sim.height / 2 + q.y * pxm(sim) }; }
  function toM(sim, x, y) { return { x: (x - sim.width / 2) / pxm(sim), y: (y - sim.height / 2) / pxm(sim) }; }

  // field (N/C, screen axes: y down) and potential (V) at a point in metres
  function fieldAt(sim, mx, my) {
    var ex = 0, ey = 0, v = 0, qn = sim.p.q * 1e-9;
    sim.state.charges.forEach(function (c) {
      var dx = mx - c.x, dy = my - c.y, r2 = dx * dx + dy * dy + SOFT, r = Math.sqrt(r2), kq = K * c.n * qn;
      ex += kq * dx / (r2 * r); ey += kq * dy / (r2 * r); v += kq / r;
    });
    return { x: ex, y: ey, v: v };
  }
  function fmtE(e) { return e >= 1e6 ? M.fmt(e / 1e6, 2) + ' MN/C' : e >= 1e3 ? M.fmt(e / 1e3, 1) + ' kN/C' : M.fmt(e, 0) + ' N/C'; }
  function fmtV(v) { return Math.abs(v) >= 1e3 ? M.fmt(v / 1e3, 2) + ' kV' : M.fmt(v, 0) + ' V'; }
  var ARROWS = ['→ right', '↗ up-right', '↑ up', '↖ up-left', '← left', '↙ down-left', '↓ down', '↘ down-right'];

  function hitCharge(sim, x, y) {
    var cs = sim.state.charges;
    for (var i = cs.length - 1; i >= 0; i--) { var p = toPx(sim, cs[i]); if (Math.hypot(x - p.x, y - p.y) < 22) return i; }
    return -1;
  }
  function nearProbe(sim, x, y) { var p = toPx(sim, sim.state.probe); return Math.hypot(x - p.x, y - p.y) < 24; }
  function clampM(sim, m) {
    var hx = sim.width / 2 / pxm(sim) - 0.006, hy = sim.height / 2 / pxm(sim) - 0.006;
    return { x: M.clamp(m.x, -hx, hx), y: M.clamp(m.y, -hy, hy) };
  }
  function addCharge(sim, n) {
    var cs = sim.state.charges; if (cs.length >= MAXQ) return;
    for (var k = 0; k < 40; k++) {
      var a = k * 2.4, r = 0.02 + 0.004 * k, x = Math.cos(a) * r, y = Math.sin(a) * r * 0.8;
      if (cs.every(function (c) { return Math.hypot(c.x - x, c.y - y) > 0.025; })) { cs.push({ x: x, y: y, n: n }); return; }
    }
    cs.push({ x: 0.03, y: 0.03, n: n });
  }

  SimLab.createSim({
    ariaLabel: 'Electric field lines and equipotential lines around point charges that you can drag, add and remove, with a test charge that shows the field strength, direction and potential where it sits',
    transport: false,
    mobileAspect: '4 / 5',
    params: [
      { id: 'layout', label: 'Arrangement of charges', type: 'select', value: 'dipole', options: [
        { value: 'single', label: 'One positive charge' }, { value: 'negative', label: 'One negative charge' },
        { value: 'dipole', label: '+q and −q (a dipole)' }, { value: 'like', label: 'Two equal + charges' },
        { value: 'unequal', label: '+2q and −q' }, { value: 'four', label: 'Four charges in a square' }] },
      { id: 'q', label: 'Size of each charge q', min: 1, max: 20, step: 1, value: 10, unit: 'nC' },
      { id: 'view', label: 'Show the field as', type: 'select', value: 'lines', options: [
        { value: 'lines', label: 'Field lines' }, { value: 'vectors', label: 'Arrows on a grid' }, { value: 'none', label: 'Nothing (charges only)' }] },
      { id: 'equi', label: 'Show equipotential lines', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'E', label: 'Field E at the test point', key: true },
      { id: 'dir', label: 'E points' },
      { id: 'V', label: 'Potential V at the test point', key: true },
      { id: 'F', label: 'Force on a +1 nC test charge', unit: 'μN', digits: 1 },
      { id: 'net', label: 'Total charge' }
    ],
    buttons: [
      { label: 'Add +q', onClick: function (sim) { addCharge(sim, 1); } },
      { label: 'Add −q', onClick: function (sim) { addCharge(sim, -1); } },
      { label: 'Remove last charge', onClick: function (sim) { if (sim.state.charges.length > 1) sim.state.charges.pop(); } }
    ],
    onParam: function (sim, id) { if (id === 'layout') sim.reset(); return true; },
    reset: function (sim) {
      sim.state = {
        charges: (LAYOUTS[sim.p.layout] || LAYOUTS.dipole).map(function (a) { return { x: a[0], y: a[1], n: a[2] }; }),
        probe: { x: 0, y: -0.055 }
      };
    },
    readout: function (sim) {
      var pr = sim.state.probe, E = fieldAt(sim, pr.x, pr.y), m = Math.hypot(E.x, E.y);
      var idx = ((Math.round(Math.atan2(-E.y, E.x) / (Math.PI / 4)) % 8) + 8) % 8;
      var net = sim.state.charges.reduce(function (s, c) { return s + c.n; }, 0);
      return { E: fmtE(m), dir: m < 1 ? '— (no field here)' : ARROWS[idx], V: fmtV(E.v), F: m * 1e-9 * 1e6,
        net: net ? (net > 0 ? '+' : '−') + Math.abs(net) * sim.p.q + ' nC' : '0 (every line from + ends on −)' };
    },
    status: function (sim) { return sim.state.charges.length + ' charge' + (sim.state.charges.length > 1 ? 's' : '') + ' · drag a charge or the test point'; },
    pointer: {
      down: function (sim, x, y) {
        if (nearProbe(sim, x, y)) { drag = 'probe'; return true; }
        var i = hitCharge(sim, x, y);
        if (i >= 0) { drag = i; return true; }
        sim.state.probe = clampM(sim, toM(sim, x, y)); drag = 'probe'; sim.redraw(); return true;
      },
      move: function (sim, x, y) {
        if (drag === null) return;
        var m = clampM(sim, toM(sim, x, y));
        if (drag === 'probe') sim.state.probe = m; else { sim.state.charges[drag].x = m.x; sim.state.charges[drag].y = m.y; }
        sim.redraw();
      },
      up: function () { drag = null; },
      hover: function (sim, x, y) { return nearProbe(sim, x, y) || hitCharge(sim, x, y) >= 0; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, small = W < 560;
      D.clear(ctx, W, H, c.bg);
      var lineC = c.light ? '#7c3aed' : '#c4b5fd', eqC = c.light ? '#059669' : '#6ee7b7';
      if (p.equi) drawEquipotentials(sim, ctx, eqC);
      if (p.view === 'lines') drawLines(sim, ctx, lineC);
      else if (p.view === 'vectors') drawVectors(sim, ctx, lineC);

      // charges
      sim.state.charges.forEach(function (q) {
        var s = toPx(sim, q), r = 12 + 2 * Math.abs(q.n), pos = q.n > 0;
        D.circle(ctx, s.x, s.y, r, pos ? '#ef4444' : '#3b82f6', c.light ? '#1e293b' : '#fff', 1.5);
        D.text(ctx, pos ? '+' : '−', s.x, s.y + 1, { color: '#fff', size: 18, weight: 800, align: 'center' });
        D.text(ctx, (pos ? '+' : '−') + (Math.abs(q.n) > 1 ? Math.abs(q.n) : '') + 'q', s.x, s.y + r + 10, { color: c.text, size: 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.75), pad: 2, fit: W });
      });

      // test point with the field arrow
      var pr = sim.state.probe, ps = toPx(sim, pr), E = fieldAt(sim, pr.x, pr.y), m = Math.hypot(E.x, E.y);
      if (m > 1) {
        var L = small ? 34 : 44;
        D.arrow(ctx, ps.x, ps.y, ps.x + E.x / m * L, ps.y + E.y / m * L, c.warning, 3, 10);
        D.text(ctx, 'E', ps.x + E.x / m * (L + 10), ps.y + E.y / m * (L + 10), { color: c.warning, size: 13, weight: 800, align: 'center' });
      }
      D.circle(ctx, ps.x, ps.y, 7, c.light ? '#fff' : '#0f172a', c.warning, 2.5);
      D.circle(ctx, ps.x, ps.y, 2, c.warning);
      D.text(ctx, fmtE(m) + ' · ' + fmtV(E.v), ps.x, ps.y + (ps.y > H - 40 ? -20 : 20), { color: c.text, size: small ? 10.5 : 11.5, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 3, fit: W });

      D.text(ctx, p.view === 'vectors' ? 'Arrows show E; brighter = stronger' : 'Lines start on + and end on −; they never cross', W / 2, 15, { color: c.bg, bg: c.s3, size: small ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: W });
      var foot = (p.equi ? 'green: equal potential, always ⟂ to E · ' : '') + 'short side = 20 cm';
      D.text(ctx, foot, W / 2, H - 11, { color: c.muted, size: small ? 9.5 : 11, align: 'center', fit: W });
    }
  });

  function trace(sim, x, y, sign, W, H, stopOn) { // x,y in px; sign +1 along E, −1 against
    var cs = sim.state.charges.map(function (q) { var s = toPx(sim, q); return { x: s.x, y: s.y, n: q.n }; });
    var s2m = 1 / pxm(sim), h = 2.5, pts = [[x, y]], end = 'lost';
    function dir(px, py) { var E = fieldAt(sim, (px - W / 2) * s2m, (py - H / 2) * s2m), m = Math.hypot(E.x, E.y); return m ? [E.x / m * sign, E.y / m * sign] : null; }
    for (var s = 0; s < 2600; s++) {
      var d1 = dir(x, y); if (!d1) break;
      var d2 = dir(x + d1[0] * h / 2, y + d1[1] * h / 2); if (!d2) break;
      x += d2[0] * h; y += d2[1] * h; pts.push([x, y]);
      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) { end = 'out'; break; }
      var hit = false;
      for (var i = 0; i < cs.length; i++) if (cs[i].n * stopOn > 0 && Math.hypot(x - cs[i].x, y - cs[i].y) < 6) { hit = true; break; }
      if (hit) { end = 'charge'; break; }
    }
    return { pts: pts, end: end };
  }
  function strokeLine(ctx, pts, col, rev, W, H) {
    ctx.beginPath(); pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke();
    var j = Math.min(pts.length - 2, 34); if (j < 2) return;
    var a = pts[j], b = pts[j + 1]; if (a[0] < 4 || a[0] > W - 4 || a[1] < 4 || a[1] > H - 4) return;
    var ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + (rev ? Math.PI : 0);
    D.arrow(ctx, a[0] - Math.cos(ang) * 6, a[1] - Math.sin(ang) * 6, a[0] + Math.cos(ang) * 3, a[1] + Math.sin(ang) * 3, col, 1.5, 7);
  }
  function drawLines(sim, ctx, col) {
    var W = sim.width, H = sim.height;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
    sim.state.charges.forEach(function (q) {
      var s = toPx(sim, q), per = 10 * Math.abs(q.n), r0 = 7;
      for (var k = 0; k < per; k++) {
        var a = (k + 0.5) / per * Math.PI * 2, x = s.x + Math.cos(a) * r0, y = s.y + Math.sin(a) * r0;
        if (q.n > 0) { strokeLine(ctx, trace(sim, x, y, 1, W, H, -1).pts, col, false, W, H); }
        else {
          var t = trace(sim, x, y, -1, W, H, 1);
          if (t.end === 'out') strokeLine(ctx, t.pts, col, true, W, H);
        }
      }
    });
    ctx.restore();
  }
  function drawVectors(sim, ctx, col) {
    var W = sim.width, H = sim.height, g = W < 560 ? 30 : 38, s2m = 1 / pxm(sim);
    var Eref = K * sim.p.q * 1e-9 / 0.0025; // field 5 cm from one charge
    for (var y = g / 2 + 22; y < H - 16; y += g) for (var x = g / 2; x < W; x += g) {
      var tooClose = sim.state.charges.some(function (q) { var s = toPx(sim, q); return Math.hypot(x - s.x, y - s.y) < 18; });
      if (tooClose) continue;
      var E = fieldAt(sim, (x - W / 2) * s2m, (y - H / 2) * s2m), m = Math.hypot(E.x, E.y); if (!m) continue;
      var a = M.clamp(0.35 + 0.35 * Math.log10(m / Eref) + 0.3, 0.12, 1), L = g * 0.38;
      D.arrow(ctx, x - E.x / m * L, y - E.y / m * L, x + E.x / m * L, y + E.y / m * L, D.alpha(col, a), 1.6, 6);
    }
  }
  function drawEquipotentials(sim, ctx, col) {
    var W = sim.width, H = sim.height, g = 6, nx = Math.ceil(W / g) + 1, ny = Math.ceil(H / g) + 1, s2m = 1 / pxm(sim), V = new Float64Array(nx * ny);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) V[j * nx + i] = fieldAt(sim, (i * g - W / 2) * s2m, (j * g - H / 2) * s2m).v;
    var V0 = K * sim.p.q * 1e-9 / 0.02, levels = [];
    var hasPos = sim.state.charges.some(function (q) { return q.n > 0; }), hasNeg = sim.state.charges.some(function (q) { return q.n < 0; });
    [0.25, 0.5, 1, 2, 4].forEach(function (f) { if (hasPos) levels.push(f * V0); if (hasNeg) levels.push(-f * V0); });
    if (hasPos && hasNeg) levels.push(0);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]); ctx.globalAlpha = 0.85;
    ctx.beginPath();
    levels.forEach(function (L) {
      for (var j = 0; j < ny - 1; j++) for (var i = 0; i < nx - 1; i++) {
        var a = V[j * nx + i] - L, b = V[j * nx + i + 1] - L, cc = V[(j + 1) * nx + i + 1] - L, d = V[(j + 1) * nx + i] - L, pts = [];
        var x0 = i * g, y0 = j * g;
        if ((a > 0) !== (b > 0)) pts.push([x0 + g * a / (a - b), y0]);
        if ((b > 0) !== (cc > 0)) pts.push([x0 + g, y0 + g * b / (b - cc)]);
        if ((cc > 0) !== (d > 0)) pts.push([x0 + g * d / (d - cc), y0 + g]);
        if ((d > 0) !== (a > 0)) pts.push([x0, y0 + g * a / (a - d)]);
        if (pts.length >= 2) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); }
        if (pts.length === 4) { ctx.moveTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]); }
      }
    });
    ctx.stroke(); ctx.restore();
  }
})();
