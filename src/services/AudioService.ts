
import { AudioData } from '../types/audio';

class AudioServiceClass {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array = new Uint8Array(0);
  private isActive: boolean = false;
  private error: string | null = null;

  private emptyData: AudioData = {
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    fft: new Uint8Array(0),
    raw: new Uint8Array(0)
  };

  constructor() {
    this.emptyData.fft = new Uint8Array(128); // Default size match
    this.emptyData.raw = new Uint8Array(128);
  }

  public async start(): Promise<void> {
    if (this.isActive) return;

    try {
      this.error = null;
      
      // 1. Init Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.context) {
        this.context = new AudioCtx();
      }

      // 2. Resume if needed
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      // 3. Get Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 4. Setup Analyser
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048; // Increased for better frequency resolution
      this.analyser.smoothingTimeConstant = 0.7; // Reduced for faster response

      this.source = this.context.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.isActive = true;
      console.log("[AudioService] Started");

    } catch (err: any) {
      console.error("[AudioService] Start Error:", err);
      this.error = err.message;
      this.isActive = false;
    }
  }

  public stop(): void {
    if (!this.isActive) return;

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    // We don't close the context, just suspend it to allow fast restart
    if (this.context && this.context.state === 'running') {
      this.context.suspend();
    }

    this.isActive = false;
    console.log("[AudioService] Stopped");
  }

  public getAnalysis(): AudioData {
    if (!this.isActive || !this.analyser || !this.dataArray) {
      return this.emptyData;
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    const length = this.dataArray.length;
    
    // Enhanced frequency band splits for better detection
    const bassLimit = Math.floor(length * 0.15) || 1;    // 0-15% = bass (more bins)
    const midLimit = Math.floor(length * 0.60) || 1;     // 15-60% = mid-range

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let totalSum = 0;

    for (let i = 0; i < length; i++) {
      const val = this.dataArray[i];
      totalSum += val;
      if (i < bassLimit) bassSum += val;
      else if (i < midLimit) midSum += val;
      else trebleSum += val;
    }

    const bassCount = bassLimit;
    const midCount = midLimit - bassLimit;
    const trebleCount = length - midLimit;

    // Calculate normalized values with strong multipliers for high sensitivity
    // THRESHOLD: Values below 0.02 are clamped to 0 to prevent drift
    const ZERO_THRESHOLD = 0.02;
    
    let bass = ((bassSum / bassCount) / 255) * 3.0;      // 3x gain for strong bass response
    let mid = ((midSum / midCount) / 255) * 1.8;         // 1.8x gain for mid response
    let treble = ((trebleSum / trebleCount) / 255) * 2.5; // 2.5x gain for treble
    let volume = (totalSum / length) / 255;
    
    // Clamp to zero if below threshold to stop motion when quiet
    bass = bass < ZERO_THRESHOLD ? 0 : Math.min(1, bass);
    mid = mid < ZERO_THRESHOLD ? 0 : Math.min(1, mid);
    treble = treble < ZERO_THRESHOLD ? 0 : Math.min(1, treble);
    volume = volume < ZERO_THRESHOLD ? 0 : Math.min(1, volume);
    
    return {
      bass,
      mid,
      treble,
      volume,
      fft: this.dataArray, 
      raw: this.dataArray 
    };
  }

  public isRunning(): boolean {
    return this.isActive;
  }

  public getError(): string | null {
    return this.error;
  }
}

export const AudioService = new AudioServiceClass();
