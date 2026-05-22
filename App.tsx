
import React, { useState, useEffect } from 'react';
import { 
  Wand2,
  Menu,
  X,
  Download,
  Terminal,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen,
  Box,
  Grid3X3,
  Type,
  Activity,
  Image as ImageIcon,
  Search,
  ChevronRight,
  MonitorPlay,
  Settings
} from 'lucide-react';
import { Machine, SketchParams, GlobalSettings, SavedPreset } from './types';
import { MACHINE_REGISTRY, getMachine } from './src/machines';
import { ModularGridder } from './src/machines/grid/ModularGridder';
import ControlRack from './components/ControlRack';
import CanvasStage from './components/CanvasStage';
import ToolsPanel from './components/ToolsPanel';
import PerformanceMonitor from './components/PerformanceMonitor';
import { suggestParameters } from './services/geminiService';
import AudioDebugOverlay from './components/AudioDebugOverlay';
import { useTimeline } from './src/hooks/useTimeline';
import { useUndoRedo } from './src/hooks/useUndoRedo';
import { useKeyboardShortcuts, createShortcut } from './src/hooks/useKeyboardShortcuts';
import { usePerformanceMonitor } from './src/hooks/usePerformanceMonitor';
import { useCanvasFitter } from './src/hooks/useCanvasFitter';
import { useRef } from 'react';

// PRESETS
const RESOLUTIONS = [
    { label: "SQ 1:1 (1080p)", w: 1080, h: 1080 },
    { label: "PORTRAIT (IG)", w: 1080, h: 1920 },
    { label: "LANDSCAPE (HD)", w: 1920, h: 1080 },
    { label: "A3 PRINT (Low)", w: 1754, h: 2480 },
    { label: "4K UHD (High)", w: 3840, h: 2160 },
];

