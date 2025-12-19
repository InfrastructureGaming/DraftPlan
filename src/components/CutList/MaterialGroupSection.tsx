import { useState } from 'react';
import { MaterialGroup } from '@/lib/cutlist/aggregator';
import { useUIStore } from '@/stores/uiStore';

interface MaterialGroupSectionProps {
  group: MaterialGroup;
}

export function MaterialGroupSection({ group }: MaterialGroupSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useUIStore();

  // Theme-based colors
  const colors = {
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-600',
    hover: theme === 'dark' ? 'hover:bg-[#3a3a3a]' : theme === 'blueprint' ? 'hover:bg-[#2E4A9A]' : 'hover:bg-gray-100',
    sectionBg: theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'blueprint' ? 'bg-[#0A2463]' : 'bg-gray-50',
  };

  // Format numbers for display
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return '';
    return num.toFixed(2);
  };

  return (
    <div className={`border-b ${colors.border}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${colors.hover} transition-colors`}
      >
        <div className="flex flex-col items-start gap-1">
          <div className={`text-sm font-medium ${colors.text}`}>
            {group.material} {group.nominalSize}
          </div>
          <div className={`text-xs ${colors.textMuted}`}>
            {group.category}
          </div>
        </div>
        <span className={`text-xs ${colors.textMuted}`}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Summary */}
      <div className={`px-4 py-2 text-xs ${colors.textMuted} ${colors.sectionBg}`}>
        <div>
          {group.quantity} {group.quantity === 1 ? 'piece' : 'pieces'}
          {group.totalBoardFeet !== undefined && ` | ${formatNumber(group.totalBoardFeet)} board feet`}
          {group.totalLinearFeet !== undefined && ` | ${formatNumber(group.totalLinearFeet)} linear feet`}
          {group.sheetCount !== undefined && ` | ${group.sheetCount} ${group.sheetCount === 1 ? 'sheet' : 'sheets'}`}
        </div>
      </div>

      {/* Piece List */}
      {isExpanded && (
        <div className={`px-4 py-3 space-y-2 ${colors.sectionBg}`}>
          {group.pieces.map((piece, index) => (
            <div key={piece.id} className={`text-xs ${colors.text}`}>
              <span className={colors.textMuted}>Piece {index + 1}:</span>{' '}
              {piece.dimensions.width}" × {piece.dimensions.height}" × {piece.dimensions.depth}"
              {piece.name && (
                <span className={`ml-2 ${colors.textMuted}`}>({piece.name})</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
