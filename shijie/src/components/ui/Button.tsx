import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'xp-knowledge' | 'xp-talent';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-zhuque transition-all rounded-full';

    const variants = {
      primary: 'bg-[#58A968] text-white hover:bg-[#4a9458] active:scale-95',
      secondary: 'bg-[#666] text-white hover:bg-[#777] active:scale-95',
      ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/10',
      'xp-knowledge': 'bg-[#2A8CB7]/20 text-[#2A8CB7]',
      'xp-talent': 'bg-[#E6B85C]/20 text-[#E6B85C]',
    };

    const sizes = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-5 py-2 text-base',
      lg: 'px-8 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
