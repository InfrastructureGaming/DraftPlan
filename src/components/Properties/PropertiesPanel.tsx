import { useProjectStore } from '@/stores/projectStore';

export function PropertiesPanel() {
  const { objects, selectedObjectIds, updateObject } = useProjectStore();

  // Get the first selected object
  const selectedObject = selectedObjectIds.length > 0
    ? objects.find((obj) => obj.id === selectedObjectIds[0])
    : null;

  if (!selectedObject) {
    return (
      <div className="flex flex-col h-full p-4">
        <h2 className="text-sm font-semibold mb-2 text-gray-800">Properties</h2>
        <p className="text-xs text-gray-500">Select an object to view properties</p>
      </div>
    );
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateObject(selectedObject.id, { name: e.target.value });
  };

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: string) => {
    let numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // Apply grid snapping if enabled for this object
      if (selectedObject.gridSnap) {
        numValue = Math.round(numValue); // Snap to 1-inch grid
      }
      updateObject(selectedObject.id, {
        position: { ...selectedObject.position, [axis]: numValue },
      });
    }
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateObject(selectedObject.id, {
        rotation: { ...selectedObject.rotation, [axis]: numValue },
      });
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateObject(selectedObject.id, { notes: e.target.value });
  };

  const handleRotationToggle = () => {
    updateObject(selectedObject.id, { rotationEnabled: !selectedObject.rotationEnabled });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-300">
        <h2 className="text-sm font-semibold text-gray-800">Properties</h2>
      </div>

      {/* Properties Content */}
      <div className="p-4 space-y-4">
        {/* Object Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={selectedObject.name}
            onChange={handleNameChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Position (inches)</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={selectedObject.position.x}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                step="1"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={selectedObject.position.y}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                step="1"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Z</label>
              <input
                type="number"
                value={selectedObject.position.z}
                onChange={(e) => handlePositionChange('z', e.target.value)}
                step="1"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-700">Rotation (degrees)</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedObject.rotationEnabled}
                onChange={handleRotationToggle}
                className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">Enable</span>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={selectedObject.rotation.x}
                onChange={(e) => handleRotationChange('x', e.target.value)}
                disabled={!selectedObject.rotationEnabled}
                step="15"
                className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  !selectedObject.rotationEnabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={selectedObject.rotation.y}
                onChange={(e) => handleRotationChange('y', e.target.value)}
                disabled={!selectedObject.rotationEnabled}
                step="15"
                className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  !selectedObject.rotationEnabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Z</label>
              <input
                type="number"
                value={selectedObject.rotation.z}
                onChange={(e) => handleRotationChange('z', e.target.value)}
                disabled={!selectedObject.rotationEnabled}
                step="15"
                className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  !selectedObject.rotationEnabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>
        </div>

        {/* Dimensions (Read-only) */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Dimensions (inches)</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <input
                type="text"
                value={selectedObject.dimensions.width}
                readOnly
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height</label>
              <input
                type="text"
                value={selectedObject.dimensions.height}
                readOnly
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Length</label>
              <input
                type="text"
                value={selectedObject.dimensions.depth}
                readOnly
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Material */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Material</label>
          <input
            type="text"
            value={selectedObject.material}
            readOnly
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-600"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={selectedObject.category}
            readOnly
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-gray-50 text-gray-600"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={selectedObject.notes}
            onChange={handleNotesChange}
            rows={3}
            placeholder="Add notes about this object..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Multi-selection indicator */}
        {selectedObjectIds.length > 1 && (
          <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-800">
              {selectedObjectIds.length} objects selected
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
