/* One source of truth for lives, continues and score multipliers. */
(() => {
  const difficulties = {
    veryeasy:{name:'Very Easy',lives:7,maxLives:10,continues:10,multiplier:.5,description:'Find your wings. Start with seven hearts, collect up to ten, and take ten continues.'},
    easy:{name:'Easy',lives:5,maxLives:7,continues:5,multiplier:.75,description:'Room to breathe. Start with five hearts, collect up to seven, and take five continues.'},
    normal:{name:'Normal',lives:3,maxLives:5,continues:3,multiplier:1,description:'The original flight. Three hearts, three continues.'},
    hard:{name:'Hard',lives:2,maxLives:5,continues:2,multiplier:1.5,description:'Two hearts. Two continues. Bring the light home.'},
    hardcore:{name:'Hardcore',lives:1,maxLives:4,continues:1,multiplier:2.5,description:'One heart. One continue. Collect up to four hearts. No room for doubt.'}
  };
  let sessionUnlocked=false;
  const isUnlocked=id=>id!=='hardcore'||sessionUnlocked||(()=>{try{return localStorage.getItem('orbit-hardcore-unlocked')==='1';}catch{return false;}})();
  const unlockHardcore=()=>{sessionUnlocked=true;try{localStorage.setItem('orbit-hardcore-unlocked','1');}catch{}};
  globalThis.OrbitCampaign={introDuration:8,checkpointTimes:(level,duration)=>level===1?[]:level<=4?[duration*.56]:level<=7?[duration/3,duration*2/3]:[duration/4,duration/2,duration*3/4],difficulties,isUnlocked,unlockHardcore,points:(value,id)=>Math.round(value*difficulties[id].multiplier)};
})();
