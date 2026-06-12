# 提灯 · 移动端方案

> 状态：Phase 1（响应式 UI）和 Phase 3（WebDAV 同步）已完成，准备进入 Phase 2（Android 跑通）
>
> 最后更新：2026-05-31

---

## 一、总体路线

**Tauri Mobile + 共享代码库**。在现有仓库里加 Android target，Rust 后端 100% 复用，前端 UI 做响应式适配。暂不做 iOS。

核心决策：

| 决策 | 选型 | 理由 |
|------|------|------|
| 跨平台方案 | Tauri Mobile（路线 A） | 唯一不背叛"本地优先"理念、不造成双倍维护成本的方案 |
| 数据同步 | 坚果云 WebDAV，全量同步 | 数据库 + 日记文件全部同步，不区分粒度。国内唯一稳定 WebDAV |
| UI 策略 | 复用现有 UI + 响应式适配 | 共享组件/Zustand stores/services，只加移动端布局 |
| 移动端 AI | 保留完整对话功能 | 不做阉割，和桌面端一样的聊天体验 |
| 系统日历 | 双向读写 Android 系统日历 | 提灯日程 ↔ 手机日历互相打通 |
| 小组件 | Android App Widget | 桌面小组件展示今日任务/日程/XP |
| 平台范围 | Android only | 不需要 macOS/Xcode/开发者账号，降低门槛 |

---

## 二、架构总览

```
                    ┌──────────────────────┐
                    │    坚果云 WebDAV       │
                    │  dav.jianguoyun.com   │
                    └──────┬───────────────┘
                           │ HTTP PUT/GET/PROPFIND
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ 桌面端    │ │ 手机端    │ │ 未来...   │
        │ Windows  │ │ Android  │ │ macOS/iOS│
        └──────────┘ └──────────┘ └──────────┘
              │            │
        共享同一套代码：
        ├── Rust 后端（commands, db, ai, sync）
        ├── React 前端（pages, components, stores, services）
        └── 差异仅在于 UI 布局层
```

**关键原则**：桌面端和移动端永远共享同一份数据真相源（`lantern.db` + `journals/`），通过 WebDAV 在两端之间同步。没有"主"端和"从"端的区别——两边地位平等，都可以读写真数据。

---

## 三、数据同步设计

### 3.1 同步内容

| 数据 | 存储形式 | 同步方式 | 大小估算 |
|------|----------|----------|----------|
| 主数据库 | `lantern.db`（单文件 SQLite） | 整文件上传/下载 | < 10 MB |
| 日记文件 | `journals/YYYY/MM/YYYY-MM-DD.md` | 逐文件比较时间戳 | 每篇 < 50 KB |

### 3.2 同步流程

```
启动应用
  │
  ├─→ 1. 检查是否配置了 WebDAV 凭据
  │      └─ 未配置 → 跳过同步，正常使用
  │
  ├─→ 2. SQLite WAL Checkpoint
  │      PRAGMA wal_checkpoint(TRUNCATE);
  │      （合并 WAL 到主文件，确保单文件完整）
  │
  ├─→ 3. 获取远程文件信息
  │      PROPFIND /dav/lantern/lantern.db
  │      获取 etag + last_modified
  │
  ├─→ 4. 冲突检测
  │      ┌──────────────┬──────────────┬─────────────────────┐
  │      │ 本地状态      │ 远程状态      │ 处理                 │
  │      ├──────────────┼──────────────┼─────────────────────┤
  │      │ 未变          │ 未变          │ 跳过                 │
  │      │ 有修改        │ 未变          │ 上传（本地→远程）     │
  │      │ 未变          │ 有修改        │ 下载（远程→本地）     │
  │      │ 有修改        │ 有修改        │ 冲突 → 见 3.3        │
  │      └──────────────┴──────────────┴─────────────────────┘
  │
  ├─→ 5. 执行同步（上传/下载）
  │      PUT / GET 操作
  │      更新本地记录的 etag
  │
  ├─→ 6. 同步日记文件
  │      逐文件比较 last_modified
  │      新文件/有变更 → 上传或下载
  │
  └─→ 7. 记录同步时间戳
         settings.sync.last_sync_at
         settings.sync.last_remote_etag
```

