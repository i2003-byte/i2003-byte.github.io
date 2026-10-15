/* =====================================================================
   Weather and climate · Why Deserts Are Hot by Day and Cold at Night — sim.js
   ---------------------------------------------------------------------
   Two places run through the same 24 hours side by side: a desert and a
   place to compare it with. Play runs 1 hour of the day per second
   (24 s for the whole day at 1×), starting at midnight (sun time:
   12:00 is when the sun is highest).

   Each place has two boxes of heat:
     ground surface (sand / soil), temperature Ts, heat capacity Cs
     air near the ground,          temperature Ta, heat capacity Ca
   Energy budget of the ground (W per m²):
     Cs · dTs/dt = sunlight absorbed + heat back from the sky
                   − heat radiated by the ground − heat given to the air
                   − heat used to evaporate water − heat into deeper soil
     sunlight     S = 1361 · sin(sun height) · τ^(1/sin(sun height))
                  τ = 0.80 − 0.01 · vapour (g/m³)   (vapour and dust absorb some)
     absorbed     S · (1 − albedo) · (1 − 0.7 · cloud)
     ground IR    0.95 · σ · Ts⁴                    (σ = 5.67×10⁻⁸)
     sky IR       ε · σ · Ta⁴,  ε = 1.24 (e/Ta)^(1/7) for clear air
                  (e = vapour pressure, hPa), raised towards 1 by clouds
     to the air   h · (Ts − Ta), h large in the day (rising warm air),
                  small at night (still, cold air near the ground)
     evaporation  β · net radiation  (β = 0 for dry sand)
   Air:  Ca · dTa/dt = h (Ts − Ta) − Ca (Ta − Tbg) / τmix
         (mixing with the air above, and with sea air at the coast)
   Tuned so Jaisalmer in May gives about 41 / 27 °C and Mumbai 35 / 28 °C.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SIG = 5.67e-8, DT = 15; // model step: 15 s of the day

  /* ---------- places ---------- */
  var DESERTS = {
    thar: { name: 'Thar desert (Jaisalmer, May)', short: 'Thar (Jaisalmer)', ground: 'sand', lat: 27, decl: 19, albedo: 0.30, Cs: 6e4, kG: 4, beta: 0, Tdeep: 33, Tbg: 31.5, tauMix: 4, Cday: 2.8e5, Cnight: 0.5e5, hum: 9 },
    sahara: { name: 'Sahara (Algeria, early summer)', short: 'Sahara', ground: 'sand', lat: 27, decl: 21, albedo: 0.30, Cs: 5e4, kG: 3, beta: 0, Tdeep: 31, Tbg: 28.5, tauMix: 8, Cday: 2.4e5, Cnight: 0.35e5, hum: 3 }
  };
  var OTHERS = {
    mumbai: { name: 'Mumbai coast (May)', short: 'Mumbai', ground: 'coast', lat: 19, decl: 19, albedo: 0.18, Cs: 1.2e5, kG: 10, beta: 0.3, Tdeep: 30, Tbg: 29, tauMix: 5, Cday: 2.8e5, Cnight: 0.6e5, hum: 22, cloud: 0.1 },
    cloudy: { name: 'Thar under cloud, humid air', short: 'Cloudy Thar', ground: 'sand', lat: 27, decl: 19, albedo: 0.30, Cs: 6e4, kG: 4, beta: 0, Tdeep: 33, Tbg: 31.5, tauMix: 4, Cday: 2.8e5, Cnight: 0.5e5, hum: 16, cloud: 0.7 },
    fields: { name: 'Wet green fields, same sun', short: 'Wet fields', ground: 'fields', lat: 27, decl: 19, albedo: 0.20, Cs: 1.4e5, kG: 10, beta: 0.5, Tdeep: 30, Tbg: 30, tauMix: 4, Cday: 2.8e5, Cnight: 0.5e5, hum: 14, cloud: 0 }
  };

  function sunSin(sc, hr) {
    var r = Math.PI / 180, h = (hr - 12) * 15 * r;
    return Math.sin(sc.lat * r) * Math.sin(sc.decl * r) + Math.cos(sc.lat * r) * Math.cos(sc.decl * r) * Math.cos(h);
  }
  function sunTimes(sc) {
    var r = Math.PI / 180, c = -Math.tan(sc.lat * r) * Math.tan(sc.decl * r), h0 = Math.acos(M.clamp(c, -1, 1)) / r / 15;
    return { rise: 12 - h0, set: 12 + h0 };
  }
  function flux(sc, s, hr) {
    var sn = sunSin(sc, hr), tau = 0.80 - 0.01 * s.hum;
    var S = sn > 0.01 ? 1361 * sn * Math.pow(tau, 1 / Math.max(sn, 0.05)) : 0;
    var Sw = S * (1 - sc.albedo) * (1 - 0.7 * s.cloud);
    var TaK = s.Ta + 273.15, TsK = s.Ts + 273.15;
    var e = s.hum * TaK * 0.004615;                       // vapour pressure, hPa
    var ec = Math.min(1, 1.24 * Math.pow(e / TaK, 1 / 7)), eps = ec + (1 - ec) * 0.9 * s.cloud;
    var Ld = eps * SIG * Math.pow(TaK, 4), Lu = 0.95 * SIG * Math.pow(TsK, 4) + 0.05 * Ld;
    var Rn = Sw + Ld - Lu;
    var h = s.Ts > s.Ta ? 8 + 0.4 * (s.Ts - s.Ta) : 4;
    var H = h * (s.Ts - s.Ta), LE = sc.beta * Math.max(0, Rn) * 0.9, G = sc.kG * (s.Ts - sc.Tdeep);
    return { sn: sn, S: S, Sw: Sw, Ld: Ld, Lu: Lu, H: H, LE: LE, G: G, eps: eps };
  }
  function step(sc, s, hr) {
    var f = flux(sc, s, hr);
    s.Ts += (f.Sw + f.Ld - f.Lu - f.H - f.LE - f.G) / sc.Cs * DT;
    var Ca = f.H > 0 ? sc.Cday : sc.Cnight;
    s.Ta += (f.H / Ca - (s.Ta - sc.Tbg) / (sc.tauMix * 3600)) * DT;
    s.f = f;
  }
  function makePlace(sc, hum, cloud) {
    var s = { sc: sc, Ts: sc.Tbg, Ta: sc.Tbg, hum: hum, cloud: cloud, sun: sunTimes(sc) };
    for (var d = 0; d < 5; d++) for (var t = 0; t < 86400; t += DT) step(sc, s, t / 3600); // settle into a repeating day
    s.f = flux(sc, s, 0);
    s.max = s.min = s.Ta; s.tMax = s.tMin = 0;
    return s;
  }

  var st = { hr: 0, a: null, b: null, lastG: 0 };

  function clock(hr) {
    var m = Math.round(hr * 60) % 1440;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }
  function stage() {
    var h = st.hr, sun = st.a ? st.a.sun : { rise: 5.6, set: 18.4 };
    if (h >= 24) return 'Midnight again: the day is done. Compare the two lines on the graph.';
    if (h < sun.rise - 0.6) return 'Night: the ground gives off heat to the sky and cools';
    if (h < sun.rise + 1.2) return 'Around sunrise: the coldest time of the day';
    if (h < 11) return 'Morning: sunshine heats the ground fast';
    if (h < 13) return 'Noon: the sun is highest, but the air keeps warming';
    if (h < 16) return 'Afternoon: the hottest time of the day';
    if (h < sun.set + 0.3) return 'Evening: the sun is low, the ground starts to cool';
    return 'Night: heat escapes; humid air and clouds send some back';
  }

  SimLab.createSim({
    ariaLabel: 'Two scenes run through the same 24 hours: a desert and a place to compare it with. The sun crosses each sky, yellow arrows show sunlight reaching the ground, and at night orange arrows show heat leaving the ground, some escaping to space and some sent back by water vapour and clouds. Thermometers show the air temperature in each place and a graph plots both through the day',
    playLabel: 'Run the day',
    mobileAspect: '1 / 1',
    params: [
      { id: 'place', label: 'Desert', type: 'select', value: 'thar', options: [{ value: 'thar', label: 'Thar desert (Jaisalmer, May)' }, { value: 'sahara', label: 'Sahara (very dry air)' }] },
      { id: 'other', label: 'Compare with', type: 'select', value: 'mumbai', options: [{ value: 'mumbai', label: 'Mumbai coast (May)' }, { value: 'cloudy', label: 'Thar under cloud, humid air' }, { value: 'fields', label: 'Wet green fields, same sun' }] },
      { id: 'hum', label: 'Water vapour in the desert air', min: 2, max: 20, step: 1, value: 9, unit: 'g/m³', presets: [{ label: 'Sahara 3', value: 3 }, { label: 'Thar 9', value: 9 }, { label: 'Humid 18', value: 18 }], help: 'Grams of invisible water vapour in each cubic metre of air. Mumbai in May has about 22.' },
      { id: 'cloud', label: 'Cloud cover over the desert', min: 0, max: 100, step: 10, value: 0, unit: '%', help: 'Clouds reflect sunlight by day and send heat back down at night.' }
    ],
    onParam: function (sim, id, v) {
      if (id === 'place') sim.setParam('hum', DESERTS[v].hum);
      return false;
    },
    readouts: [
      { id: 'ta', label: 'Desert air temperature', short: 'Desert air', unit: '°C', digits: 1, key: true },
      { id: 'tb', label: 'Other place air temperature', short: 'Other place', unit: '°C', digits: 1, key: true },
      { id: 'ra', label: 'Desert day–night range so far', short: 'Desert range', unit: '°C', digits: 1, key: true },
      { id: 'rb', label: 'Other place range so far', unit: '°C', digits: 1 },
      { id: 'clock', label: 'Time (sun time)' },
      { id: 'sand', label: 'Desert ground surface', unit: '°C', digits: 1 },
      { id: 'sun', label: 'Sunlight absorbed by desert ground', unit: 'W/m²', digits: 0 },
      { id: 'ir', label: 'Heat escaping to space from desert ground', unit: 'W/m²', digits: 0 }
    ],
    graph: { title: 'Air temperature through the day', xLabel: 'time of day (h)', yLabel: '°C', xMax: 24, includeZero: false,
      series: [{ label: 'Desert', color: '--sim-2' }, { label: 'Other place', color: '--sim-1' }] },

    reset: function (sim) {
      var p = sim.p, cl = p.cloud / 100;
      st.hr = 0; st.lastG = 0;
      st.a = makePlace(DESERTS[p.place] || DESERTS.thar, p.hum, cl);
      var o = OTHERS[p.other] || OTHERS.mumbai;
      st.b = makePlace(o, o.hum, o.cloud);
      if (sim.graph) sim.graph.push(0, [st.a.Ta, st.b.Ta]);
    },
    finished: function () { return st.hr >= 24; },
    update: function (sim, dt) {
      var n = Math.max(1, Math.round(dt * 3600 / DT));     // 1 hour of the day per second
      for (var i = 0; i < n && st.hr < 24; i++) {
        st.hr = Math.min(24, st.hr + DT / 3600);
        [st.a, st.b].forEach(function (s) {
          step(s.sc, s, st.hr);
          if (s.Ta > s.max) { s.max = s.Ta; s.tMax = st.hr; }
          if (s.Ta < s.min) { s.min = s.Ta; s.tMin = st.hr; }
        });
      }
      if (sim.graph && (st.hr - st.lastG >= 0.1 || st.hr >= 24)) { st.lastG = st.hr; sim.graph.push(st.hr, [st.a.Ta, st.b.Ta]); }
    },
    readout: function () {
      var a = st.a, b = st.b;
      return { ta: a.Ta, tb: b.Ta, ra: a.max - a.min, rb: b.max - b.min, clock: clock(st.hr), sand: a.Ts,
        sun: a.f.Sw, ir: Math.max(0, a.f.Lu - a.f.Ld) };
    },
    status: function () { return clock(st.hr) + ' · ' + stage(); },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, W = sim.width, H = sim.height;
      var small = W < 560 || H < 420;
      D.clear(ctx, W, H, c.bg);
      var head = small ? 28 : 38, gap = small ? 6 : 10, side = W >= 560 && W / H >= 1.25;
      var pw, ph, boxes;
      if (side) { pw = (W - gap * 3) / 2; ph = H - head - gap; boxes = [[gap, head, pw, ph], [gap * 2 + pw, head, pw, ph]]; }
      else { pw = W - gap * 2; ph = (H - head - gap * 2) / 2; boxes = [[gap, head, pw, ph], [gap, head + ph + gap, pw, ph]]; }
      drawPanel(ctx, c, st.a, boxes[0], 'Desert', side, small);
      drawPanel(ctx, c, st.b, boxes[1], 'Compare', side, small);
      // clock header
      var night = st.a.f.sn <= 0;
      var part = st.hr >= 24 ? 'day complete' : night ? 'night' : st.hr < 12 ? 'morning' : 'afternoon';
      D.text(ctx, (night ? '☾ ' : '☀ ') + clock(st.hr) + ' sun time · ' + part, W / 2, head / 2,
        { color: c.bg, bg: night ? c.s1 : c.warning, size: small ? 12 : 15, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });

  /* ---------- drawing one place ---------- */
  function mix(a, b, t) {
    var pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
    var pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
    return '#' + pa.map(function (v, i) { return ('0' + Math.round(v + (pb[i] - v) * t).toString(16)).slice(-2); }).join('');
  }
  function cloudShape(ctx, x, y, s, col) {
    D.circle(ctx, x - s * 0.55, y + s * 0.12, s * 0.45, col); D.circle(ctx, x + s * 0.55, y + s * 0.12, s * 0.42, col);
    D.circle(ctx, x, y - s * 0.12, s * 0.62, col); ctx.fillStyle = col; ctx.fillRect(x - s * 0.55, y + s * 0.1, s * 1.1, s * 0.47);
  }
  function wavyArrow(ctx, x, y1, y2, col, lw, amp, phase) {
    var dir = y2 < y1 ? -1 : 1, len = Math.abs(y2 - y1), head = Math.min(8, len * 0.4);
    if (len < 6) return;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath();
    for (var k = 0; k <= len - head * 0.7; k += 2) {
      var px = x + Math.sin(k / 6 + phase) * amp;
      if (k === 0) ctx.moveTo(px, y1 + dir * k); else ctx.lineTo(px, y1 + dir * k);
    }
    ctx.stroke(); ctx.restore();
    var ex = x + Math.sin((len - head * 0.7) / 6 + phase) * amp;
    D.arrow(ctx, ex, y2 - dir * head, ex, y2, col, lw, head);
  }

  function drawPanel(ctx, c, s, box, tag, side, small) {
    var x0 = box[0], y0 = box[1], w = box[2], h = box[3], sc = s.sc, f = s.f;
    var fs = small ? 10 : 12;
    var groundH = Math.max(small ? 34 : 50, h * (side ? 0.2 : 0.24)), gy = y0 + h - groundH;
    var thermW = small ? 46 : 64, skyR = x0 + w - thermW;            // sky area left of the thermometer column
    var sn = f.sn, dl = M.clamp((sn + 0.08) / 0.3, 0, 1), dusk = M.clamp(1 - Math.abs(sn - 0.02) / 0.12, 0, 1);
    ctx.save();
    D.roundRect(ctx, x0, y0, w, h, 10, null); ctx.clip();
    // sky
    var top = mix('#0a1024', '#3b82c4', dl), bot = mix('#1e2b4f', '#bfe0fb', dl);
    if (dusk > 0) bot = mix(bot, '#f59e6b', dusk * 0.7);
    var g = ctx.createLinearGradient(0, y0, 0, gy); g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    // stars
    if (dl < 0.9) {
      var rng = M.rng(tag === 'Desert' ? 11 : 29), nStar = Math.round(w * (gy - y0) / 900);
      for (var i = 0; i < nStar; i++) {
        var sx = x0 + rng() * w, sy = y0 + rng() * (gy - y0) * 0.8;
        D.circle(ctx, sx, sy, rng() < 0.2 ? 1.4 : 0.9, 'rgba(255,255,255,' + ((1 - dl) * (1 - s.cloud) * 0.9).toFixed(2) + ')');
      }
    }
    // water-vapour haze ("the blanket")
    var haze = M.clamp(s.hum / 24, 0, 1) * 0.28 + s.cloud * 0.15;
    var hz = ctx.createLinearGradient(0, y0, 0, gy); hz.addColorStop(0, 'rgba(148,163,184,0)'); hz.addColorStop(1, 'rgba(203,213,225,' + haze.toFixed(2) + ')');
    ctx.fillStyle = hz; ctx.fillRect(x0, y0, w, gy - y0);
    // sun
    var sun = s.sun, skyTop = y0 + (small ? 26 : 34), arcH = gy - skyTop - (small ? 12 : 18);
    var sxp = x0 + 18 + (skyR - x0 - 36) * M.clamp((st.hr - sun.rise) / (sun.set - sun.rise), -0.05, 1.05);
    var syp = gy - Math.max(-0.1, sn) * arcH, sr = small ? 9 : 13;
    if (sn > -0.06) {
      ctx.save(); ctx.globalAlpha = 0.35; D.circle(ctx, sxp, syp, sr * 1.8, '#fde68a'); ctx.restore();
      D.circle(ctx, sxp, syp, sr, sn > 0.15 ? '#fcd34d' : '#fb923c');
    }
    // clouds
    if (s.cloud > 0.04) {
      var nc = Math.max(1, Math.round(s.cloud * 6)), cr = M.rng(5);
      for (var k = 0; k < nc; k++) {
        var cxp = x0 + ((cr() * (skyR - x0) + st.hr * 6) % (skyR - x0 + 40)) - 20, cyp = skyTop + 6 + cr() * arcH * 0.35;
        cloudShape(ctx, cxp, cyp, (small ? 12 : 18) * (0.8 + cr() * 0.5), dl > 0.5 ? 'rgba(241,245,249,0.92)' : 'rgba(100,116,139,0.85)');
      }
    }
    // ground
    drawGround(ctx, sc.ground, x0, gy, w, groundH, s, dl);
    // sunlight arrows
    var phase = st.hr * 8;
    if (f.Sw > 15) {
      var na = 3, strength = M.clamp(f.Sw / 750, 0.15, 1);
      for (var a = 0; a < na; a++) {
        var tx = x0 + (skyR - x0) * (0.25 + a * 0.22), dx = tx - sxp, dy = gy - 4 - syp, L = Math.hypot(dx, dy), tLen = Math.min(L - sr - 4, (gy - skyTop) * 0.6);
        if (tLen < 10) continue;
        D.arrow(ctx, tx - dx / L * tLen, gy - 4 - dy / L * tLen, tx, gy - 4, 'rgba(250,204,21,' + (0.35 + 0.6 * strength).toFixed(2) + ')', 1.5 + 2.5 * strength, small ? 7 : 9);
      }
    }
    // heat (infrared) leaving the ground — shown when the sun is low or down
    if (sn < 0.25) {
      var vis = M.clamp((0.25 - sn) / 0.2, 0, 1), lossFrac = M.clamp((f.Lu - f.Ld - 10) / 56, 0, 1);
      var nUp = 4, escape = Math.round(lossFrac * nUp), blanketY = skyTop + arcH * 0.5;
      ctx.save(); ctx.globalAlpha = vis;
      for (var u = 0; u < nUp; u++) {
        var ux = x0 + (skyR - x0) * (0.14 + u * 0.22);
        if (u < escape) wavyArrow(ctx, ux, gy - 4, y0 + 4, '#f97316', 2.2, 3, phase + u);
        else {
          wavyArrow(ctx, ux, gy - 4, blanketY + 4, '#f97316', 2.2, 3, phase + u);
          wavyArrow(ctx, ux + (small ? 12 : 16), blanketY + 8, gy - 6, '#fb923c', 1.8, 2.5, phase + u + 2);
        }
      }
      if (escape < nUp && w > 200) {
        D.text(ctx, small ? 'vapour/clouds send heat back' : 'water vapour and clouds send heat back', x0 + (skyR - x0) / 2, blanketY - (small ? 6 : 9), { color: '#fff', bg: 'rgba(15,23,42,0.6)', size: small ? 9 : 11, weight: 600, align: 'center', pad: 2 });
      }
      ctx.restore();
    }
    // place name
    D.text(ctx, small && w < 330 ? sc.short : sc.name, x0 + 8, y0 + (small ? 12 : 16), { color: '#fff', bg: 'rgba(15,23,42,0.7)', size: fs + 1, weight: 700, pad: 3 });
    // escape label at the top
    if (sn < 0.25 && (f.Lu - f.Ld) > 55) {
      D.text(ctx, 'heat escapes to space ↑', skyR - 6, y0 + (small ? 32 : 42), { color: '#fed7aa', bg: 'rgba(15,23,42,0.7)', size: small ? 9 : 11, weight: 600, align: 'right', pad: 2 });
    }
    // ground temperature tag
    D.text(ctx, (sc.ground === 'sand' ? 'sand ' : 'ground ') + M.fmt(s.Ts, 0) + ' °C', x0 + (sc.ground === 'coast' ? w * 0.42 + 8 : 8), y0 + h - (small ? 10 : 14), { color: '#fff', bg: 'rgba(15,23,42,0.65)', size: fs, weight: 700, pad: 2 });
    ctx.restore();
    // thermometer column
    drawThermo(ctx, c, s, x0 + w - thermW, y0, thermW, gy - y0 + groundH * 0.3, small);
    D.roundRect(ctx, x0 + 0.5, y0 + 0.5, w - 1, h - 1, 10, null, D.alpha(c.ink, 0.25), 1);
  }

  function drawGround(ctx, type, x0, gy, w, gh, s, dl) {
    var heat = M.clamp((s.Ts - 25) / 40, 0, 1), shade = 0.55 + 0.45 * dl;
    function dim(hex) { return mix('#0b1020', hex, shade); }
    if (type === 'coast') {
      var seaW = w * 0.42;
      ctx.fillStyle = dim('#1d6fd1'); ctx.fillRect(x0, gy + 6, seaW, gh);
      ctx.strokeStyle = 'rgba(224,242,254,0.5)'; ctx.lineWidth = 1.2;
      for (var q = 0; q < 3; q++) { ctx.beginPath(); for (var xx = 0; xx <= seaW; xx += 4) ctx[xx ? 'lineTo' : 'moveTo'](x0 + xx, gy + 14 + q * 9 + Math.sin(xx / 9 + st.hr * 3 + q) * 1.5); ctx.stroke(); }
      ctx.fillStyle = dim('#7c6a46'); ctx.fillRect(x0 + seaW, gy + 4, w - seaW, gh);
      var br = M.rng(3);
      for (var b = 0; b < 7; b++) {
        var bw = 10 + br() * 14, bh = 14 + br() * 26, bx = x0 + seaW + 6 + b * (w - seaW - 10) / 7;
        ctx.fillStyle = dim('#64748b'); ctx.fillRect(bx, gy + 4 - bh, bw, bh);
        if (dl < 0.5) { ctx.fillStyle = 'rgba(253,224,71,0.8)'; ctx.fillRect(bx + 3, gy - bh + 10, 3, 3); }
      }
      if (gh > 30) D.text(ctx, 'sea', x0 + seaW / 2, gy + gh * 0.6, { color: '#e0f2fe', size: 11, weight: 700, align: 'center' });
      return;
    }
    if (type === 'fields') {
      ctx.fillStyle = dim('#3f7d2c'); ctx.fillRect(x0, gy, w, gh);
      ctx.strokeStyle = dim('#5fa83f'); ctx.lineWidth = 2;
      for (var r = 0; r < 4; r++) { ctx.beginPath(); ctx.moveTo(x0, gy + 6 + r * gh / 4); ctx.lineTo(x0 + w, gy + 6 + r * gh / 4); ctx.stroke(); }
      ctx.fillStyle = dim('#2f5d22');
      for (var tft = 0; tft < w; tft += 9) { ctx.beginPath(); ctx.moveTo(x0 + tft, gy + 2); ctx.lineTo(x0 + tft + 3, gy - 6); ctx.lineTo(x0 + tft + 6, gy + 2); ctx.fill(); }
      return;
    }
    // sand dunes
    ctx.fillStyle = dim(mix('#dcaa66', '#ef7d48', heat * 0.5));
    ctx.beginPath(); ctx.moveTo(x0, gy + gh);
    for (var dx = 0; dx <= w; dx += 4) ctx.lineTo(x0 + dx, gy + 4 - Math.sin(dx / w * Math.PI * 2.2 + 0.6) * 6 - Math.sin(dx / w * Math.PI * 5) * 2);
    ctx.lineTo(x0 + w, gy + gh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(120,72,30,0.25)';
    ctx.beginPath(); ctx.moveTo(x0, gy + gh);
    for (var dx2 = 0; dx2 <= w; dx2 += 4) ctx.lineTo(x0 + dx2, gy + gh * 0.55 - Math.sin(dx2 / w * Math.PI * 3 + 2) * 5);
    ctx.lineTo(x0 + w, gy + gh); ctx.closePath(); ctx.fill();
  }

  function drawThermo(ctx, c, s, x, y, w, h, small) {
    var cx = x + w / 2, top = y + (small ? 30 : 42), bulbR = small ? 7 : 9, bottom = y + h - bulbR - 4, tw = small ? 6 : 8;
    var T0 = 0, T1 = 50, frac = M.clamp((s.Ta - T0) / (T1 - T0), 0, 1);
    ctx.save();
    D.roundRect(ctx, x + 3, y + 3, w - 6, h - 6 + bulbR, 8, D.alpha(c.bg, 0.78));
    D.text(ctx, M.fmt(s.Ta, 1) + '°', cx, y + (small ? 13 : 18), { color: c.ink, size: small ? 13 : 17, weight: 700, align: 'center' });
    D.text(ctx, 'air', cx, y + (small ? 24 : 33), { color: c.muted, size: small ? 9 : 11, align: 'center' });
    D.roundRect(ctx, cx - tw / 2, top, tw, bottom - top + 2, tw / 2, D.alpha(c.ink, 0.12), D.alpha(c.ink, 0.5), 1);
    var col = s.Ta > 35 ? '#ef4444' : s.Ta > 25 ? '#f97316' : '#38bdf8', ly = bottom - (bottom - top) * frac;
    D.roundRect(ctx, cx - tw / 2 + 1.5, ly, tw - 3, bottom - ly + 2, (tw - 3) / 2, col);
    D.circle(ctx, cx, bottom + bulbR - 2, bulbR, col, D.alpha(c.ink, 0.5), 1);
    // ticks every 10 °C
    for (var t = 10; t <= 40; t += 10) {
      var ty = bottom - (bottom - top) * (t - T0) / (T1 - T0);
      D.line(ctx, cx + tw / 2, ty, cx + tw / 2 + 4, ty, D.alpha(c.ink, 0.6), 1);
      if (bottom - top > 70) D.text(ctx, String(t), cx + tw / 2 + 6, ty, { color: c.muted, size: small ? 8 : 10 });
    }
    // max / min markers
    [[s.max, '#ef4444'], [s.min, '#38bdf8']].forEach(function (m) {
      var my = bottom - (bottom - top) * M.clamp((m[0] - T0) / (T1 - T0), 0, 1);
      D.line(ctx, cx - tw / 2 - 6, my, cx - tw / 2 - 1, my, m[1], 2);
    });
    ctx.restore();
  }
})();
