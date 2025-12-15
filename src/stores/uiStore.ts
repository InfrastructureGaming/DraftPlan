import { create } from 'zustand';
import { ProjectSettings } from '@/types';

interface UIState extends ProjectSettings {
  // UI state
  libraryPanelOpen: boolean;
  propertiesPanelOpen: boolean;
  controlsPanelOpen: boolean;
  majorGridSize: number; // Size in inches for major grid lines
  minorGridVisible: boolean; // Toggle for 1/16" grid visibility

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'blueprint') => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleLibraryPanel: () => void;
  togglePropertiesPanel: () => void;
  toggleControlsPanel: () => void;
  setMajorGridSize: (size: number) => void;
  toggleMinorGrid: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  gridVisible: true,
  rulersVisible: true,
  theme: 'light',
  libraryPanelOpen: true,
  propertiesPanelOpen: true,
  controlsPanelOpen: true, // Default to visible
  majorGridSize: 1, // Default to 1 inch
  minorGridVisible: true, // Default to visible

  setTheme: (theme) => set({ theme }),
  toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),
  toggleRulers: () => set((state) => ({ rulersVisible: !state.rulersVisible })),
  toggleLibraryPanel: () =>
    set((state) => ({ libraryPanelOpen: !state.libraryPanelOpen })),
  togglePropertiesPanel: () =>
    set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
  toggleControlsPanel: () =>
    set((state) => ({ controlsPanelOpen: !state.controlsPanelOpen })),
  setMajorGridSize: (size) => set({ majorGridSize: size }),
  toggleMinorGrid: () => set((state) => ({ minorGridVisible: !state.minorGridVisible })),
}));
