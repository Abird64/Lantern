# 时序（日历/日程）设计规划

> 最后更新: 2026-05-23
> 状态: **Phase 1/2/3 全部完成**

---

## 一、系统定位

日历是拾阶的**时间维度统一视图**，把散落在各模块的时间信息汇聚到一起：

- **任务** — 有 `scheduled_at` 的任务自动出现（只读同步）
- **课程** — 从 .ics 文件导入（WakeUp 等工具导出）
- **独立事件** — 手动创建的日程（会议、约会、提醒等）

三类数据用不同颜色区分，但共享同一个时间轴。

---

## 二、数据模型

### 2.1 schedules 表

```sql
CREATE TABLE IF NOT EXISTS schedules (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    start_at        TEXT NOT NULL,       -- ISO8601
    end_at          TEXT,                 -- 可选，无结束时间 = 无边界事件
    rrule           TEXT,                 -- iCal RRULE 格式，如 FREQ=WEEKLY;BYDAY=MO,WE
    reminder        TEXT,                 -- 提醒时间，ISO8601 或相对值（如 "PT30M"）
    color           TEXT,                 -- 事件颜色 hex
    is_all_day      INTEGER DEFAULT 0,   -- 全天事件
    location        TEXT,                 -- 地点
    source_type     TEXT DEFAULT 'manual',-- manual / ics_import / task_sync
    source_id       TEXT,                 -- 来源关联 ID
    category        TEXT,                 -- 分类标签：课表/学习/娱乐/工作/生活
    exdates         TEXT,                 -- 排除日期 JSON 数组，用于重复事件的例外
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
);
```

### 2.2 重复事件策略

- **存储**：`rrule` 字段存 iCal 标准规则（`FREQ=DAILY/WEEKLY/MONTHLY;BYDAY=...;UNTIL=...;COUNT=...`）
- **展开**：在后端 `list_schedules_in_range` 中展开为具体实例返回，前端拿到的是扁平事件列表
- **实例 ID**：`{base_id}_{YYYY-MM-DD}` 格式，用于识别重复实例
- **例外**：`exdates` 字段存 JSON 数组 `["2026-03-15", "2026-03-22"]`，展开时跳过
- **单次编辑**：编辑重复实例时可选"只修改这一次"（添加 exdate + 创建独立事件）或"修改所有"

### 2.3 数据分类与颜色

| 类型 | source_type | 默认颜色 | 说明 |
|------|-------------|----------|------|
| 手动创建 | `manual` | 用户自选 | 独立日程事件 |
| 课表导入 | `ics_import` | `#3A8FB7`（天水碧） | .ics 导入的课程 |
| 任务同步 | `task_sync` | `#58A968`（苍艾绿） | 从 tasks.scheduled_at 同步 |

---

## 三、视图设计

### 3.1 周视图（主视图）

- 左侧时间轴：整点标注，0:00 ~ 24:00
- 夜间压缩带（0:00-7:00）：压缩为 10% 高度
- 事件色块：圆角矩形，高度 = 持续时间，内部显示标题+时间
- 今天列高亮背景
- 重叠事件自动分栏（仅真正重叠的事件才分栏）
- 任务同步事件：虚线边框、半透明、不可拖拽
- **拖拽调整时间**：按住事件色块拖动，吸附 30 分钟刻度，显示时间指示线

### 3.2 日视图

- 单天详细时间轴，同样的夜间压缩
- 重叠事件自动分栏
- **拖拽调整时间**（同周视图）
- 顶部显示日期 + 返回按钮（返回月视图或周视图，取决于来源）

### 3.3 月视图

- 7×6 网格，每个格子显示日期 + 最多 3 个事件小条
- 超出显示 "+N 更多"
- 点击某天 → 切到日视图
- 左右翻月

### 3.4 近期视图

- 从当前时刻起算，显示未来 30 天的日程
- 按日期分组，显示时间、颜色条、标题、分类、时长、地点
- "今天" 标记
- 无左右翻页（语义上不需要）

---

## 四、交互设计

### 4.1 创建事件

- 点击时间网格空白区域 → 弹出创建表单（时间自动填入点击位置）
- 导航栏 "+" 按钮 → 弹出完整创建表单
- 表单字段：标题、开始/结束时间、分类（胶囊按钮）、重复规则、地点、描述
- 重复规则：不重复 / 每天 / 每周（可选星期几） / 每月

### 4.2 查看/编辑事件

- 点击事件色块 → 弹出详情弹窗
- 查看模式：标题、时间、地点、描述、重复规则
- 编辑模式：所有字段可修改
- **重复事件编辑**：检测实例 ID，弹出范围选择（只修改这一次 / 修改所有实例）
- 删除：同样支持单次/全部选择
- 任务同步事件：只读

### 4.3 拖拽调整时间

