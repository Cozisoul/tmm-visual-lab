
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const RaymarchSDF: Machine = {
    id: 'raymarch-sdf',
    name: 'Raymarch SDF 2D',
    department: MachineDepartment.IMAGE,
    description: 'Signed Distance Field 2D slice.',
    controls: [
        { id: 'zoom', label: 'Zoom', type: 'number', min: 0.1, max: 5, step: 0.1, defaultValue: 1 },
        { id: 'res', label: 'Pixel Size', type: 'number', min: 5, max: 50, step: 1, defaultValue: 20 },
        { id: 'complexity', label: 'Complexity', type: 'number', min: 1, max: 10, step: 1, defaultValue: 3 },
        { id: 'edge', label: 'Edge Softness', type: 'number', min: 0, max: 20, step: 1, defaultValue: 10 },
        { id: 'color', label: 'Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { zoom, res, complexity, edge, color, bg } = params;
        const bass = globalState?.audio.bass || 0;
        fillBackground(ctx, width, height, bg, globalState);
        const t = time * 0.001;
        const cx = width/2;
        const cy = height/2;
        const activeZoom = zoom * (1 + bass * 0.5); // Audio Zoom
        
        for(let y=0; y<height; y+=res) {
            for(let x=0; x<width; x+=res) {
                if(isGridAlive(x,y,width,height,globalState)) continue;

                const dx = x - cx;
                const dy = y - cy;
                
                let d = Math.sqrt(dx*dx + dy*dy) * activeZoom;
                d += Math.sin(x*0.01 * complexity + t) * 50;
                d += Math.cos(y*0.01 * complexity + t) * 50;
                d = Math.abs(d % 100 - 50);

                const val = Math.max(0, Math.min(1, d / (edge || 10)));
                
                if(val < 0.2) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x,y,res,res);
                }
            }
        }
    }
};
