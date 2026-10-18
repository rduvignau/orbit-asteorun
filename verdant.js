/* A continuous living tunnel. Draw, collision and gravitational pull share geometry. */
(() => {
  'use strict';
  const route = [[0,.13,.87],[1400,.18,.8],[2800,.1,.81],[4200,.22,.9],[5600,.12,.76],[7000,.19,.87],[8200,.1,.9],[10200,.1,.9],[11000,.23,.85],[12300,.13,.75],[13700,.2,.88],[15100,.12,.8],[16300,.1,.9],[20000,.1,.9]];
  const seeds = [[3100,.3],[4700,.7],[6200,.38],[11300,.65],[12800,.32],[14300,.68],[15500,.4]];
  const scale = (w,h) => Math.max(h/540,w/1500);
  const smooth = t => { t=Math.max(0,Math.min(1,t));return t*t*(3-2*t); };
  let growth=0, warning=0;
  function setGrowth(value, signal=0) { growth=Math.max(-.16,Math.min(.16,value));warning=signal; }
  function profile(world) {
    let i=0;while(i<route.length-2 && world>route[i+1][0])i++;
    const a=route[i],b=route[i+1],t=smooth((world-a[0])/(b[0]-a[0]));
    const ripple=(Math.sin(world/180)+Math.sin(world/73)*.35)*.009;
    return {top:a[1]+(b[1]-a[1])*t+ripple+Math.max(0,growth),bottom:a[2]+(b[2]-a[2])*t-ripple+Math.min(0,growth)};
  }
  function bounds(x,w,h,distance) { const p=profile(distance+x/scale(w,h));return {top:p.top*h,bottom:p.bottom*h}; }
  function hitsCircle(x,y,r,w,h,distance) {
    return [-1,-.5,0,.5,1].some(k=>{const dx=r*k,dy=Math.sqrt(r*r-dx*dx),p=bounds(x+dx,w,h,distance);return y-dy<=p.top || y+dy>=p.bottom;});
  }
  function obstacles(w,h,distance,time) {
    const unit=scale(w,h),items=seeds.map(([world,lane],i)=>{const p=profile(world);return {id:'seed-'+i,kind:'gravity',x:(world-distance)*unit,y:(p.top+(p.bottom-p.top)*lane)*h,radius:Math.min(20,18*unit),influence:Math.min(h*.32,w*.45),angle:time*.6+i};});
    for(const [i,world] of [2100,3900,5300,7200,10800,12000,13500,14900,15900].entries()){const p=profile(world);items.push({id:'fruit-'+i,kind:'fruit',x:(world-distance)*unit,y:(p.top+(p.bottom-p.top)*(i%2?.68:.32))*h,radius:Math.min(24,23*unit),angle:time*.3+i});}
    return items.filter(p=>p.x>-(p.influence||0)-40 && p.x<w+(p.influence||0)+40);
  }
  function pull(x,y,w,h,distance,time) {
    let vx=0,vy=0;
    for(const seed of obstacles(w,h,distance,time))if(seed.kind==='gravity'){
      const dx=seed.x-x,dy=seed.y-y,d=Math.hypot(dx,dy);
      if(d>1 && d<seed.influence){const force=95*(1-d/seed.influence);vx+=dx/d*force;vy+=dy/d*force;}
    }
    return {x:vx,y:vy};
  }
  function draw(ctx,w,h,distance,time,destroyed=new Set()) {
    const unit=scale(w,h);
    // Distant organic ribs drift more slowly than the solid tunnel.
    for(let i=0;i<9;i++){
      const x=((i*230-distance*.23)%2070+2070)%2070/1500*w;
      ctx.strokeStyle='#b48aea12';ctx.lineWidth=13;ctx.beginPath();ctx.ellipse(x,h*.5,w*.13,h*.6,.15*Math.sin(i),0,Math.PI*2);ctx.stroke();
    }
    for(let i=0;i<33;i++){const x=((i*137-distance*.12)%1700+1700)%1700/1500*w,y=h*(.2+((i*71)%100)/170)+Math.sin(time*.5+i)*9;ctx.fillStyle=i%3?'#c6ff9c44':'#dbb0ff66';ctx.beginPath();ctx.arc(x,y,i%3?1:2,0,Math.PI*2);ctx.fill();}
    for(const side of ['top','bottom']){
      const points=[];for(let x=-12;x<=w+12;x+=8)points.push({x,y:bounds(x,w,h,distance)[side]});
      ctx.beginPath();ctx.moveTo(-12,side==='top'?0:h);for(const p of points)ctx.lineTo(p.x,p.y);ctx.lineTo(w+12,side==='top'?0:h);ctx.closePath();ctx.fillStyle='#292b3c';ctx.fill();
      ctx.strokeStyle=warning && (warning>0)===(side==='top')?'#ffc97b':'#9bc77d';ctx.lineWidth=2;ctx.stroke();
      for(let layer=1;layer<=3;layer++){ctx.beginPath();points.forEach((p,i)=>{const y=p.y+(side==='top'?-1:1)*layer*12;if(i===0)ctx.moveTo(p.x,y);else ctx.lineTo(p.x,y);});ctx.strokeStyle=layer%2?'#bb8ad94a':'#b3dc9340';ctx.lineWidth=2;ctx.stroke();}
      for(let cell=Math.floor(distance/140);cell<(distance+w/unit)/140+1;cell++){
        const x=(cell*140-distance)*unit,p=bounds(x,w,h,distance),y=p[side],dir=side==='top'?-1:1;
        ctx.strokeStyle='#c5e79955';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+15,y+dir*18,x-5,y+dir*38);ctx.stroke();
        ctx.fillStyle=cell%3?'#bbe78a':'#dc9bf6';ctx.beginPath();ctx.ellipse(x,y+dir*8,3,6,.6,0,Math.PI*2);ctx.fill();
      }
    }
    for(const p of obstacles(w,h,distance,time)){
      if(destroyed.has(p.id))continue;ctx.save();ctx.translate(p.x,p.y);
      if(p.kind==='gravity'){
        ctx.strokeStyle='#ba9aef30';ctx.setLineDash([3,9]);ctx.beginPath();ctx.arc(0,0,p.influence,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        for(let i=0;i<3;i++){const r=p.radius+((time*22+i*25)%70);ctx.strokeStyle='#b49ae048';ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}
        ctx.rotate(-p.angle);ctx.strokeStyle='#e1b7ff';ctx.fillStyle='#594070';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=p.radius*(i%2?.6:1);if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ecceff';ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();
      }else{ctx.rotate(Math.sin(p.angle)*.2);ctx.fillStyle='#56713b';ctx.strokeStyle='#d4ff92';ctx.beginPath();ctx.ellipse(0,0,p.radius*.75,p.radius,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#e4ffbc';ctx.fillRect(-2,-8,4,16);ctx.fillRect(-7,-2,14,4);}
      ctx.restore();
    }
    if(warning){ctx.textAlign='center';ctx.font='bold 11px monospace';ctx.fillStyle='#ffce88';ctx.fillText(warning>0?'ROOT SURGE ↓ · CEILING GROWING':'ROOT SURGE ↑ · FLOOR GROWING',w*.48,warning>0?h*.23:h*.77);}
  }
  globalThis.OrbitVerdant={profile,scale,bounds,hitsCircle,obstacles,pull,setGrowth,draw};
})();
