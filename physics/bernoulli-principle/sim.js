/* =====================================================================
   Mechanical properties of fluids · Bernoulli's Principle — sim.js
   ---------------------------------------------------------------------
   Three scenes, all with  p + ½ρv² = constant  along a streamline
   (level flow, no friction, incompressible).
     pipe  — water (ρ = 1000 kg/m³) in a horizontal pipe 5 cm wide that
             narrows to d₂. Continuity v = Q/A; open tubes on top show
             gauge pressure as a water column h = p/(ρg). If the throat
             pressure drops below the air outside, the tube sucks air in
             (that is how a spray pump or a lab aspirator works).
     wing  — small trainer aeroplane: 1000 kg, wing area 16 m², air
             ρ = 1.2 kg/m³. Lift coefficient of a cambered aerofoil
             C_L ≈ 0.3 + 2π·α (α in radians, thin-aerofoil slope).
             L = ½ρv²S·C_L. Shown as top/bottom speeds v(1 ± C_L/4), which
             gives the same Δp by Bernoulli. Stall is not modelled
             (angle limited to 14°).
     train — top view of a platform. Air dragged by the train moves at
             roughly v_air = 0.5·v·e^(−d/1.5 m) at d metres from its side
             (a rough, rounded model). Pressure drop ½ρv_air² on a
             0.7 m² person gives the sideways pull.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var RHO_W = 1000, RHO_A = 1.2, G = 9.8, D1 = 0.05;
  var MASS = 1000, AREA = 16, BODY = 0.7;

  // ---------- physics ----------
  function pipe(p) {
    var A1 = Math.PI * D1 * D1 / 4, A2 = Math.PI * Math.pow(p.d2 / 100, 2) / 4, Q = p.Q / 1000;
    var v1 = Q / A1, v2 = Q / A2, p1 = p.p1 * 1000, p2 = p1 - 0.5 * RHO_W * (v2 * v2 - v1 * v1);
    return { v1: v1, v2: v2, p1: p1, p2: p2, h1: p1 / (RHO_W * G), h2: p2 / (RHO_W * G) };
  }
  function wing(p) {
    var v = p.va / 3.6, CL = 0.3 + 2 * Math.PI * M.rad(p.aoa), L = 0.5 * RHO_A * v * v * AREA * CL;
    var e = CL / 4, vt = v * (1 + e), vb = v * (1 - e);
    return { v: v, CL: CL, L: L, W: MASS * G, vt: vt, vb: vb, dp: 0.5 * RHO_A * (vt * vt - vb * vb), vTO: Math.sqrt(2 * MASS * G / (RHO_A * AREA * CL)) * 3.6 };
  }
  function airAt(p, d) { return 0.5 * (p.vt / 3.6) * Math.exp(-d / 1.5); }
  function train(p) {
    var va = airAt(p, p.dist), dp = 0.5 * RHO_A * va * va;
    return { va: va, dp: dp, F: dp * BODY };
  }

  // ---------- pipe geometry (fractions of the canvas width) ----------
  function pipeR(fx, R1, R2) {
    var a = 0.32, b = 0.44, c = 0.56, d = 0.68;
    if (fx < a || fx > d) return R1;
    if (fx >= b && fx <= c) return R2;
    var k = fx < b ? (fx - a) / (b - a) : (d - fx) / (d - c);
    return R1 + (R2 - R1) * (0.5 - 0.5 * Math.cos(Math.PI * k));
  }
  // ---------- aerofoil: upper / lower surface at chord fraction x ----------
  function foil(x) {
    var t = 0.13, m = 0.045, pk = 0.4;
    var yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x);
    var yc = x < pk ? m / (pk * pk) * (2 * pk * x - x * x) : m / ((1 - pk) * (1 - pk)) * (1 - 2 * pk + 2 * pk * x - x * x);
    return { u: yc + yt, l: yc - yt, c: yc };
  }

  var LANES = [-0.6, -0.32, -0.15, 0.11, 0.24, 0.42, 0.68];
  // height of a streamline (chord units, up +, level air) at chord position fx; the wing is tilted by a
  function laneY(fx, lane, a) {
    var up = lane > 0, inside = fx > 0 && fx < 1, sf = inside ? foil(fx) : { u: 0, l: 0 };
    var env = inside ? 1 : Math.exp(-Math.pow((fx < 0 ? fx : fx - 1) / 0.25, 2)), near = Math.exp(-Math.abs(lane) / 0.4);
    var surf = (up ? Math.max(sf.u, 0.02) - 0.02 : Math.min(sf.l, -0.01) + 0.01) - (M.clamp(fx, 0, 1) - 0.25) * a;
    var wash = fx > 0.9 ? -(fx - 0.9) * a * 0.5 * near : fx < 0 ? -fx * a * 0.15 * near : 0;   // air turned down behind the wing
    return lane + surf * near * env + wash;
  }
  var st = { parts: [], t: 0, trainX: -1, papers: [] };
  function seed() {
    var rnd = M.rng(7);
    st.parts = [];
    for (var i = 0; i < 170; i++) st.parts.push({ s: rnd(), f: rnd() * 2 - 1, k: rnd() });
    st.papers = [];
    for (var j = 0; j < 9; j++) st.papers.push({ x: 0.08 + j * 0.105 + rnd() * 0.03, d: 0.6 + rnd() * 2.6, d0: 0, x0: 0, rot: rnd() * 6 });
    st.papers.forEach(function (q) { q.d0 = q.d; q.x0 = q.x; });
    st.t = 0; st.trainX = -0.25;
  }

  SimLab.createSim({
    ariaLabel: 'Bernoulli\'s principle in three scenes: water speeding up in a narrow pipe while the pressure tubes above it drop, air flowing faster over an aeroplane wing so that it lifts, and a fast train pulling air, paper and people towards it on a platform',
    autoplay: true,
    mobileAspect: '3 / 3.3',
    params: [
      { id: 'scene', label: 'Scene', type: 'select', value: 'pipe', options: [
        { value: 'pipe', label: 'Narrow pipe (Venturi meter)' },
        { value: 'wing', label: 'Aeroplane wing' },
        { value: 'train', label: 'Fast train at a platform' }] },
      { id: 'Q', label: 'Pipe: flow rate', min: 0.1, max: 2, step: 0.05, value: 0.6, unit: 'L/s', presets: [0.3, 0.6, 1.2] },
      { id: 'd2', label: 'Pipe: narrow part', min: 1.5, max: 5, step: 0.1, value: 2.5, unit: 'cm', help: 'The wide pipe is 5 cm across.' },
      { id: 'p1', label: 'Pipe: pressure at the inlet', min: 2, max: 8, step: 0.5, value: 4, unit: 'kPa above air' },
      { id: 'va', label: 'Wing: air speed', min: 0, max: 250, step: 5, value: 90, unit: 'km/h', presets: [60, 120, 200] },
      { id: 'aoa', label: 'Wing: tilt (angle of attack)', min: 0, max: 14, step: 1, value: 6, unit: '°' },
      { id: 'vt', label: 'Train: speed', min: 0, max: 160, step: 5, value: 110, unit: 'km/h', presets: [40, 110, 160] },
      { id: 'dist', label: 'Train: you stand from its side', min: 0.3, max: 4.2, step: 0.1, value: 1, unit: 'm' }
    ],
    readouts: [
      { id: 'a', label: 'Speed', key: true },
      { id: 'b', label: 'Pressure', key: true },
      { id: 'c', label: 'Result', key: true },
      { id: 'd', label: 'More' }
    ],
    reset: function () { seed(); },
    onParam: function () { return true; },
    update: function (sim, dt) {
      var p = sim.p, W = sim.width;
      st.t += dt;
      if (p.scene === 'pipe') {
        var r = pipe(p);
        st.parts.forEach(function (q) {
          var fx = 0.03 + q.s * 0.94, R1 = 1, R2 = p.d2 / 5, rr = pipeR(fx, R1, R2);
          var v = r.v1 / (rr * rr);                      // continuity: v ∝ 1/area
          q.s += Math.min(v, 3) / 0.3 * dt * 0.2;         // drawn slowed down, very fast flow capped
          if (q.s > 1) { q.s -= 1; }
        });
      } else if (p.scene === 'wing') {
        var w = wing(p), sp = 0.15 + w.v / 70;
        st.parts.forEach(function (q, i) {
          var lane = LANES[i % LANES.length], near = Math.exp(-Math.abs(lane) / 0.4), inChord = q.s > 0.3 && q.s < 0.62 ? 1 : 0.35;
          var e = (lane > 0 ? 1 : -1) * (w.CL / 4) * near * inChord;
          q.s += sp * (1 + e) * dt * 0.35;
          if (q.s > 1) q.s -= 1;
        });
      } else {
        var vt = p.vt / 3.6;
        if (vt > 0) st.trainX += vt * dt / 120;         // train length in "view widths": 1.4
        if (st.trainX > 1.5) {
          st.trainX = -0.8;
          st.papers.forEach(function (q) { q.d = q.d0; q.x = q.x0; });
        }
        var passing = st.trainX > -0.05 && st.trainX < 1.45;
        st.papers.forEach(function (q) {
          if (!passing || q.d <= 0.05) return;
          var va = airAt(p, q.d), pull = va * va * 0.02;     // drawn effect, grows with the pressure drop
          q.d = Math.max(0.05, q.d - pull * dt);
          q.x += va * dt * 0.004; q.rot += va * dt * 0.3;
          if (q.d <= 0.05) q.x = 2;                        // swept away under the train
        });
      }
    },
    readout: function (sim) {
      var p = sim.p;
      if (p.scene === 'pipe') {
        var r = pipe(p);
        return {
          a: 'wide ' + M.fmt(r.v1, 2) + ' m/s → narrow ' + M.fmt(r.v2, 2) + ' m/s',
          b: M.fmt(r.p1 / 1000, 1) + ' → ' + M.fmt(r.p2 / 1000, 2) + ' kPa above air',
          c: r.p2 < 0 ? 'Below air pressure: sucks air in' : 'Tubes differ by ' + M.fmt((r.h1 - r.h2) * 100, 1) + ' cm',
          d: 'A₁v₁ = A₂v₂ = ' + M.fmt(p.Q, 2) + ' L/s'
        };
      }
      if (p.scene === 'wing') {
        var w = wing(p);
        return {
          a: 'top ' + M.fmt(w.vt * 3.6, 0) + ', bottom ' + M.fmt(w.vb * 3.6, 0) + ' km/h',
          b: 'Δp = ' + M.fmt(w.dp, 0) + ' Pa',
          c: w.L >= w.W ? 'Lift ' + M.fmt(w.L / 1000, 1) + ' kN > weight: it flies' : 'Lift ' + M.fmt(w.L / 1000, 1) + ' kN < weight ' + M.fmt(w.W / 1000, 1) + ' kN',
          d: 'Take-off speed at this tilt ≈ ' + M.fmt(w.vTO, 0) + ' km/h'
        };
      }
      var t = train(p);
      return {
        a: 'air ' + M.fmt(t.va * 3.6, 0) + ' km/h at ' + M.fmt(p.dist, 1) + ' m',
        b: 'drop ' + M.fmt(t.dp, 0) + ' Pa',
        c: 'pull ≈ ' + M.fmt(t.F, 0) + ' N' + (t.F > 40 ? ' (dangerous)' : t.F > 10 ? ' (you feel it)' : ' (small)'),
        d: 'Like a ' + M.fmt(t.F / G, 1) + ' kg weight pulling you sideways'
      };
    },
    status: function (sim) { return sim.p.scene === 'pipe' ? 'Faster flow, lower pressure' : sim.p.scene === 'wing' ? 'Faster air on top, lower pressure on top' : 'Fast air near the train, low pressure'; },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 11 : 13;
      D.clear(ctx, W, H, c.bg);
      var tag = function (t, x, y, col, al) { D.text(ctx, t, x, y, { color: col || c.ink, size: fs, weight: 700, align: al || 'center', bg: D.alpha(c.bg, 0.82), pad: 3, fit: W }); };

      if (p.scene === 'pipe') {
        var r = pipe(p), cy = H * 0.7, R1 = Math.min(H * 0.11, 42), R2 = R1 * p.d2 / 5;
        var water = '#38bdf8';
        // pipe body
        ctx.beginPath();
        for (var x = 0; x <= W; x += 3) { var rr = pipeR(x / W, R1, R2); if (x) ctx.lineTo(x, cy - rr); else ctx.moveTo(x, cy - rr); }
        for (x = W; x >= 0; x -= 3) ctx.lineTo(x, cy + pipeR(x / W, R1, R2));
        ctx.closePath(); ctx.fillStyle = D.alpha(water, 0.22); ctx.fill();
        ctx.strokeStyle = c.ink; ctx.lineWidth = 3; ctx.stroke();
        // water particles: crowd together and speed up in the throat
        st.parts.forEach(function (q) {
          var fx = 0.03 + q.s * 0.94, rr = pipeR(fx, R1, R2), x = fx * W, y = cy + q.f * rr * 0.82;
          var v = r.v1 / Math.pow(rr / R1, 2), len = Math.min(26, 3 + v * 4);
          D.line(ctx, x - len, y, x, y, D.alpha(water, 0.85), 2);
        });
        // pressure tubes: inlet, throat, outlet
        var top = 34, avail = cy - R1 - top - 10, sc = avail / Math.max(r.h1, 0.05) * 0.88;
        [[0.16, r.h1, 'p₁'], [0.5, r.h2, 'p₂'], [0.84, r.h1, 'p₃']].forEach(function (tb, k) {
          var tx = tb[0] * W, base = cy - pipeR(tb[0], R1, R2), tw = narrow ? 14 : 18, tTop = top;
          ctx.fillStyle = D.alpha(c.ink, 0.05); ctx.fillRect(tx - tw / 2, tTop, tw, base - tTop);
          var lvl = base - tb[1] * sc;
          if (tb[1] > 0) {
            ctx.fillStyle = D.alpha(water, 0.7); ctx.fillRect(tx - tw / 2, lvl, tw, base - lvl);
            D.line(ctx, tx - tw / 2 - 6, lvl, tx + tw / 2 + 6, lvl, water, 2);
          } else {
            // below atmospheric: air bubbles drawn down into the water
            for (var b = 0; b < 4; b++) {
              var by = tTop + ((st.t * 60 + b * 30) % (base - tTop + 10));
              D.circle(ctx, tx + Math.sin(b * 2 + st.t * 5) * 2, by, 3, null, c.ink, 1.3);
            }
          }
          ctx.strokeStyle = c.ink; ctx.lineWidth = 2; ctx.beginPath();
          ctx.moveTo(tx - tw / 2, tTop); ctx.lineTo(tx - tw / 2, base); ctx.moveTo(tx + tw / 2, tTop); ctx.lineTo(tx + tw / 2, base); ctx.stroke();
          var txt = tb[1] > 0 ? M.fmt(tb[1] * 100, 1) + ' cm' : 'sucks air in!';
          tag(txt, tx + (k === 2 ? -tw : tw) / 2 + (k === 2 ? -6 : 6), Math.max(tTop + 10, Math.min(base - 12, tb[1] > 0 ? lvl : base - 20)), tb[1] > 0 ? c.ink : c.danger, k === 2 ? 'right' : 'left');
        });
        D.text(ctx, 'Pressure tubes (height of water = pressure above the air)', W / 2, 14, { color: c.muted, size: fs - 1, align: 'center', fit: W });
        // speed labels under the pipe
        tag('v₁ = ' + M.fmt(r.v1, 2) + ' m/s', 0.16 * W, cy + R1 + 16, c.s1);
        tag('v₂ = ' + M.fmt(r.v2, 2) + ' m/s', 0.5 * W, cy + Math.max(R2, R1 * 0.5) + 16 + (R1 - R2) * 0.6, c.warning);
        if (H - cy - R1 > 50) tag('narrow → faster → lower pressure', 0.5 * W, H - 14, c.success);
        D.arrow(ctx, 0.02 * W, cy, 0.09 * W, cy, c.ink, 2.5, 9);
        return;
      }

      if (p.scene === 'wing') {
        var w = wing(p), chord = Math.min(W * (narrow ? 0.62 : 0.5), H * 1.05), cx = W * 0.5 - chord * 0.12, wy = H * 0.46, a = M.rad(p.aoa);
        var toS = function (fx, fy) { // chord coords (0..1 along, up +) → screen, rotated about the quarter chord
          var dx = (fx - 0.25) * chord, dy = fy * chord;
          return { x: cx + dx * Math.cos(a) + dy * Math.sin(a), y: wy + dx * Math.sin(a) - dy * Math.cos(a) };
        };
        // streamlines (level air) with moving dashes
        var span = W / chord, x0c = 0.25 - (cx / chord) - 0.05, x1c = x0c + span + 0.1;
        var wS = function (fx, fy) { return { x: cx + (fx - 0.25) * chord, y: wy - fy * chord }; };
        LANES.forEach(function (lane) {
          ctx.strokeStyle = D.alpha(lane > 0 ? c.s1 : c.s2, 0.35); ctx.lineWidth = 1.5; ctx.beginPath();
          for (var k = 0; k <= 90; k++) {
            var fx = x0c + (x1c - x0c) * k / 90, q = wS(fx, laneY(fx, lane, a));
            if (k) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y);
          }
          ctx.stroke();
        });
        st.parts.forEach(function (q, i) {
          var lane = LANES[i % LANES.length], up = lane > 0, fx = x0c + (x1c - x0c) * q.s, inside = fx > 0 && fx < 1;
          var s = wS(fx, laneY(fx, lane, a)), e = (up ? 1 : -1) * (w.CL / 4) * Math.exp(-Math.abs(lane) / 0.4) * (inside ? 1 : 0.35);
          if (w.v > 0) D.line(ctx, s.x - (6 + 10 * (1 + e) * Math.min(1, w.v / 50)), s.y, s.x, s.y, up ? c.s1 : c.s2, 2);
        });
        // the wing
        ctx.beginPath();
        for (var k2 = 0; k2 <= 60; k2++) { var fx2 = Math.pow(k2 / 60, 2), q2 = toS(fx2, foil(fx2).u); if (k2) ctx.lineTo(q2.x, q2.y); else ctx.moveTo(q2.x, q2.y); }
        for (k2 = 60; k2 >= 0; k2--) { var fx3 = Math.pow(k2 / 60, 2), q3 = toS(fx3, foil(fx3).l); ctx.lineTo(q3.x, q3.y); }
        ctx.closePath(); ctx.fillStyle = D.alpha(c.ink, 0.75); ctx.fill();
        // forces from the middle of the wing
        var cp = toS(0.38, 0.06), Lpx = Math.min(H * 0.3, 14 + w.L / w.W * H * 0.15), Wpx = H * 0.15;
        D.arrow(ctx, cp.x, cp.y, cp.x, cp.y - Lpx, c.success, 4, 12);
        tag('lift ' + M.fmt(w.L / 1000, 1) + ' kN', cp.x + 8, cp.y - Lpx - 2, c.success, 'left');
        D.arrow(ctx, cp.x, cp.y + 4, cp.x, cp.y + 4 + Wpx, c.danger, 4, 12);
        tag('weight ' + M.fmt(w.W / 1000, 1) + ' kN', cp.x + 8, cp.y + 4 + Wpx, c.danger, 'left');
        // pressure notes in the corners
        tag('Above: faster air, LOWER pressure', W - 8, 34, c.s1, 'right');
        tag('Below: slower air, higher pressure', W - 8, H - 16, c.s2, 'right');
        // little plane: on the runway or flying (inset, bottom left)
        var fly = w.L >= w.W, iw = narrow ? 120 : 170, ih = 46, ix = 6, iy = H - ih - 6;
        D.roundRect(ctx, ix, iy, iw, ih, 8, D.alpha(c.bg, 0.92), D.alpha(c.ink, 0.2));
        D.line(ctx, ix + 8, iy + ih - 9, ix + iw - 8, iy + ih - 9, c.muted, 3);
        var px = ix + 40, py = iy + ih - 16 - (fly ? Math.min(14, 4 + (w.L / w.W - 1) * 30) : 0);
        ctx.save(); ctx.translate(px, py); ctx.rotate(fly ? -0.15 : 0);
        D.roundRect(ctx, -26, -5, 46, 8, 4, c.ink); ctx.beginPath(); ctx.moveTo(-26, -3); ctx.lineTo(-32, -12); ctx.lineTo(-20, -3); ctx.fillStyle = c.ink; ctx.fill();
        D.roundRect(ctx, -8, -2, 18, 3, 1.5, c.s1); ctx.restore();
        D.text(ctx, fly ? 'Airborne!' : 'On the runway', ix + iw - 8, iy + 13, { color: fly ? c.success : c.muted, size: fs - 1, weight: 700, align: 'right' });
        D.text(ctx, 'Air flows past the wing →', 10, 14, { color: c.muted, size: fs - 1, fit: W });
        return;
      }

      // ---------- train: top view ----------
      var t = train(p), m = narrow ? 1 : 1.2, trackH = H * 0.3, edge = trackH + 6, pxm = (H - edge - 12) / 4.4;
      ctx.fillStyle = D.alpha(c.ink, 0.06); ctx.fillRect(0, 0, W, trackH);
      for (var sl = 0; sl < W; sl += 16) ctx.fillRect(sl, trackH * 0.25, 6, trackH * 0.5);
      D.line(ctx, 0, trackH * 0.32, W, trackH * 0.32, c.muted, 2); D.line(ctx, 0, trackH * 0.68, W, trackH * 0.68, c.muted, 2);
      ctx.fillStyle = D.alpha(c.ink, 0.1); ctx.fillRect(0, edge, W, H - edge);
      D.line(ctx, 0, edge, W, edge, c.ink, 2.5);
      // yellow safety line 1 m from the train's side
      var yl = edge + pxm * 1.5;
      D.line(ctx, 0, yl, W, yl, '#facc15', 4, [14, 8]);
      D.text(ctx, 'yellow line', W - 6, yl - 10, { color: '#facc15', size: fs - 1, weight: 700, align: 'right' });
      // air-speed shading near the train
      var passing = st.trainX > -0.05 && st.trainX < 1.45;
      if (passing && p.vt > 0) {
        for (var dd = 0; dd < 4.4; dd += 0.2) {
          var va = airAt(p, dd), al = Math.min(0.5, va / 25 * 0.5);
          ctx.fillStyle = D.alpha(c.s1, al); ctx.fillRect(0, edge + dd * pxm, W, pxm * 0.2 + 1);
        }
        for (var sk = 0; sk < 14; sk++) {
          var ld = 0.15 + (sk % 5) * 0.5, sx = ((st.t * airAt(p, ld) * 40 + sk * 97) % (W + 60)) - 30;
          D.line(ctx, sx, edge + ld * pxm, sx + 14 + airAt(p, ld) * 1.2, edge + ld * pxm, D.alpha(c.s1, 0.8), 2);
        }
      }
      // the train, seen from above
      var tl = W * 1.4, tx0 = st.trainX * W, ty = trackH * 0.15, th = trackH * 0.7;
      if (tx0 > -tl && tx0 < W) {
        for (var cch = 0; cch < 4; cch++) {
          var cx0 = tx0 - cch * tl / 4;
          D.roundRect(ctx, cx0 - tl / 4 + 4, ty, tl / 4 - 6, th, cch === 0 ? 14 : 4, cch === 0 ? c.danger : D.alpha(c.danger, 0.75), c.ink, 1.5);
          for (var wv = 1; wv < 6; wv++) D.roundRect(ctx, cx0 - tl / 4 + 4 + wv * (tl / 4 - 6) / 6 - 6, ty + th * 0.3, 12, th * 0.4, 2, D.alpha(c.bg, 0.5));
        }
      }
      // paper bits
      st.papers.forEach(function (q) {
        if (q.x > 1.05) return;
        ctx.save(); ctx.translate(q.x * W, edge + q.d * pxm); ctx.rotate(q.rot);
        D.roundRect(ctx, -6 * m, -4 * m, 12 * m, 8 * m, 1, '#f8fafc', c.muted, 1); ctx.restore();
      });
      // the person (top view: shoulders + head)
      var ppx = W * 0.5, ppy = edge + p.dist * pxm;
      D.roundRect(ctx, ppx - 16, ppy - 7, 32, 14, 7, c.s3); D.circle(ctx, ppx, ppy, 7, c.warning, c.ink, 1.5);
      if (passing && p.vt > 0) {
        var Fl = Math.min(pxm * 1.6, 6 + t.F * 1.2);
        D.arrow(ctx, ppx + 24, ppy, ppx + 24, ppy - Fl, t.F > 40 ? c.danger : c.warning, 4, 11);
        tag('pull ' + M.fmt(t.F, 0) + ' N', ppx + 32, ppy - Fl / 2, t.F > 40 ? c.danger : c.warning, 'left');
      }
      // distance ruler
      D.line(ctx, ppx - 30, edge, ppx - 30, ppy, c.muted, 1.5, [3, 3]);
      tag(M.fmt(p.dist, 1) + ' m', ppx - 34, (edge + ppy) / 2, c.muted, 'right');
      tag(passing && p.vt > 0 ? 'fast air → low pressure → pushed towards the train' : (p.vt > 0 ? 'Train coming…' : 'Set a train speed'), W / 2, H - 14, passing ? c.s1 : c.muted);
    }
  });
})();
