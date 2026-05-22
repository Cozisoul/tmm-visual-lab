/**
 * useGameOfLife: Manage Game of Life state and generation stepping
 */

import { useRef, useEffect } from 'react';
import { initializeGrid, stepGeneration } from '../services/gameOfLife';

interface UseGameOfLifeProps {
  cols: number;
  rows: number;
  initialDensity: number;
  speed: number; // milliseconds between steps
}

export const useGameOfLife = ({ cols, rows, initialDensity, speed }: UseGameOfLifeProps) => {
  const gridRef = useRef<number[][]>(initializeGrid(cols, rows, initialDensity));
  const lastUpdateRef = useRef<number>(Date.now());
  const configRef = useRef({ cols, rows, initialDensity });

  // Reinitialize when grid dimensions or density change
  useEffect(() => {
    const config = configRef.current;
    // Only reinitialize if dimensions or density actually changed
    if (config.cols !== cols || config.rows !== rows || config.initialDensity !== initialDensity) {
      gridRef.current = initializeGrid(cols, rows, initialDensity);
      lastUpdateRef.current = Date.now();
      configRef.current = { cols, rows, initialDensity };
    }
  }, [cols, rows, initialDensity]);

  const stepGrid = (currentTime: number) => {
    const timeSinceLastUpdate = currentTime - lastUpdateRef.current;

    if (timeSinceLastUpdate >= speed) {
      const currentGrid = gridRef.current;
      // Safety check: ensure grid is valid before stepping
      if (currentGrid && currentGrid.length > 0 && currentGrid[0] && currentGrid[0].length > 0) {
        gridRef.current = stepGeneration(currentGrid);
        lastUpdateRef.current = currentTime;
      }
    }
  };

  const getGrid = () => gridRef.current;

  const resetGrid = () => {
    // Use current config values from ref (which are kept in sync by useEffect)
    const config = configRef.current;
    gridRef.current = initializeGrid(config.cols, config.rows, config.initialDensity);
    lastUpdateRef.current = Date.now();
  };

  return { getGrid, stepGrid, resetGrid };
};
