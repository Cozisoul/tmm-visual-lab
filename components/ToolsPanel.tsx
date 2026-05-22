/**
 * Tools Panel - Unified container for all tools
 */

import React, { useState } from 'react';
import { 
  Video, 
  Layers, 
  Grid3X3, 
  Clock, 
  Activity,
  X,
  ChevronRight
} from 'lucide-react';
import TimelineEditor from './TimelineEditor';
import VideoExportPanel from './VideoExportPanel';
import PatternLibraryPanel from './PatternLibraryPanel';
import BatchProcessingPanel from './BatchProcessingPanel';
import PerformanceMonitor from './PerformanceMonitor';
import { TimelineState, ParameterTrack, Keyframe } from '../src/types/timeline';
import { SketchParams, ControlDef } from '../types';

interface ToolsPanelProps {
  canvas: HTMLCanvasElement | null;
  timeline: TimelineState;
  params: SketchParams;
  controls: ControlDef[];
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
  onGenerateVariations: (variations: SketchParams[]) => void;
  onApplyPattern: (pattern: any, params: any) => void;
  performanceMetrics: { fps: number; frameTime: number; memoryUsage?: number };
}

type ToolTab = 'timeline' | 'video' | 'patterns' | 'batch' | 'performance' | null;

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  canvas,
  timeline,
  params,
  controls,
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
  onGenerateVariations,
  onApplyPattern,
  performanceMetrics,
}) => {
  const [activeTool, setActiveTool] = useState<ToolTab>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tools = [
    { id: 'timeline' as ToolTab, icon: Clock, label: 'Timeline', component: TimelineEditor },
    { id: 'video' as ToolTab, icon: Video, label: 'Video Export', component: VideoExportPanel },
    { id: 'patterns' as ToolTab, icon: Layers, label: 'Patterns', component: PatternLibraryPanel },
    { id: 'batch' as ToolTab, icon: Grid3X3, label: 'Batch', component: BatchProcessingPanel },
    { id: 'performance' as ToolTab, icon: Activity, label: 'Performance', component: null },
  ];

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
        <div className="p-2 border-b border-zinc-800">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full p-2 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-1 p-2">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                setIsCollapsed(false);
              }}
              className={`p-2 hover:bg-zinc-900 transition-colors ${
                activeTool === tool.id ? 'text-orange-500 bg-orange-500/10' : 'text-zinc-400'
              }`}
              title={tool.label}
            >
              <tool.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const ActiveComponent = tools.find(t => t.id === activeTool)?.component;

  return (
    <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 shadow-xl">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-950 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-600 animate-pulse"></div>
          <span className="text-zinc-400 uppercase text-[9px] font-bold tracking-widest">TOOLS</span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 shrink-0 overflow-x-auto">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`px-3 py-2 text-center uppercase font-bold text-[9px] flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
              activeTool === tool.id
                ? 'bg-zinc-900 text-orange-500 border-b-2 border-orange-500'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            <tool.icon className="w-3 h-3" />
            <span className="hidden sm:inline">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Tool Content */}
      <div className="flex-1 overflow-hidden">
        {activeTool === 'timeline' && ActiveComponent && (
          <ActiveComponent
            timeline={timeline}
            params={params}
            onPlay={onPlay}
            onPause={onPause}
            onStop={onStop}
            onSeek={onSeek}
            onAddTrack={onAddTrack}
            onRemoveTrack={onRemoveTrack}
            onAddKeyframe={onAddKeyframe}
            onRemoveKeyframe={onRemoveKeyframe}
            onUpdateKeyframe={onUpdateKeyframe}
            onSetDuration={onSetDuration}
            onSetLoop={onSetLoop}
          />
        )}
        {activeTool === 'video' && ActiveComponent && (
          <ActiveComponent canvas={canvas} />
        )}
        {activeTool === 'patterns' && ActiveComponent && (
          <ActiveComponent onApplyPattern={onApplyPattern} />
        )}
        {activeTool === 'batch' && ActiveComponent && (
          <ActiveComponent
            params={params}
            controls={controls}
            onGenerateVariations={onGenerateVariations}
          />
        )}
        {activeTool === 'performance' && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <div className="text-zinc-400 uppercase text-[9px] mb-2">Performance Metrics</div>
              <div className="space-y-2 text-zinc-300">
                <div className="text-lg font-bold">{performanceMetrics.fps} FPS</div>
                <div className="text-sm">{performanceMetrics.frameTime}ms</div>
                {performanceMetrics.memoryUsage && (
                  <div className="text-sm">{performanceMetrics.memoryUsage} MB</div>
                )}
              </div>
            </div>
          </div>
        )}
        {!activeTool && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center text-zinc-600">
              <div className="text-[9px] uppercase mb-2">Select a tool</div>
              <div className="text-[8px]">Choose from the tabs above</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPanel;

