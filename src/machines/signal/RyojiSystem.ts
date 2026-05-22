
import { Machine, MachineDepartment } from '../../types';
import { fillBackground } from '../../utils/canvas';
import { random } from '../../utils/math';

export const RyojiSystem: Machine = {
    id: 'ryoji-system',
    name: 'Ryoji System',
    department: MachineDepartment.SIGNAL,
    description: 'High-precision data strata (Ikeda).',
    controls: [
        { id: 'lines', label: 'Scan Strata', type: 'number', min: 10, max: 400, step: 10, defaultValue: 120 },
        { id: 'speed', label: 'Data Clock', type: 'number', min: 1, max: 60, step: 1, defaultValue: 30 },
        { id: 'split', label: 'Matrix Split', type: 'boolean', defaultValue: true },
        { id: 'glow', label: 'Data Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Pulse Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Void Core', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { lines, speed, split, glow, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const treble = globalState?.audio.treble || 0;
        const raw = globalState?.audio.raw || []; 
        
        fillBackground(ctx, width, height, bg, globalState);
        
        const frame = Math.floor(time / (1000/speed));
        const activeLines = Math.floor(lines * (0.8 + bass * 0.4));
        const rowH = height / activeLines;
        let seed = frame;
        const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        const sTime = time * 0.001 * speed;

        for(let i=0; i < activeLines; i++) {
            const y = i * rowH;
            const audioVal = raw.length > 0 ? (raw[i % raw.length] / 255) : 0;
            const threshold = 0.4 + (Math.sin(sTime + i * 0.1) * 0.2);
            
            ctx.save();
            if (glow) {
                ctx.shadowColor = color;
                ctx.shadowBlur = (audioVal > 0.8 ? treble * 40 : 0);
            }

            if (split && i > activeLines / 2) {
                 if (rand() > 0.85 || audioVal > 0.7) {
                     const w = rand() * width * 0.3 * (1 + vol);
                     const x = rand() * (width - w);
                     ctx.fillStyle = color;
                     ctx.globalAlpha = 0.5 + audioVal * 0.5;
                     ctx.fillRect(x, y, w, rowH - 1);
                 }
            } else {
                if (rand() > threshold - (vol * 0.6)) {
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.3 + audioVal * 0.7;
                    ctx.fillRect(0, y, width, rowH * 0.9);
                    
                    if (rand() > 0.92) {
                        ctx.fillStyle = bg;
                        const w = rand() * width * 0.5;
                        const x = width/2 - w/2;
                        ctx.fillRect(x, y, w, rowH);
                    }
                }
            }
            ctx.restore();
        }
        
        // Data Overlays
        if (vol > 0.3) {
            ctx.save();
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.5;
            ctx.fillText(`SYS.DAT.STREAM: [${sTime.toFixed(4)}]`, 20, height - 30);
            ctx.fillText(`CLOCK.SYNC: ${speed}HZ`, 20, height - 42);
            ctx.fillText(`SIGNAL.VOL: ${(vol*100).toFixed(1)}%`, 20, height - 54);
            
            // Draw a vertical "tape" of data
            const tapeX = width - 40;
            ctx.strokeRect(tapeX, 20, 20, height - 40);
            for(let k=0; k<10; k++) {
                if(rand() > 0.5) ctx.fillRect(tapeX + 5, 30 + k * (height/12), 10, 4);
            }
            ctx.restore();
        }
    }
};
