import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { createOrthographicCamera, setupCameraForView } from '@/lib/three/views';
import { screenToWorld, snapVectorToGrid, screenDeltaToWorldDelta } from '@/lib/geometry/coordinates';
import { ViewType, DraftObject, LumberLibraryItem } from '@/types';
import { CanvasControls } from './CanvasControls';
import { Rulers } from './Rulers';
import { DimensionOverlay } from './DimensionOverlay';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const gridRef = useRef<THREE.Group | null>(null);
  const objectMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  const { camera, objects, addObject, updateObject, removeObject, selectObject, clearSelection, selectedObjectIds, undo, redo, pushToHistory, setZoom, setPanOffset, setView } = useProjectStore();
  const { gridVisible, theme, controlsPanelOpen, libraryPanelOpen, propertiesPanelOpen, snapIncrement } = useUIStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isPanningFromButton, setIsPanningFromButton] = useState(false);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [previewSelectedIds, setPreviewSelectedIds] = useState<string[]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [currentGridSpacing, setCurrentGridSpacing] = useState(1);
  const lastGridUpdateRef = useRef({ zoom: 1, viewType: 'front' as ViewType });
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const panStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggedObjectIdsRef = useRef<string[]>([]);
  const initialObjectPositionsRef = useRef<Map<string, Vector3D>>(new Map());
  const clipboardRef = useRef<DraftObject[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const currentZoomRef = useRef(camera.zoom);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Set background color based on theme
    const backgroundColor = theme === 'light' ? 0xf8f6f0 : theme === 'dark' ? 0x2a2a2a : 0x0a2463;
    scene.background = new THREE.Color(backgroundColor);

    // Create camera with correct aspect ratio from actual canvas
    const container = document.getElementById('canvas-container');
    const initialAspect = container ? container.clientWidth / container.clientHeight : 11 / 8.5;
    const cameraInstance = createOrthographicCamera(initialAspect, 50);
    cameraRef.current = cameraInstance;

    // Set initial view
    setupCameraForView(cameraInstance, camera.currentView, camera.zoom, camera.panOffset);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    rendererRef.current = renderer;

    // Size renderer to container
    const updateSize = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Update canvas dimensions for rulers
      setCanvasDimensions({ width, height });

      // Update camera aspect ratio when canvas resizes
      if (cameraRef.current) {
        const aspect = width / height;
        const viewSize = 50;

        cameraRef.current.left = (-viewSize * aspect) / 2;
        cameraRef.current.right = (viewSize * aspect) / 2;
        cameraRef.current.top = viewSize / 2;
        cameraRef.current.bottom = -viewSize / 2;

        cameraRef.current.updateProjectionMatrix();
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, cameraInstance);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateSize);
      renderer.dispose();
    };
  }, []);

  // Trigger resize when panels are toggled
  useEffect(() => {
    // Use requestAnimationFrame to wait for layout to update after panel toggle
    requestAnimationFrame(() => {
      const container = canvasRef.current?.parentElement;
      const renderer = rendererRef.current;
      if (!container || !renderer) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Update canvas dimensions for rulers
      setCanvasDimensions({ width, height });

      // Update camera aspect ratio
      if (cameraRef.current) {
        const aspect = width / height;
        const viewSize = 50;

        cameraRef.current.left = (-viewSize * aspect) / 2;
        cameraRef.current.right = (viewSize * aspect) / 2;
        cameraRef.current.top = viewSize / 2;
        cameraRef.current.bottom = -viewSize / 2;

        cameraRef.current.updateProjectionMatrix();
      }
    });
  }, [libraryPanelOpen, propertiesPanelOpen]);

  // Update camera when view changes
  // Update camera and regenerate grid when view/zoom/pan changes
  useEffect(() => {
    const scene = sceneRef.current;
    const camera3D = cameraRef.current;

    if (!camera3D || !scene) return;

    // Update camera
    setupCameraForView(camera3D, camera.currentView, camera.zoom, camera.panOffset);

    // THREE.js grid DISABLED FOR DEBUGGING - using 2D SVG grid instead
    if (false && gridVisible && canvasDimensions.width > 0 && canvasDimensions.height > 0) {
      const zoomChanged = Math.abs(camera.zoom - lastGridUpdateRef.current.zoom) > 0.01;
      const viewChanged = camera.currentView !== lastGridUpdateRef.current.viewType;
      const needsUpdate = zoomChanged || viewChanged || !gridRef.current;

      if (needsUpdate) {
        // Remove old grid
        if (gridRef.current) {
          scene.remove(gridRef.current);
          gridRef.current.traverse((child) => {
            if (child instanceof THREE.LineSegments) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }

        // FIXED GRID SPACING FOR DEBUGGING
        setCurrentGridSpacing(0.0625); // Always 1/16"

        // Create new grid based on current viewport
        const grid = createInfiniteGrid(
          camera3D,
          camera.zoom,
          camera.panOffset,
          canvasDimensions.width,
          canvasDimensions.height
        );

        gridRef.current = grid;
        updateGridOrientation(grid, camera.currentView);
        scene.add(grid);

        // Update last grid update tracking
        lastGridUpdateRef.current = { zoom: camera.zoom, viewType: camera.currentView };
      }
    }
  }, [camera.currentView, camera.zoom, camera.panOffset, gridVisible, canvasDimensions]);

  // Update background color when theme changes
  useEffect(() => {
    if (sceneRef.current) {
      const backgroundColor = theme === 'light' ? 0xf8f6f0 : theme === 'dark' ? 0x2a2a2a : 0x0a2463;
      sceneRef.current.background = new THREE.Color(backgroundColor);
    }
  }, [theme]);

  // Keyboard event handling for delete, copy, paste, duplicate, undo, redo, etc.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Undo (Cmd/Ctrl + Z, but not Shift+Z)
      if (isCmdOrCtrl && e.key === 'z' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo (Cmd/Ctrl + Shift + Z)
      if (isCmdOrCtrl && e.key === 'z' && e.shiftKey && !isTyping) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete selected objects (Delete or Backspace key)
      // Only if not typing in an input field
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObjectIds.length > 0 && !isTyping) {
        // Prevent backspace from navigating back in browser
        e.preventDefault();
        selectedObjectIds.forEach((id) => removeObject(id));
      }

      // Copy (Cmd/Ctrl + C)
      if (isCmdOrCtrl && e.key === 'c' && selectedObjectIds.length > 0 && !isTyping) {
        e.preventDefault();
        clipboardRef.current = selectedObjectIds
          .map((id) => objects.find((obj) => obj.id === id))
          .filter((obj): obj is DraftObject => obj !== undefined);
      }

      // Paste (Cmd/Ctrl + V)
      if (isCmdOrCtrl && e.key === 'v' && clipboardRef.current.length > 0 && !isTyping) {
        e.preventDefault();
        const newIds: string[] = [];

        clipboardRef.current.forEach((obj) => {
          const newId = `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newObject: DraftObject = {
            ...obj,
            id: newId,
            position: {
              x: obj.position.x + 2, // Offset by 2 inches
              y: obj.position.y + 2,
              z: obj.position.z,
            },
          };
          addObject(newObject);
          newIds.push(newId);
        });

        // Select the newly pasted objects
        clearSelection();
        newIds.forEach((id) => selectObject(id, true));
      }

      // Duplicate (Cmd/Ctrl + D)
      if (isCmdOrCtrl && e.key === 'd' && selectedObjectIds.length > 0 && !isTyping) {
        e.preventDefault();
        const newIds: string[] = [];

        selectedObjectIds.forEach((id) => {
          const obj = objects.find((o) => o.id === id);
          if (!obj) return;

          const newId = `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newObject: DraftObject = {
            ...obj,
            id: newId,
            position: {
              x: obj.position.x + 2, // Offset by 2 inches
              y: obj.position.y + 2,
              z: obj.position.z,
            },
          };
          addObject(newObject);
          newIds.push(newId);
        });

        // Select the newly duplicated objects
        clearSelection();
        newIds.forEach((id) => selectObject(id, true));
      }

      // View switching (keys 1-6)
      if (!isTyping && !isCmdOrCtrl) {
        const viewMap: Record<string, ViewType> = {
          '1': 'front',
          '2': 'back',
          '3': 'left',
          '4': 'right',
          '5': 'top',
          '6': 'bottom',
        };

        if (e.key in viewMap) {
          e.preventDefault();
          setView(viewMap[e.key]);
        }
      }

      // Arrow key movement
      if (!isTyping && selectedObjectIds.length > 0) {
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (arrowKeys.includes(e.key)) {
          e.preventDefault();

          // Movement step size: from snapIncrement dropdown, 1/8 of that with Shift for fine control
          const stepSize = e.shiftKey ? snapIncrement / 8 : snapIncrement;

          // Push to history before first move
          pushToHistory();

          // Determine movement delta based on current view
          let deltaX = 0, deltaY = 0, deltaZ = 0;

          switch (camera.currentView) {
            case 'front':
              // Looking down +Z, X is right, Y is up
              if (e.key === 'ArrowLeft') deltaX = -stepSize;
              if (e.key === 'ArrowRight') deltaX = stepSize;
              if (e.key === 'ArrowUp') deltaY = stepSize;
              if (e.key === 'ArrowDown') deltaY = -stepSize;
              break;
            case 'back':
              // Looking down -Z, -X is right, Y is up
              if (e.key === 'ArrowLeft') deltaX = stepSize;
              if (e.key === 'ArrowRight') deltaX = -stepSize;
              if (e.key === 'ArrowUp') deltaY = stepSize;
              if (e.key === 'ArrowDown') deltaY = -stepSize;
              break;
            case 'left':
              // Looking down +X, Z is right, Y is up
              if (e.key === 'ArrowLeft') deltaZ = -stepSize;
              if (e.key === 'ArrowRight') deltaZ = stepSize;
              if (e.key === 'ArrowUp') deltaY = stepSize;
              if (e.key === 'ArrowDown') deltaY = -stepSize;
              break;
            case 'right':
              // Looking down -X, -Z is right, Y is up
              if (e.key === 'ArrowLeft') deltaZ = stepSize;
              if (e.key === 'ArrowRight') deltaZ = -stepSize;
              if (e.key === 'ArrowUp') deltaY = stepSize;
              if (e.key === 'ArrowDown') deltaY = -stepSize;
              break;
            case 'top':
              // Looking down -Y, X is right, Z is down (screen up)
              if (e.key === 'ArrowLeft') deltaX = -stepSize;
              if (e.key === 'ArrowRight') deltaX = stepSize;
              if (e.key === 'ArrowUp') deltaZ = -stepSize;
              if (e.key === 'ArrowDown') deltaZ = stepSize;
              break;
            case 'bottom':
              // Looking down +Y, X is right, -Z is down (screen up)
              if (e.key === 'ArrowLeft') deltaX = -stepSize;
              if (e.key === 'ArrowRight') deltaX = stepSize;
              if (e.key === 'ArrowUp') deltaZ = stepSize;
              if (e.key === 'ArrowDown') deltaZ = -stepSize;
              break;
          }

          // Move all selected objects
          selectedObjectIds.forEach((id) => {
            const obj = objects.find((o) => o.id === id);
            if (!obj) return;

            let newPos = {
              x: obj.position.x + deltaX,
              y: obj.position.y + deltaY,
              z: obj.position.z + deltaZ,
            };

            // Snap to grid if enabled (skip snapping with Shift for fine control)
            if (obj.gridSnap && !e.shiftKey) {
              newPos = snapVectorToGrid(newPos, snapIncrement);
            }

            updateObject(id, { position: newPos });
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectIds, objects, removeObject, addObject, selectObject, clearSelection, undo, redo, pushToHistory, setZoom, setPanOffset, setView, updateObject, camera.currentView]);

  // Render objects from store
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const currentMeshes = objectMeshesRef.current;

    // Remove meshes for deleted objects
    currentMeshes.forEach((mesh, id) => {
      if (!objects.find((obj) => obj.id === id)) {
        scene.remove(mesh);
        currentMeshes.delete(id);
      }
    });

    // Add or update meshes for current objects
    objects.forEach((obj) => {
      const isSelected = selectedObjectIds.includes(obj.id);
      const isPreviewSelected = previewSelectedIds.includes(obj.id);

      if (!currentMeshes.has(obj.id)) {
        const mesh = createObjectMesh(obj, isSelected);
        currentMeshes.set(obj.id, mesh);
        scene.add(mesh);
      } else {
        // Update existing mesh position, rotation, and selection state
        const mesh = currentMeshes.get(obj.id)!;
        mesh.position.set(
          obj.position.x + obj.dimensions.width / 2,
          obj.position.y + obj.dimensions.height / 2,
          obj.position.z + obj.dimensions.depth / 2
        );

        // Update rotation (convert from degrees to radians)
        mesh.rotation.set(
          (obj.rotation.x * Math.PI) / 180,
          (obj.rotation.y * Math.PI) / 180,
          (obj.rotation.z * Math.PI) / 180
        );

        // Update selection highlight (selected takes priority over preview)
        updateMeshSelection(mesh, isSelected, isPreviewSelected);
      }
    });
  }, [objects, selectedObjectIds, previewSelectedIds]);

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData('application/json');
      const libraryItem: LumberLibraryItem = JSON.parse(data);

      // Get canvas rect for coordinate conversion
      const canvas = canvasRef.current;
      const camera3D = cameraRef.current;
      if (!canvas || !camera3D) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Convert to world coordinates
      let worldPos = screenToWorld(
        screenX,
        screenY,
        camera3D,
        camera.currentView,
        rect.width,
        rect.height
      );

      // Snap to grid using current snap increment
      worldPos = snapVectorToGrid(worldPos, snapIncrement);

      // Create new object from library item
      const newObject: DraftObject = {
        id: `obj-${Date.now()}`,
        type: libraryItem.category === 'Sheet Goods' ? 'sheet' : 'lumber',
        name: libraryItem.nominalName,
        position: worldPos,
        dimensions: libraryItem.actualDimensions,
        rotation: { x: 0, y: 0, z: 0 },
        material: libraryItem.material,
        category: libraryItem.category,
        tags: libraryItem.tags,
        gridSnap: true,
        showDimensions: true,
        rotationEnabled: false,
        notes: '',
      };

      addObject(newObject);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const camera3D = cameraRef.current;
    if (!canvas || !camera3D) return;

    // Middle mouse button or Space+Left mouse or pan button for panning
    if (e.button === 1 || (e.button === 0 && e.shiftKey) || (e.button === 0 && isPanningFromButton)) {
      e.preventDefault();
      setIsPanning(true);
      panStartPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Only handle left mouse button for object selection/dragging
    if (e.button !== 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Set up raycaster
    const mouse = new THREE.Vector2(x, y);
    raycasterRef.current.setFromCamera(mouse, camera3D);

    // Get all meshes to test
    const meshes: THREE.Object3D[] = [];
    objectMeshesRef.current.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
    });

    // Check for intersections
    const intersects = raycasterRef.current.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      // Find which object was clicked
      const clickedMesh = intersects[0].object;
      let clickedObjectId: string | null = null;

      objectMeshesRef.current.forEach((group, id) => {
        group.traverse((child) => {
          if (child === clickedMesh) {
            clickedObjectId = id;
          }
        });
      });

      if (clickedObjectId) {
        const isMultiSelect = e.ctrlKey || e.metaKey;

        // Handle selection
        if (isMultiSelect) {
          // Multi-select: toggle this object
          selectObject(clickedObjectId, true);
        } else if (!selectedObjectIds.includes(clickedObjectId)) {
          // Single click on unselected object: select only this one
          selectObject(clickedObjectId, false);
        }
        // If clicking on already-selected object without modifier, keep selection for dragging

        // Prepare for dragging
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };

        // Determine which objects will be dragged if drag starts
        const objectsToDrag = selectedObjectIds.includes(clickedObjectId)
          ? selectedObjectIds
          : [clickedObjectId];

        draggedObjectIdsRef.current = objectsToDrag;

        // Store initial positions of all objects that might be dragged
        const initialPositions = new Map<string, Vector3D>();
        objectsToDrag.forEach((id) => {
          const obj = objects.find((o) => o.id === id);
          if (obj) {
            initialPositions.set(id, { ...obj.position });
          }
        });
        initialObjectPositionsRef.current = initialPositions;
      }
    } else {
      // Clicked empty space - start box selection or clear selection
      if (!e.ctrlKey && !e.metaKey) {
        // Start box selection
        const rect = canvas.getBoundingClientRect();
        setSelectionBox({
          startX: e.clientX - rect.left,
          startY: e.clientY - rect.top,
          currentX: e.clientX - rect.left,
          currentY: e.clientY - rect.top,
        });
        setIsBoxSelecting(true);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Track mouse position for cursor-focused zooming
    lastMousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Skip object dragging if we're in pan mode
    if (isPanning) return;

    // Check if we should start dragging objects
    if (!isDragging && dragStartPosRef.current && draggedObjectIdsRef.current.length > 0) {
      // Start dragging - push current state to history before any updates
      pushToHistory();
      setIsDragging(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Handle box selection completion
    if (isBoxSelecting && selectionBox) {
      const canvas = canvasRef.current;
      const camera3D = cameraRef.current;
      if (canvas && camera3D) {
        const rect = canvas.getBoundingClientRect();

        // Calculate selection box bounds with tolerance for edge cases
        const tolerance = 2; // pixels of tolerance to make selection more sensitive
        const minX = Math.min(selectionBox.startX, selectionBox.currentX) - tolerance;
        const maxX = Math.max(selectionBox.startX, selectionBox.currentX) + tolerance;
        const minY = Math.min(selectionBox.startY, selectionBox.currentY) - tolerance;
        const maxY = Math.max(selectionBox.startY, selectionBox.currentY) + tolerance;

        // Only select if the box has meaningful size (at least 5 pixels)
        if (Math.abs(maxX - minX) > 5 + tolerance * 2 && Math.abs(maxY - minY) > 5 + tolerance * 2) {
          // Clear current selection
          clearSelection();

          // Find objects that intersect with the box
          objects.forEach((obj) => {
            // Calculate object's bounding box in world space
            const halfWidth = obj.dimensions.width / 2;
            const halfHeight = obj.dimensions.height / 2;
            const halfDepth = obj.dimensions.depth / 2;

            // Get all 8 corners of the bounding box
            const corners = [
              new THREE.Vector3(obj.position.x - halfWidth, obj.position.y - halfHeight, obj.position.z - halfDepth),
              new THREE.Vector3(obj.position.x + halfWidth, obj.position.y - halfHeight, obj.position.z - halfDepth),
              new THREE.Vector3(obj.position.x - halfWidth, obj.position.y + halfHeight, obj.position.z - halfDepth),
              new THREE.Vector3(obj.position.x + halfWidth, obj.position.y + halfHeight, obj.position.z - halfDepth),
              new THREE.Vector3(obj.position.x - halfWidth, obj.position.y - halfHeight, obj.position.z + halfDepth),
              new THREE.Vector3(obj.position.x + halfWidth, obj.position.y - halfHeight, obj.position.z + halfDepth),
              new THREE.Vector3(obj.position.x - halfWidth, obj.position.y + halfHeight, obj.position.z + halfDepth),
              new THREE.Vector3(obj.position.x + halfWidth, obj.position.y + halfHeight, obj.position.z + halfDepth),
            ];

            // Project all corners to screen space
            const screenCorners = corners.map(corner => {
              const screenPos = corner.clone().project(camera3D);
              return {
                x: ((screenPos.x + 1) / 2) * rect.width,
                y: ((-screenPos.y + 1) / 2) * rect.height,
              };
            });

            // Calculate screen-space AABB from projected corners
            const objMinX = Math.min(...screenCorners.map(c => c.x));
            const objMaxX = Math.max(...screenCorners.map(c => c.x));
            const objMinY = Math.min(...screenCorners.map(c => c.y));
            const objMaxY = Math.max(...screenCorners.map(c => c.y));

            // Check if object's screen AABB intersects with selection box
            const intersects = !(objMaxX < minX || objMinX > maxX || objMaxY < minY || objMinY > maxY);

            if (intersects) {
              selectObject(obj.id, true);
            }
          });
        } else {
          // Box too small - just clear selection (like a click on empty space)
          clearSelection();
        }
      }

      setIsBoxSelecting(false);
      setSelectionBox(null);
    }

    setIsDragging(false);
    setIsPanning(false);
    dragStartPosRef.current = null;
    panStartPosRef.current = null;
    draggedObjectIdsRef.current = [];
    initialObjectPositionsRef.current.clear();
  };

  // Keep zoom ref in sync with store
  useEffect(() => {
    currentZoomRef.current = camera.zoom;
  }, [camera.zoom]);

  // Mouse wheel zoom handler - DISABLED FOR DEBUGGING
  /*
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom delta
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      const oldZoom = currentZoomRef.current;
      const newZoom = Math.max(0.1, Math.min(10, oldZoom * zoomDelta));

      // Calculate world position before zoom
      const camera3D = cameraRef.current;
      if (!camera3D) return;

      // Convert mouse position to normalized device coordinates
      const ndcX = (mouseX / rect.width) * 2 - 1;
      const ndcY = -(mouseY / rect.height) * 2 + 1;

      // Calculate the world space position at the cursor (accounting for current pan)
      const viewSize = 50; // matches camera setup
      const aspect = rect.width / rect.height;
      const worldXBeforeZoom = camera.panOffset.x + (ndcX * viewSize * aspect) / (2 * oldZoom);
      const worldYBeforeZoom = camera.panOffset.y + (ndcY * viewSize) / (2 * oldZoom);

      // Calculate where that world position would be after zoom
      const worldXAfterZoom = camera.panOffset.x + (ndcX * viewSize * aspect) / (2 * newZoom);
      const worldYAfterZoom = camera.panOffset.y + (ndcY * viewSize) / (2 * newZoom);

      // Adjust pan to keep the cursor world position fixed
      const panDeltaX = worldXBeforeZoom - worldXAfterZoom;
      const panDeltaY = worldYBeforeZoom - worldYAfterZoom;

      // Update both zoom and pan simultaneously
      setZoom(newZoom);
      setPanOffset({
        x: camera.panOffset.x + panDeltaX,
        y: camera.panOffset.y + panDeltaY,
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [setZoom, setPanOffset, camera.panOffset]);
  */

  // Control handlers
  // Fixed zoom levels for discrete, incremental zoom control
  const ZOOM_LEVELS = [0.25, 0.33, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0, 8.0, 10.0, 12.0, 16.0];

  const handleZoomIn = () => {
    // Find the next higher zoom level
    const nextLevel = ZOOM_LEVELS.find(level => level > camera.zoom);
    if (nextLevel) {
      setZoom(nextLevel);
    }
  };

  const handleZoomOut = () => {
    // Find the next lower zoom level
    const prevLevel = [...ZOOM_LEVELS].reverse().find(level => level < camera.zoom);
    if (prevLevel) {
      setZoom(prevLevel);
    }
  };

  const handleResetZoom = () => {
    setZoom(1.0);
  };

  const handleResetPan = () => {
    setPanOffset({ x: 0, y: 0 });
  };

  const handlePanStart = () => {
    setIsPanningFromButton(true);
    setIsPanning(true);
  };

  const handlePanEnd = () => {
    setIsPanningFromButton(false);
    setIsPanning(false);
    panStartPosRef.current = null;
  };

  // Global mouse move handler for panning
  useEffect(() => {
    if (!isPanning) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Initialize pan start position if not set
      if (!panStartPosRef.current) {
        panStartPosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const deltaX = e.clientX - panStartPosRef.current.x;
      const deltaY = e.clientY - panStartPosRef.current.y;

      // Convert screen delta to world space pan offset
      // The pan speed is inversely proportional to zoom (more zoom = slower pan)
      const panSpeed = 0.05 / camera.zoom;
      const newPanOffset = {
        x: camera.panOffset.x - deltaX * panSpeed,
        y: camera.panOffset.y + deltaY * panSpeed, // Invert Y for natural panning
      };

      setPanOffset(newPanOffset);
      panStartPosRef.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isPanning, camera.zoom, camera.panOffset, setPanOffset]);

  // Global mouse move handler for object dragging
  useEffect(() => {
    if (!isDragging || draggedObjectIdsRef.current.length === 0 || !dragStartPosRef.current) return;

    const handleGlobalDragMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      const camera3D = cameraRef.current;
      if (!canvas || !camera3D) return;

      const rect = canvas.getBoundingClientRect();

      // Calculate total mouse delta from initial drag start position
      const totalDeltaX = e.clientX - dragStartPosRef.current!.x;
      const totalDeltaY = e.clientY - dragStartPosRef.current!.y;

      // Convert delta to world space based on current view
      const worldDelta = screenDeltaToWorldDelta(
        totalDeltaX,
        totalDeltaY,
        camera3D,
        camera.currentView,
        rect.width,
        rect.height
      );

      // Update all dragged objects from their initial positions
      // Skip history tracking during drag (we already pushed at drag start)
      draggedObjectIdsRef.current.forEach((id) => {
        const initialPos = initialObjectPositionsRef.current.get(id);
        if (!initialPos) return;

        const obj = objects.find((o) => o.id === id);
        if (!obj) return;

        // Calculate new position from initial position + world delta
        let newPos = {
          x: initialPos.x + worldDelta.x,
          y: initialPos.y + worldDelta.y,
          z: initialPos.z + worldDelta.z,
        };

        // Snap to grid if enabled (using current snap increment)
        if (obj.gridSnap) {
          newPos = snapVectorToGrid(newPos, snapIncrement);
        }

        updateObject(id, { position: newPos }, true); // skipHistory = true
      });
    };

    document.addEventListener('mousemove', handleGlobalDragMove);

    return () => {
      document.removeEventListener('mousemove', handleGlobalDragMove);
    };
  }, [isDragging, camera.currentView, objects, updateObject]);

  // Global mouse move handler for box selection
  useEffect(() => {
    if (!isBoxSelecting || !selectionBox) return;

    const handleGlobalBoxMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      setSelectionBox((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentX: e.clientX - rect.left,
          currentY: e.clientY - rect.top,
        };
      });
    };

    document.addEventListener('mousemove', handleGlobalBoxMove);

    return () => {
      document.removeEventListener('mousemove', handleGlobalBoxMove);
    };
  }, [isBoxSelecting, selectionBox]);

  // Update preview selection in real-time as box selection changes
  useEffect(() => {
    if (!isBoxSelecting || !selectionBox) {
      setPreviewSelectedIds([]);
      return;
    }

    const canvas = canvasRef.current;
    const camera3D = cameraRef.current;
    if (!canvas || !camera3D) return;

    const rect = canvas.getBoundingClientRect();

    // Calculate selection box bounds with tolerance
    const tolerance = 2;
    const minX = Math.min(selectionBox.startX, selectionBox.currentX) - tolerance;
    const maxX = Math.max(selectionBox.startX, selectionBox.currentX) + tolerance;
    const minY = Math.min(selectionBox.startY, selectionBox.currentY) - tolerance;
    const maxY = Math.max(selectionBox.startY, selectionBox.currentY) + tolerance;

    // Find objects that intersect with the box
    const previewIds: string[] = [];
    objects.forEach((obj) => {
      // Calculate object's bounding box in world space
      const halfWidth = obj.dimensions.width / 2;
      const halfHeight = obj.dimensions.height / 2;
      const halfDepth = obj.dimensions.depth / 2;

      // Get all 8 corners of the bounding box
      const corners = [
        new THREE.Vector3(obj.position.x - halfWidth, obj.position.y - halfHeight, obj.position.z - halfDepth),
        new THREE.Vector3(obj.position.x + halfWidth, obj.position.y - halfHeight, obj.position.z - halfDepth),
        new THREE.Vector3(obj.position.x - halfWidth, obj.position.y + halfHeight, obj.position.z - halfDepth),
        new THREE.Vector3(obj.position.x + halfWidth, obj.position.y + halfHeight, obj.position.z - halfDepth),
        new THREE.Vector3(obj.position.x - halfWidth, obj.position.y - halfHeight, obj.position.z + halfDepth),
        new THREE.Vector3(obj.position.x + halfWidth, obj.position.y - halfHeight, obj.position.z + halfDepth),
        new THREE.Vector3(obj.position.x - halfWidth, obj.position.y + halfHeight, obj.position.z + halfDepth),
        new THREE.Vector3(obj.position.x + halfWidth, obj.position.y + halfHeight, obj.position.z + halfDepth),
      ];

      // Project all corners to screen space
      const screenCorners = corners.map(corner => {
        const screenPos = corner.clone().project(camera3D);
        return {
          x: ((screenPos.x + 1) / 2) * rect.width,
          y: ((-screenPos.y + 1) / 2) * rect.height,
        };
      });

      // Calculate screen-space AABB from projected corners
      const objMinX = Math.min(...screenCorners.map(c => c.x));
      const objMaxX = Math.max(...screenCorners.map(c => c.x));
      const objMinY = Math.min(...screenCorners.map(c => c.y));
      const objMaxY = Math.max(...screenCorners.map(c => c.y));

      // Check if object's screen AABB intersects with selection box
      const intersects = !(objMaxX < minX || objMinX > maxX || objMaxY < minY || objMinY > maxY);

      if (intersects) {
        previewIds.push(obj.id);
      }
    });

    setPreviewSelectedIds(previewIds);
  }, [isBoxSelecting, selectionBox, objects]);

  // Global mouseup handler to ensure operations end properly
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      // Handle box selection completion if active
      if (isBoxSelecting && selectionBox) {
        const canvas = canvasRef.current;
        const camera3D = cameraRef.current;
        if (canvas && camera3D) {
          const rect = canvas.getBoundingClientRect();

          // Calculate selection box bounds with tolerance for edge cases
          const tolerance = 2; // pixels of tolerance to make selection more sensitive
          const minX = Math.min(selectionBox.startX, selectionBox.currentX) - tolerance;
          const maxX = Math.max(selectionBox.startX, selectionBox.currentX) + tolerance;
          const minY = Math.min(selectionBox.startY, selectionBox.currentY) - tolerance;
          const maxY = Math.max(selectionBox.startY, selectionBox.currentY) + tolerance;

          // Only select if the box has meaningful size (at least 5 pixels)
          if (Math.abs(maxX - minX) > 5 + tolerance * 2 && Math.abs(maxY - minY) > 5 + tolerance * 2) {
            // Clear current selection
            clearSelection();

            // Find objects that intersect with the box
            objects.forEach((obj) => {
              // Calculate object's bounding box in world space
              const halfWidth = obj.dimensions.width / 2;
              const halfHeight = obj.dimensions.height / 2;
              const halfDepth = obj.dimensions.depth / 2;

              // Get all 8 corners of the bounding box
              const corners = [
                new THREE.Vector3(obj.position.x - halfWidth, obj.position.y - halfHeight, obj.position.z - halfDepth),
                new THREE.Vector3(obj.position.x + halfWidth, obj.position.y - halfHeight, obj.position.z - halfDepth),
                new THREE.Vector3(obj.position.x - halfWidth, obj.position.y + halfHeight, obj.position.z - halfDepth),
                new THREE.Vector3(obj.position.x + halfWidth, obj.position.y + halfHeight, obj.position.z - halfDepth),
                new THREE.Vector3(obj.position.x - halfWidth, obj.position.y - halfHeight, obj.position.z + halfDepth),
                new THREE.Vector3(obj.position.x + halfWidth, obj.position.y - halfHeight, obj.position.z + halfDepth),
                new THREE.Vector3(obj.position.x - halfWidth, obj.position.y + halfHeight, obj.position.z + halfDepth),
                new THREE.Vector3(obj.position.x + halfWidth, obj.position.y + halfHeight, obj.position.z + halfDepth),
              ];

              // Project all corners to screen space
              const screenCorners = corners.map(corner => {
                const screenPos = corner.clone().project(camera3D);
                return {
                  x: ((screenPos.x + 1) / 2) * rect.width,
                  y: ((-screenPos.y + 1) / 2) * rect.height,
                };
              });

              // Calculate screen-space AABB from projected corners
              const objMinX = Math.min(...screenCorners.map(c => c.x));
              const objMaxX = Math.max(...screenCorners.map(c => c.x));
              const objMinY = Math.min(...screenCorners.map(c => c.y));
              const objMaxY = Math.max(...screenCorners.map(c => c.y));

              // Check if object's screen AABB intersects with selection box
              const intersects = !(objMaxX < minX || objMinX > maxX || objMaxY < minY || objMinY > maxY);

              if (intersects) {
                selectObject(obj.id, true);
              }
            });
          } else {
            // Box too small - just clear selection
            clearSelection();
          }
        }
        setSelectionBox(null);
      }

      setIsDragging(false);
      setIsPanning(false);
      setIsBoxSelecting(false);
      dragStartPosRef.current = null;
      panStartPosRef.current = null;
      draggedObjectIdsRef.current = [];
      initialObjectPositionsRef.current.clear();
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isBoxSelecting, selectionBox, objects, clearSelection, selectObject]);

  return (
    <div
      className={`w-full h-full relative overflow-hidden ${isDragOver ? 'ring-2 ring-blue-500 ring-inset' : ''} ${
        isPanning ? 'cursor-grabbing' : isDragging ? 'cursor-move' : isBoxSelecting ? 'cursor-crosshair' : 'cursor-default'
      }`}
      id="canvas-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        className="absolute"
        style={{
          width: 'calc(100% - 24px)',
          height: 'calc(100% - 24px)',
          top: '24px',
          left: '24px',
        }}
      />

      {/* Selection box overlay */}
      {isBoxSelecting && selectionBox && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
            top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
            width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
            height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
            border: '2px solid rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
          }}
        />
      )}

      {/* Rulers */}
      <Rulers canvasWidth={canvasDimensions.width} canvasHeight={canvasDimensions.height} />

      {/* Dimension Text Overlay */}
      {cameraRef.current && canvasDimensions.width > 0 && (
        <DimensionOverlay
          objects={objects}
          camera={cameraRef.current}
          currentView={camera.currentView}
          canvasWidth={canvasDimensions.width}
          canvasHeight={canvasDimensions.height}
        />
      )}

      {/* Canvas Controls */}
      {controlsPanelOpen && (
        <CanvasControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onResetPan={handleResetPan}
          onPanStart={handlePanStart}
          onPanEnd={handlePanEnd}
          gridSize={currentGridSpacing}
        />
      )}
    </div>
  );
}

