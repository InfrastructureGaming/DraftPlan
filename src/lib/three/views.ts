import { ViewType, ViewConfig } from '@/types';
import * as THREE from 'three';

/**
 * View configurations for orthographic projections
 * Y-up coordinate system (matches Unreal Engine)
 *
 * View mappings:
 * - Front: X→screen-X, Y→screen-Y, Z→depth
 * - Back: X→screen-X (flipped), Y→screen-Y, Z→depth (reversed)
 * - Left: Z→screen-X, Y→screen-Y, X→depth
 * - Right: Z→screen-X (flipped), Y→screen-Y, X→depth (reversed)
 * - Top: X→screen-X, Z→screen-Y, Y→depth
 * - Bottom: X→screen-X, Z→screen-Y (flipped), Y→depth (reversed)
 */

export const VIEW_CONFIGS: Record<ViewType, ViewConfig> = {
  front: {
    name: 'front',
    cameraPosition: { x: 0, y: 0, z: 100 },
    cameraRotation: { x: 0, y: 0, z: 0 },
    upVector: { x: 0, y: 1, z: 0 },
  },
  back: {
    name: 'back',
    cameraPosition: { x: 0, y: 0, z: -100 },
    cameraRotation: { x: 0, y: Math.PI, z: 0 },
    upVector: { x: 0, y: 1, z: 0 },
  },
  left: {
    name: 'left',
    cameraPosition: { x: -100, y: 0, z: 0 },
    cameraRotation: { x: 0, y: -Math.PI / 2, z: 0 },
    upVector: { x: 0, y: 1, z: 0 },
  },
  right: {
    name: 'right',
    cameraPosition: { x: 100, y: 0, z: 0 },
    cameraRotation: { x: 0, y: Math.PI / 2, z: 0 },
    upVector: { x: 0, y: 1, z: 0 },
  },
  top: {
    name: 'top',
    cameraPosition: { x: 0, y: 100, z: 0 },
    cameraRotation: { x: -Math.PI / 2, y: 0, z: 0 },
    upVector: { x: 0, y: 0, z: -1 },
  },
  bottom: {
    name: 'bottom',
    cameraPosition: { x: 0, y: -100, z: 0 },
    cameraRotation: { x: Math.PI / 2, y: 0, z: 0 },
    upVector: { x: 0, y: 0, z: 1 },
  },
  'iso-front-right': {
    name: 'iso-front-right',
    cameraPosition: { x: 70, y: 70, z: 70 },
    cameraRotation: { x: -Math.PI / 4, y: Math.PI / 4, z: 0 },
    upVector: { x: 0, y: 1, z: 0 },
  },
  'iso-front-left': {
    name: 'iso-front-left',
    cameraPosition: { x: -70, y: 70, z: 70 },
    cameraRotation: { x: -Math.PI / 4, y: -Math.PI / 4, z: 0 },
    upVector: { x: 0, y: 1, z: 0 },
  },
  'iso-back-right': {
    name: 'iso-back-right',
    cameraPosition: { x: 70, y: 70, z: -70 },
    cameraRotation: { x: -Math.PI / 4, y: (3 * Math.PI) / 4, z: 0 },
    upVector: { x: 0, y: 1, z: 0 },
  },
  'iso-back-left': {
    name: 'iso-back-left',
    cameraPosition: { x: -70, y: 70, z: -70 },
    cameraRotation: { x: -Math.PI / 4, y: (-3 * Math.PI) / 4, z: 0 },
    upVector: { x: 0, y: 1, z: 0 },
  },
};

/**
 * Configure camera for a specific view
 */
export function setupCameraForView(
  camera: THREE.OrthographicCamera,
  view: ViewType,
  zoom: number = 1,
  panOffset: { x: number; y: number } = { x: 0, y: 0 }
): void {
  const config = VIEW_CONFIGS[view];

  // Set up vector BEFORE position and lookAt
  camera.up.set(config.upVector.x, config.upVector.y, config.upVector.z);

  // Calculate view-dependent pan offset
  // For each view, determine which world axes correspond to screen X and Y
  let offsetX = 0, offsetY = 0, offsetZ = 0;

  switch (view) {
    case 'front':
      // Looking down +Z, X is right, Y is up
      offsetX = panOffset.x;
      offsetY = panOffset.y;
      break;
    case 'back':
      // Looking down -Z, -X is right, Y is up
      offsetX = -panOffset.x;
      offsetY = panOffset.y;
      break;
    case 'left':
      // Looking down +X, Z is right, Y is up
      offsetZ = panOffset.x;
      offsetY = panOffset.y;
      break;
    case 'right':
      // Looking down -X, -Z is right, Y is up
      offsetZ = -panOffset.x;
      offsetY = panOffset.y;
      break;
    case 'top':
      // Looking down -Y, X is right, Z is down (screen up)
      offsetX = panOffset.x;
      offsetZ = -panOffset.y;
      break;
    case 'bottom':
      // Looking down +Y, X is right, -Z is down (screen up)
      offsetX = panOffset.x;
      offsetZ = panOffset.y;
      break;
    case 'iso-front-right':
      // Looking from front-right corner (X+, Z+)
      // Screen-right is diagonal (X+Z), screen-up is Y
      offsetX = panOffset.x * 0.707;
      offsetY = panOffset.y;           // Screen-up maps directly to Y
      offsetZ = panOffset.x * 0.707;
      break;
    case 'iso-front-left':
      // Looking from front-left corner (X-, Z+)
      // Screen-right is diagonal (-X+Z), screen-up is Y
      offsetX = -panOffset.x * 0.707;
      offsetY = panOffset.y;           // Screen-up maps directly to Y
      offsetZ = panOffset.x * 0.707;
      break;
    case 'iso-back-right':
      // Looking from back-right corner (X+, Z-)
      // Screen-right is diagonal (X-Z), screen-up is Y
      offsetX = panOffset.x * 0.707;
      offsetY = panOffset.y;           // Screen-up maps directly to Y
      offsetZ = -panOffset.x * 0.707;
      break;
    case 'iso-back-left':
      // Looking from back-left corner (X-, Z-)
      // Screen-right is diagonal (-X-Z), screen-up is Y
      offsetX = -panOffset.x * 0.707;
      offsetY = panOffset.y;           // Screen-up maps directly to Y
      offsetZ = -panOffset.x * 0.707;
      break;
  }

  // Apply pan offset to camera position
  camera.position.set(
    config.cameraPosition.x + offsetX,
    config.cameraPosition.y + offsetY,
    config.cameraPosition.z + offsetZ
  );

  // Look at origin (with same offset to maintain direction)
  camera.lookAt(offsetX, offsetY, offsetZ);

  // Apply zoom
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
}

/**
 * Create an orthographic camera with proper aspect ratio
 */
export function createOrthographicCamera(
  aspectRatio: number,
  viewSize: number = 50
): THREE.OrthographicCamera {
  const width = viewSize * aspectRatio;
  const height = viewSize;

  const camera = new THREE.OrthographicCamera(
    -width / 2,  // left
    width / 2,   // right
    height / 2,  // top
    -height / 2, // bottom
    0.1,         // near
    1000         // far
  );

  return camera;
}
