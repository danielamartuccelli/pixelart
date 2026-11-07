/* ===========================================================
   kitchen_sim.js — ETAPA 5 · LOS CCELLIS · lógica pura del ramen cooperativo
   (sin Phaser: se puede probar con Node). El ANFITRIÓN simula; el invitado solo dibuja
   el estado que recibe (snapshot).
   Mapa: 25 x 10 baldosas de 16 px.
     # pared · . piso · 1/2 salida de cocinero 1 (anfitrión) / 2 (invitado)
     f fideos · h hongos · e huevos · b tocino · a ají · r harina · s salsa   (cajones infinitos)
     p platos · o olla · t tabla de cortar · n sartén · x sobre de picante · m amasadora
     k caldero de caldo · v ventanilla · z basurero · c mesa · P pase (mesa en la pared que une dos lados)
   =========================================================== */
(function (root) {
  const G = root.G = root.G || {};
  const TS = 16, COLS = 25, ROWS = 10;

  /* ---------- niveles: la estructura de la cocina CAMBIA en cada uno ---------- */
  const LEVELS = [
    { name: 'Primer servicio', sub: 'Cocina abierta', dur: 120, every: 16, pat: 72, goals: [150, 260, 340], pool: ['mild', 'picante', 'hongos'],
      map: [
        '#########################',
        '#ffhhaaxcooctcppkkczz####',
        '#.......................#',
        '#.1.....................#',
        '#......cccccccc.........v',
        '#......cccccccc.........v',
        '#.....................2.#',
        '#.......................#',
        '#cccccc.......cccccccc###',
        '#########################'],
      intro: 'Cocina abierta: los dos pueden ir a todas partes. ¡Coordínense!' },
    { name: 'Hora de almuerzo', sub: 'Dos islas · tocino y segundos', dur: 135, every: 14, pat: 68, goals: [200, 340, 450], pool: ['mild', 'picante', 'hongos', 'tocino', 'segundo'],
      map: [
        '#########################',
        '#ffhhbbaasxcooctcnnppkkz#',
        '#.......................#',
        '#.1...........ccc.......#',
        '#....ccc......ccc.......v',
        '#....ccc................v',
        '#.......ccc...ccc....2..#',
        '#.......................#',
        '#cccccc.......cccccccccc#',
        '#########################'],
      intro: 'Ahora hay tocino (sartén) y SEGUNDOS: ramen saltado sin caldo, con salsa.' },
    { name: 'Cocina dividida', sub: 'Uno a cada lado · pasen por el PASE', dur: 150, every: 13, pat: 66, goals: [200, 350, 480], pool: ['picante', 'hongos', 'tocino', 'segundo', 'super'],
      map: [
        '#########################',
        '#ffooppskkcc#hbeaxttnooc#',
        '#...........#...........#',
        '#.1.........P...........#',
        'v..ccc......#......ccc..#',
        'v..ccc......#......ccc..#',
        '#...........P........2..#',
        '#...........#...........#',
        '#cccc..zcccc#ccc.....zcc#',
        '#########################'],
      intro: '¡Se partió la cocina! Uno cocina los fideos y arma; el otro prepara los toppings. Pasen todo por el PASE.' },
    { name: 'A mano', sub: 'Arriba preparan · abajo arman', dur: 150, every: 12, pat: 64, goals: [240, 420, 600], pool: ['mano', 'hongos', 'tocino', 'segundo', 'super', 'picante'],
      map: [
        '#########################',
        '#ffhbeaarxmcttcnnoocsccc#',
        '#.......................#',
        '#.1.....................#',
        '#.......................#',
        '######P###########P######',
        '#.2....................v#',
        '#......................v#',
        '#ppkkoocccczcccffcccccc##',
        '#########################'],
      intro: 'Nuevo: RAMEN A MANO. Un chef prepara arriba; el otro, abajo, arma y sirve. Pasen todo por los PASES (mesas amarillas del muro).' },
    { name: 'El gran Ccelli', sub: 'Lados invertidos · pedidos supremos', dur: 165, every: 11, pat: 62, goals: [300, 560, 800], pool: ['mild', 'picante', 'hongos', 'tocino', 'segundo', 'mano', 'super', 'ccelli', 'ccelli'],
      map: [
        '#########################',
        '#hbeaxttnoom#ffooppskkcc#',
        '#...........#...........#',
        '#.1.........P...........#',
        '#..ccc......#......ccc..v',
        '#..ccc......#......ccc..v',
        '#...........P........2..#',
        '#...........#...........#',
        '#cccr..zcccc#ccc.....zcc#',
        '#########################'],
      intro: '¡Servicio final! Todo el menú, pedidos cada vez más rápidos y el CCELLI SUPREMO. Lados invertidos.' }
  ];

  /* ---------- recetas: lo que debe tener el plato ---------- */
  const RECIPES = {
    mild:    { name: 'Ramen mild',          parts: ['fideo_c'],                       soup: true,  pts: 30 },
    picante: { name: 'Ramen picante',       parts: ['fideo_c', 'sobre1'],             soup: true,  pts: 45 },
    hongos:  { name: 'Ramen con hongos',    parts: ['fideo_c', 'hongo_c'],            soup: true,  pts: 50 },
    segundo: { name: 'Segundo (sin jugo)',  parts: ['fideo_s', 'salsa'],              soup: false, pts: 50 },
    tocino:  { name: 'Ramen con tocino',    parts: ['fideo_c', 'tocino_f'],           soup: true,  pts: 55 },
    mano:    { name: 'Ramen hecho a mano',  parts: ['fideo_f', 'huevo_m', 'salsa'],   soup: true,  pts: 85 },
    super:   { name: 'Super super picante', parts: ['fideo_c', 'huevo_m', 'sobre3'],  soup: true,  pts: 80 },
    ccelli:  { name: 'CCELLI SUPREMO',      parts: ['fideo_c', 'hongo_c', 'tocino_f', 'huevo_m', 'sobre2'], soup: true, pts: 130 }
  };
  const NOODLES = ['fideo_c', 'fideo_s', 'fideo_f'];
  const BOWL_OK = ['fideo_c', 'fideo_s', 'fideo_f', 'hongo_c', 'huevo_m', 'tocino_f', 'salsa', 'sobre1', 'sobre2', 'sobre3'];

  const CRATES = { f: 'fideo', h: 'hongo', e: 'huevo', b: 'tocino', a: 'aji', r: 'harina', s: 'salsa' };
  const KIND = { p: 'plato', o: 'olla', t: 'tabla', n: 'sarten', x: 'sobre', m: 'amasadora', k: 'caldero', v: 'vent', z: 'basurero', c: 'mesa', P: 'pase' };
  const COOK = {
    olla:   { fideo: ['fideo_c', 8], masa_cortada: ['fideo_f', 5], huevo: ['huevo_h', 9] },
    sarten: { tocino: ['tocino_f', 7], fideo_c: ['fideo_s', 5] }
  };
  const BURN = { olla: 7, sarten: 6 };
  const WORK = {
    tabla: { hongo: ['hongo_c', 2.0], huevo_h: ['huevo_m', 1.1], masa: ['masa_cortada', 2.0] },
    amasadora: { harina: ['masa', 2.6] }
  };
  const SEAL_T = 1.0, SOUP_T = 1.1;

  const isBowl = it => !!it && typeof it === 'object' && it.b === 1;
  const newBowl = () => ({ b: 1, i: [], s: 0 });
  function bowlAdd(bw, it) {
    if (!isBowl(bw) || bw.s || typeof it !== 'string' || !BOWL_OK.includes(it)) return false;
    if (bw.i.includes(it)) return false;
    if (NOODLES.includes(it) && bw.i.some(x => NOODLES.includes(x))) return false;
    if (it.startsWith('sobre') && bw.i.some(x => x.startsWith('sobre'))) return false;
    bw.i.push(it); return true;
  }
  const sig = (parts, soup) => parts.slice().sort().join('+') + (soup ? '|S' : '|');
  const bowlSig = bw => sig(bw.i, bw.s);

  /* ---------- parseo del mapa ---------- */
  function parse(map) {
    const grid = [], stations = [], spawns = {};
    for (let y = 0; y < ROWS; y++) {
      const row = map[y]; grid.push([]);
      if (row.length !== COLS) throw new Error('Mapa con ancho ' + row.length + ' en fila ' + y);
      for (let x = 0; x < COLS; x++) {
        const ch = row[x]; let kind = null, crate = null;
        if (CRATES[ch]) { kind = 'cajon'; crate = CRATES[ch]; } else if (KIND[ch]) kind = KIND[ch];
        if (ch === '1' || ch === '2') spawns[ch] = { x: x * TS + 8, y: y * TS + 14 };
        const solid = ch === '#' || !!kind;
        grid[y].push({ ch, solid, wall: ch === '#' });
        if (kind) stations.push({ id: stations.length, k: kind, crate, tx: x, ty: y, x: x * TS + 8, y: y * TS + 8, item: null, prog: 0, done: false, burn: 0, n: 0, sealed: false });
      }
    }
    return { grid, stations, spawns };
  }

  /* ---------- simulación ---------- */
  class Sim {
    constructor(levelIdx, o) {
      o = o || {};
      this.lv = Math.max(0, Math.min(LEVELS.length - 1, levelIdx | 0)); this.L = LEVELS[this.lv];
      const P = parse(this.L.map); this.grid = P.grid; this.st = P.stations; this.spawns = P.spawns;
      this.dur = o.dur || this.L.dur; this.t = 0; this.score = 0; this.served = 0; this.lost = 0; this.orders = []; this.oid = 1;
      this.nextAt = 2.5; this.over = false; this.ev = []; this.seed = (o.seed || 12345) >>> 0; this.last = null;
      const s1 = this.spawns['1'] || { x: 40, y: 60 }, s2 = this.spawns['2'] || { x: 360, y: 60 };
      this.ch = [{ x: s1.x, y: s1.y, d: 'd', held: null, down: false, work: null, wp: 0 }, { x: s2.x, y: s2.y, d: 'd', held: null, down: false, work: null, wp: 0 }];
    }
    rnd() { let a = (this.seed = (this.seed + 0x6D2B79F5) >>> 0), t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    emit(e) { this.ev.push(e); }
    drain() { const e = this.ev; this.ev = []; return e; }
    stationAt(tx, ty) { return this.st.find(s => s.tx === tx && s.ty === ty) || null; }
    solidAt(px, py) { const tx = Math.floor(px / TS), ty = Math.floor(py / TS); if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true; return this.grid[ty][tx].solid; }
    /* ¿puede estar un cocinero con los pies en (x,y)? (caja de 9x6 pies) */
    canStand(x, y) { return !(this.solidAt(x - 4.5, y - 3) || this.solidAt(x + 4.5, y - 3) || this.solidAt(x - 4.5, y) || this.solidAt(x + 4.5, y)); }
    move(i, dx, dy) {
      const c = this.ch[i];
      if (dx && this.canStand(c.x + dx, c.y)) c.x += dx;
      if (dy && this.canStand(c.x, c.y + dy)) c.y += dy;
    }
    setPos(i, x, y, d) { const c = this.ch[i]; c.x = x; c.y = y; if (d) c.d = d; }
    /* estación que el cocinero tiene enfrente */
    target(i) {
      const c = this.ch[i], v = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }[c.d] || [0, 1];
      const px = c.x + v[0] * 11, py = c.y - 5 + v[1] * 11;
      let best = null, bd = 13;
      this.st.forEach(s => { const d = Math.hypot(s.x - px, s.y - py); if (d < bd) { bd = d; best = s; } });
      return best;
    }

    /* ---------- pulsar interactuar ---------- */
    press(i) {
      const c = this.ch[i]; c.down = true; c.work = null; c.wp = 0;
      const s = this.target(i); if (!s || this.over) return;
      const h = c.held, here = { x: s.x, y: s.y };
      switch (s.k) {
        case 'cajon': if (!h) { c.held = s.crate; this.emit({ t: 'pop', ...here }); } break;
        case 'plato': if (!h) { c.held = newBowl(); this.emit({ t: 'pop', ...here }); } break;
        case 'mesa': case 'pase': this.counter(c, s); break;
        case 'olla': case 'sarten': {
          if (h && !s.item && COOK[s.k][typeof h === 'string' ? h : '']) { s.item = h; c.held = null; s.prog = 0; s.done = false; s.burn = 0; s.cook = true; this.emit({ t: 'put', ...here }); }
          else if (!h && s.item && (s.done || s.item === 'quemado')) { c.held = s.item; s.item = null; s.prog = 0; s.done = false; s.burn = 0; s.cook = false; this.emit({ t: 'pop', ...here }); }
          break;
        }
        case 'tabla': case 'amasadora': {
          if (h && !s.item && typeof h === 'string' && WORK[s.k][h]) { s.item = h; c.held = null; s.prog = 0; this.emit({ t: 'put', ...here }); }
          else if (!h && s.item) { if (WORK[s.k][s.item]) c.work = s.id; else { c.held = s.item; s.item = null; s.prog = 0; this.emit({ t: 'pop', ...here }); } }
          break;
        }
        case 'sobre': {
          if (h === 'aji' && s.n < 3 && !s.sealed) { s.n++; c.held = null; this.emit({ t: 'put', ...here }); }
          else if (!h && s.sealed) { c.held = 'sobre' + s.n; s.n = 0; s.sealed = false; this.emit({ t: 'pop', ...here }); }
          else if (!h && s.n > 0) c.work = s.id;
          break;
        }
        case 'caldero': if (isBowl(h) && !h.s && h.i.some(x => NOODLES.includes(x))) c.work = s.id; else if (h) this.emit({ t: 'bad', ...here, msg: isBowl(h) ? 'Falta el fideo' : 'Solo platos' }); break;
        case 'vent': if (isBowl(h)) this.serve(c, s); else if (h) this.emit({ t: 'bad', ...here, msg: 'Solo platos' }); break;
        case 'basurero': if (h) { c.held = null; this.emit({ t: 'trash', ...here }); } break;
      }
    }
    release(i) { const c = this.ch[i]; c.down = false; c.work = null; c.wp = 0; }

    counter(c, s) {
      const h = c.held, it = s.item, here = { x: s.x, y: s.y };
      if (!h && it) { c.held = it; s.item = null; this.emit({ t: 'pop', ...here }); }
      else if (h && !it) { s.item = h; c.held = null; this.emit({ t: 'put', ...here }); }
      else if (h && it) {
        if (isBowl(it) && !isBowl(h) && bowlAdd(it, h)) { c.held = null; this.emit({ t: 'add', ...here }); }
        else if (isBowl(h) && !isBowl(it) && bowlAdd(h, it)) { s.item = null; this.emit({ t: 'add', ...here }); }
        else this.emit({ t: 'bad', ...here, msg: '' });
      }
    }

    serve(c, s) {
      const bw = c.held, sg = bowlSig(bw), here = { x: s.x, y: s.y };
      const cand = this.orders.filter(o => sig(RECIPES[o.r].parts, RECIPES[o.r].soup) === sg).sort((a, b) => (a.t0 + a.pat) - (b.t0 + b.pat));
      if (!cand.length) { this.emit({ t: 'bad', ...here, msg: '¡Nadie pidió eso!' }); return; }
      const o = cand[0], left = Math.max(0, o.t0 + o.pat - this.t), bonus = Math.round(left / o.pat * 18), pts = RECIPES[o.r].pts + bonus;
      this.orders.splice(this.orders.indexOf(o), 1); c.held = null; this.score += pts; this.served++;
      this.emit({ t: 'serve', ...here, pts, bonus, r: o.r });
    }

    /* ---------- reloj ---------- */
    tick(dt) {
      if (this.over) return;
      this.t += dt;
      // estaciones que cocinan solas
      this.st.forEach(s => {
        if ((s.k === 'olla' || s.k === 'sarten') && s.item && s.cook) {
          const rule = COOK[s.k][s.item];
          if (rule && !s.done) { s.prog += dt / rule[1]; if (s.prog >= 1) { s.item = rule[0]; s.done = true; s.prog = 1; s.burn = 0; this.emit({ t: 'ding', x: s.x, y: s.y }); } }
          else if (s.done && s.item !== 'quemado') { s.burn += dt; if (s.burn > BURN[s.k] * 0.6 && !s.warn) { s.warn = true; this.emit({ t: 'warn', x: s.x, y: s.y }); } if (s.burn >= BURN[s.k]) { s.item = 'quemado'; s.warn = false; this.emit({ t: 'burn', x: s.x, y: s.y }); } }
          if (!s.item || s.item !== 'quemado') { /* nada */ }
        }
        if (!s.item) s.warn = false;
      });
      // trabajos que se mantienen pulsando
      this.ch.forEach((c, i) => {
        if (c.work === null || !c.down) { c.work = c.down ? c.work : null; return; }
        const s = this.st[c.work], tgt = this.target(i);
        if (!s || tgt !== s) { c.work = null; c.wp = 0; return; }
        if (s.k === 'tabla' || s.k === 'amasadora') {
          const rule = s.item && WORK[s.k][s.item]; if (!rule) { c.work = null; return; }
          s.prog += dt / rule[1]; c.wp = s.prog; if (Math.random() < 0.15) this.emit({ t: 'chop', x: s.x, y: s.y });
          if (s.prog >= 1) { s.item = rule[0]; s.prog = 0; c.work = null; c.wp = 0; c.down = false; this.emit({ t: 'ding', x: s.x, y: s.y }); }
        } else if (s.k === 'sobre') {
          s.prog += dt / SEAL_T; c.wp = s.prog;
          if (s.prog >= 1) { s.sealed = true; s.prog = 0; c.work = null; c.wp = 0; c.down = false; this.emit({ t: 'ding', x: s.x, y: s.y }); }
        } else if (s.k === 'caldero') {
          const bw = c.held; if (!isBowl(bw)) { c.work = null; return; }
          c.wp += dt / SOUP_T;
          if (c.wp >= 1) { bw.s = 1; c.work = null; c.wp = 0; c.down = false; this.emit({ t: 'ding', x: s.x, y: s.y }); }
        }
      });
      // pedidos
      for (let k = this.orders.length - 1; k >= 0; k--) {
        const o = this.orders[k];
        if (this.t >= o.t0 + o.pat) { this.orders.splice(k, 1); this.lost++; this.score = Math.max(0, this.score - 10); this.emit({ t: 'lost', r: o.r }); }
      }
      if (this.t >= this.nextAt && this.t < this.dur - 14 && this.orders.length < 5) this.newOrder();
      if (this.t >= this.dur) { this.over = true; this.ch.forEach(c => { c.down = false; c.work = null; }); this.emit({ t: 'end' }); }
    }
    newOrder() {
      const pool = this.L.pool; let r, tries = 0;
      do { r = pool[Math.floor(this.rnd() * pool.length)]; tries++; } while (r === this.last && tries < 4);
      this.last = r;
      const ramp = Math.max(0.72, 1 - (this.t / this.dur) * 0.28);        // los pedidos se aceleran
      this.orders.push({ id: this.oid++, r, t0: this.t, pat: this.L.pat + (RECIPES[r].parts.length - 1) * 5 });
      this.nextAt = this.t + this.L.every * ramp * (0.85 + this.rnd() * 0.3);
      this.emit({ t: 'order', r });
    }
    stars() { const g = this.L.goals; return this.score >= g[2] ? 3 : this.score >= g[1] ? 2 : this.score >= g[0] ? 1 : 0; }

    /* ---------- red ---------- */
    snapshot() {
      return {
        t: +this.t.toFixed(2), sc: this.score, sv: this.served, ls: this.lost, ov: this.over ? 1 : 0, dur: this.dur,
        or: this.orders.map(o => [o.id, o.r, +o.t0.toFixed(2), o.pat]),
        st: this.st.map(s => s.item === null && !s.n && !s.sealed && !s.prog ? 0 : [s.item, +s.prog.toFixed(2), s.done ? 1 : 0, +s.burn.toFixed(1), s.n, s.sealed ? 1 : 0, s.cook ? 1 : 0, s.warn ? 1 : 0]),
        ch: this.ch.map(c => [c.held, c.work === null ? -1 : c.work, +(c.wp || 0).toFixed(2)]),
        ev: this.drain()
      };
    }
    applySnapshot(S, keepChef) {
      this.t = S.t; this.score = S.sc; this.served = S.sv; this.lost = S.ls; this.over = !!S.ov; this.dur = S.dur;
      this.orders = S.or.map(a => ({ id: a[0], r: a[1], t0: a[2], pat: a[3] }));
      S.st.forEach((a, i) => { const s = this.st[i]; if (!a) { s.item = null; s.prog = 0; s.done = false; s.burn = 0; s.n = 0; s.sealed = false; s.cook = false; s.warn = false; } else { s.item = a[0]; s.prog = a[1]; s.done = !!a[2]; s.burn = a[3]; s.n = a[4]; s.sealed = !!a[5]; s.cook = !!a[6]; s.warn = !!a[7]; } });
      S.ch.forEach((a, i) => { this.ch[i].held = a[0]; this.ch[i].work = a[1] < 0 ? null : a[1]; this.ch[i].wp = a[2]; });
      return S.ev || [];
    }
  }

  G.K = { TS, COLS, ROWS, LEVELS, RECIPES, NOODLES, BOWL_OK, COOK, BURN, WORK, isBowl, newBowl, bowlAdd, bowlSig, sig, parse, Sim };
  if (typeof module !== 'undefined') module.exports = G.K;
})(typeof window !== 'undefined' ? window : globalThis);
