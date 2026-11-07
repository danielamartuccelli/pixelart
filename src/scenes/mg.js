/* ===========================================================
   scenes/mg.js — utilidades compartidas por los minijuegos de la etapa 6
   (Pollos y Saoco): botones pixel, red y generador de números con semilla.
   =========================================================== */
(function () {
  const G = window.G;
  const mg = G.mg = {};

  /* generador con semilla (igual en las dos laptops) */
  mg.rng = function (seed) {
    let a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  };
  mg.lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

  mg.send = function (t, d) { if (G.net.connected) G.net.send(t, d); };

  /* registra manejadores de red y los quita solos al cerrar la escena */
  mg.bind = function (scene, list) {
    const net = G.net;
    list.forEach(([t, f]) => (net.handlers[t] = net.handlers[t] || []).push(f));
    scene.events.once('shutdown', () => list.forEach(([t, f]) => { net.handlers[t] = (net.handlers[t] || []).filter(x => x !== f); }));
  };

  /* botón pixel (dibujo + texto + zona clicable). 'add' guarda los objetos para poder destruirlos */
  mg.btn = function (scene, add, x, y, w, h, label, color, fn, depth, fs) {
    const g = add(scene.add.graphics().setDepth(depth + 1));
    g.fillStyle(0x2b1b30).fillRoundedRect(x - w / 2 + 1, y - h / 2 + 3, w, h, 4).fillStyle(color).fillRoundedRect(x - w / 2, y - h / 2, w, h, 4).lineStyle(1.5, 0x2b1b30).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 4);
    add(scene.add.text(x, y, label, { fontFamily: 'VT323', fontSize: (fs || 14) + 'px', color: '#2b1b30' }).setOrigin(0.5).setDepth(depth + 2));
    add(scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(depth + 3).on('pointerdown', () => { G.audio.sfx('click'); fn(); }));
  };

  /* panel oscuro con borde dorado */
  mg.panel = function (scene, add, x, y, w, h, depth) {
    const g = add(scene.add.graphics().setDepth(depth));
    g.fillStyle(0x2b1b30, 1).fillRoundedRect(x, y, w, h, 8).lineStyle(2, 0xffd24a).strokeRoundedRect(x, y, w, h, 8);
    return g;
  };

  /* nombre por id ('dani' | 'sebas') */
  mg.nameOf = function (id) {
    const s = G.state;
    return id === s.me.id ? s.me.name : (id === s.partner.id ? s.partner.name : (G.IDS[id] ? G.IDS[id].short : id));
  };
})();
