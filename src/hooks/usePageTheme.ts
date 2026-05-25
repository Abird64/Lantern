import { useThemeStore } from '@/stores/themeStore';
import { themes, type PageTheme } from '@/styles/theme';

/** 从内置 + 自定义主题中查找 */
function findTheme(id: string, customThemes: PageTheme[]): PageTheme | undefined {
  return customThemes.find((t) => t.id === id) ?? themes[id];
}

/**
 * 返回当前页面实际应该使用的主题。
 * - 多彩模式：使用页面自身的主题
 * - 统一模式：使用全局选中的统一主题（优先查自定义，再查内置）
 */
export function usePageTheme(pageId: string): PageTheme {
  const mode = useThemeStore((s) => s.mode);
  const uniformTheme = useThemeStore((s) => s.uniformTheme);
  const customThemes = useThemeStore((s) => s.customThemes);

  if (mode === 'colorful') {
    return findTheme(pageId, customThemes) ?? themes.lantern;
  }
  return findTheme(uniformTheme, customThemes)
    ?? findTheme(pageId, customThemes)
    ?? themes.lantern;
}
