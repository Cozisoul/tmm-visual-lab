import { AudioData } from './audio';
import { GlobalSettings } from './settings';

export interface GameOfLifeState {
  grid: number[][]; // 0 or 1
  cols: number;
  rows: number;
  enabled: boolean;
}

export interface MouseState {
  x: number;
  y: number;
  isPressed: boolean;
}

export interface GlobalState {
  audio?: AudioData;
  gameOfLife?: boolean[][] | number[][]; // Can be simple grid
  golEnabled?: boolean; // [NEW] Explicit enabled flag
  mouse?: MouseState;
  settings?: GlobalSettings;
  time?: number;
  resolution?: { width: number; height: number };
}
