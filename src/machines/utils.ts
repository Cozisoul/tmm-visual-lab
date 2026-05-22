/**
 * Machine Utilities: Shared drawing functions and helpers
 */

import { GlobalState, SketchParams } from '../types';
import { fillBackground, isGridAlive } from '../utils/canvas';

/**
 * Re-export common utilities
 */
export { fillBackground, isGridAlive };

/**
 * Apply global size multiplier to a size value
 */
export const applySizeMultiplier = (size: number, globalState?: GlobalState): number => {
  if (!globalState?.settings.sizeMultiplier) return size;
  return size * globalState.settings.sizeMultiplier;
};

/**
 * Apply global speed multiplier to a speed value
 */
export const applySpeedMultiplier = (speed: number, globalState?: GlobalState): number => {
  if (!globalState?.settings.speedMultiplier) return speed;
  return speed * globalState.settings.speedMultiplier;
};

/**
 * Check if audio should trigger animation
 */
export const isAudioTriggerActive = (audioVolume: number, globalState?: GlobalState): boolean => {
  if (!globalState?.settings.audioTriggerThreshold) return audioVolume > 0;
  return audioVolume > globalState.settings.audioTriggerThreshold;
};
