/* ===========================================================
   scenes/menu.js — helpers de arte compartidos (G.art) + fondo del título
   Como el canvas es de baja resolución (400x225) y se escala sin suavizado,
   cualquier forma que dibujemos con Graphics sale "pixelada" automáticamente.
   =========================================================== */
(function () {
  const G = window.G;
  const A = G.art = {};

  function lerpC(a, b, t) {
    const ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255, br = b >> 16 & 255, bg = b >> 8 & 255, bb = b & 255;
    return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
  }
  A.lerpC = lerpC;
  A.hex = h => parseInt(h.replace('#', ''), 16);

  /* degradado en franjas (look retro) */
  A.bands = function (g, x, y, w, h, stops, step) {
    step = step || 4; const n = stops.length - 1;
    for (let yy = 0; yy < h; yy += step) { const f = (yy / h) * n, i = Math.min(n - 1, Math.floor(f)); g.fillStyle(lerpC(stops[i], stops[i + 1], f - i), 1).fillRect(x, y + yy, w, step); }
  };

  A.text = function (s, x, y, str, size, color, o) {
    return s.add.text(x, y, str, Object.assign({ fontFamily: 'VT323', fontSize: (size || 16) + 'px', color: color || '#ffffff', stroke: '#2b1b30', strokeThickness: 3, align: 'center' }, o || {})).setOrigin(0.5);
  };

  A.heart = function (g, x, y, r, color, alpha) {
    g.fillStyle(color, alpha === undefined ? 1 : alpha);
    g.fillCircle(x - r * 0.52, y - r * 0.25, r * 0.6); g.fillCircle(x + r * 0.52, y - r * 0.25, r * 0.6);
    g.fillTriangle(x - r * 1.08, y - r * 0.05, x + r * 1.08, y - r * 0.05, x, y + r * 1.05);
  };
  A.sparkle = function (g, x, y, r, color) {
    g.fillStyle(color || 0xffffff, 1); g.fillRect(x - r, y - 0.5, r * 2, 1.5); g.fillRect(x - 0.5, y - r, 1.5, r * 2);
    g.fillRect(x - r * 0.4, y - r * 0.4, r * 0.8, r * 0.8);
  };

  /* pingüino caricaturesco (fem = pingüina con moño) */
  A.penguin = function (s, x, y, o) {
    o = o || {}; const sc = o.s || 1, fem = !!o.fem;
    const c = s.add.container(x, y), navy = 0x23305e, belly = 0xfff6e6, orange = 0xff9d2e, outl = 0x141a36;
    const g = s.add.graphics();
    g.fillStyle(orange).fillEllipse(-6, 16, 10, 5).fillEllipse(6, 16, 10, 5);
    g.fillStyle(outl).fillEllipse(0, 0, (fem ? 32 : 28), 36);
    g.fillStyle(navy).fillEllipse(0, 0, (fem ? 29 : 25), 33);
    g.fillStyle(belly).fillEllipse(0, 4, (fem ? 21 : 17), 26);
    g.fillStyle(0xffffff).fillEllipse(-4.5, -9, 6.5, 7).fillEllipse(4.5, -9, 6.5, 7);
    g.fillStyle(0x111111).fillCircle(-4, -8.5, 1.8).fillCircle(5, -8.5, 1.8);
    g.fillStyle(0xffffff).fillRect(-4.5, -9.5, 1, 1).fillRect(4.5, -9.5, 1, 1);
    g.fillStyle(orange).fillTriangle(-3.5, -5, 3.5, -5, 0, 0.5);
    if (fem) {
      g.fillStyle(0xff9fbd, 0.9).fillEllipse(-9, -4, 5, 3).fillEllipse(9, -4, 5, 3);
      g.lineStyle(1, 0x111111).lineBetween(-8, -11, -6.5, -12.5).lineBetween(8, -11, 6.5, -12.5);
      g.fillStyle(0xff5d97).fillTriangle(-1, -17, -10, -22, -10, -13).fillTriangle(1, -17, 10, -22, 10, -13).fillStyle(0xffd0e0).fillCircle(0, -17, 2.4);
    }
    c.add(g);
    const mk = (xx, flip) => { const f = s.add.graphics({ x: xx, y: -6 }); f.fillStyle(outl).fillEllipse(0, 7, 8, 18).fillStyle(navy).fillEllipse(0, 7, 6, 16); f.rotation = flip * 0.25; c.add(f); return f; };
    c.flL = mk(-13.5, 1); c.flR = mk(13.5, -1); c.g = g;
    c.setScale(sc); c.baseS = sc;
    c.setData('flip', 1);
    c.flip = (dir) => { c.scaleX = Math.abs(c.scaleX) * (dir < 0 ? -1 : 1); };
    if (o.flip) c.flip(-1);
    return c;
  };
  A.waddle = function (s, c, dur, amp) {
    return s.tweens.add({ targets: c, angle: { from: -(amp || 6), to: amp || 6 }, duration: dur || 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };

  A.snow = function (s, n, depth, speed) {
    for (let i = 0; i < n; i++) {
      const r = s.add.rectangle(Math.random() * G.W, -10, 2, 2, 0xffffff, 0.85).setDepth(depth || 50);
      s.tweens.add({ targets: r, y: G.H + 6, x: r.x + (Math.random() * 30 - 15), duration: (speed || 5000) * (0.6 + Math.random() * 0.8), delay: Math.random() * 4000, repeat: -1, onRepeat: () => { r.x = Math.random() * G.W; r.y = -8; } });
    }
  };
  A.stars = function (s, n, ymax, depth) {
    for (let i = 0; i < n; i++) {
      const r = s.add.rectangle(Math.random() * G.W, Math.random() * ymax, 1.5, 1.5, 0xfff7c2, 1).setDepth(depth || 1);
      s.tweens.add({ targets: r, alpha: { from: 0.2, to: 1 }, duration: 600 + Math.random() * 1400, yoyo: true, repeat: -1, delay: Math.random() * 1000 });
    }
  };
  A.aurora = function (s, depth) {
    const cols = [0x5dffb0, 0x58c7ff, 0xff7ad9];
    cols.forEach((col, i) => {
      const g = s.add.graphics().setDepth(depth || 2).setAlpha(0.28);
      for (let k = 0; k < 9; k++) g.fillStyle(col, 0.45).fillEllipse(30 + k * 42, 38 + i * 12 + Math.sin(k + i) * 8, 70, 18 + (k % 3) * 6);
      s.tweens.add({ targets: g, x: { from: -18, to: 18 }, alpha: { from: 0.18, to: 0.42 }, duration: 3200 + i * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  };
  A.moon = function (s, x, y, r, depth) {
    const g = s.add.graphics().setDepth(depth || 3);
    g.fillStyle(0xfff7d6, 0.18).fillCircle(x, y, r * 1.9).fillStyle(0xfff7d6, 0.3).fillCircle(x, y, r * 1.4).fillStyle(0xfff7d6).fillCircle(x, y, r);
    g.fillStyle(0xe6dcae).fillCircle(x - r * 0.3, y - r * 0.2, r * 0.25).fillCircle(x + r * 0.35, y + r * 0.3, r * 0.18);
    return g;
  };
  /* iglú exterior (portada): cúpula = media elipse con anillos de bloques */
  A.igloo = function (s, x, y, w, color, depth) {
    const g = s.add.graphics().setDepth(depth || 5), rx = w / 2, ry = w * 0.42;
    const arc = (k) => { const pts = []; for (let a = Math.PI; a <= Math.PI * 2 + 0.01; a += 0.12) pts.push({ x: x + Math.cos(a) * rx * k, y: y + Math.sin(a) * ry * k }); return pts; };
    g.fillStyle(0x1b1240, 0.3).fillEllipse(x + 6, y + 2, w * 1.1, 9);
    g.fillStyle(0x9cb8d8).fillPoints(arc(1.04), true);
    g.fillStyle(color).fillPoints(arc(1), true);
    g.lineStyle(1, 0x9cb8d8, 0.9);
    for (let i = 1; i < 5; i++) { g.beginPath(); arc(1 - i * 0.2).forEach((p, k) => k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.strokePath(); }
    for (let r = 0; r < 4; r++) for (let k = -3; k <= 3; k++) { const yy = y - ry * (0.18 + r * 0.2); g.lineBetween(x + k * rx * 0.28 + (r % 2) * 5, yy, x + k * rx * 0.28 + (r % 2) * 5, yy + ry * 0.2); }
    // puerta (túnel)
    const dw = w * 0.2; g.fillStyle(0xcfe4f2).fillRect(x - dw - 3, y - ry * 0.3, dw * 2 + 6, ry * 0.3);
    g.fillStyle(0x2b1b30).fillEllipse(x, y - ry * 0.3, dw * 2, ry * 0.5).fillRect(x - dw, y - ry * 0.3, dw * 2, ry * 0.3);
    g.fillStyle(0xffd27a, 0.85).fillEllipse(x, y - ry * 0.28, dw * 1.2, ry * 0.3).fillRect(x - dw * 0.6, y - ry * 0.28, dw * 1.2, ry * 0.28);
    return g;
  };

  /* texturas globales de personajes/puffles/emotes */
  A.emoteTextures = function (game) {
    G.EMOTES.forEach(([id]) => { if (!game.textures.exists('emo_' + id)) game.textures.addCanvas('emo_' + id, G.emoteCanvas(id, 1)); });
  };
  G.refreshTextures = function () {
    const adapter = { textures: G.game.textures };
    ['me', 'partner'].forEach(w => {
      const p = G.state[w === 'me' ? 'me' : 'partner'];
      if (!p.look) return;
      G.makeCharTexture(adapter, 'char_' + w, p.look);
      G.makePuffleTexture(adapter, 'puf_' + w, p.look.puffle);
    });
    // texturas por identidad (para la historia): sebas/dani
    [G.state.me, G.state.partner].forEach(p => { if (p.id && p.look) G.makeCharTexture(adapter, 'char_id_' + p.id, p.look); });
  };

  /* texturas con TRAJE DE BAÑO para las playas y las fotos: beach_me, beach_partner (y por identidad beach_id_<id>) */
  G.makeBeachTextures = function () {
    const adapter = { textures: G.game.textures };
    ['me', 'partner'].forEach(w => { const p = G.state[w]; if (p.look && p.id) { const bl = G.beachLook(p.look, p.id); G.makeCharTexture(adapter, 'beach_' + w, bl); G.makeCharTexture(adapter, 'beach_id_' + p.id, bl); } });
  };

  /* ---------- Escena de fondo (portada / formularios) ---------- */
  class MenuScene extends Phaser.Scene {
    constructor() { super('menu'); }
    create() {
      A.emoteTextures(this.game);
      const W = G.W, H = G.H, night = true;
      const g = this.add.graphics();
      A.bands(g, 0, 0, W, 170, [0x140a3a, 0x3b1f6e, 0x9a4a9a, 0xff9ec0], 4);
      A.stars(this, 50, 100); A.moon(this, 330, 40, 14); A.aurora(this);
      const hills = this.add.graphics().setDepth(4);
      hills.fillStyle(0xcfe8ff).fillEllipse(80, 200, 300, 90).fillEllipse(320, 205, 340, 100).fillStyle(0xe9f6ff).fillEllipse(200, 225, 460, 90);
      hills.fillStyle(0xffffff, 0.5).fillEllipse(60, 188, 120, 14).fillEllipse(330, 192, 140, 14);
      A.igloo(this, 72, 176, 110, 0xf6fbff); A.igloo(this, 328, 180, 120, 0xe3f1ff);
      const p1 = A.penguin(this, 150, 188, { s: 0.9 }).setDepth(8), p2 = A.penguin(this, 250, 188, { s: 1, fem: true, flip: true }).setDepth(8);
      A.waddle(this, p1, 300, 7); A.waddle(this, p2, 320, 7);
      this.tweens.add({ targets: p1, x: 185, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: p2, x: 215, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      for (let i = 0; i < 5; i++) {
        const h = this.add.graphics().setDepth(9); A.heart(h, 0, 0, 5 + (i % 3), i % 2 ? 0xff5d97 : 0xff9fd0); h.x = 195 + i * 4; h.y = 160;
        this.tweens.add({ targets: h, y: 80, x: 190 + i * 7 + (i % 2 ? 14 : -14), alpha: { from: 1, to: 0 }, duration: 2600, delay: i * 520, repeat: -1 });
      }
      A.snow(this, 60, 20, 6000);
      this.events.on('wake', () => A.emoteTextures(this.game));
    }
  }
  G.MenuScene = MenuScene;
})();
