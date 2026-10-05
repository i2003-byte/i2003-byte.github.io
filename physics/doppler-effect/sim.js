/* =====================================================================
   Waves · Doppler Effect — sim.js
   ---------------------------------------------------------------------
   A vehicle with a siren of frequency f drives along a straight road
   (y = 0) at speed vs, starting at x = 0 when t = 0. A listener stands
   at (lx, ly). Sound travels at v = 340 m/s in still air.
   The sound heard at time t left the source at time te, found from
     v (t − te) = distance from S(te) to the listener
   (a quadratic in τ = t − te). The heard frequency is
     f' = f / (1 − (vs/v) cos θ)
   where θ is the angle between the velocity and the line from S(te) to
   the listener. Straight ahead: f v/(v − vs); straight behind:
   f v/(v + vs). Circles are drawn every 0.1 s (one per many crests).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var V = 340, XW = 400, DTW = 0.1, voice = null;

  function src(p, t) { return p.vs * t; }
  function heard(p, s, t) { // {f, te, d} or null if no sound has arrived yet
    var vs = p.vs, d = src(p, t) - s.lx, ly = s.ly;
    var a = V * V - vs * vs, tau = (-d * vs + Math.sqrt(d * d * vs * vs + a * (d * d + ly * ly))) / a;
    var te = t - tau; if (te < 0) return null;
    var rx = s.lx - src(p, te), R = Math.hypot(rx, ly) || 1;
    return { f: p.f / (1 - vs / V * rx / R), te: te, R: R };
  }

  SimLab.createSim({
    ariaLabel: 'A vehicle with a siren drives past a listener; circular sound wavefronts bunch up in front of it and spread out behind it, and a graph shows the pitch the listener hears dropping as the vehicle passes',
    audio: true,
    mobileAspect: '4 / 5',
    params: [
      { id: 'vs', label: 'Speed of the vehicle vs', min: 0, max: 300, step: 1, value: 40, unit: 'm/s', presets: [{ label: 'Ambulance 25', value: 25 }, { label: 'Train 40', value: 40 }, { label: 'Race car 90', value: 90 }, { label: 'Jet 250', value: 250 }] },
      { id: 'f', label: 'Siren frequency f', min: 200, max: 1000, step: 10, value: 500, unit: 'Hz' }
    ],
    readouts: [
      { id: 'fh', label: 'Listener hears now', unit: 'Hz', digits: 0, key: true },
      { id: 'fa', label: 'Heard straight ahead f·v/(v − vs)', unit: 'Hz', digits: 0, key: true },
      { id: 'fb', label: 'Heard straight behind f·v/(v + vs)', unit: 'Hz', digits: 0 },
      { id: 'kmh', label: 'Vehicle speed', unit: 'km/h', digits: 0 },
      { id: 'mach', label: 'vs ÷ v (speed of sound 340 m/s)', digits: 2 }
    ],
    graph: { title: 'Frequency the listener hears vs time', yLabel: 'frequency (Hz)', series: [{ label: 'heard f′' }, { label: 'siren f' }], window: 14 },

    reset: function (sim) {
      var s = sim.state || {};
      sim.state = { lx: s.lx == null ? 250 : s.lx, ly: s.ly == null ? 30 : s.ly };
    },
    update: function () {},
    finished: function (sim) { return src(sim.p, sim.time) > XW + 20 && sim.time > (XW + 20) / V + 2; },
    onParam: function () { return true; },
    sample: function (sim) { var h = heard(sim.p, sim.state, sim.time); return [h ? h.f : NaN, sim.p.f]; },
    readout: function (sim) {
      var p = sim.p, h = heard(p, sim.state, sim.time);
      return { fh: h ? h.f : null, fa: p.f * V / (V - p.vs), fb: p.f * V / (V + p.vs), kmh: p.vs * 3.6, mach: p.vs / V };
    },
    status: function (sim) {
      var h = heard(sim.p, sim.state, sim.time);
      return (sim.running ? 'Running' : 'Paused') + ' · ' + (sim.time === 0 ? 'tap the road side to move the listener' : h ? 'hearing ' + Math.round(h.f) + ' Hz' : 'sound has not reached the listener yet');
    },
    pointer: {
      down: function (sim, x, y) {
        var g = sim.state.g; if (!g) return false;
        sim.state.lx = M.clamp((x - g.ox) / g.k, 0, XW);
        var ly = (g.oy - y) / g.k; sim.state.ly = Math.abs(ly) < 8 ? (ly < 0 ? -8 : 8) : M.clamp(ly, -g.ymax, g.ymax);
        return false;
      }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, s = sim.state, W = sim.width, H = sim.height, t = sim.time;
      D.clear(ctx, W, H, c.bg);
      var small = W < 560, fs = small ? 10 : 12;
      var k = (W - 20) / (XW + 20), ox = 10 + 10 * k, oy = H * 0.5;
      s.g = { ox: ox, oy: oy, k: k, ymax: (H / 2 - 24) / k };
      function PX(x) { return ox + x * k; } function PY(y) { return oy - y * k; }
      var h = heard(p, s, t);
      syncVoice(sim, h);
      // road
      D.roundRect(ctx, 0, oy - 9, W, 18, 0, D.alpha(c.muted, 0.15));
      D.line(ctx, 0, oy, W, oy, D.alpha(c.muted, 0.5), 1, [10, 10]);
      // wavefronts
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      var n0 = Math.max(0, Math.floor((t - (XW * 1.5) / V) / DTW));
      for (var n = n0; n * DTW <= t; n++) {
        var te = n * DTW, r = V * (t - te) * k;
        D.circle(ctx, PX(src(p, te)), oy, r, null, D.alpha(c.s1, Math.max(0.15, 0.85 - (t - te) * 0.4)), 1.5);
      }
      ctx.restore();
      // vehicle
      var vx = PX(src(p, t)), vw = small ? 26 : 34, vh = small ? 12 : 16;
      if (vx < W + vw) {
        D.roundRect(ctx, vx - vw / 2, oy - vh / 2, vw, vh, 4, c.light ? '#f8fafc' : '#e2e8f0', c.danger, 2);
        D.text(ctx, '+', vx - vw * 0.15, oy, { color: c.danger, size: vh, weight: 700, align: 'center' });
        D.circle(ctx, vx + vw * 0.25, oy - vh / 2 - 2, 3, Math.floor(t * 4) % 2 ? c.danger : '#3b82f6');
        if (p.vs > 0) D.arrow(ctx, vx + vw / 2 + 2, oy - vh, vx + vw / 2 + 2 + Math.max(12, p.vs * 0.25), oy - vh, c.s4, 2, 7);
      }
      // listener
      var lx = PX(s.lx), ly = PY(s.ly);
      D.circle(ctx, lx, ly - 7, 5, c.s3);
      D.roundRect(ctx, lx - 5, ly - 2, 10, 12, 3, c.s3);
      var lab = h ? Math.round(h.f) + ' Hz' : '…';
      D.text(ctx, 'you hear ' + lab, lx, ly + (s.ly >= 0 ? -22 : 22), { color: c.bg, bg: c.s3, size: fs - 0.5, weight: 700, align: 'center', pad: 3, fit: W });
      // the path of the sound that is reaching the listener now
      if (h) D.line(ctx, PX(src(p, h.te)), oy, lx, ly, D.alpha(c.s3, 0.6), 1, [3, 3]);
      // ahead / behind labels
      if (vx > 40 && vx < W - 40 && p.vs > 0) {
        D.text(ctx, small ? 'ahead: higher' : 'ahead: crowded, higher pitch', vx + vw / 2 + 4, oy + (small ? 20 : 26), { color: c.s2, size: fs - 1.5, weight: 600, fit: W });
        D.text(ctx, small ? 'behind: lower' : 'behind: spread out, lower pitch', vx - vw / 2 - 4, oy + (small ? 20 : 26), { color: c.s2, size: fs - 1.5, weight: 600, align: 'right', fit: W });
      }
      if (p.vs >= V * 0.85) D.text(ctx, 'Close to the speed of sound: the waves pile up into a shock wave', W / 2, H - 12, { color: c.bg, bg: c.danger, size: fs - 1, weight: 700, align: 'center', pad: 3, fit: W });
      // scale bar
      D.line(ctx, 10, 14, 10 + 100 * k, 14, c.muted, 2);
      D.text(ctx, '100 m', 14 + 100 * k, 14, { color: c.muted, size: 9.5 });
      if (t === 0) D.text(ctx, 'Press ▶ Play · tap to move the listener', W / 2, H * 0.82, { color: c.bg, bg: c.s3, size: fs + 0.5, weight: 700, align: 'center', pad: 5, fit: W });
    }
  });

  function syncVoice(sim, h) {
    var on = sim.running && A.enabled && h;
    if (on) {
      if (!voice) voice = A.voice('triangle');
      voice.set(h.f, M.clamp(0.35 * 60 / Math.max(60, h.R), 0.05, 0.35));
    } else if (voice) { voice.stop(); voice = null; }
  }
})();
