import { useState, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { computeWorldTransform } from '@/lib/hierarchy/transforms';

export function PropertiesPanel() {
  // Subscribe to active tab data with proper selectors
  const objects = useProjectStore((state) => state.tabs[state.activeTabIndex]?.objects || []);
  const assemblies = useProjectStore((state) => state.tabs[state.activeTabIndex]?.assemblies || []);
  const selectedObjectIds = useProjectStore((state) => state.tabs[state.activeTabIndex]?.selectedObjectIds || []);

  // Get actions and collapse state from UIStore
  const { updateObject, updateObjectPosition, reparentNode } = useProjectStore();
  const { theme, propertiesPanelCollapsed, togglePropertiesPanelCollapse } = useUIStore();
  const isCollapsed = propertiesPanelCollapsed;

  // Get the first selected object
  const selectedObject = selectedObjectIds.length > 0
    ? objects.find((obj) => obj.id === selectedObjectIds[0])
    : null;

  // Get world transform for selected object
  const worldTransform = selectedObject
    ? computeWorldTransform(selectedObject.id, objects, assemblies)
    : null;

  // Local state for position inputs (allows proper typing/deletion)
  const [positionInputs, setPositionInputs] = useState({ x: '0', y: '0', z: '0' });

  // Sync local state with world transform when object changes
  useEffect(() => {
    if (worldTransform) {
      setPositionInputs({
        x: worldTransform.position.x.toString(),
        y: worldTransform.position.y.toString(),
        z: worldTransform.position.z.toString(),
      });
    }
  }, [selectedObject?.id, worldTransform?.position.x, worldTransform?.position.y, worldTransform?.position.z]);

  // Theme-based colors for collapsed state
  const colors = {
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-500',
    bg: theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'blueprint' ? 'bg-[#0A2463]' : 'bg-white',
  };

  if (!selectedObject || !worldTransform) {
    return (
      <div className={`flex flex-col ${isCollapsed ? 'h-auto' : 'h-full'} ${colors.bg}`}>
        {/* Header */}
        <div className={`p-4 border-b ${colors.border} flex items-center justify-between cursor-pointer`} onClick={togglePropertiesPanelCollapse}>
          <h2 className={`text-sm font-semibold ${colors.text}`}>Properties</h2>
          <button className={`text-xs ${colors.textMuted} transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
            ▼
          </button>
        </div>
        {!isCollapsed && (
          <div className="p-4">
            <p className={`text-xs ${colors.textMuted}`}>Select an object to view properties</p>
          </div>
        )}
      </div>
    );
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateObject(selectedObject.id, { name: e.target.value });
  };

  const handlePositionInputChange = (axis: 'x' | 'y' | 'z', value: string) => {
    // Update local state immediately (allows typing/deleting)
    setPositionInputs((prev) => ({ ...prev, [axis]: value }));
  };

  const handlePositionCommit = (axis: 'x' | 'y' | 'z') => {
    // Parse and commit the value to the store
    const value = positionInputs[axis];
    let numValue = parseFloat(value);

    if (isNaN(numValue)) {
      // If invalid, reset to current world position
      setPositionInputs((prev) => ({
        ...prev,
        [axis]: worldTransform!.position[axis].toString(),
      }));
      return;
    }

    // Apply grid snapping if enabled for this object
    if (selectedObject!.gridSnap) {
      numValue = Math.round(numValue); // Snap to 1-inch grid
    }

    // Get current world position and update only the changed axis
    const currentWorldPos = worldTransform!.position;
    const newWorldPos = {
      x: axis === 'x' ? numValue : currentWorldPos.x,
      y: axis === 'y' ? numValue : currentWorldPos.y,
      z: axis === 'z' ? numValue : currentWorldPos.z,
    };

    updateObjectPosition(selectedObject!.id, newWorldPos);
  };

  const handlePositionKeyDown = (e: React.KeyboardEvent, axis: 'x' | 'y' | 'z') => {
    if (e.key === 'Enter') {
      handlePositionCommit(axis);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      // Reset to current value
      setPositionInputs((prev) => ({
        ...prev,
        [axis]: worldTransform!.position[axis].toString(),
      }));
      (e.target as HTMLInputElement).blur();
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

  const handleShowDimensionsToggle = () => {
    updateObject(selectedObject.id, { showDimensions: !selectedObject.showDimensions });
  };

  const handleDimensionChange = (dimension: 'width' | 'height' | 'depth', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      // Calculate the change in dimension
      const oldDimension = selectedObject.dimensions[dimension];
      const dimensionDelta = numValue - oldDimension;

      // Update dimensions without moving the object's center
      // Since BoxGeometry is centered at origin, we don't need to adjust position
      // The geometry will scale from center automatically
      updateObject(selectedObject.id, {
        dimensions: { ...selectedObject.dimensions, [dimension]: numValue },
      });
    }
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParentId = e.target.value === '' ? undefined : e.target.value;
    reparentNode(selectedObject.id, newParentId);
  };

  const handleUseAssemblyColorToggle = () => {
    updateObject(selectedObject.id, { useAssemblyColor: !selectedObject.useAssemblyColor });
  };

  return (
    <div className={`flex flex-col ${isCollapsed ? 'h-auto' : 'h-full'} overflow-y-auto ${colors.bg}`}>
      {/* Header */}
      <div className={`p-4 border-b ${colors.border} flex items-center justify-between cursor-pointer`} onClick={togglePropertiesPanelCollapse}>
        <h2 className={`text-sm font-semibold ${colors.text}`}>Properties</h2>
        <button className={`text-xs ${colors.textMuted} transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
          ▼
        </button>
      </div>

      {/* Properties Content */}
      {!isCollapsed && (
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

        {/* Hierarchy */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Parent Assembly</label>
          <select
            value={selectedObject.parentId || ''}
            onChange={handleParentChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">None (Root Level)</option>
            {assemblies.map((assembly) => (
              <option key={assembly.id} value={assembly.id}>
                {assembly.name}
              </option>
            ))}
          </select>
          {selectedObject.parentId && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-gray-500">
                Position is relative to parent assembly
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedObject.useAssemblyColor}
                  onChange={handleUseAssemblyColorToggle}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700">Use parent assembly color</span>
              </label>
            </div>
          )}
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Position (inches)</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="text"
                value={positionInputs.x}
                onChange={(e) => handlePositionInputChange('x', e.target.value)}
                onBlur={() => handlePositionCommit('x')}
                onKeyDown={(e) => handlePositionKeyDown(e, 'x')}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="text"
                value={positionInputs.y}
                onChange={(e) => handlePositionInputChange('y', e.target.value)}
                onBlur={() => handlePositionCommit('y')}
                onKeyDown={(e) => handlePositionKeyDown(e, 'y')}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Z</label>
              <input
                type="text"
                value={positionInputs.z}
                onChange={(e) => handlePositionInputChange('z', e.target.value)}
                onBlur={() => handlePositionCommit('z')}
                onKeyDown={(e) => handlePositionKeyDown(e, 'z')}
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

        {/* Dimensions */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Dimensions (inches)</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <input
                type="number"
                value={selectedObject.dimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                step="0.0625"
                min="0.0625"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height</label>
              <input
                type="number"
                value={selectedObject.dimensions.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                step="0.0625"
                min="0.0625"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Length</label>
              <input
                type="number"
                value={selectedObject.dimensions.depth}
                onChange={(e) => handleDimensionChange('depth', e.target.value)}
                step="0.0625"
                min="0.0625"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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

        {/* Display Options */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Display Options</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedObject.showDimensions}
              onChange={handleShowDimensionsToggle}
              className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-700">Show dimensions on canvas</span>
          </label>
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
      )}
    </div>
  );
}
