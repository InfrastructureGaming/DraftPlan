import { useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { AssemblyItem } from './AssemblyItem';
import { CreateAssemblyModal } from './CreateAssemblyModal';

export function AssembliesPanel() {
  const { assemblies, selectedObjectIds, reorderAssemblies } = useProjectStore();
  const { theme } = useUIStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderAssemblies(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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

          {/* Assembly List */}
          <div className="flex-1 overflow-y-auto">
            {assemblies.length === 0 ? (
              <div className={`p-8 text-center ${colors.textMuted}`}>
                <p className="text-sm">No assemblies yet</p>
                <p className="text-xs mt-2">
                  Select multiple objects and click "New Assembly" to group them
                </p>
              </div>
            ) : (
              <div>
                {assemblies.map((assembly, index) => (
                  <div
                    key={assembly.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`${
                      dragOverIndex === index && draggedIndex !== index
                        ? 'border-t-2 border-blue-500'
                        : ''
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                  >
                    <AssemblyItem assembly={assembly} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className={`p-2 border-t ${colors.border} text-xs ${colors.textMuted}`}>
            {assemblies.length} {assemblies.length === 1 ? 'assembly' : 'assemblies'}
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
