// Core Types for DraftPlan

export type ViewType =
  | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
  | 'iso-front-right' | 'iso-front-left' | 'iso-back-right' | 'iso-back-left';

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

  // Hierarchical positioning
  parentId?: string;              // Parent assembly or object ID
  localPosition: Vector3D;        // Position relative to parent (or world if no parent)

  dimensions: Dimensions;
  rotation: Vector3D;             // Local rotation relative to parent
  material: string;
  category: string;
  tags: string[];
  gridSnap: boolean;
  showDimensions: boolean;
  rotationEnabled: boolean;
  notes: string;

  // Color inheritance
  useAssemblyColor: boolean;      // If true, inherit parent assembly's color
}

export interface Assembly {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  notes: string;

  // Hierarchical structure
  parentId?: string;              // Parent assembly ID (for nested assemblies)
  childIds: string[];             // Array of child IDs (assemblies or objects)
  isExpanded: boolean;            // UI state for tree view
}

export interface DimensionLine {
  id: string;
  name: string;
  startPoint: Vector3D;           // First endpoint in 3D world coordinates
  endPoint: Vector3D;             // Second endpoint in 3D world coordinates
  textOffset: number;             // Distance from line to text label (perpendicular offset)
  color: string;                  // Line and text color
  visible: boolean;               // Visibility toggle
  locked: boolean;                // Prevents editing when true
  notes: string;                  // User notes
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
  dimensionLines: DimensionLine[];
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

// Hierarchical assembly types
export type HierarchyNode = Assembly | DraftObject;

export interface WorldTransform {
  position: Vector3D;
  rotation: Vector3D;
  scale?: Vector3D;  // Future-proofing for scaling support
}

export interface TreeNode {
  id: string;
  type: 'assembly' | 'object';
  name: string;
  children: TreeNode[];
  depth: number;
  isExpanded?: boolean;
}
