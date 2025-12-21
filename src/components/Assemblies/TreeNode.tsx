import { useState } from 'react';
import { Assembly, DraftObject } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';

interface TreeNodeProps {
  id: string;
  type: 'assembly' | 'object';
  depth: number;
  onSelect?: (id: string, type: 'assembly' | 'object') => void;
}

export function TreeNode({ id, type, depth, onSelect }: TreeNodeProps) {
  const { theme } = useUIStore();
  const { objects, assemblies, toggleAssemblyVisibility, selectAssemblyObjects, toggleAssemblyExpansion, reparentNode } = useProjectStore();

  const [isDragOver, setIsDragOver] = useState(false);

  // Get the item (assembly or object)
  const item = type === 'assembly'
    ? assemblies.find((a) => a.id === id)
    : objects.find((o) => o.id === id);

  if (!item) return null;

  // Get children for assemblies
  const children = type === 'assembly' && 'childIds' in item ? item.childIds : [];
  const hasChildren = children.length > 0;
  const isExpanded = type === 'assembly' && 'isExpanded' in item ? item.isExpanded : false;

  // Theme-based colors
  const colors = {
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-500',
    hover: theme === 'dark' ? 'hover:bg-[#3a3a3a]' : theme === 'blueprint' ? 'hover:bg-[#2E4A9A]' : 'hover:bg-gray-100',
    itemBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
  };

  // Handle expand/collapse
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'assembly') {
      toggleAssemblyExpansion(id);
    }
  };

  // Handle visibility toggle
  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'assembly') {
      toggleAssemblyVisibility(id);
    }
  };

  // Handle item click
  const handleClick = () => {
    if (type === 'assembly') {
      selectAssemblyObjects(id);
    } else {
      onSelect?.(id, type);
    }
  };

  // Check if a node is a descendant of another (to prevent circular dependencies)
  const isDescendantOf = (nodeId: string, potentialAncestorId: string): boolean => {
    const node = assemblies.find((a) => a.id === nodeId) || objects.find((o) => o.id === nodeId);
    if (!node || !node.parentId) return false;
    if (node.parentId === potentialAncestorId) return true;
    return isDescendantOf(node.parentId, potentialAncestorId);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ id, type }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow dropping on assemblies
    if (type !== 'assembly') {
      return;
    }

    // Get dragged item
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const draggedId = dragData.id;

      // Prevent dropping on self or descendants
      if (draggedId === id || isDescendantOf(id, draggedId)) {
        return;
      }

      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    } catch {
      // Invalid drag data, ignore
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Only allow dropping on assemblies
    if (type !== 'assembly') {
      return;
    }

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const draggedId = dragData.id;

      // Prevent dropping on self or descendants
      if (draggedId === id || isDescendantOf(id, draggedId)) {
        return;
      }

      // Reparent the dragged node to this assembly
      reparentNode(draggedId, id);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Get color for the item
  const getItemColor = () => {
    if (type === 'assembly' && 'color' in item) {
      return item.color;
    }
    // For objects, check if they use assembly color
    if (type === 'object' && 'parentId' in item && item.parentId) {
      const obj = item as DraftObject;
      if (obj.useAssemblyColor) {
        const parentAssembly = assemblies.find((a) => a.id === obj.parentId);
        if (parentAssembly) return parentAssembly.color;
      }
    }
    return '#888888'; // Default gray for objects
  };

  // Calculate indentation
  const indentPx = depth * 20;

  // Get icon for item type
  const getIcon = () => {
    if (type === 'assembly') {
      return hasChildren ? (isExpanded ? '📂' : '📁') : '📁';
    }
    return '📦'; // Object icon
  };

  // Determine if this is an assembly or object by checking childIds
  const childNodes = children.map((childId) => {
    // Check if child is an assembly or object
    const isChildAssembly = assemblies.some((a) => a.id === childId);
    return {
      id: childId,
      type: isChildAssembly ? 'assembly' as const : 'object' as const,
    };
  });

  return (
    <div>
      {/* Node Item */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-b ${colors.border} ${colors.hover} transition-colors cursor-pointer ${
          isDragOver && type === 'assembly' ? 'bg-blue-500 bg-opacity-20 border-blue-500 border-2' : ''
        }`}
        onClick={handleClick}
        style={{ paddingLeft: `${indentPx}px` }}
      >
        <div className="p-2 flex items-center gap-2">
          {/* Expand/Collapse Button */}
          {type === 'assembly' && hasChildren && (
            <button
              onClick={handleToggleExpand}
              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded ${colors.hover}`}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <span className="text-xs">
                {isExpanded ? '▼' : '▶'}
              </span>
            </button>
          )}

          {/* Spacer for objects or assemblies without children */}
          {(!hasChildren || type === 'object') && (
            <div className="flex-shrink-0 w-5" />
          )}

          {/* Visibility Toggle (assemblies only) */}
          {type === 'assembly' && 'visible' in item && (
            <button
              onClick={handleToggleVisibility}
              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded ${colors.hover}`}
              title={item.visible ? 'Hide assembly' : 'Show assembly'}
            >
              <span className="text-xs">
                {item.visible ? '👁️' : '👁️‍🗨️'}
              </span>
            </button>
          )}

          {/* Color Indicator */}
          <div
            className="flex-shrink-0 w-3 h-3 rounded border border-gray-400"
            style={{ backgroundColor: getItemColor() }}
            title={`Color: ${getItemColor()}`}
          />

          {/* Icon */}
          <span className="text-sm flex-shrink-0">{getIcon()}</span>

          {/* Name */}
          <div className={`text-sm ${colors.text} truncate flex-1 min-w-0`}>
            {item.name}
          </div>

          {/* Child count for assemblies */}
          {type === 'assembly' && hasChildren && (
            <span className={`text-xs ${colors.textMuted} flex-shrink-0`}>
              ({children.length})
            </span>
          )}
        </div>
      </div>

      {/* Children (if expanded) */}
      {type === 'assembly' && isExpanded && hasChildren && (
        <div>
          {childNodes.map((child) => (
            <TreeNode
              key={child.id}
              id={child.id}
              type={child.type}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
