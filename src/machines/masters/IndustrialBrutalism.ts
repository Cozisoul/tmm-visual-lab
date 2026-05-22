
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive, drawGrain } from '../../utils/canvas';

function hash(x: number, y: number) {
    return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
}

export const IndustrialBrutalism: Machine = {
    id: 'industrial-brutalism',
    name: 'Industrial Brutalism',
    department: MachineDepartment.MASTERS,
    description: 'Structure, Concrete, Repetition (Samuel Ross).',
    controls: [
        { id: 'scale', label: 'Structure Scale', type: 'number', min: 40, max: 400, step: 20, defaultValue: 150 },
        { id: 'density', label: 'Mass Density', type: 'number', min: 0.1, max: 1.0, step: 0.1, defaultValue: 0.6 },
        { id: 'erosion', label: 'Surface Decay', type: 'number', min: 0, max: 100, step: 10, defaultValue: 20 },
        { id: 'color', label: 'Warning Signal', type: 'color', defaultValue: '#f43f5e' }, // Safety Orange/Red
        { id: 'bg', label: 'Concrete Core', type: 'color', defaultValue: '#27272a' }, // Zinc 800
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { scale, density, erosion, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        
        fillBackground(ctx, width, height, bg, globalState);
        
        // Brutalism is about REPETITION and MASS.
        // We will generate a "Monument" structure.
        
        const cols = Math.ceil(width / scale);
        const rows = Math.ceil(height / (scale * 0.6));
        
        const seedBase = 80085;
        const t = time * 0.0002;
        
        // 1. Draw The Grid Structure (Pillars & Slabs)
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const h = hash(x, y + Math.floor(t)); // Scroll slowly up/down? No, static is better for architecture.
                
                if (h > density) continue; // Empty space (Negative space is key to Brutalism)
                
                const px = x * scale;
                const py = y * scale * 0.6;
                const w = scale;
                const heightBlock = scale * 0.6;
                
                // GoL: Structure Collapse
                if (isGridAlive(px + w/2, py + heightBlock/2, width, height, globalState)) {
                    // Draw Rubble logic? Or just skip
                    continue; 
                }
                
                // Texture variation
                const shade = 20 + hash(x*10, y*10) * 10;
                const concreteColor = `rgb(${shade}, ${shade}, ${shade})`;
                
                ctx.fillStyle = concreteColor;
                ctx.fillRect(px, py, w, heightBlock);
                
                // 3D Extrusion (Perspective hint)
                ctx.fillStyle = `rgb(${shade-10}, ${shade-10}, ${shade-10})`;
                ctx.fillRect(px + 10, py + 10, w, heightBlock);
                
                // Main Face
                ctx.fillStyle = concreteColor;
                ctx.fillRect(px, py, w - 10, heightBlock - 10);
                
                // Accent Details
                if (hash(x, y + 100) > 0.8) {
                    ctx.fillStyle = color;
                    // Draw a technical strip
                    ctx.fillRect(px + 20, py + heightBlock - 15, w - 40, 5);
                }
                
                // Typography on Structure
                if (hash(x, y + 200) > 0.7 && w > 60) {
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 20px Helvetica, Arial';
                    ctx.globalAlpha = 0.4;
                    ctx.fillText(`BLK-${x}-${y}`, px + 10, py + 30);
                    ctx.globalAlpha = 1.0;
                }
            }
        }
        
        // 2. Heavy Foreground Text (Samuel Ross style)
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 120px Helvetica, Arial';
        ctx.globalAlpha = 0.1 * (1 + bass);
        ctx.translate(width/2, height/2);
        ctx.rotate(-Math.PI * 0.25);
        ctx.fillText("CONCRETE", -300, 0);
        ctx.restore();
        
        // 3. Technical Overlay
        ctx.fillStyle = color;
        ctx.font = '10px monospace';
        ctx.fillText(`STRUCTURAL_DENSITY: ${(density * 100).toFixed(0)}%`, 20, height - 20);
        ctx.fillText(`SURFACE_EROSION: ${erosion}`, 20, height - 35);
        
        // 4. Grain Overlay (Erosion)
        drawGrain(ctx, width, height, erosion);
    }
};
