
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const ModularGridder: Machine = {
    id: 'modular-gridder',
    name: 'Modular Gridder',
    department: MachineDepartment.GRID,
    description: 'Basic grid layout generator.',
    controls: [
        { id: 'cols', label: 'Columns', type: 'number', min: 1, max: 60, step: 1, defaultValue: 6 },
        { id: 'rows', label: 'Rows', type: 'number', min: 1, max: 60, step: 1, defaultValue: 6 },
        { id: 'margin', label: 'Safety Margin', type: 'number', min: 0, max: 200, step: 5, defaultValue: 40 },
        { id: 'gap', label: 'Structural Gap', type: 'number', min: 0, max: 100, step: 1, defaultValue: 8 },
        { id: 'shapeScale', label: 'Cell Mass', type: 'number', min: 0.3, max: 1.0, step: 0.05, defaultValue: 0.85 },
        { id: 'jitter', label: 'Chaos Jitter', type: 'number', min: 0, max: 100, step: 1, defaultValue: 0 },
        { id: 'roundness', label: 'Curvature', type: 'number', min: 0, max: 50, step: 1, defaultValue: 4 },
        { id: 'showGrid', label: 'Show Grid Lines', type: 'boolean', defaultValue: false },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Structural Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Core Background', type: 'color', defaultValue: '#0a0a0a' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { cols, rows, margin, gap, shapeScale, jitter, roundness, showGrid, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;
        
        fillBackground(ctx, width, height, bg, globalState);
        
        // Ensure we have at least 1 column and row
        const safeCols = Math.max(1, Math.floor(cols));
        const safeRows = Math.max(1, Math.floor(rows));
        
        // Calculate cell dimensions
        const availableW = width - margin * 2;
        const availableH = height - margin * 2;
        const cellW = availableW / safeCols;
        const cellH = availableH / safeRows;
        
        // Set up styles
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        
        if (glow && treble > 0) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 5 + treble * 25;
        }
        
        // Draw grid lines if enabled (debug/design mode)
        if (showGrid) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.2;
            ctx.lineWidth = 1;
            
            // Vertical lines
            for (let x = 0; x <= safeCols; x++) {
                const px = margin + x * cellW;
                ctx.beginPath();
                ctx.moveTo(px, margin);
                ctx.lineTo(px, height - margin);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y <= safeRows; y++) {
                const py = margin + y * cellH;
                ctx.beginPath();
                ctx.moveTo(margin, py);
                ctx.lineTo(width - margin, py);
                ctx.stroke();
            }
            ctx.restore();
        }
        
        // Draw cells
        let seed = 42;
        const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        
        for (let y = 0; y < safeRows; y++) {
            for (let x = 0; x < safeCols; x++) {
                const px = margin + x * cellW;
                const py = margin + y * cellH;
                
                // Skip if Game of Life cell is alive at this position
                if (isGridAlive(px + cellW/2, py + cellH/2, width, height, globalState)) continue;
                
                // Generate deterministic random values for this cell
                seed = x * 1000 + y;
                const r1 = rand();
                const r2 = rand();
                
                // Apply jitter
                const jx = (r1 - 0.5) * (jitter + mid * 20);
                const jy = (r2 - 0.5) * (jitter + mid * 20);
                
                // Calculate cell size with audio pulse
                const pulse = 1 + (bass * 0.3 * rand());
                const curW = Math.max(4, (cellW - gap) * shapeScale * pulse);
                const curH = Math.max(4, (cellH - gap) * shapeScale * pulse);
                
                // Center the shape within the cell
                const cx = px + (cellW - curW) / 2 + jx;
                const cy = py + (cellH - curH) / 2 + jy;
                
                // Draw the cell
                ctx.save();
                ctx.globalAlpha = 0.7 + vol * 0.3; // Better base visibility
                
                ctx.beginPath();
                const r = Math.min(roundness, curW / 2, curH / 2);
                ctx.roundRect(cx, cy, curW, curH, r);
                ctx.fill();
                
                // Technical stroke on high treble
                if (treble > 0.3) {
                    ctx.shadowBlur = 0;
                    ctx.globalAlpha = treble;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px + 2, py + 2, cellW - 4, cellH - 4);
                }
                
                ctx.restore();
            }
        }
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
};
