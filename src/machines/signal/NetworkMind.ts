
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { random, distance } from '../../utils/math';

export const NetworkMind: Machine = {
    id: 'network-mind',
    name: 'Network Mind',
    department: MachineDepartment.SIGNAL,
    description: 'Influence map and neural connections.',
    controls: [
        { id: 'count', label: 'Node Count', type: 'number', min: 10, max: 200, step: 5, defaultValue: 60 },
        { id: 'dist', label: 'Link Dist', type: 'number', min: 20, max: 300, step: 10, defaultValue: 100 },
        { id: 'speed', label: 'Drift Speed', type: 'number', min: 0, max: 5, step: 0.1, defaultValue: 0.5 },
        { id: 'color', label: 'Nodes', type: 'color', defaultValue: '#3b82f6' },
        { id: 'color2', label: 'Links', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { count, dist, speed, color, color2, bg } = params;
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0; // Vocals/Mids drive connections

        fillBackground(ctx, width, height, bg, globalState);
        
        // Pseudo-stateful: Deterministic positions based on time
        // x = Base + (Noise * time)
        
        const nodes: {x:number, y:number, r:number}[] = [];
        const t = time * 0.001 * speed;
        
        let seed = 100;
        const rand = () => { seed++; return random(seed); };

        for(let i=0; i<count; i++) {
            // Orbiting movement
            const angle = rand() * Math.PI * 2 + (t * (rand() - 0.5));
            const radius = rand() * (Math.min(width, height) * 0.4);
            const cx = width/2;
            const cy = height/2;
            
            let x = cx + Math.cos(angle) * radius;
            let y = cy + Math.sin(angle) * radius;
            
            // Audio drift
            x += Math.sin(t + i) * (bass * 50);
            y += Math.cos(t + i) * (bass * 50);
            
            // GoL Disruption
            if (isGridAlive(x, y, width, height, globalState)) {
                x += (rand()-0.5) * 50;
                y += (rand()-0.5) * 50;
            }

            // Node Size pulsing
            const r = 2 + (rand() * 4) + (mid * 10);
            nodes.push({x, y, r});
        }

        const activeDist = dist * (1 + bass * 0.5); // Bass expands connection range

        // Draw Links First
        ctx.strokeStyle = color2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<count; i++) {
            for(let j=i+1; j<count; j++) {
                const d = distance(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
                if(d < activeDist) {
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                }
            }
        }
        // Audio Opacity for links
        ctx.globalAlpha = 0.2 + (vol * 0.8);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Draw Nodes
        ctx.fillStyle = color;
        for(let i=0; i<count; i++) {
            const n = nodes[i];
            ctx.beginPath();
            const r = Math.max(0, n.r);
            ctx.arc(n.x, n.y, r, 0, Math.PI*2);
            ctx.fill();
        }
    }
};
