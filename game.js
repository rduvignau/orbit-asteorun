(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const canvas = $('#game'), ctx = canvas.getContext('2d'), field = $('#playfield');
  const overlay = $('#overlay'), start = $('#start'), pauseButton = $('#pause'), fireButton = $('#fire');
  const keys = new Set();
  const terrain = globalThis.OrbitTerrain, weaponButton = $('#weapon');
  const START_LOADOUT = { level: 1, score: 0, lives: 3, weapons: ['pulse'], charge: {} };
  let checkpoint=null,checkpointIndex=0,deathAge=0;
  let difficulty='normal',ui=null,introAge=0,endingAge=0,pausedFrom='playing',resultSubmitted=false;
  let continues = 3, timeLenses = [], lastContinueDisplay = '';
  let entryState = { ...START_LOADOUT, weapons: [...START_LOADOUT.weapons], charge: { ...START_LOADOUT.charge } };
  let charge = { ...entryState.charge }, cellCounter = 0, frontIndex = 0, rearFront = null, wispIn = 7, formationIn = 4, formationSerial = 0;
  const shield = globalThis.OrbitDefense.createShield();
  let level = entryState.level, routeTime = 0, enemies = [], enemySpawnIn = 5, wave = 0;
  let miniDefeated = false, weaponDelivered = false, weapon = 'pulse';
  let ownedWeapons = new Set(entryState.weapons), supplyIndex = 0, needleIn = 9, hazards = [], destroyedProps = new Set(), propHp = new Map();
  const BOSS_AT = 56, BOSS_HP = 48;
  let width = 1000, height = 450, state = 'ready', elapsed = 0, score = entryState.score, best = 0, lives = entryState.lives;
  let asteroids = [], particles = [], bullets = [], walls = [], enemyShots = [], pickups = [], labels = [];
  let boss = null, spawnIn = 1, wallIn = 7, cooldown = 0, invulnerable = 0, pointer = null, firePointer = null;
  let lastTime = 0, accumulator = 0, stageIndex = -1, noticeUntil = 0, repairIndex = 0, shake = 0;
  const ship = { x: 120, y: 225, radius: 12 };
  const stars = Array.from({ length: 105 }, () => ({ x: Math.random(), y: Math.random(), size: Math.random() * 1.3 + .3, depth: Math.random() * .8 + .2 }));
  const levels = globalThis.OrbitLevels, arsenal = globalThis.OrbitArsenal;
  const music = globalThis.OrbitAudio.createMusic(updateMusicHud);
  const settings=()=>OrbitCampaign.difficulties[difficulty];
  const config = () => levels[level];
  const scrollSpeed = () => globalThis.OrbitScrollSpeed(level, routeTime);
  const usableWeapons = () => Object.keys(arsenal.weapons).filter(id => ownedWeapons.has(id) && (id === 'pulse' || charge[id] > 0));
  try { best = Math.max(Number(localStorage.getItem('orbit-best-score')) || 0, Number(localStorage.getItem('orbit-level1-best')) || 0); } catch {}
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function hud() {
    $('#score').textContent = String(score).padStart(5, '0');
    $('#best').textContent = String(Math.max(best, score)).padStart(5, '0');
    $('#lives').textContent = Array.from({ length: settings().maxLives }, (_, i) => i < lives ? '♥' : '♡').join(' ');
    $('#lives').setAttribute('aria-label', `${lives} of ${settings().maxLives} lives`);
    const continueDisplay=`${difficulty}:${continues}`;
    if(lastContinueDisplay!==continueDisplay){
      $('#continues').innerHTML=Array.from({length:settings().continues},(_,i)=>`<span class="reserve-ship ${i<continues?'':'spent'}" aria-hidden="true"><svg viewBox="0 0 24 18"><path d="M23 9 2 1 6 7 6 11 2 17Z"/><path class="cockpit" d="M17 9 8 6 9 9 8 12Z"/></svg></span>`).join('');
      $('#continues').setAttribute('aria-label',`${continues} continues remaining`);lastContinueDisplay=continueDisplay;
    }
    $('#time').textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`;
    $('#progress').style.width = `${state === 'won' ? 100 : Math.min(100, (level > 1 ? routeTime : elapsed) / config().duration * 100)}%`;
    $('#speed').textContent = `${boss ? 'HOLD' : scrollSpeed().toFixed(2) + '×'}`;
    $('#shield').hidden = level < 4 || state !== 'playing'; $('#shield').disabled = state !== 'playing' || !shield.unlocked || shield.energy < 100 || shield.active;
    $('#shield').dataset.ready = String(shield.unlocked && shield.energy >= 100);
    $('#shield-label').textContent = !shield.unlocked ? 'SOON' : shield.active ? 'ACTIVE' : Math.round(shield.energy) + '%';
    $('#shield').setAttribute('aria-label', !shield.unlocked ? 'Aegis shield installs at the start of level 4' : shield.active ? 'Aegis shield active' : `Aegis shield ${Math.round(shield.energy)} percent. Activate with E or Shift.`);
    $('#boss-hud').hidden = !boss || !['playing','paused'].includes(state);
    $('#announcement').style.top = boss ? '84px' : '';
    if (boss) {
      $('#boss-health').style.width = `${Math.max(0, boss.hp) / boss.maxHp * 100}%`;
      $('#boss-name').textContent = ({ iris: 'THE IRIS', harrow: 'THE HARROW', sentinel: 'THE SENTINEL', riveter: 'THE RIVETER', helios: 'HELIOS ENGINE', reaper: 'WAKE REAPER', regent: 'NULL REGENT', warden: 'ROOT WARDEN', sovereign: 'THORN SOVEREIGN', ferryman:'BROOD FERRYMAN',leviathan:'THE LEVIATHAN', secondhand:'SECOND HAND',curator:'PARALLAX CURATOR', cinders:'GATE OF CINDERS',dawn:'DAWN ENGINE' })[boss.kind];
      $('#boss-phase').textContent = bossPhaseText();
    }
  }
  function bossPhaseText() {
    switch (boss.kind) {
      case 'cinders':return 'FINAL GATE / EMBER VOLLEYS';
      case 'dawn':return boss.phase===1?`EMITTERS ${boss.parts.filter(p=>p.hp>0).length}/4 · BREAK THEM`:boss.phase===2?'CONTAINMENT FAILURE / WATCH THE BEAMS':'THE LAST HEART / BRING THE LIGHT HOME';
      case 'secondhand': return globalThis.OrbitObservatory.handState(boss,width,height).active?'HAND SWEEP / EVADE':'CLOCKWORK GUARDIAN / READ THE WEDGE';
      case 'curator': return boss.enraged?'SKY UNFOLDED / FOLLOW THE GOLDEN STARS':'TRUE CORE / THREE GOLDEN STARS';
      case 'ferryman': return boss.enraged?'ENRAGED / BROOD SWARM':'MIDPOINT / SWIMMING GUARDIAN';
      case 'leviathan': return boss.mode==='warning'?'BREACH WARNING / LEAVE THE MIDDLE':boss.mode==='breach'?'BREACH / EVADE':boss.enraged?'ENRAGED / THE DEEP AWAKENS':'HUNT / STRIKE THE HEAD';
      case 'warden': return 'ROOT SURGE / WATCH THE TUNNEL';
      case 'sovereign': return boss.parts.some(p=>p.hp>0) ? `BATTERIES ${boss.parts.filter(p=>p.hp>0).length} / 4 · EACH SILENCES A GUN` : 'HEART EXPOSED / LAST BLOOM';
      case 'regent': return boss.enraged ? 'ENRAGED / POLARITY REVERSAL' : 'TRACK THE MOVING HEART';
      case 'reaper': return boss.mode === 'lock' ? 'CHARGE LOCK / CHANGE LANE' : boss.mode === 'dash' ? 'RAMMING / EVADE' : 'MIDPOINT / WAKE HUNTER';
      case 'helios': return boss.enraged ? 'ENRAGED / DOUBLE VOLLEYS' : boss.coils.some(c => c.hp > 0) ? `POWER COILS ${boss.coils.filter(c => c.hp > 0).length} / 3 · BREAK THEM` : 'REACTOR EXPOSED / MELTDOWN';
      case 'riveter': return 'FOREMAN / RIVET VOLLEYS';
      case 'iris': return boss.open ? 'CORE EXPOSED / FIRE!' : boss.phase === 'beam' ? 'BEAM ACTIVE / EVADE' : boss.phase === 'charge' ? 'SCAN LOCKED / MOVE!' : 'SHIELD CLOSED';
      case 'harrow': return 'MIDPOINT GUARDIAN / MINE LAYER';
      default: return boss.hp <= BOSS_HP / 2 ? 'ENRAGED / PHASE 02' : 'GUARDIAN OF THE BELT';
    }
  }
  function updateMusicHud(status) {
    $('#music-label').textContent = status.available ? status.enabled ? 'MUSIC ON' : 'MUSIC OFF' : 'NO AUDIO';
    $('#music').setAttribute('aria-pressed', String(status.enabled));
    $('#music').setAttribute('aria-label', `${status.enabled ? 'Mute' : 'Enable'} music. ${status.name}`);
    $('#sfx').textContent=status.sfxEnabled?'SFX ON':'SFX OFF';$('#effects-volume').value=Math.round(status.effectsVolume*100);$('#effects-value').textContent=Math.round(status.effectsVolume*100)+'%';
    $('#sfx').setAttribute('aria-pressed', String(status.sfxEnabled)); $('#sfx').setAttribute('aria-label', status.sfxEnabled ? 'Mute combat sound effects' : 'Enable combat sound effects');
    $('#music').title = status.name; $('#volume').value = Math.round(status.volume * 100);
  }
  function weaponHud() {
    const available = usableWeapons();
    weaponButton.disabled = state !== 'playing' || available.length < 2;
    weaponButton.dataset.weapon = weapon;
    $('#weapon-name').textContent = arsenal.weapons[weapon].label;
    $('#weapon-hint').textContent = `${weapon === 'pulse' ? '∞' : Math.ceil(charge[weapon]) + '%'} · Q ⇄`;
    for (const id of Object.keys(arsenal.weapons)) {
      const owned = ownedWeapons.has(id), value = id === 'pulse' ? 100 : owned ? charge[id] || 0 : 0;
      $('#charge-' + id).style.width = value + '%'; $('#reserve-' + id).textContent = id === 'pulse' ? '1 PULSE · ∞' : `${Object.keys(arsenal.weapons).indexOf(id)+1} ${id.toUpperCase()} · ${owned ? Math.ceil(value) + '%' : 'LOST'}`;
      $('#loadout-' + id).dataset.active = String(weapon === id); $('#loadout-' + id).dataset.empty = String(!owned || value <= 0);
    }
    weaponButton.setAttribute('aria-label', `Weapon: ${arsenal.weapons[weapon].name}. ${available.length > 1 ? 'Switch weapon.' : 'Collect supply pods to unlock upgrades.'}`);
  }
  function swapWeapon(choice) {
    if (state !== 'playing') return;
    const available = usableWeapons();
    const next = choice || available[(available.indexOf(weapon) + 1) % available.length];
    if (!available.includes(next)) return;
    weapon = next; weaponHud(); canvas.focus({ preventScroll: true });
  }
  function announce(text, duration = 3.5) {
    $('#announcement').textContent = text; $('#announcement').classList.add('visible'); noticeUntil = elapsed + duration;
  }
  function resize() {
    const rect = field.getBoundingClientRect(), oldW = width, oldH = height;if(rect.width<1 || rect.height<1)return;
    width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const object of [ship, ...enemies, ...asteroids, ...bullets, ...enemyShots, ...pickups, ...particles, ...labels]) { object.x *= width / oldW; object.y *= height / oldH; if (object.baseY !== undefined) object.baseY *= height / oldH; }
    for(const group of formations)group.x*=width/oldW;
    for (const wall of walls) { wall.x *= width / oldW; wall.w *= width / oldW; wall.top *= height / oldH; wall.bottom *= height / oldH; }
    if (boss) { boss.x *= width / oldW; boss.y *= height / oldH; boss.radius = ['cinders','dawn'].includes(boss.kind)?OrbitFinale.radius(width,height,boss.kind):['secondhand','curator'].includes(boss.kind)?Math.min(boss.kind==='secondhand'?49:57,Math.max(35,width*.12)):['ferryman','leviathan'].includes(boss.kind)?globalThis.OrbitAbyss.bossPosition(boss.kind,boss.age,width,height).radius:['warden','sovereign'].includes(boss.kind)?Math.min(boss.kind==='warden'?50:66,Math.max(36,width*.13)):bossRadius(boss.kind); if (boss.beamYs) boss.beamYs = boss.beamYs.map(y => y * height / oldH); }
    ship.x = clamp(ship.x, 22, width - 22); ship.y = clamp(ship.y, 22, height - 22); pointer = null;
  }
  function clearInput() { keys.clear(); pointer = null; firePointer = null; }
  function launch(targetLevel = entryState.level, startingScore = entryState.score, loadout, runMode = 'new') {
    const equipment = loadout || (arguments.length === 0 ? entryState : { lives: settings().lives, weapons: ['pulse'] });
    if(runMode==='new'){continues=settings().continues;resultSubmitted=false;}
    if(runMode!=='continue'){checkpoint=null;checkpointIndex=0;}
    level = targetLevel; entryState = { symbiont:!!equipment.symbiont, level, score: startingScore, lives: clamp(equipment.lives || settings().lives, 1, settings().maxLives), weapons: [...(equipment.weapons || ['pulse'])], charge: Object.fromEntries(Object.keys(arsenal.weapons).filter(id=>id!=='pulse').map(id=>[id,equipment.charge?.[id] ?? 100])) };
    timeLenses=[];mothIn=4;choiceIndex=0;phoenixIn=5;
    charge = { ...entryState.charge }; cellCounter = 0; frontIndex = 0; rearFront = null; wispIn = 7; formationIn = 4; formationSerial = 0; shield.reset(level >= 5); globalThis.OrbitVerdant.setGrowth(0); terrainGrowth=0; formations=[];symbiont=!!entryState.symbiont;echoTime=0;echoCooldown=0;hatchIndex=0;drifterIn=5;
    ownedWeapons = new Set(['pulse', ...entryState.weapons.filter(id => arsenal.weapons[id])]);
    state = ui?'intro':'playing';introAge=0; elapsed = 0; routeTime = 0; score = startingScore; lives = entryState.lives; boss = null;
    enemies = []; enemySpawnIn = 5; wave = 0; miniDefeated = false; weaponDelivered = false; weapon = 'pulse'; supplyIndex = 0; needleIn = 9; hazards = []; destroyedProps = new Set(); propHp = new Map();
    asteroids = []; particles = []; bullets = []; walls = []; enemyShots = []; pickups = []; labels = [];
    spawnIn = 1; wallIn = 7; cooldown = 0; invulnerable = 1.5; stageIndex = -1; repairIndex = 0; shake = 0;
    clearInput(); ship.x = Math.max(58, width * .17); ship.y = height / 2;
    overlay.classList.add('hidden'); pauseButton.disabled = false; fireButton.disabled = false;
    pauseButton.textContent = 'Ⅱ'; pauseButton.setAttribute('aria-label', 'Pause game');
    $('.app').dataset.level = String(level);
    $('.mission strong').textContent = config().name;
    $('.mission > span:first-child').textContent = `MISSION 00${level} · ${settings().name.toUpperCase()} / ${settings().multiplier}×`;
    $('.mission > span:last-child').textContent = `LEVEL 0${level} / ${config().tag}`;
    $('.heading .eyebrow').textContent = config().eyebrow;
    $('.subtitle').textContent = config().subtitle;
    $('.sector').textContent = config().sector;
    
    const markers=OrbitCampaign.checkpointTimes(level,config().duration).map(time=>{const percent=time/config().duration*100;return `linear-gradient(90deg,transparent ${percent-.25}%,#f0d59b ${percent-.25}%,#f0d59b ${percent+.25}%,transparent ${percent+.25}%)`;});
    $('.progress-track').style.backgroundImage=markers.join(',');
    $('#stage').textContent = config().stages[0].title;
    $('#flight-status').textContent = `LEVEL 0${level} · ${lives} LIVES. MAX HULL ${settings().maxLives}.`;
    music.setPlaying(level, true);
    if(ui){ui.transition('',true);pauseButton.disabled=false;fireButton.disabled=true;}
    weaponHud();
    hud(); canvas.focus({ preventScroll: true });
  }
  function showOverlay(label, title, copy, button, hint) {
    $('#overlay-label').textContent = label; $('#overlay-title').innerHTML = title; $('#overlay-copy').textContent = copy;
    start.innerHTML = `${button} <span>↗</span>`; $('#start-hint').textContent = hint; overlay.classList.remove('hidden');
  }
  function pause() {
    if (!['playing','intro','paused'].includes(state)) return;
    if (state === 'playing' || state==='intro') {
      pausedFrom=state;state = 'paused';ui?.transition('',false); music.setPlaying(level, false);  clearInput(); fireButton.disabled = true; weaponHud();
      pauseButton.textContent = '▷'; pauseButton.setAttribute('aria-label', 'Resume game');
      $('#flight-status').textContent = 'FLIGHT PAUSED';
      showOverlay('TAKE A BREATHER', 'Holding position.', 'Your ship, weapons, score, and remaining lives are safe.', 'Keep flying', 'PRESS ENTER OR P TO RESUME'); hud();
    } else {
      state = pausedFrom; music.setPlaying(level, true);  overlay.classList.add('hidden'); fireButton.disabled = state!=='playing';
      pauseButton.textContent = 'Ⅱ'; pauseButton.setAttribute('aria-label', 'Pause game');
      weaponHud(); $('#flight-status').textContent = boss ? `BOSS CONTACT · ${boss.kind.toUpperCase()}` : `LEVEL 0${level} · FLIGHT IN PROGRESS`; hud(); canvas.focus({ preventScroll: true });
    }
  }
  function burst(x, y, color = '#ffac79', count = 18, sound = true) {
    if (sound && count <= 25) music.effect(count<=4?'impact':'explode');
    for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, speed = 35 + Math.random() * 160; particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .35 + Math.random() * .6, color }); }
  }
  function award(points, x, y) { points=OrbitCampaign.points(points,difficulty);music.effect('hit'); score += points; labels.push({ x, y, text: `+${points}`, life: .9, color: '#ffce9c' }); }
  function finish(won = false) {
    if (state !== 'playing') return;
    state = won ? 'won' : 'over'; music.setPlaying(level, false, true); clearInput(); pauseButton.disabled = true; fireButton.disabled = true;
    best = Math.max(best, score); try { localStorage.setItem('orbit-best-score', String(best)); } catch {}
    $('#announcement').classList.remove('visible');
    weaponHud(); $('#flight-status').textContent = won ? `LEVEL 0${level} COMPLETE · PASSAGE SECURED` : 'SIGNAL LOST · HULL DEPLETED';
    const victoryCopy = level === 7 ? `The Curator releases its last star. ${score.toLocaleString()} points, ${lives} hearts and ${continues} continues remain. Beyond the lens: the Dawn Engine. The Dawn Engine is waiting. The final passage is open.` : level === 6 ? `The Leviathan sleeps. ${score.toLocaleString()} points. ${lives} lives. Your little companion lights the path toward the broken observatory. The Parallax Observatory is open.` : level === 5 ? `The Sovereign is silent. ${score.toLocaleString()} points. ${lives} lives carried through the living dark. In your wake, a thousand little stars begin to bloom.` : level === 4 ? `The Regent falls. ${score.toLocaleString()} points. ${lives} lives through the storm. Beyond the Meridian, the stars are yours.` : level === 3 ? `Helios is offline. ${score.toLocaleString()} points. ${lives} lives brought home. You just gave a star its sunrise back.` : `${level === 2 ? 'The Iris is silent' : 'Sentinel destroyed'}. ${score.toLocaleString()} points. The next passage is open.`;
    if(won && level===8){if(difficulty==='hard'){OrbitCampaign.unlockHardcore();ui?.refreshDifficulties();}state='ending';endingAge=0;overlay.classList.add('hidden');ui?.cinema(true);music.setPlaying(9,true);hud();return;}
    if(won)showOverlay(`LEVEL 0${level} COMPLETE`,level===7?'You unfolded the sky.':level===6?'A light in the deep.':level===5?'Even thorns can bloom.':level===4?'The storm breaks.':level===3?'You outshone a sun.':level===2?'Light at the end.':'Beyond the belt.',victoryCopy,level<8?`Enter level ${level+1}`:'New expedition',level<8?`PRESS ENTER FOR LEVEL ${level+1}`:'THE LAST LIGHT IS YOURS');
    else showOverlay(continues>0?'SHIP DESTROYED':'EXPEDITION ENDED',continues>0?'Another ship.<br>Another chance.':'The last light fades.',continues>0?`${continues} ${continues===1?'continue':'continues'} remaining. ${checkpoint?`Resume checkpoint ${checkpointIndex} of level ${level}`:`Restart level ${entryState.level}`} at ${(checkpoint?.score ?? entryState.score).toLocaleString()} points with ${settings().lives} hearts and ${checkpoint?'its saved':'the level entry'} loadout.`:`${score.toLocaleString()} points. All continues spent. Begin a new expedition from level 1.`,continues>0?'Use a continue':'New expedition',continues>0?`PRESS ENTER · ${settings().lives} HEARTS / ${settings().name.toUpperCase()}`:'PRESS ENTER · RETURN TO TITLE');
    
    hud();if(!won && continues===0){state='gameover';deathAge=0;overlay.classList.add('hidden');ui?.cinema(true,'gameover');} 
  }
  function damage(source = 'collision') {
    if (state !== 'playing') return;
    if (shield.active) {
      music.effect('shield');
      if (source === 'projectile') {
        if (weapon !== 'pulse') { charge[weapon] = Math.min(100, charge[weapon] + 2); weaponHud(); }
        if (shield.parrying) bullets.push(...arsenal.volley('pulse', ship.x + 24, ship.y));
      }
      return;
    }
    if (invulnerable > 0 || state !== 'playing') return;
    const lost = weapon !== 'pulse' ? weapon : null;
    if (lost) { ownedWeapons.delete(lost); charge[lost] = 0; weapon = arsenal.best(ownedWeapons, charge); weaponHud(); }
    lives--;music.effect(lives===0?'destroy':'hurt');
    invulnerable = 1.8; shake = lives===0?.7:.3; burst(ship.x, ship.y, '#ff865e', lives===0?90:25, false);
    if (lives === 0) { finish(); return; }
    announce(`HULL HIT · ${lives} ${lives === 1 ? 'life' : 'lives'} left${lost ? ` · ${arsenal.weapons[lost].name} lost. ${arsenal.weapons[weapon].name} selected.` : ' · Shields recovering'}`, 2.5);
  }
  function makeAsteroid(x, y, radius, tier = 2, speed = 100, vy = 0) {
    return { x, y, radius, tier, speed, vy, angle: Math.random() * 6.28, spin: (Math.random() - .5) * 1.5, shape: Array.from({ length: 9 }, () => .8 + Math.random() * .2) };
  }
  function spawn() {
    const radius = (level === 1 && elapsed >= 34) ? 30 + Math.random() * 12 : 22 + Math.random() * 12;
    const speed = Math.min(160, width * .25) + elapsed * .5;
    const x = width + radius + 10;
    const p = caveBounds(x);
    asteroids.push(makeAsteroid(x, p.top + radius + Math.random() * Math.max(1, p.bottom - p.top - radius * 2), radius, 2, level > 1 ? Math.min(135, width * .24) * (level >= 3 ? 1.1 : 1) : speed));
  }
  function breakAsteroid(a) {
    a.dead = true; burst(a.x, a.y, a.tier === 2 ? '#d6b191' : '#91bfd0', a.tier === 2 ? 22 : 10);
    award(a.tier === 2 ? 100 : 40, a.x, a.y); if (a.tier === 2) dropCell(a.x, a.y);
    if (a.tier === 2) for (const direction of [-1, 1]) {
      asteroids.push(makeAsteroid(a.x + 5, clamp(a.y + direction * 14, 16, height - 16), a.radius * .43, 1, a.speed * 1.15, direction * (35 + Math.random() * 25)));
    }
  }
  function spawnWall() {
    const n = Math.floor((elapsed - 7) / 4), gap = height * (elapsed >= 34 ? .45 : .53);
    const center = height * [.42, .62, .38, .57][((n % 4) + 4) % 4];
    const top = clamp(center - gap / 2, 28, height - gap - 28);
    walls.push({ x: width + 20, w: clamp(width * .095, 46, 94), top, bottom: top + gap, speed: Math.min(135, width * .25) });
  }
  function fire() {
    if (state !== 'playing' || cooldown > 0) return;
    bullets.push(...arsenal.volley(weapon, ship.x + 23, ship.y));
    if(level>=6 && symbiont && echoTime>0 && echoCooldown<=0){const echo=echoPosition();bullets.push(...arsenal.volley('pulse',echo.x+23,echo.y));echoCooldown=.24;}
    cooldown = arsenal.weapons[weapon].cooldown; music.effect('shoot');
    if (weapon !== 'pulse') {
      const used = weapon; charge[used] = Math.max(0, charge[used] - arsenal.weapons[used].cost);
      if (charge[used] <= 0) { weapon = arsenal.best(ownedWeapons, charge); announce(`${arsenal.weapons[used].name.toUpperCase()} EXHAUSTED · ${arsenal.weapons[weapon].name} selected. Collect charge cells.`, 3); }
      weaponHud();
    }
  }
  function circleRect(x, y, r, rx, ry, rw, rh) {
    return Math.hypot(x - clamp(x, rx, rx + rw), y - clamp(y, ry, ry + rh)) < r;
  }
  function wallHit(x, y, r, w) {
    return circleRect(x, y, r, w.x, 0, w.w, w.top) || circleRect(x, y, r, w.x, w.bottom, w.w, height - w.bottom);
  }
  function bulletHitsCircle(b, x, y, r) { return arsenal.hitsCircle(b, x, y, r); }
  function startBoss() {
    boss = { kind: 'sentinel', maxHp: BOSS_HP, x: width + 90, y: height / 2, radius: Math.min(52, width * .12), hp: BOSS_HP, age: 0, shotIn: 2.5, flash: 0 };
    $('#flight-status').textContent = 'THE SENTINEL · AIM FOR THE CORE';
  }
  function updateBoss(dt) {
    if (!boss) return;
    if(level===8){updateFinalBoss(dt);return;}
    if(level===7){updateObservatoryBoss(dt);return;}
    if (level === 6) { updateAbyssBoss(dt); return; }
    if (level === 5) { updateVerdantBoss(dt); return; }
    if (level === 4) { updateMeridianBoss(dt); return; }
    if (level === 3) { updateFoundryBoss(dt); return; }
    if (level === 2) { updateCavernBoss(dt); return; }
    boss.age += dt; boss.flash = Math.max(0, boss.flash - dt);
    boss.x = Math.max(width * .81, boss.x - Math.min(140, width * .25) * dt);
    boss.y = height / 2 + Math.sin(boss.age * .9) * height * .23;
    boss.shotIn -= dt;
    if (boss.shotIn <= 0 && boss.x < width - boss.radius) {
      const aim = Math.atan2(ship.y - boss.y, ship.x - boss.x), phase2 = boss.hp <= BOSS_HP / 2;
      const speed = Math.min(230, width * .46);
      for (const offset of phase2 ? [-.35, -.175, 0, .175, .35] : [-.22, 0, .22]) enemyShots.push({ x: boss.x - boss.radius, y: boss.y, vx: Math.cos(aim + offset) * speed, vy: Math.sin(aim + offset) * speed, radius: 5 });
      boss.shotIn = phase2 ? 1.1 : 1.65;
    }
    for (const b of bullets) if (!b.dead && bulletHitsCircle(b, boss.x, boss.y, boss.radius * .8)) {
      b.dead = true; boss.hp--; boss.flash = .08; burst(b.x, b.y, '#8edfe0', 3);
      if (boss.hp === BOSS_HP / 2) announce('SENTINEL ENRAGED · Watch the wider volleys!', 2.5);
      if (boss.hp <= 0) {
        burst(boss.x, boss.y, '#ff865e', 90); award(2000 + lives * 250, boss.x, boss.y); shake = .7; finish(true); return;
      }
    }
    if (Math.hypot(ship.x - boss.x, ship.y - boss.y) < ship.radius + boss.radius) damage();
  }
  const beltTerrain = {
    bounds: (x,w,h) => ({top:Math.max(24,h*.065),bottom:h-Math.max(24,h*.065)}),
    hitsCircle(x,y,r,w,h) {const p=this.bounds(x,w,h);return y-r<=p.top || y+r>=p.bottom;},
    draw() {const p=this.bounds(0,width,height),tile=76,offset=(elapsed*90)%tile;
      for(const [y,h,edge] of [[0,p.top,p.top],[p.bottom,height-p.bottom,p.bottom]]){
        ctx.fillStyle='#293344';ctx.fillRect(0,y,width,h);ctx.strokeStyle='#8392a366';ctx.lineWidth=1;
        for(let x=-tile-offset;x<width;x+=tile){ctx.strokeRect(x,y,tile,h);ctx.fillStyle='#91a0b0';ctx.fillRect(x+7,y+h/2-1,3,3);ctx.fillRect(x+tile-10,y+h/2-1,3,3);}
        ctx.fillStyle='#d0a075';ctx.fillRect(0,edge-1,width,2);
      }
    }
  };
  const environment = () => level===8?OrbitFinale:level === 7 ? globalThis.OrbitObservatory : level === 6 ? globalThis.OrbitAbyss : level === 5 ? globalThis.OrbitVerdant : level === 1 ? beltTerrain : level === 4 ? globalThis.OrbitMeridian : level === 3 ? globalThis.OrbitFoundry : terrain;
  const caveBounds = x => environment().bounds(x, width, height, routeTime * 100, elapsed);
  const caveHit = (x, y, radius) => environment().hitsCircle(x, y, radius, width, height, routeTime * 100, elapsed);
  function bossRadius(kind) { return kind === 'regent' ? Math.min(64, Math.max(40, width * .13)) : kind === 'reaper' ? Math.min(48, Math.max(32, width * .1)) : kind === 'helios' ? Math.min(64, Math.max(40, width * .13)) : kind === 'riveter' ? Math.min(47, Math.max(32, width * .1)) : kind === 'iris' ? Math.min(66, Math.max(40, width * .13)) : kind === 'harrow' ? Math.min(45, Math.max(32, width * .1)) : Math.min(52, width * .12); }
  function deliverWeapon(id = 'twin') {
    if ((ownedWeapons.has(id) && charge[id] >= 95) || pickups.some(p => p.kind === 'weapon' && (p.weaponId || 'twin') === id)) return;
    pickups.push({ x: width + 22, y: height / 2, radius: 19, kind: 'weapon', weaponId: id, age: 0 });
    weaponDelivered = true;
    announce(`SUPPLY POD · Collect ${id === 'halo' ? 'the rose Ⅴ capsule for circular Halo fire' : id === 'compass' ? 'the lime Ⅳ capsule for forward, up and down lasers' : id === 'trident' ? 'the amber Ⅲ capsule for three-way Trident fire' : 'the violet Ⅱ capsule for twin lasers'}`, 5);
  }
  function unlockWeapon(id) {
    ownedWeapons.add(id); charge[id] = 100; weapon = id; weaponHud(); music.effect('pickup'); burst(ship.x, ship.y, arsenal.weapons[id].color, 32);
    announce(`${id === 'halo' ? 'HALO ONLINE · Full-circle fire' : id === 'compass' ? 'COMPASS ONLINE · Up, down and forward' : id === 'trident' ? 'TRIDENT ONLINE · Three-way fire' : 'TWIN LASERS ONLINE'} · Q or 1 / 2 / 3 / 4 / 5 to swap. Equipped upgrades are lost on a hit.`, 5);
  }
  function unlockTwin() { unlockWeapon('twin'); }
  function spawnEnemy(heavy = false, x = width + 30) {
    const p = caveBounds(x), lane = [.28, .72, .48, .36, .63][wave++ % 5];
    enemies.push({ x, y: p.top + (p.bottom - p.top) * lane, baseY: p.top + (p.bottom - p.top) * lane,
      radius: heavy ? 18 : 15, hp: heavy ? 3 : 2, heavy, speed: Math.min(145, width * .26) * (level >= 3 ? 1.1 : 1), age: 0,
      shotIn: 1.6, phase: wave * 1.7, flash: 0 });
  }
  function aimVolley(x, y, offsets = [0], speed = Math.min(210, width * .43)) {
    const angle = Math.atan2(ship.y - y, ship.x - x);
    for (const offset of offsets) enemyShots.push({ x, y, vx: Math.cos(angle + offset) * speed, vy: Math.sin(angle + offset) * speed, radius: 4.5 });
  }
  function startCavernBoss(kind) {
    const hp = kind === 'harrow' ? 28 : 60;
    boss = { kind, x: width + 80, y: height / 2, radius: bossRadius(kind), hp, maxHp: hp, age: 0,
      shotIn: 2.7, mineIn: 3.5, flash: 0, phase: 'enter', open: false, cycle: -1, beamYs: [] };
    $('#flight-status').textContent = kind === 'harrow' ? 'THE HARROW · MIDPOINT GUARDIAN' : 'THE IRIS · EVADE THE SCAN. STRIKE THE OPEN CORE.';
    announce(kind === 'harrow' ? 'THE HARROW · Weaving gunship. Shoot its drifting mines!' : 'THE IRIS · Shielded until it fires. Dodge, then counterattack.', 5);
  }
  function updateCavernBoss(dt) {
    if (!boss) return;
    boss.age += dt; boss.flash = Math.max(0, boss.flash - dt);
    boss.x = Math.max(width * .81, boss.x - Math.min(160, width * .3) * dt);
    if (boss.kind === 'harrow') {
      boss.y = height / 2 + Math.sin(boss.age * 1.3) * height * .21;
      boss.shotIn -= dt; boss.mineIn -= dt;
      if (boss.x < width - boss.radius && boss.shotIn <= 0) {
        aimVolley(boss.x - boss.radius, boss.y, [-.18, 0, .18]); boss.shotIn = 1.55;
      }
      if (boss.x < width - boss.radius && boss.mineIn <= 0) {
        enemyShots.push({ x: boss.x - boss.radius, y: boss.y, vx: -Math.min(75, width * .14), vy: 0, radius: 10, kind: 'mine', arm: .75, life: 9 }); boss.mineIn = 2.7;
      }
    } else {
      boss.y = height / 2 + Math.sin(boss.age * .45) * height * .055;
      const cycleTime = boss.age - 2.4;
      if (cycleTime >= 0) {
        const cycle = Math.floor(cycleTime / 7), time = cycleTime % 7;
        if (cycle !== boss.cycle) {
          boss.cycle = cycle; boss.released = false; boss.hintShown = false;
          const target = clamp(ship.y, height * .23, height * .77);
          boss.beamYs = boss.hp <= boss.maxHp / 2 ? [target, target < height / 2 ? target + height * .25 : target - height * .25] : [target];
        }
        boss.phase = time < 1.5 ? 'charge' : time < 2.35 ? 'beam' : time < 5.1 ? 'vent' : 'closed';
        boss.open = boss.phase === 'vent';
        if (boss.phase === 'beam') for (const y of boss.beamYs) {
          if (ship.x < boss.x && Math.abs(ship.y - y) < ship.radius + 9) damage();
        }
        if (boss.phase === 'closed' && !boss.released) {
          boss.released = true; spawnEnemy(boss.hp <= boss.maxHp / 2, boss.x - boss.radius - 12);
        }
      }
    }
    if (state !== 'playing') return;
    for (const b of bullets) if (!b.dead && bulletHitsCircle(b, boss.x, boss.y, boss.radius * .9)) {
      b.dead = true;
      if (boss.kind === 'iris' && !boss.open) {
        burst(b.x, b.y, '#bca0e5', 4);
        if (!boss.hintShown && boss.age > 3) { announce('SHIELD CLOSED · Evade the scan. Fire when the core glows teal.', 2.5); boss.hintShown = true; }
        continue;
      }
      boss.hp--; boss.flash = .08; burst(b.x, b.y, '#a9efe2', 4);
      if (boss.kind === 'iris' && boss.hp === 30) announce('IRIS OVERLOAD · Two marked lanes. Watch for the opening!', 4);
      if (boss.hp <= 0) {
        const defeated = boss;
        burst(defeated.x, defeated.y, defeated.kind === 'harrow' ? '#9de7d5' : '#c6a4ff', 80);
        shake = .5; enemyShots = [];
        if (defeated.kind === 'harrow') {
          award(1000, defeated.x, defeated.y); miniDefeated = true; boss = null;
          pickups.push({ x: defeated.x, y: height / 2, radius: 13, kind: 'repair' });
          announce('MIDPOINT SECURED · +1,000 points. Repair beacon released.', 4);
          $('#flight-status').textContent = 'CRYSTAL FAULT · THE WAY IS OPEN';
          if (!ownedWeapons.has('twin')) deliverWeapon();
        } else { award(3500 + lives * 300, defeated.x, defeated.y); finish(true); }
        return;
      }
    }
    if (boss && Math.hypot(ship.x - boss.x, ship.y - boss.y) < ship.radius + boss.radius) damage();
  }
  function dropCell(x, y) {
    if (level < 2) return;
    cellCounter++;
    if (cellCounter >= 5) { cellCounter -= 5; pickups.push({x,y,radius:11,kind:'charge'}); }
  }
  function refillCharge(amount) {
    let restored = false;
    for (const id of Object.keys(arsenal.weapons).filter(id=>id!=='pulse')) if (ownedWeapons.has(id)) { charge[id] = Math.min(100, (charge[id] || 0) + amount); restored = true; }
    if (!restored) award(75, ship.x, ship.y); else labels.push({x:ship.x,y:ship.y-25,text:`+${amount}% CHARGE`,life:1.2,color:'#b0e5ff'});
    weaponHud();
  }
  function activateShield() {
    if (state !== 'playing' || level < 4 || !shield.activate()) return false;
    if(level>=6 && symbiont){echoTime=7;announce('SYMBIOTIC ECHO · Your companion mirrors your fire for 7 seconds.',3);}
    music.effect('shield'); burst(ship.x,ship.y,'#9ddaff',16); canvas.focus({preventScroll:true}); hud(); return true;
  }
  function startFront(reach = .52) {
    if (rearFront) return;
    rearFront = {age:0,reach}; announce('TAIL FRONT INBOUND · Move RIGHT. Do not let it catch your stern.',3.5);
  }
  function updateFront(dt) {
    if (!rearFront) return;
    rearFront.age += dt;
    const front = globalThis.OrbitMeridian.frontState(rearFront,width);
    if (front.done) { rearFront = null; return; }
    if (front.active && ship.x - ship.radius < front.x) {
      damage(); ship.x = Math.min(width - 22, front.x + ship.radius + 8);
    }
  }
  function spawnWisp(x = width + 30) {
    const p = caveBounds(x), lane = wave++ % 2 ? .28 : .72;
    enemies.push({kind:'wisp',x,y:p.top+(p.bottom-p.top)*lane,radius:18,hp:3,age:0,flash:0,shotIn:2,speed:Math.min(105,width*.21),phase:wave*1.3});
  }
  function seeker(x,y,offset=0) {
    const a = Math.atan2(ship.y-y,ship.x-x)+offset,speed=Math.min(195,width*.4);
    enemyShots.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,radius:5,kind:'seeker',seek:1.15,life:9});
  }
  function updateWisp(enemy,dt) {
    enemy.age+=dt;enemy.x-=enemy.speed*dt;enemy.flash=Math.max(0,enemy.flash-dt);enemy.shotIn-=dt;
    const p=caveBounds(enemy.x),target=height*.5+Math.sin(enemy.age*1.5+enemy.phase)*height*.17;
    enemy.y=clamp(enemy.y+clamp(target-enemy.y,-60*dt,60*dt),p.top+26,p.bottom-26);
    if(enemy.x<width-20 && enemy.x>ship.x+35 && enemy.shotIn<=0){seeker(enemy.x-15,enemy.y,-.12);seeker(enemy.x-15,enemy.y,.12);enemy.shotIn=2.8;}
  }
  function fireCurtain(gapY, enraged) {
    const p=caveBounds(boss.x),gap=Math.max(48,height*.12),speed=Math.min(195,width*.36)*(enraged?1.2:1);
    for(let y=p.top+22;y<p.bottom-18;y+=24)if(Math.abs(y-gapY)>gap)enemyShots.push({x:boss.x-boss.radius*.55,y,vx:-speed,vy:0,radius:6,kind:'rivet',life:10});
  }
  function startMeridianBoss(kind) {
    const hp=kind==='reaper'?46:90;
    boss={kind,x:width+90,y:height/2,radius:bossRadius(kind),hp,maxHp:hp,age:0,flash:0,shotIn:2.5,frontIn:9,mode:'enter',cycle:-1,enraged:false,coreX:width+90,coreY:height/2,corePhase:0};
    $('#flight-status').textContent=kind==='reaper'?'WAKE REAPER · EVADE ITS CHARGE':'NULL REGENT · FOLLOW THE HEART. WATCH YOUR SIX.';
    announce(kind==='reaper'?'WAKE REAPER · It marks a lane, then rams. Move off the line.':'NULL REGENT · Aim at its moving heart. Aegis can return enemy fire.',5);
  }
  function updateMeridianBoss(dt) {
    boss.age+=dt;boss.flash=Math.max(0,boss.flash-dt);boss.shotIn-=dt;
    if(boss.kind==='reaper') {
      if(boss.age<2.3){boss.x=Math.max(width*.81,boss.x-Math.min(180,width*.35)*dt);boss.y=height/2;}
      else {
        const cycle=Math.floor((boss.age-2.3)/8.5),time=(boss.age-2.3)%8.5;
        if(cycle!==boss.cycle){boss.cycle=cycle;boss.targetY=clamp(ship.y,height*.24,height*.76);boss.shotIn=2;}
        if(time<1.25){boss.mode='lock';boss.x=width*.81;boss.y+=(boss.targetY-boss.y)*Math.min(1,dt*8);}
        else if(time<2.5){boss.mode='dash';boss.x=width*(.81-.58*(time-1.25)/1.25);boss.y=boss.targetY;}
        else if(time<4.1){boss.mode='recover';boss.x=width*(.23+.58*(time-2.5)/1.6);boss.y+=(height/2-boss.y)*dt*2;}
        else{boss.mode='volley';boss.x=width*.81;boss.y=height/2+Math.sin(boss.age)*height*.18;if(boss.shotIn<=0){aimVolley(boss.x-boss.radius,boss.y,[-.23,0,.23]);boss.shotIn=1.15;}}
      }
    } else {
      boss.x=Math.max(width*.82,boss.x-Math.min(175,width*.32)*dt);boss.y=height/2;
      boss.coreX=boss.x-boss.radius*.92+Math.sin(boss.age*.8)*boss.radius*.08;
      boss.corePhase+=dt*(boss.enraged?1.05:.72);boss.coreY=height/2+Math.sin(boss.corePhase)*height*.205;
      boss.frontIn-=dt;
      if(boss.frontIn<=0 && !rearFront){startFront(.43);boss.frontIn=boss.enraged?10:13;}
      if(boss.x<width-boss.radius && boss.shotIn<=0){
        for(const offset of boss.enraged?[-.4,-.2,0,.2,.4]:[-.25,0,.25])seeker(boss.coreX,boss.coreY,offset);
        boss.shotIn=boss.enraged?1.5:2.15;
      }
    }
    for(const b of bullets) if(!b.dead) {
      const x=boss.kind==='regent'?boss.coreX:boss.x,y=boss.kind==='regent'?boss.coreY:boss.y,r=boss.radius*(boss.kind==='regent'?.38:.9);
      if(bulletHitsCircle(b,x,y,Math.max(16,r))){b.dead=true;boss.hp--;boss.flash=.08;burst(b.x,b.y,'#bfe6ff',4);}
      else if(boss.kind==='regent' && b.x>boss.x+boss.radius*.3 && Math.abs(b.y-boss.y)<height*.28)b.dead=true;
      if(boss.kind==='regent' && !boss.enraged && boss.hp<=45){boss.enraged=true;announce('POLARITY REVERSAL · Faster seekers. More pressure from the wake.',4);}
      if(boss.hp<=0){
        const defeated=boss;burst(defeated.x,defeated.y,'#b4d8ff',110);enemyShots=[];enemies=[];rearFront=null;shake=.6;
        if(defeated.kind==='reaper'){award(2200,defeated.x,defeated.y);miniDefeated=true;boss=null;pickups.push({x:defeated.x,y:height/2,radius:12,kind:'repair'},{x:defeated.x-35,y:height/2,radius:11,kind:'charge'});deliverWeapon('trident');announce('WAKE CLEARED · +2,200 points. Fresh charge ahead.',4);$('#flight-status').textContent='INTO THE CURRENT · KEEP MOVING';}
        else{award(7000+lives*500,defeated.x,defeated.y);finish(true);}return;
      }
    }
    if(boss && Math.hypot(ship.x-boss.x,ship.y-boss.y)<ship.radius+boss.radius)damage();
  }
  let terrainGrowth = 0, formations = [];
  function spawnFormation(shape = formationSerial % 2 ? 'diamond' : 'vee') {
    const group={x:width+85,age:0,phase:formationSerial++,speed:Math.min(165,width*.31),shape};formations.push(group);
    group.unit=Math.min(1,width/650,height/470);group.y=height/2;
    for(const [ox,oy] of globalThis.OrbitVerdantCombat.formationOffsets(shape))enemies.push({kind:'choir',group,ox,oy,x:group.x+ox*group.unit,y:height/2+oy*group.unit,radius:12,hp:2,age:0,flash:0,shotIn:2.1+Math.abs(oy)*.035});
  }
  function updateFormations(dt) {
    for(const group of formations){
      group.age+=dt;group.x-=group.speed*dt;
      const unit=Math.min(1,width/650,height/470),offsets=globalThis.OrbitVerdantCombat.formationOffsets(group.shape);
      let top=0,bottom=height;
      for(const [ox,oy] of offsets){const p=caveBounds(group.x+ox*unit);top=Math.max(top,p.top+24-oy*unit);bottom=Math.min(bottom,p.bottom-24-oy*unit);}
      group.y=clamp(height*(.5+Math.sin(group.age*.85+group.phase)*.19),top,bottom);group.unit=unit;
    }
    formations=formations.filter(g=>enemies.some(e=>e.group===g && !e.dead));
  }
  function updateChoir(enemy,dt) {
    enemy.age+=dt;enemy.flash=Math.max(0,enemy.flash-dt);enemy.shotIn-=dt;
    enemy.x=enemy.group.x+enemy.ox*enemy.group.unit;enemy.y=enemy.group.y+enemy.oy*enemy.group.unit;
    if(enemy.shotIn<=0 && enemy.x<width-15 && enemy.x>ship.x+45){aimVolley(enemy.x-12,enemy.y,[0],Math.min(205,width*.42));enemy.shotIn=3.6;}
  }
  function startVerdantBoss(kind) {
    const parts=Array.from({length:4},()=>({hp:16,maxHp:16,flash:0,shotIn:2})),hp=kind==='warden'?58:108;
    boss={kind,x:width+100,y:height/2,radius:Math.min(kind==='warden'?50:66,Math.max(36,width*.13)),hp,maxHp:hp,age:0,flash:0,shotIn:2.6,flockIn:9,parts,coreHp:44,enraged:false};
    asteroids=[];enemies=[];formations=[];enemyShots=[];
    $('#flight-status').textContent=kind==='warden'?'ROOT WARDEN · THE TUNNEL IS ALIVE':'THORN SOVEREIGN · FOUR BATTERIES. ONE HEART.';
    announce(kind==='warden'?'ROOT WARDEN · Amber roots warn before the tunnel grows. Keep to the open side.':'THORN SOVEREIGN · Break four glowing batteries, then its heart. Compass can hit the hanging guns vertically.',6);
  }
  function updateVerdantBoss(dt) {
    boss.age+=dt;boss.flash=Math.max(0,boss.flash-dt);boss.shotIn-=dt;
    boss.x=Math.max(width*.84,boss.x-Math.min(180,width*.35)*dt);boss.y=height/2;
    if(boss.kind==='warden'){
      const root=globalThis.OrbitVerdantCombat.rootState(boss.age);terrainGrowth=root.growth;globalThis.OrbitVerdant.setGrowth(terrainGrowth,root.warning);
      const passage=caveBounds(boss.x);boss.y=(passage.top+passage.bottom)/2+Math.sin(boss.age*.7)*height*.08;
      if(boss.x<width-boss.radius && boss.shotIn<=0){aimVolley(boss.x-boss.radius,boss.y,[-.32,-.1,.1,.32]);boss.shotIn=boss.hp<29?1.3:1.8;}
      boss.flockIn-=dt;if(boss.flockIn<=0){spawnFormation('diamond');boss.flockIn=12;}
      for(const b of bullets)if(!b.dead && bulletHitsCircle(b,boss.x,boss.y,boss.radius)){b.dead=true;boss.hp--;boss.flash=.09;burst(b.x,b.y,'#c8ef9e',4);}
    }else{
      const live=boss.parts.filter(p=>p.hp>0).length;boss.enraged=live<=2;
      for(const p of globalThis.OrbitVerdantCombat.components(boss,width,height)){
        const part=boss.parts[p.index];part.flash=Math.max(0,part.flash-dt);if(part.hp<=0)continue;part.shotIn-=dt;
        if(p.x<width-20 && part.shotIn<=0){
          if(p.index<2)seeker(p.x,p.y,0);else aimVolley(p.x-p.radius,p.y,boss.enraged?[-.18,0,.18]:[-.12,.12],Math.min(235,width*.46));
          part.shotIn=(boss.enraged?2.2:3.1)+p.index*.18;
        }
        for(const b of bullets)if(!b.dead && part.hp>0 && bulletHitsCircle(b,p.x,p.y,p.radius+2)){
          b.dead=true;part.hp--;part.flash=.1;burst(b.x,b.y,'#d9f5a5',4);
          if(part.hp===0){burst(p.x,p.y,'#c9f894',38);award(500,p.x,p.y);pickups.push({x:p.x,y:p.y,radius:11,kind:'charge'});announce(`${boss.parts.filter(p=>p.hp>0).length} BATTERIES LEFT · Gun silenced. Charge cell released.`,2);}
        }
        if(part.hp>0 && Math.hypot(ship.x-p.x,ship.y-p.y)<ship.radius+p.radius)damage();
      }
      const exposed=boss.parts.every(p=>p.hp<=0),coreX=boss.x-boss.radius*.35;
      if(exposed && boss.shotIn<=0 && boss.x<width-boss.radius){
        // Aimed spreads leave wide escape routes between volleys.
        aimVolley(coreX,boss.y,[-.48,-.24,0,.24,.48],Math.min(220,width*.44));boss.shotIn=.95;
      }
      for(const b of bullets)if(!b.dead && bulletHitsCircle(b,coreX,boss.y,boss.radius*.44)){
        b.dead=true;if(exposed){boss.coreHp--;boss.flash=.08;burst(b.x,b.y,'#edb5ff',4);}else burst(b.x,b.y,'#91b995',3);
      }
      boss.hp=Math.max(0,boss.coreHp)+boss.parts.reduce((n,p)=>n+Math.max(0,p.hp),0);
    }
    if(boss.hp<=0){
      const defeated=boss;burst(defeated.x,defeated.y,'#d9ffa4',120);enemyShots=[];enemies=[];formations=[];shake=.6;
      if(defeated.kind==='warden'){award(2800,defeated.x,defeated.y);miniDefeated=true;boss=null;pickups.push({x:width*.7,y:height/2,radius:12,kind:'repair'});deliverWeapon('compass');announce('ROOT WARDEN UPROOTED · The tunnel relaxes. Fresh Compass supply ahead.',5);}
      else{award(11000+lives*600,defeated.x,defeated.y);finish(true);}return;
    }
    if(Math.hypot(ship.x-boss.x,ship.y-boss.y)<ship.radius+boss.radius*.85)damage();
  }
  let symbiont = false, echoTime = 0, echoCooldown = 0, hatchIndex = 0, drifterIn = 5;
  const echoPosition = () => {const p=caveBounds(ship.x);return {x:ship.x,y:clamp(p.top+p.bottom-ship.y,p.top+20,p.bottom-20)};};
  function hatchCompanion() {
    if(symbiont || pickups.some(p=>p.kind==='symbiote'))return;
    pickups.push({x:width+20,y:height*.5,radius:14,kind:'symbiote'});
    announce('UNIDENTIFIED SIGNAL · Collect the blue-gold larva. It seems afraid of the hive.',5);
  }
  function rescueCompanion() {
    symbiont=true;echoTime=12;music.effect('pickup');
    announce('SYMBIOSIS · You found a friend! It mirrors your fire. Aegis wakes it for 7 seconds.',6);
  }
  function updateAbyss(dt) {
    if(!boss && routeTime<184){
      drifterIn-=dt;if(drifterIn<=0){spawnDrifter();drifterIn=routeTime<96?4.3:3.1;}
      formationIn-=dt;if(formationIn<=0){spawnFormation();formationIn=routeTime<96?7:5.2;}
      const hatches=[30,65,112,156];if(hatchIndex<hatches.length && routeTime>=hatches[hatchIndex]){hatchCompanion();hatchIndex++;}
    }
    for(const vent of globalThis.OrbitAbyss.vents(width,height,routeTime*100,elapsed)){
      if(globalThis.OrbitAbyss.ventHit(ship.x,ship.y,ship.radius,vent)){damage();ship.y+=vent.side*85*dt;ship.x-=35*dt;}
    }
  }
  function spawnDrifter(fromLeft = wave++ % 2 === 0) {
    const x=fromLeft?-18:width+20,p=caveBounds(x),lane=wave%3===0?.3:.65;
    enemies.push({kind:'drifter',x,y:p.top+(p.bottom-p.top)*lane,baseY:p.top+(p.bottom-p.top)*lane,radius:17,hp:3,age:0,flash:0,shotIn:2.2,speed:Math.min(120,width*.25)*(fromLeft?1:-1)});
  }
  function updateDrifter(enemy,dt) {
    enemy.age+=dt;enemy.x+=enemy.speed*dt;enemy.flash=Math.max(0,enemy.flash-dt);enemy.shotIn-=dt;
    const p=caveBounds(enemy.x);enemy.y=clamp(enemy.baseY+Math.sin(enemy.age*1.7)*height*.13,p.top+24,p.bottom-30);
    if(enemy.x>25 && enemy.x<width-25 && enemy.shotIn<=0){aimVolley(enemy.x,enemy.y,[-.14,.14],Math.min(200,width*.4));enemy.shotIn=2.9;}
    if(enemy.speed>0 && enemy.x>width+35)enemy.dead=true;
  }
  function startAbyssBoss(kind) {
    const hp=kind==='ferryman'?68:132,p=globalThis.OrbitAbyss.bossPosition(kind,0,width,height);
    boss={kind,...p,hp,maxHp:hp,age:0,flash:0,shotIn:3,spawnIn:6,enraged:false,cycle:-1};
    enemies=[];formations=[];asteroids=[];enemyShots=[];
    announce(kind==='ferryman'?'BROOD FERRYMAN · Swimming volleys. Keep clear of its turn.':'THE LEVIATHAN · Watch the amber breach line. Its head is vulnerable throughout.',6);
    $('#flight-status').textContent=kind==='ferryman'?'BROOD FERRYMAN · GUARDIAN OF THE NURSERY':'LEVIATHAN · THE DEEP HAS OPENED ITS EYES';
  }
  function updateAbyssBoss(dt) {
    boss.age+=dt;boss.flash=Math.max(0,boss.flash-dt);boss.shotIn-=dt;boss.spawnIn-=dt;
    Object.assign(boss,globalThis.OrbitAbyss.bossPosition(boss.kind,boss.age,width,height));
    boss.enraged=boss.hp<=boss.maxHp*.5;
    if(boss.kind==='leviathan' && boss.mode==='warning')boss.shotIn=Math.max(.2,boss.shotIn);
    else if(boss.age>3 && boss.shotIn<=0){
      aimVolley(boss.x-boss.radius*.5,boss.y,boss.enraged?[-.42,-.21,0,.21,.42]:[-.27,0,.27],Math.min(230,width*.45));
      boss.shotIn=boss.kind==='ferryman'?boss.enraged?1.15:1.6:boss.enraged?.85:1.3;
    }
    if(boss.age>3 && boss.spawnIn<=0){spawnDrifter(true);if(boss.enraged)spawnDrifter(false);boss.spawnIn=boss.kind==='ferryman'?9:7;}
    for(const b of bullets)if(!b.dead && bulletHitsCircle(b,boss.x-boss.radius*.15,boss.y,boss.radius*.85)){
      b.dead=true;boss.hp--;boss.flash=.09;burst(b.x,b.y,'#baffde',4);
    }
    if(boss.hp<=0){
      const defeated=boss;burst(defeated.x,defeated.y,'#ffd6ab',130);enemyShots=[];enemies=[];formations=[];shake=.65;
      if(defeated.kind==='ferryman'){
        award(3400,defeated.x,defeated.y);miniDefeated=true;boss=null;pickups.push({x:width*.65,y:height*.5,radius:12,kind:'repair'});deliverWeapon('halo');hatchCompanion();
        announce('FERRYMAN RELEASED · A quiet current leads deeper. Fresh Halo and repair ahead.',5);
      }else{award(14000+lives*700,defeated.x,defeated.y);finish(true);}return;
    }
    if(Math.hypot(ship.x-boss.x,ship.y-boss.y)<ship.radius+boss.radius*.85 || globalThis.OrbitAbyss.segments(boss).some(part=>Math.hypot(ship.x-part.x,ship.y-part.y)<ship.radius+part.radius))damage();
  }
  function drawCompanion() {
    if(!symbiont)return;const active=echoTime>0,p=active?echoPosition():{x:ship.x-28,y:ship.y+Math.sin(elapsed*3)*12};
    ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=active?'#a9fff0':'#ffd4a0';ctx.fillStyle=active?'#a9fff033':'#b9fce988';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(0,0,active?18:7,active?10:5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(level===7 && boss?.kind==='curator'){ctx.save();ctx.strokeStyle='#ffe1a04a';ctx.setLineDash([3,8]);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(boss.coreX-p.x,boss.coreY-p.y);ctx.stroke();ctx.restore();}
    if(active){ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-8,-7);ctx.lineTo(-3,0);ctx.lineTo(-8,7);ctx.closePath();ctx.stroke();ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillStyle='#c7fff0';ctx.fillText('ECHO '+Math.ceil(echoTime)+'s',0,-18);}
    else{ctx.fillStyle='#ffd4a0';ctx.beginPath();ctx.arc(3,-1,2,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  let mothIn=4, choiceIndex=0;
  const localTime = (x,y) => level===7?globalThis.OrbitObservatory.timeFactor(x,y,timeLenses):1;
  function spawnMoth(x=width+25) {
    const p=caveBounds(x),lane=wave++%2?.3:.7;
    enemies.push({kind:'moth',x,y:p.top+(p.bottom-p.top)*lane,baseY:p.top+(p.bottom-p.top)*lane,radius:16,hp:3,age:0,flash:0,shotIn:2.5,phase:wave,speed:Math.min(145,width*.29)});
  }
  function updateMoth(e,dt) {
    e.age+=dt;e.x-=e.speed*dt;e.flash=Math.max(0,e.flash-dt);e.shotIn-=dt;
    const p=caveBounds(e.x);e.y=clamp(e.baseY+Math.sin(e.age*1.6+e.phase)*height*.14,p.top+28,p.bottom-28);
    if(e.shotIn<=0 && e.x>20 && e.x<width-20){aimVolley(e.x,e.y,[-.25,0,.25],Math.min(225,width*.44));e.shotIn=2.4;}
  }
  function updateObservatory(dt) {
    if(!boss && routeTime<202){
      mothIn-=dt;if(mothIn<=0){spawnMoth();mothIn=routeTime<105?4.3:3.2;}
      formationIn-=dt;if(formationIn<=0){spawnFormation();formationIn=routeTime<105?6.6:4.8;}
      const choices=[13,33,57,76,124,145,167,183];
      if(choiceIndex<choices.length && routeTime>=choices[choiceIndex]){
        const x=width+15,p=caveBounds(x),span=p.bottom-p.top;
        pickups.push({x,y:p.top+span*.24,radius:11,kind:'charge'},{x,y:p.top+span*.76,radius:12,kind:'repair'});choiceIndex++;
        if(choiceIndex===1)announce('CHOOSE YOUR ORBIT · Upper path: charge. Lower path: repair. Both paths are safe.',5);
      }
      if(!symbiont && hatchIndex===0 && routeTime>18){hatchCompanion();hatchIndex++;}
      if(!symbiont && hatchIndex===1 && routeTime>125){hatchCompanion();hatchIndex++;}
    }
    // Solid orreries divide the gallery. Contact pushes the ship out of the disk.
    for(const p of hazards)if(p.kind==='orrery'){
      const dx=ship.x-p.x,dy=ship.y-p.y,d=Math.hypot(dx,dy),limit=ship.radius+p.radius;
      if(d<limit){const a=Math.atan2(dy||-1,dx);ship.x=p.x+Math.cos(a)*(limit+2);ship.y=p.y+Math.sin(a)*(limit+2);}
    }
  }
  function startObservatoryBoss(kind) {
    const hp=kind==='secondhand'?80:156;
    boss={kind,x:width+90,y:height/2,radius:Math.min(kind==='secondhand'?49:57,Math.max(35,width*.12)),hp,maxHp:hp,age:0,corePhase:0,flash:0,shotIn:3,mothIn:9,cycle:-1,lockAngle:Math.PI,enraged:false};
    asteroids=[];enemies=[];formations=[];enemyShots=[];
    announce(kind==='secondhand'?'SECOND HAND · Dashed lines mark the sweep. Move outside the marked wedge.':'PARALLAX CURATOR · Three golden stars mark the TRUE CORE. Violet echoes cannot hurt you.',6);
    $('#flight-status').textContent=kind==='secondhand'?'SECOND HAND · WATCH THE SWEEP':'PARALLAX CURATOR · FOLLOW THE GOLDEN STARS';
  }
  function updateObservatoryBoss(dt) {
    boss.age+=dt;boss.flash=Math.max(0,boss.flash-dt);boss.shotIn-=dt;boss.mothIn-=dt;
    boss.x=Math.max(width*(boss.kind==='curator'?.74:.8),boss.x-Math.min(180,width*.35)*dt);boss.y=height*.5;
    if(boss.kind==='secondhand'){
      const cycle=Math.floor(boss.age/8);
      if(cycle!==boss.cycle){boss.cycle=cycle;boss.lockAngle=Math.atan2(ship.y-boss.y,ship.x-boss.x);}
      const hand=globalThis.OrbitObservatory.handState(boss,width,height);
      if(boss.age>2.5 && globalThis.OrbitObservatory.beamHit(ship.x,ship.y,ship.radius,boss,hand))damage('beam');
      if(boss.shotIn<=0 && !hand.active && boss.x<width-boss.radius){aimVolley(boss.x-boss.radius,boss.y,[-.3,0,.3]);boss.shotIn=boss.enraged?1.25:1.8;}
    }else{
      boss.corePhase+=dt*(boss.enraged?.9:.57);
      const core=globalThis.OrbitObservatory.copies(boss,width,height)[0];boss.coreX=core.x;boss.coreY=core.y;
      if(boss.shotIn<=0 && boss.x<width-boss.radius){aimVolley(core.x-boss.radius*.6,core.y,boss.enraged?[-.48,-.24,0,.24,.48]:[-.3,0,.3],Math.min(245,width*.47));boss.shotIn=boss.enraged?.9:1.3;}
    }
    if(boss.age>3 && boss.mothIn<=0){spawnMoth();boss.mothIn=boss.enraged?7:10;}
    const target=boss.kind==='curator'?{x:boss.coreX,y:boss.coreY}:boss;
    for(const b of bullets)if(!b.dead && bulletHitsCircle(b,target.x,target.y,boss.radius*.68)){
      b.dead=true;boss.hp--;boss.flash=.08;burst(b.x,b.y,'#ffe0aa',4);
    }
    if(!boss.enraged && boss.hp<=boss.maxHp/2){boss.enraged=true;announce(boss.kind==='curator'?'THE SKY UNFOLDS · Follow the golden stars. Echoes remain harmless.':'SECOND HAND ACCELERATING · Keep clear of the sweep.',4);burst(boss.x,boss.y,'#d9c4ff',55);}
    if(boss.hp<=0){
      const defeated=boss;burst(defeated.x,target.y,'#ffe3a1',140);enemyShots=[];enemies=[];formations=[];shake=.65;
      if(defeated.kind==='secondhand'){award(4200,defeated.x,defeated.y);miniDefeated=true;boss=null;pickups.push({x:width*.67,y:height*.5,radius:12,kind:'repair'},{x:width*.62,y:height*.5,radius:11,kind:'charge'});deliverWeapon('halo');announce('THE CLOCK LETS GO · The observatory unfolds. A final signature is watching.',5);}
      else{award(17500+lives*800,defeated.x,target.y);finish(true);}return;
    }
    if(Math.hypot(ship.x-target.x,ship.y-target.y)<ship.radius+boss.radius*.68)damage();
  }
  let phoenixIn=5;
  function startFinalBoss(kind){
    const hp=kind==='cinders'?96:200;
    boss={kind,x:width+180,y:height/2,radius:OrbitFinale.radius(width,height,kind),hp,maxHp:hp,age:0,phaseAge:0,phase:1,flash:0,shotIn:3,spawnIn:9,cycle:-1,beamMode:'idle',beamYs:[],coreHp:64,parts:Array.from({length:4},()=>({hp:18,flash:0,shotIn:2.5}))};
    asteroids=[];enemies=[];formations=[];enemyShots=[];
    if(kind==='dawn' && !symbiont){symbiont=true;echoTime=12;announce('A LIGHT RETURNS · A little companion finds you at the edge of the star.',5);}
    else announce(kind==='cinders'?'GATE OF CINDERS · Break the gate. Keep clear of its ember volleys.':'DAWN ENGINE · Four emitters. One collapsing star. Bring the light home.',6);
    $('#flight-status').textContent=kind==='cinders'?'GATE OF CINDERS':'THE DAWN ENGINE / LAST LIGHT';
  }
  function updateFinalBoss(dt){
    boss.age+=dt;boss.phaseAge+=dt;boss.flash=Math.max(0,boss.flash-dt);boss.shotIn-=dt;boss.spawnIn-=dt;
    boss.x=Math.max(width*(boss.kind==='dawn'?.81:.8),boss.x-Math.min(190,width*.37)*dt);boss.y=height/2;
    if(boss.kind==='cinders'){
      boss.y=height*.5+Math.sin(boss.age*.65)*height*.19;
      if(boss.x<width-boss.radius && boss.shotIn<=0){aimVolley(boss.x-boss.radius,boss.y,[-.4,-.2,0,.2,.4],Math.min(235,width*.45));boss.shotIn=boss.hp<48?1.15:1.7;}
      for(const b of bullets)if(!b.dead && bulletHitsCircle(b,boss.x,boss.y,boss.radius*.85)){b.dead=true;boss.hp--;boss.flash=.08;burst(b.x,b.y,'#ffdf9b',4);}
    }else{
      boss.coreX=boss.x-boss.radius*.58;boss.coreY=height*.5+(boss.phase===3?Math.sin(boss.phaseAge*.7)*height*.12:0);
      if(boss.phase===1){
        for(const p of OrbitFinale.components(boss)){
          const part=boss.parts[p.index];part.flash=Math.max(0,part.flash-dt);if(part.hp<=0)continue;part.shotIn-=dt;
          if(p.x<width-15 && part.shotIn<=0){aimVolley(p.x-p.radius,p.y,p.index<2?[-.16,.16]:[0],Math.min(225,width*.44));part.shotIn=2.4+p.index*.22;}
          for(const b of bullets)if(!b.dead && part.hp>0 && bulletHitsCircle(b,p.x,p.y,p.radius+3)){b.dead=true;part.hp--;part.flash=.1;burst(b.x,b.y,'#ffe5ac',4);if(part.hp===0){award(800,p.x,p.y);burst(p.x,p.y,'#ffdc9d',40);pickups.push({x:p.x,y:p.y,radius:11,kind:'charge'});}}
          if(part.hp>0 && Math.hypot(ship.x-p.x,ship.y-p.y)<ship.radius+p.radius)damage();
        }
        if(boss.parts.every(p=>p.hp<=0)){boss.phase=2;boss.phaseAge=0;boss.cycle=-1;boss.shotIn=2;enemyShots=[];announce('CONTAINMENT FAILURE · Emitters silenced. Leave the amber beam lanes.',5);}
      }else if(boss.phaseAge>2){
        if(boss.phase===2){
          const cycle=Math.floor((boss.phaseAge-2)/7.5),phase=(boss.phaseAge-2)%7.5;
          if(cycle!==boss.cycle){boss.cycle=cycle;boss.beamYs=[clamp(ship.y,height*.18,height*.82),clamp(height-ship.y,height*.18,height*.82)];}
          boss.beamMode=phase<1.7?'warning':phase<2.4?'active':'idle';
          if(boss.beamMode==='active' && ship.x<boss.x-boss.radius*.5 && boss.beamYs.some(y=>Math.abs(ship.y-y)<ship.radius+5))damage('beam');
        }else boss.beamMode='idle';
        if(boss.shotIn<=0){aimVolley(boss.coreX,boss.coreY,boss.phase===3?[-.5,-.25,0,.25,.5]:[-.3,0,.3],Math.min(240,width*.47));boss.shotIn=boss.phase===3?.85:1.35;}
      }
      for(const b of bullets)if(!b.dead && bulletHitsCircle(b,boss.coreX,boss.coreY,boss.radius*(boss.phase===3?.33:.26))){
        b.dead=true;if(boss.phase>1){boss.coreHp--;boss.flash=.08;burst(b.x,b.y,'#fff1bd',4);}else burst(b.x,b.y,'#b29c75',3);
      }
      if(boss.phase===2 && boss.coreHp<=0){boss.phase=3;boss.phaseAge=0;boss.coreHp=64;boss.beamMode='idle';enemyShots=[];echoTime=12;pickups.push({x:width*.54,y:height*.5,radius:12,kind:'repair'});announce('THE LAST HEART · Your companion holds the escape light. Finish this.',5);burst(boss.coreX,boss.coreY,'#fff2bd',65);}
      boss.hp=boss.parts.reduce((n,p)=>n+Math.max(0,p.hp),0)+(boss.phase===1?128:boss.phase===2?64+Math.max(0,boss.coreHp):Math.max(0,boss.coreHp));
    }
    if(boss.age>4 && boss.spawnIn<=0){spawnMoth();boss.spawnIn=boss.kind==='cinders'?10:boss.phase===3?7:11;}
    if(boss.hp<=0){
      const defeated=boss;burst(defeated.x,defeated.y,'#fff0bd',180);enemyShots=[];enemies=[];formations=[];shake=.8;
      if(defeated.kind==='cinders'){award(5200,defeated.x,defeated.y);miniDefeated=true;boss=null;pickups.push({x:width*.65,y:height*.5,radius:12,kind:'repair'});deliverWeapon('halo');announce('THE GATE OPENS · Beyond it, the star is waiting.',5);}
      else{award(25000+lives*1000+continues*1500,defeated.x,defeated.y);finish(true);}return;
    }
    const x=boss.kind==='dawn'?boss.coreX:boss.x,y=boss.kind==='dawn'?boss.coreY:boss.y,r=boss.kind==='dawn'?boss.radius*.3:boss.radius*.85;
    if(Math.hypot(ship.x-x,ship.y-y)<ship.radius+r)damage();
    // The armoured body occupies the right side; the luminous core and all emitters remain reachable from the left.
    if(boss.kind==='dawn' && circleRect(ship.x,ship.y,ship.radius,boss.x-boss.radius*.2,boss.y-boss.radius,boss.radius,boss.radius*2))damage();
  }
  function updateFinale(dt){
    if(!boss && routeTime<224){phoenixIn-=dt;if(phoenixIn<=0){spawnMoth();spawnDrifter();phoenixIn=routeTime<116?5.5:4.1;}formationIn-=dt;if(formationIn<=0){spawnFormation();formationIn=routeTime<116?7:5.3;}}
    const current=OrbitFinale.current(elapsed);
    if(current.active && (!boss || boss.kind==='cinders' || boss.phase===2))ship.x+=current.direction*42*dt;
  }
  function startRouteBoss(kind) {
    if(level===8)startFinalBoss(kind);else if(level===7)startObservatoryBoss(kind);else if(level===6)startAbyssBoss(kind);else if (level === 5) startVerdantBoss(kind); else if (level === 4) startMeridianBoss(kind); else if (level === 2) startCavernBoss(kind); else startFoundryBoss(kind);
  }
  function spawnNeedle(x = width + 30) {
    const p = caveBounds(x), lane = wave++ % 2 ? .3 : .7;
    enemies.push({kind:'needle',x,y:p.top+(p.bottom-p.top)*lane,radius:13,hp:1,heavy:false,age:0,flash:0,mode:'approach',windup:.75,speed:Math.min(145,width*.27)});
  }
  function updateNeedle(enemy, dt) {
    enemy.age += dt; enemy.flash = Math.max(0, enemy.flash - dt);
    if (enemy.mode === 'approach') {
      enemy.x -= enemy.speed * dt;
      const p = caveBounds(enemy.x); enemy.y = clamp(enemy.y,p.top+22,p.bottom-22);
      if(enemy.x < width*.83) {enemy.mode='lock';enemy.targetX=Math.min(ship.x,enemy.x-80);enemy.targetY=ship.y;}
    } else if(enemy.mode === 'lock') {
      enemy.windup -= dt;
      if(enemy.windup<=0) {const angle=Math.atan2(enemy.targetY-enemy.y,enemy.targetX-enemy.x),speed=Math.min(370,width*.72);enemy.vx=Math.cos(angle)*speed;enemy.vy=Math.sin(angle)*speed;enemy.mode='dash';}
    } else {
      enemy.x += enemy.vx*dt;enemy.y += enemy.vy*dt;
      if(caveHit(enemy.x,enemy.y,enemy.radius)) {enemy.dead=true;burst(enemy.x,enemy.y,'#ffc781',8);}
    }
  }
  function updateFoundryHazards() {
    hazards = environment().obstacles(width,height,routeTime*100,elapsed).filter(p=>!destroyedProps.has(p.id));
    for(const hazard of hazards) {
      for(const b of bullets) if(!b.dead && !destroyedProps.has(hazard.id) && bulletHitsCircle(b,hazard.x,hazard.y,hazard.radius)) {
        b.dead=true;burst(b.x,b.y,'#edbc7b',4);
        if(hazard.kind==='cargo' || hazard.kind==='prism' || hazard.kind==='fruit' || hazard.kind==='pearl' || hazard.kind==='capacitor') {
          const hp=(propHp.get(hazard.id) ?? (hazard.kind === 'prism' ? 4 : 3))-1;propHp.set(hazard.id,hp);
          if(hp<=0) {destroyedProps.add(hazard.id);award(hazard.kind === 'prism' ? 160 : 120,hazard.x,hazard.y); pickups.push({x:hazard.x,y:hazard.y,radius:11,kind:'charge'}); burst(hazard.x,hazard.y,'#f4bd72',25);}
        }
      }
      if(!destroyedProps.has(hazard.id) && Math.hypot(ship.x-hazard.x,ship.y-hazard.y)<ship.radius+hazard.radius) damage();
      if(state!=='playing')return;
    }
  }
  function startFoundryBoss(kind) {
    const hp=kind==='riveter'?40:70;
    boss={kind,x:width+90,y:height/2,radius:bossRadius(kind),hp,maxHp:hp,age:0,flash:0,shotIn:2.7,mineIn:4,needleIn:5,curtainIn:3.5,curtain:0,gapY:height/2,followUp:0,followGap:height/2,enraged:false,coils:[{offset:-1.05,hp:14},{offset:0,hp:14},{offset:1.05,hp:14}]};
    $('#flight-status').textContent=kind==='riveter'?'THE RIVETER · FOREMAN OF THE FOUNDRY':'HELIOS ENGINE · BREAK THE COILS. END THE SHIFT.';
    announce(kind==='riveter'?'THE RIVETER · Dodge the rivets. Shoot the drifting charges.':'HELIOS ENGINE · Destroy its three glowing coils, then the core.',5);
  }
  function updateFoundryBoss(dt) {
    boss.age+=dt;boss.flash=Math.max(0,boss.flash-dt);
    boss.x=Math.max(width*.82,boss.x-Math.min(155,width*.3)*dt);
    boss.y=height/2+Math.sin(boss.age*(boss.kind==='riveter'?1.05:.45))*height*(boss.kind==='riveter'?.17:.025);
    if(boss.kind==='riveter') {
      boss.shotIn-=dt;boss.mineIn-=dt;boss.needleIn-=dt;
      if(boss.x<width-boss.radius && boss.shotIn<=0){const side=Math.sin(boss.age)>0?-1:1;aimVolley(boss.x-boss.radius,boss.y+side*boss.radius*.65,[-.13,0,.13]);boss.shotIn=1.35;}
      if(boss.mineIn<=0){enemyShots.push({x:boss.x-boss.radius,y:boss.y,vx:-Math.min(100,width*.2),vy:Math.sin(boss.age)*18,radius:11,kind:'mine',arm:.7,life:9});boss.mineIn=3.2;}
      if(boss.needleIn<=0){spawnNeedle(boss.x-boss.radius-20);boss.needleIn=6;}
    } else {
      const meltdown=boss.coils.every(c=>c.hp<=0);
      boss.curtainIn-=dt;
      if(boss.followUp>0){boss.followUp-=dt;if(boss.followUp<=0)fireCurtain(boss.followGap,boss.enraged);}
      if(boss.curtainIn<1.2 && !boss.marked){boss.marked=true;boss.gapY=height*[.32,.68,.5,.28,.72][boss.curtain%5];}
      if(boss.curtainIn<=0 && boss.x<width-boss.radius) {
        fireCurtain(boss.gapY,boss.enraged);boss.followGap=boss.gapY;boss.followUp=.55;
        if(boss.enraged)aimVolley(boss.x-boss.radius,boss.y,[-.3,-.15,0,.15,.3]);
        boss.curtain++;boss.curtainIn=boss.enraged?2.45:3.4;boss.marked=false;
      }
      if(meltdown){boss.needleIn-=dt;if(boss.needleIn<=0){spawnNeedle(boss.x-boss.radius-18);boss.needleIn=boss.enraged?4.5:5.5;}}
    }
    for(const b of bullets) {
      if(b.dead)continue;
      if(boss.kind==='helios' && boss.coils.some(c=>c.hp>0)) {
        const coil=boss.coils.find(c=>c.hp>0 && bulletHitsCircle(b,boss.x-boss.radius*.9,boss.y+c.offset*boss.radius,Math.max(14,boss.radius*.25)));
        if(coil){b.dead=true;coil.hp--;boss.hp--;boss.flash=.07;burst(b.x,b.y,'#ffe0a0',5);if(coil.hp===0){award(150,boss.x,boss.y+coil.offset*boss.radius);burst(boss.x,boss.y+coil.offset*boss.radius,'#ffbd6c',25);if(boss.coils.every(c=>c.hp===0))announce('REACTOR EXPOSED · The coils are down. Finish Helios!',4);}}
        else if(bulletHitsCircle(b,boss.x,boss.y,boss.radius*.95)){b.dead=true;burst(b.x,b.y,'#a9a196',3);}
      } else if(bulletHitsCircle(b,boss.x,boss.y,boss.radius*(boss.kind==='helios'?.55:.9))) {
        b.dead=true;boss.hp--;boss.flash=.08;burst(b.x,b.y,'#ffcb82',4);
      }
      if(boss.kind==='helios' && !boss.enraged && boss.hp<=boss.maxHp/2){boss.enraged=true;announce('HELIOS ENRAGED · Faster double waves and aimed volleys!',4);}
      if(boss.hp<=0){
        const defeated=boss;burst(defeated.x,defeated.y,'#ffd18c',100);shake=.6;enemyShots=[];enemies=[];
        if(defeated.kind==='riveter') {award(1500,defeated.x,defeated.y);miniDefeated=true;boss=null;pickups.push({x:defeated.x,y:height/2,radius:13,kind:'repair'});deliverWeapon('trident');announce('FOREMAN OFFLINE · +1,500 points. The line is open.',4);$('#flight-status').textContent='AFTER HOURS · INTO THE HOT WORKS';}
        else {award(5000+lives*400,defeated.x,defeated.y);finish(true);}return;
      }
    }
    if(boss && Math.hypot(ship.x-boss.x,ship.y-boss.y)<ship.radius+boss.radius)damage();
  }
  function saveCheckpoint() {
    const times=OrbitCampaign.checkpointTimes(level,config().duration);
    if(boss || checkpointIndex>=times.length || routeTime<times[checkpointIndex])return;
    checkpointIndex++;
    checkpoint={width,height,level,score,routeTime,elapsed,miniDefeated,supplyIndex,repairIndex,frontIndex,hatchIndex,choiceIndex,stageIndex,wave,cellCounter,formationSerial,terrainGrowth,
      pickups:pickups.map(p=>({...p})),weapon,weapons:[...ownedWeapons],charge:{...charge},symbiont,destroyedProps:[...destroyedProps],propHp:[...propHp]};
    music.effect('checkpoint');announce(`FLIGHT RECORDER ${checkpointIndex}/${times.length} · Continue saved here. Score and loadout secured.`,4);
  }
  function resumeContinue() {
    const saved=checkpoint, index=checkpointIndex;
    continues--;
    launch(level,saved?.score ?? entryState.score,{...(saved||entryState),lives:settings().lives},'continue');
    if(!saved)return;
    checkpoint=saved;checkpointIndex=index;
    ({routeTime,elapsed,miniDefeated,supplyIndex,repairIndex,frontIndex,hatchIndex,choiceIndex,stageIndex,wave,cellCounter,formationSerial,terrainGrowth}=saved);
    destroyedProps=new Set(saved.destroyedProps);propHp=new Map(saved.propHp);globalThis.OrbitVerdant.setGrowth(terrainGrowth);
    pickups=saved.pickups.map(p=>({...p,x:p.x*width/saved.width,y:p.y*height/saved.height}));weapon=saved.weapon;invulnerable=3;
    const passage=caveBounds(ship.x);ship.y=(passage.top+passage.bottom)/2;
    $('#stage').textContent=config().stages[Math.max(0,stageIndex)].title;
    weaponHud();hud();
  }
  function levelFlow(dt) {
    if (level === 1) {
      if (elapsed >= BOSS_AT && !boss) startBoss();
      if (elapsed < 50) {
        spawnIn -= dt; wallIn -= dt;
        if (spawnIn <= 0) { spawn(); spawnIn = elapsed < 16 ? 1.35 : elapsed < 34 ? 1.65 : .95; }
        if (wallIn <= 0) { spawnWall(); wallIn = elapsed < 16 ? 6 : elapsed < 34 ? 4.2 : 3.7; }
      }
    } else {
      if (!boss) routeTime += dt * scrollSpeed();
      if (!miniDefeated && routeTime >= config().midpoint && !boss) { routeTime = config().midpoint; startRouteBoss(config().mini); }
      if (routeTime >= config().duration && miniDefeated && !boss) { routeTime = config().duration; startRouteBoss(config().boss); }
      if (!boss && routeTime < config().duration - 8) {
        spawnIn -= dt; enemySpawnIn -= dt;
        if (spawnIn <= 0) { spawn(); spawnIn = level >= 3 ? routeTime < config().midpoint ? 1.6 : 1.2 : routeTime < config().midpoint ? 1.85 : 1.5; }
        if (enemySpawnIn <= 0) { spawnEnemy(routeTime > config().midpoint + 15 && wave % 3 === 0); enemySpawnIn = level >= 3 ? routeTime < config().midpoint ? 2.55 : 1.9 : routeTime < config().midpoint ? 3.8 : 2.8; }
        if (level >= 3) { needleIn -= dt; if (needleIn <= 0) { spawnNeedle(); needleIn = routeTime < config().midpoint ? 4.8 : 3.4; } }
      }
      if (level === 5 && !boss && routeTime < config().duration-8) { formationIn -= dt; if(formationIn<=0){spawnFormation();formationIn=routeTime<86?6.5:4.7;} }
      if (level === 4) {
        if (routeTime >= 6 && !shield.unlocked) { shield.unlocked = true; announce('AEGIS INSTALLED · E / SHIFT or SHIELD. Timed blocks return enemy fire.', 5); }
        if (!boss && routeTime < 124) { wispIn -= dt; if (wispIn <= 0) { spawnWisp(); wispIn = routeTime < 66 ? 5.8 : 4.3; } }
        if (!boss && frontIndex < config().fronts.length && routeTime >= config().fronts[frontIndex] && !rearFront) { startFront(); frontIndex++; }
      }
      while (supplyIndex < config().supplies.length && routeTime >= config().supplies[supplyIndex][0]) { deliverWeapon(config().supplies[supplyIndex][1]); supplyIndex++; }
    }
    const progress = level > 1 ? routeTime : elapsed, stages = config().stages;
    const nextStage = stages.reduce((current, stage, i) => progress >= stage.at ? i : current, 0);
    if (nextStage !== stageIndex) { stageIndex = nextStage; if (!boss) announce(stages[stageIndex].message); }
    $('#stage').textContent = boss && ['harrow', 'riveter', 'reaper', 'warden', 'ferryman', 'secondhand', 'cinders'].includes(boss.kind) ? `MIDPOINT / THE ${boss.kind.toUpperCase()}` : stages[stageIndex].title;
    const repairTimes = config().repairs;
    if (repairIndex < repairTimes.length && progress >= repairTimes[repairIndex]) {
      const x = width + 20, p = level > 1 ? caveBounds(x) : { top: 0, bottom: height };
      pickups.push({ x, y: p.top + (p.bottom - p.top) * (repairIndex === 0 ? .4 : .6), radius: 12, kind: 'repair' }); repairIndex++;
      announce('REPAIR BEACON · Collect the teal cross to restore a life', 3);
    }
  }
  function updateEnemies(dt) {
    if(level>=5)updateFormations(dt);
    for (const enemy of enemies) {
      if(enemy.kind==='moth')updateMoth(enemy,dt);
      else if (enemy.kind === 'choir') updateChoir(enemy,dt);
      else if(enemy.kind==='drifter')updateDrifter(enemy,dt);
      else if (enemy.kind === 'needle') updateNeedle(enemy, dt);
      else if (enemy.kind === 'wisp') updateWisp(enemy, dt);
      else {
      enemy.x -= enemy.speed * dt; enemy.age += dt; enemy.flash = Math.max(0, enemy.flash - dt); enemy.shotIn -= dt;
      const p = caveBounds(enemy.x);
      enemy.y = clamp(enemy.baseY + Math.sin(enemy.age * 2 + enemy.phase) * height * .055, p.top + enemy.radius + 8, p.bottom - enemy.radius - 8);
      if (enemy.x < width - 10 && enemy.x > ship.x + 35 && enemy.shotIn <= 0) {
        aimVolley(enemy.x - enemy.radius, enemy.y, enemy.heavy ? [-.12, .12] : [0]); enemy.shotIn = level >= 3 ? 2.1 : 2.5;
      }
      }
      for (const b of bullets) if (!b.dead && !enemy.dead && bulletHitsCircle(b, enemy.x, enemy.y, enemy.radius + 2)) {
        b.dead = true; enemy.hp--; enemy.flash = .1; burst(b.x, b.y, '#9de7d5', 3);
        if (enemy.hp <= 0) { enemy.dead = true; burst(enemy.x, enemy.y, '#91cfc1', 22); award(enemy.kind === 'moth' ? 450 : enemy.kind === 'drifter' ? 400 : enemy.kind === 'wisp' ? 350 : enemy.kind === 'needle' ? 250 : enemy.heavy ? 300 : 200, enemy.x, enemy.y); dropCell(enemy.x, enemy.y); }
      }
      if (!enemy.dead && Math.hypot(enemy.x - ship.x, enemy.y - ship.y) < enemy.radius + ship.radius) { damage(); enemy.dead = true; burst(enemy.x, enemy.y); if (state !== 'playing') return; }
    }
    enemies = enemies.filter(e => !e.dead && e.x > -30);
  }
  function update(dt) {
    if (state === 'paused' || state==='menu') return;
    if(state==='ending'){if(document.hidden)return;endingAge+=dt;if(endingAge>=OrbitTheatre.duration)endCredits();return;}
    if(state==='gameover'){if(document.hidden)return;deathAge+=dt;if(deathAge>=OrbitTheatre.gameOverDuration)endGameOver();return;}
    if(state==='intro'){introAge+=dt;const message=checkpoint && routeTime>0?`Flight recorder ${checkpointIndex} restored. Your last signal held. ${settings().lives} hearts, your saved loadout, and a way forward.`:config().transmission||config().subtitle;ui?.transition(message.slice(0,Math.floor(introAge*38)),true);if(introAge>=OrbitCampaign.introDuration)finishIntro();return;}
    stars.forEach(s => { s.x -= dt * (state === 'playing' ? 45 * scrollSpeed() : 10) * s.depth / width; if (s.x < 0) { s.x = 1; s.y = Math.random(); } });
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; } particles = particles.filter(p => p.life > 0);
    for (const l of labels) { l.y -= 24 * dt; l.life -= dt; } labels = labels.filter(l => l.life > 0);
    shake = Math.max(0, shake - dt);
    if (state !== 'playing') return;
    elapsed += dt; invulnerable = Math.max(0, invulnerable - dt); cooldown = Math.max(0, cooldown - dt);
    shield.update(dt); levelFlow(dt);saveCheckpoint();
    if(level>=6){echoTime=Math.max(0,echoTime-dt);echoCooldown=Math.max(0,echoCooldown-dt);}
    if(level===7)timeLenses=globalThis.OrbitObservatory.lenses(width,height,routeTime*100,elapsed,boss);
    if(level===5){if(!boss || boss.kind!=='warden'){terrainGrowth += (0-terrainGrowth)*Math.min(1,dt*1.5);globalThis.OrbitVerdant.setGrowth(terrainGrowth);}}
    if (elapsed > noticeUntil) $('#announcement').classList.remove('visible');
    let dx = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'));
    let dy = Number(keys.has('arrowdown') || keys.has('s')) - Number(keys.has('arrowup') || keys.has('w'));
    if (pointer) { dx = pointer.x - ship.x; dy = pointer.y - ship.y; const dist = Math.hypot(dx, dy), step = Math.min(dist, 520 * dt); if (dist > 1) { ship.x += dx / dist * step; ship.y += dy / dist * step; } }
    else { const length = Math.hypot(dx, dy) || 1; ship.x += dx / length * 310 * dt; ship.y += dy / length * 310 * dt; }
    if(level===5){const force=globalThis.OrbitVerdant.pull(ship.x,ship.y,width,height,routeTime*100,elapsed);ship.x+=force.x*dt;ship.y+=force.y*dt;}
    ship.x = clamp(ship.x, 22, width - 22); ship.y = clamp(ship.y, 22, height - 22);
    if (keys.has(' ') || firePointer !== null) fire();
    for (const a of asteroids) {
      const step=dt*localTime(a.x,a.y);a.x -= a.speed * step; a.y += a.vy * step; a.angle += a.spin * step;
      const p = caveBounds(a.x);
      if (a.y < p.top + a.radius || a.y > p.bottom - a.radius) { a.y = clamp(a.y, p.top + a.radius, p.bottom - a.radius); a.vy *= -1; }
    }
    for (const w of walls) w.x -= w.speed * dt;
    for (const b of bullets) {
      const step=dt*localTime(b.x,b.y);b.previousX = b.x; b.previousY = b.y; b.x += (b.vx ?? 650) * step; b.y += (b.vy || 0) * step;
      if (caveHit(b.x, b.y, 3) || walls.some(w => wallHit(b.x, b.y, 3, w))) { b.dead = true; burst(b.x, b.y, '#ffac79', 3); continue; }
      for (const a of asteroids) if (!a.dead && bulletHitsCircle(b, a.x, a.y, a.radius * .9 + 3)) { b.dead = true; breakAsteroid(a); break; }
    }
    if (level >= 3) updateFoundryHazards();
    if (level === 4) updateFront(dt);
    if (level === 6) updateAbyss(dt);
    if (level === 7) updateObservatory(dt);
    if (level === 8) updateFinale(dt);
    if (level > 1) updateEnemies(dt);
    if (state !== 'playing') { hud(); return; }
    updateBoss(dt);
    if (state !== 'playing') { hud(); return; }
    for (const a of asteroids) if (!a.dead && Math.hypot(a.x - ship.x, a.y - ship.y) < a.radius * .84 + ship.radius) { damage(); a.dead = true; burst(a.x, a.y, '#b4bec9', 10); }
    for (const w of walls) if (wallHit(ship.x, ship.y, ship.radius, w)) damage();
    if (caveHit(ship.x, ship.y, ship.radius)) {
      damage(); const p = caveBounds(ship.x); ship.y = clamp(ship.y, p.top + ship.radius + 4, p.bottom - ship.radius - 4);
    }
    if (state !== 'playing') { hud(); return; }
    for (const shot of enemyShots) {
      const step=dt*localTime(shot.x,shot.y);
      if (shot.seek > 0) { shot.seek -= step; const target = Math.atan2(ship.y - shot.y, ship.x - shot.x), angle = Math.atan2(shot.vy, shot.vx), delta = Math.atan2(Math.sin(target - angle), Math.cos(target - angle)), next = angle + clamp(delta, -step * .8, step * .8), speed = Math.hypot(shot.vx, shot.vy); shot.vx = Math.cos(next) * speed; shot.vy = Math.sin(next) * speed; }
      shot.x += shot.vx * step; shot.y += shot.vy * step;
      if (shot.life !== undefined) shot.life -= step;
      if (shot.kind === 'mine') {
        shot.arm = Math.max(0, shot.arm - step);
        for (const b of bullets) if (!b.dead && !shot.dead && bulletHitsCircle(b, shot.x, shot.y, shot.radius + 3)) { b.dead = true; shot.dead = true; burst(shot.x, shot.y, '#d1a4ed', 14); award(30, shot.x, shot.y); }
      }
      if (!shot.dead && (shot.arm === undefined || shot.arm <= 0) && Math.hypot(shot.x - ship.x, shot.y - ship.y) < shot.radius + ship.radius + (shield.active ? 11 : 0)) { damage('projectile'); shot.dead = true; if (state !== 'playing') { hud(); return; } }
      if (level > 1 && caveHit(shot.x, shot.y, shot.radius)) shot.dead = true;
    }
    if (state !== 'playing') { hud(); return; }
    for (const p of pickups) {
      if (p.kind === 'weapon') {
        p.age += dt; p.x = Math.max(width * (p.weaponId === 'trident' ? .62 : .49), p.x - Math.min(115, width * .24) * dt);
        const passage = caveBounds(p.x); p.y = (passage.top + passage.bottom) / 2 + Math.sin(p.age * 2) * 10;
      } else {
        p.x -= Math.min(110, width * .22) * dt;
        if (level > 1) { const passage = caveBounds(p.x); p.y = clamp(p.y, passage.top + 20, passage.bottom - 20); }
      }
      if (Math.hypot(p.x - ship.x, p.y - ship.y) < p.radius + ship.radius + (p.kind === 'weapon' ? 8 : 0)) {
        p.dead = true;
        if (p.kind === 'weapon') unlockWeapon(p.weaponId || 'twin');
        else if(p.kind==='symbiote')rescueCompanion();
        else if (p.kind === 'charge') { refillCharge(25); music.effect('pickup'); burst(p.x,p.y,'#b0dfff',15); }
        else {
          music.effect('pickup'); burst(p.x, p.y, '#86e5cb', 20);
          if (lives < settings().maxLives) { lives++; labels.push({ x: ship.x, y: ship.y - 20, text: '+1 LIFE', life: 1.3, color: '#86e5cb' }); }
          else award(150, p.x, p.y);
        }
      }
    }
    asteroids = asteroids.filter(a => !a.dead && a.x > -a.radius - 10);
    bullets = bullets.filter(b => !b.dead && b.x > -20 && b.x < width + 20 && b.y > -20 && b.y < height + 20); walls = walls.filter(w => w.x + w.w > -10);
    enemyShots = enemyShots.filter(s => !s.dead && (s.life === undefined || s.life > 0) && s.x > -20 && s.x < width + 50 && s.y > -20 && s.y < height + 20);
    pickups = pickups.filter(p => !p.dead && p.x > -20); hud();
  }
  function drawShip() {
    ctx.save(); ctx.translate(ship.x, ship.y);
    ctx.shadowColor = '#ff865e'; ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff865e'; ctx.beginPath(); ctx.moveTo(-15, -5); ctx.lineTo(-29 - Math.random() * 12, 0); ctx.lineTo(-15, 5); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#dae3eb'; ctx.strokeStyle = '#f8fbff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-15, -14); ctx.lineTo(-10, -3); ctx.lineTo(-10, 3); ctx.lineTo(-15, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#577d92'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    if(weapon==='halo'){ctx.strokeStyle='#ffb7db';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.stroke();}
    if(weapon==='compass'){ctx.fillStyle='#c4ff8c';ctx.fillRect(-3,-15,5,30);ctx.fillRect(0,-3,18,6);}
    if (weapon === 'trident') { ctx.fillStyle = '#ffd28a'; ctx.shadowColor = '#ffb85f'; ctx.shadowBlur = 12; ctx.fillRect(3, -4, 15, 8); ctx.shadowBlur = 0; }
    if (weapon === 'twin') { ctx.fillStyle = '#cab1fa'; ctx.shadowColor = '#bc93ff'; ctx.shadowBlur = 6; ctx.fillRect(-6, -12, 12, 3); ctx.fillRect(-6, 9, 12, 3); ctx.shadowBlur = 0; }
    ctx.strokeStyle = '#8597a8'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-19, 0); ctx.stroke(); ctx.restore();
  }
  function drawAsteroid(a) {
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.angle);
    ctx.fillStyle = a.tier === 1 ? '#434b52' : '#353b46'; ctx.strokeStyle = a.tier === 1 ? '#97aab2' : '#8c8077'; ctx.lineWidth = 1.4; ctx.beginPath();
    a.shape.forEach((r, i) => { const angle = i / a.shape.length * Math.PI * 2, x = Math.cos(angle) * a.radius * r, y = Math.sin(angle) * a.radius * r; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#242d38'; ctx.strokeStyle = '#4a515b'; ctx.lineWidth = 1;
    for (const [x, y, r] of [[-.2, -.17, .22], [.32, .24, .15], [-.3, .38, .1]]) { ctx.beginPath(); ctx.arc(x * a.radius, y * a.radius, r * a.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    if (a.tier === 2) { ctx.strokeStyle = '#c39b7955'; ctx.beginPath(); ctx.moveTo(-a.radius * .65, a.radius * .1); ctx.lineTo(0, 0); ctx.lineTo(a.radius * .3, -a.radius * .65); ctx.stroke(); }
    ctx.restore();
  }
  function drawWall(w) {
    for (const [y, h, edge] of [[0, w.top, w.top], [w.bottom, height - w.bottom, w.bottom]]) {
      ctx.fillStyle = '#1a2937'; ctx.strokeStyle = '#425563'; ctx.lineWidth = 1; ctx.fillRect(w.x, y, w.w, h); ctx.strokeRect(w.x, y, w.w, h);
      ctx.save(); ctx.beginPath(); ctx.rect(w.x, y, w.w, h); ctx.clip();
      ctx.strokeStyle = '#68809522';
      for (let line = -height; line < height + w.w; line += 18) { ctx.beginPath(); ctx.moveTo(w.x, y + line); ctx.lineTo(w.x + w.w, y + line + w.w); ctx.stroke(); } ctx.restore();
      ctx.fillStyle = '#ffb975'; ctx.fillRect(w.x, edge - 2, w.w, 4);
      ctx.fillStyle = '#a3bfd1'; ctx.fillRect(w.x + 5, y + h / 2 - 2, 4, 4);
    }
  }
  function drawNeedle(enemy) {
    ctx.save();ctx.translate(enemy.x,enemy.y);
    if(enemy.mode==='lock'){ctx.setLineDash([4,6]);ctx.strokeStyle='#ffca8266';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(enemy.targetX-enemy.x,enemy.targetY-enemy.y);ctx.stroke();ctx.setLineDash([]);}
    if(enemy.mode==='dash')ctx.rotate(Math.atan2(enemy.vy,-enemy.vx)*-1);
    ctx.fillStyle=enemy.flash>0?'#fff2d4':'#5a4638';ctx.strokeStyle=enemy.mode==='lock'?'#ffe1a7':'#dda476';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(-23,0);ctx.lineTo(10,-9);ctx.lineTo(4,0);ctx.lineTo(10,9);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.shadowColor='#ffc478';ctx.shadowBlur=enemy.mode==='lock'?20:8;ctx.fillStyle='#ffce86';ctx.fillRect(-7,-2,9,4);ctx.shadowBlur=0;
    if(enemy.mode==='dash'){ctx.fillStyle='#edb57c';ctx.beginPath();ctx.moveTo(8,-4);ctx.lineTo(30,0);ctx.lineTo(8,4);ctx.fill();}ctx.restore();
  }
  function drawFoundryBoss() {
    const r=boss.radius;ctx.save();ctx.translate(boss.x,boss.y);
    if(boss.kind==='riveter') {
      ctx.fillStyle=boss.flash>0?'#fff0d0':'#494039';ctx.strokeStyle='#e3b77e';ctx.lineWidth=1.8;
      ctx.fillRect(-r*.75,-r*.6,r*1.5,r*1.2);ctx.strokeRect(-r*.75,-r*.6,r*1.5,r*1.2);
      for(const side of [-1,1]){const offset=(Math.sin(boss.age*2)+1)*r*.1;ctx.fillStyle='#343333';ctx.fillRect(-r*.8,side*r*.9-r*.17,r*1.5,r*.34);ctx.strokeRect(-r*.8,side*r*.9-r*.17,r*1.5,r*.34);ctx.fillStyle='#ffd193';ctx.fillRect(-r-offset,side*r*.9-r*.13,r*.4,r*.26);ctx.strokeStyle='#81847b';ctx.beginPath();ctx.moveTo(r*.4,side*r*.55);ctx.lineTo(r*.4,side*r*.9);ctx.stroke();}
      ctx.shadowColor='#ff9e58';ctx.shadowBlur=18;ctx.fillStyle='#ffd28a';ctx.beginPath();ctx.arc(-r*.35,0,r*.24,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#f8deb2';ctx.beginPath();ctx.arc(-r*.35,0,r*.38,0,Math.PI*2);ctx.stroke();
      ctx.font='8px monospace';ctx.fillStyle='#ceb18d';ctx.textAlign='center';ctx.fillText('R-54',r*.2,3);
    } else {
      const exposed=boss.coils.every(c=>c.hp<=0);
      if (boss.enraged) { ctx.shadowColor='#ff735d'; ctx.shadowBlur=12; }
      ctx.strokeStyle=exposed?'#ffb774':'#a9987d';ctx.fillStyle=boss.flash>0?'#f8e8c8':'#373638';ctx.lineWidth=2;
      ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/8,x=Math.cos(a)*r*1.12,y=Math.sin(a)*r*1.35;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();
      ctx.save();ctx.rotate(boss.age*(exposed?.8:.18));ctx.strokeStyle='#edaf6755';ctx.lineWidth=3;for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(r*.45,0);ctx.lineTo(r*.95,0);ctx.stroke();}ctx.restore();
      ctx.fillStyle=exposed?'#ffd88f':'#28282e';ctx.shadowColor='#ff9c51';ctx.shadowBlur=exposed?25:0;ctx.beginPath();ctx.arc(0,0,r*.43,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ffc67f';ctx.beginPath();ctx.arc(0,0,r*.58,0,Math.PI*2);ctx.stroke();
      for(const coil of boss.coils){const x=-r*.9,y=coil.offset*r;ctx.strokeStyle=coil.hp>0?'#e6bc7a':'#74675a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(r*.3,0);ctx.stroke();ctx.fillStyle=coil.hp>0?'#402e25':'#282b30';ctx.beginPath();ctx.arc(x,y,Math.max(14,r*.25),0,Math.PI*2);ctx.fill();ctx.stroke();if(coil.hp>0){ctx.shadowColor='#ffbb73';ctx.shadowBlur=15;ctx.fillStyle='#ffdda1';ctx.beginPath();ctx.arc(x,y,Math.max(7,r*.13),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#e3aa67';ctx.fillRect(x-12,y-21,24*coil.hp/14,2);}}
    }ctx.restore();
    if(boss.kind==='helios' && boss.marked && state!=='won'){
      const gap=Math.max(48,height*.12);ctx.save();ctx.strokeStyle='#a5e7c966';ctx.setLineDash([5,7]);ctx.strokeRect(boss.x-boss.radius-16,boss.gapY-gap,15,gap*2);ctx.setLineDash([]);ctx.font='8px monospace';ctx.textAlign='right';ctx.fillStyle='#b9e4ce';ctx.fillText('SAFE GAP',boss.x-boss.radius-22,boss.gapY-4);ctx.restore();
    }
  }
  function drawWisp(enemy) {
    ctx.save();ctx.translate(enemy.x,enemy.y);const r=enemy.radius;
    ctx.strokeStyle='#bad9ef';ctx.fillStyle=enemy.flash>0?'#effaff':'#34455f';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(-r,0);ctx.quadraticCurveTo(0,-r*1.4,r,0);ctx.lineTo(r*.55,r*.4);ctx.lineTo(0,r*.2);ctx.lineTo(-r*.55,r*.4);ctx.closePath();ctx.fill();ctx.stroke();
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo((i-1)*r*.5,r*.2);ctx.lineTo((i-1)*r*.6+Math.sin(enemy.age*6+i)*5,r*1.2);ctx.stroke();}
    ctx.shadowColor='#ff8d9b';ctx.shadowBlur=enemy.shotIn<.4?20:5;ctx.fillStyle='#ff9dac';ctx.beginPath();ctx.arc(-r*.3,0,4,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawMeridianBoss() {
    const r=boss.radius;ctx.save();ctx.translate(boss.x,boss.y);
    if(boss.kind==='reaper') {
      ctx.fillStyle=boss.flash>0?'#f2faff':'#34455b';ctx.strokeStyle='#c0daef';ctx.lineWidth=1.6;
      ctx.beginPath();ctx.moveTo(-r*1.15,0);ctx.lineTo(r*.4,-r*.5);ctx.lineTo(r*.8,-r*1.05);ctx.lineTo(r*1.1,-r*.5);ctx.lineTo(r*.7,0);ctx.lineTo(r*1.1,r*.5);ctx.lineTo(r*.8,r*1.05);ctx.lineTo(r*.4,r*.5);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.shadowColor=boss.mode==='lock'?'#fda3cc':'#91d7ff';ctx.shadowBlur=18;ctx.fillStyle=boss.mode==='lock'?'#ffb8d8':'#c0edff';ctx.beginPath();ctx.arc(-r*.3,0,r*.21,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      if(boss.mode==='dash'){ctx.fillStyle='#b2dcff77';ctx.beginPath();ctx.moveTo(r*.5,-r*.25);ctx.lineTo(r*2.7,0);ctx.lineTo(r*.5,r*.25);ctx.fill();}
    } else {
      const color=boss.enraged?'#f1a9df':'#a9dfff';ctx.fillStyle=boss.flash>0?'#f4eaff':'#23384d';ctx.strokeStyle=color;ctx.lineWidth=1.3;
      ctx.beginPath();ctx.ellipse(0,0,r*.95,height*.29,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      for(let i=0;i<6;i++){const y=(i-2.5)*height*.085,offset=Math.sin(boss.age*1.3+i)*r*.1;ctx.beginPath();ctx.moveTo(r*.15,y);ctx.lineTo(r*.95+offset,y-height*.03);ctx.lineTo(r*1.15,y+height*.025);ctx.stroke();ctx.fillStyle='#9cc7e333';ctx.fillRect(r*.1,y-2,r*.5,4);}
      const x=boss.coreX-boss.x,y=boss.coreY-boss.y;ctx.strokeStyle=color+'88';ctx.beginPath();ctx.moveTo(0,-height*.24);ctx.lineTo(x,y);ctx.lineTo(0,height*.24);ctx.stroke();
      ctx.shadowColor=color;ctx.shadowBlur=24;ctx.fillStyle=boss.flash>0?'#ffffff':boss.enraged?'#ffc5ef':'#d0f3ff';ctx.beginPath();ctx.arc(x,y,Math.max(16,r*.35),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#dcefff';ctx.beginPath();ctx.arc(x,y,r*.5,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=color+'55';ctx.beginPath();ctx.ellipse(0,0,r*1.15,height*.33,0,boss.age*.15,boss.age*.15+Math.PI*1.6);ctx.stroke();
    }ctx.restore();
    if(boss.kind==='reaper' && boss.mode==='lock') {ctx.save();ctx.strokeStyle='#f3a5d5aa';ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(width*.18,boss.targetY);ctx.lineTo(boss.x,boss.targetY);ctx.stroke();ctx.setLineDash([]);ctx.font='8px monospace';ctx.fillStyle='#ffd3ee';ctx.textAlign='left';ctx.fillText('CHARGE LOCK · CHANGE LANE',24,boss.targetY-15);ctx.restore();}
  }
  function drawEnemy(enemy) {
    if(enemy.kind==='moth'){globalThis.OrbitObservatory.drawMoth(ctx,enemy);return;}
    if(enemy.kind==='drifter'){globalThis.OrbitAbyss.drawJelly(ctx,enemy);return;}
    if(enemy.kind==='choir'){globalThis.OrbitVerdantCombat.drawDrone(ctx,enemy);return;}
    if (enemy.kind === 'wisp') { drawWisp(enemy); return; }
    if (enemy.kind === 'needle') { drawNeedle(enemy); return; }
    const r = enemy.radius;
    ctx.save(); ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = enemy.flash > 0 ? '#e9f8e9' : enemy.heavy ? '#4d384d' : '#344d54';
    ctx.strokeStyle = enemy.heavy ? '#d4a2d0' : '#9cb8b9'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-r * 1.2, 0); ctx.lineTo(-r * .2, -r * .5); ctx.lineTo(r * .6, -r); ctx.lineTo(r, -r * .35); ctx.lineTo(r * .6, 0); ctx.lineTo(r, r * .35); ctx.lineTo(r * .6, r); ctx.lineTo(-r * .2, r * .5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowColor = '#ff786b'; ctx.shadowBlur = enemy.shotIn < .4 ? 17 : 6;
    ctx.fillStyle = '#ff9585'; ctx.fillRect(-r * .55, -3, r * .7, 6); ctx.shadowBlur = 0;
    ctx.fillStyle = '#bc7465'; ctx.fillRect(r * .6, -r * .5, 6 + Math.sin(enemy.age * 20) * 2, 3); ctx.fillRect(r * .6, r * .5 - 3, 6, 3);
    if (enemy.hp < (enemy.heavy ? 3 : 2)) { ctx.fillStyle = '#75818e'; ctx.fillRect(-r, r + 7, r * 2, 2); ctx.fillStyle = '#ffbc9f'; ctx.fillRect(-r, r + 7, r * 2 * enemy.hp / (enemy.heavy ? 3 : 2), 2); }
    ctx.restore();
  }
  function drawCavernBoss() {
    const r = boss.radius;
    ctx.save(); ctx.translate(boss.x, boss.y);
    if (boss.kind === 'harrow') {
      ctx.fillStyle = boss.flash > 0 ? '#e8fff6' : '#304649'; ctx.strokeStyle = '#a3d7c9'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(-r * .2, -r * .45); ctx.lineTo(-r * .3, -r * 1.2); ctx.lineTo(r * .9, -r * .8); ctx.lineTo(r * .5, 0); ctx.lineTo(r * .9, r * .8); ctx.lineTo(-r * .3, r * 1.2); ctx.lineTo(-r * .2, r * .45); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (const side of [-1, 1]) { ctx.fillStyle = '#15242b'; ctx.beginPath(); ctx.arc(r * .2, side * r * .7, r * .23, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#dfaa76'; ctx.fillRect(r * .1, side * r * .7 - 3, r * .4, 6); }
      ctx.shadowColor = '#ff987d'; ctx.shadowBlur = 20; ctx.fillStyle = '#ffb593'; ctx.beginPath(); ctx.arc(-r * .35, 0, r * .22, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = '#91c6c0'; ctx.beginPath(); ctx.arc(-r * .35, 0, r * .35, boss.age, boss.age + Math.PI * 1.5); ctx.stroke();
    } else {
      const open = boss.open;
      ctx.rotate(Math.sin(boss.age * .3) * .1);
      ctx.strokeStyle = open ? '#83e9cb' : '#b29acb'; ctx.lineWidth = 2;
      ctx.fillStyle = '#17272e'; ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 3 + boss.age * .035);
        ctx.translate(open ? r * .34 : 0, 0);
        ctx.fillStyle = boss.flash > 0 ? '#ecfff3' : open ? '#3a5157' : '#3d354c'; ctx.strokeStyle = open ? '#7ab6ac' : '#b198c7'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(r * .35, -r * .16); ctx.lineTo(r * .83, -r * .41); ctx.lineTo(r * 1.05, -r * .12); ctx.lineTo(r * .92, r * .35); ctx.lineTo(r * .4, r * .2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      ctx.shadowColor = open ? '#8affdc' : '#aa7fd5'; ctx.shadowBlur = open ? 26 : 8;
      ctx.fillStyle = open ? '#acffe3' : '#665078'; ctx.beginPath(); ctx.arc(0, 0, r * .3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = open ? '#e2fff2' : '#a68abc'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, r * .44, 0, Math.PI * 2); ctx.stroke();
      if (!open) { ctx.strokeStyle = '#dac3f0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * .13, -r * .13); ctx.lineTo(r * .13, r * .13); ctx.moveTo(-r * .13, r * .13); ctx.lineTo(r * .13, -r * .13); ctx.stroke(); }
    }
    ctx.restore();
  }
  function drawIrisBeam() {
    if (!boss || boss.kind !== 'iris' || !['charge', 'beam'].includes(boss.phase) || !['playing', 'paused'].includes(state)) return;
    ctx.save();
    // Clip the beam and its telegraph to the same open cavern the player can fly in.
    ctx.beginPath();
    for (let x = 0; x <= width + 8; x += 8) { const p = caveBounds(x); if (x === 0) ctx.moveTo(x, p.top); else ctx.lineTo(x, p.top); }
    for (let x = width + 8; x >= 0; x -= 8) ctx.lineTo(x, caveBounds(x).bottom);
    ctx.closePath(); ctx.clip();
    for (const y of boss.beamYs) {
      const end = boss.x - boss.radius * .25;
      if (boss.phase === 'charge') {
        ctx.fillStyle = '#ffad9222'; ctx.fillRect(0, y - 10, end, 20);
        ctx.strokeStyle = '#ffb5a2bb'; ctx.lineWidth = 1; ctx.setLineDash([6, 7]);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(end, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = '8px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#ffd5c4'; ctx.fillText('SCAN LOCK · MOVE', 20, y - 17);
      } else {
        ctx.fillStyle = '#ff796333'; ctx.fillRect(0, y - 17, end, 34);
        ctx.shadowColor = '#ff876d'; ctx.shadowBlur = 20; ctx.fillStyle = '#ff9a80'; ctx.fillRect(0, y - 9, end, 18);
        ctx.shadowBlur = 0; ctx.fillStyle = '#fff0d9'; ctx.fillRect(0, y - 2, end, 4);
      }
      ctx.fillStyle = '#ffd0ab'; ctx.beginPath(); ctx.arc(end, y, boss.phase === 'beam' ? 10 : 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function drawPickup(p) {
    if(p.kind==='symbiote'){ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#bbffe1';ctx.strokeStyle='#ffd3a1';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,13,8,Math.sin(elapsed*2)*.2,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#3a6370';ctx.beginPath();ctx.arc(5,-1,3,0,Math.PI*2);ctx.fill();ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillStyle='#c6ffe9';ctx.fillText('HELP?',0,25);ctx.restore();return;}
    if(p.kind==='charge'){ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#214459';ctx.strokeStyle='#b4e3ff';ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#d2efff';ctx.beginPath();ctx.moveTo(1,-8);ctx.lineTo(-6,1);ctx.lineTo(-1,1);ctx.lineTo(-2,8);ctx.lineTo(6,-2);ctx.lineTo(1,-2);ctx.closePath();ctx.fill();ctx.restore();return;}
    ctx.save(); ctx.translate(p.x, p.y);
    const isWeapon = p.kind === 'weapon', isTrident = p.weaponId === 'trident', isCompass=p.weaponId==='compass',isHalo=p.weaponId==='halo';
    ctx.rotate(Math.PI / 4); ctx.fillStyle = isTrident ? '#493422' : isWeapon ? '#32253e' : '#153d39'; ctx.strokeStyle = isTrident ? '#ffd28a' : isWeapon ? '#c7a4ff' : '#86e5cb'; ctx.lineWidth = 1.5;
    const size = isWeapon ? 16 : 12;
    ctx.strokeStyle=isHalo?'#ffb7db':isCompass?'#c4ff8c':ctx.strokeStyle;
    ctx.shadowColor = isHalo?'#ffb7db':isCompass?'#c4ff8c':isTrident ? '#ffd28a' : isWeapon ? '#c7a4ff' : '#86e5cb'; ctx.shadowBlur = isWeapon ? 15 : 0;
    ctx.fillRect(-size, -size, size * 2, size * 2); ctx.strokeRect(-size, -size, size * 2, size * 2); ctx.shadowBlur = 0;
    ctx.rotate(-Math.PI / 4); ctx.fillStyle = isTrident ? '#ffe2a9' : isWeapon ? '#e5d0ff' : '#a1ffe0';
    if (isWeapon) {
      if(isHalo){ctx.strokeStyle='#ffd0e6';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.fillRect(Math.cos(a)*11-1,Math.sin(a)*11-1,3,3);}}else if(isCompass){ctx.fillStyle='#d8ffac';ctx.fillRect(-2,-11,4,22);ctx.fillRect(0,-2,11,4);}else if (isTrident) { for (const x of [-7, -1, 5]) ctx.fillRect(x, -8, 3, 16); } else { ctx.fillRect(-6, -8, 4, 16); ctx.fillRect(2, -8, 4, 16); }
      ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.fillText(isHalo?'HALO':isCompass?'COMPASS':isTrident ? 'TRIDENT' : 'TWIN', 0, 37);
    } else { ctx.fillRect(-7, -2, 14, 4); ctx.fillRect(-2, -7, 4, 14); }
    ctx.restore();
  }
  function drawBoss() {
    if (!boss || state === 'won') return;
    if(level===8){OrbitFinale.drawBoss(ctx,boss,width,height);return;}
    if(level===7){globalThis.OrbitObservatory.drawBoss(ctx,boss,width,height);return;}
    if(level===6){globalThis.OrbitAbyss.drawBoss(ctx,boss,width,height);return;}
    if (level === 5) { globalThis.OrbitVerdantCombat.drawBoss(ctx,boss,width,height); return; }
    if (level === 4) { drawMeridianBoss(); return; }
    if (level === 3) { drawFoundryBoss(); return; }
    if (level === 2) { drawCavernBoss(); return; }
    const r = boss.radius;
    ctx.save(); ctx.translate(boss.x, boss.y);
    ctx.fillStyle = boss.flash > 0 ? '#eee7da' : '#293344'; ctx.strokeStyle = '#bd7974'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-r * .8, -r * .55); ctx.lineTo(-r * .4, -r); ctx.lineTo(r * .6, -r * 1.2); ctx.lineTo(r, -r * .5); ctx.lineTo(r, r * .5); ctx.lineTo(r * .6, r * 1.2); ctx.lineTo(-r * .4, r); ctx.lineTo(-r * .8, r * .55); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#718096'; ctx.lineWidth = 3;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-r, side * r * .8); ctx.lineTo(-r * .35, side * r * .65); ctx.lineTo(r * .6, side * r * .8); ctx.stroke(); }
    ctx.shadowColor = '#ff665f'; ctx.shadowBlur = boss.shotIn < .55 ? 30 : 15;
    ctx.fillStyle = boss.hp <= BOSS_HP / 2 ? '#ff655c' : '#ffae75'; ctx.beginPath(); ctx.arc(-r * .25, 0, r * (.25 + Math.sin(boss.age * 5) * .025), 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#ffe0bd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-r * .25, 0, r * .4, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // A subtle sight line warns of the next aimed volley.
    if (state === 'playing' && boss.shotIn < .55) {
      ctx.setLineDash([4, 8]); ctx.strokeStyle = '#ff776144'; ctx.beginPath(); ctx.moveTo(boss.x - r, boss.y); ctx.lineTo(ship.x, ship.y); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  function draw() {
    if(state==='gameover'){OrbitTheatre.drawGameOver(ctx,width,height,deathAge,score,level);return;}
    if(state==='ending'||state==='complete'){OrbitTheatre.draw(ctx,width,height,endingAge);return;}
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * .6, height * .45, 0, width * .6, height * .45, width * .65);
    glow.addColorStop(0, level===8?'#3d3026':level === 7 ? '#282842' : level === 6 ? '#173e43' : level === 5 ? '#2e293e' : level === 4 ? '#1c304b' : level === 3 ? '#382b28' : level === 2 ? boss?.kind === 'iris' ? '#28233d' : '#123236' : boss ? '#251b30' : '#132236'); glow.addColorStop(1, '#080e16'); ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    ctx.save(); if (shake > 0 && state !== 'paused') ctx.translate((Math.random() - .5) * shake * 12, (Math.random() - .5) * shake * 12);
    for (const s of stars) { ctx.globalAlpha = s.depth * .65; ctx.fillStyle = '#c6d6ec'; ctx.beginPath(); ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.strokeStyle = '#789abc08'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(width * .72, height * .5, width * (.3 + i * .2), height * (.6 + i * .35), -.3, 0, Math.PI * 2); ctx.stroke(); }
    if (level === 1) beltTerrain.draw();
    if(level===8)OrbitFinale.draw(ctx,width,height,routeTime*100,elapsed,destroyedProps);
    if(level===7)globalThis.OrbitObservatory.draw(ctx,width,height,routeTime*100,elapsed,destroyedProps,boss);
    if(level===6)globalThis.OrbitAbyss.draw(ctx,width,height,routeTime*100,elapsed,destroyedProps);
    if (level === 5) globalThis.OrbitVerdant.draw(ctx,width,height,routeTime*100,elapsed,destroyedProps);
    if (level === 2) terrain.draw(ctx, width, height, routeTime * 100);
    if (level === 3) globalThis.OrbitFoundry.draw(ctx, width, height, routeTime * 100, elapsed, destroyedProps);
    if (level === 4) globalThis.OrbitMeridian.draw(ctx,width,height,routeTime*100,elapsed,destroyedProps);
    for (const w of walls) drawWall(w);
    const displayAsteroids = state === 'ready' ? [makePreview(width * .83, height * .3, 32), makePreview(width * .72, height * .77, 21)] : asteroids;
    for (const a of displayAsteroids) if (!a.dead) drawAsteroid(a);
    for (const enemy of enemies) drawEnemy(enemy);
    ctx.shadowBlur = 10;
    for (const b of bullets) if (!b.dead) {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy || 0, b.vx || 650));
      ctx.shadowColor = arsenal.weapons[b.weapon || 'pulse'].color; ctx.fillStyle = arsenal.weapons[b.weapon || 'pulse'].color; ctx.fillRect(-12, -2, 16, 4); ctx.restore();
    } ctx.shadowBlur = 0;
    drawIrisBeam();
    drawBoss();
    for (const s of enemyShots) {
      ctx.fillStyle = s.kind === 'rivet' ? '#ffc47c' : s.kind === 'mine' ? s.arm > 0 ? '#e1c89a' : '#e7a2d4' : '#ff8179';
      ctx.shadowColor = s.kind === 'mine' ? '#c98de0' : '#ff6655'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      if (s.kind === 'mine') { ctx.strokeStyle = '#e6bbf7'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(s.x, s.y, s.radius + 4, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#3d284e'; ctx.fillRect(s.x - 3, s.y - 3, 6, 6); }
    }
    for (const p of pickups) drawPickup(p);
    if (level === 4) globalThis.OrbitMeridian.drawFront(ctx,width,height,rearFront);
    if(level>=6 && state!=='over')drawCompanion();
    if (state !== 'over') {
      if (invulnerable > 0 && state === 'playing') ctx.globalAlpha = Math.sin(elapsed * 35) > 0 ? .4 : 1;
      drawShip(); ctx.globalAlpha = 1;
      if (shield.active) {
        ctx.save(); ctx.translate(ship.x,ship.y); ctx.strokeStyle=shield.parrying?'#f3fbff':'#acdfff'; ctx.fillStyle='#9cd6ff16'; ctx.shadowColor='#9ddaff'; ctx.shadowBlur=16; ctx.lineWidth=2; ctx.beginPath();
        for(let i=0;i<6;i++){const a=i/6*Math.PI*2,x=Math.cos(a)*30,y=Math.sin(a)*30;if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#e0f6ff';ctx.beginPath();ctx.arc(0,0,35,-Math.PI/2,-Math.PI/2+Math.PI*2*shield.time/2.2);ctx.stroke();ctx.restore();
      }
      if (invulnerable > 0 && state === 'playing') { ctx.strokeStyle = '#9de6f677'; ctx.beginPath(); ctx.arc(ship.x, ship.y, 25, 0, Math.PI * 2); ctx.stroke(); }
    }
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); } ctx.globalAlpha = 1;
    ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    for (const label of labels) { ctx.globalAlpha = Math.min(1, label.life * 2); ctx.fillStyle = label.color; ctx.fillText(label.text, label.x, label.y); } ctx.globalAlpha = 1;
    ctx.restore();
  }
  function makePreview(x, y, radius) { return { x, y, radius, tier: 2, angle: .3, shape: [.9, .8, 1, .85, .95, .8, .95, .85, 1] }; }
  function frame(now) {
    accumulator += Math.min((now - lastTime) / 1000 || 0, .1); lastTime = now;
    while (accumulator >= 1 / 120) { update(1 / 120); accumulator -= 1 / 120; }
    draw(); requestAnimationFrame(frame);
  }
  function finishIntro(){if(state!=='intro')return;state='playing';ui?.transition('',false);fireButton.disabled=false;hud();}
  function offerResult(won){if(resultSubmitted)return;resultSubmitted=true;ui?.result({score,level,difficulty,won});}
  function endCredits(){if(state!=='ending')return;endingAge=OrbitTheatre.duration;state='complete';music.setPlaying(9,false,true);ui?.cinema(false);offerResult(true);}
  function endGameOver(){if(state!=='gameover'||deathAge<1.5)return;state='over';ui?.cinema(false);showOverlay('EXPEDITION ENDED','Your signal lives on.',`${score.toLocaleString()} points · Level ${level} · ${settings().name}`,'New expedition','PRESS ENTER · BACK TO MAIN MENU');offerResult(false);}
  function openTitle(){state='menu';clearInput();music.setPlaying(10,true);ui?.transition('',false);ui?.menu();}
  function startNewRun(id){if(!OrbitCampaign.difficulties[id] || !OrbitCampaign.isUnlocked(id))return false;difficulty=id;ui?.showGame();resize();launch(1,0,{lives:settings().lives,weapons:['pulse']},'new');return true;}
  function startAction() {
    if(state==='gameover'){endGameOver();return;}
    if(state==='intro'){finishIntro();return;}
    if(state==='paused'){pause();return;}
    if(state==='won' && level<8){launch(level+1,score,{lives,weapons:[...ownedWeapons],charge:{...charge},symbiont},'carry');return;}
    if(state==='over' && continues>0){resumeContinue();return;}
    if(['over','won','complete'].includes(state)){openTitle();return;}
    if(state==='ready')startNewRun(difficulty);
  }
  // Native input unlocks the menu soundtrack under browser autoplay policies.
  for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{if(state==='menu')music.setPlaying(10,true);});
  start.addEventListener('click', startAction);
  $('#shield').addEventListener('pointerdown', e => { e.preventDefault(); activateShield(); });
  $('#shield').addEventListener('click', activateShield);
  $('#sfx').addEventListener('click', () => {music.toggleEffects();if(music.status().sfxEnabled)music.effect('pickup');});
  $('#music').addEventListener('click', () => music.toggle());
  $('#volume').addEventListener('input', e => music.setVolume(Number(e.target.value) / 100));
  $('#effects-volume').addEventListener('input',e=>music.setEffectsVolume(Number(e.target.value)/100));
  $('#test-sfx').addEventListener('click',async()=>{$('#audio-result').textContent='Starting effects…';const played=await music.previewEffect($('#test-cue').value);$('#audio-result').textContent=played?'Test sound played · effects enabled':'Audio unavailable or blocked by the browser';});
  weaponButton.addEventListener('click', () => swapWeapon()); pauseButton.addEventListener('click', pause);
  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if(ui && $('#score-dialog').open)return;
    if (!['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'p', 'escape', 'enter', 'q', '1', '2', '3', '4', '5', 'e', 'shift'].includes(key)) return;
    if ((key === ' ' || key === 'enter') && e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    if(ui && state==='menu')return;
    if(key===' ' && state==='intro'){finishIntro();return;}
    if (key === 'enter') { if (!e.repeat) { if (state !== 'playing') startAction(); } }
    else if (key === 'q' || key === '1' || key === '2' || key === '3' || key === '4' || key === '5') { if (!e.repeat) swapWeapon(key === '1' ? 'pulse' : key === '2' ? 'twin' : key === '3' ? 'trident' : key === '4' ? 'compass' : key === '5' ? 'halo' : undefined); }
    else if (key === 'e' || key === 'shift') { if (!e.repeat) activateShield(); }
    else if (key === 'p' || key === 'escape') { if (!e.repeat) pause(); }
    else { keys.add(key); if (key === ' ') fire(); }
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  function steer(e) { const r = canvas.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top, id: e.pointerId }; }
  canvas.addEventListener('pointerdown', e => { if (state !== 'playing' || pointer) return; canvas.setPointerCapture(e.pointerId); steer(e); canvas.focus({ preventScroll: true }); });
  canvas.addEventListener('pointermove', e => { if (pointer?.id === e.pointerId) steer(e); });
  const release = e => { if (pointer?.id === e.pointerId) pointer = null; };
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, release);
  fireButton.addEventListener('pointerdown', e => { if (state !== 'playing' || firePointer !== null) return; e.preventDefault(); fireButton.setPointerCapture(e.pointerId); firePointer = e.pointerId; fire(); });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) fireButton.addEventListener(event, e => { if (firePointer === e.pointerId) firePointer = null; });
  // Keyboard activation remains available for the visible mobile fire button.
  fireButton.addEventListener('click', e => { if (e.detail === 0) fire(); });
  window.addEventListener('blur', () => { clearInput(); if (state === 'playing'||state==='intro') pause(); });
  document.addEventListener('visibilitychange', () => { if(document.hidden && (state==='playing'||state==='intro'))pause();if(state==='ending')music.setPlaying(9,!document.hidden);if(state==='menu')music.setPlaying(10,!document.hidden); });
  if(globalThis.OrbitUI)ui=OrbitUI.create({start:startNewRun,menu:openTitle,pause,state:()=>state,creditsDone:()=>state==='gameover'?endGameOver():endCredits()});
  new ResizeObserver(resize).observe(field); resize(); hud(); weaponHud(); music.setPlaying(level, false); updateMusicHud(music.status());if(ui)openTitle(); requestAnimationFrame(frame);
})();
