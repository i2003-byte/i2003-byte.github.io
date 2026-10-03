/* =====================================================================
   Electricity · Ohm's Law: the V–I Graph — sim.js
   ---------------------------------------------------------------------
   A wire (or a torch bulb) is connected to a variable battery with an
   ammeter in series and a voltmeter across it, as in the Class 10 lab.
     Ohm's law  V = I R   (R stays the same at a fixed temperature)
     resistance of a wire  R = ρ L / A,  A = π d² / 4
   Resistivities (Ω m, room temperature, NCERT values):
     nichrome 100×10⁻⁸ · constantan 49×10⁻⁸ · manganin 44×10⁻⁸
   The wire is assumed to stay at room temperature (small currents).
   Torch bulb (2.5 V, 0.3 A): the filament heats up, so its resistance
   rises. Classroom model I = 0.3 (V / 2.5)^0.6 A (tungsten-like, not
   Ohmic). It burns out above 3.8 V.
   The student records readings; the graph fits a straight line through
   the origin (least squares) and finds R = 1 / slope.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var RHO = { nichrome: 100e-8, constantan: 49e-8, manganin: 44e-8 };
  var WIRE_COL = { nichrome: '#a1a1aa', constantan: '#d97706', manganin: '#b45309' };
  var VMAX = 6, BULB_MAX = 3.8;

  function isBulb(p) { return p.load === 'bulb'; }
  function wireR(p) { var d = p.d * 1e-3; return RHO[p.load] * p.L / (Math.PI * d * d / 4); }
  function currentAt(p, V, blown) {
    if (isBulb(p)) return blown || V <= 0 ? 0 : 0.3 * Math.pow(V / 2.5, 0.6);
    return V / wireR(p);
  }
  function iScale(p) { // y-axis top for the graph
    var top = isBulb(p) ? 0.4 : currentAt(p, VMAX);
    var st = D.niceStep(top, 4); return Math.ceil(top * 1.05 / st) * st;
  }
  function fit(pts) { // best line through the origin, I = k V
    var sxy = 0, sxx = 0;
    pts.forEach(function (q) { sxy += q.V * q.I; sxx += q.V * q.V; });
    return sxx > 0 ? sxy / sxx : 0;
  }

  SimLab.createSim({
    ariaLabel: 'Ohm\'s law circuit: a battery, an ammeter in series and a voltmeter across a resistance wire or torch bulb, with a current against voltage graph of the recorded readings',
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'V', label: 'Battery voltage V', min: 0, max: VMAX, step: 0.1, value: 1.5, unit: 'V',
        presets: [{ label: '1 cell', value: 1.5 }, { label: '2 cells', value: 3 }, { label: '3 cells', value: 4.5 }, { label: '4 cells', value: 6 }],
        help: 'Change the voltage, then press “Record reading”. Take 4 or 5 readings.' },
      { id: 'load', label: 'Conductor', type: 'select', value: 'nichrome', options: [
        { value: 'nichrome', label: 'Nichrome wire' }, { value: 'constantan', label: 'Constantan wire' },
        { value: 'manganin', label: 'Manganin wire' }, { value: 'bulb', label: 'Torch bulb (2.5 V)' }],
        help: 'Changing the conductor clears the readings.' },
      { id: 'L', label: 'Wire length L', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'm' },
      { id: 'd', label: 'Wire thickness (diameter) d', min: 0.2, max: 0.6, step: 0.05, value: 0.3, unit: 'mm' }
    ],
    buttonsTitle: 'Readings',
    buttons: [
      { label: '📍 Record reading', primary: true, onClick: function (sim) {
        var s = sim.state, V = sim.p.V, I = currentAt(sim.p, V, s.blown);
        if (s.blown) { sim.toast('The bulb has burnt out. Press “Clear readings” to fit a new one.'); return; }
        if (s.pts.some(function (q) { return Math.abs(q.V - V) < 1e-6; })) { sim.toast('You already have a reading at ' + M.fmt(V, 1) + ' V. Change the voltage.'); return; }
        s.pts.push({ V: V, I: I }); s.pts.sort(function (a, b) { return a.V - b.V; });
        sim.toast('Recorded: V = ' + M.fmt(V, 1) + ' V, I = ' + M.fmt(I, 3) + ' A');
      } },
      { label: '🧹 Clear readings', onClick: function (sim) { sim.reset(); } },
      { label: 'Fill 5 readings', onClick: function (sim) {
        var s = sim.state; if (isBulb(sim.p)) s.blown = false;
        s.pts = [1, 2, 3, isBulb(sim.p) ? 3.5 : 4.5, isBulb(sim.p) ? 0.5 : 6].map(function (v) { return { V: v, I: currentAt(sim.p, v) }; })
          .sort(function (a, b) { return a.V - b.V; });
      } }
    ],
    readouts: [
      { id: 'V', label: 'Voltmeter V', unit: 'V', digits: 2 },
      { id: 'I', label: 'Ammeter I', unit: 'A', digits: 3, key: true },
      { id: 'R', label: 'V ÷ I', unit: 'Ω', digits: 2, key: true },
      { id: 'Rw', label: 'R = ρL/A (wire)', unit: 'Ω', digits: 2 },
      { id: 'rho', label: 'Resistivity ρ', unit: '×10⁻⁸ Ω m', digits: 0 },
      { id: 'P', label: 'Power P = VI', unit: 'W', digits: 2 },
      { id: 'fitR', label: 'R from graph slope', unit: 'Ω', digits: 2 }
    ],
    onParam: function (sim, id, v) {
      if (id === 'V') {
        if (isBulb(sim.p) && v > BULB_MAX && !sim.state.blown) { sim.state.blown = true; sim.toast('💥 Too much voltage: the 2.5 V bulb burnt out!'); }
        return true;
      }
      if (isBulb(sim.p) && (id === 'L' || id === 'd')) return true; // no effect on a bulb
      return false; // new conductor: clear readings
    },
    reset: function (sim) { sim.state = { pts: [], blown: isBulb(sim.p) && sim.p.V > BULB_MAX }; },
    animate: function (sim) { return !sim.reduceMotion && currentAt(sim.p, sim.p.V, sim.state.blown) > 0; },
    readout: function (sim) {
      var p = sim.p, s = sim.state, I = currentAt(p, p.V, s.blown), k = fit(s.pts);
      return {
        V: p.V, I: I, R: I > 0 ? p.V / I : '—',
        Rw: isBulb(p) ? 'bulb' : wireR(p), rho: isBulb(p) ? '—' : RHO[p.load] * 1e8,
        P: p.V * I,
        fitR: s.pts.length < 2 ? 'record 2+ readings' : isBulb(p) ? 'not a straight line' : 1 / k
      };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state;
      D.clear(ctx, W, H, c.bg);
      var wide = W >= 560;
      var cb = wide ? { x: 8, y: 8, w: W * 0.46 - 8, h: H - 16 } : { x: 6, y: 6, w: W - 12, h: H * 0.46 };
      var gb = wide ? { x: W * 0.46 + 8, y: 8, w: W * 0.54 - 16, h: H - 16 } : { x: 6, y: H * 0.46 + 10, w: W - 12, h: H * 0.54 - 16 };
      drawCircuit(sim, ctx, cb, c, p, s, now);
      drawGraph(ctx, gb, c, p, s);
    }
  });

  function drawCircuit(sim, ctx, b, c, p, s, now) {
    var I = currentAt(p, p.V, s.blown), wireC = c.light ? '#334155' : '#cbd5e1';
    var L = b.x + 22, R = b.x + b.w - 22, T = b.y + b.h * 0.42, B = b.y + b.h - 26, cx = (L + R) / 2;
    var rw = Math.min(b.w * 0.42, 190), r0 = cx - rw / 2, r1 = cx + rw / 2;
    // wires
    ctx.save(); ctx.strokeStyle = wireC; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 12, B); ctx.lineTo(R, B); ctx.lineTo(R, T); ctx.lineTo(r1, T);
    ctx.moveTo(r0, T); ctx.lineTo(L, T); ctx.lineTo(L, B); ctx.lineTo(cx - 12, B); ctx.stroke(); ctx.restore();
    // moving charges (conventional current, from + round to −)
    if (I > 0 && !sim.reduceMotion) {
      var path = [[cx + 12, B], [R, B], [R, T], [L, T], [L, B], [cx - 12, B]], lens = [], tot = 0;
      for (var i = 1; i < path.length; i++) { var l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); lens.push(l); tot += l; }
      var speed = 25 + 160 * Math.min(1, I / iScale(p)), gap = 26, off = (now / 1000 * speed) % gap;
      for (var dpos = off; dpos < tot; dpos += gap) {
        var k = 0, rem = dpos; while (k < lens.length - 1 && rem > lens[k]) { rem -= lens[k]; k++; }
        var f = rem / lens[k], x = M.lerp(path[k][0], path[k + 1][0], f), y = M.lerp(path[k][1], path[k + 1][1], f);
        if (y === T && x > r0 - 2 && x < r1 + 2) continue;
        D.circle(ctx, x, y, 2.6, c.warning);
      }
    }
    // battery (cells) at the bottom
    var nC = Math.max(1, Math.min(4, Math.ceil(p.V / 1.5)));
    D.roundRect(ctx, cx - 14 - nC * 6, B - 18, 28 + nC * 12, 36, 6, c.bg);
    for (var j = 0; j < nC; j++) {
      var xx = cx - nC * 6 + j * 12 + 3;
      D.line(ctx, xx, B - 14, xx, B + 14, c.ink, 2); D.line(ctx, xx + 6, B - 7, xx + 6, B + 7, c.ink, 4);
    }
    D.text(ctx, '+', cx - nC * 6 - 2, B - 20, { color: c.danger, size: 13, weight: 700, align: 'center' });
    D.text(ctx, 'Battery ' + M.fmt(p.V, 1) + ' V', cx, B + 18, { color: c.muted, size: 11, align: 'center', fit: sim.width });
    // ammeter on the right (in series)
    var ay = (T + B) / 2;
    D.circle(ctx, R, ay, 15, c.bg, c.s1, 2.5);
    D.text(ctx, 'A', R, ay + 1, { color: c.s1, size: 14, weight: 800, align: 'center' });
    D.text(ctx, M.fmt(I, 3) + ' A', R - 22, ay, { color: c.s1, size: 12, weight: 700, align: 'right', font: c.mono });
    // the conductor
    if (isBulb(p)) {
      var bx = cx, by = T, glow = s.blown ? 0 : M.clamp(p.V * I / 1.0, 0, 1);
      D.line(ctx, r0, T, bx - 10, T, wireC, 2.5); D.line(ctx, bx + 10, T, r1, T, wireC, 2.5);
      if (glow > 0.02) {
        var g = ctx.createRadialGradient(bx, by - 6, 2, bx, by - 6, 48);
        g.addColorStop(0, 'rgba(253,224,71,' + (0.85 * glow) + ')'); g.addColorStop(1, 'rgba(253,224,71,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by - 6, 48, 0, Math.PI * 2); ctx.fill();
      }
      D.circle(ctx, bx, by - 6, 15, D.alpha('#fde047', 0.15 + 0.6 * glow), c.ink, 1.5);
      ctx.save(); ctx.strokeStyle = s.blown ? c.faint : glow > 0.1 ? '#f59e0b' : c.muted; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(bx - 10, T); ctx.lineTo(bx - 5, by - 8);
      if (s.blown) { ctx.lineTo(bx - 1, by - 5); ctx.moveTo(bx + 1, by - 11); } else { for (var z = 0; z < 4; z++) ctx.lineTo(bx - 4 + z * 2.6 + 1.3, by - 8 + (z % 2 ? 3 : -3)); }
      ctx.lineTo(bx + 5, by - 8); ctx.lineTo(bx + 10, T); ctx.stroke(); ctx.restore();
      D.text(ctx, s.blown ? 'Bulb burnt out' : 'Torch bulb', cx, T + 24, { color: s.blown ? c.danger : c.muted, size: 11, weight: 600, align: 'center' });
    } else {
      var turns = Math.round(6 + p.L * 2.4), lw = 1 + (p.d - 0.2) * 7, hh = 9;
      ctx.save(); ctx.strokeStyle = WIRE_COL[p.load]; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(r0, T);
      for (var t = 0; t <= turns * 2; t++) ctx.lineTo(r0 + 8 + (rw - 16) * t / (turns * 2), T + (t === 0 || t === turns * 2 ? 0 : t % 2 ? -hh : hh));
      ctx.lineTo(r1, T); ctx.stroke(); ctx.restore();
      var name = p.load.charAt(0).toUpperCase() + p.load.slice(1);
      D.text(ctx, name + ' · ' + M.fmt(p.L, 1) + ' m · ' + M.fmt(p.d, 2) + ' mm', cx, T + 24, { color: c.muted, size: 11, align: 'center', fit: sim.width });
      if (I > 3) D.text(ctx, '⚠ large current: the wire would get hot', cx, T + 40, { color: c.warning, size: 11, weight: 600, align: 'center', fit: sim.width });
    }
    // voltmeter across the conductor (in parallel)
    var vy = b.y + b.h * 0.14;
    D.line(ctx, r0 + 2, T, r0 + 2, vy, wireC, 1.5); D.line(ctx, r1 - 2, T, r1 - 2, vy, wireC, 1.5);
    D.line(ctx, r0 + 2, vy, cx - 15, vy, wireC, 1.5); D.line(ctx, cx + 15, vy, r1 - 2, vy, wireC, 1.5);
    D.circle(ctx, r0 + 2, T, 3, wireC); D.circle(ctx, r1 - 2, T, 3, wireC);
    D.circle(ctx, cx, vy, 15, c.bg, c.s2, 2.5);
    D.text(ctx, 'V', cx, vy + 1, { color: c.s2, size: 14, weight: 800, align: 'center' });
    D.text(ctx, M.fmt(p.V, 2) + ' V', r1 + 6, vy, { color: c.s2, size: 12, weight: 700, font: c.mono, fit: sim.width });
  }

  function drawGraph(ctx, b, c, p, s) {
    D.roundRect(ctx, b.x, b.y, b.w, b.h, 10, D.alpha(c.muted, 0.06), D.alpha(c.muted, 0.25), 1);
    var pl = b.x + 50, pr = b.x + b.w - 14, pt = b.y + 64, pb = b.y + b.h - 34;
    var Imax = iScale(p);
    function X(v) { return pl + v / VMAX * (pr - pl); }
    function Y(i) { return pb - i / Imax * (pb - pt); }
    D.text(ctx, 'Current I against voltage V', b.x + 12, b.y + 15, { color: c.ink, size: 12.5, weight: 700 });
    // grid and ticks
    ctx.font = '10.5px ' + c.mono;
    for (var v = 0; v <= VMAX + 1e-9; v += 1) {
      D.line(ctx, X(v), pt, X(v), pb, c.grid, 1);
      D.text(ctx, String(v), X(v), pb + 11, { color: c.muted, size: 10.5, align: 'center', font: c.mono });
    }
    var st = D.niceStep(Imax, 5), dg = st < 0.01 ? 3 : st < 0.1 ? 2 : st < 1 ? 1 : 0;
    for (var i = 0; i <= Imax + 1e-9; i += st) {
      D.line(ctx, pl, Y(i), pr, Y(i), c.grid, 1);
      D.text(ctx, M.fmt(i, dg), pl - 6, Y(i), { color: c.muted, size: 10.5, align: 'right', font: c.mono });
    }
    D.line(ctx, pl, pb, pr, pb, c.axis, 1.5); D.line(ctx, pl, pb, pl, pt, c.axis, 1.5);
    D.text(ctx, 'V (volt)', pr, pb + 25, { color: c.muted, size: 11, align: 'right' });
    D.text(ctx, 'I (A)', pl - 24, pt - 14, { color: c.muted, size: 11, align: 'center' });

    var pts = s.pts;
    ctx.save(); ctx.beginPath(); ctx.rect(pl, pt - 4, pr - pl + 4, pb - pt + 4); ctx.clip();
    if (pts.length >= 2) {
      if (isBulb(p)) { // join the points with a smooth-ish curve
        ctx.strokeStyle = c.s3; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(0));
        pts.forEach(function (q) { ctx.lineTo(X(q.V), Y(q.I)); }); ctx.stroke();
      } else {
        var k = fit(pts); D.line(ctx, X(0), Y(0), X(VMAX), Y(k * VMAX), c.s3, 2);
      }
    }
    ctx.restore();
    pts.forEach(function (q) { D.circle(ctx, X(q.V), Y(q.I), 5, c.accent, c.bg, 1.5); });
    // where the circuit is now
    var Inow = currentAt(p, p.V, s.blown);
    if (Inow <= Imax) {
      D.line(ctx, X(p.V), pb, X(p.V), Y(Inow), D.alpha(c.s2, 0.6), 1, [4, 4]);
      D.circle(ctx, X(p.V), Y(Inow), 6, null, c.s2, 2);
    }
    // slope message
    var msg = pts.length < 2 ? 'Record readings to plot them (' + pts.length + ' so far)'
      : isBulb(p) ? 'A curve, not a straight line: R = V/I rises as the filament heats'
      : 'Straight line through O: slope = ' + M.fmt(fit(pts), 3) + ' A/V → R = 1/slope = ' + M.fmt(1 / fit(pts), 2) + ' Ω';
    var size = 11.5; ctx.font = '600 ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 9 && ctx.measureText(msg).width > b.w - 20) { size -= 0.5; ctx.font = '600 ' + size + 'px Inter, system-ui, sans-serif'; }
    D.text(ctx, msg, b.x + b.w / 2, b.y + 32, { color: pts.length < 2 ? c.muted : c.ink, size: size, weight: 600, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 3 });
  }
})();
