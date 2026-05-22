import type { ControlDef, SketchParams } from './control';
import type { GlobalState } from './gameOfLife';
import type { GlobalSettings } from './settings';

export enum MachineDepartment {
  GRID = 'A: GRID & LAYOUT',
  TYPE = 'B: TYPOGRAPHY & LANGUAGE',
  SIGNAL = 'C: SIGNAL & DATA',
  IMAGE = 'D: IMAGE & TEXTURE',
  MASTERS = 'E: THE MASTERS ARCHIVE',
}

// Re-export types from their source
export type { SketchParams } from './control';
export type { GlobalState } from './gameOfLife';
export type { GlobalSettings } from './settings';

export interface Machine {
  id: string;
  name: string;
  department: MachineDepartment;
  description: string;
  controls: ControlDef[];
  // The setup function initializes state if needed
  setup?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  // The draw function renders a frame
  draw: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: SketchParams,
    time: number,
    globalState?: GlobalState
  ) => void;
}
