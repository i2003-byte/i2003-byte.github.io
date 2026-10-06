/* =====================================================================
   Electricity & Magnetism · Coulomb's Law — sim.js
   ---------------------------------------------------------------------
   Two point charges q₁, q₂ (μC) a distance r apart in a medium with
   dielectric constant K:
     F = k q₁ q₂ ÷ (K r²),  k = 9 × 10⁹ N m² C⁻²
   F > 0 → repulsion, F < 0 → attraction. The forces on the two charges
   are equal and opposite (Newton's third law).
   Two charges: the top half shows the charges on a ruler (drag q₂ to
   change r), the bottom half plots |F| against r for the same charges,
   with the force at 2r marked to show the inverse-square law. Force
   arrows are drawn to a linear scale: full length = force at 8 cm.
   Three charges: q₁ and q₂ stay fixed; q₃ can be dragged. The forces
   on q₃ from each charge are added as vectors (superposition), shown
   with a dashed parallelogram. q₃'s position is stored in units of r.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var K = 9e9, G = 9.8, RMAX = 52;
  var drag = false;

  function force(q1, q2, rcm, Kd) { return K * q1 * q2 * 1e-12 / (Kd * Math.pow(rcm / 100, 2)); }
  function fmtN(f) {
    var a = Math.abs(f);
    return a === 0 ? '0 N' : a >= 100 ? M.fmt(f, 0) + ' N' : a >= 1 ? M.fmt(f, 2) + ' N' : a >= 1e-3 ? M.fmt(f * 1e3, 1) + ' mN' : M.fmt(f * 1e6, 1) + ' μN';
  }
  function fmtW(f) { var kg = Math.abs(f) / G; return kg >= 1 ? M.fmt(kg, 2) + ' kg' : kg >= 1e-3 ? M.fmt(kg * 1e3, 1) + ' g' : M.fmt(kg * 1e6, 0) + ' mg'; }
  function qLabel(q) { return (q > 0 ? '+' : q < 0 ? '−' : '') + M.fmt(Math.abs(q), 1) + ' μC'; }
  function qCol(q) { return q > 0 ? '#ef4444' : q < 0 ? '#3b82f6' : '#94a3b8'; }

  // two-charge layout
  function ruler(sim) {
    var W = sim.width, x0 = W * 0.2, x1 = W * 0.8;
    return { x0: x0, pxcm: (x1 - x0) / RMAX, y: sim.height < 380 ? 72 : Math.min(sim.height * 0.2, 120) };
  }
  // three-charge layout: q1, q2 on a horizontal line, q3 anywhere
  function tri(sim) {
    var W = sim.width, H = sim.height, sep = Math.min(W * 0.46, H * 0.5), cx = W / 2, cy = H * 0.72;
    var s = sim.state.q3;
    return { a: { x: cx - sep / 2, y: cy }, b: { x: cx + sep / 2, y: cy }, c: { x: cx + s.u * sep, y: cy - s.v * sep }, sep: sep };
  }
  // forces on q3 (N, screen axes)
  function triForces(sim) {
    var p = sim.p, t = tri(sim), out = {};
    [['f1', t.a, p.q1], ['f2', t.b, p.q2]].forEach(function (e) {
      var dx = t.c.x - e[1].x, dy = t.c.y - e[1].y, d = Math.hypot(dx, dy) || 1, rcm = d / t.sep * p.r;
      var f = force(e[2], p.q3, rcm, +p.K); out[e[0]] = { x: f * dx / d, y: f * dy / d, m: Math.abs(f), rcm: rcm };
    });
    out.net = { x: out.f1.x + out.f2.x, y: out.f1.y + out.f2.y }; out.net.m = Math.hypot(out.net.x, out.net.y);
    return out;
  }
  var ARROWS = ['→ right', '↗ up-right', '↑ up', '↖ up-left', '← left', '↙ down-left', '↓ down', '↘ down-right'];
  function dirName(v) { return v.m < 1e-12 ? '—' : ARROWS[((Math.round(Math.atan2(-v.y, v.x) / (Math.PI / 4)) % 8) + 8) % 8]; }

  SimLab.createSim({
    ariaLabel: "Two charges on a ruler with equal and opposite force arrows and a graph of force against distance; or three charges with the forces on the third added as vectors",
    transport: false,
    mobileAspect: '4 / 5',
    params: [
      { id: 'mode', label: 'Experiment', type: 'select', value: 'two', options: [
        { value: 'two', label: 'Two charges: force vs distance' }, { value: 'three', label: 'Three charges: add forces as vectors' }] },
      { id: 'q1', label: 'Charge q₁', min: -5, max: 5, step: 0.5, value: 2, unit: 'μC' },
      { id: 'q2', label: 'Charge q₂', min: -5, max: 5, step: 0.5, value: -3, unit: 'μC' },
      { id: 'q3', label: 'Charge q₃ (three-charge mode)', min: -5, max: 5, step: 0.5, value: 1, unit: 'μC' },
      { id: 'r', label: 'Distance r between q₁ and q₂', min: 2, max: 50, step: 0.5, value: 10, unit: 'cm', presets: [{ label: '5 cm', value: 5 }, { label: '10 cm', value: 10 }, { label: '20 cm', value: 20 }] },
      { id: 'K', label: 'Medium between the charges', type: 'select', value: '1', options: [
        { value: '1', label: 'Vacuum or air (K ≈ 1)' }, { value: '2', label: 'Kerosene (K ≈ 2)' },
        { value: '6', label: 'Glass (K ≈ 6)' }, { value: '80', label: 'Water (K ≈ 80)' }] }
    ],
    readouts: [
      { id: 'F', label: 'Size of the force', key: true },
      { id: 'kind', label: 'Nature / direction' },
      { id: 'w', label: 'Same as the weight of' },
      { id: 'F2', label: 'At twice the distance' },
      { id: 'f13', label: 'On q₃ from q₁' },
      { id: 'f23', label: 'On q₃ from q₂' }
    ],
    onParam: function (sim, id) { if (id === 'mode') sim.state.q3 = { u: 0, v: 0.5 }; return true; },
    reset: function (sim) { sim.state = { q3: { u: 0, v: 0.5 } }; },
    readout: function (sim) {
      var p = sim.p, Kd = +p.K;
      if (p.mode === 'three') {
        var f = triForces(sim);
        return { F: fmtN(f.net.m), kind: 'net force on q₃ points ' + dirName(f.net), w: fmtW(f.net.m), F2: '—',
          f13: fmtN(f.f1.m) + ' at ' + M.fmt(f.f1.rcm, 1) + ' cm', f23: fmtN(f.f2.m) + ' at ' + M.fmt(f.f2.rcm, 1) + ' cm' };
      }
      var F = force(p.q1, p.q2, p.r, Kd);
      return { F: fmtN(Math.abs(F)), kind: F > 0 ? 'repulsion (like charges)' : F < 0 ? 'attraction (unlike charges)' : 'no force (a charge is zero)',
        w: fmtW(F), F2: p.r * 2 <= 50 ? fmtN(Math.abs(F) / 4) + ' (one-fourth)' : fmtN(Math.abs(F) / 4) + ' (one-fourth, off the ruler)', f13: '—', f23: '—' };
    },
    status: function (sim) { return sim.p.mode === 'three' ? 'Drag q₃ anywhere' : 'Drag q₂ along the ruler to change r'; },
    pointer: {
      down: function (sim, x, y) {
        if (sim.p.mode === 'three') { var t = tri(sim); drag = Math.hypot(x - t.c.x, y - t.c.y) < 30; }
        else { var R = ruler(sim); drag = Math.abs(y - R.y) < 40 && Math.abs(x - (R.x0 + sim.p.r * R.pxcm)) < 34; }
        return drag;
      },
      move: function (sim, x, y) {
        if (!drag) return;
        if (sim.p.mode === 'three') {
          var t = tri(sim), cx = sim.width / 2, cy = sim.height * 0.72;
          sim.state.q3 = { u: (M.clamp(x, 16, sim.width - 16) - cx) / t.sep, v: (cy - M.clamp(y, 34, sim.height - 16)) / t.sep };
        } else {
          var R = ruler(sim); sim.setParam('r', Math.round(M.clamp((x - R.x0) / R.pxcm, 2, 50) * 2) / 2);
        }
        sim.redraw();
      },
      up: function () { drag = false; },
      hover: function (sim, x, y) {
        if (sim.p.mode === 'three') { var t = tri(sim); return Math.hypot(x - t.c.x, y - t.c.y) < 30; }
        var R = ruler(sim); return Math.abs(y - R.y) < 40 && Math.abs(x - (R.x0 + sim.p.r * R.pxcm)) < 34;
      }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, W = sim.width, H = sim.height;
      D.clear(ctx, W, H, c.bg);
      if (sim.p.mode === 'three') drawThree(sim, ctx, c, W, H); else drawTwo(sim, ctx, c, W, H);
    }
  });

  function ball(ctx, c, x, y, q, r, label, W) {
    D.circle(ctx, x, y, r, qCol(q), c.light ? '#1e293b' : '#fff', 1.5);
    D.text(ctx, q > 0 ? '+' : q < 0 ? '−' : '0', x, y + 1, { color: '#fff', size: Math.min(18, r * 1.2), weight: 800, align: 'center' });
    if (label) D.text(ctx, label, x, y - r - 11, { color: c.text, size: 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
  }

  function drawTwo(sim, ctx, c, W, H) {
    var p = sim.p, Kd = +p.K, small = W < 560, fs = small ? 10 : 12, R = ruler(sim), y = R.y;
    var F = force(p.q1, p.q2, p.r, Kd), F5 = Math.abs(force(p.q1, p.q2, 5, Kd)), F8 = F5 * 25 / 64;
    D.text(ctx, 'F = k q₁ q₂ ÷ (K r²)', W / 2, 14, { color: c.bg, bg: c.s3, size: small ? 11.5 : 13, weight: 700, align: 'center', pad: 4, fit: W });
    // ruler
    var ry = y + 50;
    D.line(ctx, R.x0, ry, R.x0 + 50 * R.pxcm, ry, c.axis, 1.5);
    for (var cm = 0; cm <= 50; cm += small ? 10 : 5) {
      var tx = R.x0 + cm * R.pxcm; D.line(ctx, tx, ry - 4, tx, ry + 4, c.axis, 1);
      D.text(ctx, cm === 50 ? '50 cm' : cm + '', tx, ry + 12, { color: c.muted, size: 9.5, align: 'center', fit: W });
    }
    var xa = R.x0, xb = R.x0 + p.r * R.pxcm, rad = Math.max(5, Math.min(small ? 11 : 14, (xb - xa) / 2 - 1));
    // distance bracket
    D.line(ctx, xa, ry - 10, xb, ry - 10, c.faint, 1, [3, 3]);
    // force arrows: linear, full length = force at 8 cm
    var Lmax = W * 0.17, L = F8 ? Math.abs(F) / F8 * Lmax : 0, cap = L > Lmax * 1.15;
    L = Math.min(L, Lmax * 1.15);
    if (F !== 0) {
      var s = F > 0 ? 1 : -1, fc = c.warning;
      if (L > 2) {
        D.arrow(ctx, xa, y - 20, xa - s * L, y - 20, fc, 3, 9);
        D.arrow(ctx, xb, y + 20, xb + s * L, y + 20, fc, 3, 9);
      }
      D.text(ctx, 'F on q₁', xa - s * L * 0.5, y - 32, { color: fc, size: fs - 1, weight: 700, align: 'center', fit: W });
      D.text(ctx, 'F on q₂' + (cap ? ' (off scale)' : ''), xb + s * L * 0.5, y + 34, { color: fc, size: fs - 1, weight: 700, align: 'center', fit: W });
    }
    ball(ctx, c, xa, y, p.q1, rad, null, W);
    ball(ctx, c, xb, y, p.q2, rad, null, W);
    D.text(ctx, 'q₁ = ' + qLabel(p.q1), Math.max(R.x0, 4), ry + 27, { color: c.text, size: fs, weight: 600, fit: W });
    D.text(ctx, 'q₂ = ' + qLabel(p.q2) + ' (drag)', W - 4, ry + 27, { color: c.text, size: fs, weight: 600, align: 'right', fit: W });

    // graph of |F| against r
    var gx0 = small ? 46 : 80, gx1 = W - (small ? 14 : 40), gy0 = ry + 48, gy1 = H - 26;
    if (gy1 - gy0 < 60) return;
    var Fmax = F5 * 1.1 || 1;
    function GX(r) { return gx0 + r / 50 * (gx1 - gx0); }
    function GY(f) { return gy1 - Math.min(f / Fmax, 1.05) * (gy1 - gy0); }
    D.line(ctx, gx0, gy1, gx1, gy1, c.axis, 1.2); D.line(ctx, gx0, gy0 - 4, gx0, gy1, c.axis, 1.2);
    for (var r = 0; r <= 50; r += 10) D.text(ctx, r + '', GX(r), gy1 + 10, { color: c.muted, size: 9.5, align: 'center' });
    D.text(ctx, 'r (cm)', gx1, gy1 + 20, { color: c.muted, size: 9.5, align: 'right' });
    D.text(ctx, '|F|', gx0 - 6, gy0 + 2, { color: c.muted, size: 10, align: 'right' });
    D.text(ctx, fmtN(F5), gx0 - 6, GY(F5), { color: c.muted, size: 9, align: 'right' });
    D.line(ctx, gx0 - 3, GY(F5), gx0, GY(F5), c.axis, 1);
    if (!F5) { D.text(ctx, 'A charge is zero, so there is no force', (gx0 + gx1) / 2, (gy0 + gy1) / 2, { color: c.muted, size: fs, align: 'center', fit: W }); return; }
    ctx.save(); ctx.beginPath(); ctx.rect(gx0, gy0 - 6, gx1 - gx0, gy1 - gy0 + 6); ctx.clip();
    D.curve(ctx, function (x) { var rr = (x - gx0) / (gx1 - gx0) * 50; return GY(rr < 0.5 ? Fmax * 2 : F5 * 25 / (rr * rr)); }, gx0, gx1, c.s1, 2, 2);
    ctx.restore();
    var Fa = Math.abs(F), px = GX(p.r), py = GY(Fa);
    D.line(ctx, px, py, px, gy1, c.s1, 1, [3, 3]);
    D.circle(ctx, px, py, 5, c.s1, c.bg, 1.5);
    if (p.r * 2 <= 50) {
      var qx = GX(p.r * 2), qy = GY(Fa / 4);
      D.line(ctx, qx, qy, qx, gy1, c.s2, 1, [3, 3]);
      D.circle(ctx, qx, qy, 4.5, c.s2, c.bg, 1.5);
      D.text(ctx, '2r → F ÷ 4', qx + 6, qy - 12, { color: c.s2, size: fs - 1, weight: 700, fit: W });
    }
    D.text(ctx, 'r = ' + M.fmt(p.r, 1) + ' cm: ' + fmtN(Fa), Math.min(px + 8, gx1 - 4), Math.max(py - 12, gy0 + 4), { color: c.s1, size: fs - 1, weight: 700, fit: W });
  }

  function drawThree(sim, ctx, c, W, H) {
    var p = sim.p, t = tri(sim), f = triForces(sim), small = W < 560, fs = small ? 10 : 12;
    D.text(ctx, 'Superposition: F on q₃ = F₁₃ + F₂₃ (vector sum)', W / 2, 14, { color: c.bg, bg: c.s3, size: small ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: W });
    D.line(ctx, t.a.x, t.a.y, t.b.x, t.b.y, c.faint, 1, [3, 3]);
    D.text(ctx, 'r = ' + M.fmt(p.r, 1) + ' cm', (t.a.x + t.b.x) / 2, t.a.y + 16, { color: c.muted, size: fs - 1, align: 'center', fit: W });
    D.line(ctx, t.a.x, t.a.y, t.c.x, t.c.y, c.faint, 1, [2, 4]);
    D.line(ctx, t.b.x, t.b.y, t.c.x, t.c.y, c.faint, 1, [2, 4]);
    var big = Math.max(f.f1.m, f.f2.m, f.net.m) || 1, Lmax = Math.min(W, H) * 0.22, k = Lmax / big, o = t.c;
    var e1 = { x: o.x + f.f1.x * k, y: o.y + f.f1.y * k }, e2 = { x: o.x + f.f2.x * k, y: o.y + f.f2.y * k }, en = { x: o.x + f.net.x * k, y: o.y + f.net.y * k };
    if (p.q3 !== 0) {
      D.line(ctx, e1.x, e1.y, en.x, en.y, c.faint, 1, [4, 4]); D.line(ctx, e2.x, e2.y, en.x, en.y, c.faint, 1, [4, 4]);
      if (f.f1.m * k > 3) D.arrow(ctx, o.x, o.y, e1.x, e1.y, qCol(p.q1), 2.5, 9);
      if (f.f2.m * k > 3) D.arrow(ctx, o.x, o.y, e2.x, e2.y, qCol(p.q2), 2.5, 9);
      if (f.net.m * k > 3) D.arrow(ctx, o.x, o.y, en.x, en.y, c.warning, 3.5, 11);
      if (f.f1.m * k > 12) D.text(ctx, 'F₁₃', e1.x + (e1.x - o.x) / (f.f1.m * k) * 12, e1.y + (e1.y - o.y) / (f.f1.m * k) * 12, { color: qCol(p.q1), size: fs, weight: 700, align: 'center', fit: W });
      if (f.f2.m * k > 12) D.text(ctx, 'F₂₃', e2.x + (e2.x - o.x) / (f.f2.m * k) * 12, e2.y + (e2.y - o.y) / (f.f2.m * k) * 12, { color: qCol(p.q2), size: fs, weight: 700, align: 'center', fit: W });
      if (f.net.m * k > 12) D.text(ctx, 'net F', en.x + (en.x - o.x) / (f.net.m * k) * 16, en.y + (en.y - o.y) / (f.net.m * k) * 16, { color: c.warning, size: fs, weight: 800, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
    }
    ball(ctx, c, t.a.x, t.a.y, p.q1, small ? 11 : 13, 'q₁ ' + qLabel(p.q1), W);
    ball(ctx, c, t.b.x, t.b.y, p.q2, small ? 11 : 13, 'q₂ ' + qLabel(p.q2), W);
    ball(ctx, c, o.x, o.y, p.q3, small ? 11 : 13, null, W);
    D.text(ctx, 'q₃ ' + qLabel(p.q3) + ' (drag)', o.x, o.y + (small ? 24 : 27), { color: c.text, size: 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
    D.text(ctx, 'arrows to scale; longest = ' + fmtN(big), W / 2, H - 10, { color: c.muted, size: small ? 9.5 : 11, align: 'center', fit: W });
  }
})();
