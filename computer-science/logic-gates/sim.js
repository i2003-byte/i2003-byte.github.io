/* =====================================================================
   Numbers and logic · Logic Gates and Truth Tables — sim.js
   ---------------------------------------------------------------------
   Inputs are switches (1 = ON, 0 = OFF); the output is a lamp.
     AND  Y = A·B        1 only if both inputs are 1
     OR   Y = A + B      1 if at least one input is 1
     NOT  Y = A̅          flips the input
     NAND Y = NOT(A·B)   NOR Y = NOT(A + B)
     XOR  Y = A ⊕ B      1 if the inputs are different
   "Two gates" joins them: X = gate1(A, B), then Y = gate2(X, C).
   The truth table lists the output for every combination of inputs
   (2ⁿ rows for n inputs); the row for the current switches is lit.
   Gate symbols are the usual distinctive-shape (ANSI) symbols.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var G = {
    AND: { f: function (a, b) { return a & b; }, op: '·', rule: 'AND: the output is 1 only when BOTH inputs are 1', eg: 'A lift moves only if the door is shut AND a floor button is pressed.' },
    OR: { f: function (a, b) { return a | b; }, op: '+', rule: 'OR: the output is 1 when AT LEAST ONE input is 1', eg: 'A car\'s inside light comes on if the left door OR the right door is open.' },
    NOT: { f: function (a) { return a ? 0 : 1; }, rule: 'NOT: the output is the OPPOSITE of the input', eg: 'An automatic street light turns on when it is NOT light outside.' },
    NAND: { f: function (a, b) { return (a & b) ? 0 : 1; }, op: '·', neg: true, rule: 'NAND (NOT AND): the output is 0 only when BOTH inputs are 1', eg: 'NAND gates alone can build every other gate; memory chips are full of them.' },
    NOR: { f: function (a, b) { return (a | b) ? 0 : 1; }, op: '+', neg: true, rule: 'NOR (NOT OR): the output is 1 only when BOTH inputs are 0', eg: 'A "safe to enter" sign that lights only when neither the X-ray machine NOR the laser is running.' },
    XOR: { f: function (a, b) { return a ^ b; }, op: '⊕', rule: 'XOR: the output is 1 when the inputs are DIFFERENT', eg: 'A staircase light with two-way switches: flip either switch and the light changes.' }
  };
  var TWO = ['AND', 'OR', 'NAND', 'NOR', 'XOR'];

  function evalC(p, a, b, c) {
    var x = p.gate1 === 'NOT' ? G.NOT.f(a) : G[p.gate1].f(a, b);
    return p.mode === 'two' ? { x: x, y: G[p.gate2].f(x, c) } : { x: x, y: x };
  }
  function vars(p) {
    var v = ['A']; if (p.gate1 !== 'NOT') v.push('B'); if (p.mode === 'two') v.push('C'); return v;
  }
  function expr1(g) { return g === 'NOT' ? 'NOT A' : G[g].neg ? 'NOT(A ' + G[g].op + ' B)' : 'A ' + G[g].op + ' B'; }
  function expr(p) {
    if (p.mode !== 'two') return 'Y = ' + expr1(p.gate1);
    var g = G[p.gate2], inner = '(' + expr1(p.gate1) + ')';
    return 'Y = ' + (g.neg ? 'NOT(' + inner + ' ' + g.op + ' C)' : inner + ' ' + g.op + ' C');
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560;
    var cir = narrow ? { x: 8, y: 40, w: W - 16, h: Math.min(H * 0.5, 280) } : { x: 12, y: 44, w: W * 0.6 - 12, h: H - 56 };
    var tab = narrow ? { x: 8, y: cir.y + cir.h + 8, w: W - 16, h: H - cir.y - cir.h - 16 } : { x: W * 0.6 + 12, y: 44, w: W * 0.4 - 24, h: H - 56 };
    return { narrow: narrow, cir: cir, tab: tab };
  }
  // truth-table geometry. When the box is short (phones), the table turns sideways:
  // one column per input combination, rows A, B, (C), (X), Y, so rows stay readable
  function tableGeo(T, p) {
    var vs = vars(p), cols = vs.slice(), n = 1 << vs.length;
    if (p.mode === 'two') cols.push('X'); cols.push('Y');
    if ((T.h - 64) / n >= 22) {
      var rh = Math.min(30, (T.h - 64) / n), cw = Math.min(64, T.w / cols.length);
      return { side: false, vs: vs, cols: cols, n: n, rh: rh, cw: cw, tx: T.x + (T.w - cw * cols.length) / 2, y0: T.y + 56, h: Math.min(T.h, 64 + rh * n) };
    }
    var lw = 30, rh2 = Math.max(16, Math.min(26, (T.h - 38) / cols.length)), cw2 = Math.min(48, (T.w - 20 - lw) / n);
    var tx2 = T.x + (T.w - lw - cw2 * n) / 2;
    return { side: true, vs: vs, cols: cols, n: n, rh: rh2, cw: cw2, lw: lw, tx: tx2, y0: T.y + 30, h: Math.min(T.h, 38 + rh2 * cols.length) };
  }
  function tableRowAt(T, p, x, y) { // input combination under the pointer, or -1
    var t = tableGeo(T, p);
    if (x < T.x || x > T.x + T.w) return -1;
    if (!t.side) return y >= t.y0 && y < t.y0 + t.rh * t.n ? Math.floor((y - t.y0) / t.rh) : -1;
    var k = Math.floor((x - t.tx - t.lw) / t.cw);
    return y >= t.y0 && y < t.y0 + t.rh * t.cols.length && k >= 0 && k < t.n ? k : -1;
  }
  // geometry of switches, gates and lamp inside the circuit box
  function geo(sim) {
    var L = layout(sim), C = L.cir, p = sim.p, two = p.mode === 'two';
    var top = C.y + 10, bot = C.y + C.h - (L.narrow ? 40 : 46), hh = bot - top;
    var sw = { w: Math.min(64, C.w * 0.17), h: 44 };
    var gw = Math.min(two ? 92 : 120, C.w * (two ? 0.2 : 0.26)), gh = gw * 0.78;
    var g = { sw: sw, gw: gw, gh: gh, inputs: {}, L: L };
    if (!two) {
      if (p.gate1 === 'NOT') g.inputs.A = top + hh * 0.5; else { g.inputs.A = top + hh * 0.28; g.inputs.B = top + hh * 0.72; }
      g.g1 = { x: C.x + C.w * 0.42 - gw / 2, y: top + hh * 0.5 };
    } else {
      g.inputs.A = top + hh * 0.14; g.inputs.B = top + hh * 0.42; g.inputs.C = top + hh * 0.84;
      if (p.gate1 === 'NOT') g.inputs.A = top + hh * 0.26;
      g.g1 = { x: C.x + C.w * 0.33 - gw / 2, y: p.gate1 === 'NOT' ? g.inputs.A : (g.inputs.A + g.inputs.B) / 2 };
      g.g2 = { x: C.x + C.w * 0.62 - gw / 2, y: (g.g1.y + g.inputs.C) / 2 };
    }
    g.lamp = { x: C.x + C.w - Math.min(34, C.w * 0.09), y: two ? g.g2.y : g.g1.y, r: Math.min(22, C.w * 0.055) };
    g.swX = C.x + 4;
    return g;
  }
  // draw one gate; returns its pin positions
  function gate(ctx, type, x, y, w, h, fill, stroke) {
    var pins, bub = G[type] && G[type].neg || type === 'NOT', br = 5, body = bub ? w - 2 * br : w;
    ctx.save(); ctx.beginPath();
    if (type === 'AND' || type === 'NAND') {
      ctx.moveTo(x, y - h / 2); ctx.lineTo(x + body - h / 2, y - h / 2);
      ctx.arc(x + body - h / 2, y, h / 2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(x, y + h / 2); ctx.closePath();
      pins = [y - h / 4, y + h / 4];
    } else if (type === 'NOT') {
      ctx.moveTo(x, y - h / 2); ctx.lineTo(x + body, y); ctx.lineTo(x, y + h / 2); ctx.closePath();
      pins = [y];
    } else {
      var xo = type === 'XOR' ? 8 : 0;
      ctx.moveTo(x + xo, y - h / 2);
      ctx.quadraticCurveTo(x + xo + body * 0.6, y - h / 2, x + body, y);
      ctx.quadraticCurveTo(x + xo + body * 0.6, y + h / 2, x + xo, y + h / 2);
      ctx.quadraticCurveTo(x + xo + body * 0.25, y, x + xo, y - h / 2);
      pins = [y - h / 4, y + h / 4];
    }
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2.5; ctx.stroke();
    if (type === 'XOR') { ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.quadraticCurveTo(x + body * 0.25, y, x, y + h / 2); ctx.stroke(); }
    if (bub) D.circle(ctx, x + body + br, y, br, fill, stroke, 2.5);
    ctx.restore();
    D.text(ctx, type, x + (type === 'NOT' ? body * 0.33 : body * 0.42), y, { color: stroke, size: Math.max(9, Math.min(13, w * 0.14)), weight: 700, align: 'center' });
    return { in: pins, out: { x: x + w, y: y }, inX: x + (type === 'OR' || type === 'NOR' || type === 'XOR' ? body * 0.12 : 0) };
  }

  SimLab.createSim({
    ariaLabel: 'A logic circuit with input switches, logic gate symbols and an output lamp, next to its truth table with the current row highlighted',
    transport: false,
    mobileAspect: '3 / 4.5',
    params: [
      { id: 'mode', label: 'Circuit', type: 'select', value: 'one', options: [{ value: 'one', label: 'One gate' }, { value: 'two', label: 'Two gates: first gate, then with C' }] },
      { id: 'gate1', label: 'Gate (first gate)', type: 'select', value: 'AND', options: Object.keys(G).map(function (k) { return { value: k, label: k }; }) },
      { id: 'gate2', label: 'Second gate (two-gate circuit)', type: 'select', value: 'AND', options: TWO.map(function (k) { return { value: k, label: k }; }) },
      { id: 'a', label: 'Input A', type: 'toggle', value: false },
      { id: 'b', label: 'Input B', type: 'toggle', value: false },
      { id: 'c', label: 'Input C (two-gate circuit)', type: 'toggle', value: false }
    ],
    buttons: [
      { label: 'Staircase light (XOR)', onClick: function (sim) { sim.setParam('mode', 'one'); sim.setParam('gate1', 'XOR'); } },
      { label: 'Burglar alarm: (door OR window) AND armed', onClick: function (sim) { sim.setParam('mode', 'two'); sim.setParam('gate1', 'OR'); sim.setParam('gate2', 'AND'); } }
    ],
    readouts: [
      { id: 'in', label: 'Inputs' },
      { id: 'y', label: 'Output Y', key: true },
      { id: 'ex', label: 'Boolean expression', key: true }
    ],
    onParam: function () { return true; },
    reset: function () {},
    readout: function (sim) {
      var p = sim.p, r = evalC(p, +p.a, +p.b, +p.c);
      return { in: vars(p).map(function (v) { return v + ' = ' + (+p[v.toLowerCase()]); }).join(', '), y: r.y ? '1 (lamp ON)' : '0 (lamp OFF)', ex: expr(p) };
    },
    status: function (sim) { var p = sim.p; return 'Y = ' + evalC(p, +p.a, +p.b, +p.c).y; },
    pointer: {
      down: function (sim, x, y) {
        var g = geo(sim), p = sim.p, hit = null;
        Object.keys(g.inputs).forEach(function (k) {
          if (x >= g.swX - 4 && x <= g.swX + g.sw.w + 4 && Math.abs(y - g.inputs[k]) <= g.sw.h / 2 + 4) hit = k.toLowerCase();
        });
        if (hit) { sim.setParam(hit, !p[hit], true); return false; }
        var vs = vars(p), row = tableRowAt(g.L.tab, p, x, y);
        if (row >= 0) {
          vs.forEach(function (v, i) { sim.setParam(v.toLowerCase(), !!((row >> (vs.length - 1 - i)) & 1), true); });
        }
        return false;
      },
      hover: function (sim, x, y) {
        var g = geo(sim), over = tableRowAt(g.L.tab, sim.p, x, y) >= 0;
        Object.keys(g.inputs).forEach(function (k) { if (x >= g.swX && x <= g.swX + g.sw.w && Math.abs(y - g.inputs[k]) <= g.sw.h / 2) over = true; });
        return over;
      }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, g = geo(sim), L = g.L, C = L.cir, T = L.tab, narrow = L.narrow;
      var A = +p.a, B = +p.b, Cc = +p.c, r = evalC(p, A, B, Cc), val = { A: A, B: B, C: Cc };
      var on = c.success, off = D.alpha(c.ink, 0.35);
      D.clear(ctx, W, H, c.bg);

      var rule = p.mode === 'two' ? 'Two gates: the first output X feeds the second gate with C' : G[p.gate1].rule;
      var hs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 8.5 && ctx.measureText(rule).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, rule, W / 2, 16, { color: c.bg, bg: c.s1, size: hs, weight: 700, align: 'center', pad: 5, fit: W });
      D.roundRect(ctx, C.x, C.y, C.w, C.h, 10, D.alpha(c.ink, 0.03), c.border, 1);

      function wire(x0, y0, x1, y1, v, mx) {
        mx = mx == null ? (x0 + x1) / 2 : mx;
        ctx.save(); ctx.strokeStyle = v ? on : off; ctx.lineWidth = v ? 4 : 2.5; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(mx, y0); ctx.lineTo(mx, y1); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
      }
      function bitTag(x, y, v) { D.text(ctx, String(v), x, y - 10, { color: v ? on : c.muted, size: 11, weight: 700, align: 'center' }); }

      // gates are drawn after the wires so the wire ends tuck under them
      var gfill = c.surface2, gstroke = c.ink, swR = g.swX + g.sw.w;
      var g1pins = p.gate1 === 'NOT' ? [g.g1.y] : [g.g1.y - g.gh / 4, g.g1.y + g.gh / 4];
      var g1inX = g.g1.x + (/OR/.test(p.gate1) ? g.gw * 0.1 : 0) + 4;
      wire(swR, g.inputs.A, g1inX, g1pins[0], A, swR + (g.g1.x - swR) * 0.55);
      if (p.gate1 !== 'NOT') wire(swR, g.inputs.B, g1inX, g1pins[1], B, swR + (g.g1.x - swR) * 0.4);
      var outX = g.g1.x + g.gw;
      if (p.mode === 'two') {
        var g2pins = [g.g2.y - g.gh / 4, g.g2.y + g.gh / 4], g2inX = g.g2.x + (/OR/.test(p.gate2) ? g.gw * 0.1 : 0) + 4;
        wire(outX, g.g1.y, g2inX, g2pins[0], r.x, outX + (g.g2.x - outX) * 0.5);
        wire(swR, g.inputs.C, g2inX, g2pins[1], Cc, g.g2.x - 16);
        wire(g.g2.x + g.gw, g.g2.y, g.lamp.x - g.lamp.r, g.lamp.y, r.y);
        bitTag(outX + (g.g2.x - outX) * 0.25, g.g1.y, r.x);
        D.text(ctx, 'X', outX + (g.g2.x - outX) * 0.25, g.g1.y + 12, { color: c.muted, size: 11, weight: 700, align: 'center' });
        bitTag((g.g2.x + g.gw + g.lamp.x - g.lamp.r) / 2, g.g2.y, r.y);
      } else {
        wire(outX, g.g1.y, g.lamp.x - g.lamp.r, g.lamp.y, r.y);
        bitTag((outX + g.lamp.x - g.lamp.r) / 2, g.g1.y, r.y);
      }
      gate(ctx, p.gate1, g.g1.x, g.g1.y, g.gw, g.gh, gfill, gstroke);
      if (p.mode === 'two') gate(ctx, p.gate2, g.g2.x, g.g2.y, g.gw, g.gh, gfill, gstroke);

      // switches
      Object.keys(g.inputs).forEach(function (k) {
        var v = val[k], y = g.inputs[k], x = g.swX;
        D.roundRect(ctx, x, y - g.sw.h / 2, g.sw.w, g.sw.h, 10, v ? D.alpha('#4ade80', 0.2) : c.surface2, v ? on : c.border, 2);
        D.text(ctx, k, x + 12, y, { color: c.ink, size: 14, weight: 700 });
        D.text(ctx, v ? '1' : '0', x + g.sw.w - 12, y - 7, { color: v ? on : c.muted, size: 14, weight: 700, align: 'right' });
        D.text(ctx, v ? 'ON' : 'OFF', x + g.sw.w - 12, y + 10, { color: v ? on : c.muted, size: 9, weight: 700, align: 'right' });
      });
      if (p.mode === 'two' && p.gate1 === 'NOT') D.text(ctx, '(B not used by NOT)', g.swX, C.y + C.h - (narrow ? 32 : 38), { color: c.muted, size: 10 });

      // lamp
      var lp = g.lamp;
      if (r.y) D.circle(ctx, lp.x, lp.y, lp.r * 1.9, D.alpha('#fde68a', 0.25));
      D.circle(ctx, lp.x, lp.y, lp.r, r.y ? '#fde047' : D.alpha(c.ink, 0.1), r.y ? '#f59e0b' : c.border, 2.5);
      D.text(ctx, 'Y = ' + r.y, lp.x, lp.y + lp.r + 14, { color: r.y ? c.warning : c.muted, size: 12, weight: 700, align: 'center', fit: C.x + C.w });

      // expression and example under the circuit
      var ex = expr(p), eg = p.mode === 'two' ? (p.gate1 === 'OR' && p.gate2 === 'AND' ? 'Burglar alarm: rings if (door OR window) is opened AND the alarm is armed (C).' : 'Tap the switches, or tap a row of the truth table.') : G[p.gate1].eg;
      var ey = C.y + C.h - (narrow ? 26 : 30), fs = narrow ? 12 : 13;
      ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif';
      while (fs > 9 && ctx.measureText(ex).width > C.w - 20) { fs -= 0.5; ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, ex, C.x + 10, ey, { color: c.s2, size: fs, weight: 700 });
      var es = narrow ? 10 : 11;
      ctx.font = '500 ' + es + 'px Inter, system-ui, sans-serif';
      while (es > 8 && ctx.measureText(eg).width > C.w - 20) { es -= 0.5; ctx.font = '500 ' + es + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, eg, C.x + 10, ey + 17, { color: c.muted, size: es });

      // truth table
      var t = tableGeo(T, p), vs = t.vs, cols = t.cols, n = t.n, rh = t.rh, cw = t.cw, tx = t.tx, y0 = t.y0;
      var curRow = 0; vs.forEach(function (v) { curRow = curRow * 2 + val[v]; });
      var mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';
      function colColor(h, v) { return h === 'Y' ? (v ? c.warning : c.muted) : h === 'X' ? c.s3 : c.ink; }
      D.roundRect(ctx, T.x, T.y, T.w, t.h, 10, c.surface2, c.border, 1);
      D.text(ctx, t.side ? 'Truth table · tap a column' : 'Truth table · tap a row', T.x + 10, T.y + 14, { color: c.ink, size: 12, weight: 700 });
      if (t.side) {
        cols.forEach(function (h, i) {
          D.text(ctx, h, tx + t.lw / 2, y0 + rh * (i + 0.5), { color: h === 'Y' ? c.warning : h === 'X' ? c.s3 : c.muted, size: 12, weight: 700, align: 'center' });
        });
        D.line(ctx, tx + t.lw - 4, y0, tx + t.lw - 4, y0 + rh * cols.length, c.border, 1);
        for (var k = 0; k < n; k++) {
          var kb = {}, cx = tx + t.lw + cw * (k + 0.5);
          vs.forEach(function (v, i) { kb[v] = (k >> (vs.length - 1 - i)) & 1; });
          var kr = evalC(p, kb.A, kb.B || 0, kb.C || 0);
          if (k === curRow) D.roundRect(ctx, cx - cw / 2 + 2, y0 - 2, cw - 4, rh * cols.length + 4, 6, D.alpha('#fbbf24', 0.2), c.warning, 1.5);
          cols.forEach(function (h, i) {
            var v = h === 'Y' ? kr.y : h === 'X' ? kr.x : kb[h];
            D.text(ctx, String(v), cx, y0 + rh * (i + 0.5), { color: colColor(h, v), size: Math.min(14, rh * 0.62), weight: h === 'Y' ? 700 : 500, align: 'center', font: mono });
          });
        }
      } else {
        cols.forEach(function (h, i) {
          D.text(ctx, h, tx + cw * (i + 0.5), T.y + 40, { color: h === 'Y' ? c.warning : h === 'X' ? c.s3 : c.muted, size: 12, weight: 700, align: 'center' });
        });
        D.line(ctx, T.x + 8, T.y + 52, T.x + T.w - 8, T.y + 52, c.border, 1);
        for (var row = 0; row < n; row++) {
          var bits = {}, yy = y0 + rh * row + rh / 2;
          vs.forEach(function (v, i) { bits[v] = (row >> (vs.length - 1 - i)) & 1; });
          var rr = evalC(p, bits.A, bits.B || 0, bits.C || 0);
          if (row === curRow) D.roundRect(ctx, T.x + 6, y0 + rh * row + 1, T.w - 12, rh - 2, 6, D.alpha('#fbbf24', 0.2), c.warning, 1.5);
          cols.forEach(function (h, i) {
            var v = h === 'Y' ? rr.y : h === 'X' ? rr.x : bits[h];
            D.text(ctx, String(v), tx + cw * (i + 0.5), yy, { color: colColor(h, v), size: Math.min(14, rh * 0.6), weight: h === 'Y' ? 700 : 500, align: 'center', font: mono });
          });
        }
      }
    }
  });
})();
