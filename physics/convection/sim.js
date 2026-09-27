/* =====================================================================
   Heat · Convection — sim.js
   ---------------------------------------------------------------------
   A beaker of water is heated near one corner. Water at the bottom gets
   hot, becomes lighter (less dense) and RISES; cooler, heavier water
   from the top SINKS to take its place. The moving water carries the
   heat with it — a convection current. Drop a crystal of potassium
   permanganate to see the purple streak follow the current.
   Flow model: one circulation cell from a stream function
     u = −Aπ·sin(πx)·cos(πy),  v = Aπ·cos(πx)·sin(πy)   (x, y ∈ 0..1, y up)
   which rises on the heated (left) side. A grows with the heating and
   dies away when the burner is off. Each particle carries its own
   temperature: heated near the flame, cooled at the surface.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var NW = 140, ROOM = 20;

  function tempColor(t) { // blue (cool) → red (hot)
    var k = M.clamp((t - ROOM) / 40, 0, 1);
    return 'rgb(' + Math.round(M.lerp(59, 239, k)) + ',' + Math.round(M.lerp(130, 68, k)) + ',' + Math.round(M.lerp(246, 68, k)) + ')';
  }
  function flow(sim, x, y) {
    var A = sim.state.A * (sim.p.side === 'right' ? -1 : 1), pi = Math.PI;
    return { u: -A * pi * Math.sin(pi * x) * Math.cos(pi * y), v: A * pi * Math.cos(pi * x) * Math.sin(pi * y) };
  }
  function avg(ps, test) {
    var n = 0, sum = 0; ps.forEach(function (p) { if (test(p)) { n++; sum += p.T; } });
    return n ? sum / n : ROOM;
  }
  function addDye(sim) {
    var r = sim.state.rand, left = sim.p.side !== 'right';
    for (var i = 0; i < 70; i++) sim.state.dye.push({ x: left ? 0.12 + r() * 0.05 : 0.83 + r() * 0.05, y: 0.03 + r() * 0.03, T: ROOM, age: i * 0.05 });
  }

  SimLab.createSim({
    ariaLabel: 'A beaker of water heated at one bottom corner, with particles and purple dye showing the convection current',
    autoplay: true,
    mobileAspect: '4 / 4',
    params: [
      { id: 'heat', label: 'Flame size', min: 0, max: 3, step: 1, value: 2,
        format: function (v) { return ['Off', 'Low', 'Medium', 'High'][v]; } },
      { id: 'side', label: 'Burner under the', type: 'select', value: 'left', options: [
        { value: 'left', label: 'Left corner' }, { value: 'right', label: 'Right corner' }] },
      { id: 'colors', label: 'Show water temperature colours', type: 'toggle', value: true }
    ],
    buttonsTitle: 'Experiment',
    buttons: [
      { label: '🟣 Drop a permanganate crystal', primary: true, onClick: function (sim) { addDye(sim); sim.play(); } }
    ],
    readouts: [
      { id: 'bot', label: 'Water at the bottom', unit: '°C', digits: 1 },
      { id: 'top', label: 'Water at the top', unit: '°C', digits: 1, key: true },
      { id: 'cur', label: 'Current', key: true }
    ],
    graph: { title: 'Water temperature', yLabel: '°C', series: [{ label: 'top' }, { label: 'bottom' }], window: 40 },
    onParam: function (sim, id) { if (id === 'colors') { sim.redraw(); return true; } sim.play(); return true; },
    reset: function (sim) {
      var r = M.rng(11), ws = [];
      for (var i = 0; i < NW; i++) ws.push({ x: 0.03 + r() * 0.94, y: 0.03 + r() * 0.94, T: ROOM });
      sim.state = { ws: ws, dye: [], A: 0, rand: r };
      addDye(sim);
    },
    update: function (sim, dt) {
      var s = sim.state, heat = sim.p.heat, r = s.rand, left = sim.p.side !== 'right';
      s.A += (heat * 0.05 - s.A) * dt / 3;
      function move(p) {
        var f = flow(sim, p.x, p.y);
        p.x = M.clamp(p.x + f.u * dt + (r() - 0.5) * 0.004, 0.01, 0.99);
        p.y = M.clamp(p.y + f.v * dt + (r() - 0.5) * 0.004, 0.01, 0.99);
      }
      s.ws.forEach(function (p) {
        move(p);
        var nearFlame = p.y < 0.2 && (left ? p.x < 0.35 : p.x > 0.65);
        if (nearFlame) p.T += heat * 30 * dt * Math.max(0, 1 - (p.T - ROOM) / 80);
        p.T -= (p.y > 0.9 ? 0.08 : 0.005) * (p.T - ROOM) * dt; // the surface loses heat to the air
      });
      // neighbouring water mixes a little
      var mean = avg(s.ws, function () { return true; });
      s.ws.forEach(function (p) { p.T += (mean - p.T) * 0.03 * dt; });
      s.dye.forEach(function (p) { move(p); p.age += dt; });
      if (s.dye.length > 500) s.dye.splice(0, s.dye.length - 500);
    },
    sample: function (sim) {
      var ws = sim.state.ws;
      return [avg(ws, function (p) { return p.y > 0.75; }), avg(ws, function (p) { return p.y < 0.25; })];
    },
    readout: function (sim) {
      var ws = sim.state.ws, A = sim.state.A;
      return {
        top: avg(ws, function (p) { return p.y > 0.75; }), bot: avg(ws, function (p) { return p.y < 0.25; }),
        cur: A < 0.005 ? 'None (still water)' : A < 0.04 ? 'Slow' : A < 0.08 ? 'Steady' : 'Fast'
      };
    },
    status: function (sim) { return sim.p.heat ? 'Heating · t = ' + M.fmt(sim.time, 1) + ' s' : 'Burner off · t = ' + M.fmt(sim.time, 1) + ' s'; },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, narrow = W < 520;
      var left = sim.p.side !== 'right';
      D.clear(ctx, W, H, c.bg);
      var bw = Math.min(W - 40, H * 1.25, 620), bx = (W - bw) / 2, by = 28, bh = H - by - (narrow ? 70 : 84);
      function X(x) { return bx + x * bw; }
      function Y(y) { return by + (1 - y) * bh; }

      ctx.fillStyle = D.alpha(c.s1, 0.12); ctx.fillRect(bx, by, bw, bh);
      var dot = narrow ? 2.4 : 3.2;
      s.ws.forEach(function (p) { D.circle(ctx, X(p.x), Y(p.y), dot, sim.p.colors ? tempColor(p.T) : D.alpha(c.ink, 0.35)); });
      s.dye.forEach(function (p) {
        var a = M.clamp(1 - p.age / 40, 0.15, 0.9);
        D.circle(ctx, X(p.x), Y(p.y), dot * 1.1, 'rgba(168,85,247,' + a + ')');
      });
      ctx.strokeStyle = c.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx, by - 10); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by - 10); ctx.stroke();

      // current arrows
      if (s.A > 0.005) {
        var col = D.alpha(c.warning, M.clamp(s.A * 12, 0.3, 1)), sx = left ? 1 : -1, mid = 0.5;
        var aL = left ? 0.18 : 0.82, aR = left ? 0.82 : 0.18;
        D.arrow(ctx, X(aL), Y(0.3), X(aL), Y(0.72), col, 3, 11);
        D.arrow(ctx, X(mid - 0.2 * sx), Y(0.86), X(mid + 0.2 * sx), Y(0.86), col, 3, 11);
        D.arrow(ctx, X(aR), Y(0.72), X(aR), Y(0.3), col, 3, 11);
        D.arrow(ctx, X(mid + 0.2 * sx), Y(0.14), X(mid - 0.2 * sx), Y(0.14), col, 3, 11);
        D.text(ctx, 'hot rises', X(aL), Y(0.78), { color: c.danger, size: narrow ? 10 : 12, weight: 700, align: 'center', fit: W });
        D.text(ctx, 'cool sinks', X(aR), Y(0.24), { color: c.s1, size: narrow ? 10 : 12, weight: 700, align: 'center', fit: W });
      }

      // tripod + burner
      var fx = X(left ? 0.15 : 0.85), base = H - 8;
      D.line(ctx, bx - 6, by + bh + 4, bx + bw + 6, by + bh + 4, c.axis, 3);
      D.roundRect(ctx, fx - 10, base - 22, 20, 22, 3, c.surface2, c.border, 1);
      if (sim.p.heat > 0) {
        var gap = base - 22 - (by + bh + 4), fh = 8 + sim.p.heat * (gap - 8) / 3 + (sim.reduceMotion ? 0 : Math.sin(now / 70) * 2);
        ctx.save(); ctx.fillStyle = D.alpha('#3b82f6', 0.85); ctx.beginPath();
        ctx.ellipse(fx, base - 22 - fh / 2, 7, fh / 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.ellipse(fx, base - 22 - fh * 0.35, 3, fh * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      D.text(ctx, sim.p.heat ? '🔥 heat' : 'burner off', left ? fx + 20 : fx - 20, base - 12, { color: c.muted, size: 11, align: left ? 'left' : 'right' });
    }
  });
})();
