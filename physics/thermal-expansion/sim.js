/* =====================================================================
   Thermal properties of matter (Class 11) · Thermal Expansion — sim.js
   ---------------------------------------------------------------------
   Linear expansion:  ΔL = α L ΔT      (α in /°C, start at T0 = 20 °C)
   α (×10⁻⁶ /°C): steel 12, copper 17, aluminium 23, brass 19,
   glass 9, Pyrex 3.2, invar 1.2, concrete 12.
   Rails (steel, laid at 20 °C): the gap g closes when α L ΔT = g.
   After that the rail is squeezed: stress σ = E α (ΔT − ΔT_close),
   E = 200 GPa. The extra length δ is taken up by a sideways bulge
   (sun kink) of amplitude A = (2/π) √(δ L) (sine-shaped bend).
   Real track is held by sleepers and ballast, so it resists until the
   stress is large; here it bends at once (stated in the Learn panel).
   Bimetallic strip (two layers of equal thickness h/2 and similar
   stiffness, total h = 1 mm, length 15 cm): curvature
     κ = 1.5 Δα ΔT / h     (Timoshenko, equal thickness and modulus)
   tip movement y = κ L² / 2 (small bends). The layer that expands
   more ends up on the outside of the curve.
   Temperature changes at 12 °C per second on screen when playing.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var T0 = 20, RATE = 12, E = 200e9, STRIP = 0.15, H_STRIP = 0.001;
  var MAT = {
    steel: { a: 12, n: 'Steel', col: '#94a3b8' }, copper: { a: 17, n: 'Copper', col: '#ea8a4a' }, aluminium: { a: 23, n: 'Aluminium', col: '#cbd5e1' },
    brass: { a: 19, n: 'Brass', col: '#eab308' }, glass: { a: 9, n: 'Glass', col: '#7dd3fc' }, pyrex: { a: 3.2, n: 'Pyrex glass', col: '#a5f3fc' },
    invar: { a: 1.2, n: 'Invar', col: '#64748b' }, concrete: { a: 12, n: 'Concrete', col: '#a8a29e' }
  };
  var PAIR = { bs: ['brass', 'steel'], bi: ['brass', 'invar'], as: ['aluminium', 'steel'], cs: ['copper', 'steel'] };
  var xMaxT = 40;

  function model(sim) {
    var p = sim.p, T = sim.state.T, dT = T - T0, o = { T: T, dT: dT };
    if (p.scene === 'rod') {
      o.alpha = MAT[p.mat].a; o.dL = o.alpha * 1e-6 * p.L * dT * 1000; // mm
    } else if (p.scene === 'rails') {
      o.alpha = 12; o.dL = 12e-6 * p.L * dT * 1000;
      o.gapLeft = p.gap - o.dL;                 // mm (each rail grows by dL, one gap per rail)
      o.closeT = T0 + p.gap / (12e-6 * p.L * 1000);
      var excess = Math.max(0, -o.gapLeft) / 1000;
      o.stress = o.gapLeft < 0 ? E * 12e-6 * (T - o.closeT) / 1e6 : 0; // MPa
      o.bulge = excess > 0 ? 2 / Math.PI * Math.sqrt(excess * p.L) : 0; // m
    } else {
      var pr = PAIR[p.pair], da = (MAT[pr[0]].a - MAT[pr[1]].a) * 1e-6;
      o.k = 1.5 * da * dT / H_STRIP; o.free = o.k * STRIP * STRIP / 2 * 1000; // mm, + = towards the contact (down)
      o.alarm = o.free >= p.gap; o.tip = Math.min(o.free, p.gap);          // the contact stops the strip
      o.alarmT = T0 + p.gap / 1000 * 2 / (STRIP * STRIP) * H_STRIP / (1.5 * da);
      o.dL = o.tip;
    }
    return o;
  }

  SimLab.createSim({
    ariaLabel: 'A rod expands against a dial gauge, railway rails close their expansion gaps and buckle, and a bimetallic strip bends to ring a fire alarm as the temperature changes',
    mobileAspect: '1 / 1',
    playLabel: 'Change the temperature',
    params: [
      { id: 'scene', label: 'Experiment', type: 'select', value: 'rails', options: [
        { value: 'rod', label: 'Rod and dial gauge (ΔL = αLΔT)' }, { value: 'rails', label: 'Railway rails with gaps' }, { value: 'bimetal', label: 'Bimetallic strip fire alarm' }] },
      { id: 'Thi', label: 'Heat (or cool) from 20 °C to', min: -20, max: 150, step: 1, value: 60, unit: '°C', presets: [{ label: 'Winter 0', value: 0 }, { label: 'Summer rail 60', value: 60 }, { label: 'Boiling 100', value: 100 }] },
      { id: 'mat', label: 'Rod material', type: 'select', value: 'steel', options: Object.keys(MAT).map(function (k) { return { value: k, label: MAT[k].n + ' (α = ' + MAT[k].a + ' × 10⁻⁶ /°C)' }; }) },
      { id: 'L', label: 'Length of the rod or rail', min: 1, max: 100, step: 0.5, value: 13, unit: 'm', presets: [{ label: 'Rail 13 m', value: 13 }, { label: 'Bridge 50 m', value: 50 }] },
      { id: 'gap', label: 'Gap: between rails, or to the alarm contact', min: 0, max: 15, step: 0.5, value: 8, unit: 'mm' },
      { id: 'pair', label: 'Bimetallic strip', type: 'select', value: 'bs', options: [
        { value: 'bs', label: 'Brass + steel' }, { value: 'bi', label: 'Brass + invar' }, { value: 'as', label: 'Aluminium + steel' }, { value: 'cs', label: 'Copper + steel' }] }
    ],
    readouts: [
      { id: 'T', label: 'Temperature', short: 'Temp', unit: '°C', digits: 0, key: true },
      { id: 'dL', label: 'Change in length ΔL (one rod or rail)', short: 'ΔL', key: true },
      { id: 'st', label: 'What happens', short: 'Result', key: true },
      { id: 'al', label: 'Coefficient α' },
      { id: 'ex', label: 'Key temperature' },
      { id: 'sig', label: 'Stress in the rail' }
    ],
    graph: { title: 'Change against temperature change', xLabel: 'temperature change from 20 °C (°C)', yLabel: 'mm', xMax: function () { return xMaxT; },
      series: [{ label: 'ΔL of one rod or rail, or tip movement of the strip (mm)' }] },

    reset: function (sim) {
      sim.state = { T: T0, acc: 0 };
      xMaxT = Math.max(5, Math.abs(sim.p.Thi - T0));
      if (sim.graph) sim.graph.push(0, [0]);
    },
    finished: function (sim) { return Math.abs(sim.state.T - sim.p.Thi) < 1e-6; },
    update: function (sim, dt) {
      var s = sim.state, dir = Math.sign(sim.p.Thi - s.T);
      s.T += dir * RATE * dt;
      if ((dir > 0 && s.T > sim.p.Thi) || (dir < 0 && s.T < sim.p.Thi)) s.T = sim.p.Thi;
      s.acc += dt;
      if (sim.graph && (s.acc >= 1 / 20 || s.T === sim.p.Thi)) { s.acc = 0; sim.graph.push(Math.abs(s.T - T0), [model(sim).dL]); }
    },
    status: function (sim) { return sim.running ? (sim.p.Thi >= T0 ? 'Heating…' : 'Cooling…') : sim.state.T === T0 ? 'At 20 °C' : 'Paused at ' + M.fmt(sim.state.T, 0) + ' °C'; },
    readout: function (sim) {
      var p = sim.p, o = model(sim), r = { T: o.T, sig: '—' };
      function mm(v) { return (v >= 0 ? '+' : '−') + M.fmt(Math.abs(v), Math.abs(v) < 10 ? 2 : 1) + ' mm'; }
      if (p.scene === 'rod') {
        r.dL = mm(o.dL); r.al = MAT[p.mat].n + ': ' + o.alpha + ' × 10⁻⁶ /°C';
        r.st = o.dL >= 0 ? 'longer by ' + mm(o.dL).slice(1) : 'shorter by ' + mm(o.dL).slice(1);
        r.ex = '1 m of it grows ' + M.fmt(o.alpha * 1e-3 * 100, 2) + ' mm per 100 °C';
      } else if (p.scene === 'rails') {
        r.dL = mm(o.dL); r.al = 'Steel: 12 × 10⁻⁶ /°C';
        r.st = o.gapLeft >= 0 ? 'gap ' + M.fmt(o.gapLeft, 1) + ' mm' : 'buckled!';
        r.ex = 'gap closes at ' + (o.closeT > 999 ? '—' : M.fmt(o.closeT, 0) + ' °C');
        r.sig = o.stress > 0 ? M.fmt(o.stress, 0) + ' MPa' : 'none (free to expand)';
      } else {
        var pr = PAIR[p.pair];
        r.dL = 'tip ' + (o.tip >= 0 ? '↓ ' : '↑ ') + M.fmt(Math.abs(o.tip), 1) + ' mm' + (o.alarm ? ' (touching)' : '');
        r.al = MAT[pr[0]].n + ' ' + MAT[pr[0]].a + ', ' + MAT[pr[1]].n + ' ' + MAT[pr[1]].a + ' (× 10⁻⁶ /°C)';
        r.st = o.alarm ? 'ALARM ringing' : 'alarm off';
        r.ex = 'alarm rings at ' + M.fmt(o.alarmT, 0) + ' °C';
      }
      return r;
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, o = model(sim);
      var nar = W < 560, fs = nar ? 10 : 12;
      D.clear(ctx, W, H, c.bg);
      // thermometer strip at the top
      var tc = o.T > T0 ? D.alpha('#ef4444', M.clamp((o.T - T0) / 100, 0, 1) * 0.16) : D.alpha('#3b82f6', M.clamp((T0 - o.T) / 40, 0, 1) * 0.16);
      ctx.fillStyle = tc; ctx.fillRect(0, 0, W, H);
      D.text(ctx, '🌡 ' + M.fmt(o.T, 0) + ' °C', 10, 14, { color: o.T > T0 ? c.danger : o.T < T0 ? c.s1 : c.ink, size: fs + 3, weight: 800 });
      if (p.scene === 'rod') drawRod(ctx, W, H, c, p, o, nar, fs);
      else if (p.scene === 'rails') drawRails(ctx, W, H, c, p, o, nar, fs);
      else drawStrip(ctx, W, H, c, p, o, nar, fs);
    }
  });

  function drawRod(ctx, W, H, c, p, o, nar, fs) {
    var m = MAT[p.mat], x0 = nar ? 26 : 50, gW = nar ? 84 : 120, x1 = W - gW - (nar ? 18 : 40), y = H * (nar ? 0.3 : 0.32), th = nar ? 16 : 22;
    var maxDL = 23e-6 * 100 * 130 * 1000, ext = M.clamp(o.dL / maxDL, -1, 1) * (nar ? 26 : 40) + (o.dL ? Math.sign(o.dL) * 2 : 0);
    // clamp, rod (drawn at a fixed size; its change is shown hugely magnified)
    D.roundRect(ctx, x0 - 18, y - 30, 18, 60, 3, c.light ? '#475569' : '#334155', c.ink, 1);
    var g = ctx.createLinearGradient(0, y - th / 2, 0, y + th / 2); g.addColorStop(0, m.col); g.addColorStop(1, D.alpha(m.col, 0.55));
    D.roundRect(ctx, x0, y - th / 2, x1 - x0 + ext, th, 3, g, c.ink, 1);
    D.line(ctx, x1, y - th, x1, y + th, c.ink, 1.2, [3, 3]);
    D.text(ctx, m.n + ' rod, ' + p.L + ' m long', (x0 + x1) / 2, y - th / 2 - 12, { color: c.ink, size: fs, weight: 700, align: 'center', fit: W });
    D.text(ctx, 'dashed line: end at 20 °C · change drawn magnified', (x0 + x1) / 2, y + th / 2 + 12, { color: c.muted, size: fs - 1, align: 'center', fit: W });
    // dial gauge: one turn = 10 mm (or 1 mm for small changes)
    var R = nar ? 34 : 48, cx = W - gW / 2 - (nar ? 6 : 16), cy = y, full = Math.abs(o.dL) < 1 && Math.abs(23e-6 * p.L * Math.abs(p.Thi - T0) * 1000) < 1 ? 1 : 10;
    D.line(ctx, x1 + ext, y, cx - R, y, c.ink, 2);
    D.circle(ctx, cx, cy, R, c.light ? '#fff' : '#0f172a', c.ink, 2);
    for (var k = 0; k < 20; k++) { var a = -Math.PI / 2 + k / 20 * 2 * Math.PI, r1 = R - (k % 2 ? 4 : 8); D.line(ctx, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1), c.ink, 1); }
    var ang = -Math.PI / 2 + o.dL / full * 2 * Math.PI;
    D.line(ctx, cx, cy, cx + Math.cos(ang) * (R - 6), cy + Math.sin(ang) * (R - 6), c.danger, 2.5); D.circle(ctx, cx, cy, 3, c.danger);
    D.text(ctx, 'one turn = ' + full + ' mm', cx, cy + R + 12, { color: c.muted, size: fs - 1, align: 'center', fit: W });
    D.text(ctx, (o.dL >= 0 ? '+' : '−') + M.fmt(Math.abs(o.dL), 2) + ' mm', cx, cy + R + 28, { color: c.danger, size: fs + 1, weight: 800, align: 'center', fit: W });
    // α bar chart of all materials
    var top = y + (nar ? 92 : 110), keys = Object.keys(MAT), rowH = Math.min(nar ? 17 : 22, (H - top - 10) / keys.length), lab = nar ? 70 : 96, bw = W - lab - 60;
    D.text(ctx, 'α (× 10⁻⁶ per °C)', 10, top - 10, { color: c.muted, size: fs - 1, weight: 700 });
    keys.forEach(function (k, i) {
      var yy = top + i * rowH, on = k === p.mat;
      D.text(ctx, MAT[k].n, lab, yy + rowH / 2, { color: on ? c.ink : c.muted, size: fs - 1, weight: on ? 800 : 500, align: 'right' });
      D.roundRect(ctx, lab + 6, yy + 2, Math.max(2, bw * MAT[k].a / 23), rowH - 4, 3, on ? MAT[k].col : D.alpha(MAT[k].col, 0.35));
      D.text(ctx, String(MAT[k].a), lab + 12 + bw * MAT[k].a / 23, yy + rowH / 2, { color: c.ink, size: fs - 1, weight: on ? 800 : 500 });
    });
  }

  function drawRails(ctx, W, H, c, p, o, nar, fs) {
    // top view of three rails end to end on sleepers; gaps and bulge exaggerated
    var x0 = 10, x1 = W - 10, cy = H * 0.36, gauge = Math.min(H * 0.2, nar ? 70 : 90), n = 3;
    var gapScale = nar ? 2.4 : 3.2, gv = M.clamp(o.gapLeft, 0, 21), gapPx = gv * gapScale, railLen = (x1 - x0 - n * 22 * gapScale) / n, grow = (Math.min(p.gap, 21) - gv) * gapScale;
    var bulgePx = Math.min(gauge * 0.9, o.bulge * 1000 * 0.25 * (nar ? 0.8 : 1));
    // ballast + sleepers
    ctx.fillStyle = c.light ? '#d6d3d1' : '#292524'; ctx.fillRect(0, cy - gauge / 2 - 26, W, gauge + 52);
    for (var sx = x0 + 6; sx < x1; sx += nar ? 16 : 20) D.roundRect(ctx, sx, cy - gauge / 2 - 18, nar ? 8 : 10, gauge + 36, 2, c.light ? '#92400e' : '#78350f');
    var col = o.gapLeft < 0 ? c.danger : (c.light ? '#475569' : '#cbd5e1');
    var start = x0;
    for (var i = 0; i < n; i++) {
      var xa = start, xb = start + railLen + grow;
      [-1, 1].forEach(function (side) {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = nar ? 5 : 6; ctx.lineCap = 'butt'; ctx.beginPath();
        for (var k = 0; k <= 40; k++) {
          var t = k / 40, X = xa + (xb - xa) * t, Y = cy + side * gauge / 2 + (i === 1 ? -Math.sin(Math.PI * t) * bulgePx : 0);
          if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
        }
        ctx.stroke(); ctx.restore();
      });
      start = xb + gapPx;
      if (i < n - 1) {
        var gx = xb + gapPx / 2;
        D.text(ctx, o.gapLeft > 0 ? M.fmt(o.gapLeft, 1) + ' mm' : 'closed', gx, cy + gauge / 2 + 34, { color: o.gapLeft > 0 ? c.ink : c.danger, size: fs - 1, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 2, fit: W });
        D.line(ctx, gx, cy + gauge / 2 + 6, gx, cy + gauge / 2 + 26, c.muted, 1);
      }
    }
    D.text(ctx, 'Top view: three ' + p.L + ' m steel rails (gaps and bend drawn exaggerated)', W / 2, cy - gauge / 2 - 38, { color: c.muted, size: fs - 1, align: 'center', fit: W });
    var msg = o.gapLeft >= 0 ? (o.T >= T0 ? 'The gaps let each rail grow freely.' : 'Cold: the rails shrink and the gaps widen.') : 'No gap left: the squeezed rail bends sideways (sun kink)!';
    D.text(ctx, msg, W / 2, cy + gauge / 2 + 58, { color: o.gapLeft >= 0 ? c.success : c.danger, size: fs + 1, weight: 800, align: 'center', fit: W });
    // gap meter: how much of the gap has been used
    var my = cy + gauge / 2 + 82, mw = Math.min(W - 40, 360), mx = (W - mw) / 2;
    if (my + 40 < H) {
      var used = p.gap > 0 ? M.clamp(o.dL / p.gap, 0, 1) : 1;
      D.text(ctx, 'rail growth ' + M.fmt(Math.max(0, o.dL), 2) + ' mm of the ' + p.gap + ' mm gap', W / 2, my, { color: c.ink, size: fs, weight: 600, align: 'center', fit: W });
      D.roundRect(ctx, mx, my + 10, mw, 12, 4, D.alpha(c.ink, 0.08), D.alpha(c.ink, 0.25));
      D.roundRect(ctx, mx, my + 10, Math.max(2, mw * used), 12, 4, used >= 1 ? c.danger : c.warning);
    }
  }

  function drawStrip(ctx, W, H, c, p, o, nar, fs) {
    var pr = PAIR[p.pair], A = MAT[pr[0]], B = MAT[pr[1]], x0 = nar ? 40 : 70, len = Math.min(W - x0 - (nar ? 60 : 160), nar ? 260 : 420), y0 = H * 0.3;
    var mag = (len / 2) / 15 / 1;          // tip pixels per mm (1 mm of tip = len/30 px)
    var tipPx = o.tip * mag, th = nar ? 6 : 8;
    // bend: circle arc with tip deflection tipPx over length len
    function pt(s, off) { // s 0..1 along, off = across (px, + = down)
      var kpx = 2 * tipPx / (len * len), phi = kpx * s * len;
      if (Math.abs(kpx) < 1e-7) return { x: x0 + s * len, y: y0 + off };
      var R = 1 / kpx;
      return { x: x0 + Math.sin(phi) * (R - off), y: y0 + R - Math.cos(phi) * (R - off) };
    }
    function layer(o1, o2, col) {
      ctx.beginPath(); var k, q;
      for (k = 0; k <= 40; k++) { q = pt(k / 40, o1); if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }
      for (k = 40; k >= 0; k--) { q = pt(k / 40, o2); ctx.lineTo(q.x, q.y); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    D.roundRect(ctx, x0 - 22, y0 - 26, 22, 52, 3, c.light ? '#475569' : '#334155', c.ink, 1);
    layer(-th, 0, A.col); layer(0, th, B.col);
    var tip = pt(1, th);
    D.text(ctx, A.n + ' (top)', x0 + 6, y0 - th - 10, { color: c.ink, size: fs, weight: 700 });
    D.text(ctx, B.n + ' (bottom)', x0 + 6, y0 + th + 12, { color: c.ink, size: fs, weight: 700 });
    // contact screw below the tip at the chosen gap
    var cX = x0 + len, cY = y0 + th + p.gap * mag;
    D.roundRect(ctx, cX - 6, cY, 12, 26, 2, '#b45309', c.ink, 1);
    D.text(ctx, 'contact (' + p.gap + ' mm)', cX + 10, cY + 13, { color: c.muted, size: fs - 1, fit: W });
    // circuit: battery and bell
    var by = Math.min(H - 40, cY + 70), on = o.alarm;
    ctx.save(); ctx.strokeStyle = on ? c.warning : c.muted; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(x0 - 11, y0 + 26); ctx.lineTo(x0 - 11, by); ctx.lineTo(cX, by); ctx.lineTo(cX, cY + 26); ctx.stroke(); ctx.restore();
    var bx = (x0 + cX) / 2;
    D.roundRect(ctx, bx - 60, by - 10, 22, 20, 3, c.bg, c.ink, 1.5); D.text(ctx, '🔋', bx - 49, by, { size: 12, align: 'center' });
    D.circle(ctx, bx + 30, by, 14, on ? D.alpha(c.warning, 0.4) : c.bg, c.ink, 1.5);
    D.text(ctx, '🔔', bx + 30, by, { size: 14, align: 'center' });
    if (on) {
      D.circle(ctx, tip.x, tip.y, 6, D.alpha(c.warning, 0.7));
      D.text(ctx, 'FIRE ALARM!', bx + 52, by, { color: c.danger, size: fs + 2, weight: 800, fit: W });
    }
    D.text(ctx, 'bend drawn ' + M.fmt(mag * 1 / (len / 150), 0) + '× larger', W - 10, H - 10, { color: c.muted, size: fs - 1, align: 'right' });
    D.text(ctx, 'strip 15 cm long, 1 mm thick', x0 - 20, H - 10, { color: c.muted, size: fs - 1 });
  }
})();
