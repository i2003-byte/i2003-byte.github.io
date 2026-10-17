/* =====================================================================
   Mechanical properties of fluids · Surface Tension & Capillarity — sim.js
   ---------------------------------------------------------------------
   Three scenes:
     tubes   — glass tubes of radius r, 2r and 4r dipped in a liquid.
               Jurin's law h = 2T·cosθ / (rρg): the pull of the surface
               2πrT·cosθ holds up a column of weight πr²hρg.
               θ < 90° (water on clean glass) → rise, concave meniscus;
               θ > 90° (mercury, water on wax) → fall, convex meniscus.
               The level climbs to h with a smooth 0.5 s approach (drawn).
     float   — end view of a steel needle (diameter d) lying on water.
               Weight per metre w = ρ_s·πd²/4·g. The surface on each side
               pulls with T per metre at an angle φ to the horizontal:
               2T·sinφ = w. It floats while w < 2T (sin φ ≤ 1). The
               small upthrust from the dent is ignored. A drop of soap
               lowers T from 0.073 to 0.030 N/m.
     bubbles — two soap bubbles on the ends of a tube (mouth radius
               a = 0.8 cm) joined through a tap. Each bubble is a
               spherical cap of height h: V = πh(3a² + h²)/6,
               radius of curvature R = (a² + h²)/(2h). Excess pressure
               4T/R (two film surfaces). With the tap open air flows
               from high to low pressure: dV/dt = k·Δp. The small bubble
               shrinks into the big one until both have the same R.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var G = 9.8, T_SOAP_FILM = 0.025, MOUTH = 0.008, K_FLOW = 4e-7;
  var LIQ = {
    water:   { name: 'Water', T: 0.0728, rho: 1000, th: 0, col: '#38bdf8' },
    soap:    { name: 'Soapy water', T: 0.030, rho: 1000, th: 0, col: '#a5f3fc' },
    alcohol: { name: 'Alcohol (ethanol)', T: 0.0223, rho: 789, th: 0, col: '#c4b5fd' },
    wax:     { name: 'Water in a waxed tube', T: 0.0728, rho: 1000, th: 105, col: '#38bdf8' },
    mercury: { name: 'Mercury', T: 0.485, rho: 13600, th: 140, col: '#cbd5e1' }
  };
  function jurin(L, r) { return 2 * L.T * Math.cos(M.rad(L.th)) / (r * L.rho * G); }
  function capV(h) { return Math.PI * h * (3 * MOUTH * MOUTH + h * h) / 6; }
  function capR(h) { return (MOUTH * MOUTH + h * h) / (2 * h); }
  function capH(V) { var lo = 1e-6, hi = 0.3; for (var i = 0; i < 50; i++) { var m = (lo + hi) / 2; if (capV(m) < V) lo = m; else hi = m; } return (lo + hi) / 2; }
  function hFromR(R) { R = Math.max(R, MOUTH); return R + Math.sqrt(R * R - MOUTH * MOUTH); }   // more than half a sphere
  function needle(p) {
    var T = p.soap ? LIQ.soap.T : LIQ.water.T, d = p.d / 1000, w = 7800 * Math.PI * d * d / 4 * G;
    return { T: T, w: w, sup: 2 * T, s: w / (2 * T), dMax: Math.sqrt(2 * T * 4 / (7800 * Math.PI * G)) * 1000 };
  }

  var st = {};
  function init(p) {
    st.t = 0;
    st.h = [0, 0, 0];                    // tube levels (m), start at the outside level
    st.sink = 0; st.vs = 0;              // needle: depth sunk (0 = floating) and speed
    st.V1 = capV(hFromR(p.r1 / 100)); st.V2 = capV(hFromR(p.r2 / 100));
  }

  SimLab.createSim({
    ariaLabel: 'Surface tension: water rising in narrow glass tubes and mercury falling, a steel needle floating on water in a dent of the surface until soap is added, and a small soap bubble emptying into a big one through a tube',
    playLabel: 'Start',
    mobileAspect: '3 / 3.3',
    params: [
      { id: 'scene', label: 'Scene', type: 'select', value: 'tubes', options: [
        { value: 'tubes', label: 'Capillary tubes' },
        { value: 'float', label: 'Floating needle' },
        { value: 'bubbles', label: 'Two connected bubbles' }] },
      { id: 'liq', label: 'Tubes: liquid', type: 'select', value: 'water', options: [
        { value: 'water', label: 'Water (clean glass)' }, { value: 'soap', label: 'Soapy water' },
        { value: 'alcohol', label: 'Alcohol (ethanol)' }, { value: 'wax', label: 'Water in a waxed tube' },
        { value: 'mercury', label: 'Mercury' }] },
      { id: 'r', label: 'Tubes: radius of the thinnest tube r', min: 0.1, max: 1, step: 0.05, value: 0.25, unit: 'mm', presets: [0.1, 0.25, 0.5],
        help: 'The other tubes have radius 2r and 4r.' },
      { id: 'd', label: 'Needle: thickness', min: 0.4, max: 2, step: 0.05, value: 1.2, unit: 'mm' },
      { id: 'soap', label: 'Needle: add a drop of soap', type: 'toggle', value: false },
      { id: 'r1', label: 'Bubbles: left bubble radius', min: 1, max: 4, step: 0.1, value: 1.5, unit: 'cm' },
      { id: 'r2', label: 'Bubbles: right bubble radius', min: 1, max: 4, step: 0.1, value: 3, unit: 'cm' }
    ],
    readouts: [
      { id: 'a', label: 'Result', key: true },
      { id: 'b', label: 'Forces', key: true },
      { id: 'c', label: 'Surface tension T', key: true, short: 'T' },
      { id: 'd', label: 'More' }
    ],
    reset: function (sim) { init(sim.p); },
    onParam: function (sim, id, v) { return id === 'soap' && v; },
    update: function (sim, dt) {
      var p = sim.p;
      st.t += dt;
      if (p.scene === 'tubes') {
        var L = LIQ[p.liq], r = p.r / 1000;
        for (var i = 0; i < 3; i++) { var he = jurin(L, r * Math.pow(2, i)); st.h[i] += (he - st.h[i]) * (1 - Math.exp(-dt / 0.5)); }
      } else if (p.scene === 'float') {
        var n = needle(p);
        if (n.s > 1 && st.sink < 1) { st.vs += 2.5 * dt; st.sink = Math.min(1, st.sink + st.vs * dt); }
      } else {
        var R1 = capR(capH(st.V1)), R2 = capR(capH(st.V2)), dp = 4 * T_SOAP_FILM / R1 - 4 * T_SOAP_FILM / R2;
        var q = K_FLOW * dp * dt;
        q = Math.max(-st.V2 + capV(1e-4), Math.min(st.V1 - capV(1e-4), q));
        st.V1 -= q; st.V2 += q;
      }
    },
    readout: function (sim) {
      var p = sim.p;
      if (p.scene === 'tubes') {
        var L = LIQ[p.liq], r = p.r / 1000, h = jurin(L, r), cs = Math.cos(M.rad(L.th));
        var f = 2 * Math.PI * r * L.T * cs;
        return {
          a: (h >= 0 ? 'rises ' : 'falls ') + M.fmt(Math.abs(h) * 100, 2) + ' cm in r, ' + M.fmt(Math.abs(h) * 50, 2) + ' in 2r, ' + M.fmt(Math.abs(h) * 25, 2) + ' in 4r',
          b: (h >= 0 ? 'surface pulls up ' : 'surface pushes down ') + M.fmt(Math.abs(f) * 1e6, 0) + ' µN = weight of the column',
          c: M.fmt(L.T, 3) + ' N/m, contact angle ' + L.th + '°',
          d: 'h × r = ' + M.fmt(Math.abs(h * r) * 1e6, 1) + ' mm² (same for every tube)'
        };
      }
      if (p.scene === 'float') {
        var n = needle(p);
        return {
          a: n.s <= 1 ? 'Floats (surface dips by ' + M.fmt(M.deg(Math.asin(n.s)), 0) + '°)' : 'Sinks!',
          b: 'weight ' + M.fmt(n.w * 1000, 1) + ' mN/m vs max pull 2T = ' + M.fmt(n.sup * 1000, 0) + ' mN/m',
          c: M.fmt(n.T, 3) + ' N/m' + (p.soap ? ' (soapy)' : ' (clean water)'),
          d: 'Thickest steel needle that floats here ≈ ' + M.fmt(n.dMax, 2) + ' mm'
        };
      }
      var R1 = capR(capH(st.V1)), R2 = capR(capH(st.V2)), p1 = 4 * T_SOAP_FILM / R1, p2 = 4 * T_SOAP_FILM / R2, eq = Math.abs(p1 - p2) < 0.02;
      return {
        a: eq ? 'Balanced: both surfaces have R = ' + M.fmt(R1 * 100, 1) + ' cm' : (p1 > p2 ? 'Air flows left → right' : 'Air flows right → left'),
        b: 'Δp left ' + M.fmt(p1, 2) + ' Pa, right ' + M.fmt(p2, 2) + ' Pa',
        c: T_SOAP_FILM + ' N/m (soap film, 2 surfaces)',
        d: 'Excess pressure 4T/R: smaller bubble → higher pressure'
      };
    },
    status: function (sim) {
      var p = sim.p;
      if (p.scene === 'tubes') return LIQ[p.liq].th < 90 ? 'Thinner tube, higher rise' : 'The surface pushes the level down';
      if (p.scene === 'float') return needle(p).s <= 1 ? 'Held up by surface tension' : 'Surface tension too weak: it sinks';
      var d = 4 * T_SOAP_FILM / capR(capH(st.V1)) - 4 * T_SOAP_FILM / capR(capH(st.V2));
      return Math.abs(d) < 0.02 ? 'Balanced: the small cap now curves like the big bubble' : 'The small bubble shrinks into the big one';
    },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 11 : 13;
      D.clear(ctx, W, H, c.bg);
      var tag = function (t, x, y, col, al, sz) { D.text(ctx, t, x, y, { color: col || c.ink, size: sz || fs, weight: 700, align: al || 'center', bg: D.alpha(c.bg, 0.82), pad: 3, fit: W }); };

      if (p.scene === 'tubes') {
        var L = LIQ[p.liq], r = p.r / 1000, hMax = Math.abs(jurin(L, r)), up = L.th < 90;
        var y0 = up ? H * 0.74 : H * 0.36, avail = up ? y0 - 56 : H - 40 - y0, sc = avail / Math.max(hMax, 0.002) * 0.9;
        var tx = narrow ? [W * 0.28, W * 0.5, W * 0.74] : [W * 0.3, W * 0.5, W * 0.7];
        var wpx = [7, 14, 28].map(function (w) { return narrow ? w : w * 1.3; });
        var tTop = up ? 46 : y0 - H * 0.24, tBot = up ? H - 34 : H - 22;
        // trough of liquid
        var trL = W * 0.1, trR = W * 0.92;
        ctx.fillStyle = D.alpha(L.col, 0.3); ctx.fillRect(trL, y0, trR - trL, H - 12 - y0);
        ctx.strokeStyle = c.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(trL, y0 - 20); ctx.lineTo(trL, H - 12); ctx.lineTo(trR, H - 12); ctx.lineTo(trR, y0 - 20); ctx.stroke();
        D.line(ctx, trL, y0, trR, y0, L.col, 2);
        tx.forEach(function (x, i) {
          var w = wpx[i], h = st.h[i], ly = y0 - h * sc;
          ctx.fillStyle = c.bg; ctx.fillRect(x - w / 2, tTop, w, tBot - tTop);              // inside the tube, above / below
          ctx.fillStyle = D.alpha(L.col, 0.3);
          ctx.fillRect(x - w / 2, Math.max(ly, tTop), w, tBot - Math.max(ly, tTop));
          if (!up) { ctx.fillStyle = D.alpha(L.col, 0.3); ctx.fillRect(x - w / 2, ly, w, tBot - ly); }
          // meniscus: concave (θ < 90°) or convex (θ > 90°)
          var dip = Math.min(w * 0.45, 10) * Math.cos(M.rad(L.th));
          ctx.beginPath(); ctx.moveTo(x - w / 2, ly - dip * 0.5); ctx.quadraticCurveTo(x, ly + dip, x + w / 2, ly - dip * 0.5);
          ctx.strokeStyle = L.col; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.strokeStyle = D.alpha(c.ink, 0.85); ctx.lineWidth = 2;
          ctx.strokeRect(x - w / 2, tTop, w, tBot - tTop);
          D.text(ctx, ['r', '2r', '4r'][i], x, tTop - 10, { color: c.ink, size: fs, weight: 700, align: 'center' });
          if (Math.abs(h) * sc > 14) {
            D.line(ctx, x + w / 2 + 6, y0, x + w / 2 + 6, ly, c.warning, 1.5, [3, 3]);
          }
          tag((h >= 0 ? '' : '−') + M.fmt(Math.abs(h) * 100, Math.abs(h) < 0.1 ? 2 : 1) + ' cm', x + w / 2 + 8, (y0 + ly) / 2 + (Math.abs(h) * sc < 14 ? (up ? -12 : 12) : 0), c.warning, 'left', fs - 1);
        });
        // cm ruler on the left
        var step = D.niceStep(avail / sc * 100, 4);
        for (var cm = 0; cm * sc / 100 <= avail + 1; cm += step) {
          var yy = up ? y0 - cm / 100 * sc : y0 + cm / 100 * sc;
          D.line(ctx, W * 0.05, yy, W * 0.08, yy, c.muted, 1.5);
          D.text(ctx, M.fmt(cm, step < 1 ? 1 : 0), W * 0.045, yy, { color: c.muted, size: fs - 2, align: 'right' });
        }
        D.text(ctx, 'cm', W * 0.045, up ? y0 - avail - 16 : y0 + avail + 14, { color: c.muted, size: fs - 2, align: 'right' });
        D.text(ctx, L.name + (up ? ': thinner tube, higher rise' : ': level pushed down'), W / 2, 12, { color: c.muted, size: fs - 1, align: 'center', fit: W });
        tag('outside level', trL + 4, y0 + 12, c.muted, 'left', fs - 2);
        return;
      }

      if (p.scene === 'float') {
        // end view (cross-section) of the needle on the water, magnified
        var n = needle(p), cx = W * 0.5, wy = H * 0.42, R = Math.min(W * 0.07, H * 0.08, 40) * (p.d / 1.2), sinking = n.s > 1;
        R = M.clamp(R, 8, Math.min(W * 0.12, H * 0.13));
        var phi = sinking ? Math.PI / 2 : Math.asin(Math.min(1, n.s));
        var water = '#38bdf8', bottom = H - 30;
        // dent: surface curves down to touch the needle at angle φ
        var depth = sinking ? R : R * (1 - Math.cos(phi)) + R * 0.9 * Math.sin(phi), ny = wy + depth - R * 0.15 + st.sink * (bottom - R - wy - depth);
        var xc = R * Math.sin(phi) + 2, span = Math.min(W * 0.4, R * 7);
        ctx.beginPath(); ctx.moveTo(0, wy);
        ctx.lineTo(cx - span, wy);
        if (st.sink > 0.05) { ctx.lineTo(cx + span, wy); }
        else {
          ctx.bezierCurveTo(cx - span * 0.45, wy, cx - xc - R * 0.6 * Math.cos(phi), ny + R * 0.15 - R * 0.6 * Math.sin(phi) * 0.5, cx - xc, ny + R * 0.15);
          ctx.lineTo(cx + xc, ny + R * 0.15);
          ctx.bezierCurveTo(cx + xc + R * 0.6 * Math.cos(phi), ny + R * 0.15 - R * 0.6 * Math.sin(phi) * 0.5, cx + span * 0.45, wy, cx + span, wy);
        }
        ctx.lineTo(W, wy); ctx.lineTo(W, bottom); ctx.lineTo(0, bottom); ctx.closePath();
        ctx.fillStyle = D.alpha(p.soap ? '#a5f3fc' : water, 0.28); ctx.fill();
        ctx.strokeStyle = p.soap ? '#a5f3fc' : water; ctx.lineWidth = 2.5; ctx.stroke();
        D.line(ctx, 0, bottom, W, bottom, c.ink, 3);
        D.circle(ctx, cx, ny, R, '#cbd5e1', c.ink, 1.5);
        if (st.sink < 0.05) {
          // surface-tension pulls along the surface at each contact point
          var Lt = Math.min(W * 0.16, 90);
          [-1, 1].forEach(function (s) {
            var x0 = cx + s * xc, y0b = ny + R * 0.15;
            D.arrow(ctx, x0, y0b, x0 + s * Lt * Math.cos(phi), y0b - Lt * Math.sin(phi), c.s1, 3.5, 10);
          });
          tag('T', cx + xc + Lt * Math.cos(phi) + 10, ny + R * 0.15 - Lt * Math.sin(phi), c.s1, 'left');
          tag('T', cx - xc - Lt * Math.cos(phi) - 10, ny + R * 0.15 - Lt * Math.sin(phi), c.s1, 'right');
          var Lw = Math.min(H * 0.22, 2 * Lt * Math.min(n.s, 1.5));
          D.arrow(ctx, cx, ny + R, cx, ny + R + Math.max(8, Lw), c.danger, 4, 11);
          tag('weight', cx + 8, ny + R + Math.max(8, Lw) - 4, c.danger, 'left');
          if (!sinking) tag('φ = ' + M.fmt(M.deg(phi), 0) + '°', cx - xc - 10, ny + R * 0.15 + 16, c.muted, 'right', fs - 1);
        }
        // support meter
        var bw = Math.min(W * 0.6, 300), bx = (W - bw) / 2, by = 30, frac = Math.min(n.s, 1.6) / 1.6;
        D.roundRect(ctx, bx, by, bw, 12, 6, D.alpha(c.ink, 0.12));
        D.roundRect(ctx, bx, by, Math.max(12, bw * frac), 12, 6, sinking ? c.danger : c.success);
        D.line(ctx, bx + bw / 1.6, by - 4, bx + bw / 1.6, by + 16, c.ink, 2);
        D.text(ctx, 'weight ÷ greatest pull of the surface: ' + M.fmt(n.s, 2), W / 2, 12, { color: sinking ? c.danger : c.muted, size: fs - 1, weight: 700, align: 'center', fit: W });
        D.text(ctx, 'limit 1', bx + bw / 1.6 + 4, by + 24, { color: c.muted, size: fs - 2 });
        tag(sinking ? (p.soap ? 'Soap lowered T: the needle sinks' : 'Too heavy: the needle sinks') : 'End view, magnified: the needle rests in a dent', W / 2, H - 14, sinking ? c.danger : c.muted, 'center', fs - 1);
        return;
      }

      // ---------- bubbles on a tube ----------
      var h1 = capH(st.V1), h2 = capH(st.V2), R1 = capR(h1), R2 = capR(h2);
      var mouthY = H * 0.62, xs = [W * 0.27, W * 0.73], sc2 = Math.min(H * 0.5 / 0.105, W * 0.22 / 0.052), a = MOUTH * sc2, tw = Math.max(8, a * 0.5);
      var baseY = H - 40;
      ctx.strokeStyle = c.ink; ctx.lineWidth = 2.5;
      // tube: two arms joined along the bottom, with a tap in the middle
      ctx.fillStyle = D.alpha(c.ink, 0.08);
      xs.forEach(function (x) { ctx.fillRect(x - a, mouthY, 2 * a, baseY - mouthY); ctx.strokeRect(x - a, mouthY, 2 * a, baseY - mouthY); });
      ctx.fillRect(xs[0] + a, baseY - tw * 2, xs[1] - xs[0] - 2 * a, tw * 2);
      D.line(ctx, xs[0] + a, baseY - tw * 2, xs[1] - a, baseY - tw * 2, c.ink, 2.5); D.line(ctx, xs[0] + a, baseY, xs[1] - a, baseY, c.ink, 2.5);
      var open = sim.running || st.t > 0;
      D.circle(ctx, W / 2, baseY - tw, tw * 1.3, c.surface2 || c.bg, c.ink, 2);
      ctx.save(); ctx.translate(W / 2, baseY - tw); ctx.rotate(open ? 0 : Math.PI / 2);
      D.roundRect(ctx, -tw * 1.2, -3, tw * 2.4, 6, 3, open ? c.success : c.danger); ctx.restore();
      D.text(ctx, open ? 'tap open' : 'tap shut (press Start)', W / 2, baseY + 16, { color: open ? c.success : c.muted, size: fs - 1, weight: 700, align: 'center', fit: W });
      [[h1, R1], [h2, R2]].forEach(function (b, i) {
        var x = xs[i], R = b[1] * sc2, cy = mouthY - (b[0] * sc2 - R);
        var aR = Math.atan2(mouthY - cy, a), aL = Math.atan2(mouthY - cy, -a);
        ctx.beginPath(); ctx.moveTo(x - a, mouthY); ctx.arc(x, cy, R, aL, aR, false); ctx.closePath();
        var grd = ctx.createRadialGradient(x - R * 0.35, cy - R * 0.35, R * 0.1, x, cy, R);
        grd.addColorStop(0, 'rgba(255,255,255,0.35)'); grd.addColorStop(0.7, 'rgba(165,180,252,0.12)'); grd.addColorStop(1, 'rgba(244,114,182,0.25)');
        ctx.fillStyle = grd; ctx.fill();
        ctx.strokeStyle = D.alpha(c.ink, 0.8); ctx.lineWidth = 1.8; ctx.stroke();
        var pr = 4 * T_SOAP_FILM / b[1];
        tag('R ' + M.fmt(b[1] * 100, 1) + ' cm · ' + M.fmt(pr, 1) + ' Pa', x, Math.max(12, mouthY - b[0] * sc2 - 14), i ? c.s2 : c.s1, 'center', fs - 1);
      });
      var dp = 4 * T_SOAP_FILM / R1 - 4 * T_SOAP_FILM / R2;
      if (open && Math.abs(dp) > 0.02) {
        var dir = dp > 0 ? 1 : -1, ax = W / 2 - dir * W * 0.12, ay = baseY - tw;
        D.arrow(ctx, ax - dir * 6, ay - tw * 2.2, ax + dir * W * 0.08, ay - tw * 2.2, c.warning, 3, 9);
        D.text(ctx, 'air', ax + dir * W * 0.04, ay - tw * 2.2 - 12, { color: c.warning, size: fs - 1, weight: 700, align: 'center' });
      }
    }
  });
})();
