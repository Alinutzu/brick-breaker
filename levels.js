// levels.js — level parameters and blueprint generation
window.Levels = (function(){
  const BRICK_ROWS = 10, BRICK_COLS = 16, BRICK_W = 42, BRICK_H = 16, BRICK_GAP = 2;
  const CORRIDOR_BASE_WIDTH = 2;
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function paramsForStage(n){
    const corridorWidth = Math.max(1, (n===12?1:(CORRIDOR_BASE_WIDTH - Math.floor(n/4))));
    const corridorShift = (n===12?2:((n%5)*2 + 2));
    const initSpeed = 300 + n*20;
    const dropChance = clamp(0.22 + n*0.01, 0.18, 0.40);
    return { corridorWidth, corridorShift, initSpeed, dropChance };
  }
  function paramsForEndless(w){
    const corridorWidth = Math.max(1, CORRIDOR_BASE_WIDTH - Math.floor(w/6));
    const corridorShift = (w%7)*2 + 2;
    const initSpeed = 320 * (1 + Math.min(0.03*w, 0.5));
    const dropChance = clamp(0.26 + Math.min(0.015*w, 0.4), 0.20, 0.55);
    return { corridorWidth, corridorShift, initSpeed, dropChance };
  }
  function compute(mode, level, wave){
    const barrierRows = Math.floor(BRICK_ROWS*0.6);
    const offsetX = (800 - (BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP)) / 2;
    let p, hpBoost, signature=false;
    if(mode==='level'){ p = paramsForStage(level); hpBoost = Math.floor(level/3); signature = (level===12); }
    else { p = paramsForEndless(wave); hpBoost = Math.floor(wave/4); }
    const corridorCol = Math.max(1, Math.min(BRICK_COLS-3, p.corridorShift));
    const corridorWidth = p.corridorWidth;
    const corridor2Col = signature ? Math.max(1, Math.min(BRICK_COLS-3, corridorCol + 4)) : null;
    const specialRow = (mode==='level' && (level===5 || level===9 || signature)) || (mode==='endless' && wave%7===0);
    const bricksBlueprint = [];
    for(let r=0;r<BRICK_ROWS;r++){
      for(let c=0;c<BRICK_COLS;c++){
        const inCorridor1 = (c>=corridorCol && c<corridorCol+corridorWidth && r<barrierRows);
        if(inCorridor1) continue;
        const x = offsetX + c * (BRICK_W + BRICK_GAP);
        const y = 80 + r * (BRICK_H + BRICK_GAP);
        let hp = (r>barrierRows ? 2 + hpBoost : 1);
        let requiresPierce = false, indestructible = false, opensCorridor=false;
        if(specialRow && r===0){ if(c%2===0){ indestructible=true; } else { requiresPierce=true; hp = 2 + hpBoost; } }
        if(signature && r===barrierRows && c===Math.min(BRICK_COLS-2, corridorCol+3)) { opensCorridor=true; hp=2 + hpBoost; }
        bricksBlueprint.push({x,y,w:BRICK_W,h:BRICK_H,hp,requiresPierce,indestructible,opensCorridor});
      }
    }
    return { bricksBlueprint, barrierRows, offsetX, corridor2Col, signature, params:p };
  }
  function openSecondCorridor(state){
    if(state.corridor2Col==null) return;
    for(let i=state.bricks.length-1;i>=0;i--){ const br = state.bricks[i];
      const c = Math.round((br.x - state.offsetX) / (state.BRICK_W + state.BRICK_GAP));
      const r = Math.round((br.y - 80) / (state.BRICK_H + state.BRICK_GAP));
      if(r < state.barrierRows && c === state.corridor2Col){ state.bricks.splice(i,1); }
    }
  }
  return { compute, openSecondCorridor, paramsForStage, paramsForEndless };
})();
