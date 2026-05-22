/**
 * Batch Processing Panel
 * Generate multiple variations automatically
 */

import React, { useState } from 'react';
import { Grid3X3, Download, Play, Settings } from 'lucide-react';
import { generateVariations, VariationConfig } from '../src/utils/batchProcessing';
import { SketchParams, ControlDef } from '../types';

interface BatchProcessingPanelProps {
  params: SketchParams;
  controls: ControlDef[];
  onGenerateVariations: (variations: SketchParams[]) => void;
}

const BatchProcessingPanel: React.FC<BatchProcessingPanelProps> = ({
  params,
  controls,
  onGenerateVariations,
}) => {
  const [variations, setVariations] = useState<VariationConfig[]>([]);
  const [gridCols, setGridCols] = useState(3);
  const [gridRows, setGridRows] = useState(3);

  const numericControls = controls.filter(c => c.type === 'number');

  const handleAddVariation = () => {
    if (numericControls.length === 0) return;
    
    const firstControl = numericControls[0];
    setVariations([
      ...variations,
      {
        paramId: firstControl.id,
        min: firstControl.min || 0,
        max: firstControl.max || 100,
        steps: 3,
      },
    ]);
  };

  const handleRemoveVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index));
  };

  const handleUpdateVariation = (index: number, updates: Partial<VariationConfig>) => {
    setVariations(variations.map((v, i) => i === index ? { ...v, ...updates } : v));
  };

  const handleGenerate = () => {
    if (variations.length === 0) return;
    
    const generated = generateVariations(params, controls, {
      variations,
      gridCols,
      gridRows,
    });
    
    onGenerateVariations(generated);
  };

  return (
    <div className="h-full flex flex-col font-mono text-[10px] bg-[#0a0a0a]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="text-zinc-600 uppercase tracking-widest mb-1">Batch Processing</div>
        <div className="text-orange-500 text-lg font-bold leading-none tracking-tight uppercase">
          Variations Generator
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Grid Settings */}
        <div className="border border-zinc-800 p-3">
          <h3 className="text-zinc-300 font-bold uppercase mb-3 text-[9px] border-b border-zinc-800 pb-1">
            Grid Layout
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 uppercase text-[9px] mb-1 block">Columns</label>
              <input
                type="number"
                value={gridCols}
                onChange={(e) => setGridCols(parseInt(e.target.value) || 1)}
                min="1"
                max="10"
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 px-2 py-1 text-[10px] outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-zinc-400 uppercase text-[9px] mb-1 block">Rows</label>
              <input
                type="number"
                value={gridRows}
                onChange={(e) => setGridRows(parseInt(e.target.value) || 1)}
                min="1"
                max="10"
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 px-2 py-1 text-[10px] outline-none focus:border-orange-500"
              />
            </div>
          </div>
          <div className="text-zinc-500 text-[8px] mt-2 text-center">
            Will generate up to {gridCols * gridRows} variations
          </div>
        </div>

        {/* Variations */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-zinc-300 font-bold uppercase text-[9px] border-b border-zinc-800 pb-1 flex-1">
              Parameter Variations
            </h3>
            <button
              onClick={handleAddVariation}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 text-[9px] uppercase transition-colors flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              ADD
            </button>
          </div>

          {variations.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-800">
              <Grid3X3 className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <div className="text-[9px] uppercase">NO VARIATIONS CONFIGURED</div>
              <div className="text-[8px] text-zinc-500 mt-1">Click ADD to create variation</div>
            </div>
          ) : (
            <div className="space-y-3">
              {variations.map((variation, index) => {
                const control = controls.find(c => c.id === variation.paramId);
                return (
                  <div key={index} className="border border-zinc-800 p-3 bg-zinc-900/50">
                    <div className="flex justify-between items-center mb-2">
                      <select
                        value={variation.paramId}
                        onChange={(e) => handleUpdateVariation(index, { paramId: e.target.value })}
                        className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-300 py-1 px-2 text-[9px] outline-none focus:border-orange-500 uppercase mr-2"
                      >
                        {numericControls.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveVariation(index)}
                        className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 transition-colors"
                      >
                        <Download className="w-3 h-3 rotate-180" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-zinc-500 text-[8px] block mb-1">MIN</label>
                        <input
                          type="number"
                          value={variation.min}
                          onChange={(e) => handleUpdateVariation(index, { min: parseFloat(e.target.value) })}
                          className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-2 py-1 text-[9px] outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[8px] block mb-1">MAX</label>
                        <input
                          type="number"
                          value={variation.max}
                          onChange={(e) => handleUpdateVariation(index, { max: parseFloat(e.target.value) })}
                          className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-2 py-1 text-[9px] outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-zinc-500 text-[8px] block mb-1">STEPS</label>
                        <input
                          type="number"
                          value={variation.steps}
                          onChange={(e) => handleUpdateVariation(index, { steps: parseInt(e.target.value) || 1 })}
                          min="2"
                          max="10"
                          className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 px-2 py-1 text-[9px] outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={variations.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-black py-3 text-[10px] font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Grid3X3 className="w-4 h-4" />
          GENERATE {gridCols * gridRows} VARIATIONS
        </button>
      </div>
    </div>
  );
};

export default BatchProcessingPanel;

