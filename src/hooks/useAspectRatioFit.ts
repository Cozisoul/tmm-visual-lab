import { useState, useEffect, RefObject } from 'react';

interface Size {
    width: number;
    height: number;
}

export function useAspectRatioFit(
    containerRef: RefObject<HTMLElement>, 
    targetRatio: number
): Size {
    const [size, setSize] = useState<Size>({ width: 0, height: 0 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Get the available space (content box)
                const containerW = entry.contentRect.width;
                const containerH = entry.contentRect.height;
                
                if (containerW === 0 || containerH === 0) continue;

                const containerRatio = containerW / containerH;

                let finalW, finalH;

                if (containerRatio > targetRatio) {
                    // Container is wider than target -> constrained by height
                    finalH = containerH;
                    finalW = finalH * targetRatio;
                } else {
                    // Container is taller than target -> constrained by width
                    finalW = containerW;
                    finalH = finalW / targetRatio;
                }

                setSize({ 
                    width: Math.floor(finalW), 
                    height: Math.floor(finalH) 
                });
            }
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, [containerRef, targetRatio]);

    return size;
}
