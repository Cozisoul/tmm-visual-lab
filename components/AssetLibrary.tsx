/**
 * Asset Library Panel
 * Integration with TMM-OS Asset Management System (Doc 05)
 */

import React, { useState, useEffect } from 'react';
import { FolderOpen, Tag, Filter, Search, Download, Trash2, Image as ImageIcon, Film, Layers } from 'lucide-react';
import { AssetMetadata, loadAssets, filterAssets, saveAssetMetadata, generateThumbnail } from '../src/utils/assetManager';

interface AssetLibraryProps {
  canvas: HTMLCanvasElement | null;
  currentMachineId: string;
  currentParams: Record<string, any>;
  currentResolution: { width: number; height: number };
}

const AssetLibrary: React.FC<AssetLibraryProps> = ({
  canvas,
  currentMachineId,
  currentParams,
  currentResolution,
}) => {
  const [assets, setAssets] = useState<AssetMetadata[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    setAssets(loadAssets());
  }, []);

  useEffect(() => {
    let filtered = assets;
    
    if (selectedCategory !== 'all') {
      filtered = filterAssets(filtered, { category: selectedCategory });
    }
    
    if (selectedTags.length > 0) {
      filtered = filterAssets(filtered, { tags: selectedTags });
    }
    
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.machineId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredAssets(filtered);
  }, [assets, selectedCategory, selectedTags, searchQuery]);

  const handleSaveAsset = () => {
    if (!canvas) return;
    
    const name = prompt('Asset Name:');
    if (!name) return;
    
    const tagsInput = prompt('Tags (comma-separated):');
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];
    
    const category = prompt('Category (visual/animation/still/experimental):') as AssetMetadata['category'] || 'visual';
    
    const thumbnail = generateThumbnail(canvas);
    
    const asset: AssetMetadata = {
      id: crypto.randomUUID(),
      name,
      machineId: currentMachineId,
      tags,
      category,
      createdAt: Date.now(),
      resolution: currentResolution,
      params: currentParams,
      thumbnail,
    };
    
    saveAssetMetadata(asset);
    setAssets([...assets, asset]);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm('Delete this asset?')) {
      const updated = assets.filter(a => a.id !== id);
      localStorage.setItem('tmm_os_assets', JSON.stringify(updated));
      setAssets(updated);
    }
  };

  const allTags = Array.from(new Set(assets.flatMap(a => a.tags)));

  return (
    <div className="h-full flex flex-col font-mono text-[10px] bg-[#0a0a0a]">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="text-zinc-600 uppercase tracking-widest mb-1">Asset Library</div>
        <div className="text-orange-500 text-lg font-bold leading-none tracking-tight uppercase">
          TMM-OS Archive
        </div>
      </div>

      <div className="p-3 border-b border-zinc-800 shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
          <input
            type="text"
            placeholder="SEARCH ASSETS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white pl-8 pr-3 py-1.5 text-[10px] uppercase font-bold focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 text-zinc-300 py-1.5 px-2 text-[9px] outline-none focus:border-orange-500 uppercase"
          >
            <option value="all">ALL</option>
            <option value="visual">VISUAL</option>
            <option value="animation">ANIMATION</option>
            <option value="still">STILL</option>
            <option value="experimental">EXPERIMENTAL</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-zinc-400 text-[9px] uppercase">
            {filteredAssets.length} ASSETS
          </span>
          <button
            onClick={handleSaveAsset}
            className="bg-orange-500 hover:bg-orange-600 text-black px-3 py-1.5 text-[9px] font-bold uppercase transition-colors flex items-center gap-2"
          >
            <Download className="w-3 h-3" />
            SAVE CURRENT
          </button>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 border border-dashed border-zinc-800">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-[9px] uppercase">NO ASSETS FOUND</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAssets.map(asset => (
              <div
                key={asset.id}
                className="bg-zinc-900 border border-zinc-800 p-2 hover:border-zinc-600 transition-colors group"
              >
                {asset.thumbnail && (
                  <div className="aspect-square bg-zinc-950 mb-2 overflow-hidden">
                    <img
                      src={asset.thumbnail}
                      alt={asset.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="text-[9px] text-zinc-300 font-bold uppercase truncate mb-1">
                  {asset.name}
                </div>
                <div className="text-[8px] text-zinc-600 mb-2">
                  {asset.machineId} • {asset.resolution.width}×{asset.resolution.height}
                </div>
                {asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {asset.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="text-[7px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="flex-1 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 py-1 text-[8px] uppercase transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetLibrary;

