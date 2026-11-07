/* ===========================================================
   scenes/saoco.js — ETAPA 6 · Academia Saoco (Lince) · Baile de flechas con salsa
   Estilo "disco de Club Penguin" pero con salsa. Las flechas bajan y se pulsan al ritmo (← ↓ ↑ → o A S W D).
   - La música es PROCEDURAL y el baile se sincroniza con su reloj de pasos (G.audio.clock()).
   - Tres canciones/dificultades: Fácil = habanera, Normal = salsa, Difícil = charanga.
   - Modo SOLITARIO ("VS yo"): cada uno baila toda la canción contra su propio récord (sin soles).
   - Modo DUPLA: la canción va por FRASES de 2 compases. Si uno de los dos se equivoca (falla una flecha o
     pulsa mal), los DOS repiten la frase. Compiten contra dos duplas NPC (Los Rumberos y Las Pimienta).
   Red (modo dupla, el anfitrión manda): s_cfg · s_ready · s_go{seed} · s_ev{ph,att,k} (invitado→anfitrión) ·
   s_cmd{ph,att,kind} · s_stat · s_end ; modo solitario: s_sc (en vivo) y s_fin.
   Prueba solo: ?solo=1&me=sebas&go=salsa&smode=dupla&sdiff=normal&sauto=1  (la pareja es un bot)
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H, Q = new URLSearchParams(location.search), mg = G.mg;
  const OUTL = 0x2b1b30, DIR = ['l', 'd', 'u', 'r'], LCOL = [0xff7aa8, 0x6fbfff, 0x7fe08a, 0xffd24a], LX = [161, 187, 213, 239];
  const RY = 172, TOPY = 34, AHEAD = 14, PPS = (RY - TOPY) / AHEAD, PHL = 32;
  const SONGS = {
    facil:   { name: 'Habanera de Lince', style: 'habanera', np: 10, win: [0.095, 0.2], gap: 4, label: 'Fácil' },
    normal:  { name: 'Salsa Saoco',       style: 'salsa',    np: 12, win: [0.08, 0.16],  gap: 2, label: 'Normal' },
    dificil: { name: 'Charanga Ccelli',   style: 'charanga', np: 14, win: [0.07, 0.14],  gap: 1, label: 'Difícil' }
  };
  const NPC = [{ name: 'Los Rumberos', pr: { facil: 0.2, normal: 0.3, dificil: 0.4 } }, { name: 'Las Pimienta', pr: { facil: 0.3, normal: 0.4, dificil: 0.5 } }];
  const KEYMAP = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, KeyA: 0, KeyS: 1, KeyW: 2, KeyD: 3 };

  /* ---------- coreografía (idéntica en las dos laptops: sale de la semilla) ---------- */
  function makeChart(seed, diff) {
    const R = mg.rng((seed ^ 0x5a0c0) >>> 0), S = SONGS[diff], N = S.np, out = []; let prev = -1, rep = 0;
    for (let p = 0; p < N; p++) {
      const prog = N > 1 ? p / (N - 1) : 0; let offs = [0, 4, 8, 16, 20, 24];             // el paso básico: 1-2-3 (se descansa en el 4)
      const add = (o, pr) => { if (R() < pr) offs.push(o); };
      if (diff === 'normal') { [2, 6, 18, 22].forEach(o => add(o, 0.2 + 0.3 * prog)); [12, 28].forEach(o => add(o, 0.12 + 0.1 * prog)); }
      if (diff === 'dificil') { [2, 6, 10, 18, 22, 26].forEach(o => add(o, 0.45 + 0.3 * prog)); [12, 28].forEach(o => add(o, 0.45)); [1, 5, 9, 17, 21, 25].forEach(o => add(o, 0.15 + 0.15 * prog)); }
      offs = Array.from(new Set(offs)).sort((a, b) => a - b);
      const f = []; offs.forEach(o => { if (!f.length || o - f[f.length - 1] >= S.gap) f.push(o); });
      out.push(f.map(o => {
        let l = Math.floor(R() * 4); if (l === prev) { rep++; if (rep >= 2 || R() < 0.5) { l = (l + 1 + Math.floor(R() * 3)) % 4; rep = 0; } } else rep = 0;
        prev = l; return { off: o, lane: l };
      }));
    }
    return out;
  }

  /* ---------- texturas ---------- */
  function arrowPts(dir, pad) {
    const base = [[8, 0], [16, 8], [11, 8], [11, 16], [5, 16], [5, 8], [0, 8]], th = { u: 0, r: 90, d: 180, l: 270 }[dir] * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
    return base.map(([x, y]) => ({ x: pad + 8 + (x - 8) * c - (y - 8) * s, y: pad + 8 + (x - 8) * s + (y - 8) * c }));
  }
  function makeTextures(sc) {
    const mk = (key, w, h, fn) => { if (sc.textures.exists(key)) return; const g = sc.make.graphics({ x: 0, y: 0, add: false }); fn(g); g.generateTexture(key, w, h); g.destroy(); };
    DIR.forEach((d, i) => {
      mk('sa_' + d, 18, 18, g => { const p = arrowPts(d, 1); g.fillStyle(LCOL[i]).fillPoints(p, true); g.lineStyle(1.5, OUTL).strokePoints(p, true); g.fillStyle(0xffffff, 0.55).fillRect(7, 3, 3, 2); });
      mk('sr_' + d, 18, 18, g => { const p = arrowPts(d, 1); g.fillStyle(0x1b1230, 0.85).fillPoints(p, true); g.lineStyle(1.5, LCOL[i]).strokePoints(p, true); });
    });
  }
  function makeNpcTextures(sc) {
    const ad = { textures: sc.textures }, mkLook = (id, hair, hc, top, tc, bot, bc) => {
      const g = G.defaultLook(id); g.hair = { style: hair, color: hc }; g.glasses = { type: 'none' };
      g.outfit = { top: { style: top, color: tc }, bottom: { style: bot, color: bc }, shoes: { type: 'sneaker', color: '#fffaf0' } }; g.acc = { hat: 'none', scarf: 'none', backpack: false }; return g;
    };
    const L = [mkLook('sebas', 'muyCorto', '#1b1618', 'shirt', '#e63946', 'pants', '#1b1f2e'), mkLook('dani', 'bob', '#d4a04a', 'tee', '#ffd24a', 'pants', '#3d4a63'),
      mkLook('sebas', 'muyCorto', '#6b3a1c', 'shirt', '#3a86ff', 'pants', '#2b2b3a'), mkLook('dani', 'bob', '#2b1b30', 'tee', '#7fe08a', 'pants', '#5a3a6a')];
    L.forEach((l, i) => { try { G.makeCharTexture(ad, 'npc_dance' + i, l); } catch (e) { console.warn('npc tex', e); } });
  }

  /* ================= ESCENA ================= */
  class SaocoScene extends Phaser.Scene {
    constructor() { super('saoco'); }
    create() {
      A.emoteTextures(this.game); G.refreshTextures(); makeTextures(this); makeNpcTextures(this);
      this.phase = 'lobby'; this.mode = Q.get('smode') === 'dupla' ? 'dupla' : 'solo'; this.diff = SONGS[Q.get('sdiff')] ? Q.get('sdiff') : 'normal';
      this.ready = { me: false, partner: false }; this.ui = []; this.notes = []; this.over = false; this.stat = {}; this.partnerFin = null; this.oppScore = 0; this.resolved = false;
      this.bt = 0; this.lastT = performance.now(); this.dtStep = 0.15; this.flash = [0, 0, 0, 0]; this.jump = 0; this.pop = { t: 0, txt: '', col: '#fff' };
      this.isHost = () => G.solo || G.net.role === 'host';
      this.setupInput(); this.drawStage(); this.makeActors();
      mg.bind(this, [['s_cfg', d => { if (this.phase === 'lobby') { this.mode = d.mode; this.diff = d.diff; this.applySong(); this.drawLobby(); } }],
        ['s_ready', d => { this.ready.partner = !!d.r; if (this.phase === 'lobby') { this.drawLobby(); this.tryStart(); } }],
        ['s_go', d => { if (this.phase === 'lobby') this.beginMatch(d.seed, d.mode, d.diff); }],
        ['s_ev', d => { if (this.isHost()) this.hostEv(d, G.state.partner.id); }], ['s_cmd', d => this.onCmd(d)], ['s_stat', d => { this.stat[d.who] = d.k; }],
        ['s_end', d => this.showDuoOver(d)], ['s_sc', d => { this.oppScore = d.s; }], ['s_fin', d => this.onPartnerFin(d)], ['s_again', () => this.scene.restart()]]);
      this.applySong(); this.drawLobby(); this.sendCfg();
      this.time.addEvent({ delay: 1200, loop: true, callback: () => { if (this.phase === 'lobby') { if (this.isHost()) this.sendCfg(); mg.send('s_ready', { r: this.ready.me }); } } });
      this.events.once('shutdown', () => { this.keyH && this.input.keyboard.off('keydown', this.keyH); });
      if (G.solo && Q.get('sauto') === '1') this.time.delayedCall(600, () => { this.ready.me = true; this.tryStart(); });
    }
    sendCfg() { mg.send('s_cfg', { mode: this.mode, diff: this.diff }); }
    applySong() { G.audio.setStyle(SONGS[this.diff].style); }

    setupInput() {
      this.keyH = ev => {
        if (G.typing || G.modalOpen || ev.repeat) return;
        const l = KEYMAP[ev.code]; if (l !== undefined) { this.pressLane(l); return; }
        if (ev.code === 'Escape' && (this.phase === 'lobby' || this.phase === 'over')) G.flow.openMap();
      };
      this.input.keyboard.on('keydown', this.keyH);
    }

    /* ---------- escenario ---------- */
    drawStage() {
      const g = this.add.graphics().setDepth(0);
      A.bands(g, 0, 0, W, 88, [0x3a1456, 0x5a1f6a, 0x8a2f6a], 4);
      // espejos a los lados (el centro queda libre para las flechas) y letrero de neón a la izquierda
      [[274, 62], [334, 62]].forEach(([x, y]) => { g.fillStyle(OUTL).fillRect(x - 1, y - 1, 54, 24).fillStyle(0x7a5aa8, 0.8).fillRect(x, y, 52, 22).fillStyle(0xffffff, 0.16).fillRect(x + 6, y, 5, 22).fillRect(x + 16, y, 2, 22); });
      g.fillStyle(0x1b1230).fillRoundedRect(8, 46, 128, 40, 6).lineStyle(2, 0xff7aa8).strokeRoundedRect(8, 46, 128, 40, 6).lineStyle(1, 0xffd24a).strokeRoundedRect(12, 50, 120, 32, 4);
      A.text(this, 72, 58, 'ACADEMIA', 11, '#ffd1e0', { strokeThickness: 1 }).setDepth(1);
      A.text(this, 72, 73, 'SAOCO', 18, '#ffd24a', { stroke: '#8a2f4a', strokeThickness: 2 }).setDepth(1);
      g.fillStyle(0x2a1040).fillRect(0, 88, W, 3);
      this.floor = this.add.graphics().setDepth(1);
      this.lanesG = this.add.graphics().setDepth(2); this.hitG = this.add.graphics().setDepth(3);
      this.rec = DIR.map((d, i) => this.add.image(LX[i], RY, 'sr_' + d).setDepth(4));
      this.pool = []; for (let k = 0; k < 28; k++) this.pool.push(this.add.image(0, 0, 'sa_l').setVisible(false).setDepth(5));
      const t = (x, y, s, c, o) => this.add.text(x, y, s, Object.assign({ fontFamily: 'VT323', fontSize: '14px', color: c || '#ffffff', stroke: '#2b1b30', strokeThickness: 3 }, o || {})).setDepth(5000);
      this.hSong = t(6, 30, '', '#ffd1e0', { fontSize: '12px' }); this.hScore = t(394, 30, '', '#ffd24a', { fontSize: '16px' }).setOrigin(1, 0);
      this.hSub = t(394, 48, '', '#bfeaff', { fontSize: '12px' }).setOrigin(1, 0); this.hCombo = A.text(this, 200, 190, '', 16, '#ffffff').setDepth(5000);
      this.hPop = A.text(this, 200, 78, '', 20, '#ffffff').setDepth(5000); this.hBanner = A.text(this, 200, 62, '', 14, '#ffffff').setDepth(5000);
      this.hSt = [t(72, 121, '', '#ffffff', { fontSize: '12px' }).setOrigin(0.5), t(328, 121, '', '#ffffff', { fontSize: '12px' }).setOrigin(0.5)];
      this.rows = [0, 1, 2].map(i => t(394, 30 + i * 12, '', '#ffffff', { fontSize: '12px' }).setOrigin(1, 0));
      this.barG = this.add.graphics().setDepth(5000);
      this.setHud(false);
    }
    setHud(v) { [this.hSong, this.hScore, this.hSub, this.hCombo, this.hPop, this.hBanner, this.barG].forEach(o => o.setVisible(v)); this.hSt.forEach(o => o.setVisible(v)); this.rows.forEach(o => o.setVisible(v)); }
    makeActors() {
      const mk = (who, x) => {
        const s = this.add.sprite(x, 192, 'char_' + who, 'd0').setOrigin(0.5, 1).setScale(2).setDepth(10);
        const sh = this.add.ellipse(x, 191, 30, 8, 0x000000, 0.3).setDepth(9);
        const n = this.add.text(x, 108, (G.state[who === 'me' ? 'me' : 'partner'].name || ''), { fontFamily: 'VT323', fontSize: '13px', color: '#ffffff', stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0.5).setDepth(11);
        return { spr: s, sh, name: n, x, j: 0 };
      };
      this.dm = mk('me', 72); this.dp = mk('partner', 328);
      this.npcs = [[110, 110, 'npc_dance0'], [128, 110, 'npc_dance1'], [270, 110, 'npc_dance2'], [288, 110, 'npc_dance3']].map(([x, y, k], i) => ({ spr: this.add.sprite(x, y + 30, k, 'd0').setOrigin(0.5, 1).setDepth(6).setVisible(false), x, y: y + 30 }));
    }

    /* ---------- reloj de la música ---------- */
    advanceClock(dt) {
      this.dtStep = 60 / G.audio.bpmOf(SONGS[this.diff].style) / 4; this.bt += dt / this.dtStep;
      const a = G.audio.clock(); if (a && Math.abs(a.dt - this.dtStep) < 1e-6) { const err = a.step + this.offMs() / 1000 / this.dtStep - this.bt; if (Math.abs(err) > 6) this.bt = a.step; else this.bt += err * 0.12; }
      this.lastT = performance.now();
    }
    offMs() { return +(G.state.settings.danceOff || 0); }
    curBt() { return this.bt + Math.min(0.03, (performance.now() - this.lastT) / 1000) / this.dtStep; }
    barAfter(extra) { return Math.ceil((this.bt + extra) / 16) * 16; }

    /* ---------- lobby ---------- */
    drawLobby() {
      this.ui.forEach(o => o.destroy()); this.ui = []; if (this.phase !== 'lobby') return;
      const add = o => { this.ui.push(o); return o; }, D = 9000, T = (x, y, t, c, fs, o) => add(this.add.text(x, y, t, Object.assign({ fontFamily: 'VT323', fontSize: (fs || 12) + 'px', color: c || '#fff3d6' }, o || {})).setOrigin(0.5, 0).setDepth(D + 1));
      mg.panel(this, add, 28, 24, 344, 174, D);
      add(A.text(this, 200, 38, '💃 ACADEMIA SAOCO · CLASE DE SALSA', 15, '#ffd24a').setDepth(D + 1));
      T(200, 48, this.mode === 'solo' ? 'SOLITARIO (VS yo): cada uno baila la canción entera e intenta superar su PROPIO récord.'
        : 'DUPLA: por frases. Si uno se equivoca, ¡los DOS repiten! Compitan contra Los Rumberos y Las Pimienta.', '#fff3d6', 12, { align: 'center', lineSpacing: -2, wordWrap: { width: 316 } });
      T(200, 74, 'Flechas ← ↓ ↑ → (o A S W D) cuando lleguen al círculo', '#9fe0cf');
      T(200, 86, 'Modo:', '#ffffff');
      [['solo', 'Solitario (VS yo)'], ['dupla', 'Dupla (los dos)']].forEach(([k, t], i) => mg.btn(this, add, 140 + i * 120, 107, 112, 18, t, this.mode === k ? 0xffd24a : 0xbfeaff, () => { this.mode = k; this.sendCfg(); this.drawLobby(); }, D, 13));
      T(200, 119, 'Canción / dificultad:', '#ffffff');
      Object.keys(SONGS).forEach((k, i) => mg.btn(this, add, 96 + i * 104, 140, 100, 18, SONGS[k].label + ' · ' + SONGS[k].name.split(' ')[0], this.diff === k ? 0xffd24a : 0xbfeaff, () => { this.diff = k; this.applySong(); this.sendCfg(); this.drawLobby(); }, D, 12));
      // ajuste fino de sincronía (guardado en el navegador)
      T(96, 156, 'Ajuste de ritmo:', '#9fe0cf', 12);
      const adj = d => { G.state.settings.danceOff = Math.max(-300, Math.min(300, this.offMs() + d)); G.save(); this.drawLobby(); };
      mg.btn(this, add, 160, 163, 20, 13, '−', 0xbfeaff, () => adj(-20), D, 14);
      T(190, 156, this.offMs() + ' ms', '#ffffff', 13);
      mg.btn(this, add, 222, 163, 20, 13, '+', 0xbfeaff, () => adj(20), D, 14);
      T(306, 157, '− atrasa · + adelanta', '#ffd1e0', 11);
      const nm = G.state.me.name || 'Tú', pn = G.state.partner.name || 'Pareja';
      mg.btn(this, add, 110, 184, 104, 20, this.ready.me ? '✔ ¡Listo!' : '¡Estoy listo!', this.ready.me ? 0x7fd1ae : 0xff7aa8, () => { this.ready.me = !this.ready.me; mg.send('s_ready', { r: this.ready.me }); this.drawLobby(); this.tryStart(); }, D);
      add(this.add.text(172, 176, (G.solo ? pn + ' (bot) 🤖: listo' : pn + (this.ready.partner ? ': ✔ listo' : ': esperando…')) + '\n' + nm + (this.ready.me ? ': ✔ listo' : ''), { fontFamily: 'VT323', fontSize: '12px', color: '#fff3d6', lineSpacing: -1 }).setOrigin(0, 0).setDepth(D + 1));
      mg.btn(this, add, 334, 184, 62, 20, '◀ Mapa', 0xffffff, () => G.flow.openMap(), D, 13);
    }
    tryStart() {
      if (this.phase !== 'lobby' || !this.ready.me) return;
      if (G.solo) { this.beginMatch(Math.floor(Math.random() * 2 ** 31), this.mode, this.diff); return; }
      if (this.ready.partner && G.net.role === 'host') { const seed = Math.floor(Math.random() * 2 ** 31); mg.send('s_go', { seed, mode: this.mode, diff: this.diff }); this.beginMatch(seed, this.mode, this.diff); }
    }

    /* ---------- inicio de la partida ---------- */
    beginMatch(seed, mode, diff) {
      this.ui.forEach(o => o.destroy()); this.ui = []; this.mode = mode; this.diff = diff; this.seed = seed; this.applySong();
      this.chart = makeChart(seed, diff); this.win = SONGS[diff].win; this.notes = []; this.over = false; this.resolved = false; this.partnerFin = null; this.oppScore = 0; this.stat = {};
      this.score = 0; this.combo = 0; this.maxCombo = 0; this.st = { perfect: 0, good: 0, miss: 0, wrong: 0 };
      this.myBest = (G.state.records.best['salsa_' + diff] || {})[G.state.me.id] || 0;
      this.setHud(true); this.npcs.forEach(n => n.spr.setVisible(mode === 'dupla'));
      this.dtStep = 60 / G.audio.bpmOf(SONGS[diff].style) / 4; const a = G.audio.clock(); if (a) this.bt = a.step; this.lastT = performance.now();
      if (mode === 'solo') {
        this.S0 = this.barAfter(40); this.lastStep = this.S0 + (this.chart.length - 1) * PHL + Math.max(...this.chart[this.chart.length - 1].map(n => n.off));
        this.chart.forEach((ph, p) => ph.forEach(n => this.notes.push({ step: this.S0 + p * PHL + n.off, lane: n.lane, done: false, res: null, ph: p })));
        this.phase = 'dance'; this.say('¡Prepárate! Empieza en 4 tiempos…', 3);
        if (G.solo) this.bot = { target: { facil: 7500, normal: 11000, dificil: 14500 }[diff] * (0.8 + 0.4 * Math.random()) };
      } else {
        this.ph = 0; this.att = 0; this.retries = 0; this.phDone = 0; this.duoPts = 0; this.phr = null; this.pendCmd = null;
        const R2 = mg.rng((seed ^ 0xbeef) >>> 0); this.npcPer = NPC.map(n => this.chart.map(() => { let r = 0; while (R2() < n.pr[diff] && r < 4) r++; return Math.max(20, 100 - 25 * r) + Math.round(20 * (0.5 + R2() * 0.45)); }));
        this.phase = 'dance'; this.say('¡Prepárense! Si uno se equivoca, ¡los dos repiten!', 3);
        if (this.isHost()) this.time.delayedCall(900, () => this.hostCmd('go'));
      }
      G.audio.sfx('ok');
    }
    say(t, s) { this.banner = t; this.bannerT = s || 0; }

    /* ---------- entrada ---------- */
    pressLane(l) {
      if (this.phase !== 'dance') return; this.flash[l] = 0.14;
      const bt = this.curBt(), dts = this.dtStep, gw = this.win[1], pw = this.win[0]; let best = null, bd = 1e9, other = false;
      this.notes.forEach(n => { if (n.done) return; const d = Math.abs(n.step - bt) * dts; if (d > gw) return; if (n.lane === l) { if (d < bd) { bd = d; best = n; } } else other = true; });
      if (best) { best.done = true; best.res = bd <= pw ? 'perfect' : 'good'; this.onHit(best); }
      else if (other) this.onWrong();
    }
    onHit(n) {
      const perfect = n.res === 'perfect'; this.st[n.res]++; this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.score += Math.round((perfect ? 100 : 60) * (1 + Math.min(4, Math.floor(this.combo / 10)) * 0.25));
      this.popup(perfect ? '¡PERFECTO!' : 'Bien', perfect ? '#ffd24a' : '#bfeaff'); this.jump = perfect ? 1 : 0.5; G.audio.sfx(perfect ? 'ok' : 'pop');
      this.hitFx(n.lane, perfect);
    }
    hitFx(l, perfect) { const g = this.hitG; this.fx = this.fx || []; this.fx.push({ l, t: 0.25, c: perfect ? 0xffd24a : 0xbfeaff }); }
    onMiss(n) {
      this.st.miss++; this.combo = 0; this.popup('Fallaste', '#ff7a7a'); G.audio.sfx('hit');
      if (this.mode === 'dupla') this.phraseFail();
    }
    onWrong() {
      this.st.wrong++; this.combo = 0; this.popup('¡Flecha equivocada!', '#ff7a7a'); G.audio.sfx('hit');
      if (this.mode === 'dupla') this.phraseFail();
    }
    popup(t, c) { this.pop = { t: 0.7, txt: t, col: c }; }

    /* ---------- bucle ---------- */
    update(time, dtMs) {
      const dt = Math.min(0.05, dtMs / 1000); this.advanceClock(dt);
      if (this.phase === 'dance') this.dance(dt);
      this.render(time, dt);
    }
    dance(dt) {
      const bt = this.bt, gw = this.win[1], dts = this.dtStep;
      if (this.bannerT > 0) { this.bannerT -= dt; if (this.bannerT <= 0) this.banner = ''; }
      this.notes.forEach(n => { if (!n.done && (bt - n.step) * dts > gw) { n.done = true; n.res = 'miss'; this.onMiss(n); } });
      if (this.mode === 'solo') {
        this.sendT = (this.sendT || 0) + dt; if (this.sendT >= 1) { this.sendT = 0; mg.send('s_sc', { s: this.score }); }
        if (this.bot) { const f = Math.max(0, Math.min(1, (bt - this.S0) / (this.lastStep - this.S0))); this.oppScore = Math.round(this.bot.target * f); }
        if (bt > this.lastStep + 10) this.finishSolo();
      } else if (this.phr && !this.phr.reported && !this.phr.failed) {
        const last = this.phr.last;
        if (this.notes.every(n => n.done) && bt >= last + 2) this.reportDone();
      }
    }

    /* ---------- modo solitario: final ---------- */
    finishSolo() {
      if (this.phase !== 'dance') return; this.phase = 'over'; this.notes = [];
      const my = G.state.me.id, o = { score: this.score, perfect: this.st.perfect, good: this.st.good, miss: this.st.miss + this.st.wrong, combo: this.maxCombo };
      this.mine = o; mg.send('s_fin', o);
      if (G.solo) { this.partnerFin = { score: Math.round(this.bot.target * (0.92 + 0.16 * Math.random())), perfect: 0, good: 0, miss: 0, combo: 0 }; this.hostSaveBest(G.state.partner.id, this.partnerFin.score); }
      if (this.isHost()) this.hostSaveBest(my, o.score);
      this.isNewBest = o.score > this.myBest; G.audio.sfx('win'); this.showSoloOver();
    }
    onPartnerFin(d) { this.partnerFin = d; if (this.isHost() && this.mode === 'solo') this.hostSaveBest(G.state.partner.id, d.score); if (this.phase === 'over' && this.mode === 'solo') this.showSoloOver(); }
    hostSaveBest(id, score) { if (this.mode === 'solo') G.recordBest('salsa_' + this.diff, id, score); }
    showSoloOver() {
      this.ui.forEach(o => o.destroy()); this.ui = []; this.setHud(false); this.npcs.forEach(n => n.spr.setVisible(false));
      const add = o => { this.ui.push(o); return o; }, D = 9500, o = this.mine, pf = this.partnerFin, S = SONGS[this.diff];
      mg.panel(this, add, 48, 28, 304, 168, D);
      add(A.text(this, 200, 46, '💃 ¡TERMINÓ LA CLASE!', 17, '#ffd24a').setDepth(D + 1));
      add(this.add.text(200, 62, S.name + ' · ' + S.label, { fontFamily: 'VT323', fontSize: '12px', color: '#ffd1e0' }).setOrigin(0.5, 0).setDepth(D + 1));
      add(this.add.text(200, 82, G.state.me.name + ': ' + o.score + ' pts', { fontFamily: 'VT323', fontSize: '20px', color: '#fff3d6' }).setOrigin(0.5, 0).setDepth(D + 1));
      add(this.add.text(200, 104, '¡Perfectos ' + o.perfect + ' · Bien ' + o.good + ' · Fallos ' + o.miss + ' · Mejor combo ' + o.combo, { fontFamily: 'VT323', fontSize: '13px', color: '#9fe0cf' }).setOrigin(0.5, 0).setDepth(D + 1));
      add(this.add.text(200, 120, this.isNewBest ? '🏅 ¡NUEVO RÉCORD PERSONAL! (antes ' + this.myBest + ')' : 'Tu récord: ' + Math.max(this.myBest, 0) + (this.myBest ? ' — ¡a superarte!' : ''), { fontFamily: 'VT323', fontSize: '14px', color: this.isNewBest ? '#ffd24a' : '#ffd1e0' }).setOrigin(0.5, 0).setDepth(D + 1));
      add(this.add.text(200, 138, (G.state.partner.name || 'Pareja') + ': ' + (pf ? pf.score + ' pts' : 'todavía bailando…'), { fontFamily: 'VT323', fontSize: '14px', color: '#bfeaff' }).setOrigin(0.5, 0).setDepth(D + 1));
      mg.btn(this, add, 148, 172, 92, 22, '↻ Otra vez', 0xffd24a, () => { mg.send('s_again', {}); this.scene.restart(); }, D);
      mg.btn(this, add, 252, 172, 92, 22, '◀ Al mapa', 0xff7aa8, () => G.flow.openMap(), D);
    }

    /* ---------- modo dupla: frases ---------- */
    startPhrase(ph, att) {
      this.ph = ph; this.att = att; const S = this.barAfter(AHEAD + 2), notes = this.chart[ph];
      this.notes = notes.map(n => ({ step: S + n.off, lane: n.lane, done: false, res: null, ph }));
      this.phr = { S, last: S + Math.max(...notes.map(n => n.off)), reported: false, failed: false, ph, att }; this.stat[G.state.me.id] = 'run'; this.combo = 0;
      this.st.perfect0 = this.st.perfect; this.st.good0 = this.st.good;
      this.say('Frase ' + (ph + 1) + '/' + this.chart.length + (att ? ' · intento ' + (att + 1) : ''), 2.4);
      if (G.solo && this.isHost()) this.botPhrase(ph, att);
    }
    phraseFail() {
      if (!this.phr || this.phr.failed || this.phr.reported) return; this.phr.failed = true; this.notes = []; this.stat[G.state.me.id] = 'fail';
      this.say('¡Ups! Otra vez…', 2); this.sendEv('fail');
    }
    reportDone() {
      if (!this.phr || this.phr.reported) return; this.phr.reported = true; this.stat[G.state.me.id] = 'done';
      const n = this.chart[this.ph].length, pf = Math.min(1, (this.st.perfect - (this.st.perfect0 || 0)) / Math.max(1, n));
      this.say('¡Listo! Esperando a ' + (G.state.partner.name || 'tu pareja') + '…', 3); this.sendEv('done', pf);
    }
    sendEv(k, pf) {
      const e = { ph: this.ph, att: this.att, k, pf: pf || 0 };
      if (this.isHost()) this.hostEv(e, G.state.me.id); else mg.send('s_ev', e);
    }
    /* el anfitrión es el árbitro: cuenta intentos, puntos y manda el siguiente paso */
    hostEv(e, from) {
      if (this.phase !== 'dance' || this.mode !== 'dupla' || e.ph !== this.ph || e.att !== this.att) return;
      this.stat[from] = e.k; mg.send('s_stat', { who: from, k: e.k });
      if (e.k === 'fail') { this.doneBy = {}; this.retries++; this.att++; this.hostCmd('retry'); return; }
      this.doneBy = this.doneBy || {}; this.doneBy[from] = e.pf; const my = G.state.me.id, pi = G.state.partner.id;
      if (this.doneBy[my] === undefined || this.doneBy[pi] === undefined) return;
      const q = (this.doneBy[my] + this.doneBy[pi]) / 2; this.duoPts += Math.max(20, 100 - 25 * this.retries) + Math.round(20 * q);
      this.doneBy = {}; this.phDone = this.ph + 1; this.ph++; this.att = 0; this.retries = 0;
      if (this.ph >= this.chart.length) this.hostEnd(); else this.hostCmd('go');
    }
    hostCmd(kind) {
      const m = { ph: this.ph, att: this.att, kind, pts: this.duoPts, done: this.phDone }; mg.send('s_cmd', m); this.onCmd(m);
    }
    onCmd(m) {
      if (this.phase !== 'dance' || this.mode !== 'dupla') return;
      if (this.cmdTimer) { this.cmdTimer.remove(false); this.cmdTimer = null; }
      this.ph = m.ph; this.att = m.att; this.duoPts = m.pts; this.phDone = m.done; this.notes = []; this.phr = null; this.doneBy = this.doneBy || {};
      this.stat = {}; this.combo = 0;
      if (m.kind === 'retry') { this.say('¡Los dos repiten la frase!', 1.6); G.audio.sfx('hit'); }
      this.cmdTimer = this.time.delayedCall(m.kind === 'retry' ? 1300 : 700, () => { this.cmdTimer = null; if (this.phase === 'dance') this.startPhrase(m.ph, m.att); });
    }
    standings() {
      const done = this.phDone || 0, rows = [{ name: this.duoName(), pts: this.duoPts, me: true }];
      NPC.forEach((n, k) => rows.push({ name: n.name, pts: this.npcPer[k].slice(0, done).reduce((a, b) => a + b, 0) }));
      return rows.sort((a, b) => b.pts - a.pts);
    }
    duoName() { const a = G.state.me.name || 'Tú', b = G.state.partner.name || 'Pareja'; return a + ' y ' + b; }
    hostEnd() {
      const d = { pts: this.duoPts, done: this.chart.length, retries: 0, seed: this.seed }; mg.send('s_end', d); this.showDuoOver(d);
    }
    showDuoOver(d) {
      if (this.over) return; this.over = true; this.phase = 'over'; this.duoPts = d.pts; this.phDone = d.done; this.notes = []; this.phr = null;
      if (this.cmdTimer) { this.cmdTimer.remove(false); this.cmdTimer = null; }
      this.ui.forEach(o => o.destroy()); this.ui = []; this.setHud(false); this.npcs.forEach(n => n.spr.setVisible(false));
      const rows = this.standings(), rank = rows.findIndex(r => r.me) + 1;
      if (this.isHost() && rank === 1) { G.recordWin('salsa', 'dani', d.pts); G.recordWin('salsa', 'sebas', d.pts); }
      G.audio.sfx(rank === 1 ? 'win' : 'ok');
      const add = o => { this.ui.push(o); return o; }, D = 9500, medal = ['🥇', '🥈', '🥉'];
      mg.panel(this, add, 48, 28, 304, 168, D);
      add(A.text(this, 200, 46, rank === 1 ? '🏆 ¡PRIMER LUGAR!' : rank === 2 ? '¡SEGUNDO LUGAR!' : '¡TERCER LUGAR!', 17, '#ffd24a').setDepth(D + 1));
      add(this.add.text(200, 62, SONGS[this.diff].name + ' · ' + SONGS[this.diff].label, { fontFamily: 'VT323', fontSize: '12px', color: '#ffd1e0' }).setOrigin(0.5, 0).setDepth(D + 1));
      rows.forEach((r, i) => add(this.add.text(200, 84 + i * 18, medal[i] + ' ' + r.name + ' — ' + r.pts + ' pts', { fontFamily: 'VT323', fontSize: '15px', color: r.me ? '#ffd24a' : '#fff3d6' }).setOrigin(0.5, 0).setDepth(D + 1)));
      add(this.add.text(200, 142, rank === 1 ? '¡Récord guardado para los dos! 💜' : 'Menos repeticiones y más perfectos = más puntos', { fontFamily: 'VT323', fontSize: '13px', color: '#9fe0cf' }).setOrigin(0.5, 0).setDepth(D + 1));
      mg.btn(this, add, 148, 172, 92, 22, '↻ Otra vez', 0xffd24a, () => { mg.send('s_again', {}); this.scene.restart(); }, D);
      mg.btn(this, add, 252, 172, 92, 22, '◀ Al mapa', 0xff7aa8, () => G.flow.openMap(), D);
    }
    /* pareja simulada (solo modo de prueba) */
    botPhrase(ph, att) {
      if (this.botTimer) this.botTimer.remove(false);
      const fp = { facil: 0.08, normal: 0.18, dificil: 0.3 }[this.diff], fail = Math.random() < fp, dur = (PHL + AHEAD + 8) * this.dtStep * 1000;
      this.botTimer = this.time.delayedCall(fail ? dur * (0.3 + Math.random() * 0.4) : dur, () => { this.botTimer = null; if (this.phase === 'dance') this.hostEv({ ph, att, k: fail ? 'fail' : 'done', pf: 0.6 + Math.random() * 0.35 }, G.state.partner.id); });
    }

    /* ---------- dibujo por cuadro ---------- */
    render(time, dt) {
      const bt = this.bt, beat = Math.floor(bt / 4), pulse = 1 - (bt % 4) / 4, f = this.floor; f.clear();
      const pal = [0xff7aa8, 0x6fbfff, 0xffd24a, 0x7fe08a, 0xb48aff];
      for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) { const k = (c + r + beat) % 5, on = (c + r * 2 + beat) % 3 === 0; f.fillStyle(pal[k], on ? 0.55 + 0.4 * pulse : 0.3).fillRect(c * 40, 91 + r * 23, 39, 22); }
      // carriles
      const lg = this.lanesG; lg.clear(); lg.fillStyle(0x120a22, 0.62).fillRoundedRect(143, TOPY - 8, 114, RY - TOPY + 30, 6); lg.lineStyle(1, 0xffffff, 0.12); for (let i = 1; i < 4; i++) lg.lineBetween(LX[i] - 13, TOPY - 6, LX[i] - 13, RY + 20);
      this.rec.forEach((r, i) => { this.flash[i] = Math.max(0, this.flash[i] - dt); r.setScale(1 + this.flash[i] * 2.4).setAlpha(this.flash[i] > 0 ? 1 : 0.9); });
      // notas
      let used = 0; this.notes.forEach(n => {
        if (n.done && n.res !== 'miss') return; const y = RY - (n.step - bt) * PPS; if (y < TOPY - 16 || y > RY + 40) return; if (used >= this.pool.length) return;
        const im = this.pool[used++]; im.setTexture('sa_' + DIR[n.lane]).setPosition(LX[n.lane], Math.round(y)).setVisible(true).setAlpha(n.res === 'miss' ? 0.3 : (y < TOPY ? (y - TOPY + 16) / 16 : 1));
      });
      for (let k = used; k < this.pool.length; k++) this.pool[k].setVisible(false);
      // destellos de acierto
      const hg = this.hitG; hg.clear(); this.fx = (this.fx || []).filter(e => (e.t -= dt) > 0); this.fx.forEach(e => { const r = 10 + (0.25 - e.t) * 60; hg.lineStyle(2, e.c, e.t * 4).strokeCircle(LX[e.l], RY, r); });
      // bailarines
      this.jump = Math.max(0, this.jump - dt * 3); const step8 = Math.floor(bt / 2), fr = ['d0', 'd1', 'd0', 'd2'][step8 % 4];
      [[this.dm, 0], [this.dp, 1]].forEach(([d, i]) => {
        const bob = Math.sin(bt * Math.PI / 4) * 1.5 - (i === 0 ? this.jump * 9 : 0); d.spr.setFrame(fr).setY(192 + bob).setFlipX(Math.floor(bt / 16) % 2 === i); d.sh.setScale(1 - (i === 0 ? this.jump * 0.2 : 0), 1);
      });
      this.npcs.forEach((n, i) => { if (!n.spr.visible) return; n.spr.setFrame(['d0', 'd1', 'd0', 'd2'][(step8 + i) % 4]).setY(n.y + Math.sin(bt * Math.PI / 4 + i) * 1.2).setFlipX((Math.floor(bt / 16) + i) % 2 === 0); });
      // HUD
      if (this.phase === 'dance') this.hud(time);
      if (this.pop.t > 0) { this.pop.t -= dt; this.hPop.setText(this.pop.txt).setColor(this.pop.col).setAlpha(Math.min(1, this.pop.t * 3)).setY(78 - (0.7 - this.pop.t) * 14); } else this.hPop.setText('');
    }
    hud(time) {
      const S = SONGS[this.diff];
      this.hSong.setText('♪ ' + S.name + ' · ' + S.label);
      this.hBanner.setText(this.banner || '');
      this.hCombo.setText(this.combo >= 3 ? 'Combo x' + this.combo : '');
      const bg = this.barG; bg.clear();
      if (this.mode === 'solo') {
        this.hScore.setText(this.score + ' pts'); this.hSub.setText((G.state.partner.name || 'Pareja') + ': ' + this.oppScore + '\nTu récord: ' + this.myBest);
        const f = Math.max(0, Math.min(1, (this.bt - this.S0) / (this.lastStep - this.S0))); bg.fillStyle(OUTL).fillRect(166, 219, 130, 4).fillStyle(0xff7aa8).fillRect(167, 220, 128 * f, 2);
        this.rows.forEach(r => r.setText(''));
        if (this.myBest) { const gx = 167 + 128 * Math.min(1, this.score / this.myBest); bg.fillStyle(0xffd24a).fillRect(Math.min(294, gx), 217, 2, 8); }
      } else {
        this.hScore.setText(''); this.hSub.setText('');
        const rows = this.standings(); this.rows.forEach((r, i) => r.setText((i + 1) + '. ' + rows[i].name + ' ' + rows[i].pts).setColor(rows[i].me ? '#ffd24a' : '#ffffff'));
        const f = this.chart ? (this.phDone || 0) / this.chart.length : 0; bg.fillStyle(OUTL).fillRect(166, 219, 130, 4).fillStyle(0x7fe08a).fillRect(167, 220, 128 * f, 2);
      }
      const lab = { run: '♪ bailando', done: '✔ listo', fail: '✖ ¡ups!' }, my = G.state.me.id, pi = G.state.partner.id;
      this.hSt[0].setText(this.mode === 'dupla' ? (lab[this.stat[my]] || '') : '').setColor(this.stat[my] === 'fail' ? '#ff7a7a' : '#9fe0cf');
      this.hSt[1].setText(this.mode === 'dupla' ? (lab[this.stat[pi]] || '') : '').setColor(this.stat[pi] === 'fail' ? '#ff7a7a' : '#9fe0cf');
    }
  }
  G.SaocoScene = SaocoScene;
})();
