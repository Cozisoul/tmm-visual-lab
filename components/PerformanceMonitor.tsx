/**
 * Performance Monitor Component
 * Display FPS and performance metrics
 */

import React from 'react';
import { Activity, Zap } from 'lucide-react';
import { PerformanceMetrics } from '../src/hooks/usePerformanceMonitor';

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  metrics,
  position = 'top-right',
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} bg-zinc-950/90 border border-zinc-800 p-2 font-mono text-[9px] z-50 backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-3 h-3 text-zinc-400" />
        <span className="text-zinc-500 uppercase">Performance</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">FPS:</span>
          <span className={getFPSColor(metrics.fps)}>
            {metrics.fps}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Frame:</span>
          <span className="text-zinc-300">{metrics.frameTime}ms</span>
        </div>
        {metrics.memoryUsage && (
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-zinc-400" />
            <span className="text-zinc-300">{metrics.memoryUsage} MB</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;

