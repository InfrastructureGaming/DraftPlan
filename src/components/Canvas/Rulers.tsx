import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

interface RulersProps {
  canvasWidth: number;
  canvasHeight: number;
}

export function Rulers({ canvasWidth, canvasHeight }: RulersProps) {
  const { camera } = useProjectStore();
  const { rulersVisible, theme, gridVisible, majorGridSize, minorGridVisible } = useUIStore();

  if (!rulersVisible) return null;

  const RULER_SIZE = 24; // Height of horizontal ruler, width of vertical ruler (in pixels)
  const { zoom, panOffset } = camera;

  // Calculate the visible world space range
  const viewSize = 50; // matches camera setup in Canvas.tsx
  const aspect = canvasWidth / canvasHeight;
  const worldWidth = (viewSize * aspect) / zoom;
  const worldHeight = viewSize / zoom;

  // Calculate world coordinates at the edges of the viewport
  const worldLeft = panOffset.x - worldWidth / 2;
  const worldRight = panOffset.x + worldWidth / 2;
  const worldTop = panOffset.y + worldHeight / 2;
  const worldBottom = panOffset.y - worldHeight / 2;

  // Calculate effective major grid size for ruler tick marks and grid degradation
  // At zoom < 2x, force grid to 1" minimum regardless of user setting
  let effectiveMajorGridSize = majorGridSize;
  if (zoom < 2 && majorGridSize < 1) {
    effectiveMajorGridSize = 1; // Degrade to 1" at low zoom levels
  }

  // Ruler tick marks match the effective major grid spacing
  const tickInterval = effectiveMajorGridSize;

  // Theme colors
  const rulerBg = theme === 'dark' ? '#1a1a1a' : theme === 'blueprint' ? '#0A2463' : '#f5f5f5';
  const rulerText = theme === 'dark' ? '#ffffff' : theme === 'blueprint' ? '#ffffff' : '#333333';
  const rulerTick = theme === 'dark' ? '#666666' : theme === 'blueprint' ? '#1E3A8A' : '#cccccc';
  const rulerBorder = theme === 'dark' ? '#333333' : theme === 'blueprint' ? '#1E3A8A' : '#dddddd';

  // Helper to convert world coordinate to screen coordinate
  const worldToScreenX = (worldX: number): number => {
    return ((worldX - worldLeft) / worldWidth) * canvasWidth;
  };

  const worldToScreenY = (worldY: number): number => {
    return ((worldTop - worldY) / worldHeight) * canvasHeight;
  };

  // Generate tick marks for horizontal ruler (top) - NO LABELS
  const horizontalTicks = [];
  const startX = Math.floor(worldLeft / tickInterval) * tickInterval;
  const endX = Math.ceil(worldRight / tickInterval) * tickInterval;

  for (let x = startX; x <= endX; x += tickInterval) {
    const screenX = worldToScreenX(x);
    if (screenX < 0 || screenX > canvasWidth) continue;

    horizontalTicks.push(
      <line
        key={`h-${x}`}
        x1={screenX}
        y1={RULER_SIZE - 12}
        x2={screenX}
        y2={RULER_SIZE}
        stroke={rulerTick}
        strokeWidth={1}
      />
    );

    // Add label (whole number inches)
    const label = x === 0 ? '0' : `${Math.abs(x)}`;
    horizontalTicks.push(
      <text
        key={`h-label-${x}`}
        x={screenX}
        y={RULER_SIZE - 14}
        fill={rulerText}
        fontSize="12"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {label}
      </text>
    );
  }

  // Generate tick marks for vertical ruler (left)
  const verticalTicks = [];
  const startY = Math.floor(worldBottom / tickInterval) * tickInterval;
  const endY = Math.ceil(worldTop / tickInterval) * tickInterval;

  for (let y = startY; y <= endY; y += tickInterval) {
    const screenY = worldToScreenY(y);
    if (screenY < 0 || screenY > canvasHeight) continue;

    verticalTicks.push(
      <line
        key={`v-${y}`}
        x1={RULER_SIZE - 12}
        y1={screenY}
        x2={RULER_SIZE}
        y2={screenY}
        stroke={rulerTick}
        strokeWidth={1}
      />
    );

    // Add label (whole number inches)
    const label = y === 0 ? '0' : `${Math.abs(y)}`;
    verticalTicks.push(
      <text
        key={`v-label-${y}`}
        x={RULER_SIZE - 15}
        y={screenY + 4}
        fill={rulerText}
        fontSize="12"
        fontWeight="bold"
        textAnchor="end"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {label}
      </text>
    );
  }

  // Theme colors for grids
  const minorGridColor = theme === 'dark' ? '#404040' : theme === 'blueprint' ? '#1E3A8A' : '#d0d0d0';
  const majorGridColor = theme === 'dark' ? '#606060' : theme === 'blueprint' ? '#3B82F6' : '#a0a0a0';

  // MINOR GRID: Always 1/16" spacing
  const minorGridLines = [];
  const minorGridInterval = 0.0625; // 1/16"

  // Minor grid only visible at zoom levels above 8x (regardless of user setting)
  const showMinorGrid = gridVisible && minorGridVisible && zoom >= 8;

  if (showMinorGrid) {
    // Vertical minor grid lines
    const minorStartX = Math.floor(worldLeft / minorGridInterval) * minorGridInterval;
    const minorEndX = Math.ceil(worldRight / minorGridInterval) * minorGridInterval;

    for (let x = minorStartX; x <= minorEndX; x += minorGridInterval) {
      const screenX = worldToScreenX(x);
      if (screenX < 0 || screenX > canvasWidth) continue;

      // Skip this line if it coincides with a major grid line
      if (Math.abs(x % majorGridSize) < 0.0001) continue;

      minorGridLines.push(
        <line
          key={`minor-v-${x}`}
          x1={screenX}
          y1={0}
          x2={screenX}
          y2={canvasHeight}
          stroke={minorGridColor}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }

    // Horizontal minor grid lines
    const minorStartY = Math.floor(worldBottom / minorGridInterval) * minorGridInterval;
    const minorEndY = Math.ceil(worldTop / minorGridInterval) * minorGridInterval;

    for (let y = minorStartY; y <= minorEndY; y += minorGridInterval) {
      const screenY = worldToScreenY(y);
      if (screenY < 0 || screenY > canvasHeight) continue;

      // Skip this line if it coincides with a major grid line
      if (Math.abs(y % majorGridSize) < 0.0001) continue;

      minorGridLines.push(
        <line
          key={`minor-h-${y}`}
          x1={0}
          y1={screenY}
          x2={canvasWidth}
          y2={screenY}
          stroke={minorGridColor}
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
  }

  // MAJOR GRID: User-selected spacing with zoom-based degradation
  const majorGridLines = [];

  if (gridVisible) {
    // Vertical major grid lines
    const majorStartX = Math.floor(worldLeft / effectiveMajorGridSize) * effectiveMajorGridSize;
    const majorEndX = Math.ceil(worldRight / effectiveMajorGridSize) * effectiveMajorGridSize;

    for (let x = majorStartX; x <= majorEndX; x += effectiveMajorGridSize) {
      const screenX = worldToScreenX(x);
      if (screenX < 0 || screenX > canvasWidth) continue;

      majorGridLines.push(
        <line
          key={`major-v-${x}`}
          x1={screenX}
          y1={0}
          x2={screenX}
          y2={canvasHeight}
          stroke={majorGridColor}
          strokeWidth={1}
          opacity={0.6}
        />
      );
    }

    // Horizontal major grid lines
    const majorStartY = Math.floor(worldBottom / effectiveMajorGridSize) * effectiveMajorGridSize;
    const majorEndY = Math.ceil(worldTop / effectiveMajorGridSize) * effectiveMajorGridSize;

    for (let y = majorStartY; y <= majorEndY; y += effectiveMajorGridSize) {
      const screenY = worldToScreenY(y);
      if (screenY < 0 || screenY > canvasHeight) continue;

      majorGridLines.push(
        <line
          key={`major-h-${y}`}
          x1={0}
          y1={screenY}
          x2={canvasWidth}
          y2={screenY}
          stroke={majorGridColor}
          strokeWidth={1}
          opacity={0.6}
        />
      );
    }
  }

  return (
    <>
      {/* Minor Grid (1/16") - drawn first so major grid appears on top */}
      {minorGridLines.length > 0 && (
        <svg
          className="absolute pointer-events-none"
          width={canvasWidth}
          height={canvasHeight}
          style={{
            top: RULER_SIZE,
            left: RULER_SIZE,
          }}
        >
          {minorGridLines}
        </svg>
      )}

      {/* Major Grid (user-selected spacing) */}
      {majorGridLines.length > 0 && (
        <svg
          className="absolute pointer-events-none"
          width={canvasWidth}
          height={canvasHeight}
          style={{
            top: RULER_SIZE,
            left: RULER_SIZE,
          }}
        >
          {majorGridLines}
        </svg>
      )}

      {/* Top horizontal ruler */}
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        width={canvasWidth}
        height={RULER_SIZE}
        style={{
          marginLeft: RULER_SIZE,
          backgroundColor: rulerBg,
          borderBottom: `1px solid ${rulerBorder}`,
        }}
      >
        {horizontalTicks}
      </svg>

      {/* Left vertical ruler */}
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        width={RULER_SIZE}
        height={canvasHeight}
        style={{
          marginTop: RULER_SIZE,
          backgroundColor: rulerBg,
          borderRight: `1px solid ${rulerBorder}`,
        }}
      >
        {verticalTicks}
      </svg>

      {/* Top-left corner square */}
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: RULER_SIZE,
          height: RULER_SIZE,
          backgroundColor: rulerBg,
          borderRight: `1px solid ${rulerBorder}`,
          borderBottom: `1px solid ${rulerBorder}`,
        }}
      />
    </>
  );
}
