/* The Last Light: plasma galleries, warned currents and the Dawn Engine's shared geometry. */
(() => {
  'use strict';
  const route=[[0,.12,.88],[1800,.19,.82],[3600,.1,.77],[5300,.21,.88],[7200,.12,.8],[9100,.2,.86],[10800,.1,.9],[13500,.1,.9],[14800,.2,.83],[16400,.1,.78],[18100,.22,.89],[19900,.13,.8],[21600,.1,.9],[26000,.1,.9]];
  const gateSites=[2400,4800,7400,9500,14500,16800,19100,21000];
  const scale=(w,h)=>Math.max(h/540,w/1500),smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function profile(world){let i=0;while(i<route.length-2 && world>route[i+1][0])i++;const a=route[i],b=route[i+1],t=smooth((world-a[0])/(b[0]-a[0]));return {top:a[1]+(b[1]-a[1])*t,bottom:a[2]+(b[2]-a[2])*t};}
  function gates(w,h,distance,time){const unit=scale(w,h);return gateSites.map((world,i)=>{const p=profile(world),gap=h*.43,mid=h*(p.top+p.bottom)/2+Math.sin(time*.5+i)*h*.055;return {x:(world-distance)*unit,w:45*unit,top:mid-gap/2,bottom:mid+gap/2};}).filter(g=>g.x+g.w>0 && g.x<w);}
  function bounds(x,w,h,distance,time=0){const p=profile(distance+x/scale(w,h));let top=p.top*h,bottom=p.bottom*h;for(const gate of gates(w,h,distance,time))if(x>=gate.x && x<=gate.x+gate.w){top=Math.max(top,gate.top);bottom=Math.min(bottom,gate.bottom);}return {top,bottom};}
  function hitsCircle(x,y,r,w,h,distance,time=0){return [-1,-.5,0,.5,1].some(k=>{const dx=r*k,dy=Math.sqrt(r*r-dx*dx),p=bounds(x+dx,w,h,distance,time);return y-dy<=p.top || y+dy>=p.bottom;});}
  function obstacles(w,h,distance,time){const unit=scale(w,h);return [3400,6200,8400,15400,17900,20100].map((world,i)=>{const p=profile(world);return {id:'capacitor-'+i,kind:'capacitor',x:(world-distance)*unit,y:h*(p.top+(p.bottom-p.top)*(i%2?.7:.3)),radius:Math.min(27,25*unit),angle:time*.4};}).filter(p=>p.x>-40 && p.x<w+40);}
  function current(time){const phase=time%24,index=Math.floor(time/24),direction=index%2?-1:1;return {warning:phase<3,active:phase>=3 && phase<9,direction,phase};}
  function components(boss){const r=boss.radius;return boss.parts.map((p,i)=>({...p,index:i,x:boss.x-r*([.65,.65,1.02,1.02][i]),y:boss.y+r*([-.83,.83,-.3,.3][i]),radius:r*(i<2?.2:.18)}));}
  const radius=(w,h,kind)=>kind==='cinders'?Math.min(55,Math.max(35,w*.13)):Math.min(h*.31,w*.27);
  function draw(ctx,w,h,distance,time,destroyed=new Set()){
    const unit=scale(w,h),cx=w*.7,cy=h*.5,r=Math.min(h*.57,w*.42);
    const halo=ctx.createRadialGradient(cx,cy,r*.25,cx,cy,r*1.5);halo.addColorStop(0,'#eebf6122');halo.addColorStop(.65,'#df9c3520');halo.addColorStop(1,'#efb45f00');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#efc77b44';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#181920';ctx.beginPath();ctx.arc(cx+r*.08,cy,r*.97,0,Math.PI*2);ctx.fill();
    for(let i=0;i<28;i++){const a=time*.04+i*Math.PI/14,reach=r*(1.04+Math.sin(time*.8+i)*.04);ctx.strokeStyle='#ebc27c22';ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.lineTo(cx+Math.cos(a)*reach,cy+Math.sin(a)*reach);ctx.stroke();}
    for(let i=0;i<38;i++){const x=((i*137-distance*.35)%1700+1700)%1700/1500*w,y=h*((i*43%100)/100);ctx.fillStyle=i%3?'#ffd39455':'#fff0c777';ctx.fillRect(x,y,i%3?2:3,1);}
    for(const side of ['top','bottom']){
      const points=[];for(let x=-8;x<=w+8;x+=8)points.push({x,y:profile(distance+x/unit)[side]*h});ctx.beginPath();ctx.moveTo(-8,side==='top'?0:h);for(const p of points)ctx.lineTo(p.x,p.y);ctx.lineTo(w+8,side==='top'?0:h);ctx.closePath();ctx.fillStyle='#303039';ctx.fill();ctx.strokeStyle='#d6ae74';ctx.lineWidth=2;ctx.stroke();
      for(let i=Math.floor(distance/160);i<(distance+w/unit)/160+1;i++){const x=(i*160-distance)*unit,y=profile(i*160)[side]*h,dir=side==='top'?-1:1;ctx.fillStyle='#e4c184';ctx.fillRect(x,y+dir*8,unit*32,2);ctx.strokeStyle='#a98e6555';ctx.strokeRect(x,y+dir*18,unit*70,dir*20);}
    }
    for(const g of gates(w,h,distance,time))for(const [y,height,edge] of [[0,g.top,g.top],[g.bottom,h-g.bottom,g.bottom]]){ctx.fillStyle='#44404a';ctx.fillRect(g.x,y,g.w,height);ctx.strokeStyle='#f2ca88';ctx.strokeRect(g.x,y,g.w,height);ctx.fillStyle='#ffdf9f';ctx.fillRect(g.x,edge-3,g.w,6);}
    for(const p of obstacles(w,h,distance,time)){if(destroyed.has(p.id))continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#6d4b32';ctx.strokeStyle='#ffd091';ctx.lineWidth=2;ctx.strokeRect(-p.radius*.7,-p.radius*.7,p.radius*1.4,p.radius*1.4);ctx.fillRect(-p.radius*.6,-p.radius*.6,p.radius*1.2,p.radius*1.2);ctx.fillStyle='#ffebbc';ctx.fillRect(-3,-p.radius*.6,6,p.radius*1.2);ctx.restore();}
    const tide=current(time);if(tide.warning || tide.active){ctx.fillStyle=tide.warning?'#fbd39177':'#fbd39140';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText(tide.warning?'CURRENT REVERSAL · '+(tide.direction>0?'→':'←'):'STELLAR CURRENT '+(tide.direction>0?'→':'←'),w*.5,h*.88);if(tide.active)for(let i=0;i<6;i++){const x=((i/6+time*.08*tide.direction)%1+1)%1*w,y=h*.83;ctx.strokeStyle='#f0d29033';ctx.beginPath();ctx.moveTo(x-tide.direction*8,y-4);ctx.lineTo(x,y);ctx.lineTo(x-tide.direction*8,y+4);ctx.stroke();}}
  }
  function drawBoss(ctx,b,w,h){
    const r=b.radius;ctx.save();
    if(b.kind==='cinders'){ctx.translate(b.x,b.y);ctx.fillStyle=b.flash>0?'#fff0cb':'#594b43';ctx.strokeStyle='#e3be83';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-r,-r*.7);ctx.lineTo(r*.6,-r);ctx.lineTo(r,r);ctx.lineTo(-r,r*.7);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ffe2a3';ctx.fillRect(-r*.7,-r*.15,r*.55,r*.3);ctx.restore();return;}
    ctx.translate(b.x,b.y);
    for(let ring=0;ring<3;ring++){ctx.save();ctx.rotate(b.age*(ring%2?-.13:.09));ctx.strokeStyle=ring===2?'#ffd99977':'#d0a66b';ctx.lineWidth=ring===2?1:3;ctx.beginPath();ctx.arc(0,0,r*(.85+ring*.2),0,Math.PI*2);ctx.stroke();for(let i=0;i<16;i++){const a=i*Math.PI/8,inner=r*(.85+ring*.2);ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*(inner+8),Math.sin(a)*(inner+8));ctx.stroke();}ctx.restore();}
    ctx.fillStyle=b.flash>0?'#fff2cf':'#26252e';ctx.strokeStyle='#bda780';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*.82,r*1.05,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3+b.age*.035);ctx.fillStyle=b.phase===3?'#e8be7140':'#78644f';ctx.beginPath();ctx.moveTo(r*.15,0);ctx.lineTo(r*.63,-r*.28);ctx.lineTo(r*.88,0);ctx.lineTo(r*.63,r*.28);ctx.closePath();ctx.fill();ctx.restore();}ctx.restore();
    for(const p of components(b)){ctx.strokeStyle=p.hp>0?'#f1d29a':'#635657';ctx.fillStyle=p.hp>0?(p.flash>0?'#fff4d9':'#8c6240'):'#39303a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();ctx.stroke();if(p.hp>0){ctx.fillStyle='#ffe9b8';ctx.beginPath();ctx.arc(p.x,p.y,p.radius*.35,0,Math.PI*2);ctx.fill();}}
    const x=b.coreX??b.x-r*.58,y=b.coreY??b.y;ctx.fillStyle=b.phase===1?'#a0886a':b.phase===3?'#fff2c2':'#ffcf8f';ctx.shadowColor='#ffe1a2';ctx.shadowBlur=b.phase===1?0:22;ctx.beginPath();ctx.arc(x,y,r*(b.phase===3?.31:.24),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    if(b.beamMode==='warning' || b.beamMode==='active'){ctx.strokeStyle=b.beamMode==='active'?'#fff0bd':'#ffd39377';ctx.lineWidth=b.beamMode==='active'?7:1;ctx.setLineDash(b.beamMode==='warning'?[6,9]:[]);for(const lane of b.beamYs){ctx.beginPath();ctx.moveTo(0,lane);ctx.lineTo(b.x-r*.5,lane);ctx.stroke();}ctx.setLineDash([]);}
  }
  globalThis.OrbitFinale={profile,scale,gates,bounds,hitsCircle,obstacles,current,components,radius,draw,drawBoss};
})();
