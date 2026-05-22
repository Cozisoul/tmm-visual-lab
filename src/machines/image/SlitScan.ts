
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { initWebcam, getCamVideo, getCamContext, getCamCanvas } from '../../services/webcamService';

let slitScanBuffer: ImageData | null = null;
let slitScanX = 0;

export const SlitScan: Machine = {
    id: 'slit-scan',
    name: 'Slit Scan Time',
    department: MachineDepartment.IMAGE,
    description: 'Time displacement from Webcam.',
    controls: [
        { id: 'scanSpeed', label: 'Scan Speed', type: 'number', min: 1, max: 20, step: 1, defaultValue: 2 },
        { id: 'jitter', label: 'Scan Jitter', type: 'number', min: 0, max: 50, step: 1, defaultValue: 0 },
        { id: 'stretch', label: 'Stretch', type: 'number', min: 1, max: 5, step: 0.1, defaultValue: 1 },
        { id: 'dir', label: 'Direction', type: 'select', options: ['Horizontal', 'Vertical'], defaultValue: 'Horizontal' },
        { id: 'threshold', label: 'Threshold', type: 'number', min: 0, max: 255, step: 5, defaultValue: 0 },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    setup: (ctx) => initWebcam(),
    draw: (ctx, width, height, params, time, globalState) => {
        const { scanSpeed, jitter, stretch, dir, threshold, bg } = params;
        const bass = globalState?.audio.bass || 0;
        
        // Reset buffer if size changes
        if (!slitScanBuffer || slitScanBuffer.width !== width || slitScanBuffer.height !== height) {
             fillBackground(ctx, width, height, bg, globalState);
             slitScanBuffer = ctx.getImageData(0,0,width,height);
             slitScanX = 0;
        }

        initWebcam(globalState?.settings.cameraId);
        const camVideo = getCamVideo();
        const camCtx = getCamContext();
        const camCanvas = getCamCanvas();

        if(camVideo && camCtx && camCanvas && camVideo.readyState >= 2) {
            camCtx.drawImage(camVideo, 0, 0, camCanvas.width, camCanvas.height);
            
            const activeJitter = jitter + (bass * 50);

            if (dir === 'Horizontal') {
                const mx = camCanvas.width / 2;
                createImageBitmap(camCtx.getImageData(mx, 0, 1, camCanvas.height)).then(bmp => {
                    const jx = (Math.random()-0.5) * activeJitter;
                    
                    // GoL: Offset
                    const goLOffset = isGridAlive(slitScanX, 0, width, height, globalState) ? 50 : 0;
                    
                    ctx.drawImage(bmp, slitScanX + jx + goLOffset, 0, scanSpeed * stretch, height);
                });
                slitScanX = (slitScanX + scanSpeed) % width;
            } else {
                 const my = camCanvas.height / 2;
                 createImageBitmap(camCtx.getImageData(0, my, camCanvas.width, 1)).then(bmp => {
                    const jy = (Math.random()-0.5) * activeJitter;
                    const goLOffset = isGridAlive(0, slitScanX, width, height, globalState) ? 50 : 0;
                    ctx.drawImage(bmp, 0, slitScanX + jy + goLOffset, width, scanSpeed * stretch);
                });
                slitScanX = (slitScanX + scanSpeed) % height;
            }
        }
    }
};
