# Lima de a dos 💜🐧  (v1.0)

Juego pixel-art para dos personas (Sebas y Daniela). Gratis, sin cuentas ni membresías. **Una sola carpeta, dos enlaces:**

| Modo | Enlace | Cuándo |
|---|---|---|
| 🌐 **Dos laptops** (online) | `index.html` | Cada uno en su laptop, unidos con un **código de sala** (PeerJS). |
| 🎮 **Una laptop** (2 mandos o teclado) | `local.html` | Los dos en la misma laptop, pantalla dividida. |

## Modo una laptop (`local.html`)
- Pantalla dividida (lado a lado o arriba/abajo) y botón de pantalla completa. No necesita internet ni código de sala.
- **Jugador 1 (Sebas):** mover `W A S D` · acción/saltar/lanzar `F` · usar/golpear `E` · libreta `Q` · cartas `1–5`.
- **Jugador 2 (Dani):** mover `↑ ← ↓ →` · acción `Enter` · usar/golpear `Shift derecho` · libreta `.` · cartas `Num 1–5`.
- **Mandos:** el mando 1 controla a Sebas y el mando 2 a Dani (palanca o cruceta; A = acción, X = usar, Y = libreta). Pulsa un botón del mando para que el navegador lo detecte.
- Cada jugador guarda su propio progreso (el de la partida se sincroniza entre las dos pantallas).
- Limitación: como comparten pantalla, en **Card-jitsu** y **Pollos** el otro puede ver tu información oculta (cartas, pedidos). Para esos dos juegos conviene jugar online.
- Usa Chrome o Edge.

## Comandos (Windows)
1. Instala Python desde python.org (marca "Add to PATH") o usa la extensión *Live Server* de VS Code.
2. En la carpeta del juego, abre una terminal: `python -m http.server 8000`
3. Online: `http://localhost:8000/index.html` · Una laptop: `http://localhost:8000/local.html`
4. Modo prueba de una persona (la pareja es un bot): `http://localhost:8000/index.html?solo=1&me=sebas&name=Sebas&go=LUGAR`
   - `LUGAR` ∈ `story, map, igloo, casa_sebas, kennedy, pucp, cocina, martuccini, pollos, salsa, carjitsu, conecta4, callao, yuyos, foto, fin`
   - Playas: `&aauto=1` (Callao, bot) · `&yauto=1` (Yuyos) · Final: `go=fin&bal=50`

## Cómo publicarlo gratis en GitHub Pages
1. Crea cuenta en github.com (gratis).
2. Botón **New repository** → nombre `lima-de-a-dos` → **Public** → Create.
3. **Add file → Upload files**: arrastra TODO el contenido de la carpeta (index.html, src, vendor…). NO subas fotos originales ni la carpeta `shots`. → Commit changes.
4. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, carpeta `/ (root)` → Save.
5. En 1–2 minutos tendrás el link: `https://TU-USUARIO.github.io/lima-de-a-dos/`
6. Pásale el link a Sebas.

## Cómo jugar juntos
1. Cada uno abre el link. Elige "¿Quién eres?" (Sebas o Daniela) y escribe su nombre.
2. Una persona pulsa **Crear sala** y te da un código de 5 caracteres; la otra lo escribe en **Unirme**.
3. Se ve la historia del pingüino, luego el igloo conjunto (su base), y desde la puerta el Mapa de Lima (con scroll: ↑↓, rueda o arrastrar; Callao arriba, Barranco abajo).
Si se cae la conexión, el juego se pausa y se reanuda al reconectar (botón ↻ Reconectar).

## Controles
Flechas/WASD mover · E o Espacio usar · Enter chat · 1–7 emotes · ⚙ Ajustes (música, día/noche, marcador, récords).

