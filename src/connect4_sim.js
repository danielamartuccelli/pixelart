/* ===========================================================
   connect4_sim.js — lógica PURA del Cuatro en raya (7 columnas x 6 filas). Se puede probar con Node.
   Tablero: arreglo de 42 casillas, índice = fila*7 + col (fila 0 = ARRIBA, fila 5 = abajo).
   Valores: 0 vacío · 1 y 2 = jugadores.
   =========================================================== */
(function () {
  const C4 = {}, COLS = 7, ROWS = 6;
  C4.COLS = COLS; C4.ROWS = ROWS;
  C4.empty = () => new Array(COLS * ROWS).fill(0);

  /* fila libre más baja de la columna (o -1 si está llena) */
  C4.rowFor = (b, c) => { for (let r = ROWS - 1; r >= 0; r--) if (!b[r * COLS + c]) return r; return -1; };
  C4.canDrop = (b, c) => c >= 0 && c < COLS && C4.rowFor(b, c) >= 0;
  /* suelta una ficha: devuelve la fila o -1 */
  C4.drop = (b, c, p) => { if (c < 0 || c >= COLS) return -1; const r = C4.rowFor(b, c); if (r >= 0) b[r * COLS + c] = p; return r; };
  C4.full = b => { for (let c = 0; c < COLS; c++) if (!b[c]) return false; return true; };

  /* ¿ganó alguien? devuelve {p, line:[[c,r]x4]} o null */
  const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  C4.winner = function (b) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const p = b[r * COLS + c]; if (!p) continue;
      for (const [dc, dr] of DIRS) {
        const ec = c + 3 * dc, er = r + 3 * dr; if (ec < 0 || ec >= COLS || er < 0 || er >= ROWS) continue;
        let ok = true; for (let k = 1; k < 4; k++) if (b[(r + k * dr) * COLS + c + k * dc] !== p) { ok = false; break; }
        if (ok) return { p, line: [0, 1, 2, 3].map(k => [c + k * dc, r + k * dr]) };
      }
    }
    return null;
  };

  /* ---------- IA (minimax con poda) para el modo de prueba / pareja simulada ---------- */
  const ORDER = [3, 2, 4, 1, 5, 0, 6];
  function scoreWindow(w, p) {
    const q = 3 - p; let mine = 0, his = 0, emp = 0;
    for (const v of w) { if (v === p) mine++; else if (v === q) his++; else emp++; }
    if (mine && his) return 0;
    if (mine === 3 && emp === 1) return 6; if (mine === 2 && emp === 2) return 2;
    if (his === 3 && emp === 1) return -7; if (his === 2 && emp === 2) return -2;
    return 0;
  }
  function evalBoard(b, p) {
    let s = 0;
    for (let r = 0; r < ROWS; r++) if (b[r * COLS + 3] === p) s += 3; else if (b[r * COLS + 3] === 3 - p) s -= 3;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dc, dr] of DIRS) {
      const ec = c + 3 * dc, er = r + 3 * dr; if (ec < 0 || ec >= COLS || er < 0 || er >= ROWS) continue;
      s += scoreWindow([0, 1, 2, 3].map(k => b[(r + k * dr) * COLS + c + k * dc]), p);
    }
    return s;
  }
  function search(b, depth, alpha, beta, turn, me) {
    const w = C4.winner(b);
    if (w) return w.p === me ? 100000 + depth : -100000 - depth;
    if (C4.full(b)) return 0;
    if (depth === 0) return evalBoard(b, me);
    let best = turn === me ? -Infinity : Infinity;
    for (const c of ORDER) {
      if (!C4.canDrop(b, c)) continue;
      const r = C4.drop(b, c, turn);
      const v = search(b, depth - 1, alpha, beta, 3 - turn, me);
      b[r * COLS + c] = 0;
      if (turn === me) { if (v > best) best = v; if (best > alpha) alpha = best; } else { if (v < best) best = v; if (best < beta) beta = best; }
      if (alpha >= beta) break;
    }
    return best;
  }
  /* mejor columna para 'p'. depth: 1 = torpe … 5 = fuerte. rnd: función 0..1 para desempatar */
  C4.bestMove = function (b, p, depth, rnd) {
    rnd = rnd || Math.random; const cand = [];
    let best = -Infinity;
    for (const c of ORDER) {
      if (!C4.canDrop(b, c)) continue;
      const r = C4.drop(b, c, p);
      const v = search(b, depth - 1, -Infinity, Infinity, 3 - p, p) + rnd() * 0.5;
      b[r * COLS + c] = 0;
      if (v > best) { best = v; cand.length = 0; cand.push(c); } else if (Math.abs(v - best) < 0.01) cand.push(c);
    }
    return cand.length ? cand[0] : -1;
  };

  (typeof window !== 'undefined' ? (window.G = window.G || {}) : module.exports).C4 = C4;
  if (typeof module !== 'undefined' && typeof window === 'undefined') module.exports = { C4 };
})();
