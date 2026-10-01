/* =====================================================================
   Gravitation · Buoyancy and Archimedes' Principle — sim.js
   ---------------------------------------------------------------------
   A 5 cm × 5 cm × 8 cm block (200 cm³) hangs from a spring balance and
   is lowered into an overflow can filled to the spout. The liquid it
   pushes aside runs into a measuring cylinder.
     weight in air        W = ρ_block V g
     upthrust (buoyancy)  B = ρ_liquid V_under g = weight of liquid displaced
     balance reading      T = W − B   (never below 0)
   If the block is less dense than the liquid it floats once B = W,
   with a fraction ρ_block ÷ ρ_liquid of it under the surface; the
   string then goes slack and the balance reads 0. "Let go" cuts the
   string: dense blocks sink to the bottom, light ones float.
   The cylinder shows the liquid pushed aside by the block right now
   (as if any overflow is poured back when the block is raised).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var g = 9.8, AREA = 25, HB = 8, VOL = AREA * HB, START = 2, DEPTH = 14;  // cm², cm, cm³, cm above, liquid depth cm
  var BLOCKS = {
    iron: { name: 'Iron', rho: 7.9, col: '#64748b' },
    alu: { name: 'Aluminium', rho: 2.7, col: '#cbd5e1' },
    plastic: { name: 'PVC plastic', rho: 1.4, col: '#a78bfa' },
    ice: { name: 'Ice', rho: 0.92, col: '#e0f2fe' },
    wood: { name: 'Teak wood', rho: 0.65, col: '#b45309' }
  };
  var LIQS = {
    water: { name: 'Water', rho: 1.0, col: '#38bdf8' },
    sea: { name: 'Sea water', rho: 1.03, col: '#0ea5e9' },
    kero: { name: 'Kerosene', rho: 0.8, col: '#fcd34d' },
    gly: { name: 'Glycerine', rho: 1.26, col: '#c4b5fd' },
    hg: { name: 'Mercury', rho: 13.6, col: '#cbd5e1' }
  };

  function calc(p) {
    var b = BLOCKS[p.block] || BLOCKS.iron, l = LIQS[p.liq] || LIQS.water;
    var Wt = b.rho * VOL * 1e-3 * g;                 // N (ρ in g/cm³ → mass in g ÷ 1000)
    var sEq = HB * b.rho / l.rho, floats = b.rho < l.rho;
    var raw = p.d - START, under, bottom, mode;
    if (p.cut) {
      if (floats) { under = sEq; bottom = sEq; mode = 'float'; }
      else { under = HB; bottom = DEPTH; mode = 'sunk'; }
    } else {
      under = M.clamp(raw, 0, HB); bottom = raw; mode = raw <= 0 ? 'air' : raw < HB ? 'part' : 'full';
      if (floats && under > sEq) { under = sEq; bottom = sEq; mode = 'float'; }
    }
    var B = l.rho * AREA * under * 1e-3 * g;
    var T = p.cut || mode === 'float' ? 0 : Math.max(0, Wt - B);
    return { b: b, l: l, Wt: Wt, B: B, T: T, under: under, bottom: bottom, mode: mode, sEq: sEq, floats: floats, Vd: AREA * under };
  }

  var shown = null, lastNow = 0;   // eased values for smooth movement

  SimLab.createSim({
    ariaLabel: 'A block hanging from a spring balance is lowered into an overflow can of liquid; the liquid it pushes out runs into a measuring cylinder, and bars compare the loss in weight with the weight of liquid displaced',
    transport: false,
    mobileAspect: '3 / 4.4',
    params: [
      { id: 'd', label: 'Lower the block into the liquid', min: 0, max: 12, step: 0.5, value: 0, unit: 'cm',
        presets: [{ label: 'in air', value: 0 }, { label: 'half in', value: 6 }, { label: 'fully in', value: 11 }],
        help: 'The block starts 2 cm above the liquid. It is fully under at 10 cm.' },
      { id: 'block', label: 'Block (200 cm³)', type: 'select', value: 'iron', options: Object.keys(BLOCKS).map(function (k) {
        return { value: k, label: BLOCKS[k].name + ' (' + BLOCKS[k].rho + ' g/cm³)' }; }) },
      { id: 'liq', label: 'Liquid', type: 'select', value: 'water', options: Object.keys(LIQS).map(function (k) {
        return { value: k, label: LIQS[k].name + ' (' + LIQS[k].rho + ' g/cm³)' }; }) },
      { id: 'cut', label: 'Let go of the block (cut the string)', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'T', label: 'Spring balance reading', unit: 'N', digits: 2, key: true },
      { id: 'W', label: 'Weight in air W', unit: 'N', digits: 2 },
      { id: 'B', label: 'Upthrust (buoyant force)', unit: 'N', digits: 2 },
      { id: 'Vd', label: 'Liquid displaced', unit: 'cm³', digits: 0 },
      { id: 'Wd', label: 'Weight of liquid displaced', unit: 'N', digits: 2 },
      { id: 'res', label: 'Sink or float?' }
    ],
    onParam: function () { return true; },
    reset: function () {},
    animate: function (sim) {
      var q = calc(sim.p);
      return !shown || Math.abs(shown.bottom - q.bottom) > 0.01 || Math.abs(shown.d - sim.p.d) > 0.01 || Math.abs(shown.under - q.under) > 0.01;
    },
    readout: function (sim) {
      var q = calc(sim.p), res;
      if (q.floats) res = 'Floats: ' + Math.round(q.sEq / HB * 100) + '% under (ρ ' + q.b.rho + ' < ' + q.l.rho + ')';
      else res = 'Sinks (ρ ' + q.b.rho + ' > ' + q.l.rho + ' g/cm³)';
      return { T: q.T, W: q.Wt, B: q.B, Vd: q.Vd, Wd: q.l.rho * q.Vd * 1e-3 * g, res: res };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, q = calc(p), narrow = W < 560;
      // ease the drawing towards the target
      var dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1; lastNow = now;
      if (!shown) shown = { d: p.d, bottom: q.bottom, under: q.under };
      var kk = 1 - Math.exp(-dt * 7);
      shown.d += (p.d - shown.d) * kk; shown.bottom += (q.bottom - shown.bottom) * kk; shown.under += (q.under - shown.under) * kk;
      if (Math.abs(shown.d - p.d) < 0.01) shown.d = p.d;
      if (Math.abs(shown.bottom - q.bottom) < 0.01) shown.bottom = q.bottom;
      if (Math.abs(shown.under - q.under) < 0.01) shown.under = q.under;
      var Bs = q.l.rho * AREA * shown.under * 1e-3 * g;
      var Ts = p.cut || q.mode === 'float' ? (Math.abs(shown.under - q.under) < 0.05 ? 0 : Math.max(0, q.Wt - Bs)) : Math.max(0, q.Wt - Bs);
      D.clear(ctx, W, H, c.bg);

      var panelH = narrow ? 118 : 0, panelW = narrow ? 0 : Math.min(300, W * 0.38);
      var sceneW = W - panelW, sceneH = H - panelH;
      var BAL = narrow ? 92 : 104, top = 34;
      var k = Math.min((sceneH - top - BAL - 34) / 27, (sceneW - 24) / 24);
      var canX = (narrow ? 16 : 30), canW = 13 * k, ys = top + BAL + 12 + 13 * k;   // liquid surface y
      var floorY = ys + DEPTH * k, canTop = ys - 2.5 * k;
      var blockX = canX + canW / 2 - 2.5 * k;
      function Y(depth) { return ys + depth * k; }

      // stand; the balance hangs from a clamp that the slider lowers
      var standX = canX + canW / 2;
      D.line(ctx, canX - 6, top - 6, standX + 30, top - 6, c.ink, 4);
      var bx = standX, by0 = ys - 13 * k - BAL - 2 + shown.d * k, bw = narrow ? 30 : 34;
      D.line(ctx, bx, top - 6, bx, by0, c.muted, 2);
      D.roundRect(ctx, bx - bw / 2, by0, bw, BAL - 22, 6, c.surface2, c.border, 1.5);
      var maxN = Math.max(2, Math.ceil(q.Wt * 1.15 / 2) * 2), sy0 = by0 + 8, sy1 = by0 + BAL - 32;
      var nst = maxN <= 4 ? 0.5 : maxN <= 10 ? 1 : 2;
      for (var n = 0; n <= maxN + 1e-9; n += nst) {
        var ty = sy0 + n / maxN * (sy1 - sy0), major = Math.abs(n / (nst * 2) - Math.round(n / (nst * 2))) < 1e-6;
        D.line(ctx, bx + bw / 2 - (major ? 9 : 5), ty, bx + bw / 2 - 2, ty, c.muted, 1);
        if (major) D.text(ctx, M.fmt(n, nst < 1 ? 0 : 0), bx - bw / 2 - 3, ty, { color: c.faint, size: 9, align: 'right' });
      }
      var py = sy0 + Math.min(Ts, maxN) / maxN * (sy1 - sy0);
      // spring
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 1.4; ctx.beginPath();
      var coils = 9; for (var i = 0; i <= coils * 2; i++) { var yy = sy0 - 4 + (py - sy0 + 4) * i / (coils * 2); ctx.lineTo(bx + (i % 2 ? 6 : -6), yy); }
      ctx.stroke(); ctx.restore();
      D.line(ctx, bx - 9, py, bx + 9, py, c.danger, 3);
      D.text(ctx, 'N', bx, by0 + BAL - 28 + 8, { color: c.faint, size: 9, align: 'center' });
      var hookY = by0 + BAL - 22;
      D.line(ctx, bx, py, bx, hookY + 6, c.ink, 1.5);
      D.text(ctx, M.fmt(Ts, 2) + ' N', bx + bw / 2 + 6, by0 + 14, { color: c.text, size: narrow ? 12 : 13, weight: 700, bg: D.alpha(c.bg, 0.85), fit: sceneW });

      // block position
      var blockBot = Y(shown.bottom), blockTop = blockBot - HB * k;
      // string
      if (p.cut) {
        D.line(ctx, bx, hookY + 6, bx, hookY + 14, c.ink, 1.2);
      } else if (q.mode === 'float') {
        ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx, hookY + 6);
        ctx.quadraticCurveTo(bx + 14, (hookY + blockTop) / 2 + 10, bx, blockTop); ctx.stroke(); ctx.restore();
      } else D.line(ctx, bx, hookY + 6, bx, blockTop, c.ink, 1.2);

      // overflow can: liquid, block, glass
      var lcol = q.l.col;
      ctx.fillStyle = D.alpha(lcol, 0.42); ctx.fillRect(canX, ys, canW, floorY - ys);
      D.line(ctx, canX, ys, canX + canW, ys, D.alpha(lcol, 0.95), 2);
      // block (drawn over the liquid; the part under the surface tinted)
      var bxl = blockX, bwpx = 5 * k;
      D.roundRect(ctx, bxl, blockTop, bwpx, HB * k, 3, q.b.col, D.alpha('#000', 0.45), 1);
      var underTop = Math.max(blockTop, ys);
      if (blockBot > ys) { ctx.fillStyle = D.alpha(lcol, 0.35); ctx.fillRect(bxl, underTop, bwpx, blockBot - underTop); }
      D.text(ctx, q.b.name, bxl + bwpx / 2, blockTop + HB * k / 2, { color: '#0b1020', size: narrow ? 9 : 10.5, weight: 700, align: 'center', fit: sceneW });
      // glass walls + spout
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(canX, canTop); ctx.lineTo(canX, floorY); ctx.lineTo(canX + canW, floorY); ctx.lineTo(canX + canW, ys - 2);
      ctx.lineTo(canX + canW + 2.4 * k, ys + 1.2 * k); ctx.moveTo(canX + canW, ys - 2); ctx.lineTo(canX + canW, canTop);
      ctx.stroke(); ctx.restore();
      D.text(ctx, 'overflow can', canX + canW / 2, floorY + 12, { color: c.faint, size: 10, align: 'center' });
      D.text(ctx, q.l.name, canX + 6, floorY - 10, { color: c.muted, size: 10, weight: 600 });

      // measuring cylinder (0–250 cm³)
      var cylX = canX + canW + 3.2 * k, cylW = 4.2 * k, cylTop = ys + 2.2 * k, cylBot = floorY;
      var full = 250, lvl = cylBot - shown.under * AREA / full * (cylBot - cylTop - 6);
      if (Math.abs(shown.under - q.under) > 0.05 && q.under > shown.under - 0.05) {
        D.line(ctx, canX + canW + 2.4 * k, ys + 1.2 * k, cylX + cylW / 2, lvl, D.alpha(lcol, 0.9), 2.5);
      }
      ctx.fillStyle = D.alpha(lcol, 0.6); ctx.fillRect(cylX, lvl, cylW, cylBot - lvl);
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.moveTo(cylX, cylTop); ctx.lineTo(cylX, cylBot); ctx.lineTo(cylX + cylW, cylBot); ctx.lineTo(cylX + cylW, cylTop); ctx.stroke(); ctx.restore();
      for (var mv = 0; mv <= full; mv += 50) {
        var my = cylBot - mv / full * (cylBot - cylTop - 6);
        D.line(ctx, cylX + cylW - 7, my, cylX + cylW, my, c.muted, 1);
        D.text(ctx, String(mv), cylX + cylW + 3, my, { color: c.faint, size: 9 });
      }
      D.text(ctx, 'cm³', cylX + cylW / 2, cylTop - 8, { color: c.faint, size: 9.5, align: 'center' });
      D.text(ctx, M.fmt(shown.under * AREA, 0) + ' cm³', cylX + cylW / 2, floorY + 12, { color: c.text, size: 10.5, weight: 700, align: 'center', fit: sceneW });

      // ---- comparison bars ----
      var Wd = q.l.rho * shown.under * AREA * 1e-3 * g;
      var px0, py0, pw, rowH;
      if (narrow) { px0 = 14; py0 = H - panelH + 8; pw = W - 28; rowH = 26; }
      else { px0 = Math.min(sceneW + 6, canX + 24 * k + 40); py0 = top + 20; pw = panelW - 20; rowH = 46; }
      var rows = [
        { lab: 'Weight in air W', v: q.Wt, col: c.muted },
        { lab: 'Balance reading', v: Ts, col: c.danger },
        { lab: 'Upthrust (loss in weight)', v: p.cut || q.mode === 'float' ? Bs : q.Wt - Ts, col: c.s1 },
        { lab: 'Weight of liquid displaced', v: Wd, col: c.s3 }
      ];
      var scaleN = Math.max(q.Wt, Wd, 0.01);
      if (!narrow) D.text(ctx, 'Forces (N)', px0, py0 - 16, { color: c.muted, size: 12, weight: 700 });
      rows.forEach(function (r, i) {
        var y = py0 + i * rowH, labW = narrow ? Math.min(150, pw * 0.48) : 0;
        var bx0 = narrow ? px0 + labW : px0, by = narrow ? y + 4 : y + 16, bwid = narrow ? pw - labW - 50 : pw - 56;
        D.text(ctx, r.lab, px0, narrow ? y + 9 : y + 6, { color: c.muted, size: narrow ? 10 : 11, weight: 600 });
        D.roundRect(ctx, bx0, by, bwid, 10, 3, D.alpha(c.muted, 0.15));
        D.roundRect(ctx, bx0, by, Math.max(0, bwid * Math.min(1, r.v / scaleN)), 10, 3, r.col);
        D.text(ctx, M.fmt(r.v, 2), bx0 + bwid + 6, by + 5, { color: c.text, size: narrow ? 10.5 : 11.5, weight: 700 });
      });
      var noteY = narrow ? py0 + rows.length * rowH : py0 + rows.length * rowH + 8;
      var note = q.mode === 'air' && !p.cut ? 'Lower the block into the liquid' :
        (q.mode === 'float' ? (p.cut ? 'Floating: upthrust = weight' : 'Floating: string slack, upthrust = weight') :
        p.cut ? 'Sunk: resting on the bottom' : 'Upthrust = weight of liquid displaced');
      D.text(ctx, note, narrow ? W / 2 : px0, noteY, { color: c.s3, size: narrow ? 10.5 : 11.5, weight: 700, align: narrow ? 'center' : 'left', fit: W });

      var head = 'Archimedes: upthrust = weight of liquid pushed aside';
      var hs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(head).width > W - 30) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, head, W / 2, 13, { color: c.bg, bg: c.s1, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
