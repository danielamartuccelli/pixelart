# Lima de a dos — Resumen de traspaso (para continuar en otro chat de Claude)

> Versión del juego al escribir esto: **v0.9 (etapas 1–8 hechas)**. Fecha: 7-nov-2026.
> Pégale este archivo + `INDICACIONES_DANIELA.md` + el zip del proyecto al nuevo chat y dile: *"continúa de forma coherente con lo ya hecho"*.

## 1. Qué es
Videojuego web **pixel-art de 2 jugadores** (Sebas y Daniela), cada uno en su laptop **Windows**, conectados con un **código de sala**. Gratis (GitHub Pages + PeerJS), sin cuentas ni membresías. Todo en español. Estética tipo Club Penguin / Pokémon / Overcooked, vista **desde arriba**, soleado y colorido, con versión día/noche.

## 2. Stack y reglas técnicas
- **Phaser 3.80.1** + **PeerJS** (P2P/WebRTC), **sin bundler**: scripts clásicos que comparten `window.G`. Resolución interna **400×225**, `pixelArt`, `Scale.FIT`. Librerías y fuentes locales en `vendor/` (sin CDN).
- Arte **100 % procedural** (Graphics / canvas): no hay imágenes ni fotos originales en el repo. **No subir las fotos originales** (el repo de Pages es público).
- Música **procedural original** (estilos lofi, reggaeton, hiphop, rock, urbano, salsa). No se usan canciones reales.
- DOM para formularios/HUD/clóset/ajustes/chat; Phaser para las escenas del mundo.
- **Marcador:** `G.state.balance` = soles de Daniela; Sebas = −balance. Pierde quien llega a **−50**. Récords y ganadores se guardan **siempre** (localStorage del navegador) y se sincronizan entre ambos al conectarse.
- Cada minijuego gana **S/ 10** (valor actual de Kennedy y PUCP).

## 3. Estructura de archivos
```
index.html
src/config.js      G.PLACES (lugares, pins, música, escena), G.EMOTES, bus, fecha de relación (11-may-2024)
src/state.js       G.state, soles, récords, localStorage
src/sprites.js     look -> sprite 16x26 (9 cuadros), clóset, puffles, presets de Dani y Sebas
src/audio.js       música procedural + sfx (click, ok, pop, heart, hit, win)
src/net.js         PeerJS: host/guest, heartbeat 9 s, reconexión, mensajes {t,d}
src/ui.js          DOM: título, ¿quién eres?, lobby, HUD, clóset, ajustes, récords
src/main.js        flujo de escenas, mensajes de red, G.travel, modo prueba (?solo=1)
src/scenes/menu.js (G.art: helpers de dibujo) · story.js (9 paneles) · igloo.js (base + casa de Sebas)
src/scenes/map.js (mapa con scroll) · place.js (lugar "en construcción")
src/scenes/kennedy.js (etapa 3) · pucp.js (etapa 4) · mg.js (helpers de minijuegos) · pollos.js + src/pollos_sim.js (etapa 6) · saoco.js (etapa 6) · connect4_sim.js + conecta4.js (etapa 7) · jitsu_sim.js + cardjitsu.js (etapa 7)
src/kitchen_sim.js (etapa 5: lógica pura de Los Ccellis, niveles/recetas/Sim) · src/scenes/cocina_art.js (iconos y estaciones) · cocina.js (escena + tutorial) · martuccini.js (premio)
README.md · CLAUDE.md
```

## 4. Lugares (G.PLACES) y estado
| Lugar | Distrito | Escena | Estado |
|---|---|---|---|
| **Igloo de Dani y Sebas** (base conjunta, iceberg frente a la costa) | — | igloo | ✅ clóset, espejo, cama, mesa de 4 en raya (juega, etapa 7), puerta al mapa |
| **Casa de Sebas** | Miraflores (ARRIBA de Kennedy) | igloo (piel "sebas") | ✅ |
| **Parque Kennedy** | Miraflores | kennedy | ✅ etapa 3 |
| **El Pollo Pier** | Miraflores (ABAJO de Kennedy) | pollos | ✅ etapa 6 |
| **PUCP** | San Miguel | pucp | ✅ etapa 4 |
| **Cocina de Daniela / Los Ccellis** (junto a Saoco) | Lince | cocina → martuccini | ✅ etapa 5 |
| **Academia Saoco** | Lince | saoco | ✅ etapa 6 |
| **Dojo (Card-jitsu)** | San Martín de Porres | cardjitsu | ✅ etapa 7 |
| **Playa del Callao** | Callao | place | ⏳ etapa 9 |
| **Los Yuyos** | Barranco | place | ⏳ etapa 9 |

