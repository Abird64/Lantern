---
target: 任务
total_score: 20
p0_count: 0
p1_count: 2
timestamp: 2026-06-03T03-24-13Z
slug: shijie-src-pages-tasks-tsx
---
# 任务页面 (Tasks) 设计 Critique

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | 有 loading/toast/reward popup，但缺 skeleton 态和异步操作中的即时反馈 |
| 2 | Match Between System / Real World | 2 | 分类名 万象/今晨/圆满/启序/迟暮 需脑内翻译，违反项目自身"导航用直白名字"决策 |
| 3 | User Control and Freedom | 2 | 无撤销，批量删除/单条删除均无确认，多选模式仅取消按钮一条退出路径 |
| 4 | Consistency and Standards | 2 | TaskCard 圆形图标、完成按钮、XP 徽章使用硬编码颜色，绕过主题系统 |
| 5 | Error Prevention | 2 | 批量删除无确认；单条删除无确认；创建按钮有 disabled 态，这是好的 |
| 6 | Recognition Rather Than Recall | 2 | 排序、多选按钮纯图标无标签；分类名需学习记忆 |
| 7 | Flexibility and Efficiency | 2 | 有多选批量操作，但无键盘快捷键、无拖拽排序 |
| 8 | Aesthetic and Minimalist Design | 3 | 整体干净，遵循夜萤设计语言。卡片视觉元素略拥挤 |
| 9 | Error Recovery | 2 | 失败操作只 console.error，用户无感知；自动保存无状态指示 |
| 10 | Help and Documentation | 1 | 无 tooltip、无内联帮助、无新手引导。空状态文案还行但不够 |
| **Total** | | **20/40** | **Acceptable** — 基础扎实但可用性和韧性有明显缺口 |

## Anti-Patterns Verdict

**LLM assessment**: 不是典型的 AI slop。这是有意识的设计选择——夜萤暗色、萤火绿 accent、毛玻璃分层、RPG 奖励弹窗。整体调性是独特的，不像"又一个人效率工具"。但有几个地方让人迟疑：
- 硬编码颜色让暗色模式下的浅蓝/浅绿圆圈像贴上去的，破坏沉浸感
- 分类标签的"诗意命名"是该项目自行选择的方向，但在任务管理场景中和 DESIGN.md 的"导航用直白名字"决策冲突
- 卡片固定 130px 高度 + 双列网格是一种"看起来整齐"的做法，实则让不同内容量的卡片要么截断要么留白不均

**Deterministic scan**: CLI detector 扫描返回干净（0 findings）。所有问题来自人工审查。

**Browser visualization**: 本环境不支持浏览器自动化（无法 navigate + inject detect.js）。跳过 overlay 注入。

## Overall Impression

任务页面的骨架是对的：FAB 创建入口、胶囊分类切换、卡片列表、右侧详情面板、批量操作栏。API 设计合理（自动保存、子任务展开、XP 奖励）。最大问题是**暗色模式下的硬编码颜色破坏了夜萤设计语言**——TaskCard 里几个浅蓝/浅绿圆圈，在 #0F1412 的墨绿夜空里像 Windows 95 时代的控件漏进来了。第二个问题是**删除没有确认**——这是数据丢失隐患。分类名的诗意方向本身不是错，但它和项目自己定下的"导航用直白名字"规则冲突，要么改名字，要么改规则。

## What's Working

1. **FAB 按钮位置和主题色使用** — 右下角的 `+` 按钮用 `--primary`，hover 有半透明变体，符合移动端拇指区最佳实践
2. **详情面板动画** — `animate-slide-in` 250ms ease-out，右侧滑入，轻、快、对。Backdrop 点击关闭给了用户逃生路径
3. **自动保存** — 600ms debounce + `initialLoadRef` 防止初始化触发，这是理解前端痛点的设计

## Priority Issues

### [P1] 硬编码颜色绕过主题系统，暗色模式冲突严重

