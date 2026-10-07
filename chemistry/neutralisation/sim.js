/* =====================================================================
   Chemistry · Neutralisation — sim.js
   ---------------------------------------------------------------------
   10 mL of dilute hydrochloric acid (1 mol/L) in a flask, with a few
   drops of indicator. Dilute sodium hydroxide (1 mol/L) is run in from
   a burette one drop (0.05 mL) at a time (or the other way round).
     HCl + NaOH → NaCl + H₂O  (+ heat)
   Both are strong, so the net amount of acid left decides the pH:
     x = (n_acid − n_base) ÷ V_total,  [H⁺] = (x + √(x² + 4K_w)) ÷ 2,
     pH = −log[H⁺],  K_w = 10⁻¹⁴ at 25 °C.
   Neutral at exactly 10.00 mL; the pH jumps from about 3 to 11 within
   two drops around that point.
   Heat: 57 kJ per mole of water formed (57 J per mmol). All of it warms
   the liquid (density 1 g/mL, 4.18 J/g°C, no heat lost); the solution
   from the burette starts at room temperature 27 °C.
   Salt formed: 58.4 mg of NaCl per mmol.
   Indicator colours: phenolphthalein colourless below pH 8.2, pink above
   (full by 10); turmeric yellow, turning red-brown from pH 7.4 to 8.6;
   china rose dark pink in acid, pale near neutral, green in base
   (a simple model of a natural dye; real extracts vary).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var DROP = 0.05, VA = 10, C = 1, KW = 1e-14, ROOM = 27, VMAX = 20;
  var IND = {
    php: { name: 'phenolphthalein', tp: 8.2 },
    rose: { name: 'china rose', tp: 7 },
    turmeric: { name: 'turmeric', tp: 8 }
  };

  function mix(a, b, t) { t = M.clamp(t, 0, 1); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')'; }
  var CLEAR = [226, 236, 244];
  function indColour(ind, pH) {
    if (ind === 'php') return mix(CLEAR, [236, 72, 153], (pH - 8.2) / 1.8);
    if (ind === 'turmeric') return mix([250, 204, 21], [180, 35, 24], (pH - 7.4) / 1.2);
    if (pH < 7) return mix([192, 38, 122], [217, 163, 200], (pH - 4.5) / 2.5);
    return mix([217, 163, 200], [22, 163, 74], (pH - 7.5) / 1.5);
  }
  function colourWord(ind, pH) {
    if (ind === 'php') return pH < 8.2 ? 'colourless' : pH < 9 ? 'light pink' : 'pink';
    if (ind === 'turmeric') return pH < 7.4 ? 'yellow' : pH < 8.6 ? 'orange-brown' : 'red-brown';
    return pH < 6 ? 'dark pink' : pH < 7.5 ? 'pale pink' : pH < 8.5 ? 'greyish green' : 'green';
  }

  function chem(p, v) { // v = mL added from the burette
    var acidIn = p.flask === 'acid', nA = (acidIn ? VA : v) * C, nB = (acidIn ? v : VA) * C, Vt = VA + v;
    var x = (nA - nB) / Vt, h = (x + Math.sqrt(x * x + 4 * KW)) / 2, react = Math.min(nA, nB);
    return { pH: -Math.log10(h), react: react, T: ROOM + 57 * react / (Vt * 4.18), Vt: Vt, left: nA - nB };
  }

  function layout(W, H) {
    var small = W < 560, bx = W * (small ? 0.3 : 0.32), top = 34, btm = H * 0.5, fy0 = H * 0.6, fy1 = H - 26;
    var fw = Math.min(W * (small ? 0.42 : 0.3), 190, (fy1 - fy0) * 1.5);
    return { W: W, H: H, small: small, bx: bx, top: top, btm: btm, bw: small ? 14 : 18, fy0: fy0, fy1: fy1, fw: fw, neck: Math.max(14, fw * 0.2), px: W * (small ? 0.64 : 0.6) };
  }
  function addDrop(sim) {
    var s = sim.state; if (s.v >= VMAX - 1e-9) return false;
    var before = chem(sim.p, s.v).pH;
    s.v = Math.round((s.v + DROP) * 100) / 100;
    var after = chem(sim.p, s.v).pH;
    s.splash = { t: sim.time, wall: performance.now() };
    if (sim.graph) sim.graph.push(s.v, [after]);
    var tp = IND[sim.p.ind].tp;
    if (sim.p.stopAt && !s.stopped && (before - tp) * (after - tp) <= 0) { s.stopped = true; s.hold = true; return 'end'; }
    return true;
  }

  SimLab.createSim({
    ariaLabel: 'A burette adds sodium hydroxide drop by drop to hydrochloric acid with an indicator in a conical flask. The indicator changes colour at neutralisation, a thermometer shows the mixture getting warm, and a graph shows pH against volume added',
    playLabel: 'Open the tap',
    mobileAspect: '1 / 1',
    params: [
      { id: 'flask', label: 'In the flask (10 mL)', type: 'select', value: 'acid', options: [
        { value: 'acid', label: 'Dilute hydrochloric acid; add sodium hydroxide' },
        { value: 'base', label: 'Dilute sodium hydroxide; add hydrochloric acid' }] },
      { id: 'ind', label: 'Indicator in the flask', type: 'select', value: 'php', options: [
        { value: 'php', label: 'Phenolphthalein' }, { value: 'rose', label: 'China rose (gudhal)' }, { value: 'turmeric', label: 'Turmeric' }] },
      { id: 'flow', label: 'Tap opening', min: 0.05, max: 1, step: 0.05, value: 0.5, unit: 'mL/s',
        presets: [{ label: 'Drop by drop', value: 0.1 }, { label: 'Fast stream', value: 1 }] },
      { id: 'stopAt', label: 'Close the tap when the colour changes', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'v', label: 'Volume added from the burette', unit: 'mL', digits: 2, key: true },
      { id: 'what', label: 'In the flask now', key: true },
      { id: 'col', label: 'Indicator colour' },
      { id: 'pH', label: 'pH (below 7 acidic, above 7 basic)', digits: 1 },
      { id: 'T', label: 'Temperature', unit: '°C', digits: 1 },
      { id: 'salt', label: 'Common salt formed', unit: 'mg', digits: 0 }
    ],
    graph: { title: 'pH of the flask vs volume added', yLabel: 'pH', xLabel: 'volume added (mL)', xMax: VMAX, yMin: 0, yMax: 14, series: [{ label: 'pH' }] },
    buttonsTitle: 'Burette',
    buttons: [
      { label: '💧 Add 1 drop', primary: true, onClick: function (sim) { sim.pause(); addDrop(sim); sim.redraw(); } },
      { label: 'Add 1 mL', onClick: function (sim) { sim.pause(); for (var i = 0; i < 20; i++) if (addDrop(sim) === 'end') break; sim.redraw(); } }
    ],
    onParam: function (sim, id) { return id === 'flow' || id === 'stopAt'; },
    animate: function (sim) { var sp = sim.state.splash; return !!sp && performance.now() - sp.wall < 750; },
    onRunChange: function (sim, on) { if (on) sim.state.hold = false; },
    reset: function (sim) {
      sim.state = { v: 0, acc: 0, stopped: false, hold: false, splash: null, drops: [] };
      if (sim.graph) sim.graph.push(0, [chem(sim.p, 0).pH]);
    },
    update: function (sim, dt) {
      var s = sim.state; if (s.hold) return;
      s.acc += dt * sim.p.flow / DROP;
      while (s.acc >= 1) {
        s.acc -= 1;
        var r = addDrop(sim);
        if (r === 'end') { s.acc = 0; sim.pause(); if (sim.toast) sim.toast('Colour changed: tap closed. Press “Open the tap” to go on.'); break; }
        if (!r) break;
      }
    },
    finished: function (sim) { return sim.state.v >= VMAX - 1e-9; },
    readout: function (sim) {
      var s = sim.state, p = sim.p, q = chem(p, s.v), acidIn = p.flask === 'acid';
      var what = Math.abs(q.pH - 7) < 0.5 ? 'neutral: only salt and water' : q.left > 0 ? 'acidic: some acid is left' : 'basic: extra base';
      if (s.v === 0) what = acidIn ? 'acidic: only acid so far' : 'basic: only base so far';
      return { v: s.v, what: what, col: colourWord(p.ind, q.pH), pH: q.pH, T: q.T, salt: q.react * 58.44 };
    },
    status: function (sim) {
      var s = sim.state;
      return (sim.running ? 'Tap open' : s.v >= VMAX ? 'Burette run finished · Reset to start again' : 'Tap closed') + ' · ' + M.fmt(s.v, 2) + ' mL added';
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, s = sim.state, L = layout(sim.width, sim.height), fs = L.small ? 10 : 12;
      var q = chem(p, s.v), acidIn = p.flask === 'acid';
      D.clear(ctx, L.W, L.H, c.bg);
      D.text(ctx, L.small ? 'Acid + base → salt + water' : 'Acid + base → salt + water + heat (neutralisation)', L.W / 2, 15,
        { color: c.bg, bg: c.s3, size: L.small ? 11 : 13, weight: 700, align: 'center', pad: 4, fit: L.W });
      var glass = c.light ? '#64748b' : '#cbd5e1';

      // stand
      D.line(ctx, L.bx - L.fw * 0.75, L.fy1 + 4, L.bx + L.fw * 0.75, L.fy1 + 4, c.border, 4);

      // burette with scale (0 at the top)
      var bL = L.bx - L.bw / 2, bh = L.btm - L.top, mlPx = bh / 25, lev = L.top + s.v * mlPx;
      ctx.fillStyle = c.light ? 'rgba(147,197,253,0.45)' : 'rgba(226,236,244,0.55)'; ctx.fillRect(bL, lev, L.bw, L.btm - lev);
      D.roundRect(ctx, bL, L.top - 4, L.bw, bh + 4, 3, null, glass, 1.5);
      for (var m = 0; m <= 25; m++) {
        var ty = L.top + m * mlPx, big = m % 5 === 0;
        D.line(ctx, bL, ty, bL + (big ? 7 : 4), ty, glass, 1);
        if (big) D.text(ctx, String(m), bL - 4, ty, { color: c.muted, size: L.small ? 8.5 : 10, align: 'right' });
      }
      D.text(ctx, 'mL', bL - 4, L.top - 12, { color: c.muted, size: L.small ? 8.5 : 10, align: 'right' });
      D.text(ctx, acidIn ? 'sodium hydroxide' : 'hydrochloric acid', L.bx + L.bw / 2 + 6, L.top + 10, { color: c.text, size: fs, weight: 700 });
      D.text(ctx, acidIn ? '(dilute base)' : '(dilute acid)', L.bx + L.bw / 2 + 6, L.top + 10 + fs + 3, { color: c.muted, size: fs - 1 });
      // tap and tip
      var tapY = L.btm + 8;
      D.line(ctx, L.bx, L.btm, L.bx, L.btm + 22, glass, 3);
      D.roundRect(ctx, L.bx - 11, tapY - 4, 22, 8, 3, sim.running ? '#22c55e' : '#94a3b8');
      var tipY = L.btm + 22, surf = L.fy1 - (L.fy1 - L.fy0) * Math.min(0.85, q.Vt / 42);
      // falling drops or stream
      if (sim.running && p.flow >= 0.6) D.line(ctx, L.bx, tipY, L.bx, surf, 'rgba(186,230,253,0.85)', 2);
      else if (sim.running) {
        var per = DROP / p.flow, ph = (sim.time % per) / per;
        D.circle(ctx, L.bx, tipY + ph * (surf - tipY), 2.6, 'rgba(186,230,253,0.95)');
      }

      // conical flask
      var hw = L.fw / 2, nk = L.neck / 2, bodyTop = L.fy0 + (L.fy1 - L.fy0) * 0.22;
      function flask() {
        ctx.beginPath(); ctx.moveTo(L.bx - nk, L.fy0); ctx.lineTo(L.bx - nk, bodyTop); ctx.lineTo(L.bx - hw, L.fy1 - 6);
        ctx.quadraticCurveTo(L.bx - hw, L.fy1, L.bx - hw + 6, L.fy1); ctx.lineTo(L.bx + hw - 6, L.fy1);
        ctx.quadraticCurveTo(L.bx + hw, L.fy1, L.bx + hw, L.fy1 - 6); ctx.lineTo(L.bx + nk, bodyTop); ctx.lineTo(L.bx + nk, L.fy0);
      }
      var col = indColour(p.ind, q.pH);
      ctx.save(); flask(); ctx.closePath(); ctx.clip();
      ctx.fillStyle = rgb(col, 0.92); ctx.fillRect(L.bx - hw, surf, L.fw, L.fy1 - surf);
      // a drop of the burette liquid briefly colours the spot where it lands
      if (s.splash) {
        var age = (performance.now() - s.splash.wall) / 1000;
        if (age < 0.7 && !sim.running || age < 0.35) {
          var tc = indColour(p.ind, acidIn ? 13 : 1);
          D.circle(ctx, L.bx, surf + 6, L.fw * 0.14 * (0.6 + age), rgb(tc, 0.8 * (1 - age / 0.7)));
        }
      }
      ctx.restore();
      flask(); ctx.strokeStyle = glass; ctx.lineWidth = 2; ctx.stroke();
      D.text(ctx, M.fmt(q.Vt, 1) + ' mL', L.bx, L.fy1 - 12, { color: '#0f172a', size: L.small ? 9 : 10.5, weight: 700, align: 'center', bg: 'rgba(255,255,255,0.65)', pad: 2 });
      D.text(ctx, 'flask: ' + (acidIn ? 'acid' : 'base') + ' + ' + IND[p.ind].name, L.bx, L.H - 10, { color: c.muted, size: fs - 1, align: 'center', fit: L.px - 4 });

      // right panel: thermometer and acid/base scale
      var px = L.px, pw = L.W - px - 10, tt = L.top + 18, tb = L.H - 34;
      var thx = px + (L.small ? 12 : 20), tr = L.small ? 7 : 9, tTop = tt + 6, tBot = tb - tr;
      var tf = M.clamp((q.T - 20) / 20, 0, 1), ty2 = tBot - tf * (tBot - tTop);
      D.roundRect(ctx, thx - 4, tTop - 4, 8, tBot - tTop + 6, 4, c.light ? '#fff' : '#1e293b', glass, 1.2);
      D.line(ctx, thx, tBot, thx, ty2, '#ef4444', 4);
      D.circle(ctx, thx, tb, tr, '#ef4444', glass, 1.2);
      [20, 25, 30, 35, 40].forEach(function (d) {
        var yy = tBot - (d - 20) / 20 * (tBot - tTop);
        D.line(ctx, thx + 5, yy, thx + 9, yy, c.muted, 1);
        D.text(ctx, d + '°', thx + 11, yy, { color: c.muted, size: L.small ? 8.5 : 10 });
      });
      D.text(ctx, M.fmt(q.T, 1) + ' °C', thx, tt - 8, { color: c.text, size: fs, weight: 800, align: 'center', fit: L.W });
      // pH bar
      var sx = thx + (L.small ? 40 : 52), sw = Math.min(L.small ? 16 : 22, pw * 0.2), st = tt, sb = tb + tr;
      for (var k = 0; k < 14; k++) {
        var y0 = sb - (k + 1) / 14 * (sb - st), hue = k < 7 ? 0 + k * 12 : k === 7 ? 120 : 140 + (k - 7) * 18;
        ctx.fillStyle = 'hsl(' + hue + ',70%,' + (c.light ? 55 : 48) + '%)'; ctx.fillRect(sx, y0, sw, (sb - st) / 14 + 0.5);
      }
      D.roundRect(ctx, sx, st, sw, sb - st, 2, null, glass, 1);
      [0, 7, 14].forEach(function (v) { D.text(ctx, String(v), sx + sw + 4, sb - v / 14 * (sb - st), { color: c.muted, size: L.small ? 8.5 : 10 }); });
      var my = sb - M.clamp(q.pH, 0, 14) / 14 * (sb - st);
      D.arrow(ctx, sx - 12, my, sx - 1, my, c.text, 2, 7);
      D.text(ctx, 'pH', sx + sw / 2, st - 8, { color: c.text, size: fs, weight: 800, align: 'center' });
      if (pw > 120) {
        var lx = sx + sw + 22;
        D.text(ctx, 'basic', lx, st + 10, { color: c.muted, size: fs - 1 });
        D.text(ctx, 'neutral', lx, (st + sb) / 2, { color: c.muted, size: fs - 1 });
        D.text(ctx, 'acidic', lx, sb - 10, { color: c.muted, size: fs - 1 });
      }
    }
  });
})();
