import { useState } from 'react';
import { useCustomLumberStore } from '@/stores/customLumberStore';
import { useUIStore } from '@/stores/uiStore';
import { LumberLibraryItem } from '@/types';

interface AddCustomLumberModalProps {
  onClose: () => void;
  editItem?: LumberLibraryItem | null;
}

export function AddCustomLumberModal({ onClose, editItem }: AddCustomLumberModalProps) {
  const { addCustomItem, updateCustomItem } = useCustomLumberStore();
  const { theme } = useUIStore();

  const isEditMode = !!editItem;

  const [name, setName] = useState(editItem?.nominalName || '');
  const [width, setWidth] = useState(editItem?.actualDimensions.width.toString() || '');
  const [height, setHeight] = useState(editItem?.actualDimensions.height.toString() || '');
  const [depth, setDepth] = useState(editItem?.actualDimensions.depth.toString() || '');
  const [material, setMaterial] = useState(editItem?.material || 'pine');
  const [category, setCategory] = useState(editItem?.category || 'Custom');

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

  // Validate form
  const isValid = () => {
    if (!name.trim()) return false;
    const w = parseFloat(width);
    const h = parseFloat(height);
    const d = parseFloat(depth);
    if (isNaN(w) || isNaN(h) || isNaN(d)) return false;
    if (w <= 0 || h <= 0 || d <= 0) return false;
    if (!material.trim()) return false;
    return true;
  };

  const handleSave = () => {
    if (!isValid()) return;

    const lumberItem = {
      nominalName: name.trim(),
      actualDimensions: {
        width: parseFloat(width),
        height: parseFloat(height),
        depth: parseFloat(depth),
      },
      material: material.trim(),
      category: category.trim() || 'Custom',
      tags: ['custom'],
    };

    if (isEditMode && editItem) {
      updateCustomItem(editItem.id, lumberItem);
    } else {
      addCustomItem(lumberItem);
    }

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid()) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

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
            {isEditMode ? 'Edit Custom Lumber' : 'Add Custom Lumber'}
          </h2>
          <p className={`text-xs ${colors.textMuted} mt-1`}>
            {isEditMode ? 'Update custom lumber item' : 'Create a new custom lumber item for your library'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Name Input */}
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded ${colors.text} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., 2×4 Oak, Custom Shelf Board"
              autoFocus
            />
          </div>

          {/* Dimensions */}
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Actual Dimensions (inches) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`block text-xs ${colors.textMuted} mb-1`}>Width</label>
                <input
                  type="number"
                  step="0.0625"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-2 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded ${colors.text} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="1.5"
                />
              </div>
              <div>
                <label className={`block text-xs ${colors.textMuted} mb-1`}>Height</label>
                <input
                  type="number"
                  step="0.0625"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-2 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded ${colors.text} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="3.5"
                />
              </div>
              <div>
                <label className={`block text-xs ${colors.textMuted} mb-1`}>Depth (Length)</label>
                <input
                  type="number"
                  step="0.0625"
                  min="0"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-2 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded ${colors.text} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="96"
                />
              </div>
            </div>
            <p className={`text-xs ${colors.textMuted} mt-1`}>
              Enter actual dimensions, not nominal sizes
            </p>
          </div>

          {/* Material */}
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Material <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded ${colors.text} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="e.g., pine, oak, maple, plywood"
            />
          </div>

          {/* Category */}
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} rounded ${colors.text} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Custom"
            />
            <p className={`text-xs ${colors.textMuted} mt-1`}>
              Leave as "Custom" or create your own category
            </p>
          </div>

          {/* Preview */}
          <div className={`p-3 ${colors.inputBg} border ${colors.inputBorder} rounded`}>
            <div className={`text-xs font-medium ${colors.textMuted} mb-2`}>Preview</div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`text-sm font-medium ${colors.text}`}>
                  {name || 'Unnamed Item'}
                </div>
                <div className={`text-xs ${colors.textMuted}`}>
                  {width || '?'}" × {height || '?'}" × {depth || '?'}"
                </div>
              </div>
              <div className={`text-xs ${colors.textMuted}`}>⋮⋮</div>
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
            onClick={handleSave}
            disabled={!isValid()}
            className={`px-4 py-2 text-sm ${colors.buttonPrimary} text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isEditMode ? 'Update' : 'Add to Library'}
          </button>
        </div>
      </div>
    </div>
  );
}
