
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const HalftoneRaster: Machine = {
    id: 'halftone-raster',
    name: 'Halftone Raster',
    department: MachineDepartment.IMAGE,
    description: 'CMYK Halftone patterns.',
    controls: [
        { id: 'scale', label: 'Dot Size', type: 'number', min: 5, max: 50, step: 1, defaultValue: 10 },
        { id: 'angle', label: 'Angle', type: 'number', min: 0, max: 90, step: 1, defaultValue: 45 },
        { id: 'contrast', label: 'Contrast', type: 'number', min: 1, max: 5, step: 0.1, defaultValue: 1 },
        { id: 'shape', label: 'Dot Shape', type: 'select', options: ['Circle', 'Square'], defaultValue: 'Circle' },
        { id: 'color', label: 'Color', type: 'color', defaultValue: '#00ffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { scale, angle, contrast, shape, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        fillBackground(ctx, width, height, bg, globalState);
        ctx.fillStyle = color;
        const t = time * 0.001;
        
        ctx.save();
        const activeScale = scale * (1 + vol); // Audio Scale
        
        for(let y=0; y<height; y+=activeScale) {
            for(let x=0; x<width; x+=activeScale) {
                let n = noise(x*0.01, y*0.01, t);
                n = Math.pow(n, contrast);
                const r = (n * activeScale) / 2;
                
                if(isGridAlive(x,y,width,height,globalState)) {
                    // GoL: Fill block
                    ctx.fillRect(x,y,activeScale,activeScale);
                } else {
                    const safeR = Math.max(0.1, r);
                    ctx.beginPath(); 
                    if (shape === 'Circle') ctx.arc(x,y,safeR,0,Math.PI*2); 
                    else ctx.rect(x-safeR, y-safeR, safeR*2, safeR*2);
                    ctx.fill();
                }
            }
        }
        ctx.restore();
    }
};
