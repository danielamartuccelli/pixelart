/* ===========================================================
   scenes/cardjitsu.js — ETAPA 7 · Dojo de San Martín de Porres · Card-jitsu estilo Avatar
   Duelo de cartas Dani vs Sebas. Los dos eligen una carta a la vez (oculta) y se revelan juntas.
   - Elementos: Fuego · Agua · Tierra · Aire. Ciclo: Agua > Fuego > Aire > Tierra > Agua.
     Opuestos (Fuego–Tierra, Agua–Aire) e iguales: gana el mayor PODER (1–8).
   - Chi ⚡ (1 uso por partida): tu carta suma +4 de poder, y el otro no lo sabe hasta que se revela.
   - Ganas con 3 cartas del MISMO elemento o 3 elementos DISTINTOS.
   - Ganador: S/ 10 y +3 puntos de bufanda; el otro +1. Los bufandas se guardan PARA SIEMPRE.
   Lógica pura en jitsu_sim.js (misma semilla en las dos laptops; solo viajan las cartas elegidas).
   Red: j_ready{r} / j_go{seed,gid} / j_pick{n,i,chi}.
   Prueba solo: ?solo=1&me=sebas&go=carjitsu&jauto=1&jgames=2&jbot=normal   (jauto = también juega tu lado)
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H, Q = new URLSearchParams(location.search), J = G.J, mg = G.mg;
  const PRIZE = 10, TL = 14, CW = 40, CH = 52;
  const ID = { 1: 'sebas', 2: 'dani' }, pnOf = id => id === 'sebas' ? 1 : 2;
  const EC = [0xe63946, 0x3a86ff, 0x4fa84a, 0xf2e3a3];                      // fondo por elemento
  const EN = ['🔥', '💧', '⛰', '🌀'];
  const PAL = [[0x7a1018, 0xff5a2a, 0xffd24a], [0x123a8a, 0x3a9bff, 0xcdf0ff], [0x3a2a10, 0x8a6a3a, 0xd1b078], [0x5a5f78, 0xffffff, 0xcfd8e8]];
  const SYM = [
    ['.....oo.....', '....oaao....', '....oaao....', '...oaaaao...', '..ooabbaoo..', '..oaabbaaao.', '.oaabbbbaaoo', '.oaabbbbbaao', '.oaabbbbbaao', '.oaaabbbbaao', '..oaaabbaao.', '..ooaaaaaoo.', '....oooooo..'],
    ['.....oo.....', '....oaao....', '....oaao....', '...oaaaao...', '..oaaaaaao..', '..oabaaaaao.', '.oabaaaaaaao', '.oabaaaaaaao', '.oaaaaaaaaao', '..oaaaaaaoo.', '...ooaaaoo..', '.....ooo....'],
    ['............', '.....oo.....', '....oaao....', '...oaabao...', '..oaabbaao..', '.oaabbbaaao.', '.oaaabbaaaao', 'oaaaaabaaaao', 'oaaabaaabaao', 'oaabbaaaabao', 'oooooooooooo'],
    ['..oooooo....', '.oaaaaaao...', 'oaabbbbaao..', 'oab....oaao.', 'oab.oo.oaao.', 'oaab.oaabo..', '.oaaaabbo...', '..ooobbo....', '.....oabo...', '..ooooaao...', '.oaaaaao....', '..ooooo.....']
  ];
  const OUTL = 0x2b1b30, chx = e => 17 + e * 21;
  const fmtBelt = pts => { const k = J.beltOf(pts); return J.BELTS[k].name; };

  function makeTextures(sc) {
    const mk = (key, w, h, fn) => { if (sc.textures.exists(key)) return; const g = sc.make.graphics({ x: 0, y: 0, add: false }); fn(g); g.generateTexture(key, w, h); g.destroy(); };
    for (let e = 0; e < 4; e++) mk('cj_c' + e, CW, CH, g => {
      g.fillStyle(OUTL).fillRoundedRect(0, 0, CW, CH, 4);
      g.fillStyle(0xfff3d6).fillRoundedRect(1, 1, CW - 2, CH - 2, 3);
      g.fillStyle(EC[e]).fillRoundedRect(3, 3, CW - 6, CH - 6, 2);
      g.fillStyle(0xffffff, 0.22).fillRect(4, 4, CW - 8, 3);
      g.fillStyle(0x000000, 0.18).fillRect(4, CH - 8, CW - 8, 4);
      const rows = SYM[e], pal = PAL[e], x0 = 8, y0 = 15;
      rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle(ch === 'o' ? pal[0] : ch === 'a' ? pal[1] : pal[2]).fillRect(x0 + x * 2, y0 + y * 2, 2, 2); } });
    });
    mk('cj_back', CW, CH, g => {
      g.fillStyle(OUTL).fillRoundedRect(0, 0, CW, CH, 4); g.fillStyle(0xfff3d6).fillRoundedRect(1, 1, CW - 2, CH - 2, 3); g.fillStyle(0x3b2a6b).fillRoundedRect(3, 3, CW - 6, CH - 6, 2);
      g.lineStyle(1, 0xffd24a).strokeRect(6.5, 6.5, CW - 13, CH - 13);
      g.fillStyle(0xffd24a).fillRect(CW / 2 - 1, CH / 2 - 5, 2, 10).fillRect(CW / 2 - 5, CH / 2 - 1, 10, 2);
      g.fillStyle(0xe63946).fillRect(CW / 2 - 2, CH / 2 - 2, 4, 4);
    });
  }

  class CardjitsuScene extends Phaser.Scene {
    constructor() { super('cardjitsu'); }
    create() {
      A.emoteTextures(this.game); G.refreshTextures(); makeTextures(this);
      this.phase = 'lobby'; this.ui = []; this.ready = { me: false, partner: !!G.solo }; this.gid = 0; this.games = 0; this.sim = null; this.picks = {}; this.objs = []; this.hudObjs = [];
      this.mine = pnOf(G.state.me.id); this.opp = 3 - this.mine; this.sel = -1; this.chi = false; this.locked = false; this.tl = TL; this.round = 0; this.hand = []; this.busyT = 0;
      this.jauto = G.solo && Q.get('jauto') === '1'; this.jgames = +Q.get('jgames') || 1; this.botLevel = ['facil', 'normal', 'dificil'].includes(Q.get('jbot')) ? Q.get('jbot') : 'normal';
      this.drawDojo();
      const kb = this.input.keyboard;
      ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].forEach((k, i) => kb.on('keydown-' + k, () => this.select(i)));
      kb.on('keydown-LEFT', () => this.select(Math.max(0, this.sel - 1))); kb.on('keydown-RIGHT', () => this.select(this.sel < 0 ? 0 : Math.min(this.hand.length - 1, this.sel + 1)));
      kb.on('keydown-A', () => this.select(Math.max(0, this.sel - 1))); kb.on('keydown-D', () => this.select(this.sel < 0 ? 0 : Math.min(this.hand.length - 1, this.sel + 1)));
      ['SPACE', 'E'].forEach(k => kb.on('keydown-' + k, () => this.lock())); kb.on('keydown-C', () => this.toggleChi());
      kb.on('keydown-ESC', () => { if (this.phase === 'lobby' || this.phase === 'over') G.flow.openMap(); });
      mg.bind(this, [['j_ready', d => { this.ready.partner = !!d.r; if (this.isHost() && this.phase === 'count' && !this.round) mg.send('j_go', { seed: this.seed, gid: this.gid }); this.tryStart(); if (this.phase === 'lobby' || this.phase === 'over') this.drawPanel(); }],
        ['j_go', d => { if (d.gid > this.gid && (this.phase === 'lobby' || this.phase === 'over')) this.begin(d.seed, d.gid); }],
        ['j_pick', d => this.onPick(d)]]);
      this.drawPanel();
      this.time.addEvent({ delay: 1200, loop: true, callback: () => { if (this.phase === 'lobby' || this.phase === 'over' || this.phase === 'count') mg.send('j_ready', { r: this.ready.me ? 1 : 0, gid: this.gid }); } });
      if (this.jauto) this.time.delayedCall(600, () => { this.ready.me = true; this.tryStart(); });
    }
    isHost() { return G.solo || G.net.role === 'host'; }
    nameOf(p) { return mg.nameOf(ID[p]); }

    /* ---------- dojo ---------- */
    drawDojo() {
      const g = this.add.graphics().setDepth(0);
      A.bands(g, 0, 0, W, 124, [0xe9d9b3, 0xf6ecd2], 6);
      g.lineStyle(1, 0x000000, 0.07); for (let x = 0; x < W; x += 20) g.lineBetween(x, 0, x, 124);
      // vigas
      [0, 96, 200, 296, 392].forEach(x => g.fillStyle(0x6b3a1c).fillRect(x - 3, 0, 8, 124).fillStyle(0x8a5a2a).fillRect(x - 3, 0, 2, 124));
      g.fillStyle(0x6b3a1c).fillRect(0, 0, W, 6).fillRect(0, 118, W, 6).fillStyle(0xb5703a).fillRect(0, 0, W, 2);
      // banderas rojas laterales y pergamino central
      [[22, 0xc9262e], [378, 0xc9262e]].forEach(([x, c]) => { g.fillStyle(OUTL).fillRect(x - 11, 6, 22, 60).fillStyle(c).fillRect(x - 9, 6, 18, 58).fillStyle(0xffd24a).fillRect(x - 9, 6, 18, 2).fillRect(x - 9, 62, 18, 2); });
      // piso tatami
      g.fillStyle(0xb8a46a).fillRect(0, 124, W, 101).lineStyle(1, 0x6b5a2a, 0.5);
      for (let x = 0; x <= W; x += 100) g.lineBetween(x, 124, x, H); g.lineBetween(0, 175, W, 175);
      g.fillStyle(0x3a2a10, 0.5).fillRect(0, 124, W, 3);
      g.fillStyle(0x7fae5a, 0.5).fillRect(0, 124, W, 2);
      if (G.isNight()) this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a6a, 0.22).setDepth(1);
    }
    clearUi() { this.ui.forEach(o => o.destroy()); this.ui = []; }
    clearHud() { this.hudObjs.forEach(o => o.destroy()); this.hudObjs = []; }
    clearObjs() { this.objs.forEach(o => o.destroy()); this.objs = []; }
    beltPts(p) { return G.state.belts[ID[p]] || 0; }

    /* ---------- lobby / resultado ---------- */
    drawPanel(res) {
      this.clearUi(); if (this.phase !== 'lobby' && this.phase !== 'over') return;
      const add = o => { this.ui.push(o); return o; }, D = 9000, lobby = this.phase === 'lobby';
      mg.panel(this, add, 22, 26, 356, 176, D);
      add(A.text(this, 200, 38, lobby ? '🥋 DOJO DE SAN MARTÍN · CARD-JITSU' : (res && res.winner ? '🏆 ¡GANÓ ' + this.nameOf(res.winner).toUpperCase() + '!' : '🤝 EMPATE'), 14, '#ffd24a').setDepth(D + 1));
      const T = (x, y, s, c, fs, w) => add(this.add.text(x, y, s, { fontFamily: 'VT323', fontSize: (fs || 12) + 'px', color: c || '#fff3d6', align: 'center', wordWrap: { width: w || 330 } }).setOrigin(0.5, 0).setDepth(D + 1));
      if (lobby) {
        T(200, 49, 'Cada uno elige una carta en secreto y se revelan juntas. Agua > Fuego > Aire > Tierra > Agua; si no se ganan por elemento, gana el mayor poder. ¡Gana con 3 iguales o 3 elementos distintos!', '#fff3d6', 12);
        T(200, 88, 'Chi ⚡ (1 vez): tu carta suma +4 · Teclas: 1–5, Espacio, C', '#9fe0cf', 12);
      } else {
        T(200, 49, res ? res.line : '', '#fff3d6', 13);
      }
      // bufandas de los dos
      [1, 2].forEach((p, k) => {
        const x = 86 + k * 228, pts = this.beltPts(p), bi = J.beltOf(pts), b = J.BELTS[bi], nx = J.BELTS[bi + 1];
        add(this.add.sprite(x, 150, 'char_' + (p === this.mine ? 'me' : 'partner'), 'd0').setOrigin(0.5, 1).setScale(1.7).setDepth(D + 1));
        this.beltOnChar(add, x, 150, bi, D + 2);
        T(x, 152, this.nameOf(p) + ' · ' + pts + ' pts', '#ffffff', 12, 124);
        T(x, 164, b.name + (nx ? ' · sig. ' + nx.pts : ' ★'), b.color, 12, 124);
        if (res && res.gain && res.gain[p] !== undefined) T(x, 74, '+' + res.gain[p] + ' pts' + (res.up && res.up[p] ? '\n¡Nueva bufanda: ' + J.BELTS[J.beltOf(pts)].name + '!' : ''), res.up && res.up[p] ? '#ffe58a' : '#9fe0cf', 12, 128);
      });
      const label = this.ready.me ? '✔ ¡Listo!' : (lobby ? '¡Estoy listo!' : '↻ Revancha');
      mg.btn(this, add, 200, 120, 104, 20, label, this.ready.me ? 0x7fd1ae : 0xff7aa8, () => { this.ready.me = !this.ready.me; mg.send('j_ready', { r: this.ready.me ? 1 : 0, gid: this.gid }); this.drawPanel(res); this.tryStart(); }, D, 14);
      add(this.add.text(200, 134, G.solo ? G.state.partner.name + ' (bot) 🤖: listo' : G.state.partner.name + (this.ready.partner ? ': ✔ listo' : ': esperando…'), { fontFamily: 'VT323', fontSize: '11px', color: '#c9c4ff' }).setOrigin(0.5, 0).setDepth(D + 1));
      mg.btn(this, add, 344, 188, 62, 18, '◀ Mapa', 0xffffff, () => G.flow.openMap(), D, 12);
    }
    beltOnChar(add, x, feetY, bi, depth) {   // bufanda al cuello
      const g = add(this.add.graphics().setDepth(depth)), b = J.BELTS[bi], dk = bi === 5 ? OUTL : A.lerpC(b.hex, 0x000000, 0.25);
      g.fillStyle(OUTL).fillRect(x - 10, feetY - 26, 20, 7).fillStyle(b.hex).fillRect(x - 9, feetY - 25, 18, 4).fillStyle(dk).fillRect(x - 9, feetY - 22, 18, 1);
      if (bi === 5) g.fillStyle(0xffe58a).fillRect(x - 9, feetY - 25, 18, 1);
      g.fillStyle(OUTL).fillRect(x + 2, feetY - 21, 7, 14).fillStyle(b.hex).fillRect(x + 3, feetY - 20, 5, 12).fillStyle(dk).fillRect(x + 3, feetY - 10, 5, 2);
    }
    tryStart() {
      if (!this.isHost() || !(this.phase === 'lobby' || this.phase === 'over') || !this.ready.me || !this.ready.partner) return;
      const seed = Math.floor(Math.random() * 2 ** 31), gid = this.gid + 1;
      mg.send('j_go', { seed, gid }); this.begin(seed, gid);
    }

    /* ---------- partida ---------- */
    begin(seed, gid) {
      this.clearUi(); this.clearObjs(); this.clearHud(); this.seed = seed; this.gid = gid; this.sim = new J.Sim(seed); this.picks = {}; this.round = 0; this.beltDone = false;
      this.ready = { me: false, partner: !!G.solo }; this.phase = 'count'; this.busyT = 1.6; this.msgT && this.msgT.destroy();
      this.msgT = A.text(this, 200, 100, '¡COMBATE!', 24, '#ffffff', { stroke: '#c9262e', strokeThickness: 4 }).setDepth(8000);
      G.audio.sfx('ok'); this.drawHudStatic();
    }
    drawHudStatic() {
      const add = o => { this.hudObjs.push(o); return o; };
      const nm = (p, x, y, al) => add(this.add.text(x, y, '', { fontFamily: 'VT323', fontSize: '14px', color: '#2b1b30', stroke: '#fff3d6', strokeThickness: 3 }).setOrigin(al, 0).setDepth(20));
      this.nameOpp = nm(this.opp, 6, 29, 0); this.nameMe = nm(this.mine, 6, 135, 0);
      this.beltG = add(this.add.graphics().setDepth(20));
      this.roundT = add(this.add.text(344, 33, '', { fontFamily: 'VT323', fontSize: '16px', color: '#2b1b30', stroke: '#fff3d6', strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(20));
      this.timeG = add(this.add.graphics().setDepth(20));
      this.infoT = add(this.add.text(200, 128, '', { fontFamily: 'VT323', fontSize: '14px', color: '#ffffff', stroke: '#2b1b30', strokeThickness: 3, align: 'center', wordWrap: { width: 200 }, lineSpacing: -3 }).setOrigin(0.5, 0).setDepth(30));
      this.collG = add(this.add.graphics().setDepth(19)); this.collT = [];
      for (const [pl, y] of [[this.opp, 48], [this.mine, 154]]) for (let e = 0; e < 4; e++) { const t = add(this.add.text(chx(e), y + 29, '', { fontFamily: 'VT323', fontSize: '13px', color: '#ffffff', stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(21)); this.collT.push({ pl, e, t }); add(this.add.image(chx(e), y + 12, 'cj_c' + e).setScale(0.5).setDepth(20).setAlpha(0.95)); }
      // botón Chi y jugar
      this.chiBtn = []; this.refreshSide();
    }
    refreshSide() {
      if (!this.sim) return;
      this.nameOpp.setText(this.nameOf(this.opp)); this.nameMe.setText(this.nameOf(this.mine));
      this.beltG.clear(); [[this.opp, 29, this.nameOpp], [this.mine, 135, this.nameMe]].forEach(([p, y, nt]) => { const b = J.BELTS[J.beltOf(this.beltPts(p))], x = nt.x + nt.width + 5; this.beltG.fillStyle(OUTL).fillRect(x, y + 3, 16, 9).fillStyle(b.hex).fillRect(x + 1, y + 4, 14, 7); });
      this.roundT.setText(this.phase === 'count' ? '' : 'Ronda ' + Math.max(1, this.round));
      this.collT.forEach(({ pl, e, t }) => { const n = this.sim.won[pl].filter(c => c.e === e).length; t.setText(n ? '×' + n : '').setColor(n >= 3 ? '#ffe58a' : '#ffffff'); });
      this.drawChiBtn();
    }
    drawChiBtn() {
      this.chiBtn.forEach(o => o.destroy()); this.chiBtn = []; if (!this.sim || this.phase === 'over') return;
      const add = o => { this.chiBtn.push(o); return o; }, usable = this.sim.chi[this.mine], on = this.chi && usable;
      mg.btn(this, add, 352, 150, 80, 20, usable ? (on ? '⚡ Chi: ¡ACTIVO!' : '⚡ Chi +4 (1)') : '⚡ Chi usado', usable ? (on ? 0xffd24a : 0xbfeaff) : 0xb8b8b8, () => this.toggleChi(), 40, 13);
      mg.btn(this, add, 352, 176, 80, 20, this.locked ? '✔ esperando…' : '¡Jugar!', this.locked ? 0x7fd1ae : 0xff7aa8, () => this.lock(), 40, 14);
      const m = this.sim.won[this.mine], o = this.sim.won[this.opp];
      add(this.add.text(352, 56, 'Gana: 3 iguales\no 3 distintos', { fontFamily: 'VT323', fontSize: '12px', color: '#2b1b30', stroke: '#fff3d6', strokeThickness: 3, align: 'center' }).setOrigin(0.5, 0).setDepth(20));
      void m; void o;
    }
    toggleChi() { if (this.phase !== 'pick' || this.locked || !this.sim.chi[this.mine]) return; this.chi = !this.chi; G.audio.sfx('click'); this.drawChiBtn(); this.drawHand(); }

    startRound() {
      this.round = this.sim.round + 1; this.phase = 'pick'; this.sel = -1; this.chi = false; this.locked = false; this.tl = TL; this.msgT && this.msgT.destroy(); this.msgT = null;
      this.clearObjs(); this.drawHand(); this.drawOppBacks(); this.infoT.setText('Elige una carta'); this.refreshSide();
      const pk = this.picks[this.round] = this.picks[this.round] || {};
      if (G.solo && !pk[this.opp]) this.time.delayedCall(1500 + Math.random() * 2500, () => { if (this.phase !== 'pick') return; const bp = J.botPick(this.sim, this.opp, this.botLevel); this.picks[this.round][this.opp] = { i: bp.i, chi: bp.chi }; this.checkReveal(); });
      if (this.jauto) this.time.delayedCall(700, () => { if (this.phase !== 'pick' || this.locked) return; const bp = J.botPick(this.sim, this.mine, 'normal'); this.sel = bp.i; this.chi = bp.chi && this.sim.chi[this.mine]; this.lock(); });
      this.checkReveal();
    }
    cardObj(x, y, card, scale, depth) {
      const c = this.add.container(x, y).setDepth(depth || 10);
      const img = this.add.image(0, 0, card ? 'cj_c' + card.e : 'cj_back'); c.add(img); c.img = img;
      if (card) {
        const t = this.add.text(-CW / 2 + 5, -CH / 2 + 3, '' + card.p, { fontFamily: 'VT323', fontSize: '17px', color: '#ffffff', stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0, 0); c.add(t); c.num = t;
      }
      c.setScale(scale || 1); return c;
    }
    drawHand() {
      (this.handObjs || []).forEach(o => o.destroy()); this.handObjs = []; this.hand = this.sim.hand[this.mine].slice(); const n = this.hand.length;
      this.hand.forEach((card, i) => {
        const x = 202 + (i - (n - 1) / 2) * 45, sel = this.sel === i, y = 178 + (sel ? -9 : 0);
        const c = this.cardObj(x, y, card, 1, 12 + i); this.handObjs.push(c);
        if (sel) { const r = this.add.rectangle(x, y, CW + 4, CH + 4).setStrokeStyle(2, this.chi && this.sim.chi[this.mine] ? 0xffd24a : 0xffffff).setDepth(11); this.handObjs.push(r); }
        if (this.chi && sel && this.sim.chi[this.mine]) c.num.setText(card.p + '→' + (card.p + J.CHI)).setColor('#ffe58a');
        const z = this.add.zone(x, y, CW, CH).setInteractive({ useHandCursor: true }).setDepth(14).on('pointerdown', () => { if (this.sel === i) this.lock(); else this.select(i); }); this.handObjs.push(z);
      });
    }
    drawOppBacks() {
      (this.oppObjs || []).forEach(o => o.destroy()); this.oppObjs = []; const n = this.sim.hand[this.opp].length;
      for (let i = 0; i < n; i++) this.oppObjs.push(this.cardObj(200 + (i - (n - 1) / 2) * 34, 47, null, 0.62, 10));
    }
    select(i) { if (this.phase !== 'pick' || this.locked || i < 0 || i >= this.sim.hand[this.mine].length) return; if (this.sel !== i) G.audio.sfx('click'); this.sel = i; this.drawHand(); }
    lock() {
      if (G.typing || G.modalOpen || this.phase !== 'pick' || this.locked || this.sel < 0) return;
      this.locked = true; const chi = this.chi && this.sim.chi[this.mine];
      this.picks[this.round][this.mine] = { i: this.sel, chi: !!chi }; mg.send('j_pick', { n: this.round, i: this.sel, chi: chi ? 1 : 0 });
      G.audio.sfx('pop'); this.infoT.setText('Esperando a ' + this.nameOf(this.opp) + '…'); this.drawChiBtn();
      // la carta elegida sube a la arena (boca abajo)
      (this.handObjs || []).forEach(o => o.destroy()); this.handObjs = [];
      this.myArena = this.cardObj(238, 98, null, 1, 12); this.objs.push(this.myArena);
      this.checkReveal();
    }
    onPick(d) { const pk = this.picks[d.n] = this.picks[d.n] || {}; pk[this.opp] = { i: d.i, chi: !!d.chi }; if (this.phase === 'pick' && d.n === this.round) this.checkReveal(); }
    checkReveal() { const pk = this.picks[this.round]; if (this.phase === 'pick' && pk && pk[this.mine] && pk[this.opp]) this.reveal(pk); }

    reveal(pk) {
      this.phase = 'reveal'; (this.handObjs || []).forEach(o => o.destroy()); this.handObjs = [];
      const pick = { 1: pk[1], 2: pk[2] }; pick[this.mine] = pk[this.mine]; pick[this.opp] = pk[this.opp];
      const out = this.sim.play(pick[1].i, pick[2].i, pick[1].chi, pick[2].chi);
      const oc = out.card[this.opp], mc = out.card[this.mine];
      (this.oppObjs || []).forEach(o => o.destroy()); this.oppObjs = [];
      if (this.myArena) this.myArena.destroy();
      const A1 = this.cardObj(162, 98, null, 1, 12), A2 = this.cardObj(238, 98, null, 1, 12); this.objs.push(A1, A2);
      const flip = (c, card, chi, delay) => this.time.delayedCall(delay, () => this.tweens.add({ targets: c, scaleX: 0, duration: 140, onComplete: () => { c.img.setTexture('cj_c' + card.e); if (!c.num) { c.num = this.add.text(-CW / 2 + 5, -CH / 2 + 3, '' + card.p, { fontFamily: 'VT323', fontSize: '17px', color: '#ffffff', stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0, 0); c.add(c.num); } if (chi) { const b = this.add.text(0, -CH / 2 - 2, '⚡ +4', { fontFamily: 'VT323', fontSize: '14px', color: '#ffe58a', stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0.5, 1); c.add(b); } G.audio.sfx('hit'); this.tweens.add({ targets: c, scaleX: 1, duration: 140 }); } }));
      flip(A1, oc, out.chi[this.opp], 300); flip(A2, mc, out.chi[this.mine], 700);
      this.vs = A.text(this, 200, 98, 'VS', 16, '#c9262e', { stroke: '#fff3d6', strokeThickness: 3 }).setDepth(13); this.objs.push(this.vs);
      this.infoT.setText('');
      this.time.delayedCall(1300, () => this.showClash(out, A1, A2));
    }
    reasonOf(out) {
      const a = out.pw[this.mine], b = out.pw[this.opp], N = J.ELEMS;
      if (!out.winner) return 'Empate: ' + N[a.e] + ' ' + a.p + ' vs ' + N[b.e] + ' ' + b.p + ' — nadie se lleva la carta';
      const w = out.pw[out.winner], l = out.pw[3 - out.winner];
      const el = (a.e !== b.e && (J.BEATS[w.e] === l.e)) ? N[w.e] + ' vence a ' + N[l.e] : (w.e === l.e ? 'Mismo elemento: gana el poder (' + w.p + ' vs ' + l.p + ')' : 'Elementos opuestos: gana el poder (' + w.p + ' vs ' + l.p + ')');
      return (out.winner === this.mine ? '¡Ganaste la ronda! ' : this.nameOf(out.winner) + ' gana la ronda. ') + el;
    }
    showClash(out, A1, A2) {
      this.infoT.setText(this.reasonOf(out)); if (out.winner === this.mine) G.audio.sfx('win'); else if (out.winner) G.audio.sfx('heart');
      const wc = out.winner ? (out.winner === this.mine ? A2 : A1) : null;
      if (wc) { this.tweens.add({ targets: wc, scale: 1.2, duration: 160, yoyo: true, repeat: 1 }); }
      this.time.delayedCall(1500, () => {
        if (wc) { const ox = chx(out.card[out.winner].e), oy = (out.winner === this.mine ? 154 : 48) + 12; this.tweens.add({ targets: wc, x: ox, y: oy, scale: 0.5, duration: 420, ease: 'Cubic.easeIn' }); }
        this.time.delayedCall(wc ? 500 : 100, () => { this.refreshSide(); if (out.over) this.endMatch(out.over); else this.startRound(); });
      });
    }

    endMatch(over) {
      this.phase = 'over'; this.games++; this.clearObjs(); (this.handObjs || []).forEach(o => o.destroy()); this.handObjs = []; (this.oppObjs || []).forEach(o => o.destroy()); this.oppObjs = [];
      const w = over.winner, res = { winner: w, gain: {}, up: {}, line: '' };
      res.gain = { 1: w ? (w === 1 ? 3 : 1) : 1, 2: w ? (w === 2 ? 3 : 1) : 1 };
      if (!this.beltDone) {
        this.beltDone = true;
        G.awardBelts(this.seed, { sebas: res.gain[1], dani: res.gain[2] });
        if (this.isHost() && w) { G.addSoles(ID[w], PRIZE); G.recordWin('carjitsu', ID[w], 0); }
      }
      [1, 2].forEach(p => { res.up[p] = J.beltOf(this.beltPts(p)) > J.beltOf(this.beltPts(p) - res.gain[p]); });
      if (res.up[this.mine]) { const lk = G.state.me.look; if (lk) { lk.acc = lk.acc || {}; lk.acc.belt = J.beltOf(this.beltPts(this.mine)); G.save(); G.bus.emit('look'); } }
      if (w) {
        const won = this.sim.won[w], n = [0, 0, 0, 0]; won.forEach(c => n[c.e]++); const trio = n.findIndex(x => x >= 3);
        res.line = over.why === 'elementos' ? (trio >= 0 ? 'Juntó 3 cartas de ' + J.ELEMS[trio] + ' · +S/ ' + PRIZE : 'Juntó 3 elementos distintos · +S/ ' + PRIZE) : 'Se acabaron las cartas: ganó con más cartas · +S/ ' + PRIZE;
        G.audio.sfx(w === this.mine ? 'win' : 'heart');
      } else res.line = 'Se acabaron las cartas y quedaron igualados';
      this.ready = { me: false, partner: !!G.solo }; this.refreshSide(); this.drawPanel(res);
      if (this.jauto && this.games < this.jgames) this.time.delayedCall(1200, () => { this.ready.me = true; this.drawPanel(res); this.tryStart(); });
    }

    update(t, dtms) {
      const dt = Math.min(0.1, dtms / 1000);
      if (this.phase === 'count') { this.busyT -= dt; if (this.busyT <= 0) this.startRound(); return; }
      if (this.phase !== 'pick') { if (this.timeG) this.timeG.clear(); return; }
      if (!this.locked) { this.tl -= dt; if (this.tl <= 0) { if (this.sel < 0) this.sel = Math.floor(Math.random() * this.sim.hand[this.mine].length); G.ui.toast && G.ui.toast('⏰ Se acabó el tiempo: se jugó una carta'); this.lock(); } }
      const f = Math.max(0, this.tl / TL); this.timeG.clear();
      this.timeG.fillStyle(0x15122e, 0.85).fillRoundedRect(300, 106, 100, 12, 4).fillStyle(this.locked ? 0x7fd1ae : (f > 0.3 ? 0xffd24a : 0xff3b3b)).fillRect(303, 109, 94 * (this.locked ? 1 : f), 6);
    }
  }
  G.CardjitsuScene = CardjitsuScene;
})();