const App: React.FC = () => {
  const [activeMachine, setActiveMachine] = useState<Machine>(ModularGridder);
  
  const getDefaults = (m: Machine) => {
    const p: SketchParams = {};
    m.controls.forEach(c => p[c.id] = c.defaultValue);
    return p;
  };

  const [params, setParams] = useState<SketchParams>(getDefaults(ModularGridder));
  const [resIndex, setResIndex] = useState(2);
  const resolution = RESOLUTIONS[resIndex];
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate precise dimensions to fit the container
  const fitDims = useCanvasFitter(containerRef, resolution.w, resolution.h);
    
  // UI Panels State
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [showAudioDebug, setShowAudioDebug] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  // INITIALIZE ADVANCED HOOKS
  const timeline = useTimeline({ 
    params, 
    onParamsChange: (newParams) => {
        setParams(newParams);
    } 
  });
  
  const undoRedo = useUndoRedo({ params });
  const performanceMetrics = usePerformanceMonitor(true);

  // KEYBOARD SHORTCUTS (all require Ctrl to avoid conflicts with text input)
  useKeyboardShortcuts([
    createShortcut('z', () => undoRedo.undo(), { ctrl: true, description: 'Undo' }),
    createShortcut('y', () => undoRedo.redo(), { ctrl: true, description: 'Redo' }),
    createShortcut('e', () => setIsToolsOpen(!isToolsOpen), { ctrl: true, description: 'Toggle Tools' }),
    createShortcut('l', () => setIsLibraryOpen(!isLibraryOpen), { ctrl: true, description: 'Toggle Library' }),
    createShortcut('c', () => setIsControlsOpen(!isControlsOpen), { ctrl: true, shift: true, description: 'Toggle Controls' }),
    createShortcut('r', () => randomizeParams(), { ctrl: true, shift: true, description: 'Randomize' })
  ]);

  // GLOBAL STATE
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isGoLActive, setIsGoLActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // PRESETS STATE
  const [presets, setPresets] = useState<SavedPreset[]>([]);

  // Load presets from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tmm_os_presets');
      if (saved) {
        setPresets(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load presets", e);
    }
  }, []);

  // Save presets to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('tmm_os_presets', JSON.stringify(presets));
  }, [presets]);
  
  // GLOBAL SETTINGS
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
       audioGain: 2.5,      // Increased for higher sensitivity
       audioSmooth: 0.7,    // Reduced for faster response
       audioOnly: false,
      sizeMultiplier: 1.0,
      speedMultiplier: 1.0,
      audioTriggerThreshold: 0.05,
      audioHold: 200,
       golSpeed: 100, // ms
       golDensity: 0.5,
       golThreshold: 0.5,
       golCols: 50,
       golRows: 50,
       transparent: false,
       cameraId: ''
  });

  const [pixelPerfectPreview, setPixelPerfectPreview] = useState(false);



  const handleMachineChange = (id: string) => {
    const newMachine = getMachine(id);
    setActiveMachine(newMachine);
    setParams(getDefaults(newMachine));
  };

  const handleParamChange = (id: string, value: any) => {
    const newParams = { ...params, [id]: value };
    setParams(newParams);
    undoRedo.addToHistory(newParams);
  };

  const handleGlobalSettingChange = (id: keyof GlobalSettings, value: any) => {
      setGlobalSettings(prev => ({ ...prev, [id]: value }));
  };

  const randomizeParams = () => {
    const newParams = { ...params };
    activeMachine.controls.forEach(c => {
        if (c.type === 'number') {
            const range = (c.max || 100) - (c.min || 0);
            newParams[c.id] = (c.min || 0) + Math.random() * range;
            if (c.step) {
                newParams[c.id] = Math.round(newParams[c.id] / c.step) * c.step;
            }
        }
        if (c.type === 'boolean') {
            newParams[c.id] = Math.random() > 0.5;
        }
        if (c.type === 'color') {
            newParams[c.id] = '#' + Math.floor(Math.random()*16777215).toString(16);
        }
    });
    setParams(newParams);
  };

  const handleSavePreset = (name: string) => {
    const newPreset: SavedPreset = {
        id: crypto.randomUUID(),
        name: name,
        machineId: activeMachine.id,
        params: { ...params },
        timestamp: Date.now()
    };
    setPresets(prev => [newPreset, ...prev]);
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    if (preset.machineId !== activeMachine.id) {
        if(confirm("This preset belongs to a different machine. Switch machine?")) {
            handleMachineChange(preset.machineId);
             const newMachine = getMachine(preset.machineId);
             setActiveMachine(newMachine);
             setParams(preset.params);
        }
    } else {
        setParams(preset.params);
    }
  };

  const handleDeletePreset = (id: string) => {
    if(confirm("Delete this preset permanently?")) {
        setPresets(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAiSuggest = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    const result = await suggestParameters(activeMachine, params, aiPrompt);
    if (result) {
        setParams(prev => ({ ...prev, ...result }));
        setIsAiPanelOpen(false);
        setAiPrompt("");
    } else {
        alert("AI Director could not process request.");
    }
    setIsAiLoading(false);
  };

  const filteredMachines = MACHINE_REGISTRY.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const machinesByDept = filteredMachines.reduce((acc, m) => {
    const dept = m.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(m);
    return acc;
  }, {} as Record<string, Machine[]>);

  const getDeptIcon = (deptName: string) => {
      if (deptName.includes('GRID')) return <Grid3X3 className="w-3 h-3" />;
      if (deptName.includes('TYPE')) return <Type className="w-3 h-3" />;
      if (deptName.includes('SIGNAL')) return <Activity className="w-3 h-3" />;
      if (deptName.includes('IMAGE')) return <ImageIcon className="w-3 h-3" />;
      return <Box className="w-3 h-3" />;
  };

  const handleDownloadImage = () => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
          const link = document.createElement('a');
          link.download = `TMM-OS_${activeMachine.id}_${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      }
  };

  const handleOpenProjector = () => {
      // Use specific ID to ensure we grab the correct main artwork canvas
      const canvas = document.getElementById('main-stage-canvas') as HTMLCanvasElement;
      if(!canvas) {
          alert("Error: Main canvas not found. Please verify the interface is loaded.");
          return;
      }
      
      let stream: MediaStream;
      try {
          console.log("Projector: Attempting to capture stream...");
          // Check for support
          const startStream = (canvas as any).captureStream || (canvas as any).mozCaptureStream;
          if (!startStream) {
               throw new Error("captureStream not supported in this browser.");
          }
          
          // Capture stream (no arguments is safest cross-browser)
          stream = startStream.call(canvas);
          console.log("Projector: Stream captured", stream);
          
          if (stream.getVideoTracks().length === 0) {
              console.warn("Projector: Stream has no video tracks");
              throw new Error("Canvas stream has no video tracks.");
          }
      } catch (e: any) {
          console.error("Projector Error:", e);
          alert(`Projector Error: ${e.message || "Failed to capture canvas stream."}`);
          return;
      }

      console.log("Projector: Opening window...");
      const win = window.open('', 'Projector', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
      
      if(!win) {
          alert("Popup blocked. Please allow popups for Projector Mode.");
          return;
      }
      
      win.document.title = "TMM-OS: PROJECTOR OUT";
      win.document.body.style.margin = '0';
      win.document.body.style.backgroundColor = 'black';
      win.document.body.style.overflow = 'hidden';
      win.document.body.style.display = 'flex';
      win.document.body.style.justifyContent = 'center';
      win.document.body.style.alignItems = 'center';
      
      const video = win.document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true; // Crucial for autoplay policies
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'contain';
      
      // Explicit play attempt
      video.onloadedmetadata = () => {
          video.play().catch(e => console.error("Projector: Play failed", e));
      };
      
      console.log("Projector: Video element created and attached");

      // Fullscreen helper UI
      const controls = win.document.createElement('div');
      controls.style.position = 'absolute';
      controls.style.top = '8px';
      controls.style.right = '8px';
      controls.style.zIndex = '9999';

      const fsBtn = win.document.createElement('button');
      fsBtn.innerText = '⛶ FULLSCREEN';
      fsBtn.style.padding = '8px 10px';
      fsBtn.style.background = 'rgba(0,0,0,0.6)';
      fsBtn.style.color = 'white';
      fsBtn.style.border = '1px solid rgba(255,255,255,0.08)';
      fsBtn.style.cursor = 'pointer';
      // Toggle fullscreen on the window element for best cross-browser behavior
      fsBtn.onclick = async () => {
          try {
              const elemAny: any = win.document.documentElement;
              // Try document-level first (better fills the window)
              if (elemAny.requestFullscreen) await elemAny.requestFullscreen();
              else if (elemAny.webkitRequestFullscreen) await (elemAny as any).webkitRequestFullscreen();
              else {
                  // Fallback to video element
                  const v: any = video;
                  if (v.requestFullscreen) await v.requestFullscreen();
                  else if (v.webkitRequestFullscreen) await v.webkitRequestFullscreen();
              }
              // Prefer cover when fullscreen to fill display
              video.style.objectFit = 'cover';
          } catch (e) {
              // Fallback resize
              win.resizeTo(screen.width, screen.height);
              win.moveTo(0,0);
          }
      };
      // When leaving fullscreen, restore object fit so content isn't cropped in the preview window
      win.document.addEventListener('fullscreenchange', () => {
          try {
              if (!win.document.fullscreenElement) {
                  video.style.objectFit = 'contain';
              }
          } catch (e) {}
      });

      controls.appendChild(fsBtn);

      // Double-click toggles fullscreen on the video
      video.ondblclick = () => fsBtn.onclick && fsBtn.onclick(new MouseEvent('click') as any);

      // ESC closes fullscreen / window
      win.document.addEventListener('keydown', (ev) => {
          if (ev.key === 'Escape') {
              if (win.document.fullscreenElement) {
                  (win.document as any).exitFullscreen && (win.document as any).exitFullscreen();
              } else {
                  try { win.close(); } catch(e) {}
              }
          }
      });

      win.document.body.appendChild(video);
      win.document.body.appendChild(controls);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-black text-zinc-300 overflow-hidden font-mono selection:bg-orange-500 selection:text-black">
      
      {/* HEADER */}
      <header className="h-12 shrink-0 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 z-20 relative">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                    className={`p-1 hover:text-white transition-colors ${!isLibraryOpen && 'text-zinc-500'}`}
                    title="Toggle Library"
                >
                    {isLibraryOpen ? <PanelLeftClose className="w-4 h-4"/> : <PanelLeftOpen className="w-4 h-4"/>}
                </button>

                <div className="h-4 w-px bg-zinc-800 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-600 animate-pulse hidden sm:block"></div>
                    <span className="font-bold text-xs tracking-widest text-zinc-100 whitespace-nowrap hidden md:inline">TMM-OS</span>
                    <span className="text-[9px] text-zinc-500 hidden md:inline">VISUAL LAB V2.3</span>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                 <button onClick={() => setIsAiPanelOpen(!isAiPanelOpen)} className="hover:text-green-400 flex items-center gap-1.5 uppercase transition-colors text-[10px]">
                    <Wand2 className="w-3 h-3" /> <span className="hidden sm:inline">Director</span>
                </button>

                 <div className="flex items-center border border-zinc-800 bg-zinc-900 hidden sm:flex">
                    <button 
                        onClick={() => setPixelPerfectPreview(!pixelPerfectPreview)} 
                        className={`px-2 py-1 text-[10px] uppercase font-bold border-r border-zinc-800 transition-colors ${pixelPerfectPreview ? 'bg-green-900/40 text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Toggle Pixel-Perfect 1:1 Preview"
                    >
                        PXL
                    </button>
                    <div className="px-2 py-1 text-[10px] text-zinc-500 border-r border-zinc-800 bg-zinc-950">RES</div>
                    <select 
                        className="bg-transparent text-[10px] px-2 py-1 outline-none text-zinc-300 font-bold uppercase w-24 md:w-32 cursor-pointer"
                        onChange={(e) => setResIndex(Number(e.target.value))}
                        value={resIndex}
                    >
                        {RESOLUTIONS.map((res, i) => (
                            <option key={i} value={i}>{res.label}</option>
                        ))}
                    </select>
                 </div>

                <button 
                    onClick={handleOpenProjector}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border border-zinc-700"
                    title="Open Live Output Window"
                >
                    <MonitorPlay className="w-3 h-3" /> <span className="hidden sm:inline">PROJECTOR</span>
                </button>

                <button 
                    onClick={async () => {
                        try {
                            const blob = await (await import('./src/utils/videoExport')).recordVideo(activeMachine, params, { width: resolution.w, height: resolution.h }, 3, globalSettings);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `record-${resolution.w}x${resolution.h}.webm`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                        } catch (e) {
                            alert('Recording failed: ' + (e as any).message);
                        }
                    }}
                    className="bg-zinc-800 hover:bg-red-900 hover:text-red-100 text-zinc-300 px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border border-zinc-700"
                    title="Record 3 Seconds"
                >
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> <span className="hidden sm:inline">REC 3s</span>
                </button>

                <button 
                    onClick={async () => {
                        try {
                            const data = await (await import('./src/utils/videoExport')).exportPNG(activeMachine, params, { width: resolution.w, height: resolution.h }, globalSettings);
                            const a = document.createElement('a');
                            a.href = data;
                            a.download = `export-${resolution.w}x${resolution.h}.png`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        } catch (e) {
                            alert('Export failed: ' + (e as any).message);
                        }
                    }}
                    className="bg-zinc-100 hover:bg-orange-500 hover:text-white text-black px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
                >
                    <Download className="w-3 h-3" /> <span className="hidden sm:inline">EXPORT</span>
                </button>

                <button 
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className={`p-1 hover:text-white transition-colors ${!isToolsOpen && 'text-zinc-500'}`}
                    title="Toggle Advanced Tools"
                >
                    <Settings className="w-4 h-4"/>
                </button>

                <button 
                    onClick={() => setIsControlsOpen(!isControlsOpen)}
                    className={`ml-2 p-1 hover:text-white transition-colors ${!isControlsOpen && 'text-zinc-500'}`}
                    title="Toggle Controls"
                >
                    {isControlsOpen ? <PanelRightClose className="w-4 h-4"/> : <PanelRightOpen className="w-4 h-4"/>}
                </button>
            </div>
      </header>
        <div className="absolute right-4 top-3 z-30 flex items-center gap-4">
             <PerformanceMonitor metrics={performanceMetrics} position="top-right" />
            <button onClick={() => setShowAudioDebug(!showAudioDebug)} className="text-xs text-zinc-400 hover:text-white px-2 py-1 border border-zinc-800 rounded">Audio Debug</button>
        </div>

      {/* MAIN WORKSPACE */}
            <div className="flex-1 flex overflow-hidden relative">
                {showAudioDebug && (
                    <AudioDebugOverlay params={params} settings={globalSettings} />
                )}
        
        {/* LEFT: LIBRARY RACK */}
        {isLibraryOpen && (
            <div className="w-72 md:w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 z-10">
                {/* Search Header */}
                <div className="p-3 border-b border-zinc-800 bg-zinc-950">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input 
                            type="text" 
                            placeholder="SEARCH MODULES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white pl-8 pr-3 py-1.5 text-[10px] uppercase font-bold focus:border-orange-500 focus:outline-none placeholder-zinc-700"
                        />
                    </div>
                </div>

                {/* Machine List */}
                <div className="flex-1 overflow-y-auto">
                     {Object.keys(machinesByDept).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-zinc-600">
                            <span className="text-[10px]">NO MODULES FOUND</span>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {Object.entries(machinesByDept).map(([dept, machines]) => (
                                <div key={dept} className="flex flex-col">
                                    <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-y border-zinc-800 px-3 py-1.5 flex items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                                        {getDeptIcon(dept)}
                                        {dept.replace(/[A-Z]: /, '')}
                                    </div>
                                    <div className="divide-y divide-zinc-900">
                                        {(machines as Machine[]).map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => handleMachineChange(m.id)}
                                                className={`group w-full text-left p-3 hover:bg-zinc-900 transition-all border-l-2 ${
                                                    activeMachine.id === m.id 
                                                    ? 'bg-zinc-900 border-l-orange-500' 
                                                    : 'border-l-transparent hover:border-l-zinc-700'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className={`text-[11px] font-bold uppercase ${activeMachine.id === m.id ? 'text-orange-500' : 'text-zinc-300 group-hover:text-white'}`}>
                                                        {m.name}
                                                    </span>
                                                    {activeMachine.id === m.id && <ChevronRight className="w-3 h-3 text-orange-500" />}
                                                </div>
                                                <div className="text-[9px] text-zinc-600 leading-tight line-clamp-2 group-hover:text-zinc-500">
                                                    {m.description}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Registry Footer */}
                 <div className="p-2 border-t border-zinc-800 bg-zinc-950 text-[9px] text-zinc-600 uppercase text-center">
                     REGISTRY SIZE: {MACHINE_REGISTRY.length}
                 </div>
            </div>
        )}

        {/* CENTER: CANVAS VIEWPORT */}
        <div className="flex-1 bg-[#050505] flex flex-col min-w-0 relative">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
                 style={{ 
                     backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)', 
                     backgroundSize: '20px 20px' 
                 }}>
            </div>

            <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden relative z-10 w-full h-full p-4">
                {/* Precise container for the canvas */}
                {fitDims.width > 0 && (
                    <div 
                        className={`relative shadow-2xl overflow-hidden transition-colors ${globalSettings.transparent ? 'bg-[url("https://upload.wikimedia.org/wikipedia/commons/2/23/Checkerboard_pattern.svg")] bg-[length:20px_20px]' : 'bg-black'}`}
                        style={{
                            width: fitDims.width,
                            height: fitDims.height,
                            // Ensure strict border box
                            boxSizing: 'content-box', 
                            border: '1px solid #333'
                        }}
                    >
                        <CanvasStage 
                            ref={canvasRef}
                            machine={activeMachine} 
                            params={params} 
                            resolution={{ width: resolution.w, height: resolution.h }} 
                            audioActive={isAudioActive}
                            golActive={isGoLActive}
                            recording={isRecording}
                            projectorMode={false}
                            globalSettings={globalSettings}
                            pixelPerfect={pixelPerfectPreview}
                        />
                    </div>
                )}
            </div>

            {/* STATUS BAR */}
            <div className="h-6 shrink-0 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between px-3 text-[9px] text-zinc-600 font-mono uppercase z-20">
                <div className="flex gap-4">
                    <span className="text-zinc-400 font-bold">{activeMachine.name}</span>
                    <span className="hidden sm:inline">ID: {activeMachine.id}</span>
                </div>
                <div className="flex gap-4">
                    <span className={isAudioActive ? "text-green-500 font-bold" : ""}>MIC {isAudioActive ? "ON" : "OFF"}</span>
                    <span className={isGoLActive ? "text-blue-500 font-bold" : ""}>SIM {isGoLActive ? "RUN" : "STOP"}</span>
                    <span className={isRecording ? "text-red-500 font-bold animate-pulse" : ""}>{isRecording ? "REC" : "RDY"}</span>
                </div>
            </div>

            {/* AI Prompt Panel (Floating) */}
            {isAiPanelOpen && (
                <div className="absolute top-4 right-4 w-80 bg-zinc-950 border border-green-900 shadow-2xl z-30 font-mono animate-in slide-in-from-top-4">
                    <div className="bg-green-950/20 border-b border-green-900/50 p-2 flex justify-between items-center text-green-500">
                        <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-3 h-3" /> DIRECTOR_CONSOLE
                        </span>
                        <button onClick={() => setIsAiPanelOpen(false)}><X className="w-3 h-3 hover:text-green-300"/></button>
                    </div>
                    <div className="p-3">
                        <textarea 
                            className="w-full bg-black border border-green-900/50 text-green-100 text-xs p-2 min-h-[80px] mb-2 focus:border-green-500 outline-none resize-none placeholder-green-900/50 block"
                            placeholder=">> DESCRIBE DESIRED VISUAL OUTPUT..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                        />
                        <button 
                            disabled={isAiLoading || !process.env.API_KEY}
                            onClick={handleAiSuggest}
                            className="w-full bg-green-500/10 border border-green-500/50 hover:bg-green-500 text-green-500 hover:text-black py-2 text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                        >
                            {isAiLoading ? "PROCESSING..." : "EXECUTE COMMAND"}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT: CONTROL RACK */}
        {isControlsOpen && (
            <div className="w-72 md:w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col shrink-0 z-10 shadow-xl">
                <ControlRack 
                    machine={activeMachine} 
                    params={params} 
                    onChange={handleParamChange} 
                    onRandomize={randomizeParams}
                    isAudioActive={isAudioActive}
                    toggleAudio={() => {
                        const newState = !isAudioActive;
                        setIsAudioActive(newState);
                        if (newState) {
                            import('./src/services/AudioService').then(({ AudioService }) => {
                                AudioService.start().then(() => console.log("Audio started via click"));
                            });
                        } else {
                            import('./src/services/AudioService').then(({ AudioService }) => {
                                AudioService.stop();
                            });
                        }
                    }}
                    isGoLActive={isGoLActive}
                    toggleGoL={() => setIsGoLActive(!isGoLActive)}
                    isRecording={isRecording}
                    toggleRecord={() => setIsRecording(!isRecording)}
                    globalSettings={globalSettings}
                    onGlobalChange={handleGlobalSettingChange}
                    presets={presets}
                    onSavePreset={handleSavePreset}
                    onLoadPreset={handleLoadPreset}
                    onDeletePreset={handleDeletePreset}
                />
            </div>
        )}

        {/* ADVANCED TOOLS PANEL */}
        {isToolsOpen && (
            <ToolsPanel
                canvas={canvasRef.current}
                timeline={timeline.timeline}
                params={params}
                controls={activeMachine.controls}
                onPlay={timeline.play}
                onPause={timeline.pause}
                onStop={timeline.stop}
                onSeek={timeline.seek}
                onAddTrack={timeline.addTrack}
                onRemoveTrack={timeline.removeTrack}
                onAddKeyframe={timeline.addKeyframe}
                onRemoveKeyframe={timeline.removeKeyframe}
                onUpdateKeyframe={timeline.updateKeyframe}
                onSetDuration={timeline.setDuration}
                onSetLoop={timeline.setLoop}
                onGenerateVariations={(variations) => {
                    // Just take the first one or implement a preview system
                    if(variations.length > 0) setParams(variations[0]);
                }}
                onApplyPattern={(pattern, patternParams) => {
                    // Pattern application logic would go here
                    console.log("Applying pattern", pattern);
                }}
                performanceMetrics={performanceMetrics}
            />
        )}

      </div>
    </div>
  );
};

export default App;
