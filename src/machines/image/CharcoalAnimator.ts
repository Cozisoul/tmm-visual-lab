
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise, random } from '../../utils/math';

export const CharcoalAnimator: Machine = {
    id: 'charcoal-animator',
    name: 'Charcoal Animator',
    department: MachineDepartment.IMAGE,
    description: 'Stop-motion charcoal loops.',
    controls: [
        { id: 'frames', label: 'Frame Rate', type: 'number', min: 1, max: 24, step: 1, defaultValue: 12 },
        { id: 'smudge', label: 'Smudge Amount', type: 'number', min: 0, max: 50, step: 1, defaultValue: 10 },
        { id: 'turbulence', label: 'Turbulence', type: 'number', min: 0, max: 50, step: 1, defaultValue: 5 },
        { id: 'color', label: 'Charcoal', type: 'color', defaultValue: '#222222' },
        { id: 'bg', label: 'Paper', type: 'color', defaultValue: '#e5e5e5' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { frames, smudge, turbulence, color, bg } = params;
        const mid = globalState?.audio.mid || 0;

        fillBackground(ctx, width, height, bg, globalState);
        ctx.strokeStyle = color;
        
        // Quantize time to frame rate
        const fpsInterval = 1000 / frames;
        const quantizedTime = Math.floor(time / fpsInterval) * fpsInterval;
        
        let seed = quantizedTime;
        const rand = () => { seed++; return random(seed); };
        
        const cx = width/2;
        const cy = height/2;
        const radius = 200;
        
        const activeTurbulence = turbulence * (1 + mid * 2);

        // Draw a circle with scratchy lines
        for(let i=0; i<20; i++) {
             ctx.beginPath();
             ctx.lineWidth = 1 + rand() * 3;
             const distortion = (rand() - 0.5) * activeTurbulence;
             
             for(let a=0; a<=Math.PI*2; a+=0.1) {
                 const r = radius + distortion + (noise(a, quantizedTime*0.001) * smudge);
                 const x = cx + Math.cos(a) * r;
                 const y = cy + Math.sin(a) * r;
                 
                 // GoL: Erase segment
                 if(isGridAlive(x,y,width,height,globalState)) {
                     ctx.moveTo(x + 20, y + 20); // skip
                     continue;
                 }
                 
                 if(a===0) ctx.moveTo(x,y);
                 else ctx.lineTo(x,y);
             }
             ctx.stroke();
        }
    }
};
