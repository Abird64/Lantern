import { useRef, useState } from 'react';
import type { Schedule } from '@/types/schedule';
import { usePageTheme } from '@/hooks/usePageTheme';


interface EventBlockProps {
  event: Schedule;
  top: number;       // 百分比 0-100
  height: number;    // 百分比
  left: number;      // 百分比
  width: number;     // 百分比
  onClick: (event: Schedule) => void;
  onDragStart?: (event: Schedule, startY: number) => void;
}

export function EventBlock({ event, top, height, left, width, onClick, onDragStart }: EventBlockProps) {
  const t = usePageTheme('schedule');
  const isTaskSync = event.source_type === 'task_sync';
  const bgColor = event.color || t.accent;
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
        width: `${width}%`,
        backgroundColor: isTaskSync ? 'transparent' : bgColor,
        border: isTaskSync ? `2px dashed ${bgColor}` : `1px solid ${t.cardText}14`,
        boxShadow: isDragging ? `0 4px 12px ${t.cardText}33` : `0 1px 3px ${t.cardText}1A`,
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
