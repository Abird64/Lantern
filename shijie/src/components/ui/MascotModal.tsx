import type { ReactNode } from 'react';
import { Sparkles, X } from 'lucide-react';
import { usePageTheme } from '@/hooks/usePageTheme';

interface MascotModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export function MascotModal({ show, onClose, title, children }: MascotModalProps) {
  const t = usePageTheme('lantern');
  if (!show) return null;

  const txt = t.cardText;
  const txtDim = txt + '80';
  // 根据卡片自身明暗决定 tint，而非页面背景
  const cardIsDark = isDarkColor(t.card);
  const btnBg = cardIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start pl-6 pb-24">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* 卡片 */}
      <div
        className="relative w-full max-w-[400px] rounded-3xl shadow-2xl p-8 mx-4 animate-in slide-in-from-bottom-4 duration-300"
        style={{ backgroundColor: t.card }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} style={{ color: t.accent }} />
            <h2 className="text-xl font-zhuque" style={{ color: txt }}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ backgroundColor: btnBg }}
          >
            <X size={16} style={{ color: txt }} />
          </button>
        </div>
        {/* 内容区 */}
        <div className="max-h-[60vh] overflow-y-auto font-zhuque" style={{ color: txtDim }}>
          {children}
        </div>
      </div>
    </div>
  );
}
