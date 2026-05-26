import { useUIStore } from '@/stores/uiStore';
import { DropdownMenu } from '@/components/layout';
import { LanternButton } from '@/components/ai/LanternButton';
import {
  HomePage,
  TasksPage,
  SchedulePage,
  DiaryPage,
  RelationsPage,
  MemoriesPage,
  SkillsPage,
  SettingsPage,
} from '@/pages';
import '@/styles/global.css';

function App() {
  const { activeTab } = useUIStore();

  const renderPage = () => {
    switch (activeTab) {
      case 'lantern':
        return <HomePage />;
      case 'tasks':
        return <TasksPage />;
      case 'schedule':
        return <SchedulePage />;
      case 'diary':
        return <DiaryPage />;
      case 'relations':
        return <RelationsPage />;
      case 'memories':
        return <MemoriesPage />;
      case 'skills':
        return <SkillsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <DropdownMenu />
      {renderPage()}
      <LanternButton />
    </div>
  );
}

export default App;
