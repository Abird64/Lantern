import type { ReactNode } from 'react';
import { Sparkles, X } from 'lucide-react';
import { usePageTheme } from '@/hooks/usePageTheme';

interface MascotModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function MascotModal({ show, onClose, title, children }: MascotModalProps) {
  const t = usePageTheme('lantern');
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start pl-6 pb-24">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* 卡片 — 深色底，统一风格 */}
      <div
        className="relative w-full max-w-[400px] rounded-3xl shadow-2xl p-8 mx-4 animate-in slide-in-from-bottom-4 duration-300"
        style={{ backgroundColor: t.card }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-[#F2C94C]" />
            <h2 className="text-xl font-zhuque text-[#E8E0D0]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity bg-white/10"
          >
            <X size={16} className="text-[#E8E0D0]" />
          </button>
        </div>
        {/* 内容区 */}
        <div className="max-h-[60vh] overflow-y-auto font-zhuque text-[#E8E0D0]/80">
          {children}
        </div>
      </div>
    </div>
  );
}
