
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const VoicePrint: Machine = {
    id: 'voice-print',
    name: 'Voice Print',
    department: MachineDepartment.MASTERS,
    description: 'Radial frequency mapping (Lawrence Abu Hamdan).',
    controls: [
        { id: 'scale', label: 'Radius', type: 'number', min: 100, max: 1000, step: 10, defaultValue: 300 },
        { id: 'sens', label: 'Sensitivity', type: 'number', min: 1, max: 10, step: 0.1, defaultValue: 2 },
        { id: 'interference', label: 'Noise', type: 'number', min: 0, max: 50, step: 1, defaultValue: 5 },
        { id: 'loop', label: 'Loops', type: 'number', min: 1, max: 10, step: 1, defaultValue: 1 },
        { id: 'color', label: 'Wave Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { scale, sens, interference, loop, color, bg } = params;
        fillBackground(ctx, width, height, bg, globalState);
        const cx = width/2;
        const cy = height/2;
        const audio = globalState?.audio.raw || new Uint8Array(100);
        ctx.strokeStyle = color;
        
        for(let j=0; j<loop; j++) {
            const rOffset = j * 20;
            ctx.beginPath();
            for(let i=0; i<audio.length; i++) {
                const angle = (Math.PI*2 / audio.length) * i;
                const noiseVal = (Math.random()-0.5) * interference;
                const r = scale + rOffset + (audio[i] * sens) + noiseVal;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                
                // GoL: Skip Segment
                if(isGridAlive(x,y,width,height,globalState)) continue;

                if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
};
