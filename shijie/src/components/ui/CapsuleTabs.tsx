import { capsuleTab } from '@/styles/theme';

interface CapsuleTabItem {
  id: string;
  label: string;
}

interface CapsuleTabsProps {
  items: CapsuleTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  accentColor?: string;
  isDark?: boolean;
  className?: string;
}

/**
 * 统一胶囊分类栏组件
 */
export function CapsuleTabs({
  items,
  activeId,
  onChange,
  accentColor = '#58A968',
  isDark = true,
  className = '',
}: CapsuleTabsProps) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`
            ${capsuleTab.padding.x} ${capsuleTab.padding.y}
            ${capsuleTab.borderRadius}
            ${capsuleTab.fontSize}
            font-light tracking-wider
            ${capsuleTab.transition}
          `}
          style={{
            minWidth: capsuleTab.minWidth,
            backgroundColor: activeId === item.id ? accentColor : `${accentColor}30`,
            color: activeId === item.id ? 'white' : isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
