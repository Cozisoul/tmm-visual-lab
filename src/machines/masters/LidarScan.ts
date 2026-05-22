
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const LidarScan: Machine = {
    id: 'lidar-scan',
    name: 'Lidar Reconstruction',
    department: MachineDepartment.MASTERS,
    description: '3D Point Cloud Scanning (Forensic Arch).',
    controls: [
        { id: 'points', label: 'Resolution', type: 'number', min: 1000, max: 20000, step: 1000, defaultValue: 5000 },
        { id: 'rotSpeed', label: 'Rotation', type: 'number', min: 0, max: 5, step: 0.1, defaultValue: 1 },
        { id: 'zoom', label: 'Scale', type: 'number', min: 0.5, max: 5, step: 0.1, defaultValue: 1 },
        { id: 'scatter', label: 'Point Scatter', type: 'number', min: 0, max: 50, step: 1, defaultValue: 5 },
        { id: 'color', label: 'Laser Color', type: 'color', defaultValue: '#ef4444' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#09090b' },
        { id: 'scanline', label: 'Scanline', type: 'boolean', defaultValue: true },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { points, rotSpeed, zoom, scatter, color, bg, scanline } = params;
        const vol = globalState?.audio.volume || 0;
        fillBackground(ctx, width, height, bg, globalState);
        ctx.fillStyle = color;
        const cx = width/2;
        const cy = height/2;
        const t = time * 0.001 * rotSpeed;
        
        const activeScatter = scatter * (1 + vol * 5); // Audio Scatter

        for(let i=0; i<points; i++) {
             const theta = Math.random() * Math.PI * 2;
             const y = (Math.random() - 0.5) * height * 0.8;
             let r = 200;
             if(Math.abs(y) < 50) r = 300; 
             const n = noise(Math.cos(theta), y*0.01, 123);
             r += n * 100;
             const rotTheta = theta + t;
             
             // Scatter noise
             const jx = (Math.random()-0.5) * activeScatter;
             const jy = (Math.random()-0.5) * activeScatter;
             
             const px = Math.cos(rotTheta) * r * zoom;
             const pz = Math.sin(rotTheta) * r * zoom + 500;
             const scale = 500 / pz;
             const sx = px * scale + cx + jx;
             const sy = y * scale + cy + jy;
             
             // GoL: Hide Points
             if(isGridAlive(sx, sy, width, height, globalState)) continue;
             
             const scanY = (time * 0.5) % height;
             if(scanline && Math.abs(sy - scanY) < 20) ctx.fillStyle = '#ffffff';
             else ctx.fillStyle = color;
             const size = Math.max(1, 3 * scale);
             ctx.fillRect(sx, sy, size, size);
        }
    }
};
