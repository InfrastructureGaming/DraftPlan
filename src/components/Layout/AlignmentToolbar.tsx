import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { alignObjects, distributeObjects, AlignmentType, DistributionType } from '@/lib/geometry/alignment';

export function AlignmentToolbar() {
  // Subscribe to active tab data with proper selectors
  const objects = useProjectStore((state) => state.tabs[state.activeTabIndex]?.objects || []);
  const selectedObjectIds = useProjectStore((state) => state.tabs[state.activeTabIndex]?.selectedObjectIds || []);

  // Get actions
  const { updateObject } = useProjectStore();
  const { toggleArrayModal } = useUIStore();

  const selectedObjects = objects.filter((obj) => selectedObjectIds.includes(obj.id));

  if (selectedObjects.length < 1) {
    return null;
  }

  const handleAlign = (alignment: AlignmentType) => {
    const updates = alignObjects(selectedObjects, alignment);
    updates.forEach((position, id) => {
      updateObject(id, { position });
    });
  };

  const handleDistribute = (distribution: DistributionType) => {
    if (selectedObjects.length < 3) return;
    const updates = distributeObjects(selectedObjects, distribution);
    updates.forEach((position, id) => {
      updateObject(id, { position });
    });
  };

  return (
    <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
      {/* Array Tool (only show for single selection) */}
      {selectedObjects.length === 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={toggleArrayModal}
            className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors font-medium"
            title="Create Array"
          >
            📋 Array
          </button>
        </div>
      )}

      {/* Alignment Tools (only show for 2+ objects) */}
      {selectedObjects.length >= 2 && (
        <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600 mr-2">Align:</span>
        <button
          onClick={() => handleAlign('left')}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="Align Left"
        >
          ⫷
        </button>
        <button
          onClick={() => handleAlign('center')}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="Align Center"
        >
          ⫼
        </button>
        <button
          onClick={() => handleAlign('right')}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="Align Right"
        >
          ⫸
        </button>
        <button
          onClick={() => handleAlign('top')}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="Align Top"
        >
          ⫴
        </button>
        <button
          onClick={() => handleAlign('middle')}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="Align Middle"
        >
          ⫽
        </button>
        <button
          onClick={() => handleAlign('bottom')}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors"
          title="Align Bottom"
        >
          ⫵
        </button>
        </div>
      )}

      {/* Distribution Tools (only show for 3+ objects) */}
      {selectedObjects.length >= 3 && (
        <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
          <span className="text-xs text-gray-600 mr-2">Distribute:</span>
          <button
            onClick={() => handleDistribute('horizontal')}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            title="Distribute Horizontally"
          >
            ↔
          </button>
          <button
            onClick={() => handleDistribute('vertical')}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            title="Distribute Vertically"
          >
            ↕
          </button>
        </div>
      )}

      {/* Selection Count */}
      <div className="text-xs text-gray-500 border-l border-gray-300 pl-2">
        {selectedObjects.length} selected
      </div>
    </div>
  );
}
