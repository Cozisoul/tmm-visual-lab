
import { registerMachines } from './registry';
import { Machine } from '../types';

// Grid
import { ModularGridder } from './grid/ModularGridder';
import { GeometricCircles } from './grid/GeometricCircles';
import { TruchetTiler } from './grid/TruchetTiler';
import { MazeGenerator } from './grid/MazeGenerator';
import { MoireInterference } from './grid/MoireInterference';
import { LayoutEngine } from './grid/LayoutEngine';
import { RecursivePartition } from './grid/RecursivePartition';
import { BauhausConstructor } from './grid/BauhausConstructor';
import { PosterArchitect } from './grid/PosterArchitect';
import { IsometricCity } from './grid/IsometricCity';
import { ArchitecturePrint } from './grid/ArchitecturePrint';

// Type
import { GlyphSwarm } from './type/GlyphSwarm';
import { TypeStacker } from './type/TypeStacker';
import { KineticScroller } from './type/KineticScroller';
import { LiquidDataType } from './type/LiquidDataType';
import { SignalBreak } from './type/SignalBreak';
import { WebcamASCII } from './type/WebcamASCII';
import { DataStream } from './type/DataStream';
import { TheThreePercent } from './type/TheThreePercent';

// Signal
import { SignalOscillator } from './signal/SignalOscillator';
import { AudioReactor } from './signal/AudioReactor';
import { FlowField } from './signal/FlowField';
import { ParticleAnalyzer } from './signal/ParticleAnalyzer';
import { SpectrogramHistory } from './signal/SpectrogramHistory';
import { SonicTerrain } from './signal/SonicTerrain';
import { NetworkMind } from './signal/NetworkMind';
import { RyojiSystem } from './signal/RyojiSystem';

// Image
import { BlobGenerator } from './image/BlobGenerator';
import { CharcoalAnimator } from './image/CharcoalAnimator';
import { CharcoalProcess } from './image/CharcoalProcess';
import { RaymarchSDF } from './image/RaymarchSDF';
import { RaymarchConstruct } from './image/RaymarchConstruct';
import { SlitScan } from './image/SlitScan';
import { MotionHeatmap } from './image/MotionHeatmap';
import { EdgeGlitch } from './image/EdgeGlitch';
import { KaleidoCam } from './image/KaleidoCam';
import { PoorImageGlitch } from './image/PoorImageGlitch';
import { PixelSorter } from './image/PixelSorter';
import { HalftoneRaster } from './image/HalftoneRaster';
import { DitherField } from './image/DitherField';
import { ReactionDiffusion } from './image/ReactionDiffusion';
import { VoronoiSystems } from './image/VoronoiSystems';

// Masters
import { LatentFluidity } from './masters/LatentFluidity';
import { QuantumStrobe } from './masters/QuantumStrobe';
import { LidarScan } from './masters/LidarScan';
import { AtmosphericSun } from './masters/AtmosphericSun';
import { MirrorBox } from './masters/MirrorBox';
import { OrganicLattice } from './masters/OrganicLattice';
import { IndustrialBrutalism } from './masters/IndustrialBrutalism';
import { SoilStrata } from './masters/SoilStrata';
import { WovenPath } from './masters/WovenPath';
import { RoboticMimicry } from './masters/RoboticMimicry';
import { VoicePrint } from './masters/VoicePrint';

const ALL_MACHINES: Machine[] = [
    // Grid
    ModularGridder, GeometricCircles, TruchetTiler, MazeGenerator, MoireInterference,
    LayoutEngine, RecursivePartition, BauhausConstructor, PosterArchitect, IsometricCity, ArchitecturePrint,
    // Type
    GlyphSwarm, TypeStacker, KineticScroller, LiquidDataType, SignalBreak, WebcamASCII, DataStream, TheThreePercent,
    // Signal
    SignalOscillator, AudioReactor, FlowField, ParticleAnalyzer, SpectrogramHistory, SonicTerrain, NetworkMind, RyojiSystem,
    // Image
    BlobGenerator, CharcoalAnimator, CharcoalProcess, RaymarchSDF, RaymarchConstruct, SlitScan, 
    PoorImageGlitch, PixelSorter, HalftoneRaster, DitherField, ReactionDiffusion, 
    VoronoiSystems, MotionHeatmap, EdgeGlitch, KaleidoCam,
    // Masters
    LatentFluidity, QuantumStrobe, LidarScan, AtmosphericSun, MirrorBox, 
    OrganicLattice, IndustrialBrutalism, SoilStrata, WovenPath, RoboticMimicry, VoicePrint
];

// Register all machines on load
registerMachines(ALL_MACHINES);

// Re-export registry/helpers
export { getMachine, getAllMachines, getMachinesByDepartment, getMachinesByDepartments } from './registry';

// Export as array for App compatibility
export const MACHINE_REGISTRY = ALL_MACHINES;
