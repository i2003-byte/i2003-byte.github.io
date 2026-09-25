/* =====================================================================
   SimLab — common.js
   ---------------------------------------------------------------------
   Shared toolkit for every simulation page. A simulation's own sim.js
   only describes its physics & drawing; this file builds the page:

     • page shell: title, badges, canvas stage, control panel
     • animation loop (fixed time-step, speed control, play/pause/step)
     • control builder: sliders (with presets), dropdowns, toggles, buttons
     • live readouts + live graph (tiny canvas plotter, no library needed)
     • canvas resize (sharp on hi-DPI screens), pointer/touch input
     • URL state: parameters are saved in the address bar → shareable links
     • fullscreen (with an iPhone-friendly fallback), keyboard shortcuts
     • prev/next + related simulations from catalog.js
     • helpers: vector math, RK4 integrator, drawing, Web Audio sounds

   USAGE (in sim.js):

     SimLab.createSim({
       params:   [{ id:'angle', label:'Angle', min:0, max:90, step:1, value:45, unit:'°' }],
       readouts: [{ id:'t', label:'Time', unit:'s', digits:2 }],
       graph:    { title:'Height vs time', yLabel:'m', series:[{ label:'y' }], window:10 },
       reset(sim)      { sim.state = {...} },          // (re)initialise from sim.p
       update(sim, dt) { ...advance physics by dt... }, // called many times per frame
       draw(sim)       { ...paint on sim.ctx... },
       readout(sim)    { return { t: sim.time }; },
       sample(sim)     { return [sim.state.y]; }       // graph values
     });

   Load order on a page: catalog.js → nav.js → common.js → sim.js
   ===================================================================== */
