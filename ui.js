/* Title screen, local / shared scoreboard and fullscreen. Gameplay stays in game.js. */
(() => {
  function create(hooks){
    const $=s=>document.querySelector(s),rules=OrbitCampaign,scores=OrbitScores.create();let selected='normal',resumeBoard=false,result=null,ticket=0;
    try{const saved=localStorage.getItem('asteorun-difficulty');if(rules.difficulties[saved] && rules.isUnlocked(saved))selected=saved;}catch{}
    const format=n=>n.toLocaleString();
    function refreshDifficulties(){
      for(const id of Object.keys(rules.difficulties)){
        const button=$('#difficulty-'+id),unlocked=rules.isUnlocked(id);button.disabled=!unlocked;button.setAttribute('aria-pressed',String(selected===id));button.classList.toggle('selected',selected===id);
        const d=rules.difficulties[id];button.querySelector('small').textContent=`${d.lives} ${d.lives===1?'heart':'hearts'} · max ${d.maxLives} · ${d.continues} ${d.continues===1?'continue':'continues'}`;
        if(id==='hardcore')button.querySelector('.difficulty-lock').textContent=unlocked?'UNLOCKED · 2.5× SCORE':'LOCKED · FINISH HARD';
      }
      const d=rules.difficulties[selected];$('#launch-description').textContent=`${d.lives} starting ${d.lives===1?'heart':'hearts'} · ${d.lives} on respawn · ${d.maxLives} maximum hearts · ${d.continues} ${d.continues===1?'continue':'continues'} · ${d.multiplier}× points`;
    }
    function menu(){ $('.credits').hidden=false;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});document.body.classList.remove('expanded-game');ticket++;$('#score-dialog').close();$('#front-screen').hidden=false;$('.game-shell').hidden=true;$('#cinema-controls').hidden=true;$('.game-shell').dataset.cinematic='false';refreshDifficulties();$('#begin-run').focus({preventScroll:true});}
    function showGame(){ $('.credits').hidden=true; $('#front-screen').hidden=true;$('.game-shell').hidden=false; }
    for(const id of Object.keys(rules.difficulties))$('#difficulty-'+id).addEventListener('click',()=>{if(rules.isUnlocked(id)){selected=id;try{localStorage.setItem('asteorun-difficulty',id);}catch{}refreshDifficulties();}});
    $('#begin-run').addEventListener('click',()=>{showGame();hooks.start(selected);});
    $('#return-title').addEventListener('click',()=>hooks.menu());
    $('#end-credits').addEventListener('click',()=>hooks.creditsDone());
    function drawRows(entries){
      const body=$('#score-rows');body.replaceChildren();
      entries.forEach((entry,i)=>{const row=document.createElement('tr');for(const value of [String(i+1).padStart(2,'0'),entry.name,format(entry.score),String(entry.level)+(entry.won?' ★':''),rules.difficulties[entry.difficulty]?.name || entry.difficulty]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}body.append(row);});
      $('#empty-board').hidden=entries.length>0;
    }
    async function load(record=null){
      const current=++ticket;$('#board-status').textContent='Opening the flight archive…';$('#score-form').hidden=true;$('#score-retry').hidden=true;
      drawRows(scores.local());
      const data=await scores.load();if(current!==ticket)return;
      drawRows(data.scores);
      const local=scores.local(),qualifies=record && record.score>0 && (local.length<10 || record.score>=local.at(-1).score || data.scores.length<10 || record.score>=data.scores.at(-1).score);
      const scope=data.shared?'Local + shared high scores':'Local high scores · This browser';
      if(!record)$('#board-summary').textContent=scope;
      $('#score-form').hidden=!qualifies;$('#board-status').textContent=qualifies?'TOP TEN SIGNAL · Choose your pilot name.':scope;
      if(qualifies)$('#pilot-name').focus({preventScroll:true});
    }
    function openBoard(record=null){
      result=record;
      if(!record && ['playing','intro'].includes(hooks.state())){hooks.pause();resumeBoard=true;}else resumeBoard=false;
      $('#board-title').textContent=record?(record.won?'A STAR TO BRING HOME':'FLIGHT COMPLETE'):'THE FLIGHT ARCHIVE';
      $('#board-summary').textContent=record?`${format(record.score)} points · Level ${record.level} · ${rules.difficulties[record.difficulty].name}${record.won?' · ALL EIGHT WORLDS CLEARED':''}`:'TOP TEN / HIGH SCORES';
      $('#score-form').hidden=true;$('#score-submit').disabled=false;$('#board-close').textContent=record?'Return to title':'Back';
      $('#pilot-name').value='';$('#score-dialog').showModal();load(record);
    }
    $('#show-board').addEventListener('click',()=>openBoard());$('#hud-board').addEventListener('click',()=>openBoard());
    $('#score-retry').addEventListener('click',()=>load(result));
    $('#score-form').addEventListener('submit',async event=>{
      event.preventDefault();if(!result)return;const current=ticket,record={...result,name:$('#pilot-name').value.trim()};$('#score-submit').disabled=true;$('#board-status').textContent='Saving your signal…';
      try{
        const data=await scores.save(record);if(current!==ticket)return;
        drawRows(data.scores);$('#score-form').hidden=true;$('#board-status').textContent=data.shared?(data.persistent?'SIGNAL RECEIVED · Saved locally and submitted to the shared archive.':'SIGNAL RECEIVED · Submitted to the shared archive. Browser storage is unavailable.'):data.persistent?'SIGNAL RECEIVED · Saved on this browser.':'SIGNAL RECEIVED · Kept for this session. Browser storage is unavailable.';
      }catch(error){if(current!==ticket)return;$('#board-status').textContent=error.message||'Could not save. Please retry.';$('#score-submit').disabled=false;}
    });
    function closeBoard(){const ended=!!result;$('#score-dialog').close();ticket++;if(ended){result=null;hooks.menu();}else if(resumeBoard && hooks.state()==='paused'){resumeBoard=false;hooks.pause();}}
    $('#board-close').addEventListener('click',closeBoard);$('#score-dialog').addEventListener('cancel',event=>{event.preventDefault();closeBoard();});
    function fullscreenLabel(){const active=!!document.fullscreenElement||document.body.classList.contains('expanded-game');$('#fullscreen').setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');$('#fullscreen').textContent=active?'⤡':'⛶';}
    async function fullscreen(){
      if(document.fullscreenElement){await document.exitFullscreen();}
      else if(document.body.classList.contains('expanded-game'))document.body.classList.remove('expanded-game');
      else{try{if(!$('.game-shell').requestFullscreen)throw Error();await $('.game-shell').requestFullscreen();}catch{document.body.classList.add('expanded-game');}}
      fullscreenLabel();
    }
    $('#fullscreen').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',fullscreenLabel);
    window.addEventListener('keydown',event=>{if(['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)||$('#score-dialog').open)return;if(event.key.toLowerCase()==='f' && !$('.game-shell').hidden){event.preventDefault();fullscreen();}if(event.key==='Escape' && document.body.classList.contains('expanded-game')){document.body.classList.remove('expanded-game');fullscreenLabel();}});
    function resultScreen(record){openBoard({...record,submission:globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`});}
    refreshDifficulties();return {menu,showGame,result:resultScreen,refreshDifficulties,cinema:(active,kind='ending')=>{$('#end-credits').textContent=kind==='gameover'?'View flight records ↗':'Continue to results ↗';$('#cinema-controls').hidden=!active;$('.game-shell').dataset.cinematic=String(active);},transition:(text,active)=>{$('#transmission').hidden=!active;$('#transmission-text').textContent=text;}};
  }
  globalThis.OrbitUI={create};
})();
