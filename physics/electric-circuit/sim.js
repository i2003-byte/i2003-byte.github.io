/* =====================================================================
   Electricity · Electric Circuit & Symbols — sim.js
   ---------------------------------------------------------------------
   A battery, a switch and one or two bulbs in a single loop. Draw it as
   pictures or as standard circuit symbols. Current flows only when the
   loop is complete: switch ON and every bulb's filament whole.
   Model (kept simple for Class 7):
     each cell = 1.5 V · each torch bulb = 10 Ω (treated as fixed)
     battery voltage = 1.5 V × (cells, counting a reversed cell as −1)
     current I = V ÷ (10 Ω × number of bulbs) — bulbs are in series
     bulb glow ∝ power in one bulb = I² × 10 Ω, compared with
     1 bulb on 2 cells (0.3 A) = "normal".
   Dots show conventional current: out of + , round the loop, into −.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var CELL_V = 1.5, BULB_R = 10, P_NORMAL = 0.9; // 0.3 A through 10 Ω
  var geo = null; // switch position for tapping, set in draw

  function solve(p) {
    var rev = p.reversed;
    var v = rev ? (p.cells >= 2 ? CELL_V * (p.cells - 2) : -CELL_V) : CELL_V * p.cells;
    var closed = p.closed && !p.fused;
    var I = closed ? v / (BULB_R * p.bulbs) : 0;
    var b = I * I * BULB_R / P_NORMAL;
    var why = !p.closed ? 'Switch is OFF: circuit open' : p.fused ? 'Bulb fused: filament broken, circuit open' :
      Math.abs(v) < 1e-9 ? 'Cells push against each other: no current' : 'Circuit closed: current flows';
    return { v: v, I: I, b: b, why: why };
  }
  function glowWord(b) { return b <= 0 ? 'Off' : b < 0.35 ? 'Dim' : b < 1.6 ? 'Normal' : b < 2.5 ? 'Bright' : 'Very bright (may fuse!)'; }

  SimLab.createSim({
    ariaLabel: 'A circuit of a battery of cells, a switch and bulbs, drawn as pictures or circuit symbols, with moving dots for current',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'closed', label: 'Switch ON (or tap the switch)', type: 'toggle', value: false },
      { id: 'view', label: 'Draw the circuit as', type: 'select', value: 'picture', options: [
        { value: 'picture', label: 'Pictures (real objects)' }, { value: 'symbol', label: 'Circuit symbols (diagram)' }] },
      { id: 'cells', label: 'Cells in the battery', min: 1, max: 4, step: 1, value: 2, unit: '' ,
        format: function (v) { return v + (v === 1 ? ' cell' : ' cells') + ' (' + M.fmt(v * CELL_V, 1) + ' V)'; } },
      { id: 'bulbs', label: 'Bulbs (one after another)', type: 'select', value: 1, options: [
        { value: 1, label: '1 bulb' }, { value: 2, label: '2 bulbs in a row (series)' }] },
      { id: 'reversed', label: 'Turn one cell the wrong way', type: 'toggle', value: false },
      { id: 'fused', label: 'Fuse a bulb (break its filament)', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'state', label: 'Circuit', key: true },
      { id: 'v', label: 'Battery voltage', unit: 'V', digits: 1 },
      { id: 'I', label: 'Current (model)', unit: 'A', digits: 2 },
      { id: 'glow', label: 'Each bulb glows', key: true }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var r = solve(sim.p);
      return { state: r.why, v: r.v, I: Math.abs(r.I), glow: glowWord(r.b) };
    },
    animate: function (sim) { return !sim.reduceMotion && Math.abs(solve(sim.p).I) > 0; },
    pointer: {
      down: function (sim, x, y) {
        if (geo && Math.abs(x - geo.x) < 36 && Math.abs(y - geo.y) < 44) { sim.setParam('closed', !sim.p.closed, true); return true; }
        return false;
      },
      hover: function (sim, x, y) { return !!geo && Math.abs(x - geo.x) < 36 && Math.abs(y - geo.y) < 44; }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, r = solve(p);
      D.clear(ctx, W, H, c.bg);
      var sym = p.view === 'symbol', narrow = W < 560;
      var x0 = W * (narrow ? 0.1 : 0.16), x1 = W * (narrow ? 0.84 : 0.8), y0 = H * 0.24, y1 = H * 0.76;
      var w = x1 - x0, h = y1 - y0, ym = (y0 + y1) / 2, xm = (x0 + x1) / 2;
      var wire = c.light ? '#475569' : '#cbd5e1';

      // component spans along the loop (s runs clockwise from the top-left corner)
      var cellW = sym ? 26 : Math.min(54, w / 5.5), bw = cellW * p.cells;
      var bulbX = p.bulbs === 1 ? [xm] : [x0 + w / 3, x0 + 2 * w / 3];
      var gaps = [[w / 2 - bw / 2 - 6, w / 2 + bw / 2 + 6], [w + h / 2 - 30, w + h / 2 + 30]];
      bulbX.forEach(function (bx) { var s = w + h + (x1 - bx); gaps.push([s - 22, s + 22]); });

      // wires
      ctx.save(); ctx.strokeStyle = wire; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.strokeRect(x0, y0, w, h); ctx.restore();

      // moving charges (conventional current)
      if (Math.abs(r.I) > 0) {
        var P = 2 * (w + h), speed = M.clamp(Math.abs(r.I) / 0.3 * 45, 12, 160) * Math.sign(r.I);
        var off = sim.reduceMotion ? 0 : ((now / 1000 * speed) % 26 + 26) % 26;
        for (var s = off; s < P; s += 26) {
          if (gaps.some(function (gp) { return s > gp[0] && s < gp[1]; })) continue;
          var pt = along(s, x0, y0, w, h);
          D.circle(ctx, pt.x, pt.y, 3, c.warning);
        }
        // direction arrow inside the loop
        var dir = r.I > 0 ? 1 : -1;
        D.arrow(ctx, xm - 40 * dir, y0 + 26, xm + 40 * dir, y0 + 26, c.warning, 2, 9);
        D.text(ctx, 'current: + → round the loop → −', xm, y0 + 44, { color: c.muted, size: 11, align: 'center', fit: W });
      }

      battery(ctx, c, p, xm, y0, cellW, sym, wire);
      var sx = x1, sy = y0 + h / 2;
      geo = { x: sx, y: sy };
      switchPart(ctx, c, sx, sy, p.closed, sym, wire);
      bulbX.forEach(function (bx, i) { bulb(ctx, c, bx, y1, r.b, p.fused && i === 0, sym, wire); });

      // labels
      D.text(ctx, 'Battery: ' + p.cells + (p.cells === 1 ? ' cell' : ' cells') + ' = ' + M.fmt(Math.abs(r.v), 1) + ' V', xm, y0 - (sym ? 30 : 34), { color: c.ink, size: 12, weight: 700, align: 'center', fit: W });
      D.text(ctx, 'Switch ' + (p.closed ? 'ON' : 'OFF'), sx - 28, sy - 8, { color: p.closed ? c.success : c.danger, size: 12, weight: 700, align: 'right' });
      D.text(ctx, '(tap it)', sx - 28, sy + 8, { color: c.faint, size: 10, align: 'right' });
      D.text(ctx, p.bulbs === 1 ? 'Bulb' : 'Bulbs in series', xm, y1 + (sym ? 32 : 30), { color: c.muted, size: 12, align: 'center' });

      // verdict
      var ok = Math.abs(r.I) > 0;
      D.text(ctx, r.why, W / 2, H - 16, { color: ok ? c.success : c.danger, size: narrow ? 12 : 14, weight: 700, align: 'center', fit: W });
      if (r.b >= 2.5) D.text(ctx, '⚠ Too many cells for this bulb', W / 2, H - 36, { color: c.warning, size: 12, weight: 600, align: 'center', fit: W });
      if (!ok) D.text(ctx, sym ? 'Open circuit: no path round the loop' : 'No current, so the bulb stays dark', xm, ym, { color: c.faint, size: 12, align: 'center', fit: W });
    }
  });

  // Point at distance s along the rectangle, clockwise from the top-left.
  function along(s, x0, y0, w, h) {
    if (s < w) return { x: x0 + s, y: y0 };
    s -= w; if (s < h) return { x: x0 + w, y: y0 + s };
    s -= h; if (s < w) return { x: x0 + w - s, y: y0 + h };
    s -= w; return { x: x0, y: y0 + h - s };
  }

  // Battery on the top wire. The + end is on the right, so current leaves to the right.
  function battery(ctx, c, p, xm, y, cw, sym, wire) {
    var n = p.cells, left = xm - cw * n / 2, revIdx = p.reversed ? (n >= 2 ? 1 : 0) : -1;
    ctx.fillStyle = c.bg; ctx.fillRect(left - 5, y - 20, cw * n + 10, 40);
    D.line(ctx, left - 6, y, left, y, wire, 3); D.line(ctx, left + cw * n, y, left + cw * n + 6, y, wire, 3);
    for (var i = 0; i < n; i++) {
      var cx = left + i * cw, flip = i === revIdx;
      if (sym) {
        var a = cx + cw / 2 - 4, b = cx + cw / 2 + 4; // negative plate at a, positive at b
        if (flip) { var t = a; a = b; b = t; }
        D.line(ctx, cx, y, Math.min(a, b), y, wire, 3); D.line(ctx, Math.max(a, b), y, cx + cw, y, wire, 3);
        D.line(ctx, a, y - 8, a, y + 8, c.ink, 5);   // short thick = negative
        D.line(ctx, b, y - 16, b, y + 16, c.ink, 2); // long thin = positive
        if (flip) D.roundRect(ctx, cx + 1, y - 21, cw - 2, 42, 4, null, c.warning, 1.5);
      } else {
        var bw = cw - 10, bx = cx + 3;
        D.roundRect(ctx, bx, y - 13, bw, 26, 5, flip ? '#7c2d12' : '#1f2937', flip ? c.warning : '#64748b', flip ? 2 : 1);
        D.roundRect(ctx, bx + bw * 0.12, y - 13, bw * 0.3, 26, 2, '#dc2626');
        var nx = flip ? bx - 4 : bx + bw;
        D.roundRect(ctx, nx, y - 5, 4, 10, 1, '#d1d5db');
        D.text(ctx, '+', flip ? bx + 7 : bx + bw - 7, y, { color: '#fff', size: 11, weight: 700, align: 'center' });
        D.line(ctx, cx + cw - 3, y, cx + cw + 1, y, wire, 3);
      }
    }
    var swap = p.reversed && n === 1; // a single cell turned round puts + on the left
    D.text(ctx, swap ? '+' : '−', left - 12, y - 16, { color: swap ? c.s1 : c.s2, size: 16, weight: 700, align: 'center' });
    D.text(ctx, swap ? '−' : '+', left + cw * n + 12, y - 16, { color: swap ? c.s2 : c.s1, size: 16, weight: 700, align: 'center' });
  }

  // Switch on the right wire.
  function switchPart(ctx, c, x, y, on, sym, wire) {
    ctx.fillStyle = c.bg; ctx.fillRect(x - 24, y - 30, 48, 60);
    var ta = { x: x, y: y - 22 }, tb = { x: x, y: y + 22 };
    D.line(ctx, x, y - 30, ta.x, ta.y, wire, 3); D.line(ctx, x, y + 30, tb.x, tb.y, wire, 3);
    var ang = on ? -Math.PI / 2 : -Math.PI / 2 - 0.6, len = 44;
    var ex = tb.x + Math.cos(ang) * len, ey = tb.y + Math.sin(ang) * len;
    if (sym) {
      D.line(ctx, tb.x, tb.y, ex, ey, c.ink, 2.5);
      D.circle(ctx, ta.x, ta.y, 4, c.bg, c.ink, 2); D.circle(ctx, tb.x, tb.y, 4, c.ink);
    } else {
      D.roundRect(ctx, x - 16, y - 30, 32, 60, 5, '#a16207', '#78350f', 1);
      D.circle(ctx, ta.x, ta.y, 5, '#fbbf24', '#78350f', 1); D.circle(ctx, tb.x, tb.y, 5, '#fbbf24', '#78350f', 1);
      D.line(ctx, tb.x, tb.y, ex, ey, '#d1d5db', 5);
      D.circle(ctx, ex + Math.cos(ang) * 4, ey + Math.sin(ang) * 4, 6, '#dc2626');
    }
  }

  // Bulb on the bottom wire. b = brightness (1 = normal).
  function bulb(ctx, c, x, y, b, broken, sym, wire) {
    var lit = b > 0 && !broken, gl = lit ? M.clamp(Math.sqrt(b), 0, 2) : 0;
    if (lit) {
      var gr = ctx.createRadialGradient(x, y - (sym ? 0 : 18), 2, x, y - (sym ? 0 : 18), 26 + 34 * gl);
      gr.addColorStop(0, 'rgba(253,224,71,' + M.clamp(0.35 + 0.3 * gl, 0, 0.95) + ')');
      gr.addColorStop(1, 'rgba(253,224,71,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y - (sym ? 0 : 18), 26 + 34 * gl, 0, Math.PI * 2); ctx.fill();
    }
    var fil = lit ? '#fde047' : c.muted;
    if (sym) {
      ctx.fillStyle = c.bg; ctx.fillRect(x - 18, y - 17, 36, 34);
      D.circle(ctx, x, y, 15, lit ? D.alpha('#fde047', 0.25) : null, c.ink, 2);
      D.line(ctx, x - 22, y, x - 15, y, wire, 3); D.line(ctx, x + 15, y, x + 22, y, wire, 3);
      // filament: leads in from both sides and a loop in the middle
      ctx.save(); ctx.strokeStyle = broken ? c.danger : lit ? '#ca8a04' : c.ink; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(x - 15, y); ctx.lineTo(x - 5, y);
      if (broken) { ctx.moveTo(x + 5, y); } else ctx.arc(x, y, 5, Math.PI, 0, false);
      ctx.lineTo(x + 15, y); ctx.stroke(); ctx.restore();
      if (broken) D.text(ctx, '✕', x, y - 6, { color: c.danger, size: 10, weight: 700, align: 'center' });
    } else {
      ctx.fillStyle = c.bg; ctx.fillRect(x - 20, y - 6, 40, 12);
      D.roundRect(ctx, x - 18, y - 6, 36, 14, 3, '#374151', '#6b7280', 1); // holder
      D.roundRect(ctx, x - 9, y - 16, 18, 12, 2, '#9ca3af');                  // metal cap
      D.circle(ctx, x, y - 34, 20, lit ? 'rgba(254,249,195,0.85)' : 'rgba(203,213,225,0.18)', c.muted, 1.5);
      ctx.save(); ctx.strokeStyle = broken ? c.danger : fil; ctx.lineWidth = lit ? 2.5 : 1.5; ctx.beginPath();
      ctx.moveTo(x - 5, y - 16); ctx.lineTo(x - 7, y - 34);
      if (broken) { ctx.lineTo(x - 3, y - 38); ctx.moveTo(x + 2, y - 36); }
      else { for (var k = 0; k <= 6; k++) ctx.lineTo(x - 7 + k * 14 / 6, y - 34 - (k % 2 ? 5 : 0)); }
      ctx.lineTo(x + 7, y - 34); ctx.lineTo(x + 5, y - 16); ctx.stroke(); ctx.restore();
    }
  }
})();
