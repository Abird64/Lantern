import { create } from 'zustand';
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from '@/types/schedule';
import * as scheduleService from '@/services/scheduleService';

interface ScheduleState {
  schedules: Schedule[];
  isLoading: boolean;
  error: string | null;

  // 当前周的范围
  rangeStart: string;
  rangeEnd: string;

  // 操作
  fetchSchedules: (rangeStart: string, rangeEnd: string) => Promise<void>;
  createSchedule: (input: CreateScheduleInput) => Promise<Schedule>;
  updateSchedule: (id: string, input: UpdateScheduleInput) => Promise<Schedule>;
  deleteSchedule: (id: string) => Promise<void>;

  // 筛选
  filter: string;
  setFilter: (filter: string) => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: [],
  isLoading: false,
  error: null,
  rangeStart: '',
  rangeEnd: '',
  filter: 'all',

  fetchSchedules: async (rangeStart, rangeEnd) => {
    set({ isLoading: true, error: null, rangeStart, rangeEnd });
    try {
      const schedules = await scheduleService.listSchedulesInRange({
        range_start: rangeStart,
        range_end: rangeEnd,
      });
      set({ schedules, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  createSchedule: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const schedule = await scheduleService.createSchedule(input);
      set((state) => ({
        schedules: [...state.schedules, schedule].sort(
          (a, b) => a.start_at.localeCompare(b.start_at)
        ),
        isLoading: false,
      }));
      return schedule;
    } catch (e) {
      set({ error: String(e), isLoading: false });
      throw e;
    }
  },

  updateSchedule: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      const schedule = await scheduleService.updateSchedule(id, input);
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? schedule : s)),
        isLoading: false,
      }));
      return schedule;
    } catch (e) {
      set({ error: String(e), isLoading: false });
      throw e;
    }
  },

  deleteSchedule: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await scheduleService.deleteSchedule(id);
      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  setFilter: (filter) => set({ filter }),
}));
