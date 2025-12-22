import * as THREE from 'three';
import { ViewType, Vector3D } from '@/types';

/**
 * Convert screen coordinates to 3D world coordinates based on current view
 * This accounts for the orthographic projection and view orientation
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: THREE.OrthographicCamera,
  view: ViewType,
  canvasWidth: number,
  canvasHeight: number
): Vector3D {
  // Convert screen coordinates to normalized device coordinates (-1 to 1)
  const ndcX = (screenX / canvasWidth) * 2 - 1;
  const ndcY = -(screenY / canvasHeight) * 2 + 1;

  // Create a vector in NDC space
  const vector = new THREE.Vector3(ndcX, ndcY, 0);

  // Unproject to world space
  vector.unproject(camera);

  // The unprojected vector gives us the point on the view plane
  // We need to map this to 3D coordinates based on the view

  switch (view) {
    case 'front':
      // Front view: screen X/Y map to world X/Y, Z is fixed at 0
      return { x: vector.x, y: vector.y, z: 0 };

    case 'back':
      // Back view: screen X/Y map to world -X/Y, Z is fixed at 0
      return { x: -vector.x, y: vector.y, z: 0 };

    case 'top':
      // Top view: screen X/Y map to world X/Z, Y is fixed at 0
      return { x: vector.x, y: 0, z: -vector.y };

    case 'bottom':
      // Bottom view: screen X/Y map to world X/-Z, Y is fixed at 0
      return { x: vector.x, y: 0, z: vector.y };

    case 'left':
      // Left view: screen X/Y map to world Z/Y, X is fixed at 0
      return { x: 0, y: vector.y, z: vector.x };

    case 'right':
      // Right view: screen X/Y map to world -Z/Y, X is fixed at 0
      return { x: 0, y: vector.y, z: -vector.x };

    case 'iso-front-right':
      // Isometric front-right: screen-right is diagonal (X+Z), screen-up is Y
      // Screen X maps to diagonal (X+Z), screen Y maps to Y
      return { x: vector.x * 0.707, y: vector.y, z: vector.x * 0.707 };

    case 'iso-front-left':
      // Isometric front-left: screen-right is diagonal (-X+Z), screen-up is Y
      return { x: -vector.x * 0.707, y: vector.y, z: vector.x * 0.707 };

    case 'iso-back-right':
      // Isometric back-right: screen-right is diagonal (X-Z), screen-up is Y
      return { x: vector.x * 0.707, y: vector.y, z: -vector.x * 0.707 };

    case 'iso-back-left':
      // Isometric back-left: screen-right is diagonal (-X-Z), screen-up is Y
      return { x: -vector.x * 0.707, y: vector.y, z: -vector.x * 0.707 };

    default:
      return { x: vector.x, y: vector.y, z: 0 };
  }
}

/**
 * Snap a value to the nearest grid increment
 */
export function snapToGrid(value: number, gridSize: number = 1): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a 3D vector to the grid
 */
export function snapVectorToGrid(vector: Vector3D, gridSize: number = 1): Vector3D {
  return {
    x: snapToGrid(vector.x, gridSize),
    y: snapToGrid(vector.y, gridSize),
    z: snapToGrid(vector.z, gridSize),
  };
}

/**
 * Convert screen-space delta (mouse movement) to world-space delta
 * This is used for dragging objects in the current view
 */
export function screenDeltaToWorldDelta(
  deltaScreenX: number,
  deltaScreenY: number,
  camera: THREE.OrthographicCamera,
  view: ViewType,
  canvasWidth: number,
  canvasHeight: number
): Vector3D {
  // Calculate the viewport size in world units
  const viewHeight = (camera.top - camera.bottom) / camera.zoom;
  const viewWidth = (camera.right - camera.left) / camera.zoom;

  // Convert screen delta to normalized delta (-1 to 1)
  const ndcDeltaX = (deltaScreenX / canvasWidth) * 2;
  const ndcDeltaY = -(deltaScreenY / canvasHeight) * 2;

  // Convert to world units
  const worldDeltaX = ndcDeltaX * (viewWidth / 2);
  const worldDeltaY = ndcDeltaY * (viewHeight / 2);

  // Map to 3D coordinates based on view
  switch (view) {
    case 'front':
      // Front view: X/Y movement in screen maps to X/Y in world
      return { x: worldDeltaX, y: worldDeltaY, z: 0 };

    case 'back':
      // Back view: X/Y movement in screen maps to -X/Y in world
      return { x: -worldDeltaX, y: worldDeltaY, z: 0 };

    case 'top':
      // Top view: X/Y movement in screen maps to X/Z in world
      return { x: worldDeltaX, y: 0, z: -worldDeltaY };

    case 'bottom':
      // Bottom view: X/Y movement in screen maps to X/-Z in world
      return { x: worldDeltaX, y: 0, z: worldDeltaY };

    case 'left':
      // Left view: X/Y movement in screen maps to Z/Y in world
      return { x: 0, y: worldDeltaY, z: worldDeltaX };

    case 'right':
      // Right view: X/Y movement in screen maps to -Z/Y in world
      return { x: 0, y: worldDeltaY, z: -worldDeltaX };

    case 'iso-front-right':
      // Isometric front-right: screen-right is diagonal (X+Z), screen-up is Y
      return { x: worldDeltaX * 0.707, y: worldDeltaY, z: worldDeltaX * 0.707 };

    case 'iso-front-left':
      // Isometric front-left: screen-right is diagonal (-X+Z), screen-up is Y
      return { x: -worldDeltaX * 0.707, y: worldDeltaY, z: worldDeltaX * 0.707 };

    case 'iso-back-right':
      // Isometric back-right: screen-right is diagonal (X-Z), screen-up is Y
      return { x: worldDeltaX * 0.707, y: worldDeltaY, z: -worldDeltaX * 0.707 };

    case 'iso-back-left':
      // Isometric back-left: screen-right is diagonal (-X-Z), screen-up is Y
      return { x: -worldDeltaX * 0.707, y: worldDeltaY, z: -worldDeltaX * 0.707 };

    default:
      return { x: worldDeltaX, y: worldDeltaY, z: 0 };
  }
}
