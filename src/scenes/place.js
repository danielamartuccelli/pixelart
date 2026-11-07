/* ===========================================================
   scenes/place.js — lugar de minijuego (por ahora "en construcción")
   Cada minijuego reemplazará a esta escena en su etapa:
   PUCP (4) · Kennedy (3) · Cocina (5) · Pollos+Saoco (6) · Dojo (7)
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H;
  const THEME = {
    pucp:     { wall: [0xcfe8ff, 0xeaf6ff], floor: 0x6fbf6a, trim: 0xb5502a, tag: 'PUCP · San Miguel' },
    kennedy:  { wall: [0x9fd8ff, 0xdff3ff], floor: 0x8fd694, trim: 0xf4a259, tag: 'Parque Kennedy · Miraflores' },
    pollos:   { wall: [0xf6e7b8, 0xf6e7b8], floor: 0xdfe8ee, trim: 0x9a3b24, tag: 'El Pollo Pier · Miraflores' },
    cocina:   { wall: [0xe9dcff, 0xf6eeff], floor: 0xd9c6e8, trim: 0xb5502a, tag: 'Cocina · Lince' },
    salsa:    { wall: [0xffc27a, 0xffe2b0], floor: 0xb5702a, trim: 0xe63946, tag: 'Academia Saoco · Lince' },
    carjitsu: { wall: [0xd9c6a5, 0xefe2c9], floor: 0x8a5a3a, trim: 0xc9262e, tag: 'Dojo · San Martín de Porres' }
  };

  class PlaceScene extends Phaser.Scene {
    constructor() { super('place'); }
    init(d) { this.key = (d && d.place) || 'kennedy'; }
    create() {
      A.emoteTextures(this.game); G.refreshTextures();
      const p = G.PLACES[this.key], th = THEME[this.key] || THEME.kennedy, night = G.isNight();
      const g = this.add.graphics();
      A.bands(g, 0, 0, W, 112, [th.wall[0], th.wall[1]], 4); g.fillStyle(th.floor).fillRect(0, 112, W, 113); g.fillStyle(th.trim).fillRect(0, 108, W, 5);
      g.lineStyle(1, 0x000000, 0.1); for (let i = 0; i < 10; i++) g.lineBetween(i * 44, 113, i * 44 - 30, 225);
      if (this.key === 'pollos') { g.fillStyle(0xd9a05a).fillRoundedRect(110, 18, 180, 62, 5).lineStyle(3, th.trim).strokeRoundedRect(110, 18, 180, 62, 5); A.text(this, 200, 34, 'EL POLLO', 18, '#2b1b30', { stroke: '#d9a05a', strokeThickness: 0 }); A.text(this, 200, 56, 'PIER', 26, '#2b1b30', { stroke: '#d9a05a', strokeThickness: 0 }); A.text(this, 200, 72, 'restaurant', 10, '#6a4a2a', { stroke: '#d9a05a', strokeThickness: 0 }); }
      else { A.text(this, 200, 40, p.name, 24, '#ffffff'); }
      const pl = G.state; A.text(this, 200, 92, th.tag, 12, '#2b1b30', { stroke: '#ffffff', strokeThickness: 3 });
      // personajes
      const mk = (who, x) => { const s = this.add.sprite(x, 190, 'char_' + who, 'd0').setOrigin(0.5, 1).setScale(1.5); const n = A.text(this, x, 190 - 46, G.state[who === 'me' ? 'me' : 'partner'].name || '', 12, '#ffffff'); this.tweens.add({ targets: s, y: 188, duration: 600, yoyo: true, repeat: -1, delay: who === 'me' ? 0 : 250 }); return s; };
      mk('me', 130); mk('partner', 270);
      // tarjeta
      const cd = this.add.graphics().setDepth(10); cd.fillStyle(0x2b1b30, 0.92).fillRoundedRect(20, 118, 360, 58, 6).lineStyle(2, 0xffd24a).strokeRoundedRect(20, 118, 360, 58, 6);
      this.add.text(30, 123, '🔧 EN CONSTRUCCIÓN · ETAPA ' + p.stage + ' — ' + p.game, { fontFamily: 'VT323', fontSize: '15px', color: '#ffd24a' }).setDepth(11);
      this.add.text(30, 140, p.desc, { fontFamily: 'VT323', fontSize: '13px', color: '#fff3d6', wordWrap: { width: 342 } }).setDepth(11);
      // botón volver
      const bt = this.add.graphics().setDepth(12); bt.fillStyle(0xff7aa8).fillRoundedRect(150, 198, 100, 20, 4).lineStyle(2, 0x2b1b30).strokeRoundedRect(150, 198, 100, 20, 4);
      this.add.text(200, 208, '◀ Volver al mapa', { fontFamily: 'VT323', fontSize: '14px', color: '#2b1b30' }).setOrigin(0.5).setDepth(13);
      this.add.zone(200, 208, 100, 20).setInteractive({ useHandCursor: true }).on('pointerdown', () => G.flow.openMap()).setDepth(14);
      this.input.keyboard.on('keydown-ESC', () => G.flow.openMap());
      if (night) this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a6a, 0.3).setDepth(900);
      A.snow(this, 0, 50);
    }
  }
  G.PlaceScene = PlaceScene;
})();
