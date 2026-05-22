export interface AudioData {
  volume: number; // 0 to 1
  bass: number; // 0 to 1
  mid: number; // 0 to 1
  treble: number; // 0 to 1
  raw: Uint8Array;
  fft: Uint8Array;
}
