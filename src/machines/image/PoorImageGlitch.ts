
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive, drawGrain } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const PoorImageGlitch: Machine = {
    id: 'poor-image',
    name: 'Poor Image Glitch',
    department: MachineDepartment.IMAGE,
    description: 'Compression artifacts & Decay.',
    controls: [
        { id: 'blocks', label: 'Macroblocks', type: 'number', min: 10, max: 200, step: 5, defaultValue: 40 },
        { id: 'decay', label: 'Decay Amt', type: 'number', min: 0, max: 100, step: 1, defaultValue: 20 },
        { id: 'shift', label: 'Channel Shift', type: 'number', min: 0, max: 100, step: 1, defaultValue: 10 },
        { id: 'static', label: 'Static Noise', type: 'number', min: 0, max: 100, step: 1, defaultValue: 30 },
        { id: 'color', label: 'Tint', type: 'color', defaultValue: '#a1a1aa' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { blocks, decay, shift, static: staticAmt, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        
        if(!globalState?.settings.transparent) {
            const g = ctx.createLinearGradient(0,0,width,height);
            g.addColorStop(0, '#555'); g.addColorStop(1, '#000');
            ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
        } else {
            ctx.clearRect(0,0,width,height);
        }
        const blockSize = width/blocks;
        const t = time * 0.002;
        const activeShift = shift + (vol * 100);

        for(let y=0; y<height; y+=blockSize) {
            for(let x=0; x<width; x+=blockSize) {
                const n = noise(x*0.01, y*0.01, t);
                 // Note: 'isGridAlive' corresponds to 'getGridState'
                const isCorrupt = isGridAlive(x, y, width, height, globalState);
                if(n > 0.4 || isCorrupt) {
                    const xOff = (Math.random()-0.5) * activeShift;
                    const c = Math.floor(n*255);
                    ctx.fillStyle = isCorrupt ? '#ff00ff' : `rgba(${c},${c},${c},0.5)`;
                    if(isCorrupt) ctx.fillStyle = '#00ff00';
                    const decayOff = Math.random() < (decay/100) ? blockSize/2 : 0;
                    ctx.fillRect(x + xOff + decayOff, y, blockSize, blockSize);
                }
            }
        }
        drawGrain(ctx, width, height, staticAmt);
    }
};
