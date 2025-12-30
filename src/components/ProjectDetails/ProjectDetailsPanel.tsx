import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

export function ProjectDetailsPanel() {
  // Subscribe to active tab data with proper selectors
  const projectInfo = useProjectStore((state) => state.tabs[state.activeTabIndex]?.projectInfo);

  // Get actions and collapse state from UIStore
  const { setProjectInfo } = useProjectStore();
  const { theme, projectDetailsPanelCollapsed, toggleProjectDetailsPanelCollapse } = useUIStore();
  const isCollapsed = projectDetailsPanelCollapsed;

  // Theme-based colors
  const colors = {
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-300',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-800',
    textMuted: theme === 'dark' ? 'text-gray-400' : theme === 'blueprint' ? 'text-blue-200' : 'text-gray-500',
    bg: theme === 'dark' ? 'bg-[#1a1a1a]' : theme === 'blueprint' ? 'bg-[#0A2463]' : 'bg-white',
    inputBg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    inputBorder: theme === 'dark' ? 'border-[#444444]' : theme === 'blueprint' ? 'border-[#2E4A9A]' : 'border-gray-300',
    readOnlyBg: theme === 'dark' ? 'bg-[#222222]' : theme === 'blueprint' ? 'bg-[#0D1F3F]' : 'bg-gray-50',
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectInfo({ name: e.target.value });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProjectInfo({ notes: e.target.value });
  };

  const handleDimensionChange = (dimension: 'width' | 'height' | 'depth', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setProjectInfo({
        exteriorDimensions: {
          width: projectInfo.exteriorDimensions?.width || 0,
          height: projectInfo.exteriorDimensions?.height || 0,
          depth: projectInfo.exteriorDimensions?.depth || 0,
          [dimension]: numValue,
        },
      });
    } else if (value === '') {
      // Allow clearing the field
      setProjectInfo({
        exteriorDimensions: {
          width: projectInfo.exteriorDimensions?.width || 0,
          height: projectInfo.exteriorDimensions?.height || 0,
          depth: projectInfo.exteriorDimensions?.depth || 0,
          [dimension]: 0,
        },
      });
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex flex-col ${isCollapsed ? 'h-auto' : 'h-full'} overflow-y-auto ${colors.bg}`}>
      {/* Header */}
      <div className={`p-4 border-b ${colors.border} flex items-center justify-between cursor-pointer`} onClick={toggleProjectDetailsPanelCollapse}>
        <h2 className={`text-sm font-semibold ${colors.text}`}>Project Details</h2>
        <button className={`text-xs ${colors.textMuted} transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>
          ▼
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
        {/* Project Name */}
        <div>
          <label className={`block text-xs font-medium ${colors.text} mb-1`}>Project Name</label>
          <input
            type="text"
            value={projectInfo.name}
            onChange={handleNameChange}
            placeholder="Untitled Project"
            className={`w-full px-2 py-1 text-sm border ${colors.inputBorder} ${colors.inputBg} ${colors.text} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-medium ${colors.text} mb-1`}>Created</label>
            <input
              type="text"
              value={formatDate(projectInfo.created)}
              readOnly
              className={`w-full px-2 py-1 text-sm border ${colors.inputBorder} ${colors.readOnlyBg} ${colors.textMuted} rounded cursor-default`}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium ${colors.text} mb-1`}>Modified</label>
            <input
              type="text"
              value={formatDate(projectInfo.modified)}
              readOnly
              className={`w-full px-2 py-1 text-sm border ${colors.inputBorder} ${colors.readOnlyBg} ${colors.textMuted} rounded cursor-default`}
            />
          </div>
        </div>

        {/* Exterior Dimensions */}
        <div>
          <label className={`block text-xs font-medium ${colors.text} mb-1`}>
            Exterior Dimensions (inches)
          </label>
          <p className={`text-xs ${colors.textMuted} mb-2`}>
            Optional: Overall project size
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={`block text-xs ${colors.textMuted} mb-1`}>Width</label>
              <input
                type="number"
                value={projectInfo.exteriorDimensions?.width || ''}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                placeholder="0"
                step="0.25"
                min="0"
                className={`w-full px-2 py-1 text-sm border ${colors.inputBorder} ${colors.inputBg} ${colors.text} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
            <div>
              <label className={`block text-xs ${colors.textMuted} mb-1`}>Height</label>
              <input
                type="number"
                value={projectInfo.exteriorDimensions?.height || ''}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                placeholder="0"
                step="0.25"
                min="0"
                className={`w-full px-2 py-1 text-sm border ${colors.inputBorder} ${colors.inputBg} ${colors.text} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
            <div>
              <label className={`block text-xs ${colors.textMuted} mb-1`}>Length</label>
              <input
                type="number"
                value={projectInfo.exteriorDimensions?.depth || ''}
                onChange={(e) => handleDimensionChange('depth', e.target.value)}
                placeholder="0"
                step="0.25"
                min="0"
                className={`w-full px-2 py-1 text-sm border ${colors.inputBorder} ${colors.inputBg} ${colors.text} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
          </div>
        </div>

        {/* Project Notes */}
        <div>
          <label className={`block text-xs font-medium ${colors.text} mb-1`}>Project Notes</label>
          <textarea
            value={projectInfo.notes}
            onChange={handleNotesChange}
            rows={6}
            placeholder="Add notes about your project, materials, techniques, etc..."
            className={`w-full px-2 py-1 text-sm border ${colors.inputBorder} ${colors.inputBg} ${colors.text} rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none`}
          />
        </div>
        </div>
      )}
    </div>
  );
}
