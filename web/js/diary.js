/* ============================================
   提灯 Web 版 — 日记页面
   ============================================ */

const DiaryPage = {
  currentDate: Utils.today(),
  editing: false,

  render(container) {
    const nav = UI.NavBar({ title: '日记' });

    const scroll = document.createElement('div');
    scroll.className = 'page-scroll';
    scroll.id = 'diary-scroll';

    container.appendChild(nav);
    container.appendChild(scroll);
    this.refresh(scroll);
  },

  refresh(scrollEl) {
    scrollEl = scrollEl || document.getElementById('diary-scroll');
    if (!scrollEl) return;

    const diary = Store.getDiaryByDate(this.currentDate);
    const diaries = Store.getDiaries();
    const isToday = this.currentDate === Utils.today();
    const stats = Store.getDiaryStats();

    scrollEl.innerHTML = `
      <div class="fade-in">
        <!-- 日期选择器 -->
        <div class="diary-date-picker">
          <button class="diary-date-picker__btn" id="diary-prev">${Utils.icon('chevronLeft', 20)}</button>
          <span class="diary-date-picker__date">${Utils.formatFullDate(this.currentDate)}</span>
          <button class="diary-date-picker__btn" id="diary-next">${Utils.icon('chevronRight', 20)}</button>
        </div>

        <!-- 编辑区 -->
        <div class="diary-editor">
          <div class="diary-editor__header">
            <span style="font-size: var(--text-caption); color: var(--ink-muted);">${isToday ? '今日随笔' : Utils.formatDateCN(this.currentDate)}</span>
            <span class="diary-editor__count" id="diary-count">${diary ? diary.wordCount + ' 字' : '0 字'}</span>
          </div>
          <textarea class="diary-editor__textarea" id="diary-textarea" placeholder="${isToday ? '记录今天的所思所想...' : '这一天发生了什么...'}">${diary ? diary.content : ''}</textarea>
          <div style="display: flex; justify-content: flex-end; margin-top: var(--space-sm);">
            <button class="btn btn--primary btn--sm" id="diary-save">保存</button>
          </div>
        </div>

        <!-- 统计 -->
        <div style="display: flex; gap: var(--space-sm); margin-bottom: var(--space-md);">
          <div class="badge badge--primary">共 ${stats.total} 篇</div>
          <div class="badge badge--primary">本月 ${stats.monthCount} 篇</div>
          <div class="badge badge--primary">${stats.totalWords} 字</div>
        </div>

        <!-- 历史列表 -->
        <div class="diary-history">
          <div class="diary-history__title">历史日记</div>
          ${diaries.length === 0
            ? UI.EmptyState({ icon: 'book', text: '还没有日记，开始记录吧' })
            : diaries.filter(d => d.date !== this.currentDate).slice(0, 20).map(d => `
              <div class="diary-entry" data-date="${d.date}">
                <div class="diary-entry__date">${Utils.formatDateCN(d.date)}</div>
                <div class="diary-entry__preview">${Utils.truncate(d.content, 100)}</div>
                <div class="diary-entry__meta">${d.wordCount} 字</div>
              </div>
            `).join('')
          }
        </div>
      </div>
    `;

    // 日期切换
    scrollEl.querySelector('#diary-prev')?.addEventListener('click', () => {
      this.currentDate = Utils.formatDate(Utils.addDays(this.currentDate, -1));
      this.refresh(scrollEl);
    });
    scrollEl.querySelector('#diary-next')?.addEventListener('click', () => {
      this.currentDate = Utils.formatDate(Utils.addDays(this.currentDate, 1));
      this.refresh(scrollEl);
    });

    // 字数统计
    const textarea = scrollEl.querySelector('#diary-textarea');
    const countEl = scrollEl.querySelector('#diary-count');
    textarea?.addEventListener('input', () => {
      const count = Utils.wordCount(textarea.value);
      countEl.textContent = count + ' 字';
    });

    // 保存
    scrollEl.querySelector('#diary-save')?.addEventListener('click', () => {
      const content = textarea.value.trim();
      if (!content) { Utils.toast('请输入日记内容'); return; }
      Store.saveDiary(this.currentDate, content);
      this.refresh(scrollEl);
      Utils.toast('日记已保存');
    });

    // 历史点击
    scrollEl.querySelectorAll('.diary-entry').forEach(el => {
      el.addEventListener('click', () => {
        this.currentDate = el.dataset.date;
        this.refresh(scrollEl);
      });
    });
  },
};
