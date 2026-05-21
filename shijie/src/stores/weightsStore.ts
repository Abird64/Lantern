import { create } from 'zustand';

export interface Weights {
  urgency: number;
  value: number;
  cost: number;
}

interface WeightsState extends Weights {
  setWeights: (w: Partial<Weights>) => void;
}

const STORAGE_KEY = 'shijie-task-weights';

function loadWeights(): Weights {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { urgency: 0.5, value: 0.3, cost: 0.2 };
}

export const useWeightsStore = create<WeightsState>((set) => {
  const saved = loadWeights();
  return {
    ...saved,
    setWeights: (w) =>
      set((state) => {
        const next = { ...state, ...w };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ urgency: next.urgency, value: next.value, cost: next.cost }));
        return next;
      }),
  };
});
