/* =====================================================================
   The fundamental unit of life · Osmosis — sim.js
   ---------------------------------------------------------------------
   A potato strip, raisins or Rhoeo leaf cells sit in water or in a salt
   or sugar solution. Water crosses the selectively permeable membranes
   from where there is less solute to where there is more.
   Model (v = volume ÷ fresh volume; concentrations in osmol/L):
     solution        π_out = i · c(g/L) / molar mass   (salt i = 2,
                     58.4 g/mol; sugar i = 1, 342 g/mol)
     cell sap        π_in  = A / (v − b)  (b = part of the volume that
                     is not water: starch, walls, sugar crystals)
     wall pressure   P = E · (v − v_f) when v > v_f, else 0
     water flow      dv/dt = k (π_in − P − π_out)
   Constants per specimen (fresh v = 1):
     potato  A 0.096  b 0.70  v_f 0.97  E 2.3   k 0.003/min
     raisin  A 2.28   b 0.30  v_f 1.60  E 4.75  k 0.0012/min  (v_f: skin tight)
     cells   A 0.595  b 0.15  v_f 0.95  E 4     k 0.2/min
   Results: potato +8 % in water, about −27 % in 10 % salt, isotonic near
   0.7 % salt; raisins +90 % in water; cells plasmolyse above about 2.2 %
   salt. Mass is taken as proportional to volume.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SPEC = {
    potato: { name: 'potato strip', A: 0.096, b: 0.7, vf: 0.97, E: 2.3, k: 0.003, m0: 5, rate: 6, tEnd: 360 },
    raisin: { name: 'raisins', A: 2.28, b: 0.3, vf: 1.6, E: 4.75, k: 0.0012, m0: 1.5, rate: 12, tEnd: 720 },
    cell: { name: 'Rhoeo leaf cells', A: 0.595, b: 0.15, vf: 0.95, E: 4, k: 0.2, m0: 0, rate: 1 / 6, tEnd: 10 }
  };
  var tEnd = 360;
  function piOut(p) { return p.solute === 'salt' ? 2 * p.conc * 10 / 58.44 : p.conc * 10 / 342; }
  function piIn(sp, v) { return sp.A / Math.max(0.004, v - sp.b); }
  function wallP(sp, v) { return v > sp.vf ? sp.E * (v - sp.vf) : 0; }
  function net(sp, v, p) { return piIn(sp, v) - wallP(sp, v) - piOut(p); }
  function clock(min) {
    if (min < 60) return min < 10 ? M.fmt(min, 1) + ' min' : Math.round(min) + ' min';
    var h = Math.floor(min / 60), m = Math.round(min - h * 60); if (m === 60) { h++; m = 0; }
    return h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
  }
  function stateWord(sp, s, key) {
    var v = s.v;
    if (key === 'raisin') return v >= sp.vf - 0.01 ? 'plump, skin tight' : v > 1.25 ? 'swelling, fewer wrinkles' : v < 0.99 ? 'shrivelled more' : 'wrinkled';
    if (key === 'potato') return v > sp.vf + 0.005 ? (v > 1.02 ? 'firm and stiff (turgid)' : 'firm (turgid)') : v > sp.vf - 0.04 ? 'limp (flaccid)' : 'soft and bendy (cells plasmolysed)';
    return v > sp.vf + 0.004 ? 'turgid: membrane pressed on the wall' : v > sp.vf - 0.01 ? 'flaccid: just touching the wall' : 'plasmolysed: membrane pulled away';
  }

  SimLab.createSim({
    ariaLabel: 'A potato strip, raisins or plant cells in water or salt solution gain or lose water by osmosis; a close-up shows water crossing a membrane',
    mobileAspect: '1 / 1',
    playLabel: 'Start soaking',
    params: [
      { id: 'spec', label: 'What to soak', type: 'select', value: 'potato', options: [
        { value: 'potato', label: 'Potato strip (5 g)' }, { value: 'raisin', label: 'Raisins (3, 1.5 g)' }, { value: 'cell', label: 'Rhoeo leaf peel (microscope)' }] },
      { id: 'solute', label: 'Dissolved in the water', type: 'select', value: 'salt', options: [
        { value: 'salt', label: 'Common salt (NaCl)' }, { value: 'sugar', label: 'Sugar (sucrose)' }] },
      { id: 'conc', label: 'Strength of the solution', min: 0, max: 20, step: 0.1, value: 0, unit: '%',
        presets: [{ label: 'Pure water', value: 0 }, { label: '1 %', value: 1 }, { label: '5 %', value: 5 }, { label: '10 %', value: 10 }, { label: '20 %', value: 20 }],
        help: 'grams dissolved in 100 mL of solution' }
    ],
    readouts: [
      { id: 't', label: 'Time soaked', short: 'Time', key: true },
      { id: 'dm', label: 'Change in mass', short: 'Mass change', key: true },
      { id: 'flow', label: 'Water moves', key: true },
      { id: 'm', label: 'Mass now' },
      { id: 'sol', label: 'The solution is' },
      { id: 'state', label: 'The cells are' }
    ],
    graph: { title: 'Change in mass (%) vs time', xLabel: 'time (minutes)', yLabel: '% change', series: [{ label: 'mass (or cell volume) change' }], window: null, xMax: function () { return tEnd; } },

    reset: function (sim) {
      var sp = SPEC[sim.p.spec]; tEnd = sp.tEnd;
      sim.state = { v: 1, t: 0, acc: 0, phase: 0 };
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [0]); }
    },
    update: function (sim, dt) {
      var s = sim.state, sp = SPEC[sim.p.spec], dmin = dt * sp.rate;
      if (s.t >= sp.tEnd) return;
      // a few small steps keep the stiff end (nearly empty cells) stable
      for (var i = 0; i < 4; i++) s.v = Math.max(sp.b + 0.005, s.v + sp.k * net(sp, s.v, sim.p) * dmin / 4);
      s.t = Math.min(sp.tEnd, s.t + dmin);
      s.phase += dt;
      s.acc += dt;
      if (s.acc >= 0.1 && sim.graph) { s.acc = 0; sim.graph.push(s.t, [(s.v - 1) * 100]); }
    },
    finished: function (sim) { return sim.state.t >= SPEC[sim.p.spec].tEnd; },
    readout: function (sim) {
      var s = sim.state, sp = SPEC[sim.p.spec], n = net(sp, s.v, sim.p), fresh = net(sp, 1, sim.p);
      return {
        t: clock(s.t),
        dm: (s.v >= 1 ? '+' : '') + M.fmt((s.v - 1) * 100, 1) + ' %',
        flow: Math.abs(n) < 0.01 ? 'no net flow' : n > 0 ? 'into the cells' : 'out of the cells',
        m: sp.m0 ? M.fmt(sp.m0 * s.v, 2) + ' g' : 'cell volume ' + Math.round(s.v * 100) + ' %',
        sol: Math.abs(fresh) < 0.03 ? 'isotonic (about the same as the cell sap)' : fresh > 0 ? 'hypotonic (weaker than the cell sap)' : 'hypertonic (stronger than the cell sap)',
        state: stateWord(sp, s, sim.p.spec)
      };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state, sp = SPEC[p.spec];
      var nar = W < 600, fs = nar ? 10 : 12;
      D.clear(ctx, W, H, c.bg);
      var stack = H > W * 1.15, mw = stack ? W : W * (nar ? 0.58 : 0.6), mh = stack ? H * 0.6 : H;
      var po = piOut(p), tint = p.solute === 'salt' ? '#cbd5e1' : '#fbbf24', solA = 0.08 + Math.min(0.32, po * 0.06);
      var solName = p.conc === 0 ? 'pure water' : M.fmt(p.conc, p.conc % 1 ? 1 : 0) + ' % ' + (p.solute === 'salt' ? 'salt' : 'sugar') + ' solution';
      var n = net(sp, s.v, p);

      // ---------- specimen view ----------
      if (p.spec !== 'cell') {
        var bw = Math.min(mw * 0.78, mh * 0.75), bh = Math.min(mh * 0.7, bw * 1.05), bx = (mw - bw) / 2, by = mh * 0.18;
        var wl = by + bh * 0.12;
        ctx.fillStyle = D.alpha(p.conc === 0 ? '#7dd3fc' : tint, p.conc === 0 ? 0.2 : solA); ctx.fillRect(bx, wl, bw, by + bh - wl);
        D.line(ctx, bx, wl, bx + bw, wl, D.alpha('#38bdf8', 0.8), 1.5);
        ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx - 4, by - 4); ctx.lineTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw + 4, by - 4); ctx.stroke(); ctx.restore();
        D.text(ctx, solName, mw / 2, by + bh + 14, { color: c.ink, size: fs, weight: 600, align: 'center', fit: mw });
        if (p.spec === 'potato') {
          var L = bh * 0.72 * Math.cbrt(s.v), sw = bw * 0.13 * Math.cbrt(s.v), bend = M.clamp((sp.vf - s.v) * 4, 0, 0.85);
          var x0 = bx + bw * 0.32, y0 = by + bh - 4;
          ctx.save(); ctx.lineCap = 'butt';
          // the strip stands up when firm and flops over when it loses water
          ctx.beginPath(); var pts = [];
          for (var k = 0; k <= 24; k++) { var f = k / 24, a = bend * f * f * 1.4; pts.push([x0 + Math.sin(a) * L * f * 0.9, y0 - Math.cos(a) * L * f]); }
          // build an outline of the bent strip
          var left = [], right = [];
          for (var q = 0; q < pts.length; q++) {
            var a2 = bend * Math.pow(q / 24, 2) * 1.4, nx = Math.cos(a2), ny = Math.sin(a2);
            left.push([pts[q][0] - nx * sw / 2, pts[q][1] - ny * sw / 2]); right.push([pts[q][0] + nx * sw / 2, pts[q][1] + ny * sw / 2]);
          }
          ctx.moveTo(left[0][0], left[0][1]); left.forEach(function (pt) { ctx.lineTo(pt[0], pt[1]); });
          for (var r = right.length - 1; r >= 0; r--) ctx.lineTo(right[r][0], right[r][1]);
          ctx.closePath(); ctx.fillStyle = s.v >= sp.vf ? '#fde68a' : '#f5deb3'; ctx.fill(); ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.restore();
          // ruler showing the length
          var rx = bx + bw + (nar ? 4 : 10);
          if (rx + 30 < mw) {
            D.line(ctx, rx, y0, rx, y0 - bh * 0.72, c.muted, 1);
            D.text(ctx, '50 mm', rx + 3, y0 - bh * 0.72, { color: c.muted, size: 9 });
          }
          D.text(ctx, 'length ' + M.fmt(50 * Math.cbrt(s.v), 1) + ' mm', mw / 2, by - 12, { color: c.ink, size: fs, weight: 600, align: 'center', fit: mw });
        } else {
          var rr = bw * 0.11 * Math.cbrt(s.v), wr = M.clamp((sp.vf - s.v) / 0.6, 0, 1.2);
          [-1, 0, 1].forEach(function (i) {
            var x = mw / 2 + i * rr * 2.4, y = by + bh - rr * 1.05 - (i === 0 ? 2 : 0), rnd = M.rng(3 + i);
            ctx.save(); ctx.beginPath();
            for (var a = 0; a <= 40; a++) { var th = a / 40 * Math.PI * 2, rad = rr * (1 + wr * 0.08 * Math.sin(th * 7 + i) ); ctx.lineTo(x + Math.cos(th) * rad * 1.15, y + Math.sin(th) * rad); }
            ctx.closePath(); ctx.fillStyle = s.v > 1.4 ? '#7c2d12' : '#451a03'; ctx.fill(); ctx.strokeStyle = '#1c0a00'; ctx.lineWidth = 1; ctx.stroke();
            var nW = Math.round(wr * 5);
            for (var w = 0; w < nW; w++) { var ox = (rnd() - 0.5) * rr * 1.3, oy = (rnd() - 0.5) * rr * 1.1; D.line(ctx, x + ox - rr * 0.35, y + oy, x + ox + rr * 0.3, y + oy + rr * 0.15, D.alpha('#fcd34d', 0.35), 1.2); }
            D.circle(ctx, x - rr * 0.35, y - rr * 0.35, rr * 0.18, D.alpha('#ffffff', 0.12));
            ctx.restore();
          });
          D.text(ctx, 'each raisin about ' + M.fmt(0.5 * s.v, 2) + ' g', mw / 2, by - 12, { color: c.ink, size: fs, weight: 600, align: 'center', fit: mw });
        }
      } else { // microscope view of Rhoeo leaf peel cells
        var R = Math.min(mw, mh) * 0.44, ccx = mw / 2, ccy = mh / 2 + (stack ? 6 : 0);
        ctx.save(); ctx.beginPath(); ctx.arc(ccx, ccy, R, 0, Math.PI * 2); ctx.fillStyle = D.alpha(p.conc === 0 ? '#e0f2fe' : (p.solute === 'salt' ? '#f1f5f9' : '#fef3c7'), c.light ? 0.9 : 0.85); ctx.fill(); ctx.clip();
        var cw = R * 0.62, ch = R * 0.42;
        for (var row = -2; row <= 2; row++) for (var col = -2; col <= 2; col++) {
          var ox2 = (row % 2 ? cw / 2 : 0), x1 = ccx + col * cw - cw / 2 + ox2, y1 = ccy + row * ch - ch / 2;
          ctx.strokeStyle = '#4d7c0f'; ctx.lineWidth = 3; ctx.strokeRect(x1, y1, cw, ch);
          var f2 = s.v >= sp.vf ? 1 : Math.sqrt(s.v / sp.vf), iw = (cw - 6) * f2, ih = (ch - 6) * f2;
          D.roundRect(ctx, x1 + cw / 2 - iw / 2, y1 + ch / 2 - ih / 2, iw, ih, f2 < 0.98 ? Math.min(iw, ih) * 0.45 : 2, s.v >= sp.vf ? '#a21caf' : '#86198f', '#581c87', 1);
          D.circle(ctx, x1 + cw / 2 + iw * 0.18, y1 + ch / 2, Math.max(2, ih * 0.14), '#3b0764');
        }
        ctx.restore();
        D.circle(ctx, ccx, ccy, R, null, c.ink, 3);
        D.text(ctx, 'Rhoeo leaf peel in ' + solName, mw / 2, Math.max(10, ccy - R - 10), { color: c.ink, size: fs, weight: 600, align: 'center', fit: mw });
        if (s.v < sp.vf - 0.01) D.text(ctx, 'membrane pulled away from the wall', mw / 2, ccy + R * 0.86, { color: '#111827', size: fs - 0.5, weight: 700, align: 'center', bg: 'rgba(255,255,255,0.85)', fit: mw });
      }
      // state line under the specimen
      D.text(ctx, stateWord(sp, s, p.spec), mw / 2, mh - 10, { color: s.v < sp.vf - 0.01 && p.spec !== 'raisin' ? c.warning : c.success, size: fs, weight: 700, align: 'center', fit: mw });

      // ---------- membrane close-up ----------
      var zx = stack ? 8 : mw + 4, zy = stack ? mh + 6 : 30, zw = stack ? W - 16 : W - mw - 12, zh = stack ? H - mh - 12 : H - 60;
      D.text(ctx, 'Close-up of a cell membrane', zx + zw / 2, stack ? zy + 8 : 14, { color: c.ink, size: fs, weight: 700, align: 'center', fit: W });
      var top = stack ? zy + 18 : zy;
      var bh2 = zh - (stack ? 18 : 0);
      D.roundRect(ctx, zx, top, zw, bh2, 8, D.alpha('#7dd3fc', c.light ? 0.18 : 0.1), D.alpha(c.ink, 0.25));
      var mx = zx + zw / 2;
      // membrane with pores
      for (var y = top + 4; y < top + bh2 - 4; y += 14) D.line(ctx, mx, y, mx, Math.min(y + 9, top + bh2 - 4), '#a855f7', 3);
      D.text(ctx, 'inside', zx + zw * 0.25, top + 10, { color: c.muted, size: fs - 1, align: 'center' });
      D.text(ctx, 'outside', zx + zw * 0.75, top + 10, { color: c.muted, size: fs - 1, align: 'center' });
      // solute particles (number ∝ concentration) and jiggling water molecules
      var pin = piIn(sp, s.v), rngA = M.rng(21), t = s.phase;
      function solutes(x0, count, col) {
        for (var i = 0; i < count; i++) {
          var px = x0 + 8 + rngA() * (zw / 2 - 16), py = top + 20 + rngA() * (bh2 - 28), j = Math.sin(t * 3 + i) * 1.5;
          D.circle(ctx, px + j, py - j, nar ? 3.2 : 4, col);
        }
      }
      for (var wv = 0; wv < 36; wv++) {
        var side = wv % 2, wx = zx + side * zw / 2 + 6 + rngA() * (zw / 2 - 12), wy = top + 18 + rngA() * (bh2 - 24);
        D.circle(ctx, wx + Math.sin(t * 5 + wv) * 2, wy + Math.cos(t * 4 + wv * 1.7) * 2, 1.8, '#38bdf8');
      }
      solutes(zx, Math.min(30, Math.round(pin * 6)) || 1, '#d946ef');
      if (po > 0) solutes(zx + zw / 2, Math.min(30, Math.max(1, Math.round(po * 6))), p.solute === 'salt' ? (c.light ? '#64748b' : '#e2e8f0') : '#f59e0b');
      // water crossing in the net direction
      var spd = M.clamp(Math.abs(n), 0, 3), dir = n > 0 ? -1 : 1, still = Math.abs(n) < 0.01 || s.t >= sp.tEnd;
      if (!still) for (var m = 0; m < 6; m++) {
        var ph = ((t * (0.3 + spd * 0.25) + m / 6) % 1), yy = top + 26 + m * (bh2 - 40) / 5;
        D.circle(ctx, mx + dir * (ph - 0.5) * zw * 0.5, yy, 2.6, '#0ea5e9');
      }
      var arrowY = top + bh2 - 16, al = zw * 0.3;
      if (Math.abs(n) < 0.01) D.text(ctx, '⇄ no net flow', mx, arrowY, { color: c.ink, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85) });
      else { D.arrow(ctx, mx - dir * al / 2, arrowY, mx + dir * al / 2, arrowY, '#0ea5e9', 3.5, 10); D.text(ctx, n > 0 ? 'water in' : 'water out', mx, arrowY - 14, { color: c.ink, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85) }); }
      if (!stack) D.text(ctx, '● water  ● cell sap solute  ● ' + (p.solute === 'salt' ? 'salt' : 'sugar'), zx + zw / 2, H - 14, { color: c.muted, size: fs - 1, align: 'center', fit: W });
    }
  });
})();
