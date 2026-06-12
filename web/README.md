# 提灯 Web 版

一个基于原生 HTML/CSS/JavaScript 的人生管理系统，数据存储在浏览器 localStorage 中。

## 功能模块

| 模块 | 功能 |
|---|---|
| **看板** | 今日概览、任务/日记/习惯摘要卡片 |
| **任务** | 创建/完成/删除任务、按状态筛选 |
| **日记** | 按日期写日记、查看历史、字数统计 |
| **习惯** | 创建习惯、每日打卡、连续天数、本周矩阵 |
| **我的** | 昵称设置、深色/浅色主题切换、数据导出/清除 |

## 技术栈

- **HTML5** — 语义化标签
- **CSS3** — CSS 变量、Grid/Flexbox 布局、动画
- **原生 JavaScript** — ES6+ 模块化、DOM 操作
- **localStorage** — 数据持久化

## 设计系统

采用"夜萤"设计语言：
- 深色主题为默认，支持亮色切换
- 萤火绿（#4CAF76）为主色调
- 18px 圆角卡片、pill 形按钮
- Apple 风格系统字体栈
- 8px 间距网格

## 使用方式

1. 直接用浏览器打开 `index.html` 即可运行
2. 无需安装任何依赖，无需构建工具
3. 数据自动保存在浏览器 localStorage 中

## 文件结构

```
web/
├── index.html          # 主页面
├── css/
│   ├── variables.css   # CSS 变量（颜色、字体、间距）
│   ├── base.css        # 基础样式 reset + 全局
│   ├── components.css  # 通用组件样式
│   └── pages.css       # 页面特定样式
├── js/
│   ├── app.js          # 应用入口、路由
│   ├── store.js        # localStorage 数据层
│   ├── utils.js        # 工具函数
│   ├── components.js   # UI 组件渲染
│   ├── dashboard.js    # 看板页面
│   ├── tasks.js        # 任务页面
│   ├── diary.js        # 日记页面
│   ├── habits.js       # 习惯页面
│   └── mine.js         # 我的页面
└── README.md
```

## 响应式设计

- 移动端优先，自适应桌面端
- 支持安全区域（刘海屏/底部横条）
- 触摸友好的 44px 最小点击区域
