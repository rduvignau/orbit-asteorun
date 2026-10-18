/* Aegis protects hull and equipment; timing its first 0.35 seconds returns enemy fire. */
(() => {
  function createShield() {
    return {
      unlocked: false, energy: 100, time: 0,
      reset(unlocked = false) { this.unlocked = unlocked; this.energy = 100; this.time = 0; },
      update(dt) { if (this.time > 0) this.time = Math.max(0, this.time - dt); else if (this.unlocked) this.energy = Math.min(100, this.energy + dt * 10); },
      activate() { if (!this.unlocked || this.time > 0 || this.energy < 100) return false; this.energy = 0; this.time = 2.2; return true; },
      get active() { return this.time > 0; },
      get parrying() { return this.time > 1.85; }
    };
  }
  globalThis.OrbitDefense = { createShield };
})();
