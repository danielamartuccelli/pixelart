/* ===========================================================
   ui.js — pantallas y paneles en HTML (título, nombre, sala, HUD,
   chat, emotes, clóset, ajustes, pausa). Phaser dibuja el mundo;
   el HTML hace los formularios (más fácil y más nítido).
   =========================================================== */
(function () {
  const G = window.G;
  const $ = s => document.querySelector(s);
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ui = G.ui = {};
  const nm = id => (G.state.me.id === id ? G.state.me.name : G.state.partner.name) || G.IDS[id].short;

  /* ---------- toast ---------- */
  let tt;
  ui.toast = function (msg, ms) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), ms || 2600); };

  /* ---------- pantallas ---------- */
  ui.clearScreens = function () { $('#screens').innerHTML = ''; };
  function screen(html) { const s = el('div', 'screen', html); const c = $('#screens'); c.innerHTML = ''; c.appendChild(s); return s; }

  ui.title = function () {
    const s = screen(`<h1>LIMA<br>DE A DOS</h1><div class="sub">Un juego para Sebas y Daniela 💜</div>
      <button class="btn go" id="b_play">▶ Jugar</button>
      <button class="btn alt small" id="b_set">⚙ Ajustes</button>
      <div class="small-note" style="color:#fff;margin-top:14px;text-shadow:2px 2px 0 #2b1b30">v${G.VERSION} · Etapa 2 · cada uno en su laptop, se conectan con un código</div>`);
    s.querySelector('#b_play').onclick = () => { G.audio.start(); G.audio.sfx('ok'); G.flow.toSetup(); };
    s.querySelector('#b_set').onclick = () => { G.audio.start(); ui.settings(); };
  };

  ui.setup = function () {
    const me = G.state.me;
    let sel = me.id || null; const LQ = new URLSearchParams(location.search);
    if (G.local) sel = LQ.get('me') || (G.slot ? 'dani' : 'sebas');
    const s = screen(`<h1>${G.local ? 'TU NOMBRE' : '¿QUIÉN ERES?'}</h1><div class="sub">Elige tu personaje y escribe tu nombre (así te llamará el juego)</div>
      <div class="cards" id="cards"></div>
      <div style="width:min(360px,90vw)"><input type="text" id="nm" maxlength="14" placeholder="Tu nombre"></div>
      <div class="row" style="margin-top:12px"><button class="btn go" id="next">Continuar ▶</button></div>
      <div class="small-note" id="msg" style="color:#fff"></div>`);
    const cards = s.querySelector('#cards'), inp = s.querySelector('#nm');
    function draw() {
      cards.innerHTML = '';
      ['sebas', 'dani'].filter(id => !G.local || id === sel).forEach(id => {
        const c = el('div', 'card panel' + (sel === id ? ' sel' : ''));
        const cv = el('canvas'); G.drawLook(cv, id === me.id && me.look ? me.look : G.defaultLook(id), 'd', 0, 7); c.appendChild(cv);
        c.appendChild(el('div', 'px', ''));
        c.appendChild(el('div', '', '<b style="font-size:28px">Soy ' + G.IDS[id].label + '</b>'));
        c.onclick = () => { sel = id; if (!inp.value.trim() || ['Sebastián', 'Daniela', 'Sebas', 'Dani'].includes(inp.value.trim())) inp.value = G.IDS[id].label; draw(); };
        cards.appendChild(c);
      });
    }
    inp.value = me.name || (G.local ? G.IDS[sel].label : '');
    draw();
    s.querySelector('#next').onclick = () => {
      const name = inp.value.trim();
      if (!sel) { s.querySelector('#msg').textContent = 'Elige quién eres 👆'; return; }
      if (!name) { s.querySelector('#msg').textContent = 'Escribe tu nombre ✏️'; return; }
      G.audio.start(); G.audio.sfx('ok'); G.flow.setMe(sel, name); if (G.local) { ui.localWait(); G.net.hello(); } else G.flow.toLobby();
    };
  };

  /* misma laptop: espera a que el otro jugador también ponga su nombre */
  ui.localWait = function () {
    screen('<h1>¡LISTO!</h1><div class="sub">Esperando a que tu pareja ponga su nombre…</div><div class="spin" style="margin:10px auto"></div>');
  };

  ui.lobby = function () {
    const room = G.state.room;
    const s = screen(`<h1>SALA</h1><div class="sub">Uno crea la sala y le pasa el código al otro</div>
      <div class="row" id="opts">
        <div class="panel" style="width:280px"><b>🏠 Crear sala</b><br><span class="small-note">Te da un código para compartir</span><br><button class="btn go" id="mk">Crear sala</button></div>
        <div class="panel" style="width:280px"><b>🔑 Unirme con código</b><br><input type="text" id="cd" maxlength="5" placeholder="CÓDIGO" style="text-transform:uppercase;text-align:center;letter-spacing:6px;margin:6px 0"><br><button class="btn" id="jn">Unirme</button></div>
      </div>
      <div id="st" style="margin-top:10px"></div>
      <div class="row"><button class="btn alt small" id="back">◀ Volver</button>${room.code ? `<button class="btn gold small" id="rc">↻ Reconectar (${esc(room.code)} · ${room.role === 'host' ? 'anfitrión' : 'invitado'})</button>` : ''}</div>`);
    const st = s.querySelector('#st');
    const waiting = (html) => { st.innerHTML = '<div class="panel" style="display:inline-block">' + html + '</div>'; };
    function hosting(code) {
      waiting(`<div>Pásale este código a tu pareja:</div><div class="code" id="cc">${code}</div><br><button class="btn small" id="cp">Copiar</button><div class="spin" style="margin:8px auto"></div><div class="small-note">Esperando que el otro se una…</div>`);
      st.querySelector('#cp').onclick = () => { try { navigator.clipboard.writeText(code); ui.toast('Código copiado 💜'); } catch (e) { } };
    }
    s.querySelector('#mk').onclick = () => {
      waiting('<div class="spin"></div>Creando sala…');
      G.flow.host(null, hosting, e => waiting('<span class="err">No se pudo crear la sala (' + esc(e.type || e) + '). Revisa tu internet e inténtalo otra vez.</span>'));
    };
    s.querySelector('#jn').onclick = () => {
      const c = s.querySelector('#cd').value.trim().toUpperCase();
      if (c.length < 4) { waiting('<span class="err">Escribe el código completo</span>'); return; }
      waiting('<div class="spin" style="margin:6px auto"></div>Conectando con la sala <b>' + esc(c) + '</b>…<div class="small-note">Si el otro todavía no creó la sala, reintento solo.</div>');
      G.flow.join(c, e => { if (e && e.type !== 'peer-unavailable') waiting('<span class="err">Error de conexión: ' + esc(e.type || e) + '</span>'); });
    };
    s.querySelector('#back').onclick = () => G.flow.toSetup();
    const rc = s.querySelector('#rc');
    if (rc) rc.onclick = () => {
      if (room.role === 'host') { waiting('<div class="spin"></div>Reabriendo sala…'); G.flow.host(room.code, hosting, e => waiting('<span class="err">' + esc(e.type || e) + '</span>')); }
      else { waiting('<div class="spin"></div>Reconectando a <b>' + esc(room.code) + '</b>…'); G.flow.join(room.code, () => { }); }
    };
  };

  /* ---------- HUD ---------- */
  ui.showHud = function (on) { ['#hud', '#c4', '#chat', '#emotes'].forEach(s => $(s).classList.toggle('hidden', !on)); if (on) ui.buildHud(); };
  ui.buildHud = function () {
    const hud = $('#hud'); hud.innerHTML = '';
    const left = el('div', '', ''); left.style.cssText = 'display:flex;flex-direction:column;gap:4px';
    [G.state.me, G.state.partner].forEach((p, i) => {
      if (!p.id) return;
      const w = el('div', 'who' + (i === 1 && !G.net.connected ? ' off' : ''));
      if (p.look) w.appendChild(G.faceCanvas(p.look, 2));
      w.appendChild(el('span', '', esc(p.name || G.IDS[p.id].short) + (i === 1 ? '<i class="dot"></i>' : '')));
      left.appendChild(w);
    });
    const sc = el('div', '', ''); sc.id = 'score';
    const right = el('div', '', ''); right.id = 'hudr';
    const mk = (t, f, cls) => { const b = el('button', 'btn small ' + (cls || ''), t); b.onclick = f; return b; };
    right.appendChild(mk('👕 Clóset', () => ui.closet())); right.appendChild(mk('⚙', () => ui.settings(), 'alt'));
    hud.append(left, sc, right);
    ui.updateScore(); ui.updateC4();
    const em = $('#emotes'); em.innerHTML = '';
    G.EMOTES.forEach(([id, label], i) => { const b = el('button'); b.title = (i + 1) + ' · ' + label; b.appendChild(G.emoteCanvas(id, 3)); b.onclick = () => G.flow.emote(id); em.appendChild(b); });
  };
  ui.updateScore = function () {
    const sc = $('#score'); if (!sc) return;
    const b = G.state.balance, d = b, s = -b, f = n => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
    const w = Math.abs(b) / 50 * 50;
    sc.innerHTML = `<div><b>${esc(nm('dani'))}</b> ${f(d)} S/ &nbsp;|&nbsp; <b>${esc(nm('sebas'))}</b> ${f(s)} S/</div>
      <div class="bar"><i style="${b >= 0 ? 'left:50%' : 'right:50%'};width:${w}%"></i><b></b></div>
      <div style="font-size:16px;opacity:.7">el primero en llegar a −50 pierde</div>`;
  };
  ui.updateC4 = function () {
    const r = G.state.records.games.connect4, c = $('#c4'); if (!c) return;
    c.innerHTML = `🔴🟡 Cuatro en raya (global): ${esc(nm('sebas'))} <b>${r.sebas}</b> — <b>${r.dani}</b> ${esc(nm('dani'))}`;
  };
  G.bus.on('score', () => { ui.updateScore(); });
  G.bus.on('records', () => { ui.updateC4(); });
  G.bus.on('look', () => { if (!$('#hud').classList.contains('hidden')) ui.buildHud(); });
  G.bus.on('partner', () => { if (!$('#hud').classList.contains('hidden')) ui.buildHud(); });
  G.bus.on('net', () => { if (!$('#hud').classList.contains('hidden')) ui.buildHud(); });

  /* ---------- chat ---------- */
  ui.chatLine = function (name, text) {
    const log = $('#chatlog'), d = el('div', '', '<b>' + esc(name) + ':</b> ' + esc(text)); log.appendChild(d);
    while (log.children.length > 6) log.removeChild(log.firstChild);
    setTimeout(() => { d.style.opacity = 0; setTimeout(() => d.remove(), 700); }, 12000);
  };
  ui.openChat = function () { const c = $('#chat'); if (c.classList.contains('hidden')) return; c.classList.add('open'); const i = $('#chatinput'); i.focus(); G.typing = true; };
  ui.closeChat = function () { const c = $('#chat'); c.classList.remove('open'); $('#chatinput').blur(); G.typing = false; };
  $('#chatinput').addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') { const v = e.target.value.trim(); e.target.value = ''; if (v) G.flow.chat(v); ui.closeChat(); }
    else if (e.key === 'Escape') ui.closeChat();
  });
  window.addEventListener('keydown', e => {
    if (G.typing || G.modalOpen) return;
    if (e.key === 'Enter') { ui.openChat(); e.preventDefault(); }
    const n = parseInt(e.key, 10); if (n >= 1 && n <= G.EMOTES.length && !$('#hud').classList.contains('hidden')) G.flow.emote(G.EMOTES[n - 1][0]);
  });

  /* ---------- pausa por desconexión ---------- */
  ui.pause = function (on, who) {
    const p = $('#pause'); p.classList.toggle('hidden', !on);
    if (on) p.innerHTML = `<h2>⏸ JUEGO EN PAUSA</h2><div class="spin"></div><div style="font-size:26px">${esc(who || 'Tu pareja')} se desconectó.<br>El juego sigue cuando vuelva a conectarse.</div>
      <div class="small-note" style="color:#ddd;margin-top:8px">Si eres invitado, reintento solo. Si cerraste la pestaña, vuelve a entrar con el código <b>${esc(G.state.room.code || '')}</b>.</div>
      <button class="btn alt small" id="pq">Salir de la sala</button>`;
    if (on) p.querySelector('#pq').onclick = () => G.flow.leaveRoom();
  };

  /* ---------- helpers de formularios ---------- */
  function group(label) { const g = el('div', 'grp'); g.appendChild(el('label', '', label)); return g; }
  function chips(list, cur, fn) {
    const c = el('div', 'chips');
    list.forEach(([v, l, locked]) => { const b = el('button', 'btn' + (v === cur ? ' on' : '') + (locked ? ' lockd' : ''), l); b.onclick = () => { if (!locked) fn(v); }; c.appendChild(b); });
    return c;
  }
  function swatches(colors, cur, fn, custom) {
    const c = el('div', 'sw');
    colors.forEach(col => {
      const hex = Array.isArray(col) ? col[1] : col, name = Array.isArray(col) ? col[0] : hex;
      const b = el('button', hex === cur ? 'on' : ''); b.style.background = hex; b.title = name; b.onclick = () => fn(col); c.appendChild(b);
    });
    if (custom !== false) { const i = el('input'); i.type = 'color'; i.value = /^#[0-9a-f]{6}$/i.test(cur || '') ? cur : '#888888'; i.title = 'Color a tu gusto'; i.oninput = () => fn(i.value); c.appendChild(i); }
    return c;
  }
  const pick = c => Array.isArray(c) ? c[1] : c;

  /* ---------- CLÓSET ---------- */
  ui.closet = function () {
    const me = G.state.me; if (!me.id) return;
    const id = me.id, look = me.look, other = G.IDS[id].other;
    let tab = ui.lastTab || 'Pelo';
    G.modalOpen = true;
    const root = el('div', 'modal'), panel = el('div', 'panel'); root.appendChild(panel);
    const close = el('button', 'btn small xbtn', '✖ Cerrar'); close.onclick = () => { clearInterval(anim); root.remove(); G.modalOpen = false; G.save(); }; panel.appendChild(close);
    panel.appendChild(el('h2', '', '👕 Clóset de ' + esc(me.name)));
    const wrap = el('div', 'closet'); panel.appendChild(wrap);
    const pv = el('div', 'pv'); wrap.appendChild(pv);
    const views = el('div', 'views'), cvs = ['d', 'u', 'l', 'r'].map(() => el('canvas')); cvs.forEach(c => views.appendChild(c)); pv.appendChild(views);
    pv.appendChild(el('div', 'name', esc(me.name)));
    const pcv = el('canvas'); pv.appendChild(pcv);
    pv.appendChild(el('div', 'small-note', 'Todo se puede personalizar. Se guarda solo y tu pareja te ve al instante.'));
    let fr = 0;
    function drawPv() {
      const shown = tab === 'Playa' ? G.beachLook(look, id) : look;
      ['d', 'u', 'l', 'r'].forEach((d, i) => G.drawLook(cvs[i], shown, d, fr, 4, d === 'r'));
      G.drawPuffle(pcv, look.puffle, 4);
    }
    const anim = setInterval(() => { fr = (fr + 1) % 3; drawPv(); }, 280);
    const opts = el('div', 'opts'); wrap.appendChild(opts);
    const tabsEl = el('div', 'tabs'); opts.appendChild(tabsEl);
    const body = el('div', ''); opts.appendChild(body);
    const TABS = ['Pelo', 'Cara', 'Ropa', 'Zapatos', 'Accesorios', 'Playa', 'Puffle'];

    function commit() { G.save(); G.bus.emit('look'); drawPv(); render(); }
    function render() {
      tabsEl.innerHTML = ''; TABS.forEach(t => { const b = el('button', 'tab' + (t === tab ? ' on' : ''), t); b.onclick = () => { tab = ui.lastTab = t; drawPv(); render(); }; tabsEl.appendChild(b); });
      body.innerHTML = '';
      const add = (label, node) => { const g = group(label); g.appendChild(node); body.appendChild(g); };
      const o = look.outfit, t = o.top, bt = o.bottom, sh = o.shoes, acc = look.acc;
      if (tab === 'Pelo') {
        add('Looks favoritos', chips(G.PRESETS[id].looks.map((l, i) => [i, l.name]), -1, i => { look.hair = Object.assign({}, G.PRESETS[id].looks[i].hair); commit(); }));
        add('Estilo', chips(G.HAIR_STYLES, look.hair.style, v => { look.hair.style = v; commit(); }));
        add('Color', swatches(G.HAIR_COLORS, look.hair.color, c => { look.hair.color = pick(c); look.hair.color2 = Array.isArray(c) ? c[2] : undefined; commit(); }));
        const lg = el('div', 'sw'); const li = el('input'); li.type = 'color'; li.value = look.hair.color2 || '#d4701f'; li.oninput = () => { look.hair.color2 = li.value; drawPv(); G.save(); G.bus.emit('look'); };
        const nl = el('button', 'btn small', 'Sin luces'); nl.onclick = () => { look.hair.color2 = undefined; commit(); }; lg.append(li, nl); add('Luces / mechas', lg);
      } else if (tab === 'Cara') {
        add('Piel', swatches(G.SKINS, look.skin, c => { look.skin = pick(c); commit(); }));
        add('Ojos', chips([['dot', 'Normales'], ['lash', 'Pestañas'], ['happy', 'Felices']], look.eyeStyle, v => { look.eyeStyle = v; commit(); }));
        add('Boca', chips([['smile', 'Sonrisa'], ['grin', 'Sonrisón']], look.mouth, v => { look.mouth = v; commit(); }));
        add('Mejillas', chips([[true, 'Con rubor'], [false, 'Sin rubor']], look.blush !== false, v => { look.blush = v; commit(); }));
        add('Lentes', chips([['none', 'Sin lentes'], ['rect', 'Rectangulares'], ['round', 'Redondos'], ['sun', 'De sol']], look.glasses.type, v => { look.glasses.type = v; commit(); }));
        add('Color de lentes', swatches(['#1c1c24', '#6b3a22', '#c33a6a', '#2f6bd6', '#d9b04a', '#fffaf0'], look.glasses.color, c => { look.glasses.color = pick(c); commit(); }));
        add('Aretes', chips([['none', 'Sin aretes'], ['flower', 'Flor dorada'], ['stud', 'Topitos'], ['hoop', 'Argollas']], look.earrings || 'none', v => { look.earrings = v; commit(); }));
      } else if (tab === 'Ropa') {
        add('Mis outfits', chips(G.PRESETS[id].outfits.map((x, i) => [i, x.name]), look.outfitIdx, i => { G.applyOutfit(look, G.PRESETS[id].outfits[i]); look.outfitIdx = i; commit(); }));
        add('Outfits de ' + G.IDS[other].short, chips(G.PRESETS[other].outfits.map((x, i) => [i, x.name]), -1, i => { G.applyOutfit(look, G.PRESETS[other].outfits[i]); look.outfitIdx = -1; commit(); }));
        add('Arriba', chips([['tee', 'Polo'], ['long', 'Manga larga'], ['shirt', 'Camisa'], ['tank', 'Top'], ['cheer', 'Porrista'], ['dress', 'Vestido']], t.style, v => { t.style = v; look.outfitIdx = -1; commit(); }));
        add('Color de arriba', swatches(G.SWATCH, t.color, c => { t.color = pick(c); commit(); }));
        add('Manga interior (opcional)', (() => { const d = el('div', 'sw'); d.appendChild(swatches(G.SWATCH, t.under, c => { t.under = pick(c); commit(); })); const n = el('button', 'btn small', 'Ninguna'); n.onclick = () => { t.under = undefined; commit(); }; d.appendChild(n); return d; })());
        add('Estampado', chips([['none', 'Liso'], ['stripe', 'Rayas'], ['dots', 'Puntos'], ['floral', 'Flores'], ['lemons', 'Limones'], ['paisley', 'Paisley'], ['print', 'Dibujos'], ['logo', 'Logo']], t.pattern || 'none', v => { t.pattern = v; t.p1 = t.p1 || '#fffaf0'; t.p2 = t.p2 || '#e1593f'; commit(); }));
        if (t.pattern && t.pattern !== 'none') { add('Colores del estampado', (() => { const d = el('div', 'sw'); d.append(swatches(G.SWATCH, t.p1, c => { t.p1 = pick(c); commit(); }), swatches(G.SWATCH, t.p2, c => { t.p2 = pick(c); commit(); })); return d; })()); }
        if (t.style !== 'dress') {
          add('Abajo', chips([['pants', 'Pantalón'], ['shorts', 'Short'], ['skirt', 'Falda']], bt.style, v => { bt.style = v; look.outfitIdx = -1; commit(); }));
          add('Color de abajo', swatches(G.SWATCH, bt.color, c => { bt.color = pick(c); commit(); }));
        }
      } else if (tab === 'Zapatos') {
        add('Tipo', chips([['sneaker', 'Zapatillas'], ['boot', 'Botines'], ['sandal', 'Sandalias'], ['formal', 'Zapatos']], sh.type, v => { sh.type = v; commit(); }));
        add('Color', swatches(['#fffaf0', '#1b1b1f', '#5a3b24', '#c9a77a', '#d9262c', '#ff7aa8', '#8a5cf6', '#4aa6a0', '#ffd24a'], sh.color, c => { sh.color = pick(c); commit(); }));
      } else if (tab === 'Accesorios') {
        add('Sombrero', chips([['none', 'Ninguno'], ['gorro', 'Gorro'], ['cap', 'Gorra'], ['boina', 'Boina'], ['lazo', 'Lazo'], ['corona', 'Corona']], acc.hat || 'none', v => { acc.hat = v; commit(); }));
        add('Color del sombrero', swatches(G.SWATCH, acc.hatColor, c => { acc.hatColor = pick(c); commit(); }));
        add('Bufanda / pañuelo', (() => { const d = el('div', 'sw'); d.appendChild(swatches(['#d9672b', '#ff7aa8', '#8a5cf6', '#4aa6a0', '#ffd24a', '#d9262c'], acc.scarf, c => { acc.scarf = pick(c); commit(); })); const n = el('button', 'btn small', 'Ninguna'); n.onclick = () => { acc.scarf = 'none'; commit(); }; d.appendChild(n); return d; })());
        add('Mochila', chips([[false, 'No'], [true, 'Sí']], !!acc.backpack, v => { acc.backpack = v; commit(); }));
        add('Lentes de sol en la cabeza', chips([[false, 'No'], [true, 'Sí']], !!acc.sunOnHead, v => { acc.sunOnHead = v; commit(); }));
        const brk = G.J ? G.J.beltOf((G.state.belts[id]) || 0) : 0;
        if (G.J) add('🥋 Bufanda de Card-jitsu (se gana en el Dojo)', chips([['none', 'Ninguno']].concat(G.J.BELTS.slice(0, brk + 1).map((b, k) => [k, b.name])), typeof acc.belt === 'number' ? acc.belt : 'none', v => { acc.belt = v; commit(); }));
        const unlocked = G.state.session.boba[id];
        add('🧋 Bubble tea (premio de Kennedy, solo esta sesión)', chips([[false, 'No'], [true, unlocked ? 'Sí 🧋' : '🔒 bloqueado', !unlocked]], !!acc.boba, v => { acc.boba = v; commit(); }));
      } else if (tab === 'Playa') {
        add('Traje de baño (se usa en Callao y Los Yuyos)', chips(G.SWIMSUITS[id].map((x, i) => [i, x.name]), look.swim || 0, i => { look.swim = i; commit(); }));
        add('', el('div', 'hint', 'Aquí se ve tu traje de baño. En el mapa de Lima los trajes salen solo en las playas.'));
      } else if (tab === 'Puffle') {
        add('Color', swatches(['#e63946', '#6fd0ff', '#ffd24a', '#ff8fc0', '#8a5a3a'], look.puffle.color, c => { look.puffle.color = pick(c); commit(); }));
        add('Pelito del puffle', chips(G.PUFFLE_HAIRS, look.puffle.hair === undefined ? 'puntas' : look.puffle.hair, v => { look.puffle.hair = v; commit(); }));
        add('Color del pelito', swatches(G.PUFFLE_HAIRCOLORS.filter(x => x !== 'auto'), look.puffle.hairColor || '', c => { look.puffle.hairColor = pick(c); commit(); }));
        add('', chips([['auto', 'Color automático']], look.puffle.hairColor || 'auto', v => { look.puffle.hairColor = 'auto'; commit(); }));
        add('Sombrerito', chips([['none', 'Nada'], ['gorro', 'Gorro'], ['corona', 'Corona'], ['lazo', 'Lazo']], look.puffle.hat || 'none', v => { look.puffle.hat = v; commit(); }));
      }
    }
    drawPv(); render();
    $('#ui').appendChild(root);
  };

  /* ---------- AJUSTES ---------- */
  ui.settings = function () {
    const S = G.state.settings; G.modalOpen = true;
    const root = el('div', 'modal'), panel = el('div', 'panel'); root.appendChild(panel);
    const close = el('button', 'btn small xbtn', '✖ Cerrar'); close.onclick = () => { root.remove(); G.modalOpen = false; G.save(); }; panel.appendChild(close);
    panel.appendChild(el('h2', '', '⚙ Ajustes'));
    const body = el('div', ''); panel.appendChild(body);
    function render() {
      body.innerHTML = '';
      const add = (l, n) => { const g = group(l); g.appendChild(n); body.appendChild(g); };
      add('Música', chips([[true, '🔊 Con música'], [false, '🔇 Silencio']], S.music, v => { S.music = v; G.bus.emit('settings'); G.save(); render(); }));
      const vr = el('input'); vr.type = 'range'; vr.min = 0; vr.max = 100; vr.value = Math.round(S.vol * 100); vr.oninput = () => { S.vol = vr.value / 100; G.bus.emit('settings'); G.save(); }; add('Volumen', vr);
      add('Día / noche (mapa, casas y lugares)', chips([['auto', '🕒 Según la hora'], ['day', '☀ Día'], ['night', '🌙 Noche']], S.time, v => { S.time = v; G.save(); G.bus.emit('daynight'); render(); }));
      const nmi = el('input'); nmi.type = 'text'; nmi.maxLength = 14; nmi.value = G.state.me.name || ''; nmi.onchange = () => { if (nmi.value.trim()) G.flow.setName(nmi.value.trim()); }; add('Tu nombre', nmi);

      const sg = group('Marcador de soles (' + esc(nm('dani')) + ' +, ' + esc(nm('sebas')) + ' −). Una sola partida; aquí puedes cambiarlo.');
      const r = el('div', 'row'); const ni = el('input'); ni.type = 'number'; ni.min = -50; ni.max = 50; ni.value = G.state.balance; ni.style.width = '110px';
      const ap = el('button', 'btn small', 'Aplicar a ' + esc(nm('dani'))); ap.onclick = () => { G.setBalance(+ni.value || 0); render(); };
      const rs = el('button', 'btn small alt', 'Reiniciar a 0'); rs.onclick = () => { if (confirm('¿Reiniciar el marcador de soles a 0?')) { G.resetScore(); render(); } };
      r.append(ni, ap, rs); sg.appendChild(r); body.appendChild(sg);

      const rg = group('Récords y quién gana (se guardan siempre)'); const rec = el('div', 'rec');
      const R = G.state.records, names = { connect4: 'Cuatro en raya', kennedy: 'Parque Kennedy', pucp: 'PUCP (esconderse)', pollos: 'El Pollo Pier', cocina: 'Los Ccellis (ramen)', salsa: 'Academia Saoco', carjitsu: 'Card-jitsu' };
      let h = `<table><tr><th>Juego</th><th>${esc(nm('sebas'))}</th><th>${esc(nm('dani'))}</th></tr>`;
      Object.keys(names).forEach(k => { const g = R.games[k] || { dani: 0, sebas: 0 }; h += `<tr><td>${names[k]}</td><td>${g.sebas}</td><td>${g.dani}</td></tr>`; });
      [['salsa_facil', 'Saoco VS yo · Fácil'], ['salsa_normal', 'Saoco VS yo · Normal'], ['salsa_dificil', 'Saoco VS yo · Difícil']].forEach(([k, t]) => { const b = R.best[k] || { dani: 0, sebas: 0 }; h += `<tr><td>${t} <small>(mejor puntaje)</small></td><td>${b.sebas}</td><td>${b.dani}</td></tr>`; });
      h += `<tr><td><b>Partidas de 50 soles ganadas</b></td><td>${R.matches.sebas}</td><td>${R.matches.dani}</td></tr></table>`;
      rec.innerHTML = h; rg.appendChild(rec);
      const rr = el('button', 'btn small alt', 'Borrar récords'); rr.onclick = () => { if (confirm('¿Borrar TODOS los récords? No se puede deshacer.')) { G.resetRecords(); render(); } }; rg.appendChild(rr); body.appendChild(rg);

      const cg = group('Sala'); cg.appendChild(el('div', '', G.state.room.code ? 'Código: <b>' + esc(G.state.room.code) + '</b>' : 'Sin sala todavía'));
      const fs = el('button', 'btn small', '⛶ Pantalla completa'); fs.onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); }; cg.appendChild(fs);
      const rp = el('button', 'btn small', '📖 Ver la historia otra vez'); rp.onclick = () => { G.state.storySeen = false; G.save(); ui.toast('La historia se verá al próximo inicio'); }; cg.appendChild(rp);
      body.appendChild(cg);
    }
    render(); $('#ui').appendChild(root);
  };
})();