### 3.3 冲突处理

当本地和远程自上次同步以来都有修改时：

```
1. 保留本地版本不动
2. 下载远程版本，命名为 lantern.db.conflict_{timestamp}
3. 前端弹出冲突提醒："两端数据都有修改，已保留两份。
   请在设置 → 同步 → 冲突管理中手动处理。"
4. 用户手动选择：
   - 保留本地，丢弃远程
   - 保留远程，丢弃本地
   - （远期）逐表合并
```

**冲突应该是小概率事件**。用户通常不会同时在两台设备上改了数据还不同步。如果真发生，先保底不丢数据，再考虑智能合并。

### 3.4 WAL 模式与同步

SQLite WAL 模式会产生 3 个文件：

```
lantern.db          ← 主数据库
lantern.db-wal      ← 预写日志（未合并的写入）
lantern.db-shm      ← 共享内存索引
```

同步前必须执行 `PRAGMA wal_checkpoint(TRUNCATE)`，将 WAL 内容合并回主文件并清空 WAL。否则 WAL 内的数据不会被同步，造成数据丢失。

对性能的影响可以忽略——桌面端和移动端都是本地 SQLite，checkpoint 通常在毫秒级完成。

### 3.5 凭据管理

**已实现**。settings 表中实际使用的 key：

```
sync.url          → "https://dav.jianguoyun.com/dav/"
sync.username     → "your@email.com"
sync.password     → "app_token"（坚果云第三方应用密码，非登录密码）
sync.remote_path  → "/lantern/"（默认值）
sync.enabled      → "true" / "false"
sync.interval_minutes → "30"（后台同步间隔）
sync.last_sync_at → ISO8601 timestamp
```

坚果云 WebDAV 需要**第三方应用密码**（在坚果云设置里生成），不能用主密码。

### 3.6 同步时机

| 时机 | 桌面端 | 移动端 |
|------|--------|--------|
| 应用启动 | 自动同步 | 自动同步 |
| 应用关闭 | 自动推送 | 自动推送 |
| 手动 | `sync_now` command | `sync_now` command |
| 后台定时 | 每 30 分钟（`spawn_background_sync`） | ❌（移动端后台受限） |
| 从后台恢复 | N/A | 自动拉取（待实现） |

**已实现**：启动时 spawn 后台同步循环，每 30 分钟执行一次（可通过 `sync.interval_minutes` 配置），检查 `sync.enabled` 开关。

**待实现**：应用关闭时自动推送。桌面端监听窗口关闭事件，移动端监听 `onPause`/`onStop` 生命周期。

移动端不做后台定时同步——Android 会杀后台进程，强行做反而不可靠。启动/关闭/手动三点覆盖已足够。

### 3.7 Rust 模块（已实现）

```
src-tauri/src/
  sync/
    mod.rs             # 模块声明
    sync_engine.rs     # 同步调度 + 冲突处理 + 日记同步（645 行）
    webdav_client.rs   # WebDAV 客户端 PROPFIND/GET/PUT/DELETE/MKCOL（375 行）
  commands/
    sync_commands.rs   # Tauri command：sync_now / sync_get_status / sync_test_connection（107 行）
```

全部使用已有的 `reqwest` crate，未加新依赖。

---

## 四、响应式 UI 方案

### 4.1 原则

- **不改逻辑，只加布局**。Zustand stores、services、组件内部状态管理原封不动。
- **组件复用**。底层组件（表单、卡片、列表项、弹窗）不需要改，只有页面级布局需要响应式。
- **用 Tailwind 断点**。`sm:` / `md:` / `lg:` 前缀，以 768px 为桌面/移动分界。
- **移动端用底部 tab bar**，桌面端保留现有的浮动下拉菜单。
- **设计语言统一**。移动端沿用"夜萤"暗色设计（详见 DESIGN.md）：深色底 #0F1412、萤火绿 #4CAF76、玻璃态卡片。

### 4.2 导航改造

