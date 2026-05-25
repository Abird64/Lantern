# 拾阶 - 开发规范

## 1. 页面布局规范

### 必须使用 PageContainer 作为页面根容器

所有页面组件必须使用 `PageContainer` 组件作为根容器，以确保统一的布局和适当的内边距。

> **重要**：PageContainer 的内边距会影响所有子元素，包括顶部导航栏！

### 顶部导航栏必须横跨整个页面

页面顶部的导航栏（标题栏）需要**横跨整个浏览器窗口**，不受 PageContainer 内边距影响。

**正确写法：**
```tsx
{/* 导航栏使用负边距来抵消 PageContainer 的内边距 */}
<div className="h-[72px] flex items-center justify-between px-4 md:px-6 lg:px-8 border-b border-white/10 -mx-4 md:-mx-6 lg:-mx-8">
  {/* 导航栏内容 */}
</div>
```

**错误写法 ❌：**
```tsx
{/* 导航栏受到 PageContainer 内边距限制，不会横跨整个页面 */}
<div className="h-[72px] flex items-center justify-between px-8">
  {/* 导航栏内容 */}
</div>
```

**关键点：**
- 导航栏的内边距应该与 PageContainer 的内边距**一致**
- 同时使用**负外边距** `-mx-4 md:-mx-6 lg:-mx-8` 来"逃逸"出 PageContainer

```tsx
import { PageContainer } from '@/components/layout';

// 正确示例
export function MyPage() {
  return (
    <PageContainer className="bg-[#123456] relative flex flex-col">
      {/* 页面内容 */}
    </PageContainer>
  );
}

// 错误示例 ❌
export function MyPage() {
  return (
    <div className="min-h-screen">
      {/* 页面内容 */}
    </div>
  );
}
```

### PageContainer 组件说明

位置：`src/components/layout/PageContainer.tsx`

功能：
- 提供响应式水平内边距 (`px-4 md:px-6 lg:px-8`)
- 统一页面容器行为
- 支持自定义背景色和额外类名

Props：
- `children`: ReactNode - 页面内容
- `className?: string` - 额外的 Tailwind 类名
- `bgColor?: string` - 自定义背景色（inline style 方式）

## 2. CSS 样式优先级

### 样式文件导入顺序

```
1. Tailwind CSS (@import "tailwindcss")
2. 全局样式 (src/styles/global.css)
3. 页面级样式 (src/App.css)
```

如果在 Tailwind 导入的样式之后定义的 CSS 不生效，可以：
1. 重启开发服务器 (`npm run dev`)
2. 清除浏览器缓存
3. 使用 `!important` 强制优先级（慎用）

### 避免在 index.html 中使用内联样式

index.html 中的 `<style>` 标签可能会与 Tailwind CSS 冲突。如需添加全局样式，请在 `global.css` 中定义。

## 3. 组件导出规范

所有可复用组件必须在 `src/components/[category]/index.ts` 中导出：

```typescript
// src/components/layout/index.ts
export { DropdownMenu } from './DropdownMenu';
export { HeaderButton } from './HeaderButton';
export { PageContainer } from './PageContainer';
```

## 4. 页面组件位置

| 页面 | 路径 | 组件名 |
|------|------|--------|
| 首页 | `src/pages/Home/index.tsx` | `HomePage` |
| 任务 | `src/pages/Tasks/index.tsx` | `TasksPage` |
| 日程 | `src/pages/Schedule/index.tsx` | `SchedulePage` |
| 日记 | `src/pages/Diary/index.tsx` | `DiaryPage` |
| 关系 | `src/pages/Relations/index.tsx` | `RelationsPage` |
| 修为 | `src/pages/Skills/index.tsx` | `SkillsPage` |
| 设置 | `src/pages/Settings/index.tsx` | `SettingsPage` |

所有页面组件必须在 `src/pages/index.ts` 中导出。

## 5. Tailwind CSS 注意事项

### 为什么第一次修改样式没效果？

Tailwind CSS 使用 JIT（即时编译）模式：
1. 修改代码 → 保存
2. Tailwind 扫描文件并生成 CSS
3. Vite 热更新推送到浏览器

如果这个过程失败，可以尝试：
- 重启开发服务器
- 清除浏览器缓存
- 强制刷新 (`Ctrl + Shift + R`)

### 响应式断点

