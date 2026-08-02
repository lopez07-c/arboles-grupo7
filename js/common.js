/* ============================================================
   common.js — Grupo 7 · Árboles
   Datos y utilidades compartidas por todas las páginas:
   - Árbol de referencia fijo (usado en teoria.html)
   - Generador de árboles ALEATORIOS (estructura + letras) para
     los módulos 1, 2 y 3, de modo que cada partida sea distinta.
   - Funciones de geometría: altura, profundidad, hojas, hermanos,
     ancestros — una sola fuente de verdad para todo el proyecto.
   - Dibujo de las líneas del árbol en <svg>.
   - Niveles de dificultad compartidos (fácil / medio / difícil).
   - Sesión del jugador activo (localStorage) + badge en el navbar.
   ============================================================ */

/* ---------------------------------------------------------------
   Árbol de referencia FIJO — solo para teoria.html, para que las
   definiciones ("la raíz es A", "la altura es 2"...) tengan siempre
   el mismo ejemplo concreto delante del estudiante.
--------------------------------------------------------------- */
const TREE_A = {
  root: 'A',
  nodes: {
    A: { label: 'A', x: 50, y: 12, parent: null, left: 'B', right: 'C' },
    B: { label: 'B', x: 25, y: 50, parent: 'A', left: 'D', right: 'E' },
    C: { label: 'C', x: 75, y: 50, parent: 'A', left: 'F', right: 'G' },
    D: { label: 'D', x: 12, y: 88, parent: 'B', left: null, right: null },
    E: { label: 'E', x: 38, y: 88, parent: 'B', left: null, right: null },
    F: { label: 'F', x: 62, y: 88, parent: 'C', left: null, right: null },
    G: { label: 'G', x: 88, y: 88, parent: 'C', left: null, right: null },
  },
};

/* ---------------------------------------------------------------
   Dificultad compartida: cada pregunta de cada módulo declara un
   nivel; esto define cuántos puntos vale y cómo se ve su etiqueta.
--------------------------------------------------------------- */
const DIFICULTAD = {
  facil: { label: 'Fácil', puntos: 10, clase: 'dif-facil', icono: '🟢' },
  medio: { label: 'Medio', puntos: 15, clase: 'dif-medio', icono: '🟡' },
  dificil: { label: 'Difícil', puntos: 25, clase: 'dif-dificil', icono: '🔴' },
};

const POOL_LETRAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U'];