**当前状态（已完成）**：4 tab BottomTabBar + 子页面跳转模式。

| Tab | 标签 | 对应页面 |
|-----|------|----------|
| `chat` | 提灯 | Home（AI 对话） |
| `relations` | 联系人 | Relations |
| `schedule` | 日历 | Schedule |
| `mine` | 我的 | Mine（入口页，跳转 Tasks/Diary/Habits/Skills/Settings） |

子页面（Tasks/Diary/Habits/Skills/Settings）通过"我的"页面进入，NavBar 自带返回按钮。

```tsx
// App.tsx 当前结构
<div className="h-screen flex flex-col overflow-hidden">
  <div className="flex-1 overflow-hidden">{renderPage()}</div>
  <BottomTabBar />
</div>
```

**待适配**：桌面端 WindowControls、NavBar 的 `data-tauri-drag-region` 需要在移动端隐藏。

### 4.3 isMobile 检测

**尚未实现**。方案不变：

```
方式 1（编译时）：Tauri platform() → 'android'
方式 2（运行时）：window.innerWidth < 768

结合使用：
- 编译时判断优先（确定是否走移动端代码路径）
- 运行时作为 fallback（桌面端调试时拖小窗口也能看到移动端布局）
```

放到 `hooks/useIsMobile.ts`，各页面都能用。

### 4.4 各页面适配要点

| 页面 | 导航层级 | 当前状态 | 移动端适配 |
|------|----------|----------|------------|
| **Home** (AI 对话) | 主 Tab | ChatView 聊天列表 | 改宽度即可，几乎不用动 |
| **Relations** | 主 Tab | 联系人列表 | 天然适配 |
| **Schedule** | 主 Tab | 日历视图 | 周视图横向滑动，月视图缩小网格 |
| **Mine** | 主 Tab | 入口网格 | 天然适配 |
| **Tasks** | 子页面 | 任务列表 + 详情 | 单列 + 详情全屏覆盖 |
| **Diary** | 子页面 | 编辑器 + 时间线 | 编辑器全宽，时间线改为 bottom sheet |
| **Skills** | 子页面 | 雷达图 + 属性卡片 | 雷达图缩小，卡片单列 |
| **Settings** | 子页面 | 表单列表 | 保持，天然适配 |
| **Habits** | 子页面 | 习惯列表 | 天然适配 |

### 4.5 桌面端特有元素处理

| 元素 | 移动端行为 | 当前状态 |
|------|------------|----------|
| `WindowControls`（自定义标题栏） | 隐藏。Android 有系统状态栏 + 导航栏 | 需要 `isMobile` 条件渲染 |
| `NavBar` 的 `data-tauri-drag-region` | 移除。Android 不需要窗口拖拽 | 需要条件渲染 |
| `LanternButton`（AI FAB） | 已不存在。AI 入口就是 BottomTabBar 第一个 tab（提灯） | ✅ 已适配 |
| 全局 `user-select: none` | 移动端改为 `user-select: text`，允许选择文本 | 需要 CSS 条件 |
| 自定义滚动条 `::-webkit-scrollbar` | 保持。移动端浏览器会忽略 | ✅ 无需处理 |
| hover 交互（`onMouseEnter` 等） | 改为 `onPress` / `active:` 伪类。hover 在触屏上没有对应概念 | 需要逐个排查 |

### 4.6 安全区域

移动端需要考虑：
- **顶部安全区**：状态栏/摄像头挖孔 → `safe-area-inset-top`
- **底部安全区**：导航手势条 → `safe-area-inset-bottom`
- **横屏安全区**：两侧 → `safe-area-inset-left/right`

Tailwind 4 默认支持 `pt-safe` / `pb-safe` 等工具类（取决于配置），否则手动写 CSS 变量。

### 4.7 触屏交互优化

- 最小触摸目标 44×44px（Apple HIG 标准，Android 同理）
- 滑动删除（任务列表、联系人列表）
- 下拉刷新（首页、任务列表）
- 长按弹出上下文菜单（替代桌面端右键/更多按钮）
- 拨浪鼓手势跳过（日程快速翻页）

