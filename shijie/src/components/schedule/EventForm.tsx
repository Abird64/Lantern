import { useState } from 'react';
import type { CreateScheduleInput } from '@/types/schedule';

interface EventFormProps {
  defaultStart?: string;
  defaultEnd?: string;
  onSubmit: (input: CreateScheduleInput) => void;
  onCancel: () => void;
}

const categories = [
  { id: '课表', color: '#3A8FB7' },
  { id: '学习', color: '#4A90D9' },
  { id: '娱乐', color: '#D4A843' },
  { id: '工作', color: '#58A968' },
  { id: '生活', color: '#D98B58' },
];

const repeatOptions = [
  { id: 'none', label: '不重复' },
  { id: 'daily', label: '每天' },
  { id: 'weekly', label: '每周' },
  { id: 'monthly', label: '每月' },
];

const weekDays = [
  { id: 'MO', label: '一' },
  { id: 'TU', label: '二' },
  { id: 'WE', label: '三' },
  { id: 'TH', label: '四' },
  { id: 'FR', label: '五' },
  { id: 'SA', label: '六' },
  { id: 'SU', label: '日' },
];

function toLocalDatetime(isoStr: string): string {
  const d = new Date(isoStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addMinutes(localDatetime: string, minutes: number): string {
  const d = new Date(localDatetime);
  d.setMinutes(d.getMinutes() + minutes);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildRrule(repeat: string, selectedDays: string[]): string | undefined {
  if (repeat === 'none') return undefined;
  if (repeat === 'daily') return 'FREQ=DAILY';
  if (repeat === 'monthly') return 'FREQ=MONTHLY';
  if (repeat === 'weekly') {
    if (selectedDays.length === 0) return 'FREQ=WEEKLY';
    return `FREQ=WEEKLY;BYDAY=${selectedDays.join(',')}`;
  }
  return undefined;
}

export function EventForm({ defaultStart, defaultEnd, onSubmit, onCancel }: EventFormProps) {
  const [title, setTitle] = useState('');
  const defaultStartVal = defaultStart ? toLocalDatetime(defaultStart) : toLocalDatetime(new Date().toISOString());
  const [startAt, setStartAt] = useState(defaultStartVal);
  const [endAt, setEndAt] = useState(
    defaultEnd ? toLocalDatetime(defaultEnd) : addMinutes(defaultStartVal, 40)
  );
  const [category, setCategory] = useState('生活');
  const [repeat, setRepeat] = useState('none');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // 开始时间变化时自动更新结束时间（+40 分钟）
  const handleStartChange = (val: string) => {
    setStartAt(val);
    setEndAt(addMinutes(val, 40));
  };

  // 切换星期选择
  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedCat = categories.find((c) => c.id === category);
    const rrule = buildRrule(repeat, selectedDays);

    onSubmit({
      title: title.trim(),
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : undefined,
      category,
      color: selectedCat?.color,
      source_type: 'manual',
      rrule,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-[#F8F5F0] rounded-[28px] p-6 w-[380px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium text-[#1A1A1A] mb-5 tracking-wider">新建日程</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 标题 */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="日程标题"
            className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-[#D4A017]/30 text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#F2C94C] text-sm"
            autoFocus
          />

          {/* 开始时间 */}
          <div>
            <label className="text-xs text-[#1A1A1A]/50 mb-1 block">开始时间</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => handleStartChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/60 border border-[#D4A017]/30 text-[#1A1A1A] focus:outline-none focus:border-[#F2C94C] text-sm"
            />
          </div>

          {/* 结束时间 */}
          <div>
            <label className="text-xs text-[#1A1A1A]/50 mb-1 block">结束时间</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/60 border border-[#D4A017]/30 text-[#1A1A1A] focus:outline-none focus:border-[#F2C94C] text-sm"
            />
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
                  className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                    category === cat.id
                      ? 'text-white shadow-md'
                      : 'text-[#1A1A1A]/70 bg-white/40 hover:bg-white/60'
                  }`}
                  style={
                    category === cat.id
                      ? { backgroundColor: cat.color }
                      : undefined
                  }
                >
                  {cat.id}
                </button>
              ))}
            </div>
          </div>

          {/* 重复规则 */}
          <div>
            <label className="text-xs text-[#1A1A1A]/50 mb-2 block">重复</label>
            <div className="flex gap-2 flex-wrap">
              {repeatOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRepeat(opt.id)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                    repeat === opt.id
                      ? 'bg-[#F2C94C] text-[#1A1A1A] shadow-md'
                      : 'text-[#1A1A1A]/70 bg-white/40 hover:bg-white/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 每周：选择星期 */}
            {repeat === 'weekly' && (
              <div className="flex gap-1.5 mt-3">
                {weekDays.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`w-8 h-8 rounded-full text-xs transition-all ${
                      selectedDays.includes(day.id)
                        ? 'bg-[#F2C94C] text-[#1A1A1A]'
                        : 'bg-white/40 text-[#1A1A1A]/70 hover:bg-white/60'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 rounded-full text-sm text-[#1A1A1A]/60 hover:bg-[#1A1A1A]/5 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-full text-sm bg-[#F2C94C] text-[#1A1A1A] hover:bg-[#F2C94C]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