(function () {
  'use strict';

  var S = window.SimLab;
  var ui = S.ui;
  var esc = ui.esc, h = ui.h, $ = ui.$, $$ = ui.$$, icon = ui.icon;

  /* =================================================================
     MATH & VECTOR HELPERS
     ================================================================= */
  var M = {
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    rad: function (deg) { return deg * Math.PI / 180; },
    deg: function (rad) { return rad * 180 / Math.PI; },
    /** Format number with fixed digits, trimming "-0". */
    fmt: function (v, digits) {
      if (v == null || !isFinite(v)) return '—';
      var s = Number(v).toFixed(digits == null ? 2 : digits);
      return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s;
    },
    /**
     * One RK4 step. y = array of state values, f(y, t) returns dy/dt array.
     */
    rk4: function (y, f, dt, t) {
      t = t || 0;
      var k1 = f(y, t);
      var y2 = y.map(function (v, i) { return v + k1[i] * dt / 2; });
      var k2 = f(y2, t + dt / 2);
      var y3 = y.map(function (v, i) { return v + k2[i] * dt / 2; });
      var k3 = f(y3, t + dt / 2);
      var y4 = y.map(function (v, i) { return v + k3[i] * dt; });
      var k4 = f(y4, t + dt);
      return y.map(function (v, i) { return v + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]); });
    },
    /** Deterministic pseudo-random generator (for repeatable scenes). */
    rng: function (seed) {
      var s = seed >>> 0 || 1;
      return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
    }
  };

  var V = {
    v: function (x, y) { return { x: x, y: y }; },
    add: function (a, b) { return { x: a.x + b.x, y: a.y + b.y }; },
    sub: function (a, b) { return { x: a.x - b.x, y: a.y - b.y }; },
    scale: function (a, k) { return { x: a.x * k, y: a.y * k }; },
    dot: function (a, b) { return a.x * b.x + a.y * b.y; },
    len: function (a) { return Math.hypot(a.x, a.y); },
    dist: function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },
    norm: function (a) { var l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; },
    rotate: function (a, ang) { var c = Math.cos(ang), s = Math.sin(ang); return { x: a.x * c - a.y * s, y: a.x * s + a.y * c }; },
    fromAngle: function (ang, len) { return { x: Math.cos(ang) * (len || 1), y: Math.sin(ang) * (len || 1) }; }
  };

  /* =================================================================
     THEME COLORS (read from CSS variables so canvases match the theme)
     ================================================================= */
  function themeColors() {
    var cs = getComputedStyle(document.body);
    function v(name) { return cs.getPropertyValue(name).trim(); }
    return {
      bg: v('--canvas-bg'), grid: v('--canvas-grid'), axis: v('--canvas-axis'), ink: v('--canvas-ink'),
      text: v('--text'), muted: v('--text-muted'), faint: v('--text-faint'),
      surface: v('--surface'), surface2: v('--surface-2'), border: v('--border-strong'),
      accent: v('--accent'), primary: v('--primary'),
      s1: v('--sim-1'), s2: v('--sim-2'), s3: v('--sim-3'), s4: v('--sim-4'),
      success: v('--success'), warning: v('--warning'), danger: v('--danger'),
      font: v('--font-body'), mono: v('--font-mono'),
      light: document.documentElement.dataset.theme === 'light'
    };
  }

  /* =================================================================
     CANVAS HELPERS
     ================================================================= */
  /** Size a canvas to its CSS box × devicePixelRatio. Returns {w,h}. */
  function fitCanvas(canvas, ctx) {
    var r = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var w = Math.max(1, Math.round(r.width)), hgt = Math.max(1, Math.round(r.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(hgt * dpr);
    }
    (ctx || canvas.getContext('2d')).setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: hgt, dpr: dpr };
  }

  var D = {
    clear: function (ctx, w, h, color) { ctx.fillStyle = color; ctx.fillRect(0, 0, w, h); },
    line: function (ctx, x1, y1, x2, y2, color, width, dash) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width || 1;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    },
    circle: function (ctx, x, y, r, fill, stroke, lw) {
      ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
    },
    roundRect: function (ctx, x, y, w, h, r, fill, stroke, lw) {
      r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
    },
    /** Arrow from (x1,y1) to (x2,y2). */
    arrow: function (ctx, x1, y1, x2, y2, color, width, head) {
      var len = Math.hypot(x2 - x1, y2 - y1);
      if (len < 1) return;
      head = Math.min(head || 10, len * 0.6);
      var a = Math.atan2(y2 - y1, x2 - x1);
      ctx.save(); ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = width || 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.8, y2 - Math.sin(a) * head * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - head * Math.cos(a - 0.4), y2 - head * Math.sin(a - 0.4));
      ctx.lineTo(x2 - head * Math.cos(a + 0.4), y2 - head * Math.sin(a + 0.4));
      ctx.closePath(); ctx.fill(); ctx.restore();
    },
    /** Text label. opts: {color, size, weight, align, baseline, font, bg, pad, fit}
        fit: canvas width — nudges the label so it never gets cut off at the edges. */
    text: function (ctx, str, x, y, opts) {
      opts = opts || {};
      ctx.save();
      ctx.font = (opts.weight || 500) + ' ' + (opts.size || 12) + 'px ' + (opts.font || 'Inter, system-ui, sans-serif');
      if (opts.fit) {
        var tw = ctx.measureText(str).width + 8, left = opts.align === 'center' ? x - tw / 2 : opts.align === 'right' ? x - tw : x;
        x += Math.max(0, 2 - left) - Math.max(0, left + tw - opts.fit + 2);
      }
      ctx.textAlign = opts.align || 'left';
      ctx.textBaseline = opts.baseline || 'middle';
      if (opts.bg) {
        var m = ctx.measureText(str), pad = opts.pad == null ? 4 : opts.pad, w = m.width + pad * 2, hh = (opts.size || 12) + pad * 2;
        var bx = opts.align === 'center' ? x - w / 2 : opts.align === 'right' ? x - w + pad : x - pad;
        var by = opts.baseline === 'top' ? y - pad : opts.baseline === 'bottom' ? y - hh + pad : y - hh / 2;
        D.roundRect(ctx, bx, by, w, hh, 5, opts.bg);
      }
      ctx.fillStyle = opts.color || '#fff';
      ctx.fillText(str, x, y);
      ctx.restore();
    },
    /** Background grid. */
    grid: function (ctx, x0, y0, w, h, step, color) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath();
      for (var x = x0; x <= x0 + w + 0.5; x += step) { ctx.moveTo(Math.round(x) + 0.5, y0); ctx.lineTo(Math.round(x) + 0.5, y0 + h); }
      for (var y = y0; y <= y0 + h + 0.5; y += step) { ctx.moveTo(x0, Math.round(y) + 0.5); ctx.lineTo(x0 + w, Math.round(y) + 0.5); }
      ctx.stroke(); ctx.restore();
    },
    /** Plot y = fn(x) between pixel x0..x1 (fn receives pixel x, returns pixel y). */
    curve: function (ctx, fn, x0, x1, color, width, stepPx) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width || 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var x = x0; x <= x1; x += stepPx || 2) { var y = fn(x); if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
    },
    /** A "nice" step for axis ticks so that about `count` ticks fit in `range`. */
    niceStep: function (range, count) {
      var raw = range / (count || 5), p = Math.pow(10, Math.floor(Math.log10(raw || 1))), n = raw / p;
      return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
    },
    /** Hex/rgb color with alpha (accepts '#rrggbb' or any CSS color). */
    alpha: function (color, a) {
      var m = /^#([0-9a-f]{6})$/i.exec(String(color).trim());
      if (m) {
        var n = parseInt(m[1], 16);
        return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
      }
      return 'color-mix(in srgb, ' + color + ' ' + Math.round(a * 100) + '%, transparent)';
    }
  };

  /* =================================================================
     GRAPH — a tiny live line-chart for canvases
     opts: { title, xLabel, yLabel, series:[{label, color}], window (s) | null,
             yMin, yMax, xMax (fixed), maxPoints }
     ================================================================= */
  function Graph(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = opts;
    this.data = [];
    this.maxPoints = opts.maxPoints || 4000;
  }
  Graph.prototype.clear = function () { this.data = []; };
  Graph.prototype.push = function (t, values) {
    this.data.push({ t: t, v: values });
    if (this.opts.window) {
      var cutoff = t - this.opts.window * 1.05;
      while (this.data.length > 2 && this.data[0].t < cutoff) this.data.shift();
    }
    if (this.data.length > this.maxPoints) this.data.splice(0, this.data.length - this.maxPoints);
  };
  Graph.prototype.draw = function (c) {
    var o = this.opts, ctx = this.ctx, size = fitCanvas(this.canvas, ctx), W = size.w, H = size.h;
    var pad = { l: 48, r: 12, t: 10, b: 30 };
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    ctx.clearRect(0, 0, W, H);
    var data = this.data;
    var tLast = data.length ? data[data.length - 1].t : 0;
    var x0, x1;
    if (o.window) { x1 = Math.max(o.window, tLast); x0 = x1 - o.window; }
    else { x0 = 0; x1 = Math.max(o.xMax ? (typeof o.xMax === 'function' ? o.xMax() : o.xMax) : 1, tLast) || 1; }

    var y0 = o.yMin, y1 = o.yMax;
    if (y0 == null || y1 == null) {
      var lo = Infinity, hi = -Infinity;
      data.forEach(function (d) { if (d.t >= x0) d.v.forEach(function (v) { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }); });
      if (!isFinite(lo)) { lo = -1; hi = 1; }
      if (o.includeZero !== false) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
      if (o.symmetric) { var m = Math.max(Math.abs(lo), Math.abs(hi)); lo = -m; hi = m; }
      if (hi - lo < 1e-9) { hi += 1; lo -= 1; }
      var padY = (hi - lo) * 0.08;
      y0 = y0 != null ? y0 : lo - (o.symmetric || lo < 0 ? padY : 0);
      y1 = y1 != null ? y1 : hi + padY;
    }
    function X(t) { return pad.l + (t - x0) / (x1 - x0) * pw; }
    function Y(v) { return pad.t + (1 - (v - y0) / (y1 - y0)) * ph; }

    // grid + ticks
    ctx.font = '11px ' + (c.mono || 'monospace');
    ctx.fillStyle = c.muted; ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
    var sx = D.niceStep(x1 - x0, Math.max(2, Math.floor(pw / 80))), sy = D.niceStep(y1 - y0, Math.max(2, Math.floor(ph / 40)));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (var t = Math.ceil(x0 / sx) * sx; t <= x1 + 1e-9; t += sx) {
      var px = Math.round(X(t)) + 0.5;
      ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, pad.t + ph); ctx.stroke();
      ctx.fillText(M.fmt(t, sx < 1 ? 1 : 0), px, pad.t + ph + 6);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-9; v += sy) {
      var py = Math.round(Y(v)) + 0.5;
      ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(pad.l + pw, py); ctx.stroke();
      ctx.fillText(M.fmt(v, sy < 1 ? (sy < 0.1 ? 2 : 1) : 0), pad.l - 6, py);
    }
    // zero line
    if (y0 < 0 && y1 > 0) D.line(ctx, pad.l, Y(0), pad.l + pw, Y(0), c.axis, 1);
    // axis labels
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText(o.xLabel || 'time (s)', pad.l + pw, H - 1);
    ctx.save(); ctx.translate(11, pad.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.yLabel || '', 0, 0); ctx.restore();

    // series
    ctx.save();
    ctx.beginPath(); ctx.rect(pad.l, pad.t, pw, ph); ctx.clip();
    var colors = [c.s1, c.s2, c.s3, c.s4];
    (o.series || [{}]).forEach(function (s, i) {
      ctx.strokeStyle = s.color ? (c[s.color] || s.color) : colors[i % 4];
      ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath();
      var started = false;
      for (var k = 0; k < data.length; k++) {
        var d = data[k]; if (d.t < x0 - 0.5) continue;
        var yy = d.v[i]; if (!isFinite(yy)) { started = false; continue; }
        if (!started) { ctx.moveTo(X(d.t), Y(yy)); started = true; } else ctx.lineTo(X(d.t), Y(yy));
      }
      ctx.stroke();
      if (data.length) {
        var last = data[data.length - 1];
        if (isFinite(last.v[i])) D.circle(ctx, X(last.t), Y(last.v[i]), 3.5, ctx.strokeStyle);
      }
    });
    ctx.restore();
    ctx.strokeStyle = c.axis; ctx.strokeRect(pad.l + 0.5, pad.t + 0.5, pw, ph);
  };

  /* =================================================================
     AUDIO — tiny Web Audio helper for simulations that make sound.
     Sound is OFF until the user switches it on (choice remembered).
     ================================================================= */
  var Audio = (function () {
    var ctx = null, master = null, voices = [];
    var enabled = false;
    try { enabled = localStorage.getItem('simlab-sound') === 'on'; } catch (e) { /* ignore */ }
    var listeners = [];

    function supported() { return !!(window.AudioContext || window.webkitAudioContext); }
    function ensure() {
      if (!supported()) return null;
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = enabled ? 0.5 : 0;
        var comp = ctx.createDynamicsCompressor(); // protects ears & speakers
        master.connect(comp); comp.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function setEnabled(on) {
      enabled = !!on;
      try { localStorage.setItem('simlab-sound', enabled ? 'on' : 'off'); } catch (e) { /* ignore */ }
      if (enabled) ensure();
      if (master) master.gain.setTargetAtTime(enabled ? 0.5 : 0, ctx.currentTime, 0.02);
      listeners.forEach(function (fn) { fn(enabled); });
    }
    // Browsers only allow audio after a user gesture: resume on the first one.
    ['pointerdown', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, function () { if (enabled) ensure(); }, { passive: true });
    });

    /**
     * Continuous voice (oscillator). Returns {set(freq, gain, type), stop()}.
     * gain is 0..1 (relative loudness).
     */
    function voice(type) {
      var c = ensure(); if (!c) return { set: function () {}, stop: function () {} };
      var osc = c.createOscillator(), g = c.createGain();
      osc.type = type || 'sine'; g.gain.value = 0;
      osc.connect(g); g.connect(master); osc.start();
      var v = {
        set: function (freq, gain, t) {
          if (t) osc.type = t;
          if (freq != null) osc.frequency.setTargetAtTime(Math.max(1, freq), c.currentTime, 0.015);
          if (gain != null) g.gain.setTargetAtTime(Math.max(0, gain) * 0.6, c.currentTime, 0.03);
        },
        stop: function () {
          g.gain.setTargetAtTime(0, c.currentTime, 0.03);
          setTimeout(function () { try { osc.stop(); osc.disconnect(); } catch (e) { /* already stopped */ } }, 200);
          voices = voices.filter(function (x) { return x !== v; });
        }
      };
      voices.push(v);
      return v;
    }

    /**
     * One-shot tone. opts: {type, gain, duration, attack, harmonics:[amp...], detune}
     * harmonics adds overtones (1 = fundamental) for richer instrument sounds.
     */
    var NOOP = { stop: function () {} };
    function tone(freq, opts) {
      if (!enabled) return NOOP;
      var c = ensure(); if (!c) return NOOP;
      opts = opts || {};
      var now = c.currentTime, dur = opts.duration || 0.6, gain = (opts.gain == null ? 0.5 : opts.gain) * 0.6;
      var harmonics = opts.harmonics || [1];
      var out = c.createGain();
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + (opts.attack || 0.005));
      out.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      out.connect(master);
      harmonics.forEach(function (amp, i) {
        if (!amp) return;
        var o = c.createOscillator(), g = c.createGain();
        o.type = opts.type || 'sine';
        o.frequency.value = freq * (opts.partials ? opts.partials[i] : i + 1);
        g.gain.value = amp / harmonics.length;
        o.connect(g); g.connect(out);
        o.start(now); o.stop(now + dur + 0.05);
      });
      // Handle to cut the note short (e.g. when a vibrating object is touched)
      return {
        stop: function () {
          try { out.gain.cancelScheduledValues(c.currentTime); out.gain.setTargetAtTime(0.0001, c.currentTime, 0.02); } catch (e) { /* ended */ }
        }
      };
    }

    /** Short burst of filtered noise (for noise, claps, traffic…). */
    function noise(duration, gain, lowpass) {
      if (!enabled) return;
      var c = ensure(); if (!c) return;
      var len = Math.floor(c.sampleRate * (duration || 0.5));
      var buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = buf; f.type = 'lowpass'; f.frequency.value = lowpass || 3000; g.gain.value = (gain == null ? 0.4 : gain) * 0.6;
      src.connect(f); f.connect(g); g.connect(master); src.start();
    }

    function stopAll() { voices.slice().forEach(function (v) { v.stop(); }); }
    document.addEventListener('visibilitychange', function () { if (document.hidden && ctx) ctx.suspend(); else if (ctx && enabled) ctx.resume(); });

    return {
      supported: supported, ensure: ensure, voice: voice, tone: tone, noise: noise, stopAll: stopAll,
      get enabled() { return enabled; }, setEnabled: setEnabled,
      onChange: function (fn) { listeners.push(fn); }
    };
  })();

  /* =================================================================
     URL STATE — read/write parameter values in the query string
     ================================================================= */
  function readUrlState(params) {
    var q = new URLSearchParams(location.search), out = {};
    params.forEach(function (p) {
      if (!q.has(p.id)) return;
      var raw = q.get(p.id);
      if (p.type === 'select') { if (p.options.some(function (o) { return String(o.value) === raw; })) out[p.id] = coerce(p, raw); }
      else if (p.type === 'toggle') out[p.id] = raw === '1' || raw === 'true';
      else { var n = parseFloat(raw); if (isFinite(n)) out[p.id] = M.clamp(n, p.min, p.max); }
    });
    return out;
  }
  function coerce(p, raw) {
    var o = p.options.find(function (x) { return String(x.value) === String(raw); });
    return o ? o.value : p.value;
  }
  function stepDigits(step) { var s = String(step || 1); return s.indexOf('.') === -1 ? 0 : s.split('.')[1].length; }
  function buildQuery(params, values) {
    var q = new URLSearchParams();
    params.forEach(function (p) {
      var v = values[p.id];
      if (p.type === 'toggle') q.set(p.id, v ? '1' : '0');
      else if (p.type === 'select') q.set(p.id, String(v));
      else q.set(p.id, String(parseFloat(Number(v).toFixed(stepDigits(p.step))))); // 350 → "350", 2.50 → "2.5"
    });
    return q.toString();
  }

  /* =================================================================
     createSim — builds the whole simulation page
     ================================================================= */
  function createSim(cfg) {
    var body = document.body;
    var simId = body.dataset.sim;
    var entry = S.getSim(simId) || {
      id: simId || 'template', title: body.dataset.title || document.title.split('—')[0].trim(),
      description: body.dataset.description || '', level: 'Beginner', subject: '', branch: ''
    };
    var subj = S.getSubject(entry.subject), branch = S.getBranch(entry.subject, entry.branch);
    var params = (cfg.params || []).map(function (p) {
      p = Object.assign({ type: 'range', step: 1, digits: null }, p);
      if (p.type === 'range' && p.digits == null) p.digits = stepDigits(p.step);
      p.default = p.value;
      return p;
    });
    var hasTransport = cfg.transport !== false;

    /* ---------- the sim object handed to sim.js callbacks ---------- */
    var sim = {
      cfg: cfg, entry: entry,
      p: {}, state: {}, time: 0, running: false, speed: 1,
      canvas: null, ctx: null, width: 0, height: 0, colors: themeColors(),
      graph: null, audio: Audio, M: M, V: V, D: D,
      reduceMotion: ui.reduceMotion,
      toast: ui.toast
    };
    params.forEach(function (p) { sim.p[p.id] = p.value; });
    Object.assign(sim.p, readUrlState(params));

    /* ---------- page shell ---------- */
    var app = $('#sim-app');
    var titleBlock =
      '<div class="sim-title">' +
        '<div>' +
          '<div class="sim-meta">' +
            (subj ? '<a class="badge badge-subject" href="' + S.subjectUrl(subj.id) + '">' + subj.icon + ' ' + esc(subj.name) + '</a>' : '') +
            (branch ? '<a class="badge" href="' + S.subjectUrl(subj.id, branch.id) + '">' + esc(branch.name) + '</a>' : '') +
            ui.levelBadge(entry.level) +
            (S.isNew(entry) ? '<span class="badge badge-new">New</span>' : '') +
          '</div>' +
          '<h1>' + esc(entry.title) + '</h1>' +
          (entry.description ? '<p>' + esc(entry.description) + '</p>' : '') +
        '</div>' +
        '<div class="sim-tools">' +
          (cfg.audio ? '<button class="btn" type="button" data-act="sound" aria-pressed="false">' + icon('mute') + '<span>Sound off</span></button>' : '') +
          '<button class="btn" type="button" data-act="fullscreen">' + icon('expand') + '<span>Fullscreen</span></button>' +
          '<button class="btn" type="button" data-act="share">' + icon('link') + '<span>Copy share link</span></button>' +
        '</div>' +
      '</div>';

    var transportPanel = hasTransport
      ? '<section class="panel" aria-label="Playback">' +
          '<div class="transport">' +
            '<button class="btn btn-primary" type="button" data-act="play" aria-keyshortcuts="Space"></button>' +
            '<button class="btn" type="button" data-act="step" aria-label="Step forward one frame" title="Step (→)">' + icon('step') + '</button>' +
            '<button class="btn" type="button" data-act="reset" aria-label="Restart simulation" title="Restart (R)">' + icon('reset') + '</button>' +
          '</div>' +
          '<div class="speed-row"><span id="speed-lbl">Speed</span><div class="seg" role="group" aria-labelledby="speed-lbl">' +
            [0.25, 0.5, 1, 2, 4].map(function (s) { return '<button type="button" data-speed="' + s + '" aria-pressed="' + (s === 1) + '">' + s + '×</button>'; }).join('') +
          '</div></div>' +
        '</section>'
      : '';

    var buttonsPanel = cfg.buttons && cfg.buttons.length
      ? '<section class="panel"><h2>' + esc(cfg.buttonsTitle || 'Actions') + '</h2><div class="panel-actions">' +
          cfg.buttons.map(function (b, i) {
            return '<button class="btn' + (b.primary ? ' btn-primary' : '') + (b.full ? ' full' : '') + '" type="button" data-btn="' + i + '">' + esc(b.label) + '</button>';
          }).join('') + '</div></section>'
      : '';

    var paramsPanel = params.length
      ? '<section class="panel"><h2>' + esc(cfg.paramsTitle || 'Controls') + '</h2><div id="sim-controls"></div></section>'
      : '';

    var readoutsPanel = (cfg.readouts || []).length
      ? '<section class="panel"><h2>Live readouts</h2><dl class="readouts" id="sim-readouts">' +
          cfg.readouts.map(function (r) {
            return '<div class="readout' + (r.key ? ' is-key' : '') + '"><dt>' + esc(r.label) + '</dt><dd data-r="' + r.id + '">—</dd></div>';
          }).join('') + '</dl></section>'
      : '';

    app.innerHTML =
      titleBlock +
      '<div class="sim-stage" id="sim-stage">' +
        '<div class="sim-view">' +
          '<div class="sim-canvas-wrap"' + (cfg.mobileAspect ? ' style="--mobile-aspect:' + esc(cfg.mobileAspect) + '"' : '') + '>' +
            '<canvas id="sim-canvas" role="img" aria-label="' + esc(cfg.ariaLabel || entry.title + ' simulation') + '"></canvas>' +
          '</div>' +
          '<div class="sim-status"><span class="led" aria-hidden="true"></span><span data-status>Paused</span></div>' +
        '</div>' +
        '<aside class="sim-panel" aria-label="Simulation controls">' +
          transportPanel + buttonsPanel + paramsPanel + readoutsPanel +
          '<div class="panel-actions">' +
            '<button class="btn full" type="button" data-act="defaults">' + icon('reset') + 'Reset to defaults</button>' +
          '</div>' +
          (hasTransport ? '<p class="shortcut-hint"><kbd>Space</kbd> play/pause · <kbd>R</kbd> restart · <kbd>→</kbd> step</p>' : '') +
        '</aside>' +
      '</div>' +
      (cfg.graph
        ? '<section class="card sim-graph-wrap" aria-label="' + esc(cfg.graph.title || 'Graph') + '">' +
            '<div class="graph-head"><h2>' + esc(cfg.graph.title || 'Graph') + '</h2><div class="sim-meta" id="graph-legend"></div></div>' +
            '<canvas class="sim-graph" id="sim-graph" role="img" aria-label="' + esc(cfg.graph.title || 'Live graph') + '"></canvas>' +
          '</section>'
        : '');

    sim.canvas = $('#sim-canvas');
    sim.ctx = sim.canvas.getContext('2d');
    sim.stage = $('#sim-stage');
    var statusEl = $('[data-status]'), statusWrap = $('.sim-status');
    var playBtn = $('[data-act="play"]');

    /* ---------- controls ---------- */
    var controlsEl = $('#sim-controls');
    var inputs = {};
    params.forEach(function (p) {
      var id = 'ctl-' + p.id, html;
      if (p.type === 'select') {
        html = '<div class="control"><div class="control-head"><label for="' + id + '">' + esc(p.label) + '</label></div>' +
          '<select class="input" id="' + id + '">' + p.options.map(function (o) {
            return '<option value="' + esc(o.value) + '">' + esc(o.label) + '</option>';
          }).join('') + '</select>' + (p.help ? '<span class="small muted">' + esc(p.help) + '</span>' : '') + '</div>';
      } else if (p.type === 'toggle') {
        html = '<div class="control"><label class="chip" style="justify-content:space-between;width:100%" for="' + id + '">' +
          '<span>' + esc(p.label) + '</span><input type="checkbox" id="' + id + '" style="width:20px;height:20px;accent-color:var(--accent)"></label></div>';
      } else {
        html = '<div class="control"><div class="control-head"><label for="' + id + '">' + esc(p.label) + '</label>' +
          '<output for="' + id + '" id="' + id + '-out"></output></div>' +
          '<input type="range" id="' + id + '" min="' + p.min + '" max="' + p.max + '" step="' + p.step + '">' +
          (p.presets ? '<div class="presets" role="group" aria-label="' + esc(p.label) + ' presets">' + p.presets.map(function (pr) {
            return '<button type="button" data-preset="' + pr.value + '">' + esc(pr.label) + '</button>';
          }).join('') + '</div>' : '') +
          (p.help ? '<span class="small muted">' + esc(p.help) + '</span>' : '') + '</div>';
      }
      var node = h(html);
      controlsEl.appendChild(node);
      inputs[p.id] = { p: p, el: $('#' + id, node), out: $('#' + id + '-out', node), node: node };

      var el = inputs[p.id].el;
      if (p.type === 'select') el.addEventListener('change', function () { setParam(p.id, coerce(p, el.value), true); });
      else if (p.type === 'toggle') el.addEventListener('change', function () { setParam(p.id, el.checked, true); });
      else {
        el.addEventListener('input', function () { setParam(p.id, parseFloat(el.value), true); });
        $$('[data-preset]', node).forEach(function (b) {
          b.addEventListener('click', function () { setParam(p.id, parseFloat(b.dataset.preset), true); });
        });
      }
    });

    function formatParam(p, v) {
      if (p.format) return p.format(v);
      return M.fmt(v, p.digits) + (p.unit ? ' ' + p.unit : '');
    }
    function syncInput(id) {
      var c = inputs[id]; if (!c) return;
      var p = c.p, v = sim.p[id];
      if (p.type === 'select') c.el.value = String(v);
      else if (p.type === 'toggle') c.el.checked = !!v;
      else {
        c.el.value = v;
        c.el.style.setProperty('--pct', ((v - p.min) / (p.max - p.min) * 100) + '%');
        c.out.textContent = formatParam(p, v);
        c.el.setAttribute('aria-valuetext', formatParam(p, v));
        $$('[data-preset]', c.node).forEach(function (b) { b.setAttribute('aria-pressed', String(Math.abs(parseFloat(b.dataset.preset) - v) < 1e-9)); });
      }
    }

    /**
     * Change a parameter. fromUser=true runs the sim's onParam hook
     * (default behaviour: restart the simulation with the new value).
     */
    function setParam(id, value, fromUser) {
      var p = inputs[id] && inputs[id].p;
      if (p && p.type === 'range') value = M.clamp(value, p.min, p.max);
      sim.p[id] = value;
      syncInput(id);
      if (fromUser) {
        var keep = cfg.onParam ? cfg.onParam(sim, id, value) : false;
        if (!keep) resetSim(true);
        saveUrlSoon();
      }
      requestRender();
    }
    sim.setParam = function (id, value, runHook) { setParam(id, value, !!runHook); saveUrlSoon(); };
    Object.keys(inputs).forEach(syncInput);

    /* ---------- extra buttons ---------- */
    (cfg.buttons || []).forEach(function (b, i) {
      $('[data-btn="' + i + '"]').addEventListener('click', function () { b.onClick(sim); requestRender(); });
    });

    /* ---------- graph ---------- */
    if (cfg.graph) {
      sim.graph = new Graph($('#sim-graph'), cfg.graph);
      var legend = $('#graph-legend');
      var legendColors = ['--sim-1', '--sim-2', '--sim-3', '--sim-4'];
      legend.innerHTML = (cfg.graph.series || []).map(function (s, i) {
        var col = s.color ? (s.color.indexOf('--') === 0 ? 'var(' + s.color + ')' : s.color) : 'var(' + legendColors[i % 4] + ')';
        return '<span class="badge"><span style="width:10px;height:3px;border-radius:2px;background:' + col + '"></span>' + esc(s.label) + '</span>';
      }).join('');
      // map '--sim-x' strings to palette keys used by Graph.draw
      (cfg.graph.series || []).forEach(function (s) {
        if (s.color && s.color.indexOf('--sim-') === 0) s.color = 's' + s.color.slice(6);
      });
    }

    /* ---------- lifecycle ---------- */
    var acc = 0, sampleAcc = 0, finished = false;
    var sampleDt = 1 / ((cfg.graph && cfg.graph.rate) || 30);
    var fixedDt = cfg.fixedDt || 1 / 240;

    function resetSim(keepRunning) {
      var wasRunning = sim.running;
      sim.time = 0; acc = 0; sampleAcc = 0; finished = false;
      if (sim.graph) sim.graph.clear();
      if (cfg.reset) cfg.reset(sim);
      if (sim.graph && cfg.sample) sim.graph.push(0, cfg.sample(sim));
      if (!keepRunning) setRunning(false);
      else setRunning(wasRunning);
      lastReadout = 0;
      requestRender();
    }
    sim.reset = function () { resetSim(true); };

    function advance(dt) {
      if (finished) return;
      acc += dt;
      var n = 0;
      while (acc >= fixedDt && n < 4000) {
        if (cfg.update) cfg.update(sim, fixedDt);
        sim.time += fixedDt; acc -= fixedDt; n++;
        if (sim.graph && cfg.sample) {
          sampleAcc += fixedDt;
          if (sampleAcc >= sampleDt) { sampleAcc -= sampleDt; sim.graph.push(sim.time, cfg.sample(sim)); }
        }
        if (cfg.finished && cfg.finished(sim)) {
          finished = true;
          if (sim.graph && cfg.sample) sim.graph.push(sim.time, cfg.sample(sim));
          setRunning(false);
          if (cfg.onFinish) cfg.onFinish(sim);
          break;
        }
      }
    }

    function setRunning(on) {
      sim.running = !!on;
      if (playBtn) {
        playBtn.innerHTML = on ? icon('pause') + '<span>Pause</span>' : icon('play') + '<span>' + esc(cfg.playLabel || 'Play') + '</span>';
        playBtn.setAttribute('aria-pressed', String(!!on));
      }
      statusWrap.classList.toggle('is-running', sim.running);
      if (cfg.onRunChange) cfg.onRunChange(sim, sim.running);
      if (on) { last = performance.now(); requestRender(); }
    }
    sim.play = function () {
      if (finished) resetSim(false);
      setRunning(true);
    };
    sim.pause = function () { setRunning(false); requestRender(); };
    sim.step = function () {
      if (finished) resetSim(false);
      if (sim.running) setRunning(false);
      advance(1 / 60 * sim.speed);
      requestRender();
    };

    /* ---------- render loop (only runs while needed) ---------- */
    var rafId = 0, last = performance.now(), lastReadout = 0;
    function requestRender() { if (!rafId) rafId = requestAnimationFrame(frame); }
    sim.redraw = requestRender;

    function frame(now) {
      rafId = 0;
      var dtReal = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (sim.running) advance(dtReal * sim.speed);
      render(now);
      if (sim.running || (cfg.animate && cfg.animate(sim))) requestRender();
    }

    function render(now) {
      var size = fitCanvas(sim.canvas, sim.ctx);
      sim.width = size.w; sim.height = size.h;
      if (cfg.draw) { sim.ctx.save(); cfg.draw(sim, now || performance.now()); sim.ctx.restore(); }
      if (sim.graph) sim.graph.draw(sim.colors);
      if (!now || now - lastReadout > 80 || !sim.running) { lastReadout = now || 0; updateReadouts(); }
    }

    function updateReadouts() {
      statusEl.textContent = cfg.status ? cfg.status(sim) : (sim.running ? 'Running' : 'Paused') + ' · t = ' + M.fmt(sim.time, 2) + ' s';
      if (!cfg.readout) return;
      var vals = cfg.readout(sim) || {};
      (cfg.readouts || []).forEach(function (r) {
        var el = $('[data-r="' + r.id + '"]');
        if (!el) return;
        var v = vals[r.id];
        var isText = typeof v === 'string';
        el.classList.toggle('is-text', isText);
        var txt = isText ? esc(v) : M.fmt(v, r.digits == null ? 2 : r.digits);
        el.innerHTML = txt + (r.unit && typeof v !== 'string' ? '<small>' + esc(r.unit) + '</small>' : '');
      });
    }

    /* ---------- canvas resize & theme ---------- */
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (cfg.resize) cfg.resize(sim); requestRender(); }).observe(sim.canvas);
    } else window.addEventListener('resize', requestRender);
    document.addEventListener('simlab:themechange', function () {
      requestAnimationFrame(function () { sim.colors = themeColors(); requestRender(); });
    });

    /* ---------- pointer input (mouse + touch + pen) ---------- */
    if (cfg.pointer) {
      var dragging = false;
      function pos(e) { var r = sim.canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      sim.canvas.addEventListener('pointerdown', function (e) {
        var p = pos(e);
        if (cfg.pointer.down && cfg.pointer.down(sim, p.x, p.y, e) !== false) {
          dragging = true;
          sim.canvas.setPointerCapture(e.pointerId);
          e.preventDefault();
        }
        requestRender();
      });
      sim.canvas.addEventListener('pointermove', function (e) {
        var p = pos(e);
        if (cfg.pointer.hover) sim.canvas.style.cursor = cfg.pointer.hover(sim, p.x, p.y) ? 'pointer' : '';
        if (!dragging) return;
        if (cfg.pointer.move) cfg.pointer.move(sim, p.x, p.y, e);
        requestRender();
      });
      function up(e) {
        if (!dragging) return;
        dragging = false;
        var p = pos(e);
        if (cfg.pointer.up) cfg.pointer.up(sim, p.x, p.y, e);
        requestRender();
      }
      sim.canvas.addEventListener('pointerup', up);
      sim.canvas.addEventListener('pointercancel', up);
    }

    /* ---------- toolbar actions ---------- */
    app.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'play') sim.running ? sim.pause() : sim.play();
      else if (act === 'step') sim.step();
      else if (act === 'reset') resetSim(true);
      else if (act === 'defaults') {
        params.forEach(function (p) { sim.p[p.id] = p.default; syncInput(p.id); });
        history.replaceState(null, '', location.pathname);
        if (cfg.onDefaults) cfg.onDefaults(sim);
        resetSim(false);
        if (cfg.autoplay && !ui.reduceMotion) setRunning(true);
        ui.toast('Reset to default settings');
      }
      else if (act === 'share') copyLink();
      else if (act === 'fullscreen') toggleFullscreen();
      else if (act === 'sound') Audio.setEnabled(!Audio.enabled);
    });
    $$('[data-speed]').forEach(function (b) {
      b.addEventListener('click', function () {
        sim.speed = parseFloat(b.dataset.speed);
        $$('[data-speed]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });

    // Sound toggle button state
    function syncSound(on) {
      var btn = $('[data-act="sound"]'); if (!btn) return;
      btn.setAttribute('aria-pressed', String(on));
      btn.innerHTML = icon(on ? 'sound' : 'mute') + '<span>' + (on ? 'Sound on' : 'Sound off') + '</span>';
      btn.classList.toggle('btn-primary', on);
      if (cfg.onSound) cfg.onSound(sim, on);
    }
    if (cfg.audio) {
      if (!Audio.supported()) { var sb = $('[data-act="sound"]'); if (sb) sb.hidden = true; }
      Audio.onChange(syncSound); syncSound(Audio.enabled);
    }

    /* ---------- share link (URL state) ---------- */
    var saveTimer;
    function currentUrl() {
      var q = buildQuery(params, sim.p);
      return location.origin + location.pathname + (q ? '?' + q : '');
    }
    function saveUrlSoon() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        if (params.length) history.replaceState(null, '', currentUrl().replace(location.origin, ''));
      }, 300);
    }
    function copyLink() {
      var url = currentUrl();
      history.replaceState(null, '', url.replace(location.origin, ''));
      function fallback() { window.prompt('Copy this link:', url); }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(function () { ui.toast('Link copied — it includes your current settings'); }, fallback);
      } else fallback();
    }

    /* ---------- fullscreen (real API, or CSS fallback for iPhone) ---------- */
    function toggleFullscreen() {
      var st = sim.stage;
      var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      if (st.classList.contains('is-pseudo-fs')) { setPseudo(false); return; }
      var req = st.requestFullscreen || st.webkitRequestFullscreen;
      if (req) {
        var r = req.call(st);
        if (r && r.catch) r.catch(function () { setPseudo(true); });
      } else setPseudo(true);
    }
    function setPseudo(on) {
      sim.stage.classList.toggle('is-pseudo-fs', on);
      document.body.style.overflow = on ? 'hidden' : '';
      var btn = $('[data-act="fullscreen"]');
      if (on && !$('.fs-close', sim.stage)) {
        var c = h('<button class="btn fs-close" type="button">' + icon('close') + 'Exit fullscreen</button>');
        c.addEventListener('click', function () { setPseudo(false); });
        sim.stage.insertBefore(c, sim.stage.firstChild);
      } else if (!on) { var x = $('.fs-close', sim.stage); if (x) x.remove(); }
      if (btn) btn.setAttribute('aria-pressed', String(on));
      requestRender();
    }
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      document.addEventListener(ev, function () {
        var on = !!(document.fullscreenElement || document.webkitFullscreenElement);
        var btn = $('[data-act="fullscreen"] span');
        if (btn) btn.textContent = on ? 'Exit fullscreen' : 'Fullscreen';
        requestRender();
      });
    });

    /* ---------- keyboard shortcuts ---------- */
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t.closest && t.closest('input, select, textarea, button, a, summary, [contenteditable="true"], .search-overlay')) return;
      if (e.key === 'Escape' && sim.stage.classList.contains('is-pseudo-fs')) { setPseudo(false); return; }
      if (!hasTransport) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); sim.running ? sim.pause() : sim.play(); }
      else if (e.key === 'r' || e.key === 'R') resetSim(true);
      else if (e.key === 'ArrowRight' || e.key === '.') { e.preventDefault(); sim.step(); }
    });

    /* ---------- pause audio when the page is hidden ---------- */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && sim.running && cfg.pauseWhenHidden !== false) { sim.pause(); sim._autoPaused = true; }
      else if (!document.hidden && sim._autoPaused) { sim._autoPaused = false; sim.play(); }
    });

    /* ---------- prev / next + related ---------- */
    buildSimFooter(entry);

    /* ---------- go! ---------- */
    if (cfg.setup) cfg.setup(sim);
    resetSim(false);
    if (cfg.autoplay && !ui.reduceMotion) setRunning(true);
    requestRender();
    S.current = sim; // handy for debugging in the console
    return sim;
  }

  /* =================================================================
     Prev / Next within the same branch + Related simulations
     ================================================================= */
  function buildSimFooter(entry) {
    var host = $('#sim-footer');
    if (!host || !entry.subject) return;
    var siblings = S.simulations.filter(function (s) { return s.subject === entry.subject && s.branch === entry.branch && S.isLive(s); });
    var i = siblings.findIndex(function (s) { return s.id === entry.id; });
    var prev = i > 0 ? siblings[i - 1] : null, next = i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null;

    var related = [];
    (entry.prerequisites || []).forEach(function (id) { var s = S.getSim(id); if (s && related.indexOf(s) === -1) related.push(s); });
    S.simulations.forEach(function (s) {
      if (s.id !== entry.id && s.subject === entry.subject && s.branch === entry.branch && related.indexOf(s) === -1) related.push(s);
    });
    related = related.filter(function (s) { return s.id !== entry.id; })
      .sort(function (a, b) { return (S.isLive(b) ? 1 : 0) - (S.isLive(a) ? 1 : 0); })
      .slice(0, 4);

    var html = '';
    if (prev || next) {
      html += '<nav class="sim-pager" aria-label="More simulations in this topic">' +
        (prev ? '<a class="pager-link prev" href="' + esc(prev.link) + '"><span class="k">← Previous</span><span class="t">' + esc(prev.title) + '</span></a>' : '<span class="pager-link is-empty"></span>') +
        (next ? '<a class="pager-link next" href="' + esc(next.link) + '"><span class="k">Next →</span><span class="t">' + esc(next.title) + '</span></a>' : '') +
        '</nav>';
    }
    if (related.length) {
      html += '<section class="section-tight" aria-labelledby="related-h"><div class="section-head"><h2 id="related-h">Related simulations</h2></div>' +
        '<div class="grid grid-auto">' + related.map(function (s) { return ui.simCard(s, { showSubject: false }); }).join('') + '</div></section>';
    }
    host.innerHTML = html;
  }

  /* =================================================================
     Public API
     ================================================================= */
  S.createSim = createSim;
  S.math = M;
  S.vec = V;
  S.draw = D;
  S.Graph = Graph;
  S.audio = Audio;
  S.fitCanvas = fitCanvas;
  S.themeColors = themeColors;
})();
