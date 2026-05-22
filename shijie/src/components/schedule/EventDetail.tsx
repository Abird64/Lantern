import { useState } from 'react';
import type { Schedule, UpdateScheduleInput } from '@/types/schedule';

interface EventDetailProps {
  event: Schedule;
  onUpdate: (id: string, input: UpdateScheduleInput) => void;
  onDelete: (id: string) => void;
  /** 编辑重复事件的单次实例：baseId, dateStr, 修改内容 */
  onUpdateInstance?: (baseId: string, dateStr: string, input: UpdateScheduleInput) => void;
  /** 删除重复事件的单次实例：baseId, dateStr */
  onDeleteInstance?: (baseId: string, dateStr: string) => void;
  onClose: () => void;
}

const categories = [
  { id: '课表', color: '#3A8FB7' },
  { id: '学习', color: '#4A90D9' },
  { id: '娱乐', color: '#D4A843' },
  { id: '工作', color: '#58A968' },
  { id: '生活', color: '#D98B58' },
];

function toLocalDatetime(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 判断是否为重复事件的展开实例（ID 格式: {baseId}_{YYYY-MM-DD}） */
function parseRecurringInstanceId(id: string): { baseId: string; dateStr: string } | null {
  // nanoid 不含下划线，所以最后一个 _ 后面是日期
  const lastUnderscore = id.lastIndexOf('_');
  if (lastUnderscore <= 0) return null;

  const baseId = id.substring(0, lastUnderscore);
  const dateStr = id.substring(lastUnderscore + 1);

  // 验证日期格式 YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { baseId, dateStr };
  }
  return null;
}

type EditScope = 'this' | 'all';

