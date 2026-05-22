
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const MirrorBox: Machine = {
    id: 'mirror-box',
    name: 'Mirror Box',
    department: MachineDepartment.MASTERS,
    description: 'Kaleidoscopic Projection (Es Devlin).',
    controls: [
        { id: 'segments', label: 'Mirrors', type: 'number', min: 2, max: 32, step: 1, defaultValue: 6 },
        { id: 'zoom', label: 'Tunnel Zoom', type: 'number', min: 0.5, max: 10, step: 0.1, defaultValue: 1 },
        { id: 'rot', label: 'Rotation', type: 'number', min: 0, max: 5, step: 0.1, defaultValue: 1 },
        { id: 'shatter', label: 'Shatter', type: 'number', min: 0, max: 50, step: 1, defaultValue: 0 },
        { id: 'color', label: 'Neon Color', type: 'color', defaultValue: '#ec4899' },
        { id: 'bg', label: 'Void Color', type: 'color', defaultValue: '#000000' },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { segments, zoom, rot, shatter, color, bg } = params;
        
        // Audio reactivity
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        
        fillBackground(ctx, width, height, bg, globalState);
        const cx = width/2;
        const cy = height/2;
        
        const angleStep = (Math.PI * 2) / segments;
        
        // Audio affects rotation speed and zoom
        const t = time * 0.001 * rot * (1 + mid * 0.5);
        const activeZoom = zoom * (1 + bass * 0.3);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 + vol * 3;
        
        for(let i=0; i<segments; i++) {
             ctx.save();
             ctx.translate(cx, cy);
             
             const jRot = (Math.random()-0.5) * (shatter/100);
             ctx.rotate(i * angleStep + t * 0.1 + jRot);
             
             const offsetX = 50 * activeZoom;
             
             ctx.beginPath();
             ctx.rect(offsetX, -20, 100 * activeZoom, 40);
             ctx.stroke();
             
             if(isGridAlive(cx + Math.cos(i*angleStep)*100, cy + Math.sin(i*angleStep)*100, width, height, globalState)) {
                 // GoL: draw distorted line
                 ctx.moveTo(0,0);
                 ctx.lineTo(200, (Math.random()-0.5) * 50);
                 ctx.stroke();
             }
             ctx.restore();
        }
    }
};
