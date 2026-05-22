/**
 * Parameter transformation utilities with DEEP AUDIO INTEGRATION
 * ============================================================
 * 
 * This system transforms control parameters based on real-time audio data.
 * Instead of shallow "trigger" effects, audio fundamentally CHANGES the
 * visual behavior through parameter modulation.
 * 
 * AUDIO FREQUENCY MAPPING:
 * - BASS (0-250 Hz): Controls SIZE/EXPANSION
 *   * Low frequency = structural expansion, larger scales
 *   * Affects: size, scale, radius, max values, distortion
 *   * Range: 0.5x to 3.0x multiplier based on bass energy
 * 
 * - MID-RANGE (250-2000 Hz): Controls SPEED/ANIMATION
 *   * Mid frequency = where musical energy lives
 *   * Affects: speed, velocity, flow rate, animation timing
 *   * Range: 0.3x to 2.3x multiplier with beat pulse
 * 
 * - TREBLE (2000+ Hz): Controls ROTATION/COMPLEXITY
 *   * High frequency = detail and sparkle
 *   * Affects: rotation, angles, fine details
 *   * Range: 1.0x to 4.0x multiplier for responsiveness
 * 
 * - VOLUME (Overall): Controls OPACITY/INTENSITY
 *   * Louder music = more opaque/visible
 *   * Affects: opacity, alpha, visibility
 *   * Range: 0.3x to 1.0x opacity mapping
 * 
 * INTEGRATION PIPELINE:
 * 1. User sets control sliders (e.g., "Scale: 50")
 * 2. Global multipliers applied (size/speed control)
 * 3. AUDIO MODULATION applied (bass/mid/treble change parameters)
 * 4. GoL overrides applied (if GoL mode enabled)
 * 5. Final modulated parameters sent to sketch draw()
 * 
 * RESULT: Every sketch element is a musical instrument.
 * Audio doesn't just trigger effects - it PLAYS the parameters.
 */

import { SketchParams, GlobalSettings, GlobalState } from '../types';

/**
 * Keywords that indicate size-related parameters
 */
const SIZE_KEYWORDS = ['size', 'scale', 'radius', 'width', 'height', 'gap', 'min', 'max', 'spacing', 'padding', 'length', 'thickness'];

/**
 * Keywords that indicate speed-related parameters
 */
const SPEED_KEYWORDS = ['speed', 'anim', 'velocity', 'flow', 'rate', 'frequency', 'period', 'duration', 'delay'];

/**
 * Keywords that indicate rotation/angle parameters
 */
const ROTATION_KEYWORDS = ['angle', 'rotation', 'rotate', 'turn'];

/**
 * Keywords that indicate opacity/alpha parameters
 */
const OPACITY_KEYWORDS = ['alpha', 'opacity', 'transparency', 'bright'];

/**
 * Keywords that indicate color/saturation parameters
 */
const COLOR_KEYWORDS = ['hue', 'saturation', 'saturation', 'bright', 'contrast'];

/**
 * Keywords that indicate random/noise parameters
 */
const RANDOM_KEYWORDS = ['random', 'noise', 'jitter', 'chaos', 'entropy', 'scatter'];

/**
 * Apply global multipliers to parameters based on their names
 */
export const applyGlobalMultipliers = (
  params: SketchParams,
  settings: GlobalSettings
): SketchParams => {
  const sizeMul = settings.sizeMultiplier || 1;
  const speedMul = settings.speedMultiplier || 1;
  const result: SketchParams = {};

  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (typeof value === 'number') {
      const name = key.toLowerCase();
      if (SIZE_KEYWORDS.some(kw => name.includes(kw))) {
        result[key] = value * sizeMul;
      } else if (SPEED_KEYWORDS.some(kw => name.includes(kw))) {
        result[key] = value * speedMul;
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  });

  return result;
};

/**
 * AUDIO-DRIVEN parameter modulation - DEEP integration
 * Dramatically changes control parameters based on real-time audio
 */
export const applyAudioParameterModulation = (
  params: SketchParams,
  globalState?: GlobalState
): SketchParams => {
  if (!globalState?.audio) return params;

  const audio = globalState.audio;
  const result: SketchParams = {};

  // Audio triggers
  const volume = Math.max(0, Math.min(1, audio.volume || 0));
  const bass = Math.max(0, Math.min(1, audio.bass || 0));
  const mid = Math.max(0, Math.min(1, audio.mid || 0));
  const treble = Math.max(0, Math.min(1, audio.treble || 0));
  const beat = bass > 0.65;
  const pulse = volume > 0.55;

  Object.keys(params).forEach((key) => {
    const value = params[key];
    const name = key.toLowerCase();

    if (typeof value !== 'number') {
      result[key] = value;
      return;
    }

    // 1. SIZE MODULATION (Bass)
    if (SIZE_KEYWORDS.some(kw => name.includes(kw))) {
      // Bass makes things BIGGER: 1.0 (silence) -> 1.5x (loud bass)
      // Reduced from 3.0 to 0.5 to prevent "zooming in" issue
      const bassFactor = 1.0 + (bass * 0.5); 
      const volumeFactor = 1.0 + (volume * 0.2);
      result[key] = value * bassFactor * volumeFactor;
    }

    // 2. SPEED/TIME MODULATION (Mid/Volume)
    // Speed increases with volume
    else if (SPEED_KEYWORDS.some(kw => name.includes(kw))) {
      // 1.0 -> 5.0x speed
      const speedFactor = 1.0 + (mid * 4.0) + (volume * 2.0);
      result[key] = value * speedFactor;
    }

    // 3. RANDOM/NOISE MODULATION (Treble)
    else if (RANDOM_KEYWORDS.some(kw => name.includes(kw))) {
      // Jitter becomes very active with treble
      const trebleFactor = 1.0 + (treble * 5.0);
      result[key] = value * trebleFactor;
    }

    // 4. ROTATION (Mid)
    else if (ROTATION_KEYWORDS.some(kw => name.includes(kw))) {
       // Add offset rotation based on volume
       const rotationAdd = volume * Math.PI; 
       result[key] = value + rotationAdd;
    }
    // OVERALL VOLUME drives OPACITY - fades in/out with loudness
    else if (OPACITY_KEYWORDS.some(kw => name.includes(kw))) {
      // Brighter with louder music
      const volumeFactor = 0.3 + volume * 0.7; // 0.3 to 1.0 opacity range
      result[key] = value * volumeFactor;
    }
    // Everything else gets modulated by overall volume for life
    else {
      const volumeFactor = 0.6 + volume * 1.0; // 0.6 to 1.6
      result[key] = value * volumeFactor;
    }
  });

  return result;
};