### 4.8 现有文件改动范围预估

```
需要改的文件：
  hooks/
    useIsMobile.ts           ← 新建
  components/layout/
    WindowControls.tsx        ← 加 isMobile 条件渲染
  components/ui/
    NavBar.tsx                ← 移动端去掉 data-tauri-drag-region
  pages/
    Tasks/index.tsx          ← 响应式布局（单列 + 详情全屏）
    Schedule/index.tsx        ← 响应式布局
    Diary/index.tsx           ← 响应式布局（编辑器全宽）
    Skills/index.tsx          ← 响应式布局（雷达图缩小）
  styles/global.css          ← 安全区域 + user-select 条件 + 移动端微调
  index.html                 ← viewport meta tag

已完成（无需改动）：
  App.tsx                    ← 4 tab + 子页面结构已就绪
  BottomTabBar.tsx           ← 已存在，iOS 风格，带 safe-bottom
  PageContainer.tsx          ← 已有响应式 padding
  services/                  ← 全部复用
  stores/                    ← 全部复用
  types/                     ← 全部复用
  components/ai/             ← 全部复用
  components/schedule/       ← 全部复用
  components/tasks/          ← 全部复用
  components/diary/          ← 全部复用
```

---

## 五、Android 端搭建

### 5.1 环境要求

```bash
# Rust targets
rustup target add aarch64-linux-android armv7-linux-androideabi

# Android Studio + SDK
# - Android SDK Platform 33+
# - NDK 27+
# - 环境变量 ANDROID_HOME / JAVA_HOME

# Tauri 初始化
cd shijie
npx tauri android init
# 生成 src-tauri/gen/android/（Gradle 项目）
```

### 5.2 项目结构变化

```
src-tauri/
  gen/android/              ← npx tauri android init 生成
    app/
      build.gradle.kts
      src/main/
        AndroidManifest.xml
        java/.../MainActivity.kt
  Cargo.toml                ← 可能需要加 android 相关 features
  tauri.conf.json            ← bundle.android 配置
```

### 5.3 需要解决的问题

| 问题 | 说明 | 方案 |
|------|------|------|
| **日记文件路径** | 桌面端 `app_data_dir()`，Android 有独立沙盒 | `tauri::api::path::app_data_dir()` 在各平台自动返回正确路径，不需要改代码 |
| **通知** | 桌面端用浏览器 `Notification` API，Android 不可靠 | 换 `tauri-plugin-notification`，Rust 侧统一发送，前端不再直接调 Notification |
| **WebView 差异** | 桌面端 WebView2，Android 用系统 WebView | 测试 CPU 密集型渲染（雷达图 SVG、日历事件渲染），可能需优化 |
| **按键/返回手势** | Android 系统返回键 | 在 WebView 层处理，弹出层/详情面板关闭而非退出应用 |
| **窗口大小** | 桌面端写死 800×600 | `tauri.conf.json` 的 `windows[0]` 是桌面端专属配置，移动端忽略 |

### 5.4 `lib.rs` 调整

```rust
// 已就绪：lib.rs 第 6 行已有 mobile entry point 标记
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ... 现有逻辑不变，Tauri 编译 Android 时会自动使用此函数作为入口
}
```

已有 `#[cfg_attr(mobile, tauri::mobile_entry_point)]`，无需修改。

---

## 六、系统日历集成

### 6.1 目标

提灯的日程数据与 Android 系统日历**双向打通**：

```
提灯 schedules 表          Android CalendarContract
     ┌──────────┐                ┌──────────┐
     │ 课程      │ ──写入──→     │ 系统日历   │  → 其他日历 App 可见
     │ 任务      │               │          │  → 系统小组件可见
     │ 独立事件  │ ←──读取──     │ 手机日程  │  → Google/厂商日历同步
     └──────────┘                └──────────┘
```

**为什么重要**：
- 提灯里排了课表/任务，手机日历 App 和小部件也能看到，不用打开提灯
- 别人通过系统日历邀请你开会，提灯也能看到，不会冲突
- 系统级闹钟提醒，不需要自己维护通知逻辑

### 6.2 Android 端实现

