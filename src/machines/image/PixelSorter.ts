
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const PixelSorter: Machine = {
    id: 'pixel-sorter',
    name: 'Pixel Sorter',
    department: MachineDepartment.IMAGE,
    description: 'Sorting pixels by brightness.',
    controls: [
        { id: 'thresh', label: 'Threshold', type: 'number', min: 0, max: 100, step: 5, defaultValue: 50 },
        { id: 'res', label: 'Resolution', type: 'number', min: 2, max: 20, step: 1, defaultValue: 5 },
        { id: 'dir', label: 'Direction', type: 'select', options: ['Up', 'Down', 'Left', 'Right'], defaultValue: 'Up' },
        { id: 'color', label: 'Color', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { thresh, res, dir, color, bg } = params;
        const bass = globalState?.audio.bass || 0;
        fillBackground(ctx, width, height, bg, globalState);
        const t = time * 0.1;
        const horizontal = dir === 'Left' || dir === 'Right';
        const limit = horizontal ? height : width;
        const length = horizontal ? width : height;
        
        // Audio lowers threshold to cause more sorting
        const activeThresh = Math.max(0, thresh - (bass * 50));

        for(let i=0; i<limit; i+=res) {
            const n = noise(i*0.01, t*0.01); 
            const barLen = n * length;
            
            ctx.fillStyle = color; 
            
            const isGoL = isGridAlive(i, i, width, height, globalState);
            if(isGoL) ctx.fillStyle = '#ff00ff';

            if (barLen > (activeThresh/100)*length || isGoL) {
                if (dir === 'Up') ctx.fillRect(i, length-barLen, res, barLen);
                if (dir === 'Down') ctx.fillRect(i, 0, res, barLen);
                if (dir === 'Left') ctx.fillRect(length-barLen, i, barLen, res);
                if (dir === 'Right') ctx.fillRect(0, i, barLen, res);
            }
        }
    }
};
