import { create } from 'zustand';
import { ProjectSettings } from '@/types';

interface UIState extends ProjectSettings {
  // UI state
  libraryPanelOpen: boolean;
  propertiesPanelOpen: boolean;
  controlsPanelOpen: boolean;
  assembliesPanelOpen: boolean;
  projectDetailsPanelOpen: boolean;
  cutListModalOpen: boolean;
  settingsModalOpen: boolean;
  majorGridSize: number; // Size in inches for major grid lines
  minorGridVisible: boolean; // Toggle for 1/16" grid visibility
  snapIncrement: number; // Snap increment in inches for arrow key movement

  // Auto-save state
  autoSaveEnabled: boolean;
  autoSaveInterval: number; // Auto-save interval in minutes

  // Export state
  exportPNGRequested: boolean;
  exportPDFRequested: boolean;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'blueprint') => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleLibraryPanel: () => void;
  togglePropertiesPanel: () => void;
  toggleControlsPanel: () => void;
  toggleAssembliesPanel: () => void;
  toggleProjectDetailsPanel: () => void;
  toggleCutListModal: () => void;
  toggleSettingsModal: () => void;
  setMajorGridSize: (size: number) => void;
  toggleMinorGrid: () => void;
  setSnapIncrement: (increment: number) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  requestExportPNG: () => void;
  requestExportPDF: () => void;
  clearExportRequests: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  gridVisible: true,
  rulersVisible: true,
  theme: 'light',
  libraryPanelOpen: true,
  propertiesPanelOpen: true,
  controlsPanelOpen: true, // Default to visible
  assembliesPanelOpen: true, // Default to visible
  projectDetailsPanelOpen: true, // Default to visible
  cutListModalOpen: false, // Default to closed
  settingsModalOpen: false, // Default to closed
  majorGridSize: 1, // Default to 1 inch
  minorGridVisible: true, // Default to visible
  snapIncrement: 1, // Default to 1 inch
  autoSaveEnabled: true, // Default to enabled
  autoSaveInterval: 5, // Default to 5 minutes
  exportPNGRequested: false,
  exportPDFRequested: false,

  setTheme: (theme) => set({ theme }),
  toggleGrid: () => set((state) => ({ gridVisible: !state.gridVisible })),
  toggleRulers: () => set((state) => ({ rulersVisible: !state.rulersVisible })),
  toggleLibraryPanel: () =>
    set((state) => ({ libraryPanelOpen: !state.libraryPanelOpen })),
  togglePropertiesPanel: () =>
    set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
  toggleControlsPanel: () =>
    set((state) => ({ controlsPanelOpen: !state.controlsPanelOpen })),
  toggleAssembliesPanel: () =>
    set((state) => ({ assembliesPanelOpen: !state.assembliesPanelOpen })),
  toggleProjectDetailsPanel: () =>
    set((state) => ({ projectDetailsPanelOpen: !state.projectDetailsPanelOpen })),
  toggleCutListModal: () =>
    set((state) => ({ cutListModalOpen: !state.cutListModalOpen })),
  toggleSettingsModal: () =>
    set((state) => ({ settingsModalOpen: !state.settingsModalOpen })),
  setMajorGridSize: (size) => set({ majorGridSize: size }),
  toggleMinorGrid: () => set((state) => ({ minorGridVisible: !state.minorGridVisible })),
  setSnapIncrement: (increment) => set({ snapIncrement: increment }),
  setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
  setAutoSaveInterval: (interval) => set({ autoSaveInterval: interval }),
  requestExportPNG: () => set({ exportPNGRequested: true }),
  requestExportPDF: () => set({ exportPDFRequested: true }),
  clearExportRequests: () => set({ exportPNGRequested: false, exportPDFRequested: false }),
}));
