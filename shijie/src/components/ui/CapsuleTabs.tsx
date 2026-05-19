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
  className?: string;
}

/**
 * 统一胶囊分类栏组件
 * 
 * @param items - 分类项列表
 * @param activeId - 当前选中项
 * @param onChange - 切换回调
 * @param accentColor - 主题色，默认使用主绿色
 */
export function CapsuleTabs({
  items,
  activeId,
  onChange,
  accentColor = '#58A968',
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
            color: activeId === item.id ? 'white' : 'rgba(255,255,255,0.8)',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
