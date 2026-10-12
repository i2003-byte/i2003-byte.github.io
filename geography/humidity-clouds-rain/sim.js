/* =====================================================================
   Weather and climate · Humidity, Clouds and Rain — sim.js
   ---------------------------------------------------------------------
   A parcel of air travels from the sea, over a coastal plain, up a
   mountain (like the Western Ghats) and down onto a plateau.
     Over the sea:  water evaporates into the air (the air moves towards
                    85 % relative humidity at the sea's temperature).
     Rising:        lower pressure → the air expands and cools by
                    9.8 °C per km (dry adiabatic rate).
     Dew point:     when the air has cooled to its dew point it is
                    saturated; extra vapour condenses into cloud drops
                    and the latent heat released makes it cool more
                    slowly (about 4–6 °C per km).
     Rain:          cloud water above 0.3 g per kg falls out as rain.
     Sinking:       the air is squeezed and warms by 9.8 °C per km; the
                    cloud left evaporates; the far side gets little rain.
   Formulas:
     p(z)   = 101.3 · e^(−z / 8.4 km)  kPa
     es(T)  = 0.6108 · e^(17.27 T / (T + 237.3))  kPa   (Magnus/Tetens)
     ws     = 622 · es / (p − es)   g of vapour per kg of air (saturation)
     RH     = e / es(T) × 100 %,  e = w · p / (622 + w)
     dew pt = 237.3 γ / (17.27 − γ),  γ = ln(e / 0.6108)
     latent heat: 1 g/kg condensed warms the air by L/cp ≈ 2.49 °C
   Rain depth assumes a 1 km thick layer of such air (≈ 1000 kg per m²),
   so 1 g/kg rained out = 1 mm of rain.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var XMAX = 240, SEA_END = 80, SPEED = 12, LCP = 2.49, CLOUD_MAX = 0.3, ZMAX = 3;
  var st = {};

  function P(z) { return 101.3 * Math.exp(-z / 8.4); }
  function es(T) { return 0.6108 * Math.exp(17.27 * T / (T + 237.3)); }
  function ws(T, p) { var e = es(T); return 622 * e / Math.max(p - e, 1); }
  function vap(w, p) { return w * p / (622 + w); }
  function dew(w, p) { var g = Math.log(Math.max(vap(w, p), 1e-4) / 0.6108); return 237.3 * g / (17.27 - g); }
  function rh(w, T, p) { return Math.min(100, vap(w, p) / es(T) * 100); }
  function plateau(hill) { return Math.min(0.6, hill * 0.6); }
  function terrain(x, hill) {
    var pl = plateau(hill);
    if (x < SEA_END) return 0;
    if (x < 110) return 0.1 * (x - SEA_END) / 30;
    if (x < 150) return 0.1 + (hill - 0.1) * (1 - Math.cos(Math.PI * (x - 110) / 40)) / 2;
    if (x < 185) return pl + (hill - pl) * (1 + Math.cos(Math.PI * (x - 150) / 35)) / 2;
    return pl;
  }
  function dwsdT(T, p) { return (ws(T + 0.05, p) - ws(T - 0.05, p)) / 0.1; }

  function stage() {
    if (st.x < SEA_END) return st.w < 0.85 * ws(st.Tsea, 101.3) - 0.3 ? 'Over the sea: water evaporates into the air' : 'Over the sea: the air is nearly full of vapour';
    if (st.x < 150) {
      if (st.rainRate > 0.02) return 'Rising and raining on the windward slope';
      if (st.c > 0.01) return 'Cooled to the dew point: a cloud forms';
      return st.x < 110 ? 'Over the coast: the air starts to rise' : 'Rising up the slope: the air cools';
    }
    if (st.c > 0.01) return 'Sinking: the air warms and the cloud dries up';
    return 'Rain shadow: warm, drier sinking air';
  }

  SimLab.createSim({
    ariaLabel: 'A side view from the sea, over a coast and up a mountain to a plateau. A bubble of air picks up water vapour over the sea, rises and cools, forms a cloud when it reaches its dew point, rains on the windward slope and sinks warm and dry on the far side; rain gauges show how much rain fell along the way',
    playLabel: 'Send the air',
    mobileAspect: '3 / 3',
    params: [
      { id: 'seaT', label: 'Sea temperature', min: 20, max: 32, step: 0.5, value: 28, unit: '°C', presets: [{ label: 'Cool 22', value: 22 }, { label: 'Warm 28', value: 28 }, { label: 'Very warm 31', value: 31 }], help: 'A warmer sea evaporates more water into the air.' },
      { id: 'rh0', label: 'Humidity of the air arriving', min: 20, max: 90, step: 5, value: 60, unit: '%', help: 'Relative humidity of the air before it crosses the sea.' },
      { id: 'hill', label: 'Mountain height', min: 0.3, max: 2.5, step: 0.1, value: 1.5, unit: 'km', presets: [{ label: 'Low hills 0.5', value: 0.5 }, { label: 'Western Ghats 1.5', value: 1.5 }, { label: 'High 2.5', value: 2.5 }] }
    ],
    readouts: [
      { id: 'T', label: 'Air temperature', short: 'Air temp', unit: '°C', digits: 1, key: true },
      { id: 'rh', label: 'Relative humidity', short: 'Humidity', unit: '%', digits: 0, key: true },
      { id: 'td', label: 'Dew point', unit: '°C', digits: 1 },
      { id: 'z', label: 'Height of the air', unit: 'km', digits: 2 },
      { id: 'w', label: 'Water vapour in the air', unit: 'g per kg', digits: 1 },
      { id: 'sky', label: 'Sky', key: true },
      { id: 'rw', label: 'Rain on the windward side', unit: 'mm', digits: 1 },
      { id: 'rl', label: 'Rain on the far (leeward) side', unit: 'mm', digits: 1 }
    ],
    graph: { title: 'Temperature and dew point along the journey', xLabel: 'distance (km)', yLabel: '°C', xMax: XMAX,
      series: [{ label: 'Air temperature', color: '--sim-2' }, { label: 'Dew point', color: '--sim-1' }] },
    reset: function (sim) {
      var p = sim.p;
      st.Tsea = p.seaT; st.hill = p.hill;
      st.x = 0; st.z = terrain(0, p.hill) + 0.05; st.T = p.seaT - 2;
      st.w = p.rh0 / 100 * ws(st.T, P(st.z)); st.c = 0; st.rainRate = 0;
      st.rain = []; for (var i = 0; i < XMAX / 10; i++) st.rain.push(0);
      st.rw = 0; st.rl = 0; st.trail = []; st.lastTrail = -9; st.lastG = -9; st.zBase = null;
    },
    finished: function () { return st.x >= XMAX; },
    update: function (sim, dt) {
      var dx = SPEED * dt, x = Math.min(XMAX, st.x + dx), z = terrain(x, st.hill) + 0.05, dz = z - st.z, p = P(z), k, d;
      st.T -= 9.8 * dz;                                  // expand → cool, squeeze → warm
      if (x < SEA_END) {                                 // evaporation from the sea
        var target = 0.85 * ws(st.Tsea, p);
        if (target > st.w) st.w += (target - st.w) * (1 - Math.exp(-dx / 60));
        st.T += (st.Tsea - 1 - st.T) * (1 - Math.exp(-dx / 40));
      }
      for (k = 0; k < 4; k++) {                          // condense or evaporate cloud, with latent heat
        var ex = st.w - ws(st.T, p);
        if (ex > 0) { d = ex / (1 + LCP * dwsdT(st.T, p)); st.w -= d; st.c += d; st.T += LCP * d; }
        else if (st.c > 0) { d = Math.min(st.c, -ex / (1 + LCP * dwsdT(st.T, p))); st.w += d; st.c -= d; st.T -= LCP * d; }
      }
      if (st.c > 0.001 && st.zBase == null) st.zBase = z;
      var r = st.c > CLOUD_MAX ? (st.c - CLOUD_MAX) * (1 - Math.exp(-dx / 12)) : 0;
      st.c -= r; st.rainRate = r / Math.max(dx, 1e-6);
      if (r > 0) { st.rain[Math.min(st.rain.length - 1, Math.floor(x / 10))] += r; if (x < 150) st.rw += r; else st.rl += r; }
      st.x = x; st.z = z;
      if (x - st.lastTrail >= 3) { st.lastTrail = x; if (st.c > 0.01) st.trail.push({ x: x, z: z, c: st.c, rain: st.rainRate > 0.02 }); }
      if (sim.graph && x - st.lastG >= 2) { st.lastG = x; sim.graph.push(x, [st.T, dew(st.w, p)]); }
    },
    readout: function () {
      var p = P(st.z);
      return { T: st.T, rh: rh(st.w, st.T, p), td: dew(st.w, p), z: st.z, w: st.w,
        sky: st.rainRate > 0.02 ? 'Raining' : st.c > 0.01 ? 'Cloud' : 'Clear',
        rw: st.rw, rl: st.rl };
    },
    status: function () { return stage(); },

    draw: function (sim, now) {
      var ctx = sim.ctx, c = sim.colors, W = sim.width, H = sim.height, narrow = W < 560, t = (now || performance.now()) / 1000;
      var top = narrow ? 34 : 44, left = narrow ? 30 : 40, right = W - 8, ground = H - (narrow ? 26 : 30);
      var zs = (ground - top) / ZMAX;
      function X(km) { return left + km / XMAX * (right - left); }
      function Y(z) { return ground - z * zs; }
      D.clear(ctx, W, H, c.bg);
      // sky
      var sky = ctx.createLinearGradient(0, top, 0, ground);
      sky.addColorStop(0, c.light ? '#bfdbfe' : '#0b1e3a'); sky.addColorStop(1, c.light ? '#eff6ff' : '#1e3a5f');
      ctx.fillStyle = sky; ctx.fillRect(left, top - 6, right - left, ground - top + 6);
      // height axis
      for (var hz = 0; hz <= ZMAX; hz++) {
        D.line(ctx, left, Y(hz), right, Y(hz), D.alpha(c.ink, 0.08), 1);
        D.text(ctx, hz + (hz === ZMAX ? ' km' : ''), left - 4, Y(hz), { color: c.muted, size: narrow ? 9 : 11, align: 'right' });
      }
      // sun
      var sx = X(22), sy = top + (narrow ? 22 : 30), sr = narrow ? 10 : 14;
      D.circle(ctx, sx, sy, sr, '#fbbf24');
      for (var a = 0; a < 8; a++) { var an = a * Math.PI / 4; D.line(ctx, sx + Math.cos(an) * sr * 1.3, sy + Math.sin(an) * sr * 1.3, sx + Math.cos(an) * sr * 1.8, sy + Math.sin(an) * sr * 1.8, '#fbbf24', 2); }
      // sea
      ctx.fillStyle = c.light ? '#3b82f6' : '#1d4ed8'; ctx.fillRect(X(0), Y(0) - 2, X(SEA_END + 3) - X(0), ground - Y(0) + 2 + (H - ground));
      D.text(ctx, 'Sea ' + M.fmt(st.Tsea, 1) + ' °C', X(SEA_END / 2), ground + (narrow ? 13 : 15), { color: '#e0f2fe', size: narrow ? 10 : 12, weight: 700, align: 'center' });
      // evaporation wiggles
      ctx.save(); ctx.strokeStyle = 'rgba(224,242,254,0.7)'; ctx.lineWidth = 1.5;
      var nEv = Math.round(3 + (st.Tsea - 20) / 3);
      for (var e = 0; e < nEv; e++) {
        var ex = X(6 + e * (SEA_END - 12) / Math.max(1, nEv - 1)), ph = ((t * 0.5 + e * 0.29) % 1), ey = Y(0) - 6 - ph * zs * 0.45;
        ctx.globalAlpha = (1 - ph) * 0.9; ctx.beginPath();
        for (var q = 0; q <= 12; q++) { var yy = ey - q * 1.6; ctx[q ? 'lineTo' : 'moveTo'](ex + Math.sin(q * 0.9 + t * 3) * 3, yy); }
        ctx.stroke();
      }
      ctx.restore();
      // land
      ctx.beginPath(); ctx.moveTo(X(SEA_END), H);
      for (var gx = SEA_END; gx <= XMAX; gx += 1) ctx.lineTo(X(gx), Y(terrain(gx, st.hill)));
      ctx.lineTo(X(XMAX), H); ctx.closePath();
      var lg = ctx.createLinearGradient(0, Y(st.hill), 0, ground);
      lg.addColorStop(0, '#4d7c3a'); lg.addColorStop(1, '#3f6212');
      ctx.fillStyle = lg; ctx.fill();
      // plateau side drier colour
      ctx.save(); ctx.clip();
      ctx.fillStyle = 'rgba(180,120,60,0.45)'; ctx.fillRect(X(160), 0, X(XMAX) - X(160), H);
      ctx.restore();
      // river back to the sea
      ctx.save(); ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = narrow ? 2 : 3; ctx.lineCap = 'round'; ctx.beginPath();
      for (var rx = 140; rx >= SEA_END; rx -= 2) ctx[rx === 140 ? 'moveTo' : 'lineTo'](X(rx), Y(terrain(rx, st.hill)) + 3);
      ctx.stroke(); ctx.restore();
      var pill = { color: '#fff', size: narrow ? 9 : 10, weight: 600, align: 'center', bg: 'rgba(0,0,0,0.45)', pad: 2 };
      if (!narrow) D.text(ctx, 'river carries water back to the sea', X(112), ground - 8, pill);

      // clouds left behind
      st.trail.forEach(function (pt) {
        var cx = X(pt.x), cy = Y(pt.z) - 8, s = (narrow ? 7 : 10) * (0.7 + Math.min(1, pt.c / 1.5));
        if (pt.rain) {
          ctx.save(); ctx.strokeStyle = 'rgba(96,165,250,0.75)'; ctx.lineWidth = 1.2; ctx.beginPath();
          var gy = Y(terrain(pt.x, st.hill));
          for (var i = 0; i < 3; i++) {
            var dx2 = (i - 1) * s * 0.6, off = ((t * 1.5 + i * 0.33 + pt.x * 0.07) % 1) * Math.max(4, gy - cy - 6);
            ctx.moveTo(cx + dx2, cy + s * 0.4 + off); ctx.lineTo(cx + dx2 - 2, cy + s * 0.4 + off + 6);
          }
          ctx.stroke(); ctx.restore();
        }
        var col = pt.rain ? 'rgba(148,163,184,0.85)' : 'rgba(241,245,249,0.85)';
        D.circle(ctx, cx - s * 0.5, cy + s * 0.1, s * 0.45, col); D.circle(ctx, cx + s * 0.5, cy + s * 0.1, s * 0.42, col); D.circle(ctx, cx, cy - s * 0.15, s * 0.6, col);
      });
      // cloud base line
      if (st.zBase != null) {
        D.line(ctx, X(SEA_END), Y(st.zBase), X(160), Y(st.zBase), D.alpha(c.ink, 0.45), 1, [5, 4]);
        D.text(ctx, 'cloud base ' + M.fmt(st.zBase, 2) + ' km', X(SEA_END) - 4, Y(st.zBase), { color: c.ink, size: narrow ? 9 : 11, align: 'right', bg: D.alpha(c.bg, 0.6), pad: 2 });
      }
      // rain gauges
      var topR = Math.max.apply(null, st.rain), mxR = Math.max(1.5, topR);
      st.rain.forEach(function (r, i) {
        if (r < 0.01) return;
        var bx = X(i * 10 + 5), by = Y(terrain(i * 10 + 5, st.hill)), bh = r / mxR * (narrow ? 34 : 50), bw = Math.max(4, (X(10) - X(0)) * 0.35);
        D.roundRect(ctx, bx - bw / 2, by - bh, bw, bh, 2, 'rgba(96,165,250,0.9)', '#1e3a8a', 1);
        if (r === topR) D.text(ctx, 'rain gauges', bx - bw, by - bh - 8, { color: '#fff', size: narrow ? 9 : 10, weight: 700, align: 'right', bg: 'rgba(30,58,138,0.8)', pad: 2 });
      });

      // the air parcel
      var p = P(st.z), px = Math.min(X(st.x), right - (narrow ? 17 : 23)), py = Y(st.z) - (narrow ? 22 : 30), pr = narrow ? 15 : 21, hum = rh(st.w, st.T, p) / 100;
      D.circle(ctx, px, py, pr, D.alpha(st.T > 22 ? '#f97316' : '#38bdf8', 0.25), c.ink, 1.5);
      var rng = M.rng(7), nd = Math.round(Math.min(40, st.w * 1.6));
      for (var j = 0; j < nd; j++) {
        var ang = rng() * Math.PI * 2, rad = Math.sqrt(rng()) * (pr - 4), wob = Math.sin(t * 4 + j) * 1.2;
        D.circle(ctx, px + Math.cos(ang) * rad + wob, py + Math.sin(ang) * rad, narrow ? 1.6 : 2, '#38bdf8');
      }
      if (st.c > 0.01) { var cs = pr * 0.9, cc = 'rgba(241,245,249,0.9)'; D.circle(ctx, px - cs * 0.5, py + 2, cs * 0.45, cc); D.circle(ctx, px + cs * 0.5, py + 2, cs * 0.42, cc); D.circle(ctx, px, py - cs * 0.15, cs * 0.6, cc); }
      // humidity gauge next to the parcel
      var gw = narrow ? 8 : 10, gh = pr * 2, gxp = st.x > 200 ? px - pr - gw - 6 : px + pr + 6, gyp = py - pr;
      D.roundRect(ctx, gxp, gyp, gw, gh, 3, D.alpha(c.ink, 0.1), c.ink, 1);
      D.roundRect(ctx, gxp + 1.5, gyp + gh * (1 - hum) + 1.5, gw - 3, Math.max(0, gh * hum - 3), 2, hum > 0.99 ? '#e2e8f0' : '#38bdf8');
      D.text(ctx, M.fmt(st.T, 0) + ' °C · ' + M.fmt(hum * 100, 0) + '%', px, py - pr - 9, { color: c.ink, size: narrow ? 10 : 12, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.7), pad: 2, fit: W });
      // wind arrow
      D.arrow(ctx, X(4), top + (narrow ? 50 : 66), X(4) + (narrow ? 28 : 40), top + (narrow ? 50 : 66), c.ink, 2, 7);
      D.text(ctx, 'wind', X(4), top + (narrow ? 40 : 54), { color: c.muted, size: narrow ? 9 : 11 });

      // labels
      var lab = { color: '#fef9c3', size: narrow ? 9 : 11, weight: 700, align: 'center', bg: 'rgba(0,0,0,0.4)', pad: 2 };
      D.text(ctx, st.hill >= 1 ? 'Western Ghats' : 'Hills', X(150), Y(st.hill) + (narrow ? 12 : 16), lab);
      var done = st.x >= XMAX;
      D.text(ctx, done && st.rw > 0.3 && st.rl < st.rw * 0.3 ? 'Plateau: rain shadow' : 'Plateau', X(213), Y(plateau(st.hill)) + (narrow ? 12 : 16), Object.assign({ fit: W }, lab));
      if (!narrow) D.text(ctx, 'windward side', X(125), ground + 15, pill);
      if (!narrow) D.text(ctx, 'leeward side', X(200), ground + 15, pill);
      // headline
      D.text(ctx, stage(), W / 2, narrow ? 14 : 19, { color: c.bg, bg: st.rainRate > 0.02 ? c.s1 : st.c > 0.01 ? c.muted : st.x < SEA_END ? c.success : c.warning, size: narrow ? 12 : 14, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
