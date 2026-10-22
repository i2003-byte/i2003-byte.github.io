/* =====================================================================
   Microorganisms · How Diseases Spread — sim.js
   ---------------------------------------------------------------------
   160 people walk about a small town (a 100 × 70 box). Each one is
     healthy (can catch it) · sick (spreads it) · recovered (immune)
     · vaccinated (immune from the start)
   Cough diseases: every sick person coughs about every 0.75 days for
   D days; anyone healthy within 6 units may catch it with chance p.
   p is chosen so that, in a crowd where nobody is immune, one sick
   person would infect about R₀ others:
     R₀ = (D / 0.75) × (people within 6 units) × p
     flu-like R₀ ≈ 2 (D = 5 days), measles-like R₀ ≈ 12 (D = 7 days)
   Masks and hand-washing halve p; sick people who stay at home stop
   walking and meet 70 % fewer people.
   Mosquito disease (like dengue or malaria): germs pass only through
   mosquito bites. 60 mosquitoes each bite someone nearby, rest a day,
   then fly to the next person. A bite passes the germ person → mosquito
   or mosquito → person with chance 0.7 (0.28 under a net). Mosquitoes
   live about 10 days. Clearing stagnant water leaves 18 mosquitoes.
     R₀ ≈ (mosquitoes / people) × bites a day² × chance² × D × life ≈ 3.6
   Herd immunity: an outbreak dies out once fewer than 1 in R₀ people
   can catch it, so a share 1 − 1/R₀ must be immune.
   1 s of real time is 2 days in the town; the run lasts 120 days.
   ===================================================================== */
