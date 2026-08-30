// game.js — Hyper-casual Brick Breaker
(function(){
  // roundRect polyfill for older browsers
  if(!CanvasRenderingContext2D.prototype.roundRect){
    CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
      if(typeof r==='number')r=[r];const radii=r.map(v=>Math.min(v,w/2,h/2));
      const tl=radii[0]||0;this.moveTo(x+tl,y);this.lineTo(x+w-tl,y);
      this.arcTo(x+w,y,x+w,y+tl,tl);this.lineTo(x+w,y+h-tl);
      this.arcTo(x+w,y+h,x+w-tl,y+h,tl);this.lineTo(x+tl,y+h);
      this.arcTo(x,y+h,x,y+h-tl,tl);this.lineTo(x,y+tl);
      this.arcTo(x,y,x+tl,y,tl);this.closePath();return this;
    };
  }
  const LW=800, LH=600;
  const BALL_R=3, PADDLE_W=90, PADDLE_H=10, PADDLE_SPEED=600;
  const BRICK_W=34, BRICK_H=12, BRICK_GAP=2;
  const COLS=20, ROWS=12;
  const MAX_BALLS=50;

  let INIT_SPEED=380, DROP_CHANCE=0.30;

  const state={
    mode:'level', level:1, wave:1, paddle:null, balls:[], bricks:[], powerUps:[],
    score:0, lives:3, running:false, stageCleared:false, combo:0, maxCombo:0,
    shakeX:0, shakeY:0, shakeDur:0
  };

  // Audio (lazy)
  let audioCtx=null;
  function actx(){ if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
  let audioOn=true;
  const soundBtn=document.getElementById('soundBtn');
  soundBtn?.addEventListener('click',async()=>{
    audioOn=!audioOn;
    soundBtn.textContent=audioOn?'\ud83d\udd0a Sunet: ON':'\ud83d\udd07 Sunet: OFF';
    if(audioOn){ try{await actx().resume();}catch(e){} }
  });
  function beep(f=440,d=0.05,t='sine',v=0.07){
    if(!audioOn)return;
    try{const c=actx(),o=c.createOscillator(),g=c.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(c.destination);o.start();setTimeout(()=>o.stop(),d*1000);}catch(e){}
  }
  const sfx={
    bounce(){beep(500,0.02,'square',0.06)},
    brick(combo){beep(600+combo*40,0.04,'triangle',0.07)},
    power(){beep(880,0.07,'sine',0.08)},
    lose(){beep(200,0.3,'sawtooth',0.07)},
    win(){beep(980,0.15,'sine',0.09)}
  };

  // Utils
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function rand(a,b){return a+Math.random()*(b-a);}
  function circleRect(cx,cy,r,rx,ry,rw,rh){
    const nx=clamp(cx,rx,rx+rw),ny=clamp(cy,ry,ry+rh);
    return(cx-nx)*(cx-nx)+(cy-ny)*(cy-ny)<=r*r;
  }

  // Particles
  const particles=[];
  function spawnP(x,y,color,n=8){
    for(let i=0;i<n;i++){
      const a=rand(0,Math.PI*2),s=rand(60,200);
      particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.3,maxLife:0.3,color,size:rand(1.5,3.5)});
    }
  }
  function updateP(dt){
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.94;p.vy*=0.94;p.vy+=80*dt;
      p.life-=dt;
      if(p.life<=0)particles.splice(i,1);
    }
  }
  function drawP(ctx){
    for(const p of particles){
      ctx.globalAlpha=Math.max(0,p.life/p.maxLife);
      ctx.fillStyle=p.color;
      ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);
    }
    ctx.globalAlpha=1;
  }

  // Screen shake
  function shake(dur=0.15,intensity=3){state.shakeDur=dur;state.shakeX=rand(-intensity,intensity);state.shakeY=rand(-intensity,intensity);}

  // Floating text (damage numbers, combo text)
  const floats=[];
  function spawnFloat(x,y,text,color='#fbbf24',size=14){
    floats.push({x,y,text,color,size,vy:-80,life:0.8,maxLife:0.8});
  }
  function updateFloats(dt){
    for(let i=floats.length-1;i>=0;i--){
      const f=floats[i];
      f.y+=f.vy*dt;f.vy*=0.97;f.life-=dt;
      if(f.life<=0)floats.splice(i,1);
    }
  }
  function drawFloats(ctx){
    for(const f of floats){
      const a=Math.max(0,f.life/f.maxLife);
      ctx.globalAlpha=a;
      ctx.fillStyle=f.color;
      ctx.font=`bold ${f.size}px system-ui`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.shadowColor=f.color;ctx.shadowBlur=4;
      ctx.fillText(f.text,f.x,f.y);
      ctx.shadowBlur=0;
    }
    ctx.globalAlpha=1;
  }

  // Classes
  class Paddle{
    constructor(){this.w=PADDLE_W;this.h=PADDLE_H;this.x=(LW-this.w)/2;this.y=LH-36;this.wideTimer=0;}
    update(dt,input){
      const dir=(input.right?1:0)-(input.left?1:0);
      this.x+=dir*PADDLE_SPEED*dt;
      this.x=clamp(this.x,0,LW-this.w);
      if(this.wideTimer>0){this.wideTimer-=dt;this.w=PADDLE_W*1.5;}else{this.w=PADDLE_W;}
    }
    draw(ctx){
      const g=ctx.createLinearGradient(this.x,this.y,this.x+this.w,this.y);
      g.addColorStop(0,'#3b82f6');g.addColorStop(0.5,'#60a5fa');g.addColorStop(1,'#3b82f6');
      ctx.fillStyle=g;
      ctx.beginPath();
      ctx.roundRect(this.x,this.y,this.w,this.h,4);
      ctx.fill();
      ctx.shadowColor='rgba(59,130,246,0.5)';ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0;
    }
    rect(){return{x:this.x,y:this.y,w:this.w,h:this.h};}
  }

  class Ball{
    constructor(x,y,spdMul=1){
      this.x=x;this.y=y;this.r=BALL_R;
      const a=rand(-0.8,0.8);
      const sp=INIT_SPEED*spdMul;
      this.vx=Math.sin(a)*sp;this.vy=-Math.abs(Math.cos(a)*sp);
      if(Math.abs(this.vy)<sp*0.35)this.vy=-sp*0.35;
      this.pierce=0;this.color='#e0e7ff';
    }
    update(dt){
      this.x+=this.vx*dt;this.y+=this.vy*dt;
      if(this.x-this.r<0){this.x=this.r;this.vx=Math.abs(this.vx);sfx.bounce();}
      if(this.x+this.r>LW){this.x=LW-this.r;this.vx=-Math.abs(this.vx);sfx.bounce();}
      if(this.y-this.r<0){this.y=this.r;this.vy=Math.abs(this.vy);sfx.bounce();}
    }
    draw(ctx){
      ctx.fillStyle=this.color;
      ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();
      ctx.shadowColor=this.color;ctx.shadowBlur=6;ctx.fill();ctx.shadowBlur=0;
    }
  }

  // Brick color palette (consistent HP-based)
  const BRICK_COLORS={
    normal:['#60a5fa','#3b82f6','#8b5cf6','#ef4444'], // 1-4 HP
    indestructible:'#6b7280',
    pierce:'#f59e0b',
    corridor:'#14b8a6',
    moving:'#a855f7',
    split:'#f472b6',
    timer:'#22d3ee'
  };

  class Brick{
    constructor(x,y,w,h,hp=1,opts={}){
      this.x=x;this.y=y;this.w=w;this.h=h;this.hp=hp;
      this.maxHp=hp;
      this.indestructible=opts.indestructible||false;
      this.requiresPierce=opts.requiresPierce||false;
      this.opensCorridor=opts.opensCorridor||false;
      this.moving=opts.moving||false;
      this.split=opts.split||false;
      this.timer=opts.timer||0;
      this.maxTimer=opts.timer||0;
      this.vx=this.moving?rand(30,60)*(Math.random()<0.5?-1:1):0;
      this.hitAnim=0;
    }
    getColor(){
      if(this.indestructible)return BRICK_COLORS.indestructible;
      if(this.requiresPierce)return BRICK_COLORS.pierce;
      if(this.opensCorridor)return BRICK_COLORS.corridor;
      if(this.split)return BRICK_COLORS.split;
      if(this.timer>0){
        const pct=this.timer/this.maxTimer;
        if(pct<0.3)return '#ef4444';
        if(pct<0.6)return '#f59e0b';
        return BRICK_COLORS.timer;
      }
      const idx=Math.min(this.hp,BRICK_COLORS.normal.length)-1;
      return BRICK_COLORS.normal[Math.max(0,idx)];
    }
    update(dt){
      if(this.moving){
        this.x+=this.vx*dt;
        if(this.x<0||this.x+this.w>LW){this.vx*=-1;this.x=clamp(this.x,0,LW-this.w);}
      }
      if(this.timer>0)this.timer-=dt;
    }
    draw(ctx){
      let c=this.getColor();
      // Dim timer bricks as time runs out
      if(this.timer>0){
        const pct=this.timer/this.maxTimer;
        ctx.globalAlpha=0.4+pct*0.6;
      }
      if(this.hitAnim>0){
        ctx.globalAlpha=Math.max(ctx.globalAlpha||1,0.5+this.hitAnim*0.5);
        this.hitAnim=Math.max(0,this.hitAnim-0.05);
      }
      ctx.fillStyle=c;
      ctx.beginPath();ctx.roundRect(this.x,this.y,this.w,this.h,2);ctx.fill();
      // HP number for multi-hit bricks
      if(this.hp>1&&!this.indestructible){
        ctx.fillStyle='rgba(255,255,255,0.3)';
        ctx.font='bold 8px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(this.hp,this.x+this.w/2,this.y+this.h/2);
      }
      // Markers for special types
      if(this.split){
        ctx.fillStyle='rgba(255,255,255,0.4)';
        ctx.font='bold 8px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('\u2716',this.x+this.w/2,this.y+this.h/2);
      }
      if(this.timer>0){
        ctx.fillStyle='rgba(0,0,0,0.5)';
        ctx.font='bold 7px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(Math.ceil(this.timer),this.x+this.w/2,this.y+this.h/2);
      }
      ctx.globalAlpha=1;
    }
  }

  class PowerUp{
    constructor(x,y,type){this.x=x;this.y=y;this.type=type;this.w=12;this.h=12;this.vy=120;this.active=true;this.t=0;}
    update(dt){this.y+=this.vy*dt;this.t+=dt*4;if(this.y>LH+20)this.active=false;}
    draw(ctx){
      if(!this.active)return;
      const colors={multi:'#60a5fa',wide:'#fbbf24',pierce:'#f472b6',split:'#34d399',bomb:'#ef4444'};
      const c=colors[this.type]||'#aaa';
      ctx.fillStyle=c;
      ctx.beginPath();
      const cx=this.x+this.w/2,cy=this.y+this.h/2,r=this.w/2+Math.sin(this.t)*1.5;
      ctx.arc(cx,cy,Math.max(3,r),0,Math.PI*2);ctx.fill();
      ctx.shadowColor=c;ctx.shadowBlur=6;ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#fff';ctx.font='bold 7px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
      const labels={multi:'M',wide:'W',pierce:'P',split:'S',bomb:'B'};
      ctx.fillText(labels[this.type]||'?',cx,cy);
    }
    rect(){return{x:this.x,y:this.y,w:this.w,h:this.h};}
  }

  // DOM
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const uiScore=document.getElementById('score');
  const uiLives=document.getElementById('lives');
  const uiStage=document.getElementById('stage');
  const uiModeTag=document.getElementById('modeTag');
  const btnReset=document.getElementById('reset');
  const btnPause=document.getElementById('pause');
  const btnMenu=document.getElementById('menuBtn');
  const menu=document.getElementById('menu');
  const grid=document.getElementById('levelGrid');
  const btnCL=document.getElementById('chooseLevelMode');
  const btnCE=document.getElementById('chooseEndless');
  const btnCM=document.getElementById('closeMenu');
  const wideBox=document.getElementById('wideTimerBox');
  const wideFill=document.getElementById('wideFill');
  const pierceBox=document.getElementById('pierceTimerBox');
  const pierceFill=document.getElementById('pierceFill');
  const titleScreen=document.getElementById('titleScreen');
  const hud=document.getElementById('hud');
  const timersEl=document.getElementById('timers');
  const legendEl=document.getElementById('legend');

  function showGameUI(){hud.classList.add('active');timersEl.classList.add('active');legendEl.classList.add('active');}
  function hideGameUI(){hud.classList.remove('active');timersEl.classList.remove('active');legendEl.classList.remove('active');}



  // Progress system (localStorage)
  const PROGRESS_KEY='brick_breaker_progress';
  let progress={unlocked:1,stars:{},bestScore:{},bestCombo:{}};
  function loadProgress(){try{const d=localStorage.getItem(PROGRESS_KEY);if(d)progress=JSON.parse(d);}catch(e){}}
  function saveProgress(){try{localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));}catch(e){}}
  function setStars(lvl,starCount){
    const cur=progress.stars[lvl]||0;
    if(starCount>cur)progress.stars[lvl]=starCount;
    saveProgress();
  }
  function unlockNext(lvl){
    if(lvl>=1&&lvl<20&&progress.unlocked<=lvl){progress.unlocked=lvl+1;saveProgress();}
  }

  // Level complete overlay state
  let lvlComplete={active:false,nextLevel:0,stars:0,score:0,combo:0};
  function showLevelComplete(score,combo,lvl){
    const starCount=score>=1500?3:score>=800?2:1;
    setStars(lvl,starCount);
    unlockNext(lvl);
    lvlComplete={active:true,nextLevel:lvl+1,stars:starCount,score,combo};
    state.running=false;state.stageCleared=true;
  }

  // Life lost overlay state
  let lifeLost={active:false,timer:0};
  function showLifeLost(){
    lifeLost={active:true,timer:1.5};
    state.running=false;
  }

  // Title screen
  const DEBUG=false;
  let gameStarted=false;
  let gameComplete=false;
  let cameFromTitle=false;
  function startGame(mode,level){
    titleScreen.classList.add('hidden');
    showGameUI();
    gameStarted=true;cameFromTitle=false;
    setMode(mode||'level');
    if(level)state.level=level;
    resetGame();
  }
  function showMenuFromTitle(){
    titleScreen.classList.add('hidden');
    cameFromTitle=true;
    rebuildLevelGrid();showMenu();
  }
  document.getElementById('playBtn')?.addEventListener('click',()=>startGame('level',progress.unlocked));
  document.getElementById('levelsBtn')?.addEventListener('click',showMenuFromTitle);
  document.getElementById('settingsBtn')?.addEventListener('click',showMenuFromTitle);

  // Menu
  function showMenu(){menu.classList.add('active');input.paused=true;}
  function hideMenu(){
    menu.classList.remove('active');
    if(cameFromTitle&&!gameStarted){titleScreen.classList.remove('hidden');cameFromTitle=false;return;}
    if(gameStarted)input.paused=false;
  }
  loadProgress();
  function rebuildLevelGrid(){
    grid.innerHTML='';
    for(let i=1;i<=20;i++){
      const b=document.createElement('button');b.className='levelbtn';
      const unlocked=i<=progress.unlocked;
      const stars=progress.stars[i]||0;
      const starStr=stars>=3?'\u2605\u2605\u2605':stars>=2?'\u2605\u2605':stars>=1?'\u2605':'';
      b.textContent=i;
      if(starStr)b.innerHTML=i+'<br><span style="font-size:10px;color:#fbbf24">'+starStr+'</span>';
      if(!unlocked){b.style.opacity='0.3';b.style.pointerEvents='none';b.textContent=i+' \ud83d\udd12';}
      if(i===20)b.innerHTML+=(i===20?' \u2605':'');
      const lvl=i;
      b.addEventListener('click',()=>{
        titleScreen.classList.add('hidden');
        cameFromTitle=false;
        setMode('level');state.level=lvl;resetGame();
        showGameUI();gameStarted=true;hideMenu();
      });
      grid.appendChild(b);
    }
  }
  rebuildLevelGrid();
  btnMenu?.addEventListener('click',()=>{rebuildLevelGrid();showMenu();});
  btnCM?.addEventListener('click',()=>hideMenu());
  btnCL?.addEventListener('click',()=>{titleScreen.classList.add('hidden');cameFromTitle=false;gameStarted=true;setMode('level');resetGame();showGameUI();hideMenu();});
  btnCE?.addEventListener('click',()=>{titleScreen.classList.add('hidden');cameFromTitle=false;gameStarted=true;setMode('endless');resetGame();showGameUI();hideMenu();});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.classList.contains('active')){if(gameStarted)showMenu();}else if(e.key==='Escape')hideMenu();});

  // Input
  const input={left:false,right:false,paused:false};
  const gameKeys=new Set(['arrowleft','arrowright','a','d','p','r','escape',' ']);
  window.addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();
    if(gameKeys.has(k))e.preventDefault();
    if(lvlComplete.active){startNextLevel();return;}
    if(k==='arrowleft'||k==='a')input.left=true;
    if(k==='arrowright'||k==='d')input.right=true;
    if(k==='p')input.paused=!input.paused;
    if(k==='r')doReset();
  });
  window.addEventListener('keyup',e=>{
    const k=e.key.toLowerCase();
    if(k==='arrowleft'||k==='a')input.left=false;
    if(k==='arrowright'||k==='d')input.right=false;
  });
  btnReset?.addEventListener('click',doReset);
  btnPause?.addEventListener('click',()=>{input.paused=!input.paused;});

  // Touch
  const touchUI=document.getElementById('touchControls');
  const isTouchDevice=()=>('ontouchstart' in window)||navigator.maxTouchPoints>0;
  if(isTouchDevice())touchUI.style.display='block';
  ['touchstart','touchmove','touchend'].forEach(ev=>{
    document.body.addEventListener(ev,e=>{if(!menu.hidden)return;e.preventDefault();},{passive:false});
  });
  const zL=document.querySelector('#touchControls .zone.left');
  const zR=document.querySelector('#touchControls .zone.right');
  zL?.addEventListener('touchstart',()=>{input.left=true;},{passive:false});
  zL?.addEventListener('touchend',()=>{input.left=false;},{passive:false});
  zR?.addEventListener('touchstart',()=>{input.right=true;},{passive:false});
  zR?.addEventListener('touchend',()=>{input.right=false;},{passive:false});
  canvas.addEventListener('click',e=>{
    if(lvlComplete.active&&lvlComplete._btn){
      const rect=canvas.getBoundingClientRect();
      const x=(e.clientX-rect.left)/rect.width*LW;
      const y=(e.clientY-rect.top)/rect.height*LH;
      const b=lvlComplete._btn;
      if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)startNextLevel();
    }
  });
  canvas.addEventListener('touchstart',e=>{
    if(lvlComplete.active&&lvlComplete._btn){
      const t=e.changedTouches[0],rect=canvas.getBoundingClientRect();
      const x=(t.clientX-rect.left)/rect.width*LW;
      const y=(t.clientY-rect.top)/rect.height*LH;
      const b=lvlComplete._btn;
      if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){startNextLevel();e.preventDefault();return;}
    }
    const t=e.changedTouches[0],rect=canvas.getBoundingClientRect();
    const x=(t.clientX-rect.left)/rect.width*LW;
    state.paddle.x=clamp(x-state.paddle.w/2,0,LW-state.paddle.w);
  },{passive:false});
  canvas.addEventListener('touchmove',e=>{
    const t=e.changedTouches[0],rect=canvas.getBoundingClientRect();
    const x=(t.clientX-rect.left)/rect.width*LW;
    state.paddle.x=clamp(x-state.paddle.w/2,0,LW-state.paddle.w);
  },{passive:false});

  // Mode
  function setMode(m){state.mode=m;uiModeTag.textContent=m==='endless'?'Endless':'Campaign';}

  // Build level
  function buildLevel(){
    const comp=Levels.compute(state.mode,state.level,state.wave);
    INIT_SPEED=comp.params.initSpeed;
    DROP_CHANCE=comp.params.dropChance;
    state.bricks=comp.bricks.map(b=>new Brick(b.x,b.y,b.w,b.h,b.hp,{
      indestructible:b.indestructible,requiresPierce:b.requiresPierce,
      opensCorridor:b.opensCorridor,moving:b.moving,split:b.split,timer:b.timer
    }));
    state.combo=0;
  }

  function doReset(){
    state.stageCleared=false;lvlComplete.active=false;gameComplete=false;
    if(state.mode==='level'){}else{state.wave=1;}
    buildLevel();state.lives=3;state.score=0;state.combo=0;
    state.balls=[new Ball(LW/2,LH-60,1)];
    state.powerUps=[];state.running=true;
    uiLives.textContent=state.lives;uiScore.textContent=state.score;
    uiStage.textContent=state.mode==='endless'?state.wave:state.level;
  }
  function resetGame(){
    state.paddle=new Paddle();
    state.balls=[new Ball(LW/2,LH-60,1)];
    state.powerUps=[];state.score=0;state.lives=3;state.combo=0;state.stageCleared=false;
    lvlComplete.active=false;gameComplete=false;
    buildLevel();state.running=true;
    uiStage.textContent=state.mode==='endless'?state.wave:state.level;
    uiScore.textContent=state.score;uiLives.textContent=state.lives;
  }
  function nextStage(){
    if(state.mode==='level'){
      showLevelComplete(state.score,state.combo,state.level);
      sfx.win();
    }else{
      state.wave++;buildLevel();state.balls=[new Ball(LW/2,LH-60,1)];state.stageCleared=false;state.running=true;uiStage.textContent=state.wave;
    }
  }
  function startNextLevel(){
    if(lvlComplete.nextLevel>20){
      lvlComplete.active=false;
      gameComplete=true;
      state.running=false;state.stageCleared=false;
      return;
    }
    const savedLives=state.lives;const savedScore=state.score;
    state.level=lvlComplete.nextLevel;lvlComplete.active=false;
    resetGame();
    state.lives=savedLives;state.score=savedScore;
    // Bonus life every 5 levels
    if(state.level%5===1&&state.level>1){state.lives=Math.min(state.lives+1,5);spawnFloat(LW/2,LH/2-40,'+1 \u2764','#ef4444',18);}
    uiLives.textContent=state.lives;uiScore.textContent=state.score;
  }

  function spawnPowerUp(x,y){
    if(Math.random()>DROP_CHANCE)return;
    const types=['multi','wide','pierce','split'];
    if(Math.random()<0.1)types.push('bomb');
    state.powerUps.push(new PowerUp(x,y,types[Math.floor(Math.random()*types.length)]));
  }

  function applyPowerUp(pu){
    sfx.power();
    if(pu.type==='multi'){
      const nb=[];const src=state.balls.slice(0,Math.min(state.balls.length,8));
      for(const b of src){
        if(state.balls.length+nb.length>=MAX_BALLS)break;
        const sp=Math.hypot(b.vx,b.vy);
        for(let i=0;i<2;i++){
          const nb2=new Ball(b.x,b.y,1);
          const a=rand(-0.9,0.9);
          nb2.vx=Math.sin(a)*sp;
          nb2.vy=-Math.abs(Math.cos(a)*sp);
          // Ensure minimum vertical speed (at least 35% of total)
          if(Math.abs(nb2.vy)<sp*0.35)nb2.vy=-sp*0.35;
          nb2.color='#93c5fd';
          nb.push(nb2);
        }
      }
      state.balls.push(...nb);
    }else if(pu.type==='wide'){
      state.paddle.wideTimer=Math.max(state.paddle.wideTimer,8);
    }else if(pu.type==='pierce'){
      for(const b of state.balls){b.pierce=Math.max(b.pierce||0,6);b.color='#f9a8d4';}
    }else if(pu.type==='split'){
      const sb=[];const orig=state.balls.slice(0,Math.min(state.balls.length,6));
      for(const b of orig){
        if(state.balls.length+sb.length>=MAX_BALLS)break;
        for(let i=0;i<2;i++){
          const nb=new Ball(b.x,b.y,1);
          const a=rand(-0.7,0.7),sp=Math.hypot(b.vx,b.vy);
          nb.vx=Math.cos(a)*sp;nb.vy=-Math.abs(Math.sin(a)*sp);
          // Ensure minimum vertical speed
          if(Math.abs(nb.vy)<sp*0.35)nb.vy=-sp*0.35;
          nb.color='#6ee7b7';sb.push(nb);
        }
      }
      state.balls.push(...sb);
    }else if(pu.type==='bomb'){
      // Destroy nearby bricks
      const cx=pu.x,cy=pu.y,radius=80;
      for(let i=state.bricks.length-1;i>=0;i--){
        const br=state.bricks[i];
        if(br.indestructible)continue;
        const bx=br.x+br.w/2,by=br.y+br.h/2;
        if(Math.hypot(bx-cx,by-cy)<radius){
          spawnP(bx,by,'#ef4444',12);
          state.bricks.splice(i,1);state.score+=10;
        }
      }
      shake(0.2,8);
    }
  }

  function updateTimersHUD(){
    if(state.paddle.wideTimer>0){
      wideBox.hidden=false;
      wideFill.style.width=(state.paddle.wideTimer/8*100).toFixed(1)+'%';
    }else wideBox.hidden=true;
    let mp=0,mpm=0;
    for(const b of state.balls){if(b.pierce>mp){mp=b.pierce;mpm=Math.max(mpm,b.pierce);}}
    if(mp>0){pierceBox.hidden=false;pierceFill.style.width=(mp/Math.max(1,mpm)*100).toFixed(1)+'%';}
    else pierceBox.hidden=true;
  }

  function update(dt){
    if(!gameStarted)return;
    // Level complete - wait for click
    if(lvlComplete.active)return;
    // Life lost - auto-resume after delay
    if(lifeLost.active){
      lifeLost.timer-=dt;
      if(lifeLost.timer<=0){
        lifeLost.active=false;
        buildLevel();state.powerUps=[];
        state.balls=[new Ball(LW/2,LH-60,1)];state.running=true;state.stageCleared=false;
        uiStage.textContent=state.mode==='endless'?state.wave:state.level;
      }
      return;
    }
    if(!state.running||input.paused)return;
    state.paddle.update(dt,input);
    for(const pu of state.powerUps)pu.update(dt);
    state.powerUps=state.powerUps.filter(p=>p.active);

    // Update bricks (moving + timer)
    for(let i=state.bricks.length-1;i>=0;i--){
      const br=state.bricks[i];
      br.update(dt);
      if(br.maxTimer>0&&br.timer<=0&&!br.indestructible){
        spawnP(br.x+br.w/2,br.y+br.h/2,'#ef4444',6);
        state.bricks.splice(i,1);
      }
    }

    // Power-up collection
    for(const pu of state.powerUps){
      const pr=pu.rect(),pd=state.paddle.rect();
      if(!(pr.x+pr.w<pd.x||pr.x>pd.x+pd.w||pr.y+pr.h<pd.y||pr.y>pd.y+pd.h)){
        applyPowerUp(pu);pu.active=false;
      }
    }

    // Ball update
    const fallen=[];
    for(const ball of state.balls){
      let frameHits=0;
      // Substep collision to prevent tunneling through thin bricks
      const speed=Math.hypot(ball.vx,ball.vy);
      const steps=Math.max(1,Math.ceil(speed*0.016/(BRICK_H*0.2)));
      const subDt=Math.min(0.016,dt/steps);
      const substepDist=speed*subDt;
      let frameHit=false;
      for(let s=0;s<steps;s++){
        ball.x+=ball.vx*subDt;ball.y+=ball.vy*subDt;
        if(ball.x-ball.r<0){ball.x=ball.r;ball.vx=Math.abs(ball.vx);sfx.bounce();}
        if(ball.x+ball.r>LW){ball.x=LW-ball.r;ball.vx=-Math.abs(ball.vx);sfx.bounce();}
        if(ball.y-ball.r<0){ball.y=ball.r;ball.vy=Math.abs(ball.vy);sfx.bounce();}

        const pd=state.paddle.rect();
        if(circleRect(ball.x,ball.y,ball.r,pd.x,pd.y,pd.w,pd.h)&&ball.vy>0){
          const hp=(ball.x-pd.x)/pd.w-0.5;
          const a=hp*Math.PI*0.65;
          const sp=Math.hypot(ball.vx,ball.vy);
          ball.vx=Math.sin(a)*sp;ball.vy=-Math.abs(Math.cos(a)*sp);
          ball.y=pd.y-ball.r-0.01;
          sfx.bounce();
        }

        // Brick collision
        if(!frameHit){
        let hitBrick=false;
        for(let i=state.bricks.length-1;i>=0;i--){
          const br=state.bricks[i];
          if(!circleRect(ball.x,ball.y,ball.r,br.x,br.y,br.w,br.h))continue;
          if(hitBrick)break;
          frameHit=true; // Only one brick hit per substep
          if(DEBUG){frameHits++;if(frameHits>=2)console.log('[PIERCE?] frameHits='+frameHits+' speed='+speed.toFixed(0)+' steps='+steps+' substepDist='+substepDist.toFixed(2)+' pos=('+ball.x.toFixed(1)+','+ball.y.toFixed(1)+') vy='+ball.vy.toFixed(1));}

          const pushDist=ball.r+1.5;
          if(br.indestructible&&!(ball.pierce>0)){
            const dx=(ball.x-(br.x+br.w/2))/(br.w/2);
            const dy=(ball.y-(br.y+br.h/2))/(br.h/2);
            if(Math.abs(dx)>Math.abs(dy)){ball.vx=-ball.vx;ball.x=dx>0?br.x+br.w+pushDist:br.x-pushDist;}
            else{ball.vy=-ball.vy;ball.y=dy>0?br.y+br.h+pushDist:br.y-pushDist;}
            sfx.bounce();spawnP(ball.x,ball.y,'#9ca3af',4);hitBrick=true;break;
          }
          if(br.requiresPierce&&!(ball.pierce>0)){
            const dx=(ball.x-(br.x+br.w/2))/(br.w/2);
            const dy=(ball.y-(br.y+br.h/2))/(br.h/2);
            if(Math.abs(dx)>Math.abs(dy)){ball.vx=-ball.vx;ball.x=dx>0?br.x+br.w+pushDist:br.x-pushDist;}
            else{ball.vy=-ball.vy;ball.y=dy>0?br.y+br.h+pushDist:br.y-pushDist;}
            sfx.bounce();spawnP(ball.x,ball.y,'#f59e0b',5);hitBrick=true;break;
          }

          if(!(ball.pierce>0)){
            const dx=(ball.x-(br.x+br.w/2))/(br.w/2);
            const dy=(ball.y-(br.y+br.h/2))/(br.h/2);
            if(Math.abs(dx)>Math.abs(dy)){ball.vx=-ball.vx;ball.x=dx>0?br.x+br.w+pushDist:br.x-pushDist;}
            else{ball.vy=-ball.vy;ball.y=dy>0?br.y+br.h+pushDist:br.y-pushDist;}
          }

          if(!br.indestructible){
            br.hp--;br.hitAnim=1;
            state.combo++;
            if(state.combo>state.maxCombo)state.maxCombo=state.combo;
            const comboBonus=state.combo>=5?state.combo*2:state.combo;
            const pts=10*comboBonus;
            state.score+=pts;
            uiScore.textContent=state.score;
            sfx.brick(state.combo);
            spawnP(ball.x,ball.y,br.getColor(),6+Math.min(state.combo,10));
            spawnFloat(br.x+br.w/2,br.y-4,'+'+pts,pts>=50?'#fbbf24':'#94a3b8',pts>=50?13:11);
            if(state.combo>=3)spawnFloat(br.x+br.w/2,br.y-18,state.combo+'x','#fbbf24',state.combo>=8?16:13);

            if(br.hp<=0){
              state.bricks.splice(i,1);
              // Split brick: spawn 2 smaller bricks
              if(br.split&&br.w>10){
                const hw=br.w/2-BRICK_GAP/2;
                const opts={split:true,moving:br.moving,timer:br.maxTimer>0?Math.ceil(br.maxTimer*0.7):0};
                state.bricks.push(new Brick(br.x,br.y,hw,br.h,Math.max(1,br.maxHp-1),opts));
                state.bricks.push(new Brick(br.x+hw+BRICK_GAP,br.y,hw,br.h,Math.max(1,br.maxHp-1),opts));
                spawnP(br.x+br.w/2,br.y+br.h/2,'#f472b6',8);
              }
              spawnPowerUp(br.x+br.w/2,br.y+br.h/2);
              if(br.opensCorridor){
                Levels.openCorridors({bricks:state.bricks,level:state.level,wave:state.wave,mode:state.mode,
                  LW,BRICK_W,BRICK_H,BRICK_GAP});
              }
              if(state.combo>=8)shake(0.1,2+state.combo*0.3);
            }
          }
          break; // Only one brick collision per substep
        }
        }
      }

      if(ball.pierce>0){ball.pierce-=dt;if(ball.pierce<=0)ball.color='#e0e7ff';}
      if(ball.y-ball.r>LH)fallen.push(ball);
    }

    if(fallen.length>0){
      for(const fb of fallen){const idx=state.balls.indexOf(fb);if(idx!==-1)state.balls.splice(idx,1);}
      state.combo=0;
      if(state.balls.length===0){
        state.lives--;sfx.lose();uiLives.textContent=state.lives;
        if(state.lives>0){
          showLifeLost();
        }else{state.running=false;}
      }
    }

    if(state.shakeDur>0){state.shakeDur-=dt;state.shakeX=rand(-3,3);state.shakeY=rand(-3,3);}
    else{state.shakeX=0;state.shakeY=0;}

    // Win: all bricks gone OR only indestructible/pierce-required left (stalemate)
    if(state.bricks.length===0){nextStage();}
    else if(state.bricks.length>0){
      const hasDestructible=state.bricks.some(b=>!b.indestructible&&!b.requiresPierce);
      if(!hasDestructible){
        const hasPierceActive=state.balls.some(b=>b.pierce>0);
        if(!hasPierceActive)nextStage();
      }
    }
    updateTimersHUD();
    updateP(dt);
    updateFloats(dt);
  }

  function draw(){
    if(!gameStarted)return;
    const dpr=window.devicePixelRatio||1;
    const scX=(renderW*dpr)/LW,scY=(renderH*dpr)/LH;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle='#0a0e1a';ctx.fillRect(0,0,canvas.width,canvas.height);
    if(!bgGrad||bgGrad._w!==canvas.width||bgGrad._h!==canvas.height){
      bgGrad=ctx.createLinearGradient(0,0,canvas.width,canvas.height);
      bgGrad.addColorStop(0,'rgba(30,58,138,0.08)');bgGrad.addColorStop(1,'rgba(15,23,42,0.04)');
      bgGrad._w=canvas.width;bgGrad._h=canvas.height;
    }
    ctx.fillStyle=bgGrad;ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(scX,0,0,scY,0,0);
    ctx.translate(state.shakeX,state.shakeY);
    for(const br of state.bricks)br.draw(ctx);
    for(const pu of state.powerUps)pu.draw(ctx);
    state.paddle.draw(ctx);
    for(const ball of state.balls)ball.draw(ctx);
    drawP(ctx);
    drawFloats(ctx);
    // Lives display (hearts on canvas)
    if(state.running&&state.lives>0){
      for(let i=0;i<state.lives;i++){
        ctx.fillStyle='#ef4444';
        ctx.font=`${14}px system-ui`;
        ctx.fillText('\u2764',8+i*18,16);
      }
    }
    ctx.setTransform(1,0,0,1,0,0);
    if(!state.running||lvlComplete.active||lifeLost.active||gameComplete){
      ctx.textAlign='center';
      if(gameComplete){
        ctx.fillStyle='rgba(10,14,26,0.8)';ctx.fillRect(0,0,canvas.width,canvas.height);
        const cx=canvas.width/2,cy=canvas.height/2;
        ctx.fillStyle='#fbbf24';ctx.font=`bold ${36*dpr}px system-ui`;
        ctx.fillText('YOU BEAT THE GAME!',cx,cy-50*dpr);
        const starSize=28*dpr;
        for(let s=0;s<3;s++){
          ctx.fillStyle='#fbbf24';
          ctx.font=`${starSize}px system-ui`;
          ctx.fillText('\u2605',cx+(s-1)*36*dpr,cy-10*dpr);
        }
        ctx.fillStyle='#94a3b8';ctx.font=`${16*dpr}px system-ui`;
        ctx.fillText('Final Score: '+state.score,cx,cy+25*dpr);
        ctx.fillText('All 20 levels completed!',cx,cy+50*dpr);
        ctx.fillStyle='#60a5fa';ctx.font=`bold ${14*dpr}px system-ui`;
        ctx.fillText('Press R to play again or Menu for levels',cx,cy+85*dpr);
      }else if(lvlComplete.active){
        ctx.fillStyle='rgba(10,14,26,0.6)';ctx.fillRect(0,0,canvas.width,canvas.height);
        const cx=canvas.width/2,cy=canvas.height/2;
        ctx.fillStyle='#fbbf24';ctx.font=`bold ${32*dpr}px system-ui`;
        ctx.fillText('Level Complete!',cx,cy-50*dpr);
        const starSize=28*dpr;
        for(let s=0;s<3;s++){
          ctx.fillStyle=s<lvlComplete.stars?'#fbbf24':'#374151';
          ctx.font=`${starSize}px system-ui`;
          ctx.fillText('\u2605',cx+(s-1)*36*dpr,cy-10*dpr);
        }
        ctx.fillStyle='#94a3b8';ctx.font=`${14*dpr}px system-ui`;
        ctx.fillText('Score: '+lvlComplete.score,cx,cy+30*dpr);
        ctx.fillText('Max Combo: '+lvlComplete.combo+'x',cx,cy+50*dpr);
        // Next button
        const bx=cx-60*dpr,by=cy+65*dpr,bw=120*dpr,bh=36*dpr;
        ctx.fillStyle='#3b82f6';
        ctx.beginPath();ctx.roundRect(bx,by,bw,bh,8*dpr);ctx.fill();
        ctx.fillStyle='#fff';ctx.font=`bold ${16*dpr}px system-ui`;
        if(lvlComplete.nextLevel<=20){
          ctx.fillText('Next Level \u2192',cx,by+bh/2+1*dpr);
        }else{
          ctx.fillText('YOU WIN!',cx,by+bh/2+1*dpr);
        }
        lvlComplete._btn={x:bx,y:by,w:bw,h:bh};
      }else if(lifeLost.active){
        ctx.fillStyle='rgba(10,14,26,0.6)';ctx.fillRect(0,0,canvas.width,canvas.height);
        const cx=canvas.width/2,cy=canvas.height/2;
        ctx.fillStyle='#ef4444';ctx.font=`bold ${28*dpr}px system-ui`;
        ctx.fillText('Life Lost!',cx,cy-20*dpr);
        ctx.fillStyle='#94a3b8';ctx.font=`${16*dpr}px system-ui`;
        ctx.fillText(state.lives+' '+(state.lives===1?'life':'lives')+' remaining',cx,cy+15*dpr);
        // Progress bar for auto-resume
        const pct=Math.max(0,lifeLost.timer/1.5);
        const bw=120*dpr,bh=4*dpr,bx=cx-bw/2,by=cy+35*dpr;
        ctx.fillStyle='#1e293b';ctx.fillRect(bx,by,bw,bh);
        ctx.fillStyle='#ef4444';ctx.fillRect(bx,by,bw*pct,bh);
      }else if(state.lives<=0){
        ctx.fillStyle='rgba(10,14,26,0.7)';ctx.fillRect(0,0,canvas.width,canvas.height);
        const cx=canvas.width/2,cy=canvas.height/2;
        ctx.fillStyle='#ef4444';ctx.font=`bold ${32*dpr}px system-ui`;
        ctx.fillText('Game Over',cx,cy-40*dpr);
        ctx.fillStyle='#94a3b8';ctx.font=`${16*dpr}px system-ui`;
        ctx.fillText('Final Score: '+state.score,cx,cy+5*dpr);
        ctx.fillText('Level: '+state.level,cx,cy+28*dpr);
        ctx.fillStyle='#60a5fa';ctx.font=`bold ${14*dpr}px system-ui`;
        ctx.fillText('Press R to Retry or Menu for levels',cx,cy+65*dpr);
      }else if(input.paused){
        ctx.fillStyle='rgba(10,14,26,0.5)';ctx.fillRect(0,0,canvas.width,canvas.height);
        const cx=canvas.width/2,cy=canvas.height/2;
        ctx.fillStyle='#e2e8f0';ctx.font=`bold ${28*dpr}px system-ui`;
        ctx.fillText('Paused',cx,cy-20*dpr);
        ctx.fillStyle='#94a3b8';ctx.font=`${14*dpr}px system-ui`;
        ctx.fillText('Press P or tap to resume',cx,cy+15*dpr);
      }
    }
  }

  let bgGrad=null,renderW=LW,renderH=LH;
  function fitCanvas(){
    const dpr=window.devicePixelRatio||1;
    const vw=Math.max(320,Math.floor(window.innerWidth));
    const vh=Math.max(240,Math.floor(window.innerHeight));
    let tw=vw,th=Math.floor(vw*(LH/LW));
    if(th>vh-140){th=vh-140;tw=Math.floor(th*(LW/LH));}
    canvas.style.width=tw+'px';canvas.style.height=th+'px';
    const bw=Math.round(tw*dpr),bh=Math.round(th*dpr);
    if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh;bgGrad=null;}
    renderW=tw;renderH=th;
  }
  window.addEventListener('resize',fitCanvas);

  fitCanvas();

  let last=performance.now();
  function loop(now){
    const dt=Math.min(0.033,(now-last)/1000);last=now;
    update(dt);draw();
    requestAnimationFrame(loop);
  }
  window.gameBooted=true;
  requestAnimationFrame(loop);
})();
