/* Local top ten, with an optional shared archive on the Python server. */
(() => {
  const KEY='asteorun-highscores';
  const modes=new Set(['veryeasy','easy','normal','hard','hardcore']);
  function valid(entry){
    return entry && typeof entry.name==='string' && [...entry.name.trim()].length>=1 && [...entry.name.trim()].length<=16 && !/[\p{C}\p{Zl}\p{Zp}]/u.test(entry.name) &&
      Number.isInteger(entry.score) && entry.score>=0 && entry.score<=100000000 &&
      Number.isInteger(entry.level) && entry.level>=1 && entry.level<=8 && modes.has(entry.difficulty) &&
      typeof entry.won==='boolean' && (!entry.won || entry.level===8) &&
      typeof entry.submission==='string' && /^[a-zA-Z0-9-]{1,80}$/.test(entry.submission) &&
      typeof entry.date==='string' && Number.isFinite(Date.parse(entry.date));
  }
  function top(entries){
    const unique=new Map();
    for(const entry of entries)if(valid(entry) && !unique.has(entry.submission))unique.set(entry.submission,entry);
    return [...unique.values()].sort((a,b)=>b.score-a.score || b.level-a.level || Number(b.won)-Number(a.won) || a.date.localeCompare(b.date)).slice(0,10);
  }
  function create(){
    let memory=[],shared=false,persistent=true;
    function local(){
      try{
        const saved=JSON.parse(localStorage.getItem(KEY)||'[]');
        memory=top([...memory,...(Array.isArray(saved)?saved:[])]);
      }catch{}
      return [...memory];
    }
    function snapshot(remote=[]){return {scores:top([...remote,...local()]),shared,persistent};}
    async function request(options={}){
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),1500);
      try{
        // Relative to the game folder, so a university subdirectory works too.
        const response=await fetch('api/scores',{...options,cache:'no-store',signal:controller.signal});
        if(!response.ok)throw Error('No shared archive');
        const data=await response.json();
        if(!Array.isArray(data.scores) || !data.scores.every(valid))throw Error('Invalid archive');
        return data.scores;
      }finally{clearTimeout(timer);}
    }
    async function load(){
      try{const scores=await request();shared=true;return snapshot(scores);}
      catch{shared=false;return snapshot();}
    }
    async function save(record){
      const entry={...record,name:record.name.trim(),date:new Date().toISOString()};
      if(!valid(entry))throw Error('Choose a printable pilot name of 1–16 characters.');
      memory=top([...local(),entry]);
      try{localStorage.setItem(KEY,JSON.stringify(memory));persistent=true;}catch{persistent=false;}
      // No POST on static hosts. A failed shared save still leaves the local copy.
      if(shared){
        try{
          const scores=await request({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record)});
          return snapshot(scores);
        }catch{shared=false;}
      }
      return snapshot();
    }
    return {local,load,save};
  }
  globalThis.OrbitScores={create};
})();