/**
 * Create a Three.js mesh for a DraftObject
 */
function createObjectMesh(obj: DraftObject, isSelected: boolean = false): THREE.Group {
  const group = new THREE.Group();

  // Ensure dimensions are valid (minimum 0.001 to avoid WebGL errors)
  const minDimension = 0.001;
  const width = Math.max(minDimension, obj.dimensions.width || minDimension);
  const height = Math.max(minDimension, obj.dimensions.height || minDimension);
  const depth = Math.max(minDimension, obj.dimensions.depth || minDimension);

  // Create box geometry
  const geometry = new THREE.BoxGeometry(width, height, depth);

  // Create material (gray fill or blue if selected)
  const material = new THREE.MeshBasicMaterial({
    color: isSelected ? 0x4A90E2 : 0x808080,
    wireframe: false,
  });

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);

  // Create edges (black outlines or thicker blue if selected)
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMaterial = new THREE.LineBasicMaterial({
    color: isSelected ? 0x2563eb : 0x000000,
    linewidth: isSelected ? 2 : 1,
  });
  const wireframe = new THREE.LineSegments(edges, lineMaterial);

  mesh.add(wireframe);
  group.add(mesh);

  // Set position (offset by half dimensions so origin is at bottom-left-back corner)
  group.position.set(
    obj.position.x + width / 2,
    obj.position.y + height / 2,
    obj.position.z + depth / 2
  );

  // Set rotation (convert from degrees to radians)
  group.rotation.set(
    (obj.rotation.x * Math.PI) / 180,
    (obj.rotation.y * Math.PI) / 180,
    (obj.rotation.z * Math.PI) / 180
  );

  return group;
}

