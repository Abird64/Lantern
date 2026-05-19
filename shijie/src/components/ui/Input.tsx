/**
 * 通用输入框组件
 */
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'filled' | 'underline';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const baseStyles = 'w-full px-4 py-3 font-zhuque text-lg transition-all focus:outline-none';
    
    const variants = {
      default: 'bg-white/60 backdrop-blur-sm rounded-full text-black placeholder:text-black/30 border border-transparent focus:border-[#58A968]',
      filled: 'bg-[#E6D9B8] rounded-full text-black placeholder:text-black/30',
      underline: 'bg-transparent rounded-none border-b-2 border-[#58A968]/30 text-black placeholder:text-black/30 focus:border-[#58A968]',
    };

    return (
      <input
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

// ========== 文本域 ==========
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'filled' | 'plain';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const baseStyles = 'w-full font-zhuque text-xl text-black/80 placeholder:text-black/30 focus:outline-none resize-none';
    
    const variants = {
      default: 'bg-white/60 backdrop-blur-sm rounded-[28px] p-6',
      filled: 'bg-[#E6D9B8] rounded-2xl p-6',
      plain: 'bg-transparent p-4',
    };

    return (
      <textarea
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
