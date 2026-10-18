(() => {
  'use strict';
  const weapons = {
    pulse: { label: 'Ⅰ PULSE', name: 'Pulse', color: '#b4f5ff', cost: 0, cooldown: .16, shots: [[0, 0]] },
    twin: { label: 'Ⅱ TWIN LASER', name: 'Twin laser', color: '#dfcaff', cost: 1, cooldown: .23, shots: [[-11, 0], [11, 0]] },
    trident: { label: 'Ⅲ TRIDENT', name: 'Trident', color: '#ffd278', cost: 1.5, cooldown: .32, shots: [[0, -.21], [0, 0], [0, .21]] },
    compass: { label: 'Ⅳ COMPASS', name: 'Compass', color: '#c4ff8c', cost: 1.8, cooldown: .28, shots: [[0, -Math.PI / 2], [0, 0], [0, Math.PI / 2]] },
    halo: { label: 'Ⅴ HALO', name: 'Halo', color: '#ffb7db', cost: 2.5, cooldown: .48, shots: Array.from({length:12},(_,i)=>[0,i*Math.PI/6]) }
  };
  function volley(weapon, x, y) {
    return weapons[weapon].shots.map(([offset, angle]) => ({ x: (weapon === 'compass' && angle !== 0 || weapon === 'halo') ? x - 23 : x, y: y + offset, previousX: (weapon === 'compass' && angle !== 0 || weapon === 'halo') ? x - 23 : x, previousY: y + offset,
      vx: Math.cos(angle) * 650, vy: Math.sin(angle) * 650, weapon }));
  }
  // Swept collision works for both straight lasers and the Trident's diagonal projectiles.
  function hitsCircle(bullet, x, y, radius) {
    const ax = bullet.previousX, ay = bullet.previousY ?? bullet.y;
    const dx = bullet.x - ax, dy = bullet.y - ay, length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
    return Math.hypot(x - ax - t * dx, y - ay - t * dy) < radius;
  }
  const best = (owned, charge) => ['halo', 'compass', 'trident', 'twin', 'pulse'].find(id => owned.has(id) && (id === 'pulse' || charge[id] > 0)) || 'pulse';
  globalThis.OrbitArsenal = { weapons, volley, hitsCircle, best, MAX_LIVES: 5 };
})();
