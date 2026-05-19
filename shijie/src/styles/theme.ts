/**
 * 拾阶 - 设计系统主题配置
 * 
 * 本文件统一管理所有页面的设计 Token
 * 包含：颜色、间距、字体、圆角、阴影等
 */

// ========== 页面主题配置 ==========
export interface PageTheme {
  name: string;
  bg: string;
  nav: string;
  accent: string;
  accentLight: string;
  text: string;
  card: string;
}

export const themes: Record<string, PageTheme> = {
  tasks: {
    name: '尘事',
    bg: '#C8C8C0',
    nav: '#2D352F',
    accent: '#58A968',
    accentLight: '#58A96850',
    text: '#FFFFFF',
    card: '#E0F7FA',
  },
  diary: {
    name: '尘笺',
    bg: '#F7F3E9',
    nav: '#2C3532',
    accent: '#E65C5C',
    accentLight: '#E65C5C50',
    text: '#FFFFFF',
    card: '#E6D9B8',
  },
  schedule: {
    name: '时序',
    bg: '#953737',
    nav: '#2A2A2A',
    accent: '#F2C94C',
    accentLight: '#F2C94C50',
    text: '#FFFFFF',
    card: '#F8F5F0',
  },
  relations: {
    name: '相识',
    bg: '#2D3742',
    nav: '#3A4652',
    accent: '#D98B58',
    accentLight: '#D98B5850',
    text: '#F2E9E0',
    card: '#3A4652',
  },
  lantern: {
    name: '心灯',
    bg: '#1B1B1B',
    nav: '#2D3A32',
    accent: '#58A968',
    accentLight: '#58A96850',
    text: '#FFFFFF',
    card: '#2D3A32',
  },
  settings: {
    name: '设置',
    bg: '#1B1B1B',
    nav: '#2D3A32',
    accent: '#58A968',
    accentLight: '#58A96850',
    text: '#FFFFFF',
    card: '#2D3A32',
  },
};

// ========== XP 技能颜色 ==========
export const xpColors = {
  knowledge: '#2A8CB7',
  talent: '#E6B85C',
  physique: '#58A968',
};

// ========== 间距系统 (8px 基准) ==========
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  section: '24px', // 页面区块间隔
  component: '16px', // 组件内间隔
};

// ========== 圆角系统 ==========
export const borderRadius = {
  none: '0',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  '3xl': '50px', // 胶囊/卡片
  full: '9999px', // 圆形/胶囊按钮
};

// ========== 字体系统 ==========
export const typography = {
  fontFamily: {
    zhueque: '"Zhuque Fangsong", "STKaiti", "KaiTi", serif',
    xiaowei: '"Microsoft YaHei", "SimHei", sans-serif',
  },
  sizes: {
    xs: '14px',
    sm: '16px',
    md: '18px',
    lg: '20px',
    xl: '24px',
    '2xl': '28px',
    hero: '32px',
  },
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
  },
};

// ========== 导航栏 ==========
export const navbar = {
  height: '72px',
  padding: {
    x: 'px-4 md:px-6 lg:px-8',
  },
};

// ========== 胶囊标签栏 ==========
export const capsuleTab = {
  padding: {
    x: 'px-6 md:px-8',
    y: 'py-3 md:py-4',
  },
  minWidth: '80px',
  fontSize: 'text-lg',
  borderRadius: 'rounded-full',
  transition: 'transition-all duration-200',
};

// ========== 卡片 ==========
export const card = {
  borderRadius: 'rounded-[50px]',
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  },
};

// ========== 按钮 ==========
export const button = {
  borderRadius: 'rounded-full',
  padding: {
    sm: 'px-3 py-1 text-sm',
    md: 'px-5 py-2 text-base',
    lg: 'px-8 py-3 text-lg',
  },
  transition: 'transition-all duration-200',
};

// ========== 窗口控制按钮 ==========
export const windowControls = {
  colors: [
    { id: 0, color: '#28C840', label: '最小化' },
    { id: 1, color: '#FEBC2E', label: '恢复' },
    { id: 2, color: '#FF5F57', label: '关闭' },
  ],
  size: 'w-8 h-8',
  gap: 'gap-3',
};

// ========== 通用网格背景 ==========
export const gridBackground = {
  dark: `
    linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
  `,
  light: `
    linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)
  `,
  size: '40px 40px',
};

// ========== 布局容器 ==========
export const container = {
  maxWidth: 'max-w-[1000px]',
  padding: {
    x: 'px-8',
  },
};
