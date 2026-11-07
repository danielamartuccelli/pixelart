/* ===========================================================
   scenes/story.js — la historia del pingüino (click para avanzar)
   9 escenas caricaturescas y animadas, con texto tipo cuento.
   Para cambiar los textos o agregar escenas: editar PANELS abajo.
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H;

  /* cada panel: txt(N,D) => texto ; draw(s) dibuja y anima (s = escena) */
  function snowBg(s) {
    const g = s.add.graphics(); A.bands(g, 0, 0, W, 150, [0xb7dcff, 0xdff1ff, 0xfff1e6], 4);
    g.fillStyle(0xfff3b0, 0.9).fillCircle(330, 38, 17).fillStyle(0xfff3b0, 0.25).fillCircle(330, 38, 28);
    g.fillStyle(0xbfd8f2).fillTriangle(-20, 150, 70, 62, 160, 150).fillTriangle(110, 150, 215, 52, 320, 150).fillTriangle(250, 150, 345, 76, 430, 150);
    g.fillStyle(0xffffff).fillTriangle(55, 82, 70, 62, 85, 82).fillTriangle(196, 78, 215, 52, 234, 78).fillTriangle(332, 94, 345, 76, 358, 94);
    g.fillStyle(0xf4fbff).fillRect(0, 140, W, 90).fillEllipse(200, 148, 520, 34);
    g.fillStyle(0xd7ecfb).fillEllipse(80, 190, 150, 12).fillEllipse(320, 200, 170, 12);
    return g;
  }

  const PANELS = [
    { txt: (N) => 'Había una vez un pingüino llamado ' + N + ', que vivía en su manada… y creció solito, ¡sin saber lo que se venía!',
      draw(s, n) {
        snowBg(s);
        for (let i = 0; i < 12; i++) { const p = A.penguin(s, 232 + (i % 6) * 26 + (Math.floor(i / 6) % 2) * 12, 138 + Math.floor(i / 6) * 17, { s: 0.5, flip: i % 2 === 0 }); A.waddle(s, p, 380 + i * 30, 5); }
        const p = A.penguin(s, 90, 142, { s: 1.3 }).setDepth(5); s.tweens.add({ targets: p, y: 140, angle: { from: -2, to: 2 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const t = A.text(s, 90, 90, n.sebas, 16, '#ffffff').setDepth(6); s.tweens.add({ targets: t, y: 86, duration: 900, yoyo: true, repeat: -1 });
        const q = A.text(s, 118, 100, '…', 20, '#ffffff'); s.tweens.add({ targets: q, alpha: { from: 0.2, to: 1 }, duration: 700, yoyo: true, repeat: -1 });
        A.snow(s, 45, 50);
      } },
    { txt: (N, D) => 'Hasta que un día vio a la pingüina más fantabulosa, inteligente, bonita y gordita que había visto en su vida: ' + D + '. ¡Y el corazón le hizo pum, pum, pum!',
      draw(s, n) {
        snowBg(s);
        const glow = s.add.graphics(); glow.fillStyle(0xfff3a0, 0.28).fillCircle(0, 0, 50).fillStyle(0xfff3a0, 0.35).fillCircle(0, 0, 34); glow.x = 300; glow.y = 104;
        s.tweens.add({ targets: glow, scale: { from: 0.9, to: 1.2 }, alpha: { from: 0.6, to: 1 }, duration: 700, yoyo: true, repeat: -1 });
        const a = A.penguin(s, 96, 140, { s: 1.5 }).setDepth(5), b = A.penguin(s, 300, 140, { s: 1.65, fem: true, flip: true }).setDepth(5);
        s.tweens.add({ targets: a, scaleX: { from: 1.5, to: 1.58 }, scaleY: { from: 1.5, to: 1.42 }, duration: 260, yoyo: true, repeat: -1 });
        s.tweens.add({ targets: b, angle: { from: -3, to: 3 }, duration: 600, yoyo: true, repeat: -1 });
        for (let i = 0; i < 7; i++) { const sp = s.add.graphics().setDepth(6); A.sparkle(sp, 0, 0, 4 + (i % 3), 0xfff7c2); sp.x = 255 + Math.random() * 90; sp.y = 70 + Math.random() * 90; s.tweens.add({ targets: sp, alpha: { from: 0, to: 1 }, scale: { from: 0.4, to: 1.3 }, duration: 500 + Math.random() * 500, yoyo: true, repeat: -1, delay: i * 140 }); }
        for (let i = 0; i < 7; i++) { const h = s.add.graphics().setDepth(7); A.heart(h, 0, 0, 5 + (i % 3) * 2, i % 2 ? 0xff5d97 : 0xff9fd0); h.x = 96 + (i - 3) * 6; h.y = 108; s.tweens.add({ targets: h, y: 40, x: 96 + (i - 3) * 26 + 30, alpha: { from: 1, to: 0 }, duration: 1800, delay: i * 260, repeat: -1 }); }
        const pum = A.text(s, 96, 56, 'pum  pum  pum', 18, '#ff9fd0').setDepth(8); s.tweens.add({ targets: pum, scale: { from: 0.85, to: 1.2 }, duration: 260, yoyo: true, repeat: -1 });
        A.text(s, 300, 82, n.dani, 16, '#fff3d6').setDepth(8);
        A.snow(s, 30, 50);
      } },
    { txt: () => 'Y entonces buscó lo que todo pingüino debe buscar: la piedra más lisa del mundo, para dársela… y amarse para siempre.',
      draw(s) {
        const g = s.add.graphics(); A.bands(g, 0, 0, W, 150, [0x6a4aa8, 0xd0709a, 0xffb89a], 4);
        g.fillStyle(0xf8eef6).fillRect(0, 140, W, 90).fillEllipse(200, 148, 520, 34); g.fillStyle(0xe6d2ea).fillEllipse(120, 195, 200, 14);
        A.stars(s, 24, 70);
        const p = A.penguin(s, 110, 142, { s: 1.6 }).setDepth(5); s.tweens.add({ targets: p, y: 138, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const b = s.add.graphics().setDepth(4); b.fillStyle(0xffffff).fillEllipse(260, 62, 150, 76).fillCircle(190, 108, 7).fillCircle(172, 122, 4.5).fillCircle(160, 133, 3);
        b.lineStyle(2, 0xc9b6dd).strokeEllipse(260, 62, 150, 76);
        const st = s.add.graphics().setDepth(6); st.fillStyle(0x7f879c).fillEllipse(0, 0, 54, 30).fillStyle(0xaab2c6).fillEllipse(-3, -3, 46, 22).fillStyle(0xffffff, 0.9).fillEllipse(-12, -8, 14, 6); st.x = 260; st.y = 56;
        s.tweens.add({ targets: st, scale: { from: 0.95, to: 1.12 }, duration: 600, yoyo: true, repeat: -1 });
        [[225, 38], [296, 46], [284, 80], [236, 76]].forEach(([x, y], i) => { const sp = s.add.graphics().setDepth(7); A.sparkle(sp, 0, 0, 5, 0xfff7c2); sp.x = x; sp.y = y; s.tweens.add({ targets: sp, alpha: { from: 0, to: 1 }, scale: { from: 0.3, to: 1.4 }, duration: 400, yoyo: true, repeat: -1, delay: i * 180 }); });
        A.text(s, 260, 94, '¡la más lisa del mundo!', 14, '#6a4aa8', { stroke: '#ffffff', strokeThickness: 3 }).setDepth(6);
        A.snow(s, 25, 50);
      } },
    { txt: () => 'Cruzó desiertos ardientes, donde hasta el hielo de su corazón se derretía… pero no se rindió.',
      draw(s) {
        const g = s.add.graphics(); A.bands(g, 0, 0, W, 170, [0xff8a4a, 0xffc070, 0xffe9a8], 4);
        const sun = s.add.graphics({ x: 320, y: 50 }); sun.fillStyle(0xfff0a0, 0.5).fillCircle(0, 0, 40).fillStyle(0xffd23a).fillCircle(0, 0, 26);
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; sun.lineStyle(3, 0xffd23a).lineBetween(Math.cos(a) * 32, Math.sin(a) * 32, Math.cos(a) * 44, Math.sin(a) * 44); }
        s.tweens.add({ targets: sun, angle: 360, duration: 12000, repeat: -1 }); s.tweens.add({ targets: sun, scale: { from: 1, to: 1.12 }, duration: 800, yoyo: true, repeat: -1 });
        const dune = (y, col, amp, d) => { const dg = s.add.graphics(); dg.fillStyle(col); for (let i = -1; i < 6; i++) dg.fillEllipse(i * 120, y + (i % 2) * amp, 190, 70); dg.fillRect(-120, y + 20, 700, 200); s.tweens.add({ targets: dg, x: -120, duration: d, repeat: -1 }); return dg; };
        dune(150, 0xe9b060, 6, 9000); dune(172, 0xd9993f, 8, 5000);
        const cac = s.add.graphics().setDepth(3); cac.fillStyle(0x3f8a4a).fillRoundedRect(332, 112, 12, 54, 4).fillRoundedRect(320, 126, 8, 22, 3).fillRect(320, 142, 14, 6).fillRoundedRect(344, 120, 8, 20, 3).fillRect(342, 136, 8, 6); s.tweens.add({ targets: cac, x: -480, duration: 10000, repeat: -1 });
        const p = A.penguin(s, 150, 146, { s: 1.4 }).setDepth(6); A.waddle(s, p, 190, 9);
        for (let i = 0; i < 4; i++) { const d = s.add.graphics().setDepth(7); d.fillStyle(0x6ad0ff).fillEllipse(0, 0, 4, 6); d.x = 140 + i * 6; d.y = 118; s.tweens.add({ targets: d, y: 156, x: 120 - i * 14, alpha: { from: 1, to: 0 }, duration: 900, delay: i * 220, repeat: -1 }); }
        for (let i = 0; i < 5; i++) { const l = s.add.rectangle(200, 160 + i * 5, 340 - i * 40, 1, 0xffffff, 0.35); s.tweens.add({ targets: l, alpha: { from: 0, to: 0.5 }, scaleX: { from: 0.8, to: 1.1 }, duration: 700 + i * 120, yoyo: true, repeat: -1 }); }
      } },
    { txt: () => 'Atravesó mares peligrosos, con olas gigantes, rayos y tiburones… ¡nada lo detuvo!',
      draw(s) {
        const g = s.add.graphics(); A.bands(g, 0, 0, W, 108, [0x1a2448, 0x2c4a78, 0x4a78a8], 4); A.bands(g, 0, 100, W, 130, [0x2a6a9a, 0x1b4a7a, 0x10294e], 4);
        for (let r = 0; r < 5; r++) { const wv = s.add.graphics().setDepth(2 + r); wv.lineStyle(3, r % 2 ? 0xbfe6ff : 0x7fc4f0, 0.9); wv.beginPath(); for (let x = -40; x <= 480; x += 4) { const y = 110 + r * 24 + Math.sin(x / 40 * Math.PI) * (4 + r); x === -40 ? wv.moveTo(x, y) : wv.lineTo(x, y); } wv.strokePath(); s.tweens.add({ targets: wv, x: -(r % 2 ? 40 : -40), duration: 1100 - r * 110, repeat: -1 }); }
        const raft = s.add.container(190, 138).setDepth(7); const rg = s.add.graphics(); rg.fillStyle(0xcfeeff).fillEllipse(0, 18, 80, 18).fillStyle(0x9cc8e6).fillEllipse(0, 22, 60, 10); raft.add(rg);
        const p = A.penguin(s, 0, 0, { s: 1.2 }); raft.add(p); s.tweens.add({ targets: raft, y: 146, angle: { from: -5, to: 5 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const fin = s.add.graphics().setDepth(6); fin.fillStyle(0x59627a).fillTriangle(0, 0, 18, 0, 6, -20); fin.fillStyle(0xffffff, 0.8).fillEllipse(8, 2, 28, 4); fin.y = 160; fin.x = -40; s.tweens.add({ targets: fin, x: 440, duration: 6000, repeat: -1 });
        for (let i = 0; i < 30; i++) { const l = s.add.rectangle(Math.random() * W, -10, 1, 7, 0xbfe6ff, 0.7).setDepth(9); s.tweens.add({ targets: l, y: H + 10, x: l.x - 14, duration: 500 + Math.random() * 300, repeat: -1, delay: Math.random() * 600 }); }
        const fl = s.add.rectangle(200, 112, W, H, 0xffffff, 0).setDepth(10);
        s.time.addEvent({ delay: 1500, loop: true, callback: () => { fl.alpha = 0.85; s.tweens.add({ targets: fl, alpha: 0, duration: 380 }); } });
        const bolt = s.add.graphics().setDepth(8); bolt.lineStyle(3, 0xfff59a).beginPath().moveTo(300, 0).lineTo(285, 30).lineTo(300, 34).lineTo(280, 70).strokePath(); s.tweens.add({ targets: bolt, alpha: { from: 0, to: 1 }, duration: 120, yoyo: true, repeat: -1, repeatDelay: 1380 });
      } },
    { txt: () => 'Se metió en la selva más espesa, entre lianas, loros chismosos y bichos raros, buscando la piedra perfecta.',
      draw(s) {
        const g = s.add.graphics(); A.bands(g, 0, 0, W, H, [0x174a30, 0x2f8a4a, 0x8ccd6a], 4);
        for (let i = 0; i < 9; i++) g.fillStyle(0x1f6a3a).fillCircle(20 + i * 46, 78 + (i % 3) * 8, 34);
        [30, 110, 215, 330].forEach((x, i) => { g.fillStyle(0x6b4423).fillRect(x, 70, 10, 120); [0x2a7a40, 0x3a9a50, 0x57b85a].forEach((c, k) => g.fillStyle(c).fillCircle(x + 5 + (k - 1) * 16, 62 + (k % 2) * 10, 28 - k * 3)); });
        g.fillStyle(0x4a9a3a).fillRect(0, 186, W, 40).fillStyle(0x3a7a30).fillEllipse(80, 190, 180, 14).fillEllipse(300, 196, 200, 14);
        [60, 170, 270, 360].forEach((x, i) => { const v = s.add.graphics({ x, y: 0 }).setDepth(5); v.lineStyle(3, 0x2c7a38).lineBetween(0, 0, 0, 40 + i * 12); v.fillStyle(0x3aaa4a).fillCircle(0, 40 + i * 12, 4); v.angle = -5; s.tweens.add({ targets: v, angle: 5, duration: 1200 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); });
        const p = A.penguin(s, 130, 146, { s: 1.35 }).setDepth(6); A.waddle(s, p, 240, 8);
        const leaf = s.add.graphics().setDepth(7); leaf.fillStyle(0x57d86a).fillEllipse(0, 0, 18, 9); leaf.x = 150; leaf.y = 136; leaf.angle = -25; s.tweens.add({ targets: leaf, angle: -5, duration: 240, yoyo: true, repeat: -1 });
        const par = s.add.container(-30, 60).setDepth(8), pg = s.add.graphics(); pg.fillStyle(0xe63946).fillEllipse(0, 0, 18, 10).fillStyle(0x2a6fdb).fillTriangle(-6, 0, -22, 6, -6, 6).fillStyle(0xffd23a).fillCircle(8, -2, 4).fillStyle(0xff9d2e).fillTriangle(11, -2, 16, 0, 11, 2); par.add(pg);
        s.tweens.add({ targets: par, x: 440, y: { from: 50, to: 90 }, duration: 4200, repeat: -1 }); s.tweens.add({ targets: pg, scaleY: { from: 1, to: 0.7 }, duration: 140, yoyo: true, repeat: -1 });
        const cha = A.text(s, 330, 110, '¡chisme!', 14, '#ffd23a').setDepth(9); s.tweens.add({ targets: cha, alpha: { from: 0, to: 1 }, y: 102, duration: 700, yoyo: true, repeat: -1, repeatDelay: 600 });
        for (let i = 0; i < 12; i++) { const f = s.add.rectangle(Math.random() * W, 80 + Math.random() * 100, 2, 2, 0xfff59a).setDepth(9); s.tweens.add({ targets: f, alpha: { from: 0, to: 1 }, x: f.x + 12, duration: 800 + Math.random() * 800, yoyo: true, repeat: -1, delay: Math.random() * 800 }); }
      } },
    { txt: () => 'Fue hasta Suiza y hasta Suecia… ¡ida y vuelta! Cada piedra que encontraba era bonita, pero ninguna era LA piedra.',
      draw(s) {
        const g = s.add.graphics(); A.bands(g, 0, 0, 200, 150, [0x6fb6ff, 0xbfe3ff, 0xeaf6ff], 4); A.bands(g, 200, 0, 200, 150, [0x1a1240, 0x3b2a8a, 0x7a4aa0], 4);
        g.fillStyle(0x9fb4c8).fillTriangle(-10, 150, 60, 50, 140, 150).fillTriangle(70, 150, 140, 70, 215, 150).fillStyle(0xffffff).fillTriangle(48, 72, 60, 50, 72, 72).fillTriangle(126, 92, 140, 70, 154, 92);
        g.fillStyle(0xf4fbff).fillRect(0, 140, W, 90).fillEllipse(200, 146, 520, 30); g.fillStyle(0xdcd0f0).fillRect(200, 140, 200, 90);
        g.fillStyle(0x3a2a70).fillTriangle(215, 150, 270, 96, 330, 150).fillTriangle(300, 150, 360, 106, 420, 150);
        g.fillStyle(0x6b4423).fillRect(50, 70, 3, 72).fillRect(352, 70, 3, 72);
        const f1 = s.add.graphics({ x: 53, y: 70 }); f1.fillStyle(0xd62839).fillRect(0, 0, 30, 24).fillStyle(0xffffff).fillRect(12, 4, 6, 16).fillRect(7, 9, 16, 6); s.tweens.add({ targets: f1, scaleX: { from: 1, to: 0.9 }, duration: 500, yoyo: true, repeat: -1 });
        const f2 = s.add.graphics({ x: 355, y: 70 }); f2.fillStyle(0x006aa7).fillRect(0, 0, 30, 24).fillStyle(0xfecc02).fillRect(8, 0, 6, 24).fillRect(0, 9, 30, 6); s.tweens.add({ targets: f2, scaleX: { from: 1, to: 0.9 }, duration: 500, yoyo: true, repeat: -1, delay: 200 });
        A.aurora(s, 3); A.text(s, 70, 50, 'SUIZA', 14, '#d62839', { stroke: '#ffffff' }); A.text(s, 345, 50, 'SUECIA', 14, '#fecc02');
        const p = A.penguin(s, 80, 148, { s: 1.2 }).setDepth(6); A.waddle(s, p, 150, 10);
        s.tweens.add({ targets: p, x: 320, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => p.flip(-1), onRepeat: () => p.flip(1) });
        for (let i = 0; i < 6; i++) { const l = s.add.rectangle(200, 134 + i * 7, 26, 1.5, 0xffffff, 0.7).setDepth(5); s.tweens.add({ targets: l, x: { from: 90, to: 310 }, alpha: { from: 0.9, to: 0 }, duration: 1500, yoyo: true, repeat: -1, delay: i * 90 }); }
        const t = A.text(s, 200, 98, '← ida y vuelta →', 16, '#ffffff').setDepth(8); s.tweens.add({ targets: t, scale: { from: 0.9, to: 1.15 }, duration: 500, yoyo: true, repeat: -1 });
      } },
    { txt: (N, D) => 'Hasta que por fin la encontró. Volvió corriendo, miró a ' + D + ' y le entregó la piedra más lisa del mundo. Y se amaron, muy fuerte, para siempre.',
      draw(s) {
        const g = s.add.graphics(); A.bands(g, 0, 0, W, 150, [0x2b1b6e, 0x8a3a9a, 0xff6f91, 0xffb86b, 0xffe08a], 4);
        g.fillStyle(0xfff0d0).fillCircle(200, 138, 30); g.fillStyle(0xffd9ec).fillRect(0, 140, W, 90).fillEllipse(200, 146, 520, 30); g.fillStyle(0xffc0dc).fillEllipse(200, 196, 360, 14);
        const big = s.add.graphics(); A.heart(big, 0, 0, 74, 0xff5d97, 0.4); big.x = 200; big.y = 88; s.tweens.add({ targets: big, scale: { from: 0.92, to: 1.12 }, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const a = A.penguin(s, 140, 144, { s: 1.5 }).setDepth(5), b = A.penguin(s, 262, 144, { s: 1.65, fem: true, flip: true }).setDepth(5);
        s.tweens.add({ targets: a, x: 150, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); s.tweens.add({ targets: b, angle: { from: -3, to: 3 }, duration: 520, yoyo: true, repeat: -1 });
        a.flR.rotation = -1.1;
        const gl = s.add.graphics().setDepth(6); gl.fillStyle(0xffffff, 0.35).fillCircle(0, 0, 22).fillStyle(0xffffff, 0.6).fillCircle(0, 0, 13); gl.x = 200; gl.y = 128; s.tweens.add({ targets: gl, scale: { from: 0.8, to: 1.3 }, duration: 500, yoyo: true, repeat: -1 });
        const st = s.add.graphics().setDepth(7); st.fillStyle(0x8d95ab).fillEllipse(0, 0, 22, 12).fillStyle(0xc4cbdc).fillEllipse(-2, -1.5, 17, 8).fillStyle(0xffffff).fillEllipse(-5, -3, 6, 2.5); st.x = 200; st.y = 128; s.tweens.add({ targets: st, y: 124, duration: 450, yoyo: true, repeat: -1 });
        for (let i = 0; i < 16; i++) { const h = s.add.graphics().setDepth(8); A.heart(h, 0, 0, 4 + (i % 4) * 2, [0xff5d97, 0xff9fd0, 0xffd0e0, 0xc58cff][i % 4]); h.x = 30 + Math.random() * 340; h.y = 170; s.tweens.add({ targets: h, y: -10, x: h.x + (Math.random() * 40 - 20), alpha: { from: 1, to: 0.2 }, duration: 2600 + Math.random() * 1400, delay: i * 240, repeat: -1 }); }
        for (let i = 0; i < 8; i++) { const sp = s.add.graphics().setDepth(9); A.sparkle(sp, 0, 0, 5, 0xffffff); sp.x = 120 + Math.random() * 160; sp.y = 60 + Math.random() * 80; s.tweens.add({ targets: sp, alpha: { from: 0, to: 1 }, scale: { from: 0.3, to: 1.4 }, duration: 450, yoyo: true, repeat: -1, delay: i * 120 }); }
        const fl = s.add.rectangle(200, 112, W, H, 0xffffff, 1).setDepth(11); s.tweens.add({ targets: fl, alpha: 0, duration: 900 });
      } },
    { txt: (N) => 'Y entonces ' + N + ' se despertó… ¡todo había sido un sueño! Pero ya sabía cuál era su pingüina.',
      draw(s, n) {
        const g = s.add.graphics(); A.bands(g, 0, 0, W, 150, [0x2a2a5a, 0x3e3e84], 5); g.fillStyle(0x8a5a3a).fillRect(0, 150, W, 80).fillStyle(0x7a4a2e).fillRect(0, 150, W, 4);
        for (let i = 0; i < 9; i++) g.fillStyle(0x7a4a2e).fillRect(i * 46, 154, 2, 80);
        const win = s.add.graphics(); win.fillStyle(0x4a2a1e).fillRect(30, 28, 70, 70); win.fillStyle(0x0e0e3a).fillRect(35, 33, 60, 60); win.fillStyle(0xfff7d6).fillCircle(72, 54, 9); win.fillStyle(0x4a2a1e).fillRect(63, 33, 3, 60).fillRect(35, 62, 60, 3);
        const dawn = s.add.rectangle(65, 63, 60, 60, 0xffb86b, 0).setDepth(1); s.time.delayedCall(2600, () => s.tweens.add({ targets: dawn, alpha: 0.9, duration: 900 }));
        const bed = s.add.graphics().setDepth(2); bed.fillStyle(0x5a3820).fillRect(110, 92, 190, 78).fillStyle(0x4a2c18).fillRect(110, 92, 12, 78); bed.fillStyle(0xfffaf0).fillRoundedRect(130, 100, 56, 22, 6);
        const sp = s.add.image(200, 134, 'char_id_sebas', 'd0').setOrigin(0.5, 1).setScale(2.4).setDepth(3);
        const bl = s.add.graphics().setDepth(4); bl.fillStyle(0x7a4ad6).fillRoundedRect(118, 118, 180, 52, 8); bl.fillStyle(0x9a6af0).fillRect(118, 118, 180, 8); for (let i = 0; i < 6; i++) A.heart(bl, 140 + i * 28, 146 + (i % 2) * 10, 4, 0xffc2e0);
        s.tweens.add({ targets: [sp, bl], y: '+=1.5', duration: 900, yoyo: true, repeat: -1 });
        for (let i = 0; i < 3; i++) { const z = A.text(s, 215 + i * 14, 92 - i * 14, 'Z', 14 + i * 4, '#bfe6ff').setDepth(6); s.tweens.add({ targets: z, y: z.y - 12, alpha: { from: 0, to: 1 }, duration: 900, delay: i * 300, yoyo: true, repeat: 1 }); }
        s.time.delayedCall(2600, () => {
          const ex = A.text(s, 214, 70, '¡!', 26, '#ffd23a').setDepth(8); s.tweens.add({ targets: ex, scale: { from: 0.3, to: 1.3 }, duration: 260, yoyo: true });
          s.tweens.add({ targets: sp, y: 118, duration: 200, yoyo: true, repeat: 1 });
          const bub = s.add.graphics().setDepth(7); bub.fillStyle(0xffffff).fillEllipse(300, 54, 84, 64).fillCircle(262, 90, 6).fillCircle(250, 100, 4); bub.lineStyle(2, 0xc9b6dd).strokeEllipse(300, 54, 84, 64); bub.alpha = 0;
          if (s.textures.exists('char_id_dani')) { const face = s.add.image(300, 34, 'char_id_dani', 'd0').setOrigin(0.5, 0).setScale(3).setCrop(0, 0, 18, 15).setDepth(8); face.alpha = 0; s.tweens.add({ targets: face, alpha: 1, duration: 500, delay: 400 }); s.tweens.add({ targets: face, y: 31, duration: 700, yoyo: true, repeat: -1, delay: 900 }); }
          s.tweens.add({ targets: bub, alpha: 1, duration: 500, delay: 300 });
          for (let i = 0; i < 6; i++) { const h = s.add.graphics().setDepth(9); A.heart(h, 0, 0, 5 + (i % 2) * 2, i % 2 ? 0xff5d97 : 0xff9fd0); h.x = 262 + i * 12; h.y = 36; h.alpha = 0; s.tweens.add({ targets: h, y: 6, alpha: { from: 1, to: 0 }, duration: 1500, delay: 700 + i * 240, repeat: -1 }); }
        });
      } }
  ];

  class StoryScene extends Phaser.Scene {
    constructor() { super('story'); }
    create() {
      this.i = -1; this.typing = false; this.busy = false; this.done = false; this.ui = [];
      const names = this.names = { sebas: nameOf('sebas'), dani: nameOf('dani') };
      this.cameras.main.setBackgroundColor('#120a22');
      // caja de texto
      const box = this.add.graphics().setDepth(100); box.fillStyle(0x2b1b30, 0.92).fillRoundedRect(6, 170, 388, 52, 6); box.lineStyle(2, 0xfff3d6).strokeRoundedRect(6, 170, 388, 52, 6); box.lineStyle(1, 0xff7aa8).strokeRoundedRect(9, 173, 382, 46, 4);
      this.txt = this.add.text(16, 176, '', { fontFamily: 'VT323', fontSize: '15px', color: '#fff3d6', wordWrap: { width: 368 }, lineSpacing: 0 }).setDepth(101);
      this.hint = this.add.text(380, 209, '▼', { fontFamily: 'VT323', fontSize: '16px', color: '#ffd24a' }).setOrigin(0.5).setDepth(101).setAlpha(0);
      this.tweens.add({ targets: this.hint, y: 214, duration: 400, yoyo: true, repeat: -1 });
      this.dots = this.add.graphics().setDepth(101);
      this.skip = this.add.text(394, 6, 'Saltar ⏭', { fontFamily: 'VT323', fontSize: '14px', color: '#ffffff', backgroundColor: '#2b1b30', padding: { x: 4, y: 1 } }).setOrigin(1, 0).setDepth(101).setInteractive({ useHandCursor: true });
      this.skip.on('pointerdown', (p, lx, ly, e) => { e && e.stopPropagation && e.stopPropagation(); this.finish(); });
      this.fade = this.add.rectangle(W / 2, H / 2, W, H, 0x120a22, 1).setDepth(200);
      this.ui = this.children.list.slice();
      this.input.on('pointerdown', () => this.advance());
      this.input.keyboard.on('keydown-SPACE', () => this.advance()); this.input.keyboard.on('keydown-ENTER', () => this.advance()); this.input.keyboard.on('keydown-RIGHT', () => this.advance());
      G.refreshTextures();
      this.go(0);
    }
    clearPanel() {
      this.tweens.getTweens().forEach(t => { if (!this.ui.includes(t.targets && t.targets[0])) { } });
      this.time.removeAllEvents(); this.tweens.killAll();
      this.children.list.filter(o => !this.ui.includes(o)).forEach(o => o.destroy());
      // reponer animaciones de la interfaz
      this.tweens.add({ targets: this.hint, y: 214, duration: 400, yoyo: true, repeat: -1 });
    }
    go(i) {
      if (i >= PANELS.length) { this.finish(); return; }
      this.busy = true; this.hint.setAlpha(0);
      this.tweens.add({ targets: this.fade, alpha: 1, duration: this.i < 0 ? 1 : 200, onComplete: () => {
        this.clearPanel(); this.i = i;
        PANELS[i].draw(this, this.names);
        this.drawDots();
        this.tweens.add({ targets: this.fade, alpha: 0, duration: 300, onComplete: () => { this.busy = false; } });
        this.typeText(PANELS[i].txt(this.names.sebas, this.names.dani));
      } });
    }
    drawDots() { const g = this.dots; g.clear(); const n = PANELS.length, x0 = W / 2 - n * 6; for (let k = 0; k < n; k++) { g.fillStyle(k === this.i ? 0xffd24a : 0xffffff, k <= this.i ? 1 : 0.4).fillRect(x0 + k * 12, 8, 7, 4); } }
    typeText(str) {
      this.full = str; this.n = 0; this.typing = true; this.txt.setText(''); this.hint.setAlpha(0);
      if (this.tev) this.tev.remove();
      this.tev = this.time.addEvent({ delay: 24, loop: true, callback: () => { this.n += 1; this.txt.setText(this.full.slice(0, this.n)); if (this.n >= this.full.length) this.endType(); } });
    }
    endType() { this.typing = false; if (this.tev) this.tev.remove(); this.txt.setText(this.full); this.hint.setAlpha(1); }
    advance() { if (this.done || this.busy) return; if (this.typing) { this.endType(); return; } G.audio.sfx('pop'); this.go(this.i + 1); }
    finish() {
      if (this.done) return; this.done = true;
      this.clearPanel(); this.txt.setText(''); this.hint.setAlpha(0); this.dots.clear();
      const bg = this.add.graphics(); A.bands(bg, 0, 0, W, H, [0x140a3a, 0x6a3a9a, 0xff9ec0], 4); A.stars(this, 30, 120); A.snow(this, 30, 50);
      const p1 = A.penguin(this, 170, 140, { s: 1.4 }), p2 = A.penguin(this, 230, 140, { s: 1.5, fem: true, flip: true }); A.waddle(this, p1, 400, 4); A.waddle(this, p2, 420, 4);
      A.text(this, 200, 70, '¡Listo!', 22, '#ffffff'); this.wait = A.text(this, 200, 190, 'Esperando a ' + nameOf(G.state.me.id === 'sebas' ? 'dani' : 'sebas') + '…', 16, '#fff3d6');
      this.fade.setAlpha(0); G.state.storySeen = true; G.save(); G.flow.storyDone();
    }
  }
  function nameOf(id) { const m = G.state.me, p = G.state.partner; return (m.id === id ? m.name : (p.id === id ? p.name : '')) || G.IDS[id].label; }
  G.StoryScene = StoryScene;
})();
