/* =====================================================================
   Heat · Sea and Land Breezes — sim.js
   ---------------------------------------------------------------------
   Land heats up and cools down much faster than water.
     DAY:   land hotter → air over land rises → cooler air from the sea
            flows in to replace it = SEA BREEZE (sea → land).
     NIGHT: land cooler → air over the sea is warmer and rises → air
            flows from land to sea = LAND BREEZE (land → sea).
   Temperatures (typical coastal day, °C, h = hour):
     land = 26 + 8·sin(2π(h − 8)/24)       (big swing, peaks ~2 pm)
     sea  = 26.5 + 1·sin(2π(h − 12)/24)    (small swing, lags behind)
   The air circulation is one convection cell whose strength and
   direction follow (land − sea).
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var HOURS_PER_S = 0.7, NA = 70;

  function landT(h) { return 26 + 8 * Math.sin(2 * Math.PI * (h - 8) / 24); }
  function seaT(h) { return 26.5 + 1 * Math.sin(2 * Math.PI * (h - 12) / 24); }
  function clock(h) {
    var hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60 / 10) * 10;
    return (hh % 12 === 0 ? 12 : hh % 12) + ':' + (mm < 10 ? '0' : '') + mm + (hh < 12 ? ' am' : ' pm');
  }
  function breeze(h) {
    var d = landT(h) - seaT(h);
    return Math.abs(d) < 0.6 ? 'Calm' : d > 0 ? 'Sea breeze (sea → land)' : 'Land breeze (land → sea)';
  }
  function isDay(h) { return h >= 6 && h < 18.5; }

  SimLab.createSim({
    ariaLabel: 'A coast with land on the left and sea on the right; air circulates between them as the day turns to night',
    autoplay: true,
    mobileAspect: '4 / 3.8',
    params: [
      { id: 'hour', label: 'Time of day', min: 0, max: 23.5, step: 0.5, value: 13, format: clock,
        presets: [{ label: '6 am', value: 6 }, { label: 'Noon', value: 12 }, { label: '3 pm', value: 15 }, { label: '9 pm', value: 21 }, { label: '3 am', value: 3 }] }
    ],
    readouts: [
      { id: 'time', label: 'Time', key: true },
      { id: 'land', label: 'Land', unit: '°C', digits: 1 },
      { id: 'sea', label: 'Sea', unit: '°C', digits: 1 },
      { id: 'b', label: 'Wind', key: true }
    ],
    graph: { title: 'Surface temperature through the day', yLabel: '°C', series: [{ label: 'land' }, { label: 'sea' }], window: 35 },
    onParam: function (sim, id, v) { sim.state.hour = v; return true; },
    reset: function (sim) {
      var r = M.rng(5), air = [];
      for (var i = 0; i < NA; i++) air.push({ x: 0.03 + r() * 0.94, y: 0.03 + r() * 0.94 });
      sim.state = { hour: sim.p.hour, air: air, A: 0, rand: r };
      sim.state.A = (landT(sim.p.hour) - seaT(sim.p.hour)) * 0.012;
    },
    update: function (sim, dt) {
      var s = sim.state, r = s.rand;
      var before = Math.round(s.hour * 2);
      s.hour = (s.hour + HOURS_PER_S * dt) % 24;
      if (Math.round(s.hour * 2) !== before) sim.setParam('hour', (Math.round(s.hour * 2) / 2) % 24);
      s.A += ((landT(s.hour) - seaT(s.hour)) * 0.012 - s.A) * dt;
      var pi = Math.PI;
      s.air.forEach(function (p) { // same circulation cell as convection; rises on the warmer side
        var u = -s.A * pi * Math.sin(pi * p.x) * Math.cos(pi * p.y), v = s.A * pi * Math.cos(pi * p.x) * Math.sin(pi * p.y);
        p.x = M.clamp(p.x + u * dt + (r() - 0.5) * 0.003, 0.01, 0.99);
        p.y = M.clamp(p.y + v * dt + (r() - 0.5) * 0.003, 0.01, 0.99);
      });
    },
    sample: function (sim) { return [landT(sim.state.hour), seaT(sim.state.hour)]; },
    readout: function (sim) {
      var h = sim.state.hour;
      return { time: clock(h) + (isDay(h) ? ' ☀️' : ' 🌙'), land: landT(h), sea: seaT(h), b: breeze(h) };
    },
    status: function (sim) { return clock(sim.state.hour) + ' · ' + breeze(sim.state.hour); },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, s = sim.state, h = s.hour, narrow = W < 520;
      var day = isDay(h), ground = H * 0.7, coast = W * 0.46, top = narrow ? 58 : 70;
      D.clear(ctx, W, H, c.bg);
      // sky tint
      var light = Math.max(0, Math.sin(Math.PI * (h - 6) / 12.5));
      ctx.fillStyle = D.alpha('#38bdf8', 0.05 + 0.25 * light); ctx.fillRect(0, 0, W, ground);
      // sun or moon on an arc
      var f = day ? (h - 6) / 12.5 : ((h + 24 - 18.5) % 24) / 11.5;
      var ox = M.lerp(24, W - 24, f), oy = top - 10 + (1 - Math.sin(Math.PI * f)) * (narrow ? 20 : 34) - (narrow ? 26 : 34);
      D.text(ctx, day ? '☀️' : '🌙', ox, Math.max(16, oy), { size: narrow ? 20 : 28, align: 'center' });

      // land and sea
      ctx.fillStyle = '#7c5a35'; ctx.fillRect(0, ground, coast, H - ground);
      ctx.fillStyle = '#4d7c0f'; ctx.fillRect(0, ground, coast, 6);
      ctx.fillStyle = '#1d4ed8'; ctx.fillRect(coast, ground + 4, W - coast, H - ground - 4);
      var wv = sim.reduceMotion ? 0 : now / 400;
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (var x = coast; x <= W; x += 4) { var y = ground + 4 + Math.sin(x / 14 + wv) * 2; if (x === coast) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
      D.text(ctx, '🏠', coast * 0.3, ground - (narrow ? 10 : 14), { size: narrow ? 18 : 26, align: 'center' });
      D.text(ctx, '🌴', coast * 0.75, ground - (narrow ? 12 : 16), { size: narrow ? 20 : 30, align: 'center' });
      D.text(ctx, '⛵', coast + (W - coast) * 0.6, ground - (narrow ? 6 : 10), { size: narrow ? 16 : 24, align: 'center' });

      // surface temperatures
      var lt = landT(h), st = seaT(h), landHot = lt > st;
      D.text(ctx, 'LAND ' + M.fmt(lt, 1) + ' °C', coast / 2, ground + (H - ground) / 2, { color: '#fff', size: narrow ? 12 : 15, weight: 700, align: 'center' });
      D.text(ctx, 'SEA ' + M.fmt(st, 1) + ' °C', coast + (W - coast) / 2, ground + (H - ground) / 2, { color: '#fff', size: narrow ? 12 : 15, weight: 700, align: 'center' });
      if (Math.abs(lt - st) >= 0.6) {
        D.text(ctx, 'warmer', landHot ? coast / 2 : coast + (W - coast) / 2, ground + (H - ground) / 2 + (narrow ? 16 : 20),
          { color: '#fde68a', size: 11, weight: 600, align: 'center' });
      }

      // air particles
      var ax0 = W * 0.03, ax1 = W * 0.97, ay0 = top, ay1 = ground - 6;
      function X(x) { return M.lerp(ax0, ax1, x); }
      function Y(y) { return M.lerp(ay1, ay0, y); }
      s.air.forEach(function (p) { D.circle(ctx, X(p.x), Y(p.y), narrow ? 2 : 2.6, D.alpha(c.ink, 0.45)); });

      // circulation arrows
      if (Math.abs(s.A) > 0.004) {
        var col = D.alpha(landHot ? c.warning : c.s1, M.clamp(Math.abs(s.A) * 10, 0.35, 1)), hot = landHot ? 0.2 : 0.8, cold = 1 - hot;
        D.arrow(ctx, X(hot), Y(0.3), X(hot), Y(0.72), col, 3, 11);
        D.arrow(ctx, X(hot), Y(0.86), X(cold), Y(0.86), D.alpha(col, 0.6), 2, 9);
        D.arrow(ctx, X(cold), Y(0.72), X(cold), Y(0.3), D.alpha(col, 0.6), 2, 9);
        D.arrow(ctx, X(cold), Y(0.1), X(hot), Y(0.1), col, 4, 13);
        D.text(ctx, 'warm air rises', X(hot), Y(0.79), { color: c.ink, size: narrow ? 10 : 12, weight: 600, align: 'center', fit: W });
        D.text(ctx, landHot ? '← SEA BREEZE' : 'LAND BREEZE →', W / 2, Y(0.45),
          { color: c.bg, bg: landHot ? c.warning : c.s1, size: narrow ? 12 : 14, weight: 700, align: 'center', pad: 5 });
      } else D.text(ctx, 'Calm — land and sea are about the same temperature', W / 2, Y(0.5), { color: c.muted, size: 12, align: 'center', fit: W });

      D.text(ctx, clock(h), W - 12, 18, { color: c.ink, size: narrow ? 13 : 15, weight: 700, align: 'right' });
    }
  });
})();
