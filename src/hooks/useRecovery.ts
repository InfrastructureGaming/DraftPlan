import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';

const RECOVERY_FILE_PATH = 'recovery.draftplan.tmp';

/**
 * Recovery hook
 * Periodically saves a recovery file and checks for recovery on startup
 */
export function useRecovery() {
  const { getProjectFile, loadProject, hasUnsavedChanges } = useProjectStore();
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCheckedRecovery = useRef(false);

  // Save recovery file
  const saveRecoveryFile = async () => {
    if (!window.electronAPI || !window.electronAPI.writeFile) {
      return;
    }

    try {
      const projectFile = getProjectFile();
      const json = JSON.stringify(projectFile, null, 2);
      await window.electronAPI.writeFile(RECOVERY_FILE_PATH, json);
    } catch (error) {
      console.error('Error saving recovery file:', error);
    }
  };

  // Check for recovery file on startup
  useEffect(() => {
    const checkRecovery = async () => {
      if (hasCheckedRecovery.current) return;
      hasCheckedRecovery.current = true;

      if (!window.electronAPI || !window.electronAPI.readFile) {
        setIsCheckingRecovery(false);
        return;
      }

      try {
        const result = await window.electronAPI.readFile(RECOVERY_FILE_PATH);

        if (result.success && result.data) {
          // Recovery file exists
          setRecoveryAvailable(true);
        }
      } catch (error) {
        console.error('Error checking recovery file:', error);
      } finally {
        setIsCheckingRecovery(false);
      }
    };

    checkRecovery();
  }, []);

  // Recover from recovery file
  const recoverProject = async () => {
    if (!window.electronAPI || !window.electronAPI.readFile) {
      alert('Electron API not available');
      return false;
    }

    try {
      const result = await window.electronAPI.readFile(RECOVERY_FILE_PATH);

      if (result.success && result.data) {
        const projectFile = JSON.parse(result.data);
        loadProject(projectFile, ''); // Load without file path (force Save As)
        setRecoveryAvailable(false);

        // Delete recovery file after successful recovery
        await deleteRecoveryFile();

        alert('Project recovered successfully! Please save your work.');
        return true;
      }
    } catch (error) {
      console.error('Error recovering project:', error);
      alert(`Failed to recover project: ${(error as Error).message}`);
    }

    return false;
  };

  // Delete recovery file
  const deleteRecoveryFile = async () => {
    if (!window.electronAPI || !window.electronAPI.deleteFile) {
      return;
    }

    try {
      await window.electronAPI.deleteFile(RECOVERY_FILE_PATH);
    } catch (error) {
      console.error('Error deleting recovery file:', error);
    }
  };

  // Dismiss recovery (delete the recovery file)
  const dismissRecovery = async () => {
    await deleteRecoveryFile();
    setRecoveryAvailable(false);
  };

  // Set up periodic recovery file saving (every 60 seconds)
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Set up periodic recovery save (every 60 seconds)
    timerRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        saveRecoveryFile();
      }
    }, 60000); // 1 minute

    // Also save immediately when there are changes
    if (hasUnsavedChanges) {
      saveRecoveryFile();
    }

    // Cleanup on unmount - save one last time and then delete recovery file
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Delete recovery file on clean exit
      deleteRecoveryFile();
    };
  }, [hasUnsavedChanges]);

  return {
    recoveryAvailable,
    isCheckingRecovery,
    recoverProject,
    dismissRecovery,
  };
}
