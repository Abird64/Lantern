import { create } from 'zustand';

interface UIState {
  activeTab: string;
  menuOpen: boolean;
  setActiveTab: (tab: string) => void;
  setMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'lantern',
  menuOpen: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setMenuOpen: (open) => set({ menuOpen: open }),
}));
