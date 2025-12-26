import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';

/**
 * Auto-save hook
 * Periodically saves the project based on user settings
 */
export function useAutoSave() {
  const { autoSaveEnabled, autoSaveInterval } = useUIStore();
  const {
    currentFilePath,
    hasUnsavedChanges,
    getProjectFile,
    markSaved,
  } = useProjectStore();

  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Save function
  const performAutoSave = async () => {
    // Don't auto-save if:
    // - No file path (project hasn't been saved yet)
    // - No unsaved changes
    // - Currently saving
    if (!currentFilePath || !hasUnsavedChanges || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      if (!window.electronAPI || !window.electronAPI.writeFile) {
        console.error('Electron API not available for auto-save');
        setIsSaving(false);
        return;
      }

      const projectFile = getProjectFile();
      const json = JSON.stringify(projectFile, null, 2);

      const result = await window.electronAPI.writeFile(currentFilePath, json);

      if (result.success) {
        markSaved(currentFilePath);
        setLastSaveTime(new Date());
        console.log('Auto-save successful at', new Date().toLocaleTimeString());
      } else {
        console.error('Auto-save failed:', result.error);
      }
    } catch (error) {
      console.error('Error during auto-save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Set up auto-save timer
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only set up timer if auto-save is enabled
    if (!autoSaveEnabled) {
      return;
    }

    // Convert minutes to milliseconds
    const intervalMs = autoSaveInterval * 60 * 1000;

    // Set up periodic auto-save
    timerRef.current = setInterval(() => {
      performAutoSave();
    }, intervalMs);

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoSaveEnabled, autoSaveInterval, currentFilePath, hasUnsavedChanges]);

  return {
    lastSaveTime,
    isSaving,
  };
}