Android 系统日历通过 `CalendarContract` ContentProvider 访问，需要以下权限：

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
```

**方案：Tauri Plugin（Kotlin → Rust bridge）**

```
┌─────────────────────────────────────────┐
│  Kotlin (Android 原生层)                  │
│  CalendarPlugin.kt                       │
│  ├── readCalendarEvents(range)           │
│  ├── writeCalendarEvent(schedule)        │
│  ├── updateCalendarEvent(id, schedule)   │
│  └── deleteCalendarEvent(id)             │
│         ↓ JNI / Tauri invoke            │
├─────────────────────────────────────────┤
│  Rust (后端)                              │
│  commands/calendar_plugin_commands.rs    │
│  ├── sync_system_calendars()             │
│  ├── push_schedule_to_system(id)         │
│  └── pull_system_events()               │
│         ↓ Tauri command                  │
├─────────────────────────────────────────┤
│  React (前端)                             │
│  日程页面 + 设置中的日历同步配置           │
└─────────────────────────────────────────┘
```

### 6.3 数据流

**写入系统日历（提灯 → 系统）**：

```
创建/修改提灯日程
  │
  ├─→ 写入 schedules 表（跟现在一样）
  └─→ 如果用户开启了"同步到系统日历"
        └─→ 调用 CalendarContract.insert/update
              └─→ 记录 system_calendar_event_id 到 schedules 表
```

新增字段：`schedules` 表加 `system_calendar_event_id TEXT`（可空），用于追踪已同步到系统日历的事件。

**读取系统日历（系统 → 提灯）**：

```
同步触发（启动 / 手动）
  │
  ├─→ 读取系统日历指定范围的事件
  ├─→ 对比已有（通过 system_calendar_event_id 去重）
  ├─→ 新事件 → 在提灯中展示为"手机日程"（虚线/半透明/不同颜色）
  └─→ 可在日历视图中按日历表过滤
```

### 6.4 日历表映射

提灯的日历表（calendars 表）和 Android 系统日历账户做映射：

```
settings 表存储映射关系：
  calendar_sync.{提灯calendar_id}.system_account  → "your@gmail.com"
  calendar_sync.{提灯calendar_id}.system_calendar  → "1"（系统日历ID）
  calendar_sync.{提灯calendar_id}.direction        → "both" | "upload" | "download"
```

用户可以在设置里对每个日历表单独配置同步方向和目标账户。

### 6.5 数据同步方向

- **提灯创建的日程**：推送到系统日历后，以提灯为真相源。后续修改只从提灯发起，覆盖系统日历中的对应事件。
- **系统日历拉取的事件**：在提灯中只读展示（灰色/虚线），不提供编辑入口。在系统日历 App 中编辑即可。
- **时间冲突**：由用户自己判断——同时段有多个事件是正常的，提灯不做冲突检测。

### 6.6 权限处理

Android 日历权限需要运行时请求：
- Android 6+ 需要动态申请 `READ_CALENDAR` / `WRITE_CALENDAR`
- 首次使用时弹出系统权限对话框
- 拒绝后降级：仅使用提灯自身数据，系统日历功能不可用
- 设置页可重新触发权限请求

---

## 七、桌面小部件（App Widget）

### 7.1 目标

在 Android 桌面放置提灯小部件，不打开 App 就能看到关键信息。

### 7.2 小部件方案

| 小部件 | 尺寸 | 内容 |
|--------|------|------|
| **今日任务** | 4×2 / 4×3 | 今天要做的任务列表（标题 + 优先级色点），勾选完成 |
| **今日日程** | 4×2 | 今天的时间线（事件 + 时间），含系统日历事件 |
| **修为概览** | 4×1 | 六维属性迷你进度条 + 总等级 |
| **快捷入口** | 2×1 | 提灯对话 / 写日记 / 创建任务 快捷跳转 |

### 7.3 实现方案

Android Widget 是纯 Kotlin 代码（`RemoteViews` 渲染），在 Tauri WebView 之外运行。难点：Widget 进程拿不到 Rust 后端的数据。

**方案：JSON 缓存文件**

```
Rust 后端（App 运行时）
  │  每次本地数据变更后
  ├─→ 写入 widget_cache.json
  │     {
  │       "updated_at": "2026-05-26T10:00:00+08:00",
  │       "today_tasks": [...],
  │       "today_schedules": [...],
  │       "skills_summary": {...}
  │     }
  │     写到 app_data_dir/widget_cache.json
  │
