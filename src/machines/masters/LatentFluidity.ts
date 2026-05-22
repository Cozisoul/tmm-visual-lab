
import { Machine, MachineDepartment } from '../../types';
import { getParticlePool } from '../../services/particleManager';
import { fillBackground, isGridAlive } from '../../utils/canvas';

// --- Fluid Solver Constants ---
const ITERATIONS = 4;
const SCALE = 0.5; // Resolution scale (lower = faster)

// Helper to map 2D grid to 1D array
const IX = (x: number, y: number, w: number) => x + y * w;

export const LatentFluidity: Machine = {
    id: 'latent-fluidity',
    name: 'Latent Fluidity',
    department: MachineDepartment.MASTERS,
    description: 'Authentic Eulerian Fluid Dynamics simulation.',
    controls: [
        { id: 'particles', label: 'Density', type: 'number', min: 2000, max: 20000, step: 1000, defaultValue: 8000 },
        { id: 'viscosity', label: 'Flow Decay', type: 'number', min: 0.90, max: 0.99, step: 0.01, defaultValue: 0.96 },
        { id: 'force', label: 'Turbulence', type: 'number', min: 0.1, max: 2.0, step: 0.1, defaultValue: 0.8 },
        { id: 'color1', label: 'Fluid A', type: 'color', defaultValue: '#3b82f6' },
        { id: 'color2', label: 'Fluid B', type: 'color', defaultValue: '#8b5cf6' },
        { id: 'bg', label: 'Void', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { particles: particleCount, viscosity, force, color1, color2, bg } = params;
        
        // --- 1. Audio Input ---
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;

        // Optimized Background clear (trails)
        if (!globalState?.settings.transparent) {
            ctx.fillStyle = bg;
            ctx.globalAlpha = 0.2; // Trails
            ctx.fillRect(0,0,width,height);
            ctx.globalAlpha = 1.0;
        } else {
            ctx.clearRect(0,0,width,height);
        }

        // --- 2. Initialize / Fetch Fluid Grid State ---
        // We use a persistent state hack via the particle pool or global cache if possible.
        // For now, we'll re-use the particle pool logic but just for particles.
        // We need persistence for the Velocity Grid.
        // Since `Machine` is stateless between frames in this architecture (functional draw),
        // we normally can't store the grid. HOWEVER, we can use the `globalState` cache or a closure if we were a class.
        // Workaround: We will use a static cache on the module scope (lazy singleton) or re-simulate small steps? 
        // No, fluid needs state. I will attach it to the `globalState.cache` if available, or simpler: 
        // I will declare the grid OUTSIDE the draw function. (Module Scope). 
        // This persists as long as the module is loaded.
        
        initFluid(width, height); // Ensure grid matches size

        // --- 3. Fluid Simulation Step ---
        // Add Audio Forces
        const t = time * 0.001;
        
        // Add "Phantom Forces" (Perlin-ish input to keep it moving without mouse)
        const cx = Math.floor(gridW / 2);
        const cy = Math.floor(gridH / 2);
        
        // Circular force from bass
        if (bass > 0.1) {
            const angle = time * 0.002;
            const fx = Math.cos(angle) * bass * force * 5;
            const fy = Math.sin(angle) * bass * force * 5;
            addForce(cx, cy, fx, fy);
        }

        // Random splats from mid
        if (mid > 0.3 && Math.random() > 0.8) {
            const rx = Math.floor(Math.random() * gridW);
            const ry = Math.floor(Math.random() * gridH);
            addForce(rx, ry, (Math.random()-0.5)*10, (Math.random()-0.5)*10);
        }
        
        updateFluid(viscosity);

        // --- 4. Particle Advection ---
        // Particles ride the velocity grid
        
        const pool = getParticlePool('fluid-particles', particleCount, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            age: Math.random() * 100
        }));

        ctx.lineWidth = 1;
        // Batch drawing by color to minimize state changes? 
        // Mixed drawing is fine for this style.
        
        for(let i=0; i<particleCount; i++) {
            const p = pool[i];
            
            // Get grid cell
            const gx = Math.floor(p.x * gridScaleX);
            const gy = Math.floor(p.y * gridScaleY);
            
            if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
                const idx = IX(gx, gy, gridW);
                const vx = Vx[idx];
                const vy = Vy[idx];
                
                // Advect
                p.x += vx * 5; // Speed multiplier
                p.y += vy * 5;
            }
            
            // Wrap / Reset
            if (p.x < 0) p.x += width;
            if (p.x > width) p.x -= width;
            if (p.y < 0) p.y += height;
            if (p.y > height) p.y -= height;
            
            // Aging to respawn (prevents getting stuck in eddies)
            p.age++;
            if (p.age > 200) {
                p.x = Math.random() * width;
                p.y = Math.random() * height;
                p.age = 0;
            }

            // Draw
            // Velocity magnitude determines color mix
            // const speed = Math.sqrt(vx*vx + vy*vy); // Need local vars
            // Simplified:
            const ii = (i / particleCount);
            ctx.fillStyle = i % 2 === 0 ? color1 : color2;
            
            // GoL Interaction (Turbulence)
            if (isGridAlive(p.x, p.y, width, height, globalState)) {
               ctx.fillStyle = '#ffffff';
               p.x += (Math.random()-0.5) * 10;
            }

            ctx.fillRect(p.x, p.y, 1.5, 1.5);
        }
    }
};

