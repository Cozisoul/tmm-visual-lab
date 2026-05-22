
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const SignalOscillator: Machine = {
    id: 'signal-oscillator',
    name: 'Signal Oscillator',
    department: MachineDepartment.SIGNAL,
    description: 'Oscilloscope logic.',
    controls: [
        { id: 'wave', label: 'Waveform Logic', type: 'select', options: ['Sine', 'Square', 'Fractured', 'Pulse'], defaultValue: 'Sine' },
        { id: 'freq', label: 'Signal Freq', type: 'number', min: 1, max: 200, step: 1, defaultValue: 60 },
        { id: 'amp', label: 'Peak Voltage', type: 'number', min: 10, max: 600, step: 10, defaultValue: 200 },
        { id: 'glow', label: 'Phosphor Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Beam Color', type: 'color', defaultValue: '#00ff00' },
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { wave, freq, amp, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 + treble * 5;
        
        const cy = height/2;
        const tBase = time * 0.001;
        
        ctx.beginPath();
        for(let x=0; x<width; x+=1) {
            const progress = x / width;
            const t = (x * 0.01) + (tBase * (freq * 0.1));
            
            let y = 0;
            if (wave === 'Sine') y = Math.sin(t) * amp;
            else if (wave === 'Square') y = (Math.sin(t) > 0 ? 1 : -1) * amp;
            else if (wave === 'Fractured') y = Math.sin(t) * amp * (noise(x * 0.01, tBase) > 0.5 ? 1 : 0);
            else if (wave === 'Pulse') y = Math.pow(Math.sin(t), 5) * amp;
            
            // Audio Modulation
            y *= (0.5 + vol * 1.5);
            
            const isAlive = isGridAlive(x, cy + y, width, height, globalState);
            
            if (isAlive) {
                ctx.stroke();
                ctx.beginPath();
                continue;
            }

            if (glow) {
                ctx.shadowColor = color;
                ctx.shadowBlur = treble * 30;
            } else {
                ctx.shadowBlur = 0;
            }

            if(x === 0) ctx.moveTo(x, cy + y);
            else ctx.lineTo(x, cy + y);
        }
        ctx.stroke();

        // Technical Grid & Labels
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 1;
        // Horizontal guide
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(width, cy);
        ctx.stroke();
        
        // Data readout
        if (vol > 0.2) {
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.6;
            ctx.fillText(`GAIN: ${(vol * 100).toFixed(1)}DB`, 40, 40);
            ctx.fillText(`FREQ: ${freq}HZ`, 40, 55);
            ctx.fillText(`SYNC: LOCKED`, width - 120, 40);
            
            // Draw tiny pulse box
            ctx.strokeRect(width - 40, 30, 10, 10);
            if (bass > 0.8) ctx.fillRect(width - 40, 30, 10, 10);
        }
        ctx.restore();
    }
};