function barajar(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function elegirAleatorio(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---------------------------------------------------------------
   Generador de estructuras aleatorias (sin etiquetas todavía).
   - La raíz siempre tiene 2 hijos (para que "raíz", "hijo izq/der"
     tengan siempre sentido).
   - Cada hijo de nivel 1 tiene 0, 1 o 2 hijos propios (pesado hacia
     1-2 para casi siempre obtener árboles de 5 a 7 nodos y altura 2).
--------------------------------------------------------------- */
function generarEstructuraAleatoria() {
  let intento = 0;
  while (true) {
    intento++;
    const nodes = {};
    let contador = 0;
    function nuevoNodo(parent) {
      const id = 'n' + contador++;
      nodes[id] = { id, parent, left: null, right: null };
      return id;
    }
    const rootId = nuevoNodo(null);
    const bId = nuevoNodo(rootId);
    const cId = nuevoNodo(rootId);
    nodes[rootId].left = bId;
    nodes[rootId].right = cId;

    function hijosAleatorios(padreId) {
      const r = Math.random();
      if (r < 0.12) return; // sin hijos
      if (r < 0.52) { // un hijo
        const hijoId = nuevoNodo(padreId);
        if (Math.random() < 0.5) nodes[padreId].left = hijoId;
        else nodes[padreId].right = hijoId;
      } else { // dos hijos
        nodes[padreId].left = nuevoNodo(padreId);
        nodes[padreId].right = nuevoNodo(padreId);
      }
    }
    hijosAleatorios(bId);
    hijosAleatorios(cId);

    const total = Object.keys(nodes).length;
    if ((total >= 5 && total <= 7) || intento > 30) {
      return { root: rootId, nodes };
    }
  }
}

/* Calcula x/y (en %) para cada nodo según su profundidad y el
   orden de las hojas, para que las líneas del árbol siempre luzcan
   ordenadas sin importar la forma generada. */
function calcularLayout(estructura) {
  const { root, nodes } = estructura;

  function hojasDe(id) {
    const n = nodes[id];
    if (!n.left && !n.right) return [id];
    let out = [];
    if (n.left) out = out.concat(hojasDe(n.left));
    if (n.right) out = out.concat(hojasDe(n.right));
    return out;
  }

  const hojas = hojasDe(root);
  const totalHojas = hojas.length;
  hojas.forEach((id, i) => {
    nodes[id].x = totalHojas === 1 ? 50 : 10 + i * (80 / (totalHojas - 1));
  });

  function fijarX(id) {
    if (nodes[id].x !== undefined) return nodes[id].x;
    const xs = [];
    if (nodes[id].left) xs.push(fijarX(nodes[id].left));
    if (nodes[id].right) xs.push(fijarX(nodes[id].right));
    nodes[id].x = xs.reduce((a, b) => a + b, 0) / xs.length;
    return nodes[id].x;
  }
  fijarX(root);

  function fijarY(id, prof) {
    nodes[id].y = 12 + prof * 38;
    if (nodes[id].left) fijarY(nodes[id].left, prof + 1);
    if (nodes[id].right) fijarY(nodes[id].right, prof + 1);
  }
  fijarY(root, 0);

  return estructura;
}

/* Genera un árbol COMPLETO listo para usar: estructura + layout +
   letras aleatorias distintas en cada llamada. Esta es la función
   que usan los 3 módulos para que cada partida sea diferente. */
function generarArbolAleatorio() {
  const estructura = calcularLayout(generarEstructuraAleatoria());
  const ids = Object.keys(estructura.nodes);
  const letras = barajar(POOL_LETRAS).slice(0, ids.length);
  const tree = { root: estructura.root, nodes: {} };
  ids.forEach((id, i) => {
    tree.nodes[id] = { ...estructura.nodes[id], label: letras[i] };
  });
  return tree;
}

/* ---------------------------------------------------------------
   Geometría / propiedades del árbol — una sola fuente de verdad
   usada por teoría, los 3 módulos y las preguntas del quiz.
--------------------------------------------------------------- */
function obtenerHijos(tree, id) {
  const n = tree.nodes[id];
  return [n.left, n.right].filter(Boolean);
}

function esHoja(tree, id) {
  return obtenerHijos(tree, id).length === 0;
}

function obtenerHojas(tree) {
  return Object.keys(tree.nodes).filter((id) => esHoja(tree, id));
}

function profundidadDe(tree, id) {
  let p = 0;
  let cur = id;
  while (tree.nodes[cur].parent) {
    p++;
    cur = tree.nodes[cur].parent;
  }
  return p;
}

function alturaDe(tree, id) {
  const hijos = obtenerHijos(tree, id);
  if (hijos.length === 0) return 0;
  return 1 + Math.max(...hijos.map((h) => alturaDe(tree, h)));
}

function alturaArbol(tree) {
  return alturaDe(tree, tree.root);
}

function hermanosDe(tree, id) {
  const padreId = tree.nodes[id].parent;
  if (!padreId) return [];
  return obtenerHijos(tree, padreId).filter((h) => h !== id);
}

function ancestrosDe(tree, id) {
  const out = [];
  let cur = tree.nodes[id].parent;
  while (cur) {
    out.push(cur);
    cur = tree.nodes[cur].parent;
  }
  return out;
}

function etiqueta(tree, id) {
  return tree.nodes[id] ? tree.nodes[id].label : null;
}

function idPorEtiqueta(tree, label) {
  return Object.keys(tree.nodes).find((id) => tree.nodes[id].label === label) || null;
}

function nodosOrdenados(tree) {
  // Orden estable: por profundidad y luego por x, para listas de preguntas consistentes.
  return Object.keys(tree.nodes).sort((a, b) => {
    const na = tree.nodes[a];
    const nb = tree.nodes[b];
    return na.y - nb.y || na.x - nb.x;
  });
}

/* ---------------------------------------------------------------
   Dibujo de las líneas (aristas) del árbol dentro de un <svg>.
--------------------------------------------------------------- */
function drawTreeLines(svg, tree) {
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.innerHTML = '';
  Object.values(tree.nodes).forEach((n) => {
    [n.left, n.right].forEach((hijoId) => {
      if (!hijoId) return;
      const h = tree.nodes[hijoId];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', n.x);
      line.setAttribute('y1', n.y);
      line.setAttribute('x2', h.x);
      line.setAttribute('y2', h.y);
      line.setAttribute('class', 'tree-edge');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(line);
    });
  });
}

/* ---------------------------------------------------------------
   Utilidad de dificultad: arma un badge <span> reutilizable.
--------------------------------------------------------------- */
function badgeDificultad(nivel) {
  const d = DIFICULTAD[nivel];
  const span = document.createElement('span');
  span.className = 'dif-badge ' + d.clase;
  span.textContent = `${d.icono} ${d.label} · ${d.puntos} pts`;
  return span;
}

/* ---------------------------------------------------------------
   Sesión de jugador activo — compartida por todas las páginas.
--------------------------------------------------------------- */
const LS_ACTIVE_PLAYER = 'arboles_jugador_activo';

function obtenerJugadorActivo() {
  return localStorage.getItem(LS_ACTIVE_PLAYER) || '';
}

function fijarJugadorActivo(nombre) {
  localStorage.setItem(LS_ACTIVE_PLAYER, nombre.trim());
}

function escaparHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function initPlayerSession() {
  const slot = document.getElementById('playerBadgeSlot');
  if (!slot) return;

  function render() {
    const nombre = obtenerJugadorActivo();
    slot.innerHTML = '';
    const badge = document.createElement('span');
    badge.className = 'player-badge';
    if (nombre) {
      badge.innerHTML = `<span class="player-dot"></span>${escaparHTML(nombre)}<button type="button" class="player-switch" title="Cambiar de jugador">⇄</button>`;
    } else {
      badge.innerHTML = `<button type="button" class="btn btn-ghost btn-small player-set">👤 Identificarme</button>`;
    }
    slot.appendChild(badge);
    const btn = badge.querySelector('.player-switch, .player-set');
    if (btn) btn.addEventListener('click', pedirNombre);
  }

  function pedirNombre() {
    const actual = obtenerJugadorActivo();
    const nombre = prompt('¿Cuál es tu nombre?', actual || '');
    if (nombre && nombre.trim()) {
      fijarJugadorActivo(nombre.trim());
      if (typeof asegurarJugador === 'function') asegurarJugador(nombre.trim());
      render();
    }
  }

  render();
  if (!obtenerJugadorActivo()) {
    setTimeout(pedirNombre, 200);
  }
}
