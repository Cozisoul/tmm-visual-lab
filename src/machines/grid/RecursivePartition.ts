
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { random } from '../../utils/math';

export const RecursivePartition: Machine = {
    id: 'recursive-partition',
    name: 'Recursive Partition',
    department: MachineDepartment.GRID,
    description: 'Subdividing rectangles.',
    controls: [
        { id: 'depth', label: 'Maximum Depth', type: 'number', min: 1, max: 10, step: 1, defaultValue: 6 },
        { id: 'padding', label: 'Safety Gap', type: 'number', min: 0, max: 40, step: 1, defaultValue: 4 },
        { id: 'bias', label: 'Split Bias', type: 'number', min: 0.1, max: 0.9, step: 0.1, defaultValue: 0.5 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'labels', label: 'Technical Data', type: 'boolean', defaultValue: false },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Core Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { depth, padding, bias, glow, labels, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        
        const activeDepth = Math.round(depth * (0.5 + mid * 0.5));
        const activeBias = bias + (Math.sin(time * 0.002) * 0.2 * bass);
        
        let seed = 444;
        const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

        const divide = (x: number, y: number, w: number, h: number, d: number) => {
            // Audio-driven early exit or subdivision
            const pulse = (Math.sin(time * 0.01 + x + y) + 1) * 0.5;
            
            if (d <= 0 || (w < 20 || h < 20)) {
                if (isGridAlive(x, y, width, height, globalState)) {
                    ctx.save();
                    ctx.fillStyle = '#ef4444';
                    ctx.globalAlpha = 0.3 * vol;
                    ctx.fillRect(x + padding, y + padding, w - padding * 2, h - padding * 2);
                    ctx.restore();
                    return;
                }

                ctx.save();
                if (glow) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = (5 + treble * 30) * pulse;
                }
                
                ctx.globalAlpha = 0.4 + vol * 0.6;
                ctx.lineWidth = 1 + treble * 3;
                ctx.strokeRect(x + padding, y + padding, w - padding * 2, h - padding * 2);
                
                if (labels && w > 60 && h > 30) {
                    ctx.font = '8px monospace';
                    ctx.fillStyle = color;
                    ctx.fillText(`XY:${x.toFixed(0)},${y.toFixed(0)}`, x + padding + 5, y + padding + 15);
                    ctx.fillText(`WH:${w.toFixed(0)}x${h.toFixed(0)}`, x + padding + 5, y + padding + 25);
                }
                ctx.restore();
                return;
            }

            const split = rand() > activeBias;
            if (split) {
                const h1 = h * 0.5;
                divide(x, y, w, h1, d - 1);
                divide(x, y + h1, w, h - h1, d - 1);
            } else {
                const w1 = w * 0.5;
                divide(x, y, w1, h, d - 1);
                divide(x + w1, y, w1, h, d - 1);
            }
        };

        divide(0, 0, width, height, activeDepth);
    }
};
