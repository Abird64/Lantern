/* ============================================
   提灯 Web 版 — 数据存储层（localStorage）
   ============================================ */

const Store = {
  /** 存储键名前缀 */
  PREFIX: 'lantern_',

  /** ---- 通用读写 ---- */
  _get(key) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Store save failed:', e);
    }
  },

  /* ========================================
     任务 Tasks
     ======================================== */
  getTasks() {
    return this._get('tasks') || [];
  },

  saveTasks(tasks) {
    this._set('tasks', tasks);
  },

  addTask(task) {
    const tasks = this.getTasks();
    tasks.unshift({
      id: Utils.uid(),
      title: task.title,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: task.dueDate || null,
      priority: task.priority || null,
      tags: task.tags || [],
    });
    this.saveTasks(tasks);
    return tasks;
  },

  toggleTask(id) {
    const tasks = this.getTasks();
    const t = tasks.find(t => t.id === id);
    if (t) t.completed = !t.completed;
    this.saveTasks(tasks);
    return tasks;
  },

  deleteTask(id) {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.saveTasks(tasks);
    return tasks;
  },

  getTaskStats() {
    const tasks = this.getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const today = Utils.today();
    const todayTasks = tasks.filter(t => {
      if (t.dueDate === today) return true;
      if (!t.dueDate && t.createdAt.startsWith(today)) return true;
      return false;
    });
    const todayDone = todayTasks.filter(t => t.completed).length;
    return { total, completed, pending: total - completed, todayTotal: todayTasks.length, todayDone };
  },

  /* ========================================
     日记 Diary
     ======================================== */
  getDiaries() {
    return this._get('diaries') || [];
  },

  saveDiaries(diaries) {
    this._set('diaries', diaries);
  },

  getDiaryByDate(date) {
    return this.getDiaries().find(d => d.date === date) || null;
  },

  saveDiary(date, content) {
    const diaries = this.getDiaries();
    const existing = diaries.findIndex(d => d.date === date);
    const entry = {
      id: existing >= 0 ? diaries[existing].id : Utils.uid(),
      date,
      content,
      wordCount: Utils.wordCount(content),
      updatedAt: new Date().toISOString(),
      createdAt: existing >= 0 ? diaries[existing].createdAt : new Date().toISOString(),
    };
    if (existing >= 0) {
      diaries[existing] = entry;
    } else {
      diaries.unshift(entry);
    }
    // 按日期倒序
    diaries.sort((a, b) => b.date.localeCompare(a.date));
    this.saveDiaries(diaries);
    return entry;
  },

  getDiaryStats() {
    const diaries = this.getDiaries();
    const total = diaries.length;
    const thisMonth = Utils.today().slice(0, 7);
    const monthCount = diaries.filter(d => d.date.startsWith(thisMonth)).length;
    const totalWords = diaries.reduce((sum, d) => sum + (d.wordCount || 0), 0);
    return { total, monthCount, totalWords };
  },

  /* ========================================
     习惯 Habits
     ======================================== */
  getHabits() {
    return this._get('habits') || [];
  },

  saveHabits(habits) {
    this._set('habits', habits);
  },

  addHabit(habit) {
    const habits = this.getHabits();
    habits.push({
      id: Utils.uid(),
      name: habit.name,
      icon: habit.icon || '🎯',
      color: habit.color || '#4CAF76',
      records: [],
      createdAt: new Date().toISOString(),
    });
    this.saveHabits(habits);
    return habits;
  },

  toggleHabitCheckin(id, date) {
    const habits = this.getHabits();
    const h = habits.find(h => h.id === id);
    if (!h) return habits;
    const idx = h.records.indexOf(date);
    if (idx >= 0) {
      h.records.splice(idx, 1);
    } else {
      h.records.push(date);
    }
    this.saveHabits(habits);
    return habits;
  },

  deleteHabit(id) {
    const habits = this.getHabits().filter(h => h.id !== id);
    this.saveHabits(habits);
    return habits;
  },

  getHabitStats() {
    const habits = this.getHabits();
    const today = Utils.today();
    const total = habits.length;
    const doneToday = habits.filter(h => h.records.includes(today)).length;
    return { total, doneToday, rate: total > 0 ? Math.round(doneToday / total * 100) : 0 };
  },

  /* ========================================
     设置 Settings
     ======================================== */
  getSettings() {
    return this._get('settings') || {
      nickname: '',
      theme: 'dark',
    };
  },

  saveSettings(settings) {
    this._set('settings', settings);
  },

  updateSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
    return settings;
  },

  /* ========================================
     数据导出/导入
     ======================================== */
  exportAll() {
    return {
      tasks: this.getTasks(),
      diaries: this.getDiaries(),
      habits: this.getHabits(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
  },

  importAll(data) {
    if (data.tasks) this.saveTasks(data.tasks);
    if (data.diaries) this.saveDiaries(data.diaries);
    if (data.habits) this.saveHabits(data.habits);
    if (data.settings) this.saveSettings(data.settings);
  },

  clearAll() {
    ['tasks', 'diaries', 'habits', 'settings'].forEach(k => {
      localStorage.removeItem(this.PREFIX + k);
    });
  },
};
