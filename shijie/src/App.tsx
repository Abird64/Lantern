import { useUIStore } from '@/stores/uiStore';
import { DropdownMenu } from '@/components/layout';
import {
  HomePage,
  TasksPage,
  SchedulePage,
  DiaryPage,
  RelationsPage,
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
      case 'skills':
        return <SkillsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen">
      <DropdownMenu />
      {renderPage()}
    </div>
  );
}

export default App;
