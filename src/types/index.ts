// Core Types for DraftPlan

export type ViewType = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions {
  width: number;  // X dimension
  height: number; // Y dimension
  depth: number;  // Z dimension
}

export interface DraftObject {
  id: string;
  type: 'lumber' | 'sheet' | 'custom';
  name: string;
  position: Vector3D;
  dimensions: Dimensions;
  rotation: Vector3D;
  material: string;
  category: string;
  tags: string[];
  gridSnap: boolean;
  showDimensions: boolean;
  notes: string;
  assemblyId?: string;
}

export interface Assembly {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  notes: string;
  objectIds: string[];
}

export interface CameraState {
  currentView: ViewType;
  zoom: number;
  panOffset: { x: number; y: number };
}

export interface ProjectSettings {
  gridVisible: boolean;
  rulersVisible: boolean;
  theme: 'light' | 'dark' | 'blueprint';
}

export interface ProjectInfo {
  name: string;
  created: string;
  modified: string;
  notes: string;
  exteriorDimensions?: Dimensions;
}

export interface ProjectFile {
  version: string;
  projectInfo: ProjectInfo;
  objects: DraftObject[];
  assemblies: Assembly[];
  camera: CameraState;
  settings: ProjectSettings;
}

export interface LumberLibraryItem {
  id: string;
  nominalName: string;
  actualDimensions: Dimensions;
  material: string;
  category: string;
  tags: string[];
  isCustom: boolean;
}

// View configuration for camera setup
export interface ViewConfig {
  name: ViewType;
  cameraPosition: Vector3D;
  cameraRotation: Vector3D;
  upVector: Vector3D;
}
