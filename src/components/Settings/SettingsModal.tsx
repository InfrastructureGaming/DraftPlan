import { useUIStore } from '@/stores/uiStore';

export function SettingsModal() {
  const {
    theme,
    gridVisible,
    rulersVisible,
    majorGridSize,
    minorGridVisible,
    snapIncrement,
    autoSaveEnabled,
    autoSaveInterval,
    setTheme,
    toggleGrid,
    toggleRulers,
    setMajorGridSize,
    toggleMinorGrid,
    setSnapIncrement,
    setAutoSaveEnabled,
    setAutoSaveInterval,
    toggleSettingsModal,
  } = useUIStore();

  // Theme-based colors
  const colors = {
    backdrop: 'bg-black bg-opacity-50',
    modalBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-600',
    sectionBg: theme === 'dark' ? 'bg-[#1f1f1f]' : theme === 'blueprint' ? 'bg-[#163567]' : 'bg-gray-50',
  };

  // Close modal when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      toggleSettingsModal();
    }
  };

  // Grid size options (in inches)
  const gridSizeOptions = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4];

  // Snap increment options (in inches)
  const snapIncrementOptions = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4];

  // Auto-save interval options (in minutes)
  const autoSaveIntervalOptions = [1, 2, 5, 10, 15, 30];

  return (
    <div
      className={`fixed inset-0 ${colors.backdrop} flex items-center justify-center z-50 p-4`}
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className={`${colors.modalBg} rounded-lg shadow-2xl border ${colors.border} w-full max-w-2xl max-h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${colors.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-semibold ${colors.text}`}>
              Settings
            </h2>
            <p className={`text-xs ${colors.textMuted} mt-1`}>
              Configure your workspace preferences
            </p>
          </div>
          <button
            onClick={toggleSettingsModal}
            className={`w-8 h-8 flex items-center justify-center rounded ${colors.border} border hover:bg-opacity-10 hover:bg-white transition-colors ${colors.text}`}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Appearance Section */}
          <section>
            <h3 className={`text-sm font-semibold ${colors.text} mb-3`}>Appearance</h3>
            <div className={`${colors.sectionBg} rounded-lg p-4 space-y-3`}>
              <div>
                <label className={`block text-xs font-medium ${colors.text} mb-2`}>
                  Theme
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                      theme === 'light'
                        ? 'bg-blue-500 text-white border-blue-600'
                        : `${colors.border} ${colors.text} border hover:bg-opacity-10 hover:bg-white`
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-500 text-white border-blue-600'
                        : `${colors.border} ${colors.text} border hover:bg-opacity-10 hover:bg-white`
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('blueprint')}
                    className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                      theme === 'blueprint'
                        ? 'bg-blue-500 text-white border-blue-600'
                        : `${colors.border} ${colors.text} border hover:bg-opacity-10 hover:bg-white`
                    }`}
                  >
                    Blueprint
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Canvas Section */}
          <section>
            <h3 className={`text-sm font-semibold ${colors.text} mb-3`}>Canvas</h3>
            <div className={`${colors.sectionBg} rounded-lg p-4 space-y-4`}>
              {/* Grid Visibility */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gridVisible}
                  onChange={toggleGrid}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <span className={`text-sm ${colors.text}`}>Show grid</span>
              </label>

              {/* Major Grid Size */}
              <div>
                <label className={`block text-xs font-medium ${colors.text} mb-2`}>
                  Major grid size
                </label>
                <select
                  value={majorGridSize}
                  onChange={(e) => setMajorGridSize(parseFloat(e.target.value))}
                  disabled={!gridVisible}
                  className={`w-full px-3 py-2 text-sm rounded border ${colors.border} ${colors.text} ${
                    !gridVisible ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-transparent'
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  {gridSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size < 1 ? `${size * 16}/16"` : `${size}"`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minor Grid Visibility */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={minorGridVisible}
                  onChange={toggleMinorGrid}
                  disabled={!gridVisible}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={`text-sm ${colors.text} ${!gridVisible ? 'opacity-50' : ''}`}>
                  Show minor grid (1/16")
                </span>
              </label>

              {/* Rulers Visibility */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rulersVisible}
                  onChange={toggleRulers}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <span className={`text-sm ${colors.text}`}>Show rulers</span>
              </label>
            </div>
          </section>

          {/* Editing Section */}
          <section>
            <h3 className={`text-sm font-semibold ${colors.text} mb-3`}>Editing</h3>
            <div className={`${colors.sectionBg} rounded-lg p-4 space-y-3`}>
              <div>
                <label className={`block text-xs font-medium ${colors.text} mb-2`}>
                  Default snap increment
                </label>
                <select
                  value={snapIncrement}
                  onChange={(e) => setSnapIncrement(parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 text-sm rounded border ${colors.border} ${colors.text} bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  {snapIncrementOptions.map((inc) => (
                    <option key={inc} value={inc}>
                      {inc < 1 ? `${inc * 16}/16"` : `${inc}"`}
                    </option>
                  ))}
                </select>
                <p className={`text-xs ${colors.textMuted} mt-1`}>
                  Used for arrow key nudging and grid snapping
                </p>
              </div>
            </div>
          </section>

          {/* Auto-Save Section */}
          <section>
            <h3 className={`text-sm font-semibold ${colors.text} mb-3`}>Auto-Save</h3>
            <div className={`${colors.sectionBg} rounded-lg p-4 space-y-3`}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <span className={`text-sm ${colors.text}`}>Enable auto-save</span>
              </label>

              <div>
                <label className={`block text-xs font-medium ${colors.text} mb-2`}>
                  Auto-save interval
                </label>
                <select
                  value={autoSaveInterval}
                  onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
                  disabled={!autoSaveEnabled}
                  className={`w-full px-3 py-2 text-sm rounded border ${colors.border} ${colors.text} ${
                    !autoSaveEnabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-transparent'
                  } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  {autoSaveIntervalOptions.map((interval) => (
                    <option key={interval} value={interval}>
                      {interval} {interval === 1 ? 'minute' : 'minutes'}
                    </option>
                  ))}
                </select>
                <p className={`text-xs ${colors.textMuted} mt-1`}>
                  How often to automatically save your project
                </p>
              </div>
            </div>
          </section>

          {/* Units Section (Future) */}
          <section>
            <h3 className={`text-sm font-semibold ${colors.text} mb-3`}>Units</h3>
            <div className={`${colors.sectionBg} rounded-lg p-4 space-y-3`}>
              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2 text-sm rounded border bg-blue-500 text-white border-blue-600"
                  disabled
                >
                  Imperial (inches)
                </button>
                <button
                  className={`flex-1 px-3 py-2 text-sm rounded border ${colors.border} ${colors.text} opacity-50 cursor-not-allowed`}
                  disabled
                  title="Coming soon"
                >
                  Metric (mm)
                </button>
              </div>
              <p className={`text-xs ${colors.textMuted}`}>
                Metric units support coming soon
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t ${colors.border} flex items-center justify-between`}>
          <p className={`text-xs ${colors.textMuted}`}>
            Changes are saved automatically
          </p>
          <button
            onClick={toggleSettingsModal}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
