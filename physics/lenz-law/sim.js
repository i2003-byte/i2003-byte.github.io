/* =====================================================================
   Electricity & Magnetism · Lenz's Law and Eddy Currents — sim.js
   ---------------------------------------------------------------------
   Scene 1 · Magnet falling through a 1 m vertical pipe, raced against
   the same magnet in a plastic pipe. The moving magnet induces ring
   (eddy) currents in the pipe wall that oppose its motion with a
   force proportional to its speed:
     m dv/dt = m g − k v,  terminal speed v_t = m g / k
     k = k0 · (σ / σ_copper) · (wall / 1.5 mm) · (B / 1.2 T)² · (0.12 if slit)
   k0 = 0.785 N s/m, chosen so a 12 g neodymium magnet in a 1.5 mm
   copper pipe falls at ≈ 0.15 m/s, as in school demonstrations.
   Scene 2 · A metal plate on a 30 cm pendulum swings through the gap
   of a magnet. Inside the field it feels a braking torque ∝ its speed:
     θ'' = −(g/L) sin θ − c · e^(−(θ/0.16)²) · θ' − 0.03 θ'
     c = c0 · (σ / σ_copper) · (wall / 1.5 mm) · (B / 1.2 T)² · (0.12 if slotted)
   Heat in the metal = loss of mechanical energy. Air drag is small and
   the same for both (the pipe race ignores it).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var G = 9.8, LEN = 1.0, K0 = 0.785, C0 = 12, PL = 0.3, PM = 0.05, TH0 = 0.7;
  var SIG = { copper: 1, aluminium: 0.63, brass: 0.27, plastic: 0 };
  var MAG = { neo: { B: 1.2, m: 0.012 }, ferrite: { B: 0.4, m: 0.008 } };
  var MCOL = { copper: '#c2410c', aluminium: '#cbd5e1', brass: '#ca8a04', plastic: '#e5e7eb' };

  var st = {};
  function factor(p) { return SIG[p.mat] * (p.wall / 1.5) * Math.pow((p.obj === 'steel' ? 0 : MAG[p.mag].B) / 1.2, 2) * (p.slit ? 0.12 : 1); }
  function mass(p) { return p.obj === 'steel' ? 0.012 : MAG[p.mag].m; }
  function kOf(p) { return K0 * factor(p); }
  function pipe(p) { return p.scene === 'pipe'; }

  SimLab.createSim({
    ariaLabel: 'Two vertical pipes, each with a magnet dropped in at the same moment. In the plastic pipe the magnet falls straight through; in a copper or aluminium pipe ring-shaped eddy currents above and below the magnet push back on it, so it drifts down slowly. A second scene shows a metal plate on a pendulum swinging through the gap of a magnet and stopping quickly, beside a faint copy swinging with no magnet',
    playLabel: 'Drop / release',
    mobileAspect: '1 / 1.1',
    params: [
      { id: 'scene', label: 'Experiment', type: 'select', value: 'pipe', options: [
        { value: 'pipe', label: 'Magnet falling through a pipe' }, { value: 'plate', label: 'Metal plate swinging through a magnet' }] },
      { id: 'mat', label: 'Metal of the pipe or plate', type: 'select', value: 'copper', options: [
        { value: 'copper', label: 'Copper' }, { value: 'aluminium', label: 'Aluminium' }, { value: 'brass', label: 'Brass' }, { value: 'plastic', label: 'Plastic (does not conduct)' }] },
      { id: 'wall', label: 'Thickness of the metal', min: 0.5, max: 3, step: 0.25, value: 1.5, unit: 'mm' },
      { id: 'slit', label: 'Cut a slit along the pipe / slots in the plate', type: 'toggle', value: false },
      { id: 'mag', label: 'Magnet', type: 'select', value: 'neo', options: [
        { value: 'neo', label: 'Strong neodymium magnet (1.2 T, 12 g)' }, { value: 'ferrite', label: 'Ordinary ferrite magnet (0.4 T, 8 g)' }] },
      { id: 'obj', label: 'Drop instead (pipe only)', type: 'select', value: 'magnet', options: [
        { value: 'magnet', label: 'the magnet' }, { value: 'steel', label: 'an unmagnetised steel slug of 12 g' }] }
    ],
    readouts: [
      { id: 'time', label: 'Time to reach the bottom / to stop swinging', short: 'Time', unit: 's', digits: 2, key: true },
      { id: 'v', label: 'Speed now', short: 'Speed', unit: 'm/s', digits: 2, key: true },
      { id: 'heat', label: 'Heat made by eddy currents', short: 'Heat', unit: 'mJ', digits: 1, key: true },
      { id: 'vt', label: 'Terminal speed (pipe)', unit: 'm/s', digits: 3 },
      { id: 'ref', label: 'Without braking: time to the bottom / swing size now' },
      { id: 'F', label: 'Braking force now', unit: 'mN', digits: 1 },
      { id: 'amp', label: 'Swing size now (plate)', unit: '°', digits: 0 }
    ],
    graph: { title: 'Speed with and without eddy-current braking', yLabel: 'm/s', xMax: 4, series: [
      { label: 'with eddy currents', color: '--sim-1' }, { label: 'no braking (plastic pipe / no magnet)', color: '--sim-3' }] },

    reset: function (sim) {
      st = { y: 0, v: 0, y0: 0, v0: 0, done: null, done0: null, th: TH0, w: 0, th0: TH0, w0: 0, amp: TH0, amp0: TH0, stop: null, last: 0, last0: 0 };
    },
    finished: function (sim) {
      if (pipe(sim.p)) return st.done != null && st.done0 != null;
      return sim.time > 30 || (st.stop != null && sim.time > st.stop + 1);
    },
    update: function (sim, dt) {
      var p = sim.p, t = sim.time + dt;
      if (pipe(p)) {
        var m = mass(p), k = kOf(p);
        if (st.done == null) { st.v += (G - k * st.v / m) * dt; st.y += st.v * dt; if (st.y >= LEN) { st.y = LEN; st.done = t; } }
        if (st.done0 == null) { st.v0 += G * dt; st.y0 += st.v0 * dt; if (st.y0 >= LEN) { st.y0 = LEN; st.done0 = t; } }
      } else {
        var cc = C0 * factor(p), g = G / PL;
        function step(th, w, brake) { var a = -g * Math.sin(th) - (brake ? cc * Math.exp(-Math.pow(th / 0.16, 2)) : 0) * w - 0.03 * w; w += a * dt; th += w * dt; return [th, w]; }
        var r = step(st.th, st.w, true); 
        if (st.w * r[1] <= 0 && st.w !== 0) st.amp = Math.abs(r[0]);
        st.th = r[0]; st.w = r[1];
        var r0 = step(st.th0, st.w0, false);
        if (st.w0 * r0[1] <= 0 && st.w0 !== 0) st.amp0 = Math.abs(r0[0]);
        st.th0 = r0[0]; st.w0 = r0[1];
        if (st.stop == null && energy(st.th, st.w) < 0.02 * energy(TH0, 0)) st.stop = t;
      }
    },
    sample: function (sim) {
      if (pipe(sim.p)) return [st.done == null ? st.v : 0, st.done0 == null ? st.v0 : 0];
      return [Math.abs(st.w) * PL, Math.abs(st.w0) * PL];
    },
    readout: function (sim) {
      var p = sim.p;
      if (pipe(p)) {
        var m = mass(p), k = kOf(p), y = st.y;
        return { time: st.done != null ? st.done : sim.time, v: st.v, heat: (m * G * y - 0.5 * m * st.v * st.v) * 1000, vt: k > 0 ? m * G / k : 'no limit',
          ref: (st.done0 != null ? M.fmt(st.done0, 2) : M.fmt(Math.sqrt(2 * LEN / G), 2)) + ' s in plastic', F: k * st.v * 1000, amp: '—' };
      }
      var e0 = energy(TH0, 0), e = energy(st.th, st.w);
      return { time: st.stop != null ? st.stop : sim.time, v: Math.abs(st.w) * PL, heat: (e0 - e - (e0 - energy(st.th0, st.w0))) * 1000, vt: '—',
        ref: M.fmt(M.deg(st.amp0), 0) + '° with no magnet', F: C0 * factor(p) * Math.exp(-Math.pow(st.th / 0.16, 2)) * Math.abs(st.w) * PM * PL * 1000, amp: M.deg(st.amp) };
    },
    status: function (sim) {
      var p = sim.p;
      if (sim.time === 0) return pipe(p) ? 'Press “Drop / release” to drop both at once' : 'Press “Drop / release” to let the plate swing';
      if (pipe(p)) {
        if (st.done != null && st.done0 != null) return 'Plastic pipe ' + M.fmt(st.done0, 2) + ' s · ' + p.mat + ' pipe ' + M.fmt(st.done, 2) + ' s';
        return kOf(p) > 0 ? 'Eddy currents in the pipe oppose the falling magnet' : 'No eddy currents: it falls freely';
      }
      return st.stop != null ? 'The plate stopped after ' + M.fmt(st.stop, 1) + ' s: its energy became heat' : factor(p) > 0 ? 'The plate slows each time it passes through the field' : 'No braking: the plate keeps swinging';
    },
    draw: function (sim) { if (pipe(sim.p)) drawPipes(sim); else drawPlate(sim); }
  });
  function energy(th, w) { return PM * G * PL * (1 - Math.cos(th)) + 0.5 * PM * PL * PL * w * w; }

  /* ---------- pipes ---------- */
  function drawPipes(sim) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, small = W < 560;
    D.clear(ctx, W, H, c.bg);
    var top = small ? 34 : 44, bot = H - (small ? 22 : 28), ph = bot - top, pw = Math.min(W * 0.16, 70);
    var xs = [W * 0.3, W * 0.7];
    var tubes = [{ x: xs[0], mat: 'plastic', y: st.y0, v: st.v0, label: 'plastic pipe', obj: p.obj, slit: false, k: 0 },
                 { x: xs[1], mat: p.mat, y: st.y, v: st.v, label: p.mat + ' pipe' + (p.slit ? ' with a slit' : ''), obj: p.obj, slit: p.slit, k: kOf(p) }];
    tubes.forEach(function (tb, i) {
      var x0 = tb.x - pw / 2, col = MCOL[tb.mat];
      D.text(ctx, tb.label, tb.x, top - (small ? 18 : 24), { color: c.ink, size: small ? 11 : 13, weight: 700, align: 'center', fit: W });
      var gr = ctx.createLinearGradient(x0, 0, x0 + pw, 0);
      gr.addColorStop(0, D.alpha(col, 0.55)); gr.addColorStop(0.35, D.alpha(col, 0.95)); gr.addColorStop(1, D.alpha(col, 0.45));
      // back wall
      D.roundRect(ctx, x0, top, pw, ph, 4, D.alpha(col, tb.mat === 'plastic' ? 0.12 : 0.25), D.alpha(c.ink, 0.35), 1);
      // magnet (drawn bigger than life: 12 mm in a 1 m pipe)
      var my = top + tb.y / LEN * ph, mh = Math.max(14, pw * 0.5), mw = pw * 0.62, mcy = M.clamp(my, top + mh / 2, bot - mh / 2);
      if (tb.obj === 'steel') D.roundRect(ctx, tb.x - mw / 2, mcy - mh / 2, mw, mh, 3, '#9ca3af', '#4b5563', 1);
      else { D.roundRect(ctx, tb.x - mw / 2, mcy - mh / 2, mw, mh / 2, 2, '#2563eb'); D.roundRect(ctx, tb.x - mw / 2, mcy, mw, mh / 2, 2, '#dc2626');
        D.text(ctx, 'S', tb.x, mcy - mh / 4, { color: '#fff', size: Math.min(11, mh / 2.4), weight: 800, align: 'center' });
        D.text(ctx, 'N', tb.x, mcy + mh / 4, { color: '#fff', size: Math.min(11, mh / 2.4), weight: 800, align: 'center' }); }
      // front wall (see-through)
      ctx.save(); ctx.globalAlpha = tb.mat === 'plastic' ? 0.25 : 0.5; D.roundRect(ctx, x0, top, pw, ph, 4, gr); ctx.restore();
      if (tb.slit) D.line(ctx, tb.x + pw * 0.15, top, tb.x + pw * 0.15, bot, c.bg, 2.5);
      // eddy-current rings above and below the magnet
      var I = tb.k * tb.v, done = i ? st.done != null : st.done0 != null;
      if (I > 0.005 && !done) {
        var a = M.clamp(I / (mass(p) * G) * 1.2, 0.25, 1), ew = pw * 0.62, eh = Math.max(4, pw * 0.16);
        [[-1, mcy - mh * 0.9], [1, mcy + mh * 0.9]].forEach(function (ring) {
          var sgn = ring[0], ry = ring[1];
          ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2.5; if (tb.slit) ctx.setLineDash([5, 5]);
          ctx.beginPath(); ctx.ellipse(tb.x, ry, ew, eh, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          // front arrow: below the N pole the ring is CCW from above (front moves right), above it is CW
          var dir = sgn > 0 ? 1 : -1;
          ctx.save(); ctx.globalAlpha = a; D.arrow(ctx, tb.x - dir * ew * 0.35, ry + eh, tb.x + dir * ew * 0.35, ry + eh, '#4ade80', 2.5, 7); ctx.restore();
          if (!small || pw > 50) {
            // ring below: N on top (repels N); ring above: N underneath (attracts the S on top)
            D.text(ctx, sgn > 0 ? 'N' : 'S', tb.x + ew + 9, ry - eh, { color: sgn > 0 ? '#f87171' : '#60a5fa', size: 11, weight: 800, align: 'center' });
            D.text(ctx, sgn > 0 ? 'S' : 'N', tb.x + ew + 9, ry + eh + 2, { color: sgn > 0 ? '#60a5fa' : '#f87171', size: 11, weight: 800, align: 'center' });
          }
        });
        if (tb.slit && !small) D.text(ctx, 'slit breaks the rings', tb.x, bot + 12, { color: c.muted, size: 10, align: 'center' });
      }
      // speed tag
      if (tb.y > 0 && !done) D.text(ctx, M.fmt(tb.v, 2) + ' m/s', tb.x - pw / 2 - 6, mcy, { color: c.ink, size: small ? 10 : 12, weight: 600, align: 'right', bg: D.alpha(c.bg, 0.75), pad: 2 });
      var tdone = i ? st.done : st.done0;
      if (tdone != null) D.text(ctx, '⏱ ' + M.fmt(tdone, 2) + ' s', tb.x, bot + (small ? 10 : 13), { color: c.success, size: small ? 11 : 13, weight: 700, align: 'center' });
    });
    // 1 m scale
    var sx = small ? 10 : 18;
    D.line(ctx, sx, top, sx, bot, D.alpha(c.ink, 0.5), 1.5);
    for (var i = 0; i <= 4; i++) { var yy = top + ph * i / 4; D.line(ctx, sx, yy, sx + 5, yy, D.alpha(c.ink, 0.5), 1.5); }
    D.text(ctx, '0', sx + 8, top, { color: c.muted, size: 9 }); D.text(ctx, '1 m', sx + 8, bot, { color: c.muted, size: 9 });
  }

  /* ---------- pendulum plate ---------- */
  function drawPlate(sim) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, small = W < 560;
    D.clear(ctx, W, H, c.bg);
    var px = W / 2, py = small ? 30 : 36, L = Math.min(H * 0.62, W * 0.62), pw = Math.max(36, L * 0.28), phh = pw * 0.8;
    D.line(ctx, px - 30, py, px + 30, py, D.alpha(c.ink, 0.6), 4);
    // the magnet behind the bottom of the swing
    var gy = py + L, mw = pw * 1.25, mh = phh * 1.4, field = factor(p) > 0 || p.mat === 'plastic';
    D.roundRect(ctx, px - mw / 2, gy - mh / 2, mw, mh, 6, '#dc2626', 'rgba(0,0,0,0.3)', 1);
    D.text(ctx, 'N', px, gy - mh / 2 + 10, { color: '#fff', size: 11, weight: 800, align: 'center' });
    ctx.save(); ctx.globalAlpha = 0.18; D.roundRect(ctx, px - mw / 2, gy - mh / 2, mw, mh, 6, '#93c5fd'); ctx.restore();
    function plate(th, ghost) {
      var bx = px + Math.sin(th) * L, by = py + Math.cos(th) * L;
      ctx.save(); if (ghost) { ctx.globalAlpha = 0.28; ctx.setLineDash([4, 4]); }
      D.line(ctx, px, py, bx, by, D.alpha(c.ink, 0.7), 2);
      ctx.translate(bx, by); ctx.rotate(-th);
      var col = MCOL[p.mat];
      ctx.fillStyle = col; ctx.strokeStyle = 'rgba(15,23,42,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(-pw / 2, -phh / 2, pw, phh);
      if (p.slit) { for (var i = 1; i < 6; i++) { var sxp = -pw / 2 + pw * i / 6; ctx.rect(sxp - 2, -phh / 2 + phh * 0.18, 4, phh * 0.82); } ctx.fill('evenodd'); }
      else ctx.fill();
      ctx.stroke();
      ctx.restore();
      return [bx, by];
    }
    plate(st.th0, true);
    var b = plate(st.th, false);
    // eddy swirls while the plate is in the field
    var inField = Math.exp(-Math.pow(st.th / 0.16, 2)), speed = Math.abs(st.w) * PL;
    if (factor(p) > 0 && inField > 0.25 && speed > 0.05) {
      ctx.save(); ctx.globalAlpha = M.clamp(speed * inField * 1.5, 0.3, 1);
      [-1, 1].forEach(function (s) {
        var cx = b[0] + s * pw * 0.25, r = phh * 0.22, ccw = (s * (st.w > 0 ? 1 : -1)) > 0;
        ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2; if (p.slit) { ctx.setLineDash([3, 4]); r *= 0.5; }
        ctx.beginPath(); ctx.arc(cx, b[1], r, 0.3, Math.PI * 1.7); ctx.stroke();
        var ea = ccw ? 0.3 : Math.PI * 1.7, ex = cx + Math.cos(ea) * r, ey = b[1] + Math.sin(ea) * r;
        D.circle(ctx, ex, ey, 3, '#4ade80');
      });
      ctx.restore();
    }
    // the S pole in front, drawn see-through
    ctx.save(); ctx.globalAlpha = 0.2; D.roundRect(ctx, px - mw / 2 + 6, gy - mh / 2 + 6, mw, mh, 6, '#2563eb'); ctx.restore();
    D.text(ctx, 'magnet gap (N behind, S in front)', px, gy + mh / 2 + (small ? 10 : 14), { color: c.muted, size: small ? 10 : 11, align: 'center', fit: W });
    D.text(ctx, (p.slit ? 'slotted ' : 'solid ') + p.mat + ' plate', 10, 12, { color: c.ink, size: small ? 11 : 13, weight: 700 });
    D.text(ctx, 'faint copy: same plate, no magnet', W - 10, 12, { color: c.muted, size: small ? 9 : 11, align: 'right' });
  }
})();
