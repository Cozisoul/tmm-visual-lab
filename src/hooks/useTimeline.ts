/**
 * useTimeline: Manage animation timeline and keyframes
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { TimelineState, ParameterTrack, Keyframe, easingFunctions } from '../types/timeline';
import { SketchParams } from '../types';

interface UseTimelineProps {
  params: SketchParams;
  onParamsChange: (params: SketchParams) => void;
}

export const useTimeline = ({ params, onParamsChange }: UseTimelineProps) => {
  const [timeline, setTimeline] = useState<TimelineState>({
    duration: 10000, // 10 seconds default
    tracks: [],
    currentTime: 0,
    isPlaying: false,
    loop: false,
  });

  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Interpolate value at current time
  const interpolateValue = useCallback((track: ParameterTrack, time: number): number => {
    if (track.keyframes.length === 0) return params[track.paramId] as number || 0;
    if (track.keyframes.length === 1) return track.keyframes[0].value;

    // Find surrounding keyframes
    const sorted = [...track.keyframes].sort((a, b) => a.time - b.time);
    let before = sorted[0];
    let after = sorted[sorted.length - 1];

    for (let i = 0; i < sorted.length - 1; i++) {
      if (time >= sorted[i].time && time <= sorted[i + 1].time) {
        before = sorted[i];
        after = sorted[i + 1];
        break;
      }
    }

    // Clamp time
    if (time <= before.time) return before.value;
    if (time >= after.time) return after.value;

    // Interpolate
    const duration = after.time - before.time;
    const t = (time - before.time) / duration;
    const easing = easingFunctions[before.easing || 'linear'];
    const easedT = easing(t);

    return before.value + (after.value - before.value) * easedT;
  }, [params]);

  // Update parameters based on timeline
  useEffect(() => {
    if (!timeline.isPlaying || timeline.tracks.length === 0) return;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp - pausedTimeRef.current;
      }

      const elapsed = timestamp - startTimeRef.current;
      let currentTime = elapsed;

      if (timeline.loop) {
        currentTime = elapsed % timeline.duration;
      } else {
        currentTime = Math.min(elapsed, timeline.duration);
        if (currentTime >= timeline.duration) {
          setTimeline(prev => ({ ...prev, isPlaying: false }));
          return;
        }
      }

      setTimeline(prev => ({ ...prev, currentTime }));

      // Update parameters
      const updatedParams = { ...params };
      timeline.tracks.forEach(track => {
        if (track.enabled) {
          updatedParams[track.paramId] = interpolateValue(track, currentTime);
        }
      });
      onParamsChange(updatedParams);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [timeline.isPlaying, timeline.tracks, timeline.loop, timeline.duration, interpolateValue, params, onParamsChange]);

  const play = useCallback(() => {
    if (timeline.isPlaying) return;
    pausedTimeRef.current = timeline.currentTime;
    setTimeline(prev => ({ ...prev, isPlaying: true }));
  }, [timeline.isPlaying, timeline.currentTime]);

  const pause = useCallback(() => {
    if (!timeline.isPlaying) return;
    startTimeRef.current = 0;
    setTimeline(prev => ({ ...prev, isPlaying: false }));
  }, [timeline.isPlaying]);

  const stop = useCallback(() => {
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    setTimeline(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, []);

  const seek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, timeline.duration));
    pausedTimeRef.current = clampedTime;
    startTimeRef.current = 0;
    setTimeline(prev => ({ ...prev, currentTime: clampedTime }));
  }, [timeline.duration]);

  const addTrack = useCallback((paramId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: [...prev.tracks, {
        paramId,
        keyframes: [
          { id: crypto.randomUUID(), time: 0, value: params[paramId] as number || 0 },
          { id: crypto.randomUUID(), time: timeline.duration, value: params[paramId] as number || 0 },
        ],
        enabled: true,
      }],
    }));
  }, [params, timeline.duration]);

  const removeTrack = useCallback((paramId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.paramId !== paramId),
    }));
  }, []);

  const addKeyframe = useCallback((paramId: string, time: number, value: number) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.paramId === paramId
          ? {
              ...track,
              keyframes: [...track.keyframes, {
                id: crypto.randomUUID(),
                time,
                value,
                easing: 'linear',
              }].sort((a, b) => a.time - b.time),
            }
          : track
      ),
    }));
  }, []);

  const removeKeyframe = useCallback((paramId: string, keyframeId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.paramId === paramId
          ? {
              ...track,
              keyframes: track.keyframes.filter(k => k.id !== keyframeId),
            }
          : track
      ),
    }));
  }, []);

  const updateKeyframe = useCallback((paramId: string, keyframeId: string, updates: Partial<Keyframe>) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.paramId === paramId
          ? {
              ...track,
              keyframes: track.keyframes.map(k =>
                k.id === keyframeId ? { ...k, ...updates } : k
              ),
            }
          : track
      ),
    }));
  }, []);

  return {
    timeline,
    play,
    pause,
    stop,
    seek,
    addTrack,
    removeTrack,
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    setDuration: (duration: number) => setTimeline(prev => ({ ...prev, duration })),
    setLoop: (loop: boolean) => setTimeline(prev => ({ ...prev, loop })),
  };
};

