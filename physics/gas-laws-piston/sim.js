/* =====================================================================
   Kinetic theory · Gas Laws with a Piston — sim.js
   ---------------------------------------------------------------------
   0.0401 mol of an ideal gas (100 kPa, 1.00 L at 300 K) in a cylinder.
   PV = nRT, with one quantity held fixed in each mode:
     boyle    T fixed, you set V    → P = nRT/V      (P ∝ 1/V)
     charles  P fixed (load), set T → V = nRT/P      (V ∝ T)
     gay      V fixed (pinned), set T → P = nRT/V    (P ∝ T)
   The picture: 60 molecules in the cylinder, drawn speeds ∝ √T, and
   the piston at a height ∝ V (eased so it moves visibly). The molecules
   are only an illustration; P, V and T come from PV = nRT. Hits on the
   piston are counted from the picture (∝ n v / V).
   The plot on the right shows the law's line and the points visited.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var R = 8.314, N_MOL = 100 * 1e3 * 1e-3 / (R * 300), VMAX = 2, NM = 60;

  function state(p) {
    var T = p.T, V, P;
    if (p.law === 'charles') { P = p.P; V = N_MOL * R * T / (P * 1e3) * 1e3; }
    else { V = p.V; P = N_MOL * R * T / (V * 1e-3) / 1e3; }
    return { P: P, V: V, T: T };
  }
  function showCtl(id, on) {
    var el = document.getElementById('ctl-' + id), box = el && el.closest('.control');
    if (box) box.style.display = on ? '' : 'none';
  }
  function syncControls(p) { showCtl('V', p.law !== 'charles'); showCtl('P', p.law === 'charles'); }
  function celsius(T) { var t = Math.round(T - 273); return (t < 0 ? '−' + (-t) : t) + ' °C'; }
  function niceCeil(v) { var s = D.niceStep(v, 4); return Math.ceil(v / s) * s; }

  function plotSpec(p) {
    if (p.law === 'boyle') {
      var pm = niceCeil(N_MOL * R * p.T / 0.25e-3 / 1e3);
      return { xKey: 'V', yKey: 'P', xMax: VMAX, yMax: pm, xLab: 'V (L)', yLab: 'P (kPa)',
        f: function (V) { return N_MOL * R * p.T / (V * 1e-3) / 1e3; }, x0: 0.2 };
    }
    if (p.law === 'charles') return { xKey: 'T', yKey: 'V', xMax: 600, yMax: VMAX, xLab: 'T (K)', yLab: 'V (L)',
      f: function (T) { return N_MOL * R * T / (p.P * 1e3) * 1e3; }, x0: 0, from: 100 };
    return { xKey: 'T', yKey: 'P', xMax: 600, yMax: niceCeil(N_MOL * R * 600 / (p.V * 1e-3) / 1e3), xLab: 'T (K)', yLab: 'P (kPa)',
      f: function (T) { return N_MOL * R * T / (p.V * 1e-3) / 1e3; }, x0: 0, from: 100 };
  }
  function remember(sim) {
    var s = sim.state, st = state(sim.p), last = s.pts[s.pts.length - 1];
    if (!last || Math.abs(last.P - st.P) > 1e-6 || Math.abs(last.V - st.V) > 1e-6 || last.T !== st.T) s.pts.push(st);
    if (s.pts.length > 60) s.pts.shift();
  }

  SimLab.createSim({
    ariaLabel: 'Gas in a cylinder with a piston beside a graph; change the volume or the temperature to see Boyle’s law, Charles’s law and the pressure law',
    mobileAspect: '4 / 5',
    playLabel: 'Show molecules',
    params: [
      { id: 'law', label: 'Keep fixed', type: 'select', value: 'boyle', options: [
        { value: 'boyle', label: 'Temperature fixed: Boyle’s law' }, { value: 'charles', label: 'Pressure fixed: Charles’s law' },
        { value: 'gay', label: 'Volume fixed: pressure law' }] },
      { id: 'V', label: 'Volume V (push or pull the piston)', min: 0.25, max: 2, step: 0.05, value: 1, unit: 'L',
        presets: [{ label: '0.5 L', value: 0.5 }, { label: '1 L', value: 1 }, { label: '2 L', value: 2 }] },
      { id: 'T', label: 'Temperature T', min: 100, max: 600, step: 10, value: 300, unit: 'K',
        presets: [{ label: '150 K', value: 150 }, { label: '300 K', value: 300 }, { label: '600 K', value: 600 }] },
      { id: 'P', label: 'Pressure from the load on the piston', min: 100, max: 300, step: 10, value: 100, unit: 'kPa' }
    ],
    readouts: [
      { id: 'P', label: 'Pressure P', unit: 'kPa', digits: 1, key: true },
      { id: 'V', label: 'Volume V', unit: 'L', digits: 3, key: true },
      { id: 'T', label: 'Temperature T', key: true },
      { id: 'PV', label: 'P × V (= nRT)', unit: 'J', digits: 1 },
      { id: 'VT', label: 'V ÷ T', unit: 'mL/K', digits: 3 },
      { id: 'PT', label: 'P ÷ T', unit: 'kPa/K', digits: 3 },
      { id: 'hits', label: 'Hits on the piston per second (picture)', digits: 0 }
    ],
    onParam: function (sim, id) {
      if (id === 'law') { syncControls(sim.p); sim.state.pts = []; }
      remember(sim);
      return true;
    },
    reset: function (sim) {
      var rnd = M.rng(11), mol = [];
      for (var i = 0; i < NM; i++) { var a = rnd() * Math.PI * 2; mol.push({ x: 0.05 + 0.9 * rnd(), y: rnd(), vx: Math.cos(a), vy: Math.sin(a), s: 0.6 + 0.8 * rnd() }); }
      var st = state(sim.p);
      sim.state = { mol: mol, h: st.V / VMAX, pts: [], hits: [] };
      syncControls(sim.p); remember(sim);
    },
    update: function (sim, dt) {
      var s = sim.state, st = state(sim.p), target = st.V / VMAX, t = sim.time;
      s.h += (target - s.h) * Math.min(1, dt * 4);
      var sp = 0.9 * Math.sqrt(st.T / 300); // box heights per second (cylinder height = 2 L)
      s.mol.forEach(function (m) {
        m.x += m.vx * m.s * sp * dt * 0.6; m.y += m.vy * m.s * sp * dt; // y is measured from the bottom, in cylinder heights
        if (m.x < 0.03) { m.x = 0.06 - m.x; m.vx = Math.abs(m.vx); }
        if (m.x > 0.97) { m.x = 1.94 - m.x; m.vx = -Math.abs(m.vx); }
        if (m.y < 0) { m.y = -m.y; m.vy = Math.abs(m.vy); }
        if (m.y > s.h) { m.y = Math.max(0, 2 * s.h - m.y); if (m.vy > 0) { m.vy = -m.vy; s.hits.push(t); } }
      });
      while (s.hits.length && s.hits[0] < t - 2) s.hits.shift();
    },
    readout: function (sim) {
      var st = state(sim.p), s = sim.state;
      return { P: st.P, V: st.V, T: st.T + ' K (' + celsius(st.T) + ')', PV: st.P * st.V,
        VT: st.V / st.T * 1e3, PT: st.P / st.T, hits: sim.time > 0.5 ? s.hits.length / Math.min(2, sim.time) : '—' };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, st = state(p);
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560, fs = narrow ? 11 : 12.5;
      if (!sim.running) s.h = st.V / VMAX;
      var head = p.law === 'boyle' ? 'Boyle’s law: T fixed, P × V stays the same'
        : p.law === 'charles' ? 'Charles’s law: P fixed, V ∝ T (in kelvin)' : 'Pressure law: V fixed, P ∝ T (in kelvin)';
      D.text(ctx, head, W / 2, 15, { color: c.bg, bg: c.accent, size: narrow ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: W });

      // ---- cylinder
      var cw = narrow ? W * 0.34 : Math.min(W * 0.28, 230), cx0 = narrow ? 12 : Math.max(24, W * 0.05);
      var topY = 92, botY = H - 76, ch = botY - topY, gasTop = botY - ch * s.h;
      ctx.fillStyle = D.alpha(st.T > 300 ? c.danger : c.s1, 0.06 + 0.1 * Math.abs(st.T - 300) / 300);
      ctx.fillRect(cx0, gasTop, cw, botY - gasTop);
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(cx0, topY - 18); ctx.lineTo(cx0, botY); ctx.lineTo(cx0 + cw, botY); ctx.lineTo(cx0 + cw, topY - 18); ctx.stroke(); ctx.restore();
      // volume marks (0.5 L steps)
      for (var v = 0.5; v <= VMAX; v += 0.5) {
        var vy = botY - ch * v / VMAX;
        D.line(ctx, cx0 + cw - 8, vy, cx0 + cw, vy, c.muted, 1.2);
        D.text(ctx, M.fmt(v, 1), cx0 + cw + 4, vy, { color: c.muted, size: 9.5, fit: W });
      }
      // molecules
      var mr = narrow ? 3 : 3.6, hue = Math.round(220 - 200 * M.clamp((st.T - 100) / 500, 0, 1));
      s.mol.forEach(function (m) {
        var y = Math.min(m.y, s.h);
        D.circle(ctx, cx0 + 6 + m.x * (cw - 12), botY - 4 - y * (ch - 8), mr, 'hsl(' + hue + ',80%,' + (c.light ? 45 : 60) + '%)');
      });
      // piston, rod and what holds it
      var pc = c.light ? '#64748b' : '#94a3b8';
      D.roundRect(ctx, cx0 + 2, gasTop - 12, cw - 4, 12, 3, pc);
      D.line(ctx, cx0 + cw / 2, gasTop - 12, cx0 + cw / 2, Math.max(topY - 30, gasTop - 50), pc, 5);
      if (p.law === 'charles') {
        var nb = Math.round(p.P / 50), bw = Math.min(cw * 0.7, 80), bh = Math.min(10, (gasTop - 40) / (nb + 1));
        for (var b = 0; b < nb && bh > 3; b++) D.roundRect(ctx, cx0 + cw / 2 - bw / 2, gasTop - 14 - bh * (b + 1), bw, bh - 1.5, 2, b < 2 ? D.alpha(c.muted, 0.5) : c.warning);
        D.text(ctx, p.P + ' kPa load', cx0 + cw / 2, Math.max(40, gasTop - 22 - bh * nb), { color: c.warning, size: fs - 1, weight: 700, align: 'center', fit: W });
      } else if (p.law === 'gay') {
        D.line(ctx, cx0 - 8, gasTop - 6, cx0 + 14, gasTop - 6, c.danger, 4); D.line(ctx, cx0 + cw - 14, gasTop - 6, cx0 + cw + 8, gasTop - 6, c.danger, 4);
        D.text(ctx, 'pinned', cx0 + cw / 2, gasTop - 58, { color: c.danger, size: fs - 1, weight: 700, align: 'center', fit: W });
      } else {
        D.roundRect(ctx, cx0 + cw / 2 - 18, Math.max(topY - 36, gasTop - 58), 36, 8, 3, pc);
        D.text(ctx, '⇕ push / pull', cx0 + cw / 2, Math.max(topY - 46, gasTop - 70), { color: c.muted, size: fs - 1, weight: 600, align: 'center', fit: W });
      }
      // heater or cooling bath under the cylinder
      var hy = botY + 14;
      if (st.T >= 300) {
        var fl = 3 + 10 * (st.T - 300) / 300;
        for (var f = 0; f < 5; f++) {
          var fx = cx0 + cw * (0.2 + 0.15 * f), wob = sim.reduceMotion ? 0 : Math.sin(now / 120 + f) * 2;
          ctx.fillStyle = D.alpha('#f97316', 0.85); ctx.beginPath(); ctx.moveTo(fx - 5, hy + 18); ctx.quadraticCurveTo(fx + wob, hy + 18 - fl * 2, fx + 5, hy + 18); ctx.fill();
        }
      } else {
        D.roundRect(ctx, cx0 - 4, botY + 4, cw + 8, 20, 4, D.alpha(c.s1, 0.35));
        D.text(ctx, 'cooling bath', cx0 + cw / 2, botY + 14, { color: c.ink, size: 10, weight: 600, align: 'center' });
      }
      D.text(ctx, 'T = ' + st.T + ' K', cx0 + cw / 2, H - 38, { color: c.ink, size: fs, weight: 700, align: 'center', fit: W });
      D.text(ctx, '(' + celsius(st.T) + ')', cx0 + cw / 2, H - 22, { color: c.muted, size: fs - 1, align: 'center', fit: W });

      // ---- plot
      var sp = plotSpec(p), gx0 = cx0 + cw + (narrow ? 50 : 70), gx1 = W - (narrow ? 10 : 24), gy0 = 50, gy1 = H - 56;
      var X = function (x) { return gx0 + (gx1 - gx0) * x / sp.xMax; }, Y = function (y) { return gy1 - (gy1 - gy0) * Math.min(y, sp.yMax * 1.02) / sp.yMax; };
      D.line(ctx, gx0, gy1, gx1, gy1, c.axis || c.muted, 1.5); D.line(ctx, gx0, gy1, gx0, gy0, c.axis || c.muted, 1.5);
      var xs = D.niceStep(sp.xMax, narrow ? 3 : 5), ys = D.niceStep(sp.yMax, 4);
      for (var xv = 0; xv <= sp.xMax + 1e-9; xv += xs) { D.line(ctx, X(xv), gy1, X(xv), gy1 + 4, c.muted, 1); D.text(ctx, String(+xv.toFixed(2)), X(xv), gy1 + 13, { color: c.muted, size: 9.5, align: 'center', fit: W }); }
      for (var yv = 0; yv <= sp.yMax + 1e-9; yv += ys) { D.line(ctx, gx0 - 4, Y(yv), gx0, Y(yv), c.muted, 1); D.text(ctx, String(+yv.toFixed(2)), gx0 - 6, Y(yv), { color: c.muted, size: 9.5, align: 'right' }); }
      D.text(ctx, sp.xLab, (gx0 + gx1) / 2, gy1 + 28, { color: c.ink, size: fs - 1, weight: 600, align: 'center', fit: W });
      D.text(ctx, sp.yLab, gx0 - 6, gy0 - 14, { color: c.ink, size: fs - 1, weight: 600, align: narrow ? 'left' : 'center', fit: W });
      // the law's curve (dashed where it is extrapolated towards 0 K)
      ctx.save(); ctx.beginPath(); ctx.rect(gx0, gy0 - 4, gx1 - gx0, gy1 - gy0 + 4); ctx.clip();
      if (sp.from) {
        D.line(ctx, X(0), Y(sp.f(0)), X(sp.from), Y(sp.f(sp.from)), D.alpha(c.s2, 0.8), 2, [5, 5]);
        D.curve(ctx, function (px) { return Y(sp.f((px - gx0) / (gx1 - gx0) * sp.xMax)); }, X(sp.from), gx1, c.s2, 2.5, 3);
      } else D.curve(ctx, function (px) { return Y(sp.f((px - gx0) / (gx1 - gx0) * sp.xMax)); }, X(sp.x0), gx1, c.s2, 2.5, 2);
      ctx.restore();
      if (sp.from) D.text(ctx, '0 K = −273 °C', X(0) + 8, gy1 - 22, { color: c.muted, size: 9.5, fit: W });
      s.pts.forEach(function (q) { if (q[sp.yKey] <= sp.yMax * 1.02) D.circle(ctx, X(q[sp.xKey]), Y(q[sp.yKey]), 3, D.alpha(c.ink, 0.35)); });
      var cxp = X(st[sp.xKey]), cyp = Y(st[sp.yKey]);
      D.line(ctx, cxp, cyp, cxp, gy1, D.alpha(c.danger, 0.5), 1, [3, 3]); D.line(ctx, gx0, cyp, cxp, cyp, D.alpha(c.danger, 0.5), 1, [3, 3]);
      D.circle(ctx, cxp, cyp, 6, c.danger, c.bg, 2);

      // ---- the law in numbers
      var eq = p.law === 'boyle' ? 'P × V = ' + M.fmt(st.P, 1) + ' × ' + M.fmt(st.V, 2) + ' = ' + M.fmt(st.P * st.V, 1) + ' J'
        : p.law === 'charles' ? 'V ÷ T = ' + M.fmt(st.V * 1000, 0) + ' mL ÷ ' + st.T + ' K = ' + M.fmt(st.V / st.T * 1e3, 3) + ' mL/K'
        : 'P ÷ T = ' + M.fmt(st.P, 1) + ' ÷ ' + st.T + ' = ' + M.fmt(st.P / st.T, 3) + ' kPa/K';
      D.text(ctx, eq, (gx0 + gx1) / 2, H - 12, { color: c.success, size: narrow ? 10.5 : 12.5, weight: 700, align: 'center', font: c.mono, fit: W });
      var ply = botY - gasTop > 36 ? gasTop + 16 : botY - 14;
      D.text(ctx, 'P = ' + M.fmt(st.P, 0) + ' kPa', cx0 + cw / 2, ply, { color: c.danger, bg: D.alpha(c.bg, 0.85), size: fs, weight: 700, align: 'center', font: c.mono, pad: 3, fit: W });
    }
  });
})();