Kotlin WidgetProvider（App 内外均可运行）
  │  系统定时刷新 / App 通知刷新
  └─→ 读取 widget_cache.json
       └─→ 渲染 RemoteViews
```

**刷新机制**：

```
1. App 运行时数据变更 → Rust 写 widget_cache.json
                       → 发广播通知 Widget 刷新
2. 系统定时刷新（Android 标准，最短 30 分钟）
3. App 启动/关闭时刷新
```

Widget 不直接读 SQLite——避免 WAL 锁冲突和一个数据两处解析的问题。JSON 缓存文件简单可靠，足够小（几 KB）。

### 7.4 Widget 交互

Widget 点击后的行为：

| 点击位置 | 行为 |
|----------|------|
| 任务项 | 打开提灯 → 任务详情 |
| 日程项 | 打开提灯 → 日历页面 |
| 勾选框 | 通过 BroadcastReceiver 标记完成（App 运行时处理，不在运行时排队等待） |
| 快捷入口 | 打开提灯 → 对应页面 |

勾选完成是 Widget 最有价值但也最复杂的交互。简单方案：勾选仅做视觉标记，真正完成操作等下次 App 运行时再执行。

---

## 八、实施阶段

### Phase 1：响应式 UI 适配 ✅ 已完成

- [x] `BottomTabBar` 组件（4 tab：提灯/联系人/日历/我的）
- [x] `App.tsx` 4 tab + 子页面导航结构
- [x] `PageContainer` 响应式 padding（px-4 / md:px-6 / lg:px-8）
- [x] `NavBar` 返回按钮 + 子页面跳转
- [x] "夜萤"暗色设计语言（#0F1412 底色 + #4CAF76 萤火绿）

剩余收尾（可在 Phase 2 之前或期间完成）：
- [ ] `useIsMobile` hook（编译时 + 运行时检测）
- [ ] `WindowControls` / `NavBar` 的 `data-tauri-drag-region` 条件渲染
- [ ] `user-select: none` 移动端改为允许选择
- [ ] hover 交互 → touch 交互替换
- [ ] `index.html` viewport meta tag

### Phase 2：Tauri Android 跑通

- [ ] 安装 Android Studio + SDK + NDK
- [ ] `tauri android init`
- [ ] 解决 Rust 交叉编译问题
- [ ] 解决 Gradle 构建问题
- [ ] 真机上跑起来，验证基本功能
- [ ] 修复平台相关 bug（路径、WebView、通知等）
- [ ] `tauri-plugin-notification` 替换浏览器 Notification（桌面端+移动端统一）

**验证方式**：Android 真机或模拟器运行 `npx tauri android dev`。

### Phase 3：WebDAV 同步 ✅ 已完成

- [x] `sync/webdav_client.rs` — WebDAV 客户端（PROPFIND/GET/PUT/DELETE/MKCOL，375 行）
- [x] `sync/sync_engine.rs` — 全量同步 + 冲突处理 + 日记文件同步（645 行）
- [x] `commands/sync_commands.rs` — Tauri command 层（sync_now / sync_get_status / sync_test_connection）
- [x] `lib.rs` 启动时 spawn 后台同步循环（30 分钟间隔）
- [x] 前端同步设置页（凭据配置 + 手动同步按钮）

剩余收尾：
- [ ] 应用关闭时自动推送（桌面端窗口关闭事件 + 移动端 onPause 生命周期）
- [ ] 冲突管理 UI（当前冲突时备份 + 采用远程版本，无用户选择界面）
- [ ] 桌面端 ↔ Android 端实际同步测试

### Phase 4：系统日历集成

- [ ] Kotlin `CalendarPlugin`（封装 CalendarContract 读写）
- [ ] Rust `calendar_plugin_commands`（Tauri command 桥接）
- [ ] `schedules` 表加 `system_calendar_event_id` 字段
- [ ] 日历同步配置（设置页：映射 calendars → 系统日历账户）
- [ ] 权限申请流程（运行时弹窗 + 拒绝降级）
- [ ] 双向同步逻辑（写入系统日历 + 读取系统日历事件）
- [ ] 冲突处理（提灯覆盖系统日历）
- [ ] 日历视图中展示系统日历事件（不同样式区分）

**验证方式**：提灯创建日程 → 打开系统日历 App 验证出现。系统日历创建事件 → 打开提灯验证出现。

### Phase 5：桌面小部件

- [ ] Rust 侧：数据变更后写 `widget_cache.json`
- [ ] Kotlin `WidgetProvider`：读取 JSON → 渲染 RemoteViews
- [ ] 今日任务小部件（4×2）
- [ ] 今日日程小部件（4×2）
- [ ] 修为概览小部件（4×1）
- [ ] 快捷入口小部件（2×1）
- [ ] Widget 点击跳转 App 对应页面
- [ ] 刷新机制（App 通知刷新 + 系统定时刷新）

**验证方式**：在桌面添加小部件 → 验证数据展示 → 修改数据 → 验证刷新。

### Phase 6：打磨 & 发布

- [ ] Android 返回键处理
- [ ] 离线模式（无网络时跳过同步，正常使用）
- [ ] 性能优化（启动速度、日历渲染、大量数据列表）
- [ ] APK 签名 + 发布

---

## 九、风险 & 未知

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| **Tauri mobile 生态不成熟** | 中 | 遇到难以排查的编译/运行时 bug | Android 优先，真机问题可以逐步解决 |
| **坚果云 WebDAV 速率限制** | 低 | 同步变慢 | 数据库通常 < 10MB，单次上传即可。增量同步放后续 |
| **两台设备同时写入产生冲突** | 低 | 数据暂时分叉 | 3.3 已覆盖，且用户通常不会同时操作 |
| **SQLite WAL checkpoint 在移动端失败** | 低 | 同步数据不完整 | 加重试 + 错误上报，极端情况走完整性检查 |
| **WebView 渲染性能** | 中 | 日历、雷达图在低端机上卡顿 | 虚拟列表、简化 SVG、懒加载 |
| **系统日历权限被拒** | 中 | 无法读写系统日历 | 降级：仅用提灯自身数据，提示用户在设置中开启 |
| **Widget 刷新延迟** | 中 | App 被杀后 Widget 数据过时 | 系统定时刷新兜底（30 min），App 运行时主动推送 |
| **不同厂商日历行为差异** | 低 | MIUI/ColorOS 等对 CalendarContract 有私有扩展 | 只走标准 API，厂商差异忽略 |

---

## 十、暂不做的

- **iOS** — 需要 macOS + Xcode + 开发者账号，成本太高，等 Android 稳定后再考虑
- **增量同步** — 全量文件同步对 < 10MB 的数据库文件来说足够。等数据量真涨到瓶颈再做
- **CRDT 合并** — 冲突已是小概率事件，先保底不丢数据，再做智能合并
- **后台实时同步** — Android 杀后台进程是硬伤，不做无谓对抗。启动/关闭/手动三点足矣
- **端到端加密** — 坚果云传输层有 HTTPS，存储层的加密放远期

---

## 十一、参考资源

- [Tauri 2 Mobile Guide](https://v2.tauri.app/guides/develop/mobile/)
- [Tauri 2 Android Setup](https://v2.tauri.app/guides/prerequisites/android/)
- [Tauri 2 Plugin Development](https://v2.tauri.app/guides/plugins/)
- [坚果云 WebDAV 文档](https://help.jianguoyun.com/?tag=webdav)
- [WebDAV RFC 4918](https://datatracker.ietf.org/doc/html/rfc4918)
- [Android CalendarContract](https://developer.android.com/reference/android/provider/CalendarContract)
- [Android App Widgets](https://developer.android.com/guide/topics/appwidgets)
