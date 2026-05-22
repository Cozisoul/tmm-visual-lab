
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const GlyphSwarm: Machine = {
    id: 'glyph-swarm',
    name: 'Glyph Swarm',
    department: MachineDepartment.TYPE,
    description: 'Swarming characters reacting to noise.',
    controls: [
        { id: 'count', label: 'Swarm Density', type: 'number', min: 20, max: 1000, step: 20, defaultValue: 200 },
        { id: 'size', label: 'Glyph Scale', type: 'number', min: 8, max: 120, step: 2, defaultValue: 20 },
        { id: 'mode', label: 'Swarm Logic', type: 'select', options: ['Noise', 'Helix', 'Rain', 'Vortex'], defaultValue: 'Noise' },
        { id: 'chars', label: 'Signal Data', type: 'text', defaultValue: '01ABCDEF' },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#22c55e' },
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { count, size, mode, chars, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.font = `bold ${size}px monospace`;
        ctx.textAlign = 'center';

        const t = time * 0.001;
        
        for (let i = 0; i < count; i++) {
            let x = 0, y = 0, rot = 0;
            const seed = i * 123;
            const r = (n: number) => noise(n, t * 0.5);

            if (mode === 'Noise') {
                x = (r(i) * width * 1.5) % width;
                y = (r(i + 500) * height * 1.5) % height;
                rot = r(i + 1000) * Math.PI;
            } else if (mode === 'Helix') {
                const angle = i * 0.1 + t;
                const radius = (r(i) * 200 + 50) * (1 + bass);
                x = width / 2 + Math.cos(angle) * radius;
                y = (i / count) * height;
            } else if (mode === 'Rain') {
                x = (i / count) * width;
                y = (time * (0.2 + r(i) * 0.5)) % height;
            } else if (mode === 'Vortex') {
                const dist = (i / count) * Math.max(width, height) * 0.5 * (1 + mid);
                const angle = t * (1 + i * 0.01);
                x = width / 2 + Math.cos(angle) * dist;
                y = height / 2 + Math.sin(angle) * dist;
                rot = angle + Math.PI / 2;
            }

            const char = chars[i % chars.length];
            const isAlive = isGridAlive(x, y, width, height, globalState);

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rot);

            if (isAlive) {
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.8 * vol;
                if (glow) {
                    ctx.shadowColor = '#ffffff';
                    ctx.shadowBlur = 20;
                }
                ctx.fillText('?', 0, 0);
            } else {
                ctx.fillStyle = color;
                ctx.globalAlpha = (0.3 + vol * 0.7) * (1 - (i / count) * 0.5);
                if (glow) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = treble * 30;
                }
                ctx.fillText(char, 0, 0);
            }
            ctx.restore();

            // Add signal artifacts on treble spikes
            if (treble > 0.8 && i % 20 === 0) {
                ctx.save();
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.2;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + (r(i) - 0.5) * 200, y);
                ctx.stroke();
                ctx.restore();
            }
        }
    }
};
