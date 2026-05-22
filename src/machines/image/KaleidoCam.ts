
import { Machine, MachineDepartment } from '../../types';
import { fillBackground, isGridAlive } from '../../utils/canvas';
import { initWebcam, getCamVideo } from '../../services/webcamService';

export const KaleidoCam: Machine = {
    id: 'kaleido-cam',
    name: 'Kaleido-Cam',
    department: MachineDepartment.IMAGE,
    description: 'Geometric webcam reflection.',
    controls: [
        { id: 'segments', label: 'Segments', type: 'number', min: 2, max: 12, step: 1, defaultValue: 6 },
        { id: 'zoom', label: 'Zoom', type: 'number', min: 0.5, max: 3, step: 0.1, defaultValue: 1 },
        { id: 'rotation', label: 'Rotate Speed', type: 'number', min: 0, max: 2, step: 0.1, defaultValue: 0.2 },
        { id: 'color', label: 'Tint', type: 'color', defaultValue: '#ffffff' },
        { id: 'bg', label: 'Background', type: 'color', defaultValue: '#000000' }
    ],
    setup: (ctx) => initWebcam(),
    draw: (ctx, width, height, params, time, globalState) => {
        const { segments, zoom, rotation, color, bg } = params;
        const vol = globalState?.audio.volume || 0;
        fillBackground(ctx, width, height, bg, globalState);

        initWebcam(globalState?.settings.cameraId);
        const camVideo = getCamVideo();
        
        if(camVideo && camVideo.readyState >= 2) {
             const cx = width/2;
             const cy = height/2;
             const radius = Math.max(width, height) * 0.8;
             const angle = (Math.PI*2) / segments;
             const t = time * 0.001 * rotation * (1 + vol); // Audio speed
             
             // GoL: Shatter Offset
             const isGoL = isGridAlive(cx, cy, width, height, globalState);
             const offset = isGoL ? 100 : 0;

             ctx.save();
             ctx.translate(cx + offset, cy + offset);
             
             for(let i=0; i<segments; i++) {
                 ctx.save();
                 ctx.rotate(i * angle + t);
                 ctx.beginPath();
                 ctx.moveTo(0,0);
                 ctx.arc(0,0, radius, -angle/2 - 0.01, angle/2 + 0.01);
                 ctx.closePath();
                 ctx.clip();
                 
                 // Draw Cam
                 ctx.rotate(-Math.PI/2); // Align vertical
                 ctx.scale(zoom, zoom);
                 // Center cam
                 const vw = camVideo.videoWidth;
                 const vh = camVideo.videoHeight;
                 ctx.drawImage(camVideo, -vw/2, -vh/2, vw, vh);
                 
                 ctx.restore();
                 
                 // Mirror segment
                 ctx.save();
                 ctx.scale(1, -1);
                 ctx.rotate(i * angle + t); 
                 ctx.beginPath();
                 ctx.moveTo(0,0);
                 ctx.arc(0,0, radius, -angle/2 - 0.01, angle/2 + 0.01);
                 ctx.closePath();
                 ctx.clip();
                 
                 ctx.rotate(-Math.PI/2);
                 ctx.scale(zoom, zoom);
                 ctx.drawImage(camVideo, -vw/2, -vh/2, vw, vh);
                 ctx.restore();
             }
             ctx.restore();
        }
    }
}
