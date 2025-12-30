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

// Individual project tab state
interface ProjectTab {
  id: string; // Unique tab identifier
  projectInfo: ProjectInfo;
  currentFilePath: string | null;
  hasUnsavedChanges: boolean;
  objects: DraftObject[];
  assemblies: Assembly[];
  camera: CameraState;
  selectedObjectIds: string[];
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
}

interface ProjectState {
  // Multi-tab state
  tabs: ProjectTab[];
  activeTabIndex: number;

  // Computed getters for active tab (convenience accessors)
  get projectInfo(): ProjectInfo;
  get currentFilePath(): string | null;
  get hasUnsavedChanges(): boolean;
  get objects(): DraftObject[];
  get assemblies(): Assembly[];
  get camera(): CameraState;
  get selectedObjectIds(): string[];

  // Tab management
  createTab: (name?: string, project?: ProjectFile, filePath?: string) => void;
  closeTab: (index: number) => void;
  switchToTab: (index: number) => void;

  // Project data actions (operate on active tab)
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
  deleteNode: (id: string) => void;
  toggleNodeVisibility: (id: string) => void;
  toggleAssemblyExpansion: (id: string) => void;
  selectAssemblyObjects: (id: string) => void;
  reparentNode: (nodeId: string, newParentId?: string) => void;
  reorderChildren: (parentId: string | undefined, fromIndex: number, toIndex: number) => void;

  // Array tool
  createArray: (objectId: string, direction: 'x' | 'y' | 'z', count: number, spacing: number, createAsAssembly: boolean) => void;

  // Object management (hierarchy-aware)
  updateObjectPosition: (id: string, worldPosition: Vector3D) => void;
  updateObjectRotation: (id: string, rotation: Vector3D) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Project management
  setProjectInfo: (info: Partial<ProjectInfo>) => void;
  loadProject: (project: ProjectFile, filePath?: string, openInNewTab?: boolean) => void;
  getProjectFile: () => ProjectFile;
  newProject: (name?: string, openInNewTab?: boolean) => void;
  markSaved: (filePath: string) => void;
}

