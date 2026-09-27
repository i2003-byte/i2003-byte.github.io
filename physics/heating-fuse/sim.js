/* =====================================================================
   Electricity · Heating Effect & the Fuse — sim.js
   ---------------------------------------------------------------------
   A house circuit at 220 V feeds appliances connected side by side
   (in parallel). Switching on more appliances draws more current:
       current I = total power P ÷ 220 V
   A current heats every wire it passes through (heating effect). The
   fuse wire is thin and melts at a low temperature (~200 °C), so it
   melts first when the current is too large and breaks the circuit.
   Classroom model (not real material data):
     fuse wire   steady temperature = 30 + 170·(I / rating)² °C, τ = 1.5 s
                 → just reaches 200 °C at its rating, melts above it
     house wiring (rated 15 A)  = 30 + 50·(I / 15)² °C, τ = 3 s,
                 insulation starts to burn at 100 °C (fire risk)
     short circuit: live touches neutral, current ≈ 220 V ÷ 0.5 Ω = 440 A
   A thick copper wire used as a "fuse" does not melt, so the house
   wiring overheats instead: this is why that is dangerous.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var V = 220, ROOM = 30, MELT = 200, FIRE = 100, SHORT_I = 440;
  var APPS = [
    { id: 'bulb', name: 'Bulb', icon: '💡', w: 100, hot: true },
    { id: 'fan', name: 'Fan', icon: '🌀', w: 75 },
    { id: 'tv', name: 'TV', icon: '📺', w: 120 },
    { id: 'iron', name: 'Iron', icon: '👕', w: 1000, hot: true },
    { id: 'kettle', name: 'Kettle', icon: '🫖', w: 1500, hot: true },
    { id: 'heater', name: 'Room heater', icon: '🔥', w: 2000, hot: true }
  ];
  var tiles = []; // hit boxes for tapping appliances

  function rating(p) { return p.fuse === 'copper' ? Infinity : +p.fuse; }
  function load(p) { return APPS.reduce(function (sum, a) { return sum + (p[a.id] ? a.w : 0); }, 0); }
  function current(sim) {
    var s = sim.state;
    if (s.melted || s.fire) return 0;
    return s.short ? SHORT_I : load(sim.p) / V;
  }
  function heatColor(T, lo, hi) {
    var k = M.clamp((T - lo) / (hi - lo), 0, 1);
    return 'rgb(' + Math.round(M.lerp(120, 255, Math.min(1, k * 1.6))) + ',' + Math.round(M.lerp(120, 210, Math.max(0, k * 2 - 1))) + ',' + Math.round(M.lerp(130, 40, k)) + ')';
  }

  var params = [
    { id: 'fuse', label: 'Fuse fitted', type: 'select', value: '10', options: [
      { value: '5', label: '5 A fuse (lights circuit)' }, { value: '10', label: '10 A fuse' },
      { value: '15', label: '15 A fuse (power circuit)' }, { value: 'copper', label: 'Thick copper wire (unsafe!)' }],
      help: 'Changing the fuse fits a fresh one.' }
  ].concat(APPS.map(function (a) {
    return { id: a.id, label: a.icon + ' ' + a.name + ' (' + a.w + ' W)', type: 'toggle', value: a.id === 'bulb' || a.id === 'fan' };
  }));

  SimLab.createSim({
    ariaLabel: 'A house circuit with a fuse and six appliances; the fuse wire heats up and melts when too much current flows',
    autoplay: true,
    mobileAspect: '4 / 5',
    params: params,
    paramsTitle: 'Fuse and appliances',
    buttonsTitle: 'Faults',
    buttons: [
      { label: '⚡ Cause a short circuit', onClick: function (sim) {
        if (sim.state.melted || sim.state.fire) { sim.toast('Fix the fault first'); return; }
        sim.state.short = true; sim.play();
      } },
      { label: '🔧 Fix fault & replace fuse', primary: true, onClick: function (sim) { sim.reset(); sim.play(); sim.toast('New fuse fitted'); } }
    ],
    readouts: [
      { id: 'P', label: 'Power switched on', unit: 'W', digits: 0 },
      { id: 'I', label: 'Current I = P ÷ 220 V', unit: 'A', digits: 1, key: true },
      { id: 'Tf', label: 'Fuse wire temperature', unit: '°C', digits: 0 },
      { id: 'Tw', label: 'House wiring temperature', unit: '°C', digits: 0 },
      { id: 'st', label: 'Status', key: true }
    ],
    graph: { title: 'Temperature (fuse melts at 200 °C, wiring burns at 100 °C)', yLabel: '°C', window: 30, yMin: 0, yMax: 220,
      series: [{ label: 'Fuse wire', color: '--sim-3' }, { label: 'Wiring', color: '--sim-2' }] },
    onParam: function (sim, id) {
      if (id === 'fuse') return false; // a fresh fuse: restart
      if (!sim.running && !sim.state.fire) sim.play();
      return true;
    },
    reset: function (sim) { sim.state = { Tf: ROOM, Tw: ROOM, melted: false, fire: false, short: false }; },
    update: function (sim, dt) {
      var s = sim.state, I = current(sim), r = rating(sim.p);
      // a thick copper wire behaves like a 60 A fuse that never melts
      var TfSS = s.melted ? ROOM : isFinite(r) ? ROOM + 170 * Math.pow(I / r, 2) : ROOM + 150 * Math.pow(Math.min(I, 60) / 60, 2);
      s.Tf += (TfSS - s.Tf) * Math.min(1, dt / 1.5);
      if (!s.melted && isFinite(r) && s.Tf >= MELT) { s.Tf = MELT; s.melted = true; sim.toast('💥 Fuse melted! The circuit is broken, so the current stops.'); }
      s.Tw += (ROOM + 50 * Math.pow(I / 15, 2) - s.Tw) * Math.min(1, dt / 3);
      if (s.Tw >= FIRE) { s.Tw = FIRE; s.fire = true; }
    },
    finished: function (sim) { return sim.state.fire; },
    onFinish: function (sim) { sim.toast('🔥 The wiring is burning! A proper fuse would have melted first.'); },
    sample: function (sim) { return [sim.state.Tf, sim.state.Tw]; },
    status: function (sim) { return statusText(sim) + ' · t = ' + M.fmt(sim.time, 1) + ' s'; },
    readout: function (sim) {
      var s = sim.state;
      return { P: s.melted || s.fire ? 0 : load(sim.p), I: current(sim), Tf: s.Tf, Tw: s.Tw, st: statusText(sim) };
    },
    pointer: {
      down: function (sim, x, y) {
        var t = hit(x, y); if (!t) return false;
        sim.setParam(t.id, !sim.p[t.id], true); return true;
      },
      hover: function (sim, x, y) { return !!hit(x, y); }
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, p = sim.p;
      D.clear(ctx, W, H, c.bg);
      var wide = W >= 560, I = current(sim), powered = !s.melted && !s.fire;
      var live = c.danger, neutral = c.light ? '#1e293b' : '#94a3b8';

      // fuse box area
      var fx = wide ? 16 : 12, fy = wide ? 24 : 12, fw = wide ? W * 0.34 : W - 24, fh = wide ? H - 48 : H * 0.36;
      D.roundRect(ctx, fx, fy, fw, fh, 12, D.alpha(c.muted, 0.08), D.alpha(c.muted, 0.3), 1);
      D.text(ctx, '220 V mains → fuse', fx + 12, fy + 16, { color: c.ink, size: 13, weight: 700 });
      // porcelain fuse carrier
      var cx = fx + fw / 2, cy = fy + fh * (wide ? 0.36 : 0.5), cw = Math.min(fw * 0.78, 220), ch = 44;
      D.roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 8, c.light ? '#f5f5f4' : '#e7e5e4', '#a8a29e', 1.5);
      D.roundRect(ctx, cx - cw / 2 + 6, cy - 8, 18, 16, 3, '#b45309');
      D.roundRect(ctx, cx + cw / 2 - 24, cy - 8, 18, 16, 3, '#b45309');
      var wx0 = cx - cw / 2 + 24, wx1 = cx + cw / 2 - 24, copper = p.fuse === 'copper';
      var wcol = copper ? '#b87333' : heatColor(s.Tf, ROOM, MELT);
      if (!copper && s.Tf > 90 && !s.melted) { // glow
        var gl = ctx.createRadialGradient(cx, cy, 2, cx, cy, cw / 2);
        gl.addColorStop(0, 'rgba(251,146,60,' + M.clamp((s.Tf - 90) / 200, 0, 0.55) + ')'); gl.addColorStop(1, 'rgba(251,146,60,0)');
        ctx.fillStyle = gl; ctx.fillRect(cx - cw / 2, cy - ch, cw, ch * 2);
      }
      if (s.melted) {
        D.line(ctx, wx0, cy, cx - 12, cy + 3, wcol, 2); D.line(ctx, cx + 12, cy + 3, wx1, cy, wcol, 2);
        D.circle(ctx, cx - 10, cy + 6, 3, '#9ca3af'); D.circle(ctx, cx + 9, cy + 7, 2.5, '#9ca3af'); D.circle(ctx, cx, cy + 12, 2, '#9ca3af');
      } else D.line(ctx, wx0, cy, wx1, cy, wcol, copper ? 6 : 2);
      D.text(ctx, copper ? 'thick copper wire' : p.fuse + ' A fuse wire', cx, cy - ch / 2 - 12, { color: copper ? c.warning : c.muted, size: 12, weight: 600, align: 'center', fit: W });
      D.text(ctx, s.melted ? 'MELTED: circuit broken' : M.fmt(s.Tf, 0) + ' °C', cx, cy + ch / 2 + 14, { color: s.melted ? c.danger : c.ink, size: 13, weight: 700, align: 'center', font: s.melted ? undefined : c.mono, fit: W });
      // ammeter line
      var ay = wide ? fy + fh * 0.62 : fy + fh - 28;
      D.text(ctx, 'Current', wide ? cx : fx + 14, ay, { color: c.muted, size: 12, align: wide ? 'center' : 'left' });
      D.text(ctx, M.fmt(I, 1) + ' A', wide ? cx : fx + 70, wide ? ay + 26 : ay, { color: I > rating(p) ? c.danger : c.accent, size: wide ? 28 : 18, weight: 700, align: wide ? 'center' : 'left', font: c.mono });
      if (wide) D.text(ctx, isFinite(rating(p)) ? 'safe up to ' + p.fuse + ' A' : 'no safe limit!', cx, ay + 52, { color: c.faint, size: 12, align: 'center' });
      if (s.short && powered) D.text(ctx, '⚡ SHORT CIRCUIT', wide ? cx : fx + fw - 12, wide ? fy + fh - 22 : ay, { color: c.danger, size: 13, weight: 800, align: wide ? 'center' : 'right' });

      // appliances in parallel
      var gx = wide ? fx + fw + 20 : 12, gy = wide ? 24 : fy + fh + 14, gw = wide ? W - gx - 16 : W - 24, gh = wide ? H - 48 : H - gy - 12;
      var cols = 3, rowsN = 2, tw = (gw - 12 * (cols - 1)) / cols, th = (gh - 30 - 12) / rowsN;
      D.line(ctx, gx, gy + 6, gx + gw, gy + 6, powered ? live : D.alpha(live, 0.35), 3);
      D.line(ctx, gx, gy + gh - 2, gx + gw, gy + gh - 2, neutral, 3);
      if (wide) { D.line(ctx, fx + fw, cy, gx, gy + 6, powered ? live : D.alpha(live, 0.35), 3); }
      D.text(ctx, 'live', gx + gw, gy - 6, { color: live, size: 10, align: 'right' });
      D.text(ctx, 'neutral', gx + gw, gy + gh + 8, { color: neutral, size: 10, align: 'right' });
      tiles = [];
      APPS.forEach(function (a, i) {
        var tx = gx + (i % cols) * (tw + 12), ty = gy + 18 + Math.floor(i / cols) * (th + 12), on = p[a.id], run = on && powered;
        tiles.push({ id: a.id, x: tx, y: ty, w: tw, h: th });
        D.line(ctx, tx + tw / 2, gy + 6, tx + tw / 2, ty, run ? live : D.alpha(c.muted, 0.4), 2);
        D.roundRect(ctx, tx, ty, tw, th, 10, run ? D.alpha(a.hot ? '#f97316' : c.s1, 0.16) : D.alpha(c.muted, 0.07), run ? (a.hot ? '#f97316' : c.s1) : D.alpha(c.muted, 0.3), run ? 2 : 1);
        var ix = tx + tw / 2, iy = ty + th * 0.4, isz = Math.min(28, th * 0.34);
        if (run && a.hot) { // heating effect: glowing element
          var g2 = ctx.createRadialGradient(ix, iy, 2, ix, iy, isz * 1.3);
          g2.addColorStop(0, a.id === 'bulb' ? 'rgba(253,224,71,0.7)' : 'rgba(239,68,68,0.6)'); g2.addColorStop(1, 'rgba(239,68,68,0)');
          ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(ix, iy, isz * 1.3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.save(); ctx.globalAlpha = on ? 1 : 0.45;
        if (a.id === 'fan' && run && !sim.reduceMotion) { ctx.translate(ix, iy); ctx.rotate(now / 120); ctx.translate(-ix, -iy); }
        D.text(ctx, a.icon, ix, iy, { size: isz, align: 'center' });
        ctx.restore();
        D.text(ctx, a.name, ix, ty + th * 0.72, { color: c.ink, size: wide ? 12 : 11, weight: 600, align: 'center', fit: W });
        D.text(ctx, a.w + ' W · ' + (on ? 'ON' : 'off'), ix, ty + th * 0.88, { color: on ? (run ? c.success : c.faint) : c.faint, size: 10, align: 'center', fit: W });
      });
      if (!powered) D.text(ctx, s.fire ? '🔥 Wiring on fire! Switch off and fix the fault' : 'No power: the fuse has melted', gx + gw / 2, gy + gh / 2 + 6, { color: s.fire ? c.danger : c.warning, size: wide ? 14 : 12, weight: 700, align: 'center', bg: c.bg, pad: 6, fit: W });
    }
  });

  function hit(x, y) { return tiles.filter(function (t) { return x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h; })[0]; }

  function statusText(sim) {
    var s = sim.state, I = current(sim), r = rating(sim.p);
    if (s.fire) return 'Wiring overheated: fire risk';
    if (s.melted) return 'Fuse melted: circuit broken';
    if (s.short) return 'Short circuit!';
    if (I > r) return 'Overload: fuse heating up';
    if (I > 15) return 'Overload: wiring heating up';
    return 'Working safely';
  }
})();
