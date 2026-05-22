
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { initWebcam, getCamVideo, getCamContext } from '../../services/webcamService';

let prevMotionFrame: Uint8ClampedArray | null = null;

export const MotionHeatmap: Machine = {
    id: 'motion-heatmap',
    name: 'Motion Heatmap',
    department: MachineDepartment.IMAGE,
    description: 'Visualizing movement trails.',
    controls: [
        { id: 'decay', label: 'Ghost Decay', type: 'number', min: 0, max: 50, step: 1, defaultValue: 10 },
        { id: 'threshold', label: 'Motion Thresh', type: 'number', min: 0, max: 100, step: 5, defaultValue: 20 },
        { id: 'scale', label: 'Resolution', type: 'number', min: 5, max: 20, step: 1, defaultValue: 10 },
        { id: 'color', label: 'Heat Color', type: 'color', defaultValue: '#ff0000' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    setup: (ctx) => initWebcam(),
    draw: (ctx, width, height, params, time, globalState) => {
        const { decay, threshold, scale, color, bg } = params;
        const volume = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        
        // Audio modulates decay and sensitivity
        const activeDecay = decay + (volume * 30);
        const activeThreshold = Math.max(5, threshold - (bass * 50));
        
        // Fade out
        if(!globalState?.settings.transparent) {
             ctx.fillStyle = bg + (activeDecay < 10 ? '0'+activeDecay.toFixed(0) : activeDecay.toFixed(0));
             ctx.fillRect(0,0,width,height);
        } else {
             ctx.clearRect(0,0,width,height);
        }

        initWebcam(globalState?.settings.cameraId);
        const camVideo = getCamVideo();
        const camCtx = getCamContext();

        if(camVideo && camCtx && camVideo.readyState >= 2) {
            camCtx.drawImage(camVideo, 0, 0, 128, 96); // Low res for analysis
            const frame = camCtx.getImageData(0,0,128,96).data;
            
            if(!prevMotionFrame || prevMotionFrame.length !== frame.length) {
                prevMotionFrame = new Uint8ClampedArray(frame.length);
            }
            
            ctx.fillStyle = color;
            const rw = width/128;
            const rh = height/96;
            
            for(let i=0; i<frame.length; i+=4) {
                const diff = Math.abs(frame[i] - prevMotionFrame[i]);
                if(diff > activeThreshold) {
                    const idx = i/4;
                    const x = (idx % 128) * rw;
                    const y = Math.floor(idx / 128) * rh;
                    
                    // GoL: Hide heat
                    if(isGridAlive(x,y,width,height,globalState)) continue;

                    ctx.fillRect(x,y, rw*scale/10, rh*scale/10);
                }
            }
            prevMotionFrame.set(frame);
        }
    }
};
