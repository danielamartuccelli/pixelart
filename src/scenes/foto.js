/* ===========================================================
   scenes/foto.js — ETAPA 9 · FOTO VINTAGE del rey de la playa + ÁLBUM
   El ganador de una playa elige 1 de 4 POSES (Sebas y Dani en traje de baño) y toma la foto.
   La foto se guarda como imagen en G.state.album (PERMANENTE: no se borra al acabar la sesión) y se manda a la
   pareja. El álbum se ve en el igloo (cuadros de la pared, tecla E) con G.ui.album().
   Red: f_pose{k} (vista previa en vivo) · album{item} · f_done
   Prueba: ?solo=1&me=sebas&go=foto
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H, mg = G.mg, OUTL = 0x2b1b30;
  const PH = { x: 100, y: 12, w: 284, h: 170 };
  const POSES = ['Abrazo', 'Espalda con espalda', 'El campeón', 'Corazón'];

  /* ---- álbum (estado) ---- */
  G.addPhoto = function (item, fromRemote) {
    const s = G.state; s.album = s.album || [];
    if (s.album.some(p => p.id === item.id)) return false;
    s.album.push(item); G.save(); G.bus.emit('album');
    if (!fromRemote && G.net && G.net.connected) G.net.send('album', { item });
    return true;
  };

  class FotoScene extends Phaser.Scene {
    constructor() { super('foto'); }
    init(d) { this.w = (d && d.w) || G.state.me.id; this.place = (d && d.place) || 'callao'; }
    create() {
      A.emoteTextures(this.game); G.refreshTextures(); G.makeBeachTextures();
      this.pose = 0; this.saved = false; this.objs = [];
      this.isWinner = this.w === G.state.me.id || G.solo;
      this.cameras.main.setBackgroundColor(0xe8c48a); this.paper = this.add.graphics().setDepth(100); this.drawFrame();
      this.cards = [];
      POSES.forEach((n, i) => {
        const y = 22 + i * 36;
        const g = this.add.graphics().setDepth(105), t = this.add.text(50, y + 12, (i + 1) + '. ' + n, { fontFamily: 'VT323', fontSize: '12px', color: '#2b1b30', align: 'center', wordWrap: { width: 80 } }).setOrigin(0.5).setDepth(106);
        const z = this.add.zone(50, y + 12, 84, 30).setInteractive({ useHandCursor: true }).setDepth(107).on('pointerdown', () => { if (this.isWinner && !this.saved) { G.audio.sfx('click'); this.setPose(i, true); } });
        this.cards.push({ g, t, y });
      });
      this.info = A.text(this, 50, 172, '', 10, '#2b1b30', { strokeThickness: 0 }).setDepth(106);
      this.btns = [];
      mg.bind(this, [['f_pose', d => { if (!this.isWinner && !this.saved) this.setPose(d.k, false); }], ['f_done', () => { this.saved = true; this.afterSave(); }]]);
      this.setPose(0, false); this.drawButtons();
      if (G.solo && new URLSearchParams(location.search).get('fauto') === '1') this.time.delayedCall(700, () => { this.setPose(+(new URLSearchParams(location.search).get('fpose') || 2), false); this.time.delayedCall(300, () => this.shoot()); });
    }
    drawFrame() {
      const f = this.paper, paper = 0xf8f4ea; f.clear();
      f.fillStyle(0xe8c48a).fillRect(0, 0, PH.x - 8, H).fillRect(PH.x + PH.w + 8, 0, W - PH.x - PH.w - 8, H).fillRect(PH.x - 8, PH.y + PH.h + 22, PH.w + 16, H);
      f.fillStyle(paper).fillRect(PH.x - 8, PH.y - 8, PH.w + 16, 8).fillRect(PH.x - 8, PH.y, 8, PH.h).fillRect(PH.x + PH.w, PH.y, 8, PH.h).fillRect(PH.x - 8, PH.y + PH.h, PH.w + 16, 22).lineStyle(1, 0xcfc8b4).strokeRect(PH.x - 0.5, PH.y - 0.5, PH.w + 1, PH.h + 1);
      f.fillStyle(0xf8f4ea).fillRect(4, 4, 92, 176).lineStyle(1, 0xcfc8b4).strokeRect(4.5, 4.5, 91, 175);
    }
    setPose(k, send) {
      this.pose = k; if (send) mg.send('f_pose', { k });
      this.cards.forEach((c, i) => { c.g.clear(); c.g.fillStyle(i === k ? 0xffd24a : 0xffffff).fillRoundedRect(8, c.y, 84, 26, 4).lineStyle(2, i === k ? 0xb5651d : 0xcfc8b4).strokeRoundedRect(8, c.y, 84, 26, 4); });
      this.info.setText(this.isWinner ? 'Elige la pose\ny toma la foto' : this.nameOf(this.w) + ' está\nelegiendo…');
      this.drawPhoto();
    }
    nameOf(id) { return mg.nameOf(id); }
    drawPhoto() {
      this.objs.forEach(o => o.destroy()); this.objs = []; const add = o => { this.objs.push(o); return o; };
      const g = add(this.add.graphics().setDepth(10)), P = PH, k = this.pose;
      // fondo: atardecer en la playa (con máscara = recuadro de la foto)
      const bg = add(this.add.graphics().setDepth(1)); bg.setPosition(P.x, P.y); G.beach.drawSea(this, bg, { seaH: 78, sunset: true, sun: true });
      bg.setScale(P.w / W, P.h / H); bg.setPosition(P.x, P.y);
      const R = (x, y) => [P.x + x, P.y + y];
      // piedras y olitas de adorno
      [[40, 140], [250, 150], [210, 160]].forEach(([x, y]) => G.beach.stone(g, P.x + x, P.y + y, 5));
      const who = id => 'beach_id_' + id, sp = (id, x, y, sc, frame, flip) => add(this.add.sprite(P.x + x, P.y + y, who(id), frame).setOrigin(0.5, 1).setScale(sc).setFlipX(!!flip).setDepth(12));
      const winner = this.w, loser = G.IDS[this.w].other, me = G.state.me;
      const puf = (id, x, y) => { const key = id === me.id ? 'puf_me' : 'puf_partner'; if (this.textures.exists(key)) add(this.add.image(P.x + x, P.y + y, key).setOrigin(0.5, 1).setScale(1.5).setDepth(11)); };
      if (k === 0) { sp('sebas', 128, 160, 3, 'l0', true); sp('dani', 160, 160, 3, 'l0', false); const h = add(this.add.graphics().setDepth(14)); A.heart(h, P.x + 144, P.y + 52, 12, 0xff3d7f); puf('sebas', 60, 162); puf('dani', 232, 162); }
      else if (k === 1) { sp('sebas', 126, 160, 3, 'l0', false); sp('dani', 160, 160, 3, 'l0', true); puf('sebas', 56, 162); puf('dani', 236, 162); [[70, 50], [215, 56]].forEach(([x, y]) => { const h = add(this.add.graphics().setDepth(14)); A.sparkle(h, P.x + x, P.y + y, 6, 0xfff3b0); }); }
      else if (k === 2) {
        sp(loser, 66, 160, 2.4, 'd0'); sp(winner, 150, 160, 3.4, 'd0');
        G.beach.stone(g, P.x + 150, P.y + 36, 13); const h = add(this.add.graphics().setDepth(14)); for (let i = 0; i < 8; i++) A.sparkle(h, P.x + 150 + Math.cos(i * 0.8) * 30, P.y + 36 + Math.sin(i * 0.8) * 22, 4, 0xfff3b0);
        add(A.text(this, P.x + 220, P.y + 40, '¡REY DE\nLA PLAYA!', 14, '#fff3d6').setDepth(15)); puf(loser, 40, 164); puf(winner, 240, 164);
      } else {
        const h = add(this.add.graphics().setDepth(5)); A.heart(h, P.x + 144, P.y + 86, 66, 0xff5d97); A.heart(h, P.x + 144, P.y + 86, 56, 0xff8ab4);
        sp('sebas', 122, 144, 2.6, 'd0'); sp('dani', 166, 144, 2.6, 'd0'); puf('sebas', 40, 160); puf('dani', 248, 160);
      }
      // sepia + viñeta + grano (look vintage)
      add(this.add.rectangle(P.x + P.w / 2, P.y + P.h / 2, P.w, P.h, 0xd6b384, 0.4).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(30));
      const v = add(this.add.graphics().setDepth(31)); for (let i = 0; i < 8; i++) v.lineStyle(3, 0x2b1b30, 0.05 + i * 0.012).strokeRect(P.x + i * 3, P.y + i * 3, P.w - i * 6, P.h - i * 6);
      add(this.add.text(P.x + P.w / 2, P.y + P.h + 6, 'Lima de a dos · ' + G.PLACES[this.place].name + ' · ' + new Date().toLocaleDateString('es-PE'), { fontFamily: 'VT323', fontSize: '12px', color: '#6a5a4a' }).setOrigin(0.5, 0).setDepth(106));
      // marco papel por encima de lo que se salga
      this.paper.setDepth(100); this.drawFrame();
    }
    drawButtons() {
      this.btns.forEach(o => o.destroy()); this.btns = []; const add = o => { this.btns.push(o); return o; };
      if (!this.saved) {
        if (this.isWinner) mg.btn(this, add, 50, 200, 90, 20, '📸 ¡Foto!', 0xff7aa8, () => this.shoot(), 110, 14);
        else add(A.text(this, 50, 200, 'esperando…', 11, '#2b1b30', { strokeThickness: 0 }).setDepth(111));
      } else {
        mg.btn(this, add, 44, 192, 84, 16, '🖼 Ver álbum', 0xffd24a, () => G.ui.album(), 110, 12);
        mg.btn(this, add, 44, 210, 84, 16, '◀ Al mapa', 0xff7aa8, () => G.flow.openMap(), 110, 12);
      }
    }
    shoot() {
      if (this.saved) return; this.saved = true; G.audio.sfx('win');
      const fl = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 1).setDepth(500); this.tweens.add({ targets: fl, alpha: 0, duration: 500, onComplete: () => fl.destroy() });
      this.time.delayedCall(80, () => {
        const done = (img) => {
          const src = img && img.src; const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), img: src, w: this.w, pose: this.pose, place: this.place, ts: Date.now() };
          if (src) G.addPhoto(item); mg.send('f_done', {}); this.afterSave();
        };
        try { this.game.renderer.snapshotArea(PH.x * 1, PH.y * 1, PH.w, PH.h, done, 'image/jpeg', 0.85); } catch (e) { console.warn(e); done(null); }
      });
    }
    afterSave() { this.saved = true; this.info.setText('¡Foto guardada\nen el álbum\ndel igloo! 💖'); this.cards.forEach(c => { c.g.clear(); }); this.drawButtons(); }
  }
  G.FotoScene = FotoScene;

  /* ---- álbum (DOM) ---- */
  G.ui.album = function () {
    if (G.modalOpen) return; G.modalOpen = true;
    const root = document.createElement('div'); root.className = 'modal'; const panel = document.createElement('div'); panel.className = 'panel'; root.appendChild(panel);
    const close = document.createElement('button'); close.className = 'btn small xbtn'; close.textContent = '✖ Cerrar'; close.onclick = () => { root.remove(); G.modalOpen = false; }; panel.appendChild(close);
    const h = document.createElement('h2'); h.textContent = '🖼 Álbum de fotos (' + (G.state.album || []).length + ')'; panel.appendChild(h);
    const grid = document.createElement('div'); grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;max-height:62vh;overflow:auto;justify-content:center';
    const list = (G.state.album || []).slice().reverse();
    if (!list.length) { const p = document.createElement('div'); p.className = 'small-note'; p.textContent = 'Todavía no hay fotos. El ganador de Callao o de Los Yuyos puede tomar la primera.'; grid.appendChild(p); }
    list.forEach(it => {
      const c = document.createElement('div'); c.style.cssText = 'background:#f8f4ea;padding:6px 6px 4px;border:1px solid #cfc8b4;box-shadow:2px 3px 0 #2b1b30;width:230px;text-align:center;color:#2b1b30';
      const im = document.createElement('img'); im.src = it.img; im.style.cssText = 'width:100%;image-rendering:pixelated;display:block'; c.appendChild(im);
      const cap = document.createElement('div'); cap.style.cssText = 'font-size:16px;margin-top:3px'; const nm = G.IDS[it.w] ? ((G.state.me.id === it.w ? G.state.me.name : G.state.partner.name) || G.IDS[it.w].short) : '';
      cap.textContent = '👑 ' + nm + ' · ' + (G.PLACES[it.place] ? G.PLACES[it.place].name : '') + ' · ' + new Date(it.ts).toLocaleDateString('es-PE'); c.appendChild(cap); grid.appendChild(c);
    });
    panel.appendChild(grid); document.getElementById('ui').appendChild(root);
  };
})();
