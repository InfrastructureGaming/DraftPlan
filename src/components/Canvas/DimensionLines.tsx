import * as THREE from 'three';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { ViewType } from '@/types';

interface DimensionLinesProps {
  canvasWidth: number;
  canvasHeight: number;
  currentView: ViewType;
  camera: THREE.OrthographicCamera;
}

export function DimensionLines({ canvasWidth, canvasHeight, currentView, camera }: DimensionLinesProps) {
  // Subscribe to dimension lines
  const dimensionLines = useProjectStore((state) => state.tabs[state.activeTabIndex]?.dimensionLines || []);
  const { theme } = useUIStore();

  // Don't render if no dimension lines
  if (dimensionLines.length === 0) {
    return null;
  }

  // Convert world position to screen position using THREE.js camera projection
  const worldToScreen = (worldX: number, worldY: number, worldZ: number) => {
    const canvasOffset = 24; // Canvas offset from container (matches Canvas.tsx styling)

    // Create a 3D vector at the world position
    const worldPos = new THREE.Vector3(worldX, worldY, worldZ);

    // Project to normalized device coordinates using the camera
    const screenPos = worldPos.clone().project(camera);

    // Convert from NDC (-1 to 1) to screen coordinates (0 to width/height)
    const screenX = ((screenPos.x + 1) / 2) * canvasWidth + canvasOffset;
    const screenY = ((-screenPos.y + 1) / 2) * canvasHeight + canvasOffset;

    return { x: screenX, y: screenY };
  };

  // Calculate the distance between two 3D points
  const calculateDistance = (startX: number, startY: number, startZ: number, endX: number, endY: number, endZ: number): number => {
    const dx = endX - startX;
    const dy = endY - startY;
    const dz = endZ - startZ;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  // Render a single dimension line
  const renderDimensionLine = (line: typeof dimensionLines[0]) => {
    if (!line.visible) return null;

    const startScreen = worldToScreen(line.startPoint.x, line.startPoint.y, line.startPoint.z);
    const endScreen = worldToScreen(line.endPoint.x, line.endPoint.y, line.endPoint.z);

    // Calculate distance
    const distance = calculateDistance(
      line.startPoint.x,
      line.startPoint.y,
      line.startPoint.z,
      line.endPoint.x,
      line.endPoint.y,
      line.endPoint.z
    );

    // Calculate midpoint for text
    const midX = (startScreen.x + endScreen.x) / 2;
    const midY = (startScreen.y + endScreen.y) / 2;

    // Calculate perpendicular offset for text
    const dx = endScreen.x - startScreen.x;
    const dy = endScreen.y - startScreen.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Unit perpendicular vector (rotated 90 degrees)
    const perpX = length > 0 ? -dy / length : 0;
    const perpY = length > 0 ? dx / length : 0;

    // Apply text offset
    const textX = midX + perpX * line.textOffset;
    const textY = midY + perpY * line.textOffset;

    // Arrow size
    const arrowSize = 8;
    const arrowAngle = Math.PI / 6; // 30 degrees

    // Calculate line angle
    const lineAngle = Math.atan2(dy, dx);

    // Arrow points at start
    const startArrow1X = startScreen.x + arrowSize * Math.cos(lineAngle + Math.PI - arrowAngle);
    const startArrow1Y = startScreen.y + arrowSize * Math.sin(lineAngle + Math.PI - arrowAngle);
    const startArrow2X = startScreen.x + arrowSize * Math.cos(lineAngle + Math.PI + arrowAngle);
    const startArrow2Y = startScreen.y + arrowSize * Math.sin(lineAngle + Math.PI + arrowAngle);

    // Arrow points at end
    const endArrow1X = endScreen.x + arrowSize * Math.cos(lineAngle - arrowAngle);
    const endArrow1Y = endScreen.y + arrowSize * Math.sin(lineAngle - arrowAngle);
    const endArrow2X = endScreen.x + arrowSize * Math.cos(lineAngle + arrowAngle);
    const endArrow2Y = endScreen.y + arrowSize * Math.sin(lineAngle + arrowAngle);

    return (
      <g key={line.id}>
        {/* Main line */}
        <line
          x1={startScreen.x}
          y1={startScreen.y}
          x2={endScreen.x}
          y2={endScreen.y}
          stroke={line.color}
          strokeWidth={2}
          opacity={0.9}
        />

        {/* Start arrow */}
        <polygon
          points={`${startScreen.x},${startScreen.y} ${startArrow1X},${startArrow1Y} ${startArrow2X},${startArrow2Y}`}
          fill={line.color}
          opacity={0.9}
        />

        {/* End arrow */}
        <polygon
          points={`${endScreen.x},${endScreen.y} ${endArrow1X},${endArrow1Y} ${endArrow2X},${endArrow2Y}`}
          fill={line.color}
          opacity={0.9}
        />

        {/* Distance text */}
        <text
          x={textX}
          y={textY}
          fill={line.color}
          fontSize={12}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          pointerEvents="none"
        >
          {distance.toFixed(2)}"
        </text>

        {/* Text background for better visibility */}
        <rect
          x={textX - 25}
          y={textY - 10}
          width={50}
          height={20}
          fill={theme === 'dark' ? '#1a1a1a' : theme === 'blueprint' ? '#1E3A8A' : 'white'}
          opacity={0.8}
          rx={3}
          style={{ pointerEvents: 'none' }}
        />

        {/* Distance text (rendered again on top of background) */}
        <text
          x={textX}
          y={textY}
          fill={line.color}
          fontSize={12}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          pointerEvents="none"
        >
          {distance.toFixed(2)}"
        </text>

        {/* Endpoint markers for easier clicking */}
        <circle
          cx={startScreen.x}
          cy={startScreen.y}
          r={5}
          fill={line.color}
          opacity={0.5}
        />
        <circle
          cx={endScreen.x}
          cy={endScreen.y}
          r={5}
          fill={line.color}
          opacity={0.5}
        />
      </g>
    );
  };

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: 'none',
        zIndex: 50, // Below gizmo (100) but above canvas
      }}
    >
      {dimensionLines.map(renderDimensionLine)}
    </svg>
  );
}
