/**
 * Export Presets Management
 * Save and load export configurations
 */

export interface ExportPresetConfig {
  id: string;
  name: string;
  type: 'image' | 'video';
  width: number;
  height: number;
  format?: string;
  quality?: number;
  fps?: number;
  duration?: number;
  codec?: string;
}

export const saveExportPreset = (preset: ExportPresetConfig): void => {
  try {
    const existing = localStorage.getItem('tmm_os_export_presets');
    const presets: ExportPresetConfig[] = existing ? JSON.parse(existing) : [];
    const index = presets.findIndex(p => p.id === preset.id);
    
    if (index >= 0) {
      presets[index] = preset;
    } else {
      presets.push(preset);
    }
    
    localStorage.setItem('tmm_os_export_presets', JSON.stringify(presets));
  } catch (e) {
    console.error('Failed to save export preset', e);
  }
};

export const loadExportPresets = (): ExportPresetConfig[] => {
  try {
    const existing = localStorage.getItem('tmm_os_export_presets');
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.error('Failed to load export presets', e);
    return [];
  }
};

export const deleteExportPreset = (id: string): void => {
  try {
    const existing = localStorage.getItem('tmm_os_export_presets');
    const presets: ExportPresetConfig[] = existing ? JSON.parse(existing) : [];
    const filtered = presets.filter(p => p.id !== id);
    localStorage.setItem('tmm_os_export_presets', JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete export preset', e);
  }
};

