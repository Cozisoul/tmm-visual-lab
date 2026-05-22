
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const OrganicLattice: Machine = {
    id: 'organic-lattice',
    name: 'Organic Lattice',
    department: MachineDepartment.MASTERS,
    description: 'Biomimetic growth structure (Neri Oxman).',
    controls: [
        { id: 'scale', label: 'Cell Scale', type: 'number', min: 10, max: 200, step: 5, defaultValue: 40 },
        { id: 'growth', label: 'Growth Factor', type: 'number', min: 0, max: 2, step: 0.1, defaultValue: 1 },
        { id: 'distortion', label: 'Distortion', type: 'number', min: 0, max: 50, step: 1, defaultValue: 10 },
        { id: 'layers', label: 'Depth Layers', type: 'number', min: 1, max: 5, step: 1, defaultValue: 2 },
        { id: 'color', label: 'Material Color', type: 'color', defaultValue: '#fde047' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#18181b' },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { scale, growth, distortion, layers, color, bg } = params;
        
        fillBackground(ctx, width, height, bg, globalState);
        const t = time * 0.0002 * growth;
        const cols = width/scale;
        const rows = height/scale;
        ctx.strokeStyle = color;

        for(let i=0; i<layers; i++) {
             ctx.globalAlpha = 1 - (i/layers);
             const layerScale = scale + i*10;
             for(let y=0; y<rows; y++) {
                for(let x=0; x<cols; x++) {
                    const px = x*layerScale;
                    const py = y*layerScale;
                    const n = noise(x*0.1, y*0.1, t + i);
                    const r = n * layerScale * 0.8;
                    // GoL: Skip cell
                    if(isGridAlive(px,py,width,height,globalState)) continue;
                    
                    const dx = (Math.random()-0.5) * distortion;
                    const dy = (Math.random()-0.5) * distortion;

                    ctx.beginPath();
                    ctx.arc(px + layerScale/2 + dx, py + layerScale/2 + dy, Math.max(0.1, r), 0, Math.PI*2);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1.0;
    }
};
