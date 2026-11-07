/* ===========================================================
   state.js — estado global + guardado en el navegador (localStorage)
   - Marcador de soles (UNA sola partida, con botón de reinicio en Ajustes)
   - Récords y quién gana: SE GUARDAN SIEMPRE y se sincronizan entre ambos
   =========================================================== */
(function () {
  const G = window.G;
  const GAMES = ['callao', 'yuyos', 'connect4', 'kennedy', 'pucp', 'pollos', 'cocina', 'salsa', 'salsa_facil', 'salsa_normal', 'salsa_dificil', 'carjitsu'];

  G.defaultRecords = function () {
    const r = { games: {}, best: {}, matches: { dani: 0, sebas: 0 } };
    GAMES.forEach(g => { r.games[g] = { dani: 0, sebas: 0 }; r.best[g] = { dani: 0, sebas: 0 }; });
    return r;
  };

  G.state = {
    me: { id: null, name: '', look: null },
    partner: { id: null, name: '', look: null },
    settings: { music: true, vol: 0.5, time: 'auto' },   // time: auto | day | night
    balance: 0,            // soles de Daniela (+) ; Sebas = -balance. Pierde quien llegue a -50
    scoreRev: 0,
    records: G.defaultRecords(),
    recRev: 0,
    kitchen: { unlocked: 1, stars: {}, best: {} },   // Los Ccellis: niveles desbloqueados, estrellas y mejores puntajes
    album: [],                      // fotos vintage de las playas (permanentes)
    belts: { dani: 0, sebas: 0 },   // puntos de bufanda (Card-jitsu), permanentes
    unlocks: { dani: {}, sebas: {} },
    storySeen: false,
    room: { role: null, code: null },
    scene: null, place: 'igloo',
    pos: null,
    session: { boba: { dani: false, sebas: false } }  // bubble tea extra: solo esta sesión
  };

  G.save = function () {
    try {
      const s = G.state;
      localStorage.setItem(G.STORAGE_KEY, JSON.stringify({
        me: s.me, settings: s.settings, balance: s.balance, scoreRev: s.scoreRev,
        records: s.records, recRev: s.recRev, belts: s.belts, unlocks: s.unlocks, kitchen: s.kitchen,
        storySeen: s.storySeen, room: s.room, place: s.place, album: s.album
      }));
    } catch (e) { /* modo privado, etc. */ }
  };

  G.load = function () {
    try {
      const raw = localStorage.getItem(G.STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw), s = G.state;
      ['me', 'settings', 'records', 'belts', 'unlocks', 'room', 'kitchen'].forEach(k => { if (d[k]) s[k] = Object.assign({}, s[k], d[k]); });
      ['balance', 'scoreRev', 'recRev', 'storySeen', 'place', 'album'].forEach(k => { if (d[k] !== undefined) s[k] = d[k]; });
      if (!G.PLACES[s.place]) s.place = G.BASE;                     // guardados de la v0.2 (igloo_dani / igloo_sebas)
      if (s.me.look && s.me.look.acc) s.me.look.acc.boba = false;   // el bubble tea es solo de la sesión
      // completar récords nuevos si se agregan juegos
      const def = G.defaultRecords();
      Object.keys(def.games).forEach(g => { s.records.games[g] = s.records.games[g] || def.games[g]; s.records.best[g] = s.records.best[g] || def.best[g]; });
    } catch (e) { console.warn('No se pudo leer el guardado', e); }
  };

  /* ---------- soles ---------- */
  G.winnerOfMatch = function () {
    const b = G.state.balance;
    if (b >= 50) return 'dani';       // Sebas llegó a -50
    if (b <= -50) return 'sebas';     // Daniela llegó a -50
    return null;
  };

  G.setBalance = function (v, fromRemote, rev) {
    const s = G.state;
    v = Math.max(-50, Math.min(50, Math.round(v)));
    s.balance = v;
    s.scoreRev = fromRemote ? rev : s.scoreRev + 1;
    G.save();
    if (!fromRemote && G.net && G.net.connected) G.net.send('score', { balance: s.balance, rev: s.scoreRev });
    G.bus.emit('score');
  };

  /* El que gana un minijuego gana 'amount' soles y el otro los pierde */
  G.addSoles = function (winnerId, amount) {
    G.setBalance(G.state.balance + (winnerId === 'dani' ? amount : -amount));
  };

  /* ---------- récords (siempre guardados) ---------- */
  G.recordWin = function (game, winnerId, bestScore) {
    const s = G.state, r = s.records;
    if (!r.games[game]) { r.games[game] = { dani: 0, sebas: 0 }; r.best[game] = { dani: 0, sebas: 0 }; }
    if (winnerId) r.games[game][winnerId]++;
    if (bestScore && winnerId && bestScore > r.best[game][winnerId]) r.best[game][winnerId] = bestScore;
    s.recRev++;
    G.save();
    if (G.net && G.net.connected) G.net.send('records', { records: r, rev: s.recRev });
    G.bus.emit('records');
  };

  /* mejor puntaje personal (sin contar como victoria), p. ej. Saoco "VS yo" por dificultad */
  G.recordBest = function (game, id, score) {
    const s = G.state, r = s.records;
    if (!r.games[game]) { r.games[game] = { dani: 0, sebas: 0 }; r.best[game] = { dani: 0, sebas: 0 }; }
    const isNew = score > (r.best[game][id] || 0);
    if (isNew) { r.best[game][id] = score; s.recRev++; G.save(); if (G.net && G.net.connected) G.net.send('records', { records: r, rev: s.recRev }); G.bus.emit('records'); }
    return isNew;
  };

  /* bufandas de Card-jitsu: puntos permanentes por jugador (nunca bajan).
     'key' identifica la partida (la semilla, igual en las dos laptops) para no sumar dos veces aunque
     lleguen el aviso del otro y el cálculo propio en distinto orden. */
  G.awardBelts = function (key, gains) {
    const s = G.state; s.beltKeys = s.beltKeys || [];
    if (s.beltKeys.includes(key)) return false;
    s.beltKeys.push(key); if (s.beltKeys.length > 30) s.beltKeys.shift();
    Object.keys(gains).forEach(id => { s.belts[id] = (s.belts[id] || 0) + gains[id]; });
    G.save(); G.bus.emit('belts');
    if (G.net && G.net.connected) G.net.send('belts', { belts: s.belts, key });
    return true;
  };

  G.resetScore = function () { G.setBalance(0); };
  G.resetRecords = function () {
    G.state.records = G.defaultRecords(); G.state.recRev++; G.save();
    if (G.net && G.net.connected) G.net.send('records', { records: G.state.records, rev: G.state.recRev });
    G.bus.emit('records');
  };

  /* ¿Es de día? (auto = hora local 6:00–18:00) */
  G.isNight = function () {
    const t = G.state.settings.time;
    if (t === 'night') return true;
    if (t === 'day') return false;
    const h = new Date().getHours();
    return h < 6 || h >= 18;
  };

  G.me = () => G.state.me;
  G.other = () => G.state.partner;
})();
