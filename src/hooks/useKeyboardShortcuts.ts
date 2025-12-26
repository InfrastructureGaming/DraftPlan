import { useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

// File operation handlers will be set by FileMenu component
let fileHandlers = {
  handleNew: null as (() => void) | null,
  handleOpen: null as (() => void) | null,
  handleSave: null as (() => void) | null,
  handleSaveAs: null as (() => void) | null,
};

export function registerFileHandlers(handlers: typeof fileHandlers) {
  fileHandlers = handlers;
}

/**
 * Global keyboard shortcuts handler
 * Manages all keyboard shortcuts for the application
 */
export function useKeyboardShortcuts() {
  const {
    setView,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedObjectIds,
    removeObject,
    clearSelection,
    objects,
    selectObject,
  } = useProjectStore();

  const {
    toggleGrid,
    toggleRulers,
    toggleLibraryPanel,
    togglePropertiesPanel,
    toggleSettingsModal,
  } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // View switching (1-6)
      if (!modifier && !e.shiftKey && !e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setView('front');
            return;
          case '2':
            e.preventDefault();
            setView('back');
            return;
          case '3':
            e.preventDefault();
            setView('left');
            return;
          case '4':
            e.preventDefault();
            setView('right');
            return;
          case '5':
            e.preventDefault();
            setView('top');
            return;
          case '6':
            e.preventDefault();
            setView('bottom');
            return;
        }
      }

      // File operations
      if (modifier && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        if (fileHandlers.handleNew) fileHandlers.handleNew();
        return;
      }

      if (modifier && e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        if (fileHandlers.handleOpen) fileHandlers.handleOpen();
        return;
      }

      if (modifier && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          if (fileHandlers.handleSaveAs) fileHandlers.handleSaveAs();
        } else {
          if (fileHandlers.handleSave) fileHandlers.handleSave();
        }
        return;
      }

      // Undo/Redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y)
      if (modifier && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo()) redo();
        } else {
          if (canUndo()) undo();
        }
        return;
      }

      if (modifier && e.key === 'y') {
        e.preventDefault();
        if (canRedo()) redo();
        return;
      }

      // Delete selected objects (Delete or Backspace)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !modifier) {
        if (selectedObjectIds.length > 0) {
          e.preventDefault();
          selectedObjectIds.forEach((id) => removeObject(id));
        }
        return;
      }

      // Deselect all (Escape)
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Toggle Grid (Cmd/Ctrl+')
      if (modifier && e.key === "'") {
        e.preventDefault();
        toggleGrid();
        return;
      }

      // Toggle Rulers (Cmd/Ctrl+R)
      if (modifier && e.key === 'r') {
        e.preventDefault();
        toggleRulers();
        return;
      }

      // Toggle Library Panel (Cmd/Ctrl+L)
      if (modifier && e.key === 'l') {
        e.preventDefault();
        toggleLibraryPanel();
        return;
      }

      // Toggle Properties Panel (Cmd/Ctrl+P)
      if (modifier && e.key === 'p') {
        e.preventDefault();
        togglePropertiesPanel();
        return;
      }

      // Open Settings (Cmd/Ctrl+,)
      if (modifier && e.key === ',') {
        e.preventDefault();
        toggleSettingsModal();
        return;
      }

      // Select All (Cmd/Ctrl+A)
      if (modifier && e.key === 'a') {
        e.preventDefault();
        // Select all objects on the canvas
        objects.forEach((obj) => {
          if (!selectedObjectIds.includes(obj.id)) {
            selectObject(obj.id, true); // multi-select mode
          }
        });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    setView,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedObjectIds,
    removeObject,
    clearSelection,
    toggleGrid,
    toggleRulers,
    toggleLibraryPanel,
    togglePropertiesPanel,
    toggleSettingsModal,
  ]);
}
