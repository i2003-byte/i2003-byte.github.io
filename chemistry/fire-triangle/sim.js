/* =====================================================================
   Chemical reactions · The Fire Triangle — sim.js
   ---------------------------------------------------------------------
   Scene 1 "Put out a fire": one fuel burns on a fire-proof tray (or a
   gas burner, or a sparking extension board). It burns only while all
   three sides of the fire triangle are there:
     fuel    F > 0 (and the gas knob / supply is open)
     oxygen  O ≥ 15 % near the fuel (normal air is 21 %)
     heat    T ≥ ignition temperature (to start by heat alone: Tauto;
             to keep an existing flame going: Tsus. They differ only
             for kerosene, whose vapour keeps burning above its flash
             point of about 50 °C once a flame is there.)
   Model (simple relaxations, per second):
     T relaxes to the burning temperature (alight) or to 30 °C (out);
       a match, sparks, water and CO₂ add their own pulls.
     O relaxes to 21 % in open air, minus what the flame uses; a lid
       stops the supply; sand and CO₂ push the air away.
     F falls at strength / life while burning.
   Scene 2 "Ignition temperature test": six items on a hot plate;
   each catches fire when it gets hotter than its ignition temperature,
   or (kerosene, LPG) when a lit match is held near and its vapour is
   hot enough to catch. The paper cup holds water, which stays at
   100 °C while it boils, so the paper does not burn.
   Values are approximate published figures, rounded.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var AMB = 30, O_MIN = 15, O_AIR = 21;

  var FUELS = {
    paper:    { name: 'Paper', Tauto: 230, Tsus: 230, Tburn: 600, tLight: 0.8, tCool: 6, life: 30, smoke: 0.55, smokeCol: '#9ca3af',
                intro: 'Crumpled paper on a fire-proof tray. Fuel ✓ and air ✓ are here, but no heat yet. Press Light it.' },
    wood:     { name: 'Wood', Tauto: 300, Tsus: 300, Tburn: 700, tLight: 2.5, tCool: 25, life: 120, smoke: 0.8, smokeCol: '#78716c',
                intro: 'Dry twigs on a fire-proof tray. Fuel ✓ and air ✓ are here, but no heat yet. Press Light it.' },
    kerosene: { name: 'Kerosene', Tauto: 220, Tsus: 50, Tburn: 180, tLight: 0.4, tCool: 30, life: 90, smoke: 0.9, smokeCol: '#27272a', oil: true,
                intro: 'A dish of kerosene on a fire-proof tray: an oil fire. Fuel ✓ and air ✓ are here, but no heat yet. Press Light it.' },
    lpg:      { name: 'LPG', Tauto: 450, Tsus: 450, Tburn: 800, tLight: 0.1, tCool: 0.4, life: 2400, smoke: 0, gas: true,
                intro: 'A gas stove burner with the knob open. LPG ✓ and air ✓ are here; it needs a spark or flame. Press Light it.' },
    electric: { name: 'Plastic', Tauto: 450, Tsus: 450, Tburn: 650, tLight: 2, tCool: 10, life: 90, smoke: 0.9, smokeCol: '#1f2937', elec: true,
                intro: 'An overloaded extension board with a loose plug. The mains power is on. Press Light it to see what happens.' }
  };
  var ITEMS = [
    { id: 'paper', name: 'Paper', Tauto: 230, tau: 2, life: 14 },
    { id: 'cup', name: 'Paper cup', Tauto: 230, tau: 2, life: 18, cup: true },
    { id: 'wood', name: 'Wood', Tauto: 300, tau: 5, life: 60 },
    { id: 'plastic', name: 'Plastic', Tauto: 450, tau: 3, life: 30 },
    { id: 'kerosene', name: 'Kerosene', Tauto: 220, Tflash: 50, tau: 4, life: 40 },
    { id: 'lpg', name: 'LPG jet', Tauto: 450, Tflash: -100, tau: 0.8, life: 1e9 }
  ];
  var SEL = { paper: 0, wood: 2, electric: 3, kerosene: 4, lpg: 5 };

  var st = {};
  function fuel(sim) { return FUELS[sim.p.fuel] || FUELS.paper; }
  function setMsg(t, k) { st.msg = { t: t, k: k || 'info' }; }
  function supplyOn(f) { return st.F > 0.0005 && (!f.gas || st.knob); }
  function needT(f) { return st.burning || st.pilot > 0 ? f.Tsus : f.Tauto; }

  function resetFire() {
    st.F = 1; st.O = O_AIR; st.T = AMB; st.burning = false; st.started = false; st.everLit = false;
    st.s = 0; st.pilot = 0; st.cover = null; st.coverAnim = 0; st.co2Dis = 0; st.co2Blanket = 0;
    st.pour = 0; st.spread = 0; st.knob = true; st.mains = true; st.leak = 0; st.smoke = 0; st.steam = 0;
    st.outFor = 0; st.last = null; st.msg = null; st.sparkT = 0;
  }
  function resetTest() {
    st.plate = AMB; st.started = false; st.msg = null; st.cupNote = 0;
    st.items = ITEMS.map(function () { return { T: AMB, F: 1, burning: false, water: 1 }; });
  }

  /* ------------------------------ physics ------------------------------ */
  function stepFire(sim, dt) {
    var f = fuel(sim);
    if (!st.started) {
      st.started = true;
      if (!f.elec) st.pilot = 4;
    }
    var sup = supplyOn(f);
    // temperature
    var dT = st.burning ? (f.Tburn - st.T) / (f.gas ? 0.2 : 1.5) : (AMB - st.T) / f.tCool;
    if (st.pilot > 0) dT += Math.max(0, Math.min(800, f.Tburn * 1.2) - st.T) / f.tLight;   // the match flame
    if (f.elec && st.mains && st.F > 0) dT += Math.max(0, 600 - st.T) / 2;       // sparks heat the plastic
    if (st.pour > 0 && !f.oil) dT += (25 - st.T) / 0.2;                             // water soaks up heat
    if (st.co2Dis > 0) dT += (20 - st.T) / 2.5;                                       // cold CO₂ gas
    st.T += dT * dt;
    // oxygen near the fuel
    if (st.co2Blanket > 0) st.O += (1 - st.O) / 0.4 * dt;
    else if (st.cover === 'sand') st.O += (1 - st.O) / 0.5 * dt;
    else if (st.cover === 'lid') st.O -= ((st.burning ? 2 * st.s : 0) + (st.T > 150 && !f.gas ? 0.4 : 0.1)) * dt;   // hot fuel keeps smouldering
    else st.O += ((O_AIR - st.O) / 2 - 1.2 * st.s) * dt;
    st.O = M.clamp(st.O, 0, O_AIR);
    // the triangle
    var was = st.burning;
    st.burning = sup && st.O >= O_MIN && (was ? st.T >= f.Tsus : (st.T >= f.Tauto || (st.pilot > 0 && st.T >= f.Tsus)));
    var fO = M.clamp((st.O - O_MIN) / (O_AIR - O_MIN), 0, 1), shape;
    if (sim.p.fuel === 'paper') shape = 0.35 + 0.65 * Math.sqrt(st.F);
    else if (sim.p.fuel === 'wood') shape = Math.min(1, 0.35 + st.F * 1.2);
    else if (f.oil) shape = Math.min(1, st.F / 0.05);
    else if (f.gas) shape = 1;
    else shape = 0.4 + 0.6 * Math.sqrt(st.F);
    var target = st.burning ? (0.3 + 0.7 * fO) * shape * (st.spread > 0 ? 1.8 : 1) : 0;
    st.s += (target - st.s) * Math.min(1, dt / (st.burning ? 0.5 : 0.25));
    if (st.burning) st.F = Math.max(0, st.F - st.s / f.life * dt);
    // smoke and steam
    var smokeT = st.burning ? f.smoke * Math.min(1, st.s) : (!f.gas && st.F > 0 && st.T > 150 ? f.smoke * 0.35 : 0);
    st.smoke += (smokeT - st.smoke) * Math.min(1, dt / 1.5);
    if (st.pour > 0 && st.T > 100) st.steam = 1;
    st.steam = Math.max(0, st.steam - dt / 3);
    // timers
    st.pilot = Math.max(0, st.pilot - dt); if (st.burning && st.pilot > 1) st.pilot = 1;
    st.pour = Math.max(0, st.pour - dt); st.co2Dis = Math.max(0, st.co2Dis - dt);
    st.co2Blanket = Math.max(0, st.co2Blanket - dt); st.spread = Math.max(0, st.spread - dt);
    if (st.cover) st.coverAnim = Math.min(1, st.coverAnim + dt / 0.6);
    st.sparkT += dt;
    st.leak = f.gas && st.knob && !st.burning && st.everLit ? st.leak + dt : 0;
    st.outFor = st.burning ? 0 : st.outFor + dt;
    // what happened?
    if (st.burning && !was) {
      if (!st.everLit) setMsg(f.elec
        ? 'The loose plug sparks and heats the plastic past its ignition temperature (about 450 °C): it catches fire! Fuel, oxygen and heat are all here. Now put it out.'
        : 'Burning! Fuel, oxygen (air) and heat are all here. Each button below removes one side of the triangle: try them.', 'info');
      else if (f.elec && st.mains) setMsg('It caught fire again! The sparking plug kept heating the plastic. Switch off the mains first.', 'danger');
      else setMsg('It caught fire again! The fuel was still above its ignition temperature (' + f.Tauto + ' °C) when fresh air came back.', 'warn');
      st.everLit = true;
    }
    if (was && !st.burning) outMessage(sim, f, sup);
    if (st.leak > 0 && st.leak <= dt * 1.01) setMsg('Flame out, but the gas is still on! LPG is leaking into the room. Close the knob at once, open doors and windows, and do not light a match or touch switches.', 'danger');
  }

  function outMessage(sim, f, sup) {
    if (f.gas && st.knob) return;   // the leak message follows
    if (!sup) {
      if (f.gas) setMsg('Gas knob closed: no fuel reaches the burner, so the flame dies at once. For any gas fire, cutting off the gas comes first.', 'good');
      else setMsg('The fire went out by itself: all the fuel has burnt. Only ash is left.', 'good');
      return;
    }
    var cause = st.O < O_MIN ? 'oxygen' : 'heat', a = st.last;
    if (cause === 'oxygen') {
      if (a === 'lid') setMsg('The cover stopped fresh air getting in. The fire used up the oxygen under it and went out.', 'good');
      else if (a === 'sand') setMsg('Sand smothered the fuel and pushed the air out. No oxygen, no fire.', 'good');
      else setMsg('Carbon dioxide is heavier than air. It settled over the fire like a blanket and pushed the oxygen away, so the fire went out.', 'good');
    } else {
      if (a === 'water') setMsg('Water soaked up the heat (and turned to steam), cooling the fuel below its ignition temperature of about ' + f.Tauto + ' °C. The fire went out.', 'good');
      else if (a === 'co2') setMsg('The very cold CO₂ cooled the fuel below its ignition temperature, so the fire went out.', 'good');
      else setMsg('The fuel cooled below its ignition temperature, so the fire went out.', 'good');
    }
    if (f.elec && st.mains) setMsg('The flames are out, but the plug is still sparking and heating the plastic. Switch off the mains, or it will catch fire again.', 'warn');
  }

  function stepTest(sim, dt) {
    st.started = true;
    var target = sim.p.plate, rate = 25;
    st.plate += M.clamp(target - st.plate, -rate * dt, rate * dt);
    st.items.forEach(function (it, i) {
      var I = ITEMS[i];
      if (it.burning) {
        it.T += (Math.max(st.plate, 600) - it.T) / 1 * dt;
        it.F = Math.max(0, it.F - dt / I.life);
        if (it.F <= 0) it.burning = false;
        return;
      }
      it.T += (st.plate - it.T) / I.tau * dt;
      if (I.cup && it.water > 0) {
        if (it.T >= 100) {
          it.T = 100;
          it.water = Math.max(0, it.water - (st.plate - 100) / (400 * 90) * dt);
          if (!st.cupNote) { st.cupNote = 1; setMsg('The water in the paper cup is boiling at 100 °C. It takes up the heat, so the paper stays far below its ignition temperature (about 230 °C) and does not burn.', 'info'); }
          if (it.water <= 0) setMsg('All the water in the cup has boiled away. Now nothing keeps the paper cool…', 'warn');
        }
      } else if (it.F > 0 && (it.T >= I.Tauto || (sim.p.spark && I.Tflash != null && it.T >= I.Tflash))) {
        it.burning = true;
        var byMatch = it.T < I.Tauto, tt = Math.round(Math.max(it.T, AMB));
        if (I.id === 'lpg' && byMatch) setMsg('LPG caught fire from the match at once, even at ' + tt + ' °C. Gases like LPG are inflammable: a flame or spark lights them. By heat alone they need about 450 °C.', 'warn');
        else if (I.id === 'kerosene' && byMatch) setMsg('Kerosene vapour caught fire from the match at ' + tt + ' °C, just above its flash point (about 50 °C). With no flame nearby it needs about 220 °C.', 'warn');
        else if (I.cup) setMsg('With the water gone, the paper cup reached about 230 °C and caught fire.', 'warn');
        else setMsg(I.name + ' caught fire at ' + tt + ' °C: it reached its ignition temperature (about ' + I.Tauto + ' °C) with no flame touching it.', 'info');
      }
    });
  }

  /* ------------------------------ actions ------------------------------ */
  function act(sim, what) {
    if (sim.p.scene !== 'fire') { setMsg('These buttons are for the “Put out a fire” scene. Change the Scene to use them.', 'info'); return; }
    var f = fuel(sim);
    if (!st.started) { setMsg('Light the fire first: press Light it.', 'info'); return; }
    if (cfg.finished(sim)) { setMsg('This fire is already out. Press Light it (or Reset) to start a new one.', 'info'); return; }
    if (what === 'lid' || what === 'sand') {
      if (st.cover) { setMsg('The fire is already covered with ' + (st.cover === 'lid' ? 'a lid' : 'sand') + '.', 'info'); return; }
      st.cover = what; st.coverAnim = 0; st.last = what;
      if (what === 'lid') setMsg(f.gas ? 'A fire blanket over the burner: no fresh air can reach the flame. Watch the oxygen fall…'
        : 'A metal lid (or a thick blanket) over the fire: no fresh air can get in. Watch the oxygen fall…', 'info');
      else setMsg('Sand covers the fuel and pushes the air out. Sand does not burn and does not conduct electricity.', 'info');
    } else if (what === 'water') {
      if (st.cover) { setMsg('The fire is covered, so water cannot reach it.', 'info'); return; }
      if (f.elec && st.mains) { setMsg('STOP! Never pour water on an electrical fire while the power is on. Water conducts electricity, so you could get a deadly shock. Switch off the mains first.', 'danger'); return; }
      st.pour = 1.5; st.last = 'water';
      if (f.oil) { st.spread = 8; setMsg('Wrong choice! Water is heavier than kerosene and does not mix with it. It sinks, boils and throws burning oil out of the dish: the fire spreads. Use sand, a lid or CO₂ for oil fires.', 'danger'); }
      else if (f.gas) setMsg('The water may cool the flame, but the gas keeps coming. For a gas fire, close the knob first.', 'warn');
      else if (f.elec) setMsg('The mains are off, so water will not give a shock now. Water cools the plastic, but CO₂ or sand is still the better choice for electrical fires.', 'info');
      else setMsg('Water takes away heat and turns to steam. Watch the temperature of the fuel…', 'info');
    } else if (what === 'co2') {
      st.co2Dis = 2; st.co2Blanket = 10; st.last = 'co2';
      setMsg('Whoosh! CO₂ comes out of the extinguisher very cold. It is heavier than air, so it covers the fire, and it does not conduct electricity.', 'info');
    } else if (what === 'shut') {
      if (f.gas) {
        if (!st.knob) { setMsg('The gas knob is already closed.', 'info'); return; }
        st.knob = false; st.last = 'shut';
        if (!st.burning) setMsg('Gas knob closed: the leak has stopped. Now open the doors and windows to let the gas out before anyone lights anything.', 'good');
      } else if (f.elec) {
        if (!st.mains) { setMsg('The mains are already off.', 'info'); return; }
        st.mains = false; st.last = 'shut';
        setMsg(st.burning ? 'Mains off: the sparking has stopped and water can no longer give a shock. But the plastic is still burning by itself. Now use CO₂ or sand.'
          : 'Mains off: the sparking has stopped, so the plastic can cool down and will not catch fire again.', 'good');
      } else { setMsg('There is no gas knob or mains switch for this fire: its fuel is already here. Choose another way to put it out.', 'info'); return; }
    }
    if (!sim.running) sim.play();
  }

  /* ------------------------------ drawing helpers ------------------------------ */
  function wrap(ctx, str, maxW) {
    var words = str.split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function banner(sim, txt, kind, H) {
    var ctx = sim.ctx, c = sim.colors, W = sim.width, narrow = W < 560;
    var col = kind === 'danger' ? c.danger : kind === 'warn' ? c.warning : kind === 'good' ? c.success : c.accent;
    var fsz = narrow ? 12 : 13.5, maxLines = 3;
    ctx.font = '600 ' + fsz + 'px Inter, system-ui, sans-serif';
    var lines = wrap(ctx, txt, W - 30);
    while (lines.length * (fsz + 3) > H - 6 && fsz > 9) { fsz -= 0.5; ctx.font = '600 ' + fsz + 'px Inter, system-ui, sans-serif'; lines = wrap(ctx, txt, W - 30); }
    lines = lines.slice(0, maxLines);
    D.roundRect(ctx, 6, 4, W - 12, H, 8, D.alpha(col, kind === 'info' ? 0.12 : 0.18), kind === 'info' ? null : D.alpha(col, 0.7), 1.5);
    lines.forEach(function (ln, k) {
      D.text(ctx, ln, 15, 4 + H / 2 + (k - (lines.length - 1) / 2) * (fsz + 3), { color: c.text, size: fsz, weight: 600 });
    });
  }
  function tongue(ctx, x, base, w, h, sway) {
    ctx.beginPath(); ctx.moveTo(x - w / 2, base);
    ctx.bezierCurveTo(x - w / 2, base - h * 0.45, x + sway * 0.5 - w * 0.22, base - h * 0.72, x + sway, base - h);
    ctx.bezierCurveTo(x + sway * 0.5 + w * 0.22, base - h * 0.72, x + w / 2, base - h * 0.45, x + w / 2, base);
    ctx.closePath();
  }
  /** A flickering flame. kind: 'fire' (yellow-orange) or 'gas' (blue). */
  function flame(ctx, x, base, w, h, t, kind, seed) {
    if (h < 2 || w < 2) return;
    var n = kind === 'gas' ? 1 : (w > 40 ? 5 : 3);
    ctx.save();
    var glow = ctx.createRadialGradient(x, base - h * 0.35, 0, x, base - h * 0.35, Math.max(w, h) * 0.8);
    glow.addColorStop(0, kind === 'gas' ? 'rgba(96,165,250,0.30)' : 'rgba(255,140,40,0.32)'); glow.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = glow; ctx.fillRect(x - Math.max(w, h), base - h * 1.3, Math.max(w, h) * 2, h * 1.6);
    var layers = kind === 'gas'
      ? [[1, 'rgba(37,99,235,0.85)', 'rgba(96,165,250,0)'], [0.6, 'rgba(147,197,253,0.95)', 'rgba(191,219,254,0)']]
      : [[1, 'rgba(234,88,12,0.92)', 'rgba(220,38,38,0)'], [0.72, 'rgba(251,146,60,0.95)', 'rgba(250,204,21,0)'], [0.42, 'rgba(254,240,138,0.98)', 'rgba(255,255,255,0)']];
    layers.forEach(function (L) {
      for (var i = 0; i < n; i++) {
        var u = n === 1 ? 0 : i / (n - 1) - 0.5, prof = 1 - Math.abs(u) * 1.1;
        var hi = h * L[0] * (0.55 + 0.45 * prof) * (0.86 + 0.14 * Math.sin(t * 9 + i * 2.1 + seed));
        var wi = w * (n === 1 ? 1 : 0.42) * L[0];
        var xi = x + u * w * 0.62, sway = Math.sin(t * 6.3 + i * 1.7 + seed) * w * 0.07;
        var g = ctx.createLinearGradient(0, base, 0, base - hi);
        g.addColorStop(0, L[1]); g.addColorStop(1, L[2]);
        if (kind !== 'gas' && L[0] === 1) { g = ctx.createLinearGradient(0, base, 0, base - hi); g.addColorStop(0, 'rgba(59,130,246,0.7)'); g.addColorStop(0.15, L[1]); g.addColorStop(1, L[2]); }
        ctx.fillStyle = g; tongue(ctx, xi, base, wi, hi, sway); ctx.fill();
      }
    });
    ctx.restore();
  }
  function puffs(ctx, x, y, spread, rise, t, amount, col, n, seed) {
    if (amount <= 0.02) return;
    for (var k = 0; k < n; k++) {
      var ph = (t * 0.35 + k / n + seed) % 1;
      var px = x + Math.sin(k * 7.3 + seed * 3) * spread * 0.3 + ph * spread * (0.4 + 0.3 * Math.sin(k)), py = y - ph * rise;
      D.circle(ctx, px, py, 4 + ph * spread * 0.35, D.alpha(col, amount * 0.45 * (1 - ph)));
    }
  }
  function hotCol(T) {   // dark metal → dull red → orange as it heats up
    var a = M.clamp((T - 150) / 350, 0, 1);
    return 'rgb(' + Math.round(M.lerp(71, 239, a)) + ',' + Math.round(M.lerp(85, 88, a)) + ',' + Math.round(M.lerp(105, 32, a)) + ')';
  }

  /* ------------------------------ scene 1: the fire ------------------------------ */
  function drawTriangle(sim, box, f) {
    var ctx = sim.ctx, c = sim.colors, narrow = sim.width < 560;
    var sup = supplyOn(f), fuelOk = sup, oxOk = st.O >= O_MIN, heatOk = st.T >= needT(f);
    var side = box.w > box.h * 1.3;
    var triW = side ? box.w * 0.48 : box.w, triH = side ? box.h : box.h * 0.56;
    var s = Math.min(triW - 40, (triH - 44) / 0.866, 230), h = s * 0.866;
    var cx = box.x + triW / 2, top = box.y + (side ? (box.h - h) / 2 - 4 : 20 + Math.max(0, (triH - 44 - h) / 2));
    var A = { x: cx, y: top }, B = { x: cx - s / 2, y: top + h }, C = { x: cx + s / 2, y: top + h };
    var fs = narrow ? 11 : 13;
    function edge(P, Q, ok, col, label) {
      if (ok) { D.line(ctx, P.x, P.y, Q.x, Q.y, D.alpha(col, 0.35), 12); D.line(ctx, P.x, P.y, Q.x, Q.y, col, 5); }
      else D.line(ctx, P.x, P.y, Q.x, Q.y, D.alpha(c.muted, 0.6), 3, [6, 5]);
      var mx = (P.x + Q.x) / 2, my = (P.y + Q.y) / 2, ang = Math.atan2(Q.y - P.y, Q.x - P.x);
      if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
      var ox = mx - (A.x + B.x + C.x) / 3, oy = my - (A.y + B.y + C.y) / 3, ol = Math.hypot(ox, oy) || 1;
      ctx.save(); ctx.translate(mx + ox / ol * 15, my + oy / ol * 15); ctx.rotate(ang);
      D.text(ctx, label + (ok ? ' ✓' : ' ✗'), 0, 0, { color: ok ? col : c.muted, size: fs, weight: 700, align: 'center' });
      ctx.restore();
    }
    var heatCol = c.light ? '#ea580c' : '#fb923c', oxCol = c.light ? '#0284c7' : '#38bdf8', fuelCol = c.light ? '#a16207' : '#facc15';
    edge(B, A, heatOk, heatCol, 'HEAT');
    edge(A, C, oxOk, oxCol, 'OXYGEN');
    edge(C, B, fuelOk, fuelCol, 'FUEL');
    var gy = top + h * 0.66;
    if (st.burning) flame(ctx, cx, gy + h * 0.14, s * 0.2, s * 0.32 * (0.5 + 0.5 * Math.min(1, st.s)), sim.time, f.gas ? 'gas' : 'fire', 1);
    else D.text(ctx, st.started ? 'no fire' : 'not lit', cx, gy, { color: c.muted, size: fs, weight: 600, align: 'center' });

    // three bars
    var bx = side ? box.x + triW + 6 : box.x + 14, bw = side ? box.w - triW - 16 : box.w - 28;
    var by = side ? box.y + 6 : top + h + 30, room = side ? box.h - 12 : box.y + box.h - by - 4;
    var rowH = Math.min(46, room / 3), bfs = narrow ? 10.5 : 12;
    var Tmax = 900, need = needT(f);
    var rows = [
      { lab: 'Heat ' + Math.round(st.T) + ' °C', sub: 'needs ' + need, v: st.T / Tmax, mark: need / Tmax, col: heatCol, ok: heatOk },
      { lab: 'Oxygen ' + st.O.toFixed(1) + ' %', sub: 'needs ' + O_MIN, v: st.O / O_AIR, mark: O_MIN / O_AIR, col: oxCol, ok: oxOk },
      { lab: (f.gas ? 'Gas ' : 'Fuel ') + Math.round(st.F * 100) + ' %', sub: f.gas ? (st.knob ? 'knob open' : 'knob closed') : (f.elec ? (st.mains ? 'mains ON' : 'mains off') : ''), v: f.gas && !st.knob ? 0 : st.F, mark: null, col: fuelCol, ok: fuelOk }
    ];
    rows.forEach(function (r, i) {
      var y = by + i * rowH;
      D.text(ctx, r.lab, bx, y + bfs / 2, { color: r.ok ? c.text : c.muted, size: bfs, weight: 700 });
      if (r.sub) D.text(ctx, r.sub, bx + bw, y + bfs / 2, { color: c.muted, size: bfs - 1, weight: 500, align: 'right' });
      var yb = y + bfs + 5;
      D.roundRect(ctx, bx, yb, bw, 8, 4, D.alpha(c.ink, 0.12));
      if (r.v > 0.002) D.roundRect(ctx, bx, yb, Math.max(8, bw * M.clamp(r.v, 0, 1)), 8, 4, r.ok ? r.col : D.alpha(c.muted, 0.7));
      if (r.mark != null) D.line(ctx, bx + bw * r.mark, yb - 3, bx + bw * r.mark, yb + 11, c.text, 2);
    });
  }

  function drawFireScene(sim, L) {
    var ctx = sim.ctx, c = sim.colors, f = fuel(sim), t = sim.time, key = sim.p.fuel;
    var fa = L.fa, ink = c.ink;
    var groundY = fa.y + fa.h * 0.9, cx = fa.x + fa.w * 0.5, u = Math.min(fa.w, fa.h * 1.25);
    ctx.fillStyle = D.alpha(ink, 0.06); ctx.fillRect(fa.x + 4, groundY, fa.w - 8, fa.y + fa.h - groundY);
    D.line(ctx, fa.x + 4, groundY, fa.x + fa.w - 4, groundY, D.alpha(ink, 0.35), 2);
    var trayW = u * 0.56, base, flameW = trayW * 0.62, kind = f.gas ? 'gas' : 'fire';
    var brick = '#b45309', metal = c.light ? '#64748b' : '#94a3b8';

    if (!f.gas && !f.elec) {
      // bricks + tray
      var bh = Math.max(8, u * 0.05), th = Math.max(6, u * 0.035), ty = groundY - bh - th;
      D.roundRect(ctx, cx - trayW * 0.42, groundY - bh, trayW * 0.22, bh, 2, brick);
      D.roundRect(ctx, cx + trayW * 0.2, groundY - bh, trayW * 0.22, bh, 2, brick);
      D.roundRect(ctx, cx - trayW / 2, ty, trayW, th, 3, metal);
      base = ty;
      if (key === 'paper') {
        var r = M.rng(7), nP = 7;
        for (var i = 0; i < nP; i++) {
          var px = cx + (i / (nP - 1) - 0.5) * trayW * 0.7, sz = u * 0.055 * (0.8 + r() * 0.5) * (0.25 + 0.75 * Math.sqrt(st.F));
          var burnt = st.F < 1 - (i % 3) * 0.12 - 0.15;
          ctx.fillStyle = burnt ? (c.light ? '#57534e' : '#44403c') : (c.light ? '#f5f5f4' : '#e7e5e4');
          ctx.beginPath(); ctx.moveTo(px - sz, base); ctx.lineTo(px - sz * 0.7, base - sz * 1.1); ctx.lineTo(px, base - sz * 1.5); ctx.lineTo(px + sz * 0.8, base - sz); ctx.lineTo(px + sz, base); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = D.alpha(ink, 0.35); ctx.lineWidth = 1; ctx.stroke();
        }
        if (st.F < 0.98) for (var a = 0; a < 10; a++) D.circle(ctx, cx + (a / 9 - 0.5) * trayW * 0.8, base - 2, 2 + (1 - st.F) * 3, D.alpha('#1c1917', 0.8));
        base -= u * 0.03;
      } else if (key === 'wood') {
        var lh = Math.max(5, u * 0.03) * (0.4 + 0.6 * Math.sqrt(st.F)), glowA = M.clamp((st.T - 250) / 400, 0, 1);
        for (var k = 0; k < 5; k++) {
          var yy = base - lh * (0.6 + (k % 2) * 1.1), ang = (k % 2 ? -1 : 1) * (0.12 + k * 0.04), len = trayW * (0.55 + 0.08 * (k % 3)) * (0.5 + 0.5 * st.F);
          ctx.save(); ctx.translate(cx + (k - 2) * trayW * 0.04, yy); ctx.rotate(ang);
          D.roundRect(ctx, -len / 2, -lh / 2, len, lh, lh / 2, '#78350f');
          if (glowA > 0) D.roundRect(ctx, -len / 2, -lh / 2, len, lh, lh / 2, D.alpha('#f97316', glowA * 0.55));
          ctx.restore();
        }
        base -= lh * 2;
      } else {
        // kerosene dish (water layer under the oil after water was poured)
        var dw = trayW * 0.7, dh = Math.max(10, u * 0.06), dy = base - dh;
        ctx.fillStyle = metal; ctx.beginPath(); ctx.moveTo(cx - dw / 2, dy); ctx.lineTo(cx - dw * 0.4, base); ctx.lineTo(cx + dw * 0.4, base); ctx.lineTo(cx + dw / 2, dy); ctx.closePath(); ctx.fill();
        var lvl = dh * 0.75 * Math.max(0.08, st.F);
        if (st.last === 'water' || st.spread > 0) { ctx.fillStyle = D.alpha('#38bdf8', 0.8); ctx.fillRect(cx - dw * 0.41, base - dh * 0.32, dw * 0.82, dh * 0.3); lvl = Math.min(lvl, dh * 0.45); }
        ctx.fillStyle = D.alpha('#fde047', 0.85); ctx.fillRect(cx - dw * 0.44, dy + (dh - lvl) - (st.last === 'water' ? dh * 0.3 : 0), dw * 0.88, Math.max(2, lvl * 0.5));
        base = dy + 2;
        flameW = dw * 0.85;
      }
    } else if (f.gas) {
      // gas stove + cylinder
      var sw = u * 0.62, sh = Math.max(16, u * 0.11), sy = groundY - sh - 6;
      D.roundRect(ctx, cx - sw / 2, sy, sw, sh, 6, c.light ? '#334155' : '#1e293b', D.alpha(ink, 0.4), 1.5);
      D.roundRect(ctx, cx - sw / 2 + 8, groundY - 6, 8, 6, 2, '#111827'); D.roundRect(ctx, cx + sw / 2 - 16, groundY - 6, 8, 6, 2, '#111827');
      var kx = cx - sw / 2 + sh * 0.7, ky = sy + sh / 2, kr = sh * 0.3;
      D.circle(ctx, kx, ky, kr, '#e5e7eb', '#111827', 1.5);
      var ka = st.knob ? -Math.PI / 2 : 0; D.line(ctx, kx, ky, kx + Math.cos(ka) * kr, ky + Math.sin(ka) * kr, '#dc2626', 2.5);
      D.text(ctx, st.knob ? 'ON' : 'OFF', kx + kr + 4, ky, { color: st.knob ? '#fca5a5' : '#e5e7eb', size: 10, weight: 700 });
      var rw = sw * 0.4; D.roundRect(ctx, cx - rw / 2, sy - 7, rw, 7, 3, '#0f172a');
      base = sy - 7; flameW = rw;
      // cylinder at the side
      var cyW = Math.min(u * 0.16, fa.w * 0.14), cyH = cyW * 1.9, cyx = fa.x + fa.w - cyW - 10;
      if (cyx > cx + sw / 2 + 8) {
        D.roundRect(ctx, cyx, groundY - cyH, cyW, cyH, cyW * 0.35, '#dc2626');
        D.roundRect(ctx, cyx + cyW * 0.3, groundY - cyH - 6, cyW * 0.4, 8, 2, '#9ca3af');
        D.text(ctx, 'LPG', cyx + cyW / 2, groundY - cyH * 0.55, { color: '#fff', size: Math.min(12, cyW * 0.32), weight: 700, align: 'center' });
        ctx.strokeStyle = '#f97316'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(cyx + cyW / 2, groundY - cyH - 4); ctx.quadraticCurveTo(cyx - 10, groundY - cyH - 20, cx + sw / 2, sy + sh * 0.5); ctx.stroke();
      }
      if (st.leak > 0) puffs(ctx, cx, base, rw * 1.3, fa.h * 0.4, t * 0.8, Math.min(1, st.leak / 2) * 0.8, c.light ? '#65a30d' : '#bef264', 12, 0.3);
    } else {
      // electric: wall socket line, extension board, plug, mains switch
      var ew = u * 0.5, eh = Math.max(12, u * 0.07), ey = groundY - eh;
      D.roundRect(ctx, cx - ew / 2, ey, ew, eh, 4, c.light ? '#e5e7eb' : '#f1f5f9', D.alpha(ink, 0.5), 1.5);
      for (var so = 0; so < 3; so++) { var sx2 = cx - ew / 2 + ew * (0.2 + so * 0.3); D.circle(ctx, sx2 - 3, ey + eh / 2, 1.6, '#334155'); D.circle(ctx, sx2 + 3, ey + eh / 2, 1.6, '#334155'); }
      ctx.strokeStyle = '#111827'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - ew / 2, ey + eh / 2); ctx.bezierCurveTo(cx - ew, ey + eh, fa.x + 20, groundY - 4, fa.x + 6, groundY - 4); ctx.stroke();
      // a heap of plastic covers / cloth on the board
      var melt = 0.4 + 0.6 * st.F, plx = cx + ew * 0.2;
      ctx.fillStyle = c.light ? '#1d4ed8' : '#3b82f6';
      ctx.beginPath(); ctx.ellipse(plx, ey - eh * 0.3 * melt, ew * 0.28 * melt, eh * 0.8 * melt, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = st.F < 0.9 ? D.alpha('#111827', (1 - st.F) * 0.9) : 'transparent';
      ctx.beginPath(); ctx.ellipse(plx, ey - eh * 0.3 * melt, ew * 0.28 * melt, eh * 0.8 * melt, 0, Math.PI, 0); ctx.fill();
      // plug with sparks
      var pgx = cx - ew * 0.1, pgy = ey;
      D.roundRect(ctx, pgx - 8, pgy - 14, 16, 14, 3, '#111827');
      ctx.strokeStyle = '#111827'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(pgx, pgy - 14); ctx.quadraticCurveTo(pgx - 10, pgy - 40, pgx - ew * 0.45, pgy - 30); ctx.stroke();
      if (st.mains && st.started && st.F > 0) {
        var sr = M.rng(1 + Math.floor(st.sparkT * 12));
        for (var sp = 0; sp < 6; sp++) { var an = sr() * Math.PI * 2, ln = 6 + sr() * 12; D.line(ctx, pgx, pgy - 4, pgx + Math.cos(an) * ln, pgy - 4 + Math.sin(an) * ln * 0.7, sr() > 0.5 ? '#fde047' : '#ffffff', 1.6); }
      }
      base = ey - eh * 0.5; flameW = ew * 0.55;
      cx = (pgx + plx) / 2;
      // mains switch box
      var mw = Math.min(70, fa.w * 0.22), mh = mw * 0.75, mx2 = fa.x + fa.w - mw - 8, my2 = fa.y + 8;
      D.roundRect(ctx, mx2, my2, mw, mh, 6, c.light ? '#f8fafc' : '#1e293b', D.alpha(ink, 0.5), 1.5);
      D.text(ctx, 'MAINS', mx2 + mw / 2, my2 + 10, { color: c.muted, size: 9.5, weight: 700, align: 'center' });
      D.roundRect(ctx, mx2 + mw / 2 - 7, my2 + 18, 14, mh - 24, 4, st.mains ? '#dc2626' : '#6b7280');
      D.text(ctx, st.mains ? 'ON' : 'OFF', mx2 + mw / 2, my2 + mh + 9, { color: st.mains ? c.danger : c.muted, size: 10, weight: 700, align: 'center' });
    }

    // flames
    var avail = base - fa.y - 12, fh = avail * 0.8 * (0.28 + 0.72 * Math.min(1.4, st.s) / 1.4 * 1.3), fw = flameW * (0.55 + 0.45 * Math.min(1, st.s));
    if (st.s > 0.02 || st.burning) {
      if (f.gas) {
        var nG = 7;
        for (var g = 0; g < nG; g++) flame(ctx, cx - flameW / 2 + flameW * (g + 0.5) / nG, base, flameW / nG * 0.9, Math.min(avail, u * 0.16) * Math.min(1, st.s + 0.05), t, 'gas', g);
      } else flame(ctx, cx, base, fw, Math.min(avail, fh * Math.min(1, st.s + 0.15)), t, 'fire', 0);
    }
    if (st.spread > 0 || (f.oil && st.last === 'water' && st.burning)) {
      var pr = M.rng(11), amt = Math.min(1, st.spread / 2 + (st.burning ? 0.4 : 0));
      for (var q = 0; q < 6; q++) {
        var side = q % 2 ? 1 : -1, qx = cx + side * (trayW * 0.55 + pr() * fa.w * 0.18);
        if (qx < fa.x + 10 || qx > fa.x + fa.w - 10) continue;
        D.circle(ctx, qx, groundY - 2, 6 + pr() * 6, D.alpha('#fde047', 0.5));
        flame(ctx, qx, groundY - 1, 14 + pr() * 10, (18 + pr() * 22) * amt * (st.burning ? 1 : 0.3), t, 'fire', q * 3);
      }
    }
    if (st.pilot > 0 && !f.elec) {   // a lit match (or a gas lighter) held at the fuel
      var mx = cx - flameW * 0.55, my = base - 4, mlen = Math.min(46, u * 0.18);
      D.line(ctx, mx - mlen * 0.8, my - mlen * 0.6, mx, my, '#d6a35c', 3);
      D.circle(ctx, mx, my, 3.5, '#b91c1c');
      flame(ctx, mx + 1, my + 2, 8, 18, t, 'fire', 5);
    }
    // smoke + steam
    var sTop = base - Math.min(avail, fh) * 0.8;
    if (f.smokeCol && !(st.cover && st.coverAnim >= 1)) puffs(ctx, cx, sTop, flameW, Math.max(30, sTop - fa.y), t, st.smoke, c.light && f.smokeCol === '#9ca3af' ? '#6b7280' : f.smokeCol, 14, 0);
    puffs(ctx, cx, base - 6, flameW * 1.2, fa.h * 0.5, t * 1.4, st.steam, c.light ? '#94a3b8' : '#e2e8f0', 10, 0.5);

    // water from a bucket
    if (st.pour > 0) {
      var bxw = Math.min(44, fa.w * 0.12), bkx = Math.max(fa.x + 8, cx - trayW * 0.75), bky = fa.y + 10;
      ctx.save(); ctx.translate(bkx + bxw / 2, bky + bxw * 0.45); ctx.rotate(-2.0);   // a bucket tipped towards the fire
      ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.moveTo(-bxw / 2, -bxw * 0.45); ctx.lineTo(bxw / 2, -bxw * 0.45); ctx.lineTo(bxw * 0.36, bxw * 0.45); ctx.lineTo(-bxw * 0.36, bxw * 0.45); ctx.closePath(); ctx.fill();
      D.roundRect(ctx, -bxw / 2 - 2, -bxw * 0.45 - 3, bxw + 4, 5, 2, '#475569');
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -bxw * 0.45, bxw * 0.5, Math.PI, 0); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = D.alpha('#38bdf8', 0.75); ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bkx + bxw * 0.95, bky + bxw * 0.75); ctx.quadraticCurveTo(cx - trayW * 0.1, bky + 10, cx, base - 2); ctx.stroke();
      ctx.lineCap = 'butt';
    }
    // CO₂ extinguisher
    if (st.co2Blanket > 0) {
      var ew2 = Math.min(26, fa.w * 0.08), eh2 = ew2 * 2.6, ex = fa.x + fa.w - ew2 - 14, ey2 = groundY - eh2;
      if (f.elec) ey2 = groundY - eh2 - 0;
      D.roundRect(ctx, ex, ey2, ew2, eh2, ew2 * 0.4, '#dc2626');
      D.roundRect(ctx, ex + ew2 * 0.2, ey2 + eh2 * 0.35, ew2 * 0.6, eh2 * 0.25, 2, '#f8fafc');
      D.text(ctx, 'CO₂', ex + ew2 / 2, ey2 + eh2 * 0.475, { color: '#111827', size: Math.max(7, ew2 * 0.3), weight: 700, align: 'center' });
      var hx = ex - 4, hy = ey2 + 6;
      D.line(ctx, ex + ew2 / 2, ey2, hx, hy, '#111827', 4);
      if (st.co2Dis > 0) {
        var cr = M.rng(3 + Math.floor(t * 20));
        for (var cc = 0; cc < 22; cc++) { var fr = cr(); D.circle(ctx, M.lerp(hx, cx, fr) + (cr() - 0.5) * 20 * fr, M.lerp(hy, base - 10, fr) + (cr() - 0.5) * 24 * fr, 3 + fr * 8, D.alpha('#f8fafc', 0.55)); }
      }
      var bl = Math.min(1, st.co2Blanket / 4);
      var gr = ctx.createLinearGradient(0, groundY, 0, groundY - fa.h * 0.45);
      gr.addColorStop(0, D.alpha(c.light ? '#94a3b8' : '#e2e8f0', 0.45 * bl)); gr.addColorStop(1, D.alpha('#e2e8f0', 0));
      ctx.fillStyle = gr; ctx.fillRect(fa.x + 4, groundY - fa.h * 0.45, fa.w - 8, fa.h * 0.45);
      if (fa.w > 200) D.text(ctx, 'CO₂ blanket', fa.x + 12, groundY - 12, { color: c.muted, size: 10.5, weight: 700 });
    }
    // cover: lid or sand
    if (st.cover) {
      var p = st.coverAnim, cw = Math.max(trayW, flameW) * 1.05;
      var coverBase = f.gas ? base + 7 : (f.elec ? groundY : base + 6);
      if (st.cover === 'lid') {
        var lh2 = Math.min(fa.h * 0.4, cw * 0.55), ly = M.lerp(fa.y - lh2, coverBase - lh2, p);
        ctx.fillStyle = c.light ? '#64748b' : '#94a3b8';
        ctx.beginPath(); ctx.ellipse(cx, ly + lh2, cw / 2, lh2, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = D.alpha(ink, 0.5); ctx.lineWidth = 1.5; ctx.stroke();
        D.roundRect(ctx, cx - 10, ly - 7, 20, 8, 3, '#334155');
        if (st.burning && p >= 1) D.text(ctx, cw > 150 ? 'still burning inside…' : 'burning…', cx, ly + lh2 * 0.55, { color: '#1f2937', size: 10.5, weight: 700, align: 'center' });
      } else {
        var sh2 = Math.min(fa.h * 0.28, cw * 0.32) * p;
        ctx.fillStyle = '#d6b37a';
        ctx.beginPath(); ctx.ellipse(cx, coverBase, cw / 2, Math.max(1, sh2), 0, Math.PI, 0); ctx.closePath(); ctx.fill();
        var sr2 = M.rng(9);
        for (var gq = 0; gq < 40; gq++) { var ga = sr2() * Math.PI, gr2 = Math.sqrt(sr2()); D.circle(ctx, cx + Math.cos(ga) * cw / 2 * gr2, coverBase - Math.sin(ga) * sh2 * gr2, 1.2, '#a16207'); }
        if (p < 1) for (var fl = 0; fl < 14; fl++) { var fx = cx + (fl / 13 - 0.5) * cw * 0.8; D.circle(ctx, fx, M.lerp(fa.y, coverBase - sh2, (p * 3 + fl * 0.13) % 1), 2, '#d6b37a'); }
      }
    }
    drawTriangle(sim, L.tp, f);
  }

  /* ------------------------------ scene 2: ignition test ------------------------------ */
  function drawItem(sim, I, it, cx, base, w, hmax) {
    var ctx = sim.ctx, c = sim.colors, ink = c.ink, top = base;
    var u = Math.min(w, hmax * 1.6);
    if (I.id === 'paper') {
      var pw = u * 0.55 * (0.3 + 0.7 * it.F), ph = 5;
      ctx.fillStyle = it.F < 0.95 ? '#44403c' : (c.light ? '#fafaf9' : '#e7e5e4');
      ctx.beginPath(); ctx.moveTo(cx - pw / 2, base); ctx.lineTo(cx - pw / 2 + 6, base - ph); ctx.lineTo(cx + pw / 2, base - ph); ctx.lineTo(cx + pw / 2 - 6, base); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = D.alpha(ink, 0.4); ctx.lineWidth = 1; ctx.stroke(); top = base - ph;
    } else if (I.id === 'cup') {
      var cwid = Math.min(u * 0.42, 40), ch = Math.min(hmax * 0.75, cwid * 1.1);
      ctx.fillStyle = it.F < 0.95 ? '#44403c' : (c.light ? '#fafaf9' : '#f5f5f4');
      ctx.beginPath(); ctx.moveTo(cx - cwid / 2, base - ch); ctx.lineTo(cx + cwid / 2, base - ch); ctx.lineTo(cx + cwid * 0.36, base); ctx.lineTo(cx - cwid * 0.36, base); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = D.alpha(ink, 0.5); ctx.lineWidth = 1.2; ctx.stroke();
      if (it.water > 0) {
        var wl = base - ch * 0.85 * it.water;
        var k = (base - wl) / ch;
        ctx.fillStyle = D.alpha('#38bdf8', 0.75);
        ctx.beginPath(); ctx.moveTo(cx - cwid * (0.36 + 0.14 * k) + 2, wl); ctx.lineTo(cx + cwid * (0.36 + 0.14 * k) - 2, wl); ctx.lineTo(cx + cwid * 0.36 - 2, base - 2); ctx.lineTo(cx - cwid * 0.36 + 2, base - 2); ctx.closePath(); ctx.fill();
        if (it.T >= 99.5) { var br = M.rng(2 + Math.floor(sim.time * 8)); for (var b = 0; b < 5; b++) D.circle(ctx, cx + (br() - 0.5) * cwid * 0.6, wl + br() * (base - wl - 3), 1.6 + br() * 1.5, null, '#e0f2fe', 1); }
        if (it.T >= 99.5) puffs(ctx, cx, base - ch, cwid, 30, sim.time, 0.6, c.light ? '#94a3b8' : '#e2e8f0', 6, 0.2);
      }
      top = base - ch;
    } else if (I.id === 'wood') {
      var lw = u * 0.5 * (0.4 + 0.6 * it.F), lh = 7;
      D.roundRect(ctx, cx - lw / 2, base - lh, lw, lh, 3.5, '#78350f');
      D.roundRect(ctx, cx - lw / 2 + 4, base - 2 * lh, lw - 8, lh, 3.5, '#92400e');
      if (it.T > 200) D.roundRect(ctx, cx - lw / 2, base - 2 * lh, lw, 2 * lh, 3.5, D.alpha('#f97316', M.clamp((it.T - 200) / 400, 0, 0.8)));
      top = base - 2 * lh;
    } else if (I.id === 'plastic') {
      var ww = u * 0.55 * (0.4 + 0.6 * it.F);
      D.line(ctx, cx - ww / 2 - 5, base - 5, cx - ww / 2, base - 5, '#d97706', 3); D.line(ctx, cx + ww / 2, base - 5, cx + ww / 2 + 5, base - 5, '#d97706', 3);
      D.roundRect(ctx, cx - ww / 2, base - 9, ww, 8, 4, it.F < 0.95 ? '#1f2937' : (c.light ? '#1d4ed8' : '#3b82f6'));
      top = base - 9;
    } else if (I.id === 'kerosene') {
      var dw = Math.min(u * 0.5, 50), dh = 9;
      ctx.fillStyle = c.light ? '#64748b' : '#94a3b8';
      ctx.beginPath(); ctx.moveTo(cx - dw / 2, base - dh); ctx.lineTo(cx - dw * 0.4, base); ctx.lineTo(cx + dw * 0.4, base); ctx.lineTo(cx + dw / 2, base - dh); ctx.closePath(); ctx.fill();
      if (it.F > 0.02) { ctx.fillStyle = D.alpha('#fde047', 0.85); ctx.fillRect(cx - dw * 0.44, base - dh + 2 + (1 - it.F) * 4, dw * 0.88, 3); }
      top = base - dh;
    } else {
      // LPG jet: a thin pipe from the side, nozzle pointing up just above the plate
      var nx = cx, ny = base - 6;
      D.line(ctx, cx - w * 0.42, ny, nx, ny, '#9ca3af', 3); D.line(ctx, nx, ny, nx, ny - 8, '#9ca3af', 3);
      if (!it.burning) puffs(ctx, nx, ny - 9, 16, 26, sim.time, 0.6, c.light ? '#65a30d' : '#bef264', 6, 0.1);
      top = ny - 9;
    }
    return top;
  }

  function drawTestScene(sim, L) {
    var ctx = sim.ctx, c = sim.colors, W = L.W, narrow = L.narrow, t = sim.time;
    var cols = W >= 600 ? 6 : 3, rows = cols === 6 ? 1 : 2;
    var y0 = L.top + 20, cellH = (L.H - y0) / rows, cellW = (W - 12) / cols;
    var hdrT = 'Hot plate: ' + Math.round(st.plate) + ' °C' + (Math.round(st.plate) !== sim.p.plate ? '  →  set ' + sim.p.plate + ' °C' : '') + (sim.p.spark ? '  ·  lit match held near' : '');
    D.text(ctx, hdrT, 10, L.top + 8, { color: c.text, size: narrow ? 11.5 : 13, weight: 700, fit: W });
    var sel = SEL[sim.p.fuel] != null ? SEL[sim.p.fuel] : 0;
    var fs = narrow ? 10.5 : 12;
    for (var r = 0; r < rows; r++) {
      var plateY = y0 + (r + 1) * cellH - (2 * fs + 24);
      var pc = hotCol(st.plate);
      if (st.plate > 150) { var gl = ctx.createLinearGradient(0, plateY, 0, plateY - 30); gl.addColorStop(0, D.alpha('#f97316', M.clamp((st.plate - 150) / 700, 0, 0.45))); gl.addColorStop(1, D.alpha('#f97316', 0)); ctx.fillStyle = gl; ctx.fillRect(8, plateY - 30, W - 16, 30); }
      D.roundRect(ctx, 8, plateY, W - 16, 8, 3, pc);
      D.roundRect(ctx, 8, plateY + 8, W - 16, 4, 2, D.alpha(c.ink, 0.35));
      for (var k = 0; k < cols; k++) {
        var i = r * cols + k, I = ITEMS[i], it = st.items[i];
        var x = 6 + k * cellW, cx = x + cellW / 2, cy = y0 + r * cellH;
        if (i === sel) D.roundRect(ctx, x + 2, cy + 1, cellW - 4, cellH - 3, 9, D.alpha(c.accent, 0.08), D.alpha(c.accent, 0.55), 1.5);
        var top = drawItem(sim, I, it, cx, plateY, cellW, Math.max(14, plateY - cy - 50));
        if (it.burning) flame(ctx, cx, top + 2, Math.min(cellW * 0.5, 60), Math.min(plateY - cy - 30, cellH * 0.55, 130), t, I.id === 'lpg' ? 'gas' : 'fire', i * 2);
        if (sim.p.spark && !it.burning) {   // a lit match held a little above
          var mx = cx + cellW * 0.16, my = top - 14;
          if (my > cy + 34) { D.line(ctx, mx, my, mx + 14, my - 14, '#d6a35c', 2.5); D.circle(ctx, mx, my, 2.6, '#b91c1c'); flame(ctx, mx, my + 1, 6, 12, t, 'fire', i); }
        }
        // temperature chip
        var hot = it.burning ? '#dc2626' : (it.T >= 100 ? '#b45309' : null);
        D.text(ctx, Math.round(it.T) + ' °C', cx, cy + 13, { color: hot ? '#fff' : c.text, bg: hot || D.alpha(c.ink, 0.12), size: fs, weight: 700, align: 'center', pad: 3 });
        // labels
        var l2;
        if (I.cup) l2 = 'paper + water';
        else if (I.id === 'kerosene') l2 = sim.p.spark ? 'catches ≈ 50 °C' : 'ignites ≈ 220 °C';
        else if (I.id === 'lpg') l2 = sim.p.spark ? 'catches at once' : 'ignites ≈ 450 °C';
        else l2 = 'ignites ≈ ' + I.Tauto + ' °C';
        var nm = I.name + (it.burning ? ' 🔥' : (it.F <= 0 ? ' (ash)' : ''));
        D.text(ctx, nm, cx, plateY + 14 + fs / 2 + 2, { color: c.text, size: fs, weight: 700, align: 'center' });
        D.text(ctx, l2, cx, plateY + 14 + fs * 1.5 + 6, { color: c.muted, size: fs - 0.5, weight: 500, align: 'center' });
      }
    }
  }

  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, top = narrow ? 58 : 56;
    var L = { W: W, H: H, narrow: narrow, top: top + 8 };
    var areaH = H - L.top;
    if (H > W * 1.15) { L.fa = { x: 0, y: L.top, w: W, h: areaH * 0.6 }; L.tp = { x: 0, y: L.top + areaH * 0.6, w: W, h: areaH * 0.4 }; }
    else { var fw = W * (narrow ? 0.56 : 0.6); L.fa = { x: 0, y: L.top, w: fw, h: areaH }; L.tp = { x: fw, y: L.top, w: W - fw, h: areaH }; }
    return L;
  }

  function relevantIgn(sim) {
    if (sim.p.scene === 'fire') return needT(fuel(sim));
    var I = ITEMS[SEL[sim.p.fuel]];
    return sim.p.spark && I.Tflash != null ? Math.max(AMB, I.Tflash) : I.Tauto;
  }

  var cfg = {
    ariaLabel: 'A fire on a fire-proof tray beside a fire triangle whose sides, fuel, oxygen and heat, light up when present. Buttons cover the fire, throw sand, pour water, spray carbon dioxide or shut off the gas or mains. A second scene heats paper, a paper cup of water, wood, plastic, kerosene and LPG on a hot plate to show ignition temperatures',
    mobileAspect: '1 / 1',
    playLabel: 'Light it',
    buttonsTitle: 'Put the fire out',
    params: [
      { id: 'scene', label: 'Scene', type: 'select', value: 'fire', options: [
        { value: 'fire', label: 'Put out a fire' },
        { value: 'test', label: 'Ignition temperature test (hot plate)' }] },
      { id: 'fuel', label: 'Fuel', type: 'select', value: 'paper', options: [
        { value: 'paper', label: 'Paper' },
        { value: 'wood', label: 'Wood (dry twigs)' },
        { value: 'kerosene', label: 'Kerosene in a dish (oil fire)' },
        { value: 'lpg', label: 'LPG gas stove' },
        { value: 'electric', label: 'Electrical fire (sparking plug)' }] },
      { id: 'plate', label: 'Hot plate temperature (test scene)', min: 50, max: 500, step: 10, value: 300, unit: '°C', presets: [100, 250, 350, 500],
        help: 'Used in the ignition temperature test. Press Light it to switch the hot plate on.' },
      { id: 'spark', label: 'Hold a lit match near the items (test scene)', type: 'toggle', value: false }
    ],
    buttons: [
      { label: 'Cover with a lid / blanket', onClick: function (sim) { act(sim, 'lid'); } },
      { label: 'Throw sand', onClick: function (sim) { act(sim, 'sand'); } },
      { label: 'Pour water', onClick: function (sim) { act(sim, 'water'); } },
      { label: 'CO₂ extinguisher', onClick: function (sim) { act(sim, 'co2'); } },
      { label: 'Close gas knob / switch off mains', full: true, onClick: function (sim) { act(sim, 'shut'); } }
    ],
    readouts: [
      { id: 'temp', label: 'Temperature of the fuel', short: 'Fuel temp', unit: '°C', digits: 0, key: true },
      { id: 'ign', label: 'Ignition temperature (approx.)', unit: '°C', digits: 0 },
      { id: 'o2', label: 'Oxygen near the fuel', short: 'Oxygen', unit: '%', digits: 1, key: true },
      { id: 'fuel', label: 'Fuel left', unit: '%', digits: 0, key: true },
      { id: 'fire', label: 'Fire', digits: 0 },
      { id: 'plate', label: 'Hot plate', unit: '°C', digits: 0 }
    ],
    graph: { title: 'Temperature, ignition temperature and oxygen', yLabel: '°C  (oxygen: % × 10)', window: 40, yMin: 0,
      series: [{ label: 'Fuel temperature', color: '--sim-3' }, { label: 'Ignition temperature', color: '--sim-2' }, { label: 'Oxygen (% × 10)', color: '--sim-1' }, { label: 'Hot plate', color: '--sim-4' }] },
    reset: function (sim) { if (sim.p.scene === 'fire') resetFire(); else resetTest(); },
    onParam: function (sim, id) {
      if (id === 'plate' || id === 'spark') return true;
      if (id === 'fuel' && sim.p.scene === 'test') return true;
      return false;
    },
    update: function (sim, dt) { if (sim.p.scene === 'fire') stepFire(sim, dt); else stepTest(sim, dt); },
    finished: function (sim) {
      if (sim.p.scene !== 'fire' || !st.started || st.burning) return false;
      var f = fuel(sim);
      if (st.leak > 0 || (f.elec && st.mains && st.F > 0) || st.co2Blanket > 0) return false;
      return st.outFor > 6 && (st.cover || st.T < f.Tauto - 20 || st.F <= 0);
    },
    sample: function (sim) {
      if (sim.p.scene === 'fire') return [st.T, relevantIgn(sim), st.O * 10, NaN];
      var it = st.items[SEL[sim.p.fuel]];
      return [it.T, relevantIgn(sim), NaN, st.plate];
    },
    readout: function (sim) {
      if (sim.p.scene === 'fire') {
        return { temp: st.T, ign: relevantIgn(sim), o2: st.O, fuel: st.F * 100,
          fire: st.burning ? 'Burning' : (st.started ? (st.leak > 0 ? 'Out, gas leaking!' : 'Out') : 'Not lit'), plate: '—' };
      }
      var it = st.items[SEL[sim.p.fuel]];
      return { temp: it.T, ign: relevantIgn(sim), o2: O_AIR, fuel: it.F * 100,
        fire: it.burning ? 'Burning' : (it.F <= 0 ? 'Burnt out' : 'Not burning'), plate: st.plate };
    },
    status: function (sim) {
      if (sim.p.scene === 'test') return st.started ? 'Hot plate at ' + Math.round(st.plate) + ' °C' : 'Hot plate off';
      if (!st.started) return 'Not lit yet';
      if (st.burning) return 'Burning · ' + Math.round(st.T) + ' °C · O₂ ' + st.O.toFixed(1) + ' %';
      return st.leak > 0 ? 'Out, but gas is leaking' : 'Fire out';
    },
    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, L = layout(sim);
      D.clear(ctx, L.W, L.H, c.bg);
      var m = st.msg;
      if (sim.p.scene === 'fire') {
        drawFireScene(sim, L);
        if (!m) m = { t: st.started ? 'Burning: fuel, oxygen and heat are all here.' : fuel(sim).intro, k: 'info' };
        if (st.leak > 0) m = { t: 'Flame out, but the gas is still on! LPG is leaking into the room. Close the knob at once, open doors and windows, and do not light a match or touch switches.', k: 'danger' };
      } else {
        drawTestScene(sim, L);
        if (!m) m = { t: st.started ? 'The hot plate is heating up. Watch which items catch fire, and at what temperature.'
          : 'Six things on a hot plate, with no flame touching them. Set the temperature and press Light it to switch the plate on.', k: 'info' };
      }
      banner(sim, m.t, m.k, L.top - 12);
    }
  };
  SimLab.createSim(cfg);
})();
