
import React, { useState, useEffect } from 'react';
import { ControlDef, SketchParams, Machine, GlobalSettings, SavedPreset } from '../types';
import { RefreshCcw, Mic, Activity, Video, Radio, Settings, Sliders, Layers, Save, FolderOpen, Trash2, ArrowUpRight, Camera } from 'lucide-react';

interface ControlRackProps {
  machine: Machine;
  params: SketchParams;
  onChange: (id: string, value: any) => void;
  onRandomize: () => void;
  isAudioActive: boolean;
  toggleAudio: () => void;
  isGoLActive: boolean;
  toggleGoL: () => void;
  isRecording: boolean;
  toggleRecord: () => void;
  globalSettings: GlobalSettings;
  onGlobalChange: (id: keyof GlobalSettings, value: any) => void;
  presets: SavedPreset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: SavedPreset) => void;
  onDeletePreset: (id: string) => void;
}

const ControlRack: React.FC<ControlRackProps> = ({ 
  machine, 
  params, 
  onChange, 
  onRandomize,
  isAudioActive,
  toggleAudio,
  isGoLActive,
  toggleGoL,
  isRecording,
  toggleRecord,
  globalSettings,
  onGlobalChange,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset
}) => {
  const [activeTab, setActiveTab] = useState<'module' | 'system' | 'presets'>('module');
  const [newPresetName, setNewPresetName] = useState('');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
      // Enumerate Cameras
      const getCams = async () => {
          try {
              if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
              const devices = await navigator.mediaDevices.enumerateDevices();
              const cams = devices.filter(d => d.kind === 'videoinput');
              setVideoDevices(cams);
          } catch(e) { console.warn("Cam Enum Error", e); }
      };
      getCams();
  }, []);

  const currentMachinePresets = presets.filter(p => p.machineId === machine.id);

  const handleSaveClick = () => {
      if(newPresetName.trim()) {
          onSavePreset(newPresetName);
          setNewPresetName('');
      }
  };

  return (
    <div className="h-full flex flex-col font-mono text-[10px] select-none bg-[#0a0a0a]">
      
      {/* Rack Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="text-zinc-600 uppercase tracking-widest mb-1">Active Module</div>
        <div className="text-orange-500 text-lg font-bold leading-none tracking-tight uppercase break-words">
            {machine.name}
        </div>
      </div>

      {/* GLOBAL TOGGLES GRID */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/20 shrink-0">
        <div className="grid grid-cols-3 gap-2">
            {/* AUDIO */}
            <button 
                onClick={toggleAudio}
                className={`h-12 border flex flex-col items-center justify-center gap-1 transition-all group ${
                    isAudioActive 
                    ? 'border-green-500 bg-green-500/10 text-green-500' 
                    : 'border-zinc-800 bg-zinc-900 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                }`}
            >
                <div className="flex items-center gap-1">
                    <Mic className={`w-3 h-3 ${isAudioActive ? 'animate-pulse' : ''}`} />
                    <span className="text-[9px] font-bold">AUDIO</span>
                </div>
            </button>
            
            {/* LIFE */}
            <button 
                onClick={toggleGoL}
                className={`h-12 border flex flex-col items-center justify-center gap-1 transition-all ${
                    isGoLActive 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500' 
                    : 'border-zinc-800 bg-zinc-900 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                }`}
            >
                <div className="flex items-center gap-1">
                    <Activity className={`w-3 h-3 ${isGoLActive ? 'animate-pulse' : ''}`} />
                    <span className="text-[9px] font-bold">LIFE</span>
                </div>
            </button>

            {/* REC */}
             <button 
                onClick={toggleRecord}
                className={`h-12 border flex flex-col items-center justify-center gap-1 transition-all ${
                    isRecording 
                    ? 'border-red-500 bg-red-500/10 text-red-500' 
                    : 'border-zinc-800 bg-zinc-900 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400'
                }`}
            >
                <div className="flex items-center gap-1">
                    {isRecording ? <Radio className="w-3 h-3 animate-pulse" /> : <Video className="w-3 h-3" />}
                    <span className="text-[9px] font-bold">{isRecording ? 'STOP' : 'REC'}</span>
                </div>
            </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-zinc-800 shrink-0">
          <button 
            onClick={() => setActiveTab('module')}
            className={`flex-1 py-2 text-center uppercase font-bold text-[9px] flex items-center justify-center gap-2 transition-colors ${activeTab === 'module' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
              <Sliders className="w-3 h-3" /> Controls
          </button>
          <button 
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-2 text-center uppercase font-bold text-[9px] flex items-center justify-center gap-2 transition-colors ${activeTab === 'system' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
              <Settings className="w-3 h-3" /> System
          </button>
           <button 
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 text-center uppercase font-bold text-[9px] flex items-center justify-center gap-2 transition-colors ${activeTab === 'presets' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
              <Save className="w-3 h-3" /> Presets
          </button>
      </div>

      {/* PARAMETERS SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
        
        {/* MODULE CONTROLS */}
        {activeTab === 'module' && machine.controls.map((control) => (
          <div key={control.id} className="group">
            <div className="flex justify-between items-end mb-2">
                <label className="uppercase text-zinc-400 font-bold tracking-tight">{control.label}</label>
                {control.type === 'number' && (
                    <span className="text-orange-500 bg-orange-500/10 px-1 border border-orange-500/20 font-mono">
                        {typeof params[control.id] === 'number' ? params[control.id].toFixed(control.step && control.step < 1 ? 2 : 0) : params[control.id]}
                    </span>
                )}
            </div>
            
            {control.type === 'number' && (
              <div className="relative h-6 flex items-center">
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={params[control.id]}
                  onChange={(e) => onChange(control.id, parseFloat(e.target.value))}
                />
              </div>
            )}

            {control.type === 'text' && (
                <div className="relative">
                    <span className="absolute left-2 top-2 text-zinc-600">{'>'}</span>
                    <input 
                        type="text" 
                        value={params[control.id]}
                        onChange={(e) => onChange(control.id, e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 pl-5 pr-2 py-2 text-[10px] outline-none focus:border-orange-500 focus:bg-black transition-colors font-mono uppercase"
                    />
                </div>
            )}

            {control.type === 'boolean' && (
                <button
                    onClick={() => onChange(control.id, !params[control.id])}
                    className={`w-full py-2 border flex items-center justify-between px-3 transition-colors ${
                        params[control.id] 
                        ? 'bg-zinc-800 border-zinc-500 text-white' 
                        : 'bg-transparent border-zinc-800 text-zinc-600'
                    }`}
                >
                    <span className="uppercase">{params[control.id] ? 'ENABLED' : 'DISABLED'}</span>
                    <div className={`w-2 h-2 rounded-full ${params[control.id] ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
                </button>
            )}

            {control.type === 'select' && (
               <div className="relative">
                   <select 
                    value={params[control.id]}
                    onChange={(e) => onChange(control.id, e.target.value)}
                    className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-zinc-300 py-2 px-3 text-[10px] outline-none focus:border-orange-500 uppercase rounded-none"
                   >
                     {control.options?.map(opt => (
                         <option key={opt} value={opt}>{opt}</option>
                     ))}
                   </select>
                   <div className="absolute right-3 top-2.5 pointer-events-none text-zinc-500">▼</div>
               </div>
            )}

            {control.type === 'color' && (
                <div className="flex gap-2 items-center">
                    <div className="flex-1 h-8 border border-zinc-700 relative overflow-hidden group-hover:border-zinc-500">
                        <input 
                            type="color" 
                            value={params[control.id]}
                            onChange={(e) => onChange(control.id, e.target.value)}
                            className="absolute -top-4 -left-4 w-24 h-24 cursor-pointer"
                        />
                    </div>
                    <span className="text-zinc-500 uppercase">{params[control.id]}</span>
                </div>
            )}

            {control.type === 'range' && (
                <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            value={Array.isArray(params[control.id]) ? params[control.id][0] : control.min || 0}
                            onChange={(e) => {
                                const current = Array.isArray(params[control.id]) ? params[control.id] : [control.min || 0, control.max || 100];
                                onChange(control.id, [parseFloat(e.target.value), current[1]]);
                            }}
                            className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-200 px-2 py-1 text-[10px] outline-none focus:border-orange-500"
                        />
                        <span className="text-zinc-500">to</span>
                        <input
                            type="number"
                            min={control.min}
                            max={control.max}
                            step={control.step}
                            value={Array.isArray(params[control.id]) ? params[control.id][1] : control.max || 100}
                            onChange={(e) => {
                                const current = Array.isArray(params[control.id]) ? params[control.id] : [control.min || 0, control.max || 100];
                                onChange(control.id, [current[0], parseFloat(e.target.value)]);
                            }}
                            className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-200 px-2 py-1 text-[10px] outline-none focus:border-orange-500"
                        />
                    </div>
                    {control.unit && (
                        <div className="text-[8px] text-zinc-600 text-right">{control.unit}</div>
                    )}
                </div>
            )}

            {control.type === 'angle' && (
                <div className="space-y-2">
                    <div className="relative h-6 flex items-center">
                        <input
                            type="range"
                            min={0}
                            max={360}
                            step={control.step || 1}
                            value={params[control.id] || 0}
                            onChange={(e) => onChange(control.id, parseFloat(e.target.value))}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500 uppercase text-[9px]">
                            {params[control.id] || 0}°
                        </span>
                        <div className="w-12 h-12 border border-zinc-700 rounded-full relative">
                            <div
                                className="absolute top-1/2 left-1/2 w-0.5 h-4 origin-bottom"
                                style={{
                                    transform: `translate(-50%, -100%) rotate(${(params[control.id] || 0) - 90}deg)`,
                                    backgroundColor: 'currentColor',
                                    color: '#f97316'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {control.type === 'multiselect' && (
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                        {control.options?.map(opt => {
                            const selected = Array.isArray(params[control.id]) 
                                ? params[control.id].includes(opt)
                                : false;
                            return (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        const current = Array.isArray(params[control.id]) ? params[control.id] : [];
                                        const updated = selected
                                            ? current.filter(v => v !== opt)
                                            : [...current, opt];
                                        onChange(control.id, updated);
                                    }}
                                    className={`px-2 py-1 text-[9px] uppercase border transition-colors ${
                                        selected
                                            ? 'bg-orange-500 border-orange-500 text-black'
                                            : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                    }`}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {control.type === 'vector2' && (
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[8px] text-zinc-500 uppercase mb-1 block">X</label>
                            <input
                                type="number"
                                value={Array.isArray(params[control.id]) ? params[control.id][0] : 0}
                                onChange={(e) => {
                                    const current = Array.isArray(params[control.id]) ? params[control.id] : [0, 0];
                                    onChange(control.id, [parseFloat(e.target.value) || 0, current[1]]);
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 px-2 py-1 text-[10px] outline-none focus:border-orange-500"
                            />
                        </div>
                        <div>
                            <label className="text-[8px] text-zinc-500 uppercase mb-1 block">Y</label>
                            <input
                                type="number"
                                value={Array.isArray(params[control.id]) ? params[control.id][1] : 0}
                                onChange={(e) => {
                                    const current = Array.isArray(params[control.id]) ? params[control.id] : [0, 0];
                                    onChange(control.id, [current[0], parseFloat(e.target.value) || 0]);
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 px-2 py-1 text-[10px] outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {control.description && (
                <div className="text-[8px] text-zinc-600 mt-1">{control.description}</div>
            )}
          </div>
        ))}

        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
             <div className="space-y-6">
                 <div>
                     <h3 className="text-zinc-300 font-bold uppercase mb-4 border-b border-zinc-800 pb-1">Save Configuration</h3>
                     <div className="flex gap-2">
                         <input 
                            type="text" 
                            placeholder="PRESET NAME..."
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-700 text-white px-3 py-2 text-[10px] outline-none focus:border-orange-500 uppercase placeholder-zinc-600"
                         />
                         <button 
                            onClick={handleSaveClick}
                            disabled={!newPresetName.trim()}
                            className="bg-zinc-800 hover:bg-orange-500 hover:text-white border border-zinc-700 hover:border-orange-600 text-zinc-400 px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                         >
                             <Save className="w-4 h-4" />
                         </button>
                     </div>
                 </div>

                 <div>
                     <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-1">
                        <h3 className="text-zinc-300 font-bold uppercase">Saved Banks</h3>
                        <span className="text-zinc-600 text-[9px]">{currentMachinePresets.length} FOUND</span>
                     </div>
                     
                     <div className="space-y-2">
                        {currentMachinePresets.length === 0 ? (
                            <div className="text-zinc-600 text-center py-8 border border-dashed border-zinc-800 italic">
                                NO PRESETS SAVED FOR THIS MODULE
                            </div>
                        ) : (
                            currentMachinePresets.map(preset => (
                                <div key={preset.id} className="bg-zinc-900/50 border border-zinc-800 p-2 flex items-center justify-between group hover:border-zinc-600 transition-colors">
                                    <div className="overflow-hidden mr-2">
                                        <div className="text-zinc-300 font-bold uppercase truncate">{preset.name}</div>
                                        <div className="text-zinc-600 text-[8px]">{new Date(preset.timestamp).toLocaleDateString()}</div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button 
                                            onClick={() => onLoadPreset(preset)}
                                            className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-green-500 transition-colors"
                                            title="Load"
                                        >
                                            <ArrowUpRight className="w-3 h-3" />
                                        </button>
                                        <button 
                                            onClick={() => onDeletePreset(preset.id)}
                                            className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-red-500 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                     </div>
                 </div>
             </div>
        )}

        {/* SYSTEM SETTINGS */}
        {activeTab === 'system' && (
            <div className="space-y-6">
                
                {/* Transparency Mode */}
                <div>
                     <h3 className="text-zinc-300 font-bold uppercase mb-4 border-b border-zinc-800 pb-1">Export Settings</h3>
                     <button
                        onClick={() => onGlobalChange('transparent', !globalSettings.transparent)}
                        className={`w-full py-3 border flex items-center justify-between px-3 transition-colors mb-2 ${
                            globalSettings.transparent 
                            ? 'bg-zinc-800 border-orange-500 text-white' 
                            : 'bg-transparent border-zinc-800 text-zinc-600'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                             <Layers className="w-4 h-4" />
                             <span className="uppercase">Transparent Background</span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${globalSettings.transparent ? 'bg-orange-500' : 'bg-zinc-700'}`}></div>
                    </button>
                    {/* Audio-Only Mode */}
                    <button
                        onClick={() => onGlobalChange('audioOnly', !globalSettings.audioOnly)}
                        className={`w-full py-3 border flex items-center justify-between px-3 transition-colors mb-2 ${
                            globalSettings.audioOnly 
                            ? 'bg-green-900/20 border-green-500 text-green-300' 
                            : 'bg-transparent border-zinc-800 text-zinc-600'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                             <Mic className="w-4 h-4" />
                             <span className="uppercase">Audio-Only Mode</span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${globalSettings.audioOnly ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
                    </button>
                </div>
                
                {/* Camera Input Selection */}
                <div>
                     <h3 className="text-zinc-300 font-bold uppercase mb-4 border-b border-zinc-800 pb-1">Camera Input</h3>
                     <div className="relative">
                       <select 
                        value={globalSettings.cameraId || ''}
                        onChange={(e) => onGlobalChange('cameraId', e.target.value)}
                        className="w-full appearance-none bg-zinc-900 border border-zinc-700 text-zinc-300 py-2 px-3 text-[10px] outline-none focus:border-orange-500 uppercase rounded-none"
                       >
                         <option value="">DEFAULT WEBCAM</option>
                         {videoDevices.map(d => (
                             <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,5)}...`}</option>
                         ))}
                       </select>
                       <div className="absolute right-3 top-2.5 pointer-events-none text-zinc-500">▼</div>
                   </div>
                </div>

                {/* Audio Section */}
                {isAudioActive ? (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        <h3 className="text-green-500 font-bold uppercase mb-4 border-b border-green-900/30 pb-1">Audio Input</h3>
                        <div className="space-y-4">
                            <div className="group">
                                 <div className="flex justify-between items-end mb-2">
                                    <label className="text-zinc-400">Input Gain</label>
                                    <span className="text-green-500 bg-green-500/10 px-1">{globalSettings.audioGain.toFixed(1)}x</span>
                                </div>
                                <input 
                                    type="range" min="0.1" max="5.0" step="0.1"
                                    value={globalSettings.audioGain}
                                    onChange={(e) => onGlobalChange('audioGain', parseFloat(e.target.value))}
                                />
                                <div className="text-[8px] text-zinc-600 mt-1">Amplify microphone sensitivity</div>
                            </div>
                            <div className="group">
                                 <div className="flex justify-between items-end mb-2">
                                    <label className="text-zinc-400">Response Smoothing</label>
                                    <span className="text-green-500 bg-green-500/10 px-1">{globalSettings.audioSmooth.toFixed(2)}</span>
                                </div>
                                <input 
                                    type="range" min="0.0" max="0.95" step="0.05"
                                    value={globalSettings.audioSmooth}
                                    onChange={(e) => onGlobalChange('audioSmooth', parseFloat(e.target.value))}
                                />
                                <div className="text-[8px] text-zinc-600 mt-1">Higher = smoother, less reactive</div>
                            </div>
                            <div className="group">
                                 <div className="flex justify-between items-end mb-2">
                                    <label className="text-zinc-400">Audio Hold Time</label>
                                    <span className="text-green-500 bg-green-500/10 px-1">{globalSettings.audioHold}ms</span>
                                </div>
                                <input 
                                    type="range" min="0" max="500" step="50"
                                    value={globalSettings.audioHold || 200}
                                    onChange={(e) => onGlobalChange('audioHold', parseFloat(e.target.value))}
                                />
                                <div className="text-[8px] text-zinc-600 mt-1">Keep animating after audio stops</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="opacity-50 text-center p-4 border border-dashed border-zinc-800 text-zinc-600 rounded-sm">
                        <Mic className="w-4 h-4 mx-auto mb-2 opacity-50"/>
                        <span className="block uppercase tracking-wide font-bold">Audio Disabled</span>
                        <span className="block text-[8px] mt-1">Enable AUDIO toggle to configure input sensitivity</span>
                    </div>
                )}

                {/* GoL Section */}
                {isGoLActive ? (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        <h3 className="text-blue-500 font-bold uppercase mb-4 border-b border-blue-900/30 pb-1">Game of Life</h3>
                        <div className="space-y-4">
                            <div className="group">
                                 <div className="flex justify-between items-end mb-2">
                                    <label className="text-zinc-400">Generation Speed</label>
                                    <span className="text-blue-500 bg-blue-500/10 px-1">{globalSettings.golSpeed}ms</span>
                                </div>
                                <input 
                                    type="range" min="16" max="1000" step="10"
                                    value={globalSettings.golSpeed}
                                    onChange={(e) => onGlobalChange('golSpeed', parseFloat(e.target.value))}
                                    className="rtl"
                                />
                                <div className="flex justify-between text-[8px] text-zinc-600 mt-1">
                                    <span>FAST</span>
                                    <span>SLOW</span>
                                </div>
                                <div className="text-[8px] text-zinc-600 mt-1">Time between generations</div>
                            </div>
                            <div className="group">
                                 <div className="flex justify-between items-end mb-2">
                                    <label className="text-zinc-400">Interaction Sensitivity</label>
                                    <span className="text-blue-500 bg-blue-500/10 px-1">{globalSettings.golThreshold.toFixed(2)}</span>
                                </div>
                                <input 
                                    type="range" min="0.1" max="0.9" step="0.1"
                                    value={globalSettings.golThreshold}
                                    onChange={(e) => onGlobalChange('golThreshold', parseFloat(e.target.value))}
                                />
                                <div className="text-[8px] text-zinc-600 mt-1">Higher = less glitch, cleaner image</div>
                            </div>
                            <div className="group">
                                 <div className="flex justify-between items-end mb-2">
                                    <label className="text-zinc-400">Initial Cell Density</label>
                                    <span className="text-blue-500 bg-blue-500/10 px-1">{globalSettings.golDensity.toFixed(1)}</span>
                                </div>
                                <input 
                                    type="range" min="0.1" max="0.9" step="0.1"
                                    value={globalSettings.golDensity}
                                    onChange={(e) => onGlobalChange('golDensity', parseFloat(e.target.value))}
                                />
                                <div className="text-[8px] text-zinc-600 mt-1">Density when grid resets</div>
                            </div>
                            <div className="group">
                                 <div className="flex justify-between items-end mb-2">
                                    <label className="text-zinc-400">Grid Width (Cols)</label>
                                    <span className="text-blue-500 bg-blue-500/10 px-1">{globalSettings.golCols || 50}</span>
                                </div>
                                <input 
                                    type="range" min="10" max="100" step="5"
                                    value={globalSettings.golCols || 50}
                                    onChange={(e) => onGlobalChange('golCols', parseFloat(e.target.value))}
                                />
                                <div className="text-[8px] text-zinc-600 mt-1">Number of columns</div>
                            </div>
                            <div className="group">
                                 <div className="flex justify-between items-end mb-2">
                                    <label className="text-zinc-400">Grid Height (Rows)</label>
                                    <span className="text-blue-500 bg-blue-500/10 px-1">{globalSettings.golRows || 50}</span>
                                </div>
                                <input 
                                    type="range" min="10" max="100" step="5"
                                    value={globalSettings.golRows || 50}
                                    onChange={(e) => onGlobalChange('golRows', parseFloat(e.target.value))}
                                />
                                <div className="text-[8px] text-zinc-600 mt-1">Number of rows</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="opacity-50 text-center p-4 border border-dashed border-zinc-800 text-zinc-600 rounded-sm">
                        <Activity className="w-4 h-4 mx-auto mb-2 opacity-50"/>
                        <span className="block uppercase tracking-wide font-bold">Simulation Halted</span>
                        <span className="block text-[8px] mt-1">Enable LIFE toggle to configure simulation</span>
                    </div>
                )}

                {/* Global Multipliers */}
                <div className="mt-4">
                    <h3 className="text-zinc-300 font-bold uppercase mb-4 border-b border-zinc-800 pb-1">Global Multipliers</h3>
                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-zinc-400">Size Multiplier</label>
                                <span className="text-zinc-300 bg-zinc-900 px-1">{globalSettings.sizeMultiplier?.toFixed(2)}x</span>
                            </div>
                            <input type="range" min="0.1" max="4" step="0.05" value={globalSettings.sizeMultiplier || 1} onChange={(e) => onGlobalChange('sizeMultiplier', parseFloat(e.target.value))} />
                            <div className="text-[8px] text-zinc-600 mt-1">Scales all size-related parameters</div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-zinc-400">Speed Multiplier</label>
                                <span className="text-zinc-300 bg-zinc-900 px-1">{globalSettings.speedMultiplier?.toFixed(2)}x</span>
                            </div>
                            <input type="range" min="0.1" max="4" step="0.05" value={globalSettings.speedMultiplier || 1} onChange={(e) => onGlobalChange('speedMultiplier', parseFloat(e.target.value))} />
                            <div className="text-[8px] text-zinc-600 mt-1">Scales all speed-related parameters</div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="text-zinc-400">Audio Trigger Level</label>
                                <span className="text-zinc-300 bg-zinc-900 px-1">{globalSettings.audioTriggerThreshold?.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0.0" max="0.5" step="0.01" value={globalSettings.audioTriggerThreshold || 0.05} onChange={(e) => onGlobalChange('audioTriggerThreshold', parseFloat(e.target.value))} />
                            <div className="text-[8px] text-zinc-600 mt-1">Minimum volume to trigger animation</div>
                        </div>
                    </div>
                </div>

            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950 shrink-0">
        <button 
            onClick={onRandomize}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:border-zinc-600 flex items-center justify-center gap-2 transition-all uppercase font-bold tracking-wider"
        >
            <RefreshCcw className="w-3 h-3" />
            Randomize Parameters
        </button>
      </div>
    </div>
  );
};

export default ControlRack;
