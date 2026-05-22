
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { random } from '../../utils/math';

export const ArchitecturePrint: Machine = {
    id: 'architecture-print',
    name: 'Architecture Print',
    department: MachineDepartment.GRID,
    description: 'System blueprint and structural hierarchy.',
    controls: [
        { id: 'depth', label: 'Logic Depth', type: 'number', min: 1, max: 8, step: 1, defaultValue: 5 },
        { id: 'split', label: 'Signal Ratio', type: 'number', min: 0.1, max: 0.9, step: 0.1, defaultValue: 0.6 },
        { id: 'margin', label: 'Structural Gap', type: 'number', min: 0, max: 60, step: 2, defaultValue: 12 },
        { id: 'labels', label: 'Technical Data', type: 'boolean', defaultValue: true },
        { id: 'glow', label: 'Phosphor Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Deep Blueprint', type: 'color', defaultValue: '#1e3a8a' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { depth, split, margin, labels, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        
        let seed = 888;
        const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

        // Scale recursion depth with mid-range energy
        const activeDepth = Math.round(depth * (0.6 + mid * 0.4));
        
        const drawBlueprintRect = (x: number, y: number, w: number, h: number, d: number) => {
            if (d <= 0 || w < 20 || h < 20) {
                if (isGridAlive(x + w/2, y + h/2, width, height, globalState)) {
                    ctx.save();
                    ctx.fillStyle = '#f97316';
                    ctx.globalAlpha = 0.4 * vol;
                    ctx.fillRect(x + margin, y + margin, w - margin*2, h - margin*2);
                    ctx.restore();
                    return;
                }

                ctx.save();
                if (glow) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = (10 + treble * 40);
                }
                
                ctx.globalAlpha = 0.6 + vol * 0.4;
                ctx.lineWidth = 1 + (w > 200 ? 1 : 0);
                
                const m = margin * (1 - bass * 0.2);
                ctx.strokeRect(x + m, y + m, w - m*2, h - m*2);
                
                // Crosshairs for high-frequency segments
                if (treble > 0.6 && rand() > 0.5) {
                    ctx.globalAlpha = 0.2;
                    ctx.beginPath();
                    ctx.moveTo(x + m, y + m); ctx.lineTo(x + w - m, y + h - m);
                    ctx.moveTo(x + w - m, y + m); ctx.lineTo(x + m, y + h - m);
                    ctx.stroke();
                }

                if (labels && w > 80 && h > 40) {
                    ctx.font = '9px monospace';
                    ctx.globalAlpha = 0.8;
                    const id = `SYS_NODE_${(rand() * 9999).toFixed(0)}`;
                    ctx.fillText(id, x + m + 6, y + m + 15);
                    ctx.fillText(`L:${d} W:${w.toFixed(0)}`, x + m + 6, y + m + 28);
                }
                ctx.restore();
                return;
            }

            const isVert = rand() > 0.5;
            const activeSplit = split + (Math.sin(time * 0.001 + d) * 0.1 * mid);
            
            if (isVert) {
                const w1 = w * activeSplit;
                drawBlueprintRect(x, y, w1, h, d - 1);
                drawBlueprintRect(x + w1, y, w - w1, h, d - 1);
            } else {
                const h1 = h * activeSplit;
                drawBlueprintRect(x, y, w, h1, d - 1);
                drawBlueprintRect(x, y + h1, w, h - h1, d - 1);
            }
        };

        drawBlueprintRect(0, 0, width, height, activeDepth);

        // Technical borders & data strips
        if (labels) {
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.strokeRect(10, 10, width - 20, height - 20);
            
            ctx.font = 'bold 10px monospace';
            ctx.globalAlpha = 0.5;
            ctx.fillText(`ARCHITECTURE_BLUEPRINT_V4.0`, 20, 25);
            ctx.fillText(`SIGNAL_INTENSITY: ${(vol * 100).toFixed(1)}%`, width - 180, 25);
            
            // Scaled measurement line
            const mLineY = height - 25;
            ctx.beginPath();
            ctx.moveTo(40, mLineY); ctx.lineTo(width - 40, mLineY);
            ctx.moveTo(40, mLineY - 5); ctx.lineTo(40, mLineY + 5);
            ctx.moveTo(width - 40, mLineY - 5); ctx.lineTo(width - 40, mLineY + 5);
            ctx.stroke();
            ctx.restore();
        }
    }
};
