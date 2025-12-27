import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { ViewType } from '@/types';

const VIEWS: { name: ViewType; label: string; key: string }[] = [
  { name: 'front', label: 'Front', key: '1' },
  { name: 'back', label: 'Back', key: '2' },
  { name: 'left', label: 'Left', key: '3' },
  { name: 'right', label: 'Right', key: '4' },
  { name: 'top', label: 'Top', key: '5' },
  { name: 'bottom', label: 'Bottom', key: '6' },
];

export function ViewSwitcher() {
  // Subscribe to active tab data with proper selectors
  const camera = useProjectStore((state) => state.tabs[state.activeTabIndex]?.camera);

  // Get actions
  const { setView } = useProjectStore();
  const { theme } = useUIStore();

  // Theme-based colors
  const getButtonClasses = (isActive: boolean) => {
    const base = 'px-3 py-1 rounded text-sm font-medium transition-colors';

    if (isActive) {
      return `${base} bg-blue-600 text-white`;
    }

    if (theme === 'dark') {
      return `${base} bg-[#1a1a1a] text-white hover:bg-[#3a3a3a] border border-[#333333]`;
    }

    if (theme === 'blueprint') {
      return `${base} bg-[#0A2463] text-white hover:bg-[#2E4A9A] border border-blue-800`;
    }

    return `${base} bg-gray-200 text-gray-700 hover:bg-gray-300`;
  };

  return (
    <div className="flex gap-1">
      {VIEWS.map((view) => (
        <button
          key={view.name}
          onClick={() => setView(view.name)}
          className={getButtonClasses(camera.currentView === view.name)}
          title={`Switch to ${view.label} view (${view.key})`}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
