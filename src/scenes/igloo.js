/* ===========================================================
   scenes/igloo.js — la casa (hub): igloo de Daniela / igloo de Sebas
   Misma sala con dos "pieles". Aquí: clóset, espejo, cama, mesa de
   cuatro en raya y la salida al mapa. Movimiento sincronizado.
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H;
  const SKIN = {
    dani:  { wall: 0xe9dcff, line: 0xcdb8f2, dark: 0x6a4aa8, accent: 0xb07cff, accent2: 0xff9fd0, rug: 0xffb3d9, floor: 0xd9e8ff, title: 'Igloo de Daniela' },
    sebas: { wall: 0xd9f1ff, line: 0xb5dcf2, dark: 0x2c5f8a, accent: 0x4aa6ff, accent2: 0x5fd1b0, rug: 0x9fe0cf, floor: 0xd2eaff, title: 'Casa de Sebas' },
    both:  { wall: 0xe4e0ff, line: 0xc6c0f0, dark: 0x4a3a98, accent: 0x8a7cff, accent2: 0x5fd1b0, rug: 0xffb3d9, floor: 0xd9e4ff, title: 'Igloo de Dani y Sebas' }
  };
  const BOUNDS = { x0: 22, x1: 378, y0: 114, y1: 216 };
  const SPEED = 66;

  class IglooScene extends Phaser.Scene {
    constructor() { super('igloo'); }
    init(d) { this.place = (d && d.place) || G.state.place || G.BASE; this.owner = G.PLACES[this.place].owner; }

    create() {
      G.state.place = this.place;
      A.emoteTextures(this.game); G.refreshTextures();
      this.night = G.isNight(); this.sk = SKIN[this.owner];
      this.colliders = [[296, 148, 70, 40], [88, 108, 22, 14], [38, 172, 30, 18]];
      this.drawRoom();
      this.makeInteractions();
      this.actors = {};
      const me = G.state.me, pa = G.state.partner;
      const mx = me.id === 'sebas' ? 168 : 232, px = me.id === 'sebas' ? 232 : 168;
      this.actors.me = this.makeActor('me', mx, 186); this.actors.partner = this.makeActor('partner', px, 186);
      this.actors.me.dir = 'u';
      this.keys = this.input.keyboard.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D' }, false);
      this.input.keyboard.on('keydown-E', () => this.useNearest()); this.input.keyboard.on('keydown-SPACE', () => this.useNearest());
      this.sendT = 0; this.lastSent = '';
      // red + eventos
      this.offs = [
        G.bus.on('chat', m => this.say(this.actors[m.who], m.text)),
        G.bus.on('emote', m => this.emote(this.actors[m.who], m.id)),
        G.bus.on('pos', d => this.onPos(d)),
        G.bus.on('daynight', () => { if (this.scene.isActive()) this.scene.restart({ place: this.place }); }),
        G.bus.on('look', () => { G.refreshTextures(); }), G.bus.on('album', () => this.drawAlbum()),
        G.bus.on('partner', () => { G.refreshTextures(); this.actors.partner.label.setText(G.state.partner.name || ''); })
      ];
      this.events.once('shutdown', () => this.offs.forEach(f => f && f()));
      this.sendPos(true);
    }

    /* ---------- dibujo de la sala ---------- */
    drawRoom() {
      const sk = this.sk, night = this.night, g = this.add.graphics().setDepth(0);
      g.fillStyle(sk.wall).fillRect(0, 0, W, 100);
      g.lineStyle(1, sk.line);
      for (let r = 0; r < 12; r++) { const y = r * 8 + 4; g.lineBetween(0, y, W, y); for (let x = (r % 2) * 12; x < W; x += 24) g.lineBetween(x, y - 8, x, y); }
      // cúpula: esquinas oscuras
      g.fillStyle(0x1b1240).fillTriangle(0, 0, 90, 0, 0, 62).fillTriangle(W, 0, W - 90, 0, W, 62);
      g.fillStyle(sk.dark, 0.5).fillTriangle(0, 0, 70, 0, 0, 48).fillTriangle(W, 0, W - 70, 0, W, 48);
      // piso
      A.bands(g, 0, 100, W, 125, [0xe6f3ff, sk.floor, 0xb9d6f2], 5);
      g.lineStyle(1, 0xffffff, 0.45); for (let i = 0; i < 9; i++) g.lineBetween(20 + i * 46, 104 + (i % 3) * 8, 36 + i * 46, 108 + (i % 3) * 8);
      g.fillStyle(0xffffff).fillRect(0, 98, W, 3); g.fillStyle(sk.line).fillRect(0, 101, W, 2);
      // alfombra
      g.fillStyle(sk.rug, 0.55).fillEllipse(200, 158, 120, 50).lineStyle(2, 0xffffff, 0.8).strokeEllipse(200, 158, 108, 42);
      A.heart(g, 200, 156, this.owner === 'sebas' ? 9 : 12, this.owner === 'sebas' ? 0x4aa6ff : 0xff5d97, 0.8);
      // ventana (ojo de buey)
      g.fillStyle(0x41546a).fillCircle(140, 56, 24);
      g.fillStyle(night ? 0x0e1038 : 0x9fd8ff).fillCircle(140, 56, 20);
      if (night) { g.fillStyle(0x3a2a8a, 0.8).fillCircle(140, 66, 20); g.fillStyle(0xfff7d6).fillCircle(148, 48, 6).fillStyle(0x0e1038).fillCircle(151, 46, 5); [[128, 46], [134, 58], [150, 62], [124, 60]].forEach(([x, y]) => g.fillStyle(0xfff7c2).fillRect(x, y, 1.5, 1.5)); }
      else { g.fillStyle(0xffffff).fillEllipse(132, 50, 16, 7).fillEllipse(142, 48, 12, 6).fillEllipse(150, 62, 14, 6); g.fillStyle(0xfff3b0).fillCircle(150, 44, 5); }
      g.lineStyle(3, sk.accent).strokeCircle(140, 56, 21); g.lineStyle(1, 0xffffff, 0.6).lineBetween(140, 36, 140, 76).lineBetween(120, 56, 160, 56);
      // clóset
      this.closetG = this.add.graphics().setDepth(1); this.drawCloset();
      // álbum de fotos: cuadritos en la pared (se llenan con las fotos de las playas)
      this.albumG = this.add.graphics().setDepth(1); this.drawAlbum();
      // espejo
      g.fillStyle(sk.dark).fillEllipse(268, 62, 34, 46); g.fillStyle(0xdff6ff).fillEllipse(268, 62, 28, 40); g.fillStyle(0xffffff, 0.9).fillEllipse(262, 52, 6, 14);
      // cama
      g.fillStyle(0x6b4a3a).fillRect(298, 58, 78, 46).fillStyle(0x4a3228).fillRect(298, 58, 8, 46);
      g.fillStyle(0xfffaf0).fillRoundedRect(310, 62, 26, 14, 5); g.fillStyle(sk.accent).fillRoundedRect(306, 74, 70, 28, 5); g.fillStyle(sk.accent2).fillRect(306, 74, 70, 5);
      A.heart(g, 340, 90, 5, 0xffffff, 0.9);
      // cartel de salida
      g.fillStyle(0x6b4a3a).fillRect(162, 202, 76, 12).fillStyle(0xffe9b0).fillRect(164, 204, 72, 8);
      this.add.text(200, 208, 'MAPA DE LIMA ▼', { fontFamily: 'VT323', fontSize: '11px', color: '#2b1b30' }).setOrigin(0.5).setDepth(2);
      // túnel de salida
      g.fillStyle(0xcfe4f2).fillEllipse(200, 246, 76, 64).fillStyle(0x1b1240).fillEllipse(200, 248, 56, 52).fillStyle(0xffd27a, 0.3).fillEllipse(200, 254, 40, 30);
      // cojín del puffle
      g.fillStyle(sk.accent, 0.85).fillEllipse(52, 184, 34, 15).fillStyle(0xffffff, 0.5).fillEllipse(50, 181, 18, 5);
      // mesa de cuatro en raya
      g.fillStyle(0x5a3a2a).fillRect(302, 178, 4, 12).fillRect(358, 178, 4, 12).fillStyle(0xd9b48a).fillRect(298, 170, 68, 10);
      g.fillStyle(0x2f5fc8).fillRoundedRect(305, 150, 54, 24, 3);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) { const k = (r * 7 + c * 3) % 5; g.fillStyle(k === 0 ? 0xe63946 : k === 1 ? 0xffd23a : 0x9fc0ff).fillRect(308 + c * 7, 153 + r * 5, 4, 3); }
      // decoración propia de cada casa
      const dani = this.owner === 'dani' || this.owner === 'both', sebas = this.owner === 'sebas' || this.owner === 'both', both = this.owner === 'both';
      if (dani) {
        // flor morada con tallo verde y centro rojo
        g.fillStyle(0x7a5a3a).fillRect(92, 112, 12, 10).fillStyle(0x3aa05a).fillRect(97, 90, 2, 24).fillRect(97, 100, 8, 2);
        [[0, -4], [4, 0], [0, 4], [-4, 0]].forEach(([dx, dy]) => g.fillStyle(0xb07cff).fillCircle(98 + dx, 87 + dy, 4)); g.fillStyle(0xe63946).fillCircle(98, 87, 3);
        // parlante reggaetón con notas (en el igloo conjunto va a la izquierda de la ventana)
        if (!both) { this.spk = this.add.graphics({ x: 214, y: 92 }).setDepth(1); this.spk.fillStyle(0x2b1b30).fillRect(-14, -26, 28, 36).fillStyle(0xff5d97).fillCircle(0, -4, 8).fillStyle(0x2b1b30).fillCircle(0, -4, 4).fillStyle(0xffd24a).fillCircle(0, -18, 3); }
        if (this.spk) this.tweens.add({ targets: this.spk, scaleY: { from: 1, to: 1.05 }, duration: 330, yoyo: true, repeat: -1 });
        g.fillStyle(0xff9fd0, 0.9).fillTriangle(200, 0, 188, 14, 212, 14).fillStyle(0xffd24a).fillCircle(200, 17, 3);
      }
      if (sebas) {
        // tocadiscos con disco girando + libros
        g.fillStyle(0x3a2a22).fillRect(204, 82, 36, 18); this.disc = this.add.graphics({ x: 222, y: 80 }).setDepth(1);
        this.disc.fillStyle(0x15151c).fillEllipse(0, 0, 28, 8).fillStyle(0xe63946).fillEllipse(0, 0, 8, 2.4).fillStyle(0xffffff).fillRect(-12, -0.5, 3, 1);
        this.tweens.add({ targets: this.disc, scaleX: { from: 1, to: -1 }, duration: 900, yoyo: true, repeat: -1 });
        ['#c9262e', '#2c5f8a', '#ffd24a', '#5fd1b0', '#8a5cf6'].forEach((c, i) => { g.fillStyle(A.hex(c)).fillRect(176 + i * 5, 78 + (i % 2), 4, 22 - (i % 2)); });
        if (!both) g.fillStyle(0x7a5a3a).fillRect(92, 112, 12, 10).fillStyle(0x3aa05a).fillRect(93, 92, 3, 22).fillRect(98, 96, 3, 18).fillRect(103, 90, 3, 24);
        g.fillStyle(0x4aa6ff).fillRect(165, 0, 3, 14).fillStyle(0xffd27a).fillRect(160, 14, 13, 10).fillStyle(0xffffff, 0.8).fillRect(163, 17, 7, 4);
      }
      // notas flotantes
      for (let i = 0; i < 3; i++) { const n = A.text(this, 222, 70, ['♪', '♫', '♪'][i], 14, this.owner === 'sebas' ? '#bfe6ff' : '#ff9fd0').setDepth(3); this.tweens.add({ targets: n, y: 30, x: 222 + (i - 1) * 18, alpha: { from: 1, to: 0 }, duration: 2200, delay: i * 700, repeat: -1 }); }
      // día / noche
      if (night) {
        this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a6a, 0.34).setDepth(4000);
        [[140, 60], [200, 30], [232, 80], [300, 96]].forEach(([x, y]) => { const gl = this.add.circle(x, y, 28, 0xffd27a, 0.18).setDepth(4001).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: gl, alpha: { from: 0.12, to: 0.26 }, duration: 1400, yoyo: true, repeat: -1 }); });
      } else this.add.rectangle(W / 2, H / 2, W, H, 0xfff3d6, 0.05).setDepth(4000);
      // título del lugar
      this.add.text(W / 2, 26, G.PLACES[this.place].name + ' · ' + G.PLACES[this.place].district, { fontFamily: 'VT323', fontSize: '12px', color: '#ffffff', stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(4002).setAlpha(0.9);
      // prompt
      this.prompt = this.add.text(W / 2, 214, '', { fontFamily: 'VT323', fontSize: '14px', color: '#fff3d6', backgroundColor: '#2b1b30', padding: { x: 6, y: 1 } }).setOrigin(0.5).setDepth(4003).setVisible(false);
    }

    drawAlbum() {
      const g = this.albumG; if (!g) return; g.clear(); const n = (G.state.album || []).length;
      [[176, 40, 14, 18], [194, 36, 18, 22], [214, 41, 14, 18]].forEach(([x, y, w, h], i) => {
        g.fillStyle(0x6b4a3a).fillRect(x - 1, y - 1, w + 2, h + 2).fillStyle(i < Math.min(3, n) ? 0xe6c48a : 0xf8f4ea).fillRect(x, y, w, h);
        if (i < Math.min(3, n)) { g.fillStyle(0x7fd6ff).fillRect(x + 1, y + 1, w - 2, h * 0.4).fillStyle(0xff9ec0).fillRect(x + 3, y + h * 0.5, w - 6, h * 0.35); }
      });
      if (!this.albumLbl) this.albumLbl = this.add.text(195, 64, 'ÁLBUM' + (n ? ' (' + n + ')' : ''), { fontFamily: 'VT323', fontSize: '10px', color: '#2b1b30' }).setOrigin(0.5).setDepth(2); else this.albumLbl.setText('ÁLBUM' + (n ? ' (' + n + ')' : ''));
    }

    drawCloset() {
      const g = this.closetG, sk = this.sk; g.clear();
      g.fillStyle(0x41546a).fillRect(24, 44, 64, 62).fillStyle(0xcfe4f2).fillRect(27, 47, 58, 56).fillStyle(0xb5d0e4).fillRect(55, 47, 2, 56);
      g.fillStyle(sk.accent).fillRect(24, 40, 64, 8); g.fillStyle(0xfff3d6).fillRect(30, 41, 52, 6);
      const o = (G.state.me.look && G.state.me.look.outfit) || null;
      const cols = o ? [o.top.color, o.bottom.color, o.top.under || o.top.p1 || '#ffd24a', o.shoes.color] : ['#ff7aa8', '#4aa6ff', '#ffd24a', '#fff'];
      cols.forEach((c, i) => { g.fillStyle(A.hex(c)).fillRect(32 + i * 13, 56, 9, 18); g.fillStyle(0x2b1b30).fillRect(36 + i * 13, 53, 1, 3); });
      g.fillStyle(0xffd24a).fillRect(51, 74, 3, 6).fillRect(59, 74, 3, 6);
      this.closetLabel = this.closetLabel || this.add.text(56, 44, 'CLÓSET', { fontFamily: 'VT323', fontSize: '10px', color: '#2b1b30' }).setOrigin(0.5).setDepth(2);
    }

    makeInteractions() {
      const own = this.owner;
      this.inter = [
        { id: 'closet', x: 56, y: 118, r: 28, label: 'E: abrir el clóset', fn: () => G.ui.closet() },
        { id: 'mirror', x: 268, y: 118, r: 26, label: 'E: espejo (cambiarte)', fn: () => G.ui.closet() },
        { id: 'door', x: 200, y: 208, r: 24, label: 'E: salir al Mapa de Lima', fn: () => G.flow.openMap() },
        { id: 'bed', x: 340, y: 120, r: 30, label: 'E: dormir un ratito', fn: () => { this.emote(this.actors.me, 'dance'); G.ui.toast('Zzz… todavía no es hora de dormir 💤'); } },
        { id: 'c4', x: 330, y: 198, r: 34, label: 'E: Cuatro en raya', fn: () => G.travel('conecta4', {}) },
        { id: 'album', x: 198, y: 118, r: 26, label: 'E: ver el álbum de fotos', fn: () => G.ui.album() }
      ];
      this.inter.forEach(it => { const z = this.add.zone(it.x, it.y - 20, it.r * 1.6, 44).setInteractive({ useHandCursor: true }).setDepth(3000); z.on('pointerdown', () => it.fn()); });
    }
    useNearest() { if (G.typing || G.modalOpen) return; const it = this.nearest(); if (it) it.fn(); }
    nearest() { const a = this.actors.me; let best = null, bd = 1e9; this.inter.forEach(it => { const d = Math.hypot(a.x - it.x, a.y - it.y); if (d < it.r && d < bd) { best = it; bd = d; } }); return best; }

    /* ---------- personajes ---------- */
    makeActor(who, x, y) {
      const p = G.state[who === 'me' ? 'me' : 'partner'];
      const a = { who, x, y, tx: x, ty: y, dir: 'd', moving: false, t: 0, frame: 0 };
      a.shadow = this.add.ellipse(x, y, 14, 5, 0x000000, 0.25);
      a.puf = this.add.image(x - 12, y, 'puf_' + who).setOrigin(0.5, 1);
      a.spr = this.add.sprite(x, y, 'char_' + who, 'd0').setOrigin(0.5, 1);
      a.label = this.add.text(x, y - 32, p.name || '', { fontFamily: 'VT323', fontSize: '12px', color: '#ffffff', stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0.5, 1);
      a.px = x - 12; a.py = y;
      return a;
    }
    blocked(x, y) {
      if (x < BOUNDS.x0 || x > BOUNDS.x1 || y < BOUNDS.y0 || y > BOUNDS.y1) return true;
      return this.colliders.some(([cx, cy, cw, ch]) => x > cx - 4 && x < cx + cw + 4 && y > cy && y < cy + ch);
    }
    renderActor(a) {
      const flip = a.dir === 'r', dir = a.dir === 'r' ? 'l' : a.dir;
      const fr = a.moving ? [1, 0, 2, 0][Math.floor(a.t / 130) % 4] : 0;
      a.spr.setPosition(Math.round(a.x), Math.round(a.y)).setFrame(dir + fr).setFlipX(flip).setDepth(a.y);
      a.shadow.setPosition(a.x, a.y - 1).setDepth(a.y - 0.5);
      a.label.setPosition(Math.round(a.x), Math.round(a.y - 29)).setDepth(a.y + 1000);
      // puffle: sigue con retraso y rebota
      const ox = a.dir === 'r' ? -12 : a.dir === 'l' ? 12 : 0, oy = a.dir === 'u' ? 8 : a.dir === 'd' ? -6 : 0;
      a.px += (a.x + ox - a.px) * 0.12; a.py += (a.y + oy - a.py) * 0.12;
      const bob = a.moving ? Math.abs(Math.sin(a.t / 90)) * 3 : Math.abs(Math.sin(a.t / 420)) * 1;
      a.puf.setPosition(Math.round(a.px), Math.round(a.py - bob)).setDepth(a.py - 1);
      if (a.bub) a.bub.setPosition(a.x, a.y - 40).setDepth(a.y + 2000);
    }
    say(a, text) {
      if (!a) return; if (a.bub) a.bub.destroy();
      const t = this.add.text(0, 0, text, { fontFamily: 'VT323', fontSize: '13px', color: '#2b1b30', wordWrap: { width: 120 }, align: 'center' }).setOrigin(0.5, 1);
      const w = t.width + 10, h = t.height + 6, g = this.add.graphics();
      g.fillStyle(0xffffff).fillRoundedRect(-w / 2, -h - 3, w, h, 4).fillTriangle(-3, -3, 3, -3, 0, 2).lineStyle(1.5, 0x2b1b30).strokeRoundedRect(-w / 2, -h - 3, w, h, 4);
      t.setPosition(0, -6); const c = this.add.container(a.x, a.y - 40, [g, t]); a.bub = c;
      this.time.delayedCall(4500, () => { if (a.bub === c) { c.destroy(); a.bub = null; } });
    }
    emote(a, id) {
      if (!a) return; G.audio.sfx(id === 'heart' ? 'heart' : 'pop');
      const im = this.add.image(a.x, a.y - 44, 'emo_' + id).setScale(2).setOrigin(0.5, 1).setDepth(6000);
      this.tweens.add({ targets: im, y: a.y - 62, scale: { from: 1, to: 2.6 }, duration: 350, ease: 'Back.easeOut' });
      this.tweens.add({ targets: im, alpha: 0, duration: 500, delay: 1700, onComplete: () => im.destroy() });
      this.tweens.add({ targets: im, x: im.x + 3, duration: 160, yoyo: true, repeat: 9 });
    }

    /* ---------- red ---------- */
    onPos(d) {
      if (d.s !== 'igloo:' + this.place) return;
      const a = this.actors.partner; a.tx = d.x; a.ty = d.y; a.dir = d.d; a.moving = d.m;
    }
    sendPos(force) {
      if (!G.net.connected) return;
      const a = this.actors.me, pk = [Math.round(a.x), Math.round(a.y), a.dir, a.moving].join();
      if (pk === this.lastSent && !force) return; this.lastSent = pk;
      G.net.send('pos', { x: Math.round(a.x), y: Math.round(a.y), d: a.dir, m: a.moving, s: 'igloo:' + this.place });
    }

    update(time, dt) {
      const me = this.actors.me, K = this.keys, typing = G.typing || G.modalOpen;
      let vx = 0, vy = 0;
      if (!typing) { if (K.left.isDown || K.a.isDown) vx -= 1; if (K.right.isDown || K.d.isDown) vx += 1; if (K.up.isDown || K.w.isDown) vy -= 1; if (K.down.isDown || K.s.isDown) vy += 1; }
      me.moving = !!(vx || vy);
      if (me.moving) {
        const len = Math.hypot(vx, vy), step = SPEED * dt / 1000;
        const nx = me.x + vx / len * step, ny = me.y + vy / len * step;
        if (!this.blocked(nx, me.y)) me.x = nx; if (!this.blocked(me.x, ny)) me.y = ny;
        me.dir = Math.abs(vx) >= Math.abs(vy) && vx ? (vx < 0 ? 'l' : 'r') : (vy < 0 ? 'u' : 'd');
        me.t += dt;
      } else me.t += dt * 0.3;
      const pa = this.actors.partner;
      pa.x += (pa.tx - pa.x) * 0.25; pa.y += (pa.ty - pa.y) * 0.25; pa.t += pa.moving ? dt : dt * 0.3;
      this.renderActor(me); this.renderActor(pa);
      this.sendT += dt; if (this.sendT > 70) { this.sendT = 0; this.sendPos(); }
      const it = typing ? null : this.nearest();
      if (it) { this.prompt.setText(it.label).setVisible(true); } else this.prompt.setVisible(false);
      G.state.pos = { x: me.x, y: me.y };
    }
  }
  G.IglooScene = IglooScene;
})();
