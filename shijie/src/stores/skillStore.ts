import { create } from 'zustand';
import type { Skill } from '@/types/skill';
import * as skillService from '@/services/skillService';

interface SkillState {
  skills: Skill[];
  isLoading: boolean;
  error: string | null;
  fetchSkills: () => Promise<void>;
}

export const useSkillStore = create<SkillState>((set) => ({
  skills: [],
  isLoading: false,
  error: null,

  fetchSkills: async () => {
    set({ isLoading: true, error: null });
    try {
      const skills = await skillService.listSkills();
      set({ skills, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },
}));
