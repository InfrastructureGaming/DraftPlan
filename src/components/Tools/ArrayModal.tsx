import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

interface ArrayModalProps {
  onClose: () => void;
}

export function ArrayModal({ onClose }: ArrayModalProps) {
  // Subscribe to active tab data with proper selectors
  const selectedObjectIds = useProjectStore((state) => state.tabs[state.activeTabIndex]?.selectedObjectIds || []);
  const objects = useProjectStore((state) => state.tabs[state.activeTabIndex]?.objects || []);

  // Get actions
  const { createArray } = useProjectStore();
  const { theme } = useUIStore();

  const [direction, setDirection] = useState<'x' | 'y' | 'z'>('x');
  const [count, setCount] = useState(5);
  const [spacing, setSpacing] = useState(12);
  const [createAsAssembly, setCreateAsAssembly] = useState(true);

  // Get selected object
  const selectedObject = selectedObjectIds.length === 1 ? objects.find(obj => obj.id === selectedObjectIds[0]) : null;

  // Theme-based colors
  const colors = {
    backdrop: 'bg-black bg-opacity-50',
    modalBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-600',
    inputBg: theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'blueprint' ? 'bg-[#0A2463]' : 'bg-gray-50',
    inputBorder: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-blue-800' : 'border-gray-300',
    buttonPrimary: theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : theme === 'blueprint' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700',
    buttonSecondary: theme === 'dark' ? 'border-[#333333] hover:bg-[#3a3a3a]' : theme === 'blueprint' ? 'border-blue-800 hover:bg-[#2E4A9A]' : 'border-gray-300 hover:bg-gray-100',
  };

  // Close modal when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCreate = () => {
    if (!selectedObject || count < 2 || spacing <= 0) return;

    createArray(selectedObject.id, direction, count, spacing, createAsAssembly);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Calculate total distance
  const totalDistance = spacing * (count - 1);

  // Get axis label
  const getAxisLabel = (axis: 'x' | 'y' | 'z') => {
    switch (axis) {
      case 'x': return 'Horizontal (X)';
      case 'y': return 'Vertical (Y)';
      case 'z': return 'Depth (Z)';
    }
  };

  if (!selectedObject) {
    return (
      <div
        className={`fixed inset-0 ${colors.backdrop} flex items-center justify-center z-50 p-4`}
        onClick={handleBackdropClick}
      >
        <div className={`${colors.modalBg} rounded-lg shadow-2xl border ${colors.border} w-full max-w-md p-6`}>
          <h2 className={`text-lg font-semibold ${colors.text} mb-4`}>Create Array</h2>
          <p className={`${colors.textMuted} text-sm`}>
            Please select exactly one object to create an array.
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm border ${colors.buttonSecondary} rounded transition-colors ${colors.text}`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 ${colors.backdrop} flex items-center justify-center z-50 p-4`}
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className={`${colors.modalBg} rounded-lg shadow-2xl border ${colors.border} w-full max-w-md flex flex-col`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${colors.border}`}>
          <h2 className={`text-lg font-semibold ${colors.text}`}>
            Create Array
          </h2>
          <p className={`text-xs ${colors.textMuted} mt-1`}>
            Create multiple copies of "{selectedObject.name}"
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4" onKeyDown={handleKeyDown}>
          {/* Direction Selection */}
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Direction
            </label>
            <div className="flex gap-2">
              {(['x', 'y', 'z'] as const).map((axis) => (
                <button
                  key={axis}
                  onClick={() => setDirection(axis)}
                  className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
                    direction === axis
                      ? 'bg-blue-500 text-white border-blue-500'
                      : `${colors.inputBg} ${colors.text} ${colors.inputBorder} hover:bg-opacity-80`
                  }`}
                >
                  {getAxisLabel(axis)}
                </button>
              ))}
            </div>
          </div>

          {/* Count Input */}
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Number of Copies
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(2, Math.min(100, parseInt(e.target.value) || 2)))}
              min="2"
              max="100"
              className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded ${colors.text} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <p className={`text-xs ${colors.textMuted} mt-1`}>
              Range: 2-100 copies
            </p>
          </div>

          {/* Spacing Input */}
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Spacing Between Copies (inches)
            </label>
            <input
              type="number"
              value={spacing}
              onChange={(e) => setSpacing(Math.max(0.0625, parseFloat(e.target.value) || 1))}
              step="0.0625"
              min="0.0625"
              className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded ${colors.text} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <p className={`text-xs ${colors.textMuted} mt-1`}>
              Minimum: 1/16" (0.0625")
            </p>
          </div>

          {/* Create as Assembly Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="createAsAssembly"
              checked={createAsAssembly}
              onChange={(e) => setCreateAsAssembly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="createAsAssembly" className={`text-sm ${colors.text}`}>
              Create as Assembly
            </label>
          </div>

          {/* Preview/Summary */}
          <div className={`p-3 ${colors.inputBg} border ${colors.inputBorder} rounded`}>
            <div className={`text-sm ${colors.text} space-y-1`}>
              <div className="flex justify-between">
                <span className={colors.textMuted}>Total copies:</span>
                <span className="font-medium">{count}</span>
              </div>
              <div className="flex justify-between">
                <span className={colors.textMuted}>Spacing:</span>
                <span className="font-medium">{spacing}"</span>
              </div>
              <div className="flex justify-between">
                <span className={colors.textMuted}>Total distance:</span>
                <span className="font-medium">{totalDistance}"</span>
              </div>
              <div className="flex justify-between">
                <span className={colors.textMuted}>Direction:</span>
                <span className="font-medium">{getAxisLabel(direction)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${colors.border} flex items-center justify-end gap-3`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm border ${colors.buttonSecondary} rounded transition-colors ${colors.text}`}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={count < 2 || spacing <= 0}
            className={`px-4 py-2 text-sm ${colors.buttonPrimary} text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Create Array
          </button>
        </div>
      </div>
    </div>
  );
}
