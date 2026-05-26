import { useUIStore } from '@/stores/uiStore';
import { usePageTheme } from '@/hooks/usePageTheme';
import { Home, ListTodo, Calendar, BookOpen, Users, Bookmark, Sparkles, Settings } from 'lucide-react';

const tabs = [
  { id: 'lantern', label: '助手', icon: Home },
  { id: 'tasks', label: '任务', icon: ListTodo },
  { id: 'schedule', label: '日历', icon: Calendar },
  { id: 'diary', label: '日记', icon: BookOpen },
  { id: 'relations', label: '相识', icon: Users },
  { id: 'memories', label: '小本本', icon: Bookmark },
  { id: 'skills', label: '修为', icon: Sparkles },
  { id: 'settings', label: '设置', icon: Settings },
];

function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export function DropdownMenu() {
  const { activeTab, setActiveTab, menuOpen, setMenuOpen } = useUIStore();
  const t = usePageTheme('lantern');

  if (!menuOpen) return null;

  const bgIsDark = isDarkColor(t.bg);
  const itemColor = bgIsDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)';
  const hoverBg = bgIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setMenuOpen(false)}
      />

      {/* 下拉菜单 */}
      <div
        className="absolute top-20 left-4 w-[200px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: t.bg }}
      >
        <div className="p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMenuOpen(false);
                }}
                className="w-full h-12 rounded-xl flex items-center gap-3 px-4 transition-all"
                style={isActive ? { backgroundColor: t.accent } : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = hoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon size={20} style={{ color: isActive ? '#fff' : itemColor }} />
                <span
                  className="font-zhuque text-xl"
                  style={{ color: isActive ? '#fff' : itemColor }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