## Etapas
1 base+historia ✅ · 2 igloo/clóset/mapa ✅ · 3 Kennedy (carrera de gatos) ✅ · 4 PUCP (escondidas) ✅ · 5 Cocina Los Ccellis ✅ · 6 Pollos + Academia Saoco ✅ · 7 Cuatro en raya + Card-jitsu ✅ · 8 pantalla final "Feliz 2 años y medio" ✅ · 9 playas (Callao y Los Yuyos), trajes de baño y álbum de fotos ✅ · 10 modo una laptop ✅.


## Kennedy · Carrera de gatos
Saltar: ↑ / W / Espacio / click · Agacharse: ↓ / S. Eligen 2, 3 o 5 min y los dos pulsan ¡Listo!. Gana quien más metros haga; premio S/ 10 + bubble tea de accesorio (solo esta sesión). Chocar no mata: te hace tropezar.

## PUCP · Escondidas
Mover: flechas/WASD · Esconderse/salir: E o Espacio. Cada escondite es de una sola persona. El guardia revisa escondites (mira el "?") y el estudiante mira con su cono. Eligen 3, 5 o 7 rondas; gana quien sea visto menos veces. Prueba solo: `?solo=1&me=sebas&go=pucp&prounds=3&pauto=1`.


## Los Ccellis · Cocina de ramen (etapa 5)
Overcooked de ramen para dos, en la Cocina de Daniela (Lince). **Los dos pueden hacer de todo**; no hay roles fijos, pero cada nivel cambia la cocina:
1 abierta · 2 dos islas (tocino y segundos) · 3 **dividida** (cada uno a un lado, pasan todo por el PASE) · 4 arriba/abajo (ramen a mano) · 5 lados invertidos y CCELLI SUPREMO.
- Mover: flechas/WASD · **E / Espacio / click** = agarrar, soltar y usar lo que tienes enfrente · **mantén pulsado** para cortar, amasar, sellar el sobre y servir caldo.
- Antes de cada nivel hay una **ventana tutorial** (estaciones, receta paso a paso, pedidos del nivel y novedades). Los dos pulsan ¡A cocinar!. El anfitrión elige el nivel.
- Receta: fideos → **olla** (8 s) · hongos → **tabla** · ají en el **sobre** (hasta 3) + mantén para sellar · huevo → olla → tabla · todo al plato sobre una mesa · **al final el caldo** (plato al caldero) → **ventanilla**. Lo que se pasa de cocción **se quema**. No hay platos que lavar.
- Cada pedido tiene barra de paciencia; el tiempo corre; ★ 1 estrella para pasar. Superar el nivel 5 desbloquea el **premio: fideos Martuccini** (salsa rosada, langostinos y picante) y la foto vintage de los dos compartiendo plato.
- Prueba en una sola laptop: `?solo=1&me=sebas&go=cocina&clv=3&cauto=1` (**TAB** cambia de cocinero) · `&cdur=30` acorta el nivel · `&cpage=2` abre una página del tutorial · `?solo=1&go=martuccini` ve el premio.
- Ajustar la dificultad: `LEVELS` en `src/kitchen_sim.js` (tiempo `dur`, frecuencia de pedidos `every`, paciencia `pat`, metas de estrellas `goals`, recetas `pool`).

## El Pollo Pier · Memoria de pedidos (etapa 6)
Los dos atienden **su propio bar** con los **mismos clientes** (misma semilla), y gana quien junta más puntos (el ganador recibe S/ 10; empate = nadie mueve soles). Solo hay **cerveza** y **salchipapas**.
- Cada mesa muestra su pedido en un globo **unos segundos y se borra**: hay que **memorizarlo**. Con cada cliente nuevo el **aforo** (barra con reloj) se va llenando; a los 3 errores graves se llena el bar y se acaba.
- Mover: flechas/WASD · **mantén E** en el grifo o la freidora para llenar · **E** en una mesa para servir · **Q** = libreta (3 usos, vuelve a mostrar el pedido) · **E** en el tacho vacía la bandeja.
- Dificultad Fácil/Normal/Difícil y duración 90/150/210 s en la sala de espera. Ajustes en `DIFFS` de `src/pollos_sim.js`.
- Prueba: `?solo=1&me=sebas&go=pollos&pdur=30&pdiff=normal&pauto=1`

