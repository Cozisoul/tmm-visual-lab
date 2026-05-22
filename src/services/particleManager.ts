/**
 * ParticleManager: Persistent object pools to avoid per-frame allocations
 * Reduces garbage collection pressure in performance-critical visualizations
 */

export interface Particle {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  [key: string]: any;
}

const pools: Record<string, Particle[]> = {};

/**
 * Get or create a particle pool with optional count resizing
 */
export const getParticlePool = (
  id: string,
  count: number,
  initFn: (i: number, p: Particle | null) => Particle
): Particle[] => {
  const existing = pools[id];
  if (!existing || existing.length !== count) {
    pools[id] = new Array(count).fill(null).map((_, i) => initFn(i, null));
  }
  return pools[id];
};

/**
 * Dynamically resize a particle pool
 */
export const setParticleCount = (
  id: string,
  count: number,
  initFn: (i: number, p: Particle | null) => Particle
): Particle[] => {
  const pool = pools[id] || [];
  if (pool.length === count) return pool;
  if (pool.length < count) {
    for (let i = pool.length; i < count; i++) pool.push(initFn(i, null));
    pools[id] = pool;
  } else {
    pools[id] = pool.slice(0, count);
  }
  return pools[id];
};

/**
 * Reset a specific pool
 */
export const resetParticlePool = (id: string): void => {
  delete pools[id];
};

/**
 * Clear all pools (call on cleanup)
 */
export const clearAllPools = (): void => {
  Object.keys(pools).forEach(k => delete pools[k]);
};
