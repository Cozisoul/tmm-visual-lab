
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise, random } from '../../utils/math';

export const SignalBreak: Machine = {
    id: 'signal-break',
    name: 'Signal Break',
    department: MachineDepartment.TYPE,
    description: 'Broken transmission text.',
    controls: [
        { id: 'text', label: 'Signal Stream', type: 'text', defaultValue: 'SYNC_ERROR' },
        { id: 'scale', label: 'Signal Scale', type: 'number', min: 0.5, max: 3, step: 0.1, defaultValue: 1.5 },
        { id: 'mode', label: 'Signal Break', type: 'select', options: ['Transmission', 'RGB_Shift', 'Data_Noise', 'CRT_Flicker'], defaultValue: 'RGB_Shift' },
        { id: 'intensity', label: 'Glitch Energy', type: 'number', min: 0, max: 100, step: 1, defaultValue: 40 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Core Signal', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { text, scale, mode, intensity, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        const baseSize = 90 * scale;
        const activeSize = baseSize * (1 + bass * 0.1);
        ctx.font = `italic 900 ${activeSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const cx = width / 2;
        const cy = height / 2;
        const t = time * 0.001;
        
        const slices = 20 + Math.floor(mid * 40);
        const sliceH = (activeSize * 2) / slices;

        const drawSegmentedText = (txt: string, x: number, y: number, clr: string, shift: number) => {
            ctx.fillStyle = clr;
            for (let i = 0; i < slices; i++) {
                const sy = (cy - activeSize) + i * sliceH;
                const seed = i + t;
                let gx = 0;
                
                const breakChance = (intensity / 100) * (0.5 + treble);
                if (noise(seed, t * 5) < breakChance) {
                    gx = (random(i + Math.floor(t * 10)) - 0.5) * 150 * vol;
                }

                if (isGridAlive(cx, sy, width, height, globalState)) {
                    if (noise(seed, t) > 0.4) continue;
                }

                ctx.save();
                ctx.beginPath();
                ctx.rect(0, sy, width, sliceH);
                ctx.clip();
                
                if (glow) {
                    ctx.shadowColor = clr;
                    ctx.shadowBlur = treble * 20;
                }
                
                ctx.fillText(txt, x + gx + shift, y);
                ctx.restore();
            }
        };

        if (mode === 'RGB_Shift') {
            ctx.globalCompositeOperation = 'screen';
            const shiftAmt = (intensity * 0.5) * vol;
            drawSegmentedText(text, cx, cy, '#ff0000', -shiftAmt);
            drawSegmentedText(text, cx, cy, '#00ff00', shiftAmt);
            drawSegmentedText(text, cx, cy, '#0000ff', 0);
            ctx.globalCompositeOperation = 'source-over';
        } else if (mode === 'Data_Noise') {
            drawSegmentedText(text, cx, cy, color, 0);
            // Add noise dots
            ctx.fillStyle = color;
            for(let j=0; j<50; j++) {
                if (random(j+t) > 0.8) {
                    ctx.fillRect(random(j)*width, random(j+1)*height, 2, 2);
                }
            }
        } else if (mode === 'CRT_Flicker') {
            ctx.globalAlpha = 0.5 + Math.sin(t*50)*0.5;
            drawSegmentedText(text, cx, cy, color, 0);
        } else {
            drawSegmentedText(text, cx, cy, color, 0);
        }

        // Technical Overlay
        if (vol > 0.3) {
            ctx.save();
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            ctx.fillText(`CRC_ERR: 0x${(vol * 255).toString(16).toUpperCase()}`, 70, height - 40);
            ctx.fillText(`SIGNAL_LOSS: ${(intensity * vol).toFixed(1)}DB`, 70, height - 55);
            
            // Scanline effect
            ctx.lineWidth = 1;
            ctx.beginPath();
            const scanY = (t * 200) % height;
            ctx.moveTo(0, scanY); ctx.lineTo(width, scanY);
            ctx.stroke();
            ctx.restore();
        }
    }
};
