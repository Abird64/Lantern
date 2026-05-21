# 拾阶 - 开发进度跟踪

> 技术栈: Tauri 2 (Rust) + React 19 + TypeScript + SQLite + Zustand
>
> 策略: 前端UI先行 → 逐页面实现后端 → AI大一统

---

## 设计理念

### 1. 数据开放，拒绝私有化

- 日记正文用 `.md` 文件存储，DB 只存元数据索引
- 所有数据可直接从文件系统拖出，不依赖应用本身
- 数据库用 SQLite 单文件，用户可随时用任何工具读取
- 导出优先：支持导出为通用格式（Markdown、JSON、.ics）

### 2. CLI 化 + AI Agent 友好

- 后端 Tauri commands 本身就是函数调用接口，天然可 CLI 化
- 未来暴露 CLI 入口，让其他 AI Agent（Claude、小龙虾等）也能调度工具
- 工具定义遵循标准 Function Calling 格式，外部 Agent 可直接理解
- 目标：不只是一个桌面应用，更是一套可编程的个人数据工具集

### 3. 可扩展，插件化

- 向 Obsidian 学习：核心稳定 + 社区扩展
- 页面/工具层设计为可插拔，未来支持第三方插件
- AI 工具层本身就是扩展点——新工具 = 新功能

### 4. 核心本质

```
Obsidian 的本地优先 + 离线数据理念
    + RPG 的成长反馈系统（XP/属性/等级）
    + AI Agent 的智能调度能力
    + 人生管理系统大融合（任务/日记/日程/人脉/技能）
    = 拾阶
```

---

## 一、基础设施（已完成）

| 项目 | 状态 | 说明 |
|------|------|------|
| Tauri 项目搭建 | ✅ 完成 | 800x600 窗口, com.shijie.app |
| SQLite 初始化 | ✅ 完成 | WAL 模式, 外键约束 |
| 数据库建表迁移 | ✅ 完成 | 10 张表全部建好 (migrations.rs) |
| 前端设计系统 | ✅ 完成 | 主题token、字体、间距、圆角、6色板 |
| UI 组件库 | ✅ 完成 | NavBar, CapsuleTabs, Card, Button, Input, Layout 等 |
| 页面导航 | ✅ 完成 | 6个Tab切换 (DropdownMenu + uiStore) |
| 前端页面UI | ✅ 完成 | 所有6个页面UI设计稿已实现 |

---

## 二、页面实现进度

### 1. 提灯（首页/AI 对话）

| 层级 | 项目 | 状态 | 说明 |
|------|------|------|------|
| 前端 UI | 聊天界面 | ✅ 完成 | 输入框、发送按钮、历史侧栏、灯笼SVG |
| 前端 UI | 历史面板 | ✅ 完成 | 滑入动画 |
| 后端 | AI 对话服务 | ❌ 未开始 | 需实现 ai_conversations + ai_messages |
| 后端 | AI Provider 接入 | ❌ 未开始 | 支持 OpenAI/Anthropic/DeepSeek/Ollama |
| 后端 | AI 工具层 | ❌ 未开始 | 6组工具定义 (tasks/skills/journals/schedules/contacts/config) |
| 前端 | 对话功能联调 | ❌ 未开始 | 发送消息、展示回复、工具调用结果展示 |

### 2. 尘事（任务） — ⭐ 已打磨完成

#### 任务属性（17个字段）

| 字段 | 类型 | 前端可编辑 | 说明 |
|------|------|-----------|------|
| `id` | string | - | nanoid 自动生成 |
| `parent_id` | string/null | ✅ | 父任务ID，子任务可创建/展示 |
| `title` | string | ✅ | 标题 |
| `description` | string/null | ✅ | 描述 |
| `status` | pending/in_progress/completed/cancelled | ✅ | 详情面板4种状态切换 + 取消完成（撤回XP） |
| `priority` | high/medium/low/none | ✅ | 紧急/重要/一般 |
| `scheduled_at` | ISO8601 | ✅ | 计划开始时间 |
| `deadline` | ISO8601 | ✅ | 截止时间 |
| `completed_at` | ISO8601 | - | 完成时自动写入，取消完成时清空 |
| `xp_earned` | number | - | 完成时自动计算，取消完成时归零 |
| `estimated_minutes` | number | ✅ | 预估耗时 |
| `notes` | string/null | ✅ | 备注 |
| `tags` | string (JSON数组) | ✅ | 回车添加 chip，卡片展示 |
| `sort_order` | number | ❌ | 前端无拖拽排序 |
| `created_at` | ISO8601 | - | 自动 |
| `updated_at` | ISO8601 | - | 自动 |

