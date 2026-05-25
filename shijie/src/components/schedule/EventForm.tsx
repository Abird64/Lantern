import { useState } from 'react';
import { usePageTheme } from '@/hooks/usePageTheme';
import { useCalendarStore } from '@/stores/calendarStore';
import type { CreateScheduleInput } from '@/types/schedule';

interface EventFormProps {
  defaultStart?: string;
  defaultEnd?: string;
  onSubmit: (input: CreateScheduleInput) => void;
  onCancel: () => void;
}

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
  const t = usePageTheme('schedule');
  const { calendars } = useCalendarStore();
  const [title, setTitle] = useState('');
  const defaultStartVal = defaultStart ? toLocalDatetime(defaultStart) : toLocalDatetime(new Date().toISOString());
  const [startAt, setStartAt] = useState(defaultStartVal);
  const [endAt, setEndAt] = useState(
    defaultEnd ? toLocalDatetime(defaultEnd) : addMinutes(defaultStartVal, 40)
  );
  const [calendarId, setCalendarId] = useState<string | null>(
    calendars.find((c) => c.is_default)?.id ?? calendars[0]?.id ?? null
  );
  const [repeat, setRepeat] = useState('none');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
  const [isCancelHovered, setIsCancelHovered] = useState(false);

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

    const rrule = buildRrule(repeat, selectedDays);

    onSubmit({
      title: title.trim(),
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : undefined,
      calendar_id: calendarId ?? undefined,
      source_type: 'manual',
      rrule,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <style>{`
        .event-form-input::placeholder { color: ${t.cardText}4D; }
      `}</style>
      <div
        className="rounded-[28px] p-6 w-[380px] shadow-2xl"
        style={{ backgroundColor: t.card }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium mb-5 tracking-wider" style={{ color: t.cardText }}>新建日程</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 标题 */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="日程标题"
            className="event-form-input w-full px-4 py-3 rounded-2xl focus:outline-none text-sm"
            style={{
              color: t.cardText,
              border: `1px solid ${t.accent}4D`,
              backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            }}
            autoFocus
          />

          {/* 开始时间 */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: `${t.cardText}80` }}>开始时间</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => handleStartChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl focus:outline-none text-sm"
              style={{
                color: t.cardText,
                border: `1px solid ${t.accent}4D`,
                backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              }}
            />
          </div>

          {/* 结束时间 */}
          <div>
            <label className="text-xs mb-1 block" style={{ color: `${t.cardText}80` }}>结束时间</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl focus:outline-none text-sm"
              style={{
                color: t.cardText,
                border: `1px solid ${t.accent}4D`,
                backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              }}
            />
          </div>

          {/* 日历 */}
          <div>
            <label className="text-xs mb-2 block" style={{ color: `${t.cardText}80` }}>日历</label>
            <select
              value={calendarId ?? ''}
              onChange={(e) => setCalendarId(e.target.value || null)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                border: `1px solid ${t.accent}4D`,
                color: t.cardText,
              }}
            >
              <option value="">无分类</option>
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id} style={{ backgroundColor: t.card, color: t.cardText }}>
                  {cal.name}
                </option>
              ))}
            </select>
          </div>

          {/* 重复规则 */}
          <div>
            <label className="text-xs mb-2 block" style={{ color: `${t.cardText}80` }}>重复</label>
            <div className="flex gap-2 flex-wrap">
              {repeatOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRepeat(opt.id)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                    repeat === opt.id
                      ? 'shadow-md'
                      : 'hover:opacity-80'
                  }`}
                  style={
                    repeat === opt.id
                      ? { backgroundColor: t.accent, color: t.cardText }
                      : {
                          color: `${t.cardText}B2`,
                          backgroundColor: t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                        }
                  }
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
                        ? ''
                        : 'hover:opacity-80'
                    }`}
                    style={
                      selectedDays.includes(day.id)
                        ? { backgroundColor: t.accent, color: t.cardText }
                        : {
                            color: `${t.cardText}B2`,
                            backgroundColor: t.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                          }
                    }
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
              className="px-5 py-2 rounded-full text-sm transition-colors"
              style={{
                color: `${t.cardText}99`,
                backgroundColor: isCancelHovered ? `${t.cardText}0D` : 'transparent',
              }}
              onMouseEnter={() => setIsCancelHovered(true)}
              onMouseLeave={() => setIsCancelHovered(false)}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-full text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
              style={{ color: t.cardText, backgroundColor: isSubmitHovered ? `${t.accent}CC` : t.accent }}
              onMouseEnter={() => setIsSubmitHovered(true)}
              onMouseLeave={() => setIsSubmitHovered(false)}
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
