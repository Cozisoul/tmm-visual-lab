# Modular Refactoring Complete

## What Changed

The TMM OS Visual Lab has been refactored into a robust, modular architecture. All code is now organized by concern, making it easier to understand, test, and extend.

## New Structure

```
src/
├── types/           → Type definitions (machine, control, audio, settings, etc.)
├── services/        → Business logic (particles, audio, Game of Life)
├── hooks/           → Custom React hooks (useAudioAnalysis, useGameOfLife, etc.)
├── utils/           → Pure utility functions (math, canvas helpers)
├── machines/        → Visualization machines (to be split by department)
└── components/      → React UI components
```

## Key Improvements

### 1. Better Type Safety
- Types split into focused files by concern
- Clear interfaces for each module
- Type-only imports where appropriate

### 2. Reusable Services
- **particleManager**: Object pooling for efficient particle systems
- **audioAnalyzer**: Frequency band analysis with smoothing
- **gameOfLife**: Conway's Game of Life implementation

### 3. Custom Hooks
- **useAudioAnalysis**: Microphone input and frequency analysis
- **useGameOfLife**: Grid state management and stepping
- **useCanvasRecording**: Video recording from canvas

### 4. Utility Functions
- **math.ts**: Perlin noise, random, easing functions
- **canvas.ts**: Drawing helpers and GoL grid checking

### 5. Machine Registry
- Centralized machine registration and lookup
- Easy organization by department
- Simple queries (getMachine, getAllMachines, etc.)

## Migration Guide for Developers

### Importing Types
```typescript
// Old
import { Machine, GlobalState, AudioData } from './types';

// New (same location, but more organized)
import { Machine } from './src/types/machine';
import { GlobalState } from './src/types/gameOfLife';
import { AudioData } from './src/types/audio';

// Or use root re-export (backward compatible)
import { Machine, GlobalState } from './types';
```

### Using Services
```typescript
// Particle pooling
import { getParticlePool, setParticleCount } from './src/services/particleManager';
const pool = getParticlePool('machine-id', 100, (i) => ({ x: 0, y: 0 }));

// Audio analysis
import { analyzeBands, smoothAudio } from './src/services/audioAnalyzer';
const bands = analyzeBands(frequencyData, 0.85);

// Game of Life
import { initializeGrid, stepGeneration } from './src/services/gameOfLife';
const grid = initializeGrid(50, 50, 0.5);
```

### Using Hooks
```typescript
import { useAudioAnalysis, useGameOfLife, useCanvasRecording } from './src/hooks';

const { audioData, updateAudio } = useAudioAnalysis({ enabled: true, audioGain: 1.5 });
const { getGrid, stepGrid } = useGameOfLife({ cols: 50, rows: 50, speed: 100 });
const { startRecording, stopRecording } = useCanvasRecording({ canvasRef });
```

### Using Utilities
```typescript
import { noise, random, lerp } from './src/utils/math';
import { fillBackground, isGridAlive } from './src/utils/canvas';

const n = noise(x, y, z);
const r = random(seed);
fillBackground(ctx, width, height, color, globalState);
```

### Using Machine Registry
```typescript
import { getMachine, getAllMachines, getMachinesByDepartment } from './src/machines';

const machine = getMachine('flow-field');
const allMachines = getAllMachines();
const signalMachines = getMachinesByDepartment(MachineDepartment.SIGNAL);
```

## Next Steps

1. **Split machines.ts**: Organize machines by department (grid, typography, signal, image, masters)
2. **Update component imports**: Point to new service/hook locations
3. **Update App.tsx imports**: Use new machine registry
4. **Test thoroughly**: Ensure all machines work as expected

## Benefits

✓ **Scalability**: Add new machines without cluttering a single file
✓ **Maintainability**: Clear separation of concerns
✓ **Reusability**: Services and hooks can be used across machines
✓ **Testability**: Each module can be tested independently
✓ **Performance**: Object pooling, audio smoothing, efficient Grid stepping
✓ **Type Safety**: Comprehensive TypeScript interfaces

## Files to Update Next

- `src/App.tsx` - Update imports
- `components/CanvasStage.tsx` - Refactor to use new hooks
- `components/ControlRack.tsx` - Verify imports
- `sketches/machines.ts` - Split into department files

See ARCHITECTURE.md for detailed documentation.
