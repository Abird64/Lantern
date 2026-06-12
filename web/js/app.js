/* ============================================
   提灯 Web 版 — 应用入口
   ============================================ */

const App = {
  currentPage: 'dashboard',

  /** 页面注册表 */
  pages: {
    dashboard: DashboardPage,
    tasks: TasksPage,
    diary: DiaryPage,
    habits: HabitsPage,
    mine: MinePage,
  },

  /** 初始化应用 */
  init() {
    // 应用主题
    const settings = Store.getSettings();
    this.applyTheme(settings.theme);

    // 首次渲染
    this.render();

    // 监听 hash 变化（支持浏览器前进/后退）
    window.addEventListener('hashchange', () => {
      const page = location.hash.slice(1) || 'dashboard';
      if (this.pages[page]) {
        this.currentPage = page;
        this.render();
      }
    });
  },

  /** 导航到指定页面 */
  navigate(page) {
    if (!this.pages[page]) return;
    this.currentPage = page;
    location.hash = page;
    this.render();
  },

  /** 渲染当前页面 */
  render() {
    const app = document.getElementById('app');
    if (!app) return;

    // 清空
    app.innerHTML = '';

    // 页面容器
    const container = document.createElement('div');
    container.className = 'page-container';

    // 渲染页面
    const page = this.pages[this.currentPage];
    if (page) {
      page.render(container);
    }

    app.appendChild(container);

    // 底部标签栏
    const tabBar = UI.TabBar({
      active: this.currentPage,
      onChange: (tab) => this.navigate(tab),
    });
    app.appendChild(tabBar);
  },

  /** 应用主题 */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },
};

// ---- 启动 ----
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
