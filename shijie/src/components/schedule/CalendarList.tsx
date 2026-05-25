import { useCalendarStore } from '@/stores/calendarStore';
import { usePageTheme } from '@/hooks/usePageTheme';
import { Settings } from 'lucide-react';

interface CalendarListProps {
  onRefresh?: () => void;
  onManage?: () => void;
}

export function CalendarList({ onRefresh, onManage }: CalendarListProps) {
  const t = usePageTheme('schedule');
  const { calendars, visibleCalendarIds, toggleCalendar } = useCalendarStore();

  const allVisible = calendars.length > 0 && calendars.every((c) => visibleCalendarIds.has(c.id));

  const handleToggleAll = () => {
    const store = useCalendarStore.getState();
    store.setAllVisible(!allVisible);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 全部开关 */}
      <button
        onClick={handleToggleAll}
        className="min-w-[48px] px-3 py-1.5 rounded-full text-sm font-light tracking-wider transition-all"
        style={{
          backgroundColor: allVisible ? t.accent : `${t.accent}4D`,
          color: allVisible ? t.cardText : t.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
          boxShadow: allVisible ? '0 4px 6px -1px rgba(0,0,0,0.1)' : undefined,
        }}
      >
        全部
      </button>

      {/* 各日历勾选 */}
      {calendars.map((cal) => {
        const isVisible = visibleCalendarIds.has(cal.id);
        return (
          <button
            key={cal.id}
            onClick={() => {
              toggleCalendar(cal.id);
              onRefresh?.();
            }}
            className="flex items-center gap-1.5 min-w-[48px] px-3 py-1.5 rounded-full text-sm font-light tracking-wider transition-all"
            style={{
              backgroundColor: isVisible ? cal.color : `${cal.color}4D`,
              color: isVisible ? '#fff' : t.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              boxShadow: isVisible ? '0 4px 6px -1px rgba(0,0,0,0.1)' : undefined,
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: isVisible ? '#fff' : cal.color }}
            />
            {cal.name}
          </button>
        );
      })}

      {/* 管理按钮 */}
      <button
        onClick={onManage}
        className="px-2 py-1.5 rounded-full text-sm transition-all hover:opacity-80"
        style={{ color: `${t.cardText}99` }}
        title="管理日历"
      >
        <Settings size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
