/* Ice, moving shear gates, and rear ion fronts share their collision and draw geometry. */
(() => {
  'use strict';
  const route = [[0,.12,.88],[900,.2,.83],[1800,.14,.73],[2700,.22,.84],[3700,.12,.79],[4800,.19,.82],[5800,.1,.9],[6500,.1,.9],[8200,.1,.9],[8500,.21,.86],[9400,.12,.77],[10300,.23,.84],[11200,.13,.8],[12400,.1,.9],[16500,.1,.9]];
  const gatePositions = [1400, 3200, 4600, 8600, 10000, 11500];
  const props = [[1800,'prism',.53],[2500,'anchor',.4],[3600,'prism',.58],[4300,'anchor',.62],[5100,'prism',.45],[9000,'prism',.55],[9300,'anchor',.35],[10600,'prism',.44],[11000,'anchor',.65],[11900,'prism',.6]];
  const scale = (w,h) => Math.max(h/540,w/1500);
  const smooth = value => { const t=Math.max(0,Math.min(1,value)); return t*t*(3-2*t); };
  function profile(worldX) {
    let i=0;while(i<route.length-2 && worldX>route[i+1][0])i++;
    const a=route[i],b=route[i+1],t=smooth((worldX-a[0])/(b[0]-a[0]));
    const facet=Math.abs(Math.sin(worldX/155))*.012+Math.abs(Math.sin(worldX/59))*.007;
    return {top:a[1]+(b[1]-a[1])*t+facet,bottom:a[2]+(b[2]-a[2])*t-facet};
  }
  function gates(w,h,distance,time) {
    const unit=scale(w,h);
    return gatePositions.map((worldX,id)=>{
      const p=profile(worldX+35),gap=h*.42,center=Math.max(p.top*h+gap/2+12,Math.min(p.bottom*h-gap/2-12,h*(.5+Math.sin(time*.65+id*2)*.09)));
      return {id:`shear-${id}`,x:(worldX-distance)*unit,w:64*unit,top:center-gap/2,bottom:center+gap/2};
    }).filter(g=>g.x+g.w>-15 && g.x<w+15);
  }
  function bounds(x,w,h,distance,time=0) {
    const p=profile(distance+x/scale(w,h));let top=p.top*h,bottom=p.bottom*h;
    for(const gate of gates(w,h,distance,time))if(x>=gate.x && x<=gate.x+gate.w){top=Math.max(top,gate.top);bottom=Math.min(bottom,gate.bottom);}
    return {top,bottom};
  }
  function hitsCircle(x,y,r,w,h,distance,time=0) {
    for(const offset of [-1,-.5,0,.5,1]){const dx=r*offset,dy=Math.sqrt(Math.max(0,r*r-dx*dx)),p=bounds(x+dx,w,h,distance,time);if(y-dy<=p.top || y+dy>=p.bottom)return true;}return false;
  }
  function obstacles(w,h,distance,time) {
    const unit=scale(w,h);
    return props.map(([worldX,kind,lane],id)=>{const p=profile(worldX);return {id:`ice-${id}`,kind,x:(worldX-distance)*unit,y:(p.top+(p.bottom-p.top)*lane)*h,radius:Math.min(32,(kind==='prism'?29:25)*unit),angle:time*.5+id};}).filter(p=>p.x>-p.radius-20 && p.x<w+p.radius+20);
  }
  function frontState(front,w) {
    if(!front)return null;
    const t=front.age,reach=front.reach??.52;
    const fraction=t<2.5?0:t<5.5?smooth((t-2.5)/3)*reach:t<7?reach:t<8.5?(1-smooth((t-7)/1.5))*reach:0;
    return {warning:t<2.5,active:t>=2.5 && t<8.5,x:fraction*w,done:t>=8.5};
  }
  function drawFront(ctx,w,h,front) {
    const state=frontState(front,w);if(!state || state.done)return;
    ctx.save();const edge=Math.max(3,state.x);
    if(state.warning){ctx.fillStyle='#f4a5d622';ctx.fillRect(0,0,8,h);ctx.strokeStyle='#f9a5d0bb';ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(9,h);ctx.stroke();ctx.setLineDash([]);}
    else {const haze=ctx.createLinearGradient(0,0,edge+25,0);haze.addColorStop(0,'#7c507caa');haze.addColorStop(1,'#c883ce11');ctx.fillStyle=haze;ctx.fillRect(0,0,edge,h);ctx.strokeStyle='#f5addf';ctx.lineWidth=2;ctx.shadowColor='#fda1d5';ctx.shadowBlur=13;ctx.beginPath();for(let y=0;y<h;y+=12){const x=edge+Math.sin(y*.17+front.age*8)*4;if(y===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.shadowBlur=0;}
    ctx.font='bold 9px monospace';ctx.fillStyle='#ffd2eb';ctx.textAlign='left';ctx.fillText(state.warning?'TAIL FRONT INBOUND →':'ION FRONT · MOVE RIGHT →',Math.max(20,edge+14),h*.26);
    ctx.globalAlpha=.65;for(let i=0;i<3;i++){const x=Math.max(20,edge+20)+i*15,y=h*.5;ctx.strokeStyle='#ffe4f2';ctx.beginPath();ctx.moveTo(x,y-8);ctx.lineTo(x+7,y);ctx.lineTo(x,y+8);ctx.stroke();}ctx.restore();
  }
  function draw(ctx,w,h,distance,time,destroyed=new Set()) {
    const unit=scale(w,h),planetX=w*.76,planetY=h*.48,r=Math.min(h*.34,w*.3);
    const halo=ctx.createRadialGradient(planetX,planetY,0,planetX,planetY,r*1.8);halo.addColorStop(0,'#689abe28');halo.addColorStop(1,'#80bdff00');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#22435a44';ctx.beginPath();ctx.arc(planetX,planetY,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#97cfee33';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#101c2b';ctx.beginPath();ctx.arc(planetX+r*.34,planetY-r*.1,r*.94,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#b0cbe222';ctx.beginPath();ctx.ellipse(planetX,planetY,r*1.55,r*.32,-.3,0,Math.PI*2);ctx.stroke();
    for(let band=0;band<4;band++){
      ctx.beginPath();for(let x=0;x<=w+12;x+=12){const y=h*(.25+band*.1)+Math.sin(x/w*5+distance*.0004+time*.13+band)*h*.08;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.strokeStyle=['#69d4cd18','#a391ef15','#69bdf51c','#d69de814'][band];ctx.lineWidth=22;ctx.stroke();
    }
    for(const side of ['top','bottom']){
      const points=[];for(let x=-10;x<=w+10;x+=10)points.push({x,y:profile(distance+x/unit)[side]*h});
      ctx.beginPath();ctx.moveTo(-10,side==='top'?0:h);for(const p of points)ctx.lineTo(p.x,p.y);ctx.lineTo(w+10,side==='top'?0:h);ctx.closePath();ctx.fillStyle='#233947';ctx.fill();ctx.strokeStyle='#9ac3d099';ctx.lineWidth=1;ctx.stroke();
      for(let layer=1;layer<=3;layer++){ctx.beginPath();points.forEach((p,i)=>{const y=p.y+(side==='top'?-1:1)*layer*14;if(i===0)ctx.moveTo(p.x,y);else ctx.lineTo(p.x,y);});ctx.strokeStyle='#a9d1dc25';ctx.stroke();}
    }
    const first=Math.floor(distance/150),last=Math.ceil((distance+w/unit)/150);
    for(let cell=first;cell<=last;cell++){const world=cell*150,x=(world-distance)*unit,p=profile(world),side=cell%2?'top':'bottom',y=p[side]*h,dir=side==='top'?1:-1,size=(14+(cell%3)*7)*Math.min(unit,1.2);ctx.fillStyle=cell%3===0?'#b8a2d97a':'#a4cbd97a';ctx.beginPath();ctx.moveTo(x-10,y-dir*3);ctx.lineTo(x-3,y+dir*size);ctx.lineTo(x+8,y+dir*size*.5);ctx.lineTo(x+12,y-dir*3);ctx.closePath();ctx.fill();}
    for(const gate of gates(w,h,distance,time))for(const [y,height,edge] of [[0,gate.top,gate.top],[gate.bottom,h-gate.bottom,gate.bottom]]){
      ctx.fillStyle='#334252';ctx.strokeStyle='#c0b4d8';ctx.fillRect(gate.x,y,gate.w,height);ctx.strokeRect(gate.x,y,gate.w,height);ctx.fillStyle='#e2b8f0';ctx.fillRect(gate.x,edge-3,gate.w,6);ctx.strokeStyle='#b6d5e344';ctx.beginPath();ctx.moveTo(gate.x+gate.w*.25,y);ctx.lineTo(gate.x+gate.w*.75,y+height);ctx.stroke();
    }
    for(const p of obstacles(w,h,distance,time)){
      if(destroyed.has(p.id))continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.kind==='prism'?'#587d9255':'#3d3751';ctx.strokeStyle=p.kind==='prism'?'#bce4ee':'#d3b5f4';ctx.lineWidth=1.5;ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*Math.PI*2,x=Math.cos(a)*p.radius,y=Math.sin(a)*p.radius;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-p.radius,0);ctx.lineTo(p.radius,0);ctx.moveTo(0,-p.radius*.85);ctx.lineTo(0,p.radius*.85);ctx.stroke();if(p.kind==='anchor'){ctx.strokeStyle='#edbefb';ctx.beginPath();ctx.arc(0,0,p.radius*1.02,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#edbefb';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();}ctx.restore();
    }
  }
  globalThis.OrbitMeridian={profile,scale,bounds,hitsCircle,gates,obstacles,frontState,drawFront,draw};
})();