/**
 * Apply Game of Life mode overrides
 * Freezes animation parameters but keeps size-related controls
 */
export const applyGoLModeOverrides = (params: SketchParams): SketchParams => {
  const result: SketchParams = {};

  Object.keys(params).forEach((key) => {
    const value = params[key];
    const name = key.toLowerCase();
    
    // Keep GoL-related and threshold/density/speed params
    if (name.includes('gol') || name.includes('life') || name.includes('threshold') || 
        name.includes('density') || name.includes('speed')) {
      result[key] = value;
    } else if (typeof value === 'number') {
      // Keep size-related params, freeze speed-related
      if (SIZE_KEYWORDS.some(kw => name.includes(kw))) {
        result[key] = value;
      } else if (SPEED_KEYWORDS.some(kw => name.includes(kw))) {
        result[key] = 0; // Freeze animations
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  });

  return result;
};

/**
 * Apply audio-only mode overrides
 * Modulates all parameters by audio level
 */
export const applyAudioOnlyOverrides = (
  params: SketchParams,
  audioVolume: number,
  triggerThreshold: number
): SketchParams => {
  const audioFactor = Math.max(audioVolume, 0.0001);
  const result: SketchParams = {};

  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (typeof value === 'number') {
      // Modulate by audio (range: 0.2 to 2.0)
      result[key] = value * (0.2 + audioFactor * 1.8);
    } else if (typeof value === 'boolean') {
      // Toggle based on audio threshold
      result[key] = audioVolume > triggerThreshold;
    } else {
      result[key] = value;
    }
  });

  return result;
};

/**
 * Combined parameter processing with audio integration
 * Applies: global multipliers → audio modulation → GoL overrides
 */
export const processParametersWithAudio = (
  params: SketchParams,
  settings: GlobalSettings,
  globalState?: GlobalState,
  isGoLActive?: boolean
): SketchParams => {
  // Step 1: Apply global multipliers (size/speed control)
  let processed = applyGlobalMultipliers(params, settings);

  // Step 2: Apply deep audio parameter modulation if audio is active
  if (globalState?.audio) {
    processed = applyAudioParameterModulation(processed, globalState);
  }

  // Step 3: Apply GoL overrides if GoL is active
  if (isGoLActive) {
    processed = applyGoLModeOverrides(processed);
  }

  return processed;
};

/**
 * Calculate time value based on mode and audio
 */
export const calculateTimeValue = (
  baseTime: number,
  settings: GlobalSettings,
  audioVolume: number,
  isAudioActive: boolean,
  isGoLActive: boolean
): number => {
  // GoL mode: freeze time
  if (isGoLActive) {
    return 0;
  }

  // Audio-only mode: drive time by audio
  if (settings.audioOnly && isAudioActive) {
    const audioFactor = Math.max(audioVolume, 0.0001);
    return (audioFactor * 5000) * (settings.speedMultiplier || 1);
  }

  // Normal mode: apply speed multiplier
  return baseTime * (settings.speedMultiplier || 1);
};

/**
 * Compute audio-derived modulation metrics for debugging / visualization.
 * Mirrors the logic inside `applyAudioParameterModulation` so we can show
 * how audio affects size/speed/treble/opacity in the UI.
 */
export const getAudioMetrics = (audio: { volume?: number; bass?: number; mid?: number; treble?: number } | undefined) => {
  const volume = Math.max(0, Math.min(1, audio?.volume || 0));
  const bass = Math.max(0, Math.min(1, audio?.bass || 0));
  const mid = Math.max(0, Math.min(1, audio?.mid || 0));
  const treble = Math.max(0, Math.min(1, audio?.treble || 0));

  return {
    volume,
    bass,
    mid,
    treble,
    bassFactor: 1.0 + (bass * 0.5),
    speedFactor: 1.0 + (mid * 4.0) + (volume * 2.0),
    trebleFactor: 1.0 + (treble * 5.0),
    opacityFactor: 0.3 + volume * 0.7,
    beat: bass > 0.65,
    pulse: volume > 0.55
  };
};

