/* ===========================================================
   config.js — constantes globales del juego "Lima de a dos"
   Todo cuelga de window.G (namespace global, sin bundler).
   =========================================================== */
window.G = window.G || {};

G.W = 400;           // resolución interna (pixel art) — se escala a la ventana
G.H = 225;
G.VERSION = '1.0.0';
G.STORAGE_KEY = 'limaduo_v1';

/* MODO MISMA LAPTOP (local.html): dos copias del juego (una por jugador) en iframes, unidas por postMessage.
   ?local=1&slot=0|1&me=sebas|dani  — cada copia guarda aparte (así no se pisan) y el slot 1 no pone música (la pone el 0). */
(function () {
  const q = new URLSearchParams(location.search);
  G.local = q.get('local') === '1'; G.slot = +q.get('slot') || 0;
  if (G.local) G.STORAGE_KEY = 'limaduo_local_' + (q.get('me') || (G.slot ? 'dani' : 'sebas'));
})();

/* Fecha desde la que se cuenta "su tiempo juntos".
   El feliz "2 años y medio" cae el 11-nov-2026 => inicio = 11-may-2024. */
G.REL_START = { y: 2024, m: 5, d: 11 };

G.IDS = {
  sebas: { id: 'sebas', label: 'Sebastián', short: 'Sebas', other: 'dani' },
  dani:  { id: 'dani',  label: 'Daniela',   short: 'Dani',  other: 'sebas' }
};

/* Meses de relación, REDONDEADOS al mes más cercano (a 2 años y 5 meses con 17+ días ya cuenta como "2 años y medio"):
   el 7-nov-2026 se muestra "2 años y medio" y el 11-may-2027 "3 años". */
G.relMonths = function (now) {
  now = now || new Date();
  const s = G.REL_START;
  let m = (now.getFullYear() - s.y) * 12 + (now.getMonth() + 1 - s.m);
  if (now.getDate() < s.d) m--;
  const last = new Date(s.y, s.m - 1 + m, s.d);           // último "mesversario"
  const days = Math.floor((now - last) / 86400000);
  if (days >= 15) m++;
  return Math.max(0, m);
};

/* Texto del festejo, que va cambiando con el calendario:
   2 años y 6 meses -> "¡Feliz 2 años y medio!", 3 años -> "¡Feliz 3 años!" */
G.relLabel = function (now) {
  const m = G.relMonths(now), y = Math.floor(m / 12), r = m % 12;
  const anios = y === 1 ? '1 año' : y + ' años';
  let txt;
  if (y === 0) txt = r === 1 ? '1 mes' : r + ' meses';
  else if (r === 0) txt = anios;
  else if (r === 6) txt = anios + ' y medio';
  else txt = anios + ' y ' + (r === 1 ? '1 mes' : r + ' meses');
  return '¡Feliz ' + txt + '!';
};

/* Lugares del mapa. 'stage' = etapa del plan en la que se construye el minijuego (sin 'stage' = ya jugable).
   pin = posición en el mapa (el mapa es más alto que la pantalla y hace scroll: y de -70 a 300).
   Solo existen: Igloo conjunto (base) · Casa de Sebas (Miraflores, ARRIBA de Kennedy) · Cocina de Daniela (Lince, junto a Saoco). */
