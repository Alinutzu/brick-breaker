<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Brick Breaker PWA</title>
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#0f1226" />
  <style>
    html, body { height: 100%; margin: 0; background: #0f1226; color: #eaeaf0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif; }
    #wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px; }
    canvas { background: #11162e; border: 1px solid #2a2f55; box-shadow: 0 0 24px rgba(34, 102, 255, 0.25); }
    .hud { display: flex; gap: 12px; align-items: center; justify-content: center; flex-wrap: wrap; }
    .btn { background: #2266ff; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
    .legend { font-size: 13px; opacity: 0.85; max-width: 800px; text-align: center; }
    .tag { padding: 2px 8px; border-radius: 999px; background: #1b2a5e; font-size: 12px; }

    /* Modal menu */
    #menu { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.55); backdrop-filter: blur(3px); z-index: 9999; }
    .panel { background: #0f1430; border: 1px solid #2a2f55; box-shadow: 0 12px 40px rgba(34,102,255,0.25); border-radius: 10px; padding: 16px; width: min(720px, 92vw); }
    .panel h2 { margin: 0 0 8px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(80px,1fr)); gap: 8px; }
    .levelbtn { padding: 10px; text-align: center; border: 1px solid #2a2f55; border-radius: 8px; background: #12183a; cursor: pointer; }
    .levelbtn:hover { background: #1a2250; }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    /* Robust hidden handling */
    [hidden] { display: none !important; }
    .hidden { display: none !important; pointer-events: none; }
  </style>
</head>
<body>
  <div id="wrap">
    <h1>Brick Breaker – PWA</h1>
    <div class="hud">
      <div class="tag">Mod: <span id="modeTag">Nivel</span></div>
      <div class="tag">Scor: <span id="score">0</span></div>
      <div class="tag">Vieți: <span id="lives">3</span></div>
      <div class="tag">Etapa: <span id="stage">1</span></div>
      <button id="menuBtn" class="btn">Meniu</button>
      <button id="reset" class="btn">Reset</button>
      <button id="pause" class="btn">Pauză</button>
      <button id="installBtn" class="btn" style="display:none">Instalează</button>
    </div>
    <canvas id="game" width="800" height="600" aria-label="Brick Breaker"></canvas>
    <div class="legend">
      Controale: <strong>← / →</strong> sau <strong>A / D</strong>; <strong>P</strong> pauză; <strong>R</strong> reset.<br/>
      Power-up-uri: <em>MultiBall</em> (albastru), <em>Wide</em> (galben), <em>Pierce</em> (roz), <em>Split</em> (turcoaz).<br/>
      Anumite niveluri au <em>bricks indestructibile</em> (metal) sau <em>bricks ce necesită Pierce</em>.
    </div>
  </div>

  <!-- Menu Overlay -->
  <div id="menu" class="hidden" hidden>
    <div class="panel">
      <h2>Alege Mod</h2>
      <div class="row">
        <button id="chooseLevelMode" class="btn">Mod Nivel</button>
        <button id="chooseEndless" class="btn">Mod Endless</button>
        <div style="flex:1"></div>
        <button id="closeMenu" class="btn" title="ESC">Închide</button>
      </div>
      <hr/>
      <h3>Niveluri</h3>
      <div class="grid" id="levelGrid"></div>
    </div>
  </div>

  <script>
  if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./service-worker.js'); }); }
  let deferredPrompt; const installBtn=document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt',(e)=>{ e.preventDefault(); deferredPrompt=e; installBtn.style.display='inline-block'; });
  installBtn?.addEventListener('click', async()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); const { outcome }=await deferredPrompt.userChoice; deferredPrompt=null; installBtn.style.display='none'; });

  const W=800,H=600; const PADDLE_W=110,PADDLE_H=12,PADDLE_SPEED=540; const BALL_RADIUS=7; let INIT_BALL_SPEED=320; const BRICK_ROWS=10,BRICK_COLS=16,BRICK_W=42,BRICK_H=16,BRICK_GAP=2; let POWERUP_DROP_CHANCE=0.28; const MAX_BALLS=40; const CORRIDOR_BASE_WIDTH=2;
  const AudioCtx=window.AudioContext||window.webkitAudioContext; const audioCtx=new AudioCtx();
  function beep(freq=440,duration=0.06,type='sine',vol=0.08){ const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=vol; o.connect(g); g.connect(audioCtx.destination); o.start(); setTimeout(()=>o.stop(),duration*1000); }
  const sfx={ bounce(){beep(420,0.03,'square',0.07);}, brick(){beep(620,0.05,'triangle',0.08);}, power(){beep(880,0.08,'sine',0.09);}, lose(){beep(220,0.25,'sawtooth',0.08);}, win(){beep(980,0.20,'sine',0.1);} };
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); } function randRange(a,b){ return a+Math.random()*(b-a); }

  class Paddle{ constructor(){ this.w=PADDLE_W; this.h=PADDLE_H; this.x=(W-this.w)/2; this.y=H-42; this.vx=0; this.wideTimer=0; }
    update(dt,input){ this.vx=(input.right?1:0)-(input.left?1:0); this.x+=this.vx*PADDLE_SPEED*dt; this.x=clamp(this.x,0,W-this.w); if(this.wideTimer>0){ this.wideTimer-=dt; this.w=PADDLE_W*1.5; } else { this.w=PADDLE_W; } }
    draw(ctx){ ctx.fillStyle='#48c774'; ctx.fillRect(this.x,this.y,this.w,this.h); }
    rect(){ return {x:this.x,y:this.y,w:this.w,h:this.h}; }
  }
  class Ball{ constructor(x,y,speedMul=1){ this.x=x; this.y=y; const angle=randRange(Math.PI*0.25,Math.PI*0.75); const speed=INIT_BALL_SPEED*speedMul; this.vx=Math.cos(angle)*speed; this.vy=-Math.abs(Math.sin(angle)*speed); this.r=BALL_RADIUS; this.color='#f4f1c9'; this.pierceTimer=0; }
    update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; if(this.x-this.r<0){ this.x=this.r; this.vx=Math.abs(this.vx); sfx.bounce(); } if(this.x+this.r>W){ this.x=W-this.r; this.vx=-Math.abs(this.vx); sfx.bounce(); } if(this.y-this.r<0){ this.y=this.r; this.vy=Math.abs(this.vy); sfx.bounce(); } }
    draw(ctx){ ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); }
  }
  class Brick{ constructor(x,y,w,h,hp=1,requiresPierce=false,indestructible=false){ this.x=x; this.y=y; this.w=w; this.h=h; this.hp=hp; this.requiresPierce=requiresPierce; this.indestructible=indestructible; }
    draw(ctx){ let c='#7aa2ff'; if(this.indestructible){ c='#9aa0a6'; } else if(this.hp>1){ c='#ff7b7b'; } if(this.requiresPierce) c='#ffa500'; ctx.fillStyle=c; ctx.fillRect(this.x,this.y,this.w,this.h); ctx.strokeStyle='#0c1229'; ctx.strokeRect(this.x+0.5,this.y+0.5,this.w-1,this.h-1); }
  }
  class PowerUp{ constructor(x,y,type){ this.x=x; this.y=y; this.type=type; this.w=14; this.h=14; this.vy=140; this.active=true; }
    update(dt){ this.y+=this.vy*dt; if(this.y>H+24) this.active=false; }
    draw(ctx){ if(!this.active) return; const colors={multiball:'#4da6ff',wide:'#ffd166',pierce:'#ef476f',split:'#47e5bc'}; ctx.fillStyle=colors[this.type]||'#aaa'; ctx.fillRect(this.x,this.y,this.w,this.h); }
    rect(){ return {x:this.x,y:this.y,w:this.w,h:this.h}; }
  }
  function circleRectCollide(cx,cy,r,rx,ry,rw,rh){ const closestX=clamp(cx,rx,rx+rw); const closestY=clamp(cy,ry,ry+rh); const dx=cx-closestX; const dy=cy-closestY; return (dx*dx+dy*dy)<=r*r; }

  const canvas=document.getElementById('game'); const ctx=canvas.getContext('2d');
  const uiScore=document.getElementById('score'); const uiLives=document.getElementById('lives'); const uiStage=document.getElementById('stage'); const uiModeTag=document.getElementById('modeTag');
  const btnReset=document.getElementById('reset'); const btnPause=document.getElementById('pause'); const btnMenu=document.getElementById('menuBtn');
  const menu=document.getElementById('menu'); const grid=document.getElementById('levelGrid'); const btnChooseLevel=document.getElementById('chooseLevelMode'); const btnChooseEndless=document.getElementById('chooseEndless'); const btnCloseMenu=document.getElementById('closeMenu');
  function showMenu(){ menu.hidden=false; menu.classList.remove('hidden'); input.paused=true; }
  function hideMenu(){ menu.hidden=true; menu.classList.add('hidden'); input.paused=false; }
  for(let i=1;i<=12;i++){ const b=document.createElement('button'); b.className='levelbtn'; b.textContent='Nivel '+i; b.addEventListener('click',()=>{ setMode('level'); level=i; resetGame(); hideMenu(); }); grid.appendChild(b); }
  btnMenu.addEventListener('click',()=>{ showMenu(); }); btnCloseMenu.addEventListener('click',()=>{ hideMenu(); }); btnChooseLevel.addEventListener('click',()=>{ setMode('level'); resetGame(); hideMenu(); }); btnChooseEndless.addEventListener('click',()=>{ setMode('endless'); resetGame(); hideMenu(); });
  window.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && !menu.hidden) hideMenu(); });

  const input={left:false,right:false,paused:false}; let mode='level'; let level=1; let wave=1; let paddle,balls,bricks,powerUps,score,lives,running,stageCleared;
  function setMode(m){ mode=m; uiModeTag.textContent=(m==='endless')?'Endless':'Nivel'; }
  function paramsForStage(n){ const corridorWidth=Math.max(1,CORRIDOR_BASE_WIDTH - Math.floor(n/4)); const corridorShift=(n%5)*2 + 2; const initSpeed=300 + n*20; const dropChance=clamp(0.22 + n*0.01, 0.18, 0.40); return { corridorWidth, corridorShift, initSpeed, dropChance }; }
  function paramsForEndless(w){ const corridorWidth=Math.max(1,CORRIDOR_BASE_WIDTH - Math.floor(w/6)); const corridorShift=(w%7)*2 + 2; const initSpeed=320 * (1 + Math.min(0.03*w, 0.5)); const dropChance=clamp(0.26 + Math.min(0.015*w, 0.4), 0.20, 0.55); return { corridorWidth, corridorShift, initSpeed, dropChance }; }

  function buildLevel(){ bricks=[]; const offsetX=(W - (BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP)) / 2; const offsetY=80; let corridorWidth,corridorCol,hpBoost,specialRow=false;
    if(mode==='level'){ const p=paramsForStage(level); corridorWidth=p.corridorWidth; corridorCol=Math.max(1,Math.min(BRICK_COLS-3,p.corridorShift)); INIT_BALL_SPEED=p.initSpeed; POWERUP_DROP_CHANCE=p.dropChance; hpBoost=Math.floor(level/3); specialRow=(level===5||level===9);
    } else { const p=paramsForEndless(wave); corridorWidth=p.corridorWidth; corridorCol=Math.max(1,Math.min(BRICK_COLS-3,p.corridorShift)); INIT_BALL_SPEED=p.initSpeed; POWERUP_DROP_CHANCE=p.dropChance; hpBoost=Math.floor(wave/4); specialRow=(wave%7===0); }
    for(let r=0;r<BRICK_ROWS;r++){ for(let c=0;c<BRICK_COLS;c++){ const inCorridor=(c>=corridorCol && c<corridorCol+corridorWidth && r<Math.floor(BRICK_ROWS*0.6)); if(inCorridor) continue; const x=offsetX + c*(BRICK_W + BRICK_GAP); const y=offsetY + r*(BRICK_H + BRICK_GAP); let hp=(r>BRICK_ROWS*0.6 ? 2 + hpBoost : 1); let requiresPierce=false; let indestructible=false; if(specialRow && r===0){ if(c%2===0){ indestructible=true; } else { requiresPierce=true; hp=2 + hpBoost; } } bricks.push(new Brick(x,y,BRICK_W,BRICK_H,hp,requiresPierce,indestructible)); } }
  }

  function resetGame(){ paddle=new Paddle(); balls=[new Ball(W/2,H-60,1)]; powerUps=[]; score=0; lives=3; stageCleared=false; wave=1; buildLevel(); running=true; uiStage.textContent=(mode==='endless')?wave:level; uiScore.textContent=score; uiLives.textContent=lives; }
  function nextStage(){ if(mode==='level'){ stageCleared=true; running=false; } else { wave+=1; buildLevel(); balls=[new Ball(W/2,H-60,1)]; stageCleared=false; running=true; uiStage.textContent=wave; } }
  function spawnPowerUp(x,y){ const types=['multiball','wide','pierce','split']; if(Math.random()<POWERUP_DROP_CHANCE){ const t=types[Math.floor(Math.random()*types.length)]; powerUps.push(new PowerUp(x,y,t)); } }

  function checkStalemateSuccess(){
    // Dacă rămân doar bricks indestructibile, sau doar bricks ce necesită Pierce dar nu avem Pierce activ,
    // considerăm nivelul câștigat (evităm blocaje).
    if(bricks.length===0) return false; // deja tratat în win normal
    const hasPlainDestructible = bricks.some(br => !br.indestructible && !br.requiresPierce);
    if(hasPlainDestructible) return false;
    const pierceActive = balls.some(b => b.pierceTimer>0);
    if(!pierceActive){ return true; }
    return false;
  }

  function update(dt){ if(!running || input.paused) return; paddle.update(dt,input);
    for(const pu of powerUps) pu.update(dt); powerUps = powerUps.filter(p=>p.active);
    for(const pu of powerUps){ const pr=pu.rect(); const padd=paddle.rect(); const collide=!(pr.x+pr.w<padd.x||pr.x>padd.x+padd.w||pr.y+pr.h<padd.y||pr.y>padd.y+padd.h); if(collide){ sfx.power(); if(pu.type==='multiball'){ const newBalls=[]; for(const b of balls){ if(balls.length+newBalls.length>=MAX_BALLS) break; const nb1=new Ball(b.x,b.y,1); const nb2=new Ball(b.x,b.y,1); nb1.vx=b.vx*0.95; nb1.vy=-Math.abs(b.vy); nb2.vx=-b.vx*0.95; nb2.vy=-Math.abs(b.vy); nb1.color='#cde8ff'; nb2.color='#cde8ff'; newBalls.push(nb1,nb2);} balls.push(...newBalls); } else if(pu.type==='wide'){ paddle.wideTimer=Math.max(paddle.wideTimer,8); } else if(pu.type==='pierce'){ for(const b of balls){ b.pierceTimer=Math.max(b.pierceTimer||0,5); b.color='#ffc0cb'; } } else if(pu.type==='split'){ const splitBalls=[]; const original=balls.slice(0,Math.min(balls.length,6)); for(const b of original){ if(balls.length+splitBalls.length>=MAX_BALLS) break; for(let i=0;i<2;i++){ const nb=new Ball(b.x,b.y,1); const angle=randRange(-0.6,0.6); const speed=Math.hypot(b.vx,b.vy); nb.vx=Math.cos(angle)*speed; nb.vy=-Math.abs(Math.sin(angle)*speed); nb.color='#47e5bc'; splitBalls.push(nb);} } balls.push(...splitBalls); } pu.active=false; } }

    for(const ball of balls){ ball.update(dt);
      const padd=paddle.rect(); if(circleRectCollide(ball.x,ball.y,ball.r,padd.x,padd.y,padd.w,padd.h) && ball.vy>0){ const hitPos=(ball.x-padd.x)/padd.w-0.5; const angle=hitPos*Math.PI*0.7; const speed=Math.hypot(ball.vx,ball.vy); ball.vx=Math.sin(angle)*speed; ball.vy=-Math.abs(Math.cos(angle)*speed); ball.y=padd.y-ball.r-0.01; sfx.bounce(); }
      for(let i=bricks.length-1;i>=0;i--){ const br=bricks[i]; if(circleRectCollide(ball.x,ball.y,ball.r,br.x,br.y,br.w,br.h)){
          if(br.indestructible && !(ball.pierceTimer>0)){ const dx=(ball.x-(br.x+br.w/2))/(br.w/2); const dy=(ball.y-(br.y+br.h/2))/(br.h/2); if(Math.abs(dx)>Math.abs(dy)) ball.vx=-ball.vx; else ball.vy=-ball.vy; sfx.bounce(); continue; }
          if(br.requiresPierce && !(ball.pierceTimer>0)){ const dx=(ball.x-(br.x+br.w/2))/(br.w/2); const dy=(ball.y-(br.y+br.h/2))/(br.h/2); if(Math.abs(dx)>Math.abs(dy)) ball.vx=-ball.vx; else ball.vy=-ball.vy; sfx.bounce(); continue; }
          if(!(ball.pierceTimer>0)){ const dx=(ball.x-(br.x+br.w/2))/(br.w/2); const dy=(ball.y-(br.y+br.h/2))/(br.h/2); if(Math.abs(dx)>Math.abs(dy)) ball.vx=-ball.vx; else ball.vy=-ball.vy; sfx.bounce(); }
          if(!br.indestructible){ br.hp-=1; uiScore.textContent=(score+=10); sfx.brick(); if(br.hp<=0){ bricks.splice(i,1); spawnPowerUp(br.x+br.w/2-7, br.y+br.h/2-7); } }
        } }
      if(ball.pierceTimer>0){ ball.pierceTimer-=dt; if(ball.pierceTimer<=0){ ball.color='#f4f1c9'; } }
      if(ball.y-ball.r>H){ const idx=balls.indexOf(ball); if(idx!==-1) balls.splice(idx,1); if(balls.length===0){ lives-=1; sfx.lose(); uiLives.textContent=lives; if(lives>0){ // Resetăm nivelul pe pierdere de viață (mai greu)
            buildLevel(); powerUps=[]; balls=[new Ball(W/2,H-80,1)]; running=true; stageCleared=false; uiStage.textContent=(mode==='endless')?wave:level; }
          else { running=false; } } }
    }

    // Win conditions
    if(bricks.length===0){ sfx.win(); nextStage(); return; }
    if(checkStalemateSuccess()){ sfx.win(); nextStage(); return; }
  }

  function draw(){ ctx.fillStyle='#0e1734'; ctx.fillRect(0,0,W,H); const grad=ctx.createLinearGradient(0,0,W,H); grad.addColorStop(0,'rgba(34,102,255,0.06)'); grad.addColorStop(1,'rgba(255,255,255,0.02)'); ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
    for(const br of bricks) br.draw(ctx); for(const pu of powerUps) pu.draw(ctx); paddle.draw(ctx); for(const ball of balls) ball.draw(ctx);
    if(!running){ ctx.fillStyle='#eaeaf0'; ctx.textAlign='center'; ctx.font='24px system-ui'; if(lives<=0){ ctx.fillText('Game Over', W/2, H/2 - 12);} else if(stageCleared && mode==='level'){ ctx.fillText('Nivel complet!', W/2, H/2 - 12);} else if(input.paused){ ctx.fillText('Pauză', W/2, H/2 - 12);} ctx.font='14px system-ui'; ctx.fillText('Apasă R pentru Reset sau deschide Meniul', W/2, H/2 + 18); }
  }

  let last=performance.now(); function loop(now){ const dt=Math.min(0.033,(now-last)/1000); last=now; update(dt); draw(); requestAnimationFrame(loop); }
  window.addEventListener('keydown',(e)=>{ const k=e.key.toLowerCase(); if(k==='arrowleft'||k==='a') input.left=true; if(k==='arrowright'||k==='d') input.right=true; if(k==='p') input.paused=!input.paused; if(k==='r'){ stageCleared=false; if(mode==='level'){ buildLevel(); } else { wave=1; buildLevel(); } lives=3; balls=[new Ball(W/2,H-80,1)]; running=true; uiLives.textContent=lives; } });
  window.addEventListener('keyup',(e)=>{ const k=e.key.toLowerCase(); if(k==='arrowleft'||k==='a') input.left=false; if(k==='arrowright'||k==='d') input.right=false; });
  btnReset.addEventListener('click', ()=>{ stageCleared=false; if(mode==='level'){ buildLevel(); } else { wave=1; buildLevel(); } lives=3; balls=[new Ball(W/2,H-80,1)]; running=true; uiLives.textContent=lives; }); btnPause.addEventListener('click', ()=>{ input.paused=!input.paused; });

  setMode('level'); resetGame(); requestAnimationFrame(loop);
  </script>
</body>
</html>
