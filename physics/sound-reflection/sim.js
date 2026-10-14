/* =====================================================================
   Sound (Class 9) · Reflection of Sound — sim.js
   ---------------------------------------------------------------------
   Sound is treated as rays (directions in which the sound travels),
   which is fair when the surfaces are much larger than the wavelength.
   Each ray is traced in 2D: at a surface it reflects with
     angle of incidence = angle of reflection   (d' = d − 2(d·n)n)
   and keeps a fraction of its energy (hard surface 0.95, soft 0.2).
   Loudness at the listener = energy of the rays reaching the listener
   ÷ energy sent out, as a percentage.
   Scenes (world units are about 10 cm; y points down):
     tubes        NCERT activity: a ticking clock in one tube, a hard
                  board, and a listening tube; loud only when r = i
     board        a speaker at the focus of a concave sound board
                  (parabola) sends its backward sound to the audience
     megaphone    a cone turns sideways sound forwards by reflections
     stethoscope  sound bounces many times along a curved tube
   Pulses move about 3 world units per second on screen (very slow).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var WORLD = { w: 12, h: 7 }, SPEED = 3.2, PERIOD = 1.1, MAXB = 70;
  var cache = { key: '', data: null }, drag = false;

  function seg(ax, ay, bx, by, main) { return { a: { x: ax, y: ay }, b: { x: bx, y: by }, main: !!main }; }
  function rad(d) { return d * Math.PI / 180; }

  // ---------- scene geometry ----------
  function tubeGeom(p) {
    var O = { x: 6, y: 0.7 }, hw = 0.3, near = 2.6, far = 5.6;
    function tube(sign, ang) {
      var u = { x: sign * Math.sin(rad(ang)), y: Math.cos(rad(ang)) }, n = { x: u.y, y: -u.x };
      function P(t, s) { return { x: O.x + u.x * t + n.x * s, y: O.y + u.y * t + n.y * s }; }
      return { u: u, n: n, P: P };
    }
    return { O: O, hw: hw, near: near, far: far, t1: tube(-1, p.i), t2: tube(1, p.r) };
  }

  function build(p) {
    var segs = [], rays = [], recv, src, extra = {};
    var refl = p.refl;
    if (p.scene === 'tubes') {
      var g = tubeGeom(p);
      if (p.surface !== 'none') segs.push(seg(0.6, g.O.y, 11.4, g.O.y, true));
      [g.t1, g.t2].forEach(function (t) {
        [-1, 1].forEach(function (s) { var a = t.P(g.near, s * g.hw), b = t.P(g.far, s * g.hw); segs.push(seg(a.x, a.y, b.x, b.y, false)); });
      });
      var cap = g.t1.P(g.far, -g.hw), cap2 = g.t1.P(g.far, g.hw); segs.push(seg(cap.x, cap.y, cap2.x, cap2.y, false));
      var r1 = g.t2.P(g.far - 0.2, -g.hw), r2 = g.t2.P(g.far - 0.2, g.hw);
      recv = seg(r1.x, r1.y, r2.x, r2.y);
      src = g.t1.P(g.far - 0.25, 0);
      var back = { x: -g.t1.u.x, y: -g.t1.u.y };
      for (var k = 0; k < 41; k++) { var a = rad(-3 + 6 * k / 40); rays.push({ x: src.x, y: src.y, dx: back.x * Math.cos(a) - back.y * Math.sin(a), dy: back.x * Math.sin(a) + back.y * Math.cos(a) }); }
      extra.g = g;
    } else if (p.scene === 'board') {
      src = { x: 2.3, y: 3.5 };
      if (refl) { // parabola with its focus at the speaker: x = xv + y'^2 / 4f
        var f = 1.0, prev = null;
        for (var j = 0; j <= 36; j++) { var yy = -2.7 + 5.4 * j / 36, pt = { x: src.x - f + yy * yy / (4 * f), y: src.y + yy }; if (prev) segs.push(seg(prev.x, prev.y, pt.x, pt.y, true)); prev = pt; }
      }
      recv = seg(10.6, 2.2, 10.6, 4.8);
      for (var m = 0; m < 120; m++) { var th = 2 * Math.PI * (m + 0.5) / 120; rays.push({ x: src.x, y: src.y, dx: Math.cos(th), dy: Math.sin(th) }); }
    } else if (p.scene === 'megaphone') {
      src = { x: 1.55, y: 3.5 };
      if (refl) { segs.push(seg(1.5, 3.2, 5.6, 2.15, true)); segs.push(seg(1.5, 3.8, 5.6, 4.85, true)); segs.push(seg(1.5, 3.2, 1.5, 3.8, false)); }
      recv = seg(10.2, 2.6, 10.2, 4.4);
      for (var q = 0; q < 81; q++) { var b = rad(-80 + 160 * q / 80); rays.push({ x: src.x, y: src.y, dx: Math.cos(b), dy: Math.sin(b) }); }
    } else { // stethoscope: an upside-down U tube
      var cx = 6, cy = 2.6, Ri = 2.9, Ro = 3.5, legL = 6.3, legR = 5.6, N = 40;
      src = { x: cx - (Ri + Ro) / 2, y: legL - 0.15 };
      if (refl) {
        [Ri, Ro].forEach(function (R) {
          var pr = { x: cx - R, y: legL };
          for (var i = 0; i <= N; i++) { var ph = Math.PI + Math.PI * i / N, pt2 = { x: cx + R * Math.cos(ph), y: cy + R * Math.sin(ph) }; if (i === 0) { segs.push(seg(pr.x, pr.y, pt2.x, pt2.y, true)); } else segs.push(seg(pr.x, pr.y, pt2.x, pt2.y, true)); pr = pt2; }
          segs.push(seg(pr.x, pr.y, cx + R, legR, true));
        });
      }
      recv = seg(cx + Ri, legR - 0.05, cx + Ro, legR - 0.05);
      for (var z = 0; z < 61; z++) { var c2 = rad(-90 - 45 + 90 * z / 60); rays.push({ x: src.x, y: src.y, dx: Math.cos(c2), dy: Math.sin(c2) }); }
      extra.st = { cx: cx, cy: cy, Ri: Ri, Ro: Ro, legL: legL, legR: legR };
    }
    return { segs: segs, rays: rays, recv: recv, src: src, extra: extra };
  }

  function hit(px, py, dx, dy, s) { // ray–segment intersection → distance along the ray, or Infinity
    var ex = s.b.x - s.a.x, ey = s.b.y - s.a.y, den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) return Infinity;
    var wx = s.a.x - px, wy = s.a.y - py, t = (wx * ey - wy * ex) / den, u = (wx * dy - wy * dx) / den;
    return t > 1e-6 && u >= 0 && u <= 1 ? t : Infinity;
  }

  function trace(p) {
    var key = [p.scene, p.i, p.r, p.refl, p.surface].join('|');
    if (cache.key === key) return cache.data;
    var sc = build(p), keep = p.surface === 'soft' ? 0.2 : 0.95, total = 0, got = 0, bounces = 0, arrived = 0;
    sc.paths = sc.rays.map(function (r) {
      var pts = [{ x: r.x, y: r.y, e: 1 }], x = r.x, y = r.y, dx = r.dx, dy = r.dy, e = 1, len = 0, done = false, nb = 0, last = null;
      total += 1;
      for (var b = 0; b <= MAXB && !done; b++) {
        var best = Infinity, bs = null;
        sc.segs.forEach(function (s) { if (s === last) return; var t = hit(x, y, dx, dy, s); if (t < best) { best = t; bs = s; } });
        var tr = hit(x, y, dx, dy, sc.recv);
        if (tr < best) { x += dx * tr; y += dy * tr; len += tr; pts.push({ x: x, y: y, e: e }); got += e; arrived++; bounces += nb; return { pts: pts, len: len, hit: true, e: e }; }
        if (!bs) { var far = 16; x += dx * far; y += dy * far; len += far; pts.push({ x: x, y: y, e: e }); done = true; break; }
        x += dx * best; y += dy * best; len += best;
        var ex = bs.b.x - bs.a.x, ey = bs.b.y - bs.a.y, l = Math.hypot(ex, ey), nx = -ey / l, ny = ex / l, dn = dx * nx + dy * ny;
        dx -= 2 * dn * nx; dy -= 2 * dn * ny;
        if (bs.main) { e *= keep; nb++; } else e *= 0.95;
        last = bs; pts.push({ x: x, y: y, e: e });
        if (e < 0.004) { done = true; }
      }
      return { pts: pts, len: len, hit: false, e: e };
    });
    sc.loud = 100 * got / total;
    sc.avgB = arrived ? bounces / arrived : 0;
    cache.key = key; cache.data = sc;
    return sc;
  }

  function view(W, H) {
    var pad = 8, s = Math.min((W - 2 * pad) / WORLD.w, (H - 2 * pad) / WORLD.h);
    return { s: s, ox: (W - WORLD.w * s) / 2, oy: (H - WORLD.h * s) / 2 };
  }

  SimLab.createSim({
    ariaLabel: 'Sound rays reflect from a hard board between two tubes, from a curved sound board, inside a megaphone and inside a stethoscope tube; the loudness at the listener is shown',
    mobileAspect: '1 / 1',
    playLabel: 'Send sound',
    params: [
      { id: 'scene', label: 'Experiment', type: 'select', value: 'tubes', options: [
        { value: 'tubes', label: 'Two tubes and a board (i = r)' }, { value: 'board', label: 'Curved sound board on a stage' },
        { value: 'megaphone', label: 'Megaphone' }, { value: 'stethoscope', label: 'Stethoscope' }] },
      { id: 'i', label: 'Angle of incidence i (clock tube)', min: 15, max: 70, step: 1, value: 40, unit: '°', presets: [{ label: '30°', value: 30 }, { label: '45°', value: 45 }, { label: '60°', value: 60 }] },
      { id: 'r', label: 'Angle of the listening tube', min: 15, max: 70, step: 1, value: 25, unit: '°', help: 'Two tubes only. You can also drag the right-hand tube.' },
      { id: 'surface', label: 'Reflecting surface', type: 'select', value: 'hard', options: [
        { value: 'hard', label: 'Hard and smooth (board, metal)' }, { value: 'soft', label: 'Soft (cloth, foam, curtain)' }, { value: 'none', label: 'No board (two tubes only)' }] },
      { id: 'refl', label: 'Use the sound board, megaphone or stethoscope tube', type: 'toggle', value: true },
      { id: 'rays', label: 'Show sound rays', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'loud', label: 'Sound reaching the listener', short: 'At listener', unit: '%', digits: 0, key: true },
      { id: 'chk', label: 'What happens', short: 'Result', key: true },
      { id: 'nb', label: 'Reflections per ray reaching the listener', short: 'Reflections', key: true },
      { id: 'ir', label: 'Angle of incidence / reflection' }
    ],
    onParam: function () { return true; },
    reset: function (sim) { sim.state = {}; },
    update: function () {},
    status: function (sim) { return sim.running ? 'Sound pulses shown very slowly' : 'Paused'; },
    readout: function (sim) {
      var p = sim.p, sc = trace(p), o = { loud: sc.loud, nb: M.fmt(sc.avgB, 1) };
      if (p.scene === 'tubes') {
        o.ir = p.surface === 'none' ? 'no board' : 'i = ' + p.i + '°, tube at ' + p.r + '°';
        o.chk = p.surface === 'none' ? 'no reflection' : p.surface === 'soft' ? 'soft: absorbed' : sc.loud >= 55 ? (p.r === p.i ? 'r = i: loudest' : 'loud') : sc.loud >= 30 ? 'fainter' : 'hardly heard';
      } else {
        o.ir = 'i = r at every bounce';
        o.chk = !p.refl ? 'no reflector' : p.surface === 'soft' ? 'soft: absorbed' : 'reflected to listener';
      }
      return o;
    },
    pointer: {
      down: function (sim, x, y) {
        if (sim.p.scene !== 'tubes') return false;
        var v = view(sim.width, sim.height), g = tubeGeom(sim.p), e = g.t2.P(3.2, 0);
        if (Math.hypot(x - (v.ox + e.x * v.s), y - (v.oy + e.y * v.s)) > Math.max(44, 2.2 * v.s)) return false;
        drag = true; return true;
      },
      move: function (sim, x, y) {
        if (!drag) return;
        var v = view(sim.width, sim.height), O = tubeGeom(sim.p).O;
        var ang = Math.atan2(x - (v.ox + O.x * v.s), y - (v.oy + O.y * v.s)) * 180 / Math.PI;
        sim.setParam('r', Math.round(M.clamp(ang, 15, 70)), true);
      },
      up: function () { drag = false; },
      hover: function (sim, x, y) {
        if (sim.p.scene !== 'tubes') return false;
        var v = view(sim.width, sim.height), e = tubeGeom(sim.p).t2.P(3.2, 0);
        return Math.hypot(x - (v.ox + e.x * v.s), y - (v.oy + e.y * v.s)) < Math.max(44, 2.2 * v.s);
      }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, sc = trace(p);
      var nar = W < 560, fs = nar ? 10 : 12, v = view(W, H);
      function X(x) { return v.ox + x * v.s; } function Y(y) { return v.oy + y * v.s; }
      D.clear(ctx, W, H, c.bg);
      var hard = c.light ? '#78716c' : '#a8a29e', soft = '#c084fc', mainCol = p.surface === 'soft' ? soft : hard;
      // reflectors
      ctx.save(); ctx.lineCap = 'round';
      sc.segs.forEach(function (s) {
        ctx.strokeStyle = s.main ? mainCol : (c.light ? '#94a3b8' : '#64748b');
        ctx.lineWidth = s.main ? (p.scene === 'tubes' ? 8 : 4) : 3;
        if (s.main && p.surface === 'soft') ctx.setLineDash([3, 3]); else ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(X(s.a.x), Y(s.a.y)); ctx.lineTo(X(s.b.x), Y(s.b.y)); ctx.stroke();
      });
      ctx.restore();
      // rays
      if (p.rays) {
        sc.paths.forEach(function (pa) {
          ctx.save(); ctx.lineWidth = 1;
          for (var k = 1; k < pa.pts.length; k++) {
            ctx.strokeStyle = D.alpha(pa.hit ? c.accent : c.muted, (pa.hit ? 0.55 : 0.18) * Math.max(0.15, pa.pts[k - 1].e));
            ctx.beginPath(); ctx.moveTo(X(pa.pts[k - 1].x), Y(pa.pts[k - 1].y)); ctx.lineTo(X(pa.pts[k].x), Y(pa.pts[k].y)); ctx.stroke();
          }
          ctx.restore();
        });
      }
      // moving pulses
      if (sim.time > 0) {
        var kMax = Math.floor(sim.time / PERIOD);
        sc.paths.forEach(function (pa) {
          for (var k = Math.max(0, kMax - 6); k <= kMax; k++) {
            var sAlong = SPEED * (sim.time - k * PERIOD);
            if (sAlong < 0 || sAlong > pa.len) continue;
            var acc = 0;
            for (var j = 1; j < pa.pts.length; j++) {
              var a = pa.pts[j - 1], b = pa.pts[j], L = Math.hypot(b.x - a.x, b.y - a.y);
              if (acc + L >= sAlong) { var t = (sAlong - acc) / L; D.circle(ctx, X(a.x + (b.x - a.x) * t), Y(a.y + (b.y - a.y) * t), 2.2, D.alpha(pa.hit ? c.accent : c.ink, Math.max(0.12, a.e) * (pa.hit ? 1 : 0.55))); break; }
              acc += L;
            }
          }
        });
      }
      // receiver
      var r = sc.recv, rx = (X(r.a.x) + X(r.b.x)) / 2, ry = (Y(r.a.y) + Y(r.b.y)) / 2, glow = M.clamp(sc.loud / 60, 0, 1);
      D.line(ctx, X(r.a.x), Y(r.a.y), X(r.b.x), Y(r.b.y), c.success, 3);
      D.circle(ctx, rx, ry, 9 + 8 * glow, D.alpha(c.success, 0.15 + 0.4 * glow));
      D.text(ctx, '👂', rx, ry, { size: nar ? 16 : 20, align: 'center' });
      sceneLabels(sim, ctx, c, p, sc, X, Y, v, fs, nar, W, H);
      // loudness meter
      var mw = nar ? 92 : 130, mx = W - mw - 8, my = H - (nar ? 22 : 26);
      D.roundRect(ctx, mx, my, mw, nar ? 14 : 16, 4, D.alpha(c.ink, 0.08), D.alpha(c.ink, 0.25));
      D.roundRect(ctx, mx, my, Math.max(2, mw * M.clamp(sc.loud / 100, 0, 1)), nar ? 14 : 16, 4, c.success);
      D.text(ctx, 'at the ear: ' + M.fmt(sc.loud, 0) + ' %', mx - 6, my + (nar ? 7 : 8), { color: c.ink, size: fs, weight: 700, align: 'right', bg: D.alpha(c.bg, 0.8), pad: 2 });
    }
  });

  function sceneLabels(sim, ctx, c, p, sc, X, Y, v, fs, nar, W, H) {
    var s = sc.src;
    if (p.scene === 'tubes') {
      var g = sc.extra.g, O = g.O;
      D.text(ctx, '⏰', X(s.x), Y(s.y), { size: nar ? 15 : 20, align: 'center' });
      if (p.surface !== 'none') {
        D.text(ctx, p.surface === 'soft' ? 'soft cushion' : 'hard board', X(1.0), Y(O.y) - 12, { color: c.ink, size: fs, weight: 700 });
        D.line(ctx, X(O.x), Y(O.y), X(O.x), Y(O.y + 3.6), c.warning, 1.5, [5, 4]);
        D.text(ctx, 'normal', X(O.x), Y(O.y + 3.6) + 8, { color: c.warning, size: fs - 1, align: 'center' });
        var R = Math.max(26, 1.5 * v.s);
        ctx.save(); ctx.strokeStyle = c.accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X(O.x), Y(O.y), R, Math.PI / 2, Math.PI / 2 + rad(p.i)); ctx.stroke();
        ctx.strokeStyle = c.success; ctx.beginPath(); ctx.arc(X(O.x), Y(O.y), R * 1.12, Math.PI / 2 - rad(p.r), Math.PI / 2); ctx.stroke(); ctx.restore();
        var li = Math.PI / 2 + rad(p.i / 2), lr = Math.PI / 2 - rad(p.r / 2);
        D.text(ctx, 'i = ' + p.i + '°', X(O.x) + Math.cos(li) * (R + 18), Y(O.y) + Math.sin(li) * (R + 12), { color: c.accent, size: fs, weight: 700, align: 'right', bg: D.alpha(c.bg, 0.8), pad: 2 });
        D.text(ctx, 'r = ' + p.r + '°', X(O.x) + Math.cos(lr) * (R * 1.12 + 18), Y(O.y) + Math.sin(lr) * (R * 1.12 + 12), { color: c.success, size: fs, weight: 700, bg: D.alpha(c.bg, 0.8), pad: 2 });
      }
      var e = g.t2.P(3.2, 0);
      if (!sim.time) D.text(ctx, '↔ drag', X(e.x) + 14, Y(e.y), { color: c.muted, size: fs - 1, fit: W });
      D.text(ctx, 'clock tube', X(g.t1.P(2.6, 0).x) - 16, Y(g.t1.P(2.6, 0).y), { color: c.muted, size: fs - 1, align: 'right', fit: W });
    } else if (p.scene === 'board') {
      D.roundRect(ctx, X(s.x) - 8, Y(s.y) - 11, 14, 22, 3, c.light ? '#334155' : '#1e293b', c.ink, 1.5);
      D.text(ctx, '🔊', X(s.x) + 2, Y(s.y) - 24, { size: nar ? 13 : 16, align: 'center' });
      D.text(ctx, 'audience', X(10.6), Y(2.2) - 12, { color: c.ink, size: fs, weight: 700, align: 'center', fit: W });
      if (p.refl) D.text(ctx, 'curved sound board', X(0.4), Y(0.5), { color: c.ink, size: fs, weight: 700 });
      D.text(ctx, 'stage', X(s.x), Y(6.5), { color: c.muted, size: fs - 1, align: 'center' });
    } else if (p.scene === 'megaphone') {
      D.text(ctx, '🗣️', X(s.x) - 14, Y(s.y), { size: nar ? 18 : 24, align: 'center' });
      D.text(ctx, 'listener', X(10.2), Y(2.6) - 12, { color: c.muted, size: fs - 1, align: 'right', fit: W });
      if (p.refl) D.text(ctx, 'megaphone', X(3.6), Y(2.0) - 6, { color: c.ink, size: fs, weight: 700, align: 'center' });
    } else {
      var st = sc.extra.st;
      D.text(ctx, '❤️', X(s.x), Y(st.legL) + 12, { size: nar ? 14 : 18, align: 'center' });
      D.text(ctx, 'heartbeat', X(s.x), Y(st.legL) + 26, { color: c.muted, size: fs - 1, align: 'center' });
      if (p.refl) D.text(ctx, 'stethoscope tube', X(st.cx), Y(st.cy - st.Ro) - 10, { color: c.ink, size: fs, weight: 700, align: 'center' });
    }
  }
})();
