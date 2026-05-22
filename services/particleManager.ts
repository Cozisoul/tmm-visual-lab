// Lightweight ParticleManager: provides persistent particle pools per machine id
// to avoid per-frame allocations and allow centralized control (size/speed multipliers).

type Particle = { x: number; y: number; vx?: number; vy?: number; [key:string]: any };

const pools: Record<string, Particle[]> = {};

export const getParticlePool = (id: string, count: number, initFn: (i:number, p:Particle|null)=>Particle) => {
    const existing = pools[id];
    if (!existing || existing.length !== count) {
        pools[id] = new Array(count).fill(null).map((_, i) => initFn(i, null));
    }
    return pools[id];
};

export const resetParticlePool = (id: string) => { delete pools[id]; };

export const setParticleCount = (id: string, count: number, initFn: (i:number, p:Particle|null)=>Particle) => {
    const pool = pools[id] || [];
    if (pool.length === count) return pool;
    if (pool.length < count) {
        for(let i=pool.length;i<count;i++) pool.push(initFn(i, null));
        pools[id] = pool;
    } else {
        pools[id] = pool.slice(0, count);
    }
    return pools[id];
};

export const clearAllPools = () => { Object.keys(pools).forEach(k=>delete pools[k]); };

export default { getParticlePool, resetParticlePool, setParticleCount, clearAllPools };
