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

  const btnBg = `${t.accent}4D`;
  const btnHoverBg = `${t.accent}80`;
  const textColor = t.cardText;

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {onPrev && (
          <button
            onClick={onPrev}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            style={{ backgroundColor: btnBg, color: textColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = btnHoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = btnBg)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <span className="text-base font-light tracking-wider min-w-[140px] text-center" style={{ color: textColor }}>
          {weekLabel}
        </span>
        {onNext && (
          <button
            onClick={onNext}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            style={{ backgroundColor: btnBg, color: textColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = btnHoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = btnBg)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <button
          onClick={onToday}
          className="ml-2 px-4 py-1.5 rounded-full text-sm font-light transition-colors flex-shrink-0"
          style={{ backgroundColor: btnBg, color: textColor }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = btnHoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = btnBg)}
        >
          今天
        </button>
      </div>
      <div className="flex items-center gap-2">
        {onImportIcs && (
          <button
            onClick={onImportIcs}
            className="px-3 py-1.5 rounded-full text-sm font-light transition-colors"
            style={{ backgroundColor: btnBg, color: textColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = btnHoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = btnBg)}
          >
            导入
          </button>
        )}
      </div>
    </div>
  );
}
