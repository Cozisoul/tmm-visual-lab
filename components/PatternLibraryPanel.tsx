/**
 * Pattern Library Panel
 * Browse and apply pattern generators
 */

import React, { useState, useRef } from 'react';
import { Layers, Play, Download, Grid3X3, Waves, Sparkles } from 'lucide-react';
import { allPatterns, Pattern, PatternParams } from '../src/utils/patternLibrary';

interface PatternLibraryPanelProps {
  onApplyPattern: (pattern: Pattern, params: PatternParams) => void;
}

const PatternLibraryPanel: React.FC<PatternLibraryPanelProps> = ({ onApplyPattern }) => {
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [patternParams, setPatternParams] = useState<PatternParams>({
    scale: 50,
    color: '#ffffff',
    opacity: 1,
  });
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const categoryIcons = {
    geometric: Grid3X3,
    organic: Waves,
    noise: Sparkles,
    texture: Layers,
  };

  const updatePreview = () => {
    if (!selectedPattern || !previewCanvasRef.current) return;
    
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    selectedPattern.generate(ctx, canvas.width, canvas.height, patternParams);
  };

  const handlePatternSelect = (pattern: Pattern) => {
    setSelectedPattern(pattern);
    setTimeout(updatePreview, 100);
  };

  React.useEffect(() => {
    updatePreview();
  }, [selectedPattern, patternParams]);

  const handleApply = () => {
    if (selectedPattern) {
      onApplyPattern(selectedPattern, patternParams);
    }
  };

  return (
    <div className="h-full flex flex-col font-mono text-[10px] bg-[#0a0a0a]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="text-zinc-600 uppercase tracking-widest mb-1">Pattern Library</div>
        <div className="text-orange-500 text-lg font-bold leading-none tracking-tight uppercase">
          Texture Generators
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Pattern List */}
        <div className="space-y-2">
          {allPatterns.map(pattern => {
            const Icon = categoryIcons[pattern.category] || Layers;
            return (
              <button
                key={pattern.id}
                onClick={() => handlePatternSelect(pattern)}
                className={`w-full text-left p-3 border transition-colors ${
                  selectedPattern?.id === pattern.id
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3 h-3 text-zinc-400" />
                  <span className="text-zinc-300 font-bold uppercase text-[9px]">
                    {pattern.name}
                  </span>
                </div>
                <div className="text-zinc-500 text-[8px] uppercase">
                  {pattern.category}
                </div>
              </button>
            );
          })}
        </div>

        {/* Preview & Controls */}
        {selectedPattern && (
          <div className="border border-zinc-800 p-4 space-y-4">
            <h3 className="text-zinc-300 font-bold uppercase text-[9px] border-b border-zinc-800 pb-2">
              Preview & Controls
            </h3>

            <div className="bg-zinc-950 border border-zinc-800 p-2">
              <canvas
                ref={previewCanvasRef}
                width={200}
                height={200}
                className="w-full h-auto"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-zinc-400 uppercase text-[9px] mb-1 block">
                  Scale
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={patternParams.scale || 50}
                  onChange={(e) => setPatternParams({ ...patternParams, scale: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-zinc-500 text-[8px] text-right">
                  {patternParams.scale}
                </div>
              </div>

              <div>
                <label className="text-zinc-400 uppercase text-[9px] mb-1 block">
                  Color
                </label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 h-8 border border-zinc-700 relative overflow-hidden">
                    <input
                      type="color"
                      value={patternParams.color || '#ffffff'}
                      onChange={(e) => setPatternParams({ ...patternParams, color: e.target.value })}
                      className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer"
                    />
                  </div>
                  <span className="text-zinc-500 uppercase text-[9px]">
                    {patternParams.color}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 uppercase text-[9px] mb-1 block">
                  Opacity
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={patternParams.opacity || 1}
                  onChange={(e) => setPatternParams({ ...patternParams, opacity: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-zinc-500 text-[8px] text-right">
                  {(patternParams.opacity || 1).toFixed(1)}
                </div>
              </div>
            </div>

            <button
              onClick={handleApply}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black py-2 text-[9px] font-bold uppercase transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-3 h-3" />
              APPLY PATTERN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternLibraryPanel;

