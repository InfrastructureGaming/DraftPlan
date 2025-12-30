import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { ViewType } from '@/types';

export function ViewCube() {
  // Subscribe to active tab data with proper selectors
  const camera = useProjectStore((state) => state.tabs[state.activeTabIndex]?.camera);

  // Get actions
  const { setView } = useProjectStore();
  const { theme, viewCubeVisible } = useUIStore();
  const currentView = camera.currentView;

  // Don't render if hidden
  if (!viewCubeVisible) {
    return null;
  }

  // Define isometric cube geometry (showing Top, Front, Right faces)
  const cubeSize = 76; // Reduced by 5% to prevent edge clipping
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

  // Define corner vertices for isometric view buttons (all 4 corners of the TOP face)
  const corners = [
    { x: cubeSize / 2, y: 10, view: 'iso-back-left' as ViewType },                 // Top corner of top face
    { x: cubeSize - 5, y: cubeSize / 2 - 10, view: 'iso-back-right' as ViewType }, // Right corner of top face
    { x: 5, y: cubeSize / 2 - 10, view: 'iso-front-left' as ViewType },           // Left corner of top face
    { x: cubeSize / 2, y: cubeSize - 20, view: 'iso-front-right' as ViewType },   // Bottom corner of top face (front)
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
    if (view.startsWith('iso-')) {
      const parts = view.replace('iso-', '').split('-');
      return 'Iso ' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('-');
    }
    return view.charAt(0).toUpperCase() + view.slice(1);
  };

  // Theme-based colors (matching CanvasControls)
  const colors = {
    bg: theme === 'dark' ? 'bg-[#2a2a2a]' : theme === 'blueprint' ? 'bg-[#1E3A8A]' : 'bg-white',
    border: theme === 'dark' ? 'border-[#333333]' : theme === 'blueprint' ? 'border-[#1E3A8A]' : 'border-gray-200',
    text: theme === 'dark' ? 'text-white' : theme === 'blueprint' ? 'text-white' : 'text-gray-700',
  };

  return (
    <div className={`${colors.bg} rounded-lg shadow-lg border ${colors.border} p-4 flex flex-col items-center gap-1`}>
      {/* Isometric Cube */}
      <svg width={cubeSize + 10} height={cubeSize + 35} viewBox={`-5 -5 ${cubeSize + 10} ${cubeSize + 35}`} className="cursor-pointer">
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

        {/* Corner buttons for isometric views */}
        {corners.map((corner) => (
          <circle
            key={corner.view}
            cx={corner.x}
            cy={corner.y}
            r={6}
            fill={currentView === corner.view ? '#3B82F6' : '#9CA3AF'}
            stroke="#374151"
            strokeWidth="1.5"
            className="cursor-pointer transition-colors"
            onClick={() => handleViewClick(corner.view)}
            onMouseEnter={(e) => {
              e.currentTarget.style.fill = currentView === corner.view ? '#2563EB' : '#6B7280';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.fill = currentView === corner.view ? '#3B82F6' : '#9CA3AF';
            }}
          />
        ))}
      </svg>

      {/* Current View Label */}
      <div className={`text-xs font-semibold ${colors.text} px-2 py-0.5 rounded`}>
        {getViewDisplayName(currentView)}
      </div>
    </div>
  );
}
