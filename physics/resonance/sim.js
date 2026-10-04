/* =====================================================================
   Oscillations · Forced Oscillations and Resonance — sim.js
   ---------------------------------------------------------------------
   A 1 kg block hangs from a spring (constant k). A motor moves the top
   of the spring up and down: y_s = a₀ sin(ω t), a₀ = 1 cm.
   x = displacement of the block from its rest position (up = +).
   (Gravity only shifts the rest position, so it drops out.)
     m x'' = −k (x − y_s) − b x'     → integrated with RK4
   Driving force amplitude F₀ = k a₀. After the start-up wobble dies
   away the block moves at the DRIVING frequency with amplitude
     A = (F₀/m) / √((ω₀² − ω²)² + (bω/m)²),   ω₀ = √(k/m)
   and lags the drive by φ = atan2(bω, k − mω²).
   The measured amplitude is the biggest |x| in each drive cycle. When
   it stops changing (steady state) the point is added to the curve.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var MASS = 1, A0 = 0.01, FMAX = 2.5;

  function w0(p) { return Math.sqrt(p.k / MASS); }
  function ampTheory(p, f) {
    var w = 2 * Math.PI * f, W0 = w0(p);
    return (p.k * A0 / MASS) / Math.sqrt(Math.pow(W0 * W0 - w * w, 2) + Math.pow(p.b * w / MASS, 2));
  }
  function phaseLag(p) { var w = 2 * Math.PI * p.f; return Math.atan2(p.b * w, p.k - MASS * w * w); }
  function settleTime(p) { return 6 * MASS / p.b; }
  function restart(s) { s.since = 0; s.cycles = 0; s.steady = false; s.calm = 0; s.prevPeak = null; }

  SimLab.createSim({
    ariaLabel: 'A block hanging from a spring whose top is shaken up and down by a motor, next to a graph of amplitude against driving frequency that peaks at the natural frequency',
    autoplay: true,
    params: [
      { id: 'f', label: 'Driving frequency (motor)', min: 0.1, max: FMAX, step: 0.01, value: 0.6, unit: 'Hz', help: 'Changes take effect at once; wait for the swing to settle.' },
      { id: 'k', label: 'Spring constant k', min: 10, max: 80, step: 1, value: 40, unit: 'N/m', help: 'Sets the natural frequency f₀ = √(k/m) ÷ 2π (mass is 1 kg).' },
      { id: 'b', label: 'Damping b', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg/s', presets: [{ label: 'Light', value: 0.5 }, { label: 'Medium', value: 1.5 }, { label: 'Heavy', value: 4 }] }
    ],
    readouts: [
      { id: 'f0', label: 'Natural frequency f₀', unit: 'Hz', digits: 2, key: true },
      { id: 'fd', label: 'Driving frequency', unit: 'Hz', digits: 2, key: true },
      { id: 'Am', label: 'Measured amplitude', unit: 'cm', digits: 2 },
      { id: 'At', label: 'Steady amplitude (formula)', unit: 'cm', digits: 2 },
      { id: 'ph', label: 'Block lags motor by', unit: '°', digits: 0 },
      { id: 'st', label: 'State' }
    ],
    graph: { title: 'Block and motor vs time', yLabel: 'displacement (cm)', series: [{ label: 'block x' }, { label: 'top of spring' }], window: 10, symmetric: true },
    buttons: [
      { label: 'Jump to resonance (f = f₀)', primary: true, onClick: function (sim) { sim.setParam('f', Math.round(w0(sim.p) / (2 * Math.PI) * 100) / 100); restart(sim.state); } },
      { label: 'Clear measured points', onClick: function (sim) { sim.state.pts = []; } }
    ],

    onParam: function (sim, id) {
      var s = sim.state; restart(s);
      if (id !== 'f') s.pts = []; // a new spring or damping gives a new curve
      return true;
    },
    reset: function (sim) {
      var pts = sim.state && sim.state.pts || [];
      sim.state = { x: 0, v: 0, ph: 0, peak: 0, Am: null, pts: pts, trail: [] };
      restart(sim.state);
    },
    update: function (sim, dt) {
      var s = sim.state, p = sim.p, w = 2 * Math.PI * p.f, ph0 = s.ph;
      var y = M.rk4([s.x, s.v], function (u, t) {
        var ys = A0 * Math.sin(ph0 + w * t);
        return [u[1], (-p.k * (u[0] - ys) - p.b * u[1]) / MASS];
      }, dt, 0);
      s.x = y[0]; s.v = y[1]; s.since += dt;
      s.peak = Math.max(s.peak, Math.abs(s.x));
      s.ph += w * dt;
      if (s.ph >= 2 * Math.PI) { // one drive cycle finished
        s.ph -= 2 * Math.PI; s.cycles++;
        var pk = s.peak; s.peak = 0; s.Am = pk;
        if (s.prevPeak != null && Math.abs(pk - s.prevPeak) < 0.005 * pk) s.calm++; else s.calm = 0;
        s.prevPeak = pk;
        if (!s.steady && s.calm >= 3 && s.since > settleTime(p)) {
          s.steady = true;
          s.pts = s.pts.filter(function (q) { return Math.abs(q.f - p.f) > 0.005; });
          s.pts.push({ f: p.f, A: pk });
        }
      }
    },
    sample: function (sim) { return [sim.state.x * 100, A0 * Math.sin(sim.state.ph) * 100]; },
    readout: function (sim) {
      var s = sim.state, p = sim.p;
      return {
        f0: w0(p) / (2 * Math.PI), fd: p.f, Am: s.Am == null ? null : s.Am * 100, At: ampTheory(p, p.f) * 100,
        ph: phaseLag(p) * 180 / Math.PI,
        st: s.steady ? 'steady' : (s.since < 0.05 && !sim.running ? 'ready' : 'settling…')
      };
    },
    status: function (sim) {
      var s = sim.state;
      return (sim.running ? 'Running' : 'Paused') + ' · ' + (s.steady ? 'steady: point added to the curve' : 'settling (try 4× speed)') + ' · ' + s.pts.length + ' points';
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, s = sim.state, p = sim.p, W = sim.width, H = sim.height;
      D.clear(ctx, W, H, c.bg);
      var small = W < 560, fs = small ? 10 : 11.5;

      /* ---- left panel: motor, spring and block ---- */
      var LW = Math.min(small ? W * 0.36 : W * 0.34, 260), cx = LW / 2;
      D.roundRect(ctx, 4, 4, LW - 8, H - 8, 10, D.alpha(c.muted, 0.06));
      var top = 28, bottom = H - 14, yRest = top + (bottom - top) * 0.62;
      var span = Math.min(yRest - top - 70, bottom - yRest - 26), pxm = Math.max(span, 30) / 0.2; // ±20 cm fits
      var ys = A0 * Math.sin(s.ph), yTop = top + 26 - ys * pxm;
      // motor wheel with a pin: the pin's height is the drive
      var wr = Math.max(9, A0 * pxm * 1.6), wx = cx - 22, wy = top + 26;
      D.circle(ctx, wx, wy, wr + 4, D.alpha(c.muted, 0.25), c.muted, 1.5);
      var px = wx + A0 * pxm * Math.cos(s.ph), py = wy - A0 * pxm * Math.sin(s.ph);
      D.line(ctx, wx, wy, px, py, c.muted, 2);
      D.circle(ctx, px, py, 3.5, c.s4);
      D.line(ctx, px, py, cx, yTop, c.s4, 2);
      D.text(ctx, 'motor', wx, wy - wr - 12, { color: c.faint, size: 10, align: 'center' });
      D.roundRect(ctx, cx - 14, yTop - 4, 28, 8, 3, c.s4);
      // spring
      var yb = yRest - M.clamp(s.x, -0.22, 0.22) * pxm, side = 30, sTop = yTop + 4, sBot = yb - side / 2, coils = 11;
      ctx.save(); ctx.strokeStyle = c.light ? '#0f766e' : '#5eead4'; ctx.lineWidth = 1.2 + p.k / 50; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(cx, sTop); ctx.lineTo(cx, sTop + 5);
      var len = sBot - sTop - 10;
      for (var n = 0; n < coils * 2; n++) ctx.lineTo(cx + (n % 2 ? 9 : -9), sTop + 5 + len * (n + 0.5) / (coils * 2));
      ctx.lineTo(cx, sBot - 5); ctx.lineTo(cx, sBot); ctx.stroke(); ctx.restore();
      // rest line and amplitude marks
      D.line(ctx, 12, yRest, LW - 12, yRest, D.alpha(c.s3, 0.7), 1.2, [5, 4]);
      D.text(ctx, 'rest', LW - 12, yRest - 8, { color: c.s3, size: 10, align: 'right' });
      if (s.Am != null) {
        var am = Math.min(s.Am, 0.22) * pxm;
        [-1, 1].forEach(function (k) { D.line(ctx, cx + 22, yRest + k * am, cx + 34, yRest + k * am, c.s1, 2); });
        D.line(ctx, cx + 28, yRest - am, cx + 28, yRest + am, D.alpha(c.s1, 0.5), 1);
      }
      var grad = ctx.createLinearGradient(cx, yb - side / 2, cx, yb + side / 2);
      grad.addColorStop(0, c.light ? '#fdba74' : '#fb923c'); grad.addColorStop(1, c.light ? '#ea580c' : '#c2410c');
      D.roundRect(ctx, cx - side / 2, yb - side / 2, side, side, 5, grad);
      D.text(ctx, '1 kg', cx, yb, { color: '#fff', size: 10, weight: 700, align: 'center' });
      if (Math.abs(s.x) > 0.22) D.text(ctx, 'off scale', cx, bottom - 4, { color: c.danger, size: 10, weight: 700, align: 'center' });

      /* ---- right panel: amplitude vs driving frequency ---- */
      var gx = LW + (small ? 36 : 50), gy = small ? 30 : 36, gw = W - gx - 12, gh = H - gy - (small ? 34 : 40);
      var f0 = w0(p) / (2 * Math.PI), peak = ampTheory(p, Math.sqrt(Math.max(0.01, f0 * f0 - p.b * p.b / (8 * Math.PI * Math.PI * MASS * MASS))));
      var amax = Math.max(peak, A0) * 100;
      s.pts.forEach(function (q) { amax = Math.max(amax, q.A * 100); });
      var yStep = D.niceStep(amax * 1.1, Math.max(2, Math.floor(gh / 36))), ymax = Math.ceil(amax * 1.1 / yStep) * yStep;
      function X(f) { return gx + f / FMAX * gw; }
      function Y(a) { return gy + gh - a / ymax * gh; }
      D.text(ctx, small ? 'Amplitude vs driving f' : 'Steady amplitude vs driving frequency', gx + gw / 2, 14, { color: c.muted, size: small ? 11 : 12.5, weight: 600, align: 'center', fit: W });
      ctx.save(); ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
      for (var a = 0; a <= ymax + 1e-9; a += yStep) {
        ctx.beginPath(); ctx.moveTo(gx, Y(a)); ctx.lineTo(gx + gw, Y(a)); ctx.stroke();
        D.text(ctx, M.fmt(a, yStep < 1 ? 1 : 0), gx - 5, Y(a), { color: c.muted, size: fs - 1, align: 'right' });
      }
      for (var f = 0; f <= FMAX + 1e-9; f += 0.5) {
        ctx.beginPath(); ctx.moveTo(X(f), gy); ctx.lineTo(X(f), gy + gh); ctx.stroke();
        D.text(ctx, M.fmt(f, 1), X(f), gy + gh + 10, { color: c.muted, size: fs - 1, align: 'center' });
      }
      ctx.restore();
      D.text(ctx, 'driving frequency (Hz)', gx + gw, gy + gh + 24, { color: c.muted, size: fs - 1, align: 'right' });
      ctx.save(); ctx.translate(gx - (small ? 28 : 38), gy + gh / 2); ctx.rotate(-Math.PI / 2);
      D.text(ctx, 'amplitude (cm)', 0, 0, { color: c.muted, size: fs - 1, align: 'center' }); ctx.restore();
      ctx.strokeStyle = c.axis; ctx.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
      // f0 line, theory curve, measured points, current f
      D.line(ctx, X(f0), gy, X(f0), gy + gh, D.alpha(c.s3, 0.8), 1.5, [5, 4]);
      D.text(ctx, 'f₀ = ' + M.fmt(f0, 2) + ' Hz', X(f0) + (X(f0) > gx + gw - 80 ? -4 : 4), gy + 10, { color: c.s3, size: fs, weight: 700, align: X(f0) > gx + gw - 80 ? 'right' : 'left' });
      ctx.save(); ctx.beginPath(); ctx.rect(gx, gy, gw, gh); ctx.clip();
      D.curve(ctx, function (xp) { return Y(ampTheory(p, (xp - gx) / gw * FMAX) * 100); }, gx, gx + gw, D.alpha(c.s2, 0.75), 2, 1.5);
      ctx.restore();
      s.pts.forEach(function (q) { D.circle(ctx, X(q.f), Y(q.A * 100), 4.5, c.s1, c.bg, 1.5); });
      D.line(ctx, X(p.f), gy, X(p.f), gy + gh, D.alpha(c.s4, 0.9), 2);
      if (s.Am != null) D.circle(ctx, X(p.f), Y(Math.min(s.Am * 100, ymax)), 5, null, c.s1, 2);
      var lx = gx + gw - 6, ly = gy + gh - 10;
      D.text(ctx, '— formula   ● measured', lx, ly, { color: c.muted, size: fs - 1.5, align: 'right', bg: D.alpha(c.bg, 0.8), pad: 3 });
      var ratio = p.f / f0, msg = Math.abs(ratio - 1) < 0.04 ? 'RESONANCE: drive matches f₀' : ratio < 1 ? 'drive slower than f₀: block follows the motor' : 'drive faster than f₀: block can\'t keep up';
      D.text(ctx, msg, gx + gw / 2, gy + gh * 0.22, { color: c.bg, bg: Math.abs(ratio - 1) < 0.04 ? c.danger : c.s3, size: fs, weight: 700, align: 'center', pad: 4, fit: W - 4 });
    }
  });
})();