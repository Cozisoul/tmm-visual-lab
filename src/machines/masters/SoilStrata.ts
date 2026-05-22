
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive, drawGrain } from '../../utils/canvas';
import { noise } from '../../utils/math';

export const SoilStrata: Machine = {
    id: 'soil-strata',
    name: 'Soil Strata',
    department: MachineDepartment.MASTERS,
    description: 'Geological layers and noise (Dineo Seshee Bopape).',
    controls: [
        { id: 'layers', label: 'Strata Layers', type: 'number', min: 5, max: 50, step: 1, defaultValue: 20 },
        { id: 'roughness', label: 'Roughness', type: 'number', min: 0, max: 200, step: 10, defaultValue: 50 },
        { id: 'grit', label: 'Grit/Noise', type: 'number', min: 0, max: 100, step: 5, defaultValue: 20 },
        { id: 'slope', label: 'Slope', type: 'number', min: -50, max: 50, step: 1, defaultValue: 0 },
        { id: 'color', label: 'Clay Color', type: 'color', defaultValue: '#9a3412' },
        { id: 'bg', label: 'Earth Color', type: 'color', defaultValue: '#431407' },
    ],
    draw: (ctx, width, height, params, time, globalState) => {
        const { layers, roughness, grit, slope, color, bg } = params;
        
        // Audio reactivity
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        
        fillBackground(ctx, width, height, bg, globalState);
        const layerH = height/layers;
        
        // Audio affects roughness and slope
        const activeRoughness = roughness * (1 + bass * 0.5);
        const activeSlope = slope + mid * 30;

        for(let i=0; i<layers; i++) {
            ctx.fillStyle = i%2===0 ? color : bg;
            ctx.beginPath();
            ctx.moveTo(0, i*layerH);
            for(let x=0; x<=width; x+=10) {
                const y = i*layerH + noise(x*0.01, i, time*0.0001) * activeRoughness + (x/width)*activeSlope;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(width, (i+1)*layerH + activeSlope);
            ctx.lineTo(0, (i+1)*layerH);
            ctx.fill();
        }
        drawGrain(ctx, width, height, grit);
    }
};
