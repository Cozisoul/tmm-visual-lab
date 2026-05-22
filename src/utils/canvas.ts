/**
 * Canvas utilities: Background filling, grid state checking
 */

import { GlobalState } from '../types/gameOfLife';

/**
 * Fill background or clear canvas based on settings
 */
export const fillBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  globalState?: GlobalState
): void => {
  if (globalState?.settings.transparent) {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }
};

/**
 * Check if a position is alive in Game of Life grid
 */
export const isGridAlive = (
  x: number,
  y: number,
  w: number,
  h: number,
  globalState?: GlobalState
): boolean => {
  if (!globalState || !globalState.gameOfLife) return false;
  if (globalState.golEnabled === false) return false; // [NEW] Respect enabled flag
  
  // GoL Threshold check (if active)
  if (globalState.settings && Math.random() > (1 - globalState.settings.golThreshold)) return false;

  const grid = globalState.gameOfLife;
  // Check if grid is valid array
  if (!Array.isArray(grid) || grid.length === 0) return false;

  const rows = grid.length;
  const cols = grid[0].length;

  const gx = Math.floor((x / w) * cols);
  const gy = Math.floor((y / h) * rows);

  if (gy < 0 || gy >= rows || gx < 0 || gx >= cols) {
    return false;
  }

  // Handle boolean[][] or number[][]
  const cell = grid[gy][gx];
  if (typeof cell === 'number') return cell === 1;
  return cell === true;
};

/**
 * Draw film grain overlay
 */
export const drawGrain = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
  color: string = '#ffffff'
): void => {
  if (amount <= 0) return;
  const density = 0.001 * amount;
  const count = width * height * density;
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const s = Math.random() * 2;
    ctx.globalAlpha = Math.random() * 0.5;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1.0;
};
