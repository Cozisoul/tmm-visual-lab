
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const KineticScroller: Machine = {
    id: 'kinetic-scroller',
    name: 'Kinetic Scroller',
    department: MachineDepartment.TYPE,
    description: 'Scrolling text loops.',
    controls: [
        { id: 'text', label: 'Signal Message', type: 'text', defaultValue: 'KINETIC PROCESS' },
        { id: 'size', label: 'Signal Scale', type: 'number', min: 20, max: 300, step: 5, defaultValue: 100 },
        { id: 'mode', label: 'Scroll Logic', type: 'select', options: ['Linear', 'Warp', 'Grid', 'Spectrum'], defaultValue: 'Linear' },
        { id: 'spacing', label: 'Unit Spacing', type: 'number', min: 0.1, max: 2, step: 0.1, defaultValue: 1.2 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Core Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { text, size, mode, spacing, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        const activeSize = size * (1 + bass * 0.2);
        ctx.font = `italic 900 ${activeSize}px Helvetica, Arial, sans-serif`;
        
        const fullText = (text + "   ");
        const tw = ctx.measureText(fullText).width * spacing;
        const speed = (width / 5) * (1 + mid * 2);
        const offset = (time * 0.001 * speed) % tw;

        const rows = Math.ceil(height / (activeSize * 0.8)) + 2;
        
        for (let i = -1; i < rows; i++) {
            const y = i * (activeSize * 0.85);
            const dir = i % 2 === 0 ? 1 : -1;
            const rowOffset = (offset * dir) + (i * 100);
            
            ctx.save();
            ctx.translate(0, y);
            
            if (mode === 'Warp') {
                ctx.rotate(Math.sin(time * 0.001 + i * 0.5) * 0.1);
            } else if (mode === 'Spectrum') {
                ctx.globalAlpha = 0.1 + (i / rows) * 0.9;
            }

            for (let j = -2; j < Math.ceil(width / tw) + 2; j++) {
                const tx = j * tw + (rowOffset % tw);
                
                const isAlive = isGridAlive(tx + tw/2, y, width, height, globalState);
                
                ctx.save();
                if (isAlive) {
                    ctx.fillStyle = '#ef4444';
                    ctx.globalAlpha = 0.2 * vol;
                } else {
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.3 + vol * 0.7;
                    if (glow) {
                        ctx.shadowColor = color;
                        ctx.shadowBlur = treble * 30;
                    }
                }

                if (mode === 'Grid') {
                    ctx.fillText(text, tx, 0);
                } else {
                    ctx.fillText(fullText, tx, 0);
                }
                ctx.restore();
            }
            
            // Add technical scanlines on treble spikes
            if (treble > 0.7 && i % 4 === 0) {
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.1;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, 0); ctx.lineTo(width, 0);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Industrial Frame
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, width - 40, height - 40);
        
        if (vol > 0.5) {
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = color;
            ctx.fillText(`SCROLL_VELOCITY: ${speed.toFixed(0)}PX/S`, 40, 45);
        }
    }
};
