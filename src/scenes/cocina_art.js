/* ===========================================================
   scenes/cocina_art.js — arte procedural de LOS CCELLIS (iconos de ingredientes y estaciones)
   Todo se dibuja con Graphics (sin imágenes). Iconos de 12x12, estaciones de 16x16.
   =========================================================== */
(function () {
  const G = window.G, TS = 16, O = 0x2b1b30;

  /* ---------- iconos de 12x12 ---------- */
  const nido = (g, c1, c2, extra) => {
    g.fillStyle(O).fillEllipse(6, 7, 12, 9); g.fillStyle(c1).fillEllipse(6, 7, 10, 7);
    g.fillStyle(c2).fillRect(2, 6, 3, 1).fillRect(5, 5, 4, 1).fillRect(3, 8, 5, 1).fillRect(7, 7, 3, 1).fillRect(4, 4, 2, 1);
    if (extra) extra(g);
  };
  const ICON = {
    fideo(g) { g.fillStyle(O).fillRect(1, 0, 10, 12); g.fillStyle(0xf2d36b).fillRect(2, 1, 8, 10); g.fillStyle(0xe0b845); for (let x = 3; x < 10; x += 2) g.fillRect(x, 1, 1, 10); g.fillStyle(0xe63946).fillRect(2, 5, 8, 2); },
    fideo_c(g) { nido(g, 0xffe08a, 0xd9a93a, g2 => g2.fillStyle(0xffffff, 0.9).fillRect(4, 0, 1, 2).fillRect(7, 0, 1, 3)); },
    fideo_s(g) { nido(g, 0xd99a3a, 0x8a4a1a, g2 => g2.fillStyle(0x3aa05a).fillRect(3, 5, 1, 1).fillRect(8, 6, 1, 1).fillRect(5, 8, 1, 1)); },
    fideo_f(g) { nido(g, 0xfff3cf, 0xe0c27a, g2 => g2.fillStyle(0xffffff, 0.9).fillRect(5, 0, 1, 2).fillRect(8, 1, 1, 2)); },
    masa(g) { g.fillStyle(O).fillEllipse(6, 7, 12, 9); g.fillStyle(0xf6e7c4).fillEllipse(6, 7, 10, 7); g.fillStyle(0xffffff, 0.7).fillRect(3, 5, 3, 1); },
    masa_cortada(g) { g.fillStyle(O).fillRect(0, 2, 12, 8); g.fillStyle(0xf6e7c4).fillRect(1, 3, 10, 6); g.fillStyle(0xd8c08a); for (let x = 2; x < 11; x += 2) g.fillRect(x, 3, 1, 6); },
    hongo(g) { g.fillStyle(O).fillEllipse(6, 5, 12, 9).fillRect(4, 8, 4, 4); g.fillStyle(0xc98f5a).fillEllipse(6, 5, 10, 7); g.fillStyle(0xf4e6cf).fillRect(5, 8, 2, 3); g.fillStyle(0xe3b88a).fillRect(3, 3, 2, 1); },
    hongo_c(g) { [[3, 3], [8, 4], [5, 8]].forEach(([x, y]) => { g.fillStyle(O).fillEllipse(x, y, 6, 5); g.fillStyle(0xf4e6cf).fillEllipse(x, y, 4, 3); g.fillStyle(0xc98f5a).fillRect(x - 1, y, 2, 1); }); },
    huevo(g) { g.fillStyle(O).fillEllipse(6, 6, 9, 12); g.fillStyle(0xfff3dc).fillEllipse(6, 6, 7, 10); g.fillStyle(0xffffff).fillRect(4, 3, 1, 2); },
    huevo_h(g) { g.fillStyle(O).fillEllipse(6, 7, 9, 11); g.fillStyle(0xfff3dc).fillEllipse(6, 7, 7, 9); g.fillStyle(0xffffff, 0.9).fillRect(3, 0, 1, 2).fillRect(7, 0, 1, 2); },
    huevo_m(g) { g.fillStyle(O).fillEllipse(6, 6, 12, 9); g.fillStyle(0xffffff).fillEllipse(6, 6, 10, 7); g.fillStyle(0xffc83a).fillCircle(6, 6, 2.2); g.fillStyle(0xfff08a).fillRect(5, 5, 1, 1); },
    tocino(g) { g.fillStyle(O).fillRect(0, 1, 12, 10); g.fillStyle(0xe8707a).fillRect(1, 2, 10, 8); g.fillStyle(0xffd0d4); g.fillRect(1, 4, 10, 1).fillRect(1, 7, 10, 1); },
    tocino_f(g) { g.fillStyle(O).fillRect(0, 1, 12, 10); g.fillStyle(0xa5502a).fillRect(1, 2, 10, 8); g.fillStyle(0xd98a4a); g.fillRect(1, 4, 10, 1).fillRect(1, 7, 10, 1); g.fillStyle(0xffd27a).fillRect(2, 3, 2, 1); },
    aji(g) { g.fillStyle(O).fillRect(7, 0, 3, 3).fillEllipse(5, 7, 10, 6); g.fillStyle(0x3aa05a).fillRect(8, 1, 1, 2); g.fillStyle(0xe0312e).fillEllipse(5, 7, 8, 4).fillRect(7, 3, 2, 2); g.fillStyle(0xff8a80).fillRect(3, 6, 2, 1); },
    harina(g) { g.fillStyle(O).fillRect(1, 0, 10, 12); g.fillStyle(0xfafafa).fillRect(2, 1, 8, 10); g.fillStyle(0x6fa8d9).fillRect(2, 4, 8, 4); g.fillStyle(0xffffff).fillRect(5, 5, 2, 2); },
    salsa(g) { g.fillStyle(O).fillRect(3, 3, 6, 9).fillRect(4, 0, 4, 4); g.fillStyle(0xb03a2e).fillRect(4, 4, 4, 7); g.fillStyle(0xffd24a).fillRect(5, 1, 2, 2); g.fillStyle(0xffffff).fillRect(5, 6, 2, 2); },
    quemado(g) { g.fillStyle(O).fillEllipse(6, 8, 12, 8); g.fillStyle(0x3a3340).fillEllipse(6, 8, 10, 6); g.fillStyle(0x8a8a99, 0.9).fillRect(3, 1, 2, 3).fillRect(7, 0, 2, 4); },
    plato(g) { g.fillStyle(O).fillEllipse(6, 7, 12, 9); g.fillStyle(0x6fa8d9).fillEllipse(6, 7, 10, 7); g.fillStyle(0xffffff).fillEllipse(6, 7, 7.5, 4.8); g.fillStyle(0xd7e6f5).fillEllipse(6, 7.4, 5, 2.6); },
    plato_caldo(g) { g.fillStyle(O).fillEllipse(6, 7, 12, 9); g.fillStyle(0x6fa8d9).fillEllipse(6, 7, 10, 7); g.fillStyle(0xe8892a).fillEllipse(6, 7, 7.5, 4.8); g.fillStyle(0xffd24a).fillRect(3, 6, 2, 1).fillRect(5, 7, 3, 1).fillRect(7, 5, 2, 1); g.fillStyle(0x3aa05a).fillRect(8, 8, 1, 1); g.fillStyle(0xffffff, 0.85).fillRect(4, 0, 1, 3).fillRect(7, 1, 1, 3); }
  };
  [['sobre1', 0xffb347, 1], ['sobre2', 0xff5a3a, 2], ['sobre3', 0xa3122a, 3]].forEach(([k, col, n]) => {
    ICON[k] = g => { g.fillStyle(O).fillRect(1, 1, 10, 10); g.fillStyle(col).fillRect(2, 2, 8, 8); g.fillStyle(0xffffff, 0.35).fillRect(2, 2, 8, 2); for (let i = 0; i < n; i++) g.fillStyle(0xffe14a).fillRect(3 + i * 2, 5, 1, 4).fillRect(3 + i * 2, 4, 1, 1); };
  });
  G.K.ICONS = Object.keys(ICON);

  /* ---------- estaciones de 16x16 (vista desde arriba) ---------- */
  const base = (g, x, y, top, lip) => { g.fillStyle(lip).fillRect(x, y + 13, TS, 3); g.fillStyle(top).fillRect(x, y, TS, 13); g.fillStyle(0xffffff, 0.2).fillRect(x, y, TS, 1); };
  const STATION = {
    mesa(g, x, y) {   // mesa de cocinar rojiza ladrillo
      base(g, x, y, 0xc0553b, 0x7a2e22);
      g.fillStyle(0x8f3a28, 0.75).fillRect(x, y + 4, TS, 1).fillRect(x, y + 9, TS, 1).fillRect(x + 5, y, 1, 4).fillRect(x + 11, y + 5, 1, 4).fillRect(x + 3, y + 10, 1, 3);
      g.fillStyle(0xe08a6a, 0.45).fillRect(x + 1, y + 1, 4, 1).fillRect(x + 7, y + 6, 3, 1);
    },
    pase(g, x, y) { base(g, x, y, 0xf4d27a, 0xb5802a); g.fillStyle(O); g.fillRect(x + 3, y + 5, 10, 1).fillRect(x + 3, y + 8, 10, 1); g.fillTriangle(x + 2, y + 5.5, x + 5, y + 3, x + 5, y + 8); g.fillTriangle(x + 14, y + 8.5, x + 11, y + 6, x + 11, y + 11); },
    cajon(g, x, y) { base(g, x, y, 0xa87444, 0x5a3a1a); g.fillStyle(0x6b4a2a).fillRect(x, y + 4, TS, 1).fillRect(x, y + 9, TS, 1); g.lineStyle(1, O, 0.7).strokeRect(x + 0.5, y + 0.5, 15, 15); },
    plato(g, x, y) { base(g, x, y, 0xd9a066, 0x8a5a33); [[8, 8, 5.5], [8, 7, 4.5], [8, 6, 3.4]].forEach(([cx, cy, r], i) => { g.fillStyle(O).fillCircle(x + cx, y + cy, r + 0.6); g.fillStyle(i % 2 ? 0xe8f1ff : 0xffffff).fillCircle(x + cx, y + cy, r); }); },
    olla(g, x, y) { base(g, x, y, 0x6a6a80, 0x3a3a4e); g.fillStyle(O).fillCircle(x + 8, y + 7, 6.5); g.fillStyle(0xb9c0cc).fillCircle(x + 8, y + 7, 5.6); g.fillStyle(0x6fc3e8).fillCircle(x + 8, y + 7, 4); g.fillStyle(0xffffff, 0.7).fillRect(x + 5, y + 5, 2, 1); g.fillStyle(O).fillRect(x, y + 6, 2, 2).fillRect(x + 14, y + 6, 2, 2); },
    sarten(g, x, y) { base(g, x, y, 0x6a6a80, 0x3a3a4e); g.fillStyle(O).fillCircle(x + 7, y + 7, 6); g.fillStyle(0x4a4a58).fillCircle(x + 7, y + 7, 5); g.fillStyle(0x6a6a7a).fillRect(x + 4, y + 5, 2, 1); g.fillStyle(O).fillRect(x + 11, y + 6, 5, 2); g.fillStyle(0x8a5a33).fillRect(x + 12, y + 6, 3, 1); },
    tabla(g, x, y) { base(g, x, y, 0xd9a066, 0x8a5a33); g.fillStyle(O).fillRect(x + 1, y + 2, 14, 10); g.fillStyle(0xf0cf94).fillRect(x + 2, y + 3, 12, 8); g.fillStyle(0xd1ad6e).fillRect(x + 3, y + 5, 7, 1); g.fillStyle(O).fillRect(x + 9, y + 7, 6, 3); g.fillStyle(0xe9eef5).fillRect(x + 10, y + 7, 4, 2); g.fillStyle(0x8a5a33).fillRect(x + 13, y + 8, 2, 1); },
    sobre(g, x, y) { base(g, x, y, 0xffb6c9, 0xc96a86); g.fillStyle(O).fillRect(x + 2, y + 3, 12, 9); g.fillStyle(0xffffff).fillRect(x + 3, y + 4, 10, 7); g.fillStyle(0xe0312e).fillTriangle(x + 3, y + 4, x + 13, y + 4, x + 8, y + 8); g.fillStyle(0xffe14a).fillRect(x + 7, y + 9, 2, 1); },
    amasadora(g, x, y) { base(g, x, y, 0xfaf3e0, 0xc9b88a); g.fillStyle(0xffffff, 0.9).fillCircle(x + 5, y + 5, 3).fillCircle(x + 11, y + 8, 2); g.fillStyle(O).fillRect(x + 1, y + 6, 14, 3); g.fillStyle(0xb5803f).fillRect(x + 2, y + 7, 12, 1); g.fillStyle(O).fillRect(x, y + 5, 2, 5).fillRect(x + 14, y + 5, 2, 5); },
    caldero(g, x, y) { base(g, x, y, 0x6a6a80, 0x3a3a4e); g.fillStyle(O).fillCircle(x + 8, y + 7, 7.4); g.fillStyle(0xe08a2a).fillCircle(x + 8, y + 7, 6.5); g.fillStyle(0xf6c04a).fillCircle(x + 8, y + 7, 5); g.fillStyle(0xfff0a0).fillRect(x + 5, y + 5, 3, 1).fillRect(x + 9, y + 8, 2, 1); g.fillStyle(O).fillRect(x, y + 6, 2, 2).fillRect(x + 14, y + 6, 2, 2); },
    vent(g, x, y) { base(g, x, y, 0x7fd1ae, 0x3a8a6e); g.fillStyle(0xffffff, 0.35).fillRect(x + 1, y + 1, 14, 3); g.fillStyle(O).fillCircle(x + 8, y + 8, 4.6); g.fillStyle(0xffd24a).fillCircle(x + 8, y + 8, 3.8); g.fillStyle(0xfff08a).fillRect(x + 6, y + 6, 2, 1); g.fillStyle(O).fillRect(x + 7, y + 11, 2, 1); },
    basurero(g, x, y) { base(g, x, y, 0xcfd6e2, 0x8a93a6); g.fillStyle(O).fillCircle(x + 8, y + 7, 6); g.fillStyle(0x8a93a6).fillCircle(x + 8, y + 7, 5); g.fillStyle(0x4a5060).fillCircle(x + 8, y + 7, 3); g.fillStyle(0xcfd6e2).fillRect(x + 7, y + 3, 2, 1); }
  };
  /* Decoración de la casa de Daniela (solo adorno, no estorba): tenedor morado GIGANTE, flor morada parada
     (tallo verde, centro rojo) y popcorn gigante. Se pinta sobre la pared de abajo. */
  G.K.drawDecor = function (g, y0) {
    const P = 0x8a4fd0, PL = 0xb98af0, y = y0 + 8;
    // repisa de madera en la pared de arriba
    g.fillStyle(O).fillRect(0, y + 10, 400, 2).fillStyle(0x8a5a33).fillRect(0, y + 10, 400, 1);
    // tenedor morado GIGANTE (apoyado en la pared, de lado)
    const fk = 232;
    g.fillStyle(O).fillRect(fk, y - 3, 44, 6).fillRect(fk + 44, y - 6, 4, 12).fillRect(fk + 48, y - 6, 22, 3).fillRect(fk + 48, y - 1, 22, 3).fillRect(fk + 48, y + 4, 22, 3);
    g.fillStyle(P).fillRect(fk + 1, y - 2, 42, 4).fillRect(fk + 44, y - 5, 3, 10).fillRect(fk + 47, y - 5, 22, 2).fillRect(fk + 47, y, 22, 2).fillRect(fk + 47, y + 5, 22, 1);
    g.fillStyle(PL).fillRect(fk + 2, y - 2, 40, 1).fillRect(fk + 47, y - 5, 22, 1);
    // flor morada parada: tallo verde y centro rojo
    const fx = 118;
    g.fillStyle(O).fillRect(fx - 1, y + 2, 3, 8); g.fillStyle(0x3aa05a).fillRect(fx, y + 2, 1, 8).fillRect(fx + 1, y + 5, 3, 1).fillRect(fx - 3, y + 7, 3, 1);
    const pet = [[0, -5], [5, -1], [-5, -1], [3, 4], [-3, 4]];
    pet.forEach(([dx, dy]) => { g.fillStyle(O).fillCircle(fx + dx, y + dy - 2, 3.6); });
    pet.forEach(([dx, dy]) => { g.fillStyle(P).fillCircle(fx + dx, y + dy - 2, 2.9); g.fillStyle(PL).fillRect(fx + dx - 1, y + dy - 4, 1, 1); });
    g.fillStyle(O).fillCircle(fx, y - 2, 2.8).fillStyle(0xe0312e).fillCircle(fx, y - 2, 2.2).fillStyle(0xff8a80).fillRect(fx - 1, y - 3, 1, 1);
    // popcorn gigante (cubo a rayas con palomitas)
    const cx = 342;
    g.fillStyle(O).fillRect(cx - 9, y - 3, 18, 13); g.fillStyle(0xfafafa).fillRect(cx - 8, y - 2, 16, 11);
    for (let i = 0; i < 4; i++) g.fillStyle(0xe63946).fillRect(cx - 8 + i * 4 + 1, y - 2, 2, 11);
    const pc = [[-6, -4], [-2, -6], [2, -5], [6, -4], [-4, -2], [0, -3], [4, -2]];
    pc.forEach(([dx, dy]) => { g.fillStyle(O).fillCircle(cx + dx, y + dy - 1, 3.2); });
    pc.forEach(([dx, dy], i) => { g.fillStyle(i % 2 ? 0xfff3b0 : 0xffffff).fillCircle(cx + dx, y + dy - 1, 2.5); g.fillStyle(0xffd24a).fillRect(cx + dx, y + dy - 1, 1, 1); });
  };
  G.K.drawStation = function (g, kind, x, y) { (STATION[kind] || STATION.mesa)(g, x, y); };

  G.K.makeTextures = function (scene) {
    const mk = (key, w, h, fn) => {
      if (scene.textures.exists(key)) return;
      const g = scene.make.graphics({ x: 0, y: 0, add: false }); fn(g); g.generateTexture(key, w, h); g.destroy();
    };
    Object.keys(ICON).forEach(k => mk('ci_' + k, 12, 12, g => ICON[k](g)));
    Object.keys(STATION).forEach(k => mk('cs_' + k, TS, TS, g => STATION[k](g, 0, 0)));
    mk('c_hat', 12, 9, g => { g.fillStyle(O).fillEllipse(6, 4, 12, 8).fillRect(1, 5, 10, 4); g.fillStyle(0xffffff).fillEllipse(6, 4, 10, 6).fillRect(2, 5, 8, 3); g.fillStyle(0xdfe8f5).fillRect(2, 7, 8, 1); });
    mk('c_spark', 5, 5, g => { g.fillStyle(0xffffff).fillRect(2, 0, 1, 5).fillRect(0, 2, 5, 1); });
    // cartelito "LOS CCELLIS"
    mk('c_star', 7, 7, g => { g.fillStyle(0xffd24a).fillRect(3, 0, 1, 7).fillRect(0, 3, 7, 1).fillRect(1, 1, 5, 5); });
  };
})();
