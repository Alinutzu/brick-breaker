// levels.js — Hyper-casual labyrinth levels
'use strict';

(function(){
  const BRICK_W=34, BRICK_H=12, BRICK_GAP=2;
  const COLS=20, ROWS=12;
  const LW=800;

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

  // Level definitions: each is an array of corridor descriptions
  // corridor(row, colStart, width) = gap in that row
  // Each level has: corridors[], hp, speed, dropChance, specialRows
  const LEVELS=[
    // 1 - Tutorial: one simple corridor
    {corridors:[{r:[0,5],c:9,w:2}],hp:1,speed:360,drop:0.25},
    // 2 - Two corridors
    {corridors:[{r:[0,4],c:5,w:2},{r:[6,11],c:14,w:2}],hp:1,speed:370,drop:0.26},
    // 3 - Diagonal gaps
    {corridors:[{r:[0,2],c:3,w:1},{r:[3,5],c:7,w:1},{r:[6,8],c:11,w:1},{r:[9,11],c:15,w:1}],hp:1,speed:380,drop:0.27},
    // 4 - Narrow funnel
    {corridors:[{r:[0,3],c:8,w:4},{r:[4,7],c:9,w:2},{r:[8,11],c:10,w:1}],hp:1,speed:390,drop:0.28},
    // 5 - L shape
    {corridors:[{r:[0,8],c:2,w:2},{r:[8,11],c:2,w:2},{r:[8,11],c:2,w:8}],hp:2,speed:400,drop:0.28},
    // 6 - Zigzag
    {corridors:[{r:[0,2],c:2,w:1},{r:[3,5],c:17,w:1},{r:[6,8],c:2,w:1},{r:[9,11],c:17,w:1}],hp:2,speed:410,drop:0.29},
    // 7 - Double narrow
    {corridors:[{r:[0,11],c:6,w:1},{r:[0,11],c:13,w:1}],hp:2,speed:420,drop:0.30},
    // 8 - Maze: multiple small gaps
    {corridors:[{r:[0,3],c:4,w:1},{r:[0,3],c:15,w:1},{r:[4,7],c:9,w:1},{r:[8,11],c:4,w:1},{r:[8,11],c:15,w:1}],hp:2,speed:430,drop:0.30},
    // 9 - The tunnel
    {corridors:[{r:[0,11],c:10,w:1}],hp:3,speed:440,drop:0.31},
    // 10 - Checkerboard gaps
    {corridors:[{r:[0,0],c:1,w:1},{r:[1,1],c:5,w:1},{r:[2,2],c:9,w:1},{r:[3,3],c:13,w:1},{r:[4,4],c:17,w:1},
                {r:[5,5],c:2,w:1},{r:[6,6],c:6,w:1},{r:[7,7],c:10,w:1},{r:[8,8],c:14,w:1},{r:[9,9],c:18,w:1},
                {r:[10,10],c:3,w:1},{r:[11,11],c:11,w:1}],hp:2,speed:450,drop:0.32},
    // 11 - Hourglass
    {corridors:[{r:[0,1],c:8,w:4},{r:[2,3],c:7,w:2},{r:[4,5],c:6,w:2},{r:[6,7],c:6,w:2},{r:[8,9],c:7,w:2},{r:[10,11],c:8,w:4}],hp:3,speed:440,drop:0.32},
    // 12 - Spiral in
    {corridors:[{r:[0,11],c:0,w:1},{r:[0,0],c:1,w:19},{r:[1,1],c:1,w:1},{r:[1,1],c:19,w:1},{r:[2,10],c:1,w:1},{r:[2,10],c:19,w:1},{r:[11,11],c:1,w:19}],
     hp:3,speed:450,drop:0.33},
    // 13 - Split decision
    {corridors:[{r:[0,5],c:5,w:1},{r:[0,5],c:14,w:1},{r:[6,11],c:10,w:1}],hp:3,speed:460,drop:0.33},
    // 14 - Narrow canyons
    {corridors:[{r:[0,11],c:3,w:1},{r:[0,11],c:10,w:1},{r:[0,11],c:16,w:1}],hp:3,speed:470,drop:0.34},
    // 15 - S-curve
    {corridors:[{r:[0,2],c:1,w:1},{r:[3,5],c:18,w:1},{r:[6,8],c:1,w:1},{r:[9,11],c:18,w:1}],hp:3,speed:460,drop:0.34},
    // 16 - The eye
    {corridors:[{r:[0,0],c:9,w:2},{r:[1,1],c:8,w:4},{r:[2,3],c:7,w:6},{r:[4,7],c:6,w:8},{r:[8,9],c:7,w:6},{r:[10,10],c:8,w:4},{r:[11,11],c:9,w:2}],
     hp:3,speed:470,drop:0.35},
    // 17 - Gauntlet
    {corridors:[{r:[0,2],c:2,w:1},{r:[3,5],c:6,w:1},{r:[6,8],c:10,w:1},{r:[9,11],c:14,w:1}],hp:4,speed:480,drop:0.35},
    // 18 - Double helix
    {corridors:[{r:[0,0],c:4,w:1},{r:[1,1],c:7,w:1},{r:[2,2],c:10,w:1},{r:[3,3],c:13,w:1},{r:[4,4],c:16,w:1},
                {r:[5,5],c:3,w:1},{r:[6,6],c:6,w:1},{r:[7,7],c:9,w:1},{r:[8,8],c:12,w:1},{r:[9,9],c:15,w:1},
                {r:[10,10],c:4,w:1},{r:[11,11],c:16,w:1}],hp:3,speed:480,drop:0.36},
    // 19 - Fortress
    {corridors:[{r:[0,11],c:0,w:2},{r:[0,11],c:18,w:2},{r:[0,0],c:2,w:16},{r:[11,11],c:2,w:16},{r:[5,6],c:9,w:2}],
     hp:4,speed:490,drop:0.36},
    // 20 - Final: ultra narrow single thread
    {corridors:[{r:[0,11],c:10,w:1}],hp:4,speed:500,drop:0.37,special:true},
  ];

  function compute(mode,level,wave){
    const offsetX=(LW-(COLS*(BRICK_W+BRICK_GAP)-BRICK_GAP))/2;
    let p,hpBoost=0,def;
    if(mode==='level'){
      def=LEVELS[clamp(level,1,20)-1];
      p={initSpeed:def.speed,dropChance:def.drop};
      hpBoost=Math.min(Math.floor(level/4),3);
    }else{
      const w=wave;
      p={initSpeed:350+w*15,dropChance:clamp(0.25+w*0.008,0.2,0.5)};
      hpBoost=Math.min(Math.floor(w/3),5);
    }

    const bricks=[];
    for(let r=0;r<ROWS;r++){
      for(let c=0;c<COLS;c++){
        const x=offsetX+c*(BRICK_W+BRICK_GAP);
        const y=60+r*(BRICK_H+BRICK_GAP);
        let hp=(mode==='level'?def.hp:1+hpBoost)+hpBoost;
        let opts={};

        // Check if in corridor
        if(mode==='level'){
          const inCorridor=def.corridors.some(cr=>r>=cr.r[0]&&r<=cr.r[1]&&c>=cr.c&&c<cr.c+cr.w);
          if(inCorridor)continue;
          // Special: indestructible/pierce bricks on certain rows
          if(def.special&&r%4===0&&c%3===0){opts.indestructible=true;}
          if(def.special&&r%4===0&&c%3===1){opts.requiresPierce=true;}
          // Opens corridor brick
          if(level===20&&r===ROWS-1&&c===9){opts.opensCorridor=true;}
        }else{
          // Endless mode: generate corridors procedurally
          const cw=Math.max(1,2-Math.floor(w/5));
          const cs=(w*3+r*7+c*2)%COLS;
          if(c>=cs&&c<cs+cw)continue;
          if(wave%5===0&&r%3===0&&c%4===0){opts.indestructible=true;}
          if(wave%7===0&&r%3===1&&c%5===0){opts.requiresPierce=true;}
        }

        bricks.push({x,y,w:BRICK_W,h:BRICK_H,hp,...opts});
      }
    }

    return{bricks,params:p};
  }

  function openCorridors(state){
    // For levels with opensCorridor bricks, open additional paths
    const {bricks,level,wave,mode,LW,BRICK_W,BRICK_H,BRICK_GAP}=state;
    const offsetX=(LW-(COLS*(BRICK_W+BRICK_GAP)-BRICK_GAP))/2;
    // Open a second corridor based on level
    const col=Math.floor(COLS/2)+((level||wave)%3)*2;
    for(let i=bricks.length-1;i>=0;i--){
      const br=bricks[i];
      const c=Math.round((br.x-offsetX)/(BRICK_W+BRICK_GAP));
      const r=Math.round((br.y-60)/(BRICK_H+BRICK_GAP));
      if(r<ROWS&&c>=col&&c<col+1&&!br.indestructible){
        bricks.splice(i,1);
      }
    }
  }

  window.Levels={compute,openCorridors};
})();
