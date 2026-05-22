
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

function hash(x: number, y: number, seed: number) {
    let n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
}

export const TruchetTiler: Machine = {
    id: 'truchet-tiler',
    name: 'Truchet Tiler',
    department: MachineDepartment.GRID,
    description: 'Authentic geometric tiling with Smith and Diagonal logic.',
    controls: [
        { id: 'mode', label: 'Tile Type', type: 'select', options: ['Quarter Circles', 'Diagonals', 'Pipes'], defaultValue: 'Quarter Circles' },
        { id: 'size', label: 'Tile Size', type: 'number', min: 20, max: 200, step: 10, defaultValue: 60 },
        { id: 'width', label: 'Stroke Width', type: 'number', min: 1, max: 20, step: 1, defaultValue: 6 },
        { id: 'chaos', label: 'Randomness', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.0 }, // 0 = Patterned, 1 = Random
        { id: 'color', label: 'Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { mode, size, width: lineWidth, chaos, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        
        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.lineCap = 'butt'; // 'butt' is better for precise tiling connections
        ctx.lineJoin = 'miter';
        ctx.lineWidth = lineWidth * (1 + vol); // Audio reactivity on line width
        ctx.strokeStyle = color;

        const cols = Math.ceil(width / size) + 1;
        const rows = Math.ceil(height / size) + 1;

        // Base pattern seed (changes slowly over time if chaos is > 0, otherwise static)
        // Authentic truchet is usually static, but we allow slow drift if desired.
        const seedBase = Math.floor(time * 0.0001); 

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const px = x * size;
                const py = y * size;

                if (isGridAlive(px, py, width, height, globalState)) {   
                    // Glitch/Erode logic
                    ctx.save();
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.2;
                    ctx.fillRect(px, py, size, size);
                    ctx.restore();
                    continue; 
                }

                // Deterministic Orientation Logic
                // If chaos is 0, we want a checkerboard pattern (alternating).
                // If chaos is 1, we want random noise.
                const randomVal = hash(x, y, seedBase);
                const checker = (x + y) % 2 === 0 ? 0 : 1; 
                
                // Mix checkerboard and random based on chaos
                // If chaos < 0.5, we snap to checkerboard mostly.
                // If chaos > 0.5, we snap to random.
                let choice = 0;
                if (chaos === 0) {
                     choice = checker;
                } else if (chaos === 1) {
                    choice = randomVal > 0.5 ? 1 : 0;
                } else {
                    // Interpolate probability
                   choice = randomVal > (1 - chaos * 0.5) ? 1 : checker;
                }

                ctx.save();
                ctx.translate(px, py);
                
                // Draw Tile
                ctx.beginPath();
                if (mode === 'Quarter Circles') {
                    // Smith Tile
                    // 0: Arcs in TL and BR
                    // 1: Arcs in TR and BL
                    const r = size / 2;
                    if (choice === 0) {
                        ctx.arc(0, 0, r, 0, Math.PI * 0.5); // Top-Left corner
                        ctx.moveTo(size, size);
                        ctx.arc(size, size, r, Math.PI, Math.PI * 1.5); // Bottom-Right corner
                    } else {
                        ctx.moveTo(size, 0);
                        ctx.arc(size, 0, r, Math.PI * 0.5, Math.PI); // Top-Right corner
                        ctx.moveTo(0, size);
                        ctx.arc(0, size, r, Math.PI * 1.5, Math.PI * 2); // Bottom-Left corner
                    }
                } else if (mode === 'Diagonals') {
                    // 0: TL to BR
                    // 1: TR to BL
                    if (choice === 0) {
                        ctx.moveTo(0, 0); ctx.lineTo(size, size);
                    } else {
                         ctx.moveTo(size, 0); ctx.lineTo(0, size);
                    }
                } else if (mode === 'Pipes') {
                    // 0: Vertical
                    // 1: Horizontal
                    const mid = size / 2;
                    if (choice === 0) {
                        ctx.moveTo(mid, 0); ctx.lineTo(mid, size);
                    } else {
                        ctx.moveTo(0, mid); ctx.lineTo(size, mid);
                    }
                }
                ctx.stroke();
                ctx.restore();
            }
        }
    }
};
