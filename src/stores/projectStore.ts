import { create } from 'zustand';
import { DraftObject, Assembly, CameraState, ViewType, ProjectInfo, ProjectFile } from '@/types';

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

  loadProject: (project, filePath) =>
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
    })),

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

  markSaved: (filePath) =>
    set(() => ({
      currentFilePath: filePath,
      hasUnsavedChanges: false,
    })),
}));
