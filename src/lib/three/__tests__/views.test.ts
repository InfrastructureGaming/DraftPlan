import { describe, it, expect } from 'vitest';
import { VIEW_CONFIGS, setupCameraForView, createOrthographicCamera } from '../views';
import * as THREE from 'three';

describe('View System', () => {
  describe('VIEW_CONFIGS', () => {
    it('should have configurations for all 6 views', () => {
      expect(Object.keys(VIEW_CONFIGS)).toHaveLength(6);
      expect(VIEW_CONFIGS.front).toBeDefined();
      expect(VIEW_CONFIGS.back).toBeDefined();
      expect(VIEW_CONFIGS.left).toBeDefined();
      expect(VIEW_CONFIGS.right).toBeDefined();
      expect(VIEW_CONFIGS.top).toBeDefined();
      expect(VIEW_CONFIGS.bottom).toBeDefined();
    });

    it('should have correct camera position for front view', () => {
      const config = VIEW_CONFIGS.front;
      expect(config.cameraPosition.z).toBeGreaterThan(0);
      expect(config.cameraPosition.x).toBe(0);
      expect(config.cameraPosition.y).toBe(0);
    });

    it('should have correct up vector for top view', () => {
      const config = VIEW_CONFIGS.top;
      // Top view should look down Y-axis, so up vector points along -Z
      expect(config.upVector.z).toBe(-1);
      expect(config.upVector.y).toBe(0);
    });
  });

  describe('createOrthographicCamera', () => {
    it('should create camera with correct aspect ratio', () => {
      const aspectRatio = 11 / 8.5;
      const camera = createOrthographicCamera(aspectRatio, 50);

      expect(camera).toBeInstanceOf(THREE.OrthographicCamera);
      expect(camera.left).toBeLessThan(0);
      expect(camera.right).toBeGreaterThan(0);
      expect(camera.top).toBeGreaterThan(0);
      expect(camera.bottom).toBeLessThan(0);
    });

    it('should have symmetric bounds', () => {
      const camera = createOrthographicCamera(1, 50);
      expect(camera.left).toBe(-camera.right);
      expect(camera.top).toBe(-camera.bottom);
    });
  });

  describe('setupCameraForView', () => {
    it('should position camera correctly for front view', () => {
      const camera = createOrthographicCamera(1, 50);
      setupCameraForView(camera, 'front', 1);

      expect(camera.position.z).toBeGreaterThan(0);
      expect(camera.position.x).toBe(0);
      expect(camera.position.y).toBe(0);
    });

    it('should apply zoom correctly', () => {
      const camera = createOrthographicCamera(1, 50);
      setupCameraForView(camera, 'front', 2);

      expect(camera.zoom).toBe(2);
    });

    it('should set correct up vector for each view', () => {
      const camera = createOrthographicCamera(1, 50);

      setupCameraForView(camera, 'top', 1);
      expect(camera.up.z).toBe(-1);

      setupCameraForView(camera, 'front', 1);
      expect(camera.up.y).toBe(1);
    });
  });
});
