/**
 * BACKWARD COMPATIBILITY BRIDGE
 * Re-export all type definitions from the new src/types folder.
 * This ensures legacy imports (e.g., import { Machine } from './types') continue to work.
 */

export * from './src/types';
