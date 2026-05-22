
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { initWebcam, getCamVideo, getCamContext } from '../../services/webcamService';

export const EdgeGlitch: Machine = {
    id: 'edge-glitch',
    name: 'Edge Glitch',
    department: MachineDepartment.IMAGE,
    description: 'Cyber-punk edge detection.',
    controls: [
        { id: 'thresh', label: 'Edge Thresh', type: 'number', min: 10, max: 100, step: 5, defaultValue: 30 },
        { id: 'shift', label: 'RGB Shift', type: 'number', min: 0, max: 50, step: 1, defaultValue: 10 },
        { id: 'res', label: 'Pixel Size', type: 'number', min: 2, max: 10, step: 1, defaultValue: 4 },
        { id: 'color', label: 'Edge Color', type: 'color', defaultValue: '#00ff00' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    setup: (ctx) => initWebcam(),
    draw: (ctx, width, height, params, time, globalState) => {
        const { thresh, shift, res, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        fillBackground(ctx, width, height, bg, globalState);
        
        initWebcam(globalState?.settings.cameraId);
        const camVideo = getCamVideo();
        const camCtx = getCamContext();

        if(camVideo && camCtx && camVideo.readyState >= 2) {
            camCtx.drawImage(camVideo, 0, 0, 320, 240);
            const src = camCtx.getImageData(0,0,320,240);
            const data = src.data;
            const w = src.width;
            const h = src.height;
            
            ctx.fillStyle = color;
            const scaleX = width/w;
            const scaleY = height/h;
            
            const activeShift = shift + (vol * 50);

            for(let y=1; y<h-1; y+=1) {
                for(let x=1; x<w-1; x+=1) {
                    const idx = (y*w + x)*4;
                    const left = ((y)*w + (x-1))*4;
                    const up = ((y-1)*w + x)*4;
                    
                    const edgeH = Math.abs(data[idx] - data[left]);
                    const edgeV = Math.abs(data[idx] - data[up]);
                    
                    if((edgeH + edgeV) > thresh) {
                        const sx = x * scaleX;
                        const sy = y * scaleY;
                        
                        // GoL: Force Shift
                        const isGoL = isGridAlive(sx,sy,width,height,globalState);
                        const finalShift = isGoL ? 50 : activeShift;

                        if (finalShift > 0) {
                             ctx.fillStyle = '#ff0000'; ctx.fillRect(sx - finalShift, sy, res, res);
                             ctx.fillStyle = '#0000ff'; ctx.fillRect(sx + finalShift, sy, res, res);
                             ctx.fillStyle = color; ctx.fillRect(sx, sy, res, res);
                        } else {
                             ctx.fillRect(sx, sy, res, res);
                        }
                    }
                }
            }
        }
    }
};
