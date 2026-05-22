/**
 * AudioAnalyzer: Analyzes audio frequency data into bass/mid/treble bands
 */

export interface AudioBands {
  bass: number;
  mid: number;
  treble: number;
  volume: number;
}

/**
 * Analyze frequency data into bands
 */
export const analyzeBands = (
  frequencyData: Uint8Array,
  smoothing: number = 0.85
): AudioBands => {
  const length = frequencyData.length;

  // Enhanced frequency splits for better sensitivity
  const bassEnd = Math.floor(length * 0.15);  // 0-15% = bass (strong low-end)
  const midEnd = Math.floor(length * 0.60);   // 15-60% = mid-range
  // Treble is 60%+ (remaining high frequencies)

  let bassSum = 0,
    midSum = 0,
    trebleSum = 0;

  // Calculate band sums
  for (let i = 0; i < bassEnd; i++) bassSum += frequencyData[i];
  for (let i = bassEnd; i < midEnd; i++) midSum += frequencyData[i];
  for (let i = midEnd; i < length; i++) trebleSum += frequencyData[i];

  // ZERO_THRESHOLD: Clamp to 0 below this to stop motion when quiet
  const ZERO_THRESHOLD = 0.02;

  // Apply strong multipliers for high sensitivity
  let bass = (bassSum / (bassEnd * 255)) * 3.5;            // 3.5x for dramatic bass hits
  let mid = (midSum / ((midEnd - bassEnd) * 255)) * 1.8;   // 1.8x for strong mid response
  let treble = (trebleSum / ((length - midEnd) * 255)) * 3.0; // 3x for sparkly treble

  const volume = (bassSum + midSum + trebleSum) / (length * 255);

  // Clamp to zero when very quiet to prevent drift
  bass = bass < ZERO_THRESHOLD ? 0 : Math.min(1, bass);
  mid = mid < ZERO_THRESHOLD ? 0 : Math.min(1, mid);
  treble = treble < ZERO_THRESHOLD ? 0 : Math.min(1, treble);
  const clampedVolume = volume < ZERO_THRESHOLD ? 0 : Math.min(1, volume);

  return {
    bass,
    mid,
    treble,
    volume: clampedVolume,
  };
};

/**
 * Apply exponential smoothing to audio values
 */
export const smoothAudio = (
  current: number,
  previous: number,
  smoothing: number
): number => {
  return current * (1 - smoothing) + previous * smoothing;
};
