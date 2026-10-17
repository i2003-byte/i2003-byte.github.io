/* =====================================================================
   Life processes · Heart and Double Circulation — sim.js
   ---------------------------------------------------------------------
   A front-view diagram (the heart's right side is on the viewer's left):
   lungs (or gills) at the top, body organs at the bottom, the heart in
   the middle. Blood cells (dots) go round the loop; they turn red
   (oxygen-rich) in the lungs/gills and blue (oxygen-poor) in the body.
     human / bird — 4 chambers, double circulation:
        body → vena cava → RA → RV → pulmonary artery → lungs →
        pulmonary vein → LA → LV → aorta → body
     frog — 2 atria, 1 ventricle: the two streams partly mix there.
     fish — 1 atrium, 1 ventricle, single circulation:
        heart → gills → body → heart (pressure is lost in the gills, so
        blood reaches the body slowly).
   Cardiac cycle (fractions of one beat, 60/HR s): atria squeeze 0–0.12,
   ventricles squeeze 0.12–0.49 (AV valves shut = "lub", semilunar valves
   open), relax 0.49–1 ("dub" as the semilunar valves shut).
   Stroke volume rises with heart rate (rough): SV = 70 + 0.45(HR − 72)
   mL, 60–110 mL. Cardiac output = HR × SV. Real round-trip time =
   5 L of blood ÷ cardiac output. The dots move about 8× faster than
   real blood so the loop is easy to follow.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw, A = SimLab.audio;
  var BLUE = '#3b82f6', RED = '#ef4444', MIX = '#a855f7', BLOOD_L = 5;

  function capillary(x0, x1, y, n, amp) {   // wavy capillary bed points
    var pts = [];
    for (var i = 1; i < n; i++) { var f = i / n; pts.push([x0 + (x1 - x0) * f, y + Math.sin(f * Math.PI * 6) * amp]); }
    return pts;
  }
  function route(animal) {
    var p;
    if (animal === 'fish') {
      p = [[0.42, 0.55, 'A'], [0.58, 0.55, 'V'], [0.80, 0.55], [0.80, 0.13], [0.74, 0.11, 'lungIn']]
        .concat(capillary(0.74, 0.26, 0.11, 24, 0.025))
        .concat([[0.26, 0.11, 'lungOut'], [0.14, 0.13], [0.14, 0.88], [0.26, 0.9, 'bodyIn']])
        .concat(capillary(0.26, 0.7, 0.9, 20, 0.025))
        .concat([[0.7, 0.9, 'bodyOut'], [0.76, 0.86], [0.76, 0.76], [0.42, 0.76], [0.42, 0.62]]);
    } else {
      var v = animal === 'frog';
      p = [[0.38, 0.4, 'RA'], [v ? 0.44 : 0.38, 0.63, 'RV'], [0.26, 0.63], [0.14, 0.63], [0.14, 0.13], [0.26, 0.11, 'lungIn']]
        .concat(capillary(0.26, 0.74, 0.11, 24, 0.025))
        .concat([[0.74, 0.11, 'lungOut'], [0.8, 0.13], [0.8, 0.4], [0.62, 0.4, 'LA'], [v ? 0.56 : 0.62, 0.63, 'LV'], [0.74, 0.63], [0.86, 0.63], [0.86, 0.88], [0.74, 0.9, 'bodyIn']])
        .concat(capillary(0.74, 0.26, 0.9, 20, 0.025))
        .concat([[0.26, 0.9, 'bodyOut'], [0.22, 0.86], [0.22, 0.4], [0.3, 0.4]]);
    }
    return p;
  }
  function sv(hr) { return M.clamp(70 + 0.45 * (hr - 72), 60, 110); }
  function phase(t, hr) { var Tc = 60 / hr; return (t % Tc) / Tc; }

  var st = { dots: [], t: 0, lastPh: 0, cache: null };
  function seed() { st.dots = []; for (var i = 0; i < 90; i++) st.dots.push(i / 90); st.t = 0; st.lastPh = 0; }

  // build the pixel path (with cumulative lengths) for this canvas size
  function geometry(sim) {
    var p = sim.p, W = sim.width, H = sim.height, key = p.animal + W + 'x' + H;
    if (st.cache && st.cache.key === key) return st.cache;
    var top = 26, bot = 26, ph = H - top - bot;
    var pts = route(p.animal).map(function (q) { return { x: q[0] * W, y: top + q[1] * ph, tag: q[2] }; });
    var L = [0];
    for (var i = 1; i <= pts.length; i++) { var a = pts[i - 1], b = pts[i % pts.length]; L.push(L[i - 1] + Math.hypot(b.x - a.x, b.y - a.y)); }
    var total = L[L.length - 1], at = {};
    pts.forEach(function (q, k) { if (q.tag) at[q.tag] = L[k] / total; });
    st.cache = { key: key, pts: pts, L: L, total: total, at: at, top: top, ph: ph, X: function (f) { return f * W; }, Y: function (f) { return top + f * ph; } };
    return st.cache;
  }
  function pointAt(g, s) {
    var d = ((s % 1) + 1) % 1 * g.total, i = 1;
    while (i < g.L.length - 1 && g.L[i] < d) i++;
    var a = g.pts[i - 1], b = g.pts[i % g.pts.length], u = (d - g.L[i - 1]) / ((g.L[i] - g.L[i - 1]) || 1);
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  }
  function inRange(s, a, b) { return a <= b ? s >= a && s < b : s >= a || s < b; }
  function frac(s, a, b) { var span = ((b - a) + 1) % 1; return (((s - a) + 1) % 1) / (span || 1); }
  function mixRGB(c1, c2, f) {
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    var r = Math.round((a >> 16) + (((b >> 16) - (a >> 16)) * f)), gg = Math.round(((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * f)), bb = Math.round((a & 255) + (((b & 255) - (a & 255)) * f));
    return 'rgb(' + r + ',' + gg + ',' + bb + ')';
  }
  function dotColor(animal, at, s) {
    if (inRange(s, at.lungIn, at.lungOut)) return mixRGB(animal === 'frog' ? MIX : BLUE, RED, M.clamp(frac(s, at.lungIn, at.lungOut) * 1.6, 0, 1));
    if (inRange(s, at.bodyIn, at.bodyOut)) return mixRGB(animal === 'frog' ? MIX : RED, BLUE, M.clamp(frac(s, at.bodyIn, at.bodyOut) * 1.6, 0, 1));
    if (animal === 'fish') return inRange(s, at.lungOut, at.bodyIn) ? RED : BLUE;
    if (animal === 'frog') {
      if (inRange(s, at.RV, at.lungIn) || inRange(s, at.LV, at.bodyIn)) return MIX;   // left the shared ventricle
      return inRange(s, at.lungOut, at.LV) ? RED : BLUE;
    }
    return inRange(s, at.lungOut, at.bodyIn) ? RED : BLUE;
  }

  SimLab.createSim({
    ariaLabel: 'Diagram of the double circulation: blood cells go from the body to the right side of the heart, to the lungs where they turn red, back to the left side of the heart and out to the body where they turn blue, while the four chambers squeeze in turn and the valves open and shut. A frog heart with three chambers and a fish heart with two can be compared',
    autoplay: true,
    audio: true,
    mobileAspect: '3 / 3.4',
    params: [
      { id: 'animal', label: 'Heart of a', type: 'select', value: 'human', options: [
        { value: 'human', label: 'Human or bird (4 chambers)' },
        { value: 'frog', label: 'Frog (3 chambers)' },
        { value: 'fish', label: 'Fish (2 chambers)' }] },
      { id: 'hr', label: 'Heart rate', min: 40, max: 180, step: 1, value: 72, unit: 'beats/min',
        presets: [{ label: 'Asleep', value: 60 }, { label: 'Resting', value: 72 }, { label: 'Walking', value: 100 }, { label: 'Running', value: 160 }] },
      { id: 'labels', label: 'Show vessel names', type: 'toggle', value: true }
    ],
    readouts: [
      { id: 'hr', label: 'Heart rate', key: true },
      { id: 'co', label: 'Blood pumped per minute', key: true, short: 'Per minute' },
      { id: 'ph', label: 'Now', key: true },
      { id: 'sv', label: 'Blood per beat (each ventricle)' },
      { id: 'rt', label: 'One full round trip (real)' },
      { id: 'o2', label: 'Blood reaching the body' }
    ],
    graph: { title: 'Ventricle volume over a few beats', yLabel: 'mL', series: [{ label: 'Left ventricle', color: 'danger' }], window: 4 },
    reset: function () { seed(); },
    onParam: function (sim, id) { if (id === 'animal') st.cache = null; return true; },
    update: function (sim, dt) {
      var p = sim.p, hr = p.hr, ph = phase(st.t, hr);
      var co = hr * sv(hr) / 1000, loop = 8 * (5.04 / co);           // seconds per drawn loop
      var mult = ph >= 0.12 && ph < 0.49 ? 1.7 : 0.6;
      var g = st.cache;
      st.dots = st.dots.map(function (s) {
        var m = mult;
        if (p.animal === 'fish' && g && inRange(s, g.at.lungOut, g.at.bodyOut)) m *= 0.45;   // pressure lost in the gills
        if (p.animal === 'fish' && g && !inRange(s, g.at.lungOut, g.at.bodyOut)) m *= 1.25;
        return (s + m * dt / loop) % 1;
      });
      st.t += dt;
      var nph = phase(st.t, hr);
      if (st.lastPh < 0.12 && nph >= 0.12) A.tone(80, { duration: 0.14, gain: 0.5, harmonics: [1, 0.6, 0.3] });
      if (st.lastPh < 0.49 && nph >= 0.49) A.tone(110, { duration: 0.1, gain: 0.35, harmonics: [1, 0.5, 0.25] });
      st.lastPh = nph;
    },
    sample: function (sim) {
      var ph = phase(st.t, sim.p.hr), s = sv(sim.p.hr), edv = s + 50, v;
      if (ph < 0.12) v = edv - 25 + 25 * (ph / 0.12);                          // atria top it up
      else if (ph < 0.49) v = edv - s * (0.5 - 0.5 * Math.cos(Math.PI * (ph - 0.12) / 0.37));
      else v = edv - s + (s - 25) * Math.min(1, (ph - 0.49) / 0.25);            // fills while relaxed
      return [v];
    },
    readout: function (sim) {
      var p = sim.p, hr = p.hr, s = sv(hr), co = hr * s / 1000, ph = phase(st.t, hr);
      var now = ph < 0.12 ? 'Atria squeeze, ventricles fill' : ph < 0.49 ? 'Ventricles squeeze (lub): blood out' : 'Heart relaxes (dub), chambers fill';
      return {
        hr: hr + ' beats/min' + (p.animal === 'human' ? '' : ' (drawn speed)'),
        co: p.animal === 'human' ? M.fmt(co, 1) + ' L/min' : 'numbers given for a human only',
        ph: now,
        sv: p.animal === 'human' ? M.fmt(s, 0) + ' mL' : '—',
        rt: p.animal === 'human' ? 'about ' + M.fmt(BLOOD_L / co * 60, 0) + ' s for 5 L of blood' : '—',
        o2: p.animal === 'human' ? 'fully oxygen-rich, at high pressure' : p.animal === 'frog' ? 'partly mixed (skin breathing helps)' : 'oxygen-rich but at low pressure'
      };
    },
    status: function (sim) { return sim.p.animal === 'fish' ? 'Single circulation: through the heart once per round' : sim.p.animal === 'frog' ? 'Double circulation with some mixing' : 'Double circulation: through the heart twice per round'; },

    draw: function (sim) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 10 : 12;
      D.clear(ctx, W, H, c.bg);
      var g = geometry(sim), X = g.X, Y = g.Y, ph = phase(st.t, p.hr), fish = p.animal === 'fish', frog = p.animal === 'frog';
      var aSq = ph < 0.12 ? 1 - 0.14 * Math.sin(Math.PI * ph / 0.12) : 1;
      var vSq = ph >= 0.12 && ph < 0.49 ? 1 - 0.18 * Math.sin(Math.PI * (ph - 0.12) / 0.37) : 1;
      var vSys = ph >= 0.12 && ph < 0.49;
      var tag = function (t, x, y, col, al, sz) { D.text(ctx, t, x, y, { color: col || c.ink, size: sz || fs, weight: 700, align: al || 'center', bg: D.alpha(c.bg, 0.85), pad: 2, fit: W }); };

      // organ beds
      var bed = function (y, col, name, sub) {
        D.roundRect(ctx, X(0.22), Y(y) - g.ph * 0.07, X(0.56), g.ph * 0.14, 14, D.alpha(col, 0.13), D.alpha(col, 0.5), 1.5);
        D.text(ctx, name, X(0.5), Y(y) + (y < 0.5 ? -g.ph * 0.07 - 9 : g.ph * 0.07 + 9), { color: col, size: fs + 1, weight: 700, align: 'center', fit: W });
        if (sub && !narrow) D.text(ctx, sub, X(0.5), Y(y) + (y < 0.5 ? g.ph * 0.07 + 9 : -g.ph * 0.07 - 9), { color: c.muted, size: fs - 1, align: 'center', fit: W });
      };
      bed(0.11, '#f472b6', fish ? 'Gills: blood picks up oxygen' : 'Lungs: blood picks up oxygen', 'gives out carbon dioxide');
      bed(0.9, '#f59e0b', 'Body: organs and muscles use oxygen', 'take food and oxygen, give back carbon dioxide');

      // vessels: thick tubes drawn under the dots, coloured by the blood they carry
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var N = 160, prev = null;
      for (var k = 0; k <= N; k++) {
        var s = k / N, q = pointAt(g, s);
        if (prev) { ctx.strokeStyle = D.alpha(dotColor(p.animal, g.at, s).replace('rgb', 'rgb'), 1); ctx.globalAlpha = 0.3; ctx.lineWidth = narrow ? 9 : 12; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.globalAlpha = 1; }
        prev = q;
      }
      if (!fish) {   // bridge where the pulmonary artery crosses over the vena cava
        D.line(ctx, X(0.205), Y(0.63), X(0.235), Y(0.63), c.bg, narrow ? 12 : 15);
        D.line(ctx, X(0.19), Y(0.63), X(0.25), Y(0.63), D.alpha(BLUE, 0.3), narrow ? 9 : 12);
      }

      // heart chambers
      var cham = function (cx, cy, w, h, sq, col, name, full, below) {
        var ww = X(w) * sq, hh = g.ph * h * sq;
        D.roundRect(ctx, X(cx) - ww / 2, Y(cy) - hh / 2, ww, hh, Math.min(ww, hh) * 0.3, D.alpha(col, 0.22), c.ink, 2);
        D.text(ctx, narrow || !full ? name : full, X(cx), Y(cy) + (below ? hh / 2 - 10 : -hh / 2 + 10), { color: c.ink, size: fs, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.6), pad: 2 });
      };
      if (fish) {
        cham(0.42, 0.55, 0.13, 0.13, aSq, BLUE, 'Atrium');
        cham(0.58, 0.55, 0.14, 0.16, vSq, BLUE, 'Ventricle');
      } else {
        cham(0.38, 0.4, 0.15, 0.15, aSq, BLUE, 'RA', 'Right atrium');
        cham(0.62, 0.4, 0.15, 0.15, aSq, RED, 'LA', 'Left atrium');
        if (frog) cham(0.5, 0.64, 0.3, 0.2, vSq, MIX, 'One ventricle: blood mixes', null, true);
        else {
          cham(0.38, 0.64, 0.15, 0.2, vSq, BLUE, 'RV', 'Right ventricle');
          var lw = X(0.17) * vSq, lh = g.ph * 0.21 * vSq;   // thick muscular wall of the left ventricle
          D.roundRect(ctx, X(0.62) - lw / 2, Y(0.64) - lh / 2, lw, lh, Math.min(lw, lh) * 0.3, null, c.ink, 5);
          cham(0.62, 0.64, 0.15, 0.2, vSq, RED, 'LV', 'Left ventricle');
        }
      }

      // valves: AV valves (between atrium and ventricle) shut while the ventricles squeeze; exit valves open then
      var valve = function (x, y, horiz, open, label) {
        var L = narrow ? 7 : 9, col = open ? c.success : c.warning;
        if (horiz) {   // across a vertical flow
          if (open) { D.line(ctx, x - L, y - 1, x - L * 0.7, y + L, col, 3); D.line(ctx, x + L, y - 1, x + L * 0.7, y + L, col, 3); }
          else { D.line(ctx, x - L, y, x, y + 2, col, 3); D.line(ctx, x + L, y, x, y + 2, col, 3); }
        } else {
          var dir = x < W / 2 ? -1 : 1;
          if (open) { D.line(ctx, x, y - L, x + dir * L, y - L * 0.7, col, 3); D.line(ctx, x, y + L, x + dir * L, y + L * 0.7, col, 3); }
          else { D.line(ctx, x, y - L, x + dir * 2, y, col, 3); D.line(ctx, x, y + L, x + dir * 2, y, col, 3); }
        }
        if (label && !narrow && p.labels) D.text(ctx, label, x + (horiz ? L + 4 : 0), y + (horiz ? 0 : L + 9), { color: c.muted, size: fs - 2, align: horiz ? 'left' : 'center', bg: D.alpha(c.bg, 0.8), pad: 2 });
      };
      if (fish) {
        valve(X(0.5), Y(0.55), false, !vSys);
        valve(X(0.65) + 6, Y(0.55), false, vSys);
      } else {
        valve(X(0.38), Y(0.515), true, !vSys, frog ? '' : 'tricuspid');
        valve(X(0.62), Y(0.515), true, !vSys, frog ? '' : 'bicuspid');
        valve(X(frog ? 0.35 : 0.305), Y(0.63), false, vSys, 'pulmonary valve');
        valve(X(frog ? 0.65 : 0.695), Y(0.63), false, vSys, 'aortic valve');
      }

      // blood cells
      var r = narrow ? 3 : 3.8;
      st.dots.forEach(function (s) { var q = pointAt(g, s); D.circle(ctx, q.x, q.y, r, dotColor(p.animal, g.at, s), D.alpha(c.bg, 0.6), 1); });

      // vessel names (rotated along the vertical vessels)
      if (p.labels) {
        var vlab = function (t, x, y, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2); D.text(ctx, t, 0, 0, { color: col, size: fs - 1, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.85), pad: 2 }); ctx.restore(); };
        if (fish) {
          vlab('to the gills', X(0.8) + 13, Y(0.34), BLUE);
          vlab('to the body', X(0.14) - 13, Y(0.5), RED);
          tag('back from the body', X(0.6), Y(0.76) - 13, BLUE, 'center', fs - 1);
        } else {
          vlab('pulmonary artery', X(0.14) - 13, Y(0.38), frog ? MIX : BLUE);
          vlab('vena cava', X(0.22) + 13, Y(0.76), BLUE);
          vlab('pulmonary vein', X(0.8) + 13, Y(0.26), RED);
          vlab('aorta', X(0.86) + 13, Y(0.76), frog ? MIX : RED);
        }
      }
      // cycle indicator
      var lub = ph >= 0.12 && ph < 0.2, dub = ph >= 0.49 && ph < 0.56;
      if (lub || dub) tag(lub ? 'LUB' : 'DUB', X(0.5), Y(fish ? 0.42 : 0.29), c.danger, 'center', fs + 3);
      if (!fish) D.text(ctx, 'Front view: the heart’s right side is on your left', X(0.5), H - 8, { color: c.faint || c.muted, size: fs - 2, align: 'center', fit: W });
    }
  });
})();
