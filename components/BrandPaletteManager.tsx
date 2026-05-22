/**
 * Brand Palette Manager
 * Integration with TMM-OS Doc 04: Brand Identity & IP System
 */

import React, { useState, useEffect } from 'react';
import { Palette, Plus, Trash2, Save, Copy } from 'lucide-react';
import { BrandPalette, loadBrandPalettes, saveBrandPalette } from '../src/utils/assetManager';

interface BrandPaletteManagerProps {
  onSelectPalette?: (colors: string[]) => void;
}

const BrandPaletteManager: React.FC<BrandPaletteManagerProps> = ({ onSelectPalette }) => {
  const [palettes, setPalettes] = useState<BrandPalette[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<BrandPalette | null>(null);
  const [newPaletteName, setNewPaletteName] = useState('');
  const [newPaletteColors, setNewPaletteColors] = useState<string[]>(['#000000', '#ffffff']);

  useEffect(() => {
    setPalettes(loadBrandPalettes());
  }, []);

  const handleCreatePalette = () => {
    if (!newPaletteName.trim()) return;
    
    const palette: BrandPalette = {
      id: crypto.randomUUID(),
      name: newPaletteName,
      colors: newPaletteColors,
    };
    
    saveBrandPalette(palette);
    setPalettes([...palettes, palette]);
    setNewPaletteName('');
    setNewPaletteColors(['#000000', '#ffffff']);
  };

  const handleAddColor = () => {
    setNewPaletteColors([...newPaletteColors, '#000000']);
  };

  const handleColorChange = (index: number, color: string) => {
    const updated = [...newPaletteColors];
    updated[index] = color;
    setNewPaletteColors(updated);
  };

  const handleRemoveColor = (index: number) => {
    if (newPaletteColors.length > 1) {
      setNewPaletteColors(newPaletteColors.filter((_, i) => i !== index));
    }
  };

  const handleSelectPalette = (palette: BrandPalette) => {
    setSelectedPalette(palette);
    if (onSelectPalette) {
      onSelectPalette(palette.colors);
    }
  };

  const handleDeletePalette = (id: string) => {
    if (confirm('Delete this palette?')) {
      const updated = palettes.filter(p => p.id !== id);
      localStorage.setItem('tmm_os_brand_palettes', JSON.stringify(updated));
      setPalettes(updated);
      if (selectedPalette?.id === id) {
        setSelectedPalette(null);
      }
    }
  };

  return (
    <div className="h-full flex flex-col font-mono text-[10px] bg-[#0a0a0a]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="text-zinc-600 uppercase tracking-widest mb-1">Brand Palettes</div>
        <div className="text-orange-500 text-lg font-bold leading-none tracking-tight uppercase">
          TMM-OS Identity
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Create New Palette */}
        <div className="border border-zinc-800 p-4">
          <h3 className="text-zinc-300 font-bold uppercase mb-4 border-b border-zinc-800 pb-1">
            Create Palette
          </h3>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="PALETTE NAME..."
              value={newPaletteName}
              onChange={(e) => setNewPaletteName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-[10px] outline-none focus:border-orange-500 uppercase"
            />
            
            <div className="space-y-2">
              {newPaletteColors.map((color, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1 h-8 border border-zinc-700 relative overflow-hidden">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer"
                    />
                  </div>
                  <span className="text-zinc-500 uppercase text-[9px] w-20">{color}</span>
                  {newPaletteColors.length > 1 && (
                    <button
                      onClick={() => handleRemoveColor(index)}
                      className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddColor}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 py-2 text-[9px] uppercase transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-3 h-3" />
                ADD COLOR
              </button>
              <button
                onClick={handleCreatePalette}
                disabled={!newPaletteName.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-black py-2 text-[9px] font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-3 h-3" />
                SAVE
              </button>
            </div>
          </div>
        </div>

        {/* Saved Palettes */}
        <div>
          <h3 className="text-zinc-300 font-bold uppercase mb-4 border-b border-zinc-800 pb-1">
            Saved Palettes ({palettes.length})
          </h3>
          
          {palettes.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-800">
              <Palette className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <div className="text-[9px] uppercase">NO PALETTES SAVED</div>
            </div>
          ) : (
            <div className="space-y-3">
              {palettes.map(palette => (
                <div
                  key={palette.id}
                  className={`border p-3 cursor-pointer transition-colors ${
                    selectedPalette?.id === palette.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                  onClick={() => handleSelectPalette(palette)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-zinc-300 font-bold uppercase text-[9px]">
                      {palette.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePalette(palette.id);
                      }}
                      className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {palette.colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1 h-8 border border-zinc-700"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandPaletteManager;

