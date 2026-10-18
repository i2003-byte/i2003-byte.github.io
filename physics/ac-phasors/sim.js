/* =====================================================================
   Electricity · AC Voltage and Phasors — sim.js
   ---------------------------------------------------------------------
   Mains AC voltage goes up and down as a sine wave:
     v = Vm sin ωt,  ω = 2πf,  T = 1/f
   A phasor is an arrow of length Vm turning anticlockwise at ω; its
   height (projection on the vertical axis) is the voltage at that
   instant.
     rms value  Vrms = Vm / √2   (the average of v² is Vm²/2)
     230 V rms mains → Vm = 230 × √2 ≈ 325 V
   Current through one component on its own:
     resistor   I = V / R,            in step with v (φ = 0)
     inductor   XL = ωL,  I = V / XL,  i lags v by 90°
     capacitor  XC = 1/(ωC), I = V / XC, i leads v by 90°
   Average power P = Vrms Irms cos φ: full for R, zero for L and C.
   The picture runs in slow motion (50 Hz is far too fast to see).
   Ideal parts: no resistance in the inductor's wire, no leakage.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, TAU = Math.PI * 2;
  var LOADS = {
    R: { name: 'Resistor, R = 100 Ω (like a 530 W heater)', short: 'Resistor', phi: 0 },
    L: { name: 'Inductor, L = 0.5 H (a coil)', short: 'Inductor', phi: -Math.PI / 2 },
    C: { name: 'Capacitor, C = 20 µF', short: 'Capacitor', phi: Math.PI / 2 }
  };
  var R = 100, LH = 0.5, CF = 20e-6;

  function opp(sim) {   // resistance or reactance in ohms
    var w = TAU * sim.p.freq;
    return sim.p.load === 'R' ? R : sim.p.load === 'L' ? w * LH : 1 / (w * CF);
  }
  function vals(sim) {
    var Vm = sim.p.vrms * Math.SQRT2, X = opp(sim), Im = Vm / X, phi = LOADS[sim.p.load].phi, th = sim.state.th;
    return { Vm: Vm, Im: Im, X: X, phi: phi, th: th, v: Vm * Math.sin(th), i: Im * Math.sin(th + phi), P: sim.p.vrms * (sim.p.vrms / X) * Math.cos(phi) };
  }

  SimLab.createSim({
    ariaLabel: 'A rotating voltage phasor and current phasor beside the sine waves they draw, with a panel showing v squared and its average, which gives the rms value',
    mobileAspect: '3 / 3.6',
    playLabel: 'Switch on',
    params: [
      { id: 'vrms', label: 'Supply voltage (rms)', min: 0, max: 250, step: 5, value: 230, unit: 'V',
        presets: [{ label: 'India 230 V', value: 230 }, { label: 'USA 120 V', value: 120 }] },
      { id: 'freq', label: 'Frequency', min: 10, max: 200, step: 5, value: 50, unit: 'Hz',
        presets: [{ label: 'India 50 Hz', value: 50 }, { label: 'USA 60 Hz', value: 60 }] },
      { id: 'load', label: 'Connected to', type: 'select', value: 'R', options: Object.keys(LOADS).map(function (k) { return { value: k, label: LOADS[k].name }; }) },
      { id: 'slow', label: 'Slow motion', type: 'select', value: '100', options: [{ value: '50', label: '50 times slower' }, { value: '100', label: '100 times slower' }, { value: '400', label: '400 times slower' }] },
      { id: 'rms', label: 'Show v² and the rms value', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'v', label: 'Voltage right now (v)', short: 'v now', key: true },
      { id: 'vm', label: 'Peak voltage Vm = √2 × Vrms', short: 'Peak Vm', key: true },
      { id: 'i', label: 'Current right now (i)' },
      { id: 'irms', label: 'rms current' },
      { id: 'x', label: 'Resistance or reactance' },
      { id: 'phase', label: 'Current compared with voltage' },
      { id: 'p', label: 'Average power taken', short: 'Avg power', key: true },
      { id: 't', label: 'One cycle takes (T = 1/f)' }
    ],
    graph: { title: 'Power taken by the load right now (p = v × i)', yLabel: 'W', series: [{ label: 'p = v i', color: '--sim-3' }], window: 6 },
    sample: function (sim) { var q = vals(sim); return [q.v * q.i]; },
    onParam: function () { return true; },
    reset: function (sim) { sim.state = { th: 0, ms: 0 }; },
    update: function (sim, dt) {
      var s = sim.state, realDt = dt / +sim.p.slow;
      s.th = (s.th + TAU * sim.p.freq * realDt) % (TAU * 2);
      s.ms += realDt * 1000;
    },
    readout: function (sim) {
      var q = vals(sim), sym = sim.p.load === 'R' ? 'R' : sim.p.load === 'L' ? 'XL = 2πfL' : 'XC = 1/(2πfC)';
      return {
        v: M.fmt(q.v, 0) + ' V', vm: M.fmt(q.Vm, 0) + ' V', i: M.fmt(q.i, 2) + ' A', irms: M.fmt(q.Im / Math.SQRT2, 2) + ' A',
        x: sym + ' = ' + M.fmt(q.X, 0) + ' Ω',
        phase: sim.p.load === 'R' ? 'in step (0°)' : sim.p.load === 'L' ? 'lags by 90° (¼ cycle later)' : 'leads by 90° (¼ cycle earlier)',
        p: M.fmt(Math.abs(q.P) < 0.05 ? 0 : q.P, 0) + ' W',
        t: M.fmt(1000 / sim.p.freq, 1) + ' ms'
      };
    },
    status: function (sim) { return sim.p.freq + ' Hz shown ' + sim.p.slow + ' times slower'; },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, q = vals(sim), narrow = W < 560;
      var vCol = c.s1, iCol = c.s2, show = sim.p.rms;
      D.clear(ctx, W, H, c.bg);
      var topH = show ? H * (narrow ? 0.58 : 0.6) : H - 16;
      var r = Math.min(topH / 2 - 22, narrow ? W * 0.2 : W * 0.15), cx = 12 + r + (narrow ? 4 : 18), cy = 18 + topH / 2;
      var wx = cx + r + (narrow ? 22 : 40), ww = W - wx - 12, amp = r;

      // phasor circle
      D.circle(ctx, cx, cy, r, null, c.grid, 1);
      D.line(ctx, cx - r - 6, cy, cx + r + 6, cy, c.axis, 1);
      D.line(ctx, cx, cy - r - 6, cx, cy + r + 6, c.axis, 1);
      var ir = r * 0.62, vx = cx + r * Math.cos(q.th), vy = cy - r * Math.sin(q.th);
      var ix = cx + ir * Math.cos(q.th + q.phi), iy = cy - ir * Math.sin(q.th + q.phi);
      if (sim.p.load !== 'R') {   // 90° arc between the two arrows
        ctx.save(); ctx.strokeStyle = c.muted; ctx.lineWidth = 1; ctx.beginPath();
        var a0 = -q.th, a1 = -(q.th + q.phi); ctx.arc(cx, cy, r * 0.28, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke(); ctx.restore();
        D.text(ctx, '90°', cx + r * 0.42 * Math.cos(q.th + q.phi / 2), cy - r * 0.42 * Math.sin(q.th + q.phi / 2), { color: c.muted, size: 9, align: 'center' });
      }
      D.arrow(ctx, cx, cy, ix, iy, iCol, 2.5, 9);
      D.arrow(ctx, cx, cy, vx, vy, vCol, 3, 11);
      D.text(ctx, 'V', vx + 8 * Math.cos(q.th), vy - 8 * Math.sin(q.th), { color: vCol, size: 12, weight: 800, align: 'center' });
      D.text(ctx, 'I', ix + 8 * Math.cos(q.th + q.phi), iy - 8 * Math.sin(q.th + q.phi), { color: iCol, size: 12, weight: 800, align: 'center' });
      D.text(ctx, 'Phasors turn anticlockwise', cx, cy + r + 14, { color: c.faint, size: 9, align: 'center', fit: wx - 4 });
      D.text(ctx, LOADS[sim.p.load].short, cx, 10, { color: c.muted, size: 11, weight: 700, align: 'center' });

      // waves over two cycles; x axis in real milliseconds
      var T = 1000 / sim.p.freq;
      function X(th) { return wx + th / (TAU * 2) * ww; }
      function YV(v) { return cy - v / q.Vm * amp; }
      D.line(ctx, wx, cy, wx + ww, cy, c.axis, 1);
      D.line(ctx, wx, cy - amp - 6, wx, cy + amp + 6, c.axis, 1);
      [1, -1].forEach(function (sg) {
        D.line(ctx, wx, cy - sg * amp, wx + ww, cy - sg * amp, c.grid, 1, [3, 4]);
        D.text(ctx, (sg > 0 ? '+' : '−') + M.fmt(q.Vm, 0), wx - 3, cy - sg * amp, { color: vCol, size: 9, align: 'right' });
      });
      if (show && sim.p.vrms > 0) {
        var yr = cy - amp / Math.SQRT2;
        D.line(ctx, wx, yr, wx + ww, yr, c.s4, 1, [5, 3]);
        D.text(ctx, 'rms ' + sim.p.vrms + ' V', wx + ww, yr - 8, { color: c.s4, size: 9, weight: 700, align: 'right' });
      }
      for (var k = 0; k <= 4; k++) D.text(ctx, M.fmt(T * k / 2, T < 20 ? 1 : 0), X(k * Math.PI), cy + amp + 14, { color: c.faint, size: 9, align: 'center' });
      D.text(ctx, 'ms', wx + ww, cy + amp + 26, { color: c.faint, size: 9, align: 'right' });
      function wave(fn, col, upto, lw) { D.curve(ctx, function (px) { return fn((px - wx) / ww * TAU * 2); }, wx, Math.max(wx, X(upto)), col, lw, 2); }
      var iy0 = function (th) { return cy - (q.Im ? Math.sin(th + q.phi) * ir : 0); };
      wave(function (th) { return YV(q.Vm * Math.sin(th)); }, D.alpha(vCol, 0.25), TAU * 2, 1.5);
      wave(iy0, D.alpha(iCol, 0.25), TAU * 2, 1.5);
      wave(iy0, iCol, q.th, 2);
      wave(function (th) { return YV(q.Vm * Math.sin(th)); }, vCol, q.th, 2.5);
      // projection line from the phasor tip to the pen
      var px2 = X(q.th);
      D.line(ctx, vx, vy, px2, vy, D.alpha(vCol, 0.6), 1, [3, 3]);
      D.circle(ctx, px2, vy, 4, vCol, '#fff', 1.5);
      D.circle(ctx, px2, iy0(q.th), 3, iCol);
      D.text(ctx, 'v (V)', wx + 4, cy - amp - 12, { color: vCol, size: 10, weight: 700 });
      D.text(ctx, 'i (own scale, peak ' + M.fmt(q.Im, 2) + ' A)', wx + 40, cy - amp - 12, { color: iCol, size: 10, weight: 700, fit: W });

      if (!show) return;
      // v² panel: its average is half the peak, so Vrms = Vm / √2
      var py = topH + 30, ph = H - py - 22, Vm2 = q.Vm * q.Vm || 1;
      function Y2(v2) { return py + ph - v2 / Vm2 * ph; }
      D.line(ctx, wx, py + ph, wx + ww, py + ph, c.axis, 1);
      D.line(ctx, wx, py - 4, wx, py + ph, c.axis, 1);
      ctx.beginPath(); ctx.moveTo(wx, py + ph);
      for (var x = wx; x <= wx + ww; x += 2) { var th2 = (x - wx) / ww * TAU * 2, s2 = Math.sin(th2); ctx.lineTo(x, Y2(Vm2 * s2 * s2)); }
      ctx.lineTo(wx + ww, py + ph); ctx.closePath(); ctx.fillStyle = D.alpha(vCol, 0.18); ctx.fill();
      D.curve(ctx, function (x2) { var s3 = Math.sin((x2 - wx) / ww * TAU * 2); return Y2(Vm2 * s3 * s3); }, wx, wx + ww, D.alpha(vCol, 0.7), 1.5, 2);
      D.line(ctx, wx, Y2(Vm2 / 2), wx + ww, Y2(Vm2 / 2), c.s4, 2, [6, 3]);
      var s4 = Math.sin(q.th);
      D.circle(ctx, X(q.th), Y2(Vm2 * s4 * s4), 3.5, vCol, '#fff', 1);
      D.text(ctx, 'v²', wx - 4, py + 4, { color: vCol, size: 10, weight: 700, align: 'right' });
      D.text(ctx, 'average of v² = Vm² ÷ 2', wx + ww, Y2(Vm2 / 2) - 9, { color: c.s4, size: 10, weight: 700, align: 'right', fit: W });
      var msg = narrow ? 'Vrms = Vm ÷ √2 = ' + M.fmt(q.Vm, 0) + ' ÷ 1.414 = ' + sim.p.vrms + ' V'
        : 'Vrms = √(average of v²) = Vm ÷ √2 = ' + M.fmt(q.Vm, 0) + ' ÷ 1.414 = ' + sim.p.vrms + ' V';
      D.text(ctx, msg, 10, H - 9, { color: c.ink, size: narrow ? 10 : 11, weight: 600, fit: W });
      D.text(ctx, narrow ? 'Same heat as' : 'Gives the same heating', 10, py + ph * 0.3, { color: c.faint, size: 9, fit: wx - 6 });
      D.text(ctx, narrow ? 'steady ' + sim.p.vrms + ' V' : 'as a steady ' + sim.p.vrms + ' V', 10, py + ph * 0.3 + 12, { color: c.faint, size: 9, fit: wx - 6 });
    }
  });
})();
