# TMM OS Visual Lab - Modular Architecture

## Overview

The TMM OS Visual Lab has been refactored into a robust, modular architecture emphasizing separation of concerns, scalability, and maintainability.

## Directory Structure

```
src/
├── components/          # React UI components
│   ├── CanvasStage.tsx  # Canvas rendering and animation loop
│   └── ControlRack.tsx  # Parameter controls and UI
├── hooks/               # Custom React hooks
│   ├── useAudioAnalysis.ts      # Microphone input and frequency analysis
│   ├── useGameOfLife.ts         # Game of Life state management
│   ├── useCanvasRecording.ts    # Video recording functionality
│   └── index.ts
├── services/            # Business logic and algorithms
│   ├── particleManager.ts       # Object pool management for particles
│   ├── audioAnalyzer.ts         # Audio frequency band analysis
│   ├── gameOfLife.ts            # Conway's Game of Life implementation
│   └── index.ts
├── utils/               # Utility functions
│   ├── math.ts          # Noise, random, easing functions
│   ├── canvas.ts        # Canvas drawing helpers
│   └── index.ts
├── machines/            # Visualization machines (organized by department)
│   ├── registry.ts      # Machine registration and lookup
│   ├── utils.ts         # Machine-specific utilities
│   ├── grid/            # Department A: Grid & Layout
│   ├── typography/      # Department B: Typography & Language
│   ├── signal/          # Department C: Signal & Data
│   ├── image/           # Department D: Image & Texture
│   ├── masters/         # Department E: The Masters Archive
│   └── index.ts
├── types/               # TypeScript definitions
│   ├── index.ts         # Central exports
│   ├── machine.ts       # Machine interface and enums
│   ├── control.ts       # Control and parameter definitions
│   ├── audio.ts         # Audio data structures
│   ├── settings.ts      # Global settings interface
│   ├── gameOfLife.ts    # Game of Life state types
│   └── preset.ts        # Preset and suggestion types
├── App.tsx              # Main application component
└── index.tsx            # Application entry point
```

## Key Modules

### Services

#### `particleManager.ts`
Provides object pooling to avoid per-frame allocations:
```typescript
import { getParticlePool, setParticleCount } from '../services';

const particles = getParticlePool('my-machine', count, (i) => ({ x: 0, y: 0 }));
particles[i].x = newX; // Update in place
```

#### `audioAnalyzer.ts`
Analyzes frequency data into perceptual bands:
```typescript
import { analyzeBands } from '../services';

const bands = analyzeBands(frequencyData, smoothing);
// Returns { bass, mid, treble, volume }
```

#### `gameOfLife.ts`
Conway's Game of Life implementation:
```typescript
import { initializeGrid, stepGeneration } from '../services';

const grid = initializeGrid(cols, rows, density);
const nextGen = stepGeneration(grid);
```

### Hooks

#### `useAudioAnalysis`
Manages microphone input and live frequency analysis:
```typescript
const { audioData, updateAudio, permissionError } = useAudioAnalysis({
  enabled: true,
  audioGain: 1.5,
  audioSmooth: 0.85
});
```

#### `useGameOfLife`
Manages Game of Life grid state:
```typescript
const { getGrid, stepGrid, resetGrid } = useGameOfLife({
  cols: 50,
  rows: 50,
  initialDensity: 0.5,
  speed: 100
});
```

#### `useCanvasRecording`
Handles canvas-to-video recording:
```typescript
const { startRecording, stopRecording, isRecording } = useCanvasRecording({
  canvasRef,
  onComplete: () => console.log('Done!')
});
```

### Utils

#### `math.ts`
- `noise(x, y, z)` - Perlin noise function
- `random(seed)` - Seeded random number generator
- `lerp(a, b, t)` - Linear interpolation
- `smoothstep(t)` - Smooth step easing

#### `canvas.ts`
- `fillBackground()` - Background filling with transparency support
- `isGridAlive()` - Game of Life grid state checking

### Types

All TypeScript types are organized into focused modules:
- `machine.ts` - Machine interface and MachineDepartment enum
- `control.ts` - ControlDef, SketchParams
- `audio.ts` - AudioData interface
- `settings.ts` - GlobalSettings interface
- `gameOfLife.ts` - GameOfLife and GlobalState types
- `preset.ts` - SavedPreset and GeminiSuggestion