**Why it matters**: TaskCard 的完成圆形图标用 `#D1FAE5`/`#E0F2FE`/`#6EE7B7`/`#93C5FD`（浅蓝/浅绿），在暗色背景 `#0F1412` 上像来自另一个应用。详情面板的"完成任务"按钮用 `#2A8FB7` 而非 `appTheme.primary`。XP 徽章用 `#4A90D9`。这些颜色在亮色模式下或许协调，但在暗色模式下完全脱离夜萤色板。

**Fix**: 将所有硬编码颜色替换为 theme token 引用。TaskCard 的圆形图标背景改为 `withAlpha(appTheme.primary, 0.1)` + 边框 `withAlpha(appTheme.primary, 0.2)`。完成按钮用 `appTheme.primary`。

**Suggested command**: `/impeccable colorize 任务`

### [P1] 删除操作无确认，批量删除尤其危险

**Why it matters**: `handleBatchDelete` 和 `handleDeleteFromDetail` 直接执行删除，无确认弹窗。用户误触即丢数据。DESIGN.md 明确要求删除确认。

**Fix**: 在 `handleDeleteFromDetail` 和 `handleBatchDelete` 前插入确认对话框。

**Suggested command**: `/impeccable harden 任务`

### [P2] 分类标签名违反项目自身设计决策

**Why it matters**: 项目 memory 和 DESIGN.md 都明确"导航用直白名字，古风只用在装饰性文字"。但 万象/今晨/圆满/启序/迟暮 五个分类名全部需要用户学习映射关系。

**Fix**: 改为直白标签：全部/今天/已完成/进行中/已过期。id 保留不变（仅内部使用）。

**Suggested command**: `/impeccable clarify 任务`

### [P2] 卡片固定 130px 高度在内容量不同时产生视觉不一致

**Why it matters**: `h-[130px]` + `overflow-hidden` 让长标题被截断、短内容有大片空白。双列网格中，同一行的两张卡片内容不对称时，眼睛会注意到这种不一致。

**Fix**: 去掉固定高度，改用 `min-h-[130px]`。标题用 `line-clamp-2` 替代 `truncate`。

**Suggested command**: `/impeccable layout 任务`

### [P3] 错误处理静默失败

**Why it matters**: 多个操作失败时只有 `console.error` 或空 `catch` 块。用户点击"完成任务"后如果出错，按钮无反应，任务未完成，但没有任何提示。

**Fix**: 在 catch 块中调用 `showToast('操作失败，请重试', 3000)`。统一错误处理 helper。

**Suggested command**: `/impeccable harden 任务`

## Persona Red Flags

**Alex (Power User)**:
- 无键盘快捷键：无法用 N 创建任务、Space 完成、Delete 删除
- 排序方式仅三种，无自定义排序
- 多选不能用 Shift+Click 范围选择，只能逐一点击
- 卡片上的快速完成按钮仅在 hover 时出现——纯键盘用户完全无法触发

**Jordan (First-Timer)**:
- 打开页面看到 万象/今晨/圆满/启序/迟暮 五个标签——每个都需要猜测含义
- 排序按钮是纯图标（ArrowUpDown），无文字说明
- 多选按钮是纯图标（ListChecks），无文字说明
- 无任何引导提示解释"萤火""XP""属性加成"是什么

**Riley (Stress Tester)**:
- 批量删除无确认 → 选中全部 → 点"批量删除" → 所有数据消失，无法恢复
- 创建任务时 title 为空，按钮 disabled（好），但无任何提示为什么不能点
- 标签输入按回车添加，但如果用户粘贴一串逗号分隔的标签，不会自动拆分

## Minor Observations

- Toast 是黑色背景白色文字 (bg-black/80 text-white)，在暗色模式下突兀——应该用半透明深色或 respecting 主题
- "子任务"展开按钮在卡片右下角，文案字号 text-xs + opacity 0.3，几乎看不见
- 排序菜单用 fixed overlay 关闭，backdrop 在 inset-0 z-10，会阻止用户点击下方元素
- TagBadges 的 try/catch 包裹 JSON.parse 是对的，但应该在解析层统一处理而非在每个渲染点
- 创建弹窗的 placeholder color: txtHint 设置了 opacity 0.2，对比度可能不足 4.5:1（需实测）
