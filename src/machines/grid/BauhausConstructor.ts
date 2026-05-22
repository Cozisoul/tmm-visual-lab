
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';

export const BauhausConstructor: Machine = {
    id: 'bauhaus-constructor',
    name: 'Bauhaus Constructor',
    department: MachineDepartment.GRID,
    description: 'Authentic geometric composition engine (Kandinsky/Moholy-Nagy).',
    controls: [
        { id: 'complexity', label: 'Complexity', type: 'number', min: 1, max: 10, step: 1, defaultValue: 5 },
        { id: 'balance', label: 'Tension', type: 'number', min: 0, max: 100, step: 10, defaultValue: 40 }, // 0 = Ordered, 100 = Chaotic
        { id: 'scale', label: 'Grid Scale', type: 'number', min: 50, max: 300, step: 10, defaultValue: 100 },
        { id: 'mode', label: 'Period', type: 'select', options: ['Weimar', 'Dessau', 'Berlin'], defaultValue: 'Dessau' },
        { id: 'color1', label: 'Primary', type: 'color', defaultValue: '#dc2626' }, // Red
        { id: 'color2', label: 'Secondary', type: 'color', defaultValue: '#2563eb' }, // Blue
        { id: 'color3', label: 'Accent', type: 'color', defaultValue: '#facc15' }, // Yellow
        { id: 'bg', label: 'Canvas', type: 'color', defaultValue: '#f4f4f5' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { complexity, balance, scale, mode, color1, color2, color3, bg } = params;
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;

        fillBackground(ctx, width, height, bg, globalState);

        // --- Composition Engine ---
        // Unlike "random scatter", we build a composition from a seed.
        // We use a "Golden Grid" or "Modular Grid".
        
        let seed = 42; // Fixed seed for stability, can change with interaction
        // If we want it to animate, we change seed slowly or animate properties
        // Bauhaus is usually static or slowly kinetic.
        // Let's make it static structure with kinetic attributes.
        
        const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        
        // Define Palette
        const palette = [color1, color2, color3, '#18181b', '#ffffff']; // Red, Blue, Yellow, Black, White
        
        // Grid setup
        const cols = Math.ceil(width / scale);
        const rows = Math.ceil(height / scale);
        
        // --- 1. The Hero Shape (Focal Point) ---
        // Always place one large dominant element
        const heroX = width * 0.3 + rand() * width * 0.4;
        const heroY = height * 0.3 + rand() * height * 0.4;
        const heroSize = scale * 2.5 * (1 + bass * 0.2);
        
        ctx.save();
        ctx.translate(heroX, heroY);
        const heroRot = (rand() - 0.5) * (balance / 50); // Tension rotates it
        ctx.rotate(heroRot + time * 0.0002);
        
        // Style dependent on Mode
        if (mode === 'Weimar') {
            // Early Bauhaus: Expressive, spiritual (Itten)
            ctx.fillStyle = color1;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(0, 0, heroSize/2, 0, Math.PI*2);
            ctx.fill();
        } else if (mode === 'Dessau') {
            // High Bauhaus: Constructivist, industrial (Moholy-Nagy)
            ctx.lineWidth = 20;
            ctx.strokeStyle = '#18181b';
            ctx.globalAlpha = 0.8;
            ctx.strokeRect(-heroSize/2, -heroSize/2, heroSize, heroSize);
            
            // Crossing line
            ctx.beginPath();
            ctx.moveTo(-heroSize, 0); ctx.lineTo(heroSize, 0);
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Berlin: Minimalist (Mies)
            ctx.fillStyle = '#18181b';
            ctx.fillRect(-heroSize/2, -heroSize*2, heroSize/4, heroSize*4);
        }
        ctx.restore();

        // --- 2. Supporting Elements (Grid Aligned) ---
        const elementCount = complexity * 3;
        
        for (let i=0; i<elementCount; i++) {
            // Snap to grid-ish
            const gx = Math.floor(rand() * cols);
            const gy = Math.floor(rand() * rows);
            
            // Jitter for "Tension"
            const jitter = (scale * balance / 100); 
            const x = gx * scale + (rand() - 0.5) * jitter;
            const y = gy * scale + (rand() - 0.5) * jitter;
            
            if (isGridAlive(x, y, width, height, globalState)) continue; // Empty space
            
            const type = rand();
            const col = palette[Math.floor(rand() * palette.length)];
            const s = scale * (0.2 + rand() * 0.8);
            
            ctx.save();
            ctx.translate(x, y);
            
            if (type > 0.7) {
                // Circle
                ctx.fillStyle = col;
                if (rand() > 0.5) {
                    ctx.beginPath(); ctx.arc(0,0, s/2, 0, Math.PI*2); ctx.fill();
                } else {
                    ctx.strokeStyle = col; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(0,0, s/2, 0, Math.PI*2); ctx.stroke();
                }
            } else if (type > 0.4) {
                // Beam / Line
                const angle = rand() > 0.5 ? 0 : Math.PI/2; // Orthogonal
                const len = s * 4;
                ctx.rotate(angle);
                ctx.fillStyle = col;
                ctx.fillRect(-len/2, -5, len, 10);
            } else {
                // Triangle
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.moveTo(0, -s/2);
                ctx.lineTo(s/2, s/2);
                ctx.lineTo(-s/2, s/2);
                ctx.fill();
            }
            ctx.restore();
        }
        
        // --- 3. Connecting Lines (Tension) ---
        // Draw thin lines connecting random grid points
        ctx.globalCompositeOperation = 'multiply';
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#00000066';
        
        ctx.beginPath();
        for(let j=0; j<5; j++) {
            const y = rand() * height;
            ctx.moveTo(0, y);
            ctx.lineTo(width, y + (rand()-0.5)*100);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }
};
