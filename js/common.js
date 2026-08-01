/* ===========================================================
   Grupo 7 · Árboles — common.js
   Datos de los árboles + utilidades compartidas por los 3 módulos.
   =========================================================== */

/* ---------- Helpers genéricos ---------- */
function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n){ return shuffle(arr).slice(0, n); }

/* ---------- Construcción y layout de árboles ---------- */
// def: { label, left: def|null, right: def|null }
function buildTree(def){
  const nodes = {};
  function walk(node, parent){
    if(!node) return null;
    nodes[node.label] = {
      label: node.label,
      parent: parent,
      left: node.left ? node.left.label : null,
      right: node.right ? node.right.label : null
    };
    if(node.left) walk(node.left, node.label);
    if(node.right) walk(node.right, node.label);
    return node.label;
  }
  const root = walk(def, null);
  const tree = { root, nodes };
  layoutTree(tree);
  return tree;
}

// Calcula x,y (0-100) por recorrido in-order (x) y profundidad (y), y guarda depth en cada nodo.
function layoutTree(tree){
  const nodes = tree.nodes;
  let counter = 0;
  const order = {};
  (function inorder(id){
    if(!id) return;
    const n = nodes[id];
    inorder(n.left);
    order[id] = counter++;
    inorder(n.right);
  })(tree.root);
  const total = counter;

  function depthOf(id){
    let d = 0, cur = id;
    while(nodes[cur].parent){ cur = nodes[cur].parent; d++; }
    return d;
  }
  let maxDepth = 0;
  Object.keys(nodes).forEach(id => { maxDepth = Math.max(maxDepth, depthOf(id)); });

  Object.keys(nodes).forEach(id => {
    const n = nodes[id];
    n.x = total <= 1 ? 50 : 8 + (order[id] / (total - 1)) * 84;
    n.depth = depthOf(id);
    n.y = maxDepth <= 0 ? 50 : 10 + (n.depth / maxDepth) * 80;
  });
  tree.maxDepth = maxDepth;
  tree.count = total;
}

/* ---------- Consultas sobre el árbol ---------- */
function children(tree, id){
  const n = tree.nodes[id];
  return [n.left, n.right].filter(Boolean);
}
function isLeaf(tree, id){ return children(tree, id).length === 0; }
function leaves(tree){ return Object.keys(tree.nodes).filter(id => isLeaf(tree, id)); }
function siblings(tree, id){
  const p = tree.nodes[id].parent;
  if(!p) return [];
  return children(tree, p).filter(c => c !== id);
}
function ancestors(tree, id){
  const out = [];
  let cur = tree.nodes[id].parent;
  while(cur){ out.push(cur); cur = tree.nodes[cur].parent; }
  return out;
}
function descendants(tree, id){
  const out = [];
  (function walk(cid){
    children(tree, cid).forEach(c => { out.push(c); walk(c); });
  })(id);
  return out;
}
function heightOf(tree, id){
  const n = tree.nodes[id];
  if(!n.left && !n.right) return 0;
  const hl = n.left ? heightOf(tree, n.left) : -1;
  const hr = n.right ? heightOf(tree, n.right) : -1;
  return 1 + Math.max(hl, hr);
}
function treeHeight(tree){ return heightOf(tree, tree.root); }
function subtreeSize(tree, id){ return 1 + descendants(tree, id).length; }

/* ---------- Dibuja las aristas del árbol en un <svg> ---------- */
function drawTreeLines(svg, tree, opts){
  opts = opts || {};
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.innerHTML = '';
  Object.values(tree.nodes).forEach(n => {
    if(!n.parent) return;
    const p = tree.nodes[n.parent];
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p.x); line.setAttribute('y1', p.y);
    line.setAttribute('x2', n.x); line.setAttribute('y2', n.y);
    line.setAttribute('class', 'tree-edge' + (opts.litEdge && opts.litEdge(n.label) ? ' lit' : ''));
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(line);
  });
}

/* ---------- Árbol de referencia (usado en teoria.html) ---------- */
const TREE_A = buildTree({
  label: 'A',
  left:  { label: 'B', left: { label: 'D' }, right: { label: 'E' } },
  right: { label: 'C', left: { label: 'F' }, right: { label: 'G' } }
});

