/* =====================================================================
   Gravitation · Satellites and the Geostationary Orbit — sim.js
   ---------------------------------------------------------------------
   View from above the North Pole. Earth turns once per sidereal day
   (86 164 s). A satellite moves on a circular orbit of radius r = R + h
   above the equator, in the same direction as Earth turns.
     Gravity gives the centripetal force:  GM m / r² = m v² / r
       v = √(GM / r),   T = 2π √(r³ / GM)   (Kepler's third law)
     Geostationary: T = 86 164 s  →  r = (GM T² / 4π²)^(1/3) = 42 164 km,
     h = 35 786 km above the equator.
   Motion is exact (uniform circular), so no integrator is needed.
   Time runs at 1 hour per second (× the speed buttons).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var GM = 3.986004e14, R = 6.378e6, TE = 86164.1, RATE = 3600;
  var CMP = { none: null, iss: { h: 408, name: 'ISS' }, gps: { h: 20200, name: 'GPS' }, geo: { h: 35786, name: 'Geostationary' } };
  var START = Math.PI / 2; // India's longitude starts at the top of the picture

  function orbit(hkm) { var r = R + hkm * 1000; return { r: r, v: Math.sqrt(GM / r), T: 2 * Math.PI * Math.sqrt(r * r * r / GM), w: Math.sqrt(GM / (r * r * r)) }; }
  function wrap(a) { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; }
  function fmtT(T) { var h = Math.floor(T / 3600), m = Math.round((T - h * 3600) / 60); if (m === 60) { h++; m = 0; } return h + ' h ' + m + ' min'; }
  function visible(theta, r, phi) { // is the satellite above the horizon at the station?
    var sx = Math.cos(phi), sy = Math.sin(phi);
    return (r * Math.cos(theta) - R * sx) * sx + (r * Math.sin(theta) - R * sy) * sy > 0;
  }

  SimLab.createSim({
    ariaLabel: 'Earth seen from above the North Pole, turning, with a satellite on a circular orbit and a ground station at India\'s longitude; a geostationary satellite stays above the station',
    autoplay: true,
    params: [
      { id: 'h', label: 'Height above the equator h', min: 200, max: 40000, step: 1, value: 8000, unit: 'km',
        presets: [{ label: 'ISS 408', value: 408 }, { label: 'GPS 20 200', value: 20200 }, { label: 'Geostationary 35 786', value: 35786 }] },
      { id: 'cmp', label: 'Compare with', type: 'select', value: 'geo', options: [
        { value: 'none', label: 'Nothing' }, { value: 'iss', label: 'ISS (408 km)' }, { value: 'gps', label: 'GPS (20 200 km)' }, { value: 'geo', label: 'Geostationary (35 786 km)' }] }
    ],
    readouts: [
      { id: 'r', label: 'Orbit radius r = R + h', unit: 'km', digits: 0 },
      { id: 'v', label: 'Orbital speed √(GM/r)', unit: 'km/s', digits: 2, key: true },
      { id: 'T', label: 'Period 2π√(r³/GM)', key: true },
      { id: 'g', label: 'Gravity there (g at h)', unit: 'm/s²', digits: 2 },
      { id: 'dr', label: 'Drift vs India per day', unit: '°', digits: 1 },
      { id: 'vis', label: 'Seen from India now?' }
    ],
    graph: { title: 'Where is the satellite? (angle ahead of India)', xLabel: 'time (hours)', yLabel: 'angle (°)', series: [{ label: 'your satellite' }, { label: 'comparison' }], window: 24, yMin: -180, yMax: 180 },

    onParam: function () { return true; },
    reset: function (sim) {
      sim.state = { t: 0, gacc: 0 };
      if (sim.graph) sim.graph.push(0, [0, CMP[sim.p.cmp] ? 0 : NaN]);
    },
    update: function (sim, dt) {
      var s = sim.state; s.t += RATE * dt; s.gacc += dt;
      if (s.gacc >= 1 / 30 && sim.graph) {
        s.gacc = 0;
        var phi = s.t / TE * 2 * Math.PI, c = CMP[sim.p.cmp];
        sim.graph.push(s.t / 3600, [wrap(orbit(sim.p.h).w * s.t - phi) * 180 / Math.PI, c ? wrap(orbit(c.h).w * s.t - phi) * 180 / Math.PI : NaN]);
      }
    },
    readout: function (sim) {
      var o = orbit(sim.p.h), s = sim.state, phi = START + s.t / TE * 2 * Math.PI, th = START + o.w * s.t;
      var drift = (o.w - 2 * Math.PI / TE) * 86400 * 180 / Math.PI;
      return {
        r: o.r / 1000, v: o.v / 1000, T: fmtT(o.T), g: GM / (o.r * o.r), dr: Math.abs(drift) < 0.05 ? 0 : drift,
        vis: Math.abs(drift) < 0.05 ? 'yes, always overhead' : (visible(th, o.r, phi) ? 'yes' : 'no (below horizon)')
      };
    },
    status: function (sim) {
      var t = sim.state.t, d = Math.floor(t / 86400), hh = (t - d * 86400) / 3600;
      return (sim.running ? 'Running' : 'Paused') + ' · day ' + (d + 1) + ', ' + M.fmt(hh, 1) + ' h · 1 s = 1 hour';
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, s = sim.state, p = sim.p, W = sim.width, H = sim.height;
      var space = c.light ? '#e0e7ff' : '#05070f';
      D.clear(ctx, W, H, space);
      var rnd = M.rng(5);
      for (var i = 0; i < 80; i++) D.circle(ctx, rnd() * W, rnd() * H, rnd() * 1.1 + 0.3, D.alpha(c.light ? '#64748b' : '#ffffff', 0.25 + rnd() * 0.4));
      var small = W < 560, fs = small ? 10.5 : 12;
      var o = orbit(p.h), cm = CMP[p.cmp], oc = cm ? orbit(cm.h) : null;
      var rmax = Math.max(o.r, oc ? oc.r : 0, R * 1.5);
      var cx = W / 2, cy = 30 + (H - 30) / 2, sc = Math.min(W / 2 - 14, (H - 30) / 2 - 12) / (rmax * 1.06), Re = R * sc;
      var phi = START + s.t / TE * 2 * Math.PI;
      function P(r, a) { return { x: cx + r * sc * Math.cos(a), y: cy - r * sc * Math.sin(a) }; }

      // Earth: ocean, turning meridians, India marker
      var g = ctx.createRadialGradient(cx - Re * 0.3, cy - Re * 0.3, Re * 0.1, cx, cy, Re);
      g.addColorStop(0, '#38bdf8'); g.addColorStop(1, '#1e3a8a');
      D.circle(ctx, cx, cy, Re, g);
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, Re, 0, Math.PI * 2); ctx.clip();
      for (var k = 0; k < 12; k++) { var q = P(R, phi + k * Math.PI / 6); D.line(ctx, cx, cy, q.x, q.y, 'rgba(255,255,255,0.18)', 1); }
      // a land patch around India's longitude (stylised)
      ctx.fillStyle = 'rgba(34,197,94,0.7)'; ctx.beginPath();
      for (var a = 0; a < 2 * Math.PI; a += 0.2) { var lp = P(R * (0.84 + 0.13 * Math.cos(a)), phi + 0.2 * Math.sin(a) * (1 + 0.25 * Math.cos(3 * a))); if (!a) ctx.moveTo(lp.x, lp.y); else ctx.lineTo(lp.x, lp.y); }
      ctx.closePath(); ctx.fill();
      ctx.restore();
      D.circle(ctx, cx, cy, 3, '#fff');
      D.text(ctx, 'N', cx, cy + 10, { color: '#fff', size: 9.5, weight: 700, align: 'center' });
      var st = P(R, phi), stOut = P(R + 9 / sc, phi);
      D.line(ctx, st.x, st.y, stOut.x, stOut.y, c.s4, 3);
      D.circle(ctx, stOut.x, stOut.y, 4, c.s4);
      var lab = P(R + (Re > 60 ? -0.3 * R : 26 / sc), phi);
      D.text(ctx, 'India', lab.x, lab.y, { color: Re > 60 ? '#fff' : c.s4, size: fs - 0.5, weight: 700, align: 'center', bg: Re > 60 ? 'rgba(0,0,0,0.35)' : null, pad: 2, fit: W });

      // comparison orbit
      if (oc) {
        D.circle(ctx, cx, cy, oc.r * sc, null, D.alpha(c.muted, 0.45), 1);
        var pc = P(oc.r, START + oc.w * s.t);
        D.circle(ctx, pc.x, pc.y, 5, c.muted);
        D.text(ctx, cm.name, pc.x + 8, pc.y - 9, { color: c.muted, size: 10, fit: W });
      }

      // your satellite: orbit, line of sight, arrows
      ctx.save(); ctx.setLineDash([6, 5]); D.circle(ctx, cx, cy, o.r * sc, null, D.alpha(c.s3, 0.8), 1.5); ctx.restore();
      var th = START + o.w * s.t, sp = P(o.r, th);
      if (visible(th, o.r, phi)) D.line(ctx, stOut.x, stOut.y, sp.x, sp.y, D.alpha(c.s4, 0.7), 1.5, [3, 3]);
      var al = small ? 24 : 32;
      D.arrow(ctx, sp.x, sp.y, sp.x - Math.sin(th) * al, sp.y - Math.cos(th) * al, c.s2, 2.5, 8);
      D.arrow(ctx, sp.x, sp.y, sp.x - Math.cos(th) * al * 0.8, sp.y + Math.sin(th) * al * 0.8, c.danger, 2.5, 8);
      ctx.save(); ctx.translate(sp.x, sp.y); ctx.rotate(-th);
      D.roundRect(ctx, -10, -3, 20, 6, 1.5, c.light ? '#1d4ed8' : '#93c5fd');
      D.roundRect(ctx, -4, -5, 8, 10, 2, c.light ? '#f59e0b' : '#fbbf24');
      ctx.restore();

      // header
      var drift = (o.w - 2 * Math.PI / TE) * 86400 * 180 / Math.PI;
      var msg = Math.abs(drift) < 0.05 ? 'Geostationary: one orbit per day, stays above India' : drift > 0 ? 'Lower than geostationary: faster than Earth turns' : 'Higher than geostationary: slower than Earth turns';
      D.text(ctx, msg, W / 2, 15, { color: c.bg, bg: Math.abs(drift) < 0.05 ? c.success : c.s3, size: fs, weight: 700, align: 'center', pad: 4, fit: W });
      if (!small || H > 330) {
        D.text(ctx, '→ velocity', 8, H - 22, { color: c.s2, size: 10.5, weight: 600 });
        D.text(ctx, '→ gravity (towards centre)', 8, H - 9, { color: c.danger, size: 10.5, weight: 600 });
      }
    }
  });
})();