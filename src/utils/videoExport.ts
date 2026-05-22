/**
 * Video Export Utilities
 * Enhanced video export with multiple formats and batch processing
 */

export interface ExportPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  codec: 'vp9' | 'h264' | 'av1';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'webm' | 'mp4';
}

export const defaultPresets: ExportPreset[] = [
  {
    id: 'instagram-square',
    name: 'Instagram Square',
    width: 1080,
    height: 1080,
    fps: 30,
    codec: 'h264',
    quality: 'high',
    format: 'mp4',
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    width: 1080,
    height: 1920,
    fps: 30,
    codec: 'h264',
    quality: 'high',
    format: 'mp4',
  },
  {
    id: 'youtube-1080p',
    name: 'YouTube 1080p',
    width: 1920,
    height: 1080,
    fps: 30,
    codec: 'h264',
    quality: 'high',
    format: 'mp4',
  },
  {
    id: 'youtube-4k',
    name: 'YouTube 4K',
    width: 3840,
    height: 2160,
    fps: 30,
    codec: 'h264',
    quality: 'ultra',
    format: 'mp4',
  },
  {
    id: 'twitter',
    name: 'Twitter Video',
    width: 1280,
    height: 720,
    fps: 30,
    codec: 'h264',
    quality: 'medium',
    format: 'mp4',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    width: 1080,
    height: 1920,
    fps: 30,
    codec: 'h264',
    quality: 'high',
    format: 'mp4',
  },
];

export const getBitrate = (quality: ExportPreset['quality'], width: number, height: number): number => {
  const pixels = width * height;
  const multipliers = {
    low: 0.5,
    medium: 1,
    high: 2,
    ultra: 4,
  };
  return Math.floor(pixels * multipliers[quality] * 0.1); // bits per second
};

export const getMimeType = (codec: ExportPreset['codec'], format: ExportPreset['format']): string => {
  if (format === 'mp4') {
    return codec === 'h264' ? 'video/mp4;codecs=h264' : 'video/mp4';
  }
  return `video/webm;codecs=${codec}`;
};

export interface ExportOptions {
  preset?: ExportPreset;
  duration?: number; // milliseconds, if not provided uses current animation
  frameRate?: number;
  includeAudio?: boolean;
  audioTrack?: Blob; // Optional audio file to include
}

export const exportVideo = async (
  canvas: HTMLCanvasElement,
  options: ExportOptions = {}
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const preset = options.preset || defaultPresets[0];
    const fps = options.frameRate || preset.fps;
    const duration = options.duration || 10000; // Default 10 seconds
    const totalFrames = Math.ceil((duration / 1000) * fps);

    const stream = (canvas as any).captureStream?.(fps) || (canvas as any).webkitCaptureStream?.(fps);
    if (!stream) {
      reject(new Error('Canvas stream capture not supported'));
      return;
    }

    const bitrate = getBitrate(preset.quality, preset.width, preset.height);
    const mimeType = getMimeType(preset.codec, preset.format);

    // Check if MediaRecorder supports the mime type
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      console.warn(`Mime type ${mimeType} not supported, falling back to webm`);
      const fallbackMimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(fallbackMimeType)) {
        reject(new Error('No supported video codec found'));
        return;
      }
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm;codecs=vp9',
      videoBitsPerSecond: bitrate,
    });

    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: preset.format === 'mp4' ? 'video/mp4' : 'video/webm' });
      resolve(blob);
    };

    recorder.onerror = (e) => {
      reject(e);
    };

    recorder.start();

    // Stop after duration
    setTimeout(() => {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    }, duration);
  });
};

export const downloadVideo = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const batchExport = async (
  canvas: HTMLCanvasElement,
  presets: ExportPreset[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> => {
  const results: Blob[] = [];
  
  for (let i = 0; i < presets.length; i++) {
    try {
      const blob = await exportVideo(canvas, { preset: presets[i] });
      results.push(blob);
      onProgress?.(i + 1, presets.length);
    } catch (error) {
      console.error(`Failed to export preset ${presets[i].name}:`, error);
      results.push(new Blob()); // Placeholder for failed export
    }
  }
  
  return results;
};

// Simple single-frame PNG export utility using a machine's draw method into an offscreen canvas
export async function exportPNG(machine: any, params: any, resolution: { width: number; height: number }, globalSettings: any): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = resolution.width;
  canvas.height = resolution.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get context for exportPNG');

  const audio = (window as any).AudioService?.getAnalysis ? (window as any).AudioService.getAnalysis() : { volume: 0 };
  const globalState = {
    audio,
    gameOfLife: [],
    golEnabled: false,
    time: performance.now(),
    resolution,
    settings: globalSettings
  } as any;

  if (machine.setup) {
    try { machine.setup(ctx, resolution.width, resolution.height); } catch (e) { console.warn('setup failed for export', e); }
  }
  machine.draw(ctx, resolution.width, resolution.height, params, performance.now(), globalState);
  return canvas.toDataURL('image/png');
}

// Lightweight frame-by-frame recording using an offscreen canvas. Returns a webm Blob.
export async function recordVideo(machine: any, params: any, resolution: { width: number; height: number }, durationSeconds: number, globalSettings: any): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = resolution.width;
  canvas.height = resolution.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get context for recording');

  const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
  if (!stream) throw new Error('captureStream not supported');

  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e: any) => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.start();

  const fps = 30;
  const frameInterval = 1000 / fps;
  let elapsed = 0;

  const audio = (window as any).AudioService?.getAnalysis ? (window as any).AudioService.getAnalysis() : { volume: 0 };
  const globalState = { audio, gameOfLife: [], golEnabled: false, resolution, settings: globalSettings } as any;

  return new Promise<Blob>((resolve, reject) => {
    const interval = setInterval(() => {
      const t = performance.now();
      machine.draw(ctx, resolution.width, resolution.height, params, t, globalState);
      elapsed += frameInterval;
      if (elapsed >= durationSeconds * 1000) {
        clearInterval(interval);
        recorder.onstop = () => { resolve(new Blob(chunks, { type: 'video/webm' })); };
        recorder.stop();
      }
    }, frameInterval);

    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
      reject(new Error('Recording timeout'));
    }, (durationSeconds + 10) * 1000);
  });
}

