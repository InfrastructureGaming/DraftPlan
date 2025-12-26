import { create } from 'zustand';
import { DraftObject, Assembly, CameraState, ViewType, ProjectInfo, ProjectFile, Vector3D } from '@/types';
import {
  computeWorldTransform,
  worldToLocalPosition,
  isNodeVisible,
} from '@/lib/hierarchy/transforms';
import {
  reparentNode as reparentNodeUtil,
  deleteNodeCascade,
  moveNodeInWorldSpace,
  reorderChildren as reorderChildrenUtil,
} from '@/lib/hierarchy/operations';
import { addRecentProject } from '@/lib/storage/recentProjects';

interface HistorySnapshot {
  objects: DraftObject[];
  assemblies: Assembly[];
}

interface ProjectState {
  // Project metadata
  projectInfo: ProjectInfo;
  currentFilePath: string | null;
  hasUnsavedChanges: boolean;

  // Project data
  objects: DraftObject[];
  assemblies: Assembly[];

  // Camera state
  camera: CameraState;

  // Selection
  selectedObjectIds: string[];

  // History for undo/redo
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];

  // Actions
  addObject: (object: DraftObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<DraftObject>, skipHistory?: boolean) => void;
  selectObject: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  pushToHistory: () => void;

  setView: (view: ViewType) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;

  // Assembly management (hierarchical)
  createAssembly: (name: string, childIds: string[], color?: string, parentId?: string) => void;
  updateAssembly: (id: string, updates: Partial<Assembly>) => void;
  deleteNode: (id: string) => void;  // Replaces deleteAssembly, works for objects too
  toggleNodeVisibility: (id: string) => void;
  toggleAssemblyExpansion: (id: string) => void;
  selectAssemblyObjects: (id: string) => void;
  reparentNode: (nodeId: string, newParentId?: string) => void;
  reorderChildren: (parentId: string | undefined, fromIndex: number, toIndex: number) => void;

  // Object management (hierarchy-aware)
  updateObjectPosition: (id: string, worldPosition: Vector3D) => void;  // Updates localPosition
  updateObjectRotation: (id: string, rotation: Vector3D) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Project management
  setProjectInfo: (info: Partial<ProjectInfo>) => void;
  loadProject: (project: ProjectFile, filePath?: string) => void;
  getProjectFile: () => ProjectFile;
  newProject: (name?: string) => void;
  markSaved: (filePath: string) => void;
}

