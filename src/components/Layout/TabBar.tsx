import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export function TabBar() {
  // Subscribe to tabs state with proper selectors
  const tabs = useProjectStore((state) => state.tabs);
  const activeTabIndex = useProjectStore((state) => state.activeTabIndex);

  // Get actions
  const { switchToTab, closeTab } = useProjectStore();
  const { theme } = useUIStore();

  // Theme-based colors
  const colors = {
    bg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-600',
    activeBg: theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'blueprint' ? 'bg-[#051938]' : 'bg-gray-200',
    hover: theme === 'dark' ? 'hover:bg-[#3a3a3a]' : theme === 'blueprint' ? 'hover:bg-[#2E4A9A]' : 'hover:bg-gray-100',
  };

  const handleCloseTab = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();

    const tab = tabs[index];
    if (tab.hasUnsavedChanges) {
      const confirmed = confirm(`"${tab.projectInfo.name}" has unsaved changes. Close anyway?`);
      if (!confirmed) return;
    }

    closeTab(index);
  };

  // Helper to get display name for tab
  const getTabName = (index: number) => {
    const tab = tabs[index];

    // If we have a file path, extract the filename (without extension) to display
    let name = tab.projectInfo.name || 'Untitled Project';
    if (tab.currentFilePath) {
      const fileName = tab.currentFilePath.split('/').pop() || '';
      name = fileName.replace(/\.draftplan$/, '');
    }

    const unsavedMark = tab.hasUnsavedChanges ? '*' : '';
    return `${name}${unsavedMark}`;
  };

  return (
    <div className={`h-8 ${colors.bg} border-b ${colors.border} flex items-center px-2 gap-1 overflow-x-auto`}>
      {tabs.map((tab, index) => {
        const isActive = index === activeTabIndex;

        return (
          <button
            key={tab.id}
            onClick={() => switchToTab(index)}
            className={`
              flex items-center gap-2 px-3 py-1 text-xs rounded-t
              ${isActive ? colors.activeBg : colors.hover}
              ${isActive ? colors.text : colors.textMuted}
              transition-colors whitespace-nowrap
              border ${isActive ? colors.border : 'border-transparent'}
              ${isActive ? 'border-b-transparent' : ''}
            `}
            title={tab.currentFilePath || tab.projectInfo.name}
          >
            <span>{getTabName(index)}</span>

            {tabs.length > 1 && (
              <button
                onClick={(e) => handleCloseTab(e, index)}
                className={`w-4 h-4 flex items-center justify-center rounded hover:bg-red-500 hover:text-white transition-colors`}
                title="Close tab"
              >
                ×
              </button>
            )}
          </button>
        );
      })}
    </div>
  );
}
