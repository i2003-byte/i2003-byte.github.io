/* =====================================================================
   Ray optics (Class 12) · Microscope and telescope — sim.js
   ---------------------------------------------------------------------
   Two thin convex lenses (objective, eyepiece), traced paraxially in
   real units (cm): a ray keeps its height y at a lens and its slope
   changes  s' = s − y/f.  Lens formula 1/v − 1/u = 1/f (Cartesian signs).
   Least distance of distinct vision D = 25 cm; the eye is at the eyepiece.
   Compound microscope (lenses a distance d apart):
     eyepiece object distance u_e = f_e (final image at infinity) or
       D f_e/(D + f_e) (final image at 25 cm)
     v_o = d − u_e,  u_o = f_o v_o/(v_o − f_o)  (the focus knob sets u_o)
     m_o = −v_o/u_o,  m_e = D/f_e  or  1 + D/f_e,  M = m_o m_e
     NCERT tube length L = d − f_o − f_e;  M ≈ (L/f_o)(D/f_e)
   Astronomical telescope (object at infinity, angle α):
     image by the objective at f_o, height f_o tan α (inverted)
     normal adjustment: d = f_o + f_e, M = f_o/f_e
     final image at 25 cm: M = (f_o/f_e)(1 + f_e/D)
   Heights are drawn on a bigger scale than lengths in the telescope.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, DV = 25;

  function showCtl(id, on) { var el = document.getElementById('ctl-' + id), box = el && el.closest('.control'); if (box) box.style.display = on ? '' : 'none'; }
  function syncControls(p) { var mic = p.inst === 'mic'; showCtl('fo', mic); showCtl('d', mic); showCtl('Fo', !mic); showCtl('ang', !mic); }

  function solve(p) {
    var mic = p.inst === 'mic', fe = p.fe, ue = p.adj === 'inf' ? fe : DV * fe / (DV + fe), o = { mic: mic, fe: fe, ue: ue };
    o.me = p.adj === 'inf' ? DV / fe : 1 + DV / fe;
    if (mic) {
      o.fo = p.fo; o.d = p.d; o.vo = p.d - ue; o.uo = o.fo * o.vo / (o.vo - o.fo); o.mo = -o.vo / o.uo; o.M = o.mo * o.me;
      o.L = p.d - p.fo - fe; o.approx = (o.L / p.fo) * (DV / fe);
    } else {
      o.fo = p.Fo; o.d = p.Fo + ue; o.M = -(p.Fo / fe) * (p.adj === 'inf' ? 1 : 1 + fe / DV); o.alpha = M.rad(p.ang);
    }
    return o;
  }
  // rays as polylines in cm: [{x, y}], plus a flag for drawing the virtual part
  function trace(o) {
    var rays = [], ho = 1;
    function run(x0, y0, s, xEnd) {
      var pts = [{ x: x0, y: y0 }], y = y0 + s * (0 - x0);
      pts.push({ x: 0, y: y }); s -= y / o.fo;
      var ye = y + s * o.d; pts.push({ x: o.d, y: ye }); var s2 = s - ye / o.fe;
      pts.push({ x: xEnd, y: ye + s2 * (xEnd - o.d) });
      return { pts: pts, ye: ye, s2: s2 };
    }
    var xEnd = o.d * 1.22;
    if (o.mic) {
      var x0 = -o.uo, hi = o.mo * ho;
      rays.push(run(x0, ho, 0, xEnd));                              // parallel to the axis
      rays.push(run(x0, ho, -ho / o.uo, xEnd));                     // through the centre of the objective
      rays.push(run(x0, ho, -ho / (o.uo - o.fo), xEnd));            // through the front focus
      return { rays: rays, ho: ho, hi: hi, xi: o.vo, x0: x0 };
    }
    var s = -Math.tan(o.alpha), A = o.fo / 14, start = -o.fo * 0.12;
    [A, A / 2, 0, -A / 2, -A].forEach(function (yh) { rays.push(run(start, yh - s * (0 - start), s, xEnd)); });
    return { rays: rays, A: A, hi: o.fo * s, xi: o.fo, x0: start };
  }

  SimLab.createSim({
    ariaLabel: 'Ray diagram of a compound microscope or an astronomical telescope with objective, eyepiece, intermediate image, final image and a view of what the eye sees',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'inst', label: 'Instrument', type: 'select', value: 'mic', options: [{ value: 'mic', label: 'Compound microscope' }, { value: 'tel', label: 'Astronomical telescope' }] },
      { id: 'adj', label: 'Final image', type: 'select', value: 'near', options: [{ value: 'near', label: 'At 25 cm (near point, most magnification)' }, { value: 'inf', label: 'At infinity (normal adjustment, relaxed eye)' }] },
      { id: 'fo', label: 'Objective focal length f_o', min: 0.5, max: 2.5, step: 0.1, value: 1.5, unit: 'cm' },
      { id: 'd', label: 'Distance between the lenses', min: 10, max: 20, step: 0.5, value: 14, unit: 'cm' },
      { id: 'Fo', label: 'Objective focal length f_o', min: 30, max: 150, step: 5, value: 60, unit: 'cm' },
      { id: 'fe', label: 'Eyepiece focal length f_e', min: 1.5, max: 10, step: 0.5, value: 3, unit: 'cm', presets: [{ label: '10× eyepiece (2.5 cm)', value: 2.5 }] },
      { id: 'ang', label: 'Angle the object makes at your eye', min: 0.5, max: 3, step: 0.1, value: 1.5, unit: '°', help: 'The Moon is about 0.5°. Bigger angles make the diagram easier to see.' }
    ],
    readouts: [
      { id: 'M', label: 'Magnifying power M', short: 'M', key: true },
      { id: 'mo', label: 'Objective', short: 'Objective' },
      { id: 'me', label: 'Eyepiece', short: 'Eyepiece', key: true },
      { id: 'u', label: 'Object distance' },
      { id: 'len', label: 'Length of the instrument' },
      { id: 'ap', label: 'Formula check' }
    ],
    reset: function (sim) { syncControls(sim.p); },
    onParam: function (sim, id) { if (id === 'inst') syncControls(sim.p); return true; },
    readout: function (sim) {
      var o = solve(sim.p), p = sim.p;
      if (o.mic) return {
        M: M.fmt(Math.abs(o.M), 1) + '× (inverted)', mo: 'm_o = ' + M.fmt(o.mo, 2) + ' (image ' + M.fmt(o.vo, 2) + ' cm behind it)', me: 'm_e = ' + M.fmt(o.me, 2) + '×',
        u: M.fmt(o.uo, 2) + ' cm in front of the objective', len: M.fmt(o.d, 1) + ' cm (tube length L = ' + M.fmt(o.L, 1) + ' cm)',
        ap: '(L/f_o)(D/f_e) = ' + M.fmt(o.approx, 1) + '× (approximate)'
      };
      return {
        M: M.fmt(Math.abs(o.M), 1) + '× (inverted)', mo: 'image at f_o = ' + p.Fo + ' cm, ' + M.fmt(p.Fo * Math.tan(o.alpha), 2) + ' cm tall', me: 'object seen at ' + M.fmt(Math.abs(o.M) * p.ang, 1) + '° instead of ' + p.ang + '°',
        u: 'very far (rays arrive parallel)', len: M.fmt(o.d, 1) + ' cm' + (p.adj === 'inf' ? ' = f_o + f_e' : ''),
        ap: 'f_o/f_e = ' + M.fmt(p.Fo / p.fe, 1) + (p.adj === 'inf' ? '' : ' × (1 + f_e/D) = ' + M.fmt(Math.abs(o.M), 1))
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, o = solve(p), t = trace(o);
      var nar = W < 560, fs = nar ? 10.5 : 12;
      D.clear(ctx, W, H, c.bg);
      var bottomH = Math.min(nar ? 112 : 124, H * 0.34), top = 30, bot = H - bottomH - 8, y0 = (top + bot) / 2;
      var xmin = t.x0 - (o.mic ? o.d * 0.06 : 0), xmax = o.d * 1.18;
      var kx = (W - 24) / (xmax - xmin);
      var ymax = 0; t.rays.forEach(function (r) { r.pts.slice(0, 3).forEach(function (q) { ymax = Math.max(ymax, Math.abs(q.y)); }); });
      ymax = Math.max(ymax, Math.abs(t.hi), o.mic ? 0 : t.A) * (o.mic ? 1.12 : 1.3);
      var ky = (bot - top) / 2 / ymax;
      function X(x) { return 12 + (x - xmin) * kx; }
      function Y(y) { return y0 - y * ky; }

      var head = o.mic ? 'Compound microscope: M = m_o × m_e = ' + M.fmt(o.mo, 2) + ' × ' + M.fmt(o.me, 2) + ' = ' + M.fmt(o.M, 1)
        : (nar ? 'Telescope: M = ' : 'Telescope (light from a far object): M = ') + (p.adj === 'inf' ? 'f_o/f_e = ' + p.Fo + '/' + p.fe : '(f_o/f_e)(1 + f_e/D)') + ' = ' + M.fmt(Math.abs(o.M), 1) + '×';
      D.text(ctx, head, W / 2, 14, { color: c.bg, bg: c.s3, size: fs + 0.5, weight: 700, align: 'center', pad: 4, fit: W });

      ctx.save(); ctx.beginPath(); ctx.rect(0, top - 4, W, bot - top + 8); ctx.clip();
      D.line(ctx, 4, y0, W - 4, y0, c.axis, 1.1);
      // focal points
      [[-o.fo, 'F_o'], [o.fo, 'F_o'], [o.d - o.fe, 'F_e'], [o.d + o.fe, 'F_e']].forEach(function (q) {
        var x = X(q[0]); if (x < 4 || x > W - 4) return;
        D.circle(ctx, x, y0, 2.6, c.warning);
        D.text(ctx, q[1], x, y0 + 12, { color: c.warning, size: fs - 1.5, weight: 700, align: 'center' });
      });
      // lenses sized to the rays
      var hO = 0, hE = 0; t.rays.forEach(function (r) { hO = Math.max(hO, Math.abs(r.pts[1].y)); hE = Math.max(hE, Math.abs(r.pts[2].y)); });
      lens(ctx, X(0), y0, Math.max(14, hO * ky * 1.12), c, 'objective');
      lens(ctx, X(o.d), y0, Math.max(14, hE * ky * 1.12), c, 'eyepiece');
      // rays
      var cols = o.mic ? [c.s2, c.s4, c.s1] : [c.s2, c.s2, c.s4, c.s1, c.s1];
      t.rays.forEach(function (r, i) {
        var col = cols[i];
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
        r.pts.forEach(function (q, k) { if (k) ctx.lineTo(X(q.x), Y(q.y)); else ctx.moveTo(X(q.x), Y(q.y)); });
        ctx.stroke(); ctx.restore();
        var a = r.pts[2], b = r.pts[3], mx = (X(a.x) + X(b.x)) / 2, my = (Y(a.y) + Y(b.y)) / 2, an = Math.atan2(Y(b.y) - Y(a.y), X(b.x) - X(a.x));
        D.arrow(ctx, mx - Math.cos(an) * 6, my - Math.sin(an) * 6, mx + Math.cos(an) * 3, my + Math.sin(an) * 3, col, 1.5, 7);
        if (p.adj === 'near') { // virtual: extend back to the final image, 25 cm in front of the eye
          var xb = o.d - DV, yb = a.y + r.s2 * (xb - o.d);
          D.line(ctx, X(a.x), Y(a.y), X(xb), Y(yb), D.alpha(col, 0.6), 1.1, [5, 4]);
        }
      });
      // object and intermediate image
      if (o.mic) {
        var oh = Math.max(6, t.ho * ky);
        D.arrow(ctx, X(t.x0), y0, X(t.x0), y0 - oh, c.text, 2.5, 7);
        D.text(ctx, 'object', X(t.x0), y0 + 24, { color: c.text, size: fs - 1, weight: 700, align: 'center', fit: W });
      }
      D.arrow(ctx, X(t.xi), y0, X(t.xi), Y(t.hi), c.s3, 2.5, 8);
      D.text(ctx, 'first image', X(t.xi), Y(t.hi) + (t.hi < 0 ? 12 : -12), { color: c.s3, size: fs - 1, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
      if (p.adj === 'near') D.text(ctx, '⟵ dashed: final image 25 cm in front of the eye', 6, bot - 4, { color: c.muted, size: fs - 2, fit: W });
      else D.text(ctx, 'rays leave the eyepiece parallel: final image at infinity', 6, bot - 4, { color: c.muted, size: fs - 2, fit: W });
      // eye
      var ex = X(o.d) + Math.min(36, (W - X(o.d)) * 0.4);
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ex + 10, y0, 10, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke(); ctx.restore();
      D.text(ctx, 'eye', ex + 8, y0 - 18, { color: c.muted, size: fs - 1.5, align: 'center', fit: W });
      ctx.restore();
      if (!o.mic) D.text(ctx, 'heights drawn ' + M.fmt(ky / kx, 0) + '× bigger than lengths', W - 6, bot - 18, { color: c.faint, size: fs - 2.5, align: 'right' });

      drawViews(ctx, 8, H - bottomH, W - 16, bottomH - 6, c, p, o, fs);
    }
  });

  function lens(ctx, x, y0, h, c, label) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(x, y0 - h); ctx.quadraticCurveTo(x + 9, y0, x, y0 + h); ctx.quadraticCurveTo(x - 9, y0, x, y0 - h); ctx.closePath();
    ctx.fillStyle = D.alpha(c.s1, 0.2); ctx.fill(); ctx.strokeStyle = c.s1; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
    var ly = y0 - h - 9 < 30 ? y0 + h + 10 : y0 - h - 9;
    D.text(ctx, label, x, ly, { color: c.s1, size: 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2 });
  }

  // what the eye sees: without and with the instrument (same angular scale)
  function drawViews(ctx, x, y, w, h, c, p, o, fs) {
    D.roundRect(ctx, x, y, w, h, 8, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.15));
    var r = Math.min(h * 0.36, w * 0.16), cy = y + h / 2 + 6, c1 = x + w - r * 3.6, c2 = x + w - r * 1.2;
    var txt = o.mic ? ['A letter “F” 1 mm tall.', 'Eye alone: held at 25 cm.', 'Through the microscope:', M.fmt(Math.abs(o.M), 0) + '× bigger, upside down.']
      : ['The Moon (craters to show', 'which way up). Eye alone:', 'small. Through the telescope:', M.fmt(Math.abs(o.M), 0) + '× bigger, upside down.'];
    var tx = x + 8, maxW = c1 - r - tx - 6;
    txt.forEach(function (s, i) { D.text(ctx, s, tx, y + 14 + i * (fs + 4), { color: i === 3 ? c.s3 : c.muted, size: Math.min(fs - 1, Math.max(8, maxW / s.length * 1.9)), weight: i === 3 ? 700 : 500 }); });
    var big = r * 1.3, small = big / Math.abs(o.M);
    [[c1, small, false, 'eye alone'], [c2, big, true, o.mic ? 'microscope' : 'telescope']].forEach(function (v) {
      ctx.save(); ctx.beginPath(); ctx.arc(v[0], cy, r, 0, 2 * Math.PI); ctx.fillStyle = o.mic ? (c.light ? '#fefce8' : '#1f2937') : '#020617'; ctx.fill();
      ctx.strokeStyle = D.alpha(c.ink, 0.6); ctx.lineWidth = 1.2; ctx.stroke(); ctx.clip();
      ctx.translate(v[0], cy); if (v[2]) ctx.rotate(Math.PI);
      var s = Math.max(v[1], 0.6);
      if (o.mic) { // letter F
        ctx.fillStyle = c.light ? '#111827' : '#f8fafc';
        ctx.fillRect(-s * 0.3, -s * 0.5, s * 0.16, s); ctx.fillRect(-s * 0.3, -s * 0.5, s * 0.6, s * 0.16); ctx.fillRect(-s * 0.3, -s * 0.08, s * 0.45, s * 0.14);
      } else { // Moon with two craters
        D.circle(ctx, 0, 0, s / 2, '#e5e7eb');
        if (s > 6) { D.circle(ctx, s * 0.18, -s * 0.2, s * 0.1, '#9ca3af'); D.circle(ctx, -s * 0.15, s * 0.12, s * 0.14, '#9ca3af'); D.circle(ctx, s * 0.05, s * 0.3, s * 0.05, '#9ca3af'); }
      }
      ctx.restore();
      D.text(ctx, v[3], v[0], cy - r - 7, { color: c.text, size: fs - 2, weight: 700, align: 'center' });
    });
  }
})();
