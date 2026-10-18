/* Campaign data lives here; gameplay systems consume the same timing and metadata. */
(() => {
  const stage = (at, title, message) => ({ at, title, message });
  globalThis.OrbitLevels = {
    1: { name: 'The Shattered Passage', sector: 'SECTOR 07 / THE OUTER BELT', tag: 'BELT / SENTINEL',
      eyebrow: 'A LITTLE SHIP. A LOT OF SPACE.', subtitle: 'Break the belt. Take down the Sentinel.',
      duration: 56, repairs: [24, 43], supplies: [],
      stages: [stage(0, '01 / THE APPROACH', 'LASERS ONLINE · Hold Space or FIRE to shoot'), stage(16, '02 / THE NARROWS', 'THE NARROWS · Walls ahead. Find the open channel.'), stage(34, '03 / SHATTER ZONE', 'SHATTER ZONE · Big rocks. Bigger scores.'), stage(50, '04 / THE WATCHER', 'WARNING · A massive signature blocks the exit.'), stage(56, 'BOSS / THE SENTINEL', 'THE SENTINEL · Destroy its glowing core!')] },
    2: { name: 'The Echo Caverns', sector: 'SECTOR 08 / THE ECHO CAVERNS', tag: 'CAVERNS / IRIS',
      eyebrow: 'BEYOND THE BELT. BELOW THE SURFACE.', subtitle: 'Something down here is listening.',
      duration: 78, midpoint: 39, mini: 'harrow', boss: 'iris', repairs: [24, 62], supplies: [[14, 'twin'], [65, 'twin']],
      stages: [stage(0, '01 / CAVERN MOUTH', 'THE ECHO CAVERNS · Stay clear of the rock. Patrols incoming.'), stage(12, '02 / THE HUNTING GROUND', 'HOSTILE PATROLS · Teal fire is yours. Red fire is theirs.'), stage(36, '03 / THE HARROW', 'CONTACT AHEAD · Something is guarding the passage.'), stage(39, '04 / CRYSTAL FAULT', 'CRYSTAL FAULT · The path bends. Keep moving.'), stage(54, '05 / THE DEEP CHOIR', 'THE DEEP CHOIR · Heavy patrols ahead.'), stage(68, '06 / THE SEALED HEART', 'THE SEALED HEART · A shielded signature lies ahead.'), stage(78, 'BOSS / THE IRIS', 'THE IRIS · Dodge the scan. Fire when the core opens.')] },
    3: { name: 'The Clockwork Sun', sector: 'SECTOR 09 / HELIOS ORBITAL FOUNDRY', tag: 'FOUNDRY / HELIOS',
      eyebrow: 'AT THE EDGE OF A STAR. INSIDE THE MACHINE.', subtitle: 'The factory is awake. And you are not on the guest list.',
      speeds: [[0, 1.12]], duration: 108, midpoint: 54, mini: 'riveter', boss: 'helios', repairs: [18, 39, 73, 94], supplies: [[8, 'twin'], [23, 'trident'], [63, 'twin'], [74, 'trident'], [100, 'trident']],
      stages: [stage(0, '01 / SUNRISE SHIFT', 'THE CLOCKWORK SUN · Watch the sliding presses. Repair cells reinforce your hull.'), stage(10, '02 / THE ASSEMBLY LINE', 'NEEDLE INTERCEPTORS · They lock, then charge. Sidestep the warning line.'), stage(25, '03 / TEETH OF THE MACHINE', 'TRIDENT SUPPLY · Three-way fire. Your equipped upgrade is lost on a hit.'), stage(48, '04 / THE RIVETER', 'MIDPOINT CONTACT · The foreman has noticed you.'), stage(54, '05 / AFTER HOURS', 'THE LINE RESTARTS · More presses. Less supervision.'), stage(76, '06 / THE HOT WORKS', 'THE HOT WORKS · Shoot cargo. Avoid rotors. Keep your upgrades safe.'), stage(100, '07 / HEART OF THE SUN', 'HELIOS ENGINE · Three power coils feed the reactor.'), stage(108, 'BOSS / HELIOS ENGINE', 'HELIOS · Double rivet waves. Break the coils, then the core.')] },
    4: { name: 'The Glass Meridian', sector: 'SECTOR 10 / THE AURORA WAKE', tag: 'ION STORM / NULL REGENT',
      eyebrow: 'THE STORM IS BEHIND YOU. THE ONLY WAY IS THROUGH.', subtitle: 'Chase the quiet space between the lightning.',
      duration: 132, midpoint: 66, mini: 'reaper', boss: 'regent', repairs: [24, 51, 91, 119],
      speeds: [[0, 1], [18, 1.3], [34, .9], [49, 1.4], [65, 1.1], [79, 1.4], [95, .95], [112, 1.5], [126, 1]],
      fronts: [20, 44, 83, 111], supplies: [[16, 'twin'], [30, 'trident'], [58, 'trident'], [78, 'twin'], [102, 'trident'], [124, 'trident']],
      stages: [stage(0, '01 / BLUE HOUR', 'THE GLASS MERIDIAN · Charged weapons. Variable speed. Watch your six.'), stage(6, '02 / AEGIS ONLINE', 'AEGIS ONLINE · E / Shift or SHIELD. Absorb fire; timed blocks return a shot.'), stage(18, '03 / THE PURSUIT', 'ION FRONT INBOUND · Move RIGHT before the storm catches your tail.'), stage(35, '04 / SHATTERED LIGHT', 'SHEAR GATES · Read the moving openings. Break ice prisms for charge.'), stage(60, '05 / THE WAKE REAPER', 'THE WAKE REAPER · Change lanes when it marks a charge.'), stage(66, '06 / INTO THE CURRENT', 'THE WAKE IS OPEN · The storm has not finished with you.'), stage(94, '07 / WHITEOUT', 'WHITEOUT · Faster currents. Keep a charged weapon in reserve.'), stage(124, '08 / THE LAST AURORA', 'NULL REGENT · Track the moving heart. Aegis can turn its fire against it.'), stage(132, 'BOSS / NULL REGENT', 'THE NULL REGENT · The storm has a heartbeat. Stop it.')] },
    5: { name: 'The Verdant Maw', sector: 'SECTOR 11 / THE LIVING CATHEDRAL', tag: 'BIOSPHERE / THORN SOVEREIGN',
      eyebrow: 'THE STARS END HERE. SOMETHING ELSE IS GROWING.', subtitle: 'Fly softly. The cathedral has teeth.',
      duration: 172, midpoint: 86, mini: 'warden', boss: 'sovereign', repairs: [22, 53, 76, 115, 146, 162],
      speeds: [[0, 1.08], [28, 1.2], [55, 1.05], [80, 1.25], [100, 1.15], [130, 1.35], [160, 1.1]],
      supplies: [[8, 'twin'], [19, 'compass'], [40, 'trident'], [62, 'compass'], [96, 'compass'], [119, 'twin'], [138, 'trident'], [157, 'compass']],
      stages: [stage(0, '01 / SPORELIGHT', 'THE VERDANT MAW · Aegis ready. The forest is watching.'), stage(13, '02 / THE CHOIR', 'CHOIR FORMATIONS · Flocks hold their shape. Break a path through.'), stage(20, '03 / FOUR DIRECTIONS', 'COMPASS LASER · Single beams UP, DOWN and FORWARD. Q or 4 to select.'), stage(30, '04 / FALLING ORBITS', 'GRAVITY SEEDS · Rings show their pull. Steer wide of the bright cores.'), stage(78, '05 / THE ROOT WARDEN', 'ROOT WARDEN · Read the amber growth warning. The tunnel will change.'), stage(86, '06 / WILD GROWTH', 'THE ROOTS RELEASE · Deeper flocks. Stronger currents.'), stage(118, '07 / THE HANGING GARDEN', 'HANGING GARDEN · Gravity bends your path. Use Aegis to cross fire.'), stage(156, '08 / THE THORN THRONE', 'THORN SOVEREIGN · Four living batteries guard its heart.'), stage(172, 'BOSS / THORN SOVEREIGN', 'BREAK THE FOUR BATTERIES · Each destroyed part silences its weapon.')] },
    6: { name: 'The Abyssal Nursery', sector: 'SECTOR 12 / THE TIDAL HIVE', tag: 'ALIEN OCEAN / LEVIATHAN',
      eyebrow: 'UNDER AN ALIEN SEA. NOTHING HERE IS EMPTY.', subtitle: 'Some things in the deep are on your side.',
      duration:192, midpoint:96, mini:'ferryman', boss:'leviathan', repairs:[6,31,62,88,121,151,177],
      speeds:[[0,1.1],[35,1.2],[70,1.08],[92,1.25],[115,1.14],[150,1.3],[180,1.16]],
      supplies:[[9,'twin'],[22,'halo'],[45,'compass'],[70,'halo'],[107,'trident'],[128,'halo'],[154,'compass'],[178,'halo'],[188,'halo']],
      stages:[stage(0,'01 / FIRST DESCENT','THE ABYSSAL NURSERY · Aegis ready. Repair beacon ahead. Watch your wake.'),stage(15,'02 / THE STINGING SEA','DRIFTERS · Hostiles approach from BOTH sides. Keep room to turn.'),stage(23,'03 / HALO PROTOCOL','HALO · Twelve single lasers in a full circle. Q or 5 to select.'),stage(30,'04 / AN UNLIKELY FRIEND','A SMALL SIGNAL · A blue-gold larva is asking for help. Find it.'),stage(45,'05 / THE BREATHING REEF','TIDAL VENTS · Amber outlines warn before hot jets erupt.'),stage(88,'06 / THE BROOD FERRYMAN','BROOD FERRYMAN · It swims across the passage. Halo covers your blind side.'),stage(96,'07 / THE DEEPER PACT','SYMBIOSIS · Your rescued companion awakens when you activate Aegis.'),stage(128,'08 / THE BLACKWATER CHOIR','BLACKWATER · Pincer formations. More drifters. Keep charged reserves.'),stage(179,'09 / SOMETHING BELOW','LEVIATHAN · A straight warning marks its breach. Leave the middle lane.'),stage(192,'BOSS / THE LEVIATHAN','LEVIATHAN · Dodge the breach. Strike its luminous head.')]
    },
    7:{name:'The Parallax Observatory',sector:'SECTOR 13 / THE FRACTURED SKY',tag:'TIME LENSES / PARALLAX CURATOR',
      eyebrow:'THE SKY IS BROKEN. EVERY PIECE REMEMBERS.',subtitle:'Somewhere between the seconds, a star is waiting.',
      duration:210,midpoint:105,mini:'secondhand',boss:'curator',repairs:[26,67,91,138,174,198],
      speeds:[[0,1.08],[40,1.18],[78,1.06],[102,1.2],[130,1.12],[166,1.24],[200,1.1]],
      supplies:[[7,'twin'],[24,'trident'],[40,'halo'],[62,'compass'],[86,'halo'],[119,'halo'],[143,'trident'],[168,'compass'],[190,'halo'],[204,'halo']],
      stages:[stage(0,'01 / THE UNFINISHED SKY','THE PARALLAX OBSERVATORY · Three continues for the entire expedition. Use them wisely.'),stage(12,'02 / ORBITS DIVIDED','SPLIT ORBITS · Take the high path for charge, the low path for repair.'),stage(25,'03 / BETWEEN SECONDS','TIME LENSES · Shots and asteroids slow inside. Your steering stays responsive.'),stage(48,'04 / THE GLASS ARCHIVE','PRISM MOTHS · Curved approaches. Three-shot salvos. Keep a reserve.'),stage(91,'05 / THE SECOND HAND','SECOND HAND · A marked wedge warns before its clock-hand sweep.'),stage(105,'06 / THE SKY UNFOLDS','THE OBSERVATORY OPENS · Beyond the clock, the stars are in motion.'),stage(133,'07 / LOST CONSTELLATIONS','LOST CONSTELLATIONS · Use the time lenses to read incoming fire.'),stage(169,'08 / PARALLAX','OPTICAL ECHOES · Violet copies are harmless. Golden stars mark the true core.'),stage(200,'09 / ONE TRUE STAR','THE CURATOR · Follow the gold. Your companion can help show the way.'),stage(210,'BOSS / PARALLAX CURATOR','PARALLAX CURATOR · Three golden stars. One true core.')]
    },
    8:{name:'The Last Light',sector:'SECTOR 14 / THE DAWN ENGINE',tag:'STELLAR HEART / THE LAST LIGHT',eyebrow:'THE END OF THE DARK. THE BEGINNING OF THE LIGHT.',subtitle:'Bring a star home.',
      duration:232,midpoint:116,mini:'cinders',boss:'dawn',repairs:[24,58,91,139,175,211,225],
      speeds:[[0,1.12],[35,1.26],[72,1.1],[110,1.28],[140,1.16],[177,1.36],[220,1.12]],
      supplies:[[6,'twin'],[21,'halo'],[43,'compass'],[67,'trident'],[95,'halo'],[128,'halo'],[151,'compass'],[177,'trident'],[201,'halo'],[224,'halo'],[230,'halo']],
      stages:[stage(0,'01 / THE ECLIPSED SUN','THE LAST LIGHT · Stellar currents warn before pushing. Keep room to steer.'),stage(22,'02 / WHITE GOLD','PLASMA GALLERIES · Moving apertures. Break capacitors for charge.'),stage(56,'03 / AGAINST THE CURRENT','CURRENT REVERSAL · Your steering still overpowers the flow.'),stage(100,'04 / THE GATE OF CINDERS','THE FINAL GATE · A fortress guards the heart of the star.'),stage(116,'05 / THE OPEN FURNACE','THE GATE IS OPEN · The entire engine is waking.'),stage(154,'06 / ALL THE LITTLE LIGHTS','THE LAST APPROACH · Protect your reserves. Your companion is with you.'),stage(205,'07 / ONE MORE SUNRISE','DAWN ENGINE · Four emitters feed the collapsing star.'),stage(232,'BOSS / THE DAWN ENGINE','THE DAWN ENGINE · Break its emitters, survive overload, extinguish the last heart.')]
    }
  };
  const transmissions=[
    'Flight control: one small ship, one open channel. Beyond this belt, the stars are waiting.',
    'The rock is singing. Patrol signatures below the surface. Follow the light into the Echo Caverns.',
    'An orbital factory is still working around a dead shift. The Clockwork Sun does not know when to stop.',
    'A storm is crossing your wake. Aegis is waiting ahead. The only way out is through.',
    'The cathedral is alive. Its roots bend around a sovereign heart. Fly softly. It has teeth.',
    'Under the alien sea, a tiny signal answers yours. Not everything in the nursery is your enemy.',
    'The sky has broken into pieces of time. Find the true star among the echoes. Keep your little light close.',
    'This is the last passage. Every world brought you here. Break the Dawn Engine, and bring a star home.'
  ];
  for(let i=1;i<=8;i++)globalThis.OrbitLevels[i].transmission=transmissions[i-1];
  globalThis.OrbitScrollSpeed = (level, progress) => {
    const keys = globalThis.OrbitLevels[level].speeds || [[0, 1]];
    let i = 0; while (i < keys.length - 1 && progress >= keys[i + 1][0]) i++;
    if (i === keys.length - 1) return keys[i][1];
    const a = keys[i], b = keys[i + 1], t = Math.max(0, Math.min(1, (progress - a[0]) / (b[0] - a[0])));
    return a[1] + (b[1] - a[1]) * t * t * (3 - 2 * t);
  };
})();