(function () {
  'use strict';
  var M = SimLab.math, D = SimLab.draw;
  var SEED = 4, EARLY = SEED, WX = 100, WY = 70, N = 160, COUGH = 0.75, DAYS_PER_S = 2, END = 120, SPEED = 8;
  var DIS = {
    flu: { label: 'Flu-like cough', R0: 2, days: 5, reach: 6, mosq: false },
    measles: { label: 'Measles-like cough', R0: 12, days: 7, reach: 12, mosq: false },
    mosquito: { label: 'Mosquito-borne (like dengue)', R0: 3.6, days: 5, reach: 0, mosq: true }
  };
  var COL = { S: '#60a5fa', I: '#ef4444', R: '#22c55e', V: '#a78bfa' };

  function dis(p) { return DIS[p.disease] || DIS.flu; }
  function personal(p) { return p.prevent === 'personal' || p.prevent === 'both'; }
  function source(p) { return p.prevent === 'source' || p.prevent === 'both'; }
  function coughP(p) {
    var d = dis(p), near = N / (WX * WY) * Math.PI * d.reach * d.reach;
    var q = d.R0 / (d.days / COUGH * near);
    if (personal(p)) q *= 0.5;
    if (source(p)) q *= 0.3;
    return Math.min(1, q);
  }
  function infect(st, a, src) { a.s = 'I'; a.t = dis(st.p).days * (0.8 + Math.random() * 0.4); a.cough = Math.random() * COUGH; a.by = src; a.n = st.ever++; if (src != null && st.ppl[src]) st.ppl[src].caused++; }
  function newMosq(fresh) { return { x: Math.random() * WX, y: Math.random() * WY, tgt: Math.floor(Math.random() * N), rest: fresh ? Math.random() : 0, inf: false, src: null, life: -10 * Math.log(1 - Math.random() * 0.999) }; }
  function nearbyPerson(st, x, y) {
    for (var k = 0; k < 20; k++) { var j = Math.floor(Math.random() * N), q = st.ppl[j]; if (Math.hypot(q.x - x, q.y - y) < 25) return j; }
    return Math.floor(Math.random() * N);
  }

  SimLab.createSim({
    ariaLabel: 'A town of 160 people walking about; sick people pass a germ on by coughing or through mosquito bites, while vaccinated and recovered people cannot catch it',
    playLabel: 'Start the outbreak',
    mobileAspect: '3 / 2.6',
    params: [
      { id: 'disease', label: 'Disease', type: 'select', value: 'flu', options: [
        { value: 'flu', label: 'Flu-like, spread by coughs (R₀ ≈ 2)' },
        { value: 'measles', label: 'Measles-like, very catching (R₀ ≈ 12)' },
        { value: 'mosquito', label: 'Spread by mosquitoes (like dengue)' }] },
      { id: 'vacc', label: 'People vaccinated', min: 0, max: 95, step: 5, value: 0, unit: '%', presets: [0, 30, 50, 70, 95] },
      { id: 'prevent', label: 'Other protection', type: 'select', value: 'none', options: [
        { value: 'none', label: 'None' },
        { value: 'personal', label: 'Masks & hand-washing (or mosquito nets)' },
        { value: 'source', label: 'Sick stay home (or clear stagnant water)' },
        { value: 'both', label: 'Both' }] }
    ],
    readouts: [
      { id: 'day', label: 'Day', digits: 0 },
      { id: 'sick', label: 'Sick now', unit: 'people', digits: 0, key: true },
      { id: 'ever', label: 'Ever caught it', short: 'Ever ill', unit: '%', digits: 0, key: true },
      { id: 'passed', label: 'Each of the first 4 sick passed it to', short: 'Passed on', digits: 1, key: true },
      { id: 'herd', label: 'Herd immunity needs', unit: '% immune', digits: 0 },
      { id: 'safe', label: 'Never caught it', unit: 'people', digits: 0 }
    ],
    graph: { title: 'The outbreak', xLabel: 'day', yLabel: '% of people', series: [{ label: 'Sick now', color: '#ef4444' }, { label: 'Recovered', color: '#22c55e' }], xMax: END, yMin: 0, yMax: 100 },

    reset: function (sim) {
      var p = sim.p, st = sim.state = { p: p, day: 0, ever: 0, ppl: [], mosq: [], rings: [], bites: [], lastPush: 0, done: false };
      for (var i = 0; i < N; i++) {
        var ang = Math.random() * Math.PI * 2;
        st.ppl.push({ x: 2 + Math.random() * (WX - 4), y: 2 + Math.random() * (WY - 4), vx: Math.cos(ang) * SPEED, vy: Math.sin(ang) * SPEED, s: 'S', t: 0, cough: 0, by: null, caused: 0, n: -1 });
      }
      var nv = Math.round(N * p.vacc / 100), order = st.ppl.map(function (_, i) { return i; }).sort(function () { return Math.random() - 0.5; });
      for (var k = 0; k < nv; k++) st.ppl[order[k]].s = 'V';
      for (k = nv; k < Math.min(N, nv + SEED); k++) infect(st, st.ppl[order[k]], null);
      if (dis(p).mosq) { var nm = source(p) ? 18 : 60; for (k = 0; k < nm; k++) st.mosq.push(newMosq(true)); }
      if (sim.graph) { sim.graph.clear(); sim.graph.push(0, [st.ever / N * 100, 0]); }
    },
    update: function (sim, dt) {
      var st = sim.state, p = sim.p, d = dis(p), dd = dt * DAYS_PER_S, home = source(p) && !d.mosq;
      if (st.done) return;
      st.day += dd;
      var q = coughP(p), sick = 0;
      st.ppl.forEach(function (a, i) {
        if (!(home && a.s === 'I')) {
          var turn = (Math.random() - 0.5) * 3 * dd, c = Math.cos(turn), s = Math.sin(turn), vx = a.vx;
          a.vx = vx * c - a.vy * s; a.vy = vx * s + a.vy * c;
          a.x += a.vx * dd; a.y += a.vy * dd;
          if (a.x < 1) { a.x = 1; a.vx = Math.abs(a.vx); } if (a.x > WX - 1) { a.x = WX - 1; a.vx = -Math.abs(a.vx); }
          if (a.y < 1) { a.y = 1; a.vy = Math.abs(a.vy); } if (a.y > WY - 1) { a.y = WY - 1; a.vy = -Math.abs(a.vy); }
        }
        if (a.s !== 'I') return;
        sick++;
        if (!d.mosq) {
          a.cough -= dd;
          if (a.cough <= 0) {
            a.cough += COUGH * (0.7 + Math.random() * 0.6);
            if (st.rings.length < 40) st.rings.push({ x: a.x, y: a.y, age: 0 });
            // staying at home (q × 0.3 in coughP): only family and visitors are close enough
            st.ppl.forEach(function (b) {
              if (b.s === 'S' && Math.hypot(b.x - a.x, b.y - a.y) < d.reach && Math.random() < q) infect(st, b, i);
            });
          }
        }
        a.t -= dd;
        if (a.t <= 0) a.s = 'R';
      });
      if (d.mosq) {
        var ch = personal(p) ? 0.28 : 0.7;
        st.mosq.forEach(function (m, k) {
          m.life -= dd;
          if (m.life <= 0) { st.mosq[k] = newMosq(false); return; }
          if (m.rest > 0) { m.rest -= dd; return; }
          var b = st.ppl[m.tgt], dx = b.x - m.x, dy = b.y - m.y, dist = Math.hypot(dx, dy);
          if (dist < 1.2) {
            if (st.bites.length < 30) st.bites.push({ x: b.x, y: b.y, age: 0, inf: m.inf || b.s === 'I' });
            if (b.s === 'I' && !m.inf && Math.random() < ch) { m.inf = true; m.src = m.tgt; }
            else if (m.inf && b.s === 'S' && Math.random() < ch) infect(st, b, m.src);
            m.rest = 0.8 + Math.random() * 0.4; m.tgt = nearbyPerson(st, m.x, m.y);
          } else {
            var v = 30 * dd / dist; m.x += dx * Math.min(1, v) + (Math.random() - 0.5) * 0.6; m.y += dy * Math.min(1, v) + (Math.random() - 0.5) * 0.6;
          }
        });
      }
      st.rings.forEach(function (r) { r.age += dd; }); st.rings = st.rings.filter(function (r) { return r.age < 0.6; });
      st.bites.forEach(function (r) { r.age += dd; }); st.bites = st.bites.filter(function (r) { return r.age < 0.8; });
      if (sim.graph && st.day - st.lastPush >= 1) {
        st.lastPush = st.day;
        var rec = st.ppl.filter(function (a) { return a.s === 'R'; }).length;
        sim.graph.push(st.day, [sick / N * 100, rec / N * 100]);
      }
      if (st.day >= END || (sick === 0 && st.day > 1)) st.done = true;
    },
    finished: function (sim) { return sim.state.done; },
    readout: function (sim) {
      var st = sim.state, d = dis(sim.p), sick = 0, safe = 0, fin = 0, sum = 0;
      st.ppl.forEach(function (a) {
        if (a.s === 'I') sick++;
        if (a.s === 'S' || a.s === 'V') safe++;
        // the first sick people, once they have all recovered
        if (a.n >= 0 && a.n < EARLY) { if (a.s === 'R') { fin++; sum += a.caused; } else fin -= 99; }
      });
      return { day: Math.floor(st.day), sick: sick, ever: st.ever / N * 100, passed: fin > 0 ? sum / fin : '—', herd: d.mosq ? '—' : (1 - 1 / d.R0) * 100, safe: safe };
    },
    status: function (sim) {
      var st = sim.state, d = dis(sim.p), sick = st.ppl.filter(function (a) { return a.s === 'I'; }).length;
      if (st.day <= 0) return SEED + ' people fall sick. ' + (d.mosq ? 'Only mosquito bites can pass it on' : 'Coughs pass it to people close by');
      if (st.done && sick === 0) return 'Outbreak over on day ' + Math.round(st.day) + ': ' + Math.round(st.ever / N * 100) + '% caught it';
      if (st.done) return 'Day 120: ' + sick + ' still sick';
      return 'Day ' + Math.floor(st.day) + ': ' + sick + ' sick';
    },

    draw: function (sim, now) {
      var ctx = sim.ctx, c = sim.colors, p = sim.p, st = sim.state, W = sim.width, H = sim.height, narrow = W < 560, fs = narrow ? 10.5 : 12.5;
      D.clear(ctx, W, H, c.bg);
      var top = narrow ? 30 : 38, bot = narrow ? 24 : 30, k = Math.min((W - 16) / WX, (H - top - bot) / WY);
      var ox = (W - WX * k) / 2, oy = top + (H - top - bot - WY * k) / 2;
      D.roundRect(ctx, ox, oy, WX * k, WY * k, 8, c.light ? '#f1f5f0' : '#16211b', D.alpha(c.ink, 0.25), 1);
      function X(x) { return ox + x * k; } function Y(y) { return oy + y * k; }
      var home = source(p) && !dis(p).mosq, pr = Math.max(2.6, k * 1.15);
      // cough clouds
      st.rings.forEach(function (r) {
        var f = r.age / 0.6;
        D.circle(ctx, X(r.x), Y(r.y), dis(p).reach * k * (0.3 + 0.7 * f), D.alpha('#ef4444', 0.12 * (1 - f)), D.alpha('#ef4444', 0.45 * (1 - f)), 1);
      });
      st.bites.forEach(function (b) { D.circle(ctx, X(b.x), Y(b.y), pr * 2.2, null, D.alpha(b.inf ? '#ef4444' : c.muted, 0.8 * (1 - b.age / 0.8)), 1.5); });
      st.ppl.forEach(function (a) {
        var x = X(a.x), y = Y(a.y);
        if (home && a.s === 'I') D.roundRect(ctx, x - pr * 2, y - pr * 2, pr * 4, pr * 4, 2, null, D.alpha(c.ink, 0.6), 1.2);
        D.circle(ctx, x, y, pr, COL[a.s]);
        if (a.s === 'V') D.circle(ctx, x, y, pr + 1.6, null, '#c4b5fd', 1.2);
      });
      st.mosq.forEach(function (m, i) {
        var x = X(m.x), y = Y(m.y), w = Math.sin((now || 0) / 40 + i) * 2;
        D.line(ctx, x - 3, y - 1 - w * 0.5, x, y, D.alpha(c.ink, 0.5), 1); D.line(ctx, x + 3, y - 1 - w * 0.5, x, y, D.alpha(c.ink, 0.5), 1);
        D.circle(ctx, x, y, 1.6, m.inf ? '#dc2626' : (c.light ? '#334155' : '#e2e8f0'));
      });
      // legend
      var items = [['S', 'Can catch it'], ['I', 'Sick'], ['R', 'Recovered'], ['V', 'Vaccinated']], lx = 10, ly = H - bot / 2;
      ctx.font = '500 ' + (fs - 0.5) + 'px Inter, system-ui, sans-serif';
      var tot = items.reduce(function (s, it) { return s + ctx.measureText(it[1]).width + 22; }, 0) + (st.mosq.length ? 70 : 0);
      lx = Math.max(6, (W - tot) / 2);
      items.forEach(function (it) {
        D.circle(ctx, lx + 5, ly, 4.5, COL[it[0]]);
        D.text(ctx, it[1], lx + 13, ly, { color: c.muted, size: fs - 0.5 });
        lx += ctx.measureText(it[1]).width + 22;
      });
      if (st.mosq.length) { D.circle(ctx, lx + 4, ly, 2, '#dc2626'); D.text(ctx, 'mosquito', lx + 10, ly, { color: c.muted, size: fs - 0.5 }); }
      // headline
      var d = dis(p), sick = st.ppl.filter(function (a) { return a.s === 'I'; }).length;
      var hl = st.day <= 0 ? d.label + ': ' + SEED + ' sick people in a town of 160' : 'Day ' + Math.floor(st.day) + ' · ' + sick + ' sick · ' + Math.round(st.ever / N * 100) + '% have caught it';
      var hs = narrow ? 12 : 14;
      ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif';
      while (hs > 9 && ctx.measureText(hl).width > W - 24) { hs -= 0.5; ctx.font = '700 ' + hs + 'px Inter, system-ui, sans-serif'; }
      D.text(ctx, hl, W / 2, narrow ? 13 : 17, { color: c.bg, bg: c.accent, size: hs, weight: 700, align: 'center', pad: 4, fit: W });
    }
  });
})();
