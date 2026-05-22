
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { getParticlePool } from '../../services/particleManager';

export const ParticleAnalyzer: Machine = {
    id: 'particle-analyzer',
    name: 'Particle Analyzer',
    department: MachineDepartment.SIGNAL,
    description: 'Particles driven by audio bands.',
    controls: [
        { id: 'count', label: 'Signal Units', type: 'number', min: 100, max: 3000, step: 100, defaultValue: 1200 },
        { id: 'mode', label: 'Swarm Logic', type: 'select', options: ['Ascend', 'Vortex', 'Descend', 'Cosmic'], defaultValue: 'Ascend' },
        { id: 'size', label: 'Unit Scale', type: 'number', min: 1, max: 12, step: 1, defaultValue: 3 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { count, mode, size, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;
        const fft = globalState?.audio.fft || [];

        fillBackground(ctx, width, height, bg, globalState);
        
        const pool = getParticlePool('analyzer', count, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
        }));

        const t = time * 0.001;
        
        for (let i = 0; i < count; i++) {
            const p = pool[i];
            const band = i % (fft.length || 1);
            const amp = fft[band] || 0;
            
            // Movement Logic
            if (mode === 'Ascend') {
                p.y -= (0.5 + amp * 10) * (1 + mid);
                p.x += Math.sin(t + i) * 0.5;
            } else if (mode === 'Vortex') {
                const dx = p.x - width / 2;
                const dy = p.y - height / 2;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) + (0.02 + amp * 0.1);
                p.x = width / 2 + Math.cos(angle) * dist;
                p.y = height / 2 + Math.sin(angle) * dist;
            } else if (mode === 'Descend') {
                p.y += (0.5 + amp * 10) * (1 + bass);
            } else if (mode === 'Cosmic') {
                p.x += p.vx * (1 + amp * 5);
                p.y += p.vy * (1 + amp * 5);
            }

            // Boundary
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;

            const isAlive = isGridAlive(p.x, p.y, width, height, globalState);

            ctx.save();
            if (isAlive) {
                ctx.fillStyle = '#ff0000';
                ctx.globalAlpha = 0.2 * vol;
            } else {
                ctx.fillStyle = color;
                ctx.globalAlpha = (0.2 + amp * 0.8) * (1 + vol);
                if (glow) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = treble * 20;
                }
            }

            const activeSize = Math.max(0, size * (0.5 + amp * 2));
            ctx.beginPath();
            ctx.arc(p.x, p.y, activeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Technical Readout
        if (vol > 0.4) {
            ctx.save();
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            ctx.fillText(`SIGNAL_UNITS: ${count}`, 40, 40);
            ctx.fillText(`BUFFER_FEED: 0x${(mid * 0xFF).toString(16).toUpperCase()}`, 40, 50);
            ctx.strokeRect(30, 30, 150, 30);
            ctx.restore();
        }
    }
};
