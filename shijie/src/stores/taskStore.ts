import { create } from 'zustand';

export interface Task {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  skills: { name: string; xp: number; color: string }[];
  category: string;
}

interface TaskState {
  tasks: Task[];
  filter: string;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => void;
  completeTask: (id: string) => void;
  setFilter: (filter: string) => void;
}

// 模拟数据
const mockTasks: Task[] = [
  {
    id: '1',
    title: '高数作业',
    date: '2026-03-24',
    completed: false,
    skills: [
      { name: '学识', xp: 3, color: '#2A8CB7' },
      { name: '才情', xp: 3, color: '#E6B85C' },
    ],
    category: 'study',
  },
];

export const useTaskStore = create<TaskState>((set) => ({
  tasks: mockTasks,
  filter: 'wanxiang',
  fetchTasks: async () => {
    // 模拟API调用
    set({ tasks: mockTasks });
  },
  addTask: (task) => {
    const newTask = { ...task, id: Date.now().toString() };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },
  completeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: true } : t
      ),
    }));
  },
  setFilter: (filter) => set({ filter }),
}));
