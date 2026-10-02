/* =====================================================================
   Work, energy and power · Roller Coaster Energy — sim.js
   ---------------------------------------------------------------------
   A cart is released from rest at height h on a smooth track with a
   valley, an 18 m hump, a second valley and a tall end wall.
   Along the track (arc length s, slope angle α):
     dv/dt = −g sin α − μ g cos α · sign(v)
     PE = m g y,  KE = ½ m v²,  heat = Σ μ m g cos α |ds|
     PE + KE + heat = m g h  (always)
   With no friction the cart always comes back to its starting height;
   with friction some energy turns into heat on every metre and the
   cart finally settles in a valley.
   Simplifications: the cart is held on the rails (it can't fly off),
   friction uses μ g cos α and ignores the extra push of curved track,
   and there is no air drag. Speed is corrected from the energy total
   each step so the numbers stay exact.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var g = 9.8, XMAX = 42, YMAX = 46;
  var KEYS = [[0, 42], [11, 0], [21, 18], [30, 3], [42, 44]];
  var MU = { none: 0, low: 0.02, high: 0.06 };

  function trackY(x) {
    for (var k = 0; k < KEYS.length - 1; k++) {
      var a = KEYS[k], b = KEYS[k + 1];
      if (x <= b[0] || k === KEYS.length - 2) {
        var t = M.clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
        return a[1] + (b[1] - a[1]) * (1 - Math.cos(Math.PI * t)) / 2;
      }
    }
    return 0;
  }
  // arc-length table
  var N = 4200, TX = new Float64Array(N + 1), TY = new Float64Array(N + 1), TS = new Float64Array(N + 1);
  (function () {
    for (var i = 0; i <= N; i++) {
      TX[i] = XMAX * i / N; TY[i] = trackY(TX[i]);
      TS[i] = i ? TS[i - 1] + Math.hypot(TX[i] - TX[i - 1], TY[i] - TY[i - 1]) : 0;
    }
  })();
  var STOT = TS[N];
  function at(s) {
    s = M.clamp(s, 0, STOT);
    var lo = 0, hi = N;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (TS[mid] <= s) lo = mid; else hi = mid; }
    var ds = TS[hi] - TS[lo] || 1e-9, f = (s - TS[lo]) / ds;
    return { x: TX[lo] + (TX[hi] - TX[lo]) * f, y: TY[lo] + (TY[hi] - TY[lo]) * f,
      sin: (TY[hi] - TY[lo]) / ds, cos: (TX[hi] - TX[lo]) / ds };
  }
  function releaseS(h) {
    // first slope: from (0,42) down to (11,0); find x with y = h
    var t = Math.acos(M.clamp(1 - 2 * (42 - h) / 42, -1, 1)) / Math.PI, x = 11 * t;
    var i = Math.round(x / XMAX * N);
    return TS[i];
  }

  SimLab.createSim({
    ariaLabel: 'A roller-coaster cart running along a track with a valley and a hump, with live bars for potential energy, kinetic energy, heat and total energy',
    mobileAspect: '3 / 4',
    params: [
      { id: 'h', label: 'Release height h', min: 5, max: 40, step: 1, value: 30, unit: 'm',
        presets: [{ label: '15 m', value: 15 }, { label: '20 m', value: 20 }, { label: '30 m', value: 30 }, { label: '40 m', value: 40 }],
        help: 'The hump in the middle is 18 m high.' },
      { id: 'm', label: 'Mass of cart with riders m', min: 100, max: 1000, step: 50, value: 400, unit: 'kg' },
      { id: 'fr', label: 'Friction', type: 'select', value: 'none', options: [
        { value: 'none', label: 'None (ideal track)' }, { value: 'low', label: 'A little (μ = 0.02)' }, { value: 'high', label: 'More (μ = 0.06)' }] }
    ],
    readouts: [
      { id: 'y', label: 'Height above the ground', unit: 'm', digits: 1 },
      { id: 'v', label: 'Speed', unit: 'm/s', digits: 1, key: true },
      { id: 'kmh', label: 'Speed', unit: 'km/h', digits: 0 },
      { id: 'pe', label: 'Potential energy m g h', unit: 'kJ', digits: 1 },
      { id: 'ke', label: 'Kinetic energy ½ m v²', unit: 'kJ', digits: 1 },
      { id: 'heat', label: 'Turned into heat by friction', unit: 'kJ', digits: 1 },
      { id: 'tot', label: 'Total PE + KE + heat', unit: 'kJ', digits: 1 }
    ],
    graph: { title: 'Energy as the cart runs', yLabel: 'kJ', window: 20, yMin: 0,
      series: [{ label: 'PE', color: '--sim-1' }, { label: 'KE', color: '--sim-2' }, { label: 'Heat', color: '--danger' }, { label: 'Total', color: '--text-muted' }] },

    reset: function (sim) { sim.state = { s: releaseS(sim.p.h), v: 0, heat: 0, stopped: false, stillT: 0 }; },
    update: function (sim, dt) {
      var st = sim.state, p = sim.p, mu = MU[p.fr] || 0, m = p.m;
      if (st.stopped) return;
      var q = at(st.s), sgn = st.v > 0 ? 1 : st.v < 0 ? -1 : 0;
      if (sgn === 0 && Math.abs(q.sin) <= mu * q.cos) { st.stillT += dt; if (st.stillT > 0.3) st.stopped = true; return; }
      st.stillT = 0;
      var a = -g * q.sin - mu * g * q.cos * (sgn || -Math.sign(q.sin));
      var v2 = st.v + a * dt;
      if (mu > 0 && sgn !== 0 && v2 * sgn < 0) v2 = 0; // friction can stop the cart but not push it back
      var ds = v2 * dt, s2 = M.clamp(st.s + ds, 0, STOT);
      st.heat += mu * m * g * q.cos * Math.abs(s2 - st.s);
      st.s = s2; st.v = v2;
      var KEt = m * g * p.h - st.heat - m * g * at(st.s).y;
      if (st.v !== 0 && KEt > 0) st.v = Math.sign(st.v) * Math.sqrt(2 * KEt / m);
    },
    finished: function (sim) { return sim.state.stopped; },
    status: function (sim) {
      var st = sim.state;
      if (st.stopped) return 'The cart has stopped: all its starting energy is now heat and PE';
      if (sim.time === 0 && !sim.running) return 'Press Play to release the cart';
      return (sim.running ? 'Running' : 'Paused') + ' · t = ' + M.fmt(sim.time, 1) + ' s';
    },
    readout: function (sim) {
      var st = sim.state, m = sim.p.m, q = at(st.s), ke = 0.5 * m * st.v * st.v, pe = m * g * q.y;
      return { y: q.y, v: Math.abs(st.v), kmh: Math.abs(st.v) * 3.6, pe: pe / 1000, ke: ke / 1000, heat: st.heat / 1000, tot: (pe + ke + st.heat) / 1000 };
    },
    sample: function (sim) {
      var st = sim.state, m = sim.p.m, q = at(st.s), ke = 0.5 * m * st.v * st.v, pe = m * g * q.y;
      return [pe / 1000, ke / 1000, st.heat / 1000, (pe + ke + st.heat) / 1000];
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, st = sim.state, narrow = W < 560;
      D.clear(ctx, W, H, c.bg);
      var m = p.m, q = at(st.s), pe = m * g * q.y, ke = 0.5 * m * st.v * st.v, E0 = m * g * p.h;

      // layout: track area and bar area
      var top = 34, tx0 = narrow ? 34 : 44, tx1, ty1, bx0, bx1, by0, by1;
      if (narrow) { tx1 = W - 12; ty1 = Math.round(H * 0.6); bx0 = 14; bx1 = W - 14; by0 = ty1 + 30; by1 = H - 30; }
      else { tx1 = Math.round(W * 0.68); ty1 = H - 30; bx0 = tx1 + 26; bx1 = W - 16; by0 = top + 26; by1 = H - 34; }
      var kx = (tx1 - tx0) / XMAX, ky = (ty1 - top) / YMAX;
      function X(x) { return tx0 + x * kx; }
      function Y(y) { return ty1 - y * ky; }

      // headline
      var head = p.fr === 'none' ? 'No friction: PE + KE stays ' + M.fmt(E0 / 1000, 1) + ' kJ all the time'
        : 'PE + KE + heat = ' + M.fmt(E0 / 1000, 1) + ' kJ all the time';
      D.text(ctx, head, W / 2, 15, { color: c.bg, bg: c.s1, size: narrow ? 11.5 : 13, weight: 700, align: 'center', pad: 4, fit: W });

      // height scale
      for (var hm = 0; hm <= 40; hm += 10) {
        D.line(ctx, tx0 - 4, Y(hm), tx1, Y(hm), hm ? D.alpha(c.grid, 0.9) : c.ink, hm ? 1 : 2);
        D.text(ctx, hm + ' m', tx0 - 6, Y(hm), { color: c.faint, size: 10, align: 'right' });
      }
      // track (filled support below)
      ctx.save(); ctx.beginPath(); ctx.moveTo(X(0), Y(0));
      for (var i = 0; i <= N; i += 20) ctx.lineTo(X(TX[i]), Y(TY[i]));
      ctx.lineTo(X(XMAX), Y(0)); ctx.closePath(); ctx.fillStyle = D.alpha(c.muted, 0.12); ctx.fill();
      ctx.beginPath();
      for (i = 0; i <= N; i += 10) { if (i) ctx.lineTo(X(TX[i]), Y(TY[i])); else ctx.moveTo(X(TX[i]), Y(TY[i])); }
      ctx.strokeStyle = c.ink; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      D.text(ctx, 'hump 18 m', X(21), Y(18) + 14, { color: c.faint, size: 10, align: 'center' });

      // energy level lines
      D.line(ctx, tx0, Y(p.h), tx1, Y(p.h), D.alpha(c.warning, 0.9), 1.5, [6, 4]);
      D.text(ctx, 'start height ' + p.h + ' m', tx1 - 2, Y(p.h) - 9, { color: c.warning, size: 10.5, weight: 600, align: 'right', bg: D.alpha(c.bg, 0.75), fit: W });
      if (st.heat > 1) {
        var hr = p.h - st.heat / (m * g);
        D.line(ctx, tx0, Y(hr), tx1, Y(hr), D.alpha(c.danger, 0.9), 1.3, [3, 4]);
        D.text(ctx, 'highest it can now reach ' + M.fmt(hr, 1) + ' m', tx1 - 2, Y(hr) + 10, { color: c.danger, size: 10, weight: 600, align: 'right', bg: D.alpha(c.bg, 0.75), fit: W });
      }

      // cart, tilted along the screen slope
      var ang = Math.atan2(-q.sin * ky, q.cos * kx), cw = narrow ? 24 : 32, ch = narrow ? 12 : 15;
      ctx.save(); ctx.translate(X(q.x), Y(q.y)); ctx.rotate(ang);
      D.roundRect(ctx, -cw / 2, -ch - 5, cw, ch, 4, '#dc2626', D.alpha('#000', 0.45), 1.2);
      D.circle(ctx, -cw / 2 + 2.5, -5, 3.2, c.ink); D.circle(ctx, -cw / 2 + 5, -ch - 9, 3.5, '#fcd34d');
      D.circle(ctx, cw / 2 - 5, -3, 3.5, '#1f2937', c.ink, 1); D.circle(ctx, -cw / 2 + 5, -3, 3.5, '#1f2937', c.ink, 1);
      ctx.restore();
      var vs = Math.abs(st.v);
      if (vs > 0.3) {
        var dir = st.v > 0 ? 1 : -1, L = Math.min(50, 8 + vs * 1.6), ux = Math.cos(ang) * dir, uy = Math.sin(ang) * dir;
        var ax = X(q.x) - Math.sin(ang) * 26, ay = Y(q.y) + Math.cos(ang) * -26;
        D.arrow(ctx, ax, ay, ax + ux * L, ay + uy * L, c.s2, 2.5, 8);
      }
      D.text(ctx, 'v = ' + M.fmt(vs, 1) + ' m/s', X(q.x), Math.max(top + 4, Y(q.y) - 44), { color: c.s2, size: 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), fit: W });

      // energy bars
      var bars = [
        { l: 'PE', v: pe, col: c.s1 }, { l: 'KE', v: ke, col: c.s2 },
        { l: 'Heat', v: st.heat, col: c.danger }, { l: 'Total', v: pe + ke + st.heat, col: c.muted }];
      var bw = (bx1 - bx0) / bars.length, base = by1;
      if (!narrow) D.text(ctx, 'Energy (kJ)', (bx0 + bx1) / 2, by0 - 14, { color: c.muted, size: 12, weight: 600, align: 'center' });
      else D.text(ctx, 'Energy now (kJ)', 14, ty1 + 14, { color: c.muted, size: 11, weight: 600 });
      if (narrow) {
        // horizontal bars on phones
        var rh = (by1 - by0) / bars.length, lx = bx0 + 40;
        bars.forEach(function (b, k) {
          var yy = by0 + k * rh + rh * 0.15, hh = rh * 0.62, wv = (bx1 - lx - 56) * M.clamp(b.v / E0, 0, 1.02);
          D.text(ctx, b.l, bx0, yy + hh / 2, { color: c.text, size: 11, weight: 600 });
          D.roundRect(ctx, lx, yy, bx1 - lx - 56, hh, 4, D.alpha(c.muted, 0.1));
          if (wv > 0.5) D.roundRect(ctx, lx, yy, wv, hh, 4, b.col);
          D.text(ctx, M.fmt(b.v / 1000, 1), bx1, yy + hh / 2, { color: c.text, size: 11, weight: 700, align: 'right' });
        });
      } else {
        bars.forEach(function (b, k) {
          var x = bx0 + k * bw + bw * 0.18, w = bw * 0.64, hv = (base - by0 - 18) * M.clamp(b.v / E0, 0, 1.02);
          D.roundRect(ctx, x, by0 + 18, w, base - by0 - 18, 4, D.alpha(c.muted, 0.1));
          if (hv > 0.5) D.roundRect(ctx, x, base - hv, w, hv, 4, b.col);
          D.text(ctx, M.fmt(b.v / 1000, 1), x + w / 2, base - hv - 9, { color: c.text, size: 11, weight: 700, align: 'center' });
          D.text(ctx, b.l, x + w / 2, base + 13, { color: c.text, size: 11.5, weight: 600, align: 'center' });
        });
      }
    }
  });
})();
