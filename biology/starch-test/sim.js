/* =====================================================================
   Nutrition in plants · Starch Test on a Leaf — sim.js
   ---------------------------------------------------------------------
   A step-by-step activity (no Play button). Set up the leaf, then press
   "Next step" through the school procedure:
     0 leaf on the plant in sunlight for N hours
     1 pick the leaf (remove the paper / bag)
     2 boil in water ~2 min (kills and softens the cells)
     3 warm in alcohol in a water bath (dissolves the chlorophyll)
     4 rinse in warm water and spread on a dish
     5 add dilute iodine solution: starch → blue-black, no starch →
       stays the yellow-brown colour of iodine
   Starch in a part of the leaf (0..1):
     left over from before = 0 if the plant was kept in the dark for two
       days first (destarched), else 0.85 (green parts only)
     made today = min(1, hours / 4) if that part had light AND
       chlorophyll AND carbon dioxide, else 0
     starch = min(1, left over + made today)
   Leaf set-ups: green leaf with a black paper strip; variegated leaf
   (white edges have no chlorophyll); two leaves in sealed bags, one
   with potassium hydroxide (absorbs CO₂) and one without (control).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var STEPS = [
    { t: 'Leaf on the plant in sunlight', n: 'Light falls on the leaf for the hours you chose.' },
    { t: 'Pick the leaf', n: 'Take off the paper or the bag.' },
    { t: 'Boil it in water for 2 minutes', n: 'Boiling kills the cells and softens the leaf.' },
    { t: 'Warm it in alcohol in a water bath', n: 'Alcohol dissolves the green chlorophyll. Never heat alcohol over a flame.' },
    { t: 'Rinse it in warm water', n: 'Rinsing softens the brittle leaf; spread it on a white dish.' },
    { t: 'Add iodine solution', n: 'Iodine turns blue-black where there is starch.' }
  ];
  var GREEN = '#22c55e', PALE = '#f2ecc9', WHITE = '#eef2e6', BROWN = '#c27a1a', BLACK = '#1e1b4b';

  function starch(p, region) {
    if (region === 'white') return 0;
    var left = p.dark ? 0 : 0.85, made = Math.min(1, p.hours / 4);
    if (region === 'covered' || region === 'koh') made = 0;
    return Math.min(1, left + made);
  }
  function words(v) { return v < 0.08 ? 'no starch' : v < 0.45 ? 'a little starch' : 'lots of starch'; }
  function mix(a, b, f) {
    var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    var r = Math.round(((A >> 16) & 255) * (1 - f) + ((B >> 16) & 255) * f), g = Math.round(((A >> 8) & 255) * (1 - f) + ((B >> 8) & 255) * f), bl = Math.round((A & 255) * (1 - f) + (B & 255) * f);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }
  function regions(p) {
    if (p.leaf === 'varieg') return [['white', 'green']];
    if (p.leaf === 'bag') return [['koh'], ['ctl']];
    return [['exposed', 'covered']];
  }
  function prog(s) { return M.clamp((performance.now() - s.t0) / 2200, 0, 1); }
  // colour of one region at the current step
  function colourOf(p, s, region) {
    var hasChl = region !== 'white', st = s.step, base = hasChl ? GREEN : WHITE;
    if (st <= 1) return base;
    if (st === 2) return hasChl ? '#16a34a' : WHITE;
    if (st === 3) return hasChl ? mix('#16a34a', PALE, prog(s)) : mix(WHITE, PALE, prog(s));
    if (st === 4) return PALE;
    var v = starch(p, region), f = prog(s);
    return mix(PALE, mix(BROWN, BLACK, Math.pow(v, 0.8)), f);
  }

  function leafPath(ctx, cx, cy, L, Wd) {
    ctx.beginPath();
    ctx.moveTo(cx - L / 2, cy);
    ctx.bezierCurveTo(cx - L * 0.3, cy - Wd * 0.62, cx + L * 0.2, cy - Wd * 0.6, cx + L / 2, cy);
    ctx.bezierCurveTo(cx + L * 0.2, cy + Wd * 0.6, cx - L * 0.3, cy + Wd * 0.62, cx - L / 2, cy);
    ctx.closePath();
  }
  function drawLeaf(ctx, c, p, s, cx, cy, L, Wd, regs) {
    // stalk
    D.line(ctx, cx - L / 2 - L * 0.12, cy + 3, cx - L / 2 + 2, cy, s.step >= 5 ? colourOf(p, s, regs[regs.length - 1]) : '#15803d', 3);
    ctx.save();
    leafPath(ctx, cx, cy, L, Wd); ctx.fillStyle = colourOf(p, s, regs[0]); ctx.fill();
    ctx.clip();
    if (regs[0] === 'white') { // green middle of a variegated leaf
      leafPath(ctx, cx - L * 0.04, cy, L * 0.7, Wd * 0.58);
      ctx.fillStyle = colourOf(p, s, 'green'); ctx.fill();
    } else if (regs[1] === 'covered') { // the strip that was under the paper
      ctx.fillStyle = colourOf(p, s, 'covered'); ctx.fillRect(cx - L * 0.08, cy - Wd, L * 0.22, Wd * 2);
    }
    ctx.restore();
    // veins
    ctx.save(); leafPath(ctx, cx, cy, L, Wd); ctx.clip();
    var vc = D.alpha(s.step >= 3 ? '#a8a29e' : '#14532d', 0.55);
    D.line(ctx, cx - L / 2, cy, cx + L / 2, cy, vc, 2);
    for (var k = 1; k <= 4; k++) {
      var x = cx - L / 2 + L * k / 5.2;
      D.line(ctx, x, cy, x + L * 0.12, cy - Wd * 0.4, vc, 1.2); D.line(ctx, x, cy, x + L * 0.12, cy + Wd * 0.4, vc, 1.2);
    }
    ctx.restore();
    leafPath(ctx, cx, cy, L, Wd); ctx.strokeStyle = D.alpha(c.ink, 0.5); ctx.lineWidth = 1.2; ctx.stroke();
  }

  SimLab.createSim({
    ariaLabel: 'A leaf is set up in sunlight, then boiled, decolourised in alcohol and tested with iodine; blue-black areas show where starch was made',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'leaf', label: 'Leaf set-up', type: 'select', value: 'cover', options: [
        { value: 'cover', label: 'Green leaf, part covered with black paper' },
        { value: 'varieg', label: 'Variegated leaf (white edges)' },
        { value: 'bag', label: 'Two leaves in bags: with and without KOH' }] },
      { id: 'dark', label: 'Plant kept in the dark for 2 days first (destarched)', type: 'toggle', value: true },
      { id: 'hours', label: 'Time in sunlight', min: 0, max: 8, step: 1, value: 4, unit: 'h',
        presets: [{ label: '0 h', value: 0 }, { label: '2 h', value: 2 }, { label: '4 h', value: 4 }, { label: '8 h', value: 8 }] }
    ],
    buttonsTitle: 'Steps',
    buttons: [
      { label: 'Next step ▶', primary: true, onClick: function (sim) { var s = sim.state; if (s.step < 5) { s.step++; s.t0 = performance.now(); } } },
      { label: '↺ Start again', onClick: function (sim) { sim.state.step = 0; sim.state.t0 = performance.now(); } }
    ],
    readouts: [
      { id: 'step', label: 'Step', key: true },
      { id: 'res', label: 'Iodine result', short: 'Result', key: true },
      { id: 'a', label: 'Part A' },
      { id: 'b', label: 'Part B' }
    ],

    reset: function (sim) { sim.state = { step: 0, t0: 0 }; },
    onParam: function (sim) { sim.state.step = 0; sim.state.t0 = performance.now(); return false; },
    animate: function (sim) { var s = sim.state; return s.step === 2 || performance.now() - s.t0 < 2400; },
    status: function (sim) { var s = sim.state; return 'Step ' + (s.step + 1) + ' of 6 · ' + STEPS[s.step].t; },
    readout: function (sim) {
      var p = sim.p, s = sim.state;
      var names = p.leaf === 'varieg' ? [['white edges', 'white', 'white edges'], ['green middle', 'green', 'green part']] : p.leaf === 'bag' ? [['bag with KOH', 'koh', 'KOH leaf'], ['bag without KOH', 'ctl', 'control']] : [['part in light', 'exposed', 'lit part'], ['covered strip', 'covered', 'covered strip']];
      var done = s.step === 5;
      function one(q) { return q[0] + ': ' + (done ? words(starch(p, q[1])) : 'test not done'); }
      var sa = starch(p, names[0][1]) > 0.08, sb = starch(p, names[1][1]) > 0.08;
      var res = !done ? 'not tested yet' : sa && sb ? 'all blue-black' : !sa && !sb ? 'no blue-black' : 'starch: ' + names[sa ? 0 : 1][2];
      return { step: (s.step + 1) + ' of 6', res: res, a: one(names[0]), b: one(names[1]) };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, st = s.step;
      var nar = W < 560, now = performance.now(), fs = nar ? 11 : 13;
      D.clear(ctx, W, H, c.bg);
      // step header and progress dots
      D.text(ctx, 'Step ' + (st + 1) + ' of 6: ' + STEPS[st].t, W / 2, 16, { color: c.ink, size: nar ? 13 : 16, weight: 700, align: 'center', fit: W });
      D.text(ctx, STEPS[st].n, W / 2, nar ? 34 : 38, { color: c.muted, size: nar ? 10.5 : 12, align: 'center', fit: W });
      for (var k = 0; k < 6; k++) D.circle(ctx, W / 2 + (k - 2.5) * 16, nar ? 50 : 56, 4.5, k <= st ? c.accent : null, c.muted, 1.2);
      var top = nar ? 62 : 72, bot = 26, sh = H - top - bot, cy = top + sh * 0.5;
      var regs = regions(p), two = regs.length === 2;
      var L = Math.min(W * (two ? 0.33 : 0.56), sh * (two ? 0.85 : 1.1)), Wd = L * 0.55;
      var xs = two ? [W * 0.28, W * 0.72] : [W / 2];

      if (st === 0) { // sunlight set-up on the plant
        var hrs = p.hours, sx = W - (nar ? 26 : 50), sy = top + 18;
        if (hrs > 0) {
          D.circle(ctx, sx, sy, 13, '#facc15');
          for (var a = 0; a < 8; a++) { var an = a * Math.PI / 4; D.line(ctx, sx + Math.cos(an) * 17, sy + Math.sin(an) * 17, sx + Math.cos(an) * 23, sy + Math.sin(an) * 23, '#facc15', 2); }
        }
        D.text(ctx, '☀ ' + hrs + ' h in sunlight', 10, top + 10, { color: c.ink, size: fs, weight: 700, fit: W });
        D.text(ctx, p.dark ? 'after 2 days in the dark' : 'not destarched', 10, top + 28, { color: p.dark ? c.muted : c.warning, size: nar ? 10 : 11.5, weight: 600, fit: W });
        regs.forEach(function (r, i) {
          var x = xs[i], stx = x - L / 2 - L * 0.12;
          D.line(ctx, stx, H - 4, stx, cy + 3, '#15803d', 4); // stem of the plant
          drawLeaf(ctx, c, p, s, x, cy, L, Wd, r);
          if (r[1] === 'covered') { // black paper strip clipped on both faces
            D.roundRect(ctx, x - L * 0.08, cy - Wd * 0.62, L * 0.22, Wd * 1.24, 3, '#111827', c.ink, 1);
            D.text(ctx, 'black paper', x + L * 0.03, cy - Wd * 0.62 - 10, { color: c.muted, size: nar ? 10 : 11, align: 'center', fit: W });
          }
          if (r[0] === 'koh' || r[0] === 'ctl') {
            D.roundRect(ctx, x - L * 0.66, cy - Wd * 0.85, L * 1.22, Wd * 1.75, 10, D.alpha('#93c5fd', 0.12), D.alpha(c.ink, 0.6), 1.5);
            if (r[0] === 'koh') { D.roundRect(ctx, x - L * 0.25, cy + Wd * 0.55, L * 0.5, Wd * 0.18, 3, '#e5e7eb', c.ink, 1); }
            D.text(ctx, r[0] === 'koh' ? 'KOH: no CO₂' : 'no KOH (control)', x, cy - Wd * 0.85 - 10, { color: c.ink, size: nar ? 10.5 : 12, weight: 600, align: 'center', fit: W });
          }
        });
      } else if (st === 2 || st === 3) { // beaker (water / alcohol in a water bath)
        var bw = Math.min(W * 0.8, sh * 1.5), bh = sh * 0.88, bx = (W - bw) / 2, by = top + sh * 0.08;
        var wl = by + bh * 0.15;
        ctx.fillStyle = D.alpha('#38bdf8', 0.18); ctx.fillRect(bx, wl, bw, by + bh - wl);
        if (st === 3) { // inner tube of alcohol turning green
          var iw = bw * 0.62, ix = (W - iw) / 2, iy = by + bh * 0.08;
          ctx.fillStyle = mix('#e0f2fe', '#4ade80', prog(s) * 0.8); ctx.globalAlpha = 0.55; ctx.fillRect(ix, wl + 8, iw, by + bh - 6 - wl - 8); ctx.globalAlpha = 1;
          ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.strokeRect(ix, iy, iw, by + bh - 6 - iy);
          D.text(ctx, 'alcohol', ix + iw - 6, wl + 20, { color: c.ink, size: nar ? 10 : 11.5, weight: 600, align: 'right' });
        }
        ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by); ctx.stroke(); ctx.restore();
        for (var b = 0; b < 14; b++) { // bubbles of boiling water
          var ph = ((now / 1400) + b * 0.137) % 1, x = bx + bw * (0.06 + ((b * 0.37) % 0.88));
          if (st === 3 && x > (W - bw * 0.62) / 2 - 3 && x < (W + bw * 0.62) / 2 + 3) continue;
          D.circle(ctx, x, by + bh - 6 - ph * (by + bh - 6 - wl), 2 + (b % 3), null, D.alpha(c.ink, 0.5), 1);
        }
        var Ls = st === 3 ? Math.min(L, bw * 0.5) : Math.min(L, bw * 0.8);
        regs.forEach(function (r, i) {
          var n = regs.length, x = W / 2 + (n === 2 ? (i ? 1 : -1) * Ls * 0.32 : 0);
          drawLeaf(ctx, c, p, s, x, wl + (by + bh - wl) * (0.45 + 0.15 * i), Ls * (n === 2 ? 0.6 : 1), Ls * (n === 2 ? 0.6 : 1) * 0.55, r);
        });
        // flame or hot plate under the beaker
        D.roundRect(ctx, W / 2 - bw * 0.3, by + bh + 4, bw * 0.6, 8, 3, '#ef4444');
      } else { // leaf on the plant (1) or on a white dish (4, 5)
        if (st >= 4) {
          var dr = Math.min(W * 0.46, sh * 0.6);
          ctx.save(); ctx.beginPath(); ctx.ellipse(W / 2, cy, Math.min(W * 0.47, dr * 1.55), Math.min(dr * 0.95, sh * 0.5), 0, 0, Math.PI * 2);
          ctx.fillStyle = c.light ? '#ffffff' : '#e5e7eb'; ctx.fill(); ctx.strokeStyle = D.alpha(c.ink, 0.4); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        }
        regs.forEach(function (r, i) { drawLeaf(ctx, c, p, s, xs[i], cy, L * (st >= 4 ? 0.95 : 1), Wd * (st >= 4 ? 0.95 : 1), r); });
        if (st === 5) {
          var f = prog(s);
          if (f < 1) for (var d = 0; d < 4; d++) D.circle(ctx, W / 2 + (d - 1.5) * 18, top + 6 + f * (cy - top - 6) * ((d % 2) ? 0.9 : 1), 4, BROWN);
          var labs = p.leaf === 'varieg' ? null : p.leaf === 'bag' ? ['with KOH', 'control'] : null;
          if (labs) labs.forEach(function (t, i) { D.text(ctx, t, xs[i], cy + Wd * 0.62 + 14, { color: c.ink, size: nar ? 10.5 : 12, weight: 600, align: 'center', fit: W }); });
        }
      }
      // result banner
      if (st === 5 && prog(s) >= 1) {
        var msg;
        if (p.leaf === 'cover') msg = starch(p, 'covered') > 0.08 ? 'The covered strip is blue-black too: old starch was still there' : starch(p, 'exposed') > 0.08 ? 'Starch only where light fell: light is needed' : 'No starch anywhere: no time in sunlight';
        else if (p.leaf === 'varieg') msg = starch(p, 'green') > 0.08 ? 'Starch only in the green part: chlorophyll is needed' : 'No starch anywhere yet';
        else msg = starch(p, 'koh') > 0.08 ? 'Both leaves blue-black: old starch was still there' : starch(p, 'ctl') > 0.08 ? 'No starch without CO₂: carbon dioxide is needed' : 'No starch in either leaf';
        D.text(ctx, msg, W / 2, H - 13, { color: c.ink, size: nar ? 10.5 : 12.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.92), pad: 5, fit: W });
      } else if (st === 0) {
        D.text(ctx, 'Press “Next step” to test the leaf', W / 2, H - 12, { color: c.muted, size: nar ? 10.5 : 12, align: 'center', fit: W });
      }
    }
  });
})();
