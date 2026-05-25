import { Check } from 'lucide-react';
import type { PageTheme } from '@/styles/theme';

interface ThemeCardProps {
  theme: PageTheme;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * 主题色块预览卡片 — 5 竖条：nav | accent | card | cardText | bg
 */
export function ThemeCard({ theme, isSelected, onClick }: ThemeCardProps) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer"
      style={{
        width: 140,
        border: isSelected ? '2px solid #F2C94C' : '2px solid transparent',
        boxShadow: isSelected ? '0 0 0 2px rgba(242,201,76,0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#F2C94C] flex items-center justify-center z-10">
          <Check size={12} strokeWidth={3} className="text-[#1A1A1A]" />
        </div>
      )}

      <div className="flex gap-1 p-3" style={{ height: 52 }}>
        <div className="flex-1 rounded-md" style={{ backgroundColor: theme.nav }} title="导航栏" />
        <div className="flex-1 rounded-md" style={{ backgroundColor: theme.accent }} title="强调色" />
        <div className="flex-1 rounded-md" style={{ backgroundColor: theme.card }} title="卡片色" />
        <div className="flex-1 rounded-md" style={{ backgroundColor: theme.cardText, border: '1px solid rgba(0,0,0,0.1)' }} title="卡片文字" />
        <div className="flex-1 rounded-md" style={{ backgroundColor: theme.bg, border: '1px solid rgba(0,0,0,0.08)' }} title="页面背景" />
      </div>

      <div className="pb-3 text-center">
        <span className="text-xs font-zhuque tracking-wider" style={{ color: '#888' }}>
          {theme.name}
        </span>
      </div>
    </button>
  );
}
