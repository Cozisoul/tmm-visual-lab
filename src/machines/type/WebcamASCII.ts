
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { initWebcam, getCamVideo, getCamCanvas, getCamContext, getCoverUV } from '../../services/webcamService';

const charset = ' .:-=+*#%@';

export const WebcamASCII: Machine = {
    id: 'webcam-ascii',
    name: 'Webcam ASCII',
    department: MachineDepartment.TYPE,
    description: 'Camera feed to ASCII.',
    controls: [
        { id: 'res', label: 'Signal Resolution', type: 'number', min: 4, max: 40, step: 1, defaultValue: 10 },
        { id: 'mode', label: 'Capture Mode', type: 'select', options: ['ASCII', 'Binary', 'Matrix', 'Thermal'], defaultValue: 'ASCII' },
        { id: 'contrast', label: 'Input Gain', type: 'number', min: 0.5, max: 4, step: 0.1, defaultValue: 1.8 },
        { id: 'glow', label: 'Emission', type: 'boolean', defaultValue: true },
        { id: 'color', label: 'Signal Color', type: 'color', defaultValue: '#00ff00' },
        { id: 'bg', label: 'Void Background', type: 'color', defaultValue: '#000000' }
    ],
    setup: (ctx) => initWebcam(),
    draw: (ctx, width, height, params, time, globalState) => {
        const { res, mode, contrast, glow, color, bg } = params;
        
        const vol = globalState?.audio.volume || 0;
        const bass = globalState?.audio.bass || 0;
        const mid = globalState?.audio.mid || 0;
        const treble = globalState?.audio.treble || 0;

        fillBackground(ctx, width, height, bg, globalState);
        
        // Dynamic Resolution based on audio (Bass pulses resolution)
        const activeRes = Math.max(4, res - Math.floor(bass * 4));
        ctx.font = `bold ${activeRes}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        initWebcam(globalState?.settings.cameraId);
        const video = getCamVideo();
        const cCtx = getCamContext();
        const cCanvas = getCamCanvas();

        if (video && cCtx && cCanvas && video.readyState >= 2) {
             cCtx.drawImage(video, 0, 0, cCanvas.width, cCanvas.height);
             const frame = cCtx.getImageData(0, 0, cCanvas.width, cCanvas.height);
             const data = frame.data;
             
             const cols = Math.floor(width / activeRes);
             const rows = Math.floor(height / activeRes);
             
             for (let y = 0; y < rows; y++) {
                 for (let x = 0; x < cols; x++) {
                     const uv = getCoverUV(x * activeRes, y * activeRes, width, height, cCanvas.width, cCanvas.height);
                     const idx = (uv.y * cCanvas.width + uv.x) * 4;
                     
                     if (idx < data.length && idx >= 0) {
                         let r = data[idx];
                         let g = data[idx+1];
                         let b = data[idx+2];
                         let br = (r + g + b) / 3;
                         
                         br = ((br - 128) * (contrast + mid)) + 128;
                         br = Math.max(0, Math.min(255, br));
                         
                         const isAlive = isGridAlive(x * activeRes, y * activeRes, width, height, globalState);
                         
                         ctx.save();
                         ctx.translate(x * activeRes + activeRes / 2, y * activeRes + activeRes / 2);

                         if (isAlive) {
                             ctx.fillStyle = '#ff3300';
                             ctx.globalAlpha = 0.5 * vol;
                             ctx.fillText('X', 0, 0);
                         } else {
                             ctx.globalAlpha = 0.2 + (br / 255) * 0.8;
                             if (glow) {
                                 ctx.shadowColor = color;
                                 ctx.shadowBlur = (br / 50) * treble;
                             }

                             if (mode === 'Thermal') {
                                 ctx.fillStyle = `rgb(${br}, ${255 - br}, 255)`;
                                 ctx.fillRect(-activeRes/2, -activeRes/2, activeRes, activeRes);
                             } else if (mode === 'Binary') {
                                 ctx.fillStyle = color;
                                 ctx.fillText(br > 128 ? '1' : '0', 0, 0);
                             } else if (mode === 'Matrix') {
                                 ctx.fillStyle = `rgb(0, ${br}, 0)`;
                                 ctx.fillText(charset[Math.floor((br / 255) * (charset.length - 1))], 0, 0);
                             } else {
                                 ctx.fillStyle = color;
                                 ctx.fillText(charset[Math.floor((br / 255) * (charset.length - 1))], 0, 0);
                             }
                         }
                         ctx.restore();
                     }
                 }
             }
        } else {
            ctx.fillStyle = color;
            ctx.fillText("WAITING FOR SIGNAL...", width / 2, height / 2);
        }

        // Technical Readout
        if (vol > 0.2) {
            ctx.save();
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.4;
            ctx.fillText(`CAPTURE_ID: CAM_${globalState?.settings.cameraId || '01'}`, 30, 40);
            ctx.fillText(`LUMA_INTENSITY: ${(vol * 100).toFixed(1)}%`, 30, 55);
            ctx.strokeRect(20, 20, 200, 50);
            ctx.restore();
        }
    }
};
