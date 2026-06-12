/* ============================================
   提灯 Web 版 — 任务页面
   ============================================ */

const TasksPage = {
  currentFilter: 'all',

  render(container) {
    const nav = UI.NavBar({ title: '任务', action: '新建', onAction: () => this.showAddModal() });

    const scroll = document.createElement('div');
    scroll.className = 'page-scroll';
    scroll.id = 'tasks-scroll';

    container.appendChild(nav);
    container.appendChild(scroll);
    this.refresh(scroll);
  },

  refresh(scrollEl) {
    scrollEl = scrollEl || document.getElementById('tasks-scroll');
    if (!scrollEl) return;

    const tasks = Store.getTasks();
    const filtered = this.filterTasks(tasks);
    const today = Utils.today();

    scrollEl.innerHTML = `
      <div class="fade-in">
        <!-- 筛选标签 -->
        <div class="capsule-tabs" id="tasks-tabs"></div>

        <!-- 任务列表 -->
        <div class="task-list" id="tasks-list">
          ${filtered.length === 0 ? UI.EmptyState({ icon: 'list', text: '暂无任务，点击右上角新建' }) : ''}
          ${filtered.map(t => this.renderTaskCard(t, today)).join('')}
        </div>
      </div>
    `;

    // 渲染标签
    const tabsEl = scrollEl.querySelector('#tasks-tabs');
    const tabs = [
      { key: 'all', label: '全部' },
      { key: 'today', label: '今天' },
      { key: 'pending', label: '进行中' },
      { key: 'completed', label: '已完成' },
    ];
    tabsEl.innerHTML = tabs.map(t => `
      <button class="capsule-tab ${t.key === this.currentFilter ? 'active' : ''}" data-key="${t.key}">${t.label}</button>
    `).join('');
    tabsEl.addEventListener('click', e => {
      const btn = e.target.closest('.capsule-tab');
      if (btn) {
        this.currentFilter = btn.dataset.key;
        this.refresh(scrollEl);
      }
    });

    // 任务操作
    scrollEl.querySelector('#tasks-list')?.addEventListener('click', e => {
      const card = e.target.closest('.task-card');
      if (!card) return;
      const id = card.dataset.id;

      if (e.target.closest('.task-card__check')) {
        Store.toggleTask(id);
        this.refresh(scrollEl);
        return;
      }

      if (e.target.closest('.task-card__delete')) {
        Store.deleteTask(id);
        this.refresh(scrollEl);
        Utils.toast('已删除任务');
        return;
      }
    });
  },

  renderTaskCard(task, today) {
    const isCompleted = task.completed;
    const dueDate = task.dueDate;
    const isOverdue = dueDate && dueDate < today && !isCompleted;

    let metaHtml = '';
    if (dueDate) {
      const dateLabel = dueDate === today ? '今天' : dueDate;
      metaHtml += `<span class="badge ${isOverdue ? 'badge--danger' : 'badge--primary'}">${dateLabel}</span>`;
    }
    if (task.priority) {
      const colors = { high: 'badge--danger', medium: 'badge--warning', low: 'badge--primary' };
      metaHtml += `<span class="badge ${colors[task.priority] || 'badge--primary'}">${task.priority}</span>`;
    }

    return `
      <div class="task-card ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-card__check ${isCompleted ? 'checked' : ''}">
          ${isCompleted ? Utils.icon('check', 14) : ''}
        </div>
        <div class="task-card__body">
          <div class="task-card__title">${this.escapeHtml(task.title)}</div>
          ${metaHtml ? `<div class="task-card__meta">${metaHtml}</div>` : ''}
        </div>
        <div class="task-card__delete">${Utils.icon('trash', 16)}</div>
      </div>
    `;
  },

  filterTasks(tasks) {
    const today = Utils.today();
    switch (this.currentFilter) {
      case 'today':
        return tasks.filter(t => {
          if (t.dueDate === today) return true;
          if (!t.dueDate && t.createdAt.startsWith(today)) return true;
          return false;
        });
      case 'pending':
        return tasks.filter(t => !t.completed);
      case 'completed':
        return tasks.filter(t => t.completed);
      default:
        return tasks;
    }
  },

  showAddModal() {
    const content = `
      <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
        <input class="input" id="task-title-input" placeholder="任务标题" autofocus />
        <input class="input" type="date" id="task-date-input" value="${Utils.today()}" />
        <select class="input" id="task-priority-input">
          <option value="">无优先级</option>
          <option value="low">低优先级</option>
          <option value="medium">中优先级</option>
          <option value="high">高优先级</option>
        </select>
      </div>
    `;

    const modal = UI.Modal({
      title: '新建任务',
      content,
      actions: [
        { key: 'cancel', label: '取消', variant: 'secondary', onClick: () => {} },
        {
          key: 'confirm', label: '创建', variant: 'primary',
          onClick: () => {
            const title = document.getElementById('task-title-input')?.value.trim();
            if (!title) { Utils.toast('请输入任务标题'); return; }
            const dueDate = document.getElementById('task-date-input')?.value || null;
            const priority = document.getElementById('task-priority-input')?.value || null;
            Store.addTask({ title, dueDate, priority });
            this.refresh();
            Utils.toast('任务已创建');
          },
        },
      ],
    });

    document.body.appendChild(modal);

    // 回车提交
    setTimeout(() => {
      const input = document.getElementById('task-title-input');
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
