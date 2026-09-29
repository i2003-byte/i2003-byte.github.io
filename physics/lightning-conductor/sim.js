/* =====================================================================
   Some natural phenomena · Lightning and the Lightning Conductor — sim.js
   ---------------------------------------------------------------------
   The base of a thundercloud collects negative charge Q at a steady
   rate. The ground below gets an induced positive charge, crowded on
   tall, pointed things. When Q reaches 20 C a stepped leader comes
   down from a random point of the cloud in 3 m zig-zag steps. As soon
   as its tip is within the striking distance (15 m) of anything, it
   jumps to the nearest point: open ground, the roof, a tip of the
   lightning conductor, the tree or a person (a simple "rolling
   sphere" rule used to plan real lightning protection).
   Heights: house walls 7 m, roof ridge 10 m,
   three conductor tips 2.5 m above the roof,
   tree 12 m, standing person 1.7 m, crouching person 0.9 m.
   The picture is not to scale: the cloud base is drawn 42 m up, but
   real cloud bases are 1–2 km up.
   Thunder: sound travels 343 m every second, light arrives at once,
       delay = distance ÷ 343 m/s   (about 3 s per km)
   Cloud-to-ground voltage is shown as about 5 MV per coulomb, so the
   flash happens near 100 million volts (typical order of size).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var QMAX = 20, STEP = 3, RS = 15, STEPT = 0.035, CLOUD = 42;
  var HOUSE = { x0: 25, x1: 45, wall: 7, ridge: 10 }, RODS = [26, 35, 44], ROD_H = 2.5, TREE = { x: 68, top: 12 };
  var PLACES = {
    inside: { name: 'Inside the house' },
    tree: { name: 'Under the tall tree' },
    open: { name: 'Standing in an open field' },
    crouch: { name: 'Crouching low in an open field' }
  };
  var NAMES = { house: 'the house', rod: 'the conductor', tree: 'the tree', person: 'the person', ground: 'open ground' };

  function roofY(x) { var f = (x - HOUSE.x0) / (HOUSE.x1 - HOUSE.x0); return HOUSE.wall + (HOUSE.ridge - HOUSE.wall) * (1 - Math.abs(f - 0.5) * 2); }
  function candidates(p, lx) {
    var c = [{ x: lx, y: 0, tag: 'ground' }], i;
    for (i = 0; i <= 10; i++) {
      var x = M.lerp(HOUSE.x0, HOUSE.x1, i / 10);
      c.push({ x: x, y: roofY(x), tag: 'house' });
    }
    if (p.rod) RODS.forEach(function (x) { c.push({ x: x, y: roofY(x) + ROD_H, tag: 'rod' }); });
    [[0, 12], [-2.6, 10.6], [2.6, 10.6], [-3.5, 8.5], [3.5, 8.5]].forEach(function (d) { c.push({ x: TREE.x + d[0], y: d[1], tag: 'tree' }); });
    if (p.place === 'open' || p.place === 'crouch') c.push({ x: 88, y: p.place === 'open' ? 1.7 : 0.9, tag: 'person' });
    if (p.place === 'tree') c.push({ x: 71, y: 1.7, tag: 'person' });
    return c;
  }
  function nearest(p, x, y) {
    var best = null, bd = 1e9;
    candidates(p, x).forEach(function (q) { var d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = q; } });
    return { pt: best, d: bd };
  }
  function newLeader() { var x = 5 + Math.random() * 90; return { pts: [{ x: x, y: CLOUD }], target: null }; }
  function stepLeader(p, L) {
    var last = L.pts[L.pts.length - 1];
    var n = nearest(p, last.x, last.y);
    if (n.d <= RS) { L.target = n.pt; L.pts.push({ x: n.pt.x, y: n.pt.y }); return true; }
    var a = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    L.pts.push({ x: M.clamp(last.x + Math.cos(a) * STEP, 1, 99), y: last.y + Math.sin(a) * STEP });
    return false;
  }
  function record(sim, tag) {
    var s = sim.state;
    s.tally[tag]++; s.strikes++;
    if (tag === 'tree' && sim.p.place === 'tree') s.tally.side++;
  }

  SimLab.createSim({
    ariaLabel: 'A thundercloud over a house, a tall tree and a person. Charges build up, a zig-zag lightning flash comes down and strikes the nearest tall object. A lightning conductor on the house can carry the current safely into the earth.',
    audio: true,
    autoplay: true,
    mobileAspect: '4 / 5',
    params: [
      { id: 'rod', label: 'Lightning conductor on the house', type: 'toggle', value: false },
      { id: 'place', label: 'Where is the person?', type: 'select', value: 'inside', options: Object.keys(PLACES).map(function (k) { return { value: k, label: PLACES[k].name }; }) },
      { id: 'rate', label: 'Storm strength (charging rate)', min: 1, max: 5, step: 0.5, value: 2, unit: 'C/s' },
      { id: 'dist', label: 'Your distance from the flash', min: 0.5, max: 5, step: 0.5, value: 1.5, unit: 'km', help: 'Count the seconds between the flash and the thunder. Divide by 3 to get the distance in km.' }
    ],
    buttons: [
      { label: 'Strike now', primary: true, onClick: function (sim) { if (sim.state.phase === 'charge') sim.state.Q = QMAX; if (!sim.running) sim.play(); } },
      { label: 'Run 20 quick strikes', onClick: function (sim) {
        for (var i = 0; i < 20; i++) { var L = newLeader(), n = 0; while (!stepLeader(sim.p, L) && n++ < 200); record(sim, L.target.tag); }
      } },
      { label: 'Clear the tally', onClick: function (sim) { sim.state.tally = { house: 0, rod: 0, tree: 0, person: 0, ground: 0, side: 0 }; sim.state.strikes = 0; } }
    ],
    buttonsTitle: 'Lightning',
    readouts: [
      { id: 'Q', label: 'Charge at the base of the cloud', unit: 'C', digits: 1, key: true },
      { id: 'V', label: 'Voltage between cloud and ground', unit: 'million V', digits: 0 },
      { id: 'thunder', label: 'Thunder reaches you after', unit: 's', digits: 1 },
      { id: 'hits1', label: 'Strikes: house · conductor' },
      { id: 'hits2', label: 'Strikes: tree · person · ground' },
      { id: 'last', label: 'Last flash hit' }
    ],
    graph: { title: 'Charge in the cloud vs time', yLabel: 'charge (C)', series: [{ label: 'cloud charge', color: '--sim-1' }], window: 40, yMin: 0, yMax: 22 },

    onParam: function (sim, id) { return id === 'rate' || id === 'dist' || id === 'place' || id === 'rod'; },
    reset: function (sim) {
      var old = sim.state && sim.state.tally;
      sim.state = { Q: 0, phase: 'charge', t: 0, L: null, last: '—', thunderT: 0,
        tally: old || { house: 0, rod: 0, tree: 0, person: 0, ground: 0, side: 0 }, strikes: sim.state ? sim.state.strikes : 0 };
    },
    update: function (sim, dt) {
      var s = sim.state, p = sim.p;
      if (s.thunderT > 0) {
        s.thunderT -= dt;
        if (s.thunderT <= 0) SimLab.audio.noise(2.5, 0.55 * Math.min(1, 1 / p.dist), 380);
      }
      s.t += dt;
      if (s.phase === 'charge') {
        s.Q = Math.min(QMAX, s.Q + p.rate * dt);
        if (s.Q >= QMAX) { s.phase = 'leader'; s.t = 0; s.L = newLeader(); }
      } else if (s.phase === 'leader') {
        while (s.t >= STEPT) {
          s.t -= STEPT;
          if (stepLeader(p, s.L) || s.L.pts.length > 200) {
            s.phase = 'stroke'; s.t = 0; s.Q = 0;
            var tag = s.L.target ? s.L.target.tag : 'ground';
            record(sim, tag); s.last = NAMES[tag];
            s.thunderT = p.dist * 1000 / 343;
            break;
          }
        }
      } else if (s.phase === 'stroke' && s.t > 0.35) { s.phase = 'after'; s.t = 0; }
      else if (s.phase === 'after' && s.t > 1.6) { s.phase = 'charge'; s.t = 0; s.L = null; }
    },
    sample: function (sim) { return [sim.state.Q]; },
    status: function (sim) { var s = sim.state; return (sim.running ? { charge: 'Charging', leader: 'Leader coming down', stroke: 'Flash!', after: 'After the flash' }[s.phase] : 'Paused') + ' · flashes: ' + s.strikes; },
    readout: function (sim) {
      var s = sim.state, T = s.tally;
      return {
        Q: s.Q, V: s.Q * 5, thunder: sim.p.dist * 1000 / 343,
        hits1: T.house + ' · ' + T.rod, hits2: T.tree + ' · ' + T.person + ' · ' + T.ground, last: s.last + (s.last === 'the tree' && sim.p.place === 'tree' ? ' (side flash risk!)' : '')
      };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, s = sim.state;
      var narrow = W < 560, gy = H - 34, sx = (W - 8) / 100, sy = (gy - 34) / 54;
      function X(x) { return 4 + x * sx; }
      function Y(y) { return gy - y * sy; }
      D.clear(ctx, W, H, c.bg);
      ctx.fillStyle = c.light ? 'rgba(71,85,105,0.18)' : 'rgba(15,23,42,0.55)'; ctx.fillRect(0, 0, W, gy);
      var fq = s.Q / QMAX;

      // ---- ground and earth ----
      D.roundRect(ctx, 0, gy, W, H - gy, 0, c.light ? '#a3c585' : '#3f6212');
      ctx.fillStyle = c.light ? '#b08968' : '#5b4636'; ctx.fillRect(0, gy + 8, W, H - gy - 8);

      // ---- house ----
      var hx0 = X(HOUSE.x0), hx1 = X(HOUSE.x1);
      D.roundRect(ctx, hx0, Y(HOUSE.wall), hx1 - hx0, Y(0) - Y(HOUSE.wall), 2, '#e7d3b0', '#78716c', 1.5);
      ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.moveTo(hx0 - 4, Y(HOUSE.wall)); ctx.lineTo(X(35), Y(HOUSE.ridge)); ctx.lineTo(hx1 + 4, Y(HOUSE.wall)); ctx.closePath(); ctx.fill();
      D.roundRect(ctx, X(33.5), Y(3.2), sx * 3, Y(0) - Y(3.2), 1, '#78350f');
      D.roundRect(ctx, X(27), Y(5.5), sx * 4, sy * 2, 1, '#7dd3fc', '#78716c', 1);
      D.roundRect(ctx, X(39), Y(5.5), sx * 4, sy * 2, 1, '#7dd3fc', '#78716c', 1);
      // ---- lightning conductor: rod, copper strip, earth plate ----
      var copper = '#f59e0b';
      if (p.rod) {
        RODS.forEach(function (x) { D.line(ctx, X(x), Y(roofY(x)), X(x), Y(roofY(x) + ROD_H), copper, 3); D.circle(ctx, X(x), Y(roofY(x) + ROD_H), 2.5, copper); });
        D.line(ctx, X(RODS[0]), Y(roofY(RODS[0])), X(35), Y(HOUSE.ridge), copper, 2.5);
        D.line(ctx, X(35), Y(HOUSE.ridge), hx1 + 4, Y(HOUSE.wall), copper, 2.5);
        D.line(ctx, hx1 + 4, Y(HOUSE.wall), hx1 + 4, gy + 16, copper, 2.5);
        D.roundRect(ctx, hx1 - 6, gy + 16, 20, 6, 1, copper);
        D.text(ctx, 'earth plate', hx1 + 18, gy + 20, { color: c.light ? '#1f2937' : '#fde68a', size: 10, weight: 600, fit: W });
      }
      // ---- tree ----
      D.roundRect(ctx, X(TREE.x) - sx * 0.6, Y(6), sx * 1.2, Y(0) - Y(6), 2, '#78350f');
      [[0, 9.5, 2.8], [-2, 8, 2.2], [2, 8, 2.2], [0, 10.2, 2]].forEach(function (b) { D.circle(ctx, X(TREE.x + b[0]), Y(b[1]), b[2] * Math.min(sx, sy) * 1.05, '#15803d'); });
      // ---- person ----
      var pp = p.place === 'inside' ? { x: 30, h: 1.7 } : p.place === 'tree' ? { x: 71, h: 1.7 } : { x: 88, h: p.place === 'open' ? 1.7 : 0.9 };
      drawPerson(ctx, X(pp.x), gy, Math.max(18, pp.h * sy), p.place === 'crouch', c);

      // ---- cloud with charges ----
      var cy0 = Y(CLOUD);
      ctx.fillStyle = c.light ? '#94a3b8' : '#475569';
      var cr = M.clamp(sy * 5, 16, 34), cf = ctx.fillStyle;
      for (var i = 0; i < 12; i++) D.circle(ctx, X(4 + i * 8.4), cy0 - cr * (0.55 + (i % 3) * 0.3), cr, cf);
      for (i = 0; i < 7; i++) D.circle(ctx, X(10 + i * 13.5), Math.max(cr * 0.6, cy0 - cr * 1.7), cr * 1.2, cf);
      D.roundRect(ctx, X(2), cy0 - cr, X(98) - X(2), cr, cr * 0.5, cf);
      var nm = Math.round(fq * 18);
      for (i = 0; i < nm; i++) D.text(ctx, '−', X(4 + 92 * (i + 0.5) / nm), cy0 - 6, { color: '#1d4ed8', size: 15, weight: 800, align: 'center' });
      // induced + charges, crowded on tall pointed tips
      var np = Math.round(fq * 14);
      for (i = 0; i < np; i++) D.text(ctx, '+', X(3 + 94 * (i + 0.5) / np), gy + 4, { color: '#dc2626', size: 12, weight: 800, align: 'center' });
      if (fq > 0.3) {
        var tips = [p.rod ? [35, HOUSE.ridge + ROD_H] : [35, HOUSE.ridge], [TREE.x, TREE.top]];
        if (p.place === 'open' || p.place === 'crouch') tips.push([pp.x, pp.h]);
        tips.forEach(function (t) { for (var k = 0; k < Math.round(fq * 3); k++) D.text(ctx, '+', X(t[0]) + (k - 1) * 8, Y(t[1]) - 8 - k % 2 * 4, { color: '#dc2626', size: 12, weight: 800, align: 'center' }); });
      }

      // ---- leader and flash ----
      if (s.L && s.phase !== 'charge') {
        var bright = s.phase === 'stroke', fade = s.phase === 'after' ? Math.max(0, 1 - s.t / 0.5) : 1;
        if (bright) { ctx.fillStyle = 'rgba(255,255,255,' + (0.45 * (1 - s.t / 0.35)) + ')'; ctx.fillRect(0, 0, W, H); }
        if (fade > 0) {
          ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          ctx.strokeStyle = bright ? 'rgba(191,219,254,0.6)' : 'rgba(165,180,252,' + (0.35 * fade) + ')'; ctx.lineWidth = bright ? 10 : 5;
          path(ctx, s.L.pts, X, Y); ctx.stroke();
          ctx.strokeStyle = bright ? '#ffffff' : 'rgba(224,231,255,' + (0.9 * fade) + ')'; ctx.lineWidth = bright ? 3.5 : 1.8;
          path(ctx, s.L.pts, X, Y); ctx.stroke(); ctx.restore();
        }
        // what happens after the flash
        var tg = s.L.target;
        if (tg && s.phase !== 'leader') {
          if (tg.tag === 'rod') {
            var route = [[X(tg.x), Y(tg.y)], [X(tg.x), Y(roofY(tg.x))]].concat(tg.x < 35 ? [[X(35), Y(HOUSE.ridge)]] : []).concat([[hx1 + 4, Y(HOUSE.wall)], [hx1 + 4, gy + 18]]);
            for (var d = 0; d < 6; d++) { var pt = along(route, ((now / 700) + d / 6) % 1); D.circle(ctx, pt[0], pt[1], 3, '#fef08a'); }
          } else if (tg.tag !== 'ground') {
            for (var sp = 0; sp < 7; sp++) { var ang = sp * 0.9 + now / 200; D.line(ctx, X(tg.x), Y(tg.y), X(tg.x) + Math.cos(ang) * 12, Y(tg.y) + Math.sin(ang) * 12, sp % 2 ? '#f97316' : '#facc15', 2); }
          }
        }
      }
      if (s.thunderT > 0 && s.strikes > 0) D.text(ctx, 'Thunder reaches you in ' + M.fmt(s.thunderT, 1) + ' s', W - 8, 36, { color: c.warning, size: narrow ? 11 : 12, weight: 700, align: 'right', fit: W });

      // ---- headline ----
      var msg, col = c.text;
      if (s.phase === 'charge') { msg = fq < 0.05 ? 'Charges separate inside the storm cloud' : 'Charge builds up: ' + M.fmt(s.Q, 1) + ' of ' + QMAX + ' C'; }
      else if (s.phase === 'leader') { msg = 'A zig-zag leader reaches down towards the tallest point'; col = c.accent; }
      else {
        var t2 = s.L && s.L.target ? s.L.target.tag : 'ground';
        if (t2 === 'rod') { msg = 'Safe: the conductor carries the current into the earth'; col = c.success; }
        else if (t2 === 'house') { msg = 'The house is struck: fire and cracked walls. Fit a conductor!'; col = c.danger; }
        else if (t2 === 'person') { msg = 'The person is struck! Never stay in an open field in a storm'; col = c.danger; }
        else if (t2 === 'tree') { msg = p.place === 'tree' ? 'Tree struck: a side flash can jump to the person under it!' : 'The tall tree is struck'; col = p.place === 'tree' ? c.danger : c.warning; }
        else msg = 'The flash struck open ground';
      }
      headline(ctx, msg, W, col, narrow ? 11 : 14);
    }
  });

  function path(ctx, pts, X, Y) { ctx.beginPath(); pts.forEach(function (q, i) { if (i) ctx.lineTo(X(q.x), Y(q.y)); else ctx.moveTo(X(q.x), Y(q.y)); }); }
  function along(route, f) {
    var lens = [], tot = 0, i;
    for (i = 1; i < route.length; i++) { var l = Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]); lens.push(l); tot += l; }
    var d = f * tot;
    for (i = 0; i < lens.length; i++) { if (d <= lens[i]) { var t = d / lens[i]; return [M.lerp(route[i][0], route[i + 1][0], t), M.lerp(route[i][1], route[i + 1][1], t)]; } d -= lens[i]; }
    return route[route.length - 1];
  }
  function drawPerson(ctx, x, gy, h, crouch, c) {
    var col = c.light ? '#1e293b' : '#e2e8f0', r = h * 0.12;
    if (crouch) {
      D.circle(ctx, x + h * 0.15, gy - h * 0.85, r * 1.4, col);
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.moveTo(x + h * 0.1, gy - h * 0.65); ctx.quadraticCurveTo(x - h * 0.3, gy - h * 0.5, x - h * 0.15, gy - h * 0.2); ctx.lineTo(x - h * 0.1, gy);
      ctx.moveTo(x - h * 0.15, gy - h * 0.2); ctx.lineTo(x + h * 0.25, gy - h * 0.35); ctx.lineTo(x + h * 0.2, gy); ctx.stroke(); ctx.restore();
      return;
    }
    D.circle(ctx, x, gy - h + r, r, col);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(x, gy - h + 2 * r); ctx.lineTo(x, gy - h * 0.45);
    ctx.moveTo(x, gy - h * 0.45); ctx.lineTo(x - h * 0.15, gy); ctx.moveTo(x, gy - h * 0.45); ctx.lineTo(x + h * 0.15, gy);
    ctx.moveTo(x - h * 0.2, gy - h * 0.62); ctx.lineTo(x, gy - h * 0.72); ctx.lineTo(x + h * 0.2, gy - h * 0.62);
    ctx.stroke(); ctx.restore();
  }

  /* Headline that shrinks to fit narrow screens. */
  function headline(ctx, msg, W, col, size) {
    ctx.save(); ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif';
    var w = ctx.measureText(msg).width; ctx.restore();
    D.text(ctx, msg, W / 2, 14, { color: col, size: Math.max(9, Math.min(size, size * (W - 16) / w)), weight: 700, align: 'center', fit: W });
  }
})();
