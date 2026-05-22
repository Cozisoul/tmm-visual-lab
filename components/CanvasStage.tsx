import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Machine, SketchParams, GlobalState, GlobalSettings } from '../src/types/machine';
import { AudioService } from '../src/services/AudioService';
import { GameOfLifeEngine } from '../src/services/GameOfLifeEngine';
import { processParametersWithAudio } from '../src/utils/params';

interface CanvasStageProps {
  machine: Machine | null;
  params: SketchParams;
  resolution: { width: number; height: number };
  audioActive: boolean;
  golActive: boolean;
  recording: boolean;
  projectorMode: boolean;
  globalSettings: GlobalSettings;
  // When true, display a pixel-perfect preview where 1 render-pixel maps to 1 backing pixel
  pixelPerfect?: boolean;
}

const CanvasStage = forwardRef<HTMLCanvasElement, CanvasStageProps>(({
  machine,
  params,
  resolution,
  audioActive,
  golActive,
  recording,
  projectorMode,
  globalSettings,
  pixelPerfect = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Expose the internal canvas element to the parent ref
  useImperativeHandle(ref, () => canvasRef.current!);

  // Services
  const golEngine = useRef(new GameOfLifeEngine(50, 50, 0.3));
  
  // Refs for loop access
  const machineRef = useRef(machine);
  const paramsRef = useRef(params);
  const resolutionRef = useRef(resolution);
  const golActiveRef = useRef(golActive);
  const audioActiveRef = useRef(audioActive);
  const globalSettingsRef = useRef(globalSettings);
  
  // CRITICAL: Sync refs when props change (the animation loop reads from refs)
  useEffect(() => { machineRef.current = machine; }, [machine]);
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { resolutionRef.current = resolution; }, [resolution]);
  useEffect(() => { golActiveRef.current = golActive; }, [golActive]);
  useEffect(() => { audioActiveRef.current = audioActive; }, [audioActive]);
  useEffect(() => { globalSettingsRef.current = globalSettings; }, [globalSettings]);
  
  // Core drawing logic - simplified to always draw at resolution size
  const drawFrame = (time: number) => {
    try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;
        
        // No more complex transforms or backing store calculations.
        // The canvas is physically set to resolution.width/height.
        // We just draw 1:1 onto it.

        const currentRes = resolutionRef.current;
        const currentMachine = machineRef.current;
        const currentParams = paramsRef.current;
        const isGolActive = golActiveRef.current;
        const isAudioActive = audioActiveRef.current;
        const currentSettings = globalSettingsRef.current;

        // 1. Get Service Data
        const audioData = AudioService.getAnalysis();
        
        // 2. GoL Step
        if (isGolActive) {
             const frame = Math.floor(time / 16); 
             if (frame % 4 === 0) {
                 golEngine.current.step(); 
             }
        }
        const currentGrid = golEngine.current.getGrid();

        // 3. Prepare Global State
        const globalState: GlobalState = {
          audio: audioData,
          gameOfLife: currentGrid,
          golEnabled: isGolActive,
          time: time,
          resolution: currentRes,
          settings: currentSettings
        };

        // 4. Modulate Params
        let paramsToUse = currentParams;
        if (currentParams) {
             paramsToUse = processParametersWithAudio(currentParams, currentSettings, globalState, isGolActive);
        }

        // 5. Draw
        if (currentMachine) {
            // Apply background
            if (paramsToUse.bg) {
                if (currentSettings.transparent) {
                    ctx.clearRect(0, 0, currentRes.width, currentRes.height);
                } else {
                    ctx.fillStyle = paramsToUse.bg as string;
                    ctx.fillRect(0, 0, currentRes.width, currentRes.height);
                }
            } else {
                ctx.clearRect(0, 0, currentRes.width, currentRes.height);
            }
            
            currentMachine.draw(ctx, currentRes.width, currentRes.height, paramsToUse, time, globalState);
        } else {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, currentRes.width, currentRes.height);
            ctx.fillStyle = '#666';
            ctx.font = '12px monospace';
            ctx.fillText("STANDBY: NO MACHINE SELECTED", 20, 30);
        }

      // 6. Debug Overlay
        if (isAudioActive) {
             ctx.save();
             ctx.scale(2, 2); // Make it visible on high res
             ctx.translate(10, 10);
             ctx.fillStyle = 'rgba(0,0,0,0.5)';
             ctx.fillRect(0, 0, 120, 40);
             ctx.fillStyle = '#0f0';
             ctx.font = '10px monospace';
             ctx.fillText(`VOL: ${audioData.volume.toFixed(2)}`, 10, 15);
             ctx.fillText(`BASS: ${audioData.bass.toFixed(2)}`, 10, 30);
             ctx.restore();
        }

    } catch (err: any) {
        console.error("Loop Error", err);
    }
  };

  // Animation Loop Handler (Worker + rAF)
  useEffect(() => {
    // Guard Worker creation for environments without Worker (tests/SSR)
    if (typeof window === 'undefined' || typeof (window as any).Worker === 'undefined') {
      // Fallback to rAF-only loop
      const animateRef = (time: number) => {
        drawFrame(time);
        requestRef.current = requestAnimationFrame(animateRef);
      };
      requestRef.current = requestAnimationFrame(animateRef);

      return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }

    const workerBlob = new Blob([`
      let interval;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          interval = setInterval(() => postMessage('tick'), 1000/60);
        } else if (e.data === 'stop') {
          clearInterval(interval);
        }
      };
    `], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(workerBlob));
    
    worker.onmessage = () => {
       drawFrame(performance.now());
    };

    const animateRef = (time: number) => {
        drawFrame(time);
        requestRef.current = requestAnimationFrame(animateRef);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (worker) worker.postMessage('start');
      } else {
        if (worker) worker.postMessage('stop');
        requestRef.current = requestAnimationFrame(animateRef);
      }
    };

    if (!document.hidden) {
        requestRef.current = requestAnimationFrame(animateRef);
    } else {
        if (worker) worker.postMessage('start');
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (worker) worker.terminate();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="main-stage-canvas"
      width={resolution.width}
      height={resolution.height}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
});

CanvasStage.displayName = 'CanvasStage';

export default CanvasStage;