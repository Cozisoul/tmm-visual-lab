
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive, drawGrain } from '../../utils/canvas';
import { random, noise } from '../../utils/math';

export const CharcoalProcess: Machine = {
    id: 'charcoal-process',
    name: 'Charcoal Memory',
    department: MachineDepartment.IMAGE,
    description: 'Erasure, layering, and hand-drawn motion.',
    controls: [
        { id: 'memory', label: 'Memory Retention', type: 'number', min: 0, max: 0.99, step: 0.01, defaultValue: 0.8 },
        { id: 'chaos', label: 'Scratchiness', type: 'number', min: 0, max: 20, step: 1, defaultValue: 5 },
        { id: 'speed', label: 'Frame Rate', type: 'number', min: 1, max: 12, step: 1, defaultValue: 6 },
        { id: 'color', label: 'Ink', type: 'color', defaultValue: '#000000' },
        { id: 'bg', label: 'Paper', type: 'color', defaultValue: '#f3f4f6' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { memory, chaos, speed, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        
        // Instead of clearRect, we draw semi-transparent background to simulate "Erasure"
        ctx.fillStyle = bg + Math.floor((1-memory)*255).toString(16).padStart(2, '0');
        ctx.fillRect(0,0,width,height);
        
        // Stop Motion Effect: Only update every N frames
        const frame = Math.floor(time / (1000/speed));
        
        let seed = frame * 100;
        const rand = () => { seed++; return random(seed); };

        ctx.strokeStyle = color;
        ctx.lineWidth = 1 + rand() * 2;
        ctx.lineCap = 'round';
        
        // Draw Walker / Figure
        // A simple walking line that changes over time
        const points = 20;
        
        ctx.beginPath();
        let px = width/2;
        let py = height/2;
        
        // Audio disturbs the memory
        const activeChaos = chaos + (vol * 50);

        for(let i=0; i<points; i++) {
             const n = noise(frame * 0.1, i * 0.2, 0);
             const angle = n * Math.PI * 4;
             const len = 30 + rand() * 20;
             
             // Walking path
             px += Math.cos(angle) * len;
             py += Math.sin(angle) * len;
             
             // Wrap
             px = (px + width) % width;
             py = (py + height) % height;
             
             // Scratchy strokes (multiple lines for charcoal effect)
             for(let k=0; k<3; k++) {
                 const ox = (rand()-0.5) * activeChaos;
                 const oy = (rand()-0.5) * activeChaos;
                 if (isGridAlive(px, py, width, height, globalState)) {
                     // GoL: violent erasure
                     ctx.clearRect(px-10, py-10, 20, 20);
                 } else {
                     if (k===0) ctx.moveTo(px+ox, py+oy);
                     else ctx.lineTo(px+ox, py+oy);
                 }
             }
        }
        ctx.stroke();

        // Add Paper Grain
        drawGrain(ctx, width, height, 15);
    }
};
