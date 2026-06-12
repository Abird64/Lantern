/* ============================================
   提灯 Web 版 — 看板页面
   ============================================ */

const DashboardPage = {
  render(container) {
    const taskStats = Store.getTaskStats();
    const diaryStats = Store.getDiaryStats();
    const habitStats = Store.getHabitStats();
    const today = new Date();

    const nav = UI.NavBar({ title: '看板' });

    const scroll = document.createElement('div');
    scroll.className = 'page-scroll';
    scroll.innerHTML = `
      <div class="fade-in">
        <!-- 日期 -->
        <div class="dashboard-date">
          ${today.getDate()}
          <span class="dashboard-date__sub">${Utils.formatDateCN(today)}</span>
        </div>

        <!-- 2列网格：任务 + 日记 -->
        <div class="dashboard-grid dashboard-grid--2col">
          <!-- 任务卡片 -->
          <div class="summary-card" data-nav="tasks">
            <div class="summary-card__header">
              <div class="summary-card__icon" style="background: rgba(88,86,214,0.12); color: #5856d6;">${Utils.icon('list', 18)}</div>
              <span class="summary-card__title">任务</span>
            </div>
            <div class="summary-card__value">${taskStats.pending}</div>
            <div class="summary-card__label">待完成 · 已完成 ${taskStats.completed}</div>
          </div>

          <!-- 日记卡片 -->
          <div class="summary-card" data-nav="diary">
            <div class="summary-card__header">
              <div class="summary-card__icon" style="background: rgba(76,175,118,0.12); color: var(--primary);">${Utils.icon('book', 18)}</div>
              <span class="summary-card__title">日记</span>
            </div>
            <div class="summary-card__value">${diaryStats.monthCount}</div>
            <div class="summary-card__label">本月 · 共 ${diaryStats.totalWords} 字</div>
          </div>
        </div>

        <!-- 2列网格：习惯 + 统计 -->
        <div class="dashboard-grid dashboard-grid--2col">
          <!-- 习惯卡片 -->
          <div class="summary-card" data-nav="habits">
            <div class="summary-card__header">
              <div class="summary-card__icon" style="background: rgba(232,185,89,0.12); color: #E8B959;">${Utils.icon('target', 18)}</div>
              <span class="summary-card__title">习惯</span>
            </div>
            <div class="summary-card__value">${habitStats.doneToday}/${habitStats.total}</div>
            <div class="summary-card__label">今日打卡 ${habitStats.rate}%</div>
          </div>

          <!-- 总览卡片 -->
          <div class="summary-card">
            <div class="summary-card__header">
              <div class="summary-card__icon" style="background: rgba(58,143,183,0.12); color: #3A8FB7;">${Utils.icon('flame', 18)}</div>
              <span class="summary-card__title">总览</span>
            </div>
            <div class="summary-card__value">${taskStats.total + diaryStats.total + habitStats.total}</div>
            <div class="summary-card__label">任务 + 日记 + 习惯</div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div style="margin-top: var(--space-md);">
          <button class="btn btn--primary" style="width: 100%;" id="dash-quick-task">
            ${Utils.icon('plus', 18)} 快速添加任务
          </button>
        </div>
      </div>
    `;

    // 卡片点击导航
    scroll.querySelectorAll('[data-nav]').forEach(card => {
      card.addEventListener('click', () => {
        App.navigate(card.dataset.nav);
      });
    });

    // 快速添加任务
    scroll.querySelector('#dash-quick-task')?.addEventListener('click', () => {
      App.navigate('tasks');
      setTimeout(() => TasksPage.showAddModal(), 100);
    });

    container.appendChild(nav);
    container.appendChild(scroll);
  },
};
