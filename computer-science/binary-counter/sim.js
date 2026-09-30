/* =====================================================================
   Numbers and logic · Binary Counter and Place Values — sim.js
   ---------------------------------------------------------------------
   A row of 4 or 8 bits (lamps). Each bit has a place value that is a
   power of 2: 2⁷ = 128 … 2⁰ = 1. The number is the sum of the place
   values of the bits that are ON.
     decimal → binary: divide by 2 again and again; the remainders read
     from bottom to top are the bits.
     binary → hexadecimal: groups of 4 bits (from the right) → 0–F
     binary → octal: groups of 3 bits (from the right) → 0–7
   Counting adds 1 each tick: the rightmost 1s flip to 0 and carry into
   the next 0. Past the largest value (2ⁿ − 1) an n-bit counter
   overflows back to 0.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SUP = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷'];
  var HEX = '0123456789ABCDEF';

  function nb(sim) { return parseInt(sim.p.bits, 10); }
  function bin(v, n) { var s = v.toString(2); while (s.length < n) s = '0' + s; return s; }
  function setV(sim, v, why) {
    var n = nb(sim), max = (1 << n) - 1, st = sim.state, old = st.v;
    st.over = false;
    if (v > max) { v = 0; st.over = true; } else if (v < 0) { v = max; st.over = true; }
    st.changed = old ^ v; st.tChange = performance.now(); st.v = v; st.why = why || '';
    sim.redraw();
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, n = nb(sim);
    var panelW = narrow ? 0 : Math.min(230, W * 0.3);
    var areaW = W - panelW - (narrow ? 16 : 40), cell = Math.min(narrow ? 80 : 84, areaW / n);
    var x0 = (narrow ? 8 : 16) + (areaW - cell * n) / 2, y0 = 58, ch = Math.min(narrow ? 120 : 138, H * 0.34);
    return { narrow: narrow, n: n, cell: cell, x0: x0, y0: y0, ch: ch, panelW: panelW, areaW: areaW };
  }
  function fitText(ctx, str, max, size, weight) {
    ctx.font = (weight || 700) + ' ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 8 && ctx.measureText(str).width > max) { size -= 0.5; ctx.font = (weight || 700) + ' ' + size + 'px Inter, system-ui, sans-serif'; }
    return size;
  }

  SimLab.createSim({
    ariaLabel: 'A row of binary bits shown as lamps with their place values, the decimal, octal and hexadecimal value, and the division-by-2 steps that convert decimal to binary',
    mobileAspect: '3 / 4.6',
    params: [
      { id: 'bits', label: 'Number of bits', type: 'select', value: '8', options: [{ value: '4', label: '4 bits (a nibble): 0 to 15' }, { value: '8', label: '8 bits (a byte): 0 to 255' }] },
      { id: 'speed', label: 'Counting speed', min: 0.5, max: 10, step: 0.5, value: 2, unit: 'counts/s',
        help: 'Press Play to count up by 1 at this speed. Tap any lamp to flip that bit.' },
      { id: 'steps', label: 'Show the divide-by-2 working', type: 'toggle', value: true }
    ],
    buttons: [
      { label: '+1', onClick: function (sim) { setV(sim, sim.state.v + 1, 'add'); } },
      { label: '−1', onClick: function (sim) { setV(sim, sim.state.v - 1, 'sub'); } },
      { label: 'Clear to 0', onClick: function (sim) { sim.state.target = null; setV(sim, 0); } },
      { label: 'New challenge: make a number', primary: true, onClick: function (sim) {
        var max = (1 << nb(sim)) - 1, t;
        do { t = 1 + Math.floor(Math.random() * max); } while (t === sim.state.v);
        sim.state.target = t; sim.state.done = false; sim.pause(); sim.redraw();
      } }
    ],
    readouts: [
      { id: 'dec', label: 'Decimal (base 10)', key: true },
      { id: 'bin', label: 'Binary (base 2)', key: true },
      { id: 'oct', label: 'Octal (base 8)' },
      { id: 'hex', label: 'Hexadecimal (base 16)' },
      { id: 'ones', label: 'Bits that are 1' }
    ],
    onParam: function (sim, id) {
      if (id === 'bits') { var max = (1 << nb(sim)) - 1; if (sim.state.v > max) sim.state.v &= max; if (sim.state.target > max) sim.state.target = null; }
      return true;
    },
    reset: function (sim) { sim.state = { v: 0, acc: 0, changed: 0, tChange: 0, over: false, target: null, why: '' }; },
    update: function (sim, dt) {
      var st = sim.state; st.acc += dt * sim.p.speed;
      if (st.acc >= 1) { st.acc -= 1; setV(sim, st.v + 1, 'add'); }
    },
    animate: function (sim) { return performance.now() - sim.state.tChange < 700; },
    readout: function (sim) {
      var v = sim.state.v, n = nb(sim), ones = bin(v, n).split('').filter(function (b) { return b === '1'; }).length;
      return { dec: String(v), bin: bin(v, n) + '₂', oct: v.toString(8) + '₈', hex: v.toString(16).toUpperCase() + '₁₆', ones: ones + ' of ' + n };
    },
    status: function (sim) { return sim.state.target != null ? 'Challenge: make ' + sim.state.target : bin(sim.state.v, nb(sim)) + '₂ = ' + sim.state.v; },
    pointer: {
      down: function (sim, x, y) {
        var L = layout(sim);
        if (y < L.y0 || y > L.y0 + L.ch || x < L.x0 || x > L.x0 + L.cell * L.n) return false;
        var i = Math.floor((x - L.x0) / L.cell), bit = L.n - 1 - i;
        setV(sim, sim.state.v ^ (1 << bit), 'tap');
        return false;
      },
      hover: function (sim, x, y) { var L = layout(sim); return y >= L.y0 && y <= L.y0 + L.ch && x >= L.x0 && x <= L.x0 + L.cell * L.n; }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, L = layout(sim), st = sim.state, n = L.n, v = st.v;
      var b = bin(v, n), glow = Math.max(0, 1 - (performance.now() - st.tChange) / 700), narrow = L.narrow;
      D.clear(ctx, W, H, c.bg);
      st.done = st.target != null && v === st.target;

      // headline
      var hl, hc;
      if (st.target != null) {
        hl = st.done ? '✓ Well done! ' + st.target + ' = ' + bin(st.target, n) + '₂' : 'Challenge: switch on lamps to make ' + st.target + (narrow ? '' : ' (now ' + v + ')');
        hc = st.done ? c.success : c.warning;
      } else if (st.over) { hl = 'Overflow! ' + n + ' bits can only hold 0 to ' + ((1 << n) - 1) + ', so the counter wraps round'; hc = c.danger; }
      else { hl = 'Each lamp is worth double the one on its right'; hc = c.s1; }
      var hs = fitText(ctx, hl, W - 24, narrow ? 11.5 : 13);
      D.text(ctx, hl, W / 2, 16, { color: c.bg, bg: hc, size: hs, weight: 700, align: 'center', pad: 5, fit: W });

      // bits
      for (var i = 0; i < n; i++) {
        var bit = n - 1 - i, on = b[i] === '1', x = L.x0 + i * L.cell, cw = L.cell - 6, cx = x + L.cell / 2;
        var flipped = (st.changed >> bit) & 1;
        D.roundRect(ctx, x + 3, L.y0, cw, L.ch, 10, on ? D.alpha('#fbbf24', 0.14) : c.surface2, flipped && glow > 0 ? D.alpha('#f472b6', 0.4 + 0.6 * glow) : c.border, flipped && glow > 0 ? 3 : 1);
        D.text(ctx, String(1 << bit), cx, L.y0 + 14, { color: on ? c.warning : c.muted, size: M.clamp(L.cell * 0.26, 10, 15), weight: 700, align: 'center' });
        D.text(ctx, '2' + SUP[bit], cx, L.y0 + 31, { color: c.muted, size: 10, align: 'center' });
        var lr = Math.min(cw * 0.34, L.ch * 0.17), ly = L.y0 + L.ch * 0.5;
        if (on) D.circle(ctx, cx, ly, lr * 1.7, D.alpha('#fde68a', 0.22));
        D.circle(ctx, cx, ly, lr, on ? '#fde047' : D.alpha(c.ink, 0.12), on ? '#f59e0b' : c.border, 2);
        D.text(ctx, b[i], cx, L.y0 + L.ch - 20, { color: on ? c.ink : c.muted, size: M.clamp(L.cell * 0.4, 16, 28), weight: 700, align: 'center', font: 'ui-monospace, SFMono-Regular, Menlo, monospace' });
      }
      // hex groups (4 bits) under the row
      var gy = L.y0 + L.ch + 12;
      for (var g = 0; g < n / 4; g++) {
        var gx0 = L.x0 + g * 4 * L.cell + 6, gx1 = L.x0 + (g + 1) * 4 * L.cell - 6, nib = parseInt(b.substr(g * 4, 4), 2);
        D.line(ctx, gx0, gy, gx1, gy, c.s2, 2); D.line(ctx, gx0, gy - 6, gx0, gy, c.s2, 2); D.line(ctx, gx1, gy - 6, gx1, gy, c.s2, 2);
        D.text(ctx, b.substr(g * 4, 4) + ' → ' + HEX[nib] + (narrow ? '' : '  (' + nib + ')'), (gx0 + gx1) / 2, gy + 14, { color: c.s2, size: narrow ? 11 : 12, weight: 700, align: 'center' });
      }

      // place-value sum
      var terms = [], y = gy + 46;
      for (var k = n - 1; k >= 0; k--) if ((v >> k) & 1) terms.push(String(1 << k));
      var sum = (terms.length ? terms.join(' + ') : '0') + ' = ' + v;
      var left = narrow ? 8 : 16, maxW = L.areaW;
      D.text(ctx, 'Add the place values of the lamps that are on:', left, y, { color: c.muted, size: 11, weight: 600 });
      var ss = fitText(ctx, sum, maxW, narrow ? 15 : 18);
      D.text(ctx, sum, left, y + 24, { color: c.ink, size: ss, weight: 700 });
      // hex and octal lines
      var oct = v.toString(8), octGroups = [], bb = b;
      while (bb.length % 3) bb = '0' + bb;
      for (var o = 0; o < bb.length; o += 3) octGroups.push(bb.substr(o, 3));
      var l2 = 'Octal: ' + octGroups.join(' ') + ' → ' + oct + '₈', l3 = 'Hex: ' + v.toString(16).toUpperCase() + '₁₆   ·   Decimal: ' + v;
      D.text(ctx, l2, left, y + 52, { color: c.s3, size: fitText(ctx, l2, maxW, narrow ? 12 : 13, 600), weight: 600 });
      D.text(ctx, l3, left, y + 74, { color: c.s2, size: fitText(ctx, l3, maxW, narrow ? 12 : 13, 600), weight: 600 });

      // divide-by-2 working
      if (sim.p.steps) {
        var rows = [], q = v;
        if (q === 0) rows.push([0, 0, 0]);
        while (q > 0) { rows.push([q, Math.floor(q / 2), q % 2]); q = Math.floor(q / 2); }
        var px, py, pw, ph, rh;
        if (!narrow) { px = W - L.panelW - 12; py = L.y0; pw = L.panelW; ph = Math.min(H - py - 12, 60 + 8 * 24); rh = Math.min(22, (ph - 58) / Math.max(rows.length, 1)); }
        else { px = 8; py = y + 92; pw = W - 16; ph = H - py - 8; rh = Math.min(18, (ph - 50) / Math.max(rows.length, 1)); }
        if (ph > 60) {
          D.roundRect(ctx, px, py, pw, ph, 8, c.surface2, c.border, 1);
          D.text(ctx, 'Decimal → binary: ÷ 2', px + 10, py + 15, { color: c.ink, size: 12, weight: 700 });
          rows.forEach(function (r, j) {
            var yy = py + 38 + j * rh, fs = Math.min(12, rh * 0.75);
            D.text(ctx, r[0] + ' ÷ 2 = ' + r[1], px + 12, yy, { color: c.ink, size: fs, weight: 500, font: 'ui-monospace, SFMono-Regular, Menlo, monospace' });
            D.text(ctx, 'rem ' + r[2], px + pw - 12, yy, { color: r[2] ? c.warning : c.muted, size: fs, weight: 700, align: 'right' });
          });
          var ay0 = py + 38 + (rows.length - 1) * rh, ax = px + pw - 58;
          if (rows.length > 1) D.arrow(ctx, ax, ay0 + 4, ax, py + 32, D.alpha(c.warning, 0.8), 2, 7);
          D.text(ctx, 'read remainders upwards: ' + (v ? v.toString(2) : '0'), px + 10, py + ph - 12, { color: c.warning, size: fitText(ctx, 'read remainders upwards: ' + v.toString(2), pw - 20, 11, 600), weight: 600 });
        }
      }
    }
  });
})();
