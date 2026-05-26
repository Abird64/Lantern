/**
 * MyWorld - 设计系统主题配置
 * 
 * 本文件统一管理所有页面的设计 Token
 * 包含：颜色、间距、字体、圆角、阴影等
 */

// ========== 页面主题配置 ==========
/**
 * 页面主题接口
 *
 * - isDark: 描述内容区域的明暗，控制网格线颜色、overlay 色等。
 *   所有页面的 nav 栏始终为深色（类似 macOS 深色菜单栏），与 isDark 无关。
 */
export interface PageTheme {
  id: string;
  name: string;
  bg: string;
  nav: string;
  accent: string;
  accentLight: string;
  text: string;
  card: string;
  cardText: string;
  isDark: boolean;
  /** 语义色：删除/危险操作 */
  danger: string;
  /** 语义色：警告 */
  warning: string;
  /** 语义色：成功/完成 */
  success: string;
}

export const themes: Record<string, PageTheme> = {
  tasks: {
    id: 'tasks',
    name: '苔痕青',
    bg: '#C8C8C0',
    nav: '#2D352F',
    accent: '#58A968',
    accentLight: '#58A96866',
    text: '#1A1A1A',
    card: '#D4DCD0',
    cardText: '#1A1A1A',
    isDark: false,
    danger: '#E74C3C',
    warning: '#F39C12',
    success: '#58A968',
  },
  diary: {
    id: 'diary',
    name: '桂花纸',
    bg: '#F7F3E9',
    nav: '#3D3530',
    accent: '#E65C5C',
    accentLight: '#E65C5C66',
    text: '#1A1A1A',
    card: '#E6D9B8',
    cardText: '#1A1A1A',
    isDark: false,
    danger: '#E74C3C',
    warning: '#F39C12',
    success: '#27AE60',
  },
  schedule: {
    id: 'schedule',
    name: '墙角梅',
    bg: '#7A3A3A',
    nav: '#3A2020',
    accent: '#F2C94C',
    accentLight: '#F2C94C50',
    text: '#FFFFFF',
    card: '#F8F5F0',
    cardText: '#1A1A1A',
    isDark: true,
    danger: '#FF5F57',
    warning: '#F2C94C',
    success: '#28C840',
  },
  relations: {
    id: 'relations',
    name: '西窗烛',
    bg: '#2D3742',
    nav: '#3A4652',
    accent: '#D98B58',
    accentLight: '#D98B5850',
    text: '#F2E9E0',
    card: '#3A4652',
    cardText: '#F2E9E0',
    isDark: true,
    danger: '#FF5F57',
    warning: '#F39C12',
    success: '#28C840',
  },
  lantern: {
    id: 'lantern',
    name: '江船夜',
    bg: '#1B1B1B',
    nav: '#2D3A32',
    accent: '#4CAF7A',
    accentLight: '#4CAF7A50',
    text: '#EBEBE6',
    card: '#2D3A32',
    cardText: '#EBEBE6',
    isDark: true,
    danger: '#FF5F57',
    warning: '#F2C94C',
    success: '#4CAF7A',
  },
  settings: {
    id: 'settings',
    name: '设置',
    bg: '#1B1A1B',
    nav: '#2D3A32',
    accent: '#58A968',
    accentLight: '#58A96850',
    text: '#E8E0D0',
    card: '#252525',
    cardText: '#E8E0D0',
    isDark: true,
    danger: '#FF5F57',
    warning: '#F2C94C',
    success: '#58A968',
  },
  skills: {
    id: 'skills',
    name: '修行紫',
    bg: '#1B1B2F',
    nav: '#2A2A3E',
    accent: '#9B7DB8',
    accentLight: '#9B7DB850',
    text: '#E8E0D0',
    card: '#252540',
    cardText: '#E8E0D0',
    isDark: true,
    danger: '#FF5F57',
    warning: '#F2C94C',
    success: '#27AE60',
  },
  memories: {
    id: 'memories',
    name: '宣纸黄',
    bg: '#F5F0E8',
    nav: '#3D3530',
    accent: '#B8860B',
    accentLight: '#B8860B50',
    text: '#2D2D2D',
    card: '#FDF8F0',
    cardText: '#2D2D2D',
    isDark: false,
    danger: '#E74C3C',
    warning: '#F39C12',
    success: '#27AE60',
  },
};

/** 可供统一模式选择的主题（排除设置页自身配色） */
export const selectableThemes: PageTheme[] = [
  themes.lantern,
  themes.tasks,
  themes.schedule,
  themes.diary,
  themes.relations,
  themes.skills,
];

// ========== 主题辅助函数 ==========

/** 返回叠加在主题背景上的半透明颜色（暗色主题返回白色，浅色主题返回黑色） */
export function overlay(theme: PageTheme, opacity: number): string {
  const o = Math.round(opacity * 100) / 100;
  return theme.isDark
    ? `rgba(255,255,255,${o})`
    : `rgba(0,0,0,${o})`;
}

/** 返回网格背景线颜色 */
export function gridColor(theme: PageTheme, opacity = 0.08): string {
  return overlay(theme, opacity);
}

// ========== 六维属性颜色 ==========
export interface SkillColorInfo {
  hex: string;
  name: string;
}

export const SKILL_COLORS: Record<string, SkillColorInfo> = {
  knowledge:    { hex: '#3A8FB7', name: '学识' },
  physique:     { hex: '#4B7F52', name: '筋骨' },
  charm:        { hex: '#C83C3C', name: '风华' },
  talent:       { hex: '#E8B959', name: '才情' },
  worldliness:  { hex: '#B87353', name: '入世' },
  cultivation:  { hex: '#8A6DA7', name: '修为' },
};

/** 按固定顺序排列的技能ID */
export const SKILL_ORDER = ['knowledge', 'physique', 'charm', 'talent', 'worldliness', 'cultivation'];

// 兼容旧名
export const xpColors = {
  knowledge: SKILL_COLORS.knowledge.hex,
  talent: SKILL_COLORS.talent.hex,
  physique: SKILL_COLORS.physique.hex,
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
    x: 'px-4 md:px-5',
    y: 'py-1.5 md:py-2',
  },
  minWidth: '60px',
  fontSize: 'text-sm',
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
