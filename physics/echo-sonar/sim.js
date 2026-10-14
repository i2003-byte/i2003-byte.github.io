/* =====================================================================
   Sound (Class 9) · Echo and SONAR — sim.js
   ---------------------------------------------------------------------
   A sound pulse travels to a reflecting surface and back:
     echo time t = 2d / v      →      d = v t / 2
   Speed of sound in air: v = 331 + 0.6 T (m/s, T in °C).
   Sea water: v = 1531 m/s.
   We keep the sensation of a sound for about 0.1 s, so a separate
   (distinct) echo needs t ≥ 0.1 s → d ≥ v × 0.1 / 2 (17.2 m at 22 °C).
   Cliff and well: the pulse is drawn in slow motion (the round trip
   always takes about 2.5 s on screen); the optional clap sound and its
   echo play at the real delay. The reflected wave is drawn as coming
   from the mirror image of the person behind the cliff.
   Ship: the sonar pulse moves at its real speed (1 s on screen =
   1 s real); the ship glides between pings much faster than a real
   ship, and the sea bed profile is made up but realistic in size
   (continental shelf ≈ 100 m, deep sea ≈ 3000 m, a seamount).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var V_SEA = 1531, PINGS = 20, GLIDE = 0.35, PERSIST = 0.1;
  var timers = [];

  function vAir(T) { return 331 + 0.6 * T; }
  function smooth(a, b, x) { var t = M.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function seabed(u) { // depth in metres at fraction u of the 30 km track
    var deep = smooth(0.22, 0.55, u);
    return 90 + 2900 * deep - 1700 * Math.exp(-Math.pow((u - 0.78) / 0.07, 2)) + (15 + 45 * deep) * Math.sin(u * 37);
  }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  SimLab.createSim({
    ariaLabel: 'A sound pulse travels to a cliff, down a well or from a ship to the sea bed and returns as an echo; the echo time gives the distance',
    audio: true,
    mobileAspect: '4 / 5',
    playLabel: 'Send the sound',
    params: [
      { id: 'scene', label: 'Where', type: 'select', value: 'cliff', options: [
        { value: 'cliff', label: 'Clap in front of a cliff' }, { value: 'well', label: 'Shout into a well' }, { value: 'ship', label: 'Ship SONAR maps the sea bed' }] },
      { id: 'dist', label: 'Distance to the cliff or the water in the well', min: 2, max: 200, step: 1, value: 34, unit: 'm',
        presets: [{ label: '8 m', value: 8 }, { label: '17 m', value: 17 }, { label: '34 m', value: 34 }, { label: '100 m', value: 100 }],
        help: 'Used for the cliff and the well. The ship finds the depth by itself.' },
      { id: 'temp', label: 'Air temperature', min: 0, max: 45, step: 1, value: 22, unit: '°C', help: 'Sound is a little faster in warm air: v = 331 + 0.6 T m/s.' },
      { id: 'hide', label: 'Hide the real sea bed (map it blind)', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 't', label: 'Echo time t', short: 'Echo time', key: true },
      { id: 'd', label: 'Distance d = v × t ÷ 2', short: 'Distance', key: true },
      { id: 'echo', label: 'What you hear', short: 'Echo', key: true },
      { id: 'v', label: 'Speed of sound v' },
      { id: 'dmin', label: 'Least distance for a distinct echo' },
      { id: 'slow', label: 'Motion shown' }
    ],

    reset: function (sim) {
      clearTimers();
      var p = sim.p, v = p.scene === 'ship' ? V_SEA : vAir(p.temp), tE = 2 * p.dist / v;
      sim.state = { v: v, tE: tE, slow: Math.max(1, 2.5 / tE), started: false, done: false,
        ping: 0, phase: 'ping', pt: 0, depths: [] };
    },
    onRunChange: function (sim, on) {
      var s = sim.state;
      if (!on || s.started || sim.p.scene === 'ship') return;
      s.started = true;
      if (!A.enabled) return;
      A.noise(0.05, 0.5, 2500);                                   // the clap…
      var g = M.clamp(0.45 * 30 / (30 + sim.p.dist), 0.15, 0.4);
      timers.push(setTimeout(function () { A.noise(0.05, g, 1800); }, s.tE * 1000)); // …and its echo, at the real delay
    },
    onParam: function (sim, id) { return id === 'hide'; },
    finished: function (sim) {
      var s = sim.state;
      if (sim.p.scene === 'ship') return s.ping >= PINGS;
      return sim.time / s.slow >= Math.max(s.tE * 1.15, s.tE + PERSIST * 0.6);
    },
    update: function (sim, dt) {
      var s = sim.state;
      if (sim.p.scene !== 'ship') return;
      s.pt += dt;
      if (s.phase === 'ping') {
        var u = (s.ping + 0.5) / PINGS, d = seabed(u), t = 2 * d / V_SEA;
        if (s.pt >= t) { s.depths.push({ u: u, t: t, d: d }); s.ping++; s.phase = 'glide'; s.pt = 0;
          if (A.enabled) A.tone(1800, { duration: 0.12, gain: 0.12 }); }
      } else if (s.pt >= GLIDE) { s.phase = 'ping'; s.pt = 0; if (A.enabled) A.tone(2400, { duration: 0.08, gain: 0.1 }); }
    },
    status: function (sim) {
      var s = sim.state;
      if (sim.p.scene === 'ship') return s.ping >= PINGS ? 'Sea bed mapped: ' + PINGS + ' pings' : sim.running ? 'Pinging… sound at real speed' : 'Ready';
      return sim.running ? 'Slow motion: ' + M.fmt(s.slow, 0) + '× slower than real' : sim.time ? 'Echo heard' : 'Ready to clap';
    },
    readout: function (sim) {
      var s = sim.state, p = sim.p, ship = p.scene === 'ship';
      var o = { v: M.fmt(s.v, ship ? 0 : 1) + ' m/s' + (ship ? ' (sea water)' : ''), dmin: ship ? '—' : M.fmt(s.v * PERSIST / 2, 1) + ' m',
        slow: ship ? 'sound at real speed' : M.fmt(s.slow, 0) + '× slower than real' };
      if (ship) {
        var last = s.depths[s.depths.length - 1];
        o.t = last ? M.fmt(last.t, 2) + ' s' : '—';
        o.d = last ? M.fmt(V_SEA * last.t / 2, 0) + ' m deep' : '—';
        o.echo = 'ping ' + Math.min(PINGS, s.ping + (s.ping < PINGS && sim.time ? 1 : 0)) + ' of ' + PINGS;
        return o;
      }
      var tr = sim.time / s.slow, heard = tr >= s.tE;
      o.t = heard ? M.fmt(s.tE, s.tE < 0.1 ? 3 : 2) + ' s' : sim.time ? M.fmt(tr, 3) + ' s…' : '—';
      o.d = heard ? M.fmt(s.v * s.tE / 2, 1) + ' m' : '—';
      o.echo = s.tE < PERSIST ? 'merges with clap' : 'distinct echo';
      return o;
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state;
      var nar = W < 560, fs = nar ? 10 : 12;
      D.clear(ctx, W, H, c.bg);
      if (p.scene === 'ship') return drawShip(sim, ctx, W, H, c, s, nar, fs);
      var tr = sim.time / s.slow, stripH = nar ? 66 : 78;
      var sceneH = H - stripH - 8;
      if (p.scene === 'cliff') drawCliff(sim, ctx, W, sceneH, c, s, tr, nar, fs);
      else drawWell(sim, ctx, W, sceneH, c, s, tr, nar, fs);
      drawHear(ctx, 8, H - stripH, W - 16, stripH - 6, c, s, tr, fs);
    }
  });

  function person(ctx, x, y, h, c, mouth) { // y = feet
    var col = c.light ? '#334155' : '#e2e8f0', r = h * 0.12;
    D.circle(ctx, x, y - h + r, r, col);
    D.line(ctx, x, y - h + 2 * r, x, y - h * 0.42, col, 2.5);
    D.line(ctx, x, y - h * 0.42, x - h * 0.15, y, col, 2.5); D.line(ctx, x, y - h * 0.42, x + h * 0.15, y, col, 2.5);
    D.line(ctx, x, y - h * 0.72, x + h * 0.22, y - h * 0.8, col, 2.5);
    D.line(ctx, x, y - h * 0.72, x + h * 0.2, y - h * 0.66, col, 2.5);
    if (mouth) D.circle(ctx, x + r * 0.8, y - h + r * 1.2, 1.6, c.danger);
  }

  // rings of a short pulse: front at radius r (pixels), a few rings behind it
  function rings(ctx, cx, cy, r, col, fade) {
    for (var k = 0; k < 4; k++) {
      var rr = r - k * 5; if (rr <= 0) continue;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = D.alpha(col, (0.95 - k * 0.22) * fade); ctx.lineWidth = k ? 1.5 : 2.5; ctx.stroke();
    }
  }

  function drawCliff(sim, ctx, W, H, c, s, tr, nar, fs) {
    var ground = H - (nar ? 34 : 42), xp = nar ? 34 : 60, xc = W - (nar ? 46 : 80), ppm = (xc - xp) / sim.p.dist;
    var my = ground - (nar ? 40 : 52), mx = xp + 4;
    // sky, ground, cliff
    ctx.fillStyle = D.alpha(c.s1, 0.06); ctx.fillRect(0, 0, W, ground);
    ctx.fillStyle = c.light ? '#a3b18a' : '#3f4a2f'; ctx.fillRect(0, ground, W, H - ground);
    ctx.save(); ctx.beginPath(); ctx.moveTo(xc, ground);
    for (var yy = ground; yy >= 6; yy -= 14) ctx.lineTo(xc + 5 * Math.sin(yy * 0.31) + 3, yy);
    ctx.lineTo(W, 6); ctx.lineTo(W, ground); ctx.closePath();
    ctx.fillStyle = c.light ? '#a8a29e' : '#57534e'; ctx.fill(); ctx.restore();
    D.text(ctx, 'cliff', (xc + W) / 2 + 2, 18, { color: c.ink, size: fs, weight: 700, align: 'center' });
    person(ctx, xp, ground, nar ? 46 : 60, c, true);
    // ruler with the 'least distance' mark
    var ry = ground + (nar ? 14 : 18);
    D.arrow(ctx, (xp + xc) / 2, ry, xp, ry, c.ink, 1.4, 6); D.arrow(ctx, (xp + xc) / 2, ry, xc, ry, c.ink, 1.4, 6);
    D.text(ctx, 'd = ' + sim.p.dist + ' m', (xp + xc) / 2, ry, { color: c.ink, size: fs, weight: 700, align: 'center', bg: c.light ? '#a3b18a' : '#3f4a2f', pad: 3 });
    var dmin = s.v * PERSIST / 2;
    if (dmin < sim.p.dist) {
      var xm = xp + dmin * ppm;
      D.line(ctx, xm, ground - 26, xm, ground, c.warning, 2, [4, 3]);
      D.text(ctx, M.fmt(dmin, 1) + ' m', xm, ground - 34, { color: c.warning, size: fs - 1, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.7), pad: 2 });
    }
    // the pulse: outgoing rings, and reflected rings from the image behind the cliff
    if (sim.time > 0 && tr < s.tE * 1.3) {
      var r = s.v * tr * ppm, fade = tr > s.tE ? Math.max(0, 1 - (tr - s.tE) / (s.tE * 0.3)) : 1;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, xc + 3, ground); ctx.clip();
      rings(ctx, mx, my, r, c.accent, tr > s.tE ? fade * 0.5 : 1);
      if (r > xc - mx) rings(ctx, 2 * xc - mx, my, r, c.danger, fade);
      ctx.restore();
      if (r > xc - mx && tr < s.tE) D.arrow(ctx, xc - 8, my - 4, xc - 40, my - 4, c.danger, 2, 7);
      else if (tr < s.tE) D.arrow(ctx, mx + r - 34, my - 4, mx + r - 4, my - 4, c.accent, 2, 7);
    }
    if (!nar || W > 330) {
      D.text(ctx, 'clap', mx + 10, my - 24, { color: c.accent, size: fs, weight: 700 });
      if (tr >= s.tE) D.text(ctx, s.tE < PERSIST ? 'echo too soon!' : 'echo!', mx + 10, my - 24 - fs - 6, { color: c.danger, size: fs, weight: 700 });
    }
  }

  function drawWell(sim, ctx, W, H, c, s, tr, nar, fs) {
    var top = nar ? 70 : 84, bottom = H - 16, cx = W / 2, ww = nar ? 46 : 60, ppm = (bottom - top) / sim.p.dist;
    var soil = c.light ? '#c8a97e' : '#4a3b2a';
    ctx.fillStyle = D.alpha(c.s1, 0.06); ctx.fillRect(0, 0, W, top);
    ctx.fillStyle = soil; ctx.fillRect(0, top, W, H - top);
    ctx.fillStyle = c.bg; ctx.fillRect(cx - ww / 2, top, ww, bottom - top);
    ctx.fillStyle = c.light ? '#60a5fa' : '#1d4ed8'; ctx.fillRect(cx - ww / 2, bottom - 8, ww, 8);
    // brick rim
    D.roundRect(ctx, cx - ww / 2 - 12, top - 18, 12, 18, 2, '#b45309'); D.roundRect(ctx, cx + ww / 2, top - 18, 12, 18, 2, '#b45309');
    person(ctx, cx - ww / 2 - 30, top - 18, nar ? 44 : 54, c, true);
    D.text(ctx, 'water', cx + ww / 2 + 6, bottom - 6, { color: c.ink, size: fs - 1, weight: 600 });
    // depth arrow
    var ax = cx + ww / 2 + (nar ? 34 : 50);
    D.arrow(ctx, ax, (top + bottom) / 2, ax, top, c.ink, 1.4, 6); D.arrow(ctx, ax, (top + bottom) / 2, ax, bottom - 8, c.ink, 1.4, 6);
    D.text(ctx, 'd = ' + sim.p.dist + ' m', ax, (top + bottom) / 2, { color: c.ink, size: fs, weight: 700, align: 'center', bg: soil, pad: 3, fit: W });
    var dmin = s.v * PERSIST / 2;
    if (dmin < sim.p.dist) {
      var ym = top + dmin * ppm;
      D.line(ctx, cx - ww / 2, ym, cx + ww / 2, ym, c.warning, 2, [4, 3]);
      D.text(ctx, M.fmt(dmin, 1) + ' m', cx - ww / 2 - 6, ym, { color: c.warning, size: fs - 1, weight: 700, align: 'right', bg: soil, pad: 2 });
    }
    if (sim.time > 0 && tr < s.tE * 1.3) {
      var down = s.v * tr * ppm, depth = bottom - 8 - top, yF, col, up = false;
      if (down <= depth) { yF = top + down; col = c.accent; } else { yF = bottom - 8 - (down - depth); col = c.danger; up = true; }
      var fade = tr > s.tE ? Math.max(0, 1 - (tr - s.tE) / (s.tE * 0.3)) : 1;
      if (yF < top) { yF = top; }
      for (var k = 0; k < 4; k++) {
        var yk = yF + (up ? k : -k) * 5;
        if (yk < top || yk > bottom - 8) continue;
        D.line(ctx, cx - ww / 2 + 3, yk, cx + ww / 2 - 3, yk, D.alpha(col, (0.95 - k * 0.22) * fade), k ? 1.5 : 2.5);
      }
      if (tr < s.tE) D.arrow(ctx, cx, yF + (up ? 6 : -30), cx, yF + (up ? 30 : -6), col, 2, 7);
    }
    D.text(ctx, 'shout', cx - ww / 2 - 18, top - (nar ? 54 : 66), { color: c.accent, size: fs, weight: 700, fit: W });
    if (tr >= s.tE) D.text(ctx, s.tE < PERSIST ? 'echo too soon!' : 'echo!', cx + ww / 2 + 8, top - 30, { color: c.danger, size: fs, weight: 700, fit: W });
  }

  // "what you hear" strip: clap at t = 0 and echo at t = tE, each felt for 0.1 s
  function drawHear(ctx, x, y, w, h, c, s, tr, fs) {
    D.roundRect(ctx, x, y, w, h, 6, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.15));
    var tMax = Math.max(0.3, s.tE * 1.3), lx = x + 8, lw = w - 16, by = y + h * 0.52, bh = h * 0.24;
    function X(t) { return lx + t / tMax * lw; }
    D.text(ctx, 'What you hear (real time)', x + 8, y + 10, { color: c.muted, size: fs - 1, weight: 600 });
    D.line(ctx, lx, by + bh + 4, lx + lw, by + bh + 4, c.axis, 1);
    var step = D.niceStep(tMax, 4);
    for (var t = 0; t <= tMax + 1e-9; t += step) {
      D.line(ctx, X(t), by + bh + 2, X(t), by + bh + 6, c.axis, 1);
      D.text(ctx, M.fmt(t, step < 0.1 ? 2 : 1) + ' s', X(t), by + bh + 13, { color: c.muted, size: fs - 2, align: t ? 'center' : 'left' });
    }
    ctx.fillStyle = D.alpha(c.accent, 0.22); ctx.fillRect(X(0), by, X(PERSIST) - X(0), bh);
    ctx.fillStyle = c.accent; ctx.fillRect(X(0), by, Math.max(3, X(0.02) - X(0)), bh);
    var heard = tr >= s.tE;
    if (heard) {
      ctx.fillStyle = D.alpha(c.danger, 0.22); ctx.fillRect(X(s.tE), by, X(s.tE + PERSIST) - X(s.tE), bh);
      ctx.fillStyle = c.danger; ctx.fillRect(X(s.tE), by, Math.max(3, X(s.tE + 0.02) - X(s.tE)), bh);
      var msg = s.tE < PERSIST ? 'echo arrives before the clap fades: heard as one longer sound' : 'echo arrives after the clap has faded: a distinct echo';
      D.text(ctx, msg, x + w - 8, y + 10, { color: s.tE < PERSIST ? c.warning : c.success, size: fs - 1, weight: 700, align: 'right', fit: x + w });
    }
    if (tr > 0 && tr < tMax) D.line(ctx, X(tr), by - 4, X(tr), by + bh + 4, c.ink, 1.5);
  }

  function drawShip(sim, ctx, W, H, c, s, nar, fs) {
    var sea = nar ? 54 : 66, bot = H - 22, x0 = 10, x1 = W - (nar ? 34 : 46), DMAX = 3400, ppm = (bot - sea) / DMAX;
    function X(u) { return x0 + u * (x1 - x0); }
    function Y(d) { return sea + d * ppm; }
    // water and the real sea bed
    var g = ctx.createLinearGradient(0, sea, 0, bot);
    g.addColorStop(0, c.light ? '#bfdbfe' : '#0c4a6e'); g.addColorStop(1, c.light ? '#1e3a8a' : '#020617');
    ctx.fillStyle = g; ctx.fillRect(0, sea, W, H - sea);
    if (!sim.p.hide || s.ping >= PINGS) {
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, H);
      for (var i = 0; i <= 100; i++) ctx.lineTo(X(i / 100), Y(seabed(i / 100)));
      ctx.lineTo(W, Y(seabed(1))); ctx.lineTo(W, H); ctx.closePath();
      ctx.fillStyle = D.alpha(c.light ? '#a16207' : '#78716c', sim.p.hide ? 0.35 : 0.6); ctx.fill(); ctx.restore();
    }
    // depth scale
    for (var d = 0; d <= 3000; d += 1000) {
      D.line(ctx, x1 + 4, Y(d), x1 + 9, Y(d), c.axis, 1);
      D.text(ctx, d ? (d / 1000) + ' km' : '0', x1 + 11, Y(d), { color: c.light && d > 1500 ? '#e2e8f0' : c.muted, size: fs - 2 });
    }
    // measured profile
    if (s.depths.length) {
      ctx.save(); ctx.strokeStyle = c.warning; ctx.lineWidth = 2; ctx.beginPath();
      s.depths.forEach(function (q, k) { var Xq = X(q.u), Yq = Y(V_SEA * q.t / 2); if (k) ctx.lineTo(Xq, Yq); else ctx.moveTo(Xq, Yq); });
      ctx.stroke(); ctx.restore();
      s.depths.forEach(function (q) { D.circle(ctx, X(q.u), Y(V_SEA * q.t / 2), 3.2, c.warning, c.bg, 1); });
    }
    // ship position
    var u;
    if (s.ping >= PINGS) u = (PINGS - 0.5) / PINGS;
    else if (s.phase === 'glide') u = (s.ping - 0.5 + s.pt / GLIDE) / PINGS;
    else u = (s.ping + 0.5) / PINGS;
    var sx = X(u);
    ctx.fillStyle = D.alpha(c.s1, 0.06); ctx.fillRect(0, 0, W, sea);
    ctx.save(); ctx.fillStyle = c.light ? '#334155' : '#cbd5e1'; ctx.beginPath();
    ctx.moveTo(sx - 26, sea - 12); ctx.lineTo(sx + 26, sea - 12); ctx.lineTo(sx + 18, sea + 2); ctx.lineTo(sx - 18, sea + 2); ctx.closePath(); ctx.fill();
    ctx.fillRect(sx - 10, sea - 24, 16, 12); ctx.restore();
    D.circle(ctx, sx, sea + 3, 3, c.danger);
    D.text(ctx, 'ship with SONAR', W / 2, 12, { color: c.ink, size: fs, weight: 700, align: 'center', fit: W });
    // the pulse in the water (real speed)
    if (s.phase === 'ping' && s.ping < PINGS && sim.time > 0) {
      var dd = seabed((s.ping + 0.5) / PINGS), z = V_SEA * s.pt, down = z <= dd, yz = Y(down ? z : 2 * dd - z), col = down ? c.accent : c.danger;
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(sx, down ? Y(z) - 14 : Y(2 * dd - z) + 14, 14, down ? 0.25 * Math.PI : 1.25 * Math.PI, down ? 0.75 * Math.PI : 1.75 * Math.PI); ctx.stroke();
      ctx.restore();
      D.line(ctx, sx, sea + 4, sx, Y(dd), D.alpha(col, 0.25), 1, [3, 4]);
      D.text(ctx, down ? 'ultrasound pulse ↓' : 'echo ↑', sx + 18, yz, { color: '#fff', size: fs - 1, weight: 700, bg: D.alpha(col, 0.85), pad: 3, fit: x1 });
    }
    if (!s.depths.length && !sim.time) D.text(ctx, 'Press “Send the sound” to start pinging', W / 2, sea + 24, { color: c.light ? '#1e3a8a' : '#e0f2fe', size: fs, weight: 600, align: 'center', fit: W });
    D.text(ctx, '● measured depth = 1531 × t ÷ 2', x0 + 2, H - 9, { color: c.warning, size: fs - 1, weight: 700, bg: D.alpha(c.bg, 0.75), pad: 2 });
  }
})();
