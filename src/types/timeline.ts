/**
 * Animation Timeline Types
 */

export interface Keyframe {
  id: string;
  time: number; // milliseconds
  value: number;
  easing?: EasingType;
}

export type EasingType = 
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic';

export interface ParameterTrack {
  paramId: string;
  keyframes: Keyframe[];
  enabled: boolean;
}

export interface TimelineState {
  duration: number; // milliseconds
  tracks: ParameterTrack[];
  currentTime: number;
  isPlaying: boolean;
  loop: boolean;
}

export interface EasingFunction {
  (t: number): number;
}

export const easingFunctions: Record<EasingType, EasingFunction> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  bounce: (t) => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
  },
  elastic: (t) => {
    return t === 0 || t === 1 ? t : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
  },
};

