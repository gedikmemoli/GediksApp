import { create } from 'zustand';

export interface RoleState {
  isDMMode: boolean;
  toggleDMMode: () => void;
  setDMMode: (value: boolean) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  isDMMode: false,
  toggleDMMode: () => set((state) => ({ isDMMode: !state.isDMMode })),
  setDMMode: (value: boolean) => set({ isDMMode: value }),
}));
