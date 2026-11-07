/* ===========================================================
   scenes/pollos.js — ETAPA 6 · El Pollo Pier (Miraflores, abajo de Kennedy) · "Memoria de pedidos"
   Solo venden CERVEZA y SALCHIPAPAS. Los clientes dicen su pedido y la burbuja se APAGA: hay que recordarlo.
   - Barril (cerveza) y freidora (salchipapas): mantén E para servir en la bandeja (caben 4).
   - E en una mesa: entrega lo que ese cliente pidió (si faltaba algo, sigue esperando lo que falte).
   - Q = libreta: vuelve a mostrar el pedido de la mesa más cercana (solo 3 usos; los que sobren dan puntos).
   - Basurero: tira la bandeja. Cada cliente tiene paciencia; si el bar se llena (8 mesas) y llega otro → STRIKE (3 = se cierra).
   - El reloj va llenando el bar: llegan más clientes y con pedidos más grandes.
   Los DOS juegan a la vez cada uno en su bar con la MISMA semilla (mismos clientes y pedidos); gana el mayor puntaje.
   Red: o_cfg / o_ready / o_go {seed} / o_sc (puntaje en vivo) / o_fin / o_res / o_again.
   Prueba solo: ?solo=1&me=sebas&go=pollos&pdur=90&pdiff=normal&pauto=1  (la pareja es un bot)
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H, Q = new URLSearchParams(location.search), P = G.P, mg = G.mg;
  const PRIZE = 10, SPEED = 66, B = { x0: 14, x1: 386, y0: 119, y1: 210 };
  const TB = [[64, 148], [150, 148], [250, 148], [336, 148], [64, 190], [150, 190], [250, 190], [336, 190]];
  const ST = { tap: { x: 64, y: 121, r: 24, txt: 'Barril de cerveza' }, fryer: { x: 336, y: 121, r: 24, txt: 'Freidora de salchipapas' }, bin: { x: 200, y: 121, r: 22, txt: 'Basurero (tira la bandeja)' } };
  const POUR = { b: 0.38, s: 0.62 };      // segundos que toma servir cada cosa
  const OUTL = 0x2b1b30;
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ---------- texturas (iconos y clientes) ---------- */
  function makeTextures(sc) {
    const mk = (key, w, h, fn) => { if (sc.textures.exists(key)) return; const g = sc.make.graphics({ x: 0, y: 0, add: false }); fn(g); g.generateTexture(key, w, h); g.destroy(); };
    mk('pi_beer', 12, 12, g => {
      g.fillStyle(OUTL).fillRect(1, 1, 8, 11).fillRect(9, 3, 3, 6);
      g.fillStyle(0xe8a22a).fillRect(10, 4, 1, 4);
      g.fillStyle(0xf5b82e).fillRect(2, 4, 6, 7); g.fillStyle(0xffe58a).fillRect(3, 6, 1, 4);
      g.fillStyle(0xffffff).fillRect(2, 2, 6, 3).fillRect(1, 3, 1, 1);
    });
    mk('pi_fries', 12, 12, g => {
      g.fillStyle(OUTL).fillRect(1, 5, 10, 7);
      g.fillStyle(0xe63946).fillRect(2, 6, 8, 5);
      g.fillStyle(0xffd24a).fillRect(2, 1, 1, 5).fillRect(4, 0, 1, 6).fillRect(6, 1, 1, 5).fillRect(8, 0, 1, 6).fillRect(9, 2, 1, 4);
      g.fillStyle(0x9b4a2a).fillRect(3, 7, 3, 2).fillRect(6, 8, 3, 2);
      g.fillStyle(0xffffff).fillRect(5, 7, 1, 1).fillStyle(0xe8d24a).fillRect(4, 9, 1, 1);
    });
    const SK = [0xf2c9a0, 0xd9a577, 0xb67a4c, 0x8a5a3a, 0xf7d5b5, 0xc68a5e], SH = [0xe63946, 0x3a86ff, 0x2ec4b6, 0xffbe0b, 0x8a5cf6, 0xff7aa8], HA = [0x2b1b30, 0x6b3a1c, 0xd4a04a, 0x1b1618, 0xa5502a, 0x4a2a1c];
    for (let k = 0; k < 6; k++) mk('pp_' + k, 16, 20, g => {
      g.fillStyle(OUTL).fillRect(2, 10, 12, 10).fillRect(3, 1, 10, 11);
      g.fillStyle(SH[k]).fillRect(3, 11, 10, 9); g.fillStyle(0xffffff, 0.25).fillRect(3, 11, 10, 2);
      g.fillStyle(SK[k]).fillRect(4, 3, 8, 8);
      g.fillStyle(HA[k]).fillRect(4, 2, 8, 3);
      if (k % 3 === 1) g.fillStyle(HA[k]).fillRect(3, 3, 1, 7).fillRect(12, 3, 1, 7);       // pelo largo
      if (k % 3 === 2) { g.fillStyle(SH[(k + 2) % 6]).fillRect(3, 1, 10, 3).fillRect(2, 3, 12, 1); } // gorra
      g.fillStyle(OUTL).fillRect(6, 7, 1, 2).fillRect(9, 7, 1, 2);
      g.fillStyle(0xd0584a).fillRect(7, 10, 2, 1);
    });
    mk('pp_tray', 4, 4, g => { g.fillStyle(0xffffff).fillRect(0, 0, 4, 4); });
  }

  /* ================= ESCENA ================= */
  class PollosScene extends Phaser.Scene {
    constructor() { super('pollos'); }
    create() {
      A.emoteTextures(this.game); G.refreshTextures(); makeTextures(this);
      this.phase = 'lobby'; this.diff = P.DIFFS[Q.get('pdiff')] ? Q.get('pdiff') : 'normal'; this.dur = P.DURS.includes(+Q.get('pdur')) || +Q.get('pdur') >= 20 ? +Q.get('pdur') : 150;
      this.ready = { me: false, partner: false }; this.ui = []; this.opp = { score: 0 }; this.fin = {}; this.sim = null; this.tray = { b: 0, s: 0 }; this.trayOrder = [];
      this.peeks = 3; this.peekI = -1; this.peekT = 0; this.hold = null; this.sayT = 0; this.cd = 0; this.over = false; this.resolved = false; this.target = null;
      this.keys = this.input.keyboard.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D' }, false);
      const kb = this.input.keyboard;
      kb.on('keydown-E', () => this.press()); kb.on('keydown-SPACE', () => this.press()); kb.on('keyup-E', () => this.release()); kb.on('keyup-SPACE', () => this.release());
      kb.on('keydown-Q', () => this.peek());
      kb.on('keydown-ESC', () => { if (this.phase === 'lobby' || this.phase === 'over') G.flow.openMap(); });
      this.drawBar(); this.makeActors();
      mg.bind(this, [['o_cfg', d => { if (this.phase === 'lobby') { this.diff = d.diff; this.dur = d.dur; this.drawLobby(); } }],
        ['o_ready', d => { this.ready.partner = !!d.r; if (this.phase === 'lobby') { this.drawLobby(); this.tryStart(); } }],
        ['o_go', d => { if (this.phase === 'lobby') this.beginMatch(d.seed, d.diff, d.dur); }],
        ['o_sc', d => { this.opp.score = d.s; }], ['o_fin', d => { this.fin.partner = d; this.hostResolve(); }],
        ['o_res', d => this.showOver(d)], ['o_again', () => this.scene.restart()]]);
      this.drawLobby(); this.sendCfg();
      this.time.addEvent({ delay: 1200, loop: true, callback: () => { if (this.phase === 'lobby') { if (G.solo || G.net.role === 'host') this.sendCfg(); mg.send('o_ready', { r: this.ready.me }); } } });
      if (G.solo && Q.get('pauto') === '1') this.time.delayedCall(600, () => { this.ready.me = true; this.tryStart(); });
    }
    sendCfg() { mg.send('o_cfg', { diff: this.diff, dur: this.dur }); }

    /* ---------- el bar ---------- */
    drawBar() {
      const g = this.add.graphics().setDepth(0), sg = P.TABLES;
      A.bands(g, 0, 0, W, 100, [0x6b2f3a, 0x8a4a3a, 0x9c5a3a], 4);
      g.lineStyle(1, 0x000000, 0.12); for (let y = 6; y < 100; y += 8) g.lineBetween(0, y, W, y); for (let r = 0; r < 12; r++) for (let x = (r % 2) * 14; x < W; x += 28) g.lineBetween(x, r * 8 + 6, x, r * 8 + 14);
      // estantes con botellas (decorado)
      [[10, 76], [262, 76]].forEach(([x0, y0]) => {
        g.fillStyle(0x3a2010).fillRect(x0, y0 + 14, 128, 3).fillRect(x0, y0 - 6, 128, 3);
        for (let i = 0; i < 12; i++) { const c = [0x2f7a46, 0xd9a02a, 0x8a3a1c, 0x3a6fb5, 0xa83a5a, 0x6fbf6a][i % 6]; const x = x0 + 4 + i * 10.5; g.fillStyle(OUTL).fillRect(x - 1, y0 - 5 + (i % 2) * 0, 6, 17).fillStyle(c).fillRect(x, y0 - 3, 4, 15).fillStyle(0xffffff, 0.4).fillRect(x + 1, y0 - 2, 1, 6); g.fillStyle(0xe8d7b0).fillRect(x, y0 - 7, 4, 3); }
      });
      // letrero
      const sg0 = G.PLACES.pollos.sign || ['EL POLLO', 'PIER', 'restaurant'];
      g.fillStyle(0x1b1230).fillRoundedRect(116, 27, 168, 42, 6).lineStyle(2, 0xffd24a).strokeRoundedRect(116, 27, 168, 42, 6).lineStyle(1, 0xff7aa8).strokeRoundedRect(120, 31, 160, 34, 4);
      A.text(this, 200, 40, sg0[0], 14, '#ffd24a', { stroke: '#8a3a1c', strokeThickness: 2 }).setDepth(1);
      A.text(this, 200, 54, sg0[1], 17, '#ff7aa8', { stroke: '#5a1a3a', strokeThickness: 2 }).setDepth(1);
      A.text(this, 200, 64, sg0[2], 8, '#bfeaff', { stroke: '#1b1230', strokeThickness: 2 }).setDepth(1);
      // barra
      g.fillStyle(0x3a2010).fillRect(0, 96, W, 20).fillStyle(0x7a4a2a).fillRect(0, 98, W, 14).fillStyle(0xa8703a).fillRect(0, 98, W, 3).fillStyle(0x2a1608).fillRect(0, 112, W, 4);
      // piso de madera
      g.fillStyle(0xcd9a5a).fillRect(0, 116, W, 109); g.lineStyle(1, 0x000000, 0.14); for (let y = 126; y < 225; y += 10) g.lineBetween(0, y, W, y); for (let r = 0; r < 10; r++) for (let x = (r % 2) * 22; x < W; x += 44) g.lineBetween(x, 116 + r * 10, x, 126 + r * 10);
      g.fillStyle(0xe63946, 0.35).fillRect(120, 166, 160, 3);
      // estaciones
      this.drawTap(g); this.drawFryer(g); this.drawBin(g);
      this.add.graphics().setDepth(45).fillStyle(0x000000, 0.18).fillEllipse(ST.tap.x, 114, 36, 6).fillEllipse(ST.fryer.x, 114, 36, 6).fillEllipse(ST.bin.x, 114, 26, 5);
      // mesas
      TB.forEach(([x, y]) => {
        const t = this.add.graphics().setDepth(y + 8);
        t.fillStyle(0x000000, 0.2).fillEllipse(x, y + 12, 34, 7);
        t.fillStyle(OUTL).fillRect(x - 14, y - 4, 28, 14).fillRect(x - 12, y + 9, 3, 4).fillRect(x + 9, y + 9, 3, 4);
        t.fillStyle(0xb5502a).fillRect(x - 13, y - 3, 26, 5).fillStyle(0x8a3a1c).fillRect(x - 13, y + 2, 26, 7).fillStyle(0xd9703a).fillRect(x - 13, y - 3, 26, 1);
        t.fillStyle(0xffffff, 0.85).fillRect(x - 3, y - 2, 6, 2);
      });
      this.rugG = null;
    }
    drawTap(g) {
      const x = ST.tap.x;
      g.fillStyle(OUTL).fillRoundedRect(x - 15, 76, 30, 28, 5).fillStyle(0x8a5a2a).fillRoundedRect(x - 13, 78, 26, 24, 4).fillStyle(0xb5803a).fillRect(x - 11, 80, 4, 20).fillStyle(0x5a3a1a).fillRect(x - 13, 84, 26, 2).fillRect(x - 13, 94, 26, 2);
      g.fillStyle(OUTL).fillRect(x + 4, 70, 4, 12).fillStyle(0xd0d0d8).fillRect(x + 5, 70, 2, 10).fillStyle(0xffd24a).fillRect(x + 3, 68, 6, 3);
      g.fillStyle(0xf5b82e).fillRect(x + 14, 92, 7, 10).fillStyle(0xffffff).fillRect(x + 14, 90, 7, 3).fillStyle(OUTL).fillRect(x + 13, 91, 1, 12).fillRect(x + 21, 91, 1, 12);
      A.text(this, x, 107, 'CERVEZA', 10, '#ffe58a', { strokeThickness: 1 }).setDepth(50);
    }
    drawFryer(g) {
      const x = ST.fryer.x;
      g.fillStyle(OUTL).fillRoundedRect(x - 17, 78, 34, 26, 3).fillStyle(0x9aa6b5).fillRoundedRect(x - 15, 80, 30, 22, 2).fillStyle(0xc8d2de).fillRect(x - 15, 80, 30, 3);
      g.fillStyle(0xd9a02a).fillRect(x - 12, 84, 24, 6).fillStyle(0xffd24a).fillRect(x - 11, 85, 22, 3);
      g.fillStyle(0xffd24a); for (let i = 0; i < 6; i++) g.fillRect(x - 10 + i * 4, 78 - (i % 2) * 2, 2, 8);
      g.fillStyle(0x5a6270).fillRect(x - 15, 94, 30, 2).fillStyle(0xe63946).fillRect(x - 9, 97, 3, 3).fillRect(x + 4, 97, 3, 3);
      A.text(this, x, 107, 'SALCHIPAPAS', 10, '#ffe58a', { strokeThickness: 1 }).setDepth(50);
    }
    drawBin(g) {
      const x = ST.bin.x;
      g.fillStyle(OUTL).fillRect(x - 10, 84, 20, 22).fillStyle(0x7a8696).fillRect(x - 9, 86, 18, 19).fillStyle(0x9aa6b5).fillRect(x - 9, 86, 4, 19).fillStyle(OUTL).fillRect(x - 12, 82, 24, 4).fillStyle(0x5a6270).fillRect(x - 11, 83, 22, 2);
      g.fillStyle(0x2b1b30).fillRect(x - 5, 91, 1, 10).fillRect(x, 91, 1, 10).fillRect(x + 4, 91, 1, 10);
      A.text(this, x, 107, 'BASURERO', 10, '#dfe8f0', { strokeThickness: 1 }).setDepth(50);
    }

    /* ---------- personajes y elementos del juego ---------- */
    makeActors() {
      const s = this.add.sprite(200, 150, 'char_me', 'd0').setOrigin(0.5, 1);
      this.me = { x: 200, y: 160, dir: 'd', moving: false, t: 0, spr: s, shadow: this.add.ellipse(200, 160, 14, 5, 0x000000, 0.25) };
      this.me.label = this.add.text(200, 130, G.state.me.name || '', { fontFamily: 'VT323', fontSize: '12px', color: '#ffffff', stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0.5, 1);
      this.me.trayG = this.add.graphics(); this.me.trayIc = [0, 1, 2, 3].map(() => this.add.image(0, 0, 'pi_beer').setVisible(false));
      this.me.bar = this.add.graphics();
      this.tb = TB.map(([x, y]) => ({
        x, y, spr: this.add.sprite(x, y + 4, 'pp_0').setOrigin(0.5, 1).setVisible(false).setDepth(y + 3), bar: this.add.graphics().setDepth(y + 20),
        bub: this.add.graphics().setDepth(y + 30), ic: [0, 1, 2, 3, 4].map(() => this.add.image(0, 0, 'pi_beer').setVisible(false).setDepth(y + 31)),
        q: this.add.text(x, y - 33, '', { fontFamily: 'VT323', fontSize: '14px', color: '#2b1b30' }).setOrigin(0.5).setDepth(y + 32)
      }));
      // marcadores
      this.ring = this.add.graphics().setDepth(40);
      const t = (x, y, s, c, o) => this.add.text(x, y, s, Object.assign({ fontFamily: 'VT323', fontSize: '16px', color: c || '#ffffff', stroke: '#2b1b30', strokeThickness: 3 }, o || {})).setDepth(5000);
      this.hClock = t(6, 30, '', '#ffffff'); this.hOcc = this.add.graphics().setDepth(5000); this.hOccT = t(6, 47, 'AFORO', '#ffd24a', { fontSize: '11px' });
      this.hScore = t(394, 28, '', '#ffd24a', { fontSize: '18px' }).setOrigin(1, 0); this.hStr = t(394, 46, '', '#ff7aa8', { fontSize: '13px' }).setOrigin(1, 0);
      this.hOpp = t(394, 58, '', '#bfeaff', { fontSize: '13px' }).setOrigin(1, 0); this.hPeek = t(58, 34, '', '#fff3d6', { fontSize: '12px' });
      this.hint = A.text(this, 200, 78, '', 13, '#fff3d6').setDepth(5000);
      this.trayHud = this.add.graphics().setDepth(5000); this.trayHudIc = [0, 1, 2, 3].map(() => this.add.image(0, 0, 'pi_beer').setVisible(false).setDepth(5001));
      this.hTrayT = t(200, 211, '', '#fff3d6', { fontSize: '11px' }).setOrigin(0.5, 0);
      this.setHudVisible(false);
    }
    setHudVisible(v) { [this.hClock, this.hOcc, this.hOccT, this.hScore, this.hStr, this.hOpp, this.hPeek, this.trayHud, this.hTrayT].forEach(o => o.setVisible(v)); if (!v) this.trayHudIc.forEach(i => i.setVisible(false)); }
    say(txt, s) { this.hint.setText(txt || ''); this.sayT = s || 0; }

    /* ---------- lobby ---------- */
    drawLobby() {
      this.ui.forEach(o => o.destroy()); this.ui = []; if (this.phase !== 'lobby') return;
      const add = o => { this.ui.push(o); return o; }, D = 9000;
      mg.panel(this, add, 28, 28, 344, 172, D);
      add(A.text(this, 200, 41, '🍺 EL POLLO PIER · MEMORIA DE PEDIDOS', 15, '#ffd24a').setDepth(D + 1));
      add(this.add.text(200, 50, 'Solo hay cerveza y salchipapas… ¡y el bar se llena! Cada cliente dice su pedido UNA vez y la burbuja se apaga: recuérdalo. Gana el que sume más con los MISMOS clientes.', { fontFamily: 'VT323', fontSize: '12px', color: '#fff3d6', align: 'center', lineSpacing: -2, wordWrap: { width: 316 } }).setOrigin(0.5, 0).setDepth(D + 1));
      add(this.add.text(200, 86, 'Mover: flechas/WASD · Servir: mantén E · Entregar: E · Libreta (3 usos): Q', { fontFamily: 'VT323', fontSize: '12px', color: '#9fe0cf' }).setOrigin(0.5, 0).setDepth(D + 1));
      add(this.add.text(200, 100, 'Dificultad:', { fontFamily: 'VT323', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5, 0).setDepth(D + 1));
      Object.keys(P.DIFFS).forEach((k, i) => mg.btn(this, add, 140 + i * 60, 122, 54, 18, P.DIFFS[k].name, this.diff === k ? 0xffd24a : 0xbfeaff, () => { this.diff = k; this.sendCfg(); this.drawLobby(); }, D, 13));
      add(this.add.text(200, 136, 'Duración del turno:', { fontFamily: 'VT323', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5, 0).setDepth(D + 1));
      P.DURS.forEach((n, i) => mg.btn(this, add, 140 + i * 60, 158, 54, 18, fmt(n), this.dur === n ? 0xffd24a : 0xbfeaff, () => { this.dur = n; this.sendCfg(); this.drawLobby(); }, D, 13));
      const nm = G.state.me.name || 'Tú', pn = G.state.partner.name || 'Pareja';
      mg.btn(this, add, 110, 183, 104, 20, this.ready.me ? '✔ ¡Listo!' : '¡Estoy listo!', this.ready.me ? 0x7fd1ae : 0xff7aa8, () => { this.ready.me = !this.ready.me; mg.send('o_ready', { r: this.ready.me }); this.drawLobby(); this.tryStart(); }, D);
      add(this.add.text(172, 175, (G.solo ? pn + ' (bot) 🤖: listo' : pn + (this.ready.partner ? ': ✔ listo' : ': esperando…')) + '\n' + nm + (this.ready.me ? ': ✔ listo' : ''), { fontFamily: 'VT323', fontSize: '12px', color: '#fff3d6', lineSpacing: -1 }).setOrigin(0, 0).setDepth(D + 1));
      mg.btn(this, add, 334, 183, 62, 20, '◀ Mapa', 0xffffff, () => G.flow.openMap(), D, 13);
    }
    tryStart() {
      if (this.phase !== 'lobby' || !this.ready.me) return;
      if (G.solo) { this.beginMatch(Math.floor(Math.random() * 2 ** 31), this.diff, this.dur); return; }
      if (this.ready.partner && G.net.role === 'host') { const seed = Math.floor(Math.random() * 2 ** 31); mg.send('o_go', { seed, diff: this.diff, dur: this.dur }); this.beginMatch(seed, this.diff, this.dur); }
    }

    /* ---------- partida ---------- */
    beginMatch(seed, diff, dur) {
      this.ui.forEach(o => o.destroy()); this.ui = []; this.diff = diff; this.dur = dur; this.seed = seed; this.sim = new P.Sim(seed, diff, dur);
      this.tray = { b: 0, s: 0 }; this.trayOrder = []; this.peeks = 3; this.peekI = -1; this.peekT = 0; this.hold = null; this.fin = {}; this.over = false; this.opp = { score: 0 };
      Object.assign(this.me, { x: 200, y: 160, dir: 'd', moving: false });
      if (G.solo) { const base = { facil: 70, normal: 110, dificil: 150 }[diff] * (dur / 150); this.bot = { target: base * (0.75 + 0.5 * Math.random()) }; } else this.bot = null;
      this.phase = 'count'; this.cd = 3.2; this.setHudVisible(true); this.say('', 0);
      this.cdT = A.text(this, 200, 100, '', 30, '#ffffff').setDepth(8000);
      G.audio.sfx('ok');
    }
    press() {
      if (G.typing || G.modalOpen || this.phase !== 'play') return;
      const t = this.target; if (!t) { this.say('Acércate al barril, la freidora o una mesa', 1.2); return; }
      if (t.kind === 'bin') { if (this.tray.b + this.tray.s) { this.tray = { b: 0, s: 0 }; this.trayOrder = []; G.audio.sfx('hit'); this.say('Bandeja vacía 🗑', 1.2); } return; }
      if (t.kind === 'tap' || t.kind === 'fryer') { this.hold = { kind: t.kind === 'tap' ? 'b' : 's', p: 0 }; return; }
      if (t.kind === 'table') this.serve(t.i);
    }
    release() { this.hold = null; }
    serve(i) {
      const r = this.sim.serve(i, this.tray), tb = this.tb[i];
      this.rebuildTrayOrder();
      if (!r.ok) { G.audio.sfx('hit'); this.say(r.why === 'vacia' ? 'Esa mesa no está esperando nada' : 'Eso no es lo que pidió… ¿qué era? (Q = libreta)', 1.8); return; }
      if (r.full) { G.audio.sfx('ok'); this.pop(tb.x, tb.y - 40, '+' + r.pts, '#7fe08a'); } else { G.audio.sfx('pop'); this.pop(tb.x, tb.y - 40, '+' + r.pts + ' (¡falta algo!)', '#ffd24a'); }
    }
    rebuildTrayOrder() { const o = []; for (let i = 0; i < this.tray.b; i++) o.push('b'); for (let i = 0; i < this.tray.s; i++) o.push('s'); this.trayOrder = o; }
    peek() {
      if (G.typing || G.modalOpen || this.phase !== 'play') return;
      if (this.peeks <= 0) { this.say('Ya no te quedan usos de libreta', 1.5); return; }
      let best = -1, bd = 52; this.sim.pat.forEach((p, i) => { if (!p || p.state !== 'wait') return; const d = Math.hypot(this.me.x - TB[i][0], this.me.y - (TB[i][1] + 6)); if (d < bd) { bd = d; best = i; } });
      if (best < 0) { this.say('Acércate a una mesa con un cliente esperando', 1.5); return; }
      if (this.sim.pat[best].show > 0) { this.say('Su pedido aún se ve: ¡memorízalo!', 1.2); return; }
      this.peeks--; this.peekI = best; this.peekT = 1.8; G.audio.sfx('click');
    }
    pop(x, y, txt, col) {
      const t = A.text(this, x, y, txt, 13, col).setDepth(6000); this.tweens.add({ targets: t, y: y - 14, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
    }

    /* ---------- bucle ---------- */
    update(time, dtMs) {
      const dt = Math.min(0.05, dtMs / 1000);
      if (this.phase === 'count') {
        this.cd -= dt; const n = Math.ceil(this.cd - 0.2);
        this.cdT.setText(n > 0 ? String(n) : '¡Abre el bar!');
        if (this.cd <= 0) { this.phase = 'play'; this.cdT.destroy(); this.cdT = null; this.say('¡Llegan los primeros clientes!', 2.5); }
      }
      if (this.phase === 'play') this.play(dt);
      if (this.sayT > 0) { this.sayT -= dt; if (this.sayT <= 0) this.hint.setText(''); }
      this.moveMe(dt); this.render(time);
    }
    play(dt) {
      const S = this.sim, me = this.me;
      S.tick(dt);
      S.ev.splice(0).forEach(e => {
        if (e.k === 'arrive') G.audio.sfx('pop');
        else if (e.k === 'angry') { G.audio.sfx('hit'); this.pop(TB[e.i][0], TB[e.i][1] - 40, '-6 ¡se fue!', '#ff7a7a'); }
        else if (e.k === 'strike') { G.audio.sfx('hit'); this.cameras.main.shake(180, 0.006); this.say('¡Bar lleno! Se fue un cliente (' + S.strikes + '/' + P.STRIKES + ')', 2); }
      });
      if (this.peekT > 0) { this.peekT -= dt; if (this.peekT <= 0) this.peekI = -1; }
      // servir (mantener E)
      if (this.hold) {
        if (this.target && ((this.hold.kind === 'b' && this.target.kind === 'tap') || (this.hold.kind === 's' && this.target.kind === 'fryer'))) {
          if (this.tray.b + this.tray.s < P.CAP) { this.hold.p += dt; if (this.hold.p >= POUR[this.hold.kind]) { this.hold.p = 0; this.tray[this.hold.kind]++; this.trayOrder.push(this.hold.kind); G.audio.sfx('pop'); } }
          else this.say('¡Bandeja llena! (caben ' + P.CAP + ')', 1.0);
        } else this.hold.p = 0;
      }
      this.sendT = (this.sendT || 0) + dt; if (this.sendT >= 1) { this.sendT = 0; mg.send('o_sc', { s: S.score }); }
      if (this.bot) this.opp.score = Math.round(this.bot.target * Math.pow(S.prog(), 1.1));
      if (S.over) this.endMatch();
    }
    moveMe(dt) {
      const a = this.me, K = this.keys; let vx = 0, vy = 0;
      if (['play', 'count', 'ended'].includes(this.phase) && !G.typing && !G.modalOpen) { if (K.left.isDown || K.a.isDown) vx--; if (K.right.isDown || K.d.isDown) vx++; if (K.up.isDown || K.w.isDown) vy--; if (K.down.isDown || K.s.isDown) vy++; }
      a.moving = !!(vx || vy);
      if (a.moving) {
        const l = Math.hypot(vx, vy), sp = SPEED * (this.tray.b + this.tray.s >= P.CAP ? 0.9 : 1) * dt;
        const nx = Phaser.Math.Clamp(a.x + vx / l * sp, B.x0, B.x1); if (!this.hits(nx, a.y)) a.x = nx;
        const ny = Phaser.Math.Clamp(a.y + vy / l * sp, B.y0, B.y1); if (!this.hits(a.x, ny)) a.y = ny;
        a.dir = Math.abs(vx) >= Math.abs(vy) && vx ? (vx < 0 ? 'l' : 'r') : (vy < 0 ? 'u' : 'd'); a.t += dt * 1000;
      }
      // objetivo más cercano
      let best = null, bd = 1e9;
      const cand = (kind, x, y, r, i) => { const d = Math.hypot(a.x - x, a.y - y); if (d < r && d < bd) { bd = d; best = { kind, i, x, y }; } };
      cand('tap', ST.tap.x, ST.tap.y, ST.tap.r); cand('fryer', ST.fryer.x, ST.fryer.y, ST.fryer.r); cand('bin', ST.bin.x, ST.bin.y, ST.bin.r);
      TB.forEach(([x, y], i) => cand('table', x, y + 4, 28, i));
      this.target = best;
    }
    hits(x, y) { return TB.some(([tx, ty]) => x > tx - 19 && x < tx + 19 && y > ty - 4 && y < ty + 10); }

    /* ---------- dibujo por cuadro ---------- */
    render(time) {
      const S = this.sim, me = this.me, flip = me.dir === 'r', dir = me.dir === 'r' ? 'l' : me.dir, fr = me.moving ? [1, 0, 2, 0][Math.floor(me.t / 130) % 4] : 0;
      me.spr.setPosition(Math.round(me.x), Math.round(me.y)).setFrame(dir + fr).setFlipX(flip).setDepth(me.y); me.shadow.setPosition(me.x, me.y - 1).setDepth(me.y - 1);
      me.label.setPosition(Math.round(me.x), Math.round(me.y - 29)).setDepth(me.y + 1000);
      // bandeja sobre la cabeza
      const n = this.trayOrder.length; me.trayG.clear().setDepth(me.y + 1001);
      me.trayIc.forEach((ic, k) => { if (k < n) { ic.setTexture(this.trayOrder[k] === 'b' ? 'pi_beer' : 'pi_fries').setVisible(true).setPosition(Math.round(me.x - (n - 1) * 6 + k * 12), Math.round(me.y - 42)).setDepth(me.y + 1002).setScale(0.8); } else ic.setVisible(false); });
      if (n) me.trayG.fillStyle(0xffffff, 0.85).fillRoundedRect(me.x - n * 6 - 1, me.y - 49, n * 12 + 2, 13, 3).lineStyle(1, OUTL).strokeRoundedRect(me.x - n * 6 - 1, me.y - 49, n * 12 + 2, 13, 3);
      // barra de servir
      me.bar.clear().setDepth(me.y + 1003); if (this.hold && this.hold.p > 0.02) { const f = this.hold.p / POUR[this.hold.kind]; me.bar.fillStyle(OUTL).fillRect(me.x - 9, me.y - 36, 18, 4).fillStyle(this.hold.kind === 'b' ? 0xf5b82e : 0xe63946).fillRect(me.x - 8, me.y - 35, 16 * f, 2); }
      // anillo del objetivo
      this.ring.clear(); if (this.target && this.phase === 'play') { const t = this.target, rr = t.kind === 'table' ? 15 : 13; this.ring.lineStyle(1.5, 0xffffff, 0.8 + Math.sin(time / 120) * 0.2).strokeEllipse(t.x, t.y + (t.kind === 'table' ? 8 : 6), rr * 2, rr * 0.8); }
      if (this.phase === 'play' && this.sayT <= 0) {
        const t = this.target; let h = '';
        if (t) h = t.kind === 'tap' ? 'Mantén E: servir cerveza' : t.kind === 'fryer' ? 'Mantén E: servir salchipapas' : t.kind === 'bin' ? 'E: tirar la bandeja' : (S.pat[t.i] && S.pat[t.i].state === 'wait' ? 'E: entregar · Q: libreta' : '');
        this.hint.setText(h);
      }
      // mesas
      this.tb.forEach((tb, i) => {
        const p = S ? S.pat[i] : null;
        if (!p) { tb.spr.setVisible(false); tb.bar.clear(); tb.bub.clear(); tb.ic.forEach(x => x.setVisible(false)); tb.q.setText(''); return; }
        tb.spr.setVisible(true).setTexture('pp_' + p.skin).setTint(p.state === 'angry' ? 0xff8a8a : p.state === 'done' ? 0xc8ffc8 : 0xffffff).setY(tb.y + 4 + (p.state === 'wait' ? Math.sin(time / 400 + i) * 0.6 : 0));
        tb.bar.clear(); const f = p.pat / p.patMax;
        if (p.state === 'wait') tb.bar.fillStyle(OUTL).fillRect(tb.x - 11, tb.y - 22, 22, 4).fillStyle(f > 0.6 ? 0x7fe08a : f > 0.3 ? 0xffd24a : 0xff5a5a).fillRect(tb.x - 10, tb.y - 21, Math.max(0, 20 * f), 2);
        const showOrder = p.state === 'wait' && (p.show > 0 || (this.peekI === i && this.peekT > 0));
        const items = []; if (showOrder) { for (let k = 0; k < p.need.b; k++) items.push('pi_beer'); for (let k = 0; k < p.need.s; k++) items.push('pi_fries'); }
        const g = tb.bub; g.clear(); tb.q.setText('');
        const bw = showOrder ? items.length * 13 + 6 : 18, bx = tb.x - bw / 2, by = tb.y - 41;
        g.fillStyle(OUTL).fillRoundedRect(bx - 1, by - 1, bw + 2, 18, 4).fillTriangle(tb.x - 3, by + 16, tb.x + 3, by + 16, tb.x, by + 21);
        g.fillStyle(p.state === 'wait' && showOrder && this.peekI === i && p.show <= 0 ? 0xfff0b0 : 0xffffff).fillRoundedRect(bx, by, bw, 16, 3).fillTriangle(tb.x - 2, by + 15, tb.x + 2, by + 15, tb.x, by + 19);
        tb.ic.forEach((ic, k) => { if (k < items.length) ic.setTexture(items[k]).setVisible(true).setPosition(Math.round(bx + 3 + k * 13 + 6), Math.round(by + 8)); else ic.setVisible(false); });
        if (!showOrder) { if (p.state === 'wait') tb.q.setText('?').setColor('#2b1b30'); else if (p.state === 'done') { A.heart(g, tb.x, by + 8, 4, 0xff5d97); } else tb.q.setText('!').setColor('#e0312e'); }
      });
      if (!S || this.phase === 'ended' || this.phase === 'over') return;
      // HUD
      const left = Math.max(0, this.dur - S.t);
      this.hClock.setText('⏱ ' + fmt(left)).setColor(left < 15 ? '#ff7a7a' : '#ffffff');
      const occ = S.occupied(); this.hOcc.clear(); for (let k = 0; k < P.TABLES; k++) { this.hOcc.fillStyle(OUTL).fillRect(6 + k * 9, 58, 8, 6).fillStyle(k < occ ? (occ >= 7 ? 0xff5a5a : 0xffd24a) : 0x5a4a6a).fillRect(7 + k * 9, 59, 6, 4); }
      this.hPeek.setText('Libreta ✎ ×' + this.peeks);
      this.hScore.setText(S.score + ' pts'); this.hStr.setText('Strikes ' + '✖'.repeat(S.strikes) + '·'.repeat(P.STRIKES - S.strikes));
      this.hOpp.setText(G.state.partner.name + ': ' + (this.opp.score || 0));
      // bandeja (HUD inferior)
      const nn = this.trayOrder.length, tg = this.trayHud; tg.clear();
      for (let k = 0; k < P.CAP; k++) { const x = 200 - P.CAP * 8 + k * 16; tg.fillStyle(OUTL, 0.8).fillRoundedRect(x, 212, 15, 13, 3).fillStyle(0xffffff, 0.25).fillRoundedRect(x + 1, 213, 13, 11, 2); const ic = this.trayHudIc[k]; if (k < nn) ic.setTexture(this.trayOrder[k] === 'b' ? 'pi_beer' : 'pi_fries').setVisible(true).setPosition(x + 7.5, 218.5).setScale(0.9); else ic.setVisible(false); }
      this.hTrayT.setText('').setPosition(200, 205);
    }

    /* ---------- final ---------- */
    endMatch() {
      if (this.phase !== 'play') return; this.phase = 'ended'; this.hold = null; const S = this.sim;
      const bonus = S.finish(this.peeks), why = S.over; this.hint.setText('');
      this.sim.pat.forEach((p, i) => { if (p && p.state === 'wait') { /* clientes sin atender al cerrar: no suman ni restan */ } });
      G.audio.sfx(why === 'lleno' ? 'hit' : 'win');
      const o = { score: S.score, served: S.served, lost: S.lost, bonus, why };
      this.fin.me = o; mg.send('o_fin', o);
      if (G.solo) { this.fin.partner = { score: this.bot.target * (0.9 + 0.2 * Math.random()) | 0, served: Math.round(this.bot.target / 28), lost: 0, bonus: 0, why: 'tiempo' }; this.opp.score = this.fin.partner.score; }
      const D = 9500, add = o2 => { this.ui.push(o2); return o2; };
      mg.panel(this, add, 70, 62, 260, 100, D);
      add(A.text(this, 200, 80, why === 'lleno' ? '¡SE LLENÓ EL BAR!' : '¡CERRÓ EL BAR!', 16, '#ffd24a').setDepth(D + 1));
      add(this.add.text(200, 100, 'Tu puntaje: ' + S.score + (bonus ? '  (incluye +' + bonus + ' por libreta)' : '') + '\nClientes servidos: ' + S.served + '  ·  Se fueron: ' + S.lost + '\nEsperando a ' + (G.state.partner.name || 'tu pareja') + '…', { fontFamily: 'VT323', fontSize: '14px', color: '#fff3d6', align: 'center', lineSpacing: -1 }).setOrigin(0.5, 0).setDepth(D + 1));
      this.setHudVisible(false);
      if (G.solo || G.net.role === 'host') this.time.delayedCall(25000, () => { if (!this.resolved && !this.over && this.fin.me) { this.fin.partner = this.fin.partner || { score: this.opp.score || 0, served: 0, lost: 0, bonus: 0, why: 'sin respuesta' }; this.hostResolve(); } });
      this.hostResolve();          // al final: si ya están los dos resultados, reemplaza este panel por el marcador
    }
    hostResolve() {
      if (this.resolved || this.over) return;
      if (!(G.solo || G.net.role === 'host')) return;
      if (!this.fin.me || !this.fin.partner) return;
      this.resolved = true;
      const my = G.state.me.id, pi = G.state.partner.id, a = this.fin.me, b = this.fin.partner;
      let winner = null; if (a.score !== b.score) winner = a.score > b.score ? my : pi; else if (a.served !== b.served) winner = a.served > b.served ? my : pi;
      const res = { winner, scores: { [my]: a.score, [pi]: b.score }, served: { [my]: a.served, [pi]: b.served } };
      mg.send('o_res', res); this.showOver(res);
    }
    showOver(o) {
      if (this.over) return; this.over = true; this.phase = 'over'; this.ui.forEach(x => x.destroy()); this.ui = []; this.setHudVisible(false);
      const my = G.state.me.id, pi = G.state.partner.id, win = o.winner, D = 9500, add = x => { this.ui.push(x); return x; };
      if (G.solo || G.net.role === 'host') { if (win) { G.addSoles(win, PRIZE); G.recordWin('pollos', win, o.scores[win]); } else G.recordWin('pollos', null, 0); }
      G.audio.sfx('win');
      mg.panel(this, add, 50, 34, 300, 150, D);
      add(A.text(this, 200, 54, win ? '🏆 ¡GANÓ ' + String(mg.nameOf(win)).toUpperCase() + '!' : '🤝 ¡EMPATE!', 18, '#ffd24a').setDepth(D + 1));
      [[my, 80], [pi, 98]].forEach(([id, y]) => add(this.add.text(200, y, mg.nameOf(id) + ':  ' + o.scores[id] + ' pts · ' + o.served[id] + ' servidos' + (id === win ? '  👑' : ''), { fontFamily: 'VT323', fontSize: '15px', color: id === win ? '#ffd24a' : '#fff3d6' }).setOrigin(0.5).setDepth(D + 1)));
      add(this.add.text(200, 120, win ? '+ S/ ' + PRIZE + ' para ' + mg.nameOf(win) + ' · récord guardado' : 'Nadie debe nada · récord guardado', { fontFamily: 'VT323', fontSize: '13px', color: '#ffd1e0' }).setOrigin(0.5).setDepth(D + 1));
      mg.btn(this, add, 148, 156, 92, 22, '↻ Revancha', 0xffd24a, () => { mg.send('o_again', {}); this.scene.restart(); }, D);
      mg.btn(this, add, 252, 156, 92, 22, '◀ Al mapa', 0xff7aa8, () => G.flow.openMap(), D);
    }
  }
  G.PollosScene = PollosScene;
})();
