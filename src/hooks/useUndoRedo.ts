/**
 * useUndoRedo: Undo/Redo system for parameter changes
 */

import { useState, useCallback, useRef } from 'react';
import { SketchParams } from '../types';

interface UseUndoRedoProps {
  params: SketchParams;
  maxHistory?: number;
}

export const useUndoRedo = ({ params, maxHistory = 50 }: UseUndoRedoProps) => {
  const [history, setHistory] = useState<SketchParams[]>([{ ...params }]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoingRef = useRef(false);

  const addToHistory = useCallback((newParams: SketchParams) => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push({ ...newParams });
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  const undo = useCallback((): SketchParams | null => {
    if (currentIndex <= 0) return null;
    
    isUndoingRef.current = true;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return { ...history[newIndex] };
  }, [currentIndex, history]);

  const redo = useCallback((): SketchParams | null => {
    if (currentIndex >= history.length - 1) return null;
    
    isUndoingRef.current = true;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return { ...history[newIndex] };
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex,
  };
};

