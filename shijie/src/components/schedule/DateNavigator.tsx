import { usePageTheme } from '@/hooks/usePageTheme';


interface DateNavigatorProps {
  weekLabel: string;
  onPrev?: () => void;
  onNext?: () => void;
  onToday: () => void;
  onImportIcs?: () => void;
}

export function DateNavigator({ weekLabel, onPrev, onNext, onToday, onImportIcs }: DateNavigatorProps) {
  const t = usePageTheme('schedule');
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {onPrev && (
          <button
            onClick={onPrev}
            className="w-9 h-9 rounded-full text-white/80 flex items-center justify-center transition-colors flex-shrink-0"
            style={{ backgroundColor: `${t.accent}4D` }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${t.accent}80`)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${t.accent}4D`)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <span className="text-white/85 text-base font-light tracking-wider min-w-[140px] text-center">
          {weekLabel}
        </span>
        {onNext && (
          <button
            onClick={onNext}
            className="w-9 h-9 rounded-full text-white/80 flex items-center justify-center transition-colors flex-shrink-0"
            style={{ backgroundColor: `${t.accent}4D` }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${t.accent}80`)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${t.accent}4D`)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <button
          onClick={onToday}
          className="ml-2 px-4 py-1.5 rounded-full text-white/80 text-sm font-light transition-colors flex-shrink-0"
          style={{ backgroundColor: `${t.accent}4D` }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${t.accent}80`)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${t.accent}4D`)}
        >
          今天
        </button>
      </div>
      <div className="flex items-center gap-2">
        {onImportIcs && (
          <button
            onClick={onImportIcs}
            className="px-3 py-1.5 rounded-full text-white/80 text-sm font-light transition-colors"
            style={{ backgroundColor: `${t.accent}4D` }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${t.accent}80`)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${t.accent}4D`)}
          >
            导入
          </button>
        )}
      </div>
    </div>
  );
}