G.PLACES = {
  igloo:       { name: 'Igloo de Dani y Sebas', district: 'Nuestra base', music: 'lofi', scene: 'igloo', owner: 'both', pin: [64, 62] },
  casa_sebas:  { name: 'Casa de Sebas',      district: 'Miraflores', music: 'hiphop', scene: 'igloo', owner: 'sebas', pin: [228, 166] },
  kennedy:  { name: 'Parque Kennedy',      district: 'Miraflores', music: 'rock',   scene: 'kennedy', pin: [236, 200],
              game: 'Carrera de gatos', desc: 'Corre como el dinosaurio de Google: salta gatos, agáchate ante las palomas y junta pescaditos. 2, 3 o 5 min. El ganador se lleva S/ 10 y un bubble tea (accesorio).' },
  pollos:   { name: 'El Pollo Pier',       district: 'Miraflores', music: 'urbano', scene: 'pollos', pin: [244, 234], sign: ['EL POLLO', 'PIER', 'restaurant'],
              game: 'Memoria de pedidos', desc: 'Solo cerveza y salchipapas… ¡pero el bar se llena! Recuerda cada pedido (la burbuja se apaga), planea tus viajes y gasta bien tu libreta. Mismos clientes para los dos: gana el mayor puntaje (S/ 10).' },
  pucp:     { name: 'PUCP',                district: 'San Miguel', music: 'lofi',   scene: 'pucp', pin: [238, 86],
              game: 'Esconderse', desc: 'Escóndanse en la Facultad de Letras, el Tontódromo y el pasto sin que los vea el guardia ni el estudiante. 3, 5 o 7 rondas. Gana quien sea visto menos veces (S/ 10).' },
  cocina:   { name: 'Cocina de Daniela',   district: 'Lince',      music: 'reggaeton', scene: 'cocina', pin: [334, 106],
              game: 'Los Ccellis · ramen cooperativo', desc: 'Overcooked de ramen en equipo: 5 niveles cuya cocina cambia (¡hasta se divide!). Si lo logran, el premio son los fideos Martuccini para compartir.' },
  salsa:    { name: 'Academia Saoco',      district: 'Lince',      music: 'salsa',  scene: 'saoco', pin: [352, 126],
              game: 'Baile de flechas', desc: 'Disco de Club Penguin con salsa, habanera y charanga: solitario (VS yo, contra tu récord) o en dupla contra dos duplas NPC: si uno se equivoca, ¡los dos repiten la frase!' },
  carjitsu: { name: 'Dojo de San Martín',  district: 'San Martín de Porres', music: 'lofi', scene: 'cardjitsu', pin: [244, 20],
              game: 'Card-jitsu', desc: 'Duelo de cartas estilo Avatar: Fuego, Agua, Tierra y Aire. Los dos juegan en secreto y se revelan juntas; usa tu Chi ⚡ en el momento justo. El ganador se lleva S/ 10 y los bufandas se guardan para siempre.' },
  callao:   { name: 'Playa del Callao',    district: 'Callao',     music: 'rock',   scene: 'callao', pin: [176, -32],
              game: 'Piedra, Frío y Resistencia', desc: 'Pelea 1 contra 1 con barra de vida y de temperatura (hipotermia): lanza piedras, golpea en combo y no te quedes quieto. Mejor de 3 rondas, con traje de baño. El ganador: S/ 10 y foto vintage.' },
  yuyos:    { name: 'Los Yuyos',           district: 'Barranco',   music: 'lofi',   scene: 'yuyos', pin: [216, 280],
              game: 'Duelo de Canillitas de Chapa', desc: 'Tres pruebas: aguantar el chapuzón, equilibrio sobre piedras resbalosas con chamarra pesada y pulso con la piedra más pesada. El rey de la playa: S/ 10 y foto vintage.' }
};
G.BASE = 'igloo';

/* Qué "estilo" de música suena en cada lugar (ver audio.js) */
G.MUSIC_FOR = { title: 'lofi', story: 'lofi', map: 'lofi', conecta4: 'lofi', fin: 'salsa' };

/* Emotes: id -> etiqueta */
G.EMOTES = [
  ['heart', 'Corazón'], ['penguin', 'Pingüino'], ['rock', 'Roca'], ['laugh', 'Risa'],
  ['star', 'Estrella'], ['wave', 'Hola'], ['dance', 'Baile']
];

/* Bus de eventos muy simple */
G.bus = (function () {
  const h = {};
  return {
    on(e, f) { (h[e] = h[e] || []).push(f); return () => this.off(e, f); },
    off(e, f) { h[e] = (h[e] || []).filter(x => x !== f); },
    emit(e, d) { (h[e] || []).slice().forEach(f => { try { f(d); } catch (err) { console.error(err); } }); }
  };
})();