/**
 * Update mesh selection state
 */
function updateMeshSelection(group: THREE.Group, isSelected: boolean, isPreviewSelected: boolean = false): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
      // Selected = blue, preview = light cyan, normal = gray
      const color = isSelected ? 0x4A90E2 : (isPreviewSelected ? 0x60D4F4 : 0x808080);
      child.material.color.setHex(color);
    }
    if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
      // Selected = dark blue, preview = cyan, normal = black
      const color = isSelected ? 0x2563eb : (isPreviewSelected ? 0x22D3EE : 0x000000);
      child.material.color.setHex(color);
    }
  });
}

/**
 * Determine grid spacing based on zoom level
 * Returns { major, minor } spacing in inches
 */
function getGridSpacing(zoom: number): { major: number; minor: number } {
  if (zoom > 8) {
    // Very zoomed in: 1/16" minor, 1" major
    return { major: 1, minor: 0.0625 };
  } else if (zoom > 4) {
    // Zoomed in: 1/8" minor, 1" major
    return { major: 1, minor: 0.125 };
  } else if (zoom > 2) {
    // Medium-close: 1/4" minor, 1" major
    return { major: 1, minor: 0.25 };
  } else if (zoom > 1) {
    // Medium: 1/2" minor, 1" major
    return { major: 1, minor: 0.5 };
  } else if (zoom > 0.5) {
    // Medium-far: 1" minor, 12" major
    return { major: 12, minor: 1 };
  } else if (zoom > 0.25) {
    // Far: 3" minor, 12" major
    return { major: 12, minor: 3 };
  } else {
    // Very far: 12" minor, 24" major
    return { major: 24, minor: 12 };
  }
}

