/* ============================================
   提灯 Web 版 — 习惯页面
   ============================================ */

const HabitsPage = {
  render(container) {
    const nav = UI.NavBar({ title: '习惯', action: '新建', onAction: () => this.showAddModal() });

    const scroll = document.createElement('div');
    scroll.className = 'page-scroll';
    scroll.id = 'habits-scroll';

    container.appendChild(nav);
    container.appendChild(scroll);
    this.refresh(scroll);
  },

  refresh(scrollEl) {
    scrollEl = scrollEl || document.getElementById('habits-scroll');
    if (!scrollEl) return;

    const habits = Store.getHabits();
    const stats = Store.getHabitStats();
    const today = Utils.today();
    const weekDates = Utils.getWeekDates();
    const weekLabels = Utils.getWeekLabels();

    scrollEl.innerHTML = `
      <div class="fade-in">
        <!-- 今日概览 -->
        <div class="habits-overview">
          <div class="habits-overview__ring">
            ${UI.ProgressRing({ size: 56, stroke: 4, progress: stats.rate })}
          </div>
          <div class="habits-overview__info">
            <div class="habits-overview__title">今日打卡 ${stats.doneToday}/${stats.total}</div>
            <div class="habits-overview__sub">${stats.total > 0 ? '完成率 ' + stats.rate + '%' : '还没有习惯，点击右上角新建'}</div>
          </div>
        </div>

        <!-- 习惯列表 -->
        <div class="habit-list">
          ${habits.length === 0 ? UI.EmptyState({ icon: 'target', text: '还没有习惯，培养一个好习惯吧' }) : ''}
          ${habits.map(h => this.renderHabitCard(h, today, weekDates, weekLabels)).join('')}
        </div>
      </div>
    `;

    // 打卡
    scrollEl.querySelectorAll('.habit-card__checkin').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        Store.toggleHabitCheckin(id, today);
        this.refresh(scrollEl);
        const isChecked = btn.classList.contains('habit-card__checkin--inactive');
        Utils.toast(isChecked ? '打卡成功 ✓' : '已取消打卡');
      });
    });

    // 删除
    scrollEl.querySelectorAll('.habit-card__delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const habit = Store.getHabits().find(h => h.id === id);
        if (confirm(`确定删除习惯「${habit?.name}」吗？`)) {
          Store.deleteHabit(id);
          this.refresh(scrollEl);
          Utils.toast('已删除习惯');
        }
      });
    });
  },

  renderHabitCard(habit, today, weekDates, weekLabels) {
    const isCheckedToday = habit.records.includes(today);
    const streak = Utils.calcStreak(habit.records);

    return `
      <div class="habit-card">
        <div class="habit-card__header">
          <div class="habit-card__icon" style="background: ${habit.color}20; color: ${habit.color};">
            ${habit.icon}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div class="habit-card__name">${this.escapeHtml(habit.name)}</div>
            <div class="habit-card__streak">🔥 连续 ${streak} 天</div>
          </div>
          <div class="habit-card__delete" data-id="${habit.id}">${Utils.icon('trash', 16)}</div>
        </div>

        <!-- 本周打卡矩阵 -->
        <div class="habit-card__week">
          ${weekDates.map((d, i) => {
            const done = habit.records.includes(d);
            const isToday = d === today;
            return `<div class="habit-card__day ${done ? 'done' : ''} ${isToday ? 'today' : ''}" title="${d}">${weekLabels[i]}</div>`;
          }).join('')}
        </div>

        <!-- 打卡按钮 -->
        <div class="habit-card__actions">
          <button class="habit-card__checkin ${isCheckedToday ? 'habit-card__checkin--active' : 'habit-card__checkin--inactive'}" data-id="${habit.id}">
            ${isCheckedToday ? '✓ 已打卡' : '打卡'}
          </button>
        </div>
      </div>
    `;
  },

  showAddModal() {
    const icons = ['🎯', '📚', '🏃', '💧', '🧘', '✍️', '🎨', '🎵', '💤', '🍎'];
    const colors = ['#4CAF76', '#3A8FB7', '#E8B959', '#C97070', '#8A6DA7', '#5856d6', '#B87353', '#4B7F52'];

    const content = `
      <div style="display: flex; flex-direction: column; gap: var(--space-md);">
        <input class="input" id="habit-name-input" placeholder="习惯名称" autofocus />

        <div>
          <div style="font-size: var(--text-sm); color: var(--ink-muted); margin-bottom: var(--space-xs);">选择图标</div>
          <div style="display: flex; gap: var(--space-xs); flex-wrap: wrap;" id="habit-icons">
            ${icons.map((ic, i) => `
              <button class="btn btn--icon ${i === 0 ? 'btn--primary' : 'btn--secondary'}" data-icon="${ic}" style="font-size: 18px;">${ic}</button>
            `).join('')}
          </div>
        </div>

        <div>
          <div style="font-size: var(--text-sm); color: var(--ink-muted); margin-bottom: var(--space-xs);">选择颜色</div>
          <div style="display: flex; gap: var(--space-xs); flex-wrap: wrap;" id="habit-colors">
            ${colors.map((c, i) => `
              <button class="btn btn--icon ${i === 0 ? 'btn--primary' : 'btn--secondary'}" data-color="${c}" style="background: ${c}; width: 28px; height: 28px; border-radius: 50%;"></button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    let selectedIcon = icons[0];
    let selectedColor = colors[0];

    const modal = UI.Modal({
      title: '新建习惯',
      content,
      actions: [
        { key: 'cancel', label: '取消', variant: 'secondary' },
        {
          key: 'confirm', label: '创建', variant: 'primary',
          onClick: () => {
            const name = document.getElementById('habit-name-input')?.value.trim();
            if (!name) { Utils.toast('请输入习惯名称'); return; }
            Store.addHabit({ name, icon: selectedIcon, color: selectedColor });
            this.refresh();
            Utils.toast('习惯已创建');
          },
        },
      ],
    });

    document.body.appendChild(modal);

    // 图标选择
    modal.querySelector('#habit-icons')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-icon]');
      if (!btn) return;
      selectedIcon = btn.dataset.icon;
      modal.querySelectorAll('#habit-icons .btn').forEach(b => {
        b.className = `btn btn--icon ${b.dataset.icon === selectedIcon ? 'btn--primary' : 'btn--secondary'}`;
      });
    });

    // 颜色选择
    modal.querySelector('#habit-colors')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-color]');
      if (!btn) return;
      selectedColor = btn.dataset.color;
      modal.querySelectorAll('#habit-colors .btn').forEach(b => {
        b.style.outline = b.dataset.color === selectedColor ? '2px solid var(--ink)' : 'none';
      });
    });

    // 回车提交
    setTimeout(() => {
      const input = document.getElementById('habit-name-input');
      input?.focus();
      input?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          modal.querySelector('[data-action="confirm"]')?.click();
        }
      });
    }, 100);
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};
