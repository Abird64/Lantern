# AGENTS.md

## 项目

提灯 (Lantern) — Tauri 2 桌面/移动应用，本地优先的 AI 驱动人生管理系统。

## 关键命令

```bash
cd shijie
npm install              # 安装前端依赖
npm run tauri dev        # 开发模式（Vite HMR + Tauri 窗口）
npx tsc --noEmit         # TypeScript 类型检查
cd src-tauri && cargo check  # Rust 编译检查
```

## 架构要点

- **主应用**：`shijie/` 目录（React + Tauri 2）
- **Web 版**：`web/` 目录（独立 HTML/CSS/JS，无需构建）
- **AI 工具**：47 个工具定义在 `src-tauri/src/ai/tools.rs`
- **数据存储**：日记用 `.md` 文件（文件系统为真相源），其他数据用 SQLite `lantern.db`
- **多端同步**：坚果云 WebDAV，快照式全量同步

## 开发注意事项

### Oxc 解析器限制

项目使用 oxc（Vite 8 默认），**对 JSX 嵌套解析有限制**：
- 深层嵌套的三元表达式会报错
- **规避方式**：提取子组件 + 确保每个标签正确闭合

### 设计系统

- 字体：SF Pro Display / SF Pro Text + system-ui
- 圆角胶囊风格，8px 间距网格
- 暗色主题默认，萤火绿 `#4CAF76` 为主色
- 自定义无边框窗口（`decorations: false`）

### AI 工具设计

- 写操作（create/update/delete）→ 弹出确认卡片，用户确认后执行
- 读操作（search/list/get）→ 自动执行，不打断对话
- 卡片分 4 色：确认（绿）/ 修改（蓝）/ 取消（红）/ 结果（灰）

## 参考文档

- `CLAUDE.md`：详细架构说明
- `PRODUCT.md`：产品设计原则
- `DESIGN.md`：UI/UX 设计规范
- `EXTENSIONS.md`：插件系统规划
