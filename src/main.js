import './style.css';
import { Controller } from './core/controller.js';
import { Renderer } from './core/renderer.js';

// Import all sketches
// We will populate this list as we migrate them
import { SwissGridder } from './sketches/grid/swiss-gridder.js';
import { PosterComposer } from './sketches/grid/poster-composer.js';
import { BauhausAssembler } from './sketches/grid/bauhaus-assembler.js';
import { KineticTypeEngine } from './sketches/type/kinetic-type-engine.js';
import { GlyphDeconstructor } from './sketches/type/glyph-deconstructor.js';
import { WaveformSynthesizer } from './sketches/signal/waveform-synthesizer.js';
import { VectorFieldModulator } from './sketches/signal/vector-field-modulator.js';
import { UniversalRasterizer } from './sketches/image/universal-rasterizer.js';
import { VideoSampler } from './sketches/image/video-sampler.js';
import { ColorSystemAnalyzer } from './sketches/image/color-system-analyzer.js';
import { PixelSorter } from './sketches/image/pixel-sorter.js';
import { TruchetTiler } from './sketches/gen/truchet-tiler.js';
import { ParticleEngine } from './sketches/gen/particle-engine.js';
import { GenerativeComposer } from './sketches/gen/generative-composer.js';
import { AsciiBlob } from './sketches/type/ascii-blob.js';
import { MetaballField } from './sketches/gen/metaball-field.js';
import { DitheringEngine } from './sketches/image/dithering-engine.js';

const SKETCHES = {
    // Grid Tools (3)
    'gridArchitect': SwissGridder,
    'posterComposer': PosterComposer,
    'bauhausAssembler': BauhausAssembler,

    // Type Tools (3)
    'kineticTypeEngine': KineticTypeEngine,
    'glyphDeconstructor': GlyphDeconstructor,
    'asciiBlob': AsciiBlob, // NEW: Tim Rodenbroeker-inspired

    // Signal Tools (2)
    'waveformSynthesizer': WaveformSynthesizer,
    'vectorFieldModulator': VectorFieldModulator,

    // Image Tools (5)
    'universalRasterizer': UniversalRasterizer,
    'videoSampler': VideoSampler,
    'colorSystemAnalyzer': ColorSystemAnalyzer,
    'pixelSorter': PixelSorter,
    'ditheringEngine': DitheringEngine, // NEW: Tim Rodenbroeker-inspired

    // Gen Tools (4)
    'truchetTiler': TruchetTiler,
    'particleEngine': ParticleEngine,
    'generativeComposer': GenerativeComposer,
    'metaballField': MetaballField, // NEW: Tim Rodenbroeker-inspired
};

class App {
    constructor() {
        this.controller = new Controller();
        this.renderer = new Renderer('canvas-wrapper');
    }

    init() {
        this.controller.init(SKETCHES, this.renderer);
    }
}

const app = new App();
app.init();
