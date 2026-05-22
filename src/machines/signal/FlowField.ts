
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const FlowField: Machine = {
    id: 'flow-field',
    name: 'Flow Field',
    department: MachineDepartment.SIGNAL,
    description: 'Perlin noise vector field.',
    controls: [
        { id: 'scale', label: 'Noise Entropy', type: 'number', min: 10, max: 400, step: 10, defaultValue: 150 },
        { id: 'mode', label: 'Vector Logic', type: 'select', options: ['Perlin', 'Curl', 'Vortex', 'Grid'], defaultValue: 'Perlin' },
        { id: 'particles', label: 'Signal Units', type: 'number', min: 100, max: 1500, step: 100, defaultValue: 600 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#3b82f6' },
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { scale, mode, particles, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.strokeStyle = color;
        const t = time * 0.0005;
        const activeScale = scale * (1 - mid * 0.3);
        
        for (let i = 0; i < particles; i++) {
            let x = (noise(i, 0) * width + t * 50 * (1 + bass)) % width;
            let y = (noise(i + 500, 0) * height) % height;
            
            ctx.beginPath();
            ctx.globalAlpha = (0.2 + vol * 0.8) * (1 - (i / particles) * 0.5);
            
            const steps = 8 + Math.floor(bass * 12);
            for (let k = 0; k < steps; k++) {
                let angle = 0;
                
                if (mode === 'Perlin') {
                    angle = noise(x / activeScale, y / activeScale, t) * Math.PI * 4;
                } else if (mode === 'Curl') {
                    const e = 0.1;
                    const n1 = noise(x / activeScale, (y + e) / activeScale, t);
                    const n2 = noise(x / activeScale, (y - e) / activeScale, t);
                    angle = (n1 - n2) / e * Math.PI;
                } else if (mode === 'Vortex') {
                    const dx = x - width / 2;
                    const dy = y - height / 2;
                    angle = Math.atan2(dy, dx) + Math.PI / 2 + noise(x / activeScale, y / activeScale, t);
                } else if (mode === 'Grid') {
                    angle = Math.floor(noise(x / activeScale, y / activeScale, t) * 4) * (Math.PI / 2);
                }

                const vx = Math.cos(angle) * (5 + treble * 10);
                const vy = Math.sin(angle) * (5 + treble * 10);
                
                const isAlive = isGridAlive(x, y, width, height, globalState);
                if (isAlive) {
                    ctx.strokeStyle = '#ef4444';
                    ctx.globalAlpha = 0.2 * vol;
                } else {
                    ctx.strokeStyle = color;
                    if (glow) {
                        ctx.shadowColor = color;
                        ctx.shadowBlur = treble * 20;
                    }
                }

                if (k === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x + vx, y + vy);
                
                x += vx;
                y += vy;
            }
            ctx.stroke();
        }

        // Technical Overlay
        if (vol > 0.4) {
            ctx.save();
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.fillText(`ENTROPY_SCALE: ${scale.toFixed(0)}`, 30, 40);
            ctx.fillText(`VECTOR_MODE: ${mode.toUpperCase()}`, 30, 50);
            
            // Draw a small vector grid in the corner
            const gSize = 40;
            ctx.strokeRect(width - 60, 20, gSize, gSize);
            for(let gx=0; gx<4; gx++) {
                for(let gy=0; gy<4; gy++) {
                    const ga = noise(gx*0.5, gy*0.5, t) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.moveTo(width - 60 + gx*10 + 5, 20 + gy*10 + 5);
                    ctx.lineTo(width - 60 + gx*10 + 5 + Math.cos(ga)*4, 20 + gy*10 + 5 + Math.sin(ga)*4);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }
    }
};
