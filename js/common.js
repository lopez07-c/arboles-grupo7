/* ==========================================================================
   Grupo 7 · Árboles — utilidades compartidas
   ==========================================================================
   Define la geometría (en % del contenedor, 0-100) de los dos árboles usados
   en el proyecto y funciones auxiliares reutilizadas por los tres módulos.
   ========================================================================== */

/* Árbol grande (7 nodos) — usado en Teoría, Módulo 1 y Módulo 2
        A
      /   \
     B     C
    / \   / \
   D  E  F  G
*/
const TREE_A = {
  nodes: {
    A: { x: 50, y: 10, parent: null,  label: 'A' },
    B: { x: 26, y: 46, parent: 'A',   label: 'B' },
    C: { x: 74, y: 46, parent: 'A',   label: 'C' },
    D: { x: 12, y: 84, parent: 'B',   label: 'D' },
    E: { x: 39, y: 84, parent: 'B',   label: 'E' },
    F: { x: 61, y: 84, parent: 'C',   label: 'F' },
    G: { x: 88, y: 84, parent: 'C',   label: 'G' },
  },
  root: 'A',
  edges: [ ['A','B'], ['A','C'], ['B','D'], ['B','E'], ['C','F'], ['C','G'] ]
};

/* Árbol pequeño (4 nodos) — usado en Módulo 3 (Escape Room)
       A
      / \
     B   C
    /
   D
*/
const TREE_B = {
  nodes: {
    A: { x: 50, y: 12, parent: null, label: 'A' },
    B: { x: 25, y: 50, parent: 'A',  label: 'B' },
    C: { x: 75, y: 50, parent: 'A',  label: 'C' },
    D: { x: 25, y: 88, parent: 'B',  label: 'D' },
  },
  root: 'A',
  edges: [ ['A','B'], ['A','C'], ['B','D'] ]
};

/** Dibuja las líneas (ramas) de un árbol dentro de un <svg class="tree-lines">
 *  usando viewBox 0 0 100 100, coherente con el posicionamiento en % de los
 *  nodos (divs .tree-node). */
function drawTreeLines(svgEl, tree){
  svgEl.setAttribute('viewBox', '0 0 100 100');
  svgEl.setAttribute('preserveAspectRatio', 'none');
  svgEl.innerHTML = '';
  tree.edges.forEach(([from, to]) => {
    const a = tree.nodes[from];
    const b = tree.nodes[to];
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${a.x} ${a.y} L ${b.x} ${b.y}`);
    svgEl.appendChild(path);
  });
}

/** Calcula hijos de cada nodo a partir de "parent" */
function childrenOf(tree, id){
  return Object.keys(tree.nodes).filter(k => tree.nodes[k].parent === id);
}

/** Devuelve el hijo izquierdo/derecho según coordenada x (menor x = izquierda) */
function leftRightChildren(tree, id){
  const kids = childrenOf(tree, id).map(k => tree.nodes[k]);
  kids.sort((a,b) => a.x - b.x);
  return { left: kids[0] ? kids[0].label : null, right: kids[1] ? kids[1].label : null };
}

/** Profundidad de un nodo (número de aristas hasta la raíz) */
function depthOf(tree, id){
  let d = 0, cur = tree.nodes[id];
  while(cur.parent){ d++; cur = tree.nodes[cur.parent]; }
  return d;
}

/** Altura del árbol completo (profundidad máxima) */
function heightOf(tree){
  return Math.max(...Object.keys(tree.nodes).map(k => depthOf(tree, k)));
}

/** Hermanos de un nodo (mismo padre, excluyéndose a sí mismo) */
function siblingsOf(tree, id){
  const parent = tree.nodes[id].parent;
  if(!parent) return [];
  return childrenOf(tree, parent).filter(k => k !== id);
}

/** Hojas del árbol (nodos sin hijos) */
function leavesOf(tree){
  return Object.keys(tree.nodes).filter(k => childrenOf(tree, k).length === 0);
}

/** Marca el link de navegación activo según data-nav del <body> */
document.addEventListener('DOMContentLoaded', () => {
  const current = document.body.dataset.nav;
  if(!current) return;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if(a.dataset.nav === current) a.classList.add('active');
  });
});
