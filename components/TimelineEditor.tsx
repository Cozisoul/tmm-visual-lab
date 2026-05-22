/**
 * Timeline Editor Component
 * Visual keyframe-based animation editor
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Plus, Trash2, Settings } from 'lucide-react';
import { TimelineState, ParameterTrack, Keyframe } from '../src/types/timeline';
import { SketchParams } from '../types';

interface TimelineEditorProps {
  timeline: TimelineState;
  params: SketchParams;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onAddTrack: (paramId: string) => void;
  onRemoveTrack: (paramId: string) => void;
  onAddKeyframe: (paramId: string, time: number, value: number) => void;
  onRemoveKeyframe: (paramId: string, keyframeId: string) => void;
  onUpdateKeyframe: (paramId: string, keyframeId: string, updates: Partial<Keyframe>) => void;
  onSetDuration: (duration: number) => void;
  onSetLoop: (loop: boolean) => void;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  timeline,
  params,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onAddTrack,
  onRemoveTrack,
  onAddKeyframe,
  onRemoveKeyframe,
  onUpdateKeyframe,
  onSetDuration,
  onSetLoop,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [selectedKeyframe, setSelectedKeyframe] = useState<{ paramId: string; keyframeId: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 });

  const pixelsPerSecond = 50; // Scale factor
  const trackHeight = 40;

  const timeToX = (time: number) => (time / 1000) * pixelsPerSecond;
  const xToTime = (x: number) => (x / pixelsPerSecond) * 1000;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>, paramId: string) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 200; // Account for param name column
    const time = Math.max(0, Math.min(xToTime(x), timeline.duration));
    
    // Get current value for this parameter
    const currentValue = params[paramId] as number || 0;
    onAddKeyframe(paramId, time, currentValue);
  };

  const handleKeyframeDragStart = (e: React.MouseEvent, paramId: string, keyframeId: string, time: number) => {
    e.stopPropagation();
    setIsDragging(true);
    setSelectedKeyframe({ paramId, keyframeId });
    setDragStart({ x: e.clientX, time });
  };

  useEffect(() => {
    if (!isDragging || !selectedKeyframe) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStart.x;
      const deltaTime = xToTime(deltaX);
      const newTime = Math.max(0, Math.min(dragStart.time + deltaTime, timeline.duration));
      
      onUpdateKeyframe(selectedKeyframe.paramId, selectedKeyframe.keyframeId, { time: newTime });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedKeyframe, dragStart, timeline.duration, onUpdateKeyframe]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toFixed(1).padStart(4, '0')}`;
  };

  const availableParams = Object.keys(params).filter(
    key => typeof params[key] === 'number' && !timeline.tracks.some(t => t.paramId === key)
  );

  return (
    <div className="h-full flex flex-col font-mono text-[10px] bg-[#0a0a0a]">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="text-zinc-600 uppercase tracking-widest mb-1">Animation Timeline</div>
        <div className="text-orange-500 text-lg font-bold leading-none tracking-tight uppercase">
          Keyframe Editor
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/20 shrink-0 flex items-center gap-2">
        <button
          onClick={timeline.isPlaying ? onPause : onPlay}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 text-[9px] font-bold uppercase transition-colors flex items-center gap-2"
        >
          {timeline.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {timeline.isPlaying ? 'PAUSE' : 'PLAY'}
        </button>
        <button
          onClick={onStop}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 text-[9px] font-bold uppercase transition-colors flex items-center gap-2"
        >
          <Square className="w-3 h-3" />
          STOP
        </button>
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-zinc-400">
          <input
            type="checkbox"
            checked={timeline.loop}
            onChange={(e) => onSetLoop(e.target.checked)}
            className="w-3 h-3"
          />
          <span className="text-[9px] uppercase">LOOP</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[9px]">DURATION:</span>
          <input
            type="number"
            value={timeline.duration / 1000}
            onChange={(e) => onSetDuration(parseFloat(e.target.value) * 1000)}
            className="w-16 bg-zinc-900 border border-zinc-700 text-zinc-200 px-2 py-1 text-[9px] outline-none focus:border-orange-500"
            step="0.1"
            min="0.1"
          />
          <span className="text-zinc-500 text-[9px]">s</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {timeline.tracks.map(track => (
            <div key={track.paramId} className="border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center gap-2 p-2 border-b border-zinc-800">
                <input
                  type="checkbox"
                  checked={track.enabled}
                  onChange={(e) => {
                    // Toggle track enabled state
                    const updatedTracks = timeline.tracks.map(t =>
                      t.paramId === track.paramId ? { ...t, enabled: e.target.checked } : t
                    );
                    // This would need to be handled by parent
                  }}
                  className="w-3 h-3"
                />
                <span className="flex-1 text-zinc-300 font-bold uppercase text-[9px]">
                  {track.paramId}
                </span>
                <button
                  onClick={() => onRemoveTrack(track.paramId)}
                  className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div
                ref={timelineRef}
                className="relative h-12 bg-zinc-950 cursor-crosshair"
                onClick={(e) => handleTimelineClick(e, track.paramId)}
              >
                {/* Time markers */}
                {Array.from({ length: Math.ceil(timeline.duration / 1000) + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 border-l border-zinc-800"
                    style={{ left: `${timeToX(i * 1000) + 200}px` }}
                  >
                    <div className="absolute -top-4 left-0 text-[8px] text-zinc-600">
                      {i}s
                    </div>
                  </div>
                ))}

                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-10 pointer-events-none"
                  style={{ left: `${timeToX(timeline.currentTime) + 200}px` }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-orange-500" />
                </div>

                {/* Keyframes */}
                {track.keyframes.map(keyframe => {
                  const x = timeToX(keyframe.time) + 200;
                  const control = Object.values(params).find((_, i) => Object.keys(params)[i] === track.paramId);
                  const min = 0; // Would need to get from control definition
                  const max = 100;
                  const normalizedValue = (keyframe.value - min) / (max - min);
                  const y = trackHeight - (normalizedValue * trackHeight);

                  return (
                    <div
                      key={keyframe.id}
                      className={`absolute w-3 h-3 rounded-full border-2 cursor-move z-20 ${
                        selectedKeyframe?.keyframeId === keyframe.id
                          ? 'bg-orange-500 border-orange-300'
                          : 'bg-zinc-700 border-zinc-500 hover:border-orange-500'
                      }`}
                      style={{
                        left: `${x - 6}px`,
                        top: `${y - 6}px`,
                      }}
                      onMouseDown={(e) => handleKeyframeDragStart(e, track.paramId, keyframe.id, keyframe.time)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedKeyframe({ paramId: track.paramId, keyframeId: keyframe.id });
                      }}
                      title={`${formatTime(keyframe.time)}: ${keyframe.value.toFixed(2)}`}
                    />
                  );
                })}

                {/* Value curve */}
                <svg className="absolute inset-0 pointer-events-none" style={{ width: `${timeToX(timeline.duration) + 200}px` }}>
                  <polyline
                    points={track.keyframes
                      .sort((a, b) => a.time - b.time)
                      .map((kf, i) => {
                        const x = timeToX(kf.time) + 200;
                        const min = 0;
                        const max = 100;
                        const normalizedValue = (kf.value - min) / (max - min);
                        const y = trackHeight - (normalizedValue * trackHeight);
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                </svg>
              </div>
            </div>
          ))}

          {/* Add Track */}
          {availableParams.length > 0 && (
            <div className="border border-dashed border-zinc-800 p-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onAddTrack(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 py-2 px-3 text-[9px] outline-none focus:border-orange-500 uppercase"
                defaultValue=""
              >
                <option value="">+ ADD PARAMETER TRACK</option>
                {availableParams.map(paramId => (
                  <option key={paramId} value={paramId}>
                    {paramId}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineEditor;

