import { HTMLAttributes, forwardRef } from 'react';

interface TabProps extends HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  color?: string;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ className = '', active = false, color = '#58A968', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`h-10 px-5 rounded-full font-zhuque text-xl transition-all ${
          active ? 'scale-105' : 'opacity-70 hover:opacity-100'
        } ${className}`}
        style={{
          backgroundColor: active ? color : 'rgba(255,255,255,0.2)',
        }}
        {...props}
      >
        <span
          className="text-white"
          style={{ color: active ? 'white' : 'rgba(255,255,255,0.5)' }}
        >
          {children}
        </span>
      </button>
    );
  }
);

Tab.displayName = 'Tab';
