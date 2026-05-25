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

### 1. 提灯（首页/AI 对话） — 🔥 进行中

| 层级 | 项目 | 状态 | 说明 |
|------|------|------|------|
| 前端 UI | 聊天界面 | ✅ 完成 | 消息气泡 + 对话列表 + Markdown 渲染 + react-markdown |
| 前端 UI | 历史面板 | ✅ 完成 | 左侧对话列表（新建/切换/删除）+ 首轮后自动生成标题 |
| 前端 UI | 操作确认卡片 | ✅ 完成 | ToolCallCard.tsx，4色卡片系统（绿/黄绿/红/蓝）+ 确认/取消/修改 |
| 前端 UI | 复制/中断按钮 | ✅ 完成 | hover 显示复制按钮 + 发送中显示中断按钮 |
| 后端 | AI 数据库 | ✅ 完成 | ai_conversations + ai_messages（含 reasoning_content 字段） |
| 后端 | AI Provider 接入 | ✅ 完成 | ai/client.rs，OpenAI 兼容格式（DeepSeek/OpenAI/Ollama） |
| 后端 | AI 系统提示词 | ✅ 完成 | prompts.rs，提灯角色 + 能力边界 + 行为规则 + 当前时间注入 |
| 后端 | AI 工具定义 | ✅ 完成 | tools.rs，4个工具：create_task / complete_task / delete_task / search_tasks |
| 后端 | 工具执行调度 | ✅ 完成 | tool_executor.rs，模糊搜索 + 0/1/多条匹配处理 |
| 后端 | AI 命令 | ✅ 完成 | ai_commands.rs，9个命令（CRUD + 发送 + 执行/取消/修改工具调用） |
| 后端 | 标题自动生成 | ✅ 完成 | 首轮对话后调 AI 生成 10 字内标题，更新对话列表 |
| 后端 | AI 记忆系统 | ❌ 未开始 | save_memory / list_memories，设置页管理 |
| 后端 | update_task 工具 | ❌ 未开始 | 修改任务卡片 |
| 后端 | create_schedule 工具 | ❌ 未开始 | 创建日程卡片 |

#### AI 工具层设计（待实现）

**System 提示词要素：**
- 角色：提灯 — 个人人生管理助手
- 能力：任务/日程/日记/人脉/技能管理
- 语气：温暖但不啰嗦，像靠谱的朋友
- 行为：模糊意图先理解再行动，操作数据必须调用工具，回复简洁

**工具清单（6组，暴露给 AI 的接口）：**

| 组 | 工具 | 说明 |
|---|------|------|
| 任务 | create_task / search_tasks / complete_task / delete_task / update_task | ✅ 5个全部实现 |
| 日程 | create_schedule / list_schedules_in_range / update_schedule / delete_schedule | ✅ 4个全部实现 |
| 日记 | get_journal_by_date / save_journal / get_timeline / settle_diary | ✅ 4个全部实现 |
| 人脉 | create_contact / list_contacts / search_contacts / update_contact / delete_contact | ✅ 5个全部实现 |
| 技能 | list_skills / get_task_skills | ✅ 2个全部实现 |
| 日期 | resolve_date | ✅ 日期解析（今天/明天/周几/偏移/月初月末） |
| 记忆 | save_memory / list_memories / delete_memory | AI 记忆系统（独立功能，暂缓） |

**操作确认卡片系统：**

AI 返回消息时可附带 `tool_calls` JSON，前端渲染操作卡片：

```
AI 返回: { content: "帮你创建任务", tool_calls: [{ action: "create_task", params: {...} }] }
    ↓
前端渲染卡片：任务标题/时间/优先级 + [确认] [修改] [取消]
    ↓
用户确认 → 前端调用 Tauri 命令 → 结果回传 AI
```

卡片类型：
- **创建类**：表单预览 + 确认（create_task / create_schedule / create_contact）
- **修改类**：变更对比 + 确认（update_task / update_schedule / update_contact）
- **执行类**：简单确认（complete_task / delete_task / complete_diary）

**AI 记忆系统：**

| 类型 | 存储 | 谁写 | 例子 |
|------|------|------|------|
| 结构化记忆 | settings 表 key=`memory.*` | AI 通过工具写 | `memory.schedule` = "周一到周五 8:00-17:00 有课" |
| 用户管理 | 设置页面展示 | 用户可编辑/删除 | 查看 AI 记了啥，不满意就改 |

