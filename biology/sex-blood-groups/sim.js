/* =====================================================================
   Biology · Principles of inheritance · Sex and Blood Groups — sim.js
   ---------------------------------------------------------------------
   Two separate Punnett squares for the same babies:
   1) Sex determination in humans (XX–XY system): every egg carries X;
      half the sperm carry X, half carry Y. X egg + X sperm → XX girl,
      X egg + Y sperm → XY boy, ½ each. The father's sperm decides.
   2) ABO blood groups: one gene I with three alleles Iᴬ, Iᴮ, i.
      Iᴬ and Iᴮ are codominant (IᴬIᴮ → group AB), both dominant over i.
      IᴬIᴬ, Iᴬi → A · IᴮIᴮ, Iᴮi → B · IᴬIᴮ → AB · ii → O.
      Each parent gives one of its two alleles, chance ½ each.
   Internally an allele is 'A', 'B' or 'O' (O stands for i).
   The Rh (+/−) factor is a separate gene and is left out.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GROUPS = ['A', 'B', 'AB', 'O'];
  var GCOL = { A: '#ef4444', B: '#3b82f6', AB: '#a855f7', O: '#f59e0b' };
  var GIRL = '#e879f9', BOY = '#2dd4bf';
  var nTarget = 40;

  function group(g) { var a = g.indexOf('A') >= 0, b = g.indexOf('B') >= 0; return a && b ? 'AB' : a ? 'A' : b ? 'B' : 'O'; }
  function sortG(x, y) { var o = 'ABO'; return o.indexOf(x) <= o.indexOf(y) ? x + y : y + x; }
  function name(g) { return g.split('').map(function (a) { return a === 'O' ? 'i' : 'I' + (a === 'A' ? 'ᴬ' : 'ᴮ'); }).join(''); }
  function opts() {
    return ['AA', 'AO', 'BB', 'BO', 'AB', 'OO'].map(function (g) { return { value: g, label: name(g) + ' · group ' + group(g) }; });
  }
  function bloodProbs(sim) {
    var r = { A: 0, B: 0, AB: 0, O: 0 }, m = sim.p.mom, d = sim.p.dad;
    for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) r[group(m[i] + d[j])] += 0.25;
    return r;
  }
  function possible(sim) { var q = bloodProbs(sim); return GROUPS.filter(function (g) { return q[g] > 0; }); }
  function fracTxt(v) { return v === 1 ? 'all' : v === 0.5 ? '½' : v === 0.25 ? '¼' : v === 0.75 ? '¾' : '0'; }

  // Draws an allele name like Iᴬ with a real raised letter (works with any font).
  function allele(ctx, a, x, y, size, color, align) {
    ctx.save();
    var f = function (s, w) { return w + ' ' + s + 'px Inter, system-ui, sans-serif'; };
    ctx.font = f(size, 800); var wI = ctx.measureText(a === 'O' ? 'i' : 'I').width;
    ctx.font = f(size * 0.62, 800); var wS = a === 'O' ? 0 : ctx.measureText(a).width, w = wI + wS;
    var x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = f(size, 800); ctx.fillText(a === 'O' ? 'i' : 'I', x0, y);
    if (a !== 'O') { ctx.font = f(size * 0.62, 800); ctx.fillText(a, x0 + wI, y - size * 0.35); }
    ctx.restore();
    return w;
  }
  function genotype(ctx, g, x, y, size, color) {
    ctx.save(); ctx.font = '800 ' + size + 'px Inter, system-ui, sans-serif';
    var w1 = ctx.measureText(g[0] === 'O' ? 'i' : 'I').width + (g[0] === 'O' ? 0 : size * 0.45);
    var w2 = ctx.measureText(g[1] === 'O' ? 'i' : 'I').width + (g[1] === 'O' ? 0 : size * 0.45);
    ctx.restore();
    var x0 = x - (w1 + w2 + 1) / 2;
    allele(ctx, g[0], x0, y, size, color, 'left'); allele(ctx, g[1], x0 + w1 + 1, y, size, color, 'left');
  }
  function chip(ctx, x, y, r, col, drawFn) {
    D.circle(ctx, x, y, r, col.light ? '#fff7ed' : '#1e293b', col.light ? '#64748b' : '#94a3b8', 1.4);
    drawFn(x, y);
  }
  function drop(ctx, x, y, r, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(x, y - r * 1.5);
    ctx.bezierCurveTo(x + r * 0.5, y - r * 0.8, x + r, y - r * 0.3, x + r, y + r * 0.15);
    ctx.arc(x, y + r * 0.15, r, 0, Math.PI, false);
    ctx.bezierCurveTo(x - r, y - r * 0.3, x - r * 0.5, y - r * 0.8, x, y - r * 1.5);
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, sm = W < 560, m = sm ? 6 : 12, tall = H > W * 1.15;
    var L = { W: W, H: H, sm: sm, m: m };
    if (tall) {
      var th = H * 0.5;
      L.sq1 = { x: m, y: m, w: W / 2 - 1.5 * m, h: th - m };
      L.sq2 = { x: W / 2 + m / 2, y: m, w: W / 2 - 1.5 * m, h: th - m };
      L.field = { x: m, y: th + 20, w: W * 0.56 - 1.5 * m, h: H - th - 30 };
      L.bars = { x: W * 0.56 + m / 2, y: th + 8, w: W * 0.44 - 1.5 * m, h: H - th - 14 };
    } else {
      var cw = W * (sm ? 0.5 : 0.46);
      L.sq1 = { x: m, y: m, w: cw - 1.5 * m, h: H * 0.42 - m };
      L.sq2 = { x: m, y: H * 0.42 + m / 2, w: cw - 1.5 * m, h: H * 0.58 - 1.5 * m };
      L.field = { x: cw + m / 2, y: m + (sm ? 16 : 22), w: W - cw - 1.5 * m, h: H * 0.56 - (sm ? 22 : 30) };
      L.bars = { x: cw + m / 2, y: H * 0.56 + m, w: W - cw - 1.5 * m, h: H * 0.44 - 2 * m };
    }
    return L;
  }

  // A 2 × 2 Punnett square in box B. Returns nothing; cell(i, j, x, y, h) paints each box.
  function square(ctx, col, B, sm, title, sub, top, side, cell, foot) {
    var tH = sm ? 14 : 20, hdr = sm ? 22 : 30, fH = sm ? 14 : 20;
    D.text(ctx, title, B.x + B.w / 2, B.y + tH / 2, { color: col.text, size: sm ? 10 : 13, weight: 700, align: 'center', fit: B.x + B.w + 4 });
    var subH = sub ? (sm ? 12 : 16) : 0;
    if (sub) D.text(ctx, sub, B.x + B.w / 2, B.y + tH + subH / 2, { color: col.muted, size: sm ? 9 : 11, weight: 600, align: 'center', fit: B.x + B.w + 4 });
    var s = Math.max(40, Math.min(B.w - hdr - 4, B.h - tH - subH - hdr - fH - 4)), h = s / 2;
    var x0 = B.x + (B.w - s - hdr) / 2 + hdr, y0 = B.y + tH + subH + hdr + 2;
    var r = Math.min(hdr * 0.44, h * 0.3);
    for (var a = 0; a < 2; a++) {
      chip(ctx, x0 + h * (a + 0.5), y0 - hdr / 2, r, col, top(a, r));
      chip(ctx, x0 - hdr / 2, y0 + h * (a + 0.5), r, col, side(a, r));
    }
    D.text(ctx, '♀', x0 + s + 3, y0 - hdr / 2, { color: col.muted, size: sm ? 10 : 13, weight: 700 });
    D.text(ctx, '♂', x0 - hdr / 2, y0 + s + 2, { color: col.muted, size: sm ? 10 : 13, weight: 700, align: 'center', baseline: 'top' });
    for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) cell(i, j, x0 + h * i, y0 + h * j, h);
    D.text(ctx, foot, B.x + B.w / 2, y0 + s + fH / 2 + 3, { color: col.text, size: sm ? 9.5 : 12, weight: 700, align: 'center', fit: B.x + B.w + 4 });
  }

  function makeBaby(sim) {
    var st = sim.state, si = Math.random() < 0.5 ? 0 : 1, sj = Math.random() < 0.5 ? 0 : 1, bi = Math.random() < 0.5 ? 0 : 1, bj = Math.random() < 0.5 ? 0 : 1;
    var girl = sj === 0, g = sortG(sim.p.mom[bi], sim.p.dad[bj]), grp = group(g);
    st.kids.push({ girl: girl, grp: grp, t: performance.now() });
    st.sexCell[si * 2 + sj]++; st.bCell[bi * 2 + bj]++; st.lastS = si * 2 + sj; st.lastB = bi * 2 + bj;
    if (girl) st.girls++; else st.boys++;
    st.g[grp]++;
    if (sim.graph) sim.graph.push(st.kids.length, [st.girls / st.kids.length, 0.5]);
  }

  SimLab.createSim({
    ariaLabel: 'Inheritance of sex and ABO blood group: a Punnett square of X and Y chromosomes, a Punnett square of blood group alleles from the mother and father, a crowd of babies born one at a time, and bars comparing observed and expected shares',
    mobileAspect: '1 / 1',
    playLabel: 'Babies are born',
    params: [
      { id: 'mom', label: 'Mother’s blood group genes', type: 'select', value: 'AO', options: opts() },
      { id: 'dad', label: 'Father’s blood group genes', type: 'select', value: 'BO', options: opts() },
      { id: 'n', label: 'Number of babies', min: 4, max: 400, step: 1, value: 40,
        presets: [{ label: '4', value: 4 }, { label: '40', value: 40 }, { label: '400', value: 400 }] }
    ],
    buttonsTitle: 'Families',
    buttons: [
      { label: 'A × B (both carry i)', primary: true, onClick: function (sim) { sim.setParam('mom', 'AO'); sim.setParam('dad', 'BO'); sim.reset(); sim.play(); } },
      { label: 'AB × O', onClick: function (sim) { sim.setParam('mom', 'AB'); sim.setParam('dad', 'OO'); sim.reset(); sim.play(); } },
      { label: 'O × O', onClick: function (sim) { sim.setParam('mom', 'OO'); sim.setParam('dad', 'OO'); sim.reset(); sim.play(); } },
      { label: 'AB × AB', onClick: function (sim) { sim.setParam('mom', 'AB'); sim.setParam('dad', 'AB'); sim.reset(); sim.play(); } }
    ],
    readouts: [
      { id: 'girls', label: 'Girls (XX) : boys (XY)', key: true, short: 'Girls : boys' },
      { id: 'poss', label: 'Blood groups possible', key: true, short: 'Possible' },
      { id: 'groups', label: 'Born so far: A · B · AB · O', key: true, short: 'A·B·AB·O' },
      { id: 'exp', label: 'Expected blood groups' },
      { id: 'never', label: 'Blood groups impossible' },
      { id: 'parents', label: 'Parents look like' }
    ],
    graph: { title: 'Share of babies who are girls', xLabel: 'babies', yLabel: 'share', yMin: 0, yMax: 1,
      xMax: function () { return nTarget; }, series: [{ label: 'girls so far' }, { label: 'expected ½', color: '--sim-3' }] },

    reset: function (sim) {
      nTarget = sim.p.n;
      sim.state = { kids: [], sexCell: [0, 0, 0, 0], bCell: [0, 0, 0, 0], girls: 0, boys: 0, g: { A: 0, B: 0, AB: 0, O: 0 }, acc: 0, lastS: -1, lastB: -1 };
    },
    update: function (sim, dt) {
      var st = sim.state;
      st.acc += dt * M.clamp(sim.p.n / 8, 1.5, 60);
      while (st.acc >= 1 && st.kids.length < sim.p.n) { st.acc -= 1; makeBaby(sim); }
    },
    finished: function (sim) { return sim.state.kids.length >= sim.p.n; },
    animate: function (sim) { var k = sim.state.kids; return !reduce && k.length && performance.now() - k[k.length - 1].t < 400; },
    status: function (sim) {
      var n = sim.state.kids.length;
      return n >= sim.p.n ? 'Done: ' + n + ' babies. Press Restart for another set of families' : n ? 'Babies born: ' + n + ' of ' + sim.p.n : 'Press Babies are born to see ' + sim.p.n + ' children of this couple';
    },
    readout: function (sim) {
      var st = sim.state, q = bloodProbs(sim), never = GROUPS.filter(function (g) { return !q[g]; });
      return {
        girls: st.girls + ' : ' + st.boys,
        poss: possible(sim).join(', '),
        groups: st.g.A + ' · ' + st.g.B + ' · ' + st.g.AB + ' · ' + st.g.O,
        exp: possible(sim).map(function (g) { return g + ' ' + fracTxt(q[g]); }).join(' · '),
        never: never.length ? never.join(', ') : 'none',
        parents: 'mother ' + group(sim.p.mom) + ', father ' + group(sim.p.dad)
      };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, p = sim.p, st = sim.state, L = layout(sim), sm = L.sm;
      D.clear(ctx, L.W, L.H, col.bg);
      var lastK = st.kids.length ? st.kids[st.kids.length - 1] : null, flash = lastK && !reduce ? M.clamp(1 - (now - lastK.t) / 400, 0, 1) : 0;
      var running = st.kids.length && st.kids.length < p.n, show = flash > 0 || (reduce && running);
      function hiCell(on, x, y, h) { if (on && show) D.roundRect(ctx, x + 1.5, y + 1.5, h - 3, h - 3, 6, null, col.accent, 1 + 2 * (reduce ? 1 : flash)); }
      // ---- sex square
      var xs = ['X', 'X'], ys = ['X', 'Y'];
      square(ctx, col, L.sq1, sm, 'Boy or girl?', sm ? '♀ XX × ♂ XY' : 'Mother XX × father XY',
        function (a, r) { return function (x, y) { D.text(ctx, xs[a], x, y + 0.5, { color: col.text, size: Math.max(9, r * 1.1), weight: 800, align: 'center' }); }; },
        function (a, r) { return function (x, y) { D.text(ctx, ys[a], x, y + 0.5, { color: a ? BOY : col.text, size: Math.max(9, r * 1.1), weight: 800, align: 'center' }); }; },
        function (i, j, x, y, h) {
          var girl = j === 0, c = girl ? GIRL : BOY;
          D.roundRect(ctx, x + 1.5, y + 1.5, h - 3, h - 3, 6, D.alpha(c, col.light ? 0.18 : 0.14), col.border, 1);
          D.text(ctx, girl ? 'XX' : 'XY', x + h / 2, y + h * 0.38, { color: col.text, size: Math.max(10, Math.min(18, h * 0.24)), weight: 800, align: 'center' });
          D.text(ctx, girl ? '♀ girl' : '♂ boy', x + h / 2, y + h * 0.7, { color: c, size: Math.max(8, Math.min(13, h * 0.17)), weight: 700, align: 'center' });
          if (st.kids.length && h > 50) D.text(ctx, '×' + st.sexCell[i * 2 + j], x + h - 5, y + 10, { color: col.muted, size: sm ? 8.5 : 10, weight: 700, align: 'right' });
          hiCell(st.lastS === i * 2 + j, x, y, h);
        }, sm ? 'Sperm decides: ½ girls' : 'The sperm decides: ½ girls, ½ boys');
      // ---- blood group square
      var q = bloodProbs(sim);
      square(ctx, col, L.sq2, sm, 'Blood group', '♀ ' + name(p.mom) + ' (' + group(p.mom) + ') × ♂ ' + name(p.dad) + ' (' + group(p.dad) + ')',
        function (a, r) { return function (x, y) { allele(ctx, p.mom[a], x, y + 1, Math.max(9, r * 1.05), col.text); }; },
        function (a, r) { return function (x, y) { allele(ctx, p.dad[a], x, y + 1, Math.max(9, r * 1.05), col.text); }; },
        function (i, j, x, y, h) {
          var g = sortG(p.mom[i], p.dad[j]), grp = group(g);
          D.roundRect(ctx, x + 1.5, y + 1.5, h - 3, h - 3, 6, D.alpha(GCOL[grp], col.light ? 0.18 : 0.16), col.border, 1);
          genotype(ctx, g, x + h / 2, y + h * 0.4, Math.max(10, Math.min(17, h * 0.22)), col.text);
          D.text(ctx, grp, x + h / 2, y + h * 0.72, { color: GCOL[grp], size: Math.max(9, Math.min(15, h * 0.19)), weight: 800, align: 'center' });
          if (st.kids.length && h > 50) D.text(ctx, '×' + st.bCell[i * 2 + j], x + h - 5, y + 10, { color: col.muted, size: sm ? 8.5 : 10, weight: 700, align: 'right' });
          hiCell(st.lastB === i * 2 + j, x, y, h);
        }, possible(sim).map(function (g) { return g + ' ' + fracTxt(q[g]); }).join(' · '));
      // ---- babies
      var F = L.field, n = p.n, kids = st.kids;
      D.roundRect(ctx, F.x, F.y, F.w, F.h, 8, col.light ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)', col.border, 1);
      D.text(ctx, 'Babies: ' + kids.length + ' of ' + n, F.x + F.w / 2, F.y - (sm ? 8 : 11), { color: col.text, size: sm ? 10 : 13, weight: 700, align: 'center', fit: L.W });
      var ar = F.w / F.h, cols = Math.max(1, Math.ceil(Math.sqrt(n * ar))), rows = Math.ceil(n / cols);
      while ((rows - 1) * cols >= n) rows--;
      var cell = Math.min(F.w / cols, F.h / rows), gx = F.x + (F.w - cols * cell) / 2, gy = F.y + (F.h - rows * cell) / 2;
      for (var k = 0; k < n; k++) {
        var kx = gx + (k % cols + 0.5) * cell, ky = gy + (Math.floor(k / cols) + 0.5) * cell, kid = kids[k];
        if (!kid) { if (cell >= 5) D.circle(ctx, kx, ky, Math.max(0.8, cell * 0.07), col.faint); continue; }
        var sc = 0.5 + 0.5 * (reduce ? 1 : M.clamp((now - kid.t) / 300, 0, 1)), r = cell * 0.3 * sc;
        if (cell >= 14) {
          drop(ctx, kx, ky + r * 0.2, r, GCOL[kid.grp]);
          if (cell >= 22) D.text(ctx, kid.grp, kx, ky + r * 0.4, { color: '#fff', size: Math.max(7, r * (kid.grp === 'AB' ? 0.8 : 1.05)), weight: 800, align: 'center' });
          D.text(ctx, kid.girl ? '♀' : '♂', kx + cell * 0.32, ky - cell * 0.22, { color: kid.girl ? GIRL : BOY, size: Math.max(9, cell * 0.4), weight: 900, align: 'center', font: 'system-ui, sans-serif' });
        } else {
          D.circle(ctx, kx, ky, cell * 0.38 * sc, GCOL[kid.grp], kid.girl ? GIRL : BOY, Math.max(1, cell * 0.12));
        }
      }
      // ---- bars: observed share (bar) vs expected (tick)
      var B = L.bars, rows2 = 5, rh = B.h / rows2, lab = sm ? 34 : 56, bx = B.x + lab, bw = B.w - lab - (sm ? 30 : 40), tot = kids.length || 1;
      var items = [{ t: '♀ girls', v: st.girls / tot, e: 0.5, c: GIRL }].concat(GROUPS.map(function (g) { return { t: 'Group ' + g, s: g, v: st.g[g] / tot, e: q[g], c: GCOL[g] }; }));
      items.forEach(function (it, i) {
        var y = B.y + rh * (i + 0.5), bh = Math.min(rh * 0.56, 16);
        D.text(ctx, sm && it.s ? it.s : it.t, bx - 5, y, { color: it.e || i === 0 ? col.text : col.faint, size: sm ? 9.5 : 12, weight: 700, align: 'right' });
        D.roundRect(ctx, bx, y - bh / 2, bw, bh, 3, col.light ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.06)');
        if (kids.length) D.roundRect(ctx, bx, y - bh / 2, Math.max(2, bw * it.v), bh, 3, it.c);
        if (it.e > 0) D.line(ctx, bx + bw * it.e, y - bh / 2 - 3, bx + bw * it.e, y + bh / 2 + 3, col.text, 2);
        else D.text(ctx, sm ? 'never' : 'impossible', bx + 6, y, { color: col.faint, size: sm ? 8.5 : 11, weight: 600 });
        if (kids.length) D.text(ctx, Math.round(it.v * 100) + '%', bx + bw + 4, y, { color: col.muted, size: sm ? 9 : 11, weight: 700 });
      });
      if (!sm) D.text(ctx, '│ = expected share', B.x + B.w, B.y + B.h + 2, { color: col.faint, size: 10, align: 'right' });
    }
  });
})();
