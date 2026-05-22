/**
 * Video Export Panel
 * Enhanced video export with presets and batch processing
 */

import React, { useState } from 'react';
import { Video, Download, Settings, Play, Loader } from 'lucide-react';
import { exportVideo, downloadVideo, batchExport, defaultPresets, ExportPreset } from '../src/utils/videoExport';

interface VideoExportPanelProps {
  canvas: HTMLCanvasElement | null;
}

const VideoExportPanel: React.FC<VideoExportPanelProps> = ({ canvas }) => {
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset>(defaultPresets[0]);
  const [duration, setDuration] = useState(10); // seconds
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [batchMode, setBatchMode] = useState(false);
  const [selectedBatchPresets, setSelectedBatchPresets] = useState<string[]>([]);

  const handleExport = async () => {
    if (!canvas) return;

    setIsExporting(true);
    try {
      const blob = await exportVideo(canvas, {
        preset: selectedPreset,
        duration: duration * 1000,
      });
      
      const filename = `TMM-OS-${selectedPreset.name.replace(/\s+/g, '-')}-${Date.now()}.${selectedPreset.format}`;
      downloadVideo(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchExport = async () => {
    if (!canvas || selectedBatchPresets.length === 0) return;

    setIsExporting(true);
    setExportProgress({ current: 0, total: selectedBatchPresets.length });

    try {
      const presets = defaultPresets.filter(p => selectedBatchPresets.includes(p.id));
      const blobs = await batchExport(canvas, presets, (current, total) => {
        setExportProgress({ current, total });
      });

      blobs.forEach((blob, i) => {
        if (blob.size > 0) {
          const preset = presets[i];
          const filename = `TMM-OS-${preset.name.replace(/\s+/g, '-')}-${Date.now()}.${preset.format}`;
          downloadVideo(blob, filename);
        }
      });
    } catch (error) {
      console.error('Batch export failed:', error);
      alert('Batch export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="h-full flex flex-col font-mono text-[10px] bg-[#0a0a0a]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="text-zinc-600 uppercase tracking-widest mb-1">Video Export</div>
        <div className="text-orange-500 text-lg font-bold leading-none tracking-tight uppercase">
          Export Suite
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Mode Toggle */}
        <div className="flex gap-2 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setBatchMode(false)}
            className={`flex-1 py-2 text-center uppercase font-bold text-[9px] transition-colors ${
              !batchMode ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Single Export
          </button>
          <button
            onClick={() => setBatchMode(true)}
            className={`flex-1 py-2 text-center uppercase font-bold text-[9px] transition-colors ${
              batchMode ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            Batch Export
          </button>
        </div>

        {!batchMode ? (
          <>
            {/* Single Export */}
            <div>
              <h3 className="text-zinc-300 font-bold uppercase mb-3 border-b border-zinc-800 pb-1">
                Export Preset
              </h3>
              <select
                value={selectedPreset.id}
                onChange={(e) => {
                  const preset = defaultPresets.find(p => p.id === e.target.value);
                  if (preset) setSelectedPreset(preset);
                }}
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 py-2 px-3 text-[9px] outline-none focus:border-orange-500 uppercase mb-3"
              >
                {defaultPresets.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name} ({preset.width}×{preset.height}, {preset.fps}fps)
                  </option>
                ))}
              </select>

              <div className="space-y-2 text-[9px] text-zinc-400 mb-4">
                <div>Resolution: {selectedPreset.width} × {selectedPreset.height}</div>
                <div>Frame Rate: {selectedPreset.fps} fps</div>
                <div>Quality: {selectedPreset.quality.toUpperCase()}</div>
                <div>Format: {selectedPreset.format.toUpperCase()}</div>
              </div>

              <div className="mb-4">
                <label className="text-zinc-400 uppercase text-[9px] mb-2 block">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                  min="0.1"
                  step="0.1"
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 px-3 py-2 text-[10px] outline-none focus:border-orange-500"
                />
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting || !canvas}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black py-3 text-[10px] font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    EXPORTING...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    EXPORT VIDEO
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Batch Export */}
            <div>
              <h3 className="text-zinc-300 font-bold uppercase mb-3 border-b border-zinc-800 pb-1">
                Select Presets
              </h3>
              <div className="space-y-2 mb-4">
                {defaultPresets.map(preset => (
                  <label
                    key={preset.id}
                    className="flex items-center gap-2 p-2 border border-zinc-800 hover:border-zinc-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBatchPresets.includes(preset.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBatchPresets([...selectedBatchPresets, preset.id]);
                        } else {
                          setSelectedBatchPresets(selectedBatchPresets.filter(id => id !== preset.id));
                        }
                      }}
                      className="w-3 h-3"
                    />
                    <div className="flex-1">
                      <div className="text-zinc-300 font-bold text-[9px] uppercase">
                        {preset.name}
                      </div>
                      <div className="text-zinc-500 text-[8px]">
                        {preset.width}×{preset.height} • {preset.fps}fps • {preset.quality}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {isExporting && (
                <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800">
                  <div className="text-zinc-400 text-[9px] mb-2">
                    Exporting {exportProgress.current} of {exportProgress.total}
                  </div>
                  <div className="w-full bg-zinc-950 h-2">
                    <div
                      className="bg-orange-500 h-full transition-all"
                      style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleBatchExport}
                disabled={isExporting || !canvas || selectedBatchPresets.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black py-3 text-[10px] font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    EXPORTING {exportProgress.current}/{exportProgress.total}...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    EXPORT {selectedBatchPresets.length} VIDEOS
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoExportPanel;

