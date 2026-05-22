/**
 * useAudioAnalysis: Handle microphone input and frequency analysis
 */

import { useRef, useEffect, useState } from 'react';
import { AudioData } from '../types/audio';
import { analyzeBands, smoothAudio } from '../services/audioAnalyzer';

interface UseAudioAnalysisProps {
  enabled: boolean;
  audioGain: number;
  audioSmooth: number;
}

export const useAudioAnalysis = ({ enabled, audioGain, audioSmooth }: UseAudioAnalysisProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  const [audioData, setAudioData] = useState<AudioData>({
    volume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    raw: new Uint8Array(256),
    fft: new Uint8Array(256),
  });

  // Store smoothed values for continuity
  const smoothedRef = useRef({ volume: 0, bass: 0, mid: 0, treble: 0 });

  useEffect(() => {
    const initAudio = async () => {
      if (enabled && !audioContextRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 2048; // Increased for better frequency resolution
          analyser.smoothingTimeConstant = audioSmooth;
          const bufferLength = analyser.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
          analyserRef.current = analyser;
          audioContextRef.current = audioCtx;
          streamRef.current = stream;
          setPermissionError(false);
        } catch (err) {
          console.warn('Microphone access denied.', err);
          setPermissionError(true);
        }
      } else if (!enabled && audioContextRef.current) {
        // Properly stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        dataArrayRef.current = null;
      }
    };

    initAudio();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = audioSmooth;
    }
  }, [audioSmooth]);

  const updateAudio = () => {
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }

    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const bands = analyzeBands(dataArrayRef.current, audioSmooth);

      // Apply gain and smoothing
      const gainedBass = Math.min(1, bands.bass * audioGain);
      const gainedMid = Math.min(1, bands.mid * audioGain);
      const gainedTreble = Math.min(1, bands.treble * audioGain);
      const gainedVolume = Math.min(1, bands.volume * audioGain);

      smoothedRef.current.bass = smoothAudio(gainedBass, smoothedRef.current.bass, audioSmooth);
      smoothedRef.current.mid = smoothAudio(gainedMid, smoothedRef.current.mid, audioSmooth);
      smoothedRef.current.treble = smoothAudio(gainedTreble, smoothedRef.current.treble, audioSmooth);
      smoothedRef.current.volume = smoothAudio(gainedVolume, smoothedRef.current.volume, audioSmooth);

      setAudioData({
        volume: smoothedRef.current.volume,
        bass: smoothedRef.current.bass,
        mid: smoothedRef.current.mid,
        treble: smoothedRef.current.treble,
        raw: dataArrayRef.current,
        fft: dataArrayRef.current,
      });
    }
  };

  return { audioData, updateAudio, permissionError };
};