/* ---------- Banco de árboles para los juegos (variedad + dificultad) ---------- */
// P1: fácil — 7 nodos, completo, altura 2
const TREE_POOL_EASY = [
  buildTree({
    label: 'A',
    left:  { label: 'B', left: { label: 'D' }, right: { label: 'E' } },
    right: { label: 'C', left: { label: 'F' }, right: { label: 'G' } }
  }),
  buildTree({
    label: 'M',
    left:  { label: 'N', left: { label: 'P' }, right: { label: 'Q' } },
    right: { label: 'O', right: { label: 'R' } }
  })
];

// P2/P3: media — 8-9 nodos, con nodos de un solo hijo, altura 3
const TREE_POOL_MEDIUM = [
  buildTree({
    label: 'A',
    left: {
      label: 'B',
      left: { label: 'D', right: { label: 'H' } },
      right: { label: 'E' }
    },
    right: {
      label: 'C',
      right: { label: 'F', right: { label: 'G' } }
    }
  }),
  buildTree({
    label: 'A',
    left: {
      label: 'B',
      left: { label: 'D', left: { label: 'I' } },
      right: { label: 'E' }
    },
    right: {
      label: 'C',
      left: { label: 'F' },
      right: { label: 'G', right: { label: 'H' } }
    }
  })
];

// P4: difícil — 11 nodos, altura 4
const TREE_POOL_HARD = [
  buildTree({
    label: 'A',
    left: {
      label: 'B',
      left: {
        label: 'D',
        left: { label: 'I', right: { label: 'K' } }
      },
      right: { label: 'E', right: { label: 'J' } }
    },
    right: {
      label: 'C',
      left: { label: 'F' },
      right: { label: 'G', right: { label: 'H' } }
    }
  })
];

function randomTree(level){
  if(level === 'easy') return structuredCloneTree(pick(TREE_POOL_EASY));
  if(level === 'hard') return structuredCloneTree(pick(TREE_POOL_HARD));
  if(level === 'any')  return structuredCloneTree(pick([].concat(TREE_POOL_EASY, TREE_POOL_MEDIUM, TREE_POOL_HARD)));
  return structuredCloneTree(pick(TREE_POOL_MEDIUM));
}
// Clona un árbol (los módulos mutan el objeto, así que cada partida necesita copia propia)
function structuredCloneTree(tree){
  return JSON.parse(JSON.stringify(tree));
}

/* ---------- Banco de preguntas (Módulo 1) ----------
   Cada generador recibe el árbol y devuelve una pregunta o null si no aplica.
   Se mezclan tipo texto y opción múltiple para variar el formato. */
