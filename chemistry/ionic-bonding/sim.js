/* =====================================================================
   Chemistry · Ionic Bonds: Giving and Taking Electrons — sim.js
   ---------------------------------------------------------------------
   Two views, picked with "What to show":
   1) Electron transfer. Bohr-style atoms with their shells:
        Na 2,8,1  K 2,8,8,1  Mg 2,8,2  Ca 2,8,8,2  Al 2,8,3
        Cl 2,8,7  O 2,6
      Play moves the metal's outer electrons (shown as ×) one by one to
      the non-metal atoms (own electrons shown as dots) until every
      atom has a full outer shell (octet). Electrons are handed out
      greedily, so MgCl₂ sends one electron to each Cl and Al₂O₃ shares
      six electrons between three O. Then brackets and charges appear and
      the ions pull together. The strip at the bottom is the matching
      electron-dot (Lewis) picture.
   2) Property tests. A 2D ion lattice between two electrodes with a
      battery and bulb: solid (ions locked → no current), molten (Play
      heats it; above the melting point ions drift to the electrodes →
      bulb glows) and dissolved in water. Honest about solubility:
        NaCl, KCl, MgCl₂, CaCl₂ dissolve → bright
        Na₂O reacts → NaOH solution (Na⁺, OH⁻) → bright
        CaO reacts → Ca(OH)₂, only a little dissolves → dim
        MgO, Al₂O₃ hardly dissolve → off
      Sugar (covalent) is the comparison: molecules, no ions, never lights.
   Melting points (°C, rounded data-book values): NaCl 801, KCl 770,
   MgCl₂ 714, CaCl₂ 772, MgO 2852, CaO 2613, Na₂O 1132, Al₂O₃ 2072,
   sugar (sucrose) about 186 (it also starts to char).
   Ions drifting to an electrode are given up there (electrolysis) and a
   fresh ion re-enters from the far side, so the flow keeps going.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;

  var EL = {
    Na: { name: 'sodium', cfg: [2, 8, 1], metal: true },
    K: { name: 'potassium', cfg: [2, 8, 8, 1], metal: true },
    Mg: { name: 'magnesium', cfg: [2, 8, 2], metal: true },
    Ca: { name: 'calcium', cfg: [2, 8, 8, 2], metal: true },
    Al: { name: 'aluminium', cfg: [2, 8, 3], metal: true },
    Cl: { name: 'chlorine', ion: 'chloride', cfg: [2, 8, 7] },
    O: { name: 'oxygen', ion: 'oxide', cfg: [2, 6] }
  };
  // sol: yes | naoh | lime | no | mol (molecules)
  var CMP = {
    NaCl: { f: 'NaCl', m: 'Na', n: 'Cl', nm: 1, nn: 1, mp: 801, sol: 'yes', name: 'sodium chloride (common salt)' },
    KCl: { f: 'KCl', m: 'K', n: 'Cl', nm: 1, nn: 1, mp: 770, sol: 'yes', name: 'potassium chloride' },
    MgCl2: { f: 'MgCl₂', m: 'Mg', n: 'Cl', nm: 1, nn: 2, mp: 714, sol: 'yes', name: 'magnesium chloride' },
    CaCl2: { f: 'CaCl₂', m: 'Ca', n: 'Cl', nm: 1, nn: 2, mp: 772, sol: 'yes', name: 'calcium chloride' },
    MgO: { f: 'MgO', m: 'Mg', n: 'O', nm: 1, nn: 1, mp: 2852, sol: 'no', name: 'magnesium oxide' },
    CaO: { f: 'CaO', m: 'Ca', n: 'O', nm: 1, nn: 1, mp: 2613, sol: 'lime', name: 'calcium oxide (quicklime)' },
    Na2O: { f: 'Na₂O', m: 'Na', n: 'O', nm: 2, nn: 1, mp: 1132, sol: 'naoh', name: 'sodium oxide' },
    Al2O3: { f: 'Al₂O₃', m: 'Al', n: 'O', nm: 2, nn: 3, mp: 2072, sol: 'no', name: 'aluminium oxide' },
    sugar: { f: 'C₁₂H₂₂O₁₁', mp: 186, sol: 'mol', cov: true, name: 'sugar (sucrose), a covalent compound' }
  };
  var SUP = { 1: '', 2: '²', 3: '³' };
  var T_START = 0.8, T_E = 1.6, T_ION = 1.4, T_HEAT = 6;

  function charge(n, sign) { return (SUP[n] || '') + (sign > 0 ? '⁺' : '⁻'); }
  // plain characters for canvas labels (superscript glyphs draw too small)
  function chg2(n, sign) { return (n > 1 ? n : '') + (sign > 0 ? '+' : '−'); }
  function val(sym) { var c = EL[sym].cfg; return c[c.length - 1]; }
  function cfgText(a) { return a.join(','); }
  function cmp(sim) { return CMP[sim.p.cmp] || CMP.NaCl; }
  function reactivePair(c) { return !c.cov; }

  // ---------- electron-transfer model ----------
  function buildAtoms(c) {
    // order along the row: metals and non-metals alternate where possible
    var seq = [];
    if (c.nm === 1 && c.nn === 1) seq = ['m', 'n'];
    else if (c.nm === 1 && c.nn === 2) seq = ['n', 'm', 'n'];
    else if (c.nm === 2 && c.nn === 1) seq = ['m', 'n', 'm'];
    else seq = ['n', 'm', 'n', 'm', 'n'];
    var atoms = seq.map(function (k, i) {
      var sym = k === 'm' ? c.m : c.n;
      return { sym: sym, metal: k === 'm', idx: i, v: val(sym), give: [], get: [] };
    });
    // greedy hand-out of electrons: walk metals left to right, fill non-metals left to right
    var metals = atoms.filter(function (a) { return a.metal; }), nons = atoms.filter(function (a) { return !a.metal; });
    var transfers = [], ni = 0, need = nons.map(function (a) { return 8 - a.v; });
    metals.forEach(function (m) {
      for (var e = 0; e < m.v; e++) {
        while (ni < nons.length && need[ni] === 0) ni++;
        var to = nons[ni]; need[ni]--;
        transfers.push({ from: m, to: to, fe: e, slot: to.v + to.get.length });
        m.give.push(transfers.length - 1); to.get.push(transfers.length - 1);
      }
    });
    // donor direction: mirror a non-metal's slots so its empty places face its main donor
    nons.forEach(function (a) {
      var d = transfers[a.get[0]].from; a.mirror = d.idx > a.idx;
    });
    metals.forEach(function (m) { m.firstTo = transfers[m.give[0]].to; });
    return { atoms: atoms, transfers: transfers, end: T_START + transfers.length * T_E + T_ION };
  }
  function slotAngle(k, mirror) {
    var side = k % 4, mem = Math.floor(k / 4), a = [-Math.PI / 2, 0, Math.PI / 2, Math.PI][side] + (mem ? 0.3 : -0.3);
    return mirror ? Math.PI - a : a;
  }

  function layoutT(sim, A) {
    var W = sim.width, H = sim.height, small = W < 560, n = A.atoms.length;
    var top = small ? 34 : 40, strip = small ? 70 : 84, bot = H - strip;
    var R = Math.min((W - 16) / (n * 2.15), (bot - top) / 2.25, 120);
    var cy = top + (bot - top) / 2, gap = (W - n * 2 * R) / (n + 1);
    gap = Math.min(gap, R * 0.9);
    var total = n * 2 * R + (n - 1) * gap, x0 = (W - total) / 2 + R;
    var L = { W: W, H: H, small: small, R: R, cy: cy, bot: bot, stripY: bot + strip / 2 - 2, xs: A.atoms.map(function (a, i) { return x0 + i * (2 * R + gap); }) };
    L.ys = L.xs.map(function () { return cy; });
    if (n > 3 && R < 70) {
      // zigzag: non-metals high, metals low, so each atom can be bigger
      var room = bot - top - 8, best = R;
      for (var r = R; r < 110; r += 1) {
        var dx = (W - 16 - 2 * r) / (n - 1), dy = Math.sqrt(Math.max(0, Math.pow(2.3 * r, 2) - dx * dx));
        if (dx < r * 0.9 || 2 * r + dy > room || dx < shellR(r, 1) + r * 0.065 + 30) break; // brackets + charge of neighbouring anions must not touch
        best = r;
      }
      var dx2 = (W - 16 - 2 * best) / (n - 1), dy2 = Math.min(room - 2 * best, Math.max(Math.sqrt(Math.max(0, Math.pow(2.3 * best, 2) - dx2 * dx2)), best * 0.6));
      L.R = best;
      L.xs = A.atoms.map(function (a, i) { return 8 + best + i * dx2; });
      L.ys = A.atoms.map(function (a) { return cy + (a.metal ? 1 : -1) * dy2 / 2; });
    }
    return L;
  }
  function shellR(R, k) { return R * (0.34 + 0.66 * k / 3); } // k = 0..3 (max 4 shells)

  function atomPos(L, A, a, ion) {
    var cx = L.W / 2, x = L.xs[a.idx], y = L.ys[a.idx];
    return { x: x + (cx - x) * 0.1 * ion, y: y + (L.cy - y) * 0.1 * ion };
  }

  // where electron e of a transfer sits at time t
  function phase(t, A) {
    var k = (t - T_START) / T_E;
    return { k: k, ion: M.clamp((t - T_START - A.transfers.length * T_E) / T_ION, 0, 1) };
  }

  function drawTransfer(sim, now) {
    var ctx = sim.ctx, col = sim.colors, c = cmp(sim), st = sim.state, W = sim.width, H = sim.height;
    D.clear(ctx, W, H, col.bg);
    if (c.cov) {
      var fs = W < 560 ? 12 : 14;
      D.text(ctx, 'Sugar is a covalent compound', W / 2, H * 0.36, { color: col.text, size: fs + 3, weight: 700, align: 'center', fit: W });
      D.text(ctx, 'Its atoms share electrons. Nothing is given or taken,', W / 2, H * 0.36 + fs * 2, { color: col.muted, size: fs, align: 'center', fit: W });
      D.text(ctx, 'so no ions form.', W / 2, H * 0.36 + fs * 3.4, { color: col.muted, size: fs, align: 'center', fit: W });
      D.text(ctx, 'Pick a test below to compare it with salt.', W / 2, H * 0.36 + fs * 5.4, { color: col.accent, size: fs, weight: 600, align: 'center', fit: W });
      return;
    }
    var A = st.A, L = layoutT(sim, A), R = L.R, ph = phase(st.t, A), ionK = easeIO(ph.ion);
    var mCol = col.light ? '#6d28d9' : '#c4b5fd', mFill = '#a78bfa';
    var nCol = c.n === 'Cl' ? (col.light ? '#15803d' : '#86efac') : (col.light ? '#b91c1c' : '#fca5a5'), nFill = c.n === 'Cl' ? '#4ade80' : '#f87171';
    var ring = col.light ? 'rgba(15,23,42,0.28)' : 'rgba(226,232,240,0.3)', okRing = col.light ? '#16a34a' : '#4ade80';
    var er = Math.max(2.2, R * 0.065), fs = L.small ? 11 : 13;

    // heading
    var nDone = M.clamp(Math.floor(ph.k + 1e-9), 0, A.transfers.length);
    var head = ph.ion > 0 ? 'Ions form and attract: ' + c.f : nDone < A.transfers.length && ph.k >= 0 ? EL[c.m].name + ' gives an electron to ' + EL[c.n].name : 'Atoms of ' + EL[c.m].name + ' and ' + EL[c.n].name;
    if (st.t >= A.end) head = c.f + ': every ion has a full outer shell';
    D.text(ctx, head, W / 2, L.small ? 14 : 18, { color: col.bg, bg: col.s3, size: L.small ? 11.5 : 13, weight: 700, align: 'center', pad: 4, fit: W });

    // atoms
    A.atoms.forEach(function (a) {
      var p = atomPos(L, A, a, ionK), cfg = EL[a.sym].cfg, ns = cfg.length;
      var gone = 0;
      if (a.metal) a.give.forEach(function (ti) { if (ph.k >= ti + 1) gone++; });
      var lastShellFade = a.metal && gone === a.v ? M.clamp((ph.k - a.give[a.give.length - 1] - 1) / 0.35 + 1, 0, 1) : 0; // 0 visible → 1 faded
      if (a.metal && ph.ion > 0) lastShellFade = 1;
      for (var k = 0; k < ns; k++) {
        var r = shellR(R, k), outer = k === ns - 1;
        var alpha = a.metal && outer ? 1 - lastShellFade : 1;
        if (alpha <= 0.01) continue;
        var full = (!a.metal && outer && ph.ion > 0) || (a.metal && k === ns - 2 && ph.ion > 0);
        ctx.save(); ctx.globalAlpha = alpha;
        D.circle(ctx, p.x, p.y, r, null, ring, 1.2);
        ctx.restore();
        if (full) { ctx.save(); ctx.globalAlpha = ionK; D.circle(ctx, p.x, p.y, r, null, okRing, 2.4); ctx.restore(); }
        // inner-shell electrons (and the non-metal's own outer electrons)
        var nE = outer ? (a.metal ? 0 : a.v) : cfg[k];
        for (var e = 0; e < nE; e++) {
          var ang = outer ? slotAngle(e, a.mirror) : -Math.PI / 2 + e * 2 * Math.PI / nE;
          var ex = p.x + Math.cos(ang) * r, ey = p.y + Math.sin(ang) * r;
          if (outer) D.circle(ctx, ex, ey, er, a.metal ? mCol : nCol);
          else D.circle(ctx, ex, ey, er * 0.75, col.light ? '#64748b' : '#94a3b8');
        }
      }
      // nucleus
      var nr = R * 0.22;
      D.circle(ctx, p.x, p.y, nr, a.metal ? mFill : nFill);
      D.text(ctx, a.sym, p.x, p.y + 0.5, { color: '#0f172a', size: Math.max(10, nr * 0.95), weight: 800, align: 'center' });
      // brackets and charge
      if (ph.ion > 0) {
        ctx.save(); ctx.globalAlpha = ionK;
        var q = a.metal ? a.v : 8 - a.v, chg = chg2(q, a.metal ? 1 : -1);
        if (!a.metal) {
          var bx = shellR(R, ns - 1) + er + 4, bh = bx;
          ctx.strokeStyle = col.text; ctx.lineWidth = 1.6; ctx.beginPath();
          ctx.moveTo(p.x - bx + 5, p.y - bh); ctx.lineTo(p.x - bx, p.y - bh); ctx.lineTo(p.x - bx, p.y + bh); ctx.lineTo(p.x - bx + 5, p.y + bh);
          ctx.moveTo(p.x + bx - 5, p.y - bh); ctx.lineTo(p.x + bx, p.y - bh); ctx.lineTo(p.x + bx, p.y + bh); ctx.lineTo(p.x + bx - 5, p.y + bh);
          ctx.stroke();
          D.text(ctx, chg, p.x + bx + 2, p.y - bh + 4, { color: col.text, size: fs + 1, weight: 800 });
        } else {
          var rr = shellR(R, ns - 2);
          D.text(ctx, chg, p.x + rr * 0.72 + 3, p.y - rr * 0.92, { color: col.text, size: fs + 1, weight: 800 });
        }
        ctx.restore();
      }
    });

    // electrons from the metals: waiting, flying, or arrived (drawn as ×)
    A.transfers.forEach(function (tr, i) {
      var f = tr.from, to = tr.to, pf = atomPos(L, A, f, ionK), pt = atomPos(L, A, to, ionK);
      var rf = shellR(R, EL[f.sym].cfg.length - 1), rt = shellR(R, EL[to.sym].cfg.length - 1);
      var dir = Math.atan2(L.ys[f.firstTo.idx] - L.ys[f.idx], L.xs[f.firstTo.idx] - L.xs[f.idx]);
      var a0 = dir + tr.fe * 2 * Math.PI / f.v, a1 = slotAngle(tr.slot, to.mirror);
      var sx = pf.x + Math.cos(a0) * rf, sy = pf.y + Math.sin(a0) * rf, tx = pt.x + Math.cos(a1) * rt, ty = pt.y + Math.sin(a1) * rt;
      var u = M.clamp(ph.k - i, 0, 1), e = easeIO(u), x, y;
      var mx = (sx + tx) / 2, my = Math.min(sy, ty) - R * 0.9;
      x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * mx + e * e * tx;
      y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * my + e * e * ty;
      if (u > 0 && u < 1) { ctx.save(); ctx.globalAlpha = 0.35; D.circle(ctx, x, y, er * 2.4, mCol); ctx.restore(); }
      cross(ctx, x, y, er * 1.25, mCol, 2);
    });

    // Lewis (electron-dot) strip
    var lw = col.light ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.04)';
    D.roundRect(ctx, 6, L.bot + 6, W - 12, L.H - L.bot - 12, 8, lw);
    D.text(ctx, 'Electron-dot picture (× = from ' + c.m + ', • = ' + c.n + "'s own)", W / 2, L.bot + 16, { color: col.muted, size: L.small ? 9.5 : 11, align: 'center', fit: W });
    var done = st.t >= T_START + A.transfers.length * T_E;
    lewisRow(ctx, col, A, done, W, L.stripY + 8, L.small ? 15 : 19, mCol, nCol);
  }

  function cross(ctx, x, y, r, color, lw) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke(); ctx.restore();
  }
  function easeIO(u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }

  // one Lewis glyph: returns its width at font size s; draws if `draw`
  function glyph(ctx, col, a, ionic, s, x, y, draw, mCol, nCol) {
    ctx.save(); ctx.font = '800 ' + s + 'px Inter, system-ui, sans-serif';
    var w = ctx.measureText(a.sym).width, pad = s * 0.42, brk = !a.metal && ionic ? s * 0.42 : 0;
    var chg = ionic ? chg2(a.metal ? a.v : 8 - a.v, a.metal ? 1 : -1) : '';
    ctx.font = '800 ' + (s * 0.6) + 'px Inter, system-ui, sans-serif';
    var cw = chg ? ctx.measureText(chg).width + 2 : 0;
    var hasDots = !(a.metal && ionic), total = brk * 2 + (hasDots ? pad * 2 : 0) + w + cw;
    if (draw) {
      var left = x - total / 2, cx = left + brk + (hasDots ? pad : 0) + w / 2;
      D.text(ctx, a.sym, cx, y, { color: col.text, size: s, weight: 800, align: 'center' });
      if (hasDots) {
        var marks = [];
        if (a.metal) for (var e = 0; e < a.v; e++) marks.push({ k: e, x: true });
        else {
          for (var e2 = 0; e2 < a.v; e2++) marks.push({ k: e2, x: false });
          if (ionic) for (var g = 0; g < 8 - a.v; g++) marks.push({ k: a.v + g, x: true });
        }
        var bySide = [0, 0, 0, 0];
        marks.forEach(function (m) { bySide[m.k % 4]++; });
        marks.forEach(function (m) {
          var side = m.k % 4, mem = Math.floor(m.k / 4), off = bySide[side] === 1 ? 0 : (mem ? 1 : -1) * s * 0.2;
          if (a.mirror && (side === 1 || side === 3)) side = 4 - side;
          var px = side === 0 || side === 2 ? cx + off : cx + (side === 1 ? 1 : -1) * (w / 2 + s * 0.24);
          var py = side === 0 ? y - s * 0.66 : side === 2 ? y + s * 0.66 : y + off;
          if (m.x) cross(ctx, px, py, s * 0.09, mCol, 1.6); else D.circle(ctx, px, py, s * 0.085, nCol);
        });
      }
      if (brk) {
        var bl = left + brk * 0.5, br = left + total - cw - brk * 0.5, bh = s * 0.95;
        ctx.strokeStyle = col.text; ctx.lineWidth = 1.5; ctx.beginPath();
        ctx.moveTo(bl + 4, y - bh); ctx.lineTo(bl, y - bh); ctx.lineTo(bl, y + bh); ctx.lineTo(bl + 4, y + bh);
        ctx.moveTo(br - 4, y - bh); ctx.lineTo(br, y - bh); ctx.lineTo(br, y + bh); ctx.lineTo(br - 4, y + bh); ctx.stroke();
      }
      if (chg) D.text(ctx, chg, left + total - cw + 1, y - s * 0.62, { color: col.text, size: s * 0.6, weight: 800 });
    }
    ctx.restore();
    return total;
  }
  function lewisRow(ctx, col, A, ionic, W, y, s, mCol, nCol) {
    var gap = ionic ? s * 0.5 : s * 1.1;
    function width(sz) {
      var t = 0; A.atoms.forEach(function (a, i) { t += glyph(ctx, col, a, ionic, sz, 0, 0, false) + (i ? (ionic ? sz * 0.5 : sz * 1.1) : 0); }); return t;
    }
    var tw = width(s);
    if (tw > W - 20) { s *= (W - 20) / tw; tw = width(s); gap = ionic ? s * 0.5 : s * 1.1; }
    var x = W / 2 - tw / 2;
    A.atoms.forEach(function (a, i) {
      if (i) {
        if (!ionic) D.text(ctx, '+', x + gap / 2, y, { color: col.muted, size: s * 0.8, weight: 700, align: 'center' });
        x += gap;
      }
      var gw = glyph(ctx, col, a, ionic, s, 0, 0, false);
      glyph(ctx, col, a, ionic, s, x + gw / 2, y, true, mCol, nCol);
      x += gw;
    });
  }

  // ---------- property tests ----------
  function mode(sim) { return sim.p.view; }
  function solInfo(c) {
    return {
      yes: { b: 1, frac: 1, word: 'dissolves: ions spread out and move', bulb: 'Glows brightly' },
      naoh: { b: 1, frac: 1, word: 'reacts with water to make NaOH: Na⁺ and OH⁻ ions move', bulb: 'Glows brightly', anion: 'OH', ratio: [1, 1] },
      lime: { b: 0.3, frac: 0.15, word: 'reacts to make Ca(OH)₂, but only a little dissolves', bulb: 'Glows dimly', anion: 'OH', ratio: [1, 2] },
      no: { b: 0, frac: 0, word: 'hardly dissolves: the ions stay locked in the solid', bulb: 'Off' },
      mol: { b: 0, frac: 1, word: 'dissolves as whole molecules: no ions, no current', bulb: 'Off' }
    }[c.sol];
  }

  function buildIons(sim) {
    var c = cmp(sim), v = mode(sim), si = solInfo(c);
    var nm = c.cov ? 1 : c.nm, nn = c.cov ? 0 : c.nn, an = c.n, cs = c.m;
    if (v === 'solution' && si.anion) { an = si.anion; nm = si.ratio[0]; nn = si.ratio[1]; }
    var cols = 9, rows = 5, ions = [], per = nm + nn, rng = M.rng(7 + sim.p.cmp.length * 13);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var kind;
      if (c.cov) kind = 'mol';
      else if (nm === nn) kind = (i + j) % 2 ? 'a' : 'c';
      else {
        var r = ((i + 2 * j) % per + per) % per;
        kind = nm < nn ? (r < nm ? 'c' : 'a') : (r < nn ? 'a' : 'c');
      }
      var free = v === 'molten' ? true : v === 'solution' ? rng() < si.frac : false;
      ions.push({ kind: kind, lu: 0.22 + 0.56 * (i + 0.5) / cols, lv: 0.5 + 0.5 * (j + 0.5) / rows, free: free,
        fu: 0.14 + 0.72 * rng(), fv: (v === 'solution' ? 0.25 : 0.52) + (v === 'solution' ? 0.72 : 0.45) * rng(), ph: rng() * 6.28, flash: 0 });
    }
    return { ions: ions, cs: cs, an: an, qc: c.cov ? 0 : (v === 'solution' && si.anion ? (cs === 'Na' ? 1 : 2) : val(c.m)), qa: c.cov ? 0 : (v === 'solution' && si.anion ? 1 : 8 - val(c.n)) };
  }

  function temp(sim) {
    var c = cmp(sim);
    if (mode(sim) !== 'molten') return 25;
    return 25 + (c.mp + 60 - 25) * M.clamp(sim.state.t / T_HEAT, 0, 1);
  }
  function meltFrac(sim) {
    var c = cmp(sim); if (mode(sim) !== 'molten') return 0;
    var tm = T_HEAT * (c.mp - 25) / (c.mp + 35);
    return M.clamp((sim.state.t - tm) / 0.8, 0, 1);
  }
  function bulb(sim) {
    var c = cmp(sim), v = mode(sim);
    if (c.cov || v === 'solid') return 0;
    if (v === 'molten') return meltFrac(sim);
    return solInfo(c).b;
  }

  function updateIons(sim, dt) {
    var P = sim.state.P, v = mode(sim), c = cmp(sim), drift = bulb(sim) > 0 && !c.cov ? 0.12 : 0, mf = v === 'molten' ? meltFrac(sim) : 1;
    var rnd = Math.random;
    P.ions.forEach(function (o) {
      o.ph += dt * 9;
      if (o.flash > 0) o.flash -= dt * 2.5;
      if (!o.free || mf <= 0) return;
      var top = v === 'solution' ? 0.25 : 0.52;
      o.fu += (rnd() - 0.5) * dt * 0.9 + (o.kind === 'c' ? -drift : o.kind === 'a' ? drift : 0) * dt;
      o.fv += (rnd() - 0.5) * dt * 0.9;
      o.fv = M.clamp(o.fv, top + 0.03, 0.97);
      if (drift && o.kind === 'c' && o.fu < 0.15) { o.flash = 1; o.fu = 0.85; o.fv = top + 0.05 + rnd() * (0.92 - top); }
      else if (drift && o.kind === 'a' && o.fu > 0.85) { o.flash = 1; o.fu = 0.15; o.fv = top + 0.05 + rnd() * (0.92 - top); }
      o.fu = M.clamp(o.fu, 0.03, 0.97);
    });
  }

  function drawTests(sim, now) {
    var ctx = sim.ctx, col = sim.colors, c = cmp(sim), st = sim.state, P = st.P, v = mode(sim), W = sim.width, H = sim.height, small = W < 560;
    D.clear(ctx, W, H, col.bg);
    var si = solInfo(c), b = bulb(sim), T = temp(sim), mf = meltFrac(sim);
    var title = v === 'solid' ? 'Solid ' + c.f + ' at room temperature' : v === 'molten' ? (mf > 0 ? 'Molten ' + c.f + ' at ' + Math.round(T) + ' °C' : 'Heating ' + c.f + ': ' + Math.round(T) + ' °C') : c.f + ' in water';
    D.text(ctx, title, W / 2, small ? 14 : 18, { color: col.bg, bg: col.s3, size: small ? 11.5 : 13, weight: 700, align: 'center', pad: 4, fit: W });
    var capH = small ? 34 : 38, burn = v === 'molten' ? (small ? 30 : 40) : 0;
    var wireY = small ? 50 : 62, bx0 = Math.max(16, W / 2 - Math.min(W * 0.36, 230)), bx1 = W - bx0;
    var by0 = wireY + (small ? 26 : 34), by1 = H - capH - burn - 6, bw = bx1 - bx0, bh = by1 - by0;
    var eL = bx0 + bw * 0.1, eR = bx0 + bw * 0.9, eTop = by0 - 6;
    // circuit wire, bulb and battery
    var wc = col.light ? '#475569' : '#94a3b8';
    ctx.save(); ctx.strokeStyle = wc; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(eL, eTop + 20); ctx.lineTo(eL, wireY); ctx.lineTo(eR, wireY); ctx.lineTo(eR, eTop + 20); ctx.stroke(); ctx.restore();
    var bxC = bx0 + bw * 0.36, br = small ? 11 : 14, batX = bx0 + bw * 0.66;
    if (b > 0) { var g = ctx.createRadialGradient(bxC, wireY, 0, bxC, wireY, br * 4.5); g.addColorStop(0, 'rgba(253,224,71,' + (0.75 * b) + ')'); g.addColorStop(1, 'rgba(253,224,71,0)'); ctx.fillStyle = g; ctx.fillRect(bxC - br * 5, wireY - br * 5, br * 10, br * 10); }
    D.circle(ctx, bxC, wireY, br, b > 0 ? 'rgb(253,' + Math.round(200 + 40 * b) + ',' + Math.round(71 + 100 * (1 - b)) + ')' : (col.light ? '#e2e8f0' : '#1e293b'), wc, 2);
    D.curve(ctx, function (x) { return wireY + Math.sin((x - bxC) * 0.9) * 2.5; }, bxC - br * 0.55, bxC + br * 0.55, b > 0 ? '#b45309' : wc, 1.4, 1);
    D.text(ctx, b >= 0.9 ? 'bright' : b > 0 ? 'dim' : 'bulb off', bxC, wireY - br - 8, { color: b > 0 ? (col.light ? '#a16207' : '#fde047') : col.muted, size: small ? 10 : 11, weight: 700, align: 'center' });
    // battery: long plate (+) on the right side, so the right electrode is +
    ctx.fillStyle = col.bg; ctx.fillRect(batX - 5, wireY - 12, 10, 24);
    D.line(ctx, batX - 4, wireY - 6, batX - 4, wireY + 6, wc, 3);
    D.line(ctx, batX + 4, wireY - 11, batX + 4, wireY + 11, wc, 2);
    D.text(ctx, 'battery', batX, wireY - 19, { color: col.muted, size: small ? 9.5 : 11, align: 'center' });
    // beaker
    var liquidTop = v === 'solution' ? by0 + bh * 0.25 : v === 'molten' ? by0 + bh * 0.52 : null;
    if (v === 'solution') { ctx.fillStyle = col.light ? 'rgba(59,130,246,0.18)' : 'rgba(96,165,250,0.18)'; ctx.fillRect(bx0, liquidTop, bw, by1 - liquidTop); }
    if (v === 'molten' && mf > 0) { ctx.save(); ctx.globalAlpha = mf; ctx.fillStyle = c.cov ? 'rgba(180,120,40,0.35)' : 'rgba(251,146,60,0.32)'; ctx.fillRect(bx0, liquidTop, bw, by1 - liquidTop); ctx.restore(); }
    ctx.save(); ctx.strokeStyle = col.light ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(bx0, by0 - 4); ctx.lineTo(bx0, by1); ctx.lineTo(bx1, by1); ctx.lineTo(bx1, by0 - 4); ctx.stroke(); ctx.restore();
    // electrodes
    var eB = by1 - 6;
    D.roundRect(ctx, eL - 4, eTop, 8, eB - eTop, 2, col.light ? '#334155' : '#64748b');
    D.roundRect(ctx, eR - 4, eTop, 8, eB - eTop, 2, col.light ? '#334155' : '#64748b');
    D.text(ctx, '−', eL - 12, eTop + 6, { color: col.text, size: 16, weight: 800, align: 'center' });
    D.text(ctx, '+', eR + 12, eTop + 6, { color: col.text, size: 16, weight: 800, align: 'center' });
    // burner
    if (burn) {
      var fy = by1 + 4, heat = M.clamp(st.t / 0.4, 0, 1) * (st.t > 0 ? 1 : 0);
      D.roundRect(ctx, W / 2 - 18, fy + burn - 10, 36, 8, 3, col.light ? '#64748b' : '#475569');
      if (heat > 0) for (var f = -2; f <= 2; f++) {
        var fh = (burn - 14) * (0.6 + 0.4 * Math.sin(now / 90 + f * 1.7)) * heat;
        ctx.beginPath(); ctx.moveTo(W / 2 + f * 9 - 5, fy + burn - 10); ctx.quadraticCurveTo(W / 2 + f * 9, fy + burn - 10 - fh * 1.3, W / 2 + f * 9 + 5, fy + burn - 10);
        ctx.fillStyle = f % 2 ? 'rgba(251,146,60,0.85)' : 'rgba(96,165,250,0.85)'; ctx.fill();
      }
    }
    // ions
    var cell = Math.min(bw * 0.56 / 9, bh * 0.5 / 5), ra = cell * 0.46, rc = cell * 0.32;
    var vib = sim.running ? 1 : 0, cFill = '#a78bfa', aFill = P.an === 'Cl' ? '#4ade80' : P.an === 'O' ? '#f87171' : '#fb923c';
    var qc = charge(P.qc, 1), qa = charge(P.qa, -1), lime = v === 'solution' && c.sol === 'lime';
    P.ions.forEach(function (o) {
      var m = o.free ? (v === 'molten' ? mf : 1) : 0;
      var amp = (v === 'molten' && !m ? 0.6 + 2.2 * (T / c.mp) : 0.7) * vib;
      var lx = bx0 + bw * o.lu + Math.sin(o.ph) * amp, ly = by0 + bh * o.lv + Math.cos(o.ph * 1.3) * amp;
      var fx = bx0 + bw * o.fu, fy2 = by0 + bh * o.fv;
      var x = lx + (fx - lx) * m, y = ly + (fy2 - ly) * m;
      if (o.kind === 'mol') {
        D.roundRect(ctx, x - ra * 0.95, y - ra * 0.6, ra * 1.9, ra * 1.2, ra * 0.4, col.light ? '#cbd5e1' : '#e2e8f0', col.light ? '#64748b' : '#94a3b8', 1);
        return;
      }
      var a = o.kind === 'a', r = a ? ra : rc;
      if (lime && !o.free) { D.circle(ctx, x, y, r * 1.05, col.light ? '#f8fafc' : '#e5e7eb', col.light ? '#94a3b8' : '#9ca3af', 1); return; }
      if (o.flash > 0) { ctx.save(); ctx.globalAlpha = o.flash * 0.6; D.circle(ctx, x, y, r * 2, '#fde047'); ctx.restore(); }
      D.circle(ctx, x, y, r, a ? aFill : cFill, 'rgba(0,0,0,0.35)', 1);
      if (r > 5.5) D.text(ctx, a ? chg2(P.qa, -1) : chg2(P.qc, 1), x, y + 0.5, { color: '#0f172a', size: Math.max(8, r * (a ? 0.95 : 1.15)), weight: 800, align: 'center' });
    });
    // lime: undissolved white solid settles
    if (lime) D.text(ctx, 'white solid: most Ca(OH)₂ does not dissolve', W / 2, by0 + bh * 0.5 - 4, { bg: col.bg, pad: 2, color: col.muted, size: small ? 9.5 : 11, align: 'center', fit: W });
    // legend + caption
    var legY = H - capH + 10;
    if (!c.cov) {
      var lt = P.cs + qc + ' moves to −     ' + (P.an === 'OH' ? 'OH' : P.an) + qa + ' moves to +';
      if (b === 0) lt = P.cs + qc + ' and ' + (P.an === 'OH' ? 'OH' : P.an) + qa + ' ions, held in place';
      D.circle(ctx, 14, legY, rc * 0.8, cFill); D.circle(ctx, 30, legY, ra * 0.8, aFill);
      D.text(ctx, lt, 42, legY, { color: col.text, size: small ? 10.5 : 12, weight: 600, fit: W });
    } else D.text(ctx, 'Sugar molecules: no charge, nothing to carry current', W / 2, legY, { color: col.text, size: small ? 10.5 : 12, weight: 600, align: 'center', fit: W });
    var why = v === 'solid' ? (c.cov ? 'Solid sugar: molecules held in place, no charges' : 'Ions are locked in the lattice, so they cannot move: no current')
      : v === 'molten' ? (mf > 0 ? (c.cov ? 'Melted sugar is still only molecules: bulb stays off' : 'Free ions carry charge to the electrodes: current flows')
        : 'Melts at ' + c.mp + ' °C' + (c.mp > 1500 ? ' (needs a special furnace)' : ''))
        : si.word;
    D.text(ctx, why, W / 2, legY + (small ? 16 : 18), { color: col.muted, size: small ? 10 : 11.5, align: 'center', fit: W });
  }

  SimLab.createSim({
    ariaLabel: 'Bohr-style atoms of a metal and a non-metal. Press Start to watch electrons move from the metal to the non-metal and form ions, or test the ionic solid when solid, molten and dissolved in water with a bulb tester',
    playLabel: 'Start',
    mobileAspect: '1 / 1',
    params: [
      { id: 'cmp', label: 'Compound', type: 'select', value: 'NaCl', options: [
        { value: 'NaCl', label: 'Sodium chloride, NaCl' }, { value: 'KCl', label: 'Potassium chloride, KCl' },
        { value: 'MgCl2', label: 'Magnesium chloride, MgCl₂' }, { value: 'CaCl2', label: 'Calcium chloride, CaCl₂' },
        { value: 'MgO', label: 'Magnesium oxide, MgO' }, { value: 'CaO', label: 'Calcium oxide, CaO' },
        { value: 'Na2O', label: 'Sodium oxide, Na₂O' }, { value: 'Al2O3', label: 'Aluminium oxide, Al₂O₃' },
        { value: 'sugar', label: 'Sugar (covalent, to compare)' }] },
      { id: 'view', label: 'What to show', type: 'select', value: 'transfer', options: [
        { value: 'transfer', label: 'Electron transfer (making ions)' },
        { value: 'solid', label: 'Test: solid in a bulb tester' },
        { value: 'molten', label: 'Test: heat it until molten' },
        { value: 'solution', label: 'Test: dissolve it in water' }] }
    ],
    readouts: [
      { id: 'f', label: 'Formula', key: true },
      { id: 'before', label: 'Shells before', key: true },
      { id: 'after', label: 'Shells after (ions)' },
      { id: 'moved', label: 'Electrons moved' },
      { id: 'mp', label: 'Melting point', key: true, short: 'Melts at' },
      { id: 'T', label: 'Temperature' },
      { id: 'bulb', label: 'Bulb' }
    ],
    reset: function (sim) {
      var c = cmp(sim);
      sim.state = { t: 0, A: c.cov ? null : buildAtoms(c) };
      if (mode(sim) !== 'transfer') sim.state.P = buildIons(sim);
    },
    update: function (sim, dt) {
      sim.state.t += dt;
      if (mode(sim) !== 'transfer') updateIons(sim, dt);
    },
    finished: function (sim) {
      var v = mode(sim), c = cmp(sim);
      if (v === 'transfer') return c.cov || sim.state.t >= sim.state.A.end + 0.3;
      return false;
    },
    readout: function (sim) {
      var c = cmp(sim), st = sim.state, v = mode(sim), out = { f: c.f, mp: c.mp + ' °C', T: Math.round(temp(sim)) + ' °C' };
      if (c.cov) { out.before = 'shares electrons'; out.after = 'no ions'; out.moved = 'none (covalent)'; }
      else {
        var m = EL[c.m], n = EL[c.n];
        out.before = c.m + ' ' + cfgText(m.cfg) + ' · ' + c.n + ' ' + cfgText(n.cfg);
        var mi = m.cfg.slice(0, -1), ni = n.cfg.slice(0, -1).concat([8]);
        out.after = c.m + charge(val(c.m), 1) + ' ' + cfgText(mi) + ' · ' + c.n + charge(8 - val(c.n), -1) + ' ' + cfgText(ni);
        var tot = st.A.transfers.length, done = v === 'transfer' ? M.clamp(Math.floor((st.t - T_START) / T_E + 1e-9), 0, tot) : tot;
        out.moved = done + ' of ' + tot;
      }
      if (v === 'transfer') { out.bulb = '—'; out.T = '—'; }
      else { var b = bulb(sim); out.bulb = b >= 0.9 ? 'Glows brightly' : b > 0 ? 'Glows dimly' : 'Off'; }
      return out;
    },
    status: function (sim) {
      var v = mode(sim), c = cmp(sim);
      if (v === 'transfer') return c.cov ? 'Sugar is covalent: no electron transfer' : sim.state.t >= sim.state.A.end ? 'Ions formed: ' + c.f : 'Press Start to move the electrons';
      if (v === 'molten') return meltFrac(sim) > 0 ? 'Molten' : 'Press Start to heat it';
      return v === 'solid' ? 'Solid in the tester' : 'Dissolved in water';
    },
    draw: function (sim, now) {
      if (mode(sim) === 'transfer') drawTransfer(sim, now); else drawTests(sim, now);
    }
  });
})();
