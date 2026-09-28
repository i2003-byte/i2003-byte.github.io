/* =====================================================================
   Light · Newton's Colour Disc — sim.js
   ---------------------------------------------------------------------
   Paint the colours of the rainbow on a disc and spin it fast: the eye
   holds each picture for about 1/16 s (persistence of vision), so the
   colours overlap and mix into a whitish grey. White light is a mixture
   of all these colours.
   Model:
     mixed colour = average of the sector colours weighted by their angle,
                    done in linear light (then shown in sRGB)
     blending     = 0 below 4 rev/s, full above 16 rev/s (smooth in between);
                    a colour flashes once per turn, so above ~16 flashes
                    per second the flashes merge.
   Sector sizes of the rainbow disc are unequal (like Newton's own) and
   chosen so the mixture comes out close to grey. Real paints are not
   pure, so a real disc looks off-white or light grey, never bright white.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var DISCS = {
    rainbow: { name: 'Rainbow (VIBGYOR)', s: [['Red', '#e8201c', 30], ['Orange', '#ff7f00', 30], ['Yellow', '#ffe600', 60], ['Green', '#14c24a', 100], ['Blue', '#1a66ff', 80], ['Indigo', '#3a2fd6', 30], ['Violet', '#7a36e6', 30]] },
    rg: { name: 'Red + green', s: [['Red', '#ff0000', 180], ['Green', '#00ff00', 180]] },
    rb: { name: 'Red + blue', s: [['Red', '#ff0000', 180], ['Blue', '#0000ff', 180]] },
    by: { name: 'Blue + yellow', s: [['Blue', '#0000ff', 180], ['Yellow', '#ffff00', 180]] },
    rgb: { name: 'Red + green + blue', s: [['Red', '#ff0000', 120], ['Green', '#00ff00', 120], ['Blue', '#0000ff', 120]] },
    bw: { name: 'Black + white', s: [['Black', '#000000', 180], ['White', '#ffffff', 180]] }
  };
  var angle = 0, lastNow = 0;

  function lin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function enc(v) { v = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(M.clamp(v, 0, 1) * 255); }
  function mixColour(disc) {
    var s = [0, 0, 0], t = 0;
    disc.s.forEach(function (q) { var h = q[1]; [1, 3, 5].forEach(function (i, j) { s[j] += lin(parseInt(h.substr(i, 2), 16)) * q[2]; }); t += q[2]; });
    var rgb = s.map(function (v) { return enc(v / t); });
    return '#' + rgb.map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  function revs(p) { return p.rpm / 60; }
  function blend(p) { var x = M.clamp((revs(p) - 4) / 12, 0, 1); return x * x * (3 - 2 * x); }

  SimLab.createSim({
    ariaLabel: "A spinning Newton's colour disc and the colour the eye sees when its colours blend",
    transport: false,
    mobileAspect: '3 / 4',
    params: [
      { id: 'disc', label: 'Disc', type: 'select', value: 'rainbow', options: Object.keys(DISCS).map(function (k) { return { value: k, label: DISCS[k].name }; }) },
      { id: 'rpm', label: 'Spin speed', min: 0, max: 1500, step: 30, value: 0, unit: 'rpm',
        presets: [{ label: 'Stop', value: 0 }, { label: 'Slow', value: 120 }, { label: 'Hand spin', value: 600 }, { label: 'Motor', value: 1500 }],
        help: 'rpm = turns per minute. A ceiling fan runs at about 300 rpm.' }
    ],
    readouts: [
      { id: 'f', label: 'Turns per second', unit: 'rev/s', digits: 1 },
      { id: 'T', label: 'Time for one turn', unit: 'ms', digits: 0 },
      { id: 'seen', label: 'Colours seen', key: true },
      { id: 'mix', label: 'Mixed colour' }
    ],
    onParam: function () { return true; },
    reset: function () {},
    animate: function (sim) { return sim.p.rpm > 0 && !sim.reduceMotion; },
    readout: function (sim) {
      var p = sim.p, b = blend(p);
      return { f: revs(p), T: p.rpm > 0 ? 60000 / p.rpm : '—', seen: b >= 0.99 ? 'Blended into one' : b > 0.02 ? 'Flickering, partly mixed' : 'Separate colours', mix: mixColour(DISCS[p.disc]) };
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, disc = DISCS[p.disc];
      var dt = Math.min(0.05, lastNow ? (now - lastNow) / 1000 : 0); lastNow = now;
      if (!sim.reduceMotion) angle = (angle + 2 * Math.PI * revs(p) * dt) % (2 * Math.PI);
      D.clear(ctx, W, H, c.bg);
      var wide = W >= 560, top = 30;
      var R = wide ? Math.min(W * 0.28, (H - top - 30) / 2) : Math.min(W * 0.34, (H - top) * 0.26);
      var cx = wide ? W * 0.34 : W / 2, cy = wide ? top + (H - top) / 2 : top + 12 + R;
      var b = blend(p), mix = mixColour(disc);

      // stand and axle
      D.roundRect(ctx, cx - 6, cy, 12, Math.min(R + 16, H - cy - 6), 3, c.surface2, c.border, 1);
      // sectors
      var a0 = angle - Math.PI / 2;
      disc.s.forEach(function (q) {
        var a1 = a0 + M.rad(q[2]);
        ctx.fillStyle = q[1]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.fill();
        a0 = a1;
      });
      // motion smear then full blend: the eye's view
      if (b > 0) { ctx.save(); ctx.globalAlpha = b; D.circle(ctx, cx, cy, R, mix); ctx.restore(); }
      D.circle(ctx, cx, cy, R, null, c.ink, 3);
      D.circle(ctx, cx, cy, 6, '#94a3b8', c.ink, 1.5);
      if (p.rpm > 0 && b < 0.99) { // curved arrow showing the spin
        ctx.save(); ctx.strokeStyle = c.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R + 10, -2.4, -0.8); ctx.stroke(); ctx.restore();
        D.arrow(ctx, cx + Math.cos(-0.9) * (R + 10), cy + Math.sin(-0.9) * (R + 10), cx + Math.cos(-0.75) * (R + 10), cy + Math.sin(-0.75) * (R + 10), c.text, 2, 9);
      }

      // right (or lower) panel: legend and the mixed colour
      var px = wide ? W * 0.64 : 16, py = wide ? top + 18 : cy + R + 24, pw = wide ? W * 0.34 : W - 32;
      D.text(ctx, 'Colours on the disc', px, py, { color: c.text, size: 12, weight: 700 });
      var cols = wide ? 1 : 2, rowH = wide ? 20 : 18;
      disc.s.forEach(function (q, i) {
        var x = px + (i % cols) * pw / cols, y = py + 20 + Math.floor(i / cols) * rowH;
        D.roundRect(ctx, x, y - 7, 14, 14, 3, q[1], c.border, 1);
        D.text(ctx, q[0] + '  ' + Math.round(q[2] / 3.6) + '%', x + 22, y, { color: c.muted, size: 12 });
      });
      var sy = py + 20 + Math.ceil(disc.s.length / cols) * rowH + 8, sw = Math.min(pw, 200), shh = wide ? 44 : 34;
      D.text(ctx, 'Mixed colour (fully blended)', px, sy, { color: c.text, size: 12, weight: 700 });
      D.roundRect(ctx, px, sy + 12, sw, shh, 8, mix, c.border, 1);
      D.text(ctx, mix, px + sw + 8, sy + 12 + shh / 2, { color: c.muted, size: 11, font: c.mono, fit: W });

      // headline
      var msg = p.rpm === 0 ? 'Spin the disc: pick a speed or a preset' : b >= 0.99 ? 'Spinning fast: the eye mixes the colours' : b > 0.02 ? 'Getting faster: colours start to merge' : 'Too slow: you still see each colour';
      if (sim.reduceMotion && p.rpm > 0) msg += ' (motion paused)';
      D.text(ctx, msg, W / 2, 14, { color: b >= 0.99 ? c.success : c.warning, size: W < 560 ? 12 : 14, weight: 700, align: 'center', fit: W });
    }
  });
})();
