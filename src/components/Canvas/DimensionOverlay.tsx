import * as THREE from 'three';
import { DraftObject, ViewType } from '@/types';
import { useUIStore } from '@/stores/uiStore';

interface DimensionOverlayProps {
  objects: DraftObject[];
  camera: THREE.OrthographicCamera;
  currentView: ViewType;
  canvasWidth: number;
  canvasHeight: number;
}

export function DimensionOverlay({
  objects,
  camera,
  currentView,
  canvasWidth,
  canvasHeight,
}: DimensionOverlayProps) {
  const { theme } = useUIStore();

  // Theme-based text color
  const textColor = theme === 'light' ? '#000000' : '#FFFFFF';

  // Calculate screen position for an object's center
  const getScreenPosition = (obj: DraftObject): { x: number; y: number } | null => {
    // Calculate object center in world space
    const centerX = obj.position.x + obj.dimensions.width / 2;
    const centerY = obj.position.y + obj.dimensions.height / 2;
    const centerZ = obj.position.z + obj.dimensions.depth / 2;

    const worldPos = new THREE.Vector3(centerX, centerY, centerZ);

    // Project to screen space
    const screenPos = worldPos.clone().project(camera);

    // Convert normalized device coordinates to screen pixels
    const x = ((screenPos.x + 1) / 2) * canvasWidth;
    const y = ((-screenPos.y + 1) / 2) * canvasHeight;

    // Check if position is valid
    if (isNaN(x) || isNaN(y)) return null;

    return { x, y };
  };

  // Get dimensions to display based on current view
  const getDimensionText = (obj: DraftObject): string => {
    const { width, height, depth } = obj.dimensions;

    // Format number to remove unnecessary decimals
    const format = (num: number): string => {
      // If it's a whole number, show no decimals
      if (Number.isInteger(num)) return num.toString();
      // Otherwise show up to 3 decimal places, removing trailing zeros
      return num.toFixed(3).replace(/\.?0+$/, '');
    };

    switch (currentView) {
      case 'front':
      case 'back':
        // Show Width × Height
        return `${format(width)}" × ${format(height)}"`;
      case 'left':
      case 'right':
        // Show Depth × Height
        return `${format(depth)}" × ${format(height)}"`;
      case 'top':
      case 'bottom':
        // Show Width × Depth
        return `${format(width)}" × ${format(depth)}"`;
      default:
        return '';
    }
  };

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        top: '24px',
        left: '24px',
      }}
    >
      {objects
        .filter((obj) => obj.showDimensions)
        .map((obj) => {
          const screenPos = getScreenPosition(obj);
          if (!screenPos) return null;

          const dimensionText = getDimensionText(obj);

          return (
            <text
              key={obj.id}
              x={screenPos.x}
              y={screenPos.y}
              fill={textColor}
              fontSize="12"
              fontFamily="Arial, sans-serif"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                userSelect: 'none',
                textShadow: theme === 'light'
                  ? '0 0 3px white, 0 0 3px white'
                  : '0 0 3px black, 0 0 3px black',
              }}
            >
              {dimensionText}
            </text>
          );
        })}
    </svg>
  );
}
