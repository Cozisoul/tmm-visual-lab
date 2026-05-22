/**
 * Webcam Service
 * Handles camera initialization and frame capture
 */

let camVideo: HTMLVideoElement | null = null;
let camCanvas: HTMLCanvasElement | null = null;
let camCtx: CanvasRenderingContext2D | null = null;
let currentDeviceId: string | null = null;
let isWebcamInitializing = false;

export const initWebcam = (deviceId?: string) => {
    if (isWebcamInitializing) return;

    // Check if we need to restart due to device change
    if (camVideo && deviceId && currentDeviceId !== deviceId) {
        if(camVideo.srcObject) {
            const tracks = (camVideo.srcObject as MediaStream).getTracks();
            tracks.forEach(t => t.stop());
        }
        camVideo = null; // Force re-init
    }

    if (camVideo) return; // Already running

    isWebcamInitializing = true;
    
    const vid = document.createElement('video');
    vid.width = 640;
    vid.height = 480;
    vid.autoplay = true;
    vid.playsInline = true;
    vid.muted = true;
    
    camCanvas = document.createElement('canvas');
    camCanvas.width = 640;
    camCanvas.height = 480;
    camCtx = camCanvas.getContext('2d', { willReadFrequently: true });

    const constraints = {
        video: {
            width: 640, height: 480,
            deviceId: deviceId ? { exact: deviceId } : undefined
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            vid.srcObject = stream;
            vid.play();
            camVideo = vid;
            currentDeviceId = deviceId || null;
            isWebcamInitializing = false;
        })
        .catch(e => {
            console.warn("Webcam access denied or unavailable:", e);
            isWebcamInitializing = false;
        });
};

export const getCamVideo = () => camVideo;
export const getCamContext = () => camCtx;
export const getCamCanvas = () => camCanvas;

export const getCoverUV = (x: number, y: number, w: number, h: number, texW: number, texH: number) => {
    const scale = Math.max(w / texW, h / texH);
    const scaledW = texW * scale;
    const scaledH = texH * scale;
    const offsetX = (scaledW - w) / 2;
    const offsetY = (scaledH - h) / 2;
    const texX = Math.floor(((x + offsetX) / scaledW) * texW);
    const texY = Math.floor(((y + offsetY) / scaledH) * texH);
    return { x: texX, y: texY };
};
