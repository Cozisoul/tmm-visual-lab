
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const SonicTerrain: Machine = {
    id: 'sonic-terrain',
    name: 'Sonic Terrain',
    department: MachineDepartment.SIGNAL,
    description: '3D Wireframe from audio.',
    controls: [
        { id: 'mode', label: 'Terrain Logic', type: 'select', options: ['Wireframe', 'Points', 'Solid', 'Ribbons'], defaultValue: 'Wireframe' },
        { id: 'scale', label: 'Elevation Gain', type: 'number', min: 10, max: 800, step: 10, defaultValue: 250 },
        { id: 'res', label: 'Signal Res', type: 'number', min: 10, max: 60, step: 5, defaultValue: 40 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { mode, scale, res, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;
        const fft = globalState?.audio.fft || [];

        fillBackground(ctx, width, height, bg, globalState);
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        
        const rows = 30;
        const cols = 30;
        const t = time * 0.001;
        
        const project = (x: number, y: number, z: number) => {
            const perspective = 400;
            const s = perspective / (perspective + z);
            const px = width / 2 + x * s;
            const py = height / 2 + y * s;
            return { x: px, y: py, s };
        };

        const getH = (ix: number, iz: number) => {
            const band = Math.floor(Math.abs((ix + iz)) % (fft.length || 1));
            const amp = (fft[band] || 0) / 255;
            return amp * scale * (1 + vol);
        };

        for (let z = 0; z < rows; z++) {
            if (mode !== 'Points') ctx.beginPath();
            for (let x = -cols / 2; x < cols / 2; x++) {
                const wx = x * res;
                const wz = ((z + t * 50) % (rows * res));
                const wh = 100 - getH(x, z);
                
                const p = project(wx, wh, wz);
                
                const isAlive = isGridAlive(p.x, p.y, width, height, globalState);
                
                ctx.save();
                if (isAlive) {
                    ctx.globalAlpha = 0.2 * vol;
                    ctx.strokeStyle = '#ef4444';
                } else {
                    ctx.globalAlpha = 0.3 + (1 - (z / rows)) * 0.7;
                    if (glow) {
                        ctx.shadowColor = color;
                        ctx.shadowBlur = treble * 30;
                    }
                }

                if (mode === 'Points') {
                    ctx.beginPath();
                    const r = Math.max(0, 2 * p.s);
                    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                    ctx.fill();
                } else if (mode === 'Ribbons') {
                    if (x === -cols / 2) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                } else {
                    if (x === -cols / 2) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                    
                    // Vertical connectors for wireframe
                    if (mode === 'Wireframe' && z > 0) {
                        const pPrev = project(wx, 100 - getH(x, z - 1), (z - 1 + t * 50) % (rows * res));
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(pPrev.x, pPrev.y);
                    }
                }
                ctx.restore();
            }
            if (mode !== 'Points') ctx.stroke();
        }

        // Technical Overlay
        if (vol > 0.4) {
            ctx.save();
            ctx.font = 'bold 9px monospace';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            ctx.fillText(`SIGNAL_ELEVATION: ${scale.toFixed(0)}M`, 40, 40);
            ctx.fillText(`GEO_RESOLUTION: ${res}U`, 40, 52);
            
            // Draw compass/axis
            ctx.translate(width - 60, 60);
            ctx.beginPath();
            ctx.moveTo(0,0); ctx.lineTo(20, 0); // X
            ctx.moveTo(0,0); ctx.lineTo(0, -20); // Y
            ctx.stroke();
            ctx.fillText('X', 22, 0);
            ctx.fillText('Y', 0, -22);
            ctx.restore();
        }
    }
};