// Helper to create a new empty tab
const createEmptyTab = (name?: string, id?: string): ProjectTab => ({
  id: id || `tab-${Date.now()}-${Math.random()}`,
  projectInfo: {
    name: name || 'Untitled Project',
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
});

// Helper function to create a deep copy of objects and assemblies
const createSnapshot = (tab: ProjectTab): HistorySnapshot => ({
  objects: JSON.parse(JSON.stringify(tab.objects)),
  assemblies: JSON.parse(JSON.stringify(tab.assemblies)),
});

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initialize with one empty tab
  tabs: [createEmptyTab()],
  activeTabIndex: 0,

  // Computed getters for active tab - these work with Zustand by calling get() each time
  get projectInfo() {
    const state = get();
    return state.tabs[state.activeTabIndex]?.projectInfo || createEmptyTab().projectInfo;
  },
  get currentFilePath() {
    const state = get();
    return state.tabs[state.activeTabIndex]?.currentFilePath || null;
  },
  get hasUnsavedChanges() {
    const state = get();
    return state.tabs[state.activeTabIndex]?.hasUnsavedChanges || false;
  },
  get objects() {
    const state = get();
    return state.tabs[state.activeTabIndex]?.objects || [];
  },
  get assemblies() {
    const state = get();
    return state.tabs[state.activeTabIndex]?.assemblies || [];
  },
  get camera() {
    const state = get();
    return state.tabs[state.activeTabIndex]?.camera || createEmptyTab().camera;
  },
  get selectedObjectIds() {
    const state = get();
    return state.tabs[state.activeTabIndex]?.selectedObjectIds || [];
  },

  // Tab management
  createTab: (name, project, filePath) =>
    set((state) => {
      const newTab = project
        ? {
            id: `tab-${Date.now()}-${Math.random()}`,
            projectInfo: project.projectInfo,
            currentFilePath: filePath || null,
            hasUnsavedChanges: false,
            objects: project.objects,
            assemblies: project.assemblies,
            camera: project.camera,
            selectedObjectIds: [],
            undoStack: [],
            redoStack: [],
          }
        : createEmptyTab(name);

      return {
        tabs: [...state.tabs, newTab],
        activeTabIndex: state.tabs.length, // Switch to new tab
      };
    }),

  closeTab: (index) =>
    set((state) => {
      if (state.tabs.length === 1) {
        // If closing the last tab, create a new empty one
        return {
          tabs: [createEmptyTab()],
          activeTabIndex: 0,
        };
      }

      const newTabs = state.tabs.filter((_, i) => i !== index);
      let newActiveIndex = state.activeTabIndex;

      // Adjust active index if necessary
      if (index < state.activeTabIndex) {
        newActiveIndex--;
      } else if (index === state.activeTabIndex) {
        // If closing active tab, switch to previous tab or first tab
        newActiveIndex = Math.max(0, index - 1);
      }

      return {
        tabs: newTabs,
        activeTabIndex: newActiveIndex,
      };
    }),

  switchToTab: (index) =>
    set(() => ({
      activeTabIndex: index,
    })),

  // All existing actions updated to work on active tab
  addObject: (object) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);
      tabs[state.activeTabIndex] = {
        ...activeTab,
        objects: [...activeTab.objects, object],
        hasUnsavedChanges: true,
        undoStack: [...activeTab.undoStack, snapshot],
        redoStack: [],
      };

      return { tabs };
    }),

  removeObject: (id) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);

      // Use deleteNodeCascade to properly remove the object and clean up hierarchy
      const { objects: updatedObjects, assemblies: updatedAssemblies } = deleteNodeCascade(
        id,
        activeTab.objects,
        activeTab.assemblies
      );

      tabs[state.activeTabIndex] = {
        ...activeTab,
        objects: updatedObjects,
        assemblies: updatedAssemblies,
        selectedObjectIds: activeTab.selectedObjectIds.filter((selectedId) => selectedId !== id),
        hasUnsavedChanges: true,
        undoStack: [...activeTab.undoStack, snapshot],
        redoStack: [],
      };

      return { tabs };
    }),

  updateObject: (id, updates, skipHistory = false) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = skipHistory ? null : createSnapshot(activeTab);
      const objectIndex = activeTab.objects.findIndex((obj) => obj.id === id);
      if (objectIndex === -1) return state;

      const updatedObjects = [...activeTab.objects];
      updatedObjects[objectIndex] = { ...updatedObjects[objectIndex], ...updates };

      tabs[state.activeTabIndex] = {
        ...activeTab,
        objects: updatedObjects,
        hasUnsavedChanges: true,
        undoStack: snapshot ? [...activeTab.undoStack, snapshot] : activeTab.undoStack,
        redoStack: snapshot ? [] : activeTab.redoStack,
      };

      return { tabs };
    }),

  selectObject: (id, multi = false) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      let newSelection: string[];
      if (multi) {
        newSelection = activeTab.selectedObjectIds.includes(id)
          ? activeTab.selectedObjectIds.filter((selectedId) => selectedId !== id)
          : [...activeTab.selectedObjectIds, id];
      } else {
        newSelection = [id];
      }

      tabs[state.activeTabIndex] = {
        ...activeTab,
        selectedObjectIds: newSelection,
      };

      return { tabs };
    }),

  clearSelection: () =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      tabs[state.activeTabIndex] = {
        ...activeTab,
        selectedObjectIds: [],
      };

      return { tabs };
    }),

  pushToHistory: () =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);
      tabs[state.activeTabIndex] = {
        ...activeTab,
        undoStack: [...activeTab.undoStack, snapshot],
        redoStack: [],
      };

      return { tabs };
    }),

  setView: (view) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      tabs[state.activeTabIndex] = {
        ...activeTab,
        camera: { ...activeTab.camera, currentView: view },
      };

      return { tabs };
    }),

  setZoom: (zoom) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      tabs[state.activeTabIndex] = {
        ...activeTab,
        camera: { ...activeTab.camera, zoom },
      };

      return { tabs };
    }),

  setPanOffset: (offset) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      tabs[state.activeTabIndex] = {
        ...activeTab,
        camera: { ...activeTab.camera, panOffset: offset },
      };

      return { tabs };
    }),

  setProjectInfo: (info) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      tabs[state.activeTabIndex] = {
        ...activeTab,
        projectInfo: { ...activeTab.projectInfo, ...info, modified: new Date().toISOString() },
        hasUnsavedChanges: true,
      };

      return { tabs };
    }),

  loadProject: (project, filePath, openInNewTab = false) => {
    // Add to recent projects if we have a file path
    if (filePath) {
      addRecentProject(project.projectInfo.name, filePath);
    }

    if (openInNewTab) {
      get().createTab(undefined, project, filePath);
    } else {
      set((state) => {
        const tabs = [...state.tabs];
        tabs[state.activeTabIndex] = {
          id: tabs[state.activeTabIndex].id,
          projectInfo: project.projectInfo,
          objects: project.objects,
          assemblies: project.assemblies,
          camera: project.camera,
          currentFilePath: filePath || null,
          hasUnsavedChanges: false,
          selectedObjectIds: [],
          undoStack: [],
          redoStack: [],
        };

        return { tabs };
      });
    }
  },

  getProjectFile: () => {
    const state = get();
    const activeTab = state.tabs[state.activeTabIndex];
    if (!activeTab) return { projectInfo: createEmptyTab().projectInfo, objects: [], assemblies: [], camera: createEmptyTab().camera };

    return {
      projectInfo: activeTab.projectInfo,
      objects: activeTab.objects,
      assemblies: activeTab.assemblies,
      camera: activeTab.camera,
    };
  },

  newProject: (name, openInNewTab = false) => {
    if (openInNewTab) {
      get().createTab(name);
    } else {
      set((state) => {
        const tabs = [...state.tabs];
        tabs[state.activeTabIndex] = createEmptyTab(name, tabs[state.activeTabIndex].id);
        return { tabs };
      });
    }
  },

  markSaved: (filePath) => {
    const state = get();
    const activeTab = state.tabs[state.activeTabIndex];
    if (!activeTab) return;

    // Add to recent projects
    addRecentProject(activeTab.projectInfo.name, filePath);

    set((state) => {
      const tabs = [...state.tabs];
      tabs[state.activeTabIndex] = {
        ...tabs[state.activeTabIndex],
        currentFilePath: filePath,
        hasUnsavedChanges: false,
      };

      return { tabs };
    });
  },

  // Assembly management implementations
  createAssembly: (name, childIds, color, parentId) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);
      const newAssembly: Assembly = {
        id: `assembly-${Date.now()}`,
        name,
        color: color || `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        visible: true,
        notes: '',
        children: childIds,
        parentId: parentId,
        expanded: true,
        localPosition: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      };

      // Update children's parentId
      const updatedObjects = activeTab.objects.map((obj) =>
        childIds.includes(obj.id) ? { ...obj, parentId: newAssembly.id } : obj
      );

      const updatedAssemblies = activeTab.assemblies.map((asm) =>
        childIds.includes(asm.id) ? { ...asm, parentId: newAssembly.id } : asm
      );

      tabs[state.activeTabIndex] = {
        ...activeTab,
        assemblies: [...updatedAssemblies, newAssembly],
        objects: updatedObjects,
        hasUnsavedChanges: true,
        undoStack: [...activeTab.undoStack, snapshot],
        redoStack: [],
      };

      return { tabs };
    }),

  updateAssembly: (id, updates) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);
      const assemblyIndex = activeTab.assemblies.findIndex((asm) => asm.id === id);
      if (assemblyIndex === -1) return state;

      const updatedAssemblies = [...activeTab.assemblies];
      updatedAssemblies[assemblyIndex] = { ...updatedAssemblies[assemblyIndex], ...updates };

      tabs[state.activeTabIndex] = {
        ...activeTab,
        assemblies: updatedAssemblies,
        hasUnsavedChanges: true,
        undoStack: [...activeTab.undoStack, snapshot],
        redoStack: [],
      };

      return { tabs };
    }),

  deleteNode: (id) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);

      // Use deleteNodeCascade to properly remove the node and all its children
      const { objects: updatedObjects, assemblies: updatedAssemblies } = deleteNodeCascade(
        id,
        activeTab.objects,
        activeTab.assemblies
      );

      tabs[state.activeTabIndex] = {
        ...activeTab,
        objects: updatedObjects,
        assemblies: updatedAssemblies,
        selectedObjectIds: activeTab.selectedObjectIds.filter((selectedId) => selectedId !== id),
        hasUnsavedChanges: true,
        undoStack: [...activeTab.undoStack, snapshot],
        redoStack: [],
      };

      return { tabs };
    }),

  toggleNodeVisibility: (id) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const assemblyIndex = activeTab.assemblies.findIndex((asm) => asm.id === id);
      if (assemblyIndex !== -1) {
        const updatedAssemblies = [...activeTab.assemblies];
        updatedAssemblies[assemblyIndex] = {
          ...updatedAssemblies[assemblyIndex],
          visible: !updatedAssemblies[assemblyIndex].visible,
        };

        tabs[state.activeTabIndex] = {
          ...activeTab,
          assemblies: updatedAssemblies,
          hasUnsavedChanges: true,
        };

        return { tabs };
      }

      const objectIndex = activeTab.objects.findIndex((obj) => obj.id === id);
      if (objectIndex !== -1) {
        const updatedObjects = [...activeTab.objects];
        updatedObjects[objectIndex] = {
          ...updatedObjects[objectIndex],
          visible: !updatedObjects[objectIndex].visible,
        };

        tabs[state.activeTabIndex] = {
          ...activeTab,
          objects: updatedObjects,
          hasUnsavedChanges: true,
        };

        return { tabs };
      }

      return state;
    }),

  toggleAssemblyExpansion: (id) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const assemblyIndex = activeTab.assemblies.findIndex((asm) => asm.id === id);
      if (assemblyIndex === -1) return state;

      const updatedAssemblies = [...activeTab.assemblies];
      updatedAssemblies[assemblyIndex] = {
        ...updatedAssemblies[assemblyIndex],
        expanded: !updatedAssemblies[assemblyIndex].expanded,
      };

      tabs[state.activeTabIndex] = {
        ...activeTab,
        assemblies: updatedAssemblies,
      };

      return { tabs };
    }),

  selectAssemblyObjects: (id) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const assembly = activeTab.assemblies.find((asm) => asm.id === id);
      if (!assembly) return state;

      // Collect all descendant object IDs
      const collectObjectIds = (asmId: string): string[] => {
        const asm = activeTab.assemblies.find((a) => a.id === asmId);
        if (!asm) return [];

        const directObjects = activeTab.objects
          .filter((obj) => obj.parentId === asmId)
          .map((obj) => obj.id);

        const childAssemblies = activeTab.assemblies.filter((a) => a.parentId === asmId);
        const nestedObjects = childAssemblies.flatMap((child) => collectObjectIds(child.id));

        return [...directObjects, ...nestedObjects];
      };

      const objectIds = collectObjectIds(id);

      tabs[state.activeTabIndex] = {
        ...activeTab,
        selectedObjectIds: objectIds,
      };

      return { tabs };
    }),

  reparentNode: (nodeId, newParentId) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);

      const { objects, assemblies } = reparentNodeUtil(
        nodeId,
        newParentId,
        activeTab.objects,
        activeTab.assemblies
      );

      tabs[state.activeTabIndex] = {
        ...activeTab,
        objects,
        assemblies,
        hasUnsavedChanges: true,
        undoStack: [...activeTab.undoStack, snapshot],
        redoStack: [],
      };

      return { tabs };
    }),

  reorderChildren: (parentId, fromIndex, toIndex) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);

      const { objects, assemblies } = reorderChildrenUtil(
        parentId,
        fromIndex,
        toIndex,
        activeTab.objects,
        activeTab.assemblies
      );

      tabs[state.activeTabIndex] = {
        ...activeTab,
        objects,
        assemblies,
        hasUnsavedChanges: true,
        undoStack: [...activeTab.undoStack, snapshot],
        redoStack: [],
      };

      return { tabs };
    }),

  createArray: (objectId, direction, count, spacing, createAsAssembly) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);

      // Find the source object
      const sourceObject = activeTab.objects.find((obj) => obj.id === objectId);
      if (!sourceObject) return state;

      const newObjects: DraftObject[] = [];
      const newObjectIds: string[] = [];

      // Create copies along the specified axis
      for (let i = 1; i < count; i++) {
        const offset = spacing * i;
        const newObject: DraftObject = {
          ...JSON.parse(JSON.stringify(sourceObject)), // Deep clone
          id: `object-${Date.now()}-${i}`,
          name: `${sourceObject.name} (${i + 1})`,
          localPosition: {
            x: sourceObject.localPosition.x + (direction === 'x' ? offset : 0),
            y: sourceObject.localPosition.y + (direction === 'y' ? offset : 0),
            z: sourceObject.localPosition.z + (direction === 'z' ? offset : 0),
          },
        };
        newObjects.push(newObject);
        newObjectIds.push(newObject.id);
      }

      const updatedObjects = [...activeTab.objects, ...newObjects];
      let updatedAssemblies = activeTab.assemblies;

      // Create assembly if requested
      if (createAsAssembly) {
        const allObjectIds = [objectId, ...newObjectIds];
        const assemblyName = `${sourceObject.name} Array (${count})`;
        const newAssembly: Assembly = {
          id: `assembly-${Date.now()}`,
          name: assemblyName,
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          visible: true,
          notes: `Array of ${count} copies along ${direction.toUpperCase()} axis with ${spacing}" spacing`,
          children: allObjectIds,
          parentId: sourceObject.parentId,
          expanded: true,
          localPosition: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        };

        // Update parent IDs for all objects in the array
        const finalObjects = updatedObjects.map((obj) =>
          allObjectIds.includes(obj.id) ? { ...obj, parentId: newAssembly.id } : obj
        );

        updatedAssemblies = [...activeTab.assemblies, newAssembly];

        tabs[state.activeTabIndex] = {
          ...activeTab,
          objects: finalObjects,
          assemblies: updatedAssemblies,
          hasUnsavedChanges: true,
          undoStack: [...activeTab.undoStack, snapshot],
          redoStack: [],
        };
      } else {
        tabs[state.activeTabIndex] = {
          ...activeTab,
          objects: updatedObjects,
          hasUnsavedChanges: true,
          undoStack: [...activeTab.undoStack, snapshot],
          redoStack: [],
        };
      }

      return { tabs };
    }),

  updateObjectPosition: (id, worldPosition) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);
      const obj = activeTab.objects.find((o) => o.id === id);
      if (!obj) return state;

      // Convert world position to local position
      const localPos = worldToLocalPosition(worldPosition, obj.id, activeTab.objects, activeTab.assemblies);

      const updatedObjects = activeTab.objects.map((o) =>
        o.id === id ? { ...o, localPosition: localPos } : o
      );

      tabs[state.activeTabIndex] = {
        ...activeTab,
        objects: updatedObjects,
        hasUnsavedChanges: true,
        undoStack: [...activeTab.undoStack, snapshot],
        redoStack: [],
      };

      return { tabs };
    }),

  updateObjectRotation: (id, rotation) =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab) return state;

      const snapshot = createSnapshot(activeTab);

      const updatedObjects = activeTab.objects.map((obj) =>
        obj.id === id ? { ...obj, rotation } : obj
      );

      tabs[state.activeTabIndex] = {
        ...activeTab,
        objects: updatedObjects,
        hasUnsavedChanges: true,
        undoStack: [...activeTab.undoStack, snapshot],
        redoStack: [],
      };

      return { tabs };
    }),

  undo: () =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab || activeTab.undoStack.length === 0) return state;

      const previousState = activeTab.undoStack[activeTab.undoStack.length - 1];
      const currentState = createSnapshot(activeTab);

      tabs[state.activeTabIndex] = {
        ...activeTab,
        objects: previousState.objects,
        assemblies: previousState.assemblies,
        undoStack: activeTab.undoStack.slice(0, -1),
        redoStack: [...activeTab.redoStack, currentState],
        hasUnsavedChanges: true,
      };

      return { tabs };
    }),

  redo: () =>
    set((state) => {
      const tabs = [...state.tabs];
      const activeTab = tabs[state.activeTabIndex];
      if (!activeTab || activeTab.redoStack.length === 0) return state;

      const nextState = activeTab.redoStack[activeTab.redoStack.length - 1];
      const currentState = createSnapshot(activeTab);

      tabs[state.activeTabIndex] = {
        ...activeTab,
        objects: nextState.objects,
        assemblies: nextState.assemblies,
        undoStack: [...activeTab.undoStack, currentState],
        redoStack: activeTab.redoStack.slice(0, -1),
        hasUnsavedChanges: true,
      };

      return { tabs };
    }),

  canUndo: () => {
    const state = get();
    const activeTab = state.tabs[state.activeTabIndex];
    return activeTab ? activeTab.undoStack.length > 0 : false;
  },

  canRedo: () => {
    const state = get();
    const activeTab = state.tabs[state.activeTabIndex];
    return activeTab ? activeTab.redoStack.length > 0 : false;
  },
}));

// Selector hooks for accessing active tab data with proper reactivity
export const useActiveTab = () => {
  return useProjectStore((state) => state.tabs[state.activeTabIndex]);
};

export const useProjectInfo = () => {
  return useProjectStore((state) => state.tabs[state.activeTabIndex]?.projectInfo || createEmptyTab().projectInfo);
};

export const useCurrentFilePath = () => {
  return useProjectStore((state) => state.tabs[state.activeTabIndex]?.currentFilePath || null);
};

export const useHasUnsavedChanges = () => {
  return useProjectStore((state) => state.tabs[state.activeTabIndex]?.hasUnsavedChanges || false);
};

export const useObjects = () => {
  return useProjectStore((state) => state.tabs[state.activeTabIndex]?.objects || []);
};

export const useAssemblies = () => {
  return useProjectStore((state) => state.tabs[state.activeTabIndex]?.assemblies || []);
};

export const useCamera = () => {
  return useProjectStore((state) => state.tabs[state.activeTabIndex]?.camera || createEmptyTab().camera);
};

export const useSelectedObjectIds = () => {
  return useProjectStore((state) => state.tabs[state.activeTabIndex]?.selectedObjectIds || []);
};
