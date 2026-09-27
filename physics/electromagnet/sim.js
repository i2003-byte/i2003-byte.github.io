/* =====================================================================
   Electricity · Electromagnet — sim.js
   ---------------------------------------------------------------------
   Insulated wire wound round an iron nail and joined to a battery
   becomes a magnet while current flows. Switch off: the pins drop.
   Classroom model (numbers are relative, not real units):
     current      I = 0.5 A per cell (kept fixed so only one thing changes)
     strength     S = turns × I × core factor
                  core factor: iron 1, wood or air 0.01 (iron makes it
                  roughly a hundred times stronger)
     pins lifted  = S ÷ 12 (whole pins only, at most 24)
   Poles follow the right-hand grip rule: with the battery the normal
   way, current runs right-to-left across the front of the coil, so
   the field inside points down and the nail's point is a north pole.
   The compass needle follows Earth's field plus the field of the two
   poles (each pole treated as a point: B ∝ q·r̂ / r²).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var CORE = { iron: { k: 1, name: 'Iron nail' }, wood: { k: 0.01, name: 'Wooden pencil' }, air: { k: 0.01, name: 'No core (air)' } };
  var NPINS = 24, SW = 10, SH = 7.6; // scene size in "units"
  var TIP = { x: 5, y: 4.3 }, HEAD = { x: 5, y: 0.9 }, COMPASS = { x: 7.9, y: 4.3 };
  var pins = null, lastNow = 0;

  function strength(p) { return p.on ? p.turns * 0.5 * p.cells * CORE[p.core].k : 0; }
  function lifted(p) { return Math.min(NPINS, Math.floor(strength(p) / 12 + 1e-9)); }
  function restPos(i) { var r = M.rng(i * 7919 + 3); return { x: 2.9 + (i % 12) * 0.36 + r() * 0.1, y: 6.95 - Math.floor(i / 12) * 0.14, a: (r() - 0.5) * 0.6 }; }
  function stuckPos(i) { var row = Math.floor(i / 5), col = i % 5; return { x: TIP.x + (col - 2) * 0.17 * (1 + row * 0.25), y: TIP.y + 0.3 + row * 0.42, a: Math.PI / 2 + (col - 2) * 0.18 }; }
  function needleAngle(p) { // screen angle of the needle's north end
    var q = strength(p) / 6 * (p.reversed ? -1 : 1); // + : north pole at the point
    var bx = 0, by = -1; // Earth: north is "up" on the screen
    [[TIP, q], [HEAD, -q]].forEach(function (pole) {
      var dx = COMPASS.x - pole[0].x, dy = COMPASS.y - pole[0].y, r = Math.hypot(dx, dy);
      bx += pole[1] * dx / (r * r * r); by += pole[1] * dy / (r * r * r);
    });
    return Math.atan2(by, bx);
  }

  SimLab.createSim({
    ariaLabel: 'A coil of wire wound on a nail, joined to a battery and switch, lifting pins, with a compass nearby',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'on', label: 'Switch ON (or tap the switch)', type: 'toggle', value: true },
      { id: 'turns', label: 'Turns of wire', min: 10, max: 100, step: 10, value: 50, unit: 'turns' },
      { id: 'cells', label: 'Cells in the battery', min: 1, max: 4, step: 1, value: 2,
        format: function (v) { return v + (v === 1 ? ' cell' : ' cells') + ' (' + M.fmt(v * 0.5, 1) + ' A)'; } },
      { id: 'core', label: 'Coil wound on', type: 'select', value: 'iron', options: Object.keys(CORE).map(function (k) { return { value: k, label: CORE[k].name }; }) },
      { id: 'reversed', label: 'Swap the battery terminals', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'I', label: 'Current (model)', unit: 'A', digits: 1 },
      { id: 'NI', label: 'Turns × current', unit: 'A', digits: 0 },
      { id: 'S', label: 'Magnet strength (relative)', digits: 0, key: true },
      { id: 'pins', label: 'Pins lifted', digits: 0, key: true },
      { id: 'pole', label: 'Pole at the bottom end' }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var p = sim.p, I = p.on ? 0.5 * p.cells : 0;
      return { I: I, NI: p.turns * I, S: strength(p), pins: lifted(p),
        pole: !p.on ? 'None (switch off)' : p.core !== 'iron' ? 'Very weak' : p.reversed ? 'South (S)' : 'North (N)' };
    },
    animate: function () { return !!pins && pins.some(function (q) { return Math.abs(q.x - q.tx) + Math.abs(q.y - q.ty) > 0.005; }); },
    pointer: {
      down: function (sim, x, y) { if (onSwitch(sim, x, y)) { sim.setParam('on', !sim.p.on, true); return true; } return false; },
      hover: function (sim, x, y) { return onSwitch(sim, x, y); }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p;
      D.clear(ctx, W, H, c.bg);
      var k = Math.min(W / SW, (H - 24) / SH), ox = (W - SW * k) / 2, oy = Math.max(20, (H - SH * k) / 2 + 8);
      function X(u) { return ox + u * k; } function Y(v) { return oy + v * k; }
      var wire = c.light ? '#b45309' : '#f59e0b', copper = '#c2703d', on = p.on, n = lifted(p), S = strength(p);

      // pins: move towards their targets
      var fresh = !pins; if (!pins) pins = []; while (pins.length < NPINS) { var r0 = restPos(pins.length); pins.push({ x: r0.x, y: r0.y, a: r0.a, tx: r0.x, ty: r0.y }); }
      var dt = Math.min(0.05, lastNow ? (now - lastNow) / 1000 : 0); lastNow = now;
      pins.forEach(function (q, i) {
        var t = i < n ? stuckPos(i) : restPos(i);
        q.tx = t.x; q.ty = t.y; q.ta = t.a;
        var rate = sim.reduceMotion || fresh ? 1 : Math.min(1, dt * (i < n ? 9 : 6));
        q.x += (q.tx - q.x) * rate; q.y += (q.ty - q.y) * rate; q.a += (q.ta - q.a) * rate;
      });

      // table
      D.line(ctx, X(0.3), Y(7.1), X(9.7), Y(7.1), c.axis, 2);

      // battery (left) and switch
      var bx0 = 0.5, by = 2.6, cw = 0.55;
      for (var i = 0; i < p.cells; i++) {
        var x = X(bx0 + i * cw), y = Y(by);
        D.roundRect(ctx, x, y - k * 0.2, cw * k - 3, k * 0.4, 4, '#1f2937', '#64748b', 1);
        D.roundRect(ctx, x + cw * k * 0.1, y - k * 0.2, cw * k * 0.25, k * 0.4, 2, '#dc2626');
      }
      var bL = X(bx0) - 2, bR = X(bx0 + p.cells * cw) + 2;
      D.text(ctx, p.reversed ? '+' : '−', bL - 8, Y(by) - k * 0.35, { color: c.muted, size: 14, weight: 700, align: 'center' });
      D.text(ctx, p.reversed ? '−' : '+', bR + 4, Y(by) - k * 0.35, { color: c.muted, size: 14, weight: 700, align: 'center' });
      D.text(ctx, p.cells + ' × 1.5 V', (bL + bR) / 2, Y(by) + k * 0.5, { color: c.muted, size: 11, align: 'center' });
      // wires: battery right → top of coil; bottom of coil → switch → battery left
      var cTop = 1.4, cBot = 3.9;
      ctx.save(); ctx.strokeStyle = wire; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.beginPath();
      ctx.moveTo(bR, Y(by)); ctx.lineTo(X(3.2), Y(by)); ctx.lineTo(X(3.2), Y(cTop)); ctx.lineTo(X(4.7), Y(cTop));
      ctx.moveTo(X(4.7), Y(cBot)); ctx.lineTo(X(3.6), Y(cBot)); ctx.lineTo(X(3.6), Y(5.3)); ctx.lineTo(X(2.4), Y(5.3));
      ctx.moveTo(X(1.5), Y(5.3)); ctx.lineTo(X(0.2), Y(5.3)); ctx.lineTo(X(0.2), Y(by)); ctx.lineTo(bL, Y(by));
      ctx.stroke(); ctx.restore();
      var sa = X(1.5), sb = X(2.4), sy = Y(5.3), ang = on ? 0 : -0.55;
      D.circle(ctx, sa, sy, 4, c.ink); D.circle(ctx, sb, sy, 4, c.bg, c.ink, 2);
      D.line(ctx, sa, sy, sa + Math.cos(ang) * (sb - sa), sy + Math.sin(ang) * (sb - sa), c.ink, 3);
      D.text(ctx, 'switch ' + (on ? 'ON' : 'OFF'), (sa + sb) / 2, sy + 18, { color: on ? c.success : c.danger, size: 11, weight: 700, align: 'center' });

      // core
      var core = p.core, nw = 0.28;
      if (core === 'iron') {
        D.roundRect(ctx, X(5 - nw / 2), Y(1.1), nw * k, (TIP.y - 0.3 - 1.1) * k, 2, '#9ca3af');
        ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.moveTo(X(5 - nw / 2), Y(TIP.y - 0.3)); ctx.lineTo(X(5 + nw / 2), Y(TIP.y - 0.3)); ctx.lineTo(X(5), Y(TIP.y)); ctx.fill();
        D.roundRect(ctx, X(5 - 0.3), Y(HEAD.y), 0.6 * k, 0.2 * k, 3, '#6b7280');
      } else if (core === 'wood') {
        D.roundRect(ctx, X(5 - nw / 2), Y(HEAD.y), nw * k, (TIP.y - 0.3 - HEAD.y) * k, 2, '#eab308');
        ctx.fillStyle = '#f5d0a9'; ctx.beginPath(); ctx.moveTo(X(5 - nw / 2), Y(TIP.y - 0.3)); ctx.lineTo(X(5 + nw / 2), Y(TIP.y - 0.3)); ctx.lineTo(X(5), Y(TIP.y)); ctx.fill();
      } else {
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = c.faint; ctx.strokeRect(X(5 - nw / 2), Y(cTop), nw * k, (cBot - cTop) * k); ctx.restore();
      }

      // coil: back halves, then front halves with current arrows
      var nv = M.clamp(Math.round(p.turns / 5), 2, 20), gap = (cBot - cTop) / nv, rx = 0.3 * k, ry = Math.max(3, 0.08 * k);
      for (var j = 0; j <= nv; j++) {
        ctx.save(); ctx.strokeStyle = D.alpha(copper, 0.55); ctx.lineWidth = 2; ctx.beginPath();
        ctx.ellipse(X(5), Y(cTop + j * gap), rx, ry, 0, Math.PI, 2 * Math.PI); ctx.stroke(); ctx.restore();
      }
      for (j = 0; j <= nv; j++) {
        ctx.save(); ctx.strokeStyle = copper; ctx.lineWidth = 2.5; ctx.beginPath();
        ctx.ellipse(X(5), Y(cTop + j * gap), rx, ry, 0, 0, Math.PI); ctx.stroke(); ctx.restore();
      }
      if (on) for (j = 1; j < nv; j += Math.max(2, Math.round(nv / 4))) {
        var yy = Y(cTop + j * gap) + ry, dir = p.reversed ? 1 : -1;
        D.arrow(ctx, X(5) - dir * rx * 0.5, yy, X(5) + dir * rx * 0.5, yy, c.warning, 2, 7);
      }
      D.text(ctx, p.turns + ' turns', X(5) + rx + 10, Y((cTop + cBot) / 2), { color: c.muted, size: 12, fit: W });

      // pins
      pins.forEach(function (q) {
        var px = X(q.x), py = Y(q.y), L = 0.36 * k;
        var ex = px + Math.cos(q.a) * L, ey = py + Math.sin(q.a) * L;
        D.line(ctx, px, py, ex, ey, c.light ? '#475569' : '#cbd5e1', 1.6);
        D.circle(ctx, px, py, 2.4, c.light ? '#334155' : '#e2e8f0');
      });

      // poles
      if (on && S > 0) {
        var tipCol = p.reversed ? c.s1 : c.danger, headCol = p.reversed ? c.danger : c.s1, weak = p.core !== 'iron';
        D.text(ctx, p.reversed ? 'S' : 'N', X(5) - 0.55 * k, Y(TIP.y - 0.1), { color: weak ? c.faint : tipCol, size: 16, weight: 800, align: 'center' });
        D.text(ctx, p.reversed ? 'N' : 'S', X(5) - 0.6 * k, Y(HEAD.y + 0.1), { color: weak ? c.faint : headCol, size: 16, weight: 800, align: 'center' });
      }

      // compass
      var cxp = X(COMPASS.x), cyp = Y(COMPASS.y), cr = 0.75 * k, a = needleAngle(p);
      D.circle(ctx, cxp, cyp, cr, c.surface2, c.border, 2);
      D.text(ctx, 'N', cxp, cyp - cr + 9, { color: c.faint, size: 10, weight: 700, align: 'center' });
      D.line(ctx, cxp, cyp, cxp - Math.cos(a) * cr * 0.8, cyp - Math.sin(a) * cr * 0.8, c.muted, 4);
      D.line(ctx, cxp, cyp, cxp + Math.cos(a) * cr * 0.8, cyp + Math.sin(a) * cr * 0.8, c.danger, 4);
      D.circle(ctx, cxp, cyp, 3, c.ink);
      D.text(ctx, 'compass', cxp, cyp + cr + 12, { color: c.muted, size: 11, align: 'center' });
      var defl = Math.abs(M.deg(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2))));
      D.text(ctx, 'turned ' + M.fmt(defl, 0) + '°', cxp, cyp + cr + 26, { color: defl > 3 ? c.warning : c.faint, size: 11, weight: 600, align: 'center' });

      // headline
      var msg = !on ? 'Switched off: no current, not a magnet' : n > 0 ? 'Electromagnet lifts ' + n + (n === 1 ? ' pin' : ' pins') + (n >= NPINS ? ' (all of them!)' : '') : p.core === 'iron' ? 'Too weak to lift a pin: add turns or cells' : 'Without iron the coil is very weak';
      D.text(ctx, msg, W / 2, 14, { color: on && n > 0 ? c.success : c.warning, size: W < 560 ? 12 : 14, weight: 700, align: 'center', fit: W });
    }
  });

  function onSwitch(sim, x, y) {
    var W = sim.width, H = sim.height, k = Math.min(W / SW, (H - 24) / SH), ox = (W - SW * k) / 2, oy = Math.max(20, (H - SH * k) / 2 + 8);
    return Math.abs(x - (ox + 1.95 * k)) < Math.max(24, 0.7 * k) && Math.abs(y - (oy + 5.3 * k)) < 24;
  }
})();
