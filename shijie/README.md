# 拾阶 (MyWorld)

> 拾级而上，提灯而行 — My world, step by step.

一个本地优先的 AI 驱动人生管理系统。把 Obsidian 的数据开放、RPG 的成长反馈、AI Agent 的智能调度，编织成一个陪你拾级而上的桌面伙伴。

## 功能

|模块|说明|
|-|-|
|**提灯** (Lantern)|AI 对话助手，21 个工具覆盖全模块，支持确认卡片、自动标题、对话收藏|
|**任务** (Tasks)|任务管理，含优先级、标签、子任务、搜索排序、批量操作、一键完成|
|**日历** (Schedule)|周/日/月/近期四视图，事件管理、.ics 导入、拖拽、重复事件编辑|
|**日记** (Diary)|Markdown 文件存储，时间线浏览，AI 日记旁白，日省 XP 结算|
|**相识** (Relations)|人脉管理，分类筛选，多昵称/联系方式，AI 人物提取|
|**修为** (Skills)|六维属性面板，RPG 成长反馈，完成事项获得经验值|

## 技术栈

* **桌面框架**: [Tauri 2](https://v2.tauri.app/) (Rust)
* **前端**: React 19 + TypeScript + Vite
* **样式**: Tailwind CSS 4
* **状态管理**: Zustand
* **数据库**: SQLite (rusqlite, bundled)
* **AI**: 兼容 OpenAI/DeepSeek API 格式

## 快速开始

### 前置要求

* [Node.js](https://nodejs.org/) 22+
* [Rust](https://www.rust-lang.org/) 1.77+
* 用户需安装 [WebView2 运行时](https://developer.microsoft.com/microsoft-edge/webview2/)
* Windows: Microsoft Visual Studio C++ Build Tools
* macOS: Xcode Command Line Tools

### 开发

```bash
cd shijie
npm install
npm run tauri dev
```

### 构建安装包

```bash
cd shijie
npm run tauri build
```

安装包输出在 `src-tauri/target/release/bundle/`。

## 配置 AI

1. 启动应用后，进入**设置**页面
2. 填入 API 地址（默认 DeepSeek: `https://api.deepseek.com/v1`）
3. 填入 API Key（从对应平台获取）
4. 返回**助手**页面，即可与提灯对话

支持所有兼容 OpenAI API 格式的服务（DeepSeek、OpenAI、Ollama 等）。

## 架构

```
src-tauri/src/
  ai/          AI 客户端、提示词、工具定义、执行器
  commands/    Tauri IPC 命令（每个模块一个文件）
  db/          SQLite 连接、迁移、Repository 层

src/
  components/  UI 组件
  pages/       页面（7 个模块）
  services/    Tauri API 桥接
  stores/      Zustand 状态管理
  types/       类型定义
```

* Rust 后端暴露约 40 个 Tauri command，前端通过 `@tauri-apps/api` 调用
* 数据存储：日记用 `.md` 文件（文件系统为真相源），其他数据用 SQLite（加速索引）
* AI 工具层：21 个工具，写操作需用户确认，读操作自动执行

## 数据可迁移性

* 日记：`%APPDATA%/com.myworld.app/diaries/` 下的 `.md` 文件，可直接用 Obsidian 打开
* 数据库：`%APPDATA%/com.myworld.app/myworld.db`，可用任何 SQLite 工具读取
* 导出：支持 ICS 日历导出

## 开源协议

MIT License - 详见 [LICENSE](../LICENSE)

