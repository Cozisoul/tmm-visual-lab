
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const QuantumStrobe: Machine = {
    id: 'quantum-strobe',
    name: 'Quantum Strobe',
    department: MachineDepartment.MASTERS,
    description: 'High-frequency binary data (Ryoji Ikeda).',
    controls: [
        { id: 'bars', label: 'Data Density', type: 'number', min: 10, max: 500, step: 10, defaultValue: 200 },
        { id: 'freq', label: 'Strobe Hz', type: 'number', min: 1, max: 60, step: 1, defaultValue: 30 },
        { id: 'noise', label: 'Signal Noise', type: 'number', min: 0, max: 100, step: 1, defaultValue: 10 },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' },
        { id: 'mode', label: 'Pattern', type: 'select', options: ['Barcode', 'Binary', 'Noise'], defaultValue: 'Barcode' },
        { id: 'split', label: 'Split Screen', type: 'boolean', defaultValue: false },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { bars, freq, noise: noiseAmt, color, bg, mode, split } = params;
        const bass = globalState?.audio.bass || 0;
        // Audio Freq Boost
        const activeFreq = freq + (bass * 30);
        const frameT = 1000/activeFreq;
        
        if(Math.floor(time/frameT)%2 === 0) {
             fillBackground(ctx, width, height, bg, globalState);
             return;
        }
        fillBackground(ctx, width, height, bg, globalState);
        ctx.fillStyle = color;
        const w = width / bars;
        const vol = (globalState?.audio.treble || 0);
        const drawSection = (yOffset: number, h: number) => {
            for(let i=0; i<bars; i++) {
                let val = Math.random();
                if(isGridAlive(i*w, height/2, width, height, globalState)) val = 1 - val;
                
                // Signal Noise
                if(Math.random() < noiseAmt/100) val = Math.random();

                let active = false;
                if(mode === 'Barcode') {
                    active = val > 0.8;
                    if(active && vol > 0.5) ctx.fillRect(i*w - w, yOffset, w*3, h);
                } else if (mode === 'Binary') {
                    ctx.font = `${w*1.5}px monospace`;
                    ctx.fillText(val > 0.5 ? '1' : '0', i*w, yOffset + h/2);
                    continue;
                } else {
                    active = val > 0.5;
                }
                if(active && mode !== 'Binary') ctx.fillRect(i*w, yOffset, w, h);
            }
        };
        if(split) {
            drawSection(0, height/2);
            ctx.save();
            ctx.translate(0, height/2);
            ctx.fillStyle = bg === '#000000' ? '#ffffff' : '#000000';
            drawSection(0, height/2);
            ctx.restore();
        } else {
            drawSection(0, height);
        }
    }
};