- 周视图和日视图支持
- mousedown 开始拖拽（5px 或 200ms 阈值区分点击/拖拽）
- 实时显示时间指示线 + 时间标签
- mouseup 结束，吸附到 30 分钟刻度
- 保持事件原有时长
- 任务同步事件不可拖拽

### 4.4 筛选

| 筛选 | 逻辑 |
|------|------|
| 全部 | 显示所有事件 |
| 课表 | `category = '课表'` |
| 学习 | `category = '学习'` |
| 娱乐 | `category = '娱乐'` |

### 4.5 .ics 导入

- 导入按钮 → 选择 .ics 文件
- 前端解析 iCal 格式（VEVENT），提取 SUMMARY/DTSTART/DTEND/RRULE/EXDATE/LOCATION/CATEGORIES
- 后端批量写入，按 UID 去重
- 导入完成后刷新显示

### 4.6 系统通知

- 每 60 秒检查一次
- 事件开始前 10 分钟内发送浏览器通知
- 已通知的事件不重复提醒

---

## 五、文件结构

### 后端（Rust）

```
src-tauri/src/
├── db/migrations.rs              ✅ schedules 表完整 schema + 人脉分组名迁移
├── db/repositories/
│   ├── mod.rs                    ✅ 已注册 schedule_repo
│   └── schedule_repo.rs          ✅ CRUD + 范围查询 + DAILY/WEEKLY/MONTHLY rrule 展开 + 任务合并 + add_exdate
├── commands/
│   ├── mod.rs                    ✅ 已注册 schedule_commands
│   └── schedule_commands.rs      ✅ 7 个 Tauri 命令
└── lib.rs                        ✅ 已注册所有 schedule commands
```

**Tauri Commands：**

| 命令 | 说明 |
|------|------|
| `create_schedule` | 创建日程 |
| `get_schedule` | 获取单个日程 |
| `list_schedules_in_range` | 按时间范围查询（展开 rrule + 合并 tasks） |
| `update_schedule` | 更新日程 |
| `delete_schedule` | 删除日程 |
| `add_exdate` | 给重复事件添加排除日期 |
| `import_ics_events` | 批量导入 .ics 事件（UID 去重） |

### 前端（TypeScript）

```
src/
├── types/schedule.ts               ✅ Schedule + CreateScheduleInput + UpdateScheduleInput
├── services/
│   └── scheduleService.ts          ✅ API 封装（含 addExdate, importIcsEvents）
├── stores/
│   └── scheduleStore.ts            ✅ Zustand 状态管理
├── utils/
│   └── icsParser.ts                ✅ .ics 文件解析器
├── services/
│   └── notificationService.ts      ✅ 浏览器通知检测
├── components/schedule/
│   ├── WeekView.tsx                 ✅ 周视图（夜间压缩 + 重叠分栏 + 拖拽）
│   ├── DayView.tsx                  ✅ 日视图（夜间压缩 + 重叠分栏 + 拖拽）
│   ├── MonthView.tsx                ✅ 月视图
│   ├── AgendaView.tsx               ✅ 近期视图
│   ├── EventBlock.tsx               ✅ 事件色块（拖拽 + task_sync 虚线）
│   ├── DateNavigator.tsx            ✅ 日期导航（前翻/后翻/今天/新建/导入）
│   ├── EventForm.tsx                ✅ 创建弹窗（含重复规则选择器）
│   └── EventDetail.tsx              ✅ 详情弹窗（编辑/删除 + 重复事件单次编辑）
└── pages/Schedule/
    └── index.tsx                    ✅ 页面入口（4 视图切换 + 筛选 + 全部交互）
```

---

## 六、布局规范

- 页面根容器：`h-screen overflow-hidden flex flex-col`（固定视口高度）
- 导航栏：`flex-shrink-0`（固定顶部）
- 控制区（筛选/搜索/导航）：`flex-shrink-0`（固定在导航栏下方）
- 内容区：`flex-1 overflow-y-auto`（只有内容滚动）
- 日记页例外：仅 textarea 内部滚动，页面不滚动

---

## 七、已完成的额外优化

- [x] 全局 `user-select: none`（桌面应用感，仅输入框可选）
- [x] 事件色块 `e.preventDefault()` 防止拖拽与文字选择冲突
- [x] 导航标签古风名改为直白名（提灯→助手、尘事→任务、时序→日历、尘笺→日记）
- [x] 任务页分类改为直白名（万象→全部、今辰→今天、圆满→已完成、期许→进行中、迟暮→已过期）
- [x] 人脉页分组改为直白名（至亲→家人、知己→朋友、同窗→同学、共事→同事、恩师→老师）
- [x] 数据库迁移同步更新人脉分组名

---

## 八、设计约束

- **不加 XP**：日历事件不给修为经验，保持任务完成 = 唯一 XP 来源
- **本地优先**：所有数据在 SQLite，不依赖网络
- **色彩统一**：事件色块使用各分类的固定颜色
