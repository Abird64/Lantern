import { useJournalStore } from '@/stores/journalStore';
import { usePageTheme } from '@/hooks/usePageTheme';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TimelineDropdown() {
  const {
    timelineYear: year,
    timelineMonth: month,
    timelineEntries,
    showTimeline,
    navigateMonth,
    setCurrentDate,
    saveNow,
    toggleTimeline,
    currentDate,
  } = useJournalStore();

  const t = usePageTheme('diary');

  if (!showTimeline) return null;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = getToday();

  const cells: Array<{ day: number; dateStr: string; hasEntry: boolean; isToday: boolean; isCurrent: boolean } | null> = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      day: d,
      dateStr,
      hasEntry: timelineEntries.includes(dateStr),
      isToday: dateStr === today,
      isCurrent: dateStr === currentDate,
    });
  }

  const handleDayClick = async (dateStr: string) => {
    if (dateStr === currentDate) {
      toggleTimeline();
      return;
    }
    await saveNow();
    await setCurrentDate(dateStr);
    toggleTimeline();
  };

  const txt = t.cardText;
  const txtDim = txt + 'CC';
  const txtMid = txt + '80';
  const txtLight = txt + '4D';
  const txtBody = txt + 'B3';
  const hoverBg = txt + '1A';

  return (
    <div className="flex justify-center px-8">
      <div className="max-w-[1000px] flex-1">
        <div className="rounded-2xl p-4 shadow-lg mt-1" style={{ backgroundColor: t.card }}>
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-3 px-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="transition-colors text-lg font-zhuque"
              style={{ color: txtMid }}
              onMouseEnter={(e) => (e.currentTarget.style.color = txt)}
              onMouseLeave={(e) => (e.currentTarget.style.color = txtMid)}
            >
              ◀
            </button>
            <span className="font-zhuque text-lg" style={{ color: txtDim }}>
              {year}年{month}月
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="transition-colors text-lg font-zhuque"
              style={{ color: txtMid }}
              onMouseEnter={(e) => (e.currentTarget.style.color = txt)}
              onMouseLeave={(e) => (e.currentTarget.style.color = txtMid)}
            >
              ▶
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-center text-sm font-zhuque py-1"
                style={{ color: txtLight }}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => (
              <div key={i} className="flex items-center justify-center">
                {cell ? (
                  <button
                    onClick={() => handleDayClick(cell.dateStr)}
                    className="w-9 h-9 rounded-full flex items-center justify-center relative font-zhuque text-sm transition-colors"
                    style={
                      cell.isCurrent
                        ? { backgroundColor: '#2C3532', color: '#fff' }
                        : cell.isToday
                          ? { backgroundColor: '#E65C5C33', color: '#E65C5C' }
                          : { color: txtBody }
                    }
                    onMouseEnter={!cell.isCurrent && !cell.isToday ? (e) => (e.currentTarget.style.backgroundColor = hoverBg) : undefined}
                    onMouseLeave={!cell.isCurrent && !cell.isToday ? (e) => (e.currentTarget.style.backgroundColor = 'transparent') : undefined}
                  >
                    {cell.day}
                    {cell.hasEntry && !cell.isCurrent && (
                      <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#2C3532]/60" />
                    )}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