记忆工具：save_memory(key, value) / list_memories() / delete_memory(key)

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
- 5个筛选Tab：全部（全部进行中）、今天（今日+过期）、已完成、进行中（未来）、已过期
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
- 日记日省 → 创建虚拟任务，走 complete_task 流程（待实现）
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

### 4. 日历（日程） — ⭐ 已完成

#### 架构决策

- 日历是统一视图，显示三类数据（不同颜色）：任务（自动同步）、课程（.ics导入）、独立事件（手动创建）
- 带日期的任务自动出现在日历上，不需要手动添加按钮
- 课程导入走 .ics 文件，用 WakeUp 等工具导出
- 时间轴用整点，夜间 0:00-7:00 压缩为 10% 高度
- schedules 表和 tasks 表分开，字段差异大
- 重复事件用 iCal RRULE，后端展开为实例，前端不处理 rrule 逻辑
- 重复实例 ID 格式 `{base_id}_{YYYY-MM-DD}`，单次编辑用 exdate + 独立事件

#### 已实现功能

**4种视图：**
- **周视图**：真实日期 + 时间轴 + 事件色块 + 当前时间红线 + 重叠自动分栏 + 拖拽调整时间
- **日视图**：单天详细时间轴 + 重叠分栏 + 拖拽调整时间 + 返回按钮（根据来源返回月/周视图）
- **月视图**：7×6 网格 + 事件预览 + 点击某天进日视图 + 左右翻月
- **近期视图**：从当前时刻起算未来 30 天 + 按日分组 + 无翻页

**事件管理：**
- 创建：点击空白时间段 / "+" 按钮，表单含标题、时间、分类、重复规则、地点、描述
- 查看/编辑：点击事件色块弹出详情弹窗，支持所有字段修改
- 删除：支持删除确认
- 重复事件单次编辑：检测实例 ID，弹出范围选择（只改这一次 / 改所有）
- 拖拽调整：30 分钟吸附 + 实时时间指示线（周视图 + 日视图）

**数据导入/同步：**
- .ics 文件导入：前端解析 iCal + 后端批量写入 + UID 去重
- 任务同步：tasks.scheduled_at 自动出现在日历，虚线边框只读
- 系统通知：浏览器 Notification，事件前 10 分钟提醒

**筛选：** 全部 / 课表 / 学习 / 娱乐

**后端（Rust）：**
- 7 个 Tauri Commands：create/get/list_range/update/delete/add_exdate/import_ics_events
- rrule 展开支持 DAILY / WEEKLY / MONTHLY + UNTIL + COUNT + exdates
- 范围查询同时合并 tasks 表中 scheduled_at 在范围内的未完成任务

#### 相关文件

| 文件 | 说明 |
|------|------|
| `src-tauri/src/db/repositories/schedule_repo.rs` | 日程仓库（CRUD + rrule 展开 + 任务合并 + add_exdate） |
| `src-tauri/src/commands/schedule_commands.rs` | 7个Tauri命令 |
| `src/services/scheduleService.ts` | 前端API封装（含 addExdate, importIcsEvents） |
| `src/stores/scheduleStore.ts` | Zustand状态管理 |
| `src/types/schedule.ts` | TypeScript类型定义 |
| `src/utils/icsParser.ts` | .ics 文件解析器 |
| `src/services/notificationService.ts` | 浏览器通知检测 |
| `src/components/schedule/WeekView.tsx` | 周视图 |
| `src/components/schedule/DayView.tsx` | 日视图 |
| `src/components/schedule/MonthView.tsx` | 月视图 |
| `src/components/schedule/AgendaView.tsx` | 近期视图 |
| `src/components/schedule/EventBlock.tsx` | 事件色块（拖拽 + task_sync 虚线） |
| `src/components/schedule/EventForm.tsx` | 创建弹窗（含重复规则选择器） |
| `src/components/schedule/EventDetail.tsx` | 详情弹窗（含重复事件单次编辑） |
| `src/components/schedule/DateNavigator.tsx` | 日期导航 |
| `src/pages/Schedule/index.tsx` | 页面入口（4视图切换 + 筛选 + 全部交互） |

### 5. 尘笺（日记） — ⭐ 已实现

