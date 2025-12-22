import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { ViewType } from '@/types';

export function ViewCube() {
  const { camera, setView } = useProjectStore();
  const { theme } = useUIStore();
  const currentView = camera.currentView;

  // Define isometric cube geometry (showing Top, Front, Right faces)
  const cubeSize = 80;
  const faceDepth = 40;

  // Define the three visible faces in isometric view
  // Top face (parallelogram)
  const topFace = {
    points: `${cubeSize / 2},10 ${cubeSize - 5},${cubeSize / 2 - 10} ${cubeSize / 2},${cubeSize - 20} 5,${cubeSize / 2 - 10}`,
    label: 'Top',
    view: 'top' as ViewType,
    textX: cubeSize / 2,
    textY: cubeSize / 2 - 5,
  };

  // Front face (parallelogram)
  const frontFace = {
    points: `5,${cubeSize / 2 - 10} ${cubeSize / 2},${cubeSize - 20} ${cubeSize / 2},${cubeSize + 20} 5,${cubeSize / 2 + 30}`,
    label: 'Front',
    view: 'front' as ViewType,
    textX: cubeSize / 4,
    textY: cubeSize / 2 + 20,
  };

  // Right face (parallelogram)
  const rightFace = {
    points: `${cubeSize / 2},${cubeSize - 20} ${cubeSize - 5},${cubeSize / 2 - 10} ${cubeSize - 5},${cubeSize / 2 + 30} ${cubeSize / 2},${cubeSize + 20}`,
    label: 'Right',
    view: 'right' as ViewType,
    textX: (cubeSize * 3) / 4,
    textY: cubeSize / 2 + 20,
  };

  // Define other views accessible via buttons below the cube
  const otherViews: { label: string; view: ViewType }[] = [
    { label: 'Back', view: 'back' },
    { label: 'Left', view: 'left' },
    { label: 'Bottom', view: 'bottom' },
  ];

  const handleViewClick = (view: ViewType) => {
    setView(view);
  };

  const getFaceColor = (faceView: ViewType) => {
    if (currentView === faceView) {
      return '#3B82F6'; // Blue for active view
    }
    return '#9CA3AF'; // Gray for inactive
  };

  const getFaceHoverColor = (faceView: ViewType) => {
    if (currentView === faceView) {
      return '#2563EB'; // Darker blue
    }
    return '#6B7280'; // Darker gray
  };

  // Get display name for current view
  const getViewDisplayName = (view: ViewType): string => {
    return view.charAt(0).toUpperCase() + view.slice(1);
  };

  // Theme-based colors (matching CanvasControls)
  const colors = {
    bg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-200',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-700',
  };

  return (
    <div className={`${colors.bg} rounded-lg shadow-lg border ${colors.border} p-3 flex flex-col items-center gap-1`}>
      {/* Isometric Cube */}
      <svg width={cubeSize} height={cubeSize + 30} className="cursor-pointer">
        {/* Top Face */}
        <polygon
          points={topFace.points}
          fill={getFaceColor(topFace.view)}
          stroke="#374151"
          strokeWidth="1.5"
          className="transition-colors"
          onClick={() => handleViewClick(topFace.view)}
          style={{
            filter: currentView === topFace.view ? 'brightness(1.1)' : 'brightness(0.9)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.fill = getFaceHoverColor(topFace.view);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.fill = getFaceColor(topFace.view);
          }}
        />

        {/* Front Face */}
        <polygon
          points={frontFace.points}
          fill={getFaceColor(frontFace.view)}
          stroke="#374151"
          strokeWidth="1.5"
          className="transition-colors"
          onClick={() => handleViewClick(frontFace.view)}
          style={{
            filter: currentView === frontFace.view ? 'brightness(1.1)' : 'brightness(0.8)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.fill = getFaceHoverColor(frontFace.view);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.fill = getFaceColor(frontFace.view);
          }}
        />

        {/* Right Face */}
        <polygon
          points={rightFace.points}
          fill={getFaceColor(rightFace.view)}
          stroke="#374151"
          strokeWidth="1.5"
          className="transition-colors"
          onClick={() => handleViewClick(rightFace.view)}
          style={{
            filter: currentView === rightFace.view ? 'brightness(1.1)' : 'brightness(0.7)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.fill = getFaceHoverColor(rightFace.view);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.fill = getFaceColor(rightFace.view);
          }}
        />
      </svg>

      {/* Current View Label */}
      <div className={`text-xs font-semibold ${colors.text} px-2 py-0.5 rounded`}>
        {getViewDisplayName(currentView)}
      </div>

      {/* Additional View Buttons */}
      <div className="flex gap-1 mt-0.5">
        {otherViews.map((view) => (
          <button
            key={view.view}
            onClick={() => handleViewClick(view.view)}
            className={`
              px-2 py-0.5 text-xs font-medium rounded transition-colors
              ${
                currentView === view.view
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }
            `}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}
