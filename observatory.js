/* Parallax Observatory: continuous brass galleries, split routes and local time lenses. */
(() => {
  'use strict';
  const route=[[0,.12,.88],[1500,.18,.84],[3100,.11,.79],[4700,.22,.89],[6400,.12,.8],[8000,.19,.88],[9700,.1,.9],[12500,.1,.9],[13600,.2,.84],[15100,.1,.77],[16900,.22,.9],[18500,.12,.8],[20200,.1,.9],[24000,.1,.9]];
  const islands=[2300,4300,6700,8600,13400,15500,17700,19300];
  const lensSites=[[1700,.32],[3600,.67],[5700,.35],[7700,.65],[13000,.3],[14900,.68],[17100,.3],[18900,.68]];
  const scale=(w,h)=>Math.max(h/540,w/1500),smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function profile(world){let i=0;while(i<route.length-2 && world>route[i+1][0])i++;const a=route[i],b=route[i+1],t=smooth((world-a[0])/(b[0]-a[0]));return {top:a[1]+(b[1]-a[1])*t,bottom:a[2]+(b[2]-a[2])*t};}
  function bounds(x,w,h,distance){const p=profile(distance+x/scale(w,h));return {top:p.top*h,bottom:p.bottom*h};}
  function hitsCircle(x,y,r,w,h,distance){return [-1,-.5,0,.5,1].some(k=>{const dx=r*k,dy=Math.sqrt(r*r-dx*dx),p=bounds(x+dx,w,h,distance);return y-dy<=p.top || y+dy>=p.bottom;});}
  function obstacles(w,h,distance,time){const unit=scale(w,h);return islands.map((world,i)=>{const p=profile(world);return {id:'orrery-'+i,kind:'orrery',x:(world-distance)*unit,y:h*(p.top+p.bottom)/2,radius:Math.min(h*.115,58*unit),angle:time*.24+i};}).filter(p=>p.x>-p.radius-20 && p.x<w+p.radius+20);}
  function lenses(w,h,distance,time,boss){
    let result=lensSites.map(([world,lane],i)=>{const p=profile(world);return {id:i,x:(world-distance)*scale(w,h),y:h*(p.top+(p.bottom-p.top)*lane),radius:Math.min(h*.21,w*.26),phase:time*.25+i};});
    if(boss){const angle=boss.age*.27;result=[0,1].map(i=>({id:i,x:w*.53+Math.cos(angle+i*Math.PI)*w*.15,y:h*.5+Math.sin(angle+i*Math.PI)*h*.22,radius:Math.min(h*.19,w*.22),phase:angle+i}));}
    return result.filter(p=>p.x>-p.radius && p.x<w+p.radius);
  }
  const timeFactor=(x,y,fields)=>fields.some(l=>Math.hypot(x-l.x,y-l.y)<l.radius)?.32:1;
  function handState(boss,w,h){const phase=boss.age%8,angle=boss.lockAngle ?? Math.PI;return {warning:phase<2,active:phase>=2 && phase<3.4,angle:angle+(phase<2?0:-.36+.72*(phase-2)/1.4),spread:.36,length:w*.83,phase};}
  function beamHit(x,y,r,boss,hand){if(!hand.active)return false;const dx=Math.cos(hand.angle)*hand.length,dy=Math.sin(hand.angle)*hand.length,t=Math.max(0,Math.min(1,((x-boss.x)*dx+(y-boss.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-boss.x-t*dx,y-boss.y-t*dy)<r+5;}
  function copies(boss,w,h){
    const phase=boss.corePhase || 0;
    return [0,1,2].map(i=>{const angle=phase+i*Math.PI*2/3;return {x:boss.x+Math.cos(angle)*w*.12,y:h*.5+Math.sin(angle)*h*.225,real:i===0,radius:boss.radius*.65,index:i};});
  }
  function drawLens(ctx,l,time){
    ctx.save();ctx.translate(l.x,l.y);ctx.fillStyle='#a3b8ff0d';ctx.strokeStyle='#aebdfc77';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,l.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.rotate(l.phase);ctx.setLineDash([2,11]);ctx.beginPath();ctx.arc(0,0,l.radius*.91,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,l.radius*.8,l.radius*(.2+i*.14),i*Math.PI/3,0,Math.PI*2);ctx.strokeStyle='#bdc9ff30';ctx.stroke();}ctx.restore();
    ctx.font='bold 8px monospace';ctx.fillStyle='#c5d1ff';ctx.textAlign='center';ctx.fillText('TIME LENS · ⅓',l.x,l.y-l.radius-8);
  }
  function draw(ctx,w,h,distance,time,destroyed,boss){
    const unit=scale(w,h),cx=w*.66,cy=h*.5,r=Math.min(w*.36,h*.6);
    // An enormous, parallaxing astrolabe unfolds behind the route.
    ctx.save();ctx.translate(cx,cy);ctx.rotate(time*.025+distance*.000025);
    for(let ring=0;ring<4;ring++){ctx.strokeStyle=ring%2?'#c3a5752c':'#8c99db2a';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r*(.4+ring*.25),0,Math.PI*2);ctx.stroke();}
    for(let i=0;i<48;i++){const a=i*Math.PI/24;ctx.strokeStyle=i%4?'#ab946b33':'#d7bd8977';ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.91,Math.sin(a)*r*.91);ctx.lineTo(Math.cos(a)*r*(i%4?.95:1),Math.sin(a)*r*(i%4?.95:1));ctx.stroke();}
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7,b=(i+2)*Math.PI*2/7;ctx.strokeStyle='#b5c5f32a';ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.72,Math.sin(a)*r*.72);ctx.lineTo(Math.cos(b)*r*.72,Math.sin(b)*r*.72);ctx.stroke();ctx.fillStyle='#d4c59b';ctx.beginPath();ctx.arc(Math.cos(a)*r*.72,Math.sin(a)*r*.72,2,0,Math.PI*2);ctx.fill();}ctx.restore();
    const opening=smooth((distance-10500)/1000);
    if(opening>0){ctx.save();ctx.translate(cx,cy);ctx.rotate(time*.035);for(let i=0;i<7;i++){const angle=i*Math.PI*2/7,inner=r*.28,outer=r*(.7+opening*.43);ctx.save();ctx.rotate(angle);ctx.fillStyle='#a394d00c';ctx.strokeStyle='#e7c99335';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(inner,0);ctx.lineTo(outer,-r*.12);ctx.lineTo(outer+r*.12,0);ctx.lineTo(outer,r*.12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#e8d5a366';ctx.beginPath();ctx.arc(outer,0,2.5,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.restore();}
    // Star charts scroll at a different depth from the solid galleries.
    for(let i=0;i<12;i++){const x=((i*167-distance*.13)%1800+1800)%1800/1500*w,y=h*(.2+(i*37%100)/170);ctx.strokeStyle='#c5bded22';ctx.strokeRect(x-6,y-6,12,12);ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x+12,y);ctx.moveTo(x,y-12);ctx.lineTo(x,y+12);ctx.stroke();}
    for(const side of ['top','bottom']){
      const pts=[];for(let x=-10;x<=w+10;x+=10)pts.push({x,y:bounds(x,w,h,distance)[side]});
      ctx.beginPath();ctx.moveTo(-10,side==='top'?0:h);for(const p of pts)ctx.lineTo(p.x,p.y);ctx.lineTo(w+10,side==='top'?0:h);ctx.closePath();ctx.fillStyle='#252538';ctx.fill();ctx.strokeStyle='#c5ae7f';ctx.lineWidth=2;ctx.stroke();
      for(let cell=Math.floor(distance/190);cell<(distance+w/unit)/190+1;cell++){const x=(cell*190-distance)*unit,y=bounds(x,w,h,distance)[side],dir=side==='top'?-1:1;ctx.strokeStyle='#9f865a88';ctx.strokeRect(x,y+dir*5,unit*80,dir*24);ctx.fillStyle='#c7c3ef';ctx.fillRect(x+8,y+dir*12,unit*12,2);}
    }
    for(const p of obstacles(w,h,distance,time)){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#3b3447';ctx.strokeStyle='#dac18a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,p.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#b3b8ec';ctx.beginPath();ctx.ellipse(0,0,p.radius*.85,p.radius*.3,.4,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f3d69a';ctx.beginPath();ctx.arc(0,0,p.radius*.17,0,Math.PI*2);ctx.fill();ctx.restore();}
    for(const l of lenses(w,h,distance,time,boss))drawLens(ctx,l,time);
  }
  function drawMoth(ctx,e){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.sin(e.age*2)*.25);ctx.fillStyle=e.flash>0?'#f8eed2':'#8173a866';ctx.strokeStyle='#d2b8f0';ctx.lineWidth=1.5;for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(10,sign*20);ctx.lineTo(3,sign*3);ctx.closePath();ctx.fill();ctx.stroke();}ctx.fillStyle='#ffe0a5';ctx.fillRect(-8,-3,10,6);ctx.restore();}
  function drawBoss(ctx,boss,w,h){
    if(boss.kind==='secondhand'){
      const hand=handState(boss,w,h);
      if(hand.warning || hand.active){ctx.save();ctx.translate(boss.x,boss.y);ctx.strokeStyle=hand.warning?'#ead7ab77':'#ffcf8e';ctx.lineWidth=hand.active?6:1;ctx.setLineDash(hand.warning?[6,9]:[]);
        for(const angle of hand.warning?[hand.angle-hand.spread,hand.angle+hand.spread]:[hand.angle]){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(angle)*hand.length,Math.sin(angle)*hand.length);ctx.stroke();}ctx.restore();}
      ctx.save();ctx.translate(boss.x,boss.y);ctx.rotate(boss.age*.25);ctx.fillStyle=boss.flash>0?'#fff4ce':'#493d50';ctx.strokeStyle='#e4c78e';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,boss.radius,0,Math.PI*2);ctx.fill();ctx.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*boss.radius*.78,Math.sin(a)*boss.radius*.78);ctx.lineTo(Math.cos(a)*boss.radius*.95,Math.sin(a)*boss.radius*.95);ctx.stroke();}ctx.fillStyle='#d5c7ff';ctx.beginPath();ctx.arc(0,0,boss.radius*.25,0,Math.PI*2);ctx.fill();ctx.restore();
    }else{
      for(const c of copies(boss,w,h).sort((a,b)=>Number(a.real)-Number(b.real))){
        ctx.save();ctx.translate(c.x,c.y);ctx.strokeStyle=c.real?'#ffe0a0':'#ae9fd577';ctx.fillStyle=c.real?(boss.flash>0?'#fff4d6':'#54455e'):'#61517c22';ctx.lineWidth=c.real?2:1;ctx.setLineDash(c.real?[]:[4,7]);
        ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.cos(a)*boss.radius*.8,y=Math.sin(a)*boss.radius*.8;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.setLineDash([]);
        ctx.fillStyle=c.real?'#ffe6ab':'#a596c655';ctx.beginPath();ctx.arc(0,0,boss.radius*.26,0,Math.PI*2);ctx.fill();
        if(c.real){ctx.strokeStyle='#ffe6ab';ctx.beginPath();ctx.arc(0,0,boss.radius*.98,-Math.PI*.85,-Math.PI*.15);ctx.stroke();for(let i=-1;i<=1;i++){ctx.fillStyle='#ffe6ab';ctx.beginPath();ctx.arc(i*7,-boss.radius*1.1,2,0,Math.PI*2);ctx.fill();}ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('TRUE CORE',0,boss.radius+15);}
        ctx.restore();
      }
    }
  }
  globalThis.OrbitObservatory={profile,scale,bounds,hitsCircle,obstacles,lenses,timeFactor,handState,beamHit,copies,draw,drawBoss,drawMoth};
})();
