/**
 * Keyboard Shortcuts Hook
 * Handles global keyboard shortcuts for the dashboard
 */

import { useEffect, useCallback } from 'react';
import { useUIStore } from './useStore';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
}

export function useKeyboardShortcuts() {
  const {
    openAddAppWizard,
    openSettings,
    closeAddAppWizard,
    closeSettings,
    closeAppDetails,
    closePromptModal,
    closeConfirmDelete,
    isAddAppWizardOpen,
    isSettingsOpen,
    isAppDetailsOpen,
    isPromptModalOpen,
    isConfirmDeleteOpen,
  } = useUIStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape to close modals even in inputs
      if (e.key !== 'Escape') {
        return;
      }
    }

    const shortcuts: ShortcutConfig[] = [
      // Ctrl+N: New Application
      {
        key: 'n',
        ctrl: true,
        handler: () => {
          e.preventDefault();
          openAddAppWizard();
        },
      },
      // Ctrl+,: Open Settings
      {
        key: ',',
        ctrl: true,
        handler: () => {
          e.preventDefault();
          openSettings();
        },
      },
      // Escape: Close any open modal
      {
        key: 'Escape',
        handler: () => {
          if (isConfirmDeleteOpen) {
            closeConfirmDelete();
          } else if (isPromptModalOpen) {
            closePromptModal();
          } else if (isAppDetailsOpen) {
            closeAppDetails();
          } else if (isSettingsOpen) {
            closeSettings();
          } else if (isAddAppWizardOpen) {
            closeAddAppWizard();
          }
        },
      },
    ];

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

      if (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlMatch &&
        altMatch &&
        shiftMatch
      ) {
        shortcut.handler();
        break;
      }
    }
  }, [
    openAddAppWizard,
    openSettings,
    closeAddAppWizard,
    closeSettings,
    closeAppDetails,
    closePromptModal,
    closeConfirmDelete,
    isAddAppWizardOpen,
    isSettingsOpen,
    isAppDetailsOpen,
    isPromptModalOpen,
    isConfirmDeleteOpen,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Export shortcut descriptions for help display
export const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+N', description: 'New Application', descriptionHe: 'אפליקציה חדשה' },
  { keys: 'Ctrl+,', description: 'Open Settings', descriptionHe: 'פתח הגדרות' },
  { keys: 'Escape', description: 'Close Modal', descriptionHe: 'סגור חלון' },
];
