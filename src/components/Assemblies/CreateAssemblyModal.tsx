import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

interface CreateAssemblyModalProps {
  onClose: () => void;
}

export function CreateAssemblyModal({ onClose }: CreateAssemblyModalProps) {
  const { selectedObjectIds, createAssembly } = useProjectStore();
  const { theme } = useUIStore();

  const [name, setName] = useState(`Assembly ${Date.now().toString().slice(-4)}`);
  const [color, setColor] = useState('#3B82F6'); // Default blue

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
    if (name.trim() && selectedObjectIds.length >= 2) {
      createAssembly(name.trim(), selectedObjectIds, color);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Predefined color palette
  const colorPalette = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

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
            Create Assembly
          </h2>
          <p className={`text-xs ${colors.textMuted} mt-1`}>
            Group {selectedObjectIds.length} objects into an assembly
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Name Input */}
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Assembly Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded ${colors.text} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter assembly name"
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Assembly Color
            </label>
            <div className="flex items-center gap-3">
              {/* Color palette */}
              <div className="flex gap-2 flex-wrap">
                {colorPalette.map((paletteColor) => (
                  <button
                    key={paletteColor}
                    onClick={() => setColor(paletteColor)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      color === paletteColor ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: paletteColor }}
                    title={paletteColor}
                  />
                ))}
              </div>

              {/* Custom color input */}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                  title="Custom color"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className={`p-3 ${colors.inputBg} border ${colors.inputBorder} rounded`}>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded border border-gray-400"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1">
                <div className={`text-sm font-medium ${colors.text}`}>
                  {name || 'Unnamed Assembly'}
                </div>
                <div className={`text-xs ${colors.textMuted}`}>
                  {selectedObjectIds.length} objects
                </div>
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
            disabled={!name.trim() || selectedObjectIds.length < 2}
            className={`px-4 py-2 text-sm ${colors.buttonPrimary} text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Create Assembly
          </button>
        </div>
      </div>
    </div>
  );
}
