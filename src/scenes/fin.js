/* ===========================================================
   scenes/fin.js — ETAPA 8: PANTALLA FINAL
   Se muestra cuando alguien llega a -50 (o +50) soles.
   1) "El pago": el que perdió paga los soles y el que ganó celebra (confeti).
   2) "Feliz 2 años y medio": pantalla súper cursi (rayos, corazones, estrellas, letras que
      saltan en colores y un corazón gigante al final) + premio: bubble tea pagado por el
      perdedor, bolsa de ramen especial y makis de Shimaya.
   El texto del festejo sale de G.relLabel() (se recalcula con el calendario).
   Todo procedural y original.
   =========================================================== */
(function () {
  const G = window.G, A = G.art, mg = G.mg, W = G.W, H = G.H, O = 0x2b1b30;
  const RAINBOW = [0xff5d97, 0xff9a3c, 0xffd24a, 0x5fd38d, 0x4fb8ff, 0xa57cff];

  class FinScene extends Phaser.Scene {
    constructor() { super('fin'); }

    create(data) {
      A.emoteTextures(this.game); G.refreshTextures();
      const s = G.state;
      this.w = (data && data.w) || G.winnerOfMatch() || 'dani';
      this.l = G.IDS[this.w].other;
      this.t = 0; this.phase = 'pago'; this.items = []; this.confetti = [];
      G.finShown = this.w + ':' + s.scoreRev;
      this.countMatch();
      this.bg = this.add.graphics().setDepth(0);
      this.rays = this.add.graphics().setDepth(1);
      this.fx = this.add.graphics().setDepth(40);
      this.buildPago();
      this.input.keyboard.on('keydown-SPACE', () => this.skip());
      this.input.on('pointerdown', () => { if (this.phase === 'pago') this.skip(); });
      this.timers = [this.time.delayedCall(6200, () => { if (this.phase === 'pago') this.toLove(); })];
      this.events.once('shutdown', () => { this.timers.forEach(t => t.remove()); });
      G.audio.sfx('win');
    }

    /* una victoria de la "partida larga" queda guardada para siempre (solo la anota el anfitrión / modo solo) */
    countMatch() {
      const s = G.state, r = s.records;
      if (!(G.solo || G.net.role === 'host')) return;
      if (r.lastMatchRev === s.scoreRev) return;
      r.matches = r.matches || { dani: 0, sebas: 0 };
      r.matches[this.w]++; r.lastMatchRev = s.scoreRev; s.recRev++; G.save();
      if (G.net.connected) G.net.send('records', { records: r, rev: s.recRev });
      G.bus.emit('records');
    }

    key(id) {
      const me = G.state.me;
      return this.textures.exists('char_id_' + id) ? 'char_id_' + id : (id === me.id ? 'char_me' : 'char_partner');
    }
    add2(o) { this.items.push(o); return o; }
    clearItems() { this.items.forEach(o => o.destroy && o.destroy()); this.items = []; }
    skip() { if (this.phase === 'pago') this.toLove(); }

    /* ---------- parte 1: el pago ---------- */
    buildPago() {
      const g = this.bg; g.clear();
      A.bands(g, 0, 0, W, H, [0x7fd6ff, 0xffe6a8, 0xffb3c9], 4);
      // piso de confeti
      g.fillStyle(0xffffff, 0.35).fillRect(0, 168, W, 57);
      const wn = mg.nameOf(this.w), ls = mg.nameOf(this.l);
      this.add2(A.text(this, 200, 22, '¡' + ls + ' llegó a −50 soles!', 20, '#fff3d6', { strokeThickness: 4 }).setDepth(50));
      this.add2(A.text(this, 200, 42, 'Es hora de pagar…', 13, '#fff3d6').setDepth(50));
      const xl = 110, xw = 290;
      this.sl = this.add2(this.add.sprite(xl, 172, this.key(this.l), 'l0').setOrigin(0.5, 1).setScale(3).setDepth(10).setFlipX(true));
      this.sw = this.add2(this.add.sprite(xw, 172, this.key(this.w), 'l0').setOrigin(0.5, 1).setScale(3).setDepth(10));
      this.add2(A.text(this, xl, 62, ls, 12, '#fff3d6').setDepth(50));
      this.add2(A.text(this, xw, 62, wn, 12, '#fff3d6').setDepth(50));
      this.add2(A.text(this, xl, 78, '😭 −50', 14, '#ff5d6c').setDepth(50));
      this.add2(A.text(this, xw, 78, '🏆 +50', 14, '#2f9a5a').setDepth(50));
      // monedas S/ que vuelan del perdedor al ganador
      for (let i = 0; i < 12; i++) {
        const c = this.add2(this.add.graphics().setDepth(30));
        c.fillStyle(O).fillCircle(0, 0, 6).fillStyle(0xffd24a).fillCircle(0, 0, 5).fillStyle(0xfff3b0).fillCircle(-1.5, -1.5, 2);
        const t = A.text(this, 0, 0, 'S/', 7, '#7a4a00', { strokeThickness: 0 }).setDepth(31); this.add2(t);
        c.setPosition(xl + 14, 150); t.setPosition(xl + 14, 150);
        const tw = { x: xw - 14, y: 128 };
        this.tweens.add({
          targets: [c, t], x: tw.x, delay: 900 + i * 260, duration: 900, ease: 'Sine.easeInOut', onStart: () => G.audio.sfx('pop'),
        });
        this.tweens.add({ targets: [c, t], y: { from: 150, to: 112 }, delay: 900 + i * 260, duration: 450, yoyo: true, ease: 'Sine.easeOut' });
        this.tweens.add({ targets: [c, t], alpha: 0, delay: 900 + i * 260 + 880, duration: 120 });
      }
      this.tweens.add({ targets: this.sw, y: 162, duration: 260, yoyo: true, repeat: -1, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: this.sl, x: xl + 3, duration: 90, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: this.sl, scaleY: 2.8, duration: 700, yoyo: true, repeat: -1 });
      this.add2(A.text(this, 200, 200, '(toca o pulsa Espacio para seguir)', 10, '#fff3d6', { strokeThickness: 2 }).setDepth(50));
      this.spawnConfetti(60);
    }

    spawnConfetti(n) {
      for (let i = 0; i < n; i++) this.confetti.push({ x: Math.random() * W, y: -Math.random() * H, vy: 20 + Math.random() * 40, vx: (Math.random() - 0.5) * 20, c: RAINBOW[i % 6], r: Math.random() * 6, w: 2 + Math.random() * 2 });
    }

    /* ---------- parte 2: Feliz 2 años y medio ---------- */
    toLove() {
      this.phase = 'love'; this.tweens.killAll(); this.clearItems();
      this.cameras.main.flash(500, 255, 255, 255);
      G.audio.sfx('heart');
      const g = this.bg; g.clear();
      A.bands(g, 0, 0, W, H, [0xffc2e2, 0xe6b8ff, 0xffd9ec], 4);
      // lunares / estrellitas de fondo
      for (let i = 0; i < 70; i++) { const x = (i * 53) % W, y = (i * 31) % H; if (i % 3) g.fillStyle(0xffffff, 0.5).fillCircle(x, y, 1.6); else A.sparkle(g, x, y, 3, 0xfff3b0); }
      this.loveT = 0;
      // título con letras que saltan
      const txt = G.relLabel(), size = 26;
      const tmp = this.add.text(0, 0, 'W', { fontFamily: 'VT323', fontSize: size + 'px' }); const cw = tmp.width * 0.78; tmp.destroy();
      let total = 0; const letters = [];
      [...txt].forEach(ch => {
        const t = this.add.text(0, 0, ch, { fontFamily: 'VT323', fontSize: size + 'px', color: '#ffffff', stroke: '#2b1b30', strokeThickness: 5 }).setOrigin(0.5).setDepth(60);
        const w = ch === ' ' ? cw * 0.6 : Math.max(cw * 0.55, t.width * 0.9); letters.push({ t, w, off: total }); total += w; this.add2(t);
      });
      const x0 = 200 - total / 2;
      this.letters = letters.map((L, i) => { L.x = x0 + L.off + L.w / 2; L.t.setPosition(L.x, -20); L.t.setAlpha(0); this.tweens.add({ targets: L.t, y: 34, alpha: 1, delay: 150 + i * 70, duration: 520, ease: 'Bounce.easeOut' }); return L; });
      // los dos JUNTOS dentro del corazón gigante, frente a frente (Sebas mira a la derecha, Dani a la izquierda)
      const me = G.state.me;
      this.bigHeart = this.add2(this.add.graphics().setDepth(30).setAlpha(0));
      A.heart(this.bigHeart, 0, 0, 40, 0xff3d7f); A.heart(this.bigHeart, -14, -14, 9, 0xffd0e0);
      this.bigHeart.setPosition(200, 100).setScale(0);
      this.pair = [['sebas', 191, true], ['dani', 209, false]].map(([id, x, flip]) => {
        const sp = this.add2(this.add.sprite(x, 124, this.key(id), 'l0').setOrigin(0.5, 1).setScale(1.5).setFlipX(flip).setDepth(32).setAlpha(0));
        this.tweens.add({ targets: sp, alpha: 1, delay: 150 + [...G.relLabel()].length * 70 + 900, duration: 500 });
        this.tweens.add({ targets: sp, y: 120, duration: 420, yoyo: true, repeat: -1, ease: 'Quad.easeOut', delay: 150 + [...G.relLabel()].length * 70 + 1400 + (flip ? 0 : 210) });
        return sp;
      });
      [['sebas', 92, false], ['dani', 308, true]].forEach(([id, x, flip]) => {
        const who = id === me.id ? 'me' : 'partner';
        if (this.textures.exists('puf_' + who)) { const pf = this.add2(this.add.image(x, 124, 'puf_' + who).setOrigin(0.5, 1).setScale(2).setDepth(21)); this.tweens.add({ targets: pf, y: 116, duration: 330, yoyo: true, repeat: -1, delay: flip ? 200 : 0 }); }
        this.add2(A.text(this, x, 134, mg.nameOf(id), 11, '#fff3d6').setDepth(50));
      });
      this.timers.push(this.time.delayedCall(150 + letters.length * 70 + 400, () => { G.audio.sfx('win'); this.tweens.add({ targets: this.bigHeart, scale: 1, alpha: 1, duration: 700, ease: 'Back.easeOut' }); this.burst(); }));
      this.add2(A.text(this, 200, 62, 'Sebas + Dani', 12, '#fff3d6').setDepth(31)).setAlpha(0);
      this.tweens.add({ targets: this.items[this.items.length - 1], alpha: 1, delay: 2300, duration: 500 });
      // premio
      this.timers.push(this.time.delayedCall(2600, () => this.prizes()));
      this.spawnConfetti(80);
    }

    burst() {
      for (let i = 0; i < 24; i++) {
        const h = this.add2(this.add.graphics().setDepth(35)); A.heart(h, 0, 0, 3 + (i % 3) * 1.5, RAINBOW[i % 6]); h.setPosition(200, 100);
        const a = (i / 24) * Math.PI * 2, d = 60 + Math.random() * 70;
        this.tweens.add({ targets: h, x: 200 + Math.cos(a) * d * 1.3, y: 100 + Math.sin(a) * d * 0.8, alpha: 0, duration: 1300 + Math.random() * 600, ease: 'Cubic.easeOut' });
      }
    }

    prizes() {
      const ls = mg.nameOf(this.l), wn = mg.nameOf(this.w);
      this.add2(A.text(this, 200, 152, '🏆 Premio para ' + wn + ' 🏆', 13, '#fff3d6', { strokeThickness: 4 }).setDepth(60));
      const P = [['🧋', 'Bubble tea', 'pagado por ' + ls], ['🍜', 'Bolsa de ramen', 'especial'], ['🍣', 'Makis de', 'Shimaya']];
      P.forEach((p, i) => {
        const x = 76 + i * 124, y = 182, c = this.add2(this.add.container(x, y).setDepth(60));
        const g = this.add.graphics(); g.fillStyle(O).fillRoundedRect(-55, -17 + 2, 110, 36, 6).fillStyle(0xfff6e6).fillRoundedRect(-55, -17, 110, 34, 6).lineStyle(2, RAINBOW[i * 2]).strokeRoundedRect(-55, -17, 110, 34, 6);
        c.add([g, this.add.text(-39, 0, p[0], { fontSize: '18px' }).setOrigin(0.5), this.add.text(12, -6, p[1], { fontFamily: 'VT323', fontSize: '13px', color: '#2b1b30' }).setOrigin(0.5), this.add.text(12, 7, p[2], { fontFamily: 'VT323', fontSize: '12px', color: '#a0446a' }).setOrigin(0.5)]);
        c.setScale(0); this.tweens.add({ targets: c, scale: 1, delay: i * 250, duration: 450, ease: 'Back.easeOut', onStart: () => G.audio.sfx('pop') });
        this.tweens.add({ targets: c, angle: { from: -2, to: 2 }, duration: 600 + i * 90, yoyo: true, repeat: -1, delay: 900 });
      });
      this.timers.push(this.time.delayedCall(1500, () => this.buttons()));
    }

    buttons() {
      const add = o => this.add2(o), D = 70;
      mg.btn(this, add, 100, 212, 150, 18, '↻ Nueva partida (a 0)', 0xffd24a, () => { G.resetScore(); G.travel('igloo', { place: G.BASE }); }, D, 13);
      mg.btn(this, add, 300, 212, 150, 18, '◀ Seguir al mapa', 0xff7aa8, () => G.travel('map', {}), D, 13);
    }

    /* ---------- animación continua ---------- */
    update(time, dtMs) {
      const dt = dtMs / 1000; this.t += dt;
      const r = this.rays; r.clear();
      if (this.phase === 'love') {
        this.loveT += dt;
        // rayos que giran desde el corazón
        const n = 16, base = this.loveT * 0.25;
        for (let i = 0; i < n; i += 2) { const a0 = base + (i / n) * Math.PI * 2, a1 = a0 + Math.PI / n; r.fillStyle(0xffffff, 0.22).fillTriangle(200, 100, 200 + Math.cos(a0) * 320, 100 + Math.sin(a0) * 320, 200 + Math.cos(a1) * 320, 100 + Math.sin(a1) * 320); }
        // letras: ola de color
        if (this.letters) this.letters.forEach((L, i) => { if (this.loveT > 1 + i * 0.07) { L.t.setColor('#' + RAINBOW[(i + Math.floor(this.loveT * 4)) % 6].toString(16).padStart(6, '0')); L.t.y = 34 + Math.sin(this.loveT * 5 + i * 0.6) * 3; } });
        if (this.bigHeart && this.bigHeart.alpha >= 0.99) this.bigHeart.setScale(1 + Math.sin(this.loveT * 7) * 0.05);
        // corazones y estrellas que suben
        if (Math.random() < 0.3) { const h = this.add2(this.add.graphics().setDepth(5)); const col = RAINBOW[Math.floor(Math.random() * 6)]; if (Math.random() < 0.6) A.heart(h, 0, 0, 3 + Math.random() * 4, col, 0.9); else A.sparkle(h, 0, 0, 3 + Math.random() * 3, 0xfff3b0); h.setPosition(Math.random() * W, H + 8); this.tweens.add({ targets: h, y: -10, x: h.x + (Math.random() - 0.5) * 40, alpha: 0.2, duration: 3500 + Math.random() * 2500, onComplete: () => h.destroy() }); }
      }
      // confeti
      const f = this.fx; f.clear();
      this.confetti.forEach(c => { c.y += c.vy * dt; c.x += c.vx * dt + Math.sin(this.t * 3 + c.r) * 0.3; c.r += dt * 6; if (c.y > H + 4) { c.y = -4; c.x = Math.random() * W; } f.fillStyle(c.c, 1).fillRect(c.x, c.y, c.w, 2 + Math.abs(Math.sin(c.r)) * 2); });
    }
  }
  G.FinScene = FinScene;
})();
