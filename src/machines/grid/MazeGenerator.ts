
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

// --- Deterministic LCG RNG ---
class DeterministicRNG {
    private seed: number;
    constructor(seed: number) {
        this.seed = seed;
    }
    // Returns 0..1
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    // Fisher-Yates shuffle
    shuffle(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// --- Maze Algorithm (Recursive Backtracker) ---
// Returns a list of HORIZONTAL walls and VERTICAL walls that EXIST.
// width/height in Cells.
function generateMaze(cols: number, rows: number, rng: DeterministicRNG) {
    const visited = new Uint8Array(cols * rows); // 0 = false, 1 = true
    const stack: number[] = [];
    
    // Wall definitions:
    // We start with ALL walls. We will "remove" walls by linking cells.
    // Instead of storing walls, we can store connections.
    // connections[i] = bitmask (1=Top, 2=Right, 4=Bottom, 8=Left)
    // Actually, easier:
    // We just need to know which walls to DRAW.
    // Let's store "removed walls".
    // horizontalWalls[y][x]: wall below cell (x,y)? No, wall ABOVE.
    // Let's simpler:
    // cells[i] has properties for walls: top, right, bottom, left.
    // default true.
    // We visit, knock down walls.
    
    // Optimized Structure:
    // verticalWalls[x][y]: wall to the RIGHT of (x,y). size: (cols-1) x rows
    // horizontalWalls[x][y]: wall to the BOTTOM of (x,y). size: cols x (rows-1)
    
    const vWalls = new Uint8Array((cols - 1) * rows).fill(1);
    const hWalls = new Uint8Array(cols * (rows - 1)).fill(1);
    
    // Initial cell (0,0)
    let current = 0;
    visited[0] = 1;
    stack.push(0);
    
    // Directions: [dx, dy, wallType, wallIndexOffset]
    // 0: Up (y-1)
    // 1: Right (x+1)
    // 2: Down (y+1)
    // 3: Left (x-1)
    
    while (stack.length > 0) {
        current = stack[stack.length - 1]; // Peak
        const cx = current % cols;
        const cy = Math.floor(current / cols);
        
        // Find unvisited neighbors
        const neighbors = [];
        
        // Up
        if (cy > 0 && visited[current - cols] === 0) neighbors.push(0);
        // Right
        if (cx < cols - 1 && visited[current + 1] === 0) neighbors.push(1);
        // Down
        if (cy < rows - 1 && visited[current + cols] === 0) neighbors.push(2);
        // Left
        if (cx > 0 && visited[current - 1] === 0) neighbors.push(3);
        
        if (neighbors.length > 0) {
            // Choose random neighbor
            // We use our RNG
            const pick = neighbors[Math.floor(rng.next() * neighbors.length)];
            
            // Remove wall
            /*
              Up: Remove hWall at (cx, cy-1)
              Right: Remove vWall at (cx, cy)
              Down: Remove hWall at (cx, cy)
              Left: Remove vWall at (cx-1, cy)
            */
            let nextCell = 0;
            if (pick === 0) { // Up
                 // Wall bottom of cy-1 is index: cx + (cy-1)*cols
                 hWalls[cx + (cy - 1) * cols] = 0;
                 nextCell = current - cols;
            } else if (pick === 1) { // Right
                 // Wall right of cx is index: cx + cy*(cols-1)
                 vWalls[cx + cy * (cols - 1)] = 0;
                 nextCell = current + 1;
            } else if (pick === 2) { // Down
                 // Wall bottom of cy is index: cx + cy*cols
                 hWalls[cx + cy * cols] = 0;
                 nextCell = current + cols;
            } else if (pick === 3) { // Left
                 // Wall right of cx-1 is index: (cx-1) + cy*(cols-1)
                 vWalls[(cx - 1) + cy * (cols - 1)] = 0;
                 nextCell = current - 1;
            }
            
            visited[nextCell] = 1;
            stack.push(nextCell);
        } else {
            stack.pop(); // Backtrack
        }
    }
    
    return { vWalls, hWalls };
}

export const MazeGenerator: Machine = {
    id: 'maze-generator',
    name: 'Maze Generator',
    department: MachineDepartment.GRID,
    description: 'Perfect algorithmically generated maze (DFS).',
    controls: [
        { id: 'scale', label: 'Cell Scale', type: 'number', min: 10, max: 100, step: 5, defaultValue: 40 },
        { id: 'thickness', label: 'Wall Thickness', type: 'number', min: 1, max: 10, step: 1, defaultValue: 3 },
        { id: 'drift', label: 'Topology Shift', type: 'number', min: 0, max: 100, step: 1, defaultValue: 5 }, // Speed of change
        { id: 'color', label: 'Wall Color', type: 'color', defaultValue: '#22d3ee' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { scale, thickness, drift, color, bg } = params;
        const vol = globalState?.audio.volume || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        // SETUP
        ctx.lineCap = 'square';
        ctx.lineWidth = thickness;
        ctx.strokeStyle = color;
        
        const cols = Math.floor(width / scale);
        const rows = Math.floor(height / scale);
        
        // Generate Seed based on time + drift
        // We only change the seed every X seconds based on drift to keep it stable
        // drift = 0 -> Static
        // drift = 100 -> Fast changes
        const seedTime = drift === 0 ? 0 : Math.floor(time * 0.001 * (drift * 0.1));
        const rng = new DeterministicRNG(seedTime + 12345);
        
        // GENERATE
        // This is fast enough (approx 1ms for 40x20 grid) to run every frame
        const { vWalls, hWalls } = generateMaze(cols, rows, rng);
        
        const cellW = width / cols;
        const cellH = height / rows;
        
        // RENDER
        ctx.beginPath();
        
        // 1. Draw Limits (Border)
        ctx.moveTo(0,0); ctx.lineTo(width, 0); // Top
        ctx.moveTo(0,0); ctx.lineTo(0, height); // Left
        ctx.moveTo(width, 0); ctx.lineTo(width, height); // Right
        ctx.moveTo(0, height); ctx.lineTo(width, height); // Bottom
        
        // 2. Vertical Walls (Right of cell)
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols - 1; x++) {
                if (vWalls[x + y * (cols - 1)] === 1) {
                    const px = (x + 1) * cellW;
                    const py = y * cellH;
                    ctx.moveTo(px, py);
                    ctx.lineTo(px, py + cellH);
                }
            }
        }
        
        // 3. Horizontal Walls (Bottom of cell)
         for (let y = 0; y < rows - 1; y++) {
            for (let x = 0; x < cols; x++) {
                if (hWalls[x + y * cols] === 1) {
                    const px = x * cellW;
                    const py = (y + 1) * cellH;
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + cellW, py);
                }
            }
        }
        
        ctx.stroke();
        
        // Solve/Highlight Path (Bonus Visual)
        // Let's just draw "breadcrumbs" or "nodes" based on audio
        if (vol > 0.1) {
             const dotSize = scale * 0.15 * (1 + vol);
             ctx.fillStyle = '#ffffff';
             const dotRNG = new DeterministicRNG(seedTime + 999);
             for (let i = 0; i < 10; i++) {
                 // Random walkers
                 const rx = Math.floor(dotRNG.next() * cols);
                 const ry = Math.floor(dotRNG.next() * rows);
                 
                 const px = rx * cellW + cellW/2;
                 const py = ry * cellH + cellH/2;
                 
                  ctx.beginPath();
                  ctx.arc(px, py, dotSize, 0, Math.PI * 2);
                  ctx.fill();
             }
        }
        
        // GoL Interaction
         if (isGridAlive(width/2, height/2, width, height, globalState)) {
             // If grid is alive, we can maybe invert colors or something
             // For now, just a flash
         }
    }
};
