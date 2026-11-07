/* ===========================================================
   main.js — arranque, flujo de pantallas, mensajes de red y viajes
   Flujo: título -> quién eres + nombre -> sala (código) -> historia ->
          igloo (casa) <-> mapa <-> lugares
   Modo de prueba (sin red): ?solo=1&me=sebas&name=Sebas&go=igloo
   =========================================================== */
(function () {
  const G = window.G, Q = new URLSearchParams(location.search);
  G.load();
  G.flow = {};
  G.solo = Q.get('solo') === '1';
  const flow = G.flow;
  const IN_GAME = ['story', 'igloo', 'map', 'place', 'kennedy', 'pucp', 'cocina', 'martuccini', 'pollos', 'saoco', 'conecta4', 'cardjitsu', 'fin', 'callao', 'yuyos', 'foto'];

  /* ---------- identidad ---------- */
  flow.setMe = function (id, name) {
    const me = G.state.me;
    if (me.id !== id || !me.look) { me.look = G.defaultLook(id); }
    me.id = id; me.name = name; G.save();
  };
  flow.setName = function (n) { G.state.me.name = n; G.save(); if (G.net.connected) G.net.send('name', { name: n }); G.bus.emit('partner'); G.ui.toast('Nombre cambiado'); };
  flow.toSetup = function () { G.ui.showHud(false); G.ui.setup(); showMenuBg(); };
  flow.toLobby = function () { G.ui.lobby(); };
  function showMenuBg() { if (G.state.scene !== 'menu') { G.travel('menu', {}, true); } }

  /* ---------- conexión ---------- */
  flow.host = function (code, ok, err) { G.net.host(code, ok, err); };
  flow.join = function (code, err) { G.net.join(code, null, err); };
  flow.leaveRoom = function () { G.net.cleanup(); G.state.room = { role: null, code: null }; G.save(); G.ui.pause(false); G.state.partner = { id: null, name: '', look: null }; G.travel('menu', {}, true); G.ui.showHud(false); G.ui.lobby(); };

  function sendHello() {
    const s = G.state;
    G.net.send('hello', { id: s.me.id, name: s.me.name, look: s.me.look, balance: s.balance, scoreRev: s.scoreRev, records: s.records, recRev: s.recRev, belts: s.belts, scene: s.scene, params: s.sceneParams || {}, storySeen: s.storySeen });
  }
  G.bus.on('net', e => {
    if (e.connected) { sendHello(); if (G.pausedKeys) resume(); }
    else if (IN_GAME.includes(G.state.scene)) pause();
  });
  function pause() {
    if (G.pausedKeys) return;
    G.pausedKeys = G.game.scene.getScenes(true).map(s => s.scene.key);
    G.pausedKeys.forEach(k => G.game.scene.pause(k));
    G.ui.pause(true, G.state.partner.name);
  }
  function resume() {
    (G.pausedKeys || []).forEach(k => G.game.scene.resume(k)); G.pausedKeys = null; G.ui.pause(false); G.ui.toast('¡Se reconectaron! 💜');
  }

  G.net.on('hello', d => {
    const s = G.state;
    // mismo personaje elegido por los dos: el invitado cambia
    if (d.id === s.me.id) {
      if (G.net.role === 'guest') {
        const nid = G.IDS[d.id].other; s.me.id = nid; s.me.look = G.defaultLook(nid); G.save(); G.refreshTextures();
        G.ui.toast('Tu pareja ya era ' + G.IDS[d.id].label + ': ahora tú eres ' + G.IDS[nid].label); sendHello();
      }
      return;
    }
    const first = !s.partner.id;
    s.partner = { id: d.id, name: d.name, look: d.look };
    if (d.scoreRev > s.scoreRev) { s.balance = d.balance; s.scoreRev = d.scoreRev; G.bus.emit('score'); }
    if (d.recRev > s.recRev) { s.records = d.records; s.recRev = d.recRev; G.bus.emit('records'); }
    if (d.belts) { s.belts[d.id] = Math.max(s.belts[d.id] || 0, d.belts[d.id] || 0); }
    G.save(); G.refreshTextures(); G.bus.emit('partner');
    if (G.net.role === 'host') {
      // el anfitrión decide a dónde van (también al reconectar)
      if (IN_GAME.includes(s.scene)) { G.net.send('goto', { key: s.scene, params: s.sceneParams || {} }); }
      else flow.begin();
    }
  });
  G.net.on('look', d => { G.state.partner.look = d.look; G.refreshTextures(); G.bus.emit('partner'); });
  G.net.on('name', d => { G.state.partner.name = d.name; G.bus.emit('partner'); });
  G.net.on('goto', d => G.travel(d.key, d.params, true));
  G.net.on('score', d => { if (d.rev >= G.state.scoreRev) { G.state.balance = d.balance; G.state.scoreRev = d.rev; G.save(); G.bus.emit('score'); } });
  G.net.on('belts', d => { const s = G.state, b = s.belts; s.beltKeys = s.beltKeys || []; if (d.key && !s.beltKeys.includes(d.key)) s.beltKeys.push(d.key); ['dani', 'sebas'].forEach(k => { b[k] = Math.max(b[k] || 0, (d.belts && d.belts[k]) || 0); }); G.save(); G.bus.emit('belts'); });
  G.net.on('album', d => { if (d && d.item) G.addPhoto(d.item, true); });
  G.net.on('records', d => { if (d.rev >= G.state.recRev) { G.state.records = d.records; G.state.recRev = d.rev; G.save(); G.bus.emit('records'); } });
  G.net.on('chat', d => { G.ui.chatLine(G.state.partner.name, d.text); G.bus.emit('chat', { who: 'partner', text: d.text }); });
  G.net.on('emote', d => G.bus.emit('emote', { who: 'partner', id: d.id }));
  G.net.on('pos', d => G.bus.emit('pos', d));
  G.net.on('mapgo', d => G.bus.emit('mapgo', d.k));
  G.net.on('storyDone', () => { G.partnerStoryDone = true; checkStory(); });
  G.bus.on('look', () => { G.refreshTextures(); if (G.net.connected) G.net.send('look', { look: G.state.me.look }); });

  /* ---------- historia ---------- */
  flow.begin = function () { G.partnerStoryDone = false; G.meStoryDone = false; G.travel('story', {}); };
  flow.storyDone = function () { G.meStoryDone = true; G.net.send('storyDone', {}); checkStory(); };
  function checkStory() {
    if (!G.meStoryDone || !(G.partnerStoryDone || G.solo)) return;
    if (G.net.role === 'host' || G.solo) { G.partnerStoryDone = G.meStoryDone = false; G.travel('igloo', { place: G.BASE }); }
  }

  /* ---------- chat y emotes ---------- */
  flow.chat = function (text) { G.net.send('chat', { text }); G.ui.chatLine(G.state.me.name, text); G.bus.emit('chat', { who: 'me', text }); };
  flow.emote = function (id) { G.net.send('emote', { id }); G.bus.emit('emote', { who: 'me', id }); };

  /* ---------- viajes entre escenas ---------- */
  /* si alguien llegó a ±50 soles, antes del mapa se ve la pantalla final (una vez por victoria) */
  flow.openMap = function () {
    const w = G.winnerOfMatch();
    if (w && G.finShown !== w + ':' + G.state.scoreRev) G.travel('fin', { w });
    else G.travel('map', {});
  };
  flow.goPlace = function (k) {
    const p = G.PLACES[k]; G.state.place = k;
    G.travel(p.scene, { place: k });
  };

  G.travel = function (key, params, remote) {
    params = params || {};
    const gm = G.game;
    gm.scene.getScenes(true).forEach(s => s.scene.stop());
    G.state.scene = key; G.state.sceneParams = params;
    const pk = params.place || (key === 'igloo' ? G.state.place : null);
    G.audio.setStyle(pk && G.PLACES[pk] ? G.PLACES[pk].music : (G.MUSIC_FOR[key] || 'lofi'));
    G.ui.showHud(['igloo', 'map', 'place', 'kennedy', 'pucp', 'cocina', 'pollos', 'saoco', 'conecta4', 'cardjitsu', 'callao', 'yuyos'].includes(key));
    G.ui.clearScreensIf && G.ui.clearScreensIf(key);
    gm.scene.start(key, params);
    if (!remote && G.net.connected) G.net.send('goto', { key, params });
  };
  G.ui.clearScreensIf = function (key) { if (key !== 'menu') G.ui.clearScreens(); };

  /* ---------- arranque ---------- */
  function boot() {
    const cfg = {
      type: Phaser.AUTO, parent: 'game', width: G.W, height: G.H, pixelArt: true, backgroundColor: '#120a22',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: false, roundPixels: true }, input: { keyboard: { capture: [] } },
      scene: [G.MenuScene, G.StoryScene, G.IglooScene, G.MapScene, G.PlaceScene, G.KennedyScene, G.PucpScene, G.CocinaScene, G.MartucciniScene, G.PollosScene, G.SaocoScene, G.Conecta4Scene, G.CardjitsuScene, G.FinScene, G.CallaoScene, G.YuyosScene, G.FotoScene].filter(Boolean)
    };
    G.game = new Phaser.Game(cfg);
    G.game.events.once('ready', () => {
      window.addEventListener('keydown', e => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key) && !G.typing && !G.modalOpen && !(e.target && e.target.tagName === 'INPUT')) e.preventDefault(); });
      G.state.scene = 'menu'; G.refreshTextures && 0;
      G.game.scene.getScenes(true).forEach(s => { }); // menu arranca solo
      if (G.solo) soloStart(); else if (G.local) G.flow.toSetup(); else G.ui.title();
    });
  }
  /* modo de prueba: un solo navegador, pareja simulada */
  function soloStart() {
    const id = Q.get('me') || 'sebas', other = G.IDS[id].other;
    flow.setMe(id, Q.get('name') || G.IDS[id].label);
    G.state.partner = { id: other, name: Q.get('pname') || G.IDS[other].label, look: G.defaultLook(other) };
    G.state.balance = +(Q.get('bal') || 0);
    const oi = +Q.get('outfit'); if (!isNaN(oi) && Q.get('outfit') !== null) { G.applyOutfit(G.state.me.look, G.PRESETS[id].outfits[oi]); G.state.me.look.outfitIdx = oi; }
    G.refreshTextures(); G.ui.clearScreens();
    const go = Q.get('go') || 'story';
    if (go === 'story') G.travel('story', {}); else if (go === 'map') { G.state.place = Q.get('from') || G.BASE; G.travel('map', {}); }
    else if (go === 'martuccini') G.travel('martuccini', {});
    else if (go === 'conecta4') G.travel('conecta4', {});
    else if (go === 'foto') G.travel('foto', { w: Q.get('w') || 'dani', place: Q.get('place') || 'callao' });
    else if (go === 'fin') G.travel('fin', { w: G.winnerOfMatch() || 'dani' });
    else if (G.PLACES[go]) { G.state.place = go; G.travel(G.PLACES[go].scene, { place: go }); }
    if (Q.get('closet') === '1') setTimeout(() => G.ui.closet(), 800);
    if (Q.get('settings') === '1') setTimeout(() => G.ui.settings(), 800);
  }
  window.addEventListener('load', () => {
    Promise.all([document.fonts.load('16px VT323'), document.fonts.load('16px PS2P')]).catch(() => { }).then(boot);
  });
  /* evitar que las flechas/espacio muevan la página. OJO: se registra en 'window' DESPUÉS de que Phaser arranque (más abajo),
     porque Phaser ignora las teclas cuyo evento ya fue 'preventDefault' (si se hiciera antes, las flechas y el espacio no llegarían al juego). */
})();
