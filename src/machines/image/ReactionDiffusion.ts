
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const ReactionDiffusion: Machine = {
    id: 'reaction-diffusion',
    name: 'Reaction Diffusion',
    department: MachineDepartment.IMAGE,
    description: 'Chemical simulation pattern.',
    controls: [
        { id: 'scale', label: 'Scale', type: 'number', min: 5, max: 50, step: 1, defaultValue: 20 },
        { id: 'feed', label: 'Feed Rate', type: 'number', min: 0.01, max: 0.1, step: 0.001, defaultValue: 0.055 },
        { id: 'kill', label: 'Kill Rate', type: 'number', min: 0.01, max: 0.1, step: 0.001, defaultValue: 0.062 },
        { id: 'thresh', label: 'Cutoff', type: 'number', min: 0.1, max: 0.9, step: 0.1, defaultValue: 0.5 },
        { id: 'speed', label: 'Animation', type: 'number', min: 0.1, max: 5, step: 0.1, defaultValue: 1 },
        { id: 'color', label: 'Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { scale, feed, kill, thresh, speed, color, bg } = params;
        // Parameters modulated via processParametersWithAudio

        fillBackground(ctx, width, height, bg, globalState);
        ctx.fillStyle = color;
        
        const t = time * 0.002 * speed;

        for(let y=0; y<height; y+=scale) {
            for(let x=0; x<width; x+=scale) {
                const n = noise(x*0.05, y*0.05, t);
                const val = Math.abs(n - 0.5) * 2;
                
                if(val < thresh) {
                    if (isGridAlive(x,y,width,height,globalState)) {
                        ctx.strokeStyle = color; 
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, scale, scale);
                    } else {
                        ctx.fillRect(x, y, scale, scale);
                    }
                }
            }
        }
    }
};
