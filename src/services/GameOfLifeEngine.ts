
import { random } from '../utils/math';

export class GameOfLifeEngine {
  public grid: boolean[][] = [];
  public cols: number = 50;
  public rows: number = 50;
  private buffer: boolean[][] = [];
  private density: number = 0.5;

  constructor(cols: number = 50, rows: number = 50, density: number = 0.5) {
    this.resize(cols, rows, density);
  }

  public resize(cols: number, rows: number, density: number = 0.5): void {
    this.cols = cols;
    this.rows = rows;
    this.density = density;
    this.grid = [];
    this.buffer = [];

    for (let y = 0; y < rows; y++) {
      const row: boolean[] = [];
      const bufRow: boolean[] = [];
      for (let x = 0; x < cols; x++) {
        const alive = Math.random() < density;
        row.push(alive);
        bufRow.push(false);
      }
      this.grid.push(row);
      this.buffer.push(bufRow);
    }
  }

  public step(): void {
    // Standard GoL Rules
    // 1. < 2 neighbors -> die
    // 2. 2-3 neighbors -> live
    // 3. > 3 neighbors -> die
    // 4. dead + 3 neighbors -> born

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const neighbors = this.countNeighbors(x, y);
        const alive = this.grid[y][x];

        if (alive) {
            this.buffer[y][x] = (neighbors === 2 || neighbors === 3);
        } else {
            this.buffer[y][x] = (neighbors === 3);
        }
      }
    }

    // Swap
    const temp = this.grid;
    this.grid = this.buffer;
    this.buffer = temp;
  }

  private countNeighbors(x: number, y: number): number {
    let count = 0;
    const dirs = [-1, 0, 1];
    
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (dirs[i] === 0 && dirs[j] === 0) continue;
            
            const nx = (x + dirs[j] + this.cols) % this.cols;
            const ny = (y + dirs[i] + this.rows) % this.rows;
            
            if (this.grid[ny][nx]) count++;
        }
    }
    return count;
  }

  public randomize(): void {
    for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
            this.grid[y][x] = Math.random() < this.density;
        }
    }
  }

  public getGrid(): boolean[][] {
    return this.grid;
  }
}
