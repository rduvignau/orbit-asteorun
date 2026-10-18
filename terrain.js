/* One authored world-space cave, shared by drawing, collisions, and spawn placement. */
(() => {
  'use strict';
  const route = [
    [0, .13, .87], [650, .17, .81], [1350, .27, .86],
    [2050, .12, .67], [2650, .18, .82], [3300, .14, .86],
    [3850, .12, .88], [5400, .12, .88], [5800, .25, .84],
    [6300, .15, .71], [6750, .27, .84], [7250, .15, .79],
    [7700, .10, .90], [11000, .10, .90]
  ];
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  function noise(x, seed) {
    const n = Math.floor(x), t = smooth(x - n);
    return lerp(hash(n + seed), hash(n + seed + 1), t) * 2 - 1;
  }
  function profile(worldX) {
    const x = Math.max(0, worldX);
    let i = 0;
    while (i < route.length - 2 && x > route[i + 1][0]) i++;
    const a = route[i], b = route[i + 1], t = smooth(Math.min(1, (x - a[0]) / (b[0] - a[0])));
    const rough = noise(x / 90, 17) * .012 + noise(x / 25, 51) * .004;
    const teeth = Math.pow((Math.sin(x / 58) + 1) / 2, 7) * .018;
    return {
      top: lerp(a[1], b[1], t) + rough + teeth,
      bottom: lerp(a[2], b[2], t) + noise(x / 100, 89) * .012 - teeth
    };
  }
  const scale = (width, height) => Math.max(height / 540, width / 1500);
  function bounds(x, width, height, distance) {
    const p = profile(distance + x / scale(width, height));
    return { top: p.top * height, bottom: p.bottom * height };
  }
  function hitsCircle(x, y, radius, width, height, distance) {
    for (const offset of [-1, -.5, 0, .5, 1]) {
      const dx = offset * radius, dy = Math.sqrt(Math.max(0, radius * radius - dx * dx));
      const p = bounds(x + dx, width, height, distance);
      if (y - dy <= p.top || y + dy >= p.bottom) return true;
    }
    return false;
  }
  function draw(ctx, width, height, distance) {
    const unit = scale(width, height), samples = [];
    for (let x = -8; x <= width + 8; x += 8) samples.push({ x, ...bounds(x, width, height, distance) });
    function silhouette(side, offset, fill, stroke) {
      ctx.beginPath(); ctx.moveTo(-8, side === 'top' ? 0 : height);
      for (const p of samples) ctx.lineTo(p.x, p[side] + offset);
      ctx.lineTo(width + 8, side === 'top' ? 0 : height); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }
    // Distant shelves, then the actual collision surface.
    silhouette('top', height * .035, '#16303855'); silhouette('bottom', -height * .035, '#16303855');
    silhouette('top', 0, '#172a31', '#467078'); silhouette('bottom', 0, '#172a31', '#467078');
    for (let layer = 1; layer <= 4; layer++) {
      for (const side of ['top', 'bottom']) {
        ctx.beginPath();
        samples.forEach((p, i) => {
          const worldX = distance + p.x / unit;
          const y = p[side] + (side === 'top' ? -1 : 1) * (layer * 13 + noise(worldX / 180, layer * 43) * 5);
          if (i === 0) ctx.moveTo(p.x, y); else ctx.lineTo(p.x, y);
        });
        ctx.strokeStyle = layer === 1 ? '#68989940' : '#6a8e9025'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    // Crystals belong to world coordinates, so they travel with the rock without flickering.
    const first = Math.floor(distance / 170), last = Math.ceil((distance + width / unit) / 170);
    for (let cell = first; cell <= last; cell++) {
      const worldX = cell * 170 + hash(cell + 2) * 60, x = (worldX - distance) * unit;
      const p = profile(worldX), topSide = hash(cell + 4) > .5;
      const y = (topSide ? p.top : p.bottom) * height, direction = topSide ? 1 : -1;
      const size = (8 + hash(cell + 8) * 13) * Math.min(unit, 1.2);
      ctx.fillStyle = cell % 3 === 0 ? '#9875c2' : '#64b7ad'; ctx.globalAlpha = .65;
      ctx.beginPath(); ctx.moveTo(x - size * .4, y - direction * 4); ctx.lineTo(x - size * .2, y + direction * size); ctx.lineTo(x + size * .25, y + direction * size * .65); ctx.lineTo(x + size * .45, y - direction * 4); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#c3fae766'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - size * .2, y + direction * size); ctx.stroke();
    }
  }
  globalThis.OrbitTerrain = { profile, scale, bounds, hitsCircle, draw };
})();
