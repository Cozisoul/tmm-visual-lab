
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const VoronoiSystems: Machine = {
    id: 'voronoi-systems',
    name: 'Voronoi Systems',
    department: MachineDepartment.IMAGE,
    description: 'Cellular geometric partitions.',
    controls: [
        { id: 'points', label: 'Cell Count', type: 'number', min: 5, max: 50, step: 1, defaultValue: 20 },
        { id: 'speed', label: 'Movement', type: 'number', min: 0, max: 5, step: 0.1, defaultValue: 1 },
        { id: 'connect', label: 'Connect Dist', type: 'number', min: 50, max: 500, step: 10, defaultValue: 150 },
        { id: 'dots', label: 'Show Dots', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { points, speed, connect, dots, color, bg } = params;
        
        fillBackground(ctx, width, height, bg, globalState);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        
        const t = time * 0.0005 * speed;
        
        for(let i=0; i<points; i++) {
            // Generate point positions using noise
            const x = (noise(i, t) * width);
            const y = (noise(i+100, t) * height);
            
            if(dots) {
                ctx.beginPath(); 
                ctx.arc(x, y, 3, 0, Math.PI*2); 
                ctx.fill();
            }

             for(let j=i+1; j<points; j++) {
                const x2 = (noise(j, t) * width);
                const y2 = (noise(j+100, t) * height);
                const d = Math.hypot(x-x2, y-y2);
                
                if(d < connect) {
                     // GoL: Break connection
                     if(!isGridAlive((x+x2)/2, (y+y2)/2, width, height, globalState)) {
                         // Line weight varies with connection distance
                         const lineWidth = (1 - d/connect) * 2;
                         ctx.lineWidth = lineWidth;
                         ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x2,y2); ctx.stroke();
                     }
                }
             }
        }
    }
};
