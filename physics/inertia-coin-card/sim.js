/* =====================================================================
   Force and laws of motion · Inertia: Coin on a Card — sim.js
   ---------------------------------------------------------------------
   Side view. A card rests on the rim of a glass with a coin (or a stack
   of coins) at its centre. The finger flicks the card so that it moves
   off sideways at speed v.
     • The only horizontal force on the coin is friction from the card.
       It can give the coin at most a = μg, whatever the coin's mass.
     • While the coin is slower than the card it slides: a = μg.
       If it catches up before the card's edge passes under it, it rides
       along with the card (slow pull).
     • A quick flick pulls the card out from under the coin in a few
       milliseconds. The coin hardly moves (inertia of rest) and drops
       into the glass.
   Card leaves the coin when the card has slid L/2 relative to the coin:
     v t − ½ μ g t² = L/2   →   only possible if v > √(μ g L)
   Everything runs in slow motion; the clock shows real time.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var G = 9.8;
  var L = 0.10, CARD_T = 0.003;          // card length and thickness (m)
  var GLASS_H = 0.12, R_IN = 0.032, R_OUT = 0.036, R_BOT = 0.027, BASE = 0.008;
  var OBJ = {
    coin: { name: '₹5 coin', mu: 0.3, w: 0.023, h: 0.0022, m: 6 },
    eraser: { name: 'Rubber eraser', mu: 0.7, w: 0.03, h: 0.009, m: 8 },
    ice: { name: 'Smooth plastic counter', mu: 0.12, w: 0.025, h: 0.003, m: 2 }
  };
  var VIEW_X0 = -0.13, VIEW_X1 = 0.27;

  function obj(p) { return OBJ[p.obj] || OBJ.coin; }
  function vMin(p) { return Math.sqrt(obj(p).mu * G * L); }

  var tMax = 120;   // graph x-range in ms, set in reset

  SimLab.createSim({
    ariaLabel: 'Side view of a glass with a card on its rim and a coin on the card; a finger flicks the card away and the coin either drops into the glass or is dragged along',
    mobileAspect: '4 / 3.3',
    playLabel: 'Flick',
    params: [
      { id: 'v', label: 'Speed of the flick', min: 0.1, max: 4, step: 0.05, value: 2, unit: 'm/s',
        presets: [{ label: 'Slow pull', value: 0.3 }, { label: 'Gentle', value: 0.65 }, { label: 'Quick flick', value: 2 }, { label: 'Very fast', value: 4 }],
        help: 'How fast the card shoots away after the finger hits it.' },
      { id: 'obj', label: 'Object on the card', type: 'select', value: 'coin',
        options: [{ value: 'coin', label: '₹5 coin (friction μ ≈ 0.3)' }, { value: 'eraser', label: 'Rubber eraser (grippy, μ ≈ 0.7)' }, { value: 'ice', label: 'Smooth plastic counter (μ ≈ 0.12)' }] },
      { id: 'n', label: 'How many stacked', min: 1, max: 5, step: 1, value: 1, unit: '' },
      { id: 'slow', label: 'Slow motion', type: 'select', value: '0.1',
        options: [{ value: '0.1', label: '10 times slower' }, { value: '0.03', label: '30 times slower' }, { value: '1', label: 'Real speed' }] }
    ],
    readouts: [
      { id: 'res', label: 'What happened', key: true },
      { id: 'amax', label: 'Most friction can give it: μg', unit: 'm/s²', digits: 1 },
      { id: 'vmin', label: 'Flick needed to leave it behind: √(μgL)', unit: 'm/s', digits: 2 },
      { id: 'tu', label: 'Time the card was under it', unit: 'ms', digits: 1 },
      { id: 'dx', label: 'How far it was dragged', unit: 'mm', digits: 1 },
      { id: 't', label: 'Real time since the flick', unit: 'ms', digits: 0 }
    ],
    graph: { title: 'Speed of the card and of the coin (real time)', xLabel: 'time (ms)', yLabel: 'm/s', xMax: function () { return tMax; },
      series: [{ label: 'card', color: '--sim-1' }, { label: 'object on top', color: '--sim-2' }] },
    onParam: function (sim, id) { return id === 'slow'; },

    reset: function (sim) {
      sim.state = {
        t: 0, started: false, lastPush: -1,
        card: { x: 0, y: GLASS_H, vx: 0, vy: 0, free: false, rest: false },
        coin: { x: 0, vx: 0, y: GLASS_H + CARD_T, vy: 0, on: 'card', where: '', rest: false },
        tUnder: null, slipX: 0, dragged: false, res: 'Ready: press Flick'
      };
      tMax = M.clamp(1000 * (L / 2 + R_OUT + 0.05) / Math.max(sim.p.v, 0.1), 60, 900);
      if (sim.graph) sim.graph.push(0, [0, 0]);
    },
    update: function (sim, dtSim) {
      var p = sim.p, st = sim.state, o = obj(p), card = st.card, coin = st.coin;
      var dt = dtSim * parseFloat(p.slow || '0.1');
      if (!st.started) { st.started = true; card.vx = p.v; }
      st.t += dt;

      // --- card ---
      if (!card.rest) {
        if (!card.free && card.x - L / 2 > R_OUT) card.free = true;   // no longer resting on the rim
        if (card.free) { card.vy -= G * dt; card.y += card.vy * dt; }
        card.x += card.vx * dt;
        if (card.y <= 0) { card.y = 0; card.vy = 0; card.vx = 0; card.rest = true; }
      }
      // --- coin ---
      if (coin.on === 'card') {
        if (coin.vx < card.vx) {                          // sliding: friction drags it forward
          coin.vx = Math.min(card.vx, coin.vx + o.mu * G * dt);
        } else { coin.vx = card.vx; if (card.vx > 0) st.dragged = true; }   // riding along with the card
        if (card.rest) coin.vx = 0;
        coin.x += coin.vx * dt;
        coin.y = card.y + CARD_T; coin.vy = card.vy;
        st.slipX = coin.x;
        if (Math.abs(coin.x - card.x) > L / 2 && !card.rest) {   // the card's edge has passed under it
          st.tUnder = st.t;
          coin.on = 'air';
          coin.where = Math.abs(coin.x) < R_IN ? 'glass' : 'outside';
          if (coin.where === 'outside' && coin.x < R_OUT + o.w / 2) coin.x = R_OUT + o.w / 2;
        }
        if (card.rest && !coin.rest) coin.rest = true;
      } else if (coin.on === 'air') {
        coin.vy -= G * dt; coin.y += coin.vy * dt; coin.x += coin.vx * dt;
        var floor = coin.where === 'glass' ? BASE : 0;
        if (coin.where === 'glass') {
          var lim = innerHalf(coin.y) - o.w / 2;
          if (Math.abs(coin.x) > lim) { coin.x = Math.sign(coin.x) * lim; coin.vx = 0; }
        }
        if (coin.y <= floor) { coin.y = floor; coin.vy = 0; coin.vx = 0; coin.on = 'rest'; coin.rest = true; }
      }
      // results
      if (coin.where === 'glass') st.res = 'Dropped into the glass';
      else if (coin.where === 'outside') st.res = 'Slid off and missed the glass';
      else if (st.dragged) st.res = 'Dragged along with the card';
      else st.res = 'Sliding on the card…';

      if (sim.graph && st.t - st.lastPush >= 0.0004) { st.lastPush = st.t; sim.graph.push(st.t * 1000, [Math.hypot(card.vx, card.vy) * (card.rest ? 0 : 1), Math.hypot(coin.vx, coin.vy)]); }
    },
    finished: function (sim) {
      var st = sim.state;
      var cardGone = st.card.rest || st.card.x - L / 2 > VIEW_X1 + 0.05;
      return st.coin.rest && cardGone || st.t > 3;
    },
    status: function (sim) {
      var st = sim.state;
      if (!st.started) return 'Ready · press Flick';
      return st.res + ' · t = ' + M.fmt(st.t * 1000, 0) + ' ms (real time)';
    },
    readout: function (sim) {
      var p = sim.p, st = sim.state, o = obj(p);
      return {
        res: st.res, amax: o.mu * G, vmin: vMin(p),
        tu: st.tUnder != null ? st.tUnder * 1000 : (st.dragged ? 'never left it' : st.started ? '…' : '—'),
        dx: st.started ? Math.abs(st.slipX) * 1000 : 0,
        t: st.t * 1000
      };
    },

    draw: function (sim) {
      var ctx = sim.ctx, W = sim.width, H = sim.height, c = sim.colors, p = sim.p, st = sim.state, o = obj(p), narrow = W < 560;
      var top = narrow ? 64 : 58, bottomPad = 34;
      var s = Math.min(W / (VIEW_X1 - VIEW_X0), (H - top - bottomPad) / 0.2);
      var x0 = (W - s * (VIEW_X1 - VIEW_X0)) / 2, floorY = H - bottomPad;
      function X(x) { return x0 + (x - VIEW_X0) * s; }
      function Y(y) { return floorY - y * s; }
      D.clear(ctx, W, H, c.bg);

      // table
      ctx.fillStyle = D.alpha('#a16207', c.light ? 0.35 : 0.45);
      ctx.fillRect(0, floorY, W, H - floorY);
      D.line(ctx, 0, floorY, W, floorY, D.alpha('#a16207', 0.9), 2);

      // glass (behind the coin if inside)
      var gl = [X(-R_OUT), Y(GLASS_H)], gr = [X(R_OUT), Y(GLASS_H)];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(gl[0], gl[1]); ctx.lineTo(X(-R_BOT), Y(0)); ctx.lineTo(X(R_BOT), Y(0)); ctx.lineTo(gr[0], gr[1]);
      ctx.fillStyle = D.alpha('#7dd3fc', c.light ? 0.18 : 0.12); ctx.fill();
      ctx.strokeStyle = D.alpha('#7dd3fc', 0.85); ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = D.alpha('#7dd3fc', 0.35); ctx.fillRect(X(-R_BOT), Y(BASE), X(R_BOT) - X(-R_BOT), BASE * s);
      ctx.restore();

      // card
      var card = st.card, coin = st.coin;
      ctx.save();
      var cx = X(card.x), cy = Y(card.y + CARD_T / 2);
      ctx.translate(cx, cy);
      D.roundRect(ctx, -L / 2 * s, -Math.max(3, CARD_T * s) / 2, L * s, Math.max(3, CARD_T * s), 1.5, '#f59e0b', D.alpha('#000', 0.3), 1);
      ctx.restore();

      // the object (stack)
      var ow = o.w * s, oh = Math.max(3, o.h * s), col = p.obj === 'eraser' ? '#f472b6' : p.obj === 'ice' ? '#a78bfa' : '#cbd5e1';
      for (var i = 0; i < p.n; i++) {
        var ox = X(coin.x) - ow / 2, oy = Y(coin.y) - oh * (i + 1);
        D.roundRect(ctx, ox, oy, ow, oh, Math.min(2, oh / 2), col, D.alpha('#000', 0.45), 1);
      }
      var objTop = Y(coin.y) - oh * p.n;

      // finger (only before / just after the flick)
      var fx = X(-L / 2) - 4, fy = Y(GLASS_H + CARD_T / 2);
      var back = st.started ? 0 : 14;
      ctx.save();
      D.roundRect(ctx, fx - 46 - back, fy - 9, 46, 18, 9, '#d6a77a', D.alpha('#000', 0.35), 1);
      D.roundRect(ctx, fx - 14 - back, fy - 8, 12, 16, 5, '#f1c9a5');
      ctx.restore();
      if (!st.started) {
        D.arrow(ctx, fx - 40, fy + 22, fx + 4, fy + 22, c.s1, 2.5, 8);
        D.text(ctx, 'flick', fx - 18, fy + 36, { color: c.s1, size: 11, weight: 700, align: 'center' });
      }

      // labels
      if (card.x > 0.004 && !card.rest && coin.on === 'card') {
        var ax = X(coin.x), ay = objTop - 10;
        var slipping = coin.vx < card.vx - 1e-6;
        D.arrow(ctx, ax, ay, ax + 22, ay, slipping ? c.danger : c.s2, 2.5, 7);
        D.text(ctx, slipping ? 'friction (max μg)' : 'riding along', ax + 26, ay, { color: slipping ? c.danger : c.s2, size: 11, weight: 700, bg: D.alpha(c.bg, 0.8), fit: W });
      }
      D.text(ctx, 'glass', X(0), Y(GLASS_H * 0.45), { color: D.alpha(c.muted, 0.9), size: 11, align: 'center' });
      if (!st.started) {
        D.text(ctx, o.name + (p.n > 1 ? ' × ' + p.n : ''), X(0), objTop - 12, { color: c.text, size: 11.5, weight: 700, align: 'center', bg: D.alpha(c.bg, 0.8), fit: W });
        D.text(ctx, 'card', X(L / 2) + 6, Y(GLASS_H) - 2, { color: '#f59e0b', size: 11, weight: 700 });
      }

      // headline
      var headline, hc = c.s1;
      if (!st.started) headline = 'Flick the card: will the ' + (p.obj === 'coin' ? 'coin' : 'object') + ' fall into the glass?';
      else if (coin.where === 'glass') { headline = 'Inertia of rest: it stayed put and dropped in'; hc = c.success; }
      else if (coin.where === 'outside') { headline = 'Dragged too far before the card left: it missed'; hc = c.warning; }
      else if (st.dragged) { headline = 'Too slow: friction keeps it moving with the card'; hc = c.warning; }
      else headline = 'The card slides out from under it…';
      var fs = narrow ? 11.5 : 13;
      ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif';
      while (fs > 9 && ctx.measureText(headline).width > W - 30) { fs -= 0.5; ctx.font = '700 ' + fs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, headline, W / 2, 18, { color: c.bg, bg: hc, size: fs, weight: 700, align: 'center', pad: 5, fit: W });
      var sub = (narrow ? 'Needs more than √(μgL) = ' : 'Needs a flick faster than √(μgL) = ') + M.fmt(vMin(p), 2) + ' m/s · yours: ' + M.fmt(p.v, 2) + ' m/s';
      D.text(ctx, sub, W / 2, 42, { color: p.v > vMin(p) ? c.success : c.muted, size: narrow ? 10.5 : 12, weight: 600, align: 'center', fit: W });
      D.text(ctx, 'Slow motion: ' + (p.slow === '1' ? 'off' : '× ' + Math.round(1 / parseFloat(p.slow))), W - 10, H - 12, { color: c.faint, size: 11, align: 'right' });
      D.text(ctx, 't = ' + M.fmt(st.t * 1000, 0) + ' ms', 10, H - 12, { color: c.faint, size: 11 });
    }
  });

  // half-width of the inside of the (tapered) glass at height y
  function innerHalf(y) { return R_BOT - 0.003 + (R_IN - R_BOT + 0.003) * M.clamp(y / GLASS_H, 0, 1); }
})();