// --- Fluid Solver Implementation (Module Scope Persistence) ---
// Based on Joss Stam's "Real-Time Fluid Dynamics for Games"
let gridW = 0;
let gridH = 0;
let gridScaleX = 0;
let gridScaleY = 0;
let Vx: Float32Array;
let Vy: Float32Array;
let Vx0: Float32Array;
let Vy0: Float32Array;

function initFluid(width: number, height: number) {
    const w = Math.floor(width / 20); // 20px grid cells
    const h = Math.floor(height / 20);
    
    if (w !== gridW || h !== gridH) {
        gridW = w;
        gridH = h;
        gridScaleX = gridW / width;
        gridScaleY = gridH / height;
        const size = w * h;
        Vx = new Float32Array(size);
        Vy = new Float32Array(size);
        Vx0 = new Float32Array(size);
        Vy0 = new Float32Array(size);
    }
}

function addForce(x: number, y: number, amountX: number, amountY: number) {
    if (x < 0 || x >= gridW || y < 0 || y >= gridH) return;
    const idx = IX(x, y, gridW);
    Vx[idx] += amountX;
    Vy[idx] += amountY;
}

function updateFluid(visc: number) {
   // Simplified solver: Just Diffuse & Advect Velocity
   // We skip density since we use particles
   
   // 1. Diffuse (Blur velocity)
   // Actually, for "Dreamy" fluid, simple decay is often enough if we don't need strict viscosity
   for(let i=0; i<Vx.length; i++) {
       Vx[i] *= visc;
       Vy[i] *= visc;
   }
   
   // 2. Project (Enforce mass conservation - makes it swirl)
   project(Vx, Vy, Vx0, Vy0);
   
   // 3. Advect (Self-advection: Velocity moves Velocity)
   advect(1, Vx, Vx0, Vx0, Vy0, 1.0);
   advect(2, Vy, Vy0, Vx0, Vy0, 1.0);
   
   // 4. Project again
   project(Vx, Vy, Vx0, Vy0);
}

function advect(b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array, dt: number) {
    let i0, j0, i1, j1;
    let x, y, s0, t0, s1, t1;
    
    for (let j = 1; j < gridH - 1; j++) {
        for (let i = 1; i < gridW - 1; i++) {
             const idx = IX(i, j, gridW);
             x = i - dt * u[idx];
             y = j - dt * v[idx];
             
             if (x < 0.5) x = 0.5; if (x > gridW - 1.5) x = gridW - 1.5;
             i0 = Math.floor(x); i1 = i0 + 1;
             
             if (y < 0.5) y = 0.5; if (y > gridH - 1.5) y = gridH - 1.5;
             j0 = Math.floor(y); j1 = j0 + 1;
             
             s1 = x - i0; s0 = 1.0 - s1;
             t1 = y - j0; t0 = 1.0 - t1;
             
             d[idx] = s0 * (t0 * d0[IX(i0, j0, gridW)] + t1 * d0[IX(i0, j1, gridW)]) +
                      s1 * (t0 * d0[IX(i1, j0, gridW)] + t1 * d0[IX(i1, j1, gridW)]);
        }
    }
}

function project(u: Float32Array, v: Float32Array, p: Float32Array, div: Float32Array) {
    for (let j = 1; j < gridH - 1; j++) {
        for (let i = 1; i < gridW - 1; i++) {
            const idx = IX(i, j, gridW);
            div[idx] = -0.5 * (u[IX(i+1, j, gridW)] - u[IX(i-1, j, gridW)] + 
                               v[IX(i, j+1, gridW)] - v[IX(i, j-1, gridW)]) / gridW; // normalized?
            p[idx] = 0;
        }
    }
    
    // Gauss-Seidel 
    for (let k = 0; k < 4; k++) { // Iterations
        for (let j = 1; j < gridH - 1; j++) {
            for (let i = 1; i < gridW - 1; i++) {
                const idx = IX(i, j, gridW);
                p[idx] = (div[idx] + p[IX(i-1, j, gridW)] + p[IX(i+1, j, gridW)] +
                                     p[IX(i, j-1, gridW)] + p[IX(i, j+1, gridW)]) / 4;
            }
        }
    }
    
    for (let j = 1; j < gridH - 1; j++) {
        for (let i = 1; i < gridW - 1; i++) {
            const idx = IX(i, j, gridW);
            u[idx] -= 0.5 * (p[IX(i+1, j, gridW)] - p[IX(i-1, j, gridW)]) * gridW;
            v[idx] -= 0.5 * (p[IX(i, j+1, gridW)] - p[IX(i, j-1, gridW)]) * gridH; // * gridH? normally N
        }
    }
}