// Helper function to create a deep copy of objects and assemblies
const createSnapshot = (state: ProjectState): HistorySnapshot => ({
  objects: JSON.parse(JSON.stringify(state.objects)),
  assemblies: JSON.parse(JSON.stringify(state.assemblies)),
});

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectInfo: {
    name: 'Untitled Project',
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    notes: '',
  },
  currentFilePath: null,
  hasUnsavedChanges: false,

  objects: [],
  assemblies: [],
  camera: {
    currentView: 'front',
    zoom: 1.0,
    panOffset: { x: 0, y: 0 },
  },
  selectedObjectIds: [],
  undoStack: [],
  redoStack: [],

  addObject: (object) =>
    set((state) => {
      const snapshot = createSnapshot(state);
      return {
        objects: [...state.objects, object],
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
        undoStack: [...state.undoStack, snapshot],
        redoStack: [], // Clear redo stack on new action
      };
    }),

  removeObject: (id) =>
    set((state) => {
      const snapshot = createSnapshot(state);
      return {
        objects: state.objects.filter((obj) => obj.id !== id),
        selectedObjectIds: state.selectedObjectIds.filter((sid) => sid !== id),
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
        undoStack: [...state.undoStack, snapshot],
        redoStack: [], // Clear redo stack on new action
      };
    }),

  updateObject: (id, updates, skipHistory = false) =>
    set((state) => {
      const snapshot = skipHistory ? null : createSnapshot(state);
      return {
        objects: state.objects.map((obj) =>
          obj.id === id ? { ...obj, ...updates } : obj
        ),
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
        ...(snapshot ? {
          undoStack: [...state.undoStack, snapshot],
          redoStack: [], // Clear redo stack on new action
        } : {}),
      };
    }),

  pushToHistory: () =>
    set((state) => {
      const snapshot = createSnapshot(state);
      return {
        undoStack: [...state.undoStack, snapshot],
        redoStack: [], // Clear redo stack when manually pushing
      };
    }),

  selectObject: (id, multi = false) =>
    set((state) => ({
      selectedObjectIds: multi
        ? state.selectedObjectIds.includes(id)
          ? state.selectedObjectIds.filter((sid) => sid !== id)
          : [...state.selectedObjectIds, id]
        : [id],
    })),

  clearSelection: () =>
    set(() => ({
      selectedObjectIds: [],
    })),

  setView: (view) =>
    set((state) => ({
      camera: { ...state.camera, currentView: view },
    })),

  setZoom: (zoom) =>
    set((state) => ({
      camera: { ...state.camera, zoom },
    })),

  setPanOffset: (offset) =>
    set((state) => ({
      camera: { ...state.camera, panOffset: offset },
    })),

  undo: () =>
    set((state) => {
      if (state.undoStack.length === 0) return state;

      const snapshot = state.undoStack[state.undoStack.length - 1];
      const currentSnapshot = createSnapshot(state);

      return {
        objects: snapshot.objects,
        assemblies: snapshot.assemblies,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, currentSnapshot],
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
      };
    }),

  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0) return state;

      const snapshot = state.redoStack[state.redoStack.length - 1];
      const currentSnapshot = createSnapshot(state);

      return {
        objects: snapshot.objects,
        assemblies: snapshot.assemblies,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, currentSnapshot],
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
      };
    }),

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  setProjectInfo: (info) =>
    set((state) => ({
      projectInfo: { ...state.projectInfo, ...info, modified: new Date().toISOString() },
      hasUnsavedChanges: true,
    })),

  loadProject: (project, filePath) => {
    // Add to recent projects if we have a file path
    if (filePath) {
      addRecentProject(project.projectInfo.name, filePath);
    }

    set(() => ({
      projectInfo: project.projectInfo,
      objects: project.objects,
      assemblies: project.assemblies,
      camera: project.camera,
      currentFilePath: filePath || null,
      hasUnsavedChanges: false,
      selectedObjectIds: [],
      undoStack: [],
      redoStack: [],
    }));
  },

  getProjectFile: () => {
    const state = get();
    return {
      version: '1.0',
      projectInfo: state.projectInfo,
      objects: state.objects,
      assemblies: state.assemblies,
      camera: state.camera,
      settings: {
        gridVisible: true, // TODO: Get from UI store
        rulersVisible: false,
        theme: 'light',
      },
    };
  },

  newProject: (name) =>
    set(() => ({
      projectInfo: {
        name: name || 'Untitled Project',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        notes: '',
      },
      objects: [],
      assemblies: [],
      camera: {
        currentView: 'front',
        zoom: 1.0,
        panOffset: { x: 0, y: 0 },
      },
      selectedObjectIds: [],
      currentFilePath: null,
      hasUnsavedChanges: false,
      undoStack: [],
      redoStack: [],
    })),

  markSaved: (filePath) => {
    const state = get();
    // Add to recent projects
    addRecentProject(state.projectInfo.name, filePath);

    set(() => ({
      currentFilePath: filePath,
      hasUnsavedChanges: false,
    }));
  },

  // Assembly management implementations
  createAssembly: (name, childIds, color, parentId) =>
    set((state) => {
      const snapshot = createSnapshot(state);
      const newAssembly: Assembly = {
        id: `assembly-${Date.now()}`,
        name,
        color: color || `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        visible: true,
        notes: '',
        parentId,
        childIds,
        isExpanded: true,
      };

      // Update children to reference this assembly as parent
      const updatedObjects = state.objects.map((obj) =>
        childIds.includes(obj.id) ? { ...obj, parentId: newAssembly.id } : obj
      );

      const updatedAssemblies = state.assemblies.map((asm) =>
        childIds.includes(asm.id) ? { ...asm, parentId: newAssembly.id } : asm
      );

      // If this assembly has a parent, add it to parent's childIds
      const finalAssemblies = parentId
        ? updatedAssemblies.map((asm) =>
            asm.id === parentId && !asm.childIds.includes(newAssembly.id)
              ? { ...asm, childIds: [...asm.childIds, newAssembly.id] }
              : asm
          )
        : updatedAssemblies;

      return {
        assemblies: [...finalAssemblies, newAssembly],
        objects: updatedObjects,
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
        undoStack: [...state.undoStack, snapshot],
        redoStack: [],
      };
    }),

  updateAssembly: (id, updates) =>
    set((state) => {
      const snapshot = createSnapshot(state);
      return {
        assemblies: state.assemblies.map((assembly) =>
          assembly.id === id ? { ...assembly, ...updates } : assembly
        ),
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
        undoStack: [...state.undoStack, snapshot],
        redoStack: [],
      };
    }),

  deleteNode: (id) =>
    set((state) => {
      const snapshot = createSnapshot(state);
      const { objects: updatedObjects, assemblies: updatedAssemblies } = deleteNodeCascade(
        id,
        state.objects,
        state.assemblies
      );

      return {
        objects: updatedObjects,
        assemblies: updatedAssemblies,
        selectedObjectIds: state.selectedObjectIds.filter((sid) => sid !== id),
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
        undoStack: [...state.undoStack, snapshot],
        redoStack: [],
      };
    }),

  toggleNodeVisibility: (id) =>
    set((state) => {
      const snapshot = createSnapshot(state);
      return {
        assemblies: state.assemblies.map((assembly) =>
          assembly.id === id ? { ...assembly, visible: !assembly.visible } : assembly
        ),
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
        undoStack: [...state.undoStack, snapshot],
        redoStack: [],
      };
    }),

  toggleAssemblyExpansion: (id) =>
    set((state) => ({
      assemblies: state.assemblies.map((assembly) =>
        assembly.id === id ? { ...assembly, isExpanded: !assembly.isExpanded } : assembly
      ),
    })),

  selectAssemblyObjects: (id) =>
    set((state) => {
      const assembly = state.assemblies.find((a) => a.id === id);
      if (!assembly) return state;

      return {
        selectedObjectIds: assembly.childIds,
      };
    }),

  reparentNode: (nodeId, newParentId) =>
    set((state) => {
      const snapshot = createSnapshot(state);
      const { objects: updatedObjects, assemblies: updatedAssemblies } = reparentNodeUtil(
        nodeId,
        newParentId,
        state.objects,
        state.assemblies
      );

      return {
        objects: updatedObjects,
        assemblies: updatedAssemblies,
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
        undoStack: [...state.undoStack, snapshot],
        redoStack: [],
      };
    }),

  reorderChildren: (parentId, fromIndex, toIndex) =>
    set((state) => {
      const { objects: updatedObjects, assemblies: updatedAssemblies } = reorderChildrenUtil(
        parentId,
        fromIndex,
        toIndex,
        state.objects,
        state.assemblies
      );

      return {
        objects: updatedObjects,
        assemblies: updatedAssemblies,
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
      };
    }),

  updateObjectPosition: (id, worldPosition) =>
    set((state) => {
      const object = state.objects.find((obj) => obj.id === id);
      if (!object) return state;

      const snapshot = createSnapshot(state);
      const newLocalPosition = worldToLocalPosition(
        worldPosition,
        object.parentId,
        state.objects,
        state.assemblies
      );

      return {
        objects: state.objects.map((obj) =>
          obj.id === id ? { ...obj, localPosition: newLocalPosition } : obj
        ),
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
        undoStack: [...state.undoStack, snapshot],
        redoStack: [],
      };
    }),

  updateObjectRotation: (id, rotation) =>
    set((state) => {
      const snapshot = createSnapshot(state);
      return {
        objects: state.objects.map((obj) =>
          obj.id === id ? { ...obj, rotation } : obj
        ),
        hasUnsavedChanges: true,
        projectInfo: { ...state.projectInfo, modified: new Date().toISOString() },
        undoStack: [...state.undoStack, snapshot],
        redoStack: [],
      };
    }),
}));
