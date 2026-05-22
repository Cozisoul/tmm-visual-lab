import { SketchParams } from './control';

export interface SavedPreset {
  id: string;
  name: string;
  machineId: string;
  params: SketchParams;
  timestamp: number;
}

export interface GeminiSuggestion {
  rationale: string;
  params: SketchParams;
}
