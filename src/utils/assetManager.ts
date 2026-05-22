/**
 * Asset Management Utilities
 * Integration with TMM-OS Asset Management System (Doc 05)
 */

export interface AssetMetadata {
  id: string;
  name: string;
  machineId: string;
  presetId?: string;
  tags: string[];
  category: 'visual' | 'animation' | 'still' | 'experimental';
  projectId?: string;
  createdAt: number;
  exportedAt?: number;
  resolution: { width: number; height: number };
  params: Record<string, any>;
  thumbnail?: string; // Base64 or URL
}

export interface BrandPalette {
  id: string;
  name: string;
  colors: string[];
  description?: string;
}

/**
 * Save asset metadata to localStorage (can be extended to sync with TMM-OS DB)
 */
export const saveAssetMetadata = (asset: AssetMetadata): void => {
  try {
    const existing = localStorage.getItem('tmm_os_assets');
    const assets: AssetMetadata[] = existing ? JSON.parse(existing) : [];
    assets.push(asset);
    localStorage.setItem('tmm_os_assets', JSON.stringify(assets));
  } catch (e) {
    console.error('Failed to save asset metadata', e);
  }
};

/**
 * Load all assets from storage
 */
export const loadAssets = (): AssetMetadata[] => {
  try {
    const existing = localStorage.getItem('tmm_os_assets');
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.error('Failed to load assets', e);
    return [];
  }
};

/**
 * Filter assets by category or tags
 */
export const filterAssets = (
  assets: AssetMetadata[],
  filters: {
    category?: string;
    tags?: string[];
    machineId?: string;
  }
): AssetMetadata[] => {
  return assets.filter(asset => {
    if (filters.category && asset.category !== filters.category) return false;
    if (filters.machineId && asset.machineId !== filters.machineId) return false;
    if (filters.tags && filters.tags.length > 0) {
      return filters.tags.some(tag => asset.tags.includes(tag));
    }
    return true;
  });
};

/**
 * Generate thumbnail from canvas
 */
export const generateThumbnail = (
  canvas: HTMLCanvasElement,
  maxSize: number = 200
): string => {
  const thumbCanvas = document.createElement('canvas');
  const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height);
  thumbCanvas.width = canvas.width * scale;
  thumbCanvas.height = canvas.height * scale;
  
  const ctx = thumbCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    return thumbCanvas.toDataURL('image/jpeg', 0.8);
  }
  return '';
};

/**
 * Brand palette management (TMM-OS Doc 04: Brand Identity)
 */
export const saveBrandPalette = (palette: BrandPalette): void => {
  try {
    const existing = localStorage.getItem('tmm_os_brand_palettes');
    const palettes: BrandPalette[] = existing ? JSON.parse(existing) : [];
    const index = palettes.findIndex(p => p.id === palette.id);
    if (index >= 0) {
      palettes[index] = palette;
    } else {
      palettes.push(palette);
    }
    localStorage.setItem('tmm_os_brand_palettes', JSON.stringify(palettes));
  } catch (e) {
    console.error('Failed to save brand palette', e);
  }
};

export const loadBrandPalettes = (): BrandPalette[] => {
  try {
    const existing = localStorage.getItem('tmm_os_brand_palettes');
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    return [];
  }
};

