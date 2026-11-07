/* ===========================================================
   scenes/kennedy.js — ETAPA 3 · Parque Kennedy · "Carrera de gatos"
   Estilo dinosaurio de Google, pero de a dos y COMPETITIVO:
   - Dos carriles (arriba = pareja, abajo = tú) con el MISMO recorrido (misma semilla).
   - Saltar (↑ / W / Espacio / click) los gatos y los cuadros de la feria de arte;
     agacharse (↓ / S) ante las palomas. Chocar NO mata: te hace tropezar y pierdes ritmo.
   - Pescaditos = turbo corto; bubble tea (raro) = turbo + inmunidad.
   - La velocidad sube con el tiempo. Gana quien más metros haga cuando acaba el reloj (2, 3 o 5 min).
   - Premio: S/ 10 + un bubble tea de accesorio (solo esta sesión). Récord en metros.
   Red: cada uno simula SU carrera y manda su estado (k_pos); la pareja se ve como "fantasma".
   Modo prueba: ?solo=1&go=kennedy  (la pareja es un bot)  ·  &kdur=30 (segundos)  &kauto=1 (arranca solo)
   =========================================================== */
(function () {
  const G = window.G, A = G.art, W = G.W, H = G.H;
  const Q = new URLSearchParams(location.search);
  const PRIZE = 10;
  const LANE_TOP = [22, 128], LANE_H = 94, GROUND_OFF = 74;
  const RX = 92;                         // x del corredor en pantalla
  const JUMP_V = 285, GRAV = 900;
  const PAL_CAT = [{ b: '#f4a259', w: '#fff3d6' }, { b: '#8e9bb0', w: '#e9eef5' }, { b: '#3a3342', w: '#fffaf0' }];
  const DEFS = {
    cat:   { w: 12, h: 9,  b: 0,  hurt: true },
    stall: { w: 13, h: 24, b: 0,  hurt: true },
    pig:   { w: 12, h: 8,  b: 20, hurt: true },
    fish:  { w: 10, h: 6,  b: 10, hurt: false },
    boba:  { w: 8,  h: 12, b: 26, hurt: false }
  };

  /* ---------- utilidades ---------- */
  function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const baseSpeed = t => 95 + Math.min(150, t * 1.15);
  const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const meters = d => Math.floor(d / 8);

  function pix(scene, key, rows, pal) {
    if (scene.textures.exists(key)) return;
    const h = rows.length, w = rows[0].length, tex = scene.textures.createCanvas(key, w, h), ctx = tex.getContext();
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { ctx.fillStyle = pal[ch]; ctx.fillRect(x, y, 1, 1); } }));
    tex.refresh();
  }
  function gfxTex(scene, key, w, h, draw) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false }); draw(g); g.generateTexture(key, w, h); g.destroy();
  }

  /* ---------- texturas del parque ---------- */
  function makeTextures(scene) {
    const CAT = ['.o..o...........', '.opoopo.........', '.obbbbo.......oo', '.kbbkbo......ob.', '.obwwbooooooobo.', '.owwbbbbbbbbbbo.', '..obbbbbbbbbbbo.', '..obbbbbbbbbbbo.', '..obbbbbbbbbbo..', '..obo.ob..obo...', '..owo.ow..owo...', '..ooo.oo..ooo...'];
    PAL_CAT.forEach((c, i) => pix(scene, 'k_cat' + i, CAT, { o: '#2b1b30', b: c.b, w: c.w, p: '#ff9fb0', k: '#1b1230' }));
    pix(scene, 'k_fish', ['..oooo.o..', '.obbbbboo.', 'obkbbbbbbo', '.obbbbboo.', '..oooo.o..'], { o: '#2b1b30', b: '#6fd0ff', k: '#1b1230' });
    pix(scene, 'k_boba', ['.pp.....', '.p......', 'oooooooo', 'owwwwwwo', 'owwtwwwo', 'owtwwtwo', 'owwwtwwo', 'otttttto', 'otttttto', '.otttto.'], { o: '#2b1b30', w: '#f3e2cf', t: '#3a2218', p: '#ff7aa8' });
    [0, 1].forEach(f => gfxTex(scene, 'k_pig' + f, 16, 14, g => {
      g.fillStyle(0x2b1b30).fillEllipse(8, 8, 14, 9); g.fillStyle(0xb7bfd0).fillEllipse(8, 8, 12, 7);
      g.fillStyle(0x2b1b30).fillCircle(3, 5, 4); g.fillStyle(0x9aa3b5).fillCircle(3, 5, 3); g.fillStyle(0xff9d2e).fillTriangle(0, 5, 2, 4, 2, 7); g.fillStyle(0x1b1230).fillRect(3, 4, 1, 1);
      g.fillStyle(0x6a3a9a).fillRect(4, 7, 4, 1);
      if (f === 0) g.fillStyle(0x2b1b30).fillTriangle(6, 8, 14, 0, 12, 8).fillStyle(0x7d8799).fillTriangle(7, 8, 13, 2, 11, 8);
      else g.fillStyle(0x2b1b30).fillTriangle(6, 8, 14, 13, 11, 7).fillStyle(0x7d8799).fillTriangle(7, 8, 13, 12, 10, 8);
    }));
    gfxTex(scene, 'k_easel', 16, 26, g => {   // cuadro de la feria de arte (obstáculo)
      g.fillStyle(0x7a5a3a).fillRect(1, 12, 2, 14).fillRect(13, 12, 2, 14).fillRect(7, 22, 2, 4);
      g.fillStyle(0x2b1b30).fillRect(0, 0, 16, 16).fillStyle(0xfff3d6).fillRect(1, 1, 14, 14);
      g.fillStyle(0x4aa6ff).fillRect(1, 1, 14, 6).fillStyle(0xffd24a).fillCircle(11, 4, 2).fillStyle(0x3aa05a).fillRect(1, 9, 14, 6).fillStyle(0xe63946).fillRect(4, 6, 3, 4);
    });
    gfxTex(scene, 'k_ground', 32, 24, g => {
      g.fillStyle(0x8fd694).fillRect(0, 0, 32, 6).fillStyle(0x6fbf6a).fillRect(0, 5, 32, 1);
      [3, 9, 17, 25].forEach((x, i) => g.fillStyle(0x6fbf6a).fillRect(x, 1 + (i % 2), 1, 3));
      g.fillStyle(0xe8d7b0).fillRect(0, 6, 32, 18).fillStyle(0xcdb98a).fillRect(0, 6, 32, 1);
      g.fillStyle(0xd4c196).fillRect(4, 12, 10, 1).fillRect(20, 16, 9, 1).fillRect(10, 20, 8, 1).fillStyle(0xf3e8c8).fillRect(18, 10, 6, 1);
    });
    gfxTex(scene, 'k_tree', 34, 52, g => {     // ficus del parque
      g.fillStyle(0x6b4a3a).fillRect(15, 30, 5, 22); g.fillStyle(0x2f7a46).fillCircle(17, 20, 15).fillCircle(8, 26, 9).fillCircle(26, 26, 9);
      g.fillStyle(0x3aa05a).fillCircle(14, 16, 10).fillCircle(24, 20, 8).fillStyle(0x6fd18a, 0.7).fillCircle(11, 12, 4);
    });
    gfxTex(scene, 'k_tent', 46, 34, g => {     // toldo de la feria de arte
      g.fillStyle(0x7a5a3a).fillRect(3, 12, 2, 22).fillRect(41, 12, 2, 22);
      for (let i = 0; i < 6; i++) g.fillStyle(i % 2 ? 0xffffff : 0xff7aa8).fillTriangle(i * 7 + 2, 12, i * 7 + 9, 12, i * 7 + 5.5, 2);
      g.fillStyle(0xffffff).fillRect(6, 20, 34, 14);
      [0xe63946, 0x4aa6ff, 0xffd24a, 0x8a5cf6, 0x3aa05a].forEach((c, i) => g.fillStyle(c).fillRect(8 + i * 7, 22, 5, 7));
    });
    gfxTex(scene, 'k_lamp', 8, 34, g => { g.fillStyle(0x2b1b30).fillRect(3, 6, 2, 28).fillRect(1, 33, 6, 1).fillStyle(0xfff3b0).fillCircle(4, 4, 4).fillStyle(0xffffff, 0.8).fillCircle(3, 3, 1.5); });
    gfxTex(scene, 'k_bench', 24, 14, g => { g.fillStyle(0x6b4a3a).fillRect(1, 4, 22, 3).fillRect(1, 8, 22, 2).fillStyle(0x2b1b30).fillRect(3, 10, 2, 4).fillRect(19, 10, 2, 4).fillRect(1, 0, 2, 5).fillRect(21, 0, 2, 5); });
    gfxTex(scene, 'k_church', 62, 84, g => {   // Iglesia de la Virgen Milagrosa (Kennedy)
      g.fillStyle(0xf3e3c3).fillRect(6, 30, 50, 54); g.fillStyle(0xe2cfa6).fillRect(6, 30, 6, 54).fillRect(50, 30, 6, 54);
      g.fillStyle(0xf3e3c3).fillRect(2, 14, 16, 70).fillRect(44, 14, 16, 70);
      g.fillStyle(0xb5502a).fillTriangle(0, 14, 20, 14, 10, -0).fillTriangle(42, 14, 62, 14, 52, 0);
      g.fillStyle(0xb5502a).fillTriangle(10, 32, 52, 32, 31, 14);
      g.fillStyle(0xffffff).fillRect(9, -6, 2, 8).fillRect(7, -3, 6, 2).fillRect(51, -6, 2, 8).fillRect(49, -3, 6, 2);
      g.fillStyle(0x2b1b30).fillRoundedRect(25, 54, 12, 30, 5).fillStyle(0x6fa8d9).fillCircle(31, 42, 5).fillRect(7, 30, 3, 8).fillRect(52, 30, 3, 8).fillRect(7, 50, 3, 8).fillRect(52, 50, 3, 8);
      g.fillStyle(0x6b4a3a).fillRoundedRect(26, 56, 10, 28, 4);
    });
    [[0xffc9d9, 0xff7aa8], [0xcfe8ff, 0x6fa8d9], [0xffe9a8, 0xe6b84a]].forEach(([c, d], i) => gfxTex(scene, 'k_bld' + i, 28, 60 + i * 12, g => {
      const h = 60 + i * 12; g.fillStyle(c).fillRect(0, 0, 28, h).fillStyle(d).fillRect(0, 0, 28, 3).fillRect(26, 0, 2, h);
      for (let y = 8; y < h - 8; y += 10) for (let x = 4; x < 24; x += 8) g.fillStyle(0xfff3b0, 0.9).fillRect(x, y, 4, 5);
    }));
    gfxTex(scene, 'k_cloud', 40, 14, g => { g.fillStyle(0xffffff, 0.9).fillEllipse(14, 9, 24, 9).fillEllipse(26, 7, 22, 10).fillEllipse(20, 5, 16, 8); });
  }

  /* ---------- recorrido (igual para los dos) ---------- */
  class Course {
    constructor(seed) { this.r = rng(seed); this.list = []; this.nextX = 430; this.id = 0; }
    ensure(upTo) {
      const r = this.r;
      while (this.nextX < upTo) {
        const x = this.nextX, diff = Math.min(1, x / 14000), v = 95 + Math.min(150, x / 110), roll = r();
        let kind, extra = 0;
        if (roll < 0.40) kind = 'cat'; else if (roll < 0.52 + 0.10 * diff) kind = 'cat2'; else if (roll < 0.74 + 0.04 * diff) kind = 'pig'; else kind = 'stall';
        const col = Math.floor(r() * 3);
        if (kind === 'cat2') { this.add('cat', x, col); this.add('cat', x + 24, (col + 1) % 3); extra = 24; }
        else this.add(kind, x, col);
        const gap = v * (0.78 + r() * 0.75) + 40 - diff * 10 + extra;
        if (r() < 0.38) {                                    // pescaditos en el hueco (a ras o en el aire)
          const hi = r() < 0.5, fx = x + gap * 0.5;
          for (let k = 0; k < 3; k++) this.add('fish', fx + k * 16, 0, hi ? 40 + (k === 1 ? 5 : 0) : 8);
        } else if (r() < 0.06) this.add('boba', x + gap * 0.5, 0, 28);
        this.nextX += gap;
      }
      this.list.sort((a, b) => a.x - b.x);
    }
    add(kind, x, col, b) { this.list.push({ id: this.id++, kind, x, col: col || 0, b: b === undefined ? DEFS[kind].b : b }); }
  }
  function sceneryList(seed, far) {            // decorado (árboles, toldos…): determinista
    const r = rng(seed ^ (far ? 0x9e3779b9 : 0x85ebca6b)), list = []; let x = far ? 60 : 120;
    while (x < 60000) {
      let k;
      if (far) { k = (list.length % 11 === 5) ? 'church' : 'bld' + Math.floor(r() * 3); x += k === 'church' ? 90 : 36 + r() * 60; list.push({ x, k }); x += k === 'church' ? 60 : 0; }
      else { const q = r(); k = q < 0.34 ? 'tree' : q < 0.58 ? 'tent' : q < 0.78 ? 'lamp' : 'bench'; list.push({ x, k }); x += 70 + r() * 110; }
    }
    return list;
  }

  /* ---------- corredor (yo, el bot o el fantasma de la red) ---------- */
  class Runner {
    constructor() { this.reset(); }
    reset() { this.dist = 0; this.y = 0; this.vy = 0; this.duck = false; this.stumble = 0; this.inv = 0; this.boost = 0; this.fish = 0; this.hits = 0; this.bobas = 0; this.v = 95; this.tk = []; this.bonusPop = []; }
    sim(dt, t, inp) {
      const mult = (this.stumble > 0 ? 0.35 : 1) * (this.boost > 0 ? 1.3 : 1);
      this.v = baseSpeed(t) * mult; this.dist += this.v * dt;
      const ground = this.y <= 0 && this.vy <= 0;
      if (inp.jump && ground) { this.vy = JUMP_V; this.y = 0.01; if (inp.onJump) inp.onJump(); }
      if (!inp.held && this.vy > 130) this.vy = 130;                 // salto corto si sueltas
      this.duck = !!inp.duck && ground;
      if (!ground || this.vy > 0) { this.vy -= (GRAV + (inp.duck ? 700 : 0)) * dt; this.y += this.vy * dt; if (this.y <= 0) { this.y = 0; this.vy = 0; } }
      this.stumble = Math.max(0, this.stumble - dt); this.inv = Math.max(0, this.inv - dt); this.boost = Math.max(0, this.boost - dt);
    }
    hit() { this.stumble = 1.0; this.inv = 1.7; this.hits++; }
    take(o) { if (o.kind === 'fish') { this.boost = Math.max(this.boost, 1.3); this.dist += 40; this.fish++; this.bonusPop.push('+5 m'); } else { this.boost = 3; this.inv = Math.max(this.inv, 3); this.dist += 160; this.bobas++; this.bonusPop.push('+20 m 🧋'); } this.tk.push(o.id); if (this.tk.length > 8) this.tk.shift(); }
  }

  /* ---------- carril ---------- */
  class Lane {
    constructor(scene, idx, who, runner) {
      this.s = scene; this.idx = idx; this.who = who; this.run = runner;
      this.top = LANE_TOP[idx]; this.ground = this.top + GROUND_OFF; this.bottom = this.top + LANE_H;
      this.taken = new Set(); this.hitIds = new Set(); this.act = new Map(); this.farAct = []; this.nearAct = []; this.iOb = 0; this.iFar = 0; this.iNear = 0;
      const night = G.isNight(), g = scene.add.graphics().setDepth(0);
      A.bands(g, 0, this.top, W, GROUND_OFF, night ? [0x0e1038, 0x3a2a8a, 0x8a4a9a] : [0x7fc8ff, 0xcdeaff, 0xfff1e6], 4);
      if (night) { for (let i = 0; i < 14; i++) g.fillStyle(0xfff7c2, 0.9).fillRect(10 + (i * 53) % 380, this.top + 4 + (i * 17) % 40, 1.5, 1.5); A.moon(scene, 346, this.top + 18, 7, 1); }
      else { g.fillStyle(0xfff3b0, 0.35).fillCircle(346, this.top + 16, 14).fillStyle(0xfff3b0).fillCircle(346, this.top + 16, 8); }
      this.clouds = [0, 1, 2].map(i => scene.add.image(60 + i * 140, this.top + 10 + (i % 2) * 14, 'k_cloud').setDepth(1).setAlpha(night ? 0.25 : 0.9));
      this.gnd = scene.add.tileSprite(0, this.ground, W, 24, 'k_ground').setOrigin(0, 0).setDepth(2);
      // sombra + corredor
      this.shadow = scene.add.ellipse(RX, this.ground + 3, 16, 4, 0x000000, 0.25).setDepth(5);
      this.puf = scene.add.image(RX - 16, this.ground, 'puf_' + who).setOrigin(0.5, 1).setDepth(6);
      this.spr = scene.add.sprite(RX, this.ground, 'char_' + who, 'l0').setOrigin(0.5, 1).setFlipX(true).setDepth(7);
      this.name = A.text(scene, 6, this.top + 3, '', 11, '#ffffff').setOrigin(0, 0).setDepth(30);
      this.pops = [];
    }
    nm() { return (this.who === 'me' ? G.state.me : G.state.partner).name || (this.who === 'me' ? 'Tú' : 'Pareja'); }
    spawn(course, scn) {
      const d = this.run.dist, s = this.s;
      course.ensure(d + W + 500);
      while (course.list[this.iOb] && course.list[this.iOb].x - d < W + 40) {
        const o = course.list[this.iOb++], sp = this.makeOb(o); if (sp) this.act.set(o.id, { o, sp });
      }
      const f = scn.far, n = scn.near;
      while (f[this.iFar] && f[this.iFar].x - d * 0.4 < W + 80) { const it = f[this.iFar++]; this.farAct.push({ it, sp: s.add.image(0, this.ground + 2, 'k_' + it.k).setOrigin(0.5, 1).setDepth(it.k === 'church' ? 2 : 1.5).setAlpha(G.isNight() ? 0.8 : 1) }); }
      while (n[this.iNear] && n[this.iNear].x - d < W + 80) { const it = n[this.iNear++]; this.nearAct.push({ it, sp: s.add.image(0, this.ground + 4, 'k_' + it.k).setOrigin(0.5, 1).setDepth(3) }); }
    }
    makeOb(o) {
      const s = this.s, gy = this.ground;
      if (this.taken.has(o.id)) return null;
      if (o.kind === 'cat') return s.add.image(0, gy, 'k_cat' + o.col).setOrigin(0.5, 1).setDepth(4);
      if (o.kind === 'stall') return s.add.image(0, gy, 'k_easel').setOrigin(0.5, 1).setDepth(4);
      if (o.kind === 'pig') return s.add.image(0, gy - o.b, 'k_pig0').setOrigin(0.5, 0).setDepth(4);
      if (o.kind === 'fish') return s.add.image(0, gy - o.b, 'k_fish').setOrigin(0.5, 1).setDepth(4);
      return s.add.image(0, gy - o.b, 'k_boba').setOrigin(0.5, 1).setDepth(4);
    }
    /* colisiones (solo para quien simula: yo o el bot) */
    collide() {
      const r = this.run, hh = r.duck ? 15 : 26, lo = r.y + 2, hi = r.y + hh - 1;
      this.act.forEach(({ o }, id) => {
        const sx = RX + (o.x - r.dist), df = DEFS[o.kind];
        if (sx < RX - 14 || sx > RX + 14 || this.hitIds.has(id)) return;
        if (Math.abs(sx - RX) > df.w / 2 + 4) return;
        const ob = o.b, ot = o.b + df.h;
        if (hi < ob + 1 || lo > ot - 1) return;
        this.hitIds.add(id);
        if (df.hurt) { if (r.inv <= 0) { r.hit(); this.s.onHit(this); } }
        else { r.take(o); this.taken.add(id); this.s.onTake(this, o); }
      });
    }
    render(t, ms) {
      const r = this.run, d = r.dist;
      this.gnd.tilePositionX = d;
      this.clouds.forEach((c, i) => { c.x = ((60 + i * 140 - d * 0.08) % 480 + 480) % 480 - 40; });
      this.farAct = this.farAct.filter(a => { const x = a.it.x - d * 0.4; a.sp.x = Math.round(x); if (x < -90) { a.sp.destroy(); return false; } return true; });
      this.nearAct = this.nearAct.filter(a => { const x = a.it.x - d; a.sp.x = Math.round(x); if (x < -90) { a.sp.destroy(); return false; } return true; });
      this.act.forEach((a, id) => {
        const x = RX + (a.o.x - d), sp = a.sp;
        if (x < -40 || this.taken.has(id)) { sp.destroy(); this.act.delete(id); return; }
        sp.x = Math.round(x);
        if (a.o.kind === 'cat') sp.y = this.ground - (Math.floor(ms / 150 + id) % 2);
        else if (a.o.kind === 'pig') { sp.setTexture('k_pig' + (Math.floor(ms / 140 + id) % 2)); sp.y = this.ground - a.o.b - 8 + Math.sin(ms / 220 + id) * 1.5; }
        else if (a.o.kind === 'fish' || a.o.kind === 'boba') sp.y = this.ground - a.o.b + Math.sin(ms / 200 + id) * 1.5;
      });
      // corredor
      const blink = r.inv > 0 && Math.floor(ms / 90) % 2 === 0, stepF = [1, 0, 2, 0][Math.floor(d / 14) % 4], air = r.y > 0.5;
      this.spr.setFrame('l' + (air ? 2 : stepF)).setY(this.ground - Math.round(r.y)).setScale(1, r.duck ? 0.62 : 1).setAlpha(blink ? 0.35 : 1).setTint(r.boost > 0 ? 0xfff0a0 : 0xffffff);
      if (r.stumble > 0) this.spr.setAngle(Math.sin(ms / 40) * 6); else this.spr.setAngle(0);
      this.shadow.setScale(1 - Math.min(0.5, r.y / 90), 1).setAlpha(0.25 * (1 - Math.min(0.6, r.y / 80)));
      const pbob = r.y > 0 ? 0 : Math.abs(Math.sin(ms / 70)) * 3;
      this.puf.setPosition(RX - 17 - (r.stumble > 0 ? 4 : 0), this.ground - Math.round(r.y * 0.8) - pbob).setAlpha(blink ? 0.4 : 1);
      this.name.setText(this.nm() + '  ' + meters(d) + ' m');
      r.bonusPop.splice(0).forEach(txt => this.pop(txt, '#ffd24a'));
      this.pops = this.pops.filter(p => p.t.active);
    }
    pop(txt, col) { const t = A.text(this.s, RX + 14, this.ground - 40, txt, 12, col || '#fff').setDepth(40); this.s.tweens.add({ targets: t, y: t.y - 18, alpha: 0, duration: 900, onComplete: () => t.destroy() }); this.pops.push({ t }); }
  }

  /* ================= ESCENA ================= */
  class KennedyScene extends Phaser.Scene {
    constructor() { super('kennedy'); }
    create() {
      A.emoteTextures(this.game); G.refreshTextures(); makeTextures(this);
      this.phase = 'lobby'; this.dur = 120; this.ready = { me: false, partner: false }; this.t = 0; this.sendT = 0; this.finals = { me: null, partner: null }; this.ui = [];
      this.jumpBuf = 0; this.held = false; this.duckKey = false; this.resolved = false;
      this.keys = this.input.keyboard.addKeys({ up: 'UP', w: 'W', space: 'SPACE', down: 'DOWN', s: 'S' }, false);
      const jump = () => { if (!G.typing && !G.modalOpen) { this.jumpBuf = 0.14; } };
      this.input.keyboard.on('keydown-UP', jump); this.input.keyboard.on('keydown-W', jump); this.input.keyboard.on('keydown-SPACE', jump);
      this.input.on('pointerdown', () => { if (this.phase === 'play') { this.jumpBuf = 0.14; this.ptr = true; } });
      this.input.on('pointerup', () => { this.ptr = false; });
      this.input.keyboard.on('keydown-ESC', () => { if (this.phase !== 'play') G.flow.openMap(); });
      const net = G.net;
      this.nets = [
        ['k_dur', d => { this.dur = d.dur; this.drawLobby(); }], ['k_ready', d => { this.ready.partner = !!d.r; this.drawLobby(); this.tryStart(); }],
        ['k_go', d => { if (this.phase === 'lobby') this.startRace(d.seed, d.dur); }],
        ['k_pos', d => this.onPos(d)], ['k_end', d => { this.finals.partner = d.dist; this.tryResolve(); }],
        ['k_again', () => this.scene.restart()]
      ];
      this.nets.forEach(([t, f]) => (net.handlers[t] = net.handlers[t] || []).push(f));
      this.events.once('shutdown', () => { this.nets.forEach(([t, f]) => { net.handlers[t] = (net.handlers[t] || []).filter(x => x !== f); }); });
      this.buildSet();
      if (Q.get('kdur')) this.dur = +Q.get('kdur') || this.dur;
      this.drawLobby(); this.send('k_dur', { dur: this.dur });
      this.lobbyT = this.time.addEvent({ delay: 1200, loop: true, callback: () => { if (this.phase === 'lobby') { this.send('k_dur', { dur: this.dur }); this.send('k_ready', { r: this.ready.me }); } } });
      if (G.solo && Q.get('kauto') === '1') this.time.delayedCall(600, () => { this.ready.me = true; this.tryStart(); });
    }
    send(t, d) { if (G.net.connected) G.net.send(t, d); }

    /* decorado fijo: carriles + separador */
    buildSet() {
      const g = this.add.graphics().setDepth(0); A.bands(g, 0, 0, W, H, [0x140a3a, 0x3b1f6e], 6);
      this.lanes = [];
      this.me = new Runner(); this.pa = new Runner();
      this.laneP = new Lane(this, 0, 'partner', this.pa); this.laneM = new Lane(this, 1, 'me', this.me);
      const sep = this.add.graphics().setDepth(20); sep.setDepth(20).fillStyle(0x2b1b30).fillRect(0, LANE_TOP[0] + LANE_H, W, LANE_TOP[1] - LANE_TOP[0] - LANE_H).fillRect(0, LANE_TOP[1] + LANE_H, W, 6).fillRect(0, 16, W, 6);
      sep.fillStyle(0xff7aa8).fillRect(0, LANE_TOP[1] - 2, W, 1).fillRect(0, LANE_TOP[0] + LANE_H + 1, W, 1);
      this.clock = A.text(this, 200, 122, '', 12, '#ffd24a').setDepth(30);
      this.lead = A.text(this, 330, 122, '', 10, '#ffffff').setDepth(30);
      this.title = A.text(this, 70, 122, 'Parque Kennedy · Miraflores', 10, '#fff3d6').setDepth(30);
      if (G.isNight()) this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a6a, 0.16).setDepth(900);
    }

    /* ---------- lobby ---------- */
    drawLobby() {
      this.ui.forEach(o => o.destroy()); this.ui = []; if (this.phase !== 'lobby') return;
      const add = o => { this.ui.push(o); return o; }, D = 100;
      const pg = add(this.add.graphics().setDepth(D)); pg.fillStyle(0x2b1b30, 1).fillRoundedRect(40, 28, 320, 168, 8).lineStyle(2, 0xffd24a).strokeRoundedRect(40, 28, 320, 168, 8);
      add(A.text(this, 200, 44, '🐈 CARRERA DE GATOS', 17, '#ffd24a').setDepth(D + 1));
      add(this.add.text(200, 60, 'Salta gatos y cuadros de la feria, agáchate ante las palomas, junta pescaditos y bubble tea. Chocar te hace tropezar. ¡Gana quien más metros haga!', { fontFamily: 'VT323', fontSize: '11px', color: '#fff3d6', align: 'center', lineSpacing: -2, wordWrap: { width: 296 } }).setOrigin(0.5, 0).setDepth(D + 1));
      add(this.add.text(200, 92, '↑ / W / Espacio / click = saltar     ↓ / S = agacharse', { fontFamily: 'VT323', fontSize: '12px', color: '#9fe0cf' }).setOrigin(0.5, 0).setDepth(D + 1));
      add(this.add.text(200, 108, 'Duración de la carrera:', { fontFamily: 'VT323', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5, 0).setDepth(D + 1));
      const opts = [[120, '2 min'], [180, '3 min'], [300, '5 min']];
      if (Q.get('kdur')) opts.unshift([+Q.get('kdur'), Q.get('kdur') + ' s']);
      opts.forEach(([v, lb], i) => {
        const x = 200 + (i - (opts.length - 1) / 2) * 76; this.btn(add, x, 132, 68, 20, lb, this.dur === v ? 0xffd24a : 0xbfeaff, () => { this.dur = v; this.send('k_dur', { dur: v }); this.drawLobby(); }, D);
      });
      const me = G.state.me.name || 'Tú', pn = G.state.partner.name || 'Pareja';
      this.btn(add, 140, 168, 110, 22, this.ready.me ? '✔ ¡Listo!' : '¡Estoy listo!', this.ready.me ? 0x7fd1ae : 0xff7aa8, () => { this.ready.me = !this.ready.me; this.send('k_ready', { r: this.ready.me }); this.drawLobby(); this.tryStart(); }, D);
      add(this.add.text(222, 160, (G.solo ? pn + ' (bot) 🤖: listo' : pn + (this.ready.partner ? ': ✔ listo' : ': esperando…')) + '\n' + me + (this.ready.me ? ': ✔ listo' : ''), { fontFamily: 'VT323', fontSize: '12px', color: '#fff3d6', lineSpacing: -1 }).setOrigin(0, 0).setDepth(D + 1));
      this.btn(add, 328, 38, 56, 14, '◀ Mapa', 0xffffff, () => G.flow.openMap(), D, 10);
    }
    btn(add, x, y, w, h, label, color, fn, depth, fs) {
      const g = add(this.add.graphics().setDepth(depth + 1)); g.fillStyle(0x2b1b30).fillRoundedRect(x - w / 2 + 1, y - h / 2 + 3, w, h, 4).fillStyle(color).fillRoundedRect(x - w / 2, y - h / 2, w, h, 4).lineStyle(1.5, 0x2b1b30).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 4);
      add(this.add.text(x, y, label, { fontFamily: 'VT323', fontSize: (fs || 14) + 'px', color: '#2b1b30' }).setOrigin(0.5).setDepth(depth + 2));
      add(this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(depth + 3).on('pointerdown', () => { G.audio.sfx('click'); fn(); }));
    }
    tryStart() {
      if (this.phase !== 'lobby' || !this.ready.me) return;
      if (G.solo) { this.startRace(Math.floor(Math.random() * 2 ** 31), this.dur); return; }
      if (this.ready.partner && G.net.role === 'host') { const seed = Math.floor(Math.random() * 2 ** 31); this.send('k_go', { seed, dur: this.dur }); this.startRace(seed, this.dur); }
    }

    /* ---------- carrera ---------- */
    startRace(seed, dur) {
      this.phase = 'count'; this.dur = dur; this.ui.forEach(o => o.destroy()); this.ui = [];
      this.course = new Course(seed); this.scn = { far: sceneryList(seed, true), near: sceneryList(seed, false) };
      this.me.reset(); this.pa.reset(); this.t = 0; this.cd = 3.2; this.bot = G.solo ? { next: 0, t: 0 } : null;
      this.paT = { dist: 0, y: 0, duck: false, st: 0, v: 95 };
      this.cdTxt = A.text(this, 200, 112, '3', 40, '#ffffff').setDepth(200);
      this.lobbyT && this.lobbyT.remove();
    }
    onPos(d) {
      const p = this.pa; this.paT = d;
      if (this.phase !== 'play' && this.phase !== 'count') return;
      if (d.tk) d.tk.forEach(id => { if (!this.laneP.taken.has(id)) this.laneP.taken.add(id); });
    }
    onHit(lane) {
      G.audio.sfx('hit'); if (lane === this.laneM) { this.cameras.main.shake(180, 0.006); this.laneM.pop('¡Ouch! 😿', '#ff9fb0'); }
    }
    onTake(lane, o) { if (lane === this.laneM) G.audio.sfx(o.kind === 'boba' ? 'heart' : 'pop'); }

    update(time, dtMs) {
      const dt = Math.min(0.05, dtMs / 1000);
      if (this.phase === 'lobby') { this.laneM.render(0, time); this.laneP.render(0, time); this.runIdle(time); return; }
      if (this.phase === 'count') {
        this.cd -= dt; const n = Math.ceil(this.cd - 0.2);
        this.cdTxt.setText(n > 0 ? String(n) : '¡YA!'); this.runIdle(time);
        this.clock.setText(fmt(this.dur));
        if (this.cd <= 0) { this.phase = 'play'; this.cdTxt.destroy(); this.t = 0; G.audio.sfx('ok'); }
        return;
      }
      if (this.phase === 'play' || this.phase === 'ended') this.tick(dt, time);
    }
    runIdle(time) { this.spawnBoth(); this.laneM.render(0, time); this.laneP.render(0, time); }
    spawnBoth() { if (!this.course) return; this.laneM.spawn(this.course, this.scn); this.laneP.spawn(this.course, this.scn); }

    tick(dt, time) {
      const K = this.keys, me = this.me;
      if (this.phase === 'play') {
        this.t += dt; this.jumpBuf = Math.max(0, this.jumpBuf - dt);
        const held = K.up.isDown || K.w.isDown || K.space.isDown || this.ptr;
        const inp = { jump: this.jumpBuf > 0, held, duck: K.down.isDown || K.s.isDown, onJump: () => { G.audio.sfx('click'); } };
        if (inp.jump && me.y <= 0.5) this.jumpBuf = 0;
        me.sim(dt, this.t, inp); this.laneM.spawn(this.course, this.scn); this.laneM.collide();
        // pareja
        if (this.bot) this.simBot(dt); else this.ghost(dt);
        this.laneP.spawn(this.course, this.scn);
        this.sendT += dt; if (this.sendT > 0.075) { this.sendT = 0; this.send('k_pos', { dist: me.dist, y: me.y, duck: me.duck, st: me.stumble > 0, inv: me.inv > 0, v: me.v, tk: me.tk }); }
        if (this.t >= this.dur) this.finish();
      } else { this.laneM.spawn(this.course, this.scn); me.v = 0; if (this.bot) this.simBot(dt, true); else this.ghost(dt); this.laneP.spawn(this.course, this.scn); }
      this.laneM.render(this.t, time); this.laneP.render(this.t, time);
      const rem = Math.max(0, this.dur - this.t); this.clock.setText(this.phase === 'ended' ? '¡TIEMPO!' : fmt(rem)).setColor(rem < 10 && this.phase === 'play' ? '#ff6b6b' : '#ffd24a');
      const diff = meters(me.dist) - meters(this.pa.dist), who = diff >= 0 ? G.state.me.name : G.state.partner.name;
      this.lead.setText(diff === 0 ? 'Empatados' : 'Ventaja: ' + (who || '') + ' +' + Math.abs(diff) + ' m');
    }
    ghost(dt) {
      const p = this.pa, T = this.paT || {};
      p.dist += (T.v || p.v) * dt; if (T.dist !== undefined) p.dist += (T.dist + (T.v || 0) * 0.05 - p.dist) * Math.min(1, dt * 6);
      p.y += ((T.y || 0) - p.y) * Math.min(1, dt * 16); p.duck = !!T.duck; p.stumble = T.st ? 0.5 : 0; p.inv = T.inv ? 0.5 : 0; p.v = T.v || p.v;
    }
    simBot(dt, idle) {                         // pareja simulada (solo en modo prueba)
      const b = this.bot, p = this.pa, lane = this.laneP; b.t += dt;
      let jump = false, duck = false;
      this.course.list.forEach(o => { const dx = o.x - p.dist; if (dx > 0 && dx < p.v * 0.22 + 8 && DEFS[o.kind].hurt && !lane.hitIds.has(o.id) && !(b['s' + o.id])) { b['s' + o.id] = Math.random() < 0.82 ? 1 : 2; } if (b['s' + o.id] === 1 && dx > 0 && dx < p.v * 0.2 + 6) { if (o.kind === 'pig') duck = true; else jump = true; } });
      p.sim(dt, idle ? 0 : this.t, { jump, held: jump, duck }); lane.collide();
    }
    finish() {
      this.phase = 'ended'; this.finals.me = Math.round(this.me.dist); this.send('k_end', { dist: this.finals.me });
      if (this.bot) this.finals.partner = Math.round(this.pa.dist + this.pa.v * 0.2);
      this.endTxt = A.text(this, 200, 112, '¡TIEMPO!', 26, '#ffffff').setDepth(200);
      this.time.delayedCall(5500, () => { if (!this.resolved && this.finals.partner === null) { this.finals.partner = Math.round(this.pa.dist); this.tryResolve(); } });
      this.tryResolve();
    }
    tryResolve() {
      if (this.resolved || this.finals.me === null || this.finals.partner === null) return;
      this.resolved = true; this.time.delayedCall(900, () => this.showResult());
    }

    /* ---------- resultado ---------- */
    showResult() {
      this.endTxt && this.endTxt.destroy(); this.phase = 'result';
      const f = this.finals, myId = G.state.me.id, paId = G.state.partner.id, D = 300;
      const mM = meters(f.me), mP = meters(f.partner), tie = mM === mP;
      const winnerId = tie ? null : (mM > mP ? myId : paId), winName = winnerId === myId ? G.state.me.name : G.state.partner.name;
      // premio: lo aplica solo quien manda (anfitrión) o el modo solo, para no duplicar
      if (winnerId && (G.solo || G.net.role === 'host')) { G.addSoles(winnerId, PRIZE); G.recordWin('kennedy', winnerId, winnerId === myId ? mM : mP); }
      else if (!winnerId && (G.solo || G.net.role === 'host')) G.recordWin('kennedy', null, 0);
      if (winnerId === myId) { const lk = G.state.me.look; lk.acc = lk.acc || {}; lk.acc.boba = true; G.state.session.boba[myId] = true; G.save(); G.bus.emit('look'); }
      else if (winnerId) G.state.session.boba[paId] = true;
      G.audio.sfx(winnerId ? 'win' : 'ok');
      const g = this.add.graphics().setDepth(D); g.fillStyle(0x2b1b30, 1).fillRoundedRect(50, 30, 300, 164, 8).lineStyle(2, 0xffd24a).strokeRoundedRect(50, 30, 300, 164, 8);
      A.text(this, 200, 48, tie ? '¡EMPATE!' : '🏆 ¡GANÓ ' + String(winName || '').toUpperCase() + '!', 18, '#ffd24a').setDepth(D + 1);
      const row = (y, nm, m, w, best) => this.add.text(200, y, nm + ':  ' + m + ' m' + (w ? '  👑' : ''), { fontFamily: 'VT323', fontSize: '16px', color: w ? '#ffd24a' : '#fff3d6' }).setOrigin(0.5).setDepth(D + 1);
      row(76, G.state.me.name || 'Tú', mM, mM > mP); row(94, G.state.partner.name || 'Pareja', mP, mP > mM);
      const st = this.add.text(200, 112, 'Pescaditos: ' + this.me.fish + ' · Tropiezos: ' + this.me.hits + '  (tuyos)', { fontFamily: 'VT323', fontSize: '12px', color: '#9fe0cf' }).setOrigin(0.5).setDepth(D + 1);
      const rec = G.state.records.best.kennedy || {};
      this.add.text(200, 126, tie ? 'Nadie gana soles esta vez.' : '+ S/ ' + PRIZE + ' para ' + winName + ' · 🧋 bubble tea de accesorio (esta sesión)', { fontFamily: 'VT323', fontSize: '13px', color: '#ffd1e0' }).setOrigin(0.5).setDepth(D + 1);
      this.add.text(200, 140, 'Récord: ' + (G.state.me.name || 'Tú') + ' ' + (rec[myId] || 0) + ' m · ' + (G.state.partner.name || 'Pareja') + ' ' + (rec[paId] || 0) + ' m', { fontFamily: 'VT323', fontSize: '12px', color: '#c9b8ff' }).setOrigin(0.5).setDepth(D + 1);
      const add = o => o;
      this.btn(add, 150, 172, 92, 22, '↻ Revancha', 0xffd24a, () => { this.send('k_again', {}); this.scene.restart(); }, D);
      this.btn(add, 250, 172, 92, 22, '◀ Al mapa', 0xff7aa8, () => G.flow.openMap(), D);
      if (winnerId) for (let i = 0; i < 16; i++) { const h = this.add.graphics().setDepth(D + 0.5); A.heart(h, 0, 0, 3 + (i % 3), [0xff5d97, 0xffd24a, 0x7fd1ae, 0xb07cff][i % 4]); h.x = 70 + Math.random() * 260; h.y = 20; this.tweens.add({ targets: h, y: 215, x: h.x + (Math.random() * 40 - 20), alpha: { from: 1, to: 0.2 }, duration: 1800 + Math.random() * 1400, delay: i * 90, repeat: -1 }); }
    }
  }
  G.KennedyScene = KennedyScene;
})();
