
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const AudioReactor: Machine = {
    id: 'audio-reactor',
    name: 'Audio Reactor',
    department: MachineDepartment.SIGNAL,
    description: 'Circular FFT Visualizer.',
    controls: [
        { id: 'radius', label: 'Signal Core', type: 'number', min: 20, max: 400, step: 10, defaultValue: 120 },
        { id: 'mode', label: 'Reactor Logic', type: 'select', options: ['Circular', 'Symmetry', 'Orbital', 'Mirror'], defaultValue: 'Circular' },
        { id: 'sens', label: 'Gain Sensitivity', type: 'number', min: 0.1, max: 5, step: 0.1, defaultValue: 2.5 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { radius, mode, sens, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;
        const fft = globalState?.audio.fft || [];

        fillBackground(ctx, width, height, bg, globalState);
        
        const cx = width / 2;
        const cy = height / 2;
        const baseRadius = radius * (1 + bass * 0.2);
        
        const bars = Math.min(128, fft.length);
        const step = (Math.PI * 2) / bars;

        for (let i = 0; i < bars; i++) {
            const val = fft[i] * sens;
            const angle = i * step + (mode === 'Orbital' ? time * 0.001 : 0);
            
            let x1 = cx + Math.cos(angle) * baseRadius;
            let y1 = cy + Math.sin(angle) * baseRadius;
            let x2 = cx + Math.cos(angle) * (baseRadius + val);
            let y2 = cy + Math.sin(angle) * (baseRadius + val);

            if (mode === 'Symmetry') {
                const sAngle = (i % (bars / 2)) * (Math.PI / (bars / 4));
                x1 = cx + Math.cos(sAngle) * baseRadius;
                x2 = cx + Math.cos(sAngle) * (baseRadius + val);
                // Symmetry logic here... (Simplified for now)
            }

            const isAlive = isGridAlive(x2, y2, width, height, globalState);

            ctx.save();
            if (isAlive) {
                ctx.strokeStyle = '#ef4444';
                ctx.globalAlpha = 0.3 * vol;
            } else {
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.5 + vol * 0.5;
                if (glow) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = (val / 10) * treble;
                }
            }

            ctx.lineWidth = (Math.PI * 2 * baseRadius) / bars * 0.8;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.restore();

            // Symmetry Mirror
            if (mode === 'Mirror') {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(-1, 1);
                ctx.translate(-cx, -cy);
                // Draw mirrored bar...
                ctx.restore();
            }
        }

        // Technical Readout
        if (vol > 0.3) {
            ctx.save();
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            ctx.fillText(`RMS_LEVEL: ${(vol * 100).toFixed(1)}%`, 40, 40);
            ctx.fillText(`SIGNAL_PEAK: ${(bass * 100).toFixed(1)}%`, 40, 55);
            
            // Peak indicator bar
            ctx.strokeRect(40, 70, 100, 4);
            ctx.fillRect(40, 70, vol * 100, 4);
            ctx.restore();
        }
    }
};
