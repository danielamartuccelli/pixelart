/* ===========================================================
   sprites.js — personajes pixel art PROCEDURALES (sin imágenes)
   Cada personaje es 16x26 px (+ contorno oscuro = 18x28), chibi.
   Se dibuja desde un objeto "look", así el clóset puede cambiar
   TODO (pelo, piel, lentes, ropa, zapatos, accesorios, puffle).
   Las fotos originales NO se suben al repo: solo estos datos.
   =========================================================== */
(function () {
  const G = window.G;
  const OUT = '#2b1b30', W = 16, H = 26, FW = 18, FH = 28;

  /* ---------- color ---------- */
  function h2r(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function r2h(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function shade(h, a) { const [r, g, b] = h2r(h); return a >= 0 ? r2h(r + (255 - r) * a, g + (255 - g) * a, b + (255 - b) * a) : r2h(r * (1 + a), g * (1 + a), b * (1 + a)); }
  G.shade = shade;

  /* ---------- buffer de píxeles ---------- */
  const nb = () => Array.from({ length: H }, () => new Array(W).fill(null));
  function P(b, x, y, c) { if (c && x >= 0 && x < W && y >= 0 && y < H) b[y][x] = c; }
  function R(b, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(b, x + i, y + j, c); }
  function RS(b, list, c) { list.forEach(r => R(b, r[0], r[1], r[2], r[3], c)); }

  /* ---------- pelo ---------- */
  const HAIR = {
    // front = encima de la cabeza; back = detrás del cuerpo (pelo largo)
    bald:      { d: { f: [] }, l: { f: [] }, u: { f: [] } },
    muyCorto:  { d: { f: [[4,2,8,1],[3,3,10,2],[3,5,1,1],[12,5,1,1]] },
                 l: { f: [[5,2,7,1],[4,3,9,2],[9,5,4,3]] }, u: { f: [[4,2,8,1],[3,3,10,7]] } },
    cocoCorto: { d: { f: [[4,2,8,1],[3,3,10,3],[3,6,1,3],[12,6,1,3]] },
                 l: { f: [[5,2,7,1],[4,3,9,3],[9,6,4,4]] }, u: { f: [[4,2,8,1],[3,3,10,8]] } },
    cocoLargo: { d: { f: [[4,1,8,1],[3,2,10,5],[2,3,2,9],[12,3,2,9]] },
                 l: { f: [[5,1,7,1],[4,2,9,5],[8,7,5,5]] }, u: { f: [[4,1,8,1],[2,2,12,10]] } },
    bob:       { d: { f: [[4,2,8,1],[3,3,10,3],[2,4,2,8],[12,4,2,8]] },
                 l: { f: [[5,2,7,1],[4,3,9,3],[8,6,6,6]] }, u: { f: [[4,2,8,1],[2,3,12,10]] } },
    largoLiso: { d: { f: [[4,2,8,1],[3,3,10,2],[3,5,3,1],[10,5,3,1],[4,13,1,6],[11,13,1,6]], b: [[2,4,12,15]] },
                 l: { f: [[5,2,7,1],[4,3,9,2],[4,5,3,1],[9,5,4,8]], b: [[8,10,6,9]] }, u: { f: [[4,2,8,1],[3,3,10,9],[2,5,12,14]] } },
    ondas:     { d: { f: [[4,2,8,1],[3,3,10,2],[3,5,3,1],[10,5,3,1],[4,13,1,6],[11,13,1,6]], b: [[2,4,12,15],[1,7,1,3],[14,7,1,3],[1,13,1,4],[14,13,1,4]] },
                 l: { f: [[5,2,7,1],[4,3,9,2],[4,5,3,1],[9,5,4,8],[13,8,1,4]], b: [[8,10,7,9],[14,13,1,3]] }, u: { f: [[4,2,8,1],[3,3,10,9],[1,5,14,14]] } },
    mono:      { d: { f: [[4,2,8,1],[3,3,10,2],[3,5,1,1],[12,5,1,1],[6,0,4,2]] },
                 l: { f: [[5,2,7,1],[4,3,9,2],[9,5,4,3],[7,0,4,2]] }, u: { f: [[4,2,8,1],[3,3,10,7],[6,0,4,2]] } }
  };
  G.HAIR_STYLES = [['bald', 'Pelado'], ['muyCorto', 'Muy corto'], ['cocoCorto', 'Coco corto'], ['cocoLargo', 'Coco largo'],
                   ['bob', 'Bob'], ['largoLiso', 'Largo liso'], ['ondas', 'Ondas'], ['mono', 'Moño']];

  function hairRects(b, rects, hc, hc2) {
    const hd = shade(hc, -0.22), hl = shade(hc, 0.18);
    rects.forEach(r => {
      for (let y = r[1]; y < r[1] + r[3]; y++) for (let x = r[0]; x < r[0] + r[2]; x++) {
        let c = hc;
        if (hc2 && ((x * 3 + y * 2) % 5 === 0)) c = hc2;        // luces
        else if ((x + y * 2) % 7 === 0) c = hd;
        else if (y === r[1] && (x % 3 === 0)) c = hl;
        P(b, x, y, c);
      }
    });
  }

  /* ---------- patrones de ropa ---------- */
  function pattern(b, t, x0, y0, w, h) {
    const p = t.pattern; if (!p || p === 'none') return;
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const hh = ((x * 13 + y * 7) ^ (x * y)) % 11;
      if (p === 'stripe' && y % 3 === 0) P(b, x, y, t.p1);
      else if (p === 'floral') { if (hh % 5 === 0) P(b, x, y, t.p1); else if (hh % 7 === 3) P(b, x, y, t.p2); }
      else if (p === 'lemons') { if ((x + 2 * y) % 6 === 0) P(b, x, y, t.p1); else if ((x * 2 + y) % 7 === 3) P(b, x, y, t.p2); }
      else if (p === 'paisley') { if (hh % 6 === 0) P(b, x, y, t.p1); else if (hh % 6 === 2) P(b, x, y, t.p2); }
      else if (p === 'dots' && (x + y) % 3 === 0 && hh % 2 === 0) P(b, x, y, t.p1);
      else if (p === 'cheer') { if (y === y0 + h - 2) P(b, x, y, t.p1); else if (y === y0 + h - 1) P(b, x, y, t.p2); }
    }
    if (p === 'print') { R(b, x0 + 1, y0 + 1, 2, 2, t.p1); R(b, x0 + 4, y0 + 2, 2, 3, t.p2); R(b, x0 + 2, y0 + 4, 3, 1, t.p3 || t.p1); }
    if (p === 'logo') { R(b, 7, 15, 2, 2, t.p1); P(b, 7, 14, t.p1); P(b, 8, 17, t.p1); }
  }

  /* ---------- zapatos ---------- */
  function shoe(b, x, y, sh, w) {
    const c = sh.color, sole = sh.type === 'sneaker' ? '#f5f5f0' : shade(c, -0.5);
    if (sh.type === 'boot') R(b, x, y - 1, w - 1, 1, c);
    if (sh.type === 'sandal') { for (let i = 0; i < w; i += 2) P(b, x + i, y, c); R(b, x, y + 1, w, 1, sole); return; }
    R(b, x, y, w, 1, c);
    if (sh.type === 'formal') P(b, x + 1, y, shade(c, 0.35));
    R(b, x, y + 1, w, 1, sole);
  }

  /* ---------- construir un cuadro ---------- */
  function build(look, dir, fr) {
    const b = nb(), o = look.outfit, t = o.top, bt = o.bottom, sh = o.shoes;
    const skin = look.skin, skinD = shade(skin, -0.14);
    const hc = look.hair.color, hc2 = look.hair.color2 || null, hs = look.hair.style;
    const dress = t.style === 'dress', skirt = bt.style === 'skirt' || dress;
    const side = dir === 'l', back = dir === 'u';
    const acc = look.acc || {};
    const H_ = (HAIR[hs] || HAIR.bald)[dir];
    const lift = fr === 1 ? [1, 0] : fr === 2 ? [0, 1] : [0, 0];

    // 1) pelo detrás
    if (H_.b) hairRects(b, H_.b, hc, hc2);

    // 2) piernas + zapatos
    if (!side) {
      [4, 9].forEach((x, i) => {
        const lf = lift[i], end = 23 - lf;
        for (let y = 19; y <= end; y++) {
          if (skirt) { if (y >= 22) R(b, x, y, 3, 1, skin); }
          else if (bt.style === 'shorts' || bt.style === 'bikini') R(b, x, y, 3, 1, y <= (bt.style === 'bikini' ? 19 : 21) ? bt.color : skin);
          else R(b, x, y, 3, 1, bt.color);
        }
        shoe(b, i === 0 ? x - 1 : x, 24 - lf, sh, 4);
      });
      if (!skirt) R(b, 7, 19, 2, 2, bt.color);
    } else {
      const xs = fr === 0 ? [6, 6] : fr === 1 ? [8, 4] : [4, 8];   // [atrás, adelante]
      xs.forEach((x, i) => {
        for (let y = 19; y <= 23; y++) {
          if (skirt) { if (y >= 22) R(b, x, y, 3, 1, skin); }
          else if (bt.style === 'shorts' || bt.style === 'bikini') R(b, x, y, 3, 1, y <= (bt.style === 'bikini' ? 19 : 21) ? bt.color : skin);
          else R(b, x, y, 3, 1, bt.color);
        }
        shoe(b, x - 1, 24, sh, 4);
      });
    }

    // 3) torso
    const tx = side ? 5 : 4, tw = side ? 6 : 8;
    if (t.style === 'bikini') {            // traje de baño: solo el pecho va con color (cuadrado = escote cuadrado)
      R(b, tx, 13, tw, 6, skin); R(b, tx, 14, tw, 2, t.color); if (t.cut !== 'square') R(b, tx, 13, tw, 1, t.color); else { R(b, tx, 13, 1, 1, t.color); R(b, tx + tw - 1, 13, 1, 1, t.color); }
      if (!side) R(b, 7, 16, 2, 1, shade(t.color, -0.25));
    } else if (t.style === 'bare') R(b, tx, 13, tw, 6, skin);   // torso al aire (short de baño de Sebas)
    else R(b, tx, 13, tw, 6, t.color);
    if (skirt) {
      const sc = dress ? t.color : bt.color;
      R(b, side ? 4 : 3, 19, side ? 8 : 10, 2, sc); R(b, side ? 3 : 2, 21, side ? 10 : 12, 1, sc);
      if (dress) pattern(b, t, side ? 3 : 2, 19, side ? 10 : 12, 3);
    }
    pattern(b, t, tx, 13, tw, t.style === 'bikini' ? 3 : (t.style === 'bare' ? 0 : 6));
    if (!back) {
      if (t.style === 'shirt') {
        if (!side) { R(b, 5, 13, 2, 1, '#fffaf0'); R(b, 9, 13, 2, 1, '#fffaf0'); R(b, 7, 14, 2, 5, shade(t.color, -0.12)); P(b, 7, 15, '#2b1b30'); P(b, 7, 17, '#2b1b30'); }
        else R(b, 5, 13, 2, 1, '#fffaf0');
      } else if (!side) R(b, 6, 13, 4, 1, skin);
    }

    // 3b) bufanda de Card-jitsu (accesorio que se gana en el Dojo; acc.belt = rango 0..5)
    if (typeof (look.acc || {}).belt === 'number' && look.acc.belt >= 0 && G.J && G.J.BELTS[look.acc.belt]) {
      const bc = G.J.BELTS[look.acc.belt].color, dk = look.acc.belt === 5 ? '#2b1b30' : shade(bc, -0.25);
      R(b, tx - 1, 12, tw + 2, 2, bc); R(b, tx - 1, 13, tw + 2, 1, dk);
      if (look.acc.belt === 5) { P(b, tx, 12, '#ffe58a'); P(b, tx + tw - 1, 12, '#ffe58a'); }
      if (!back && !side) { R(b, 9, 14, 3, 5, bc); R(b, 9, 18, 3, 1, dk); }
      else if (side) { R(b, tx - 1, 14, 2, 5, bc); R(b, tx - 1, 18, 2, 1, dk); }
    }

    // 4) brazos
    const nSleeve = { tee: 2, long: 5, shirt: 5, cheer: 0, tank: 0, dress: 0 }[t.style] || 0;
    function arm(x, dy) {
      for (let y = 14; y <= 19; y++) {
        const r = y - 14; let c;
        if (y === 19) c = skin; else if (r < nSleeve) c = t.color; else c = t.under || skin;
        R(b, x, y + dy, 2, 1, c);
      }
    }
    if (!side) { arm(2, fr === 1 ? -1 : fr === 2 ? 1 : 0); arm(12, fr === 1 ? 1 : fr === 2 ? -1 : 0); }
    else arm([6, 4, 8][fr], 0);

    // 5) cabeza
    if (!side) {
      R(b, 4, 3, 8, 1, skin); R(b, 3, 4, 10, 8, skin); R(b, 4, 12, 8, 1, skin);
      R(b, 2, 8, 1, 3, skinD); R(b, 13, 8, 1, 3, skinD);
    } else {
      R(b, 6, 3, 6, 1, skin); R(b, 5, 4, 8, 8, skin); R(b, 6, 12, 6, 1, skin);
      P(b, 4, 9, skin); R(b, 9, 8, 2, 3, skinD);
    }

    // 6) cara
    const eye = look.eyes || '#2b1b30', es = look.eyeStyle || 'dot';
    if (dir === 'd') {
      [5, 10].forEach((x, i) => {
        if (es === 'happy') { P(b, x - 1, 8, eye); P(b, x, 7, eye); P(b, x + 1, 8, eye); }
        else { P(b, x, 8, eye); if (!(look.glasses && look.glasses.type !== 'none')) P(b, x, 9, eye); if (es === 'lash') P(b, i ? x + 1 : x - 1, 7, eye); }
      });
      if (look.blush !== false) { P(b, 4, 10, '#ff8fa8'); P(b, 11, 10, '#ff8fa8'); }
      if ((look.mouth || 'smile') === 'grin') { R(b, 6, 11, 4, 1, '#fffaf0'); P(b, 5, 10, '#7a2b3a'); P(b, 10, 10, '#7a2b3a'); R(b, 6, 12, 4, 1, '#7a2b3a'); }
      else { R(b, 6, 11, 4, 1, '#7a2b3a'); P(b, 5, 10, '#7a2b3a'); P(b, 10, 10, '#7a2b3a'); }
      // aretes
      const er = look.earrings;
      if (er === 'flower') { P(b, 2, 11, '#ffd24a'); P(b, 2, 12, '#fff3a0'); P(b, 13, 11, '#ffd24a'); P(b, 13, 12, '#fff3a0'); }
      else if (er === 'stud') { P(b, 2, 10, '#ffd24a'); P(b, 13, 10, '#ffd24a'); }
      else if (er === 'hoop') { R(b, 2, 11, 1, 2, '#ffd24a'); R(b, 13, 11, 1, 2, '#ffd24a'); }
    } else if (side) {
      P(b, 6, 8, eye); if (!(look.glasses && look.glasses.type !== 'none')) P(b, 6, 9, eye); if (es === 'lash') P(b, 5, 7, eye);
      if (look.blush !== false) P(b, 7, 10, '#ff8fa8');
      R(b, 5, 11, 2, 1, '#7a2b3a');
      if (look.earrings && look.earrings !== 'none') P(b, 9, 11, '#ffd24a');
    }

    // 7) pelo delante
    if (H_.f && H_.f.length) hairRects(b, H_.f, hc, hc2);

    // 8) bufanda, mochila
    if (acc.scarf && acc.scarf !== 'none') {
      R(b, side ? 6 : 4, 12, side ? 5 : 8, 2, acc.scarf); P(b, side ? 7 : 5, 13, shade(acc.scarf, -0.3)); P(b, side ? 9 : 9, 13, shade(acc.scarf, -0.3));
      if (dir === 'd') R(b, 9, 14, 2, 4, acc.scarf);
    }
    if (acc.backpack) {
      const bc = acc.backpackColor || '#2a2a33';
      if (back) R(b, 4, 13, 8, 7, bc), R(b, 6, 15, 4, 3, shade(bc, 0.2));
      else if (dir === 'd') { R(b, 5, 13, 1, 6, shade(bc, -0.1)); R(b, 10, 13, 1, 6, shade(bc, -0.1)); }
      else R(b, 10, 14, 3, 6, bc);
    }

    // 9) sombrero / accesorios de cabeza
    const hat = acc.hat, hcol = acc.hatColor || '#ff7aa8';
    if (hat && hat !== 'none') {
      if (hat === 'gorro') { R(b, 3, 1, 10, 3, hcol); R(b, 3, 4, 10, 1, shade(hcol, -0.25)); R(b, 7, 0, 2, 1, '#fffaf0'); }
      else if (hat === 'cap') { R(b, 3, 2, 10, 2, hcol); if (dir === 'd') R(b, 3, 4, 10, 1, shade(hcol, -0.3)); else if (side) R(b, 2, 4, 4, 1, shade(hcol, -0.3)); }
      else if (hat === 'boina') { R(b, 2, 2, 11, 2, hcol); R(b, 4, 1, 7, 1, hcol); P(b, 7, 0, shade(hcol, -0.3)); }
      else if (hat === 'lazo') { R(b, 10, 2, 4, 2, hcol); P(b, 12, 2, shade(hcol, -0.3)); P(b, 12, 3, shade(hcol, -0.3)); }
      else if (hat === 'corona') { R(b, 4, 1, 8, 2, '#ffd24a'); P(b, 4, 0, '#ffd24a'); P(b, 7, 0, '#ffd24a'); P(b, 11, 0, '#ffd24a'); P(b, 7, 2, '#ff5a7a'); }
    }

    // 10) lentes
    const gl = look.glasses;
    if (gl && gl.type && gl.type !== 'none' && !back) {
      const gc = gl.color || '#1c1c24', sun = gl.type === 'sun', rnd = gl.type === 'round', tint = '#dff0ff';
      if (dir === 'd') {
        [3, 9].forEach(x => {
          if (rnd) { R(b, x + 1, 7, 2, 1, gc); R(b, x + 1, 9, 2, 1, gc); } else { R(b, x, 7, 4, 1, gc); R(b, x, 9, 4, 1, gc); }
          P(b, x, 8, gc); P(b, x + 3, 8, gc); P(b, x + 1, 8, sun ? gc : tint); P(b, x + 2, 8, sun ? gc : tint);
        });
        R(b, 7, 7, 2, 1, gc);
        if (!sun) { P(b, 5, 8, eye); P(b, 10, 8, eye); }
      } else {
        R(b, 5, 7, 3, 1, gc); R(b, 5, 9, 3, 1, gc); P(b, 5, 8, gc); P(b, 7, 8, sun ? gc : tint); R(b, 8, 7, 3, 1, gc);
        if (!sun) P(b, 6, 8, eye);
      }
    }
    if (acc.sunOnHead && !back) R(b, 4, 3, 8, 1, '#2a2438');

    // 11) bubble tea (premio de sesión)
    if (acc.boba && dir !== 'u') { R(b, 13, 16, 3, 3, '#f3e2cf'); R(b, 14, 14, 1, 2, '#ff7aa8'); R(b, 13, 19, 3, 1, '#3a2218'); }
    return b;
  }

  /* ---------- pintar con contorno ---------- */
  function paint(ctx, buf, ox, oy, s) {
    ctx.fillStyle = OUT;
    for (let y = -1; y <= H; y++) for (let x = -1; x <= W; x++) {
      const has = (xx, yy) => yy >= 0 && yy < H && xx >= 0 && xx < W && buf[yy][xx];
      if (!has(x, y) && (has(x - 1, y) || has(x + 1, y) || has(x, y - 1) || has(x, y + 1)))
        ctx.fillRect(ox + (x + 1) * s, oy + (y + 1) * s, s, s);
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (buf[y][x]) { ctx.fillStyle = buf[y][x]; ctx.fillRect(ox + (x + 1) * s, oy + (y + 1) * s, s, s); }
  }

  /* Textura de Phaser con 9 cuadros: d0 d1 d2 u0 u1 u2 l0 l1 l2 (derecha = flipX de l) */
  G.makeCharTexture = function (scene, key, look) {
    const fresh = !scene.textures.exists(key);
    const tex = fresh ? scene.textures.createCanvas(key, FW * 9, FH) : scene.textures.get(key), ctx = tex.getContext();
    ctx.clearRect(0, 0, FW * 9, FH); ctx.imageSmoothingEnabled = false;
    let i = 0;
    ['d', 'u', 'l'].forEach(d => [0, 1, 2].forEach(f => { paint(ctx, build(look, d, f), i * FW, 0, 1); if (fresh) tex.add(d + f, 0, i * FW, 0, FW, FH); i++; }));
    tex.refresh();
    return tex;
  };
  G.CHAR_FW = FW; G.CHAR_FH = FH;

  /* Dibujar en un <canvas> normal (clóset, HUD, tarjetas) */
  G.drawLook = function (canvas, look, dir, fr, scale, flip) {
    canvas.width = FW * scale; canvas.height = FH * scale;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (flip) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    paint(ctx, build(look, dir === 'r' ? 'l' : dir, fr), 0, 0, scale);
  };
  /* Solo la carita (para el HUD) */
  G.faceCanvas = function (look, scale) {
    const full = document.createElement('canvas'); G.drawLook(full, look, 'd', 0, scale);
    const c = document.createElement('canvas'); c.width = FW * scale; c.height = 15 * scale;
    c.getContext('2d').drawImage(full, 0, 0, FW * scale, 15 * scale, 0, 0, FW * scale, 15 * scale);
    return c;
  };

  /* ---------- PUFFLE (bolita esponjosa estilo Club Penguin) ----------
     Cuerpo redondo y simétrico con borde peludo, ojazos con brillo, boquita feliz, mejillas
     y un PELITO con diseño (forma + color): puntas, rulo, colitas, flequillo, cresta.
     Se genera por píxeles (no hay imágenes). Textura de 22x24. */
  const PW = 22, PH = 24;
  G.PUFFLE_HAIRS = [['puntas', 'Puntas'], ['rulo', 'Rulo'], ['colitas', 'Colitas'], ['flequillo', 'Flequillo'], ['cresta', 'Cresta'], ['none', 'Pelón']];
  G.PUFFLE_HAIRCOLORS = ['auto', '#ffffff', '#ff4d79', '#ffd24a', '#7a4dff', '#2fa86a', '#2b1b30'];
  const hash = (x, y) => { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >> 13)) * 1274126177 | 0; return ((n ^ (n >> 16)) >>> 0) / 4294967296; };
  const lumi = h => { const [r, g, b] = h2r(h); return (0.3 * r + 0.59 * g + 0.11 * b) / 255; };
  G.drawPuffle = function (canvas, pf, scale) {
    const c = pf.color || '#ff5a7a', hairKind = pf.hair === undefined ? 'puntas' : pf.hair;
    canvas.width = PW * scale; canvas.height = PH * scale;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, canvas.width, canvas.height);
    const px = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x * scale, y * scale, scale, scale); };
    const cx = 11, cy = 15.2, base = 7.2, K = (x, y) => x + ',' + y;
    const dark = shade(c, -0.55), mid = shade(c, -0.18), lite = shade(c, 0.32), hi = shade(c, 0.62);
    // ---- cuerpo: borde peludo simétrico ----
    const body = new Set();
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, ang = Math.atan2(dy, Math.abs(dx));
      const fuzz = 0.55 * Math.sin(ang * 11 + 0.4) + 0.3 * Math.sin(ang * 6);
      if (Math.hypot(dx, dy * 1.02) < base + 0.4 + fuzz * (dy > 4.5 ? 0.3 : 1)) body.add(K(x, y));
    }
    const edge = (set, x, y) => !set.has(K(x, y)) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => set.has(K(x + a, y + b)));
    body.forEach(k => {
      const [x, y] = k.split(',').map(Number), dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const l = (-dx * 0.5 - dy * 0.85) / base;
      let col = l > 0.5 ? lite : l > -0.1 ? c : l > -0.5 ? mid : shade(c, -0.3);
      const h = hash(x, y); if (h > 0.9) col = l > 0 ? hi : lite; else if (h < 0.08) col = mid;
      px(x, y, col);
    });
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (edge(body, x, y)) px(x, y, dark);
    // ---- pelito con diseño ----
    const hcol = pf.hairColor && pf.hairColor !== 'auto' ? pf.hairColor : (lumi(c) > 0.78 ? shade(c, -0.38) : shade(c, 0.5));
    const hhi = shade(hcol, 0.45), hlo = shade(hcol, -0.3), hout = shade(hcol, -0.62);
    const shape = new Set();
    const tri = (tx, ty, bw, by) => { for (let y = ty; y <= by; y++) { const hw = (y - ty + 0.6) / (by - ty + 1) * bw / 2; for (let x = Math.floor(tx - hw); x <= Math.ceil(tx + hw); x++) if (Math.abs(x + 0.5 - tx) <= hw + 0.2) shape.add(K(x, y)); } };
    const disc = (ox, oy, r, r0) => { for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const d = Math.hypot(x + 0.5 - ox, y + 0.5 - oy); if (d <= r && d >= (r0 || 0)) shape.add(K(x, y)); } };
    if (hairKind === 'puntas') { tri(cx, 0, 4, 8); tri(cx - 4.6, 3, 3, 9); tri(cx + 4.6, 3, 3, 9); }
    else if (hairKind === 'rulo') { disc(cx + 1.5, 4.4, 3.6, 1.5); for (let y = 7; y <= 10; y++) { shape.add(K(10, y)); shape.add(K(11, y)); shape.add(K(12, y)); } }
    else if (hairKind === 'colitas') { disc(3.6, 8.2, 3.2); disc(PW - 3.6, 8.2, 3.2); tri(3, 10, 4, 14); tri(PW - 3, 10, 4, 14); }
    else if (hairKind === 'flequillo') {
      body.forEach(k => { const [x, y] = k.split(',').map(Number); const lim = cy - 3.6 + 1.4 * Math.abs(Math.sin((x - cx) * 0.75)) + Math.abs(x + 0.5 - cx) * 0.18; if (y + 0.5 < lim) shape.add(k); });
      tri(cx + 1, 3, 4, 8); tri(cx - 3, 5, 3, 8);
    }
    else if (hairKind === 'cresta') { [[6, 5, 2], [8.6, 3, 3], [11, 1, 3], [13.4, 3, 3], [16, 5, 2]].forEach(([x, t, w]) => tri(x, t, w, 9)); }
    if (hairKind !== 'none') {
      // pintar relleno + brillos + contorno
      shape.forEach(k => { const [x, y] = k.split(',').map(Number); const h = hash(x + 7, y + 3); px(x, y, (x < cx && h > 0.45 ? hhi : h < 0.18 ? hlo : hcol)); });
      for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) if (edge(shape, x, y) && !(hairKind === 'flequillo' && body.has(K(x, y)) && false)) px(x, y, hout);
      if (hairKind === 'colitas') [[5, 10], [PW - 6, 10]].forEach(([x, y]) => { px(x, y, '#ff7aa8'); px(x + 1, y, '#ff7aa8'); px(x, y + 1, '#c33a6a'); px(x + 1, y + 1, '#c33a6a'); });
    }
    // ---- cara (encima del flequillo) ----
    const ey = 13;
    const eye = ex => {
      [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [0, 3], [1, 3], [2, 3]].forEach(([i, j]) => px(ex + i, ey + j, '#ffffff'));
      [[1, -1], [2, -1], [-0, -1]].forEach(([i, j]) => px(ex + i, ey + j, dark));
      [[-1, 0], [3, 0], [-1, 1], [3, 1], [-1, 2], [3, 2], [-1, 3], [3, 3], [0, 4], [1, 4], [2, 4]].forEach(([i, j]) => px(ex + i, ey + j, dark));
      [[1, 1], [2, 1], [1, 2], [2, 2], [1, 3], [2, 3]].forEach(([i, j]) => px(ex + i, ey + j, '#1b1230'));
      px(ex + 1, ey + 1, '#ffffff'); px(ex + 2, ey + 1, '#fff7a8');
    };
    eye(6); eye(13);
    [[9, 18], [10, 18], [11, 18], [12, 18], [13, 18]].forEach(([x, y]) => px(x, y, '#1b1230'));
    [[8, 17], [14, 17]].forEach(([x, y]) => px(x, y, '#1b1230'));
    [[10, 19], [11, 19], [12, 19]].forEach(([x, y]) => px(x, y, '#ff6b8a'));
    [[4, 17], [5, 17], [17, 17], [18, 17]].forEach(([x, y]) => px(x, y, '#ff9fb8'));
    // ---- sombrerito ----
    const hat = pf.hat, H = (list, col) => list.forEach(([x, y]) => px(x, y, col));
    if (hat === 'gorro') { for (let y = 5; y <= 9; y++) for (let x = 6 + (9 - y) / 2 | 0; x <= 15 - ((9 - y) / 2 | 0); x++) px(x, y, y === 9 ? '#fffaf0' : '#ffd24a'); H([[10, 3], [11, 3], [10, 4], [11, 4], [9, 4], [12, 4]], '#fffaf0'); }
    if (hat === 'corona') { for (let x = 7; x <= 15; x++) for (let y = 7; y <= 9; y++) px(x, y, '#ffd24a'); H([[7, 6], [7, 5], [11, 6], [11, 5], [11, 4], [15, 6], [15, 5], [9, 6], [13, 6]], '#ffd24a'); H([[11, 8]], '#e63946'); H([[7, 4], [11, 3], [15, 4]], '#2b1b30'); }
    if (hat === 'lazo') { H([[16, 6], [17, 6], [18, 6], [16, 7], [18, 7], [17, 7], [19, 6], [19, 7], [15, 6], [15, 7], [16, 5], [18, 5], [16, 8], [18, 8]], '#ff7aa8'); H([[17, 6], [17, 7]], '#c33a6a'); }
  };
  G.makePuffleTexture = function (scene, key, pf) {
    const fresh = !scene.textures.exists(key);
    const tex = fresh ? scene.textures.createCanvas(key, PW, PH) : scene.textures.get(key);
    G.drawPuffle(tex.getCanvas(), pf, 1); tex.refresh();
  };

  /* ---------- EMOTES 9x9 ---------- */
  const EM = {
    heart: ['.........', '.oo...oo.', 'orrooorro', 'orhrrrrro', 'orrrrrrro', '.orrrrro.', '..orrro..', '...oro...', '....o....'],
    penguin: ['...ooo...', '..okkko..', '.okwkwko.', '.okkykko.', 'okkwwwkko', 'okwwwwwko', 'okwwwwwko', '.okwwwko.', '..yy.yy..'],
    rock: ['.........', '..ooooo..', '.oggghgo.', 'oggggggho', 'ogGggggGo', 'ogggGgggo', 'oGggggggo', '.ooooooo.', '.........'],
    laugh: ['..ooooo..', '.oyyyyyo.', 'oykyyykyo', 'oyyyyyyyo', 'okyyyyyko', 'oykwwwkyo', '.oykkkyo.', '..ooooo..', '.........'],
    star: ['....o....', '...oyo...', '...oyo...', 'ooooyoooo', 'oyyyyyyyo', '.oyyyyyo.', '.oyyoyyo.', '.oyo.oyo.', '..o...o..'],
    wave: ['...o.o...', '..opopo..', '.opopopo.', '.opppppo.', 'oopppppo.', 'opppppppo', '.opppppo.', '..oppppo.', '...ooooo.'],
    dance: ['...oooooo', '...opppp.', '...op..p.', '...op..p.', '.oo.p.oo.', 'oppo..opp', 'oppo..opp', '.oo....oo', '.........']
  };
  const EPAL = { o: '#2b1b30', r: '#ff4d79', h: '#ffc2d3', k: '#1b1230', w: '#ffffff', y: '#ffd24a', g: '#9aa3b5', G: '#6f7890', p: '#c58cff' };
  G.emoteCanvas = function (id, scale) {
    const c = document.createElement('canvas'); c.width = c.height = 9 * scale;
    const ctx = c.getContext('2d'); const m = EM[id] || EM.heart;
    // penguin: beak naranja
    const pal = id === 'penguin' ? Object.assign({}, EPAL, { y: '#ff9d2e' }) : EPAL;
    m.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) { ctx.fillStyle = pal[ch]; ctx.fillRect(x * scale, y * scale, scale, scale); } }));
    return c;
  };

  /* ---------- PRESETS (inspirados en las fotos que pasaron) ---------- */
  G.HAIR_COLORS = [
    ['Negro', '#1b1618'], ['Castaño oscuro', '#3b241b'], ['Castaño', '#5a3626'],
    ['Castaño con luces naranjas', '#4f2e22', '#d4701f'], ['Pelirroja', '#b5431d'], ['Rubio', '#d9b45a'],
    ['Rosa', '#ff7aa8'], ['Morado', '#8a5cf6'], ['Azul', '#3b82f6'], ['Plateado', '#c9ced8']
  ];
  G.SKINS = [['Claro', '#f1c9a5'], ['Trigueño', '#d9a07a'], ['Canela', '#c98f6a'], ['Moreno', '#a8693f'], ['Oscuro', '#7a4a2d'], ['Fantasía', '#b9e3c6']];
  G.SWATCH = ['#d9262c', '#f4a259', '#ffd24a', '#7fae5a', '#4aa6a0', '#7f9cc4', '#5f7fa6', '#8a5cf6', '#ff7aa8', '#fffaf0', '#c9b88f', '#b98c52', '#3d4a63', '#2c2f3a', '#1b1b1f'];

  const T = (style, color, o) => Object.assign({ style, color }, o || {});
  G.PRESETS = {
    dani: {
      hair: { style: 'largoLiso', color: '#4f2e22' }, skin: '#d9a07a', eyeStyle: 'lash', blush: true, glasses: { type: 'none', color: '#6b3a22' },
      earrings: 'flower',
      outfits: [
        { name: 'Porrista', top: T('cheer', '#d9262c', { pattern: 'cheer', p1: '#fffaf0', p2: '#1b1b1f' }), bottom: { style: 'shorts', color: '#1b1b1f' }, shoes: { type: 'sneaker', color: '#fffaf0' } },
        { name: 'Vestido de limones', top: T('dress', '#fbf3d4', { pattern: 'lemons', p1: '#f5d63a', p2: '#7fae5a' }), bottom: { style: 'skirt', color: '#fbf3d4' }, shoes: { type: 'sandal', color: '#c9a77a' } },
        { name: 'Vestido floral', top: T('dress', '#6a2c4e', { pattern: 'floral', p1: '#f6e7c8', p2: '#e1593f' }), bottom: { style: 'skirt', color: '#6a2c4e' }, shoes: { type: 'sneaker', color: '#fffaf0' } },
        { name: 'Polo estampado', top: T('tee', '#f4f4f0', { pattern: 'print', p1: '#f2a65a', p2: '#7fd1ae', p3: '#f5e663' }), bottom: { style: 'pants', color: '#c9b88f' }, shoes: { type: 'sneaker', color: '#fffaf0' } },
        { name: 'Top y pañuelo', top: T('tank', '#fffaf0'), bottom: { style: 'pants', color: '#bfae82' }, shoes: { type: 'sandal', color: '#8a6a44' }, scarf: '#d9672b' }
      ],
      looks: [{ name: 'Castaño', hair: { style: 'largoLiso', color: '#4f2e22' } },
              { name: 'Luces naranjas', hair: { style: 'largoLiso', color: '#4f2e22', color2: '#d4701f' } },
              { name: 'Pelirroja', hair: { style: 'largoLiso', color: '#b5431d' } },
              { name: 'Castaño ondas', hair: { style: 'ondas', color: '#4f2e22' } }]
    },
    sebas: {
      hair: { style: 'cocoLargo', color: '#1b1618' }, skin: '#c98f6a', eyeStyle: 'dot', blush: false, glasses: { type: 'rect', color: '#1c1c24' },
      earrings: 'none',
      outfits: [
        { name: 'Polo rojo y gris', top: T('tee', '#c9262e', { under: '#8e9bb0', pattern: 'logo', p1: '#fffaf0' }), bottom: { style: 'pants', color: '#b98c52' }, shoes: { type: 'boot', color: '#5a3b24' } },
        { name: 'Overshirt beige', top: T('shirt', '#d8d0bd'), bottom: { style: 'pants', color: '#cdc4aa' }, shoes: { type: 'sneaker', color: '#e8e0d0' }, backpack: '#2a2a33' },
        { name: 'Camisa blanca', top: T('shirt', '#f3f1ea'), bottom: { style: 'pants', color: '#b88b4e' }, shoes: { type: 'formal', color: '#5a3b24' } },
        { name: 'Lino azul', top: T('shirt', '#7f9cc4'), bottom: { style: 'pants', color: '#3d4a63' }, shoes: { type: 'sneaker', color: '#fffaf0' } },
        { name: 'Paisley', top: T('shirt', '#5f7fa6', { pattern: 'paisley', p1: '#a8483f', p2: '#e6d7b0' }), bottom: { style: 'pants', color: '#2c2f3a' }, shoes: { type: 'formal', color: '#1b1b1f' } }
      ],
      looks: [{ name: 'Pelado', hair: { style: 'bald', color: '#1b1618' } },
              { name: 'Coco largo', hair: { style: 'cocoLargo', color: '#1b1618' } },
              { name: 'Coco corto', hair: { style: 'cocoCorto', color: '#1b1618' } },
              { name: 'Muy corto', hair: { style: 'muyCorto', color: '#1b1618' } }]
    }
  };

  /* TRAJES DE BAÑO (se eligen en el clóset > Playa y se usan en Callao y Los Yuyos) */
  G.SWIMSUITS = {
    dani: [
      { name: 'Marrón con celeste', top: { style: 'bikini', color: '#8a5a3a' }, bottom: { style: 'bikini', color: '#7fd0ee' } },
      { name: 'Celeste con manchas', top: { style: 'bikini', color: '#7fd0ee', pattern: 'dots', p1: '#ffd24a', p2: '#ffffff' }, bottom: { style: 'bikini', color: '#7fd0ee' } },
      { name: 'Rosado con flores', top: { style: 'bikini', color: '#ff9fc0', pattern: 'floral', p1: '#ffd24a', p2: '#ffe680' }, bottom: { style: 'bikini', color: '#ff9fc0' } },
      { name: 'Rojo cuadrado', top: { style: 'bikini', color: '#d9262c', cut: 'square' }, bottom: { style: 'bikini', color: '#d9262c' } }
    ],
    sebas: [
      { name: 'Short azul', top: { style: 'bare', color: '#c98f6a' }, bottom: { style: 'shorts', color: '#2f6bd6' } },
      { name: 'Short rojo', top: { style: 'bare', color: '#c98f6a' }, bottom: { style: 'shorts', color: '#d9262c' } },
      { name: 'Short turquesa', top: { style: 'bare', color: '#c98f6a' }, bottom: { style: 'shorts', color: '#2fb8a6' } }
    ]
  };
  /* copia del look con el traje de baño puesto (para las escenas de playa y las fotos) */
  G.beachLook = function (look, id) {
    const l = G.cloneLook(look), list = G.SWIMSUITS[id || 'dani'] || G.SWIMSUITS.dani, sw = list[Math.min(list.length - 1, Math.max(0, look.swim || 0))];
    l.outfit = { top: Object.assign({}, sw.top), bottom: Object.assign({}, sw.bottom), shoes: { type: 'sandal', color: '#ffd24a' } };
    l.acc = Object.assign({}, l.acc, { scarf: 'none', backpack: false });
    return l;
  };
  G.applyOutfit = function (look, o) {
    look.outfit = { top: Object.assign({}, o.top), bottom: Object.assign({}, o.bottom), shoes: Object.assign({}, o.shoes) };
    look.acc = Object.assign({}, look.acc, { scarf: o.scarf || 'none', backpack: !!o.backpack, backpackColor: o.backpack || '#2a2a33' });
  };
  G.defaultLook = function (id) {
    const p = G.PRESETS[id];
    const look = {
      hair: Object.assign({}, p.hair), skin: p.skin, eyes: '#2b1b30', eyeStyle: p.eyeStyle, mouth: 'smile', blush: p.blush,
      glasses: Object.assign({}, p.glasses), earrings: p.earrings,
      acc: { hat: 'none', hatColor: '#ff7aa8', scarf: 'none', backpack: false, boba: false },
      puffle: { color: id === 'dani' ? '#ff8fc0' : '#6fd0ff', hat: 'none', hair: id === 'dani' ? 'colitas' : 'puntas', hairColor: 'auto' }, outfitIdx: 0
    };
    G.applyOutfit(look, p.outfits[0]);
    return look;
  };
  G.cloneLook = l => JSON.parse(JSON.stringify(l));
})();
