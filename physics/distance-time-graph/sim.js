/* =====================================================================
   Distance–Time Graph Builder — sim.js
   ---------------------------------------------------------------------
   A bus makes an 8-minute trip in 4 legs of 2 minutes each. In each leg
   it moves at a steady speed v (km/h, 0 = waiting at a stop), so
       distance in a leg = v × (2/60) h
   and the distance–time graph is a straight segment whose steepness
   (slope, km per minute × 60) equals the speed. The canvas draws the
   road on top and builds the graph below; a dot marks every minute.
   On screen 1 minute of trip time takes 1.5 s.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var LEGS = 4, LEG_MIN = 2, TOTAL = LEGS * LEG_MIN, SEC_PER_MIN = 1.5;
  var LEG_KEYS = ['v1', 'v2', 'v3', 'v4'];
  var COLS = ['s1', 's2', 's3', 's4'];

  function speeds(p) { return LEG_KEYS.map(function (k) { return p[k]; }); }
  function distAt(p, tm) {            // km travelled after tm minutes
    var v = speeds(p), d = 0;
    for (var i = 0; i < LEGS; i++) {
      var a = i * LEG_MIN, dt = M.clamp(tm - a, 0, LEG_MIN);
      d += v[i] * dt / 60;
    }
    return d;
  }
  function legAt(tm) { return Math.min(LEGS - 1, Math.floor(tm / LEG_MIN)); }
  function kind(p) {
    var v = speeds(p);
    if (v.every(function (x) { return x === 0; })) return 'At rest';
    return v.every(function (x) { return x === v[0]; }) ? 'Uniform motion' : 'Non-uniform motion';
  }

  function setAll(sim, arr) {
    LEG_KEYS.forEach(function (k, i) { sim.setParam(k, arr[i]); });
    sim.reset(); sim.play();
  }

  SimLab.createSim({
    ariaLabel: 'A bus moving along a road with kilometre marks, and below it a distance–time graph that is drawn as the bus travels',
    playLabel: 'Drive',
    mobileAspect: '3 / 4',
    params: [
      { id: 'v1', label: 'Leg 1 speed (0–2 min)', min: 0, max: 60, step: 5, value: 30, unit: 'km/h' },
      { id: 'v2', label: 'Leg 2 speed (2–4 min)', min: 0, max: 60, step: 5, value: 45, unit: 'km/h' },
      { id: 'v3', label: 'Leg 3 speed (4–6 min)', min: 0, max: 60, step: 5, value: 0, unit: 'km/h', help: '0 km/h means the bus waits at a stop.' },
      { id: 'v4', label: 'Leg 4 speed (6–8 min)', min: 0, max: 60, step: 5, value: 30, unit: 'km/h' },
      { id: 'hide', label: 'Guess first: hide the graph', type: 'toggle', value: false },
      { id: 'labels', label: 'Show speed on each segment', type: 'toggle', value: true }
    ],
    buttonsTitle: 'Ready-made trips',
    buttons: [
      { label: 'Uniform', onClick: function (sim) { setAll(sim, [40, 40, 40, 40]); } },
      { label: 'Bus with a stop', onClick: function (sim) { setAll(sim, [30, 45, 0, 30]); } },
      { label: 'Speeding up', onClick: function (sim) { setAll(sim, [10, 25, 40, 60]); } },
      { label: 'Traffic jam', onClick: function (sim) { setAll(sim, [50, 5, 5, 50]); } }
    ],
    readouts: [
      { id: 'tm', label: 'Time', unit: 'min', digits: 2 },
      { id: 'd', label: 'Distance', unit: 'km', digits: 2 },
      { id: 'v', label: 'Speed now', unit: 'km/h', digits: 0 },
      { id: 'avg', label: 'Average speed so far', unit: 'km/h', digits: 1, key: true },
      { id: 'total', label: 'Total trip distance', unit: 'km', digits: 2, key: true },
      { id: 'kind', label: 'Type of motion' }
    ],

    onParam: function (sim, id) { return id === 'hide' || id === 'labels'; },

    reset: function (sim) { sim.state = { tm: 0 }; },
    update: function (sim, dt) { sim.state.tm = Math.min(TOTAL, sim.state.tm + dt / SEC_PER_MIN); },
    finished: function (sim) { return sim.state.tm >= TOTAL - 1e-9; },
    status: function (sim) {
      var tm = sim.state.tm, mm = Math.floor(tm + 1e-9), ss = Math.floor((tm - mm) * 60 + 1e-6);
      return (sim.running ? 'Driving' : tm >= TOTAL ? 'Trip over' : 'Paused') + ' · trip clock ' + mm + ':' + (ss < 10 ? '0' : '') + ss;
    },

    readout: function (sim) {
      var tm = sim.state.tm, d = distAt(sim.p, tm);
      return {
        tm: tm, d: d, v: tm >= TOTAL ? 0 : speeds(sim.p)[legAt(tm)],
        avg: tm > 0 ? d / (tm / 60) : null, total: distAt(sim.p, TOTAL), kind: kind(sim.p)
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, tm = sim.state.tm;
      var narrow = W < 560, v = speeds(p);
      D.clear(ctx, W, H, c.bg);
      var total = distAt(p, TOTAL);
      var dMax = Math.max(1, Math.ceil(total * 1.0001 / 0.5) * 0.5);  // axis top, rounded up to 0.5 km
      var d = distAt(p, tm);

      /* ---- road strip ---- */
      var roadH = Math.max(74, Math.min(110, H * 0.22));
      var rx0 = narrow ? 28 : 56, rx1 = W - (narrow ? 28 : 40), ry = roadH * 0.62;
      D.roundRect(ctx, rx0 - 20, ry - 16, rx1 - rx0 + 40, 32, 6, D.alpha(c.muted, 0.2));
      D.line(ctx, rx0 - 16, ry, rx1 + 16, ry, D.alpha(c.ink, 0.5), 2, [10, 10]);
      var kmStep = D.niceStep(dMax, narrow ? 4 : 8);
      for (var km = 0; km <= dMax + 1e-9; km += kmStep) {
        var kx = rx0 + km / dMax * (rx1 - rx0);
        D.line(ctx, kx, ry + 16, kx, ry + 22, c.axis, 1);
        D.text(ctx, M.fmt(km, kmStep < 1 ? 1 : 0), kx, ry + 30, { color: c.muted, size: 10, align: 'center', font: c.mono });
      }
      D.text(ctx, 'km', rx0 - 16, ry + 30, { color: c.muted, size: 10, align: 'right' });
      var bx = rx0 + d / dMax * (rx1 - rx0), leg = legAt(tm);
      bus(ctx, bx, ry - 4, narrow ? 11 : 13, c[COLS[tm >= TOTAL ? 3 : leg]], c);
      var lbl = tm >= TOTAL ? 'Arrived' : v[leg] === 0 ? 'Waiting at a stop' : v[leg] + ' km/h';
      D.text(ctx, lbl, M.clamp(bx, rx0, rx1), ry - 30, { color: c.ink, size: 12, weight: 600, align: 'center', fit: W });

      /* ---- graph ---- */
      var gl = narrow ? 44 : 60, gr = W - (narrow ? 14 : 30), gt = roadH + 22, gb = H - 34;
      function X(t) { return gl + t / TOTAL * (gr - gl); }
      function Y(km) { return gb - km / dMax * (gb - gt); }
      // leg bands
      for (var i = 0; i < LEGS; i++) {
        ctx.fillStyle = D.alpha(c[COLS[i]], 0.06);
        ctx.fillRect(X(i * LEG_MIN), gt, X(LEG_MIN) - X(0), gb - gt);
      }
      // grid + axes
      ctx.save(); ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.beginPath();
      for (var m = 0; m <= TOTAL; m++) { ctx.moveTo(Math.round(X(m)) + 0.5, gt); ctx.lineTo(Math.round(X(m)) + 0.5, gb); }
      var yStep = D.niceStep(dMax, Math.max(3, Math.floor((gb - gt) / 44)));
      for (var y = 0; y <= dMax + 1e-9; y += yStep) { ctx.moveTo(gl, Math.round(Y(y)) + 0.5); ctx.lineTo(gr, Math.round(Y(y)) + 0.5); }
      ctx.stroke(); ctx.restore();
      D.line(ctx, gl, gb, gr, gb, c.axis, 1.5); D.line(ctx, gl, gt, gl, gb, c.axis, 1.5);
      for (m = 0; m <= TOTAL; m++) D.text(ctx, String(m), X(m), gb + 12, { color: c.muted, size: 11, align: 'center', font: c.mono });
      for (y = 0; y <= dMax + 1e-9; y += yStep) D.text(ctx, M.fmt(y, yStep < 1 ? 1 : 0), gl - 6, Y(y), { color: c.muted, size: 11, align: 'right', font: c.mono });
      D.text(ctx, 'time (min)', gr, gb + 26, { color: c.muted, size: 11, align: 'right' });
      D.text(ctx, 'distance (km)', gl + 6, gt + 8, { color: c.muted, size: 11, weight: 600 });

      if (p.hide && tm < TOTAL) {
        D.text(ctx, 'Graph hidden: sketch its shape in your notebook,', (gl + gr) / 2, (gt + gb) / 2 - 10, { color: c.muted, size: 12, align: 'center', fit: W });
        D.text(ctx, 'then untick “Guess first” or let the trip finish.', (gl + gr) / 2, (gt + gb) / 2 + 10, { color: c.muted, size: 12, align: 'center', fit: W });
      } else {
        // the line, leg by leg
        for (i = 0; i < LEGS; i++) {
          var a = i * LEG_MIN; if (tm <= a) break;
          var b = Math.min(tm, a + LEG_MIN);
          D.line(ctx, X(a), Y(distAt(p, a)), X(b), Y(distAt(p, b)), c[COLS[i]], 3);
          if (p.labels && b - a > 0.6) {
            var mx = X((a + b) / 2), my = Y(distAt(p, (a + b) / 2));
            var t2 = v[i] === 0 ? 'flat: stopped' : v[i] + ' km/h';
            D.text(ctx, t2, mx, my - 16, { color: c[COLS[i]], size: 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), fit: W });
          }
        }
        // dots every minute (the 'readings')
        for (m = 0; m <= Math.floor(tm + 1e-9); m++) D.circle(ctx, X(m), Y(distAt(p, m)), 3.5, c.ink);
        D.circle(ctx, X(tm), Y(d), 5, c.accent, c.bg, 2);
      }
      if (!sim.running && tm === 0) D.text(ctx, 'Press Drive', (gl + gr) / 2, gb - 16, { color: c.faint, size: 12, align: 'center' });
    }
  });

  // Simple side-view bus centred at (x, y); r sets its size.
  function bus(ctx, x, y, r, col, c) {
    D.roundRect(ctx, x - r * 2.2, y - r * 1.3, r * 4.4, r * 2, r * 0.4, col);
    for (var k = 0; k < 4; k++) D.roundRect(ctx, x - r * 1.9 + k * r * 0.95, y - r * 1.05, r * 0.7, r * 0.7, 2, D.alpha('#ffffff', 0.75));
    D.circle(ctx, x - r * 1.3, y + r * 0.75, r * 0.45, c.ink);
    D.circle(ctx, x + r * 1.3, y + r * 0.75, r * 0.45, c.ink);
  }
})();
