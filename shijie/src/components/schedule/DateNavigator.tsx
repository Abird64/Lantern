interface DateNavigatorProps {
  weekLabel: string;
  onPrev?: () => void;
  onNext?: () => void;
  onToday: () => void;
  onCreateEvent: () => void;
  onImportIcs?: () => void;
}

export function DateNavigator({ weekLabel, onPrev, onNext, onToday, onCreateEvent, onImportIcs }: DateNavigatorProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {onPrev && (
          <button
            onClick={onPrev}
            className="w-9 h-9 rounded-full bg-[#F2C94C]/30 text-white/80 hover:bg-[#F2C94C]/50 flex items-center justify-center transition-colors flex-shrink-0"
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
            className="w-9 h-9 rounded-full bg-[#F2C94C]/30 text-white/80 hover:bg-[#F2C94C]/50 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <button
          onClick={onToday}
          className="ml-2 px-4 py-1.5 rounded-full bg-[#F2C94C]/30 text-white/80 hover:bg-[#F2C94C]/50 text-sm font-light transition-colors flex-shrink-0"
        >
          今天
        </button>
      </div>
      <div className="flex items-center gap-2">
        {onImportIcs && (
          <button
            onClick={onImportIcs}
            className="px-3 py-1.5 rounded-full bg-[#F2C94C]/30 text-white/80 hover:bg-[#F2C94C]/50 text-sm font-light transition-colors"
          >
            导入
          </button>
        )}
        <button
          onClick={onCreateEvent}
          className="w-9 h-9 rounded-full bg-[#F2C94C] text-[#1A1A1A] hover:bg-[#F2C94C]/80 flex items-center justify-center transition-colors shadow-lg"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 4V14M4 9H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
