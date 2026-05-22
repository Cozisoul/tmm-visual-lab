import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import CanvasStage from '../components/CanvasStage';
import AudioDebugOverlay from '../components/AudioDebugOverlay';
import { GlobalSettings } from '../types';

describe('Basic app smoke', () => {
  test('App renders without crashing', () => {
    render(<App />);
    // Check for PROJECTOR button
    expect(screen.getByText(/PROJECTOR/i)).toBeInTheDocument();
  });

  test('CanvasStage renders a canvas', () => {
    const params = { size: 10, speed: 1 } as any;
    const settings = { sizeMultiplier: 1, speedMultiplier: 1 } as GlobalSettings;
    const { container } = render(
      <CanvasStage machine={null} params={params} resolution={{ width: 400, height: 300 }} audioActive={false} golActive={false} recording={false} projectorMode={false} globalSettings={settings} />
    );
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  test('AudioDebugOverlay shows bars', () => {
    const params = { size: 10, speed: 1 } as any;
    const settings = { sizeMultiplier: 1, speedMultiplier: 1 } as any;
    render(<AudioDebugOverlay params={params} settings={settings} />);
    expect(screen.getByText(/AUDIO DEBUG/i)).toBeInTheDocument();
  });
});
