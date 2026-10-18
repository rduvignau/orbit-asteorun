/* The foundry's render and collision geometry share world coordinates and animation time. */
(() => {
  'use strict';
  const route = [[0,.14,.86],[1000,.22,.83],[1800,.14,.74],[2500,.17,.85],[3500,.24,.87],[4400,.12,.85],[5200,.12,.88],[6900,.12,.88],[7300,.23,.83],[8000,.14,.74],[8700,.23,.86],[9500,.13,.80],[10300,.1,.9],[14000,.1,.9]];
  const presses = [[600,'top'],[1100,'bottom'],[1650,'top'],[2250,'pair'],[2950,'bottom'],[3500,'top'],[4100,'bottom'],[4650,'pair'],[7200,'top'],[7750,'bottom'],[8300,'pair'],[8900,'top'],[9450,'bottom'],[9950,'pair']];
  const props = [[1850,'rotor',.58],[2600,'cargo',.45],[3750,'rotor',.52],[4400,'cargo',.6],[7500,'cargo',.4],[8050,'rotor',.48],[9100,'cargo',.58],[9700,'rotor',.45]];
  const scale = (w,h) => Math.max(h/540,w/1500);
  function profile(worldX) {
    let i=0; while(i<route.length-2 && worldX>route[i+1][0]) i++;
    const a=route[i], b=route[i+1], q=Math.max(0,Math.min(1,(worldX-a[0])/(b[0]-a[0]))), t=q*q*(3-2*q);
    return {top:a[1]+(b[1]-a[1])*t,bottom:a[2]+(b[2]-a[2])*t};
  }
  function panels(w,h,distance,time) {
    const unit=scale(w,h), result=[];
    presses.forEach(([worldX,side],id)=>{
      const x=(worldX-distance)*unit, width=110*unit;
      if(x+width < -20 || x>w+20) return;
      const p=profile(worldX+55), extension=(.5+.5*Math.sin(time*1.25+id*1.9))*h*(side==='pair'?.105:.16);
      for(const edge of side==='pair'?['top','bottom']:[side]) {
        const y=edge==='top'?0:p.bottom*h-extension, height=edge==='top'?p.top*h+extension:h-y;
        result.push({id:`press-${id}-${edge}`,x,y,w:width,h:height,edge,base:(edge==='top'?p.top:p.bottom)*h,extension});
      }
    }); return result;
  }
  function bounds(x,w,h,distance,time=0) {
    const p=profile(distance+x/scale(w,h)); let top=p.top*h,bottom=p.bottom*h;
    for(const panel of panels(w,h,distance,time)) if(x>=panel.x && x<=panel.x+panel.w) {
      if(panel.edge==='top') top=Math.max(top,panel.h); else bottom=Math.min(bottom,panel.y);
    }
    return {top,bottom};
  }
  function hitsCircle(x,y,r,w,h,distance,time=0) {
    for(const offset of [-1,-.5,0,.5,1]) {
      const dx=r*offset,dy=Math.sqrt(Math.max(0,r*r-dx*dx)),p=bounds(x+dx,w,h,distance,time);
      if(y-dy<=p.top || y+dy>=p.bottom) return true;
    } return false;
  }
  function obstacles(w,h,distance,time) {
    const unit=scale(w,h);
    return props.map(([worldX,kind,lane],id)=>{
      const x=(worldX-distance)*unit,p=profile(worldX);
      return {id:`prop-${id}`,kind,x,y:(p.top+(p.bottom-p.top)*lane)*h+(kind==='rotor'?Math.sin(time*.9+id)*h*.04:0),radius:kind==='rotor'?Math.min(31,28*unit):Math.min(27,24*unit),angle:time*(id%2?1.3:-1.3)};
    }).filter(p=>p.x>-p.radius-20 && p.x<w+p.radius+20);
  }
  function draw(ctx,w,h,distance,time,destroyed=new Set()) {
    const unit=scale(w,h);
    // A distant captive sun, crossed by the silhouettes of orbital gantries.
    ctx.save(); const sunX=w*.72-Math.sin(distance/5000)*w*.07, sunY=h*.49, r=Math.min(w*.24,h*.37);
    const halo=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,r*1.8); halo.addColorStop(0,'#df7b3430');halo.addColorStop(.6,'#d25e2b12');halo.addColorStop(1,'#d25e2b00');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#f6b16426';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sunX,sunY,r,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(sunX,sunY,r*.9,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#d6a26612';for(let i=0;i<8;i++){const a=i*Math.PI/4+time*.025;ctx.beginPath();ctx.moveTo(sunX+Math.cos(a)*r*.9,sunY+Math.sin(a)*r*.9);ctx.lineTo(sunX+Math.cos(a)*r*1.3,sunY+Math.sin(a)*r*1.3);ctx.stroke();}
    const spacing=170*unit, offset=(distance*.22*unit)%spacing;
    ctx.strokeStyle='#a1774c14';for(let x=-offset;x<w;x+=spacing){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+spacing,h);ctx.stroke();}ctx.restore();
    for(const side of ['top','bottom']) {
      ctx.beginPath();ctx.moveTo(-8,side==='top'?0:h);
      for(let x=-8;x<=w+8;x+=8)ctx.lineTo(x,profile(distance+x/unit)[side]*h);
      ctx.lineTo(w+8,side==='top'?0:h);ctx.closePath();ctx.fillStyle='#28282b';ctx.fill();ctx.strokeStyle='#8f795d';ctx.lineWidth=1.2;ctx.stroke();
    }
    const first=Math.floor(distance/95),last=Math.ceil((distance+w/unit)/95);
    for(let cell=first;cell<=last;cell++) {
      const x=(cell*95-distance)*unit,p=profile(cell*95),plateW=95*unit;
      for(const side of ['top','bottom']) {
        const edge=p[side]*h,dir=side==='top'?-1:1;
        ctx.strokeStyle='#b6a78d24';ctx.beginPath();ctx.moveTo(x,edge);ctx.lineTo(x,edge+dir*70);ctx.stroke();ctx.beginPath();ctx.moveTo(x,edge+dir*12);ctx.lineTo(x+plateW*.8,edge+dir*12);ctx.stroke();
        ctx.fillStyle=cell%3===0?'#f2ad57':'#7f7664';ctx.fillRect(x+7,edge+dir*22-2,3,3);
        if(cell%4===0){ctx.fillStyle='#111a20';ctx.fillRect(x+15,edge+dir*42-4,plateW*.5,8);ctx.fillStyle='#e3964e55';ctx.fillRect(x+17,edge+dir*42-2,plateW*.35,3);}
      }
    }
    for(const panel of panels(w,h,distance,time)) {
      ctx.fillStyle='#3d3832';ctx.fillRect(panel.x,panel.y,panel.w,panel.h);ctx.strokeStyle='#a48b65';ctx.strokeRect(panel.x,panel.y,panel.w,panel.h);
      const cap=panel.edge==='top'?panel.h:panel.y;
      ctx.fillStyle='#151e24';ctx.fillRect(panel.x+panel.w*.25,Math.min(panel.base,cap),panel.w*.5,Math.abs(cap-panel.base));
      ctx.strokeStyle='#7f8781';ctx.lineWidth=2;for(const fraction of [.3,.7]){ctx.beginPath();ctx.moveTo(panel.x+panel.w*fraction,panel.base);ctx.lineTo(panel.x+panel.w*fraction,cap);ctx.stroke();}
      ctx.fillStyle='#edb35f';ctx.fillRect(panel.x,cap-4,panel.w,8);
      ctx.fillStyle='#352b25';for(let stripe=0;stripe<panel.w;stripe+=14){ctx.beginPath();ctx.moveTo(panel.x+stripe,cap-4);ctx.lineTo(panel.x+stripe+7,cap-4);ctx.lineTo(panel.x+stripe+12,cap+4);ctx.lineTo(panel.x+stripe+5,cap+4);ctx.closePath();ctx.fill();}
      ctx.fillStyle='#ffd68c';ctx.fillRect(panel.x+4,cap-7,4,3);ctx.fillRect(panel.x+panel.w-8,cap-7,4,3);
    }
    for(const object of obstacles(w,h,distance,time)) {
      if(destroyed.has(object.id))continue;
      ctx.save();ctx.translate(object.x,object.y);const r=object.radius;
      if(object.kind==='rotor'){
        ctx.rotate(object.angle);ctx.fillStyle='#57473b';ctx.strokeStyle='#e4ac69';ctx.lineWidth=1.3;ctx.beginPath();
        for(let tooth=0;tooth<32;tooth++){const a=tooth/32*Math.PI*2,rr=tooth%2?r*.79:r; if(!tooth)ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);else ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#172027';ctx.beginPath();ctx.arc(0,0,r*.52,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ffc67c';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();
      }else{
        ctx.fillStyle='#44443d';ctx.strokeStyle='#b9b28a';ctx.lineWidth=1.4;const size=r*.78;ctx.fillRect(-size,-size,size*2,size*2);ctx.strokeRect(-size,-size,size*2,size*2);ctx.beginPath();ctx.moveTo(-size,-size);ctx.lineTo(size,size);ctx.moveTo(-size,size);ctx.lineTo(size,-size);ctx.stroke();ctx.fillStyle='#e9c86b';ctx.fillRect(-4,-4,8,8);
      }ctx.restore();
    }
  }
  globalThis.OrbitFoundry={profile,scale,bounds,hitsCircle,panels,obstacles,draw};
})();
