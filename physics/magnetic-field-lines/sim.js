/* =====================================================================
   Electricity & Magnetism · Magnetic Field Lines — sim.js
   ---------------------------------------------------------------------
   Bar magnets: each magnet is modelled as two poles near its ends (N at
   +1, S at −1). The field at a point is the sum of q r̂ / r² from every
   pole. Field lines are traced from small circles round each N pole,
   following the field direction until they reach an S pole or leave
   the screen, so they run from N to S outside a magnet. Inside the
   magnet (hidden by its body) they run from S back to N.
   Straight wire, current perpendicular to the screen:
     B = μ₀ I / (2π r) = 2×10⁻⁷ I / r  tesla, circles round the wire
   Circles are drawn every 5 μT (r = 2×10⁻⁷ I / (n · 5 μT)), so they
   crowd together near the wire where the field is strong. Right-hand
   thumb rule: current out of the screen → anticlockwise field.
   Scale for the wire: the shorter side of the canvas is 20 cm.
   The Earth's own field (about 45 μT in India) is ignored.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var STEP_UT = 5, SPAN_M = 0.2;
  var drag = false;

  function isWire(p) { return p.mode === 'wire'; }

  // magnets and their poles, in canvas pixels
  function scene(sim) {
    var W = sim.width, H = sim.height, p = sim.p, cx = W / 2, cy = H / 2, mags = [];
    if (p.mode === 'bar') {
      var hl = Math.min(W, H) * 0.2;
      mags.push({ x: cx, hl: hl, nRight: true });
    } else if (p.mode !== 'wire') {
      var h2 = Math.min(W * 0.16, H * 0.2), d = h2 * 1.65;
      mags.push({ x: cx - d, hl: h2, nRight: true }, { x: cx + d, hl: h2, nRight: p.mode === 'repel' ? false : true });
    }
    var poles = [];
    mags.forEach(function (m) {
      var a = m.hl * 0.8, s = m.nRight ? 1 : -1;
      poles.push({ x: m.x + s * a, y: cy, q: 1 }, { x: m.x - s * a, y: cy, q: -1 });
    });
    return { mags: mags, poles: poles, cx: cx, cy: cy };
  }
  function field(sim, sc, x, y) {
    if (isWire(sim.p)) { // tesla, real units
      var pxm = Math.min(sim.width, sim.height) / SPAN_M, dx = x - sc.cx, dy = y - sc.cy, r = Math.max(Math.hypot(dx, dy), 4) / pxm;
      var B = 2e-7 * sim.p.I / r, s = sim.p.dir === 'out' ? 1 : -1; // out of screen → anticlockwise on screen
      var l = Math.hypot(dx, dy) || 1;
      return { x: s * dy / l * B, y: -s * dx / l * B };
    }
    var bx = 0, by = 0;
    sc.poles.forEach(function (q) {
      var dx2 = x - q.x, dy2 = y - q.y, r2 = dx2 * dx2 + dy2 * dy2 + 4, k = q.q / (r2 * Math.sqrt(r2));
      bx += k * dx2; by += k * dy2;
    });
    return { x: bx, y: by };
  }
  function refField(sim) { // field one magnet-length beyond the N end of a single bar magnet → 1
    var hl = Math.min(sim.width, sim.height) * 0.2, a = hl * 0.8, x = hl + 2 * hl;
    return 1 / ((x - a) * (x - a)) - 1 / ((x + a) * (x + a));
  }
  function compassPos(sim) { return { x: sim.state.fx * sim.width, y: sim.state.fy * sim.height }; }
  function nearCompass(sim, x, y) { var c = compassPos(sim); return Math.hypot(x - c.x, y - c.y) < 36; }
  var ARROWS = ['→ right', '↗ up-right', '↑ up', '↖ up-left', '← left', '↙ down-left', '↓ down', '↘ down-right'];

  SimLab.createSim({
    ariaLabel: 'Magnetic field lines around a bar magnet, two magnets, or a straight current-carrying wire, with a compass you can drag',
    transport: false,
    mobileAspect: '4 / 5',
    params: [
      { id: 'mode', label: 'What makes the field', type: 'select', value: 'bar', options: [
        { value: 'bar', label: 'One bar magnet' }, { value: 'attract', label: 'Two magnets, N facing S (attract)' },
        { value: 'repel', label: 'Two magnets, N facing N (repel)' }, { value: 'wire', label: 'Straight wire carrying current' }] },
      { id: 'I', label: 'Current in the wire I', min: 1, max: 10, step: 0.5, value: 5, unit: 'A', help: 'Only for the straight wire.' },
      { id: 'dir', label: 'Current direction (wire)', type: 'select', value: 'out', options: [
        { value: 'out', label: 'Out of the screen ⊙' }, { value: 'in', label: 'Into the screen ⊗' }] },
      { id: 'lines', label: 'Show field lines', type: 'toggle', value: true },
      { id: 'filings', label: 'Sprinkle iron filings', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'B', label: 'Field at the compass', key: true },
      { id: 'dir', label: 'Compass N end points' },
      { id: 'rule', label: 'Rule' }
    ],
    onParam: function () { return true; },
    reset: function (sim) { sim.state = { fx: 0.5, fy: 0.2 }; },
    readout: function (sim) {
      var sc = scene(sim), cp = compassPos(sim), B = field(sim, sc, cp.x, cp.y), mag = Math.hypot(B.x, B.y);
      var ang = Math.atan2(-B.y, B.x), idx = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
      var rule = isWire(sim.p) ? 'Right-hand thumb rule: thumb along I, fingers curl along B' : 'Outside a magnet, lines run from N to S';
      return {
        B: isWire(sim.p) ? M.fmt(mag * 1e6, 1) + ' μT' : mag < refField(sim) * 0.02 ? 'almost zero' : M.fmt(mag / refField(sim), 2) + ' (relative)',
        dir: mag === 0 ? '—' : ARROWS[idx], rule: rule
      };
    },
    pointer: {
      down: function (sim, x, y) { drag = nearCompass(sim, x, y); return drag; },
      move: function (sim, x, y) {
        if (!drag) return;
        sim.state.fx = M.clamp(x / sim.width, 0.04, 0.96); sim.state.fy = M.clamp(y / sim.height, 0.04, 0.96); sim.redraw();
      },
      up: function () { drag = false; },
      hover: nearCompass
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, sc = scene(sim);
      D.clear(ctx, W, H, c.bg);
      var lineC = c.light ? '#2563eb' : '#7dd3fc';

      // iron filings: short dashes along the field, darker where it is stronger
      if (p.filings) {
        var rnd = M.rng(7), n = Math.round(W * H / 260), ref = isWire(p) ? 2e-7 * 5 / 0.05 : refField(sim);
        ctx.save(); ctx.lineCap = 'round';
        for (var i = 0; i < n; i++) {
          var x = rnd() * W, y = rnd() * H;
          if (inMagnet(sc, x, y) || (isWire(p) && Math.hypot(x - sc.cx, y - sc.cy) < 14)) continue;
          var B = field(sim, sc, x, y), m = Math.hypot(B.x, B.y); if (!m) continue;
          var a = M.clamp(0.25 + 0.3 * Math.log10(m / ref + 0.05) + 0.35, 0.12, 0.95), L = 3.5;
          ctx.strokeStyle = D.alpha(c.light ? '#334155' : '#cbd5e1', a); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(x - B.x / m * L, y - B.y / m * L); ctx.lineTo(x + B.x / m * L, y + B.y / m * L); ctx.stroke();
        }
        ctx.restore();
      }

      if (p.lines) { if (isWire(p)) drawWireLines(sim, ctx, sc, c, lineC); else drawMagnetLines(sim, ctx, sc, c, lineC); }

      // magnets on top
      sc.mags.forEach(function (m) {
        var hh = m.hl * 0.42, y0 = sc.cy - hh / 2, left = m.x - m.hl;
        var nCol = '#dc2626', sCol = '#2563eb', lc = m.nRight ? sCol : nCol, rc = m.nRight ? nCol : sCol;
        D.roundRect(ctx, left, y0, m.hl, hh, 4, lc); D.roundRect(ctx, m.x, y0, m.hl, hh, 4, rc);
        D.line(ctx, m.x, y0, m.x, y0 + hh, 'rgba(255,255,255,0.5)', 1);
        D.text(ctx, m.nRight ? 'S' : 'N', left + m.hl * 0.5, sc.cy + 1, { color: '#fff', size: Math.min(20, hh * 0.6), weight: 800, align: 'center' });
        D.text(ctx, m.nRight ? 'N' : 'S', m.x + m.hl * 0.5, sc.cy + 1, { color: '#fff', size: Math.min(20, hh * 0.6), weight: 800, align: 'center' });
      });
      if (p.mode === 'repel') {
        D.text(ctx, '✕', sc.cx, sc.cy, { color: c.warning, size: 16, weight: 800, align: 'center' });
        D.text(ctx, 'neutral point: no field', sc.cx, sc.cy + sc.mags[0].hl * 0.21 + 18, { color: c.warning, size: 11, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 3, fit: W });
      }

      // the wire, seen end-on
      if (isWire(p)) {
        D.circle(ctx, sc.cx, sc.cy, 11, c.light ? '#fde68a' : '#b45309', c.ink, 2);
        if (p.dir === 'out') D.circle(ctx, sc.cx, sc.cy, 3, c.ink);
        else { D.line(ctx, sc.cx - 6, sc.cy - 6, sc.cx + 6, sc.cy + 6, c.ink, 2); D.line(ctx, sc.cx + 6, sc.cy - 6, sc.cx - 6, sc.cy + 6, c.ink, 2); }
        var head = p.dir === 'out' ? 'Current out of the screen ⊙ → field anticlockwise' : 'Current into the screen ⊗ → field clockwise';
        D.text(ctx, head, W / 2, 16, { color: c.bg, bg: c.s3, size: W < 560 ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: W });
        if (p.lines) D.text(ctx, W < 560 ? 'a circle every ' + STEP_UT + ' μT · short side = 20 cm' : 'one circle every ' + STEP_UT + ' μT: closer circles = stronger field · scale: short side = 20 cm', W / 2, H - 12, { color: c.muted, size: W < 560 ? 9.5 : 11, align: 'center', fit: W });
      } else {
        D.text(ctx, 'Lines leave N and enter S; they never cross', W / 2, 16, { color: c.bg, bg: c.s3, size: W < 560 ? 11.5 : 13, weight: 700, align: 'center', pad: 4, fit: W });
      }

      // compass
      var cp = compassPos(sim), Bc = field(sim, sc, cp.x, cp.y), bm = Math.hypot(Bc.x, Bc.y), ang = bm ? Math.atan2(Bc.y, Bc.x) : -Math.PI / 2, R = 20;
      D.circle(ctx, cp.x, cp.y, R + 3, c.light ? '#f8fafc' : '#0f172a', c.ink, 2);
      ctx.save(); ctx.translate(cp.x, cp.y); ctx.rotate(ang);
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(R - 2, 0); ctx.lineTo(0, -5); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.light ? '#94a3b8' : '#e2e8f0'; ctx.beginPath(); ctx.moveTo(-R + 2, 0); ctx.lineTo(0, -5); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
      D.circle(ctx, cp.x, cp.y, 2.5, c.ink);
      D.text(ctx, 'drag me', cp.x, cp.y + R + 13, { color: c.faint, size: 10, align: 'center', fit: W });
    }
  });

  function inMagnet(sc, x, y) {
    return sc.mags.some(function (m) { var hh = m.hl * 0.42; return Math.abs(x - m.x) < m.hl && Math.abs(y - sc.cy) < hh / 2; });
  }

  function drawMagnetLines(sim, ctx, sc, c, col) {
    var W = sim.width, H = sim.height, per = sc.mags.length > 1 ? 14 : 18, h = 2.5;
    var norths = sc.poles.filter(function (q) { return q.q > 0; }), souths = sc.poles.filter(function (q) { return q.q < 0; });
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
    norths.forEach(function (np) {
      for (var k = 0; k < per; k++) {
        var a0 = (k + 0.5) / per * Math.PI * 2, x = np.x + Math.cos(a0) * 5, y = np.y + Math.sin(a0) * 5;
        var pts = [[x, y]], done = false;
        for (var s = 0; s < 3000 && !done; s++) {
          var B1 = field(sim, sc, x, y), m1 = Math.hypot(B1.x, B1.y); if (m1 < 1e-12) break;
          var xm = x + B1.x / m1 * h / 2, ym = y + B1.y / m1 * h / 2;
          var B2 = field(sim, sc, xm, ym), m2 = Math.hypot(B2.x, B2.y); if (m2 < 1e-12) break;
          x += B2.x / m2 * h; y += B2.y / m2 * h; pts.push([x, y]);
          if (x < -40 || x > W + 40 || y < -40 || y > H + 40) done = true;
          souths.forEach(function (sp) { if (Math.hypot(x - sp.x, y - sp.y) < 4) done = true; });
        }
        ctx.beginPath(); pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke();
        // arrow at the first point well outside any magnet
        for (var j = 10; j < pts.length - 2; j++) {
          if (inMagnet(sc, pts[j][0], pts[j][1])) continue;
          var j2 = Math.min(pts.length - 1, j + 30); if (inMagnet(sc, pts[j2][0], pts[j2][1])) continue;
          var q = pts[j2], qp = pts[j2 - 1];
          if (q[0] < 6 || q[0] > W - 6 || q[1] < 6 || q[1] > H - 6) break;
          var ang = Math.atan2(q[1] - qp[1], q[0] - qp[0]);
          D.arrow(ctx, q[0] - Math.cos(ang) * 6, q[1] - Math.sin(ang) * 6, q[0] + Math.cos(ang) * 3, q[1] + Math.sin(ang) * 3, col, 1.5, 7);
          break;
        }
      }
    });
    ctx.restore();
  }

  function drawWireLines(sim, ctx, sc, c, col) {
    var pxm = Math.min(sim.width, sim.height) / SPAN_M, maxR = Math.hypot(sim.width, sim.height) / 2, s = sim.p.dir === 'out' ? 1 : -1;
    for (var n = 1; n < 60; n++) {
      var r = 2e-7 * sim.p.I / (n * STEP_UT * 1e-6) * pxm;
      if (r < 16) break;
      if (r > maxR) continue;
      D.circle(ctx, sc.cx, sc.cy, r, null, col, 1.5);
      // arrows at the top and bottom of each circle
      [-1, 1].forEach(function (side) {
        var y = sc.cy + side * r, dir = s * side; // out of screen: top runs left, bottom runs right
        D.arrow(ctx, sc.cx - dir * 5, y, sc.cx + dir * 4, y, col, 1.5, 7);
      });
    }
  }
})();