#### 设计理念
- 日记正文用 `.md` 文件存储，DB 只存元数据索引（数据开放）
- 每天一个文件：`journals/YYYY/MM/YYYY-MM-DD.md`
- 文件含 YAML frontmatter（date, mood, tags, word_count, type）作为 AI 检索坐标
- 用户输入 → 1.5s debounce → 同时写 .md 文件 + 更新 SQLite 元数据
- AI 旁白（"提灯的日记"）存为独立文件 `YYYY-MM-DD-ai.md`，不污染用户日记
- 日省按钮 = 生成入口（触发 AI 写旁白，当前占位）
- 日晷图标 = 查看入口（打开"提灯的日记"面板，纯阅读）

#### 已实现功能
- **后端**：journal_repo.rs（DB CRUD + .md 文件读写含 frontmatter 解析）+ journal_commands.rs（5个Tauri命令）
- **前端**：journalService.ts + journalStore.ts（Zustand，1.5s debounce 自动保存）
- **时间线**：点击日期胶囊弹出月历视图，有日记的日期显示圆点标记，支持月份切换
- **AI 尘笺面板**：日晷图标点击从右滑入，展示提灯的日记（占位，等 AI 接入）
- **日省按钮**：占位提示（触发 AI 生成旁白，未来接入）
- **自动保存**：用户输入 1.5s 后自动写文件 + 更新 DB，切换日期/卸载时强制保存

#### 数据库改动
- journals 表新增 `entry_type TEXT DEFAULT 'user'`（区分用户日记 / AI 旁白）
- journals 表新增 `tags TEXT`（JSON 数组，预留）

#### 相关文件

| 文件 | 说明 |
|------|------|
| `src-tauri/src/db/repositories/journal_repo.rs` | 日记仓库（DB + 文件 I/O） |
| `src-tauri/src/commands/journal_commands.rs` | 5个Tauri命令 |
| `src-tauri/src/db/connection.rs` | 新增 AppDataState |
| `src/types/journal.ts` | TypeScript类型定义 |
| `src/services/journalService.ts` | 前端API封装 |
| `src/stores/journalStore.ts` | Zustand状态管理（自动保存） |
| `src/components/diary/TimelineDropdown.tsx` | 时间线月历组件 |
| `src/components/diary/AiDiaryPanel.tsx` | 提灯的日记面板 |
| `src/pages/Diary/index.tsx` | 日记页面组件 |

### 6. 相识（人脉） — ⭐ 已实现

#### 已实现功能

- **后端**：contact_repo.rs（CRUD + 搜索 + 分组筛选）+ contact_commands.rs（6个Tauri命令）
- **前端**：contactService.ts + contactStore.ts（Zustand）
- **联系人卡片**：2列网格，头像色板（按分组固定颜色），姓名 + 分组标签 + 联系方式预览
- **分类筛选**：胶囊标签（全部/家人/朋友/同学/同事/老师）
- **创建/编辑/删除**：弹窗表单，含姓名、昵称（多昵称）、分组、生日、联系方式（多条）、标签、描述
- **AI 建议**：左下角灯笼按钮打开 AI 建议面板（占位，等 AI 接入）
- **搜索**：按姓名/昵称/描述搜索

#### 相关文件

| 文件 | 说明 |
|------|------|
| `src-tauri/src/db/repositories/contact_repo.rs` | 人脉仓库 |
| `src-tauri/src/commands/contact_commands.rs` | 6个Tauri命令 |
| `src/services/contactService.ts` | 前端API封装 |
| `src/stores/contactStore.ts` | Zustand状态管理 |
| `src/types/contact.ts` | TypeScript类型定义 |
| `src/pages/Relations/index.tsx` | 人脉页面组件 |

### 7. 设置

| 层级 | 项目 | 状态 | 说明 |
|------|------|------|------|
| 前端 UI | 开关/滑块 | ✅ 完成 | 暗色模式、提醒开关（未接状态） |
| 前端 UI | 推荐权重 | ✅ 完成 | 紧急度/价值/成本滑块 → localStorage |
| 前端 UI | AI 设置区块 | ✅ 完成 | API地址/Key/模型/性格配置，持久化到后端 |
| 前端 UI | 导出/清除数据 | ⚠️ 按钮存在 | 无实际逻辑 |
| 数据库 | settings 表 | ✅ 完成 | KV存储, 建表完成 |
| 后端 | setting_repo.rs | ✅ 完成 | get/set/list/delete 操作 |
| 后端 | config_commands.rs | ✅ 完成 | 4个Tauri命令 |
| 前端 | settingService.ts | ✅ 完成 | API封装 |
| 前端 | settingStore.ts | ✅ 完成 | Zustand状态管理 + 启动时从后端加载 |
| 前端 | 设置持久化 | ✅ 完成 | 接入后端替代localStorage |

