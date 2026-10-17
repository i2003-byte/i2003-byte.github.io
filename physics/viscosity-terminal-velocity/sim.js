/* =====================================================================
   Mechanical properties of fluids · Viscosity & Terminal Velocity — sim.js
   ---------------------------------------------------------------------
   A sphere of radius r and density σ falls through a fluid of density ρ
   and viscosity η. Forces: weight (4/3)πr³σg down, upthrust (4/3)πr³ρg
   up, viscous drag up.
     Drag: Stokes' law F = 6πηrv only holds when the Reynolds number
     Re = ρv(2r)/η is small (Re < 1). For faster flow we use the standard
     Schiller–Naumann correction F = 6πηrv(1 + 0.15·Re^0.687) up to
     Re = 1000, then Newton's drag F = ½·0.44·ρπr²v². So the sim shows
     where Stokes' law works (glycerine, honey) and where it fails badly
     (a steel ball in water, a raindrop in air).
     Motion: (m + ½ρV)·dv/dt = W − U − F(v)  (½ρV = "added mass" of the
     fluid pushed along). Integrated semi-implicitly (drag linearised as
     k·v) so very thick liquids stay stable with 1/240 s steps.
     Viscosity falls with temperature: η(T) = η₂₀·e^(−a(T−20)) with
     rounded a for each liquid. Wall effects of the jar are ignored.
   Scenes: jar — the ball and a ball twice as wide in 50 cm of liquid;
           sky — a cloud droplet, raindrop or hailstone falling 2 km
           through air, next to the same object with no air.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var G = 9.8, DEPTH = 0.5, SKY = 2000;
  var LIQ = {
    honey:    { name: 'Honey', rho: 1420, eta: 10, a: 0.09, col: '#f59e0b' },
    glycerine:{ name: 'Glycerine', rho: 1260, eta: 1.41, a: 0.08, col: '#a5b4fc' },
    castor:   { name: 'Castor oil', rho: 960, eta: 0.99, a: 0.073, col: '#fde68a' },
    water:    { name: 'Water', rho: 1000, eta: 0.001, a: 0.02, col: '#38bdf8' }
  };
  var MAT = { steel: { name: 'steel', rho: 7800, col: '#cbd5e1' }, glass: { name: 'glass', rho: 2500, col: '#99f6e4' },
    aluminium: { name: 'aluminium', rho: 2700, col: '#e2e8f0' }, plastic: { name: 'plastic (nylon)', rho: 1150, col: '#f472b6' } };
  var AIR = { rho: 1.2, eta: 1.8e-5 };
  var OBJ = {
    cloud:   { name: 'cloud droplet', r: 1e-5, rho: 1000 },
    drizzle: { name: 'drizzle drop', r: 1e-4, rho: 1000 },
    rain:    { name: 'raindrop', r: 1e-3, rho: 1000 },
    bigrain: { name: 'big raindrop', r: 2e-3, rho: 1000 },
    hail:    { name: 'small hailstone', r: 5e-3, rho: 900 },
    bighail: { name: 'big hailstone', r: 0.025, rho: 900 }
  };

  // ---------- physics ----------
  function drag(v, r, f) {                 // magnitude of drag at speed |v| (N)
    var s = Math.abs(v), Re = f.rho * s * 2 * r / f.eta;
    if (Re < 1000) return 6 * Math.PI * f.eta * r * s * (1 + 0.15 * Math.pow(Re, 0.687));
    return 0.5 * 0.44 * f.rho * Math.PI * r * r * s * s;
  }
  function body(r, rhoS, f) {
    var V = 4 / 3 * Math.PI * r * r * r;
    return { r: r, V: V, W: V * rhoS * G, U: V * f.rho * G, m: V * rhoS + 0.5 * V * f.rho, f: f };
  }
  function vTerm(b) {                       // speed where drag = W − U (down +; negative = rises)
    var net = b.W - b.U, lo = 0, hi = 1;
    if (Math.abs(net) < 1e-15) return 0;
    while (drag(hi, b.r, b.f) < Math.abs(net) && hi < 1e4) hi *= 2;
    for (var i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (drag(mid, b.r, b.f) < Math.abs(net)) lo = mid; else hi = mid; }
    return net > 0 ? lo : -lo;
  }
  function stokes(b) { return 2 * b.r * b.r * (b.W - b.U) / b.V / (9 * b.f.eta); }   // 2r²(σ−ρ)g/9η
  function reynolds(b, v) { return b.f.rho * Math.abs(v) * 2 * b.r / b.f.eta; }
  function step(o, dt) {                    // semi-implicit: drag = k·v with k from the current speed
    var b = o.b, k = Math.abs(o.v) > 1e-12 ? drag(o.v, b.r, b.f) / Math.abs(o.v) : 6 * Math.PI * b.f.eta * b.r;
    o.v = (o.v + dt * (b.W - b.U) / b.m) / (1 + dt * k / b.m);
    o.y += o.v * dt;
  }
  function liquid(p) {
    var L = LIQ[p.liq];
    return { name: L.name, rho: L.rho, eta: L.eta * Math.exp(-L.a * (p.temp - 20)), col: L.col };
  }
  function bodies(p) {
    if (p.scene === 'sky') {
      var o = OBJ[p.obj];
      return { a: body(o.r, o.rho, AIR), b: null };
    }
    var f = liquid(p), rs = MAT[p.mat].rho, r = p.r / 1000;
    return { a: body(r, rs, f), b: body(2 * r, rs, f) };
  }
  function speedTxt(v) {
    var s = Math.abs(v);
    return s >= 1 ? M.fmt(s, 2) + ' m/s' : s >= 0.01 ? M.fmt(s * 100, 1) + ' cm/s' : M.fmt(s * 1000, s >= 0.001 ? 1 : 2) + ' mm/s';
  }
  function timeTxt(t) {
    if (!isFinite(t)) return '—';
    return t < 120 ? M.fmt(t, t < 10 ? 1 : 0) + ' s' : t < 7200 ? M.fmt(t / 60, 1) + ' min' : M.fmt(t / 3600, 1) + ' h';
  }

  var st = {};
  function init(p) {
    var bs = bodies(p);
    st.A = { b: bs.a, y: 0, v: 0, done: false, tEnd: null };
    st.B = bs.b ? { b: bs.b, y: 0, v: 0, done: false, tEnd: null } : null;
    st.ghost = { y: 0, v: 0, done: false, tEnd: null };     // sky: same object with no air
    st.t = 0;
    // time to the bottom, integrated once from rest (steps grow with the distance left)
    var o = { b: bs.a, y: 0, v: 0 }, len = p.scene === 'sky' ? SKY : DEPTH, vt = Math.abs(vTerm(bs.a)), t = 0;
    while (bs.a.W > bs.a.U && o.y < len && t < 4e5) { var h = Math.max(1 / 240, (len - o.y) / Math.max(vt, 1e-9) / 200); step(o, h); t += h; }
    st.tBottom = t;
  }

  SimLab.createSim({
    ariaLabel: 'Two balls of radius r and 2r falling through a tall jar of liquid such as glycerine or honey, quickly reaching a steady terminal speed, with arrows for weight, upthrust and viscous drag; or a raindrop or hailstone falling 2 km through air next to one falling with no air',
    playLabel: 'Drop',
    mobileAspect: '3 / 3.3',
    params: [
      { id: 'scene', label: 'Scene', type: 'select', value: 'jar', options: [
        { value: 'jar', label: 'Balls in a jar of liquid' },
        { value: 'sky', label: 'Rain and hail through air' }] },
      { id: 'liq', label: 'Jar: liquid', type: 'select', value: 'glycerine', options: [
        { value: 'honey', label: 'Honey (very thick)' }, { value: 'glycerine', label: 'Glycerine' },
        { value: 'castor', label: 'Castor oil' }, { value: 'water', label: 'Water (thin)' }] },
      { id: 'mat', label: 'Jar: ball made of', type: 'select', value: 'steel', options: [
        { value: 'steel', label: 'Steel (7800 kg/m³)' }, { value: 'aluminium', label: 'Aluminium (2700 kg/m³)' },
        { value: 'glass', label: 'Glass (2500 kg/m³)' }, { value: 'plastic', label: 'Plastic (1150 kg/m³)' }] },
      { id: 'r', label: 'Jar: ball radius r', min: 0.5, max: 5, step: 0.1, value: 1.5, unit: 'mm', presets: [1, 1.5, 3],
        help: 'The right-hand jar always has a ball of radius 2r.' },
      { id: 'temp', label: 'Jar: temperature', min: 10, max: 60, step: 1, value: 20, unit: '°C', help: 'Warm liquids are less viscous.' },
      { id: 'obj', label: 'Sky: falling object', type: 'select', value: 'rain', options: [
        { value: 'cloud', label: 'Cloud droplet (r = 0.01 mm)' }, { value: 'drizzle', label: 'Drizzle (r = 0.1 mm)' },
        { value: 'rain', label: 'Raindrop (r = 1 mm)' }, { value: 'bigrain', label: 'Big raindrop (r = 2 mm)' },
        { value: 'hail', label: 'Small hailstone (r = 5 mm)' }, { value: 'bighail', label: 'Big hailstone (r = 2.5 cm)' }] }
    ],
    readouts: [
      { id: 'vt', label: 'Terminal speed', key: true, short: 'Terminal v' },
      { id: 'st', label: 'Stokes\' law predicts', key: true, short: 'Stokes' },
      { id: 're', label: 'Reynolds number Re', key: true, short: 'Re' },
      { id: 'v', label: 'Speed now' },
      { id: 'tt', label: 'Time to the bottom' },
      { id: 'eta', label: 'Viscosity η' }
    ],
    graph: { title: 'Speed vs time (jar: cm/s · sky: m/s)', yLabel: 'speed', series: [{ label: 'Ball r / object in air' }, { label: 'Ball 2r / no air' }] },
    reset: function (sim) { init(sim.p); },
    update: function (sim, dt) {
      var p = sim.p, len = p.scene === 'sky' ? SKY : DEPTH;
      st.t += dt;
      [st.A, st.B].forEach(function (o) {
        if (!o || o.done) return;
        step(o, dt);
        if (o.y < 0) { o.y = 0; o.v = Math.max(0, o.v); }      // lighter than the liquid: stays at the top
        if (o.y >= len) { o.y = len; o.done = true; o.tEnd = st.t; }
      });
      if (p.scene === 'sky' && !st.ghost.done) {
        st.ghost.v += G * dt; st.ghost.y += st.ghost.v * dt;
        if (st.ghost.y >= SKY) { st.ghost.y = SKY; st.ghost.done = true; st.ghost.tEnd = st.t; }
      }
    },
    finished: function (sim) {
      var floatA = st.A.b.W <= st.A.b.U;
      if (floatA) return st.t > 1.5;
      return st.A.done && (!st.B || st.B.done);
    },
    sample: function (sim) {
      if (sim.p.scene === 'sky') return [st.A.v, st.ghost.done ? NaN : st.ghost.v];
      return [st.A.v * 100, st.B.v * 100];
    },
    readout: function (sim) {
      var p = sim.p, b = st.A.b, vt = vTerm(b), vs = stokes(b), Re = reynolds(b, vt), len = p.scene === 'sky' ? SKY : DEPTH;
      var floats = b.W <= b.U, ok = Re < 1 ? ' ✓ Stokes works' : Re < 10 ? ' (Stokes a bit high)' : ' ✗ too fast for Stokes';
      var t = st.tBottom;
      return {
        vt: floats ? 'rises (lighter than the liquid)' : speedTxt(vt),
        st: floats ? '—' : speedTxt(vs) + (Math.abs(vs / vt) > 1.15 ? ' (×' + M.fmt(vs / vt, vs / vt > 10 ? 0 : 1) + ' too big)' : ''),
        re: floats ? '—' : (Re < 0.01 ? Re.toExponential(1) : M.fmt(Re, Re < 10 ? 2 : 0)) + ok,
        v: speedTxt(st.A.v) + (st.A.done ? ' (landed)' : ''),
        tt: floats ? '—' : timeTxt(t) + (p.scene === 'sky' ? ' (no air: ' + timeTxt(Math.sqrt(2 * SKY / G)) + ')' : ' for 50 cm'),
        eta: p.scene === 'sky' ? '1.8 × 10⁻⁵ Pa·s (air)' : (b.f.eta < 0.01 ? M.fmt(b.f.eta * 1000, 2) + ' × 10⁻³' : M.fmt(b.f.eta, b.f.eta >= 10 ? 1 : 2)) + ' Pa·s'
      };
    },
    status: function (sim) {
      var b = st.A.b, vt = vTerm(b);
      if (b.W <= b.U) return 'The ball is lighter than the liquid, so it floats up';
      if (st.A.done) return 'Landed';
      return Math.abs(st.A.v) > 0.98 * Math.abs(vt) ? 'Terminal speed: drag + upthrust = weight' : 'Speeding up: drag still growing';
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 11 : 13;
      D.clear(ctx, W, H, c.bg);
      var tag = function (t, x, y, col, al, sz) { D.text(ctx, t, x, y, { color: col || c.ink, size: sz || fs, weight: 700, align: al || 'center', bg: D.alpha(c.bg, 0.82), pad: 3, fit: W }); };
      var b = st.A.b, vt = vTerm(b), sky = p.scene === 'sky';
      var top = 54, bot = H - 26, colW = narrow ? W * 0.15 : Math.min(W * 0.11, 110);
      var xs = narrow ? [W * 0.2, W * 0.42] : [W * 0.12, W * 0.3];

      if (!sky) {
        var f = b.f, len = DEPTH;
        [0, 1].forEach(function (k) {
          var o = k ? st.B : st.A, x = xs[k];
          ctx.fillStyle = D.alpha(f.col, 0.28); ctx.fillRect(x - colW / 2, top, colW, bot - top);
          ctx.strokeStyle = c.ink; ctx.lineWidth = 2.5; ctx.beginPath();
          ctx.moveTo(x - colW / 2, top - 14); ctx.lineTo(x - colW / 2, bot); ctx.lineTo(x + colW / 2, bot); ctx.lineTo(x + colW / 2, top - 14); ctx.stroke();
          D.line(ctx, x - colW / 2, top, x + colW / 2, top, D.alpha(f.col, 0.9), 2);
          var rpx = M.clamp(1.5 + o.b.r * 1000 * 1.6, 3, colW * 0.4), by = top + rpx + (bot - top - 2 * rpx) * o.y / len;
          D.circle(ctx, x, by, rpx, MAT[p.mat].col, c.ink, 1.2);
          if (o.y > 0.01 && !o.done && Math.abs(o.v) > 1e-6) D.line(ctx, x, by - rpx - 2, x, by - rpx - 2 - Math.min(30, 6 + Math.abs(o.v) / Math.max(Math.abs(vt), 1e-9) * 10), D.alpha(c.ink, 0.35), 2);
          D.text(ctx, k ? '2r' : 'r', x, top - 22, { color: k ? c.s2 : c.s1, size: fs + 1, weight: 700, align: 'center' });
          if (o.tEnd != null) tag(timeTxt(o.tEnd), x, bot - 14, k ? c.s2 : c.s1, 'center', fs - 1);
        });
        // depth marks every 10 cm
        for (var cm = 0; cm <= 50; cm += 10) {
          var yy = top + (bot - top) * cm / 50;
          D.line(ctx, xs[0] - colW / 2 - 6, yy, xs[0] - colW / 2, yy, c.muted, 1.5);
          D.line(ctx, xs[1] + colW / 2, yy, xs[1] + colW / 2 + 6, yy, c.muted, 1.5);
          D.text(ctx, String(cm), xs[0] - colW / 2 - 8, yy, { color: c.muted, size: fs - 2, align: 'right' });
        }
        D.text(ctx, 'cm', xs[0] - colW / 2 - 8, top - 14, { color: c.muted, size: fs - 2, align: 'right' });
        D.text(ctx, f.name + ' at ' + p.temp + ' °C', (xs[0] + xs[1]) / 2, 12, { color: c.muted, size: fs - 1, align: 'center', fit: W });
      } else {
        // ---------- sky: two 2 km columns ----------
        var lbl = ['in air', 'no air'];
        [0, 1].forEach(function (k) {
          var x = xs[k];
          ctx.fillStyle = D.alpha(c.s1, 0.08); ctx.fillRect(x - colW / 2, top, colW, bot - top);
          // cloud
          ctx.fillStyle = D.alpha(c.ink, 0.35);
          [[-0.3, 0], [0, -6], [0.3, 0]].forEach(function (q) { D.circle(ctx, x + q[0] * colW, top - 12 + q[1], colW * 0.24, D.alpha(c.ink, 0.18)); });
          D.text(ctx, lbl[k], x, H - 10, { color: k ? c.s2 : c.s1, size: fs, weight: 700, align: 'center' });
        });
        ctx.fillStyle = D.alpha(c.success, 0.5); ctx.fillRect(xs[0] - colW / 2 - 8, bot, xs[1] - xs[0] + colW + 16, 5);
        for (var km = 0; km <= 2; km += 0.5) {
          var ky = top + (bot - top) * (1 - km / 2);
          D.line(ctx, xs[0] - colW / 2 - 6, ky, xs[0] - colW / 2, ky, c.muted, 1.5);
          D.text(ctx, M.fmt(km, km % 1 ? 1 : 0), xs[0] - colW / 2 - 8, ky, { color: c.muted, size: fs - 2, align: 'right' });
        }
        D.text(ctx, 'km', xs[0] - colW / 2 - 8, top - 14, { color: c.muted, size: fs - 2, align: 'right' });
        var dy = function (y) { return top + (bot - top) * y / SKY; };
        var dr = M.clamp(2 + b.r * 1000 * 1.2, 3, colW * 0.3), dcol = p.obj.indexOf('hail') >= 0 ? '#e0f2fe' : '#38bdf8';
        D.circle(ctx, xs[0], dy(st.A.y), dr, dcol, c.ink, 1.2);
        D.circle(ctx, xs[1], dy(st.ghost.y), dr, dcol, c.ink, 1.2);
        tag(speedTxt(st.A.v), xs[0] + colW / 2 + 4, Math.min(bot - 12, dy(st.A.y)), c.s1, 'left', fs - 1);
        tag(st.ghost.done ? 'hit at ' + M.fmt(st.ghost.v * 3.6, 0) + ' km/h' : speedTxt(st.ghost.v), xs[1] + colW / 2 + 4, Math.min(bot - 12, dy(st.ghost.y)), c.s2, 'left', fs - 1);
        D.text(ctx, OBJ[p.obj].name + ' falling 2 km', (xs[0] + xs[1]) / 2, 12, { color: c.muted, size: fs - 1, align: 'center', fit: W });
      }

      // ---------- force diagram on the right ----------
      var fx0 = narrow ? W * 0.54 : W * 0.48, fw = W - fx0 - 8, cx = fx0 + fw * 0.5, cy = H * 0.47;
      var R = Math.min(fw * 0.16, H * 0.09, 40), floats = b.W <= b.U;
      var Fd = drag(st.A.v, b.r, b.f), Lw = Math.min(H * 0.3, fw * 0.6), u = Lw / Math.max(b.W, b.U);
      D.text(ctx, 'Forces on the ' + (sky ? OBJ[p.obj].name : 'ball r') + ' (magnified)', cx, 12, { color: c.muted, size: fs - 1, align: 'center', fit: W });
      D.circle(ctx, cx, cy, R, sky ? D.alpha('#38bdf8', 0.7) : MAT[p.mat].col, c.ink, 1.5);
      D.arrow(ctx, cx, cy + R, cx, cy + R + Math.max(4, b.W * u), c.danger, 4, 11);
      tag('weight', cx + 8, cy + R + Math.max(4, b.W * u) - 6, c.danger, 'left');
      var ux = cx - R * 0.7, dx = cx + R * 0.7;
      if (b.U * u > 3) {
        D.arrow(ctx, ux, cy - R * 0.7, ux, cy - R * 0.7 - b.U * u, c.s3, 4, 11);
        tag('upthrust', ux - 6, cy - R * 0.7 - b.U * u, c.s3, 'right');
      } else if (sky) tag('upthrust (tiny)', ux - 6, cy - R - 8, c.s3, 'right', fs - 1);
      var dragLen = Fd * u, dTop = floats ? cy + R * 0.7 : cy - R * 0.7;
      if (dragLen > 2) {
        if (st.A.v >= 0) D.arrow(ctx, dx, dTop, dx, dTop - Math.min(dragLen, Lw * 1.2), c.s1, 4, 11);
        tag('drag', dx + 6, dTop - Math.min(dragLen, Lw * 1.2), c.s1, 'left');
      }
      // speed bar: now vs terminal
      var sw = fw * 0.8, sx = cx - sw / 2, sy = H - 46, frac = floats ? 0 : M.clamp(st.A.v / (vt || 1), 0, 1);
      D.roundRect(ctx, sx, sy, sw, 10, 5, D.alpha(c.ink, 0.12));
      D.roundRect(ctx, sx, sy, Math.max(10, sw * frac), 10, 5, frac > 0.98 ? c.success : c.s1);
      D.text(ctx, floats ? 'Floats up: upthrust > weight' : frac > 0.98 ? (narrow ? 'Terminal speed: forces balance' : 'Terminal speed reached: forces balance') : 'Speed ' + M.fmt(frac * 100, 0) + '% of terminal speed',
        cx, sy - 10, { color: frac > 0.98 ? c.success : c.muted, size: fs - 1, weight: 700, align: 'center', fit: W });
      if (!sky && !floats) {
        var Re = reynolds(b, vt);
        D.text(ctx, Re < 1 ? (narrow ? 'Stokes\' law works' : 'Slow, smooth flow: Stokes\' law works') : (narrow ? 'Eddies: Stokes\' law fails' : 'Fast flow, eddies behind the ball: Stokes\' law fails'), cx, sy + 24, { color: Re < 1 ? c.success : c.warning, size: fs - 1, align: 'center', fit: W });
      }
    }
  });
})();
