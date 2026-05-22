import { type ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  bgColor?: string;
}

export function PageContainer({
  children,
  className = '',
  bgColor
}: PageContainerProps) {
  return (
    <div
      className={`h-screen px-4 md:px-6 lg:px-8 flex flex-col overflow-hidden ${className}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      {children}
    </div>
  );
}
