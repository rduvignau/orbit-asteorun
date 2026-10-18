/* The Abyssal Nursery: authored reef, warning vents and a rescued mirror companion. */
(() => {
  'use strict';
  const route=[[0,.12,.88],[1300,.17,.81],[2600,.25,.9],[3900,.1,.74],[5200,.19,.85],[6600,.12,.76],[7900,.22,.89],[9200,.1,.9],[11400,.1,.9],[12400,.23,.85],[13700,.12,.75],[15000,.24,.89],[16400,.13,.78],[17800,.2,.88],[18700,.1,.9],[22000,.1,.9]];
  const ventSites=[[2100,1],[3900,-1],[6100,1],[7900,-1],[12100,1],[13500,-1],[15100,1],[17000,-1]];
  const scale=(w,h)=>Math.max(h/540,w/1500),smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function profile(world){let i=0;while(i<route.length-2 && world>route[i+1][0])i++;const a=route[i],b=route[i+1],t=smooth((world-a[0])/(b[0]-a[0])),ripple=(Math.sin(world/130)+Math.sin(world/49)*.35)*.009;return {top:a[1]+(b[1]-a[1])*t+ripple,bottom:a[2]+(b[2]-a[2])*t-ripple};}
  function bounds(x,w,h,distance){const p=profile(distance+x/scale(w,h));return {top:p.top*h,bottom:p.bottom*h};}
  function hitsCircle(x,y,r,w,h,distance){return [-1,-.5,0,.5,1].some(k=>{const dx=r*k,dy=Math.sqrt(r*r-dx*dx),p=bounds(x+dx,w,h,distance);return y-dy<=p.top || y+dy>=p.bottom;});}
  function ventState(time,id){const phase=((time+id*1.7)%9+9)%9;return {warning:phase<2,active:phase>=2 && phase<5,phase};}
  function vents(w,h,distance,time){const unit=scale(w,h);return ventSites.map(([world,side],id)=>{const p=profile(world),state=ventState(time,id);return {id:'vent-'+id,x:(world-distance)*unit,y:h*(side===1?p.top:p.bottom),side,radius:Math.min(35,26*unit),reach:h*.32,...state};}).filter(v=>v.x>-90 && v.x<w+90);}
  function obstacles(w,h,distance,time){const unit=scale(w,h);return [3100,4800,7100,12600,14500,16200,18000].map((world,i)=>{const p=profile(world);return {id:'pearl-'+i,kind:'pearl',x:(world-distance)*unit,y:h*(p.top+(p.bottom-p.top)*(i%2?.65:.35)),radius:Math.min(25,24*unit),angle:time*.5};}).filter(p=>p.x>-40 && p.x<w+40);}
  function ventHit(x,y,r,vent){if(!vent.active)return false;const along=(y-vent.y)*vent.side;return Math.abs(x-vent.x)<vent.radius+r && along>-r && along<vent.reach+r;}
  function draw(ctx,w,h,distance,time,destroyed=new Set()){
    const unit=scale(w,h);
    // A distant ocean moon and descending light shafts keep the water readable.
    ctx.fillStyle='#6fe5dd0b';for(let i=0;i<6;i++){const x=((i*310-distance*.08)%1800+1800)%1800/1500*w;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+w*.03,h);ctx.lineTo(x+w*.12,h);ctx.lineTo(x+w*.07,0);ctx.closePath();ctx.fill();}
    for(let i=0;i<45;i++){const x=((i*97-distance*.25)%1600+1600)%1600/1500*w,y=((i*73+time*8)%h);ctx.strokeStyle='#a4f2df33';ctx.beginPath();ctx.arc(x,y,i%3+1,0,Math.PI*2);ctx.stroke();}
    for(const side of ['top','bottom']){
      const sign=side==='top'?1:-1,points=[];for(let x=-10;x<=w+10;x+=8)points.push({x,y:bounds(x,w,h,distance)[side]});
      ctx.beginPath();ctx.moveTo(-10,sign===1?0:h);for(const p of points)ctx.lineTo(p.x,p.y);ctx.lineTo(w+10,sign===1?0:h);ctx.closePath();ctx.fillStyle='#273b40';ctx.fill();ctx.strokeStyle='#91c9b8';ctx.lineWidth=2;ctx.stroke();
      for(let cell=Math.floor(distance/110);cell<(distance+w/unit)/110+1;cell++){
        const x=(cell*110-distance)*unit,y=bounds(x,w,h,distance)[side],size=(14+(cell%4)*5)*Math.min(unit,1.1);
        ctx.strokeStyle=cell%3?'#d7917b99':'#80d4c099';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-sign*12);ctx.lineTo(x,y-sign*size*.38);ctx.moveTo(x-size*.35,y-sign*size*.1);ctx.quadraticCurveTo(x,y-sign*size*.6,x+size*.35,y-sign*size*.1);ctx.stroke();
        // Coral is recessed into the solid reef; decorative tips never hide collision space.
        ctx.fillStyle=cell%3?'#f2ab8d':'#bcfff1';ctx.beginPath();ctx.arc(x,y-sign*5,2,0,Math.PI*2);ctx.fill();
      }
    }
    for(const vent of vents(w,h,distance,time)){
      ctx.save();ctx.translate(vent.x,vent.y);ctx.scale(1,vent.side);ctx.fillStyle='#74604e';ctx.strokeStyle='#ffc59a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,vent.radius,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      if(vent.warning){ctx.setLineDash([4,5]);ctx.strokeStyle='#ffd28d99';ctx.strokeRect(-vent.radius,5,vent.radius*2,vent.reach);ctx.setLineDash([]);ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillStyle='#ffda9f';ctx.fillText('VENT',0,vent.reach+14);}
      if(vent.active){ctx.fillStyle='#ffa37d33';ctx.fillRect(-vent.radius,0,vent.radius*2,vent.reach);ctx.strokeStyle='#ffba90';for(let i=0;i<6;i++){const y=(time*100+i*31)%vent.reach;ctx.beginPath();ctx.moveTo(-vent.radius*.7,y);ctx.quadraticCurveTo(0,y+14,vent.radius*.7,y);ctx.stroke();}}
      ctx.restore();
    }
    for(const p of obstacles(w,h,distance,time)){if(destroyed.has(p.id))continue;ctx.fillStyle='#446f6a';ctx.strokeStyle='#c4ffed';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ebffe1';ctx.beginPath();ctx.arc(p.x-p.radius*.2,p.y-p.radius*.2,p.radius*.3,0,Math.PI*2);ctx.fill();}
  }
  function drawJelly(ctx,e){ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle=e.flash>0?'#efffff':'#986a8d99';ctx.strokeStyle='#f6b4d6';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,e.radius,e.radius*.8,0,Math.PI,Math.PI*2);ctx.lineTo(e.radius,4);ctx.lineTo(-e.radius,4);ctx.closePath();ctx.fill();ctx.stroke();for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*7,4);ctx.quadraticCurveTo(i*7+Math.sin(e.age*4+i)*6,15,i*6,23);ctx.stroke();}ctx.fillStyle='#baffeb';ctx.beginPath();ctx.arc(-4,-3,3,0,Math.PI*2);ctx.fill();ctx.restore();}
  function bossPosition(kind,age,w,h){
    const r=Math.min(kind==='ferryman'?46:62,Math.max(34,w*.12));
    if(age<3)return {x:w+(90-(90+w*(kind==='ferryman'?.22:.19))*Math.min(1,age/3)),y:h*.5,radius:r,mode:'enter'};
    const t=age-3;
    if(kind==='ferryman')return {x:w*(.52+Math.cos(t*.45)*.26),y:h*(.5+Math.sin(t*.9)*.22),radius:r,mode:'swim'};
    const cycle=t%12;
    if(cycle<2)return {x:w*.81,y:h*.5,radius:r,mode:'warning'};
    if(cycle<4.4)return {x:w*(.81-.61*(cycle-2)/2.4),y:h*.5,radius:r,mode:'breach'};
    if(cycle<7)return {x:w*(.2+.61*(cycle-4.4)/2.6),y:h*(.5+Math.sin((cycle-4.4)/2.6*Math.PI)*.25),radius:r,mode:'return'};
    return {x:w*.81,y:h*(.5+Math.sin((cycle-7)/5*Math.PI*2)*.21),radius:r,mode:'hunt'};
  }
  function segments(boss) {return boss.kind==='leviathan'?Array.from({length:4},(_,i)=>{const n=i+1;return {x:boss.x+n*boss.radius*.48,y:boss.y+Math.sin(boss.age*2-n*.7)*boss.radius*.22,radius:boss.radius*(.8-n*.1)};}):[];}
  function drawBoss(ctx,b,w,h){const r=b.radius;ctx.save();
    if(b.kind==='leviathan' && b.mode==='warning'){ctx.setLineDash([7,8]);ctx.strokeStyle='#ffc89a99';ctx.beginPath();ctx.moveTo(w*.16,h*.5);ctx.lineTo(b.x,h*.5);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ffd3a5';ctx.font='bold '+(w<500?8:10)+'px monospace';ctx.textAlign='center';ctx.fillText('BREACH · LEAVE THE MIDDLE',w*.45,h*.5-22);}
    if(b.kind==='leviathan')for(let i=4;i>0;i--){const x=b.x+i*r*.48,y=b.y+Math.sin(b.age*2-i*.7)*r*.22;ctx.fillStyle='#366263';ctx.strokeStyle='#8ed7c7';ctx.beginPath();ctx.ellipse(x,y,r*(.65-i*.07),r*(.8-i*.1),0,0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.translate(b.x,b.y);ctx.fillStyle=b.flash>0?'#e0ffed':'#436d69';ctx.strokeStyle='#c4ead0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*.85,r,Math.sin(b.age)*.1,0,Math.PI*2);ctx.fill();ctx.stroke();
    for(const sign of [-1,1]){ctx.fillStyle='#c2836c';ctx.beginPath();ctx.moveTo(0,sign*r*.65);ctx.lineTo(r,sign*r*1.2);ctx.lineTo(r*.5,sign*r*.3);ctx.closePath();ctx.fill();}
    ctx.fillStyle=b.enraged?'#ffb58e':'#bef9e7';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=15;ctx.beginPath();ctx.arc(-r*.35,0,r*.3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.restore();
  }
  globalThis.OrbitAbyss={profile,scale,bounds,hitsCircle,vents,ventState,ventHit,obstacles,draw,drawJelly,bossPosition,segments,drawBoss};
})();
