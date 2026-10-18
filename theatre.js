/* A locally drawn ending: escape, sunrise, then an affectionately overstaffed arcade credit roll. */
(() => {
  const MACHINE='ChatGPT Codex Sol 6.1 Medium';
  const credits=[['HUMAN DESIGNER · 10000-CHARACTER PROMPTER','Romaric Duvignau'],
    ['GAME DESIGN',MACHINE],['GAMEPLAY PROGRAMMING',MACHINE],['EIGHT WORLDS / CARTOGRAPHY',MACHINE],
    ['ASTEROID CASTING DIRECTOR',MACHINE],['ENEMY CHOREOGRAPHY',MACHINE],['MEGA BOSS ENGINEERING',MACHINE],
    ['WEAPONS & QUESTIONABLE LASERS',MACHINE],['FLIGHT PHYSICS',MACHINE],['MUSIC COMPOSITION',MACHINE],
    ['SOUND EFFECTS / FINALLY AUDIBLE',MACHINE],['LIGHTING & EXPLOSIONS',MACHINE],['INTERFACE & TINY BUTTONS',MACHINE],
    ['QUALITY ASSURANCE',MACHINE],['HIGH SCORE CLERK',MACHINE],['ASSISTANT TO THE HUMAN DESIGNER',MACHINE],
    ['CRAFT SERVICES / SIMULATED COFFEE',MACHINE],['EXECUTIVE PRODUCER',MACHINE]];
  const fragments=['The screen should scroll from right to left.','And be creative :)','Add a boss at the end of level 1.','No rush, take your time.','One new weapon should be introduced.','Take your time and be imaginative.','Only 3 levels to go.','And of course, have fun!','❤️  ❤️  ❤️'];
  const duration=12+credits.length*2.8+9;
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function ship(ctx,x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#ffcc8a';ctx.beginPath();ctx.moveTo(-15,-4);ctx.lineTo(-38,0);ctx.lineTo(-15,4);ctx.fill();ctx.fillStyle='#eff7f5';ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(-15,-13);ctx.lineTo(-9,0);ctx.lineTo(-15,13);ctx.closePath();ctx.fill();ctx.fillStyle='#80bbb7';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-4,-4);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();}
  function draw(ctx,w,h,time){
    const dawn=smooth((time-3)/9),cx=w*.68,cy=h*.53,r=Math.min(w*.35,h*.6),pulse=1+Math.sin(time*.8)*.025;
    ctx.fillStyle='#080e18';ctx.fillRect(0,0,w,h);
    for(let i=0;i<100;i++){const x=((i*97.31-time*(time<12?22:5))%w+w)%w,y=(i*47.23)%h;ctx.fillStyle=i%3?'#b8d4e377':'#fff3c5aa';ctx.fillRect(x,y,i%4?1:2,1);}
    const glow=ctx.createRadialGradient(cx,cy,r*.1,cx,cy,r*1.6);glow.addColorStop(0,`rgba(255,225,160,${.55*dawn})`);glow.addColorStop(.5,`rgba(212,141,77,${.18*dawn})`);glow.addColorStop(1,'#e6ba7500');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.fillStyle=`rgba(255,231,171,${.8*dawn})`;ctx.beginPath();ctx.arc(cx,cy,r*.62*pulse,0,Math.PI*2);ctx.fill();
    // The eclipse recedes as the rescued star lights the path home.
    ctx.fillStyle='#0b1420';ctx.beginPath();ctx.arc(cx-r*(.08+dawn*.95),cy-r*dawn*.12,r*.61,0,Math.PI*2);ctx.fill();
    if(time<12){
      const flight=smooth(time/12),x=w*(.14+.65*flight),y=h*(.61-.13*Math.sin(flight*Math.PI));ship(ctx,x,y,Math.min(1,w/700)+.25);
      ctx.fillStyle='#aaffdf';ctx.beginPath();ctx.arc(x-31,y-23,4,0,Math.PI*2);ctx.fill();
      if(time<4){ctx.strokeStyle='#f7c98c';ctx.lineWidth=2;for(let i=0;i<18;i++){const a=i*Math.PI/9,rr=(time*70+i*7);ctx.beginPath();ctx.moveTo(w*.88+Math.cos(a)*rr,h*.5+Math.sin(a)*rr);ctx.lineTo(w*.88+Math.cos(a)*(rr+12),h*.5+Math.sin(a)*(rr+12));ctx.stroke();}}
      ctx.textAlign='center';ctx.font=`500 ${Math.min(35,w*.065)}px sans-serif`;ctx.fillStyle='#fff0d1';ctx.fillText(time<5?'The engine falls.':'A star comes home.',w*.5,h*.24);
      ctx.font='11px monospace';ctx.fillStyle='#b8d2cf';ctx.fillText('EIGHT WORLDS. ONE LITTLE SHIP.',w*.5,h*.32);
    }else{
      for(let i=0;i<fragments.length;i++){
        const x=((w-i*97-time*8)%(w+400)+w+400)%(w+400)-200,y=h*(.1+(i%7)*.13)+Math.sin(time*.15+i)*14;
        ctx.save();ctx.translate(x,y);ctx.rotate(-.12);ctx.fillStyle='#d3dbd01a';ctx.font='10px monospace';ctx.fillText(fragments[i],0,0);ctx.restore();
      }
      const panel=ctx.createLinearGradient(0,0,w,0);panel.addColorStop(0,'#07111b00');panel.addColorStop(.17,'#07111be8');panel.addColorStop(.83,'#07111be8');panel.addColorStop(1,'#07111b00');ctx.fillStyle=panel;ctx.fillRect(0,h*.34,w,h*.34);
      const index=Math.floor((time-12)/2.8),phase=((time-12)%2.8)/2.8;
      ctx.textAlign='center';
      if(index<credits.length){
        ctx.globalAlpha=Math.min(1,phase*7,(1-phase)*7);ctx.fillStyle='#e7c79a';ctx.font=`bold ${Math.min(11,w*.022)}px monospace`;ctx.fillText(credits[index][0],w*.5,h*.43);
        ctx.fillStyle='#f5f4e7';ctx.font=`500 ${Math.min(31,w*.055)}px sans-serif`;ctx.fillText(credits[index][1],w*.5,h*.53);ctx.globalAlpha=1;
        ctx.fillStyle='#a0b6b4';ctx.font='9px monospace';ctx.fillText('AN ASTEORUN ORIGINAL · '+String(index+1).padStart(2,'0')+' / '+credits.length,w*.5,h*.64);
      }else{
        ctx.fillStyle='#fff0cb';ctx.font=`500 ${Math.min(40,w*.08)}px sans-serif`;ctx.fillText('THANK YOU FOR FLYING.',w*.5,h*.43);
        ctx.fillStyle='#b6e4d3';ctx.font=`${Math.min(15,w*.032)}px monospace`;ctx.fillText('THE LAST LIGHT IS YOURS.',w*.5,h*.55);ship(ctx,w*.5,h*.72,.65);
      }
    }
  }
  function drawGameOver(ctx,w,h,time,score,level){
    ctx.fillStyle='#070c16';ctx.fillRect(0,0,w,h);
    const collapse=Math.max(0,1-time/1.4),cx=w*.5,cy=h*.44;
    for(let i=0;i<90;i++){
      const angle=i*2.39996,distance=12+time*(28+i%17*5),x=cx+Math.cos(angle)*distance,y=cy+Math.sin(angle)*distance*.6;
      ctx.globalAlpha=Math.max(0,1-time/5)*(i%3?.5:1);ctx.fillStyle=i%3?'#ec9b69':'#bce9df';ctx.fillRect(x,y,2+i%3,1);
    }
    ctx.globalAlpha=collapse;if(collapse>0){ctx.save();ctx.translate(cx,cy);ctx.rotate(time*1.2);ship(ctx,0,0,.8*collapse);ctx.restore();}
    ctx.globalAlpha=Math.min(1,Math.max(0,(time-.65)/.9));ctx.textAlign='center';
    ctx.fillStyle='#d3af81';ctx.font='10px monospace';ctx.fillText('FINAL TRANSMISSION / SIGNAL LOST',cx,h*.29);
    ctx.fillStyle='#f1e8da';ctx.font=`500 ${Math.min(42,w*.08)}px sans-serif`;ctx.fillText('Every star remembers.',cx,h*.47);
    ctx.fillStyle='#9fbdc4';ctx.font=`${Math.min(13,w*.027)}px monospace`;ctx.fillText(`${score.toLocaleString()} POINTS  /  MISSION ${String(level).padStart(2,'0')}`,cx,h*.59);
    ctx.strokeStyle='#9fcac577';ctx.lineWidth=1;ctx.beginPath();
    for(let x=0;x<w;x+=3){const envelope=Math.exp(-(((x/w-.5)*7)**2))*Math.max(0,1-time/3.8);const y=h*.73+Math.sin(x*.12-time*12)*h*.07*envelope;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    ctx.fillStyle='#7b929f';ctx.font='8px monospace';ctx.fillText(time<3.5?'TRANSMITTING YOUR FLIGHT RECORD…':'YOUR NEXT JOURNEY IS WAITING.',cx,h*.84);ctx.globalAlpha=1;
  }
  globalThis.OrbitTheatre={draw,duration,credits,fragments,drawGameOver,gameOverDuration:5};
})();
