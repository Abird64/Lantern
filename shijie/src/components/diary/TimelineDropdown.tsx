import { useJournalStore } from '@/stores/journalStore';

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

  if (!showTimeline) return null;

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = getToday();

  // 构建日期格子
  const cells: Array<{ day: number; dateStr: string; hasEntry: boolean; isToday: boolean; isCurrent: boolean } | null> = [];

  // 前面的空格
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

  return (
    <div className="flex justify-center px-8">
      <div className="max-w-[1000px] flex-1">
        <div className="bg-[#E6D9B8] rounded-2xl p-4 shadow-lg mt-1">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-3 px-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="text-black/60 hover:text-black transition-colors text-lg font-zhuque"
            >
              ◀
            </button>
            <span className="font-zhuque text-lg text-black/80">
              {year}年{month}月
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="text-black/60 hover:text-black transition-colors text-lg font-zhuque"
            >
              ▶
            </button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-center text-sm font-zhuque text-black/40 py-1"
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
                    className={`
                      w-9 h-9 rounded-full flex items-center justify-center relative
                      font-zhuque text-sm transition-colors
                      ${cell.isCurrent
                        ? 'bg-[#2C3532] text-white'
                        : cell.isToday
                          ? 'bg-[#E65C5C]/20 text-[#E65C5C]'
                          : 'hover:bg-black/10 text-black/70'
                      }
                    `}
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
