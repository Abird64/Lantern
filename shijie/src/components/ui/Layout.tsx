/**
 * 页面布局组件
 */
import { type ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  padding?: string;
}

/**
 * 主内容居中容器
 */
export function Container({ 
  children, 
  className = '', 
  maxWidth = 'max-w-[1000px]',
  padding = 'px-8'
}: ContainerProps) {
  return (
    <div className={`flex-1 flex flex-col items-center ${padding}`}>
      <div className={`w-full ${maxWidth}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * 区块间隔
 */
export function Section({ className = '' }: { className?: string }) {
  return <div className={`h-6 ${className}`} />;
}

/**
 * 页面容器
 */
export function PageWrapper({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`min-h-screen px-4 md:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
