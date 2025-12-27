import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { aggregateByMaterial } from '@/lib/cutlist/aggregator';
import { MaterialGroupSection } from './MaterialGroupSection';

export function CutListModal() {
  // Subscribe to active tab data with proper selectors
  const objects = useProjectStore((state) => state.tabs[state.activeTabIndex]?.objects || []);
  const { theme, toggleCutListModal } = useUIStore();

  // Aggregate objects into material groups
  const materialGroups = aggregateByMaterial(objects);

  // Theme-based colors
  const colors = {
    backdrop: 'bg-black bg-opacity-50',
    modalBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-600',
  };

  // Close modal when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      toggleCutListModal();
    }
  };

  return (
    <div
      className={`fixed inset-0 ${colors.backdrop} flex items-center justify-center z-50 p-4`}
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className={`${colors.modalBg} rounded-lg shadow-2xl border ${colors.border} w-full max-w-3xl max-h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${colors.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-semibold ${colors.text}`}>
              Materials Cut List
            </h2>
            <p className={`text-xs ${colors.textMuted} mt-1`}>
              {materialGroups.length} material {materialGroups.length === 1 ? 'group' : 'groups'} | {objects.length} total {objects.length === 1 ? 'piece' : 'pieces'}
            </p>
          </div>
          <button
            onClick={toggleCutListModal}
            className={`w-8 h-8 flex items-center justify-center rounded ${colors.border} border hover:bg-opacity-10 hover:bg-white transition-colors ${colors.text}`}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {materialGroups.length === 0 ? (
            <div className={`p-8 text-center ${colors.textMuted}`}>
              <p>No materials in project</p>
              <p className="text-xs mt-2">Add some objects to the canvas to see your cut list</p>
            </div>
          ) : (
            <div>
              {materialGroups.map((group, index) => (
                <MaterialGroupSection key={`${group.material}-${group.nominalSize}-${index}`} group={group} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t ${colors.border} flex items-center justify-between ${colors.textMuted} text-xs`}>
          <div>
            Tip: Click on a material group to expand and see individual pieces
          </div>
          <div>
            Export feature coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
