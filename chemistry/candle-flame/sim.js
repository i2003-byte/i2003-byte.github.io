/* =====================================================================
   Chemical reactions · Zones of a Candle Flame — sim.js
   ---------------------------------------------------------------------
   A candle flame drawn as three nested shapes (height fraction s from
   the flame base, 0 → 1 at the tip):
     dark zone      unburnt wax vapour round the wick   ~600–800 °C
     luminous zone  partial burning, glowing soot       ~1200 °C
     outer zone     complete burning, faint blue        ~1400 °C
   Temperatures are rounded textbook-style values (real ones vary).
   The temperature field blends smoothly between the zones, plus a
   plume of hot gas above the tip.
   Probes (drag or tap; the two sliders do the same):
     thermometer  thermocouple reading that settles in about a second
     glass plate  soot builds up where the plate cuts the luminous zone
                  (a ring if the plate is low enough to cut the dark zone)
     glass tube   wax vapour flows out if the end is in the dark zone and
                  can be lit with a match
     copper wire  each bit heats to ~62% of the gas temperature and glows
   Jar: the flame uses oxygen (0.32 %/s × flame size, about 3× slower
   than a real tumbler) and goes out below 16% oxygen. On blocks, fresh
   air flows in and the oxygen stays near 20.5%.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var ROOM = 30, O2_AIR = 21, O2_OUT = 16, USE = 0.32;
  var NU = 56, NZ = 20, NW = 64;          // soot grid on the plate, wire segments
  var ZONE = {
    dark:  { name: 'Dark zone', text: 'Dark zone: unburnt wax vapour around the wick. Air cannot reach here, so nothing burns. Least hot, about 600–800 °C.' },
    lum:   { name: 'Luminous zone', text: 'Luminous zone: too little air, so the wax burns only partly. Tiny hot carbon (soot) particles glow yellow. About 1200 °C.' },
    outer: { name: 'Outer zone', text: 'Outer, non-luminous zone: plenty of air, so the wax burns completely with a faint blue flame. The hottest part, about 1400 °C.' },
    base:  { name: 'Blue base', text: 'Blue base: fresh air flows in at the bottom of the flame, so the vapour burns completely here with a small blue flame.' },
    plume: { name: 'Above the flame', text: 'Above the tip: hot carbon dioxide and water vapour rise and cool quickly. Move the probe down into the flame.' },
    out:   { name: 'Outside the flame', text: 'Outside the flame the air is at room temperature (about 30 °C). Drag the probe into the flame.' },
    none:  { name: 'No flame', text: '' }
  };
  var DEF = {          // default probe spot: [sideways %, height %]
    thermo: [0, 20], plate: [0, 27], tube: [0, 16], wire: [-72, 62]
  };
  var st = { lit: true, size: 1, o2: O2_AIR, mist: 0, outT: 0, reading: ROOM, soot: new Float32Array(NU * NZ),
    sootMax: 0, wire: new Float32Array(NW), vap: 0, tubeLit: false, matchT: 0, flow: 0 };
  var vt = 0, grab = null, sootCv = null;

  function ss(a, b, x) { var t = M.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function g(u, a, b) { return u <= 0 || u >= 1 ? 0 : Math.pow(Math.sin(Math.PI * Math.pow(u, a)), b); }
  // half-widths as a fraction of half the flame width, at height fraction s
  function hwOuter(s) { return g(s, 0.62, 0.85); }
  function hwLum(s) { return 0.8 * g((s - 0.06) / 0.9, 0.62, 0.85); }
  function hwDark(s) { return 0.44 * g((s - 0.02) / 0.42, 0.5, 0.8); }

  function lerpHex(a, b, t) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    var r = Math.round(M.lerp(x >> 16, y >> 16, t)), gg = Math.round(M.lerp((x >> 8) & 255, (y >> 8) & 255, t)), bb = Math.round(M.lerp(x & 255, y & 255, t));
    return 'rgb(' + r + ',' + gg + ',' + bb + ')';
  }
  var TSTOPS = [[0, '#3b82f6'], [0.3, '#a855f7'], [0.5, '#ef4444'], [0.75, '#f59e0b'], [1, '#fde68a']];
  function tcol(T) {
    var t = M.clamp(T / 1500, 0, 1);
    for (var i = 1; i < TSTOPS.length; i++) if (t <= TSTOPS[i][0]) return lerpHex(TSTOPS[i - 1][1], TSTOPS[i][1], (t - TSTOPS[i - 1][0]) / (TSTOPS[i][0] - TSTOPS[i - 1][0]));
    return TSTOPS[TSTOPS.length - 1][1];
  }

  function geom(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560;
    var boxH = narrow ? 40 : 44, top = boxH + 10;
    var standH = narrow ? 9 : 12, standY = H - standH - 5;
    var ch = Math.max(40, H * 0.15), waxTop = standY - ch;
    var tipMin = top + 26;
    var wickH = M.clamp((waxTop - tipMin) * 0.075, 7, 24);
    var yb = waxTop - wickH * 0.35, fh0 = Math.max(60, yb - tipMin), fw0 = fh0 * 0.36;
    var k = st.lit ? st.size : 0;
    var G = { W: W, H: H, narrow: narrow, boxH: boxH, top: top, standY: standY, standH: standH, waxTop: waxTop, wickH: wickH,
      yb: yb, fh0: fh0, fw0: fw0, cx: W / 2, cw: M.clamp(fw0 * 1.35, 34, 170),
      fh: fh0 * (0.3 + 0.7 * k), fw: fw0 * (0.55 + 0.45 * k), scale: W >= 640 };
    G.lean = sim.p.breeze && sim.p.cover === 'open' ? fw0 * 0.45 : 0;
    G.jw = Math.max(G.cw * 1.9, fw0 * 2.5); G.jTop = yb - fh0 - 16;
    return G;
  }
  function probeXY(sim, G) {
    return { x: M.clamp(G.cx + sim.p.px / 100 * G.fw0, 6, G.W - 6), y: M.clamp(G.yb - sim.p.ph / 100 * G.fh0, G.top + 4, G.waxTop - 2) };
  }
  function local(G, x, y) {
    var s = (G.yb - y) / G.fh;
    return { s: s, dx: x - G.cx - G.lean * Math.pow(M.clamp(s, 0, 1.5), 1.5) };
  }
  function tempAt(G, x, y) {
    if (!st.lit) return ROOM;
    var L = local(G, x, y), s = L.s, ax = Math.abs(L.dx), hw = G.fw / 2, T = ROOM;
    if (s > -0.05 && s < 1.05) {
      var o = hwOuter(s), l = hwLum(s), d = hwDark(s);
      var ro = o > 0 ? ax / (hw * o) : 99, rl = l > 0 ? ax / (hw * l) : 99, rd = d > 0 ? ax / (hw * d) : 99;
      var wO = 1 - ss(0.9, 1.3, ro), wL = 1 - ss(0.85, 1.12, rl), wD = 1 - ss(0.8, 1.15, rd);
      var Tout = M.lerp(1050, 1400, ss(0, 0.22, s)), Tlum = 1150 + 60 * s, Tdark = 600 + 200 * M.clamp((s - 0.02) / 0.42, 0, 1);
      T = ROOM + wO * ((Tout - ROOM) + wL * ((Tlum - Tout) + wD * (Tdark - Tlum)));
    }
    if (s > 0.85) {
      var pw = G.fw * 0.3 * (1 + Math.max(0, s - 1) * 0.8);
      T = Math.max(T, ROOM + 1150 * Math.exp(-Math.max(0, s - 1) / 0.3) * Math.exp(-(L.dx * L.dx) / (pw * pw)));
    }
    return ROOM + (T - ROOM) * (0.82 + 0.18 * st.size);
  }
  function zoneAt(G, x, y) {
    if (!st.lit) return 'none';
    var L = local(G, x, y), s = L.s, ax = Math.abs(L.dx), hw = G.fw / 2;
    if (s >= 0 && s <= 1) {
      if (ax < hw * hwDark(s)) return 'dark';
      if (ax < hw * hwLum(s)) return 'lum';
      if (ax < hw * hwOuter(s)) return s < 0.13 ? 'base' : 'outer';
    }
    if (s > 1 && s < 2.2 && ax < G.fw * 0.4) return 'plume';
    return 'out';
  }
  function wireX(G, P, i) { return P.x + (G.W - 8 - P.x) * i / (NW - 1); }
  function hottestWire() { var m = ROOM, k = 0; for (var i = 0; i < NW; i++) if (st.wire[i] > m) { m = st.wire[i]; k = i; } return { T: m, i: k }; }

  function measure(sim) {
    var G = geom(sim), P = probeXY(sim, G), p = sim.p, T, z;
    if (p.probe === 'thermo') { T = st.reading; z = zoneAt(G, P.x, P.y); }
    else if (p.probe === 'wire') {
      var h = hottestWire(); T = h.T;
      z = h.T > 250 ? zoneAt(G, wireX(G, P, h.i), P.y) : zoneAt(G, P.x, P.y);
    } else { T = tempAt(G, P.x, P.y); z = zoneAt(G, P.x, P.y); }
    return { T: T, zone: z, G: G, P: P };
  }
  function resetProbe() {
    st.reading = ROOM; st.soot.fill(0); st.sootMax = 0; st.wire.fill(ROOM); st.vap = 0; st.tubeLit = false; st.matchT = 0;
  }
  function wrap(ctx, str, maxW) {
    var words = str.split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function message(sim) {
    var p = sim.p, m = measure(sim), z = m.zone, t;
    if (!st.lit) return 'The flame went out: the air in the jar had too little oxygen left (about 16%). The white smoke is wax vapour cooling into tiny drops.';
    if (p.cover === 'jar') return 'Jar on the candle: burning uses up the oxygen and no fresh air can get in, so the flame shrinks, turns smoky and soon goes out. Oxygen: ' + st.o2.toFixed(1) + '%.';
    if (p.cover === 'raised') return 'Jar raised on blocks: fresh air flows in at the bottom and the hot gases get out, so the candle keeps burning.';
    if (p.probe === 'thermo') t = ZONE[z].text;
    else if (p.probe === 'plate') t = st.sootMax > 0.15 ? 'The black ring is soot: unburnt carbon from the luminous zone settles on the cool glass. ' + (z === 'outer' || z === 'plume' ? 'No new soot here: in the outer zone the carbon burns completely.' : '')
      : z === 'lum' || z === 'dark' ? 'Hold the plate here for about 10 seconds and watch the glass.' : 'Move the glass plate into the yellow, luminous zone of the flame.';
    else if (p.probe === 'tube') t = st.tubeLit ? 'The vapour at the end of the tube burns! So the dark zone is full of wax vapour that has not burnt yet.'
      : z === 'dark' ? 'White wax vapour flows out of the tube. Press “Hold a lit match at the tube” to try to light it.'
      : z === 'lum' ? 'From the luminous zone only a little black smoke (soot) comes out of the tube.' : 'Put the lower end of the glass tube in the dark zone, just around the wick.';
    else t = m.T > 600 ? 'The parts of the wire in the outer zone glow brightest: the outer, non-luminous zone is the hottest part of the flame.' : 'Hold the copper wire across the flame and wait a few seconds.';
    if (sim.time === 0 && !sim.running) t = 'Drag or tap to move the probe. ' + t;
    return t;
  }

  SimLab.createSim({
    ariaLabel: 'A burning candle with its flame zones labelled: the dark inner zone of unburnt wax vapour, the yellow luminous zone and the faint blue outer zone, which is the hottest. A probe that you drag into the flame measures the temperature, collects soot, draws off wax vapour or heats a copper wire. A glass jar can cover the candle',
    mobileAspect: '1 / 1',
    playLabel: 'Start',
    params: [
      { id: 'probe', label: 'Probe', type: 'select', value: 'thermo', options: [
        { value: 'thermo', label: 'Thermometer (thermocouple)' },
        { value: 'plate', label: 'Glass plate (with tongs)' },
        { value: 'tube', label: 'Glass tube' },
        { value: 'wire', label: 'Copper wire' }] },
      { id: 'ph', label: 'Probe height above the flame base', min: -10, max: 125, step: 1, value: 20, unit: '%', help: 'You can also drag the probe in the picture.' },
      { id: 'px', label: 'Probe sideways from the middle', min: -150, max: 150, step: 1, value: 0, unit: '%' },
      { id: 'cover', label: 'Cover the candle', type: 'select', value: 'open', options: [
        { value: 'open', label: 'Open air' },
        { value: 'jar', label: 'Glass jar over the candle' },
        { value: 'raised', label: 'Jar raised on two blocks' }] },
      { id: 'breeze', label: 'Gentle breeze (draught)', type: 'toggle', value: false },
      { id: 'labels', label: 'Show zone labels', type: 'toggle', value: true }
    ],
    buttons: [{ label: 'Hold a lit match at the tube', onClick: function (sim) {
      if (sim.p.probe !== 'tube') sim.setParam('probe', 'tube', true);
      st.matchT = 2.5; if (!sim.running) sim.play();
    } }],
    readouts: [
      { id: 'zone', label: 'Probe is in', key: true },
      { id: 'temp', label: 'Temperature at the probe', short: 'Temperature', unit: '°C', digits: 0, key: true },
      { id: 'o2', label: 'Oxygen in the air around the flame', short: 'Oxygen', unit: '%', digits: 1, key: true },
      { id: 'size', label: 'Flame size', unit: '%', digits: 0 },
      { id: 'soot', label: 'Soot on the glass plate', unit: '%', digits: 0 },
      { id: 'wire', label: 'Hottest part of the copper wire', unit: '°C', digits: 0 },
      { id: 'vap', label: 'Wax vapour from the tube' }
    ],
    graph: { title: 'Probe temperature vs time', yLabel: '°C', xLabel: 'time (s)', window: 30, yMin: 0, yMax: 1600,
      series: [{ label: 'Temperature at the probe', color: '--sim-1' }] },
    reset: function (sim) {
      st.lit = true; st.size = 1; st.o2 = O2_AIR; st.mist = 0; st.outT = 0; st.flow = 0;
      resetProbe();
    },
    onParam: function (sim, id, v) {
      if (id === 'probe') {
        resetProbe();
        sim.setParam('px', DEF[v][0]); sim.setParam('ph', DEF[v][1]);
        return true;
      }
      if (id === 'cover') return false;
      return true;
    },
    animate: function (sim) { return !sim.reduceMotion; },
    update: function (sim, dt) {
      var p = sim.p, G = geom(sim), P = probeXY(sim, G);
      // oxygen and flame size
      if (st.lit) {
        var use = USE * st.size;
        if (p.cover === 'jar') st.o2 -= use * dt;
        else if (p.cover === 'raised') st.o2 += (-use + 0.9 * (O2_AIR - st.o2)) * dt;
        else st.o2 += 2 * (O2_AIR - st.o2) * dt;
        st.size = 0.3 + 0.7 * Math.sqrt(M.clamp((st.o2 - O2_OUT) / (O2_AIR - O2_OUT), 0, 1));
        if (st.o2 <= O2_OUT) { st.lit = false; st.outT = 0; }
        if (p.cover !== 'open') st.mist = Math.min(1, st.mist + dt * (p.cover === 'jar' ? 0.05 : 0.015));
        st.flow = p.cover === 'raised' ? 1 : 0;
      } else st.outT += dt;
      // probes
      var Tg = tempAt(G, P.x, P.y), z = zoneAt(G, P.x, P.y);
      st.reading += (Tg - st.reading) * (1 - Math.exp(-dt / 0.7));
      if (p.probe === 'plate' && st.lit) {
        var L = local(G, P.x, P.y), s = L.s, hw = G.fw / 2, l = hwLum(s), d = hwDark(s);
        if (l > 0 && P.y > G.yb - G.fh) {
          var Lp = G.fw0 * 2.6, Dp = G.fw0 * 1.4, rate = 0.13 * (1 + 2 * (1 - st.size)) * dt;
          for (var i = 0; i < NU; i++) {
            var dx = L.dx + (i + 0.5 - NU / 2) / NU * Lp;
            for (var j = 0; j < NZ; j++) {
              var zz = (j + 0.5 - NZ / 2) / NZ * Dp, rho = Math.sqrt(dx * dx + zz * zz);
              var wL = 1 - ss(0.85, 1.05, rho / (hw * l)), wD = d > 0 ? 1 - ss(0.8, 1.05, rho / (hw * d)) : 0;
              var k = i * NZ + j, a = wL * (1 - wD);
              if (a > 0.001) { st.soot[k] = Math.min(1, st.soot[k] + a * rate); if (st.soot[k] > st.sootMax) st.sootMax = st.soot[k]; }
            }
          }
        }
      }
      if (p.probe === 'wire') {
        var f = 1 - Math.exp(-dt / 1.1);
        for (var w = 0; w < NW; w++) {
          var Teq = ROOM + 0.62 * (tempAt(G, wireX(G, P, w), P.y) - ROOM);
          st.wire[w] += (Teq - st.wire[w]) * f;
        }
      }
      if (p.probe === 'tube') {
        var target = z === 'dark' ? 1 : z === 'lum' ? 0.25 : 0;
        st.vap += (target - st.vap) * (1 - Math.exp(-dt / 0.6));
        st.tubeSooty = z === 'lum';
        if (st.matchT > 0) { st.matchT -= dt; if (st.vap > 0.45) st.tubeLit = true; }
        if (st.vap < 0.3) st.tubeLit = false;
      }
    },
    sample: function (sim) { return [measure(sim).T]; },
    readout: function (sim) {
      var m = measure(sim), p = sim.p;
      return {
        zone: ZONE[m.zone].name,
        temp: Math.round(m.T / 10) * 10,
        o2: st.o2,
        size: st.lit ? st.size * 100 : 0,
        soot: p.probe === 'plate' ? st.sootMax * 100 : '—',
        wire: p.probe === 'wire' ? Math.round(hottestWire().T / 10) * 10 : '—',
        vap: p.probe !== 'tube' ? '—' : st.tubeLit ? 'Burning at the end' : st.vap > 0.45 ? 'Flowing out' : st.vap > 0.15 ? (st.tubeSooty ? 'A little, sooty' : 'A little') : 'None'
      };
    },
    status: function (sim) {
      if (!st.lit) return 'Flame out: not enough oxygen left in the jar';
      return sim.p.cover === 'jar' ? 'Under a jar · oxygen ' + st.o2.toFixed(1) + '%' : sim.p.cover === 'raised' ? 'Jar on blocks · fresh air flows in' : 'Burning in open air';
    },
    pointer: {
      down: function (sim, x, y) {
        var G = geom(sim), P = probeXY(sim, G);
        if (y < G.top) return false;
        grab = Math.hypot(x - P.x, y - P.y) < 34 ? { dx: P.x - x, dy: P.y - y } : { dx: 0, dy: 0 };
        place(sim, G, x, y);
        if (!sim.running) sim.play();
        return true;
      },
      move: function (sim, x, y) { if (grab) place(sim, geom(sim), x, y); },
      up: function () { grab = null; },
      hover: function (sim, x, y) { return y > geom(sim).top; }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, G = geom(sim), W = G.W, H = G.H, P = probeXY(sim, G);
      if (sim.running || !sim.reduceMotion) vt = (now || 0) / 1000;
      D.clear(ctx, W, H, c.bg);
      var light = c.light;

      // flicker (visual only)
      var amp = st.lit ? 0.025 + (G.lean ? 0.06 : 0) + (1 - st.size) * 0.05 : 0;
      var flk = 1 + amp * (0.5 * Math.sin(6.3 * vt) + 0.3 * Math.sin(11.7 * vt + 1.3) + 0.2 * Math.sin(17.9 * vt + 0.4));
      var sway = G.fw * amp * 1.6 * (Math.sin(3.1 * vt) + 0.5 * Math.sin(7.7 * vt + 2));
      var V = { cx: G.cx, yb: G.yb, fh: G.fh * flk, hw: G.fw / 2 * (2 - flk),
        off: function (s) { s = Math.max(0, s); return G.lean * Math.pow(s, 1.5) + sway * s * s; } };

      // warm glow on the table and backdrop
      if (st.lit) {
        var gy = G.yb - G.fh * 0.45, gr = ctx.createRadialGradient(G.cx, gy, 0, G.cx, gy, G.fh0 * 0.95);
        gr.addColorStop(0, light ? 'rgba(255,170,60,0.22)' : 'rgba(255,170,70,0.26)');
        gr.addColorStop(1, 'rgba(255,170,70,0)');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      }

      drawCandle(ctx, G, light);

      // flame (clipped below a glass plate held in it)
      var plateIn = p.probe === 'plate' && st.lit && P.y < G.yb && P.y > G.yb - V.fh;
      if (st.lit) {
        ctx.save();
        if (plateIn) { ctx.beginPath(); ctx.rect(0, P.y, W, H); ctx.clip(); }
        drawFlame(ctx, G, V, light);
        ctx.restore();
        if (plateIn) {   // flame spreads out under the cool plate
          var sp = Math.max(0, (G.yb - P.y) / V.fh), hwp = V.hw * Math.max(0.35, hwOuter(Math.min(sp, 0.98))) * 1.5;
          ctx.save(); ctx.beginPath(); ctx.ellipse(G.cx + V.off(sp), P.y + 3, hwp, 5, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,190,70,0.55)'; ctx.fill(); ctx.restore();
        }
      }
      drawWick(ctx, G, V);
      lastCover = p.cover;
      drawSmoke(ctx, G, V, light);
      if (p.cover !== 'open') drawJar(ctx, G, c, p.cover === 'raised');
      if (G.scale) drawScale(ctx, G, c, measure(sim).T);
      if (p.labels && st.lit) drawLabels(ctx, G, c, p, P, plateIn);
      drawProbe(ctx, sim, G, P, V, c);

      // message box
      var txt = message(sim), fsz = G.narrow ? 11.5 : 13;
      ctx.font = '600 ' + fsz + 'px Inter, system-ui, sans-serif';
      var lines = wrap(ctx, txt, W - 24);
      while (lines.length > 2 && fsz > 9) { fsz -= 0.5; ctx.font = '600 ' + fsz + 'px Inter, system-ui, sans-serif'; lines = wrap(ctx, txt, W - 24); }
      D.roundRect(ctx, 6, 4, W - 12, G.boxH, 8, D.alpha(c.accent, 0.12));
      var nl = Math.min(2, lines.length);
      lines.slice(0, 2).forEach(function (ln, k) {
        D.text(ctx, ln, 14, 4 + G.boxH / 2 + (k - (nl - 1) / 2) * (fsz + 3), { color: c.text, size: fsz, weight: 600 });
      });
    }
  });

  function place(sim, G, x, y) {
    x += grab ? grab.dx : 0; y += grab ? grab.dy : 0;
    y = M.clamp(y, G.top + 4, G.waxTop - 2); x = M.clamp(x, 6, G.W - 6);
    sim.setParam('px', M.clamp(Math.round((x - G.cx) / G.fw0 * 100), -150, 150));
    sim.setParam('ph', M.clamp(Math.round((G.yb - y) / G.fh0 * 100), -10, 125));
  }

  /* ---------- drawing ---------- */
  function fpath(ctx, V, fn, s0, s1) {
    var n = 40, i, s;
    ctx.beginPath();
    for (i = 0; i <= n; i++) { s = s0 + (s1 - s0) * i / n; ctx[i ? 'lineTo' : 'moveTo'](V.cx + V.off(s) + V.hw * fn(s), V.yb - s * V.fh); }
    for (i = n; i >= 0; i--) { s = s0 + (s1 - s0) * i / n; ctx.lineTo(V.cx + V.off(s) - V.hw * fn(s), V.yb - s * V.fh); }
    ctx.closePath();
  }

  function drawFlame(ctx, G, V, light) {
    var k = st.size, yb = V.yb, fh = V.fh;
    // outer, non-luminous zone
    fpath(ctx, V, hwOuter, 0, 1);
    ctx.fillStyle = light ? 'rgba(70,110,235,0.30)' : 'rgba(110,140,255,0.30)'; ctx.fill();
    ctx.strokeStyle = light ? 'rgba(60,95,220,0.6)' : 'rgba(150,175,255,0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
    // blue base
    ctx.save(); fpath(ctx, V, hwOuter, 0, 1); ctx.clip();
    var bg = ctx.createLinearGradient(0, yb, 0, yb - fh * 0.2);
    bg.addColorStop(0, 'rgba(40,90,255,0.95)'); bg.addColorStop(1, 'rgba(40,90,255,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, yb - fh * 0.2, G.W, fh * 0.2 + 4);
    ctx.restore();
    // luminous zone
    fpath(ctx, V, hwLum, 0.06, 0.96);
    var lg = ctx.createLinearGradient(0, yb - 0.06 * fh, 0, yb - 0.96 * fh);
    lg.addColorStop(0, 'rgba(255,150,40,0.85)'); lg.addColorStop(0.16, '#ffc94a'); lg.addColorStop(0.45, '#fff1a8');
    lg.addColorStop(0.78, '#ffd35c'); lg.addColorStop(1, 'rgba(255,120,30,0.9)');
    ctx.fillStyle = lg; ctx.fill();
    if (k < 1) { ctx.fillStyle = 'rgba(230,80,20,' + ((1 - k) * 0.75).toFixed(3) + ')'; ctx.fill(); }
    if (light) { ctx.strokeStyle = 'rgba(225,135,20,0.75)'; ctx.lineWidth = 1.2; ctx.stroke(); }
    // dark zone
    fpath(ctx, V, hwDark, 0.02, 0.44);
    var dg = ctx.createLinearGradient(0, yb, 0, yb - 0.44 * fh);
    dg.addColorStop(0, 'rgba(30,30,70,0.85)'); dg.addColorStop(0.7, 'rgba(45,35,45,0.7)'); dg.addColorStop(1, 'rgba(90,60,30,0.25)');
    ctx.fillStyle = dg; ctx.fill();
  }

  function drawCandle(ctx, G, light) {
    var cx = G.cx, cw = G.cw, top = G.waxTop, bot = G.standY;
    // brass stand
    D.roundRect(ctx, cx - cw * 1.1, bot, cw * 2.2, G.standH, 4, '#b08d57', light ? 'rgba(80,60,30,0.6)' : null, 1);
    // body
    var bg = ctx.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0);
    bg.addColorStop(0, '#e8dcc0'); bg.addColorStop(0.35, '#fffaf0'); bg.addColorStop(1, '#d9caa6');
    ctx.fillStyle = bg; ctx.fillRect(cx - cw / 2, top, cw, bot - top);
    if (light) { ctx.strokeStyle = 'rgba(120,100,60,0.55)'; ctx.lineWidth = 1; ctx.strokeRect(cx - cw / 2, top, cw, bot - top); }
    // drips
    ctx.fillStyle = '#f6eedb';
    D.roundRect(ctx, cx - cw / 2 - 1, top, 5, (bot - top) * 0.35, 2.5, '#f3e9d2');
    D.roundRect(ctx, cx + cw * 0.28, top, 5, (bot - top) * 0.22, 2.5, '#f3e9d2');
    // top + melted pool
    var ry = Math.max(3, cw * 0.09);
    ctx.beginPath(); ctx.ellipse(cx, top, cw / 2, ry, 0, 0, Math.PI * 2); ctx.fillStyle = '#efe4c8'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, top, cw * 0.36, ry * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle = st.lit || st.outT < 6 ? 'rgba(255,214,120,0.85)' : '#e9dcbc'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - cw * 0.1, top - ry * 0.15, cw * 0.12, ry * 0.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
  }

  function drawWick(ctx, G, V) {
    var lw = Math.max(2.5, G.fw0 * 0.045), x0 = G.cx, y0 = G.waxTop + 1, y1 = G.waxTop - G.wickH;
    var bend = (st.lit ? V.off(0.05) : 0) + lw * 0.8;
    ctx.save(); ctx.strokeStyle = '#2a211c'; ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0, y1 + G.wickH * 0.3, x0 + bend, y1); ctx.stroke(); ctx.restore();
    var glow = st.lit ? 1 : Math.max(0, 1 - st.outT / 3);
    if (glow > 0) D.circle(ctx, x0 + bend, y1, lw * 0.75, 'rgba(255,110,30,' + glow.toFixed(2) + ')');
  }

  function drawSmoke(ctx, G, V, light) {
    var amt, sx, sy, white;
    if (st.lit) {
      amt = Math.max(0, (1 - st.size) * 1.4 - 0.1) + (G.lean ? 0.3 : 0);
      sx = G.cx + V.off(1); sy = G.yb - V.fh; white = false;
    } else { amt = st.outT < 9 ? 1 - st.outT / 9 : 0; sx = G.cx; sy = G.waxTop - G.wickH; white = true; }
    if (amt <= 0.01) return;
    var topY = sim_top(G), span = Math.max(20, sy - topY);
    for (var i = 0; i < 16; i++) {
      var ph = ((vt * 0.3 + i / 16) % 1 + 1) % 1, y = sy - ph * span;
      var x = sx + Math.sin(ph * 5 + i * 1.7 + vt * 0.8) * (3 + ph * 16) + (G.lean ? G.lean * ph * 1.2 : 0);
      var a = amt * 0.4 * Math.min(1, ph * 5) * (1 - ph);
      var col = white ? (light ? '150,150,160' : '225,225,232') : (light ? '70,70,80' : '170,170,180');
      D.circle(ctx, x, y, 2.5 + ph * 9, 'rgba(' + col + ',' + a.toFixed(3) + ')');
    }
  }
  function sim_top(G) { return lastCover !== 'open' ? G.jTop + 8 : G.top + 2; }
  var lastCover = 'open';

  function drawJar(ctx, G, c, raised) {
    var bh = raised ? Math.max(9, G.H * 0.03) : 0, x0 = G.cx - G.jw / 2, x1 = G.cx + G.jw / 2, y0 = G.jTop, y1 = G.standY - bh, r = 12;
    if (raised) {
      D.roundRect(ctx, x0 - 6, y1, 14, bh, 2, '#a0703a'); D.roundRect(ctx, x1 - 8, y1, 14, bh, 2, '#a0703a');
    }
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0 + r); ctx.quadraticCurveTo(x0, y0, x0 + r, y0); ctx.lineTo(x1 - r, y0);
    ctx.quadraticCurveTo(x1, y0, x1, y0 + r); ctx.lineTo(x1, y1);
    ctx.fillStyle = D.alpha(c.ink, 0.05); ctx.fill();
    ctx.strokeStyle = D.alpha(c.ink, 0.55); ctx.lineWidth = 2.5; ctx.stroke();
    // mist: water from burning condenses on the cool glass
    if (st.mist > 0.02) {
      var rr = M.rng(9), n = Math.round(45 * st.mist);
      for (var i = 0; i < n; i++) D.circle(ctx, x0 + 5 + rr() * (G.jw - 10), y0 + 5 + Math.pow(rr(), 1.6) * (y1 - y0) * 0.6, 0.7 + rr() * 1.1, D.alpha(c.ink, 0.2));
    }
    D.line(ctx, x0 + 7, y0 + 16, x0 + 7, y1 - 16, 'rgba(255,255,255,0.25)', 3);
    ctx.restore();
    if (raised && st.lit) {
      var ay = y1 + bh / 2;
      D.arrow(ctx, x0 - 34, ay, x0 + 10, ay, c.accent, 2, 7); D.arrow(ctx, x1 + 34, ay, x1 - 10, ay, c.accent, 2, 7);
    }
  }

  function drawProbe(ctx, sim, G, P, V, c) {
    var p = sim.p, light = c.light;
    if (p.probe === 'thermo') {
      var dx = 0.5, dy = -1, n = Math.hypot(dx, dy); dx /= n; dy /= n;
      var Lr = Math.max(20, Math.min(G.fh0 * 0.65, (P.y - G.top - 8) / -dy)), ex = P.x + dx * Lr, ey = P.y + dy * Lr;
      ctx.save(); ctx.lineCap = 'round';
      D.line(ctx, P.x, P.y, ex, ey, light ? '#475569' : '#1e293b', 5.5);
      D.line(ctx, P.x, P.y, ex, ey, '#cbd5e1', 3.5);
      D.line(ctx, ex, ey, ex + dx * 30, ey + dy * 30, '#334155', 10);
      ctx.restore();
      D.circle(ctx, P.x, P.y, 4.5, tcol(st.reading), light ? '#334155' : '#e2e8f0', 1.5);
      var mx = P.x + dx * Lr * 0.55, my = P.y + dy * Lr * 0.55;
      D.text(ctx, (Math.round(st.reading / 10) * 10) + ' °C', mx + 12, my, { color: c.text, bg: D.alpha(c.surface || c.bg, 0.92), size: G.narrow ? 12 : 13, weight: 700, fit: G.W });
    } else if (p.probe === 'plate') {
      var Lp = G.fw0 * 2.6, Dp = G.fw0 * 1.4 * 0.3, x0 = P.x - Lp / 2, y0 = P.y - Dp / 2;
      // tongs from the right
      D.line(ctx, x0 + Lp - 4, P.y - 2, Math.min(G.W - 4, x0 + Lp + 50), P.y - 22, light ? '#475569' : '#94a3b8', 2.5);
      D.line(ctx, x0 + Lp - 4, P.y + 2, Math.min(G.W - 4, x0 + Lp + 50), P.y - 14, light ? '#475569' : '#94a3b8', 2.5);
      ctx.fillStyle = light ? 'rgba(150,200,235,0.35)' : 'rgba(180,220,255,0.22)'; ctx.fillRect(x0, y0, Lp, Dp);
      if (st.sootMax > 0.01) {   // soot map, drawn smoothly scaled up from a tiny bitmap
        if (!sootCv) { sootCv = document.createElement('canvas'); sootCv.width = NU; sootCv.height = NZ; }
        var sc = sootCv.getContext('2d'), img = sc.createImageData(NU, NZ);
        for (var i = 0; i < NU; i++) for (var j = 0; j < NZ; j++) {
          var o = (j * NU + i) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = 15; img.data[o + 3] = Math.round(Math.min(0.92, st.soot[i * NZ + j] * 0.95) * 255);
        }
        sc.putImageData(img, 0, 0);
        ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(sootCv, x0, y0, Lp, Dp); ctx.restore();
      }
      ctx.strokeStyle = D.alpha(c.ink, 0.65); ctx.lineWidth = 1.3; ctx.strokeRect(x0, y0, Lp, Dp);
      D.line(ctx, x0, y0 + Dp + 1.5, x0 + Lp, y0 + Dp + 1.5, D.alpha(c.ink, 0.35), 2);
    } else if (p.probe === 'tube') {
      var a = M.rad(28), ux = Math.cos(a), uy = -Math.sin(a);
      var Lt = M.clamp((G.W - 14 - P.x) / ux, G.fw0 * 1.2, G.fw0 * 2.8), tx = P.x + ux * Lt, ty = P.y + uy * Lt;
      var tw = Math.max(7, G.fw0 * 0.11), nx = -uy * tw / 2, ny = ux * tw / 2;
      ctx.beginPath(); ctx.moveTo(P.x + nx, P.y + ny); ctx.lineTo(tx + nx, ty + ny); ctx.lineTo(tx - nx, ty - ny); ctx.lineTo(P.x - nx, P.y - ny); ctx.closePath();
      ctx.fillStyle = light ? 'rgba(150,200,235,0.3)' : 'rgba(190,220,255,0.18)'; ctx.fill();
      D.line(ctx, P.x + nx, P.y + ny, tx + nx, ty + ny, D.alpha(c.ink, 0.65), 1.6);
      D.line(ctx, P.x - nx, P.y - ny, tx - nx, ty - ny, D.alpha(c.ink, 0.65), 1.6);
      var vapCol = st.tubeSooty ? (light ? '60,60,60' : '120,120,120') : (light ? '140,140,150' : '235,235,240');
      if (st.vap > 0.05) {
        for (var q = 0; q < 8; q++) {   // vapour moving up the tube
          var ph = ((vt * 0.9 + q / 8) % 1 + 1) % 1;
          D.circle(ctx, P.x + ux * Lt * ph, P.y + uy * Lt * ph, tw * 0.28, 'rgba(' + vapCol + ',' + (st.vap * 0.6).toFixed(2) + ')');
        }
        if (!st.tubeLit) for (var w = 0; w < 10; w++) {
          var ph2 = ((vt * 0.4 + w / 10) % 1 + 1) % 1;
          D.circle(ctx, tx + ux * 6 + Math.sin(ph2 * 6 + w) * 4 * ph2 + ph2 * 8, ty - ph2 * G.fh0 * 0.35, 2 + ph2 * 6,
            'rgba(' + vapCol + ',' + (st.vap * 0.45 * (1 - ph2)).toFixed(3) + ')');
        }
      }
      if (st.tubeLit) {   // the vapour burns at the end of the tube
        var fs = Math.max(14, G.fw0 * 0.35) * (0.7 + 0.3 * st.vap) * (1 + 0.06 * Math.sin(vt * 9)), bx = tx + ux * 4, by = ty;
        var MV = { cx: bx, yb: by, fh: fs, hw: fs * 0.22, off: function () { return 0; } };
        fpath(ctx, MV, hwOuter, 0, 1); ctx.fillStyle = 'rgba(90,130,255,0.5)'; ctx.fill();
        fpath(ctx, MV, hwLum, 0.06, 0.96); ctx.fillStyle = '#ffd35c'; ctx.fill();
      }
      if (st.matchT > 0) {
        var mx2 = tx + 10, my2 = ty - 4, len = 46;
        D.line(ctx, mx2, my2, mx2 + len * 0.7, my2 - len * 0.7, '#c08a4a', 3);
        D.circle(ctx, mx2, my2, 3.5, '#b91c1c');
        var MF = { cx: mx2 - 1, yb: my2 - 2, fh: 14, hw: 3.6, off: function () { return 0; } };
        fpath(ctx, MF, hwOuter, 0, 1); ctx.fillStyle = '#ffb347'; ctx.fill();
      }
    } else {
      // copper wire from the right, held in a wooden handle
      var xr = G.W - 8;
      D.line(ctx, P.x, P.y, xr, P.y, '#b87333', 2.6);
      for (var s = 0; s < NW - 1; s++) {
        var T = (st.wire[s] + st.wire[s + 1]) / 2, gl = Math.pow(M.clamp((T - 480) / 420, 0, 1), 1.2);
        if (gl <= 0.01) continue;
        var xa = wireX(G, P, s), xb = wireX(G, P, s + 1), col = 'rgba(255,' + Math.round(40 + 120 * gl) + ',' + Math.round(20 + 40 * gl * gl) + ',';
        D.line(ctx, xa, P.y, xb, P.y, col + (gl * (light ? 0.45 : 0.4)).toFixed(3) + ')', 12);
        D.line(ctx, xa, P.y, xb, P.y, col + Math.min(1, gl * 1.5).toFixed(3) + ')', 4);
      }
      D.roundRect(ctx, xr - 6, P.y - 5, 12, 10, 3, '#8b5a2b');
    }
  }

  function drawLabels(ctx, G, c, p, P, plateIn) {
    var hw = G.fw / 2, yb = G.yb, fh = G.fh, cx = G.cx, n = G.narrow;
    var leanAt = function (s) { return G.lean * Math.pow(s, 1.5); };
    var gapL = n ? 14 : Math.min(70, G.W * 0.06), left = cx - G.fw0 / 2 - gapL, right = cx + G.fw0 / 2 + gapL, pill = false;
    if (p.cover !== 'open') {   // keep labels clear of the jar wall when there is room, else give them a backing
      if (cx - G.jw / 2 - 12 >= 170) { left = cx - G.jw / 2 - 14; right = cx + G.jw / 2 + 14; } else pill = true;
    }
    var L = [
      { side: -1, s: 0.78, ax: function (s) { return cx + leanAt(s) - hw * hwOuter(s) * 0.92; }, dot: '#6b8cff',
        lines: n ? ['Outer zone', 'blue · ~1400 °C'] : ['Outer zone', 'non-luminous, faint blue', 'complete burning · hottest, ~1400 °C'] },
      { side: -1, s: 0.5, ax: function (s) { return cx + leanAt(s) - hw * hwLum(s) * 0.45; }, dot: '#ffd35c',
        lines: n ? ['Luminous zone', 'yellow · ~1200 °C'] : ['Luminous zone', 'yellow, glowing soot', 'partial burning · ~1200 °C'] },
      { side: 1, s: 0.2, ax: function (s) { return cx + leanAt(s) + hw * hwDark(s) * 0.3; }, dot: '#3b3355',
        lines: n ? ['Dark zone', 'wax vapour · ~700 °C'] : ['Dark zone', 'unburnt wax vapour', 'least hot · ~600–800 °C'] },
      { side: -1, s: 0.05, ax: function (s) { return cx + leanAt(s) - hw * hwOuter(s) * 0.7; }, dot: '#2f62ff', lines: ['Blue base'], up: true }
    ];
    var f1 = n ? 12 : 14, f2 = n ? 10.5 : 12;
    L.forEach(function (lb) {
      if (plateIn && yb - lb.s * fh < P.y) return;     // that part of the flame is hidden by the plate
      var ay = yb - lb.s * fh, axp = lb.ax(lb.s), x = lb.side < 0 ? left : right;
      if (p.probe === 'plate' && Math.abs(ay - P.y) < G.fw0 * 0.21 + 26) {   // clear of the plate, or not at all
        x = lb.side > 0 ? Math.max(x, P.x + G.fw0 * 1.3 + 12) : Math.min(x, P.x - G.fw0 * 1.3 - 12);
        if ((lb.side > 0 ? G.W - x - (G.scale ? 104 : 6) : x - 6) < 110) return;
      }
      var maxW = lb.side < 0 ? x - 6 : G.W - x - (G.scale ? 104 : 6);
      var s1 = f1, s2 = f2;
      ctx.font = '700 ' + s1 + 'px Inter, system-ui, sans-serif';
      var wmax = function () {
        var m = 0; lb.lines.forEach(function (t, i) { ctx.font = (i ? 500 : 700) + ' ' + (i ? s2 : s1) + 'px Inter, system-ui, sans-serif'; m = Math.max(m, ctx.measureText(t).width); }); return m;
      };
      while (wmax() > maxW && s2 > 8) { s1 -= 0.5; s2 -= 0.5; }
      var lh = s2 + 3, hgt = s1 + (lb.lines.length - 1) * lh;
      var ly = lb.up ? Math.min(ay - 6, G.waxTop - 6 - hgt / 2) : ay;   // centre of the block
      var y0 = ly - hgt / 2 + s1 / 2, al = lb.side < 0 ? 'right' : 'left';
      var lx = lb.side < 0 ? x + 4 : x - 4;
      D.line(ctx, lx, y0, axp, ay, D.alpha(c.ink, 0.55), 1.2);
      D.circle(ctx, axp, ay, 3.2, lb.dot, c.light ? '#1e293b' : '#ffffff', 1.2);
      lb.lines.forEach(function (t, i) {
        D.text(ctx, t, x, y0 + (i ? s1 / 2 + 3 + (i - 0.5) * lh : 0), { color: i ? c.muted : c.text, size: i ? s2 : s1, weight: i ? 500 : 700, align: al, bg: pill ? D.alpha(c.bg, 0.8) : null, pad: 2 });
      });
    });
  }

  function drawScale(ctx, G, c, T) {
    var x = G.W - 52, y0 = G.top + 26, y1 = G.waxTop, bw = 10;
    var gr = ctx.createLinearGradient(0, y1, 0, y0);
    TSTOPS.forEach(function (s) { gr.addColorStop(s[0], s[1]); });
    D.text(ctx, 'Temperature', x + bw / 2, G.top + 10, { color: c.muted, size: 11, weight: 600, align: 'center' });
    D.roundRect(ctx, x, y0, bw, y1 - y0, 4, gr);
    [0, 500, 1000, 1500].forEach(function (v) {
      var y = y1 - v / 1500 * (y1 - y0);
      D.line(ctx, x - 4, y, x, y, c.muted, 1);
      D.text(ctx, v + ' °C', x - 7, y, { color: c.muted, size: 10.5, align: 'right' });
    });
    var ym = y1 - M.clamp(T, 0, 1500) / 1500 * (y1 - y0);
    ctx.beginPath(); ctx.moveTo(x + bw + 2, ym); ctx.lineTo(x + bw + 10, ym - 6); ctx.lineTo(x + bw + 10, ym + 6); ctx.closePath();
    ctx.fillStyle = c.accent; ctx.fill();
  }
})();
