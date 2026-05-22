/**
 * usePerformanceMonitor: Monitor FPS and performance metrics
 */

import { useState, useEffect, useRef } from 'react';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number; // milliseconds
  memoryUsage?: number; // MB (if available)
}

export const usePerformanceMonitor = (enabled: boolean = true) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimesRef = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const measureFrame = () => {
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;

      frameCountRef.current++;
      frameTimesRef.current.push(deltaTime);

      // Keep only last 60 frames
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Calculate average FPS and frame time
      const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const fps = 1000 / avgFrameTime;

      setMetrics({
        fps: Math.round(fps),
        frameTime: Math.round(avgFrameTime * 100) / 100,
        memoryUsage: (performance as any).memory
          ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
          : undefined,
      });
    };

    let rafId: number;
    const loop = () => {
      measureFrame();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [enabled]);

  return metrics;
};

