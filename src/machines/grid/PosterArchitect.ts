
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { random } from '../../utils/math';

export const PosterArchitect: Machine = {
    id: 'poster-architect',
    name: 'Poster Architect',
    department: MachineDepartment.GRID,
    description: 'Swiss style typography layout.',
    controls: [
        { id: 'text', label: 'Primary Signal', type: 'text', defaultValue: 'SYSTEM' },
        { id: 'size', label: 'Signal Scale', type: 'number', min: 40, max: 500, step: 10, defaultValue: 180 },
        { id: 'copies', label: 'Echo Depth', type: 'number', min: 1, max: 20, step: 1, defaultValue: 5 },
        { id: 'spread', label: 'Echo Pulse', type: 'number', min: 10, max: 200, step: 5, defaultValue: 60 },
        { id: 'logic', label: 'Layout Core', type: 'select', options: ['Stack', 'Tunnel', 'Scatter', 'Glitch'], defaultValue: 'Stack' },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#000000' },
        { id: 'bg', label: 'Canvas Tone', type: 'color', defaultValue: '#ffffff' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { text, size, copies, spread, logic, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const cx = width / 2;
        const cy = height / 2;
        
        // --- Technical Alignment Lines ---
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 1;
        ctx.strokeRect(40, 40, width - 80, height - 80);
        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx, height);
        ctx.moveTo(0, cy); ctx.lineTo(width, cy);
        ctx.stroke();

        const activeSize = size * (1 + bass * 0.2);
        ctx.font = `900 ${activeSize}px Helvetica, Arial, sans-serif`;

        for (let i = 0; i < copies; i++) {
            const alpha = 1 - (i / copies);
            const instSpread = spread * (1 + mid * 0.5) * i;
            const drift = Math.sin(time * 0.002 + i * 0.5) * 20 * bass;
            
            ctx.save();
            ctx.globalAlpha = alpha * (0.5 + vol * 0.5);
            
            if (glow) {
                ctx.shadowColor = color;
                ctx.shadowBlur = treble * 30 * alpha;
            }

            if (isGridAlive(cx, cy + instSpread, width, height, globalState)) {
                ctx.globalAlpha *= 0.2;
            }

            let tx = cx;
            let ty = cy;
            let rot = 0;

            if (logic === 'Stack') {
                ty += instSpread;
            } else if (logic === 'Tunnel') {
                const scale = 1 - (i * 0.1);
                ctx.scale(scale, scale);
                ty += instSpread * 0.5;
            } else if (logic === 'Scatter') {
                tx += Math.cos(i + time * 0.001) * instSpread;
                ty += Math.sin(i + time * 0.001) * instSpread;
                rot = i * 0.2;
            } else if (logic === 'Glitch') {
                tx += (random(i + time) - 0.5) * 100 * treble;
                ty += instSpread;
            }

            ctx.translate(tx, ty + drift);
            ctx.rotate(rot);

            ctx.fillStyle = color;
            ctx.fillText(text, 0, 0);
            
            // Secondary technical markers
            if (i === 0 && vol > 0.4) {
                ctx.font = 'bold 12px Helvetica';
                ctx.fillText(`SIGNAL_STRENGTH: ${(vol * 100).toFixed(0)}%`, 0, activeSize * 0.6);
            }
            
            ctx.restore();
        }
    }
};
