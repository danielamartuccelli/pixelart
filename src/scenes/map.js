/* ===========================================================
   scenes/map.js — Mapa de Lima (estilizado, mirando al norte)
   El océano Pacífico queda a la izquierda. Se hace click en un lugar
   y LOS DOS viajan juntos. Mini-mapa de Lima Metropolitana arriba.
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H;

  const DISTRICTS = [
    { n: 'San Martín de Porres', c: 0xf4a259, p: [[134, 0], [330, 0], [330, 52], [250, 58], [200, 60], [150, 58], [140, 30]], l: [236, 51], big: true },
    { n: 'San Miguel', c: 0x8fd694, p: [[150, 58], [200, 60], [250, 64], [255, 100], [210, 112], [160, 108], [146, 84]], l: [196, 106], big: true },
    { n: 'Magdalena', c: 0xcfe8a9, p: [[160, 108], [210, 112], [235, 138], [190, 146], [158, 132]], l: [190, 128] },
    { n: 'Jesús María', c: 0xe8d7f1, p: [[250, 64], [300, 56], [330, 80], [300, 104], [255, 100]], l: [286, 82] },
    { n: 'Lince', c: 0xff8fb1, p: [[300, 104], [330, 80], [372, 92], [366, 128], [318, 134]], l: [350, 96], big: true },
    { n: 'San Isidro', c: 0xb5d8ff, p: [[235, 138], [255, 100], [300, 104], [318, 134], [280, 152], [244, 152]], l: [276, 130] },
    { n: 'Miraflores', c: 0xffd966, p: [[190, 146], [235, 138], [244, 152], [280, 152], [300, 200], [292, 252], [236, 258], [198, 240], [172, 176]], l: [206, 184], big: true },
    { n: 'Barranco', c: 0xffb38a, p: [[198, 240], [236, 258], [292, 252], [304, 272], [282, 302], [226, 304], [200, 284], [192, 262]], l: [252, 292], big: true },
    { n: 'Callao', c: 0xa9d6e8, p: [[108, -70], [262, -70], [268, 0], [134, 0], [118, -34]], l: [196, -52], big: true },
    { n: 'Surquillo', c: 0xd9c6a5, p: [[280, 152], [318, 134], [366, 128], [372, 172], [330, 192], [290, 200]], l: [330, 160] }
  ];
  const MINI = [[.217, 0], [.319, .039], [.29, .109], [.377, .162], [.667, .183], [.536, .31], [.812, .323], [.957, .41], [.84, .467], [.884, .598], [1, .703], [.913, .773], [.768, .877], [.754, 1], [.71, 1], [.732, .904], [.551, .755], [.42, .703], [.29, .624], [.246, .555], [.159, .528], [.188, .476], [.13, .397], [.188, .345], [.188, .293], [0, .24], [0, .135], [.087, .048]];
  const SHORT = { igloo: 'Igloo', casa_sebas: 'Casa Sebas', pucp: 'PUCP', kennedy: 'Kennedy', pollos: 'Pollo Pier', cocina: 'Cocina Dani', salsa: 'Saoco', carjitsu: 'Dojo', callao: 'Callao', yuyos: 'Los Yuyos' };
  const TOP = -70, BOT = 300;   // alto del mundo: el mapa hace scroll vertical

  class MapScene extends Phaser.Scene {
    constructor() { super('map'); }
    create() {
      A.emoteTextures(this.game); G.refreshTextures();
      const night = this.night = G.isNight(); this.busy = false;
      const g = this.add.graphics();
      // océano
      A.bands(g, 0, TOP, W, BOT - TOP, night ? [0x0a1a4a, 0x123a7a, 0x1b5a9a] : [0x4ab8f0, 0x2f9ad8, 0x1b78b8], 5);
      for (let r = 0; r < 12; r++) { const wv = this.add.graphics().setDepth(1); wv.lineStyle(2, 0xffffff, night ? 0.25 : 0.5); wv.beginPath(); for (let x = -40; x <= 160; x += 4) { const y = TOP + 14 + r * 32 + Math.sin(x / 20 * Math.PI) * 3; x === -40 ? wv.moveTo(x, y) : wv.lineTo(x, y); } wv.strokePath(); this.tweens.add({ targets: wv, x: 40 * (r % 2 ? -1 : 1), duration: 1800 + r * 150, repeat: -1, ease: 'Sine.easeInOut', yoyo: true }); }
      // tierra base + playa
      const land = this.add.graphics().setDepth(2); const coast = [[0, TOP], [106, TOP], [116, -34], [132, 0], [140, 30], [148, 58], [148, 84], [162, 108], [160, 132], [174, 176], [192, 206], [196, 240], [190, 270], [200, BOT], [W, BOT], [W, TOP]];
      land.fillStyle(0xf3e3b8).fillPoints(coast.map(([x, y]) => ({ x: x - 8 * (y > TOP && y < BOT ? 1 : 0), y })), true); land.fillStyle(0xdfe9c9).fillPoints(coast.map(([x, y]) => ({ x, y })), true);
      DISTRICTS.forEach(d => { land.fillStyle(d.c, night ? 0.75 : 1).fillPoints(d.p.map(([x, y]) => ({ x, y })), true); land.lineStyle(1.5, 0x2b1b30, 0.55).strokePoints(d.p.map(([x, y]) => ({ x, y })), true); });
      // calles
      land.lineStyle(2, 0xffffff, 0.7); [[150, 62, 330, 56], [258, 64, 270, 214], [160, 108, 372, 128], [232, 138, 372, 172], [240, 252, 290, 262], [140, -4, 262, -4]].forEach(([a, b, c, d]) => land.lineBetween(a, b, c, d));
      land.lineStyle(2, 0xfff3d6, 0.9); land.beginPath().moveTo(124, -40).lineTo(138, 10).lineTo(150, 60).lineTo(152, 100).lineTo(168, 140).lineTo(184, 190).lineTo(194, 240).lineTo(202, 290).strokePath();
      // el igloo flota en un iceberg frente a la costa
      land.fillStyle(0xdff6ff).fillEllipse(64, 70, 70, 22).fillStyle(0xbfe6f8).fillEllipse(64, 74, 58, 12);
      // etiquetas
      DISTRICTS.forEach(d => A.text(this, d.l[0], d.l[1], d.n, d.big ? 11 : 9, d.big ? '#2b1b30' : '#5a4a60', { stroke: '#ffffff', strokeThickness: d.big ? 3 : 2 }).setDepth(3).setAlpha(d.big ? 1 : 0.85));
      A.text(this, 62, 130, 'OCÉANO\nPACÍFICO', 12, '#dff6ff').setDepth(3).setAlpha(0.8);
      A.text(this, 175, 178, 'Costa Verde', 9, '#8a6a30', { stroke: '#fff3d6' }).setDepth(3).setAngle(70).setAlpha(0.7);
      // mini mapa de Lima Metropolitana
      const fixed = [];
      const mx = 340, my = 4, mw = 40, mh = 74, mg = this.add.graphics().setDepth(5); fixed.push(mg);
      mg.fillStyle(0x2b1b30, 0.85).fillRoundedRect(mx - 5, my - 2, mw + 10, mh + 14, 4);
      const pts = MINI.map(([x, y]) => ({ x: mx + x * mw, y: my + 6 + y * (mh - 8) })); mg.fillStyle(0xf4a259).fillPoints(pts, true); mg.lineStyle(1, 0xffffff, 0.8).strokePoints(pts, true);
      const dot = this.add.circle(mx + 0.24 * mw, my + 6 + 0.54 * (mh - 8), 3, 0xff3b6b).setDepth(6); fixed.push(dot); this.tweens.add({ targets: dot, scale: { from: 1, to: 2 }, alpha: { from: 1, to: 0.3 }, duration: 700, yoyo: true, repeat: -1 });
      fixed.push(this.add.text(mx + mw / 2, my + mh + 6, 'Lima', { fontFamily: 'VT323', fontSize: '10px', color: '#fff3d6' }).setOrigin(0.5).setDepth(6));
      // día / noche
      if (night) { A.stars(this, 20, 190, 0); A.moon(this, 40, 28, 9, 4); fixed.push(this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a40, 0.22).setDepth(900)); }
      else { for (let i = 0; i < 6; i++) { const s = this.add.rectangle(20 + Math.random() * 110, 20 + Math.random() * 190, 2, 2, 0xffffff, 0.9).setDepth(2); this.tweens.add({ targets: s, alpha: { from: 0, to: 1 }, duration: 600 + Math.random() * 600, yoyo: true, repeat: -1, delay: Math.random() * 800 }); } }
      // título
      const tt = A.text(this, 10, 30, 'LIMA ♥', 14, '#ffffff').setOrigin(0, 0).setDepth(10); fixed.push(tt); this.tweens.add({ targets: tt, y: 33, duration: 900, yoyo: true, repeat: -1 });
      // info inferior
      this.info = this.add.graphics().setDepth(20); this.infoT = this.add.text(200, 204, '', { fontFamily: 'VT323', fontSize: '10px', color: '#fff3d6', wordWrap: { width: 372 }, align: 'center', lineSpacing: -2 }).setOrigin(0.5, 0).setDepth(21);
      this.setInfo(null); fixed.push(this.info, this.infoT);
      // flechas de scroll
      this.arUp = A.text(this, 62, 52, '▲ más arriba: Callao', 10, '#ffffff').setDepth(30); this.arDn = A.text(this, 70, 190, '▼ más abajo: Barranco', 10, '#ffffff').setDepth(30); fixed.push(this.arUp, this.arDn);
      // pines
      this.pins = {};
      Object.keys(G.PLACES).forEach(k => this.makePin(k));
      // los dos personajes en el lugar actual
      const cur = G.PLACES[G.state.place] || G.PLACES[G.BASE];
      this.here = G.state.place;
      this.me = this.add.sprite(cur.pin[0] - 24, cur.pin[1] + 4, 'char_me', 'd0').setOrigin(0.5, 1).setDepth(100).setScale(0.8);
      this.pa = this.add.sprite(cur.pin[0] - 12, cur.pin[1] + 4, 'char_partner', 'd0').setOrigin(0.5, 1).setDepth(100).setScale(0.8);
      [this.me, this.pa].forEach((s, i) => this.tweens.add({ targets: s, y: s.y - 2, duration: 500, yoyo: true, repeat: -1, delay: i * 200 }));
      // cámara con scroll: flechas ↑↓ / rueda / arrastrar
      const cam = this.cameras.main; cam.setBounds(0, TOP, W, BOT - TOP);
      fixed.forEach(o => o.setScrollFactor(0));
      cam.scrollY = Phaser.Math.Clamp(cur.pin[1] - 100, TOP, BOT - H);
      this.keys = this.input.keyboard.addKeys({ up: 'UP', down: 'DOWN', w: 'W', s: 'S' }, false);
      this.input.on('wheel', (p, o, dx, dy) => { cam.scrollY = Phaser.Math.Clamp(cam.scrollY + dy * 0.4, TOP, BOT - H); });
      this.input.on('pointermove', p => { if (p.isDown && Math.abs(p.y - p.prevPosition.y) > 0) cam.scrollY = Phaser.Math.Clamp(cam.scrollY - (p.y - p.prevPosition.y), TOP, BOT - H); });
      this.offs = [G.bus.on('mapgo', k => this.animateTo(k, false)), G.bus.on('daynight', () => { if (this.scene.isActive()) this.scene.restart(); }), G.bus.on('look', () => G.refreshTextures())];
      this.events.once('shutdown', () => this.offs.forEach(f => f && f()));
    }
    update(t, dt) {
      if (G.typing || G.modalOpen) return;
      const cam = this.cameras.main, K = this.keys, v = (K.down.isDown || K.s.isDown ? 1 : 0) - (K.up.isDown || K.w.isDown ? 1 : 0);
      if (v) cam.scrollY = Phaser.Math.Clamp(cam.scrollY + v * 110 * dt / 1000, TOP, BOT - H);
      this.arUp.setVisible(cam.scrollY > TOP + 4); this.arDn.setVisible(cam.scrollY < BOT - H - 4);
    }
    setInfo(k) {
      const g = this.info; g.clear(); if (!k) { this.infoT.setText(''); return; }
      this.infoT.setStyle({ strokeThickness: 0 }); g.fillStyle(0x2b1b30, 0.92).fillRoundedRect(8, 170, 384, 30, 5).lineStyle(1.5, 0xff7aa8).strokeRoundedRect(8, 170, 384, 30, 5);
      const p = G.PLACES[k], built = !p.stage;
      this.infoT.setText(p.name + ' · ' + p.district + (p.game ? '  —  ' + p.game + (p.stage ? ' (Etapa ' + p.stage + ')' : '') : '') + '\n' + (p.desc || (k === 'igloo' ? 'Su base: clóset, espejo, cuatro en raya, chat y puerta al mapa.' : 'Casa de Sebas, arriba del Parque Kennedy.')));
      this.infoT.setY(173);
    }
    makePin(k) {
      const p = G.PLACES[k], [x, y] = p.pin, house = p.scene === 'igloo', built = !p.stage;
      const c = this.add.container(x, y).setDepth(50 + y);
      const gr = this.add.graphics();
      gr.fillStyle(0x000000, 0.25).fillEllipse(0, 2, 12, 4); gr.fillStyle(0x2b1b30).fillRect(-1, -12, 2, 13);
      const col = house ? 0xff5d97 : (built ? 0xffd24a : 0xb9b2c4);
      if (house) A.heart(gr, 0, -16, 6, col); else gr.fillStyle(0x2b1b30).fillCircle(0, -16, 7).fillStyle(col).fillCircle(0, -16, 5.5).fillStyle(0xffffff, 0.7).fillCircle(-2, -18, 1.8);
      c.add(gr);
      const lb = A.text(this, 0, 6, SHORT[k], 10, '#ffffff'); c.add(lb);
      const hit = this.add.zone(0, -8, 38, 34).setInteractive({ useHandCursor: true }); c.add(hit);
      hit.on('pointerover', () => { this.setInfo(k); this.tweens.add({ targets: c, scale: 1.25, duration: 100 }); });
      hit.on('pointerout', () => { this.setInfo(null); this.tweens.add({ targets: c, scale: 1, duration: 100 }); });
      hit.on('pointerdown', () => this.pick(k));
      this.tweens.add({ targets: gr, y: -2, duration: 700 + (x % 5) * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pins[k] = c;
    }
    pick(k) {
      if (this.busy) return;
      if (!G.net.connected && !G.solo) { G.ui.toast('Esperando a tu pareja…'); return; }
      if (k === this.here) { G.ui.toast('Ya están aquí 💜'); return; }
      G.net.send('mapgo', { k }); this.animateTo(k, true);
    }
    animateTo(k, initiator) {
      if (this.busy) return; this.busy = true; G.audio.sfx('ok');
      const p = G.PLACES[k], [x, y] = p.pin;
      this.tweens.add({ targets: this.me, x: x - 24, y: y + 4, duration: 900, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: this.pa, x: x - 12, y: y + 4, duration: 900, ease: 'Sine.easeInOut', onComplete: () => { if (initiator) G.flow.goPlace(k); } });
      for (let i = 0; i < 6; i++) { const h = this.add.graphics().setDepth(200); A.heart(h, 0, 0, 3, 0xff9fd0); h.x = this.me.x; h.y = this.me.y - 10; this.tweens.add({ targets: h, x, y: y - 10, alpha: { from: 1, to: 0 }, duration: 900, delay: i * 90 }); }
    }
  }
  G.MapScene = MapScene;
})();