## Academia Saoco · Baile de salsa (etapa 6)
Baile de flechas estilo disco de Club Penguin, con música procedural: **Habanera de Lince** (fácil), **Salsa Saoco** (normal) y **Charanga Ccelli** (difícil).
- **Solitario ("el VS yo")**: toda la canción, combo hasta ×2, contra tu propio récord (no mueve soles).
- **Dupla**: bailan por frases; si **uno falla, los dos repiten la frase**. Compiten contra dos duplas NPC ("Los Rumberos" y "Las Pimienta"); el podio al primer lugar guarda récord para ambos.
- Controles: ← ↓ ↑ → (o WASD) al compás cuando las flechas llegan a los receptores. En la sala hay **Ajuste de ritmo ± 20 ms** por si tu audio llega con retraso.
- Prueba: `?solo=1&me=sebas&go=salsa&smode=solo|dupla&sdiff=facil|normal|dificil&sauto=1`

## Cuatro en raya · mesa del igloo (etapa 7)
Se juega desde la **mesa del igloo** (acércate y pulsa E). Tablero 7×6, por turnos: **Sebas = rojas, Dani = amarillas**.
- Mover la ficha: ← → o el mouse · soltar: ↓ / Espacio / E / clic. Reloj de 20 s por turno (si se acaba, cae una ficha sola).
- El **contador global nunca se cierra**: se ve arriba en el HUD y en la propia escena (cuántas veces ganó cada uno). Empieza la partida el que perdió la anterior.
- No mueve soles (se puede jugar sin parar); lo que cuenta es el contador.
- Prueba: `?solo=1&me=sebas&go=conecta4&fauto=1&fgames=3`

## Dojo de San Martín · Card-jitsu estilo Avatar (etapa 7)
Duelo de cartas Dani vs Sebas. Cada uno elige una carta en secreto y se revelan juntas.
- **Elementos:** Fuego, Agua, Tierra y Aire. Agua vence a Fuego, Fuego a Aire, Aire a Tierra y Tierra a Agua. Si son iguales u opuestos, gana el mayor **poder** (1–8).
- **Chi ⚡:** una vez por partida tu carta suma +4 (el otro no lo sabe hasta que se revela).
- **Se gana** juntando 3 cartas del mismo elemento o 3 elementos distintos. El ganador se lleva **S/ 10**.
- **Bufandas (para siempre):** ganar da +3 puntos y perder +1. Rangos: Aprendiz → Aire (3) → Agua (8) → Tierra (15) → Fuego (25) → Maestro Avatar (40). Se eligen en el clóset (Accesorios).
- Controles: 1–5 o ← → para elegir, **Espacio** para jugar, **C** para activar el Chi. También con el mouse.
- Prueba: `?solo=1&me=sebas&go=carjitsu&jauto=1&jgames=2&jbot=normal`


## Playas (etapa 9)
- **Callao · Piedra, Frío y Resistencia:** lucha 1 vs 1 al mejor de 3. Barra de vida y de temperatura; recoge piedras y lánzalas con `Espacio`; cuerpo a cuerpo con `E`. Las fogatas te calientan.
- **Los Yuyos · Duelo de Canillitas de Chapa:** 3 pruebas (chapuzón con ← → alternados, equilibrio sobre piedras con `Espacio`, pulso de la piedra pesada). El ganador recibe S/ 10.
- **Trajes de baño:** se eligen en el Clóset → pestaña *Playa*.
- **Álbum:** el ganador pulsa "📸 ¡Tomar la foto!", elige una de 4 poses y la foto vintage queda guardada en el igloo (marcos en la pared; `E` para ver el álbum).
