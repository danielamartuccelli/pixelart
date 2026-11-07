/* ===========================================================
   scenes/cocina.js — ETAPA 5 · LOS CCELLIS (Cocina de Daniela, Lince) · Ramen cooperativo tipo Overcooked
   - Los dos pueden hacer de todo (no hay roles fijos), pero la cocina CAMBIA en cada nivel:
     abierta → dos islas → dividida con PASE → arriba/abajo → lados invertidos (5 niveles).
   - Antes de cada nivel hay una ventana tutorial (estilo Overcooked) que explica estaciones, receta y novedades.
   - Pedidos que llegan con barra de paciencia, tiempo límite, estrellas; sin lavar platos.
   - Al superar el nivel 5: premio = FIDEOS MARTUCCINI (escena 'martuccini').
   Red: el ANFITRIÓN simula (kitchen_sim.js) y manda snapshots (c_snap); el invitado manda su posición (c_pos)
   y sus pulsaciones (c_in). Modo prueba: ?solo=1&go=cocina&clv=3&cauto=1  (TAB cambia de cocinero)  ·  &cdur=30  ·  &cpage=2
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H, K = G.K, Q = new URLSearchParams(location.search);
  const TS = 16, OY = 52, SPEED = 58;
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const SHORT = { mild: 'Mild', picante: 'Picante', hongos: 'Hongos', segundo: 'Segundo', tocino: 'Tocino', mano: 'A mano', super: 'SuperPic', ccelli: 'CCELLI' };
  const MINI = { '#': 0x4a3270, '.': 0xffe9c8, '1': 0xffe9c8, '2': 0xffe9c8, f: 0xa87444, h: 0xa87444, e: 0xa87444, b: 0xa87444, a: 0xa87444, r: 0xa87444, s: 0xa87444, p: 0xffffff, o: 0xb9c0cc, t: 0xf0cf94, n: 0x4a4a58, x: 0xffb6c9, m: 0xfaf3e0, k: 0xe08a2a, v: 0x7fd1ae, z: 0x8a93a6, c: 0xd9a066, P: 0xf4d27a };
  const KIND_OF = { f: 'cajon', h: 'cajon', e: 'cajon', b: 'cajon', a: 'cajon', r: 'cajon', s: 'cajon', p: 'plato', o: 'olla', t: 'tabla', n: 'sarten', x: 'sobre', m: 'amasadora', k: 'caldero', v: 'vent', z: 'basurero', c: 'mesa', P: 'pase' };

  class CocinaScene extends Phaser.Scene {
    constructor() { super('cocina'); }

    create() {
      A.emoteTextures(this.game); G.refreshTextures(); K.makeTextures(this);
      const net = G.net, kit = G.state.kitchen;
      this.isHost = G.solo || net.role === 'host'; this.local = this.isHost ? 0 : 1; this.ctl = this.local;
      const qlv = +Q.get('clv');
      this.level = qlv ? Math.min(4, Math.max(0, qlv - 1)) : Math.min(4, Math.max(0, (kit.unlocked || 1) - 1));
      this.phase = 'brief'; this.page = 0; this.ready = { me: false, partner: false };
      this.ui = []; this.world = []; this.chefs = []; this.pool = []; this.pool2 = []; this.pendingEv = []; this.sendT = 0; this.posT = 0; this.cd = 0;
      this.sim = new K.Sim(this.level);
      this.fx = this.add.graphics().setDepth(4000);
      this.keys = this.input.keyboard.addKeys({ up: 'UP', w: 'W', down: 'DOWN', s: 'S', left: 'LEFT', a: 'A', right: 'RIGHT', d: 'D' }, false);
      const dn = e => { if (e && e.repeat) return; this.down(); }, up = () => this.up();
      ['E', 'SPACE'].forEach(k => { this.input.keyboard.on('keydown-' + k, dn); this.input.keyboard.on('keyup-' + k, up); });
      this.input.keyboard.on('keydown-TAB', e => { if (e && e.preventDefault) e.preventDefault(); if (G.solo && this.phase === 'play') { this.sim.release(this.ctl); this.ctl = 1 - this.ctl; } });
      this.input.on('pointerdown', () => { if (this.phase === 'play') this.down(); });
      this.input.on('pointerup', () => { if (this.phase === 'play') this.up(); });
      this.input.keyboard.on('keydown-ESC', () => { if (this.phase !== 'play') this.act('exit'); });
      this.nets = [
        ['c_cfg', d => { const k = G.state.kitchen; k.unlocked = Math.max(k.unlocked || 1, d.unlocked || 1); if (this.isHost || this.phase !== 'brief') return; if (d.level !== this.level) { this.openBrief(d.level, 0); } }],
        ['c_ready', d => { this.ready.partner = !!d.r; if (this.phase === 'brief') this.drawBrief(); this.tryStart(); }],
        ['c_go', d => { if (this.phase === 'brief') this.startLevel(d.level, d.seed, d.dur); }],
        ['c_pos', d => this.onPos(d)], ['c_in', d => this.onIn(d)], ['c_snap', d => this.onSnap(d)],
        ['c_req', d => this.act(d.a)], ['c_brief', d => this.openBrief(d.level, d.page)]
      ];
      this.nets.forEach(([t, f]) => (net.handlers[t] = net.handlers[t] || []).push(f));
      this.events.once('shutdown', () => { this.nets.forEach(([t, f]) => { net.handlers[t] = (net.handlers[t] || []).filter(x => x !== f); }); });
      // la barra de estado va DENTRO de la pared del fondo (arriba y a los lados no tapa el HUD del navegador)
      this.hud = A.text(this, 224, 218, '', 10, '#fff3d6', { strokeThickness: 2 }).setDepth(5000);
      this.clock = A.text(this, 6, OY + 8, '', 13, '#ffd24a', { strokeThickness: 3 }).setOrigin(0, 0.5).setDepth(5000);
      this.scoreT = A.text(this, 394, OY + 8, '', 12, '#ffffff', { strokeThickness: 3 }).setOrigin(1, 0.5).setDepth(5000);
      this.cardTxt = [0, 1, 2, 3, 4].map(() => this.add.text(0, 0, '', { fontFamily: 'VT323', fontSize: '10px', color: '#2b1b30' }).setDepth(4600).setVisible(false));
      // el anfitrión repite el nivel elegido mientras se prepara (el invitado puede entrar un poco después)
      if (this.isHost) this.cfgT = this.time.addEvent({ delay: 1200, loop: true, callback: () => { if (this.phase === 'brief') this.send('c_cfg', { level: this.level, unlocked: G.state.kitchen.unlocked || 1 }); } });
      const pg = Q.get('cpage'); this.openBrief(this.level, pg !== null ? +pg : 0);
      if (G.solo && Q.get('cauto') === '1') this.time.delayedCall(300, () => this.startLevel(this.level, 777, +Q.get('cdur') || 0));
    }
    send(t, d) { if (G.net.connected) G.net.send(t, d); }
    meName(i) { return (i === this.local ? G.state.me : G.state.partner).name || (i === this.local ? 'Tú' : 'Pareja'); }

    /* ======================= ventanas tutorial ======================= */
    pagesFor(l) { return l === 0 ? ['intro', 'estaciones', 'receta', 'recetas'] : ['nuevo', 'recetas']; }
    openBrief(level, page) {
      this.level = level; this.sim = new K.Sim(level); this.phase = 'brief'; this.ready = { me: false, partner: false };
      const n = this.pagesFor(level).length; this.page = page === 'last' ? n - 1 : Math.min(n - 1, Math.max(0, page | 0));
      this.clearWorld(); this.fx.clear(); this.hud.setText(''); this.clock.setText(''); this.scoreT.setText('');
      this.cardTxt.forEach(t => t.setVisible(false)); this.pool.concat(this.pool2).forEach(i => i.setVisible(false));
      this.cardBg = null;
      const g = this.add.graphics().setDepth(0); g.fillStyle(0xffe9c8).fillRect(0, 0, W, H); this.world.push(g);
      for (let y = 0; y < 15; y++) for (let x = 0; x < 25; x++) if ((x + y) % 2) { g.fillStyle(0xf6d9b2).fillRect(x * 16, y * 16, 16, 16); }
      this.drawBrief();
    }
    clearUi() { this.ui.forEach(o => o.destroy()); this.ui = []; }
    add_(o) { this.ui.push(o); return o; }
    T(x, y, str, size, color, o) { return this.add_(this.add.text(x, y, str, Object.assign({ fontFamily: 'VT323', fontSize: (size || 12) + 'px', color: color || '#2b1b30' }, o || {})).setDepth(120)); }
    I(key, x, y, sc) { return this.add_(this.add.image(x, y, key).setScale(sc || 1).setDepth(121)); }
    btn(x, y, w, h, label, color, fn, fs, base) {
      base = base || 125;
      const g = this.add_(this.add.graphics().setDepth(base)); g.fillStyle(0x2b1b30).fillRoundedRect(x - w / 2 + 1, y - h / 2 + 3, w, h, 4).fillStyle(color).fillRoundedRect(x - w / 2, y - h / 2, w, h, 4).lineStyle(1.5, 0x2b1b30).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 4);
      this.add_(this.add.text(x, y, label, { fontFamily: 'VT323', fontSize: (fs || 14) + 'px', color: '#2b1b30' }).setOrigin(0.5).setDepth(base + 1));
      if (fn) this.add_(this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(base + 2).on('pointerdown', () => { G.audio.sfx('click'); fn(); }));
    }
    /* fila de pasos: 'i:fideo' ingrediente · 's:olla' estación · '>' flecha · '+' más · cualquier otro texto */
    flow(x, y, toks) {
      toks.forEach(t => {
        if (t === '>') { this.T(x, y - 6, '▶', 12, '#b5502a'); x += 12; }
        else if (t === '+') { this.T(x + 1, y - 7, '+', 14, '#b5502a'); x += 11; }
        else if (t.startsWith('i:')) { this.I('ci_' + t.slice(2), x + 8, y, 1.25); x += 18; }
        else if (t.startsWith('s:')) { this.I('cs_' + t.slice(2), x + 8, y, 1); x += 19; }
        else { const o = this.T(x, y - 6, t, 11, '#6a4a2a'); x += o.width + 3; }
      });
      return x;
    }
    drawBrief() {
      this.clearUi(); if (this.phase !== 'brief') return;
      const pages = this.pagesFor(this.level), name = pages[this.page], L = K.LEVELS[this.level], D = 100;
      const pg = this.add_(this.add.graphics().setDepth(D)); pg.fillStyle(0x2b1b30).fillRoundedRect(8, 18, 384, 192, 8).fillStyle(0xfff3d6).fillRoundedRect(11, 21, 378, 186, 6);
      pg.fillStyle(0xe63946).fillRoundedRect(11, 21, 378, 20, { tl: 6, tr: 6, bl: 0, br: 0 }); pg.fillStyle(0xffffff, 0.25).fillRect(11, 21, 378, 2);
      this.T(18, 24, '🍜 LOS CCELLIS · Nivel ' + (this.level + 1) + ': ' + L.name, 14, '#ffffff', { stroke: '#7a1620', strokeThickness: 2 });
      // selector de nivel (solo anfitrión)
      const unlocked = G.state.kitchen.unlocked || 1;
      for (let i = 0; i < 5; i++) {
        const lock = i + 1 > unlocked, sel = i === this.level;
        this.btn(298 + i * 17, 31, 15, 13, lock ? '🔒' : String(i + 1), sel ? 0xffd24a : lock ? 0xbbbbbb : 0xffffff, (this.isHost && !lock) ? () => { this.level = i; this.send('c_cfg', { level: i, unlocked }); this.openBrief(i, 0); } : null, lock ? 8 : 12);
      }
      this['page_' + name](L);
      // pie
      const n = pages.length, last = this.page === n - 1;
      this.T(18, 190, 'Página ' + (this.page + 1) + '/' + n, 11, '#8a6a4a');
      if (this.page > 0) this.btn(88, 195, 60, 16, '◀ Atrás', 0xffffff, () => this.openBrief(this.level, this.page - 1), 13);
      if (!last) this.btn(330, 195, 100, 18, 'Siguiente ▶', 0xffd24a, () => this.openBrief(this.level, this.page + 1), 14);
      else {
        const pn = G.state.partner.name || 'Pareja';
        this.btn(330, 195, 100, 18, this.ready.me ? '✔ ¡Listo!' : '¡A cocinar!', this.ready.me ? 0x7fd1ae : 0xff7aa8, () => { this.ready.me = !this.ready.me; this.send('c_ready', { r: this.ready.me }); this.drawBrief(); this.tryStart(); }, 14);
        this.T(130, 189, G.solo ? 'Modo prueba: TAB cambia de cocinero' : (this.ready.partner ? pn + ': ✔ listo' : pn + ': esperando…'), 11, '#6a4a2a');
      }
    }
    page_intro(L) {
      this.T(200, 62, 'LOS CCELLIS', 28, '#e63946', { stroke: '#ffffff', strokeThickness: 4 }).setOrigin(0.5);
      this.T(200, 82, 'Restaurante de ramen · ¡cocinen juntos!', 13, '#6a4a2a').setOrigin(0.5);
      const L1 = [['Flechas o WASD', 'moverte'], ['E, Espacio o click', 'agarrar, soltar y usar'], ['Mantén pulsado', 'cortar, amasar, sellar, servir caldo'], ['Pedidos de arriba', 'atiéndelos antes de que se acabe la barra'], ['Los dos hacen de todo', 'pero solos no llegan 😉 (sin lavar platos)']];
      L1.forEach(([a, b], i) => { this.T(24, 100 + i * 17, a, 13, '#b5502a'); this.T(130, 100 + i * 17, b, 13, '#2b1b30'); });
      [['me', 330], ['partner', 366]].forEach(([w, x], i) => { const s = this.add_(this.add.sprite(x, 158, 'char_' + w, 'd0').setOrigin(0.5, 1).setScale(2).setDepth(122)); const hat = this.I('c_hat', x, 158 - 47, 2); this.tweens.add({ targets: [s, hat], y: '-=3', duration: 500, yoyo: true, repeat: -1, delay: i * 250 }); });
      this.T(330, 168, this.meName(this.local), 11, '#b5502a').setOrigin(0.5); this.T(366, 168, this.meName(1 - this.local), 11, '#b5502a').setOrigin(0.5);
    }
    page_estaciones() {
      this.T(200, 50, 'Las estaciones de la cocina', 15, '#b5502a').setOrigin(0.5);
      const S = [['cajon', 'Cajones', 'infinitos', 'fideo'], ['plato', 'Platos', 'uno vacío'], ['olla', 'Olla', 'hierve sola'], ['tabla', 'Tabla', 'mantén: corta'], ['sarten', 'Sartén', 'fríe sola'],
        ['sobre', 'Sobre picante', 'ají y sellar'], ['caldero', 'Caldero', 'mantén: caldo'], ['vent', 'Ventanilla', 'entregar'], ['mesa', 'Mesa', 'armar platos'], ['basurero', 'Basurero', 'tirar']];
      S.forEach(([k, a, b, c], i) => {
        const x = 46 + (i % 5) * 76, y = 78 + Math.floor(i / 5) * 58;
        this.I('cs_' + k, x, y, 1.8); if (c) this.I('ci_' + c, x, y - 1, 1);
        this.T(x, y + 20, a, 12, '#2b1b30').setOrigin(0.5); this.T(x, y + 31, b, 10, '#8a6a4a').setOrigin(0.5, 0);
      });
    }
    page_receta() {
      this.T(200, 50, 'El ramen, paso a paso', 15, '#b5502a').setOrigin(0.5);
      const R = [['Fideos', ['i:fideo', '>', 's:olla', '8 s', '>', 'i:fideo_c']], ['Hongos', ['i:hongo', '>', 's:tabla', 'mantén', '>', 'i:hongo_c']], ['Huevo', ['i:huevo', '>', 's:olla', '9 s', '>', 'i:huevo_h', '>', 's:tabla', '>', 'i:huevo_m']],
        ['Picante', ['i:aji', '>', 's:sobre', 'hasta 3 ají, mantén para sellar', '>', 'i:sobre1']], ['Armado', ['i:plato', '>', 's:mesa', '+ ingredientes', '>', 's:caldero', 'al final', '>', 's:vent']]];
      R.forEach(([a, t], i) => { this.T(20, 62 + i * 21, a, 13, '#2b1b30'); this.flow(76, 70 + i * 21, t); });
      this.flow(20, 176, ['i:quemado', '¡Ojo! Lo que se pasa de cocción se quema: al basurero y vuelve a empezar.']);
    }
    page_recetas(L) {
      this.T(200, 50, 'Pedidos de este nivel', 15, '#b5502a').setOrigin(0.5);
      const uniq = [...new Set(L.pool)];
      uniq.forEach((r, i) => {
        const R = K.RECIPES[r], col = uniq.length > 4 ? i % 2 : 0, row = uniq.length > 4 ? Math.floor(i / 2) : i, x = uniq.length > 4 ? 20 + col * 185 : 60, y = 62 + row * 31;
        this.T(x, y, R.name + '  (' + R.pts + ' pts)', 13, '#2b1b30');
        const toks = []; R.parts.forEach((p, j) => { if (j) toks.push('+'); toks.push('i:' + p); }); toks.push(R.soup ? '+' : '', R.soup ? 'i:plato_caldo' : 'sin caldo'); this.flow(x, y + 20, toks.filter(Boolean));
      });
      this.T(200, 178, 'Cumple ★ ' + L.goals[0] + ' pts para pasar · ★★ ' + L.goals[1] + ' · ★★★ ' + L.goals[2] + '   ·   Dura ' + fmt(L.dur), 11, '#8a6a4a').setOrigin(0.5);
    }
    page_nuevo(L) {
      const lv = this.level; this.T(200, 50, L.sub, 15, '#b5502a').setOrigin(0.5);
      this.T(200, 66, L.intro, 12, '#2b1b30', { align: 'center', wordWrap: { width: 350 } }).setOrigin(0.5, 0);
      if (lv === 1) {
        this.flow(24, 108, ['Tocino:', 'i:tocino', '>', 's:sarten', '7 s', '>', 'i:tocino_f']);
        this.flow(24, 130, ['Segundo:', 'i:fideo_c', '>', 's:sarten', '5 s', '>', 'i:fideo_s', '+', 'i:salsa', '= plato SIN caldo']);
        this.T(24, 148, 'La olla y la sartén avisan con un círculo verde cuando está listo… y rojo si se va a quemar.', 11, '#6a4a2a', { wordWrap: { width: 350 } });
      } else if (lv === 3) {
        this.flow(24, 98, ['Fideo a mano:', 'i:harina', '>', 's:amasadora', 'mantén', '>', 'i:masa', '>', 's:tabla', 'mantén']);
        this.flow(24, 116, ['i:masa_cortada', '>', 's:olla', '5 s', '>', 'i:fideo_f', '+', 'i:huevo_m', '+', 'i:salsa', '+', 'caldo = ramen a mano']);
      }
      if (lv >= 2) this.miniMap(lv);
      if (lv === 4) { this.T(24, 168, 'CCELLI SUPREMO:', 12, '#b5502a'); this.flow(112, 172, ['i:fideo_c', '+', 'i:hongo_c', '+', 'i:tocino_f', '+', 'i:huevo_m', '+', 'i:sobre2', '+', 'i:plato_caldo']); }
    }
    /* plano en miniatura de la cocina del nivel */
    miniMap(lv) {
      const map = K.LEVELS[lv].map, S = lv === 3 ? 5 : 6, x0 = 200 - 25 * S / 2, y0 = lv === 3 ? 139 : 102, g = this.add_(this.add.graphics().setDepth(121));
      g.fillStyle(0x2b1b30).fillRect(x0 - 2, y0 - 2, 25 * S + 4, 10 * S + 4);
      map.forEach((row, y) => [...row].forEach((ch, x) => { g.fillStyle(MINI[ch] === undefined ? 0xffe9c8 : MINI[ch]).fillRect(x0 + x * S, y0 + y * S, S - 0.5, S - 0.5); }));
      const sim = new K.Sim(lv);
      [[0, '1'], [1, '2']].forEach(([i, k]) => { const s = sim.spawns[k]; if (!s) return; const px = x0 + s.x / TS * S, py = y0 + s.y / TS * S; g.fillStyle(i === this.local ? 0xff7aa8 : 0x6fd0ff).fillCircle(px, py - 3, 3.4); g.lineStyle(1, 0x2b1b30).strokeCircle(px, py - 3, 3.4); this.T(px, py + 8, this.meName(i), 10, i === this.local ? '#e63946' : '#2a7fa8').setOrigin(0.5, 0).setDepth(130); });
    }

    tryStart() {
      if (this.phase !== 'brief' || !this.ready.me) return;
      if (!(G.solo || (this.ready.partner && G.net.role === 'host'))) return;
      const seed = Math.floor(Math.random() * 2 ** 31), dur = +Q.get('cdur') || 0;
      this.send('c_go', { level: this.level, seed, dur }); this.startLevel(this.level, seed, dur);
    }

    /* ======================= nivel ======================= */
    clearWorld() { this.world.forEach(o => o.destroy()); this.world = []; this.chefs.forEach(c => ['spr', 'puf', 'hat', 'label', 'shadow'].forEach(k => c[k] && c[k].destroy())); this.chefs = []; }
    startLevel(level, seed, dur) {
      this.clearUi(); this.clearWorld(); this.level = level;
      this.sim = new K.Sim(level, { seed, dur: dur || undefined });
      this.pendingEv = []; this.phase = 'count'; this.cd = 3.4; this.resolved = false; this.endT = 0;
      this.buildWorld(); this.buildChefs();
      this.cdTxt = A.text(this, 200, 128, '3', 40, '#ffffff').setDepth(5200);
      this.sub = A.text(this, 200, 160, this.sim.L.name, 14, '#ffd24a').setDepth(5200);
      
    }
    buildWorld() {
      const sim = this.sim, g = this.add.graphics().setDepth(0); this.world.push(g);
      g.fillStyle(0x2b1b30).fillRect(0, 0, W, H);
      g.fillStyle(0x4a3270).fillRect(0, 0, W, OY);   // pared de arriba (con los adornos de la casa)
      for (let yy = 0; yy < OY; yy += 8) { g.fillStyle(0x3a2658).fillRect(0, yy + 7, W, 1); for (let xx = (yy / 8 % 2) * 8; xx < W; xx += 16) g.fillStyle(0x3a2658).fillRect(xx, yy, 1, 8); }
      sim.grid.forEach((row, y) => row.forEach((t, x) => {
        const px = x * TS, py = OY + y * TS;
        if (t.wall) { g.fillStyle(0x4a3270).fillRect(px, py, TS, TS).fillStyle(0x6a4a96).fillRect(px, py, TS, 3).fillStyle(0x3a2658).fillRect(px, py + 8, TS, 1).fillRect(px + (y % 2 ? 4 : 10), py + 3, 1, 5).fillRect(px + (y % 2 ? 12 : 4), py + 9, 1, 7); }
        else { g.fillStyle((x + y) % 2 ? 0xffe9c8 : 0xf6d9b2).fillRect(px, py, TS, TS); if (!t.solid) g.fillStyle(0xffffff, 0.12).fillRect(px, py, TS, 1); }
      }));
      sim.st.forEach(s => {
        K.drawStation(g, s.k === 'cajon' ? 'cajon' : s.k, s.tx * TS, OY + s.ty * TS);
        if (s.crate) { const im = this.add.image(s.x, OY + s.y - 3, 'ci_' + s.crate).setDepth(2); this.world.push(im); }
      });
      K.drawDecor(g, 34);   // adornos de la casa: tenedor morado, flor morada, popcorn
      // cartel y banderines en la pared del fondo
      const sign = A.text(this, 200, OY + 8, 'LOS CCELLIS', 13, '#ffd24a', { stroke: '#7a1620', strokeThickness: 3 }).setDepth(3); this.world.push(sign);
      if (G.isNight()) { const n = this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a6a, 0.12).setDepth(4900); this.world.push(n); }
      // barra de estado inferior
      const bar = this.add.graphics().setDepth(4990); bar.fillStyle(0x2b1b30, 0.92).fillRect(0, 212, W, 13); this.world.push(bar);
    }
    buildChefs() {
      const sim = this.sim;
      this.chefs = [0, 1].map(i => {
        const who = i === this.local ? 'me' : 'partner', p = G.state[who === 'me' ? 'me' : 'partner'], c = sim.ch[i];
        const o = { who, i, vx: c.x, vy: c.y, t: 0, moving: false, px: c.x - 11, py: c.y };
        o.shadow = this.add.ellipse(c.x, OY + c.y, 14, 5, 0x000000, 0.25);
        o.puf = this.add.image(c.x - 11, OY + c.y, 'puf_' + who).setOrigin(0.5, 1);
        o.spr = this.add.sprite(c.x, OY + c.y, 'char_' + who, 'd0').setOrigin(0.5, 1);
        o.hat = this.add.image(c.x, OY + c.y - 25, 'c_hat');
        o.label = A.text(this, c.x, OY + c.y - 36, (p.name || ''), 10, i === this.local ? '#ffd24a' : '#ffffff', { strokeThickness: 2 });
        return o;
      });
    }

    /* ======================= red ======================= */
    onPos(d) { if (this.phase === 'brief' || !this.sim) return; this.sim.setPos(d.i, d.x, d.y, d.d); const c = this.chefs[d.i]; if (c) c.moving = !!d.m; }
    onIn(d) { if (!this.isHost || this.phase !== 'play') return; this.sim.setPos(1, d.x, d.y, d.f); if (d.d) this.sim.press(1); else this.sim.release(1); this.sendSnap(); }
    onSnap(S) {
      if (this.isHost || !this.sim || this.phase === 'brief' || this.phase === 'result') return;
      const ev = this.sim.applySnapshot(S); ev.forEach(e => this.onEvent(e));
      if (this.phase === 'count') this.phase = 'play';
      if (S.ov && this.phase === 'play') this.finish();
    }
    sendSnap() {
      if (!this.isHost || G.solo) return;
      this.flushEvents(); const S = this.sim.snapshot(); S.ev = this.pendingEv; this.pendingEv = []; this.send('c_snap', S);
    }
    flushEvents() { const ev = this.sim.drain(); ev.forEach(e => this.onEvent(e)); this.pendingEv.push(...ev); }

    /* ======================= entrada ======================= */
    down() {
      if (this.phase !== 'play' || G.typing || G.modalOpen) return;
      if (this.isHost) { this.sim.press(this.ctl); this.sendSnap(); }
      else { const c = this.sim.ch[this.local]; this.send('c_in', { d: 1, x: c.x, y: c.y, f: c.d }); }
    }
    up() {
      if (this.phase !== 'play') return;
      if (this.isHost) { this.sim.release(this.ctl); this.sendSnap(); }
      else { const c = this.sim.ch[this.local]; this.send('c_in', { d: 0, x: c.x, y: c.y, f: c.d }); }
    }
    moveLocal(dt) {
      if (G.typing || G.modalOpen) return;
      const k = this.keys, c = this.sim.ch[this.ctl];
      const dx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0), dy = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
      const v = this.chefs[this.ctl]; if (v) v.moving = !!(dx || dy);
      if (!dx && !dy) return;
      const sp = SPEED * dt / Math.hypot(dx, dy);
      for (let n = 0; n < 3; n++) this.sim.move(this.ctl, dx * sp / 3, dy * sp / 3);
      c.d = Math.abs(dx) >= Math.abs(dy) && dx ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u');
    }

    /* ======================= bucle ======================= */
    update(time, dtMs) {
      const dt = Math.min(0.05, dtMs / 1000);
      if (this.phase === 'brief' || !this.sim) return;
      if (this.phase === 'count') {
        this.cd -= dt; const n = Math.ceil(this.cd - 0.4); this.cdTxt.setText(n > 0 ? String(n) : '¡A COCINAR!');
        if (this.cd <= 0) { this.phase = 'play'; this.cdTxt.destroy(); this.sub.destroy(); G.audio.sfx('ok'); }
        this.renderAll(time, dt); return;
      }
      if (this.phase === 'play' || this.phase === 'ended') {
        if (this.phase === 'play') this.moveLocal(dt);
        if (this.isHost) {
          if (this.phase === 'play') this.sim.tick(dt);
          this.flushEvents();
          this.sendT += dt; if (this.sendT > 0.1) { this.sendT = 0; this.sendSnap(); }
          if (this.sim.over && this.phase === 'play') { this.sendSnap(); this.finish(); }
        } else if (this.phase === 'play' && !this.sim.over) this.sim.t += dt;
        this.posT += dt;
        if (this.posT > 0.07 && !G.solo) { this.posT = 0; const c = this.sim.ch[this.local], v = this.chefs[this.local]; this.send('c_pos', { i: this.local, x: Math.round(c.x * 10) / 10, y: Math.round(c.y * 10) / 10, d: c.d, m: v ? v.moving : false }); }
        if (this.phase === 'ended') { this.endT += dt; if (this.endT > 1.3 && !this.resolved) { this.resolved = true; this.showResult(); } }
      }
      this.renderAll(time, dt);
    }
    finish() {
      this.phase = 'ended'; this.endT = 0; G.audio.sfx('win');
      this.endTxt = A.text(this, 200, 128, '¡TIEMPO!', 28, '#ffffff').setDepth(5200);
    }

    /* ======================= dibujo ======================= */
    getImg(pool, i) { let im = pool[i]; if (!im) { im = this.add.image(0, 0, 'ci_fideo'); pool[i] = im; } return im.setVisible(true); }
    putItem(it, x, y, depth) {
      if (it === null || it === undefined) return;
      if (K.isBowl(it)) {
        this.getImg(this.pool, this.pi++).setTexture(it.s ? 'ci_plato_caldo' : 'ci_plato').setPosition(Math.round(x), Math.round(y + 1)).setDepth(depth);
        const n = it.i.length; it.i.forEach((p, j) => this.getImg(this.pool, this.pi++).setTexture('ci_' + p).setPosition(Math.round(x - (n - 1) * 6 + j * 12), Math.round(y - 12)).setDepth(depth + 0.1));
      } else this.getImg(this.pool, this.pi++).setTexture('ci_' + it).setPosition(Math.round(x), Math.round(y)).setDepth(depth);
    }
    renderAll(time, dt) {
      const sim = this.sim, fx = this.fx; fx.clear(); this.pi = 0;
      // estaciones
      sim.st.forEach(s => {
        const x = s.tx * TS, y = OY + s.ty * TS, cx = x + 8, cy = y + 8;
        if (s.item !== null && s.item !== undefined && s.k !== 'cajon') this.putItem(s.item, cx, cy - 2, 10 + s.ty);
        if (s.k === 'olla' || s.k === 'sarten') {
          if (s.item && s.cook && !s.done && s.item !== 'quemado') { fx.fillStyle(0x2b1b30).fillRect(x + 1, y - 5, 14, 4).fillStyle(0xffd24a).fillRect(x + 2, y - 4, 12 * s.prog, 2); }
          else if (s.done && s.item !== 'quemado') {
            const warn = s.warn, blink = Math.floor(time / 150) % 2;
            fx.lineStyle(1.5, warn ? (blink ? 0xff3b3b : 0xffd24a) : 0x7fffa8, 1).strokeCircle(cx, cy, 8.5);
            if (warn) { fx.fillStyle(0x2b1b30).fillRect(x + 1, y - 5, 14, 4).fillStyle(0xff3b3b).fillRect(x + 2, y - 4, Math.max(1, 12 * (1 - s.burn / K.BURN[s.k])), 2); }
          }
        }
        if ((s.k === 'tabla' || s.k === 'amasadora') && s.item && K.WORK[s.k][s.item] && s.prog > 0.01) fx.fillStyle(0x2b1b30).fillRect(x + 1, y - 5, 14, 4).fillStyle(0xff9d2e).fillRect(x + 2, y - 4, 12 * s.prog, 2);
        if (s.k === 'sobre') {
          if (s.sealed) this.putItem('sobre' + s.n, cx, cy - 2, 10 + s.ty);
          else for (let i = 0; i < s.n; i++) fx.fillStyle(0xe0312e).fillRect(x + 3 + i * 4, y + 9, 3, 2);
          if (s.prog > 0.01 && !s.sealed) fx.fillStyle(0x2b1b30).fillRect(x + 1, y - 5, 14, 4).fillStyle(0xff9d2e).fillRect(x + 2, y - 4, 12 * s.prog, 2);
        }
      });
      // objetivo del cocinero que controlo
      if (this.phase === 'play') { const t = sim.target(this.ctl); if (t) fx.lineStyle(1.5, 0xffffff, 0.95).strokeRect(t.tx * TS + 0.5, OY + t.ty * TS + 0.5, TS - 1, TS - 1); }
      // cocineros
      this.chefs.forEach((v, i) => {
        const c = sim.ch[i], remote = i !== this.ctl && !G.solo;
        if (remote) { v.vx += (c.x - v.vx) * Math.min(1, dt * 16); v.vy += (c.y - v.vy) * Math.min(1, dt * 16); } else { v.vx = c.x; v.vy = c.y; }
        v.t += dt * 1000; const x = Math.round(v.vx), y = Math.round(OY + v.vy), d = c.d, flip = d === 'r', dir = d === 'r' ? 'l' : d;
        const moving = remote ? v.moving : v.moving, fr = moving ? [1, 0, 2, 0][Math.floor(v.t / 130) % 4] : 0;
        v.spr.setPosition(x, y).setFrame(dir + fr).setFlipX(flip).setDepth(y); v.shadow.setPosition(x, y - 1).setDepth(y - 0.5);
        v.hat.setPosition(x, y - 26).setDepth(y + 0.2); v.label.setPosition(x, y - 36).setDepth(y + 1000);
        const ox = d === 'r' ? -11 : d === 'l' ? 11 : 0, oy = d === 'u' ? 6 : d === 'd' ? -5 : 0;
        v.px += (x + ox - v.px) * 0.16; v.py += (y + oy - v.py) * 0.16; v.puf.setPosition(Math.round(v.px), Math.round(v.py - (moving ? Math.abs(Math.sin(v.t / 90)) * 2 : 0))).setDepth(v.py - 1);
        if (c.held !== null && c.held !== undefined) { const hx = x + (d === 'r' ? 9 : d === 'l' ? -9 : 0), hy = y - 10 + (d === 'd' ? 4 : 0); this.putItem(c.held, hx, hy, d === 'u' ? y - 0.4 : y + 2); }
        if (c.work !== null && c.wp > 0) { fx.fillStyle(0x2b1b30).fillRect(x - 9, y - 41, 18, 5).fillStyle(0x7fffa8).fillRect(x - 8, y - 40, 16 * Math.min(1, c.wp), 3); }
      });
      for (let j = this.pi; j < this.pool.length; j++) this.pool[j].setVisible(false);
      this.renderCards(time); this.renderHud(time);
    }
    renderCards(time) {
      const sim = this.sim, fx = this.fx; let x = 50, ci = 0;
      if (!this.phase || this.phase === 'result') { this.cardTxt.forEach(t => t.setVisible(false)); this.pool2.forEach(i => i.setVisible(false)); return; }
      const widths = sim.orders.map(o => { const R = K.RECIPES[o.r]; return Math.max(38, 6 + (R.parts.length + (R.soup ? 1 : 0)) * 12); });
      const total = widths.reduce((a, b) => a + b + 3, 0), sc = total > 346 ? 346 / total : 1;
      sim.orders.forEach((o, k) => {
        const R = K.RECIPES[o.r], w = Math.round(widths[k] * sc), y = 26, left = Math.max(0, o.t0 + o.pat - sim.t), f = left / o.pat, urgent = f < 0.25;
        fx.fillStyle(0x2b1b30).fillRect(x - 1, y - 1, w + 2, 28); fx.fillStyle(urgent && Math.floor(time / 180) % 2 ? 0xffc2c2 : 0xfff3d6).fillRect(x, y, w, 26);
        fx.fillStyle(0x2b1b30).fillRect(x + 1, y + 22, w - 2, 3); fx.fillStyle(f > 0.5 ? 0x4fd08a : f > 0.25 ? 0xffd24a : 0xff4b4b).fillRect(x + 1, y + 23, Math.max(1, (w - 2) * f), 1);
        fx.fillStyle(f > 0.5 ? 0x4fd08a : f > 0.25 ? 0xffd24a : 0xff4b4b).fillRect(x + 1, y + 22, Math.max(1, (w - 2) * f), 3);
        const t = this.cardTxt[k]; if (t) t.setText(SHORT[o.r]).setPosition(x + 3, y + 1).setVisible(true).setDepth(4600);
        const parts = R.parts.slice(); if (R.soup) parts.push('plato_caldo');
        parts.forEach((p, j) => { const im = this.getImg(this.pool2, ci++).setTexture('ci_' + p).setPosition(Math.round(x + 3 + 6 + j * 12 * sc), y + 14).setDepth(4601).setScale(sc < 1 ? sc : 1); });
        x += w + 3;
      });
      for (let k = sim.orders.length; k < 5; k++) this.cardTxt[k].setVisible(false);
      for (let j = ci; j < this.pool2.length; j++) this.pool2[j].setVisible(false);
    }
    renderHud(time) {
      const sim = this.sim, rem = Math.max(0, sim.dur - sim.t), g = sim.L.goals;
      this.clock.setText('⏱ ' + fmt(rem)).setColor(rem < 15 && this.phase === 'play' ? (Math.floor(time / 250) % 2 ? '#ff6b6b' : '#ffd24a') : '#ffd24a');
      this.scoreT.setText(sim.score + ' pts  ' + (sim.score >= g[2] ? '★★★' : sim.score >= g[1] ? '★★☆' : sim.score >= g[0] ? '★☆☆' : '☆☆☆'));
      this.hud.setText('Nivel ' + (this.level + 1) + ' · meta ★ ' + g[0] + (G.solo ? ' · TAB: ' + this.meName(this.ctl) : ''));
    }
    pop(x, y, txt, col, size) {
      const t = A.text(this, x, OY + y - 12, txt, size || 11, col || '#fff', { strokeThickness: 3 }).setDepth(5100);
      this.tweens.add({ targets: t, y: t.y - 16, alpha: 0, duration: 900, delay: 150, onComplete: () => t.destroy() });
    }
    onEvent(e) {
      const A_ = G.audio;
      switch (e.t) {
        case 'pop': case 'put': case 'add': case 'trash': A_.sfx('click'); break;
        case 'ding': A_.sfx('ok'); this.pop(e.x, e.y, '¡Listo!', '#7fffa8'); break;
        case 'warn': A_.sfx('pop'); this.pop(e.x, e.y, '¡Se quema!', '#ffd24a'); break;
        case 'burn': A_.sfx('hit'); this.pop(e.x, e.y, '¡Quemado!', '#ff6b6b'); this.cameras.main.shake(120, 0.004); break;
        case 'serve': A_.sfx('heart'); this.pop(e.x - 10, e.y, '+' + e.pts, '#ffd24a', 14); for (let i = 0; i < 5; i++) { const h = this.add.graphics().setDepth(5100); A.heart(h, 0, 0, 3, [0xff5d97, 0xffd24a, 0x7fd1ae][i % 3]); h.x = e.x + (i - 2) * 6; h.y = OY + e.y; this.tweens.add({ targets: h, y: h.y - 26 - i * 3, alpha: 0, duration: 800, onComplete: () => h.destroy() }); } break;
        case 'lost': A_.sfx('hit'); this.pop(200, 40, 'Pedido perdido (-10)', '#ff6b6b', 12); break;
        case 'bad': A_.sfx('hit'); if (e.msg) this.pop(e.x, e.y, e.msg, '#ff9fb0'); break;
        case 'order': A_.sfx('pop'); break;
        case 'chop': if (Math.random() < 0.3) A_.sfx('click'); break;
      }
    }

    /* ======================= resultado ======================= */
    showResult() {
      this.phase = 'result'; this.endTxt && this.endTxt.destroy(); this.cardTxt.forEach(t => t.setVisible(false)); this.pool2.forEach(i => i.setVisible(false));
      const sim = this.sim, stars = sim.stars(), L = sim.L, kit = G.state.kitchen, lv = this.level, D = 6000;
      const pass = stars >= 1, last = lv === 4;
      if (pass) { kit.unlocked = Math.max(kit.unlocked || 1, Math.min(5, lv + 2)); kit.stars[lv] = Math.max(kit.stars[lv] || 0, stars); kit.best[lv] = Math.max(kit.best[lv] || 0, sim.score); G.save(); }
      if (pass && last && (this.isHost || G.solo)) { G.recordWin('cocina', 'dani', sim.score); G.recordWin('cocina', 'sebas', sim.score); }
      G.audio.sfx(pass ? 'win' : 'hit');
      const g = this.add_(this.add.graphics().setDepth(D)); g.fillStyle(0x2b1b30).fillRoundedRect(46, 28, 308, 170, 8).lineStyle(2, pass ? 0xffd24a : 0xff7aa8).strokeRoundedRect(46, 28, 308, 170, 8);
      this.add_(A.text(this, 200, 46, pass ? '🍜 ¡NIVEL SUPERADO!' : '😅 ¡Casi! Reintenten', 17, pass ? '#ffd24a' : '#ff9fb0').setDepth(D + 1));
      for (let i = 0; i < 3; i++) { const s = this.add_(A.text(this, 160 + i * 40, 76, '★', i < stars ? 44 : 34, i < stars ? '#ffd24a' : '#55455e', { strokeThickness: 4 }).setDepth(D + 1)); if (i < stars) this.tweens.add({ targets: s, scale: { from: 0.2, to: 1 }, duration: 450, delay: i * 220, ease: 'Back.easeOut' }); }
      this.add_(this.add.text(200, 102, 'Puntos: ' + sim.score + '   ·   Servidos: ' + sim.served + '   ·   Perdidos: ' + sim.lost, { fontFamily: 'VT323', fontSize: '15px', color: '#fff3d6' }).setOrigin(0.5).setDepth(D + 1));
      this.add_(this.add.text(200, 118, 'Metas:  ★ ' + L.goals[0] + '   ★★ ' + L.goals[1] + '   ★★★ ' + L.goals[2], { fontFamily: 'VT323', fontSize: '13px', color: '#9fe0cf' }).setOrigin(0.5).setDepth(D + 1));
      const best = kit.best[lv] || 0; this.add_(this.add.text(200, 133, 'Mejor del nivel: ' + best + ' pts', { fontFamily: 'VT323', fontSize: '12px', color: '#c9b8ff' }).setOrigin(0.5).setDepth(D + 1));
      if (pass && last) this.add_(this.add.text(200, 150, '¡Se ganaron los FIDEOS MARTUCCINI! 🍝 para compartir', { fontFamily: 'VT323', fontSize: '13px', color: '#ffd1e0' }).setOrigin(0.5).setDepth(D + 1));
      else if (!pass) this.add_(this.add.text(200, 150, 'Necesitan al menos ★ ' + L.goals[0] + ' puntos para pasar', { fontFamily: 'VT323', fontSize: '13px', color: '#ffd1e0' }).setOrigin(0.5).setDepth(D + 1));
      else this.add_(this.add.text(200, 150, 'Siguiente: ' + K.LEVELS[lv + 1].name, { fontFamily: 'VT323', fontSize: '13px', color: '#ffd1e0' }).setOrigin(0.5).setDepth(D + 1));
      const b = (x, y, w, h, lb, c, fn) => this.btn(x, y, w, h, lb, c, fn, 14, D + 2);
      b(112, 178, 84, 20, '↻ Reintentar', 0xffd24a, () => this.act('retry'));
      if (pass) b(200, 178, 94, 20, last ? '🍝 ¡Al premio!' : 'Siguiente ▶', 0x7fd1ae, () => this.act(last ? 'prize' : 'next'));
      b(290, 178, 84, 20, '◀ Al mapa', 0xff7aa8, () => this.act('exit'));
    }
    /* acciones del menú de resultados: las ejecuta el anfitrión */
    act(a) {
      if (!this.isHost) { if (a) this.send('c_req', { a }); return; }
      if (a === 'retry') { this.send('c_brief', { level: this.level, page: 'last' }); this.openBrief(this.level, 'last'); }
      else if (a === 'next') { const l = Math.min(4, this.level + 1); this.send('c_cfg', { level: l, unlocked: G.state.kitchen.unlocked }); this.send('c_brief', { level: l, page: 0 }); this.openBrief(l, 0); }
      else if (a === 'prize') G.travel('martuccini', {});
      else if (a === 'exit') G.flow.openMap();
    }
  }
  G.CocinaScene = CocinaScene;
})();
