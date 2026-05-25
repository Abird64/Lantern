import { Menu } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { navbar } from '@/styles/theme';
import { WindowControls } from '@/components/layout/WindowControls';

interface NavBarProps {
  title: string;
  navColor?: string;
  navTitle?: string;
  quote?: string;
}

export function NavBar({
  title,
  navColor = '#2D3A32',
  navTitle,
  quote
}: NavBarProps) {
  const { setMenuOpen } = useUIStore();

  return (
    <div
      data-tauri-drag-region
      className={`
        h-[72px] flex items-center justify-between
        ${navbar.padding.x}
        border-b border-white/10
        flex-shrink-0 -mx-4 md:-mx-6 lg:-mx-8
      `}
      style={{ backgroundColor: navColor }}
    >
      {/* 左上角 - 菜单按钮 */}
      <button
        onClick={() => setMenuOpen(true)}
        className="w-[120px] h-10 rounded-full bg-[#666] flex items-center justify-center hover:bg-[#777] transition-colors"
      >
        <Menu size={20} className="text-white mr-2" />
        <span className="font-zhuque text-white text-xl">{navTitle || title}</span>
      </button>

      {/* 中央 - 诗句/标题 */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl tracking-widest text-white/85 font-light">
        {quote}
      </h1>

      {/* 右侧 - 窗口控制按钮 */}
      <WindowControls />
    </div>
  );
}
