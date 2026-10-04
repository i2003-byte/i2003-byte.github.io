/* =====================================================================
   Force and pressure · Pressure in Liquids — sim.js
   ---------------------------------------------------------------------
   A tall bottle with three small holes (A top, B middle, C bottom)
   stands on a stool. The liquid pushes on the walls with pressure
       P = h ρ g          (h = depth of the hole below the surface)
   so deeper holes feel more pressure and the jet leaves faster:
       v = √(2 g h)       (Torricelli; the density cancels out)
   Each jet then falls like a thrown ball from the hole's height z
   above the floor, landing at
       R = v × √(2 z / g) = 2 √(h z)
   Simplifications: tiny holes, no friction in the holes, no air
   resistance. With "tap keeps it full" off, the level falls with
       dh/dt = −(hole area ÷ bottle area) × Σ v
   (4 mm holes in a 10 cm wide bottle, area ratio 0.0016).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, g = 9.8;
  var BOT_H = 30, BOT_W = 10, HOLES = [{ n: 'A', z: 20 }, { n: 'B', z: 12 }, { n: 'C', z: 4 }]; // cm above the bottle's base
  var RATIO = 0.0016;
  var LIQ = {
    water: { name: 'Water (1000 kg/m³)', rho: 1000, col: '#38bdf8' },
    sea: { name: 'Sea water (1025 kg/m³)', rho: 1025, col: '#2dd4bf' },
    oil: { name: 'Mustard oil (920 kg/m³)', rho: 920, col: '#eab308' },
    kero: { name: 'Kerosene (810 kg/m³)', rho: 810, col: '#c4b5fd' }
  };

  // depth (cm), pressure (Pa), speed (m/s) and landing distance (cm) for each hole
  function baseOf(p) { return p.stool + (p.stool > 0 ? 2.5 : 0); } // bottle stands on a 2.5 cm stool board
  function jets(p, level) {
    return HOLES.map(function (H) {
      var h = Math.max(0, level - H.z), z = baseOf(p) + H.z, v = Math.sqrt(2 * g * h / 100);
      return { n: H.n, zb: H.z, h: h, z: z, P: LIQ[p.liquid].rho * g * h / 100, v: v, R: 2 * Math.sqrt(h * z), on: h > 0.05 };
    });
  }

  SimLab.createSim({
    ariaLabel: 'A bottle of liquid on a stool with three holes at different depths; streams of liquid shoot out and land on the floor, with bars comparing the pressure at each hole',
    autoplay: true,
    mobileAspect: '2 / 3',
    params: [
      { id: 'level', label: 'Liquid level in the bottle', min: 6, max: 30, step: 1, value: 28, unit: 'cm' },
      { id: 'stool', label: 'Height of the stool', min: 0, max: 60, step: 5, value: 45, unit: 'cm',
        presets: [{ label: 'On the floor', value: 0 }, { label: 'Stool', value: 45 }, { label: 'Table', value: 60 }] },
      { id: 'liquid', label: 'Liquid', type: 'select', value: 'water', options: Object.keys(LIQ).map(function (k) { return { value: k, label: LIQ[k].name }; }) },
      { id: 'topped', label: 'Tap keeps the bottle full', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'lvl', label: 'Liquid level', unit: 'cm', digits: 1 },
      { id: 'PA', label: 'Pressure at A (top)', unit: 'Pa', digits: 0 },
      { id: 'PB', label: 'Pressure at B (middle)', unit: 'Pa', digits: 0 },
      { id: 'PC', label: 'Pressure at C = h ρ g', unit: 'Pa', digits: 0, key: true },
      { id: 'vC', label: 'Jet speed at C = √(2gh)', unit: 'm/s', digits: 2 },
      { id: 'far', label: 'Lands farthest' }
    ],
    reset: function (sim) { sim.state = { level: sim.p.level }; },
    update: function (sim, dt) {
      var s = sim.state; if (sim.p.topped) { s.level = sim.p.level; return; }
      var sum = jets(sim.p, s.level).reduce(function (a, j) { return a + j.v; }, 0);
      s.level = Math.max(0, s.level - RATIO * sum * 100 * dt);
    },
    status: function (sim) {
      return (sim.running ? 'Flowing' : 'Paused') + ' · t = ' + M.fmt(sim.time, 1) + ' s' + (sim.p.topped ? ' · level held by the tap' : ' · level falling');
    },
    readout: function (sim) {
      var J = jets(sim.p, sim.state.level), best = farthest(J);
      return { lvl: sim.state.level, PA: J[0].P, PB: J[1].P, PC: J[2].P, vC: J[2].v, far: best ? best.n + ' (' + M.fmt(best.R, 0) + ' cm)' : 'no jets' };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, lv = sim.state.level;
      var L = LIQ[p.liquid], J = jets(p, lv), best = farthest(J);
      D.clear(ctx, W, H, c.bg);
      var wide = W >= 560, top = 32;
      var sc = wide ? { x: 0, y: top, w: W * 0.62, h: H - top - 6 } : { x: 0, y: top, w: W, h: (H - top) * 0.6 };
      var k = Math.min(sc.w / 138, sc.h / 110);
      var ox = sc.x + 22 * k + (sc.w - 138 * k) / 2, floorY = sc.y + sc.h - 8 * k;
      function X(cm) { return ox + cm * k; }
      function Y(cm) { return floorY - cm * k; }

      // floor with a 10 cm scale
      D.line(ctx, 0, floorY, sc.x + sc.w, floorY, c.axis, 2);
      for (var d = 0; d <= 110; d += 10) {
        var tx = X(BOT_W + d);
        if (tx > sc.x + sc.w - 4) break;
        D.line(ctx, tx, floorY, tx, floorY + (d % 50 === 0 ? 8 : 4), c.axis, 1);
        if (d % (wide ? 20 : 40) === 0) D.text(ctx, d + ' cm', tx, floorY + 13, { color: c.muted, size: 10, align: 'center' });
      }

      // stool
      var sTop = Y(p.stool);
      if (p.stool > 0) {
        D.roundRect(ctx, X(-4), sTop, 18 * k, Math.max(3, 2.5 * k), 2, c.light ? '#a16207' : '#92400e');
        D.line(ctx, X(-2), sTop, X(-3), floorY, c.light ? '#a16207' : '#92400e', Math.max(2, 1.4 * k));
        D.line(ctx, X(12), sTop, X(13), floorY, c.light ? '#a16207' : '#92400e', Math.max(2, 1.4 * k));
      }
      var base = baseOf(p);

      // jets: parabolas from each hole to the floor, with moving drops
      var t0 = (now || 0) / 1000;
      J.forEach(function (j, i) {
        if (!j.on) return;
        var vx = j.v * 100, tf = Math.sqrt(2 * j.z / 100 / g), hx = X(BOT_W), hy = Y(j.z);
        ctx.save(); ctx.strokeStyle = D.alpha(L.col, 0.75); ctx.lineWidth = Math.max(2, 0.6 * k); ctx.lineCap = 'round'; ctx.beginPath();
        for (var s = 0; s <= 40; s++) { var tt = tf * s / 40; var px = hx + vx * tt * k, py = Y(j.z - 50 * g * tt * tt); if (s) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke(); ctx.restore();
        if (!sim.reduceMotion) for (var q = 0; q < 4; q++) {
          var tt2 = ((t0 * 0.8 + q / 4 + i * 0.13) % 1) * tf;
          D.circle(ctx, hx + vx * tt2 * k, Y(j.z - 50 * g * tt2 * tt2), Math.max(1.5, 0.5 * k), L.col);
        }
        var land = X(BOT_W + j.R);
        D.roundRect(ctx, land - 3 * k, floorY - 1.2 * k, 6 * k, 1.2 * k, 2, D.alpha(L.col, 0.5));
        D.line(ctx, land, floorY + 2, land, floorY + 18 + i * 10, j === best ? c.warning : D.alpha(c.muted, 0.6), 1.5, [3, 3]);
        D.text(ctx, j.n, land, floorY + 26 + i * 10, { color: j === best ? c.warning : c.text, size: 12, weight: 700, align: 'center' });
      });

      // bottle
      var bx = X(0), bw = BOT_W * k, byTop = Y(base + BOT_H), byBot = Y(base);
      ctx.save(); ctx.fillStyle = D.alpha(L.col, 0.55); ctx.fillRect(bx, Y(base + lv), bw, lv * k); ctx.restore();
      D.line(ctx, bx, Y(base + lv), bx + bw, Y(base + lv), L.col, 2);
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(bx, byTop); ctx.lineTo(bx, byBot); ctx.lineTo(bx + bw, byBot); ctx.lineTo(bx + bw, byTop); ctx.stroke(); ctx.restore();
      // tap feeding the bottle
      if (p.topped) {
        var tapX = bx + bw * 0.35, tapY = byTop - 10 * k;
        D.roundRect(ctx, tapX - 6 * k, tapY - 2 * k, 8 * k, 2.4 * k, 2, c.muted);
        D.line(ctx, tapX, tapY, tapX, Y(base + lv), D.alpha(L.col, 0.8), Math.max(2, 0.8 * k));
      }
      // holes, depth markers and side pressure arrows
      J.forEach(function (j) {
        var hy = Y(base + j.zb);
        D.circle(ctx, X(BOT_W), hy, Math.max(2, 0.5 * k), c.bg, c.ink, 1.5);
        D.text(ctx, j.n, bx - 4, hy, { color: c.text, size: 11, weight: 700, align: 'right' });
        if (j.on) {
          var al = Math.min(14 * k, 3 + j.P / 3000 * 12 * k);
          D.arrow(ctx, bx + 2, hy, bx + 2 + Math.min(al, bw * 0.9), hy, c.warning, 2, 6);
        }
      });
      // depth of C, shown as a bracket
      var jc = J[2];
      if (jc.on && wide) {
        var qx = X(-9);
        D.line(ctx, qx, Y(base + lv), qx, Y(base + jc.zb), c.accent, 1.5);
        D.line(ctx, qx - 3, Y(base + lv), qx + 3, Y(base + lv), c.accent, 1.5);
        D.line(ctx, qx - 3, Y(base + jc.zb), qx + 3, Y(base + jc.zb), c.accent, 1.5);
        D.text(ctx, 'h = ' + M.fmt(jc.h, 0) + ' cm', qx - 5, Y(base + (lv + jc.zb) / 2), { color: c.accent, size: 11, weight: 700, align: 'right', fit: W });
      }

      // panel: pressure and jet speed for each hole
      var px2 = wide ? W * 0.64 : 14, py = wide ? top + 10 : sc.y + sc.h + 34, pw = wide ? W * 0.34 : W - 28, ph = wide ? H - py - 10 : H - py - 6;
      var Pmax = 1025 * g * 0.26, rowH = Math.min(52, (ph - 18) / 3);
      var compact = rowH < 40;
      if (compact) {   // short phone canvas: one line per hole, no heading
        rowH = Math.min(26, (ph + 6) / 3);
        J.forEach(function (j, i) {
          var y = py - 4 + i * rowH, labW = 66, valW = 118, bw2 = Math.max(20, pw - labW - valW);
          D.text(ctx, j.n + ' · ' + M.fmt(j.h, 0) + ' cm', px2, y + 5, { color: c.text, size: 11, weight: 700 });
          D.roundRect(ctx, px2 + labW, y, bw2, 9, 3, D.alpha(c.muted, 0.18));
          D.roundRect(ctx, px2 + labW, y, Math.max(2, bw2 * Math.min(1, j.P / Pmax)), 9, 3, c.warning);
          D.text(ctx, j.on ? M.fmt(j.P, 0) + ' Pa · lands ' + M.fmt(j.R, 0) + ' cm' : 'no jet', px2 + labW + bw2 + 6, y + 5, { color: c.muted, size: 10, fit: W });
        });
      }
      if (!compact) D.text(ctx, 'Pressure on the wall at each hole', px2, py, { color: c.text, size: 12, weight: 700, fit: W });
      if (!compact) J.forEach(function (j, i) {
        var y = py + 16 + i * rowH;
        D.text(ctx, j.n + ' · depth ' + M.fmt(j.h, 0) + ' cm', px2, y + 6, { color: c.text, size: 11, weight: 700 });
        D.roundRect(ctx, px2, y + 14, pw, 10, 3, D.alpha(c.muted, 0.18));
        D.roundRect(ctx, px2, y + 14, Math.max(2, pw * Math.min(1, j.P / Pmax)), 10, 3, c.warning);
        D.text(ctx, j.on ? M.fmt(j.P, 0) + ' Pa · ' + M.fmt(j.v, 2) + ' m/s · lands ' + M.fmt(j.R, 0) + ' cm' : 'above the surface: no jet', px2, y + 34, { color: c.muted, size: 11, fit: W });
      });

      // headline
      var msg, col = c.success;
      if (!best) { msg = 'All holes are above the surface: no pressure, no jets'; col = c.muted; }
      else if (best.n === 'C' || !J[2].on) msg = 'Deeper hole → more pressure → faster jet';
      else { msg = wide ? 'Low stool: jet ' + best.n + ' lands farthest (C is fastest but falls less far)' : 'Low: ' + best.n + ' lands farthest, C is fastest'; col = c.warning; }
      D.text(ctx, msg, W / 2, 15, { color: col, size: wide ? 14 : 11, weight: 700, align: 'center', fit: W });
    }
  });

  function farthest(J) {
    var b = null;
    J.forEach(function (j) { if (j.on && (!b || j.R > b.R + 0.05)) b = j; });
    return b;
  }
})();
