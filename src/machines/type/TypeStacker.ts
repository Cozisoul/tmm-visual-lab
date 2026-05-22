
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { random } from '../../utils/math';

export const TypeStacker: Machine = {
    id: 'type-stacker',
    name: 'Type Stacker',
    department: MachineDepartment.TYPE,
    description: 'Vertical physics typography.',
    controls: [
        { id: 'word', label: 'Primary Signal', type: 'text', defaultValue: 'KINETIC' },
        { id: 'scale', label: 'Mass Scale', type: 'number', min: 0.2, max: 4, step: 0.1, defaultValue: 1.2 },
        { id: 'mode', label: 'Gravitational Logic', type: 'select', options: ['Vertical', 'Floating', 'Chaos', 'Blueprint'], defaultValue: 'Vertical' },
        { id: 'distortion', label: 'Signal Noise', type: 'number', min: 0, max: 100, step: 1, defaultValue: 20 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Core Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { word, scale, mode, distortion, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const baseSize = 80 * scale;
        const activeSize = baseSize * (1 + bass * 0.3);
        ctx.font = `900 ${activeSize}px Helvetica, Arial, sans-serif`;

        const totalH = word.length * (activeSize * 0.75);
        let startY = (height - totalH) / 2 + activeSize / 2;
        
        for (let i = 0; i < word.length; i++) {
            const progress = i / word.length;
            const driftX = Math.sin(time * 0.002 + i) * distortion * (1 + mid);
            const driftY = Math.cos(time * 0.003 + i) * distortion * 0.5 * (1 + bass);
            
            let tx = width / 2;
            let ty = startY + i * (activeSize * 0.75);
            let rot = 0;

            if (mode === 'Floating') {
                tx += driftX;
                ty += driftY;
                rot = Math.sin(time * 0.001 + i) * 0.1;
            } else if (mode === 'Chaos') {
                tx += (random(i + time * 0.0001) - 0.5) * width * 0.5 * vol;
                ty += (random(i + 100 + time * 0.0001) - 0.5) * height * 0.5 * vol;
                rot = random(i + 200) * Math.PI * 2 * vol;
            } else if (mode === 'Blueprint') {
                tx += driftX * 0.2;
                // Draw tech lines
                ctx.save();
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.1;
                ctx.beginPath();
                ctx.moveTo(0, ty); ctx.lineTo(width, ty);
                ctx.stroke();
                ctx.restore();
            } else {
                tx += driftX * 0.5;
            }

            const isAlive = isGridAlive(tx, ty, width, height, globalState);

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(rot);

            if (isAlive) {
                ctx.globalAlpha = 0.3 * vol;
                ctx.fillStyle = '#ef4444';
                ctx.font = `italic 900 ${activeSize * 1.5}px serif`;
                ctx.fillText(word[i], (random(i + time) - 0.5) * 50, (random(i + 1) - 0.5) * 50);
            } else {
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.4 + vol * 0.6;
                if (glow) {
                    ctx.shadowColor = color;
                    ctx.shadowBlur = treble * 30;
                }
                ctx.fillText(word[i], 0, 0);

                // Add bounding technical marks
                if (treble > 0.5 && mode === 'Blueprint') {
                    ctx.shadowBlur = 0;
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = 0.2;
                    ctx.strokeRect(-activeSize/2, -activeSize/2, activeSize, activeSize);
                    ctx.font = '8px monospace';
                    ctx.fillText(`ID: ${word[i].charCodeAt(0)}`, activeSize/2 + 10, 0);
                }
            }
            ctx.restore();
        }
    }
};
