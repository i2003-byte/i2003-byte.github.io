/* =====================================================================
   Motion · Distance and Displacement — sim.js
   ---------------------------------------------------------------------
   A walker follows a path (a polyline in metres, x = east, y = north).
     distance      = length of the path actually travelled (a scalar)
     displacement  = straight arrow from start to present position
                     (a vector: size √(Δx² + Δy²) and a direction)
     average speed    = distance ÷ time
     average velocity = displacement ÷ time
   The walker moves at a steady speed v, so after time t the distance is
   v × t. On screen the whole walk plays in about 10 s; the clock and
   graph show the real walking time.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SCREEN_S = 10, CUSTOM_BOX = 100;

  function circle(r, n) { var p = []; for (var i = 0; i <= n; i++) { var a = -Math.PI / 2 + i / n * 2 * Math.PI; p.push([r * Math.cos(a), r + r * Math.sin(a)]); } return p; }
  var PATHS = {
    back: { label: 'To the shop and back (60 m each way)', pts: [[0, 0], [60, 0], [0, 0]] },
    school: { label: 'Home to school: 400 m east, 300 m north', pts: [[0, 0], [400, 0], [400, 300]] },
    park: { label: 'Round a square park (side 100 m)', pts: [[0, 0], [100, 0], [100, 100], [0, 100], [0, 0]] },
    track: { label: 'One lap of a round track (radius 50 m)', pts: circle(50, 180) },
    lanes: { label: 'Auto-rickshaw through city lanes', pts: [[0, 0], [150, 0], [150, 120], [300, 120], [300, -60], [420, -60], [420, 60]] },
    custom: { label: 'Draw your own: tap the map to add turns', pts: null }
  };

  function pathPts(sim) { return sim.p.path === 'custom' ? sim.state.custom : PATHS[sim.p.path].pts; }
  function cumul(pts) { var s = [0]; for (var i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return s; }
  function posAt(pts, cum, d) {
    for (var i = 1; i < pts.length; i++) if (d <= cum[i] + 1e-9) {
      var seg = cum[i] - cum[i - 1], f = seg > 0 ? (d - cum[i - 1]) / seg : 0;
      return [M.lerp(pts[i - 1][0], pts[i][0], f), M.lerp(pts[i - 1][1], pts[i][1], f), i];
    }
    var L = pts[pts.length - 1]; return [L[0], L[1], pts.length];
  }
  function geom(sim) { var pts = pathPts(sim), cum = cumul(pts); return { pts: pts, cum: cum, total: cum[cum.length - 1] }; }
  function dirText(dx, dy) {
    var m = Math.hypot(dx, dy); if (m < 0.5) return '—';
    var ax = Math.abs(dx), ay = Math.abs(dy), EW = dx >= 0 ? 'east' : 'west', NS = dy >= 0 ? 'north' : 'south';
    if (ay < 0.01 * m) return 'due ' + EW;
    if (ax < 0.01 * m) return 'due ' + NS;
    if (ax >= ay) return M.fmt(M.deg(Math.atan2(ay, ax)), 0) + '° ' + NS + ' of ' + EW;
    return M.fmt(M.deg(Math.atan2(ax, ay)), 0) + '° ' + EW + ' of ' + NS;
  }
  // world → screen transform that fits the path (or the custom box)
  function view(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, pts = pathPts(sim);
    var x0, x1, y0, y1;
    if (sim.p.path === 'custom') { x0 = -CUSTOM_BOX; x1 = CUSTOM_BOX; y0 = -CUSTOM_BOX; y1 = CUSTOM_BOX; }
    else {
      x0 = y0 = Infinity; x1 = y1 = -Infinity;
      pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
      var span = Math.max(x1 - x0, y1 - y0, 20);
      var padW = span * 0.12; x0 -= padW; x1 += padW; y0 -= padW; y1 += padW;
    }
    var top = 44, bot = W < 760 ? 92 : 64, left = narrow ? 14 : 24, right = narrow ? 14 : 24;
    var aw = W - left - right, ah = H - top - bot, s = Math.min(aw / (x1 - x0), ah / (y1 - y0));
    var cx = left + aw / 2, cy = top + ah / 2, mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return { s: s, X: function (x) { return cx + (x - mx) * s; }, Y: function (y) { return cy - (y - my) * s; },
      ix: function (px) { return mx + (px - cx) / s; }, iy: function (py) { return my - (py - cy) / s; }, narrow: narrow, top: top, bot: bot,
      bx0: x0, bx1: x1, by0: y0, by1: y1 };
  }
  var tMaxGraph = 1;

  SimLab.createSim({
    ariaLabel: 'A top-view map with a walker following a path; the path already walked is the distance and a straight arrow from the start to the walker is the displacement',
    playLabel: 'Walk',
    mobileAspect: '3 / 4',
    params: [
      { id: 'path', label: 'Path', type: 'select', value: 'school', options: Object.keys(PATHS).map(function (k) { return { value: k, label: PATHS[k].label }; }) },
      { id: 'v', label: 'Walking speed', min: 0.5, max: 10, step: 0.5, value: 1.5, unit: 'm/s',
        presets: [{ label: 'Walk', value: 1.5 }, { label: 'Cycle', value: 5 }, { label: 'Auto', value: 8 }],
        help: 'The walk always plays in about 10 s on screen; the clock shows the real time taken.' },
      { id: 'arrow', label: 'Show the displacement arrow', type: 'toggle', value: true }
    ],
    buttonsTitle: 'Draw your own path',
    buttons: [
      { label: 'Undo last turn', onClick: function (sim) { var c = sim.state.custom; if (c.length > 1) c.pop(); sim.setParam('path', 'custom'); sim.reset(); } },
      { label: 'Clear my path', onClick: function (sim) { sim.state.custom = [[0, 0]]; sim.setParam('path', 'custom'); sim.reset(); } }
    ],
    readouts: [
      { id: 't', label: 'Time', unit: 's', digits: 1 },
      { id: 'd', label: 'Distance travelled', unit: 'm', digits: 1, key: true },
      { id: 's', label: 'Displacement (size)', unit: 'm', digits: 1, key: true },
      { id: 'dir', label: 'Displacement direction' },
      { id: 'sp', label: 'Average speed', unit: 'm/s', digits: 2 },
      { id: 'vel', label: 'Average velocity (size)', unit: 'm/s', digits: 2 }
    ],
    graph: { title: 'Distance and displacement vs time', yLabel: 'm', series: [{ label: 'distance', color: '--sim-1' }, { label: 'size of displacement', color: '--sim-2' }], xMax: function () { return tMaxGraph; }, yMin: 0 },
    onParam: function (sim, id) { return id === 'arrow'; },

    reset: function (sim) {
      var custom = sim.state && sim.state.custom || [[0, 0], [60, 0], [60, 60], [-30, 60]];
      sim.state = { custom: custom, d: 0, t: 0, acc: 0 };
      var g = geom(sim);
      tMaxGraph = Math.max(1, g.total / sim.p.v);
      if (sim.graph) sim.graph.push(0, [0, 0]);
    },
    update: function (sim, dt) {
      var st = sim.state, g = geom(sim);
      if (g.total <= 0) return;
      var k = g.total / sim.p.v / SCREEN_S;            // real seconds per screen second
      st.t = Math.min(g.total / sim.p.v, st.t + dt * k);
      st.d = Math.min(g.total, sim.p.v * st.t);
      st.acc += dt;
      if (st.acc >= 1 / 30 || st.d >= g.total) {
        st.acc = 0;
        var p = posAt(g.pts, g.cum, st.d);
        sim.graph.push(st.t, [st.d, Math.hypot(p[0] - g.pts[0][0], p[1] - g.pts[0][1])]);
      }
    },
    finished: function (sim) { var g = geom(sim); return g.total <= 0 || sim.state.d >= g.total - 1e-9; },
    status: function (sim) {
      var g = geom(sim);
      if (g.total <= 0) return 'Tap the map to add the first turn';
      return sim.state.d >= g.total - 1e-9 ? 'Walk finished' : sim.running ? 'Walking' : 'Paused';
    },
    readout: function (sim) {
      var st = sim.state, g = geom(sim), p = posAt(g.pts, g.cum, st.d), dx = p[0] - g.pts[0][0], dy = p[1] - g.pts[0][1], s = Math.hypot(dx, dy);
      return { t: st.t, d: st.d, s: s, dir: dirText(dx, dy), sp: st.t > 0 ? st.d / st.t : null, vel: st.t > 0 ? s / st.t : null };
    },
    pointer: {
      down: function (sim, x, y) {
        if (sim.p.path !== 'custom') return false;
        var vw = view(sim), wx = Math.round(vw.ix(x) / 5) * 5, wy = Math.round(vw.iy(y) / 5) * 5;
        if (Math.abs(wx) > CUSTOM_BOX || Math.abs(wy) > CUSTOM_BOX) return false;
        var c = sim.state.custom, L = c[c.length - 1];
        if (c.length >= 20 || (L[0] === wx && L[1] === wy)) return false;
        c.push([wx, wy]); sim.reset();
        return false;
      },
      hover: function (sim) { return sim.p.path === 'custom'; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, st = sim.state, vw = view(sim), narrow = vw.narrow;
      var g = geom(sim), pts = g.pts, X = vw.X, Y = vw.Y;
      D.clear(ctx, W, H, c.bg);

      // map grid with a nice step in metres
      var step = D.niceStep(Math.max(vw.bx1 - vw.bx0, vw.by1 - vw.by0), narrow ? 5 : 7);
      ctx.save(); ctx.strokeStyle = c.grid; ctx.lineWidth = 1; ctx.beginPath();
      for (var gx = Math.ceil(vw.bx0 / step) * step; gx <= vw.bx1; gx += step) { ctx.moveTo(Math.round(X(gx)) + 0.5, Y(vw.by1)); ctx.lineTo(Math.round(X(gx)) + 0.5, Y(vw.by0)); }
      for (var gy = Math.ceil(vw.by0 / step) * step; gy <= vw.by1; gy += step) { ctx.moveTo(X(vw.bx0), Math.round(Y(gy)) + 0.5); ctx.lineTo(X(vw.bx1), Math.round(Y(gy)) + 0.5); }
      ctx.stroke(); ctx.restore();
      // scale bar
      var sbx = X(vw.bx0) + 8, sby = Y(vw.by1) + 22;
      D.line(ctx, sbx, sby, sbx + step * vw.s, sby, c.muted, 2);
      D.line(ctx, sbx, sby - 4, sbx, sby + 4, c.muted, 2); D.line(ctx, sbx + step * vw.s, sby - 4, sbx + step * vw.s, sby + 4, c.muted, 2);
      D.text(ctx, M.fmt(step, 0) + ' m', sbx + step * vw.s / 2, sby - 10, { color: c.muted, size: 10, align: 'center' });
      // north arrow
      var nx = X(vw.bx1) - 16, ny = Y(vw.by1) + 12;
      D.arrow(ctx, nx, ny + 26, nx, ny, c.muted, 2, 7);
      D.text(ctx, 'N', nx, ny + 36, { color: c.muted, size: 11, weight: 700, align: 'center' });

      var p = posAt(pts, g.cum, st.d);
      // full path (still to walk) dashed, walked part solid
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = D.alpha(c.ink, 0.35); ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath();
      pts.forEach(function (q, i) { if (i) ctx.lineTo(X(q[0]), Y(q[1])); else ctx.moveTo(X(q[0]), Y(q[1])); }); ctx.stroke();
      ctx.setLineDash([]); ctx.strokeStyle = c.s1; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
      for (var i = 1; i < p[2] && i < pts.length; i++) ctx.lineTo(X(pts[i][0]), Y(pts[i][1]));
      ctx.lineTo(X(p[0]), Y(p[1])); ctx.stroke(); ctx.restore();
      // turn points (custom)
      if (sim.p.path === 'custom') pts.forEach(function (q, i) { if (i) D.circle(ctx, X(q[0]), Y(q[1]), 4, c.surface2, c.s1, 2); });
      if (sim.p.path === 'custom') D.text(ctx, 'Tap the map to add a turn (snaps to 5 m)', (X(vw.bx0) + X(vw.bx1)) / 2, Y(vw.by0) - 10, { color: c.faint, size: 11, align: 'center', fit: W });

      // start flag
      var sx = X(pts[0][0]), sy = Y(pts[0][1]);
      D.circle(ctx, sx, sy, 6, c.success, c.bg, 2);
      D.text(ctx, 'Start', sx, sy + 16, { color: c.success, size: 11, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), fit: W });

      // displacement arrow
      var s = Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]);
      if (sim.p.arrow && s > 0.5) {
        var ex = X(p[0]), ey = Y(p[1]);
        D.arrow(ctx, sx, sy, ex, ey, c.s2, 3, 10);
        var mx = (sx + ex) / 2, my = (sy + ey) / 2, len = Math.hypot(ex - sx, ey - sy), nxv = -(ey - sy) / len, nyv = (ex - sx) / len;
        D.text(ctx, 'displacement ' + M.fmt(s, 0) + ' m', mx + nxv * 14, my + nyv * 14, { color: c.s2, size: 11.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), fit: W });
      }
      // walker
      D.circle(ctx, X(p[0]), Y(p[1]), 8, c.accent, c.bg, 2.5);
      D.circle(ctx, X(p[0]), Y(p[1]) - 2, 2.2, c.bg);

      // headline
      var hl;
      if (g.total <= 0) hl = 'Tap the map to plan a walk from the start';
      else if (st.d >= g.total - 1e-9 && s < 0.5) hl = 'Back at the start: distance ' + M.fmt(st.d, 0) + ' m, displacement 0 m!';
      else if (st.d > 0) hl = 'Distance ' + M.fmt(st.d, 0) + ' m  ≥  displacement ' + M.fmt(s, 0) + ' m';
      else hl = 'Distance is the path walked; displacement is start → finish in a straight line';
      var fs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif';
      while (fs > 9 && ctx.measureText(hl).width > W - 30) { fs -= 0.5; ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, 18, { color: c.bg, bg: st.d >= g.total - 1e-9 && s < 0.5 && g.total > 0 ? c.warning : c.s1, size: fs, weight: 700, align: 'center', pad: 5, fit: W });

      // bottom panel: the two numbers side by side
      var by = H - vw.bot + 14, stack = W < 760, colW = (W - 48) / 2;
      var l1 = 'Distance (path length) = ' + M.fmt(st.d, 1) + ' m' + (g.total > 0 ? ' of ' + M.fmt(g.total, 0) + ' m' : '');
      var l2 = 'Displacement = ' + M.fmt(s, 1) + ' m, ' + dirText(p[0] - pts[0][0], p[1] - pts[0][1]);
      D.text(ctx, l1, narrow ? 14 : 24, by + 10, { color: c.s1, size: narrow ? 12 : 13, weight: 700 });
      if (stack) D.text(ctx, l2, narrow ? 14 : 24, by + 32, { color: c.s2, size: narrow ? 12 : 13, weight: 700 });
      else D.text(ctx, l2, 24 + colW + 12, by + 10, { color: c.s2, size: 13, weight: 700 });
      var ratio = st.d > 0 ? 'displacement ÷ distance = ' + M.fmt(s / st.d, 2) + (s / st.d > 0.999 ? (narrow ? '  (equal: straight line)' : '  (straight line so far: they are equal)') : '') : '';
      if (ratio) D.text(ctx, ratio, narrow ? 14 : 24, by + (stack ? 54 : 34), { color: c.muted, size: 11.5, weight: 600 });
    }
  });
})();
