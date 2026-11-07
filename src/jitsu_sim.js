/* ===========================================================
   jitsu_sim.js — lógica PURA de Card-jitsu (estilo Avatar). Se puede probar con Node.
   Elementos: 0 FUEGO · 1 AGUA · 2 TIERRA · 3 AIRE
   Quién vence a quién (ciclo): Agua > Fuego > Aire > Tierra > Agua.
   Los elementos opuestos (Fuego–Tierra, Agua–Aire) y los iguales se resuelven por PODER (1 a 8).
   Empate de poder: nadie se lleva la carta.
   Cada jugador recibe el MISMO mazo de 32 cartas (4 elementos x poderes 1–8) mezclado distinto; mano de 5.
   Chi ⚡: UNA vez por partida puedes potenciar tu carta (+4 de poder) sin que el otro lo sepa hasta que se revela.
   Gana quien junta 3 cartas del MISMO elemento o 3 elementos DISTINTOS. Si se acaban las cartas: más cartas ganadas,
   luego más poder total; si sigue igual, empate.
   Ambos clientes simulan lo mismo desde la misma semilla: solo se intercambian las cartas elegidas.
   =========================================================== */
(function () {
  const root = (typeof window !== 'undefined' ? window : global);
  const G = root.G = root.G || {};
  const J = G.J = {};
  J.ELEMS = ['Fuego', 'Agua', 'Tierra', 'Aire'];
  J.BEATS = { 0: 3, 1: 0, 2: 1, 3: 2 };           // e vence a BEATS[e]
  J.CHI = 4; J.HAND = 5; J.POW = 8;
  /* bufandas: puntos acumulados permanentes (victoria +3, derrota +1) */
  J.BELTS = [
    { pts: 0,  name: 'Aprendiz',      color: '#f4f0e6', hex: 0xf4f0e6 },
    { pts: 3,  name: 'Aire',          color: '#ffd24a', hex: 0xffd24a },
    { pts: 8,  name: 'Agua',          color: '#3a86ff', hex: 0x3a86ff },
    { pts: 15, name: 'Tierra',        color: '#4fa84a', hex: 0x4fa84a },
    { pts: 25, name: 'Fuego',         color: '#e63946', hex: 0xe63946 },
    { pts: 40, name: 'Maestro Avatar', color: '#ffe58a', hex: 0x2b1b30 }
  ];
  J.beltOf = pts => { let k = 0; J.BELTS.forEach((b, i) => { if (pts >= b.pts) k = i; }); return k; };

  function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(arr, r) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }

  /* resultado de enfrentar la carta a (poder pa) contra b: 1 gana a · 2 gana b · 0 empate */
  J.clash = function (a, b) {
    if (a.e !== b.e) { if (J.BEATS[a.e] === b.e) return 1; if (J.BEATS[b.e] === a.e) return 2; }
    if (a.p > b.p) return 1; if (b.p > a.p) return 2; return 0;
  };
  /* ¿cumple la condición de victoria? (won = lista de {e,p}) */
  J.hasWon = function (won) {
    const n = [0, 0, 0, 0]; won.forEach(c => n[c.e]++);
    return n.some(x => x >= 3) || n.filter(x => x > 0).length >= 3;
  };

  /* jugadores 1 y 2 (Sebas = 1, Dani = 2) */
  function Sim(seed) {
    const r = rng(seed); this.decks = {}; this.hand = {}; this.won = { 1: [], 2: [] }; this.chi = { 1: true, 2: true }; this.round = 0; this.log = []; this.over = null;
    const full = []; for (let e = 0; e < 4; e++) for (let p = 1; p <= J.POW; p++) full.push({ e, p, id: e * 10 + p });
    [1, 2].forEach(pl => { this.decks[pl] = shuffle(full.map(c => Object.assign({}, c)), r); this.hand[pl] = this.decks[pl].splice(0, J.HAND); });
  }
  /* juega la ronda: i1,i2 = índices en la mano (0..4); c1,c2 = ¿usó Chi? Devuelve el resultado de la ronda */
  Sim.prototype.play = function (i1, i2, c1, c2) {
    if (this.over) return null;
    const pick = { 1: [i1, !!c1], 2: [i2, !!c2] }, card = {}, pw = {};
    [1, 2].forEach(pl => {
      let i = pick[pl][0]; if (!(i >= 0 && i < this.hand[pl].length)) i = 0;
      pick[pl][0] = i; card[pl] = this.hand[pl][i];
      const chi = pick[pl][1] && this.chi[pl]; pick[pl][1] = chi; if (chi) this.chi[pl] = false;
      pw[pl] = { e: card[pl].e, p: card[pl].p + (chi ? J.CHI : 0) };
    });
    const res = J.clash(pw[1], pw[2]); this.round++;
    [1, 2].forEach(pl => { this.hand[pl].splice(pick[pl][0], 1); if (this.decks[pl].length) this.hand[pl].push(this.decks[pl].shift()); });
    const winner = res; if (winner) this.won[winner].push({ e: card[winner].e, p: card[winner].p });
    const out = { round: this.round, card, pw, chi: { 1: pick[1][1], 2: pick[2][1] }, winner, over: null };
    if (winner && J.hasWon(this.won[winner])) this.over = out.over = { winner, why: 'elementos' };
    else if (!this.hand[1].length || !this.hand[2].length) {
      const cnt = pl => this.won[pl].length, pwr = pl => this.won[pl].reduce((s, c) => s + c.p, 0);
      const w = cnt(1) !== cnt(2) ? (cnt(1) > cnt(2) ? 1 : 2) : (pwr(1) !== pwr(2) ? (pwr(1) > pwr(2) ? 1 : 2) : 0);
      this.over = out.over = { winner: w, why: 'cartas' };
    }
    this.log.push(out); return out;
  };

  /* IA de la pareja simulada: elige índice de mano (+ Chi) sin ver la mano del otro, pero sí sus cartas ganadas */
  J.botPick = function (sim, pl, level, rnd) {
    rnd = rnd || Math.random; const hand = sim.hand[pl], me = sim.won[pl], op = sim.won[3 - pl];
    const nOp = [0, 0, 0, 0], nMe = [0, 0, 0, 0]; op.forEach(c => nOp[c.e]++); me.forEach(c => nMe[c.e]++);
    if (level === 'facil') return { i: Math.floor(rnd() * hand.length), chi: false };
    let best = -1e9, bi = 0;
    hand.forEach((c, i) => {
      let v = 0;
      // necesito elementos nuevos o repetir el que llevo
      const have = nMe.filter(x => x > 0).length;
      v += nMe[c.e] === 0 ? (have >= 2 ? 6 : 3) : (nMe[c.e] === 2 ? 7 : 2);
      // la mano del rival es desconocida: un poder medio-alto vale más; cartas flojas se "sacrifican" si no sirven
      v += c.p * 0.7;
      // si el rival está cerca de ganar con un elemento, gasto cartas que lo bloqueen
      for (let e = 0; e < 4; e++) if (nOp[e] === 2 && J.BEATS[c.e] === e) v += 5;
      v += rnd() * (level === 'normal' ? 4 : 1.5);
      if (v > best) { best = v; bi = i; }
    });
    let chi = false;
    if (sim.chi[pl]) { const closeMe = Math.max.apply(null, nMe) >= 2 || nMe.filter(x => x > 0).length >= 2, closeOp = Math.max.apply(null, nOp) >= 2 || nOp.filter(x => x > 0).length >= 2; chi = (closeMe || closeOp) && rnd() < (level === 'dificil' ? 0.45 : 0.3); }
    return { i: bi, chi };
  };

  J.Sim = Sim; J.rng = rng;
  if (typeof module !== 'undefined' && typeof window === 'undefined') module.exports = { J };
})();
