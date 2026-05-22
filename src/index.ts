/**
 * TMM OS Visual Lab - Central Export Point
 * 
 * This file provides convenient re-exports for common imports
 * used throughout the application.
 */

// --- Types ---
export type {
  Machine,
  MachineDepartment,
  ControlDef,
  ControlType,
  SketchParams,
  SavedPreset,
  GeminiSuggestion,
  AudioData,
  GlobalSettings,
  GlobalState,
  GameOfLifeState,
  MouseState,
} from './types';

// --- Services ---
export {
  getParticlePool,
  setParticleCount,
  resetParticlePool,
  clearAllPools,
} from './services/particleManager';

export {
  analyzeBands,
  smoothAudio,
} from './services/audioAnalyzer';

export {
  initializeGrid,
  stepGeneration,
  seedGridCell,
} from './services/gameOfLife';

// --- Utils ---
export {
  noise,
  random,
  lerp,
  smoothstep,
} from './utils/math';

export {
  fillBackground,
  isGridAlive,
} from './utils/canvas';

// --- Hooks ---
export {
  useAudioAnalysis,
  useGameOfLife,
  useCanvasRecording,
} from './hooks';

// --- Machines ---
export {
  getMachine,
  getAllMachines,
  getMachinesByDepartment,
  getMachinesByDepartments,
} from './machines';
