/* ===========================================================
   scenes/conecta4.js — ETAPA 7 · Cuatro en raya (mesa del igloo)
   Por turnos, 7x6. Sebas = fichas ROJAS (1) · Dani = fichas AMARILLAS (2).
   - Mover: flechas ←/→ o el mouse · soltar: ↓ / Espacio / E / click.
   - Reloj de 20 s por turno: si se acaba, se suelta una ficha sola (que no se duerma nadie).
   - El CONTADOR GLOBAL (cuántas veces gana cada uno) nunca se cierra: se guarda en los récords y se ve arriba en el HUD.
   - Empieza el que PERDIÓ la partida anterior; en empate, alterna.
   - No mueve soles (se puede jugar sin parar); gana el contador.
   Red: f_ready{r} / f_go{first,gid} / f_mv{col,n}. Gana y anota solo el anfitrión (o el modo solo).
   Prueba solo: ?solo=1&me=sebas&go=conecta4&fauto=1&fgames=3   (la pareja es un bot; fauto = también juega tu lado)
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H, Q = new URLSearchParams(location.search), C = G.C4, mg = G.mg;
  const CELL = 22, BX = 123, BY = 60, COLS = C.COLS, ROWS = C.ROWS, TURN_S = 20;
  const COL = { 1: 0xe63946, 2: 0xffd24a }, DARK = { 1: 0x8a1c26, 2: 0xb8860b }, ID = { 1: 'sebas', 2: 'dani' };
  const cx = c => BX + 11 + c * CELL, cy = r => BY + 11 + r * CELL;
  const pnOf = id => id === 'sebas' ? 1 : 2;

  function makeTextures(sc) {
    const mk = (key, w, h, fn) => { if (sc.textures.exists(key)) return; const g = sc.make.graphics({ x: 0, y: 0, add: false }); fn(g); g.generateTexture(key, w, h); g.destroy(); };
    [1, 2].forEach(p => mk('c4_d' + p, 20, 20, g => {
      const disc = (r, color) => { g.fillStyle(color); for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r + 0.5 - dy * dy)); g.fillRect(10 - hw, 10 + dy, hw * 2 + 1, 1); } };
      disc(9, DARK[p]); disc(8, COL[p]); disc(5, DARK[p]); disc(4, COL[p]);
      g.fillStyle(0xffffff, 0.55).fillRect(4, 4, 2, 2).fillRect(6, 3, 2, 1);
    }));
    if (!sc.textures.exists('c4_board')) {
      const w = 162, h = 140, tex = sc.textures.createCanvas('c4_board', w, h), ctx = tex.getContext();
      ctx.fillStyle = '#1f3f9a'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2f5fd0'; ctx.fillRect(2, 2, w - 4, h - 4);
      ctx.fillStyle = '#4a7bef'; ctx.fillRect(2, 2, w - 4, 2);
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
        const hx = 4 + 11 + c * CELL, hy = 4 + 11 + r * CELL;
        ctx.fillStyle = '#1f3f9a'; for (let y = -11; y <= 11; y++) for (let x = -11; x <= 11; x++) if (x * x + y * y <= 121) ctx.fillRect(hx + x, hy + y, 1, 1);
        for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) if (x * x + y * y <= 100) ctx.clearRect(hx + x, hy + y, 1, 1);
      }
      tex.refresh();
    }
  }

  class Conecta4Scene extends Phaser.Scene {
    constructor() { super('conecta4'); }
    create() {
      A.emoteTextures(this.game); G.refreshTextures(); makeTextures(this);
      this.phase = 'wait'; this.board = C.empty(); this.turn = 1; this.moves = []; this.busy = false; this.tl = TURN_S; this.col = 3; this.gid = 0; this.games = 0;
      this.ready = { me: true, partner: !!G.solo }; this.discs = []; this.ui = []; this.streak = { id: null, n: 0 }; this.botT = 0; this.autoT = 0; this.winLine = null;
      const r = G.state.records.games.connect4; this.nextFirst = (r.sebas + r.dani) % 2 ? 2 : 1;
      this.me1 = pnOf(G.state.me.id); this.fauto = G.solo && Q.get('fauto') === '1'; this.fgames = +Q.get('fgames') || 1;
      this.drawRoom(); this.drawBoardFrame(); this.drawSide();
      this.prev = this.add.image(cx(this.col), BY - 14, 'c4_d1').setDepth(5).setVisible(false);
      const kb = this.input.keyboard;
      kb.on('keydown-LEFT', () => this.moveCol(-1)); kb.on('keydown-A', () => this.moveCol(-1)); kb.on('keydown-RIGHT', () => this.moveCol(1)); kb.on('keydown-D', () => this.moveCol(1));
      ['DOWN', 'SPACE', 'E', 'S'].forEach(k => kb.on('keydown-' + k, () => this.tryDrop(this.col)));
      kb.on('keydown-ESC', () => this.leave());
      this.zone = this.add.zone(BX + 77, BY + 66, 154, 150).setInteractive({ useHandCursor: true }).setDepth(6);
      this.zone.on('pointermove', p => { this.col = Phaser.Math.Clamp(Math.floor((p.worldX - BX) / CELL), 0, COLS - 1); });
      this.zone.on('pointerdown', p => { this.col = Phaser.Math.Clamp(Math.floor((p.worldX - BX) / CELL), 0, COLS - 1); this.tryDrop(this.col); });
      mg.bind(this, [['f_ready', d => this.onReady(d)], ['f_go', d => this.onGo(d)], ['f_mv', d => this.onMove(d)]]);
      this.time.addEvent({ delay: 1200, loop: true, callback: () => { if (this.phase === 'wait' || this.phase === 'over' || (this.phase === 'play' && !this.moves.length && !this.isHost())) mg.send('f_ready', { r: this.ready.me ? 1 : 0, gid: this.gid }); } });
      this.refreshSide(); this.drawBtns(false);
      this.time.delayedCall(500, () => this.tryStart());
    }
    isHost() { return G.solo || G.net.role === 'host'; }

    /* ---------- dibujo ---------- */
    drawRoom() {
      const g = this.add.graphics().setDepth(0);
      A.bands(g, 0, 0, W, 150, [0x23204f, 0x3b3a7a], 6);
      for (let i = 0; i < 26; i++) g.fillStyle(0xffffff, 0.4 + (i % 3) * 0.2).fillRect((i * 53) % W, 6 + (i * 17) % 100, 1, 1);
      g.fillStyle(0x6b4a2a).fillRect(0, 150, W, 75).fillStyle(0x8a6238).fillRect(0, 150, W, 4).lineStyle(1, 0x000000, 0.15); for (let x = 0; x < W; x += 36) g.lineBetween(x, 154, x - 12, H);
      g.fillStyle(0x000000, 0.25).fillEllipse(BX + 79, 198, 168, 14);
      g.fillStyle(0x1f3f9a).fillRect(BX + 10, 192, 8, 14).fillRect(BX + 140, 192, 8, 14);
    }
    drawBoardFrame() {
      this.board_img = this.add.image(BX - 4, BY - 4, 'c4_board').setOrigin(0, 0).setDepth(3);
      this.hl = this.add.graphics().setDepth(4);
    }
    drawSide() {
      const g = this.add.graphics().setDepth(1);
      [[1, 36], [2, 92]].forEach(([p, y]) => {
        g.fillStyle(0x15122e, 0.85).fillRoundedRect(6, y, 108, 50, 6).lineStyle(2, COL[p]).strokeRoundedRect(6, y, 108, 50, 6);
        this.add.image(22, y + 14, 'c4_d' + p).setDepth(2);
      });
      this.nameT = {}; this.winT = {}; this.turnT = {};
      [1, 2].forEach(p => {
        const y = p === 1 ? 36 : 92;
        this.nameT[p] = this.add.text(38, y + 6, '', { fontFamily: 'VT323', fontSize: '15px', color: '#ffffff' }).setDepth(2);
        this.winT[p] = this.add.text(12, y + 28, '', { fontFamily: 'VT323', fontSize: '13px', color: '#ffe58a' }).setDepth(2);
        this.turnT[p] = this.add.text(106, y + 4, '', { fontFamily: 'VT323', fontSize: '16px', color: '#ffe58a' }).setOrigin(1, 0).setDepth(2);
      });
      // panel derecho: marcador global + reloj
      const g2 = this.add.graphics().setDepth(1);
      g2.fillStyle(0x15122e, 0.85).fillRoundedRect(290, 36, 104, 64, 6).lineStyle(2, 0xffd24a).strokeRoundedRect(290, 36, 104, 64, 6);
      this.add.text(342, 40, 'MARCADOR GLOBAL', { fontFamily: 'VT323', fontSize: '13px', color: '#ffd24a' }).setOrigin(0.5, 0).setDepth(2);
      this.glob = this.add.text(342, 55, '', { fontFamily: 'VT323', fontSize: '15px', color: '#ffffff', align: 'center', lineSpacing: -2 }).setOrigin(0.5, 0).setDepth(2);
      this.add.text(342, 87, 'nunca se cierra ♾', { fontFamily: 'VT323', fontSize: '11px', color: '#9fa0d0' }).setOrigin(0.5, 0).setDepth(2);
      this.timerG = this.add.graphics().setDepth(2);
      this.msg = this.add.text(342, 124, '', { fontFamily: 'VT323', fontSize: '14px', color: '#ffffff', align: 'center', wordWrap: { width: 100 } }).setOrigin(0.5, 0).setDepth(7);
      this.hint = this.add.text(10, 156, '← → mover\n↓ o click: soltar\nESC: al igloo', { fontFamily: 'VT323', fontSize: '12px', color: '#c9c4ff', wordWrap: { width: 104 } }).setDepth(2);
      this.streakT = this.add.text(342, 146, '', { fontFamily: 'VT323', fontSize: '14px', color: '#ffb36b', align: 'center', wordWrap: { width: 100 } }).setOrigin(0.5, 0).setDepth(7);
      this.btns = [];
    }
    nameOf(p) { return mg.nameOf(ID[p]); }
    refreshSide() {
      const r = G.state.records.games.connect4;
      [1, 2].forEach(p => {
        this.nameT[p].setText(this.nameOf(p)); this.winT[p].setText('Gana ' + r[ID[p]] + (r[ID[p]] === 1 ? ' vez' : ' veces'));
        this.turnT[p].setText(this.phase === 'play' && this.turn === p ? '◀' : '');
      });
      this.glob.setText('🔴 ' + this.nameOf(1) + ': ' + r.sebas + '\n🟡 ' + this.nameOf(2) + ': ' + r.dani);
      const s = this.streak; this.streakT.setText(s.n >= 2 ? '🔥 ' + mg.nameOf(s.id) + ': ' + s.n + ' seguidas' : '');
    }
    clearBtns() { this.btns.forEach(o => o.destroy()); this.btns = []; }
    drawBtns(over) {
      this.clearBtns(); const add = o => { this.btns.push(o); return o; };
      if (over) mg.btn(this, add, 342, 164, 96, 20, this.ready.me ? '✔ esperando…' : '↻ Revancha', this.ready.me ? 0x7fd1ae : 0xffd24a, () => { if (this.ready.me) return; this.ready.me = true; mg.send('f_ready', { r: 1, gid: this.gid }); this.drawBtns(true); this.tryStart(); }, 8, 14);
      mg.btn(this, add, 342, 188, 96, 20, '◀ Al igloo', 0xff7aa8, () => this.leave(), 8, 14);
    }
    leave() { G.travel('igloo', { place: G.state.place }); }

    /* ---------- flujo ---------- */
    onReady(d) {
      this.ready.partner = !!d.r;
      if (this.isHost() && this.phase === 'play' && !this.moves.length) mg.send('f_go', { first: this.first, gid: this.gid });   // el invitado llegó tarde
      this.tryStart();
    }
    tryStart() {
      if (!this.isHost() || this.phase === 'play') return;
      if (this.ready.me && this.ready.partner) { const first = this.nextFirst; mg.send('f_go', { first, gid: this.gid + 1 }); this.startGame(first, this.gid + 1); }
    }
    onGo(d) { if (d.gid > this.gid) this.startGame(d.first, d.gid); }
    startGame(first, gid) {
      this.gid = gid; this.first = first; this.turn = first; this.board = C.empty(); this.moves = []; this.busy = false; this.winLine = null; this.tl = TURN_S;
      this.discs.forEach(d => d.destroy()); this.discs = []; this.hl.clear(); this.clearBtns(); this.msg.setText('');
      this.ready = { me: false, partner: !!G.solo }; this.phase = 'play'; this.botT = 0.6; this.autoT = 0.5; this.col = 3;
      G.audio.sfx('ok'); this.refreshSide(); this.say(this.turn === this.me1 ? '¡Tu turno!' : 'Turno de ' + this.nameOf(this.turn));
    }
    say(t) { this.msg.setText(t); }
    myTurn() { return this.phase === 'play' && !this.busy && this.turn === this.me1; }
    moveCol(d) { this.col = Phaser.Math.Clamp(this.col + d, 0, COLS - 1); G.audio.sfx('click'); }
    tryDrop(c) {
      if (G.typing || G.modalOpen || !this.myTurn() || !C.canDrop(this.board, c)) return;
      this.place(c, true);
    }
    onMove(d) { if (this.phase === 'play' && d.n === this.moves.length && this.turn !== this.me1 && !this.busy) this.place(d.col, false); }

    place(c, local) {
      const p = this.turn, r = C.drop(this.board, c, p); if (r < 0) return;
      this.moves.push(c); if (local) mg.send('f_mv', { col: c, n: this.moves.length - 1 });
      const d = this.add.image(cx(c), BY - 14, 'c4_d' + p).setDepth(2); this.discs.push(d); this.busy = true;
      this.tweens.add({ targets: d, y: cy(r), duration: 120 + r * 60 + 80, ease: 'Bounce.easeOut', onComplete: () => { G.audio.sfx('pop'); this.afterDrop(p); } });
    }
    afterDrop(p) {
      this.busy = false;
      const w = C.winner(this.board);
      if (w) return this.endGame(w.p, w.line);
      if (C.full(this.board)) return this.endGame(0, null);
      this.turn = 3 - p; this.tl = TURN_S; this.botT = 0.7 + Math.random() * 0.7; this.autoT = 0.5;
      this.say(this.turn === this.me1 ? '¡Tu turno!' : 'Turno de ' + this.nameOf(this.turn)); this.refreshSide();
    }
    endGame(w, line) {
      this.phase = 'over'; this.games++; this.winLine = line;
      if (w) {
        const id = ID[w]; this.streak = this.streak.id === id ? { id, n: this.streak.n + 1 } : { id, n: 1 };
        this.nextFirst = 3 - w;                                // empieza el que perdió
        if (this.isHost()) G.recordWin('connect4', id, 0);
        this.say('🏆 ¡Ganó ' + this.nameOf(w) + '!'); G.audio.sfx(w === this.me1 ? 'win' : 'heart');
        line.forEach(([c, r], i) => { const s = this.add.circle(cx(c), cy(r), 12, 0xffffff, 0).setStrokeStyle(2, 0xffffff).setDepth(4); this.tweens.add({ targets: s, alpha: { from: 1, to: 0.2 }, duration: 350, yoyo: true, repeat: -1, delay: i * 60 }); this.discs.push(s); });
      } else { this.streak = { id: null, n: 0 }; this.nextFirst = 3 - this.first; this.say('Empate: tablero lleno'); }
      this.ready = { me: false, partner: !!G.solo }; this.refreshSide(); this.drawBtns(true);
      if (this.fauto && this.games < this.fgames) this.time.delayedCall(900, () => { this.ready.me = true; this.drawBtns(true); this.tryStart(); });
    }

    update(t, dtms) {
      const dt = Math.min(0.1, dtms / 1000);
      const show = this.myTurn(); this.prev.setVisible(show); if (show) this.prev.setTexture('c4_d' + this.me1).setPosition(cx(this.col), BY - 14);
      this.timerG.clear();
      if (this.phase !== 'play') return;
      if (!this.busy) this.tl = Math.max(0, this.tl - dt);
      const f = this.tl / TURN_S, tg = this.timerG;
      tg.fillStyle(0x15122e, 0.85).fillRoundedRect(290, 106, 104, 14, 4).fillStyle(f > 0.3 ? COL[this.turn] : 0xff3b3b).fillRect(293, 109, 98 * f, 8);
      // auto-juego: tu lado (pruebas) o tiempo agotado
      if (this.turn === this.me1 && !this.busy) {
        if (this.fauto) { this.autoT -= dt; if (this.autoT <= 0) this.place(C.bestMove(this.board, this.me1, 3), true); }
        else if (this.tl <= 0) { G.ui.toast && G.ui.toast('⏰ Se acabó el tiempo: se soltó una ficha sola'); this.place(C.bestMove(this.board, this.me1, 2), true); }
      }
      // pareja simulada (modo solo)
      if (G.solo && this.turn !== this.me1 && !this.busy) { this.botT -= dt; if (this.botT <= 0) this.place(C.bestMove(this.board, this.turn, 4), false); }
    }
  }
  G.Conecta4Scene = Conecta4Scene;
})();
