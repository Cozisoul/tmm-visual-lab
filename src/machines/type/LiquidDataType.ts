
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise, random } from '../../utils/math';

export const LiquidDataType: Machine = {
    id: 'liquid-data-type',
    name: 'Liquid Data Type',
    department: MachineDepartment.TYPE,
    description: 'Melting typography.',
    controls: [
        { id: 'text', label: 'Signal Data', type: 'text', defaultValue: 'MELTDOWN' },
        { id: 'scale', label: 'Signal Scale', type: 'number', min: 0.5, max: 3, step: 0.1, defaultValue: 1.2 },
        { id: 'mode', label: 'Liquid Core', type: 'select', options: ['Viscous', 'Acidic', 'Glitch', 'Vapor'], defaultValue: 'Viscous' },
        { id: 'viscosity', label: 'Flow Resistance', type: 'number', min: 0, max: 100, step: 1, defaultValue: 30 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { text, scale, mode, viscosity, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        const baseFontSize = 120 * scale;
        const activeSize = baseFontSize * (1 + bass * 0.2);
        ctx.font = `900 ${activeSize}px ArialBlack, Helvetica, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const cx = width / 2;
        const cy = height / 2;
        
        const slices = 120;
        const sliceH = (activeSize * 1.5) / slices;
        const t = time * 0.001;

        for (let i = 0; i < slices; i++) {
            const yOffset = (i - slices / 2) * sliceH;
            const y = cy + yOffset;
            
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, y - sliceH / 2, width, sliceH + 1);
            ctx.clip();

            let offX = 0;
            let offY = 0;
            const seed = i * 0.1;

            if (mode === 'Viscous') {
                offX = Math.sin(t + seed) * (viscosity * (1 + mid));
                offY = (i / slices) * (viscosity * 2) * bass;
            } else if (mode === 'Acidic') {
                offX = noise(seed, t) * 100 * vol;
                offY = Math.tan(t * 0.5 + seed * 0.2) * 10 * treble;
            } else if (mode === 'Glitch') {
                if (noise(seed, t * 10) > 0.5) offX = (random(i) - 0.5) * 200 * treble;
            } else if (mode === 'Vapor') {
                offX = Math.sin(t * 2 + seed) * 300 * (i / slices) * vol;
                ctx.globalAlpha = 1 - (i / slices);
            }

            const isAlive = isGridAlive(cx + offX, y, width, height, globalState);

            if (isAlive) {
                ctx.fillStyle = '#ff3300';
                ctx.globalAlpha = 0.4 * vol;
                ctx.fillText(text, cx + offX + (random(i) - 0.5) * 50, cy + offY);
            } else {
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.6 + vol * 0.4;
                if (glow) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = treble * 30;
                }
                ctx.fillText(text, cx + offX, cy + offY);
            }

            ctx.restore();
        }

        // Technical Readout
        if (vol > 0.4) {
            ctx.save();
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.5;
            ctx.fillText(`CORE_TEMP: ${(vol * 1000).toFixed(0)}K`, 60, 40);
            ctx.fillText(`VISCOSITY_LEVEL: ${viscosity}%`, 60, 55);
            ctx.restore();
        }
    }
};
