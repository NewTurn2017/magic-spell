import { create } from 'zustand';

interface AppState {
  // UI State
  cameraEnabled: boolean;
  
  // Actions
  setCameraEnabled: (enabled: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  cameraEnabled: false,
  
  // Actions
  setCameraEnabled: (enabled) => set({ cameraEnabled: enabled }),
}));