import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { ProjectFile } from '@/types';
import { registerFileHandlers } from '@/hooks/useKeyboardShortcuts';

export function AppMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, requestExportPNG, requestExportPDF } = useUIStore();

  const {
    projectInfo,
    currentFilePath,
    hasUnsavedChanges,
    getProjectFile,
    loadProject,
    newProject,
    markSaved,
  } = useProjectStore();

  // Register file handlers for keyboard shortcuts
  useEffect(() => {
    registerFileHandlers({
      handleNew,
      handleOpen,
      handleSave,
      handleSaveAs,
    });
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNew = async () => {
    setIsOpen(false);
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
    setIsOpen(false);
    if (currentFilePath) {
      await saveToFile(currentFilePath);
    } else {
      await handleSaveAs();
    }
  };

  const handleSaveAs = async () => {
    setIsOpen(false);
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
    setIsOpen(false);
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

  const handleExportPNG = () => {
    setIsOpen(false);
    requestExportPNG();
  };

  const handleExportPDF = () => {
    setIsOpen(false);
    requestExportPDF();
  };

  const handleQuit = async () => {
    setIsOpen(false);
    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Quit anyway?');
      if (!confirmed) return;
    }

    if (!window.electronAPI || !window.electronAPI.quit) {
      alert('Electron API not available. Make sure you are running in Electron.');
      console.error('window.electronAPI.quit is undefined');
      return;
    }

    try {
      await window.electronAPI.quit();
    } catch (error) {
      console.error('Error quitting app:', error);
    }
  };

  // Theme-based colors
  const colors = {
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    menuBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    menuText: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-blue-800' : 'border-gray-300',
    hover: theme === 'dark' ? 'hover:bg-[#3a3a3a]' : theme === 'blueprint' ? 'hover:bg-[#2E4A9A]' : 'hover:bg-gray-100',
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`text-2xl font-bold ${colors.text} hover:opacity-80 transition-opacity flex items-center gap-1`}
      >
        DraftPlan{hasUnsavedChanges ? '*' : ''}
        {isHovered && (
          <span className="text-sm">▼</span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-48 ${colors.menuBg} border ${colors.border} rounded shadow-lg z-50`}>
          <button
            onClick={handleNew}
            className={`w-full text-left px-4 py-2 text-sm ${colors.menuText} ${colors.hover} transition-colors`}
          >
            New
            <span className="float-right text-xs opacity-60">⌘N</span>
          </button>

          <button
            onClick={handleOpen}
            className={`w-full text-left px-4 py-2 text-sm ${colors.menuText} ${colors.hover} transition-colors`}
          >
            Open
            <span className="float-right text-xs opacity-60">⌘O</span>
          </button>

          <div className={`border-t ${colors.border} my-1`} />

          <button
            onClick={handleSave}
            className={`w-full text-left px-4 py-2 text-sm ${colors.menuText} ${colors.hover} transition-colors`}
          >
            Save
            <span className="float-right text-xs opacity-60">⌘S</span>
          </button>

          <button
            onClick={handleSaveAs}
            className={`w-full text-left px-4 py-2 text-sm ${colors.menuText} ${colors.hover} transition-colors`}
          >
            Save As...
            <span className="float-right text-xs opacity-60">⇧⌘S</span>
          </button>

          <div className={`border-t ${colors.border} my-1`} />

          <button
            onClick={handleExportPNG}
            className={`w-full text-left px-4 py-2 text-sm ${colors.menuText} ${colors.hover} transition-colors`}
          >
            Export PNG
          </button>

          <button
            onClick={handleExportPDF}
            className={`w-full text-left px-4 py-2 text-sm ${colors.menuText} ${colors.hover} transition-colors`}
          >
            Export PDF
          </button>

          <div className={`border-t ${colors.border} my-1`} />

          <button
            onClick={handleQuit}
            className={`w-full text-left px-4 py-2 text-sm ${colors.menuText} ${colors.hover} transition-colors`}
          >
            Quit
            <span className="float-right text-xs opacity-60">⌘Q</span>
          </button>
        </div>
      )}
    </div>
  );
}
