/**
 * GameOfLife: Conway's Game of Life implementation
 */

export interface GameOfLifeConfig {
  cols: number;
  rows: number;
  initialDensity: number;
}

/**
 * Initialize Game of Life grid
 */
export const initializeGrid = (cols: number, rows: number, density: number = 0.5): number[][] => {
  const grid: number[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: number[] = [];
    for (let x = 0; x < cols; x++) {
      row.push(Math.random() < density ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
};

/**
 * Count living neighbors
 */
const countNeighbors = (grid: number[][], x: number, y: number): number => {
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const ny = (y + dy + rows) % rows;
      const nx = (x + dx + cols) % cols;
      count += grid[ny][nx];
    }
  }

  return count;
};

/**
 * Step forward one generation
 */
export const stepGeneration = (grid: number[][]): number[][] => {
  const rows = grid.length;
  const cols = grid[0].length;
  const newGrid: number[][] = [];

  for (let y = 0; y < rows; y++) {
    const row: number[] = [];
    for (let x = 0; x < cols; x++) {
      const neighbors = countNeighbors(grid, x, y);
      const alive = grid[y][x] === 1;

      let newState = 0;
      if (alive && (neighbors === 2 || neighbors === 3)) {
        newState = 1;
      } else if (!alive && neighbors === 3) {
        newState = 1;
      }

      row.push(newState);
    }
    newGrid.push(row);
  }

  return newGrid;
};

/**
 * Seed grid at specific coordinates
 */
export const seedGridCell = (grid: number[][], x: number, y: number, state: number): void => {
  if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
    grid[y][x] = state;
  }
};