---

## 三、开发计划（按页面推进）

### 阶段 1: 单页面后端打通

按以下顺序，逐个页面完成 后端repo → commands → 前端service → store → 页面联调：

1. ~~**修为（技能）**~~ — ✅ 已完成
2. ~~**尘笺（日记）**~~ — ✅ 已完成
3. ~~**相识（人脉）**~~ — ✅ 已完成
4. ~~**日历（日程）**~~ — ✅ 已完成（含 rrule 展开 + .ics 导入 + 拖拽 + 通知 + 重复事件单次编辑）
5. **设置** — `setting_repo` + `config_commands` → 前端联调
6. **提灯（AI）** — AI Provider + 工具层 + 对话联调

---

## 四、后端文件清单

```
src-tauri/src/
├── db/repositories/
│   ├── skill_repo.rs      ✅ 已完成
│   ├── task_repo.rs       ✅ 已完成（含 uncomplete_task）
│   ├── journal_repo.rs    ✅ 已完成（DB CRUD + .md 文件读写）
│   ├── schedule_repo.rs   ✅ 已完成（CRUD + rrule 展开 + 任务合并 + add_exdate）
│   ├── contact_repo.rs    ✅ 已完成（CRUD + 搜索 + 分组）
│   ├── setting_repo.rs    ✅ 已完成（get/set/list/delete）
│   └── ai_repo.rs         ✅ 已完成（对话/消息 CRUD + reasoning_content）
├── commands/
│   ├── task_commands.rs      ✅ 已完成（8个命令）
│   ├── skill_commands.rs     ✅ 已完成（3个命令）
│   ├── journal_commands.rs   ✅ 已完成（5个命令）
│   ├── schedule_commands.rs  ✅ 已完成（7个命令）
│   ├── contact_commands.rs   ✅ 已完成（6个命令）
│   ├── config_commands.rs    ✅ 已完成（4个命令）
│   └── ai_commands.rs        ✅ 已完成（9个命令）
├── ai/                       ✅ 已完成
│   ├── tools.rs              ✅ 已完成（4个工具定义）
│   ├── tool_executor.rs      ✅ 已完成（工具执行调度 + 模糊匹配）
│   ├── client.rs             ✅ 已完成（OpenAI兼容 + thinking模式 + 标题生成）
│   └── prompts.rs            ✅ 已完成（系统提示词 + 时间注入 + 用户性格）
└── fs/                       （journal_fs 合并到 journal_repo.rs）
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

### 🔴 技术债（仅剩1项）

| # | 问题 | 严重度 | 说明 |
|---|------|--------|------|
| 1 | ~~**模糊搜索匹配不可靠**~~ | ✅ 已解决 | 分词加权搜索(search_tasks_scored) + 工具增加status/priority筛选 + 多匹配智能分支 |
| 2 | ~~**工具错误处理粗糙**~~ | ✅ 已解决 | 歧义不阻断 + API错误分类汉化(401/429/5xx/网络) + 跟进命令容错 |
| 3 | **提示词膨胀** | 低 | prompts.rs 177行，不算紧急但需定期审视。规则密度上升时 AI 容易忽视中间段规则 |
| 4 | ~~**AI 工具覆盖不全**~~ | ✅ 已解决 | 21个工具覆盖全部5模块 + resolve_date |
| 5 | ~~**日期时间解析不稳定**~~ | ✅ 已解决 | `resolve_date` 工具完整实现（tool_executor.rs），覆盖今天/明天/周几/偏移/月初月末/ISO透传 |

### UI 问题

| 问题 | 说明 |
|------|------|
| **窗口大小不适配** | 当前窗口 800x600，提灯页面左下角灯笼图标显示不出来 |
| **吉祥物位置不统一** | 各页面底部有特殊功能图片（熊猫/灯笼等），位置偏移不一致，需统一为 `absolute bottom-6 left-8` 或类似规范 |

### 未来计划

| 项目 | 优先级 | 说明 |
|------|--------|------|
| ~~日记后端打通~~ | ✅ 完成 | journal_repo + journal_commands + 前端联调 |
| ~~相识后端打通~~ | ✅ 完成 | contact_repo + contact_commands + CRUD + 分类筛选 |
| ~~日历功能~~ | ✅ 完成 | 4视图 + rrule + .ics导入 + 拖拽 + 通知 + 重复事件单次编辑 |
| ~~日记 XP 结算~~ | ✅ 完成 | 日省按钮触发，6维各+1 XP |
| ~~设置后端~~ | ✅ 完成 | setting_repo + config_commands + AI设置区块 |
| ~~AI 基础对话~~ | ✅ 完成 | ai_repo + ai_client + 对话列表 + 消息气泡 + Markdown渲染 |
| ~~AI 系统提示词~~ | ✅ 完成 | prompts.rs: 提灯角色 + 能力 + 规则 + 时间注入 + 农历 + 性格 |
| ~~AI 工具层 + 确认卡片~~ | ✅ 完成 | 4工具 + tool_executor + 4色卡片（含修改按钮） |
| AI 自动标题 | ✅ 完成 | 首轮对话后自动生成10字内标题 |
| AI 修改卡片 | ✅ 完成 | "修改"按钮 → 输入反馈 → AI 重新生成 tool_calls |
| AI 更多工具 | ✅ 完成 | 21个工具覆盖5模块：任务5+日程4+日记4+人脉5+技能2+日期1 |
| ~~农历日期注入~~ | ✅ 完成 | lunardate crate，系统提示词含农历日期（支持闰月） |
| AI 对话收藏夹 | 🔥 进行中 | 收藏AI回复/对话，独立存储，清除聊天不影响收藏 |
| AI 记忆系统 | 下一步 | save_memory / list_memories，设置页管理 |
| AI XP 分配提示词 | 记忆之后 | AI 根据日记内容判断给哪些属性加多少 XP |
| 主题系统 | 远期 | 预设主题 + 自定义配色 + 多彩主题 |
| CLI 化 | 远期 | 暴露命令行入口供外部 AI Agent 调用 |
| 插件系统 | 远期 | 可扩展的模块/工具加载机制 |

### AI 健壮性规划（待实现）

| 场景 | 应对策略 |
|------|----------|
| **API 欠费/不可用** | fallback 到本地规则：固定 XP 值 / 字数计算，AI 内容用占位文案 |
| **AI 输出格式异常** | 定义严格的 JSON schema，解析失败时降级处理，不阻塞用户操作 |
| **生成超时** | 设置合理超时（15s），超时后提示用户稍后重试，已写入的日记不丢失 |
| **提示词版本管理** | 提示词存 settings 表，支持用户自定义，升级时保留用户修改 |
| **多 AI Provider** | 抽象 Provider 层（OpenAI/Anthropic/DeepSeek/Ollama），统一接口，支持切换 |

---

---

## 七、全局优化（2026-05-23）

| 项目 | 说明 |
|------|------|
| **页面布局重构** | `min-h-screen` → `h-screen overflow-hidden`，只有内容区滚动，导航栏和控制区固定 |
| **全局禁止文字选中** | `user-select: none`，仅输入框例外，桌面应用应有的样子 |
| **导航标签直白化** | 提灯→助手、尘事→任务、时序→日历、尘笺→日记 |
| **任务分类直白化** | 万象→全部、今辰→今天、圆满→已完成、期许→进行中、迟暮→已过期 |
| **人脉分组直白化** | 至亲→家人、知己→朋友、同窗→同学、共事→同事、恩师→老师 |
| **数据库迁移** | 人脉分组名同步更新（UPDATE contacts SET group_name = '家人' WHERE group_name = '至亲' 等） |

---

## 八、UI 修复 & 体验优化（2026-05-25）

| 项目 | 说明 |
|------|------|
| **主题色硬编码大扫除** | LanternModal / MascotModal / DropdownMenu / DateNavigator 等组件从 `t.isDark`（页面背景）改为 `cardIsDark`（卡片自身），修复墙角梅等浅卡片深背景主题的文字不可见问题 |
| **自动保存** | TaskDetailPanel + Relations 编辑面板移除保存按钮，字段变更后 600-800ms debounce 自动保存 |
| **农历日期入 AI 提示词** | 新增 lunardate crate，系统提示词注入当前农历日期 |
| **卡片固定高度** | TaskCard h-[130px] + Relations 联系人卡片 h-[110px]，overflow-hidden |
| **清除数据重做** | 日记/AI日省拆分、弹窗缩小可滚动、toast 静置正中无动画 |
| **DeepSeek API 更新** | base URL → api.deepseek.com，模型 → deepseek-v4-flash |
| **日记日期选择器** | TimelineDropdown 改为固定覆盖层，日记框不再跳动 |
| **设置页清理** | 移除 AI 助手性格设置；任务权重描述去"熊猫"化 |

---

*最后更新: 2026-05-25（晚）*