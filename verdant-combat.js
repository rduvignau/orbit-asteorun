/* Level-five encounter geometry is shared by rendering, collision and tests. */
(() => {
  const formationOffsets = shape => shape === 'diamond' ? [[0,0],[-30,-28],[-30,28],[-60,0]] : [[0,0],[-28,-26],[-28,26],[-56,-52],[-56,52]];
  function rootState(age) {
    const time=Math.max(0,age-3),cycle=Math.floor(time/12),phase=time%12,direction=cycle%2?-1:1,previous=cycle? -direction*.15:0;
    // Two seconds of warning precede a three-second, continuous terrain change.
    const t=Math.max(0,Math.min(1,(phase-2)/3)),smooth=t*t*(3-2*t);
    return {growth:previous+(direction*.15-previous)*smooth,warning:phase<5?direction:0};
  }
  function components(boss,w,h) {
    const r=boss.radius;
    return boss.parts.map((part,i)=>({...part,index:i,x:i<2?boss.x-w*.25:boss.x-r*.65,y:h*([.23,.77,.37,.63][i]),radius:i<2?Math.max(15,r*.42):Math.max(17,r*.48)}));
  }
  function drawBoss(ctx,boss,w,h) {
    const r=boss.radius;
    ctx.save();
    if(boss.kind==='sovereign'){
      const parts=components(boss,w,h);
      for(const p of parts){ctx.strokeStyle=p.hp>0?'#9cb77388':'#6b576344';ctx.lineWidth=p.hp>0?5:2;ctx.beginPath();ctx.moveTo(boss.x,boss.y);ctx.quadraticCurveTo(boss.x-r*2,p.y,p.x,p.y);ctx.stroke();}
      ctx.fillStyle=boss.flash>0?'#e8ffd7':'#3c304a';ctx.strokeStyle='#c19ddd';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(boss.x,boss.y,r*.83,r*1.3,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      for(const p of parts){ctx.fillStyle=p.hp<=0?'#302733':p.flash>0?'#f4ffdc':'#52603a';ctx.strokeStyle=p.hp>0?'#d5ed99':'#77677e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
        if(p.hp>0){ctx.fillStyle='#d3ff9b';ctx.beginPath();ctx.arc(p.x,p.y,p.radius*.36,0,Math.PI*2);ctx.fill();ctx.fillStyle='#28342b';ctx.fillRect(p.x-p.radius,p.y+p.radius+5,p.radius*2,3);ctx.fillStyle='#d5ed99';ctx.fillRect(p.x-p.radius,p.y+p.radius+5,p.radius*2*p.hp/p.maxHp,3);}else{ctx.beginPath();ctx.moveTo(p.x-7,p.y-7);ctx.lineTo(p.x+7,p.y+7);ctx.moveTo(p.x+7,p.y-7);ctx.lineTo(p.x-7,p.y+7);ctx.stroke();}}
      const open=boss.parts.every(p=>p.hp<=0);ctx.fillStyle=open?'#f5b1ff':'#75906e';ctx.shadowColor='#edb1ff';ctx.shadowBlur=open?20:0;ctx.beginPath();ctx.arc(boss.x-r*.35,boss.y,r*.32,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(!open){ctx.strokeStyle='#d3e59b88';ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(boss.x-r*.35,boss.y,r*.46,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    }else{
      ctx.translate(boss.x,boss.y);ctx.rotate(Math.sin(boss.age*.5)*.1);ctx.fillStyle=boss.flash>0?'#efffd5':'#48533a';ctx.strokeStyle='#cbe692';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<12;i++){const a=i/12*Math.PI*2,rad=r*(i%2?.7:1.2);if(i===0)ctx.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);else ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#e6b6f7';ctx.beginPath();ctx.ellipse(-r*.2,0,r*.3,r*.5,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function drawDrone(ctx,enemy) {
    ctx.save();ctx.translate(enemy.x,enemy.y);ctx.fillStyle=enemy.flash>0?'#f1ffd7':'#43533d';ctx.strokeStyle='#d2ee9a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(8,-12);ctx.lineTo(3,0);ctx.lineTo(8,12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#e7baff';ctx.fillRect(-7,-2,5,4);ctx.restore();
  }
  globalThis.OrbitVerdantCombat={formationOffsets,rootState,components,drawBoss,drawDrone};
})();
