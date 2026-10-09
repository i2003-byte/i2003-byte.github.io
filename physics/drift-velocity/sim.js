/* =====================================================================
   Current electricity · Drift Velocity of Electrons — sim.js
   ---------------------------------------------------------------------
   Real numbers (shown in the readouts):
     drift speed      v_d = I ÷ (n e A)
     current density  J   = I ÷ A = n e v_d
     resistivity      ρ(T) = ρ20 · (1 + α (T − 20 °C))
     field in wire    E   = ρ J
     relaxation time  τ   = m ÷ (n e² ρ)        (so that v_d = eEτ/m)
   Free-electron density n, ρ20 and α for copper, aluminium and silver
   are standard textbook values.
   The picture (NOT to scale): electrons fly about at a random speed and
   are scattered in random directions at random moments (mean free time
   τs ∝ the real τ). Between collisions the field gives each one a steady
   push opposite to E, with acceleration v_dpic ÷ τs, so on average they
   drift at v_dpic = K · v_d. In a real wire the random speed is about
   a billion times the drift speed; here it is only a few times bigger.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var e = 1.602e-19, me = 9.109e-31;
  var MAT = {
    cu: { name: 'Copper', n: 8.5e28, rho: 1.68e-8, alpha: 0.0039, col: '#e08a4f' },
    al: { name: 'Aluminium', n: 1.81e29, rho: 2.65e-8, alpha: 0.0040, col: '#a8b3c2' },
    ag: { name: 'Silver', n: 5.86e28, rho: 1.59e-8, alpha: 0.0038, col: '#d6dbe3' }
  };
  var TAU_REF = me / (8.5e28 * e * e * 1.68e-8);   // copper at 20 °C ≈ 2.5 × 10⁻¹⁴ s

  function phys(p) {
    var m = MAT[p.mat], A = p.area * 1e-6, rho = m.rho * (1 + m.alpha * (p.temp - 20));
    var vd = p.cur / (m.n * e * A), J = p.cur / A;
    return { m: m, vd: vd, J: J, E: rho * J, rho: rho, tau: me / (m.n * e * e * rho), perS: p.cur / e };
  }
  var SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function sci(v, d) {
    if (!v) return '0';
    var ex = Math.floor(Math.log10(Math.abs(v))), man = v / Math.pow(10, ex);
    if (Math.abs(parseFloat(man.toFixed(d))) >= 10) { man /= 10; ex += 1; }
    return man.toFixed(d) + ' × 10' + String(ex).split('').map(function (ch) { return SUP[ch]; }).join('');
  }
  function dur(s) {
    if (!isFinite(s)) return 'never (no current)';
    if (s < 120) return M.fmt(s, 0) + ' s';
    if (s < 7200) return M.fmt(s / 60, 0) + ' min';
    if (s < 172800) return M.fmt(s / 3600, 1) + ' hours';
    return M.fmt(s / 86400, 1) + ' days';
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560;
    var x0 = narrow ? 34 : 70, x1 = W - x0, top = narrow ? 62 : 74, bot = H - (narrow ? 46 : 56);
    var maxH = bot - top, hh = maxH * (0.32 + 0.68 * (sim.p.area - 0.5) / 5.5);
    var cy = (top + bot) / 2;
    return { W: W, H: H, x0: x0, x1: x1, y0: cy - hh / 2, y1: cy + hh / 2, cy: cy, narrow: narrow, k: Math.max(0.55, Math.min(1.3, W / 800)) };
  }

  SimLab.createSim({
    ariaLabel: 'A section of metal wire with fixed positive ions and free electrons darting about randomly; when current flows they slowly drift opposite to the electric field, and one electron leaves a trail',
    mobileAspect: '3 / 3.4',
    playLabel: 'Switch on',
    params: [
      { id: 'cur', label: 'Current I', min: 0, max: 5, step: 0.1, value: 1, unit: 'A', presets: [0, 1, 5] },
      { id: 'area', label: 'Cross-section area A', min: 0.5, max: 6, step: 0.1, value: 1, unit: 'mm²', presets: [1, 2.5, 6],
        help: 'Thicker wire: the same current is shared by more electrons.' },
      { id: 'mat', label: 'Metal', type: 'select', value: 'cu', options: Object.keys(MAT).map(function (k) { return { value: k, label: MAT[k].name }; }) },
      { id: 'temp', label: 'Temperature of the wire', min: 20, max: 300, step: 5, value: 20, unit: '°C',
        help: 'Hotter wire: more collisions, so a bigger field is needed for the same current.' },
      { id: 'trail', label: 'Follow one electron', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'vd', label: 'Drift speed v_d', short: 'Drift speed', unit: 'mm/s', digits: 4, key: true },
      { id: 't1', label: 'Time to drift 1 m', short: '1 m takes', key: true },
      { id: 'n', label: 'Free electrons n', unit: 'per m³' },
      { id: 'ps', label: 'Electrons passing per second', unit: '/s' },
      { id: 'J', label: 'Current density J', unit: 'A/mm²', digits: 2 },
      { id: 'E', label: 'Field in the wire E', unit: 'V/m', digits: 4 },
      { id: 'tau', label: 'Relaxation time τ', short: 'τ', unit: 's', key: true }
    ],
    onParam: function (sim, id) {
      if (id === 'area' || id === 'mat') { this.reset(sim); }
      return true;
    },
    reset: function (sim) {
      var L = layout(sim), m = MAT[sim.p.mat];
      var dens = 0.0042 * (m.n / 8.5e28) * (sim.width < 560 ? 1.3 : 1);
      var N = Math.round(M.clamp((L.x1 - L.x0) * (L.y1 - L.y0) * dens, 25, 170)), es = [];
      for (var i = 0; i < N; i++) {
        var a = Math.random() * Math.PI * 2;
        es.push({ x: Math.random(), y: Math.random(), vx: Math.cos(a), vy: Math.sin(a), sp: 0.7 + Math.random() * 0.6 });
      }
      sim.state = { es: es, trail: [], net: 0, w: L.x1 - L.x0, h: L.y1 - L.y0 };
    },
    update: function (sim, dt) {
      var st = sim.state, L = layout(sim), P = phys(sim.p), w = L.x1 - L.x0, h = L.y1 - L.y0;
      var vth = 150 * L.k, tauS = M.clamp(0.22 * P.tau / TAU_REF, 0.025, 0.6);
      var vdPic = P.vd * 1000 * 250 * L.k;                  // px/s, drift exaggerated
      var acc = -vdPic / tauS;                              // electrons pushed opposite to E (E points right)
      st.es.forEach(function (q, i) {
        if (Math.random() < dt / tauS) {                    // a collision: new random direction
          var a = Math.random() * Math.PI * 2;
          q.sp = 0.7 + Math.random() * 0.6; q.vx = Math.cos(a) * q.sp; q.vy = Math.sin(a) * q.sp;
          q.dx = 0;
        }
        q.dx = (q.dx || 0) + acc * dt;                        // velocity gained from the field since the last collision
        var vx = q.vx * vth + q.dx, vy = q.vy * vth;
        var nx = q.x + vx * dt / w, ny = q.y + vy * dt / h;
        if (ny < 0) { ny = -ny; q.vy = -q.vy; } else if (ny > 1) { ny = 2 - ny; q.vy = -q.vy; }
        var wrapped = false;
        if (nx < 0) { nx += 1; wrapped = true; } else if (nx > 1) { nx -= 1; wrapped = true; }
        q.x = nx; q.y = ny;
        if (i === 0) {
          st.net += vx * dt;
          if (wrapped) st.trail = [];
          st.trail.push([q.x, q.y]);
          if (st.trail.length > 900) st.trail.shift();
        }
      });
    },
    readout: function (sim) {
      var P = phys(sim.p);
      return { vd: P.vd * 1000, t1: dur(1 / P.vd), n: sci(P.m.n, 2), ps: sci(P.perS, 2), J: P.J / 1e6, E: P.E, tau: sci(P.tau, 1) };
    },
    status: function (sim) {
      var P = phys(sim.p);
      return (sim.running ? 'Current on' : 'Paused') + ' · v_d = ' + M.fmt(P.vd * 1000, 4) + ' mm/s';
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, P = phys(p), st = sim.state;
      D.clear(ctx, W, H, c.bg);
      var w = L.x1 - L.x0, h = L.y1 - L.y0, mcol = P.m.col;
      if (st.w !== w || st.h !== h) { st.w = w; st.h = h; }

      // battery ends and connecting leads
      D.line(ctx, 6, L.cy, L.x0, L.cy, c.muted, 3); D.line(ctx, L.x1, L.cy, W - 6, L.cy, c.muted, 3);
      D.text(ctx, '+', L.narrow ? 12 : 22, L.y0 - 14, { color: c.danger, size: 18, weight: 700, align: 'center' });
      D.text(ctx, '−', W - (L.narrow ? 12 : 22), L.y0 - 14, { color: c.s1, size: 18, weight: 700, align: 'center' });
      // wire body
      D.roundRect(ctx, L.x0, L.y0, w, h, Math.min(14, h / 2), D.alpha(mcol, c.light ? 0.28 : 0.16), D.alpha(mcol, 0.9), 2);
      // fixed positive ions, jiggling more when hot
      var gs = L.narrow ? 30 : 38, amp = 0.6 + (p.temp - 20) / 280 * 2.4, now = performance.now() / 1000;
      var rows = Math.max(1, Math.round(h / gs)), dy = h / rows, cols = Math.max(2, Math.round(w / gs)), dxs = w / cols;
      for (var r = 0; r < rows; r++) for (var q = 0; q < cols; q++) {
        var jx = sim.running && !sim.reduceMotion ? Math.sin(now * 23 + r * 7 + q * 3) * amp : 0;
        var jy = sim.running && !sim.reduceMotion ? Math.cos(now * 19 + q * 5 + r) * amp : 0;
        var ix = L.x0 + dxs * (q + 0.5) + jx, iy = L.y0 + dy * (r + 0.5) + jy;
        D.circle(ctx, ix, iy, 5.5, D.alpha(mcol, 0.55), D.alpha(c.ink, 0.25), 1);
        D.text(ctx, '+', ix, iy + 0.5, { color: c.ink, size: 9, weight: 700, align: 'center' });
      }
      // trail of the followed electron
      if (p.trail && st.trail.length > 1) {
        ctx.save(); ctx.strokeStyle = D.alpha(c.warning, 0.75); ctx.lineWidth = 1.5; ctx.beginPath();
        st.trail.forEach(function (pt, i) { var x = L.x0 + pt[0] * w, y = L.y0 + pt[1] * h; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        ctx.stroke(); ctx.restore();
      }
      // electrons
      st.es.forEach(function (q, i) {
        var x = L.x0 + q.x * w, y = L.y0 + q.y * h;
        if (i === 0 && p.trail) D.circle(ctx, x, y, 6, c.warning, c.bg, 1.5);
        else D.circle(ctx, x, y, 3.2, c.s1);
      });

      // field, current and drift arrows
      var on = p.cur > 0, ay = L.y0 - (L.narrow ? 28 : 34), fs = L.narrow ? 11 : 12.5, mid = W / 2, len = Math.min(110, w * 0.28);
      if (on) {
        D.arrow(ctx, mid - len - 30, ay, mid - 30, ay, c.danger, 2.5, 9);
        D.text(ctx, 'E', mid - len - 42, ay, { color: c.danger, size: fs, weight: 700, align: 'center' });
        D.arrow(ctx, mid + 20, ay, mid + 20 + len * 0.7, ay, c.success, 2.5, 9);
        D.text(ctx, 'I', mid + 30 + len * 0.7, ay, { color: c.success, size: fs, weight: 700 });
        var by = L.y1 + (L.narrow ? 18 : 22);
        D.arrow(ctx, mid + len / 2, by, mid - len / 2, by, c.s1, 2.5, 9);
        D.text(ctx, 'electrons drift (picture speeded up)', mid, by + (L.narrow ? 15 : 18), { color: c.s1, size: fs - 1, weight: 600, align: 'center', fit: W });
      } else {
        D.text(ctx, 'No current: random motion only, no drift', mid, L.y1 + 22, { color: c.muted, size: fs, weight: 600, align: 'center', fit: W });
      }
      // headline
      var hl = P.m.name + ' · ' + p.cur.toFixed(1) + ' A in ' + p.area.toFixed(1) + ' mm² → v_d = ' + M.fmt(P.vd * 1000, 3) + ' mm/s';
      var hs = L.narrow ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, on ? hl : 'Current is zero → no drift', W / 2, 14, { color: c.bg, bg: on ? c.s1 : c.muted, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
