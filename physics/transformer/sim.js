/* =====================================================================
   Electricity & Magnetism · Transformers and Power Lines — sim.js
   ---------------------------------------------------------------------
   Scene 1 · A transformer on the bench: primary (Np turns) and
   secondary (Ns turns) on one iron core, a lamp of resistance R.
     Vs = k · Vp · Ns / Np      (k: share of flux that links both coils)
     Is = Vs / R,  Ps = Vs Is,  Pin = Ps / η,  Ip = Pin / Vp
   Cores: laminated iron k 0.99, η 0.97; solid iron k 0.98, η 0.80
   (eddy currents heat it); no core (coils side by side) k 0.05, η 0.30.
   AC is 50 Hz, drawn 50× slower (1 cycle per second).
   DC: only switching on or off changes the flux, so the secondary
   gets a short pulse, Vs(t) = k Vp (Ns/Np) e^(−t/τ) (τ drawn 0.25 s).
   The primary coil has 0.01 Ω per turn, so on steady DC it only
   limits the current by its resistance and heats up.
   Scene 2 · Sending power P over a line of total resistance
   0.2 Ω per km (both wires) at a chosen line voltage V:
     I = P / V,  loss = I² R,  town gets P − I² R,  drop = I R
   (Real lines are 3-phase AC; this is the simple single-line picture.)
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var CORE = { lam: { k: 0.99, eta: 0.97, name: 'laminated iron core' }, solid: { k: 0.98, eta: 0.80, name: 'solid iron core' }, air: { k: 0.05, eta: 0.30, name: 'no core' } };
  var TAU = 0.25, RLINE = 0.2;

  var st = { sw: 0, swT: -10, on: true };
  function bench(p) { return p.scene === 'bench'; }
  function isDC(p) { return p.src === 'dc'; }
  function vp(p) { return p.src === 'ac230' ? 230 : 12; }
  function trans(p, t) {
    var C = CORE[p.core], V = vp(p), ratio = p.Ns / p.Np, Vs = C.k * V * ratio;
    if (isDC(p)) {
      var dtSw = t - st.swT, pulse = Math.exp(-Math.max(0, dtSw) / TAU) * (dtSw >= 0 ? 1 : 0);
      var vsNow = (st.on ? 1 : -1) * Vs * pulse;
      var Rp = p.Np * 0.01, Ip = st.on ? V / Rp * (1 - pulse) : 0;
      return { Vs: Math.abs(vsNow), vsNow: vsNow, vpNow: st.on ? V : 0, Is: Math.abs(vsNow) / p.R, Ps: vsNow * vsNow / p.R, Ip: Ip, Pin: st.on ? V * Ip : 0, eff: 0, dc: true, ratio: ratio, Rp: Rp };
    }
    var Is = Vs / p.R, Ps = Vs * Is, Pin = Ps / C.eta, Ip = Pin / V, ph = 2 * Math.PI * t;
    return { Vs: Vs, Is: Is, Ps: Ps, Pin: Pin, Ip: Ip, eff: C.eta * 100, vpNow: V * Math.SQRT2 * Math.sin(ph), vsNow: Vs * Math.SQRT2 * Math.sin(ph), ratio: ratio };
  }
  function grid(p) {
    var V = p.Vline * 1000, P = p.P * 1e6, R = RLINE * p.km, I = P / V, loss = I * I * R;
    var ok = loss < P;
    return { I: I, R: R, loss: Math.min(loss, P), got: ok ? P - loss : 0, drop: I * R, Vend: Math.max(0, V - I * R), ok: ok, V: V, P: P };
  }
  function fmtW(w) { return w >= 1e6 ? M.fmt(w / 1e6, 2) + ' MW' : w >= 1e3 ? M.fmt(w / 1e3, 1) + ' kW' : M.fmt(w, 1) + ' W'; }
  function fmtV(v) { return v >= 1e3 ? M.fmt(v / 1e3, 1) + ' kV' : M.fmt(v, v < 10 ? 2 : 1) + ' V'; }
  function fmtA(a) { return a >= 1000 ? M.fmt(a / 1000, 2) + ' kA' : a >= 1 ? M.fmt(a, 2) + ' A' : M.fmt(a * 1000, 1) + ' mA'; }

  SimLab.createSim({
    ariaLabel: 'A transformer: two coils of wire on one iron core, with the mains or a battery on the primary side and a lamp on the secondary side. Moving dots show the alternating flux in the core and the lamp glows according to the output power. A second scene sends electrical power from a power station along a long line to a town, at different line voltages, and shows how much is lost as heat in the wires',
    autoplay: true,
    mobileAspect: '1 / 1',
    params: [
      { id: 'scene', label: 'Scene', type: 'select', value: 'bench', options: [
        { value: 'bench', label: 'A transformer on the bench' }, { value: 'grid', label: 'Sending power to a town' }] },
      { id: 'src', label: 'Transformer: supply to the primary', type: 'select', value: 'ac230', options: [
        { value: 'ac230', label: '230 V AC mains (50 Hz)' }, { value: 'ac12', label: '12 V AC' }, { value: 'dc', label: '12 V DC battery with a switch' }] },
      { id: 'Np', label: 'Transformer: primary turns Np', min: 50, max: 2000, step: 50, value: 1000 },
      { id: 'Ns', label: 'Transformer: secondary turns Ns', min: 10, max: 4000, step: 10, value: 50, presets: [{ label: 'phone charger', value: 25 }, { label: '1 : 1', value: 1000 }, { label: 'step up ×2', value: 2000 }] },
      { id: 'core', label: 'Transformer: core', type: 'select', value: 'lam', options: [
        { value: 'lam', label: 'Laminated iron (thin insulated sheets)' }, { value: 'solid', label: 'Solid iron block' }, { value: 'air', label: 'No core (coils side by side)' }] },
      { id: 'R', label: 'Transformer: lamp resistance R', min: 1, max: 500, step: 1, value: 12, unit: 'Ω' },
      { id: 'Vline', label: 'Power line: line voltage', type: 'select', value: 11, options: [
        { value: 0.23, label: '230 V (no step-up)' }, { value: 11, label: '11 kV' }, { value: 33, label: '33 kV' }, { value: 132, label: '132 kV' }, { value: 400, label: '400 kV' }] },
      { id: 'P', label: 'Power line: power sent', min: 0.1, max: 20, step: 0.1, value: 2, unit: 'MW', help: '1 MW is roughly what 1000 Indian homes use in the evening.' },
      { id: 'km', label: 'Power line: length of the line', min: 1, max: 300, step: 1, value: 30, unit: 'km' }
    ],
    buttons: [{ label: '⏻ Switch the battery on / off', onClick: function (sim) {
      if (!isDC(sim.p)) { sim.toast('Choose “12 V DC battery with a switch” first.'); return; }
      st.on = !st.on; st.swT = st.t || 0; if (!sim.running) sim.play();
    } }],
    readouts: [
      { id: 'out', label: 'Output voltage (secondary, or at the town end of the line)', short: 'Output V', key: true },
      { id: 'cur', label: 'Output current (secondary, or in the line)', short: 'Current', key: true },
      { id: 'eff', label: 'Share of the power delivered', short: 'Delivered', key: true },
      { id: 'ratio', label: 'Turns ratio Ns : Np' },
      { id: 'vp', label: 'Primary voltage and current' },
      { id: 'ps', label: 'Power to the lamp / to the town' },
      { id: 'lost', label: 'Power wasted as heat' }
    ],
    graph: { title: 'Voltages on the two sides (50 Hz drawn 50× slower)', yLabel: 'V', window: 3, symmetric: true,
      series: [{ label: 'primary voltage', color: '--sim-2' }, { label: 'secondary voltage', color: '--sim-1' }] },

    reset: function () { st.t = 0; st.swT = -10; st.on = true; st.flow = 0; },
    onParam: function (sim, id) {
      if (id === 'src' && isDC(sim.p)) { st.on = true; st.swT = st.t || 0; }
      return true;
    },
    update: function (sim, dt) {
      st.t += dt;
      if (!bench(sim.p)) { var g = grid(sim.p); st.flow += dt * M.clamp(Math.log10(g.I + 1) * 0.35, 0.1, 1.6); }
    },
    sample: function (sim) {
      if (!bench(sim.p)) return [0, 0];
      var x = trans(sim.p, st.t); return [x.vpNow, x.vsNow];
    },
    readout: function (sim) {
      var p = sim.p;
      if (bench(p)) {
        var x = trans(p, st.t);
        return { out: fmtV(x.Vs) + (x.dc ? ' (pulse)' : ''), cur: fmtA(x.Is), eff: x.dc ? (Math.abs(x.vsNow) > 0.01 ? 'pulse only' : '0 % (steady DC)') : M.fmt(x.eff, 0) + ' %',
          ratio: '1 : ' + M.fmt(p.Np / p.Ns, p.Np / p.Ns < 10 ? 2 : 0) + ' (' + p.Ns + ' : ' + p.Np + ')',
          vp: fmtV(vp(p)) + ', ' + fmtA(x.Ip), ps: fmtW(x.Ps),
          lost: x.dc ? fmtW(x.Ip * x.Ip * x.Rp) + ' in the primary coil' : fmtW(x.Pin - x.Ps) };
      }
      var g = grid(p);
      return { out: g.ok ? fmtV(g.Vend) : '0 V', cur: fmtA(g.I), eff: g.ok ? M.fmt(g.got / g.P * 100, 1) + ' %' : '0 %', ratio: '—', vp: '—',
        ps: fmtW(g.got), lost: fmtW(g.loss) + ' (' + M.fmt(g.loss / g.P * 100, 1) + ' %)' };
    },
    status: function (sim) {
      var p = sim.p;
      if (!bench(p)) { var g = grid(p); return !g.ok ? 'The wires would melt: far too much current at this voltage' : M.fmt(g.loss / g.P * 100, 1) + ' % of the power is lost in ' + p.km + ' km of line'; }
      var x = trans(p, st.t);
      if (x.dc) return Math.abs(x.vsNow) > 0.05 ? 'Flux changing: a short pulse in the secondary' : 'Steady DC: flux not changing, no output. Press the switch';
      return x.ratio > 1.01 ? 'Step-up transformer: Vs > Vp, Is < Ip' : x.ratio < 0.99 ? 'Step-down transformer: Vs < Vp, Is > Ip' : 'Equal turns: Vs ≈ Vp';
    },
    draw: function (sim) { if (bench(sim.p)) drawBench(sim); else drawGrid(sim); }
  });

  /* ---------- the transformer ---------- */
  function drawBench(sim) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, small = W < 560;
    D.clear(ctx, W, H, c.bg);
    var x = trans(p, st.t), C = CORE[p.core];
    var cw = Math.min(W * (small ? 0.4 : 0.5), H * 0.75, 330), ch = cw * 0.78, cx = W / 2, cy = H * 0.46, th = cw * 0.17;
    var x0 = cx - cw / 2, y0 = cy - ch / 2;
    // core
    if (p.core === 'air') {
      ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = D.alpha(c.ink, 0.3); ctx.lineWidth = 1.5; ctx.strokeRect(x0, y0, cw, ch); ctx.strokeRect(x0 + th, y0 + th, cw - 2 * th, ch - 2 * th); ctx.restore();
      D.text(ctx, 'no core: most flux misses the secondary', cx, cy, { color: c.muted, size: small ? 9 : 11, align: 'center', fit: W });
    } else {
      ctx.fillStyle = c.light ? '#94a3b8' : '#475569';
      ctx.beginPath(); ctx.rect(x0, y0, cw, ch); ctx.rect(x0 + th, y0 + th, cw - 2 * th, ch - 2 * th); ctx.fill('evenodd');
      if (p.core === 'lam') { ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, cw, ch); ctx.rect(x0 + th, y0 + th, cw - 2 * th, ch - 2 * th); ctx.clip('evenodd'); ctx.strokeStyle = 'rgba(15,23,42,0.35)'; ctx.lineWidth = 1; for (var q = 3; q < Math.max(cw, ch); q += 4) { ctx.beginPath(); ctx.moveTo(x0 + q, y0); ctx.lineTo(x0 + q, y0 + th); ctx.moveTo(x0 + q, y0 + ch - th); ctx.lineTo(x0 + q, y0 + ch); ctx.moveTo(x0, y0 + q); ctx.lineTo(x0 + th, y0 + q); ctx.moveTo(x0 + cw - th, y0 + q); ctx.lineTo(x0 + cw, y0 + q); ctx.stroke(); } ctx.restore(); }
      if (p.core === 'solid' && !x.dc && x.Pin > 0.5) { ctx.save(); ctx.globalAlpha = M.clamp((x.Pin - x.Ps) / 40, 0.1, 0.5); ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.rect(x0, y0, cw, ch); ctx.rect(x0 + th, y0 + th, cw - 2 * th, ch - 2 * th); ctx.fill('evenodd'); ctx.restore(); D.text(ctx, 'core warms up (eddy currents)', cx, y0 - 8, { color: '#f97316', size: small ? 9 : 11, align: 'center', weight: 600 }); }
    }
    // flux dots going round the core
    var ex = Math.exp(-Math.max(0, st.t - st.swT) / TAU);
    var fluxNow = x.dc ? (st.on ? 1 - ex : ex) : -Math.cos(2 * Math.PI * st.t);
    var pathLen = 2 * (cw - th) + 2 * (ch - th), nd = 16, phase = x.dc ? 0 : Math.sin(2 * Math.PI * st.t) / (2 * Math.PI) * 0.35;
    for (var i = 0; i < nd; i++) {
      var s = ((i / nd + phase) % 1 + 1) % 1 * pathLen, pt = loopPoint(s, x0 + th / 2, y0 + th / 2, cw - th, ch - th);
      ctx.save(); ctx.globalAlpha = M.clamp(Math.abs(fluxNow), 0.08, 1) * (p.core === 'air' ? 0.35 : 1); D.circle(ctx, pt[0], pt[1], small ? 2.2 : 3, '#38bdf8'); ctx.restore();
    }
    // coils
    var legH = ch - 2 * th;
    function coil(lx, n, col, label) {
      var drawn = M.clamp(Math.round(4 + Math.log2(n / 10) * 2.6), 3, 26), hh = legH * 0.86, top = cy - hh / 2, wpx = th * 1.6;
      for (var k = 0; k < drawn; k++) { var yy = top + hh * (k + 0.5) / drawn; D.roundRect(ctx, lx - wpx / 2, yy - hh / drawn * 0.38, wpx, hh / drawn * 0.76, 3, col, 'rgba(0,0,0,0.35)', 1); }
      D.text(ctx, label, lx, top + hh + (small ? 11 : 14), { color: c.ink, size: small ? 10 : 12, weight: 700, align: 'center' });
      return { top: top, bot: top + hh };
    }
    var lc = coil(x0 + th / 2, p.Np, '#d97706', p.Np + ' turns'), rc = coil(x0 + cw - th / 2, p.Ns, '#b45309', p.Ns + ' turns');
    // primary circuit: source on the left
    var sx = Math.max(small ? 26 : 40, x0 - (small ? 46 : 80)), wpx = th * 0.8;
    D.line(ctx, x0 + th / 2 - wpx, lc.top, sx, lc.top, '#94a3b8', 2); D.line(ctx, sx, lc.top, sx, cy - 16, '#94a3b8', 2);
    D.line(ctx, x0 + th / 2 - wpx, lc.bot, sx, lc.bot, '#94a3b8', 2); D.line(ctx, sx, lc.bot, sx, cy + 16, '#94a3b8', 2);
    if (x.dc) {
      D.line(ctx, sx - 12, cy - 4, sx + 12, cy - 4, c.ink, 3); D.line(ctx, sx - 7, cy + 4, sx + 7, cy + 4, c.ink, 3);
      D.line(ctx, sx, cy - 16, sx, cy - 4, '#94a3b8', 2);
      // switch
      if (!st.on) { D.line(ctx, sx, cy + 4, sx, cy + 8, '#94a3b8', 2); D.line(ctx, sx, cy + 8, sx + 10, cy + 16, c.ink, 2); }
      else D.line(ctx, sx, cy + 4, sx, cy + 16, '#94a3b8', 2);
      D.text(ctx, '12 V ' + (st.on ? 'on' : 'off'), sx, cy - 26, { color: c.ink, size: small ? 10 : 12, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 2 });
    } else {
      D.circle(ctx, sx, cy, 16, c.bg, c.ink, 2);
      ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.beginPath(); for (var a = 0; a <= 20; a++) { var xx = sx - 9 + a * 0.9, yy = cy - Math.sin(a / 20 * Math.PI * 2) * 5; if (a) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); ctx.restore();
      D.text(ctx, vp(p) + ' V AC', sx, cy - 26, { color: c.ink, size: small ? 10 : 12, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 2 });
    }
    D.text(ctx, 'Ip ' + fmtA(x.Ip), sx, cy + 30, { color: c.muted, size: small ? 9.5 : 11, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 2, fit: W });
    // secondary circuit: lamp on the right
    var lx = Math.min(W - (small ? 26 : 40), x0 + cw + (small ? 46 : 80));
    D.line(ctx, x0 + cw - th / 2 + wpx, rc.top, lx, rc.top, '#94a3b8', 2); D.line(ctx, lx, rc.top, lx, cy - 14, '#94a3b8', 2);
    D.line(ctx, x0 + cw - th / 2 + wpx, rc.bot, lx, rc.bot, '#94a3b8', 2); D.line(ctx, lx, rc.bot, lx, cy + 14, '#94a3b8', 2);
    var glow = M.clamp(Math.sqrt(x.Ps / 40), 0, 1.3);
    if (!x.dc) glow *= 0.75 + 0.25 * Math.abs(Math.sin(2 * Math.PI * st.t));
    if (glow > 0.02) { ctx.save(); ctx.globalAlpha = M.clamp(glow, 0, 1) * 0.6; var gr = ctx.createRadialGradient(lx, cy, 2, lx, cy, 40); gr.addColorStop(0, '#fde68a'); gr.addColorStop(1, 'rgba(253,230,138,0)'); ctx.fillStyle = gr; ctx.fillRect(lx - 40, cy - 40, 80, 80); ctx.restore(); }
    D.circle(ctx, lx, cy, 13, glow > 0.05 ? D.alpha('#fde047', M.clamp(0.25 + glow, 0, 1)) : c.bg, c.ink, 2);
    D.line(ctx, lx - 6, cy - 6, lx + 6, cy + 6, c.ink, 1.5); D.line(ctx, lx - 6, cy + 6, lx + 6, cy - 6, c.ink, 1.5);
    D.text(ctx, 'Vs ' + fmtV(x.Vs), lx, cy - 26, { color: c.ink, size: small ? 10 : 12, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 2, fit: W });
    D.text(ctx, 'Is ' + fmtA(x.Is), lx, cy + 28, { color: c.muted, size: small ? 9.5 : 11, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 2, fit: W });
    if (x.Vs > 1000 && !x.dc) D.text(ctx, '⚠ dangerous high voltage', W / 2, H - 12, { color: c.danger, size: small ? 11 : 13, weight: 700, align: 'center' });
    else D.text(ctx, C.name + (x.dc ? '' : ' · Vs/Vp = Ns/Np'), W / 2, H - 12, { color: c.muted, size: small ? 10 : 12, align: 'center', fit: W });
    D.text(ctx, x.ratio > 1.01 ? 'STEP-UP' : x.ratio < 0.99 ? 'STEP-DOWN' : '1 : 1', W / 2, small ? 12 : 16, { color: c.accent, size: small ? 11 : 14, weight: 800, align: 'center' });
  }
  function loopPoint(s, x, y, w, h) {
    if (s < w) return [x + s, y]; s -= w;
    if (s < h) return [x + w, y + s]; s -= h;
    if (s < w) return [x + w - s, y + h]; s -= w;
    return [x, y + h - s];
  }

  /* ---------- the power line ---------- */
  function drawGrid(sim) {
    var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, small = W < 560, g = grid(p);
    D.clear(ctx, W, H, c.bg);
    var gy = H * 0.72, m = small ? 8 : 16;
    D.line(ctx, 0, gy, W, gy, D.alpha(c.ink, 0.3), 2);
    // station
    var sw = small ? 46 : 70, sh = sw * 0.8;
    D.roundRect(ctx, m, gy - sh, sw, sh, 4, c.light ? '#cbd5e1' : '#334155', D.alpha(c.ink, 0.4), 1);
    D.roundRect(ctx, m + sw * 0.62, gy - sh - sw * 0.5, sw * 0.18, sw * 0.5, 2, c.light ? '#94a3b8' : '#475569');
    D.text(ctx, 'power', m + sw / 2, gy - sh * 0.62, { color: c.ink, size: small ? 9 : 11, align: 'center', weight: 600 });
    D.text(ctx, 'station', m + sw / 2, gy - sh * 0.3, { color: c.ink, size: small ? 9 : 11, align: 'center', weight: 600 });
    // transformers
    var up = p.Vline > 0.3, tw = small ? 22 : 30;
    function tbox(x, label) { D.roundRect(ctx, x - tw / 2, gy - tw * 1.2, tw, tw * 1.2, 3, '#64748b', D.alpha(c.ink, 0.4), 1); D.circle(ctx, x - tw * 0.18, gy - tw * 0.6, tw * 0.22, null, '#f59e0b', 2); D.circle(ctx, x + tw * 0.18, gy - tw * 0.6, tw * 0.22, null, '#f59e0b', 2); D.text(ctx, label, x, gy + (small ? 10 : 13), { color: c.muted, size: small ? 9 : 10, align: 'center' }); }
    var tx1 = m + sw + tw, tx2 = W - m - (small ? 66 : 110) - tw;
    if (up) { tbox(tx1, 'step-up'); tbox(tx2, 'step-down'); }
    // towers and line
    var ty = gy - H * 0.38, n = small ? 3 : 5, lx0 = tx1 + tw / 2, lx1 = tx2 - tw / 2;
    var heat = g.ok ? M.clamp(g.loss / g.P * 2.5, 0, 1) : 1;
    var wireCol = heat > 0.05 ? 'rgb(' + Math.round(148 + 107 * heat) + ',' + Math.round(163 - 120 * heat) + ',' + Math.round(184 - 150 * heat) + ')' : '#94a3b8';
    var pts = [[lx0, gy - tw * 1.2]];
    for (var i = 0; i < n; i++) {
      var x = lx0 + (lx1 - lx0) * (i + 0.5) / n;
      ctx.strokeStyle = D.alpha(c.ink, 0.55); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 10, gy); ctx.lineTo(x, ty); ctx.lineTo(x + 10, gy); ctx.moveTo(x - 12, ty + 6); ctx.lineTo(x + 12, ty + 6); ctx.moveTo(x - 7, gy - (gy - ty) * 0.4); ctx.lineTo(x + 7, gy - (gy - ty) * 0.4); ctx.stroke();
      pts.push([x, ty + 6]);
    }
    pts.push([lx1, gy - tw * 1.2]);
    ctx.save(); if (heat > 0.3) { ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10 * heat; }
    ctx.strokeStyle = wireCol; ctx.lineWidth = 2 + heat * 2; ctx.beginPath();
    for (i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + 14; if (i === 1) ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); }
    ctx.stroke(); ctx.restore();
    // moving charge dots: faster for bigger current
    for (var k = 0; k < 14; k++) {
      var f = ((k / 14 + st.flow) % 1), seg = Math.min(pts.length - 2, Math.floor(f * (pts.length - 1))), u = f * (pts.length - 1) - seg;
      var A = pts[seg], B = pts[seg + 1], cxp = (A[0] + B[0]) / 2, cyp = Math.max(A[1], B[1]) + 14;
      var px = (1 - u) * (1 - u) * A[0] + 2 * u * (1 - u) * cxp + u * u * B[0], py = (1 - u) * (1 - u) * A[1] + 2 * u * (1 - u) * cyp + u * u * B[1];
      D.circle(ctx, px, py, 2.5, '#fde047');
    }
    D.text(ctx, p.km + ' km of line, R = ' + M.fmt(g.R, 1) + ' Ω', (lx0 + lx1) / 2, ty - 12, { color: c.ink, size: small ? 10 : 12, weight: 600, align: 'center', fit: W });
    D.text(ctx, fmtV(g.V) + ' · ' + fmtA(g.I), (lx0 + lx1) / 2, ty - (small ? 26 : 30), { color: c.accent, size: small ? 11 : 14, weight: 700, align: 'center', fit: W });
    // town
    var hx = W - m - (small ? 62 : 104), lit = g.ok ? g.got / g.P : 0, nh = 4, hw = (small ? 60 : 100) / nh;
    for (i = 0; i < nh; i++) {
      var bx = hx + i * hw, bh = hw * (1 + (i % 2) * 0.4);
      D.roundRect(ctx, bx + 1, gy - bh, hw - 2, bh, 2, c.light ? '#e2e8f0' : '#1e293b', D.alpha(c.ink, 0.4), 1);
      var on = (i + 0.5) / nh <= lit + 0.001;
      D.roundRect(ctx, bx + hw * 0.3, gy - bh * 0.7, hw * 0.4, bh * 0.3, 1, on ? '#fde047' : D.alpha(c.ink, 0.2));
    }
    D.text(ctx, 'town', hx + nh * hw / 2, gy + (small ? 10 : 13), { color: c.muted, size: small ? 9 : 10, align: 'center' });
    // summary bar: delivered vs lost
    var bx0 = m, bw = W - 2 * m, by = H - (small ? 30 : 38), bhh = small ? 10 : 14;
    var share = g.ok ? g.got / g.P : 0;
    D.roundRect(ctx, bx0, by, bw, bhh, 4, D.alpha('#ef4444', 0.7));
    if (share > 0) D.roundRect(ctx, bx0, by, bw * share, bhh, 4, c.success);
    D.text(ctx, g.ok ? 'reaches the town ' + M.fmt(share * 100, 1) + ' %  ·  lost as heat ' + M.fmt(100 - share * 100, 1) + ' %' : 'at 230 V the current would be ' + fmtA(g.I) + ': the wires would melt', W / 2, by + bhh + (small ? 10 : 12), { color: g.ok ? c.ink : c.danger, size: small ? 10 : 12, weight: 600, align: 'center', fit: W });
  }
})();
