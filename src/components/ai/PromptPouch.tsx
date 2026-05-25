import { useRef } from 'react';
import type { PromptTemplate } from '@/utils/builtinPrompts';

interface PromptPouchProps {
  prompts: PromptTemplate[];
  onSelect: (prompt: PromptTemplate) => void;
  /** 主题强调色，用于标签 hover 态 */
  accentColor?: string;
  /** 主题文字色 */
  textColor?: string;
}

export function PromptPouch({ prompts, onSelect, accentColor = '#58A968', textColor = '#EBEBE6' }: PromptPouchProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (prompts.length === 0) return null;

  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft += e.deltaY;
  };

  return (
    <div
      ref={scrollRef}
      onWheel={handleWheel}
      className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
      style={{ scrollbarWidth: 'none' }}
    >
      {prompts.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs transition-all border whitespace-nowrap"
          style={{
            color: `${textColor}99`,
            backgroundColor: `${textColor}0D`,
            borderColor: `${textColor}0D`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = textColor;
            e.currentTarget.style.backgroundColor = `${accentColor}26`;
            e.currentTarget.style.borderColor = `${accentColor}40`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = `${textColor}99`;
            e.currentTarget.style.backgroundColor = `${textColor}0D`;
            e.currentTarget.style.borderColor = `${textColor}0D`;
          }}
          title={p.prompt}
        >
          {p.title}
        </button>
      ))}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
