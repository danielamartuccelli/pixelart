/* ===========================================================
   scenes/martuccini.js — PREMIO de Los Ccellis: FIDEOS MARTUCCINI
   Fideos con salsa rosada, langostinos y picante. Los dos comparten UN plato y se saca
   una foto vintage sentados en una trattoria (guiño romántico: el beso de espagueti).
   Todo procedural; el arte es original (no hay personajes ni escenas de ninguna película).
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H, O = 0x2b1b30;
  const PHOTO = { x: 16, y: 10, w: 368, h: 175 };

  class MartucciniScene extends Phaser.Scene {
    constructor() { super('martuccini'); }
    create() {
      A.emoteTextures(this.game); G.refreshTextures();
      this.lean = 0; this.heart = 0; this.shot = false; this.t = 0;
      const k = G.state.kitchen; k.prize = (k.prize || 0) + 1; G.save();
      this.buildRoom(); this.buildPlate(); this.buildDiners(); this.buildFrame();
      this.strand = this.add.graphics().setDepth(40);
      this.grain = this.add.graphics().setDepth(90);
      this.caption(0);
      this.input.keyboard.on('keydown-ESC', () => G.flow.openMap());
      this.events.once('shutdown', () => { this.timers && this.timers.forEach(t => t.remove()); });
      this.run();
    }

    /* ---------- trattoria ---------- */
    buildRoom() {
      const g = this.add.graphics().setDepth(0), P = PHOTO;
      A.bands(g, 0, 0, W, 190, [0x5a1f2a, 0x7a2e24, 0x9a4a30], 5);
      for (let y = 0; y < 190; y += 10) for (let x = (y / 10 % 2) * 12; x < W; x += 24) g.fillStyle(0x4a1820, 0.35).fillRect(x, y, 22, 1).fillRect(x, y, 1, 10);
      // ventana en arco con noche
      g.fillStyle(0x3a1a14).fillRoundedRect(150, 30, 100, 90, { tl: 50, tr: 50, bl: 2, br: 2 });
      g.fillStyle(0x14204a).fillRoundedRect(155, 35, 90, 85, { tl: 45, tr: 45, bl: 2, br: 2 });
      for (let i = 0; i < 14; i++) g.fillStyle(0xfff7c2, 0.9).fillRect(165 + (i * 37) % 70, 40 + (i * 23) % 50, 1, 1);
      g.fillStyle(0xfff3b0).fillCircle(225, 58, 8).fillStyle(0x14204a).fillCircle(228, 56, 7);
      [[170, 100, 14, 0x2a3a7a], [190, 92, 16, 0x1e2c66], [215, 98, 18, 0x2a3a7a], [236, 104, 12, 0x1e2c66]].forEach(([x, y, w, c]) => { g.fillStyle(c).fillRect(x, y, w, 120 - y); for (let j = 0; j < 4; j++) g.fillStyle(0xffd27a, 0.9).fillRect(x + 2 + (j % 2) * 5, y + 4 + Math.floor(j / 2) * 6, 2, 2); });
      g.fillStyle(0x3a1a14).fillRect(199, 35, 2, 85).fillRect(155, 74, 90, 2);
      // cartel
      const sign = A.text(this, 200, 22, 'TRATTORIA LOS CCELLIS', 12, '#ffd24a', { stroke: '#3a0a10', strokeThickness: 3 }).setDepth(3);
      // luces colgantes
      for (let i = 0; i <= 12; i++) { const x = 20 + i * 30, y = 30 + Math.sin(i * Math.PI / 6 * 2) * 0 + 6 * Math.abs(Math.sin(i * 0.9)); g.lineStyle(1, 0x2b1b30).lineBetween(x, y - 6, x + 15, y - 4); g.fillStyle(0xfff3b0, 0.35).fillCircle(x, y, 7).fillStyle(0xfff3b0).fillCircle(x, y, 2.4); this.tweens.add({ targets: this.add.graphics().setDepth(2).fillStyle(0xffffff, 0.5).fillCircle(x, y, 3), alpha: 0.1, duration: 600 + i * 70, yoyo: true, repeat: -1 }); }
      // mesa con mantel de cuadros
      const t = this.add.graphics().setDepth(20);
      t.fillStyle(0xc9262e).fillPoints([{ x: 36, y: 138 }, { x: 364, y: 138 }, { x: 392, y: 182 }, { x: 8, y: 182 }], true);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 20; c++) { const y0 = 138 + r * 5.5, y1 = 138 + (r + 1) * 5.5, k0 = r / 8, k1 = (r + 1) / 8, xa = 36 - 28 * k0, xb = 364 + 28 * k0, xc = 36 - 28 * k1, xd = 364 + 28 * k1; if ((r + c) % 2) t.fillStyle(0xffffff, 0.92).fillPoints([{ x: xa + (xb - xa) * c / 20, y: y0 }, { x: xa + (xb - xa) * (c + 1) / 20, y: y0 }, { x: xc + (xd - xc) * (c + 1) / 20, y: y1 }, { x: xc + (xd - xc) * c / 20, y: y1 }], true); }
      t.fillStyle(0xa31c24).fillRect(0, 182, W, 8).fillStyle(0xffffff, 0.9).fillRect(0, 186, W, 2);
      // velas en las esquinas
      [[34, 134], [366, 134]].forEach(([x, y], i) => { const c = this.add.graphics().setDepth(21); c.fillStyle(0x2f6a4a).fillRoundedRect(x - 4, y - 14, 8, 20, 2).fillStyle(0xfafafa).fillRect(x - 2, y - 22, 4, 9); const fl = this.add.ellipse(x, y - 26, 5, 8, 0xffc83a).setDepth(22); this.add.circle(x, y - 26, 12, 0xffc83a, 0.18).setDepth(19); this.tweens.add({ targets: fl, scaleY: { from: 0.8, to: 1.2 }, scaleX: { from: 1.1, to: 0.8 }, duration: 160 + i * 40, yoyo: true, repeat: -1 }); });
      this.add.rectangle(W / 2, 100, W, 150, 0xffa04a, 0.07).setDepth(5);
    }

    /* ---------- el plato: fideos Martuccini ---------- */
    buildPlate() {
      const g = this.add.graphics().setDepth(30); this.plate = g; const cx = 200, cy = 158;
      g.fillStyle(0x000000, 0.2).fillEllipse(cx + 3, cy + 6, 104, 26);
      g.fillStyle(O).fillEllipse(cx, cy, 104, 28).fillStyle(0xffffff).fillEllipse(cx, cy, 100, 25).fillStyle(0xdfe8f5).fillEllipse(cx, cy + 1, 78, 17);
      g.fillStyle(0xff9db0).fillEllipse(cx, cy + 1, 70, 14);                                           // salsa rosada
      // montón de fideos
      for (let i = 0; i < 46; i++) { const a = i * 2.4, r = 6 + (i % 9) * 3.2, x = cx + Math.cos(a) * r * 1.25, y = cy - 3 + Math.sin(a) * r * 0.35 - (i % 5); g.lineStyle(2, i % 3 ? 0xf6d77a : 0xffe9a0).beginPath(); g.moveTo(x - 6, y); g.lineTo(x - 2, y - 2); g.lineTo(x + 2, y + 1); g.lineTo(x + 6, y - 1); g.strokePath(); }
      for (let i = 0; i < 16; i++) { const a = i * 1.7; g.fillStyle(i % 2 ? 0xff7a9a : 0xffb3c2, 0.85).fillRect(cx + Math.cos(a) * (8 + i * 2.5) * 1.1, cy - 4 + Math.sin(a) * 4, 3, 1.4); }
      // langostinos
      [[-30, 0, 0.3], [26, -1, -0.4], [-8, -7, 0.9], [14, 3, 3.3]].forEach(([dx, dy, rot]) => this.shrimp(g, cx + dx, cy + dy - 2, rot));
      // ají (rodajas) y perejil
      [[-18, -6], [4, -9], [22, -5], [-3, 3], [-34, 5], [34, 3]].forEach(([dx, dy], i) => { g.lineStyle(1.5, 0xe0312e).strokeCircle(cx + dx, cy + dy, 2.2); g.fillStyle(0xffd24a).fillRect(cx + dx - 0.5, cy + dy - 0.5, 1, 1); });
      for (let i = 0; i < 12; i++) g.fillStyle(0x3aa05a).fillRect(cx - 26 + (i * 17) % 52, cy - 8 + (i * 7) % 12, 2, 1);
      // vapor
      this.steam = [0, 1, 2].map(i => { const s = this.add.graphics().setDepth(31); s.lineStyle(2, 0xffffff, 0.6); s.beginPath(); s.moveTo(0, 0); s.lineTo(3, -5); s.lineTo(-2, -10); s.lineTo(2, -15); s.strokePath(); s.setPosition(cx - 18 + i * 18, cy - 14); this.tweens.add({ targets: s, y: cy - 30, alpha: { from: 0.8, to: 0 }, duration: 1500, delay: i * 450, repeat: -1 }); return s; });
    }
    shrimp(g, x, y, rot) {
      const pts = []; for (let i = 0; i <= 8; i++) { const a = rot + i * 0.32 - 1.1; pts.push({ x: x + Math.cos(a) * 7.5, y: y + Math.sin(a) * 4.2 }); }
      pts.forEach((p, i) => { const r = 3.4 - i * 0.22; g.fillStyle(O).fillCircle(p.x, p.y, r + 0.9); });
      pts.forEach((p, i) => { const r = 3.4 - i * 0.22; g.fillStyle(i % 2 ? 0xff9a5a : 0xff7a3a).fillCircle(p.x, p.y, r); if (i % 2) g.fillStyle(0xffd0a0, 0.8).fillRect(p.x - 1, p.y - 1, 1.5, 1); });
      const t = pts[8]; g.fillStyle(O).fillTriangle(t.x, t.y - 3, t.x + 5, t.y - 5, t.x + 4, t.y + 1).fillStyle(0xff5a3a).fillTriangle(t.x + 0.5, t.y - 2.5, t.x + 4, t.y - 4, t.x + 3.4, t.y);
      const h = pts[0]; g.fillStyle(0x1b1230).fillRect(h.x - 2, h.y - 2, 1.5, 1.5); g.lineStyle(1, 0xff7a3a).lineBetween(h.x - 2, h.y - 3, h.x - 7, h.y - 7).lineBetween(h.x - 1, h.y - 3, h.x - 5, h.y - 8);
    }

    /* ---------- los dos comensales ---------- */
    buildDiners() {
      const me = G.state.me, pa = G.state.partner, sebasIsMe = me.id === 'sebas';
      const key = id => this.textures.exists('char_id_' + id) ? 'char_id_' + id : (id === me.id ? 'char_me' : 'char_partner');
      const L = { id: 'sebas', who: sebasIsMe ? 'me' : 'partner' }, R = { id: 'dani', who: sebasIsMe ? 'partner' : 'me' };
      this.diners = [L, R].map((d, i) => {
        const x = i ? 305 : 95, s = this.add.sprite(x, 168, key(d.id), 'l0').setOrigin(0.5, 1).setScale(3).setFlipX(!i).setDepth(10);
        const nm = (d.who === 'me' ? me : pa).name || (i ? 'Daniela' : 'Sebastián');
        const lb = A.text(this, x, 70, nm, 11, '#fff3d6', { strokeThickness: 3 }).setDepth(45);
        const pf = this.textures.exists('puf_' + d.who) ? this.add.image(i ? 358 : 42, 146, 'puf_' + d.who).setOrigin(0.5, 1).setScale(2).setDepth(22) : null;
        if (pf) this.tweens.add({ targets: pf, y: 142, duration: 500 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        return { s, lb, i, x };
      });
    }
    mouth(i) { const d = this.diners[i]; return { x: d.s.x + (i ? -15 : 15), y: 129 }; }

    buildFrame() {
      const f = this.add.graphics().setDepth(100), P = PHOTO, paper = 0xf8f4ea;
      f.fillStyle(paper).fillRect(0, 0, W, P.y).fillRect(0, 0, P.x, H).fillRect(P.x + P.w, 0, W - P.x - P.w, H).fillRect(0, P.y + P.h, W, H - P.y - P.h);
      f.lineStyle(1, 0xcfc8b4).strokeRect(P.x - 0.5, P.y - 0.5, P.w + 1, P.h + 1);
      this.frame = f;
      this.sepia = this.add.rectangle(P.x + P.w / 2, P.y + P.h / 2, P.w, P.h, 0xd6b384, 0).setDepth(80).setBlendMode(Phaser.BlendModes.MULTIPLY);
      this.vig = this.add.graphics().setDepth(81).setAlpha(0);
      for (let i = 0; i < 10; i++) this.vig.lineStyle(3, 0x2b1b30, 0.05 + i * 0.012).strokeRect(P.x + i * 3, P.y + i * 3, P.w - i * 6, P.h - i * 6);
      this.flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(200);
      this.cap = A.text(this, 200, 198, '', 14, '#2b1b30', { stroke: '#f8f4ea', strokeThickness: 0 }).setDepth(101);
      this.cap2 = A.text(this, 200, 214, '', 11, '#8a6a4a', { stroke: '#f8f4ea', strokeThickness: 0 }).setDepth(101);
    }
    caption(n) {
      const L = [['🍝 FIDEOS MARTUCCINI', 'salsa rosada · langostinos · picante'], ['Un solo plato…', '¡y un solo tenedor de dos!'], ['Los Ccellis', G.relLabel() + ' 💜']][n];
      this.cap.setText(L[0]); this.cap2.setText(L[1]);
    }

    /* ---------- secuencia ---------- */
    run() {
      this.timers = []; this.shot = false; this.lean = 0; this.heart = 0; this.sepia.setFillStyle(0xd6b384, 0); this.vig.setAlpha(0); this.clearButtons();
      this.caption(0); this.diners.forEach(d => d.s.x = d.x);
      this.plate.setAlpha(0).setY(-20); this.tweens.add({ targets: this.plate, y: 0, alpha: 1, duration: 900, ease: 'Bounce.easeOut' }); G.audio.sfx('pop');
      this.timers.push(this.time.delayedCall(2400, () => { this.caption(1); G.audio.sfx('heart'); this.tweens.add({ targets: this, lean: 1, duration: 2800, ease: 'Sine.easeInOut' }); }));
      this.timers.push(this.time.delayedCall(5400, () => { this.heart = 1; G.audio.sfx('heart'); this.hearts(); }));
      this.timers.push(this.time.delayedCall(6700, () => this.photo()));
    }
    hearts() {
      for (let i = 0; i < 12; i++) { const h = this.add.graphics().setDepth(60); A.heart(h, 0, 0, 3 + (i % 3) * 1.5, [0xff5d97, 0xffd24a, 0xff9fd0][i % 3]); h.x = 190 + Math.random() * 20; h.y = 126; this.tweens.add({ targets: h, y: 40 + Math.random() * 40, x: 130 + Math.random() * 140, alpha: 0, duration: 1600 + Math.random() * 900, delay: i * 90, onComplete: () => h.destroy() }); }
    }
    photo() {
      G.audio.sfx('win'); this.flash.setAlpha(0.95); this.tweens.add({ targets: this.flash, alpha: 0, duration: 600 });
      this.shot = true; this.caption(2);
      this.sepia.setFillStyle(0xd6b384, 0.92); this.vig.setAlpha(1);
      this.timers.push(this.time.delayedCall(900, () => this.buttons()));
    }
    clearButtons() { (this.btns || []).forEach(o => o.destroy()); this.btns = []; }
    buttons() {
      const mk = (x, label, color, fn) => {
        const g = this.add.graphics().setDepth(110); g.fillStyle(O).fillRoundedRect(x - 40, 199 + 1, 80, 17, 4).fillStyle(color).fillRoundedRect(x - 40, 198, 80, 17, 4).lineStyle(1.5, O).strokeRoundedRect(x - 40, 198, 80, 17, 4);
        const t = this.add.text(x, 206.5, label, { fontFamily: 'VT323', fontSize: '14px', color: '#2b1b30' }).setOrigin(0.5).setDepth(111), z = this.add.zone(x, 206.5, 80, 17).setInteractive({ useHandCursor: true }).setDepth(112).on('pointerdown', () => { G.audio.sfx('click'); fn(); });
        this.btns.push(g, t, z);
      };
      mk(62, '↻ Otra foto', 0xffd24a, () => this.run()); mk(338, '◀ Al mapa', 0xff7aa8, () => G.flow.openMap());
    }

    update(time, dtMs) {
      this.t += dtMs / 1000;
      const g = this.strand; g.clear();
      const k = this.lean, lm = this.mouth(0), rm = this.mouth(1);
      this.diners.forEach(d => { d.s.x = d.x + (d.i ? -1 : 1) * 62 * k; d.s.y = 168 + Math.sin(this.t * 3 + d.i) * 0.8; d.lb.x = d.s.x; });
      const mL = this.mouth(0), mR = this.mouth(1);
      if (this.plate.alpha > 0.5) {
        // dos hebras: del plato a cada boca; al juntarse forman el puente del beso de espagueti
        const px = 200, py = 150, join = this.heart ? 1 : 0, my = 130 + (this.heart ? 3 : 0);
        const strand = (x0, y0, x1, y1, sag, col) => { g.lineStyle(2, col, 1).beginPath(); for (let i = 0; i <= 14; i++) { const u = i / 14, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag + Math.sin(u * 9 + this.t * 4) * 0.6; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokePath(); };
        if (k > 0.05 || this.t > 3) {
          const mid = join ? 200 : (mL.x + mR.x) / 2;
          strand(mL.x, mL.y + 1, join ? mid : px - 10, join ? my + 1 : py - 4, join ? 4 : 14, 0xf6d77a); strand(mR.x, mR.y + 1, join ? mid : px + 10, join ? my + 1 : py - 4, join ? 4 : 14, 0xffe9a0);
          if (join) { g.fillStyle(0xff9db0).fillCircle(mid, my + 2, 1.6); }
          // hebra extra que cuelga del plato
          strand(px - 6, py - 4, mL.x + 10, mL.y + 6, 10, 0xffe9a0); strand(px + 6, py - 4, mR.x - 10, mR.y + 6, 10, 0xf6d77a);
        }
        if (join) { const pulse = 1 + Math.sin(this.t * 8) * 0.12; g.fillStyle(0xff3d7f); A.heart(g, 200, 118, 7 * pulse, 0xff3d7f); A.heart(g, 197, 115, 2, 0xffd0e0); }
      }
      // grano de película (solo después de la foto)
      const gr = this.grain; gr.clear();
      if (this.shot) { for (let i = 0; i < 70; i++) gr.fillStyle(i % 3 ? 0x000000 : 0xffffff, 0.08).fillRect(PHOTO.x + Math.random() * PHOTO.w, PHOTO.y + Math.random() * PHOTO.h, 1, 1); if (Math.random() < 0.08) gr.fillStyle(0xffffff, 0.2).fillRect(PHOTO.x + Math.random() * PHOTO.w, PHOTO.y, 1, PHOTO.h); }
    }
  }
  G.MartucciniScene = MartucciniScene;
})();
