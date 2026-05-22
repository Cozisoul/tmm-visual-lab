import { useRef, useState, useEffect, useCallback } from 'react';
import { AudioData } from '../types/audio';

interface SimpleAudioState {
  audioData: AudioData;
  isPlaying: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  getAudioData: () => AudioData;
}

export const useSimpleAudio = (): SimpleAudioState => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const [state, setState] = useState<SimpleAudioState>({
    isPlaying: false,
    error: null,
    audioData: {
      volume: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      fft: new Uint8Array(128),
      raw: new Uint8Array(128)
    },
    start: async () => {}, // placeholder
    stop: () => {}, // placeholder
    getAudioData: () => ({
        volume: 0,
        bass: 0,
        mid: 0,
        treble: 0,
        fft: new Uint8Array(128),
        raw: new Uint8Array(128)
    })
  });

  // Ref for non-reactive, instant access in the loop
  const audioDataRef = useRef<AudioData>({
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    fft: new Uint8Array(128),
    raw: new Uint8Array(128)
  });

  const start = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // 1. Create AudioContext if needed
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      // 2. Resume if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // 3. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 4. Create Analyser
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048; // Increased for better frequency resolution
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);

      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      setIsPlaying(true);
      console.log('Audio Context Started Successfully');

    } catch (err: any) {
      console.error('Failed to start audio:', err);
      setState(prev => ({ ...prev, error: err.message || 'Microphone access failed' }));
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.suspend();
    setIsPlaying(false);
  }, []);

  // Frame update function to be called inside animation loop
  const update = useCallback(() => {
    if (!isPlaying || !analyserRef.current || !dataArrayRef.current) return audioDataRef.current;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const length = dataArrayRef.current.length;
    const bassLimit = Math.floor(length * 0.1);
    const midLimit = Math.floor(length * 0.5);

    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let totalSum = 0;

    for (let i = 0; i < length; i++) {
      const val = dataArrayRef.current[i];
      totalSum += val;
      if (i < bassLimit) bassSum += val;
      else if (i < midLimit) midSum += val;
      else trebleSum += val;
    }

    const bassCount = bassLimit || 1;
    const midCount = (midLimit - bassLimit) || 1;
    const trebleCount = (length - midLimit) || 1;

    // Update Ref directly for speed
    audioDataRef.current = {
      bass: (bassSum / bassCount) / 255,
      mid: (midSum / midCount) / 255,
      treble: (trebleSum / trebleCount) / 255,
      volume: (totalSum / length) / 255,
      fft: dataArrayRef.current,
      raw: dataArrayRef.current
    };

    return audioDataRef.current;
  }, [isPlaying]);

  return {
    audioData: audioDataRef.current,
    getAudioData: update, 
    start, 
    stop, 
    isPlaying, 
    error: state.error 
  };
};
