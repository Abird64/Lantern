import { create } from 'zustand';
import type { Journal } from '@/types/journal';
import type { CompleteResult } from '@/types/task';
import * as journalService from '@/services/journalService';

interface JournalState {
  // 当前日记状态
  currentDate: string;
  journal: Journal | null;
  content: string;

  // AI 日记
  aiContent: string;
  aiExists: boolean;

  // 时间线
  timelineYear: number;
  timelineMonth: number;
  timelineEntries: string[];
  showTimeline: boolean;

  // AI 面板
  showAiPanel: boolean;

  // 状态
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: number | null;
  error: string | null;
  xpResult: CompleteResult | null;

  // 内部：自动保存计时器
  _saveTimer: ReturnType<typeof setTimeout> | null;

  // 操作
  setCurrentDate: (date: string) => Promise<void>;
  updateContent: (content: string) => void;
  saveNow: () => Promise<void>;
  loadToday: () => Promise<void>;

  // 时间线
  toggleTimeline: () => void;
  navigateMonth: (delta: number) => Promise<void>;
  fetchTimelineEntries: (year: number, month: number) => Promise<void>;

  // AI 面板
  toggleAiPanel: () => void;
  fetchAiDiary: () => Promise<void>;

  // 日省 XP 结算
  completeDiary: () => Promise<CompleteResult | null>;
}

function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getYearMonth(date: string): [number, number] {
  const [y, m] = date.split('-').map(Number);
  return [y, m];
}

export const useJournalStore = create<JournalState>((set, get) => {
  const today = getToday();
  const [year, month] = getYearMonth(today);

  return {
    currentDate: today,
    journal: null,
    content: '',
    aiContent: '',
    aiExists: false,
    timelineYear: year,
    timelineMonth: month,
    timelineEntries: [],
    showTimeline: false,
    showAiPanel: false,
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    error: null,
    xpResult: null,
    _saveTimer: null,

    setCurrentDate: async (date: string) => {
      // 切换前先保存当前内容
      const { content, _saveTimer } = get();
      if (_saveTimer) {
        clearTimeout(_saveTimer);
      }

      set({ isLoading: true, currentDate: date, error: null });
      try {
        const entry = await journalService.getJournalByDate(date);
        const [y, m] = getYearMonth(date);
        set({
          journal: entry.journal,
          content: entry.content,
          isLoading: false,
          timelineYear: y,
          timelineMonth: m,
          _saveTimer: null,
        });
      } catch (e) {
        set({ error: String(e), isLoading: false, content: '', journal: null });
      }
    },

    updateContent: (content: string) => {
      const { _saveTimer, currentDate } = get();
      set({ content });

      // 清除已有计时器
      if (_saveTimer) clearTimeout(_saveTimer);

      // 1.5s 后自动保存
      const timer = setTimeout(async () => {
        set({ isSaving: true });
        try {
          const journal = await journalService.saveJournal(currentDate, content);
          set({ journal, isSaving: false, lastSaved: Date.now(), _saveTimer: null });
        } catch (e) {
          set({ error: String(e), isSaving: false, _saveTimer: null });
        }
      }, 1500);

      set({ _saveTimer: timer });
    },

    saveNow: async () => {
      const { _saveTimer, currentDate, content } = get();
      if (_saveTimer) clearTimeout(_saveTimer);

      set({ isSaving: true, _saveTimer: null });
      try {
        const journal = await journalService.saveJournal(currentDate, content);
        set({ journal, isSaving: false, lastSaved: Date.now() });
      } catch (e) {
        set({ error: String(e), isSaving: false });
      }
    },

    loadToday: async () => {
      const today = getToday();
      await get().setCurrentDate(today);
    },

    toggleTimeline: () => {
      const { showTimeline, timelineYear, timelineMonth } = get();
      if (!showTimeline) {
        // 打开时间线时刷新当月数据
        get().fetchTimelineEntries(timelineYear, timelineMonth);
      }
      set({ showTimeline: !showTimeline });
    },

    navigateMonth: async (delta: number) => {
      const { timelineYear, timelineMonth } = get();
      let newMonth = timelineMonth + delta;
      let newYear = timelineYear;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      set({ timelineYear: newYear, timelineMonth: newMonth });
      await get().fetchTimelineEntries(newYear, newMonth);
    },

    fetchTimelineEntries: async (year: number, month: number) => {
      try {
        const entries = await journalService.getTimeline(year, month);
        set({ timelineEntries: entries });
      } catch (e) {
        set({ error: String(e) });
      }
    },

    toggleAiPanel: async () => {
      const { showAiPanel, currentDate } = get();
      if (showAiPanel) {
        set({ showAiPanel: false });
      } else {
        set({ showAiPanel: true });
        // 加载 AI 日记
        try {
          const ai = await journalService.getAiDiary(currentDate);
          set({ aiContent: ai.content, aiExists: ai.exists });
        } catch (e) {
          set({ aiContent: '', aiExists: false });
        }
      }
    },

    fetchAiDiary: async () => {
      const { currentDate } = get();
      try {
        const ai = await journalService.getAiDiary(currentDate);
        set({ aiContent: ai.content, aiExists: ai.exists });
      } catch (e) {
        set({ error: String(e) });
      }
    },

    completeDiary: async () => {
      const { currentDate } = get();
      try {
        const result = await journalService.completeDiary(currentDate);
        set({ xpResult: result });
        return result;
      } catch (e) {
        set({ error: String(e) });
        return null;
      }
    },
  };
});
