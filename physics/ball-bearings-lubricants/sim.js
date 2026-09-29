/* =====================================================================
   Friction · Ball Bearings and Lubricants — sim.js
   ---------------------------------------------------------------------
   A potter's wheel (chaak) turns on a vertical pivot. The whole weight
   of the wheel and the clay presses on the pivot:
       N = (m_wheel + m_clay) g
   Friction at the pivot acts at an effective radius r = 1 cm, so it
   gives a slowing torque
       τ_f = μ N r
   A little air drag τ_air = b ω is added so even a ball-bearing wheel
   stops in the end. While coasting:
       I dω/dt = −(τ_f + b ω)      I = ½ M R² (disc) + ½ m_clay r_c²
   which has the solution ω(t) = (ω0 + c/b) e^(−b t / I) − c/b,
   c = τ_f, so it stops after  t = (I / b) ln(1 + b ω0 / c).
   Heat made at the pivot each second = τ_f ω. The pivot tip is a small
   piece of steel (heat capacity 20 J/°C) that loses heat to the air
   at 0.1 W per °C above the room (30 °C).
   The μ values are typical classroom values: dry metal 0.4, graphite
   powder 0.15, oil 0.08, ball bearings 0.004, greased bearings 0.002.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, g = 9.8;
  var MW = 5, RW = 0.3, RP = 0.01, B = 0.003, RC = 0.08, CAP = 20, HLOSS = 0.1, ROOM = 30;
  var PIV = {
    dry: { name: 'Plain pivot, dry metal', short: 'Dry', mu: 0.4 },
    powder: { name: 'Plain pivot, graphite powder', short: 'Powder', mu: 0.15 },
    oil: { name: 'Plain pivot, oiled', short: 'Oiled', mu: 0.08 },
    balls: { name: 'Ball bearings', short: 'Bearings', mu: 0.004 },
    grease: { name: 'Ball bearings with grease', short: 'Bearings+grease', mu: 0.002 }
  };
  var rows = []; // results table, kept across resets

  function inertia(p) { return 0.5 * MW * RW * RW + 0.5 * p.load * RC * RC; }
  function fric(p) { var N = (MW + p.load) * g; return { N: N, f: PIV[p.pivot].mu * N, tau: PIV[p.pivot].mu * N * RP }; }
  function w0(p) { return p.rpm * 2 * Math.PI / 60; }
  function stopTime(p, w) { var c = fric(p).tau; return w <= 0 ? 0 : inertia(p) / B * Math.log(1 + B * w / c); }

  SimLab.createSim({
    ariaLabel: 'A potter\'s wheel spinning on a pivot, with clay on top, and a magnified top view of the pivot showing either plain rubbing surfaces, oil, powder or a ring of ball bearings',
    playLabel: 'Spin',
    mobileAspect: '3 / 4',
    params: [
      { id: 'pivot', label: 'Pivot', type: 'select', value: 'dry', options: Object.keys(PIV).map(function (k) { return { value: k, label: PIV[k].name }; }) },
      { id: 'load', label: 'Clay on the wheel', min: 0, max: 20, step: 1, value: 5, unit: 'kg' },
      { id: 'rpm', label: 'Starting speed', min: 30, max: 200, step: 10, value: 120, unit: 'rpm', help: 'rpm = turns per minute. A potter spins a wheel at about 60 to 150 rpm.' },
      { id: 'motor', label: 'Keep it turning with a motor', type: 'toggle', value: false }
    ],
    buttons: [
      { label: 'Clear results table', onClick: function (sim) { rows = []; sim.redraw(); } }
    ],
    buttonsTitle: 'Results',
    readouts: [
      { id: 'f', label: 'Friction force at the pivot μ N', unit: 'N', digits: 2, key: true },
      { id: 'P', label: 'Heat made by friction now', unit: 'W', digits: 2 },
      { id: 'ts', label: 'Time left before it stops' },
      { id: 'turns', label: 'Turns so far', digits: 1 },
      { id: 'heat', label: 'Heat made so far', unit: 'J', digits: 1 },
      { id: 'temp', label: 'Temperature of the pivot', unit: '°C', digits: 1 }
    ],
    graph: { title: 'Wheel speed vs time', yLabel: 'speed (rpm)', series: [{ label: 'speed', color: '--sim-1' }], window: 60, yMin: 0 },

    onParam: function (sim, id) {
      if (id === 'motor') { sim.state.w = w0(sim.p); sim.state.done = false; return true; }
      return false;
    },
    reset: function (sim) { sim.state = { w: w0(sim.p), th: 0, heat: 0, dT: 0, done: false }; },
    update: function (sim, dt) {
      var s = sim.state, p = sim.p, c = fric(p).tau;
      if (s.done) return;
      if (p.motor) s.w = w0(p);
      else s.w = Math.max(0, s.w - (c + B * s.w) / inertia(p) * dt);
      var P = c * s.w;
      s.heat += P * dt;
      s.dT += (P - HLOSS * s.dT) / CAP * dt;
      s.th += s.w * dt;
      if (!p.motor && s.w <= 0) {
        s.done = true;
        rows.push({ name: PIV[p.pivot].short, load: p.load, rpm: p.rpm, t: sim.time, turns: s.th / (2 * Math.PI) });
        if (rows.length > 5) rows.shift();
      }
    },
    finished: function (sim) { return sim.state.done; },
    sample: function (sim) { return [sim.state.w * 60 / (2 * Math.PI)]; },
    status: function (sim) {
      var s = sim.state;
      return (s.done ? 'Stopped' : sim.running ? (sim.p.motor ? 'Motor on' : 'Coasting') : 'Paused') + ' · t = ' + M.fmt(sim.time, 1) + ' s';
    },
    readout: function (sim) {
      var s = sim.state, p = sim.p, fr = fric(p);
      return {
        f: fr.f, P: fr.tau * s.w, turns: s.th / (2 * Math.PI), heat: s.heat, temp: ROOM + s.dT,
        ts: p.motor ? 'keeps turning (motor)' : s.done ? 'stopped' : M.fmt(stopTime(p, s.w), 1) + ' s'
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, P = PIV[p.pivot];
      D.clear(ctx, W, H, c.bg);
      var narrow = W < 560, rpmNow = s.w * 60 / (2 * Math.PI);
      var heat = M.clamp(s.dT / 40, 0, 1); // 0 → room, 1 → 40 °C hotter
      var hot = 'rgb(' + Math.round(120 + 135 * heat) + ',' + Math.round(130 - 60 * heat) + ',' + Math.round(145 - 110 * heat) + ')';

      // ---- scene: side view of the potter's wheel ----
      var rw = narrow ? W : W * 0.56, rh = narrow ? H * 0.52 : H;
      var R = Math.min(rw * 0.38, rh * 0.36), cx = narrow ? W * 0.5 : rw * 0.5, cy = narrow ? rh * 0.42 : rh * 0.4;
      var ry = R * 0.26, t = R * 0.14, gy = Math.min(rh - 10, cy + R * 1.05);
      var hw = R * 0.55, htop = gy - R * 0.42;
      // ground, housing, shaft
      D.line(ctx, 8, gy, rw - 8, gy, c.axis, 2);
      D.line(ctx, cx - R * 0.05, cy + t + ry, cx - R * 0.05, htop, c.ink, 1);
      D.roundRect(ctx, cx - R * 0.045, cy + t, R * 0.09, htop - cy - t, 2, '#94a3b8', '#475569', 1);
      D.roundRect(ctx, cx - hw / 2, htop, hw, gy - htop, 5, hot, '#334155', 2);
      D.text(ctx, 'pivot', cx, htop + (gy - htop) * 0.5, { color: '#0f172a', size: 11, weight: 700, align: 'center' });
      D.text(ctx, M.fmt(ROOM + s.dT, 1) + ' °C', cx + hw / 2 + 6, htop + (gy - htop) * 0.5, { color: heat > 0.3 ? c.danger : c.muted, size: 11, weight: 700, fit: rw });
      // disc: side band then top face
      ctx.save();
      ctx.fillStyle = '#7c4a1e';
      ctx.beginPath(); ctx.ellipse(cx, cy + t, R, ry, 0, 0, Math.PI); ctx.lineTo(cx - R, cy); ctx.ellipse(cx, cy, R, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3f2410'; ctx.lineWidth = 1.5; ctx.stroke();
      for (var k = 0; k < 12; k++) { // marks on the rim move as it turns
        var ph = s.th + k * Math.PI / 6;
        if (Math.sin(ph) > 0.05) { var mx = cx + R * Math.cos(ph); D.line(ctx, mx, cy + ry * Math.sin(ph) + 2, mx, cy + t + ry * Math.sin(ph) - 2, '#f5deb3', 2); }
      }
      ctx.fillStyle = '#b7793a'; ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      for (k = 0; k < 4; k++) { // painted spokes on the top face
        var a = s.th + k * Math.PI / 4;
        D.line(ctx, cx - R * 0.92 * Math.cos(a), cy - ry * 0.92 * Math.sin(a), cx + R * 0.92 * Math.cos(a), cy + ry * 0.92 * Math.sin(a), k ? '#8b5a2b' : '#3f2410', k ? 2 : 3);
      }
      // clay lump
      if (p.load > 0) {
        var wc = R * 0.22 * Math.cbrt(p.load / 5), hc = wc * 1.1;
        ctx.save(); ctx.fillStyle = '#c2703d'; ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - wc, cy); ctx.bezierCurveTo(cx - wc, cy - hc * 0.9, cx - wc * 0.5, cy - hc, cx, cy - hc);
        ctx.bezierCurveTo(cx + wc * 0.5, cy - hc, cx + wc, cy - hc * 0.9, cx + wc, cy);
        ctx.ellipse(cx, cy, wc, wc * 0.28, 0, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
        for (k = 1; k <= 3; k++) D.line(ctx, cx - wc * (1 - k * 0.08), cy - hc * k * 0.24, cx + wc * (1 - k * 0.08), cy - hc * k * 0.24, 'rgba(124,45,18,0.5)', 1.2);
        // a finger mark that goes round with the clay
        var fa = s.th * 1, fx = cx + wc * 0.7 * Math.cos(fa);
        if (Math.sin(fa) > 0) D.line(ctx, fx, cy - hc * 0.15, fx, cy - hc * 0.75, 'rgba(60,20,5,0.75)', 2);
        ctx.restore();
        D.text(ctx, p.load + ' kg clay', cx, cy - hc - 12, { color: c.text, size: 12, weight: 700, align: 'center', fit: rw });
      }
      // weight arrow on the pivot and speed label
      D.arrow(ctx, cx + R * 0.7, cy + t + ry + 6, cx + R * 0.7, htop - 2, c.s3, 3, 9);
      D.text(ctx, 'weight ' + M.fmt(fric(p).N, 0) + ' N', cx + R * 0.7 + 6, (cy + t + ry + htop) / 2, { color: c.s3, size: 11, weight: 700, fit: rw });
      D.text(ctx, M.fmt(rpmNow, 0) + ' rpm', cx - R, cy + t + ry + 16, { color: c.s1, size: 14, weight: 700, fit: rw });

      // ---- magnified top view of the pivot ----
      var ir = narrow ? Math.min(W * 0.2, H * 0.12) : Math.min(W * 0.13, H * 0.2);
      var ix = narrow ? W * 0.27 : W * 0.78, iy = narrow ? rh + ir + 18 : H * 0.08 + ir + 18;
      D.text(ctx, 'magnified, top view', ix, iy - ir - 10, { color: c.muted, size: 11, weight: 600, align: 'center', fit: W });
      D.circle(ctx, ix, iy, ir, c.surface, c.border, 2);
      D.circle(ctx, ix, iy, ir * 0.92, hot, '#334155', 1.5);
      var ball = p.pivot === 'balls' || p.pivot === 'grease';
      if (ball) {
        D.circle(ctx, ix, iy, ir * 0.78, p.pivot === 'grease' ? '#fde68a' : '#64748b', '#334155', 1.5);
        D.circle(ctx, ix, iy, ir * 0.36, '#cbd5e1', '#334155', 1.5);
        var cage = s.th * 0.4, br = ir * 0.18;
        for (k = 0; k < 8; k++) {
          var ba = cage + k * Math.PI / 4, bx = ix + ir * 0.57 * Math.cos(ba), by = iy + ir * 0.57 * Math.sin(ba);
          D.circle(ctx, bx, by, br, '#e2e8f0', '#475569', 1.2);
          var spin = -s.th * 2; // each ball rolls, turning the other way
          D.line(ctx, bx, by, bx + br * 0.8 * Math.cos(spin), by + br * 0.8 * Math.sin(spin), '#475569', 1.5);
        }
      } else {
        var gap = p.pivot === 'dry' ? 0.6 : 0.66;
        D.circle(ctx, ix, iy, ir * 0.7, p.pivot === 'oil' ? '#facc15' : p.pivot === 'powder' ? '#6b7280' : '#475569', '#334155', 1);
        if (p.pivot === 'powder') { var r = M.rng(5); for (k = 0; k < 60; k++) { var pa = r() * 6.283, pr = ir * (0.6 + r() * 0.1); D.circle(ctx, ix + pr * Math.cos(pa + s.th * 0.3), iy + pr * Math.sin(pa + s.th * 0.3), 1.3, '#1f2937'); } }
        D.circle(ctx, ix, iy, ir * gap, '#cbd5e1', '#334155', 1.5);
        if (p.pivot === 'dry' && s.w > 0.1) { // rubbing: little hot spots at the contact
          for (k = 0; k < 6; k++) { var da = s.th * 1.7 + k * 1.05; D.circle(ctx, ix + ir * 0.6 * Math.cos(da), iy + ir * 0.6 * Math.sin(da), 2.2, '#f97316'); }
        }
      }
      D.line(ctx, ix, iy, ix + ir * 0.3 * Math.cos(s.th), iy + ir * 0.3 * Math.sin(s.th), '#0f172a', 3); // shaft mark
      D.circle(ctx, ix, iy, 3, '#0f172a');
      D.text(ctx, ball ? 'balls roll, they do not rub' : p.pivot === 'dry' ? 'metal rubs on metal' : p.pivot === 'oil' ? 'thin oil layer keeps them apart' : 'powder layer slides easily', ix, iy + ir + 12, { color: c.text, size: 11, weight: 600, align: 'center', fit: W });

      // ---- results table ----
      var tx = narrow ? W * 0.52 : W * 0.6, ty = narrow ? rh + 14 : iy + ir + 40, tw = narrow ? W * 0.46 : W * 0.38, rowH = narrow ? 17 : 20;
      if (ty + rowH * 2 < H) {
        var cols = narrow ? [0, 0.5, 0.77] : [0, 0.4, 0.62, 0.82], fs = narrow ? 10 : 11;
        var head = narrow ? ['Pivot', 'Time', 'Turns'] : ['Pivot', 'Clay', 'Time', 'Turns'];
        D.text(ctx, 'Results (spin till it stops)', tx, ty, { color: c.muted, size: fs, weight: 700, fit: W });
        head.forEach(function (h, i) { D.text(ctx, h, tx + tw * cols[i], ty + rowH, { color: c.muted, size: fs, weight: 700 }); });
        D.line(ctx, tx, ty + rowH * 1.5, tx + tw, ty + rowH * 1.5, c.border, 1);
        if (!rows.length) D.text(ctx, '(none yet)', tx, ty + rowH * 2.2, { color: c.faint, size: fs });
        rows.forEach(function (rw_, j) {
          var y = ty + rowH * (2.2 + j), vals = narrow ? [rw_.name, M.fmt(rw_.t, 1) + ' s', M.fmt(rw_.turns, 0)] : [rw_.name, rw_.load + ' kg', M.fmt(rw_.t, 1) + ' s', M.fmt(rw_.turns, 0)];
          if (y < H - 4) vals.forEach(function (v, i) { D.text(ctx, v, tx + tw * cols[i], y, { color: c.text, size: fs, weight: i ? 500 : 600 }); });
        });
      }

      // ---- headline ----
      var msg, col = c.text, fr = fric(p);
      if (s.done) { msg = 'Stopped after ' + M.fmt(sim.time, 1) + ' s and ' + M.fmt(s.th / 6.283, 0) + ' turns'; col = c.success; }
      else if (p.motor && sim.time > 0) { msg = 'Motor on: friction turns ' + M.fmt(fr.tau * s.w, 2) + ' W into heat'; col = c.warning; }
      else if (sim.time > 0) { msg = 'Coasting: friction at the pivot slows the wheel'; }
      else msg = 'Press Spin to set the wheel turning';
      headline(ctx, msg, W, col, narrow ? 12 : 14);
    }
  });

  /* Headline that shrinks to fit narrow screens. */
  function headline(ctx, msg, W, col, size) {
    ctx.save(); ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif';
    var w = ctx.measureText(msg).width; ctx.restore();
    D.text(ctx, msg, W / 2, 14, { color: col, size: Math.max(9, Math.min(size, size * (W - 16) / w)), weight: 700, align: 'center', fit: W });
  }
})();
