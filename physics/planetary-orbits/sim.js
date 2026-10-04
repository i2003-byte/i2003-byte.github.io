/* =====================================================================
   Gravitation · Planetary Orbits (Kepler's laws) — sim.js
   ---------------------------------------------------------------------
   Units: AU, years, solar masses.  G·M☉ = 4π² AU³/yr².
   A planet starts at distance r₀ from the star, moving at right angles
   to the line joining them with speed v₀ (km/s; 1 AU/yr = 4.7404 km/s).
     a'' = −GM r / |r|³       → RK4 with small adaptive steps
   Exact orbit (drawn dashed): h = r₀v₀, p = h²/GM, e = |p/r₀ − 1|,
     r(θ) = p / (1 + e cos(θ − θp));   a = 1 / (2/r₀ − v₀²/GM)
     Kepler 3:  T² = a³ / M   (T in years, a in AU, M in M☉)
   Kepler 2: each bound orbit is cut into 12 equal-time sectors; the
   area of each finished sector (sum of thin triangles) is compared with
   πab/12.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var GM1 = 4 * Math.PI * Math.PI, KMS = 4.740470; // km/s per AU/yr
  var ORBITS = {
    earth: { r: 1, v: 29.78, name: 'Earth' },
    mercury: { r: 0.308, v: 58.90, name: 'Mercury (at perihelion)' },
    mars: { r: 1.381, v: 26.51, name: 'Mars (at perihelion)' },
    halley: { r: 0.586, v: 54.57, name: "Halley's comet (at perihelion)" }
  };
  var gEl = null; // conic elements, set in reset

  function elements(p) {
    var GM = GM1 * p.M, r0 = p.r, v0 = p.v / KMS, h = r0 * v0, pp = h * h / GM;
    var e = Math.abs(pp / r0 - 1), inv = 2 / r0 - v0 * v0 / GM;
    var o = { GM: GM, r0: r0, v0: v0, p: pp, e: e, thp: pp / r0 - 1 >= 0 ? 0 : Math.PI, bound: inv > 1e-9 && e < 0.999 };
    if (o.bound) {
      o.a = 1 / inv; o.b = o.a * Math.sqrt(1 - e * e); o.T = Math.sqrt(o.a * o.a * o.a / p.M);
      o.rp = o.a * (1 - e); o.ra = o.a * (1 + e);
    }
    o.vesc = Math.sqrt(2 * GM / r0) * KMS; o.vcirc = Math.sqrt(GM / r0) * KMS;
    return o;
  }
  // world box to fit on screen
  function box(o) {
    if (o.bound) {
      var cxw = -o.a * o.e * Math.cos(o.thp); // centre of the ellipse (perihelion direction θp)
      return { x0: cxw - o.a, x1: cxw + o.a, y0: -o.b, y1: o.b };
    }
    return { x0: -5 * o.r0, x1: 1.6 * o.r0, y0: -4 * o.r0, y1: 4 * o.r0 };
  }
  function view(sim) {
    var W = sim.width, H = sim.height, b = box(gEl), padT = 34, pad = 18;
    var s = Math.min((W - 2 * pad) / (b.x1 - b.x0), (H - padT - pad) / (b.y1 - b.y0));
    var ox = W / 2 - (b.x0 + b.x1) / 2 * s, oy = padT + (H - padT - pad) / 2 + (b.y0 + b.y1) / 2 * s;
    return { s: s, X: function (x) { return ox + x * s; }, Y: function (y) { return oy - y * s; } };
  }

  SimLab.createSim({
    ariaLabel: 'A planet orbiting a star on an ellipse, with equal-time sectors shaded to show that equal areas are swept in equal times',
    autoplay: true,
    params: [
      { id: 'orbit', label: 'Start like', type: 'select', value: 'custom', options: [
        { value: 'custom', label: 'My own (use the sliders)' }, { value: 'earth', label: 'Earth' }, { value: 'mercury', label: 'Mercury' },
        { value: 'mars', label: 'Mars' }, { value: 'halley', label: "Halley's comet" }] },
      { id: 'r', label: 'Starting distance from the star', min: 0.3, max: 3, step: 0.001, value: 1, unit: 'AU', help: '1 AU = 150 million km, the Earth–Sun distance.' },
      { id: 'v', label: 'Starting speed (sideways)', min: 5, max: 70, step: 0.01, value: 36, unit: 'km/s', help: 'Earth moves at about 29.8 km/s.' },
      { id: 'M', label: 'Mass of the star', min: 0.5, max: 2, step: 0.1, value: 1, unit: 'M☉' },
      { id: 'areas', label: "Shade equal-time sectors (Kepler's 2nd law)", type: 'toggle', value: true },
      { id: 'geom', label: 'Show foci and axes', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'rr', label: 'Distance r', unit: 'AU', digits: 3 },
      { id: 'sp', label: 'Speed', unit: 'km/s', digits: 1 },
      { id: 'e', label: 'Eccentricity e', digits: 3 },
      { id: 'a', label: 'Semi-major axis a', unit: 'AU', digits: 3 },
      { id: 'T', label: 'Period T', unit: 'years', digits: 3, key: true },
      { id: 'k3', label: 'T² ÷ a³', unit: 'yr²/AU³', digits: 3, key: true },
      { id: 'A1', label: 'Last sector area', unit: 'AU²', digits: 4 },
      { id: 'A0', label: 'πab ÷ 12', unit: 'AU²', digits: 4 }
    ],
    graph: { title: 'Speed vs time', xLabel: 'time (years)', yLabel: 'speed (km/s)', series: [{ label: 'speed' }], window: 2 },

    onParam: function (sim, id, v) {
      if (id === 'orbit' && ORBITS[v]) { sim.setParam('r', ORBITS[v].r); sim.setParam('v', ORBITS[v].v); sim.setParam('M', 1); }
      else if (id === 'r' || id === 'v' || id === 'M') sim.setParam('orbit', 'custom');
      return id === 'areas' || id === 'geom';
    },
    reset: function (sim) {
      var o = gEl = elements(sim.p);
      var tUnit = o.bound ? o.T : 2 * Math.PI * Math.pow(o.r0, 1.5) / Math.sqrt(o.GM);
      sim.state = { x: o.r0, y: 0, vx: 0, vy: o.v0, t: 0, rate: tUnit / 7, trail: [{ x: o.r0, y: 0 }],
        sectors: [], cur: { t0: 0, pts: [{ x: o.r0, y: 0 }], area: 0 }, lastA: null, gacc: 0, gone: false };
      if (sim.graph) { sim.graph.opts.window = o.bound ? Math.min(2 * o.T, 400) : tUnit; sim.graph.push(0, [o.v0 * KMS]); }
    },
    update: function (sim, dt) {
      var s = sim.state, o = gEl; if (s.gone) return;
      var tot = s.rate * dt, done = 0;
      while (done < tot) {
        var r = Math.hypot(s.x, s.y), h = Math.min(tot - done, 0.004 * Math.pow(r, 1.5) / Math.sqrt(o.GM));
        var y = M.rk4([s.x, s.y, s.vx, s.vy], function (u) {
          var d = Math.pow(u[0] * u[0] + u[1] * u[1], 1.5); return [u[2], u[3], -o.GM * u[0] / d, -o.GM * u[1] / d];
        }, h);
        var px = s.x, py = s.y;
        s.x = y[0]; s.y = y[1]; s.vx = y[2]; s.vy = y[3]; s.t += h; done += h;
        if (o.bound) {
          s.cur.area += 0.5 * Math.abs(px * s.y - py * s.x);
          s.cur.pts.push({ x: s.x, y: s.y });
          if (s.t - s.cur.t0 >= o.T / 12) {
            s.lastA = s.cur.area; s.sectors.push(s.cur);
            if (s.sectors.length > 11) s.sectors.shift();
            s.cur = { t0: s.cur.t0 + o.T / 12, pts: [{ x: s.x, y: s.y }], area: 0 };
          }
        }
      }
      var last = s.trail[s.trail.length - 1];
      if (Math.hypot(s.x - last.x, s.y - last.y) > 0.004 * Math.max(o.r0, o.a || 0)) { s.trail.push({ x: s.x, y: s.y }); if (s.trail.length > 1500) s.trail.shift(); }
      s.gacc += dt;
      if (s.gacc >= 1 / 30 && sim.graph) { s.gacc = 0; sim.graph.push(s.t, [Math.hypot(s.vx, s.vy) * KMS]); }
      if (!o.bound && Math.hypot(s.x, s.y) > 7 * o.r0) s.gone = true;
    },
    finished: function (sim) { return sim.state.gone; },
    readout: function (sim) {
      var s = sim.state, o = gEl;
      return {
        rr: Math.hypot(s.x, s.y), sp: Math.hypot(s.vx, s.vy) * KMS, e: o.e,
        a: o.bound ? o.a : 'no ellipse', T: o.bound ? o.T : 'escapes', k3: o.bound ? o.T * o.T / (o.a * o.a * o.a) : '—',
        A1: o.bound ? s.lastA : '—', A0: o.bound ? Math.PI * o.a * o.b / 12 : '—'
      };
    },
    status: function (sim) {
      var s = sim.state, o = gEl;
      if (!o.bound) return (s.gone ? 'Escaped' : (sim.running ? 'Running' : 'Paused')) + ' · speed ≥ escape speed ' + M.fmt(o.vesc, 1) + ' km/s: not an ellipse';
      return (sim.running ? 'Running' : 'Paused') + ' · t = ' + M.fmt(s.t, s.t < 10 ? 2 : 1) + ' years · ' + M.fmt(s.t / o.T, 2) + ' orbits';
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, s = sim.state, p = sim.p, o = gEl, W = sim.width, H = sim.height, v = view(sim);
      var space = c.light ? '#eef2ff' : '#05070f';
      D.clear(ctx, W, H, space);
      var rnd = M.rng(7);
      for (var i = 0; i < 90; i++) D.circle(ctx, rnd() * W, rnd() * H, rnd() * 1.2 + 0.3, D.alpha(c.light ? '#64748b' : '#ffffff', 0.25 + rnd() * 0.4));
      var small = W < 560, fs = small ? 10.5 : 12;

      // Earth's orbit for scale (if it fits sensibly)
      var rE = v.s; if (rE > 6 && rE < Math.max(W, H)) { D.circle(ctx, v.X(0), v.Y(0), rE, null, D.alpha(c.muted, 0.35), 1); D.text(ctx, '1 AU', v.X(0) + rE * 0.71 + 3, v.Y(0) - rE * 0.71 - 6, { color: c.faint, size: 10 }); }

      // equal-time sectors
      if (p.areas && o.bound) {
        var all = s.sectors.concat([s.cur]);
        all.forEach(function (sec, k) {
          if (sec.pts.length < 2) return;
          ctx.beginPath(); ctx.moveTo(v.X(0), v.Y(0));
          sec.pts.forEach(function (q, j) { if (j % 3 === 0 || j === sec.pts.length - 1) ctx.lineTo(v.X(q.x), v.Y(q.y)); });
          ctx.closePath();
          var odd = Math.round(sec.t0 / (o.T / 12)) % 2;
          ctx.fillStyle = D.alpha(odd ? c.s2 : c.s4, sec === s.cur ? 0.18 : 0.32); ctx.fill();
        });
      }

      // predicted orbit (exact conic)
      ctx.save(); ctx.strokeStyle = D.alpha(c.s3, 0.75); ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]); ctx.beginPath();
      var started = false, lim = o.bound ? Math.PI : Math.acos(Math.max(-1, -1 / o.e)) - 0.02;
      for (var th = -lim; th <= lim + 1e-9; th += lim / 180) {
        var rr = o.p / (1 + o.e * Math.cos(th));
        if (!(rr > 0) || rr > 12 * o.r0 && !o.bound) { started = false; continue; }
        var wx = rr * Math.cos(th + o.thp), wy = rr * Math.sin(th + o.thp);
        if (!started) { ctx.moveTo(v.X(wx), v.Y(wy)); started = true; } else ctx.lineTo(v.X(wx), v.Y(wy));
      }
      ctx.stroke(); ctx.restore();

      // foci, axes, perihelion and aphelion
      if (p.geom && o.bound) {
        var ux = Math.cos(o.thp), cxw = -o.a * o.e * ux;
        D.line(ctx, v.X(cxw - o.a), v.Y(0), v.X(cxw + o.a), v.Y(0), D.alpha(c.muted, 0.6), 1, [3, 4]);
        D.line(ctx, v.X(cxw), v.Y(-o.b), v.X(cxw), v.Y(o.b), D.alpha(c.muted, 0.6), 1, [3, 4]);
        if (o.e > 0.02) { D.circle(ctx, v.X(2 * cxw), v.Y(0), 3.5, null, c.muted, 1.5); D.text(ctx, 'empty focus', v.X(2 * cxw), v.Y(0) - 13, { color: c.faint, size: 10, align: 'center', fit: W }); }
        D.text(ctx, 'a', v.X(cxw + o.a * ux * 0.5), v.Y(0) - 9, { color: c.muted, size: 11, weight: 700, align: 'center' });
        D.text(ctx, 'b', v.X(cxw) + 7, v.Y(o.b * 0.5), { color: c.muted, size: 11, weight: 700 });
        if (o.e > 0.02) {
          D.text(ctx, 'perihelion', v.X(o.rp * ux), v.Y(0) + 14, { color: c.s1, size: 10, align: 'center', fit: W });
          D.text(ctx, 'aphelion', v.X(-o.ra * ux), v.Y(0) + 14, { color: c.s1, size: 10, align: 'center', fit: W });
        }
      }

      // trail
      ctx.save(); ctx.strokeStyle = D.alpha(c.s1, 0.85); ctx.lineWidth = 2; ctx.beginPath();
      s.trail.forEach(function (q, j) { if (j) ctx.lineTo(v.X(q.x), v.Y(q.y)); else ctx.moveTo(v.X(q.x), v.Y(q.y)); });
      ctx.lineTo(v.X(s.x), v.Y(s.y)); ctx.stroke(); ctx.restore();

      // star
      var sr = 7 + 4 * p.M, g = ctx.createRadialGradient(v.X(0), v.Y(0), 0, v.X(0), v.Y(0), sr * 2.6);
      g.addColorStop(0, '#fff7cc'); g.addColorStop(0.35, '#fbbf24'); g.addColorStop(1, 'rgba(251,191,36,0)');
      D.circle(ctx, v.X(0), v.Y(0), sr * 2.6, g);
      D.circle(ctx, v.X(0), v.Y(0), sr, '#fde68a');

      // planet with velocity and gravity arrows
      var PX = v.X(s.x), PY = v.Y(s.y), r = Math.hypot(s.x, s.y), sp = Math.hypot(s.vx, s.vy);
      var vl = 26 + 22 * Math.min(1, sp * KMS / 60);
      D.arrow(ctx, PX, PY, PX + s.vx / sp * vl, PY - s.vy / sp * vl, c.s2, 2.5, 8);
      D.arrow(ctx, PX, PY, PX - s.x / r * 24, PY + s.y / r * 24, c.danger, 2.5, 8);
      D.circle(ctx, PX, PY, 6.5, c.light ? '#2563eb' : '#60a5fa', space, 2);

      // header
      var msg = !o.bound ? 'Too fast: the planet escapes (speed ≥ ' + M.fmt(o.vesc, 1) + ' km/s)'
        : (o.e < 0.02 ? 'Nearly a circle: speed ≈ circular speed ' + M.fmt(o.vcirc, 1) + ' km/s' : 'Ellipse with the star at one focus (Kepler 1)');
      D.text(ctx, msg, W / 2, 16, { color: c.bg, bg: o.bound ? c.s3 : c.danger, size: fs, weight: 700, align: 'center', pad: 4, fit: W });
      if (!small || H > 330) {
        D.text(ctx, '→ velocity', 8, H - 22, { color: c.s2, size: 10.5, weight: 600 });
        D.text(ctx, '→ pull of gravity', 8, H - 9, { color: c.danger, size: 10.5, weight: 600 });
      }
    }
  });
})();