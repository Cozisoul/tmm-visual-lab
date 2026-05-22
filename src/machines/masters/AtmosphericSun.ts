
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive, drawGrain } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const AtmosphericSun: Machine = {
    id: 'atmospheric-sun',
    name: 'The Atmospheric Sun',
    department: MachineDepartment.MASTERS,
    description: 'Light, Fog & Monoliths (Olafur Eliasson).',
    controls: [
        { id: 'radius', label: 'Sun Size', type: 'number', min: 100, max: 1500, step: 10, defaultValue: 300 },
        { id: 'mist', label: 'Mist Density', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
        { id: 'grain', label: 'Film Grain', type: 'number', min: 0, max: 100, step: 5, defaultValue: 30 },
        { id: 'color1', label: 'Sun Color', type: 'color', defaultValue: '#f59e0b' },
        { id: 'color2', label: 'Sky Color', type: 'color', defaultValue: '#52525b' },
        { id: 'horizon', label: 'Horizon Y', type: 'number', min: 0, max: 100, step: 1, defaultValue: 50 },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { radius, mist, grain, color1, color2, horizon, bg } = params;
        const bass = globalState?.audio.bass || 0;
        fillBackground(ctx, width, height, bg, globalState);
        
        const cx = width/2;
        const cy = (height * horizon) / 100;
        const activeRadius = radius * (1 + bass * 0.3); // Audio Pulse
        
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, activeRadius * 2);
        grad.addColorStop(0, color1);
        grad.addColorStop(0.3, color1);
        grad.addColorStop(0.5, color2);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,width,height);
        
        const t = time * 0.0005;
        const tiles = 40;
        const tw = width/tiles;
        const th = height/tiles;
        for(let y=0; y<tiles; y++) {
            for(let x=0; x<tiles; x++) {
                 const n = noise(x, y, t);
                 // GoL: Hole in mist
                 if(isGridAlive(x*tw, y*th, width, height, globalState)) continue;
                 ctx.fillStyle = `rgba(200,200,200, ${n * mist * 0.3})`;
                 ctx.fillRect(x*tw, y*th, tw+1, th+1);
            }
        }
        drawGrain(ctx, width, height, grain);
    }
};
