export interface GlobalSettings {
  // Audio
  audioGain: number; // 0.1 to 5.0
  audioSmooth: number; // 0.0 to 0.99
  // When true, module animations and controls are driven only by audio
  audioOnly?: boolean;
  // Global multipliers
  sizeMultiplier: number; // multiply element sizes
  speedMultiplier: number; // multiply animation speeds
  // Volume threshold required to trigger audio-driven animation (0..1)
  audioTriggerThreshold?: number;
  // Hold animation briefly after audio dips (ms)
  audioHold?: number;
  // Game of Life
  golSpeed: number; // 10 to 1000ms
  golDensity: number; // 0.1 to 0.9
  golThreshold: number; // 0.1 to 0.9
  golCols?: number; // GoL grid width (cells)
  golRows?: number; // GoL grid height (cells)
  // System
  transparent: boolean; // Export mode
  cameraId: string; // Webcam Device ID
}