Mapa: mundo de y = −70…300, scroll con ↑↓ / rueda / arrastrar. Solo existen: igloo conjunto, casa de Sebas y cocina de Daniela (no hay "igloo de Daniela"; los guardados antiguos se redirigen al igloo).

## 5. Hecho (etapas 1–7)
1. **Base:** título, "¿Quién eres?" + nombre (antes de la historia), lobby (crear sala / unirme con código), pausa y reconexión, historia animada de 9 paneles (el pingüino y la piedra más lisa).
2. **Personajes chibi procedurales + clóset** (pelo, cara, lentes con/sin, ropa con 5 outfits cada uno, zapatos, accesorios, puffle rojo/celeste/amarillo/rosado/marrón), chat libre + emotes (corazón, pingüino, roca…), igloo, casa de Sebas, mapa de Lima con scroll (Callao, Barranco/Los Yuyos), día/noche, marcador en soles, récords, música por lugar. Pelo de lado de Daniela corregido.
3. **Kennedy — Carrera de gatos** (dinosaurio de Google, de a dos): dos carriles con el mismo recorrido (semilla del host), 2/3/5 min, saltar gatos y cuadros de la feria, agacharse ante palomas, pescaditos y bubble tea (turbo). Chocar = tropezar. Gana más metros. Premio S/ 10 + 🧋 accesorio solo esa sesión. Revancha. Probado con 2 navegadores.
4. **PUCP — Escondidas** (esta etapa): campus con Facultad de Letras y Ciencias Sociales, Tontódromo y pasto; 8 escondites (arbustos, árboles, columnas) de **uno por persona**; fase "Escóndete" que se acorta cada ronda; **guardia** (cono rojo, revisa escondites y muestra "?" antes) y **estudiante** (cono amarillo, solo mira; 2.º estudiante desde la ronda 5); medidor de detección; 3/5/7 rondas; gana quien sea visto menos veces; empate = muerte súbita; premio S/ 10; revancha.

5. **Cocina "Los Ccellis" (esta etapa):** Overcooked de ramen cooperativo, 5 niveles que cambian la estructura (abierta → islas → dividida con PASE → arriba/abajo → lados invertidos), ventana tutorial antes de cada nivel, pedidos con paciencia, sobre de picante, olla/tabla/sartén/amasadora/caldero, ramen a mano, CCELLI SUPREMO; estrellas y progreso guardados (`G.state.kitchen`). Premio: escena `martuccini` (fideos Martuccini + foto vintage). **Puffles rediseñados** (esponjosos, ojazos, pelito con diseño y color).

6. **Pollos + Saoco (esta etapa):** Pollos = memoria de pedidos (cerveza/salchipapas, globo que se borra, aforo, libreta de 3 usos), cada uno su bar con la misma semilla, gana más puntos (S/ 10, empate sin soles). Saoco = baile de flechas con 3 canciones/dificultades; solitario vs récord propio y dupla por frases con árbitro host (si uno falla repiten ambos) contra 2 duplas NPC; ajuste de ritmo `settings.danceOff`. Nuevo `G.recordBest` y `G.audio.clock()`.

7. **Cuatro en raya + Card-jitsu (esta etapa):** 4 en raya 7×6 en la mesa del igloo, contador global permanente (`records.games.connect4`), reloj por turno, empieza el perdedor, sin soles. Card-jitsu estilo Avatar: 4 elementos con ciclo, Chi ⚡ +4 (1 vez), gana con 3 iguales o 3 distintos, S/ 10 al ganador, bufandas permanentes (`state.belts`, rangos en `J.BELTS`) que también son un accesorio del clóset (`look.acc.belt`). **Se corrigió** un bug antiguo: las flechas y el espacio no llegaban a Phaser.

