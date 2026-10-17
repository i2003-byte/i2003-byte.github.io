/* =====================================================================
   Life processes · Digestion Along the Gut — sim.js
   ---------------------------------------------------------------------
   A meal travels along an "unrolled" alimentary canal:
     mouth → oesophagus → stomach → small intestine → large intestine.
   A magnifier shows the food's molecules: starch chains (glucose
   units), protein chains (amino acids) and fats (glycerol + 3 fatty
   acids). Each region digests with first-order rates (per real hour):
     mouth      salivary amylase: starch, 1 − e^(−chew/200 s)
     stomach    pepsin (needs HCl, pH ≈ 2): protein k = 0.09 /h
                (≈ 20 % in 2.5 h). Acid stops amylase.
     small int. bile emulsifies fat (k = 6 /h), then pancreatic +
                intestinal juices: starch k = 1.0, protein 0.75,
                fat 0.75 × emulsified share (≈ 95 % in 4 h; without
                bile only about half the fat). Villi absorb the small
                products: absorbed += (digested − absorbed)·2.5 /h.
     large int. water is absorbed; whatever is left leaves the body.
   Real times are rounded: stomach 2 h + 3 h × fat share, small
   intestine 4 h, large intestine 20 h. Each region is shown for a few
   seconds of screen time, and the clock shows real time.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var MEAL = {
    thali:   { name: 'Rice, dal and sabzi', s: 60, p: 22, f: 18 },
    chapati: { name: 'Chapati and jam', s: 80, p: 12, f: 8 },
    paneer:  { name: 'Paneer tikka', s: 10, p: 45, f: 45 },
    puri:    { name: 'Puri (fried)', s: 50, p: 8, f: 42 }
  };
  var COL = { s: '#f59e0b', p: '#ec4899', f: '#facc15', blood: '#ef4444' };
  // regions: key, screen seconds, real seconds (some set from the meal)
  function regions(p) {
    var m = MEAL[p.meal];
    return [
      { id: 'mouth', name: 'Mouth', show: 3, real: p.chew },
      { id: 'oes', name: 'Oesophagus', show: 1.5, real: 8 },
      { id: 'stomach', name: 'Stomach', show: 6, real: (2 + 3 * m.f / 100) * 3600 },
      { id: 'small', name: 'Small intestine', show: 8, real: 4 * 3600 },
      { id: 'large', name: 'Large intestine', show: 5, real: 20 * 3600 },
      { id: 'out', name: 'Out of the body', show: 1, real: 1 }
    ];
  }

  var st = {};
  function init(p) {
    st.R = regions(p); st.k = 0; st.u = 0;           // region index, progress 0..1 in it
    st.tReal = 0; st.d = { s: 0, p: 0, f: 0 }; st.a = { s: 0, p: 0, f: 0 }; st.emul = 0; st.water = 0;
    var rnd = M.rng(11); st.order = [];
    for (var i = 0; i < 60; i++) st.order.push(rnd());
  }
  function digest(p, id, h) {                      // advance chemistry by h real hours in region id
    var d = st.d, a = st.a;
    if (id === 'mouth') d.s = 1 - (1 - d.s) * Math.exp(-h * 3600 / 200);
    if (id === 'stomach' && p.acid) d.p = 1 - (1 - d.p) * Math.exp(-0.09 * h);
    if (id === 'small') {
      st.emul = p.bile ? 1 - (1 - st.emul) * Math.exp(-6 * h) : Math.max(st.emul, 0.2);
      d.s = 1 - (1 - d.s) * Math.exp(-1.0 * h);
      d.p = 1 - (1 - d.p) * Math.exp(-(p.acid ? 0.75 : 0.65) * h);
      d.f = 1 - (1 - d.f) * Math.exp(-0.75 * st.emul * h);
      ['s', 'p', 'f'].forEach(function (n) { a[n] += (d[n] - a[n]) * (1 - Math.exp(-2.5 * h)); });
    }
    if (id === 'large') st.water = 1 - (1 - st.water) * Math.exp(-0.12 * h);
  }
  function hm(t) {
    if (t < 60) return M.fmt(t, 0) + ' s';
    if (t < 3600) return M.fmt(t / 60, 0) + ' min';
    var h = Math.floor(t / 3600), m = Math.round((t - h * 3600) / 60);
    if (m === 60) { h++; m = 0; }
    return h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
  }
  var ACTION = {
    mouth: 'Saliva: amylase starts cutting starch into maltose',
    oes: 'Muscles squeeze the food down (peristalsis)',
    stomach: 'HCl + pepsin: proteins → peptides; acid kills germs',
    small: 'Bile emulsifies fat; enzymes finish the job; villi absorb',
    large: 'Water is absorbed; fibre and leftovers are passed out',
    out: 'Leaves the body as faeces'
  };

  SimLab.createSim({
    ariaLabel: 'A meal travelling along the alimentary canal from the mouth through the stomach and small intestine to the large intestine, with a magnified view of starch, protein and fat molecules being cut into glucose, amino acids, fatty acids and glycerol and absorbed into the blood',
    playLabel: 'Eat',
    mobileAspect: '3 / 3.4',
    params: [
      { id: 'meal', label: 'Meal', type: 'select', value: 'thali', options: [
        { value: 'thali', label: 'Rice, dal and sabzi (balanced)' }, { value: 'chapati', label: 'Chapati and jam (starchy)' },
        { value: 'paneer', label: 'Paneer tikka (protein and fat)' }, { value: 'puri', label: 'Puri (fried, oily)' }] },
      { id: 'chew', label: 'Chewing time', min: 5, max: 120, step: 5, value: 30, unit: 's', presets: [10, 30, 60] },
      { id: 'bile', label: 'Bile reaches the intestine', type: 'toggle', value: true, help: 'Switch off to see a blocked bile duct (for example a gallstone).' },
      { id: 'acid', label: 'Stomach makes acid', type: 'toggle', value: true, help: 'Pepsin works only in acid.' }
    ],
    readouts: [
      { id: 'where', label: 'Food is in the', key: true, short: 'Where' },
      { id: 't', label: 'Time since eating', key: true, short: 'Time' },
      { id: 'dig', label: 'Digested so far', key: true, short: 'Digested' },
      { id: 'abs', label: 'Absorbed into the blood' },
      { id: 'act', label: 'What happens here' }
    ],
    graph: { title: 'Food still undigested', xLabel: 'time since eating (h)', yLabel: '% left', series: [{ label: 'Starch', color: '#f59e0b' }, { label: 'Protein', color: '#ec4899' }, { label: 'Fat', color: '#facc15' }], yMin: 0, yMax: 100 },
    reset: function (sim) {
      init(sim.p);
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [100, 100, 100]); }
    },
    update: function (sim, dt) {
      var p = sim.p, R = st.R[st.k];
      if (!R || R.id === 'out' && st.u >= 1) return;
      var du = dt / R.show, h = du * R.real / 3600;
      st.u += du; st.tReal += du * R.real;
      digest(p, R.id, h);
      if (st.u >= 1 && st.k < st.R.length - 1) { st.k++; st.u = 0; }
      st.gAcc = (st.gAcc || 0) + dt;
      if (sim.graph && st.gAcc > 0.1) { st.gAcc = 0; sim.graph.push(st.tReal / 3600, [100 * (1 - st.d.s), 100 * (1 - st.d.p), 100 * (1 - st.d.f)]); }
    },
    finished: function () { return st.R[st.k].id === 'out' && st.u >= 1; },
    readout: function (sim) {
      var R = st.R[st.k], m = MEAL[sim.p.meal], d = st.d, a = st.a;
      var tot = m.s + m.p + m.f, absd = (m.s * a.s + m.p * a.p + m.f * a.f) / tot;
      return {
        where: R.name,
        t: hm(st.tReal),
        dig: 'starch ' + M.fmt(d.s * 100, 0) + '%, protein ' + M.fmt(d.p * 100, 0) + '%, fat ' + M.fmt(d.f * 100, 0) + '%',
        abs: M.fmt(absd * 100, 0) + '% of the meal' + (st.water > 0.05 ? ', water ' + M.fmt(st.water * 100, 0) + '% taken back' : ''),
        act: R.id === 'small' && !sim.p.bile ? 'No bile: fat stays in big drops, lipase works slowly' : R.id === 'stomach' && !sim.p.acid ? 'No acid: pepsin cannot work, germs survive' : ACTION[R.id]
      };
    },
    status: function () { return ACTION[st.R[st.k].id]; },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 10 : 12;
      D.clear(ctx, W, H, c.bg);
      var side = W > H * 1.3, gw = side ? W * 0.52 : W, gh = side ? H : H * 0.5;
      var tag = function (t, x, y, col, al, sz) { D.text(ctx, t, x, y, { color: col || c.ink, size: sz || fs, weight: 700, align: al || 'center', bg: D.alpha(c.bg, 0.85), pad: 2, fit: W }); };

      // ---------- the unrolled gut: three rows ----------
      var x0 = gw * 0.08, x1 = gw * 0.92, rows = [gh * 0.2, gh * 0.53, gh * 0.84], tube = side ? 16 : 12;
      var cur = st.R[st.k].id, u = st.u;
      var gutCol = '#fb7185';
      // path pieces: [region, points]
      var seg = {
        mouth: [[x0, rows[0]], [x0 + gw * 0.08, rows[0]]],
        oes: [[x0 + gw * 0.08, rows[0]], [gw * 0.42, rows[0]]],
        stomach: [[gw * 0.42, rows[0]], [gw * 0.6, rows[0] + gh * 0.05], [gw * 0.74, rows[0]], [x1, rows[0]], [x1, rows[1]]],
        small: [], large: [[x0, rows[1]], [x0, rows[2]], [x1 - gw * 0.06, rows[2]]], out: [[x1 - gw * 0.06, rows[2]], [x1, rows[2]]]
      };
      for (var i = 0; i <= 30; i++) { var f = i / 30; seg.small.push([x1 - (x1 - x0) * f, rows[1] + Math.sin(f * Math.PI * 7) * gh * 0.06 * Math.sin(Math.PI * f)]); }
      var draw = function (pts, w, col) { ctx.beginPath(); pts.forEach(function (q, k) { if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
      ['mouth', 'oes', 'small', 'large', 'out'].forEach(function (k) { draw(seg[k], tube * (k === 'large' ? 1.6 : k === 'oes' ? 0.8 : 1), D.alpha(gutCol, cur === k ? 0.55 : 0.25)); });
      // stomach as a J-shaped bag
      var sx = gw * 0.6, sy = rows[0] + gh * 0.03, sw = gw * 0.2, sh = gh * 0.17;
      ctx.beginPath(); ctx.ellipse(sx, sy, sw * 0.55, sh * 0.5, -0.15, 0, Math.PI * 2);
      ctx.fillStyle = D.alpha(gutCol, cur === 'stomach' ? 0.5 : 0.22); ctx.fill(); ctx.strokeStyle = D.alpha(gutCol, 0.8); ctx.lineWidth = 2; ctx.stroke();
      draw(seg.stomach.slice(2), tube, D.alpha(gutCol, cur === 'stomach' ? 0.55 : 0.25));
      // labels
      var lab = function (t, x, y, k, al) { D.text(ctx, t, x, y, { color: cur === k ? c.ink : c.muted, size: fs, weight: cur === k ? 700 : 500, align: al || 'center', fit: W }); };
      lab('Mouth', x0, rows[0] - tube - 8, 'mouth', 'left');
      lab('Oesophagus', gw * 0.27, rows[0] - tube - 8, 'oes');
      lab('Stomach', sx, sy - sh * 0.5 - 9, 'stomach');
      lab('Small intestine (≈ 6 m)', gw * 0.32, rows[1] - gh * 0.09 - 6, 'small');
      lab('Large intestine', gw * 0.42, rows[2] + tube + 9, 'large');
      // glands: salivary, liver + gall bladder (bile), pancreas
      D.circle(ctx, x0 + gw * 0.05, rows[0] + tube + 6, 5, D.alpha('#a3e635', 0.7));
      if (!narrow || side) D.text(ctx, 'salivary glands', x0 + gw * 0.05 + 8, rows[0] + tube + 7, { color: c.muted, size: fs - 2 });
      var lx = x1 - gw * 0.12, ly = gh * 0.4;
      D.roundRect(ctx, lx - gw * 0.15, ly - 9, gw * 0.12, 18, 8, D.alpha('#a16207', 0.6));
      D.circle(ctx, lx - gw * 0.025, ly + 4, 5, p.bile ? '#22c55e' : D.alpha('#22c55e', 0.4));
      D.line(ctx, lx - gw * 0.02, ly + 4, x1 - tube * 0.5, ly + 4, p.bile ? '#22c55e' : D.alpha('#22c55e', 0.3), 2);
      if (!p.bile) { var bx = (lx + x1) / 2 - 4; D.line(ctx, bx - 4, ly, bx + 4, ly + 8, c.danger, 2.5); D.line(ctx, bx + 4, ly, bx - 4, ly + 8, c.danger, 2.5); }
      D.text(ctx, p.bile ? 'liver: bile' : 'bile blocked', lx - gw * 0.09, ly + 18, { color: p.bile ? '#22c55e' : c.danger, size: fs - 1, weight: 700, align: 'center', fit: W });
      D.roundRect(ctx, sx - sw * 0.35, sy + sh * 0.55 + 2, sw * 0.7, 9, 4, D.alpha('#c084fc', 0.6));
      if (!narrow || side) D.text(ctx, 'pancreas', sx, sy + sh * 0.55 + 19, { color: c.muted, size: fs - 2, align: 'center' });

      // the food bolus
      var bolusAt = function () {
        var pts = cur === 'stomach' ? [[gw * 0.45, sy], [sx, sy + sh * 0.1], [gw * 0.7, sy]].concat(seg.stomach.slice(3)) : seg[cur];
        if (cur === 'stomach' && u < 0.8) { var w = u / 0.8; return [sx + Math.sin(w * Math.PI * 6) * sw * 0.25, sy + Math.cos(w * Math.PI * 6) * sh * 0.15]; }  // churning
        if (cur === 'stomach') { pts = seg.stomach.slice(2); u = (u - 0.8) / 0.2; }
        var L = [0]; for (var k = 1; k < pts.length; k++) L.push(L[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
        var dd = u * L[L.length - 1], j = 1; while (j < L.length - 1 && L[j] < dd) j++;
        var q = (dd - L[j - 1]) / ((L[j] - L[j - 1]) || 1);
        return [pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * q, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * q];
      };
      var bp = bolusAt(), m = MEAL[p.meal], left = 1 - (m.s * st.a.s + m.p * st.a.p + m.f * st.a.f) / 100;
      if (cur !== 'out' || st.u < 1) D.circle(ctx, bp[0], bp[1], (side ? 9 : 7) * (0.55 + 0.45 * left) * (cur === 'large' ? 0.8 + 0.2 * (1 - st.water) : 1), '#a16207', c.ink, 1.5);
      tag(hm(st.tReal), side ? gw * 0.5 : W - 6, side ? H - 12 : 10, c.ink, side ? 'center' : 'right', fs);

      // ---------- magnifier: the molecules in the food now ----------
      var mx = side ? gw + 8 : 6, my = side ? 6 : gh + 4, mw = side ? W - gw - 14 : W - 12, mh = side ? H - 12 : H - gh - 8;
      D.roundRect(ctx, mx, my, mw, mh, 12, D.alpha(c.ink, 0.04), D.alpha(c.ink, 0.2), 1.5);
      D.text(ctx, '🔍 ' + st.R[st.k].name + ': ' + (cur === 'small' && !p.bile ? 'no bile, fat stays in big drops' : cur === 'stomach' && !p.acid ? 'no acid, pepsin idle' : ACTION[cur].split(':')[0].split(';')[0]), mx + 8, my + 12, { color: c.ink, size: fs, weight: 700, fit: mx + mw });
      var rowsY = [my + mh * 0.27, my + mh * 0.5, my + mh * 0.73], unit = Math.min(mw / 40, mh / 11, 11), bloodY = my + mh - 12;
      var nutr = [['s', 'Starch', '→ glucose'], ['p', 'Protein', '→ amino acids'], ['f', 'Fat', '→ fatty acids + glycerol']];
      nutr.forEach(function (nn, r) {
        var key = nn[0], share = m[key], chains = Math.max(1, Math.round(share / 15)), y = rowsY[r], d = st.d[key], a = st.a[key];
        D.text(ctx, nn[1] + ' ' + nn[2], mx + 8, y - unit * 2.2, { color: c.light && key !== 'p' ? '#a16207' : COL[key], size: fs - 1, weight: 700 });
        var n = key === 'f' ? 4 : 5, links = chains * (n - 1), broken = Math.round(d * links), units = chains * n, absorbed = Math.round(a * units);
        var x = mx + 12, cw = unit * 1.7, ui = 0, molW = n * cw;
        if (key === 'f' && st.emul < 0.5) {   // one big drop until bile breaks it up
          var tw = Math.min(chains * (molW + cw * 0.7), mw - 24);
          ctx.beginPath(); ctx.ellipse(x - cw * 0.5 + tw / 2, y, tw / 2 + 4, unit * 1.25, 0, 0, Math.PI * 2);
          ctx.strokeStyle = D.alpha(COL.f, 0.6); ctx.lineWidth = 1.5; ctx.stroke();
        }
        for (var ch = 0; ch < chains; ch++) {
          if (x + molW > mx + mw - 8) break;
          if (key === 'f' && st.emul >= 0.5) { ctx.beginPath(); ctx.ellipse(x - cw * 0.5 + molW / 2, y, molW / 2 + 2, unit * 1.1, 0, 0, Math.PI * 2); ctx.strokeStyle = D.alpha(COL.f, 0.45); ctx.lineWidth = 1; ctx.stroke(); }
          for (var k = 0; k < n; k++) {
            var li = ch * (n - 1) + k, cut = k < n - 1 && st.order[li % st.order.length] * links < broken;   // links broken in a fixed random order
            var gone = ui++ < absorbed;                                          // absorbed units have left
            if (!gone) {
              if (key === 's') D.circle(ctx, x, y, unit * 0.5, COL.s, null);
              else if (key === 'p') D.circle(ctx, x, y, unit * 0.48, ['#ec4899', '#f472b6', '#be185d', '#fb7185', '#db2777'][k], null);
              else if (k === 0) D.roundRect(ctx, x - unit * 0.25, y - unit * 0.7, unit * 0.5, unit * 1.4, 2, '#fde68a');
              else { ctx.beginPath(); for (var z = 0; z <= 4; z++) { var zx = x - unit * 0.55 + z * unit * 0.275, zy = y + (z % 2 ? -1 : 1) * unit * 0.25; if (z) ctx.lineTo(zx, zy); else ctx.moveTo(zx, zy); } ctx.strokeStyle = COL.f; ctx.lineWidth = 2.2; ctx.stroke(); }
              if (k < n - 1 && !cut) D.line(ctx, x + unit * 0.5, y, x + cw - unit * 0.5, y, D.alpha(c.ink, 0.75), 2.5);
            }
            x += cut ? cw * 1.25 : cw;
          }
          x += cw * 0.6;
        }
      });
      // blood in the villi
      ctx.fillStyle = D.alpha(COL.blood, 0.18); ctx.fillRect(mx + 4, bloodY - 8, mw - 8, 16);
      var ab = (m.s * st.a.s + m.p * st.a.p + m.f * st.a.f) / 100;
      for (var b = 0; b < Math.round(ab * 30); b++) D.circle(ctx, mx + 12 + ((b * 37 + st.tReal / 400) % (mw - 24)), bloodY + (b % 3 - 1) * 3, 2.2, [COL.s, COL.p, COL.f][b % 3]);
      D.text(ctx, 'blood: absorbed ' + M.fmt(ab * 100, 0) + '%', mx + mw - 8, bloodY - 14, { color: COL.blood, size: fs - 1, weight: 700, align: 'right' });
    }
  });
})();
