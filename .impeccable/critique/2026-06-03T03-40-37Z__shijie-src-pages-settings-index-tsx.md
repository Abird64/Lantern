---
target: 设置
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-06-03T03-40-37Z
slug: shijie-src-pages-settings-index-tsx
---
# 设置页面 (Settings) 设计 Critique

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 同步状态/进度/toast 都有。缺 settings 加载骨架 |
| 2 | Match Between System / Real World | 3 | 标签直白中文。但 "WebDAV""R2""锦囊" 对新手需要一些领域知识 |
| 3 | User Control and Freedom | 2 | 自定义锦囊删除无确认，直接消失。导出/清除对话框有取消 |
| 4 | Consistency and Standards | 3 | 主题 token 使用基本一致。3 处硬编码颜色 |
| 5 | Error Prevention | 3 | 清除数据需要勾选才能确认。但锦囊编辑/删除无确认 |
| 6 | Recognition Rather Than Recall | 4 | 所有选项标签清晰。无隐藏功能 |
| 7 | Flexibility and Efficiency | 2 | 7 个 section 全部展开，长滚动找配置。无设置搜索、无键盘快捷键 |
| 8 | Aesthetic and Minimalist Design | 3 | 整体干净，但页面过长（1384 行单文件），部分文字对比度不足 |
| 9 | Error Recovery | 3 | Toast 显示成功/失败。同步错误可见。导出失败有提示 |
| 10 | Help and Documentation | 1 | 无任何 tooltip、内联说明、或帮助入口 |
| **Total** | | **27/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment**: 不是 AI slop。设置页面是功能性 UI——它不需要花哨，需要清晰、可预测、安全。页面做到了大部分。两个让人迟疑的点：
- 内置锦囊的提示词文字用 overlay(0.18)（深色模式下约 18% 白色），在 #0F1412 背景上对比度不足 2:1
- 自定义锦囊删除无确认——点击垃圾桶图标直接消失

**Deterministic scan**: CLI detector 扫描返回干净（0 findings）。所有问题来自人工审查。

**Browser visualization**: 本环境不支持浏览器自动化。跳过 overlay 注入。

## Overall Impression

设置页面功能齐全——主题切换、通知开关、番茄钟参数、AI 提供商配置、锦囊管理、三种同步方式（WebDAV/R2/LAN）、数据导出和清除。Toggle 开关设计简洁，SelectRow 自定义下拉的交互也不错。最大问题是信息密度过高——7 个 section 一次性展开在 1384 行的单文件里，用户需要大量滚动才能找到目标配置。其次是部分文字对比度严重不足。

## What's Working

1. **Toggle 开关设计** — 胶囊形滑块，选中态用 accent 色，未选中态用 overlay(0.2)，动画过渡平滑
2. **清除数据对话框** — 多选 + 危险色高亮 + 计数器 + 不可撤销警告。这是整页最精心设计的交互
3. **LAN 同步 UI** — 本机服务器启停 + 设备发现 + 手动连接 + 已选状态高亮

## Priority Issues

### [P1] 自定义锦囊删除无确认，点击即永久丢失

**Why it matters**: handleDeleteCustom 直接过滤掉该锦囊并写回 localStorage，无确认步骤。用户误触垃圾桶图标 → 精心编写的提示词永久消失。

**Fix**: 在 handleDeleteCustom 前弹出确认对话框，或使用两步确认模式。

**Suggested command**: `/impeccable harden 设置`

### [P1] 内置锦囊文字对比度严重不足（暗色模式）

**Why it matters**: 内置锦囊的 prompt 文字使用 overlay(0.18)，在 #0F1412 背景上对比度约 1.8:1。WCAG AA 要求 ≥4.5:1。

**Fix**: 将 prompt 文字 opacity 提升到至少 0.35-0.40，标题提升到 0.5-0.6。

**Suggested command**: `/impeccable colorize 设置`

### [P2] 3 处硬编码颜色绕过主题系统

**Why it matters**: LAN peer 在线状态点用 #22c55e/#9ca3af，SyncProgress 成功色用 #58A968。

**Fix**: 在线状态用 appTheme.success/appTheme.inkMuted48，SyncProgress 成功色用 appTheme.success。

**Suggested command**: `/impeccable colorize 设置`

### [P2] 页面过长，无导航或折叠机制

**Why it matters**: 7 个 section 全部展开，用户需要滚动 1000+ 行才能找到特定配置。没有 sticky 目录、accordion 折叠、或设置搜索。

**Fix**: 加入 accordion 折叠模式（默认展开第一个，其余可折叠），或添加右侧 sticky 目录导航。

**Suggested command**: `/impeccable distill 设置`

### [P3] Toggle 开关缺少 ARIA 属性

**Why it matters**: Toggle 使用 button + 绝对定位滑块实现，无 role="switch" / aria-checked。

**Fix**: 给 toggle button 添加 role="switch"、aria-checked、aria-label。

**Suggested command**: `/impeccable harden 设置`

## Persona Red Flags

**Alex (Power User)**:
- 7 个 section 全展开，无设置搜索
- SelectRow 自定义下拉不支持键盘导航（方向键/Enter）
- 自定义锦囊编辑后无"已保存"的视觉反馈

**Jordan (First-Timer)**:
- "WebDAV 服务器""R2 Access Key""Bucket" 无解释
- "锦囊管理"是什么？内置锦囊的文字淡到无法阅读
- AI 提供商配置无 help text

**Sam (Accessibility)**:
- Toggle 按钮无 role="switch" / aria-checked
- SelectRow 自定义下拉无键盘支持
- 导出/清除对话框无 role="dialog" / aria-modal
- 内置锦囊提示词对比度 1.8:1（WCAG 要求 4.5:1）

## Minor Observations

- SelectRow 自定义 dropdown 用 useEffect + mousedown 监听关闭——更推荐 onBlur 或 popover API
- 导出对话框的"关闭"按钮只有文字无背景色，容易被忽略
- tracking-wider 用于中文标题——中文字符不需要 letter-spacing
- 1384 行单文件——Section/ToggleRow/InputRow/SelectRow 可考虑抽到独立文件
