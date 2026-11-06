# Anime Clash 3D

Juego de peleas 3D para el navegador, pensado para jugar en el celular y sin instalar nada.

**[Jugar ahora](https://nahuelbenitezs.github.io/Anime-Clash-3D/)**

> Proyecto de fans, sin fines de lucro y sin relación con los dueños de las marcas. No es un producto oficial. Goku y Vegeta pertenecen a Akira Toriyama, Shueisha y Toei Animation; Pikachu y Charizard, a Nintendo, Game Freak y The Pokémon Company. Si alguno de los titulares pide retirar algo, se retira.

## Cómo jugar

Peleás contra la CPU al mejor de tres rondas, de 60 segundos cada una. Gana la ronda quien deja al rival sin vida o, si se acaba el tiempo, quien conserva más vida en proporción.

| Acción | Teclado | Celular | Qué hace |
| --- | --- | --- | --- |
| Moverse | `W` `A` `S` `D` o flechas | Palanca izquierda | Te movés por todo el ring |
| Golpe | `J` | Puño | Combo de tres golpes; el tercero rompe la guardia y empuja |
| Ráfaga | `K` | Rayo | Disparo a distancia que gasta ki |
| Cargar ki | `L` (mantener) | Llama (mantener) | Junta ki, pero te deja quieto |
| Definitivo | `U` | Estrella | Ataque especial; se puede usar cuando el ki pasa la marca de la barra |
| Guardia | `I` (mantener) | Escudo (mantener) | Reduce mucho el daño; se rompe con el tercer golpe del combo |
| Esquivar | `Espacio` | Flechas | Dash con un instante de invulnerabilidad |
| Pausa | `Esc` | Botón de pausa | También se pausa sola si cambiás de app |

Algunos consejos:

- **Los definitivos se esquivan de costado:** la dirección queda fija cuando empieza la carga.
- **Dos ráfagas que chocan se anulan.**
- **Recibir daño da ki,** así que quien va perdiendo suele tener una oportunidad de remontar.

## Luchadores

| Luchador | Vida | Estilo | Definitivo |
| --- | --- | --- | --- |
| Goku | 150 | Equilibrado | Kamehameha: rayo largo |
| Vegeta | 144 | Agresivo, golpea más fuerte | Final Flash: rayo ancho y de carga lenta |
| Pikachu | 122 | Rápido, cuerpo chico y ki barato | Impactrueno: rayo eléctrico fino y de carga rápida |
| Charizard | 152 | Pesado, más alcance | Lanzallamas: llamarada corta y ancha |

La CPU tiene tres niveles (fácil, normal y difícil) y juega con las mismas reglas que vos: mismos enfriamientos, mismo ki y mismo daño. Lo que cambia es cuánto tarda en reaccionar y con qué frecuencia esquiva o se cubre.

## Jugarlo en tu compu

No necesita compilación. Hace falta un servidor local porque los modelos no se pueden cargar abriendo el archivo directamente:

```bash
python -m http.server 8000
```

Después abrí <http://localhost:8000>.

## Cómo está hecho

- **Three.js r128 sin compiladores:** JavaScript directo, servido por GitHub Pages. Three.js y Draco están en `vendor/` para que el juego no dependa de otros servidores.
- **Un solo sistema de animación:** cada modelo queda fijo en una pose base y [`js/rig.js`](js/rig.js) lo anima por huesos, con poses escritas en los ejes del personaje. Así los cuatro tienen el mismo set de movimientos, aunque cada esqueleto sea distinto.
- **Lógica separada del dibujo:** toda la pelea corre en `Game.step(dt)`. Por eso la pausa detiene el tiempo de verdad y se pueden simular cientos de peleas en segundos.
- **Equilibrio medido:** los números de [`js/roster.js`](js/roster.js) se ajustaron simulando peleas de CPU contra CPU entre todos los luchadores.
- **Pensado para celular:** las partículas usan una sola llamada de dibujo y, si el juego baja de 42 cuadros por segundo, reduce solo la resolución, las sombras y los efectos.

### El bug de los brazos estirados

Goku aparecía con los brazos y las piernas deformados. No era la animación: los *morph targets* de su modelo estaban exportados a otra escala, unas 32 veces mayor, y solo se activaban en algunos clips. Se corrigieron dentro del archivo `.glb`. Esa escala también arruinaba el cálculo del tamaño del modelo, que ahora se hace sobre la malla ya deformada por los huesos.

## Qué se probó y qué no

@@TESTS@@

## Créditos

- Modelos 3D de Goku, Pikachu y Charizard: obtenidos de terceros, sin autoría registrada en este repositorio.
- Vegeta, arena, efectos, música y sonidos: generados por código en este proyecto.
- [Three.js](https://threejs.org), con licencia MIT.
- Tipografías [Bangers](https://fonts.google.com/specimen/Bangers) y [Rajdhani](https://fonts.google.com/specimen/Rajdhani), desde Google Fonts.