**Backward compatibility**: Root `types.ts` re-exports all types.

## Machine Registry

The machine registry provides centralized catalog and lookup:

```typescript
import { getMachine, getAllMachines, getMachinesByDepartment } from './machines';

const machine = getMachine('flow-field');
const allMachines = getAllMachines();
const signalMachines = getMachinesByDepartment(MachineDepartment.SIGNAL);
```

## Design Patterns

### 1. Separation of Concerns
- **Services** handle algorithms and business logic
- **Hooks** manage React state and side effects
- **Utils** provide pure functions
- **Components** focus on rendering
- **Types** define interfaces

### 2. Performance Optimization
- **Particle pooling** reduces GC pressure
- **Audio smoothing** provides stable values
- **Reference tracking** prevents unnecessary re-renders

### 3. Scalability
- **Machine registry** allows dynamic registration
- **Department organization** keeps machines organized
- **Module exports** enable tree-shaking

### 4. Maintainability
- **Type safety** through comprehensive interfaces
- **Modular structure** reduces coupling
- **Named exports** improve clarity
- **JSDoc comments** document APIs

## Migration Guide

### Updating Imports

**Old:**
```typescript
import { Machine, GlobalState, noise } from './types';
import { ModularGridder, MACHINE_REGISTRY } from './sketches/machines';
```

**New:**
```typescript
import { Machine, GlobalState } from './types';
import { noise } from './utils/math';
import { getMachine } from './machines';
```

### Creating New Machines

1. Create file: `src/machines/department/myMachine.ts`
2. Implement Machine interface
3. Register in department index
4. Export from `src/machines/index.ts`

Example:
```typescript
// src/machines/signal/myMachine.ts
import { Machine, MachineDepartment } from '../../types';
import { fillBackground } from '../../utils';
import { noise } from '../../utils/math';

const MyMachine: Machine = {
  id: 'my-machine',
  name: 'My Machine',
  department: MachineDepartment.SIGNAL,
  description: 'My visualization',
  controls: [
    { id: 'speed', label: 'Speed', type: 'number', defaultValue: 1 }
  ],
  draw(ctx, width, height, params, time, globalState) {
    fillBackground(ctx, width, height, '#000000', globalState);
    // Your code
  }
};

export default MyMachine;
```

## Performance Considerations

### Particle Pooling
Reuses particle objects to minimize allocations:
```typescript
const pool = setParticleCount('machine-id', count, initFn);
for (let i = 0; i < count; i++) {
  pool[i].x = newValue; // Update in place
}
```

### Audio Smoothing
Exponential smoothing reduces noise in audio data:
```typescript
const smoothed = smoothAudio(current, previous, smoothingFactor);
```

### Game of Life Efficiency
Grid stepping only occurs when enough time has elapsed:
```typescript
if (timeSinceLastUpdate >= speed) {
  grid = stepGeneration(grid);
}
```

## Development Guidelines

### Adding a New Service
1. Create `src/services/myService.ts`
2. Export functions with clear APIs
3. Add to `src/services/index.ts`
4. Document with JSDoc

### Adding a New Hook
1. Create `src/hooks/useMyHook.ts`
2. Follow React hooks best practices
3. Export from `src/hooks/index.ts`
4. Use clear prop names and return shapes

### Adding a New Machine
1. Organize by department
2. Use utility functions (fillBackground, isGridAlive)
3. Apply multipliers where appropriate
4. Register in machine registry

## Testing Strategy

Each module should be independently testable:
- **Services**: Pure function tests
- **Hooks**: React Testing Library
- **Utils**: Unit tests
- **Machines**: Visual regression tests

## Future Enhancements

1. **Machine presets**: Pre-configured parameter sets
2. **Effect composition**: Chain multiple effects
3. **Performance profiling**: FPS and memory monitoring
4. **Remote machine loading**: Load machines from servers
5. **Plugin system**: Third-party machine extensions

## Building for Production

```bash
npm run build
# Output: dist/ directory with optimized code
```

The modular structure enables:
- Effective tree-shaking
- Code splitting by route/machine department
- Lazy loading of machine definitions