const QUESTION_GENERATORS = [

  function qRoot(tree){
    return {
      kind: 'text', meta: 'Raíz',
      prompt: '¿Cuál nodo es la raíz del árbol?',
      answer: tree.root
    };
  },

  function qHeightTree(tree){
    return {
      kind: 'mc', meta: 'Altura',
      prompt: '¿Cuál es la altura del árbol completo?',
      answer: String(treeHeight(tree)),
      options: makeNumberOptions(treeHeight(tree))
    };
  },

  function qLeavesCount(tree){
    const n = leaves(tree).length;
    return {
      kind: 'mc', meta: 'Hojas',
      prompt: '¿Cuántas hojas tiene el árbol?',
      answer: String(n),
      options: makeNumberOptions(n)
    };
  },

  function qDepthNode(tree){
    const id = pick(Object.keys(tree.nodes).filter(x => x !== tree.root));
    return {
      kind: 'mc', meta: 'Profundidad',
      prompt: `¿Cuál es la profundidad del nodo ${id}?`,
      answer: String(tree.nodes[id].depth),
      options: makeNumberOptions(tree.nodes[id].depth)
    };
  },

  function qParentNode(tree){
    const candidates = Object.keys(tree.nodes).filter(x => x !== tree.root);
    const id = pick(candidates);
    return {
      kind: 'text', meta: 'Padre',
      prompt: `¿Cuál nodo es el padre de ${id}?`,
      answer: tree.nodes[id].parent
    };
  },

  function qSiblingsNode(tree){
    const id = pick(Object.keys(tree.nodes).filter(x => x !== tree.root));
    const sibs = siblings(tree, id);
    return {
      kind: 'text', meta: 'Hermanos',
      prompt: `¿Cuál es el hermano de ${id}? (si no tiene, escribe "ninguno")`,
      answer: sibs.length ? sibs[0] : 'ninguno'
    };
  },

  function qIsLeaf(tree){
    const id = pick(Object.keys(tree.nodes));
    const answer = isLeaf(tree, id) ? 'sí' : 'no';
    return {
      kind: 'mc', meta: 'Hojas',
      prompt: `¿El nodo ${id} es una hoja?`,
      answer,
      options: ['sí', 'no']
    };
  },

  function qChildrenCount(tree){
    const id = pick(Object.keys(tree.nodes));
    const n = children(tree, id).length;
    return {
      kind: 'mc', meta: 'Hijos',
      prompt: `¿Cuántos hijos tiene el nodo ${id}?`,
      answer: String(n),
      options: ['0', '1', '2']
    };
  },

  function qLevelNode(tree){
    const id = pick(Object.keys(tree.nodes).filter(x => x !== tree.root));
    return {
      kind: 'mc', meta: 'Nivel',
      prompt: `¿En qué nivel se encuentra el nodo ${id}? (la raíz está en el nivel 0)`,
      answer: String(tree.nodes[id].depth),
      options: makeNumberOptions(tree.nodes[id].depth)
    };
  },

  function qAncestorsCount(tree){
    const candidates = Object.keys(tree.nodes).filter(x => tree.nodes[x].depth >= 2);
    if(!candidates.length) return null;
    const id = pick(candidates);
    const n = ancestors(tree, id).length;
    return {
      kind: 'mc', meta: 'Ancestros',
      prompt: `¿Cuántos ancestros tiene el nodo ${id} (incluyendo la raíz)?`,
      answer: String(n),
      options: makeNumberOptions(n)
    };
  },

  function qSubtreeSize(tree){
    const candidates = Object.keys(tree.nodes).filter(x => !isLeaf(tree, x));
    if(!candidates.length) return null;
    const id = pick(candidates);
    const n = subtreeSize(tree, id);
    return {
      kind: 'mc', meta: 'Subárbol',
      prompt: `Contando al propio nodo, ¿cuántos nodos forman el subárbol de ${id}?`,
      answer: String(n),
      options: makeNumberOptions(n)
    };
  },

  function qIsAncestor(tree){
    const ids = Object.keys(tree.nodes);
    const a = pick(ids);
    const descA = descendants(tree, a);
    let b;
    if(Math.random() < 0.5 && descA.length){
      b = pick(descA);
    } else {
      const others = ids.filter(x => x !== a && !descA.includes(x));
      if(!others.length) return null;
      b = pick(others);
    }
    const answer = descendants(tree, a).includes(b) ? 'sí' : 'no';
    return {
      kind: 'mc', meta: 'Ancestro / descendiente',
      prompt: `¿Es ${a} un ancestro de ${b}?`,
      answer,
      options: ['sí', 'no']
    };
  },

  function qDeepestSide(tree){
    if(!tree.nodes[tree.root].left || !tree.nodes[tree.root].right) return null;
    const l = tree.nodes[tree.root].left, r = tree.nodes[tree.root].right;
    const hl = heightOf(tree, l), hr = heightOf(tree, r);
    if(hl === hr) return null;
    return {
      kind: 'mc', meta: 'Comparar subárboles',
      prompt: '¿Cuál subárbol de la raíz tiene mayor altura?',
      answer: hl > hr ? `el de ${l}` : `el de ${r}`,
      options: [`el de ${l}`, `el de ${r}`]
    };
  }
];

function makeNumberOptions(correct){
  const set = new Set([correct]);
  while(set.size < 3){
    const delta = pick([-2, -1, 1, 2]);
    const v = correct + delta;
    if(v >= 0) set.add(v);
  }
  return shuffle(Array.from(set).map(String));
}

// Genera `n` preguntas distintas y variadas para un árbol dado.
function generateQuestions(tree, n){
  n = n || 7;
  const gens = shuffle(QUESTION_GENERATORS);
  const out = [];
  let i = 0;
  while(out.length < n && i < gens.length * 2){
    const g = gens[i % gens.length];
    const q = g(tree);
    i++;
    if(q && !out.some(x => x.prompt === q.prompt)) out.push(q);
  }
  return out;
}

/* ---------- Efectos visuales compartidos ---------- */
function confettiBurst(count){
  count = count || 60;
  const colors = ['#eab54c', '#f6d38a', '#5fae74', '#3c7350', '#ffffff'];
  for(let i = 0; i < count; i++){
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = (Math.random() * 100) + 'vw';
    el.style.background = pick(colors);
    el.style.animationDuration = (1.4 + Math.random() * 1.4) + 's';
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
}

let toastTimer = null;
function showToast(msg, type){
  let el = document.querySelector('.toast');
  if(!el){
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show ' + (type || '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}
