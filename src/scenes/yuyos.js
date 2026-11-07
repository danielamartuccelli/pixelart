/* ===========================================================
   scenes/yuyos.js — ETAPA 9 · LOS YUYOS (Barranco) · "Duelo de Canillitas de Chapa"
   Estilo Mario Party en la playa. Tres pruebas, los dos juegan A LA VEZ con la misma semilla:
   1) CHAPUZÓN: aguanta el primer chapuzón. Pulsa ← → ALTERNANDO para no rendirte; cuando venga una OLA
      (aviso en pantalla) mantén ↓ para agacharte. Gana quien aguante más segundos.
   2) EQUILIBRIO: carrera saltando 10 piedras resbalosas con una chamarra pesada. La aguja se desbalancea sola
      (más con cada piedra): corrígela con ← →. Cuando esté al centro, ESPACIO salta. Si saltas mal, resbalas.
   3) PULSO: carga la piedra más pesada. Aporrea ESPACIO, pero si vas demasiado rápido te da calambre.
   Gana el que gane más pruebas ("rey de la playa"): S/ 10 y foto vintage en el álbum del igloo.
   Red: y_ready · y_go{seed} · y_next{g} · y_prog{g,v} · y_fin{g,s} · y_res · y_again
   Prueba sola: ?solo=1&me=sebas&go=yuyos&yauto=1
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H, Q = new URLSearchParams(location.search), mg = G.mg, OUTL = 0x2b1b30;
  const EV = [
    { name: 'CHAPUZÓN', how: 'Pulsa ← → ALTERNANDO para aguantar el agua helada.\nCuando veas la ola ¡mantén ↓ para agacharte!', cap: 60 },
    { name: 'EQUILIBRIO', how: 'Chamarra pesada, piedras resbalosas: corrige la aguja con ← →\ny salta con ESPACIO cuando esté al centro. 10 piedras.', cap: 45 },
    { name: 'PULSO DE FUERZA', how: 'Aporrea ESPACIO para levantar la piedra más pesada.\nSi vas demasiado rápido ¡te da calambre!', cap: 25 }
  ];

  class YuyosScene extends G.BeachBase {
    constructor() { super('yuyos'); }
    create() {
      this.recKey = 'yuyos';
      this.setupBase('y', 'yuyos', '🤿 DUELO DE CANILLITAS DE CHAPA', 'Tres pruebas en Los Yuyos, los dos a la vez: CHAPUZÓN (aguantar), EQUILIBRIO sobre piedras resbalosas con chamarra pesada y PULSO de fuerza con la piedra más pesada. Gana más pruebas = rey de la playa.');
      this.bg = this.add.graphics().setDepth(0); G.beach.drawSea(this, this.bg, { seaH: 96, sunset: true, sun: true });
      this.gx = this.add.graphics().setDepth(5); this.hud = this.add.graphics().setDepth(4000); this.hudT = [];
      this.keys = this.input.keyboard.addKeys({ left: 'LEFT', right: 'RIGHT', down: 'DOWN', a: 'A', d: 'D', s: 'S' }, false);
      this.pts = { me: 0, partner: 0 }; this.g = -1; this.fin = {}; this.opP = 0;
      const kb = this.input.keyboard;
      kb.on('keydown-LEFT', () => this.tap('l')); kb.on('keydown-RIGHT', () => this.tap('r')); kb.on('keydown-A', () => this.tap('l')); kb.on('keydown-D', () => this.tap('r')); kb.on('keydown-SPACE', () => this.space());
      mg.bind(this, [['y_next', d => { if (!this.isHost()) this.intro(d.g); }], ['y_prog', d => { if (d.g === this.g) this.opP = d.v; }], ['y_fin', d => { this.fin.partner = d.s; this.tryEvent(); }]]);
      this.drawLobby();
      if (G.solo && Q.get('yauto') === '1') this.time.delayedCall(600, () => { this.ready.me = true; this.tryStart(); });
    }
    begin(d) { this.clearUi(); this.seed = d.seed; this.pts = { me: 0, partner: 0 }; this.over = false; this.resolved = false; if (this.isHost()) { mg.send('y_next', { g: 0 }); this.intro(0); } else this.phase = 'wait'; }

    /* ---------- cada prueba ---------- */
    intro(g) {
      this.clearUi(); this.g = g; this.fin = {}; this.opP = 0; this.phase = 'intro'; const add = o => this.addUi(o), D = 5000;
      mg.panel(this, add, 40, 56, 320, 104, D);
      add(A.text(this, 200, 72, 'PRUEBA ' + (g + 1) + ' de 3 · ' + EV[g].name, 16, '#ffd24a').setDepth(D + 1));
      add(this.add.text(200, 90, EV[g].how, { fontFamily: 'VT323', fontSize: '14px', color: '#fff3d6', align: 'center' }).setOrigin(0.5, 0).setDepth(D + 1));
      add(A.text(this, 200, 140, 'Marcador: ' + this.nameMe() + ' ' + this.pts.me + ' – ' + this.pts.partner + ' ' + this.nameOp(), 12, '#c9c4ff', { strokeThickness: 0 }).setDepth(D + 1));
      this.cd = 3.5; this.cdT = add(A.text(this, 200, 112, '', 20, '#ffffff').setDepth(D + 2));
      this.R = mg.rng((this.seed + g * 104729) >>> 0);
      Object.assign(this, { aguante: 100, tt: 0, wave: null, nextWave: 2.5 + this.R() * 1.5, last: '', down: 0, prog: 0, needle: 0, nv: 0, freeze: 0, cdJ: 0, noise: 0, noiseT: 0, str: 0, taps: [], lock: 0, done: false, myFin: null, bump: 0, solved: 0 });
      this.waves = []; this.botDone = null;
      if (this.sprMe) { this.sprMe.destroy(); this.sprOp.destroy(); this.sprMe = null; }
      this.sprMe = this.sprite('me', 110, 176, 1.5).setDepth(20); this.sprOp = this.sprite('partner', 290, 176, 1.5).setDepth(20);
    }
    startPlay() {
      this.clearUi(); this.phase = 'play'; this.tt = 0; G.audio.sfx('pop');
      if (G.solo) { const R = mg.rng(this.seed + 99 + this.g); this.botDone = [10 + R() * 14, 24 + R() * 8, 13 + R() * 6][this.g]; }
    }
    tap(side) {
      if (this.phase !== 'play' || this.g !== 0 || this.done) return;
      this.aguante = Math.min(100, this.aguante + (side !== this.last ? 5.2 : 1.2)); this.last = side; G.audio.sfx('click');
    }
    space() {
      if (this.phase !== 'play' || this.done) return;
      if (this.g === 1) {
        if (this.freeze > 0 || this.cdJ > 0) return; this.cdJ = 0.3;
        if (Math.abs(this.needle) < 0.36) { this.prog++; this.solved = this.prog; G.audio.sfx('ok'); this.needle = 0; this.nv = 0; if (this.prog >= 10) this.finish({ done: true, t: this.tt, v: 10 }); }
        else { this.freeze = 0.9; this.needle = 0; this.nv = 0; this.bump = 0.4; G.audio.sfx('hit'); }
      } else if (this.g === 2) {
        if (this.lock > 0) return; const now = this.tt; this.taps = this.taps.filter(x => now - x < 1); this.taps.push(now);
        if (this.taps.length > 9) { this.lock = 0.8; this.str = Math.max(0, this.str - 9); this.taps = []; G.audio.sfx('hit'); }
        else { this.str = Math.min(100, this.str + 4.2); G.audio.sfx('click'); if (this.str >= 100) this.finish({ done: true, t: this.tt, v: 100 }); }
      }
    }
    finish(s) { if (this.done) return; this.done = true; this.myFin = s; this.fin.me = s; mg.send('y_fin', { g: this.g, s }); this.phase = 'waitop'; this.tryEvent(); }
    /* ¿terminaron los dos? Se calcula igual en las dos laptops */
    better(a, b) {   // devuelve 'me' | 'partner' | null
      const g = this.g;
      if (g === 0) return a.t === b.t ? null : (a.t > b.t ? 'me' : 'partner');
      if (a.done !== b.done) return a.done ? 'me' : 'partner';
      if (a.done) return a.t === b.t ? null : (a.t < b.t ? 'me' : 'partner');
      return a.v === b.v ? null : (a.v > b.v ? 'me' : 'partner');
    }
    tryEvent() {
      if (this.phase !== 'waitop' || !this.fin.me || !this.fin.partner) return;
      this.phase = 'evres'; const w = this.better(this.fin.me, this.fin.partner);
      if (w) this.pts[w]++; G.audio.sfx(w === 'me' ? 'win' : 'hit');
      const f = s => EV[this.g].name === 'CHAPUZÓN' ? s.t.toFixed(1) + ' s' : (s.done ? s.t.toFixed(1) + ' s' : Math.round(s.v) + (this.g === 1 ? ' piedras' : '%'));
      this.clearUi(); const add = o => this.addUi(o), D = 5000;
      mg.panel(this, add, 50, 70, 300, 80, D);
      add(A.text(this, 200, 84, w ? (w === 'me' ? '¡Punto para ' + this.nameMe() + '!' : 'Punto para ' + this.nameOp()) : 'Empate en esta prueba', 16, '#ffd24a').setDepth(D + 1));
      add(this.add.text(200, 104, this.nameMe() + ': ' + f(this.fin.me) + '   ·   ' + this.nameOp() + ': ' + f(this.fin.partner) + '\nMarcador ' + this.pts.me + ' – ' + this.pts.partner, { fontFamily: 'VT323', fontSize: '14px', color: '#fff3d6', align: 'center' }).setOrigin(0.5, 0).setDepth(D + 1));
      const last = this.g >= 2;
      this.time.delayedCall(3000, () => {
        if (last) { this.phase = 'wait'; this.clearUi(); const win = this.pts.me === this.pts.partner ? null : (this.pts.me > this.pts.partner ? G.state.me.id : G.state.partner.id); this.hostFinish(win, { line: 'Pruebas ' + this.pts.me + ' – ' + this.pts.partner }); this.time.delayedCall(8000, () => { if (!this.over) this.hostFinish(win, {}); }); }
        else if (this.isHost()) { mg.send('y_next', { g: this.g + 1 }); this.intro(this.g + 1); }
        else this.phase = 'wait';
      });
    }

    /* ---------- bucle ---------- */
    update(time, dtMs) {
      const dt = Math.min(0.05, dtMs / 1000), gx = this.gx; gx.clear();
      if (this.phase === 'intro') { this.cd -= dt; if (this.cdT) this.cdT.setText(this.cd > 0.6 ? Math.ceil(this.cd - 0.6) : '¡YA!'); if (this.cd <= 0) this.startPlay(); }
      else if (this.phase === 'play' || this.phase === 'waitop') { if (this.phase === 'play') this.stepPlay(dt); if (G.solo && this.botDone != null && this.tt >= this.botDone && !this.fin.partner) { const g = this.g; this.fin.partner = g === 0 ? { done: false, t: this.botDone, v: 0 } : { done: true, t: this.botDone, v: g === 1 ? 10 : 100 }; this.tryEvent(); } if (G.solo && this.botDone) this.opP = Math.min(1, this.tt / this.botDone); }
      if (this.phase === 'waitop') this.tt += dt;
      this.draw(time, dt);
    }
    stepPlay(dt) {
      this.tt += dt; const g = this.g, k = this.keys;
      if (g === 0) {
        this.aguante -= (13 + this.tt * 1.1) * dt;
        if (!this.wave && this.tt > this.nextWave) { this.wave = { t: 0 }; }
        if (this.wave) { this.wave.t += dt; const dn = k.down.isDown || k.s.isDown; if (this.wave.t > 1.1) { this.aguante -= dn ? 4 : 24; this.bump = 0.5; G.audio.sfx(dn ? 'pop' : 'hit'); this.wave = null; this.nextWave = this.tt + 2.2 + this.R() * 2.2; } }
        if (this.aguante <= 0) this.finish({ done: false, t: Math.min(this.tt, EV[0].cap), v: 0 });
        else if (this.tt >= EV[0].cap) this.finish({ done: false, t: EV[0].cap, v: 0 });
        this.prog = Math.min(1, this.tt / 40);
      } else if (g === 1) {
        this.freeze = Math.max(0, this.freeze - dt); this.cdJ = Math.max(0, this.cdJ - dt);
        if (this.freeze <= 0) {
          this.noiseT -= dt; if (this.noiseT <= 0) { this.noiseT = 0.35 + this.R() * 0.3; this.noise = (this.R() - 0.5) * 2 * (1.5 + this.prog * 0.22); }
          const push = ((k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0)) * 2.4;
          this.nv = (this.nv + (this.noise + push) * dt) * Math.pow(0.35, dt); this.needle += this.nv * dt * 1.4;
          if (Math.abs(this.needle) >= 1) { this.freeze = 1.3; this.needle = 0; this.nv = 0; this.bump = 0.5; G.audio.sfx('hit'); }
        }
        if (this.tt >= EV[1].cap) this.finish({ done: false, t: EV[1].cap, v: this.prog });
      } else {
        this.lock = Math.max(0, this.lock - dt); this.str = Math.max(0, this.str - (11 + this.tt * 0.5) * dt);
        if (this.tt >= EV[2].cap) this.finish({ done: false, t: EV[2].cap, v: this.str });
      }
      this.bump = Math.max(0, this.bump - dt);
      this.pn = (this.pn || 0) + dt; if (this.pn > 0.2) { this.pn = 0; mg.send('y_prog', { g, v: g === 0 ? Math.min(1, this.aguante / 100) : g === 1 ? this.prog / 10 : this.str / 100 }); }
    }

    /* ---------- dibujo de cada prueba ---------- */
    draw(time, dt) {
      const gx = this.gx, h = this.hud; h.clear(); this.hudT.forEach(t => t.destroy()); this.hudT = [];
      const p = this.phase; if (p === 'lobby' || p === 'over' || p === 'wait') { if (this.sprMe) this.sprMe.setVisible(false); if (this.sprOp) this.sprOp.setVisible(false); return; }
      if (!this.sprMe) return; this.sprMe.setVisible(true); this.sprOp.setVisible(true);
      const g = this.g, t = time / 1000;
      // mar con olitas
      for (let x = 0; x < W; x += 10) gx.fillStyle(0xffffff, 0.5).fillRect(x, 60 + Math.sin(t * 1.5 + x * 0.1) * 3, 6, 1);
      const bar = (x, y, w, v, c, bg) => { h.fillStyle(OUTL).fillRect(x - 1, y - 1, w + 2, 10).fillStyle(bg || 0x2a3a5a).fillRect(x, y, w, 8).fillStyle(c).fillRect(x, y, w * Math.max(0, Math.min(1, v)), 8); };
      const label = (x, y, s, c) => this.hudT.push(this.add.text(x, y, s, { fontFamily: 'VT323', fontSize: '12px', color: c || '#fff', stroke: '#2b1b30', strokeThickness: 3 }).setOrigin(0.5, 0).setDepth(4002));
      label(110, 48, this.nameMe() + (this.g >= 0 ? '' : ''), '#fff'); label(290, 48, this.nameOp(), '#fff');
      label(200, 48, 'Prueba ' + (g + 1) + '/3 · ' + EV[g].name + ' · ' + this.pts.me + '–' + this.pts.partner, '#ffd24a');
      let shake = this.bump > 0 ? (Math.random() - 0.5) * 4 : 0;
      this.sprMe.setPosition(110 + shake, 176); this.sprOp.setPosition(290, 176);
      const fr = Math.floor(t * 6) % 3; this.sprMe.setFrame('d' + (this.phase === 'play' && fr === 1 ? 1 : 0)); this.sprOp.setFrame('d0');
      bar(290 - 40, 66, 80, this.opP, 0xff9fd0);          // progreso de la pareja
      if (g === 0) {
        bar(70, 66, 80, this.aguante / 100, this.aguante < 30 ? 0xe63946 : 0x4fb8ff); label(110, 76, 'AGUANTE · ' + this.tt.toFixed(1) + ' s', '#fff');
        const w = this.wave; if (w) { const k = Math.min(1, w.t / 1.1); gx.fillStyle(0x4fb8ff, 0.65).fillRect(0, 98, W, 20 + 70 * k * k).fillStyle(0xffffff, 0.9).fillRect(0, 98 + 70 * k * k, W, 3); label(200, 120, (this.keys.down.isDown || this.keys.s.isDown) ? '¡Agachado!' : '¡OLA! mantén ↓', '#ffe14a'); }
        label(110, 190, 'alterna ← →', '#fff3d6');
      } else if (g === 1) {
        // piedras en fila, saltando de izquierda a derecha
        for (let i = 0; i < 10; i++) { const x = 30 + i * 36, y = 150 + Math.sin(i * 2.1) * 5; G.beach.stone(gx, x, y, i < this.prog ? 8 : 7); if (i === this.prog) gx.lineStyle(1.5, 0xffe14a).strokeCircle(x, y - 2, 11); }
        const px = 30 + Math.min(9, this.prog) * 36; this.sprMe.setPosition(px + shake, 146 + (this.freeze > 0 ? 8 : 0)).setAlpha(this.freeze > 0 ? 0.6 : 1);
        this.sprOp.setPosition(30 + Math.min(9, Math.floor(this.opP * 10)) * 36, 146);
        // aguja de equilibrio
        bar(110, 190, 180, 0, 0x000000); gx.fillStyle(0x7fe08a, 0.9).fillRect(110 + 90 - 0.36 * 90, 191, 0.72 * 90, 8);
        gx.fillStyle(0xffffff).fillRect(110 + 90 + this.needle * 90 - 2, 186, 4, 16).lineStyle(1, OUTL).strokeRect(110 + 90 + this.needle * 90 - 2, 186, 4, 16);
        label(200, 174, 'Piedra ' + Math.min(10, this.prog + 1) + '/10 · ← → equilibra · ESPACIO salta' + (this.freeze > 0 ? ' · ¡resbalaste!' : ''), '#fff3d6');
      } else {
        // piedra pesada que se levanta
        const sk = this.str / 100, op = this.opP; [[110, sk], [290, op]].forEach(([x, v]) => { G.beach.stone(gx, x, 168 - 40 * v, 22); });
        this.sprMe.setPosition(110 + shake, 196); this.sprOp.setPosition(290, 196);
        bar(70, 66, 80, sk, this.lock > 0 ? 0xe63946 : 0xffd24a, 0x3a2a1a); label(110, 76, this.lock > 0 ? '¡CALAMBRE!' : 'FUERZA', this.lock > 0 ? '#ff6b6b' : '#fff');
        label(110, 100, 'ESPACIO sin pasarte', '#fff3d6');
      }
      if (this.phase === 'waitop') label(110, 110, '✔ listo, esperando…', '#9fe0cf');
    }
  }
  G.YuyosScene = YuyosScene;
})();
