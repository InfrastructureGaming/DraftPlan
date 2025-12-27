import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { TreeNode } from './TreeNode';
import { CreateAssemblyModal } from './CreateAssemblyModal';

export function AssembliesPanel() {
  // Subscribe to active tab data with proper selectors
  const objects = useProjectStore((state) => state.tabs[state.activeTabIndex]?.objects || []);
  const assemblies = useProjectStore((state) => state.tabs[state.activeTabIndex]?.assemblies || []);
  const selectedObjectIds = useProjectStore((state) => state.tabs[state.activeTabIndex]?.selectedObjectIds || []);

  // Get actions
  const { selectObject, reparentNode } = useProjectStore();
  const { theme } = useUIStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOverRoot, setIsDragOverRoot] = useState(false);

  // Theme-based colors
  const colors = {
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-500',
    buttonBg: theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'blueprint' ? 'bg-[#0A2463]' : 'bg-gray-100',
    buttonBorder: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-blue-800' : 'border-gray-300',
    hover: theme === 'dark' ? 'hover:bg-[#3a3a3a]' : theme === 'blueprint' ? 'hover:bg-[#2E4A9A]' : 'hover:bg-gray-100',
  };

  const canCreateAssembly = selectedObjectIds.length >= 2;

  // Get root-level items (assemblies and objects without a parent)
  const rootAssemblies = assemblies.filter((a) => !a.parentId);
  const rootObjects = objects.filter((o) => !o.parentId);

  // Combine and sort root items (assemblies first, then objects)
  const rootItems = [
    ...rootAssemblies.map((a) => ({ id: a.id, type: 'assembly' as const, name: a.name })),
    ...rootObjects.map((o) => ({ id: o.id, type: 'object' as const, name: o.name })),
  ];

  // Handle object selection
  const handleSelectNode = (id: string, type: 'assembly' | 'object') => {
    if (type === 'object') {
      selectObject(id);
    }
  };

  // Handle drag-to-root (remove parent)
  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverRoot(true);
  };

  const handleRootDragLeave = () => {
    setIsDragOverRoot(false);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverRoot(false);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const draggedId = dragData.id;

      // Reparent to root (no parent)
      reparentNode(draggedId, undefined);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${colors.border} flex items-center justify-between`}>
        <h2 className={`text-sm font-semibold ${colors.text}`}>Assemblies</h2>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-6 h-6 flex items-center justify-center rounded ${colors.hover} transition-colors ${colors.text}`}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <span className="text-xs">{isCollapsed ? '▶' : '▼'}</span>
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Controls */}
          <div className={`p-3 border-b ${colors.border}`}>
            {/* Create Assembly Button */}
            <button
              disabled={!canCreateAssembly}
              onClick={() => setShowCreateModal(true)}
              className={`
                w-full px-3 py-2 text-sm border rounded transition-colors
                ${canCreateAssembly
                  ? `${colors.buttonBorder} ${colors.hover} ${colors.text}`
                  : `${colors.buttonBorder} opacity-50 cursor-not-allowed ${colors.textMuted}`
                }
              `}
              title={!canCreateAssembly ? 'Select 2 or more objects to create an assembly' : 'Create assembly from selected objects'}
            >
              + New Assembly
            </button>

            {!canCreateAssembly && selectedObjectIds.length > 0 && (
              <p className={`text-xs ${colors.textMuted} mt-2 text-center`}>
                Select {2 - selectedObjectIds.length} more object{2 - selectedObjectIds.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {/* Hierarchy Tree */}
          <div
            className="flex-1 overflow-y-auto relative"
            onDragOver={handleRootDragOver}
            onDragLeave={handleRootDragLeave}
            onDrop={handleRootDrop}
          >
            {/* Drop zone indicator */}
            {isDragOverRoot && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed pointer-events-none flex items-center justify-center z-10">
                <div className={`text-sm font-semibold ${colors.text} bg-blue-500 bg-opacity-90 px-4 py-2 rounded`}>
                  Drop here to move to root level
                </div>
              </div>
            )}

            {rootItems.length === 0 ? (
              <div className={`p-8 text-center ${colors.textMuted}`}>
                <p className="text-sm">No assemblies yet</p>
                <p className="text-xs mt-2">
                  Select multiple objects and click "New Assembly" to group them
                </p>
              </div>
            ) : (
              <div>
                {rootItems.map((item) => (
                  <TreeNode
                    key={item.id}
                    id={item.id}
                    type={item.type}
                    depth={0}
                    onSelect={handleSelectNode}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className={`p-2 border-t ${colors.border} text-xs ${colors.textMuted}`}>
            {assemblies.length} {assemblies.length === 1 ? 'assembly' : 'assemblies'} • {objects.length} {objects.length === 1 ? 'object' : 'objects'}
          </div>
        </>
      )}

      {/* Create Assembly Modal */}
      {showCreateModal && (
        <CreateAssemblyModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
