# CLAUDE.md

## 项目

提灯 - Tauri 2 桌面/移动应用，本地优先的 AI 驱动人生管理系统。

## 常用命令

```bash
cd shijie
npm install              # 安装前端依赖
npm run tauri dev        # 开发模式（Vite HMR + Tauri 窗口）
npm run tauri build      # 生产构建 + 打包安装程序
npx tsc --noEmit         # TypeScript 类型检查
cd src-tauri && cargo check  # Rust 编译检查
```

## 架构概览

```
src-tauri/src/
  lib.rs              # Tauri 应用启动，注册所有 command
  main.rs             # 入口，隐藏 Windows 控制台
  ai/                 # AI 子系统
    client.rs         # HTTP 客户端（OpenAI 兼容 API）
    prompts.rs        # 系统提示词模板
    tools.rs          # 47 个工具定义
    tool_executor.rs  # 工具执行引擎
  commands/           # Tauri IPC command 层
    ai_commands.rs    # AI 对话/收藏
    task_commands.rs  # 任务 CRUD
    schedule_commands.rs  # 日程 CRUD + ICS 导入导出
    journal_commands.rs   # 日记读写 + XP 结算
    contact_commands.rs   # 人脉 CRUD
    skill_commands.rs     # 技能查询
    config_commands.rs    # 设置读写
    favorite_commands.rs  # 对话收藏
    habit_commands.rs     # 习惯打卡
    memory_commands.rs    # AI 记忆
    sync_commands.rs      # WebDAV 同步
  db/
    connection.rs     # SQLite 连接 + WAL 模式
    migrations.rs     # 数据库迁移
    repositories/     # Repository 层（每表一个文件）
  sync/
    sync_engine.rs    # 快照同步引擎
    webdav_client.rs  # WebDAV 客户端

src/
  components/         # 通用 UI 组件
    ai/               # AI 对话组件（ChatView）
    layout/           # 布局组件（NavBar, BottomTabBar, PageContainer）
    dashboard/        # 看板卡片组件
    diary/            # 日记组件（ReflectionPanel）
    habits/           # 习惯组件
    tasks/            # 任务组件
    schedule/         # 日程组件
    skills/           # 成长组件
    relations/        # 联系人组件
    ui/               # 基础 UI（Card, Button, LanternSvg, LanternIcon 等）
  pages/              # 页面（Home, Dashboard, Tasks, Schedule, Diary, Relations, Skills, Habits, Memories, Settings, Mine）
  services/           # 前端 → Tauri command 桥接
  stores/             # Zustand stores（每个模块一个 store + UI store）
  styles/             # 主题配置（theme.ts + global.css）
  types/              # TypeScript 类型定义
  hooks/              # 自定义 hooks
```

## 开发注意事项

### Oxc 解析器
- 项目使用 oxc（Vite 8 默认，非 SWC）
- **oxc 对 JSX 嵌套解析有限制**：深层嵌套的三元表达式会报错
- **规避方式**：提取子组件 + 确保每个标签正确闭合
- ChatView 已从 HomePage 中提取出来（2026-05-25）

### 设计系统
- 字体：SF Pro Display / SF Pro Text + system-ui（Apple 风格系统字体栈）
- 圆角胶囊风格，8px 间距网格
- 统一主题系统（亮色/暗色），通过 themeStore 管理
- 自定义无边框窗口（decorations: false），移动端用系统状态栏
- 导航：底部 TabBar（提灯/看板/日历/我的）+ 子页面路由

### AI 工具设计
- 写操作（create/update/delete）→ 弹出确认卡片，用户确认后执行
- 读操作（search/list/get）→ 自动执行，不打断对话
- 卡片分 4 色：确认（绿）/ 修改（蓝）/ 取消（红）/ 结果（灰）

### 数据存储原则
- 日记用 `.md` 文件存储（文件系统为真相源，DB 仅存索引）
- 其他数据用 SQLite，单文件 `lantern.db`
- 用户可随时用外部工具读取所有数据
- 多端同步：坚果云 WebDAV，快照式全量同步
