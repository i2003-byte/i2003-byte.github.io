/* =====================================================================
   Landforms · Finding an Earthquake's Epicentre — sim.js
   ---------------------------------------------------------------------
   An earthquake strikes somewhere in or near India. Three seismograph
   stations record the shaking. Each trace shows
     P waves (fastest, small)      vp = 8.0 km/s
     S waves (slower, bigger)      vs = 4.5 km/s
     surface waves (slowest, biggest) 3.5 km/s
   The gap between the P and S arrivals grows with distance:
     S − P = d / vs − d / vp   →   d = (S − P) × vp·vs / (vp − vs)
                                     = (S − P) × 10.3 km/s
   A circle of radius d round each station: the epicentre lies on all
   three, so they meet at one point (trilateration).
   Simple model: straight paths at constant speeds through the top of
   the mantle (real regional waves are close to these speeds), a flat
   map with x = (longitude − 80°) × 111.32 km × cos 24°, y = latitude
   × 110.57 km, and shaking that fades with distance. The outline of
   India is rough. 1 s of real time is 20 s after the quake.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var KX = 111.32 * Math.cos(24 * Math.PI / 180), KY = 110.57, VP = 8.0, VS = 4.5, VL = 3.5, K = VP * VS / (VP - VS);
  var SEC_PER_S = 20, mystery = null;
  var INDIA = [
    [23.6, 68.2], [24.3, 68.8], [24.5, 71.1], [25.4, 70.3], [26.3, 70.0], [27.0, 69.6], [28.0, 70.5], [29.0, 71.9], [30.0, 73.4], [31.0, 74.6],
    [32.4, 74.6], [33.0, 73.7], [34.0, 73.5], [35.0, 72.7], [36.0, 71.8], [36.8, 72.6], [37.1, 74.5], [36.4, 75.8], [35.6, 77.8], [35.4, 79.0],
    [35.6, 80.2], [34.4, 80.0], [33.0, 79.5], [32.4, 78.8], [31.4, 78.8], [30.4, 80.4], [30.0, 81.0], [28.8, 80.2], [28.4, 81.2], [27.6, 83.3],
    [27.3, 84.6], [26.6, 85.8], [26.4, 87.3], [26.4, 88.1], [27.1, 88.0], [28.1, 88.8], [27.4, 88.9], [26.9, 89.4], [26.8, 92.0], [27.8, 91.7],
    [28.0, 93.0], [28.6, 94.4], [29.3, 95.5], [29.4, 96.2], [28.3, 97.3], [27.6, 97.1], [27.0, 96.2], [26.5, 95.3], [25.6, 95.0], [24.6, 94.6],
    [24.0, 94.2], [23.2, 93.5], [22.2, 93.2], [21.95, 92.7], [22.9, 92.3], [23.6, 92.0], [23.0, 91.5], [24.1, 91.3], [24.6, 92.2], [25.2, 92.4],
    [25.2, 90.0], [25.9, 89.85], [26.3, 89.3], [26.2, 88.5], [25.5, 88.1], [24.9, 88.2], [24.3, 88.6], [23.3, 88.6], [22.9, 88.9], [21.6, 89.0],
    [21.6, 87.6], [21.4, 87.0], [20.3, 86.7], [19.3, 85.0], [17.7, 83.3], [16.7, 82.3], [16.3, 81.3], [15.6, 80.2], [14.5, 80.2], [13.4, 80.3],
    [12.0, 79.9], [10.3, 79.9], [9.3, 79.2], [8.8, 78.2], [8.1, 77.5], [8.9, 76.5], [10.0, 76.2], [11.3, 75.7], [12.9, 74.8], [14.8, 74.1],
    [16.9, 73.3], [18.9, 72.8], [20.7, 72.9], [21.7, 72.6], [22.3, 72.3], [21.6, 72.1], [20.8, 70.9], [21.6, 69.3], [22.4, 69.0], [22.9, 70.3],
    [23.0, 69.0]
  ];
  var LANKA = [[9.8, 80.1], [8.5, 81.2], [6.9, 81.9], [6.0, 80.6], [6.5, 79.9], [8.0, 79.8]];
  var CITY = {
    delhi: ['New Delhi', 28.61, 77.21], mumbai: ['Mumbai', 19.08, 72.88], kolkata: ['Kolkata', 22.57, 88.36], chennai: ['Chennai', 13.08, 80.27],
    bengaluru: ['Bengaluru', 12.97, 77.59], hyderabad: ['Hyderabad', 17.39, 78.49], bhopal: ['Bhopal', 23.26, 77.41], guwahati: ['Guwahati', 26.14, 91.74],
    jaipur: ['Jaipur', 26.91, 75.79], srinagar: ['Srinagar', 34.08, 74.8], bbsr: ['Bhubaneswar', 20.3, 85.82], tvm: ['Thiruvananthapuram', 8.52, 76.94]
  };
  var QUAKE = {
    bhuj: ['Bhuj, Gujarat (2001)', 23.42, 70.23],
    latur: ['Latur, Maharashtra (1993)', 18.07, 76.62],
    uttarkashi: ['Uttarkashi, Uttarakhand (1991)', 30.78, 78.77],
    nepal: ['Gorkha, Nepal (2015)', 28.23, 84.73],
    shillong: ['Shillong plateau, Meghalaya (1897)', 25.8, 91.0],
    mystery: ['Mystery quake', 0, 0]
  };
  var cityOpts = Object.keys(CITY).map(function (k) { return { value: k, label: CITY[k][0] }; });

  function km(lat, lon) { return [(lon - 80) * KX, -lat * KY]; }
  function hash(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }
  function insideIndia(q) {
    var inside = false, P = INDIA.map(function (p) { return km(p[0], p[1]); });
    for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
      if ((P[i][1] > q[1]) !== (P[j][1] > q[1]) && q[0] < (P[j][0] - P[i][0]) * (q[1] - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) inside = !inside;
    }
    return inside;
  }
  // a seismogram, one sample a second
  function trace(d, seed, END) {
    var tp = d / VP, ts = d / VS, tl = d / VL, A = 1 / (1 + d / 400), out = [];
    for (var t = 0; t <= END; t++) {
      var n = (hash(t, seed) * 2 - 1), v = n * 0.04;
      if (t >= tp) v += n * 0.32 * A * Math.exp(-(t - tp) / 25);
      if (t >= ts) v += (hash(t + 999, seed) * 2 - 1) * 0.75 * A * Math.exp(-(t - ts) / 35);
      if (t >= tl) v += Math.sin(2 * Math.PI * (t - tl) / 16) * 0.95 * A * Math.exp(-(t - tl) / 70) * Math.min(1, (t - tl) / 10);
      out.push(M.clamp(v, -1, 1));
    }
    return { tp: tp, ts: ts, tl: tl, gap: Math.round(ts - tp), d: d, y: out };
  }
  function layout(W, H) {
    var narrow = W < 560, top = narrow ? 30 : 38, wide = W > H * 1.15;
    var x0 = km(37.5, 66.5)[0], x1 = km(6, 98)[0], y0 = km(37.5, 80)[1], y1 = km(6, 80)[1];
    var mw, mh, mx, my, tr;
    if (wide) { mw = W * 0.46; mh = H - top - 10; mx = 8; my = top + 4; tr = { x: mx + mw + 14, y: top + 6, w: W - mx - mw - 22, h: H - top - 14 }; }
    else { mw = W - 16; mh = (H - top) * 0.54; mx = 8; my = top + 2; tr = { x: 8, y: my + mh + 8, w: W - 16, h: H - my - mh - 12 }; }
    var k = Math.min(mw / (x1 - x0), mh / (y1 - y0));
    var ox = mx + (mw - (x1 - x0) * k) / 2 - x0 * k, oy = my + (mh - (y1 - y0) * k) / 2 - y0 * k;
    return { narrow: narrow, top: top, k: k, mx: mx, my: my, mw: mw, mh: mh, tr: tr, P: function (q) { return [ox + q[0] * k, oy + q[1] * k]; }, inv: function (x, y) { return [(x - ox) / k, (y - oy) / k]; } };
  }

  SimLab.createSim({
    ariaLabel: 'A map of India with three seismograph stations and their seismograms; the gap between P and S waves gives each station its distance from the earthquake, and three distance circles meet at the epicentre',
    playLabel: 'Start the earthquake',
    mobileAspect: '3 / 3.8',
    params: [
      { id: 'quake', label: 'Earthquake', type: 'select', value: 'bhuj', options: Object.keys(QUAKE).map(function (k) { return { value: k, label: QUAKE[k][0] }; }) },
      { id: 's1', label: 'Station A', type: 'select', value: 'delhi', options: cityOpts },
      { id: 's2', label: 'Station B', type: 'select', value: 'mumbai', options: cityOpts },
      { id: 's3', label: 'Station C', type: 'select', value: 'hyderabad', options: cityOpts },
      { id: 'waves', label: 'Show the waves on the map', type: 'toggle', value: false }
    ],
    readouts: [
      { id: 'time', label: 'Time after the quake', short: 'Time', unit: 's', digits: 0 },
      { id: 'a', label: 'Station A: S − P → distance', short: 'A', key: true },
      { id: 'b', label: 'Station B: S − P → distance', short: 'B', key: true },
      { id: 'c', label: 'Station C: S − P → distance', short: 'C', key: true },
      { id: 'guess', label: 'Your guess is off by', unit: 'km', digits: 0 }
    ],
    pointer: {
      down: function (sim, x, y) {
        var L = sim.state.L; if (!L || x < L.mx || x > L.mx + L.mw || y < L.my || y > L.my + L.mh) return false;
        sim.state.guess = L.inv(x, y); return true;
      },
      hover: function (sim, x, y) { var L = sim.state.L; return L && x > L.mx && x < L.mx + L.mw && y > L.my && y < L.my + L.mh; }
    },

    buttons: [{ label: 'New mystery quake', onClick: function (sim) { newMystery(); if (sim.p.quake !== 'mystery') sim.setParam('quake', 'mystery'); sim.reset(); } }],

    reset: function (sim) {
      var p = sim.p, q = QUAKE[p.quake] || QUAKE.bhuj, ep;
      if (p.quake === 'mystery') { if (!mystery) newMystery(); ep = mystery; } else ep = km(q[1], q[2]);
      var dist = [p.s1, p.s2, p.s3].map(function (id) { var cty = CITY[id] || CITY.delhi, pos = km(cty[1], cty[2]); return Math.max(20, Math.hypot(pos[0] - ep[0], pos[1] - ep[1])); });
      var end = Math.max(600, Math.ceil(Math.max.apply(null, dist) / VS / 60) * 60 + 60);
      var st = sim.state = { sec: 0, end: end, ep: ep, guess: null, L: sim.state && sim.state.L };
      st.stn = [p.s1, p.s2, p.s3].map(function (id, i) {
        var cty = CITY[id] || CITY.delhi, pos = km(cty[1], cty[2]);
        var tr = trace(dist[i], i + 1 + Math.round(ep[0]) % 97, end);
        tr.name = cty[0]; tr.pos = pos; tr.dEst = tr.gap * K;
        return tr;
      });
    },
    update: function (sim, dt) { var st = sim.state; if (st.sec < st.end) st.sec = Math.min(st.end, st.sec + dt * SEC_PER_S); },
    finished: function (sim) { return sim.state.sec >= sim.state.end; },
    readout: function (sim) {
      var st = sim.state, o = { time: st.sec };
      ['a', 'b', 'c'].forEach(function (k, i) {
        var s = st.stn[i];
        o[k] = st.sec >= s.ts ? s.gap + ' s → ' + Math.round(s.dEst / 10) * 10 + ' km' : st.sec >= s.tp ? 'P arrived…' : 'waiting';
      });
      o.guess = st.guess && revealed(st) ? Math.hypot(st.guess[0] - st.ep[0], st.guess[1] - st.ep[1]) : '—';
      return o;
    },
    status: function (sim) {
      var st = sim.state, got = st.stn.filter(function (s) { return st.sec >= s.ts; }).length;
      if (st.sec <= 0) return 'Where did it happen? Tap the map to guess, then press Start';
      if (revealed(st)) return 'The three circles meet at the epicentre: ' + (sim.p.quake === 'mystery' ? 'mystery solved' : QUAKE[sim.p.quake][0]);
      return got ? got + ' of 3 stations have their S waves: one circle each' : 'Waves on the way…';
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, st = sim.state, p = sim.p, W = sim.width, H = sim.height;
      var L = st.L = layout(W, H), fs = L.narrow ? 10.5 : 12.5, show = revealed(st);
      D.clear(ctx, W, H, c.bg);
      // map
      D.roundRect(ctx, L.mx, L.my, L.mw, L.mh, 8, c.light ? '#dbeafe' : '#0c1a2e');
      ctx.save(); ctx.beginPath(); ctx.rect(L.mx, L.my, L.mw, L.mh); ctx.clip();
      function shape(pts, fill) {
        ctx.beginPath();
        pts.forEach(function (q, i) { var a = L.P(km(q[0], q[1])); if (i) ctx.lineTo(a[0], a[1]); else ctx.moveTo(a[0], a[1]); });
        ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = c.light ? '#78716c' : '#a8a29e'; ctx.lineWidth = 1; ctx.stroke();
      }
      shape(INDIA, c.light ? '#fef3c7' : '#3f4d2e');
      shape(LANKA, c.light ? '#e7e5e4' : '#334155');
      var e = L.P(st.ep), colP = c.light ? '#1d4ed8' : '#7dd3fc', colS = c.light ? '#dc2626' : '#fca5a5';
      if (p.waves && st.sec > 0) {
        D.circle(ctx, e[0], e[1], VP * st.sec * L.k, null, D.alpha(colP, 0.8), 2);
        D.circle(ctx, e[0], e[1], VS * st.sec * L.k, null, D.alpha(colS, 0.8), 2);
      }
      var cols = [c.s1, c.s2, c.s4];
      st.stn.forEach(function (s, i) {
        if (st.sec < s.ts) return;
        var a = L.P(s.pos), grow = Math.min(1, (st.sec - s.ts) / 30);
        D.circle(ctx, a[0], a[1], s.dEst * L.k * grow, D.alpha(cols[i], 0.07), cols[i], 2);
      });
      st.stn.forEach(function (s, i) {
        var a = L.P(s.pos), r = 6, hit = st.sec >= s.tp;
        ctx.beginPath(); ctx.moveTo(a[0], a[1] - r); ctx.lineTo(a[0] + r, a[1] + r * 0.7); ctx.lineTo(a[0] - r, a[1] + r * 0.7); ctx.closePath();
        ctx.fillStyle = cols[i]; ctx.fill(); ctx.strokeStyle = hit ? c.ink : D.alpha(c.ink, 0.4); ctx.lineWidth = hit ? 2 : 1; ctx.stroke();
        D.text(ctx, 'ABC'[i] + ' ' + s.name, a[0] + 8, a[1] - 8, { color: c.text, size: fs - 1, weight: 700, bg: D.alpha(c.bg, 0.7), pad: 2, fit: L.mx + L.mw });
      });
      if (st.guess) {
        var g = L.P(st.guess);
        D.line(ctx, g[0] - 7, g[1] - 7, g[0] + 7, g[1] + 7, c.ink, 2.5); D.line(ctx, g[0] - 7, g[1] + 7, g[0] + 7, g[1] - 7, c.ink, 2.5);
        D.text(ctx, 'your guess', g[0] + 9, g[1] + 10, { color: c.ink, size: fs - 1.5, fit: L.mx + L.mw });
      }
      if (show || (p.waves && st.sec > 0)) {
        ctx.save(); ctx.translate(e[0], e[1]); ctx.fillStyle = '#facc15'; ctx.strokeStyle = '#78350f'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (var i = 0; i < 10; i++) { var an = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 4.5 : 10; ctx.lineTo(Math.cos(an) * rad, Math.sin(an) * rad); }
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        if (show) D.text(ctx, p.quake === 'mystery' ? 'Epicentre' : QUAKE[p.quake][0], e[0], e[1] + 18, { color: c.text, size: fs - 0.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), pad: 3, fit: L.mx + L.mw });
      }
      ctx.restore();
      // scale bar
      var sb = 500 * L.k;
      D.line(ctx, L.mx + 10, L.my + L.mh - 12, L.mx + 10 + sb, L.my + L.mh - 12, c.ink, 2);
      D.text(ctx, '500 km', L.mx + 10 + sb / 2, L.my + L.mh - 22, { color: c.muted, size: fs - 2, align: 'center' });

      // seismograms
      var tr = L.tr, rowH = tr.h / 3, sx = tr.x + (L.narrow ? 4 : 8), sw = tr.w - (L.narrow ? 8 : 16), kx = sw / st.end;
      st.stn.forEach(function (s, i) {
        var y0 = tr.y + rowH * i, mid = y0 + rowH * (L.narrow ? 0.6 : 0.58), amp = rowH * (L.narrow ? 0.24 : 0.34);
        D.roundRect(ctx, tr.x, y0 + 2, tr.w, rowH - 4, 6, D.alpha(c.ink, 0.04), D.alpha(cols[i], 0.6), 1);
        D.text(ctx, 'ABC'[i] + ' · ' + s.name + ' seismograph', tr.x + 8, y0 + 12, { color: c.text, size: fs - 1, weight: 700 });
        D.line(ctx, sx, mid, sx + sw, mid, D.alpha(c.ink, 0.15), 1);
        ctx.save(); ctx.strokeStyle = c.ink; ctx.lineWidth = 1; ctx.beginPath();
        var n = Math.floor(st.sec);
        for (var t = 0; t <= n; t++) { var x = sx + t * kx, y = mid - s.y[t] * amp; if (t) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke(); ctx.restore();
        if (st.sec > 0) D.line(ctx, sx + st.sec * kx, y0 + 6, sx + st.sec * kx, y0 + rowH - 6, D.alpha(c.accent, 0.7), 1.5);
        var yy = y0 + rowH - 10;
        if (st.sec >= s.tp) { var xp = sx + s.tp * kx; D.line(ctx, xp, mid - amp, xp, mid + amp, colP, 2); D.text(ctx, 'P', xp - 3, mid - amp * 0.55, { color: colP, size: fs - 1, weight: 700, align: 'right' }); }
        if (st.sec >= s.ts) {
          var xs = sx + s.ts * kx; D.line(ctx, xs, mid - amp, xs, mid + amp, colS, 2); D.text(ctx, 'S', xs + 3, mid - amp * 0.55, { color: colS, size: fs - 1, weight: 700 });
          D.line(ctx, sx + s.tp * kx, yy, xs, yy, c.text, 1.2);
          D.text(ctx, s.gap + ' s × 10.3 = ' + Math.round(s.dEst / 10) * 10 + ' km', Math.min(xs + 6, sx + sw - 120), yy, { color: c.text, size: fs - 1.5, weight: 600, bg: D.alpha(c.bg, 0.75), pad: 2, fit: tr.x + tr.w });
        }
      });
      D.text(ctx, '0 → ' + st.end / 60 + ' min', tr.x + tr.w - 8, tr.y + 12, { color: c.faint, size: fs - 2, align: 'right' });
      // headline
      var hl = st.sec <= 0 ? 'Where was the earthquake? Read the S − P gap at three stations' : 'Quake + ' + Math.round(st.sec) + ' s' + (show ? ' · three circles meet at the epicentre' : '');
      var hs = L.narrow ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, L.narrow ? 13 : 17, { color: c.bg, bg: c.accent, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });

  function newMystery() {
    for (var n = 0; n < 300; n++) { mystery = km(8 + Math.random() * 26, 69 + Math.random() * 24); if (insideIndia(mystery)) break; }
  }
  function revealed(st) { return st.stn.every(function (s) { return st.sec >= s.ts + 30; }); }
})();
