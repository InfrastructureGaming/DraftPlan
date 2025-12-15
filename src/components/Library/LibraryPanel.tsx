import { useState } from 'react';
import { LUMBER_LIBRARY, getCategories, getLumberByCategory } from '@/lib/data/lumber';
import { LumberLibraryItem } from '@/types';
import { useUIStore } from '@/stores/uiStore';

export function LibraryPanel() {
  const { theme } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Dimensional Lumber']) // Dimensional Lumber expanded by default
  );

  const categories = getCategories();

  // Theme-based colors
  const colors = {
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-500',
    hover: theme === 'dark' ? 'hover:bg-[#3a3a3a]' : theme === 'blueprint' ? 'hover:bg-[#2E4A9A]' : 'hover:bg-gray-100',
    categoryBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-gray-50',
    inputBg: theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'blueprint' ? 'bg-[#0A2463]' : 'bg-white',
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredItems = searchQuery
    ? LUMBER_LIBRARY.filter(
        (item) =>
          item.nominalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b ${colors.border}`}>
        <h2 className={`text-sm font-semibold mb-2 ${colors.text}`}>Library</h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search lumber..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full px-2 py-1 text-xs border ${colors.border} ${colors.inputBg} ${colors.text} rounded focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:${colors.textMuted}`}
        />
      </div>

      {/* Library Items */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems ? (
          // Search results
          <div className="p-2">
            {filteredItems.length === 0 ? (
              <p className={`text-xs ${colors.textMuted} text-center py-4`}>No items found</p>
            ) : (
              filteredItems.map((item) => <LumberItem key={item.id} item={item} colors={colors} />)
            )}
          </div>
        ) : (
          // Category view
          <div>
            {categories.map((category) => (
              <CategorySection
                key={category}
                category={category}
                items={getLumberByCategory(category)}
                isExpanded={expandedCategories.has(category)}
                onToggle={() => toggleCategory(category)}
                colors={colors}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface CategorySectionProps {
  category: string;
  items: LumberLibraryItem[];
  isExpanded: boolean;
  onToggle: () => void;
  colors: any;
}

function CategorySection({ category, items, isExpanded, onToggle, colors }: CategorySectionProps) {
  return (
    <div className={`border-b ${colors.border}`}>
      {/* Category Header */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-2 flex items-center justify-between ${colors.hover} transition-colors`}
      >
        <span className={`text-sm font-medium ${colors.text}`}>{category}</span>
        <span className={`text-xs ${colors.textMuted}`}>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Category Items */}
      {isExpanded && (
        <div className={colors.categoryBg}>
          {items.map((item) => (
            <LumberItem key={item.id} item={item} colors={colors} />
          ))}
        </div>
      )}
    </div>
  );
}

interface LumberItemProps {
  item: LumberLibraryItem;
  colors: any;
}

function LumberItem({ item, colors }: LumberItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    // Set the drag data to include the library item
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const { width, height, depth } = item.actualDimensions;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`px-4 py-2 ${colors.hover} cursor-move transition-colors border-b ${colors.border} last:border-b-0`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={`text-sm font-medium ${colors.text}`}>{item.nominalName}</div>
          <div className={`text-xs ${colors.textMuted}`}>
            {width}" × {height}" × {depth}"
          </div>
        </div>
        <div className={`text-xs ${colors.textMuted}`}>⋮⋮</div>
      </div>
    </div>
  );
}
