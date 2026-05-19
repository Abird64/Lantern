import { Menu } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { navbar, windowControls } from '@/styles/theme';

interface NavBarProps {
  title: string;
  navColor?: string;
  navTitle?: string;
  quote?: string;
}

/**
 * 统一顶部导航栏组件
 * 
 * @param title - 左上角菜单按钮文字
 * @param navColor - 导航栏背景色
 * @param navTitle - 导航栏标题（可选，默认显示诗句）
 * @param quote - 中央诗句标题
 */
export function NavBar({ 
  title, 
  navColor = '#2D3A32', 
  navTitle,
  quote 
}: NavBarProps) {
  const { setMenuOpen } = useUIStore();

  return (
    <div 
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
      <div className={`flex items-center ${windowControls.gap}`}>
        {windowControls.colors.map((btn) => (
          <WindowControlButton
            key={btn.id}
            {...btn}
          />
        ))}
      </div>
    </div>
  );
}

// 窗口控制按钮
import { useState } from 'react';

interface WindowControlButtonProps {
  id: number;
  color: string;
  label: string;
}

function WindowControlButton({ id, color, label }: WindowControlButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      title={label}
      className={`${windowControls.size} rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center`}
      style={{
        backgroundColor: hovered ? color : 'rgba(255, 255, 255, 0.1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {id === 0 && (
            <path
              d="M1 5H9"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          )}
          {id === 1 && (
            <rect
              x="2"
              y="2"
              width="6"
              height="6"
              rx="0.5"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1.2"
              fill="none"
            />
          )}
          {id === 2 && (
            <path
              d="M2 2L8 8M8 2L2 8"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          )}
        </svg>
      )}
    </button>
  );
}
