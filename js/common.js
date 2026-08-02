/* ============================================================
   common.js
   Datos del árbol compartidos por todas las páginas + utilidades
   de geometría del árbol + sesión de jugador (nombre actual).
   ============================================================ */

/* ---------- 1. Datos del árbol de referencia ----------
   Árbol binario usado en teoria.html, modulo1.html y modulo2.html.
   Posiciones en porcentaje (x, y) dentro de #stage para que el
   layout sea responsive sin recalcular en JS.
------------------------------------------------------------- */
const TREE_A = {
  root: 'A',
  nodes: {
    A: { label: 'A', x: 50, y: 8  },
    B: { label: 'B', x: 25, y: 45 },
    C: { label: 'C', x: 75, y: 45 },
    D: { label: 'D', x: 10, y: 84 },
    E: { label: 'E', x: 40, y: 84 },
    F: { label: 'F', x: 60, y: 84 },
    G: { label: 'G', x: 90, y: 84 }
  },
  edges: [
    ['A', 'B'], ['A', 'C'],
    ['B', 'D'], ['B', 'E'],
    ['C', 'F'], ['C', 'G']
  ]
};

/* ---------- 2. Utilidades de geometría del árbol ---------- */

/** Devuelve un mapa { padre: [hijoIzq, hijoDer] } a partir de las aristas. */
function getChildrenMap(tree) {
  const map = {};
  Object.keys(tree.nodes).forEach(id => (map[id] = []));
  tree.edges.forEach(([parent, child]) => map[parent].push(child));
  return map;
}

/** Devuelve un mapa { hijo: padre } a partir de las aristas. */
function getParentMap(tree) {
  const map = {};
  tree.edges.forEach(([parent, child]) => (map[child] = parent));
  return map;
}

/** Profundidad de un nodo: nº de aristas desde la raíz hasta él. */
function getDepth(tree, nodeId) {
  const parentMap = getParentMap(tree);
  let depth = 0;
  let current = nodeId;
  while (parentMap[current] !== undefined) {
    depth++;
    current = parentMap[current];
  }
  return depth;
}

/** Altura de un nodo: camino más largo hasta una hoja de su subárbol. */
function getHeight(tree, nodeId) {
  const childrenMap = getChildrenMap(tree);
  const children = childrenMap[nodeId] || [];
  if (children.length === 0) return 0;
  return 1 + Math.max(...children.map(c => getHeight(tree, c)));
}

/** Altura del árbol completo = altura de la raíz. */
function getTreeHeight(tree) {
  return getHeight(tree, tree.root);
}

/** Lista de ids de las hojas del árbol (nodos sin hijos). */
function getLeaves(tree) {
  const childrenMap = getChildrenMap(tree);
  return Object.keys(tree.nodes).filter(id => childrenMap[id].length === 0);
}

/** Hermanos de un nodo: otros hijos de su mismo padre. */
function getSiblings(tree, nodeId) {
  const parentMap = getParentMap(tree);
  const childrenMap = getChildrenMap(tree);
  const parent = parentMap[nodeId];
  if (parent === undefined) return [];
  return childrenMap[parent].filter(id => id !== nodeId);
}

/** Padre de un nodo (o null si es la raíz). */
function getParent(tree, nodeId) {
  const parentMap = getParentMap(tree);
  return parentMap[nodeId] !== undefined ? parentMap[nodeId] : null;
}

/** Hijo izquierdo / derecho de un nodo (según el orden de las aristas). */
function getChild(tree, nodeId, side) {
  const childrenMap = getChildrenMap(tree);
  const children = childrenMap[nodeId] || [];
  if (side === 'izquierdo') return children[0] || null;
  if (side === 'derecho') return children[1] || null;
  return null;
}

/** Dibuja las líneas (aristas) del árbol dentro de un <svg>. */
function drawTreeLines(svg, tree) {
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.innerHTML = '';
  tree.edges.forEach(([parentId, childId]) => {
    const p = tree.nodes[parentId];
    const c = tree.nodes[childId];
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p.x);
    line.setAttribute('y1', p.y + 3);
    line.setAttribute('x2', c.x);
    line.setAttribute('y2', c.y - 3);
    line.setAttribute('class', 'edge-line');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(line);
  });
}

/* ---------- 3. Sesión de jugador ----------
   Antes de jugar, cada estudiante se identifica con su nombre.
   Si ya existe en localStorage, se recupera su progreso; si no,
   se crea un registro nuevo. El nombre activo se guarda en
   localStorage bajo 'jugadorActual' para no volver a preguntar
   en cada página durante la misma sesión de navegación.
------------------------------------------------------------- */

const RANKING_KEY = 'jugadores';
const SESSION_KEY = 'jugadorActual';

function normalizarNombre(nombre) {
  return nombre.trim().replace(/\s+/g, ' ');
}

/** Muestra (si hace falta) el modal de identificación y devuelve
 *  el nombre del jugador activo vía callback `onReady(nombre)`. */
function initPlayerSession(onReady) {
  const actual = localStorage.getItem(SESSION_KEY);
  if (actual) {
    renderPlayerBadge(actual);
    if (onReady) onReady(actual);
    return;
  }
  mostrarModalJugador((nombre) => {
    localStorage.setItem(SESSION_KEY, nombre);
    if (typeof guardarJugador === 'function') guardarJugador(nombre);
    renderPlayerBadge(nombre);
    if (onReady) onReady(nombre);
  });
}

/** Crea y muestra el modal de "¿Quién juega?". */
function mostrarModalJugador(onSubmit) {
  const overlay = document.createElement('div');
  overlay.className = 'player-modal-overlay';
  overlay.innerHTML = `
    <div class="player-modal" role="dialog" aria-modal="true" aria-labelledby="playerModalTitle">
      <span class="player-modal-icon">🌳</span>
      <h2 id="playerModalTitle">¿Quién va a jugar?</h2>
      <p>Escribe tu nombre para guardar tu progreso y aparecer en el ranking.</p>
      <form id="playerModalForm">
        <input type="text" id="playerModalInput" placeholder="Tu nombre" autocomplete="off" required maxlength="40">
        <button type="submit" class="btn btn-primary">Empezar a jugar →</button>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#playerModalInput');
  const form = overlay.querySelector('#playerModalForm');
  setTimeout(() => input.focus(), 50);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = normalizarNombre(input.value);
    if (!nombre) return;
    overlay.remove();
    onSubmit(nombre);
  });
}

/** Muestra el nombre del jugador activo en la barra de navegación,
 *  con un enlace para cambiar de jugador. */
function renderPlayerBadge(nombre) {
  const slot = document.getElementById('playerBadgeSlot');
  if (!slot) return;
  slot.innerHTML = `
    <span class="player-badge">
      <span class="player-badge-dot"></span>
      ${nombre}
      <button type="button" id="switchPlayerBtn" class="player-badge-switch" title="Cambiar de jugador">⇄</button>
    </span>`;
  const switchBtn = slot.querySelector('#switchPlayerBtn');
  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      localStorage.removeItem(SESSION_KEY);
      location.reload();
    });
  }
}

/** Devuelve el nombre del jugador activo (o null si no hay sesión). */
function getJugadorActual() {
  return localStorage.getItem(SESSION_KEY);
}
