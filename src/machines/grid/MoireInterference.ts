
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const MoireInterference: Machine = {
    id: 'moire-interference',
    name: 'Moiré Interference',
    department: MachineDepartment.GRID,
    description: 'Interfering concentric patterns.',
    controls: [
        { id: 'spacing', label: 'Signal Spacing', type: 'number', min: 2, max: 100, step: 1, defaultValue: 12 },
        { id: 'offset', label: 'Interference Offset', type: 'number', min: 0, max: 600, step: 10, defaultValue: 80 },
        { id: 'speed', label: 'Rotation Energy', type: 'number', min: 0, max: 10, step: 0.1, defaultValue: 2 },
        { id: 'shape', label: 'Geometric Basis', type: 'select', options: ['Circle', 'Square', 'Pentagon', 'Noise'], defaultValue: 'Circle' },
        { id: 'layers', label: 'Wave Layers', type: 'number', min: 1, max: 8, step: 1, defaultValue: 3 },
        { id: 'thickness', label: 'Stroke Weight', type: 'number', min: 0.5, max: 10, step: 0.5, defaultValue: 1.5 },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Deep Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { spacing, offset, speed, shape, layers, thickness, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;
        
        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * (1 + treble * 2);
        
        const maxR = Math.max(width, height) * 1.8;
        const t = time * 0.001 * speed;
        const activeOffset = offset * (1 + bass * 0.5);
        
        const drawGeometricLayer = (cx: number, cy: number, rot: number) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);
            for (let r = spacing; r < maxR; r += spacing) {
                ctx.beginPath();
                if (shape === 'Circle') {
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                } else if (shape === 'Square') {
                    ctx.rect(-r, -r, r * 2, r * 2);
                } else if (shape === 'Pentagon') {
                    for (let n = 0; n < 5; n++) {
                        const a = (Math.PI * 2 / 5) * n;
                        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                    }
                    ctx.closePath();
                } else if (shape === 'Noise') {
                   const noise = Math.sin(r * 0.1 + t) * 10 * vol;
                   ctx.arc(0, 0, Math.max(1, r + noise), 0, Math.PI * 2);
                }
                ctx.stroke();
            }
            ctx.restore();
        };

        for (let i = 0; i < layers; i++) {
            const angle = (Math.PI * 2 / layers) * i;
            const drift = t * (i % 2 === 0 ? 1 : -1) * (1 + mid);
            const moveX = Math.cos(drift + angle) * activeOffset;
            const moveY = Math.sin(drift + angle) * activeOffset;
            
            ctx.globalAlpha = 0.3 + (vol * 0.7);
            
            if (!isGridAlive(width/2 + moveX, height/2 + moveY, width, height, globalState)) {
                drawGeometricLayer(width/2 + moveX, height/2 + moveY, drift * 0.5);
            }
        }
    }
};
