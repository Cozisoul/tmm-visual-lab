
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { random } from '../../utils/math';

export const LayoutEngine: Machine = {
    id: 'layout-engine',
    name: 'Layout Engine',
    department: MachineDepartment.GRID,
    description: 'Generative UI/Layout blocks.',
    controls: [
        { id: 'count', label: 'Unit Count', type: 'number', min: 4, max: 80, step: 1, defaultValue: 12 },
        { id: 'mode', label: 'Layout Core', type: 'select', options: ['Grid', 'Random', 'Swiss', 'Stack'], defaultValue: 'Swiss' },
        { id: 'padding', label: 'Internal Padding', type: 'number', min: 0, max: 100, step: 1, defaultValue: 20 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#3b82f6' },
        { id: 'color2', label: 'Data Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Core Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { count, mode, padding, glow, color, color2, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        let seed = 123;
        const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

        const drawBlock = (x: number, y: number, w: number, h: number, isData: boolean) => {
            if (isGridAlive(x, y, width, height, globalState)) {
                ctx.save();
                ctx.strokeStyle = color;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(x, y, w, h);
                ctx.restore();
                return;
            }

            ctx.save();
            if (glow) {
                ctx.shadowColor = color;
                ctx.shadowBlur = treble * 30;
            }

            ctx.fillStyle = isData ? color : '#222222';
            ctx.globalAlpha = 0.5 + vol * 0.5;
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.fill();

            // Technical details
            if (treble > 0.4 && w > 40) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '8px monospace';
                ctx.fillText(`ID: ${(rand() * 1000).toFixed(0)}`, x + 5, y + 15);
                ctx.fillText(`VAL: ${vol.toFixed(2)}`, x + 5, y + 25);
            }
            ctx.restore();
        };

        if (mode === 'Grid') {
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);
            const cw = (width - padding * 2) / cols;
            const ch = (height - padding * 2) / rows;
            for (let i = 0; i < count; i++) {
                const x = padding + (i % cols) * cw;
                const y = padding + Math.floor(i / cols) * ch;
                const pulse = 1 + bass * 0.2;
                drawBlock(x + 5, y + 5, (cw - 10) * pulse, (ch - 10) * pulse, rand() > 0.7);
            }
        } else if (mode === 'Swiss') {
            // Bauhaus/Swiss inspired modular layout
            for (let i = 0; i < count; i++) {
                const w = (0.1 + rand() * 0.4) * width;
                const h = (0.1 + rand() * 0.4) * height;
                const x = rand() * (width - w);
                const y = rand() * (height - h);
                // Snap to grid-like increments
                const snapX = Math.round(x / 40) * 40;
                const snapY = Math.round(y / 40) * 40;
                drawBlock(snapX, snapY, w * (1 + bass * 0.1), h * (1 + mid * 0.1), rand() > 0.6);
            }
        } else {
            // Random scatter
            for (let i = 0; i < count; i++) {
                const w = (0.05 + rand() * 0.2) * width;
                const h = (0.05 + rand() * 0.2) * height;
                const x = rand() * (width - w);
                const y = rand() * (height - h);
                drawBlock(x + Math.sin(time * 0.001 + i) * 20 * mid, y, w, h, rand() > 0.5);
            }
        }
    }
};
