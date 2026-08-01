# 🌳 Grupo 7 — Árboles (Proyecto Interactivo)

Sitio web estático (HTML + CSS + JavaScript puro, sin frameworks ni instalación de dependencias) para aprender **árboles binarios** jugando. Incluye una página de teoría y tres módulos de juego:

1. **Módulo 1 — Rescata el Árbol**: arrastra los nodos hasta reconstruir el árbol y responde un cuestionario (raíz, altura, profundidad, padre, hermanos).
2. **Módulo 2 — Búsqueda del Tesoro**: sigue instrucciones de navegación (raíz / padre / hijo izquierdo / hijo derecho) para llegar al tesoro.
3. **Módulo 3 — Escape Room**: calcula altura, profundidad y número de hojas para descifrar el código de una puerta.

## Estructura del proyecto

```
proyecto-arboles/
├── index.html          # Página de inicio
├── teoria.html         # Definiciones básicas y terminología
├── modulo1.html
├── modulo2.html
├── modulo3.html
├── css/
│   └── style.css       # Estilos compartidos por todas las páginas
├── js/
│   ├── common.js        # Datos de los árboles + utilidades (altura, profundidad, etc.)
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

(También puedes abrir `index.html` directamente con doble clic desde el explorador de archivos; funciona sin servidor, pero Live Server da mejor experiencia de desarrollo.)

## Cómo publicarlo con GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `arboles-grupo7`).
2. En VS Code, abre una terminal (`Ctrl+ñ` / `Ctrl+backtick`) dentro de la carpeta del proyecto y ejecuta:
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
6. Espera 1–2 minutos; GitHub mostrará la URL pública, con este formato:
   ```
   https://TU-USUARIO.github.io/arboles-grupo7/
   ```
7. Cualquier `git push` posterior actualiza el sitio automáticamente.

> Alternativa rápida: también puedes usar la extensión **"GitHub Pages"** o el comando `gh repo create` de la GitHub CLI directamente desde la terminal de VS Code si la tienes instalada.

## Notas técnicas

- El "arrastrar y soltar" del Módulo 1 y los recorridos del Módulo 2 se implementan con **Pointer Events** (funcionan con mouse y con pantallas táctiles).
- Toda la geometría de los árboles (posición de nodos, altura, profundidad, hermanos, hojas) se calcula desde una sola fuente de datos en `js/common.js`, para mantener la teoría y los tres módulos siempre consistentes.
- El diseño es responsive (se adapta a celular) y respeta `prefers-reduced-motion` para quienes prefieren menos animaciones.
