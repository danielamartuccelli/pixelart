/* ===========================================================
   scenes/pucp.js — ETAPA 4 · PUCP (San Miguel) · "Escondidas"
   Los DOS se esconden a la vez en el campus (Facultad de Letras y Ciencias Sociales, el Tontódromo, el pasto).
   - Fase ESCÓNDETE (se acorta cada ronda): corre a un escondite (arbusto, árbol, columna) y pulsa E.
     Cada escondite admite a UNA sola persona: el que llega primero se lo queda.
   - Fase PATRULLA: un GUARDIA (cono de visión + revisa escondites: se ve un "?" antes de revisar) y un
     ESTUDIANTE (solo mira) recorren el campus. Si te ve el cono unos instantes, o te encuentran en tu escondite, quedas VISTO.
     Puedes cambiar de escondite en plena ronda… pero moverte en el cono es peligroso.
   - Se elige 3, 5 o 7 rondas. Gana quien menos veces sea visto (empate = ronda extra de muerte súbita).
   Red: el anfitrión manda la semilla (p_go) y decide el marcador (p_res); cada uno juzga si LO vieron a él (p_fin).
   Prueba solo: ?solo=1&me=sebas&go=pucp&prounds=3&pauto=1  (la pareja es un bot)
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H, Q = new URLSearchParams(location.search);
  const PRIZE = 10, SPEED = 62, B = { x0: 14, x1: 386, y0: 106, y1: 216 };
  const SPOTS = [
    { t: 'bush', x: 44, y: 150 }, { t: 'bush', x: 356, y: 152 }, { t: 'bush', x: 200, y: 210 }, { t: 'bush', x: 44, y: 202 },
    { t: 'tree', x: 104, y: 128 }, { t: 'tree', x: 300, y: 126 }, { t: 'pillar', x: 132, y: 108 }, { t: 'pillar', x: 270, y: 108 }
  ];
  const NAMES = { bush: 'arbusto', tree: 'árbol', pillar: 'columna' };

  function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const diffOf = r => Math.min(1, (r - 1) / 6);

  /* ---------- NPC (determinista: guardia y estudiante) ---------- */
  class Npc {
    constructor(kind, plan, start, speed, range, half, scale) {
      Object.assign(this, { kind, plan, x: start.x, y: start.y, exit: { x: start.x, y: start.y }, speed, range, half, a: start.x < 0 ? 0 : Math.PI, i: -1, state: 'idle', timer: 0, flag: -1, out: false, moving: false, t: 0 });
    }
    next() {
      const t = this.plan[++this.i];
      if (!t) { this.state = 'leave'; this.target = this.exit; this.flag = -1; return; }
      this.task = t; this.state = 'walk';
      if (t.type === 'spot') { const s = SPOTS[t.spot]; this.target = { x: s.x, y: Math.min(B.y1, s.y + 20) }; this.flag = t.spot; } else { this.target = { x: t.x, y: t.y }; this.flag = -1; }
    }
    step(dt, scene) {
      this.t += dt;
      if (this.state === 'idle') this.next();
      this.moving = false;
      if (this.state === 'walk' || this.state === 'leave') {
        const dx = this.target.x - this.x, dy = this.target.y - this.y, d = Math.hypot(dx, dy), st = this.speed * dt;
        this.a = Math.atan2(dy, dx); this.moving = true;
        if (d <= st) {
          this.x = this.target.x; this.y = this.target.y;
          if (this.state === 'leave') { this.out = true; return; }
          if (this.task.type === 'spot') { this.state = 'peek'; this.timer = 0.9; this.a = -Math.PI / 2; scene.onPeek(this, this.task.spot); }
          else { this.state = 'scan'; this.timer = this.task.scan; this.base = this.a; this.moving = false; }
        } else { this.x += dx / d * st; this.y += dy / d * st; }
      } else if (this.state === 'scan') {
        this.timer -= dt; this.a = this.base + Math.sin((this.task.scan - this.timer) * 3.2) * 0.95; if (this.timer <= 0) this.next();
      } else if (this.state === 'peek') { this.timer -= dt; if (this.timer <= 0) this.next(); }
    }
  }
  function makePlans(seed, r) {
    const R = rng(seed + r * 7919), d = r > 7 ? 1 : diffOf(r), pts = () => ({ x: 40 + R() * 320, y: 122 + R() * 88 });
    const n = 3 + (r >= 4 ? 1 : 0) + (r >= 6 ? 1 : 0), plan = [], forced = Math.floor(R() * n);
    for (let i = 0; i < n; i++) {
      if (i === forced || R() < 0.45) { let s; do { s = Math.floor(R() * SPOTS.length); } while (plan.some(p => p.spot === s)); plan.push({ type: 'spot', spot: s }); }
      else plan.push(Object.assign(pts(), { type: 'pt', scan: 1.1 + d * 0.5 }));
    }
    const left = R() < 0.5, sx = left ? -12 : W + 12, studentPlan = [0, 1, 2, 3].map(() => Object.assign(pts(), { type: 'pt', scan: 0.7 }));
    const npcs = [new Npc('guard', plan, { x: sx, y: 150 + R() * 40 }, 46 + 24 * d, 112 + 26 * d, 0.5 + 0.12 * d)];
    npcs.push(new Npc('student', studentPlan, { x: left ? W + 12 : -12, y: 130 + R() * 60 }, 34, 84, 0.45));
    if (r >= 5) npcs.push(new Npc('student', studentPlan.slice().reverse(), { x: left ? W + 12 : -12, y: 190 }, 38, 84, 0.45));
    return npcs;
  }

  /* ================= ESCENA ================= */
  class PucpScene extends Phaser.Scene {
    constructor() { super('pucp'); }
    create() {
      A.emoteTextures(this.game); G.refreshTextures(); this.makeNpcTextures();
      this.phase = 'lobby'; this.rounds = +Q.get('prounds') || 5; this.ready = { me: false, partner: false }; this.ui = []; this.r = 0; this.scores = { dani: 0, sebas: 0 };
      this.npcs = []; this.acc = 0; this.seed = 0; this.fin = {}; this.over = false;
      this.keys = this.input.keyboard.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D' }, false);
      this.input.keyboard.on('keydown-E', () => this.toggleHide()); this.input.keyboard.on('keydown-SPACE', () => this.toggleHide());
      this.input.keyboard.on('keydown-ESC', () => { if (this.phase === 'lobby' || this.phase === 'over') G.flow.openMap(); });
      const mkAct = (who, x, y) => { const p = G.state[who === 'me' ? 'me' : 'partner'], a = { who, x, y, dir: 'd', moving: false, t: 0, hid: -1, seen: false, meter: 0, tx: x, ty: y };
        a.shadow = this.add.ellipse(x, y, 14, 5, 0x000000, 0.25); a.spr = this.add.sprite(x, y, 'char_' + who, 'd0').setOrigin(0.5, 1);
        a.label = this.add.text(x, y - 30, p.name || '', { fontFamily: 'VT323', fontSize: '12px', color: '#ffffff', stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0.5, 1);
        a.bar = this.add.graphics(); a.mark = this.add.text(x, y - 40, '', { fontFamily: 'VT323', fontSize: '22px', color: '#ff3b3b', stroke: '#ffffff', strokeThickness: 3 }).setOrigin(0.5, 1); return a; };
      this.drawCampus();
      this.me = mkAct('me', 180, 205); this.pa = mkAct('partner', 220, 205);
      this.coneG = this.add.graphics().setDepth(3500); this.flagTxt = A.text(this, 0, 0, '?', 16, '#ff3b3b').setDepth(3600).setVisible(false);
      this.eyes = [this.add.graphics().setDepth(900), this.add.graphics().setDepth(900)];
      this.banner = A.text(this, 200, 36, '', 14, '#ffffff').setDepth(5000); this.sub = A.text(this, 200, 52, '', 11, '#ffd24a').setDepth(5000);
      this.nets = [['p_cfg', d => { this.rounds = d.rounds; this.drawLobby(); }], ['p_ready', d => { this.ready.partner = !!d.r; this.drawLobby(); this.tryStart(); }],
        ['p_go', d => { if (this.phase === 'lobby') this.beginMatch(d.seed, d.rounds); }], ['p_pos', d => this.onPos(d)], ['p_seen', () => { this.pa.seen = true; this.pa.mark.setText('!'); }],
        ['p_fin', d => { this.fin.partner = d.seen; this.hostResolve(); }], ['p_res', d => this.applyRes(d)], ['p_next', d => this.startRound(d.r)], ['p_over', d => this.showOver(d)], ['p_again', () => this.scene.restart()]];
      const net = G.net; this.nets.forEach(([t, f]) => (net.handlers[t] = net.handlers[t] || []).push(f));
      this.events.once('shutdown', () => this.nets.forEach(([t, f]) => { net.handlers[t] = (net.handlers[t] || []).filter(x => x !== f); }));
      this.drawLobby(); this.send('p_cfg', { rounds: this.rounds });
      this.time.addEvent({ delay: 1200, loop: true, callback: () => { if (this.phase === 'lobby') { this.send('p_cfg', { rounds: this.rounds }); this.send('p_ready', { r: this.ready.me }); } } });
      if (G.solo && Q.get('pauto') === '1') this.time.delayedCall(600, () => { this.ready.me = true; this.tryStart(); });
      if (G.isNight()) this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a6a, 0.22).setDepth(8000);
    }
    send(t, d) { if (G.net.connected) G.net.send(t, d); }
    makeNpcTextures() {
      const ad = { textures: this.textures };
      const g = G.defaultLook('sebas'); g.hair = { style: 'muyCorto', color: '#1b1618' }; g.glasses = { type: 'none' };
      g.outfit = { top: { style: 'shirt', color: '#2c3e6a' }, bottom: { style: 'pants', color: '#1b1f2e' }, shoes: { type: 'formal', color: '#1b1b1f' } }; g.acc = { hat: 'cap', hatColor: '#2c3e6a', scarf: 'none', backpack: false };
      G.makeCharTexture(ad, 'npc_guard', g);
      const s = G.defaultLook('dani'); s.hair = { style: 'bob', color: '#d4a04a' }; s.earrings = 'none';
      s.outfit = { top: { style: 'tee', color: '#7fd1ae' }, bottom: { style: 'pants', color: '#3d4a63' }, shoes: { type: 'sneaker', color: '#fffaf0' } }; s.acc = { hat: 'none', scarf: 'none', backpack: true, backpackColor: '#ff7aa8' };
      G.makeCharTexture(ad, 'npc_student', s);
    }

    /* ---------- campus ---------- */
    drawCampus() {
      const g = this.add.graphics().setDepth(0), night = G.isNight();
      g.fillStyle(0x7fcf6a).fillRect(0, 96, W, 130);
      for (let i = 0; i < 90; i++) { const x = (i * 47) % 400, y = 100 + (i * 29) % 120; g.fillStyle(i % 3 ? 0x6fbf5a : 0x93dc7c).fillRect(x, y, 2, 3); if (i % 9 === 0) g.fillStyle(i % 2 ? 0xffe066 : 0xff9fd0).fillRect(x + 3, y + 2, 2, 2); }
      // fachada: Facultad de Letras y Ciencias Sociales
      g.fillStyle(0xb5502a).fillRect(0, 0, W, 98); g.fillStyle(0x8a3a1c).fillRect(0, 0, W, 8).fillRect(0, 92, W, 6);
      g.lineStyle(1, 0x9a4222); for (let y = 12; y < 92; y += 6) g.lineBetween(0, y, W, y);
      for (let x = 12; x < 388; x += 36) { if (x > 160 && x < 240) continue; for (let k = 0; k < 2; k++) { g.fillStyle(0x2b1b30).fillRect(x - 1, 20 + k * 34 - 1, 16, 22); g.fillStyle(night ? 0xffd27a : 0x9fd8ff).fillRect(x, 20 + k * 34, 14, 20); g.fillStyle(0xffffff, 0.4).fillRect(x, 20 + k * 34, 14, 3); } }
      g.fillStyle(0xe8d7b0).fillRect(150, 36, 100, 56).fillStyle(0x2b1b30).fillRect(184, 54, 32, 38).fillStyle(0x6b4a3a).fillRect(186, 56, 13, 36).fillRect(201, 56, 13, 36);
      g.fillStyle(0xfff3d6).fillRoundedRect(112, 10, 176, 22, 3).lineStyle(2, 0x2b1b30).strokeRoundedRect(112, 10, 176, 22, 3);
      this.add.text(200, 15, 'FACULTAD DE LETRAS', { fontFamily: 'VT323', fontSize: '12px', color: '#2b1b30' }).setOrigin(0.5, 0).setDepth(1);
      this.add.text(200, 24, 'Y CIENCIAS SOCIALES', { fontFamily: 'VT323', fontSize: '9px', color: '#6a3a1c' }).setOrigin(0.5, 0).setDepth(1);
      g.fillStyle(0xe8d7b0).fillRect(0, 98, W, 16).fillStyle(0xcdb98a).fillRect(0, 112, W, 2);       // pórtico
      // Tontódromo
      g.fillStyle(0xcdb98a).fillEllipse(200, 168, 92, 50).fillStyle(0xe8dcb8).fillEllipse(200, 168, 84, 44).lineStyle(1, 0xb09a74).strokeEllipse(200, 168, 60, 30).strokeEllipse(200, 168, 30, 14);
      [[160, 150], [240, 150], [158, 186], [242, 186]].forEach(([x, y]) => { g.fillStyle(0x6b4a3a).fillRect(x - 8, y, 16, 4).fillStyle(0x2b1b30).fillRect(x - 7, y + 4, 2, 3).fillRect(x + 5, y + 4, 2, 3); });
      this.add.text(200, 168, 'TONTÓDROMO', { fontFamily: 'VT323', fontSize: '11px', color: '#8a6a30' }).setOrigin(0.5).setDepth(1);
      this.add.text(36, 176, 'el pasto', { fontFamily: 'VT323', fontSize: '10px', color: '#2f7a46' }).setOrigin(0.5).setDepth(1).setAlpha(0.8);
      this.add.text(364, 188, 'el pasto', { fontFamily: 'VT323', fontSize: '10px', color: '#2f7a46' }).setOrigin(0.5).setDepth(1).setAlpha(0.8);
      this.add.text(200, 100, G.PLACES.pucp.name + ' · ' + G.PLACES.pucp.district, { fontFamily: 'VT323', fontSize: '11px', color: '#6a3a1c' }).setOrigin(0.5, 0).setDepth(1).setAlpha(0.9);
      SPOTS.forEach((s, i) => this.drawSpot(s, i));
    }
    drawSpot(s, i) {
      const g = this.add.graphics().setDepth(s.y + 6);
      if (s.t === 'bush') { g.fillStyle(0x000000, 0.2).fillEllipse(s.x, s.y + 2, 34, 8); g.fillStyle(0x2f7a46).fillCircle(s.x - 9, s.y - 8, 9).fillCircle(s.x + 9, s.y - 8, 9).fillCircle(s.x, s.y - 14, 11); g.fillStyle(0x3aa05a).fillCircle(s.x - 6, s.y - 11, 7).fillCircle(s.x + 8, s.y - 10, 6).fillStyle(0x6fd18a, 0.8).fillRect(s.x - 8, s.y - 16, 2, 2).fillRect(s.x + 5, s.y - 12, 2, 2).fillStyle(0xff7aa8).fillRect(s.x - 2, s.y - 7, 2, 2); }
      else if (s.t === 'tree') { g.fillStyle(0x000000, 0.2).fillEllipse(s.x, s.y + 2, 30, 8); g.fillStyle(0x6b4a3a).fillRect(s.x - 4, s.y - 22, 8, 24); g.fillStyle(0x2f7a46).fillCircle(s.x, s.y - 34, 18).fillCircle(s.x - 13, s.y - 26, 11).fillCircle(s.x + 13, s.y - 26, 11); g.fillStyle(0x3aa05a).fillCircle(s.x - 5, s.y - 38, 11).fillStyle(0x6fd18a, 0.7).fillCircle(s.x - 8, s.y - 42, 4); }
      else { g.fillStyle(0x000000, 0.18).fillEllipse(s.x, s.y + 2, 22, 6); g.fillStyle(0xcfc6b2).fillRect(s.x - 8, s.y - 32, 16, 34).fillStyle(0xaaa18c).fillRect(s.x + 3, s.y - 32, 5, 34).fillStyle(0xe6dfce).fillRect(s.x - 10, s.y - 34, 20, 4).fillRect(s.x - 10, s.y - 2, 20, 4); }
    }
    spotFree(i, who) { const o = who === 'me' ? this.pa : this.me; return o.hid !== i; }

    /* ---------- lobby ---------- */
    drawLobby() {
      this.ui.forEach(o => o.destroy()); this.ui = []; if (this.phase !== 'lobby') return;
      const add = o => { this.ui.push(o); return o; }, D = 9000, pg = add(this.add.graphics().setDepth(D));
      pg.fillStyle(0x2b1b30, 1).fillRoundedRect(36, 34, 328, 160, 8).lineStyle(2, 0xffd24a).strokeRoundedRect(36, 34, 328, 160, 8);
      add(A.text(this, 200, 50, '🙈 ESCONDIDAS EN LA PUCP', 16, '#ffd24a').setDepth(D + 1));
      add(this.add.text(200, 64, 'Corre a un escondite (arbusto, árbol o columna) y pulsa E. Cada escondite es de UNA sola persona. El guardia revisa escondites (verás un "?") y el estudiante mira con su cono: si te ven, pierdes la ronda. Gana quien sea visto menos veces.', { fontFamily: 'VT323', fontSize: '11px', color: '#fff3d6', align: 'center', lineSpacing: -2, wordWrap: { width: 300 } }).setOrigin(0.5, 0).setDepth(D + 1));
      add(this.add.text(200, 108, 'Mover: flechas / WASD     Esconderse / salir: E o Espacio', { fontFamily: 'VT323', fontSize: '12px', color: '#9fe0cf' }).setOrigin(0.5, 0).setDepth(D + 1));
      add(this.add.text(200, 124, 'Cantidad de rondas:', { fontFamily: 'VT323', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5, 0).setDepth(D + 1));
      [3, 5, 7].forEach((n, i) => this.btn(add, 140 + i * 60, 146, 50, 20, n + ' rondas', this.rounds === n ? 0xffd24a : 0xbfeaff, () => { this.rounds = n; this.send('p_cfg', { rounds: n }); this.drawLobby(); }, D, 12));
      const nm = G.state.me.name || 'Tú', pn = G.state.partner.name || 'Pareja';
      this.btn(add, 120, 176, 104, 20, this.ready.me ? '✔ ¡Listo!' : '¡Estoy listo!', this.ready.me ? 0x7fd1ae : 0xff7aa8, () => { this.ready.me = !this.ready.me; this.send('p_ready', { r: this.ready.me }); this.drawLobby(); this.tryStart(); }, D);
      add(this.add.text(190, 168, (G.solo ? pn + ' (bot) 🤖: listo' : pn + (this.ready.partner ? ': ✔ listo' : ': esperando…')) + '\n' + nm + (this.ready.me ? ': ✔ listo' : ''), { fontFamily: 'VT323', fontSize: '12px', color: '#fff3d6', lineSpacing: -1 }).setOrigin(0, 0).setDepth(D + 1));
      this.btn(add, 326, 44, 52, 14, '◀ Mapa', 0xffffff, () => G.flow.openMap(), D, 10);
    }
    btn(add, x, y, w, h, label, color, fn, depth, fs) {
      const g = add(this.add.graphics().setDepth(depth + 1)); g.fillStyle(0x2b1b30).fillRoundedRect(x - w / 2 + 1, y - h / 2 + 3, w, h, 4).fillStyle(color).fillRoundedRect(x - w / 2, y - h / 2, w, h, 4).lineStyle(1.5, 0x2b1b30).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 4);
      add(this.add.text(x, y, label, { fontFamily: 'VT323', fontSize: (fs || 14) + 'px', color: '#2b1b30' }).setOrigin(0.5).setDepth(depth + 2));
      add(this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(depth + 3).on('pointerdown', () => { G.audio.sfx('click'); fn(); }));
    }
    tryStart() {
      if (this.phase !== 'lobby' || !this.ready.me) return;
      if (G.solo) { this.beginMatch(Math.floor(Math.random() * 2 ** 31), this.rounds); return; }
      if (this.ready.partner && G.net.role === 'host') { const seed = Math.floor(Math.random() * 2 ** 31); this.send('p_go', { seed, rounds: this.rounds }); this.beginMatch(seed, this.rounds); }
    }

    /* ---------- partida y rondas ---------- */
    beginMatch(seed, rounds) { this.seed = seed; this.rounds = rounds; this.ui.forEach(o => o.destroy()); this.ui = []; this.scores = { dani: 0, sebas: 0 }; this.over = false; this.startRound(1); }
    startRound(r) {
      if (this.phase === 'over') return;
      this.r = r; this.phase = 'hide'; this.fin = {}; this.resolved = false; this.npcs = []; this.acc = 0; this.pT = 0;
      this.hideT = Math.max(4.5, 8.5 - r * 0.45); this.bot = G.solo ? { spot: -1, wait: 0.6 + Math.random() * 1.2, moved: false } : null;
      [[this.me, 180], [this.pa, 220]].forEach(([a, x]) => { Object.assign(a, { x, y: 205, tx: x, ty: 205, hid: -1, seen: false, meter: 0, dir: 'u', moving: false }); a.spr.setAlpha(1); a.mark.setText(''); });
      this.setBanner('RONDA ' + r + (r > this.rounds ? ' · ¡MUERTE SÚBITA!' : '/' + this.rounds), '¡Escóndete! Corre a un arbusto, árbol o columna y pulsa E');
      G.audio.sfx('ok');
    }
    setBanner(t, s) { this.banner.setText(t); this.sub.setText(s || ''); }
    toggleHide() {
      if (G.typing || G.modalOpen || (this.phase !== 'hide' && this.phase !== 'patrol') || this.me.seen) return;
      const a = this.me;
      if (a.hid >= 0) { a.hid = -1; a.spr.setAlpha(1); return; }
      let best = -1, bd = 26; SPOTS.forEach((s, i) => { const d = Math.hypot(a.x - s.x, a.y - (s.y + 4)); if (d < bd && this.spotFree(i, 'me')) { best = i; bd = d; } });
      if (best >= 0) { a.hid = best; a.x = SPOTS[best].x; a.y = SPOTS[best].y + 4; a.spr.setAlpha(0); G.audio.sfx('pop'); this.sendPos(true); }
      else G.ui.toast('Acércate a un escondite libre');
    }
    onPos(d) { const a = this.pa; a.tx = d.x; a.ty = d.y; a.dir = d.d; a.moving = d.m; a.hid = d.h; a.meter = d.mt || 0; if (d.h >= 0 && d.h === this.me.hid && G.net.role === 'guest') { this.me.hid = -1; this.me.spr.setAlpha(1); G.ui.toast('¡Ese escondite ya estaba ocupado!'); } }
    sendPos(force) { if (!G.net.connected) return; const a = this.me, k = [Math.round(a.x), Math.round(a.y), a.dir, a.moving, a.hid].join(); if (k === this.lastK && !force) return; this.lastK = k; G.net.send('p_pos', { x: Math.round(a.x), y: Math.round(a.y), d: a.dir, m: a.moving, h: a.hid, mt: a.meter }); }

    /* el guardia llega a un escondite y lo revisa */
    onPeek(npc, spot) {
      [this.me, this.pa].forEach(a => { if (a.hid === spot && !a.seen) this.found(a); });
    }
    found(a) {
      a.seen = true; a.hid = -1; a.spr.setAlpha(1); a.mark.setText('!'); G.audio.sfx('hit');
      if (a === this.me) { this.cameras.main.shake(200, 0.008); this.send('p_seen', {}); this.setBanner('¡TE VIERON! 🙈', 'Esta ronda la pierdes'); }
    }
    detect(a, dt) {
      if (a.hid >= 0 || a.seen) { a.meter = Math.max(0, a.meter - dt * 2); return; }
      let inC = false;
      this.npcs.forEach(n => { if (n.out) return; const dx = a.x - n.x, dy = (a.y - 10) - n.y, d = Math.hypot(dx, dy); if (d < n.range && Math.abs(angDiff(Math.atan2(dy, dx), n.a)) < n.half) inC = true; });
      a.meter = inC ? a.meter + dt / 0.5 : Math.max(0, a.meter - dt * 1.6);
      if (a.meter >= 1) this.found(a);
    }

    update(time, dtMs) {
      const dt = Math.min(0.05, dtMs / 1000);
      if (['hide', 'patrol', 'between'].includes(this.phase)) this.moveMe(dt);
      this.movePartner(dt);
      if (this.phase === 'hide') {
        this.hideT -= dt; if (this.bot) this.simBot(dt);
        this.sub.setText('¡Escóndete! ' + Math.ceil(Math.max(0, this.hideT)) + ' s' + (this.me.hid >= 0 ? ' — ya estás escondido ✔' : ''));
        if (this.hideT <= 0) { this.phase = 'patrol'; this.npcs = makePlans(this.seed, this.r); this.setBanner('RONDA ' + this.r + ' · ¡Llega la patrulla!', 'El guardia revisa escondites: mira el "?"'); G.audio.sfx('pop'); }
      } else if (this.phase === 'patrol') {
        this.pT += dt; this.acc += dt; while (this.acc >= 1 / 30) { this.acc -= 1 / 30; this.npcs.forEach(n => { if (!n.out) n.step(1 / 30, this); }); }
        if (this.bot) this.simBot(dt);
        this.detect(this.me, dt); if (this.bot) this.detect(this.pa, dt);
        if (!this.me.seen) this.sub.setText('Quédate escondido… o muévete con cuidado');
        if (this.npcs.every(n => n.out) || this.pT > 45) this.endPatrol();
      }
      this.sendT = (this.sendT || 0) + dt; if (this.sendT > 0.08) { this.sendT = 0; this.sendPos(); }
      this.render(time);
    }
    moveMe(dt) {
      const a = this.me, K = this.keys; let vx = 0, vy = 0;
      if (!G.typing && !G.modalOpen && a.hid < 0 && !(a.seen && this.phase !== 'between')) { if (K.left.isDown || K.a.isDown) vx--; if (K.right.isDown || K.d.isDown) vx++; if (K.up.isDown || K.w.isDown) vy--; if (K.down.isDown || K.s.isDown) vy++; }
      if (a.seen && this.phase !== 'between') { vx = vy = 0; }
      a.moving = !!(vx || vy);
      if (a.moving) { const l = Math.hypot(vx, vy); a.x = Phaser.Math.Clamp(a.x + vx / l * SPEED * dt, B.x0, B.x1); a.y = Phaser.Math.Clamp(a.y + vy / l * SPEED * dt, B.y0, B.y1); a.dir = Math.abs(vx) >= Math.abs(vy) && vx ? (vx < 0 ? 'l' : 'r') : (vy < 0 ? 'u' : 'd'); a.t += dt * 1000; }
    }
    movePartner(dt) {
      const a = this.pa; if (this.bot) { a.t += a.moving ? dt * 1000 : 0; return; }
      a.x += (a.tx - a.x) * 0.25; a.y += (a.ty - a.y) * 0.25; a.t += a.moving ? dt * 1000 : 0; a.spr.setAlpha(a.hid >= 0 ? 0 : 1);
    }
    simBot(dt) {                                  // pareja simulada (solo en modo prueba)
      const b = this.bot, a = this.pa; if (a.seen) { a.moving = false; return; }
      if (b.wait > 0) { b.wait -= dt; return; }
      const goTo = (x, y) => { const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy); if (d < 3) { a.moving = false; return true; } a.x += dx / d * 60 * dt; a.y += dy / d * 60 * dt; a.moving = true; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'l' : 'r') : (dy < 0 ? 'u' : 'd'); return false; };
      if (a.hid < 0) {
        if (b.spot < 0 || !this.spotFree(b.spot, 'partner')) { const free = SPOTS.map((s, i) => i).filter(i => this.spotFree(i, 'partner')); b.spot = free[Math.floor(Math.random() * free.length)]; }
        if (goTo(SPOTS[b.spot].x, SPOTS[b.spot].y + 4)) { a.hid = b.spot; a.spr.setAlpha(0); }
      } else if (this.phase === 'patrol') {
        const g = this.npcs[0]; if (g && g.flag === a.hid && !b.moved && Math.hypot(g.x - a.x, g.y - a.y) < 90 && Math.random() < 0.02) { b.moved = true; a.hid = -1; a.spr.setAlpha(1); const free = SPOTS.map((s, i) => i).filter(i => i !== b.spot && this.spotFree(i, 'partner')); b.spot = free[Math.floor(Math.random() * free.length)]; }
      }
    }

    endPatrol() {
      if (this.phase !== 'patrol') return; this.phase = 'between'; this.npcs.forEach(n => { n.out = true; });
      this.setBanner('Fin de la patrulla', 'Contando…');
      const seen = this.me.seen; this.fin.me = seen; this.send('p_fin', { seen });
      if (G.solo) { this.fin.partner = this.pa.seen; this.hostResolve(); }
      else this.time.delayedCall(3000, () => this.hostResolve(true));
      this.hostResolve();
    }
    hostResolve(force) {
      if (this.resolved || this.phase === 'lobby' || this.phase === 'over') return;
      if (!(G.solo || G.net.role === 'host')) return;
      if (this.fin.me === undefined || (this.fin.partner === undefined && !force)) return;
      this.resolved = true;
      const my = G.state.me.id, pi = G.state.partner.id, s = { dani: this.scores.dani, sebas: this.scores.sebas };
      if (!this.fin.me) s[my]++; if (!(this.fin.partner === undefined ? this.pa.seen : this.fin.partner)) s[pi]++;
      const res = { r: this.r, seen: { [my]: !!this.fin.me, [pi]: this.fin.partner === undefined ? this.pa.seen : !!this.fin.partner }, scores: s };
      this.send('p_res', res); this.applyRes(res);
    }
    applyRes(res) {
      this.scores = res.scores; this.phase = 'between'; const my = G.state.me.id, pi = G.state.partner.id;
      const iSeen = res.seen[my], pSeen = res.seen[pi];
      this.me.mark.setText(iSeen ? '!' : '✔'); this.pa.mark.setText(pSeen ? '!' : '✔');
      this.setBanner(iSeen && pSeen ? 'Los dos fueron vistos 🙈🙈' : iSeen ? 'Te vieron a ti 🙈' : pSeen ? 'Vieron a ' + G.state.partner.name + ' 🙈' : '¡Ni los vieron! 😎😎', this.scoreLine());
      if (!(G.solo || G.net.role === 'host')) return;
      this.time.delayedCall(3600, () => {
        if (this.r >= this.rounds && this.scores.dani !== this.scores.sebas) { const w = this.scores.dani > this.scores.sebas ? 'dani' : 'sebas'; const o = { winner: w, scores: this.scores }; this.send('p_over', o); this.showOver(o); }
        else { this.send('p_next', { r: this.r + 1 }); this.startRound(this.r + 1); }
      });
    }
    scoreLine() { const s = this.scores, d = G.state.me.id === 'dani' ? G.state.me.name : G.state.partner.name, e = G.state.me.id === 'sebas' ? G.state.me.name : G.state.partner.name; return 'Rondas sin ser visto —  ' + d + ' ' + s.dani + '  ·  ' + s.sebas + ' ' + e; }

    /* ---------- dibujo por cuadro ---------- */
    render(time) {
      [this.me, this.pa].forEach(a => this.drawActor(a));
      const g = this.coneG; g.clear(); let flag = null;
      this.npcs.forEach(n => {
        if (n.out) { if (n.spr) { n.spr.destroy(); n.spr = null; } return; }
        if (!n.spr) { n.spr = this.add.sprite(n.x, n.y, 'npc_' + n.kind, 'd0').setOrigin(0.5, 1); n.shadow = this.add.ellipse(n.x, n.y, 14, 5, 0x000000, 0.25); }
        const ca = Math.cos(n.a), sa = Math.sin(n.a), dir = Math.abs(ca) >= Math.abs(sa) ? 'l' : (sa < 0 ? 'u' : 'd'), fr = n.moving ? [1, 0, 2, 0][Math.floor(n.t * 7) % 4] : 0;
        n.spr.setPosition(Math.round(n.x), Math.round(n.y)).setFrame(dir + fr).setFlipX(dir === 'l' && ca > 0).setDepth(n.y); n.shadow.setPosition(n.x, n.y - 1).setDepth(n.y - 1);
        const col = n.kind === 'guard' ? 0xff4d4d : 0xffd24a, pts = [{ x: n.x, y: n.y - 12 }]; for (let k = 0; k <= 10; k++) { const an = n.a - n.half + (2 * n.half) * k / 10; pts.push({ x: n.x + Math.cos(an) * n.range, y: n.y - 12 + Math.sin(an) * n.range }); }
        g.fillStyle(col, 0.2).fillPoints(pts, true).lineStyle(1, col, 0.55).strokePoints(pts, true);
        if (n.kind === 'guard' && n.flag >= 0 && (n.state === 'walk' || n.state === 'peek')) flag = n;
      });
      if (flag) { const s = SPOTS[flag.flag]; this.flagTxt.setVisible(true).setPosition(s.x, s.y - (s.t === 'tree' ? 56 : s.t === 'pillar' ? 44 : 30) + Math.sin(time / 120) * 2); } else this.flagTxt.setVisible(false);
      this.eyes.forEach((e, i) => { const a = i ? this.pa : this.me; e.clear(); if (a.hid >= 0) { const s = SPOTS[a.hid], y = s.y - (s.t === 'bush' ? 12 : s.t === 'tree' ? 12 : 16); e.fillStyle(0xffffff).fillRect(s.x - 4, y, 3, 3).fillRect(s.x + 1, y, 3, 3).fillStyle(0x1b1230).fillRect(s.x - 3, y + 1, 1, 2).fillRect(s.x + 2, y + 1, 1, 2); e.setDepth(s.y + 7); } });
    }
    drawActor(a) {
      const flip = a.dir === 'r', dir = a.dir === 'r' ? 'l' : a.dir, fr = a.moving ? [1, 0, 2, 0][Math.floor(a.t / 130) % 4] : 0;
      a.spr.setPosition(Math.round(a.x), Math.round(a.y)).setFrame(dir + fr).setFlipX(flip).setDepth(a.y); a.shadow.setPosition(a.x, a.y - 1).setDepth(a.y - 1).setVisible(a.hid < 0);
      a.label.setPosition(Math.round(a.x), Math.round(a.y - (a.hid >= 0 ? 6 : 29))).setDepth(a.y + 1000).setAlpha(a.hid >= 0 ? 0.0 : 1);
      a.mark.setPosition(a.x, a.y - 36).setDepth(a.y + 1001);
      a.bar.clear().setDepth(a.y + 1001); if (a.meter > 0.02 && !a.seen) { a.bar.fillStyle(0x2b1b30).fillRect(a.x - 9, a.y - 34, 18, 4).fillStyle(a.meter > 0.66 ? 0xff3b3b : 0xffd24a).fillRect(a.x - 8, a.y - 33, 16 * Math.min(1, a.meter), 2); }
    }

    /* ---------- final ---------- */
    showOver(o) {
      if (this.phase === 'over') return; this.phase = 'over'; this.scores = o.scores; const D = 9500, my = G.state.me.id, pi = G.state.partner.id, win = o.winner, wn = win === my ? G.state.me.name : G.state.partner.name;
      if (G.solo || G.net.role === 'host') { G.addSoles(win, PRIZE); G.recordWin('pucp', win, o.scores[win]); }
      G.audio.sfx('win'); this.npcs.forEach(n => { n.out = true; });
      const g = this.add.graphics().setDepth(D); g.fillStyle(0x2b1b30, 1).fillRoundedRect(50, 38, 300, 150, 8).lineStyle(2, 0xffd24a).strokeRoundedRect(50, 38, 300, 150, 8);
      A.text(this, 200, 58, '🏆 ¡GANÓ ' + String(wn || '').toUpperCase() + '!', 18, '#ffd24a').setDepth(D + 1);
      const nm = id => id === my ? G.state.me.name : G.state.partner.name;
      [[my, 84], [pi, 102]].forEach(([id, y]) => this.add.text(200, y, nm(id) + ':  ' + o.scores[id] + ' rondas sin ser visto' + (id === win ? '  👑' : ''), { fontFamily: 'VT323', fontSize: '15px', color: id === win ? '#ffd24a' : '#fff3d6' }).setOrigin(0.5).setDepth(D + 1));
      this.add.text(200, 124, '+ S/ ' + PRIZE + ' para ' + nm(win) + ' · récord guardado', { fontFamily: 'VT323', fontSize: '13px', color: '#ffd1e0' }).setOrigin(0.5).setDepth(D + 1);
      this.btn(o => o, 150, 160, 92, 22, '↻ Revancha', 0xffd24a, () => { this.send('p_again', {}); this.scene.restart(); }, D); this.btn(o => o, 250, 160, 92, 22, '◀ Al mapa', 0xff7aa8, () => G.flow.openMap(), D);
      for (let i = 0; i < 14; i++) { const h = this.add.graphics().setDepth(D + 0.5); A.heart(h, 0, 0, 3 + (i % 3), [0xff5d97, 0xffd24a, 0x7fd1ae, 0xb07cff][i % 4]); h.x = 70 + Math.random() * 260; h.y = 30; this.tweens.add({ targets: h, y: 215, alpha: { from: 1, to: 0.2 }, duration: 1800 + Math.random() * 1400, delay: i * 90, repeat: -1 }); }
    }
  }
  G.PucpScene = PucpScene;
})();
