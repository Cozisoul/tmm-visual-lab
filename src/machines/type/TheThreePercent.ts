
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { random } from '../../utils/math';

export const TheThreePercent: Machine = {
    id: 'the-three-percent',
    name: 'The 3% Rule',
    department: MachineDepartment.TYPE,
    description: 'Post-industrial manifesto logic. Abloh-esque branding meets data noise.',
    controls: [
        { id: 'text', label: 'Primary Label', type: 'text', defaultValue: '"OBJECT"' },
        { id: 'size', label: 'Scale', type: 'number', min: 40, max: 400, step: 10, defaultValue: 120 },
        { id: 'density', label: 'Manifesto Density', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.2 },
        { id: 'xray', label: 'X-Ray Mode', type: 'boolean', defaultValue: false },
        { id: 'glitch', label: 'Signal Noise', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.3 },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#000000' }, 
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#ffffff' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { text, size, density, xray, glitch, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const high = globalState?.audio.treble || 0;

        // X-Ray Mode override
        const activeBg = xray ? '#0033ff' : bg;
        const activeColor = xray ? '#ffffff' : color;
        
        fillBackground(ctx, width, height, activeBg, globalState);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const cx = width / 2;
        const cy = height / 2;
        
        // --- Technical Grid Background ---
        ctx.strokeStyle = activeColor;
        ctx.globalAlpha = 0.1;
        ctx.lineWidth = 1;
        const step = 50;
        for(let x=0; x<width; x+=step) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for(let y=0; y<height; y+=step) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        // --- Scanning Lines ---
        ctx.globalAlpha = 0.2 * (vol + 0.5);
        const scanY = (time * 0.2) % height;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.stroke();

        // --- Data Readouts (The Manifesto) ---
        ctx.globalAlpha = 1;
        ctx.font = '10px monospace';
        ctx.fillStyle = activeColor;
        const dataText = [
            `TS:${time.toFixed(0)}`,
            `VOL:${vol.toFixed(2)}`,
            `BASS:${bass.toFixed(2)}`,
            `GRID_ENGINE:ACTIVE`,
            `AESTHETIC:INDUSTRIAL`,
            `RULE_V:003%`
        ];
        dataText.forEach((t, i) => {
            ctx.fillText(t, 60, 60 + i * 15);
        });

        // --- Primary Object ---
        ctx.save();
        const glitchShift = (random(time) < glitch * vol) ? (random(time) - 0.5) * 40 : 0;
        const activeSize = size * (1 + bass * 0.2);
        
        ctx.font = `900 ${activeSize}px Helvetica, Arial, sans-serif`;
        const textMetrics = ctx.measureText(text);
        const textW = textMetrics.width;

        // Industrial Label Background (Yellow Tape)
        if (!xray) {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx - textW/2 - 30 + glitchShift, cy - activeSize/2 - 10, textW + 60, activeSize + 20);
        }

        ctx.fillStyle = activeColor;
        ctx.fillText(text, cx + glitchShift, cy);

        // Technical details
        ctx.font = `bold ${activeSize * 0.15}px Helvetica`;
        ctx.fillText("© 2024", cx + textW/2 + 40 + glitchShift, cy - activeSize/3);
        
        ctx.font = '12px Helvetica';
        ctx.fillText("DESIGNED BY TMM-LAB™", cx + glitchShift, cy + activeSize * 0.7);
        ctx.restore();

        // --- The 3% Logic: Rhythmic Clutter ---
        if (density > 0) {
            const itemCount = Math.floor(density * 10 * (1 + high * 5));
            ctx.font = `bold ${activeSize * 0.2}px Helvetica`;
            ctx.globalAlpha = 0.6;
            
            for(let i=0; i<itemCount; i++) {
                const seed = i * 100 + Math.floor(time / 200);
                const rx = random(seed) * width;
                const ry = random(seed + 1) * height;
                const rRot = (random(seed + 2) - 0.5) * 0.2;
                
                ctx.save();
                ctx.translate(rx, ry);
                ctx.rotate(rRot);
                
                // Small labels or symbols
                if (random(seed + 3) > 0.5) {
                    ctx.fillText(text.replace(/"/g, ''), 0, 0);
                    ctx.strokeRect(-20, -10, 40, 20);
                } else {
                    ctx.fillText(`${(random(seed + 4) * 100).toFixed(1)}%`, 0, 0);
                }
                ctx.restore();
            }
        }

        // --- Fullscreen Flash on high volume ---
        if (bass > 0.8) {
            ctx.fillStyle = activeColor;
            ctx.globalAlpha = 0.1;
            ctx.fillRect(0,0,width,height);
        }
    }
};
