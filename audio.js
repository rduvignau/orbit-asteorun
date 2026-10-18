/* Original, locally synthesized soundtracks. No audio downloads or autoplay required. */
(() => {
  'use strict';
  const tracks = {
    1: { name: 'Belt Runner', bpm: 112, root: 38, wave: 'triangle', kicks: [0, 6, 8, 11], hats: [0, 2, 4, 6, 8, 10, 12, 14], bass: [0, -1, 0, -1, 7, -1, 0, -1, 0, -1, 10, -1, 7, -1, 3, -1], lead: [12, -1, 19, -1, 15, -1, 22, -1, 19, -1, 15, 14, 12, -1, 10, -1], roots: [0, 0, -2, 3] },
    2: { name: 'Echoes Below', bpm: 88, root: 33, wave: 'sine', kicks: [0, 7, 10], hats: [2, 5, 8, 11, 14], bass: [0, -1, -1, 0, -1, -1, 7, -1, 0, -1, 3, -1, -1, 7, -1, -1], lead: [19, -1, -1, 15, -1, 12, -1, -1, 10, -1, 12, -1, -1, 7, -1, -1], roots: [0, -2, 3, -5] },
    3: { name: 'Night Shift on the Sun', bpm: 138, root: 36, wave: 'sawtooth', kicks: [0, 4, 8, 12], hats: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], bass: [0, 0, -1, 7, 0, -1, 10, 7, 0, 0, -1, 3, 0, -1, 7, 10], lead: [12, -1, 12, 19, -1, 15, -1, 22, 19, -1, 15, -1, 14, 12, -1, 10], roots: [0, 0, 3, -2] },
    4: { name: 'Riding the Aurora', bpm: 124, root: 35, wave: 'triangle', kicks: [0, 3, 8, 10], hats: [0, 2, 3, 6, 8, 10, 11, 14], bass: [0, -1, 7, 0, -1, 10, -1, 7, 0, -1, 3, -1, 7, -1, 10, -1], lead: [19, -1, 24, -1, 22, 19, -1, 15, 17, -1, 19, -1, 15, 14, -1, 12], roots: [0, 3, -2, -5] },
    5: { name: 'The Cathedral Breathes', bpm: 148, root: 32, wave: 'sine', kicks: [0, 5, 8, 14], hats: [0, 3, 6, 8, 11, 14], bass: [0, -1, 7, -1, 0, 3, -1, 10, 0, -1, 7, 3, -1, 0, -1, 10], lead: [24, -1, 19, 22, -1, 15, -1, 19, 27, -1, 24, -1, 22, 19, -1, 15], roots: [0, 3, 7, -2] },
    6: {name:'Saltwater Stars',bpm:116,root:30,wave:'triangle',kicks:[0,3,6,10,13],hats:[0,3,6,8,10,13],bass:[0,-1,-1,7,-1,-1,3,-1,0,-1,10,-1,-1,7,-1,3],lead:[24,-1,-1,19,-1,22,-1,-1,15,-1,19,-1,-1,12,15,-1],roots:[0,5,3,-2]},
    7:{name:'Seven Seconds to Midnight',bpm:98,root:37,wave:'sine',odd:true,kicks:[0,7,10],hats:[0,3,6,8,11,14],bass:[0,-1,-1,7,-1,3,-1,-1,0,-1,10,-1,-1,7,-1,-1],lead:[24,19,27,22,15,19,12],roots:[0,-2,5,3]},
    8:{name:'A Star to Bring Home',bpm:156,root:36,wave:'triangle',kicks:[0,4,8,11,12],hats:[0,2,4,6,8,10,12,14],bass:[0,0,-1,7,0,-1,10,7,0,0,-1,3,0,7,10,-1],lead:[12,19,24,-1,22,19,15,-1,24,27,24,22,19,-1,15,12],roots:[0,3,5,7]},
    9:{name:'The Long Way Home',bpm:80,root:43,wave:'sine',kicks:[0,10],hats:[2,6,10,14],bass:[0,-1,-1,-1,7,-1,-1,-1,3,-1,-1,-1,10,-1,-1,-1],lead:[12,-1,-1,19,-1,24,-1,-1,22,-1,-1,19,-1,15,-1,-1],roots:[0,5,3,7]},
    10:{name:'Ignition / Main Menu',rock:true,bpm:132,root:33,wave:'sawtooth',kicks:[0,3,6,8,10,14],hats:[0,2,4,6,8,10,12,14],bass:[0,0,-1,0,7,-1,0,0,0,-1,10,7,0,0,3,7],lead:[12,-1,-1,15,19,-1,15,-1,12,-1,10,-1,7,-1,10,12],roots:[0,0,3,-2]}

  };
  // Fixed PCM effects start immediately, independent of a rounded AudioContext clock.
  // A short oscillator scheduled at currentTime can otherwise end before rendering starts.
  const effectSpecs = {impact:[.32,360,150,.72],explode:[1.35,185,58,.68],checkpoint:[.5,440,1760,.42],shoot:[.14,1450,420,.42],hit:[.18,430,95,.52],hurt:[.38,780,230,.58],destroy:[.85,420,40,.62],shield:[.2,650,1550,.38],pickup:[.28,520,1400,.4]};
  function effectSamples(kind, sampleRate) {
    const [duration,from,to,amplitude]=effectSpecs[kind] || effectSpecs.hit;
    const data=new Float32Array(Math.ceil(sampleRate*duration));let phase=0,noiseState=0x6d2b79f5,air=0;
    for(let i=0;i<data.length;i++){
      const t=i/sampleRate,progress=t/duration,frequency=from*(to/from)**progress;phase+=2*Math.PI*frequency/sampleRate;
      const attack=kind==='explode'?.04:kind==='impact'?.003:.006;
      const release=kind==='explode'?.48:kind==='impact'?.12:.055;
      const decay=kind==='impact'?Math.exp(-t*13):kind==='explode'?Math.exp(-t*.82):1;
      const envelope=Math.min(1,t/attack)*Math.min(1,(duration-t)/release)*(1-progress*.45)*decay;
      const tone=Math.sin(phase)*.78+Math.sin(phase*2)*.17+Math.sin(phase*3)*.05;
      let texture=(['hit','hurt','destroy'].includes(kind))?Math.sin(i*127.1)*Math.sin(i*311.7)*.22:0;
      let body=tone;
      if(kind==='impact'){
        // A quiet wooden tok: rounded resonances and a fast natural decay, with no laser-like sweep.
        body=Math.sin(phase)*.48+Math.sin(phase*1.52)*.3+Math.sin(2*Math.PI*215*t)*.18+Math.sin(phase*2.2)*.12;
        if(t>.07)body+=Math.sin(2*Math.PI*410*(t-.07))*Math.exp(-(t-.07)*24)*.13;
      }
      if(kind==='explode'){
        // A soft, airy bass bloom with a gently falling midrange tone and no sharp crack.
        body=Math.sin(phase)*.68+Math.sin(phase*2)*.27+Math.sin(phase*.58)*.34+Math.sin(2*Math.PI*250*t)*.13;
        texture=Math.sin(i*127.1)*Math.sin(i*311.7)*.025*Math.exp(-t*3);
      }
      data[i]=(body+texture)*amplitude*envelope;
    }
    return data;
  }
  const FX_GAIN = .055; // A browser output check showed the former bus left combat cues effectively inaudible.
  const midi = note => 440 * 2 ** ((note - 69) / 12);
  function createMusic(onChange = () => {}) {
    let context, master, fxMaster, noise, timer, next = 0, step = 0, level = 1, playing = false, enabled = true, volume = .4;
    const voices = new Set(), effects = new Set(), lastEffect = {}, effectBuffers = new Map();
    let priorityUntil=0;
    let sfxEnabled = true, effectsVolume = .5, resumingEffect = false;
    try {
      sfxEnabled=localStorage.getItem('orbit-sfx-muted')!=='1';
      const saved=localStorage.getItem('orbit-sfx-volume'), calibrated=localStorage.getItem('orbit-sfx-calibration')==='2';
      effectsVolume=saved==null?.5:Math.max(0,Math.min(1,Number(saved)))*(calibrated?1:.5);
      localStorage.setItem('orbit-sfx-volume',String(effectsVolume));localStorage.setItem('orbit-sfx-calibration','2');
    } catch {}
    try { enabled = localStorage.getItem('orbit-music-muted') !== '1'; volume = Math.max(0, Math.min(1, Number(localStorage.getItem('orbit-music-volume') ?? .4))); } catch {}
    const status = () => ({ enabled, sfxEnabled, volume, effectsVolume, playing, level, available: !!(globalThis.AudioContext || globalThis.webkitAudioContext), running: !!timer, name: tracks[level].name });
    function stopQueue() {
      if (timer) clearInterval(timer); timer = null;
      for (const source of voices) { try { source.stop(); } catch {} } voices.clear();
    }
    function voice(source, time, duration, pool = voices) {
      pool.add(source); source.onended = () => pool.delete(source); source.start(time); source.stop(time + duration);
    }
    function tone(note, time, duration, gain, wave = 'triangle', cutoff = 1800) {
      const oscillator = context.createOscillator(), envelope = context.createGain(), filter = context.createBiquadFilter();
      oscillator.type = wave; oscillator.frequency.value = midi(note); filter.type = 'lowpass'; filter.frequency.value = cutoff;
      envelope.gain.setValueAtTime(.0001, time); envelope.gain.exponentialRampToValueAtTime(gain, time + .012); envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
      oscillator.connect(filter); filter.connect(envelope); envelope.connect(master); voice(oscillator, time, duration + .03);
    }
    function percussion(type, time, strength = 1) {
      const gain = context.createGain(); gain.connect(master);
      if (type === 'kick') {
        const source = context.createOscillator(); source.frequency.setValueAtTime(140, time); source.frequency.exponentialRampToValueAtTime(42, time + .16);
        gain.gain.setValueAtTime(.6 * strength, time); gain.gain.exponentialRampToValueAtTime(.0001, time + .24); source.connect(gain); voice(source, time, .26);
      } else {
        const source = context.createBufferSource(), filter = context.createBiquadFilter(); source.buffer = noise; filter.type = 'highpass'; filter.frequency.value = type === 'snare' ? 1500 : 6500;
        const duration = type === 'snare' ? .13 : .035;
        gain.gain.setValueAtTime((type === 'snare' ? .19 : .045) * strength, time); gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
        source.connect(filter); filter.connect(gain); voice(source, time, duration + .01);
      }
    }
    function schedule() {
      const track = tracks[level], sixteenth = 60 / track.bpm / 4;
      while (next < context.currentTime + .12) {
        const slot = step % 16, bar = Math.floor(step / 16), root = track.root + track.roots[Math.floor(bar / 2) % track.roots.length];
        if (track.kicks.includes(slot)) percussion('kick', next);
        if (slot === 4 || slot === 12) percussion('snare', next);
        if (track.hats.includes(slot)) percussion('hat', next, slot % 2 ? .55 : 1);
        if (track.bass[slot] >= 0) tone(root + track.bass[slot], next, sixteenth * 1.4, .15, 'triangle', 650);
        const melody = track.lead[track.odd?step%track.lead.length:(slot + (bar % 4 === 3 ? 4 : 0)) % 16];
        if (melody >= 0) tone(root + 12 + melody, next, sixteenth * (level === 2 ? 2.8 : 1.6), .055, track.wave, level === 3 ? 1100 : 2300);
        if(track.rock){
          // Short fifths alternate with ringing power chords: an original garage-rock riff.
          if([0,3,6,8,10,14].includes(slot))for(const interval of [12,19,24])tone(root+interval,next,sixteenth*(slot===0||slot===8?2.7:.75),.047,'sawtooth',slot===0||slot===8?2600:1300);
          if(slot===4||slot===12)tone(45,next,.12,.15,'triangle',900);
          if(slot===0&&bar%4===0)percussion('snare',next,.7);
        }
        if (slot === 0 && !track.rock) for (const interval of [12, 15, 19]) tone(root + interval, next, sixteenth * 15, .022, 'sine', 1000);
        step++; next += sixteenth;
      }
    }
    function ensureContext() {
      if (context) return true;
      const Constructor = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Constructor) { onChange(status()); return false; }
      context = new Constructor(); master = context.createGain(); master.gain.value = volume * .3; master.connect(context.destination);
      fxMaster = context.createGain(); fxMaster.gain.value = effectsVolume * FX_GAIN; fxMaster.connect(context.destination);
      noise = context.createBuffer(1, context.sampleRate * .2, context.sampleRate);
      const data = noise.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      return true;
    }
    function stopEffects() { for (const source of effects) { try { source.stop(); } catch {} } effects.clear(); }
    function sync(preserveEffects = false) {
      if (!playing || (!(enabled && volume > 0) && !(sfxEnabled && effectsVolume > 0))) { stopQueue(); if(!preserveEffects)stopEffects(); onChange(status()); return; }
      if (!enabled || volume===0) stopQueue();
      try {
        if (!ensureContext()) return;
        const begin = () => {
          if (!playing || context.state !== 'running') return;
          if (enabled && volume>0 && !timer) { master.gain.setTargetAtTime(volume * .3, context.currentTime, .02); next = context.currentTime + .03; schedule(); timer = setInterval(schedule, 25); }
          onChange(status());
        };
        context.resume().then(begin).catch(() => onChange(status()));
      } catch { stopQueue(); stopEffects(); }
      onChange(status());
    }
    function playEffect(kind, preview = false) {
      if ((!playing && !preview) || !sfxEnabled || effectsVolume === 0) return false;
      try { if (!ensureContext()) return false; } catch { return false; }
      if (context.state !== 'running') {
        if (!resumingEffect) { resumingEffect = true; context.resume().then(() => { resumingEffect = false; if (context.state === 'running') { if(playing)sync(); playEffect(kind,preview); } }).catch(() => { resumingEffect = false; onChange(status()); }); }
        return false;
      }
      // Performance time is monotonic and independent of the audio clock's precision.
      const now=(globalThis.performance?.now?.() ?? context.currentTime*1000)/1000;
      if (!preview && now-(lastEffect[kind] ?? -10)<(kind==='hurt'?.25:kind==='hit'?.055:.075)) return false;
      if(!preview && now<priorityUntil && !['hurt','destroy'].includes(kind))return false;
      if(kind==='hurt'||kind==='destroy'){stopEffects();priorityUntil=now+(kind==='destroy'?.85:.18);}
      lastEffect[kind]=now;
      if (effects.size>=16) {const oldest=effects.values().next().value;try{oldest.stop();}catch{}effects.delete(oldest);}
      if (!effectBuffers.has(kind)) {
        const samples=effectSamples(kind,context.sampleRate),buffer=context.createBuffer(1,samples.length,context.sampleRate);
        buffer.getChannelData(0).set(samples);effectBuffers.set(kind,buffer);
      }
      const source=context.createBufferSource();source.buffer=effectBuffers.get(kind);
      // Keep impacts and explosions tucked below the other effects in the mix.
      const cueGain=context.createGain();cueGain.gain.value=kind==='impact'?.38:kind==='explode'?.42:1;
      source.connect(cueGain);cueGain.connect(fxMaster);
      effects.add(source);source.onended=()=>effects.delete(source);
      // start(0) means "now" even with privacy rounding, tab interruptions or CPU stalls.
      // The buffer ends naturally; scheduling stop(currentTime + duration) could truncate it.
      source.start(0);return true;
    }
    const effect = kind => playEffect(kind);
    async function previewEffect(kind = 'shoot') {
      sfxEnabled=true;if(effectsVolume===0)effectsVolume=.5;
      try{localStorage.setItem('orbit-sfx-muted','0');localStorage.setItem('orbit-sfx-volume',String(effectsVolume));}catch{}
      try {
        if(!ensureContext())return false;
        await context.resume();fxMaster.gain.setTargetAtTime(effectsVolume*FX_GAIN,context.currentTime,.01);
        const result=playEffect(kind,true);onChange(status());return result;
      }catch{onChange(status());return false;}
    }

    return {
      setPlaying(newLevel, active, preserveEffects = false) { if (level !== newLevel) { stopQueue(); stopEffects(); step = 0; } level = newLevel; playing = active; sync(preserveEffects); },
      toggle() { enabled = !enabled; try { localStorage.setItem('orbit-music-muted', enabled ? '0' : '1'); } catch {} sync(); },
      toggleEffects() { sfxEnabled = !sfxEnabled; if (!sfxEnabled) stopEffects(); try { localStorage.setItem('orbit-sfx-muted', sfxEnabled ? '0' : '1'); } catch {} sync(); },
      effect, previewEffect,
      setEffectsVolume(value) { effectsVolume=Math.max(0,Math.min(1,Number(value)||0));if(fxMaster)fxMaster.gain.setTargetAtTime(effectsVolume*FX_GAIN,context.currentTime,.01);try{localStorage.setItem('orbit-sfx-volume',String(effectsVolume));}catch{}if(effectsVolume===0)stopEffects();sync(); },
      setVolume(value) { volume = Math.max(0, Math.min(1, Number(value) || 0)); if (master) { master.gain.setTargetAtTime(volume * .3, context.currentTime, .02);  } try { localStorage.setItem('orbit-music-volume', String(volume)); } catch {} sync(); },
      status, dispose() { playing = false; stopQueue(); stopEffects(); if (context) context.close(); }
    };
  }
  globalThis.OrbitAudio = { createMusic, tracks, effectSamples, FX_GAIN };
})();
