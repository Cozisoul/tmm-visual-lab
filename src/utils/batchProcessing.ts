/**
 * Batch Processing Utilities
 * Generate multiple variations automatically
 */

import { SketchParams } from '../types';
import { ControlDef } from '../types/control';

export interface VariationConfig {
  paramId: string;
  min: number;
  max: number;
  steps: number;
}

export interface BatchOptions {
  variations: VariationConfig[];
  gridCols?: number;
  gridRows?: number;
  exportIndividual?: boolean;
}

export const generateVariations = (
  baseParams: SketchParams,
  controls: ControlDef[],
  options: BatchOptions
): SketchParams[] => {
  const variations: SketchParams[] = [];
  const { variations: configs, gridCols = 3, gridRows = 3 } = options;

  // Generate all combinations
  const generateCombinations = (configs: VariationConfig[], index: number = 0, current: SketchParams = { ...baseParams }): void => {
    if (index >= configs.length) {
      variations.push({ ...current });
      return;
    }

    const config = configs[index];
    const step = (config.max - config.min) / (config.steps - 1);

    for (let i = 0; i < config.steps; i++) {
      const value = config.min + (step * i);
      current[config.paramId] = value;
      generateCombinations(configs, index + 1, current);
    }
  };

  generateCombinations(configs);

  // Limit to grid size if specified
  if (gridCols && gridRows) {
    const maxVariations = gridCols * gridRows;
    if (variations.length > maxVariations) {
      // Sample evenly
      const step = variations.length / maxVariations;
      const sampled: SketchParams[] = [];
      for (let i = 0; i < maxVariations; i++) {
        sampled.push(variations[Math.floor(i * step)]);
      }
      return sampled;
    }
  }

  return variations;
};

export const createVariationGrid = async (
  canvas: HTMLCanvasElement,
  variations: SketchParams[],
  gridCols: number,
  gridRows: number,
  drawFunction: (params: SketchParams) => Promise<void>
): Promise<HTMLCanvasElement> => {
  const cellWidth = canvas.width / gridCols;
  const cellHeight = canvas.height / gridRows;
  const gridCanvas = document.createElement('canvas');
  gridCanvas.width = canvas.width;
  gridCanvas.height = canvas.height;
  const gridCtx = gridCanvas.getContext('2d');

  if (!gridCtx) throw new Error('Could not get 2D context');

  gridCtx.fillStyle = '#000000';
  gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);

  for (let i = 0; i < variations.length && i < gridCols * gridRows; i++) {
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);

    // Draw variation
    await drawFunction(variations[i]);

    // Copy to grid
    gridCtx.drawImage(
      canvas,
      col * cellWidth,
      row * cellHeight,
      cellWidth,
      cellHeight
    );
  }

  return gridCanvas;
};

export const exportVariationGrid = (gridCanvas: HTMLCanvasElement, filename: string) => {
  gridCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
};

