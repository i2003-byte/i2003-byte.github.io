/* =====================================================================
   Chemistry · Solids, Liquids and Gases (matter in our surroundings)
   ---------------------------------------------------------------------
   Three containers side by side, each holding one state of matter as
   particles (lengths in particle diameters d = 1, time in seconds):
     SOLID   particles sit at fixed places in a regular pattern and only
             vibrate about them (amplitude grows with temperature).
     LIQUID  soft particles that touch, pulled down by gravity and given
             random thermal kicks (Langevin: −γv drag + random force with
             strength √(2γT)). They slide past each other, so the liquid
             flows to the shape of the container but keeps its volume.
     GAS     far-apart particles in straight-line flight with elastic
             collisions; they fill the whole container.
   The piston pushes down on all three: the gas squeezes into less
   space; the liquid and solid can't be squeezed (the piston stops).
   Each container has the same 100 mL inside (area 100 d² = 100 mL).
   Not to scale: real gas particles are about 10 diameters apart and move
   at hundreds of m/s; here they are slowed down so you can follow them.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SHAPES = { square: [10, 10], tall: [8, 12.5], wide: [12.5, 8] };
  var NG = 20, NL = 30, SC = 5, SR = 5, NS = SC * SR;
  var VLIQ = 30, VSOL = Math.round(NS * 0.866); // mL taken by the liquid and the solid
  var G = 25, KSP = 3000, GAM = 3, TRAIL = 2.5;
  var HEAT = ['', 'Cold', 'Cool', 'Warm', 'Hot', 'Very hot'];
  var DYE = '#f472b6';

  function gauss(r) { var u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function dims(sim) { return SHAPES[sim.p.shape] || SHAPES.square; }
  function gasSpeed(heat) { return 3.2 * Math.sqrt(heat); }

  function solidSites(w) {
    var s = [];
    for (var row = 0; row < SR; row++) for (var c = 0; c < SC; c++)
      s.push({ x: w / 2 + (c - (SC - 1) / 2 + (row % 2 ? 0.25 : -0.25)), y: 0.5 + row * 0.866 });
    return s;
  }

  function placeAll(sim) {
    var st = sim.state, r = st.rand, d = dims(sim), w = d[0], h = d[1];
    st.sites = solidSites(w);
    st.sol = st.sites.map(function (s) { return { x: s.x, y: s.y, p1: r() * 6.3, p2: r() * 6.3, f1: 7 + r() * 4, f2: 7 + r() * 4, dye: false, tr: [] }; });
    st.liq = [];
    var cols = Math.floor(w / 1.05);
    for (var i = 0; i < NL; i++) st.liq.push({ x: 0.6 + (i % cols) * 1.05 + r() * 0.05, y: 0.55 + Math.floor(i / cols) * 1.0, vx: 0, vy: 0, rad: 0.42 + r() * 0.12, dye: false, tr: [] });
    st.gas = [];
    var v0 = gasSpeed(sim.p.heat);
    for (i = 0; i < NG; i++) {
      var a = r() * Math.PI * 2, sp = v0 * (0.5 + r());
      st.gas.push({ x: 0.6 + r() * (w - 1.2), y: 0.6 + r() * (h - 1.2), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dye: false, tr: [] });
    }
  }
  function refit(sim) { // container shape changed: keep particles, move what must move
    var st = sim.state, d = dims(sim), w = d[0], old = st.sites;
    st.sites = solidSites(w);
    st.sol.forEach(function (p, i) { p.x += st.sites[i].x - old[i].x; p.tr = []; });
    st.liq.forEach(function (p) { p.x = M.clamp(p.x, p.rad, w - p.rad); p.tr = []; });
    st.gas.forEach(function (p) { p.x = M.clamp(p.x, 0.5, w - 0.5); p.y = M.clamp(p.y, 0.5, st.lidG - 0.5); p.tr = []; });
  }
  function rescaleGas(sim, oldHeat) {
    var k = Math.sqrt(sim.p.heat / oldHeat);
    sim.state.gas.forEach(function (p) { p.vx *= k; p.vy *= k; });
  }
  function lidTargets(sim) {
    var h = dims(sim)[1], w = dims(sim)[0], want = h * (1 - sim.p.squeeze / 100);
    return { gas: Math.max(want, 2.2), liq: Math.max(want, VLIQ / w + 0.9), sol: Math.max(want, SR * 0.866 + 0.25), want: want };
  }
  function mixed(arr, w) {
    var n = 0, right = 0;
    arr.forEach(function (p) { if (p.dye) { n++; if (p.x > w / 2) right++; } });
    return n ? Math.min(100, Math.round(200 * right / n)) : null;
  }

  SimLab.createSim({
    ariaLabel: 'Three containers side by side holding a solid, a liquid and a gas drawn as particles. The solid particles vibrate in a fixed pattern, the liquid particles slide past each other at the bottom, and the gas particles fly around the whole container. A piston can squeeze all three',
    autoplay: true,
    mobileAspect: '1 / 1',
    params: [
      { id: 'heat', label: 'Temperature', min: 1, max: 5, step: 1, value: 3, format: function (v) { return HEAT[v]; } },
      { id: 'shape', label: 'Container shape', type: 'select', value: 'square', options: [
        { value: 'square', label: 'Square jar' }, { value: 'tall', label: 'Tall, narrow jar' }, { value: 'wide', label: 'Wide, flat dish' }] },
      { id: 'squeeze', label: 'Push the piston down', min: 0, max: 70, step: 5, value: 0, unit: '%' },
      { id: 'trail', label: 'Follow one particle (show its path)', type: 'toggle', value: true }
    ],
    buttonsTitle: 'Experiment',
    buttons: [
      { label: '🎨 Add colour to the left half (diffusion)', primary: true, full: true, onClick: function (sim) {
        var st = sim.state, w = dims(sim)[0];
        ['sol', 'liq', 'gas'].forEach(function (k) { st[k].forEach(function (p) { p.dye = p.x < w / 2; }); });
        st.dyed = true; sim.play();
      } }
    ],
    readouts: [
      { id: 'sv', label: 'Solid: space taken', unit: 'mL', digits: 0, key: true, short: 'Solid' },
      { id: 'lv', label: 'Liquid: space taken', unit: 'mL', digits: 0, key: true, short: 'Liquid' },
      { id: 'gv', label: 'Gas: space taken', unit: 'mL', digits: 0, key: true, short: 'Gas' },
      { id: 'mix', label: 'Colour spread: solid · liquid · gas' }
    ],
    onParam: function (sim, id, v) {
      if (id === 'heat') { rescaleGas(sim, sim.state.heat); sim.state.heat = v; }
      if (id === 'shape') refit(sim);
      sim.redraw(); return true;
    },
    reset: function (sim) {
      var h = dims(sim)[1];
      sim.state = { rand: M.rng(7), heat: sim.p.heat, dyed: false, t: 0 };
      var L = lidTargets(sim);
      sim.state.lidG = L.gas; sim.state.lidL = L.liq; sim.state.lidS = L.sol;
      placeAll(sim);
      sim.state.h0 = h;
    },
    update: function (sim, dt) {
      var st = sim.state, d = dims(sim), w = d[0], r = st.rand, T = 1.5 * sim.p.heat, L = lidTargets(sim), i, j;
      st.t += dt;
      // pistons glide to their targets (2 container-heights per second)
      function glide(cur, to) { var s = 2 * d[1] * dt; return cur + M.clamp(to - cur, -s, s); }
      st.lidG = glide(st.lidG, L.gas); st.lidL = glide(st.lidL, L.liq); st.lidS = glide(st.lidS, L.sol);

      // solid: vibration about fixed places
      var A = 0.07 * Math.sqrt(sim.p.heat);
      st.sol.forEach(function (p, k) {
        var s = st.sites[k];
        p.x = s.x + A * Math.sin(p.f1 * st.t + p.p1);
        p.y = s.y + A * Math.sin(p.f2 * st.t + p.p2);
      });

      // liquid: soft disks + gravity + thermal kicks
      var lq = st.liq, sig = Math.sqrt(2 * GAM * T * dt);
      for (i = 0; i < lq.length; i++) { lq[i].ax = 0; lq[i].ay = -G; }
      for (i = 0; i < lq.length; i++) for (j = i + 1; j < lq.length; j++) {
        var a = lq[i], b = lq[j], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy), rr = a.rad + b.rad;
        if (dd < rr && dd > 1e-6) {
          var f = KSP * (rr - dd) / dd;
          a.ax -= f * dx; a.ay -= f * dy; b.ax += f * dx; b.ay += f * dy;
        }
      }
      lq.forEach(function (p) {
        if (p.x < p.rad) p.ax += KSP * (p.rad - p.x);
        if (p.x > w - p.rad) p.ax -= KSP * (p.x - w + p.rad);
        if (p.y < p.rad) p.ay += KSP * (p.rad - p.y);
        if (p.y > st.lidL - p.rad) p.ay -= KSP * (p.y - st.lidL + p.rad);
        p.vx += (p.ax - GAM * p.vx) * dt + sig * gauss(r);
        p.vy += (p.ay - GAM * p.vy) * dt + sig * gauss(r);
        p.x += p.vx * dt; p.y += p.vy * dt;
      });

      // gas: free flight, elastic walls and collisions
      var gs = st.gas;
      gs.forEach(function (p) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0.5) { p.x = 0.5; p.vx = Math.abs(p.vx); }
        if (p.x > w - 0.5) { p.x = w - 0.5; p.vx = -Math.abs(p.vx); }
        if (p.y < 0.5) { p.y = 0.5; p.vy = Math.abs(p.vy); }
        if (p.y > st.lidG - 0.5) { p.y = st.lidG - 0.5; p.vy = -Math.abs(p.vy); }
      });
      for (i = 0; i < gs.length; i++) for (j = i + 1; j < gs.length; j++) {
        var p = gs[i], q = gs[j], ex = q.x - p.x, ey = q.y - p.y, e = Math.hypot(ex, ey);
        if (e < 1 && e > 1e-6) {
          ex /= e; ey /= e;
          var rel = (q.vx - p.vx) * ex + (q.vy - p.vy) * ey;
          if (rel < 0) { p.vx += rel * ex; p.vy += rel * ey; q.vx -= rel * ex; q.vy -= rel * ey; }
          var push = (1 - e) / 2; p.x -= ex * push; p.y -= ey * push; q.x += ex * push; q.y += ey * push;
        }
      }
      // trails of the followed particles
      var tick = Math.floor(st.t * 30) !== Math.floor((st.t - dt) * 30);
      if (tick) [st.sol[12], st.liq[7], st.gas[0]].forEach(function (p) {
        p.tr.push({ x: p.x, y: p.y, t: st.t });
        while (p.tr.length && p.tr[0].t < st.t - TRAIL) p.tr.shift();
      });
    },
    readout: function (sim) {
      var st = sim.state, w = dims(sim)[0], out = { sv: VSOL, lv: VLIQ, gv: Math.round(st.lidG * w), mix: 'Add colour to see it spread' };
      if (st.dyed) out.mix = mixed(st.sol, w) + '% · ' + mixed(st.liq, w) + '% · ' + mixed(st.gas, w) + '%';
      return out;
    },
    status: function (sim) {
      var L = lidTargets(sim);
      if (sim.p.squeeze > 0 && L.want < Math.max(L.liq, L.sol)) return 'The piston stops on the liquid and the solid: they can’t be squeezed';
      return sim.running ? 'Running · temperature: ' + HEAT[sim.p.heat] : 'Paused';
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, col = sim.colors, st = sim.state, W = sim.width, H = sim.height, small = W < 560;
      var d = dims(sim), w = d[0], h = d[1], pw = W / 3, fs = small ? 9.5 : 12;
      var top = small ? 30 : 40, bot = H - (small ? 34 : 44);
      var s = Math.min((pw - (small ? 10 : 30)) / 12.5, (bot - top - (small ? 10 : 18)) / 12.5);
      var baseY = top + (bot - top + 12.5 * s) / 2 + (small ? 3 : 6);
      D.clear(ctx, W, H, col.bg);
      var L = lidTargets(sim);
      var panels = [
        { name: 'SOLID', key: 'sol', lid: st.lidS, c: col.s3, l1: 'fixed shape', l2: 'fixed volume' },
        { name: 'LIQUID', key: 'liq', lid: st.lidL, c: col.s1, l1: 'takes the jar’s shape', l2: 'fixed volume' },
        { name: 'GAS', key: 'gas', lid: st.lidG, c: col.s2, l1: 'fills the whole jar', l2: 'can be squeezed' }
      ];
      if (small) panels[1].l1 = 'flows to jar shape';
      panels.forEach(function (P, k) {
        var cx = pw * (k + 0.5), x0 = cx - w * s / 2;
        function X(x) { return x0 + x * s; }
        function Y(y) { return baseY - y * s; }
        D.text(ctx, P.name, cx, small ? 11 : 15, { color: P.c, size: small ? 12 : 15, weight: 800, align: 'center' });
        // container walls
        ctx.save(); ctx.strokeStyle = col.light ? '#64748b' : '#cbd5e1'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(X(0), Y(h + 0.6)); ctx.lineTo(X(0), Y(0)); ctx.lineTo(X(w), Y(0)); ctx.lineTo(X(w), Y(h + 0.6)); ctx.stroke(); ctx.restore();
        // piston
        var ly = Y(P.lid);
        D.roundRect(ctx, X(0) + 1, ly - Math.max(4, s * 0.45), w * s - 2, Math.max(4, s * 0.45), 2, col.light ? '#94a3b8' : '#64748b');
        D.line(ctx, cx, ly - Math.max(4, s * 0.45), cx, Math.min(ly - 6, Y(h + 0.6)) - (small ? 4 : 8), col.light ? '#94a3b8' : '#64748b', small ? 3 : 5);
        if (k < 2 && sim.p.squeeze > 0 && L.want < (k ? L.liq : L.sol) - 0.05) D.text(ctx, 'can’t squeeze!', cx, ly - Math.max(4, s * 0.45) - (small ? 8 : 11), { color: col.danger, size: fs, weight: 800, align: 'center', bg: col.bg, pad: 2, fit: W });
        var arr = st[P.key], rad = function (p) { return (p.rad || 0.5) * s; };
        // bonds in the solid
        if (k === 0) {
          ctx.save(); ctx.strokeStyle = D.alpha(col.s3, 0.35); ctx.lineWidth = 1; ctx.beginPath();
          arr.forEach(function (p, i) { arr.forEach(function (q, j) { if (j > i && Math.hypot(st.sites[i].x - st.sites[j].x, st.sites[i].y - st.sites[j].y) < 1.1) { ctx.moveTo(X(p.x), Y(p.y)); ctx.lineTo(X(q.x), Y(q.y)); } }); });
          ctx.stroke(); ctx.restore();
        }
        // followed particle path
        var fp = [arr[12], arr[7], arr[0]][k];
        if (sim.p.trail && fp.tr.length > 1) {
          ctx.save(); ctx.strokeStyle = col.warning; ctx.lineWidth = small ? 1.5 : 2; ctx.globalAlpha = 0.85; ctx.beginPath();
          fp.tr.forEach(function (q, i) { if (i) ctx.lineTo(X(q.x), Y(q.y)); else ctx.moveTo(X(q.x), Y(q.y)); });
          ctx.lineTo(X(fp.x), Y(fp.y)); ctx.stroke(); ctx.restore();
        }
        arr.forEach(function (p) {
          D.circle(ctx, X(p.x), Y(p.y), rad(p) * 0.92, p.dye ? DYE : P.c, D.alpha(col.light ? '#0f172a' : '#ffffff', 0.35), 1);
        });
        if (sim.p.trail) D.circle(ctx, X(fp.x), Y(fp.y), rad(fp) * 0.95, null, col.warning, small ? 2 : 3);
        // space taken bracket
        D.text(ctx, P.l1, cx, H - (small ? 22 : 28), { color: col.text, size: fs, weight: 700, align: 'center', fit: W });
        D.text(ctx, P.l2, cx, H - (small ? 9 : 11), { color: col.muted, size: fs, align: 'center', fit: W });
      });
    }
  });
})();