#### 已实现功能

**前端UI：**
- 任务卡片列表（2列网格），五边形图标 + 标题 + 日期 + 优先级标签 + XP + 过期标记 + 标签
- 5个筛选Tab：万象（全部进行中）、今辰（今日+过期）、圆满（已完成）、期许（未来）、迟暮（已过期）
- **搜索框**：本地过滤 title/description/notes
- **排序**：按创建时间/截止时间/优先级排序（下拉菜单）
- **创建任务弹窗**：标题、截止时间、优先级；展开更多：计划开始、预估耗时、描述、标签、**属性加成（6维XP分配）**
- **任务详情侧滑面板**：标题/描述/状态切换/优先级/计划时间/截止时间/预估耗时/备注/标签/**属性加成**
- **子任务**：卡片底部展开/收起子任务列表；详情面板子任务管理 + 快速添加
- **批量操作**：多选按钮 → checkbox 勾选 → 底部操作栏（全选/批量完成/批量删除）
- 快速完成（hover 显示勾按钮）
- **取消完成**：已完成任务详情面板显示"取消完成 -XP"按钮，撤回XP
- 熊猫推荐按钮：紧迫度×权重 + 价值×权重 + 成本×权重打分推荐最优任务（气泡显示在右侧）

**后端（Rust）：**
- `create_task` / `get_task` / `list_tasks` / `update_task` / `delete_task` / `complete_task` / `uncomplete_task` / `search_tasks`
- `complete_task` 事务性XP分配：查 task_skills → 更新 skills.total_xp → 写入 skill_events（正值）
- `uncomplete_task` 事务性XP撤回：查 task_skills → 回退 skills.total_xp → 写入 skill_events（负值）→ 重置任务状态
- `delete_task` 支持 cascade（级联删除子任务）或解除子任务关联
- `list_tasks` 支持按 status 和 parent_id 筛选

#### 待打磨（不急）

| 项目 | 说明 |
|------|------|
| **拖拽排序** | sort_order 字段存在，前端无拖拽排序交互 |
| **标签筛选** | 标签可编辑可展示，但无按标签筛选功能 |

#### 相关文件

| 文件 | 说明 |
|------|------|
| `src-tauri/src/db/repositories/task_repo.rs` | 后端任务仓库（含 complete_task / uncomplete_task） |
| `src-tauri/src/commands/task_commands.rs` | 8个Tauri命令 |
| `src/services/taskService.ts` | 前端API封装 |
| `src/stores/taskStore.ts` | Zustand状态管理 |
| `src/types/task.ts` | TypeScript类型定义 |
| `src/utils/scoring.ts` | 任务推荐评分算法 |
| `src/pages/Tasks/index.tsx` | 任务页面组件 (~1400行) |

### 3. 修为（六维属性） — ⭐ 已实现

#### 六维属性

| ID | 名称 | 颜色 | 说明 |
|----|------|------|------|
| knowledge | 学识 | #3A8FB7 天水碧 | |
| physique | 筋骨 | #4B7F52 苍艾绿 | |
| charm | 风华 | #C83C3C 朱砂红 | |
| talent | 才情 | #E8B959 缃叶黄 | |
| worldliness | 入世 | #B87353 檀木棕 | |
| cultivation | 修为 | #8A6DA7 紫菂色 | |

#### 已实现功能

- **后端**：skill_repo.rs（list/get/set_task_skills, initialize_default_skills）+ skill_commands.rs（3个Tauri命令）
- **前端**：skillService.ts + skillStore.ts + types/skill.ts
- **创建/详情面板**：3x2 网格的属性加成 XP 输入
- **修为页面**：RPG 风格角色面板，6张属性卡片（Lv.N + XP 进度条 + 总计XP），每100XP升1级
- **数据库初始化**：启动时自动 INSERT OR IGNORE 6个默认技能

#### XP 规则

- 完成任务 → `skill_events` 写入正值 + `skills.total_xp` 增加
- 取消完成 → `skill_events` 写入负值 + `skills.total_xp` 回退
- 日记日醒 → 创建虚拟任务，走 complete_task 流程（待实现）
- 日历事件 → **不加 XP**

#### 相关文件

| 文件 | 说明 |
|------|------|
| `src-tauri/src/db/repositories/skill_repo.rs` | 技能仓库 |
| `src-tauri/src/commands/skill_commands.rs` | 3个Tauri命令 |
| `src/services/skillService.ts` | 前端API封装 |
| `src/stores/skillStore.ts` | Zustand状态管理 |
| `src/types/skill.ts` | TypeScript类型定义 |
| `src/pages/Skills/index.tsx` | 修为页面组件 |
| `src/styles/theme.ts` | SKILL_COLORS + themes.skills |

### 4. 时序（日程/日历）

#### 架构决策

- 日历是统一视图，显示三类数据（不同颜色）：任务（自动同步）、课程（.ics导入）、独立事件（手动创建）
- 带日期的任务自动出现在日历上，不需要手动添加按钮
- 课程导入走 .ics 文件（MVP），用 WakeUp 等工具解析
- 时间轴用整点，夜间 23:00-7:00 压缩显示
- schedules 表和 tasks 表分开，字段差异大

| 层级 | 项目 | 状态 | 说明 |
|------|------|------|------|
| 数据库 | schedules 表 | ✅ 完成 | 含 rrule, reminder 字段 |
| 前端 UI | 周历网格 | ✅ 完成 | 静态mock, 筛选按钮 |
| 前端 UI | 日程显示 | ❌ 未开始 | 无事件渲染 |
| 前端 UI | 创建/编辑日程 | ❌ 未开始 | |
| 后端 | schedule_repo.rs | ❌ 未开始 | CRUD + rrule展开 |
| 后端 | schedule_commands.rs | ❌ 未开始 | Tauri命令 |
| 前端 | scheduleService.ts | ❌ 未开始 | API封装 |
| 前端 | scheduleStore.ts | ❌ 未开始 | Zustand状态管理 |

### 5. 尘笺（日记）

| 层级 | 项目 | 状态 | 说明 |
|------|------|------|------|
| 数据库 | journals 表 | ✅ 完成 | 元数据, 含 mood, word_count |
| 前端 UI | 编辑器 | ✅ 完成 | 静态textarea + 日期 + 日省按钮 |
| 前端 UI | 日记列表 | ❌ 未开始 | 无列表/搜索 |
| 前端 UI | 心情选择 | ❌ 未开始 | |
| 后端 | journal_repo.rs | ❌ 未开始 | CRUD |
| 后端 | journal_commands.rs | ❌ 未开始 | Tauri命令 |
| 后端 | journal_fs.rs | ❌ 未开始 | .md文件读写 |
| 前端 | journalService.ts | ❌ 未开始 | API封装 |
| 前端 | journalStore.ts | ❌ 未开始 | Zustand状态管理 |

### 6. 相识（人脉）

| 层级 | 项目 | 状态 | 说明 |
|------|------|------|------|
| 数据库 | contacts + 关联表 | ✅ 完成 | contacts, diary_contacts, task_contacts |
| 前端 UI | 联系人卡片 | ✅ 完成 | 分类筛选Tab, mock数据展示 |
| 前端 UI | CRUD交互 | ❌ 未开始 | 创建/编辑/删除联系人 |
| 前端 UI | 关联日记/任务 | ❌ 未开始 | |
| 后端 | contact_repo.rs | ❌ 未开始 | CRUD + 关联管理 |
| 后端 | contact_commands.rs | ❌ 未开始 | Tauri命令 |
| 前端 | contactService.ts | ❌ 未开始 | API封装 |
| 前端 | contactStore.ts | ❌ 未开始 | Zustand状态管理 |

### 7. 设置

| 层级 | 项目 | 状态 | 说明 |
|------|------|------|------|
| 前端 UI | 开关/滑块 | ✅ 完成 | 暗色模式、提醒开关（未接状态） |
| 前端 UI | 推荐权重 | ✅ 完成 | 紧急度/价值/成本滑块 → localStorage |
| 前端 UI | 导出/清除数据 | ⚠️ 按钮存在 | 无实际逻辑 |
| 数据库 | settings 表 | ✅ 完成 | KV存储, 建表完成 |
| 后端 | setting_repo.rs | ❌ 未开始 | get/set 操作 |
| 后端 | config_commands.rs | ❌ 未开始 | Tauri命令 |
| 前端 | settingService.ts | ❌ 未开始 | API封装 |
| 前端 | 设置持久化 | ❌ 未开始 | 接入后端替代localStorage |

---

## 三、开发计划（按页面推进）

### 阶段 1: 单页面后端打通

按以下顺序，逐个页面完成 后端repo → commands → 前端service → store → 页面联调：

1. ~~**修为（技能）**~~ — ✅ 已完成
2. **尘笺（日记）** — `journal_repo` + `journal_fs` + `journal_commands` → 前端联调
3. **相识（人脉）** — `contact_repo` + `contact_commands` → 前端联调
4. **时序（日历）** — `schedule_repo` + `schedule_commands` → 前端联调 + .ics导入
5. **设置** — `setting_repo` + `config_commands` → 前端联调
6. **提灯（AI）** — AI Provider + 工具层 + 对话联调

---

## 四、后端文件清单（待创建）

```
src-tauri/src/
├── db/repositories/
│   ├── skill_repo.rs      ✅ 已完成
│   ├── task_repo.rs       ✅ 已完成（含 uncomplete_task）
│   ├── journal_repo.rs    ❌
│   ├── schedule_repo.rs   ❌
│   ├── contact_repo.rs    ❌
│   └── setting_repo.rs    ❌
├── commands/
│   ├── task_commands.rs      ✅ 已完成（8个命令）
│   ├── skill_commands.rs     ✅ 已完成（3个命令）
│   ├── journal_commands.rs   ❌
│   ├── schedule_commands.rs  ❌
│   ├── contact_commands.rs   ❌
│   └── config_commands.rs    ❌
├── ai/                       ❌ 整个目录
│   ├── tools.rs
│   ├── tool_executor.rs
│   ├── client.rs
│   └── prompts.rs
└── fs/
    └── journal_fs.rs         ❌
```

---

## 五、数据库表对应关系

| 表 | 用途 | 关键字段 |
|---|---|---|
| tasks | 任务 | status, priority, xp_earned, estimated_minutes |
| schedules | 日程/课程/事件 | rrule, reminder, end_at, is_all_day |
| skills | 六维属性 | name, color, total_xp, level |
| task_skills | 任务-属性关联 | task_id, skill_id, xp_amount |
| skill_events | XP流水账本（真相源） | skill_id, xp_amount, source_type, source_id |
| journals | 日记元数据 | title, file_path, mood, journal_date |
| contacts | 人脉 | name, group_name, birthday, contact_info |
| diary_contacts | 日记-人脉关联 | journal_id, contact_id |
| task_contacts | 任务-人脉关联 | task_id, contact_id |
| settings | 配置KV | key, value |

---

## 六、已知问题 & 待处理

### UI 问题

| 问题 | 说明 |
|------|------|
| **窗口大小不适配** | 当前窗口 800x600，提灯页面左下角灯笼图标显示不出来 |
| **吉祥物位置不统一** | 各页面底部有特殊功能图片（熊猫/灯笼等），位置偏移不一致，需统一为 `absolute bottom-6 left-8` 或类似规范 |

### 未来计划

| 项目 | 优先级 | 说明 |
|------|--------|------|
| 日记后端打通 | 下一步 | journal_repo + journal_fs + journal_commands |
| 日记日醒加 XP | 日记完成后 | 创建虚拟任务走 complete_task 流程 |
| 相识后端打通 | 日记之后 | contact_repo + contact_commands |
| 日历后端 | 相识之后 | schedule_repo + rrule 解析 + .ics 导入 |
| CLI 化 | 远期 | 暴露命令行入口供外部 AI Agent 调用 |
| 插件系统 | 远期 | 可扩展的模块/工具加载机制 |
| 课程表 .ics 导入 | 日历时 | 支持从 WakeUp 等工具导入 iCal 文件 |

---

*最后更新: 2026-05-22*
