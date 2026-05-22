import React, { useEffect, useState } from 'react';
import { AudioService } from '../src/services/AudioService';
import { processParametersWithAudio, getAudioMetrics } from '../src/utils/params';
import { SketchParams, GlobalSettings } from '../src/types';

interface Props {
  params: SketchParams;
  settings: GlobalSettings;
}

const bar = (value: number, cols = 20) => {
  const filled = Math.round(value * cols);
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, cols - filled));
};

const AudioDebugOverlay: React.FC<Props> = ({ params, settings }) => {
  const [audio, setAudio] = useState(AudioService.getAnalysis());
  const [mod, setMod] = useState(() => processParametersWithAudio(params, settings, { audio } as any));

  useEffect(() => {
    const id = setInterval(() => {
      const a = AudioService.getAnalysis();
      setAudio(a);
      try {
        setMod(processParametersWithAudio(params, settings, { audio: a } as any));
      } catch (e) {}
    }, 120);
    return () => clearInterval(id);
  }, [params, settings]);

  const metrics = getAudioMetrics(audio);

  // Find representative numeric keys for display
  const numericKeys = Object.keys(params).filter(k => typeof params[k] === 'number');
  const sampleKeys = numericKeys.slice(0, 8);

  return (
    <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 60, color: '#0f0', background: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 6, fontFamily: 'monospace', fontSize: 12, minWidth: 280 }}>
      <div style={{ marginBottom: 6, fontWeight: 700 }}>AUDIO DEBUG</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div>VOL {metrics.volume.toFixed(2)}</div>
          <div style={{ color: '#6ee7b7' }}>{bar(metrics.volume, 16)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div>BASS {metrics.bass.toFixed(2)}</div>
          <div style={{ color: '#60a5fa' }}>{bar(metrics.bass, 16)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div>MID {metrics.mid.toFixed(2)}</div>
          <div style={{ color: '#fca5a5' }}>{bar(metrics.mid, 16)}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div>TRE {metrics.treble.toFixed(2)}</div>
          <div style={{ color: '#fde68a' }}>{bar(metrics.treble, 16)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ marginBottom: 4, fontWeight: 700 }}>Modulation</div>
        <div>size×{metrics.bassFactor.toFixed(2)} • speed×{metrics.speedFactor.toFixed(2)} • tre×{metrics.trebleFactor.toFixed(2)} • α×{metrics.opacityFactor.toFixed(2)}</div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ marginBottom: 4, fontWeight: 700 }}>Sample params (orig → mod)</div>
        {sampleKeys.map(k => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ color: '#9ca3af' }}>{k}</div>
            <div>{(params[k] as number).toFixed(2)} → {(mod[k] as number).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: '#9ca3af' }}>Press Projector → then use FULLSCREEN in the projector window (or double-click).</div>
    </div>
  );
};

export default AudioDebugOverlay;


