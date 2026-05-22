
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const DitherField: Machine = {
    id: 'dither-field',
    name: 'Dither Field',
    department: MachineDepartment.IMAGE,
    description: 'Noise dithering.',
    controls: [
        { id: 'density', label: 'Density', type: 'number', min: 1, max: 50, step: 1, defaultValue: 10 },
        { id: 'size', label: 'Pixel Size', type: 'number', min: 1, max: 10, step: 1, defaultValue: 1 },
        { id: 'thresh', label: 'Threshold', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
        { id: 'color', label: 'Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { density, size, thresh, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        fillBackground(ctx, width, height, bg, globalState);
        ctx.fillStyle = color;
        const count = (width*height/ (size*size)) * (density/100);
        
        // Audio Noise Thresh
        const activeThresh = thresh - (vol * 0.3);

        for(let i=0; i<count; i++) {
            const x = Math.floor(Math.random() * (width/size)) * size;
            const y = Math.floor(Math.random() * (height/size)) * size;
            const n = noise(x*0.01, y*0.01, time*0.0001);
            
            if(n > activeThresh || isGridAlive(x,y,width,height,globalState)) {
                 ctx.fillRect(x,y,size,size);
            }
        }
    }
};
