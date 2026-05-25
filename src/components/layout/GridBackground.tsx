/**
 * 网格背景叠加层
 * 根据 isDark 自动选择白线/黑线，lineOpacity 控制线的不透明度
 */
interface GridBackgroundProps {
  isDark: boolean;
  lineOpacity?: number; // 默认 0.08
}

export function GridBackground({ isDark, lineOpacity = 0.08 }: GridBackgroundProps) {
  const c = isDark ? `rgba(255,255,255,${lineOpacity})` : `rgba(0,0,0,${lineOpacity})`;
  return (
    <div
      className="absolute inset-0 opacity-10 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(${c} 1px, transparent 1px),
          linear-gradient(90deg, ${c} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  );
}
