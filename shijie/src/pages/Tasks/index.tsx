import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Circle, Plus, X, Check, Pencil, Trash2, Search, ArrowUpDown, ChevronDown, ChevronRight, ListChecks } from 'lucide-react';
import { CapsuleTabs, NavBar, themes, SKILL_COLORS, SKILL_ORDER } from '@/components/ui';
import { useTaskStore } from '@/stores/taskStore';
import { useWeightsStore } from '@/stores/weightsStore';
import { useSkillStore } from '@/stores/skillStore';
import * as skillService from '@/services/skillService';
import { recommendTask, scoreTask } from '@/utils/scoring';
import type { Task } from '@/types/task';

const categories = [
  { id: 'wanxiang', label: '全部' },
  { id: 'jinchen', label: '今天' },
  { id: 'yuanyuan', label: '已完成' },
  { id: 'qixu', label: '进行中' },
  { id: 'chimu', label: '已过期' },
];

const theme = themes.tasks;

/** 格式化日期为 MM月DD日 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 格式化日期时间为 MM月DD日 HH:MM */
function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${h}:${m}`;
}

/** 判断是否是今天 */
function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

/** 判断是否在未来 */
function isFuture(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d > now;
}

/** 判断是否已过期 */
function isOverdue(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < now;
}

/** 根据 tab 和搜索词过滤任务 */
function filterTasks(tasks: Task[], tabId: string, searchQuery: string): Task[] {
  // 先按 tab 过滤
  let result: Task[];
  switch (tabId) {
    case 'wanxiang':
      // 全部进行中的任务
      result = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
      break;
    case 'jinchen':
      // 今天该做的：scheduled_at 是今天 + 没安排时间但已过期的
      result = tasks.filter((t) => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        if (t.scheduled_at && isToday(t.scheduled_at)) return true;
        if (!t.scheduled_at && t.deadline && isOverdue(t.deadline)) return true;
        return false;
      });
      break;
    case 'yuanyuan':
      // 已完成
      result = tasks.filter((t) => t.status === 'completed');
      break;
    case 'qixu':
      // 期许：计划在未来
      result = tasks.filter((t) => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        if (t.scheduled_at && isFuture(t.scheduled_at)) return true;
        if (t.deadline && isFuture(t.deadline)) return true;
        return false;
      });
      break;
    case 'chimu':
      // 迟暮：已过期未完成
      result = tasks.filter((t) => {
        if (t.status === 'completed' || t.status === 'cancelled') return false;
        if (t.deadline && isOverdue(t.deadline)) return true;
        if (t.scheduled_at && isOverdue(t.scheduled_at)) return true;
        return false;
      });
      break;
    default:
      result = tasks;
  }

  // 再按搜索词过滤
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q))
    );
  }

  return result;
}

/** 优先级颜色 */
const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: '紧急', color: '#E74C3C' },
  medium: { label: '重要', color: '#F39C12' },
  low: { label: '一般', color: '#58A968' },
};

export function TasksPage() {
  const [activeCategory, setActiveCategory] = useState('wanxiang');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'deadline' | 'priority'>('created_at');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // 子任务
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [subtasksMap, setSubtasksMap] = useState<Map<string, Task[]>>(new Map());
  const [detailSubtasks, setDetailSubtasks] = useState<Task[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // 批量操作
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<string>('');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState<string>('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showCreateExpanded, setShowCreateExpanded] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSkillXps, setNewSkillXps] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string>('');
  const [pandaTip, setPandaTip] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 详情面板
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [editPriority, setEditPriority] = useState<string>('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNewTagInput, setEditNewTagInput] = useState('');
  const [editSkillXps, setEditSkillXps] = useState<Record<string, number>>({});

  const { tasks, isLoading, fetchTasks, completeTask, uncompleteTask, createTask, updateTask, deleteTask, fetchSubtasks } = useTaskStore();
  const weights = useWeightsStore();
  const { fetchSkills } = useSkillStore();

  useEffect(() => {
    fetchTasks();
    fetchSkills();
  }, [fetchTasks, fetchSkills]);

  const filteredTasks = useMemo(() => {
    let result = filterTasks(tasks, activeCategory, searchQuery);
    // 排序
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'deadline': {
          const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return da - db;
        }
        case 'priority': {
          const pa = priorityOrder[a.priority ?? 'none'] ?? 3;
          const pb = priorityOrder[b.priority ?? 'none'] ?? 3;
          return pa - pb;
        }
        default: // created_at
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return result;
  }, [tasks, activeCategory, searchQuery, sortBy]);

  // 打开详情面板
  const openDetail = async (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditStatus(task.status);
    setEditPriority(task.priority || '');
    setEditDeadline(task.deadline ? task.deadline.slice(0, 16) : '');
    setEditScheduledAt(task.scheduled_at ? task.scheduled_at.slice(0, 16) : '');
    setEditEstimatedMinutes(task.estimated_minutes ? String(task.estimated_minutes) : '');
    setEditNotes(task.notes || '');
    setEditTags(task.tags ? JSON.parse(task.tags) : []);
    setEditNewTagInput('');
    setNewSubtaskTitle('');
    setEditSkillXps({});
    // 加载子任务
    const subs = await fetchSubtasks(task.id);
    setDetailSubtasks(subs);
    // 加载技能XP分配
    try {
      const taskSkills = await skillService.getTaskSkills(task.id);
      const xpMap: Record<string, number> = {};
      taskSkills.forEach(ts => { xpMap[ts.skill_id] = ts.xp_amount; });
      setEditSkillXps(xpMap);
    } catch { /* ignore */ }
  };

  const closeDetail = () => {
    setSelectedTask(null);
    setDetailSubtasks([]);
  };

  // 展开/收起子任务
  const toggleSubtasks = useCallback(async (taskId: string) => {
    if (expandedTasks.has(taskId)) {
      setExpandedTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    } else {
      const subs = await fetchSubtasks(taskId);
      setSubtasksMap((prev) => new Map(prev).set(taskId, subs));
      setExpandedTasks((prev) => new Set(prev).add(taskId));
    }
  }, [expandedTasks, fetchSubtasks]);

  // 添加子任务
  const handleAddSubtask = async () => {
    if (!selectedTask || !newSubtaskTitle.trim()) return;
    try {
      const subtask = await createTask({
        title: newSubtaskTitle.trim(),
        parent_id: selectedTask.id,
      });
      setDetailSubtasks((prev) => [...prev, subtask]);
      setNewSubtaskTitle('');
    } catch (e) {
      setToast(String(e));
      setTimeout(() => setToast(''), 4000);
    }
  };

  // 批量完成
  const handleBatchComplete = async () => {
    for (const id of selectedIds) {
      const task = tasks.find((t) => t.id === id);
      if (task && task.status !== 'completed') {
        try { await completeTask(id); } catch { /* skip */ }
      }
    }
    setSelectedIds(new Set());
    setMultiSelectMode(false);
  };

  // 批量删除
  const handleBatchDelete = async () => {
    for (const id of selectedIds) {
      try { await deleteTask(id); } catch { /* skip */ }
    }
    setSelectedIds(new Set());
    setMultiSelectMode(false);
  };

  // 保存编辑
  const handleSave = async () => {
    if (!selectedTask) return;
    try {
      await updateTask(selectedTask.id, {
        title: editTitle.trim() || selectedTask.title,
        description: editDescription.trim() || undefined,
        status: editStatus !== selectedTask.status ? editStatus : undefined,
        priority: editPriority || undefined,
        deadline: editDeadline || undefined,
        scheduled_at: editScheduledAt || undefined,
        estimated_minutes: editEstimatedMinutes ? parseInt(editEstimatedMinutes) : undefined,
        notes: editNotes.trim() || undefined,
        tags: editTags.length > 0 ? JSON.stringify(editTags) : undefined,
      });
      // 保存技能XP分配
      const skillEntries = Object.entries(editSkillXps)
        .filter(([_, v]) => v > 0)
        .map(([skill_id, xp_amount]) => ({ skill_id, xp_amount }));
      await skillService.setTaskSkills(selectedTask.id, skillEntries);
      setToast('已保存');
      setTimeout(() => setToast(''), 2000);
      closeDetail();
    } catch (e) {
      setToast(String(e));
      setTimeout(() => setToast(''), 4000);
    }
  };

  // 从详情完成任务
  const handleCompleteFromDetail = async () => {
    if (!selectedTask) return;
    try {
      await completeTask(selectedTask.id);
      closeDetail();
    } catch (e) {
      setToast(String(e));
      setTimeout(() => setToast(''), 4000);
    }
  };

  // 从详情取消完成（撤回XP）
  const handleUncompleteFromDetail = async () => {
    if (!selectedTask) return;
    try {
      await uncompleteTask(selectedTask.id);
      closeDetail();
    } catch (e) {
      setToast(String(e));
      setTimeout(() => setToast(''), 4000);
    }
  };

  // 从详情删除任务
  const handleDeleteFromDetail = async () => {
    if (!selectedTask) return;
    try {
      await deleteTask(selectedTask.id);
      closeDetail();
    } catch (e) {
      setToast(String(e));
      setTimeout(() => setToast(''), 4000);
    }
  };

  // 快速完成（卡片上的勾）
  const handleQuickComplete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await completeTask(id);
    } catch (err) {
      console.error('完成任务失败:', err);
    }
  };

  // 创建任务
  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      const task = await createTask({
        title,
        description: newDescription.trim() || undefined,
        priority: newPriority || undefined,
        scheduled_at: newScheduledAt || undefined,
        deadline: newDeadline || undefined,
        estimated_minutes: newEstimatedMinutes ? parseInt(newEstimatedMinutes) : undefined,
        tags: newTags.length > 0 ? JSON.stringify(newTags) : undefined,
      });
      // 保存技能XP分配
      const skillEntries = Object.entries(newSkillXps)
        .filter(([_, v]) => v > 0)
        .map(([skill_id, xp_amount]) => ({ skill_id, xp_amount }));
      if (skillEntries.length > 0) {
        await skillService.setTaskSkills(task.id, skillEntries);
      }
      setNewTitle('');
      setNewDescription('');
      setNewPriority('');
      setNewScheduledAt('');
      setNewDeadline('');
      setNewEstimatedMinutes('');
      setNewTags([]);
      setNewTagInput('');
      setNewSkillXps({});
      setShowCreateExpanded(false);
      setShowCreate(false);
    } catch (e) {
      setToast(String(e));
      setTimeout(() => setToast(''), 4000);
    }
  };

  const openCreate = () => {
    setShowCreate(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div
      className="h-screen px-4 md:px-6 lg:px-8 relative flex flex-col overflow-hidden"
      style={{ backgroundColor: theme.bg }}
    >
      {/* 网格背景 */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 顶部导航栏 */}
      <NavBar
        title="任务"
        navColor={theme.nav}
        quote="苔痕上阶绿，草色入帘青"
      />

      {/* 固定控制区：胶囊分类 + 搜索 */}
      <div className="flex-shrink-0 flex flex-col items-center px-8 pt-6 pb-4 relative z-10">
        {/* 胶囊分类栏 */}
        <div className="w-full max-w-[1000px]">
          <CapsuleTabs
            items={categories}
            activeId={activeCategory}
            onChange={setActiveCategory}
            accentColor={theme.accent}
          />
        </div>

        <div className="h-4" />

        {/* 搜索框 + 排序 */}
        <div className="w-full max-w-[1000px] flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务..."
              className="w-full bg-white/60 backdrop-blur-sm rounded-full pl-11 pr-4 py-3 text-base text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {/* 排序按钮 */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="w-11 h-11 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center text-black/40 hover:text-black/60 transition-colors"
            >
              <ArrowUpDown size={18} />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl py-2 z-20 min-w-[140px]">
                  {[
                    { value: 'created_at' as const, label: '创建时间' },
                    { value: 'deadline' as const, label: '截止时间' },
                    { value: 'priority' as const, label: '优先级' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === opt.value
                          ? 'text-[#58A968] font-medium'
                          : 'text-black/60 hover:bg-black/5'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* 多选按钮 */}
          <button
            onClick={() => {
              setMultiSelectMode(!multiSelectMode);
              if (multiSelectMode) setSelectedIds(new Set());
            }}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              multiSelectMode
                ? 'bg-[#58A968] text-white'
                : 'bg-white/60 backdrop-blur-sm text-black/40 hover:text-black/60'
            }`}
          >
            <ListChecks size={18} />
          </button>
        </div>
      </div>

      {/* 可滚动内容区：任务卡片 */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-8 pb-8 relative z-10">
        <div className="w-full max-w-[1000px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-[#888] text-lg">加载中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div key={task.id}>
                    <div
                      className="bg-white/60 backdrop-blur-sm rounded-[28px] p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
                      onClick={() => {
                        if (multiSelectMode) {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(task.id)) next.delete(task.id);
                            else next.add(task.id);
                            return next;
                          });
                        } else {
                          openDetail(task);
                        }
                      }}
                    >
                      <div className="flex items-start gap-5">
                        {/* 多选 checkbox */}
                        {multiSelectMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(task.id)) next.delete(task.id);
                                else next.add(task.id);
                                return next;
                              });
                            }}
                            className="flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-5 transition-colors"
                            style={{
                              borderColor: selectedIds.has(task.id) ? '#58A968' : '#ccc',
                              backgroundColor: selectedIds.has(task.id) ? '#58A968' : 'transparent',
                            }}
                          >
                            {selectedIds.has(task.id) && <Check size={14} className="text-white" />}
                          </button>
                        )}
                        {/* 左侧五边形图标 */}
                        <div className="w-[72px] h-[72px] flex-shrink-0 flex items-center justify-center relative">
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            <polygon
                              points="50,5 95,38 78,90 22,90 5,38"
                              fill={task.status === 'completed' ? '#D1FAE5' : '#E0F2FE'}
                              stroke={task.status === 'completed' ? '#6EE7B7' : '#93C5FD'}
                              strokeWidth="2"
                            />
                          </svg>
                          {/* 快速完成按钮 */}
                          {task.status !== 'completed' && (
                            <button
                              onClick={(e) => handleQuickComplete(e, task.id)}
                              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <div className="w-8 h-8 rounded-full bg-[#58A968] flex items-center justify-center shadow-md">
                                <Check size={16} className="text-white" />
                              </div>
                            </button>
                          )}
                        </div>

                        {/* 右侧信息 */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-2xl font-normal mb-1.5 truncate ${
                            task.status === 'completed' ? 'text-black/50 line-through' : 'text-black'
                          }`}>
                            {task.title}
                          </h3>
                          <p className="text-base text-[#666] mb-3">
                            {task.scheduled_at
                              ? formatDate(task.scheduled_at)
                              : formatDate(task.created_at)}
                          </p>

                          {/* 优先级 + XP + 标签 */}
                          <div className="flex items-center gap-3">
                            {task.priority && task.priority !== 'none' && priorityConfig[task.priority] && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: priorityConfig[task.priority].color }}
                              >
                                {priorityConfig[task.priority].label}
                              </span>
                            )}
                            {task.xp_earned > 0 && (
                              <span className="inline-flex items-center gap-1.5 text-sm text-[#4A90D9]">
                                <Circle size={14} fill="#4A90D9" />
                                XP+{task.xp_earned}
                              </span>
                            )}
                            {/* 过期标记 */}
                            {task.status !== 'completed' && task.deadline && isOverdue(task.deadline) && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                已过期
                              </span>
                            )}
                            {/* 标签 */}
                            {task.tags && (() => {
                              try {
                                const tags: string[] = JSON.parse(task.tags);
                                return tags.slice(0, 2).map((tag, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-black/5 text-black/50">
                                    {tag}
                                  </span>
                                ));
                              } catch { return null; }
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* 子任务展开/收起按钮 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSubtasks(task.id); }}
                        className="absolute bottom-3 right-4 flex items-center gap-1 text-xs text-black/30 hover:text-black/50 transition-colors"
                      >
                        {expandedTasks.has(task.id)
                          ? <ChevronDown size={14} />
                          : <ChevronRight size={14} />}
                        子任务
                      </button>
                    </div>

                    {/* 展开的子任务列表 */}
                    {expandedTasks.has(task.id) && subtasksMap.has(task.id) && (
                      <div className="mt-1 ml-8 space-y-1">
                        {(subtasksMap.get(task.id) ?? []).map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => openDetail(sub)}
                            className="bg-white/40 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/60 transition-colors"
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); handleQuickComplete(e, sub.id); }}
                              className="flex-shrink-0"
                            >
                              {sub.status === 'completed'
                                ? <Check size={14} className="text-[#58A968]" />
                                : <Circle size={14} className="text-black/20" />}
                            </button>
                            <span className={`text-sm truncate ${sub.status === 'completed' ? 'text-black/40 line-through' : 'text-black/70'}`}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                        {(subtasksMap.get(task.id) ?? []).length === 0 && (
                          <p className="text-xs text-black/30 px-4 py-2">暂无子任务</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex items-center justify-center py-20">
                  <p className="text-[#888] text-lg">
                    {activeCategory === 'yuanyuan'
                      ? '暂无已完成的任务'
                      : activeCategory === 'jinchen'
                        ? '今天没有待办事项'
                        : activeCategory === 'chimu'
                          ? '没有过期的任务，真棒'
                          : activeCategory === 'qixu'
                            ? '没有未来的计划'
                            : '暂无任务，点击右下角创建'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========== 创建任务弹窗 ========== */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-32">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative w-full max-w-[600px] bg-white rounded-3xl shadow-2xl p-8 mx-4">
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="输入任务名称..."
              className="w-full text-xl text-black placeholder:text-black/30 bg-transparent border-b border-black/10 pb-3 mb-5 focus:outline-none focus:border-[#58A968]"
            />

            {/* 截止时间 + 优先级 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2.5">
                <span className="text-sm text-black/30 shrink-0">截止</span>
                <input
                  type="date"
                  value={newDeadline.split('T')[0] || ''}
                  onChange={(e) => {
                    const time = newDeadline.split('T')[1] || '';
                    setNewDeadline(e.target.value ? `${e.target.value}T${time || '00:00'}` : '');
                  }}
                  className="date-input text-sm text-black w-32"
                />
                <input
                  type="time"
                  value={newDeadline.split('T')[1] || ''}
                  onChange={(e) => {
                    const date = newDeadline.split('T')[0] || '';
                    if (date) setNewDeadline(`${date}T${e.target.value || '00:00'}`);
                  }}
                  className="time-input text-sm text-black w-20"
                />
              </div>
              <div className="flex gap-2 ml-auto">
                {[
                  { value: 'high', label: '紧急', color: '#E74C3C' },
                  { value: 'medium', label: '重要', color: '#F39C12' },
                  { value: 'low', label: '一般', color: '#58A968' },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() =>
                      setNewPriority(newPriority === p.value ? '' : p.value)
                    }
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      newPriority === p.value
                        ? 'text-white'
                        : 'text-black/50 bg-black/5'
                    }`}
                    style={
                      newPriority === p.value
                        ? { backgroundColor: p.color }
                        : undefined
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 展开/收起按钮 */}
            <button
              onClick={() => setShowCreateExpanded(!showCreateExpanded)}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-sm text-black/30 hover:text-black/50 transition-colors mb-4"
            >
              <ChevronDown
                size={16}
                className={`transition-transform ${showCreateExpanded ? 'rotate-180' : ''}`}
              />
              {showCreateExpanded ? '收起' : '更多选项'}
            </button>

            {/* 展开区域 */}
            {showCreateExpanded && (
              <div className="space-y-4 mb-5">
                {/* 开始时间 + 预估耗时（与上面截止+优先级对齐） */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2.5">
                    <span className="text-sm text-black/30 shrink-0">开始</span>
                    <input
                      type="date"
                      value={newScheduledAt.split('T')[0] || ''}
                      onChange={(e) => {
                        const time = newScheduledAt.split('T')[1] || '';
                        setNewScheduledAt(e.target.value ? `${e.target.value}T${time || '00:00'}` : '');
                      }}
                      className="date-input text-sm text-black w-32"
                    />
                    <input
                      type="time"
                      value={newScheduledAt.split('T')[1] || ''}
                      onChange={(e) => {
                        const date = newScheduledAt.split('T')[0] || '';
                        if (date) setNewScheduledAt(`${date}T${e.target.value || '00:00'}`);
                      }}
                      className="time-input text-sm text-black w-20"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/5 rounded-xl px-3 py-2.5 ml-auto">
                    <span className="text-sm text-black/30">预计</span>
                    <input
                      type="number"
                      min="0"
                      value={newEstimatedMinutes}
                      onChange={(e) => setNewEstimatedMinutes(e.target.value)}
                      placeholder="30"
                      className="w-12 text-sm text-black bg-transparent text-center focus:outline-none placeholder:text-black/20"
                    />
                    <span className="text-sm text-black/30">分钟</span>
                  </div>
                </div>

                {/* 描述 */}
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="添加描述..."
                  className="w-full text-sm text-black bg-black/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30 resize-none placeholder:text-black/20"
                />

                {/* 标签 */}
                <div>
                  {newTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newTags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/5 text-sm text-black/70"
                        >
                          {tag}
                          <button
                            onClick={() => setNewTags(newTags.filter((_, j) => j !== i))}
                            className="text-black/30 hover:text-black/60 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTagInput.trim()) {
                        e.preventDefault();
                        const tag = newTagInput.trim();
                        if (!newTags.includes(tag)) {
                          setNewTags([...newTags, tag]);
                        }
                        setNewTagInput('');
                      }
                    }}
                    placeholder="输入标签，回车添加"
                    className="w-full text-sm text-black bg-black/5 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30 placeholder:text-black/20"
                  />
                </div>

                {/* 属性加成 */}
                <div>
                  <label className="block text-sm text-black/30 mb-2">属性加成</label>
                  <div className="grid grid-cols-3 gap-3">
                    {SKILL_ORDER.map((skillId) => {
                      const info = SKILL_COLORS[skillId];
                      return (
                        <div key={skillId} className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2.5">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: info.hex }}
                          />
                          <span className="text-sm text-black/50 shrink-0">{info.name}</span>
                          <input
                            type="number"
                            min="0"
                            value={newSkillXps[skillId] || ''}
                            onChange={(e) => setNewSkillXps(prev => ({
                              ...prev,
                              [skillId]: parseInt(e.target.value) || 0,
                            }))}
                            placeholder="0"
                            className="w-12 text-sm text-black bg-transparent text-center focus:outline-none placeholder:text-black/20"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3 rounded-2xl text-black/50 bg-black/5 text-base transition-colors hover:bg-black/10"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className={`flex-1 py-3 rounded-2xl text-base font-medium transition-all ${
                  newTitle.trim()
                    ? 'bg-[#58A968] text-white hover:bg-[#4a9458]'
                    : 'bg-black/10 text-black/30 cursor-not-allowed'
                }`}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== 任务详情面板 ========== */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDetail}
          />
          {/* 详情面板 */}
          <div className="relative w-full max-w-[480px] shadow-2xl flex flex-col animate-slide-in" style={{ backgroundColor: '#E0F7FA' }}>
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-black/8">
              <h2 className="text-xl text-black/80">任务详情</h2>
              <button
                onClick={closeDetail}
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
              >
                <X size={16} className="text-black/50" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* 标题 */}
              <div>
                <label className="block text-sm text-black/40 mb-1.5">标题</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-lg text-black bg-black/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30"
                />
              </div>

              {/* 状态 */}
              <div>
                <label className="block text-sm text-black/40 mb-1.5">状态</label>
                <div className="flex gap-2">
                  {[
                    { value: 'pending', label: '待办', color: '#999' },
                    { value: 'in_progress', label: '进行中', color: '#2A8CB7' },
                    { value: 'completed', label: '已完成', color: '#58A968' },
                    { value: 'cancelled', label: '已取消', color: '#E74C3C' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setEditStatus(s.value)}
                      className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                        editStatus === s.value
                          ? 'text-white'
                          : 'text-black/50 bg-black/5'
                      }`}
                      style={
                        editStatus === s.value
                          ? { backgroundColor: s.color }
                          : undefined
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm text-black/40 mb-1.5">描述</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  placeholder="添加描述..."
                  className="w-full text-base text-black bg-black/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30 resize-none placeholder:text-black/20"
                />
              </div>

              {/* 优先级 */}
              <div>
                <label className="block text-sm text-black/40 mb-1.5">优先级</label>
                <div className="flex gap-2">
                  {[
                    { value: '', label: '无', color: '#999' },
                    { value: 'high', label: '紧急', color: '#E74C3C' },
                    { value: 'medium', label: '重要', color: '#F39C12' },
                    { value: 'low', label: '一般', color: '#58A968' },
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setEditPriority(p.value)}
                      className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                        editPriority === p.value
                          ? 'text-white'
                          : 'text-black/50 bg-black/5'
                      }`}
                      style={
                        editPriority === p.value
                          ? { backgroundColor: p.color }
                          : undefined
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 计划开始时间 */}
              <div>
                <label className="block text-sm text-black/40 mb-1.5">计划开始</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editScheduledAt.split('T')[0] || ''}
                    onChange={(e) => {
                      const time = editScheduledAt.split('T')[1] || '';
                      setEditScheduledAt(e.target.value ? `${e.target.value}T${time || '00:00'}` : '');
                    }}
                    className="date-input flex-1 text-base text-black bg-black/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30"
                  />
                  <input
                    type="time"
                    value={editScheduledAt.split('T')[1] || ''}
                    onChange={(e) => {
                      const date = editScheduledAt.split('T')[0] || '';
                      if (date) setEditScheduledAt(`${date}T${e.target.value || '00:00'}`);
                    }}
                    className="time-input w-32 text-base text-black bg-black/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30"
                  />
                </div>
              </div>

              {/* 截止时间 */}
              <div>
                <label className="block text-sm text-black/40 mb-1.5">截止时间</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editDeadline.split('T')[0] || ''}
                    onChange={(e) => {
                      const time = editDeadline.split('T')[1] || '';
                      setEditDeadline(e.target.value ? `${e.target.value}T${time || '00:00'}` : '');
                    }}
                    className="date-input flex-1 text-base text-black bg-black/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30"
                  />
                  <input
                    type="time"
                    value={editDeadline.split('T')[1] || ''}
                    onChange={(e) => {
                      const date = editDeadline.split('T')[0] || '';
                      if (date) setEditDeadline(`${date}T${e.target.value || '00:00'}`);
                    }}
                    className="time-input w-32 text-base text-black bg-black/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30"
                  />
                </div>
              </div>

              {/* 预估耗时 */}
              <div>
                <label className="block text-sm text-black/40 mb-1.5">预估耗时（分钟）</label>
                <input
                  type="number"
                  min="0"
                  value={editEstimatedMinutes}
                  onChange={(e) => setEditEstimatedMinutes(e.target.value)}
                  placeholder="如 30"
                  className="w-full text-base text-black bg-black/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30 placeholder:text-black/20"
                />
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm text-black/40 mb-1.5">备注</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="添加备注..."
                  className="w-full text-base text-black bg-black/5 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30 resize-none placeholder:text-black/20"
                />
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm text-black/40 mb-1.5">标签</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editTags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/5 text-sm text-black/70"
                    >
                      {tag}
                      <button
                        onClick={() => setEditTags(editTags.filter((_, j) => j !== i))}
                        className="text-black/30 hover:text-black/60 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editNewTagInput}
                    onChange={(e) => setEditNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editNewTagInput.trim()) {
                        e.preventDefault();
                        const tag = editNewTagInput.trim();
                        if (!editTags.includes(tag)) {
                          setEditTags([...editTags, tag]);
                        }
                        setEditNewTagInput('');
                      }
                    }}
                    placeholder="输入标签，回车添加"
                    className="flex-1 text-sm text-black bg-black/5 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30 placeholder:text-black/20"
                  />
                </div>
              </div>

              {/* 属性加成 */}
              <div>
                <label className="block text-sm text-black/40 mb-2">属性加成</label>
                <div className="grid grid-cols-3 gap-3">
                  {SKILL_ORDER.map((skillId) => {
                    const info = SKILL_COLORS[skillId];
                    return (
                      <div key={skillId} className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2.5">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: info.hex }}
                        />
                        <span className="text-sm text-black/50 shrink-0">{info.name}</span>
                        <input
                          type="number"
                          min="0"
                          value={editSkillXps[skillId] || ''}
                          onChange={(e) => setEditSkillXps(prev => ({
                            ...prev,
                            [skillId]: parseInt(e.target.value) || 0,
                          }))}
                          placeholder="0"
                          className="w-12 text-sm text-black bg-transparent text-center focus:outline-none placeholder:text-black/20"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 状态信息 */}
              <div className="flex gap-4 text-sm text-black/40 pt-2">
                <span>创建: {formatDateTime(selectedTask.created_at)}</span>
                {selectedTask.completed_at && (
                  <span>完成: {formatDateTime(selectedTask.completed_at)}</span>
                )}
              </div>

              {/* 子任务 */}
              <div>
                <label className="block text-sm text-black/40 mb-2">子任务</label>
                {detailSubtasks.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {detailSubtasks.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center gap-3 bg-black/3 rounded-xl px-3 py-2.5 group"
                      >
                        <button
                          onClick={async () => {
                            if (sub.status !== 'completed') {
                              await completeTask(sub.id);
                              const subs = await fetchSubtasks(selectedTask.id);
                              setDetailSubtasks(subs);
                            }
                          }}
                          className="flex-shrink-0"
                        >
                          {sub.status === 'completed'
                            ? <Check size={14} className="text-[#58A968]" />
                            : <Circle size={14} className="text-black/20" />}
                        </button>
                        <span className={`flex-1 text-sm truncate ${sub.status === 'completed' ? 'text-black/40 line-through' : 'text-black/70'}`}>
                          {sub.title}
                        </span>
                        <button
                          onClick={async () => {
                            await deleteTask(sub.id);
                            setDetailSubtasks(detailSubtasks.filter((s) => s.id !== sub.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-black/20 hover:text-red-400"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
                    placeholder="添加子任务..."
                    className="flex-1 text-sm text-black bg-black/5 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#58A968]/30 placeholder:text-black/20"
                  />
                  <button
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      newSubtaskTitle.trim()
                        ? 'bg-[#58A968] text-white hover:bg-[#4a9458]'
                        : 'bg-black/5 text-black/20 cursor-not-allowed'
                    }`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* 底部操作 */}
            <div className="p-6 border-t border-black/8 space-y-3">
              {/* 保存按钮 */}
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-2xl bg-[#58A968] text-white text-base font-medium hover:bg-[#4a9458] transition-colors flex items-center justify-center gap-2"
              >
                <Pencil size={16} />
                保存修改
              </button>

              <div className="flex gap-3">
                {/* 完成 / 取消完成 */}
                {selectedTask.status !== 'completed' ? (
                  <button
                    onClick={handleCompleteFromDetail}
                    className="flex-1 py-3 rounded-2xl bg-[#2A8CB7] text-white text-base hover:bg-[#237aa3] transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    完成任务 +XP
                  </button>
                ) : (
                  <button
                    onClick={handleUncompleteFromDetail}
                    className="flex-1 py-3 rounded-2xl bg-[#F39C12] text-white text-base hover:bg-[#e08e10] transition-colors flex items-center justify-center gap-2"
                  >
                    <Circle size={16} />
                    取消完成 -XP
                  </button>
                )}

                {/* 删除按钮 */}
                <button
                  onClick={handleDeleteFromDetail}
                  className="flex-1 py-3 rounded-2xl bg-red-50 text-red-500 text-base hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 左下角熊猫 - 任务推荐 */}
      <div className="absolute bottom-6 left-8 z-10 flex items-end gap-3">
        <button
          onClick={() => {
            const best = recommendTask(tasks, weights);
            if (best) {
              const s = scoreTask(best, weights);
              setPandaTip(`推荐「${best.title}」（评分 ${(s * 100).toFixed(0)}）`);
              setTimeout(() => setPandaTip(''), 4000);
            } else {
              setPandaTip('暂无可推荐的任务');
              setTimeout(() => setPandaTip(''), 2000);
            }
          }}
          className="opacity-60 hover:opacity-100 transition-opacity"
          title="推荐最优任务"
        >
          <img
            src="/assets/CodeBuddyAssets/47_57/10.png"
            alt="推荐任务"
            className="w-[180px] h-auto object-contain"
          />
        </button>
        {pandaTip && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg text-sm text-black/70 max-w-[280px] mb-6 relative">
            {pandaTip}
            <div className="absolute left-[-6px] bottom-3 w-3 h-3 bg-white/90 rotate-45" />
          </div>
        )}
      </div>

      {/* 右下角加号按钮 */}
      {!multiSelectMode && (
        <button
          onClick={openCreate}
          className="fixed bottom-8 right-8 z-30 w-14 h-14 rounded-full bg-[#58A968] text-white shadow-lg hover:bg-[#4a9458] hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* 批量操作栏 */}
      {multiSelectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-black/10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="max-w-[1000px] mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (selectedIds.size === filteredTasks.length) {
                    setSelectedIds(new Set());
                  } else {
                    setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
                  }
                }}
                className="text-sm text-black/50 hover:text-black/70 transition-colors"
              >
                {selectedIds.size === filteredTasks.length ? '取消全选' : '全选'}
              </button>
              <span className="text-sm text-black/30">已选 {selectedIds.size} 项</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBatchComplete}
                disabled={selectedIds.size === 0}
                className={`px-5 py-2.5 rounded-full text-sm transition-all ${
                  selectedIds.size > 0
                    ? 'bg-[#2A8CB7] text-white hover:bg-[#237aa3]'
                    : 'bg-black/5 text-black/20 cursor-not-allowed'
                }`}
              >
                批量完成
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
                className={`px-5 py-2.5 rounded-full text-sm transition-all ${
                  selectedIds.size > 0
                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                    : 'bg-black/5 text-black/20 cursor-not-allowed'
                }`}
              >
                批量删除
              </button>
              <button
                onClick={() => {
                  setMultiSelectMode(false);
                  setSelectedIds(new Set());
                }}
                className="px-5 py-2.5 rounded-full text-sm bg-black/5 text-black/50 hover:bg-black/10 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-black/80 text-white px-6 py-3 rounded-2xl shadow-lg text-sm max-w-[500px]">
          {toast}
        </div>
      )}

      {/* 滑入动画 + 日期输入样式 */}
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
        /* 日期/时间输入框美化 */
        .date-input, .time-input {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: inherit;
          color: inherit;
          cursor: pointer;
        }
        .date-input::-webkit-calendar-picker-indicator,
        .time-input::-webkit-calendar-picker-indicator {
          opacity: 0.4;
          cursor: pointer;
          filter: grayscale(1);
        }
        .date-input::-webkit-calendar-picker-indicator:hover,
        .time-input::-webkit-calendar-picker-indicator:hover {
          opacity: 0.7;
        }
        .date-input::-webkit-datetime-edit,
        .time-input::-webkit-datetime-edit {
          color: inherit;
        }
        .date-input::-webkit-datetime-edit-fields-wrapper,
        .time-input::-webkit-datetime-edit-fields-wrapper {
          padding: 0;
        }
        .date-input::-webkit-datetime-edit-text,
        .time-input::-webkit-datetime-edit-text {
          color: rgba(0,0,0,0.25);
          padding: 0 1px;
        }
        .date-input::-webkit-datetime-edit-month-field,
        .date-input::-webkit-datetime-edit-day-field,
        .date-input::-webkit-datetime-edit-year-field,
        .time-input::-webkit-datetime-edit-hour-field,
        .time-input::-webkit-datetime-edit-minute-field {
          color: inherit;
        }
      `}</style>
    </div>
  );
}