8. **Pantalla final (v0.9):** `src/scenes/fin.js` (escena `fin`). `G.flow.openMap()` redirige a `fin` una vez por victoria (|balance|=50, clave `G.finShown`). Parte 1: el perdedor paga (monedas S/, confeti); parte 2: "¡Feliz …!" con `G.relLabel()`, letras arcoíris, corazón gigante, premio (bubble tea pagado por el perdedor, bolsa de ramen especial, makis de Shimaya). Botones: Nueva partida (reinicia a 0 y va al igloo) / Seguir al mapa. El host suma `records.matches[ganador]` (clave `records.lastMatchRev`). Prueba: `?solo=1&go=fin&bal=50` (o −50).

## 6. Protocolo de red (mensajes)
Generales: `hello, look, name, goto, score, records, chat, emote, pos, mapgo, storyDone`.
Kennedy: `k_dur, k_ready, k_go{seed,dur}, k_pos, k_end{dist}, k_again`.
PUCP: `p_cfg, p_ready, p_go{seed,rounds}, p_pos, p_seen, p_fin{seen}, p_res{scores}, p_next, p_over, p_again`.
Cocina: `c_cfg{level,unlocked}, c_ready, c_go{level,seed,dur}, c_pos{i,x,y,d,m}, c_in{d,x,y,f}, c_snap{…}, c_req{a}, c_brief{level,page}` (el anfitrión simula y manda snapshots).
Pollos: `o_cfg, o_ready, o_go, o_sc, o_fin, o_res, o_again`.
Saoco: `s_cfg, s_ready, s_go, s_ev{ph,att,k}, s_cmd{ph,att,kind,pts,done}, s_stat, s_sc, s_fin, s_end, s_again` (host = árbitro en dupla).
4 en raya: `f_ready{r,gid}, f_go{first,gid}, f_mv{col,n}`.
Card-jitsu: `j_ready{r}, j_go{seed,gid}, j_pick{n,i,chi}`; bufandas: `belts{belts,key}` (fusión por máximo).
Reglas: el **host decide el flujo** de escenas y **solo él (o el modo solo) aplica `G.addSoles` / `G.recordWin`** para no duplicar. Cada cliente simula lo suyo y manda su estado; la pareja se ve como "fantasma".

## 7. Cómo probar
- Servir la carpeta: `python -m http.server 8000` → `http://localhost:8000`.
- Cocina: `?solo=1&me=sebas&go=cocina&clv=3&cauto=1&cdur=30` (TAB cambia de cocinero) · premio: `?solo=1&go=martuccini`.
- Modo solo (pareja simulada): `?solo=1&me=sebas&name=Sebas&go=<lugar>` donde `<lugar>` ∈ story, map, igloo, casa_sebas, kennedy, pucp…
  - Kennedy: `&kdur=30&kauto=1` · PUCP: `&prounds=3&pauto=1`.
- Pollos: `?solo=1&me=sebas&go=pollos&pdur=30&pdiff=normal&pauto=1` · Saoco: `?solo=1&me=sebas&go=salsa&smode=solo|dupla&sdiff=facil|normal|dificil&sauto=1`.
- 4 en raya: `?solo=1&me=sebas&go=conecta4&fauto=1&fgames=3` · Card-jitsu: `?solo=1&me=sebas&go=carjitsu&jauto=1&jgames=2&jbot=facil|normal|dificil`.
- Dos navegadores con servidor PeerJS local: `npx peerjs --host 0.0.0.0 --port 9000` y `?peerhost=localhost&peerport=9000` (ver `GUIA_PEERJS_GITHUB.md`).
- Capturas: Playwright con Chrome (`snap.py`). Revisar solapes con el HUD DOM (marcador arriba al centro; barra de 4 en raya y emotes abajo, y ≥ 210).

