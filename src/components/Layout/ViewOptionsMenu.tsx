import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export function ViewOptionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    gridVisible,
    rulersVisible,
    minorGridVisible,
    viewCubeVisible,
    gizmoVisible,
    libraryPanelOpen,
    propertiesPanelOpen,
    controlsPanelOpen,
    assembliesPanelOpen,
    projectDetailsPanelOpen,
    theme,
    toggleGrid,
    toggleRulers,
    toggleMinorGrid,
    toggleViewCube,
    toggleGizmo,
    toggleLibraryPanel,
    togglePropertiesPanel,
    toggleControlsPanel,
    toggleAssembliesPanel,
    toggleProjectDetailsPanel,
    toggleCutListModal,
    setTheme,
  } = useUIStore();

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          px-3 py-1 text-sm border border-gray-300 rounded transition-colors
          ${isOpen ? 'bg-gray-200' : 'hover:bg-gray-100'}
        `}
        title="View Options (Cmd/Ctrl+Shift+V)"
      >
        View
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-300 rounded shadow-lg z-50">
          {/* Grid Section */}
          <div className="p-2 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Grid</div>

            <button
              onClick={toggleGrid}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>All Grids</span>
              <span className="text-xs text-gray-500">
                {gridVisible && '✓'}
              </span>
            </button>

            <button
              onClick={toggleMinorGrid}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>1/16" Grid</span>
              <span className="text-xs text-gray-500">
                {minorGridVisible && '✓'}
              </span>
            </button>
          </div>

          {/* Canvas Section */}
          <div className="p-2 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Canvas</div>

            <button
              onClick={toggleRulers}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Rulers</span>
              <span className="text-xs text-gray-500">
                {rulersVisible && '✓'}
              </span>
            </button>

            <button
              onClick={toggleViewCube}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>View Cube</span>
              <span className="text-xs text-gray-500">
                {viewCubeVisible && '✓'}
              </span>
            </button>

            <button
              onClick={toggleGizmo}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Transform Gizmo</span>
              <span className="text-xs text-gray-500">
                {gizmoVisible && '✓'}
              </span>
            </button>
          </div>

          {/* Panels Section */}
          <div className="p-2 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Panels</div>

            <button
              onClick={toggleLibraryPanel}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Library Panel</span>
              <span className="text-xs text-gray-500">
                {libraryPanelOpen && '✓'}
              </span>
            </button>

            <button
              onClick={toggleProjectDetailsPanel}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Project Details</span>
              <span className="text-xs text-gray-500">
                {projectDetailsPanelOpen && '✓'}
              </span>
            </button>

            <button
              onClick={togglePropertiesPanel}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Properties Panel</span>
              <span className="text-xs text-gray-500">
                {propertiesPanelOpen && '✓'}
              </span>
            </button>

            <button
              onClick={toggleControlsPanel}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Controls</span>
              <span className="text-xs text-gray-500">
                {controlsPanelOpen && '✓'}
              </span>
            </button>

            <button
              onClick={toggleAssembliesPanel}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Assemblies Panel</span>
              <span className="text-xs text-gray-500">
                {assembliesPanelOpen && '✓'}
              </span>
            </button>

            <button
              onClick={toggleCutListModal}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Cut List</span>
            </button>
          </div>

          {/* Theme Section */}
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">Theme</div>

            <button
              onClick={() => setTheme('light')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Light</span>
              <span className="text-xs text-gray-500">
                {theme === 'light' && '✓'}
              </span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Dark</span>
              <span className="text-xs text-gray-500">
                {theme === 'dark' && '✓'}
              </span>
            </button>

            <button
              onClick={() => setTheme('blueprint')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            >
              <span>Blueprint</span>
              <span className="text-xs text-gray-500">
                {theme === 'blueprint' && '✓'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
