# 🌳 Grupo 7 — Árboles (Proyecto Interactivo)

Sitio web estático (HTML + CSS + JavaScript puro, sin frameworks ni instalación de dependencias) para aprender **árboles binarios** jugando. Incluye una página de teoría, tres módulos de juego y un panel de control de jugadores con ranking ponderado.

1. **Módulo 1 — Rescata el Árbol**: arrastra los nodos hasta reconstruir el árbol y responde un cuestionario (raíz, altura, profundidad, padre, hermanos).
2. **Módulo 2 — Búsqueda del Tesoro**: sigue instrucciones de navegación (raíz / padre / hijo izquierdo / hijo derecho) para llegar al tesoro.
3. **Módulo 3 — Escape Room**: calcula altura, profundidad y número de hojas para descifrar el código de una puerta.
4. **🏆 Panel de Control de Jugadores** (`jugadores.html`): cada estudiante se identifica con su nombre al empezar a jugar. Sus resultados en los tres módulos se guardan y se combinan en un **puntaje final ponderado**:

   ```
   puntajeFinal = (modulo1 × 0.30) + (modulo2 × 0.30) + (modulo3 × 0.40)
   ```

   El panel muestra tarjetas de resumen (total de jugadores, primero/segundo/tercer lugar, promedio general), un podio con los tres mejores puntajes, una tabla completa ordenable con buscador por nombre, y botones para agregar/eliminar jugadores, reiniciar el ranking y exportar los datos a **CSV** o **PDF**.

## Cómo funciona el registro de jugadores

- Al abrir cualquier página por primera vez, aparece un cuadro para escribir el nombre del jugador.
- Si el nombre ya existe en el ranking, se recupera su progreso; si no, se crea un jugador nuevo.
- El nombre activo se muestra en la barra de navegación con un botón "⇄" para cambiar de jugador (útil si varios estudiantes comparten el mismo equipo).
- Al terminar cada módulo, el puntaje de ese módulo (0–100) se guarda automáticamente para el jugador activo y el puntaje final ponderado se recalcula.
- Toda la información se guarda en `localStorage`, es decir, **queda solo en el navegador de cada dispositivo**. Si cada estudiante juega desde su propia computadora o celular, cada uno tendrá su propio ranking local — no hay sincronización entre dispositivos porque el proyecto no usa servidor/backend. Si se necesita un ranking centralizado con varios dispositivos a la vez, la recomendación es jugar todos desde una misma computadora (por ejemplo, en el proyector del aula) o agregar más adelante un backend (Google Sheets, Firebase, etc.).

## Estructura del proyecto

```
proyecto-arboles/
├── index.html          # Página de inicio
├── teoria.html         # Definiciones básicas y terminología
├── modulo1.html
├── modulo2.html
├── modulo3.html
├── jugadores.html       # Panel de Control de Jugadores (ranking ponderado)
├── css/
│   └── style.css        # Estilos compartidos por todas las páginas
├── js/
│   ├── common.js         # Datos del árbol + utilidades + sesión de jugador
│   ├── ranking.js        # Sistema de jugadores, puntaje ponderado y panel de control
│   ├── modulo1.js
│   ├── modulo2.js
│   └── modulo3.js
└── README.md
```

No requiere `npm install`, build ni servidor backend: es HTML/CSS/JS que corre directo en el navegador.

## Cómo abrirlo en Visual Studio Code

1. Descomprime la carpeta `proyecto-arboles` en tu computadora.
2. Abre VS Code → `Archivo > Abrir carpeta…` → selecciona `proyecto-arboles`.
3. Instala la extensión **Live Server** (de Ritwick Dey) desde el panel de extensiones.
4. Clic derecho sobre `index.html` → **"Open with Live Server"**. Se abrirá en `http://127.0.0.1:5500` con recarga automática al guardar cambios.

(También puedes abrir `index.html` directamente con doble clic desde el explorador de archivos; funciona sin servidor.)

## Cómo publicarlo con GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `arboles-grupo7`).
2. En VS Code, abre una terminal dentro de la carpeta del proyecto y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Proyecto Árboles - Grupo 7"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/arboles-grupo7.git
   git push -u origin main
   ```
3. En GitHub, entra al repositorio → **Settings > Pages**.
4. En "Build and deployment", selecciona **Source: Deploy from a branch**.
5. En "Branch" elige **main** y la carpeta **/ (root)** → **Save**.
6. Espera 1–2 minutos; GitHub mostrará la URL pública:
   ```
   https://TU-USUARIO.github.io/arboles-grupo7/
   ```
7. Cualquier `git push` posterior actualiza el sitio automáticamente.

## Notas técnicas

- El "arrastrar y soltar" del Módulo 1 se implementa con **Pointer Events** (funciona con mouse y con pantallas táctiles); además admite Enter/Espacio con teclado sobre una ficha para colocarla como alternativa accesible.
- Toda la geometría de los árboles (posición de nodos, altura, profundidad, hermanos, hojas) se calcula desde una sola fuente de datos en `js/common.js`, para mantener la teoría, los tres módulos y el panel de control siempre consistentes.
- El **puntaje ponderado** se calcula y guarda en `js/ranking.js` (`calcularPuntaje`, `actualizarJugador`, `obtenerRanking`).
- La **exportación a PDF** no usa librerías externas: abre el diálogo de impresión del navegador con una hoja de estilo `@media print` que oculta todo salvo la tabla de ranking; desde ahí se elige "Guardar como PDF".
- La **exportación a CSV** genera el archivo directamente en el navegador con un `Blob`, sin dependencias.
- El diseño es responsive (se adapta a celular) y respeta `prefers-reduced-motion` para quienes prefieren menos animaciones.
