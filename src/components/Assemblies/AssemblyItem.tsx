import { Assembly } from '@/types';
import { useUIStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';

interface AssemblyItemProps {
  assembly: Assembly;
}

export function AssemblyItem({ assembly }: AssemblyItemProps) {
  const { theme } = useUIStore();
  const { toggleAssemblyVisibility, selectAssemblyObjects } = useProjectStore();

  // Theme-based colors
  const colors = {
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-500',
    hover: theme === 'dark' ? 'hover:bg-[#3a3a3a]' : theme === 'blueprint' ? 'hover:bg-[#2E4A9A]' : 'hover:bg-gray-100',
    itemBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleAssemblyVisibility(assembly.id);
  };

  const handleSelectAll = () => {
    selectAssemblyObjects(assembly.id);
  };

  return (
    <div
      className={`border-b ${colors.border} ${colors.hover} transition-colors cursor-pointer`}
      onClick={handleSelectAll}
    >
      <div className="p-3 flex items-center gap-3">
        {/* Visibility Toggle */}
        <button
          onClick={handleToggleVisibility}
          className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded ${colors.hover}`}
          title={assembly.visible ? 'Hide assembly' : 'Show assembly'}
        >
          <span className="text-sm">
            {assembly.visible ? '👁️' : '👁️‍🗨️'}
          </span>
        </button>

        {/* Color Indicator */}
        <div
          className="flex-shrink-0 w-4 h-4 rounded border border-gray-400"
          style={{ backgroundColor: assembly.color }}
          title={`Assembly color: ${assembly.color}`}
        />

        {/* Assembly Info */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${colors.text} truncate`}>
            {assembly.name}
          </div>
          <div className={`text-xs ${colors.textMuted}`}>
            {assembly.objectIds.length} {assembly.objectIds.length === 1 ? 'object' : 'objects'}
          </div>
        </div>

        {/* Drag Handle */}
        <div
          className={`flex-shrink-0 w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing ${colors.textMuted}`}
          title="Drag to reorder"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="6" cy="4" r="1.5" />
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="6" cy="8" r="1.5" />
            <circle cx="10" cy="8" r="1.5" />
            <circle cx="6" cy="12" r="1.5" />
            <circle cx="10" cy="12" r="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}
