# 拾阶技术架构文档 (Tech Spec)

**版本**：v0.1  
**日期**：2026-03-25  
**目标**：为拾阶应用提供详细的技术实现指导

---

## 1. 技术栈总览

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| 桌面框架 | Tauri | v2 (beta) | Rust核心 + Web前端，支持后续移动端 |
| 前端框架 | React | v18+ | 组件化开发，生态丰富 |
| 语言 | TypeScript | v5+ | 类型安全，AI辅助友好 |
| 构建工具 | Vite | v5+ | Tauri默认集成，开发体验好 |
| 状态管理 | Zustand | v4+ | 轻量，无样板代码 |
| 路由 | React Router | v6+ | 声明式路由 |
| UI组件 | Radix UI + Tailwind | - | 无样式组件 + 原子CSS |
| Markdown | Milkdown | v7+ | 基于ProseMirror，可扩展 |
| 数据库 | SQLite | - | 单文件，零配置 |
| 日期处理 | date-fns | v3+ | 模块化，Tree-shaking友好 |
| UUID | nanoid | v5+ | 轻量，URL友好 |
| 图标 | Lucide React | - | 统一图标库 |

---

## 2. 项目结构

```
shijie/                          # 项目根目录
├── .vscode/                     # VS Code配置
│   ├── extensions.json          # 推荐插件
│   ├── settings.json            # 编辑器设置
│   └── tasks.json               # 调试任务
├── src/                         # 前端源码
│   ├── main.tsx                 # 应用入口
│   ├── App.tsx                  # 根组件
│   ├── components/              # 通用组件
│   │   ├── ui/                  # 基础UI组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Toast.tsx        # XP反馈Toast
│   │   │   └── ...
│   │   ├── task/                # 任务相关组件
│   │   │   ├── TaskItem.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskTree.tsx
│   │   │   └── TaskForm.tsx
│   │   ├── ai/                  # AI相关组件
│   │   │   ├── AIInput.tsx
│   │   │   ├── TaskBreakdown.tsx
│   │   │   ├── SkillDiscovery.tsx  # 技能发现展示
│   │   │   └── LoadingState.tsx
│   │   ├── skill/               # 技能相关组件
│   │   │   ├── SkillCard.tsx
│   │   │   ├── SkillList.tsx
│   │   │   └── SkillProgress.tsx
│   │   └── layout/              # 布局组件
│   │       ├── AppShell.tsx
│   │       ├── BottomNav.tsx
│   │       └── Header.tsx
│   ├── pages/                   # 页面组件
│   │   ├── Home/                # AI入口页
│   │   │   └── index.tsx
│   │   ├── Tasks/               # 任务管理页
│   │   │   └── index.tsx
│   │   ├── Skills/              # 技能面板页
│   │   │   └── index.tsx
│   │   └── Settings/            # 设置页
│   │       └── index.tsx
│   ├── hooks/                   # 自定义Hooks
│   │   ├── useTasks.ts          # 任务相关操作
│   │   ├── useSkills.ts         # 技能相关操作
│   │   ├── useAI.ts             # AI服务调用
│   │   ├── useToast.ts          # Toast反馈
│   │   └── useConfig.ts         # 配置管理
│   ├── stores/                  # Zustand状态
│   │   ├── taskStore.ts
│   │   ├── skillStore.ts
│   │   ├── aiStore.ts
│   │   ├── uiStore.ts
│   │   └── configStore.ts
│   ├── services/                # 服务层
│   │   ├── ai/                  # AI服务
│   │   │   ├── index.ts
│   │   │   ├── openai.ts
│   │   │   ├── ollama.ts
│   │   │   └── prompts.ts       # Prompt模板
│   │   └── db/                  # 数据库服务
│   │       ├── index.ts
│   │       ├── tasks.ts
│   │       └── skills.ts
│   ├── utils/                   # 工具函数
│   │   ├── date.ts              # 日期处理
│   │   ├── uuid.ts              # ID生成
│   │   ├── xp.ts                # XP计算
│   │   ├── validate.ts          # 数据验证
│   │   └── storage.ts           # 本地存储
│   ├── types/                   # TypeScript类型
│   │   ├── task.ts
│   │   ├── skill.ts
│   │   ├── ai.ts
│   │   └── index.ts
│   ├── styles/                  # 样式文件
│   │   └── global.css
│   └── assets/                  # 静态资源
│       ├── logo.svg
│       └── icons/
├── src-tauri/                   # Rust后端
│   ├── src/
│   │   ├── main.rs              # 应用入口
│   │   ├── lib.rs               # 库导出
│   │   ├── commands/            # Tauri命令
│   │   │   ├── mod.rs
│   │   │   ├── task.rs          # 任务相关命令
│   │   │   ├── skill.rs         # 技能相关命令
│   │   │   ├── ai.rs            # AI相关命令
│   │   │   └── config.rs        # 配置命令
│   │   ├── models/              # 数据模型
│   │   │   ├── mod.rs
│   │   │   ├── task.rs
│   │   │   └── skill.rs
│   │   ├── db/                  # 数据库模块
│   │   │   ├── mod.rs
│   │   │   ├── connection.rs    # 连接管理
│   │   │   ├── migrations.rs    # 迁移脚本
│   │   │   └── repositories/    # 数据访问层
│   │   │       ├── mod.rs
│   │   │       ├── task_repo.rs
│   │   │       └── skill_repo.rs
│   │   ├── ai/                  # AI服务模块
│   │   │   ├── mod.rs
│   │   │   ├── client.rs        # HTTP客户端
│   │   │   ├── parser.rs        # 响应解析
│   │   │   ├── fallback.rs      # 降级策略
│   │   │   └── error.rs         # 错误处理
│   │   ├── fs/                  # 文件系统
│   │   │   ├── mod.rs
│   │   │   └── journal.rs       # 日记文件操作
│   │   └── config/              # 配置管理
│   │       ├── mod.rs
│   │       └── settings.rs
│   ├── Cargo.toml               # Rust依赖
│   ├── build.rs                 # 构建脚本
│   └── tauri.conf.json          # Tauri配置
├── public/                      # 公共资源
├── docs/                        # 文档
│   ├── PRD.md
│   └── TECH_SPEC.md
├── scripts/                     # 辅助脚本
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 3. 前端架构详解

### 3.1 组件分层

```
┌─────────────────────────────────────┐
│           Page Components           │  页面级，负责数据获取和布局
│    (Home, Tasks, Skills...)         │
├─────────────────────────────────────┤
│         Feature Components          │  功能级，业务逻辑封装
│  (TaskBreakdown, SkillDiscovery)    │
├─────────────────────────────────────┤
│          UI Components              │  基础UI，无业务逻辑
│    (Button, Input, Card, Toast)     │
└─────────────────────────────────────┘
```

### 3.2 状态管理策略

**Zustand Store设计**：

```typescript
// stores/taskStore.ts
import { create } from 'zustand';
import { Task, TaskFilter } from '@/types/task';

