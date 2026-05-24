import { useUIStore } from '@/stores/uiStore';
import { usePageTheme } from '@/hooks/usePageTheme';
import { Home, ListTodo, Calendar, BookOpen, Users, Sparkles, Settings } from 'lucide-react';

const tabs = [
  { id: 'lantern', label: '助手', icon: Home },
  { id: 'tasks', label: '任务', icon: ListTodo },
  { id: 'schedule', label: '日历', icon: Calendar },
  { id: 'diary', label: '日记', icon: BookOpen },
  { id: 'relations', label: '相识', icon: Users },
  { id: 'skills', label: '修为', icon: Sparkles },
  { id: 'settings', label: '设置', icon: Settings },
];

export function DropdownMenu() {
  const { activeTab, setActiveTab, menuOpen, setMenuOpen } = useUIStore();
  const t = usePageTheme('lantern');

  if (!menuOpen) return null;

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
                className={`w-full h-12 rounded-xl flex items-center gap-3 px-4 transition-all ${
                  isActive
                    ? ''
                    : 'hover:bg-white/10'
                }`}
                style={isActive ? { backgroundColor: t.accent } : undefined}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-white/70'} />
                <span
                  className={`font-zhuque text-xl ${
                    isActive ? 'text-white' : 'text-white/70'
                  }`}
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
