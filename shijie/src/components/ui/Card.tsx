import { forwardRef, type HTMLAttributes } from 'react';
import { card } from '@/styles/theme';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'task' | 'diary' | 'relation' | 'list';
  size?: 'sm' | 'md' | 'lg';
  padding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', size = 'md', padding = true, children, ...props }, ref) => {
    const paddingClass = padding 
      ? size === 'sm' ? card.padding.sm 
        : size === 'lg' ? card.padding.lg 
        : card.padding.md 
      : '';

    const variants = {
      default: 'bg-white/10 rounded-[50px]',
      task: 'bg-[#D4DCD0] shadow-lg rounded-[50px]',
      diary: 'rounded-2xl p-10',
      relation: 'bg-[#3A4652] rounded-[50px]',
      list: 'bg-[#3A4652] rounded-[40px]',
    };

    return (
      <div
        ref={ref}
        className={`transition-all ${paddingClass} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
