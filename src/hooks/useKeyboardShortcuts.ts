/**
 * useKeyboardShortcuts: Global keyboard shortcut system
 */

import { useEffect, useCallback } from 'react';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description?: string;
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === e.ctrlKey;
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === e.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === e.altKey;
        const metaMatch = shortcut.meta === undefined || shortcut.meta === e.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export const createShortcut = (
  key: string,
  action: () => void,
  options?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    description?: string;
  }
): Shortcut => ({
  key,
  action,
  ...options,
});

export const formatShortcut = (shortcut: Shortcut): string => {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.meta) parts.push('Cmd');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.toUpperCase());
  return parts.join(' + ');
};

