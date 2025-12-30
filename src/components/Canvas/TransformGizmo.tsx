import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { computeWorldTransform } from '@/lib/hierarchy/transforms';
import { screenDeltaToWorldDelta } from '@/lib/geometry/coordinates';
import { ViewType } from '@/types';

interface TransformGizmoProps {
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  panOffset: { x: number; y: number };
  currentView: ViewType;
  camera: THREE.OrthographicCamera;
}

type Axis = 'x' | 'y' | 'z' | null;

export function TransformGizmo({ canvasWidth, canvasHeight, zoom, panOffset, currentView, camera }: TransformGizmoProps) {
  // Subscribe to active tab data
  const objects = useProjectStore((state) => state.tabs[state.activeTabIndex]?.objects || []);
  const assemblies = useProjectStore((state) => state.tabs[state.activeTabIndex]?.assemblies || []);
  const selectedObjectIds = useProjectStore((state) => state.tabs[state.activeTabIndex]?.selectedObjectIds || []);

  // Get actions
  const { updateObject, pushToHistory } = useProjectStore();
  const { theme } = useUIStore();

  // Get selected object (only show gizmo for single selection)
  const selectedObject = selectedObjectIds.length === 1
    ? objects.find(obj => obj.id === selectedObjectIds[0])
    : null;

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragAxis, setDragAxis] = useState<Axis>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragDelta, setDragDelta] = useState(0);
  const dragStartWorldPosRef = useRef({ x: 0, y: 0, z: 0 });
  const dragStartLocalPosRef = useRef({ x: 0, y: 0, z: 0 });

  // Use ref for selected object ID to avoid effect re-runs
  const selectedObjectIdRef = useRef<string | null>(null);

  // Keep ref updated
  useEffect(() => {
    selectedObjectIdRef.current = selectedObject?.id || null;
  }, [selectedObject?.id]);

  // Get world transform
  const worldTransform = selectedObject
    ? computeWorldTransform(selectedObject.id, objects, assemblies)
    : null;

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging || !dragAxis) return;

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault(); // Prevent text selection

      const deltaScreenX = e.clientX - dragStartPos.x;
      const deltaScreenY = e.clientY - dragStartPos.y;

      // Account for canvas offset (24px on each side)
      const canvasOffset = 24;
      const actualCanvasWidth = canvasWidth - canvasOffset * 2;
      const actualCanvasHeight = canvasHeight - canvasOffset * 2;

      // Use the same coordinate transformation as Canvas.tsx for consistency
      const worldDelta = screenDeltaToWorldDelta(
        deltaScreenX,
        deltaScreenY,
        camera,
        currentView,
        actualCanvasWidth,
        actualCanvasHeight
      );

      // Extract only the delta along the constrained axis
      let delta = 0;
      switch (dragAxis) {
        case 'x':
          delta = worldDelta.x;
          break;
        case 'y':
          delta = worldDelta.y;
          break;
        case 'z':
          delta = worldDelta.z;
          break;
      }

      setDragDelta(delta);

      // Use ref for object ID to avoid stale closures
      const objId = selectedObjectIdRef.current;
      if (!objId) return;

      // Calculate new local position by adding delta to initial local position
      // This avoids the stale data issue with worldToLocalPosition
      const newLocalPos = {
        x: dragStartLocalPosRef.current.x + (dragAxis === 'x' ? delta : 0),
        y: dragStartLocalPosRef.current.y + (dragAxis === 'y' ? delta : 0),
        z: dragStartLocalPosRef.current.z + (dragAxis === 'z' ? delta : 0),
      };

      // Update object with skipHistory=true to prevent undo stack pollution during drag
      updateObject(objId, { localPosition: newLocalPos }, true);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragAxis(null);
      setDragDelta(0);
      document.body.style.userSelect = ''; // Restore text selection
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = ''; // Restore text selection on cleanup
    };
  }, [isDragging, dragAxis, dragStartPos, camera, currentView, canvasWidth, canvasHeight, updateObject]);

  // Don't render if no selection or multiple selections
  if (!selectedObject || !worldTransform) {
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

  // Get gizmo center position on screen
  const gizmoScreenPos = worldToScreen(
    worldTransform.position.x,
    worldTransform.position.y,
    worldTransform.position.z
  );

  // Gizmo size (scales with zoom for consistency)
  const baseSize = 60;
  const gizmoSize = baseSize * Math.max(0.5, Math.min(2, zoom)); // Clamp between 0.5x and 2x

  // Axis colors (industry standard)
  const axisColors = {
    x: '#ef4444', // Red
    y: '#22c55e', // Green
    z: '#3b82f6', // Blue
  };

  // Determine which axes are visible in current view
  const getVisibleAxes = (): { x: boolean; y: boolean; z: boolean } => {
    switch (currentView) {
      case 'front':
      case 'back':
        return { x: true, y: true, z: false };
      case 'left':
      case 'right':
        return { x: false, y: true, z: true };
      case 'top':
      case 'bottom':
        return { x: true, y: false, z: true };
      case 'iso-front-left':
      case 'iso-front-right':
      case 'iso-back-left':
      case 'iso-back-right':
        return { x: true, y: true, z: true };
      default:
        return { x: true, y: true, z: true };
    }
  };

  const visibleAxes = getVisibleAxes();

  // Handle mouse down on axis
  const handleAxisMouseDown = (axis: Axis, e: React.MouseEvent) => {
    if (!axis || !selectedObject || !worldTransform) return;
    e.stopPropagation();

    // Push to history before starting drag
    pushToHistory();

    setIsDragging(true);
    setDragAxis(axis);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragDelta(0);
    dragStartWorldPosRef.current = { ...worldTransform.position };
    dragStartLocalPosRef.current = { ...selectedObject.localPosition };
  };

  // Render arrow for an axis
  const renderAxisArrow = (axis: 'x' | 'y' | 'z', angle: number, visible: boolean) => {
    if (!visible) return null;

    const length = gizmoSize;
    const headSize = 10;

    // Calculate end point
    const endX = Math.cos(angle * Math.PI / 180) * length;
    const endY = Math.sin(angle * Math.PI / 180) * length;

    return (
      <g
        key={axis}
        onMouseDown={(e) => handleAxisMouseDown(axis, e)}
        className="cursor-pointer"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Invisible hit area (wider for easier clicking) */}
        <line
          x1={0}
          y1={0}
          x2={endX}
          y2={endY}
          stroke="transparent"
          strokeWidth={20}
        />

        {/* Visible arrow line */}
        <line
          x1={0}
          y1={0}
          x2={endX}
          y2={endY}
          stroke={dragAxis === axis ? '#ffffff' : axisColors[axis]}
          strokeWidth={dragAxis === axis ? 4 : 3}
          opacity={dragAxis === axis ? 1 : 0.9}
        />

        {/* Arrow head */}
        <polygon
          points={`${endX},${endY} ${endX - headSize * Math.cos(angle * Math.PI / 180 - Math.PI / 6)},${endY - headSize * Math.sin(angle * Math.PI / 180 - Math.PI / 6)} ${endX - headSize * Math.cos(angle * Math.PI / 180 + Math.PI / 6)},${endY - headSize * Math.sin(angle * Math.PI / 180 + Math.PI / 6)}`}
          fill={dragAxis === axis ? '#ffffff' : axisColors[axis]}
          opacity={dragAxis === axis ? 1 : 0.9}
        />

        {/* Axis label */}
        <text
          x={endX * 1.2}
          y={endY * 1.2}
          fill={dragAxis === axis ? '#ffffff' : axisColors[axis]}
          fontSize={14}
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
          pointerEvents="none"
        >
          {axis.toUpperCase()}
        </text>
      </g>
    );
  };

  return (
    <>
      {/* Gizmo SVG */}
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: canvasWidth,
          height: canvasHeight,
          pointerEvents: 'none',
          zIndex: 100,
        }}
      >
        <g transform={`translate(${gizmoScreenPos.x}, ${gizmoScreenPos.y})`}>
          {/* X axis (Red) - pointing right */}
          {renderAxisArrow('x', 0, visibleAxes.x)}

          {/* Y axis (Green) - pointing up */}
          {renderAxisArrow('y', -90, visibleAxes.y)}

          {/* Z axis (Blue) - pointing into screen (down-right for isometric) */}
          {renderAxisArrow('z', currentView.startsWith('iso-') ? 30 : 0, visibleAxes.z)}
        </g>
      </svg>

      {/* Numerical feedback during drag */}
      {isDragging && dragAxis && (
        <div
          style={{
            position: 'absolute',
            left: gizmoScreenPos.x + gizmoSize,
            top: gizmoScreenPos.y - 30,
            padding: '4px 8px',
            backgroundColor: theme === 'dark' ? '#1a1a1a' : 'white',
            border: `2px solid ${axisColors[dragAxis]}`,
            borderRadius: '4px',
            color: theme === 'dark' ? 'white' : '#1a1a1a',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 101,
            whiteSpace: 'nowrap',
          }}
        >
          {dragAxis.toUpperCase()}: {dragDelta >= 0 ? '+' : ''}{dragDelta.toFixed(2)}"
        </div>
      )}
    </>
  );
}
