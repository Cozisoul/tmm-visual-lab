
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const BlobGenerator: Machine = {
    id: 'blob-generator',
    name: 'Blob Generator',
    department: MachineDepartment.IMAGE,
    description: 'Autonomous organic entities.',
    controls: [
        { id: 'blobCount', label: 'Entity Count', type: 'number', min: 1, max: 12, step: 1, defaultValue: 5 },
        { id: 'baseSize', label: 'Base Size', type: 'number', min: 10, max: 200, step: 5, defaultValue: 60 },
        { id: 'variance', label: 'Size Variance', type: 'number', min: 0, max: 100, step: 1, defaultValue: 50 },
        { id: 'wander', label: 'Wander Area', type: 'number', min: 0, max: 100, step: 1, defaultValue: 50 },
        { id: 'speed', label: 'Life Speed', type: 'number', min: 0.1, max: 4, step: 0.1, defaultValue: 1 },
        { id: 'deform', label: 'Organic Deform', type: 'number', min: 0, max: 100, step: 1, defaultValue: 40 },
        { id: 'mode', label: 'Interaction', type: 'select', options: ['Solid', 'Liquid', 'X-Ray', 'Outline'], defaultValue: 'Liquid' },
        { id: 'color', label: 'Core Color', type: 'color', defaultValue: '#3b82f6' },
        { id: 'color2', label: 'Edge Color', type: 'color', defaultValue: '#8b5cf6' },
        { id: 'bg', label: 'Void', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { blobCount, baseSize, variance, wander, speed, deform, mode, color, color2, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        const t = time * 0.0005 * speed;
        
        // Setup composite mode
        if (mode === 'Liquid') {
            ctx.globalCompositeOperation = 'lighter';
        } else if (mode === 'X-Ray') {
            ctx.globalCompositeOperation = 'xor';
        }

        // Draw each blob as a distinct entity
        for(let i = 0; i < blobCount; i++) {
            // Seed based properties (making them "their own things")
            const seed = i * 1337;
            const personality = noise(seed, 0); // 0-1 value distinct to this blob
            
            // 1. Independent Physics (Wandering)
            // Use Sine/Cosine (Lissajous) for guaranteed bounded wandering centered on screen
            // Frequencies are offset by seed to make them look independent
            const moveX = Math.sin(t * 0.5 + seed + i); 
            const moveY = Math.cos(t * 0.3 + seed + i * 1.5);
            
            // Map -1 to 1 to screen coordinates, centered
            const wanderScale = wander / 100; // 0 to 1
            const cx = (width/2) + moveX * (width * 0.35 * wanderScale); // multiply by 0.35 to keep within safe bounds
            const cy = (height/2) + moveY * (height * 0.35 * wanderScale);

            // 2. Individual Sizing
            // Mix fixed size with variance based on personality
            const sizeMod = (personality - 0.5) * 2; // -1 to 1
            const individualRad = baseSize + (sizeMod * baseSize * (variance/100));
            
            // 3. Audio Responsiveness (Each responds differently)
            // Low index blobs like bass, high index like treble
            let audioPump = 0;
            if (i % 3 === 0) audioPump = bass * 0.8;
            else if (i % 3 === 1) audioPump = mid * 0.6;
            else audioPump = treble * 0.4;
            
            const r = Math.max(5, individualRad * (1 + audioPump));

            // 4. Drawing the Organic Shape
            // Each blob has a unique color mix
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            const mix = (Math.sin(t + personality * 10) + 1) / 2; // Pulse color
            grad.addColorStop(0, lerpColor(color, color2, mix));
            grad.addColorStop(1, lerpColor(color2, color, mix));
            if (mode === 'Outline') {
                 ctx.strokeStyle = grad;
                 ctx.lineWidth = 3 + audioPump * 5;
            } else {
                 ctx.fillStyle = grad;
            }
            
            ctx.beginPath();
            const points = 8 + Math.floor(personality * 5); // Random point count per blob
            const angleStep = (Math.PI * 2) / points;
            
            // Control smoothness of this specific blob
            const smoothness = deform * (0.8 + audioPump); 

            for(let j = 0; j <= points; j++) {
                const angle = j * angleStep;
                // Deform logic
                const pNoise = noise(Math.cos(angle) + seed, Math.sin(angle) + t + seed);
                const pR = r + (pNoise * smoothness);
                
                const px = cx + Math.cos(angle) * pR;
                const py = cy + Math.sin(angle) * pR;
                
                if (j === 0) ctx.moveTo(px, py);
                else {
                    // Simple spline approximation
                    const prevAngle = (j-1) * angleStep;
                    const prevPNoise = noise(Math.cos(prevAngle) + seed, Math.sin(prevAngle) + t + seed);
                    const prevPR = r + (prevPNoise * smoothness);
                    const prevX = cx + Math.cos(prevAngle) * prevPR;
                    const prevY = cy + Math.sin(prevAngle) * prevPR;
                    
                    const midX = (prevX + px) / 2;
                    const midY = (prevY + py) / 2;
                    ctx.quadraticCurveTo(prevX, prevY, midX, midY);
                }
            }
            
            ctx.closePath();
            if (mode === 'Outline') ctx.stroke();
            else ctx.fill();
            
            // GoL Interaction (Only affects this specific blob)
            if (isGridAlive(cx, cy, width, height, globalState)) {
                 ctx.globalCompositeOperation = 'source-over';
                 ctx.strokeStyle = '#fff';
                 ctx.lineWidth = 1;
                 ctx.beginPath();
                 ctx.arc(cx, cy, r * 1.2, 0, Math.PI*2);
                 ctx.stroke();
                 // Resume previous mode
                 if (mode === 'Liquid') ctx.globalCompositeOperation = 'lighter';
                 else if (mode === 'X-Ray') ctx.globalCompositeOperation = 'xor';
            }
        }
        
        ctx.globalCompositeOperation = 'source-over';
    }
};

// Helper function to interpolate between two hex colors
function lerpColor(color1: string, color2: string, t: number): string {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    // Fallback if colors are invalid
    if (!c1 && !c2) return '#000000';
    if (!c1) return color2;
    if (!c2) return color1;
    
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
