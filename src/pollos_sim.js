/* ===========================================================
   pollos_sim.js — lógica PURA de "Memoria de pedidos" (El Pollo Pier).
   Sin Phaser: se puede probar en Node (ver /home/claude/tools/psim_test.js).
   Reglas:
   - Solo se vende cerveza (b) y salchipapas (s).
   - Llegan clientes a mesas libres (8 mesas). Cada uno dice su pedido y la burbuja se APAGA a los pocos
     segundos: hay que recordarlo. La paciencia se agota; si el bar está lleno, el cliente se va (strike).
   - Dos jugadores con la MISMA semilla reciben los mismos clientes/pedidos en el mismo orden.
   =========================================================== */
(function () {
  const G = (typeof window !== 'undefined' ? window : global).G = (typeof window !== 'undefined' ? window : global).G || {};
  const P = G.P = {};

  P.TABLES = 8; P.CAP = 4; P.STRIKES = 3;
  P.DIFFS = {
    facil:   { name: 'Fácil',   a0: 8.0, a1: 3.8, p0: 52, p1: 36, s0: 3.8, s1: 2.6, n0: 2, n1: 3 },
    normal:  { name: 'Normal',  a0: 7.0, a1: 3.0, p0: 44, p1: 29, s0: 3.0, s1: 1.9, n0: 2, n1: 4 },
    dificil: { name: 'Difícil', a0: 6.0, a1: 2.4, p0: 38, p1: 23, s0: 2.4, s1: 1.4, n0: 2, n1: 5 }
  };
  P.DURS = [90, 150, 210];

  function rng(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

  class Sim {
    constructor(seed, diff, dur) {
      this.R = rng(seed); this.D = P.DIFFS[diff] || P.DIFFS.normal; this.dur = dur;
      this.t = 0; this.pat = new Array(P.TABLES).fill(null); this.nextArr = 2.5;
      this.score = 0; this.served = 0; this.lost = 0; this.strikes = 0; this.arrivals = 0; this.over = null; this.ev = [];
    }
    prog() { return Math.min(1, this.t / this.dur); }
    occupied() { return this.pat.filter(Boolean).length; }
    arrive() {
      const R = this.R, D = this.D, p = this.prog();
      // el número de sorteos es SIEMPRE el mismo (así los dos jugadores ven los mismos clientes)
      const rInt = R(), rN = R(), rT = [R(), R(), R(), R(), R()], rTab = R(), rPat = R(), rSkin = R();
      this.arrivals++;
      this.nextArr = this.t + lerp(D.a0, D.a1, p) * (0.75 + 0.5 * rInt);
      const free = []; this.pat.forEach((x, i) => { if (!x) free.push(i); });
      if (!free.length) { this.strikes++; this.score = Math.max(0, this.score - 4); this.ev.push({ k: 'strike' }); if (this.strikes >= P.STRIKES) this.over = 'lleno'; return; }
      const maxN = Math.max(1, Math.round(lerp(D.n0, D.n1, p))), n = 1 + Math.min(maxN - 1, Math.floor(rN * maxN));
      const need = { b: 0, s: 0 }; for (let i = 0; i < n; i++) need[rT[i] < 0.5 ? 'b' : 's']++;
      const pt = lerp(D.p0, D.p1, p) * (0.9 + 0.2 * rPat), i = free[Math.floor(rTab * free.length)];
      this.pat[i] = { skin: Math.floor(rSkin * 6), need, total: n, pat: pt, patMax: pt, show: lerp(D.s0, D.s1, p) + (n > 3 ? 0.5 : 0), state: 'wait', left: 0, orig: { b: need.b, s: need.s } };
      this.ev.push({ k: 'arrive', i });
    }
    tick(dt) {
      if (this.over) return;
      this.t += dt;
      while (this.t >= this.nextArr && !this.over) this.arrive();
      this.pat.forEach((p, i) => {
        if (!p) return;
        if (p.state === 'wait') {
          p.show -= dt; p.pat -= dt;
          if (p.pat <= 0) { p.state = 'angry'; p.left = 1.1; this.lost++; this.score = Math.max(0, this.score - 6); this.ev.push({ k: 'angry', i }); }
        } else { p.left -= dt; if (p.left <= 0) { this.pat[i] = null; this.ev.push({ k: 'leave', i }); } }
      });
      if (!this.over && this.t >= this.dur) this.over = 'tiempo';
    }
    /* entrega lo que sirve de la bandeja a la mesa i; devuelve resultado */
    serve(i, tray) {
      const p = this.pat[i];
      if (!p || p.state !== 'wait') return { ok: false, why: 'vacia' };
      const b = Math.min(tray.b, p.need.b), s = Math.min(tray.s, p.need.s);
      if (!b && !s) return { ok: false, why: 'nada' };
      tray.b -= b; tray.s -= s; p.need.b -= b; p.need.s -= s;
      let pts = 2 * (b + s), full = false;
      if (!p.need.b && !p.need.s) { full = true; pts += 10 + p.total * 3 + Math.round(10 * p.pat / p.patMax); p.state = 'done'; p.left = 1.3; this.served++; }
      this.score += pts;
      return { ok: true, full, pts, b, s };
    }
    /* bonus final por libretas sin gastar */
    finish(peeksLeft) { const bonus = (peeksLeft || 0) * 3; this.score += bonus; return bonus; }
  }
  P.Sim = Sim;
  P.rng = rng;
})();
