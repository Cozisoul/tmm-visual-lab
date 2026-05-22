
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

// Stateful history buffer
let spectroBuffer: Uint8Array[] = [];

export const SpectrogramHistory: Machine = {
    id: 'spectrogram-history',
    name: 'Spectrogram History',
    department: MachineDepartment.SIGNAL,
    description: 'Scrolling frequency history.',
    controls: [
        { id: 'mode', label: 'Display Logic', type: 'select', options: ['Waterfall', 'Polar', 'Heatmap', 'Spectrum'], defaultValue: 'Waterfall' },
        { id: 'gain', label: 'Input Gain', type: 'number', min: 0.1, max: 10, step: 0.1, defaultValue: 3 },
        { id: 'speed', label: 'Flow Rate', type: 'number', min: 1, max: 20, step: 1, defaultValue: 4 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Peak Signal', type: 'color', defaultValue: '#ff3300' },
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { mode, gain, speed, glow, color, bg } = params;
        const audio = globalState?.audio;
        if (!audio) return;
        
        const vol = audio.volume || 0;
        const treble = audio.treble || 0;
        const fft = audio.fft || [];

        // Update buffer
        spectroBuffer.unshift(new Uint8Array(fft));
        const maxHistory = mode === 'Polar' ? 50 : Math.ceil(height / speed);
        if (spectroBuffer.length > maxHistory) spectroBuffer.pop();

        fillBackground(ctx, width, height, bg, globalState);
        
        const barW = width / fft.length;

        if (mode === 'Waterfall' || mode === 'Heatmap') {
            spectroBuffer.forEach((frame, i) => {
                const y = mode === 'Waterfall' ? i * speed : height - i * speed;
                for (let j = 0; j < frame.length; j++) {
                    const val = (frame[j] / 255) * gain;
                    if (val < 0.05) continue;

                    const isAlive = isGridAlive(j * barW, y, width, height, globalState);
                    
                    ctx.save();
                    if (isAlive) {
                        ctx.fillStyle = '#ffffff';
                        ctx.globalAlpha = 0.1;
                    } else {
                        ctx.fillStyle = color;
                        ctx.globalAlpha = Math.min(1, val);
                        if (glow) {
                            ctx.shadowColor = color;
                            ctx.shadowBlur = (val / 10) * treble * 50;
                        }
                    }

                    ctx.fillRect(j * barW, y, barW, speed);
                    ctx.restore();
                }
            });
        } else if (mode === 'Polar') {
            const cx = width / 2;
            const cy = height / 2;
            const baseRadius = Math.min(width, height) * 0.1; // Define a base radius for polar mode
            spectroBuffer.forEach((frame, i) => {
                const ringRadius = baseRadius * (1 + i * 0.1);
                ctx.beginPath();
                for (let j = 0; j < frame.length; j++) {
                    const angle = (j / frame.length) * Math.PI * 2;
                    const val = (frame[j] / 255) * gain * 50;
                    const r = ringRadius + val;
                    const x = cx + Math.cos(angle) * r;
                    const y = cy + Math.sin(angle) * r;
                    if (j === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = color;
                ctx.globalAlpha = 1 - (i / spectroBuffer.length);
                ctx.stroke();
            });
        }

        // Technical Readout
        if (vol > 0.3) {
            ctx.save();
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.5;
            ctx.fillText(`BUFFER_CAPACITY: ${spectroBuffer.length}/${maxHistory}`, 30, 40);
            ctx.fillText(`SIGNAL_PEAK: ${(vol * 120).toFixed(1)}DB`, 30, 52);
            
            // Frequency markers
            for(let k=1; k<5; k++) {
                const mx = (width/5) * k;
                ctx.beginPath();
                ctx.moveTo(mx, 0); ctx.lineTo(mx, 10);
                ctx.stroke();
                ctx.fillText(`${(k*4).toFixed(0)}KHZ`, mx - 10, 25);
            }
            ctx.restore();
        }
    }
};
