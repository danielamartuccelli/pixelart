/* ===========================================================
   audio.js — música PROCEDURAL (WebAudio), sin archivos de audio.
   No se usan canciones reales (derechos de autor): son composiciones
   originales "con el aire" de cada estilo que pidieron:
     lofi      -> tipo Luv(sic) de Nujabes (jazzy, tranquilo)
     reggaeton -> casa de Daniela (dembow)
     hiphop    -> casa de Sebas (boom-bap, onda Mac Miller)
     rock      -> Parque Kennedy (pop-punk, onda Olivia Rodrigo)
     urbano    -> El Pollo Pier (trap latino oscuro)
     salsa     -> Academia Saoco (clave, montuno, charanga)
     habanera / charanga -> canciones fácil / difícil del baile de Saoco
   =========================================================== */
(function () {
  const G = window.G;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  const STYLES = {
    lofi: { bpm: 76, swing: 0.16, wave: 'triangle', pad: 0.09, bassW: 'sine',
      chords: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 64]], roots: [45, 41, 43, 40],
      kick: [1,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0], snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], hat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
      bass: [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0], melody: true, vinyl: true },
    reggaeton: { bpm: 92, swing: 0, wave: 'square', pad: 0.035, bassW: 'sine',
      chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], roots: [45, 41, 36, 43],
      kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], snare: [0,0,0,1, 0,0,1,0, 0,0,0,1, 0,0,1,0], hat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
      bass: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0], stab: [0,0,0,1, 0,0,1,0, 0,0,0,1, 0,0,1,0], melody: true },
    hiphop: { bpm: 86, swing: 0.2, wave: 'triangle', pad: 0.1, bassW: 'sine',
      chords: [[60, 63, 67, 70], [56, 60, 63, 67], [58, 62, 65, 69], [55, 58, 62, 65]], roots: [48, 44, 46, 43],
      kick: [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0], snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1], hat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      bass: [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0], melody: true, vinyl: true },
    rock: { bpm: 128, swing: 0, wave: 'sawtooth', pad: 0.05, bassW: 'sawtooth',
      chords: [[48, 55, 60], [55, 62, 67], [57, 64, 69], [53, 60, 65]], roots: [36, 43, 45, 41],
      kick: [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0], snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], hat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      bass: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0], stab: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0], lp: 1800 },
    urbano: { bpm: 100, swing: 0, wave: 'sawtooth', pad: 0.03, bassW: 'sine',
      chords: [[57, 60, 64], [57, 60, 64], [53, 57, 60], [55, 59, 62]], roots: [33, 33, 29, 31],
      kick: [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,1], snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0], hat: [1,1,1,1, 1,0,1,1, 1,1,1,1, 1,0,1,1],
      bass: [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,1], long808: true, lp: 1200, melody: true },
    salsa: { bpm: 100, swing: 0, wave: 'triangle', pad: 0.05, bassW: 'sine',
      chords: [[57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65], [60, 64, 67, 71]], roots: [45, 50, 43, 48],
      kick: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], hat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      clave: [1,0,0,1, 0,0,1,0, 0,0,1,0, 1,0,0,0], conga: [0,0,0,0, 1,0,1,1, 0,0,0,0, 1,0,1,1],
      bass: [0,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,1], montuno: true, melody: true },
    /* canciones del baile de Saoco: fácil = habanera (lenta), normal = salsa, difícil = charanga (rápida) */
    habanera: { bpm: 88, swing: 0.06, wave: 'triangle', pad: 0.05, bassW: 'sine',
      chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [57, 60, 64]], roots: [45, 41, 43, 45],
      kick: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], hat: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
      clave: [1,0,0,1, 0,0,1,0, 0,0,0,0, 0,0,0,0], conga: [0,0,0,0, 1,0,1,0, 0,0,0,0, 1,0,1,0],
      bass: [1,0,0,1, 1,0,0,0, 1,0,0,1, 1,0,0,0], melody: true },
    charanga: { bpm: 116, swing: 0, wave: 'sine', pad: 0.045, bassW: 'sine',
      chords: [[60, 64, 67, 71], [65, 69, 72, 76], [67, 71, 74, 77], [60, 64, 67, 71]], roots: [48, 53, 43, 48],
      kick: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], hat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
      clave: [1,0,0,1, 0,0,1,0, 0,0,1,0, 1,0,0,0], conga: [0,0,1,0, 1,0,1,1, 0,0,1,0, 1,0,1,1],
      bass: [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,1], montuno: true, melody: true }
  };

  let ctx = null, master = null, noiseBuf = null, timer = null, style = 'lofi', step = 0, nextT = 0, started = false, lastId = 0;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function env(g, t, a, d, peak, end) {
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function tone(t, freq, dur, type, vol, lp, a) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = freq; f.type = 'lowpass'; f.frequency.value = lp || 2400;
    env(g, t, a || 0.01, dur, vol); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + dur + (a || 0.01) + 0.05);
  }
  function noise(t, dur, vol, hp, type) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = noiseBuf; f.type = type || 'highpass'; f.frequency.value = hp; env(g, t, 0.002, dur, vol);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  }
  function kick(t, vol) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12); env(g, t, 0.002, 0.16, vol); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25); }
  function snare(t, vol) { noise(t, 0.12, vol, 1800); tone(t, 190, 0.07, 'triangle', vol * 0.6); }
  function sweep(t, f0, f1, dur, vol, type) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6); env(g, t, 0.004, dur, vol); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }

  const SCALE = [0, 3, 5, 7, 10, 12, 15];   // pentatónica menor (melodía)

  function playStep(S, n, t) {
    const bar = Math.floor(n / 16) % 4, k = n % 16, ch = S.chords[bar], root = S.roots[bar];
    const sw = (k % 2 === 1) ? S.swing * (60 / S.bpm / 4) : 0; t += sw;
    const lp = S.lp || 2600;
    if (k === 0 && S.pad) ch.forEach((m, i) => tone(t, mtof(m + (S.wave === 'sawtooth' && S.stab ? 0 : 0)), 60 / S.bpm * 3.6, S.wave, S.pad, lp, 0.25));
    if (S.stab && S.stab[k]) ch.forEach(m => tone(t, mtof(m + 12), 0.14, S.wave === 'sawtooth' ? 'sawtooth' : 'square', S.wave === 'sawtooth' ? 0.05 : 0.03, lp));
    if (S.kick[k]) kick(t, 0.55);
    if (S.snare[k]) snare(t, 0.22);
    if (S.hat[k]) noise(t, 0.03, 0.06, 7000);
    if (S.clave && S.clave[k]) tone(t, 2300, 0.05, 'square', 0.05, 6000);
    if (S.conga && S.conga[k]) sweep(t, 330, 220, 0.12, 0.2, 'sine');
    if (S.bass[k]) {
      if (S.long808) sweep(t, mtof(root), mtof(root) * 0.98, 0.5, 0.45, 'sine');
      else tone(t, mtof(root), 0.28, S.bassW, S.bassW === 'sawtooth' ? 0.12 : 0.32, 700);
    }
    if (S.montuno && k % 2 === 0) { const m = ch[(k / 2) % ch.length] + 12; tone(t, mtof(m), 0.16, 'triangle', 0.09, 3000); }
    if (S.melody && (k === 0 || k === 6 || k === 10 || k === 14) && Math.random() < 0.55) {
      const m = root + 24 + SCALE[Math.floor(Math.random() * SCALE.length)];
      tone(t, mtof(m), 0.35, S.wave === 'sawtooth' ? 'triangle' : 'sine', 0.07, 2200, 0.02);
    }
  }

  function startLoop() {
    if (timer) return;
    nextT = ctx.currentTime + 0.1; step = 0;
    timer = setInterval(() => {
      if (!ctx) return;
      const S = STYLES[style] || STYLES.lofi, dt = 60 / S.bpm / 4, on = G.state.settings.music && !(G.local && G.slot === 1);   // misma laptop: solo suena la música de una copia
      // el reloj avanza aunque la música esté apagada (los juegos de ritmo dependen de él); solo se oye si está encendida
      while (nextT < ctx.currentTime + 0.25) { if (on) { try { playStep(S, step, nextT); } catch (e) { console.warn('audio', e); } } nextT += dt; step++; }
    }, 40);
  }

  function applyVol() {
    if (!master) return;
    const on = G.state.settings.music && !(G.local && G.slot === 1), v = on ? G.state.settings.vol * 0.55 : 0;
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(v, ctx.currentTime, 0.15);
  }

  G.audio = {
    /* llamar tras un click del usuario (los navegadores lo exigen) */
    start() { init(); if (!ctx) return; if (ctx.state === 'suspended') ctx.resume(); started = true; startLoop(); applyVol(); },
    setStyle(s) { if (!STYLES[s] || s === style) return; style = s; step = Math.ceil(step / 64) * 64; if (ctx) nextT = Math.max(nextT, ctx.currentTime + 0.05); },
    refresh: applyVol,
    /* posición actual de la música en "pasos" (semicorcheas). null si el audio no está corriendo. */
    clock() {
      if (!ctx || ctx.state !== 'running' || !timer) return null;
      const S = STYLES[style] || STYLES.lofi, dt = 60 / S.bpm / 4;
      return { step: step - (nextT - ctx.currentTime) / dt - (ctx.outputLatency || 0) / dt, dt, bpm: S.bpm };
    },
    bpmOf(st) { return (STYLES[st] || STYLES.lofi).bpm; },
    get style() { return style; },
    sfx(kind) {            // sonidos cortos de interfaz
      if (!ctx || !G.state.settings.music) return;
      const t = ctx.currentTime;
      if (kind === 'click') tone(t, 660, 0.06, 'square', 0.05, 3000);
      else if (kind === 'ok') { tone(t, 523, 0.08, 'square', 0.05, 3000); tone(t + 0.08, 784, 0.12, 'square', 0.05, 3000); }
      else if (kind === 'pop') sweep(t, 400, 900, 0.1, 0.08, 'sine');
      else if (kind === 'hit') { sweep(t, 320, 80, 0.2, 0.1, 'square'); }
      else if (kind === 'win') { [523, 659, 784, 1046].forEach((f, i) => tone(t + i * 0.1, f, 0.16, 'triangle', 0.08)); }
      else if (kind === 'heart') { tone(t, 784, 0.1, 'triangle', 0.08); tone(t + 0.1, 1046, 0.18, 'triangle', 0.08); }
    }
  };
  G.bus.on('settings', () => G.audio.refresh());
})();