/**
 * Create an infinite adaptive grid based on visible viewport
 */
function createInfiniteGrid(
  camera: THREE.OrthographicCamera,
  zoom: number,
  panOffset: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number
): THREE.Group {
  const group = new THREE.Group();

  // Ensure grid is positioned at world origin (0,0,0)
  group.position.set(0, 0, 0);

  // Calculate visible world space
  const viewSize = 50;
  const aspect = canvasWidth / canvasHeight;
  const worldWidth = (viewSize * aspect) / zoom;
  const worldHeight = viewSize / zoom;

  // NOTE: Grid is positioned at world origin (0,0,0) and doesn't move with pan
  // So we calculate the visible range but draw lines at absolute world coordinates
  const worldLeft = panOffset.x - worldWidth / 2;
  const worldRight = panOffset.x + worldWidth / 2;
  const worldTop = panOffset.y + worldHeight / 2;
  const worldBottom = panOffset.y - worldHeight / 2;

  // FIXED GRID SPACING FOR DEBUGGING: 1/16" minor, 1" major (16 divisions per inch)
  const major = 1; // 1 inch
  const minor = 0.0625; // 1/16 inch

  // Add massive padding to make grid truly infinite
  // Use 10x the viewport size to ensure grid is always visible when panning
  const padding = Math.max(worldWidth * 10, worldHeight * 10, 1000);

  // Create minor grid lines (lighter, thinner)
  const minorPositions: number[] = [];

  // Vertical minor lines - use EXACT same logic as rulers
  const startX = Math.floor(worldLeft / minor) * minor;
  const endX = Math.ceil(worldRight / minor) * minor;

  for (let x = startX; x <= endX; x += minor) {
    // Skip if this is a major line position (same check as rulers)
    const isMajor = Math.abs(x % major) < 0.0001; // Use epsilon for float comparison
    if (isMajor) continue;

    // Draw in XY plane directly (no rotation needed for front view)
    // Vertical lines: constant X, varying Y
    minorPositions.push(x, worldBottom - padding, 0);
    minorPositions.push(x, worldTop + padding, 0);
  }

  // Horizontal minor lines - use EXACT same logic as rulers
  const startY = Math.floor(worldBottom / minor) * minor;
  const endY = Math.ceil(worldTop / minor) * minor;

  for (let y = startY; y <= endY; y += minor) {
    const isMajor = Math.abs(y % major) < 0.0001;
    if (isMajor) continue;

    // Draw in XY plane directly (no rotation needed for front view)
    // Horizontal lines: varying X, constant Y
    minorPositions.push(worldLeft - padding, y, 0);
    minorPositions.push(worldRight + padding, y, 0);
  }

  if (minorPositions.length > 0) {
    const minorGeometry = new THREE.BufferGeometry();
    minorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(minorPositions, 3));

    const minorMaterial = new THREE.LineBasicMaterial({
      color: 0xd0d0d0,
      opacity: 0.3,
      transparent: true,
    });

    const minorLines = new THREE.LineSegments(minorGeometry, minorMaterial);
    group.add(minorLines);
  }

  // Create major grid lines (darker, thicker)
  const majorPositions: number[] = [];

  // Vertical major lines - use EXACT same logic as rulers
  const startMajorX = Math.floor(worldLeft / major) * major;
  const endMajorX = Math.ceil(worldRight / major) * major;

  for (let x = startMajorX; x <= endMajorX; x += major) {
    // Draw in XY plane directly (no rotation needed for front view)
    // Vertical lines: constant X, varying Y
    majorPositions.push(x, worldBottom - padding, 0);
    majorPositions.push(x, worldTop + padding, 0);
  }

  // Horizontal major lines - use EXACT same logic as rulers
  const startMajorY = Math.floor(worldBottom / major) * major;
  const endMajorY = Math.ceil(worldTop / major) * major;

  for (let y = startMajorY; y <= endMajorY; y += major) {
    // Draw in XY plane directly (no rotation needed for front view)
    // Horizontal lines: varying X, constant Y
    majorPositions.push(worldLeft - padding, y, 0);
    majorPositions.push(worldRight + padding, y, 0);
  }

  if (majorPositions.length > 0) {
    const majorGeometry = new THREE.BufferGeometry();
    majorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(majorPositions, 3));

    const majorMaterial = new THREE.LineBasicMaterial({
      color: 0xa0a0a0,
      opacity: 0.6,
      transparent: true,
    });

    const majorLines = new THREE.LineSegments(majorGeometry, majorMaterial);
    group.add(majorLines);
  }

  return group;
}

/**
 * Update grid orientation based on current view
 */
function updateGridOrientation(grid: THREE.Group, view: ViewType): void {
  grid.rotation.set(0, 0, 0);
  grid.position.set(0, 0, 0);

  // SIMPLIFIED FOR DEBUGGING: Grid is now drawn in XY plane, no rotation needed for front view
  // TODO: Add proper orientation for other views when debugging is complete
  switch (view) {
    case 'front':
    case 'back':
      // No rotation - grid is already in XY plane
      break;
    case 'left':
    case 'right':
      grid.rotation.z = Math.PI / 2;
      break;
    case 'top':
    case 'bottom':
      grid.rotation.x = Math.PI / 2;
      break;
  }
}
