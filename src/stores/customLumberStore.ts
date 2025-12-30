import { create } from 'zustand';
import { LumberLibraryItem, Dimensions } from '@/types';

const STORAGE_KEY = 'draftplan-custom-lumber';

interface CustomLumberState {
  customItems: LumberLibraryItem[];
  addCustomItem: (item: Omit<LumberLibraryItem, 'id' | 'isCustom'>) => void;
  updateCustomItem: (id: string, item: Partial<LumberLibraryItem>) => void;
  deleteCustomItem: (id: string) => void;
  loadFromStorage: () => void;
}

// Load custom items from localStorage
const loadCustomItems = (): LumberLibraryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Failed to load custom lumber from localStorage:', error);
  }
  return [];
};

// Save custom items to localStorage
const saveCustomItems = (items: LumberLibraryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save custom lumber to localStorage:', error);
  }
};

export const useCustomLumberStore = create<CustomLumberState>((set, get) => ({
  customItems: loadCustomItems(),

  addCustomItem: (item) => {
    const newItem: LumberLibraryItem = {
      ...item,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isCustom: true,
    };

    set((state) => {
      const newItems = [...state.customItems, newItem];
      saveCustomItems(newItems);
      return { customItems: newItems };
    });
  },

  updateCustomItem: (id, updates) => {
    set((state) => {
      const newItems = state.customItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      saveCustomItems(newItems);
      return { customItems: newItems };
    });
  },

  deleteCustomItem: (id) => {
    set((state) => {
      const newItems = state.customItems.filter((item) => item.id !== id);
      saveCustomItems(newItems);
      return { customItems: newItems };
    });
  },

  loadFromStorage: () => {
    set({ customItems: loadCustomItems() });
  },
}));