| 断点 | 前缀 | 屏幕宽度 |
|------|------|----------|
| 小 | `sm:` | 640px+ |
| 中 | `md:` | 768px+ |
| 大 | `lg:` | 1024px+ |
| 超大 | `xl:` | 1280px+ |

## 6. 颜色规范

### 主题色

在 `src/styles/global.css` 中定义：

```css
--color-primary-green: #58A968;
--color-primary-red: #953737;
--color-primary-orange: #D98B58;
```

### 页面背景色

| 页面 | 颜色值 |
|------|--------|
| 首页 | `#1a1a1a` |
| 任务 | `#C8C8C0` |
| 日程 | `#953737` |
| 日记 | `#F7F3E9` |
| 关系 | `#2D3742` |

## 7. 常见问题

### Q: 如何修复"内容贴边框"问题？

A: 确保页面根容器使用 `PageContainer` 组件，或者手动添加响应式内边距：
```tsx
<div className="min-h-screen px-4 md:px-6 lg:px-8">
```

### Q: Tailwind 类名没有生效？

A:
1. 确认类名拼写正确
2. 尝试重启开发服务器
3. 检查是否被其他样式覆盖

## 8. oxc 解析器避坑指南

Vite 使用 oxc（Rust 编写的 JS/TS 解析器）替代了 Babel/TypeScript 做语法转换。
oxc 比 Babel 严格得多，以下模式会导致 `[PARSE_ERROR]`，必须避免。

### 8.1 `()` 分组内只能有一个表达式

`{condition && (` 打开的是 JavaScript 分组运算符，里面只能放**一个**表达式。
`</div>` 闭合后如果紧跟 `{/* 注释 */}`，就是两个表达式，oxc 直接报错。

```tsx
// ❌ 错误：div 闭合标签 + 注释 = 两个表达式
{show && (
  <div>...</div>
  {/* 注释 */}
)}

// ✅ 正确：注释放到 )} 之后，成为独立的 JSX 兄弟节点
{show && (
  <div>...</div>
)}{/* 注释 */}
```

### 8.2 禁止嵌套三元表达式

Babel/TS 能容忍的 JSX 嵌套三元，oxc 直接拒绝解析。

```tsx
// ❌ 错误：三元里套三元
{a ? ( <A/> ) : b ? ( <B/> ) : ( <C/> )}

// ✅ 正确：拆成连续的 && 条件
{a && b && ( <A/> )}
{a && !b && ( <B/> )}
{!a && ( <C/> )}
```

### 8.3 每个 HTML 标签和 `()` 闭合后立即写注释

深层嵌套的 `</div>`、`)}` 闭合后不加注释，过两天就不知道它关的是谁。
再改代码时容易多删或少加闭合标签，触发 oxc 连锁报错。

```tsx
</div>{/* end 中间 - 对话区 */}
</PageContainer>
```

注释放在闭合**之后**（不在分组括号之内），避免触发规则 8.1。

### 8.4 大块 JSX 尽早拆组件

200+ 行的内联 JSX 比传递 7 个 props 的独立组件危险得多：

- 组件天然带边界，少一个 `</div>` TypeScript 直接在该行报错
- 内联 JSX 少一个 `</div>`，oxc 的报错行号往往在几百行之外，毫无关联
- 深嵌套是 oxc 报错的主要来源，扁平组件结构从根源上避免

### 8.5 oxc 报错行号不可信

oxc 报错的位置是"解析器发现不对劲"的地方，不是"真正写错"的地方。
真正的问题几乎总是在报错行的**上方**，是某个没闭合的括号或标签。

排查步骤：
1. 从报错行往上追踪括号/标签匹配
2. 检查是否有嵌套三元、多表达式在 `()` 内
3. 不要盯着报错行本身改——它只是受害者

### 8.6 已知案例

| 日期 | 提交 | 问题 | 修复 |
|------|------|------|------|
| 2026-05-25 | `29cf4a8` | 收藏盒嵌套三元（`showFavorites ? selectedFavorite ? : :`） | 拆为 `&&` 连续条件 |
| 2026-05-25 | `0bc80b9` | 输入区外层 `<div>` 缺闭合标签，oxc 报错在 200 行外的 `)}` | 补全 `</div>` |
| 2026-05-25 | `1524ca7` | `{/* 注释 */}` 放在 `()` 分组内导致二表达式错误 | 注释移到 `)}` 之后；ChatView 拆为独立组件 |

---

*最后更新: 2026-05-25*
