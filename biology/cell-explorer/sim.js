/* =====================================================================
   The fundamental unit of life · Cell Explorer — sim.js
   ---------------------------------------------------------------------
   An activity (no Play button). A plant cell, an animal cell or a
   bacterium is drawn from simple shapes. Every part is a Path2D, so a
   tap is tested with isPointInPath / isPointInStroke, topmost first.
   Tap a part (or pick it from the list) to read what it does and which
   cells have it. Picking a part a cell does not have explains why.
   Quiz mode names a part; tap it in the picture.
   Typical sizes used for the scale bar: plant cell about 60 µm long,
   animal (cheek) cell about 25 µm, bacterium (E. coli) about 2 µm.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  // id: [name, short label, what it does, which cells have it]
  var INFO = {
    wall: ['Cell wall', 'Cell wall', 'A stiff outer layer, made mainly of cellulose in plants. It gives the cell its shape and support and stops it bursting when water flows in. Water and dissolved substances pass through it freely.', 'plant, fungus and bacterial cells; not animal cells'],
    membrane: ['Cell membrane', 'Cell membrane', 'The thin, flexible boundary of the cell, also called the plasma membrane. It is selectively permeable: it lets some substances in and out and keeps others back.', 'every cell'],
    cytoplasm: ['Cytoplasm', 'Cytoplasm', 'The jelly-like fluid that fills the cell inside the membrane. The organelles sit in it and many of the cell’s chemical reactions happen here.', 'every cell'],
    nucleus: ['Nucleus', 'Nucleus', 'The control centre. It holds the chromosomes, made of DNA, which carry the instructions for building and running the cell and for passing on features. A double nuclear membrane with pores surrounds it.', 'plant and animal cells (eukaryotes)'],
    nucleolus: ['Nucleolus', 'Nucleolus', 'A dense spot inside the nucleus where the parts of ribosomes are made.', 'plant and animal cells'],
    mito: ['Mitochondria', 'Mitochondria', 'The powerhouses of the cell. They release energy from food (glucose) by respiration and store it as ATP. The inner membrane is folded into cristae. They have their own DNA and ribosomes.', 'plant and animal cells'],
    chloro: ['Chloroplasts', 'Chloroplasts', 'Green plastids full of chlorophyll. They trap sunlight and make food (glucose) by photosynthesis. Like mitochondria, they have their own DNA and ribosomes.', 'green plant cells only'],
    bigvac: ['Large central vacuole', 'Vacuole', 'A big sac of cell sap (water, sugars, salts and wastes) that can fill most of a plant cell. It presses outwards on the wall and keeps the cell firm (turgid).', 'plant cells (one large vacuole)'],
    vacuole: ['Small vacuoles', 'Vacuoles', 'Small sacs that store water, food or waste. Animal cells have a few small ones, or none.', 'animal cells (small); plant cells have one large one'],
    er: ['Endoplasmic reticulum (ER)', 'ER', 'A network of membrane tubes joined to the nucleus. Rough ER is dotted with ribosomes and makes proteins; smooth ER makes fats (lipids). It also carries materials around the cell.', 'plant and animal cells'],
    ribo: ['Ribosomes', 'Ribosomes', 'Tiny grains where proteins are made. Some float free in the cytoplasm, others sit on the rough ER.', 'every cell, including bacteria'],
    golgi: ['Golgi apparatus', 'Golgi', 'A stack of flat membrane sacs. It packs the materials made in the ER into small bags (vesicles) and sends them where they are needed. It also makes lysosomes.', 'plant and animal cells'],
    lyso: ['Lysosomes', 'Lysosomes', 'Small membrane bags of digestive enzymes. They break down worn-out cell parts and germs. If the cell is badly damaged they burst and digest it, so they are called “suicide bags”.', 'mainly animal cells'],
    nucleoid: ['Nucleoid', 'Nucleoid', 'The region where a bacterium’s DNA lies: one long loop with no nuclear membrane around it. Having no true nucleus makes a bacterium a prokaryote.', 'bacteria (prokaryotes) only'],
    plasmid: ['Plasmids', 'Plasmids', 'Small extra rings of DNA. They can carry useful genes, such as resistance to an antibiotic, and can pass from one bacterium to another.', 'bacteria'],
    flagellum: ['Flagellum', 'Flagellum', 'A whip-like tail that spins like a propeller and pushes the bacterium through water.', 'some bacteria (sperm cells have a different kind)']
  };
  var ORDER = ['wall', 'membrane', 'cytoplasm', 'nucleus', 'nucleolus', 'mito', 'chloro', 'bigvac', 'vacuole', 'er', 'ribo', 'golgi', 'lyso', 'nucleoid', 'plasmid', 'flagellum'];
  var CELLS = {
    plant: { name: 'Plant cell', size: 'about 60 µm long', um: 60, bar: 10,
      has: ['wall', 'membrane', 'cytoplasm', 'nucleus', 'nucleolus', 'bigvac', 'chloro', 'mito', 'er', 'ribo', 'golgi'],
      left: ['wall', 'nucleus', 'nucleolus', 'er', 'golgi', 'cytoplasm'], why: {
        lyso: 'Plant cells have few or no lysosomes; the large vacuole does much of this digesting.',
        vacuole: 'A plant cell has one large central vacuole instead. Tap the big pale-blue sac.',
        nucleoid: 'A plant cell has a true nucleus with a membrane round its DNA, not a nucleoid.',
        plasmid: 'Plasmids are found in bacteria, not in plant cells.',
        flagellum: 'Plant cells have no flagellum.' } },
    animal: { name: 'Animal cell', size: 'about 25 µm across', um: 25, bar: 5,
      has: ['membrane', 'cytoplasm', 'nucleus', 'nucleolus', 'vacuole', 'lyso', 'mito', 'er', 'ribo', 'golgi'],
      left: ['membrane', 'nucleus', 'er', 'mito', 'cytoplasm'], why: {
        wall: 'Animal cells have no cell wall, only a flexible membrane, so they can take many shapes (and can burst in pure water).',
        chloro: 'Animal cells have no chloroplasts, so animals cannot make their own food; they eat it.',
        bigvac: 'Animal cells have only small vacuoles, or none. Tap one of the small pale-blue sacs.',
        nucleoid: 'An animal cell has a true nucleus with a membrane round its DNA, not a nucleoid.',
        plasmid: 'Plasmids are found in bacteria, not in animal cells.',
        flagellum: 'This cell has none, though a sperm cell swims with a tail (a flagellum of a different kind).' } },
    bacterium: { name: 'Bacterium', size: 'about 2 µm long', um: 2, bar: 0.5,
      has: ['wall', 'membrane', 'cytoplasm', 'nucleoid', 'plasmid', 'ribo', 'flagellum'],
      left: ['flagellum', 'wall', 'membrane'], why: {
        nucleus: 'No nucleus: a bacterium’s DNA lies loose in the cytoplasm, in the nucleoid.',
        nucleolus: 'No nucleus, so no nucleolus either.',
        mito: 'No mitochondria: a bacterium releases energy using enzymes on its cell membrane.',
        chloro: 'No chloroplasts. Some bacteria (cyanobacteria) photosynthesise using folded membranes instead.',
        er: 'No ER: bacteria have no organelles wrapped in membranes.',
        golgi: 'No Golgi apparatus: bacteria have no organelles wrapped in membranes.',
        lyso: 'No lysosomes: bacteria have no organelles wrapped in membranes.',
        bigvac: 'Bacteria have no large vacuole.', vacuole: 'Bacteria have no vacuoles.' } }
  };
  var quiz = { on: false, target: null, score: 0, tries: 0, msg: '', ok: false };
  var parts = [], hitCtx = null;

  function pickTarget(sim) {
    var has = CELLS[sim.p.cell].has, t;
    do { t = has[Math.floor(Math.random() * has.length)]; } while (t === quiz.target && has.length > 1);
    quiz.target = t;
  }
  function wrap(ctx, str, maxW) {
    var words = str.split(' '), lines = [], line = '';
    words.forEach(function (w) {
      var t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }
  function capsule(cx, cy, hl, hw) { // rod shape, half-length hl (to the tip), half-width hw
    var p = new Path2D(), a = hl - hw;
    p.moveTo(cx - a, cy - hw); p.lineTo(cx + a, cy - hw);
    p.arc(cx + a, cy, hw, -Math.PI / 2, Math.PI / 2); p.lineTo(cx - a, cy + hw);
    p.arc(cx - a, cy, hw, Math.PI / 2, Math.PI * 1.5); p.closePath();
    return p;
  }
  function rrect(x, y, w, h, r) {
    var p = new Path2D();
    p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r);
    p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath();
    return p;
  }
  function ell(x, y, rx, ry, rot) { var p = new Path2D(); p.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); return p; }

  // Build the parts of one cell. Each: {id, path, mode, lw, fill, stroke, anchor, extra(ctx)}
  function build(type, cx, cy, rx, ry, c) {
    var L = [], R = Math.min(rx, ry), rnd = M.rng(type === 'plant' ? 7 : type === 'animal' ? 11 : 5);
    function add(o) { L.push(o); return o; }
    var memb, inside;
    if (type === 'plant') {
      var t = Math.max(5, R * 0.07);
      var outer = rrect(cx - rx, cy - ry, rx * 2, ry * 2, R * 0.12);
      var ix = rx - t - 2, iy = ry - t - 2;
      memb = rrect(cx - ix, cy - iy, ix * 2, iy * 2, R * 0.08);
      var ring = rrect(cx - rx, cy - ry, rx * 2, ry * 2, R * 0.12); ring.addPath(rrect(cx - rx + t, cy - ry + t, (rx - t) * 2, (ry - t) * 2, R * 0.07));
      add({ id: 'cytoplasm', path: memb, mode: 'fill', fill: c.light ? '#e9f5d8' : '#1f3a2a', anchor: [cx - ix * 0.55, cy + iy * 0.25] });
      add({ id: 'wall', path: ring, mode: 'evenodd', fill: '#65a30d', anchor: [cx - rx + t / 2, cy - ry * 0.75] });
      var vx = cx + ix * 0.12, vy = cy + iy * 0.06, vw = ix * 0.6, vh = iy * 0.56;
      add({ id: 'bigvac', path: rrect(vx - vw, vy - vh, vw * 2, vh * 2, vh * 0.45), mode: 'fill', fill: D.alpha('#7dd3fc', c.light ? 0.45 : 0.28), stroke: '#38bdf8', lw: 1.5, anchor: [vx + vw * 0.5, vy - vh * 0.3] });
      var nx = cx - ix * 0.76, ny = cy - iy * 0.5, nr = Math.min(iy * 0.27, ix * 0.2);
      inside = { nx: nx, ny: ny, nr: nr };
      // ER: wavy tubes below the nucleus, rough ER dotted with ribosomes
      var er = new Path2D(), erDots = [];
      for (var k = 0; k < 3; k++) {
        var ex = cx - ix * (0.9 - k * 0.11);
        for (var j = 0; j <= 20; j++) {
          var yy = ny + nr + 6 + j / 20 * iy * 0.62, xx = ex + Math.sin(j * 0.9 + k) * ix * 0.025;
          if (j === 0) er.moveTo(xx, yy); else er.lineTo(xx, yy);
          if (j % 3 === 1) erDots.push([xx + 3, yy]);
        }
      }
      add({ id: 'er', path: er, mode: 'stroke', lw: 2, stroke: '#c084fc', hitLw: 12, anchor: [cx - ix * 0.79, ny + nr + iy * 0.3], dots: erDots });
      add({ id: 'nucleus', path: ell(nx, ny, nr, nr), mode: 'fill', fill: c.light ? '#c4b5fd' : '#6d28d9', stroke: c.light ? '#6d28d9' : '#c4b5fd', lw: 2, anchor: [nx - nr * 0.6, ny - nr * 0.2] });
      add({ id: 'nucleolus', path: ell(nx + nr * 0.2, ny + nr * 0.15, nr * 0.32, nr * 0.32), mode: 'fill', fill: c.light ? '#4c1d95' : '#ddd6fe', anchor: [nx + nr * 0.2, ny + nr * 0.15] });
      var gx = cx - ix * 0.72, gy = cy + iy * 0.8;
      var go = new Path2D();
      for (var g = 0; g < 4; g++) { go.moveTo(gx - ix * 0.13 + g * 2, gy - g * 5); go.quadraticCurveTo(gx, gy - g * 5 - 7, gx + ix * 0.13 - g * 2, gy - g * 5); }
      add({ id: 'golgi', path: go, mode: 'stroke', lw: 3, stroke: '#fbbf24', hitLw: 14, anchor: [gx - ix * 0.1, gy - 8] });
      var mitos = [[-0.22, -0.8, 0.15], [0.6, -0.8, -0.2], [0.32, 0.84, 0.1]];
      var chl = [[0.12, -0.8, 0.05], [0.89, -0.28, 1.5], [0.89, 0.26, 1.6], [0.86, 0.78, 0.5], [-0.12, 0.83, -0.1], [0.62, 0.84, 0.15], [-0.5, -0.83, 0.1]];
      organelles(add, cx, cy, ix, iy, R, mitos, chl, c);
      var rib = [];
      for (var q = 0; rib.length < 26 && q < 600; q++) {
        var u = (rnd() * 2 - 1) * 0.94, v = (rnd() * 2 - 1) * 0.92, px = cx + u * ix, py = cy + v * iy;
        if (Math.abs(px - vx) < vw + 6 && Math.abs(py - vy) < vh + 6) continue;
        if (Math.hypot(px - nx, py - ny) < nr + 6) continue;
        if (px < cx - ix * 0.6 && py > ny + nr) continue;
        if (Math.abs(v) > 0.68 && Math.abs(v) < 0.95 && rnd() < 0.6) continue;
        rib.push([px, py]);
      }
      addRibo(add, rib.concat(erDots), [cx + ix * 0.35, cy - iy * 0.68]);
      add({ id: 'membrane', path: memb, mode: 'stroke', lw: 1.6, stroke: c.light ? '#166534' : '#bbf7d0', hitLw: 9, anchor: [cx + ix, cy + iy * 0.05] });
    } else if (type === 'animal') {
      memb = new Path2D();
      for (var a = 0; a <= 72; a++) {
        var th = a / 72 * Math.PI * 2, rr = 1 + 0.05 * Math.sin(3 * th) + 0.03 * Math.cos(5 * th + 1);
        var mx = cx + Math.cos(th) * rx * rr, my = cy + Math.sin(th) * ry * rr;
        if (a === 0) memb.moveTo(mx, my); else memb.lineTo(mx, my);
      }
      memb.closePath();
      add({ id: 'cytoplasm', path: memb, mode: 'fill', fill: c.light ? '#fde7e2' : '#3b2230', anchor: [cx + rx * 0.2, cy + ry * 0.35] });
      var Nx = cx - R * 0.05, Ny = cy + R * 0.02, Nr = R * 0.3;
      var er2 = new Path2D(), dots2 = [];
      for (var k2 = 0; k2 < 3; k2++) {
        var rad = Nr + R * (0.08 + k2 * 0.075);
        for (var j2 = 0; j2 <= 24; j2++) {
          var an = Math.PI * (0.72 + j2 / 24 * 0.56), r2 = rad + Math.sin(j2 * 1.3 + k2) * R * 0.012;
          var x2 = Nx + Math.cos(an) * r2, y2 = Ny + Math.sin(an) * r2;
          if (j2 === 0) er2.moveTo(x2, y2); else er2.lineTo(x2, y2);
          if (j2 % 3 === 1 && k2 > 0) dots2.push([x2 + Math.cos(an) * 3, y2 + Math.sin(an) * 3]);
        }
      }
      add({ id: 'er', path: er2, mode: 'stroke', lw: 2, stroke: '#c084fc', hitLw: 12, anchor: [Nx - Nr - R * 0.2, Ny - R * 0.05], dots: dots2 });
      add({ id: 'nucleus', path: ell(Nx, Ny, Nr, Nr * 0.95), mode: 'fill', fill: c.light ? '#c4b5fd' : '#6d28d9', stroke: c.light ? '#6d28d9' : '#c4b5fd', lw: 2, anchor: [Nx - Nr * 0.5, Ny + Nr * 0.5] });
      add({ id: 'nucleolus', path: ell(Nx + Nr * 0.25, Ny - Nr * 0.15, Nr * 0.3, Nr * 0.3), mode: 'fill', fill: c.light ? '#4c1d95' : '#ddd6fe', anchor: [Nx + Nr * 0.35, Ny - Nr * 0.2] });
      var Gx = cx + R * 0.5, Gy = cy - R * 0.3, go2 = new Path2D();
      for (var g2 = 0; g2 < 4; g2++) { go2.moveTo(Gx - R * 0.14 + g2 * 2, Gy - g2 * 5); go2.quadraticCurveTo(Gx, Gy - g2 * 5 - 7, Gx + R * 0.14 - g2 * 2, Gy - g2 * 5); }
      add({ id: 'golgi', path: go2, mode: 'stroke', lw: 3, stroke: '#fbbf24', hitLw: 14, anchor: [Gx + R * 0.1, Gy - 8] });
      var vac = new Path2D(); vac.addPath(ell(cx + R * 0.44, cy + R * 0.12, R * 0.08, R * 0.07)); vac.addPath(ell(cx - R * 0.2, cy - R * 0.6, R * 0.07, R * 0.06));
      add({ id: 'vacuole', path: vac, mode: 'fill', fill: D.alpha('#7dd3fc', c.light ? 0.6 : 0.4), stroke: '#38bdf8', lw: 1.2, anchor: [cx + R * 0.44, cy + R * 0.12] });
      var mit2 = [[0.52, 0.4, -0.5], [-0.3, 0.66, 0.3], [0.13, -0.66, 0.15], [-0.48, -0.56, 0.9]].map(function (m) { return [m[0] * R / rx, m[1] * R / ry, m[2]]; });
      organelles(add, cx, cy, rx, ry, R, mit2, [], c);
      var ly = new Path2D(), lys = [[0.64, -0.05, 0.065], [0.3, 0.64, 0.055], [-0.68, 0.25, 0.055]];
      lys.forEach(function (l) { ly.addPath(ell(cx + l[0] * R, cy + l[1] * R, l[2] * R, l[2] * R)); });
      add({ id: 'lyso', path: ly, mode: 'fill', fill: '#f97316', stroke: '#9a3412', lw: 1, anchor: [cx + 0.64 * R, cy - 0.05 * R], spots: lys.map(function (l) { return [cx + l[0] * R, cy + l[1] * R, l[2] * R]; }) });
      var rib2 = [];
      for (var q2 = 0; rib2.length < 24 && q2 < 600; q2++) {
        var ang = rnd() * Math.PI * 2, d = 0.4 + rnd() * 0.5, px2 = cx + Math.cos(ang) * d * R, py2 = cy + Math.sin(ang) * d * R;
        if (Math.hypot(px2 - Nx, py2 - Ny) < Nr + R * 0.3) continue;
        rib2.push([px2, py2]);
      }
      addRibo(add, rib2.concat(dots2), [cx + R * 0.2, cy + R * 0.45]);
      add({ id: 'membrane', path: memb, mode: 'stroke', lw: 2, stroke: c.light ? '#9f1239' : '#fecdd3', hitLw: 10, anchor: [cx - rx * 0.97, cy - ry * 0.3] });
    } else { // bacterium: rod with a flagellum on the left
      var tb = Math.max(4, ry * 0.12), outerB = capsule(cx, cy, rx, ry);
      var membB = capsule(cx, cy, rx - tb - 2, ry - tb - 2);
      var ringB = capsule(cx, cy, rx, ry); ringB.addPath(capsule(cx, cy, rx - tb, ry - tb));
      var fl = new Path2D(); fl.moveTo(cx - rx, cy);
      for (var f = 1; f <= 40; f++) fl.lineTo(cx - rx - f / 40 * rx * 0.55, cy + Math.sin(f / 40 * Math.PI * 3) * ry * 0.22);
      add({ id: 'flagellum', path: fl, mode: 'stroke', lw: 2.5, stroke: c.ink, hitLw: 14, anchor: [cx - rx - rx * 0.35, cy + Math.sin(0.35 / 0.55 * Math.PI * 3) * ry * 0.22] });
      add({ id: 'cytoplasm', path: membB, mode: 'fill', fill: c.light ? '#fef3c7' : '#3a3016', anchor: [cx + rx * 0.3, cy + ry * 0.5] });
      add({ id: 'wall', path: ringB, mode: 'evenodd', fill: '#a16207', anchor: [cx - rx * 0.5, cy - ry + tb / 2] });
      var nd = new Path2D();
      for (var b = 0; b <= 120; b++) {
        var tt = b / 120 * Math.PI * 2, r3 = 1 + 0.22 * Math.sin(7 * tt) + 0.14 * Math.sin(11 * tt + 1);
        var x3 = cx - rx * 0.05 + Math.cos(tt) * rx * 0.3 * r3, y3 = cy + Math.sin(tt) * ry * 0.42 * r3;
        if (b === 0) nd.moveTo(x3, y3); else nd.lineTo(x3, y3);
      }
      add({ id: 'nucleoid', path: nd, mode: 'fill', fill: D.alpha('#a78bfa', c.light ? 0.35 : 0.25), stroke: '#7c3aed', lw: 1.5, anchor: [cx + rx * 0.2, cy - ry * 0.25] });
      var pl = new Path2D(), pr = ry * 0.12;
      [[0.58, -0.35], [0.62, 0.38], [-0.62, 0.3]].forEach(function (q3) { pl.moveTo(cx + q3[0] * rx + pr, cy + q3[1] * ry); pl.arc(cx + q3[0] * rx, cy + q3[1] * ry, pr, 0, Math.PI * 2); });
      add({ id: 'plasmid', path: pl, mode: 'stroke', lw: 2, stroke: '#7c3aed', hitLw: 14, anchor: [cx + 0.58 * rx, cy - 0.35 * ry - pr] });
      var rib3 = [];
      for (var q4 = 0; rib3.length < 30 && q4 < 800; q4++) {
        var u4 = (rnd() * 2 - 1) * 0.8, v4 = (rnd() * 2 - 1) * 0.62, px4 = cx + u4 * rx, py4 = cy + v4 * ry;
        if (Math.abs(u4 + 0.05) < 0.4 && Math.abs(v4) < 0.6) continue;
        rib3.push([px4, py4]);
      }
      addRibo(add, rib3, [cx + rx * 0.45, cy + ry * 0.05]);
      add({ id: 'membrane', path: membB, mode: 'stroke', lw: 1.6, stroke: c.light ? '#78350f' : '#fde68a', hitLw: 9, anchor: [cx + rx * 0.1, cy + ry - tb - 2] });
    }
    return L;
  }
  function organelles(add, cx, cy, ix, iy, R, mitos, chl, c) {
    var mp = new Path2D(), ml = R * 0.15, mw = R * 0.065, ms = [];
    mitos.forEach(function (m) {
      var x = cx + m[0] * ix, y = cy + m[1] * iy, p = new Path2D(), co = Math.cos(m[2]), si = Math.sin(m[2]);
      p.ellipse(x, y, ml, mw, m[2], 0, Math.PI * 2); mp.addPath(p); ms.push([x, y, co, si]);
    });
    add({ id: 'mito', path: mp, mode: 'fill', fill: '#fb7185', stroke: '#9f1239', lw: 1.2, anchor: [ms[0][0], ms[0][1]],
      extra: function (ctx) { // cristae
        ms.forEach(function (m) {
          ctx.beginPath();
          for (var k = 0; k <= 8; k++) { var t = -0.8 + k * 0.2, px = m[0] + m[2] * ml * t, py = m[1] + m[3] * ml * t, s = (k % 2 ? 1 : -1) * mw * 0.6; ctx.lineTo(px - m[3] * s, py + m[2] * s); }
          ctx.strokeStyle = '#9f1239'; ctx.lineWidth = 1; ctx.stroke();
        });
      } });
    if (!chl.length) return;
    var cp = new Path2D(), cs = [], cl = R * 0.13, cw = R * 0.065;
    chl.forEach(function (q) { var x = cx + q[0] * ix, y = cy + q[1] * iy; cp.addPath(ell(x, y, cl, cw, q[2])); cs.push([x, y, Math.cos(q[2]), Math.sin(q[2])]); });
    add({ id: 'chloro', path: cp, mode: 'fill', fill: '#16a34a', stroke: '#14532d', lw: 1.2, anchor: [cs[1][0], cs[1][1]],
      extra: function (ctx) { // grana stacks
        cs.forEach(function (m) { for (var k = -1; k <= 1; k++) { var px = m[0] + m[2] * cl * k * 0.5, py = m[1] + m[3] * cl * k * 0.5; ctx.beginPath(); ctx.ellipse(px, py, cw * 0.35, cw * 0.5, Math.atan2(m[3], m[2]), 0, Math.PI * 2); ctx.fillStyle = '#14532d'; ctx.fill(); } });
      } });
  }
  function addRibo(add, pts, anchor) {
    var p = new Path2D(), hit = new Path2D();
    pts.forEach(function (q) { p.moveTo(q[0] + 1.8, q[1]); p.arc(q[0], q[1], 1.8, 0, Math.PI * 2); hit.moveTo(q[0] + 6, q[1]); hit.arc(q[0], q[1], 6, 0, Math.PI * 2); });
    add({ id: 'ribo', path: p, hitPath: hit, mode: 'fill', fill: '#64748b', anchor: anchor });
  }

  function hitTest(x, y) {
    if (!hitCtx) return null;
    hitCtx.save(); hitCtx.setTransform(1, 0, 0, 1, 0, 0);
    var found = null;
    for (var i = parts.length - 1; i >= 0 && !found; i--) {
      var o = parts[i];
      if (o.mode === 'stroke') { hitCtx.lineWidth = o.hitLw || 10; if (hitCtx.isPointInStroke(o.path, x, y)) found = o.id; }
      else if (o.mode === 'evenodd') { if (hitCtx.isPointInPath(o.path, x, y, 'evenodd')) found = o.id; }
      else if (hitCtx.isPointInPath(o.hitPath || o.path, x, y)) found = o.id;
    }
    hitCtx.restore();
    return found;
  }
  function info(sim) {
    var p = sim.p, cell = CELLS[p.cell], id = p.part;
    if (!id || id === 'none' || !INFO[id]) return null;
    var i = INFO[id], here = cell.has.indexOf(id) >= 0;
    return { id: id, name: i[0], job: here ? i[2] : (cell.why[id] || ('Not found in this cell. Found in: ' + i[3] + '.')), where: i[3], here: here };
  }

  SimLab.createSim({
    ariaLabel: 'A labelled drawing of a plant cell, an animal cell or a bacterium; tap a part to learn what it does',
    transport: false,
    mobileAspect: '1 / 1',
    params: [
      { id: 'cell', label: 'Cell', type: 'select', value: 'plant', options: [
        { value: 'plant', label: 'Plant cell (leaf)' }, { value: 'animal', label: 'Animal cell (cheek)' }, { value: 'bacterium', label: 'Bacterium (prokaryote)' }] },
      { id: 'part', label: 'Look at a part', type: 'select', value: 'none', options: [{ value: 'none', label: '— tap the picture or choose —' }].concat(ORDER.map(function (k) { return { value: k, label: INFO[k][0] }; })) },
      { id: 'labels', label: 'Show labels', type: 'toggle', value: true }
    ],
    buttonsTitle: 'Quiz',
    buttons: [
      { label: '🎯 Quiz me: find the part', primary: true, onClick: function (sim) { quiz.on = true; quiz.score = 0; quiz.tries = 0; quiz.msg = ''; quiz.target = null; pickTarget(sim); sim.setParam('part', 'none'); } },
      { label: 'Stop quiz', onClick: function () { quiz.on = false; quiz.msg = ''; } }
    ],
    readouts: [
      { id: 'part', label: 'Selected part', short: 'Part', key: true },
      { id: 'where', label: 'Found in', key: true },
      { id: 'job', label: 'What it does' },
      { id: 'size', label: 'Real size of this cell' },
      { id: 'quiz', label: 'Quiz score' }
    ],
    reset: function (sim) { sim.state = {}; },
    onParam: function (sim, id) { if (id === 'cell' && quiz.on) { quiz.msg = ''; pickTarget(sim); } return true; },
    status: function (sim) { return quiz.on ? 'Quiz: tap the ' + INFO[quiz.target][0].toLowerCase() : 'Tap any part of the cell'; },
    readout: function (sim) {
      var i = info(sim);
      return { part: i ? i.name : 'none', where: i ? (i.here ? i.where : 'not in a ' + CELLS[sim.p.cell].name.toLowerCase()) : '—', job: i ? i.job : 'Tap a part of the cell.', size: CELLS[sim.p.cell].size,
        quiz: quiz.on || quiz.tries ? quiz.score + ' right out of ' + quiz.tries : 'not started' };
    },
    pointer: {
      down: function (sim, x, y) {
        var id = hitTest(x, y);
        if (quiz.on && id) {
          quiz.tries++;
          if (id === quiz.target) { quiz.score++; quiz.ok = true; quiz.msg = '✓ Yes, that is the ' + INFO[id][0].toLowerCase() + '!'; pickTarget(sim); }
          else { quiz.ok = false; quiz.msg = '✗ That is the ' + INFO[id][0].toLowerCase() + '. Try again.'; }
        }
        sim.setParam('part', id || 'none');
        return false;
      },
      hover: function (sim, x, y) { return !!hitTest(x, y); }
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, cell = CELLS[p.cell];
      hitCtx = ctx;
      var nar = W < 600, fs = nar ? 10 : 12;
      D.clear(ctx, W, H, c.bg);
      var sel = info(sim);
      // layout: info panel on the right (wide) or at the bottom (narrow)
      var top = nar ? 26 : 34, bot = nar ? 62 : 30, ax = 0, aw = nar ? W : W * 0.64, ah = H - top - bot;
      var lab = p.labels ? (nar ? 80 : 104) : 12;
      var room = aw - lab * 2, cx = ax + aw / 2, cy = top + ah / 2, rx, ry;
      if (p.cell === 'plant') { ry = Math.min(ah * 0.45, room / 2 / 1.4); rx = ry * 1.4; }
      else if (p.cell === 'animal') { var Rr = Math.min(ah * 0.45, room / 2 / 1.1); rx = Rr * 1.1; ry = Rr; }
      else { rx = Math.min(room / 2 / 1.28, ah * 1.0); ry = Math.min(rx * 0.4, ah * 0.4); cx += rx * 0.275; }
      D.text(ctx, cell.name + ' · ' + cell.size, 10, nar ? 13 : 17, { color: c.ink, size: nar ? 12 : 15, weight: 700, fit: aw });
      parts = build(p.cell, cx, cy, rx, ry, c);
      parts.forEach(function (o) {
        var on = sel && sel.here && sel.id === o.id;
        ctx.save();
        if (o.mode === 'stroke') {
          ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw; ctx.lineCap = 'round'; ctx.stroke(o.path);
        } else {
          ctx.fillStyle = o.fill; ctx.fill(o.path, o.mode === 'evenodd' ? 'evenodd' : 'nonzero');
          if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 1; ctx.stroke(o.path); }
        }
        if (o.extra) o.extra(ctx);
        if (on) {
          ctx.shadowColor = c.accent; ctx.shadowBlur = 12; ctx.strokeStyle = c.accent; ctx.lineWidth = o.mode === 'stroke' ? o.lw + 3 : 3;
          if (o.id === 'ribo') { ctx.fillStyle = c.accent; ctx.fill(o.path); }
          else if (o.id === 'cytoplasm') { ctx.globalAlpha = 0.25; ctx.fillStyle = c.accent; ctx.fill(o.path); }
          else ctx.stroke(o.path);
        }
        ctx.restore();
      });
      // labels in two columns beside the cell
      if (p.labels) {
        var xl = cx - (p.cell === 'bacterium' ? rx * 1.55 : rx) - 8, xr = cx + rx + 8, gap = nar ? 14 : 18;
        [true, false].forEach(function (isLeft) {
          var list = parts.filter(function (o) { return (cell.left.indexOf(o.id) >= 0) === isLeft; })
            .map(function (o) { return { o: o, y: o.anchor[1] }; }).sort(function (a, b) { return a.y - b.y; });
          for (var i = 1; i < list.length; i++) list[i].y = Math.max(list[i].y, list[i - 1].y + gap);
          var over = list.length ? list[list.length - 1].y - (top + ah - 6) : 0;
          if (over > 0) list.forEach(function (l) { l.y -= over; });
          for (var j = 0; j < list.length; j++) list[j].y = Math.max(list[j].y, top + 6 + j * gap);
          list.forEach(function (l) {
            var hi = sel && sel.here && sel.id === l.o.id, lx = isLeft ? Math.max(4, xl) : Math.min(aw - 4, xr);
            ctx.font = (hi ? 700 : 500) + ' ' + fs + 'px Inter, system-ui, sans-serif';
            var tw = ctx.measureText(INFO[l.o.id][1]).width;
            D.line(ctx, lx + (isLeft ? 3 : -3), l.y, l.o.anchor[0], l.o.anchor[1], D.alpha(hi ? c.accent : c.muted, 0.8), 1);
            D.circle(ctx, l.o.anchor[0], l.o.anchor[1], 2.2, hi ? c.accent : c.ink);
            D.text(ctx, INFO[l.o.id][1], isLeft ? Math.max(3, lx - tw - 2) : Math.min(aw - tw - 3, lx + 4), l.y, { color: hi ? c.accent : c.ink, size: fs, weight: hi ? 700 : 500, bg: D.alpha(c.bg, 0.8), pad: 2 });
          });
        });
      }
      // scale bar
      var pxPerUm = 2 * rx / cell.um, bl = cell.bar * pxPerUm, bx = 12, by = nar ? top + ah - 6 : top + ah + 14;
      {
        D.line(ctx, bx, by, bx + bl, by, c.ink, 2.5);
        D.line(ctx, bx, by - 4, bx, by + 4, c.ink, 1.5); D.line(ctx, bx + bl, by - 4, bx + bl, by + 4, c.ink, 1.5);
        D.text(ctx, cell.bar + ' µm', bx + bl + 6, by, { color: c.muted, size: nar ? 10 : 11 });
      }
      // quiz banner
      if (quiz.on) {
        D.text(ctx, 'Find: ' + INFO[quiz.target][0] + '   ★ ' + quiz.score, aw - 8, nar ? 13 : 17, { color: '#fff', size: nar ? 11 : 13, weight: 700, align: 'right', bg: c.accent, pad: 4, fit: aw });
        if (quiz.msg) D.text(ctx, quiz.msg, aw / 2, top + 8, { color: quiz.ok ? c.success : c.warning, size: nar ? 10.5 : 12, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.9), fit: aw });
      }
      // information panel
      var px, py, pw, title, body, foot;
      if (sel) { title = sel.name; body = sel.job; foot = 'Found in: ' + sel.where; }
      else { title = 'Tap any part of the cell'; body = 'Each part (organelle) has a job. Choose a cell type above, tap a part, or press “Quiz me”.'; foot = ''; }
      if (!nar) {
        px = W * 0.64 + 8; pw = W - px - 12; py = top;
        D.roundRect(ctx, px - 6, py - 6, pw + 12, H - py - 10, 10, D.alpha(c.surface2 || c.bg, 0.6), D.alpha(c.ink, 0.15));
        ctx.font = '700 16px Inter, system-ui, sans-serif';
        var tl = wrap(ctx, title, pw - 8), y = py + 14;
        tl.forEach(function (t) { D.text(ctx, t, px + 4, y, { color: sel && !sel.here ? c.warning : c.ink, size: 16, weight: 700 }); y += 20; });
        if (sel && !sel.here) { D.text(ctx, '✗ not in a ' + cell.name.toLowerCase(), px + 4, y, { color: c.warning, size: 12.5, weight: 600 }); y += 20; }
        y += 4;
        ctx.font = '500 13px Inter, system-ui, sans-serif';
        wrap(ctx, body, pw - 8).forEach(function (t) { D.text(ctx, t, px + 4, y, { color: c.ink, size: 13 }); y += 18; });
        if (foot) { y += 8; ctx.font = '600 12px Inter, system-ui, sans-serif'; wrap(ctx, foot, pw - 8).forEach(function (t) { D.text(ctx, t, px + 4, y, { color: c.muted, size: 12, weight: 600 }); y += 16; }); }
      } else {
        py = H - bot + 14; pw = W - 16;
        D.roundRect(ctx, 4, py - 9, W - 8, bot - 7, 8, D.alpha(c.surface2 || c.bg, 0.7), D.alpha(c.ink, 0.15));
        D.text(ctx, title + (sel && !sel.here ? ' ✗ not here' : ''), 10, py + 2, { color: sel && !sel.here ? c.warning : c.ink, size: 12, weight: 700, fit: W });
        ctx.font = '500 10.5px Inter, system-ui, sans-serif';
        var first = body.split('. ')[0].replace(/\.$/, '') + '.';
        wrap(ctx, first, pw - 4).slice(0, 2).forEach(function (t, i) { D.text(ctx, t, 10, py + 18 + i * 14, { color: c.muted, size: 10.5 }); });
      }
    }
  });
})();
