import type { Schedule } from '@/types/schedule';

interface AgendaViewProps {
  schedules: Schedule[];
  onEventClick: (event: Schedule) => void;
}

const weekDayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function AgendaView({ schedules, onEventClick }: AgendaViewProps) {
  // 按日期分组
  const groupedByDay = new Map<string, Schedule[]>();

  for (const event of schedules) {
    const date = new Date(event.start_at);
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    if (!groupedByDay.has(dateKey)) {
      groupedByDay.set(dateKey, []);
    }
    groupedByDay.get(dateKey)!.push(event);
  }

  // 排序日期
  const sortedDates = Array.from(groupedByDay.keys()).sort();

  // 今天
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  if (sortedDates.length === 0) {
    return (
      <div className="w-full bg-[#F8F5F0] rounded-2xl p-8 text-center">
        <p className="text-[#1A1A1A]/40 text-lg">暂无日程</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F8F5F0] rounded-2xl overflow-hidden">
      {sortedDates.map((dateKey) => {
        const events = groupedByDay.get(dateKey)!;
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const isToday = dateKey === todayKey;
        const weekDay = weekDayNames[date.getDay()];

        return (
          <div key={dateKey}>
            {/* 日期标题 */}
            <div className={`flex items-center gap-3 px-5 py-3 ${isToday ? 'bg-[#F2C94C]/10' : 'border-b border-[#D4A017]/10'}`}>
              <span className={`text-sm font-medium ${isToday ? 'text-[#F2C94C]' : 'text-[#1A1A1A]/60'}`}>
                {month}月{day}日
              </span>
              <span className={`text-xs ${isToday ? 'text-[#F2C94C]/70' : 'text-[#1A1A1A]/40'}`}>
                {weekDay}
              </span>
              {isToday && (
                <span className="text-[10px] bg-[#F2C94C] text-[#1A1A1A] px-2 py-0.5 rounded-full">
                  今天
                </span>
              )}
            </div>

            {/* 事件列表 */}
            <div className="divide-y divide-[#D4A017]/5">
              {events.map((event) => {
                const startDate = new Date(event.start_at);
                const bgColor = event.color || '#F2C94C';
                const isTaskSync = event.source_type === 'task_sync';

                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[#F2C94C]/5 transition-colors"
                    onClick={() => onEventClick(event)}
                  >
                    {/* 时间 */}
                    <div className="w-16 text-right flex-shrink-0">
                      <span className="text-sm text-[#1A1A1A]/70">
                        {pad(startDate.getHours())}:{pad(startDate.getMinutes())}
                      </span>
                    </div>

                    {/* 颜色条 */}
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: isTaskSync ? 'transparent' : bgColor,
                        borderLeft: isTaskSync ? `2px dashed ${bgColor}` : 'none',
                      }}
                    />

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm truncate ${isTaskSync ? 'text-[#1A1A1A]/60' : 'text-[#1A1A1A]'}`}>
                          {event.title}
                        </span>
                        {event.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4A017]/10 text-[#1A1A1A]/50 flex-shrink-0">
                            {event.category}
                          </span>
                        )}
                      </div>
                      {event.end_at && (
                        <span className="text-xs text-[#1A1A1A]/40">
                          {formatTimeRange(event.start_at, event.end_at)}
                        </span>
                      )}
                      {event.location && (
                        <span className="text-xs text-[#1A1A1A]/40 ml-2">
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatTimeRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${pad(s.getHours())}:${pad(s.getMinutes())} - ${pad(e.getHours())}:${pad(e.getMinutes())}`;
}
