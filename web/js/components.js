/* ============================================
   提灯 Web 版 — 通用 UI 组件渲染函数
   ============================================ */

const UI = {
  /** 创建导航栏 */
  NavBar({ title, back, action, onBack, onAction }) {
    const el = document.createElement('div');
    el.className = 'nav-bar';
    let html = '';
    if (back) {
      html += `<button class="nav-bar__back" id="nav-back">${Utils.icon('chevronLeft', 18)} <span>${back}</span></button>`;
    }
    html += `<span class="nav-bar__title">${title}</span>`;
    if (action) {
      html += `<button class="nav-bar__action" id="nav-action">${action}</button>`;
    }
    el.innerHTML = html;
    if (onBack) {
      el.querySelector('#nav-back')?.addEventListener('click', onBack);
    }
    if (onAction) {
      el.querySelector('#nav-action')?.addEventListener('click', onAction);
    }
    return el;
  },

  /** 创建底部标签栏 */
  TabBar({ active, onChange }) {
    const tabs = [
      { key: 'dashboard', label: '看板', icon: 'layout' },
      { key: 'tasks', label: '任务', icon: 'list' },
      { key: 'diary', label: '日记', icon: 'book' },
      { key: 'habits', label: '习惯', icon: 'target' },
      { key: 'mine', label: '我的', icon: 'user' },
    ];
    const el = document.createElement('div');
    el.className = 'tab-bar';
    el.innerHTML = tabs.map(t => `
      <button class="tab-bar__item ${t.key === active ? 'active' : ''}" data-tab="${t.key}">
        <span class="tab-bar__icon">${Utils.icon(t.icon, 22)}</span>
        <span>${t.label}</span>
      </button>
    `).join('');
    el.addEventListener('click', e => {
      const btn = e.target.closest('.tab-bar__item');
      if (btn) onChange(btn.dataset.tab);
    });
    return el;
  },

  /** 创建胶囊标签组 */
  CapsuleTabs({ items, active, onChange }) {
    const el = document.createElement('div');
    el.className = 'capsule-tabs';
    el.innerHTML = items.map(item => {
      const key = typeof item === 'string' ? item : item.key;
      const label = typeof item === 'string' ? item : item.label;
      return `<button class="capsule-tab ${key === active ? 'active' : ''}" data-key="${key}">${label}</button>`;
    }).join('');
    el.addEventListener('click', e => {
      const btn = e.target.closest('.capsule-tab');
      if (btn) onChange(btn.dataset.key);
    });
    return el;
  },

  /** 创建弹窗 */
  Modal({ title, content, actions, onClose }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'modal';
    let html = '<div class="modal__handle"></div>';
    if (title) html += `<div class="modal__title">${title}</div>`;
    html += `<div class="modal__body">${content}</div>`;
    if (actions) {
      html += '<div class="modal__actions">';
      actions.forEach(a => {
        html += `<button class="btn btn--${a.variant || 'secondary'}" data-action="${a.key}">${a.label}</button>`;
      });
      html += '</div>';
    }
    modal.innerHTML = html;
    overlay.appendChild(modal);

    // 关闭：点击遮罩
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        overlay.remove();
        onClose?.();
      }
    });

    // 关闭：动作按钮
    modal.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = actions?.find(a => a.key === btn.dataset.action);
        action?.onClick?.();
        overlay.remove();
      });
    });

    return overlay;
  },

  /** 创建进度环 */
  ProgressRing({ size = 56, stroke = 4, progress = 0, color = 'var(--primary)' }) {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;
    return `
      <svg class="progress-ring" width="${size}" height="${size}">
        <circle class="progress-ring__track" cx="${size/2}" cy="${size/2}" r="${radius}" stroke-width="${stroke}"/>
        <circle class="progress-ring__fill" cx="${size/2}" cy="${size/2}" r="${radius}" stroke-width="${stroke}"
          stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
      </svg>
    `;
  },

  /** 创建空状态 */
  EmptyState({ icon, text }) {
    return `
      <div class="empty-state">
        <div class="empty-state__icon">${Utils.icon(icon, 48)}</div>
        <div class="empty-state__text">${text}</div>
      </div>
    `;
  },
};
