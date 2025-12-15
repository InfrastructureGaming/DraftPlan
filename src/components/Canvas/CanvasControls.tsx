import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onResetPan: () => void;
  onPanStart: () => void;
  onPanEnd: () => void;
  gridSize: number;
}

// Available major grid sizes in inches
const GRID_SIZES = [
  { value: 0.125, label: '1/8"' },
  { value: 0.25, label: '1/4"' },
  { value: 0.5, label: '1/2"' },
  { value: 1, label: '1"' },
  { value: 12, label: '12"' },
  { value: 16, label: '16"' },
];

export function CanvasControls({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onResetPan,
  onPanStart,
  onPanEnd,
  gridSize,
}: CanvasControlsProps) {
  const { majorGridSize, setMajorGridSize, theme } = useUIStore();
  const [isPanActive, setIsPanActive] = useState(false);

  // Theme-based colors
  const colors = {
    bg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-200',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-700',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-600',
    buttonBg: theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'blueprint' ? 'bg-[#0A2463]' : 'bg-gray-100',
    buttonBorder: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-blue-800' : 'border-gray-300',
    hover: theme === 'dark' ? 'hover:bg-[#3a3a3a]' : theme === 'blueprint' ? 'hover:bg-[#2E4A9A]' : 'hover:bg-gray-100',
  };

  const handlePanMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPanActive(true);
    onPanStart();

    // Add global mouse up listener
    const handleGlobalMouseUp = () => {
      setIsPanActive(false);
      onPanEnd();
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  return (
    <div className={`absolute top-4 right-4 ${colors.bg} rounded-lg shadow-lg border ${colors.border} p-3 flex flex-col gap-2 z-10`}>
      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className={`w-8 h-8 flex items-center justify-center border ${colors.buttonBorder} rounded ${colors.hover} transition-colors ${colors.text}`}
          title="Zoom Out (-)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={onZoomIn}
          className={`w-8 h-8 flex items-center justify-center border ${colors.buttonBorder} rounded ${colors.hover} transition-colors ${colors.text}`}
          title="Zoom In (+)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={onResetZoom}
          className={`px-2 h-8 flex items-center justify-center border ${colors.buttonBorder} rounded ${colors.hover} transition-colors text-xs ${colors.text}`}
          title="Reset Zoom (1:1)"
        >
          1:1
        </button>
      </div>

      {/* Pan and reset controls */}
      <div className="flex items-center gap-2">
        <button
          onMouseDown={handlePanMouseDown}
          className={`w-8 h-8 flex items-center justify-center border rounded transition-colors ${
            isPanActive
              ? 'bg-blue-500 border-blue-600 text-white'
              : `${colors.buttonBorder} ${colors.hover}`
          }`}
          title="Pan (Click and drag)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </button>
        <button
          onClick={onResetPan}
          className={`flex-1 h-8 px-2 flex items-center justify-between border ${colors.buttonBorder} rounded ${colors.hover} transition-colors text-xs ${colors.text}`}
          title="Re-center Canvas"
        >
          Center
        </button>
      </div>

      {/* Divider */}
      <div className={`border-t ${colors.border} my-1`} />

      {/* Grid controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-medium ${colors.text}`}>Major Grid:</span>
        </div>
        <select
          value={majorGridSize}
          onChange={(e) => setMajorGridSize(Number(e.target.value))}
          className={`w-full px-2 py-1 text-xs border ${colors.buttonBorder} ${colors.buttonBg} ${colors.text} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
        >
          {GRID_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