## 8. PENDIENTE (en orden sugerido)
- **Balance sin probar con juego real:** `DIFFS` en `pollos_sim.js`; ventanas, `pr` de las NPC y puntajes en `saoco.js`; el sincronismo audible solo se puede afinar con el "Ajuste de ritmo".
- **Balance de Card-jitsu y 4 en raya sin probar con juego real:** poderes, Chi (+4) y niveles de la IA (`J.botPick`, `C4.bestMove`); umbrales de bufanda en `J.BELTS`.
- ~~Etapa 8~~ ✅ hecha en v0.9 (ver arriba). Original: Pantalla final "Feliz 2 años y medio"**: se muestra cuando alguien llega a −50/+50; el texto se recalcula con el calendario desde el 11-may-2024 (`G.relLabel`, ya existe); animación súper cursi tipo Chicas Superpoderosas con estrellas, dibujos y corazones, muy lúdica. Premio narrativo: bubble tea pagado por el perdedor + bolsa de ramen especial + makis de Shimaya.
- **Etapa 9 — Playas (Callao y Los Yuyos/Barranco):** "Piedra, Frío y Resistencia" (lucha 1v1 con barra de vida y de temperatura/hipotermia, piedras como proyectil) y "Duelo de Canillitas de Chapa" (chapuzón con botones rápidos, carrera de equilibrio sobre piedras resbalosas con chamarra pesada, pulso cargando la piedra más pesada). **Trajes de baño** elegibles en el igloo (bikinis de Dani: marrón-celeste, celeste con manchas amarillas y blancas, rosado con flores amarillas, rojo cuadrado; shorts de Sebas). **Álbum de fotos vintage**: el ganador elige una de 4 poses (Sebas/Dani); se guarda para siempre en el igloo y se sincroniza.
- **Otros pendientes de la v0.3 no hechos:** portada con el malecón de Miraflores; que el mapa se vea como mapa real de Lima (ella enviará referencias); versión **día/noche** más marcada en lugares; **personalizar todo lo posible**; mesa de 4 en raya jugable; PNG/ilustraciones de la historia más caricaturescas.
- **Música por lugar:** ya hay estilos procedurales por lugar; falta afinarlos a lo pedido (lofi tipo Nujabes en general, reggaetón en casa de Daniela, hip-hop tranquilo en casa de Sebas, urbano en Pollos, rock en Kennedy, charanga/salsa en Saoco).
- **Entregables al cerrar cada etapa:** imágenes + explicación detallada, README (GitHub Pages en Windows) y `.txt/.md` de resumen.

## 9. Trampas conocidas
- El zip que subió Daniela era **v0.2** y no traía lo descrito como "v0.3" en el resumen de otro chat: se re-aplicó lo estructural (lugares, mapa, pelo, puffles). **Siempre revisar qué trae realmente el zip.**
- La casa de Daniela en Lince/San Miguel: es la **Cocina de Daniela (Lince)**. Antes se supuso San Miguel para el igloo; ya no aplica.
- Cocina (etapa 5): metas de estrellas, tiempos y frecuencia de pedidos están **sin playtest real**: ajustar en `LEVELS` (`src/kitchen_sim.js`) tras jugarlo ellos dos. Es cooperativa: **no mueve soles**.
- Preguntas que ella **no respondió** y se resolvieron por defecto: nombre real del bar (se usa "El Pollo Pier"), idioma (solo español), guardado del clóset entre sesiones (se guarda), (roles y tiempo de la cocina ya respondidos en la etapa 5).
- Frase cortada en sus notas: *"Quiero q en miraflores casa de sebastian me hagas que…"* (se perdió el final) → **preguntarle** qué quería en la casa de Sebas.
- El bubble tea de Kennedy es solo de la sesión (se limpia al cargar).
- Los récords viven en `localStorage` de cada navegador; si borran datos del navegador se pierden hasta reconectar (se recuperan del otro por sincronización).
- **Teclado:** no uses `Enter` como acción de juego (abre el chat del HUD). El `preventDefault` de flechas/espacio va en `window` tras arrancar Phaser (en `main.js`); si se pone antes, Phaser ignora esas teclas. En Phaser los números son `keydown-ONE`…`FIVE`.
- Bufandas: se suman con `G.awardBelts(semilla, {sebas,dani})`; la clave evita sumar dos veces la misma partida aunque llegue antes el aviso del otro.


## 10. Etapa 9 y modo local (v1.0)
Hechas: playas Callao y Yuyos, trajes de baño, álbum de fotos, bufandas (antes "cinturones"), decoración morada de la cocina, cierre con ambos frente a frente en el corazón, "2 años y medio" (redondeo por meses en `G.relMonths`) y `local.html` (una laptop, 2 jugadores). Ver `docs/COMPARATIVA_Y_APRENDIZAJES.md`.
