import { useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { ProjectFile } from '@/types';
import { registerFileHandlers } from '@/hooks/useKeyboardShortcuts';

export function FileMenu() {
  const {
    projectInfo,
    currentFilePath,
    hasUnsavedChanges,
    getProjectFile,
    loadProject,
    newProject,
    markSaved,
  } = useProjectStore();

  const handleNew = async () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Create a new project anyway?');
      if (!confirmed) return;
    }

    const projectName = prompt('Enter project name:', 'Untitled Project');
    if (projectName !== null) {
      newProject(projectName);
    }
  };

  const handleSave = async () => {
    if (currentFilePath) {
      await saveToFile(currentFilePath);
    } else {
      await handleSaveAs();
    }
  };

  const handleSaveAs = async () => {
    if (!window.electronAPI) {
      alert('Electron API not available. Make sure you are running in Electron.');
      console.error('window.electronAPI is undefined');
      return;
    }

    try {
      const defaultPath = `${projectInfo.name.replace(/[^a-z0-9]/gi, '_')}.draftplan`;
      const result = await window.electronAPI.showSaveDialog(defaultPath);

      if (!result.canceled && result.filePath) {
        await saveToFile(result.filePath);
      }
    } catch (error) {
      console.error('Error in handleSaveAs:', error);
      alert(`Error opening save dialog: ${(error as Error).message}`);
    }
  };

  const saveToFile = async (filePath: string) => {
    if (!window.electronAPI || !window.electronAPI.writeFile) {
      alert('Electron API not available. Make sure you are running in Electron.');
      console.error('window.electronAPI or writeFile method is undefined', window.electronAPI);
      return;
    }

    try {
      const projectFile = getProjectFile();
      const json = JSON.stringify(projectFile, null, 2);

      const result = await window.electronAPI.writeFile(filePath, json);

      if (result.success) {
        markSaved(filePath);
        alert('Project saved successfully!');
      } else {
        alert(`Failed to save project: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in saveToFile:', error);
      alert(`Error saving file: ${(error as Error).message}`);
    }
  };

  const handleOpen = async () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Open a different project anyway?');
      if (!confirmed) return;
    }

    if (!window.electronAPI) {
      alert('Electron API not available. Make sure you are running in Electron.');
      console.error('window.electronAPI is undefined');
      return;
    }

    try {
      const result = await window.electronAPI.showOpenDialog();

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileResult = await window.electronAPI.readFile(filePath);

        if (fileResult.success && fileResult.data) {
          try {
            const project: ProjectFile = JSON.parse(fileResult.data);
            loadProject(project, filePath);
            alert('Project loaded successfully!');
          } catch (error) {
            alert(`Failed to parse project file: ${(error as Error).message}`);
          }
        } else {
          alert(`Failed to read project file: ${fileResult.error}`);
        }
      }
    } catch (error) {
      console.error('Error in handleOpen:', error);
      alert(`Error opening file dialog: ${(error as Error).message}`);
    }
  };

  // Register file handlers for keyboard shortcuts
  useEffect(() => {
    registerFileHandlers({
      handleNew,
      handleOpen,
      handleSave,
      handleSaveAs,
    });
  }, []);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleNew}
        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        title="New Project (Cmd/Ctrl+N)"
      >
        New
      </button>
      <button
        onClick={handleOpen}
        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        title="Open Project (Cmd/Ctrl+O)"
      >
        Open
      </button>
      <button
        onClick={handleSave}
        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        title="Save Project (Cmd/Ctrl+S)"
      >
        Save{hasUnsavedChanges ? '*' : ''}
      </button>
      <button
        onClick={handleSaveAs}
        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        title="Save As... (Cmd/Ctrl+Shift+S)"
      >
        Save As...
      </button>
      {currentFilePath && (
        <span className="text-xs text-gray-500 ml-2">
          {projectInfo.name}
        </span>
      )}
    </div>
  );
}
