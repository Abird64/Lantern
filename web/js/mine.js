/* ============================================
   提灯 Web 版 — 我的页面
   ============================================ */

const MinePage = {
  render(container) {
    const settings = Store.getSettings();
    const taskStats = Store.getTaskStats();
    const diaryStats = Store.getDiaryStats();
    const habitStats = Store.getHabitStats();

    const nav = UI.NavBar({ title: '我的' });

    const scroll = document.createElement('div');
    scroll.className = 'page-scroll';
    scroll.innerHTML = `
      <div class="fade-in">
        <!-- 头像和昵称 -->
        <div class="mine-profile">
          <div class="mine-avatar">🏮</div>
          <div class="mine-name" id="mine-nickname">${settings.nickname || '点击设置昵称'}</div>
          <button class="btn btn--ghost btn--sm" id="mine-edit-name">编辑昵称</button>
        </div>

        <!-- 数据统计 -->
        <div class="mine-section">
          <div class="mine-section__title">数据统计</div>
          <div class="mine-list">
            <div class="mine-item">
              <div class="mine-item__icon" style="background: rgba(88,86,214,0.12); color: #5856d6;">${Utils.icon('list', 16)}</div>
              <span class="mine-item__label">任务</span>
              <span class="mine-item__value">${taskStats.total} 个（完成 ${taskStats.completed}）</span>
            </div>
            <div class="mine-item">
              <div class="mine-item__icon" style="background: rgba(76,175,118,0.12); color: var(--primary);">${Utils.icon('book', 16)}</div>
              <span class="mine-item__label">日记</span>
              <span class="mine-item__value">${diaryStats.total} 篇（${diaryStats.totalWords} 字）</span>
            </div>
            <div class="mine-item">
              <div class="mine-item__icon" style="background: rgba(232,185,89,0.12); color: #E8B959;">${Utils.icon('target', 16)}</div>
              <span class="mine-item__label">习惯</span>
              <span class="mine-item__value">${habitStats.total} 个（今日 ${habitStats.doneToday}）</span>
            </div>
          </div>
        </div>

        <!-- 外观设置 -->
        <div class="mine-section">
          <div class="mine-section__title">外观</div>
          <div class="mine-list">
            <div class="mine-item" id="mine-theme-toggle">
              <div class="mine-item__icon" style="background: rgba(58,143,183,0.12); color: #3A8FB7;">
                ${settings.theme === 'dark' ? Utils.icon('moon', 16) : Utils.icon('sun', 16)}
              </div>
              <span class="mine-item__label">深色模式</span>
              <div class="toggle ${settings.theme === 'dark' ? 'on' : ''}" id="mine-toggle"></div>
            </div>
          </div>
        </div>

        <!-- 数据管理 -->
        <div class="mine-section">
          <div class="mine-section__title">数据管理</div>
          <div class="mine-list">
            <div class="mine-item" id="mine-export">
              <div class="mine-item__icon" style="background: rgba(76,175,118,0.12); color: var(--primary);">${Utils.icon('download', 16)}</div>
              <span class="mine-item__label">导出数据</span>
              <span class="mine-item__arrow">${Utils.icon('chevronRight', 16)}</span>
            </div>
            <div class="mine-item" id="mine-clear">
              <div class="mine-item__icon" style="background: rgba(201,112,112,0.12); color: var(--danger);">${Utils.icon('trash', 16)}</div>
              <span class="mine-item__label" style="color: var(--danger);">清除所有数据</span>
              <span class="mine-item__arrow">${Utils.icon('chevronRight', 16)}</span>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div class="mine-section">
          <div class="mine-section__title">关于</div>
          <div class="mine-list">
            <div class="mine-item">
              <div class="mine-item__icon" style="background: var(--primary-12); color: var(--primary);">🏮</div>
              <span class="mine-item__label">提灯 Web 版</span>
              <span class="mine-item__value">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(nav);
    container.appendChild(scroll);

    // 编辑昵称
    scroll.querySelector('#mine-edit-name')?.addEventListener('click', () => {
      const current = Store.getSettings().nickname || '';
      const content = `<input class="input" id="nickname-input" value="${current}" placeholder="输入昵称" />`;
      const modal = UI.Modal({
        title: '设置昵称',
        content,
        actions: [
          { key: 'cancel', label: '取消', variant: 'secondary' },
          {
            key: 'confirm', label: '保存', variant: 'primary',
            onClick: () => {
              const name = document.getElementById('nickname-input')?.value.trim();
              Store.updateSetting('nickname', name);
              scroll.querySelector('#mine-nickname').textContent = name || '点击设置昵称';
              Utils.toast('昵称已更新');
            },
          },
        ],
      });
      document.body.appendChild(modal);
      setTimeout(() => {
        const input = document.getElementById('nickname-input');
        input?.focus();
        input?.select();
      }, 100);
    });

    // 主题切换
    scroll.querySelector('#mine-theme-toggle')?.addEventListener('click', () => {
      const settings = Store.getSettings();
      const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
      Store.updateSetting('theme', newTheme);
      App.applyTheme(newTheme);
      this.refresh(container);
    });

    // 导出数据
    scroll.querySelector('#mine-export')?.addEventListener('click', () => {
      const data = Store.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `提灯备份_${Utils.today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Utils.toast('数据已导出');
    });

    // 清除数据
    scroll.querySelector('#mine-clear')?.addEventListener('click', () => {
      if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        Store.clearAll();
        this.refresh(container);
        Utils.toast('数据已清除');
      }
    });
  },

  refresh(container) {
    container.innerHTML = '';
    this.render(container);
  },
};
