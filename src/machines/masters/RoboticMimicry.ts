
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const RoboticMimicry: Machine = {
    id: 'robotic-mimicry',
    name: 'Robotic Mimicry',
    department: MachineDepartment.MASTERS,
    description: 'Multi-agent drawing system (Sougwen Chung).',
    controls: [
        { id: 'agents', label: 'Arm Count', type: 'number', min: 1, max: 10, step: 1, defaultValue: 3 },
        { id: 'speed', label: 'Arm Speed', type: 'number', min: 1, max: 10, step: 0.1, defaultValue: 2 },
        { id: 'tremor', label: 'Motor Jitter', type: 'number', min: 0, max: 20, step: 1, defaultValue: 2 },
        { id: 'reach', label: 'Reach Radius', type: 'number', min: 50, max: 400, step: 10, defaultValue: 200 },
        { id: 'color', label: 'Ink Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Canvas', type: 'color', defaultValue: '#000000' },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { agents, speed, tremor, reach, color, bg } = params;
        
        // Trail effect
        if(!globalState?.settings.transparent) {
            ctx.fillStyle = bg + '05';
            ctx.fillRect(0,0,width,height);
        }
        const t = time * 0.001 * speed;
        for(let i=0; i<agents; i++) {
            const noiseX = noise(t, i);
            const noiseY = noise(i, t);
            
            const jx = (Math.random()-0.5) * tremor;
            const jy = (Math.random()-0.5) * tremor;

            const x = width/2 + Math.cos(t + i)*reach * noiseX + jx;
            const y = height/2 + Math.sin(t + i)*reach * noiseY + jy;
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            // GoL: Lift Pen (no stroke)
            if(!isGridAlive(x, y, width, height, globalState)) {
                ctx.beginPath();
                ctx.moveTo(width/2, height/2); // Arm base
                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fillStyle = color; ctx.fill();
            }
        }
    }
};
