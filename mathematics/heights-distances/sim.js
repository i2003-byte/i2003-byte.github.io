/* =====================================================================
   Trigonometry · Heights and Distances — sim.js
   ---------------------------------------------------------------------
   Scenes (heights in metres):
     qutub  Qutub Minar 72.5 m      height = d·tan θ (+ eye height)
     tree   coconut tree 18 m       same
     two    Charminar 56 m, two points P (far) and Q (near), gap g:
            h = g ÷ (cot α − cot β)  (+ eye height)
     light  lighthouse 60 m, boat at distance d. Angle of depression
            from the top = angle of elevation from the boat
            (alternate angles), so d = h ÷ tan δ.
   The clinometer can read whole degrees only, as a real one does,
   which makes the worked-out answer a little off the true value.
   People and boats are drawn bigger than scale so they can be seen.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var EYE = 1.5;
  var SC = {
    qutub: { h: 72.5, name: 'Qutub Minar', d: 100 },
    tree:  { h: 18, name: 'coconut tree', d: 30 },
    two:   { h: 56, name: 'Charminar', d: 120 },
    light: { h: 60, name: 'lighthouse', d: 150 }
  };

  function tanD(a) { return Math.tan(M.rad(a)); }
  function solve(p) {
    var s = SC[p.scene], eye = p.scene !== 'light' && p.eye ? EYE : 0, d = p.dist, top = s.h - eye;
    var q = function (a) { return p.whole ? Math.round(a) : Math.round(a * 10) / 10; };
    var r = { s: s, eye: eye, d: d };
    if (p.scene === 'light') {
      r.trueA = M.deg(Math.atan2(s.h, d)); r.a = q(r.trueA);
      r.calc = s.h / tanD(r.a); r.truth = d; r.what = 'distance';
    } else if (p.scene === 'two') {
      var g = Math.min(p.walk, d - 5); r.g = g; r.dn = d - g;
      r.trueA = M.deg(Math.atan2(top, d)); r.trueB = M.deg(Math.atan2(top, r.dn));
      r.a = q(r.trueA); r.b = q(r.trueB);
      var den = 1 / tanD(r.a) - 1 / tanD(r.b);
      r.calc = den > 1e-9 ? g / den + eye : null; r.truth = s.h; r.what = 'height';
    } else {
      r.trueA = M.deg(Math.atan2(top, d)); r.a = q(r.trueA);
      r.calc = d * tanD(r.a) + eye; r.truth = s.h; r.what = 'height';
    }
    r.err = r.calc == null ? null : (r.calc - r.truth) / r.truth * 100;
    return r;
  }
  function layout(sim) {
    var W = sim.width, H = sim.height, narrow = W < 560, top = narrow ? 58 : 62, bot = narrow ? 30 : 34;
    var s = SC[sim.p.scene], d = sim.p.dist;
    var sc = Math.min((W - (narrow ? 70 : 110)) / (d + 16), (H - top - bot - 20) / (s.h * 1.12));
    var gy = H - bot, tx = W - (narrow ? 52 : 70);
    return { W: W, H: H, narrow: narrow, top: top, sc: sc, gy: gy, tx: tx, ox: tx - d * sc };
  }
  function fitText(ctx, txt, size, maxW) {
    ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif';
    while (size > 9 && ctx.measureText(txt).width > maxW) { size -= 0.5; ctx.font = '700 ' + size + 'px Inter, system-ui, sans-serif'; }
    return size;
  }

  // ---- scenery ----
  function qutub(ctx, x, gy, sc, h, c) {
    var hb = h * sc, b0 = 14 * sc / 2, b1 = 3 * sc / 2;
    ctx.fillStyle = c.light ? '#b45309' : '#c2410c';
    ctx.beginPath(); ctx.moveTo(x - b0, gy); ctx.lineTo(x - b1, gy - hb); ctx.lineTo(x + b1, gy - hb); ctx.lineTo(x + b0, gy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    for (var f = -2; f <= 2; f++) { ctx.beginPath(); ctx.moveTo(x + f * b0 / 3, gy); ctx.lineTo(x + f * b1 / 3, gy - hb); ctx.stroke(); }
    [0.33, 0.53, 0.7, 0.84, 0.95].forEach(function (k, i) {     // balconies
      var w = M.lerp(b0, b1, k) + 2.5; ctx.fillStyle = i < 3 ? '#fde68a' : '#f5f5f4';
      ctx.fillRect(x - w, gy - hb * k - 2, w * 2, 3.5);
    });
    D.roundRect(ctx, x - b1 - 1, gy - hb - 4, b1 * 2 + 2, 5, 2, '#f5f5f4');
  }
  function tree(ctx, x, gy, sc, h) {
    var hb = h * sc;
    ctx.strokeStyle = '#92400e'; ctx.lineWidth = Math.max(4, 0.5 * sc); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 2, gy); ctx.quadraticCurveTo(x - hb * 0.12, gy - hb * 0.5, x, gy - hb); ctx.stroke();
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 3;
    for (var i = 0; i < 7; i++) {
      var a = -Math.PI / 2 + (i - 3) * 0.45, L = hb * 0.32;
      ctx.beginPath(); ctx.moveTo(x, gy - hb);
      ctx.quadraticCurveTo(x + Math.cos(a) * L * 0.7, gy - hb + Math.sin(a) * L * 0.7 - 6, x + Math.cos(a) * L, gy - hb + Math.sin(a) * L + L * 0.45); ctx.stroke();
    }
    D.circle(ctx, x - 3, gy - hb + 4, 3, '#a16207'); D.circle(ctx, x + 3, gy - hb + 5, 3, '#a16207');
  }
  function charminar(ctx, x, gy, sc, h, c) {
    var hb = h * sc, half = 15 * sc, body = 0.6 * hb, col = c.light ? '#d6d3d1' : '#e7e5e4';
    ctx.fillStyle = col; ctx.fillRect(x - half, gy - body, half * 2, body);
    ctx.fillStyle = c.bg; ctx.beginPath();                      // central arch
    var aw = half * 0.55; ctx.moveTo(x - aw, gy); ctx.lineTo(x - aw, gy - body * 0.5); ctx.quadraticCurveTo(x, gy - body * 0.95, x + aw, gy - body * 0.5); ctx.lineTo(x + aw, gy); ctx.fill();
    [-1, 1].forEach(function (s) {                                // minarets
      var mx = x + s * half, mw = Math.max(2.5, 2.2 * sc);
      ctx.fillStyle = col; ctx.fillRect(mx - mw, gy - hb * 0.94, mw * 2, hb * 0.94);
      D.circle(ctx, mx, gy - hb * 0.94, mw * 1.3, col);
      D.line(ctx, mx, gy - hb * 0.94, mx, gy - hb, col, 1.5);
      [0.6, 0.75, 0.87].forEach(function (k) { ctx.fillStyle = '#a8a29e'; ctx.fillRect(mx - mw - 1.5, gy - hb * k, mw * 2 + 3, 2.5); });
    });
  }
  function lighthouse(ctx, x, gy, sc, h) {
    var hb = h * sc, cliff = hb * 0.45, tw = Math.max(5, 3 * sc);
    ctx.fillStyle = '#57534e'; ctx.beginPath(); ctx.moveTo(x - tw * 4, gy); ctx.lineTo(x - tw * 2.2, gy - cliff); ctx.lineTo(x + tw * 3, gy - cliff); ctx.lineTo(x + tw * 4, gy); ctx.fill();
    var ty = gy - cliff, th = hb - cliff;
    for (var i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#dc2626' : '#f8fafc'; ctx.fillRect(x - tw, ty - th * (i + 1) / 5, tw * 2, th / 5 + 0.5); }
    D.roundRect(ctx, x - tw * 1.3, gy - hb - 6, tw * 2.6, 7, 2, '#fde047');
  }
  function person(ctx, x, gy, c, eye) {
    var s = 1;                                                    // fixed size, not to scale
    D.circle(ctx, x, gy - 22 * s, 4.5, c.ink);
    D.line(ctx, x, gy - 17, x, gy - 7, c.ink, 2.5); D.line(ctx, x, gy - 7, x - 4, gy, c.ink, 2.5); D.line(ctx, x, gy - 7, x + 4, gy, c.ink, 2.5);
    D.line(ctx, x, gy - 15, x + 6, gy - 20, c.ink, 2);
    return eye ? gy - 22 : gy;
  }
  function boat(ctx, x, gy) {
    ctx.fillStyle = '#7c2d12'; ctx.beginPath(); ctx.moveTo(x - 14, gy - 7); ctx.lineTo(x + 14, gy - 7); ctx.lineTo(x + 9, gy); ctx.lineTo(x - 9, gy); ctx.fill();
    D.line(ctx, x, gy - 7, x, gy - 24, '#e7e5e4', 1.5);
    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(x + 1, gy - 24); ctx.lineTo(x + 11, gy - 10); ctx.lineTo(x + 1, gy - 10); ctx.fill();
  }
  function arcAt(ctx, x, y, r, a0, a1, col) {   // a0..a1 in maths degrees (y up)
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, -M.rad(Math.max(a0, a1)), -M.rad(Math.min(a0, a1))); ctx.closePath();
    ctx.fillStyle = D.alpha(col, 0.3); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, -M.rad(Math.max(a0, a1)), -M.rad(Math.min(a0, a1))); ctx.stroke();
  }

  SimLab.createSim({
    ariaLabel: 'A person at some distance from a tall structure such as the Qutub Minar looks up at its top. The angle of elevation, the distance and the height form a right triangle, and the height is worked out with tan',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'scene', label: 'Problem', type: 'select', value: 'qutub', options: [
        { value: 'qutub', label: 'Height of the Qutub Minar' },
        { value: 'tree', label: 'Height of a coconut tree' },
        { value: 'two', label: 'Charminar from two points' },
        { value: 'light', label: 'Lighthouse: how far is the boat?' }] },
      { id: 'dist', label: 'Distance from the foot', min: 10, max: 250, step: 1, value: 100, unit: 'm', help: 'Or drag the person (or the boat).' },
      { id: 'walk', label: 'Walk closer by (two points)', min: 5, max: 150, step: 1, value: 50, unit: 'm' },
      { id: 'eye', label: 'Add eye height 1.5 m', type: 'toggle', value: true },
      { id: 'whole', label: 'Clinometer reads whole degrees', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'a', label: 'Angle measured', short: 'Angle', unit: '°', digits: 1, key: true },
      { id: 'tan', label: 'tan of the angle', digits: 3 },
      { id: 'b', label: 'Angle from the near point', unit: '°', digits: 1 },
      { id: 'calc', label: 'Worked-out answer', short: 'Answer', unit: 'm', digits: 1, key: true },
      { id: 'truth', label: 'True value', unit: 'm', digits: 1, key: true },
      { id: 'err', label: 'Error', unit: '%', digits: 1 }
    ],
    reset: function () {},
    onParam: function (sim, id, v) {
      if (id === 'scene') { var d = SC[v].d; if (sim.p.dist !== d) sim.setParam('dist', d); }
      if (id === 'dist' && sim.p.walk > v - 5) sim.setParam('walk', Math.max(5, v - 5));
      if (id === 'walk' && v > sim.p.dist - 5) sim.setParam('walk', Math.max(5, sim.p.dist - 5));
      return true;
    },
    readout: function (sim) {
      var r = solve(sim.p);
      return { a: r.a, tan: tanD(r.a), b: r.b == null ? '—' : r.b, calc: r.calc, truth: r.truth, err: r.err };
    },
    status: function (sim) {
      var r = solve(sim.p);
      return 'Worked-out ' + r.what + ' ' + M.fmt(r.calc, 1) + ' m (true ' + M.fmt(r.truth, 1) + ' m)';
    },
    pointer: {
      down: function (sim, x, y) { var L = layout(sim); return Math.abs(x - L.ox) < 40 && y > L.top; },
      move: function (sim, x) {
        var L = layout(sim), d = Math.round((L.tx - x) / L.sc);
        sim.setParam('dist', M.clamp(d, 10, 250));
      },
      hover: function (sim, x, y) { var L = layout(sim); return Math.abs(x - L.ox) < 30 && y > L.top; }
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, L = layout(sim), W = L.W, H = L.H, r = solve(p), s = r.s;
      var sc = L.sc, gy = L.gy, tx = L.tx, ox = L.ox, fs = L.narrow ? 11 : 13, nar = L.narrow;
      var colA = c.warning, colH = c.s2, colD = c.s1;
      D.clear(ctx, W, H, c.bg);
      // sky tint + ground (sea for the lighthouse)
      var sky = ctx.createLinearGradient(0, L.top, 0, gy);
      sky.addColorStop(0, D.alpha('#38bdf8', c.light ? 0.12 : 0.06)); sky.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sky; ctx.fillRect(0, L.top - 6, W, gy - L.top + 6);
      ctx.fillStyle = p.scene === 'light' ? D.alpha('#0ea5e9', 0.35) : D.alpha(c.light ? '#65a30d' : '#4d7c0f', 0.45);
      ctx.fillRect(0, gy, W, H - gy);
      D.line(ctx, 0, gy, W, gy, c.ink, 1.5);

      if (p.scene === 'qutub') qutub(ctx, tx, gy, sc, s.h, c);
      else if (p.scene === 'tree') tree(ctx, tx, gy, sc, s.h);
      else if (p.scene === 'two') charminar(ctx, tx, gy, sc, s.h, c);
      else lighthouse(ctx, tx, gy, sc, s.h);
      var topY = gy - s.h * sc;
      // the height being measured: a dimension line just right of the structure
      var hx = tx + (nar ? 16 : 26);

      if (p.scene === 'light') {
        boat(ctx, ox, gy);
        var eyeL = { x: tx, y: topY };
        D.line(ctx, eyeL.x, eyeL.y, ox, gy - 4, colA, 2, [7, 5]);           // line of sight down to the boat
        D.line(ctx, eyeL.x, eyeL.y, ox - 10, eyeL.y, D.alpha(c.ink, 0.6), 1.5, [3, 4]); // horizontal at the top
        var ra = M.clamp(Math.min(60, (tx - ox) * 0.4), 18, 60);
        arcAt(ctx, eyeL.x, eyeL.y, ra, 180, 180 + r.trueA, colA);
        arcAt(ctx, ox, gy - 2, ra * 0.8, 0, r.trueA, colA);
        D.text(ctx, 'δ = ' + M.fmt(r.a, p.whole ? 0 : 1) + '°', eyeL.x - ra - 6, eyeL.y + 12, { color: colA, size: fs, weight: 700, align: 'right' });
        D.text(ctx, M.fmt(r.a, p.whole ? 0 : 1) + '°', ox + ra * 0.8 + 6, gy - 12, { color: colA, size: fs, weight: 700 });
        D.arrow(ctx, hx, gy, hx, topY, colH, 1.5, 7); D.arrow(ctx, hx, topY, hx, gy, colH, 1.5, 7);
        D.text(ctx, '60 m', hx + 4, (gy + topY) / 2, { color: colH, size: fs, weight: 700, fit: W });
        D.text(ctx, 'd = ?', (ox + tx) / 2, gy + 14, { color: colD, size: fs, weight: 700, align: 'center' });
      } else {
        var pts = [{ x: ox, d: p.dist, a: r.a, ta: r.trueA, lab: p.scene === 'two' ? 'P' : '' }];
        if (p.scene === 'two') pts.push({ x: tx - r.dn * sc, d: r.dn, a: r.b, ta: r.trueB, lab: 'Q' });
        pts.forEach(function (q, i) {
          var e = person(ctx, q.x, gy, c, r.eye > 0);
          D.line(ctx, q.x, e, tx, topY, i ? c.s4 : colA, 2, [7, 5]);
          D.line(ctx, q.x, e, tx, e, D.alpha(c.ink, 0.5), 1.2, [3, 4]);
          var rr = M.clamp((tx - q.x) * 0.35, 18, 56);
          var sightA = M.deg(Math.atan2(e - topY, tx - q.x));
          arcAt(ctx, q.x, e, rr, 0, sightA, i ? c.s4 : colA);
          var mid = M.rad(sightA / 2);
          D.text(ctx, (i ? 'β = ' : (p.scene === 'two' ? 'α = ' : 'θ = ')) + M.fmt(q.a, p.whole ? 0 : 1) + '°', q.x + Math.cos(mid) * (rr + 8), e - Math.sin(mid) * (rr + 8) - (i ? 0 : 0), { color: i ? c.s4 : colA, size: fs, weight: 700, bg: D.alpha(c.bg, 0.75), pad: 2, fit: W });
          if (q.lab) D.text(ctx, q.lab, q.x, gy + 13, { color: c.ink, size: fs + 1, weight: 700, align: 'center' });
        });
        // right angle where the eye line meets the structure
        D.line(ctx, tx - 8, (r.eye ? gy - 22 : gy), tx - 8, (r.eye ? gy - 22 : gy) - 8, c.ink, 1.2);
        D.line(ctx, tx - 8, (r.eye ? gy - 22 : gy) - 8, tx, (r.eye ? gy - 22 : gy) - 8, c.ink, 1.2);
        D.arrow(ctx, hx, gy, hx, topY, colH, 1.5, 7); D.arrow(ctx, hx, topY, hx, gy, colH, 1.5, 7);
        D.text(ctx, 'h = ?', hx + 4, (gy + topY) / 2, { color: colH, size: fs, weight: 700, fit: W });
        if (p.scene === 'two') {
          var qx = tx - r.dn * sc;
          D.text(ctx, r.g + ' m', (ox + qx) / 2, gy + 14, { color: colD, size: fs, weight: 700, align: 'center' });
          D.text(ctx, 'x', (qx + tx) / 2, gy + 14, { color: c.muted, size: fs, weight: 700, align: 'center' });
        } else D.text(ctx, 'd = ' + p.dist + ' m', (ox + tx) / 2, gy + 14, { color: colD, size: fs, weight: 700, align: 'center' });
      }

      // working, in two lines at the top
      var A = M.fmt(r.a, p.whole ? 0 : 1), l1, l2;
      if (p.scene === 'light') {
        l1 = 'tan δ = 60 ÷ d, so d = 60 ÷ tan ' + A + '° = 60 ÷ ' + M.fmt(tanD(r.a), 3) + ' = ' + M.fmt(r.calc, 1) + ' m';
        l2 = 'Depression from the top = elevation from the boat (alternate angles). True: ' + p.dist + ' m';
      } else if (p.scene === 'two') {
        var B = M.fmt(r.b, p.whole ? 0 : 1);
        l1 = 'h' + (r.eye ? ' − 1.5' : '') + ' = ' + r.g + ' ÷ (cot ' + A + '° − cot ' + B + '°) ⇒ h = ' + (r.calc == null ? 'angles too close' : M.fmt(r.calc, 1) + ' m');
        var hh = r.eye ? '(h − 1.5)' : 'h';
        l2 = 'x + ' + r.g + ' = ' + hh + ' cot α, x = ' + hh + ' cot β. True: ' + s.h + ' m';
      } else {
        l1 = 'h = d × tan θ' + (r.eye ? ' + 1.5' : '') + ' = ' + p.dist + ' × ' + M.fmt(tanD(r.a), 3) + (r.eye ? ' + 1.5' : '') + ' = ' + M.fmt(r.calc, 1) + ' m';
        l2 = 'True height of the ' + s.name + ': ' + s.h + ' m (error ' + M.fmt(r.err, 1) + '%)';
      }
      var s1 = fitText(ctx, l1, nar ? 12.5 : 14, W - 20);
      D.text(ctx, l1, W / 2, 14, { color: c.bg, bg: c.success, size: s1, weight: 700, align: 'center', pad: 4, fit: W });
      var s2 = fitText(ctx, l2, nar ? 11 : 12.5, W - 16);
      D.text(ctx, l2, W / 2, 38, { color: c.text, size: s2, weight: 600, align: 'center', fit: W });
      D.text(ctx, 'person and boat not to scale', 8, H - 10, { color: c.faint, size: nar ? 9.5 : 11 });
    }
  });
})();