export function EventDetail({ event, onUpdate, onDelete, onUpdateInstance, onDeleteInstance, onClose }: EventDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [startAt, setStartAt] = useState(toLocalDatetime(event.start_at));
  const [endAt, setEndAt] = useState(event.end_at ? toLocalDatetime(event.end_at) : '');
  const [category, setCategory] = useState(event.category || '生活');
  const [location, setLocation] = useState(event.location || '');
  const [description, setDescription] = useState(event.description || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showScopeChoice, setShowScopeChoice] = useState<'edit' | 'delete' | null>(null);

  const isTaskSync = event.source_type === 'task_sync';
  const bgColor = event.color || '#F2C94C';

  // 判断是否为重复事件实例
  const recurringInfo = parseRecurringInstanceId(event.id);
  const isRecurringInstance = recurringInfo !== null && !event.rrule;

  const handleSave = (scope?: EditScope) => {
    const input: UpdateScheduleInput = {
      title: title.trim(),
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : undefined,
      category,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
    };

    if (isRecurringInstance && scope === 'this' && onUpdateInstance && recurringInfo) {
      // 只修改这一次：添加 exdate 到父事件，创建独立事件
      onUpdateInstance(recurringInfo.baseId, recurringInfo.dateStr, input);
    } else {
      // 修改所有（或非重复事件）
      const targetId = isRecurringInstance && recurringInfo ? recurringInfo.baseId : event.id;
      onUpdate(targetId, input);
    }
    setIsEditing(false);
  };

  const handleEditClick = () => {
    if (isRecurringInstance) {
      setShowScopeChoice('edit');
    } else {
      setIsEditing(true);
    }
  };

  const handleScopeChoice = (scope: EditScope) => {
    setShowScopeChoice(null);
    if (showScopeChoice === 'edit') {
      if (scope === 'this' && onUpdateInstance) {
        // 单次编辑：直接进入编辑模式，保存时再处理
        setIsEditing(true);
        // 标记当前编辑模式
        setEditScope('this');
      } else {
        // 编辑所有：用 baseId 进入编辑
        setIsEditing(true);
        setEditScope('all');
      }
    } else if (showScopeChoice === 'delete') {
      if (scope === 'this' && onDeleteInstance && recurringInfo) {
        onDeleteInstance(recurringInfo.baseId, recurringInfo.dateStr);
      } else {
        const targetId = isRecurringInstance && recurringInfo ? recurringInfo.baseId : event.id;
        onDelete(targetId);
      }
      setShowDeleteConfirm(false);
    }
  };

  const [editScope, setEditScope] = useState<EditScope>('all');

  const handleDeleteClick = () => {
    if (isRecurringInstance) {
      setShowScopeChoice('delete');
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleDelete = () => {
    onDelete(event.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-[#F8F5F0] rounded-2xl p-6 w-[400px] shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: bgColor }}
            />
            <span className="text-xs text-[#1A1A1A]/50">
              {isTaskSync ? '任务同步' : event.category || '日程'}
            </span>
            {isRecurringInstance && (
              <span className="text-[10px] bg-[#F2C94C]/30 text-[#1A1A1A]/60 px-1.5 py-0.5 rounded-full">
                重复
              </span>
            )}
          </div>
          {!isTaskSync && (
            <button
              onClick={handleEditClick}
              className="text-xs text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors"
            >
              {isEditing ? '取消' : '编辑'}
            </button>
          )}
        </div>

        {isEditing ? (
          /* 编辑模式 */
          <div className="space-y-4">
            {isRecurringInstance && editScope === 'this' && (
              <div className="text-[10px] text-[#1A1A1A]/50 bg-[#F2C94C]/10 rounded-lg px-3 py-1.5">
                仅修改 {recurringInfo?.dateStr} 这一天的实例
              </div>
            )}
            {isRecurringInstance && editScope === 'all' && (
              <div className="text-[10px] text-[#1A1A1A]/50 bg-[#F2C94C]/10 rounded-lg px-3 py-1.5">
                修改所有重复实例
              </div>
            )}

            {/* 标题 */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-[#D4A017]/30 text-[#1A1A1A] focus:outline-none focus:border-[#F2C94C] text-sm"
              autoFocus
            />

            {/* 时间 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#1A1A1A]/50 mb-1 block">开始</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/60 border border-[#D4A017]/30 text-[#1A1A1A] focus:outline-none focus:border-[#F2C94C] text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#1A1A1A]/50 mb-1 block">结束</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/60 border border-[#D4A017]/30 text-[#1A1A1A] focus:outline-none focus:border-[#F2C94C] text-sm"
                />
              </div>
            </div>

            {/* 分类 */}
            <div>
              <label className="text-xs text-[#1A1A1A]/50 mb-2 block">分类</label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      category === cat.id
                        ? 'text-white shadow-md'
                        : 'text-[#1A1A1A]/70 bg-white/40 hover:bg-white/60'
                    }`}
                    style={category === cat.id ? { backgroundColor: cat.color } : undefined}
                  >
                    {cat.id}
                  </button>
                ))}
              </div>
            </div>

            {/* 地点 */}
            <div>
              <label className="text-xs text-[#1A1A1A]/50 mb-1 block">地点</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="可选"
                className="w-full px-4 py-2 rounded-xl bg-white/60 border border-[#D4A017]/30 text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#F2C94C] text-sm"
              />
            </div>

            {/* 描述 */}
            <div>
              <label className="text-xs text-[#1A1A1A]/50 mb-1 block">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="可选"
                rows={3}
                className="w-full px-4 py-2 rounded-xl bg-white/60 border border-[#D4A017]/30 text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#F2C94C] text-sm resize-none"
              />
            </div>

            {/* 按钮 */}
            <div className="flex justify-between pt-2">
              <button
                onClick={handleDeleteClick}
                className="px-4 py-2 rounded-full text-sm text-red-500/70 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                删除
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => { setIsEditing(false); setEditScope('all'); }}
                  className="px-4 py-2 rounded-full text-sm text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/5 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleSave(editScope)}
                  disabled={!title.trim()}
                  className="px-4 py-2 rounded-full text-sm bg-[#F2C94C] text-[#1A1A1A] hover:bg-[#F2C94C]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 查看模式 */
          <div className="space-y-4">
            {/* 标题 */}
            <h2 className="text-xl font-medium text-[#1A1A1A]">{event.title}</h2>

            {/* 时间 */}
            <div className="flex items-center gap-2 text-sm text-[#1A1A1A]/70">
              <span>{formatDateTime(event.start_at)}</span>
              {event.end_at && (
                <>
                  <span>→</span>
                  <span>{formatDateTime(event.end_at)}</span>
                </>
              )}
            </div>

            {/* 地点 */}
            {event.location && (
              <div className="text-sm text-[#1A1A1A]/70">
                📍 {event.location}
              </div>
            )}

            {/* 描述 */}
            {event.description && (
              <div className="text-sm text-[#1A1A1A]/70 bg-white/40 rounded-xl p-3">
                {event.description}
              </div>
            )}

            {/* 重复规则 */}
            {event.rrule && (
              <div className="text-xs text-[#1A1A1A]/50 bg-white/30 rounded-lg px-3 py-2">
                重复: {event.rrule}
              </div>
            )}

            {/* 关闭按钮 */}
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full text-sm bg-[#F2C94C] text-[#1A1A1A] hover:bg-[#F2C94C]/80 transition-colors shadow-md"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {/* 重复事件范围选择 */}
        {showScopeChoice && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
            <div className="bg-[#F8F5F0] rounded-2xl p-5 w-[300px] shadow-2xl">
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-3">
                {showScopeChoice === 'edit' ? '编辑范围' : '删除范围'}
              </h3>
              <p className="text-sm text-[#1A1A1A]/70 mb-4">
                这是一个重复事件，你想{showScopeChoice === 'edit' ? '修改' : '删除'}哪个范围？
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleScopeChoice('this')}
                  className="w-full px-4 py-3 rounded-xl text-sm text-left bg-white/60 hover:bg-white/80 border border-[#D4A017]/20 transition-colors"
                >
                  <div className="font-medium text-[#1A1A1A]">只{showScopeChoice === 'edit' ? '修改' : '删除'}这一次</div>
                  <div className="text-[10px] text-[#1A1A1A]/50 mt-0.5">
                    仅影响 {recurringInfo?.dateStr} 这一天
                  </div>
                </button>
                <button
                  onClick={() => handleScopeChoice('all')}
                  className="w-full px-4 py-3 rounded-xl text-sm text-left bg-white/60 hover:bg-white/80 border border-[#D4A017]/20 transition-colors"
                >
                  <div className="font-medium text-[#1A1A1A]">{showScopeChoice === 'edit' ? '修改' : '删除'}所有实例</div>
                  <div className="text-[10px] text-[#1A1A1A]/50 mt-0.5">
                    影响整个重复事件系列
                  </div>
                </button>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowScopeChoice(null)}
                  className="px-4 py-2 rounded-full text-sm text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/5 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认（非重复事件） */}
        {showDeleteConfirm && !isRecurringInstance && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
            <div className="bg-[#F8F5F0] rounded-2xl p-5 w-[300px] shadow-2xl">
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-3">确认删除</h3>
              <p className="text-sm text-[#1A1A1A]/70 mb-4">
                确定要删除「{event.title}」吗？
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-full text-sm text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/5 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-full text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