interface TaskState {
  // 状态
  tasks: Task[];
  filter: TaskFilter;
  isLoading: boolean;
  error: string | null;
  
  // 派生状态
  filteredTasks: () => Task[];
  todayTasks: () => Task[];
  completedTodayCount: () => number;
  
  // 操作
  fetchTasks: () => Promise<void>;
  createTask: (input: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<{ skills: SkillXp[] }>;
  setFilter: (filter: TaskFilter) => void;
}

// stores/skillStore.ts
import { create } from 'zustand';
import { Skill } from '@/types/skill';

interface SkillState {
  skills: Skill[];
  isLoading: boolean;
  
  // 派生状态
  topSkills: (limit: number) => Skill[];
  totalXp: () => number;
  
  // 操作
  fetchSkills: () => Promise<void>;
  addXp: (skillId: string, xp: number) => void;
  createSkill: (name: string, description: string) => Promise<Skill>;
  mergeSkills: (fromId: string, toId: string) => Promise<void>;
}
```

### 3.3 前端-后端通信

**Tauri Invoke封装**：

```typescript
// services/tauri.ts
import { invoke } from '@tauri-apps/api/core';

export async function tauriInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>
): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    console.error(`Tauri invoke failed: ${cmd}`, error);
    throw error;
  }
}

// 类型安全的命令调用
export const commands = {
  // 任务
  getTasks: () => tauriInvoke<Task[]>('get_tasks'),
  createTask: (input: string) => tauriInvoke<CreateTaskResult>('create_task', { input }),
  updateTask: (id: string, updates: Partial<Task>) => 
    tauriInvoke<void>('update_task', { id, updates }),
  deleteTask: (id: string) => tauriInvoke<void>('delete_task', { id }),
  completeTask: (id: string) => tauriInvoke<CompleteTaskResult>('complete_task', { id }),
  
  // 技能
  getSkills: () => tauriInvoke<Skill[]>('get_skills'),
  createSkill: (name: string, description: string) => 
    tauriInvoke<Skill>('create_skill', { name, description }),
  mergeSkills: (fromId: string, toId: string) => 
    tauriInvoke<void>('merge_skills', { fromId, toId }),
  
  // AI
  breakdownTask: (input: string) => 
    tauriInvoke<BreakdownResult>('