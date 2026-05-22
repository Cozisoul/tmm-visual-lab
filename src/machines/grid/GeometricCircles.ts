
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const GeometricCircles: Machine = {
    id: 'geometric-circles',
    name: 'Geometric Circles',
    department: MachineDepartment.GRID,
    description: 'Kinetic orbital systems with audio-reactive resonances.',
    controls: [
        { id: 'scale', label: 'Grid Scale', type: 'number', min: 20, max: 300, step: 10, defaultValue: 80 },
        { id: 'minSize', label: 'Core Radius', type: 'number', min: 1, max: 50, step: 1, defaultValue: 5 },
        { id: 'maxSize', label: 'Max Growth', type: 'number', min: 10, max: 150, step: 1, defaultValue: 40 },
        { id: 'lineWidth', label: 'Pulse Weight', type: 'number', min: 0.5, max: 10, step: 0.5, defaultValue: 1.5 },
        { id: 'speed', label: 'Orbital Speed', type: 'number', min: 0.1, max: 10, step: 0.1, defaultValue: 1 },
        { id: 'complexity', label: 'System Layers', type: 'number', min: 1, max: 5, step: 1, defaultValue: 2 },
        { id: 'decay', label: 'Motion Trail', type: 'number', min: 0, max: 1, step: 0.05, defaultValue: 0.3 },
        { id: 'padding', label: 'System Margin', type: 'number', min: 0, max: 200, step: 10, defaultValue: 40 },
        { id: 'style', label: 'Visual Mode', type: 'select', options: ['Orbital', 'Solid', 'Echo'], defaultValue: 'Orbital' },
        { id: 'color', label: 'Primary Tint', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Deep Space', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { scale, minSize, maxSize, lineWidth, speed, complexity, decay, padding, style, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        // Custom decay background (trails)
        if (decay > 0) {
            ctx.fillStyle = bg;
            ctx.globalAlpha = 1 - decay;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1.0;
        } else {
            fillBackground(ctx, width, height, bg, globalState);
        }

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth * (1 + highPass(treble, 0.4) * 4); // Treble sharpens lines

        const cols = Math.ceil((width - padding * 2) / scale);
        const rows = Math.ceil((height - padding * 2) / scale);
        const t = time * 0.001 * speed;
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const px = padding + x * scale + scale / 2;
                const py = padding + y * scale + scale / 2;
                
                if (isGridAlive(px, py, width, height, globalState)) {
                    // GoL Interference: Solar Flare effect
                    const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, scale * 0.4);
                    glowGrad.addColorStop(0, '#f97316');
                    glowGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = glowGrad;
                    ctx.beginPath();
                    ctx.arc(px, py, scale * 0.4 * (1 + vol), 0, Math.PI * 2);
                    ctx.fill();
                    continue;
                }

                // Base motion math
                const noise = (Math.sin(x * 0.3 + t) + Math.cos(y * 0.3 + t * 0.8)) * 0.5;
                const baseR = Math.max(1, minSize + (noise + 0.5) * (maxSize - minSize));
                
                // Audio modulation
                const activeR = Math.max(1, baseR * (1 + bass * 1.5)); // Bass drives expansion
                const systemRot = t * 2 + (mid * Math.PI); // Mid drives rotation shifts

                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(systemRot);

                for (let i = 0; i < complexity; i++) {
                    const layerFactor = (i + 1) / complexity;
                    const layerR = Math.max(0, activeR * layerFactor); // Clamp to prevent negative radius
                    const layerOpacity = 1 - (i / complexity) * 0.6;
                    
                    ctx.globalAlpha = layerOpacity;
                    ctx.beginPath();

                    if (style === 'Orbital') {
                        // Drawing rings with dash gaps that react to treble
                        ctx.setLineDash([scale * 0.1 * layerFactor, scale * 0.05 * (1 + treble * 5)]);
                        ctx.arc(0, 0, layerR, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // Satellite nodes
                        if (i === 0 && treble > 0.3) {
                            ctx.beginPath();
                            ctx.arc(layerR, 0, lineWidth * 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    } else if (style === 'Solid') {
                        ctx.arc(0, 0, layerR, 0, Math.PI * 2);
                        ctx.fill();
                        // Inner cutout
                        ctx.globalCompositeOperation = 'destination-out';
                        ctx.beginPath();
                        ctx.arc(0, 0, layerR * 0.8, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalCompositeOperation = 'source-over';
                    } else if (style === 'Echo') {
                        const echoCount = 3;
                        for(let e=0; e<echoCount; e++) {
                            const offset = e * mid * 20;
                            ctx.strokeRect(-layerR - offset, -layerR - offset, (layerR+offset)*2, (layerR+offset)*2);
                        }
                    }
                }
                ctx.restore();
                ctx.globalAlpha = 1.0;
                ctx.setLineDash([]);
            }
        }
    }
};

// Helper for punchy audio response
function highPass(val: number, threshold: number): number {
    return val > threshold ? (val - threshold) / (1 - threshold) : 0;
}
