
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const WovenPath: Machine = {
    id: 'woven-path',
    name: 'Woven Path',
    department: MachineDepartment.MASTERS,
    description: 'Noise paths as textiles (Igshaan Adams).',
    controls: [
        { id: 'lines', label: 'Thread Count', type: 'number', min: 50, max: 1000, step: 10, defaultValue: 200 },
        { id: 'chaos', label: 'Weave Chaos', type: 'number', min: 0, max: 100, step: 1, defaultValue: 20 },
        { id: 'fray', label: 'Thread Fray', type: 'number', min: 0, max: 50, step: 1, defaultValue: 10 },
        { id: 'wave', label: 'Wave', type: 'number', min: 0, max: 100, step: 1, defaultValue: 20 },
        { id: 'color', label: 'Thread A', type: 'color', defaultValue: '#e4e4e7' },
        { id: 'color2', label: 'Thread B', type: 'color', defaultValue: '#3f3f46' },
        { id: 'bg', label: 'Loom', type: 'color', defaultValue: '#000000' },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { lines, chaos, fray, wave, color, color2, bg } = params;
        
        // Audio reactivity
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        
        fillBackground(ctx, width, height, bg, globalState);
        
        // Audio affects wave amplitude and chaos
        const activeChaos = chaos * (1 + bass * 0.5);
        const activeWave = wave * (1 + mid * 0.5);

        for(let i=0; i<lines; i++) {
            const x = (width/lines) * i;
            ctx.strokeStyle = i%2===0 ? color : color2;
            ctx.lineWidth = 1 + vol * 2;
            ctx.beginPath();
            ctx.moveTo(x + (Math.random()-0.5)*fray, 0);
            const n = noise(i*0.1, time*0.001) * activeChaos;
            const w = Math.sin(time*0.001 + i*0.1) * activeWave;
            
            // GoL: Orange Highlight
            if(isGridAlive(x, height/2, width, height, globalState)) ctx.strokeStyle = '#f97316';
            ctx.lineTo(x + n + w + (Math.random()-0.5)*fray, height);
            ctx.stroke();
        }
    }
};
