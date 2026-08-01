/* ==========================================================================
   Módulo 2 · Búsqueda del Tesoro
   El jugador sigue instrucciones de navegación (raíz / padre / hijo
   izquierdo / hijo derecho) haciendo clic en el nodo correcto del árbol.
   ========================================================================== */

(function(){
  const stage = document.getElementById('stage');
  const svg = document.getElementById('lines');
  const instructionText = document.getElementById('instructionText');
  const scoreEl = document.getElementById('scoreEl');
  const stepEl = document.getElementById('stepEl');
  const totalStepsEl = document.getElementById('totalStepsEl');
  const posEl = document.getElementById('posEl');
  const finalBanner = document.getElementById('finalBanner');
  const treasureNodeEl = document.getElementById('treasureNode');
  const finalScoreEl = document.getElementById('finalScore');
  const playAgainBtn = document.getElementById('playAgainBtn');

  const STEPS = 6;
  let path = [];
  let stepIndex = 0;
  let score = 0;
  let current = TREE_A.root;
  let nodeEls = {};

  function possibleMoves(cur){
    const moves = [];
    const node = TREE_A.nodes[cur];
    if(node.parent){
      moves.push({ type:'root',   target: TREE_A.root });
      moves.push({ type:'parent', target: node.parent });
    }
    const lr = leftRightChildren(TREE_A, cur);
    if(lr.left)  moves.push({ type:'left',  target: lr.left });
    if(lr.right) moves.push({ type:'right', target: lr.right });
    return moves;
  }

  function generatePath(n){
    const p = [];
    let cur = TREE_A.root;
    for(let i = 0; i < n; i++){
      const moves = possibleMoves(cur);
      const move = moves[Math.floor(Math.random() * moves.length)];
      p.push({ type: move.type, target: move.target, fromRoot: cur === TREE_A.root });
      cur = move.target;
    }
    return p;
  }

  function instructionFor(step){
    switch(step.type){
      case 'left':  return step.fromRoot ? 'Ve al hijo izquierdo de la raíz.' : 'Ve al hijo izquierdo.';
      case 'right': return step.fromRoot ? 'Ve al hijo derecho de la raíz.'   : 'Ahora ve al hijo derecho.';
      case 'parent':return 'Sube a tu nodo padre.';
      case 'root':  return 'Vuelve a la raíz.';
    }
  }

  function buildStage(){
    stage.querySelectorAll('.tree-node').forEach(n => n.remove());
    drawTreeLines(svg, TREE_A);
    nodeEls = {};
    Object.entries(TREE_A.nodes).forEach(([id, n]) => {
      const el = document.createElement('div');
      el.className = 'tree-node filled clickable';
      el.style.left = n.x + '%';
      el.style.top = n.y + '%';
      el.textContent = id;
      el.dataset.id = id;
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.addEventListener('click', () => onNodeChosen(id, el));
      el.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); onNodeChosen(id, el); } });
      stage.appendChild(el);
      nodeEls[id] = el;
    });
  }

  function refreshCurrentHighlight(){
    Object.values(nodeEls).forEach(el => el.classList.remove('current', 'root-node'));
    nodeEls[current].classList.add('current');
    if(current === TREE_A.root) nodeEls[current].classList.add('root-node');
  }

  function onNodeChosen(id, el){
    if(finalBanner.classList.contains('visible')) return;
    const expected = path[stepIndex].target;
    if(id === expected){
      score += 10;
      current = id;
      stepIndex++;
      scoreEl.textContent = score;
      stepEl.textContent = stepIndex;
      posEl.textContent = current;
      refreshCurrentHighlight();
      if(stepIndex >= path.length){
        finish();
      } else {
        instructionText.textContent = instructionFor(path[stepIndex]);
      }
    } else {
      el.classList.add('wrong');
      setTimeout(() => el.classList.remove('wrong'), 300);
    }
  }

  function finish(){
    instructionText.textContent = '¡Llegaste al tesoro!';
    treasureNodeEl.textContent = current;
    finalScoreEl.textContent = score;
    finalBanner.classList.add('visible');
    Object.values(nodeEls).forEach(el => el.classList.remove('clickable'));
  }

  function startGame(){
    score = 0;
    stepIndex = 0;
    current = TREE_A.root;
    path = generatePath(STEPS);
    scoreEl.textContent = '0';
    stepEl.textContent = '0';
    totalStepsEl.textContent = String(STEPS);
    posEl.textContent = current;
    finalBanner.classList.remove('visible');
    buildStage();
    refreshCurrentHighlight();
    instructionText.textContent = instructionFor(path[0]);
  }

  playAgainBtn.addEventListener('click', startGame);

  startGame();
})();
