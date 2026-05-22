import { useRef, useState } from 'react';
import type { Schedule } from '@/types/schedule';

interface EventBlockProps {
  event: Schedule;
  top: number;       // 百分比 0-100
  height: number;    // 百分比
  left: number;      // 百分比
  width: number;     // 百分比
  onClick: (event: Schedule) => void;
  onDragStart?: (event: Schedule, startY: number) => void;
}

const HOUR_START = 0;
const HOUR_END = 24;

// 夜间压缩配置（与 WeekView 保持一致）
const NIGHT_END = 7;
const NIGHT_RATIO = 0.1;
const DAY_RATIO = 0.9;

/** 将小时转换为显示位置的百分比（考虑夜间压缩） */
function hourToPercent(hour: number): number {
  if (hour <= NIGHT_END) {
    return (hour / NIGHT_END) * NIGHT_RATIO * 100;
  } else {
    const dayProgress = (hour - NIGHT_END) / (HOUR_END - NIGHT_END);
    return (NIGHT_RATIO + dayProgress * DAY_RATIO) * 100;
  }
}

function timeToPercent(timeStr: string): number {
  const date = new Date(timeStr);
  const hours = date.getHours() + date.getMinutes() / 60;
  return hourToPercent(hours);
}

export function EventBlock({ event, top, height, left, width, onClick, onDragStart }: EventBlockProps) {
  const isTaskSync = event.source_type === 'task_sync';
  const bgColor = event.color || '#F2C94C';
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ y: number; time: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTaskSync || !onDragStart) return;

    e.preventDefault(); // 阻止浏览器原生文字选择/拖拽
    dragStartRef.current = {
      y: e.clientY,
      time: Date.now(),
    };
    setIsDragging(false);

    const handleMouseMove = (moveE: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaY = Math.abs(moveE.clientY - dragStartRef.current.y);
      const deltaTime = Date.now() - dragStartRef.current.time;

      // 移动超过 5px 或持续超过 200ms 才认为是拖拽
      if (deltaY > 5 || deltaTime > 200) {
        setIsDragging(true);
        onDragStart(event, moveE.clientY);
      }
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      // 延迟重置 isDragging，让 click 事件能正确判断
      setTimeout(() => setIsDragging(false), 10);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = () => {
    if (!isDragging) {
      onClick(event);
    }
  };

  return (
    <div
      className={`absolute rounded-lg overflow-hidden transition-opacity select-none ${isTaskSync ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
      style={{
        top: `${top}%`,
        height: `${Math.max(height, 2)}%`,
        left: `${left}%`,
        width: `${width - 1}%`,
        backgroundColor: isTaskSync ? 'transparent' : bgColor,
        border: isTaskSync ? `2px dashed ${bgColor}` : `1px solid rgba(0,0,0,0.08)`,
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
        opacity: isTaskSync ? 0.7 : isDragging ? 0.8 : 1,
        zIndex: isDragging ? 100 : 10,
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div className="px-1.5 py-0.5 h-full flex flex-col overflow-hidden">
        <span
          className="text-xs font-medium leading-tight truncate"
          style={{ color: isTaskSync ? bgColor : getContrastColor(bgColor) }}
        >
          {event.title}
        </span>
        {height > 6 && (
          <span
            className="text-[10px] leading-tight truncate mt-0.5"
            style={{ color: isTaskSync ? bgColor : getContrastColor(bgColor), opacity: 0.7 }}
          >
            {formatTimeRange(event.start_at, event.end_at)}
          </span>
        )}
      </div>
    </div>
  );
}

/** 计算事件在周视图中的位置 */
export function getEventPosition(event: Schedule, dayIndex: number, totalColumns: number) {
  const top = timeToPercent(event.start_at);
  let height: number;
  if (event.end_at) {
    const endPercent = timeToPercent(event.end_at);
    height = endPercent - top;
  } else {
    height = (1 / HOUR_SPAN) * 100; // 默认 1 小时
  }

  const colWidth = 100 / 7; // 每列占总宽度的 1/7
  const left = dayIndex * colWidth;

  return { top, height, left, width: colWidth };
}

/** 检测重叠事件并分配列 */
export function layoutEvents(events: Schedule[], dayIndex: number): { event: Schedule; col: number; totalCols: number }[] {
  const colWidth = 100 / 7;
  const dayStart = new Date(events[0]?.start_at || new Date().toISOString());
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // 过滤出这天的事件
  const dayEvents = events.filter((e) => {
    const d = new Date(e.start_at);
    return d >= dayStart && d < dayEnd;
  });

  if (dayEvents.length === 0) return [];

  // 按开始时间排序
  dayEvents.sort((a, b) => a.start_at.localeCompare(b.start_at));

  // 贪心分栏
  const columns: { endTime: string; events: Schedule[] }[] = [];

  for (const event of dayEvents) {
    let placed = false;
    for (const col of columns) {
      if (event.start_at >= col.endTime) {
        col.events.push(event);
        col.endTime = event.end_at || event.start_at;
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push({
        endTime: event.end_at || event.start_at,
        events: [event],
      });
    }
  }

  // 构建结果
  const result: { event: Schedule; col: number; totalCols: number }[] = [];
  const totalCols = columns.length;

  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    for (const event of columns[colIdx].events) {
      result.push({ event, col: colIdx, totalCols });
    }
  }

  return result;
}

function formatTimeRange(start: string, end: string | null): string {
  const startDate = new Date(start);
  const s = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
  if (!end) return s;
  const endDate = new Date(end);
  const e = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  return `${s} - ${e}`;
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1A1A1A' : '#FFFFFF';
}
