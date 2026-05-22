/**
 * useCanvasRecording: Handle canvas to video recording
 */

import React, { useRef, useCallback } from 'react';

interface UseCanvasRecordingProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onComplete?: () => void;
}

export const useCanvasRecording = ({ canvasRef, onComplete }: UseCanvasRecordingProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false);

  const startRecording = useCallback(() => {
    if (!canvasRef.current || mediaRecorderRef.current) return;

    try {
      const stream = (canvasRef.current as any).captureStream
        ? (canvasRef.current as any).captureStream(60)
        : (canvasRef.current as any).webkitCaptureStream(60);

      if (!stream) throw new Error('Stream capture not supported');

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TMM-OS-REC-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        chunksRef.current = [];
        isRecordingRef.current = false;
        onComplete?.();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;
    } catch (e) {
      console.error('Recording failed', e);
      isRecordingRef.current = false;
      onComplete?.();
    }
  }, [canvasRef, onComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  return { startRecording, stopRecording, isRecording: isRecordingRef.current };
};
