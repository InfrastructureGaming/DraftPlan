import { useState } from 'react';
import { LUMBER_LIBRARY, getCategories, getLumberByCategory } from '@/lib/data/lumber';
import { LumberLibraryItem } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import { useCustomLumberStore } from '@/stores/customLumberStore';
import { AddCustomLumberModal } from './AddCustomLumberModal';

export function LibraryPanel() {
  const { theme } = useUIStore();
  const { customItems } = useCustomLumberStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Dimensional Lumber']) // Dimensional Lumber expanded by default
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LumberLibraryItem | null>(null);

  // Combine static library with custom items
  const allItems = [...LUMBER_LIBRARY, ...customItems];

  // Get all unique categories (including custom)
  const categories = Array.from(new Set(allItems.map((item) => item.category)));

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
    ? allItems.filter(
        (item) =>
          item.nominalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  // Get items by category from all items
  const getItemsByCategory = (category: string): LumberLibraryItem[] => {
    return allItems.filter((item) => item.category === category);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b ${colors.border}`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className={`text-sm font-semibold ${colors.text}`}>Library</h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors`}
            title="Add custom lumber item"
          >
            + Custom
          </button>
        </div>

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
              filteredItems.map((item) => (
                <LumberItem
                  key={item.id}
                  item={item}
                  colors={colors}
                  onEdit={() => {
                    setEditingItem(item);
                    setIsAddModalOpen(true);
                  }}
                />
              ))
            )}
          </div>
        ) : (
          // Category view
          <div>
            {categories.map((category) => (
              <CategorySection
                key={category}
                category={category}
                items={getItemsByCategory(category)}
                isExpanded={expandedCategories.has(category)}
                onToggle={() => toggleCategory(category)}
                colors={colors}
                onEdit={(item) => {
                  setEditingItem(item);
                  setIsAddModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Custom Lumber Modal */}
      {isAddModalOpen && (
        <AddCustomLumberModal
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
          }}
          editItem={editingItem}
        />
      )}
    </div>
  );
}

interface CategorySectionProps {
  category: string;
  items: LumberLibraryItem[];
  isExpanded: boolean;
  onToggle: () => void;
  colors: any;
  onEdit: (item: LumberLibraryItem) => void;
}

function CategorySection({ category, items, isExpanded, onToggle, colors, onEdit }: CategorySectionProps) {
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
            <LumberItem key={item.id} item={item} colors={colors} onEdit={() => onEdit(item)} />
          ))}
        </div>
      )}
    </div>
  );
}

interface LumberItemProps {
  item: LumberLibraryItem;
  colors: any;
  onEdit: () => void;
}

function LumberItem({ item, colors, onEdit }: LumberItemProps) {
  const { deleteCustomItem } = useCustomLumberStore();
  const [showActions, setShowActions] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    // Set the drag data to include the library item
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${item.nominalName}"?`)) {
      deleteCustomItem(item.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const { width, height, depth } = item.actualDimensions;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => item.isCustom && setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`px-4 py-2 ${colors.hover} cursor-move transition-colors border-b ${colors.border} last:border-b-0 relative`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={`text-sm font-medium ${colors.text} flex items-center gap-2`}>
            {item.nominalName}
            {item.isCustom && (
              <span className="text-xs px-1 py-0.5 bg-blue-600 text-white rounded">Custom</span>
            )}
          </div>
          <div className={`text-xs ${colors.textMuted}`}>
            {width}" × {height}" × {depth}"
          </div>
        </div>

        {/* Actions for custom items */}
        {item.isCustom && showActions ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleEdit}
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              title="Edit"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              title="Delete"
            >
              ×
            </button>
          </div>
        ) : (
          <div className={`text-xs ${colors.textMuted}`}>⋮⋮</div>
        )}
      </div>
    </div>
  );
}
