import { useState, useEffect, RefObject } from 'react';

interface FitDimensions {
  width: number;
  height: number;
  ratio: number;
}

/**
 * Calculates the exact width/height to "contain" a target aspect ratio 
 * within a responsive parent container.
 * 
 * @param containerRef Ref to the parent container to measure
 * @param targetWidth The desired resolution width (e.g. 1080)
 * @param targetHeight The desired resolution height (e.g. 1920)
 * @returns Object containing calculated width and height in pixels
 */
export function useCanvasFitter(
  containerRef: RefObject<HTMLElement>,
  targetWidth: number,
  targetHeight: number
): FitDimensions {
  // Default to 0 to avoid flash of wrong size
  const [dimensions, setDimensions] = useState<FitDimensions>({ 
    width: 0, 
    height: 0,
    ratio: targetWidth / targetHeight
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use ResizeObserver for high-performance responsive updates
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use contentRect for precise content box measurements (excluding padding)
        const parentW = entry.contentRect.width;
        const parentH = entry.contentRect.height;
        
        if (parentW <= 0 || parentH <= 0) continue;

        const targetRatio = targetWidth / targetHeight;
        const parentRatio = parentW / parentH;

        let finalW = 0;
        let finalH = 0;

        if (parentRatio > targetRatio) {
          // Parent is wider than target (e.g. screen is 16:9, target is 1:1)
          // Vertical axis is the bottleneck.
          // Fit to Height.
          finalH = parentH;
          finalW = finalH * targetRatio;
        } else {
          // Parent is taller than target (e.g. screen is 9:16, target is 1:1)
          // Horizontal axis is the bottleneck.
          // Fit to Width.
          finalW = parentW;
          finalH = finalW / targetRatio;
        }

        setDimensions({
          width: Math.floor(finalW),
          height: Math.floor(finalH),
          ratio: targetRatio
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, targetWidth, targetHeight]);

  return dimensions;
}
