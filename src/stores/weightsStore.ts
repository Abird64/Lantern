import { create } from 'zustand';
import { useSettingStore } from './settingStore';

export interface Weights {
  urgency: number;
  value: number;
  cost: number;
}

interface WeightsState extends Weights {
  setWeights: (w: Partial<Weights>) => void;
}

const SETTINGS_KEY = 'task_weights';

const DEFAULTS: Weights = { urgency: 0.5, value: 0.3, cost: 0.2 };

/** 从 settingStore 读取权重，带 localStorage 迁移 */
function loadWeights(): Weights {
  const settingStore = useSettingStore.getState();
  if (settingStore.loaded) {
    const raw = settingStore.get(SETTINGS_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
  }
  // fallback: 检查 localStorage 旧数据
  try {
    const old = localStorage.getItem('shijie-task-weights');
    if (old) {
      const parsed = JSON.parse(old);
      // 迁移到后端
      settingStore.set(SETTINGS_KEY, JSON.stringify(parsed));
      localStorage.removeItem('shijie-task-weights');
      return parsed;
    }
  } catch {}
  return DEFAULTS;
}

export const useWeightsStore = create<WeightsState>((set) => {
  const saved = loadWeights();
  return {
    ...saved,
    setWeights: (w) =>
      set((state) => {
        const next = { ...state, ...w };
        const weights: Weights = { urgency: next.urgency, value: next.value, cost: next.cost };
        // 写入 settingStore（异步，不阻塞 UI）
        useSettingStore.getState().set(SETTINGS_KEY, JSON.stringify(weights));
        return weights;
      }),
  };
});
