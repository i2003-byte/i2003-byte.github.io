/* =====================================================================
   Electricity & Magnetism · Field of a Loop and a Solenoid — sim.js
   ---------------------------------------------------------------------
   The canvas is a cut-away view: the coil is sliced along its axis, so
   every turn shows up as two dots, one at the top (current out of the
   screen ⊙) and one at the bottom (into the screen ⊗), or the reverse.
   The field is the exact 3-D field of circular loops (axis = screen x,
   ρ = height above the axis), from the standard elliptic-integral form:
     α² = a²+ρ²+z²−2aρ,  β² = a²+ρ²+z²+2aρ,  k² = 1 − α²/β²,  C = μ₀I/π
     Bρ = C z /(2α²βρ) · [(a²+ρ²+z²) E(k) − α² K(k)]
     Bz = C /(2α²β)   · [(a²−ρ²−z²) E(k) + α² K(k)]
   K and E come from the arithmetic-geometric mean. Check: at the centre
   of one loop Bz = μ₀I/(2a). Field lines are traced from seeds across
   the middle of the coil, in both directions, until they close up.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var MU0 = 4e-7 * Math.PI;
  var drag = false, cache = { key: '', lines: [] };

  function ellipticKE(k2) {
    k2 = Math.min(k2, 1 - 1e-12);
    var a = 1, b = Math.sqrt(1 - k2), sum = 0.5 * k2, pow = 0.5, c;
    for (var i = 0; i < 30; i++) {
      var an = (a + b) / 2; c = (a - b) / 2; b = Math.sqrt(a * b); a = an; pow *= 2; sum += pow * c * c;
      if (Math.abs(c) < 1e-13) break;
    }
    var K = Math.PI / (2 * a);
    return { K: K, E: K * (1 - sum) };
  }
  // field of one loop (radius a, current I, at z = 0) at (z, ρ ≥ 0)
  function loopField(a, I, z, rho) {
    var s = a * a + rho * rho + z * z, al2 = Math.max(s - 2 * a * rho, 1e-14), be2 = s + 2 * a * rho, be = Math.sqrt(be2);
    var ke = ellipticKE(1 - al2 / be2), C = MU0 * I / Math.PI;
    var Bz = C / (2 * al2 * be) * ((a * a - rho * rho - z * z) * ke.E + al2 * ke.K);
    var Br = rho < 1e-9 ? 0 : C * z / (2 * al2 * be * rho) * (s * ke.E - al2 * ke.K);
    return { z: Bz, r: Br };
  }

  function isSol(p) { return p.mode === 'solenoid'; }
  function geo(sim) {
    var W = sim.width, H = sim.height, p = sim.p, sol = isSol(p);
    var pxm = sol ? Math.min(W / 0.36, H / 0.24) : Math.min(W, H) / 0.2;
    var a = p.r / 100, L = p.L / 100, N = Math.round(p.N), zs = [];
    if (sol) for (var i = 0; i < N; i++) zs.push(-L / 2 + L * (i + 0.5) / N);
    else zs.push(0);
    var cy = H / 2 + (W < 560 ? 8 : 6);
    return { pxm: pxm, cx: W / 2, cy: cy, a: a, L: L, N: N, zs: zs, mult: sol ? 1 : N, sign: p.dir === 'out' ? 1 : -1, sol: sol };
  }
  // field in tesla at canvas point; returned in screen axes (x right, y down)
  function field(sim, g, x, y) {
    var z = (x - g.cx) / g.pxm, rho = (g.cy - y) / g.pxm, ar = Math.abs(rho), bz = 0, br = 0, I = sim.p.I * g.sign * g.mult;
    for (var i = 0; i < g.zs.length; i++) { var f = loopField(g.a, I, z - g.zs[i], ar); bz += f.z; br += f.r; }
    if (rho < 0) br = -br;
    return { x: bz, y: -br };
  }
  function wires(g) { // dots in canvas px: top and bottom of each turn
    var out = [];
    g.zs.forEach(function (z) {
      var x = g.cx + z * g.pxm;
      out.push({ x: x, y: g.cy - g.a * g.pxm, top: true }, { x: x, y: g.cy + g.a * g.pxm, top: false });
    });
    return out;
  }
  function centreB(sim, g) { return field(sim, g, g.cx, g.cy).x; }
  function formulaB(sim, g) { return g.sol ? MU0 * (g.N / g.L) * sim.p.I : MU0 * g.N * sim.p.I / (2 * g.a); }
  function fmtB(b) { b = Math.abs(b); return b >= 1e-3 ? M.fmt(b * 1e3, 2) + ' mT' : M.fmt(b * 1e6, b < 1e-5 ? 2 : 1) + ' μT'; }

  function traceAll(sim, g) {
    var W = sim.width, H = sim.height, ws = wires(g), seeds = g.sol ? 11 : 9, lines = [];
    function dmin(x, y) { var d = 1e9; for (var i = 0; i < ws.length; i++) d = Math.min(d, Math.hypot(x - ws[i].x, y - ws[i].y)); return d; }
    function run(x0, y0, dir) {
      var x = x0, y = y0, pts = [[x, y]], len = 0, closed = false;
      for (var s = 0; s < 4000; s++) {
        var dm = dmin(x, y); if (dm < 2.5) break;
        var h = M.clamp(dm * 0.25, 0.8, 5) * dir;
        var b1 = field(sim, g, x, y), m1 = Math.hypot(b1.x, b1.y); if (!m1) break;
        var xm = x + b1.x / m1 * h / 2, ym = y + b1.y / m1 * h / 2;
        var b2 = field(sim, g, xm, ym), m2 = Math.hypot(b2.x, b2.y); if (!m2) break;
        x += b2.x / m2 * h; y += b2.y / m2 * h; len += Math.abs(h); pts.push([x, y]);
        if (x < -30 || x > W + 30 || y < -30 || y > H + 30) break;
        if (len > 40 && Math.hypot(x - x0, y - y0) < Math.abs(h) * 1.3) { pts.push([x0, y0]); closed = true; break; }
      }
      return { pts: pts, closed: closed };
    }
    for (var j = 0; j < seeds; j++) {
      var rho = g.a * (-0.88 + 1.76 * j / (seeds - 1)), x0 = g.cx, y0 = g.cy - rho * g.pxm;
      var f = run(x0, y0, 1), pts = f.pts, si = 1;
      if (!f.closed) { var b = run(x0, y0, -1); pts = b.pts.slice(1).reverse().concat(pts); si = b.pts.length; }
      lines.push({ pts: pts, seed: [x0, y0], si: Math.min(si + 2, pts.length - 1) });
    }
    return lines;
  }

  function compassPos(sim) { return { x: sim.state.fx * sim.width, y: sim.state.fy * sim.height }; }
  function nearCompass(sim, x, y) { var c = compassPos(sim); return Math.hypot(x - c.x, y - c.y) < 36; }
  var ARROWS = ['→ right', '↗ up-right', '↑ up', '↖ up-left', '← left', '↙ down-left', '↓ down', '↘ down-right'];

  SimLab.createSim({
    ariaLabel: 'Cut-away view of a current-carrying circular loop or solenoid with its magnetic field lines and a compass you can drag',
    transport: false,
    mobileAspect: '4 / 5',
    params: [
      { id: 'mode', label: 'Coil', type: 'select', value: 'solenoid', options: [
        { value: 'loop', label: 'Circular loop (N turns wound together)' }, { value: 'solenoid', label: 'Solenoid (N turns spread along a tube)' }] },
      { id: 'N', label: 'Number of turns N', min: 1, max: 30, step: 1, value: 15 },
      { id: 'I', label: 'Current I', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'A' },
      { id: 'r', label: 'Radius of the coil r', min: 1.5, max: 6, step: 0.5, value: 3, unit: 'cm' },
      { id: 'L', label: 'Length of the solenoid', min: 4, max: 20, step: 1, value: 12, unit: 'cm', help: 'Only for the solenoid.' },
      { id: 'dir', label: 'Current direction', type: 'select', value: 'out', options: [
        { value: 'out', label: 'Top wires out of screen ⊙, bottom into ⊗' }, { value: 'in', label: 'Top wires into screen ⊗, bottom out ⊙' }] }
    ],
    readouts: [
      { id: 'Bc', label: 'Field at the centre', key: true },
      { id: 'Bf', label: 'Formula' },
      { id: 'poles', label: 'Poles' },
      { id: 'B', label: 'Field at the compass' },
      { id: 'cdir', label: 'Compass N end points' }
    ],
    onParam: function () { return true; },
    reset: function (sim) { sim.state = { fx: 0.5, fy: 0.12 }; },
    readout: function (sim) {
      var g = geo(sim), bc = centreB(sim, g), cp = compassPos(sim), B = field(sim, g, cp.x, cp.y), m = Math.hypot(B.x, B.y);
      var idx = ((Math.round(Math.atan2(-B.y, B.x) / (Math.PI / 4)) % 8) + 8) % 8;
      return {
        Bc: fmtB(bc),
        Bf: (g.sol ? 'μ₀nI (long solenoid) = ' : 'μ₀NI ÷ 2r = ') + fmtB(formulaB(sim, g)),
        poles: (g.sol ? 'Right end ' : 'Right face ') + (g.sign > 0 ? 'N, left S' : 'S, left N'),
        B: fmtB(m), cdir: ARROWS[idx]
      };
    },
    pointer: {
      down: function (sim, x, y) { drag = nearCompass(sim, x, y); return drag; },
      move: function (sim, x, y) {
        if (!drag) return;
        sim.state.fx = M.clamp(x / sim.width, 0.04, 0.96); sim.state.fy = M.clamp(y / sim.height, 0.08, 0.96); sim.redraw();
      },
      up: function () { drag = false; },
      hover: nearCompass
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, g = geo(sim), small = W < 560;
      D.clear(ctx, W, H, c.bg);
      var lineC = c.light ? '#2563eb' : '#7dd3fc', R = g.a * g.pxm;

      // the coil body (a see-through tube for the solenoid)
      if (g.sol) {
        var x0 = g.cx - g.L / 2 * g.pxm, x1 = g.cx + g.L / 2 * g.pxm;
        D.roundRect(ctx, x0, g.cy - R, x1 - x0, 2 * R, 4, D.alpha(c.muted, 0.08), D.alpha(c.muted, 0.35), 1);
        var sp = (x1 - x0) / g.N;
        ctx.save(); ctx.strokeStyle = D.alpha(c.light ? '#b45309' : '#f59e0b', 0.35); ctx.lineWidth = 1.5;
        g.zs.forEach(function (z) { var x = g.cx + z * g.pxm; ctx.beginPath(); ctx.ellipse(x, g.cy, Math.max(1.5, sp * 0.3), R, 0, 0, Math.PI * 2); ctx.stroke(); });
        ctx.restore();
      } else {
        ctx.save(); ctx.strokeStyle = D.alpha(c.light ? '#b45309' : '#f59e0b', 0.45); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(g.cx, g.cy, R * 0.22, R, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }

      // field lines (cached: tracing is the slow part)
      var key = [p.mode, g.N, p.I, p.r, p.L, p.dir, W, H].join('|');
      if (cache.key !== key) { cache.key = key; cache.lines = traceAll(sim, g); }
      ctx.save(); ctx.strokeStyle = lineC; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
      cache.lines.forEach(function (ln) {
        var pts = ln.pts;
        ctx.beginPath(); pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke();
        // arrow at the seed (inside the coil) and at the farthest visible point (outside)
        var far = -1, fd = 0;
        pts.forEach(function (q, i) { var d = Math.hypot(q[0] - ln.seed[0], q[1] - ln.seed[1]); if (d > fd && q[0] > 8 && q[0] < W - 8 && q[1] > 30 && q[1] < H - 8) { fd = d; far = i; } });
        [ln.si, far].forEach(function (i) {
          if (i < 1 || i >= pts.length) return;
          var q = pts[i], qp = pts[i - 1], ang = Math.atan2(q[1] - qp[1], q[0] - qp[0]);
          if (!isFinite(ang) || (q[0] === qp[0] && q[1] === qp[1])) return;
          D.arrow(ctx, q[0] - Math.cos(ang) * 6, q[1] - Math.sin(ang) * 6, q[0] + Math.cos(ang) * 4, q[1] + Math.sin(ang) * 4, lineC, 1.5, 7);
        });
      });
      ctx.restore();

      // wires seen end-on
      var wr = g.sol ? M.clamp((g.L * g.pxm / g.N) * 0.38, 2.5, 7) : 8;
      wires(g).forEach(function (w) {
        var out = w.top === (g.sign > 0);
        D.circle(ctx, w.x, w.y, wr, c.light ? '#fde68a' : '#b45309', c.ink, 1.2);
        if (wr < 3.5) return;
        if (out) D.circle(ctx, w.x, w.y, Math.max(1, wr * 0.3), c.ink);
        else { var e = wr * 0.55; D.line(ctx, w.x - e, w.y - e, w.x + e, w.y + e, c.ink, 1.3); D.line(ctx, w.x + e, w.y - e, w.x - e, w.y + e, c.ink, 1.3); }
      });
      if (!g.sol && g.N > 1) D.text(ctx, '× ' + g.N + ' turns', g.cx + 12, g.cy - R - 12, { color: c.muted, size: 11, weight: 600, fit: W });
      if (g.sol && wr < 3.5) D.text(ctx, 'top: ' + (g.sign > 0 ? '⊙ out' : '⊗ in') + ' · bottom: ' + (g.sign > 0 ? '⊗ in' : '⊙ out'), g.cx, g.cy + R + 16, { color: c.muted, size: 10.5, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });

      // poles at the ends
      var ex = g.sol ? g.L / 2 * g.pxm + 16 : R * 0.22 + 16, rightN = g.sign > 0;
      [[g.cx + ex, rightN ? 'N' : 'S'], [g.cx - ex, rightN ? 'S' : 'N']].forEach(function (e) {
        D.circle(ctx, e[0], g.cy, 10, e[1] === 'N' ? '#dc2626' : '#2563eb');
        D.text(ctx, e[1], e[0], g.cy + 1, { color: '#fff', size: 12, weight: 800, align: 'center' });
      });

      var head = g.sol ? 'Solenoid cut along its axis: inside, the lines are straight and evenly spaced' : 'Loop cut through its middle: lines curl round each side of the wire';
      if (small) head = g.sol ? 'Solenoid, cut along its axis' : 'Circular loop, cut through its middle';
      D.text(ctx, head, W / 2, 14, { color: c.bg, bg: c.s3, size: small ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: W });
      D.text(ctx, 'Seen from the ' + (rightN ? 'right' : 'left') + ' end, current goes anticlockwise → N pole', W / 2, H - 12, { color: c.muted, size: small ? 9.5 : 11, align: 'center', fit: W });

      // compass
      var cp = compassPos(sim), Bc = field(sim, g, cp.x, cp.y), ang = Math.atan2(Bc.y, Bc.x), Rc = 18;
      D.circle(ctx, cp.x, cp.y, Rc + 3, c.light ? '#f8fafc' : '#0f172a', c.ink, 2);
      ctx.save(); ctx.translate(cp.x, cp.y); ctx.rotate(ang);
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(Rc - 2, 0); ctx.lineTo(0, -5); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.light ? '#94a3b8' : '#e2e8f0'; ctx.beginPath(); ctx.moveTo(-Rc + 2, 0); ctx.lineTo(0, -5); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
      D.circle(ctx, cp.x, cp.y, 2.5, c.ink);
      D.text(ctx, 'drag me', cp.x, cp.y + Rc + 12, { color: c.faint, size: 10, align: 'center', fit: W });
    }
  });
})();
